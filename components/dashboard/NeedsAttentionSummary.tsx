import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { ActionItem } from '@/types';

interface NeedsAttentionSummaryProps {
  items: ActionItem[];
}

export function NeedsAttentionSummary({ items }: NeedsAttentionSummaryProps) {
  if (items.length === 0) {
    return null;
  }

  const hasOverdue = items.some((item) => item.urgency === 'overdue');
  const hasDueToday = items.some((item) => item.urgency === 'due_today');

  let badgeColor: string;
  if (hasOverdue) {
    badgeColor = Colors.statusOverdue;
  } else if (hasDueToday) {
    badgeColor = Colors.statusAmber;
  } else {
    badgeColor = Colors.statusNeutral;
  }

  const label = items.length === 1 ? '1 item needs attention' : `${items.length} items need attention`;

  return (
    <View
      className="flex-row items-center self-start mb-4 px-3 py-1.5 rounded-full"
      style={{ backgroundColor: Colors.card }}
      testID="needs-attention-summary"
    >
      <View
        className="rounded-full mr-2"
        style={{ width: 8, height: 8, backgroundColor: badgeColor }}
        testID="needs-attention-summary-dot"
      />
      <Text className="text-eyebrow uppercase text-text-secondary">
        {label}
      </Text>
    </View>
  );
}
