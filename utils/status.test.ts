import { getVaccinationStatus } from './status';

describe('getVaccinationStatus', () => {
  it('returns green when no due date', () => {
    expect(getVaccinationStatus(null)).toBe('green');
  });

  it('returns green when due date is more than 30 days away', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    expect(getVaccinationStatus(futureDate.toISOString().split('T')[0])).toBe(
      'green',
    );
  });

  it('returns amber when due date is within 30 days', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 15);
    expect(getVaccinationStatus(soonDate.toISOString().split('T')[0])).toBe(
      'amber',
    );
  });

  it('returns amber when due date is exactly 30 days away', () => {
    const exactDate = new Date();
    exactDate.setDate(exactDate.getDate() + 30);
    expect(getVaccinationStatus(exactDate.toISOString().split('T')[0])).toBe(
      'amber',
    );
  });

  it('returns overdue when due date is in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    expect(getVaccinationStatus(pastDate.toISOString().split('T')[0])).toBe(
      'overdue',
    );
  });

  it('returns amber when due date is today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getVaccinationStatus(today)).toBe('amber');
  });
});
