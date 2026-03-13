import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RecordCard } from '@/components/ui/RecordCard';
import { FAB } from '@/components/ui/FAB';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { usePet } from '@/hooks/usePet';
import { Colors } from '@/constants/colors';
import { formatDate } from '@/utils/dates';
import { FoodEntry } from '@/types';

const FOOD_TYPE_LABELS: Record<string, string> = {
  dry: 'Dry',
  wet: 'Wet',
  raw: 'Raw',
  mixed: 'Mixed',
};

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

  const handleFoodPress = (entry: FoodEntry) => {
    router.push(`/pets/${petId}/food/${entry.id}`);
  };

  const buildSubtitle = (entry: FoodEntry): string => {
    const parts: string[] = [];
    if (entry.product_name) parts.push(entry.product_name);
    if (entry.food_type) parts.push(entry.food_type);
    return parts.join(' - ');
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

  // Build current food detail string
  const foodDetails: string[] = [];
  if (currentFood) {
    if (currentFood.food_type) {
      foodDetails.push(FOOD_TYPE_LABELS[currentFood.food_type] ?? currentFood.food_type);
    }
    if (currentFood.amount_per_meal) {
      foodDetails.push(currentFood.amount_per_meal);
    }
    if (currentFood.meals_per_day) {
      foodDetails.push(`${currentFood.meals_per_day}x/day`);
    }
  }

  return (
    <Screen>
      <View className="flex-1">
        <View className="px-6 pt-4 pb-2 flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={Colors.textPrimary}
            />
          </Pressable>
          <Text className="text-xl font-bold text-text-primary ml-3">
            {pet?.name ? `${pet.name}'s Food` : 'Food & Diet'}
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Food */}
          {currentFood ? (
            <Card
              className="p-5 mb-6"
              onPress={() => handleFoodPress(currentFood)}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-text-primary">
                  Current Food
                </Text>
                <Pressable
                  onPress={() => router.push(`/pets/${petId}/food/add?change=true`)}
                  hitSlop={8}
                >
                  <Text className="text-sm font-medium text-primary">
                    Change
                  </Text>
                </Pressable>
              </View>
              <Text className="text-base font-medium text-text-primary">
                {currentFood.brand}
              </Text>
              {currentFood.product_name ? (
                <Text className="text-sm text-text-secondary mt-0.5">
                  {currentFood.product_name}
                </Text>
              ) : null}
              {foodDetails.length > 0 ? (
                <Text className="text-sm text-text-secondary mt-1">
                  {foodDetails.join(' · ')}
                </Text>
              ) : null}
            </Card>
          ) : (
            <View className="items-center py-8">
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text className="text-text-secondary text-sm text-center mt-3">
                What's {pet?.name ?? 'your pet'} eating?
              </Text>
              <Pressable onPress={handleAddFood} className="mt-3">
                <Text className="text-primary font-medium text-sm">
                  Add food
                </Text>
              </Pressable>
            </View>
          )}

          {/* Food History */}
          {pastEntries.length > 0 ? (
            <View>
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
          ) : null}
        </ScrollView>

        <FAB onPress={handleAddFood} />
      </View>
    </Screen>
  );
}
