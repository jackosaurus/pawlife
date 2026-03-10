import { calculateAge, formatDate } from './dates';

describe('calculateAge', () => {
  it('calculates age from date of birth', () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 3);
    const result = calculateAge(twoYearsAgo.toISOString().split('T')[0], null);
    expect(result).toBe('2 years, 3 months');
  });

  it('returns "< 1 month" for DOB today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(calculateAge(today, null)).toBe('< 1 month');
  });

  it('returns "Age unknown" for future DOB', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(calculateAge(future.toISOString().split('T')[0], null)).toBe(
      'Age unknown',
    );
  });

  it('calculates from approximate age months', () => {
    expect(calculateAge(null, 18)).toBe('1 year, 6 months');
  });

  it('handles months only from approximate age', () => {
    expect(calculateAge(null, 4)).toBe('4 months');
  });

  it('handles 1 month', () => {
    expect(calculateAge(null, 1)).toBe('1 month');
  });

  it('handles exact years from approximate age', () => {
    expect(calculateAge(null, 24)).toBe('2 years');
  });

  it('returns "Age unknown" when both null', () => {
    expect(calculateAge(null, null)).toBe('Age unknown');
  });

  it('returns "< 1 month" for 0 approximate months', () => {
    expect(calculateAge(null, 0)).toBe('< 1 month');
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2024-03-15');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});
