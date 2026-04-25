# Pawlife — Tech Stack

## Overview

Cross-platform mobile app (iOS + Android) with a lean cloud backend. Optimized for fast development by a solo engineer, easy iteration, and a clear migration path if the app outgrows its initial infrastructure.

---

## Frontend — React Native (Expo)

**Framework:** React Native via Expo (managed workflow)

**Why Expo over bare React Native:**
- Expo handles the build toolchain, OTA updates, push notifications, and native module linking. As a solo dev, this saves significant time on iOS/Android build configuration.
- `expo-dev-client` gives you escape hatches to native modules when needed (e.g., future iOS widget).
- EAS Build handles app store submissions.
- OTA updates via `expo-updates` let you ship bug fixes without app store review cycles.

**Navigation:** Expo Router (file-based routing, built on React Navigation)
- Maps cleanly to the drill-down IA: `/dashboard` → `/pets/[id]` → `/pets/[id]/health` → `/pets/[id]/health/[recordId]`
- Supports native stack transitions, modal presentations, and bottom sheets out of the box

**UI Components & Styling:**
- React Native's built-in components + a lightweight component library
- `nativewind` (Tailwind CSS for React Native) for utility-first styling — keeps styling consistent and fast
- `expo-blur` for iOS glass/frosted effects on headers and overlays (progressive enhancement — devices/platforms that don't support it fall back to solid backgrounds with opacity)
- `react-native-reanimated` for smooth animations (card transitions, FAB, bottom sheets)
- `react-native-gesture-handler` for swipe-to-delete, pull-to-refresh
- `@gorhom/bottom-sheet` for the quick-add sheet and lightweight forms
- Custom color tokens matching the design system (pale yellow, plum, coral, etc.)

**State Management:** Zustand
- Lightweight, minimal boilerplate, works well with async data
- One store per domain: `usePetStore`, `useHealthStore`, `useFoodStore`
- No Redux complexity for an app this size

**Data Fetching:** Direct Supabase calls via service layer + useState/useEffect
- Service layer (`/services/*.ts`) wraps all Supabase calls — components never touch Supabase directly
- Standard React hooks for loading/error states
- TanStack Query can be added later by wrapping existing service functions in `useQuery` hooks — the service layer makes this a non-breaking addition

**Forms:** React Hook Form + Zod
- React Hook Form for performant form state (no re-renders on every keystroke)
- Zod for schema validation shared between frontend and backend (e.g., vaccination form schema)

**Image Handling:**
- `expo-image-picker` for profile photos and vet visit attachments
- `expo-image-manipulator` for compression before upload (critical for mobile data and storage costs)
- `expo-file-system` for local caching

---

## Backend — Supabase

**Why Supabase:**
- Postgres database, auth, file storage, and auto-generated REST API in one platform
- Row Level Security (RLS) means your auth rules live in the database, not in application code
- Generous free tier for MVP; predictable scaling costs
- You're a solo dev — Supabase eliminates the need to build and host your own API layer

**Database: Postgres (hosted by Supabase)**

Core tables:

```
users
  - id (uuid, PK, from auth.users)
  - email
  - weight_unit_preference (kg | lbs)
  - created_at

pets
  - id (uuid, PK)
  - user_id (FK → users)
  - pet_type (dog | cat)
  - name
  - breed
  - date_of_birth
  - approximate_age_months (nullable, for rescues)
  - sex (male | female | unknown)
  - weight (decimal, nullable)
  - microchip_number (nullable)
  - profile_photo_url (nullable)
  - is_archived (boolean, default false)
  - created_at
  - updated_at

vet_visits
  - id (uuid, PK)
  - pet_id (FK → pets)
  - date
  - clinic_name
  - reason
  - notes (text, nullable)
  - created_at
  - updated_at

vet_visit_attachments
  - id (uuid, PK)
  - vet_visit_id (FK → vet_visits)
  - file_url
  - file_type (image | document)
  - created_at

vaccinations
  - id (uuid, PK)
  - pet_id (FK → pets)
  - vaccine_name
  - date_administered
  - next_due_date (nullable)
  - clinic_name (nullable)
  - created_at
  - updated_at

medications
  - id (uuid, PK)
  - pet_id (FK → pets)
  - name
  - dosage
  - frequency
  - start_date
  - end_date (nullable — null means ongoing)
  - prescribing_vet (nullable)
  - notes (text, nullable)
  - is_archived (boolean, default false)
  - archived_at (timestamp, nullable)
  - created_at
  - updated_at

weight_entries
  - id (uuid, PK)
  - pet_id (FK → pets)
  - weight (decimal)
  - date
  - note (text, nullable)
  - created_at

food_entries
  - id (uuid, PK)
  - pet_id (FK → pets)
  - brand
  - product_name
  - food_type (dry | wet | raw | mixed)
  - amount_per_meal
  - meals_per_day (integer)
  - start_date
  - end_date (nullable — null means current)
  - reason_for_change (nullable)
  - notes (text, nullable)
  - created_at
  - updated_at
```

**Auth: Supabase Auth (GoTrue)**
- Email + password for MVP
- Social auth (Apple, Google) is a config change in Supabase when ready for Phase 2
- JWT tokens, handled by the Supabase client SDK
- RLS policies enforce that users can only access their own pets and records

**Storage: Supabase Storage**
- Bucket for pet profile photos
- Bucket for vet visit attachments
- Compress images client-side before upload (target ~500KB max)
- Public URL generation for profile photos, signed URLs for attachments

**Row Level Security Policies:**
- All tables: `user_id = auth.uid()` (direct or via pet ownership join)
- This means no API middleware needed — the database enforces access control
- Example: a user can only read/write vaccinations for pets they own

**Edge Functions (minimal use in MVP):**
- Only if needed for logic that can't live client-side
- Potential use: auto-suggesting vaccination due dates based on vaccine type + pet type
- Keep these thin — don't build a full API layer on Edge Functions

---

## Architecture Pattern

```
┌─────────────────────────────────┐
│         React Native App        │
│    (Expo, Expo Router, Zustand) │
│                                 │
│  ┌───────────┐  ┌────────────┐  │
│  │ Services  │──│  Supabase  │  │
│  │  Layer    │  │  JS Client │  │
│  └───────────┘  └─────┬──────┘  │
└────────────────────────┼────────┘
                         │
              ┌──────────┴──────────┐
              │      Supabase       │
              │                     │
              │  ┌───────────────┐  │
              │  │   Postgres    │  │
              │  │   + RLS       │  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │     Auth      │  │
              │  │   (GoTrue)    │  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │   Storage     │  │
              │  │   (S3-compat) │  │
              │  └───────────────┘  │
              └─────────────────────┘
```

**Key principle: thin service layer.** All Supabase calls go through a `/services` directory with one file per domain (`petService.ts`, `healthService.ts`, `foodService.ts`). Components never call Supabase directly. This is what makes migration off Supabase straightforward — you swap the service implementations, not 50 scattered client calls.

---

## Project Structure

```
pawlife/
├── app/                          # Expo Router file-based routes
│   ├── (auth)/                   # Auth group (no layout chrome)
│   │   ├── welcome.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (main)/                   # Authenticated app group
│   │   ├── _layout.tsx           # Main layout (no tab bar)
│   │   ├── index.tsx             # Dashboard
│   │   ├── pets/
│   │   │   ├── add.tsx
│   │   │   └── [petId]/
│   │   │       ├── index.tsx     # Pet detail
│   │   │       ├── edit.tsx
│   │   │       ├── health/
│   │   │       │   ├── index.tsx # Health records list
│   │   │       │   ├── vet-visit/
│   │   │       │   │   ├── add.tsx
│   │   │       │   │   └── [id].tsx  # Detail + edit
│   │   │       │   ├── vaccination/
│   │   │       │   │   ├── add.tsx
│   │   │       │   │   └── [id].tsx
│   │   │       │   ├── medication/
│   │   │       │   │   ├── add.tsx
│   │   │       │   │   └── [id].tsx
│   │   │       │   └── weight/
│   │   │       │       ├── add.tsx
│   │   │       │       └── [id].tsx
│   │   │       └── food/
│   │   │           ├── index.tsx # Food overview
│   │   │           ├── add.tsx
│   │   │           └── [id].tsx
│   │   └── settings/
│   │       └── index.tsx
│   └── _layout.tsx               # Root layout (auth check)
├── components/
│   ├── ui/                       # Reusable primitives (Button, Card, Input, Badge, BottomSheet)
│   ├── pets/                     # Pet-specific components (PetCard, PetHeader, PetSelector)
│   ├── health/                   # Health components (RecordCard, StatusPill, VaccineDropdown)
│   └── food/                     # Food components (FoodCard, FoodTypeSelector)
├── services/
│   ├── supabase.ts               # Supabase client init
│   ├── authService.ts
│   ├── petService.ts
│   ├── healthService.ts
│   └── foodService.ts
├── stores/
│   ├── authStore.ts
│   ├── petStore.ts
│   └── settingsStore.ts
├── hooks/
│   ├── usePets.ts                # Data fetching hooks for pets
│   ├── useHealth.ts
│   └── useFood.ts
├── types/
│   └── index.ts                  # TypeScript types + Zod schemas
├── constants/
│   ├── colors.ts                 # Design system colors
│   ├── vaccines.ts               # Common vaccines per pet type
│   └── breeds.ts                 # Breed lists for dogs and cats
├── utils/
│   ├── dates.ts                  # Age calculation, date formatting
│   └── images.ts                 # Compression, upload helpers
└── assets/
    ├── illustrations/            # Empty state illustrations, onboarding art
    └── icons/                    # Custom icons if needed
```

---

## Development Tooling

| Tool | Purpose |
|------|---------|
| TypeScript | Type safety everywhere, shared types between layers |
| ESLint + Prettier | Code formatting, consistency |
| EAS Build | Cloud builds for iOS and Android |
| EAS Submit | App store submission |
| Expo Dev Client | Development builds with native module support |

---

## Migration Path (If Outgrowing Supabase)

| Component | Current | Migration Target | Effort |
|-----------|---------|-----------------|--------|
| Database | Supabase Postgres | AWS RDS / Cloud SQL / self-hosted Postgres | Low — pg_dump, same Postgres |
| Auth | Supabase Auth (GoTrue) | Clerk / Auth0 / self-hosted | Medium — token migration, SDK swap |
| Storage | Supabase Storage | AWS S3 / Cloudflare R2 | Low — S3-compatible API |
| API Layer | Supabase auto-generated REST | Custom API (Node/Express, Fastify, or tRPC) | Medium — build what Supabase gave you for free |
| Realtime | Supabase Realtime (not used in MVP) | WebSockets / SSE | N/A for MVP |

The service layer abstraction is what makes this manageable. Each `*Service.ts` file is the only place that touches Supabase — swap those files, and the rest of the app doesn't know or care.

---

## What This Stack Does NOT Include (Intentionally)

- **No custom API server.** Supabase's auto-generated REST + RLS replaces the need for Express/Fastify/etc.
- **No GraphQL.** REST via PostgREST is sufficient. GraphQL adds complexity with no benefit at this scale.
- **No Redux.** Zustand is simpler and sufficient.
- **No offline-first architecture.** The app requires network connectivity. Add TanStack Query later for caching and offline tolerance if needed.
- **No advanced data caching.** Direct Supabase calls for now. TanStack Query is a drop-in addition via the service layer when performance/UX demands it.
- **No CI/CD pipeline.** EAS Build handles builds. Add GitHub Actions later if needed.
- **No analytics.** Add PostHog or Mixpanel in Phase 2 when you have real users.
- **No error tracking.** Add Sentry when shipping to real users.
