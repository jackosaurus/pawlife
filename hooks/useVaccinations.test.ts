import { renderHook, waitFor } from '@testing-library/react-native';
import { useVaccinations } from './useVaccinations';
import { healthService } from '@/services/healthService';

jest.mock('@/services/healthService', () => ({
  healthService: {
    getVaccinations: jest.fn(),
  },
}));

const mockGetVaccinations = healthService.getVaccinations as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useVaccinations', () => {
  it('loads vaccinations on mount', async () => {
    const vaccinations = [
      { id: '1', vaccine_name: 'Rabies', pet_id: 'p1' },
    ];
    mockGetVaccinations.mockResolvedValue(vaccinations);

    const { result } = renderHook(() => useVaccinations('p1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.vaccinations).toEqual(vaccinations);
    expect(result.current.error).toBeNull();
    expect(mockGetVaccinations).toHaveBeenCalledWith('p1');
  });

  it('sets error on failure', async () => {
    mockGetVaccinations.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVaccinations('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load vaccinations');
    expect(result.current.vaccinations).toEqual([]);
  });

  it('exposes refresh function', async () => {
    mockGetVaccinations.mockResolvedValue([]);

    const { result } = renderHook(() => useVaccinations('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
