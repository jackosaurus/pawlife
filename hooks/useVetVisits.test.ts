import { renderHook, waitFor } from '@testing-library/react-native';
import { useVetVisits } from './useVetVisits';
import { healthService } from '@/services/healthService';

jest.mock('@/services/healthService', () => ({
  healthService: {
    getVetVisits: jest.fn(),
  },
}));

const mockGetVetVisits = healthService.getVetVisits as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useVetVisits', () => {
  it('loads vet visits on mount', async () => {
    const visits = [{ id: '1', date: '2025-01-01', pet_id: 'p1' }];
    mockGetVetVisits.mockResolvedValue(visits);

    const { result } = renderHook(() => useVetVisits('p1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.vetVisits).toEqual(visits);
    expect(result.current.error).toBeNull();
    expect(mockGetVetVisits).toHaveBeenCalledWith('p1');
  });

  it('sets error on failure', async () => {
    mockGetVetVisits.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVetVisits('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load vet visits');
    expect(result.current.vetVisits).toEqual([]);
  });

  it('exposes refresh function', async () => {
    mockGetVetVisits.mockResolvedValue([]);

    const { result } = renderHook(() => useVetVisits('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
