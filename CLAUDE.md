# CLAUDE.md

## Project Overview

Bemy is a mobile app (iOS + Android) for tracking pet health, food, and care. Built with React Native (Expo) and Supabase. Currently building the MVP for personal use.

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
6. **Database changes require senior review.** Every migration or schema change (new tables, altered columns, indexes, RLS policies, functions) must be reviewed by a senior database engineer agent before being finalized. Write the migration first, then spawn the review agent. Do not skip this step.
7. **Post-migration review required.** After the senior DB engineer review is complete and any fixes are applied, spawn a second experienced engineer agent to review all code changes that resulted from the DB review (updated migration, modified types, services, stores, etc.) to catch any inconsistencies or ripple effects. Only after both reviews pass is the work considered done.

## Design System

The canonical design system lives in `docs/bemy-design-system.md` — colors, typography, components, patterns, voice. Always check it before introducing a new pattern. When you change a pattern, update the doc.

Do not hardcode hex values, font sizes, or spacing — use the tokens in `constants/colors.ts`, `constants/typography.ts`, and the NativeWind theme.

For destructive actions, follow the severity tiers in the design system doc — never use `Alert.alert` for destructive confirmations; use the `ConfirmationModal` component.

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

## Working Style

These are the defaults — no need to ask each time.

### Background by default
Any task beyond a couple of tool calls (implementations, planning rounds, test audits, DB reviews, refactors) is launched via the Agent tool with `run_in_background: true`. Foreground only when the user explicitly says so or the work is genuinely a one-line edit.

### Plan before implementing
Default to a planning round before any implementation: spawn parallel PM/UX and senior engineering agents, synthesize their reports, surface 2–4 open questions, and commission implementation only after the user answers. The token cost is accepted — it scales as the product grows complex. Skip the planning round only for genuinely one-line fixes or direct follow-ups to an already-planned thread.

### Visualize before UI sign-off
When asking the user to approve a UI change, include an ASCII or word-mockup of "before / after." Don't ask for sign-off without a visual.

### Test coverage is non-negotiable, enforced at agent-launch time
Every implementation agent's brief includes explicit test requirements: which files to update, what cases to add, run `npx jest` and require green before commit. Don't ask the user "should I add tests?" — just add them. The existing rule "every new component, hook, service, and utility must have tests" is enforced when commissioning the agent, not after.

### Honor the DB review chain (rules 6 + 7) at the parent agent level
When an implementation agent can't spawn its own subagents (some environments lack the Agent tool), the parent agent must spawn the senior DB review and post-migration code review independently before declaring the work done. Don't accept "I did the review inline" as substitute — get a fresh independent set of eyes on every migration.

### Coordinate migrations + Edge Function deploys
If a feature touches both a SQL migration and a deployed Edge Function (e.g. `send-reminders`), the implementation agent must surface deploy ordering in its final report: migration first, then Edge Function redeploy. Don't bury this — there's a brief window where the wrong order causes runtime errors.

### Commit + push are part of "done"
Implementation agents commit and push their work as part of the task. Don't leave work uncommitted on disk waiting for a follow-up "commit this" instruction. Migrations are the exception — they're committed but applied manually by the user.

### Status dashboard for parallel work
When multiple agents are running, end responses with a brief status table of all active threads so the user can see what's in flight at a glance.

### Worktree isolation for parallel committers
When running multiple background agents in parallel that will each `git commit`, launch them with `isolation: "worktree"` so they don't fight over the shared git index. Sequential agents in the same tree are fine. The failure mode is two parallel agents staging different files and one of their commits accidentally picking up both stagings — corrupts commit boundaries (split work into two clean commits later requires `git reset` + restage, which is messy if either has already been pushed).

### Verify external-state assumptions before executing on a plan
When a plan doc claims something about external state (a URL resolves, a slug is cosmetic, an account is owned, a service has a particular feature), verify it with one command before building on it. Plans go stale and confidently-written docs are easy to take at face value. A single `curl -I`, `gh repo view`, or `eas project:info` upfront beats discovering the assumption was wrong at execution time and re-doing work mid-flight.

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

Refer to `docs/bemy-build-plan.md` for the full sequenced build plan.

**Status:** Units 1–10 complete. Currently in Unit 11 — Polish & QA.

## Reference Documents

These are in the `docs/` directory:
- `bemy-roadmap.md` — Product vision, MVP scope, phased backlog
- `bemy-design-system.md` — Canonical design system: tokens, components, patterns, voice, destructive-action tiers
- `bemy-tech-stack.md` — Full tech stack with architecture and migration path
- `bemy-data-model.md` — Schema, RLS policies, storage, data flows, service layer examples
- `bemy-build-plan.md` — 11 sequenced units of work (MVP build, Units 1-10 complete)
- `bemy-v1-release-plan.md` — 9 open items before first App Store release, with rationale and suggested ordering
- `bemy-stitch-prompts.md` — Design mockup prompts (for reference, not code)

## Things to Avoid

- Don't install TanStack Query / React Query yet. Direct service calls with useState/useEffect for now.
- Don't use Redux. Zustand only.
- Don't build offline-first patterns. App requires connectivity.
- Don't add analytics, error tracking, or CI/CD yet.
- Don't use localStorage/sessionStorage in any component — not supported in React Native.
- Don't scatter Supabase imports outside the `services/` directory.
