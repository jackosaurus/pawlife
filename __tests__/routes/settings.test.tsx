import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import SettingsScreen, { buildDeletionBody } from '../../app/(main)/settings';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockInitializeSettings = jest.fn();
const mockSignOut = jest.fn();
const mockShowToast = jest.fn();
const mockDeleteAccount = jest.fn();
const mockGetDeletionContext = jest.fn();

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
      signOut: mockSignOut,
    }),
}));

jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ show: mockShowToast }),
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
    deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
  },
}));

jest.mock('@/services/familyService', () => ({
  familyService: {
    getDeletionContext: (...args: unknown[]) =>
      mockGetDeletionContext(...args),
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
    destructive: '#E5484D',
    border: '#EDE8DF',
    background: '#FFF8E7',
    inputFill: '#F5F3F0',
  },
}));

describe('SettingsScreen (slimmed)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDeletionContext.mockResolvedValue({
      isSoleAdminOfMultiMemberFamily: false,
      memberCount: 1,
      petNames: ['Buddy'],
    });
    mockDeleteAccount.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);
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

  describe('Delete Account', () => {
    it('renders the Delete Account row at the bottom', () => {
      const { getByText, getByTestId } = render(<SettingsScreen />);
      expect(getByText('Account Management')).toBeTruthy();
      expect(getByTestId('delete-account-button')).toBeTruthy();
      expect(getByText('Delete Account')).toBeTruthy();
    });

    it('opens the confirmation modal when tapped', async () => {
      const { getByTestId, queryByTestId } = render(<SettingsScreen />);
      // Modal not visible initially → typed-confirmation input is absent.
      expect(queryByTestId('typed-confirmation-input')).toBeNull();
      await act(async () => {
        fireEvent.press(getByTestId('delete-account-button'));
      });
      // The typed-confirmation input only renders when severity=irreversible
      // and the modal is visible.
      await waitFor(() => {
        expect(getByTestId('typed-confirmation-input')).toBeTruthy();
      });
    });

    it('keeps the confirm button disabled until DELETE is typed', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        fireEvent.press(getByTestId('delete-account-button'));
      });
      const input = await waitFor(() =>
        getByTestId('typed-confirmation-input'),
      );
      const confirmBtn = getByTestId('confirm-button');
      // Type wrong word — confirm should still be disabled and pressing
      // it does NOT call the service.
      fireEvent.changeText(input, 'delete');
      fireEvent.press(confirmBtn);
      expect(mockDeleteAccount).not.toHaveBeenCalled();

      // Type correct word — confirm now invokes the service.
      fireEvent.changeText(input, 'DELETE');
      await act(async () => {
        fireEvent.press(confirmBtn);
      });
      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
      });
    });

    it('signs the user out and toasts on successful deletion', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      await act(async () => {
        fireEvent.press(getByTestId('delete-account-button'));
      });
      const input = await waitFor(() =>
        getByTestId('typed-confirmation-input'),
      );
      fireEvent.changeText(input, 'DELETE');
      await act(async () => {
        fireEvent.press(getByTestId('confirm-button'));
      });
      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalled();
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('Account deleted.');
      });
    });

    it('keeps the modal open and shows the error message on failure', async () => {
      mockDeleteAccount.mockRejectedValue(
        new Error('Too many deletion attempts. Try again tomorrow.'),
      );
      const { getByTestId, queryByTestId } = render(<SettingsScreen />);
      await act(async () => {
        fireEvent.press(getByTestId('delete-account-button'));
      });
      const input = await waitFor(() =>
        getByTestId('typed-confirmation-input'),
      );
      fireEvent.changeText(input, 'DELETE');
      await act(async () => {
        fireEvent.press(getByTestId('confirm-button'));
      });
      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalled();
      });
      // signOut NOT called because deleteAccount rejected
      expect(mockSignOut).not.toHaveBeenCalled();
      // Inline error appears in the screen
      expect(queryByTestId('deletion-error')).toBeTruthy();
    });

    it('loads deletion context on mount', async () => {
      render(<SettingsScreen />);
      await waitFor(() => {
        expect(mockGetDeletionContext).toHaveBeenCalled();
      });
    });
  });
});

describe('buildDeletionBody', () => {
  it('falls back to "your pets" when no pet names are available', () => {
    const body = buildDeletionBody(null);
    expect(body).toContain('your pets');
    expect(body).toContain('cannot be undone');
  });

  it('lists pet names inline when available', () => {
    const body = buildDeletionBody({
      isSoleAdminOfMultiMemberFamily: false,
      memberCount: 1,
      petNames: ['Buddy'],
    });
    expect(body).toContain('your pets (Buddy)');
  });

  it('truncates long pet lists with "and N more"', () => {
    const body = buildDeletionBody({
      isSoleAdminOfMultiMemberFamily: false,
      memberCount: 1,
      petNames: ['A', 'B', 'C', 'D', 'E'],
    });
    expect(body).toContain('A, B, C, and 2 more');
  });

  it('warns about other family members losing access for sole admin', () => {
    const body = buildDeletionBody({
      isSoleAdminOfMultiMemberFamily: true,
      memberCount: 3,
      petNames: ['Buddy'],
    });
    expect(body).toContain('2 other family members will lose access');
  });

  it('always includes the shared-photo warning', () => {
    const body = buildDeletionBody({
      isSoleAdminOfMultiMemberFamily: false,
      memberCount: 1,
      petNames: ['Buddy'],
    });
    expect(body).toContain('photos of pets you share with family members');
  });

  it('uses singular member wording when only one other member', () => {
    const body = buildDeletionBody({
      isSoleAdminOfMultiMemberFamily: true,
      memberCount: 2,
      petNames: ['Buddy'],
    });
    expect(body).toContain('1 other family member will lose access');
  });
});
