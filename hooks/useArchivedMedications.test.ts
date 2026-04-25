import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useArchivedMedications } from './useArchivedMedications';
import { healthService } from '@/services/healthService';

jest.mock('@/services/healthService', () => ({
  healthService: {
    getArchivedMedications: jest.fn(),
  },
}));

const mockGet = healthService.getArchivedMedications as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useArchivedMedications', () => {
  it('loads archived medications on mount', async () => {
    const meds = [
      {
        id: 'm1',
        pet_id: 'p1',
        name: 'Apoquel',
        is_archived: true,
        archived_at: '2026-01-15T10:00:00Z',
      },
    ];
    mockGet.mockResolvedValue(meds);

    const { result } = renderHook(() => useArchivedMedications('p1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(meds);
    expect(result.current.error).toBeNull();
    expect(mockGet).toHaveBeenCalledWith('p1');
  });

  it('returns empty array when no archived meds', async () => {
    mockGet.mockResolvedValue([]);

    const { result } = renderHook(() => useArchivedMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });

  it('sets error on failure', async () => {
    mockGet.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useArchivedMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load archived medications');
    expect(result.current.data).toEqual([]);
  });

  it('refresh reloads data', async () => {
    mockGet.mockResolvedValue([]);

    const { result } = renderHook(() => useArchivedMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGet).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
