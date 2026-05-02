# Bemy — SSO Integration Plan (Apple + Google)

**Status:** planning, not yet implemented
**Audience:** the implementation agent that will pick this up next
**Last updated:** 2026-05-02
**Scope:** add Sign In with Apple and Sign In with Google to the auth flow, alongside the existing email/password fallback.

---

## 1. Executive summary

Bemy currently ships with email + password auth via `supabase.auth.signInWithPassword`. To minimise friction at sign-up — the founder's stated goal — we are adding **Sign In with Apple** and **Sign In with Google** in this release. Apple is non-negotiable: App Store Review Guideline 4.8 requires Sign In with Apple any time another social login is offered, so the two providers ship together. Email + password stays as a fallback for users who decline both. The work is mostly client wiring and provider-dashboard config — Supabase handles token exchange, session persistence, and the `auth.users` row natively. The one schema risk is the `public.users` trigger (`handle_new_user`) which currently writes `new.email` unconditionally; if Apple's private-relay email arrives or the email is missing it must continue to work without raising. We expect ~2–3 agent-days of coding plus the founder's time in the Apple Developer + Google Cloud + Supabase dashboards.

## 2. Discovery summary

What was already decided or noted in earlier docs/code, with citations:

- **Apple is required if any other social login ships** — `docs/pawlife-v1-release-plan.md:42`. Order: Apple first, Google second. Facebook deferred indefinitely.
- **Phasing in the v1 plan was Apple-first / Google-deferred** (`pawlife-v1-release-plan.md:60` and the suggested ordering at line 224). The founder has now overridden this — both Apple and Google ship together in this release, Facebook still deferred.
- **Tech-stack note** (`docs/pawlife-tech-stack.md:156`): "Social auth (Apple, Google) is a config change in Supabase when ready for Phase 2." True for the backend; ignores native client config.
- **Roadmap reference** (`docs/pawlife-roadmap.md:97`): Phase 2 item 5 — "Social sign-in (Apple, Google) — Reduces sign-up friction for broader launch." No design constraints captured.
- **Bundle ID is settled** as `com.beebles.bemy` (`app.json:14, app.json:24`). The earlier plan worried about `com.jackdinh.pawlife` → rename — that rename has happened. Apple Services ID + Google client IDs can be provisioned against the final bundle ID with no future migration.
- **Existing email/password flow lives in `services/authService.ts:5-95`** — methods `signUp`, `signIn`, `signOut`, `getSession`, `resetPassword`, `changePassword`, `deleteAccount`. Funnel analytics already wrap signup (`auth_signup_started`, `auth_signup_failed`). New SSO methods should mirror this instrumentation.
- **`auth.users` → `public.users` is auto-populated by a trigger** in `supabase/migrations/001_initial_schema.sql:17-28`. The trigger does `insert into public.users (id, email) values (new.id, new.email)`. `email` in `public.users` is `not null` (`001_initial_schema.sql:11`). **This is the schema-level risk** — see §8.
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

**Decision:** **defer linking to v1.x.** Supabase's default behaviour is to create a separate `auth.users` row per provider, even on email collision. We accept that. If a user reports it, we resolve manually in Supabase dashboard.

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

## 4. Apple Sign In specifics

### 4.1 Package

- `expo-apple-authentication` — Expo SDK 54 compatible version is `~8.0.x` (verify exact pin via `npx expo install expo-apple-authentication`). It is a **config plugin** — adding it triggers a native rebuild via EAS. Cannot be hot-loaded into an existing dev client.

### 4.2 Apple Developer Portal config

Founder action items (the implementation agent cannot do these — they require Apple Developer credentials):

1. Apple Developer → Certificates, Identifiers & Profiles → Identifiers → `com.beebles.bemy` → enable **Sign In with Apple** capability. Save.
2. Create a **Services ID** (separate from the App ID). Suggested suffix: `com.beebles.bemy.signin`. Configure web auth → primary domain = the Supabase project domain (`<project-ref>.supabase.co`), return URL = `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Create a **Sign in with Apple key** (Keys → + → enable Sign in with Apple). Download the `.p8` once (it's irretrievable after the modal closes). Note the Key ID and Team ID.
4. In **Supabase dashboard → Authentication → Providers → Apple**, enable, paste:
   - Services ID = `com.beebles.bemy.signin`
   - Team ID
   - Key ID
   - Private key contents (paste the `.p8` body)

### 4.3 EAS / native config

`app.json` plugins array gains an entry:

```jsonc
[
  "expo-apple-authentication"
]
```

After this, run `eas build --profile preview --platform ios` to produce a build with the new entitlement. Existing Expo Go / dev clients without the plugin will throw at runtime when the native module is missing — guard the call site with `AppleAuthentication.isAvailableAsync()` and hide the button on Android (Apple Sign In is iOS-only in this app's scope; we are not adding Android-side Apple support, which would need the JS-only web flow).

### 4.4 Device flow

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

### 4.5 Edge cases

| Case | Handling |
|------|----------|
| User cancels modal | `signInAsync` rejects with `ERR_REQUEST_CANCELED`. Swallow silently — no error toast. |
| Network failure during Supabase exchange | Show toast "Couldn't sign in with Apple. Please try again." Log via `observabilityService`. |
| Token exchange fails (provider misconfigured) | Same toast. Log with `provider: 'apple'` tag. Founder will see it in Sentry/PostHog if it ever fires post-launch. |
| Private relay email | Store as-is. No special handling. |
| User signs in on a second device with same Apple ID | Supabase recognises the existing `auth.users` row by Apple `sub`. Same account. Works out of the box. |

---

## 5. Google Sign In specifics

### 5.1 Library choice

**Decision: use Supabase's native ID-token flow with `@react-native-google-signin/google-signin`.**

Rationale: of the three options —

- `@react-native-google-signin/google-signin` (native modal, returns ID token, hand to Supabase via `signInWithIdToken`) — **cleanest UX, native modal, no browser detour**, but adds a native module (config plugin, requires EAS rebuild).
- `expo-web-browser` + Supabase `signInWithOAuth` — works in Expo managed, but pops a browser, has a deeplink-back step that's flaky on iOS, and the UX is visibly worse than Apple's native modal sitting next to it.
- `expo-auth-session` — most flexible, most code to maintain. Overkill for Bemy.

Since we're already taking the EAS rebuild hit for Apple, the marginal cost of adding a second config plugin for Google is near zero, and the UX win is significant. Native modal next to Apple's native modal looks consistent and feels first-class.

Package: `@react-native-google-signin/google-signin` — confirm Expo SDK 54 compatibility before pinning. Latest as of writing: `^13.x`. Verify via `npx expo install` for the SDK 54 - compatible pin.

### 5.2 Google Cloud config

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

### 5.3 Native config

`app.json` plugins gains:

```jsonc
[
  "@react-native-google-signin/google-signin",
  { "iosUrlScheme": "com.googleusercontent.apps.<ios-client-id-suffix>" }
]
```

Android requires the package + SHA-1 entries in Google Cloud — no extra `app.json` config. iOS requires the URL scheme above.

### 5.4 Device flow

```
User taps "Continue with Google"
  → GoogleSignin.configure({ webClientId, iosClientId }) at app start
  → GoogleSignin.signIn()
  → returns { idToken, user: { email, name, ... } }
  → supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
  → Supabase verifies against Google's JWKS, creates auth.users, returns Session
```

### 5.5 Edge cases

| Case | Handling |
|------|----------|
| User cancels Google modal | `signIn()` rejects with `SIGN_IN_CANCELLED`. Swallow silently. |
| User has multiple Google accounts | Google handles the account picker. We do nothing. |
| User declines `email` scope | `idToken` may lack the email claim. Supabase rejects the exchange. Show toast "Bemy needs your email to sign in." |
| Play Services unavailable (Android) | `signIn()` rejects with `PLAY_SERVICES_NOT_AVAILABLE`. Toast: "Update Google Play Services to sign in with Google." |
| Token already used / replay | Supabase returns 400. Toast: "Sign-in failed. Please try again." Log. |

---

## 6. Service-layer changes

### 6.1 `services/authService.ts`

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

### 6.2 New analytics events (extend `analyticsService` event union)

- `auth_sso_started` — `{ provider: 'apple' | 'google' }`
- `auth_sso_succeeded` — `{ provider }`
- `auth_sso_failed` — `{ provider, reason }`
- `auth_sso_cancelled` — `{ provider }`

### 6.3 `stores/authStore.ts`

Add `signInWithApple()` and `signInWithGoogle()` thin wrappers that call the service and surface errors to the existing `error` state (matching the current `signIn` pattern at line 52). The `onAuthStateChange` listener at line 32 already handles the session update — no changes there.

### 6.4 No new Zod schemas

SSO is not form-driven. No schemas needed.

### 6.5 `services/supabase.ts`

If `GoogleSignin.configure({...})` is called, it should run **once at app start**, not per-sign-in. Add a one-time initialiser in `app/_layout.tsx` (or a new `services/sso.ts` if we want to keep `_layout.tsx` clean). Apple Sign In requires no init.

---

## 7. UI flow design

Single combined sign-in/sign-up screen. SSO does not distinguish "I'm new" from "I'm returning" — Supabase creates the account on first call and authenticates on subsequent calls. So `welcome.tsx` becomes the auth landing page, and `sign-in.tsx` / `sign-up.tsx` become the email-only fallback for users who tap "Use email instead."

### 7.1 New welcome / auth screen — word-mockup

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

The "Use email instead" link routes to the existing `sign-in.tsx`. From there, "Don't have an account? Get Started" still routes to `sign-up.tsx`. Both keep their privacy-consent checkbox (legal reviewer amendment §8) — but on the SSO path, consent is implicit because the privacy footnote on the welcome screen is persistent and tapping the SSO button counts as consent. **Confirm this reading with the privacy policy reviewer before shipping** — see §12.

### 7.2 Privacy policy placement

- Welcome screen: persistent footnote ("By continuing you agree to the Privacy Policy") with the link tappable.
- `sign-up.tsx` email fallback: keep the existing checkbox unchanged.
- `sign-in.tsx` email fallback: existing — no change.

---

## 8. Data-model implications

### 8.1 The `public.users` trigger

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

### 8.2 Proposed migration `015_handle_new_user_null_safety.sql`

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

### 8.3 `auth.users.app_metadata.provider`

Supabase populates this automatically (`email`, `apple`, `google`). We don't need to mirror it into `public.users` for v1. If the founder later wants a per-user "you signed in with Google" badge, it's a follow-up.

---

## 9. Tests

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

## 10. Sequenced implementation steps

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
| 8 | Agent rewrites `app/(auth)/welcome.tsx` per §7. New screen test in `__tests__/routes/welcome.test.tsx`. | Agent | Use the official Apple + Google button components. |
| 9 | Agent calls `GoogleSignin.configure(...)` once in `app/_layout.tsx`, gated on platform. | Agent | |
| 10 | If §8.2 migration is needed (per DB review): write migration `015_handle_new_user_null_safety.sql`, spawn senior DB review (CLAUDE.md rule 6), apply fixes, spawn post-migration code review (rule 7). | Agent | Founder applies the SQL manually per `feedback_no_destructive_db.md`. |
| 11 | Run `npx jest` — must be green. | Agent | |
| 12 | Run `eas build --profile preview --platform ios` to produce a build with the new entitlements. | Agent or founder | Apple requires the entitlement at build time. |
| 13 | Founder installs preview build on phone, smoke-tests Apple + Google flows. | Founder | Sign in with each, verify pet dashboard loads, verify sign-out + sign-in-again works. |
| 14 | Commit + push. Migration files are committed but applied manually by the founder per CLAUDE.md "commit + push are part of done", with the migration exception. | Agent | |
| 15 | If applicable, founder applies migration 015 in Supabase SQL editor, regenerates `types/database.ts`. | Founder | |

**Edge Function deploy order:** N/A — this work doesn't touch any Edge Function. (The CLAUDE.md note about migration → Edge Function ordering doesn't apply.)

---

## 11. Rollout plan

**Straight ship.** No feature flag.

- This is pre-launch — there are no production users to gate against.
- Adding a flag would mean a Zustand state, a Supabase config row or remote-config service, and conditional rendering in `welcome.tsx` — all of which is yak-shaving for a hobby app.
- If something breaks post-launch, the rollback is to revert the commit and ship a new EAS build. The cost of that is ~30 minutes of build time, which is acceptable.

The one "soft flag" to keep in mind: the **Google OAuth verification status** in Google Cloud. Until the consent screen is verified by Google (which takes 1–2 weeks), the app shows an "unverified app" warning to non-test users. **Submit for verification immediately after the Supabase config is in place** — it can run in parallel with QA.

---

## 12. Risks + open questions

1. **Account-linking debt.** §3.3 — accepted tradeoff. If the founder ever invites a friend who already has an email account and then signs in with Google, two accounts will exist. Resolution path: manual fix in Supabase dashboard OR build linking UX in v1.x.
2. **Apple verification of email-claim audience.** Supabase verifies the Apple identity token's `aud` claim against the Services ID. If the Services ID is misconfigured (wrong domain, wrong return URL), all Apple sign-ins fail with a cryptic 400. **Mitigation:** test on the preview build before commit-push lands; capture the exact error message in `observabilityService` for fast triage.
3. **Google "unverified app" warning** during the verification window. Real users will see "Google hasn't verified this app." Founder needs to know this is normal and clears in 1–2 weeks. Listed as an open question because the founder might not want to ship until verified.
4. **`isAvailableAsync` on Apple** — the JS API is available cross-platform but the native module only exists on iOS 13+. Android users will see only the Google + email options. Confirm this is acceptable to the founder (Android-only Apple Sign In via web flow is possible but adds complexity disproportionate to value).
5. **Privacy-consent UX on the SSO path.** §7.2 proposes that tapping the SSO button = consent because of the persistent footnote. This may not satisfy strict GDPR readings of "explicit consent." **Open question for the founder:** do you want to keep the explicit checkbox on the welcome screen as well? Recommendation: no — friction is the enemy here, the footnote is industry-standard.

---

## 13. Estimated effort

| Phase | Agent-hours | Wall-clock | Notes |
|-------|-------------|------------|-------|
| Founder dashboard config (Apple Dev + Google Cloud + Supabase) | 0 | 1.5–2.5 hr | Sequential — you have to wait for Apple key generation, Google OAuth client creation. |
| Service-layer + store changes + tests | 3–4 | 0.5 day | Includes mocks. |
| Welcome screen redesign + tests | 2–3 | 0.5 day | Apple/Google branding compliance is the slow part. |
| Migration 015 (if needed) + DB review chain | 2–3 | 0.5 day | Senior DB review + post-migration code review. May be skipped per DB review verdict. |
| EAS preview build + smoke test | 0.5 | 0.5–1 hr (incl. build queue) | |
| **Total** | **~8–11** | **~2 working days + 1 founder-hour** | Excludes Google verification wait (1–2 weeks, parallel). |

---

## 14. References

- Apple — Sign in with Apple HIG: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
- Apple — Sign in with Apple JS / native: https://developer.apple.com/documentation/sign_in_with_apple
- Expo — `expo-apple-authentication` docs: https://docs.expo.dev/versions/latest/sdk/apple-authentication/
- Google — Sign In with Google branding: https://developers.google.com/identity/branding-guidelines
- `@react-native-google-signin/google-signin` README: https://github.com/react-native-google-signin/google-signin
- Supabase — Native ID-token sign-in: https://supabase.com/docs/guides/auth/social-login/auth-apple#using-native-sign-in-with-apple-on-ios
- Supabase — Google provider: https://supabase.com/docs/guides/auth/social-login/auth-google
- App Store Review Guideline 4.8 (Login Services): https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple
- Expo SDK 54 changelog (verify package compatibility): https://expo.dev/changelog
