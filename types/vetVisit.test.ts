import { addVetVisitSchema } from './vetVisit';

describe('addVetVisitSchema', () => {
  it('validates valid data', () => {
    const result = addVetVisitSchema.safeParse({
      date: '2025-01-15',
      clinicName: 'Happy Paws Vet',
      reason: 'Annual checkup',
      notes: 'All good',
    });
    expect(result.success).toBe(true);
  });

  it('requires date', () => {
    const result = addVetVisitSchema.safeParse({
      date: '',
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be null', () => {
    const result = addVetVisitSchema.safeParse({
      date: '2025-01-15',
      clinicName: null,
      reason: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});
