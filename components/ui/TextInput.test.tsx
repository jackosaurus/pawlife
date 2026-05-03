import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('renders label', () => {
    render(<TextInput label="Email" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('renders error message', () => {
    render(<TextInput label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeTruthy();
  });

  it('does not render error when not provided', () => {
    render(<TextInput label="Email" />);
    expect(screen.queryByText('Invalid email')).toBeNull();
  });

  it('calls onChangeText', () => {
    const onChangeText = jest.fn();
    render(
      <TextInput
        label="Email"
        placeholder="Enter email"
        onChangeText={onChangeText}
      />,
    );
    fireEvent.changeText(screen.getByPlaceholderText('Enter email'), 'test');
    expect(onChangeText).toHaveBeenCalledWith('test');
  });

  it('toggles password visibility via the eye icon', () => {
    render(
      <TextInput
        label="Password"
        secureTextEntry
        placeholder="Enter password"
      />,
    );
    const toggle = screen.getByTestId('toggle-password');
    // Initial accessibility label reflects the action ("Show password" while
    // hidden). After tapping, it flips to "Hide password".
    expect(toggle.props.accessibilityLabel).toBe('Show password');
    fireEvent.press(toggle);
    expect(toggle.props.accessibilityLabel).toBe('Hide password');
  });

  it('applies the focused-width (2px) border when an error is present', () => {
    // Designer spec §5/§6: error border should match the focused-state width
    // so an errored field reads as weighted, not subtly outlined.
    const flattenStyle = (style: unknown): Record<string, unknown> => {
      if (!style) return {};
      const arr = Array.isArray(style) ? style : [style];
      return arr.reduce<Record<string, unknown>>(
        (acc, s) => Object.assign(acc, s ?? {}),
        {},
      );
    };
    type Ancestor = { props: { style?: unknown }; parent: Ancestor | null };
    const findBorderedAncestor = (
      node: Ancestor | null,
    ): Record<string, unknown> | null => {
      let current = node;
      while (current) {
        const s = flattenStyle(current.props.style);
        if (typeof s.borderWidth === 'number') {
          return s;
        }
        current = current.parent;
      }
      return null;
    };

    const { getByPlaceholderText, rerender } = render(
      <TextInput label="Email" placeholder="Enter email" />,
    );
    const baseStyle = findBorderedAncestor(
      getByPlaceholderText('Enter email'),
    );
    expect(baseStyle?.borderWidth).toBe(1);

    rerender(
      <TextInput
        label="Email"
        placeholder="Enter email"
        error="Invalid email"
      />,
    );
    const erroredStyle = findBorderedAncestor(
      getByPlaceholderText('Enter email'),
    );
    expect(erroredStyle?.borderWidth).toBe(2);
  });

  it('uses an eye icon (not a "Show"/"Hide" text label) for the toggle', () => {
    render(
      <TextInput
        label="Password"
        secureTextEntry
        placeholder="Enter password"
      />,
    );
    // Brief: replace text-toggle with eye-outline / eye-off-outline icons.
    expect(screen.queryByText('Show')).toBeNull();
    expect(screen.queryByText('Hide')).toBeNull();
  });
});
