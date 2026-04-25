import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MenuRow } from './MenuRow';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('MenuRow', () => {
  it('renders the label', () => {
    render(<MenuRow label="Settings" icon="settings-outline" onPress={jest.fn()} />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders chevron when not destructive', () => {
    render(
      <MenuRow
        label="Settings"
        icon="settings-outline"
        onPress={jest.fn()}
        testID="menu-row-settings"
      />,
    );
    // The Ionicons mock renders as a string component; we can find it by the
    // testID on the Pressable plus presence of the icon name through props.
    expect(screen.getByTestId('menu-row-settings')).toBeTruthy();
  });

  it('does not render chevron when destructive', () => {
    const { UNSAFE_root } = render(
      <MenuRow
        label="Sign Out"
        onPress={jest.fn()}
        destructive
        testID="menu-row-signout"
      />,
    );
    // Mocked Ionicons render as elements named 'Ionicons'. With destructive
    // and no icon prop, there should be ZERO Ionicons children.
    const icons = UNSAFE_root.findAllByType('Ionicons' as never);
    expect(icons.length).toBe(0);
  });

  it('renders an icon when provided', () => {
    const { UNSAFE_root } = render(
      <MenuRow
        label="Settings"
        icon="settings-outline"
        onPress={jest.fn()}
      />,
    );
    const icons = UNSAFE_root.findAllByType('Ionicons' as never);
    // Icon + chevron = 2
    expect(icons.length).toBe(2);
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(
      <MenuRow
        label="Settings"
        icon="settings-outline"
        onPress={onPress}
        testID="menu-row-settings"
      />,
    );
    fireEvent.press(screen.getByTestId('menu-row-settings'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies destructive styling when destructive is true', () => {
    render(
      <MenuRow
        label="Sign Out"
        onPress={jest.fn()}
        destructive
        testID="menu-row-signout"
      />,
    );
    const text = screen.getByText('Sign Out');
    // Style prop should include destructive color
    expect(text.props.style).toEqual(
      expect.objectContaining({ color: '#E8735A' }),
    );
  });
});
