import { foodService } from './foodService';
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

describe('foodService', () => {
  describe('getCurrent', () => {
    it('returns current food entry when found', async () => {
      const entry = { id: '1', brand: 'Purina', end_date: null };
      mockFrom.mockReturnValue(
        chainMock({ data: entry, error: null }),
      );
      const result = await foodService.getCurrent('pet-1');
      expect(result).toEqual(entry);
      expect(mockFrom).toHaveBeenCalledWith('food_entries');
    });

    it('returns null when no current food', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: null }),
      );
      const result = await foodService.getCurrent('pet-1');
      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(foodService.getCurrent('pet-1')).rejects.toThrow('DB error');
    });
  });

  describe('getHistory', () => {
    it('returns all food entries', async () => {
      const entries = [
        { id: '1', brand: 'Purina' },
        { id: '2', brand: 'Blue Buffalo' },
      ];
      mockFrom.mockReturnValue(
        chainMock({ data: entries, error: null }),
      );
      const result = await foodService.getHistory('pet-1');
      expect(result).toEqual(entries);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(foodService.getHistory('pet-1')).rejects.toThrow('DB error');
    });
  });

  describe('getById', () => {
    it('returns a single food entry', async () => {
      const entry = { id: '1', brand: 'Purina' };
      mockFrom.mockReturnValue(
        chainMock({ data: entry, error: null }),
      );
      const result = await foodService.getById('1');
      expect(result).toEqual(entry);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Not found') }),
      );
      await expect(foodService.getById('1')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('inserts and returns food entry', async () => {
      const entry = { id: '1', brand: 'Purina', pet_id: 'pet-1' };
      mockFrom.mockReturnValue(
        chainMock({ data: entry, error: null }),
      );
      const result = await foodService.create({
        pet_id: 'pet-1',
        brand: 'Purina',
        start_date: '2026-03-10',
      });
      expect(result).toEqual(entry);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Insert failed') }),
      );
      await expect(
        foodService.create({
          pet_id: 'pet-1',
          brand: 'Purina',
          start_date: '2026-03-10',
        }),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('update', () => {
    it('updates and returns food entry', async () => {
      const entry = { id: '1', brand: 'Blue Buffalo' };
      mockFrom.mockReturnValue(
        chainMock({ data: entry, error: null }),
      );
      const result = await foodService.update('1', { brand: 'Blue Buffalo' });
      expect(result).toEqual(entry);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Update failed') }),
      );
      await expect(
        foodService.update('1', { brand: 'Blue Buffalo' }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('deletes food entry', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: null }),
      );
      await expect(foodService.delete('1')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Delete failed') }),
      );
      await expect(foodService.delete('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('changeFood', () => {
    it('closes current food and creates new entry', async () => {
      const currentFood = { id: 'old-1', brand: 'Purina', end_date: null };
      const newFood = { id: 'new-1', brand: 'Blue Buffalo', pet_id: 'pet-1' };

      // getCurrent call
      mockFrom.mockReturnValueOnce(
        chainMock({ data: currentFood, error: null }),
      );
      // update (close out old) call
      mockFrom.mockReturnValueOnce(
        chainMock({ data: { ...currentFood, end_date: '2026-03-10' }, error: null }),
      );
      // create (new food) call
      mockFrom.mockReturnValueOnce(
        chainMock({ data: newFood, error: null }),
      );

      const result = await foodService.changeFood('pet-1', {
        pet_id: 'pet-1',
        brand: 'Blue Buffalo',
        start_date: '2026-03-10',
      }, 'Allergies');

      expect(result).toEqual(newFood);
    });

    it('creates new food when no current food exists', async () => {
      const newFood = { id: 'new-1', brand: 'Blue Buffalo', pet_id: 'pet-1' };

      // getCurrent returns null
      mockFrom.mockReturnValueOnce(
        chainMock({ data: null, error: null }),
      );
      // create call
      mockFrom.mockReturnValueOnce(
        chainMock({ data: newFood, error: null }),
      );

      const result = await foodService.changeFood('pet-1', {
        pet_id: 'pet-1',
        brand: 'Blue Buffalo',
        start_date: '2026-03-10',
      });

      expect(result).toEqual(newFood);
    });
  });
});
