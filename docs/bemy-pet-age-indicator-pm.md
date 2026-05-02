# Pet Age Indicator — Product Strategy

**Context:** Pet detail screen currently shows age as a small pill ("8 years, 1 month") with the same visual weight as "Male" and "12.2 kg." Founder wants something warmer and more personal in this slot. This doc proposes three product angles and a recommendation. Engineering is exploring visual concepts in parallel.

**Voice anchor:** "warm pet family, not clinical." Anti-twee. Reads warmly across puppyhood, prime-of-life, and senior pets approaching end-of-life. Treats the pet like family without performing it.

---

## Angle 1: Time as relationship

**Primary signal:** Cumulative time the pet has been part of the user's family. Lens is *togetherness*, not biology.

> "Buddy, 6 years with you"
> "Buddy joined your family in March 2020"

**Emotional moment:** The "I'm so lucky" glance. User opens the pet's screen, sees a number that represents accumulated love, not a countdown to anything. Especially powerful for adopted or rescued pets, where birth date is fuzzy but adoption date is sacred.

**Secondary / cut:** Exact biological age recedes. Birthday becomes a sub-event rather than the headline. Months-precision matters less than years.

**State variants:**
- **Normal day:** "6 years with you" + small "since March 2020" subline.
- **Birthday today:** Birthday gets a small confetti-restraint badge, but the headline stays "6 years with you" — togetherness is the constant; birthdays are visitors.
- **Adoption anniversary / "gotcha day":** Headline shifts to "6 years with you today" — the relationship marker celebrates itself.
- **First open of the day:** Same as normal — this isn't a notification surface, it's a reference surface.

**Worst version:** "Buddy + You = 6 years of pawsome adventures" with a heart emoji. Kills it. Also bad: making this require the user to enter an adoption date — fall back gracefully to birth date if not entered.

**Why better than age pill:** Reframes the most-glanced field on the screen from a biological fact ("how old") into a relationship fact ("how long we've had each other"). It's the difference between a chart and a memory.

---

## Angle 2: Birthday and life-stage celebration

**Primary signal:** The pet's place in the calendar — recent birthday, recent life-stage transition, or a quiet "between events" state.

> "Buddy turned 8 last month"
> "Buddy is officially a senior" (after crossing breed-specific threshold)
> "Buddy is 7" (between events; quiet state)

**Emotional moment:** Anticipation and savoring. Most apps treat birthdays as a one-day event; the magic is in the weeks *after* — "she just turned 8" is a sentence a pet owner says proudly for a month. The indicator gives them a place to feel that.

**Secondary / cut:** Precise month-level age in the "between events" state. Birth date becomes implicit, not surfaced as a number.

**State variants:**
- **Normal day (mid-cycle):** "Buddy is 7" — clean, calm, no decoration.
- **Birthday today:** "Happy 8th birthday, Buddy" — once, gentle, no confetti animation looping. A small glyph, not a parade.
- **Day after birthday / life-stage shift:** "Buddy turned 8 yesterday" → "Buddy turned 8 last week" → "Buddy turned 8 last month" → back to "Buddy is 8." Past-tense savoring window of ~30 days. Same model for senior transition.
- **First open of the day on birthday:** This is the one moment to be slightly bigger — a gentle full-width treatment, *only on first open*, that shrinks back to the standard pill on subsequent opens that day. Don't make people dismiss anything.

**Worst version:** "🎂 5 days until Buddy's birthday! 🎉" Calendar-app energy — surfaces *anticipation* of a forced event rather than savoring of a real one. Also bad: countdowns of any kind. Counting down to a pet's birthday feels like counting down anything else.

**Why better than age pill:** Gives the calendar emotional texture — three states (recent milestone / quiet / approaching) instead of one static fact. Rewards opening the app on the days that matter.

---

## Angle 3: Quiet age pride

**Primary signal:** Age, but rendered with warmth and personality in copy — not visual spectacle. Closer in spirit to the current pill, but the words do the work.

> "8 and a bit"
> "Just turned 8"
> "Almost 9"

**Emotional moment:** The functional glance. User wants to know how old their pet is — for vet visits, dose calculations, breed-typical milestones — and the answer arrives feeling like a friend told them, not a database. No celebration, no relationship framing, just warmer words.

**Secondary / cut:** Birth date itself (available on tap / detail). Adoption date stays where it is now.

**State variants:**
- **Normal day:** "8 and a bit" or "8½" — natural human age phrasing. Resolves to "Just turned 8" within 30 days of birthday, "Almost 9" within 60 days before next.
- **Birthday today:** "Turned 8 today" — single line, no badge, no animation.
- **Day after life-stage:** "Just turned senior" appears for ~14 days after the breed-specific threshold, then settles back. Senior framing matters: never "getting old," always "now a senior" — neutral, factual, dignified.
- **First open of the day:** No different. This angle deliberately doesn't reward app-opening with surprise — it rewards it with consistency.

**Worst version:** "Buddy is a 8-yr-old smol bean 🥺." Or worse: "Buddy is 56 in human years!" — a stat that's almost universally inaccurate and was already stale by 2010.

**Why better than age pill:** Same information, but the words sound like the user's voice instead of a form field. Lowest-risk, lowest-ceiling.

---

## Recommendation: Angle 2, with Angle 3 as the default state

Use **Angle 2 (birthday and life-stage)** as the framing, but make the "between events" state read like Angle 3 ("Buddy is 7"). This gives us:

- **Most days of the year:** Quiet, dignified, age-forward (Angle 3 wins the calm states).
- **30-day window after a birthday:** "Buddy turned 8 last month" — the savoring window.
- **30-day window after a life-stage transition (senior, etc.):** Dignified, factual marker.
- **Birthday itself:** A single warm sentence, slightly larger on first open of the day only.

### Why I lean here

1. **Behavioral evidence from comparable products.** Day One's "On This Day" and Apple Photos' Memories prove that *past-tense recall of recent meaningful events* is the highest-engagement surface in personal apps. People come back for "remember this." Anticipation surfaces (countdowns, upcoming reminders) have lower emotional ROI per pixel.

2. **Pet-specific evidence.** Pet owners narrate their pet's age in past tense for weeks ("she just turned 8") in a way they don't with their own age. We should match how they actually talk.

3. **Senior-pet safety.** Angle 1 (relationship time) sounds beautiful for a 2-year-old but reads heavily for a 14-year-old whose owner is anticipating loss. Angle 2's life-stage framing handles senior transitions with dignity instead of accumulating weight.

4. **It compounds with existing infrastructure.** We already have birthday push notification work planned (`project_birthday_reminders.md`). The in-app indicator and the push become a coherent moment instead of duplicating effort.

### What would make me wrong

- If user research shows people who use Bemy are predominantly recent adopters (< 1 year with pet), Angle 1 (relationship time) would win — accumulating time would be the headline emotion. Worth checking telemetry on `created_at` of pets vs. their birth dates once we have PostHog flowing.
- If users skip entering exact birth dates (using approximate / "around 2018"), Angle 2's life-stage transitions become noisy and we should fall back to Angle 3.
- If senior-pet users find life-stage transitions ("now a senior") emotionally heavy rather than dignifying, we cut that state and keep only the birthday window.

---

## Advice for engineering / cross-disciplinary anchors

1. **Past-tense over future-tense, always.** "Turned 8 last month" not "5 weeks since birthday" not "11 months until birthday." Past-tense feels savored; future-tense feels like a calendar app.
2. **Decoration only on first open of the day, only on the birthday itself.** Every other state is a typographic treatment, not a graphical one. We are not a confetti app.
3. **The "quiet state" is the default — design that one first.** It's what users see 330 days a year. If the quiet state isn't beautiful, the system fails regardless of how charming the birthday state is.
4. **Senior-pet readthrough is a hard requirement.** Every state must be reviewed against a hypothetical 14-year-old dog whose owner is bracing for the end. Nothing chirpy, nothing infantilizing, no "smol bean" diminutives.
5. **Tap target = full birth/adoption detail.** The indicator is a glance surface; tapping reveals the precise dates. Don't try to fit everything in the indicator itself.
