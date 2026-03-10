import { renderHook, waitFor } from '@testing-library/react-native';
import { useFoodEntries } from './useFoodEntries';
import { foodService } from '@/services/foodService';

jest.mock('@/services/foodService', () => ({
  foodService: {
    getCurrent: jest.fn(),
    getHistory: jest.fn(),
  },
}));

const mockGetCurrent = foodService.getCurrent as jest.Mock;
const mockGetHistory = foodService.getHistory as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useFoodEntries', () => {
  it('loads current food and history on mount', async () => {
    const current = { id: '1', brand: 'Purina', end_date: null };
    const history = [
      current,
      { id: '2', brand: 'Blue Buffalo', end_date: '2026-01-01' },
    ];
    mockGetCurrent.mockResolvedValue(current);
    mockGetHistory.mockResolvedValue(history);

    const { result } = renderHook(() => useFoodEntries('pet-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentFood).toEqual(current);
    expect(result.current.history).toEqual(history);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    mockGetCurrent.mockRejectedValue(new Error('Network error'));
    mockGetHistory.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFoodEntries('pet-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load food entries');
    expect(result.current.currentFood).toBeNull();
    expect(result.current.history).toEqual([]);
  });

  it('handles null current food', async () => {
    mockGetCurrent.mockResolvedValue(null);
    mockGetHistory.mockResolvedValue([]);

    const { result } = renderHook(() => useFoodEntries('pet-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentFood).toBeNull();
    expect(result.current.history).toEqual([]);
  });

  it('exposes refresh function', async () => {
    mockGetCurrent.mockResolvedValue(null);
    mockGetHistory.mockResolvedValue([]);

    const { result } = renderHook(() => useFoodEntries('pet-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
