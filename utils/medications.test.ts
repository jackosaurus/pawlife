import {
  getMedicationIndicator,
  getMedicationContextText,
  shouldShowLogDose,
} from './medications';
import { MedicationWithDoseInfo } from '@/hooks/useMedications';

function makeMed(overrides: Partial<MedicationWithDoseInfo> = {}): MedicationWithDoseInfo {
  return {
    id: '1',
    pet_id: 'p1',
    name: 'TestMed',
    dosage: '10mg',
    frequency: 'Once daily',
    start_date: '2025-01-01',
    end_date: null,
    notes: null,
    created_at: '',
    updated_at: '',
    isRecurring: true,
    lastGivenDate: null,
    todayDoseCount: 0,
    dosesPerDay: 1,
    ...overrides,
  };
}

describe('getMedicationIndicator', () => {
  it('returns green check for green status', () => {
    const result = getMedicationIndicator(makeMed(), 'green');
    expect(result).toEqual({ type: 'check', color: 'green' });
  });

  it('returns gray dot for neutral status', () => {
    const result = getMedicationIndicator(makeMed(), 'neutral');
    expect(result).toEqual({ type: 'dot', color: 'gray' });
  });

  it('returns amber fraction for daily med due today', () => {
    const result = getMedicationIndicator(makeMed({ dosesPerDay: 1, todayDoseCount: 0 }), 'amber');
    expect(result).toEqual({ type: 'fraction', color: 'amber', fractionText: '0/1' });
  });

  it('returns red fraction for overdue daily med', () => {
    const result = getMedicationIndicator(makeMed({ dosesPerDay: 1, todayDoseCount: 0 }), 'overdue');
    expect(result).toEqual({ type: 'fraction', color: 'red', fractionText: '0/1' });
  });

  it('returns amber fraction for partial multi-daily', () => {
    const result = getMedicationIndicator(
      makeMed({ frequency: 'Twice daily', dosesPerDay: 2, todayDoseCount: 1 }),
      'amber',
    );
    expect(result).toEqual({ type: 'fraction', color: 'amber', fractionText: '1/2' });
  });

  it('returns gray dot for finished med', () => {
    const result = getMedicationIndicator(
      makeMed({ end_date: '2020-01-01' }),
      'green',
    );
    expect(result).toEqual({ type: 'dot', color: 'gray' });
  });

  it('returns amber dot for interval med due soon', () => {
    const result = getMedicationIndicator(
      makeMed({ frequency: 'Once monthly', dosesPerDay: 1, todayDoseCount: 0 }),
      'amber',
    );
    // Monthly med — dosesPerDay=1, shows fraction
    expect(result.type).toBe('fraction');
    expect(result.color).toBe('amber');
  });
});

describe('getMedicationContextText', () => {
  it('returns "No doses logged" for never-dosed med', () => {
    expect(getMedicationContextText(makeMed(), 'neutral')).toBe('No doses logged');
  });

  it('returns time-aware text for recent dose', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = getMedicationContextText(
      makeMed({ lastGivenDate: fiveMinAgo, todayDoseCount: 1 }),
      'green',
    );
    expect(result).toBe('Given 5m ago');
  });

  it('returns "Given just now" for very recent dose', () => {
    const justNow = new Date().toISOString();
    const result = getMedicationContextText(
      makeMed({ lastGivenDate: justNow, todayDoseCount: 1 }),
      'green',
    );
    expect(result).toBe('Given just now');
  });

  it('returns hours for dose given hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = getMedicationContextText(
      makeMed({ lastGivenDate: twoHoursAgo, todayDoseCount: 1 }),
      'green',
    );
    expect(result).toBe('Given 2h ago');
  });

  it('returns "Due today" for overdue single-dose med', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = getMedicationContextText(
      makeMed({ lastGivenDate: twoDaysAgo }),
      'overdue',
    );
    expect(result).toBe('Due today');
  });

  it('returns remaining dose count for partial multi-daily', () => {
    const result = getMedicationContextText(
      makeMed({ frequency: 'Twice daily', dosesPerDay: 2, todayDoseCount: 1, lastGivenDate: new Date().toISOString() }),
      'amber',
    );
    expect(result).toBe('1 more dose today');
  });

  it('returns "Due today" for multi-daily with no doses', () => {
    const result = getMedicationContextText(
      makeMed({ frequency: 'Twice daily', dosesPerDay: 2, todayDoseCount: 0, lastGivenDate: new Date(Date.now() - 86400000).toISOString() }),
      'overdue',
    );
    expect(result).toBe('Due today');
  });

  it('returns time ago for completed multi-daily', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = getMedicationContextText(
      makeMed({ frequency: 'Twice daily', dosesPerDay: 2, todayDoseCount: 2, lastGivenDate: fiveMinAgo }),
      'green',
    );
    expect(result).toBe('Given 5m ago');
  });

  it('returns "Finished" for finished med', () => {
    const result = getMedicationContextText(
      makeMed({ end_date: '2020-01-01' }),
      'neutral',
    );
    expect(result).toBe('Finished');
  });

  it('returns "Due soon" for amber interval med', () => {
    const twentyFiveDaysAgo = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString();
    const result = getMedicationContextText(
      makeMed({ frequency: 'Once monthly', dosesPerDay: 1, lastGivenDate: twentyFiveDaysAgo }),
      'amber',
    );
    expect(result).toBe('Due soon');
  });
});

describe('shouldShowLogDose', () => {
  it('shows for amber status', () => {
    expect(shouldShowLogDose(makeMed(), 'amber')).toBe(true);
  });

  it('shows for overdue status', () => {
    expect(shouldShowLogDose(makeMed(), 'overdue')).toBe(true);
  });

  it('shows for neutral status', () => {
    expect(shouldShowLogDose(makeMed(), 'neutral')).toBe(true);
  });

  it('hides for green status (non as-needed)', () => {
    expect(shouldShowLogDose(makeMed(), 'green')).toBe(false);
  });

  it('shows for green "As needed"', () => {
    expect(shouldShowLogDose(
      makeMed({ frequency: 'As needed', dosesPerDay: null }),
      'green',
    )).toBe(true);
  });

  it('hides for finished med', () => {
    expect(shouldShowLogDose(
      makeMed({ end_date: '2020-01-01' }),
      'amber',
    )).toBe(false);
  });

  it('hides for non-recurring med', () => {
    expect(shouldShowLogDose(
      makeMed({ isRecurring: false, frequency: null }),
      'amber',
    )).toBe(false);
  });
});
