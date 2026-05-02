# Adversarial Review: PostHog v1 Plan

**Reviewer:** Independent senior staff engineer (RN + Supabase Edge Functions production observability).
**Plan reviewed:** `docs/pawlife-v1-posthog-plan.md` (v2, 2026-04-27).
**Verdict:** **Yellow** — directionally sound, but has at least four correctness bugs and several missing items that will bite if implemented as written. Resolve those, then green-light.

---

## 1. Verdict

**Yellow.** The architecture (two wrappers + a gate, EU region, lean event taxonomy, healthcheck side-channel for the cron) is right for an indie at this scale. But the plan has concrete bugs around env-var timing, Expo Router screen-tracking, error-boundary semantics, and `posthog-node` shutdown in Deno. Those are fixable in a follow-up pass — they don't require replanning — but they need to be fixed *before* an implementation agent is commissioned.

---

## 2. Correctness errors found

1. **`EXPO_PUBLIC_*` vars are baked at bundle time, not runtime — but the plan reads them via `process.env.EXPO_PUBLIC_*` at runtime, which is fine.** That part is OK; `services/supabase.ts:5-6` already does this. **The bug:** the gate matrix in §6 says development sets `EXPO_PUBLIC_ENV=development` but **there is no `.env` infrastructure in the repo today** (no dotenv plugin, no `.env`, no `.env.example`). Expo SDK 54 only auto-loads `.env*` files if the Metro plugin is enabled. The plan asserts "Local dev → off" but if `EXPO_PUBLIC_ENV` is unset, `getEnvironment()` will return `undefined`, which the gate maps to "neither production nor true" → off. That works, but only by accident. Add a default-to-`'development'` clause and a `.env.example` line item to the implementation plan; otherwise the implementation agent will copy-paste `process.env.EXPO_PUBLIC_ENV === 'production'` and miss that the test profile (`observability-test`) and TestFlight (`preview`) also need explicit values.

2. **`init()` cannot be a top-of-module side-effect call in `app/_layout.tsx`.** §2 says "Top-of-module call to `observabilityService.init()`". This will execute during the JS bundle's first evaluation, before React mounts, before the auth store is even imported. That's fine for PostHog itself, but `posthog-react-native` v3 requires `AsyncStorage` at construction time, and AsyncStorage on iOS is async-initialized — calling into it before the bridge is fully up can throw on cold start. **Fix:** move the init call into a `useEffect` in `RootLayout` that runs once before the auth-redirect effect, OR use the `<PostHogProvider>` wrapper (the SDK's documented pattern) inside `app/_layout.tsx`'s return. The plan implies bare-imperative init; this is the wrong RN pattern for v3.

3. **`posthog-react-native` v3 uses a React-context provider model, not a free-standing singleton.** The wrapper service API in §3 (`getClient(): PostHog | null`) implies you'll instantiate the SDK once, hold a module-level reference, and call methods on it. That works, but the SDK's `useFeatureFlag`, `usePostHog`, `useScreenTracking` hooks all assume a `<PostHogProvider client={…}>` wrapping the tree. The plan's `useScreenTracking.ts` rolling its own pathname listener is fine and arguably simpler — but the wrapper service should construct the SDK with `new PostHog(apiKey, options)` (the imperative ctor), NOT rely on the provider. **Verify the SDK's exported imperative constructor still exists in 3.x at install time** (the SDK has been moving toward provider-only). If it's gone, the wrapper service architecture has to change to a Provider + a `usePostHog`-backed service — non-trivial refactor.

4. **Expo Router 6 + `usePathname` screen-tracking has a known double-fire on transitions.** The plan's `useScreenTracking.ts` says "Path change fires `analyticsService.screen` exactly once per change (not per re-render)." In Expo Router 6, `usePathname` fires twice during a `router.replace` — once for the unmount, once for the mount of the new screen. The plan's test asserts "once per change" but doesn't define what "change" means. **Fix:** use `useGlobalSearchParams` + `usePathname` together, debounce to the next microtask, and key the `useEffect` deps on `pathname` only. Add a regression test that simulates a `replace()` and asserts a single `screen()` call.

5. **`posthog-node` via `npm:` in Deno: shutdown does not reliably flush.** §11 acknowledges this risk. What's missing is the *concrete* fix: `posthog-node`'s `shutdown()` returns a Promise but the underlying batch sender uses `setTimeout` to coalesce events. In Deno's Edge Function runtime, `setTimeout`-pending tasks are killed when the response returns — the `await shutdown()` call may resolve before the network request actually leaves the runtime. **Recommendation: do NOT use `npm:posthog-node`. Use raw `fetch` to `POST https://eu.i.posthog.com/capture/` with the documented payload shape.** The "fall back if flaky" framing is inverted — the raw fetch IS the safer default for serverless. Cut the SDK from the Edge Function entirely.

6. **The plan calls for `react-native`'s built-in `<ErrorBoundary>` — that doesn't exist.** §2 says "otherwise add a dedicated `<ErrorBoundary>` from `react-native`". React Native does not export an ErrorBoundary; you must write one (a class component implementing `componentDidCatch` + `getDerivedStateFromError`). Plan must enumerate this file: `components/ErrorBoundary.tsx` + test.

7. **`Text.defaultProps` mutation in `_layout.tsx:17-19` runs at import time.** Unrelated to PostHog, but: when `init()` becomes another import-time side effect, you now have two import-order-dependent module init steps. Document the ordering in the wrapper service, OR move both into a single `useEffect`.

8. **Edge Function: `try/catch` in §2 says "wrap main handler" but the existing handler at `supabase/functions/send-reminders/index.ts:343-453` already has a top-level `try/catch`.** It logs to `console.error` and returns 500. The plan must say "augment the existing catch block" not "wrap" — otherwise the implementation agent will nest try/catches and break the auth-rejection 401 path (which lives outside the try at line 352 — wait, it's inside; double-check). Concretely, the implementation should: capture in the existing catch, ping `${HEALTHCHECKS_PING_URL}/fail`, then `await posthog.shutdown()` (or the raw-fetch send), then return 500. Specify that ordering in the plan.

---

## 3. Architecture concerns

**Fine:**
- Two wrappers (`observabilityService` for errors/lifecycle, `analyticsService` for events) + one gate. Reasonable split; `analyticsService` is the high-traffic surface and benefits from the typed `EventMap`.
- Service-layer-only event emission. Aligns with CLAUDE.md rule 1 and survives screen rewrites.
- EU region + person-profiles=identified-only + autocapture-off + recording-off. Correct cost+privacy posture.
- Lean event taxonomy (7 events). Right call for v1.

**Push back on:**
- **`observabilityConfig.ts` as a separate file from `observabilityService.ts` is overengineered.** It's a 3-function helper. Inline it as the top of `observabilityService.ts` and export the functions. Saves a file and a test file. The "single source of truth" argument is moot when both files are in `services/` and read the same env vars.
- **`flush()` in the wrapper API is unused.** §3 mentions an "app-background hook" but no plan item creates one. Either add an `AppState`-listener-driven flush in `_layout.tsx` (recommended for RN — events are otherwise lost when the user kills the app within batch interval) or drop `flush()` from the wrapper. Half-implementing it is worse than either.
- **`screen()` going through the wrapper is good; `addBreadcrumb()` is dead weight in v1.** PostHog doesn't have a first-class breadcrumb concept the way Sentry does. Cut it.

---

## 4. Missing items

Must be added before implementation:

1. **`components/ErrorBoundary.tsx`** + test. Plan references it but doesn't list it as a net-new file.
2. **`AppState` listener** for `flush()` on background, OR explicit decision to not flush. Document.
3. **App version + build number tagging on every event.** §3 mentions `getRelease()` returning `bemy@<version>+<buildNumber>` but never says where it's attached. The wrapper should set it as a super-property on init via `register()` so every event carries it. Without this, the user cannot answer "did this regression appear in 1.0.2?" — which is the entire point of release tracking.
4. **Distinct ID merging on signup.** PostHog v3 changed the alias behavior: anonymous user → identified user requires `posthog.alias()` *before* `identify()` to preserve the pre-signup funnel. The plan doesn't address this. For Bemy specifically the funnel is short (welcome → sign-up → first pet), but if you ever want to measure "what % of welcome-screen visitors complete sign-up," you need alias on signup. **Add to `analyticsService.identify`:** if there's a current anon distinct ID, call `alias(userId, anonId)` before `identify(userId)`.
5. **Sign-up funnel events.** Plan tracks `auth_signed_up` (post-success) but not `auth_signup_started` or `auth_signup_failed`. Without these you cannot measure the funnel. Cheap to add.
6. **Network-vs-app error distinction.** A failed Supabase fetch should not register as a `$exception`. Either filter at capture time (`captureException` checks `err.message` for known network strings) or tag with `error_kind: 'network' | 'app'` so the dashboard can filter. Today the wrapper has no such filter, meaning offline users will spam exceptions.
7. **Test for re-entrancy guard.** §11 says the wrapper sets a "re-entrancy flag" — that's not in §3's API or §8's tests. Either add the implementation + test or drop the claim.
8. **Source-map upload step.** §11 mentions "PostHog's RN SDK uses a postinstall script for source-map upload; if it doesn't exist…" — this is too vague. **The implementation must include a concrete EAS build hook** (`eas-build-post-install` or a `postPublish` hook in `app.json` similar to Sentry's). Without it, every production stack trace is unreadable hex offsets and the entire exception-capture story is worthless. PostHog's CLI (`posthog-cli sourcemaps inject` + `upload`) is the documented path; it must be wired in `eas.json` or via `expo-constants`-injected build script.
9. **App Store reviewer access to privacy policy.** §9 step 10 says "submit to App Store with privacy labels." Apple's reviewer will click the privacy URL during review — if it 404s, rejection. Add a verification step *before* submission: "curl the privacy URL and confirm 200."
10. **Crash-free user metric.** Not in plan. PostHog supports it via the `$exception` event + person profiles; just call out in §4 that the dashboard query is `1 - (users with $exception / total active users)`. Free.

---

## 5. Cuts recommended

- **Cut `observabilityConfig.ts` as a separate file.** Inline the 3 helpers at the top of `observabilityService.ts`.
- **Cut `addBreadcrumb()` from the wrapper.** PostHog doesn't have a first-class concept. Use ad-hoc `track('breadcrumb_*')` if you ever need it.
- **Cut `npm:posthog-node` from the Edge Function.** Use raw `fetch` to `/capture/`. ~30 LOC, zero shutdown ambiguity, no Deno-npm-interop risk.
- **Cut the dedicated `observability-test` EAS profile if `preview` already exists** — OR keep it but verify in §6 that it doesn't conflict with the existing `testflight` profile (it doesn't, but the table should show all 5 profiles, not 4).
- **Cut "PostHog default `$performance`" from the privacy labels table (§7).** PostHog RN v3 does not auto-emit performance events; the row is hypothetical and may confuse the App Store reviewer.

---

## 6. Open questions resolved

1. **Identify timing.** Author's recommendation is correct: identify only when there is a session. `authService.signUp` (services/authService.ts:7-12) explicitly throws when `data.session` is null (email confirmation flow), so `signUp` only returns successfully when there IS a session — meaning identifying on both `signUp` AND `signIn` is safe. **Stance: do both, keep the plan as written.** No change needed.

2. **Privacy policy hosting.** GitHub Pages is fine. **Stance: use `<gh-user>.github.io/bemy-legal` UNLESS the user owns `bemy.app` already and can configure DNS today.** A custom domain that isn't live by submission day is a worse outcome than a GitHub-subdomain URL that is. Pin the URL before code lands, full stop.

3. **Edge Function SDK choice.** **Stance: use raw `fetch`. Skip `npm:posthog-node` entirely.** Reasoning above (§2 #5). The "try first, fall back" framing is wrong — the fallback is the better default for a serverless cron.

4. **Explicit consent checkbox.** **Stance: add the checkbox.** The cost is one Pressable + one boolean state field. The benefit is App Store reviewer protection + GDPR defensibility for a near-zero LOC investment. The "v1.1 if anyone complains" framing assumes complaints surface before App Store rejection — they don't. Pay the 30 minutes now.

---

## 7. Net new open questions

1. **What's the deploy story for the privacy policy if the user doesn't own `bemy.app`?** Plan says "host on GitHub Pages" but `bemy.app/privacy` shows up in §7 as the URL — these are inconsistent. Lock the URL before code lands.
2. **Should the wrapper add a 2-second timeout on `init()`?** PostHog SDK init issues a network request to fetch feature flags. If the request hangs, does the SDK block the JS thread? Verify at install. If yes, wrap in `Promise.race` with a 2s timeout.
3. **Does the user want the implementation agent to commission its own DB review?** No DB migration in this plan, so rules 6+7 don't apply — but explicitly call that out in the implementation brief so the agent doesn't waste cycles spawning a DB reviewer.
4. **Hidden dependency on the account-deletion thread:** none material. The plan correctly scopes it out. The only crossover is that the privacy policy mentions "deletion via in-app account deletion" — if that feature isn't shipped before the privacy URL goes live, the policy is making a promise the app can't keep. **Surface this:** account deletion must ship in the same App Store submission as PostHog, OR the privacy policy text must say "deletion via email request" until the in-app flow ships.

---

## 8. Recommended next step

**Implement-as-amended.** Do not replan. The plan is 85% correct; the remaining 15% is enumerated above. Have the planning author do a v3 pass that:

- Replaces `npm:posthog-node` with raw `fetch` in the Edge Function.
- Inlines `observabilityConfig` into `observabilityService`.
- Adds `components/ErrorBoundary.tsx` to the file list.
- Adds the EAS source-map upload hook concretely.
- Adds release tagging via `register()` on init.
- Adds `auth_signup_started` / `auth_signup_failed` events.
- Adds the alias-on-identify behavior + test.
- Resolves the `bemy.app` vs GitHub Pages URL inconsistency.
- Adds the explicit consent checkbox at sign-up.
- Drops `addBreadcrumb` from the wrapper or commits to using it in 3+ places.

Then ship to an implementation agent with the standard CLAUDE.md test-coverage and commit-and-push requirements. Total amendment effort: ~1 hour of the planner's time. Total implementation effort: unchanged from original estimate.
