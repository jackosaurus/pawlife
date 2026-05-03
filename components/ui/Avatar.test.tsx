import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Avatar } from './Avatar';
import { Colors } from '@/constants/colors';

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View {...props} />,
  };
});

const flattenStyle = (style: any): Record<string, any> => {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  return style;
};

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

  describe('bordered prop', () => {
    it('does not apply a border by default (image branch)', () => {
      render(<Avatar uri="https://example.com/photo.jpg" name="Buddy" size="lg" />);
      const style = flattenStyle(screen.getByTestId('avatar-image').props.style);
      expect(style.borderWidth).toBeUndefined();
      expect(style.borderColor).toBeUndefined();
    });

    it('does not apply a border by default (fallback branch)', () => {
      render(<Avatar name="Buddy" size="lg" />);
      const style = flattenStyle(screen.getByTestId('avatar-fallback').props.style);
      expect(style.borderWidth).toBeUndefined();
      expect(style.borderColor).toBeUndefined();
      // Fallback fill stays primary plum when not bordered.
      expect(style.backgroundColor).toBe(Colors.primary);
    });

    it('applies a 3pt Colors.primary border at size="lg" when bordered', () => {
      render(
        <Avatar
          uri="https://example.com/photo.jpg"
          name="Buddy"
          size="lg"
          bordered
        />,
      );
      const style = flattenStyle(screen.getByTestId('avatar-image').props.style);
      expect(style.borderWidth).toBe(3);
      expect(style.borderColor).toBe(Colors.primary);
    });

    it('applies a 2pt border at size="md" when bordered', () => {
      render(
        <Avatar
          uri="https://example.com/photo.jpg"
          name="Buddy"
          size="md"
          bordered
        />,
      );
      const style = flattenStyle(screen.getByTestId('avatar-image').props.style);
      expect(style.borderWidth).toBe(2);
      expect(style.borderColor).toBe(Colors.primary);
    });

    it('applies a 1.5pt border at size="sm" when bordered', () => {
      render(
        <Avatar
          uri="https://example.com/photo.jpg"
          name="Buddy"
          size="sm"
          bordered
        />,
      );
      const style = flattenStyle(screen.getByTestId('avatar-image').props.style);
      expect(style.borderWidth).toBe(1.5);
      expect(style.borderColor).toBe(Colors.primary);
    });

    it('swaps the fallback fill to dustyPlum when bordered and no URI', () => {
      render(<Avatar name="Buddy" size="lg" bordered />);
      const style = flattenStyle(screen.getByTestId('avatar-fallback').props.style);
      expect(style.backgroundColor).toBe(Colors.dustyPlum);
      expect(style.borderWidth).toBe(3);
      expect(style.borderColor).toBe(Colors.primary);
    });

    it('keeps the fallback fill at Colors.primary when not bordered (no URI)', () => {
      render(<Avatar name="Buddy" size="lg" />);
      const style = flattenStyle(screen.getByTestId('avatar-fallback').props.style);
      expect(style.backgroundColor).toBe(Colors.primary);
    });
  });
});
