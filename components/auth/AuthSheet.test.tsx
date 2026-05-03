import React, { createRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AuthSheet, AuthSheetHandle } from './AuthSheet';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockResetPassword = jest.fn();
const mockClearError = jest.fn();
const mockOpenBrowserAsync = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native');
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(({ children }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        snapToIndex: jest.fn(),
        close: jest.fn(),
      }));
      return <RN.View testID="bottom-sheet">{children}</RN.View>;
    }),
    BottomSheetView: RN.View,
    BottomSheetScrollView: RN.View,
    BottomSheetBackdrop: RN.View,
  };
});

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowserAsync(...args),
}));

// authStore mock — share state across the two forms via a module-scoped
// factory so we can control loading/error per-test. Variable name must start
// with `mock` to satisfy jest's out-of-scope guard.
let mockStoreState: {
  signUp: jest.Mock;
  signIn: jest.Mock;
  resetPassword: jest.Mock;
  loading: boolean;
  error: string | null;
  clearError: jest.Mock;
};

jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => mockStoreState,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockStoreState = {
    signUp: mockSignUp,
    signIn: mockSignIn,
    resetPassword: mockResetPassword,
    loading: false,
    error: null,
    clearError: mockClearError,
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthSheet', () => {
  it('defaults to the sign-up tab and renders the warm sign-up copy', () => {
    const { getByText, getByTestId } = render(<AuthSheet />);
    expect(getByTestId('auth-sheet-signup')).toBeTruthy();
    expect(getByText('Welcome to the family.')).toBeTruthy();
    expect(
      getByText(
        'Beau, Remy, and the rest of the pack are excited to meet yours.',
      ),
    ).toBeTruthy();
  });

  it('switches to the sign-in tab when the Sign in pill is tapped', () => {
    const { getByTestId, queryByTestId, getByText } = render(<AuthSheet />);
    fireEvent.press(getByTestId('auth-tab-signin'));
    expect(getByTestId('auth-sheet-signin')).toBeTruthy();
    expect(queryByTestId('auth-sheet-signup')).toBeNull();
    expect(getByText('Welcome back.')).toBeTruthy();
  });

  it('switches back to the sign-up tab from the sign-in tab', () => {
    const { getByTestId } = render(<AuthSheet />);
    fireEvent.press(getByTestId('auth-tab-signin'));
    fireEvent.press(getByTestId('auth-tab-signup'));
    expect(getByTestId('auth-sheet-signup')).toBeTruthy();
  });

  it('reflects active state on the segmented control via accessibilityState', () => {
    const { getByTestId } = render(<AuthSheet />);
    expect(getByTestId('auth-tab-signup').props.accessibilityState.selected).toBe(
      true,
    );
    expect(getByTestId('auth-tab-signin').props.accessibilityState.selected).toBe(
      false,
    );
    fireEvent.press(getByTestId('auth-tab-signin'));
    expect(getByTestId('auth-tab-signin').props.accessibilityState.selected).toBe(
      true,
    );
  });

  it('exposes an imperative open() handle that swaps to the requested tab', () => {
    const ref = createRef<AuthSheetHandle>();
    const { getByTestId, queryByTestId } = render(<AuthSheet ref={ref} />);
    expect(getByTestId('auth-sheet-signup')).toBeTruthy();
    act(() => {
      ref.current?.open('signin');
    });
    expect(queryByTestId('auth-sheet-signup')).toBeNull();
    expect(getByTestId('auth-sheet-signin')).toBeTruthy();
    act(() => {
      ref.current?.open('signup');
    });
    expect(getByTestId('auth-sheet-signup')).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Autocomplete hints — the SSO substitute (per PM §6 item 1)
  // -------------------------------------------------------------------------

  it('wires email autocomplete hints on the sign-up email input', () => {
    const { getByTestId } = render(<AuthSheet />);
    const email = getByTestId('signup-email-input');
    expect(email.props.autoComplete).toBe('email');
    expect(email.props.textContentType).toBe('emailAddress');
    expect(email.props.keyboardType).toBe('email-address');
    expect(email.props.autoCapitalize).toBe('none');
  });

  it('wires newPassword textContentType on the sign-up password fields', () => {
    const { getByTestId } = render(<AuthSheet />);
    expect(getByTestId('signup-password-input').props.textContentType).toBe(
      'newPassword',
    );
    expect(getByTestId('signup-confirm-input').props.textContentType).toBe(
      'newPassword',
    );
  });

  it('wires email + password autocomplete hints on the sign-in inputs', () => {
    const { getByTestId } = render(<AuthSheet />);
    fireEvent.press(getByTestId('auth-tab-signin'));
    const email = getByTestId('signin-email-input');
    expect(email.props.autoComplete).toBe('email');
    expect(email.props.textContentType).toBe('emailAddress');
    expect(getByTestId('signin-password-input').props.textContentType).toBe(
      'password',
    );
    expect(getByTestId('signin-password-input').props.autoComplete).toBe(
      'password',
    );
  });

  // -------------------------------------------------------------------------
  // Sign-up flow
  // -------------------------------------------------------------------------

  it('blocks submit until the privacy checkbox is ticked', async () => {
    const { getByText, findByTestId } = render(<AuthSheet />);
    fireEvent.press(getByText('Create account'));
    const errorText = await findByTestId('consent-error');
    expect(errorText.props.children).toMatch(/Privacy Policy/);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('clears the consent error once the checkbox is ticked', () => {
    const { getByText, getByTestId, queryByTestId } = render(<AuthSheet />);
    fireEvent.press(getByText('Create account'));
    expect(queryByTestId('consent-error')).not.toBeNull();
    fireEvent.press(getByTestId('privacy-consent-checkbox'));
    expect(queryByTestId('consent-error')).toBeNull();
  });

  it('opens the privacy policy URL when the link is pressed', () => {
    const { getByTestId } = render(<AuthSheet />);
    fireEvent.press(getByTestId('privacy-policy-link'));
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith(
      'https://jackosaurus.github.io/bemy-legal/privacy.html',
    );
  });

  it('calls signUp with valid input + checked consent', async () => {
    mockSignUp.mockResolvedValueOnce(undefined);
    const { getByTestId, getByText } = render(<AuthSheet />);
    fireEvent.changeText(
      getByTestId('signup-email-input'),
      'jack@example.com',
    );
    fireEvent.changeText(
      getByTestId('signup-password-input'),
      'password123',
    );
    fireEvent.changeText(
      getByTestId('signup-confirm-input'),
      'password123',
    );
    fireEvent.press(getByTestId('privacy-consent-checkbox'));
    await act(async () => {
      fireEvent.press(getByText('Create account'));
      await Promise.resolve();
    });
    expect(mockSignUp).toHaveBeenCalledWith(
      'jack@example.com',
      'password123',
    );
  });

  it('surfaces a top-of-form error banner from the auth store', () => {
    mockStoreState.error = 'Invalid login credentials';
    const { getByText } = render(<AuthSheet />);
    expect(getByText('Invalid login credentials')).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Sign-in flow
  // -------------------------------------------------------------------------

  it('calls signIn with valid input on Sign in tab', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    const { getByTestId } = render(<AuthSheet />);
    fireEvent.press(getByTestId('auth-tab-signin'));
    fireEvent.changeText(
      getByTestId('signin-email-input'),
      'jack@example.com',
    );
    fireEvent.changeText(
      getByTestId('signin-password-input'),
      'password123',
    );
    await act(async () => {
      // Press the submit Button — `Sign in` text matches the tab pill too,
      // so we go through the Button primitive's `testID="button"`.
      fireEvent.press(getByTestId('button'));
      await Promise.resolve();
    });
    expect(mockSignIn).toHaveBeenCalledWith(
      'jack@example.com',
      'password123',
    );
  });

  it('shows an inline forgot-password error when email is empty', async () => {
    const { getByTestId, findByText } = render(<AuthSheet />);
    fireEvent.press(getByTestId('auth-tab-signin'));
    fireEvent.press(getByTestId('forgot-password-link'));
    const inlineError = await findByText(
      /Type your email above first/,
    );
    expect(inlineError).toBeTruthy();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('calls resetPassword with the entered email when Forgot? is tapped', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    const { getByTestId } = render(<AuthSheet />);
    fireEvent.press(getByTestId('auth-tab-signin'));
    fireEvent.changeText(
      getByTestId('signin-email-input'),
      'a@b.com',
    );
    await act(async () => {
      fireEvent.press(getByTestId('forgot-password-link'));
      await Promise.resolve();
    });
    expect(mockResetPassword).toHaveBeenCalledWith('a@b.com');
  });

  it('surfaces a reset-sent banner after a successful resetPassword call', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    const { getByTestId } = render(<AuthSheet />);
    fireEvent.press(getByTestId('auth-tab-signin'));
    fireEvent.changeText(
      getByTestId('signin-email-input'),
      'a@b.com',
    );
    await act(async () => {
      fireEvent.press(getByTestId('forgot-password-link'));
      await Promise.resolve();
    });
    expect(getByTestId('reset-sent-banner')).toBeTruthy();
  });
});
