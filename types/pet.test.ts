import { addPetSchema } from './pet';

describe('addPetSchema', () => {
  it('accepts valid minimal data', () => {
    const result = addPetSchema.safeParse({ petType: 'dog', name: 'Buddy' });
    expect(result.success).toBe(true);
  });

  it('accepts valid full data', () => {
    const result = addPetSchema.safeParse({
      petType: 'cat',
      name: 'Luna',
      breed: 'Siamese',
      sex: 'female',
      dateOfBirth: '2022-06-15',
      weight: 4.2,
      microchipNumber: '123456789',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = addPetSchema.safeParse({ petType: 'dog', name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid pet type', () => {
    const result = addPetSchema.safeParse({ petType: 'bird', name: 'Tweety' });
    expect(result.success).toBe(false);
  });

  it('rejects negative weight', () => {
    const result = addPetSchema.safeParse({
      petType: 'dog',
      name: 'Max',
      weight: -5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts null optional fields', () => {
    const result = addPetSchema.safeParse({
      petType: 'dog',
      name: 'Rex',
      breed: null,
      sex: null,
      weight: null,
    });
    expect(result.success).toBe(true);
  });
});
