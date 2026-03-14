import { MedicationWithDoseInfo } from '@/hooks/useMedications';
import { getDosesPerDay } from '@/constants/frequencies';
import { formatDate } from '@/utils/dates';

// ── Status indicator model ──────────────────────────────────────

export type MedicationIndicator = {
  type: 'check' | 'fraction' | 'dot';
  color: 'green' | 'amber' | 'red' | 'gray';
  fractionText?: string;
};

/**
 * Returns the visual indicator for the right side of the medication card.
 */
export function getMedicationIndicator(
  med: MedicationWithDoseInfo,
  status: 'green' | 'amber' | 'overdue' | 'neutral',
): MedicationIndicator {
  // Finished med
  if (isFinished(med)) {
    return { type: 'dot', color: 'gray' };
  }

  const dosesPerDay = getDosesPerDay(med.frequency);
  const todayCount = med.todayDoseCount ?? 0;

  // All doses done → green check
  if (status === 'green') {
    return { type: 'check', color: 'green' };
  }

  // Neutral (never dosed) → gray dot
  if (status === 'neutral') {
    return { type: 'dot', color: 'gray' };
  }

  // Daily/multi-daily: show fraction
  if (dosesPerDay !== null && dosesPerDay >= 1) {
    const color = status === 'overdue' ? 'red' : 'amber';
    return {
      type: 'fraction',
      color,
      fractionText: `${todayCount}/${dosesPerDay}`,
    };
  }

  // Interval-based (weekly, monthly) amber/overdue: dot
  return { type: 'dot', color: status === 'overdue' ? 'red' : 'amber' };
}

// ── Context text ────────────────────────────────────────────────

/**
 * Returns the context line shown on the medication card.
 * Time-aware: uses minutes/hours for recent doses.
 */
export function getMedicationContextText(
  med: MedicationWithDoseInfo,
  status: 'green' | 'amber' | 'overdue' | 'neutral',
): string {
  // Finished med
  if (isFinished(med)) {
    return 'Finished';
  }

  const dosesPerDay = getDosesPerDay(med.frequency);
  const todayCount = med.todayDoseCount ?? 0;

  // Multi-daily with partial doses: show remaining
  if (dosesPerDay !== null && dosesPerDay > 1) {
    if (todayCount >= dosesPerDay) {
      return getTimeAgoText(med.lastGivenDate);
    }
    if (todayCount > 0) {
      const remaining = dosesPerDay - todayCount;
      return `${remaining} more ${remaining === 1 ? 'dose' : 'doses'} today`;
    }
    // None today
    if (!med.lastGivenDate) return 'No doses logged';
    return 'Due today';
  }

  // Single dose or interval meds
  if (!med.lastGivenDate) return 'No doses logged';

  // If all done (green), show when last given
  if (status === 'green') {
    return getTimeAgoText(med.lastGivenDate);
  }

  // Due or overdue
  if (status === 'amber') return 'Due soon';
  if (status === 'overdue') return 'Due today';

  return getTimeAgoText(med.lastGivenDate);
}

/**
 * Whether to show "Log Dose" on the card.
 */
export function shouldShowLogDose(
  med: MedicationWithDoseInfo,
  status: 'green' | 'amber' | 'overdue' | 'neutral',
): boolean {
  if (!med.isRecurring) return false;
  if (isFinished(med)) return false;

  // "As needed" always shows Log Dose
  if (med.frequency === 'As needed') return true;

  // Show when not fully up to date
  return status !== 'green';
}

// ── Helpers ─────────────────────────────────────────────────────

function isFinished(med: MedicationWithDoseInfo): boolean {
  if (!med.end_date) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const [y, m, d] = med.end_date.split('-').map(Number);
  const end = new Date(y, m - 1, d);
  end.setHours(0, 0, 0, 0);
  return end.getTime() < now.getTime();
}

function getTimeAgoText(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'No doses logged';

  const now = new Date();
  const given = new Date(isoTimestamp);
  const diffMs = now.getTime() - given.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Given just now';
  if (diffMins < 60) return `Given ${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Given ${diffHours}h ago`;

  // Day-level comparison
  const nowDate = new Date(now);
  nowDate.setHours(0, 0, 0, 0);
  const givenDate = new Date(given);
  givenDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((nowDate.getTime() - givenDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Given yesterday';
  return `Given ${diffDays}d ago`;
}
