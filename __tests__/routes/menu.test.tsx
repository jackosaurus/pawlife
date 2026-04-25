import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MenuScreen from '../../app/(main)/menu';
import { userService } from '@/services/userService';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSignOut = jest.fn();

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
      session: {
        user: { id: 'user-1', email: 'jack@example.com' },
      },
      signOut: mockSignOut,
    }),
}));

jest.mock('@/services/userService', () => ({
  userService: {
    getProfile: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
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

describe('MenuScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userService.getProfile as jest.Mock).mockResolvedValue({
      id: 'user-1',
      display_name: 'Jack',
    });
  });

  it('renders display name and email in header', async () => {
    const { findByTestId, getByTestId } = render(<MenuScreen />);
    await findByTestId('menu-display-name');
    await waitFor(() => {
      expect(getByTestId('menu-display-name').props.children).toBe('Jack');
    });
    expect(getByTestId('menu-email').props.children).toBe('jack@example.com');
  });

  it('falls back to email when display name is empty', async () => {
    (userService.getProfile as jest.Mock).mockResolvedValue({
      id: 'user-1',
      display_name: null,
    });
    const { getByTestId } = render(<MenuScreen />);
    await waitFor(() => {
      expect(getByTestId('menu-display-name').props.children).toBe(
        'jack@example.com',
      );
    });
  });

  it('renders all menu rows', () => {
    const { getByTestId, getByText } = render(<MenuScreen />);
    expect(getByTestId('menu-row-settings')).toBeTruthy();
    expect(getByTestId('menu-row-pet-family')).toBeTruthy();
    expect(getByTestId('menu-row-feedback')).toBeTruthy();
    expect(getByTestId('menu-row-signout')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Pet Family')).toBeTruthy();
    expect(getByText('Send Feedback')).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('navigates to settings when Settings row pressed', () => {
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-settings'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/settings');
  });

  it('navigates to pet-family when Pet Family row pressed', () => {
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-pet-family'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/pet-family');
  });

  it('navigates to feedback when Send Feedback row pressed', () => {
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-feedback'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/feedback');
  });

  it('Sign Out row is styled destructively (red)', () => {
    const { getByText } = render(<MenuScreen />);
    const signOutText = getByText('Sign Out');
    expect(signOutText.props.style).toEqual(
      expect.objectContaining({ color: '#E8735A' }),
    );
  });

  it('on confirmed sign out, calls router.back BEFORE signOut', async () => {
    let alertButtons: Array<{ text: string; onPress?: () => void; style?: string }> = [];
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      alertButtons = (buttons ?? []) as typeof alertButtons;
    });

    const callOrder: string[] = [];
    mockBack.mockImplementation(() => {
      callOrder.push('back');
    });
    mockSignOut.mockImplementation(async () => {
      callOrder.push('signOut');
    });

    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-signout'));

    expect(Alert.alert).toHaveBeenCalled();
    const confirmBtn = alertButtons.find((b) => b.text === 'Sign Out');
    expect(confirmBtn).toBeTruthy();

    await act(async () => {
      await confirmBtn!.onPress!();
    });

    expect(callOrder).toEqual(['back', 'signOut']);
  });

  it('cancel sign out does not call signOut', async () => {
    let alertButtons: Array<{ text: string; onPress?: () => void; style?: string }> = [];
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      alertButtons = (buttons ?? []) as typeof alertButtons;
    });
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-signout'));
    const cancelBtn = alertButtons.find((b) => b.text === 'Cancel');
    expect(cancelBtn).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
