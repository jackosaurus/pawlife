# Bemy — Stitch Design Prompts

Use these prompts in Google Stitch to generate high-fidelity mobile mockups for the Bemy app. Each prompt is self-contained and describes one screen.

## Global Design Context

Include this preamble with every prompt (or set it as a Stitch style):

> **App name:** Bemy
> **Platform:** iOS mobile app
> **Style:** Warm, modern, premium feel. Not clinical or corporate. Think premium baby tracking app aesthetic.
> **Background color:** Pale warm yellow (#FFF8E7)
> **Primary action color:** Rich plum (#4A2157) — used for primary buttons, links, FAB
> **Primary pressed/dark:** Deep plum (#341539) — used for button pressed states, header backgrounds
> **Secondary accent:** Soft coral (#E8735A) — used for highlights, status badges, secondary actions
> **Cards:** White (#FFFFFF) with subtle warm shadow, rounded corners (16px radius)
> **Primary text:** Dark warm charcoal (#2D2A26)
> **Secondary text:** Medium warm gray (#7A756E)
> **Typography:** Clean, modern sans-serif (SF Pro or Inter). Generous line height. Pet names in semi-bold.
> **Corners:** Rounded everywhere — buttons, cards, inputs, avatars
> **Spacing:** Generous whitespace, nothing cramped
> **Icons:** Rounded, friendly line icons (Phosphor or SF Symbols style)
> **No bottom tab bar.** Navigation is drill-down: Dashboard → Pet Detail → Records. Settings via gear icon.

---

## Screen Prompts

---

### PROMPT 01 — Welcome Screen

Design a mobile welcome screen for Bemy, a pet care app. Pale warm yellow background (#FFF8E7). Centered layout.

At the top center, show the Bemy logo — a friendly, modern wordmark with a small paw print integrated into the letter "a". Below the logo, a warm hand-drawn style illustration of a golden retriever and a tabby cat sitting side by side, looking happy and relaxed.

Below the illustration, the tagline in dark charcoal text: "A digital home for your pet family" in medium weight, centered.

Two buttons stacked vertically at the bottom third of the screen:
- Primary button: "Get Started" — rich plum (#4A2157) background, white text, full width with rounded corners, large tap target
- Secondary button: "Sign In" — text-only button in plum, no background

Clean, minimal, warm. No other navigation or text. The screen should feel inviting and personal.

---

### PROMPT 02 — Sign Up

Design a mobile sign up screen for Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow icon. Center top: "Create Account" as a heading in dark charcoal, semi-bold.

Below, two input fields on white card-style containers with rounded corners and warm light gray borders:
- Email field with email icon, placeholder "Email address"
- Password field with lock icon, placeholder "Create a password", with show/hide toggle

Below the fields, a large full-width primary button: "Create Account" in rich plum (#4A2157) with white text, rounded corners.

At the bottom, centered text: "Already have an account? Sign In" where "Sign In" is plum colored and tappable.

No social login buttons. No terms and conditions. Clean and minimal with generous spacing between elements.

---

### PROMPT 03 — Sign In

Design a mobile sign in screen for Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow icon. Center top: "Welcome Back" as a heading in dark charcoal, semi-bold. Below it, a smaller subheading in warm gray: "Sign in to see your pet family."

Two input fields on white card-style containers with rounded corners:
- Email field with email icon, placeholder "Email address"
- Password field with lock icon, placeholder "Password", with show/hide toggle

Below the fields, a large full-width primary button: "Sign In" in rich plum (#4A2157) with white text, rounded corners.

At the bottom, centered text: "Don't have an account? Get Started" where "Get Started" is plum colored and tappable.

Clean, warm, minimal. Same styling as the sign up screen for consistency.

---

### PROMPT 04 — Dashboard (Empty State)

Design a mobile dashboard screen for Bemy showing an empty state for a first-time user with no pets added yet. Pale warm yellow background (#FFF8E7).

Top left: "Your Pet Family" as a large heading in dark charcoal. Top right: a gear/settings icon in warm gray.

Center of the screen: a warm, friendly illustration of an empty cozy pet bed with a small paw print trail leading to it. Below the illustration, text in warm gray: "Welcome to Bemy!" in semi-bold, and below that: "Let's meet your pet family" in regular weight.

Below the text, a prominent button: "Add Your First Pet" in rich plum (#4A2157), white text, rounded corners, with a small "+" icon before the text.

The screen should feel warm and inviting, not empty or broken. The illustration and copy should make the user excited to add their first pet.

---

### PROMPT 05 — Dashboard (With Pets)

Design a mobile dashboard screen for Bemy showing two pets. Pale warm yellow background (#FFF8E7).

Top left: "Your Pet Family" as a large heading in dark charcoal. Top right: a gear/settings icon in warm gray.

Below, two pet cards stacked vertically, each as a white card with rounded corners and subtle shadow:

Card 1: A golden retriever. Left side: large circular profile photo of the dog. Right side: name "Luna" in semi-bold charcoal, below it "Golden Retriever · 3 years, 2 months" in warm gray, and a small sage green status pill that says "All up to date".

Card 2: A tabby cat. Left side: large circular profile photo of the cat. Right side: name "Milo" in semi-bold charcoal, below it "Domestic Shorthair · 5 years, 8 months" in warm gray, and a small warm amber status pill that says "1 vaccination due soon".

Below the pet cards, an "Add to your family" card with dashed warm gray border, a "+" icon, and warm gray text. This card is less prominent than the pet cards.

The pet cards should feel tappable and personal. The circular photos should be large enough to see the pet clearly.

---

### PROMPT 06 — Add Pet

Design a mobile "Add Pet" form screen for Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Center top: "Add to Your Family" heading in dark charcoal.

The form is a single scrollable screen with grouped sections on white cards:

**Section 1: Pet Type**
Two large tappable cards side by side: one with a dog illustration labeled "Dog", one with a cat illustration labeled "Cat". The "Dog" card is selected with a plum border and subtle plum tint.

**Section 2: Photo & Name**
A large circular photo placeholder with a camera icon and "Add Photo" text. Next to it or below, a text input field: "What's their name?" with the value "Luna" entered.

**Section 3: Details**
Stacked input fields in a white card:
- Breed: dropdown showing "Golden Retriever" with a chevron
- Sex: segmented control with "Male" / "Female" / "Unknown" — "Female" selected in plum
- Date of Birth: date field showing "March 15, 2023" with a small toggle below: "I'm not sure — enter approximate age"

**Section 4: Optional**
A white card with slightly muted styling, header "Optional" in warm gray:
- Weight: number input with "kg" unit label
- Microchip: text input with placeholder "Microchip number"

At the bottom, sticky: a large plum primary button: "Add Luna to Your Family" with a heart or paw icon.

The form should feel friendly, not like a government document. Generous spacing, clear labels, warm tone.

---

### PROMPT 07 — Edit Pet Profile

Design a mobile "Edit Pet Profile" screen for Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Top right: "Cancel" in plum text. Center top: "Edit Profile" heading.

Same form layout as the Add Pet screen, but all fields pre-filled with Luna's data:
- Large circular photo of a golden retriever with a small pencil/edit overlay icon
- Name: "Luna"
- Breed: "Golden Retriever"
- Sex: "Female" selected
- Date of Birth: "March 15, 2023"
- Weight: "28.5 kg"
- Microchip: "982000123456789"

Sticky bottom: "Save Changes" plum primary button.

Below the button, separated by extra spacing: "Archive Luna" as a muted warm gray text link (not a button, not red, not prominent). This is intentionally de-emphasized.

---

### PROMPT 08 — Pet Detail (With Data)

Design a mobile pet detail screen for Bemy — this is the most important screen in the app. Pale warm yellow background (#FFF8E7).

**Sticky Header:** A large hero section at the top with a big circular profile photo of a golden retriever named Luna, centered. Below the photo: "Luna" in large semi-bold charcoal text, and below that "Golden Retriever · 3 years, 2 months" in warm gray with a small dog icon badge. Below that, "Female · 28.5 kg" in smaller warm gray text.

**Scrollable Content Below:**

**Health Summary Card** — White card with rounded corners:
- Title: "Health" in semi-bold with a heart icon
- Row of compact stats:
  - "Vaccinations" with sage green pill "Up to date"
  - "Medications" with text "1 active"
  - "Last vet visit" with text "2 weeks ago"
- At the bottom of the card: "See all health records →" as a plum text link

**Recent Activity Section** — Title: "Recent Activity" in semi-bold
Three compact horizontal cards stacked:
1. Syringe icon + "Rabies Booster" + "Feb 15, 2026" + green pill "Current"
2. Pill icon + "Heartworm Prevention" + "Mar 1, 2026" + green pill "Active"
3. Stethoscope icon + "Annual Checkup" + "Feb 15, 2026"

**Current Food Card** — White card:
- Title: "What Luna's Eating" with a bowl icon
- "Royal Canin Golden Retriever Adult" in semi-bold
- "Dry · 2 cups per meal · 2 meals per day"
- "On this food since Jan 2025" in warm gray
- Small edit icon in top right corner of the card

**Floating Action Button (FAB):** Bottom right corner, a circular plum button with a white "+" icon, slightly elevated with shadow.

The screen should feel rich with information but not cluttered. Cards create clear visual separation. The pet's photo and name dominate the top and create an emotional anchor.

---

### PROMPT 09 — Pet Detail (Empty State)

Design a mobile pet detail screen for Bemy for a pet that was just added with no records yet. Pale warm yellow background (#FFF8E7).

**Header:** Same as the populated version — large circular photo of Luna the golden retriever, name, breed, age details.

**Below, the content sections show encouraging empty states:**

**Health Card** — White card with rounded corners:
- Small friendly illustration of a dog with a heart
- Text: "No health records yet" in warm gray semi-bold
- Below: "Start building Luna's health history" in warm gray
- Teal button: "Add First Record"

**Food Card** — White card:
- Small friendly illustration of a food bowl
- Text: "What's Luna eating?" in warm gray semi-bold
- Below: "Keep track of Luna's diet and food changes" in warm gray
- Teal button: "Add Current Food"

**FAB:** Same "plum "+" button in bottom right.

The empty states should feel encouraging and guide the user to take action, not feel like an error or missing data.

---

### PROMPT 10 — Quick-Add Bottom Sheet

Design a mobile bottom sheet overlay for Bemy's quick-add menu. The background shows the pet detail screen (dimmed). The bottom sheet slides up from the bottom with a white background, rounded top corners, and a small drag handle at the top.

Title on the sheet: "Add for Luna" in semi-bold charcoal.

A 2x3 grid of tappable option tiles, each as a small white card with subtle border:
1. Stethoscope icon + "Vet Visit" — plum icon
2. Syringe icon + "Vaccination" — plum icon
3. Pill icon + "Medication" — plum icon
4. Scale icon + "Weight" — plum icon
5. Bowl icon + "Food Change" — plum icon

Each tile has the icon above the label, centered. Icons are in plum, labels in charcoal. Tiles have rounded corners and are evenly spaced.

The bottom sheet should feel quick and lightweight — a springboard to the right form, not a destination itself.

---

### PROMPT 11 — Health Records List (All Records)

Design a mobile health records list screen for Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Header: Luna's small circular avatar + "Luna's Health Records" in semi-bold.

Below the header: a horizontal segmented filter bar with pill-shaped segments: "All" (selected, plum background, white text), "Vet Visits", "Vaccinations", "Medications", "Weight" (all unselected in warm gray). The bar is horizontally scrollable.

Below, a reverse-chronological list of health record cards on white backgrounds:

Card 1: Green syringe icon | "Rabies Booster" | "Feb 15, 2026" | Sage green pill "Current"
Card 2: Teal pill icon | "Heartworm Prevention — Started" | "Mar 1, 2026" | Green pill "Active"
Card 3: Teal stethoscope icon | "Annual Checkup — City Vet Clinic" | "Feb 15, 2026"
Card 4: Scale icon | "Weight: 28.5 kg" | "Feb 15, 2026"
Card 5: Syringe icon | "DHPP Booster" | "Nov 10, 2025" | Green pill "Current"
Card 6: Stethoscope icon | "Dental Cleaning — City Vet Clinic" | "Sep 3, 2025"

Each card has a right chevron indicating it's tappable. Cards have consistent padding and spacing.

FAB: Teal "+" button in bottom right.

The list should feel scannable — you should be able to quickly find what you're looking for by icon type, date, and status color.

---

### PROMPT 12 — Health Records List (Vaccinations Filter)

Design the same health records list screen as above, but with the "Vaccinations" segment selected (plum background, white text). Only vaccination records are shown:

Card 1: Syringe icon | "Rabies" | "Administered: Feb 15, 2026" | "Next due: Feb 2029" | Sage green pill "Current"
Card 2: Syringe icon | "DHPP" | "Administered: Nov 10, 2025" | "Next due: Nov 2026" | Amber pill "Due in 8 months"
Card 3: Syringe icon | "Bordetella" | "Administered: Aug 20, 2025" | "Next due: Aug 2026" | Amber pill "Due in 5 months"
Card 4: Syringe icon | "Leptospirosis" | "Administered: Jun 5, 2025" | "Next due: Jun 2026" | Warm gray pill "Upcoming"

Same layout, back arrow, avatar header, FAB.

---

### PROMPT 13 — Add Vet Visit

Design a mobile form screen for adding a vet visit in Bemy. Pale warm yellow background (#FFF8E7).

Top left: "Cancel" in plum. Center: "Log Vet Visit" heading. Top right: nothing.

Small context line below heading: Luna's avatar (tiny) + "for Luna" in warm gray.

Form fields on white cards with rounded corners, stacked vertically:

**Date:** Date picker field showing "March 10, 2026" (defaulting to today), with a calendar icon.

**Clinic Name:** Text input with placeholder "Where did you go?" and a building icon. Below the field, two small suggestion chips from previous entries: "City Vet Clinic", "Pawsome Animal Hospital" in warm gray pill shapes.

**Reason:** Text input with placeholder "What was the visit for?" — example: "Annual checkup"

**Notes:** Multiline text area with placeholder "Any additional details..." — taller than single-line fields, with a subtle inner border.

**Attachments:** A dashed-border area with a paperclip icon: "Add photos or files" — tappable to open camera/file picker. If a file were attached, show a thumbnail with an X to remove.

Sticky bottom: Large plum "Save" button, full width.

The form should feel quick and easy. Not too many fields, clear labels, obvious defaults.

---

### PROMPT 14 — Vet Visit Detail

Design a mobile detail screen for a vet visit record in Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Top right: "Edit" in plum text.

Header area: Stethoscope icon in plum + "Vet Visit" label in warm gray + date "February 15, 2026" in charcoal semi-bold.

Content on a white card with sections:

**Clinic:** "City Vet Clinic" with a small building icon
**Reason:** "Annual Checkup"
**Notes:** A paragraph of text: "Luna's annual checkup went well. Weight is stable. Vet recommended switching to senior food in the next year. Teeth look good — no dental cleaning needed this time. Rabies booster administered during this visit."

**Attachments:** A row of two image thumbnails showing scanned vet receipts, tappable to view full screen.

At the bottom of the card, a muted "Delete" text link in soft coral (#E8735A), separated from the main content by spacing and a divider.

The detail screen should feel like reading a clean, organized note about the visit — scannable but complete.

---

### PROMPT 15 — Add Vaccination

Design a mobile form screen for adding a vaccination in Bemy. Pale warm yellow background (#FFF8E7).

Top left: "Cancel" in plum. Center: "Add Vaccination" heading.

Small context line: Luna's tiny avatar + "for Luna" in warm gray.

Form fields stacked vertically on white cards:

**Vaccine Name:** Dropdown field showing "Select vaccine" with a chevron. When tapped, it would show a list of common dog vaccines: Rabies, DHPP, Bordetella, Leptospirosis, Canine Influenza, Lyme, + "Other (custom)" at the bottom. For this mockup, show "Rabies" selected.

**Date Administered:** Date picker showing "March 10, 2026".

**Next Due Date:** Date picker showing "March 10, 2029" with a small helper text below in warm gray: "Auto-suggested based on Rabies schedule. You can adjust this." The field has a subtle plum highlight/border to indicate it was auto-filled.

**Clinic / Vet:** Text input with placeholder "Who administered it?" — optional label in warm gray.

Sticky bottom: Large plum "Save" button.

The auto-suggestion of the next due date is a key UX moment — it should feel helpful and smart, not presumptuous. The helper text makes it clear the user is in control.

---

### PROMPT 16 — Vaccination Detail

Design a mobile detail screen for a vaccination record. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Top right: "Edit" in plum.

Header: Syringe icon in plum + "Vaccination" label in warm gray.

White card with clear field layout:

**Vaccine:** "Rabies" in semi-bold charcoal
**Status:** Sage green pill badge: "Current"
**Administered:** "February 15, 2026"
**Next Due:** "February 2029"
**Clinic:** "City Vet Clinic"

A subtle timeline indicator or progress bar showing how far through the vaccination cycle Luna is (e.g., a thin plum progress bar showing ~10% through the 3-year cycle).

Bottom: muted "Delete" link in soft coral, same pattern as vet visit detail.

---

### PROMPT 17 — Add Medication

Design a mobile form screen for adding a medication in Bemy. Pale warm yellow background (#FFF8E7).

Top left: "Cancel" in plum. Center: "Add Medication" heading. Context: Luna's avatar + "for Luna".

Form fields on white cards:

**Medication Name:** Text input, placeholder "What medication?" — example value: "Heartgard Plus"

**Dosage:** Text input, placeholder "e.g., 1 tablet, 25mg"

**Frequency:** Dropdown field with options visible: "Daily", "Twice daily", "Weekly", "Monthly", "Custom". "Monthly" is selected.

**Start Date:** Date picker showing "March 1, 2026"

**End Date:** Date picker with placeholder "Ongoing if left empty" and a toggle: "This is ongoing" (toggled on, which disables the date field)

**Prescribing Vet:** Text input, placeholder "Who prescribed it?" — marked as "Optional" in warm gray.

**Notes:** Multiline text area, placeholder "Any additional details..."

Sticky bottom: Large plum "Save" button.

---

### PROMPT 18 — Medication Detail

Design a mobile detail screen for a medication record. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Top right: "Edit" in plum.

Header: Pill icon in plum + "Medication" label + green pill "Active".

White card:

**Medication:** "Heartgard Plus" in semi-bold
**Dosage:** "1 chewable tablet (68-136 lbs)"
**Frequency:** "Monthly"
**Started:** "March 1, 2026"
**End Date:** "Ongoing"
**Prescribed by:** "Dr. Sarah Kim, City Vet Clinic"
**Notes:** "Give on the 1st of each month. Luna takes it easily in a treat."

Two action buttons at the bottom of the card:
- "Mark as Completed" — outlined plum button
- "Delete" — muted coral text link

---

### PROMPT 19 — Weight Log (List View)

Design a mobile weight history screen for Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Header: Scale icon + "Luna's Weight History" in semi-bold.

A vertical list of weight entry cards, most recent first. Each card is a compact white card:

Entry 1: "28.5 kg" in semi-bold | "March 10, 2026" | No note
Entry 2: "28.2 kg" in semi-bold | "February 15, 2026" | Small note icon indicating a note exists
Entry 3: "27.8 kg" in semi-bold | "November 10, 2025"
Entry 4: "27.5 kg" in semi-bold | "August 20, 2025"
Entry 5: "26.0 kg" in semi-bold | "March 15, 2025" | Note: "Post-surgery recovery"

Each card has a right chevron for tapping into the detail view.

FAB: Teal "+" button for adding a new weight entry.

The list is simple and scannable. Weight values are prominent, dates are secondary.

---

### PROMPT 20 — Add Weight Entry (Bottom Sheet)

Design a mobile bottom sheet for logging a weight entry in Bemy. The background shows the weight history screen (dimmed). The bottom sheet has white background, rounded top corners, drag handle.

Title: "Log Weight" with Luna's tiny avatar.

**Weight Input:** A large, prominent number input field centered on the sheet, with large font. Shows "28.5" with "kg" unit label to the right. The number input should feel like the hero element — big and easy to type.

**Date:** A date picker below, defaulting to "Today, March 10, 2026" with a calendar icon. Compact, not full-screen.

**Note:** A small optional text input: "Add a note (optional)" with a single-line field.

**Save Button:** Full-width plum button at the bottom of the sheet.

The bottom sheet should feel fast and lightweight — log a weight in under 5 seconds.

---

### PROMPT 21 — Food Overview

Design a mobile food overview screen for Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Header: Bowl icon + "Luna's Food" in semi-bold.

**Current Food Card (Highlighted):** A white card with a subtle plum left border to indicate it's the current food:
- "Royal Canin Golden Retriever Adult" in semi-bold
- "Dry Food" in a small warm gray pill
- "2 cups per meal · 2 meals per day"
- "On this food since January 15, 2025 (1 year, 2 months)"
- Top right: small edit icon in warm gray
- Bottom of card: "Change food" link in plum

**Food History Section:** Title: "Previous Foods"

Past food cards in warm gray styling (less prominent than current):

Card 1: "Blue Buffalo Life Protection" | "Dry · Nov 2023 — Jan 2025" | Small note: "Switched on vet recommendation"
Card 2: "Purina Pro Plan Puppy" | "Dry · Mar 2023 — Nov 2023" | Small note: "Puppy food"

Each card is tappable with a right chevron.

The current food should be visually dominant. History is there for reference but secondary.

---

### PROMPT 22 — Add/Change Food

Design a mobile form screen for adding or changing a pet's food in Bemy. Pale warm yellow background (#FFF8E7).

Top left: "Cancel" in plum. Center: "Change Luna's Food" heading.

A small info banner at the top in a pale plum background: "Luna's current food (Royal Canin Golden Retriever Adult) will be saved to her food history."

Form fields on white cards:

**Brand:** Text input, placeholder "Food brand" — example: "Hill's Science Diet"

**Product Name:** Text input, placeholder "Product name" — example: "Adult Large Breed"

**Food Type:** Segmented control: "Dry" / "Wet" / "Raw" / "Mixed" — "Dry" selected in plum.

**Amount Per Meal:** Text input with placeholder "e.g., 2 cups, 150g"

**Meals Per Day:** Stepper control or small number input showing "2" with - and + buttons.

**Reason for Change:** Text input, placeholder "Why the change? (optional)" — example values as suggestion chips below: "Vet recommended", "Digestive issues", "Age change", "Preference"

**Notes:** Multiline text area, placeholder "Any additional notes..."

Sticky bottom: Large plum "Save" button.

---

### PROMPT 23 — Food Detail (Past Entry)

Design a mobile detail screen for a past food entry in Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Top right: "Edit" in plum.

Header: Bowl icon in warm gray + "Previous Food" label.

White card with fields:

**Brand & Product:** "Blue Buffalo Life Protection — Chicken & Brown Rice" in semi-bold
**Type:** "Dry Food" pill
**Amount:** "1.5 cups per meal · 2 meals per day"
**Period:** "November 2023 — January 2025 (1 year, 2 months)"
**Reason for Change:** "Switched on vet recommendation — Luna was gaining weight"
**Notes:** "Luna liked this food but was gaining weight on the recommended serving size."

Bottom: muted "Delete" link in soft coral.

---

### PROMPT 24 — Settings

Design a mobile settings screen for Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Header: "Settings" in semi-bold.

Grouped sections on white cards:

**Account**
- Email: "alex@example.com" (display only, warm gray)
- "Change Password" — tappable row with right chevron
- "Sign Out" — tappable row in soft coral text

**Preferences**
- "Weight Units" — tappable row showing "kg" with right chevron (tapping opens a simple toggle between kg and lbs)

**Your Pet Family**
- Section header: "Active"
  - Row: Luna's small avatar + "Luna" + "Golden Retriever" — right chevron (→ Edit Profile)
  - Row: Milo's small avatar + "Milo" + "Domestic Shorthair" — right chevron
- Section header: "Archived" (shown only if archived pets exist)
  - Row: Max's small grayed-out avatar + "Max" + "Labrador Retriever" — "Restore" button in plum on the right

**App**
- "Version 1.0.0" in warm gray, centered, small text

Clean, standard settings layout. Nothing fancy, but consistent with the app's warm styling.

---

### PROMPT 25 — Archive Pet Confirmation

Design a mobile confirmation dialog/modal for archiving a pet in Bemy. Semi-transparent dark overlay on the background. Centered white card with rounded corners.

At the top of the card: a small, warm illustration of a dog sleeping peacefully (or a gentle paw print).

Title: "Archive Luna?" in semi-bold charcoal.

Body text in warm gray: "We'll keep all of Luna's records safe and sound. You can find them anytime in Settings and restore Luna's profile whenever you'd like."

Two buttons stacked:
- "Archive Luna" — outlined warm gray button (not red, not aggressive)
- "Cancel" — plum text link below

The dialog should feel gentle and respectful. No alarm, no urgency. This is a sensitive moment.

---

### PROMPT 26 — Delete Record Confirmation

Design a mobile confirmation dialog for deleting a health record in Bemy. Semi-transparent dark overlay. Centered white card with rounded corners.

Title: "Delete this vet visit?" in semi-bold charcoal.

Body text in warm gray: "This will permanently remove the record from Luna's health history. This can't be undone."

Two buttons:
- "Delete" — soft coral (#E8735A) filled button, white text
- "Cancel" — warm gray text link below

Small and focused. Standard destructive confirmation pattern but using the app's warm color palette rather than harsh red.

---

### PROMPT 27 — Weight Entry Detail

Design a mobile detail screen for a single weight entry in Bemy. Pale warm yellow background (#FFF8E7).

Top left: back arrow. Top right: "Edit" in plum.

Header: Scale icon in plum + "Weight Entry" label.

White card:

**Weight:** "28.5 kg" in large semi-bold charcoal — this should be the dominant visual element
**Date:** "February 15, 2026"
**Note:** "Weighed at City Vet Clinic during annual checkup"

Bottom: muted "Delete" link in soft coral.

Simple and minimal — weight entries are lightweight records.

---

### PROMPT 28 — Medication Detail (Completed)

Design a mobile detail screen for a completed medication in Bemy. Pale warm yellow background (#FFF8E7).

Same layout as the active medication detail (Prompt 18) but with differences:

Header: Pill icon in warm gray (not plum) + "Medication" label + warm gray pill "Completed"

**Medication:** "Amoxicillin" in semi-bold
**Dosage:** "500mg, 1 capsule"
**Frequency:** "Twice daily"
**Started:** "January 10, 2026"
**Ended:** "January 24, 2026"
**Prescribed by:** "Dr. Sarah Kim, City Vet Clinic"
**Notes:** "14-day course for ear infection. Completed full course."

The "Mark as Completed" button is gone (already completed). Only "Edit" in the top right and "Delete" link at the bottom.

The completed state should feel slightly muted compared to active — warm gray tones instead of plum accents — to visually communicate that this is historical, not current.

---

### PROMPT 29 — Edit Vet Visit (Pre-filled Form)

Design the same form layout as Add Vet Visit (Prompt 13) but as an edit screen. Pale warm yellow background (#FFF8E7).

Top left: "Cancel" in plum. Center: "Edit Vet Visit" heading. Context: Luna's avatar + "for Luna".

All fields pre-filled:
- Date: "February 15, 2026"
- Clinic: "City Vet Clinic"
- Reason: "Annual Checkup"
- Notes: Pre-filled with existing note text
- Attachments: Two existing thumbnail images with small X buttons to remove

Sticky bottom: Large plum "Save Changes" button.

The form should look identical to the add form but with data populated and the heading/button updated.

---

### PROMPT 30 — Health Records List (Empty State)

Design the health records list screen for a pet with no records yet. Pale warm yellow background (#FFF8E7).

Same header as the populated version: back arrow, Luna's avatar + "Luna's Health Records". Same segmented filter bar (with "All" selected).

Center of the content area: a warm illustration of a dog with a little medical bag or stethoscope.

Text: "No health records yet" in warm gray semi-bold.
Below: "Start tracking Luna's health to keep everything in one place" in warm gray.

Teal button: "Add First Record" (which opens the quick-add bottom sheet).

FAB also present in bottom right.

Encouraging, not empty-feeling. The illustration and copy should motivate the user to start logging.
