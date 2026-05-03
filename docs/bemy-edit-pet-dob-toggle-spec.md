# Edit Pet — DOB Toggle Row Design Spec

**Scope:** A single visual fix on the Edit Pet screen (also present, identical, on Add Pet).
**File of interest:** `app/(main)/pets/[petId]/edit.tsx` (lines 517–534) and the mirror in `app/(main)/pets/add.tsx` (lines 305–322).
**Trigger:** Founder spotted the row on a real device after the Fraunces typography refresh bumped body type and tightened headlines; the "I don't know the exact date of birth" label and its `<Switch>` now collide.

---

## 1. Diagnosis

The Age Toggle row is a horizontal `flex-row items-center justify-between` with a long `text-body` label on the left ("I don't know the exact date of birth" — 36 characters) and a stock iOS `<Switch>` on the right. With nothing but `justify-between` separating them, the label expands to consume all available width up to the switch's left edge. After the recent type refresh — body copy is now 17/24 (`Typography.body`) and the line height is generous — the label runs to the very edge of the switch with **0pt of breathing room**, and on iPhone SE / mini widths the last word ("birth") sits visually pinned against the switch track. There is no `gap-*`, no padding, no minimum-width buffer, and no max-width on the label, so any future copy expansion (translation, copy edits) will make this worse. Root cause: bigger body type + zero explicit horizontal gap + no label width budget on a `justify-between` row.

---

## 2. Three Layout Variants

### Option A — Tighten the existing row

```
┌───────────────────────────────────────────────────────────┐
│  I don't know the exact date    ⟶ gap-3 ⟵    ◯━━━━●     │
│  of birth                                                 │
└───────────────────────────────────────────────────────────┘
```

Keep `flex-row` + `justify-between`. Add `gap-3` (12pt) explicitly, cap the label with `flex-1` so the switch always reserves its 51pt iOS width, and let the label wrap to two lines. Tighten label `leading-snug`.

**Pros:** Smallest diff. Preserves the established form-row rhythm. Matches how the medication "End date" toggle row is built.
**Cons:** Label still ugly when wrapped — "of birth" alone on line 2 reads like an orphan. Each language will wrap differently. Doesn't fix the underlying "label is too long" smell.
**Build cost:** Trivial — ~5 lines of JSX, both files (add + edit), 1 snapshot test update.

---

### Option B — Stack vertically

```
┌───────────────────────────────────────────────────────────┐
│  I don't know the exact date of birth                     │
│                                              ◯━━━━●       │
└───────────────────────────────────────────────────────────┘
```

Two rows: label on its own (full width, `text-body`), switch on a row below right-aligned. Or, more iOS-native: label left, switch right, but inside a vertical container with explicit `mb-2` separation from neighbours.

**Pros:** Label can grow / translate without ever colliding. Clear hierarchy. Familiar from iOS Settings rows that separate description from control.
**Cons:** Vertical real estate cost — adds ~28pt of height in an already tall form. Visually breaks the "label : control" parity established by the Sex segmented control row directly above it. Right-aligned switch on its own row reads awkwardly without an icon or chevron pairing.
**Build cost:** Low — ~10 lines of JSX, both files, snapshot updates.

---

### Option C — Reframe as an inline link below the date input

```
┌───────────────────────────────────────────────────────────┐
│  Date of Birth                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Tap to choose…                                      │ │
│  └─────────────────────────────────────────────────────┘ │
│  Don't know the exact date? Set as approximate           │
└───────────────────────────────────────────────────────────┘
```

Drop the toggle entirely. Show the DateInput by default. Beneath it, a `text-footnote` `text-primary` link reads "Don't know the exact date? Set as approximate." Tap → swap the DateInput out for an "Approximate age (months)" `TextInput` with a paired "Use exact date instead" link below.

**Pros:** Eliminates the cramped row. Most elegant from a UX standpoint — the affordance lives next to the field it modifies. Self-explaining; no separate label-and-switch ceremony. Robust to long translations because the link can wrap freely.
**Cons:** Biggest implementation cost — touches form layout, swap logic, both add + edit screens, plus matching tests for both states. Diverges from the Switch idiom used elsewhere in the app (medication end-date, settings notifications) so the pattern is no longer consistent. Loses the "boolean control" affordance — users who scan for a switch will miss it.
**Build cost:** Medium — ~30–40 lines moved + new link affordance + test updates. Two files.

---

## 3. Recommendation: **Option A** — tighten the existing row

Lock in Option A with one refinement: shorten the label copy to "I don't know their exact birthday" (33 chars, single line on iPhone SE at 17pt) and add `gap-3`. Justification:

1. **Breathing room delta:** 0pt → 12pt (+ shorter copy means label stays single-line on the narrowest device).
2. **Tap targets:** Switch already meets 51×31pt iOS spec; row stays ≥44pt.
3. **Parity:** Matches the Sex SegmentedControl row directly above and the medication End-date Switch elsewhere — single horizontal row, label left, control right.
4. **Build cost:** Minutes, not hours. Two files, one shared pattern.
5. **Future copy:** With `flex-1` + `gap-3` + `leading-snug` the label can wrap to two lines if a translator stretches it without ever touching the switch. The shorter English copy is a bonus, not a load-bearing dependency.

Option C is more elegant but disproportionate for a single-row crowding bug; revisit it the next time we redesign onboarding. Option B trades a horizontal problem for a vertical one and breaks row parity.

---

## 4. Detailed Visual Spec — Option A

### ASCII mockup at iPhone SE width (375pt — content area ~327pt after `px-6`)

```
┌──────────────────────────────────────────────────────────┐
│ Sex                                                      │
│ ┌──────────────┬──────────────┬──────────────┐          │
│ │   Male       │   Female     │   Unknown    │          │
│ └──────────────┴──────────────┴──────────────┘          │
│                                                          │
│ I don't know their exact birthday          ◯━━━━━●      │
│ ↑ text-body, text-text-secondary    ↑12pt gap   ↑Switch │
│                                                          │
│ Date of Birth                                            │
│ ┌──────────────────────────────────────────────────────┐│
│ │  3 May 2022                                          ││
│ └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Tokens

| Element | Token | Value |
|---|---|---|
| Row container | `flex-row items-center mb-4` | margin bottom 16pt |
| Gap between label and switch | `gap-3` | 12pt |
| Label width budget | `flex-1` | absorbs remainder, switch stays 51pt |
| Label type | `text-body text-text-secondary leading-snug` | 17/24 → tightened to ~22 line height |
| Label color | `Colors.textSecondary` (`#7A756E`) | unchanged |
| Switch track (on) | `Colors.primary` (`#4A2157`) | unchanged |
| Switch thumb / track (off) | iOS default | unchanged |

### Copy

- **From:** "I don't know the exact date of birth" (36 chars)
- **To:** "I don't know their exact birthday" (33 chars)

Reads warmer (uses "their", consistent with the rest of the app's pet-personal voice) and shaves 3 characters. Both add + edit screens use the same string.

### Tap targets

- Switch component: 51×31pt (iOS default) — meets HIG.
- Whole row is **not** tappable (deliberate — the switch is the affordance, label is descriptive). If we wanted row-level tap we would need a `Pressable` wrapping both; out of scope for this spec.

### State changes — what actually moves on toggle

| State | DOB input | Approximate age input |
|---|---|---|
| Off (`useApproxAge = false`) | Visible — `<DateInput>` with native picker | Hidden |
| On (`useApproxAge = true`) | Hidden | Visible — `<TextInput label="Approximate Age (months)" keyboardType="number-pad">` |

(Verified against the existing JSX at `edit.tsx:536–567` and `add.tsx:324–355` — this swap behaviour is already implemented; we are not changing it.)

When toggled on, `setValue('dateOfBirth', null)` fires; toggled off, `setValue('approximateAgeMonths', null)`. Unchanged.

### Accessibility

```
accessibilityRole="switch"
accessibilityLabel="I don't know their exact birthday"
accessibilityHint="When on, enter an approximate age in months instead of a date"
accessibilityState={{ checked: useApproxAge }}
```

(The native `<Switch>` already exposes `accessibilityRole="switch"` implicitly on iOS; we add the explicit label + hint for VoiceOver clarity since the label `<Text>` is sibling, not parent.)

### Edge cases

- **Long translations:** with `flex-1` + `gap-3` + `leading-snug`, the label wraps to a second line cleanly without crowding the switch. Tested mentally against German "Ich weiß nicht den genauen Geburtstag" (~42 chars).
- **Pet has neither DOB nor approximate age:** untouched — toggle defaults to off, DOB input visible and empty.
- **Pet had DOB, user toggles on, then toggles off:** form state is preserved by react-hook-form; behaviour unchanged from today.
- **Switch off → on while DOB has value:** `setValue('dateOfBirth', null)` clears the value (intentional — preserved from current code).

---

## 5. Engineering Hints

**Files touched (2):**
- `app/(main)/pets/[petId]/edit.tsx` — lines 518–520 (className + label copy).
- `app/(main)/pets/add.tsx` — lines 306–308 (same change, mirrored).

**Approximate diff size:** ~6 lines per file; one className change (`flex-row items-center justify-between` → `flex-row items-center gap-3`), one `<Text>` change (add `flex-1 leading-snug`, update copy).

**Tests required:**
- Update any existing snapshot test for the Add Pet / Edit Pet screen (re-run `npx jest -u` for those two files only after eyeballing the diff).
- Add an interaction test (if not already present): toggle on → assert `<DateInput>` is no longer rendered and `<TextInput label="Approximate Age (months)">` is. Toggle off → reverse.
- No new component tests required — we are not introducing a new component, only adjusting layout classes on an existing inline row.

**Out of scope:** The same tightening pattern probably wants to be audited on the Medication End-date toggle row (`medication/add.tsx:173`, `medication/[id]/edit.tsx:208`) and the Settings notification toggles (`settings/index.tsx:473`). Recommend a follow-up audit ticket; do not bundle into this fix.

---

## 6. Open Questions

1. **Copy lock-in.** Is "I don't know their exact birthday" acceptable, or does the founder prefer "Don't know their exact birthday" (29 chars, even shorter, but loses the conversational "I")? Both fit single-line on iPhone SE; either is fine — picking one needs a founder call.
2. **Row-level tap.** Should tapping the label area also flip the switch, or stay strictly switch-only? Today it is switch-only (consistent with Settings notification rows). Confirm we keep it that way; if not, this becomes a `<Pressable>` wrap and adds an `accessibilityRole="switch"` to the row container instead of the Switch.
