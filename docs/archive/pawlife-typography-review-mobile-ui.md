# Pawlife Typography Review — Mobile UI Pass

> Senior mobile UI designer review through an iOS-craftsman lens.
> Companion to `docs/bemy-design-system.md` — when this doc and the
> design-system Typography section disagree, **this doc supersedes** until
> Phase 2 lands and the design system is updated in lockstep.

**Note on screenshots.** The four screenshots referenced in the brief
(`Screenshot 2026-04-27 at 1.09.{19,58}` etc.) are on the user's Desktop;
the sandbox could enumerate them via `ls` but couldn't read their bytes,
so the screenshot-driven observations in this doc are reconstructed from
the codebase + the founder's described content of each screen. Where a
specific size estimate is implied rather than measured pixel-by-pixel
that's called out.

---

## 1. Executive verdict

The app's typography is fragmented because **Phase 1 added the semantic
tokens but only migrated four leaf components**; everything else is still
using raw Tailwind sizes (`text-2xl`, `text-base`, `text-sm`, `text-xs`)
chosen ad-hoc per screen. The semantic scale itself is also incomplete —
it has no level for the "large screen title" role used by every Add/Edit
form (`text-3xl`, ~30pt bold), and it makes `headline` and `body` the
**same size** (both 17pt) which is why uppercase eyebrows feel undersized
relative to their adjacent body copy. Result: nine different effective
sizes on screen at once where iOS HIG would use four. **Root cause: the
token table is missing one level (large title), and ~95% of call sites
never got migrated.** The fix is a one-day mechanical migration once the
token set is finalised, not a redesign.

## 2. Current scale audit

Tally from the codebase (`grep` over `app/` + `components/`):

| Category | Call sites |
|---|---|
| Hardcoded large scale (`text-2xl` / `3xl` / `4xl`) | **30** |
| Hardcoded body scale (`text-xs` / `sm` / `base` / `lg` / `xl`) | **200** |
| Inline `style={{ fontSize: N }}` | **8** |
| Semantic tokens (`text-display`/`title`/`headline`/`body`/`callout`/`footnote`/`caption`/`button-sm`) | **18** |

**Migration ratio: 18 / 248 = ~7%.** Phase 1 reached `RecordCard`,
`MedicationCard`, `VaccinationCard`, `DetailRow`, and `PetCard` (partially).
Everything else is raw Tailwind.

### Active raw sizes and their roles in the app

| Tailwind | Computed pt (default RN scale) | Where it's used | Role being played |
|---|---|---|---|
| `text-4xl` | 36 / 40 | `welcome.tsx`, `invite-member.tsx` (invite code) | Hero titles, monospaced display |
| `text-3xl` | 30 / 36 | **18 screens** — every Add/Edit screen header, `StickyHeader` (Beau / Remy), `pet-family/index` ("Pet Family"), record detail screens, sign-in / sign-up | "Large title" — the role iOS calls `largeTitle` (34pt) |
| `text-2xl` | 24 / 32 | `RecordCard` day number, dashboard "Your Pet Family", `health/index` title, `PetCard` emoji, `petId/edit` save header | Mixed: dashboard title vs in-card numerals — two unrelated roles at one size |
| `text-xl` | 20 / 28 | Welcome empty-state title, `food/index`, `medication/archived` | Sub-screen title / large card title |
| `text-lg` | 18 / 28 | `Button`, `PetCard` name, `family.name`, `feedback` headers, `RecordRow` title, `food/index` brand, `vaccination/[id]/edit` heading | Mixed: button label vs card titles vs row primary |
| `text-base` | 16 / 24 | ~70 call sites — input labels, body copy, edit form values, "Edit" save buttons, allergies "No known allergies", `MenuRow`, `MetadataPill`, `AddRecordCard` "Add medication" CTA | Body / input / button / list-row primary — way overloaded |
| `text-sm` | 14 / 20 | ~60 call sites — secondary text in `pet-family/index`, member names, error messages, "View all", "Restore", inline footnotes | Footnote / secondary text / inline link |
| `text-xs` | 12 / 16 | ~25 call sites — uppercase section labels, `StatusPill`, "Active invite", member role / joined-at, action-item-card metadata, `SectionHeader` "See all" pill | Caption / uppercase eyebrow / pill — overloaded |
| Inline `fontSize: 16` | 16 | `ConfirmationModal`, `MedicationCard` fraction indicator, `CutenessGauge`, `Avatar` | One-off escapes |
| Inline `fontSize: 18` | 18 | `SearchableDropdown` item | One-off escape |
| Inline `fontSize: 22` | 22 | `ErrorBoundary` title | One-off escape |

### What the existing semantic tokens map to

```
display    30 / 36              ← unused outside of one or two leafs
title      22 / 28              ← unused
headline   17 / 22 600          ← used in RecordCard, MedicationCard, VaccinationCard, PetCard
body       17 / 24              ← almost unused; same pt as headline
callout    16 / 22              ← used in 3 leaf cards
footnote   13 / 18              ← used in RecordCard date column + indicator caption
caption    12 / 16              ← documented but no class call sites
button-sm  15 / 20 600          ← used in MedicationCard / VaccinationCard "Log Dose"
```

**Two structural problems with the existing tokens:**

1. There's no large-title token (`text-3xl`/30pt-bold) even though that's
   the most-used title size in the app — every Add/Edit form, every
   record detail header, every auth screen, the pet sticky header. 18
   files reach for `text-3xl` because `display` (also 30) implies regular
   weight per the design system, while these screens want bold, and
   `title` (22pt) is too small. There is a token-shaped hole here.
2. `headline` and `body` are both 17pt. iOS does this too (Headline is
   17pt 600, Body is 17pt 400), but in our app it's collapsing the
   visual gap between row primary text and metadata when they sit
   adjacent. We should keep both tokens but be more disciplined about
   when each is used.

## 3. Hierarchy issues found, per screenshot

### Screenshot 1 — Pet detail (Beau, Medicines tab)

**Components:** `StickyHeader` → `TabBar` → `AddRecordCard` → list of `MedicationCard`.

| Element | Code source | Current | Issue |
|---|---|---|---|
| "Beau" pet name | `StickyHeader.tsx:37` | `text-3xl font-bold` (~30pt) | Fine in isolation, but inconsistent with `display` token (30 / 36 regular) — should be **one role** ("largeTitle bold"), not two. |
| "Cocker Spaniel" subtitle | `StickyHeader.tsx:40` | `text-base` (16pt) | Should be `callout` (16pt) for parity with `PetCard` subtitle. Currently both render at 16 but via different classes — token drift. |
| MetadataPill labels ("8 years 1 month", "♂ Male", "12.2 kg") | `MetadataPill.tsx:19` | `text-base font-medium` (16pt) | Probably **too large** for inline metadata pills. Apple's equivalent (in Health, Fitness) is 13pt semibold. Drop to `footnote` (13pt) or a new `metadata` token at 14pt. |
| Tab labels ("Profile", "Medicines"…) | `TabBar.tsx:180` | `text-base font-semibold` (16pt) | This is correct iOS sizing for a segmented tab bar (~15-16pt). Keep. Should reference a token. |
| "Add medication" CTA in `AddRecordCard` | `AddRecordCard.tsx:41` | `text-base font-medium` (16pt) | OK, but should be `callout` token since it's a card-internal CTA, not a button. |
| Medication name "Heartgard Plus" | `MedicationCard.tsx:133` | `text-headline` (17pt 600) | Correct. |
| "100mg · Once monthly" subtitle | `MedicationCard.tsx:139` | `text-callout` (16pt) | **Inconsistent with `RecordCard` subtitle** — same role, same token, but the 1pt difference between callout and footnote is invisible. Should pick one (recommend `callout`) and standardise across both. |
| Indicator fraction "1/2" | `MedicationCard.tsx:58` | inline `fontSize: 16, weight 700` | Inline escape; should be a token or moved to component-internal style constant. |
| "Given 5m ago" context | `MedicationCard.tsx:150` | `text-footnote` (13pt) | Good. |
| "Log Dose" pill text | `MedicationCard.tsx:169` | `text-button-sm` (15pt 600) | Good. |

**Hierarchy verdict:** the body of the screen is fine; the problem is at
the top — the `StickyHeader` uses raw `text-3xl` instead of a token, so
this 30pt-bold size has no name, and 17 other files use the same raw
class for what is conceptually a different role (a screen title vs a pet
name).

### Screenshot 2 — Dashboard ("Your Pet Family")

| Element | Code source | Current | Issue |
|---|---|---|---|
| "Your Pet Family" header | `index.tsx:94` | `text-2xl font-bold` (~24pt) | **Too small** for a primary screen title — Apple HIG large title is 34pt, and this is the *only* place in the app that uses 24pt-bold for a screen title. Every other screen uses `text-3xl`. **Direct inconsistency.** Bump to the new `largeTitle` token (30pt bold) for parity with the rest of the app. |
| "3 ITEMS NEED ATTENTION" pill | `NeedsAttentionSummary.tsx:39` | `text-xs font-semibold uppercase tracking-wider` (~12pt) | **Too small.** Apple's equivalent eyebrow ("footnote uppercase tracked") is ~13pt. Combined with semibold + tracking it works, but next to a 24pt header it reads as a runt. Bump to `caption-bold` 12 → `eyebrow` 13 + tracking. |
| "BEAU" / "REMY" group header in PetActionList | `PetActionList.tsx:37` | `text-xs font-semibold uppercase tracking-wider` | Same role as the "Needs Attention" eyebrow → must use the **same token**. They're slightly different in weight today (both `font-semibold`, OK) — but should be wired to one named token (`eyebrow`). |
| Pet card name "Beau" | `PetCard.tsx:25` | `text-lg font-semibold` (~18pt) | **Inconsistent.** This is a list-row primary; iOS uses 17pt semibold (= `headline`). Currently 18pt because of `text-lg`. Should be `headline`. |
| Pet card subtitle "Cocker Spaniel" | `PetCard.tsx:28` | `text-callout` (16pt) | OK, but the **gap from name (18pt) → subtitle (16pt) is only 2pt** which is too tight. Bumping name up to `headline` (17) compresses it further to 1pt; we should drop subtitle to `footnote` (13) so the rhythm reads cleanly. |
| Pet card age line | `PetCard.tsx:31` | `text-callout` | Same as above — should be `footnote`. |
| Action item rows ("View all", "1 item needs attention") | `PetActionList.tsx:51,54` | `text-sm` (14pt) | OK as a token, but should reference `footnote` (13) or a new `subhead` (15) — currently using a raw size that has no semantic meaning. |
| "Add to your family" dashed-card CTA | `index.tsx:180` | `text-sm` (14pt) | Footnote-sized, but conceptually a button label. Should be `button-sm` (15pt) for parity with other compact button labels. |

**Hierarchy verdict:** five distinct roles competing on this one screen
("Your Pet Family" 24, eyebrow 12, group header 12, pet name 18, pet
subtitle 16, action row 14, dashed-CTA 14, plus emoji 24, plus the FAB).
Cluttered. The fix is fewer levels and consistent tokens — see proposed
scale below.

### Screenshot 3 — Dashboard with bottom-sheet menu open

| Element | Code source | Current | Issue |
|---|---|---|---|
| Display name / email at top | `menu.tsx:83,91` | `text-base font-semibold` / `text-sm` | `text-base` (16) is fine for primary; iOS uses 17 here (see `headline`). **Inconsistent** with rest of app's `headline` usage. |
| "Settings" / "Pet Family" / "Send Feedback" | `MenuRow.tsx:36` | `text-base` (16) | iOS standard for menu rows is **17pt body**, not 16pt. We're 1pt low and using the wrong token. Should be `body` (17). |
| "Sign Out" (destructive) | `MenuRow.tsx:36` w/ `font-semibold` | `text-base font-semibold` | Same as above; should be `body` semibold. |

**Hierarchy verdict:** The menu sheet is functional but undersized
relative to iOS conventions. A 1pt bump to 17pt body across menu rows
would feel native rather than scaled-down.

### Screenshot 4 — Pet Family screen

| Element | Code source | Current | Issue |
|---|---|---|---|
| "Pet Family" page title | `pet-family/index.tsx:215` | `text-3xl font-bold` (~30pt) | Same `largeTitle` role as other screens. Confirms the missing token. |
| "FAMILY" / "PETS" / "ARCHIVED PETS" section labels | `pet-family/index.tsx:202` | `text-text-secondary text-xs font-semibold uppercase tracking-wider` (~12pt) | Same eyebrow role as dashboard but a *fourth* call site of the same exact class string. Should be one token (`eyebrow`). |
| Family name "The Smith Family" | `pet-family/index.tsx:256` | `text-lg font-semibold` (18pt) | Card title; should be `headline` (17). |
| Member name | `pet-family/index.tsx:305` | `text-sm font-medium` (14pt) | List row primary inside card; should be `body` (17) or at minimum `callout` (16). **14 is too small for a primary** — it reads as metadata. |
| Member role + joined-at | `pet-family/index.tsx:310` | `text-xs` (12pt) | Should be `footnote` (13). 12pt is iOS's smallest legible size; reserve it for true caption text only (timestamps in dense lists). |
| "Active invite" eyebrow + invite code + expiry | `pet-family/index.tsx:345-349` | `text-xs` / `text-sm font-medium` / `text-xs` | Three different sizes for one inline block — should be `caption` / `headline` / `caption` with consistent rhythm. |
| Active pet rows (name "Beau") | `pet-family/index.tsx:449` | `text-base font-medium` (16) | List row primary — should be `headline` (17) for parity with `PetCard`. |
| Active pet subtitle "Cocker Spaniel" | `pet-family/index.tsx:452` | `text-sm` (14) | Should be `footnote` (13). |
| "No active pets yet" empty | `pet-family/index.tsx:428` | `text-sm` (14) | Should be `footnote` or `callout` depending on framing. |
| "Restore" link in archived | `pet-family/index.tsx:499` | `text-sm font-semibold` (14) | Inline button link — should be `button-sm` (15pt 600). |
| "Add a pet" dashed-card | `pet-family/index.tsx:518` | `text-sm` (14) | Same as dashboard — should be `button-sm`. |

**Hierarchy verdict:** this screen uses every size in the catalog —
12, 14, 16, 18, 30 — and three of those (12/14/16) overlap roles. Six
different sizes on one screen for what is functionally a list of cards
with titles and subtitles is at least two too many.

### Cross-screen issues (the founder's actual complaint)

1. **Dashboard "Your Pet Family" 24pt** vs **Pet Family screen "Pet Family"
   30pt** vs **Add Medication "Add medication" 30pt** — three sizes for
   the same role (top-of-screen title). All should be one token.
2. **Pet card name 18pt (text-lg)** vs **Pet Family screen pet name 16pt
   (text-base)** vs **PetActionList "BEAU" 12pt** — three sizes for
   "this is a pet's name in a list context" depending on which screen
   you're on. The eyebrow case is a different role; the other two should
   not differ.
3. **Subtitles**: Pet card breed = 16, Pet Family pet breed = 14,
   `RecordCard` subtitle = 16, `MedicationCard` subtitle = 16. Three of
   four converge at 16 (callout); one outlier at 14. Trivial fix.
4. **Eyebrow uppercase labels** appear at 12pt with semibold + tracking
   in at least 6 different files, all with the **identical class
   string** copy-pasted. That's the cleanest possible candidate for
   tokenisation — extract to `text-eyebrow` or a `<SectionLabel>`
   component.
5. **Pill text** is `text-xs font-semibold` (12pt) in `StatusPill` but
   `text-base font-medium` (16pt) in `MetadataPill`. These are different
   roles (status vs metadata) so divergence is justified, but currently
   undocumented. Add a "pill" sub-section to typography rules.
6. **"Log" buttons**: `MedicationCard` uses `button-sm` (15) inside a
   pill background; `PetActionList` "View all" uses `text-sm` (14) plain
   text; `pet-family` "Restore" uses `text-sm font-semibold` (14). Same
   role (inline tappable text), three sizes. Standardise to `button-sm`.

## 4. Proposed scale

Drop the `display` / `body` / `callout` distinction-by-pt-only fiction,
add the missing `largeTitle`, and add explicit `eyebrow` and `metadata`
tokens for the two roles that currently get reinvented per screen.

| Token | pt / lh | Weight | Letter-spacing | Role | Replaces / sample call sites |
|---|---|---|---|---|---|
| `largeTitle` | **30 / 36** | **700** | `-0.4` | Top-of-screen titles on every primary screen — Pet Family, Add/Edit forms, record detail headers, sign-in, pet sticky header (pet name) | All `text-3xl font-bold` (18 files) and `app/(main)/index.tsx:94` (Your Pet Family — currently `text-2xl`, needs to be bumped) |
| `title` | 22 / 28 | 600 | `-0.3` | Section card titles when a card hosts a single statement (e.g. archive section heading "Archived medications") | `text-xl font-bold` archive header, `food/index` brand title |
| `headline` | 17 / 22 | 600 | `-0.2` | List-row primary, card titles, family name, pet card name, menu sheet "display name" | `text-lg font-semibold` (PetCard, family name, RecordRow), `text-base font-medium` (Pet Family pet rows), keep current MedicationCard / RecordCard usage |
| `body` | 17 / 24 | 400 | 0 | Default body, menu rows ("Settings", "Pet Family", "Send Feedback"), input field text, detail values, modal bodies | `text-base` for menu rows, ConfirmationModal body, input values |
| `callout` | 16 / 22 | 400 | 0 | Subtitles inside cards (RecordCard subtitle, PetCard breed, MedicationCard frequency), "Edit" / "Save" header text buttons, secondary CTA pills | `text-base` subtitles, `text-callout` (already), `text-base` save header |
| `subhead` | 15 / 20 | 600 | 0 | **Compact button labels.** Inline tappable text (Log Dose pill, Restore link, "View all", "Add a pet" dashed CTA, allergy pill text). Same as current `button-sm`, renamed for clarity. | `text-button-sm` (already), `text-sm font-semibold` for Restore / View all, `text-sm` for dashed CTA, allergy pill |
| `footnote` | 13 / 18 | 400 | 0 | Secondary metadata under list-row primary (pet card breed, member role + joined-at, RecordCard year, MedicationCard context "Given 5m ago"), inline error text, helper copy under inputs | All current `text-sm` for metadata, `text-xs` for member role/joined-at, `text-footnote` (already) |
| `caption` | 12 / 16 | 600 | `+0.6` | **The only correct home for `StatusPill` text** and other inline status badges. Reserved exclusively for tightly-clamped pill content. | Current `text-xs font-semibold` in `StatusPill`, action-item-card metadata |
| `eyebrow` | 13 / 16 | 600 | `+1.2` (tracking-wider) | Uppercase section labels — "ABOUT", "ALLERGIES", "TIMELINE", "FAMILY", "PETS", "BEAU"/"REMY" group headers, "3 ITEMS NEED ATTENTION", "ACTIVE INVITE" | Every `text-xs font-semibold uppercase tracking-wider` site (~6 files). **Bump from 12 to 13 — this is the single biggest visible change.** |
| `metadata` | 14 / 18 | 600 | `-0.1` | `MetadataPill` content (age, sex, weight) — a distinct role from generic body | Current `text-base font-medium` in MetadataPill (drops it from 16 → 14). |

**Total: 10 tokens.** Apple's HIG ships 11 (LargeTitle, Title1/2/3,
Headline, Body, Callout, Subhead, Footnote, Caption1, Caption2). Our 10
maps cleanly onto theirs minus Title2/3 (which we genuinely don't need
for an app this size) plus an explicit `eyebrow` and `metadata`.

### Justification for deviations from Apple defaults

1. **`largeTitle` 30pt instead of 34pt.** Apple uses 34pt for the
   collapsing title in scrollable navigation. We're not using
   `LargeTitleDisplayMode.always` and have no large-title navigation
   chrome — our titles render in flow with cards, so 34pt would feel
   bombastic at our column widths. 30pt is a deliberate choice for
   indie-app warmth.
2. **Bumping `eyebrow` from 12 to 13.** Apple's Footnote (13pt) is the
   designated home for tracked uppercase labels. Our 12pt with
   tracking-wider is below the legibility floor on AX1 displays.
3. **`metadata` at 14pt.** Apple has no equivalent token; iOS Health
   uses 13pt for inline metadata. We're dropping `MetadataPill` from
   16 → 14 (not 13) because our pill has more horizontal padding and a
   shadow; 13 would feel ghostly inside a 36pt-tall pill.
4. **`subhead` at 15pt instead of HIG's 15pt regular.** We make ours
   semibold because every consumer of this token is a tappable label —
   regular weight would read as body copy and undermine the affordance.
5. **`caption` at 12pt 600 with +0.6 tracking.** Reserved exclusively for
   pill content, where the +0.6 tracking compensates for the cramped
   container. 12pt is acceptable here because it's always paired with a
   color and a shape, never a long string.

### Dynamic Type clamp

Keep `maxFontSizeMultiplier = 1.3`. With the new scale, AX1 (1.0×) →
30/30/22/17/17/16/15/13/12/13/14 and 1.3× → 39/39/29/22/22/21/20/17/16/17/18.
At 1.3×, `largeTitle` lands at 39pt which is just under iOS's "Larger"
preset (40pt) — fine. The `MetadataPill` at 1.3× hits 18pt which still
fits inside the existing pill height (36pt). Verified mentally; will
need a visual pass at 1.3× before sign-off.

## 5. Migration plan

### Phase 2A — finalise tokens (1 file)

| File | Change | LOC |
|---|---|---|
| `tailwind.config.js` | Add `largeTitle`, `subhead`, `eyebrow`, `metadata`. Rename `button-sm` → `subhead` (or alias). | +6 |
| `constants/typography.ts` | Mirror the new tokens. | +6 |
| `docs/bemy-design-system.md` | Update the Typography table. | +20 |

### Phase 2B — top-priority migrations (most visible churn)

| File | Changes | Estimated LOC |
|---|---|---|
| `app/(main)/index.tsx` | `text-2xl` → `text-largeTitle` on dashboard header (line 94); empty-state `text-xl` → `text-title`; "Add to your family" `text-sm` → `text-subhead` | ~6 lines |
| `components/pets/StickyHeader.tsx` | `text-3xl font-bold` → `text-largeTitle`; `text-base` subtitle → `text-callout` | 2 lines |
| `components/pets/PetCard.tsx` | `text-lg font-semibold` → `text-headline`; `text-callout` (already) breed/age → `text-footnote` (drops to 13) | 3 lines |
| `components/pets/MetadataPill.tsx` | `text-base font-medium` → `text-metadata` (drops to 14) | 1 line |
| `components/dashboard/NeedsAttentionSummary.tsx` | `text-xs font-semibold uppercase tracking-wider` → `text-eyebrow` | 1 line |
| `components/dashboard/PetActionList.tsx` | Same eyebrow swap; `text-sm` body rows → `text-footnote` | 3 lines |
| `app/(main)/pet-family/index.tsx` | All eyebrow sites → `text-eyebrow`; `text-3xl` title → `text-largeTitle`; family name `text-lg` → `text-headline`; member name `text-sm` → `text-body`; member role `text-xs` → `text-footnote`; pet rows `text-base` → `text-headline`, `text-sm` → `text-footnote`; "Restore" → `text-subhead` | ~14 lines |
| `app/(main)/menu.tsx` | Display name `text-base` → `text-headline`; sub-line `text-sm` → `text-footnote` | 2 lines |
| `components/ui/MenuRow.tsx` | `text-base` → `text-body` | 1 line |
| `components/ui/StatusPill.tsx` | `text-xs font-semibold` → `text-caption` | 1 line |

### Phase 2C — sweep migrations (mostly forms / detail screens)

Every Add and Edit screen has the same `text-3xl font-bold` heading and
the same set of `text-base` labels. Migration is mechanical:

- 18 files using `text-3xl font-bold` → `text-largeTitle` (18 lines).
- ~50 sites of `text-base` for input labels → `text-body` or `text-callout` depending on context.
- ~60 sites of `text-sm` → `text-footnote`.
- 8 inline `fontSize: N` escapes → tokens (4 are legitimate component-internal styling that can stay as constants).

**Total estimated LOC impact: ~250 lines changed across ~40 files.**
Bigger than Phase 1 but still mechanical. A single afternoon with a
codemod (or a careful regex replace + manual review of the ~10 ambiguous
spots) lands the whole thing.

### Phase 2D — extract a `<SectionLabel>` component

The same `text-eyebrow` + spacing combination shows up in 6+ places.
Worth extracting to a `<SectionLabel>` primitive that handles the casing
+ spacing. Keeps future call sites consistent. ~20 LOC.

## 6. Before / after ASCII mockups

### Dashboard

**Before** (mixed sizes, dashboard title undersized):
```
┌──────────────────────────────────────────┐
│  Your Pet Family             [paw]       │  ← 24pt bold  (the runt)
│                                          │
│  ● 3 ITEMS NEED ATTENTION                │  ← 12pt eyebrow (too small)
│  ┌──────────────────────────────────┐    │
│  │ ●  Beau                          │    │  ← 18pt semibold (text-lg)
│  │    Cocker Spaniel                │    │  ← 16pt callout
│  │    8 years, 1 month              │    │  ← 16pt callout
│  └──────────────────────────────────┘    │
│  BEAU                                    │  ← 12pt eyebrow
│  ┌──────────────────────────────────┐    │
│  │ Heartgard Plus       Log         │    │  ← 14pt link
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

**After** (consistent token usage; bigger title, calmer rhythm):
```
┌──────────────────────────────────────────┐
│  Your Pet Family             [paw]       │  ← 30pt bold largeTitle ✓
│                                          │
│  ● 3 ITEMS NEED ATTENTION                │  ← 13pt 600 +tracking eyebrow ✓
│  ┌──────────────────────────────────┐    │
│  │ ●  Beau                          │    │  ← 17pt 600 headline
│  │    Cocker Spaniel                │    │  ← 13pt footnote
│  │    8 years, 1 month              │    │  ← 13pt footnote
│  └──────────────────────────────────┘    │
│  BEAU                                    │  ← 13pt 600 eyebrow ✓
│  ┌──────────────────────────────────┐    │
│  │ Heartgard Plus       Log Dose    │    │  ← 15pt 600 subhead pill
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

The biggest perceptual change is the dashboard title growing from 24 →
30pt (matches every other screen) and the pet-card subtitle shrinking
from 16 → 13pt (gives a real 4pt gap from the 17pt name). Both make the
hierarchy read as "title → big card → quiet metadata" rather than three
muddled levels.

### Pet detail (Beau, Medicines)

**Before:**
```
< Beau                                       ← 30pt bold (text-3xl)
  Cocker Spaniel                             ← 16pt
  [8 years 1 month] [♂ Male] [12.2 kg]      ← 16pt 500 metadata pills (heavy)
  ─────────────────────────────────────
  Profile · Medicines · Vaccinations · …    ← 16pt 600 tabs
  ─────────────────────────────────────
  + Add medication                           ← 16pt link
  ┌────────────────────────────────────┐
  │ Heartgard Plus              ✓      │     ← 17pt 600 headline ✓
  │ 1 chewable · monthly  Given 5m ago │     ← 16pt + 13pt
  │                       [Log Dose]   │     ← 15pt 600 ✓
  └────────────────────────────────────┘
```

**After:**
```
< Beau                                       ← 30pt bold largeTitle ✓
  Cocker Spaniel                             ← 16pt callout
  [8y 1m] [♂ Male] [12.2 kg]                 ← 14pt 600 metadata pills (lighter)
  ─────────────────────────────────────
  Profile · Medicines · Vaccinations · …    ← 16pt 600 tabs (use callout-bold)
  ─────────────────────────────────────
  + Add medication                           ← 15pt 600 subhead
  ┌────────────────────────────────────┐
  │ Heartgard Plus              ✓      │     ← 17pt 600 headline
  │ 1 chewable · monthly  Given 5m ago │     ← 16pt callout + 13pt footnote
  │                       [Log Dose]   │     ← 15pt 600 subhead
  └────────────────────────────────────┘
```

The metadata pills shrinking from 16 → 14 lets the pet name breathe
without changing the pill chip height (we keep the existing padding,
which is the right call for thumb targets).

### Bottom-sheet menu

**Before:**
```
┌──────────────────────────────────────┐
│ [@] Sam Smith                        │  ← 16pt 600
│     jack@example.com                 │  ← 14pt
│ ──────────────────────────────────   │
│ [⚙] Settings                    >    │  ← 16pt body
│ [👥] Pet Family                  >    │  ← 16pt body
│ [💬] Send Feedback               >    │  ← 16pt body
│ ──────────────────────────────────   │
│      Sign Out                        │  ← 16pt 600
└──────────────────────────────────────┘
```

**After (1pt bump throughout):**
```
┌──────────────────────────────────────┐
│ [@] Sam Smith                        │  ← 17pt 600 headline
│     jack@example.com                 │  ← 13pt footnote
│ ──────────────────────────────────   │
│ [⚙] Settings                    >    │  ← 17pt body  (matches iOS)
│ [👥] Pet Family                  >    │  ← 17pt body
│ [💬] Send Feedback               >    │  ← 17pt body
│ ──────────────────────────────────   │
│      Sign Out                        │  ← 17pt 600 body
└──────────────────────────────────────┘
```

A subtle but felt change — menu sheets read as native instead of
"slightly smaller than expected".

### Pet Family screen

**Before:**
```
< Pet Family                              ← 30pt bold
  Family                                  ← 12pt eyebrow
  ┌────────────────────────────────┐
  │ The Smith Family          ✏︎   │      ← 18pt 600
  │ ──────                         │
  │ 👤 Jack (You)                  │      ← 14pt 500
  │    Admin · Joined 3 mo ago     │      ← 12pt
  └────────────────────────────────┘
  Pets                                    ← 12pt eyebrow
  ┌────────────────────────────────┐
  │ [B]  Beau                  >   │      ← 16pt 500
  │      Cocker Spaniel            │      ← 14pt
  └────────────────────────────────┘
```

**After:**
```
< Pet Family                              ← 30pt bold largeTitle ✓
  FAMILY                                  ← 13pt 600 +tracking eyebrow ✓
  ┌────────────────────────────────┐
  │ The Smith Family          ✏︎   │      ← 17pt 600 headline
  │ ──────                         │
  │ 👤 Jack (You)                  │      ← 17pt body
  │    Admin · Joined 3 mo ago     │      ← 13pt footnote ✓
  └────────────────────────────────┘
  PETS                                    ← 13pt 600 +tracking eyebrow ✓
  ┌────────────────────────────────┐
  │ [B]  Beau                  >   │      ← 17pt 600 headline
  │      Cocker Spaniel            │      ← 13pt footnote
  └────────────────────────────────┘
```

The fix here is that members + pets become real list rows (17pt primary,
13pt secondary) instead of metadata-sized text masquerading as primary
content.

## 7. Risks

1. **Metadata pill width.** Dropping `MetadataPill` from 16 → 14pt
   shrinks the visible string but the pill currently has fixed
   horizontal padding (`px-4`). The chip will appear visually wider with
   short labels ("♂ Male") at the new size. Solution: tighten `px-4` →
   `px-3` in the same migration; ship together so the chip looks
   tightened, not loose.
2. **Snapshot tests.** Every component that has a snapshot test will
   churn. Of the 80+ test files in the repo, ~30 have snapshots that
   will need re-baselining. Plan: in Phase 2A, delete and regenerate all
   snapshots in a single commit; review the diff once, accept en masse.
3. **Layout shift in fixed-width chrome.** `RecordCard` date column is
   fixed at 44pt wide. Day number is currently `text-2xl` (24pt) — if we
   tokenise to `title` (22pt) we save 2pt, fine. Spot-check that
   single-digit days don't visually drift.
4. **`text-eyebrow` tracking.** NativeWind doesn't support
   `letter-spacing` in the same shorthand as font-size; we'll need
   `tracking-[0.6px]` or `tracking-wider` on `text-eyebrow` separately,
   either via `Text` defaultProps or via a `<SectionLabel>` component.
   Decision needed before migration begins.
5. **Dynamic Type at 1.3× on dashboard pet card.** With name at 17 →
   22pt and subtitle at 13 → 17pt, the avatar (currently 56pt) is no
   longer the tallest element. The card grows slightly. Verified
   mentally that it doesn't break the FlatList vertical rhythm but
   should be checked on-device.
6. **Auth screens use `text-3xl` and `text-4xl` (welcome).** Welcome's
   `text-4xl` is the only legitimate use of 36pt in the app — the hero.
   We should leave that alone (or token-name it as `display`) rather
   than fold into `largeTitle`. The new scale should expose `display` at
   36pt-bold for that one call site.

---

## Summary of recommended actions

1. **Add three tokens to `tailwind.config.js` and `constants/typography.ts`:**
   `largeTitle` (30pt 700), `subhead` (15pt 600 — alias of current
   `button-sm`), `eyebrow` (13pt 600 +tracking), `metadata` (14pt 600).
2. **Bump dashboard title to `largeTitle`** — fixes the only screen in
   the app where the top-of-screen title is undersized.
3. **Eyebrow consolidation.** Replace every `text-xs font-semibold
   uppercase tracking-wider` (~6 files) with `text-eyebrow`. Single-line
   change per file.
4. **Pet-card subtitle 16 → 13.** Fixes the cramped 2pt rhythm in
   `PetCard`. Same change in `pet-family/index.tsx` for pet rows.
5. **Menu rows 16 → 17.** Native iOS feel.
6. **MetadataPill 16 → 14.** Prevents pet info pills from competing
   with the pet name visually.
7. **Mechanical sweep** of the 18 `text-3xl font-bold` headers and
   ~120 raw `text-sm` / `text-base` call sites onto tokens.
