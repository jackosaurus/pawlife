import { addVaccinationSchema, editVaccinationSchema } from './vaccination';

describe('addVaccinationSchema', () => {
  it('validates a complete form', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      intervalMonths: 12,
      dateAdministered: '2025-01-15',
      clinicName: 'Happy Paws Vet',
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional fields as null', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      intervalMonths: 12,
      dateAdministered: '2025-01-15',
      clinicName: null,
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional fields omitted', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'DHPP',
      intervalMonths: 6,
      dateAdministered: '2025-03-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty vaccine name', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: '',
      intervalMonths: 12,
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
      intervalMonths: 12,
      dateAdministered: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date is required');
    }
  });

  it('rejects missing vaccine name', () => {
    const result = addVaccinationSchema.safeParse({
      intervalMonths: 12,
      dateAdministered: '2025-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero interval', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      intervalMonths: 0,
      dateAdministered: '2025-01-15',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Interval is required');
    }
  });

  it('rejects missing interval', () => {
    const result = addVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      dateAdministered: '2025-01-15',
    });
    expect(result.success).toBe(false);
  });
});

describe('editVaccinationSchema', () => {
  it('validates a complete form', () => {
    const result = editVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      intervalMonths: 12,
      clinicName: 'Happy Paws Vet',
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional clinic name null', () => {
    const result = editVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      intervalMonths: 24,
      clinicName: null,
    });
    expect(result.success).toBe(true);
  });

  it('validates with clinic name omitted', () => {
    const result = editVaccinationSchema.safeParse({
      vaccineName: 'DHPP',
      intervalMonths: 12,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty vaccine name', () => {
    const result = editVaccinationSchema.safeParse({
      vaccineName: '',
      intervalMonths: 12,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Vaccine name is required');
    }
  });

  it('rejects zero interval', () => {
    const result = editVaccinationSchema.safeParse({
      vaccineName: 'Rabies',
      intervalMonths: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Interval is required');
    }
  });
});
