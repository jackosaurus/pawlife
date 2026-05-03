# Bemy auth flow architecture decision (PM)

**Status:** Locked recommendation. Designer agent runs after this doc and produces the visual spec.
**Author:** Product Manager agent
**Date:** 2026-05-02
**Scope:** Decide whether sign-in and sign-up are separate screens, a bottom sheet on welcome, or a single combined screen. Lock copy. Direct the designer on the hero image cropping fix.

Inputs read: `app/(auth)/welcome.tsx`, `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`, `services/authService.ts`, `docs/bemy-design-system.md`, `docs/bemy-sso-plan.md`, `package.json` (confirmed `@gorhom/bottom-sheet ^5.2.8` already installed and used in `components/pets/QuickAddSheet.tsx`).

---

## 1. Status quo audit

The shipped flow is three screens: **welcome → sign-up** (via `Get Started`) **OR welcome → sign-in** (via `I already have an account`). The welcome screen has a 40%-tall hero illustration, a 44pt `Bemy` Fraunces wordmark, the tagline "A digital home for your pet family.", a brand-yellow primary CTA, and a tertiary text link to sign-in. The sign-up and sign-in screens each carry a 20%-tall reprise of the same hero, a 30–32pt Fraunces headline, a body subhead, the form, and a cross-link to the other flow.

What works: the welcome screen is genuinely nice — generous hero, the wordmark sits where it should, the warm tagline lands. The sign-in screen is competent — "Welcome back" is the right register. What doesn't:

1. **The sign-up headline is wrong.** It currently reads "Add your first furry family member / Start building their story." That is pet-creation copy on an account-creation form. The user is being asked for an email and password, not a pet's name. Founder has flagged this.
2. **Hero image is cropped weirdly on sign-up (and sign-in).** The 1024×1024 `welcome-hero.png` is rendered into a `~20%-of-screen × full-width` band with `resizeMode="cover"`, so the renderer scales the image up until it fills the width, then crops the top and bottom heavily. On a typical phone (~390pt wide × ~170pt hero band) only the central horizontal slice survives — the cat and dog faces, but not the full composition the welcome screen shows.
3. **Two visual reprises of the same hero.** Welcome shows it big. Sign-up and sign-in both show a smaller cropped version of the same image one tap later. It's not adding anything; it's just costing vertical space the form needs.

These are downstream of the architectural decision in §3 — solve the architecture first, then the headline copy and hero treatment fall out of it.

---

## 2. Architectural options

### Option A — Status quo (3 separate screens)

**How it works:** Welcome screen with hero + wordmark + tagline + two CTAs. Tap `Get Started` → push sign-up screen. Tap `I already have an account` → push sign-in screen. Both sub-screens reprise the hero (smaller) and host their form.

**User sees:** Welcome → distinct destination screen → form.

**Good:** Clear mental model. Each screen has a single purpose. Already shipped. Easy to add SSO buttons later (just a row above the email field on each form). Easy to deep-link `/sign-in` and `/sign-up` from password-reset emails.

**Bad:** Three screens of chrome to maintain (welcome, sign-up, sign-in). Two screens reprise the same hero, paying for it in vertical space the form needs and in the very cropping bug the founder flagged. One extra navigation tap before the user touches an input. The cross-link at the bottom of each form ("Already have an account? Sign in" / "Don't have an account? Get started") admits the screens are near-duplicates.

**Build cost from current state:** Zero — already shipped. Fixes still needed: headline copy + hero crop.

### Option B — Bottom sheet on welcome

**How it works:** Welcome screen stays as-is. Tap `Get Started` → a bottom sheet slides up to ~85% of screen height with the sign-up form. The sheet has a segmented control or tab-toggle at the top: `Sign up | Sign in`. Tapping the toggle swaps form fields without dismissing the sheet. The hero illustration stays visible behind the sheet's dimmed backdrop, anchoring the brand.

**User sees:** Welcome screen → sheet rises over it → form. The hero never disappears; it's still visible at the top above the sheet.

**Good:** One visual anchor (the welcome hero) does double duty — no reprise, no second crop. Sign-up and sign-in are one tap apart, not a navigation stack apart, which matches how users actually deliberate ("wait, do I have an account?"). `@gorhom/bottom-sheet` is already a dep; the design system already documents bottom-sheet patterns. Pan-down-to-close gives a graceful escape hatch back to the welcome marketing copy.

**Bad:** Bottom sheets are slightly less keyboard-friendly than full screens — when the keyboard rises on a small phone, the form can feel cramped. Solvable with `keyboardBehavior="interactive"` and `snapPoints` tuned for keyboard-up state, but it's an implementation detail to get right. Password-reset deep links need to open the sheet on cold start, which means the welcome screen needs to read a query param and auto-present.

**Build cost:** ~0.5–1 agent-day. New `<AuthSheet>` component wrapping `BottomSheet`, port the two existing form bodies into it, swap the welcome CTAs to open the sheet at the right tab, delete the standalone `sign-up.tsx` and `sign-in.tsx` routes (or keep them as thin redirects for deep-link support).

### Option C — Single combined screen (smart-detect)

**How it works:** Welcome IS the auth screen. Hero + wordmark at top, then one email field, one password field, one button labeled `Continue`. On submit, the app probes Supabase to see if the email exists; if yes, it treats the password as a sign-in attempt; if no, it treats the same input as a sign-up. The user never has to decide between "sign up" and "sign in."

**User sees:** Welcome with form embedded → type email → type password → tap one button → in.

**Good:** Lowest cognitive load on paper. Fewest taps. Feels modern (Slack, Notion, Linear all do something like this).

**Bad:** Several real problems. (1) Supabase has no first-class "does this email exist?" endpoint that's safe to expose — the recommended pattern is to attempt sign-in and parse the error, which is racy and leaks user enumeration. (2) Sign-up needs a confirm-password field and a privacy-policy checkbox (legal requirement); sign-in needs neither. So the form is never actually identical between the two cases — you either always show the extra fields (worse UX than separate screens) or you reveal them after the email check, which is the same two-step it was trying to avoid. (3) Welcome screen is currently a marketing surface — the hero, the wordmark, the tagline. Cramming a form onto it kills the warm "this is Bemy" first impression that's doing real work for an app with zero current users. (4) Magic link would solve most of this elegantly, but the SSO plan parks magic-link as a future polish item, not v1. **Combined-screen makes sense when the form is genuinely the same shape; for Bemy at v1, it isn't.**

**Build cost:** ~1.5–2 agent-days, mostly because of the email-existence-probe edge cases and the legal-checkbox conditional logic. More expensive than B for less benefit.

### Option D — Welcome marketing screen + sheet, with deferred password (rejected)

Considered: ship welcome with a single email field; on submit, send a magic link; password is set later in settings. This is genuinely the best UX for a hobby app — no password fatigue, no checkbox, one tap. **Rejected for v1** because the SSO-parking plan (`docs/bemy-sso-plan.md` §1.1) explicitly defers magic-link to a later polish round, password reset email infrastructure is the only OTP wiring shipped, and the founder's explicit ask in this thread is between A/B/C. Documenting it here so the next iteration can pick it up cheaply.

---

## 3. Recommendation — Option B (bottom sheet on welcome). Locked.

**Pick B.** The welcome screen is doing real brand work for an app where the founder has zero users and zero marketing budget — the hero, the wordmark, the tagline are how a curious tester learns "this is Bemy" before they decide to sign up. Throwing that away (Option C) saves zero meaningful taps because the form isn't truly the same between sign-up and sign-in (confirm-password + privacy checkbox are sign-up-only). Keeping three screens (Option A) reprises the hero twice and cropping it twice — exactly the bug the founder flagged.

Option B keeps the welcome's brand surface as the single visual anchor, eliminates the cropped hero reprise entirely, collapses the sign-up/sign-in decision into a one-tap toggle inside the sheet (which matches how users actually deliberate), and uses a primitive (`@gorhom/bottom-sheet`) we already ship and have a working pattern for in `QuickAddSheet`. **Cognitive load** is lowest because the user always has the welcome hero in peripheral view as orientation. **Conversion** is at parity or better with A — same number of taps to a working account, but the user never loses the "this is Bemy" context. **Brand fit** is right — bottom sheets feel indie and tactile, not fintech-formal. **Implementation cost** is ~0.5–1 day. **Future flexibility:** when SSO un-parks, the Apple/Google buttons sit at the top of the sheet above the email field — the standard pattern — and the same sheet handles both sign-up and sign-in tabs. Magic-link layers in cleanly too: it just becomes a `Send me a magic link instead` link below the password field on the sign-in tab.

---

## 4. Copy — title and subhead

The current sign-up headline is pet-creation copy on an account-creation form. Replace. Below are candidates for the **bottom sheet's** sign-up and sign-in tabs (Option B). Voice anchors: warm, plain English, Beau + Remy + Jack from Australia, no jargon, no fintech formality. Don't say "register" or "create your account" — both are corporate-flat.

### Sign-up tab — headlines (≤ 8 words)

1. **"Welcome to the family." ← recommended**
2. "Let's get you set up."
3. "Start your pet family."
4. "Make a home for your pet."
5. "Hello — let's begin."
6. "Get Bemy on your phone."

Why #1: it picks up the design system's "pet family" framing (Voice & Tone rule 1), reads warm without trying too hard, and works whether the user has one pet or six. It also lands gracefully on the sign-in tab swap (see below) — "Welcome to the family" → "Welcome back" is a clean parallel.

### Sign-up tab — subheads (≤ 14 words)

1. **"Beau, Remy, and the rest of the pack are excited to meet yours." ← recommended**
2. "An email and a password — that's it. We'll meet your pets next."
3. "Just an email and password to start. Add your pet family on the next screen."
4. "We're glad you're here. Set up your account and meet your pet family."
5. "Set up takes about thirty seconds."
6. "From Jack and the dogs in Australia."

Why #1: Beau and Remy by name is the founder's voice (per `bemy-design-system.md` §Voice — Jack-and-the-dogs is part of the brand). It signals the indie hobby register the founder wants. Backup pick is #2 if the founder feels naming the dogs is too much for the auth surface and prefers a functional explanation of what's about to happen.

### Sign-in tab — headlines (≤ 8 words)

1. **"Welcome back." ← recommended (no change from current sign-in screen)**
2. "Good to see you again."
3. "Hey, welcome back."
4. "Back already?"

Why #1: it's already shipped, it's correct, it composes with the cached-display-name affordance the engineer already wired (`Welcome back, ${cachedDisplayName}`). Don't fix what isn't broken.

### Sign-in tab — subheads (≤ 14 words)

1. **"Sign in to pick up where you left off." ← recommended**
2. "Sign in to continue." *(current — fine, but a touch flat)*
3. "Your pet family is waiting."
4. "Let's get you back to your pets."
5. "Pick up Luna's story where you left off." *(only works post-name-cache)*
6. "Same email and password as before."

Why #1: warmer than the current "Sign in to continue.", still concrete about the action, doesn't require any state we don't have on first load. #5 is the dream once the name cache is live but is non-blocking for this round.

---

## 5. Hero image cropping — direction for the designer agent

**Diagnosis** (matches the founder's hunch): the source asset is a 1024×1024 square with the cat-and-dog composition centered. The welcome screen renders it into a band that's roughly 390pt wide × ~340pt tall (40% of a 6.1" iPhone) — the aspect ratio is close enough to square that `resizeMode="cover"` shows most of the composition with only minor top/bottom crop. The sign-up and sign-in screens render the *same square* into a band that's ~390pt × ~170pt (20%) — that's a 2.3:1 letterbox of a 1:1 source, so `cover` scales the image up to fill the width and then crops away ~57% of the height, leaving only a horizontal slice through the middle (the faces). Hence the "weirdly cropped" look.

**Recommendation:** **Drop the hero from the auth form surface entirely** when we move to Option B. The welcome hero stays as the brand anchor at full 40% size. The bottom sheet that rises above it does **not** reprise the illustration — it's a clean form surface (white background, rounded top corners, drag handle, tab toggle, fields, CTA). The hero is still visible peeking out behind the sheet's dimmed backdrop, doing the brand-anchoring job we'd otherwise duplicate poorly inside the sheet.

This direction also (a) gives the form more vertical room, which matters with the keyboard up on small phones, (b) eliminates the cropping bug as a category rather than papering over it, (c) sidesteps the "do we crop a 1:1 source for the form?" question entirely — no second crop, no second asset.

If the designer disagrees and wants a small visual element inside the sheet (e.g. a tiny `Bemy` wordmark above the headline), that's fine — but no illustration reprise. The illustration belongs to the welcome screen.

If for some reason Option B is overruled and we stay on three screens (Option A), the fix would be: commission a wide-format crop of the hero (~3:1 or ~4:1 aspect) specifically for the form-screen band, so `cover` doesn't have to throw away most of the image. That's a designer task, not an engineer task — flag this only as the fallback path.

---

## 6. Other small flow gotchas (designer to fold into the spec)

A short audit of small UX issues. Each is small enough to fix in the same redesign round; flagged so the designer doesn't miss them.

1. **Email autofill hints are not wired.** Both `app/(auth)/sign-in.tsx` and `app/(auth)/sign-up.tsx` instantiate `<TextInput>` for email without `textContentType="emailAddress"`, `autoComplete="email"`, `autoCapitalize="none"`, or `keyboardType="email-address"` *consistently* (some are present, some not — needs an audit pass). For passwords on sign-up, `textContentType="newPassword"` triggers iCloud Keychain's strong-password-suggestion sheet, which is **the single biggest free conversion win** for the email-only flow. On sign-in, `textContentType="password"` triggers the autofill from saved credentials. **This is non-negotiable** — it's mentioned explicitly in the SSO-parking rationale (`bemy-sso-plan.md §1.1` "iCloud Keychain integration") as the substitute for SSO friction reduction. The designer should call this out to the implementation engineer in the visual spec.

2. **Privacy-policy checkbox: keep, but reframe.** The SSO plan parking rationale doesn't explicitly say "move to footnote" — that's a misread. The current "always-enabled CTA, inline error if checkbox missing" pattern is correct (matches the design system's destructive-action ethos: warmer than disabled buttons, gives the user useful feedback). **Keep the checkbox; move the policy link copy to a single line of footnote-style text under the CTA, with the checkbox embedded inline.** Pattern: `By tapping Continue, you agree to our [Privacy Policy].` is the click-wrap variant — but that's a legal change that needs founder confirmation (see open question 1 below). Default until confirmed: keep current explicit checkbox pattern, just visually tighter inside the sheet.

3. **Error copy is currently terse.** `services/authService.ts` rethrows raw Supabase errors. The user sees strings like "Invalid login credentials" — that's terse and slightly accusatory. Voice-aligned replacements: existing email on signup → "Looks like you've signed up before. Try signing in instead?" (and toggle to the sign-in tab). Wrong password on sign-in → "That password doesn't match. Want to reset it?" (with the reset link inline). Network failure → "We couldn't reach our servers. Check your connection and try again." Designer should write the full error-state copy table.

4. **"Forgot password?" placement is fine but the empty-state Alert is jarring.** Current behavior: tap forgot-password with empty email field → `Alert.alert('Enter your email', ...)`. Per the design system, `Alert.alert` for non-destructive prompts breaks voice. Replace with an inline error on the email field: `Type your email above first, then tap "Forgot password?" again.`

5. **Cross-link copy disappears in Option B.** "Don't have an account? Get started" / "Already have an account? Sign in" go away — replaced by the tab toggle at the top of the sheet. Founder flagged the duplication implicitly by asking about a sheet; this is the cleanup.

---

## 7. Open questions for the founder

1. **Click-wrap vs explicit checkbox for the privacy policy.** Click-wrap (`By tapping Continue, you agree to our Privacy Policy.`) is faster, well-established legally for hobby/B2C apps, and removes one form element from the sheet. Explicit checkbox (current pattern) is more conservative and what we ship today. **The legal substance is identical**; the question is purely UX. Recommendation: ship click-wrap unless you have a reason to be conservative. Confirm one way or the other before the designer locks the spec.

2. **Default tab when the sheet opens — is it the sign-up tab from `Get Started`, or do we honour the original entry point?** Strong default: **the entry CTA dictates the open tab**. `Get Started` → sheet opens on Sign up tab. `I already have an account` → sheet opens on Sign in tab. The toggle is for users who realise mid-form they tapped wrong, not for the primary navigation. Confirm this matches your mental model.

3. **Magic-link as a v1.0.x fast-follow.** The SSO plan parks magic-link but flags it as a cheap polish. Do you want it included in this round (adds ~0.5 day, replaces the password field on sign-in with `Email me a sign-in link`), or held for after first App Store ship? Default: hold. Email + password with iCloud Keychain hits the bar.

---

## 8. Handoff to the designer agent

Designer: read this doc, then produce the visual spec for Option B. Specifically:

- The bottom sheet layout: drag handle, sign-up/sign-in tab toggle, headline + subhead (use the recommended copy from §4), form fields, privacy-policy treatment (default to current explicit checkbox unless founder answers Q1 in §7 with click-wrap), CTA, secondary `Forgot password?` placement (sign-in tab only).
- Empty-keyboard layout and keyboard-up layout. The latter matters more — the form should still breathe with the keyboard up on a 6.1" phone.
- No hero illustration reprise inside the sheet (per §5). The welcome hero stays, sheet rises above it on a dimmed backdrop, hero remains peeking through.
- Error states: write the inline-error copy for each of the cases in §6 item 3.
- The `Forgot password?` empty-state inline error (replaces the `Alert.alert`) per §6 item 4.
- A mockup or word-mockup of the welcome screen + sheet stacked, showing how the hero still anchors the brand even with the sheet open.

The implementation agent that runs after the designer should be briefed with: (a) wire all the autofill / textContentType hints from §6 item 1, (b) port the form bodies into a new `<AuthSheet>` component built on `@gorhom/bottom-sheet`, (c) replace the standalone `sign-up.tsx` and `sign-in.tsx` routes with redirects (so existing password-reset emails still work), (d) tests for the tab toggle, validation, and the privacy-checkbox/click-wrap behaviour.
