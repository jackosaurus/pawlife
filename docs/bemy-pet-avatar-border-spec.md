# Bemy — Pet Avatar Border Spec (Pet Detail Header)

A single visual change: a purple circular border around the pet's photo in
`StickyHeader` on the pet detail screen (`/(main)/pets/[petId]/index.tsx`),
sitting on the cream-yellow textured `pet-detail-header-bg.png` background.

This doc is read-only on code — the engineer agent picks it up and implements
against `components/ui/Avatar.tsx` and `components/pets/StickyHeader.tsx`.

---

## 1. Color — `Colors.primary` (`#4A2157`)

Use the saturated plum `Colors.primary` (`#4A2157`).

Reasoning:
- The cream-yellow header bg (`#FFF8E7` base + soft yellow waves) is low
  contrast and warm. The border is a small, decorative ring around an
  ~96pt circle — it's not a large slab, so the "saturated plum reads as a
  heavy slab" caveat in the design system (which gates `dustyPlum` for
  background blocks >~30% of the screen) does not apply here.
- `dustyPlum` (`#6B4577`) blends into the warm yellow; on the actual asset
  the plum needs to *frame* the photo, not whisper. We tested mentally: a
  thin ring at `dustyPlum` against `#FFF8E7` reads as a smudge, not a
  frame.
- Coral (`#E8806A`) was considered for warmth coherence with the bg, but
  coral is reserved for "delight" and "due-soon overdue" semantics in the
  design system (line 26 of `colors.ts`, plus the StatusPill semantics).
  Reusing it as a decorative frame muddies the meaning. Plum is the
  brand's anchor color (CTAs, FAB, links, illustrations) and is the
  correct choice for a brand-anchoring frame.
- The design system's "plum on warm-yellow passes WCAG AA" note (line 495
  of `bemy-design-system.md`) confirms the contrast is healthy.

**Locked: `Colors.primary` (`#4A2157`).**

---

## 2. Thickness — 3pt

The avatar at `size="lg"` is 96pt × 96pt (verified from
`components/ui/Avatar.tsx`, line 16: `lg: { container: 96, text: 36 }`).

- 1pt: too whisper, gets lost against the textured bg, defeats the "pops"
  goal.
- 2pt: visible but reads as a generic UI stroke, not a "framed portrait".
- **3pt: the right "framed" weight on a 96pt avatar.** It's ~3.1% of the
  avatar diameter — comparable to a matte frame on a passport photo. iOS
  HIG's "≥2pt for framed feel; 3pt+ for assertive" lands us at the assertive
  end deliberately, because the founder asked for the photo to *pop*.
- 4pt+: starts to feel cartoonish at 96pt and would dominate the warm-gray
  pills below.

For smaller avatar sizes (see §7), thickness scales down to keep the
3.1%-of-diameter ratio readable without going cartoony.

**Locked: 3pt at `lg` (96pt avatar).**

---

## 3. Border style — flat solid ring, no shadow

Solid plum stroke. No drop shadow, no inner shadow, no double ring.

Reasoning:
- The design system explicitly avoids heavy drop shadows
  (`bemy-design-system.md` line 180: "rely on the white-on-warm-yellow
  contrast and a 1px `Colors.border` outline. Avoid drop shadows that
  look heavy."). Adding a shadow ring here would break that pattern for
  one surface.
- A flat solid ring is also the cheapest to maintain: `borderColor` +
  `borderWidth` + `borderRadius` — works identically on iOS and Android,
  no `shadow*` cross-platform inconsistencies, no `elevation` Android
  workaround.
- The cream-yellow bg already provides visual separation; a shadow ring
  is redundant work for a marginal visual win.

**Locked: flat solid ring, no shadow.**

---

## 4. Inset / padding — touching the photo (cameo, no gap)

The plum border sits directly on the edge of the circular image. No white
ring, no padded matte gap.

Reasoning:
- "Cameo" tightness suits a small (96pt) avatar — a matted gap on a small
  circle eats interior pixels and shrinks the actual face/visible photo
  to ~88pt, which is too small to recognize the pet at a glance.
- A matted "outer ring + inner gap" treatment is more appropriate for
  larger hero avatars (think 160pt+ profile pages on Instagram). Bemy's
  hero avatar is intentionally compact because the header carries name +
  breed + three pills below — no room to inflate.
- Implementation simplicity: a single `borderWidth: 3` on the existing
  Image (or a single wrapping View with the same dimensions) — no nested
  rings.

**Locked: touching (cameo style), 0pt inner gap.**

---

## 5. Implementation surface — option (a), new `bordered` prop on `Avatar.tsx`

Add a prop to `Avatar.tsx`:

```ts
interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  petType?: 'dog' | 'cat';
  bordered?: boolean;            // new — defaults to false
}
```

When `bordered` is true, apply `borderColor: Colors.primary` and a
size-scaled `borderWidth` (see §7) on both the Image branch and the
initials-fallback View branch.

Why (a) over (b):
- The bordered avatar will likely show up on at least 2-3 surfaces over
  the next few units: the dashboard `PetCard` hero (when single-pet
  households want their pet's photo to feel personal), settings → pet
  list rows, and any future "About this pet" / family-sharing profile
  card. Codifying the treatment now prevents drift (one surface using
  3pt, another using 2pt, another using `dustyPlum`) and gives a single
  place to retune later.
- It's also the cheaper change: one line in `StickyHeader.tsx`
  (`bordered`) vs. wrapping the Avatar in a styled View that has to
  duplicate the `borderRadius` math.
- The prop is a boolean (not `'subtle' | 'framed'`) because we have
  exactly one defined treatment today. If a second variant emerges, we
  promote to a string union then — YAGNI for now.

**Locked: option (a). New `bordered?: boolean` prop on `Avatar.tsx`,
defaults to `false`. `StickyHeader.tsx` passes `bordered`.**

Border-width scale (applied inside `Avatar.tsx` when `bordered` is true):

| size | container | borderWidth |
|------|-----------|-------------|
| sm   | 40pt      | 1.5pt       |
| md   | 64pt      | 2pt         |
| lg   | 96pt      | 3pt         |

Ratios: ~3.75% / 3.1% / 3.1% of diameter — visually consistent.

---

## 6. Visual mockup

Before (current — plain photo on cream-yellow bg):

```
╔══════════════════════════════════════════╗  ← cream-yellow textured bg
║  ←                                       ║     (yellow waves + sparkles)
║                                          ║
║   ╭─────╮                                ║
║   │ 🐶  │   Maxie                        ║
║   ╰─────╯   Border Collie                ║
║                                          ║
║   [🎂 5 yrs]  [♂ Male]   [12 kg]         ║
║                                          ║
╚══════════════════════════════════════════╝
```

After (3pt plum ring, cameo, no gap):

```
╔══════════════════════════════════════════╗  ← cream-yellow textured bg
║  ←                                       ║
║                                          ║
║  ╭═════╮                                 ║   ═ = 3pt Colors.primary ring
║  ║ 🐶  ║    Maxie                        ║      directly on photo edge
║  ╰═════╯    Border Collie                ║
║                                          ║
║   [🎂 5 yrs]  [♂ Male]   [12 kg]         ║
║                                          ║
╚══════════════════════════════════════════╝
```

The ring is the only chrome on the avatar — no gap, no shadow, no double
stroke. Reads as a small framed portrait against the warm bg.

---

## 7. Edge cases

### Initials-fallback path (no photo)

`Avatar.tsx` line 42-57: when there's no `uri` (or it failed to load), the
component renders a plum-filled circle with a white initial. If we apply
the same plum border to this branch, the border merges into the fill — the
ring becomes invisible.

**Decision:** when `bordered` is true *and* the fallback branch renders,
swap the fallback fill from `Colors.primary` to `Colors.dustyPlum`
(`#6B4577`) so the plum border still reads as a distinct ring around a
softer plum disc. The white initial still passes contrast on dustyPlum.

Rationale: the alternative (dropping the border on the fallback path) is
inconsistent — a pet with a photo has a frame, the same pet without a
photo has none. Visual consistency wins; the slight color shift on the
fallback is invisible to anyone who's set a real photo (which is most
users by the time they reach the pet detail screen). This only kicks in
when `bordered` is true; the dashboard fallback (no border) keeps using
saturated `Colors.primary` as today.

### Smaller avatar sizes elsewhere

Today only `lg` is used in `StickyHeader`. `PetCard` on the dashboard uses
`md`; settings rows use `sm`. If those surfaces opt into `bordered` later,
the table in §5 keeps the ring readable without going cartoony. **No
change needed today** — the spec just defines the scale up front so the
next surface adopting `bordered` doesn't relitigate it.

### Image loading state

`expo-image` has a brief load period where the Image is empty. The border
sits on the View/Image style, so it'll be visible even before the photo
paints. That's the correct behavior — the frame is part of the chrome,
not part of the photo.

---

## 8. Deferrability check

Right answer for v1. Revisit if:

- **Dark mode lands.** Plum on a dark surface needs to be retested; we may
  swap to a lighter plum tint or to brand yellow for contrast. Bemy is
  light-mode-only today (no dark mode in `bemy-design-system.md`), so
  this is a future-state hook only.
- **Family sharing profile cards.** When multiple humans see the same
  pet, we may want a "primary owner" affordance — could become a second
  `bordered` variant (e.g. `bordered="owner"` with a thicker ring). At
  that point the boolean promotes to a string union. Not before.
- **Accessibility audit flags the border-only fallback differentiation.**
  The dustyPlum fallback (§7) relies on a hue shift, not a separate
  affordance. If a colorblind user can't distinguish dustyPlum from
  primary, the ring is the only cue — that's still fine because the ring
  is a 3pt geometric difference, not a color difference. Flagging here
  for awareness only.
- **Photo crops feel "tight" after release.** If founder feedback is the
  ring eats too close to the pet's face, swap to a 2pt inner-white
  matte gap (§4). That's a one-line change inside `Avatar.tsx`.

---

## Summary — locked decisions

| # | Decision    | Value                                                          |
|---|-------------|----------------------------------------------------------------|
| 1 | Color       | `Colors.primary` (`#4A2157`)                                   |
| 2 | Thickness   | 3pt at `lg`; 2pt at `md`; 1.5pt at `sm`                        |
| 3 | Style       | Flat solid ring. No shadow.                                    |
| 4 | Inset       | Cameo — touching the photo, 0pt gap.                           |
| 5 | Surface     | New `bordered?: boolean` prop on `Avatar.tsx`. Default `false`.|
| 6 | Mockup      | Plum ring directly on the 96pt circular photo (see §6).        |
| 7 | Fallback    | Swap fill to `Colors.dustyPlum` when `bordered && !uri`.       |
