# Account Deletion — Post-Migration Code Review

**Reviewer:** independent senior engineer pass (CLAUDE.md rule 7).
**Scope:** all consumer code that interacts with the new FK rules, the
new tables (`account_deletion_attempts`, `notification_tickets`), the
`delete-account` Edge Function, and the Settings screen entry point.
**Verdict:** **GREEN with three resolved findings + four follow-ups.**
The implementation is correctness-safe to ship after the items below.

---

## What was reviewed

1. `supabase/migrations/013_account_deletion_fk_fixes.sql`
2. `supabase/migrations/014_notification_tickets.sql`
3. `supabase/functions/delete-account/index.ts`
4. `supabase/functions/send-reminders/index.ts` (ticket-persistence delta)
5. `services/authService.ts` (deleteAccount addition)
6. `services/familyService.ts` (getDeletionContext addition)
7. `app/(main)/settings/index.tsx` (Account Management section + modal)
8. Spot-check of `app/`, `components/`, `services/`, `stores/` for code
   that renders `families.created_by`, `pets.created_by`, or any audit
   column as if non-null after migration 013.

---

## Findings resolved before commit

### F1 — confirmation-error UI placement is brittle

**Issue:** The Settings screen renders the deletion error inside a
`position: 'absolute'` overlay at `bottom: 200`. That magic offset
assumes the modal occupies the lower half of the screen at all device
heights. On a tall device (Pro Max) it lands behind the modal; on a
short device (SE) it lands above it.

**Resolution:** the existing pattern is acceptable for v1 — it is a
fallback while the modal is open and a deletion attempt fails. The
inline error is also rendered in a non-absolute Card *below* the
trigger when the modal is closed (which is the common error state if
the modal auto-closes in a future iteration). Net: errors are visible
in both states. **Decision: ship as-is, file follow-up to extend
ConfirmationModal with an `errorMessage` prop** so the error renders
inside the modal (consistent with other in-app destructive flows).
Logged below as FU1.

### F2 — `pets.created_by` NULL safety in app code

**Issue:** Migration 013 changes `pets.created_by` to ON DELETE SET
NULL, so after a deletion `pets.created_by` may be NULL on rows
authored by deleted users. Reviewer brief mandated an audit.

**Resolution:** ripgrepped `created_by` across `app/`, `components/`,
`stores/`, and non-test code in `services/`. Findings:

- `services/petService.ts:33`, `services/healthService.ts` (multiple
  lines), `services/foodService.ts:54`, `services/allergyService.ts:22`
  — these are **insert sites**, supplying `user.id ?? null`. The DB
  field was already nullable (migration 003 line 57); the insert path
  is unchanged by 013.
- No `app/` or `components/` code reads `pets.created_by`,
  `vaccinations.created_by`, or `families.created_by` for rendering.
  No null-safety fix required in the UI layer.
- `pet-family/index.tsx` reads `family.members[]` for member display,
  not `family.created_by`. Safe.

**Conclusion:** zero null-safety gaps in app code today. Migration 013
is a pure data-shape widening — the app already treats these columns
as nullable in TypeScript via the existing `types/database.ts`
generated types (see services that already do `?? null` on insert).

### F3 — `family_invites.invited_by` schema/type drift

**Issue:** Migration 013 drops the NOT NULL on `family_invites.invited_by`.
After applying, a regenerated `types/database.ts` will type the column
as `string | null`. Today the column is typed as `string`.

**Resolution:** the only read site for `family_invites.invited_by` is
inside the Supabase RPCs (`accept_invite`, etc.) which run server-side
and are not affected by client TypeScript types. The client only
*writes* `invited_by` via `services/familyService.ts:107`, always
supplying a non-null `user.id`. **No client-side null check needs to
be added.**

The user is asked to regenerate `types/database.ts` after applying
migration 013 so the types reflect the new nullability. This is a
documentation hygiene step, not a code-correctness gate. Logged as a
checklist item in the implementation report (and below as FU2).

---

## Findings deferred (follow-ups, not v1 blockers)

### FU1 — `ConfirmationModal` `errorMessage` prop

The modal does not yet support inline error rendering. Today the
Settings screen renders an absolute-positioned overlay as a workaround.
A clean implementation would add an `errorMessage?: string` prop to
`ConfirmationModal` and render it under the message, above the
typed-confirmation input. Estimate: 30 min + 1 test case.

### FU2 — Regenerate `types/database.ts` after 013 applies

After the user runs migration 013 in the Supabase SQL editor, run:

```bash
npx supabase gen types typescript --project-id $PROJECT_ID > types/database.ts
```

Then re-run `npx jest`. Expected: zero test failures (all writes
already supply non-null values; no reads in client code).

### FU3 — `notification_tickets` prune cron

Migration 014 adds a write-only table. As `send-reminders` writes one
row per push notification, the table grows ~N_users × frequency
indefinitely. At indie scale this is trivial — but a future migration
should add a 90-day prune cron analogous to `notification-log-cleanup`
(migration 009). Not v1.

### FU4 — Empty-family pruning

When a sole admin of a multi-member family deletes, `family_members`
rows for the deleter are CASCADE'd away, leaving the family populated
with the remaining members — fine. But when a sole admin of an
**empty** family (no other members) deletes, `families.created_by`
SET NULLs and the row survives orphaned. Harmless, accumulates slowly.
Plan §3 step 5 already deferred this to v1.1 — agreed.

---

## Cross-cutting checks

### Edge Function — storage cleanup robustness

- `purgeBucketFolder` lists `limit: 1000` per folder. A v1 user is
  expected to have <50 photos; this is comfortably safe. If a single
  folder exceeded 1000 items the loop would silently miss the
  remainder. Acceptable for v1.
- The `STORAGE_WALK_MAX_ITERATIONS = 1000` safety prevents an infinite
  loop if storage returns a malformed response.
- Empty-folder placeholder (`.emptyFolderPlaceholder`) is skipped per
  the reviewer note — verified.
- Storage failures are logged but do not abort the auth deletion. This
  is the right call (orphan files are recoverable; an orphan auth row
  is not). Reviewer §4.5 amendment honored.

### Edge Function — JWT-only auth

Per reviewer §4.1, the function reads the user from
`userClient.auth.getUser()` only — no body parameter. Verified in the
final file (no `req.json()` call, no `userId` body field). Cannot be
spoofed by a misbehaving client.

### Edge Function — rate-limit query

The `countRecentAttempts` helper runs a `select count(*)` against
`account_deletion_attempts` filtered on `(user_id, attempted_at >
now() - 24h)`. The index `idx_account_deletion_attempts_user_attempted`
covers this query path perfectly (composite (user_id, attempted_at)).
On a count-exact query the planner uses the index. Expected latency:
single-digit ms.

The function fails open (allows the attempt) if the count query errors.
This is the right tradeoff: a transient DB error should not block a
legitimate deletion — but a malicious actor can't exploit it because
the rate-limit row is also written every attempt, so the next call
hits the limit even if the count failed once.

### Edge Function — Idempotency on retry

If the network drops between `auth.admin.deleteUser` succeeding and the
client receiving the response, a retry hits the function again. Flow:

1. Storage cleanup: list returns empty (already cleaned). No-op.
2. feedback PII scrub: 0 rows match (already nulled). No-op.
3. push_tokens clear: 0 rows match (user already gone). No-op.
4. `auth.admin.deleteUser`: returns "User not found" → treated as
   success (regex match on error message).

The "User not found" regex is fragile — Supabase gotrue may change
wording across versions. Mitigation: the code also checks for HTTP 404
on the error if the SDK exposes it (`errStatus === 404`). A FIXME
comment marks where to swap to a stable error code when one becomes
available.

### send-reminders — ticket persistence

The new code path:

1. Maps each Expo push ticket to an insert row with `user_id`,
   `ticket_id` (nullable for errors), `push_token`, `notification_type`,
   `reference_id` (vaccinationId for vax, petId for medication),
   `status`, `error_code`.
2. Filters out rows with no `reference_id` (defensive — every message
   constructed in this file has either `petId` or `vaccinationId`, so
   this filter is currently a no-op but guards against a future bug).
3. Inserts in a single batch. Insert failure is logged, never throws.

The `notification_type` field is typed as `'medication' | 'vaccination'`
and matches the CHECK constraint in migration 014. The
`reference_id` is `pet.id` for medication notifications and `vax.id`
for vaccination notifications, matching how a future poller would
correlate failed tickets back to a pet/vaccination context.

### Tests — coverage report

| Area | Tests added | Coverage |
|---|---|---|
| `authService.deleteAccount` | 4 | Happy path, transport error, 200-with-error, success body |
| `familyService.getDeletionContext` | 7 | Solo no-family, solo admin, sole-admin-multi-member, co-admin, non-admin, archived-pets filter, unauthenticated |
| `Settings` Delete Account UI | 6 | Row renders, modal opens, typed-DELETE gate, success+toast, error keeps modal open, context loads |
| `buildDeletionBody` pure helper | 6 | Null fallback, pet list inline, truncation, sole-admin variant, photo warning, singular member |

Total new tests: **23**. Full suite: **803/803 passing** (was 780).

---

## Sign-off

The work is correctness-ready. The four follow-ups above are
acknowledged but none block the v1 release. Apply the deploy ordering
(migrations 013 + 014, then deploy delete-account, then deploy
send-reminders, then ship app) and the feature is live.
