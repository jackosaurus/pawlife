# Bemy — About Page Copy & Strategy

**Surface:** "About" entry in the bottom-sheet menu, alongside Settings, Pet Family, and Send Feedback.
**Author:** Indie product marketing draft, May 2026.
**Status:** Draft for founder + designer review. Engineer will paste Part 1 into a `<Text>` tree once approved.

---

## Part 1 — Page Copy (ships in app)

> Draft for `app/(main)/about.tsx` (or wherever the engineer wires it). Each section heading uses the Fraunces display family (the same treatment as the welcome screen "Bemy" wordmark, scaled down to a section heading). Body is the standard body text style.

**Word count:** 312.

---

### Hi, I'm Jack.

I'm an indie developer in Australia, and I built Bemy on nights and weekends because I wanted something better for my own two dogs.

Their names are Beau and Remy. **Be**au + **Re****my** — that's where the name comes from.

---

### Why I built it

I kept losing track. A vaccination booster was due "sometime in autumn." A medication was "twice a day, but which two times?" Beau's last weigh-in was on a sticky note that the puppy had eaten.

I wanted one place that held all of it, looked nice enough that I'd actually open it, and didn't try to sell me anything. So I started building one for myself.

A handful of friends with their own dogs and cats started using early versions, and a lot of what's in the app now exists because they asked for it. The vaccination reminders, the food change history, the gentler language around archiving a pet — those came from real people telling me what they actually needed.

---

### What Bemy is, and isn't

Bemy is a small, careful app for keeping your pet family's records in one place. It is not a venture-backed startup, a vet on demand, or a substitute for actual medical advice. If something feels wrong with your pet, please call your vet, not your phone.

What I can promise is that the app is built with care, the data is yours, and there's a real person on the other end of every bug report.

---

### A small ask

If you've used Bemy for more than a day or two, you probably already know one thing that would make it better. I'd love to hear it.

Tap **Send Feedback** in the menu and tell me the smallest concrete thing you'd change — a confusing label, a missing field, a screen that feels slow. Every message gets read by me.

---

### Thanks for being here

From one pet person to another — give Beau and Remy's namesakes a scratch behind the ears for me.

— Jack

---

## Part 2 — Strategy & Reasoning

### Why an About page for an indie app

A Settings page tells you what the app *does*. An About page tells you who's behind it and why they care. For an indie product without a marketing budget, this is the cheapest, most durable trust mechanism available: people are dramatically more forgiving of a small bug, a missing feature, or a slow reply when they know there's a human attached to the work. It also seeds word-of-mouth — "it's made by some guy in Australia with two dogs called Beau and Remy" is a story that travels. A faceless app doesn't get retold at the dog park.

### Voice calibration

"Jack from Australia with two dogs" lands harder than "we built Bemy to revolutionize pet care" because the first sentence is verifiably true and the second is a lie everyone has learned to tune out. The privacy policy already commits to "plain English by intent" — the About page extends the same posture: specific nouns (Beau, Remy, sticky note, eaten by the puppy) over abstract claims (caring, comprehensive, beautifully designed). Every concrete detail buys a little more credibility than a paragraph of adjectives ever will. The voice is closer to a thoughtful email than a landing page.

### The Send Feedback hook

The page exists partly to humanize, partly to feed the existing Send Feedback flow. The CTA is deliberately specific — "tell me the smallest concrete thing you'd change" — because generic invitations ("we'd love to hear from you!") get generic non-responses. Naming a *form* of feedback (a confusing label, a missing field, a slow screen) gives the user a concrete thing to write, which is the difference between a feedback button that gets tapped and one that just sits there. The closing line ("Every message gets read by me") promises a real reply without committing to a response time we can't honour.

### What I deliberately did NOT include, and why

- **Founder's surname / city / suburb / employer / day job.** Hard PII constraint from the brief — the About page is the *human* story, not the *legal* entity. Beebles + the support email already carry the legal weight on the privacy page; doubling them up here muddies the register.
- **A photo of Jack.** Photo of a founder is a different commitment level (LinkedIn-y, "personal brand"). The page works without one and stays warmer for it. Designer can revisit if they want a small portrait, but copy doesn't need it.
- **Roadmap teases ("coming soon: family sharing!").** The page is about who built it and why, not what's next. Roadmap promises age badly and turn an honest page into a marketing page.
- **"We" / "the team" / "made by a team of pet lovers."** Inflating one person into a team is the single fastest way to lose the indie credibility the page is trying to earn. First person singular throughout.
- **GitHub stars, "open-source" framing, social handles (X, Instagram, etc.).** Bemy isn't open source, the founder doesn't want a public surname presence, and a Twitter follow button on an About page in a *pet care app* is tonally wrong.
- **Marketing superlatives ("revolutionize", "the best pet app", "loved by thousands").** Voice violation — and unfalsifiable claims read as desperation in a small app. Specifics over superlatives.

### Open question for the founder

**One:** Do you want the page to mention that Bemy is currently free / how it'll be priced over time? Right now the copy says nothing about money, which feels right for the MVP, but if a paid tier is coming in the next 6 months the About page is the most honest place to flag it ("this will stay free for a single pet; family sharing will be paid one day"). If pricing is undecided, leave it out — easier to add a paragraph later than to retract a promise.

---

## Tone references for the parallel designer agent

**Emotional register:** Earnest, slightly intimate — the warmth of a handwritten note tucked into the back of a paperback, not a billboard. The reader should feel like someone made this for them personally, and is mildly embarrassed to be talking about themselves. A little quiet, a little proud, no ta-da.

**Imagery recommendation (defer final call to design):**
- **Strongest fit:** a small illustrated portrait of Beau and Remy (or a paw / tail / silhouette pair, in the existing flat-line illustration style — same family as `welcome-hero.png`). It externalizes the namesake reveal without putting Jack's face on the page.
- **Acceptable:** the existing `welcome-hero.png` cat-and-dog illustration reused at smaller scale. Familiar, on-brand, no new art commission.
- **Discouraged:** a photo of Jack himself (commits to a personal-brand register the copy doesn't ask for); generic stock pet photography (breaks the illustrated brand world); decorative pet emoji as imagery (childish, against the design system "playful, not childish" rule).
- **Defensible minimalism:** no imagery at all, just typography on the warm background. The copy alone carries it. This would harmonize with the "plain English by intent" register more than any illustration.

The copy works in any of those four directions. The decision belongs to the designer; the copy will not need rewriting to suit it.
