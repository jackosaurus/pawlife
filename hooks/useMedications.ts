import { useState, useCallback, useEffect } from 'react';
import { healthService } from '@/services/healthService';
import { Medication } from '@/types';

export function useMedications(petId: string) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getMedications(petId);
      setMedications(data);
    } catch {
      setError('Failed to load medications');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const activeMedications = medications.filter((m) => !m.is_completed);

  return { medications, activeMedications, loading, error, refresh: loadMedications };
}
