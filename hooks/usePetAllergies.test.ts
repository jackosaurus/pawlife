import { renderHook, waitFor, act } from '@testing-library/react-native';
import { usePetAllergies } from './usePetAllergies';
import { allergyService } from '@/services/allergyService';

jest.mock('@/services/allergyService', () => ({
  allergyService: {
    listByPet: jest.fn(),
  },
}));

const mockListByPet = allergyService.listByPet as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePetAllergies', () => {
  it('loads allergies on mount', async () => {
    const allergies = [
      { id: '1', pet_id: 'p1', allergen: 'Chicken' },
    ];
    mockListByPet.mockResolvedValue(allergies);

    const { result } = renderHook(() => usePetAllergies('p1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(allergies);
    expect(result.current.error).toBeNull();
    expect(mockListByPet).toHaveBeenCalledWith('p1');
  });

  it('returns an empty list when there are no allergies', async () => {
    mockListByPet.mockResolvedValue([]);

    const { result } = renderHook(() => usePetAllergies('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    mockListByPet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePetAllergies('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load allergies');
    expect(result.current.data).toEqual([]);
  });

  it('refresh re-fetches allergies', async () => {
    mockListByPet.mockResolvedValueOnce([]);
    const { result } = renderHook(() => usePetAllergies('p1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updated = [{ id: '1', pet_id: 'p1', allergen: 'Beef' }];
    mockListByPet.mockResolvedValueOnce(updated);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.data).toEqual(updated);
    expect(mockListByPet).toHaveBeenCalledTimes(2);
  });
});
