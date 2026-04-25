import { useState, useCallback, useEffect } from 'react';
import { healthService } from '@/services/healthService';
import { Medication } from '@/types';

export function useArchivedMedications(petId: string) {
  const [data, setData] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await healthService.getArchivedMedications(petId);
      setData(result);
    } catch {
      setError('Failed to load archived medications');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
