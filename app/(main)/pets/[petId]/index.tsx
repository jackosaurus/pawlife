import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { RecordCard } from '@/components/ui/RecordCard';
import { StickyHeader } from '@/components/pets/StickyHeader';
import { TabBar, Tab } from '@/components/pets/TabBar';
import { AddRecordCard } from '@/components/pets/AddRecordCard';
import { usePet } from '@/hooks/usePet';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useVaccinations } from '@/hooks/useVaccinations';
import { useMedications } from '@/hooks/useMedications';
import { useVetVisits } from '@/hooks/useVetVisits';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { getVaccinationStatus } from '@/utils/status';
import { formatDate } from '@/utils/dates';
import { Colors } from '@/constants/colors';

const TABS: Tab[] = [
  { key: 'food', label: 'Food' },
  { key: 'vet-visits', label: 'Vet Visits' },
  { key: 'medications', label: 'Medicines' },
  { key: 'vaccinations', label: 'Vaccinations' },
  { key: 'weight', label: 'Weight' },
];

const FOOD_TYPE_LABELS: Record<string, string> = {
  dry: 'Dry',
  wet: 'Wet',
  raw: 'Raw',
  mixed: 'Mixed',
};

export default function PetDetailScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('food');
  const { pet, loading, error, refresh } = usePet(petId!);
  const { currentFood, history: foodHistory, refresh: refreshFood } = useFoodEntries(petId!);
  const { vaccinations, refresh: refreshVaccinations } = useVaccinations(petId!);
  const { medications, refresh: refreshMedications } = useMedications(petId!);
  const { vetVisits, refresh: refreshVetVisits } = useVetVisits(petId!);
  const { weightEntries, refresh: refreshWeight } = useWeightEntries(petId!);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
      refreshFood();
      refreshVaccinations();
      refreshMedications();
      refreshVetVisits();
      refreshWeight();
    });
    return unsubscribe;
  }, [navigation, refresh, refreshFood, refreshVaccinations, refreshMedications, refreshVetVisits, refreshWeight]);

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !pet) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-base text-center mb-4">
            {error ?? 'Pet not found'}
          </Text>
          <View className="w-full">
            <Button title="Go Back" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  const buildFoodSubtitle = (entry: { food_type?: string | null; amount_per_meal?: string | null; meals_per_day?: number | null }): string => {
    const parts: string[] = [];
    if (entry.food_type) parts.push(FOOD_TYPE_LABELS[entry.food_type] ?? entry.food_type);
    if (entry.amount_per_meal) parts.push(entry.amount_per_meal);
    if (entry.meals_per_day) parts.push(`${entry.meals_per_day}x/day`);
    return parts.join(' · ');
  };

  // Combine current food + history for the food tab
  const allFoodEntries = [
    ...(currentFood ? [currentFood] : []),
    ...foodHistory.filter((e) => e.id !== currentFood?.id),
  ];

  const renderAddCard = () => {
    switch (activeTab) {
      case 'food':
        return (
          <AddRecordCard
            label={currentFood ? 'Change food' : 'Add food'}
            onPress={() =>
              router.push(
                currentFood
                  ? `/(main)/pets/${petId}/food/add?change=true`
                  : `/(main)/pets/${petId}/food/add`,
              )
            }
          />
        );
      case 'vet-visits':
        return (
          <AddRecordCard
            label="Add vet visit"
            onPress={() => router.push(`/(main)/pets/${petId}/health/vet-visit/add`)}
          />
        );
      case 'medications':
        return (
          <AddRecordCard
            label="Add medication"
            onPress={() => router.push(`/(main)/pets/${petId}/health/medication/add`)}
          />
        );
      case 'vaccinations':
        return (
          <AddRecordCard
            label="Add vaccination"
            onPress={() => router.push(`/(main)/pets/${petId}/health/vaccination/add`)}
          />
        );
      case 'weight':
        return (
          <AddRecordCard
            label="Add weight entry"
            onPress={() => router.push(`/(main)/pets/${petId}/health/weight/add`)}
          />
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'food':
        return allFoodEntries.length === 0 ? (
          <EmptyState message={`What's ${pet.name} eating? Add their current food.`} />
        ) : (
          allFoodEntries.map((entry) => (
            <View key={entry.id} className="px-6 mb-3">
              <RecordCard
                title={entry.brand}
                subtitle={entry.product_name ?? undefined}
                detail={buildFoodSubtitle(entry) || undefined}
                date={entry.start_date}
                status={entry.end_date === null ? 'green' : 'neutral'}
                statusLabel={entry.end_date === null ? 'Current' : 'Past'}
                onPress={() => router.push(`/(main)/pets/${petId}/food/${entry.id}`)}
              />
            </View>
          ))
        );

      case 'vet-visits':
        return vetVisits.length === 0 ? (
          <EmptyState message="No vet visits recorded yet." />
        ) : (
          vetVisits.map((v) => (
            <View key={v.id} className="px-6 mb-3">
              <RecordCard
                title={v.reason || 'Vet Visit'}
                subtitle={v.clinic_name ?? undefined}
                date={v.date}
                onPress={() => router.push(`/(main)/pets/${petId}/health/vet-visit/${v.id}`)}
              />
            </View>
          ))
        );

      case 'medications':
        return medications.length === 0 ? (
          <EmptyState message="No medications recorded yet." />
        ) : (
          medications.map((m) => (
            <View key={m.id} className="px-6 mb-3">
              <RecordCard
                title={m.name}
                subtitle={m.dosage ?? undefined}
                detail={m.frequency ?? undefined}
                date={m.start_date}
                status={m.is_completed ? 'neutral' : 'green'}
                statusLabel={m.is_completed ? 'Completed' : 'Active'}
                onPress={() => router.push(`/(main)/pets/${petId}/health/medication/${m.id}`)}
              />
            </View>
          ))
        );

      case 'vaccinations':
        return vaccinations.length === 0 ? (
          <EmptyState message="No vaccinations recorded yet." />
        ) : (
          vaccinations.map((v) => {
            const status = getVaccinationStatus(v.next_due_date);
            return (
              <View key={v.id} className="px-6 mb-3">
                <RecordCard
                  title={v.vaccine_name}
                  subtitle={v.clinic_name ?? undefined}
                  date={v.date_administered}
                  status={status}
                  statusLabel={status === 'green' ? 'Up to date' : status === 'amber' ? 'Due soon' : 'Overdue'}
                  onPress={() => router.push(`/(main)/pets/${petId}/health/vaccination/${v.id}`)}
                />
              </View>
            );
          })
        );

      case 'weight':
        return weightEntries.length === 0 ? (
          <EmptyState message="No weight entries recorded yet." />
        ) : (
          weightEntries.map((w) => (
            <View key={w.id} className="px-6 mb-3">
              <RecordCard
                title={`${w.weight} kg`}
                subtitle={w.note ?? undefined}
                date={w.date}
                onPress={() => router.push(`/(main)/pets/${petId}/health/weight/${w.id}`)}
              />
            </View>
          ))
        );

      default:
        return null;
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View className="flex-1">
        <StickyHeader
          pet={pet}
          onBack={() => router.back()}
          onEdit={() => router.push(`/(main)/pets/${petId}/edit`)}
          latestWeight={weightEntries.length > 0 ? weightEntries[0].weight : null}
        />
        <TabBar tabs={TABS} activeTab={activeTab} onTabPress={setActiveTab} />
        <View className="flex-1 bg-white">
          <ScrollView
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {renderAddCard()}
            {renderTabContent()}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center py-12 px-8">
      <Text className="text-base text-text-secondary text-center">{message}</Text>
    </View>
  );
}
