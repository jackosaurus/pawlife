# Bemy — V1 Public Release Plan

## Context

The original `bemy-roadmap.md` framed the MVP as "internal use only (personal dogfooding)" and pushed real-launch features into Phase 2 / Phase 3. The MVP is now substantially complete and we're scoping the **first public App Store release**, which collapses the previous phasing somewhat — pulling selected Phase 2/3 items forward, plus adding operational items not previously tracked (rename, env split, polish, observability).

Cross-reference: items already in `bemy-roadmap.md` are tagged below with their phase / item.

---

## Open items before App Store submission

The following items were captured by the user 2026-04-25 at the close of a long working session, with Claude's clarifying questions/concerns under each. These are NOT decisions — they're things to surface when scoping each item. The order in this list does not imply priority; see "Suggested release ordering" at the bottom.

### 1. Multi pet types — rabbit, snake, lizard, bird

**Roadmap reference:** Phase 3 item 8 ("Additional pet species")

**User's words (verbatim):**
> add other pet types in: rabbit, snake, lizard, bird. this probably means we want to re-label breed to "Breed / Species"? need to propose a plan for that but we can solve problem when we get to it

**Open questions / concerns:**
- Schema today: `pet_type ENUM('dog', 'cat')` in `001_initial_schema.sql`. Adding more requires either extending the ENUM (migration) or switching to TEXT with CHECK constraint. ENUM extension is the more conservative move.
- `PetCard.tsx` renders 🐕 for dog, 🐈 for cat. Need emoji/icons for rabbit (🐇), snake (🐍), lizard (🦎), bird (🦜).
- `constants/breeds.ts` is dog/cat-specific. For reptiles/birds, "species" replaces "breed" (corn snake, bearded dragon, cockatiel). Decision needed: maintain species lists per pet type, accept free text, or hybrid SearchableDropdown with `strictMode={false}`?
- Pet illustrations (`assets/illustrations/empty-pets.png` etc.) may need pet-type variants — or a single neutral illustration that doesn't favour mammals.
- Downstream effects to audit:
  - Allergens (mostly portable across species — chicken, beef, dust mites)
  - Food types (dry/wet/raw/mixed don't apply to reptiles; lizards eat insects, snakes eat mice). Schema may need a `food_category` field or per-species food type lists.
  - Vaccination schedules (vary wildly by species — `constants/vaccines.ts` is mammal-centric)
  - Microchip — most species can be chipped; bird/reptile owners less likely to chip
- "Breed / Species" combined label is the user's instinct and reasonable. A context-sensitive label (changes based on `pet_type`) is also viable.

### 2. Social sign-in — Google, Facebook, Apple

**Roadmap reference:** Phase 2 item 5 (Apple, Google)

**User's words (verbatim):**
> add ability to sign-in / sign-up using Google or Facebook, and apple as well? need to assess effort, complexities etc

**Open questions / concerns:**
- **Apple Sign In is REQUIRED on iOS** if any other social login is offered. App Store Review Guideline 4.8. So if we add Google or Facebook, we must add Apple. Order of implementation: Apple first.
- Supabase has built-in OAuth providers for all three. Implementation effort is mostly client-side native config + Supabase dashboard setup.
- **Apple Sign In specifics:**
  - Apple Developer account already in use via EAS
  - Need to enable "Sign In with Apple" capability in Apple Developer portal + EAS credentials
  - `expo-apple-authentication` package
  - Bundle ID: `com.jackdinh.pawlife` currently — would change if rename happens (#3)
- **Google Sign In:**
  - Google Cloud project + OAuth credentials (iOS + Android client IDs)
  - `@react-native-google-signin/google-signin` or Supabase native flow
- **Facebook:**
  - Facebook Developer account, app registration
  - Probably the lowest ROI for a pet care app — younger demographics use Apple/Google more
  - Recommend deferring unless user has a specific reason
- **Privacy implications:**
  - Apple lets users hide their email behind a private relay — code must handle missing email gracefully
  - Existing email/password flow should stay as a fallback
  - Account linking: if a user signs up with email then later tries Google with the same email, do we link or create a new account? Supabase's default is to create separate; explicit linking requires UX work.
- **Suggested phasing:** Apple Sign In as v1 (required for store submission with social login); Google as v1.1; Facebook deferred indefinitely unless validated.

### 3. Rename product to "Boopa"

**Roadmap reference:** new

**User's words (verbatim):**
> rename the entire product and app to "Boopa" which relates to "Boop" the nose of your pet and given the icon of the app is a nose/snout of a dog, i think it bodes well. I thought about the term "pawlife" and when you say it out loud it doesn't sound great because someone misinterpreted it as "Poor life" which is not good. this task should think through some more and once we decide on a final name, we need to do a detailed thorough review of all the places we need to update and make a check list and plan it out before going ahead

**Open questions / concerns:**
- "Boopa" leans cute and pet-native. The boop-the-snoot connection is on-brand for the icon.
- **Pre-decision checks (do these BEFORE committing to the name):**
  - Domain availability: boopa.com, boopa.app, getboopa.com, etc.
  - App Store + Google Play uniqueness check (search both stores for "Boopa")
  - Trademark search (USPTO + AU + UK if launching internationally)
  - Social handles: boopa, boopaApp, boopaPet — check Instagram, Twitter/X, TikTok
- **Other candidate names worth brainstorming if Boopa doesn't clear:** Snoot, Sniff, Pawly, Kibble, Tail, Murph, Whiskr (cat-leaning).
- **Bundle ID is the big footgun:** currently `com.jackdinh.pawlife`. Would become `com.jackdinh.boopa`. Bundle IDs are STICKY — once submitted to App Store, changing them requires creating a new app listing (loses reviews, downloads, ranking). **The rename MUST happen before first App Store submission.**
- **Comprehensive rename checklist:**
  - `app.json` — name, slug, scheme, iOS bundle identifier, Android package
  - `package.json` — name field
  - EAS project name (`eas.json` and dashboard config)
  - Supabase project name (cosmetic only, doesn't affect URLs)
  - GitHub repo name (rename + update remote URL)
  - All in-app strings: search for "Pawlife" and "pawlife" across the codebase — splash screen text, About copy, share text, app version reporting, etc.
  - `CLAUDE.md` first-line product description
  - `docs/*.md` — all docs reference Pawlife in headings/prose (this file included)
  - All memory files referring to Pawlife (low-stakes; cosmetic)
  - App icon — likely stays since it already shows a snout, but verify it works with the new name
  - Splash screen — update if it currently shows "Pawlife"
  - "Welcome to Pawlife" copy and Apple Sign In button text
  - EAS env vars — the env names don't reference Pawlife but worth a sweep
- **Single-shot rename ideally, not piecemeal.** Plan it as a discrete task with a checklist, do it all in one PR.

### 4. Release process — dev vs prod environments

**Roadmap reference:** new

**User's words (verbatim):**
> we need to plan the rleease process. right now we're using supabase and we're just having the infra and db etc in just 1 set, we probably want like a development environment and then a prod environment.

**Open questions / concerns:**
- Today: single Supabase project (`kldjqualacoasxsrfbux`). All work happens against prod data.
- **Recommended split:**
  - **Dev Supabase project** — for local development, Metro/dev-client builds, agent-driven changes
  - **Prod Supabase project** — for TestFlight + App Store builds, real user data
  - Optionally a third **Staging** project — for final QA before prod, especially before each App Store release. Can defer until needed.
- **Env wiring:**
  - `eas.json` build profiles: `development`, `preview`, `production`
  - `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` per profile (already exists for `preview`; add for `development` pointing at dev Supabase, `production` pointing at prod)
- **Migration management across two projects:**
  - Today migrations are run manually by the user via Supabase SQL editor against prod. With two envs, the workflow becomes: write migration → senior DB review → apply to dev → smoke-test → apply to prod
  - Supabase's `supabase db push` CLI command can apply migrations to a linked project programmatically — worth exploring once envs are split
- **Edge Functions:**
  - `supabase functions deploy send-reminders --project-ref X` already supports per-project deploy
  - Workflow: deploy to dev first, test invocation, then deploy to prod
  - Vault secrets (service_role_key) need to be set up in BOTH projects
  - pg_cron jobs need to be scheduled in BOTH projects
- **Test data seeding:**
  - Useful to have a `supabase/seed.sql` for the dev environment with realistic pets/meds/vaccinations to develop against
  - Real user accounts in dev should be obviously test (e.g. test@example.com)
- **Auth:** dev and prod will have separate user tables. Existing dev work happens on the prod DB today; will need a one-time migration of the user's own data if they want to keep their pets in prod after the split.
- **CI/CD:** today there's none. `package.json` test script + Jest run locally. Ties into #8.

### 5. UI review — text feels too small

**Roadmap reference:** new (polish)

**User's words (verbatim):**
> UI review because the text feels too small

**Open questions / concerns:**
- Where specifically? The user didn't list which screens. Likely candidates based on recent screenshots: pet detail bio chips, allergen pills, detail rows, footer text on lists, settings rows.
- The current type scale uses NativeWind classes — `text-xs` (12), `text-sm` (14), `text-base` (16), `text-lg` (18), etc.
- Quickest fix: bump the base font scale in `tailwind.config.js` (e.g. all sizes +1pt) — risk: layout breakage in compact rows
- Cleaner fix: redesign the type scale with explicit semantic tokens (`text-body-md`, `text-heading-lg`, `text-caption`) and audit each screen
- **iOS Dynamic Type** support: does the app currently respect the user's iOS system text size preference? If not, supporting `useFontScale` from React Native's `PixelRatio` or wrapping in a Text component that scales would solve "text feels too small" for users who've cranked their system text up
- **Recommend:** UX agent walkthrough first identifying the 3-5 worst offenders, then a targeted fix rather than blanket-bumping everything

### 6. BUG — archived medications still on dashboard "Needs Attention"

**Roadmap reference:** new (bug)

**User's words (verbatim):**
> I think theres a bug on the main home page / dashboard where archived medications are still prompting the user to log them, if its archived it shouldnt show there anymore

**Open questions / concerns:**
- This contradicts the senior DB review's expectation that `getActiveMedicationsForPets` filters `is_archived=false` (`services/healthService.ts:500` per earlier audit).
- **First step: reproduce.** Have the user archive a medication, return to dashboard, confirm it still appears in Needs Attention. Confirm with `SELECT id, name, is_archived FROM medications WHERE name = '<archived med>'` in Supabase SQL editor that the row is actually archived.
- **Hypotheses to check (in order):**
  1. Stale cache: dashboard uses `useActionItems` which might not refresh on focus after navigating back from the archive flow. Check the focus listener.
  2. Filter bypass: is there another code path that fetches meds without the `is_archived=false` filter and feeds it into action items?
  3. Migration didn't apply: did the user actually run migration 011 successfully? They confirmed yes earlier in the session, but verify.
  4. UI-state stale: even if data is filtered server-side, a local Zustand or component state cached before the archive could persist.
- **Most likely:** stale cache / missing focus refresh on the dashboard. The dashboard `useActionItems` hook calls `refresh()` on focus; verify it's actually firing after the archive navigation pops.
- This is a v1 blocker — not shipping with a known data-correctness bug.

### 7. ~~Slow pet detail screen load~~ (DEFERRED — moved to backlog 2026-04-26)

Moved out of v1 scope. Tracked in "Deferred to v1.1+" below.

### 8. Analytics + observability

**Roadmap reference:** Phase 3 item 7 (T&Cs / privacy / delete account, partially)

**User's words (verbatim):**
> analytics? observability?

**Open questions / concerns:**
- Today: nothing. CLAUDE.md says "Don't add analytics, error tracking, or CI/CD yet" — this is the moment to revisit.
- **Error tracking (highest value):** Sentry React Native. Free tier covers small user bases. Catches crashes, JS errors, slow renders. Install + minimal config: ~half a day.
- **Edge Function errors:** Sentry has a Deno SDK; can be added to `send-reminders` so silent failures (e.g. Expo Push API rejecting tokens) get logged.
- **Product analytics:** at v1 scale (single user → maybe a handful of beta users) analytics is mostly "validate the app works" not "drive product decisions." PostHog or Mixpanel both have generous free tiers. PostHog is open-source-friendly. Amplitude has a more polished UI but requires paid for any non-trivial data.
- **Privacy implications:**
  - GDPR/CCPA: technically required if any EU/CA user signs up. App Store privacy labels REQUIRE you to declare any analytics SDK that captures personal data.
  - Sentry: declare crash reports + diagnostic data
  - PostHog: declare usage data + identifiers (or opt for anonymous-only events)
  - Add a privacy policy URL in App Store Connect
- **Recommended phasing:**
  - **v1 must have:** Sentry for error tracking. Privacy policy in App Store Connect.
  - **v1.1 nice to have:** PostHog or similar for usage analytics.

### 9. Automated UI testing strategy

**Roadmap reference:** new (engineering infra)

**User's words (verbatim):**
> is there a way we can automate UI testing? I know we have a lot of unit testing coverage etc however it doesnt actually mean things work or work as expected or something isnt broken in the UI. I wanted to think about whats the best way to approach this problem so that we can continue to move fast and make changes while ensuring that the stuff we ship doesnt break other things. Like for example is there like UI testing or using screenshots or something? i am not sure, this task is to think about how we scale this

**Open questions / concerns:**
- Three categories worth considering, ranked by ROI for a small RN app:
  1. **Maestro** — YAML-based E2E testing, runs on simulator/device, lowest setup cost. Probably the best fit.
  2. **Detox** — full E2E framework, more powerful but more flake-prone and harder to maintain
  3. **Visual regression** — Percy, Chromatic, or screenshots-via-Maestro. Catches UI regressions, complementary to E2E.
- **What to test (hierarchy of value):**
  - Critical happy paths: sign in → see pets → tap pet → see bio + tabs → tap medication → log dose
  - Migration sanity: each new schema migration adds an E2E test that exercises the affected screens
  - Visual regression on key screens (dashboard, pet detail, edit form, archive flow)
- **Tradeoffs:**
  - E2E tests are slow (minutes per run vs Jest's seconds), flaky (timing/network issues), and expensive to maintain when UI changes
  - Visual regression is easier but requires baseline screenshots and review when intentional changes happen
  - Both add CI/CD complexity (#4 + #8 territory)
- **Recommended approach:**
  - **v1 don't gate on this** — ship without E2E. Manual QA per release is fine for one user.
  - **Post-v1:** introduce Maestro with a minimal happy-path test (sign in → dashboard → pet detail → log dose). Add tests as bugs are found, not preemptively.
  - **When to invest more:** when there are multiple developers, or when bug reports start outpacing manual QA capacity.
- **The "we can move fast and not break things" goal is best served by:**
  - Strong unit tests (already have, ~700 tests)
  - Senior DB review chain (already have, formalized in CLAUDE.md)
  - One Maestro happy-path test covering the most critical flow
  - Sentry catching what slips through
  - Not by exhaustive UI testing, which becomes maintenance debt

---

## Suggested release ordering

This is a recommended sequencing — not final. Each item should still get its own scoping pass with proposals before commitment.

1. **Bug fix #6** (archived meds on dashboard) — blocker, do first
2. **UI review #5** (text scale) — polish pass before expanding scope
3. **Sentry from #8** (error tracking only, defer analytics to v1.1) — instrumentation before feature work
4. **Env split #4** (dev vs prod) — needed before pulling forward Phase 2/3 items so we have a safe place to develop
5. **Multi pet types #1** (rabbit, snake, lizard, bird) — depends on agreed approach for breed/species labelling
6. **Apple Sign In from #2** (only Apple, defer Google/Facebook to v1.1)
7. **Rename to Boopa #3** — last, so we change bundle ID exactly once, just before submission
8. **App Store readiness:** privacy policy, App Store Connect setup, screenshots, store listing copy, submission

## Deferred to v1.1+

- Google sign-in (#2 partial)
- Facebook sign-in (probably indefinitely)
- PostHog product analytics (#8 partial)
- **Pet detail screen load perf (#7, full scope)** — fan-out of 6+ hooks on focus causes 1-2s load. Quick wins (parallel fetches, skeleton states) and heavier wins (TanStack Query, denormalized `pet_dashboard` view, Zustand cache from dashboard) all deferred. Revisit when load time becomes user-blocking or when the app grows further. Notes from original v1 scoping retained in git history.
- Maestro E2E tests (#9)
- Multi-policy insurance, severity field on allergies, allergen-medication warning (already deferred — see `MEMORY.md → project_pet_record_followups.md`)
- Archive sections for vaccinations / food / weight (currently medications-only)
