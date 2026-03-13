import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface AddRecordCardProps {
  label: string;
  onPress: () => void;
}

export function AddRecordCard({ label, onPress }: AddRecordCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-card mx-6 mb-3 px-4 py-3 flex-row items-center"
      style={{
        backgroundColor: `${Colors.primary}10`,
        borderWidth: 1,
        borderColor: `${Colors.primary}25`,
        borderStyle: 'dashed',
      }}
      testID="add-record-card"
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${Colors.primary}20` }}
      >
        <Ionicons name="add" size={20} color={Colors.primary} />
      </View>
      <Text className="text-base font-medium text-primary">{label}</Text>
    </Pressable>
  );
}
