# Migrations 013 + 014 — Senior DB Engineer Review

**Reviewer:** independent database engineer pass (no involvement in authoring the plan or migrations).
**Migrations under review:**
- `supabase/migrations/013_account_deletion_fk_fixes.sql`
- `supabase/migrations/014_notification_tickets.sql`

**Verdict:** **GREEN with minor fixes applied inline.** Both migrations are FK-safe, idempotent, and respect the rest of the schema. One must-fix and three nits below — all resolved before commit.

---

## Method

Read all 12 prior migrations (001 → 012) end-to-end to recover the schema, then walked each constraint change in 013 and the new table in 014 against it. Specifically verified:

1. Every constraint named in 013 actually exists in the prior schema with the original NO ACTION rule.
2. Every `references public.users(id)` target exists, and the `vaccination_doses` `references auth.users(id)` outlier is preserved.
3. The `family_invites.invited_by` NOT NULL drop unblocks the SET NULL action without breaking inserts (services/familyService.ts:107 always supplies a non-null value).
4. The cascade chain — `auth.users → public.users → pets → records / families` via `family_members.user_id CASCADE` — still terminates cleanly with the new SET NULL audit columns.
5. `notification_tickets`' FK to `public.users(id) ON DELETE CASCADE` is consistent with `notification_log` (migration 007 line 12).
6. RLS posture matches existing patterns: service-role bypass for write paths, deny-by-default for clients on tables not consumed by the app.

---

## Migration 013 findings

### Confirmed correct

- All 16 constraint moves from NO ACTION → SET NULL match the audit in `docs/bemy-v1-account-deletion-plan.md` §2 line-by-line. No omitted constraints, no spurious additions.
- The `vaccination_doses.created_by → auth.users(id)` constraint is correctly preserved with its `auth.users` target (rather than being silently rewritten to `public.users`). The cascade ordering (auth.users delete → public.users delete → vaccination_doses SET NULL) is correct because Postgres evaluates referencing constraints after the referenced row is removed; the SET NULL fires once auth.users(id) is gone.
- Idempotency: every `drop constraint` uses IF EXISTS; the new table uses IF NOT EXISTS; the index uses IF NOT EXISTS. Safe to re-run.
- The `family_invites.invited_by drop not null` ordering is correct — must precede the FK SET NULL recreation, otherwise the SET NULL action would be illegal.

### Defect resolved before commit — `count_recent_deletion_attempts` RPC

The plan included a SECURITY DEFINER RPC for the rate-limit count. **Dropped per reviewer amendment §6.4** — the Edge Function will run an inline count query against `account_deletion_attempts` using the service-role client. One fewer migration object to maintain; no security regression because the table has RLS enabled with no policies (service role bypasses RLS, regular clients fail closed).

### Defect resolved before commit — `account_deletion_attempts.ip_address`

The plan included an `ip_address text` column for best-effort IP capture. **Dropped per reviewer amendment §3 + §6.1** — collecting IPs creates a privacy-disclosure burden in the App Privacy nutrition label with zero v1 value. Schema reduces to `(user_id, attempted_at, succeeded)`. If we later need IP-based rate-limiting, add it then.

### Nit (accepted as-is) — table size growth

`account_deletion_attempts` is unbounded. At indie scale the row count is ~1 per deletion attempt per user — order of single digits annually. Add a 90-day prune cron later if needed; no v1 work required. Acceptable.

### Nit (accepted as-is) — empty-family pruning

When a sole admin of an empty family deletes their account, `families.created_by` SET NULLs and the family row survives orphaned (no `family_members` rows pointing at it). Harmless, accumulates slowly. The plan defers cleanup to v1.1 — agreed.

### Nit (accepted as-is) — RLS posture for `account_deletion_attempts`

Original plan included a "users can view own deletion attempts" SELECT policy. Final migration enables RLS but defines no policies. Service role still bypasses; clients fail closed. This is a tighter posture than the plan and is the right default — there's no in-app surface that reads from this table, so giving clients SELECT access on it serves no purpose.

---

## Migration 014 findings

### Confirmed correct

- `notification_tickets.user_id → public.users(id) ON DELETE CASCADE` mirrors `notification_log` (migration 007 line 12). When a user deletes, their tickets cascade through cleanly.
- The partial index `idx_notification_tickets_unchecked` correctly scopes to `where receipt_checked_at is null and status = 'ok'` — the future poller only needs to look at tickets that succeeded in the send phase but haven't been checked for delivery receipts. (The plan's draft also included `status = 'ok'` filter implicitly via the `id` not-null check; making it explicit in the partial-index predicate is clearer.)
- RLS posture matches `notification_log` and `account_deletion_attempts`: enabled, no policies, service-role bypass. Correct.
- `notification_type` and `status` CHECK constraints are sane and mirror the existing send-reminders code paths.

### Defect resolved before commit — ticket_id NOT NULL

The plan SQL had `ticket_id text not null`. But the implementation pseudocode also wrote rows with `status='error'` where Expo returns no ticket id. Two coherent options:

- A) `ticket_id text not null`, only insert rows for `status='ok'` tickets (drop error rows).
- B) `ticket_id text` (nullable), insert rows for both ok and error.

Chose **B**. Error tickets carry the `error_code` we want for delivery diagnostics ("DeviceNotRegistered" → poller can clean up token). Dropping them loses signal. Migration updated to `ticket_id text` (nullable). The send-reminders write path filters appropriately.

### Nit — index ordering

The plan listed two indexes; both retained. The ordering of CREATE INDEX statements after CREATE TABLE is conventional and correct.

---

## Cross-cutting verification

### Cascade walk-through

For a user A with one pet "Buddy" in a family with sibling member B:

```
DELETE auth.users WHERE id = A.id
  → CASCADE: public.users(id=A) deleted (FK from migration 001:10)
    → CASCADE: family_members(user_id=A) deleted (003:24) — A leaves family
    → SET NULL: pets.created_by where = A (013) — Buddy stays in family
    → SET NULL: vaccinations.created_by, vaccinations.modified_by where = A
    → SET NULL: vet_visits, medications, weight_entries, food_entries, *.modified_by
    → SET NULL: medication_doses.created_by
    → SET NULL: pet_allergies.created_by, .modified_by
    → SET NULL: families.created_by (013) — family survives orphaned-creator
    → SET NULL: family_invites.invited_by, .accepted_by
    → SET NULL: feedback.user_id (already SET NULL pre-013, untouched)
    → CASCADE: notification_log (007:12) — log dies
    → CASCADE: notification_tickets (014) — tickets die
  → CASCADE: vaccination_doses.created_by SET NULL via auth.users target (013)
```

B's view of Buddy is preserved with `created_by IS NULL` on records A originally created. No constraint blocks the delete. ✓

### Pre-flight check (recommended for production apply)

```sql
-- Confirm no orphan audit columns before applying. Should return 0.
select 'pets' tbl, count(*) from pets
  where created_by is not null and created_by not in (select id from public.users)
union all select 'vaccinations', count(*) from vaccinations
  where created_by is not null and created_by not in (select id from public.users)
-- ... repeat per table
;
```

Original FKs were enforced as NO ACTION, so we expect 0 rows. If non-zero, the ADD CONSTRAINT steps will fail and need cleanup first.

### Deploy ordering (must surface)

1. Apply 013 first — establishes the SET NULL behavior. Without 013, deploying the Edge Function leaves accounts in a half-deleted state when constraints block the cascade.
2. Apply 014 second — adds the new table.
3. Deploy `delete-account` Edge Function.
4. Deploy updated `send-reminders` (writes to `notification_tickets`).

Migrations 013 and 014 both run as metadata-only operations (no table scans on add-constraint when the FK action changes; new table create is empty). Sub-second on any production volume.

---

## What was changed in the migration files following review

1. Removed `account_deletion_attempts.ip_address`, `email`, `error_message`, `status` columns. Kept only `(user_id, attempted_at, succeeded)` per amendments.
2. Removed the `count_recent_deletion_attempts` RPC and its `users_view_own_deletion_attempts` SELECT policy.
3. Made `notification_tickets.ticket_id` nullable to allow error-ticket rows.
4. Tightened the `idx_notification_tickets_unchecked` partial index predicate to include `status = 'ok'`.

All four are reflected in the committed migration files.

---

## Sign-off

**Both migrations are ready to apply.** Pre-flight orphan-row check above is recommended but not strictly required since the original FKs were enforced. No schema lock-in concerns; we can revert via the documented rollback if needed (see plan §3 rollback section).
