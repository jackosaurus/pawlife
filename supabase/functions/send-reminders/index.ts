// Supabase Edge Function: send-reminders
// Invoked hourly by pg_cron. Sends push notifications for:
// 1. Medication reminders (at user's configured time)
// 2. Vaccination reminders (advance notice based on user preference)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// ── Observability: raw fetch to PostHog /capture/ + healthchecks.io ────
// Reviewer amendment §1: do NOT use npm:posthog-node here. Deno kills
// setTimeout-pending tasks when the response returns; posthog-node's
// `shutdown()` resolves before the network request actually leaves the
// runtime. A raw fetch call is ~30 LOC, fully await-able, and zero ambiguity.

const POSTHOG_API_KEY = Deno.env.get('POSTHOG_API_KEY');
const POSTHOG_HOST = Deno.env.get('POSTHOG_HOST') ?? 'https://eu.i.posthog.com';
const HEALTHCHECK_URL = Deno.env.get('HEALTHCHECK_URL');
const OBSERVABILITY_ENV = Deno.env.get('OBSERVABILITY_ENV') ?? 'production';

async function capturePostHogException(err: unknown): Promise<void> {
  if (!POSTHOG_API_KEY) return; // gate: no key → no-op
  const error = err instanceof Error ? err : new Error(String(err));
  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event: '$exception',
        // Service-level events go under a stable distinct_id so they're
        // attributable to the function, not bucketed under a random anon.
        distinct_id: 'edge-function:send-reminders',
        properties: {
          $exception_message: error.message,
          $exception_type: error.name,
          $exception_stack_trace_raw: error.stack ?? '',
          env: OBSERVABILITY_ENV,
          source: 'send-reminders',
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // PostHog itself is down? Don't recurse — just swallow.
  }
}

async function pingHealthcheck(success: boolean): Promise<void> {
  if (!HEALTHCHECK_URL) return;
  const url = success ? HEALTHCHECK_URL : `${HEALTHCHECK_URL}/fail`;
  try {
    await fetch(url, { method: 'GET' });
  } catch {
    // Best-effort. A missed heartbeat eventually flags via hc-ping.com's
    // grace-period alert, which is fine.
  }
}

interface PushTokenEntry {
  token: string;
  platform: 'ios' | 'android';
  updated_at: string;
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
}

interface PushTicket {
  status: 'ok' | 'error';
  // Expo's push API returns an `id` on tickets that succeeded the send
  // phase — this is the "ticket ID" we persist in notification_tickets
  // so a future receipt-poller can call GetReceipts. Absent on errors.
  id?: string;
  details?: { error?: string };
}

// ── Auth: inspect the role claim inside the bearer JWT ──────────
function isServiceRoleBearer(authHeader: string | null): boolean {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    // base64url → base64, then pad to multiple of 4
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

// ── User-local time helpers (IANA timezone aware) ───────────────
// Intl.DateTimeFormat handles DST automatically, which a fixed offset cannot.
function getUserLocalHour(timezone: string): number {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  }).format(new Date());
  // en-US with hour12=false can emit "24" at midnight; normalize.
  return Number(hourStr) % 24;
}

function getUserLocalDateISO(timezone: string, when: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which matches Postgres DATE output.
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).format(when);
}

// ── Send batch of push notifications via Expo Push API ──────────
async function sendPushNotifications(
  messages: PushMessage[],
): Promise<PushTicket[]> {
  if (messages.length === 0) return [];

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  return result.data ?? [];
}

// ── Remove stale tokens from a user's push_tokens ───────────────
async function removeStaleTokens(
  userId: string,
  staleTokens: string[],
): Promise<void> {
  if (staleTokens.length === 0) return;

  const { data } = await supabase
    .from('users')
    .select('push_tokens')
    .eq('id', userId)
    .single();

  if (!data) return;

  const existing = (data.push_tokens ?? []) as PushTokenEntry[];
  const filtered = existing.filter((t) => !staleTokens.includes(t.token));

  await supabase
    .from('users')
    .update({ push_tokens: filtered })
    .eq('id', userId);
}

// ── Check if notification was already sent (dedup) ──────────────
async function wasAlreadySent(
  userId: string,
  notificationType: string,
  referenceId: string,
  reminderKey: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .eq('reference_id', referenceId)
    .eq('reminder_key', reminderKey)
    .maybeSingle();

  return !!data;
}

// ── Log a sent notification ─────────────────────────────────────
async function logNotification(
  userId: string,
  notificationType: string,
  referenceId: string,
  reminderKey: string,
): Promise<void> {
  await supabase.from('notification_log').upsert(
    {
      user_id: userId,
      notification_type: notificationType,
      reference_id: referenceId,
      reminder_key: reminderKey,
    },
    { onConflict: 'user_id,notification_type,reference_id,reminder_key' },
  );
}

// ── Process medication reminders ────────────────────────────────
async function processMedicationReminders(
  userId: string,
  tokens: PushTokenEntry[],
  today: string,
  timezone: string,
): Promise<{ messages: PushMessage[]; sentLogs: Array<{ type: string; refId: string; key: string }> }> {
  const messages: PushMessage[] = [];
  const sentLogs: Array<{ type: string; refId: string; key: string }> = [];

  // Get all active medications for pets in this user's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .single();

  if (!familyMember) return { messages, sentLogs };

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name')
    .eq('family_id', familyMember.family_id)
    .eq('is_archived', false);

  if (!pets || pets.length === 0) return { messages, sentLogs };

  for (const pet of pets) {
    // Get active medications
    const { data: medications } = await supabase
      .from('medications')
      .select('id, name, dosage, frequency')
      .eq('pet_id', pet.id)
      .eq('is_archived', false)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (!medications || medications.length === 0) continue;

    // Check which medications have been logged today (user's local day).
    // `given_at` is a UTC timestamptz; filter by a generous UTC window
    // (last 36h) then bucket by the user's local date to get true "today".
    // Naive `${today}T00:00:00` comparisons would misclassify doses near
    // midnight in zones far from UTC.
    const medIds = medications.map((m) => m.id);
    const sinceUtc = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
    const { data: doses } = await supabase
      .from('medication_doses')
      .select('medication_id, given_at')
      .in('medication_id', medIds)
      .gte('given_at', sinceUtc);

    const loggedMedIds = new Set(
      (doses ?? [])
        .filter((d) => getUserLocalDateISO(timezone, new Date(d.given_at)) === today)
        .map((d) => d.medication_id),
    );
    const unloggedMeds = medications.filter((m) => !loggedMedIds.has(m.id));

    if (unloggedMeds.length === 0) continue;

    // Create a single batched notification per pet
    const reminderKey = `med_daily_${today}`;
    const alreadySent = await wasAlreadySent(
      userId,
      'medication',
      pet.id,
      reminderKey,
    );
    if (alreadySent) continue;

    const medNames = unloggedMeds.map((m) => m.name).join(', ');
    const body =
      unloggedMeds.length === 1
        ? `${pet.name} needs ${medNames}`
        : `${pet.name} has ${unloggedMeds.length} medications to log: ${medNames}`;

    for (const t of tokens) {
      messages.push({
        to: t.token,
        title: 'Medication Reminder',
        body,
        data: { type: 'medication', petId: pet.id },
        channelId: 'reminders',
      });
    }

    sentLogs.push({ type: 'medication', refId: pet.id, key: reminderKey });
  }

  return { messages, sentLogs };
}

// ── Process vaccination reminders ───────────────────────────────
async function processVaccinationReminders(
  userId: string,
  tokens: PushTokenEntry[],
  advanceDays: number,
  todayISO: string,
): Promise<{ messages: PushMessage[]; sentLogs: Array<{ type: string; refId: string; key: string }> }> {
  const messages: PushMessage[] = [];
  const sentLogs: Array<{ type: string; refId: string; key: string }> = [];

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .single();

  if (!familyMember) return { messages, sentLogs };

  const { data: pets } = await supabase
    .from('pets')
    .select('id, name')
    .eq('family_id', familyMember.family_id)
    .eq('is_archived', false);

  if (!pets || pets.length === 0) return { messages, sentLogs };

  // Parse user-local midnight. Constructing via components avoids the
  // local-tz-of-the-Deno-runtime trap of `new Date(todayISO)`.
  const [y, m, d] = todayISO.split('-').map(Number);
  const today = new Date(Date.UTC(y, m - 1, d));

  for (const pet of pets) {
    const { data: vaccinations } = await supabase
      .from('vaccinations')
      .select('id, vaccine_name, next_due_date')
      .eq('pet_id', pet.id)
      .not('next_due_date', 'is', null);

    if (!vaccinations) continue;

    for (const vax of vaccinations) {
      if (!vax.next_due_date) continue;

      const [dy, dm, dd] = vax.next_due_date.split('-').map(Number);
      const dueDate = new Date(Date.UTC(dy, dm - 1, dd));
      const diffDays = Math.round(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Determine reminder key based on how close the due date is
      let reminderKey: string | null = null;
      let body: string | null = null;

      if (diffDays === advanceDays) {
        reminderKey = `vax_advance_${advanceDays}d`;
        body = `${pet.name}'s ${vax.vaccine_name} vaccination is due in ${advanceDays} days`;
      } else if (diffDays === 3) {
        reminderKey = 'vax_3d';
        body = `${pet.name}'s ${vax.vaccine_name} vaccination is due in 3 days`;
      } else if (diffDays === 0) {
        reminderKey = 'vax_due_today';
        body = `${pet.name}'s ${vax.vaccine_name} vaccination is due today`;
      } else if (diffDays === -7) {
        reminderKey = 'vax_overdue_7d';
        body = `${pet.name}'s ${vax.vaccine_name} vaccination is 1 week overdue`;
      } else if (diffDays === -30) {
        reminderKey = 'vax_overdue_30d';
        body = `${pet.name}'s ${vax.vaccine_name} vaccination is 1 month overdue — final reminder`;
      }

      if (!reminderKey || !body) continue;

      const alreadySent = await wasAlreadySent(
        userId,
        'vaccination',
        vax.id,
        reminderKey,
      );
      if (alreadySent) continue;

      for (const t of tokens) {
        messages.push({
          to: t.token,
          title: 'Vaccination Reminder',
          body,
          data: { type: 'vaccination', petId: pet.id, vaccinationId: vax.id },
          channelId: 'reminders',
        });
      }

      sentLogs.push({ type: 'vaccination', refId: vax.id, key: reminderKey });
    }
  }

  return { messages, sentLogs };
}

// ── Main handler ────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    // Require a project-signed JWT with role=service_role. The Supabase
    // gateway has already verified the signature before we see the request;
    // here we only inspect the payload's role claim. Checking the claim
    // rather than doing a byte-exact string match against our own env var
    // is robust against JWT-signing-key rotations (where the dashboard's
    // visible key and the runtime's injected SUPABASE_SERVICE_ROLE_KEY
    // can temporarily diverge).
    if (!isServiceRoleBearer(req.headers.get('Authorization'))) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fetch users with reminders enabled and at least one push token
    const { data: users, error } = await supabase
      .from('users')
      .select(
        'id, push_tokens, medication_reminder_time, vaccination_advance_days, timezone',
      )
      .eq('reminders_enabled', true)
      .neq('push_tokens', '[]');

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalSent = 0;

    for (const user of users) {
      const tokens = (user.push_tokens ?? []) as PushTokenEntry[];
      if (tokens.length === 0) continue;

      const allMessages: PushMessage[] = [];
      const allLogs: Array<{ type: string; refId: string; key: string }> = [];

      const timezone = user.timezone ?? 'UTC';
      const userLocalHour = getUserLocalHour(timezone);
      const userLocalToday = getUserLocalDateISO(timezone);

      // Check if current hour (in the user's timezone) matches their reminder hour
      const [reminderHour] = (user.medication_reminder_time ?? '20:00')
        .split(':')
        .map(Number);

      if (userLocalHour === reminderHour) {
        const medResult = await processMedicationReminders(
          user.id,
          tokens,
          userLocalToday,
          timezone,
        );
        allMessages.push(...medResult.messages);
        allLogs.push(...medResult.sentLogs);
      }

      // Vaccination reminders run every hour (they're date-based, not time-based)
      // but only send once per day due to dedup
      const vaxResult = await processVaccinationReminders(
        user.id,
        tokens,
        user.vaccination_advance_days ?? 14,
        userLocalToday,
      );
      allMessages.push(...vaxResult.messages);
      allLogs.push(...vaxResult.sentLogs);

      if (allMessages.length === 0) continue;

      // Send all notifications for this user
      const tickets = await sendPushNotifications(allMessages);

      // Persist ticket IDs for the future receipt-poller (migration 014).
      // Best-effort: if the insert fails, log but do not interrupt the
      // send loop. Tickets are diagnostic data; missing rows are
      // acceptable.
      const ticketRows = tickets
        .map((ticket, i) => {
          const message = allMessages[i];
          const refId =
            (message.data?.vaccinationId as string | undefined) ??
            (message.data?.petId as string | undefined) ??
            null;
          if (!refId) return null;
          return {
            user_id: user.id,
            ticket_id: ticket.id ?? null,
            push_token: message.to,
            notification_type: message.data?.type as
              | 'medication'
              | 'vaccination',
            reference_id: refId,
            status: ticket.status,
            error_code: ticket.details?.error ?? null,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      if (ticketRows.length > 0) {
        const { error: ticketErr } = await supabase
          .from('notification_tickets')
          .insert(ticketRows);
        if (ticketErr) {
          console.error(
            'notification_tickets insert failed:',
            ticketErr.message,
          );
        }
      }

      // Handle stale tokens
      const staleTokens: string[] = [];
      tickets.forEach((ticket, i) => {
        if (
          ticket.status === 'error' &&
          ticket.details?.error === 'DeviceNotRegistered'
        ) {
          staleTokens.push(allMessages[i].to);
        }
      });

      if (staleTokens.length > 0) {
        await removeStaleTokens(user.id, [...new Set(staleTokens)]);
      }

      // Log successful sends
      for (const log of allLogs) {
        await logNotification(user.id, log.type, log.refId, log.key);
      }

      totalSent += allMessages.length - staleTokens.length;
    }

    // Successful run — heartbeat to healthchecks.io. PostHog can't tell us
    // "the cron stopped firing entirely" because it only sees what we emit;
    // hc-ping.com fills that gap.
    await pingHealthcheck(true);

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-reminders error:', err);
    // Capture in PostHog (raw fetch — awaited so the request leaves the
    // runtime before we return) and ping the failure URL so hc-ping flips
    // the check to "down" within its grace window.
    await capturePostHogException(err);
    await pingHealthcheck(false);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
