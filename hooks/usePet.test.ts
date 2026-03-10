import { renderHook, waitFor } from '@testing-library/react-native';
import { usePet } from './usePet';
import { petService } from '@/services/petService';

jest.mock('@/services/petService', () => ({
  petService: {
    getById: jest.fn(),
  },
}));

const mockGetById = petService.getById as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePet', () => {
  it('loads pet on mount', async () => {
    const pet = { id: '1', name: 'Buddy' };
    mockGetById.mockResolvedValue(pet);

    const { result } = renderHook(() => usePet('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pet).toEqual(pet);
    expect(result.current.error).toBeNull();
    expect(mockGetById).toHaveBeenCalledWith('1');
  });

  it('sets error on failure', async () => {
    mockGetById.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => usePet('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load pet details');
    expect(result.current.pet).toBeNull();
  });

  it('exposes refresh function', async () => {
    mockGetById.mockResolvedValue({ id: '1', name: 'Buddy' });

    const { result } = renderHook(() => usePet('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
