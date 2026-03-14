import { renderHook, waitFor } from '@testing-library/react-native';
import { useMedications } from './useMedications';
import { healthService } from '@/services/healthService';

jest.mock('@/services/healthService', () => ({
  healthService: {
    getMedications: jest.fn(),
    getLatestDoseForMedications: jest.fn(),
    getTodayDoseCounts: jest.fn(),
  },
}));

const mockGetMedications = healthService.getMedications as jest.Mock;
const mockGetLatestDoses = healthService.getLatestDoseForMedications as jest.Mock;
const mockGetTodayCounts = healthService.getTodayDoseCounts as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetLatestDoses.mockResolvedValue({});
  mockGetTodayCounts.mockResolvedValue({});
});

describe('useMedications', () => {
  it('loads medications on mount and enriches with dose info', async () => {
    const meds = [
      { id: '1', name: 'Heartgard', pet_id: 'p1', frequency: 'Once monthly', end_date: null },
    ];
    mockGetMedications.mockResolvedValue(meds);
    mockGetLatestDoses.mockResolvedValue({ '1': '2025-01-15T10:00:00Z' });
    mockGetTodayCounts.mockResolvedValue({ '1': 0 });

    const { result } = renderHook(() => useMedications('p1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications).toHaveLength(1);
    expect(result.current.medications[0].isRecurring).toBe(true);
    expect(result.current.medications[0].lastGivenDate).toBe('2025-01-15T10:00:00Z');
    expect(result.current.medications[0].todayDoseCount).toBe(0);
    expect(result.current.medications[0].dosesPerDay).toBe(1);
    expect(result.current.error).toBeNull();
    expect(mockGetMedications).toHaveBeenCalledWith('p1');
  });

  it('marks one-off medications as not recurring', async () => {
    const meds = [
      { id: '1', name: 'Apoquel', frequency: 'Custom schedule', end_date: null },
      { id: '2', name: 'Rimadyl', frequency: null, end_date: '2025-01-01' },
    ];
    mockGetMedications.mockResolvedValue(meds);

    const { result } = renderHook(() => useMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications[0].isRecurring).toBe(false);
    expect(result.current.medications[1].isRecurring).toBe(false);
  });

  it('enriches multi-daily meds with dosesPerDay', async () => {
    const meds = [
      { id: '1', name: 'Antibiotic', pet_id: 'p1', frequency: 'Twice daily', end_date: null },
    ];
    mockGetMedications.mockResolvedValue(meds);
    mockGetLatestDoses.mockResolvedValue({});
    mockGetTodayCounts.mockResolvedValue({ '1': 1 });

    const { result } = renderHook(() => useMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications[0].dosesPerDay).toBe(2);
    expect(result.current.medications[0].todayDoseCount).toBe(1);
  });

  it('filters currentMedications correctly', async () => {
    const meds = [
      { id: '1', name: 'Heartgard', frequency: 'Once monthly', end_date: null },
      { id: '2', name: 'Apoquel', frequency: null, end_date: null },
      { id: '3', name: 'Rimadyl', frequency: null, end_date: '2020-01-01' },
    ];
    mockGetMedications.mockResolvedValue(meds);

    const { result } = renderHook(() => useMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Recurring and one-off without past end_date should be current
    expect(result.current.currentMedications).toHaveLength(2);
    expect(result.current.currentMedications.map((m) => m.name)).toEqual(['Heartgard', 'Apoquel']);
  });

  it('sets error on failure', async () => {
    mockGetMedications.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load medications');
    expect(result.current.medications).toEqual([]);
  });

  it('exposes refresh function', async () => {
    mockGetMedications.mockResolvedValue([]);

    const { result } = renderHook(() => useMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
