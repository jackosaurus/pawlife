# Pet Age / Birthday Indicator — Engineering Proposal

**Author:** Senior mobile engineer (UI-leaning)
**Status:** Design proposal — no code changes
**Replaces:** the `MetadataPill` rendering `calculateAge(...)` in `components/pets/StickyHeader.tsx`

## Context recap

Today, `StickyHeader.tsx` renders age as a flat pill: `"8 years, 1 month"`, sitting next to `"♂ Male"` and `"12.2 kg"`. It's clinical, terse, and treats the pet's age the same as their weight. The brief is to make this **warm, glanceable, and capable of celebrating the birthday moment** — without breaking card hierarchy or adding deps.

`calculateAge` already does years+months math from `pet.date_of_birth`. The DOB is a required field, so unknown-DOB cases collapse to a graceful default.

---

## Concept 1 — "Birthday-Aware Pill" (evolution, not revolution)

Keep the pill in place. Make it smart about proximity to the birthday and tonally warmer about young/senior pets.

```
Normal day                                Birthday eve (1 day out)
┌──────────────────────┐                  ┌────────────────────────────┐
│ 8 yrs · born 14 Mar  │                  │ 🎂 Birthday tomorrow        │
└──────────────────────┘                  └────────────────────────────┘

Birthday today                            Afterglow (1–3 days post)
┌──────────────────────────────┐          ┌────────────────────────────┐
│ 🎂 Happy 9th birthday, Milo! │          │ Just turned 9 · 14 Mar      │
└──────────────────────────────┘          └────────────────────────────┘

Puppy (<1yr)                              Senior (12+ "golden years")
┌──────────────────────┐                  ┌──────────────────────────────┐
│ 4 months · born Jan  │                  │ Golden years · 13 yrs        │
└──────────────────────┘                  └──────────────────────────────┘
```

**What it shows under each condition:**
- **Normal:** `{years} yrs · born {Mon}` — keeps date scent without being a calendar entry.
- **Birthday today:** swap to coral-tinted background, single cake emoji, `Happy {N}th birthday, {name}!`. One emoji is "warm," not "kid's app."
- **7-day countdown:** `🎂 Birthday in 5 days` (text only inside the pill — no animation).
- **Day before:** `🎂 Birthday tomorrow`.
- **3-day afterglow:** `Just turned 9 · 14 Mar`, soft amber tint that fades back to neutral on day 4.
- **Puppy (<1y):** `{months} months · born {Mon}` — months stay legible.
- **Senior (12+):** prefix `Golden years · {N} yrs`. Earned warmth, not a sticker.

**Implementation sketch:** Extract a new `useAgeMoment(dob)` hook that returns `{ phase: 'normal' | 'pre' | 'birthday' | 'afterglow' | 'puppy' | 'senior', label, daysToBirthday }`. All the date math goes there (and is unit-testable in isolation against `calculateAge`'s logic). A new `AgePill` component reads the moment and chooses a background tint (`bg-white` default, `bg-accent/15` on birthday, `bg-statusAmber/15` for afterglow). No animation, no extra deps. Phase changes only at midnight, so it's safe to compute once per render.

**Why it beats "8 years, 1 month":** it answers "how old?" in two characters fewer, AND it tells you when a moment is coming — same surface area, more emotional payload.

---

## Concept 2 — "Birthday Hero Banner" (repositioning argument)

Promote the age out of the metadata strip into a slim warm-tinted band that sits **between the avatar block and the metadata pills** — but only when there's something to say. On a normal day, it's invisible and the metadata strip absorbs the age pill. On a special day, the banner appears.

```
Normal day (no banner — age stays in pill row)
┌────────────────────────────────────────┐
│ [Avatar]  Milo                         │
│           Golden Retriever             │
│                                        │
│  ⌜ 8 yrs ⌝  ⌜ ♂ Male ⌝  ⌜ 12.2 kg ⌝   │
└────────────────────────────────────────┘

Birthday week (banner appears, soft coral)
┌────────────────────────────────────────┐
│ [Avatar]  Milo                         │
│           Golden Retriever             │
│ ╭──────────────────────────────────╮   │
│ │ 🎂  Milo turns 9 in 4 days       │   │
│ ╰──────────────────────────────────╯   │
│  ⌜ 8 yrs ⌝  ⌜ ♂ Male ⌝  ⌜ 12.2 kg ⌝   │
└────────────────────────────────────────┘

Birthday today (filled coral, primary text white)
┌────────────────────────────────────────┐
│ ╭──────────────────────────────────╮   │
│ │ 🎂  Happy 9th birthday, Milo!    │   │
│ ╰──────────────────────────────────╯   │
└────────────────────────────────────────┘
```

**What it shows under each condition:**
- **Normal day:** banner not rendered. Metadata pill keeps `8 yrs` (compact).
- **7 days out:** banner appears `Milo turns 9 in {N} days`.
- **Today:** banner becomes filled coral with white text, single cake emoji.
- **Afterglow (1–2 days post):** banner reads `Milo just turned 9 🎉` — tints back to soft. Day 3+ banner gone.
- **Puppy (<1y):** banner suppressed (the milestone arc is the first birthday — no premature celebration); pill shows `{months} months`.
- **Senior:** no banner change; first birthday after the 12yr threshold could read `Milo's 12th — golden years 🌿`. After that, normal handling.

**Implementation sketch:** Same `useAgeMoment` hook. New `BirthdayBanner` component renders `null` for `phase === 'normal' | 'puppy' | 'senior'` (unsupported phases). Banner is a `View` with `bg-accent` (or `bg-accent/15`) and `Colors.accent` text — no animation, no dep. Sticky header layout adds `<BirthdayBanner pet={pet} />` between the name row and pill row; it collapses cleanly when null. Pill row shrinks `age` label to just `8 yrs` so it remains useful on a normal day.

**Why it beats the current pill:** dedicates real estate to the moment that matters and stays out of the way the rest of the year — an explicit "one big thing" instead of three flat pills.

---

## Concept 3 — "Living Age Card" (info density bet)

Replace the age pill with a small, dedicated **age card** above the metadata strip. It shows age, DOB, and the next birthday as a unified tile — turning a fact into a tiny relationship object. Birthdays change the card's tint; otherwise it lives quietly.

```
Normal day                                Birthday today
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│ 8 yrs, 1 mo                      │      │ 9 today  🎂                       │
│ Born 14 Mar 2018 · turns 9 in    │      │ Happy birthday, Milo!             │
│ 47 days                          │      │ Born 14 Mar 2018                  │
└──────────────────────────────────┘      └──────────────────────────────────┘

Puppy (4 months)                          Senior
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│ 4 months                         │      │ 13 yrs · golden years             │
│ Born 12 Dec · first birthday in  │      │ Born 14 Mar 2013 · turns 14 in    │
│ 8 months                         │      │ 22 days                           │
└──────────────────────────────────┘      └──────────────────────────────────┘
```

**What it shows under each condition:**
- **Normal:** primary line `8 yrs, 1 mo` (the existing `calculateAge` output), secondary line `Born 14 Mar 2018 · turns 9 in 47 days`.
- **Birthday today:** primary line `9 today 🎂`, secondary line `Happy birthday, {name}!`, tertiary `Born 14 Mar 2018`. Soft coral background.
- **7-day countdown:** `turns 9 in 4 days` is already there year-round — no UI mode change needed at the 7-day mark, the secondary line just naturally reads as a countdown the closer you get. Cleaner.
- **Afterglow:** primary `9 yrs, 0 mo`, secondary `Just turned 9 — 14 Mar` for 3 days, then back to default `turns 10 in 362 days`.
- **Puppy:** primary stays in months, secondary becomes `first birthday in {N} months` — celebrates the first milestone explicitly.
- **Senior (12+):** primary line gets a `· golden years` suffix.

**Implementation sketch:** New `AgeCard` component using existing `Card` primitive. Uses `useAgeMoment(dob)` for phase + countdown. It sits in the sticky header before the metadata pills (which keep sex + weight only). Two-line layout maps to typography tokens: primary is `text-headline` (matches card-title rhythm), secondary is `text-footnote text-text-secondary`. No animation. Dynamic type works because the card grows vertically as text wraps — no fixed-height pill constraint.

**Why it beats the current pill:** a glance gives you age, DOB, and next milestone in one place — same answer as the pill plus context, without forcing the user to open the Profile tab to see DOB.

---

## My recommendation: **Concept 1 — Birthday-Aware Pill**

I'd ship Concept 1.

**Why:**
- It's the smallest change to the existing layout — no negotiation about hero space, no risk to the pet-name + breed hierarchy that's already correct. The `MetadataPill` row is already the right shelf for "facts about this pet." Concept 1 just makes one of those facts emotionally aware.
- The moments that matter (birthday day, week-of, afterglow) get visible distinct treatment without ever stealing a layout slot when nothing's happening — the pill stays the pill 358 days a year.
- Concept 3's "Living Age Card" is the most informative but adds real estate above-the-fold on every pet visit for info that's mostly redundant with the Profile tab's DOB row. We'd be paying screen real estate every day for a moment that lands six times a year.
- Concept 2's banner is tempting, but a conditional element that appears for ~10 days/year and disappears the rest of the time creates a "where did that go?" UX wobble. People miss things they only see occasionally.

**Tradeoffs I'm accepting:**
- Concept 1's pill text length grows on the birthday (`Happy 9th birthday, Milo!` is wider than `8 years, 1 month`). At 1.3x Dynamic Type with a long pet name (`Bartholomew`), the pill could push the row to wrap to two lines. Mitigation: birthday-day copy uses `name` only when `name.length <= 10`, otherwise falls back to `Happy 9th birthday! 🎂`. Tested at the typography clamp.
- We don't get the "DOB at-a-glance" win of Concept 3. Acceptable — DOB is one tap away in the Profile tab, and the pill's normal-day copy `8 yrs · born Mar` gets us 80% there.
- The senior framing (`Golden years`) is a small editorial choice — easy to A/B or remove if it doesn't land.

**Build cost:** one new hook (`useAgeMoment`), one new component (`AgePill`) replacing the `<MetadataPill label={age} />` call site, ~4 unit tests covering each phase boundary, plus a snapshot. Half a day of work including tests.
