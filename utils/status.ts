import { FREQUENCY_INTERVAL_DAYS } from '@/constants/frequencies';

export function getVaccinationStatus(
  nextDueDate: string | null,
): 'green' | 'amber' | 'overdue' {
  if (!nextDueDate) return 'green';

  const now = new Date();
  // Parse as local date to avoid timezone mismatch with new Date()
  const [year, month, day] = nextDueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);

  // Reset time portion for date-only comparison
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 30) return 'amber';
  return 'green';
}

/**
 * Status for recurring medications (ones with a predefined frequency).
 *
 * For multi-daily meds (dosesPerDay > 1): count-based logic
 * - All doses done today → green
 * - Some but not all → amber
 * - No doses today AND yesterday incomplete → overdue
 * - Never dosed → neutral
 *
 * For single-dose meds (dosesPerDay = 1): interval-based logic (existing)
 */
export function getRecurringMedicationStatus(
  lastGivenDate: string | null,
  frequency: string,
  todayDoseCount?: number,
  dosesPerDay?: number | null,
): 'green' | 'amber' | 'overdue' | 'neutral' {
  // Multi-daily count-based logic
  if (dosesPerDay != null && dosesPerDay > 1) {
    const count = todayDoseCount ?? 0;
    if (count >= dosesPerDay) return 'green';
    if (count > 0) return 'amber';
    // No doses today — check if we have any doses ever
    if (!lastGivenDate) return 'neutral';
    // No doses today: check if last dose was yesterday or earlier → overdue
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const lastGiven = new Date(lastGivenDate);
    lastGiven.setHours(0, 0, 0, 0);
    const daysSince = Math.floor((now.getTime() - lastGiven.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 1) return 'overdue';
    return 'green';
  }

  // Single-dose interval-based logic (existing)
  if (!lastGivenDate) return 'neutral';

  const intervalDays = FREQUENCY_INTERVAL_DAYS[frequency];
  // "As needed" (null interval) with at least one dose is always up to date
  if (intervalDays === null || intervalDays === undefined) return 'green';

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const lastGiven = new Date(lastGivenDate);
  lastGiven.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - lastGiven.getTime();
  const daysSinceLastDose = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysSinceLastDose > intervalDays) return 'overdue';
  if (daysSinceLastDose >= intervalDays * 0.8) return 'amber';
  return 'green';
}

/**
 * Status for one-off medications (no predefined frequency).
 * - No end date or future end date → 'green' (Current)
 * - Past end date → 'neutral' (Finished med)
 */
export function getOneOffMedicationStatus(
  endDate: string | null,
): 'green' | 'neutral' {
  if (!endDate) return 'green';

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [year, month, day] = endDate.split('-').map(Number);
  const end = new Date(year, month - 1, day);
  end.setHours(0, 0, 0, 0);

  return end.getTime() < now.getTime() ? 'neutral' : 'green';
}
