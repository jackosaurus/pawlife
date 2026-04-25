import { useState, useCallback, useEffect } from 'react';
import { allergyService } from '@/services/allergyService';
import { PetAllergy } from '@/types';

export function usePetAllergies(petId: string) {
  const [data, setData] = useState<PetAllergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!petId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await allergyService.listByPet(petId);
      setData(result);
    } catch {
      setError('Failed to load allergies');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
