import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, ImageSourcePropType } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { RecordCard } from '@/components/ui/RecordCard';
import { MedicationCard } from '@/components/health/MedicationCard';
import { VaccinationCard } from '@/components/health/VaccinationCard';
import { StickyHeader } from '@/components/pets/StickyHeader';
import { TabBar, Tab } from '@/components/pets/TabBar';
import { AddRecordCard } from '@/components/pets/AddRecordCard';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { usePet } from '@/hooks/usePet';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useVaccinations } from '@/hooks/useVaccinations';
import { useMedications } from '@/hooks/useMedications';
import { useArchivedMedications } from '@/hooks/useArchivedMedications';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { healthService } from '@/services/healthService';
import { Colors } from '@/constants/colors';

const emptyFood = require('@/assets/illustrations/empty-food.png');
const emptyMedications = require('@/assets/illustrations/empty-medications.png');
const emptyVaccinations = require('@/assets/illustrations/empty-vaccinations.png');
const emptyWeight = require('@/assets/illustrations/empty-weight.png');

const TABS: Tab[] = [
  { key: 'medications', label: 'Medicines' },
  { key: 'vaccinations', label: 'Vaccinations' },
  { key: 'food', label: 'Food' },
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
  const [activeTab, setActiveTab] = useState('medications');
  const [loggingDoseId, setLoggingDoseId] = useState<string | null>(null);
  const { pet, loading, error, refresh } = usePet(petId!);
  const { currentFood, history: foodHistory, refresh: refreshFood } = useFoodEntries(petId!);
  const { vaccinations, refresh: refreshVaccinations } = useVaccinations(petId!);
  const { medications, refresh: refreshMedications } = useMedications(petId!);
  const { data: archivedMeds, refresh: refreshArchivedMeds } = useArchivedMedications(petId!);
  const { weightEntries, refresh: refreshWeight } = useWeightEntries(petId!);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
      refreshFood();
      refreshVaccinations();
      refreshMedications();
      refreshArchivedMeds();
      refreshWeight();
    });
    return unsubscribe;
  }, [navigation, refresh, refreshFood, refreshVaccinations, refreshMedications, refreshArchivedMeds, refreshWeight]);

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
      case 'medications':
        return medications.length === 0 && archivedMeds.length === 0 ? (
          <EmptyState message="No medications recorded yet." illustration={emptyMedications} />
        ) : (
          <>
            {medications.map((m) => (
              <View key={m.id} className="px-6 mb-3">
                <MedicationCard
                  medication={m}
                  onPress={() => router.push(`/(main)/pets/${petId}/health/medication/${m.id}`)}
                  onLogDose={async () => {
                    setLoggingDoseId(m.id);
                    try {
                      await healthService.logMedicationDose({ medication_id: m.id });
                      refreshMedications();
                    } finally {
                      setLoggingDoseId(null);
                    }
                  }}
                  logDoseLoading={loggingDoseId === m.id}
                  onArchive={async () => {
                    try {
                      await healthService.archiveMedication(m.id);
                      await Promise.all([refreshMedications(), refreshArchivedMeds()]);
                    } catch {
                      // Silent failure; UI will reflect on next refresh
                    }
                  }}
                />
              </View>
            ))}
            {archivedMeds.length > 0 ? (
              <View className="px-6 mb-3">
                <Card
                  className="px-4 py-3"
                  onPress={() =>
                    router.push(`/(main)/pets/${petId}/health/medication/archived`)
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base text-text-primary">
                      Archived medications
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-sm text-text-secondary mr-2">
                        {archivedMeds.length}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={Colors.textSecondary}
                      />
                    </View>
                  </View>
                </Card>
              </View>
            ) : null}
          </>
        );

      case 'vaccinations':
        return vaccinations.length === 0 ? (
          <EmptyState message="No vaccinations recorded yet." illustration={emptyVaccinations} />
        ) : (
          vaccinations.map((v) => (
            <View key={v.id} className="px-6">
              <VaccinationCard
                vaccination={v}
                onPress={() => router.push(`/(main)/pets/${petId}/health/vaccination/${v.id}`)}
                onLog={async () => {
                  setLoggingDoseId(v.id);
                  try {
                    const today = new Date().toISOString().split('T')[0];
                    await healthService.logVaccinationDose(
                      { vaccination_id: v.id, date_administered: today },
                      v.interval_months ?? 12,
                    );
                    refreshVaccinations();
                  } finally {
                    setLoggingDoseId(null);
                  }
                }}
                logLoading={loggingDoseId === v.id}
              />
            </View>
          ))
        );

      case 'food':
        return allFoodEntries.length === 0 ? (
          <EmptyState message={`What's ${pet.name} eating? Add their current food.`} illustration={emptyFood} />
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

      case 'weight':
        return weightEntries.length === 0 ? (
          <EmptyState message="No weight entries recorded yet." illustration={emptyWeight} />
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

function EmptyState({ message, illustration }: { message: string; illustration?: ImageSourcePropType }) {
  return (
    <View className="items-center py-12 px-8">
      {illustration && (
        <Image
          source={illustration}
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
      )}
      <Text className="text-base text-text-secondary text-center mt-4">{message}</Text>
    </View>
  );
}
