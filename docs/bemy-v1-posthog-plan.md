# Bemy V1 — PostHog Observability & Analytics Plan

**Status:** Plan v2 (2026-04-27). Supersedes the dual-tool plan in `docs/bemy-v1-observability-plan.md` for the parts inside scope. After cost/value review the user has chosen to consolidate on **PostHog only** — product analytics, error tracking, screen views, and (deferred) session replay in one tool. Sentry is removed from v1 scope; the wrapper service abstraction makes it a drop-in addition later if PostHog's exception capture proves insufficient.

**Out of scope for this plan (handled separately):** account deletion (Edge Function + screen + migration 013 FK fixes), notification_tickets table (migration 014).

**Reviewer:** A second senior engineer reviews this document before any code is written. No implementation work begins until that review is signed off and the open questions at the bottom are answered.

---

## 1. Architecture diagram

```
                       ┌──────────────────────────────┐
                       │   PostHog Cloud (EU region)  │
                       │  - events                     │
                       │  - exceptions                 │
                       │  - screen views               │
                       │  - person profiles            │
                       └──────────▲─────────▲──────────┘
                                  │         │ HTTPS
                                  │ HTTPS   │
   React Native app               │         │   Supabase Edge Function
  ┌──────────────────────────┐    │         │  ┌──────────────────────────┐
  │ screens / components     │    │         │  │ send-reminders/index.ts  │
  │   (no SDK imports)       │    │         │  │                          │
  │            │             │    │         │  │  try { … }               │
  │            ▼             │    │         │  │  catch (err) {           │
  │ services/analyticsService│────┘         │  │   posthog.captureExc()   │
  │ services/observabilityS. │              │  │  }                       │
  │   (single SDK touchpoint)│              │  │  + heartbeat → ────────┐ │
  │            │             │              │  └──────────────────────┼─┘ │
  │            ▼             │              │                         │   │
  │ services/observability   │              │                         │   │
  │   Config (gate helper)   │              │                         ▼   │
  │            │             │              │              healthchecks.io
  │  ┌─────────▼──────────┐  │              │              (free, separate)
  │  │ posthog-react-     │  │              │
  │  │   native (singleton│──┘              │
  │  └────────────────────┘  │
  └──────────────────────────┘
```

Key invariants:
- **Components and non-observability services never import the PostHog SDK.** Only `services/observabilityService.ts` and `services/analyticsService.ts` import it. CLAUDE.md rule 1.
- **Two wrapper services, not one.** `analyticsService` (events, identify, reset) is the high-traffic surface used by feature code. `observabilityService` (errors, breadcrumbs, init lifecycle) is mostly used in `_layout.tsx` and inside service-layer try/catch wrappers.
- **One gate helper** (`observabilityConfig.ts`) is the single source of truth for "should the SDK be active right now?" so we cannot drift between the two services.
- **Heartbeat is intentionally a separate tool.** PostHog cannot detect "my hourly cron stopped firing entirely" — it only sees what the function emits. healthchecks.io fills that gap for free.

---

## 2. File-by-file changes

### Net-new files

| File | Purpose |
|---|---|
| `services/observabilityConfig.ts` | Pure helper. Exports `isObservabilityEnabled()`, `getEnvironment()`, `getRelease()`. Reads `EXPO_PUBLIC_ENV`, `EXPO_PUBLIC_TEST_OBSERVABILITY`, `EXPO_PUBLIC_POSTHOG_KEY`, app version. No side effects, fully unit-testable. |
| `services/observabilityConfig.test.ts` | Tests for the gate matrix (8 cases — see §8). |
| `services/observabilityService.ts` | SDK init, `captureException`, `addBreadcrumb`, `flush`, `shutdown`, `getClient` (internal use only — not exported from index barrel). Hosts the singleton. |
| `services/observabilityService.test.ts` | Init gating, no-op behavior when disabled, exception capture path. |
| `services/analyticsService.ts` | Typed `track<K extends keyof EventMap>()`, `identify(userId)`, `reset()`, `screen(name, props?)`. Imports observabilityService for the singleton client. |
| `services/analyticsService.test.ts` | Typed event compile, no-op when disabled, identify/reset, screen helper. |
| `hooks/useScreenTracking.ts` | Subscribes to `expo-router`'s `usePathname` and fires `screen()` on change. Single mount in `_layout.tsx`. |
| `hooks/useScreenTracking.test.ts` | Path change fires one event; no-op when analytics disabled. |
| `docs/privacy-policy.md` | Markdown source for hosted privacy policy (~750 words). Hosted via GitHub Pages. |
| `docs/app-store-privacy-labels.md` | Reference doc for App Store Connect entry — see §7. |

### Modified files

| File | Change |
|---|---|
| `app/_layout.tsx` | Top-of-module call to `observabilityService.init()`. Mount `<useScreenTracking />` inside the gate. Wrap `RootLayout` with `observabilityService.wrap()` if PostHog provides an error boundary helper (verify in install step); otherwise add a dedicated `<ErrorBoundary>` from `react-native` that calls `captureException`. |
| `services/authService.ts` | After `signUp` and `signIn` success, call `analyticsService.identify(data.user.id)` and emit `auth_signed_up` / `auth_signed_in`. After `signOut`, call `analyticsService.reset()` and emit `auth_signed_out`. |
| `services/petService.ts` | Emit `pet_created` from `create()` after success. (Keep call sites in services, not screens — single source of truth, survives screen rewrites.) |
| `services/healthService.ts` | Emit `vaccination_logged`, `medication_dose_logged`, `weight_entry_logged` from the corresponding methods. |
| `services/foodService.ts` | Emit `food_entry_logged`. |
| `app/(auth)/sign-up.tsx` (or equivalent screen) | Append footer "By creating an account, you agree to our Privacy Policy" with a Pressable that opens the privacy URL via `expo-web-browser`. |
| `supabase/functions/send-reminders/index.ts` | Init `posthog-node` (npm specifier) and `Sentry`-style try/wrap of the main handler. Capture any thrown exception. After successful run (just before final response), `fetch(HEALTHCHECKS_URL)` to ping success heartbeat; on caught exception, ping `${HEALTHCHECKS_URL}/fail`. Always `await posthog.shutdown()` at the end (Deno doesn't keep the process alive — the SDK batches and would otherwise drop events). |
| `supabase/functions/send-reminders/deno.json` (create if missing) | Pin `posthog-node` import map for reproducible deploys. |
| `eas.json` | Add `env` blocks per profile (see §6). Add a new `observability-test` profile that mirrors `preview` but flips `EXPO_PUBLIC_TEST_OBSERVABILITY=true`. |
| `app.json` → `expo.extra` | No SDK plugin needed — `posthog-react-native` is a JS-only module compatible with managed Expo. Confirmed against SDK 54 / RN 0.81 / React 19 (PostHog publishes a `>=3.x` line that supports React 19 — verify exact version at install time). |
| `.env.example` | Add `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_ENV`, `EXPO_PUBLIC_TEST_OBSERVABILITY` with placeholder values + comments. |
| `package.json` | Adds `posthog-react-native` and (for tests) nothing — we mock the module. Edge Function uses `npm:posthog-node` via Deno's `npm:` specifier, no package.json change. |
| `jest.setup.ts` (or `setupFiles` per `jest-expo`) | Add a global mock for `posthog-react-native` so component/service tests don't accidentally hit the SDK. |
| `CLAUDE.md` | Add line under "Critical Architecture Rules": "PostHog SDK imports live only in `services/observability*.ts` and `services/analyticsService.ts`. All event tracking goes through `analyticsService.track`." |

### Files NOT modified

- All other services keep their existing shape. We are *not* wrapping every method in a generic `captureServiceError` helper this round (that was the Sentry plan; PostHog's exception capture is fine via the React error boundary + targeted Edge Function captures + a few key manual `captureException` calls in async code that escapes boundaries).

---

## 3. Wrapper service API

### `services/observabilityConfig.ts`

```ts
export type Environment = 'development' | 'preview' | 'production';

export function getEnvironment(): Environment;
export function getRelease(): string;            // `bemy@<version>+<buildNumber>`
export function isObservabilityEnabled(): boolean;
// true iff: EXPO_PUBLIC_POSTHOG_KEY is set AND
//   (EXPO_PUBLIC_ENV === 'production' OR EXPO_PUBLIC_TEST_OBSERVABILITY === 'true')
```

### `services/observabilityService.ts`

```ts
export const observabilityService = {
  init(): void;                                  // idempotent; no-op if disabled
  captureException(err: unknown, context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }): void;
  addBreadcrumb(message: string, data?: Record<string, unknown>): void;
  flush(): Promise<void>;                        // for app-background hook
  shutdown(): Promise<void>;                     // for tests + Edge Function
  // Internal: not exported from any barrel.
  _getClient(): PostHog | null;
};
```

### `services/analyticsService.ts`

```ts
type EventMap = {
  pet_created:            { pet_id: string; pet_type: 'dog' | 'cat' | 'other'; has_photo: boolean };
  vaccination_logged:     { pet_id: string; record_id: string; vaccine_category: 'core' | 'optional' | 'custom'; was_overdue: boolean };
  medication_dose_logged: { pet_id: string; record_id: string; dose_offset_minutes: number };
  food_entry_logged:      { pet_id: string; record_id: string; food_kind: 'dry' | 'wet' | 'treat' | 'other' };
  weight_entry_logged:    { pet_id: string; record_id: string; unit: 'kg' | 'lb' };
  auth_signed_up:         { method: 'email_password' };
  auth_signed_in:         { method: 'email_password' };
  auth_signed_out:        Record<string, never>;
};

export const analyticsService = {
  track<K extends keyof EventMap>(event: K, props: EventMap[K]): void;  // no-op if disabled
  identify(userId: string): void;                                        // never email
  reset(): void;                                                         // on signout
  screen(name: string, props?: Record<string, string | number | boolean>): void;
};
```

`screen()` is what `useScreenTracking` calls; we route it through the wrapper rather than expose PostHog's `screen()` directly so the gate logic stays in one place.

---

## 4. Event taxonomy (final)

The lean cut: 7 explicit events + auto screen views + auto exceptions. Anything beyond this is deferred to v1.1 once we have signal on which funnels matter.

| Event | Properties | Fired from |
|---|---|---|
| `auth_signed_up` | `method` | `authService.signUp` |
| `auth_signed_in` | `method` | `authService.signIn` |
| `auth_signed_out` | (none) | `authService.signOut` |
| `pet_created` | `pet_id`, `pet_type`, `has_photo` | `petService.create` |
| `vaccination_logged` | `pet_id`, `record_id`, `vaccine_category`, `was_overdue` | `healthService.createVaccination` |
| `medication_dose_logged` | `pet_id`, `record_id`, `dose_offset_minutes` | `healthService.createMedicationDose` |
| `weight_entry_logged` | `pet_id`, `record_id`, `unit` | `healthService.createWeightEntry` |
| `food_entry_logged` | `pet_id`, `record_id`, `food_kind` | `foodService.create` |
| `$screen` (auto) | `screen_name` | `useScreenTracking` |
| `$exception` (auto) | stack, message, fingerprint | `observabilityService.captureException` + RN error boundary |

**No PII.** No `pet_name`, no `vaccine_name`, no `medication_name`, no `dosage`, no `notes`, no `email`, no `birthdate`. Categorize and enum-ify everything that's a bounded set; otherwise omit. (Decision on Open Q3: include `pet_id` only, not `pet_name`. Pet names are mildly sensitive — children's names, deceased pets memorialized, etc. — and the analytical value is zero because PostHog dashboards key on IDs anyway.)

---

## 5. Gating logic

The SDK initializes if and only if **all three** are true:

1. `EXPO_PUBLIC_POSTHOG_KEY` is a non-empty string.
2. `EXPO_PUBLIC_POSTHOG_HOST` is a non-empty string (default `https://eu.i.posthog.com`).
3. Either `EXPO_PUBLIC_ENV === 'production'` **or** `EXPO_PUBLIC_TEST_OBSERVABILITY === 'true'`.

If any condition fails, `observabilityService.init()` returns silently and every wrapper method becomes a no-op. This includes:
- Local dev (`EXPO_PUBLIC_ENV=development`, no PostHog key set) → off.
- TestFlight `preview` builds → off (we do not want to pollute prod analytics with internal smoke tests).
- A purpose-built `observability-test` build profile → on (so the user can validate end-to-end before cutting a production release).
- Production App Store builds → on.

Jest sets `EXPO_PUBLIC_ENV=test` (a fourth value not in the union, so always disabled) and the global mock asserts the SDK was never imported.

---

## 6. EAS env var matrix

| Variable | development | preview | observability-test | production |
|---|---|---|---|---|
| `EXPO_PUBLIC_ENV` | `development` | `preview` | `preview` | `production` |
| `EXPO_PUBLIC_POSTHOG_KEY` | (not set) | (not set) | `phc_<key>` (EAS secret) | `phc_<key>` (EAS secret) |
| `EXPO_PUBLIC_POSTHOG_HOST` | (not set) | (not set) | `https://eu.i.posthog.com` | `https://eu.i.posthog.com` |
| `EXPO_PUBLIC_TEST_OBSERVABILITY` | (not set) | (not set) | `true` | (not set) |
| `EXPO_PUBLIC_SUPABASE_URL` | (existing) | (existing) | (existing) | (existing) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | (existing) | (existing) | (existing) | (existing) |

**Edge Function (Supabase project secrets, not EAS):**

| Variable | Value | Notes |
|---|---|---|
| `POSTHOG_KEY` | `phc_<server-side key>` | Reuse the same project key. PostHog doesn't distinguish client/server keys. |
| `POSTHOG_HOST` | `https://eu.i.posthog.com` | |
| `HEALTHCHECKS_PING_URL` | `https://hc-ping.com/<uuid>` | Generated when the user creates the check. |
| `OBSERVABILITY_ENV` | `production` | Edge Function uses a separate var because there is no `EXPO_PUBLIC_` namespace in Deno. |

**Why a dedicated `observability-test` profile?** Without it, validating PostHog end-to-end would require either polluting prod with test events or shipping a one-off branch. The profile costs nothing (an entry in `eas.json`) and makes "verify a PostHog change works on my phone" a one-line `eas build --profile observability-test` away.

---

## 7. Privacy policy + Apple privacy labels

### Privacy policy content (target ~750 words)

The previously drafted markdown content covers: introduction, what data we collect (account info, pet records, photos, usage analytics, crash data), why (auth, app functionality, diagnostics, anonymous analytics), third-party processors (Supabase EU, PostHog EU, Apple Push, Expo), retention (records until account deletion; analytics 90 days; exceptions 30 days), user rights (access, correction, deletion via in-app account deletion + email), children's policy (not directed at <13), changes/versioning, contact (`beeble.ptyltd@gmail.com`).

**Refinements for v2:**
- Specify PostHog as a "product analytics and diagnostics processor" (one tool, not two).
- Drop the "Sentry" line — only PostHog.
- Make the consent posture explicit: "We rely on legitimate interest for crash diagnostics and on your acceptance of these terms (presented at sign-up) for product analytics. You may opt out at any time by deleting your account; an in-Settings opt-out is on our v1.1 roadmap." This is honest about the v1 posture (no in-app analytics toggle yet) and avoids over-promising.
- Hosting: `docs/privacy-policy.md` rendered via GitHub Pages from a new `bemy-legal` public repo or an `/legal` branch. Final URL: `https://bemy.app/privacy` (if domain is owned) or `https://<gh-user>.github.io/bemy-legal/privacy.html`. **The URL must exist and resolve before App Store submission and before the first production build is shipped.**

### Apple App Store Connect privacy labels

| Apple data category | Subtype | Linked to user? | Used for tracking? | Purpose | Source |
|---|---|---|---|---|---|
| Contact Info | Email Address | Yes | No | App Functionality | Supabase Auth |
| Identifiers | User ID | Yes | No | App Functionality, Analytics, Diagnostics | Supabase user UUID, sent to PostHog as `distinct_id` |
| User Content | Photos | Yes | No | App Functionality | Pet profile photos (Supabase Storage) |
| User Content | Other User Content | Yes | No | App Functionality | Pet records (vaccinations, weight, food, meds) |
| Usage Data | Product Interaction | Yes | No | Analytics | PostHog events |
| Diagnostics | Crash Data | No | No | App Functionality, Analytics | PostHog `$exception` |
| Diagnostics | Performance Data | No | No | App Functionality | PostHog default `$performance` (verify; disable if it sends anything beyond TTI) |

**No "Used for Tracking" categories.** PostHog is configured without IDFA, without ad-network attribution, and we do not share data with third parties for advertising. This sidesteps App Tracking Transparency (`expo-tracking-transparency`) entirely.

### Sign-up screen footer

```
By creating an account, you agree to our Privacy Policy.
                                             └─ Pressable, opens https://bemy.app/privacy via expo-web-browser
```

---

## 8. Test plan

### `services/observabilityConfig.test.ts`

Eight cases, one per row of the gate truth table:

| ENV | TEST_OBSERVABILITY | KEY set | Expected `isObservabilityEnabled()` |
|---|---|---|---|
| development | unset | yes | false |
| development | true | yes | true |
| preview | unset | yes | false |
| preview | true | yes | true |
| production | unset | yes | true |
| production | unset | no | false |
| production | true | yes | true |
| test | true | yes | false (jest test env always off) |

### `services/observabilityService.test.ts`

- `init()` is a no-op when disabled (assert PostHog constructor never called via the global mock).
- `init()` is idempotent (call twice, assert constructor called once).
- `captureException` is a no-op when disabled.
- `captureException` forwards to PostHog's `captureException` when enabled, with merged tags.
- `flush()` and `shutdown()` resolve immediately when disabled.

### `services/analyticsService.test.ts`

- Typed events compile (TS-only assertion; uses `// @ts-expect-error` on a bad event shape).
- `track`, `identify`, `reset`, `screen` are no-ops when disabled.
- `track` forwards to PostHog `capture` with the event name + props.
- `identify` forwards to PostHog `identify` with `distinctId === userId` and **no** `email`/`name` person properties (regression test for the PII rule).
- `reset` forwards to PostHog `reset`.
- `screen` forwards to PostHog `screen` (or `capture('$screen', { $screen_name })` depending on RN SDK shape — verify at install).

### `hooks/useScreenTracking.test.ts`

- Mounting subscribes to pathname.
- Path change fires `analyticsService.screen` exactly once per change (not per re-render).
- No-op when disabled.

### Edge Function

- Manual smoke test only (Deno test runner is not yet in the repo and adding it is out of scope for this plan). The verification step in the deploy ordering covers this: invoke the function with a forced exception path and confirm the PostHog event arrives.

### Hard to test (acknowledged gaps)

- The Expo Router screen-tracking integration depends on `usePathname` behavior; we mock it. Real-world drift (e.g. a navigation library upgrade) won't be caught by unit tests. Mitigation: smoke test in `observability-test` build before each release.
- Source-map upload correctness can only be verified by triggering a crash on a production build and inspecting the resulting stack trace in PostHog.

---

## 9. Deploy ordering

Dependencies are real. Mis-ordering causes either silent data loss or runtime errors.

1. **User-action prereqs** (§10) complete: PostHog project exists, healthchecks.io ping URL exists, privacy policy URL resolves.
2. **Set Supabase project secrets** for the Edge Function: `POSTHOG_KEY`, `POSTHOG_HOST`, `HEALTHCHECKS_PING_URL`, `OBSERVABILITY_ENV`. Verify with `supabase secrets list`.
3. **Set EAS env vars** for `production` and `observability-test` profiles (PostHog key as an EAS secret).
4. **Land code changes** (PR with the file changes from §2). All tests green. Senior engineer review per CLAUDE.md.
5. **Deploy Edge Function** (`supabase functions deploy send-reminders`). Must be after step 2; otherwise the function runs without env vars and every event drops.
6. **Verify Edge Function** by manually invoking it (or waiting for the next pg_cron run) with a forced exception path: temporarily set a bad `medication_reminder_time` in a test user, observe the captured exception in PostHog, then revert.
7. **Verify healthcheck** by waiting for the next successful run and confirming healthchecks.io shows "up". Confirm the inverse: temporarily make the function throw, confirm healthchecks.io reports "down" within the configured grace period.
8. **Build `observability-test` profile**, install on the user's phone, exercise sign-up → pet creation → dose log → sign-out. Confirm 7 events + screen views + identify/reset all land in PostHog.
9. **Cut a production build** (`eas build --profile production`). Source maps upload during the build (verify in EAS logs).
10. **Submit to App Store** with the privacy labels from §7.
11. **Post-release:** monitor PostHog for 48 hours. Watch for unexpected high-volume events (cost) or noisy exceptions (signal).

---

## 10. User-action checklist

The user (Jack) needs to do these before integration testing can begin. None require code changes.

- [ ] **PostHog account.** Sign up at `https://eu.posthog.com` (EU region, confirm during signup). Create a project named `bemy-mobile`. Capture the Project API Key (`phc_...`).
- [ ] **PostHog project settings:**
  - Region: EU (irreversible — confirm before clicking).
  - Session recording: **OFF** (Settings → Project → Recordings).
  - Person profile mode: "Identified persons only" (cuts cost, matches our anonymous-until-signup model).
  - Autocapture: **OFF** for RN (autocapture in PostHog RN SDK is opt-in; just don't enable).
  - Data retention: default (1 year for events, fine).
- [ ] **healthchecks.io account.** Free tier. Create one check named `bemy-send-reminders`. Schedule: hourly, grace period 30 minutes. Capture the ping URL (`https://hc-ping.com/<uuid>`). Add an email alert recipient (`beeble.ptyltd@gmail.com`).
- [ ] **Privacy policy hosting.** Decide: GitHub Pages on a new `bemy-legal` repo, or a Vercel deploy of `docs/privacy-policy.md`. Whichever — the URL must be live before code lands. Capture the final URL (target: `https://bemy.app/privacy`).
- [ ] **EAS secrets:** `eas secret:create --name EXPO_PUBLIC_POSTHOG_KEY --value phc_...`. Repeat for `EXPO_PUBLIC_POSTHOG_HOST` (not strictly secret but kept consistent).
- [ ] **Supabase secrets:** `supabase secrets set POSTHOG_KEY=phc_... POSTHOG_HOST=... HEALTHCHECKS_PING_URL=... OBSERVABILITY_ENV=production`.
- [ ] **App Store Connect privacy labels:** complete the form using the table in §7. This is a one-time manual entry per app version unless the data practices change.

---

## 11. Risks + mitigations

| Risk | How we'd notice | Mitigation |
|---|---|---|
| `posthog-react-native` incompatible with React 19 / RN 0.81 / Expo SDK 54. | Build fails or runtime crash on init. | Pin a known-good version at install time. Verify before merging. PostHog ships a `~3.x` line with React 19 support; if the latest minor regresses, pin one minor back. |
| PostHog Deno SDK (`npm:posthog-node`) doesn't shut down cleanly in Edge Functions. | Edge Function returns successfully but events silently drop. | Always `await posthog.shutdown()` before returning. If `npm:posthog-node` proves flaky, fall back to a raw `fetch` to PostHog's `/capture/` REST endpoint — it's a public documented JSON API. Document this fallback in the implementation PR. |
| Source maps don't upload, or upload silently fails. | Production stack traces are unreadable. | Verify on the first production build by inspecting a real crash. PostHog's RN SDK uses a postinstall script for source-map upload; if it doesn't exist for managed Expo, we fall back to manually uploading via the PostHog CLI in an `eas-build-on-success` hook. |
| PII leaks into events via property typos (e.g. `pet_name` instead of `pet_id`). | Manual spot-check during verification. | The typed `EventMap` makes this a compile error. CI runs `tsc --noEmit` (already part of test setup). |
| Cost overrun (free tier exceeded). | PostHog billing dashboard. | At indie scale (≤10 users, ~500 events/day) we are 3+ orders of magnitude under the 1M/month free cap. Alarm trigger: any month exceeding 100k events warrants an audit. |
| Healthcheck false positives (function ran but couldn't reach hc-ping.com). | hc-ping reports "down" while function logs show success. | Use the `/start` ... `/0` (success) pattern with a generous grace period. Tolerate the rare false positive — better than missing a real outage. |
| User rejects the privacy policy at sign-up and we have no decline path. | Manual review during smoke test. | Sign-up form does not require an explicit checkbox in v1; the footer text "By creating an account, you agree to..." is the implicit consent vehicle. If App Store review pushes back, add an explicit checkbox in a follow-up — the architecture doesn't change. |
| Exception capture creates infinite loops (an error inside `captureException` triggers another capture). | App hangs / battery drain. | PostHog SDK has internal guards. Our wrapper additionally sets a re-entrancy flag — the test suite asserts a thrown error inside `captureException` does not recurse. |

---

## 12. Open questions for the reviewer / user

1. **Identify timing.** Plan currently says: identify on `signUp` and `signIn` success. Alternative: identify *only* on `signIn` and let `signUp` flow through to the next `signIn` (Supabase email-confirmation flow currently throws after signup pending email confirmation, so `signUp` may not always have a session). Recommendation: identify on whatever returns a session, never on the bare signUp call. Confirm.
2. **Privacy policy hosting.** GitHub Pages on a new public `bemy-legal` repo, or piggyback on an existing domain? The decision affects the URL we ship in the App Store metadata and the privacy policy file itself, so it must be locked before submission. Recommendation: GitHub Pages, custom domain `bemy.app/privacy` if owned, otherwise `<gh-user>.github.io/bemy-legal`.
3. **Edge Function PostHog SDK choice.** `npm:posthog-node` via Deno's npm specifier is the documented path but is less battle-tested than the raw `fetch`-to-`/capture/` approach. Recommendation: try `npm:posthog-node` first; if the implementation agent hits any flush/shutdown issue, fall back to raw `fetch` (it's a 30-line implementation). Confirm OK to make this call inside the implementation PR rather than re-review here.
4. **Explicit consent checkbox at sign-up.** Plan ships with footer-only ("By creating an account..."). An explicit checkbox is more defensible for GDPR and harder for App Store review to push back on, at the cost of one more tap. Recommendation: footer only for v1, checkbox in v1.1 if anyone complains. Confirm acceptable.

---

## Appendix — what was kept vs dropped from the prior plan

**Kept:** taxonomy structure (noun_verb_past), service-layer wrapper rule, EU region, no session recording, no feature flags, source-map verification step, Deno SDK in Edge Function, privacy policy outline, App Store labels table.

**Dropped:** Sentry (replaced by PostHog exception capture), opt-in consent modal (deferred to v1.1; v1 ships with implicit consent via sign-up footer), `captureServiceError` global wrapper (replaced by targeted manual captures + RN error boundary), per-event `track()` calls in 25+ screens (cut to 7 high-signal events fired from the service layer).

**New:** healthchecks.io heartbeat (PostHog cannot detect cron-stopped-firing), the dedicated `observability-test` EAS profile, `EXPO_PUBLIC_TEST_OBSERVABILITY` escape hatch, the explicit gate-matrix test suite, the `observabilityConfig.ts` separation of concerns.
