import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '../../app/(auth)/welcome';
import { Colors } from '../../constants/colors';

const mockOpen = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Stub AuthSheet so welcome tests stay focused on welcome wiring. The sheet
// has its own dedicated test file in components/auth/.
jest.mock('../../components/auth/AuthSheet', () => {
  const React = require('react');
  return {
    __esModule: true,
    AuthSheet: React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        open: mockOpen,
        close: jest.fn(),
      }));
      return null;
    }),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WelcomeScreen', () => {
  it('renders the Bemy wordmark and tagline', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('Bemy')).toBeTruthy();
    expect(getByText('A digital home for your pet family.')).toBeTruthy();
  });

  it('renders the hero illustration with cover mode (no left/right gaps)', () => {
    // Switched from `contain` to `cover` on May 3 2026 — `contain` left
    // visible cream gaps on either side of the illustration on phones
    // where screen width exceeded the hero's bound height.
    const { getByTestId } = render(<WelcomeScreen />);
    const hero = getByTestId('welcome-hero');
    expect(hero.props.resizeMode).toBe('cover');
  });

  it('opens the auth sheet on the sign-up tab when "Get Started" is tapped', () => {
    const { getByText } = render(<WelcomeScreen />);
    fireEvent.press(getByText('Get Started'));
    expect(mockOpen).toHaveBeenCalledWith('signup');
  });

  it('opens the auth sheet on the sign-in tab when the secondary link is tapped', () => {
    const { getByTestId } = render(<WelcomeScreen />);
    fireEvent.press(getByTestId('welcome-signin-link'));
    expect(mockOpen).toHaveBeenCalledWith('signin');
  });

  it('renders the secondary "I already have an account" link', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('I already have an account')).toBeTruthy();
  });
});
