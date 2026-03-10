import { healthService } from './healthService';
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

describe('healthService', () => {
  describe('getVaccinations', () => {
    it('returns vaccinations array for a pet', async () => {
      const vaccinations = [
        { id: '1', vaccine_name: 'Rabies', pet_id: 'p1' },
      ];
      mockFrom.mockReturnValue(
        chainMock({ data: vaccinations, error: null }),
      );
      const result = await healthService.getVaccinations('p1');
      expect(result).toEqual(vaccinations);
      expect(mockFrom).toHaveBeenCalledWith('vaccinations');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(healthService.getVaccinations('p1')).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('getVaccinationById', () => {
    it('returns a single vaccination', async () => {
      const vaccination = { id: '1', vaccine_name: 'Rabies' };
      mockFrom.mockReturnValue(
        chainMock({ data: vaccination, error: null }),
      );
      const result = await healthService.getVaccinationById('1');
      expect(result).toEqual(vaccination);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Not found') }),
      );
      await expect(healthService.getVaccinationById('1')).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('createVaccination', () => {
    it('inserts and returns vaccination', async () => {
      const vaccination = {
        id: '1',
        pet_id: 'p1',
        vaccine_name: 'Rabies',
        date_administered: '2025-01-01',
      };
      mockFrom.mockReturnValue(
        chainMock({ data: vaccination, error: null }),
      );
      const result = await healthService.createVaccination({
        pet_id: 'p1',
        vaccine_name: 'Rabies',
        date_administered: '2025-01-01',
      });
      expect(result).toEqual(vaccination);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Insert failed') }),
      );
      await expect(
        healthService.createVaccination({
          pet_id: 'p1',
          vaccine_name: 'Rabies',
          date_administered: '2025-01-01',
        }),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('updateVaccination', () => {
    it('updates and returns vaccination', async () => {
      const vaccination = { id: '1', vaccine_name: 'DHPP / Distemper' };
      mockFrom.mockReturnValue(
        chainMock({ data: vaccination, error: null }),
      );
      const result = await healthService.updateVaccination('1', {
        vaccine_name: 'DHPP / Distemper',
      });
      expect(result).toEqual(vaccination);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Update failed') }),
      );
      await expect(
        healthService.updateVaccination('1', { vaccine_name: 'DHPP' }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteVaccination', () => {
    it('deletes without error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: null }),
      );
      await expect(
        healthService.deleteVaccination('1'),
      ).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Delete failed') }),
      );
      await expect(healthService.deleteVaccination('1')).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
