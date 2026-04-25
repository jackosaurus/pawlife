import { allergySchema } from './petAllergy';

describe('allergySchema', () => {
  it('accepts a valid allergen', () => {
    const result = allergySchema.safeParse({ allergen: 'Chicken' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty allergen', () => {
    const result = allergySchema.safeParse({ allergen: '' });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only allergen', () => {
    const result = allergySchema.safeParse({ allergen: '   ' });
    expect(result.success).toBe(false);
  });

  it('trims surrounding whitespace', () => {
    const result = allergySchema.safeParse({ allergen: '  Beef  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allergen).toBe('Beef');
    }
  });

  it('rejects allergens longer than 50 chars', () => {
    const result = allergySchema.safeParse({ allergen: 'a'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('accepts allergens at the 50-char boundary', () => {
    const result = allergySchema.safeParse({ allergen: 'a'.repeat(50) });
    expect(result.success).toBe(true);
  });
});
