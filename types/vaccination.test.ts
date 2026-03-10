import { addVaccinationSchema } from './vaccination';

describe('addVaccinationSchema', () => {
  it('validates a complete form', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      dateAdministered: '2025-01-15',
      nextDueDate: '2026-01-15',
      clinicName: 'Happy Paws Vet',
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional fields as null', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      dateAdministered: '2025-01-15',
      nextDueDate: null,
      clinicName: null,
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional fields omitted', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'DHPP',
      dateAdministered: '2025-03-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty vaccine name', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: '',
      dateAdministered: '2025-01-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Vaccine name is required');
    }
  });

  it('rejects empty date', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      dateAdministered: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date is required');
    }
  });

  it('rejects missing vaccine name', () => {
    const result = addVaccinationSchema.safeParse({
      dateAdministered: '2025-01-15',
    });
    expect(result.success).toBe(false);
  });
});
