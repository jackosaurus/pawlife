import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { MeetCard } from './MeetCard';
import { Colors } from '@/constants/colors';

jest.mock('expo-image', () => {
  const { View: RNView } = require('react-native');
  return {
    Image: (props: { [key: string]: unknown }) => <RNView {...props} />,
  };
});

const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, s) => ({ ...acc, ...flattenStyle(s) }),
      {},
    );
  }
  return style as Record<string, unknown>;
};

describe('MeetCard', () => {
  it('renders heading, subtitle, and body string', () => {
    const { getByText } = render(
      <MeetCard
        name="Beau"
        subtitle="Cocker spaniel × poodle · 8 years"
        body="Beau is the older of the two."
      />,
    );
    expect(getByText('Meet Beau')).toBeTruthy();
    expect(getByText('Cocker spaniel × poodle · 8 years')).toBeTruthy();
    expect(getByText('Beau is the older of the two.')).toBeTruthy();
  });

  it('renders ReactNode body with multiple paragraphs', () => {
    const { getByText } = render(
      <MeetCard
        name="Remy"
        subtitle="Bordoodle × poodle · 6 years"
        body={
          <>
            <Text>First paragraph.</Text>
            <View />
            <Text>Second paragraph.</Text>
          </>
        }
      />,
    );
    expect(getByText('First paragraph.')).toBeTruthy();
    expect(getByText('Second paragraph.')).toBeTruthy();
  });

  it('falls back to the bordered initials Avatar when photoUri is undefined', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <MeetCard
        name="Beau"
        subtitle="Cocker spaniel × poodle · 8 years"
        body="..."
      />,
    );
    // Avatar fallback path renders the dustyPlum disc with the first letter
    // when bordered + no URI.
    expect(getByTestId('avatar-fallback')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(queryByTestId('meet-card-photo-beau')).toBeNull();

    const fallbackStyle = flattenStyle(
      getByTestId('avatar-fallback').props.style,
    );
    expect(fallbackStyle.backgroundColor).toBe(Colors.dustyPlum);
    expect(fallbackStyle.borderWidth).toBe(3);
    expect(fallbackStyle.borderColor).toBe(Colors.primary);
  });

  it('renders the local image when photoUri is provided', () => {
    // require() at runtime resolves to a numeric asset id; mocked with a sentinel.
    const fakeAsset = 42 as unknown as number;
    const { getByTestId, queryByTestId } = render(
      <MeetCard
        name="Remy"
        subtitle="Bordoodle × poodle · 6 years"
        body="..."
        photoUri={fakeAsset}
      />,
    );
    expect(getByTestId('meet-card-photo-remy')).toBeTruthy();
    // No fallback Avatar when a photo is present.
    expect(queryByTestId('avatar-fallback')).toBeNull();

    const photoStyle = flattenStyle(
      getByTestId('meet-card-photo-remy').props.style,
    );
    // Matches Avatar size="lg" — 96pt circle, 3pt plum border.
    expect(photoStyle.width).toBe(96);
    expect(photoStyle.height).toBe(96);
    expect(photoStyle.borderRadius).toBe(48);
    expect(photoStyle.borderWidth).toBe(3);
    expect(photoStyle.borderColor).toBe(Colors.primary);
  });

  it('exposes a photo accessibilityLabel including the pet name', () => {
    const fakeAsset = 7 as unknown as number;
    const { getByTestId } = render(
      <MeetCard
        name="Remy"
        subtitle="..."
        body="..."
        photoUri={fakeAsset}
      />,
    );
    expect(
      getByTestId('meet-card-photo-remy').props.accessibilityLabel,
    ).toBe('Photo of Remy');
  });
});
