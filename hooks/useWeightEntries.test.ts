import { renderHook, waitFor } from '@testing-library/react-native';
import { useWeightEntries } from './useWeightEntries';
import { healthService } from '@/services/healthService';

jest.mock('@/services/healthService', () => ({
  healthService: {
    getWeightEntries: jest.fn(),
  },
}));

const mockGetWeightEntries = healthService.getWeightEntries as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useWeightEntries', () => {
  it('loads weight entries on mount', async () => {
    const entries = [{ id: '1', weight: 25.5, date: '2025-01-01', pet_id: 'p1' }];
    mockGetWeightEntries.mockResolvedValue(entries);

    const { result } = renderHook(() => useWeightEntries('p1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.weightEntries).toEqual(entries);
    expect(result.current.error).toBeNull();
    expect(mockGetWeightEntries).toHaveBeenCalledWith('p1');
  });

  it('sets latestWeight to first entry', async () => {
    const entries = [
      { id: '1', weight: 26.0, date: '2025-02-01' },
      { id: '2', weight: 25.5, date: '2025-01-01' },
    ];
    mockGetWeightEntries.mockResolvedValue(entries);

    const { result } = renderHook(() => useWeightEntries('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.latestWeight).toEqual(entries[0]);
  });

  it('sets latestWeight to null when empty', async () => {
    mockGetWeightEntries.mockResolvedValue([]);

    const { result } = renderHook(() => useWeightEntries('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.latestWeight).toBeNull();
  });

  it('sets error on failure', async () => {
    mockGetWeightEntries.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useWeightEntries('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load weight entries');
    expect(result.current.weightEntries).toEqual([]);
  });

  it('exposes refresh function', async () => {
    mockGetWeightEntries.mockResolvedValue([]);

    const { result } = renderHook(() => useWeightEntries('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
