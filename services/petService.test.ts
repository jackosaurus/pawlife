import { petService } from './petService';
import { supabase } from './supabase';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('./analyticsService', () => ({
  analyticsService: { track: jest.fn() },
}));

jest.mock('./supabase', () => {
  const mockFrom = jest.fn();
  const mockStorage = {
    from: jest.fn(),
  };
  return {
    supabase: {
      from: mockFrom,
      storage: mockStorage,
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      },
    },
  };
});

const mockFrom = supabase.from as jest.Mock;
const mockStorageFrom = supabase.storage.from as jest.Mock;

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
});

describe('petService', () => {
  describe('getAll', () => {
    it('returns pets array', async () => {
      const pets = [{ id: '1', name: 'Buddy' }];
      mockFrom.mockReturnValue(
        chainMock({ data: pets, error: null }),
      );
      const result = await petService.getAll();
      expect(result).toEqual(pets);
      expect(mockFrom).toHaveBeenCalledWith('pets');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(petService.getAll()).rejects.toThrow('DB error');
    });
  });

  describe('getById', () => {
    it('returns single pet', async () => {
      const pet = { id: '1', name: 'Buddy' };
      mockFrom.mockReturnValue(
        chainMock({ data: pet, error: null }),
      );
      const result = await petService.getById('1');
      expect(result).toEqual(pet);
    });
  });

  describe('create', () => {
    it('inserts and returns pet with family_id and created_by', async () => {
      const pet = { id: '1', name: 'Luna', pet_type: 'cat', family_id: 'fam-1', created_by: 'user-1' };
      mockFrom.mockReturnValue(
        chainMock({ data: pet, error: null }),
      );
      const result = await petService.create({
        family_id: 'fam-1',
        pet_type: 'cat',
        name: 'Luna',
      });
      expect(result).toEqual(pet);
    });

    it('emits pet_created event after successful insert', async () => {
      const { analyticsService } = require('./analyticsService');
      analyticsService.track.mockClear();
      const pet = { id: '1', name: 'Luna', pet_type: 'cat' };
      mockFrom.mockReturnValue(
        chainMock({ data: pet, error: null }),
      );
      await petService.create({ family_id: 'fam-1', pet_type: 'cat', name: 'Luna' });
      expect(analyticsService.track).toHaveBeenCalledWith('pet_created', {
        pet_id: '1',
        species: 'cat',
      });
    });

    it('does not emit pet_created on error', async () => {
      const { analyticsService } = require('./analyticsService');
      analyticsService.track.mockClear();
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Insert failed') }),
      );
      await expect(
        petService.create({ family_id: 'fam-1', pet_type: 'dog', name: 'Rex' }),
      ).rejects.toThrow('Insert failed');
      expect(analyticsService.track).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates and returns pet', async () => {
      const pet = { id: '1', name: 'Buddy Updated' };
      mockFrom.mockReturnValue(
        chainMock({ data: pet, error: null }),
      );
      const result = await petService.update('1', { name: 'Buddy Updated' });
      expect(result).toEqual(pet);
    });
  });

  describe('archive', () => {
    it('sets is_archived to true', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: null }),
      );
      await expect(petService.archive('1')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Archive failed') }),
      );
      await expect(petService.archive('1')).rejects.toThrow('Archive failed');
    });
  });

  describe('restore', () => {
    it('sets is_archived to false', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: null }),
      );
      await expect(petService.restore('1')).resolves.toBeUndefined();
    });
  });

  describe('getArchived', () => {
    it('returns archived pets', async () => {
      const pets = [{ id: '1', name: 'Old Buddy', is_archived: true }];
      mockFrom.mockReturnValue(
        chainMock({ data: pets, error: null }),
      );
      const result = await petService.getArchived();
      expect(result).toEqual(pets);
      expect(mockFrom).toHaveBeenCalledWith('pets');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(petService.getArchived()).rejects.toThrow('DB error');
    });
  });
});
