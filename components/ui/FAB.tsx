import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface FABProps {
  onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }}
      testID="fab"
    >
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
  );
}
