import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface SectionHeaderProps {
  icon: string;
  title: string;
  count?: number;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
  alertCount?: number;
}

export function SectionHeader({
  icon,
  title,
  count,
  actionIcon = 'add-circle-outline',
  onAction,
  alertCount,
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center">
        <Ionicons
          name={icon as any}
          size={20}
          color={Colors.textSecondary}
        />
        <Text className="text-xl font-semibold text-text-primary ml-2">
          {title}
        </Text>
        {count != null && count > 0 ? (
          <Text className="text-base text-text-secondary ml-1.5">
            ({count})
          </Text>
        ) : null}
        {alertCount != null && alertCount > 0 ? (
          <View
            className="ml-2 rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: `${Colors.statusOverdue}20` }}
            testID="alert-badge"
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: Colors.statusOverdue }}
            >
              {alertCount}
            </Text>
          </View>
        ) : null}
      </View>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8} testID="section-add">
          <Ionicons
            name={actionIcon as any}
            size={22}
            color={Colors.primary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
