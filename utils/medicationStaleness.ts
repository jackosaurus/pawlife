import { Medication } from '@/types';

/**
 * Frequency buckets used to decide how stale a med has to be before we
 * suggest archiving it. Values must match the labels in
 * `constants/frequencies.ts` exactly (legacy "Every other day" included).
 */
const FREQUENT_FREQUENCIES = new Set<string>([
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every other day',
  'Every 3 days',
  'Once weekly',
  'Twice weekly',
]);

const INFREQUENT_FREQUENCIES = new Set<string>([
  'Once monthly',
  'As needed',
]);

const FREQUENT_THRESHOLD_DAYS = 30;
const INFREQUENT_THRESHOLD_DAYS = 90;

export type StaleReason = 'end_date_passed' | 'no_recent_doses' | null;

export interface StaleStatus {
  reason: StaleReason;
  daysSince: number | null;
}

const NOT_STALE: StaleStatus = { reason: null, daysSince: null };

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseLocalDate(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diffInDays(from: Date, to: Date): number {
  return Math.floor(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

/**
 * Returns whether a medication looks abandoned/expired and why.
 *
 * Rules (end_date wins if both apply):
 * 1. `end_date < today` → `end_date_passed`, daysSince = days past end.
 * 2. Frequent meds (weekly or tighter) with no dose in 30 days → `no_recent_doses`.
 * 3. Infrequent meds (monthly, as_needed) with no dose in 90 days → `no_recent_doses`.
 *
 * For "no_recent_doses", `daysSince` is days since the last dose. If no dose
 * has ever been logged, `daysSince` falls back to days since `start_date`.
 */
export function getMedicationStaleness(
  med: Pick<Medication, 'frequency' | 'start_date' | 'end_date'>,
  lastDoseGivenAt: string | null,
  today: Date,
): StaleStatus {
  const now = startOfDay(today);

  // ── 1. End-date case ─────────────────────────────────────────────
  if (med.end_date) {
    const end = parseLocalDate(med.end_date);
    if (end.getTime() < now.getTime()) {
      return {
        reason: 'end_date_passed',
        daysSince: diffInDays(end, now),
      };
    }
  }

  // ── 2/3. No-recent-doses case (only for known frequencies) ───────
  const freq = med.frequency ?? '';
  let threshold: number | null = null;
  if (FREQUENT_FREQUENCIES.has(freq)) threshold = FREQUENT_THRESHOLD_DAYS;
  else if (INFREQUENT_FREQUENCIES.has(freq)) threshold = INFREQUENT_THRESHOLD_DAYS;

  if (threshold === null) return NOT_STALE;

  const referenceIso = lastDoseGivenAt ?? null;
  const referenceDate = referenceIso
    ? new Date(referenceIso)
    : parseLocalDate(med.start_date);

  const daysSince = diffInDays(referenceDate, now);
  if (daysSince >= threshold) {
    return { reason: 'no_recent_doses', daysSince };
  }

  return NOT_STALE;
}

/**
 * Coarse human-readable "X days / weeks / months" used in the staleness prompt.
 */
export function humanizedDuration(days: number): string {
  const abs = Math.max(0, Math.floor(days));
  if (abs < 14) {
    return abs === 1 ? '1 day' : `${abs} days`;
  }
  if (abs < 60) {
    const weeks = Math.floor(abs / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  const months = Math.floor(abs / 30);
  return months === 1 ? '1 month' : `${months} months`;
}
