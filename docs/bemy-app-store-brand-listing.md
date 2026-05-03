# Bemy — App Store Listing Copy & Brand-Story Spine

**Surface:** App Store Connect listing fields for Bemy v1 (iOS, Australia primary storefront).
**Author:** Indie branding lead draft, May 2026.
**Status:** Draft for founder review. Voice anchored on `docs/bemy-about-page-copy.md` and `docs/bemy-design-system.md` §Voice & Tone. Founder name "Jack" + country "Australia" appear in public copy; legal entity "Beebles" + `beeble.ptyltd@gmail.com` are reserved for Apple-only fields per `feedback_pii_auto_injection.md`.
**Marketing strategy doc:** Not yet landed at write time. Copy below is positioning-agnostic and works for either an "indie / made by hand" angle or a "calm, quiet alternative to bloated pet apps" angle. Marketing lead can pick.

Character counts in this doc were measured with `len()` against the literal string (Apple counts every character including spaces and punctuation).

---

## 0. Brand-story spine

Every piece of copy below ladders up to this paragraph. If a candidate doesn't sound like it came from this voice, it loses.

> **Bemy is a small app made by one person in Australia for two dogs called Beau and Remy. The name is just their names mashed together. He built it to keep track of their medications, vaccinations, weight, food, and the small daily things that go wrong with pets you love. There are no ads, no data sales, and no AI promises. It's just a careful, gentle place to write things down.**

(71 words. Use as the rosetta stone for any future App Store, press, or website copy.)

---

## 1. App Store Name (max 30 chars)

**Recommendation:** `Bemy` (4 chars)

| Candidate | Chars | Notes |
|---|---|---|
| **Bemy** | 4 | Clean, memorable, matches the home-screen name. The brand story does the lifting; the name doesn't need to explain itself. |
| Bemy: Pet Family | 16 | Adds search context but reads agency-y. "Pet Family" is also already in the subtitle; double-counting is wasteful. |
| Bemy — Pet Family | 17 | Em-dash version of above. Same problem. |
| Bemy — Pet Care | 15 | Generic. Loses the brand. |
| Bemy: Pet Records | 17 | Less generic, but again duplicates subtitle words. |
| Bemy — Pet Family Care | 22 | Tries too hard. |

**Why `Bemy`:** the name is the strongest brand asset Bemy has — a four-letter word that is half a story already (`Be`au + `Re`my). Padding it dilutes that. Apple indexes the subtitle and keywords for search, so we don't need ASO weight on the name. The home-screen icon name is also `Bemy`; matching them keeps the experience consistent from search → install → first launch.

---

## 2. Subtitle (max 30 chars)

**Recommendation:** `Pet records, gently kept` (24 chars)

| # | Candidate | Chars | Voice fit | Notes |
|---|---|---|---|---|
| 1 | **Pet records, gently kept** | **24** | **Strong** | **Pick.** "Gently" is the brand voice in one word. "Records" tells the user what the app actually does (read/write records), not a vague aspiration. Comma gives it a thoughtful-email rhythm rather than a slogan rhythm. |
| 2 | A gentle home for pet records | 29 | Strong | Close runner-up. "Home" is warm. Slightly long; "gently kept" version is tighter. |
| 3 | Care notes for your pet family | 30 | Good | "Pet family" is on-brand (design-system voice rule #1). "Care notes" downplays the medical seriousness, which is a feature, not a bug. Right at the limit. |
| 4 | A careful home for pet records | 30 | Good | "Careful" hits the brand promise but reads slightly clinical. |
| 5 | Pet records and gentle reminders | 32 | Over | Too long. |
| 6 | Pet care for your pet family | 28 | Weak | Repeats "pet" twice. Generic. |
| 7 | A small home for big pet care | 29 | Weak | Cute, but "big pet care" sounds like it might mean Saint Bernards. |
| 8 | For the dogs (and cats) you love | 32 | Over | Charming but over the limit, and the parenthetical reads as an afterthought that excludes cat owners psychologically. |

**Why `Pet records, gently kept`:**

- ≤ 30 chars (24, comfortable margin so localisation doesn't burst it).
- Concrete: "records" tells you what to expect inside the app.
- "Gently" carries the brand voice — it's the single word most distant from every other pet app on the search results page. Search results dominated by "Track every detail," "Complete pet care," "All-in-one pet manager." We don't compete on completeness; we compete on warmth.
- Reads as prose, not a slogan. Matches the about-page voice.
- Plays well with the description, which opens with "Bemy is a small app I built for my own two dogs."

---

## 3. Keywords (max 100 chars, comma-separated, no spaces)

**Recommendation:**

```
vet,vaccine,medication,reminder,allergy,weight,food,health,tracker,journal,puppy,kitten,dog,cat,care
```

**100 chars exactly.** No wasted whitespace.

**Justification:**

- **Excluded from name/subtitle:** Apple already indexes `Bemy`, `Pet`, `records`, `gently`, `kept`. We don't repeat those words; that's why "pet" and "records" are absent from the keyword string.
- **Singulars over plurals:** Apple's search engine has stemmed plurals for years (`dog` matches `dogs`). One token covers both. Same for `vaccine`/`vaccines`, `medication`/`medications`, `tracker`/`tracking`.
- **Specific record types over generic adjectives:** `vaccine`, `medication`, `weight`, `allergy`, `food` are the exact searches a pet owner with a problem types in. `tracker` and `journal` cover the broader "I want to log things" intent.
- **`puppy` + `kitten`** are high-volume queries from new pet owners — a strong onboarding-moment match.
- **`care` and `health`** are broad anchors; lower precision but high volume in pet-app search.
- **Excluded:** `beau`, `remy`, `indie`, `family`. `Beau`/`Remy` are personal brand stories, not search terms anyone would type for a pet app — no ASO value, and they'll surface naturally via the description anyway. `indie` doesn't drive pet-app search. `family` would be a candidate but Apple weights subtitle higher and "Pet Family" appears in the about-page voice; if marketing later picks a "Pet Family" subtitle we can swap `family` in.

**Alternate (if subtitle later drops "records"):** swap `tracker` → `records`. Keep total ≤ 100.

---

## 4. Promotional Text (max 170 chars, updatable without a new build)

**Recommendation (launch):**

> **A small, careful app for keeping your pet family's records in one place. Built by one person in Australia for two dogs called Beau and Remy.** *(140 chars)*

**Alternate (if marketing wants a launch-moment angle):**

> Out today. A small, gentle home for your pet family's records — vaccinations, medications, weight, food, vet visits — all in one calm place. *(140 chars)*

**Why the first one:** promotional text sits above the description and is the first thing a curious-but-undecided user reads. The "built by one person in Australia for two dogs called Beau and Remy" half-sentence is the strongest single trust signal Bemy has. It's verifiable, specific, and hard to fake. The alternate is fine but trades that trust signal for a feature list — keep the alternate in reserve for a later refresh (e.g. when Phase 2 pushes shareable profiles, swap to a feature-led promo).

Both fit comfortably under 170. Leave headroom for localisation.

---

## 5. Description (max 4000 chars)

**Recommendation: 1815 chars** (within the 1500–2500 sweet spot; not padded with filler).

```
Bemy is a small app I built for my own two dogs, Beau and Remy. The name is just their names mashed together: Beau + Remy = Bemy.

Beau is a cocker spaniel-poodle who's allergic to grass and to lamb. He's on ear drops every couple of months and goes in for allergy shots a few times a year. Remy is a bordoodle who's in love with every ball he's ever met. Between the two of them, I kept losing track of small things — when the next allergy shot was due, what dose Beau was on, whether Remy's last weight check was three months ago or six. So I built one place to put all of it.

What it does
- Keep a profile for each pet in your family — dog or cat — with photo, breed, birthday, microchip, and the rest.
- Track vaccinations with next-due dates, and get a gentle reminder before they lapse.
- Track medications with frequency, dosage, start and end dates, and a Log Dose button on every active med.
- Record vet visits, weight check-ins, allergies, and food changes over time.
- Hold it all in one calm, readable place you can hand to a vet or a pet sitter.

What it doesn't do
- No ads. No data sales. No AI miracle promises. No social feed.
- It's not a substitute for actual vet advice. If something feels wrong with your pet, please call your vet, not your phone.

You'll probably like Bemy if you've ever lost a sticky note with a dosing schedule on it, or stood at the vet's counter trying to remember when the last booster was. It's built for the kind of person who wants their pet's records somewhere quiet and tidy, not on a platform trying to sell them food.

I read every piece of feedback that comes in. If something's confusing or missing, tap Send Feedback in the menu and tell me — I'll fix the wording, or build the field, or write back.

— Jack, in Australia, with two dogs called Beau and Remy.
```

**Structure rationale:**

- **Opening (2 paragraphs):** brand story, told via the dogs. Mirrors the About-page voice exactly. Dropping the etymology (`Beau + Remy = Bemy`) on line 1 makes the rest of the listing make sense.
- **What it does (5 lines):** prose-style "bullets" using en-dashes; Apple's renderer makes hyphen-bullets look acceptable but not great, so the sentences are short on purpose. Each line names a specific feature from the v1 build (`bemy-roadmap.md` MVP scope) — vaccinations with next-due dates, medications with Log Dose button, vet visits, weight, food changes.
  - Pet Profiles ✓ (dog or cat, photo, breed, birthday, microchip)
  - Vaccinations CRUD with reminders ✓
  - Medications CRUD with Log Dose ✓
  - Vet Visits ✓ (note: hidden in Unit 6 from UI but the description treats them as a feature; the in-app surface for vet visits is via the Health Records list — this is a known forthcoming surface; revisit if vet visits stay UI-hidden at launch)
  - Weight ✓
  - Food ✓
- **What it doesn't do:** a deliberate counter-list. "No ads, no data sales, no AI promises, no social feed" is the same posture as the privacy policy ("plain English by intent") and the about page ("not a venture-backed startup, a vet on demand, or a substitute for actual medical advice"). This is on-brand and a competitive moat.
- **Who it's for:** indirect, via failure modes (`lost a sticky note`, `stood at the vet's counter trying to remember`). Per the brief, never use "for pet owners."
- **Closing:** Send Feedback invitation + the about-page-style sign-off ("Jack, in Australia, with two dogs called Beau and Remy"). Reinforces founder-voice.

**First-person singular throughout.** No "we" or "the team."

**One open question:** the description says "Track vet visits" but the in-app UI currently hides vet visits (Unit 6 complete, hidden). Either (a) un-hide vet visits in the UI before launch, (b) drop the "vet visits" mention from the description and roll it into "vet visit notes captured under Health Records," or (c) leave as-is on the assumption that vet-visit surfaces will be back before App Store review. Surface this to the founder; minimum-risk fix is to soften to "and a place to keep notes from vet visits" if the UI surface remains hidden.

---

## 6. What's New (max 2000 chars, version notes for v1)

**Recommendation: 413 chars.** Not a changelog. A welcome note.

```
This is the first version of Bemy. Thanks for being one of the early people here.

Bemy keeps a profile for each pet in your family — vaccinations, medications, vet visits, weight, food, and the rest — all in one calm place. It's made by one person in Australia for his two dogs Beau and Remy, and now for you and yours.

If anything's confusing or missing, tap Send Feedback in the menu. Every message gets read.
```

**Why a welcome paragraph:** for v1, "What's New" is the first thing a fresh installer reads after the description. A bullet-list changelog ("- Initial release") is voice-violating. A short, warm paragraph reinforces the same one-person-in-Australia story without repeating the description verbatim. From v1.1 onward, this field will become a real changelog ("Fixed a bug where medication reminders fired in the wrong timezone — sorry"). Version 1 is the only chance to set the tone here.

---

## 7. Support URL / Marketing URL / Privacy Policy URL

| Field | Recommendation | Reasoning |
|---|---|---|
| **Privacy Policy URL** | `https://jackosaurus.github.io/bemy-legal/privacy.html` | Already live and approved by the privacy-policy doc. No change. |
| **Support URL** | **Option (a): `https://jackosaurus.github.io/bemy-legal/privacy.html#support`** — add a `<section id="support">` to the existing privacy site with the email + a one-paragraph "what to expect" reply window. **Option (c) acceptable as a follow-up:** dedicated `support.html`. **Skip option (b)** (`mailto:`) — Apple prefers a URL over a mailto and some review reps flag it. | Reusing the existing static site costs ~30 minutes of HTML and avoids spinning up another property. The support anchor is a clean, professional landing for support queries. The email surfaced inside that page is `beeble.ptyltd@gmail.com` (the entity address), not the founder's personal email. |
| **Marketing URL** | **Skip for v1.** Optional field; leaving blank is fine. | A bad marketing site is worse than no marketing site. Until the marketing lead lands a strategy and a designer mocks up a landing page, leave blank. Revisit at v1.2 once shareable profiles ship (Phase 2 fast-follow #2) — a public landing page becomes more valuable when the app generates outbound shareable links. |

**Action item for founder:** add a `<section id="support">` block to `bemy-legal/privacy.html` with this content:

```
<section id="support">
  <h2>Support</h2>
  <p>Bemy is a small app made by one person. The fastest way to get help is to tap <strong>Send Feedback</strong> from inside the app — that lands in my inbox with the right context attached.</p>
  <p>If you can't sign in or the app won't open, email <a href="mailto:beeble.ptyltd@gmail.com">beeble.ptyltd@gmail.com</a> and I'll reply within a few days.</p>
</section>
```

---

## 8. App Store name vs in-app display name

**Recommendation: keep them identical at `Bemy`.**

`app.json` currently has `expo.name = "Bemy"` (verified). The home-screen icon label will be `Bemy`. The App Store Connect listing name should also be `Bemy` (not `Bemy — Pet Family Care` or similar).

**Why match:**

- **Search-result → install → home-screen continuity.** A user searching for "pet records" finds `Bemy — Pet Family Care`, installs it, and sees `Bemy` on their home screen. That's a tiny inconsistency, but it dilutes brand recognition at exactly the moment the brand is forming in the user's head.
- **The subtitle is doing the search-discovery work.** `Pet records, gently kept` already tells the search algorithm and the user what the app is. We don't need ASO weight on the name field.
- **Indie-credible.** Big apps pad their names ("Notion: Notes, Wiki, Tasks"). Indie apps that confidently use just their brand name read as more deliberate. Matches Bemy's positioning.
- **Localisation safety.** Translating a padded name into 6 languages without bursting 30 chars is a maintenance tax. Plain `Bemy` is universal.

**Reject:** the longer "Bemy — Pet Family Care" pattern. Even if it earned a small ASO bump, the brand-cohesion loss isn't worth it for a v1 product whose growth strategy will lean on word of mouth and quality, not search.

---

## 9. Voice & tone — do/don't list (App Store listing only)

This list is specific to App Store listing copy. The full design-system voice rules in `docs/bemy-design-system.md` §Voice & Tone still apply.

### DO

1. **Name the dogs by name.** "Beau" and "Remy" appear in the description, the promotional text, the what's new note, and the brand-story spine. Specificity is the trust signal.
2. **Write in first-person singular.** "I built it," "I read every piece of feedback," "Tell me." Never "we" or "the team."
3. **Sound like a thoughtful email.** Sentences vary in length. Em-dashes are fine. Commas are fine. Slogans are not fine.
4. **End on a request to send feedback.** Mirrors the in-app About page closing. Reinforces the "real person on the other end" promise.
5. **Use specific failure modes when describing who the app is for.** "Lost a sticky note with a dosing schedule on it" is more persuasive than "for organised pet owners."

### DON'T

1. **Don't say "the best," "revolutionary," "AI-powered," "all-in-one," "complete," or "the only."** Voice violation; unfalsifiable claims read as desperation.
2. **Don't say "we" or "the team."** Inflating one person into a team is the fastest way to lose indie credibility.
3. **Don't bullet-list features as marketing collateral.** Apple's renderer makes bullets look weird, and bullet-list voice is agency voice. Use prose with optional inline `-` markers.
4. **Don't promise features outside the v1 roadmap.** No mentions of family sharing, social feed, OCR, vet integrations, expense tracking. (Phase 2+ in `bemy-roadmap.md`.) Promotional text can be updated without a new build, so push roadmap teasers to that field if needed later.
5. **Don't use emoji or paw-print decorations.** The design system rule "playful, not childish" applies; emoji in App Store copy reads cheap. The single permitted emoji in the entire surface area of Bemy's voice is the cake (🎂) on a pet's birthday — and that's an in-app surgical use, not a listing one.

---

## 10. PII guard — public listing fields vs Apple-only fields

| App Store Connect field | Visibility | Recommended value | Why |
|---|---|---|---|
| App Name | Public | `Bemy` | Pure brand. |
| Subtitle | Public | `Pet records, gently kept` | No PII. |
| Promotional Text | Public | See §4. Mentions `Jack` (first name) + `Australia` + `Beau` + `Remy`. | All allowed per `feedback_pii_auto_injection.md`. |
| Description | Public | See §5. Mentions `Jack` + `Australia` + `Beau` + `Remy`. | All allowed. |
| What's New | Public | See §6. No founder name in v1 copy; brand-story "one person in Australia" reference only. | Safe. |
| Keywords | Hidden from users | See §3. No PII. | Safe. |
| Support URL | Public | `https://jackosaurus.github.io/bemy-legal/privacy.html#support` | The GitHub username `jackosaurus` is already public on the privacy URL. Acceptable; not the founder's full name. |
| Marketing URL | Public | (blank for v1) | n/a |
| Privacy Policy URL | Public | `https://jackosaurus.github.io/bemy-legal/privacy.html` | Already live. |
| Copyright | Public on the listing | `© 2026 Beebles` | Use the legal entity, not the founder's name. |
| **App Information → Primary Contact** | Apple-only (review team sees it; not on the listing) | Name: `Beebles` (or per Apple's required schema: First name `Beebles`, Last name `Pty Ltd`) — Email: `beeble.ptyltd@gmail.com` — Phone: founder's preference, not in this doc | Internal Apple field. Use the entity, not the founder's name. |
| **App Information → Trade Representative Contact (only required for some storefronts)** | Apple may share with consumers in some regions (KR, etc.) | `Beebles` + `beeble.ptyltd@gmail.com` | Use the entity. |
| **App Store Connect Account Holder / Team Agent** | Apple-only | Beebles, Pty Ltd legal entity | Already configured at the developer-account level; do not edit during listing setup. |
| Age Rating questionnaire | Public (renders as an age rating, not free text) | n/a | No copy choices here. |
| Support email surfaced in the listing | Public via Support URL | `beeble.ptyltd@gmail.com` (the entity inbox, not `jacksangdinh@gmail.com`) | Hard PII rule. Never expose the founder's personal email. |

**The line is:** any field that displays free text on the public listing or the Apple receipt page can use `Jack` (first name) + `Australia` + `Beau`/`Remy`. Any structured contact field (legal entity, copyright owner, payee, support email) uses `Beebles` + `beeble.ptyltd@gmail.com`. Never `Jack Dinh`, `jacksangdinh@gmail.com`, `jack.dinh`, or `Huu Sang Dinh` anywhere in the listing or in the Apple-only fields.

**Tooling watch (per `feedback_pii_auto_injection.md`):** before submitting the build, re-check `app.json` for `"owner": "jack.dinh"` injection. EAS may have re-added it since the last scrub. Grep `app.json eas.json *.plist *.entitlements` for `jack.dinh`, `jacksangdinh`, and `Huu Sang Dinh` immediately before `eas submit`.

---

## 11. Final-pick summary

| Field | Pick | Length |
|---|---|---|
| Name | `Bemy` | 4 |
| Subtitle | `Pet records, gently kept` | 24 |
| Keywords | `vet,vaccine,medication,reminder,allergy,weight,food,health,tracker,journal,puppy,kitten,dog,cat,care` | 100 |
| Promotional Text | "A small, careful app for keeping your pet family's records in one place. Built by one person in Australia for two dogs called Beau and Remy." | 140 |
| Description | (see §5) | 1815 |
| What's New | (see §6) | 413 |
| Support URL | `https://jackosaurus.github.io/bemy-legal/privacy.html#support` | n/a |
| Marketing URL | (blank for v1) | n/a |
| Privacy Policy URL | `https://jackosaurus.github.io/bemy-legal/privacy.html` | n/a |

---

## 12. Open questions for the founder

1. **Vet Visits surfacing.** The description names "vet visits" as a record type. Vet Visits are coded in the app but currently hidden from the UI per the project-memory note ("Vet visits code retained but hidden from all UI entry points"). Either (a) un-hide the surface before submission, (b) soften the description to "a place for vet visit notes" without promising a dedicated screen, or (c) ship as written and surface a vet-visits screen in v1.0.x. Pick before listing copy is finalised.
2. **Pricing posture.** The description says "no ads, no data sales." It does not say "free." If a paid tier is coming inside 6 months, a sentence like "free for a single pet, with a paid plan for families later" is the most honest place to flag it. If pricing is undecided, leave silent.

---

## 13. History / change log

- **2026-05-02:** First draft. Subtitle picked, description at 1815 chars, brand-story spine landed at 71 words. PII guard table added.
