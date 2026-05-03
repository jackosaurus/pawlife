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
   * When true, renders a flat solid `Colors.primary` ring directly on the
   * avatar edge (cameo style — no inner gap, no shadow). Thickness scales
   * with `size` to keep ~3% of diameter readable across surfaces.
   *
   * Spec: `docs/bemy-pet-avatar-border-spec.md`.
   */
  bordered?: boolean;
}

const sizes = {
  sm: { container: 40, text: 16, borderWidth: 1.5 },
  md: { container: 64, text: 24, borderWidth: 2 },
  lg: { container: 96, text: 36, borderWidth: 3 },
} as const;

export function Avatar({ uri, name, size = 'md', bordered = false }: AvatarProps) {
  const { container, text, borderWidth } = sizes[size];
  const [failed, setFailed] = useState(false);

  // Reset failed state when URI changes
  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const initial = name.charAt(0).toUpperCase() || '?';

  const borderStyle = bordered
    ? { borderWidth, borderColor: Colors.primary }
    : null;

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: container,
          height: container,
          borderRadius: container / 2,
          ...(borderStyle ?? {}),
        }}
        contentFit="cover"
        onError={() => setFailed(true)}
        testID="avatar-image"
      />
    );
  }

  // When bordered, swap fallback fill to dustyPlum so the plum ring still
  // reads as a distinct frame around a softer plum disc (spec §7).
  const fallbackFill = bordered ? Colors.dustyPlum : Colors.primary;

  return (
    <View
      style={{
        width: container,
        height: container,
        borderRadius: container / 2,
        backgroundColor: fallbackFill,
        ...(borderStyle ?? {}),
      }}
      className="items-center justify-center"
      testID="avatar-fallback"
    >
      <Text style={{ fontSize: text, color: '#FFFFFF', fontWeight: '600' }}>
        {initial}
      </Text>
    </View>
  );
}
