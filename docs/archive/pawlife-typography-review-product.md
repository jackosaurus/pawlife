# Pawlife Typography Review — Product / Journey / IA Lens

> Reviewer: senior product designer (product/journey/IA perspective). Parallel UI craft review is happening separately. This doc takes a stance on **what the user's eye should be drawn to** and whether typography is doing that work, screen by screen.

Screens reviewed (2026-04-27):

1. Pet detail — Beau, Medicines tab
2. Dashboard — "Your Pet Family" with three pets and Needs-Attention summary
3. Dashboard with profile bottom sheet (Settings / Pet Family / Send Feedback / Sign Out)
4. Pet Family management

---

## 1. Executive verdict

The hierarchy is **flat where it should be punchy, and ornate where it should be quiet.** Pet names — the genuine emotional anchor of the product — are sized like list-row titles (`text-headline`, 17pt semibold) on every screen, while uppercase eyebrows ("BEAU", "REMY", "FAMILY", "PETS") and tabs are competing for the same visual register. The dashboard's most action-relevant element — the "3 ITEMS NEED ATTENTION" pill — is the smallest, lightest piece of type on the screen. The pet detail screen is the only screen that gets identity-as-hero right (Beau's name in display weight). Crucially, the same information type ("Cocker Spaniel" species) renders at three different visual weights across three screens. The result is a deck of screens that each individually look fine but, scrolled in sequence, read as four different apps. The fix is **not** more typography tokens — Phase 1 already added them. The fix is **commitment to one hierarchy of meaning**, ruthlessly applied: pet identity is always largest, action affordances are always plum (or coral when overdue), and section eyebrows either earn their tracking-out treatment or get deleted.

---

## 2. Per-screen analysis

### Screen 1 — Pet Detail / Medicines tab (Beau)

**User's primary job-to-be-done:** "Quickly check whether my dog's meds are on track today, and log a dose if one is due."

**What the eye lands on first:** Beau's name + face. Correct.
**Where it should go second:** the amber `0/1 Due soon` indicator on the Ear infection medication card, paired with the `Log Dose` button. Currently it goes second to the *tabs* (Profile / Medicines / Vaccinations / Food), which are the heaviest non-name type on the screen.

**Hierarchy/voice mismatches:**

- **Tabs are too heavy.** "Medicines" active-state semibold + underline pulls the eye away from the actionable card below. Tabs are navigation furniture, not content.
- **"Add medication" CTA is heavier than "Log Dose."** The Add card is a full-bleed pill with a `+` icon and `text-headline` weight; the Log Dose pill is small `button-sm`. But Log Dose is the **dominant daily action** — Add medication is occasional. The CTA hierarchy is inverted relative to frequency of use.
- **`0/1` and "Due soon"** are tiny relative to their importance. This is the entire reason the user opened this tab.
- **"Cytopoint" and "Ear infection medication"** read at the same weight, but only one of them needs action. The card needs a way for the eye to skip past the "all good" ones.

**Three concrete moves:**

1. **Demote tabs.** Drop tab labels to `callout` / 16pt regular (active still semibold) and remove the underline accent in favor of a thin plum bottom rule only on the active tab. Tabs are wayfinding, not content.
2. **Promote the dose-status block.** Status fraction (`0/1`) at `text-headline` weight, "Due soon" at `text-footnote` warm-gray underneath. The fraction is the headline number; the words are caption.
3. **Demote "Add medication."** It should not be a full card — it belongs as a footer link or a `+` in the section header, the same way `RecordCard` lists treat "See all". Today it's stealing focus from the cards that are the actual job.

---

### Screen 2 — Dashboard ("Your Pet Family")

**User's primary job-to-be-done:** "Glance at the family, see if anything needs me today, and tap into a pet (or log a dose) in one move."

**What the eye lands on first:** The illustrated pet duo at the top, then "Your Pet Family." Pleasant — but emotionally reassuring, not informationally useful.
**Where it should go second:** "3 ITEMS NEED ATTENTION." Currently, this is a small uppercase pill in caption weight with a coral dot — easy to miss. The eye instead drifts to the largest pet card (Beau), then to the second one (Remy).

**Hierarchy/voice mismatches:**

- **The needs-attention pill is the most action-bearing element on the screen and the smallest piece of type.** This is the single biggest hierarchy bug in the app. Everything else on this screen is descriptive; this pill is *prescriptive*. It should be the loudest item.
- **"BEAU" and "REMY" eyebrows above the inline action rows are vestigial.** The pet's photo + name appears directly above the action row in the same card group. The uppercase repeat ("Beau" then "BEAU") feels like a CMS limitation leaking into the UI.
- **"Cocker Spaniel" is at body weight (17pt regular).** Compare to Screen 4 where the same species text reads as `text-footnote` warm gray. Same information, inconsistent visual weight.
- **"Log" links are ambiguous as actions.** They're plum and right-aligned, but at body size with no underline, no chevron, no pill. Quiet enough that on a busy screen they read as metadata, not buttons.

**Three concrete moves:**

1. **Make "3 items need attention" a real headline.** Move it out of the caption pill into a `text-headline` (or even `text-title`) line above the pet list, with the coral dot promoted to a small status indicator. Something like:

   ```
   3 things to check today
   Beau · Remy
   ```

   That is the **headline of the screen**. Right now it's furniture.

2. **Kill the BEAU / REMY eyebrows on the dashboard.** They duplicate the pet card immediately above. The action row is visually adjacent — it doesn't need a label. If grouping is needed, lean on whitespace and a faint divider, not on more type.

3. **Make "Log" unmistakably an action.** Treat it the same as Log Dose on the medication card: small plum pill (`button-sm`, semibold, plum text on faint plum-tinted fill). Action affordance is more important than horizontal density.

---

### Screen 3 — Dashboard with profile bottom sheet

**User's primary job-to-be-done:** "Get to settings, family, feedback, or sign out."

**What the eye lands on first:** "Jack" + email. Fine — confirms identity.
**Where it should go second:** the menu rows. Correct, they read top-down.

This screen is the cleanest of the four. The hierarchy actually works: name (headline), email (footnote, secondary), divider, list of `MenuRow`s with consistent weight, "Sign Out" in coral as the visually distinct sign-off action.

**One mismatch worth flagging:**

- **"Sign Out" rendered in coral reads like a destructive action.** The design system explicitly says Sign Out is **not destructive** and should be ghost text in `Colors.textPrimary`. Coral is reserved for brand warmth and overdue status. This is a token misapplication, not a hierarchy problem — but it teaches the user that coral = "be careful," which we don't want to dilute.

**Move:** Sign Out → `text-text-primary`, regular weight. Save coral for overdue.

---

### Screen 4 — Pet Family management

**User's primary job-to-be-done:** "See who's in my family, manage members and invites, and jump to a pet."

**What the eye lands on first:** "Pet Family" header. Correct.
**Where it should go second:** the family-member list (or the Invite Member button if I'm here to add someone). Currently the eye drops to "My human family11" (the family name, in `text-headline`), then walks down the member list. The Invite Member button — an outlined plum pill — sits below the list and is moderately visible but not magnetic.

**Hierarchy/voice mismatches:**

- **"My human family11" is louder than the member names.** The family display name is shown at headline weight with member names also at headline weight underneath — same visual register, no clear "this is the container, these are the items."
- **"FAMILY" and "PETS" eyebrows are doing real wayfinding work here** (unlike on the dashboard) — they separate two distinct data types in one scroll. They're load-bearing. But they're rendered at `caption` 12pt, which is too quiet for sections that are essentially full screens collapsed. They're earning their keep but underweighted.
- **"Joined 1 month ago" / "Member · Joined 1 month ago"** — the `· ` separator runs role and tenure together at footnote weight. Role ("Admin", "Member") is meaningful for permissions; tenure is decorative. They shouldn't be peers.
- **Invite code "B3UY-BHQB"** is rendered at body weight in a tinted block. It's actually one of the most copy/share-relevant strings on the screen and deserves either monospace treatment or a "Copy" affordance. Today it reads like metadata.
- **Pet rows show breed at `text-footnote` warm gray** — directly contradicting the dashboard, where breed renders at `text-body`. Same data, different weight, different screen.

**Three concrete moves:**

1. **Promote section eyebrows on this screen** (FAMILY / PETS) to `caption` semibold with more letter-spacing AND a thin divider rule above. They're the spine of the screen; let them feel structural.
2. **Differentiate role from tenure.** Role at `text-footnote` warm-gray as a small pill or pill-adjacent label; tenure ("Joined 1 month ago") drops to a fainter weight or moves to a hover/detail context. Permissions deserve more clarity than "joined 4 weeks ago."
3. **Treat the invite code as a primary asset.** Bump to `text-title` or `text-headline` in monospace, with a copy icon adjacent. The user is here *because* of this string.

---

## 3. Cross-screen consistency map

| Information type | Where it appears | Current visual weight | Proposed weight | Rationale |
|---|---|---|---|---|
| Pet name (in identity hero) | Pet detail header | `display` (30/36 reg) | `display` (keep) | Working. Identity is the anchor. |
| Pet name (in list row) | Dashboard, Pet Family | `headline` (17/22 semi) | `title` (22/28 reg) on dashboard pet cards; keep `headline` on Pet Family list rows | On dashboard, pets ARE the screen — they earn title weight. On Family screen, they're navigation fodder. |
| Pet species / breed | Dashboard, Pet Family, Pet detail | `body` (17 reg) on dashboard; `footnote` (13 reg) on Family; metadata pill on detail | `footnote` warm-gray everywhere, OR a `MetadataPill` everywhere | One species, one weight. Pick the lower (footnote) — it's secondary to name. |
| Section eyebrow (BEAU, FAMILY, PETS) | Dashboard, Pet Family | `caption` 12pt regular uppercase | Vestigial on dashboard → DELETE. Load-bearing on Pet Family → `caption` semibold + thin divider | Rule: an eyebrow either earns weight or earns deletion. No middle ground. |
| Tab labels | Pet detail | `headline` semibold (active), regular (inactive) | `callout` (16pt) regular / semibold-active | Tabs are wayfinding, not content. They're stealing focus from cards. |
| Primary action (Log Dose, Invite Member) | Pet detail med card, Pet Family | `button-sm` (15 semi) plum on tinted fill (Log Dose); outlined plum button (Invite) | Keep — extend to dashboard `Log` link | Inconsistency today: Log Dose is a pill, Log on dashboard is plain text. Same action, same treatment. |
| Status fraction (0/1, 1/2) | Pet detail med card | `footnote` (13 reg) coral | `headline` (17 semi) coral | This IS the headline of the card when amber/red. It's currently sized as a label. |
| Status word ("Due soon", "Given 17h ago") | Pet detail med card | `footnote` warm gray | `caption` warm gray | Caption treatment under the headline-weight fraction. |
| Needs-attention banner | Dashboard | `caption` (12 reg) inside a small pill | `headline` or `title` headline above the pet list | The single largest hierarchy miss in the app. |
| Email / handle | Profile sheet | `footnote` warm gray | Keep | Working. |
| Invite code | Pet Family | `body` regular in tinted block | `title` monospace + copy affordance | Highest-value string on this screen; treat it like one. |
| Sign Out | Profile sheet | coral text | `textPrimary` ghost | Sign Out is not destructive (per design system). Coral here teaches the wrong association. |
| Date column (15 / JAN / 2026) | Record cards | `display` / `caption` / `caption` | Keep | Working. Distinctive, scannable, doesn't compete with title. |

---

## 4. Voice alignment notes

The app's stated voice is **"warm pet family, not clinical."** Three places typography is fighting this:

1. **Tightly tracked uppercase eyebrows everywhere.** "BEAU", "REMY", "FAMILY", "PETS" — uppercase + tracked-out is a *form* convention. It reads as ledger, not letter. Either reserve uppercase for genuine structural section labels (Pet Family screen, "TIMELINE" on detail screens) and remove it from the inline dashboard groupings — or keep uppercase but warm it up: small caps with reduced tracking, or sentence-case with a leading bullet/dot in plum. Right now uppercase is overused, which makes the screens feel form-y.

2. **17pt semibold tabs.** Tab labels weighted as if they're content makes the chrome feel heavy. Premium consumer apps (Things, Notion) use lighter, smaller tab labels. Drop weight; warmth follows.

3. **The pet metadata pill row** (`8 years, 1 month` / `Male` / `12.2 kg`) on the pet detail header. The pills are working hard but read like **a vehicle registration card**. Clinical. The fix is either (a) drop the borders so they feel like labels not chips, or (b) integrate into the line below the name as warm-gray sentence-case text: "Cocker Spaniel · 8 yrs · 12.2 kg." Pills are clinical when they list facts; copy is warm when it tells you about the dog. This is a UI craft call too, but worth flagging from the product side — pills here are over-engineered for the data they hold.

**Where typography is on-voice and should not be touched:**

- The display-weight pet name on the detail screen is exactly the right register: it's a *name*, not a *title*. Light weight, generous size, plenty of air around it.
- The microcopy in profile sheet ("sam@example.com" in warm gray under "Sam") — quiet, intimate, correct.
- The empty illustration of the dog + cat at the dashboard top is doing emotional work that no amount of typography can do. Keep.

---

## 5. Recommendations to the UI designer (parallel scale work)

1. **Don't go below 13pt for any user-readable text. Stay above it for anything action-bearing.** Pawlife is a warm consumer app, not a medical chart or a dense ops tool. The temptation when you're rationalizing a scale is to compress small sizes (11/12/13). Resist. Caption is for uppercase labels and date-column months; everything a person reads as a sentence stays at footnote (13) or above.

2. **Plan for *exactly one* headline-weight thing per card.** Right now multiple cards (medication card, pet card with inline action) have two equally-weighted headlines. The scale needs to provide an unambiguous hierarchy *within* a card: one title, optional body, optional caption — never two competing titles.

3. **Status numerics are headlines, not metadata.** When you finalize the scale, expose a token for "numeric status" that's headline-weight in a status color. Today designers are reaching for `footnote` because the numeric is small, but small status numerics are exactly what fail on a glance.

4. **Eyebrow labels need a stance: structural or removed.** Don't ship a scale that makes uppercase eyebrows decorative. If they're in the scale, they're 12pt semibold with letter-spacing and a thin divider rule pattern paired with them. If we don't want that level of structure, drop them from the system entirely. **No middle.**

5. **Action affordances need a single visual treatment.** Log Dose, Log, Invite Member, Add Medication are all the same type of element: "click to do a thing." They don't all need the same shape — but they need to share a semantic weight class so the eye learns "plum + semibold = action." Today some are pills, some are text, some are full cards.

6. **Resist scale proliferation.** Phase 1's eight tokens (display, title, headline, body, callout, footnote, caption, button-sm) is already plenty. Don't add `subheadline`, `caption-2`, `headline-bold`, etc. Force ambiguity to be resolved by hierarchy + color + position, not by a new size. The product feels fragmented right now because tokens aren't applied — not because there aren't enough of them.

7. **Numeric clamp at 1.3 is correct — keep.** Don't be tempted to relax this for accessibility scoring. The fixed-width pills (date column, status fraction, log-dose pill) will burst at higher multipliers. We've already made the call that AX1+ users get *some* scaling, not unlimited.

---

## 6. What to NOT touch

- **Pet detail identity hero on Beau's screen.** Display-weight name + circle photo + pill row. Working. Don't reweight, don't reorganize. (UI designer can soften the pill borders if desired — see voice note.)
- **Date-left column on record cards.** The `display` day / `caption` month / `caption` year stack is one of the strongest pieces of design in the app. It's distinctive, scannable, doesn't compete with the title. Keep verbatim.
- **Profile bottom sheet's `MenuRow` list.** Type hierarchy here is correct: name headline, email footnote, divider, menu rows at body weight, chevrons. Don't touch except for the Sign Out coral → textPrimary fix.
- **The "TIMELINE" / "OPTIONAL" caption section labels on form/detail screens** (not visible in these four screenshots but referenced in the design system). They're load-bearing and rendered correctly. Keep that pattern.
- **The illustrations** (welcome-hero, empty-state pets). These are doing emotional anchoring that typography can't replicate. The UI designer should not propose typographic moves that compete with them.

---

## Summary — single biggest issue

**The dashboard's "3 ITEMS NEED ATTENTION" pill is the highest-value piece of information in the entire app — it's the answer to "what does my pet need from me today?" — and it's rendered at the smallest, lightest text register on its screen.** That single inversion tells you the typographic hierarchy is tracking visual tradition (greeting, hero, list) rather than the user's actual job (find the thing that needs me, act on it, leave). Promote it to a real headline. Everything else on the screen can quiet down by half a step in service of that one move.

Cross-screen consistency: **the same pet's species ("Cocker Spaniel") reads at three different visual weights across dashboard, pet detail, and Pet Family.** That's the inconsistency that bothers me most because it's the cheapest to fix and the most diagnostic of "tokens exist but aren't being applied." Pick one weight (footnote warm-gray) for species everywhere. Done.

Guidance to the UI designer they're most likely to over-engineer past: **don't add more tokens.** The instinct when a scale feels fragmented is to add intermediate sizes (`subheadline`, `headline-bold`, `caption-2`). The fragmentation here isn't from a missing size — it's from the existing eight tokens not being applied. Migrate the rest of the app onto the Phase 1 tokens before adding a single new one. If after full migration you still feel something is missing, *then* propose. Probably you won't.
