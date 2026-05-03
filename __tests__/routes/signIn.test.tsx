import React from 'react';
import { render } from '@testing-library/react-native';
import SignInScreen from '../../app/(auth)/sign-in';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SignInScreen (deprecated)', () => {
  it('redirects to the welcome screen on mount', () => {
    render(<SignInScreen />);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/welcome');
  });

  it('renders the redirect placeholder view', () => {
    const { getByTestId } = render(<SignInScreen />);
    expect(getByTestId('signin-redirect')).toBeTruthy();
  });
});
