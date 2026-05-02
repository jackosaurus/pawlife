# Bemy v1 — Account Deletion Implementation Plan

Owner: planning agent
Reviewers: senior DB engineer (migrations 013 + 014), then second senior engineer (post-migration code review). Per CLAUDE.md rules 6 + 7, both reviews are required before this work is considered done.

Scope of this thread: ship migration 013 (FK cleanup + rate-limit table), migration 014 (`notification_tickets` + send-reminders write-through), and the in-app account-deletion flow (Edge Function, Settings entry, service wrapper, tests). Privacy disclosure checkbox is being built in a parallel thread and is out of scope here.

---

## 1. Architecture diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Settings screen (app/(main)/settings/index.tsx)                         │
│    └─ "Delete Account" row (destructive, bottom of screen)               │
│        └─ tap → ConfirmationModal severity="irreversible"                │
│                  typedConfirmationWord="DELETE"                          │
│                  body = dynamic (sole-admin warning if applicable)       │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ user types DELETE → Confirm
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  authService.deleteAccount()  (services/authService.ts)                  │
│    invokes Edge Function with the user's JWT in Authorization header     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ POST /functions/v1/delete-account
                                     │ body: { userId }
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Edge Function: delete-account                                           │
│   1. Verify JWT, assert sub === body.userId                              │
│   2. Rate-limit check (account_deletion_attempts ≤ 5/day)                │
│   3. List + remove storage objects (pet-photos/, vet-attachments/)       │
│   4. Anonymize feedback rows (user_id NULL, user_email NULL)             │
│   5. Clear push_tokens (defense-in-depth — auth.users CASCADE will       │
│      drop the public.users row anyway, but we want zero notifications    │
│      between this call and the cascade)                                  │
│   6. supabase.auth.admin.deleteUser(userId)                              │
│   7. Insert audit row in account_deletion_attempts (success | failure)   │
│   8. Return 200                                                          │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ DB cascade (governed by migration 013)
                                     ▼
   auth.users row deleted
        ↓ ON DELETE CASCADE
   public.users row deleted
        ↓ ON DELETE CASCADE
   pets, families (where created_by points), family_members,
   medications, vaccinations, weight_entries, food_entries,
   notification_log, vet_visits, attachments, doses → all gone
        ↓ ON DELETE SET NULL (audit columns on family-shared records)
   created_by / modified_by columns nulled on rows owned by other family
   members → those rows survive

   (Client-side, after Edge Function returns):
   authService.signOut() → router.replace('/(auth)/welcome') → toast
```

---

## 2. FK audit — every reference to auth.users / public.users

The grep across `supabase/migrations/001-012`. Format: `file:line — current ON DELETE rule → proposed rule (rationale)`.

### Already correct (no change needed)

| File:line | FK | Current | Why it's fine |
|---|---|---|---|
| `001:10` | `public.users.id → auth.users(id)` | CASCADE | Root of the cascade. |
| `001:33` | `pets.user_id → public.users(id)` | CASCADE | Column dropped in 003. Dead. |
| `001:53` | `vet_visits.pet_id → pets(id)` | CASCADE | Per-pet, not per-user. |
| `001:67` | `vet_visit_attachments.vet_visit_id` | CASCADE | Per-pet chain. |
| `001:79` | `vaccinations.pet_id` | CASCADE | Per-pet chain. |
| `001:93` | `medications.pet_id` | CASCADE | Per-pet chain. |
| `001:111` | `weight_entries.pet_id` | CASCADE | Per-pet chain. |
| `001:123` | `food_entries.pet_id` | CASCADE | Per-pet chain. |
| `002:3` | `medication_doses.medication_id` | CASCADE | Per-med chain. |
| `003:23` | `family_members.family_id → families(id)` | CASCADE | Per-family. |
| `003:24` | `family_members.user_id → public.users(id)` | CASCADE | When user dies, their membership row dies. Correct. |
| `003:39` | `family_invites.family_id → families(id)` | CASCADE | Per-family. |
| `006:11` | `vaccination_doses.vaccination_id` | CASCADE | Per-vax chain. |
| `006:14` | `vaccination_doses.created_by → auth.users(id)` | NO ACTION (default) | **CHANGE → SET NULL**. See below. |
| `007:12` | `notification_log.user_id → users(id)` | CASCADE | Correct — log dies with user. |
| `008:3` | `feedback.user_id → auth.users(id)` | SET NULL | Correct — already deliberately anonymized. (The Edge Function additionally scrubs `user_email` because the FK can't reach text columns.) |
| `012:27` | `pet_allergies.pet_id → pets(id)` | CASCADE | Per-pet chain. |

### Needs a fix in migration 013

| File:line | FK | Current | Proposed | Rationale |
|---|---|---|---|---|
| `003:14` | `families.created_by → public.users(id)` | NO ACTION | **SET NULL** | Family-shared. If sole admin Bob dies and the rest of the family still exists, family must survive without him. (When Bob is the only member, the cascade through `family_members` doesn't drop `families` directly — but that's fine: an orphaned empty family is harmless and we can prune in a periodic job later. **Important:** `families.created_by` has no `NOT NULL`, so SET NULL is legal.) |
| `003:41` | `family_invites.invited_by → public.users(id)` | NO ACTION | **SET NULL** | Audit only. `family_invites.invited_by` is NOT NULL, so SET NULL would violate. **Decision: drop NOT NULL too** (we don't constrain it elsewhere; the row is still valid — invite shows "from a former member"). Alternative: CASCADE (kill all invites the user issued). Chosen SET NULL because admins issue invites that other members may have already shared externally; we don't want to invalidate a code that a friend is about to redeem just because the inviter deleted their account. |
| `003:43` | `family_invites.accepted_by → public.users(id)` | NO ACTION (nullable) | **SET NULL** | Already nullable. Audit-only. |
| `003:57` | `pets.created_by → public.users(id)` | NO ACTION (nullable) | **SET NULL** | Family-shared. Pet survives even if the human who created it is gone. |
| `003:60-61` | `vaccinations.created_by`, `vaccinations.modified_by` | NO ACTION | **SET NULL** | Family-shared records. |
| `003:63-64` | `vet_visits.created_by`, `modified_by` | NO ACTION | **SET NULL** | Family-shared. |
| `003:66-67` | `medications.created_by`, `modified_by` | NO ACTION | **SET NULL** | Family-shared. |
| `003:69-70` | `weight_entries.created_by`, `modified_by` | NO ACTION | **SET NULL** | Family-shared. |
| `003:72-73` | `food_entries.created_by`, `modified_by` | NO ACTION | **SET NULL** | Family-shared. |
| `003:75` | `medication_doses.created_by` | NO ACTION | **SET NULL** | Family-shared. |
| `006:14` | `vaccination_doses.created_by → auth.users(id)` | NO ACTION | **SET NULL** | Family-shared. **Note:** this FK targets `auth.users` directly, unlike the rest which target `public.users`. Migration 013 must handle both. (The cascade chain `auth.users` → `public.users` runs first, so by the time we hit this constraint `auth.users(id)` is already gone — without SET NULL the delete blocks.) |
| `012:29-30` | `pet_allergies.created_by`, `modified_by` | NO ACTION | **SET NULL** | Family-shared. |

**Total: 16 FKs change.** All move from `NO ACTION` to `SET NULL`. Zero CASCADE additions — the cascade chain through `auth.users → public.users → pets → records` already handles single-owner data; the audit columns just need to break gracefully.

### Decision-rule recap

- Records that belong to a single user (e.g. `notification_log.user_id`) → CASCADE.
- Audit columns (`created_by`, `modified_by`) on family-shared tables → SET NULL.
- Family/invite parent columns (`families.created_by`, `family_invites.invited_by`) → SET NULL because the family/invite must outlive the individual.
- Existing per-pet child cascades (vaccinations.pet_id, etc.) are untouched. They cascade through pets → families when the family is destroyed; otherwise records survive.

---

## 3. Migration 013 SQL (full file)

```sql
-- ============================================================
-- Migration 013: FK ON DELETE rules + account_deletion_attempts
--
-- Purpose: enable hard delete of a user via supabase.auth.admin.deleteUser()
-- without FK NO ACTION blocking the cascade. Adds account_deletion_attempts
-- table for rate-limiting (5/day per user) and audit.
--
-- Idempotent: every constraint drop uses IF EXISTS, every recreate uses
-- the same name, table create uses IF NOT EXISTS. Safe to re-run.
--
-- IMPORTANT: This migration must run BEFORE the delete-account Edge
-- Function is deployed. Otherwise the function will succeed against
-- auth but the cascade will fail with constraint violations.
-- ============================================================

-- ── 1. Drop NOT NULL on family_invites.invited_by ──────────────
-- Required for the SET NULL rule below to be legal.
alter table public.family_invites
  alter column invited_by drop not null;

-- ── 2. Recreate FKs as ON DELETE SET NULL ──────────────────────
-- families
alter table public.families
  drop constraint if exists families_created_by_fkey;
alter table public.families
  add constraint families_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

-- family_invites
alter table public.family_invites
  drop constraint if exists family_invites_invited_by_fkey;
alter table public.family_invites
  add constraint family_invites_invited_by_fkey
  foreign key (invited_by) references public.users(id) on delete set null;

alter table public.family_invites
  drop constraint if exists family_invites_accepted_by_fkey;
alter table public.family_invites
  add constraint family_invites_accepted_by_fkey
  foreign key (accepted_by) references public.users(id) on delete set null;

-- pets.created_by
alter table public.pets
  drop constraint if exists pets_created_by_fkey;
alter table public.pets
  add constraint pets_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

-- vaccinations
alter table public.vaccinations
  drop constraint if exists vaccinations_created_by_fkey;
alter table public.vaccinations
  add constraint vaccinations_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.vaccinations
  drop constraint if exists vaccinations_modified_by_fkey;
alter table public.vaccinations
  add constraint vaccinations_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- vet_visits
alter table public.vet_visits
  drop constraint if exists vet_visits_created_by_fkey;
alter table public.vet_visits
  add constraint vet_visits_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.vet_visits
  drop constraint if exists vet_visits_modified_by_fkey;
alter table public.vet_visits
  add constraint vet_visits_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- medications
alter table public.medications
  drop constraint if exists medications_created_by_fkey;
alter table public.medications
  add constraint medications_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.medications
  drop constraint if exists medications_modified_by_fkey;
alter table public.medications
  add constraint medications_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- weight_entries
alter table public.weight_entries
  drop constraint if exists weight_entries_created_by_fkey;
alter table public.weight_entries
  add constraint weight_entries_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.weight_entries
  drop constraint if exists weight_entries_modified_by_fkey;
alter table public.weight_entries
  add constraint weight_entries_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- food_entries
alter table public.food_entries
  drop constraint if exists food_entries_created_by_fkey;
alter table public.food_entries
  add constraint food_entries_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.food_entries
  drop constraint if exists food_entries_modified_by_fkey;
alter table public.food_entries
  add constraint food_entries_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- medication_doses
alter table public.medication_doses
  drop constraint if exists medication_doses_created_by_fkey;
alter table public.medication_doses
  add constraint medication_doses_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

-- vaccination_doses (NB: targets auth.users in 006, keep that)
alter table public.vaccination_doses
  drop constraint if exists vaccination_doses_created_by_fkey;
alter table public.vaccination_doses
  add constraint vaccination_doses_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- pet_allergies
alter table public.pet_allergies
  drop constraint if exists pet_allergies_created_by_fkey;
alter table public.pet_allergies
  add constraint pet_allergies_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.pet_allergies
  drop constraint if exists pet_allergies_modified_by_fkey;
alter table public.pet_allergies
  add constraint pet_allergies_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- ── 3. account_deletion_attempts: rate-limit + audit ───────────
create table if not exists public.account_deletion_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,           -- intentionally NOT a FK: we must keep
                                   -- the row after the user is deleted
  email text,                      -- for audit visibility post-deletion
  status text not null check (status in ('success', 'failure', 'rate_limited')),
  error_message text,
  ip_address text,                 -- best-effort; from req headers
  created_at timestamptz not null default now()
);

create index if not exists idx_account_deletion_attempts_user_created
  on public.account_deletion_attempts(user_id, created_at desc);

-- RLS: users can only see their own attempt rows (mostly for debug;
-- production traffic goes through service role from the Edge Function).
alter table public.account_deletion_attempts enable row level security;

drop policy if exists "users_view_own_deletion_attempts"
  on public.account_deletion_attempts;
create policy "users_view_own_deletion_attempts"
  on public.account_deletion_attempts
  for select using (user_id = auth.uid());

-- No insert/update/delete policy: only service_role writes.

-- ── 4. Helper: count attempts in last 24h ──────────────────────
-- Used by the Edge Function for rate limiting. SECURITY DEFINER so the
-- function can be called with anon JWT before deletion happens.
create or replace function public.count_recent_deletion_attempts(p_user_id uuid)
returns integer as $$
  select count(*)::int
  from public.account_deletion_attempts
  where user_id = p_user_id
    and created_at > now() - interval '24 hours';
$$ language sql security definer stable;

-- ── 5. (Optional, deferred) Cleanup of orphaned empty families ─
-- Not in v1. If a sole-admin user deletes and no other members exist,
-- the family row survives because families.created_by → SET NULL doesn't
-- trigger any cascade. A future cron job (or trigger on family_members
-- DELETE) can prune empty families. For v1 we accept the orphan rows.
```

### Rollback SQL

```sql
-- Reverts migration 013. Run before re-applying earlier migrations.
-- This restores the original NO ACTION behavior — meaning user deletion
-- will be blocked again. Only run if rolling back the deletion feature.

-- Restore NOT NULL on family_invites.invited_by (best-effort: this fails
-- if any rows have NULL invited_by from a prior deletion; clean those
-- up first or skip).
-- alter table public.family_invites alter column invited_by set not null;

alter table public.families drop constraint families_created_by_fkey;
alter table public.families add constraint families_created_by_fkey
  foreign key (created_by) references public.users(id);

-- (... repeat for each constraint, swapping `set null` for default no action)

drop function if exists public.count_recent_deletion_attempts(uuid);
drop table if exists public.account_deletion_attempts;
```

### Testing approach

**Fresh DB (CI / staging from scratch):**
1. Apply migrations 001 → 013.
2. Sign up two users A and B.
3. A invites B; B accepts → both in same family.
4. A creates pet "Buddy", B logs a weight entry on Buddy.
5. Delete user A via `supabase.auth.admin.deleteUser(A.id)`.
6. Assertions:
   - `select * from auth.users where id = A.id` returns 0 rows.
   - `select * from public.users where id = A.id` returns 0 rows.
   - `select * from public.pets where name = 'Buddy'` returns 1 row, `created_by IS NULL`.
   - `select * from public.weight_entries where ...` returns 1 row, `created_by = B.id` (not nulled — B authored it).
   - `select * from public.families` returns 1 row, family Buddy belongs to, `created_by IS NULL`.
   - `select * from public.family_members where user_id = A.id` returns 0 rows.

**Live data (production migration):**
7. Migration 013 itself does not touch any data — only constraints. Drop+recreate of a FK is metadata-only in Postgres (no table scan), so the migration runs in milliseconds even at scale.
8. Apply during a low-traffic window. No downtime expected.
9. Pre-flight query to confirm zero pre-existing constraint violations:
   ```sql
   -- Before migration: confirm no orphaned audit columns. Should return 0.
   select count(*) from pets where created_by is not null
     and created_by not in (select id from public.users);
   ```
   (If non-zero, the rebuild ADD CONSTRAINT will fail. We expect zero — the original FKs were NO ACTION enforced.)

**CI — what we can and can't test:**
- We can mock the Supabase client in service tests. Standard Jest pattern.
- We **cannot** practically run a real Postgres against migrations in CI for this repo (no docker setup; Supabase local dev is heavy). Practical answer: **manual test against the staging Supabase project**. Document the test script (see Test plan §9) so any engineer can rerun.

---

## 4. Migration 014 SQL (full file)

```sql
-- ============================================================
-- Migration 014: notification_tickets
--
-- Persists Expo Push ticket IDs returned by send-reminders. A future
-- receipt-poller (v1.1+) will read this table, call Expo's GetReceipts
-- endpoint, and act on failures (clean up dead push_tokens, alert).
--
-- Idempotent.
-- ============================================================

create table if not exists public.notification_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ticket_id text not null,                     -- Expo's "id" field on a ticket
  push_token text not null,                    -- the device token we sent to
  notification_type text not null
    check (notification_type in ('medication', 'vaccination')),
  reference_id uuid not null,                  -- pet_id or vaccination_id
  status text not null
    check (status in ('ok', 'error', 'unchecked')),
  error_code text,                             -- DeviceNotRegistered, etc.
  receipt_checked_at timestamptz,              -- null = not yet polled
  created_at timestamptz not null default now()
);

-- Hot path: the future poller will scan unchecked tickets in time order.
create index if not exists idx_notification_tickets_unchecked
  on public.notification_tickets(created_at)
  where receipt_checked_at is null;

-- For per-user audit / debug.
create index if not exists idx_notification_tickets_user_created
  on public.notification_tickets(user_id, created_at desc);

-- RLS
alter table public.notification_tickets enable row level security;

create policy "users_view_own_tickets" on public.notification_tickets
  for select using (user_id = auth.uid());
-- service_role bypasses RLS; only the Edge Function inserts.
```

### `send-reminders` change (~10 lines)

In `supabase/functions/send-reminders/index.ts`, after `sendPushNotifications` returns `tickets`, add per-ticket persistence (parallel to the existing `removeStaleTokens` logic). Pseudocode:

```ts
// After: const tickets = await sendPushNotifications(allMessages);
const ticketRows = tickets.map((t, i) => ({
  user_id: user.id,
  ticket_id: (t as any).id ?? null,        // present on status:'ok'
  push_token: allMessages[i].to,
  notification_type: allMessages[i].data?.type as string,
  reference_id: (allMessages[i].data?.petId
                 ?? allMessages[i].data?.vaccinationId) as string,
  status: t.status,
  error_code: t.details?.error ?? null,
})).filter(r => r.ticket_id || r.status === 'error');

if (ticketRows.length) {
  await supabase.from('notification_tickets').insert(ticketRows);
}
```

The `PushTicket` interface at the top of the file gains `id?: string`.

**Deploy ordering for migration 014:**
1. Apply migration 014 first. The new table and its insert path do not exist yet, so the unchanged Edge Function continues to work.
2. Redeploy `send-reminders` with the ticket-write code.
3. There is a brief window (step 1 → step 2) where notifications are sent but no tickets are written. This is acceptable — receipt polling is v1.1.

---

## 5. Edge Function spec — `supabase/functions/delete-account/index.ts`

```ts
// Pseudo-structure. Implementation agent fills in the bodies.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RATE_LIMIT_PER_DAY = 5;

// One client with service_role for admin ops (bypasses RLS).
const admin = createClient(supabaseUrl, serviceKey);

async function logAttempt(
  userId: string,
  email: string | null,
  status: 'success' | 'failure' | 'rate_limited',
  errorMessage: string | null,
  ip: string | null,
): Promise<void> { /* insert into account_deletion_attempts */ }

Deno.serve(async (req) => {
  // 1. Verify JWT and extract userId from sub claim.
  //    Use a per-request client built from req.headers Authorization.
  //    Reject if missing/invalid.
  const userClient = createClient(supabaseUrl, /* anon key */, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return new Response('Unauthorized', { status: 401 });

  // 2. Match the userId in the request body (defense-in-depth).
  const { userId } = await req.json();
  if (userId !== user.id) {
    await logAttempt(user.id, user.email, 'failure', 'userId mismatch', null);
    return new Response('Forbidden', { status: 403 });
  }

  // 3. Rate-limit check.
  const { data: attemptCount } = await admin.rpc(
    'count_recent_deletion_attempts',
    { p_user_id: user.id },
  );
  if ((attemptCount ?? 0) >= RATE_LIMIT_PER_DAY) {
    await logAttempt(user.id, user.email, 'rate_limited', null, null);
    return new Response(
      JSON.stringify({ error: 'Too many deletion attempts. Try again tomorrow.' }),
      { status: 429 },
    );
  }

  try {
    // 4. Storage cleanup. List + remove for both buckets.
    //    Folder convention is `{userId}/...` for both buckets (per
    //    petService and healthService). Use storage list with a prefix
    //    and recursive paging, then bulk remove in chunks of 100.
    await purgeBucketFolder('pet-photos',     `${user.id}/`);
    await purgeBucketFolder('vet-attachments', `${user.id}/`);

    // 5. Anonymize feedback (FK already SET NULL on user_id, but the
    //    text user_email column isn't covered).
    await admin
      .from('feedback')
      .update({ user_id: null, user_email: null })
      .eq('user_id', user.id);

    // 6. Clear push_tokens before auth deletion. (auth cascade will drop
    //    the public.users row, but if the cron fires between this Edge
    //    Function call and the cascade we don't want to send to a
    //    soon-to-be-dead user.)
    await admin
      .from('users')
      .update({ push_tokens: [] })
      .eq('id', user.id);

    // 7. Hard delete the auth user. This triggers the cascade chain
    //    governed by migration 013.
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);

    // Idempotency: if user is already gone, treat as success.
    if (delErr && !/User not found/i.test(delErr.message)) throw delErr;

    await logAttempt(user.id, user.email, 'success', null, null);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    await logAttempt(
      user.id,
      user.email,
      'failure',
      (err as Error).message,
      null,
    );
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 },
    );
  }
});

async function purgeBucketFolder(bucket: string, prefix: string): Promise<void> {
  // Recursive list under prefix, paged, then remove in batches of 100.
  // Storage list returns files + folders; recurse into folders.
  // Stub here — implementation agent writes the loop.
}
```

**Why a Supabase JS client (not raw fetch):** consistency with `send-reminders/index.ts` line 6, which uses `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`. Same import, same patterns.

**Idempotency:** step 7 returns success for "user not found". The other steps (storage, feedback, push_tokens) are all idempotent (deleting an already-deleted file is a no-op-by-error we can swallow; updating a row that doesn't exist updates 0 rows).

---

## 6. Settings screen spec

### File: `app/(main)/settings/index.tsx` (modify existing)

Add a new "Account Management" section at the very bottom (after Reminders, before the version footer):

```
┌─────────────────────────────────────────────┐
│ ACCOUNT MANAGEMENT                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Sign Out                            ›   │ │ ← (existing — relocate
│ └─────────────────────────────────────────┘ │   from wherever it sits)
│ ┌─────────────────────────────────────────┐ │
│ │ Delete Account                      ›   │ │ ← NEW (red label)
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

Body label color: `Colors.statusOverdue` (`#E8735A`). Icon: `trash-outline`.

### State (additive)

```ts
const [deletionModalVisible, setDeletionModalVisible] = useState(false);
const [deletionLoading, setDeletionLoading] = useState(false);
const [deletionError, setDeletionError] = useState<string | null>(null);
const [familyContext, setFamilyContext] = useState<{
  isSoleAdminOfMultiMemberFamily: boolean;
  memberCount: number;
  petNames: string[];
} | null>(null);
```

`familyContext` is loaded on mount via `familyService.getFamily()` + a new helper (see §7). If the family has >1 members and the user is the only admin, set `isSoleAdminOfMultiMemberFamily: true`.

### Body copy (dynamic)

Two variants:

**Generic (most users):**
> This permanently deletes your account, all your pets ({petNames}), all health and food records, all uploaded photos, your family, and any pending invites. This cannot be undone.

**Sole admin of a multi-member family:**
> This permanently deletes your account, all pets in your family ({petNames}), all health and food records, all uploaded photos, your family, and any pending invites. {N} other family member{s} will lose access to these pets. This cannot be undone.

If `petNames` is empty, omit the parenthetical. If `petNames.length > 3`, show first 3 then "and N more".

### Modal invocation

```tsx
<ConfirmationModal
  visible={deletionModalVisible}
  severity="irreversible"
  typedConfirmationWord="DELETE"
  title="Delete Account"
  body={dynamicBody}
  confirmText="Delete Account"
  loading={deletionLoading}            // requires Modal to expose this
  errorMessage={deletionError}         // ditto
  onConfirm={handleDeleteAccount}
  onCancel={() => setDeletionModalVisible(false)}
/>
```

(Confirmation: `ConfirmationModal` already supports the loading + error props per the parallel observability thread spec; if not, add them. Verify when implementing.)

### `handleDeleteAccount`

```ts
async function handleDeleteAccount() {
  setDeletionLoading(true);
  setDeletionError(null);
  try {
    await authService.deleteAccount();        // see §7
    await authService.signOut();
    showToast('Account deleted.');
    // _layout.tsx auth guard will route to (auth)/welcome on session loss.
  } catch (err) {
    setDeletionError(
      err instanceof Error ? err.message : 'Could not delete account. Please try again.',
    );
  } finally {
    setDeletionLoading(false);
  }
}
```

Modal stays open on error so the user can retry. On success, `signOut` clears the session, the auth-guard `useEffect` in `_layout.tsx` routes to `/(auth)/welcome`, and the toast renders on top.

---

## 7. Service-layer additions

### `services/authService.ts` — add `deleteAccount`

```ts
async deleteAccount(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { userId: session.user.id },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
},
```

`supabase.functions.invoke` automatically sends the Authorization header with the user's JWT — exactly what the Edge Function expects.

### `services/familyService.ts` — add `getDeletionContext`

```ts
async getDeletionContext(): Promise<{
  isSoleAdminOfMultiMemberFamily: boolean;
  memberCount: number;
  petNames: string[];
}> {
  const family = await familyService.getFamily();
  if (!family) {
    return { isSoleAdminOfMultiMemberFamily: false, memberCount: 0, petNames: [] };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const myMembership = family.members.find(m => m.user_id === user.id);
  const otherAdmins = family.members.filter(
    m => m.user_id !== user.id && m.role === 'admin',
  );
  const isSole = myMembership?.role === 'admin'
              && family.members.length > 1
              && otherAdmins.length === 0;

  const { data: pets } = await supabase
    .from('pets')
    .select('name')
    .eq('family_id', family.id)
    .eq('is_archived', false);

  return {
    isSoleAdminOfMultiMemberFamily: isSole,
    memberCount: family.members.length,
    petNames: (pets ?? []).map(p => p.name),
  };
},
```

Tests required for both new methods (see §9).

---

## 8. Storage cleanup audit

Confirmed bucket names by reading `services/petService.ts:93-99` and `services/healthService.ts:265-294`:

| Bucket | Purpose | Path convention |
|---|---|---|
| `pet-photos` | Pet profile photos (public bucket per migration 001:201) | `{userId}/{petId}/profile.jpg` |
| `vet-attachments` | Vet visit files (private per 001:202) | `{userId}/{petId}/{timestamp}_{fileName}` |

Both are user-folder rooted. Cleanup query for the Edge Function:

```ts
// Pseudocode for purgeBucketFolder:
async function purgeBucketFolder(bucket: string, prefix: string): Promise<void> {
  // List recursively. supabase-js storage list is non-recursive by default,
  // so we walk folders explicitly.
  const stack: string[] = [prefix];
  const allPaths: string[] = [];
  while (stack.length) {
    const p = stack.pop()!;
    const { data, error } = await admin.storage.from(bucket).list(p, {
      limit: 1000,
    });
    if (error) throw error;
    for (const item of data ?? []) {
      const itemPath = `${p}${item.name}`;
      // A "folder" entry has id === null in supabase-js.
      if (item.id === null) {
        stack.push(`${itemPath}/`);
      } else {
        allPaths.push(itemPath);
      }
    }
  }
  // Batch remove (Supabase storage caps batch size; 100 is safe).
  for (let i = 0; i < allPaths.length; i += 100) {
    const batch = allPaths.slice(i, i + 100);
    const { error } = await admin.storage.from(bucket).remove(batch);
    if (error) throw error;
  }
}
```

**Edge case:** if migration 003 renamed photos when family-sharing arrived (it didn't — see 003 storage policies, paths still use uploader's folder), there's no orphan risk. Photos uploaded by user A live under A's folder even if the pet now belongs to a family B+C is in. **This is a data-loss risk:** when A deletes their account, photos of pets that B and C still share will be removed. **Mitigation:** body copy explicitly says "all uploaded photos." Document this so it's not a surprise. Future improvement (post-v1): copy photos to a `family-{id}/` prefix when added so they persist family-wide.

---

## 9. Test plan

### Unit tests (Jest + RTL — required per CLAUDE.md)

| File | Cases |
|---|---|
| `services/authService.test.ts` (extend) | `deleteAccount` happy path; throws when no session; surfaces Edge Function error; surfaces nested `data.error` |
| `services/familyService.test.ts` (extend) | `getDeletionContext` for: solo user (no family); single-admin multi-member family; member of multi-member family; admin with co-admin; family with archived pets (should not appear in `petNames`) |
| `app/(main)/settings/index.test.tsx` (new — currently no test file for settings; create alongside) | "Delete Account" row renders; tap opens modal with generic body; sole-admin user sees extended body; modal calls `authService.deleteAccount` then `signOut`; error keeps modal open and shows error; loading disables the confirm button |

### Edge Function tests (deno test or skipped in CI)

The repo has no Deno test setup today. Pragmatic answer: **smoke-test against staging, not unit-test in CI**. Document the manual script:

```
1. Sign up test user.
2. Create pets, vaccinations, upload a photo.
3. Tap Delete Account → DELETE → confirm.
4. Verify in Supabase dashboard:
   - auth.users row gone
   - public.users row gone
   - storage.objects under {userId}/ in both buckets gone
   - account_deletion_attempts has one success row
5. Re-authenticate as a sibling family member; verify pet still visible
   with created_by = NULL.
6. Hammer the Edge Function 6 times in a row from a fresh test user;
   verify 6th call returns 429.
```

### Migration tests (manual on staging)

Per §3 testing approach above. Key assertions are listed there; CI can't realistically run a real Postgres for this app.

### What's hard to test

- **Real cascade behavior**: requires real Postgres, hence staging.
- **Storage cleanup at scale**: a user with 1000 photos. Test manually with a seeded user.
- **Concurrent deletions**: two devices tap Delete simultaneously. Acceptable risk: the second one returns 200 (idempotent "user not found" path).

---

## 10. Deploy ordering

Strict order. Each step must succeed before the next.

1. **Land migration 013 SQL file** in `supabase/migrations/013_*.sql` (PR review + DB-engineer review).
2. **Apply migration 013 manually** in the Supabase SQL editor (per CLAUDE.md feedback rule: never run destructive DB commands; user runs them).
3. **Land migration 014 SQL file** in `supabase/migrations/014_*.sql`. DB-engineer review.
4. **Apply migration 014 manually** in the Supabase SQL editor.
5. **Land Edge Function code:**
   - `supabase/functions/delete-account/index.ts` (new)
   - `supabase/functions/send-reminders/index.ts` (modified for ticket persistence)
6. **Deploy both Edge Functions:**
   ```
   supabase functions deploy delete-account
   supabase functions deploy send-reminders
   ```
   Order doesn't strictly matter between these two, but both must be deployed before the app build.
7. **Land app code:**
   - `services/authService.ts` (deleteAccount method + test)
   - `services/familyService.ts` (getDeletionContext + test)
   - `app/(main)/settings/index.tsx` (Delete row + modal + test)
   - `components/ui/ConfirmationModal.tsx` (loading + error props if not present yet)
8. **Build via `/preview-build`** — verify on a real device.
9. **App Store submission** — App Privacy disclosure must list account-deletion path; the parallel privacy-checkbox thread should land before this.

**If migration 013 lands but Edge Function isn't deployed yet:** harmless, no behavior change.
**If Edge Function deployed but migration 013 not applied:** function will succeed against `auth.admin.deleteUser` then the cascade fails with a constraint violation; auth user dies but `public.users` row survives orphaned. **This is the bad state.** Migration 013 must be applied first — flag prominently in the implementation agent's final report.

---

## 11. App Store reviewer access

Apple requires App Review to have a way to test account deletion. Options:

1. **Provision a dedicated reviewer test account** with credentials in App Store Connect → App Information → App Review Information → Sign-In Information. Email like `appstore-reviewer@bemy.app`. Pre-seed it with one fake pet so the reviewer can see the data before deleting.
2. **Allow self-signup** — reviewer creates their own throwaway account and deletes it. Riskier because email confirmation may slow them down, and they may flag the friction.

**Recommendation: option 1.** Provision the reviewer account before the first submission. Include a note in App Review Information:
> "Tap 'Delete Account' at the bottom of Settings to test account deletion. Per Apple Guideline 5.1.1(v), this fully removes the account, all pets, all records, and all uploaded media."

---

## 12. Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Migration 013 fails because of pre-existing orphan rows in audit columns | Low (FKs were enforced) | Pre-flight query in §3 testing approach. |
| Deletion deletes photos that family members still need | Medium | Explicit body copy. Future fix: family-scoped storage paths. |
| Edge Function times out on user with thousands of storage objects | Low | Storage list+remove in pages of 1000/100. Worst realistic case (~100 photos) completes in <5s. Set Edge Function timeout to 60s. |
| Race: user starts deletion, push notification fires mid-cascade | Low | Step 6 clears push_tokens before auth.admin.deleteUser. |
| Sole admin deletes; family members see broken state | Medium | Body copy warns. Members' app will hit `getFamily()` → null and route to onboarding. (Verify this is graceful; if not, file a follow-up.) |
| Reviewer rejects because deletion isn't immediate enough | Low | Apple's bar is "permanently deletes account." Our cascade is synchronous in the Edge Function. We meet the bar. |
| User accidentally taps Delete | Low | Typed-DELETE gate on `ConfirmationModal severity="irreversible"`. |
| Sign in with Apple revocation requirement | None today | Verified: no Apple Sign-In code in repo (`grep` for `apple` / `AppleAuth` / `sign-in-with-apple` returns 0 hits). When added, must call Apple's `/auth/revoke` endpoint server-side. Tracked as a follow-up if/when Sign in with Apple ships. |
| pg_cron per-user job cleanup needed | None | Verified: only two cron jobs in migration 009 (`send-reminders-hourly`, `notification-log-cleanup`). Both global, neither per-user. No cleanup required. |

---

## 13. Open questions for reviewer / user

1. **Storage data-loss for shared photos.** When user A deletes, photos A uploaded for pets B+C now share will be wiped. Acceptable for v1 (body copy warns), or do we want to migrate to family-scoped storage paths first? *Recommendation: ship v1 as-is, file migration to family-paths as a v1.1 item.*

2. **Empty-family pruning.** If A is sole admin of an empty family (no other members), the family row survives because `families.created_by` is SET NULL. Harmless but accumulates. Add a daily cron to prune empty families with no members? *Recommendation: defer, file in v1.1 backlog.*

3. **Rate-limit threshold.** 5 attempts/24h is the user's locked-in number. Worth confirming this isn't too tight — a user who fumbles the typed DELETE gate three times shouldn't get locked out. The gate prevents accidental triggers, so 5 should be plenty. Confirm.

4. **`families.created_by` NULL semantics in app code.** After this migration, joins reading the creator's name will see NULL for deleted-account families. Audit `services/familyService.ts` and any UI that surfaces "created by" to handle null gracefully. *Recommendation: include in the implementation agent's brief.*

---

## Appendix: implementation-agent commissioning checklist

When this plan is approved, the implementation agent's brief must include:

- [ ] Tests required for every new service method (`authService.deleteAccount`, `familyService.getDeletionContext`) and the modified `Settings` screen.
- [ ] Run `npx jest` — green required before commit.
- [ ] Migration 013 + 014 reviewed by senior DB engineer agent (rule 6) BEFORE finalizing.
- [ ] Post-migration code review by second senior engineer agent (rule 7) AFTER all code lands.
- [ ] Final report must surface deploy ordering (§10) — migration 013 MUST be applied before the Edge Function is deployed.
- [ ] Migration files committed but NOT applied by the agent. User runs them in Supabase dashboard.
- [ ] `delete-account` Edge Function deployed via `supabase functions deploy`.
- [ ] Reviewer test account provisioned in App Store Connect (this is a manual user task; agent can only document).
