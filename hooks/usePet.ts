import { useState, useCallback, useEffect } from 'react';
import { petService } from '@/services/petService';
import { Pet } from '@/types';

export function usePet(petId: string) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await petService.getById(petId);
      setPet(data);
    } catch {
      setError('Failed to load pet details');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  return { pet, loading, error, refresh: loadPet };
}
