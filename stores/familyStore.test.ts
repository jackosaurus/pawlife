import { useFamilyStore } from './familyStore';
import { familyService } from '@/services/familyService';
import { supabase } from '@/services/supabase';

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
const mockGetUser = supabase.auth.getUser as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
  });
  useFamilyStore.setState({
    family: null,
    members: [],
    myRole: null,
    loading: false,
    error: null,
  });
});

describe('familyStore', () => {
  describe('loadFamily', () => {
    it('loads family, members, and derives role from members', async () => {
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

      await useFamilyStore.getState().loadFamily();

      const state = useFamilyStore.getState();
      expect(state.family).toEqual({
        id: 'fam-1',
        name: 'Test Family',
        created_by: 'user-1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      });
      expect(state.members).toHaveLength(1);
      expect(state.myRole).toBe('admin');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('derives member role correctly', async () => {
      const familyData = {
        id: 'fam-1',
        name: 'Test Family',
        created_by: 'other-user',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        members: [
          {
            id: 'm1',
            family_id: 'fam-1',
            user_id: 'other-user',
            role: 'admin' as const,
            joined_at: '2025-01-01',
          },
          {
            id: 'm2',
            family_id: 'fam-1',
            user_id: 'user-1',
            role: 'member' as const,
            joined_at: '2025-01-02',
          },
        ],
      };

      mockFamilyService.getFamily.mockResolvedValue(familyData);

      await useFamilyStore.getState().loadFamily();

      const state = useFamilyStore.getState();
      expect(state.myRole).toBe('member');
    });

    it('handles null family result', async () => {
      mockFamilyService.getFamily.mockResolvedValue(null);

      await useFamilyStore.getState().loadFamily();

      const state = useFamilyStore.getState();
      expect(state.family).toBeNull();
      expect(state.members).toEqual([]);
      expect(state.myRole).toBeNull();
      expect(state.loading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockFamilyService.getFamily.mockRejectedValue(
        new Error('Network error'),
      );

      await useFamilyStore.getState().loadFamily();

      const state = useFamilyStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.loading).toBe(false);
    });

    it('sets loading during fetch', async () => {
      mockFamilyService.getFamily.mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      useFamilyStore.getState().loadFamily();
      expect(useFamilyStore.getState().loading).toBe(true);
    });
  });

  describe('clearFamily', () => {
    it('resets all family state', () => {
      useFamilyStore.setState({
        family: {
          id: 'fam-1',
          name: 'Test',
          created_by: 'u1',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
        members: [
          {
            id: 'm1',
            family_id: 'fam-1',
            user_id: 'u1',
            role: 'admin',
            joined_at: '2025-01-01',
          },
        ],
        myRole: 'admin',
        loading: true,
        error: 'some error',
      });

      useFamilyStore.getState().clearFamily();

      const state = useFamilyStore.getState();
      expect(state.family).toBeNull();
      expect(state.members).toEqual([]);
      expect(state.myRole).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
