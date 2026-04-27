# Pawlife v1 — Account Deletion Plan: Adversarial Review

**Reviewer:** independent senior staff engineer (no involvement in authoring).
**Plan reviewed:** `docs/pawlife-v1-account-deletion-plan.md` (commit on `main`, 2026-04-27).
**Verdict:** **YELLOW** — directionally sound and well-researched; ready for implementation after a small set of corrections (Section 2 below). Do not green-light as-written.

---

## 1. Verdict

**Yellow.** The FK audit is mostly correct, the storage bucket/path claims check out, and the Edge Function shape is reasonable. But there are two real correctness defects (`feedback.user_id` is misclassified, and `notification_log` survives the cascade chain claim is fine but worth double-checking against the SQL), one auth gap (`userId` body parameter is redundant and slightly increases attack surface), and a handful of operational and CLAUDE.md-compliance items that the plan glosses over. None are fatal; all are fixable in the implementation brief without re-planning.

---

## 2. FK audit corrections

I re-ran the audit by grepping every migration for `references.*users` and walking each one. The plan's count of 16 FK changes is **correct in count but contains one mischaracterisation and one omission worth tightening**.

### Confirmed correct

The 16 constraints listed in §2 of the plan all need to move from NO ACTION → SET NULL. I verified each by source line. Specifically the planner's call-out on `vaccination_doses.created_by → auth.users(id)` (migration 006, line 14) is the trickiest — it's the only audit column that targets `auth.users` directly rather than `public.users`, and the plan handles it correctly in the migration SQL.

### Defect #1 — `feedback.user_id` is more nuanced than the plan states

Migration 008 line 4: `user_id uuid references auth.users(id) on delete set null`. **The FK is already SET NULL.** That's correct.

But the plan's claim in §5 step 5 — "Anonymize feedback rows (user_id NULL, user_email NULL)" run from the Edge Function before `auth.admin.deleteUser` — is **defensive but redundant for `user_id`** and **necessary for `user_email`**. The cascade already nulls `user_id`; the Edge Function only needs to clear `user_email` (the free-text PII column). Functionally identical outcome, so this is a code-quality nit not a correctness issue. Implementation brief should call out: the UPDATE on feedback only needs to set `user_email = null`. Setting `user_id = null` ahead of the cascade is harmless but adds one round-trip.

### Defect #2 — plan does not explicitly enumerate `notification_log.user_id`

§2 of the plan lists this row as "Already correct (no change needed) — CASCADE." That's true (migration 007 line 12 has `ON DELETE CASCADE`). But the plan does not name `notification_tickets.user_id` (its own new table from migration 014) in the FK audit. Migration 014 in the plan declares `references public.users(id) on delete cascade` — that's correct, but it should appear in the audit table for completeness so the post-migration reviewer doesn't have to re-derive it.

### Defect #3 — `family_invites.invited_by` NOT NULL drop

The plan correctly identifies that `family_invites.invited_by` is `not null references public.users(id)` (migration 003 line 41) and proposes dropping NOT NULL in migration 013. Verified — the SQL in §3 does `alter column invited_by drop not null` first, which is required. Good. **One follow-up the plan missed:** there is no application-layer code today that ever inserts `invited_by = NULL`, but the Zod schema / TS type for `FamilyInvite` may declare the column as non-null. Implementation agent must regenerate `types/database.ts` after migration 013 lands and audit `services/familyService.ts:107` (the insert site) — its TS type will quietly become `string | null` for that column and the rest of the code reading invites needs to handle the null on display.

### No other constraints missed

I grepped the entire `supabase/migrations/` tree for `references` against `users`/`auth.users` and the only hits not in the plan's table are the two RPC bodies (`accept_invite`, `leave_family`) which manipulate `family_members` rows — those are ON DELETE CASCADE already (migration 003 line 24) and need no change.

---

## 3. Storage cleanup corrections

**Buckets and paths verified.**

- `services/petService.ts:93` — uploads to `{userId}/{petId}/profile.jpg` in bucket `pet-photos`. Confirmed.
- `services/healthService.ts:273` — uploads to `{userId}/{petId}/{timestamp}_{fileName}` in bucket `vet-attachments`. Confirmed.

Both buckets are user-folder rooted, so `purgeBucketFolder('pet-photos', '${userId}/')` is the correct prefix. The plan is right.

**Grep for any other `.upload(` calls in `services/`, `app/`, `components/` returns only those two locations** — there is no avatar upload, family logo, feedback attachment, or any other bucket. Plan is comprehensive.

**Storage RLS implication the plan does NOT acknowledge:** when the Edge Function uses the service-role client (`admin`), it bypasses RLS and the storage policies in migration 003 lines 322-383 don't apply. That's correct behavior for delete. But the plan should explicitly note this for the post-migration reviewer — service-role bypass means the `pet_photos_delete` policy (which only lets the uploader delete) is intentionally not in play.

**Edge case the plan flags but understates:** "photos uploaded by user A for pets shared with B+C are wiped on A's deletion." This is real and worth stronger language in the in-app body copy than just "all uploaded photos." Suggest: *"Any photos you uploaded — including photos of pets you share with family members — will be removed."*

**Missing edge case the plan does not flag:** the supabase-js `storage.list()` API returns folder entries with `id === null`, but **also returns `name === '.emptyFolderPlaceholder'` for empty folders** in some configurations. The recursive walk in §8 should skip placeholder entries. Low risk — most production buckets don't have these — but a 5-minute defensive check is worth it.

---

## 4. Edge Function concerns

### 4.1 JWT-vs-body redundancy increases surface area

The plan in §5 step 1+2 reads:
```ts
const { userId } = await req.json();
if (userId !== user.id) return 403;
```

This is defense-in-depth in name only. The JWT already carries the user identity in its `sub` claim. Accepting `userId` in the body and matching it to the JWT user creates **zero additional security**, but does add the possibility that a bug in some future caller passes the wrong userId and gets a confusing 403 instead of a clean delete. **Recommendation: drop the body parameter entirely.** Read user identity from `userClient.auth.getUser()` and call `admin.auth.admin.deleteUser(user.id)` directly. Simpler, safer.

If the planner wants belt-and-braces logging, log the body's userId and the JWT's userId on mismatch as suspicious activity — but don't gate on it.

### 4.2 esm.sh import is consistent with `send-reminders` (good)

`supabase/functions/send-reminders/index.ts:6` uses `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`. The plan's Edge Function uses the identical import. ✓

The PostHog observability reviewer recommended raw `fetch` for that Function specifically because PostHog's browser SDK loaded over esm.sh has cold-start issues. That recommendation does **not** apply here — `auth.admin.deleteUser` is a stable supabase-js call, returns synchronously, and Deno's V8 caches the module after first request. esm.sh is fine.

### 4.3 Idempotency — `User not found` regex match is fragile

§5 line 515: `if (delErr && !/User not found/i.test(delErr.message)) throw delErr;`

Regex on an error message string is brittle — Supabase's gotrue errors can change wording across versions. **Better:** check `delErr.status === 404` if the SDK exposes a status code, or check `delErr.code` if there's a stable code. Failing that, the regex is acceptable but worth a `// FIXME: stable error code preferred` comment so the next engineer knows.

### 4.4 Race with `send-reminders` cron — the plan's mitigation is correct but not airtight

Sequence the plan promises:
1. clear push_tokens
2. delete auth.user

If the hourly cron fires between (1) and (2), the user has empty `push_tokens` and `processMedicationReminders` returns early — no notification sent. ✓

If the cron fires between (2) and the cascade settling (which is millisecond-scale but technically not zero), `select … from users where reminders_enabled=true and neq(push_tokens, '[]')` will fail to find the row entirely (cascade dropped it). ✓

**One edge I flagged:** if `auth.admin.deleteUser` succeeds but the cascade is mid-flight when the cron runs, we could get a `family_members.user_id` row pointing to a non-existent user, briefly. The cron's `family_members → pets` join would then fail silently for that user. Acceptable — the cascade completes within a single transaction in Postgres, so this is essentially never observable. No code change needed.

### 4.5 Storage cleanup partial-failure handling is unclear

§5 line 487 says "List + remove for both buckets… use storage list with a prefix and recursive paging, then bulk remove in chunks of 100." §8's pseudocode throws on any list or remove error.

**Question the plan dodges:** if removing batch 5 of 12 fails (e.g. transient 500 from storage), should the Edge Function abort the entire delete (leaving auth user alive but some files gone), or continue and let the cascade proceed (leaving some orphan files in storage)?

I'd recommend: catch storage errors, log them, and **continue to auth.admin.deleteUser anyway**. Orphan files in storage are recoverable by a later sweeper job; an orphaned `auth.users` row with no `public.users` row is a far worse state. Implementation brief should make this explicit.

### 4.6 Rate-limit table choice — `count_recent_deletion_attempts` is OK but RLS surface should be tightened

The SECURITY DEFINER function bypasses RLS to count attempts. That's fine because it only returns an integer, and the function only takes `p_user_id` as a parameter. But: the function is callable by any authenticated user with any UUID, leaking "did this user attempt to delete recently?" info. **Mitigation:** add `where created_at > now() - interval '24 hours' and user_id = p_user_id and auth.uid() = p_user_id` so only the owner can count their own attempts. Alternatively, only call the function from the Edge Function via service role and revoke `EXECUTE` from `authenticated`. The plan doesn't specify — implementation brief should.

---

## 5. Missing items (must add before implementation)

1. **CLAUDE.md rules 6 + 7 enforcement.** The plan mentions DB review and post-migration code review in passing (line 4 + appendix checklist), but does not commission specific subagent runs. Implementation agent's brief must include: "spawn senior DB engineer agent for migration 013 review; spawn second senior engineer for post-implementation code review."
2. **`types/database.ts` regeneration.** Migration 013 changes nullability on `family_invites.invited_by`. After applying, run `npx supabase gen types typescript` and audit downstream callsites for the `string | null` change.
3. **Coordination with the PostHog observability thread.** Both threads modify `app/(main)/settings/index.tsx`. The plan does not mention this or specify merge order. Suggest: PostHog thread lands first (privacy checkbox section), this thread rebases on top and adds Account Management section after Reminders.
4. **App Store privacy nutrition label update.** App Privacy in App Store Connect must be updated to reflect that account deletion clears all user data. This is not a code change but is a manual prerequisite for submission — flag in the deploy ordering.
5. **TestFlight / dev-environment safety.** The reviewer test account on App Store Connect is mentioned, but there's no guidance for internal QA / TestFlight users avoiding deletion of real test data. Recommend: add a banner in `__DEV__` builds saying "Deletion in dev hits the same Edge Function — be careful."
6. **Deletion telemetry through PostHog.** The Edge Function logs to `account_deletion_attempts`, but the in-app entry point (button tap, modal cancel, success) should fire PostHog events for funnel analysis. Privacy-compliant: capture event names only, no email PII. Plan does not address this.
7. **Pending invites the deleted user has accepted but not yet "acted on."** Out of scope per data model, but worth confirming: when A accepts an invite from family X, the `family_invites.accepted_by` is set to A. After A deletes, that goes SET NULL. The accepted invite still shows as "accepted" with no acceptor — visible in admin views. Acceptable for v1; flag for UX agent.
8. **Cached avatar / display-name on other family members' devices.** After A deletes, B's app may render A's stale display_name from cached `family.members` data until B refreshes. v1 acceptable, but worth a follow-up to either invalidate via realtime or refresh on app foreground.

---

## 6. Cuts recommended (overengineered for v1 indie)

1. **`account_deletion_attempts.ip_address` column** — best-effort from req headers, never read by anything in v1, and creates a privacy-disclosure obligation in the App Privacy label (collecting IP). **Drop the column.** If we ever need rate-limiting by IP, add it then.
2. **Empty-family pruning** (plan §3 step 5 already deferred — agree, defer).
3. **The `count_recent_deletion_attempts` RPC** — overkill for indie scale. The Edge Function can do `select count(*) from account_deletion_attempts where ...` directly with the service-role client. One fewer migration object to maintain. Drop it.
4. **Storage list pagination at 1000 items** — fine to keep, but the worst realistic v1 user has <50 photos. The pagination loop is correct but can have a reasonable max-iterations safety to prevent infinite loops on a buggy storage response. Add `if (iterations > 1000) throw`.

---

## 7. Open questions resolved (my stance on planner's 4)

1. **Storage data loss for shared photos** → **Ship v1 as-is.** Body copy must explicitly name "any photos you uploaded, including photos of shared pets." Migrating to family-scoped storage paths is a big refactor (RLS rewrite, copy-on-share data migration) — defer to v1.1. The data loss is real but bounded and disclosed.
2. **Empty-family pruning cron** → **Defer.** Orphan rows are harmless. Add a note in the v1.1 backlog and move on.
3. **5 attempts/24h rate limit** → **Confirm 5 is fine.** The typed-DELETE gate inside ConfirmationModal already prevents accidental triggers. If anything, 5 may be too lenient (a user shouldn't legitimately need more than 1-2 retry attempts even with network errors). I'd accept 5 as locked-in and not relitigate.
4. **`families.created_by IS NULL` rendering audit** → **Yes, include in implementation brief.** Concrete callsites to audit: `services/familyService.ts:42-67` (the `getFamily` query), and any UI that renders "Created by {name}". Likely just the family settings screen. 30-min audit; non-negotiable.

---

## 8. Net new open questions

1. **Should we drop the `userId` body parameter from the Edge Function entirely?** (My recommendation: yes; see §4.1.) Implementation agent should confirm with the user.
2. **Should `account_deletion_attempts` records be auto-pruned?** Without cleanup, this table grows once per deletion attempt forever. Trivial growth at indie scale, but the same `notification_log` cleanup pattern (90-day prune cron) could be added in migration 013. Worth considering — adds 5 lines of SQL.
3. **Storage cleanup partial-failure semantics.** Continue past errors and proceed to auth.admin.deleteUser, or abort? (My recommendation: continue; see §4.5.)
4. **Should deletion trigger a confirmation email to the deleted address?** Apple does not require it. Some apps do it for support recovery. Recommend: skip for v1, log only; revisit if support requests come in.
5. **PostHog deletion-funnel events** — what's the event taxonomy? `account_deletion_modal_opened`, `account_deletion_confirmed`, `account_deletion_failed`? Coordinate with observability thread.

---

## 9. Recommended next step

**Implement as amended.** Specific amendments before commissioning the implementation agent:

1. Drop `userId` from the Edge Function body; rely solely on JWT (§4.1).
2. Drop `ip_address` from `account_deletion_attempts` (§6).
3. Strengthen body copy on shared photos (§3 close).
4. Body of feedback UPDATE only needs `user_email = null` (§2 defect #1).
5. Add to implementation brief: regenerate `types/database.ts`, audit `families.created_by IS NULL` rendering, fire PostHog deletion-funnel events.
6. Implementation agent must spawn senior DB review (rule 6) and post-migration code review (rule 7) — name the subagents in the brief.
7. Coordinate Settings screen merge order with the parallel PostHog thread.
8. Document deploy ordering (migration 013 first, then Edge Function) prominently in the agent's final report.

Total amendment surface: ~30 minutes of plan editing. No re-plan needed. After amendments land, commission the implementation agent in background.
