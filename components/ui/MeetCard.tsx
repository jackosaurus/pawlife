import { ReactNode } from 'react';
import { View, Text, Image } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';

interface MeetCardProps {
  /** Display name — used as the heading and as the initials-fallback letter. */
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
   * undefined, the card falls back to the same plum-bordered initials avatar
   * a pet would use on the detail screen. Typed as `number` because RN's
   * `require()` returns an opaque image-source id at runtime.
   */
  photoUri?: number;
  petType?: 'dog' | 'cat';
}

// Avatar size="lg" → 96pt circle, 3pt plum border. Hard-coded here so the
// local-image branch matches the Avatar fallback branch pixel-for-pixel
// (we render the photo directly because Avatar's `uri` prop expects a
// remote string, not a `require()`'d local asset).
const AVATAR_SIZE = 96;
const BORDER_WIDTH = 3;

/**
 * "Meet Beau" / "Meet Remy" card layout — photo-left, text-right, no surface,
 * top-aligned. See `docs/bemy-about-page-design.md` §"Meet Beau / Meet Remy
 * card layout (locked, May 3 2026)" for the locked layout decisions.
 */
export function MeetCard({
  name,
  subtitle,
  body,
  photoUri,
  petType,
}: MeetCardProps) {
  return (
    <View
      className="flex-row items-start"
      testID={`meet-card-${name.toLowerCase()}`}
    >
      {photoUri !== undefined ? (
        <Image
          source={photoUri}
          accessibilityLabel={`Photo of ${name}`}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            borderWidth: BORDER_WIDTH,
            borderColor: Colors.primary,
          }}
          resizeMode="cover"
          testID={`meet-card-photo-${name.toLowerCase()}`}
        />
      ) : (
        <Avatar name={name} size="lg" bordered petType={petType} />
      )}

      {/* 16pt gap between avatar and text column; flex-1 lets text consume
          the remaining width and wrap underneath the avatar's bottom edge. */}
      <View className="flex-1 ml-4">
        <Text
          accessibilityRole="header"
          className="text-title text-primary"
          style={{
            fontFamily: DisplayFontFamily.semibold,
            color: Colors.primary,
          }}
        >
          Meet {name}
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
    </View>
  );
}
