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

// Photo aspect ratio matches the underlying 4:5 source crop (1024×1280).
// Rendered at full content width by the parent (page horizontal padding only),
// so the image consumes the full column width and the height tracks via
// aspectRatio. This is the dominant visual element of each card.
const PHOTO_ASPECT_RATIO = 4 / 5;
// Subtle 8pt rounded corner — keeps the photo feeling like an editorial
// image rather than a hard-cropped tile, but well under the circular
// treatment we removed.
const PHOTO_BORDER_RADIUS = 8;

/**
 * "Beau" / "Remy" Meet card layout — full-width photo on top, text stacked
 * below. No circle, no border, no shadow. See the May 3 2026 (#2) revision
 * in `docs/bemy-about-page-design.md` for the locked layout decisions.
 */
export function MeetCard({ name, subtitle, body, photoUri }: MeetCardProps) {
  return (
    <View testID={`meet-card-${name.toLowerCase()}`}>
      {photoUri !== undefined ? (
        <Image
          source={photoUri}
          accessibilityLabel={`Photo of ${name}`}
          style={{
            width: '100%',
            aspectRatio: PHOTO_ASPECT_RATIO,
            borderRadius: PHOTO_BORDER_RADIUS,
          }}
          resizeMode="cover"
          testID={`meet-card-photo-${name.toLowerCase()}`}
        />
      ) : (
        <View
          accessibilityLabel={`Placeholder photo of ${name}`}
          style={{
            width: '100%',
            aspectRatio: PHOTO_ASPECT_RATIO,
            borderRadius: PHOTO_BORDER_RADIUS,
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

      {/* Heading sits 16pt below the photo's bottom edge. */}
      <Text
        accessibilityRole="header"
        className="text-title text-primary mt-4"
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
      <View className="mt-3">
        {typeof body === 'string' ? (
          <Text className="text-body text-text-primary">{body}</Text>
        ) : (
          body
        )}
      </View>
    </View>
  );
}
