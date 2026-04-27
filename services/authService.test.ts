import { authService } from './authService';
import { supabase } from './supabase';
import { observabilityService } from './observabilityService';
import { analyticsService } from './analyticsService';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock('./observabilityService', () => ({
  observabilityService: {
    identify: jest.fn(),
    reset: jest.fn(),
  },
}));

jest.mock('./analyticsService', () => ({
  analyticsService: {
    track: jest.fn(),
  },
}));

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockIdentify = observabilityService.identify as jest.Mock;
const mockReset = observabilityService.reset as jest.Mock;
const mockTrack = analyticsService.track as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authService', () => {
  describe('signUp', () => {
    it('returns data on success and identifies the user', async () => {
      const mockData = { session: { access_token: 'abc' }, user: { id: '1' } };
      mockAuth.signUp.mockResolvedValue({ data: mockData, error: null } as any);

      const result = await authService.signUp('test@example.com', 'pass1234');
      expect(result).toEqual(mockData);
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass1234',
      });
      expect(mockIdentify).toHaveBeenCalledWith('1');
    });

    it('emits auth_signup_started before the network call', async () => {
      const mockData = { session: { access_token: 'abc' }, user: { id: '1' } };
      mockAuth.signUp.mockResolvedValue({ data: mockData, error: null } as any);
      await authService.signUp('test@example.com', 'pass1234');
      expect(mockTrack).toHaveBeenCalledWith('auth_signup_started', {});
    });

    it('emits auth_signup_failed on network error and re-throws', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('User already registered'),
      } as any);

      await expect(
        authService.signUp('test@example.com', 'pass1234'),
      ).rejects.toThrow('User already registered');
      expect(mockTrack).toHaveBeenCalledWith('auth_signup_failed', {
        reason: 'User already registered',
      });
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it('emits auth_signup_failed (email_confirmation_pending) when session is null', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: '1' }, session: null },
        error: null,
      } as any);
      await expect(
        authService.signUp('test@example.com', 'pass1234'),
      ).rejects.toThrow('check your email');
      expect(mockTrack).toHaveBeenCalledWith('auth_signup_failed', {
        reason: 'email_confirmation_pending',
      });
      expect(mockIdentify).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('returns data on success and identifies the user', async () => {
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
      expect(mockIdentify).toHaveBeenCalledWith('1');
    });

    it('throws on invalid credentials and does not identify', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      } as any);

      await expect(
        authService.signIn('test@example.com', 'wrong'),
      ).rejects.toThrow('Invalid login credentials');
      expect(mockIdentify).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('resolves on success and resets observability', async () => {
      mockAuth.signOut.mockResolvedValue({ error: null } as any);
      await expect(authService.signOut()).resolves.toBeUndefined();
      expect(mockReset).toHaveBeenCalled();
    });

    it('throws on error and does not reset', async () => {
      mockAuth.signOut.mockResolvedValue({
        error: new Error('Sign out failed'),
      } as any);
      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
      expect(mockReset).not.toHaveBeenCalled();
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

  describe('deleteAccount', () => {
    const mockInvoke = (supabase as any).functions.invoke as jest.Mock;

    it('invokes the delete-account Edge Function and resolves on success', async () => {
      mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
      await expect(authService.deleteAccount()).resolves.toBeUndefined();
      expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
        method: 'POST',
      });
    });

    it('throws when the Edge Function transport returns an error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });
      await expect(authService.deleteAccount()).rejects.toThrow('Network error');
    });

    it('throws when the response body contains an error string (e.g. 429)', async () => {
      mockInvoke.mockResolvedValue({
        data: { error: 'Too many deletion attempts. Try again tomorrow.' },
        error: null,
      });
      await expect(authService.deleteAccount()).rejects.toThrow(
        'Too many deletion attempts',
      );
    });

    it('does not throw on success body without an error key', async () => {
      mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
      await expect(authService.deleteAccount()).resolves.toBeUndefined();
    });
  });
});
