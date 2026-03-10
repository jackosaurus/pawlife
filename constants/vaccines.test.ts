import { getVaccinesForType, getIntervalForVaccine } from './vaccines';

describe('getVaccinesForType', () => {
  it('returns dog vaccines', () => {
    const vaccines = getVaccinesForType('dog');
    expect(vaccines).toContain('Rabies');
    expect(vaccines).toContain('DHPP / Distemper');
    expect(vaccines).toContain('Bordetella');
    expect(vaccines).toContain('Leptospirosis');
    expect(vaccines).toContain('Canine Influenza');
    expect(vaccines).toContain('Lyme Disease');
    expect(vaccines).not.toContain('FVRCP');
  });

  it('returns cat vaccines', () => {
    const vaccines = getVaccinesForType('cat');
    expect(vaccines).toContain('Rabies');
    expect(vaccines).toContain('FVRCP');
    expect(vaccines).toContain('FeLV');
    expect(vaccines).toContain('FIV');
    expect(vaccines).not.toContain('Bordetella');
  });
});

describe('getIntervalForVaccine', () => {
  it('returns interval for known vaccine', () => {
    expect(getIntervalForVaccine('Rabies')).toBe(12);
    expect(getIntervalForVaccine('Bordetella')).toBe(6);
  });

  it('returns null for unknown vaccine', () => {
    expect(getIntervalForVaccine('Unknown Vaccine')).toBeNull();
  });
});
