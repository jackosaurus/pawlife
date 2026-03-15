import { renderHook, waitFor } from '@testing-library/react-native';
import { useFamily } from './useFamily';
import { useFamilyStore } from '@/stores/familyStore';
import { familyService } from '@/services/familyService';

jest.mock('@/services/familyService', () => ({
  familyService: {
    getFamily: jest.fn(),
  },
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
  },
}));

const mockFamilyService = familyService as jest.Mocked<typeof familyService>;

beforeEach(() => {
  jest.clearAllMocks();
  useFamilyStore.setState({
    family: null,
    members: [],
    myRole: null,
    loading: false,
    error: null,
  });
});

describe('useFamily', () => {
  it('loads family on mount', async () => {
    const familyData = {
      id: 'fam-1',
      name: 'Test Family',
      created_by: 'user-1',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      members: [
        {
          id: 'm1',
          family_id: 'fam-1',
          user_id: 'user-1',
          role: 'admin' as const,
          joined_at: '2025-01-01',
          email: 'test@test.com',
        },
      ],
    };

    mockFamilyService.getFamily.mockResolvedValue(familyData);

    const { result } = renderHook(() => useFamily());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.family).not.toBeNull();
    expect(result.current.family!.id).toBe('fam-1');
    expect(result.current.members).toHaveLength(1);
    expect(result.current.myRole).toBe('admin');
    expect(result.current.error).toBeNull();
    expect(mockFamilyService.getFamily).toHaveBeenCalled();
  });

  it('sets error on failure', async () => {
    mockFamilyService.getFamily.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFamily());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.family).toBeNull();
  });

  it('exposes refresh function', async () => {
    mockFamilyService.getFamily.mockResolvedValue(null);

    const { result } = renderHook(() => useFamily());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });
});
