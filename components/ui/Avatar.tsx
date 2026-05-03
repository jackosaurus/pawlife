import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  petType?: 'dog' | 'cat';
  /**
   * When true, renders a double ring around the avatar: an outer
   * `Colors.primary` (plum) ring with a `Colors.brandYellow` inner band.
   * Both thicknesses scale with `size`. No shadow, no inner gap beyond
   * the yellow band itself.
   *
   * Spec: `docs/bemy-pet-avatar-border-spec.md` + 2026-05-03 yellow-band
   * iteration (founder request).
   */
  bordered?: boolean;
}

const sizes = {
  sm: { container: 40, text: 16, plumWidth: 1.5, yellowWidth: 1 },
  md: { container: 64, text: 24, plumWidth: 2, yellowWidth: 1.5 },
  lg: { container: 96, text: 36, plumWidth: 3, yellowWidth: 2 },
} as const;

export function Avatar({ uri, name, size = 'md', bordered = false }: AvatarProps) {
  const { container, text, plumWidth, yellowWidth } = sizes[size];
  const [failed, setFailed] = useState(false);

  // Reset failed state when URI changes
  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const initial = name.charAt(0).toUpperCase() || '?';

  // When bordered, the photo shrinks to leave room for the plum ring + yellow band.
  // Inner diameter = container − 2*(plum) − 2*(yellow).
  const innerDiameter = bordered
    ? container - 2 * plumWidth - 2 * yellowWidth
    : container;

  // When bordered, swap fallback fill to dustyPlum so the rings still
  // read as a distinct frame around a softer plum disc (spec §7).
  const fallbackFill = bordered ? Colors.dustyPlum : Colors.primary;

  const showImage = uri && !failed;

  const inner = showImage ? (
    <Image
      source={{ uri }}
      style={{
        width: innerDiameter,
        height: innerDiameter,
        borderRadius: innerDiameter / 2,
      }}
      contentFit="cover"
      onError={() => setFailed(true)}
      testID="avatar-image"
    />
  ) : (
    <View
      style={{
        width: innerDiameter,
        height: innerDiameter,
        borderRadius: innerDiameter / 2,
        backgroundColor: fallbackFill,
      }}
      className="items-center justify-center"
      testID="avatar-fallback"
    >
      <Text style={{ fontSize: text, color: '#FFFFFF', fontWeight: '600' }}>
        {initial}
      </Text>
    </View>
  );

  if (!bordered) {
    return inner;
  }

  return (
    <View
      style={{
        width: container,
        height: container,
        borderRadius: container / 2,
        borderWidth: plumWidth,
        borderColor: Colors.primary,
        backgroundColor: Colors.brandYellow,
      }}
      className="items-center justify-center"
      testID="avatar-bordered"
    >
      {inner}
    </View>
  );
}
