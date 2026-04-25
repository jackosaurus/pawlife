import { userService } from './userService';
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

describe('userService', () => {
  describe('getProfile', () => {
    it('returns user profile', async () => {
      const user = { id: 'u1', email: 'test@example.com', weight_unit: 'kg', timezone: 'UTC', created_at: '2024-01-01' };
      mockFrom.mockReturnValue(chainMock({ data: user, error: null }));
      const result = await userService.getProfile('u1');
      expect(result).toEqual(user);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Not found') }));
      await expect(userService.getProfile('u1')).rejects.toThrow('Not found');
    });
  });

  describe('updateProfile', () => {
    it('updates and returns user', async () => {
      const user = { id: 'u1', email: 'test@example.com', weight_unit: 'lbs', timezone: 'UTC', created_at: '2024-01-01' };
      mockFrom.mockReturnValue(chainMock({ data: user, error: null }));
      const result = await userService.updateProfile('u1', { weight_unit: 'lbs' });
      expect(result).toEqual(user);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Update failed') }));
      await expect(userService.updateProfile('u1', { weight_unit: 'kg' })).rejects.toThrow('Update failed');
    });
  });
});
