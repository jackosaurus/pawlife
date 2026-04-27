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
      {/* Pet name header */}
      <View className="px-4 pt-3 pb-1">
        <Text
          className="text-eyebrow uppercase text-text-secondary"
          testID="pet-group-header"
        >
          {petName}
        </Text>
      </View>

      {isOverflow ? (
        /* 4+ items: show summary that taps to pet detail */
        <Pressable
          onPress={() => router.push(`/(main)/pets/${petId}`)}
          className="px-4 py-3"
          testID="overflow-link"
        >
          <Text className="text-footnote text-text-primary">
            {items.length} items need attention
          </Text>
          <Text className="text-button-sm text-primary mt-0.5">
            View all
          </Text>
        </Pressable>
      ) : (
        /* 3 or fewer: show inline checklist */
        <View className="px-4 pb-2">
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
