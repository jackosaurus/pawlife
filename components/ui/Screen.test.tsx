import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Screen } from './Screen';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Screen', () => {
  it('renders children', () => {
    render(
      <Screen>
        <Text>Hello</Text>
      </Screen>,
    );
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders with scroll enabled', () => {
    render(
      <Screen scroll>
        <Text>Scrollable</Text>
      </Screen>,
    );
    expect(screen.getByText('Scrollable')).toBeTruthy();
  });
});
