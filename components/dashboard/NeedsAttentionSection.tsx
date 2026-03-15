import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { ActionItem } from '@/types';
import { ActionItemCard } from './ActionItemCard';

const MAX_INLINE_PER_PET = 3;

interface PetGroup {
  petId: string;
  petName: string;
  items: ActionItem[];
}

interface NeedsAttentionSectionProps {
  items: ActionItem[];
  onLogDose: (medicationId: string) => void;
  onLogVaccination: (vaccinationId: string, intervalMonths: number) => void;
}

function groupByPet(items: ActionItem[]): PetGroup[] {
  const map = new Map<string, PetGroup>();

  for (const item of items) {
    let group = map.get(item.petId);
    if (!group) {
      group = { petId: item.petId, petName: item.petName, items: [] };
      map.set(item.petId, group);
    }
    group.items.push(item);
  }

  // Sort pet groups: pets with overdue items first, then due_today, then upcoming
  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    const urgencyRank = (g: PetGroup) => {
      if (g.items.some((i) => i.urgency === 'overdue')) return 0;
      if (g.items.some((i) => i.urgency === 'due_today')) return 1;
      return 2;
    };
    const rankDiff = urgencyRank(a) - urgencyRank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.petName.localeCompare(b.petName);
  });

  return groups;
}

export function NeedsAttentionSection({
  items,
  onLogDose,
  onLogVaccination,
}: NeedsAttentionSectionProps) {
  const router = useRouter();

  if (items.length === 0) {
    return null;
  }

  const hasOverdue = items.some((item) => item.urgency === 'overdue');
  const badgeColor = hasOverdue ? Colors.statusOverdue : Colors.statusAmber;
  const petGroups = groupByPet(items);

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

      {/* Pet groups */}
      {petGroups.map((group) => {
        const isOverflow = group.items.length > MAX_INLINE_PER_PET;

        return (
          <Card key={group.petId} className="mb-2 overflow-hidden p-0">
            {/* Pet name header */}
            <View className="px-4 pt-3 pb-1">
              <Text
                className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
                testID="pet-group-header"
              >
                {group.petName}
              </Text>
            </View>

            {isOverflow ? (
              /* 4+ items: show summary that taps to pet detail */
              <Pressable
                onPress={() => router.push(`/(main)/pets/${group.petId}`)}
                className="px-4 py-3"
                testID="overflow-link"
              >
                <Text className="text-sm text-text-primary">
                  {group.items.length} items need attention
                </Text>
                <Text className="text-sm text-primary font-medium mt-0.5">
                  View all
                </Text>
              </Pressable>
            ) : (
              /* 3 or fewer: show inline checklist */
              <View className="px-4 pb-2">
                {group.items.map((item, index) => (
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
      })}
    </View>
  );
}
