import { DOG_BREEDS, CAT_BREEDS, getBreedsForType } from './breeds';

describe('breeds', () => {
  it('DOG_BREEDS starts with Mixed / Unknown', () => {
    expect(DOG_BREEDS[0]).toBe('Mixed / Unknown');
  });

  it('CAT_BREEDS starts with Mixed / Unknown', () => {
    expect(CAT_BREEDS[0]).toBe('Mixed / Unknown');
  });

  it('DOG_BREEDS is alphabetically sorted after first entry', () => {
    const rest = DOG_BREEDS.slice(1);
    const sorted = [...rest].sort((a, b) => a.localeCompare(b));
    expect(rest).toEqual(sorted);
  });

  it('CAT_BREEDS is alphabetically sorted after first entry', () => {
    const rest = CAT_BREEDS.slice(1);
    const sorted = [...rest].sort((a, b) => a.localeCompare(b));
    expect(rest).toEqual(sorted);
  });

  it('getBreedsForType returns correct array', () => {
    expect(getBreedsForType('dog')).toBe(DOG_BREEDS);
    expect(getBreedsForType('cat')).toBe(CAT_BREEDS);
  });
});
