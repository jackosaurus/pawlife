import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { familyService } from '@/services/familyService';
import { Family, FamilyMember } from '@/types';

interface FamilyState {
  family: Family | null;
  members: FamilyMember[];
  myRole: 'admin' | 'member' | null;
  loading: boolean;
  error: string | null;

  loadFamily: () => Promise<void>;
  clearFamily: () => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  family: null,
  members: [],
  myRole: null,
  loading: false,
  error: null,

  loadFamily: async () => {
    set({ loading: true, error: null });
    try {
      const result = await familyService.getFamily();
      if (result) {
        const { members, ...family } = result;
        // Extract role from members to avoid a redundant getMyRole() call
        const { data: { user } } = await supabase.auth.getUser();
        const myMembership = members.find((m) => m.user_id === user?.id);
        const role = (myMembership?.role as 'admin' | 'member') ?? null;
        set({ family, members, myRole: role, loading: false });
      } else {
        set({ family: null, members: [], myRole: null, loading: false });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load family';
      set({ error: message, loading: false });
    }
  },

  clearFamily: () =>
    set({ family: null, members: [], myRole: null, loading: false, error: null }),
}));
