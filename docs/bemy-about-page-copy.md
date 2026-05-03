# Bemy — About Page Copy & Strategy

**Surface:** "About" entry in the bottom-sheet menu, alongside Settings, Pet Family, and Send Feedback.
**Author:** Indie product marketing draft, May 2026.
**Status:** Draft for founder + designer review. Engineer will paste Part 1 into a `<Text>` tree once approved.

---

## Revision 2026-05-03 #2 (locked, post founder feedback)

Founder feedback May 3 2026 #2 reshaped the page. The shipping copy now reflects:

- **NEW** "Origins of Bemy" section sits immediately after "Hi, I'm Jack" and absorbs the namesake reveal that previously lived inline.
- The "Bemy = Beau + Remy" pull-quote moves into the Origins section as that section's visual anchor (it no longer sits between the two Meet cards).
- All hyphens and em-dashes in body copy scrubbed; sentences rewritten where dash deletion alone broke grammar.
- The "Made with care in Australia · 2026" footer is **deleted**. Page now ends on the "Jack" sign-off (no leading em-dash).
- Word count adjusted from ~480 → ~510 to absorb the new Origins paragraphs.

The previous Revision 2026-05-03 (#1) moved from a single intro paragraph to dual Meet cards using the founder's real dog anecdotes. That revision still applies; this one builds on top.

---

## Part 1 — Page Copy (ships in app)

> Draft for `app/(main)/about.tsx`. Each section heading uses the Fraunces display family (the same treatment as the welcome screen "Bemy" wordmark, scaled down to a section heading). Body is the standard body text style. Beau and Remy each get a full-width photo above their name + breed + body.

**Word count:** ~510.

---

### Hi, I'm Jack

I'm an indie developer in Australia, and I built Bemy on nights and weekends because I wanted something better for my own two dogs.

---

### Origins of Bemy

Bemy is just Beau and Remy's names smooshed together. **Be** from Beau, **my** from Remy.

I tried other names, but every sketch I made for the icon ended up looking like one of them, so I gave up and named it after both.

> **Bemy** = **Be**au + **Re**my

*(Pull-quote treatment per the design spec — Fraunces large title, plum, centered.)*

---

### Beau

*Cocker spaniel × poodle · 8 years*

*[Full-width photo of Beau above this heading.]*

Beau is the older of the two, and probably one of the sweetest dogs you'll ever meet.

He's also (and yes, this sounds invented) allergic to grass. And lamb. He gets ear infections every couple of months that need ear drops on a regular cycle, and he goes in for allergy shots every few months too. Tracking what dose he's on, when the next round of ear drops is due, what dates he last had a shot, that's a recurring task in our house, and a lot of why Bemy exists.

---

### Remy

*Bordoodle × poodle · 6 years*

*[Full-width photo of Remy above this heading.]*

Remy is the younger one, and an absolute demon of energy.

There's enough border collie in the bordoodle that he is *in love* with a ball. Any ball, all balls, forever. People at the dog park love throwing for him because he'll never stop chasing it, which is also the problem: he doesn't know when to stop, so he sometimes hurts himself if we let it go too long. He's also completely inseparable from Beau. Where one goes, the other is about three seconds behind.

---

### Why I built it

Between Beau's medications and Remy's vet visits, I kept losing track of small things. When the next allergy shot was due, what dose Beau was last on, whether Remy's last weight check was three months ago or six.

I wanted one place that held all of it, looked nice enough that I'd actually open it, and didn't try to sell me anything. So I started building one for myself.

A handful of friends with their own dogs and cats started using early versions, and a lot of what's in the app now exists because they asked for it. The vaccination reminders, the food change history, the gentler language around archiving a pet, those came from real people telling me what they actually needed.

---

### What Bemy is, and isn't

Bemy is a small, careful app for keeping your pet family's records in one place. It is not a venture backed startup, a vet on demand, or a substitute for actual medical advice. If something feels wrong with your pet, please call your vet, not your phone.

What I can promise is that the app is built with care, the data is yours, and there's a real person on the other end of every bug report.

---

### A small ask

If you've used Bemy for more than a day or two, you probably already know one thing that would make it better. I'd love to hear it.

Tap **Send Feedback** in the menu and tell me the smallest concrete thing you'd change. A confusing label, a missing field, a screen that feels slow. Every message gets read by me.

---

### Thanks for being here

From one pet person to another, go give your own pet a scratch behind the ears from me.

Jack

*(Page ends here — no footer. The "Made with care in Australia · 2026" line was removed in revision #2 per founder feedback that it read as cheesy.)*

---

## Part 2 — Strategy & Reasoning

### Why the dedicated Meet Beau / Meet Remy cards

The original draft folded a single sentence about Beau and Remy into the intro. The revised structure pulls each dog into their own card — short, named, with a photo and one specific medical/behavioural anecdote. This earns three things at once that no other section in the page can:

1. **Authenticity through specificity.** "Allergic to grass and lamb, ear drops every couple of months, allergy shots" is a description nobody invents. The same is true of "loves a ball, doesn't know when to stop, hurts himself chasing it." Specific small failures are more persuasive than any "we care about your pets" claim.
2. **A microcosm of the app's value, told as story.** Beau's section is implicitly tracking *medications, vaccinations, allergies* — three of Bemy's four record types. Remy's section implies *vet visits, weight tracking, behavioural notes*. Without saying "Bemy can do X," the dogs' stories show what Bemy is for.
3. **The "Bemy = Beau + Remy" reveal lands harder** when the reader has just spent two paragraphs falling for the actual dogs. Putting the pull-quote *after* both cards makes the brand origin click instead of being introduced as trivia.

### Why an About page for an indie app

A Settings page tells you what the app *does*. An About page tells you who's behind it and why they care. For an indie product without a marketing budget, this is the cheapest, most durable trust mechanism available: people are dramatically more forgiving of a small bug, a missing feature, or a slow reply when they know there's a human attached to the work. It also seeds word-of-mouth — "it's made by some guy in Australia with two dogs called Beau and Remy" is a story that travels. A faceless app doesn't get retold at the dog park.

### Voice calibration

"Jack from Australia with two dogs" lands harder than "we built Bemy to revolutionize pet care" because the first sentence is verifiably true and the second is a lie everyone has learned to tune out. Every concrete detail (allergic to grass, eight years old, bordoodle, demon energy) buys a little more credibility than a paragraph of adjectives ever will. The voice is closer to a thoughtful email than a landing page.

### The Send Feedback hook

The page exists partly to humanize, partly to feed the existing Send Feedback flow. The CTA is deliberately specific — "tell me the smallest concrete thing you'd change" — because generic invitations get generic non-responses. Naming a *form* of feedback (a confusing label, a missing field, a slow screen) gives the user a concrete thing to write. The closing line ("Every message gets read by me") promises a real reply without committing to a response time we can't honour.

### What I deliberately did NOT include, and why

- **Founder's surname / city / suburb / employer / day job.** Hard PII constraint. The About page is the *human* story (Jack), not the *legal* entity (Beebles). The privacy policy already carries the legal weight.
- **A photo of Jack himself.** A photo of the founder is a different commitment level (LinkedIn-y, "personal brand"). Photos of the *dogs*, on the other hand, are exactly the right register. Beau and Remy are the brand origin; Jack is the narrator.
- **Roadmap teases ("coming soon: family sharing!").** The page is about who built it and why, not what's next. Roadmap promises age badly.
- **"We" / "the team" / "made by a team of pet lovers."** Inflating one person into a team is the single fastest way to lose indie credibility. First person singular throughout.
- **Marketing superlatives ("revolutionize", "the best pet app", "loved by thousands").** Voice violation; unfalsifiable claims read as desperation in a small app. Specifics over superlatives.
- **GitHub stars, "open-source" framing, social handles.** Bemy isn't open source; the founder doesn't want a public surname presence; a Twitter follow button on an About page in a pet care app is tonally wrong.

### Open question for the founder

**Pricing / free-tier intent.** Right now the copy says nothing about money, which feels right for the MVP. If a paid tier is coming in the next 6 months, the About page is the most honest place to flag it ("this will stay free for a single pet; family sharing will be paid one day"). If pricing is undecided, leave it out — easier to add a paragraph later than to retract a promise.

---

## Tone references for the design spec

**Emotional register:** Earnest, slightly intimate — the warmth of a handwritten note tucked into the back of a paperback, not a billboard.

**Imagery direction (revised, May 2026):**

- **v1 recommended:** real photos of Beau and Remy in the dedicated Meet cards, rendered using the same plum-bordered Avatar treatment that's used on the pet detail screen. Visual continuity from "the avatars on the About page" to "the avatars on your own pets in the app" is a brand cohesion win, and photos of real dogs read as personal in a way illustrations can't. The existing `welcome-hero.png` (cat + dog cuddled) can still appear as a top hero, OR the page can lead with a Fraunces-only opening if photos in the cards already carry the warmth.
- **v1.1 polish path:** custom illustrated portraits of Beau and Remy in the existing flat-line illustration style (soft-coral fill on plum lines, matching the empty-state illustrations). Non-blocking; ship photos first.
- **Discouraged:** a photo of Jack himself; generic stock pet photography; pet emoji as imagery.
- **Defensible minimalism:** no imagery at all, photos absent. The copy alone carries it. Use only if photos genuinely cannot be supplied.
