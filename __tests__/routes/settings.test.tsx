import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../app/(main)/settings';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockInitializeSettings = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({
      session: { user: { id: 'user-1', email: 'jack@example.com' } },
    }),
}));

jest.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (selector: (s: unknown) => unknown) =>
    selector({
      weightUnit: 'kg',
      setWeightUnit: jest.fn(),
      remindersEnabled: true,
      setRemindersEnabled: jest.fn(),
      medicationReminderTime: '08:00',
      setMedicationReminderTime: jest.fn(),
      vaccinationAdvanceDays: 14,
      setVaccinationAdvanceDays: jest.fn(),
      initialize: mockInitializeSettings,
    }),
}));

jest.mock('@/services/userService', () => ({
  userService: {
    getProfile: jest.fn().mockResolvedValue({ display_name: 'Jack' }),
    updateProfile: jest.fn(),
  },
}));

jest.mock('@/services/authService', () => ({
  authService: {
    changePassword: jest.fn(),
  },
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.0.0' },
}));

jest.mock('@/constants/colors', () => ({
  Colors: {
    textPrimary: '#2D2A26',
    textSecondary: '#7A756E',
    primary: '#4A2157',
    statusOverdue: '#E8735A',
    border: '#EDE8DF',
    background: '#FFF8E7',
    inputFill: '#F5F3F0',
  },
}));

describe('SettingsScreen (slimmed)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Account/Preferences/Reminders sections', async () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Account')).toBeTruthy();
    expect(getByText('Preferences')).toBeTruthy();
    expect(getByText('Reminders')).toBeTruthy();
    await waitFor(() => {
      expect(mockInitializeSettings).toHaveBeenCalled();
    });
  });

  it('renders display name and password options', () => {
    const { getByTestId } = render(<SettingsScreen />);
    expect(getByTestId('edit-display-name-button')).toBeTruthy();
    expect(getByTestId('change-password-button')).toBeTruthy();
  });

  it('renders Weight Unit and Reminders controls', () => {
    const { getByText, getByTestId } = render(<SettingsScreen />);
    expect(getByText('Weight Unit')).toBeTruthy();
    expect(getByText('Push Reminders')).toBeTruthy();
    expect(getByTestId('reminders-toggle')).toBeTruthy();
  });

  it('does NOT render Family section', () => {
    const { queryByText } = render(<SettingsScreen />);
    expect(queryByText('Family')).toBeNull();
  });

  it('does NOT render Your Pets / Pets section', () => {
    const { queryByText } = render(<SettingsScreen />);
    expect(queryByText('Your Pets')).toBeNull();
    expect(queryByText('Archived Pets')).toBeNull();
  });

  it('does NOT render Send Feedback link', () => {
    const { queryByText, queryByTestId } = render(<SettingsScreen />);
    expect(queryByText('Send Feedback')).toBeNull();
    expect(queryByTestId('send-feedback-button')).toBeNull();
  });

  it('does NOT render Sign Out button', () => {
    const { queryByText } = render(<SettingsScreen />);
    expect(queryByText('Sign Out')).toBeNull();
  });

  it('renders app version footer', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Pawlife v1.0.0')).toBeTruthy();
  });
});
