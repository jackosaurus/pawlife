import { useAuthStore } from './authStore';
import { authService } from '@/services/authService';

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}));

jest.mock('@/services/authService', () => ({
  authService: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    session: null,
    initialized: false,
    loading: false,
    error: null,
  });
});

describe('authStore', () => {
  describe('initialize', () => {
    it('sets session and initialized', async () => {
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().initialized).toBe(true);
    });
  });

  describe('signUp', () => {
    it('sets loading during call and clears on success', async () => {
      mockAuthService.signUp.mockResolvedValue({} as any);

      const promise = useAuthStore.getState().signUp('a@b.com', 'pass1234');
      expect(useAuthStore.getState().loading).toBe(true);

      await promise;
      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('sets error on failure', async () => {
      mockAuthService.signUp.mockRejectedValue(
        new Error('User already registered'),
      );

      await useAuthStore.getState().signUp('a@b.com', 'pass1234');
      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().error).toBe('User already registered');
    });
  });

  describe('signIn', () => {
    it('clears error and sets loading', async () => {
      mockAuthService.signIn.mockResolvedValue({} as any);

      await useAuthStore.getState().signIn('a@b.com', 'pass1234');
      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
      expect(mockAuthService.signIn).toHaveBeenCalledWith('a@b.com', 'pass1234');
    });

    it('sets error on failure', async () => {
      mockAuthService.signIn.mockRejectedValue(
        new Error('Invalid login credentials'),
      );

      await useAuthStore.getState().signIn('a@b.com', 'wrong');
      expect(useAuthStore.getState().error).toBe('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('calls authService.signOut', async () => {
      mockAuthService.signOut.mockResolvedValue(undefined);

      await useAuthStore.getState().signOut();
      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('resets error to null', () => {
      useAuthStore.setState({ error: 'some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
