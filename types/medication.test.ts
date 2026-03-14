import { addMedicationSchema } from './medication';

describe('addMedicationSchema', () => {
  it('validates valid data with known frequency', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      dosage: '16mg',
      frequency: 'Twice daily',
      startDate: '2025-01-01',
      endDate: '2025-02-01',
      notes: 'Take with food',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all frequency options', () => {
    for (const freq of ['As needed', 'Once daily', 'Twice daily', 'Three times daily', 'Once monthly']) {
      const result = addMedicationSchema.safeParse({
        name: 'Test',
        frequency: freq,
        startDate: '2025-01-01',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects unknown frequency strings', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      frequency: 'Every 2 weeks',
      startDate: '2025-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects null frequency', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      frequency: null,
      startDate: '2025-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing frequency', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      startDate: '2025-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('requires name', () => {
    const result = addMedicationSchema.safeParse({
      name: '',
      frequency: 'Once daily',
      startDate: '2025-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('requires start date', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      frequency: 'Once daily',
      startDate: '',
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be null', () => {
    const result = addMedicationSchema.safeParse({
      name: 'Apoquel',
      dosage: null,
      frequency: 'Once daily',
      startDate: '2025-01-01',
      endDate: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});
