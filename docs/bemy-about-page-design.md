# Bemy About page — visual + interaction design spec

> Visual / interaction spec for the new About page reachable from the menu
> (Settings · Pet Family · Send Feedback). Copy is owned by the PM agent in
> `docs/bemy-about-page-copy.md` (Part 1 ships in app, 312 words across
> 5 sections: "Hi, I'm Jack" / "Why I built it" / "What Bemy is, and isn't" /
> "A small ask" / "Thanks for being here", signed "— Jack"). Tokens,
> components, and patterns referenced below are canonical in
> `docs/bemy-design-system.md`; this doc only spells out the page-specific
> decisions.
>
> **Section-count alignment:** the PM lands on 5 sections, all short.
> The layout below uses the PM's actual 5 section headings; the
> word-mockup in § 2 was authored generically and should be read with
> "Why Bemy exists" / "Where the name comes from" / etc. substituted
> by the PM headings 1:1. The pull-quote ("Bemy = Beau + Remy") sits
> inside the first section ("Hi, I'm Jack") immediately after the
> sentence that names the dogs — see § 2 *Pull-quote placement update*
> below.

---

## TL;DR — locked decisions

| Decision | Lock |
|---|---|
| Menu position | About row sits **directly above Send Feedback**, below Pet Family. The About → Feedback proximity is intentional: the page ends with a "Tell me what you think" CTA, and that CTA is one row above in the menu when the user backs out. |
| Menu icon | `paw-outline` (Ionicons). Pet-first, on-brand, distinct from existing menu icons. |
| Route | `app/(main)/about.tsx`, push (not modal). |
| Hero treatment | **Reuse `welcome-hero.png`** at ~30% screen height, top of page, no overlay. The Fraunces wordmark "Bemy" overlays the hero in plum, centered. |
| Section rhythm | Fraunces section headings (`text-title`, plum) over body in system sans (`text-body`, primary). Generous whitespace as the divider — no hairline rules between sections. |
| Pull-quote | The "Bemy = Beau + Remy" beat is a one-line pull-quote in Fraunces `text-largeTitle`, plum, centered, ~32pt vertical breathing room above and below. New `<PullQuote>` primitive lives at `components/ui/PullQuote.tsx`. |
| Imagery scenario | **Scenario A (illustration-only)** — `welcome-hero.png` as page hero. Scenario C (custom Beau+Remy illustration) is the v1.1 polish path; Scenario B (real photos of the founder's dogs) is parked until founder decides. |
| Closing CTA | Plum primary `Button`, routes to `/(main)/feedback` via `router.push`. Light haptic on press. **Label: "Send Feedback"** to match the menu row label the PM copy explicitly references in section "A small ask" ("Tap **Send Feedback** in the menu"); using the same string keeps the in-body instruction and the button label consistent. PM may override to a warmer label — confirm. |
| Footer | Single line, `text-caption text-text-secondary`, centered: `Made with care in Australia · 2026`. No founder name. |
| Motion | Default expo-router push transition. No custom animation. No pull-to-dismiss. Light `Haptics.impactAsync(Light)` on the Feedback CTA. |
| Accessibility lock | Page heading is the Fraunces "Bemy" wordmark, marked as `accessibilityRole="header"` with `accessibilityLabel="About Bemy"`. Each section heading is a sub-header. WCAG AA verified (see § 5). |

---

## 1. Where it lives in navigation

### Menu row order (current vs proposed)

```
BEFORE                          AFTER
─────────────                   ─────────────
[avatar] Display Name           [avatar] Display Name
                                — — — — — — — —
Settings           >            Settings           >
Pet Family         >            Pet Family         >
Send Feedback      >            About              >          ← NEW
                                Send Feedback      >
— — — — — — — —                 — — — — — — — —
Sign Out (red)                  Sign Out (red)
```

**Why above Send Feedback, not at the top:**

- The dominant menu actions remain Settings and Pet Family — those are
  task-oriented and most-tapped. Putting About at the top demotes
  task-finding for a once-in-a-lifetime read.
- The page closes with a "tell me what you think" CTA that routes to
  Feedback. After reading About, the user is in the right emotional
  state to send feedback — and Send Feedback sits one row below
  About in the menu, so the journey is one tap forward (CTA on the page)
  or one row down (if they back out and tap Feedback themselves).
- About is not destructive, so it stays above the sign-out divider.

**Why not bottom of the list:**

- Below Send Feedback would put it adjacent to the Sign Out divider,
  which visually groups it with destructive territory. About is the
  warmest row in the menu — it earns its place above that line.

### Row treatment

Same `MenuRow` component as the other rows. Props:

```tsx
<MenuRow
  label="About"
  icon="paw-outline"
  onPress={() => handleNavigate('/(main)/about')}
  testID="menu-row-about"
/>
```

**Icon justification (`paw-outline`):**

- `heart-outline` → reads as "favorites" or "wishlist"; ambiguous.
- `person-circle-outline` → already used for the menu avatar header
  one row up. Re-using it would visually echo and confuse.
- `book-outline` → reads as "documentation" or "manual" — wrong tone
  for a story page.
- `paw-outline` → pet-first, signals "this is the story behind the app"
  rather than "this is product info". Distinct from `settings-outline`,
  `people-outline`, `chatbubble-outline` already in the menu. Lands
  on the brand.

If the founder later objects to the paw, the fallback is
`information-circle-outline` (utilitarian but unambiguous).

### Route registration

- New file: `app/(main)/about.tsx`. Default export = `AboutScreen`.
- No new entry in `app/(main)/_layout.tsx` is required if that layout
  uses the default `Stack` (Expo Router auto-registers file-based
  routes). Engineer should verify.
- Push transition (default), not `presentation: 'modal'`. A modal would
  feel lighter than a story warrants and would also invite swipe-down
  dismissal — too aggressive for narrative content.

---

## 2. Page layout

### Word mockup (top → bottom)

```
┌────────────────────────────────────────────────┐
│ ←                                              │  ← back arrow, 24pt, plum
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  │         [welcome-hero illustration]      │  │  ← ~30% of screen height
│  │           (cat + dog cuddled)            │  │     full width, no overlay
│  │                                          │  │
│  │                  Bemy                    │  │  ← Fraunces 44/48 bold,
│  │                                          │  │     plum, centered, sits
│  └──────────────────────────────────────────┘  │     ~16pt below illust.
│                                                │
│         A digital home for your                │  ← text-body, secondary,
│         pet family.                            │     centered, 28pt below
│                                                │     wordmark
│                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │  ← (no rule — pure space,
│                                                │     32pt margin)
│                                                │
│  Why Bemy exists                               │  ← Fraunces, text-title,
│                                                │     plum, left-aligned
│  [PM body — ~80 words, system sans, body,     │
│   text-text-primary, paragraph spacing 12pt]  │
│                                                │
│                                                │
│  Where the name comes from                     │  ← section heading
│                                                │
│  [PM body — ~60 words, leads into the         │
│   pull-quote]                                  │
│                                                │
│           ┌──────────────────────────┐         │
│           │                          │         │
│           │    Bemy = Beau + Remy    │         │  ← <PullQuote>, Fraunces
│           │                          │         │     text-largeTitle, plum,
│           └──────────────────────────┘         │     centered, 32pt above/
│                                                │     below
│                                                │
│  Built by Jack, in Australia                   │  ← section heading
│                                                │
│  [PM body — ~80 words, "Jack" first name      │
│   only, no surname, no email]                 │
│                                                │
│                                                │
│  What's next                                   │  ← optional 4th section,
│                                                │     PM's call
│                                                │
│  [PM body — ~80 words, roadmap teaser]        │
│                                                │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │      Tell me what you think            │   │  ← primary plum Button,
│  └────────────────────────────────────────┘   │     full-width, 32pt above
│                                                │
│  Made with care in Australia · 2026            │  ← text-caption, secondary,
│                                                │     centered, 24pt above
└────────────────────────────────────────────────┘     bottom safe area
```

### Hero treatment — why illustration over textured band

Three options were considered:

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| `pet-detail-header-bg.png` band + Fraunces wordmark | Cheapest visual cost, signals "different from welcome screen" | Reads as a header strip, not an emotional opener. Text-only hero is cold for a story page. | Reject. |
| Solid cream wash + giant Fraunces wordmark | Most editorial, magazine-cover feel | No pet imagery — feels disconnected from the product on the page that's *about* the product. | Reject. |
| **`welcome-hero.png` + wordmark overlay** | Carries the brand visual the user already knows from auth. Cat+dog illustration grounds the story emotionally in seconds. | Repeats the auth-screen illustration. | **Accept.** Risk acknowledged; the upside (warmth, brand recognition) outweighs novelty cost on a page the user visits maybe twice a lifetime. |

**Implementation:** the hero is a `View` containing the `Image` plus an
absolutely-positioned `Text` ("Bemy" in Fraunces 44/48 bold). The image
uses `resizeMode="cover"` at `height: SCREEN_HEIGHT * 0.30`. Same recipe
as `app/(auth)/welcome.tsx` but trimmed from 0.40 → 0.30 to leave room
for the longer copy below.

### Section rhythm

| Element | Class / token |
|---|---|
| Section heading | Fraunces (`fontFamily: DisplayFontFamily.semibold`), `text-title` (22/28), `text-primary` (plum) |
| Body paragraph | `text-body` (17/24), `text-text-primary` |
| Paragraph spacing within a section | `space-y-3` (12pt) |
| Spacing between sections | `mt-8` (32pt) above the next heading. **No hairline `border-border` rule.** Whitespace is the divider. |
| Sub-tagline under wordmark | `text-body text-text-secondary text-center` (mirrors the auth screen tagline) |

**No hairline rules between sections.** The page is short (3–5 sections,
250–400 words). Hairlines would chop a continuous narrative into
form-like rows. Whitespace lets it breathe.

**No paw / sparkle / heart accents between sections.** The hero
illustration carries the visual warmth; layering more decorative spots
would clutter a short page. If the founder later wants per-section
accents, the recommendation is to design them as a set with the same
flat-line-art style — a one-off paw next to one heading reads as
inconsistent.

### Pull-quote placement update (vs PM copy)

The PM's section 1 contains: *"Their names are Beau and Remy. **Be**au +
**Re****my** — that's where the name comes from."* The bolded letters
(`**Be**` / `**Re****my**`) are the PM's inline visual emphasis. The
designer treatment promotes that idea to a true pull-quote one
paragraph below the prose mention:

```
... that's where the name comes from.

         ┌──────────────────────────┐
         │    Bemy = Beau + Remy    │      ← <PullQuote>
         └──────────────────────────┘

[next section heading: "Why I built it"]
```

The PM's inline bolding still renders inside the body paragraph (use
`<Text style={{ fontWeight: '600' }}>` spans on the `Be` and `Re`/`my`
characters). The pull-quote underneath is the *visual* moment; the
inline bolding is the *typographic* moment. Two beats, layered.

If the engineer prefers a single beat (drop the inline bolding when
the pull-quote ships), that is acceptable too — confirm with PM.

### Pull-quote — the "Bemy = Beau + Remy" beat

The single most emotional sentence in the page deserves a typographic
moment. Spec:

```tsx
<PullQuote>Bemy = Beau + Remy</PullQuote>
```

| Property | Value |
|---|---|
| Font family | `DisplayFontFamily.bold` (Fraunces 700) |
| Size | `text-largeTitle` (30/36) |
| Color | `text-primary` (plum) |
| Alignment | Centered |
| Vertical spacing | `my-8` (32pt above, 32pt below) |
| Horizontal padding | `px-8` so it never touches the screen edge |
| No background, no border, no quote marks | The Fraunces + plum + size combination already says "this matters". Quote glyphs would over-egg it. |

**New component:** add `components/ui/PullQuote.tsx` (and
`PullQuote.test.tsx`). Single prop `children: string`. Reusable for any
future emotional emphasis on About / settings / onboarding screens.
Don't put it in `components/about/` — this is a primitive.

### Closing CTA

| Property | Value |
|---|---|
| Component | `Button` (existing) |
| Variant | Default (plum filled). **Not** `brandYellow` — yellow CTAs are reserved for auth screens per the design system. |
| Label | **"Send Feedback"** — matches the in-body reference in the PM's "A small ask" section (*"Tap Send Feedback in the menu..."*). Keeping label + body instruction identical reduces cognitive friction. |
| Width | Full-width inside the screen `px-5` padding. |
| Behavior | `router.push('/(main)/feedback')`. |
| Spacing | `mt-10` from the last section (40pt). |
| Haptic | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on press, before the navigation call. |

**Why plum, not yellow:** brand yellow is the auth-screen signature
("you're entering Bemy"). Inside the app, primary CTAs are plum. About
is inside-the-app territory. Yellow on this CTA would imply a stage
transition that isn't happening.

### Footer

```
Made with care in Australia · 2026
```

- Token: `text-caption` (12/16), `text-text-secondary`, centered.
- Position: `mt-6` below the CTA, then bottom safe-area inset.
- **No founder name** — keeps "Jack" inside the body copy where the PM
  controls voice; the legal entity ("Beebles") only appears on the
  privacy policy.
- **"With care", not "with love"** — calibrates to the PM's likely
  voice (warm but not saccharine). PM may override.

---

## 3. Imagery — three scenarios, recommendation

### Scenario A — illustration-only (RECOMMENDED for v1)

Use `assets/images/welcome-hero.png` as the hero. Zero new asset cost.

- Pros: ships immediately. Already approved brand asset. Cat+dog
  illustration generalizes to any reader (not just owners of Beau and
  Remy).
- Cons: same illustration as the welcome / sign-in / sign-up screens.
  Risk of feeling repetitive across surfaces.
- Mitigation: the wordmark overlay + new copy below changes the
  semantic context. The user reads it as "About" the moment they see
  the section headings.

### Scenario B — founder-supplied photos of Beau and Remy

Two slots in the page (e.g. flanking the "Bemy = Beau + Remy"
pull-quote, or as section accents next to "Where the name comes from").

- Pros: maximum personal warmth. The most authentic version of the
  page.
- Cons: founder hasn't decided. If they don't supply for v1, the
  design must degrade. It's also a one-way door — once shipped with
  photos, removing them later feels like a regression.
- **Default the v1 spec to NOT requiring photos.** If photos materialize,
  the layout has two slot positions reserved (described below) that can
  be filled without restructuring the page.
- Photo slot reserved positions:
  - **Position 1:** circular 80pt avatars, side-by-side, just above the
    "Bemy = Beau + Remy" pull-quote, captioned with the dog's name in
    `text-caption text-text-secondary`.
  - **Position 2:** a single 16:9 photo at the bottom of "Built by
    Jack, in Australia", with both dogs in frame.

### Scenario C — new custom Beau + Remy illustration

Generate a flat-line-art piece in the existing illustration style
(`docs/bemy-design-system.md` § Illustration & Art Style) showing Beau
and Remy together, sized to replace the welcome-hero on this page only.

- Pros: keeps the illustrated visual register, makes the page
  *specifically* about Bemy's two dogs, doesn't depend on the founder's
  photo decision.
- Cons: requires a new generation pass + remove.bg + asset addition.
  Not free.
- **Polish path for v1.1.** If the founder commits to it, swap the hero
  asset path; no other layout changes needed.

### Recommendation

**Ship v1 with Scenario A.** Reserve the Scenario B photo slots in the
layout but don't render anything until the founder supplies photos.
Treat Scenario C as a v1.1 polish item if the founder wants the page to
visually distinguish itself from welcome / sign-in.

---

## 4. Motion + interactions

| Surface | Behavior |
|---|---|
| Page entrance | Default expo-router push transition (slide from right on iOS, fade-up on Android). No `Animated` wrappers, no custom timing curves. |
| Pull-to-dismiss | **Disabled.** Default push behavior on iOS allows edge-swipe back, which is fine. A full pull-to-dismiss gesture (modal-style) is not — the page is not a modal. |
| Scroll behavior | Standard `Screen scroll` (existing prop). No parallax on the hero. |
| Section-heading reveal animation | None. Static render. |
| Pull-quote reveal | None. Static render. The Fraunces treatment is the moment, not the animation. |
| CTA press | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` immediately before `router.push`. Matches existing CTA haptic pattern in the app where present. |
| CTA press visual feedback | `Pressable` opacity (handled by `Button` primitive). No additional scale or color shift. |
| Back arrow | Top-left, 24pt, `Colors.textPrimary` (matches Settings header). `hitSlop` 8pt all sides. |

---

## 5. Accessibility

### Color contrast verification

Background: `Colors.background` (`#FFF8E7`). Verified ratios (computed):

| Foreground | Hex | Ratio on `#FFF8E7` | WCAG |
|---|---|---|---|
| `Colors.textPrimary` | `#2D2A26` | ~13.5:1 | AAA |
| `Colors.textSecondary` | `#7A756E` | ~4.6:1 | AA (≥4.5 for normal text) |
| `Colors.primary` (plum) | `#4A2157` | ~10.4:1 | AAA |

Plum on cream and primary text on cream both pass AAA. Secondary on
cream passes AA for normal text but is **just above the threshold**.
Engineer note: do not use `text-text-secondary` for body paragraphs;
it's already scoped to the sub-tagline and the footer caption only,
both of which are short enough to be acceptable at AA-not-AAA.

### Heading hierarchy for screen readers

- **H1 (one only):** the Fraunces "Bemy" wordmark in the hero. Render
  with `accessibilityRole="header"` and `accessibilityLabel="About Bemy"`.
- **H2 (per section):** each section heading ("Why Bemy exists", "Where
  the name comes from", etc.) with `accessibilityRole="header"`.
- **The pull-quote is not a heading.** It's body emphasis. Don't mark
  it as a header — that would flood the screen-reader rotor with a
  duplicate "Bemy" entry.

### Tap target sizes

- Back arrow: 24pt icon + `hitSlop={8}` → ≥40pt effective. Compliant.
- Send Feedback CTA `Button`: full-width, 48pt min height (existing
  `Button` primitive). Compliant.
- No other interactive surfaces on the page.

### Dynamic Type

- The global `maxFontSizeMultiplier = 1.3` clamp from
  `app/_layout.tsx` already applies. Page reflows naturally at 1.3x
  because everything is in a single scrollable column with no
  fixed-width pills or columns.
- The hero "Bemy" wordmark uses inline `style` with raw font sizes
  (matching the auth screen) — it does NOT inherit the global clamp
  because it bypasses the `Text.defaultProps` mechanism via the inline
  font definition. That's fine for a hero but flag for the engineer:
  if accessibility audit ever tightens, the hero text is the one site
  that won't scale.
- The pull-quote uses `text-largeTitle` (clamped). At 1.3x it grows to
  ~39pt. Tested mentally against "Bemy = Beau + Remy" (16 chars) —
  still fits one line at iPhone 13 mini width. No wrapping concerns.

### Other a11y notes

- Hero image has `accessibilityLabel="Bemy hero illustration: a cat
  and a dog cuddled together."` (carrying over from welcome screen).
- The pull-quote has `accessibilityLabel="Bemy equals Beau plus Remy"`
  spoken out so the equals-sign isn't read literally as "equals".
- Footer has no `accessibilityRole="button"` since it's not interactive.

---

## 6. Edge cases

### Not signed in

The About page is reachable from `app/(main)/menu.tsx`, which sits
inside the `(main)` route group. The root layout's auth redirect
already kicks unauthenticated users to `(auth)/welcome` before any
`(main)` route renders. Therefore:

- **Unsigned users cannot reach this page.** Confirmed.
- We do **not** spec an unsigned-state variant. If the page later moves
  to a public surface (e.g. a marketing route in `(auth)/`), revisit.

### Offline

- Page content: 100% static text + bundled imagery (`welcome-hero.png`
  is part of the JS bundle). **Renders fully offline.**
- The Send Feedback CTA navigates to `/(main)/feedback`, which has its
  own offline behavior (the existing feedback screen handles its own
  network state). About itself does not need an offline indicator.

### Long copy / dynamic-type bursting

- At AX1 (1.3x clamp ceiling), the longest section is still well within
  one viewport. No special handling beyond the existing `Screen scroll`.

### Future founder-photo addition

- If photos arrive after v1 ships, the engineer adds them in the two
  reserved slot positions (§ 3 Scenario B). No visual restructuring
  required.

---

## 7. Implementation hints for the engineer

This section is **hints**, not a full implementation spec. Points the
engineer should know:

### Files

| Path | Action |
|---|---|
| `app/(main)/about.tsx` | **New.** Default export `AboutScreen`. |
| `app/(main)/about.test.tsx` | **New.** Tests below. |
| `app/(main)/menu.tsx` | **Edit.** Add the About `MenuRow` between Pet Family and Send Feedback. Add a test case for the new row. |
| `components/ui/PullQuote.tsx` | **New.** Tiny presentational component — accepts `children: string`. |
| `components/ui/PullQuote.test.tsx` | **New.** Render + Fraunces font verification + a11y label test. |

### Component reuse — no other new components

- `Screen` (with `scroll`) — page scaffold.
- `Button` (default plum variant) — Feedback CTA.
- `Image` (RN built-in) — hero.
- `Text` with `style={{ fontFamily: DisplayFontFamily.bold }}` for the
  hero wordmark and section headings (Fraunces).
- `Ionicons` `arrow-back` — back button.
- `Haptics` from `expo-haptics` — CTA press.

**Do NOT** introduce new color tokens, new typography tokens, new
illustration assets, or new animation libs. The page should not require
any change to `constants/`, `tailwind.config.js`, or `app.json`.

### Menu-row data structure

The menu currently inlines its rows directly in `app/(main)/menu.tsx`
(no driving array — see lines 105–124). The simplest change is to add
one more `<MenuRow>` element between Pet Family and Send Feedback:

```tsx
<MenuRow
  label="About"
  icon="paw-outline"
  onPress={() => handleNavigate('/(main)/about')}
  testID="menu-row-about"
/>
```

The `handleNavigate` type union currently lists the three existing
routes — extend it to include `'/(main)/about'`.

### Tests required

In `app/(main)/about.test.tsx`:

- Renders without crashing.
- Hero illustration is present (`testID="about-hero"` or matching label).
- Wordmark "Bemy" renders.
- All section headings render (one assertion per heading; the actual
  headings come from the PM doc).
- Pull-quote "Bemy = Beau + Remy" renders.
- Send Feedback CTA navigates to `/(main)/feedback` on press (mock
  router, assert push called once with the right path).
- **PII guard:** assert that the rendered tree does NOT contain the
  string `Jack Dinh` (full name), `Dinh`, `jacksangdinh`, or any email.
  This is a regression guard against a future copy edit accidentally
  pasting in the founder's full identity.
- Light haptic fires on CTA press (mock `expo-haptics`).

In `app/(main)/menu.test.tsx` (existing):

- New assertion: an "About" row is present, sits between Pet Family and
  Send Feedback in DOM order, and tapping it navigates to
  `/(main)/about`.

In `components/ui/PullQuote.test.tsx`:

- Renders the supplied `children` text.
- Uses `DisplayFontFamily.bold` (assert via inline style or font
  family token).
- A11y label is present and matches a normalized version of the
  children (so "Bemy = Beau + Remy" → "Bemy equals Beau plus Remy").

`npx jest` must be green before commit.

### What NOT to do

- Don't use `Alert.alert` anywhere on this page (no destructive flows).
- Don't add a `presentation: 'modal'` route option.
- Don't add bottom-sheet behavior — the existing menu *file* is named
  `menu.tsx` but in code it's a pushed `Screen scroll` route, not a
  true bottom sheet. Don't try to "fix" that as part of this work.
- Don't ship raw size classes (`text-base`, `text-lg`, etc.). Phase 2
  rules apply — semantic tokens only.
- Don't put the founder's full name, email, surname, or any
  personally-identifying handle in the rendered tree.

### Coordination notes

- **Pull-rebase before push.** The PM agent and possibly other
  engineers are pushing in parallel.
- This work has no SQL migrations, no Edge Function changes, and no
  destructive flows — no DB review chain needed.
- The PM's `docs/bemy-about-page-copy.md` is authoritative for every
  rendered string. Engineer pulls copy from there at implementation
  time.

---

## Open questions for the founder

> One real ambiguity worth surfacing before implementation:

**Q1.** Should the menu icon be `paw-outline` or
`information-circle-outline`? The spec locks `paw-outline` because it's
on-brand and pet-first, but an information-circle is the conventional
"About" affordance and may be what users expect when scanning the
menu. Trade: brand warmth (paw) vs. instant recognition (info circle).

(Photo decision — Scenario B vs A — is also open but explicitly
parked in § 3; no answer needed for v1 ship.)

---

## Appendix — sectional spacing reference

For the engineer, here is the vertical rhythm spec in one place:

| Region | Spacing |
|---|---|
| Top of screen → back arrow | safe-area inset + 8pt |
| Back arrow → hero image | 16pt |
| Hero image → wordmark overlay center | wordmark sits centered on the bottom 30% of the hero |
| Wordmark → sub-tagline | 12pt |
| Sub-tagline → first section heading | 32pt |
| Section heading → first paragraph | 12pt |
| Paragraph → next paragraph (same section) | 12pt |
| Last paragraph of section → next section heading | 32pt |
| Section before pull-quote → pull-quote | 32pt |
| Pull-quote → next section heading | 32pt |
| Last section paragraph → CTA | 40pt |
| CTA → footer caption | 24pt |
| Footer caption → bottom safe-area | safe-area inset only |
