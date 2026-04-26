import { healthService } from './healthService';
import { supabase } from './supabase';

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

/**
 * Like chainMock but records every method call (name + args) so tests can
 * assert the exact filter chain — e.g. that `.eq('is_archived', false)` was
 * called. The proxy-based chainMock above is convenient but opaque, so it
 * can't catch regressions where a critical filter is silently dropped.
 */
function trackingChainMock(result: { data: unknown; error: unknown }) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: Record<string, unknown> = {};
  const proxy = new Proxy(builder, {
    get: (_, prop) => {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result);
      }
      return (...args: unknown[]) => {
        calls.push({ method: prop as string, args });
        return proxy;
      };
    },
  });
  return { proxy, calls };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('healthService', () => {
  // ── Vaccinations ──────────────────────────────────────────────

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

  // ── Vaccination Doses ───────────────────────────────────────────

  describe('logVaccinationDose', () => {
    it('returns dose on success', async () => {
      const dose = {
        id: 'vd1',
        vaccination_id: 'v1',
        date_administered: '2025-06-01',
        clinic_name: 'Happy Paws',
      };
      mockFrom.mockReturnValue(chainMock({ data: dose, error: null }));
      const result = await healthService.logVaccinationDose(
        {
          vaccination_id: 'v1',
          date_administered: '2025-06-01',
          clinic_name: 'Happy Paws',
        },
        12,
      );
      expect(result).toEqual(dose);
      expect(mockFrom).toHaveBeenCalledWith('vaccination_doses');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Insert failed') }),
      );
      await expect(
        healthService.logVaccinationDose(
          {
            vaccination_id: 'v1',
            date_administered: '2025-06-01',
          },
          12,
        ),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('getVaccinationDoses', () => {
    it('returns doses array', async () => {
      const doses = [
        { id: 'vd1', vaccination_id: 'v1', date_administered: '2025-06-01' },
        { id: 'vd2', vaccination_id: 'v1', date_administered: '2024-06-01' },
      ];
      mockFrom.mockReturnValue(chainMock({ data: doses, error: null }));
      const result = await healthService.getVaccinationDoses('v1');
      expect(result).toEqual(doses);
      expect(mockFrom).toHaveBeenCalledWith('vaccination_doses');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('DB error') }),
      );
      await expect(
        healthService.getVaccinationDoses('v1'),
      ).rejects.toThrow('DB error');
    });
  });

  describe('deleteVaccinationDose', () => {
    it('deletes without error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(
        healthService.deleteVaccinationDose('vd1'),
      ).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(
        chainMock({ data: null, error: new Error('Delete failed') }),
      );
      await expect(
        healthService.deleteVaccinationDose('vd1'),
      ).rejects.toThrow('Delete failed');
    });
  });

  // ── Vet Visits ────────────────────────────────────────────────

  describe('getVetVisits', () => {
    it('returns vet visits array', async () => {
      const visits = [{ id: '1', date: '2025-01-01', pet_id: 'p1' }];
      mockFrom.mockReturnValue(chainMock({ data: visits, error: null }));
      const result = await healthService.getVetVisits('p1');
      expect(result).toEqual(visits);
      expect(mockFrom).toHaveBeenCalledWith('vet_visits');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(healthService.getVetVisits('p1')).rejects.toThrow('DB error');
    });
  });

  describe('getVetVisitById', () => {
    it('returns a single vet visit', async () => {
      const visit = { id: '1', date: '2025-01-01' };
      mockFrom.mockReturnValue(chainMock({ data: visit, error: null }));
      const result = await healthService.getVetVisitById('1');
      expect(result).toEqual(visit);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Not found') }));
      await expect(healthService.getVetVisitById('1')).rejects.toThrow('Not found');
    });
  });

  describe('createVetVisit', () => {
    it('inserts and returns vet visit', async () => {
      const visit = { id: '1', pet_id: 'p1', date: '2025-01-01' };
      mockFrom.mockReturnValue(chainMock({ data: visit, error: null }));
      const result = await healthService.createVetVisit({
        pet_id: 'p1',
        date: '2025-01-01',
      });
      expect(result).toEqual(visit);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Insert failed') }));
      await expect(
        healthService.createVetVisit({ pet_id: 'p1', date: '2025-01-01' }),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('updateVetVisit', () => {
    it('updates and returns vet visit', async () => {
      const visit = { id: '1', reason: 'Checkup' };
      mockFrom.mockReturnValue(chainMock({ data: visit, error: null }));
      const result = await healthService.updateVetVisit('1', { reason: 'Checkup' });
      expect(result).toEqual(visit);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Update failed') }));
      await expect(
        healthService.updateVetVisit('1', { reason: 'Checkup' }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteVetVisit', () => {
    it('deletes without error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(healthService.deleteVetVisit('1')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Delete failed') }));
      await expect(healthService.deleteVetVisit('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getRecentClinics', () => {
    it('returns deduplicated clinics with most recent date', async () => {
      const rows = [
        { clinic_name: 'Happy Paws', date: '2025-03-15' },
        { clinic_name: 'Happy Paws', date: '2025-01-10' },
        { clinic_name: 'City Vet', date: '2025-02-20' },
      ];
      mockFrom.mockReturnValue(chainMock({ data: rows, error: null }));
      const result = await healthService.getRecentClinics('p1');
      expect(result).toEqual([
        { clinicName: 'Happy Paws', lastVisitDate: '2025-03-15' },
        { clinicName: 'City Vet', lastVisitDate: '2025-02-20' },
      ]);
      expect(mockFrom).toHaveBeenCalledWith('vet_visits');
    });

    it('limits to 3 clinics by default', async () => {
      const rows = [
        { clinic_name: 'A', date: '2025-04-01' },
        { clinic_name: 'B', date: '2025-03-01' },
        { clinic_name: 'C', date: '2025-02-01' },
        { clinic_name: 'D', date: '2025-01-01' },
      ];
      mockFrom.mockReturnValue(chainMock({ data: rows, error: null }));
      const result = await healthService.getRecentClinics('p1');
      expect(result).toHaveLength(3);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(healthService.getRecentClinics('p1')).rejects.toThrow('DB error');
    });
  });

  // ── Medications ───────────────────────────────────────────────

  describe('getMedications', () => {
    it('returns medications array', async () => {
      const meds = [{ id: '1', name: 'Apoquel', pet_id: 'p1' }];
      mockFrom.mockReturnValue(chainMock({ data: meds, error: null }));
      const result = await healthService.getMedications('p1');
      expect(result).toEqual(meds);
      expect(mockFrom).toHaveBeenCalledWith('medications');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(healthService.getMedications('p1')).rejects.toThrow('DB error');
    });

    // Regression guard — archived meds must never appear in the per-pet
    // active list (Medicines tab), so the is_archived filter is mandatory.
    it('filters out archived medications via is_archived = false', async () => {
      const { proxy, calls } = trackingChainMock({ data: [], error: null });
      mockFrom.mockReturnValue(proxy);

      await healthService.getMedications('p1');

      const eqCalls = calls.filter((c) => c.method === 'eq');
      const archivedFilter = eqCalls.find(
        (c) => c.args[0] === 'is_archived' && c.args[1] === false,
      );
      expect(archivedFilter).toBeDefined();
    });
  });

  describe('getMedicationById', () => {
    it('returns a single medication', async () => {
      const med = { id: '1', name: 'Apoquel' };
      mockFrom.mockReturnValue(chainMock({ data: med, error: null }));
      const result = await healthService.getMedicationById('1');
      expect(result).toEqual(med);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Not found') }));
      await expect(healthService.getMedicationById('1')).rejects.toThrow('Not found');
    });
  });

  describe('createMedication', () => {
    it('inserts and returns medication', async () => {
      const med = { id: '1', pet_id: 'p1', name: 'Apoquel', start_date: '2025-01-01' };
      mockFrom.mockReturnValue(chainMock({ data: med, error: null }));
      const result = await healthService.createMedication({
        pet_id: 'p1',
        name: 'Apoquel',
        start_date: '2025-01-01',
      });
      expect(result).toEqual(med);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Insert failed') }));
      await expect(
        healthService.createMedication({ pet_id: 'p1', name: 'Apoquel', start_date: '2025-01-01' }),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('updateMedication', () => {
    it('updates and returns medication', async () => {
      const med = { id: '1', name: 'Updated' };
      mockFrom.mockReturnValue(chainMock({ data: med, error: null }));
      const result = await healthService.updateMedication('1', { name: 'Updated' });
      expect(result).toEqual(med);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Update failed') }));
      await expect(
        healthService.updateMedication('1', { name: 'Updated' }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteMedication', () => {
    it('deletes without error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(healthService.deleteMedication('1')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Delete failed') }));
      await expect(healthService.deleteMedication('1')).rejects.toThrow('Delete failed');
    });
  });

  // ── Medication Doses ─────────────────────────────────────────

  describe('getMedicationDoses', () => {
    it('returns doses array for a medication', async () => {
      const doses = [{ id: 'd1', medication_id: 'm1', given_at: '2025-01-15T10:00:00Z' }];
      mockFrom.mockReturnValue(chainMock({ data: doses, error: null }));
      const result = await healthService.getMedicationDoses('m1');
      expect(result).toEqual(doses);
      expect(mockFrom).toHaveBeenCalledWith('medication_doses');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(healthService.getMedicationDoses('m1')).rejects.toThrow('DB error');
    });
  });

  describe('logMedicationDose', () => {
    it('inserts and returns dose when medication is not archived', async () => {
      const dose = { id: 'd1', medication_id: 'm1', given_at: '2025-01-15T10:00:00Z' };
      // First call: medications archive check returns is_archived=false
      mockFrom.mockReturnValueOnce(chainMock({ data: { is_archived: false }, error: null }));
      // Second call: medication_doses insert returns the dose
      mockFrom.mockReturnValueOnce(chainMock({ data: dose, error: null }));
      const result = await healthService.logMedicationDose({ medication_id: 'm1' });
      expect(result).toEqual(dose);
    });

    it('throws when medication is archived', async () => {
      mockFrom.mockReturnValueOnce(chainMock({ data: { is_archived: true }, error: null }));
      await expect(
        healthService.logMedicationDose({ medication_id: 'm1' }),
      ).rejects.toThrow('Cannot log dose for archived medication.');
    });

    it('throws when archive lookup fails', async () => {
      mockFrom.mockReturnValueOnce(chainMock({ data: null, error: new Error('Lookup failed') }));
      await expect(
        healthService.logMedicationDose({ medication_id: 'm1' }),
      ).rejects.toThrow('Lookup failed');
    });

    it('throws on insert error', async () => {
      mockFrom.mockReturnValueOnce(chainMock({ data: { is_archived: false }, error: null }));
      mockFrom.mockReturnValueOnce(chainMock({ data: null, error: new Error('Insert failed') }));
      await expect(
        healthService.logMedicationDose({ medication_id: 'm1' }),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('archiveMedication', () => {
    it('archives without error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(healthService.archiveMedication('m1')).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('medications');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Update failed') }));
      await expect(healthService.archiveMedication('m1')).rejects.toThrow('Update failed');
    });
  });

  describe('restoreMedication', () => {
    it('restores without error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(healthService.restoreMedication('m1')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Update failed') }));
      await expect(healthService.restoreMedication('m1')).rejects.toThrow('Update failed');
    });
  });

  describe('getArchivedMedications', () => {
    it('returns archived medications for a pet', async () => {
      const meds = [
        { id: 'm1', pet_id: 'p1', name: 'Old Med', is_archived: true, archived_at: '2026-01-15T10:00:00Z' },
      ];
      mockFrom.mockReturnValue(chainMock({ data: meds, error: null }));
      const result = await healthService.getArchivedMedications('p1');
      expect(result).toEqual(meds);
      expect(mockFrom).toHaveBeenCalledWith('medications');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(healthService.getArchivedMedications('p1')).rejects.toThrow('DB error');
    });
  });

  describe('deleteMedicationDose', () => {
    it('deletes without error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(healthService.deleteMedicationDose('d1')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Delete failed') }));
      await expect(healthService.deleteMedicationDose('d1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getTodayDoseCounts', () => {
    it('returns dose counts grouped by medication', async () => {
      const rows = [
        { medication_id: 'm1' },
        { medication_id: 'm1' },
        { medication_id: 'm2' },
      ];
      mockFrom.mockReturnValue(chainMock({ data: rows, error: null }));
      const result = await healthService.getTodayDoseCounts(['m1', 'm2']);
      expect(result).toEqual({ m1: 2, m2: 1 });
      expect(mockFrom).toHaveBeenCalledWith('medication_doses');
    });

    it('returns empty object for empty input', async () => {
      const result = await healthService.getTodayDoseCounts([]);
      expect(result).toEqual({});
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(
        healthService.getTodayDoseCounts(['m1']),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getLatestDoseForMedications', () => {
    it('returns latest dose date per medication', async () => {
      const rows = [
        { medication_id: 'm1', given_at: '2025-01-15T10:00:00Z' },
        { medication_id: 'm1', given_at: '2025-01-10T10:00:00Z' },
        { medication_id: 'm2', given_at: '2025-01-12T10:00:00Z' },
      ];
      mockFrom.mockReturnValue(chainMock({ data: rows, error: null }));
      const result = await healthService.getLatestDoseForMedications(['m1', 'm2']);
      expect(result).toEqual({
        m1: '2025-01-15T10:00:00Z',
        m2: '2025-01-12T10:00:00Z',
      });
    });

    it('returns empty object for empty input', async () => {
      const result = await healthService.getLatestDoseForMedications([]);
      expect(result).toEqual({});
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(
        healthService.getLatestDoseForMedications(['m1']),
      ).rejects.toThrow('DB error');
    });
  });

  // ── Cross-Pet Queries (Dashboard Action Items) ──────────────

  describe('getActiveMedicationsForPets', () => {
    it('returns active recurring medications for given pet IDs', async () => {
      const meds = [
        { id: 'm1', pet_id: 'p1', name: 'Amoxicillin', frequency: 'Once daily', is_archived: false, archived_at: null },
        { id: 'm2', pet_id: 'p2', name: 'Heartgard', frequency: 'Once monthly', is_archived: false, archived_at: null },
      ];
      mockFrom.mockReturnValue(chainMock({ data: meds, error: null }));
      const result = await healthService.getActiveMedicationsForPets(['p1', 'p2']);
      expect(result).toEqual(meds);
      expect(mockFrom).toHaveBeenCalledWith('medications');
    });

    it('returns empty array for empty petIds', async () => {
      const result = await healthService.getActiveMedicationsForPets([]);
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(
        healthService.getActiveMedicationsForPets(['p1']),
      ).rejects.toThrow('DB error');
    });

    // Regression guard for v1 bug #6 — archived medications appearing in
    // dashboard "Needs Attention". The dashboard relies on this query to
    // filter out archived rows server-side; if the filter is ever dropped or
    // weakened, archived meds will leak into action items.
    it('filters out archived medications via is_archived = false', async () => {
      const { proxy, calls } = trackingChainMock({ data: [], error: null });
      mockFrom.mockReturnValue(proxy);

      await healthService.getActiveMedicationsForPets(['p1']);

      const eqCalls = calls.filter((c) => c.method === 'eq');
      const archivedFilter = eqCalls.find(
        (c) => c.args[0] === 'is_archived' && c.args[1] === false,
      );
      expect(archivedFilter).toBeDefined();
    });
  });

  describe('getActionableVaccinations', () => {
    it('returns vaccinations due within advance window', async () => {
      const vaccinations = [
        { id: 'v1', pet_id: 'p1', vaccine_name: 'Rabies', next_due_date: '2025-02-01' },
      ];
      mockFrom.mockReturnValue(chainMock({ data: vaccinations, error: null }));
      const result = await healthService.getActionableVaccinations(['p1'], 14);
      expect(result).toEqual(vaccinations);
      expect(mockFrom).toHaveBeenCalledWith('vaccinations');
    });

    it('returns empty array for empty petIds', async () => {
      const result = await healthService.getActionableVaccinations([], 14);
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(
        healthService.getActionableVaccinations(['p1'], 14),
      ).rejects.toThrow('DB error');
    });
  });

  // ── Weight Entries ────────────────────────────────────────────

  describe('getWeightEntries', () => {
    it('returns weight entries array', async () => {
      const entries = [{ id: '1', weight: 25.5, pet_id: 'p1' }];
      mockFrom.mockReturnValue(chainMock({ data: entries, error: null }));
      const result = await healthService.getWeightEntries('p1');
      expect(result).toEqual(entries);
      expect(mockFrom).toHaveBeenCalledWith('weight_entries');
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('DB error') }));
      await expect(healthService.getWeightEntries('p1')).rejects.toThrow('DB error');
    });
  });

  describe('getWeightEntryById', () => {
    it('returns a single weight entry', async () => {
      const entry = { id: '1', weight: 25.5 };
      mockFrom.mockReturnValue(chainMock({ data: entry, error: null }));
      const result = await healthService.getWeightEntryById('1');
      expect(result).toEqual(entry);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Not found') }));
      await expect(healthService.getWeightEntryById('1')).rejects.toThrow('Not found');
    });
  });

  describe('createWeightEntry', () => {
    it('inserts and returns weight entry', async () => {
      const entry = { id: '1', pet_id: 'p1', weight: 25.5, date: '2025-01-01' };
      mockFrom.mockReturnValue(chainMock({ data: entry, error: null }));
      const result = await healthService.createWeightEntry({
        pet_id: 'p1',
        weight: 25.5,
        date: '2025-01-01',
      });
      expect(result).toEqual(entry);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Insert failed') }));
      await expect(
        healthService.createWeightEntry({ pet_id: 'p1', weight: 25.5, date: '2025-01-01' }),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('updateWeightEntry', () => {
    it('updates and returns weight entry', async () => {
      const entry = { id: '1', weight: 26.0 };
      mockFrom.mockReturnValue(chainMock({ data: entry, error: null }));
      const result = await healthService.updateWeightEntry('1', { weight: 26.0 });
      expect(result).toEqual(entry);
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Update failed') }));
      await expect(
        healthService.updateWeightEntry('1', { weight: 26.0 }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteWeightEntry', () => {
    it('deletes without error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(healthService.deleteWeightEntry('1')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: new Error('Delete failed') }));
      await expect(healthService.deleteWeightEntry('1')).rejects.toThrow('Delete failed');
    });
  });
});
