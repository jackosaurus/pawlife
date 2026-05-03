# Bemy — App Store screenshots, visual + composition spec

> Visual + composition blueprint for Bemy's iOS App Store screenshots.
> Branding lead owns the listing copy
> (`docs/bemy-app-store-brand-listing.md`). Marketing lead owns
> positioning (`docs/bemy-app-store-marketing-strategy.md`). Both shipped
> ahead of this doc and are reflected below — see "Sister-doc
> reconciliation" immediately after the TL;DR.
>
> This doc covers what the screenshots look like, in what order, with
> what overlay copy. The founder uses it as a literal blueprint when
> producing the assets in Figma (or the simpler path recommended in §9).
>
> Tokens, typography, and illustration rules are canonical in
> `docs/bemy-design-system.md` — this doc only spells out the
> screenshot-specific decisions.

---

## TL;DR — locked decisions

| Decision | Lock |
|---|---|
| Through-line | A storyboard: meet Beau and Remy → see how their care lives in Bemy → feel the warmth of the product. The dogs anchor the listing, the app screens deliver the proof. |
| Screenshot count | **6** — small enough to feel curated, large enough to cover hero + the four record types + a closing emotional beat. |
| Display size | 6.9" iPhone, **1320×2868** (iPhone 16 Pro Max). Apple auto-scales to 6.5"/6.1"/etc. |
| Background | Solid `#FFF8E7` (cream-yellow, `Colors.background`) for every frame. **No** textured `dashboard-bg.png` behind the phone — texture lives inside the device, not around it, so the phone reads as the figure, the cream as the ground. |
| Phone-frame treatment | Clean **iPhone 16 Pro bezel mockup**, straight-on (no tilt), centered, ~78% of frame width. No shadow, no reflection, no gradient. The bezel is unmarked black titanium — no Dynamic Island callouts. |
| Headline position | **Top of frame**, above the phone. ~14% of frame height reserved for headline + subhead. |
| Headline typography | Fraunces 700 (`DisplayFontFamily.bold`), 96pt, color `#4A2157` (plum), centered, leading -1%. |
| Subhead typography | System sans-serif (San Francisco), 38pt regular, color `#7A756E` (textSecondary), centered, max two lines. |
| Status bar inside the screenshot | **Hidden** — replaced with a white spacer (no time, no signal, no battery). Apple's screenshots aren't dated; a fake 9:41 timestamp adds zero info and dates the listing the moment iOS changes the indicator system. |
| Color accent | Plum headline + cream background does the work. **Do not** add purple hearts, sparkles, confetti, or arrows — the brand is calm, not infomercial-loud. |
| Frame chrome | Real screen content captured at 1290×2796 pt density (Pro Max), no synthetic padding, no faked notification banners, no fake battery. |
| App Preview video | Marketing lead recommends **ship at v1** (15–30s, dogs on screen ≥50%, namesake reveal). This doc previously recommended skip; **deferring to marketing — ship at v1**, with a fallback plan if production stalls. See §7. |
| App Store icon | Reuse `assets/images/icon.png` as-is at 1024×1024. No variant. The saturated yellow + plum snout is the listing's tile in search results — same icon everywhere is the brand-cohesion play. |

---

## Sister-doc reconciliation

Marketing strategy and brand listing copy shipped while this spec was
being drafted. Substance check, point by point:

| Source | What they locked | Match with this spec? |
|---|---|---|
| Marketing § 1 — positioning | *"Bemy is the hand-crafted indie pet care app — made by one person in Australia for his own two dogs."* Lead with founder + dogs; functional layer ("digital home for your pet family") is supporting. | **Match.** This spec's storyboard through-line is the same idea: dogs are the emotional anchor, app screens are the proof. |
| Marketing § 5 — story arc | First-screenshot caption substance is "Bemy = Beau + Remy" — namesake reveal. | **Diverges.** This spec's frame 1 leads with "For your pet family." (the functional tagline) and reserves the namesake reveal for frame 2. See "Frame 1 / 2 swap option" below. |
| Marketing § 5 — preview video | Ship a 15–30s preview at v1, dogs on screen ≥50%, ends on wordmark. | **Diverges from the original §7 recommendation.** Updated: marketing wins, ship video at v1. See §7. |
| Branding § 0 — brand-story spine | *"a small app made by one person in Australia for two dogs called Beau and Remy… no ads, no data sales, and no AI promises… a careful, gentle place to write things down."* | **Match.** Frame 6 ("No ads. No tracking. Just your dogs.") closes on this exact note. |
| Branding § 1 — name | App Store name = `Bemy`. | **Match.** Wordmark in frame 1 is just "Bemy" — no qualifier. |
| Branding § 2 — subtitle | `Pet records, gently kept` (24 chars). | **Match.** Frame 4 headline is "Care, gently kept." — same voice, intentionally rhyming. |
| Branding § 9 — voice DOs/DON'Ts | DOs: gentle, lowercase voice, named dogs, comma-rhythm. DON'Ts: superlatives, exclamation marks, "powerful", "AI". | **Match.** Every headline in §4 of this spec passes the DO list and avoids the DON'T list. |

### Frame 1 / 2 swap option

Marketing's recommendation that the **first** screenshot caption land
the namesake reveal is the highest-leverage move per Apple's research.
Two ways to honour that:

1. **Keep the current order** (this spec's default): frame 1 = "For
   your pet family." establishing brand, frame 2 = the namesake reveal
   on the About page Meet cards. Justification: "For your pet family."
   reads strong at 110pt thumbnail width *because* it's set in
   Fraunces over a calm cream field. The Meet cards, while emotional,
   have two avatars + body paragraphs that compress poorly at thumbnail.
2. **Swap frames 1 ↔ 2** to honour marketing literally. The namesake
   reveal becomes frame 1; the "digital home" composite drops to frame
   2. Trade: thumbnail readability degrades (two small avatars + body
   text), but the namesake hook lands earlier.

**Recommendation: keep the current order.** The branding lead's
brand-story spine treats the namesake reveal as a sentence inside a
paragraph, not the headline of the paragraph — the *paragraph* is "a
small app made by one person for two dogs." Frame 1 sets that frame;
frame 2 delivers the dogs. The two together do what marketing wants
in roughly the same elapsed time (a 1-second swipe), with better
thumbnail readability on the App Store search results page.

If the founder disagrees, swap is a 5-minute change: literally re-order
the Figma frames. Headline + subhead pairs travel with their frame.

---

## 1. Strategy — one paragraph

Bemy's listing tells a six-frame story: meet two dogs, see how their
care lives inside the app, finish with the warmth that makes Bemy
different from a clinical health tracker. Every screenshot uses the
same composition shell (cream background, centered phone bezel, Fraunces
headline overhead) so the six frames read as a set, not a feature
parade. The dogs — Beau and Remy — are the emotional anchor; the app
screens are the proof. This through-line will track whatever the
marketing lead writes for positioning: the listing isn't selling
"vaccinations + medications + weight + food", it's selling "a digital
home for your pet family", and the screenshots have to feel like a
home, not a chart. If the marketing lead's positioning lands somewhere
genuinely different (e.g. "the calm pet health app" or "for two-dog
households"), revisit headline copy in §4 — composition stays.

Why a storyboard, not a feature parade: indie pet apps that lead with
a vaccinations card + a medications card + a weight card + a food card
read as a CRUD listing. Apps that lead with a face and a feeling —
Headspace, Stoic, Day One — convert better on emotional categories. Pet
health is an emotional category, not a productivity category.

---

## 2. Screenshot count + order

Six frames. Apple's research shows the first 1–3 carry the conversion;
frames 4–6 reassure scrollers who are already half-sold. Indie apps
shipping 5 read as thin, 8+ read as overcompensating, 6 reads as
considered.

### Frame 1 — Hero / "A digital home for your pet family"

- **Beat:** What is this app, in one second? A warm, brand-anchored
  intro screen that immediately signals "pet family", not "pet
  productivity tool".
- **Visual content:** Custom listing-only composite (NOT a real app
  screen). Inside the phone bezel:
  - `welcome-hero.png` (cat + dog cuddled illustration) at the top
    50% of the device viewport.
  - Below it, the Fraunces "Bemy" wordmark in plum at 88pt, centered.
  - Below the wordmark, the existing in-app sub-tagline `A digital
    home for your pet family.` in system 28pt secondary.
  - Cream `#FFF8E7` background fills the rest of the device viewport.
- **Headline (above device):** `For your pet family.`
- **Subhead (above device):** `Track health, food, and the small
  moments — together.`
- **Why this composition:** if Apple later requires the first
  screenshot to be a literal app screen (rare, but possible), the
  fallback is the welcome screen itself (`app/(auth)/welcome.tsx`),
  which has the same illustration + wordmark + tagline in production.
  The composite is just slightly more breathable.

### Frame 2 — "Meet Beau and Remy"

- **Beat:** Show real dogs. The single most credibility-buying frame —
  the listing isn't from a faceless studio, it's from someone who
  actually has dogs they're tracking.
- **Visual content:** Capture of the About page (`app/(main)/about.tsx`)
  scrolled to the **Meet Beau** + **Meet Remy** card pair. Two
  bordered avatars (96pt, plum border), Beau name + breed + age,
  short body paragraph. Cream background visible top + bottom.
- **Headline:** `Made for two dogs.`
- **Subhead:** `Built around Beau and Remy. Made for yours.`
- **Why:** this is the listing's "why us" — every other pet tracker
  was built by a team. Bemy was built by someone with two specific
  dogs. The About page was literally designed to land this beat;
  reusing it here is the cheapest way to ship a strong second frame.

### Frame 3 — "The dashboard"

- **Beat:** Show the home screen. What does day-to-day Bemy look like?
- **Visual content:** Capture of the dashboard
  (`app/(main)/index.tsx`) showing:
  - "Your Pet Family" largeTitle header
  - The welcome-hero illustration band at the top
  - "1 thing needs your attention" subhead
  - Beau's `PetCard` with photo, breed, age line ("just turned 9" or
    "8 years old", whichever phase is active)
  - One action card under Beau: e.g. "Heartgard Plus · For Beau ·
    Due today · Log"
  - Remy's `PetCard` below
- **Headline:** `One quiet home screen.`
- **Subhead:** `Everyone's care, gently kept.`
- **Capture note:** for the "needs attention" line to read as warm
  (not nagging), the founder should populate one — not three — action
  items. A single "Log" pill is enough to communicate the affordance
  without making the app look like a to-do trap.

### Frame 4 — "Pet detail"

- **Beat:** Drill into one pet. This is where users will spend most of
  their time; the listing has to show the depth without overwhelming.
- **Visual content:** Capture of pet detail screen
  (`app/(main)/pets/[petId]/index.tsx`) for Beau:
  - Curved gradient header with `pet-detail-header-bg.png` texture
  - Beau's bordered avatar (`Avatar` with `bordered`)
  - Beau's name + AgePill ("8 years old" or "🎂 9 today" depending on
    phase), sex pill, weight pill
  - The Food / Medicines / Vaccinations / Weight tab bar
  - One section visible below — Vaccinations with a current+overdue mix
    of status pills, OR Medications with a green checkmark + amber
    fraction, whichever shows the design language clearest.
- **Headline:** `Care, gently kept.`
- **Subhead:** `Vaccinations, meds, weight, food — for each pet,
  in one place.`

### Frame 5 — "Medications + dosing"

- **Beat:** Show the highest-utility view in the app. Medication
  tracking with the at-a-glance status indicator is Bemy's strongest
  functional differentiator from spreadsheet-style trackers.
- **Visual content:** Capture of the medications list inside Beau's
  pet detail (`/pets/[petId]/health/medication`) showing 3–4
  `MedicationCard`s with mixed states:
  - Heartgard Plus — green checkmark, "Given 2h ago"
  - Apoquel — amber fraction "1/2", "1 more dose today", `Log Dose ›`
  - Ear drops — green dot, "All caught up"
  - (optional) Cytopoint allergy shot — gray, "Finished"
- **Headline:** `Knows what's due.`
- **Subhead:** `Daily, weekly, monthly, or as needed.`

### Frame 6 — "No ads, no tracking"

- **Beat:** Closing emotional + ethical pitch. Pet apps in this
  category are full of upsell prompts and ad banners; Bemy isn't.
  The final frame plants that flag.
- **Visual content:** Custom listing-only composite (not a real
  screen — Bemy doesn't have a "no ads" page in the app). Inside the
  phone bezel:
  - Cream `#FFF8E7` background
  - Fraunces line stack, centered vertically:
    ```
    No ads.
    No tracking.
    Just your dogs.
    ```
    Three lines, Fraunces 700 plum, 60pt each, line-height 72pt.
  - Beneath, the small system 22pt secondary line: `Made with care
    in Australia.`
- **Headline (above device):** `Quietly yours.`
- **Subhead:** `No ads. No tracking. No upsells. Ever.`
- **Why this is frame 6:** the ethical pitch is the closer. Frames
  1–5 sell the product; frame 6 sells the *kind of product*. This is
  also where the brand's "calm not loud" tone lands hardest — the
  whole frame is whitespace and three short lines.

---

## 3. Composition system — the rules every frame follows

All six screenshots are 1320×2868 px (6.9" iPhone). Apple auto-scales
down. PNG, RGB, no transparency.

### Composition shell (ASCII mockup)

```
┌───────────────────────────────────────┐  ← 1320px wide
│  cream #FFF8E7 background             │
│                                       │
│      Headline in Fraunces plum        │  ← 96pt, top-anchored at
│      (1–4 words)                      │     ~12% of frame height
│                                       │
│      Subhead in system gray (38pt)    │  ← max 2 lines
│      max two lines, centered          │
│                                       │
│   ╭─────────────────────────────╮     │
│   │                             │     │
│   │                             │     │
│   │      iPhone 16 Pro          │     │  ← phone occupies ~78%
│   │      bezel mockup           │     │     of frame width,
│   │      with screen content    │     │     centered horizontally,
│   │      (real capture)         │     │     bottom edge ~3% from
│   │                             │     │     frame bottom
│   │                             │     │
│   │                             │     │
│   │                             │     │
│   ╰─────────────────────────────╯     │
│                                       │  ← 3% bottom safe zone
└───────────────────────────────────────┘  ← 2868px tall
```

### Numeric layout spec (1320×2868)

| Region | y-range | Notes |
|---|---|---|
| Top safe zone | 0 → 200px | empty cream |
| Headline | 200 → 360px | Fraunces 700, 96pt, plum, centered |
| Headline → subhead gap | 360 → 410px | 50px breathing room |
| Subhead | 410 → 540px | System sans, 38pt regular, secondary, centered, max 2 lines |
| Subhead → device gap | 540 → 640px | 100px |
| Device frame | 640 → 2780px | iPhone 16 Pro bezel, 1030px wide, 2140px tall (centered horizontally → 145px left margin) |
| Bottom safe zone | 2780 → 2868px | 88px |

### Typography rules

- **Headline:** Fraunces 700 (`DisplayFontFamily.bold` from
  `constants/typography.ts` — load via Google Fonts in Figma:
  Fraunces, weight 700, optical size 144). 96pt. `#4A2157`. Centered.
  Tracking -10. Line-height 100pt. **Max 4 words.** If a headline
  needs more, shorten it.
- **Subhead:** System sans-serif (San Francisco — fall back to
  Helvetica or `-apple-system` in Figma). 38pt regular. `#7A756E`.
  Centered. Tracking 0. Line-height 46pt. **Max 2 lines.** If it
  doesn't fit in 2, shorten.
- **No bold-weight subheads.** Only the Fraunces headline carries
  weight in the listing. Subheads stay regular weight to keep the
  hierarchy crisp.

### Background

- Solid `#FFF8E7` for every frame.
- **No textures** behind the phone. The textured `dashboard-bg.png`
  lives *inside* the device on frame 3 — not around it. Reusing the
  texture as the listing background would muddy the figure/ground.
- **No gradients.** Cream is calm; gradients are loud.
- **No decorative elements** (paws, sparkles, hearts, dots, lines).
  The brand earns warmth through type and the dogs, not through
  decorative noise.

### Phone-frame mockup

- Use an **iPhone 16 Pro / Pro Max** bezel mockup, black titanium,
  straight-on, no tilt.
- The mockup must include the Dynamic Island but **the screen content
  should already include a transparent status bar** (no time, no
  battery, no signal — see "Status bar handling" below).
- **No shadow** under the device. No reflection. No gradient
  background behind the device.
- Source: free Figma community templates work — search "iPhone 16
  Pro mockup". Mockuuups Studio has clean black-bezel options. The
  founder's path of least resistance is the free Apple-supplied
  Figma device library.

### Status bar handling

Inside the captured screen content, the status bar is **blanked**:

- White rectangle from `y=0` to `y=59` (the iOS status bar height
  on Pro Max) at the top of the screen capture, full width.
- No fake "9:41 AM" timestamp, no fake signal bars, no fake battery.
- Why: a faked status bar dates the listing the moment iOS visually
  changes the bar. A blank top is cleaner and survives OS revisions.
- Implementation: capture the screen at full resolution, then
  composite a white rect over the top 59pt in Figma / Photoshop /
  Preview. **Don't** try to capture without the status bar via
  simulator — the cleanup is faster than the simulator workaround.

### Color accents — what NOT to add

| Tempting addition | Verdict |
|---|---|
| Purple heart icon between headline and device | Reject. Brand is calm. |
| "✨ NEW" badge | Reject. Listing is the launch, every screen is new. |
| "5 stars" floating overlay | Reject. Apple shows ratings separately; faking them undercuts trust. |
| Curved arrow pointing at a button | Reject. Reads as infomercial. |
| Confetti / sparkle PNGs | Reject. We are not a confetti app (per design system). |
| Drop shadow under the phone | Reject. Adds visual weight that fights the cream. |

The composition is intentionally restrained. Restraint is the brand.

---

## 4. Headline copy — all six in sequence

Read these top-to-bottom. They have to feel like a coherent voice, not
six separate ad lines. The branding lead may polish wording — the
substance and ordering are committed:

| # | Headline | Subhead |
|---|---|---|
| 1 | **For your pet family.** | Track health, food, and the small moments — together. |
| 2 | **Made for two dogs.** | Built around Beau and Remy. Made for yours. |
| 3 | **One quiet home screen.** | Everyone's care, gently kept. |
| 4 | **Care, gently kept.** | Vaccinations, meds, weight, food — for each pet, in one place. |
| 5 | **Knows what's due.** | Daily, weekly, monthly, or as needed. |
| 6 | **Quietly yours.** | No ads. No tracking. No upsells. Ever. |

### Why each one

- **"For your pet family."** Earns the right to use that phrase by
  putting it first. It's our existing tagline, slightly recut for the
  listing. Distinguishes us from "track your pets" in 3 words.
- **"Made for two dogs."** Honest provenance. The kind of indie line
  that doesn't try to seem bigger than the team is, and converts
  *because* it doesn't.
- **"One quiet home screen."** Calls out the dashboard's restraint.
  Most pet apps lead with notifications and red dots. We lead with
  quiet.
- **"Care, gently kept."** Echoes the design system voice ("celebration
  over obligation", "warm, not clinical"). Reused in microcopy across
  the app, so the listing voice and the in-app voice match.
- **"Knows what's due."** Functional payoff line for frame 5. The med
  status indicator is genuinely smart; the headline tells the user
  the app does the remembering for them.
- **"Quietly yours."** Closer that lands the ethics: no ads, no
  tracking. Two words to reframe what the previous five frames have
  been showing.

### Anti-patterns rejected

- `Track your pet's health.` — generic, says the category, not the
  brand.
- `Beautiful design.` — telling not showing.
- `Powerful pet management.` — corporate inflation, off-brand.
- `Built with love.` — saccharine; design system voice is "with care",
  not "with love".
- `The pet app for modern pet parents.` — every pet app says this.

### Branding-lead handoff

Branding lead may rewrite the headline + subhead pair for any of these
six frames. Constraint to honor: **headlines stay 1–4 words, subheads
stay 1–2 lines.** If branding wants to expand (e.g. a headline that
needs 6 words), the spec needs to revisit composition — Fraunces 96pt
is the maximum the layout supports without breaking layout math.

---

## 5. The first screenshot — special treatment

Apple's research credits ~70% of conversion to the first screenshot.
Frame 1 is therefore spec'd at exact pixel detail. Everything else has
some founder discretion; this frame is the locked one.

### Frame 1 detailed spec

**Background:** solid `#FFF8E7`, full 1320×2868.

**Above-device area (0 → 540px):**

- y=200 → 360: Headline `For your pet family.` in Fraunces 700,
  96pt, color `#4A2157`, centered. Tracking -10. The period at the
  end is intentional — closes the line.
- y=410 → 540: Subhead `Track health, food, and the small moments —
  together.` in San Francisco regular, 38pt, color `#7A756E`,
  centered. Em dash, not hyphen. Two lines is acceptable; one is
  better if the design tool's text engine fits it.

**Device area (640 → 2780px):**

- iPhone 16 Pro bezel, black titanium, centered, 1030px wide.
- Screen content **inside** the bezel (1290×2796 device pt → render
  at 1290×2796 inside Figma, scale to fit the 1030px bezel inner area):
  - Background: `#FFF8E7`
  - Top of screen: `welcome-hero.png` from `assets/illustrations/`
    (the cat+dog cuddled illustration). Place flush to the top of
    the screen content area, full width, height 50% of screen
    (~1398px at the source 1290×2796 capture).
  - Below illustration, centered horizontally:
    - y=1500: Fraunces 700, 88pt, `#4A2157`: `Bemy`
    - y=1620 (gap 32pt below wordmark): system 28pt regular,
      `#7A756E`: `A digital home for your pet family.`
  - The bottom 1100px of the device screen is empty cream — that
    whitespace is the calm. Don't fill it with anything.
- **Status bar:** blank (white rect at the top 59pt of the device
  screen content, before the bezel composites over it).
- **No home indicator** (the bottom black pill on iOS) — composite a
  white rect over the bottom 34pt of screen content too.

**Below-device area (2780 → 2868px):** empty cream (88px safe zone).

### Why this frame, not the dashboard, as #1

Two finalists were considered:

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Frame 1 = dashboard capture | Shows the actual product immediately | Dashboard is dense (multiple pet cards + action items) — at thumbnail size in App Store search results, it reads as visual noise. The listing has to communicate brand in 1 second; the dashboard takes 3. | Reject. |
| **Frame 1 = welcome composite (recommended)** | One illustration + one wordmark + one tagline. Reads as a single thing in 1 second. Echoes the in-app welcome screen, so the user's first install moment matches their first listing-thumbnail moment. | Doesn't show product features in frame 1 (frames 2–5 do). | **Accept.** Conversion-wins-over-feature-density. |

The dashboard is frame 3 — premier, but not first. By frame 3 the user
is committed enough to read a denser scene.

### Verification at thumbnail size

App Store search results render screenshots at ~110pt wide on iPhone.
Frame 1 must read as "warm yellow card with a dog/cat illustration
and the word Bemy" at that size. The composite is designed to survive
the shrink: hero + wordmark + tagline are all at the top half, so
when the device thumbnail clips to a 110pt-tall preview row, the
brand mark is what users see.

---

## 6. App icon — variants?

Current icon: `assets/images/icon.png` — saturated yellow background +
plum dog snout silhouette.

**Recommendation: ship the existing icon as the App Store icon
(1024×1024) with no variant.**

- Apple lets you upload a separate App Store icon, but using the same
  icon is the brand-cohesion play. Users who see the listing tile,
  install the app, and find a *different* icon on their home screen
  feel a small dissonance. We don't need that.
- The current icon survives at 1024×1024 because it's flat (no thin
  details that blur at small sizes). It also survives at 60pt (home
  screen) and ~120pt (search result) for the same reason.
- The yellow + plum combo is high-contrast against both the App Store
  search results page and the home screen, regardless of light/dark
  iOS mode.

**No variant needed.** If a future audit shows the saturation reads as
"too loud" against Apple's standard listing chrome, the fallback is to
desaturate the yellow ~10% (`#FDC602` → `#F2BF1F`); that should be a
follow-up task, not a v1 blocker.

**File requirements (verified for 2026):**

- Format: PNG, 1024×1024
- RGB only (no alpha channel — if `icon.png` has transparency, flatten
  on a `#FDC602` background before upload)
- No rounded corners (Apple applies the mask) — the source must be a
  full square

The founder should verify `assets/images/icon.png` is a flattened
1024×1024 RGB PNG before uploading. If not, run:

```bash
sips -s format png -Z 1024 assets/images/icon.png --out /tmp/icon-1024.png
```

(or Preview → Export → 1024×1024 PNG, no alpha).

---

## 7. App Preview video — recommendation

**Ship at v1.** Marketing strategy locks this; this spec defers.

Visual + composition spec for the v1 video — 18 seconds, no music
(ambient room tone only), 1080×1920 portrait, MP4 H.264:

| Beat | Duration | Content |
|---|---|---|
| 1. Open | 0:00 → 0:03 | Real footage: Beau looking at the camera, head-tilt. Hold the shot — no fast cuts. |
| 2. App appears | 0:03 → 0:06 | Cut to phone (real device or simulator capture). Pet detail screen for Beau, sticky header with AgePill, scrolls 1 page worth. |
| 3. Functional beat | 0:06 → 0:10 | Cut to medications list, finger taps "Log Dose" on Apoquel, green check + "Given just now" animates in. |
| 4. Remy moment | 0:10 → 0:13 | Real footage: Remy carrying a ball. |
| 5. Dashboard | 0:13 → 0:16 | Cut to dashboard showing Beau + Remy + "1 thing needs your attention". 2 seconds of stillness. |
| 6. Wordmark close | 0:16 → 0:18 | Cream `#FFF8E7` field with Fraunces "Bemy" wordmark in plum, fading in. No tagline overlay (Apple shows the title separately). |

**Dogs on screen: ~50%** (3s + 3s = 6s of 18s = 33% real-dog footage,
plus ~3s of dashboard / pet detail showing Beau and Remy by photo and
name = ~50% effective dog presence). Matches marketing's brief.

**No voiceover.** No music. The only audio is ambient room tone, which
plays at low volume the whole way through. Apple auto-plays the first
3–5 seconds muted in the search results; the audio is there for users
who tap into the listing and unmute.

**Why no music:** the brand is calm. An upbeat track on the open would
collide with the screenshot voice. Ambient room tone is the audio
analog of cream-yellow whitespace — present but not announcing itself.

**Production effort:** ~4 hours, in this rough order:

1. Film Beau head-tilt (~10 takes, pick the best). 30 min.
2. Film Remy with ball (~10 takes). 30 min.
3. Capture phone footage from the iOS simulator with QuickTime screen
   recording at 60fps; trim to the 3–4s segments needed. 1 hr.
4. Edit in iMovie or Final Cut (free 90-day trial), assemble 6 beats,
   add ambient room tone audio, render at 1080×1920 H.264. 1.5 hrs.
5. Export, verify duration ≤30s, file size ≤500MB, upload to App
   Store Connect. 30 min.

**Fallback if v1 video stalls:** ship without the video, keep the 6
screenshots. The screenshots carry the listing on their own. Don't
delay submission for a video that isn't done — App Previews are
optional, screenshots are not.

**v1.1 polish path:** add a second App Preview (Apple allows up to 3)
that's a 30-second cut showing more of the app. Reserved for after
v1 install data exists.

---

## 8. Founder's action items

What the founder owns vs what an implementation agent (or this doc)
delivers.

| Task | Owner | Effort |
|---|---|---|
| Confirm marketing positioning + branding listing copy doesn't shift the through-line | Founder + parallel agents | 30 min review |
| Approve / polish the 6 headline + subhead pairs in §4 (with branding lead) | Founder | 30 min |
| Set up a Figma file with 6 frames at 1320×2868, cream background, iPhone 16 Pro mockup, headline + subhead text styles defined | Founder | 1 hr |
| Capture real app screenshots from the iOS simulator at iPhone 16 Pro Max device target (frames 2, 3, 4, 5) | Founder | 1 hr (includes seeding sample data — Beau, Remy, one med, one vacc, one weight entry) |
| Composite each capture into the corresponding Figma frame, blank the status bar + home indicator | Founder | 1 hr |
| Build frames 1 + 6 (custom composites — no real screen capture) directly in Figma | Founder | 30 min |
| Export 6 PNGs at 1320×2868, RGB, no alpha | Founder | 10 min |
| Upload to App Store Connect | Founder | 15 min |
| Film + edit 18-second Beau+Remy preview video (per §7) | Founder | 4 hrs |
| Verify `assets/images/icon.png` is flat 1024×1024 RGB (no alpha) before upload | Founder | 5 min |

**Total founder effort for v1 listing visuals: ~8–9 hours** (4–5 hours
for screenshots + ~4 hours for the preview video). One afternoon for
screenshots, one afternoon for the video.

**Engineer / agent effort: zero.** These are pre-submission marketing
assets; no code is touched. No tests, no migrations, no edge function
deploys.

---

## 9. Tools + delivery format

The simplest path that produces App-Store-grade output without a full
design tool stack:

### Recommended: **Figma free tier**

- Create a new Figma file with 6 frames at 1320×2868 each.
- Use Apple's free **iOS 18 Design Library** for the iPhone 16 Pro
  mockup component.
  - Free Figma community: search "Apple iPhone 16 Pro mockup" — the
    Figma community has multiple official-feel free templates.
- Define two text styles:
  - `Headline / Fraunces 96` — Fraunces 700, 96pt, `#4A2157`.
  - `Subhead / SF 38` — SF Pro Display Regular (or system fallback),
    38pt, `#7A756E`.
- Place a 1290×2796 frame inside each phone bezel; that's where each
  app screen capture (or custom composite) lives.
- Export each top-level 1320×2868 frame at 1× as PNG, RGB, no alpha.

### If Figma feels heavy: **Mockuuups Studio**

- Web-based, drag-and-drop, prebuilt iPhone mockups with screen-fit
  drop targets.
- Less control over headline typography (you'll need to add Fraunces
  manually via "custom font upload"), but acceptable for a listing.
- Free tier covers the 6 mockups needed.

### If neither works: **simulator + Preview**

- Boot iOS simulator at iPhone 16 Pro Max device target.
- `npx expo run:ios` to launch Bemy in the simulator.
- Use Cmd+S in the simulator to save screenshots at native resolution.
- Open in Preview → "Tools → Add Margins" or composite manually with
  the cream background and headline overlay.
- Lower fidelity than Figma but ships in 2 hours.

### Capturing real app data

Seed the simulator before screenshots:

1. Sign in as the founder's account (or a test account).
2. Make sure two pets exist: **Beau** (cocker spaniel × poodle, 8 yrs)
   and **Remy** (bordoodle × poodle, 6 yrs).
3. For Beau: add 1 vaccination (rabies, current), 2 medications
   (Heartgard given 2h ago, Apoquel partial dose), 1 weight entry, 1
   food entry.
4. For Remy: add 1 vaccination, no overdue items.
5. The dashboard should show "1 thing needs your attention" (Apoquel),
   not 3 — restraint communicates calm.

Capture flow per record-type screenshot: navigate to the screen,
ensure no toast / modal is open, dismiss the keyboard, hit Cmd+S.

### Free font sources

- Fraunces: https://fonts.google.com/specimen/Fraunces — same source
  the app uses at runtime.
- SF Pro: https://developer.apple.com/fonts/ — official Apple
  download, free for any product mocking iOS UI.

---

## 10. Sequence preview — the final 6 in order

For the founder to build top-to-bottom in Figma:

1. **`For your pet family.`** — custom composite: cream background,
   welcome-hero illustration + Fraunces "Bemy" wordmark + tagline
   inside the device. Subhead: *"Track health, food, and the small
   moments — together."*

2. **`Made for two dogs.`** — capture of the About page Meet Beau +
   Meet Remy cards. Subhead: *"Built around Beau and Remy. Made for
   yours."*

3. **`One quiet home screen.`** — capture of the dashboard with
   Beau + Remy + a single "needs attention" item. Subhead:
   *"Everyone's care, gently kept."*

4. **`Care, gently kept.`** — capture of Beau's pet detail screen
   with the curved gradient header, AgePill, tab bar, and one
   visible record section. Subhead: *"Vaccinations, meds, weight,
   food — for each pet, in one place."*

5. **`Knows what's due.`** — capture of the medications list with
   3–4 cards in mixed states (green / amber / gray). Subhead:
   *"Daily, weekly, monthly, or as needed."*

6. **`Quietly yours.`** — custom composite: three Fraunces lines
   stacked vertically — *"No ads. No tracking. Just your dogs."* —
   plus a small system line *"Made with care in Australia."* Subhead:
   *"No ads. No tracking. No upsells. Ever."*

---

## Open questions for the founder

1. **Frame 1 / 2 swap.** Marketing § 5 wants the namesake reveal as
   the first frame's caption. This spec keeps "For your pet family."
   first and lands the namesake on frame 2 (Meet Beau + Remy cards),
   for thumbnail readability. See "Frame 1 / 2 swap option" above.
   Confirm preference.

2. **Headline polish (branding lead).** Headlines in §4 are written
   in the brand voice but may benefit from a branding-lead pass.
   Two flagged for review: "Made for two dogs." (could read as
   limiting) and "Quietly yours." (could read as cryptic without the
   subhead).

3. **Preview video at v1 or v1.1.** Marketing recommends v1, this
   spec defers. Production is ~4 hrs of founder time. If the
   submission deadline is tight, the fallback path in §7 is to ship
   screenshots only and add the video at v1.1.

---

## Appendix — exact pixel reference

| Frame | y=0 | y=200 | y=410 | y=540 | y=640 | y=2780 | y=2868 |
|---|---|---|---|---|---|---|---|
| 1320×2868 | top edge | headline top | subhead top | subhead bottom (max) | device top | device bottom | bottom edge |

Headline area: 200–360px (160px tall, 1 line of Fraunces 96pt + 4px
descender slack).

Subhead area: 410–540px (130px, fits 2 lines of 38pt + 50pt
line-height + slack).

Device area: 640–2780px (2140px tall × 1030px wide, 78% of frame
width, vertically anchored 100px below subhead, 88px above bottom).

Apple's screen inside bezel (Pro Max device pt-equivalent at this
scale): 1290×2796 px source, scaled to fit 1030×~2106 inner bezel
area (≈80% of source resolution — still well above the device's
native rendering, so no visible loss).
