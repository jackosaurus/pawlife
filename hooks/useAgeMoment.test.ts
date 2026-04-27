import { renderHook } from '@testing-library/react-native';
import { useAgeMoment } from './useAgeMoment';

/**
 * The hook reads `new Date()` directly, so each test sets a fixed system
 * time via Jest's fake-timer machinery and a fixed dob. All dates use the
 * local timezone — no UTC games — to mirror real device behavior.
 */

function setToday(year: number, monthIndex: number, day: number): void {
  jest.setSystemTime(new Date(year, monthIndex, day, 9, 0, 0));
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useAgeMoment', () => {
  describe('default phase', () => {
    it('renders default copy on a normal day', () => {
      setToday(2026, 5, 15); // 15 Jun 2026
      const dob = new Date(2018, 2, 14); // 14 Mar 2018 → 8 years old
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('default');
      expect(result.current.label).toBe('Buddy is 8 years old');
      expect(result.current.isFestive).toBe(false);
    });

    it('day before birthday → still default with previous-year age', () => {
      setToday(2026, 2, 13); // 13 Mar 2026
      const dob = new Date(2018, 2, 14); // 14 Mar 2018
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('default');
      expect(result.current.label).toBe('Buddy is 7 years old');
    });

    it('31 days after birthday → returns to default', () => {
      // dob 14 Mar 2018, today 14 Apr 2026 = 31 days later
      setToday(2026, 3, 14);
      const dob = new Date(2018, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('default');
      expect(result.current.label).toBe('Buddy is 8 years old');
    });

    it('singular "1 year old" when pet just turned 1 outside savor window', () => {
      // dob 14 Mar 2025, today 1 Jun 2026 → 1 year + ~2.5 months, savor passed
      setToday(2026, 5, 1);
      const dob = new Date(2025, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Luna', dob));
      expect(result.current.phase).toBe('default');
      expect(result.current.label).toBe('Luna is 1 year old');
    });

    it('plural "2 years old" for 2-year-old', () => {
      setToday(2026, 5, 15);
      const dob = new Date(2024, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Luna', dob));
      expect(result.current.label).toBe('Luna is 2 years old');
    });
  });

  describe('birthday phase', () => {
    it('fires on the birthday day with cake emoji and festive flag', () => {
      setToday(2026, 2, 14); // 14 Mar 2026
      const dob = new Date(2017, 2, 14); // 14 Mar 2017 → turning 9 today
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('birthday');
      expect(result.current.label).toBe('🎂 Buddy is 9 today');
      expect(result.current.isFestive).toBe(true);
    });

    it('first birthday: pet turning 1 today fires birthday, not puppy', () => {
      setToday(2026, 2, 14);
      const dob = new Date(2025, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('birthday');
      expect(result.current.label).toBe('🎂 Buddy is 1 today');
      expect(result.current.isFestive).toBe(true);
    });

    it('leap-day dob fires on Feb 28 in non-leap year', () => {
      // 2026 is not a leap year. dob 29 Feb 2020 → fire on 28 Feb 2026.
      setToday(2026, 1, 28);
      const dob = new Date(2020, 1, 29);
      const { result } = renderHook(() => useAgeMoment('Luna', dob));
      expect(result.current.phase).toBe('birthday');
      expect(result.current.isFestive).toBe(true);
      expect(result.current.label).toBe('🎂 Luna is 6 today');
    });

    it('leap-day dob fires on Feb 29 in a leap year', () => {
      setToday(2024, 1, 29);
      const dob = new Date(2020, 1, 29);
      const { result } = renderHook(() => useAgeMoment('Luna', dob));
      expect(result.current.phase).toBe('birthday');
      expect(result.current.label).toBe('🎂 Luna is 4 today');
    });
  });

  describe('savor phase', () => {
    it('day after birthday → savor', () => {
      setToday(2026, 2, 15);
      const dob = new Date(2017, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('savor');
      expect(result.current.label).toBe('Buddy just turned 9');
      expect(result.current.isFestive).toBe(false);
    });

    it('30 days after birthday → still savor', () => {
      setToday(2026, 3, 13); // 13 Apr 2026, 30 days after 14 Mar
      const dob = new Date(2017, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('savor');
      expect(result.current.label).toBe('Buddy just turned 9');
    });

    it('savor copy stays the same regardless of pluralization (always a single year number)', () => {
      setToday(2026, 2, 20);
      const dob = new Date(2025, 2, 14); // turned 1 a week ago
      const { result } = renderHook(() => useAgeMoment('Luna', dob));
      expect(result.current.phase).toBe('savor');
      expect(result.current.label).toBe('Luna just turned 1');
    });
  });

  describe('puppy phase', () => {
    it('under 8 weeks → weeks copy', () => {
      // dob 1 Jun 2026, today 1 Jul 2026 → ~4 weeks
      setToday(2026, 6, 1);
      const dob = new Date(2026, 5, 1);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('puppy');
      expect(result.current.label).toBe('Buddy is 4 weeks old');
      expect(result.current.isFestive).toBe(false);
    });

    it('singular "1 week old"', () => {
      setToday(2026, 5, 8);
      const dob = new Date(2026, 5, 1);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.label).toBe('Buddy is 1 week old');
    });

    it('between 8 weeks and 1 year → months copy', () => {
      // dob 1 Jan 2026, today 1 May 2026 → 4 months
      setToday(2026, 4, 1);
      const dob = new Date(2026, 0, 1);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('puppy');
      expect(result.current.label).toBe('Buddy is 4 months old');
    });

    it('exactly 8 weeks → switches from weeks to months copy', () => {
      // dob 1 Jan 2026, today 26 Feb 2026 → 56 days = 8 weeks = 1 calendar month
      setToday(2026, 1, 26);
      const dob = new Date(2026, 0, 1);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.phase).toBe('puppy');
      expect(result.current.label).toBe('Buddy is 1 month old');
    });

    it('11 months → still puppy with months copy', () => {
      setToday(2026, 11, 1);
      const dob = new Date(2026, 0, 1);
      const { result } = renderHook(() => useAgeMoment('Luna', dob));
      expect(result.current.phase).toBe('puppy');
      expect(result.current.label).toBe('Luna is 11 months old');
    });
  });

  describe('input handling', () => {
    it('accepts an ISO string for dob', () => {
      setToday(2026, 5, 15);
      const { result } = renderHook(() =>
        useAgeMoment('Buddy', '2018-03-14'),
      );
      expect(result.current.phase).toBe('default');
      // Note: ISO date "2018-03-14" parses to UTC midnight → may shift one day
      // backwards in negative UTC offsets, but the year math is stable.
      expect(result.current.label).toMatch(/Buddy is (7|8) years old/);
    });

    it('preserves pet name in all states', () => {
      setToday(2026, 2, 14);
      const dob = new Date(2017, 2, 14);
      const { result } = renderHook(() =>
        useAgeMoment('Sir Reginald', dob),
      );
      expect(result.current.label).toBe('🎂 Sir Reginald is 9 today');
    });
  });

  /**
   * shortLabel — name-less variant for surfaces (like the dashboard
   * `PetCard`) where the pet name is already a heading. Mirrors `label`
   * across all four phases and shares the same edge-case logic
   * (plural / leap-day / weeks-vs-months).
   */
  describe('shortLabel', () => {
    it('default phase: "{N} years old" with plural', () => {
      setToday(2026, 5, 15);
      const dob = new Date(2018, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.shortLabel).toBe('8 years old');
    });

    it('default phase: singular "1 year old"', () => {
      setToday(2026, 5, 1);
      const dob = new Date(2025, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Luna', dob));
      expect(result.current.shortLabel).toBe('1 year old');
    });

    it('birthday phase: cake emoji + "{N} today"', () => {
      setToday(2026, 2, 14);
      const dob = new Date(2017, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.shortLabel).toBe('🎂 9 today');
      expect(result.current.isFestive).toBe(true);
    });

    it('birthday phase: leap-day dob fires on Feb 28 in non-leap year', () => {
      setToday(2026, 1, 28);
      const dob = new Date(2020, 1, 29);
      const { result } = renderHook(() => useAgeMoment('Luna', dob));
      expect(result.current.shortLabel).toBe('🎂 6 today');
    });

    it('savor phase: capitalized "Just turned {N}"', () => {
      setToday(2026, 2, 15);
      const dob = new Date(2017, 2, 14);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.shortLabel).toBe('Just turned 9');
    });

    it('puppy phase: weeks copy under 8 weeks', () => {
      setToday(2026, 6, 1);
      const dob = new Date(2026, 5, 1);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.shortLabel).toBe('4 weeks old');
    });

    it('puppy phase: singular "1 week old"', () => {
      setToday(2026, 5, 8);
      const dob = new Date(2026, 5, 1);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.shortLabel).toBe('1 week old');
    });

    it('puppy phase: months copy between 8 weeks and 1 year', () => {
      setToday(2026, 4, 1);
      const dob = new Date(2026, 0, 1);
      const { result } = renderHook(() => useAgeMoment('Buddy', dob));
      expect(result.current.shortLabel).toBe('4 months old');
    });

    it('does not include pet name in any phase (regression guard)', () => {
      // Default
      setToday(2026, 5, 15);
      let r = renderHook(() =>
        useAgeMoment('Buddy', new Date(2018, 2, 14)),
      ).result.current;
      expect(r.shortLabel).not.toMatch(/Buddy/);

      // Birthday
      setToday(2026, 2, 14);
      r = renderHook(() =>
        useAgeMoment('Buddy', new Date(2017, 2, 14)),
      ).result.current;
      expect(r.shortLabel).not.toMatch(/Buddy/);

      // Savor
      setToday(2026, 2, 15);
      r = renderHook(() =>
        useAgeMoment('Buddy', new Date(2017, 2, 14)),
      ).result.current;
      expect(r.shortLabel).not.toMatch(/Buddy/);

      // Puppy
      setToday(2026, 4, 1);
      r = renderHook(() =>
        useAgeMoment('Buddy', new Date(2026, 0, 1)),
      ).result.current;
      expect(r.shortLabel).not.toMatch(/Buddy/);
    });
  });
});
