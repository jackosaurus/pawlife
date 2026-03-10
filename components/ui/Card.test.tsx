import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <Text>Card content</Text>
      </Card>,
    );
    expect(screen.getByText('Card content')).toBeTruthy();
  });

  it('calls onPress when pressable', () => {
    const onPress = jest.fn();
    render(
      <Card onPress={onPress}>
        <Text>Pressable card</Text>
      </Card>,
    );
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders as non-pressable without onPress', () => {
    render(
      <Card>
        <Text>Static card</Text>
      </Card>,
    );
    expect(screen.getByText('Static card')).toBeTruthy();
  });
});
