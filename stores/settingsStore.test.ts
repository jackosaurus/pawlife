import { useSettingsStore } from './settingsStore';
import { userService } from '@/services/userService';

jest.mock('@/services/userService', () => ({
  userService: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

const mockUserService = userService as jest.Mocked<typeof userService>;

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({
    weightUnit: 'kg',
    loading: false,
    error: null,
  });
});

describe('settingsStore', () => {
  describe('initialize', () => {
    it('fetches profile and sets weight unit', async () => {
      mockUserService.getProfile.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        weight_unit: 'lbs',
        created_at: '2024-01-01',
      });

      await useSettingsStore.getState().initialize('u1');
      expect(useSettingsStore.getState().weightUnit).toBe('lbs');
      expect(useSettingsStore.getState().loading).toBe(false);
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
        id: 'u1',
        email: 'test@example.com',
        weight_unit: 'lbs',
        created_at: '2024-01-01',
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
});
