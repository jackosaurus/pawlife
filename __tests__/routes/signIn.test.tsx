import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignInScreen from '../../app/(auth)/sign-in';

const mockSignIn = jest.fn();
const mockResetPassword = jest.fn();
const mockClearError = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    signIn: mockSignIn,
    resetPassword: mockResetPassword,
    loading: false,
    error: null,
    clearError: mockClearError,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('SignInScreen', () => {
  it('renders the warm "Welcome back" headline', () => {
    const { getByText } = render(<SignInScreen />);
    expect(getByText('Welcome back')).toBeTruthy();
  });

  it('renders the hero illustration placeholder', () => {
    const { getByTestId } = render(<SignInScreen />);
    expect(getByTestId('signin-hero')).toBeTruthy();
  });

  it('renders the "Forgot password?" link', () => {
    const { getByTestId } = render(<SignInScreen />);
    expect(getByTestId('forgot-password-link')).toBeTruthy();
  });

  it('prompts the user to enter their email when "Forgot password?" is tapped with an empty email field', async () => {
    const { getByTestId } = render(<SignInScreen />);
    fireEvent.press(getByTestId('forgot-password-link'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Enter your email',
      expect.stringContaining('signed up with'),
    );
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('calls resetPassword with the entered email on "Forgot password?" tap', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    const { getByTestId, getByPlaceholderText } = render(<SignInScreen />);
    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'a@b.com',
    );
    await act(async () => {
      fireEvent.press(getByTestId('forgot-password-link'));
    });
    expect(mockResetPassword).toHaveBeenCalledWith('a@b.com');
  });

  it('uses an eye-icon password toggle (no "Show"/"Hide" text)', () => {
    const { queryByText, getByTestId } = render(<SignInScreen />);
    expect(getByTestId('toggle-password')).toBeTruthy();
    expect(queryByText('Show')).toBeNull();
    expect(queryByText('Hide')).toBeNull();
  });

  it('renders the "Sign in" CTA with the new title-case copy', () => {
    const { getByText } = render(<SignInScreen />);
    expect(getByText('Sign in')).toBeTruthy();
  });
});
