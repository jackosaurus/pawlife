import { MEDICATION_FREQUENCIES } from './frequencies';

describe('MEDICATION_FREQUENCIES', () => {
  it('is a non-empty array', () => {
    expect(MEDICATION_FREQUENCIES.length).toBeGreaterThan(0);
  });

  it('contains common frequency options', () => {
    expect(MEDICATION_FREQUENCIES).toContain('Once daily');
    expect(MEDICATION_FREQUENCIES).toContain('Twice daily');
    expect(MEDICATION_FREQUENCIES).toContain('As needed');
  });

  it('has no duplicates', () => {
    const unique = new Set(MEDICATION_FREQUENCIES);
    expect(unique.size).toBe(MEDICATION_FREQUENCIES.length);
  });
});
