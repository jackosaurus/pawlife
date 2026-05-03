import { ReactNode } from 'react';
import { View, Text, Image } from 'react-native';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';

interface MeetCardProps {
  /** Display name — used as the heading and as the placeholder-fallback letter. */
  name: string;
  /** "Cocker spaniel × poodle · 8 years" — sits italic under the heading. */
  subtitle: string;
  /**
   * Body copy. Pass a string for a single paragraph, or a React node (e.g. a
   * fragment of `<Text>` blocks separated by spacers) for multi-paragraph
   * bodies.
   */
  body: string | ReactNode;
  /**
   * Local image asset (`require('@/assets/images/...')` result). When
   * undefined, the card falls back to a plum placeholder block of the same
   * dimensions with the pet's first initial centered. Typed as `number`
   * because RN's `require()` returns an opaque image source id at runtime.
   */
  photoUri?: number;
  /** Vestigial — retained for prop compatibility. The new layout has no Avatar fallback. */
  petType?: 'dog' | 'cat';
}

// Illustrations are 4:5 portrait (1122×1402 source). Rendered at 75% of
// content width centered (so an iPhone SE renders ~245×306pt) — small
// enough that the body text below the heading still fits on screen
// without scrolling, large enough to read the dog clearly. Rounded
// corners (16pt) per founder ask.
const PHOTO_ASPECT_RATIO = 4 / 5;
const PHOTO_BORDER_RADIUS = 16;
const PHOTO_WIDTH_FRACTION = '75%' as const;

/**
 * "Beau" / "Remy" Meet card layout — heading first, then subtitle, then a
 * centered illustration with rounded corners, then the body copy. See the
 * May 3 2026 (#3) revision: founder swapped to illustrated portraits with
 * a soft watercolor living-room scene + asked the photo to sit UNDER the
 * heading (not above), at a smaller size that doesn't dominate the screen.
 */
export function MeetCard({ name, subtitle, body, photoUri }: MeetCardProps) {
  return (
    <View testID={`meet-card-${name.toLowerCase()}`}>
      {/* Heading + subtitle come first now. */}
      <Text
        accessibilityRole="header"
        className="text-title text-primary"
        style={{
          fontFamily: DisplayFontFamily.semibold,
          color: Colors.primary,
        }}
      >
        {name}
      </Text>
      <Text className="text-caption text-text-secondary italic mt-1">
        {subtitle}
      </Text>

      {/* Illustration sits below the heading, centered, sized to fit on
          screen alongside the body copy. */}
      {photoUri !== undefined ? (
        <Image
          source={photoUri}
          accessibilityLabel={`Illustration of ${name}`}
          style={{
            width: PHOTO_WIDTH_FRACTION,
            aspectRatio: PHOTO_ASPECT_RATIO,
            borderRadius: PHOTO_BORDER_RADIUS,
            alignSelf: 'center',
            marginTop: 16,
          }}
          resizeMode="cover"
          testID={`meet-card-photo-${name.toLowerCase()}`}
        />
      ) : (
        <View
          accessibilityLabel={`Placeholder illustration of ${name}`}
          style={{
            width: PHOTO_WIDTH_FRACTION,
            aspectRatio: PHOTO_ASPECT_RATIO,
            borderRadius: PHOTO_BORDER_RADIUS,
            alignSelf: 'center',
            marginTop: 16,
            backgroundColor: Colors.dustyPlum,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          testID={`meet-card-photo-fallback-${name.toLowerCase()}`}
        >
          <Text
            style={{
              fontFamily: DisplayFontFamily.bold,
              fontSize: 96,
              lineHeight: 104,
              color: '#FFFFFF',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="mt-4">
        {typeof body === 'string' ? (
          <Text className="text-body text-text-primary">{body}</Text>
        ) : (
          body
        )}
      </View>
    </View>
  );
}
