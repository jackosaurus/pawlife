import React from 'react';
import { render } from '@testing-library/react-native';
import SignUpScreen from '../../app/(auth)/sign-up';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SignUpScreen (deprecated)', () => {
  it('redirects to the welcome screen on mount', () => {
    render(<SignUpScreen />);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/welcome');
  });

  it('renders the redirect placeholder view', () => {
    const { getByTestId } = render(<SignUpScreen />);
    expect(getByTestId('signup-redirect')).toBeTruthy();
  });
});
