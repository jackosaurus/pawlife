import { create } from 'zustand';
import { userService } from '@/services/userService';

interface SettingsState {
  weightUnit: 'kg' | 'lbs';
  loading: boolean;
  error: string | null;
  initialize: (userId: string) => Promise<void>;
  setWeightUnit: (userId: string, unit: 'kg' | 'lbs') => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  weightUnit: 'kg',
  loading: false,
  error: null,

  initialize: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const profile = await userService.getProfile(userId);
      set({ weightUnit: profile.weight_unit, loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load preferences';
      set({ error: message, loading: false });
    }
  },

  setWeightUnit: async (userId: string, unit: 'kg' | 'lbs') => {
    const previous = useSettingsStore.getState().weightUnit;
    set({ weightUnit: unit });
    try {
      await userService.updateProfile(userId, { weight_unit: unit });
    } catch (err) {
      set({ weightUnit: previous });
      const message =
        err instanceof Error ? err.message : 'Failed to update preference';
      set({ error: message });
    }
  },
}));
