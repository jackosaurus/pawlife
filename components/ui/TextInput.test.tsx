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

  it('toggles password visibility', () => {
    render(
      <TextInput
        label="Password"
        secureTextEntry
        placeholder="Enter password"
      />,
    );
    expect(screen.getByText('Show')).toBeTruthy();
    fireEvent.press(screen.getByTestId('toggle-password'));
    expect(screen.getByText('Hide')).toBeTruthy();
  });
});
