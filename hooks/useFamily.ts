import { useEffect } from 'react';
import { useFamilyStore } from '@/stores/familyStore';

export function useFamily() {
  const family = useFamilyStore((s) => s.family);
  const members = useFamilyStore((s) => s.members);
  const myRole = useFamilyStore((s) => s.myRole);
  const loading = useFamilyStore((s) => s.loading);
  const error = useFamilyStore((s) => s.error);
  const loadFamily = useFamilyStore((s) => s.loadFamily);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  return { family, members, myRole, loading, error, refresh: loadFamily };
}
