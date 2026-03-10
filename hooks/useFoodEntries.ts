import { useState, useCallback, useEffect } from 'react';
import { foodService } from '@/services/foodService';
import { FoodEntry } from '@/types';

export function useFoodEntries(petId: string) {
  const [currentFood, setCurrentFood] = useState<FoodEntry | null>(null);
  const [history, setHistory] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFood = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [current, all] = await Promise.all([
        foodService.getCurrent(petId),
        foodService.getHistory(petId),
      ]);
      setCurrentFood(current);
      setHistory(all);
    } catch {
      setError('Failed to load food entries');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadFood();
  }, [loadFood]);

  return { currentFood, history, loading, error, refresh: loadFood };
}
