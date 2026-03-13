import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Avatar } from './Avatar';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View {...props} />,
  };
});

describe('Avatar', () => {
  it('renders image when URI provided', () => {
    render(<Avatar uri="https://example.com/photo.jpg" name="Buddy" />);
    expect(screen.getByTestId('avatar-image')).toBeTruthy();
  });

  it('renders fallback initial when no URI', () => {
    render(<Avatar name="Buddy" />);
    expect(screen.getByTestId('avatar-fallback')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
  });

  it('renders fallback for null URI', () => {
    render(<Avatar uri={null} name="Luna" />);
    expect(screen.getByTestId('avatar-fallback')).toBeTruthy();
    expect(screen.getByText('L')).toBeTruthy();
  });

  it('falls back to initial when image fails to load', () => {
    render(<Avatar uri="https://example.com/broken.jpg" name="Max" />);
    const image = screen.getByTestId('avatar-image');
    fireEvent(image, 'error');
    expect(screen.getByTestId('avatar-fallback')).toBeTruthy();
    expect(screen.getByText('M')).toBeTruthy();
  });
});
