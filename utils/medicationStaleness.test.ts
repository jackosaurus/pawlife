import {
  getMedicationStaleness,
  humanizedDuration,
} from './medicationStaleness';
import type { Medication } from '@/types';

const TODAY = new Date(2026, 3, 21); // 2026-04-21 local

function makeMed(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'm1',
    pet_id: 'p1',
    name: 'TestMed',
    dosage: null,
    frequency: 'Once daily',
    start_date: '2026-01-01',
    end_date: null,
    prescribing_vet: null,
    notes: null,
    is_archived: false,
    archived_at: null,
    created_by: null,
    modified_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Medication & { [k: string]: unknown };
}

function isoDaysAgo(days: number, base: Date = TODAY): string {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function ymdDaysAgo(days: number, base: Date = TODAY): string {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

describe('getMedicationStaleness', () => {
  describe('end_date_passed', () => {
    it('flags end_date in the past', () => {
      const med = makeMed({ end_date: ymdDaysAgo(5) });
      expect(getMedicationStaleness(med, isoDaysAgo(0), TODAY)).toEqual({
        reason: 'end_date_passed',
        daysSince: 5,
      });
    });

    it('does not flag end_date today', () => {
      const med = makeMed({ end_date: ymdDaysAgo(0) });
      // Future / today end_date is not stale via end_date rule;
      // recent dose keeps the no_recent_doses rule clear.
      expect(getMedicationStaleness(med, isoDaysAgo(0), TODAY)).toEqual({
        reason: null,
        daysSince: null,
      });
    });

    it('does not flag future end_date', () => {
      const future = new Date(TODAY);
      future.setDate(future.getDate() + 10);
      const ymd = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
      const med = makeMed({ end_date: ymd });
      expect(getMedicationStaleness(med, isoDaysAgo(0), TODAY).reason).toBeNull();
    });

    it('end_date wins over no_recent_doses', () => {
      const med = makeMed({ end_date: ymdDaysAgo(2), frequency: 'Once daily' });
      const result = getMedicationStaleness(med, isoDaysAgo(60), TODAY);
      expect(result.reason).toBe('end_date_passed');
      expect(result.daysSince).toBe(2);
    });
  });

  describe('frequent frequencies (30-day threshold)', () => {
    const frequents = [
      'Once daily',
      'Twice daily',
      'Three times daily',
      'Every other day',
      'Every 3 days',
      'Once weekly',
      'Twice weekly',
    ];

    for (const freq of frequents) {
      it(`stale at exactly 30 days for ${freq}`, () => {
        const med = makeMed({ frequency: freq });
        const result = getMedicationStaleness(med, isoDaysAgo(30), TODAY);
        expect(result.reason).toBe('no_recent_doses');
        expect(result.daysSince).toBe(30);
      });

      it(`not stale at 29 days for ${freq}`, () => {
        const med = makeMed({ frequency: freq });
        expect(
          getMedicationStaleness(med, isoDaysAgo(29), TODAY).reason,
        ).toBeNull();
      });
    }

    it('uses start_date when no dose ever logged', () => {
      const med = makeMed({
        frequency: 'Once daily',
        start_date: ymdDaysAgo(45),
      });
      const result = getMedicationStaleness(med, null, TODAY);
      expect(result.reason).toBe('no_recent_doses');
      expect(result.daysSince).toBe(45);
    });

    it('not stale when start_date is recent and no dose logged', () => {
      const med = makeMed({
        frequency: 'Once daily',
        start_date: ymdDaysAgo(5),
      });
      expect(getMedicationStaleness(med, null, TODAY).reason).toBeNull();
    });
  });

  describe('infrequent frequencies (90-day threshold)', () => {
    const infrequents = ['Once monthly', 'As needed'];

    for (const freq of infrequents) {
      it(`stale at exactly 90 days for ${freq}`, () => {
        const med = makeMed({ frequency: freq });
        const result = getMedicationStaleness(med, isoDaysAgo(90), TODAY);
        expect(result.reason).toBe('no_recent_doses');
        expect(result.daysSince).toBe(90);
      });

      it(`not stale at 89 days for ${freq}`, () => {
        const med = makeMed({ frequency: freq });
        expect(
          getMedicationStaleness(med, isoDaysAgo(89), TODAY).reason,
        ).toBeNull();
      });

      it(`not stale at 30 days for ${freq}`, () => {
        const med = makeMed({ frequency: freq });
        expect(
          getMedicationStaleness(med, isoDaysAgo(30), TODAY).reason,
        ).toBeNull();
      });
    }
  });

  describe('unknown / null frequency', () => {
    it('returns not stale for null frequency', () => {
      const med = makeMed({ frequency: null });
      expect(
        getMedicationStaleness(med, isoDaysAgo(365), TODAY).reason,
      ).toBeNull();
    });

    it('returns not stale for unknown frequency', () => {
      const med = makeMed({ frequency: 'Custom schedule' });
      expect(
        getMedicationStaleness(med, isoDaysAgo(365), TODAY).reason,
      ).toBeNull();
    });
  });

  describe('fresh medications', () => {
    it('does not flag a med with a recent dose', () => {
      const med = makeMed({ frequency: 'Once daily' });
      expect(getMedicationStaleness(med, isoDaysAgo(2), TODAY).reason).toBeNull();
    });
  });
});

describe('humanizedDuration', () => {
  it('formats days under 14', () => {
    expect(humanizedDuration(0)).toBe('0 days');
    expect(humanizedDuration(1)).toBe('1 day');
    expect(humanizedDuration(3)).toBe('3 days');
    expect(humanizedDuration(13)).toBe('13 days');
  });

  it('formats weeks between 14 and 60 days', () => {
    expect(humanizedDuration(14)).toBe('2 weeks');
    expect(humanizedDuration(21)).toBe('3 weeks');
    expect(humanizedDuration(42)).toBe('6 weeks');
    expect(humanizedDuration(59)).toBe('8 weeks');
  });

  it('formats months at 60+ days', () => {
    expect(humanizedDuration(60)).toBe('2 months');
    expect(humanizedDuration(90)).toBe('3 months');
    expect(humanizedDuration(180)).toBe('6 months');
  });

  it('handles negative input as 0', () => {
    expect(humanizedDuration(-5)).toBe('0 days');
  });

  it('rounds 7 days to "7 days" not "1 week"', () => {
    // Threshold is 14 — 7 stays in days bucket
    expect(humanizedDuration(7)).toBe('7 days');
  });
});
