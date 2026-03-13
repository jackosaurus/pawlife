import { renderHook, waitFor } from '@testing-library/react-native';
import { useMedications } from './useMedications';
import { healthService } from '@/services/healthService';

jest.mock('@/services/healthService', () => ({
  healthService: {
    getMedications: jest.fn(),
  },
}));

const mockGetMedications = healthService.getMedications as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useMedications', () => {
  it('loads medications on mount', async () => {
    const meds = [
      { id: '1', name: 'Apoquel', pet_id: 'p1', is_completed: false },
    ];
    mockGetMedications.mockResolvedValue(meds);

    const { result } = renderHook(() => useMedications('p1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications).toEqual(meds);
    expect(result.current.error).toBeNull();
    expect(mockGetMedications).toHaveBeenCalledWith('p1');
  });

  it('filters active medications', async () => {
    const meds = [
      { id: '1', name: 'Apoquel', is_completed: false },
      { id: '2', name: 'Rimadyl', is_completed: true },
    ];
    mockGetMedications.mockResolvedValue(meds);

    const { result } = renderHook(() => useMedications('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeMedications).toHaveLength(1);
    expect(result.current.activeMedications[0].name).toBe('Apoquel');
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
