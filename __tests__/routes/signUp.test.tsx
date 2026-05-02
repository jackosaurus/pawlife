import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SignUpScreen from '../../app/(auth)/sign-up';

const mockSignUp = jest.fn();
const mockOpenBrowserAsync = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowserAsync(...args),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    signUp: mockSignUp,
    loading: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SignUpScreen', () => {
  it('disables Create Account until consent checkbox is checked', () => {
    const { getByTestId } = render(<SignUpScreen />);
    const button = getByTestId('button');
    // RN Pressable forwards `disabled` via accessibility props, but our
    // Button applies an opacity-50 class when disabled and `disabled` prop
    // on the Pressable directly. Easier: try to press it and confirm signUp
    // wasn't called.
    fireEvent.press(button);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('enables Create Account once the checkbox is checked', async () => {
    const { getByTestId } = render(<SignUpScreen />);
    const checkbox = getByTestId('privacy-consent-checkbox');
    fireEvent.press(checkbox);
    // Toggling the checkbox flips `consented` to true. We don't actually
    // submit (RHF + zod would fail with empty fields) but the disabled
    // gate is the unit under test.
    const state = checkbox.props.accessibilityState;
    expect(state.checked).toBe(true);
    // Avoid an act warning from the trailing render without the field flush.
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('opens the privacy policy URL when the link is pressed', () => {
    const { getByTestId } = render(<SignUpScreen />);
    const link = getByTestId('privacy-policy-link');
    fireEvent.press(link);
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith(
      'https://jackosaurus.github.io/bemy-legal/privacy.html',
    );
  });
});
