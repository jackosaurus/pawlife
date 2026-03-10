import { useState, useCallback, useEffect } from 'react';
import { petService } from '@/services/petService';
import { Pet } from '@/types';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await petService.getAll();
      setPets(data);
    } catch {
      setError('Failed to load your pet family');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  return { pets, loading, error, refresh: loadPets };
}
