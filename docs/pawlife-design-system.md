# Pawlife Design System

> Canonical source of truth for design in Pawlife. Always check this doc before introducing a new pattern. When you change a pattern in code, update this doc in the same PR.

This doc consolidates everything previously scattered across `CLAUDE.md` (Design System / UI Patterns / Styling), `docs/archive/pawlife-screen-inventory.md`, and the various `feedback_*.md` / `project_*.md` memory files. Where this doc and any of those disagree, **this doc wins**.

Source-of-truth precedence when this doc is silent:
1. **Code tokens** — `constants/colors.ts`, `constants/typography.ts`, `tailwind.config.js`
2. **Designer's destructive-action recommendation** (see [Destructive Action Patterns](#destructive-action-patterns))
3. This doc
4. CLAUDE.md UI Patterns block
5. Anything else

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Voice & Tone](#voice--tone)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Layout & Spacing](#layout--spacing)
6. [Components Inventory](#components-inventory)
7. [UI Patterns](#ui-patterns)
8. [Destructive Action Patterns](#destructive-action-patterns)
9. [Accessibility](#accessibility)
10. [Illustration & Art Style](#illustration--art-style)
11. [Things We Don't Do](#things-we-dont-do)

---

## Design Principles

1. **Warm, not clinical.** This is about your pet family, not a medical chart. Soft corners, warm colors, generous whitespace. Aim for the feel of a premium baby tracking app, not a hospital portal.
2. **Pet-first hierarchy.** The pet's face and name anchor every screen. The user should always feel like they're "inside" a specific pet's world.
3. **Progressive disclosure.** Show the most important info upfront; let users drill in for detail.
4. **One-thumb reachable.** Primary actions sit within thumb reach. Bottom sheets over full-screen modals for simple inputs.
5. **Celebration over obligation.** Frame health tracking as caring for your pet family, not completing a checklist.
6. **Scannable cards.** Records are card-based with clear visual hierarchy — title, date, status at a glance.
7. **Empty states that guide.** Every empty screen explains what goes there, why it matters, and offers a single clear CTA.
8. **Flat information architecture.** Don't bury frequent records behind summary screens. Show inline on the pet detail screen with "See all" links. (See [feedback_design.md history](#history--legacy-references).)
9. **No decorative accent colors.** Coloured borders or fills only when they convey status (StatusPill, alerts). Otherwise the surface is white on warm yellow with a warm gray border.
10. **Generous typography.** Clear size differences between display / title / headline / body. Don't cram metadata into one tiny inline line — use `MetadataPill` or a structured layout.

---

## Voice & Tone

1. **"Pet family" not "pets."** Always refer to the user's animals as their "pet family" or by name.
2. **Use pet names everywhere possible.** "Luna's vaccinations" not "Pet vaccinations."
3. **Warm and encouraging, not instructional.** "Time to update Luna's records!" not "Please enter vaccination data."
4. **Celebrate milestones.** "Milo has been part of your family for 3 years!" — acknowledge the relationship, not just the data.
5. **Gentle with sensitive topics.** Archive, not delete. "Remembering Luna" not "Archived pet." Empathetic language around loss.
6. **Conversational CTAs.** "Add to Luna's story" beats "Create record." "What's Luna eating?" beats "Add food entry."
7. **Avoid jargon.** "Shots" or "vaccinations" not "immunizations." Match how people actually talk about their pets.
8. **Playful, not childish.** Light humor is fine; don't overdo puns or emoji.

### Microcopy patterns

| Situation | Copy pattern |
|---|---|
| Record list empty | "No vaccinations yet. Start building [Name]'s health history." |
| Action confirmation (gentle) | "We'll keep all of [Name]'s records safe." |
| Destructive confirmation | "This will permanently remove the record from [Name]'s history. This can't be undone." |
| Onboarding | "Welcome to Pawlife! Let's meet your pet family." |
| Form helper | "Auto-suggested based on Rabies schedule. You can adjust this." |

---

## Color Palette

**Source of truth: `constants/colors.ts`.** NativeWind tokens mirror these in `tailwind.config.js`. Never hardcode hex.

### Current tokens (in `constants/colors.ts`)

| Role | Token | Hex | NativeWind class |
|---|---|---|---|
| App background | `Colors.background` | `#FFF8E7` | `bg-background` |
| Primary / CTA | `Colors.primary` | `#4A2157` | `bg-primary` / `text-primary` |
| Primary pressed | `Colors.primaryPressed` | `#341539` | `bg-primary-pressed` |
| Brand accent (coral) | `Colors.accent` | `#E8735A` | `bg-accent` / `text-accent` |
| Card surface | `Colors.card` | `#FFFFFF` | `bg-card` |
| Primary text | `Colors.textPrimary` | `#2D2A26` | `text-text-primary` |
| Secondary text | `Colors.textSecondary` | `#7A756E` | `text-text-secondary` |
| Status — current / done | `Colors.statusGreen` | `#5BA67C` | `bg-status-green` |
| Status — due soon | `Colors.statusAmber` | `#E5A84B` | `bg-status-amber` |
| Status — overdue | `Colors.statusOverdue` | `#E8735A` | `bg-status-overdue` |
| Status — neutral | `Colors.statusNeutral` | `#9CA3AF` | `bg-status-neutral` |
| Input fill (inside cards) | `Colors.inputFill` | `#F5F3F0` | `bg-input-fill` |
| Border / divider | `Colors.border` | `#EDE8DF` | `border-border` |
| Destructive | `Colors.destructive` | `#E5484D` | `bg-destructive` / `text-destructive` |

### Coral vs destructive

`Colors.accent`, `Colors.statusOverdue`, and `Colors.destructive` are now three distinct semantic tokens:

| Role | Token | Hex |
|---|---|---|
| Brand accent (warm highlights, illustrations, "due soon" warmth) | `Colors.accent` | `#E8735A` (coral) |
| Status — overdue | `Colors.statusOverdue` | `#E8735A` (coral, same hex as accent — distinct semantic) |
| Destructive actions (delete buttons, irreversible modal accents) | `Colors.destructive` | `#E5484D` (red) |

**Rule:** brand coral and destructive red **must never share a hex**. Coral is for warmth and overdue status; destructive red (`#E5484D`) is reserved exclusively for delete actions and the destructive/irreversible severity tiers of `ConfirmationModal`. `Colors.accent` and `Colors.statusOverdue` happen to share a hex today but are distinct tokens — they may diverge later without ripple effects on call sites.

### When to use each color

- **Plum (`primary`)** — primary CTAs, FAB, links, focused input borders, active filter pill, header back/save text buttons, archive/restore actions.
- **Coral (`accent` / `statusOverdue`)** — illustrations, "due soon" / overdue warmth, hero accents. **Never** as the fill of a primary button outside the destructive-account flow.
- **Sage / amber / coral / neutral status colors** — only on `StatusPill` and similar alert badges. They communicate state, not decoration.
- **Warm gray (`textSecondary`)** — secondary metadata, helper text, disabled-feeling states, "Optional" labels.
- **Border (`#EDE8DF`)** — card outlines, input borders, segment dividers. Never the primary visual; subtle.
- **Input fill (`#F5F3F0`)** — only used when an input lives inside a white card and needs to read as "field" against the card. Most of our inputs use the white-with-border treatment instead — check the existing form before picking a style.

---

## Typography

Source of truth: `constants/typography.ts` + `tailwind.config.js`. Use the Tailwind class wherever possible (`text-headline`, `text-body`, etc.) and import from `constants/typography.ts` only where you must set `style={{ fontSize: ... }}` inline.

### Semantic scale (10 tokens)

| Token | Tailwind class | Size / line-height | Weight | Use for |
|---|---|---|---|---|
| `display` | `text-display` | 36 / 40 | bold (700) | Hero-only — welcome screen title, invite-code display. **Reserve for one or two screens.** |
| `largeTitle` | `text-largeTitle` | 30 / 36 | bold (700) | **Top-of-screen titles on every primary screen** — Pet Family, Add/Edit forms, record detail headers, sign-in, dashboard "Your Pet Family", pet sticky header pet name. |
| `title` | `text-title` | 22 / 28 | regular | Section headings within a screen, big card titles, "things need your attention" dashboard sub-heading. |
| `headline` | `text-headline` | 17 / 22 | semibold | Card titles, list-row primary text (PetCard name, family name, MedicationCard title, RecordCard title, menu sheet display name). |
| `body` | `text-body` | 17 / 24 | regular | Default body, form input text, detail values, modal body, MenuRow labels. |
| `callout` | `text-callout` | 16 / 22 | regular | Subtitles inside cards (PetCard breed, RecordCard subtitle, MedicationCard frequency), header-bar text buttons ("Save"/"Edit"), AddRecordCard CTA. |
| `button-sm` | `text-button-sm` | 15 / 20 | semibold | Compact button labels — filter pills, "Log Dose", "Restore", "View all", inline tappable text. |
| `footnote` | `text-footnote` | 13 / 18 | regular | Secondary metadata (member role/joined-at, MedicationCard context "Given 5m ago"), helper text under inputs, inline error text, RecordCard year. |
| `eyebrow` | `text-eyebrow` | 13 / 16 | semibold + tracking | Uppercase section labels — "TIMELINE", "OPTIONAL", "ABOUT", "ALLERGIES", "FAMILY", "PETS", "ARCHIVED". One token, replaces every copy-pasted `text-xs font-semibold uppercase tracking-wider` block. |
| `caption` | `text-caption` | 12 / 16 | regular | StatusPill content, date-column month/year, smallest metadata. **Reserved for inline pill content** where space is tight. |

### Rules

- **Never set raw `fontSize` numbers in component code.** Use a class or the `Typography` constant.
- **Never use raw Tailwind sizes (`text-xs`/`text-sm`/`text-base`/`text-lg`/`text-xl`/`text-2xl`/`text-3xl`/`text-4xl`).** Always pick a semantic token. Phase 2 sweep migrated every prior raw-size call site; new code stays on tokens.
- **One headline-weight thing per card.** Don't ship a card with two `text-headline` lines competing — pick one primary, demote the rest.
- **Screen titles always use `largeTitle`.** The dashboard, pet detail header, every Add/Edit form, every record detail screen — they all share one role and one token.
- **Section eyebrows always use `eyebrow`.** The 6+ copy-pasted `uppercase tracking-wider` strings are now one token. If you don't want the tracked-uppercase treatment, don't use this token — drop the label entirely or pick `headline`/`title` instead.
- **Metadata pills** (age, sex, weight, breed) use a `MetadataPill` component, not free-floating text.
- **Default font weight is regular.** Reserve semibold for headlines, primary names, and buttons.

### Phase 2 migration note

The Phase 2 sweep (April 2026) migrated every hardcoded `text-*` class site
to a semantic token. Snapshots were rebaselined en masse. Going forward,
**a PR introducing a raw size class should be rejected at review** — pick
a token, or argue for adding a token to the scale.

### Dynamic Type clamp

`app/_layout.tsx` sets `Text.defaultProps.maxFontSizeMultiplier = 1.3`. iOS users at AX1+ still get larger text, but our fixed-width layouts (date column, status pill, log-dose pill) don't burst. **Don't change this without auditing every record card and every fixed-width pill.**

---

## Layout & Spacing

- **Card radius:** 16px (`rounded-card` / `rounded-2xl`).
- **Form padding inside a card:** `px-5 pt-4`.
- **Screen horizontal padding:** typically `px-5`. Lists tighten to `px-4` only when each row is a card with internal padding.
- **Vertical rhythm:** use `space-y-3` between cards in a list, `space-y-4` between form sections, `space-y-6` between distinct sections of a screen.
- **Subtle shadow on cards:** rely on the white-on-warm-yellow contrast and a 1px `Colors.border` outline. Avoid drop shadows that look heavy.
- **Touch targets:** 44pt minimum. Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` on icon-only buttons.

---

## Components Inventory

All components live in `components/`. Test files (`*.test.tsx`) sit alongside. Every component must have tests.

### `components/ui/` — primitives

| Component | One-liner |
|---|---|
| `Avatar.tsx` | Round pet photo with type-default fallback (dog/cat). |
| `Button.tsx` | Primary / secondary / text variants. Plum filled, plum outlined, plum text. Use this for any submit, save, or full-width action. |
| `Card.tsx` | White rounded surface, the wrapper for almost everything. |
| `DateInput.tsx` | Native date picker (`@react-native-community/datetimepicker`), day-first en-GB format. **Always** use this for dates — never raw text. |
| `ConfirmationModal.tsx` | Bottom-sheet-style confirm modal with `severity: 'standard' \| 'destructive' \| 'irreversible'`. Standard = neutral confirm. Destructive = red ghost-text confirm. Irreversible = filled red + typed-confirm gate (Delete Account only). |
| `DestructiveTextButton.tsx` | Tertiary destructive text button — red text, no border, no fill, 44pt hit target. Use for the bottom Delete on record detail screens and for destructive secondary actions (Remove Member, Leave Family, etc.). |
| `DetailRow.tsx` | Horizontal label/value row used inside detail cards. Multiple stacked = a detail card. |
| `Toast.tsx` | Lightweight in-app toast (`useToast()` hook). Use for low-stakes success notifications such as "Luna restored". Auto-dismisses after 2.5s. Wrapped in `ToastProvider` at the root. |
| `FAB.tsx` | Plum circular floating + button, bottom-right. Opens `QuickAddSheet` on the pet detail screen. |
| `MenuRow.tsx` | Settings/list-style tappable row with chevron. |
| `RecordCard.tsx` | Date-left record card (vaccinations, weight, food). Day number / 3-letter month / year stacked left; title/subtitle/detail right; optional `StatusPill` top-right. **No action buttons** — the card itself is tappable. |
| `Screen.tsx` | SafeAreaView wrapper with the warm-yellow background. Accepts `edges` prop — pass `['top','left','right']` when content extends to the bottom in white. |
| `SearchableDropdown.tsx` | Searchable picker. `strictMode` forces selection-only (used for medication frequency); `onSelect` accepts `string \| null`. |
| `SegmentedControl.tsx` | Inline pill segmented control for binary/ternary form choices (Sex, Food Type). |
| `SegmentedFilter.tsx` | Horizontal scrolling filter pills for list filters. Active = plum filled / white text. |
| `StatusCardLayout.tsx` | Shared layout primitive for status-bearing cards (`MedicationCard`, `VaccinationCard`). Pins the status indicator to an absolute-positioned slot at top-right so it can't drift with variable left/right content. See "Status card layout invariant". |
| `StatusPill.tsx` | Small status badge — supports `green`, `amber`, `overdue`, `neutral`. The **only** sanctioned place for status colors. |
| `TextInput.tsx` | `forwardRef`-compatible input with white bg + 1px border, focus state highlights to plum. |

### `components/pets/` — pet domain

| Component | One-liner |
|---|---|
| `AddRecordCard.tsx` | "Add record" empty-section CTA card — dashed/muted styling. |
| `AgePill.tsx` | Smart age indicator on the pet detail sticky header. Resolves to one of four phases via `useAgeMoment` (default / birthday / savor / puppy). Coral-tinted on birthday day; otherwise the standard white-pill treatment. **No senior phase** — see [Pet age indicator](#pet-age-indicator). |
| `CutenessGauge.tsx` | Playful pet header decoration. |
| `MetadataPill.tsx` | Small pill for inline pet metadata (sex, weight). For age, use `AgePill` instead — the static metadata pill is now reserved for sex/weight and is the fallback for pets recorded with `approximate_age_months` only. |
| `PetCard.tsx` | Dashboard pet row — round photo, name, breed/age, status summary. |
| `PetDetailSection.tsx` | Section wrapper inside the pet detail screen — title + (optional) "See all" link + content slot. |
| `QuickAddSheet.tsx` | Bottom sheet from FAB. Grid of add options for the active pet. |
| `RecordRow.tsx` | Compact recent-activity row used inside `PetDetailSection`. |
| `SectionHeader.tsx` | Uppercase + chevron section header (e.g. "VACCINATIONS · See all"). |
| `StickyHeader.tsx` | Sticky pet identity header on scroll. |
| `TabBar.tsx` | The Food / Medicines / Vaccinations / Weight tab bar on pet detail. (Vet Visits is hidden from UI; routes/services retained.) |

### `components/health/`

| Component | One-liner |
|---|---|
| `MedicationCard.tsx` | Purpose-built med card — info on left, status indicator + context + "Log Dose" link on right. **No date column.** Use this for every medication row; do not use `RecordCard` for meds. |
| `VaccinationCard.tsx` | Domain wrapper around `RecordCard` for vaccinations (date-left, status pill). |

### `components/dashboard/`

| Component | One-liner |
|---|---|
| `ActionItemCard.tsx` | Single "needs attention" item card on the dashboard. |
| `NeedsAttentionSummary.tsx` | Aggregated "needs attention" summary block on the dashboard. Filters out archived meds. |
| `PetActionList.tsx` | Per-pet grouped action list on the dashboard. |

### `components/food/`

(Currently no dedicated food components — food rows reuse `RecordCard`.)

---

## UI Patterns

### Detail screens (record detail)

- **Layout:** stack of white `Card` wrappers, each containing one or more `DetailRow`s.
- **Group fields into separate cards** with a small uppercase `caption` section label above (e.g. "TIMELINE" for date fields, "DETAILS" for the main payload).
- **Header bar:** back arrow (left), record-type label or pet context (center), "Edit" text button in plum (right).
- **Action buttons at the bottom of the screen:** primary "Edit" (plum filled), secondary "Delete" (destructive ghost text). **Never** include the record type in the label — "Edit" not "Edit Vaccination". (See `feedback_button_labels` history.)
- **No "Change Food" button on food detail.** Food change lives on the pet detail Food tab.

### Form screens

- **All input fields wrapped inside a single white `Card`** with `px-5 pt-4`.
- **Special controls** (pet type selector, photo picker) sit **outside** the card, above it.
- **Add screens:** bottom-anchored full-width primary `Button` (`"Add Luna to your family"`, `"Save"`).
- **Edit screens:** header bar with back arrow (left), title (center), and a plum "Save" text button (right). **No bottom submit button.**
- **Form inputs:** white background, 1px `Colors.border`, focus border switches to `Colors.primary`. (Some legacy inputs use `Colors.inputFill` instead — keep new fields on the white-with-border treatment for consistency.)
- **Validation errors** render inline below the field in coral text + footnote size.
- **Saving state:** primary button shows loading spinner; do not block the entire form.

### Record cards (vaccinations, weight, food)

```
┌──────────────────────────────────────────────┐
│ ┌────┐                                       │
│ │ 15 │   Rabies Booster              [pill]  │
│ │ JAN│   City Vet Clinic                     │
│ │2026│   Next due Feb 2029                   │
│ └────┘                                       │
└──────────────────────────────────────────────┘
```

- Date column on the left (`text-display` day, `text-caption` uppercase month, `text-caption` year).
- Title (`text-headline`), subtitle (`text-body` `text-text-secondary`), optional detail line (`text-footnote`).
- `StatusPill` top-right when applicable.
- The card itself is tappable; **no inline action buttons**.

### Medication cards

```
┌──────────────────────────────────────────────┐
│ Heartgard Plus                       ◉   ✓  │
│ 1 chewable · monthly         Given 5m ago    │
│                                  Log Dose ›  │
└──────────────────────────────────────────────┘
```

Status indicator (right side):

| Indicator | Meaning |
|---|---|
| Green circle + checkmark | All doses done / up to date |
| Amber fraction (e.g. `1/2`) | Partial daily doses or due soon |
| Red fraction (e.g. `0/1`) | Overdue |
| Gray dot | Never dosed, or finished (past end date) |

Context text is time-aware: `"Given 5m ago"`, `"Given 2h ago"`, `"Given yesterday"`, `"Due today"`, `"Due soon"`, `"1 more dose today"`, `"Finished"`, `"No doses logged"`.

**"Log Dose" visibility:** shown when status is amber / red / neutral, **or** always for "As needed" meds. Hidden when green (all caught up) and for finished meds.

**Frequency rules:** Frequency is **required** and selected from `MEDICATION_FREQUENCIES` (Zod-validated). `SearchableDropdown` is in `strictMode` here — no free text. "As needed" is the first option. Every med has dose tracking (no `isRecurring` toggle); end-date field is always shown.

**Overdue resets immediately** — logging a dose today resets status based on today's reality. We don't punish missed past days.

### Status card layout invariant

`MedicationCard` and `VaccinationCard` (and any future variant that shows an at-a-glance status indicator next to a primary title) **must** render through the shared `components/ui/StatusCardLayout.tsx` primitive.

The invariant: the **status indicator (dot, check circle, fraction) is rendered into an absolute-positioned slot anchored at the top-right of the card** (`position: 'absolute', top: 0, right: 0`, fixed width and height). Everything else — context text, "Log" / "Log Dose" pill, stale-prompt footer — lays out around it.

Why: when the indicator is part of a normal flex column, its vertical position drifts per row depending on:

- left-column content height (long vaccine / med names that wrap or differ in line count),
- right-column content (with vs without a Log button, with vs without context text),
- indicator size variance (a 10pt dot vs a 28pt check circle changes the column centroid under `justify-center`).

This was visible on real-device builds in the Vaccinations and Medications lists before the refactor: the green checks and orange dots sat at slightly different y-coordinates per row, producing a ragged column. The absolute-anchored slot is the structural fix — the indicator's position is now decoupled from any sibling content.

**Don't** introduce a new card with a right-side status indicator without using `StatusCardLayout`. If you need a different layout, extend the primitive (add a slot) rather than rebuilding the flex column from scratch.

The invariant is enforced by tests in `components/ui/StatusCardLayout.test.tsx` and the `layout invariant — status indicator anchor` blocks in both card test files.

### Dashboard hierarchy (Option B)

The dashboard's information hierarchy is a deliberate Option B from the
Phase 2 review:

```
Your Pet Family               [paw]              ← largeTitle
[welcome hero illustration]
3 things need your attention                     ← title + colored dot
┌──────────────────────────────────┐
│ [photo]  Beau                    │              ← PetCard (unchanged)
│          Cocker Spaniel          │
│          8 years, 1 month        │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ ●  Heartgard Plus       Log      │              ← Per-pet action card
│    For Beau · Due today          │
│ ─────────────────────────────    │
│ ●  Cytopoint            Log      │              ← Multiple stack with
│    For Beau · Overdue            │                 dividers in one card
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ [photo]  Remy                    │              ← Next pet's PetCard
│          Border Collie           │
└──────────────────────────────────┘
```

**Rules:**

- **`NeedsAttentionSummary` is a section heading**, not a pill. Uses
  `text-title` (22pt) so the highest-value info on the screen reads
  loudly. Empty state is celebratory: "All caught up 🎉".
- **No BEAU / REMY uppercase eyebrows on the dashboard.** They were
  vestigial — the pet card immediately above already names the pet.
  The action card's subtitle ("For Beau · Due today") carries the pet
  reference inline.
- **PetCard is unchanged.** Anchor of each pet's section. Same visual
  treatment as before Phase 2 (rounded card, photo, headline name,
  footnote breed/age).
- **Per-pet action items render in a single white card.** Same visual
  treatment (rounded-2xl, white bg, soft border) as PetCard so the two
  read as a paired unit. Multiple actions inside one card stack with a
  `bg-border` divider between rows.
- **4+ items collapses to a "View all" link** that navigates to the
  pet detail screen. Prevents the dashboard from growing unbounded for
  pets with lots of overdue records.
- **If a pet has no action items, no card appears** — only the PetCard.
  The relationship is "PetCard, optionally followed by an action card,
  then the next PetCard."

### Status pills

- Use `StatusPill` and only `StatusPill` for status colors.
- `green` = current / active / done. `amber` = due soon / partial. `overdue` = overdue / coral. `neutral` = completed / inactive / archived (gray).

### FAB

- Plum circular `+` button, bottom-right, only on screens that own a primary "add" action (pet detail).
- On pet detail, opens `QuickAddSheet`.
- Avoid stacking multiple FABs — a screen has one primary add target.

### Modals & bottom sheets

- **Quick-add sheet** — bottom sheet, drag handle, white bg, rounded top corners, dimmed backdrop. Grid of add options.
- **Delete / archive confirmations** — bottom-sheet-style `Modal` with `animationType="fade"`, rounded top corners, dark overlay. See [Destructive Action Patterns](#destructive-action-patterns) for the canonical severity tiers.
- **Photo viewer** — full-screen, pinch to zoom, tap/back to dismiss.
- **Don't use `Alert.alert` for destructive confirmations.** It defeats voice/tone. Use `ConfirmationModal`.

### Date inputs

- Always use `DateInput` (`@react-native-community/datetimepicker`).
- Format is **day-first** en-GB: `"15 Jan 2026"`. `formatDate` / `formatDateTime` in `utils/dates.ts` enforce this.

### Screen edges

- `Screen` wraps each route with a SafeAreaView. Pass `edges={['top','left','right']}` when the screen has its own white content area extending to the bottom (avoids a sliver of warm yellow showing under content).

### Pet detail tab structure

Pet detail screen tabs (left to right): **Food · Medicines · Vaccinations · Weight**. Vet Visits is intentionally hidden from UI; the route and service code are retained behind the scenes.

### Pet age indicator

The pet detail sticky header replaces the static "8 years, 1 month" age pill with `AgePill`, a smart indicator backed by `useAgeMoment(petName, dob)`. The hook resolves the pet's relationship to today's date into one of four phases:

| Phase | Trigger | Copy | Visual |
|---|---|---|---|
| `default` | The quiet ~330 days a year | `{petName} is {N} years old` (singular/plural) | Standard white pill, same as sex / weight pills |
| `birthday` | Today is the dob day-of-month (Feb 29 dobs fire on Feb 28 in non-leap years; uses local timezone) | `🎂 {petName} is {N} today` | Soft coral tint (`Colors.accent` @ 15%) with coral border. One cake emoji, exactly. |
| `savor` | 1–30 days after the most recent birthday | `{petName} just turned {N}` | Standard white pill — the past-tense framing is the warm part, no special treatment |
| `puppy` | Pet is under 12 months old | `{petName} is {N} weeks old` (under 8 weeks) or `{petName} is {N} months old` (8 weeks – 12 months) | Standard white pill |

**No senior phase.** This was an explicit product decision: the senior threshold is breed-dependent, the topic is sensitive (owners of older pets are often bracing for loss), and a "Golden years" sticker risks reading as either infantilizing or grim. We do not build the capability — no flag, no stub, no test. If we revisit, it becomes a separate research-led project.

**Voice:** warm, with surgical emoji use. The cake (🎂) appears on the birthday day only and exactly once. Every other state is a typographic treatment, not a graphical one. We are not a confetti app. (See `docs/pawlife-pet-age-indicator-pm.md` for the full product positioning.)

**Long pet names + Dynamic Type:** the pill enforces `numberOfLines={1}` with tail-ellipsis. Combined with the global `maxFontSizeMultiplier = 1.3` clamp, a name like "Sir Reginald" with the birthday copy stays in a single row. The pet name truncates first if anything has to give — the age info is the load-bearing part.

**Fallback:** pets recorded with `approximate_age_months` only (no precise `date_of_birth`) get the legacy static `MetadataPill` via `calculateAge`. There's no birthday to celebrate without a real date, and `AgePill` requires a dob.

---

## Destructive Action Patterns

This section is **canonical** — it overrides anything in CLAUDE.md, screen-inventory, or stitch prompts that disagrees. The patterns below were signed off by the designer; treat them as the target state. New destructive flows must conform; existing ones should migrate as they are touched.

### Action × variant × severity table

| Action | Button variant | Color | Modal severity |
|---|---|---|---|
| Edit (record) | primary filled | plum | — |
| Delete record (5 detail screens) | ghost text | destructive | destructive |
| Archive (med, pet) | secondary outlined | plum | standard |
| Restore (med, pet) | primary filled | plum | none — toast |
| Sign Out | ghost text | textPrimary | standard |
| Delete Account | filled | destructive | irreversible + typed DELETE |
| Remove Member | ghost text | destructive | destructive |
| Leave Family | ghost text | destructive | destructive |
| Revoke Invite | ghost text | destructive | standard |

### `ConfirmationModal` severity tiers

- **standard** — single confirm tap. Confirm button uses the action's natural color (plum for archive/sign-out, neutral for low-stakes).
- **destructive** — confirm button is destructive-tinted (red text on transparent, or destructive filled per the table above). Body copy must explicitly name what will be lost ("This will permanently remove the record from Luna's history. This can't be undone.").
- **irreversible** — typed-confirm gate. The user must type `DELETE` to enable the action button. **Reserved for Delete Account only.**

### Color rules

- **`Colors.accent` (`#E8735A`, coral) and `Colors.destructive` (`#E5484D`) must never share a hex.** Coral is for brand warmth + overdue status; destructive red is for delete actions and destructive/irreversible severities.
- **Filled red is reserved for Delete Account only.** Every other destructive action uses red text on a transparent background (ghost variant).
- **Recovery actions (Restore) skip the modal entirely** — primary plum button + a toast on success. Restoration is not destructive; don't gate it.
- **Archive is not destructive.** It's a secondary outlined plum button with a `standard` confirmation modal. Empathetic copy ("We'll keep all of Luna's records safe.") not alarmist copy.
- **Sign Out is not destructive.** Ghost text in `Colors.textPrimary`, `standard` modal.

### Implementation notes

- `Colors.destructive` (`#E5484D`) lives in `constants/colors.ts` alongside the matching `bg-destructive` / `text-destructive` Tailwind tokens.
- `components/ui/ConfirmationModal.tsx` is the canonical confirmation modal with `severity: 'standard' | 'destructive' | 'irreversible'`. **Do not** add new destructive flows that use `Alert.alert` — use `ConfirmationModal` with local `useState` visibility.
- `components/ui/DestructiveTextButton.tsx` is the canonical destructive ghost text button. Use for the bottom Delete on record detail screens and for destructive secondary actions (Remove Member, Leave Family, Revoke Invite). 44pt hit target via `hitSlop`; opacity feedback on press; 50% opacity when disabled.
- `components/ui/Toast.tsx` exposes `useToast().show(message)` for non-destructive recovery confirmations (Restore Pet, Restore Medication). Wrapped at `app/_layout.tsx` via `ToastProvider`.
- Filled destructive red is reserved for the `irreversible` severity inside `ConfirmationModal`. The only consumer today is the Delete Account flow (separate workstream).

---

## Accessibility

- **Dynamic Type clamp:** `maxFontSizeMultiplier = 1.3` set globally in `app/_layout.tsx`. AX1+ users still get larger text but fixed-width layouts (date column, status pill, log-dose pill) don't burst.
- **Touch targets:** 44pt minimum. Use `hitSlop` on icon-only buttons.
- **Color contrast:** all text on background combinations should hit WCAG AA. Plum on warm-yellow, charcoal on white, warm-gray on white all pass.
- **Status conveyed by more than color.** `StatusPill` always pairs the color with a text label ("Current", "Due soon", "Overdue"). Don't ship a status indicator that's color-only.
- **Form labels:** every input has a visible label and an `accessibilityLabel` if the visible label is iconographic.
- **Date inputs use the native picker** — they inherit OS-level accessibility automatically.

---

## Illustration & Art Style

Style: **flat minimal line art**. Single-weight clean lines in warm plum (`#4A2157`) with subtle color fills. Simple, modern, minimal detail. Consistent across the whole app.

### Midjourney prompt template

```
Flat minimal line art illustration of [SUBJECT]. Single-weight clean lines in
warm plum color with subtle [FILL COLOR] fill. Simple, modern, minimal.
Isolated on plain white background --ar [RATIO] --style raw --v 6.1
--no text, words, letters, shadow, background detail, watercolor, gradient, realistic
```

### Fill color palette by context

| Context | Fill |
|---|---|
| General / pets | soft coral |
| Vaccinations / health | sage green |
| Medications | soft coral |
| Weight | amber |
| Food | soft coral with warm yellow |
| Multi-subject / hero | soft coral and warm yellow |

### Output

- Aspect ratios: `1:1` for icons / empty-state spots, `3:2` for hero/banner images.
- Generate in Midjourney → upscale → run through `remove.bg` for transparent PNG → store at 500×500 in `assets/illustrations/`. Displays at 140–200pt on screen.

### Completed illustrations

- `empty-pets.png` — cozy pet bed with paw print (dashboard no-pets state)
- `empty-vaccinations.png` — shield with heart
- `empty-medications.png` — pill/capsule with plus
- `empty-weight.png` — flat digital scale with paw print
- `empty-food.png` — food bowl with leaf garnish
- `welcome-hero.png` — dog and cat sitting side by side (dashboard header)

### Planned

- Pet detail curved gradient header with texture overlay
- Dashboard background corner botanical accents (in flat line art style)
- Tab section header accent dividers

---

## Things We Don't Do

- **Don't hardcode hex values, font sizes, or spacing.** Use `Colors.*`, `Typography.*` / Tailwind classes, and the spacing rhythm above.
- **Don't use `Alert.alert` for destructive confirmations.** Use `ConfirmationModal`.
- **Don't use decorative accent colors on cards.** Status colors only, on `StatusPill`.
- **Don't add a bottom tab bar.** Navigation is drill-down: Dashboard → Pet Detail → Records. Settings via gear icon.
- **Don't add swipe-to-edit/delete on list items.** That pattern was in earlier inventory drafts but is not how the app works. Tap a row → detail screen → Edit / Delete.
- **Don't use spinners for list loading states** — use skeleton placeholders that match the card shape.
- **Don't include the record type in record-detail action button labels.** "Edit" / "Delete" only.
- **Don't use raw text inputs for dates.** Always `DateInput` with the native picker.
- **Don't share a hex between coral and destructive red.** Once `Colors.destructive` lands, those two roles are distinct forever.

---

## History & Legacy References

The following memory and doc references have been folded into this document; they are kept as commit history only, not as live design guidance:

- `feedback_design.md` — no decorative accents, flat IA, generous typography → folded into [Design Principles](#design-principles) and [Color Palette](#color-palette).
- `feedback_button_labels.md` — "Edit" / "Delete" only on record details → folded into [Detail screens](#detail-screens-record-detail).
- `project_medications_redesign.md` — MedicationCard, dose tracking, status model → folded into [Medication cards](#medication-cards).
- `docs/archive/pawlife-screen-inventory.md` — voice & tone and design principles pulled forward; per-screen prose treated as archived (the doc carries a deprecation banner).
- `docs/pawlife-stitch-prompts.md` — design mockup prompts; left in place as a separate concern (not part of the design system).

`project_art_style.md` (illustration art style) is referenced from this doc but **stays as its own memory file**, because illustration generation is a separate workstream from in-app design tokens.
