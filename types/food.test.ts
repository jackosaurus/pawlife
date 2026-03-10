import { addFoodSchema, changeFoodSchema } from './food';

describe('addFoodSchema', () => {
  it('validates with only required fields', () => {
    const result = addFoodSchema.safeParse({ brand: 'Purina' });
    expect(result.success).toBe(true);
  });

  it('validates with all fields', () => {
    const result = addFoodSchema.safeParse({
      brand: 'Blue Buffalo',
      productName: 'Life Protection',
      foodType: 'dry',
      amountPerMeal: '1 cup',
      mealsPerDay: 2,
      notes: 'He loves this food',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty brand', () => {
    const result = addFoodSchema.safeParse({ brand: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Brand is required');
    }
  });

  it('rejects missing brand', () => {
    const result = addFoodSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid food type', () => {
    const result = addFoodSchema.safeParse({
      brand: 'Purina',
      foodType: 'kibble',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null optional fields', () => {
    const result = addFoodSchema.safeParse({
      brand: 'Purina',
      productName: null,
      foodType: null,
      amountPerMeal: null,
      mealsPerDay: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-positive meals per day', () => {
    const result = addFoodSchema.safeParse({
      brand: 'Purina',
      mealsPerDay: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer meals per day', () => {
    const result = addFoodSchema.safeParse({
      brand: 'Purina',
      mealsPerDay: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('changeFoodSchema', () => {
  it('validates with reason for change', () => {
    const result = changeFoodSchema.safeParse({
      brand: 'Blue Buffalo',
      reasonForChange: 'Allergies',
    });
    expect(result.success).toBe(true);
  });

  it('validates without reason for change', () => {
    const result = changeFoodSchema.safeParse({
      brand: 'Blue Buffalo',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null reason for change', () => {
    const result = changeFoodSchema.safeParse({
      brand: 'Blue Buffalo',
      reasonForChange: null,
    });
    expect(result.success).toBe(true);
  });
});
