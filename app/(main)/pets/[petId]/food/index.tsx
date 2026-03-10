import { View, Text, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { CurrentFoodCard } from '@/components/pets/CurrentFoodCard';
import { RecordCard } from '@/components/ui/RecordCard';
import { FAB } from '@/components/ui/FAB';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { usePet } from '@/hooks/usePet';
import { Colors } from '@/constants/colors';
import { formatDate } from '@/utils/dates';
import { FoodEntry } from '@/types';

export default function FoodOverviewScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { pet } = usePet(petId!);
  const { currentFood, history, loading, error, refresh } = useFoodEntries(petId!);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
    });
    return unsubscribe;
  }, [navigation, refresh]);

  const pastEntries = history.filter((entry) => entry.end_date !== null);

  const handleAddFood = () => {
    if (currentFood) {
      router.push(`/pets/${petId}/food/add?change=true`);
    } else {
      router.push(`/pets/${petId}/food/add`);
    }
  };

  const handleChangeFood = () => {
    router.push(`/pets/${petId}/food/add?change=true`);
  };

  const handleFoodPress = (entry: FoodEntry) => {
    router.push(`/pets/${petId}/food/${entry.id}`);
  };

  const buildSubtitle = (entry: FoodEntry): string => {
    const parts: string[] = [];
    if (entry.product_name) parts.push(entry.product_name);
    if (entry.food_type) parts.push(entry.food_type);
    return parts.join(' - ');
  };

  const buildDateRange = (entry: FoodEntry): string => {
    const start = formatDate(entry.start_date);
    const end = entry.end_date ? formatDate(entry.end_date) : 'Current';
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-base text-center mb-4">
            {error}
          </Text>
          <View className="w-full">
            <Button title="Go Back" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1">
        <View className="px-6 pt-4 pb-2 flex-row items-center">
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors.textPrimary}
            onPress={() => router.back()}
          />
          <Text className="text-xl font-bold text-text-primary ml-3">
            {pet?.name ? `${pet.name}'s Food` : 'Food & Diet'}
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <CurrentFoodCard
            petName={pet?.name ?? 'your pet'}
            foodEntry={currentFood}
            onAddFood={handleAddFood}
            onChangeFood={currentFood ? handleChangeFood : undefined}
            onPress={
              currentFood
                ? () => handleFoodPress(currentFood)
                : undefined
            }
          />

          {pastEntries.length > 0 ? (
            <View className="mt-4">
              <Text className="text-base font-semibold text-text-primary mb-3">
                Food History
              </Text>
              {pastEntries.map((entry) => (
                <RecordCard
                  key={entry.id}
                  title={entry.brand}
                  subtitle={buildSubtitle(entry)}
                  date={entry.start_date}
                  onPress={() => handleFoodPress(entry)}
                />
              ))}
            </View>
          ) : history.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text className="text-text-secondary text-sm text-center mt-3">
                No food entries yet.{'\n'}Start tracking what {pet?.name ?? 'your pet'} eats.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <FAB onPress={handleAddFood} />
      </View>
    </Screen>
  );
}
