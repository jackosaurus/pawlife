import { useState, useCallback, useEffect } from 'react';
import { healthService } from '@/services/healthService';
import { WeightEntry } from '@/types';

export function useWeightEntries(petId: string) {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeightEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getWeightEntries(petId);
      setWeightEntries(data);
    } catch {
      setError('Failed to load weight entries');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadWeightEntries();
  }, [loadWeightEntries]);

  const latestWeight = weightEntries.length > 0 ? weightEntries[0] : null;

  return { weightEntries, latestWeight, loading, error, refresh: loadWeightEntries };
}
