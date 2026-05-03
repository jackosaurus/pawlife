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

    const fallbackStyle = flattenStyle(
      getByTestId('meet-card-photo-fallback-beau').props.style,
    );
    expect(fallbackStyle.backgroundColor).toBe(Colors.dustyPlum);
    expect(fallbackStyle.aspectRatio).toBe(4 / 5);
    expect(fallbackStyle.width).toBe('100%');
    // Subtle 8pt rounded corner — no circle.
    expect(fallbackStyle.borderRadius).toBe(8);
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

    const photoStyle = flattenStyle(
      getByTestId('meet-card-photo-remy').props.style,
    );
    // 75% of content width, centered (alignSelf), 4:5 aspect.
    expect(photoStyle.width).toBe('75%');
    expect(photoStyle.aspectRatio).toBe(4 / 5);
    expect(photoStyle.alignSelf).toBe('center');
    // 16pt rounded corners — founder ask May 3 2026.
    expect(photoStyle.borderRadius).toBe(16);
    // Critically: no border, no shadow, no elevation. Founder feedback locks
    // the illustration to a clean editorial treatment.
    expect(photoStyle.borderWidth).toBeUndefined();
    expect(photoStyle.borderColor).toBeUndefined();
    expect(photoStyle.shadowColor).toBeUndefined();
    expect(photoStyle.shadowOpacity).toBeUndefined();
    expect(photoStyle.shadowRadius).toBeUndefined();
    expect(photoStyle.elevation).toBeUndefined();
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
