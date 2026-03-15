import { useState, useCallback, useEffect } from 'react';
import { healthService } from '@/services/healthService';
import { Vaccination } from '@/types';
import { getVaccinationStatus } from '@/utils/status';

export type VaccinationWithStatus = Vaccination & {
  status: 'green' | 'amber' | 'overdue';
};

export function useVaccinations(petId: string) {
  const [vaccinations, setVaccinations] = useState<VaccinationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVaccinations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getVaccinations(petId);

      const statusPriority = { overdue: 0, amber: 1, green: 2 };

      const enriched: VaccinationWithStatus[] = data
        .map((v) => ({
          ...v,
          status: getVaccinationStatus(v.next_due_date),
        }))
        .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

      setVaccinations(enriched);
    } catch {
      setError('Failed to load vaccinations');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadVaccinations();
  }, [loadVaccinations]);

  return { vaccinations, loading, error, refresh: loadVaccinations };
}
