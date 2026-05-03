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

    // Post May-3-2026 yellow-band iteration: the bordered variant wraps
    // the inner Image/fallback in a View carrying the plum border +
    // brandYellow background. The yellow band shows in the gap between
    // the plum border and the inner element. Tests assert the wrapper.

    it('renders a wrapping bordered View at size="lg" with 3pt plum border + yellow band', () => {
      render(
        <Avatar
          uri="https://example.com/photo.jpg"
          name="Buddy"
          size="lg"
          bordered
        />,
      );
      const wrapper = flattenStyle(screen.getByTestId('avatar-bordered').props.style);
      expect(wrapper.borderWidth).toBe(3);
      expect(wrapper.borderColor).toBe(Colors.primary);
      expect(wrapper.backgroundColor).toBe(Colors.brandYellow);
      // Inner image no longer carries a border — the wrapper does.
      const inner = flattenStyle(screen.getByTestId('avatar-image').props.style);
      expect(inner.borderWidth).toBeUndefined();
    });

    it('renders a 2pt plum border + yellow band at size="md" when bordered', () => {
      render(
        <Avatar
          uri="https://example.com/photo.jpg"
          name="Buddy"
          size="md"
          bordered
        />,
      );
      const wrapper = flattenStyle(screen.getByTestId('avatar-bordered').props.style);
      expect(wrapper.borderWidth).toBe(2);
      expect(wrapper.borderColor).toBe(Colors.primary);
      expect(wrapper.backgroundColor).toBe(Colors.brandYellow);
    });

    it('renders a 1.5pt plum border + yellow band at size="sm" when bordered', () => {
      render(
        <Avatar
          uri="https://example.com/photo.jpg"
          name="Buddy"
          size="sm"
          bordered
        />,
      );
      const wrapper = flattenStyle(screen.getByTestId('avatar-bordered').props.style);
      expect(wrapper.borderWidth).toBe(1.5);
      expect(wrapper.borderColor).toBe(Colors.primary);
      expect(wrapper.backgroundColor).toBe(Colors.brandYellow);
    });

    it('swaps the inner fallback fill to dustyPlum when bordered and no URI; rings live on the wrapper', () => {
      render(<Avatar name="Buddy" size="lg" bordered />);
      // Inner fallback disc: dustyPlum background, no border
      const fallback = flattenStyle(screen.getByTestId('avatar-fallback').props.style);
      expect(fallback.backgroundColor).toBe(Colors.dustyPlum);
      expect(fallback.borderWidth).toBeUndefined();
      // Outer wrapper: 3pt plum border + brandYellow band
      const wrapper = flattenStyle(screen.getByTestId('avatar-bordered').props.style);
      expect(wrapper.borderWidth).toBe(3);
      expect(wrapper.borderColor).toBe(Colors.primary);
      expect(wrapper.backgroundColor).toBe(Colors.brandYellow);
    });

    it('keeps the fallback fill at Colors.primary when not bordered (no URI)', () => {
      render(<Avatar name="Buddy" size="lg" />);
      const style = flattenStyle(screen.getByTestId('avatar-fallback').props.style);
      expect(style.backgroundColor).toBe(Colors.primary);
    });
  });
});
