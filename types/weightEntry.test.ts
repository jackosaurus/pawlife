import { addWeightEntrySchema } from './weightEntry';

describe('addWeightEntrySchema', () => {
  it('validates valid data', () => {
    const result = addWeightEntrySchema.safeParse({
      weight: '25.5',
      date: '2025-01-15',
      note: 'After morning walk',
    });
    expect(result.success).toBe(true);
  });

  it('requires weight', () => {
    const result = addWeightEntrySchema.safeParse({
      weight: '',
      date: '2025-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('requires date', () => {
    const result = addWeightEntrySchema.safeParse({
      weight: '25.5',
      date: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric weight', () => {
    const result = addWeightEntrySchema.safeParse({
      weight: 'abc',
      date: '2025-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative weight', () => {
    const result = addWeightEntrySchema.safeParse({
      weight: '-5',
      date: '2025-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('allows null note', () => {
    const result = addWeightEntrySchema.safeParse({
      weight: '25.5',
      date: '2025-01-15',
      note: null,
    });
    expect(result.success).toBe(true);
  });
});
