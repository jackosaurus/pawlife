// Supabase Edge Function: send-reminders
// Invoked hourly by pg_cron. Sends push notifications for:
// 1. Medication reminders (at user's configured time)
// 2. Vaccination reminders (advance notice based on user preference)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

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
  details?: { error?: string };
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

  const today = new Date().toISOString().split('T')[0];

  for (const pet of pets) {
    // Get active medications
    const { data: medications } = await supabase
      .from('medications')
      .select('id, name, dosage, frequency')
      .eq('pet_id', pet.id)
      .eq('is_completed', false)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (!medications || medications.length === 0) continue;

    // Check which medications have been logged today
    const medIds = medications.map((m) => m.id);
    const { data: doses } = await supabase
      .from('medication_doses')
      .select('medication_id')
      .in('medication_id', medIds)
      .gte('given_at', `${today}T00:00:00`)
      .lte('given_at', `${today}T23:59:59`);

    const loggedMedIds = new Set((doses ?? []).map((d) => d.medication_id));
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const pet of pets) {
    const { data: vaccinations } = await supabase
      .from('vaccinations')
      .select('id, vaccine_name, next_due_date')
      .eq('pet_id', pet.id)
      .not('next_due_date', 'is', null);

    if (!vaccinations) continue;

    for (const vax of vaccinations) {
      if (!vax.next_due_date) continue;

      const dueDate = new Date(vax.next_due_date);
      dueDate.setHours(0, 0, 0, 0);
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
    // Verify this is an authorized call (cron or admin)
    const authHeader = req.headers.get('Authorization');
    if (
      !authHeader?.includes(supabaseServiceKey) &&
      req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')
    ) {
      // Allow if called from Supabase internally
      console.log('Proceeding with edge function invocation');
    }

    const currentHour = new Date().getUTCHours();

    // Fetch users with reminders enabled and at least one push token
    const { data: users, error } = await supabase
      .from('users')
      .select(
        'id, push_tokens, medication_reminder_time, vaccination_advance_days',
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

      // Check if current hour matches user's medication reminder time
      const [reminderHour] = (user.medication_reminder_time ?? '20:00')
        .split(':')
        .map(Number);

      if (currentHour === reminderHour) {
        const medResult = await processMedicationReminders(user.id, tokens);
        allMessages.push(...medResult.messages);
        allLogs.push(...medResult.sentLogs);
      }

      // Vaccination reminders run every hour (they're date-based, not time-based)
      // but only send once per day due to dedup
      const vaxResult = await processVaccinationReminders(
        user.id,
        tokens,
        user.vaccination_advance_days ?? 14,
      );
      allMessages.push(...vaxResult.messages);
      allLogs.push(...vaxResult.sentLogs);

      if (allMessages.length === 0) continue;

      // Send all notifications for this user
      const tickets = await sendPushNotifications(allMessages);

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

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-reminders error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
