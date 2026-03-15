import { notificationService } from './notificationService';
import { supabase } from './supabase';

jest.mock('./supabase', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

const mockFrom = supabase.from as jest.Mock;

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  const handler = () =>
    new Proxy(chain, {
      get: (target, prop) => {
        if (prop === 'then') return undefined;
        if (!target[prop as string]) {
          target[prop as string] = jest.fn().mockReturnValue(
            new Proxy(
              {},
              {
                get: (_, p) => {
                  if (p === 'then') {
                    return (resolve: (v: unknown) => void) => resolve(result);
                  }
                  return chain[p as string] || jest.fn().mockReturnThis();
                },
              },
            ),
          );
        }
        return target[prop as string];
      },
    });
  return handler();
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notificationService', () => {
  describe('registerPushToken', () => {
    it('appends token to empty array', async () => {
      // First call: fetch existing tokens
      const fetchChain = chainMock({
        data: { push_tokens: [] },
        error: null,
      });
      // Second call: update with new token
      const updateChain = chainMock({ data: null, error: null });

      mockFrom
        .mockReturnValueOnce(fetchChain)
        .mockReturnValueOnce(updateChain);

      await notificationService.registerPushToken('u1', 'token-abc', 'ios');

      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it('replaces existing token with same value', async () => {
      const existing = [
        { token: 'token-abc', platform: 'ios', updated_at: '2024-01-01' },
      ];
      const fetchChain = chainMock({
        data: { push_tokens: existing },
        error: null,
      });
      const updateChain = chainMock({ data: null, error: null });

      mockFrom
        .mockReturnValueOnce(fetchChain)
        .mockReturnValueOnce(updateChain);

      await notificationService.registerPushToken('u1', 'token-abc', 'ios');

      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it('throws on fetch error', async () => {
      const fetchChain = chainMock({
        data: null,
        error: new Error('Fetch failed'),
      });
      mockFrom.mockReturnValueOnce(fetchChain);

      await expect(
        notificationService.registerPushToken('u1', 'token-abc', 'ios'),
      ).rejects.toThrow('Fetch failed');
    });

    it('throws on update error', async () => {
      const fetchChain = chainMock({
        data: { push_tokens: [] },
        error: null,
      });
      const updateChain = chainMock({
        data: null,
        error: new Error('Update failed'),
      });
      mockFrom
        .mockReturnValueOnce(fetchChain)
        .mockReturnValueOnce(updateChain);

      await expect(
        notificationService.registerPushToken('u1', 'token-abc', 'ios'),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('unregisterPushToken', () => {
    it('removes matching token', async () => {
      const existing = [
        { token: 'token-abc', platform: 'ios', updated_at: '2024-01-01' },
        { token: 'token-def', platform: 'android', updated_at: '2024-01-02' },
      ];
      const fetchChain = chainMock({
        data: { push_tokens: existing },
        error: null,
      });
      const updateChain = chainMock({ data: null, error: null });

      mockFrom
        .mockReturnValueOnce(fetchChain)
        .mockReturnValueOnce(updateChain);

      await notificationService.unregisterPushToken('u1', 'token-abc');

      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it('throws on error', async () => {
      const fetchChain = chainMock({
        data: null,
        error: new Error('Fetch failed'),
      });
      mockFrom.mockReturnValueOnce(fetchChain);

      await expect(
        notificationService.unregisterPushToken('u1', 'token-abc'),
      ).rejects.toThrow('Fetch failed');
    });
  });

  describe('getNotificationPreferences', () => {
    it('returns preferences', async () => {
      const prefs = {
        reminders_enabled: true,
        medication_reminder_time: '20:00',
        vaccination_advance_days: 14,
      };
      mockFrom.mockReturnValue(chainMock({ data: prefs, error: null }));

      const result =
        await notificationService.getNotificationPreferences('u1');
      expect(result).toEqual(prefs);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Not found') }),
      );

      await expect(
        notificationService.getNotificationPreferences('u1'),
      ).rejects.toThrow('Not found');
    });
  });
});
