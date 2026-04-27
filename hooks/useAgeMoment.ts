/**
 * useAgeMoment — derives the smart age-pill state for a pet on the pet detail
 * screen. Returns one of four phases:
 *
 *   - 'puppy'    — pet is under 12 months old. Label uses weeks (under 8 weeks)
 *                  or months (8 weeks – 12 months).
 *   - 'birthday' — today matches the pet's day/month of birth. Festive: pill
 *                  gets a coral tint and a single 🎂 prefix.
 *   - 'savor'    — 1–30 days after the most recent birthday. Past-tense
 *                  framing, no special tint.
 *   - 'default'  — the quiet ~330-days-a-year state.
 *
 * Senior is intentionally NOT a phase — sensitive topic, breed-dependent.
 *
 * Pure date math. All comparisons run in the user's local timezone. The hook
 * recomputes on every render, which is what we want: a phase boundary is
 * crossed at midnight local time, and the pet detail screen re-renders the
 * next time it's opened.
 */

export type AgeMomentPhase = 'puppy' | 'birthday' | 'savor' | 'default';

export interface AgeMoment {
  phase: AgeMomentPhase;
  /** Full pill copy including any emoji. Example: "🎂 Buddy is 9 today". */
  label: string;
  /** True only on birthday day — controls coral tint on the pill. */
  isFestive: boolean;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toLocalMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Resolve the most recent (or today's) anniversary of the dob into a Date in
 * the user's local timezone. Handles the Feb 29 edge case: in non-leap years,
 * the anniversary fires on Feb 28.
 *
 * Returns the anniversary in the year `year` (so callers can ask "this year's
 * anniversary" or "last year's").
 */
function anniversaryInYear(dob: Date, year: number): Date {
  const month = dob.getMonth();
  const day = dob.getDate();
  // Feb 29 dob in a non-leap year → fire on Feb 28.
  if (month === 1 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28);
  }
  return new Date(year, month, day);
}

function ageInWeeks(dob: Date, today: Date): number {
  return Math.floor((today.getTime() - dob.getTime()) / (MS_PER_DAY * 7));
}

function ageInMonths(dob: Date, today: Date): number {
  let months = (today.getFullYear() - dob.getFullYear()) * 12;
  months += today.getMonth() - dob.getMonth();
  if (today.getDate() < dob.getDate()) months--;
  return months;
}

function yearsOld(dob: Date, today: Date): number {
  let years = today.getFullYear() - dob.getFullYear();
  // If we haven't yet hit this year's anniversary, subtract one.
  const anniversaryThisYear = anniversaryInYear(dob, today.getFullYear());
  if (today.getTime() < anniversaryThisYear.getTime()) {
    years--;
  }
  return years;
}

function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${pluralForm}`;
}

export function useAgeMoment(petName: string, dob: Date | string): AgeMoment {
  const dobDate =
    typeof dob === 'string' ? new Date(dob) : new Date(dob.getTime());

  // Normalize both to local midnight so day-level comparisons are exact.
  const today = toLocalMidnight(new Date());
  const dobMidnight = toLocalMidnight(dobDate);

  const months = ageInMonths(dobMidnight, today);

  // Puppy / first-year branch — under 12 months and not a birthday today.
  // Birthday on a 1-year-old pet (months === 12 at exactly the anniversary)
  // is handled by the birthday branch below.
  const anniversaryThisYear = anniversaryInYear(
    dobMidnight,
    today.getFullYear(),
  );
  const isBirthdayToday = today.getTime() === anniversaryThisYear.getTime();

  if (months < 12 && !isBirthdayToday) {
    const weeks = ageInWeeks(dobMidnight, today);
    // Under 8 weeks → weeks copy. From 8 weeks (≈ 2 months) up to the first
    // birthday → months copy. The spec's "weeks for under 8 weeks" cutoff
    // is the source of truth here.
    if (weeks < 8) {
      return {
        phase: 'puppy',
        label: `${petName} is ${plural(weeks, 'week', 'weeks')} old`,
        isFestive: false,
      };
    }
    return {
      phase: 'puppy',
      label: `${petName} is ${plural(months, 'month', 'months')} old`,
      isFestive: false,
    };
  }

  const years = yearsOld(dobMidnight, today);

  if (isBirthdayToday) {
    return {
      phase: 'birthday',
      label: `🎂 ${petName} is ${years} today`,
      isFestive: true,
    };
  }

  // Savor window — 1 to 30 days after the most recent birthday.
  // The most recent birthday is either this year's anniversary (if it's
  // already past) or last year's.
  const lastAnniversary =
    today.getTime() >= anniversaryThisYear.getTime()
      ? anniversaryThisYear
      : anniversaryInYear(dobMidnight, today.getFullYear() - 1);

  const daysSinceBirthday = Math.floor(
    (today.getTime() - lastAnniversary.getTime()) / MS_PER_DAY,
  );

  if (daysSinceBirthday >= 1 && daysSinceBirthday <= 30) {
    return {
      phase: 'savor',
      label: `${petName} just turned ${years}`,
      isFestive: false,
    };
  }

  // Default state — the quiet ~330 days a year.
  return {
    phase: 'default',
    label: `${petName} is ${plural(years, 'year', 'years')} old`,
    isFestive: false,
  };
}
