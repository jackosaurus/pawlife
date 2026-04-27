import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type AddRecordCardVariant = 'add' | 'edit';

interface AddRecordCardProps {
  label: string;
  onPress: () => void;
  variant?: AddRecordCardVariant;
}

const VARIANT_ICON: Record<AddRecordCardVariant, keyof typeof Ionicons.glyphMap> = {
  add: 'add',
  edit: 'pencil-outline',
};

export function AddRecordCard({ label, onPress, variant = 'add' }: AddRecordCardProps) {
  const iconName = VARIANT_ICON[variant];
  // Outline icons render slightly smaller visually; pencil-outline gets a touch less than the bold "+".
  const iconSize = variant === 'add' ? 20 : 16;

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
        <Ionicons name={iconName} size={iconSize} color={Colors.primary} />
      </View>
      <Text className="text-callout font-medium text-primary">{label}</Text>
    </Pressable>
  );
}
