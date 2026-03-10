import { renderHook, waitFor } from '@testing-library/react-native';
import { usePets } from './usePets';
import { petService } from '@/services/petService';

jest.mock('@/services/petService', () => ({
  petService: {
    getAll: jest.fn(),
  },
}));

const mockGetAll = petService.getAll as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePets', () => {
  it('loads pets on mount', async () => {
    const pets = [{ id: '1', name: 'Buddy' }];
    mockGetAll.mockResolvedValue(pets);

    const { result } = renderHook(() => usePets());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pets).toEqual(pets);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load your pet family');
    expect(result.current.pets).toEqual([]);
  });

  it('exposes refresh function', async () => {
    mockGetAll.mockResolvedValue([]);

    const { result } = renderHook(() => usePets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
