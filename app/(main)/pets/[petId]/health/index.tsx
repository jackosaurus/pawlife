import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { RecordCard } from '@/components/ui/RecordCard';
import { MedicationCard } from '@/components/health/MedicationCard';
import { FAB } from '@/components/ui/FAB';
import { useVaccinations } from '@/hooks/useVaccinations';
import { useMedications, MedicationWithDoseInfo } from '@/hooks/useMedications';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { getVaccinationStatus } from '@/utils/status';
import { healthService } from '@/services/healthService';
import { Colors } from '@/constants/colors';
import { useState } from 'react';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Vaccinations', value: 'vaccinations' },
  { label: 'Medications', value: 'medications' },
  { label: 'Weight', value: 'weight' },
];

type UnifiedRecord = {
  id: string;
  type: 'vaccination' | 'medication' | 'weight';
  title: string;
  subtitle?: string;
  date: string;
  status?: 'green' | 'amber' | 'overdue' | 'neutral';
  statusLabel?: string;
  medication?: MedicationWithDoseInfo;
};

export default function HealthRecordsScreen() {
  const { petId, filter: initialFilter } = useLocalSearchParams<{ petId: string; filter?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [filter, setFilter] = useState(initialFilter ?? 'all');
  const [loggingDoseId, setLoggingDoseId] = useState<string | null>(null);

  const { vaccinations, loading: loadingVax, refresh: refreshVax } = useVaccinations(petId!);
  const { medications, loading: loadingMed, refresh: refreshMed } = useMedications(petId!);
  const { weightEntries, loading: loadingWeight, refresh: refreshWeight } = useWeightEntries(petId!);

  const loading = loadingVax || loadingMed || loadingWeight;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshVax();
      refreshMed();
      refreshWeight();
    });
    return unsubscribe;
  }, [navigation, refreshVax, refreshMed, refreshWeight]);

  const records = useMemo(() => {
    const items: UnifiedRecord[] = [];

    if (filter === 'all' || filter === 'vaccinations') {
      vaccinations.forEach((v) => {
        const status = getVaccinationStatus(v.next_due_date);
        items.push({
          id: v.id,
          type: 'vaccination',
          title: v.vaccine_name,
          subtitle: v.clinic_name ?? undefined,
          date: v.date_administered,
          status,
          statusLabel: status === 'green' ? 'Up to date' : status === 'amber' ? 'Due soon' : 'Overdue',
        });
      });
    }

    if (filter === 'all' || filter === 'medications') {
      medications.forEach((m) => {
        items.push({
          id: m.id,
          type: 'medication',
          title: m.name,
          date: m.start_date,
          medication: m,
        });
      });
    }

    if (filter === 'all' || filter === 'weight') {
      weightEntries.forEach((w) => {
        items.push({
          id: w.id,
          type: 'weight',
          title: `${w.weight} kg`,
          subtitle: w.note ?? undefined,
          date: w.date,
        });
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [filter, vaccinations, medications, weightEntries]);

  const handleRecordPress = (record: UnifiedRecord) => {
    switch (record.type) {
      case 'vaccination':
        router.push(`/(main)/pets/${petId}/health/vaccination/${record.id}`);
        break;
      case 'medication':
        router.push(`/(main)/pets/${petId}/health/medication/${record.id}`);
        break;
      case 'weight':
        router.push(`/(main)/pets/${petId}/health/weight/${record.id}`);
        break;
    }
  };

  const handleAdd = () => {
    switch (filter) {
      case 'vaccinations':
        router.push(`/(main)/pets/${petId}/health/vaccination/add`);
        break;
      case 'medications':
        router.push(`/(main)/pets/${petId}/health/medication/add`);
        break;
      case 'weight':
        router.push(`/(main)/pets/${petId}/health/weight/add`);
        break;
      default:
        router.push(`/(main)/pets/${petId}/health/vaccination/add`);
        break;
    }
  };

  const renderEmpty = () => (
    <View className="items-center py-12">
      <Ionicons name="medical-outline" size={48} color={Colors.textSecondary} />
      <Text className="text-text-secondary text-base text-center mt-3">
        No health records yet.
      </Text>
      <Pressable onPress={handleAdd} className="mt-3">
        <Text className="text-primary font-medium text-sm">
          Add first record
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
        ) : records.length > 0 ? (
          <FlatList
            data={records}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }}
            renderItem={({ item }) =>
              item.type === 'medication' && item.medication ? (
                <View className="mb-3">
                  <MedicationCard
                    medication={item.medication}
                    onPress={() => handleRecordPress(item)}
                    onLogDose={async () => {
                      setLoggingDoseId(item.id);
                      try {
                        await healthService.logMedicationDose({ medication_id: item.id });
                        refreshMed();
                      } finally {
                        setLoggingDoseId(null);
                      }
                    }}
                    logDoseLoading={loggingDoseId === item.id}
                  />
                </View>
              ) : (
                <RecordCard
                  title={item.title}
                  subtitle={item.subtitle}
                  date={item.date}
                  status={item.status}
                  statusLabel={item.statusLabel}
                  onPress={() => handleRecordPress(item)}
                />
              )
            }
          />
        ) : (
          renderEmpty()
        )}

        <FAB onPress={handleAdd} />
      </View>
    </Screen>
  );
}
