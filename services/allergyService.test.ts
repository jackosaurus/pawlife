import { allergyService } from './allergyService';
import { supabase } from './supabase';

jest.mock('./supabase', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      },
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

describe('allergyService', () => {
  describe('listByPet', () => {
    it('returns allergies for a pet', async () => {
      const allergies = [
        { id: '1', pet_id: 'p1', allergen: 'Chicken' },
        { id: '2', pet_id: 'p1', allergen: 'Beef' },
      ];
      mockFrom.mockReturnValue(chainMock({ data: allergies, error: null }));
      const result = await allergyService.listByPet('p1');
      expect(result).toEqual(allergies);
      expect(mockFrom).toHaveBeenCalledWith('pet_allergies');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(allergyService.listByPet('p1')).rejects.toThrow('DB error');
    });
  });

  describe('create', () => {
    it('inserts an allergy with created_by', async () => {
      const allergy = { id: '1', pet_id: 'p1', allergen: 'Eggs', created_by: 'user-1' };
      mockFrom.mockReturnValue(chainMock({ data: allergy, error: null }));
      const result = await allergyService.create({
        pet_id: 'p1',
        allergen: 'Eggs',
      });
      expect(result).toEqual(allergy);
      expect(mockFrom).toHaveBeenCalledWith('pet_allergies');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Insert failed') }),
      );
      await expect(
        allergyService.create({ pet_id: 'p1', allergen: 'Dust' }),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('update', () => {
    it('updates an allergy and returns the row', async () => {
      const allergy = { id: '1', pet_id: 'p1', allergen: 'Updated' };
      mockFrom.mockReturnValue(chainMock({ data: allergy, error: null }));
      const result = await allergyService.update('1', { allergen: 'Updated' });
      expect(result).toEqual(allergy);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Update failed') }),
      );
      await expect(
        allergyService.update('1', { allergen: 'X' }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getById', () => {
    it('returns a single allergy', async () => {
      const allergy = { id: '1', pet_id: 'p1', allergen: 'Pollen' };
      mockFrom.mockReturnValue(chainMock({ data: allergy, error: null }));
      const result = await allergyService.getById('1');
      expect(result).toEqual(allergy);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Not found') }),
      );
      await expect(allergyService.getById('1')).rejects.toThrow('Not found');
    });
  });

  describe('remove', () => {
    it('resolves on success', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(allergyService.remove('1')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Delete failed') }),
      );
      await expect(allergyService.remove('1')).rejects.toThrow('Delete failed');
    });
  });
});
