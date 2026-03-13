import { addMedicationSchema } from './medication';

describe('addMedicationSchema', () => {
  it('validates valid data', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      dosage: '16mg',
      frequency: 'Twice daily',
      startDate: '2025-01-01',
      endDate: '2025-02-01',
      prescribingVet: 'Dr. Smith',
      notes: 'Take with food',
    });
    expect(result.success).toBe(true);
  });

  it('requires name', () => {
    const result = addMedicationSchema.safeParse({
      name: '',
      startDate: '2025-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('requires start date', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      startDate: '',
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be null', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      dosage: null,
      frequency: null,
      startDate: '2025-01-01',
      endDate: null,
      prescribingVet: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});
