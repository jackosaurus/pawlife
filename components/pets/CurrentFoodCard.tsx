import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { FoodEntry } from '@/types';

const FOOD_TYPE_LABELS: Record<string, string> = {
  dry: 'Dry',
  wet: 'Wet',
  raw: 'Raw',
  mixed: 'Mixed',
};

interface CurrentFoodCardProps {
  petName: string;
  foodEntry?: FoodEntry | null;
  onAddFood?: () => void;
  onChangeFood?: () => void;
  onPress?: () => void;
}

export function CurrentFoodCard({
  petName,
  foodEntry,
  onAddFood,
  onChangeFood,
  onPress,
}: CurrentFoodCardProps) {
  if (!foodEntry) {
    return (
      <Card className="p-5 mb-4" onPress={onPress}>
        <View className="flex-row items-center mb-3">
          <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
          <Text className="text-base font-semibold text-text-primary ml-2">
            Current Food
          </Text>
        </View>
        <View className="items-center py-4">
          <Ionicons name="restaurant-outline" size={36} color={Colors.textSecondary} />
          <Text className="text-text-secondary text-sm text-center mt-2">
            What's {petName} eating?{'\n'}Add their current food.
          </Text>
          {onAddFood && (
            <Pressable onPress={onAddFood} className="mt-3" testID="add-food">
              <Text className="text-primary font-medium text-sm">
                Add food
              </Text>
            </Pressable>
          )}
        </View>
      </Card>
    );
  }

  const details: string[] = [];
  if (foodEntry.food_type) {
    details.push(FOOD_TYPE_LABELS[foodEntry.food_type] ?? foodEntry.food_type);
  }
  if (foodEntry.amount_per_meal) {
    details.push(foodEntry.amount_per_meal);
  }
  if (foodEntry.meals_per_day) {
    details.push(
      `${foodEntry.meals_per_day}x/day`,
    );
  }

  return (
    <Card className="mb-4 overflow-hidden" onPress={onPress}>
      <View
        className="flex-row"
        style={{ borderLeftWidth: 4, borderLeftColor: Colors.primary }}
      >
        <View className="flex-1 p-5">
          <View className="flex-row items-center mb-3">
            <Ionicons
              name="restaurant-outline"
              size={20}
              color={Colors.primary}
            />
            <Text className="text-base font-semibold text-text-primary ml-2">
              Current Food
            </Text>
          </View>

          <Text
            className="text-base font-semibold text-text-primary"
            testID="food-brand"
          >
            {foodEntry.brand}
          </Text>
          {foodEntry.product_name ? (
            <Text className="text-sm text-text-secondary mt-0.5">
              {foodEntry.product_name}
            </Text>
          ) : null}

          {details.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {details.map((detail) => (
                <View
                  key={detail}
                  className="bg-primary/10 rounded-full px-3 py-1"
                >
                  <Text className="text-xs font-medium text-primary">
                    {detail}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {onChangeFood && (
            <Pressable
              onPress={onChangeFood}
              className="mt-3"
              testID="change-food"
            >
              <Text className="text-primary font-medium text-sm">
                Change food
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Card>
  );
}
