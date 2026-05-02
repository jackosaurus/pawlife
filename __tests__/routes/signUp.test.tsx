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
  it('renders the warm headline copy', () => {
    const { getByText } = render(<SignUpScreen />);
    expect(getByText('Add your first furry family member')).toBeTruthy();
  });

  it('shows an inline consent error when CTA tapped without ticking the checkbox', async () => {
    const { getByTestId, findByTestId } = render(<SignUpScreen />);
    // Always-enabled CTA pattern: tap should NOT call signUp, but should
    // surface a helpful inline error instead of being a dead button.
    fireEvent.press(getByTestId('button'));
    const errorText = await findByTestId('consent-error');
    expect(errorText.props.children).toMatch(/Privacy Policy/);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('clears the consent error when the checkbox is checked', async () => {
    const { getByTestId, queryByTestId } = render(<SignUpScreen />);
    fireEvent.press(getByTestId('button'));
    expect(queryByTestId('consent-error')).not.toBeNull();
    fireEvent.press(getByTestId('privacy-consent-checkbox'));
    expect(queryByTestId('consent-error')).toBeNull();
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('toggles the privacy checkbox accessibility state', async () => {
    const { getByTestId } = render(<SignUpScreen />);
    const checkbox = getByTestId('privacy-consent-checkbox');
    fireEvent.press(checkbox);
    expect(checkbox.props.accessibilityState.checked).toBe(true);
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

  it('renders a hero illustration placeholder above the form', () => {
    const { getByTestId } = render(<SignUpScreen />);
    expect(getByTestId('signup-hero')).toBeTruthy();
  });

  it('uses an eye-icon password toggle (no "Show"/"Hide" text)', () => {
    const { queryByText, getAllByTestId } = render(<SignUpScreen />);
    // Two password fields — both should render the icon-based toggle.
    expect(getAllByTestId('toggle-password').length).toBe(2);
    expect(queryByText('Show')).toBeNull();
    expect(queryByText('Hide')).toBeNull();
  });
});
