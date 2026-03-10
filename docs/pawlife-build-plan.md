# Pawlife — MVP Build Plan

## Overview

This document breaks the MVP into sequenced units of work. Each unit is a shippable increment — at the end of each one, you have something that works end-to-end, even if incomplete. Units are ordered by dependency (each builds on the last) and by value (the most critical path comes first).

---

## Unit 1: Project Setup & Infrastructure

**Goal:** Runnable Expo app connected to a live Supabase backend with the full schema deployed.

**Tasks:**
- Create Supabase project (region: `ap-southeast-2`)
- Run all SQL migrations (tables, indexes, RLS policies, storage buckets, user creation trigger)
- Generate TypeScript types from Supabase schema (`supabase gen types typescript`)
- Scaffold Expo app (`create-expo-app` with Expo Router)
- Install core dependencies: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `nativewind`, `react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet`, `expo-blur`, `expo-image-picker`, `expo-image-manipulator`, `react-hook-form`, `zod`, `zustand`
- Set up environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- Create Supabase client (`services/supabase.ts`) with AsyncStorage session persistence
- Set up design system constants (`constants/colors.ts` with full palette, spacing, typography tokens)
- Set up project structure (`services/`, `stores/`, `hooks/`, `components/ui/`, `types/`)
- Verify: app runs on iOS simulator and Android emulator, Supabase client connects successfully

**Deliverable:** Empty app shell that boots and has a live database connection.

---

## Unit 2: Authentication

**Goal:** Users can sign up, sign in, and maintain a session across app restarts. Unauthenticated users are redirected to the welcome screen.

**Tasks:**
- Create `authService.ts` (signUp, signIn, signOut, getSession, onAuthStateChange)
- Create `authStore.ts` (Zustand store for session state)
- Build root layout (`app/_layout.tsx`) with auth state check — routes to `(auth)` or `(main)` group
- Build Welcome screen (`app/(auth)/welcome.tsx`)
- Build Sign Up screen (`app/(auth)/sign-up.tsx`) with email + password form, validation
- Build Sign In screen (`app/(auth)/sign-in.tsx`) with email + password form, validation
- Build reusable UI components needed: `Button`, `TextInput`, `Screen` (base layout wrapper)
- Handle auth errors (invalid email, weak password, wrong credentials) with inline error messages
- Verify: can sign up → lands on empty dashboard; can close app → reopen → still signed in; can sign out → returns to welcome

**Deliverable:** Working auth flow. The gate between "logged out" and "logged in" is functional.

---

## Unit 3: Dashboard & Add Pet

**Goal:** Users can add pets and see them on the dashboard. This is the first full CRUD loop touching the database.

**Tasks:**
- Create `petService.ts` (getAll, getById, create, update, archive, restore)
- Create `usePets` hook (fetches pets, manages loading/error state)
- Build Dashboard screen (`app/(main)/index.tsx`)
  - Empty state (no pets — illustration, "Add Your First Pet" CTA)
  - Populated state (pet cards in vertical list with photo, name, breed, age)
  - "Add to your family" card at bottom
- Build Add Pet screen (`app/(main)/pets/add.tsx`)
  - Pet type selector (dog/cat)
  - Name, profile photo (expo-image-picker + compression), breed (searchable dropdown), sex, DOB (with approximate age toggle), weight, microchip
  - Zod validation schema
  - Image upload to Supabase Storage (`pet-photos` bucket)
  - "Add [Name] to Your Family" CTA
- Build reusable UI components: `Card`, `PetCard`, `Avatar`, `SegmentedControl`, `SearchableDropdown`
- Create breed lists (`constants/breeds.ts` for dogs and cats)
- Build age calculation utility (`utils/dates.ts`)
- Verify: can add a pet with photo → appears on dashboard with correct age; can add multiple pets; data persists across app restarts

**Deliverable:** The core object (a pet) exists in the system. Dashboard shows your pet family.

---

## Unit 4: Pet Detail Screen

**Goal:** Tapping a pet on the dashboard opens their full profile. This is the most important screen in the app — even with empty states, it establishes the information architecture.

**Tasks:**
- Build Pet Detail screen (`app/(main)/pets/[petId]/index.tsx`)
  - Sticky header with profile photo, name, breed, age, sex, weight
  - Health summary card (empty state for now — "No health records yet")
  - Current food card (empty state — "What's [Name] eating?")
  - FAB button (+ icon, positioned bottom-right)
- Build Quick-Add Bottom Sheet component
  - Grid of options: Vet Visit, Vaccination, Medication, Weight, Food Change
  - Each option navigates to the relevant add form (placeholder screens for now)
- Build Pet Detail empty states with encouraging copy and CTAs using pet name
- Build reusable components: `StickyHeader`, `StatusPill`, `FAB`, `QuickAddSheet`
- Wire navigation: Dashboard → tap pet card → Pet Detail → back arrow → Dashboard
- Verify: can navigate to pet detail, see pet info, open quick-add sheet; empty states display correctly with pet name

**Deliverable:** The central hub of the app is navigable. Empty states guide the user to start adding data.

---

## Unit 5: Health Records — Vaccinations

**Goal:** Full CRUD for vaccinations, including smart due-date suggestions. This is the first health record type and establishes the pattern for all others.

**Tasks:**
- Create `healthService.ts` (starting with vaccination methods: getAll, getById, create, update, delete)
- Create common vaccine data (`constants/vaccines.ts` — vaccine names and typical schedules per pet type)
- Build Health Records List screen (`app/(main)/pets/[petId]/health/index.tsx`)
  - Segmented filter bar (All / Vet Visits / Vaccinations / Medications / Weight)
  - Card list filtered to vaccinations
  - Empty state for no records
  - FAB for adding
- Build Add Vaccination screen (`app/(main)/pets/[petId]/health/vaccination/add.tsx`)
  - Vaccine name dropdown (common vaccines per pet type + custom)
  - Date administered, auto-suggested next due date based on vaccine type
  - Clinic name (optional)
  - Zod validation
- Build Vaccination Detail screen (`app/(main)/pets/[petId]/health/vaccination/[id].tsx`)
  - All fields displayed, status pill (current / due soon / overdue)
  - Edit and Delete actions
- Build Edit Vaccination (reuse add form with pre-filled data)
- Build Delete confirmation dialog component (reusable)
- Update Pet Detail screen: health summary card now shows vaccination count and status pill, recent activity shows latest vaccination
- Build reusable components: `RecordCard`, `SegmentedFilter`, `DeleteConfirmation`
- Build status calculation utility (current / due soon / overdue based on next_due_date)
- Verify: full CRUD cycle works; smart due date populates correctly; status pills reflect reality; pet detail updates after adding vaccination

**Deliverable:** First health record type fully functional. The pattern (service → form → list → detail → CRUD) is established and reusable.

---

## Unit 6: Health Records — Vet Visits

**Goal:** Full CRUD for vet visits, including file/photo attachments.

**Tasks:**
- Add vet visit methods to `healthService.ts` (getAll, getById, create, update, delete)
- Create attachment upload/delete helpers in service layer (Supabase Storage `vet-attachments` bucket)
- Build Add Vet Visit screen (`app/(main)/pets/[petId]/health/vet-visit/add.tsx`)
  - Date, clinic name (with autocomplete from previous entries), reason, notes, attach file/photo
  - Image compression before upload
  - Multi-step save: insert record → upload files → create attachment records
- Build Vet Visit Detail screen (`app/(main)/pets/[petId]/health/vet-visit/[id].tsx`)
  - All fields, attachment thumbnails, edit/delete actions
- Build Edit Vet Visit (pre-filled, can add/remove attachments)
- Build File/Photo Attachment Viewer (full-screen image preview, pinch to zoom)
- Update Health Records List to show vet visits alongside vaccinations
- Update Pet Detail: health summary shows last vet visit date, recent activity includes vet visits
- Verify: can add vet visit with photo attachment; can view attachment full-screen; edit and delete work; clinic name autocomplete populates from previous entries

**Deliverable:** Vet visits with attachments working. This validates the file upload pipeline.

---

## Unit 7: Health Records — Medications

**Goal:** Full CRUD for medications, including active/completed status management.

**Tasks:**
- Add medication methods to `healthService.ts`
- Build Add Medication screen (`app/(main)/pets/[petId]/health/medication/add.tsx`)
  - Name, dosage, frequency dropdown, start date, end date (with "ongoing" toggle), prescribing vet, notes
- Build Medication Detail screen (`app/(main)/pets/[petId]/health/medication/[id].tsx`)
  - Active state: full fields, "Mark as Completed" action
  - Completed state: muted styling, no completion action
  - Edit/delete actions
- Build Edit Medication
- Update Health Records List to show medications
- Update Pet Detail: health summary shows active medication count
- Verify: full CRUD; can mark as completed; completed medications show muted styling; active count on pet detail is accurate

**Deliverable:** Medications working with active/completed lifecycle.

---

## Unit 8: Health Records — Weight

**Goal:** Full CRUD for weight entries. Lightweight records with a bottom sheet for quick entry.

**Tasks:**
- Add weight entry methods to `healthService.ts`
- Build Add Weight Entry bottom sheet (`app/(main)/pets/[petId]/health/weight/add.tsx`)
  - Large numeric input, date, optional note
  - Bottom sheet presentation (not full screen — this should be fast)
- Build Weight History List screen (accessed from health records with weight filter)
  - Simple list of entries: weight, date, note indicator
- Build Weight Entry Detail screen
  - Weight, date, note, edit/delete
- Build Edit Weight Entry
- Update Pet Detail: health summary shows current weight
- Respect user's weight unit preference (kg/lbs) from settings store
- Verify: can log weight quickly via bottom sheet; unit preference works; pet detail shows latest weight

**Deliverable:** Weight tracking working. All four health record types are complete.

---

## Unit 9: Food & Diet

**Goal:** Full CRUD for food entries with the current/historical food pattern.

**Tasks:**
- Create `foodService.ts` (getCurrent, getHistory, create, update, delete, changFood)
- Build Food Overview screen (`app/(main)/pets/[petId]/food/index.tsx`)
  - Current food card (highlighted with plum left border)
  - Food history list below
  - "Change food" action on current food card
- Build Add/Change Food screen (`app/(main)/pets/[petId]/food/add.tsx`)
  - Brand, product name, food type segmented control, amount per meal, meals per day, notes
  - When changing food: info banner about current food being archived, reason for change field
  - Service handles closing out old food (set end_date) and inserting new food (null end_date)
- Build Food Detail screen for past entries
  - Read-only with date range, all fields, reason for change
  - Edit/delete actions
- Build Edit Food
- Update Pet Detail: current food card populated from food_entries where end_date is null
- Verify: can add first food; can change food (old one appears in history); can edit/delete past entries; pet detail shows current food

**Deliverable:** Food tracking complete. All MVP data entry features are functional.

---

## Unit 10: Settings & Pet Management

**Goal:** Account settings, unit preferences, pet profile editing, and pet archiving.

**Tasks:**
- Build Settings screen (`app/(main)/settings/index.tsx`)
  - Account section: email display, change password, sign out
  - Preferences: weight unit toggle (kg/lbs), persisted via `userService.update()`
  - Pet family list: active pets (tap → edit), archived pets (with restore action)
  - App version display
- Create `settingsStore.ts` (Zustand store for weight unit preference, loaded on app start)
- Build Edit Pet Profile screen (`app/(main)/pets/[petId]/edit.tsx`)
  - Same form as Add Pet, pre-filled
  - "Save Changes" CTA
  - "Archive [Name]" option with empathetic confirmation dialog
- Build Archive Pet confirmation dialog (warm copy, non-destructive)
- Build Restore Pet action in settings
- Wire settings gear icon in dashboard header → Settings screen
- Add change password flow (Supabase `updateUser({ password })`)
- Verify: can change weight unit (reflected everywhere); can edit pet profile; can archive pet (disappears from dashboard); can restore pet from settings; can sign out

**Deliverable:** Full MVP is functional. All screens, all CRUD operations, all settings.

---

## Unit 11: Polish & QA

**Goal:** Final pass before using the app daily. Fix rough edges, ensure consistency.

**Tasks:**
- Review all screens against Stitch mockups — fix spacing, colors, typography inconsistencies
- Test all error states: network errors, validation errors, empty states
- Test multi-pet flows: add 3+ pets, verify dashboard and switching works smoothly
- Test on both iOS and Android (simulator/emulator + physical device)
- Add loading skeletons to data-heavy screens (Pet Detail, Health Records List)
- Ensure all forms handle keyboard properly (scroll to focused input, keyboard dismiss)
- Test image upload on slow connection (compression, timeout handling)
- Verify RLS: create a second test account, confirm it cannot see first account's data
- Fix any navigation edge cases (deep linking, back button behavior)
- Performance spot-check: is Pet Detail screen load time acceptable?

**Deliverable:** MVP ready for daily personal use. Stable, consistent, and pleasant to use.

---

## Summary

| Unit | Focus | Depends On |
|------|-------|------------|
| 1 | Project setup & infrastructure | — |
| 2 | Authentication | Unit 1 |
| 3 | Dashboard & Add Pet | Unit 2 |
| 4 | Pet Detail screen | Unit 3 |
| 5 | Vaccinations (CRUD) | Unit 4 |
| 6 | Vet Visits (CRUD + attachments) | Unit 4 |
| 7 | Medications (CRUD) | Unit 4 |
| 8 | Weight (CRUD) | Unit 4 |
| 9 | Food & Diet (CRUD) | Unit 4 |
| 10 | Settings & Pet Management | Unit 3 |
| 11 | Polish & QA | All units |

Units 5-9 can be built in any order after Unit 4 — they're independent of each other. The order above (vaccinations → vet visits → medications → weight → food) is suggested because each one introduces a new pattern: smart defaults (5), file uploads (6), status lifecycle (7), bottom sheet entry (8), current/historical pattern (9).

Unit 10 (Settings) only depends on Unit 3 and can be built in parallel with the health record units if you want to break up the CRUD work.
