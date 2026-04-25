import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuRowProps {
  label: string;
  icon?: IoniconName;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}

export function MenuRow({
  label,
  icon,
  onPress,
  destructive,
  testID,
}: MenuRowProps) {
  const labelColor = destructive ? Colors.statusOverdue : Colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className="flex-row items-center px-5 py-4 active:bg-input-fill"
    >
      {icon ? (
        <View className="w-7 items-center mr-3">
          <Ionicons name={icon} size={22} color={Colors.textSecondary} />
        </View>
      ) : null}
      <Text
        className={`flex-1 text-base ${destructive ? 'font-semibold' : ''}`}
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      {!destructive && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.textSecondary}
        />
      )}
    </Pressable>
  );
}
