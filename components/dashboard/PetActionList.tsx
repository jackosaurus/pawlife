import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { ActionItem } from '@/types';
import { ActionItemCard } from './ActionItemCard';

const MAX_INLINE_PER_PET = 3;

interface PetActionListProps {
  petId: string;
  petName: string;
  items: ActionItem[];
  onLogDose: (medicationId: string) => void;
  onLogVaccination: (vaccinationId: string, intervalMonths: number) => void;
}

/**
 * Per-pet action list rendered immediately under each PetCard on the
 * dashboard.
 *
 * The Option B redesign (April 2026):
 *   - Pet cards remain the visual anchor; this component sits directly
 *     beneath them, no intermediate eyebrow.
 *   - Each card is a proper white card matching the visual treatment of
 *     PetCard (rounded-2xl, white bg, soft border).
 *   - Multiple action items stack inside one card, separated by a thin
 *     divider — preserving the relationship between a pet and its actions.
 *   - When there are 4+ items, a single "view all" pressable replaces the
 *     inline list so the dashboard doesn't grow unbounded.
 */
export function PetActionList({
  petId,
  petName,
  items,
  onLogDose,
  onLogVaccination,
}: PetActionListProps) {
  const router = useRouter();

  if (items.length === 0) {
    return null;
  }

  const isOverflow = items.length > MAX_INLINE_PER_PET;

  return (
    <Card className="mb-3 overflow-hidden p-0" testID="pet-action-list">
      {isOverflow ? (
        <Pressable
          onPress={() => router.push(`/(main)/pets/${petId}`)}
          className="px-4 py-3"
          testID="overflow-link"
        >
          <Text className="text-footnote text-text-primary">
            {items.length} items need attention for {petName}
          </Text>
          <Text className="text-button-sm text-primary mt-0.5">
            View all
          </Text>
        </Pressable>
      ) : (
        <View className="px-4">
          {items.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View className="h-px bg-border" />}
              <ActionItemCard
                item={item}
                onLogDose={onLogDose}
                onLogVaccination={onLogVaccination}
              />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
