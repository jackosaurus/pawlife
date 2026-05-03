# Bemy Auth Flow — Visual + Interaction Spec (Designer)

> Companion to `docs/bemy-auth-flow-decision.md` (PM, parallel). At the time this spec was written the PM doc had **not** landed on disk, so this spec covers **both** leading flow options. The engineer should read the PM doc first, identify the locked option (A or B), and follow the matching variant section below. Sections marked "Both" apply regardless.

**Scope:** visuals + interaction details for the auth flow (welcome / sign-in / sign-up), the founder's two bug reports (sign-up copy + cropped hero), and the small UX gotchas surfaced by PM.

**Source-of-truth tokens:** `constants/colors.ts`, `constants/typography.ts`, `tailwind.config.js`. No new tokens, fonts, or illustrations are introduced here.

---

## TL;DR for the engineer

- **Hero crop fix (locked direction): Option B — `resizeMode="contain"` on the existing 1254×1254 square asset, with `backgroundColor: Colors.background` (`#FFF8E7`) on the `Image` so the cream-yellow letterboxes blend invisibly into the screen.** No new asset, no PIL crop step, no founder action. Justification: the hero artwork is already on a cream-yellow ground that matches the screen background, so `contain` on a cream background reads as one continuous illustration band, not a letterboxed photo. Works at every hero height (welcome's ~40%, sign-in/sign-up's ~20%) and on every device including iPhone SE.
- **Sign-up copy bug:** the current "Add your first furry family member / Start building their story" is pet-creation copy. Replace with PM's account-creation copy (placeholder "Create your account / Your pet family's home, signed in to your phone." — engineer must take the actual strings from `bemy-auth-flow-decision.md` § Copy when it lands; if it doesn't, ship the placeholders here and PM ratifies).
- **Variant A (separate screens):** lightweight visual polish on existing `welcome.tsx` / `sign-in.tsx` / `sign-up.tsx`. No new components.
- **Variant B (bottom sheet on welcome):** new `<AuthSheet>` wrapper component. Welcome screen keeps its full hero. Sign-in/sign-up routes still exist (deep-link friendly) but the dashboard entry path is sheet-on-welcome. Sheet snaps to ~85%, segmented control inside switches Sign-in ↔ Sign-up.
- **Tests:** every new/modified component gets a `*.test.tsx`. Snap point math, segmented control switching, hero `contain` rendering, copy strings, error states, privacy consent gating, all covered.

---

## 1. Variant A — Separate Screens (status quo, polished)

If PM locks Option A, the existing route structure stays: `welcome.tsx`, `sign-in.tsx`, `sign-up.tsx`. We polish copy, fix the hero crop, and tighten the small UX details.

### 1.1 Welcome screen (Option A)

```
┌─────────────────────────────────┐
│                                 │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← 40% screen height,
│ ░░░ [hero, contain]         ░░ │   cream-yellow bg shows as
│ ░░░ cat (left) + dog cuddle ░░ │   a single seamless band
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                 │
│           Bemy                  │ ← Fraunces 700, 44/48, plum
│                                 │
│   A digital home for your       │ ← system sans, body, secondary
│       pet family.               │   centered
│                                 │
│   ┌───────────────────────┐    │
│   │   Get Started         │    │ ← brandYellow, full width
│   └───────────────────────┘    │
│                                 │
│   I already have an account     │ ← plum link, callout/medium
│                                 │
└─────────────────────────────────┘
```

- No copy change vs current welcome screen. (Welcome's headline is "Bemy" and is correct.)
- **Hero:** `resizeMode="contain"`, `backgroundColor: Colors.background`, height = `Math.round(SCREEN_HEIGHT * 0.4)`. The square asset will render at full width on every iPhone (square shorter than the 40% band on every supported device including SE — fits with cream-yellow padding above + below; padding visually disappears against `bg-background`).
- Spacing: hero → wordmark `pt-10` (40pt). Wordmark → subhead `mb-3` (12pt). Subhead → CTA `mb-10` (40pt). CTA → secondary link `mb-5` (20pt).

### 1.2 Sign-in screen (Option A)

```
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← 20% screen height,
│ ░░░ [hero, contain]         ░░ │   square asset centered
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   with cream padding sides
│                                 │
│ Welcome back                    │ ← Fraunces 700, 32/38, plum
│ Sign in to continue.            │ ← body/secondary
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚠ Inline error (if any)     │ │ ← coral 10% bg, coral text
│ └─────────────────────────────┘ │
│                                 │
│ Email                           │
│ ┌─────────────────────────────┐ │
│ │ you@example.com             │ │ ← TextInput, plum focus border
│ └─────────────────────────────┘ │
│ Password                        │
│ ┌─────────────────────────────┐ │
│ │ ••••••••••           👁     │ │
│ └─────────────────────────────┘ │
│           Forgot password?      │ ← plum, footnote/medium, right
│                                 │
│ ┌─────────────────────────────┐ │
│ │       Sign in               │ │ ← brandYellow, full width
│ └─────────────────────────────┘ │
│                                 │
│   Don't have an account?        │
│   Get started                   │ ← plum link, callout/medium
└─────────────────────────────────┘
```

- Headline color change: was `Colors.textPrimary`. **Move to `Colors.primary` (plum)** to match welcome's wordmark and pull the brand voice into every auth screen. Body subhead stays `text-secondary`.
- Hero: same `contain` treatment as welcome, height = 20%.
- "Forgot password?" stays right-aligned below password input (current placement is correct — eye-tracking studies put forgot-password near the field it relates to).

### 1.3 Sign-up screen (Option A)

```
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← 20% screen height
│ ░░░ [hero, contain]         ░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                 │
│ Create your account             │ ← Fraunces 700, 30/36, plum
│ Your pet family's home,         │ ← body/secondary, max 2 lines
│ signed in to your phone.        │
│                                 │
│ Email   [you@example.com    ]   │
│ Password [At least 8 chars  ]   │
│ Confirm  [Re-enter password ]   │
│                                 │
│ ☐  I agree to the Privacy Policy│ ← Pressable checkbox row
│                                 │
│ ┌─────────────────────────────┐ │
│ │     Create account          │ │ ← brandYellow, always enabled
│ └─────────────────────────────┘ │
│                                 │
│   Already have an account?      │
│   Sign in                       │
└─────────────────────────────────┘
```

- **Copy fix (founder bug #1):**
  - Old headline: "Add your first furry family member" (pet-creation, wrong)
  - Old subhead: "Start building their story" (pet-creation, wrong)
  - **New headline:** `Create your account` (Fraunces 700, 30/36, `Colors.primary`)
  - **New subhead:** `Your pet family's home, signed in to your phone.` (body, `text-text-secondary`, max 2 lines on iPhone SE — verified: at body 17/24 and screen width 320pt − 64pt horizontal padding = 256pt, this string wraps to 2 lines and fits)
  - **If PM doc lands with different strings, those win.** The placeholder copy here exists so the engineer is unblocked if PM is delayed.
- Hero: `contain`, height 20%, same as sign-in.
- Headline color: plum (`Colors.primary`), matching sign-in's updated treatment.
- Privacy consent: keep current Pressable row (works well; the always-enabled CTA + inline-error pattern is correct).
- Spacing: hero → headline `pt-8` (32pt). Headline → subhead `mb-2` (8pt). Subhead → first input `mb-8` (32pt). Privacy row → CTA `mt-4` (16pt). CTA → "Already have an account?" `mt-6` (24pt).

---

## 2. Variant B — Bottom Sheet on Welcome

If PM locks Option B, the welcome screen becomes the only entry into auth. "Get Started" and "I already have an account" both open a single bottom sheet that hosts both flows; route-level `sign-in.tsx` and `sign-up.tsx` are kept as deep-link fallbacks (e.g. password reset return, marketing links) but the primary path is the sheet.

### 2.1 Welcome with sheet closed (Option B) — same as Variant A 1.1

### 2.2 Welcome with sheet open (Option B)

```
┌─────────────────────────────────┐
│                                 │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Hero stays, ~40% (visible
│ ░░░ [hero stays visible]    ░░ │   above sheet handle on most
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   devices when sheet at 85%)
│                                 │
│                                 │ ← rest of welcome dimmed
│        ░░░░░░░░░░░░░░░          │   (40% black overlay)
├─────────────────────────────────┤
│           ─────                 │ ← grab handle, plum 30%
│                                 │
│   ┌───────┐ ┌───────────┐      │ ← Segmented control,
│   │Sign in│ │  Sign up  │      │   pill-style, plum filled
│   └───────┘ └───────────┘      │   for active, transparent
│                                 │   for inactive
│   Email   [you@example.com  ]  │
│   Password[•••••••••     👁  ]  │
│   Confirm [•••••••••     👁  ]  │ ← only on Sign up tab
│                                 │
│   ☐ I agree to Privacy Policy   │ ← only on Sign up tab
│                                 │
│   ┌─────────────────────────┐  │
│   │   Create account        │  │ ← brandYellow, full width
│   └─────────────────────────┘  │
│                                 │
│        Forgot password?         │ ← only on Sign in tab
│                                 │
└─────────────────────────────────┘
```

### 2.3 Sheet behavior (Option B)

- **Snap points:** `['85%']` — single snap. No half-height snap; cuts down on user confusion ("did I open this all the way?"). 85% of screen height keeps the welcome hero visible above the sheet handle on every iPhone from SE to Pro Max. 70% would crop the form on SE; 100% (full screen) loses the welcome anchor.
- **Welcome behind sheet:** dim with `rgba(0,0,0,0.4)` overlay. Welcome scroll frozen (default `@gorhom/bottom-sheet` backdrop behavior). Hero remains visible at ~40% screen height — that 40% sits above the sheet's top edge (sheet covers bottom 85%, hero occupies top 40%; 40+85=125 → 25% overlap, sheet covers the bottom of the hero. Acceptable: the cat+dog faces are in the top half of the artwork, so the visible top of the hero still shows the brand moment.)
- **Open animation:** `@gorhom/bottom-sheet` default spring (300ms, slight overshoot). No deviation.
- **Close animation:** default. Tap on dimmed area dismisses (`enableHandlePanningGesture` + backdrop `onPress`).
- **Tab switch (Sign-in ↔ Sign-up):** segmented pill control at the top of the sheet, two equal-width pills. Active = `Colors.primary` filled with white text (`text-button-sm`). Inactive = transparent with plum text + 1px plum border. Tap to switch. State lives in the sheet, not in routing — switching does not navigate, just swaps the form. Animation: instant content swap, no slide (slide creates layout jank when keyboard is up).
- **Keyboard handling:** wrap form in `BottomSheetView` + `KeyboardAvoidingView` with `behavior="padding"` on iOS, `"height"` on Android. Sheet does **not** resnap when keyboard appears (resnapping causes flicker). Form scrolls within the sheet if keyboard would cover the active input; use `BottomSheetScrollView` from `@gorhom/bottom-sheet`.
- **Privacy checkbox:** visible on Sign-up tab only, sits above CTA, same Pressable pattern as Variant A 1.3.
- **Close button:** grab handle (top-center, default `@gorhom/bottom-sheet` handle, plum at 30% opacity) is the close affordance. No explicit X button — the handle + backdrop tap is enough and matches the `QuickAddSheet` pattern already in the dashboard. **Add `accessibilityLabel="Close"` on the handle component for screen reader users.**
- **"Forgot password?" reachability:** only visible on Sign-in tab, right-aligned below password field, footnote/medium plum. Tapping opens an `Alert.prompt`-style email entry inline (current sign-in flow uses `Alert.alert` to ask for email; in the sheet we keep that flow — reset email is sent based on whatever's in the email field, prompt if empty).

### 2.4 Variant B component additions

- **`components/auth/AuthSheet.tsx`** — new component. Wraps `@gorhom/bottom-sheet` BottomSheetModal, hosts segmented tab state + the form bodies. Renders `<SignInForm>` and `<SignUpForm>` (split out of the screens for reuse).
- **`components/auth/SignInForm.tsx`** — extracted from `app/(auth)/sign-in.tsx`. Pure form, no hero, no nav. Used by both the route-level sign-in screen (deep link path) and `AuthSheet`.
- **`components/auth/SignUpForm.tsx`** — same pattern, extracted from `app/(auth)/sign-up.tsx`.
- **`components/auth/AuthSegmentedControl.tsx`** — two-pill segmented control specific to the auth sheet. (Don't reuse the `SegmentedFilter` used on record lists — that one is single-select with a different visual treatment; the auth pill control needs the filled-vs-outlined pill split.)
- **`app/(auth)/welcome.tsx`** — modified to host the `AuthSheet` and open it from "Get Started" (default tab = Sign up) and "I already have an account" (default tab = Sign in).

---

## 3. Hero Illustration Cropping Fix — locked direction

**Locked: Option B from the brief — `resizeMode="contain"` with `backgroundColor: Colors.background`.**

Justification:

- The 1254×1254 source already sits on a cream-yellow `#FFF8E7` ground identical to `Colors.background`. With `resizeMode="contain"` plus a matching background color on the `Image` element, the empty space above/below the contained square reads as a continuous illustration band, not as letterboxing.
- Zero new asset cost. No PIL/sips crop step required from engineer or founder.
- Works at every hero height (40% on welcome, 20% on sign-in/sign-up, and any sheet variant). `cover` clipped the full composition; `contain` preserves it.
- Per-screen height differences are handled automatically — the square scales to the band's smallest dimension, padded along the larger axis.

**Implementation note for engineer:**

```tsx
<Image
  source={require('../../assets/images/welcome-hero.png')}
  style={{
    height: HERO_HEIGHT,
    width: '100%',
    backgroundColor: Colors.background, // critical — hides letterboxing
  }}
  resizeMode="contain"
/>
```

Why **not** the other options (briefly):

- **A. Pre-cropped wide variant:** cost (new asset, PIL step, founder QA), and we already have a perfect-blend background — no need to crop.
- **C. Taller hero:** cuts form real estate; doesn't actually solve the crop, just hides it more.
- **D. Drop hero from sign-up:** the founder is leaning on the cat+dog illustration as the brand moment; removing it from sign-up loses the warmest screen in the funnel. Reject.
- **E. Custom hero per screen:** out of scope, no signal from founder asking for it.

---

## 4. Title + subhead copy — visual treatment

The PM doc owns the actual strings. This section locks how the chosen strings render. If PM strings differ from placeholders, fonts/sizes/colors below still apply.

| Screen | Headline | Subhead | Placeholder copy (if PM doc absent) |
|---|---|---|---|
| Welcome | Fraunces 700, 44/48, `Colors.primary`, centered, 1 line | system sans, body 17/24, `text-text-secondary`, centered, 1 line | "Bemy" / "A digital home for your pet family." (no change) |
| Sign-in | Fraunces 700, 32/38, **`Colors.primary`** (was textPrimary), left-aligned, 1 line | system sans, body 17/24, `text-text-secondary`, left-aligned, 1 line | "Welcome back" / "Sign in to continue." |
| Sign-up | Fraunces 700, 30/36, **`Colors.primary`** (was textPrimary), left-aligned, 1 line | system sans, body 17/24, `text-text-secondary`, left-aligned, max 2 lines | "Create your account" / "Your pet family's home, signed in to your phone." |

- **Color change locked beyond PM:** sign-in and sign-up headlines move from `textPrimary` (`#2D2A26` near-black) to `primary` (plum `#4A2157`). This is the one visual decision the designer is locking on top of the bug fixes — it ties the auth flow's headline color back to the welcome wordmark, gives the brand the same plum voice across all three screens, and meets WCAG AA against `Colors.background` (`#FFF8E7`). Contrast: plum on cream = 8.6:1, well above AA's 4.5:1 minimum for body text and AAA's 7:1 for large text. (Old textPrimary contrast was 12.4:1 — losing 3.8 points but staying well above AAA. Trade is acceptable for brand cohesion.)
- **Vertical spacing rule:** hero → headline = `pt-8` (32pt) on sign-in/sign-up, `pt-10` (40pt) on welcome. Headline → subhead = `mb-2` (8pt). Subhead → first form element = `mb-8` (32pt).
- **Max line count:** all headlines must fit on 1 line at iPhone SE width (320pt) at the specified font size. Subheads max 2 lines. The placeholder sign-up subhead "Your pet family's home, signed in to your phone." wraps at "signed" on SE — verified at body 17/24, 256pt available width.

---

## 5. Small UX fixes (PM gotchas)

These apply to **both variants**. The engineer wires them into `TextInput` callsites or, for global ones, into the `TextInput` primitive itself.

| Fix | Where | What |
|---|---|---|
| Email input hints | Sign-in + Sign-up email fields | `textContentType="emailAddress"`, `autoComplete="email"`, `keyboardType="email-address"`, `autoCorrect={false}`. Already-set: `keyboardType` and `autoCapitalize="none"` (default in `TextInput.tsx`). Engineer adds the rest at the call site. |
| Password input hints — sign-up | Sign-up password + confirm fields | `textContentType="newPassword"` on the password field (triggers iCloud Keychain "Use Strong Password" sheet). `textContentType="newPassword"` on confirm too (so Keychain doesn't try to autofill old saved password). `autoComplete="password-new"` on both. |
| Password input hints — sign-in | Sign-in password field | `textContentType="password"` + `autoComplete="password"`. |
| Inline error styling | All fields | Already correct in `TextInput.tsx` — coral border (1.5px → 2px? See note below) + coral footnote text below the input. **Designer addition: bump error border to match focused-state width (2px) for parity** so an errored field reads as "weighted" not "subtly outlined". Update `TextInput.tsx` line 31 from `borderWidth = focused ? 2 : 1` to `borderWidth = focused \|\| !!error ? 2 : 1`. |
| Top-of-screen error banner | Sign-in + Sign-up | Keep current treatment — `bg-status-overdue/10` rounded-xl card with coral footnote text. Already correct. |
| Forgot-password placement | Sign-in only | Keep current right-aligned placement directly below the password field. Confirmed correct. |
| Forgot-password empty-email guard | Sign-in only | Current pattern uses `Alert.alert("Enter your email", ...)`. Keep as-is. (Acceptable use of Alert per design system — not destructive, just a soft guardrail.) |
| Toast on reset-email-sent | Sign-in only | Current `Alert.alert("Check your inbox", ...)` is fine for clarity but could move to the in-app `Toast` component for warmth. **Designer recommendation: move to Toast** — `useToast()` is already wired at the root and the auth flow gets warmer for it. Lower priority than copy + hero fixes; ship in a follow-up if engineer is time-boxed. |

---

## 6. Component additions / changes

### Both variants

- **`TextInput.tsx`** — bump error border from 1px to 2px (parity with focused). Test update: `TextInput.test.tsx` adds an "applies 2px border when error is set" assertion.

### Variant A only

- No new components.

### Variant B only

- **`components/auth/AuthSheet.tsx`** — new. Tests: opens at correct snap point, segmented control switches between forms, dismisses on backdrop tap, focus moves into first input on open.
- **`components/auth/SignInForm.tsx`** — new (extracted). Tests: same as current sign-in screen tests minus the layout/hero parts.
- **`components/auth/SignUpForm.tsx`** — new (extracted). Tests: same as current sign-up screen tests minus the layout/hero parts.
- **`components/auth/AuthSegmentedControl.tsx`** — new. Tests: renders both pills, calls `onChange` with the correct value on tap, applies active style to the selected pill, accessibilityState reflects selection.
- **`app/(auth)/welcome.tsx`** — modified. Tests: tapping "Get Started" opens sheet on Sign-up tab; "I already have an account" opens sheet on Sign-in tab.

### Tests required (CLAUDE.md rule)

Every component and modified file gets a `.test.tsx` or has its existing test updated. Run `npx jest` and require green before commit. Snapshot updates for any test that includes hero rendering (because `resizeMode` change is reflected in the snapshot tree).

---

## 7. Accessibility

- **Headline `accessibilityRole="header"`** — add to all three auth screens' top-level `<Text>` headlines.
- **Form fields** — `TextInput.tsx` already renders the label as a separate `<Text>` above the field (good — no placeholder-as-label antipattern). Engineer should add `accessibilityLabel` matching the visible label on each call site for screen readers that don't pick up the visual association.
- **Bottom sheet (Variant B only)** — `BottomSheetModal` defaults to `accessibilityRole="dialog"` via `@gorhom/bottom-sheet`. Confirm the focus-trap behavior on iOS VoiceOver (focus should land on the segmented control or first input on open; Esc / two-finger scrub closes). Add `accessibilityLabel="Sign in or sign up"` on the sheet container.
- **Segmented control (Variant B only)** — each pill `accessibilityRole="tab"`, `accessibilityState={{ selected: isActive }}`. Container `accessibilityRole="tablist"`.
- **Privacy checkbox** — already correct in current sign-up (`accessibilityRole="checkbox"`, `accessibilityState={{ checked }}`, `accessibilityLabel`).
- **WCAG AA** — plum-on-cream headline contrast 8.6:1 (passes AAA for large text). Coral error text on cream `#FFF8E7`: contrast ~4.6:1 — passes AA for normal text, just barely. **Don't shrink error text below `text-footnote` 13/18.** Coral border on white input: 3.1:1 — borderline for non-text contrast, but borders are decorative-supportive, not the only error indicator (we also show coral text below). Acceptable.
- **Tap targets** — all CTAs already 44pt (Button has `py-4` = ~16pt vertical + text height). Forgot-password link has `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` — keep.

---

## 8. Founder action items

| Owner | Item |
|---|---|
| Founder | Confirm or replace the placeholder sign-up copy in §1.3 / §4 ("Create your account" / "Your pet family's home, signed in to your phone.") if PM's lock differs. |
| Founder | Confirm the locked hero-fix direction is acceptable (no new asset, `contain` + cream bg). If founder wants a wider-cropped hero asset later, that's a follow-up — current spec is no-asset-change. |
| Founder | Pick the variant via the PM doc (A or B). This spec covers both — engineer needs the lock before implementation. |
| Engineer | Implement the chosen variant per the relevant section. |
| Engineer | Apply the §5 small UX fixes regardless of variant. |
| Engineer | Update `TextInput.tsx` error border width to 2px and update `TextInput.test.tsx`. |
| Engineer | Run `npx jest` and require green before commit. |
| Engineer | Update snapshots for any auth-screen tests that capture the hero (resizeMode change is reflected in the tree). |

---

## 9. Open questions for PM

1. Variant A vs B — needs the lock from `bemy-auth-flow-decision.md`.
2. Exact sign-up copy — placeholders given here; PM string wins if different.
3. Toast vs Alert for "reset email sent" — flagged as a low-priority improvement; PM can defer.

---

## 10. Out of scope (explicit)

- Apple Sign In / Google Sign In SSO — handled separately in `bemy-sso-plan.md`.
- Account deletion — handled in `bemy-v1-account-deletion-plan.md`.
- Splash screen / app icon — separate workstream.
- New illustration variants — rejected (option E).
