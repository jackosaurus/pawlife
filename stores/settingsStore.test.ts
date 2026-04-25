import { useSettingsStore } from './settingsStore';
import { userService } from '@/services/userService';

jest.mock('@/services/userService', () => ({
  userService: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

const mockUserService = userService as jest.Mocked<typeof userService>;

const defaultProfile = {
  id: 'u1',
  email: 'test@example.com',
  display_name: null,
  weight_unit: 'kg' as const,
  push_tokens: [],
  reminders_enabled: true,
  medication_reminder_time: '20:00',
  vaccination_advance_days: 14,
  timezone: 'UTC',
  created_at: '2024-01-01',
};

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({
    weightUnit: 'kg',
    remindersEnabled: true,
    medicationReminderTime: '20:00',
    vaccinationAdvanceDays: 14,
    loading: false,
    error: null,
  });
});

describe('settingsStore', () => {
  describe('initialize', () => {
    it('fetches profile and sets all preferences', async () => {
      mockUserService.getProfile.mockResolvedValue({
        ...defaultProfile,
        weight_unit: 'lbs',
        reminders_enabled: false,
        medication_reminder_time: '09:00',
        vaccination_advance_days: 7,
      });

      await useSettingsStore.getState().initialize('u1');
      const state = useSettingsStore.getState();
      expect(state.weightUnit).toBe('lbs');
      expect(state.remindersEnabled).toBe(false);
      expect(state.medicationReminderTime).toBe('09:00');
      expect(state.vaccinationAdvanceDays).toBe(7);
      expect(state.loading).toBe(false);
      expect(mockUserService.getProfile).toHaveBeenCalledWith('u1');
    });

    it('sets error on failure', async () => {
      mockUserService.getProfile.mockRejectedValue(new Error('Network error'));

      await useSettingsStore.getState().initialize('u1');
      expect(useSettingsStore.getState().error).toBe('Network error');
      expect(useSettingsStore.getState().loading).toBe(false);
    });
  });

  describe('setWeightUnit', () => {
    it('updates unit locally and persists via service', async () => {
      mockUserService.updateProfile.mockResolvedValue({
        ...defaultProfile,
        weight_unit: 'lbs',
      });

      await useSettingsStore.getState().setWeightUnit('u1', 'lbs');
      expect(useSettingsStore.getState().weightUnit).toBe('lbs');
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('u1', {
        weight_unit: 'lbs',
      });
    });

    it('reverts on failure', async () => {
      useSettingsStore.setState({ weightUnit: 'kg' });
      mockUserService.updateProfile.mockRejectedValue(
        new Error('Save failed'),
      );

      await useSettingsStore.getState().setWeightUnit('u1', 'lbs');
      expect(useSettingsStore.getState().weightUnit).toBe('kg');
      expect(useSettingsStore.getState().error).toBe('Save failed');
    });
  });

  describe('setRemindersEnabled', () => {
    it('updates and persists', async () => {
      mockUserService.updateProfile.mockResolvedValue({
        ...defaultProfile,
        reminders_enabled: false,
      });

      await useSettingsStore.getState().setRemindersEnabled('u1', false);
      expect(useSettingsStore.getState().remindersEnabled).toBe(false);
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('u1', {
        reminders_enabled: false,
      });
    });

    it('reverts on failure', async () => {
      useSettingsStore.setState({ remindersEnabled: true });
      mockUserService.updateProfile.mockRejectedValue(
        new Error('Save failed'),
      );

      await useSettingsStore.getState().setRemindersEnabled('u1', false);
      expect(useSettingsStore.getState().remindersEnabled).toBe(true);
    });
  });

  describe('setMedicationReminderTime', () => {
    it('updates and persists', async () => {
      mockUserService.updateProfile.mockResolvedValue({
        ...defaultProfile,
        medication_reminder_time: '09:00',
      });

      await useSettingsStore
        .getState()
        .setMedicationReminderTime('u1', '09:00');
      expect(useSettingsStore.getState().medicationReminderTime).toBe('09:00');
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('u1', {
        medication_reminder_time: '09:00',
      });
    });

    it('reverts on failure', async () => {
      useSettingsStore.setState({ medicationReminderTime: '20:00' });
      mockUserService.updateProfile.mockRejectedValue(
        new Error('Save failed'),
      );

      await useSettingsStore
        .getState()
        .setMedicationReminderTime('u1', '09:00');
      expect(useSettingsStore.getState().medicationReminderTime).toBe('20:00');
    });
  });

  describe('setVaccinationAdvanceDays', () => {
    it('updates and persists', async () => {
      mockUserService.updateProfile.mockResolvedValue({
        ...defaultProfile,
        vaccination_advance_days: 30,
      });

      await useSettingsStore
        .getState()
        .setVaccinationAdvanceDays('u1', 30);
      expect(useSettingsStore.getState().vaccinationAdvanceDays).toBe(30);
      expect(mockUserService.updateProfile).toHaveBeenCalledWith('u1', {
        vaccination_advance_days: 30,
      });
    });

    it('reverts on failure', async () => {
      useSettingsStore.setState({ vaccinationAdvanceDays: 14 });
      mockUserService.updateProfile.mockRejectedValue(
        new Error('Save failed'),
      );

      await useSettingsStore
        .getState()
        .setVaccinationAdvanceDays('u1', 30);
      expect(useSettingsStore.getState().vaccinationAdvanceDays).toBe(14);
    });
  });
});
