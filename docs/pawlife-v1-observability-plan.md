# Pawlife V1 — Instrumentation & Observability Plan

**Status:** Planning round complete (2026-04-26). Awaiting user decisions on 4 open questions before commissioning implementation.

**Cross-references:** `docs/pawlife-v1-release-plan.md` §8 ("analytics? observability?"), `CLAUDE.md` ("Things to Avoid" — *to be amended* once this plan ships).

---

## Executive summary

Two distinct objectives, each handled separately:

| Objective | v1 recommendation | Deferred to v1.1+ |
|---|---|---|
| **1. Alerting & error tracking** | **Sentry** (RN client + `send-reminders` Edge Function). Email alerts to a single dev inbox. ~$0 at v1 scale. | Sentry Performance / tracing, log drains, synthetic monitoring. |
| **2. Product analytics** | **PostHog cloud free tier** with session replay disabled, opt-in consent, anonymous-until-signup. Event taxonomy defined now even if shipped later. | Funnel automation, in-app feature flags, session replay (if ever). |

Why Sentry is non-negotiable for v1: today, a silent push-notification failure, a botched Supabase RLS migration, or a JS crash on the dashboard would only be discovered when the user (Jack) hit it personally. Beta testers won't write tickets — they'll just churn. Error tracking is the single highest-leverage instrumentation in this codebase.

Why analytics is a *real* tradeoff (not a slam dunk): adding PostHog drags in privacy policy, consent UX, App Store privacy labels, and ~3 dev-days of taxonomy plumbing. The "ship Sentry only in v1, PostHog in v1.1" path is defensible. The argument for shipping both: doing it once with the privacy policy / consent / labels work means you don't redo all of that for v1.1 — you ship the privacy posture once and add an SDK on top of it. See **Open question 1**.

What this plan does NOT cover: account deletion (a separate v1 App Store blocker — see Privacy §C), CI/CD, Maestro/E2E tests, or Sentry Performance tracing.

---

## Objective 1 — Alerting & error tracking

### A. Tool choice

**Pick: Sentry** (`@sentry/react-native` via the `@sentry/react-native/expo` config plugin).

| Tool | Free tier | Expo support | Deno (Edge Function) | Verdict |
|---|---|---|---|---|
| **Sentry** | 5k errors/mo, 10k perf events/mo | First-class via config plugin | Yes (`@sentry/deno`) | **Pick** |
| Bugsnag | 7-day retention free | RN SDK, no native Expo plugin | No official Deno SDK | Solid alt; weaker Edge Function story |
| Highlight.io | 500 sessions/mo | Beta RN SDK | No Deno SDK | Too early |
| Datadog RUM | None — paid only | OK | Yes | $$$, overkill for solo dev |
| Supabase logs only | $0, built-in | N/A | N/A | No client errors, no aggregation, no alerting on free tier |

Note: prefer `@sentry/react-native` over the deprecated `sentry-expo` package — Expo migrated guidance to the config-plugin form of `@sentry/react-native` in SDK 50+.

### B. Integration plan (file-level)

| File | Change |
|---|---|
| `app.json` | Add `"plugins": [["@sentry/react-native/expo", { "url": "https://sentry.io/", "organization": "...", "project": "pawlife-mobile" }]]` |
| `app/_layout.tsx` | Wrap root with `Sentry.wrap(RootLayout)`. Call `Sentry.init({ dsn, environment, release, tracesSampleRate: 0, beforeSend })` before any other init. Read DSN from `process.env.EXPO_PUBLIC_SENTRY_DSN`. |
| `services/supabase.ts` | No change — but **add** `services/observability.ts` (new) exporting `captureServiceError(context, fn, tags?)` wrapper used by every service. |
| `services/{auth,pet,health,food,allergy,family,feedback,notification,user}Service.ts` | Wrap each public method with `captureServiceError('domain:methodName', () => …)`. Re-throw so existing error UI states still trigger. |
| `services/observability.test.ts` | New tests: capture-on-throw, tag propagation, redaction of `token`/`email`/`notes` keys, returns value on success. |
| `supabase/functions/send-reminders/index.ts` | `import * as Sentry from "https://deno.land/x/sentry/index.mjs"`. `Sentry.init({ dsn: Deno.env.get('SENTRY_DSN_EDGE'), environment, release })` at module load. Wrap the main handler in `try/catch` and call `Sentry.captureException`. Capture non-`ok` Expo Push tickets as `Sentry.captureMessage('expo_push_ticket_error', { extra: { ticket } })` at warning level. |
| `eas.json` | Add `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_ENV`, `SENTRY_AUTH_TOKEN` (build-time only, never `EXPO_PUBLIC_*`) to `development` / `preview` / `production` profiles. |
| Sentry CLI / EAS hook | `eas build` with the Sentry plugin uploads source maps automatically. Verify by checking the Releases tab in Sentry after the first production build. |

### C. Alert routing

Solo dev. **Email only.** No Slack/PagerDuty. Sentry's iOS/Android app gives push notifications for critical-tagged alerts at no cost.

| Alert | Trigger | Severity | Channel |
|---|---|---|---|
| Crash-free sessions drop | < 99% over 1h, prod env | Critical | Email + Sentry app push |
| Edge Function errors | ≥ 1 unhandled exception in `send-reminders` per hour | Critical | Email + Sentry app push |
| Auth failures spike | Errors tagged `service:auth` ≥ 5 in 5 min | High | Email |
| Service-layer DB error spike | Errors tagged `category:supabase` ≥ 10 in 1h | High | Email |
| New issue (first-seen) | Default rule, prod env only | Info | Email digest, daily |

Disable Sentry's default "alert on every new issue immediately" — it's noise. Daily digest only.

### D. PII scrubbing

Implemented in two layers:

1. **Sentry dashboard data scrubbing** (Project Settings → Data Scrubbers) for: `password`, `token`, `secret`, `authorization`, `email`, `cookie`. Defaults are good — verify the toggle is on.
2. **`beforeSend` hook in `Sentry.init`** for app-specific fields: `notes`, `note`, `petName`, `pet_name`, `vaccine_name`, `medication_name`, `dosage`, `condition`, `vetName`. Implementation: walk `event.extra`, `event.contexts`, and `event.breadcrumbs[*].data` redacting keys matching a regex.

What this means in practice: any service that throws an error containing a pet name, free-text note, vaccine name, or medication name in the message will have those fields stripped before transmission. The error itself still reaches Sentry — just stripped of sensitive content.

### E. Source maps + release tagging (Expo + EAS)

The `@sentry/react-native/expo` config plugin handles source-map upload automatically during EAS build, provided `SENTRY_AUTH_TOKEN` is set in EAS secrets.

Release naming: `pawlife@{appVersion}+{buildNumber}` (default). Tag environment via `EXPO_PUBLIC_ENV` (`development` / `preview` / `production`). This makes the Releases view show errors per build and per env.

OTA updates (`expo-updates`) are *not* in v1. If/when added, source maps need a second upload step keyed on the OTA release ID. Document this when OTA lands; not a v1 concern.

### F. Health-check / synthetic monitoring

`send-reminders` runs hourly via pg_cron — no public HTTP endpoint to ping. Two options:

1. **Defer.** Sentry will capture exceptions inside the function. Silent cron-non-fire (the cron job itself misfires, function never invoked) won't be caught — but at v1 scale, the user notices within a day.
2. **Add a heartbeat row.** Function writes `(function_name, executed_at)` to a `function_heartbeats` table on every successful run. A second cron job (or external monitor) alerts if `MAX(executed_at) < NOW() - INTERVAL '2 hours'`. Defer to v1.1 unless cron silence becomes a real problem.

Going with option 1 for v1.

### G. Cost

| Item | v1 cost | At-scale cost |
|---|---|---|
| Sentry free tier | $0 | $26/mo Team plan when >5k errors/mo |
| Synthetic monitoring | $0 (deferred) | $0–10/mo Better Stack/UptimeRobot |
| **Total** | **$0** | **~$26/mo** at first paid tier |

### H. Tradeoffs surfaced

- **Sentry Performance / tracing:** Off in v1 (`tracesSampleRate: 0`). Adds value when there are real users hitting performance walls. Keep zero until v1.1 to preserve the free-tier event budget.
- **Wrapper vs. global error boundary:** A `captureServiceError` wrapper is verbose but precise (per-call tagging). A single React error boundary catches render errors but misses async service rejections that get swallowed by component-level try/catch. Doing **both** — boundary at root + wrapper in services. Verbose; worth it.

---

## Objective 2 — Product analytics

### A. Tool choice

**Pick: PostHog cloud (free tier)** via `posthog-react-native`.

| Tool | Free tier | Expo managed support | Privacy posture | Verdict |
|---|---|---|---|---|
| **PostHog cloud** | 1M events/mo | Pure JS SDK, works with managed Expo | Self-host escape hatch, EU region available | **Pick** |
| Firebase Analytics | Unlimited events | Requires `@react-native-firebase` → dev client + native build (Expo prebuild) | Google-owned; opaque BigQuery export needed for SQL analysis | Strong alt if you accept native rebuild |
| Mixpanel | 20M events/mo (Free), 100k MTU | RN SDK, Expo OK | Reasonable; less self-host friendly | Defensible alt |
| Amplitude Starter | 50k MTU | RN SDK, Expo OK | Reasonable | Free tier MTU cap can sting at growth |
| Supabase events table | Free | DIY | You own the data | No UI, no funnels — you'd build a dashboard layer. Don't. |

The Firebase tradeoff is real: it has the most generous limits and tight mobile UX, but `@react-native-firebase` forces an Expo dev client (no Expo Go) and pulls in Google's data-handling agreements. PostHog is a pure JS SDK, works in managed Expo without prebuild, and lets you migrate to self-host if privacy posture ever needs to harden. For solo-dev v1, PostHog wins.

**Disable session replay** in PostHog config (`enableSessionReplay: false`). Pet medical context is too risky to record by default. Revisit only after a privacy review.

### B. Event taxonomy

Convention: `noun_verb_past` (e.g. `pet_added`, `dose_logged`). Stable, greppable, survives renames because they live in one TypeScript union (see §D).

Properties: `snake_case`, no PII, no free-text. Use stable IDs (`pet_id`, `record_id`) — never names, dosages, vaccine names, medical conditions, exact birthdates, or emails.

| Event | When fired | Properties | Notes |
|---|---|---|---|
| `app_opened` | App enters foreground (cold + warm start) | `app_version`, `os`, `is_cold_start` | Engagement baseline. |
| `screen_viewed` | Major screen mount (selective list — not modals) | `screen_name`, `pet_id?` | Whitelist screens: dashboard, pet_detail, health_list, food_list, settings. |
| `auth_signup_started` | "Sign up" tapped on welcome | — | Funnel 1 step. |
| `auth_signup_completed` | Supabase signUp success | `signup_method` (`email_password`\|`apple`\|`google`) | No email. |
| `auth_signin_completed` | Supabase signIn success | `signin_method` | — |
| `auth_signout` | User-initiated signout | — | — |
| `pet_added` | New pet saved | `pet_id`, `pet_type`, `has_photo`, `has_breed` | Funnel 2 step. |
| `pet_edited` | Pet edit saved | `pet_id`, `fields_changed_count` | — |
| `pet_archived` | Pet archived (when feature exists) | `pet_id` | — |
| `vaccination_added` | Vaccination saved | `pet_id`, `record_id`, `vaccine_category` (core/optional/custom), `is_overdue_at_log` | Never `vaccine_name`. |
| `vaccination_edited` | Vaccination edited | `pet_id`, `record_id` | — |
| `medication_added` | Medication saved | `pet_id`, `record_id`, `frequency_category`, `is_active` | Never `medication_name`/`dosage`. |
| `medication_archived` | Medication archived | `pet_id`, `record_id` | — |
| `dose_logged` | Dose logged | `pet_id`, `record_id`, `dose_offset_minutes` (vs scheduled) | Funnel 3 step. |
| `weight_logged` | Weight saved | `pet_id`, `record_id`, `unit`, `direction` (up/down/same) | — |
| `vet_visit_added` | Vet visit saved | `pet_id`, `record_id`, `reason_category`, `has_attachment` | Never `vet_name`/`notes`. |
| `food_entry_added` | Food entry saved | `pet_id`, `record_id`, `food_type_category` | — |
| `allergen_added` | Allergen tagged on pet | `pet_id`, `allergen_category` | — |
| `attachment_uploaded` | File/photo attached to record | `pet_id`, `record_type`, `file_kind` (image/pdf), `size_kb` | — |
| `family_invite_sent` | Family invite sent | `invite_id`, `relationship_category` | No emails. |
| `family_invite_accepted` | Invite accepted by recipient | `invite_id`, `inviter_user_id` | Funnel 5 step. |
| `notification_permission_set` | Permission grant/deny resolved | `granted` (bool), `prompt_origin` (`onboarding`\|`settings`) | — |
| `feedback_submitted` | Feedback form submitted | `feedback_category` | Free-text body NOT sent to PostHog. |
| `settings_changed` | Settings toggle/value changed | `setting_key` (enum), `setting_group` | Never values themselves (they may include weight unit, timezone). Just keys. |

### C. Funnels

1. **Activation:** `app_opened` → `auth_signup_started` → `auth_signup_completed` → `pet_added`. Target: ≥60% of `auth_signup_completed` reach `pet_added` within 48h.
2. **First record:** `pet_added` → any of `vaccination_added` / `medication_added` / `weight_logged` / `food_entry_added`. Target: ≥70% within 7d.
3. **Medication adherence:** `medication_added` → first `dose_logged` for same `record_id`. Target: ≥60% within 24h.
4. **D7 retention:** `auth_signup_completed` → `app_opened` on day 7 ±1.
5. **Family virality:** `family_invite_sent` → `family_invite_accepted`. Target: ≥50% acceptance.

### D. Implementation pattern

A new `services/analyticsService.ts` wraps the PostHog SDK. All `track()` calls go through this service. Components never import PostHog directly. Two reasons:

1. Mirrors the existing CLAUDE.md rule that all Supabase calls go through `services/`.
2. Centralized typed event definitions survive refactors. One file changes when a property is renamed.

```ts
// services/analyticsService.ts (sketch — NOT to be written until user approves scope)
type EventMap = {
  pet_added: { pet_id: string; pet_type: PetType; has_photo: boolean; has_breed: boolean };
  dose_logged: { pet_id: string; record_id: string; dose_offset_minutes: number };
  // … 25+ entries
};
export function track<K extends keyof EventMap>(event: K, props: EventMap[K]): void;
export function identify(userId: string): void;  // never pass email
export function reset(): void;                    // on signout
```

Tests: `analyticsService.test.ts` covers (a) consent-disabled → no-op, (b) anonymous-until-identify, (c) reset clears identity, (d) typed events compile.

### E. Identification

- **Anonymous by default.** PostHog auto-generates a distinct ID at first launch.
- On `auth_signup_completed` / `auth_signin_completed`, call `identify(supabase_user_id)`. PostHog merges the anonymous distinct ID into the identified profile, preserving the pre-signup funnel.
- On `auth_signout`, call `reset()`. New anonymous ID issued.
- **Never pass email** as the identifier or as a person property. `user_id` (Supabase UUID) only.

### F. Dashboards to ship at launch

1. **Activation funnel** (Funnel 1 above)
2. **Weekly active users + weekly active pets** — pet care is low-frequency; WAU > DAU.
3. **Medication adherence funnel** (Funnel 3) — most product-relevant signal in v1.
4. **Retention cohort** D1/D7/D30 by signup week.
5. **Feature adoption** — % of users who ever fired each top-level event (`vaccination_added`, `medication_added`, `weight_logged`, `food_entry_added`, `allergen_added`).

### G. Cost

PostHog cloud free tier: 1M events/mo. At 5 beta testers × 50 events/day each = 7.5k events/mo. **3+ orders of magnitude under the limit.** Free indefinitely at this scale.

### H. Naming durability

Every event defined in the `EventMap` TypeScript union. Renames break the build, not the dashboards (you'd notice at compile). For dashboard-side renames, PostHog supports event-name aliases. If we ever need to rename `pet_added`, alias the old name to the new one in PostHog and update `EventMap` in the same PR.

---

## Privacy & compliance checklist

### A. App Store privacy labels (and Play Store data safety)

| Data type | Linked to user | Used for tracking | Purpose | Required if Sentry on | Required if PostHog on |
|---|---|---|---|---|---|
| Email address | Yes | No | App functionality (Auth) | — | — |
| User ID (UUID) | Yes | No | App functionality | ✓ | ✓ |
| Pet records (vaccinations, weight, food, meds, vet visits, allergens) | Yes | No | App functionality | — | — |
| Photos | Yes | No | App functionality | — | — |
| Crash data | No (after scrubbing) | No | Diagnostics | ✓ | — |
| Performance data | No | No | Diagnostics | optional | — |
| Product interaction (events) | No (anonymous-until-signup) / Yes (after) | No | Analytics | — | ✓ |
| Device ID (IDFV/Android ID) | Yes (post-identify) | No | Analytics | — | ✓ |

Play Store deltas: declare encryption-in-transit (yes), data deletion (yes — see §C), and per-category retention windows.

### B. Privacy policy (must ship before App Store submission)

Required URL hosted publicly. Sections:

1. What we collect (per category, per-third-party)
2. Lawful basis (legitimate interest for crash tracking; consent for analytics; performance-of-contract for app data)
3. Third parties (Sentry, PostHog if shipped, Supabase, Apple/Google for sign-in if shipped)
4. Retention (recommend: pet records until account deletion; analytics events 90d; crash logs 30d)
5. User rights (DSAR, deletion, correction, portability) — for v1, accept by email; automate later
6. Children's policy (not directed at children under 13)
7. Contact (jacksangdinh@gmail.com)
8. Changes & versioning

Hosting recommendation: GitHub Pages or Vercel. Static markdown → HTML. Versioned in the repo. *Don't* host on a Supabase public bucket — looks unprofessional and breaks discoverability.

### C. Account deletion (v1 BLOCKER, currently NOT in v1 release plan)

Apple has required in-app account deletion since June 2022 for any app with sign-up. Pawlife has Supabase Auth → this is a hard blocker. **Surface this to `docs/pawlife-v1-release-plan.md` as a new item.** Implementation:

- Settings → Privacy → "Delete account" (destructive button)
- Confirmation modal with re-auth (require password / fresh OAuth) to prevent accidental deletion
- Service method: cascade-delete pets (via existing FK ON DELETE CASCADE), purge storage objects under `{user_id}/`, then `supabase.auth.admin.deleteUser(user_id)` from an Edge Function (admin API requires service role — can't be called from client)

Effort: 1 dev-day including tests + reviewer agent pass.

### D. Consent UX

Recommendation: **opt-in modal on first launch, default-off for analytics, always-on for error tracking** (legitimate interest).

- One screen, after sign-in but before main shell renders for the first time.
- Two toggles: "Crash reports" (always on, explained, no toggle off — or toggleable if you want to be conservative) + "Usage analytics" (off by default, opt-in).
- Persist consent state via `expo-secure-store` (preferred over plain AsyncStorage) keyed under `consent.v1`.
- Settings → Privacy mirror so users can flip later.
- If user opts out of analytics, `analyticsService.track()` is a no-op (already covered by §D test case in analytics service).

iOS App Tracking Transparency (`expo-tracking-transparency`): **NOT required** because Sentry + PostHog as configured don't track users across other apps/sites. Skip unless you add ad SDKs (don't).

### E. PII redaction (cross-cutting)

Single source of truth: `services/observability.ts` exports a `redactPII(obj)` function used by both `Sentry.beforeSend` and (defensively) by `analyticsService.track`. Regex-based key matching: `/^(email|password|token|notes?|pet_?name|vaccine_?name|medication_?name|dosage|condition|vet_?name)$/i`.

### F. GDPR / CCPA / Australian Privacy Act posture

At v1 scale, enforcement risk is near-zero, but compliance posture must be defensible:

- **Lawful basis:** legitimate interest (Sentry) + consent (PostHog) + contract (app data).
- **DPA:** Sentry and PostHog accept click-through DPAs on signup. Supabase has a DPA available on request (free tier).
- **DSAR:** accept by email, fulfill manually within 30 days for v1. Automate via Edge Function in v1.1+.
- **Right to deletion:** in-app account deletion satisfies this for the data we control. PostHog/Sentry data: queue a manual purge via vendor APIs on user request.
- **DPIA:** not required at this scale or sensitivity.

---

## Implementation sequence

Slots into the existing v1 ordering in `docs/pawlife-v1-release-plan.md` "Suggested release ordering". Currently item 4 is "Sentry from #8 (error tracking only, defer analytics to v1.1)". This plan refines that into the sequence below.

| # | Task | Effort (dev-days) | When | Dependencies |
|---|---|---|---|---|
| 1 | Privacy policy v1 draft + host on GitHub Pages | 0.5 | Before Sentry installed (declares Sentry in policy) | — |
| 2 | Add `services/observability.ts` (`captureServiceError` + `redactPII`) + tests | 0.5 | Concurrent with #1 | — |
| 3 | Install `@sentry/react-native` (Expo config plugin), `Sentry.init` in `_layout.tsx`, EAS env wiring, source maps verified on a test build | 0.5 | After #2 | — |
| 4 | Wrap all 9 services with `captureServiceError`; update existing service tests | 0.75 | After #3 | — |
| 5 | Sentry Deno SDK in `send-reminders`, redeploy Edge Function | 0.5 | After #3. **Deploy order:** function redeploy after Sentry DSN secret is set. | — |
| 6 | Configure Sentry alert rules + verify by triggering a test crash + a test Edge Function error | 0.25 | After #5 | — |
| 7 | **Decision point:** ship PostHog in v1 (continue) or defer to v1.1 (skip to #14) | — | — | Open Q1 |
| 8 | Account deletion flow (settings UI + Edge Function + cascade tests) | 1.0 | Independent — slot anywhere before submission | — |
| 9 | Add `services/analyticsService.ts` + typed `EventMap` + consent-aware no-op + tests | 0.5 | After Q1 = ship | — |
| 10 | Consent UX: modal + Zustand store + secure-store persistence + Settings → Privacy mirror + tests | 1.0 | After #9 | — |
| 11 | Sprinkle ~25 `track()` calls across screens/services + tests for the wrapper, not for every call site | 1.0 | After #10 | — |
| 12 | Build 5 PostHog dashboards + verify events arrive | 0.25 | After #11 | — |
| 13 | App Store privacy labels + Play Store data safety form | 0.25 | Just before submission | All tracking installed + consent UX |
| 14 | (If Sentry-only) Document deferred PostHog scope in v1.1 backlog | 0.1 | — | Open Q1 = defer |

**Effort totals:**

- **Sentry-only v1:** items 1–8 + 13 = **~4.25 dev-days**
- **Sentry + PostHog v1:** items 1–13 = **~7.0 dev-days**

DB review chain: there are no schema changes in this plan. CLAUDE.md rules 6 + 7 don't apply. (The account-deletion cascade relies on existing FK constraints — verify with the senior DB review agent that all `pets` child tables already have `ON DELETE CASCADE`. If any are missing, that *is* a migration and the chain applies.)

Edge Function deploy ordering: Sentry secret in Supabase Vault → redeploy `send-reminders`. If redeployed before secret set, function still runs but errors don't ship to Sentry. Not a runtime error, but defeats the purpose of step 5.

---

## Open questions for the user

1. **Scope: Sentry-only in v1, or Sentry + PostHog in v1?** Cost delta is ~3 dev-days (consent UX is the bulk). Argument for both: privacy policy + consent + App Store labels work happens once, not twice. Argument for Sentry-only: simpler v1 surface area, get to App Store submission faster. *My lean: ship both, because the privacy posture work is the heavy lift and you only want to do it once.*
2. **Account deletion ownership:** this plan flags account deletion as a v1 App Store blocker that's currently NOT in `pawlife-v1-release-plan.md`. Do you want me to add it as a new item there (#10), or scope it inside this observability plan as part of the privacy work? Either way, 1 dev-day.
3. **Consent default:** opt-in (analytics off until user explicitly toggles) vs opt-out (on by default, EU/CA users get a banner). Opt-in is the privacy-safe default but suppresses event volume. At v1 scale event volume isn't precious. *My lean: opt-in.*
4. **Identification:** anonymous-until-signup vs always-anonymous (never `identify()`, even after signup). Always-anonymous loses cross-device + retention cohort fidelity but is the strongest privacy posture. *My lean: identify-after-signup with `user_id` only (no email), since that's already how Sentry will tag errors and the analytics value is real.*

---

## Rollout / verification plan

After each install step, verify by triggering a controlled failure or event before moving on. If verification fails, do not progress.

| Step | Verification |
|---|---|
| Sentry in RN client | Add a temporary `throw new Error('sentry_smoke_test')` button on a dev-only screen. Trigger from a `preview` EAS build. Confirm it appears in Sentry within 60s, tagged with `environment: preview`, with source-mapped stack pointing to the right file/line. Remove the button. |
| Sentry in Edge Function | Invoke `send-reminders` locally with `SUPABASE_SERVICE_ROLE_KEY` set and one intentionally bad row in `medications` (e.g. invalid timezone) to force an exception path. Confirm event in Sentry tagged `function: send-reminders`. |
| Sentry alert rules | Burst 6 fake auth errors in 5 min from a dev build. Confirm email arrives within 10 min. |
| PII scrubbing | Throw an error with `extra: { email: 'x@y.z', notes: 'secret', petName: 'Fluffy' }`. Confirm Sentry event has all three redacted. |
| Source maps + release tagging | Production EAS build → trigger crash → confirm Sentry release matches `package.json` version + EAS build number, and stack trace shows TypeScript source not bundled JS. |
| PostHog event delivery | Install on dev build, sign up a test account, add a pet, log a dose. Confirm `auth_signup_completed`, `pet_added`, `dose_logged` arrive in PostHog within 60s with correct properties. |
| Consent gating | With analytics consent OFF, repeat above. Confirm zero events arrive in PostHog. Toggle on. Confirm events resume. |
| Identification merge | Anonymous session → `screen_viewed` → sign up → `pet_added`. In PostHog, confirm the anonymous and identified events resolve to a single person with both events on the timeline. |
| Privacy policy live | Open the URL on a browser, confirm it lists every third party currently installed (Sentry, PostHog, Supabase, Expo Push, Apple Sign In if live). |
| Account deletion | Create a test account with one pet + one photo. Trigger delete from Settings. Confirm: pet rows gone, storage objects gone, `auth.users` row gone, app navigates to welcome. |
| App Store labels match reality | Re-read App Store Connect labels against installed SDKs. Any mismatch = re-submit. |

---

## Things this plan deliberately does NOT do

- No Sentry Performance / tracing in v1.
- No log drains / no exporting Supabase Postgres logs to Sentry.
- No synthetic uptime monitoring of `send-reminders`.
- No session replay in PostHog (privacy risk with health context).
- No DSAR automation (manual email handling for v1).
- No screen-by-screen `screen_viewed` instrumentation — selective whitelist only.
- No CI/CD integration of Sentry release tagging beyond what EAS does automatically.
- No A/B testing or PostHog feature flags.

All of the above are reasonable v1.1+ candidates. None are required to ship v1 safely.
