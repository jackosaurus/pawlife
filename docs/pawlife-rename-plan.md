# Pawlife Rename — Canonical Implementation Plan

**Status:** Handoff-ready. Read this single document end-to-end before touching anything.
**Last updated:** 2026-04-27
**Owner at write time:** Jack Dinh (founder) + AI implementation agents
**Replaces:** ad-hoc threads referenced in `docs/pawlife-v1-release-plan.md` item #3 ("rename to Boopa")

> **Reader note.** Throughout this doc, the new brand is referenced as `<NEW_NAME>` (display form, e.g. `Schnoot`), `<new-name>` (slug form, e.g. `schnoot`), and bundle ID as `com.<new-name>.app` (the format we are tentatively standardising on — see §4 for the open question). Once the founder picks a name, do a single pass of find-and-replace on this doc to lock the placeholders before kicking off implementation.

---

## 1. Executive summary

Pawlife is being renamed before its first App Store submission. The trigger, captured in `/Users/jackdinh/Code/pawlife/docs/pawlife-v1-release-plan.md` item #3, is that "Pawlife" reads aloud as "poor life," undermining the warm-pet-family voice the product is built around. Because nothing has shipped yet — no TestFlight build is live, no real users have push tokens, no PostHog events history matters — this is the cheapest moment in the product's life to do a brand reset. After App Store submission, a rename costs an entirely new app listing (loses reviews, downloads, ranking), so we do it now, once, end-to-end.

The audits agree the rename is mechanically straightforward: substrate (Supabase project ref, GitHub user account, EAS account, Apple Developer team) all stays. What changes is a thin layer of display names, slugs, repo names, the bundle identifier, and ~149 string references in code/docs. Total estimated effort is ~9 hours of work (roughly 7 hours of agent code work + 2 hours of user point-and-click in external service UIs), wall-clock ~3 hours if the EAS preview build runs unattended in parallel. The single hardest decision is the brand name itself; a candidate set is in `/Users/jackdinh/Code/pawlife/docs/pawlife-rename-proposals.md` (round 1) with a round 2 in progress at the time of writing. **Until the name is locked, no code changes should land.**

---

## 2. Goal + non-goals

### Goal
Rename the app from "Pawlife" to a new brand identity (TBD) across:
- The on-device experience (display name, app icon name, in-app copy)
- App Store metadata (bundle ID, App Store Connect display name, privacy URL)
- Developer-facing surfaces (GitHub repo name, EAS slug, package.json, scheme, deep links)
- Hosted assets (privacy policy URL → new GitHub Pages repo)
- Observability metadata (PostHog release tag prefix, healthchecks.io check name)
- Internal documentation and tests

The output state is: a fresh user installing the new build sees the new brand everywhere, and an engineer cloning the repo six months from now never encounters the word "Pawlife" except in archived doc history.

### Non-goals (things that explicitly do NOT change)
- **Supabase project ref** (`kldjqualacoasxsrfbux`) — immutable; baked into `EXPO_PUBLIC_SUPABASE_URL`. We keep the same Postgres database, the same Auth users, the same Storage buckets (`pet-photos`, `vet-attachments`).
- **EAS project ID** (`efbd59b1-2d02-4b68-b795-86d2af0e4903`) — immutable binding from `app.json` to the EAS project. Only the slug changes; the projectId stays. **Do not run `eas init` after the rename.**
- **GitHub account / user** (`jackosaurus` / `jackdinh`) — only repo names change.
- **Apple Developer team** — same membership, same certs (provisioning profile regenerates because the bundle ID changes).
- **Code architecture** — no refactor. Service layer rules, Zod schemas, NativeWind theme tokens, all unchanged.
- **Database schema** — no migrations. The only brand reference in SQL is a comment header in `supabase/migrations/001_initial_schema.sql:1`, which is functionally irrelevant.
- **Edge Function names** — `send-reminders`, `delete-account` are generic and stay.
- **EAS env var names** — already generic (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_POSTHOG_KEY`, etc.).
- **Email** — `jacksangdinh@gmail.com` is the support address; no `support@pawlife.app` mailbox exists, so no MX rename needed.
- **Git history** — no rebase, no force-push, no amend. The rename is one or more new commits on `main`.

---

## 3. Decisions locked in

These have been thought through during the audit phase and should not be re-litigated when implementation starts.

### 3.1 Substrate stays — every service that survives

| Service | Identifier | Why it stays |
|---|---|---|
| Supabase project | `kldjqualacoasxsrfbux` | Immutable project ref. Renaming the dashboard label is cosmetic. |
| Supabase Edge Functions | `send-reminders`, `delete-account` | Generic names; no brand reference. |
| Supabase Storage buckets | `pet-photos`, `vet-attachments` | Generic names. |
| Supabase secrets | `POSTHOG_API_KEY`, `POSTHOG_HOST`, `HEALTHCHECK_URL`, `OBSERVABILITY_ENV` | Generic. |
| EAS / Expo project | projectId `efbd59b1-…` | Immutable; binds slug to project. |
| EAS env vars | `EXPO_PUBLIC_*` set across `preview` / `production` | Generic. |
| Apple Developer team | Jack Dinh personal team | Immutable. |
| GitHub user | `jackosaurus` / `jackdinh.github.io` | Account-level, not project-level. |
| PostHog API key | `phc_…` | Tied to project, not project name. Renaming the project does NOT rotate the key. |
| healthchecks.io ping URL | `hc-ping.com/<uuid>` | UUID-keyed; check name is cosmetic. |
| Email | `jacksangdinh@gmail.com` | Personal Gmail, no branded mailbox. |

### 3.2 Bundle ID changes

- **Was:** `com.pawlife.app` (declared at `/Users/jackdinh/Code/pawlife/app.json` lines 13 + 26 — iOS `bundleIdentifier` and Android `package`).
- **Will be:** `com.<new-name>.app` *(tentative — see §4 open question on whether we use `com.jackdinh.<new-name>` instead).*
- **Implications:** New App ID registration with Apple, fresh provisioning profile via EAS, new push notification certificate. Existing push tokens stored in `users.push_tokens` from any prior dev build are silently invalidated. Acceptable pre-launch.

### 3.3 Display name changes
- `app.json` → `expo.name`: `"Pawlife"` → `"<NEW_NAME>"`
- `app.json` → `expo.slug`: `"pawlife"` → `"<new-name>"`
- `app.json` → `expo.scheme`: `"pawlife"` → `"<new-name>"` (deep-link scheme; not currently invoked anywhere external, so safe to swap)
- App Store Connect display name (if record exists): edit at next version submission.

### 3.4 Privacy URL pattern changes
- **Was:** `https://jackdinh.github.io/pawlife-legal/privacy.html`
- **Will be:** `https://jackdinh.github.io/<new-name>-legal/privacy.html`
- **Mechanism:** Rename the `pawlife-legal` GitHub repo to `<new-name>-legal`. GitHub auto-redirects the old URL for ~12 months, but the in-app reference must point at the new canonical URL before the App Store Connect privacy URL field is updated.

### 3.5 Observability release format changes
- **Was:** `pawlife@<version>+<build>` (`/Users/jackdinh/Code/pawlife/services/observabilityConfig.ts:33`)
- **Will be:** `<new-name>@<version>+<build>`
- **Side-effect:** Any PostHog dashboard filter that prefix-matches `pawlife@` will stop matching new events. Pre-launch we have no such dashboards; accept the orphan and rebuild filters under the new prefix when dashboards get built.

### 3.6 Single-PR sweep is feasible
The code audit confirms the 149 references break into independent edits with no ordering dependencies between files. A single agent-driven branch can land them all in one PR. We accept this approach because:
- No migrations are involved (rule 6 of `CLAUDE.md` does not apply).
- No service-layer refactor.
- All tests are local; `npx jest` is the gate.
- Commit boundaries can be by category (config, in-app strings, docs) but a single commit is also acceptable for an indie repo with no review SLA.

---

## 4. Decisions still open

### 4.1 The brand name itself
Round 1 candidates (in `/Users/jackdinh/Code/pawlife/docs/pawlife-rename-proposals.md`) and current standings:

| # | Name | Strategy | Status |
|---|---|---|---|
| 1 | Schnoot | Real-word adjacent | **Round 1 top pick. Rejected — too dog/cat-coded for cross-species expansion.** |
| 2 | Boopla | Compound (boop + la) | Available for round 2. |
| 3 | Snootly | Coined adverb | Adjacent competitor (Snouty) launched recently. |
| 4 | Bobo | Loanword | "Silly" connotation in Spanish/Filipino. |
| 5 | Boopadoo | Onomatopoeia wildcard | Round 1 runner-up. |
| 6 | Boopa | Original founder pick (per v1 release plan #3) | Pre-empted; revisit only if round 2 fails. |

**Round 2 status (at time of writing this plan):** in progress. Brief: cross-species (works for dogs, cats, rabbits, reptiles, birds), meme-energy, character-driven names. Whichever doc emerges (likely `/Users/jackdinh/Code/pawlife/docs/pawlife-rename-proposals-r2.md`), read it before locking.

**Decision:** founder must select before any code change. There is no engineering reason to prefer one over another; this is purely a brand call. Once chosen, update the placeholders throughout this doc and proceed.

### 4.2 Bundle ID format
Two viable patterns:

**Option A — `com.<new-name>.app`** *(matches current `com.pawlife.app` shape)*
- Pros: vendor-neutral; reads as "the app for <new-name>"; if you ever sell/transfer the app, the bundle ID isn't tied to your name.
- Cons: assumes you control the brand long-term; if `<new-name>` becomes contested or the brand pivots, the bundle ID looks stale.

**Option B — `com.jackdinh.<new-name>`** *(matches v1 release plan's earlier note "currently `com.jackdinh.pawlife`" — possibly stale, but the founder-name pattern is common for indie devs)*
- Pros: makes the indie / personal-team origin explicit; if you ship multiple apps, they can all share the `com.jackdinh.*` namespace.
- Cons: harder to transfer if you ever incorporate or sell.

**Recommendation (neutral, founder calls):** Option A for the cleaner brand surface, unless the founder plans to ship multiple apps in the next 12 months — in which case Option B is the cleaner umbrella.

**Note:** the actual current bundle ID per `app.json` is `com.pawlife.app` (Option A shape), not `com.jackdinh.pawlife`. The v1 release plan's reference to `com.jackdinh.pawlife` appears stale. **Verify before committing.**

### 4.3 Custom domain vs GitHub Pages
- **Default:** continue with `jackdinh.github.io/<new-name>-legal/privacy.html`. Free, working, sufficient for App Store.
- **Optional upgrade:** register `<new-name>.app` or `<new-name>.com` and point DNS at GitHub Pages. Adds polish (email at `support@<new-name>.app`, marketing site at `<new-name>.app`), but adds annual cost ($15–$25 for `.app`, $1,500–$3,000 for premium `.com` per round 1 research) and DNS config burden.
- **Decision can be deferred.** Ship under GitHub Pages, register a domain whenever the founder is ready, and update `constants/legal.ts` in a follow-up commit.

### 4.4 App icon redesign
- **Current state:** `/Users/jackdinh/Code/pawlife/assets/images/icon.png`, `splash-icon.png`, `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`, `favicon.png`. 
- **Action item for Phase 0:** open `icon.png` and visually inspect — does the icon contain "Pawlife" wordmark or text? If yes, the icon must be redesigned/regenerated before launch. If the icon is purely a snout/nose mark with no text (which the project's design notes suggest), it can carry over to the new brand unchanged.
- **Decision:** founder-driven; not a blocker for the rename mechanics.

---

## 5. Effort + risk overview

| Phase | Owner | Est. time | Risk | Blocking? |
|---|---|---|---|---|
| 0. Decisions + prep | User | 30–60 min | Low | Yes — gates everything |
| 1. External service renames | User (UI clicks) | ~30 min | Low (mostly cosmetic) | Parallel with Phase 2 |
| 2. Code + config sweep | Agent | ~2 hr | Medium (149 refs to verify) | Parallel with Phase 1 |
| 3. EAS build + activation | User (kicks off; EAS runs) | ~12 min EAS + ~10 min install/test | Medium-high (Apple App ID registration) | Yes |
| 4. End-to-end verification | User | ~30 min | Low | Yes |

**Totals:** ~7 hours of agent work + ~2 hours of user clicks. Wall clock ~3 hours assuming the EAS preview build runs unattended while the user does Phase 1 manual UI work in parallel.

**Highest-risk steps:**
1. **Bundle ID change without follow-up build** — bricks the next build attempt until a new App ID is registered with Apple.
2. **Privacy URL change before GitHub Pages resolves under new repo name** — App Store reviewers see a 404 on the privacy link, instant rejection.
3. **Running `eas init` accidentally** — detaches build history.
4. **GitHub repo renames during a CI window** — no CI configured, so this is moot, but worth noting if CI is added later.

---

## 6. The Plan — sequenced phases

Each phase below is self-contained: prerequisites, actions, verification, rollback. A reader can stop after any phase and the system is in a coherent state.

---

### Phase 0 — Decisions + prep (User-only, 30–60 min)

**Prerequisite:** none. This is the entry point.

**Steps:**
- [ ] Pick the final brand name. Read `/Users/jackdinh/Code/pawlife/docs/pawlife-rename-proposals.md` and the round 2 doc if it exists. Lock `<NEW_NAME>` and `<new-name>`.
- [ ] Pick bundle ID format. Decide between `com.<new-name>.app` (Option A) and `com.jackdinh.<new-name>` (Option B). See §4.2. Default recommendation: Option A.
- [ ] Verify App Store Connect record state. Sign in to https://appstoreconnect.apple.com → My Apps. **If a "Pawlife" record exists**, screenshot the App Information page (name, SKU, bundle ID) and decide: rename in place at next version, or create fresh listing. **If it does NOT exist**, the first TestFlight build under the new name will create it cleanly — preferred outcome.
- [ ] Inspect app icon assets. Open `/Users/jackdinh/Code/pawlife/assets/images/icon.png` in Preview. Confirm whether the icon contains the word "Pawlife" or is purely a graphical snout. If it contains text, schedule an icon redesign as a follow-up (does not block the rename mechanically).
- [ ] Run `whois` (or use a registrar UI) on `<new-name>.app` and `<new-name>.com`. Note availability + price. This informs the §4.3 decision but does not block.
- [ ] Take baseline screenshots: EAS dashboard (Settings → slug + projectId + devices), Supabase dashboard label, current `pawlife-legal` GitHub Pages site (`curl -I https://jackdinh.github.io/pawlife-legal/privacy.html` should return `200 OK`).
- [ ] Snapshot EAS env vars: `eas env:list --environment preview` and `eas env:list --environment production`. Save output.
- [ ] Run `npx jest` on `main` and confirm green baseline (805+ tests passing per most recent commits). If anything is red on a clean `main`, fix that first — do not start the rename on a broken baseline.

**Verification:** all checkboxes ticked; the founder has both the new name and the bundle ID format committed in writing (in this doc).

**Rollback:** N/A — this phase changes nothing.

---

### Phase 1 — External service renames (User-only, ~30 min, parallel with Phase 2)

**Prerequisite:** Phase 0 complete. New name is locked.

**Steps (do in this order to minimise downtime windows):**

- [ ] **Rename the `pawlife-legal` GitHub repo first.** github.com → `jackosaurus/pawlife-legal` → Settings → top of page "Repository name" → set to `<new-name>-legal` → Rename. GitHub auto-redirects the old URL for ~12 months. **Crucial timing trap:** the new URL `https://jackdinh.github.io/<new-name>-legal/privacy.html` must resolve `200 OK` BEFORE the code change in Phase 2 lands on `main`. Verify with `curl -I https://jackdinh.github.io/<new-name>-legal/privacy.html`. If GitHub Pages takes a few minutes to redeploy, wait.
- [ ] **Update the HTML body copy in the legal repo.** Edit `pawlife-legal/index.html` and `pawlife-legal/privacy.html` in the renamed repo (or in the local sibling directory `/Users/jackdinh/Code/pawlife/pawlife-legal/` if you keep it as a subdirectory). Replace every `Pawlife` with `<NEW_NAME>` in titles and body. Commit + push. GitHub Pages redeploys in ~30–60 seconds. Re-verify with `curl`.
- [ ] **Rename the main `pawlife` GitHub repo.** Same flow: github.com → `jackosaurus/pawlife` → Settings → Repository name → `<new-name>`. Update the local clone's remote: `git remote set-url origin https://github.com/jackosaurus/<new-name>.git`. Verify with `git remote -v`.
- [ ] **PostHog project rename.** https://eu.posthog.com → top-left project picker → Project Settings → Project name → set to `<new-name>-mobile`. The project public key (`phc_…`) is unchanged.
- [ ] **healthchecks.io check rename.** https://healthchecks.io → check `pawlife-send-reminders` → pencil icon next to name → set to `<new-name>-send-reminders`. The ping UUID (the URL the Edge Function pings) is unchanged.
- [ ] **Supabase dashboard label.** https://supabase.com/dashboard → project → Settings → General → Project name → edit → Save. Cosmetic.
- [ ] **App Store Connect display name** (only if a record exists). My Apps → existing app → App Information → Name. Apple allows display name changes only between submissions. If a TestFlight build is currently live, defer to next version. SKU is immutable; leave it.
- [ ] **Apple Developer team display name** — leave alone unless the legal entity is changing. For a solo indie, no action.

**Verification:**
- `curl -I https://jackdinh.github.io/<new-name>-legal/privacy.html` returns `200 OK`.
- `git remote -v` shows the new origin URL.
- PostHog project picker, Supabase dashboard, healthchecks.io list all show new names.

**Rollback:** every UI rename is a one-click revert (rename the repo back, edit the project name back). GitHub auto-redirects work in either direction during the 12-month window.

---

### Phase 2 — Code + config sweep (Agent, ~2 hr, parallel with Phase 1)

**Prerequisite:** Phase 0 complete. Phase 1 step 1+2 (legal repo rename + HTML update + GitHub Pages live verification) complete BEFORE this phase merges to `main`.

**Branching:** create a feature branch `rename-to-<new-name>` off `main`. All edits below land on this branch.

**Steps — categorised by file and edit scope:**

#### 2a. `app.json` (high-impact, manual review)
- [ ] Line 3: `"name": "Pawlife"` → `"name": "<NEW_NAME>"`
- [ ] Line 4: `"slug": "pawlife"` → `"slug": "<new-name>"`
- [ ] Line 8: `"scheme": "pawlife"` → `"scheme": "<new-name>"`
- [ ] Line 13: `"bundleIdentifier": "com.pawlife.app"` → `"bundleIdentifier": "com.<new-name>.app"` *(or Option B if chosen)*
- [ ] Line 26: `"package": "com.pawlife.app"` → `"package": "com.<new-name>.app"` *(matching iOS)*
- [ ] Line 49: `"photosPermission": "Pawlife needs access to your photos to add a profile picture for your pet."` → `"photosPermission": "<NEW_NAME> needs access to your photos to add a profile picture for your pet."`
- [ ] Lines 65–69: do NOT touch `"extra.eas.projectId"`.

#### 2b. `package.json` (low-risk)
- [ ] Line 2: `"name": "pawlife"` → `"name": "<new-name>"`
- [ ] `package-lock.json` lines 2 + 8: same. Or just re-run `npm install` to regenerate the lockfile; either works.

#### 2c. `constants/legal.ts` (high-impact, blocks App Store privacy review)
- [ ] Line 13: `'https://jackdinh.github.io/pawlife-legal/privacy.html'` → `'https://jackdinh.github.io/<new-name>-legal/privacy.html'`
- [ ] Lines 2–8 comments mentioning "pawlife.app" and "pawlife-legal" — update for accuracy.

#### 2d. `services/observabilityConfig.ts` + test
- [ ] `services/observabilityConfig.ts:33` — `return \`pawlife@${version}+${build}\`;` → `return \`<new-name>@${version}+${build}\`;`
- [ ] Comment on line 28 — update format string in JSDoc.
- [ ] `services/observabilityConfig.test.ts:115–116` — update assertion: `expect(load().getRelease()).toBe('<new-name>@1.0.0+42');`

#### 2e. In-app copy (4 strings)
- [ ] `app/(auth)/welcome.tsx:11` — wordmark `Pawlife` → `<NEW_NAME>`
- [ ] `app/(main)/index.tsx:127` — `Welcome to Pawlife!` → `Welcome to <NEW_NAME>!`
- [ ] `app/(main)/settings/index.tsx:600` — `Pawlife v{appVersion}` → `<NEW_NAME> v{appVersion}`
- [ ] `app/(main)/pet-family/invite-member.tsx:48` — `Join my pet family on Pawlife! Use code: ${formattedCode}` → `Join my pet family on <NEW_NAME>! Use code: ${formattedCode}`

#### 2f. Test fixtures
- [ ] `__tests__/routes/settings.test.tsx:157` — `expect(getByText('Pawlife v1.0.0'))` → `expect(getByText('<NEW_NAME> v1.0.0'))`
- [ ] `__tests__/routes/signUp.test.tsx:66` — privacy URL string update to match `constants/legal.ts`.

#### 2g. Legal HTML (handled in Phase 1 step 2 — verify before merge)
- [ ] `pawlife-legal/index.html` title + heading.
- [ ] `pawlife-legal/privacy.html` title + body refs (lines 6, 57, 60, 62, 63, …). Use a sweep find-replace, then visually review — privacy policies are the kind of doc where a sloppy regex can corrupt sentences.

#### 2h. README + docs (low-risk; bulk find-replace acceptable)
- [ ] `README.md:1` — `# PawLife` → `# <NEW_NAME>`
- [ ] `docs/*.md` content references — bulk find-replace `Pawlife` → `<NEW_NAME>` and `pawlife` → `<new-name>` *(case-sensitive)*. ~78 lowercase + ~94 mixed-case references across 17 doc files. Verify the result for accidental corruption (especially in this very doc, file paths like `docs/pawlife-rename-plan.md`, and references that intentionally mention the old name in historical context).
- [ ] **Defer doc filename renames to a follow-up commit AFTER this PR lands** — keeps git blame clean for the rename diff itself. Filenames like `pawlife-rename-plan.md` can become `<new-name>-rename-plan.md` etc. in a follow-up.

#### 2i. Supabase migration comment (cosmetic)
- [ ] `supabase/migrations/001_initial_schema.sql:1` — comment header `-- Pawlife Initial Schema Migration` → `-- <NEW_NAME> Initial Schema Migration`. Functionally irrelevant; do or skip.

#### 2j. Worktrees (do NOT touch)
The grep results show `/Users/jackdinh/Code/pawlife/.claude/worktrees/agent-*/...` files contain Pawlife references. These are throwaway agent worktrees and should not be edited; they get cleaned up automatically. Ignore them in the sweep.

#### 2k. Run tests + commit
- [ ] `npx jest` — must pass green. The observability test will fail until 2d is complete; tests in 2f will fail until 2c is updated.
- [ ] `npx expo start --ios` — smoke test on simulator: launch, open settings, verify the new name renders.
- [ ] Commit with message `Rename Pawlife to <NEW_NAME>` (one commit, or split into config / code / docs / legal — founder preference).
- [ ] Push branch + open PR. Self-merge after Phase 1 completes.

**Verification:**
- `npx jest` green.
- `grep -ri "pawlife" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.html" .` returns zero hits (or only intentional historical refs).
- App launches under new name on simulator.

**Rollback:** `git revert <merge-commit>`. The branch isolation makes this trivial.

---

### Phase 3 — EAS build + bundle ID activation (User, ~25 min)

**Prerequisite:** Phase 1 + Phase 2 merged to `main`. GitHub Pages new URL verified `200`.

**Steps:**
- [ ] From `main`, run `eas build --profile preview --platform ios --non-interactive`.
- [ ] EAS detects the new bundle ID and prompts to register a new App ID with Apple. **Accept.** EAS handles provisioning profile generation automatically.
- [ ] **Do not run `eas init`.** If EAS asks "this looks like a new project, create one?" — decline; the projectId in `app.json` is the binding.
- [ ] Wait ~12 minutes for the build to complete. Receive Expo notification when ready.
- [ ] Install on phone via the EAS QR code or TestFlight internal-distribution link. Note: the previous Pawlife internal-distribution build will NOT be replaced — iOS treats them as different apps. Either uninstall Pawlife first or just leave both for the verification phase.
- [ ] Confirm the new app icon and name appear on the iOS home screen.

**Verification:**
- New app launches under `<NEW_NAME>` on home screen.
- Welcome screen shows `<NEW_NAME>`.
- `eas project:info` still shows the same `projectId` (build history intact).

**Rollback:** revert the merge, rebuild under the old bundle ID. Apple will keep the new (now-unused) App ID registered indefinitely — leave it sitting there until you're sure the rename ships.

---

### Phase 4 — End-to-end verification (User, ~30 min)

**Prerequisite:** Phase 3 build installed on device.

**Checklist (tick each on device or in service UI):**
- [ ] App icon + name on home screen show `<NEW_NAME>`.
- [ ] Splash screen renders without "Pawlife" text.
- [ ] Welcome screen wordmark says `<NEW_NAME>`.
- [ ] Settings → About footer shows `<NEW_NAME> v1.0.0`.
- [ ] Pet family invite share text says `Join my pet family on <NEW_NAME>!`.
- [ ] Sign-up footer "Privacy Policy" link opens `https://jackdinh.github.io/<new-name>-legal/privacy.html` and the page loads with new branding.
- [ ] Trigger a PostHog test event (any in-app action). Open https://eu.posthog.com → Live Events. Confirm an event appears with `release: <new-name>@1.0.0+<build>`.
- [ ] Confirm the hourly `send-reminders` cron continues to ping healthchecks.io (Edge Function URL didn't change). https://healthchecks.io → check shows recent ping.
- [ ] Trigger account deletion flow → confirm `delete-account` Edge Function executes (Supabase project unchanged).
- [ ] Send a push notification (via dev hooks per `docs/project_push_notifications.md`). Confirm it arrives. Push tokens from any prior dev build are dead — re-launching the new build registers fresh tokens.
- [ ] Run `npx jest` on `main` one last time: 805+ tests green.

**Verification:** all checkboxes ticked. Founder is satisfied the rename landed cleanly.

**Rollback:** unlikely at this stage. If a critical issue surfaces (e.g. privacy URL 404 caught by a friend), revert the PR, redeploy the old `pawlife-legal` site, rebuild under the old bundle ID. Don't delete the old `pawlife-legal` repo for 90 days post-rename; it's the safety net.

---

## 7. The 4 sequencing traps that brick the app

Memorise these. The audits surfaced them; this section restates with the "why" so a fresh reader doesn't repeat the mistake.

### Trap 1: Privacy URL change before GitHub Pages resolves under the new repo name
- **Failure mode:** `constants/legal.ts` ships pointing to `<new-name>-legal/privacy.html`, but the GitHub repo rename hasn't propagated to GitHub Pages yet. In-app Privacy link → 404. App Store Connect privacy URL field → 404. App rejected at review, OR users see a broken link in production.
- **Mitigation:** Phase 1 step 1+2 must complete and resolve via `curl -I` BEFORE Phase 2 merges to `main`. The dependency is: rename repo → push HTML updates → wait for Pages redeploy → verify URL → THEN merge code change. Don't parallelise these two specifically.

### Trap 2: Never run `eas init` after the slug change
- **Failure mode:** EAS sees the new slug, prompts "this looks like a new project, want me to create one?". If you say yes, EAS creates a fresh project, detaches build history, generates a new projectId, and orphans every prior build credential. Recovery requires manually re-attaching to the old projectId via `app.json`.
- **Mitigation:** the `expo.extra.eas.projectId` field in `app.json` is what binds the project to EAS. Slug is cosmetic for EAS purposes. Decline any "new project?" prompt. Verify post-build with `eas project:info` showing the same projectId you started with.

### Trap 3: Bundle ID change without follow-up build
- **Failure mode:** `app.json` ships with the new bundle ID merged to `main`. No EAS build runs immediately. The next time anyone (founder, a CI agent, a reviewer) tries `eas build`, Apple returns "App ID not registered" because the bundle ID has never been activated against the developer team.
- **Mitigation:** Phase 3 (EAS preview build) runs immediately after Phase 2 merges. The build is what registers the new App ID with Apple. Don't claim "rename done" until a build has succeeded under the new bundle ID.

### Trap 4: Bundle ID change invalidates push tokens (acceptable pre-launch)
- **Failure mode:** push tokens stored in `users.push_tokens` are tied to the old bundle ID. After the bundle ID change, the new build registers new tokens; the old tokens silently rot. APNs delivers nothing on the dead tokens.
- **Mitigation pre-launch:** none needed. We have at most one or two dev devices with stale tokens; re-launching the new build registers fresh tokens. Acceptable.
- **Mitigation post-launch (NOT our case yet):** would require an in-app forced-reinstall message + token re-registration handshake. **Doing the rename now, before launch, avoids this entirely.** This is the single biggest reason the rename has to happen before App Store submission.

---

## 8. Rollback strategy

| Phase | Failure mode | Rollback |
|---|---|---|
| 0 (decisions) | Founder picks wrong name | Pick a different name; redo §4 selection. No code touched yet. |
| 1 (service renames) | A UI rename causes confusion | Edit name back in the same UI — instant. GitHub repo redirects work in either direction. |
| 2 (code sweep) | Tests fail / broken merge | `git revert` the merge commit. CI green again. |
| 3 (EAS build) | Build fails under new bundle ID | Revert Phase 2 merge; rebuild under old bundle ID. New (unused) App ID can sit dormant indefinitely. |
| 4 (verification) | Critical issue caught on device | Revert Phase 2 merge; redeploy old `pawlife-legal` if needed. Old GitHub repo still exists (don't delete for 90 days). Old PostHog/healthchecks names re-editable in UI. |

**Safety net:** do NOT delete the old `pawlife-legal` GitHub repo for 90 days post-rename. GitHub Pages keeps serving it under the redirect, and it's the cleanest fallback for the privacy URL.

**Hard rule:** never force-push, never `git reset --hard origin/main`, never amend the rename commit. New revert commits only.

---

## 9. References + file paths

### Primary source documents
- `/Users/jackdinh/Code/pawlife/docs/pawlife-rename-ops-audit.md` — external services audit (8 services, sequencing traps, time estimates).
- `/Users/jackdinh/Code/pawlife/docs/pawlife-rename-proposals.md` — round 1 brand naming (Schnoot rejected).
- `/Users/jackdinh/Code/pawlife/docs/pawlife-rename-proposals-r2.md` — **does not exist at time of writing; round 2 in progress.** Cross-species, meme-energy, character-driven names per the brief.
- `/Users/jackdinh/Code/pawlife/docs/pawlife-v1-release-plan.md` — item #3 ("Rename product to Boopa") explains the "poor life" problem motivating this rename.
- `/Users/jackdinh/Code/pawlife/CLAUDE.md` — project working agreements; rules 6 (DB review) and 7 (post-migration review) do NOT apply here (no migrations).

### High-impact code files (with line numbers)
- `/Users/jackdinh/Code/pawlife/app.json` — lines 3, 4, 8, 13, 26, 49 (do NOT touch line 68 projectId).
- `/Users/jackdinh/Code/pawlife/package.json` — line 2 (and `package-lock.json` lines 2 + 8).
- `/Users/jackdinh/Code/pawlife/constants/legal.ts` — line 13 (privacy URL).
- `/Users/jackdinh/Code/pawlife/services/observabilityConfig.ts` — line 33 (release tag); line 28 comment.
- `/Users/jackdinh/Code/pawlife/services/observabilityConfig.test.ts` — line 116 (assertion).
- `/Users/jackdinh/Code/pawlife/app/(auth)/welcome.tsx` — line 11.
- `/Users/jackdinh/Code/pawlife/app/(main)/index.tsx` — line 127.
- `/Users/jackdinh/Code/pawlife/app/(main)/settings/index.tsx` — line 600.
- `/Users/jackdinh/Code/pawlife/app/(main)/pet-family/invite-member.tsx` — line 48.
- `/Users/jackdinh/Code/pawlife/__tests__/routes/settings.test.tsx` — line 157.
- `/Users/jackdinh/Code/pawlife/__tests__/routes/signUp.test.tsx` — line 66.
- `/Users/jackdinh/Code/pawlife/pawlife-legal/index.html` — title + heading.
- `/Users/jackdinh/Code/pawlife/pawlife-legal/privacy.html` — title + lines 57, 60, 62, 63, etc.
- `/Users/jackdinh/Code/pawlife/README.md` — line 1.

### Doc files (bulk find-replace + optional filename rename in follow-up)
17 files in `/Users/jackdinh/Code/pawlife/docs/` contain "pawlife" or "Pawlife" — total ~172 lowercase+mixed refs. List:
`pawlife-app-store-privacy-labels.md`, `pawlife-build-plan.md`, `pawlife-data-model.md`, `pawlife-design-system.md`, `pawlife-family-sharing.md`, `pawlife-needs-attention-spec.md`, `pawlife-pet-age-indicator-engineer.md`, `pawlife-pet-age-indicator-pm.md`, `pawlife-rename-ops-audit.md`, `pawlife-rename-proposals.md`, `pawlife-rename-plan.md` (this file), `pawlife-roadmap.md`, `pawlife-stitch-prompts.md`, `pawlife-tech-stack.md`, `pawlife-v1-account-deletion-code-review.md`, `pawlife-v1-account-deletion-plan.md`, `pawlife-v1-account-deletion-review.md`, `pawlife-v1-migrations-013-014-db-review.md`, `pawlife-v1-observability-plan.md`, `pawlife-v1-posthog-plan.md`, `pawlife-v1-posthog-review.md`, `pawlife-v1-release-plan.md`.

### Non-touched ops surfaces (verified)
- No `.github/` directory → no GitHub Actions to update.
- No Sentry, no Firebase, no Crashlytics, no Mixpanel, no Segment, no Twilio, no Stripe, no Plausible (verified via `package.json`).
- Only third-party SDKs are `posthog-react-native` and `@supabase/supabase-js`.

---

## 10. Open questions for the next picker-upper

A short FAQ for someone reading this doc cold (e.g. a new contributor, or the founder months later).

### Q1: Why are we renaming?
Per `/Users/jackdinh/Code/pawlife/docs/pawlife-v1-release-plan.md` item #3: when "Pawlife" is said aloud, listeners misinterpret it as "poor life," which undermines the warm-pet-family voice the product is built around. A fresh brand reset before App Store submission costs ~9 hours of work; a rename after launch costs an entirely new App Store listing (loses reviews, downloads, ranking). The economics are obvious.

### Q2: What's the bundle ID for, and why does it matter so much?
The bundle identifier (e.g. `com.pawlife.app`) is iOS's unique identity for an app. It binds:
- The App Store listing (one bundle ID per listing, ever).
- Provisioning profiles (which devices can install dev/internal builds).
- Push notification certificates (APNs keys are scoped per bundle ID).
- Push tokens stored in your database (each token is `(device, bundleID)` — change the bundle ID, every old token dies).
- Sign in with Apple identifiers (not used here, but generally relevant).

A bundle ID change after public launch effectively means "create a new app" — users would need to download a new app listing and migrate. Pre-launch it's just "register a new App ID with Apple, rebuild, install fresh." That's why we do it now.

### Q3: Why one PR not multiple?
The code audit (`/Users/jackdinh/Code/pawlife/docs/pawlife-rename-ops-audit.md` §2) confirms the 149 references break into independent edits with no ordering dependencies between source files. Splitting into multiple PRs adds CI/review overhead with no benefit on a solo-maintained repo. A single PR keeps the rename atomic — if you revert, you revert everything. **Caveat:** the legal repo HTML update + GitHub Pages redeploy must precede the code merge, but the legal repo is a separate git repo, so this isn't a "split the main PR" question.

### Q4: Can I do this myself, or do I need agents?
Honest assessment:
- **The mechanical work** (bulk find-replace, test updates, EAS build kickoff) is well-suited to an implementation agent because it's fan-out work with a clear test gate (`npx jest`). Agents are faster than humans at the 149-reference sweep.
- **The decisions** (brand name, bundle ID format, domain question) are founder-only. No agent should pick the brand.
- **The external service clicks** (GitHub repo rename, PostHog rename, Supabase rename, App Store Connect, Apple Developer) require the founder's authenticated UI sessions. An agent cannot do these — they're literal point-and-click in browser UIs the founder owns.
- **Verification** (Phase 4) benefits from a human eye on the device — does it look right? — but the checklist itself can be agent-tracked.

**Recommended distribution:** founder does Phase 0, Phase 1 (UIs), Phase 3 (kicks off EAS), Phase 4 (verifies on device). Agent does Phase 2 (the code sweep). This is exactly the split the audit assumed.

### Q5: Why isn't the senior DB review chain (CLAUDE.md rules 6 + 7) invoked?
Because there are no migrations. Rule 6 fires only on schema/RLS/function changes. The single SQL touch — a comment header in `001_initial_schema.sql` — is purely cosmetic and changes nothing about the schema. Skip the DB review chain; do still run the senior code reviewer pass after Phase 2 since the bundle ID change is high-blast-radius.

### Q6: What if round 2 brand proposals never deliver a name we like?
Fall back to round 1 runner-ups: Boopadoo (joyful, $1,895 .com), Snootly ($2,499 .com, has the Snouty competitor), or Bobo (4-letter, multilingual, "silly" connotation in 2 languages). Or extend the brief and run round 3. There is no engineering urgency forcing the name decision — every other phase is mechanical once the name is chosen.

---

## 11. Appendix — full hit list (mirrored from audits)

The code audit's full enumeration of "Pawlife" references in the source tree, organized for tick-off during Phase 2:

### Application config (7 refs)
| File | Line | Reference |
|---|---|---|
| `app.json` | 3 | `"name": "Pawlife"` |
| `app.json` | 4 | `"slug": "pawlife"` |
| `app.json` | 8 | `"scheme": "pawlife"` |
| `app.json` | 13 | `"bundleIdentifier": "com.pawlife.app"` |
| `app.json` | 26 | `"package": "com.pawlife.app"` |
| `app.json` | 49 | photos permission copy "Pawlife needs access…" |
| `package.json` | 2 | `"name": "pawlife"` |

### In-app strings (4 refs)
| File | Line | Reference |
|---|---|---|
| `app/(auth)/welcome.tsx` | 11 | wordmark `Pawlife` |
| `app/(main)/index.tsx` | 127 | `Welcome to Pawlife!` |
| `app/(main)/settings/index.tsx` | 600 | `Pawlife v{appVersion}` |
| `app/(main)/pet-family/invite-member.tsx` | 48 | invite share message |

### Constants + services (3 refs)
| File | Line | Reference |
|---|---|---|
| `constants/legal.ts` | 13 | privacy URL contains `pawlife-legal` |
| `services/observabilityConfig.ts` | 33 | release tag prefix `pawlife@…` |
| `services/observabilityConfig.test.ts` | 116 | matching assertion |

### Test fixtures (2 refs)
| File | Line | Reference |
|---|---|---|
| `__tests__/routes/settings.test.tsx` | 157 | `'Pawlife v1.0.0'` |
| `__tests__/routes/signUp.test.tsx` | 66 | privacy URL string |

### Legal HTML (handled in Phase 1 step 2, ~6 refs)
| File | Reference |
|---|---|
| `pawlife-legal/index.html` | title + heading |
| `pawlife-legal/privacy.html` | title (line 6), heading (line 57), body refs (lines 60, 62, 63, …) |

### Documentation (17 files, ~172 mixed-case refs, bulk find-replace)
Listed in §9. All `docs/*.md` files plus `README.md`. Filename renames deferred to follow-up commit.

### SQL (1 ref, cosmetic)
| File | Line | Reference |
|---|---|---|
| `supabase/migrations/001_initial_schema.sql` | 1 | comment header `-- Pawlife Initial Schema Migration` |

### Worktree clones (DO NOT TOUCH)
`/Users/jackdinh/Code/pawlife/.claude/worktrees/agent-*/...` files contain stale Pawlife references but are throwaway agent scratch directories. Ignore.

---

**End of plan.** When you're ready to execute, start at §6 Phase 0 and work through to Phase 4 sequentially. Tick the checkboxes as you go. Use this doc as the single source of truth — if reality diverges from the plan, update the plan in a same-PR doc edit.
