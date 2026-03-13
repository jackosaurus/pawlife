# CLAUDE.md

## Project Overview

Pawlife is a mobile app (iOS + Android) for tracking pet health, food, and care. Built with React Native (Expo) and Supabase. Currently building the MVP for personal use.

## Tech Stack

- **Frontend:** React Native via Expo (managed workflow), Expo Router, Zustand, NativeWind
- **Backend:** Supabase (Postgres + Auth + Storage). No custom API server.
- **Forms:** React Hook Form + Zod
- **Language:** TypeScript (strict mode)

## Project Structure

```
app/                    # Expo Router file-based routes
  (auth)/               # Unauthenticated screens
  (main)/               # Authenticated screens
    pets/[petId]/       # Pet-scoped screens
      health/           # Health record screens
      food/             # Food screens
components/
  ui/                   # Reusable primitives (Button, Card, Input, etc.)
  pets/                 # Pet-specific components
  health/               # Health record components
  food/                 # Food components
services/               # Supabase service layer — ALL Supabase calls go here
stores/                 # Zustand stores
hooks/                  # Custom React hooks for data fetching
types/                  # TypeScript types + Zod schemas
constants/              # Colors, breeds, vaccines, design tokens
utils/                  # Pure utility functions
```

## Critical Architecture Rules

1. **Service layer is mandatory.** Components NEVER import or call Supabase directly. All database, auth, and storage calls go through `services/*.ts`. This is non-negotiable — it's our migration path off Supabase.
2. **One service file per domain.** `petService.ts`, `healthService.ts`, `foodService.ts`, `authService.ts`.
3. **Types are generated from Supabase.** Run `npx supabase gen types typescript --project-id $PROJECT_ID > types/database.ts` to regenerate after schema changes. App-level types in `types/index.ts` can extend these.
4. **Zod schemas validate forms.** Every form has a corresponding Zod schema. Schemas live alongside the types in `types/`.
5. **Zustand for global state only.** Auth session, user preferences, active pet selection. Don't put server data in Zustand — fetch it in the component via the service layer.

## Design System

- **Background:** `#FFF8E7` (pale warm yellow)
- **Primary:** `#4A2157` (rich plum)
- **Primary pressed:** `#341539` (deep plum)
- **Accent:** `#E8735A` (soft coral)
- **Cards:** `#FFFFFF` with rounded corners (16px) and subtle shadow
- **Text primary:** `#2D2A26` (dark warm charcoal)
- **Text secondary:** `#7A756E` (warm gray)
- **Status green:** `#5BA67C`, **amber:** `#E5A84B`, **overdue:** `#E8735A`, **neutral:** `#9CA3AF`
- **Input fill:** `#F5F3F0` (warm light gray for form input backgrounds inside cards)
- **Borders:** `#EDE8DF` (warm border)

All colors are defined in `constants/colors.ts`. Always reference the constant, never hardcode hex values in components.

### UI Patterns

- **Detail screens** use `DetailRow` (horizontal label/value) inside white `Card` wrappers. Group related fields into separate cards with a small uppercase section label (e.g. "TIMELINE" for date fields).
- **Form screens** wrap all input fields inside a white `Card` with `px-5 pt-4`. Special controls (pet type selector, photo picker) stay outside the card.
  - **Add screens** use a bottom `Button` for the primary submit action.
  - **Edit screens** use a header bar with back arrow (left), title (center), and a "Save" text button (right, primary color). No bottom submit button.
- **Form inputs** use white background with subtle `1px` border (`Colors.border`), highlighting to `Colors.primary` on focus.
- **Delete confirmations** use a bottom-sheet-style Modal with `animationType="fade"`, rounded top corners, and a dark overlay.
- **Date fields** use native date pickers (`@react-native-community/datetimepicker`) via the `DateInput` component — never raw text input.
- **Date format** is day-first: "15 Jan 2025" (en-GB locale).

## Styling

- Use NativeWind (Tailwind for React Native) for all styling.
- Use custom color tokens via NativeWind theme config where possible.
- For iOS glass/blur effects, use `expo-blur` as progressive enhancement — always provide a solid fallback.

## Testing

- **Framework:** Jest + React Native Testing Library
- **Rule: every new component, hook, service, and utility must have tests.**
- Test files live alongside source files: `petService.ts` → `petService.test.ts`, `Button.tsx` → `Button.test.tsx`
- Service tests: mock Supabase client, test happy path + error handling for every method.
- Component tests: test rendering, user interactions, loading/error/empty states.
- Hook tests: use `renderHook`, mock services.
- Utility tests: pure function tests, edge cases.
- Run tests: `npx jest` or `npx jest --watch`
- Target: don't let untested code accumulate. Write tests as you build, not after.

## Conventions

- Use functional components with hooks. No class components.
- Use `async/await` for all async operations. No `.then()` chains.
- Error handling: every service call in a component should be wrapped in try/catch with appropriate error state.
- File naming: PascalCase for components (`PetCard.tsx`), camelCase for everything else (`petService.ts`, `usePets.ts`).
- Exports: default export for screen components, named exports for everything else.
- When creating a new screen, follow the Expo Router file convention in `app/`.
- When creating a new record type, follow the pattern established by vaccinations: service methods → Zod schema → add form → detail screen → list integration → pet detail integration.

## Common Commands

```bash
npx expo start                    # Start dev server
npx expo start --ios              # Start on iOS simulator
npx expo start --android          # Start on Android emulator
npx jest                          # Run all tests
npx jest --watch                  # Run tests in watch mode
npx jest --coverage               # Run tests with coverage report
npx supabase gen types typescript --project-id $PROJECT_ID > types/database.ts  # Regenerate types
npx expo install [package]        # Install Expo-compatible package version
```

## Current Build Phase

Refer to `docs/pawlife-build-plan.md` for the full sequenced build plan.

**Status:** Units 1–10 complete. Currently in Unit 11 — Polish & QA.

## Reference Documents

These are in the `docs/` directory:
- `pawlife-roadmap.md` — Product vision, MVP scope, phased backlog
- `pawlife-screen-inventory.md` — Design system, voice & tone, 28 screens, user flows
- `pawlife-tech-stack.md` — Full tech stack with architecture and migration path
- `pawlife-data-model.md` — Schema, RLS policies, storage, data flows, service layer examples
- `pawlife-build-plan.md` — 11 sequenced units of work
- `pawlife-stitch-prompts.md` — Design mockup prompts (for reference, not code)

## Things to Avoid

- Don't install TanStack Query / React Query yet. Direct service calls with useState/useEffect for now.
- Don't use Redux. Zustand only.
- Don't build offline-first patterns. App requires connectivity.
- Don't add analytics, error tracking, or CI/CD yet.
- Don't use localStorage/sessionStorage in any component — not supported in React Native.
- Don't scatter Supabase imports outside the `services/` directory.
