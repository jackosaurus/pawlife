import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { RecordCard } from '@/components/ui/RecordCard';
import { FAB } from '@/components/ui/FAB';
import { useVaccinations } from '@/hooks/useVaccinations';
import { getVaccinationStatus } from '@/utils/status';
import { Colors } from '@/constants/colors';
import { useState } from 'react';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Vet Visits', value: 'vet-visits' },
  { label: 'Vaccinations', value: 'vaccinations' },
  { label: 'Medications', value: 'medications' },
  { label: 'Weight', value: 'weight' },
];

const STATUS_LABELS: Record<'green' | 'amber' | 'overdue', string> = {
  green: 'Up to date',
  amber: 'Due soon',
  overdue: 'Overdue',
};

export default function HealthRecordsScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [filter, setFilter] = useState('all');
  const { vaccinations, loading, error, refresh } = useVaccinations(petId!);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
    });
    return unsubscribe;
  }, [navigation, refresh]);

  const handleAddVaccination = () => {
    router.push(`/(main)/pets/${petId}/health/vaccination/add`);
  };

  const showVaccinations = filter === 'all' || filter === 'vaccinations';

  const renderEmpty = () => (
    <View className="items-center py-12">
      <Ionicons name="medical-outline" size={48} color={Colors.textSecondary} />
      <Text className="text-text-secondary text-base text-center mt-3">
        No health records yet.
      </Text>
      <Pressable onPress={handleAddVaccination} className="mt-3">
        <Text className="text-primary font-medium text-sm">
          Add first vaccination
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Screen>
      <View className="flex-1">
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center mb-4">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={Colors.textPrimary}
              />
            </Pressable>
            <Text className="text-2xl font-bold text-text-primary ml-3">
              Health Records
            </Text>
          </View>
          <SegmentedFilter
            options={FILTER_OPTIONS}
            selected={filter}
            onSelect={setFilter}
          />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-text-secondary text-base text-center">
              {error}
            </Text>
          </View>
        ) : showVaccinations && vaccinations.length > 0 ? (
          <FlatList
            data={vaccinations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }}
            renderItem={({ item }) => {
              const status = getVaccinationStatus(item.next_due_date);
              return (
                <RecordCard
                  title={item.vaccine_name}
                  subtitle={item.clinic_name ?? undefined}
                  date={item.date_administered}
                  status={status}
                  statusLabel={STATUS_LABELS[status]}
                  onPress={() =>
                    router.push(
                      `/(main)/pets/${petId}/health/vaccination/${item.id}`,
                    )
                  }
                />
              );
            }}
          />
        ) : (
          renderEmpty()
        )}

        <FAB onPress={handleAddVaccination} />
      </View>
    </Screen>
  );
}
