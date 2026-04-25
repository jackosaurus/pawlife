import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { useArchivedMedications } from '@/hooks/useArchivedMedications';
import { Colors } from '@/constants/colors';
import { formatDate } from '@/utils/dates';

export default function ArchivedMedicationsScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { data, loading, error, refresh } = useArchivedMedications(petId!);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
    });
    return unsubscribe;
  }, [navigation, refresh]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View className="px-6 pt-4 pb-2 flex-row items-center">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text className="text-xl font-bold text-text-primary">
          Archived medications
        </Text>
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
      ) : data.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-base text-center">
            No archived medications
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {data.map((med) => (
            <Card
              key={med.id}
              className="p-4 mb-3"
              onPress={() =>
                router.push(
                  `/(main)/pets/${petId}/health/medication/${med.id}`,
                )
              }
            >
              <View className="flex-row">
                <View className="flex-1 justify-center mr-3">
                  <Text
                    style={{ opacity: 0.6 }}
                    className="text-base font-semibold text-text-primary"
                    numberOfLines={1}
                  >
                    {med.name}
                  </Text>
                  <Text
                    className="text-sm text-text-secondary mt-0.5"
                    numberOfLines={1}
                  >
                    {[med.dosage, med.frequency].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View className="items-center justify-center" style={{ minWidth: 80 }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: Colors.statusNeutral,
                    }}
                  />
                  <Text
                    className="text-xs text-text-secondary mt-1 text-center"
                    numberOfLines={1}
                  >
                    {med.archived_at
                      ? `Archived ${formatDate(med.archived_at)}`
                      : 'Archived'}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
