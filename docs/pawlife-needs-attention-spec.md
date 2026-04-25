# Needs Attention — Dashboard Action Items

## Overview

A contextual "Needs Attention" section on the Your Pet Family dashboard that surfaces outstanding tasks across all pets. Phase 1 of a broader reminders system (push notifications planned for Phase 2).

## What Appears

| Type | Condition | Urgency | Action |
|---|---|---|---|
| Medication (overdue) | Recurring med, status = `overdue` | `overdue` | Log Dose (inline) |
| Medication (due today) | Recurring med, status = `amber` or `neutral` with doses remaining | `due_today` | Log Dose (inline) |
| Vaccination (overdue) | `next_due_date` in the past | `overdue` | View (navigate) |
| Vaccination (upcoming) | `next_due_date` within 14 days | `upcoming` | View (navigate) |

### Exclusions

- **"As needed" medications** — no schedule, never "due"
- **Archived medications** — `is_archived = true` (user explicitly archived; `end_date` in the past alone does not exclude — surfaced as a stale prompt instead)
- **Vaccinations without `next_due_date`** — no due date means nothing to track
- **Medications with status `green`** — all doses are up to date

## Priority Order

Items sorted top-to-bottom:

1. Overdue medications (most urgent — missed doses)
2. Due-today medications (action needed today)
3. Overdue vaccinations (past due, needs vet visit)
4. Upcoming vaccinations (awareness — book an appointment)

Within each group, items sorted by pet name alphabetically.

## Layout

- Section appears **above** pet cards on the dashboard
- **Hidden entirely** when no items exist (clean dashboard = everything is good)
- Shows up to **5 items** by default; "Show all (N)" to expand
- Each item is a compact row inside a Card

### Item Row Layout

```
[Icon]  Pet Name · Item Title              [Action]
        Subtitle (dose progress / timing)
```

- **Icon:** pill emoji for medications, syringe for vaccinations
- **Left border color:** overdue = coral, due_today = amber, upcoming = none
- **Action:** "Log Dose" (medications) or "View" (vaccinations), in primary color

## Actions

### Log Dose (Medications)

Tapping "Log Dose" on a medication item:
1. Calls `healthService.logMedicationDose()` with `given_at = now`
2. Refreshes the action items list
3. Item disappears or updates (if multi-daily, shows updated count)

### View (Vaccinations)

Tapping "View" navigates to the vaccination detail screen for that pet/vaccination.

## Data Flow

1. Dashboard loads pets via `usePets()`
2. `useActionItems(pets)` hook:
   - Extracts pet IDs
   - Calls `healthService.getActiveMedicationsForPets(petIds)` — fetches active recurring meds across all pets
   - Enriches with dose counts via existing `getTodayDoseCounts()` and `getLatestDoseForMedications()`
   - Calls `healthService.getActionableVaccinations(petIds, 14)` — vaccinations due within 14 days or overdue
   - Applies status logic, filters to items needing attention, maps to `ActionItem[]`
3. `NeedsAttentionSection` renders the items
4. Section refreshes on screen focus (same pattern as pet list)

## Types

```typescript
type ActionItemType = 'medication' | 'vaccination';
type ActionItemUrgency = 'overdue' | 'due_today' | 'upcoming';

interface ActionItem {
  id: string;           // unique key for list rendering
  type: ActionItemType;
  urgency: ActionItemUrgency;
  petId: string;
  petName: string;
  title: string;        // medication name or vaccine name
  subtitle: string;     // "1 of 2 doses remaining" or "Due in 12 days"
  recordId: string;     // vaccination ID or medication ID
  medicationId?: string; // for logging doses
}
```

## Phase 2 (Future — Push Notifications)

Not in scope for this implementation. Documented for context:
- Medication reminders: daily at user-preferred time (default 8 PM)
- Vaccination reminders: 14 days before, 3 days before, day of, then weekly if overdue
- Smart muting: auto-pause after 5 consecutive ignored medication reminders
- Re-activation: bottom sheet on next dose log
- Preferences: reminder time, vaccination advance notice, master toggle
