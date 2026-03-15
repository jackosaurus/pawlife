import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useActionItems } from './useActionItems';
import { healthService } from '@/services/healthService';
import { Pet } from '@/types';

jest.mock('@/services/healthService', () => ({
  healthService: {
    getActiveMedicationsForPets: jest.fn(),
    getTodayDoseCounts: jest.fn(),
    getLatestDoseForMedications: jest.fn(),
    getActionableVaccinations: jest.fn(),
  },
}));

jest.mock('@/utils/status', () => ({
  getRecurringMedicationStatus: jest.fn(),
  getVaccinationStatus: jest.fn(),
}));

jest.mock('@/constants/frequencies', () => ({
  getDosesPerDay: jest.fn((freq: string) => {
    const map: Record<string, number | null> = {
      'Once daily': 1,
      'Twice daily': 2,
      'Three times daily': 3,
      'Once monthly': 1,
      'Once weekly': 1,
    };
    return map[freq] ?? null;
  }),
  isRecurringFrequency: jest.fn((freq: string) => {
    const recurring = [
      'Once daily',
      'Twice daily',
      'Three times daily',
      'Once monthly',
      'Once weekly',
    ];
    return recurring.includes(freq);
  }),
  FREQUENCY_CONFIG: {},
  FREQUENCY_INTERVAL_DAYS: {},
}));

const mockGetActiveMeds = healthService.getActiveMedicationsForPets as jest.Mock;
const mockGetTodayCounts = healthService.getTodayDoseCounts as jest.Mock;
const mockGetLatestDoses = healthService.getLatestDoseForMedications as jest.Mock;
const mockGetActionableVax = healthService.getActionableVaccinations as jest.Mock;

const { getRecurringMedicationStatus } = jest.requireMock('@/utils/status');
const mockGetMedStatus = getRecurringMedicationStatus as jest.Mock;

const makePet = (overrides: Partial<Pet> = {}): Pet => ({
  id: 'pet-1',
  family_id: 'fam-1',
  created_by: 'user-1',
  pet_type: 'dog',
  name: 'Buddy',
  breed: null,
  date_of_birth: null,
  approximate_age_months: null,
  sex: null,
  weight: null,
  microchip_number: null,
  profile_photo_url: null,
  is_archived: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

function setupEmptyMocks() {
  mockGetActiveMeds.mockResolvedValue([]);
  mockGetTodayCounts.mockResolvedValue({});
  mockGetLatestDoses.mockResolvedValue({});
  mockGetActionableVax.mockResolvedValue([]);
}

beforeEach(() => {
  jest.clearAllMocks();
  setupEmptyMocks();
});

describe('useActionItems', () => {
  it('returns empty array when no pets provided', async () => {
    const { result } = renderHook(() => useActionItems([]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.actionItems).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockGetActiveMeds).not.toHaveBeenCalled();
    expect(mockGetActionableVax).not.toHaveBeenCalled();
  });

  it('returns medication action items for overdue medications', async () => {
    const pets = [makePet({ id: 'p1', name: 'Buddy' })];
    const meds = [
      {
        id: 'med-1',
        pet_id: 'p1',
        name: 'Heartgard',
        frequency: 'Once monthly',
        start_date: '2025-01-01',
        end_date: null,
        is_completed: false,
      },
    ];

    mockGetActiveMeds.mockResolvedValue(meds);
    mockGetTodayCounts.mockResolvedValue({ 'med-1': 0 });
    mockGetLatestDoses.mockResolvedValue({ 'med-1': '2025-01-01T10:00:00Z' });
    mockGetMedStatus.mockReturnValue('overdue');

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.actionItems).toHaveLength(1);
    const item = result.current.actionItems[0];
    expect(item.id).toBe('med-med-1');
    expect(item.type).toBe('medication');
    expect(item.urgency).toBe('overdue');
    expect(item.petName).toBe('Buddy');
    expect(item.title).toBe('Heartgard');
    expect(item.subtitle).toBe('Overdue');
    expect(item.medicationId).toBe('med-1');
  });

  it('returns medication action items for due-today medications', async () => {
    const pets = [makePet({ id: 'p1', name: 'Buddy' })];
    const meds = [
      {
        id: 'med-1',
        pet_id: 'p1',
        name: 'Rimadyl',
        frequency: 'Once daily',
        start_date: '2025-01-01',
        end_date: null,
        is_completed: false,
      },
    ];

    mockGetActiveMeds.mockResolvedValue(meds);
    mockGetTodayCounts.mockResolvedValue({ 'med-1': 0 });
    mockGetLatestDoses.mockResolvedValue({});
    mockGetMedStatus.mockReturnValue('amber');

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.actionItems).toHaveLength(1);
    const item = result.current.actionItems[0];
    expect(item.urgency).toBe('due_today');
    expect(item.subtitle).toBe('Due today');
  });

  it('returns multi-daily medication with remaining doses subtitle', async () => {
    const pets = [makePet({ id: 'p1', name: 'Luna' })];
    const meds = [
      {
        id: 'med-1',
        pet_id: 'p1',
        name: 'Antibiotic',
        frequency: 'Twice daily',
        start_date: '2025-01-01',
        end_date: null,
        is_completed: false,
      },
    ];

    mockGetActiveMeds.mockResolvedValue(meds);
    mockGetTodayCounts.mockResolvedValue({ 'med-1': 1 });
    mockGetLatestDoses.mockResolvedValue({ 'med-1': '2025-03-15T08:00:00Z' });
    mockGetMedStatus.mockReturnValue('amber');

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.actionItems).toHaveLength(1);
    const item = result.current.actionItems[0];
    expect(item.subtitle).toBe('1 dose remaining today');
  });

  it('returns multi-daily overdue medication with no-doses subtitle', async () => {
    const pets = [makePet({ id: 'p1', name: 'Luna' })];
    const meds = [
      {
        id: 'med-1',
        pet_id: 'p1',
        name: 'Antibiotic',
        frequency: 'Three times daily',
        start_date: '2025-01-01',
        end_date: null,
        is_completed: false,
      },
    ];

    mockGetActiveMeds.mockResolvedValue(meds);
    mockGetTodayCounts.mockResolvedValue({ 'med-1': 0 });
    mockGetLatestDoses.mockResolvedValue({ 'med-1': '2025-03-14T08:00:00Z' });
    mockGetMedStatus.mockReturnValue('overdue');

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const item = result.current.actionItems[0];
    expect(item.subtitle).toBe('Overdue \u2014 no doses today');
  });

  it('returns vaccination action items for overdue vaccinations', async () => {
    const pets = [makePet({ id: 'p1', name: 'Buddy' })];

    // 5 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const pastStr = pastDate.toISOString().split('T')[0];

    mockGetActionableVax.mockResolvedValue([
      {
        id: 'vax-1',
        pet_id: 'p1',
        vaccine_name: 'Rabies',
        date_administered: '2024-01-01',
        next_due_date: pastStr,
      },
    ]);

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.actionItems).toHaveLength(1);
    const item = result.current.actionItems[0];
    expect(item.id).toBe('vax-vax-1');
    expect(item.type).toBe('vaccination');
    expect(item.urgency).toBe('overdue');
    expect(item.title).toBe('Rabies');
    expect(item.subtitle).toBe('Overdue by 5 days');
  });

  it('returns vaccination action items for upcoming vaccinations', async () => {
    const pets = [makePet({ id: 'p1', name: 'Buddy' })];

    // 7 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureStr = futureDate.toISOString().split('T')[0];

    mockGetActionableVax.mockResolvedValue([
      {
        id: 'vax-1',
        pet_id: 'p1',
        vaccine_name: 'DHPP',
        date_administered: '2024-06-01',
        next_due_date: futureStr,
      },
    ]);

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.actionItems).toHaveLength(1);
    const item = result.current.actionItems[0];
    expect(item.type).toBe('vaccination');
    expect(item.urgency).toBe('upcoming');
    expect(item.subtitle).toBe('Due in 7 days');
  });

  it('filters out medications with green status', async () => {
    const pets = [makePet({ id: 'p1', name: 'Buddy' })];
    const meds = [
      {
        id: 'med-1',
        pet_id: 'p1',
        name: 'Heartgard',
        frequency: 'Once monthly',
        start_date: '2025-01-01',
        end_date: null,
        is_completed: false,
      },
      {
        id: 'med-2',
        pet_id: 'p1',
        name: 'Rimadyl',
        frequency: 'Once daily',
        start_date: '2025-01-01',
        end_date: null,
        is_completed: false,
      },
    ];

    mockGetActiveMeds.mockResolvedValue(meds);
    mockGetTodayCounts.mockResolvedValue({ 'med-1': 1, 'med-2': 0 });
    mockGetLatestDoses.mockResolvedValue({
      'med-1': '2025-03-15T10:00:00Z',
      'med-2': '2025-03-14T10:00:00Z',
    });
    // First med is green (up to date), second is amber (due today)
    mockGetMedStatus.mockImplementation(
      (
        _lastGiven: string | null,
        _freq: string,
        _todayCount: number,
        _dosesPerDay: number | null,
      ) => {
        // Called for med-1 first, then med-2
        if (mockGetMedStatus.mock.calls.length <= 1) return 'green';
        return 'amber';
      },
    );

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Only the amber medication should appear
    expect(result.current.actionItems).toHaveLength(1);
    expect(result.current.actionItems[0].title).toBe('Rimadyl');
  });

  it('sorts items by priority: overdue meds > due_today meds > overdue vax > upcoming vax', async () => {
    const pets = [
      makePet({ id: 'p1', name: 'Buddy' }),
      makePet({ id: 'p2', name: 'Luna' }),
    ];

    // Overdue medication
    const overdueMed = {
      id: 'med-1',
      pet_id: 'p1',
      name: 'Heartgard',
      frequency: 'Once monthly',
      start_date: '2025-01-01',
      end_date: null,
      is_completed: false,
    };
    // Due-today medication
    const dueTodayMed = {
      id: 'med-2',
      pet_id: 'p2',
      name: 'Rimadyl',
      frequency: 'Once daily',
      start_date: '2025-01-01',
      end_date: null,
      is_completed: false,
    };

    mockGetActiveMeds.mockResolvedValue([overdueMed, dueTodayMed]);
    mockGetTodayCounts.mockResolvedValue({ 'med-1': 0, 'med-2': 0 });
    mockGetLatestDoses.mockResolvedValue({ 'med-1': '2025-01-01T10:00:00Z' });

    // med-1 is overdue, med-2 is amber (due today)
    mockGetMedStatus.mockImplementation(
      (lastGiven: string | null) => {
        if (lastGiven === '2025-01-01T10:00:00Z') return 'overdue';
        return 'amber';
      },
    );

    // Overdue vaccination (5 days ago)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const pastStr = pastDate.toISOString().split('T')[0];

    // Upcoming vaccination (10 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const futureStr = futureDate.toISOString().split('T')[0];

    mockGetActionableVax.mockResolvedValue([
      {
        id: 'vax-2',
        pet_id: 'p2',
        vaccine_name: 'DHPP',
        date_administered: '2024-06-01',
        next_due_date: futureStr,
      },
      {
        id: 'vax-1',
        pet_id: 'p1',
        vaccine_name: 'Rabies',
        date_administered: '2024-01-01',
        next_due_date: pastStr,
      },
    ]);

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.actionItems).toHaveLength(4);
    expect(result.current.actionItems[0].type).toBe('medication');
    expect(result.current.actionItems[0].urgency).toBe('overdue');
    expect(result.current.actionItems[1].type).toBe('medication');
    expect(result.current.actionItems[1].urgency).toBe('due_today');
    expect(result.current.actionItems[2].type).toBe('vaccination');
    expect(result.current.actionItems[2].urgency).toBe('overdue');
    expect(result.current.actionItems[3].type).toBe('vaccination');
    expect(result.current.actionItems[3].urgency).toBe('upcoming');
  });

  it('sets loading states correctly', async () => {
    const pets = [makePet({ id: 'p1', name: 'Buddy' })];

    const { result } = renderHook(() => useActionItems(pets));

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles errors gracefully', async () => {
    const pets = [makePet({ id: 'p1', name: 'Buddy' })];
    mockGetActiveMeds.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load action items');
    expect(result.current.actionItems).toEqual([]);
  });

  it('refresh function reloads data', async () => {
    const pets = [makePet({ id: 'p1', name: 'Buddy' })];

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetActiveMeds).toHaveBeenCalledTimes(1);

    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGetActiveMeds).toHaveBeenCalledTimes(2);
  });

  it('sorts alphabetically by pet name within same priority', async () => {
    const pets = [
      makePet({ id: 'p1', name: 'Zelda' }),
      makePet({ id: 'p2', name: 'Alpha' }),
    ];

    const meds = [
      {
        id: 'med-1',
        pet_id: 'p1',
        name: 'Heartgard',
        frequency: 'Once monthly',
        start_date: '2025-01-01',
        end_date: null,
        is_completed: false,
      },
      {
        id: 'med-2',
        pet_id: 'p2',
        name: 'Rimadyl',
        frequency: 'Once daily',
        start_date: '2025-01-01',
        end_date: null,
        is_completed: false,
      },
    ];

    mockGetActiveMeds.mockResolvedValue(meds);
    mockGetTodayCounts.mockResolvedValue({});
    mockGetLatestDoses.mockResolvedValue({});
    mockGetMedStatus.mockReturnValue('overdue');

    const { result } = renderHook(() => useActionItems(pets));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Both overdue meds — Alpha's pet should come first
    expect(result.current.actionItems[0].petName).toBe('Alpha');
    expect(result.current.actionItems[1].petName).toBe('Zelda');
  });
});
