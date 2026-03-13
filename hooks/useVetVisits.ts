import { useState, useCallback, useEffect } from 'react';
import { healthService } from '@/services/healthService';
import { VetVisit } from '@/types';

export function useVetVisits(petId: string) {
  const [vetVisits, setVetVisits] = useState<VetVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVetVisits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getVetVisits(petId);
      setVetVisits(data);
    } catch {
      setError('Failed to load vet visits');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadVetVisits();
  }, [loadVetVisits]);

  return { vetVisits, loading, error, refresh: loadVetVisits };
}
