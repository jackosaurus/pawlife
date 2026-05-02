# Pawlife — Screen Inventory & Design System (MVP)

> **DEPRECATED.** Design system content has moved to [bemy-design-system.md](bemy-design-system.md). This file is kept for historical reference only — patterns described here (e.g. swipe-to-edit/delete, "Vet Visits" filter) no longer reflect the current app.

## Design Principles

1. **Warm, not clinical.** This is about your pet family, not a medical chart. Soft corners, warm colors, generous whitespace. Think: the care of a premium baby tracking app, not a hospital portal.
2. **Pet-first hierarchy.** The pet's face and name should anchor every context. The user should always feel like they're "inside" a specific pet's world.
3. **Progressive disclosure.** Show the most important info upfront, let users drill in for detail. Don't overwhelm on first glance.
4. **One-thumb reachable.** Primary actions should be reachable with one thumb. Bottom sheets over full-screen modals for simple inputs.
5. **Celebration over obligation.** Frame health tracking as caring for your pet family, not completing a checklist.
6. **Scannable cards.** Records should be card-based with clear visual hierarchy — icon, title, date, and status at a glance.
7. **Empty states that guide.** Every empty screen should explain what goes there, why it matters, and have a single clear CTA.

## Voice & Tone Principles

1. **"Pet family" not "pets."** Always refer to the user's animals as their "pet family" or by name. Never clinical, never detached.
2. **Use pet names wherever possible.** "Luna's vaccinations" not "Pet vaccinations." Make the app feel personal.
3. **Warm and encouraging, not instructional.** "Time to update Luna's records!" not "Please enter vaccination data."
4. **Celebrate milestones.** "Milo has been part of your family for 3 years!" — acknowledge the relationship, not just the data.
5. **Gentle with sensitive topics.** Archive, not delete. "Remembering Luna" not "Archived pet." Empathetic language around loss or difficult health moments.
6. **Conversational CTAs.** "Add to Luna's story" not "Create record." "What's Luna eating?" not "Add food entry."
7. **Avoid jargon.** "Shots" or "vaccinations" not "immunizations." Match how people actually talk about their pets.
8. **Playful but not childish.** Light humor is fine ("Luna's looking healthy!"), but don't overdo it with puns or excessive emoji.

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Pale warm yellow | `#FFF8E7` |
| Primary / CTA | Rich plum | `#4A2157` |
| Primary dark (pressed) | Deep plum | `#341539` |
| Secondary accent | Soft coral | `#E8735A` |
| Cards & surfaces | White | `#FFFFFF` |
| Primary text | Dark warm charcoal | `#2D2A26` |
| Secondary text | Medium warm gray | `#7A756E` |
| Status: current | Sage green | `#5BA67C` |
| Status: due soon | Warm amber | `#E5A84B` |
| Status: overdue | Soft coral | `#E8735A` |
| Borders & dividers | Warm light gray | `#EDE8DF` |

## Design Patterns

- **No bottom tab bar.** Dashboard → tap pet → pet detail. Settings via gear icon in top nav.
- **Card-based lists** — for all records (vet visits, vaccinations, medications, food, weight)
- **Bottom sheets** — for quick-add actions and simple forms
- **Floating action button (FAB)** — on pet detail screen for adding new records
- **Swipe actions** — swipe to edit/delete on list items
- **Status pills/badges** — color-coded per palette above
- **Sticky headers** — pet name + avatar stays visible when scrolling within pet detail
- **Skeleton loading states** — not spinners
- **Full CRUD on all records** — every record type supports create, read, update, and delete

---

## Information Architecture (MVP)

```
App
├── Dashboard (all pets overview)
│   └── Tap pet → Pet Detail
│       ├── Health section
│       │   ├── Vet Visits
│       │   ├── Vaccinations
│       │   ├── Medications
│       │   └── Weight
│       └── Food section
│           ├── Current food
│           └── Food history
├── Add Pet (from dashboard)
└── Settings (gear icon, top nav)
    ├── Account (email, password, sign out)
    ├── Preferences (units: kg/lbs)
    └── Pet management (edit profile, archive)
```

---

## Screen Inventory

### 0. Auth

**0.1 — Welcome Screen**
- App logo, tagline: "A digital home for your pet family"
- Warm illustration of a dog and cat together
- Two CTAs: "Get Started" / "Sign In"

**0.2 — Sign Up**
- Email + password fields
- "Create Account" button (primary plum CTA)
- "Already have an account? Sign In" link

**0.3 — Sign In**
- Email + password fields
- "Sign In" button (primary plum CTA)
- "Don't have an account? Get Started" link

---

### 1. Dashboard

**1.1 — Dashboard (With Pets)**
- Top: "Your Pet Family" heading with gear icon (→ Settings) in top right
- Pet cards in a vertical list or 2-column grid:
  - Each card: large circular photo, name, breed, age, pet type icon (dog/cat)
  - Subtle status summary (e.g., "2 vaccinations due soon" or "All up to date")
- "Add to your family" card at the bottom (dashed border, + icon)
- Tapping a pet card → Pet Detail screen

**1.2 — Dashboard (Empty State)**
- First-time user, no pets added yet
- Warm illustration
- "Welcome to Pawlife! Let's meet your pet family."
- Single CTA: "Add Your First Pet"

---

### 2. Add / Edit Pet

**2.1 — Add Pet**
- Pet type selector: Dog / Cat (large tappable cards with illustrations)
- Name field
- Profile photo (camera/library, with default avatar per pet type)
- Breed (searchable dropdown with "Mixed / Unknown" option)
- Sex (Male / Female / Unknown)
- Date of birth (date picker, with "Approximate age" toggle for rescues/unknowns)
- Weight (optional)
- Microchip number (optional)
- "Add [Name] to your family" CTA button
- Design: single scrollable form, not multi-step for MVP

**2.2 — Edit Pet Profile**
- Same fields as Add Pet, pre-filled
- "Save Changes" CTA
- "Archive [Name]" option at bottom (muted, not prominent)
  - Confirmation with empathetic copy: "We'll keep all of [Name]'s records safe. You can find them anytime in Settings."

---

### 3. Pet Detail

**3.1 — Pet Detail (Main View)**
- This is the core screen of the app
- Sticky header: large profile photo, name, breed, age, pet type badge
- Scrollable sections below, each as a card group:

**Health Summary Card**
- At a glance: vaccination status pill, number of active medications, current weight, last vet visit date
- "See all health records" link → Health Records screen

**Recent Health Activity**
- Last 3 health events (any type) as compact cards
- Each card: type icon, title, date

**Current Food Card**
- Brand, product name, type, amount per meal, meals per day
- "Started [date]" — duration on current food
- Edit icon, "Change food" link

**FAB (+) Button**
- Opens quick-add bottom sheet with options:
  - Log Vet Visit
  - Add Vaccination
  - Add Medication
  - Log Weight
  - Change Food

**3.2 — Pet Detail (Empty State)**
- Pet just added, no records yet
- Sections show encouraging empty states:
  - Health: "No health records yet. Start building [Name]'s health history!"
  - Food: "What's [Name] eating? Add their current food."
- Each empty state has its own CTA

---

### 4. Health Records

**4.1 — Health Records List**
- Accessed from Pet Detail "See all health records"
- Back arrow → Pet Detail
- Pet name + avatar in header
- Segmented filter: All / Vet Visits / Vaccinations / Medications / Weight
- Reverse-chronological card list
- Each card: type icon, title, date, brief summary, status pill (where applicable)
- FAB: "+" opens relevant add form based on active filter

**4.2 — Vet Visit Detail**
- Date, clinic name, reason, full notes
- Attached files/photos (thumbnail grid, tap to view full screen)
- Edit / Delete buttons

**4.3 — Add/Edit Vet Visit**
- Fields: date (default today), clinic name (autocomplete from previous entries), reason, notes (multiline), attach file/photo button
- "Save" sticky button at bottom

**4.4 — Vaccination Detail**
- Vaccine name, date administered, next due date, clinic/vet name
- Status pill (current / due soon / overdue)
- Edit / Delete buttons

**4.5 — Add/Edit Vaccination**
- Fields: vaccine name (dropdown of common vaccines per pet type + custom), date administered, next due date (auto-suggested based on vaccine type), clinic/vet name (optional)
- "Save" sticky button at bottom

**4.6 — Medication Detail**
- Name, dosage, frequency, start date, end date, prescribing vet, notes
- Status: Active / Completed
- Edit / Delete / Mark as Completed buttons

**4.7 — Add/Edit Medication**
- Fields: name, dosage, frequency (dropdown: daily, twice daily, weekly, monthly, custom), start date, end date (optional — ongoing if blank), prescribing vet (optional), notes
- "Save" sticky button at bottom

**4.8 — Weight Entry Detail**
- Date, weight, optional note
- Edit / Delete buttons

**4.9 — Add/Edit Weight Entry**
- Minimal bottom sheet: weight input (numeric, unit from settings), date (default today), optional note
- "Save" dismisses sheet

---

### 5. Food

**5.1 — Food History**
- Accessed from Pet Detail "Current Food" card or "Food history" link
- Current food card at top (highlighted)
- Past foods listed below in reverse chronological order
- Each card: brand/product, date range, food type, reason for change (if noted)

**5.2 — Add/Edit Food**
- Fields: brand, product name, food type (dry/wet/raw/mixed), amount per meal, meals per day, notes
- When replacing current food: auto-sets end date on previous, optional "Reason for change" field
- "Save" sticky button at bottom

**5.3 — Food Detail (Past Entry)**
- Read-only view of a past food entry
- Date range, brand, product, type, amount, reason for change, notes
- Edit / Delete buttons

---

### 6. Settings

**6.1 — Settings Main**
- Account: email (display only), change password, sign out
- Preferences: weight units (kg/lbs)
- Your Pet Family: list of all pets (active and archived)
  - Active pets: tap to go to Edit Pet Profile
  - Archived pets: shown separately with "Restore" option
- App info: version number

---

### 7. Utility Screens / States

**7.1 — Quick-Add Bottom Sheet**
- Grid of options with icons: Vet Visit, Vaccination, Medication, Weight, Food Change
- Tapping opens relevant add form

**7.2 — File/Photo Attachment Viewer**
- Full-screen image preview
- Pinch to zoom
- Back to dismiss

**7.3 — Delete Confirmation Dialog**
- "Delete this [record type]?" with context
- Destructive red "Delete" button + "Cancel"

**7.4 — Archive Pet Confirmation**
- Empathetic copy: "We'll keep all of [Name]'s records safe."
- "Archive" button (not red) + "Cancel"

**7.5 — Error States**
- Network error with retry
- Generic error

**7.6 — Empty States (per section)**
- Health records empty
- Vaccinations empty
- Medications empty
- Weight history empty
- Food history empty
- Each with contextual illustration and CTA

---

## Screen Count Summary

| Section              | Screens |
|----------------------|---------|
| Auth                 | 3       |
| Dashboard            | 2       |
| Add/Edit Pet         | 2       |
| Pet Detail           | 2       |
| Health Records       | 9       |
| Food                 | 3       |
| Settings             | 1       |
| Utility / States     | 6       |
| **Total**            | **~28 unique screens/states** |

---

## Key User Flows (MVP)

**Flow 1: First-time setup**
Welcome → Sign Up → Dashboard (empty) → Add First Pet → Dashboard (with pet) → Tap pet → Pet Detail (empty, with guided prompts)

**Flow 2: Log a vet visit**
Dashboard → Tap pet → Pet Detail → FAB (+) → Quick-Add → "Vet Visit" → Add Vet Visit → Save → Pet Detail (updated)

**Flow 3: Add a vaccination**
Dashboard → Tap pet → Pet Detail → FAB (+) → Quick-Add → "Vaccination" → Add Vaccination (with smart defaults) → Save → Pet Detail

**Flow 4: Add second pet**
Dashboard → "Add to your family" card → Add Pet form → Save → Dashboard (two pets)

**Flow 5: Change food**
Dashboard → Tap pet → Pet Detail → Current Food card → Edit → "Replace Food" → Add new food → Save → Old food in history

**Flow 6: Edit or delete a record**
Pet Detail → See all health records → Tap record → Detail view → Edit or Delete

---

## States to Design For

Every list screen needs:
- **Loaded with data** (happy path)
- **Empty state** (with CTA and contextual copy using pet name)
- **Loading** (skeleton)

Every form screen needs:
- **Default** (blank for add, pre-filled for edit)
- **Validation error** (inline per field)
- **Saving** (button loading state)

Dashboard needs:
- **Empty** (no pets, first-time user)
- **With pets** (1+ pets with status summaries)
