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

/**
 * Single action item rendered inside a per-pet PetActionList card.
 *
 * Layout (Option B redesign):
 *   ●  Heartgard Plus              [Log]
 *      For Beau · Due today
 *
 * - Status dot color reflects urgency (overdue=coral, due_today=amber,
 *   upcoming=gray).
 * - Title is `text-headline` so the action's subject anchors the row.
 * - "For {petName} · {urgency}" is `text-footnote` warm gray — secondary
 *   metadata that names the pet (since the BEAU/REMY eyebrow above the
 *   list is no longer rendered) and conveys urgency in plain language.
 * - "Log" is a `text-button-sm` plum link — consistent with the pattern
 *   used on `MedicationCard` and Pet Family "Restore".
 */
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
      className="flex-row items-center py-3"
      testID="action-item-card"
    >
      {/* Status dot */}
      <View
        className="rounded-full mr-3"
        style={{ width: 10, height: 10, backgroundColor: dotColor }}
        testID="status-dot"
      />

      {/* Content */}
      <View className="flex-1 mr-3">
        <Text
          className="text-headline text-text-primary"
          numberOfLines={1}
          testID="action-item-title"
        >
          {item.title}
        </Text>
        <Text
          className="text-footnote text-text-secondary mt-0.5"
          numberOfLines={1}
          testID="action-item-subtitle"
        >
          For {item.petName} · {item.subtitle}
        </Text>
      </View>

      {/* Action button */}
      <Pressable onPress={handleAction} hitSlop={8} testID="action-button">
        <Text className="text-button-sm text-primary">Log</Text>
      </Pressable>
    </View>
  );
}
