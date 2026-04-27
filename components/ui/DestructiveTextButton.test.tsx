import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { DestructiveTextButton } from './DestructiveTextButton';
import { Colors } from '@/constants/colors';

describe('DestructiveTextButton', () => {
  it('renders the label', () => {
    render(<DestructiveTextButton label="Delete" onPress={jest.fn()} />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<DestructiveTextButton label="Delete" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(
      <DestructiveTextButton label="Delete" onPress={onPress} disabled testID="btn" />,
    );
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('uses the destructive color for label text', () => {
    render(<DestructiveTextButton label="Delete" onPress={jest.fn()} />);
    const text = screen.getByText('Delete');
    // Style may be array or object — flatten and look for color.
    const style = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style)
      : text.props.style;
    expect(style.color).toBe(Colors.destructive);
  });

  it('exposes accessibility role and label', () => {
    render(<DestructiveTextButton label="Remove" onPress={jest.fn()} testID="btn" />);
    const button = screen.getByTestId('btn');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Remove');
  });

  it('marks accessibilityState disabled when disabled', () => {
    render(
      <DestructiveTextButton label="Remove" onPress={jest.fn()} disabled testID="btn" />,
    );
    const button = screen.getByTestId('btn');
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });
});
