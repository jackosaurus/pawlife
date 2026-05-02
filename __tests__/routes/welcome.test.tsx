import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '../../app/(auth)/welcome';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WelcomeScreen', () => {
  it('renders the Bemy wordmark and tagline', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('Bemy')).toBeTruthy();
    expect(getByText('A digital home for your pet family.')).toBeTruthy();
  });

  it('renders the hero illustration placeholder', () => {
    const { getByTestId } = render(<WelcomeScreen />);
    expect(getByTestId('welcome-hero')).toBeTruthy();
  });

  it('routes to sign-up when "Get Started" is pressed', () => {
    const { getByText } = render(<WelcomeScreen />);
    fireEvent.press(getByText('Get Started'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-up');
  });

  it('renders the secondary "I already have an account" link', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('I already have an account')).toBeTruthy();
  });
});
