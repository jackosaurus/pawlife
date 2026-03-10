import { authService } from './authService';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authService', () => {
  describe('signUp', () => {
    it('returns data on success', async () => {
      const mockData = { session: { access_token: 'abc' }, user: { id: '1' } };
      mockAuth.signUp.mockResolvedValue({ data: mockData, error: null } as any);

      const result = await authService.signUp('test@example.com', 'pass1234');
      expect(result).toEqual(mockData);
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass1234',
      });
    });

    it('throws on error', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('User already registered'),
      } as any);

      await expect(
        authService.signUp('test@example.com', 'pass1234'),
      ).rejects.toThrow('User already registered');
    });
  });

  describe('signIn', () => {
    it('returns data on success', async () => {
      const mockData = { session: { access_token: 'abc' }, user: { id: '1' } };
      mockAuth.signInWithPassword.mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await authService.signIn('test@example.com', 'pass1234');
      expect(result).toEqual(mockData);
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass1234',
      });
    });

    it('throws on invalid credentials', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      } as any);

      await expect(
        authService.signIn('test@example.com', 'wrong'),
      ).rejects.toThrow('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('resolves on success', async () => {
      mockAuth.signOut.mockResolvedValue({ error: null } as any);
      await expect(authService.signOut()).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockAuth.signOut.mockResolvedValue({
        error: new Error('Sign out failed'),
      } as any);
      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getSession', () => {
    it('returns session', async () => {
      const mockSession = { access_token: 'abc' };
      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      const result = await authService.getSession();
      expect(result).toEqual(mockSession);
    });

    it('returns null when no session', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const result = await authService.getSession();
      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('resolves on success', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      } as any);
      await expect(
        authService.resetPassword('test@example.com'),
      ).resolves.toBeUndefined();
      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });
});
