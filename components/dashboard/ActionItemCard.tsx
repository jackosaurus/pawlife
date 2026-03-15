import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ActionItem } from '@/types';

interface ActionItemCardProps {
  item: ActionItem;
  onLogDose: (medicationId: string) => void;
  onLogVaccination: (vaccinationId: string, intervalMonths: number) => void;
}

const urgencyColors: Record<string, string> = {
  overdue: Colors.statusOverdue,
  due_today: Colors.statusAmber,
  upcoming: 'transparent',
};

const urgencyIconColors: Record<string, string> = {
  overdue: Colors.statusOverdue,
  due_today: Colors.statusAmber,
  upcoming: Colors.textSecondary,
};

const iconByType: Record<string, keyof typeof Ionicons.glyphMap> = {
  medication: 'medical-outline',
  vaccination: 'fitness-outline',
};

export function ActionItemCard({
  item,
  onLogDose,
  onLogVaccination,
}: ActionItemCardProps) {
  const borderColor = urgencyColors[item.urgency];
  const iconColor = urgencyIconColors[item.urgency];
  const iconName = iconByType[item.type];

  const handleAction = () => {
    if (item.type === 'medication' && item.medicationId) {
      onLogDose(item.medicationId);
    } else if (item.type === 'vaccination' && item.vaccinationId) {
      onLogVaccination(item.vaccinationId, item.intervalMonths ?? 12);
    }
  };

  return (
    <View
      className="flex-row items-center px-3 py-3"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
      testID="action-item-card"
    >
      {/* Icon */}
      <View className="mr-3">
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>

      {/* Content */}
      <View className="flex-1 mr-3">
        <Text className="text-sm" numberOfLines={1}>
          <Text className="text-text-secondary">{item.petName}</Text>
          <Text className="text-text-secondary"> · </Text>
          <Text className="text-text-primary font-medium">{item.title}</Text>
        </Text>
        <Text className="text-sm text-text-secondary mt-0.5" numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>

      {/* Action button */}
      <Pressable onPress={handleAction} hitSlop={8} testID="action-button">
        <Text className="text-sm font-medium text-primary">
          {item.type === 'medication' ? 'Log Dose' : 'Log'}
        </Text>
      </Pressable>
    </View>
  );
}
