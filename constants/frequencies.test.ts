import {
  MEDICATION_FREQUENCIES,
  FREQUENCY_CONFIG,
  FREQUENCY_INTERVAL_DAYS,
  getDosesPerDay,
  isRecurringFrequency,
} from './frequencies';

describe('MEDICATION_FREQUENCIES', () => {
  it('is a non-empty array', () => {
    expect(MEDICATION_FREQUENCIES.length).toBeGreaterThan(0);
  });

  it('contains common frequency options', () => {
    expect(MEDICATION_FREQUENCIES).toContain('Once daily');
    expect(MEDICATION_FREQUENCIES).toContain('Twice daily');
    expect(MEDICATION_FREQUENCIES).toContain('Three times daily');
    expect(MEDICATION_FREQUENCIES).toContain('As needed');
  });

  it('has "As needed" as the first option', () => {
    expect(MEDICATION_FREQUENCIES[0]).toBe('As needed');
  });

  it('does not contain "Every other day"', () => {
    expect(MEDICATION_FREQUENCIES).not.toContain('Every other day');
  });

  it('has no duplicates', () => {
    const unique = new Set(MEDICATION_FREQUENCIES);
    expect(unique.size).toBe(MEDICATION_FREQUENCIES.length);
  });
});

describe('FREQUENCY_CONFIG', () => {
  it('has an entry for every frequency in the array', () => {
    for (const freq of MEDICATION_FREQUENCIES) {
      expect(FREQUENCY_CONFIG[freq]).toBeDefined();
    }
  });

  it('still recognizes deprecated "Every other day" for backward compat', () => {
    expect(FREQUENCY_CONFIG['Every other day']).toEqual({ intervalDays: 2, dosesPerDay: 1 });
  });

  it('has correct config for multi-daily frequencies', () => {
    expect(FREQUENCY_CONFIG['Twice daily']).toEqual({ intervalDays: 1, dosesPerDay: 2 });
    expect(FREQUENCY_CONFIG['Three times daily']).toEqual({ intervalDays: 1, dosesPerDay: 3 });
  });

  it('has null values for "As needed"', () => {
    expect(FREQUENCY_CONFIG['As needed']).toEqual({ intervalDays: null, dosesPerDay: null });
  });
});

describe('FREQUENCY_INTERVAL_DAYS', () => {
  it('is derived from FREQUENCY_CONFIG', () => {
    expect(FREQUENCY_INTERVAL_DAYS['Once daily']).toBe(1);
    expect(FREQUENCY_INTERVAL_DAYS['Twice daily']).toBe(1);
    expect(FREQUENCY_INTERVAL_DAYS['Once monthly']).toBe(30);
    expect(FREQUENCY_INTERVAL_DAYS['As needed']).toBeNull();
  });
});

describe('getDosesPerDay', () => {
  it('returns correct values for known frequencies', () => {
    expect(getDosesPerDay('Once daily')).toBe(1);
    expect(getDosesPerDay('Twice daily')).toBe(2);
    expect(getDosesPerDay('Three times daily')).toBe(3);
  });

  it('returns null for "As needed"', () => {
    expect(getDosesPerDay('As needed')).toBeNull();
  });

  it('returns null for unknown or null frequency', () => {
    expect(getDosesPerDay(null)).toBeNull();
    expect(getDosesPerDay(undefined)).toBeNull();
    expect(getDosesPerDay('Custom schedule')).toBeNull();
  });
});

describe('isRecurringFrequency', () => {
  it('returns true for predefined frequencies', () => {
    expect(isRecurringFrequency('Once daily')).toBe(true);
    expect(isRecurringFrequency('Three times daily')).toBe(true);
    expect(isRecurringFrequency('As needed')).toBe(true);
  });

  it('returns true for deprecated "Every other day"', () => {
    expect(isRecurringFrequency('Every other day')).toBe(true);
  });

  it('returns false for null or undefined', () => {
    expect(isRecurringFrequency(null)).toBe(false);
    expect(isRecurringFrequency(undefined)).toBe(false);
  });

  it('returns false for free-text frequencies', () => {
    expect(isRecurringFrequency('Every 2 weeks')).toBe(false);
  });
});
