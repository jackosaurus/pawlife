export const MEDICATION_FREQUENCIES = [
  'As needed',
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every 3 days',
  'Once weekly',
  'Twice weekly',
  'Once monthly',
] as const;

/** Configuration for each frequency: interval in days and doses per day.
 *  Includes deprecated frequencies (e.g. "Every other day") for backward compat with existing data. */
export const FREQUENCY_CONFIG: Record<string, { intervalDays: number | null; dosesPerDay: number | null }> = {
  'As needed': { intervalDays: null, dosesPerDay: null },
  'Once daily': { intervalDays: 1, dosesPerDay: 1 },
  'Twice daily': { intervalDays: 1, dosesPerDay: 2 },
  'Three times daily': { intervalDays: 1, dosesPerDay: 3 },
  'Every other day': { intervalDays: 2, dosesPerDay: 1 },
  'Every 3 days': { intervalDays: 3, dosesPerDay: 1 },
  'Once weekly': { intervalDays: 7, dosesPerDay: 1 },
  'Twice weekly': { intervalDays: 4, dosesPerDay: 1 },
  'Once monthly': { intervalDays: 30, dosesPerDay: 1 },
};

/** Maps recurring frequency labels to their interval in days. null = no fixed interval. */
export const FREQUENCY_INTERVAL_DAYS: Record<string, number | null> = Object.fromEntries(
  Object.entries(FREQUENCY_CONFIG).map(([key, val]) => [key, val.intervalDays]),
);

/** Returns the number of doses expected per day for a frequency, or null for "As needed". */
export function getDosesPerDay(frequency: string | null | undefined): number | null {
  if (!frequency) return null;
  return FREQUENCY_CONFIG[frequency]?.dosesPerDay ?? null;
}

/** Returns true if the frequency matches a predefined recurring option. */
export function isRecurringFrequency(frequency: string | null | undefined): boolean {
  if (!frequency) return false;
  return frequency in FREQUENCY_CONFIG;
}
