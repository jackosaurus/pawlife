import { getVaccinationStatus } from './status';

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
