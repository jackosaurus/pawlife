import { useState, useCallback, useEffect } from 'react';
import { healthService } from '@/services/healthService';
import { Vaccination } from '@/types';

export function useVaccinations(petId: string) {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVaccinations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getVaccinations(petId);
      setVaccinations(data);
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
