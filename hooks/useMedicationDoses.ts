import { useState, useCallback, useEffect } from 'react';
import { healthService } from '@/services/healthService';
import { MedicationDose } from '@/types';

export function useMedicationDoses(medicationId: string) {
  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDoses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getMedicationDoses(medicationId);
      setDoses(data);
    } catch {
      setError('Failed to load dose history');
    } finally {
      setLoading(false);
    }
  }, [medicationId]);

  useEffect(() => {
    loadDoses();
  }, [loadDoses]);

  const logDose = useCallback(async () => {
    await healthService.logMedicationDose({ medication_id: medicationId });
    await loadDoses();
  }, [medicationId, loadDoses]);

  return { doses, loading, error, refresh: loadDoses, logDose };
}
