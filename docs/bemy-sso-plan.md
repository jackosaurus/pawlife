# Bemy — SSO Integration Plan (Apple + Google)

**Status:** planning, not yet implemented
**Audience:** the implementation agent that will pick this up next
**Last updated:** 2026-05-02
**Scope:** add Sign In with Apple and Sign In with Google to the auth flow, alongside the existing email/password fallback.

---

## 1. Executive summary

Bemy currently ships with email + password auth via `supabase.auth.signInWithPassword`. To minimise friction at sign-up — the founder's stated goal — we are adding **Sign In with Apple** and **Sign In with Google** in this release. Apple is non-negotiable: App Store Review Guideline 4.8 requires Sign In with Apple any time another social login is offered, so the two providers ship together. Email + password stays as a fallback for users who decline both. The work is mostly client wiring and provider-dashboard config — Supabase handles token exchange, session persistence, and the `auth.users` row natively. The one schema risk is the `public.users` trigger (`handle_new_user`) which currently writes `new.email` unconditionally; if Apple's private-relay email arrives or the email is missing it must continue to work without raising. We expect ~2–3 agent-days of coding plus the founder's time in the Apple Developer + Google Cloud + Supabase dashboards. **§4 enumerates every auth flow and edge case (provider × user-state matrix, the 5 collision scenarios, support-side recovery, token expiry, outages, account deletion) so the implementation agent has zero ambiguity.**

## 2. Discovery summary

What was already decided or noted in earlier docs/code, with citations:

- **Apple is required if any other social login ships** — `docs/bemy-v1-release-plan.md:42`. Order: Apple first, Google second. Facebook deferred indefinitely.
- **Phasing in the v1 plan was Apple-first / Google-deferred** (`bemy-v1-release-plan.md:60` and the suggested ordering at line 224). The founder has now overridden this — both Apple and Google ship together in this release, Facebook still deferred.
- **Tech-stack note** (`docs/bemy-tech-stack.md:156`): "Social auth (Apple, Google) is a config change in Supabase when ready for Phase 2." True for the backend; ignores native client config.
- **Roadmap reference** (`docs/bemy-roadmap.md:97`): Phase 2 item 5 — "Social sign-in (Apple, Google) — Reduces sign-up friction for broader launch." No design constraints captured.
- **Bundle ID is settled** as `com.beebles.bemy` (`app.json:14, app.json:24`). The earlier plan worried about `com.jackdinh.pawlife` → rename — that rename has happened. Apple Services ID + Google client IDs can be provisioned against the final bundle ID with no future migration.
- **Existing email/password flow lives in `services/authService.ts:5-95`** — methods `signUp`, `signIn`, `signOut`, `getSession`, `resetPassword`, `changePassword`, `deleteAccount`. Funnel analytics already wrap signup (`auth_signup_started`, `auth_signup_failed`). New SSO methods should mirror this instrumentation.
- **`auth.users` → `public.users` is auto-populated by a trigger** in `supabase/migrations/001_initial_schema.sql:17-28`. The trigger does `insert into public.users (id, email) values (new.id, new.email)`. `email` in `public.users` is `not null` (`001_initial_schema.sql:11`). **This is the schema-level risk** — see §9.
- **Display name is nullable** (`supabase/migrations/005_user_display_name.sql:2`). That's fine — Apple full name is one-shot (returned only on first sign-in), Google gives it freely; either way we can populate `display_name` after the fact via `userService` when present.
- **No SSO packages installed.** `package.json` confirmed: no `expo-apple-authentication`, no `@react-native-google-signin/google-signin`, no `expo-auth-session`. `expo-web-browser@~15.0.10` is already present (used today for the Privacy Policy link in `app/(auth)/sign-up.tsx:6`) — useful for Google's PKCE-via-browser path.
- **Memory grep returned nothing** under `apple|google|sso|oauth` in `~/.claude/projects/.../memory/` — no prior agent context to honour or override.
- **No existing `docs/*sso*` or `docs/*auth*` planning docs.** This doc is the canonical SSO plan.

## 3. Decisions to lock in before implementation

These are the open questions that, if left ambiguous, will bounce the implementation back to planning. Recommendation + reasoning for each.

### 3.1 What do we do with Apple's private-relay email?

**Decision:** store it as-is. Treat `*@privaterelay.appleid.com` as a valid email for all internal purposes.

**Reasoning:** Apple's private relay forwards mail to the user's real address. We send no marketing; the only outbound mail today is Supabase password recovery, and a private-relay user wouldn't use password recovery anyway (they signed in with Apple). No relay-detection code needed in v1. Document the constraint in `docs/privacy-policy.md` only if the privacy review flags it.

### 3.2 What if the SSO provider returns no email at all?

**Decision (Apple):** Apple's identity token always carries an email on first sign-in (real or relay). Subsequent sign-ins do not return email — but Supabase has already stored it from the first exchange. So no missing-email path on Apple.

**Decision (Google):** Google requires the user to consent to the `email` scope. If they decline, we abort with a friendly error: "Bemy needs your email to create an account. Try Apple Sign In or use email + password instead." No fallback flow that creates an emailless user.

**Reasoning:** the `public.users.email NOT NULL` constraint forces our hand. Loosening that constraint is doable but introduces a "what's the user's identity?" question we don't want to answer for a hobby project.

### 3.3 Account linking — what if a user signs up by email then later signs in with Google using the same email?

**Decision:** **defer linking to v1.x.** Supabase's default behaviour is to create a separate `auth.users` row per provider, even on email collision. We accept that. If a user reports it, we resolve manually in Supabase dashboard. **The full collision matrix and recovery runbook live in §4.2 + §4.4.**

**Reasoning:** explicit linking requires a dedicated UX (challenge the user to prove ownership of the existing email account, then merge) and deeper Supabase plumbing (`identities` table, `linkIdentity` API). The complexity is real and the founder's audience is small. Document the tradeoff in the privacy policy and in-app help if it ever becomes a support burden.

**Tradeoff to surface to the founder:** if you (or a future user) sign up with `you@gmail.com` via email today, then later try Google sign-in with the same Gmail, you'll get a second account with no pets in it. The fix in v1.x will require an account-merge flow.

### 3.4 Does email + password stay?

**Decision:** **yes, keep it as a tertiary fallback.** Demote it visually — small "Use email instead" link below the SSO buttons.

**Reasoning:** removing it would orphan any test or staging accounts and make Supabase's password reset feature dead code we'd then need to rip out. Cost of keeping is two text inputs and a button on a secondary screen.

### 3.5 Apple "Hide my email" — does that count as PII?

**Decision:** yes, treated identically to a real email address from a privacy-policy standpoint. Already covered by current `docs/privacy-policy.md` language ("we store your email"). No copy change needed.

### 3.6 Do we ask for the user's name on first SSO sign-in?

**Decision:** for Apple, capture `fullName` if returned on first auth, write to `public.users.display_name`. For Google, take `user_metadata.full_name` from Supabase's `getSession()`. Don't prompt — frictionless is the goal.

---

## 4. Auth flow matrix — every scenario, every decision

This section enumerates every credible auth scenario. The implementation agent should treat each cell / row as a behavioural spec — if the code does not match, it's a bug. The table style mirrors §5.5 and §6.5.

The Supabase identity model assumed throughout:

- One `auth.users` row per `(provider, sub)` pair. `provider ∈ {email, apple, google}`. `sub` is provider-side user ID (Apple `sub`, Google `sub`, or Supabase-generated UUID for email).
- Supabase **does not auto-link** by email. Two different providers using the same email address produce **two** `auth.users` rows (and therefore two `public.users` rows via the `handle_new_user` trigger at `supabase/migrations/001_initial_schema.sql:17-28`).
- Account merging requires manual SQL in the Supabase dashboard. Bemy v1 does not ship a self-serve merge UI (see §3.3).

### 4.1 Provider × user-state matrix

Rows = the auth method the user **just tapped**. Columns = the prior state of the system for that email address.

| Method tapped → / Prior state ↓ | No prior account | Existing email-only account (same email) | Existing Apple-only account (same email) | Existing Google-only account (same email) |
|---|---|---|---|---|
| **Email + password (sign-up)** | New `auth.users` row created with `provider=email`. New `public.users` row via trigger. User lands in `(main)` empty state. | Supabase rejects with `User already registered`. Surface as toast: "An account with this email already exists. Sign in instead." Tap routes to `sign-in.tsx`. | A second `auth.users` row is created (`provider=email`), with same email but distinct `id`. User now has **two accounts**. *No code-side prevention in v1 (see §4.2 C2 for rationale).* | Same as Apple-only column — second row is created, user has two accounts. |
| **Email + password (sign-in)** | Supabase returns `Invalid login credentials`. Surface as toast: "No account found, or wrong password." Existing copy. | Standard sign-in. Session returned. User lands in `(main)`. | Returns `Invalid login credentials` (no `provider=email` row exists). User sees "Wrong password." **This is the C2 confusing case.** v1 leaves copy as-is; §4.5 proposes a soft hint deferred to v1.x. | Same as Apple-only — `Invalid login credentials`. Same C2 confusion. |
| **Apple SSO (first tap on this device)** | New `auth.users` row created with `provider=apple`. `display_name` populated from `fullName` if returned. User lands in `(main)` empty state. | Second `auth.users` row created (`provider=apple`). Two accounts. *Allowed; see C1.* | Standard sign-in. Same Apple `sub` matches existing row. Session returned. | Second `auth.users` row created (`provider=apple`). Two accounts. *Allowed; see C3/C4.* |
| **Google SSO** | New `auth.users` row created with `provider=google`. `display_name` populated from `user_metadata.full_name`. User lands in `(main)` empty state. | Second `auth.users` row created (`provider=google`). Two accounts. *Allowed; see C1.* | Second `auth.users` row created (`provider=google`). Two accounts. *Allowed; see C3/C4.* | Standard sign-in. Same Google `sub` matches existing row. Session returned. |

**Implementation-agent reading of this table:**

- The "two accounts get created" cells are **not bugs**. They are the documented v1 behaviour. Do not add pre-flight email-existence checks.
- The "Supabase rejects" cell for email-on-email is the only error path that needs explicit copy. The string lives in `app/(auth)/sign-up.tsx` error block (line 46-50) — already wired to display `error` from the store. **Founder confirmed:** intercept in `authService.signUp` and rethrow with friendlier copy: `"An account with this email already exists. Sign in instead."` (Supabase's default `User already registered` is too terse and doesn't suggest the recovery path.)
- All "session returned, lands in `(main)`" cells use the same code path: the `onAuthStateChange` listener at `stores/authStore.ts:32` fires, `_layout.tsx` redirect logic routes the user.

### 4.2 The 5 collision scenarios — explicit decision per scenario

For each, the implementation agent's job is to **match the listed behaviour exactly**. Recovery paths are the founder's job (manual SQL in Supabase dashboard — see §4.4).

#### C1 — Email signup → later SSO sign-in with same email

- **Trigger:** user signs up with `you@gmail.com` + password on day 1, then on day 30 taps "Continue with Google" with the same Gmail address.
- **Default Supabase behaviour:** creates a new `auth.users` row with `provider=google`. Session is for the new row. The `public.users` trigger fires and creates a second `public.users` row.
- **What the user sees AFTER:** they land in `(main)` with an empty pet list. No pets, no records. Their original account still exists but is unreachable from this session.
- **Decision:** **ALLOW (separate accounts).** Do not block, do not auto-link.
- **Reasoning:** auto-linking requires server-side proof-of-ownership (e.g. send-magic-link to the email and require click) which we don't have infrastructure for. Blocking would require a pre-flight `select id from auth.users where email = ? and provider = 'email'` — we cannot run this from the client (RLS), and it would require an Edge Function. Disproportionate to the audience size. The empty-state on `(main)` is itself a strong signal that something is off; the user will likely sign out and try the other method or contact support.
- **Implementation note:** none. Existing code paths handle this.
- **Recovery path (founder, on support email):** see §4.4 SQL recipe — reassign the user's `pets` and downstream FKs to whichever `auth.users` row they want to keep, then `delete from auth.users where id = <abandoned>`. Cascade in migration 013 cleans the rest.

#### C2 — SSO signup → later email sign-in with same email

- **Trigger:** user signs up via "Continue with Google" on day 1, then on day 30 taps "Use email instead" → "Sign In" and types email + a guessed password.
- **Default Supabase behaviour:** `signInWithPassword` returns `Invalid login credentials` because no `provider=email` row exists for that email.
- **What the user sees AFTER:** generic "Invalid login credentials" / "No account found" toast. They are most likely to interpret this as "I forgot my password," tap reset, and confuse themselves further (Supabase will email a reset link that, when followed, sets a password and creates a `provider=email` row — yielding two accounts).
- **Decision:** **ALLOW (separate accounts), but ship a v1 nudge.** Do not block. Do not auto-link.
- **Reasoning:** blocking would require the same pre-flight check as C1 and is rejected for the same reason. However, the C2 confusion ceiling is higher than C1 (user goes through password-reset flow before realising), so we ship the **mitigation in §4.5** — "Use the same method you signed up with" caption on the welcome screen, plus remembered-last-method on this device.
- **Implementation note:** the welcome-screen caption + last-method memory live in `app/(auth)/welcome.tsx`. Storage backend: `AsyncStorage` (the same storage the Supabase client already uses — see `services/supabase.ts:10`; founder confirmed this choice over `expo-secure-store` since the value is a non-sensitive UX hint, not a credential). Key: `bemy.lastAuthMethod`. Values: `email` / `apple` / `google` / null. Write on every successful sign-in. Read on welcome screen mount. Visually emphasize last-used (e.g. soft border highlight or "Last used" badge).
- **Recovery path (founder):** if the user opened a reset-password email and now has two accounts: pick canonical, reassign FKs, delete abandoned. §4.4.

#### C3 — Apple signup → later Google sign-in with same email

- **Trigger:** user taps "Continue with Apple" with `you@privaterelay.appleid.com` (or with their real email if they didn't elect to hide). Later, on the same install, taps "Continue with Google" with `you@gmail.com`. **In practice, the email address won't match for relay users** — but if the user originally elected "Share my email" with Apple and the email is the same Gmail used in Google, the addresses collide.
- **Default Supabase behaviour:** new `auth.users` row with `provider=google`. Two accounts. Session is for the new row.
- **What the user sees AFTER:** empty `(main)` (different account). Likely confused, may sign out and re-tap Apple to recover.
- **Decision:** **ALLOW (separate accounts).** Same as C1.
- **Reasoning:** in the most common subcase (Apple relay email ≠ Google email), the addresses don't even collide and the two accounts are genuinely distinct user-intent. In the less common subcase (matching emails), the user has explicitly tapped two different SSO buttons — they're more likely experimenting than mistaking. Don't be paternalistic.
- **Implementation note:** none.
- **Recovery path:** §4.4.

#### C4 — Google signup → later Apple sign-in with same email

- **Trigger:** mirror of C3.
- **Default Supabase behaviour:** new `auth.users` row with `provider=apple`. Two accounts.
- **What the user sees AFTER:** empty `(main)`.
- **Decision:** **ALLOW (separate accounts).** Same as C3.
- **Reasoning:** same as C3. Symmetric.
- **Implementation note:** none.
- **Recovery path:** §4.4.

#### C5 — Same SSO provider, different identity (re-sign-in with a different account)

- **Trigger:** user A is signed in on the device. User A signs out. A different person picks up the device, taps "Continue with Apple" with **their own Apple ID** (different `sub`). Or: original user signs into iCloud with a different Apple ID and then opens Bemy.
- **Default Supabase behaviour:** Apple's `sub` is different → new `auth.users` row with `provider=apple`. Distinct account from the first user. This is the **correct, desired** behaviour — it is how multi-user device sharing works.
- **What the user sees AFTER:** empty `(main)`. No data leakage from user A — RLS scoped to `user_id` ensures the second user sees none of the first user's pets.
- **Decision:** **ALLOW (this is the desired behaviour, not a collision).**
- **Reasoning:** matching by Apple `sub` is the security boundary. Two different `sub`s = two different humans (per Apple's contract). We must not link them.
- **Implementation note:** confirm sign-out fully clears the Supabase session in `AsyncStorage` (Supabase's RN adapter should handle this; verify in `services/supabase.ts`). The `bemy.lastAuthMethod` key from §4.5 should also be cleared on explicit sign-out (so the new user isn't shown the previous user's preferred method).
- **Recovery path:** none — this is correct. If a user complains "my data is gone" after this, the support response is: "Sign out, then sign back in with your original Apple ID (the one with `XYZ` email)."

**Summary of decisions (TL;DR for the implementation agent):**

| # | Block / Allow / Link | Pre-flight check needed? | New code? |
|---|----------------------|--------------------------|-----------|
| C1 | Allow (separate accounts) | No | None |
| C2 | Allow + soft nudge (§4.5) | No | Welcome-screen caption + last-method memory |
| C3 | Allow | No | None |
| C4 | Allow | No | None |
| C5 | Allow (correct behaviour) | No | Clear `lastAuthMethod` on sign-out |

### 4.3 First-time SSO sign-in for a brand-new user

SSO blurs the sign-up vs sign-in distinction. There is no separate "Sign up with Apple" / "Sign in with Apple" — the same `Continue with Apple` button handles both, because Supabase's `signInWithIdToken` is upsert-shaped: if the (provider, sub) tuple is new, it creates the row; if it exists, it returns the existing session.

**Spec for the post-create flow:**

1. Tap "Continue with Apple" / "Continue with Google".
2. Provider-side modal completes. `supabase.auth.signInWithIdToken` returns a session.
3. `auth.users` row created. `handle_new_user` trigger fires → `public.users` row created.
4. If display name returned (Apple `fullName` on first sign-in only; Google `user_metadata.full_name` always), `userService.updateDisplayName` is called.
5. `onAuthStateChange` listener at `stores/authStore.ts:32` fires.
6. Root layout redirect routes the user to `app/(main)/index.tsx` — the dashboard.
7. Dashboard renders the **existing empty state** (no pets) — already implemented for first-time email signups, covered by `usePets()` returning `[]`. No new empty-state copy needed for SSO; the user-flow is identical past this point.

**Privacy-policy consent for first-time SSO:**

- **Decision (already in §3 / §8.2):** tapping "Continue with Apple" / "Continue with Google" on the welcome screen counts as implicit consent because the persistent footnote ("By continuing you agree to the Privacy Policy") sits directly below the buttons.
- **What gets logged:** see §4.12 — there is currently **no consent column** in `public.users`. The email-flow checkbox at `app/(auth)/sign-up.tsx:102-132` is a UI gate (disables the button until checked) but writes nothing to the DB. Implementation parity for SSO is therefore: do nothing extra. The privacy-policy URL is the legal anchor; the audit trail is "the user's `auth.users` row exists, and at the time it was created the welcome screen showed the consent footnote."
- **If the founder later wants a consent log:** see §4.12 for the proposed (deferred) column.

### 4.4 Recovery + support-side flow (founder runbook)

When a user emails saying "I lost my pets" or "I have two accounts," the founder runs this in Supabase SQL editor. **All steps are destructive — back up first** (Supabase project → Database → Backups → take manual snapshot).

**Step 0 — identify the two `auth.users` rows:**

```sql
select id, email, raw_app_meta_data->>'provider' as provider, created_at
from auth.users
where email = 'user@example.com'
order by created_at;
```

If there is only one row, the user's confusion is something else (forgotten Apple ID, signed into a different iCloud account — see C5). Stop here and reply with sign-in instructions.

**Step 1 — pick the canonical account.** Usually the one with pets / records. Confirm:

```sql
select count(*) from public.pets where user_id = '<id-A>';
select count(*) from public.pets where user_id = '<id-B>';
```

**Step 2 — reassign FKs from abandoned → canonical.** The FK chain rooted at `public.users.id`:

```sql
-- pets cascade carries vaccinations, medications, weight, food, vet_visits.
update public.pets       set user_id = '<canonical-id>' where user_id = '<abandoned-id>';
-- Family memberships (migration 003).
update public.family_members set user_id = '<canonical-id>' where user_id = '<abandoned-id>';
-- Anything else with user_id FK — check migrations 003, 008, 014 for the full list.
update public.feedback   set user_id = '<canonical-id>' where user_id = '<abandoned-id>';
-- Re-run with the user's actual email scoping if the user has many rows; this template assumes a single user.
```

**Step 3 — delete the abandoned `public.users` row** (cascades downstream tables that didn't get reassigned, e.g. `notification_preferences`):

```sql
delete from public.users where id = '<abandoned-id>';
```

**Step 4 — delete the abandoned `auth.users` row.** Use the Supabase dashboard (Authentication → Users → … → Delete user) so the auth-side cascades fire correctly. SQL works too:

```sql
-- Only if the public.users delete succeeded.
delete from auth.users where id = '<abandoned-id>';
```

**Step 5 — reply to the user:**

> Hey [name], I found two accounts under your email — one created with [method A] and one with [method B]. I've merged them: your pets are now on the [canonical method] account. To avoid this in future, please sign in with **[canonical method]** going forward. Sorry for the confusion!

**Founder note:** keep a private log of these merges (e.g. a Notion page) — if the count climbs above ~5, that's the signal to build a self-serve linking UX in v1.x.

### 4.5 UI hints to PREVENT collisions

Cheap mitigations that reduce C1/C2 confusion without server-side pre-flight checks. Recommendations marked **[ship v1]** vs **[defer v1.x]**.

#### 4.5.1 Welcome-screen caption — **[ship v1]**

One-line caption directly below the SSO buttons:

> *"Use the same method you signed up with to keep your data."*

- Cost: ~2 lines of JSX in `welcome.tsx`. No state, no network.
- Effectiveness: medium. Won't help users who don't read, but it surfaces the issue at the highest-leverage moment.

#### 4.5.2 Remembered last-method on this device — **[ship v1]**

Read/write a single string from `AsyncStorage` (the same storage the Supabase client uses; see `services/supabase.ts:10`). Key `bemy.lastAuthMethod`, values `email | apple | google | null`.

- Write: in `authService.signIn`, `signInWithApple`, `signInWithGoogle`, on success.
- Read: in `welcome.tsx` on mount.
- Render: visually emphasise the last-used button (e.g. a small "Last used" pill above it, or a soft brand-coloured border). Do **not** auto-tap it — the user must press deliberately.
- Clear: in `authService.signOut` (so the next user on a shared device isn't nudged toward the previous user's method).

Cost: ~30 lines across the service + welcome screen. Tests: easy (mock `@react-native-async-storage/async-storage`).

#### 4.5.3 Soft warning on email→SSO collision — **[defer v1.x]**

If user taps Apple/Google with an email that already has a `provider=email` account, show: *"This email already has an account. Sign in with email instead?"*

- **Why defer:** requires a pre-flight server check — RLS prevents direct query of `auth.users` from the client, so we'd need an Edge Function (`auth-method-lookup`) that takes an email and returns `{ providers: ['email', 'google'] }`. Building this is non-trivial and introduces an enumeration vulnerability (an unauthenticated endpoint that reveals which emails are registered) that needs rate-limiting + Captcha-style mitigations.
- **Trigger to revisit:** if the manual-merge runbook in §4.4 is invoked more than ~5 times.

#### 4.5.4 "Sign in with [method]" memory across devices — **[defer indefinitely]**

Storing last-method in the user's Supabase profile (so it follows them across devices) is overkill for a hobby app. Skip.

### 4.6 Account deletion with potentially-duplicate accounts

Existing flow (`app/(main)/settings/index.tsx:171-202`): "Delete Account" → confirmation modal → `authService.deleteAccount` → `delete-account` Edge Function → `auth.admin.deleteUser` → cascade per migration 013 → `signOut`.

- **What this deletes:** the `auth.users` row of the **currently-signed-in session**, plus all cascaded data.
- **What this does NOT delete:** any sibling `auth.users` row sharing the same email (created via a different provider in a C1–C4 collision the user never knew about).
- **Spec:** add a one-line caption inside the delete-account confirmation modal (or directly above the destructive button on the settings screen):

  > *"This deletes the account you're signed into. If you also signed up with a different method (Apple/Google/email) using the same email, that account is separate — sign into it and delete it too."*

- **Implementation note:** locate the existing confirmation copy in `app/(main)/settings/index.tsx` (around the `ConfirmationModal` invocation near line 171) and add the caption to its body. No code change to `authService.deleteAccount` — its scope is correct.
- **Why not auto-detect siblings:** would require the same enumeration-prone Edge Function as §4.5.3. Rejected.

### 4.7 Re-authentication for sensitive actions

**Current state:** Bemy's `deleteAccount` flow at `app/(main)/settings/index.tsx:171-196` does **not** re-prompt for password. The `ConfirmationModal` is the only gate. (My brief overstated this — there is no current re-auth ceremony to mirror.)

**Decision:** **keep parity — no re-auth for SSO either.** The `ConfirmationModal` confirmation is sufficient because:

1. The device is already gated by Apple/Google/iOS auth before reaching Bemy.
2. SSO sign-in is itself device-gated (Touch ID / Face ID / passkey on the platform side).
3. Adding a re-auth ceremony for SSO (re-tapping "Continue with Apple") adds friction with no security delta.

**Implementation note:** none. Existing `ConfirmationModal` covers all three providers identically.

**If the founder later wants stricter delete-account gating:** the v1.x option is a two-step modal with a typed-confirmation field (`type "delete" to confirm`) — provider-agnostic, no re-auth wiring.

### 4.8 Token refresh, expiry, and silent logout

Supabase RN client default: access token TTL = 1 hour, refresh token TTL = 60 days (sliding). The client auto-refreshes in the background. The session is persisted via `AsyncStorage` (Supabase RN adapter — see `services/supabase.ts:10`).

**Failure modes:**

| Failure | What happens | What to ship |
|---|---|---|
| Network down at refresh time | Client retries on next foreground. Existing access token may or may not still be valid. If both expire while offline, the next API call returns 401 → `onAuthStateChange` fires `SIGNED_OUT`. | **Toast on auth state change to SIGNED_OUT** (only when not user-initiated). Copy: *"You've been signed out. Please sign in again."* — see implementation note below. |
| Refresh token revoked (user signed out elsewhere; admin revocation) | Next refresh attempt returns 400 invalid_grant → `SIGNED_OUT` event. | Same toast as above. |
| Refresh token expired (60 days inactive) | Same as revocation. | Same toast. |
| Provider revoked (user removed Bemy from Apple ID → Settings → Sign in with Apple) | Apple does not invalidate the Supabase refresh token directly. Next time the user attempts SSO sign-in, Apple will require re-consent. No code change needed. | None. |

**Implementation note (silent-logout toast):**

- In `stores/authStore.ts`, the existing `onAuthStateChange` listener at line 32 currently only sets `session`. Extend it to detect involuntary sign-outs:
  - Track a `userInitiatedSignOut: boolean` flag in the store. Set to `true` at the start of `authStore.signOut`, reset to `false` after the listener fires.
  - When the listener receives a `SIGNED_OUT` event with `userInitiatedSignOut === false`, surface the toast via the existing toast mechanism (see how `settings/index.tsx:186` calls `showToast` — wire the same path).
- This handles the silent-logout copy without affecting the explicit "sign out" tap.

### 4.9 Service outages (provider IdP failures)

**Apple IdP 5xx:** `AppleAuthentication.signInAsync` rejects with a generic error (no specific `ERR_NETWORK` code). Caught by the existing try/catch in §7.1's `signInWithApple`. Toast: *"Couldn't reach Apple. Please try again."*. Logged via `observabilityService` with `provider: 'apple', reason: <error.message>` for triage.

**Google IdP slow / 5xx:** `GoogleSignin.signIn()` rejects with `IN_PROGRESS` (already mid-call) or a generic error. Same handling. Toast: *"Couldn't reach Google. Please try again."*.

**Supabase down (token-exchange 5xx):** `signInWithIdToken` returns an error. Toast: *"Sign-in failed. Please try again in a moment."*. Tag log with `provider: <apple|google>, stage: 'supabase_exchange'`.

**Spec for the implementation agent:** all three error toasts are mutually exclusive cases inside the `catch` block in `services/authService.ts`. Branch on which awaited call threw. Every error path logs to `observabilityService` with at minimum `{ provider, stage, reason }` so the founder can grep Sentry/PostHog for `provider:apple stage:supabase_exchange` etc.

### 4.10 Pre-iOS-13 + no-Play-Services UX

**iOS < 13 (Apple Sign In not available):**

- `AppleAuthentication.isAvailableAsync()` returns `false`.
- Hide the Apple button entirely. Keep Google + email-fallback link.
- The welcome screen renders with one SSO button + one fallback. Still feels intentional.

**Android without Play Services:**

- `GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false })` returns `false` (or throws).
- **Decision:** still render the Google button, but on tap show the existing toast *"Update Google Play Services to sign in with Google."* (already in §5.5 / soon §6.5). Do not pre-hide — the user may not yet know they're missing Play Services, and hiding gives them no path forward; the toast does.
- Email fallback always available.

**Both unavailable simultaneously (very rare — old iPad without internet to Apple servers, or rooted/de-Googled Android):** the welcome screen shows only the email link. Caption above the link: *"Sign up with your email to get started."*. Implementation: conditional render based on `isAvailableAsync()` + Play-Services check; if neither SSO is available, swap the `Use email instead` link to a primary `Get Started` button.

### 4.11 Display name handling

**Decision:** populate `public.users.display_name` on **first SSO sign-in only**. Do not update on subsequent sign-ins.

**Reasoning:** Bemy already lets the user edit `display_name` in Settings (`app/(main)/settings/index.tsx:204-219`). If we re-pulled from the provider on every sign-in, we'd clobber the user's chosen Bemy name with whatever they had in their Google profile. First-only matches user intent ("Bemy gave me a sensible default; I'll change it if I want").

**Implementation note:**

- Apple: `fullName` is returned **only on the first sign-in by Apple's design** — easy. Always-write when present.
- Google: `user_metadata.full_name` is returned **every** sign-in. Gate the write on "is this the first sign-in for this user?". Easiest signal: check `public.users.display_name` first via `userService.getProfile`; only call `updateDisplayName` if the existing value is null/empty.
- Pseudo-code in `signInWithGoogle`:

  ```
  const session = await supabase.auth.signInWithIdToken(...);
  const profile = await userService.getProfile(session.user.id);
  if (!profile.display_name && session.user.user_metadata?.full_name) {
    await userService.updateDisplayName(session.user.user_metadata.full_name);
  }
  ```

- The extra `getProfile` call is cheap (one row by PK) and avoids a "where does first-sign-in detection live" question. Acceptable.

### 4.12 Privacy-policy consent log

**Current state:** the email-flow consent checkbox (`app/(auth)/sign-up.tsx:102-132`) is a UI gate only. It disables the "Create Account" button until checked but writes **nothing** to the database — confirmed by reading `services/authService.ts` (no consent field passed to `signUp`) and the schema migrations 001–014 (no consent column).

**Decision:** **do not add a consent column for SSO.** Keep the email checkbox as a UX hint. For SSO, "tap = consent" with the persistent footnote on welcome screen as the legal anchor. No DB write.

**Reasoning:**

- Consistent with existing email behaviour — adding consent logging only for SSO would create a worse audit trail than the email path (asymmetric).
- A hobby app pre-launch with no GDPR enforcement target. The privacy policy itself is the contract; the row's `created_at` is the proof of consent timestamp.
- If the privacy reviewer later flags this, the v1.x fix is a generic `users.privacy_consent_at timestamptz` column written by both flows on first sign-in — single migration, no asymmetry.

**Implementation note:** none for v1. If the founder wants consent logging now (open question §13.5), the migration is:

```sql
-- DEFERRED — only if privacy reviewer requires.
alter table public.users
  add column privacy_consent_at timestamptz,
  add column privacy_consent_method text check
    (privacy_consent_method in ('email_checkbox', 'sso_button_apple', 'sso_button_google'));
```

Both paths would write on first sign-in via the trigger (or the service layer post-sign-in). Triggers CLAUDE.md rules 6 + 7 if shipped.

### 4.13 Things explicitly NOT handling in v1 (do not "fix")

The implementation agent must treat each of these as **out of scope**. Adding code for them is a planning violation, not a feature.

- **Apple "Hide my email" → real email surfaced later.** Not supported by Apple's relay model. User changes their setting in Apple ID → Sign in with Apple → Bemy. We do not detect or remediate.
- **Self-serve account merge UX.** Deferred to v1.x. See §3.3 + §4.4. Recovery path is manual SQL via the founder.
- **Pre-flight email-existence check.** §4.5.3 — deferred indefinitely (enumeration vulnerability, requires Edge Function).
- **Magic link / email OTP / passkey.** Out of scope for this project altogether.
- **Cross-device "last method" memory.** §4.5.4 — deferred indefinitely.
- **Auto-link by email when providers collide.** Explicitly rejected per §3.3. Two `auth.users` rows is the v1 reality.
- **Provider re-authentication for sensitive actions.** §4.7 — confirmation modal only, no re-tap of SSO button.
- **Privacy-consent DB column.** §4.12 — deferred unless reviewer flags.
- **Display-name re-sync from provider on every sign-in.** §4.11 — first-only, by design.
- **Apple Sign In on Android (web flow).** §5.3 / §13.4 — not in scope; iOS only.
- **Facebook SSO.** §2 — deferred indefinitely.

If the founder asks for any of these post-v1, treat as a new planning round, not an in-flight extension.

---

## 5. Apple Sign In specifics

### 5.1 Package

- `expo-apple-authentication` — Expo SDK 54 compatible version is `~8.0.x` (verify exact pin via `npx expo install expo-apple-authentication`). It is a **config plugin** — adding it triggers a native rebuild via EAS. Cannot be hot-loaded into an existing dev client.

### 5.2 Apple Developer Portal config

Founder action items (the implementation agent cannot do these — they require Apple Developer credentials):

1. Apple Developer → Certificates, Identifiers & Profiles → Identifiers → `com.beebles.bemy` → enable **Sign In with Apple** capability. Save.
2. Create a **Services ID** (separate from the App ID). Suggested suffix: `com.beebles.bemy.signin`. Configure web auth → primary domain = the Supabase project domain (`<project-ref>.supabase.co`), return URL = `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Create a **Sign in with Apple key** (Keys → + → enable Sign in with Apple). Download the `.p8` once (it's irretrievable after the modal closes). Note the Key ID and Team ID.
4. In **Supabase dashboard → Authentication → Providers → Apple**, enable, paste:
   - Services ID = `com.beebles.bemy.signin`
   - Team ID
   - Key ID
   - Private key contents (paste the `.p8` body)

### 5.3 EAS / native config

`app.json` plugins array gains an entry:

```jsonc
[
  "expo-apple-authentication"
]
```

After this, run `eas build --profile preview --platform ios` to produce a build with the new entitlement. Existing Expo Go / dev clients without the plugin will throw at runtime when the native module is missing — guard the call site with `AppleAuthentication.isAvailableAsync()` and hide the button on Android (Apple Sign In is iOS-only in this app's scope; we are not adding Android-side Apple support, which would need the JS-only web flow).

### 5.4 Device flow

```
User taps "Continue with Apple"
  → AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })
  → returns { identityToken, fullName, email, user }
  → supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken })
  → Supabase verifies the token signature against Apple's JWKS,
    creates auth.users row if new, returns Session
  → onAuthStateChange listener in stores/authStore.ts:32 picks up the session
  → router redirects to (main)
```

`fullName` is **only returned on the first sign-in**. If present, call `userService.updateDisplayName()` (already exists for the email flow's display-name UI) before navigating away.

### 5.5 Edge cases

| Case | Handling |
|------|----------|
| User cancels modal | `signInAsync` rejects with `ERR_REQUEST_CANCELED`. Swallow silently — no error toast. |
| Network failure during Supabase exchange | Show toast "Couldn't sign in with Apple. Please try again." Log via `observabilityService`. |
| Token exchange fails (provider misconfigured) | Same toast. Log with `provider: 'apple'` tag. Founder will see it in Sentry/PostHog if it ever fires post-launch. |
| Private relay email | Store as-is. No special handling. |
| User signs in on a second device with same Apple ID | Supabase recognises the existing `auth.users` row by Apple `sub`. Same account. Works out of the box. |

---

## 6. Google Sign In specifics

### 6.1 Library choice

**Decision: use Supabase's native ID-token flow with `@react-native-google-signin/google-signin`.**

Rationale: of the three options —

- `@react-native-google-signin/google-signin` (native modal, returns ID token, hand to Supabase via `signInWithIdToken`) — **cleanest UX, native modal, no browser detour**, but adds a native module (config plugin, requires EAS rebuild).
- `expo-web-browser` + Supabase `signInWithOAuth` — works in Expo managed, but pops a browser, has a deeplink-back step that's flaky on iOS, and the UX is visibly worse than Apple's native modal sitting next to it.
- `expo-auth-session` — most flexible, most code to maintain. Overkill for Bemy.

Since we're already taking the EAS rebuild hit for Apple, the marginal cost of adding a second config plugin for Google is near zero, and the UX win is significant. Native modal next to Apple's native modal looks consistent and feels first-class.

Package: `@react-native-google-signin/google-signin` — confirm Expo SDK 54 compatibility before pinning. Latest as of writing: `^13.x`. Verify via `npx expo install` for the SDK 54 - compatible pin.

### 6.2 Google Cloud config

Founder action items:

1. Google Cloud Console → APIs & Services → Credentials → create three OAuth 2.0 Client IDs (Google requires platform-specific clients):
   - **iOS** — Bundle ID `com.beebles.bemy`. Capture the iOS Client ID (looks like `xxx-yyy.apps.googleusercontent.com`) **and** the reversed iOS URL scheme (`com.googleusercontent.apps.xxx-yyy`).
   - **Android** — Package name `com.beebles.bemy`, SHA-1 fingerprint from EAS Android credentials (`eas credentials -p android` to retrieve).
   - **Web** — needed because Supabase verifies Google ID tokens against the Web client audience. Capture the Web Client ID. Authorized redirect URI = `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Configure OAuth consent screen — app name "Bemy", support email = `beeble.ptyltd@gmail.com`, scopes `email`, `profile`, `openid`. Test users while in unverified state; submit for verification before public launch.
3. **Supabase dashboard → Authentication → Providers → Google**, enable, paste:
   - Client ID = the **Web** Client ID (this is what Supabase verifies the audience against, even though sign-in happens via the iOS/Android client)
   - Client Secret = Web client secret
   - Tick "Skip nonce checks" only if necessary; native `google-signin` v13+ supports nonce, prefer leaving on.

### 6.3 Native config

`app.json` plugins gains:

```jsonc
[
  "@react-native-google-signin/google-signin",
  { "iosUrlScheme": "com.googleusercontent.apps.<ios-client-id-suffix>" }
]
```

Android requires the package + SHA-1 entries in Google Cloud — no extra `app.json` config. iOS requires the URL scheme above.

### 6.4 Device flow

```
User taps "Continue with Google"
  → GoogleSignin.configure({ webClientId, iosClientId }) at app start
  → GoogleSignin.signIn()
  → returns { idToken, user: { email, name, ... } }
  → supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
  → Supabase verifies against Google's JWKS, creates auth.users, returns Session
```

### 6.5 Edge cases

| Case | Handling |
|------|----------|
| User cancels Google modal | `signIn()` rejects with `SIGN_IN_CANCELLED`. Swallow silently. |
| User has multiple Google accounts | Google handles the account picker. We do nothing. |
| User declines `email` scope | `idToken` may lack the email claim. Supabase rejects the exchange. Show toast "Bemy needs your email to sign in." |
| Play Services unavailable (Android) | `signIn()` rejects with `PLAY_SERVICES_NOT_AVAILABLE`. Toast: "Update Google Play Services to sign in with Google." |
| Token already used / replay | Supabase returns 400. Toast: "Sign-in failed. Please try again." Log. |

---

## 7. Service-layer changes

### 7.1 `services/authService.ts`

Add two methods, mirroring the existing `signIn` shape (analytics + observability):

```ts
async signInWithApple(): Promise<Session> {
  analyticsService.track('auth_sso_started', { provider: 'apple' });
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token');
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
    if (data.user?.id) observabilityService.identify(data.user.id);
    if (credential.fullName) {
      const display = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(' ');
      if (display) await userService.updateDisplayName(display);
    }
    return data.session!;
  } catch (err) {
    if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') {
      analyticsService.track('auth_sso_cancelled', { provider: 'apple' });
      throw new Error('CANCELLED');
    }
    const reason = err instanceof Error ? err.message : 'unknown';
    analyticsService.track('auth_sso_failed', { provider: 'apple', reason });
    throw err;
  }
},

async signInWithGoogle(): Promise<Session> { /* same shape, provider: 'google' */ },
```

The `'CANCELLED'` sentinel lets the screen distinguish silent-cancel from a real error.

### 7.2 New analytics events (extend `analyticsService` event union)

- `auth_sso_started` — `{ provider: 'apple' | 'google' }`
- `auth_sso_succeeded` — `{ provider }`
- `auth_sso_failed` — `{ provider, reason }`
- `auth_sso_cancelled` — `{ provider }`

### 7.3 `stores/authStore.ts`

Add `signInWithApple()` and `signInWithGoogle()` thin wrappers that call the service and surface errors to the existing `error` state (matching the current `signIn` pattern at line 52). The `onAuthStateChange` listener at line 32 already handles the session update — no changes there.

### 7.4 No new Zod schemas

SSO is not form-driven. No schemas needed.

### 7.5 `services/supabase.ts`

If `GoogleSignin.configure({...})` is called, it should run **once at app start**, not per-sign-in. Add a one-time initialiser in `app/_layout.tsx` (or a new `services/sso.ts` if we want to keep `_layout.tsx` clean). Apple Sign In requires no init.

---

## 8. UI flow design

Single combined sign-in/sign-up screen. SSO does not distinguish "I'm new" from "I'm returning" — Supabase creates the account on first call and authenticates on subsequent calls. So `welcome.tsx` becomes the auth landing page, and `sign-in.tsx` / `sign-up.tsx` become the email-only fallback for users who tap "Use email instead."

### 8.1 New welcome / auth screen — word-mockup

**Before** (current `app/(auth)/welcome.tsx`):

```
┌────────────────────────────────────┐
│                                    │
│           Bemy (display)           │
│   A digital home for your pet      │
│              family                │
│                                    │
│      [   Get Started   ]           │
│        Sign In                     │
│                                    │
└────────────────────────────────────┘
```

**After**:

```
┌────────────────────────────────────┐
│                                    │
│           Bemy (display)           │
│   A digital home for your pet      │
│              family                │
│                                    │
│  [    Continue with Apple    ]     │  ← Apple-styled button (black/white per scheme)
│  [   Continue with Google    ]     │  ← Google-styled button (G icon, "Continue with Google")
│                                    │
│         Use email instead          │  ← small text link
│                                    │
│  By continuing you agree to the    │  ← footnote, persistent
│         Privacy Policy             │
│                                    │
└────────────────────────────────────┘
```

Apple's HIG (https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple) is specific:
- Use `AppleAuthentication.AppleAuthenticationButton` from `expo-apple-authentication` — it renders the official asset and respects light/dark mode. **Do not** roll our own.
- Button must be at least as prominent as any other social sign-in button. Apple sits **above** Google.

Google's branding (https://developers.google.com/identity/branding-guidelines):
- Use the official "G" mark, "Continue with Google" string, no other modifications.
- `@react-native-google-signin/google-signin` ships a `<GoogleSigninButton />` component that's compliant.

The "Use email instead" link routes to the existing `sign-in.tsx`. From there, "Don't have an account? Get Started" still routes to `sign-up.tsx`. Both keep their privacy-consent checkbox (legal reviewer amendment §9) — but on the SSO path, consent is implicit because the privacy footnote on the welcome screen is persistent and tapping the SSO button counts as consent. **Confirm this reading with the privacy policy reviewer before shipping** — see §13.

### 8.2 Privacy policy placement

- Welcome screen: persistent footnote ("By continuing you agree to the Privacy Policy") with the link tappable.
- `sign-up.tsx` email fallback: keep the existing checkbox unchanged.
- `sign-in.tsx` email fallback: existing — no change.

---

## 9. Data-model implications

### 9.1 The `public.users` trigger

Current trigger (`supabase/migrations/001_initial_schema.sql:17-28`):

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;
```

`auth.users.email` will be:
- email/password — provided by user
- Apple — real or `*@privaterelay.appleid.com`, **always present after first sign-in**
- Google — present iff user consented to `email` scope; we abort the flow upstream if not

So in practice `new.email` should always be non-null by the time the trigger fires. **However**, defence-in-depth says the trigger should not blow up if it ever is null. Recommended migration:

### 9.2 Proposed migration `015_handle_new_user_null_safety.sql`

```sql
-- Tolerate auth users with no email (e.g. SSO providers that omit email).
-- The public.users.email column stays NOT NULL; we substitute a placeholder
-- so the row can be created, and the app surfaces an "add email" prompt
-- on next sign-in (deferred — see SSO plan §3.2).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@placeholder.bemy.invalid')
  );
  return new;
end;
$$ language plpgsql security definer;
```

**This migration triggers CLAUDE.md rules 6 + 7.** The implementation agent must:

1. Write the migration above.
2. Spawn a senior database engineer agent to review it — the review should specifically check:
   - That `coalesce` doesn't mask data-quality issues we'd want to know about (counter-argument: we abort upstream on missing email, so this is belt-and-braces only).
   - Whether the placeholder format collides with any other unique constraint (currently only `pets.user_id` references `public.users.id`, no email-based uniqueness).
   - Whether to add a `CHECK` constraint or NOT VALID flag.
3. Apply DB-review feedback.
4. Spawn a post-migration code-review agent (CLAUDE.md rule 7) to verify ripple effects in:
   - `services/userService.ts` (any hardcoded email shape assumptions)
   - `services/authService.ts` (the new SSO methods)
   - `types/database.ts` (regenerate after the migration)

If the senior DB review concludes the migration is unnecessary because we already abort upstream, accept that finding and skip the migration. Document the decision in the final implementation report.

### 9.3 `auth.users.app_metadata.provider`

Supabase populates this automatically (`email`, `apple`, `google`). We don't need to mirror it into `public.users` for v1. If the founder later wants a per-user "you signed in with Google" badge, it's a follow-up.

---

## 10. Tests

Every new method / component / hook gets tests. Required test files:

| File | Cases |
|------|-------|
| `services/authService.test.ts` (extend) | `signInWithApple`: happy path, Apple cancellation, missing identity token, Supabase exchange error. `signInWithGoogle`: happy path, cancellation, missing email scope, Play Services unavailable, Supabase exchange error. |
| `stores/authStore.test.ts` (extend, or add if missing) | `signInWithApple` / `signInWithGoogle` set loading + error state, clear error on retry. |
| `__tests__/routes/welcome.test.tsx` (new) | Renders both SSO buttons. Tapping Apple calls `authStore.signInWithApple`. Tapping Google calls `authStore.signInWithGoogle`. "Use email instead" routes to sign-in. Cancellation does not show error toast. Real error shows error toast. |
| `__tests__/routes/signIn.test.tsx`, `signUp.test.tsx` | No change to existing assertions. Confirm the email fallback still works end-to-end. |

Mock strategy:
- Mock `expo-apple-authentication` with a manual mock returning `{ identityToken: 'fake', fullName: { givenName: 'X', familyName: 'Y' } }` on success.
- Mock `@react-native-google-signin/google-signin` similarly. Both libs are notorious for native-only call sites — the manual mock in `__mocks__/` is the cleanest path.
- Mock `supabase.auth.signInWithIdToken` via the existing supabase mock.

Run `npx jest` and require green before commit. Per CLAUDE.md, this is non-negotiable.

---

## 11. Sequenced implementation steps

For the implementation agent. Do these in order; do not parallelise the EAS build steps with code changes.

| # | Step | Owner | Notes |
|---|------|-------|-------|
| 1 | Founder enables Sign In with Apple capability + creates Services ID, key. | Founder | Blocking — agent cannot proceed past step 5 without these. |
| 2 | Founder creates Google Cloud OAuth clients (iOS, Android, Web). | Founder | Blocking — same. |
| 3 | Founder enables Apple + Google providers in Supabase dashboard, pastes credentials. | Founder | Blocking — same. |
| 4 | Agent installs packages: `npx expo install expo-apple-authentication @react-native-google-signin/google-signin`. | Agent | Confirms SDK 54 compatibility. |
| 5 | Agent updates `app.json` plugins array (Apple plugin + Google plugin with iOS URL scheme). | Agent | Code change. |
| 6 | Agent adds `signInWithApple` + `signInWithGoogle` to `services/authService.ts` and tests in `services/authService.test.ts`. | Agent | TDD — test first, then code. |
| 7 | Agent extends `stores/authStore.ts` with the new methods and tests. | Agent | |
| 8 | Agent rewrites `app/(auth)/welcome.tsx` per §8. Implements §4.5.1 caption + §4.5.2 last-method memory + §4.10 platform-availability fallbacks. New screen test in `__tests__/routes/welcome.test.tsx`. | Agent | Use the official Apple + Google button components. |
| 9 | Agent calls `GoogleSignin.configure(...)` once in `app/_layout.tsx`, gated on platform. | Agent | |
| 10 | Agent extends `stores/authStore.ts` with the silent-logout toast plumbing per §4.8 (`userInitiatedSignOut` flag + listener branch). Add tests. | Agent | Required for involuntary-logout UX parity. |
| 11 | Agent adds the multi-account caption to the delete-account confirmation per §4.6, in `app/(main)/settings/index.tsx`. | Agent | Single-line copy change. |
| 12 | If §9.2 migration is needed (per DB review): write migration `015_handle_new_user_null_safety.sql`, spawn senior DB review (CLAUDE.md rule 6), apply fixes, spawn post-migration code review (rule 7). | Agent | Founder applies the SQL manually per `feedback_no_destructive_db.md`. |
| 13 | Run `npx jest` — must be green. | Agent | |
| 14 | Run `eas build --profile preview --platform ios` to produce a build with the new entitlements. | Agent or founder | Apple requires the entitlement at build time. |
| 15 | Founder installs preview build on phone, smoke-tests Apple + Google flows including a deliberate C1 collision (sign up email, sign in with Google same email) to verify the §4.4 runbook. | Founder | Sign in with each, verify pet dashboard loads, verify sign-out + sign-in-again works. |
| 16 | Commit + push. Migration files are committed but applied manually by the founder per CLAUDE.md "commit + push are part of done", with the migration exception. | Agent | |
| 17 | If applicable, founder applies migration 015 in Supabase SQL editor, regenerates `types/database.ts`. | Founder | |

**Edge Function deploy order:** N/A — this work doesn't touch any Edge Function. (The CLAUDE.md note about migration → Edge Function ordering doesn't apply.)

---

## 12. Rollout plan

**Straight ship.** No feature flag.

- This is pre-launch — there are no production users to gate against.
- Adding a flag would mean a Zustand state, a Supabase config row or remote-config service, and conditional rendering in `welcome.tsx` — all of which is yak-shaving for a hobby app.
- If something breaks post-launch, the rollback is to revert the commit and ship a new EAS build. The cost of that is ~30 minutes of build time, which is acceptable.

The one "soft flag" to keep in mind: the **Google OAuth verification status** in Google Cloud. Until the consent screen is verified by Google (which takes 1–2 weeks), the app shows an "unverified app" warning to non-test users. **Submit for verification immediately after the Supabase config is in place** — it can run in parallel with QA.

---

## 13. Risks + open questions

The collision-handling debt that was previously open here (what to do for C1–C5, what consent gets logged for SSO, what happens when tokens expire) is now resolved in §4. The remaining open items are infrastructure-shaped, not flow-shaped.

1. **Account-linking debt is now operationalised, not eliminated.** §3.3 + §4.4 — the founder accepts manual SQL recovery as the v1 fix. **Trigger to revisit:** if the §4.4 runbook fires more than ~5 times, build the linking UX in v1.x.
2. **Apple verification of email-claim audience.** Supabase verifies the Apple identity token's `aud` claim against the Services ID. If the Services ID is misconfigured (wrong domain, wrong return URL), all Apple sign-ins fail with a cryptic 400. **Mitigation:** test on the preview build before commit-push lands; capture the exact error message in `observabilityService` for fast triage.
3. **Google "unverified app" warning** during the verification window. Real users will see "Google hasn't verified this app." Founder needs to know this is normal and clears in 1–2 weeks. Listed as an open question because the founder might not want to ship until verified.
4. **`isAvailableAsync` on Apple** — the JS API is available cross-platform but the native module only exists on iOS 13+. Android users will see only the Google + email options (per §4.10 spec). Confirm this is acceptable to the founder (Android-only Apple Sign In via web flow is possible but adds complexity disproportionate to value).
5. **Privacy-consent UX on the SSO path.** **Resolved:** founder confirmed footnote-only on the welcome screen — no checkbox on the SSO path, no `privacy_consent_at` DB column. The persistent "By continuing you agree to the Privacy Policy" footnote sits below the SSO buttons; tapping a button = consent. The email-fallback flow (`sign-up.tsx`) keeps its existing checkbox unchanged. Symmetry is maintained: neither flow writes consent to the DB.
6. **Soft warning on email→SSO collision (§4.5.3).** Deferred. Founder direction: revisit if/when manual account merges become a recurring support burden — no artificial threshold. If at any point a duplicate-account support email becomes a routine occurrence (or the founder finds themselves running the recovery SQL more than once or twice a quarter), revisit the §4.5.3 plan and decide whether the email-enumeration tradeoff is worth shipping the soft warning. Until then, accept the §4.4 manual-recovery path as sufficient.

---

## 14. Estimated effort

| Phase | Agent-hours | Wall-clock | Notes |
|-------|-------------|------------|-------|
| Founder dashboard config (Apple Dev + Google Cloud + Supabase) | 0 | 1.5–2.5 hr | Sequential — you have to wait for Apple key generation, Google OAuth client creation. |
| Service-layer + store changes + tests | 3–4 | 0.5 day | Includes mocks. |
| Welcome screen redesign + tests | 2–3 | 0.5 day | Apple/Google branding compliance is the slow part. |
| Migration 015 (if needed) + DB review chain | 2–3 | 0.5 day | Senior DB review + post-migration code review. May be skipped per DB review verdict. |
| EAS preview build + smoke test | 0.5 | 0.5–1 hr (incl. build queue) | |
| **Total** | **~8–11** | **~2 working days + 1 founder-hour** | Excludes Google verification wait (1–2 weeks, parallel). |

---

## 15. References

- Apple — Sign in with Apple HIG: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
- Apple — Sign in with Apple JS / native: https://developer.apple.com/documentation/sign_in_with_apple
- Expo — `expo-apple-authentication` docs: https://docs.expo.dev/versions/latest/sdk/apple-authentication/
- Google — Sign In with Google branding: https://developers.google.com/identity/branding-guidelines
- `@react-native-google-signin/google-signin` README: https://github.com/react-native-google-signin/google-signin
- Supabase — Native ID-token sign-in: https://supabase.com/docs/guides/auth/social-login/auth-apple#using-native-sign-in-with-apple-on-ios
- Supabase — Google provider: https://supabase.com/docs/guides/auth/social-login/auth-google
- App Store Review Guideline 4.8 (Login Services): https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple
- Expo SDK 54 changelog (verify package compatibility): https://expo.dev/changelog
