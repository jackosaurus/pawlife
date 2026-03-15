import { familyService, formatInviteCode, normalizeInviteCode } from './familyService';
import { supabase } from './supabase';

jest.mock('expo-crypto', () => ({
  getRandomBytes: (length: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = i * 37; // deterministic for tests
    }
    return bytes;
  },
}));

jest.mock('./supabase', () => {
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();
  const mockAuth = {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
    }),
  };
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
      auth: mockAuth,
    },
  };
});

const mockFrom = supabase.from as jest.Mock;
const mockRpc = (supabase as any).rpc as jest.Mock;
const mockGetUser = (supabase as any).auth.getUser as jest.Mock;

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
                    return (resolve: (v: unknown) => void) =>
                      resolve(result);
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
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
  });
});

describe('familyService', () => {
  describe('formatInviteCode', () => {
    it('formats 8-char code as XXXX-XXXX', () => {
      expect(formatInviteCode('ABCD1234')).toBe('ABCD-1234');
    });
  });

  describe('normalizeInviteCode', () => {
    it('removes hyphens and spaces, uppercases', () => {
      expect(normalizeInviteCode('abc-123')).toBe('ABC123');
      expect(normalizeInviteCode('abc 123')).toBe('ABC123');
      expect(normalizeInviteCode('AbC-1 2 3')).toBe('ABC123');
    });
  });

  describe('getFamily', () => {
    it('returns family with members', async () => {
      const membership = { family_id: 'fam-1' };
      const family = { id: 'fam-1', name: 'Test Family', created_by: 'user-1' };
      const members = [
        { id: 'm1', family_id: 'fam-1', user_id: 'user-1', role: 'admin', joined_at: '2025-01-01', users: { email: 'test@test.com' } },
      ];

      // First call: family_members for membership
      mockFrom.mockReturnValueOnce(chainMock({ data: membership, error: null }));
      // Second call: families
      mockFrom.mockReturnValueOnce(chainMock({ data: family, error: null }));
      // Third call: family_members with users
      mockFrom.mockReturnValueOnce(chainMock({ data: members, error: null }));

      const result = await familyService.getFamily();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('fam-1');
      expect(result!.members).toHaveLength(1);
      expect(result!.members[0].email).toBe('test@test.com');
    });

    it('throws when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      await expect(familyService.getFamily()).rejects.toThrow('Not authenticated');
    });

    it('throws on membership lookup error', async () => {
      mockFrom.mockReturnValueOnce(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(familyService.getFamily()).rejects.toThrow('DB error');
    });
  });

  describe('updateFamilyName', () => {
    it('updates family name', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(
        familyService.updateFamilyName('fam-1', 'New Name'),
      ).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('families');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Update failed') }),
      );
      await expect(
        familyService.updateFamilyName('fam-1', 'New Name'),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('createInvite', () => {
    it('creates and returns invite', async () => {
      const invite = { id: 'inv-1', invite_code: 'ABC123', family_id: 'fam-1' };

      // getActiveInvite: members count check
      mockFrom.mockReturnValueOnce(chainMock({ data: [{ id: 'm1' }], error: null }));
      // getActiveInvite call
      mockFrom.mockReturnValueOnce(chainMock({ data: null, error: null }));
      // insert invite
      mockFrom.mockReturnValueOnce(chainMock({ data: invite, error: null }));

      const result = await familyService.createInvite('fam-1');
      expect(result.id).toBe('inv-1');
    });

    it('throws when family is full', async () => {
      const fourMembers = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
      mockFrom.mockReturnValueOnce(
        chainMock({ data: fourMembers, error: null }),
      );
      await expect(familyService.createInvite('fam-1')).rejects.toThrow(
        'Family already has the maximum number of members',
      );
    });
  });

  describe('revokeInvite', () => {
    it('deletes invite', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(familyService.revokeInvite('inv-1')).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('family_invites');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Delete failed') }),
      );
      await expect(familyService.revokeInvite('inv-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getActiveInvite', () => {
    it('returns active invite', async () => {
      const invite = { id: 'inv-1', invite_code: 'ABC123' };
      mockFrom.mockReturnValue(chainMock({ data: invite, error: null }));
      const result = await familyService.getActiveInvite('fam-1');
      expect(result).toEqual(invite);
    });

    it('returns null when no active invite', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const result = await familyService.getActiveInvite('fam-1');
      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(familyService.getActiveInvite('fam-1')).rejects.toThrow('DB error');
    });
  });

  describe('previewInvite', () => {
    it('returns invite preview via RPC', async () => {
      mockRpc.mockResolvedValue({
        data: {
          family_name: 'Test Family',
          expires_at: '2026-04-01T00:00:00Z',
        },
        error: null,
      });

      const result = await familyService.previewInvite('ABCD-1234');
      expect(result.family_name).toBe('Test Family');
      expect(result.expires_at).toBe('2026-04-01T00:00:00Z');
      expect(mockRpc).toHaveBeenCalledWith('preview_invite', {
        code: 'ABCD1234',
      });
    });

    it('throws on invalid code', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: new Error('Invalid or expired invite code'),
      });
      await expect(familyService.previewInvite('BADCODE')).rejects.toThrow(
        'Invalid or expired invite code',
      );
    });
  });

  describe('acceptInvite', () => {
    it('calls RPC with normalized code', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await familyService.acceptInvite('abc-123');
      expect(mockRpc).toHaveBeenCalledWith('accept_invite', {
        invite_code: 'ABC123',
      });
    });

    it('throws on RPC error', async () => {
      mockRpc.mockResolvedValue({ error: new Error('Invalid code') });
      await expect(familyService.acceptInvite('BADCODE')).rejects.toThrow(
        'Invalid code',
      );
    });
  });

  describe('removeMember', () => {
    it('deletes member', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(familyService.removeMember('m1')).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('family_members');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Delete failed') }),
      );
      await expect(familyService.removeMember('m1')).rejects.toThrow('Delete failed');
    });
  });

  describe('leaveFamily', () => {
    it('calls RPC', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await familyService.leaveFamily();
      expect(mockRpc).toHaveBeenCalledWith('leave_family');
    });

    it('throws on RPC error', async () => {
      mockRpc.mockResolvedValue({ error: new Error('Admin cannot leave') });
      await expect(familyService.leaveFamily()).rejects.toThrow(
        'Admin cannot leave',
      );
    });
  });

  describe('getMyRole', () => {
    it('returns user role', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: { role: 'admin' }, error: null }),
      );
      const result = await familyService.getMyRole();
      expect(result).toBe('admin');
      expect(mockFrom).toHaveBeenCalledWith('family_members');
    });

    it('throws when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      await expect(familyService.getMyRole()).rejects.toThrow('Not authenticated');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(familyService.getMyRole()).rejects.toThrow('DB error');
    });
  });
});
