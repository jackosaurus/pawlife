import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useMedicationDoses } from './useMedicationDoses';
import { healthService } from '@/services/healthService';

jest.mock('@/services/healthService', () => ({
  healthService: {
    getMedicationDoses: jest.fn(),
    logMedicationDose: jest.fn(),
  },
}));

const mockGetDoses = healthService.getMedicationDoses as jest.Mock;
const mockLogDose = healthService.logMedicationDose as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useMedicationDoses', () => {
  it('loads doses on mount', async () => {
    const doses = [
      { id: 'd1', medication_id: 'm1', given_at: '2025-01-15T10:00:00Z', notes: null },
    ];
    mockGetDoses.mockResolvedValue(doses);

    const { result } = renderHook(() => useMedicationDoses('m1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.doses).toEqual(doses);
    expect(result.current.error).toBeNull();
    expect(mockGetDoses).toHaveBeenCalledWith('m1');
  });

  it('sets error on failure', async () => {
    mockGetDoses.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useMedicationDoses('m1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load dose history');
    expect(result.current.doses).toEqual([]);
  });

  it('logDose calls service and refreshes', async () => {
    mockGetDoses.mockResolvedValue([]);
    mockLogDose.mockResolvedValue({ id: 'd1', medication_id: 'm1' });

    const { result } = renderHook(() => useMedicationDoses('m1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newDoses = [{ id: 'd1', medication_id: 'm1', given_at: '2025-01-15T10:00:00Z' }];
    mockGetDoses.mockResolvedValue(newDoses);

    await act(async () => {
      await result.current.logDose();
    });

    expect(mockLogDose).toHaveBeenCalledWith({ medication_id: 'm1' });
    expect(result.current.doses).toEqual(newDoses);
  });
});
