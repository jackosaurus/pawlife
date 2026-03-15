import { View, Text, Pressable } from 'react-native';
import { Colors } from '@/constants/colors';
import { ActionItem } from '@/types';

interface ActionItemCardProps {
  item: ActionItem;
  onLogDose: (medicationId: string) => void;
  onLogVaccination: (vaccinationId: string, intervalMonths: number) => void;
}

const urgencyDotColors: Record<string, string> = {
  overdue: Colors.statusOverdue,
  due_today: Colors.statusAmber,
  upcoming: Colors.textSecondary,
};

export function ActionItemCard({
  item,
  onLogDose,
  onLogVaccination,
}: ActionItemCardProps) {
  const dotColor = urgencyDotColors[item.urgency];

  const handleAction = () => {
    if (item.type === 'medication' && item.medicationId) {
      onLogDose(item.medicationId);
    } else if (item.type === 'vaccination' && item.vaccinationId) {
      onLogVaccination(item.vaccinationId, item.intervalMonths ?? 12);
    }
  };

  return (
    <View
      className="flex-row items-center py-2.5"
      testID="action-item-card"
    >
      {/* Status dot */}
      <View
        className="rounded-full mr-3"
        style={{ width: 8, height: 8, backgroundColor: dotColor }}
        testID="status-dot"
      />

      {/* Content */}
      <View className="flex-1 mr-3">
        <Text className="text-sm text-text-primary" numberOfLines={1}>
          <Text className="font-medium">{item.title}</Text>
          <Text className="text-text-secondary"> · {item.subtitle}</Text>
        </Text>
      </View>

      {/* Action button */}
      <Pressable onPress={handleAction} hitSlop={8} testID="action-button">
        <Text className="text-sm font-medium text-primary">Log</Text>
      </Pressable>
    </View>
  );
}
