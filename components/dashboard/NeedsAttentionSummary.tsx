import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { ActionItem } from '@/types';

interface NeedsAttentionSummaryProps {
  items: ActionItem[];
}

/**
 * Section heading on the dashboard above the per-pet action item cards.
 *
 * When there are items: warm-tone `title`-weight headline ("3 things need
 * your attention" / "1 thing needs your attention") with a colored status
 * dot whose color reflects the most-urgent item.
 *
 * When there are no items: celebratory empty state ("All caught up.").
 *
 * Replaces the previous tiny `caption`-pill rendering, which was the
 * highest-value piece of information on the screen but rendered at the
 * smallest text size — see `docs/pawlife-typography-review-product.md`
 * §2 Screen 2 for the rationale behind promoting it.
 */
export function NeedsAttentionSummary({ items }: NeedsAttentionSummaryProps) {
  if (items.length === 0) {
    return (
      <View
        className="flex-row items-center mb-4"
        testID="needs-attention-summary"
      >
        <Text className="text-title font-semibold text-text-primary">
          All caught up
        </Text>
        <Text className="text-title ml-1.5">🎉</Text>
      </View>
    );
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

  const label =
    items.length === 1
      ? '1 thing needs your attention'
      : `${items.length} things need your attention`;

  return (
    <View
      className="flex-row items-center mb-4"
      testID="needs-attention-summary"
    >
      <View
        className="rounded-full mr-3"
        style={{ width: 10, height: 10, backgroundColor: badgeColor }}
        testID="needs-attention-summary-dot"
      />
      <Text className="text-title font-semibold text-text-primary flex-1">
        {label}
      </Text>
    </View>
  );
}
