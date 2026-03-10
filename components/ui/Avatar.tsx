import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  petType?: 'dog' | 'cat';
}

const sizes = {
  sm: { container: 40, text: 16 },
  md: { container: 64, text: 24 },
  lg: { container: 96, text: 36 },
} as const;

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const { container, text } = sizes[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: container, height: container, borderRadius: container / 2 }}
        contentFit="cover"
        testID="avatar-image"
      />
    );
  }

  const initial = name.charAt(0).toUpperCase() || '?';

  return (
    <View
      style={{
        width: container,
        height: container,
        borderRadius: container / 2,
        backgroundColor: Colors.primary,
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
