# Pawlife — Product Roadmap

## Product Vision

**One-liner:** A digital home for everything about your pet family — health records, food, and care history in one place.

**Who it's for:** Pet owners who want to stay on top of their pet family's health and care without relying on memory, scattered paperwork, or text message threads with their vet. Launching with dogs and cats first.

**Core insight:** Pet owners accumulate a surprising amount of important information over a pet's life — vaccination records, medication schedules, dietary changes, weight history, vet visits, behavioral notes — and none of it has a natural home. It ends up split across paper files, email attachments, camera rolls, and memory. When you need it (at the vet, at a boarding facility, when something seems off), it's never at hand.

**What Pawlife is:** A single, beautiful profile for each member of your pet family that captures their health, diet, and milestones — and actively helps you stay on top of their care.

**What Pawlife is not:** A social network. A vet telehealth platform. A pet store. It's a personal tool first.

---

## Product Principles

1. **Reduce input friction above all else.** Every feature lives or dies by how easy it is to enter data. If it feels like a chore, people stop.
2. **Be useful on day one.** A user who adds one pet and one upcoming vaccination should immediately get value.
3. **Earn the right to ask for more data.** Start with the essentials, then surface prompts for richer data over time.
4. **One pet, many contexts.** The same profile should be useful at the vet, at the boarding kennel, with the pet sitter, and for your own reference.
5. **Multi-pet households are first-class.** Not an afterthought.

---

## MVP (Current Build)

**Goal:** Build the core experience — adding pets, recording health data, tracking food — and validate that the app is useful enough to keep coming back to. This release is for internal use only (personal dogfooding).

### What's In

**Auth**
- Email + password sign up and sign in
- Basic session management

**Pet Profiles**
- Add pets (dogs and cats)
- Pet type, name, breed, date of birth (with approximate age option), sex, weight, microchip number, profile photo
- Edit pet profiles
- Archive pets (with empathetic UX, restorable from settings)
- Support for multiple pets per account

**Health Records (full CRUD)**
- Vet visits: date, clinic name, reason, notes, file/photo attachments
- Vaccinations: vaccine name, date administered, next due date, clinic/vet
- Medications: name, dosage, frequency, start/end date, prescribing vet, notes, active/completed status
- Weight: date, weight value, optional note

**Food & Diet (full CRUD)**
- Current food: brand, product name, type (dry/wet/raw/mixed), amount per meal, meals per day
- Food change history with dates and optional reason for change

**Dashboard**
- "Your Pet Family" overview with all pets
- Per-pet detail view with health summary, recent activity, current food
- Quick-add FAB for logging records from the pet detail screen

**Settings**
- Account management (email, password, sign out)
- Weight unit preference (kg/lbs)
- Pet management (edit, archive, restore)

### What's Out (Intentionally)

- Onboarding flow (streamlined, multi-step)
- Forgot password
- Social sign-in (Apple, Google)
- Terms & privacy policy
- Push notifications and reminders
- Weight trend chart
- Photo gallery
- Search
- Shareable profiles
- Dark mode
- Delete account
- Pet switcher (beyond dashboard selection)

### MVP Success Criteria

1. **Personal utility:** Do I actually open the app and keep records up to date for my own pets?
2. **Data completeness:** After 2 weeks of use, have I filled out health records beyond just the pet name and photo?
3. **Friction check:** Are there points where data entry is annoying enough that I avoid it?

---

## Phase 2 — Fast Follows

Features to build immediately after MVP, in priority order. These are well-understood, low-complexity additions that meaningfully improve the experience.

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | **Push notifications & reminders** | Auto-reminders for upcoming vaccinations and medications. Custom reminders for grooming, checkups, etc. This is what turns the app from a database into an active tool. |
| 2 | **Shareable pet profiles** | Generate a read-only link or PDF summary. Key for pet sitters, boarding, new vets. Strongest organic growth mechanism. |
| 3 | **Vaccination card OCR** | Upload a photo of a vaccination card to pre-populate history. Massive friction reducer for onboarding existing pets with years of records. |
| 4 | **Forgot password** | Table stakes for any auth system once other people are using the app. |
| 5 | **Social sign-in (Apple, Google)** | Reduces sign-up friction for broader launch. |
| 6 | **Polished onboarding flow** | Multi-step, guided, delightful onboarding with progress indicators and smart prompts. Matters once we're acquiring real users. |
| 7 | **Weight trend chart** | Visual line chart of weight over time. Useful for monitoring health, especially post-surgery or during diet changes. |
| 8 | **Dark mode** | High user demand feature for any mobile app. Design for it from the start by using semantic colors. |

---

## Phase 3 — Growth & Intelligence

Features that add significant value but require more engineering effort or introduce new capabilities.

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | **Photo gallery with ML auto-sorting** | Import from camera roll, auto-tag by pet (for multi-pet households), chronological gallery per pet. Flagship differentiator. |
| 2 | **Smart vaccine scheduling** | Auto-suggest next due dates based on pet type, breed, and local regulations. Reduce guesswork. |
| 3 | **Food barcode scanning** | Scan food bag barcode to auto-populate brand and product. Links to recall databases. |
| 4 | **Vet document OCR** | Scan vet receipts and visit summaries to auto-populate records. |
| 5 | **Search** | Global search across all records, all pets. Becomes necessary as data volume grows. |
| 6 | **Expense tracking** | Track vet costs, food costs, grooming. Annual spend reports. |
| 7 | **Terms, privacy policy, delete account** | Required for public launch and app store compliance. |
| 8 | **Additional pet species** | Birds, rabbits, reptiles, fish. Requires species-specific field adjustments. |

---

## Phase 4 — Platform & Monetization

Features that expand Pawlife from a personal tool into a platform.

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | **Vet clinic integrations** | Two-way sync with vet practice management systems. Auto-import records after visits. |
| 2 | **Training logs** | Track commands learned, behavioral milestones, training sessions. |
| 3 | **Breeding / litter tracking** | Niche but high-value for breeders. Potential premium feature. |
| 4 | **B2B features** | Vet-facing dashboards, boarding facility integrations, pet insurance partnerships. |
| 5 | **Community / social** | Optional social layer — share milestones, connect with local pet owners. Only if validated by user demand. |
| 6 | **Premium subscription** | Define free vs. paid tiers. Candidates for premium: unlimited pets, PDF exports, family sharing, advanced analytics, cloud photo storage. |

---

## Open Questions

- **Platform:** iOS-first? Cross-platform from day one? Impacts timeline and tech stack.
- **Auth & data storage:** On-device vs. cloud-synced? Cloud needed for sharing and multi-device.
- **Monetization timing:** Free MVP, then introduce premium? Or build with the boundary in mind?
