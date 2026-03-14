import { getVaccinationStatus, getRecurringMedicationStatus, getOneOffMedicationStatus } from './status';

/** Format a Date as YYYY-MM-DD in local timezone */
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('getVaccinationStatus', () => {
  it('returns green when no due date', () => {
    expect(getVaccinationStatus(null)).toBe('green');
  });

  it('returns green when due date is more than 30 days away', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    expect(getVaccinationStatus(toLocalDateString(futureDate))).toBe('green');
  });

  it('returns amber when due date is within 30 days', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 15);
    expect(getVaccinationStatus(toLocalDateString(soonDate))).toBe('amber');
  });

  it('returns amber when due date is exactly 30 days away', () => {
    const exactDate = new Date();
    exactDate.setDate(exactDate.getDate() + 30);
    expect(getVaccinationStatus(toLocalDateString(exactDate))).toBe('amber');
  });

  it('returns overdue when due date is in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    expect(getVaccinationStatus(toLocalDateString(pastDate))).toBe('overdue');
  });

  it('returns amber when due date is today', () => {
    const today = toLocalDateString(new Date());
    expect(getVaccinationStatus(today)).toBe('amber');
  });
});

describe('getRecurringMedicationStatus', () => {
  it('returns neutral when no last given date', () => {
    expect(getRecurringMedicationStatus(null, 'Once daily')).toBe('neutral');
  });

  it('returns green for "As needed" with any dose date', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    expect(getRecurringMedicationStatus(toLocalDateString(oldDate), 'As needed')).toBe('green');
  });

  it('returns green when dose was given today for daily medication', () => {
    expect(getRecurringMedicationStatus(toLocalDateString(new Date()), 'Once daily')).toBe('green');
  });

  it('returns overdue when dose was given 3 days ago for daily medication', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(getRecurringMedicationStatus(toLocalDateString(threeDaysAgo), 'Once daily')).toBe('overdue');
  });

  it('returns amber when within 20% of interval remaining', () => {
    // Once monthly = 30 days, 80% = 24 days. At 25 days, should be amber.
    const twentyFiveDaysAgo = new Date();
    twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);
    expect(getRecurringMedicationStatus(toLocalDateString(twentyFiveDaysAgo), 'Once monthly')).toBe('amber');
  });

  it('returns green when well within interval', () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    expect(getRecurringMedicationStatus(toLocalDateString(fiveDaysAgo), 'Once monthly')).toBe('green');
  });

  it('returns overdue when past interval for monthly', () => {
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
    expect(getRecurringMedicationStatus(toLocalDateString(fortyDaysAgo), 'Once monthly')).toBe('overdue');
  });

  // Multi-daily tests
  describe('multi-daily (dosesPerDay > 1)', () => {
    it('returns green when all doses given today', () => {
      expect(getRecurringMedicationStatus(
        toLocalDateString(new Date()), 'Twice daily', 2, 2,
      )).toBe('green');
    });

    it('returns amber when partial doses given today', () => {
      expect(getRecurringMedicationStatus(
        toLocalDateString(new Date()), 'Twice daily', 1, 2,
      )).toBe('amber');
    });

    it('returns neutral when never dosed', () => {
      expect(getRecurringMedicationStatus(null, 'Three times daily', 0, 3)).toBe('neutral');
    });

    it('returns overdue when no doses today and last dose was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getRecurringMedicationStatus(
        toLocalDateString(yesterday), 'Twice daily', 0, 2,
      )).toBe('overdue');
    });

    it('returns green when no doses today but last dose was today', () => {
      expect(getRecurringMedicationStatus(
        toLocalDateString(new Date()), 'Three times daily', 0, 3,
      )).toBe('green');
    });

    it('returns green when more doses than required', () => {
      expect(getRecurringMedicationStatus(
        toLocalDateString(new Date()), 'Twice daily', 3, 2,
      )).toBe('green');
    });
  });
});

describe('getOneOffMedicationStatus', () => {
  it('returns green when no end date', () => {
    expect(getOneOffMedicationStatus(null)).toBe('green');
  });

  it('returns green when end date is in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    expect(getOneOffMedicationStatus(toLocalDateString(futureDate))).toBe('green');
  });

  it('returns green when end date is today', () => {
    expect(getOneOffMedicationStatus(toLocalDateString(new Date()))).toBe('green');
  });

  it('returns neutral when end date is in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    expect(getOneOffMedicationStatus(toLocalDateString(pastDate))).toBe('neutral');
  });
});
