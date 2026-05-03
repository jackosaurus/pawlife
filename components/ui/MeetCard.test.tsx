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
  it('renders heading (just the name), subtitle, and body string', () => {
    const { getByText } = render(
      <MeetCard
        name="Beau"
        subtitle="Cocker spaniel × poodle · 8 years"
        body="Beau is the older of the two."
      />,
    );
    // Heading is just the pet's name now; "Meet" prefix dropped per the
    // May 3 2026 #2 vertical-stack revision.
    expect(getByText('Beau')).toBeTruthy();
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

  it('falls back to a plum placeholder block with the first initial when photoUri is undefined', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <MeetCard
        name="Beau"
        subtitle="Cocker spaniel × poodle · 8 years"
        body="..."
      />,
    );
    // The new fallback path is a same-dimensions plum block with the
    // pet's first initial centered (no Avatar component).
    expect(getByTestId('meet-card-photo-fallback-beau')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(queryByTestId('meet-card-photo-beau')).toBeNull();

    // Fallback is now wrapped in the same double-ring frame as the
    // photo path. The frame carries the dimensions + outer ring; the
    // inner View is the dustyPlum disc with the initial.
    const frameStyle = flattenStyle(
      getByTestId('meet-card-photo-frame-beau').props.style,
    );
    expect(frameStyle.width).toBe('50%');
    expect(frameStyle.aspectRatio).toBe(4 / 5);
    expect(frameStyle.borderRadius).toBe(16);
    expect(frameStyle.borderWidth).toBe(3);
    expect(frameStyle.borderColor).toBe(Colors.dustyPlum);

    const fallbackStyle = flattenStyle(
      getByTestId('meet-card-photo-fallback-beau').props.style,
    );
    expect(fallbackStyle.backgroundColor).toBe(Colors.dustyPlum);
    expect(fallbackStyle.borderRadius).toBe(11); // 16 − 3 − 2
  });

  it('renders the local image at full content width with no border or shadow', () => {
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
    // No fallback placeholder when a photo is present.
    expect(queryByTestId('meet-card-photo-fallback-remy')).toBeNull();

    // Frame holds the dimensions + double-ring border treatment.
    const frameStyle = flattenStyle(
      getByTestId('meet-card-photo-frame-remy').props.style,
    );
    expect(frameStyle.width).toBe('50%');
    expect(frameStyle.aspectRatio).toBe(4 / 5);
    expect(frameStyle.alignSelf).toBe('center');
    expect(frameStyle.borderRadius).toBe(16);
    // Outer ring: 3pt dustyPlum (light purple).
    expect(frameStyle.borderWidth).toBe(3);
    expect(frameStyle.borderColor).toBe(Colors.dustyPlum);
    // Inner band: 2pt brandYellow shows through padding gap.
    expect(frameStyle.padding).toBe(2);
    expect(frameStyle.backgroundColor).toBe(Colors.brandYellow);
    // No shadow / elevation — clean cameo treatment.
    expect(frameStyle.shadowColor).toBeUndefined();
    expect(frameStyle.shadowOpacity).toBeUndefined();
    expect(frameStyle.shadowRadius).toBeUndefined();
    expect(frameStyle.elevation).toBeUndefined();

    // Inner image fills the frame's content area at a slightly smaller radius.
    const imageStyle = flattenStyle(
      getByTestId('meet-card-photo-remy').props.style,
    );
    expect(imageStyle.width).toBe('100%');
    expect(imageStyle.height).toBe('100%');
    expect(imageStyle.borderRadius).toBe(11); // 16 − 3 − 2
  });

  it('exposes an illustration accessibilityLabel including the pet name', () => {
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
    ).toBe('Illustration of Remy');
  });

  it('uses a vertical layout (no flex-row) — heading + subtitle stacked above the illustration, body below', () => {
    const fakeAsset = 99 as unknown as number;
    const { getByTestId } = render(
      <MeetCard
        name="Beau"
        subtitle="Cocker spaniel × poodle · 8 years"
        body="Beau is sweet."
        photoUri={fakeAsset}
      />,
    );
    // The card root wraps a stacked View — heading first, then subtitle,
    // then the illustration, then the body. No flex-row.
    const card = getByTestId('meet-card-beau');
    expect(card.props.className ?? '').not.toContain('flex-row');
  });
});
