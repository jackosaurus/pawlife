import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders title', () => {
    render(<Button title="Press Me" onPress={jest.fn()} />);
    expect(screen.getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="Press" onPress={onPress} />);
    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    render(<Button title="Press" onPress={jest.fn()} loading />);
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    expect(screen.queryByText('Press')).toBeNull();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Press" onPress={onPress} disabled />);
    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(<Button title="Press" onPress={onPress} loading />);
    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders the brandYellow variant with the title visible', () => {
    render(
      <Button title="Get Started" onPress={jest.fn()} variant="brandYellow" />,
    );
    // Smoke check: variant renders and the title is visible. Pixel-level
    // contrast is verified on a device build — NativeWind class -> style
    // resolution is not exercised in jest-expo.
    expect(screen.getByText('Get Started')).toBeTruthy();
  });
});
