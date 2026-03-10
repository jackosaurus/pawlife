import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FAB } from './FAB';

describe('FAB', () => {
  it('renders', () => {
    render(<FAB onPress={jest.fn()} />);
    expect(screen.getByTestId('fab')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<FAB onPress={onPress} />);
    fireEvent.press(screen.getByTestId('fab'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
