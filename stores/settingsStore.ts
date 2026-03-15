import { create } from 'zustand';
import { userService } from '@/services/userService';

interface SettingsState {
  weightUnit: 'kg' | 'lbs';
  remindersEnabled: boolean;
  medicationReminderTime: string;
  vaccinationAdvanceDays: number;
  loading: boolean;
  error: string | null;
  initialize: (userId: string) => Promise<void>;
  setWeightUnit: (userId: string, unit: 'kg' | 'lbs') => Promise<void>;
  setRemindersEnabled: (userId: string, enabled: boolean) => Promise<void>;
  setMedicationReminderTime: (userId: string, time: string) => Promise<void>;
  setVaccinationAdvanceDays: (userId: string, days: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  weightUnit: 'kg',
  remindersEnabled: true,
  medicationReminderTime: '20:00',
  vaccinationAdvanceDays: 14,
  loading: false,
  error: null,

  initialize: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const profile = await userService.getProfile(userId);
      set({
        weightUnit: profile.weight_unit,
        remindersEnabled: profile.reminders_enabled,
        medicationReminderTime: profile.medication_reminder_time,
        vaccinationAdvanceDays: profile.vaccination_advance_days,
        loading: false,
      });
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

  setRemindersEnabled: async (userId: string, enabled: boolean) => {
    const previous = useSettingsStore.getState().remindersEnabled;
    set({ remindersEnabled: enabled });
    try {
      await userService.updateProfile(userId, { reminders_enabled: enabled });
    } catch (err) {
      set({ remindersEnabled: previous });
      const message =
        err instanceof Error ? err.message : 'Failed to update preference';
      set({ error: message });
    }
  },

  setMedicationReminderTime: async (userId: string, time: string) => {
    const previous = useSettingsStore.getState().medicationReminderTime;
    set({ medicationReminderTime: time });
    try {
      await userService.updateProfile(userId, {
        medication_reminder_time: time,
      });
    } catch (err) {
      set({ medicationReminderTime: previous });
      const message =
        err instanceof Error ? err.message : 'Failed to update preference';
      set({ error: message });
    }
  },

  setVaccinationAdvanceDays: async (userId: string, days: number) => {
    const previous = useSettingsStore.getState().vaccinationAdvanceDays;
    set({ vaccinationAdvanceDays: days });
    try {
      await userService.updateProfile(userId, {
        vaccination_advance_days: days,
      });
    } catch (err) {
      set({ vaccinationAdvanceDays: previous });
      const message =
        err instanceof Error ? err.message : 'Failed to update preference';
      set({ error: message });
    }
  },
}));
