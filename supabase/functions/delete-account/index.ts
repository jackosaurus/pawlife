// Supabase Edge Function: delete-account
//
// Hard-deletes a user's account on demand:
//   1. Authenticates the caller via JWT (no body parameters — reviewer
//      amendment §4.1, the JWT alone is the source of truth).
//   2. Rate-limits at 5 attempts / 24 hours per user.
//   3. Purges storage objects in pet-photos/ and vet-attachments/ under
//      the user's folder. Storage failures are logged but do NOT abort
//      the account delete (reviewer amendment §4.5: an orphan auth row
//      with no public.users row is far worse than orphan storage files,
//      which a sweeper job can clean up later).
//   4. Clears the free-text PII column on `feedback` (the FK on
//      `feedback.user_id` was already SET NULL in migration 008, so we
//      only need to scrub `user_email`).
//   5. Clears push_tokens defensively before the cascade so the hourly
//      send-reminders cron can't fire at a soon-to-be-dead user.
//   6. Calls `supabase.auth.admin.deleteUser` — the cascade governed by
//      migration 013 takes it from there.
//   7. Records the attempt (success or failure) for audit + rate-limit.
//
// Idempotent: if the auth user is already gone, treat as success.
//
// Deploy ordering: migration 013 MUST be applied before this function is
// deployed. Without 013, the cascade hits NO ACTION constraints and
// leaves the account in a half-deleted state.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const RATE_LIMIT_PER_DAY = 5;
const RATE_LIMIT_WINDOW_HOURS = 24;
const STORAGE_BATCH_SIZE = 100;
const STORAGE_LIST_PAGE = 1000;
// Defensive cap on the recursive folder walk. A v1 user with 50 photos
// won't come close. If we ever blow past this, something is wrong with
// the storage list response shape and we'd rather throw than spin.
const STORAGE_WALK_MAX_ITERATIONS = 1000;

// Service-role client: bypasses RLS, used for storage cleanup, table
// updates, and admin.deleteUser.
const admin = createClient(supabaseUrl, serviceKey);

interface StorageItem {
  name: string;
  id: string | null;
}

async function purgeBucketFolder(
  bucket: string,
  prefix: string,
): Promise<{ deleted: number; errors: string[] }> {
  const stack: string[] = [prefix];
  const allPaths: string[] = [];
  const errors: string[] = [];
  let iterations = 0;

  // Recursive list: supabase-js storage.list is non-recursive and treats
  // folder entries as items with `id === null`, so we walk the tree
  // explicitly.
  while (stack.length > 0) {
    if (++iterations > STORAGE_WALK_MAX_ITERATIONS) {
      throw new Error(
        `Storage walk exceeded ${STORAGE_WALK_MAX_ITERATIONS} iterations (bucket=${bucket}, prefix=${prefix})`,
      );
    }

    const path = stack.pop()!;
    const { data, error } = await admin.storage.from(bucket).list(path, {
      limit: STORAGE_LIST_PAGE,
    });

    if (error) {
      errors.push(`list(${bucket}/${path}): ${error.message}`);
      continue;
    }

    for (const item of (data ?? []) as StorageItem[]) {
      // Skip Supabase's empty-folder placeholder entry (returned in some
      // bucket configurations).
      if (item.name === '.emptyFolderPlaceholder') continue;

      const itemPath = `${path}${item.name}`;
      // A folder entry has id === null in supabase-js's storage list.
      if (item.id === null) {
        stack.push(`${itemPath}/`);
      } else {
        allPaths.push(itemPath);
      }
    }
  }

  // Batch remove in chunks. Storage caps batch size; 100 is conservative.
  for (let i = 0; i < allPaths.length; i += STORAGE_BATCH_SIZE) {
    const batch = allPaths.slice(i, i + STORAGE_BATCH_SIZE);
    const { error } = await admin.storage.from(bucket).remove(batch);
    if (error) {
      errors.push(`remove(${bucket}, batch starting ${i}): ${error.message}`);
    }
  }

  return { deleted: allPaths.length, errors };
}

async function logAttempt(
  userId: string,
  succeeded: boolean,
): Promise<void> {
  // Best-effort: never fail the request because of an audit-row insert.
  try {
    await admin
      .from('account_deletion_attempts')
      .insert({ user_id: userId, succeeded });
  } catch {
    // swallow — the deletion itself is what matters
  }
}

async function countRecentAttempts(userId: string): Promise<number> {
  const since = new Date(
    Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const { count, error } = await admin
    .from('account_deletion_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('attempted_at', since);
  if (error) {
    // If we can't count, fail open (allow the attempt). Rate-limit is a
    // soft control; correctness of deletion matters more.
    console.error('Rate limit count failed:', error.message);
    return 0;
  }
  return count ?? 0;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // 1. Verify JWT and resolve the calling user. Per reviewer amendment
  //    §4.1, the JWT is the only source of identity — we do not accept
  //    a userId in the body.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const userId = userData.user.id;

  // 2. Rate-limit check. Inline count against the table — no RPC needed.
  const recentAttempts = await countRecentAttempts(userId);
  if (recentAttempts >= RATE_LIMIT_PER_DAY) {
    await logAttempt(userId, false);
    return jsonResponse(
      {
        error: 'Too many deletion attempts. Try again tomorrow.',
      },
      429,
    );
  }

  try {
    // 3. Storage cleanup. Errors here are logged but do not abort the
    //    deletion: an orphan storage file is recoverable; an orphan
    //    auth.users row with no public.users row is not (reviewer §4.5).
    const photoResult = await purgeBucketFolder(
      'pet-photos',
      `${userId}/`,
    ).catch((err: unknown) => ({
      deleted: 0,
      errors: [(err as Error).message],
    }));
    const vetResult = await purgeBucketFolder(
      'vet-attachments',
      `${userId}/`,
    ).catch((err: unknown) => ({
      deleted: 0,
      errors: [(err as Error).message],
    }));

    if (photoResult.errors.length > 0) {
      console.error('pet-photos cleanup errors:', photoResult.errors);
    }
    if (vetResult.errors.length > 0) {
      console.error('vet-attachments cleanup errors:', vetResult.errors);
    }

    // 4. Clear free-text PII on feedback rows. The FK on user_id is
    //    already SET NULL (migration 008), so this UPDATE only needs to
    //    blank user_email — the cascade will handle the user_id
    //    nullification when auth.users is deleted.
    const { error: feedbackErr } = await admin
      .from('feedback')
      .update({ user_email: null })
      .eq('user_id', userId);
    if (feedbackErr) {
      // Log but don't abort. Worst case, an email survives in feedback
      // tied to a NULL user_id — mildly bad, not catastrophic.
      console.error('feedback PII scrub failed:', feedbackErr.message);
    }

    // 5. Clear push_tokens before deleting auth user. There is a brief
    //    window between this update and the cascade where the public.users
    //    row still exists; clearing tokens keeps the hourly cron from
    //    firing at a soon-to-be-dead account.
    const { error: tokensErr } = await admin
      .from('users')
      .update({ push_tokens: [] })
      .eq('id', userId);
    if (tokensErr) {
      console.error('push_tokens clear failed:', tokensErr.message);
    }

    // 6. Hard delete the auth user. This triggers the cascade chain
    //    governed by migration 013.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);

    // Idempotency: if the user is already gone (e.g. a retry after a
    // partial success), treat as success. Supabase gotrue exposes a
    // status field on AuthError; fall back to a regex on the message
    // for older SDK versions. (FIXME: replace with a stable error code
    // when the SDK exposes one.)
    const errStatus = (delErr as { status?: number } | null)?.status;
    const userNotFound =
      errStatus === 404 ||
      (delErr && /User not found/i.test(delErr.message));

    if (delErr && !userNotFound) {
      throw delErr;
    }

    await logAttempt(userId, true);
    return jsonResponse({ success: true });
  } catch (err) {
    console.error('delete-account error:', err);
    await logAttempt(userId, false);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
