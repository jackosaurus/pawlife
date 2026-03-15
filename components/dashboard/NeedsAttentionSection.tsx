import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { ActionItem } from '@/types';
import { ActionItemCard } from './ActionItemCard';

const MAX_COLLAPSED = 5;

interface NeedsAttentionSectionProps {
  items: ActionItem[];
  onLogDose: (medicationId: string) => void;
  onViewVaccination: (petId: string, vaccinationId: string) => void;
}

export function NeedsAttentionSection({
  items,
  onLogDose,
  onViewVaccination,
}: NeedsAttentionSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const hasOverdue = items.some((item) => item.urgency === 'overdue');
  const badgeColor = hasOverdue ? Colors.statusOverdue : Colors.statusAmber;
  const showToggle = items.length > MAX_COLLAPSED;
  const visibleItems = expanded ? items : items.slice(0, MAX_COLLAPSED);

  return (
    <View className="mb-4">
      {/* Section header */}
      <View className="flex-row items-center mb-2 px-1">
        <Text className="text-lg font-semibold text-text-primary">
          Needs Attention
        </Text>
        <View
          className="ml-2 items-center justify-center rounded-full"
          style={{
            width: 22,
            height: 22,
            backgroundColor: badgeColor,
          }}
          testID="count-badge"
        >
          <Text className="text-xs font-bold text-white">{items.length}</Text>
        </View>
      </View>

      {/* Card with items */}
      <Card className="mb-4 overflow-hidden p-0">
        {visibleItems.map((item, index) => (
          <View key={item.id}>
            {index > 0 && <View className="h-px bg-border mx-3" />}
            <ActionItemCard
              item={item}
              onLogDose={onLogDose}
              onViewVaccination={onViewVaccination}
            />
          </View>
        ))}

        {/* Show all / Show less toggle */}
        {showToggle && (
          <>
            <View className="h-px bg-border mx-3" />
            <Pressable
              onPress={() => setExpanded((prev) => !prev)}
              className="py-3 items-center"
              testID="toggle-button"
            >
              <Text className="text-sm font-medium text-primary">
                {expanded ? 'Show less' : `Show all (${items.length})`}
              </Text>
            </Pressable>
          </>
        )}
      </Card>
    </View>
  );
}
