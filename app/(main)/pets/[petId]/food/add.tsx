import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card } from '@/components/ui/Card';
import {
  changeFoodSchema,
  ChangeFoodFormData,
} from '@/types/food';
import { foodService } from '@/services/foodService';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { Colors } from '@/constants/colors';

const FOOD_TYPE_OPTIONS = [
  { label: 'Dry', value: 'dry' },
  { label: 'Wet', value: 'wet' },
  { label: 'Raw', value: 'raw' },
  { label: 'Mixed', value: 'mixed' },
];

export default function AddFoodScreen() {
  const { petId, change } = useLocalSearchParams<{
    petId: string;
    change?: string;
  }>();
  const router = useRouter();
  const isChange = change === 'true';
  const { currentFood } = useFoodEntries(petId!);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangeFoodFormData>({
    resolver: zodResolver(changeFoodSchema),
    defaultValues: {
      brand: '',
      productName: null,
      foodType: null,
      amountPerMeal: null,
      mealsPerDay: null,
      notes: null,
      reasonForChange: null,
    },
  });

  const onSubmit = async (data: ChangeFoodFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const foodData = {
        pet_id: petId!,
        brand: data.brand,
        product_name: data.productName ?? null,
        food_type: data.foodType ?? null,
        amount_per_meal: data.amountPerMeal ?? null,
        meals_per_day: data.mealsPerDay ?? null,
        start_date: today,
        notes: data.notes ?? null,
      };

      if (isChange && currentFood) {
        await foodService.changeFood(
          petId!,
          foodData,
          data.reasonForChange ?? undefined,
        );
      } else {
        await foodService.create(foodData);
      }

      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save food entry';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-3xl font-bold text-text-primary mb-6">
          {isChange ? 'Change Food' : 'Add Food'}
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{serverError}</Text>
          </View>
        )}

        {isChange && currentFood && (
          <Card className="p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Colors.primary}
              />
              <Text className="text-sm font-medium text-primary ml-2">
                Changing from current food
              </Text>
            </View>
            <Text className="text-sm text-text-secondary">
              {currentFood.brand}
              {currentFood.product_name
                ? ` - ${currentFood.product_name}`
                : ''}{' '}
              will be archived with today's date as the end date.
            </Text>
          </Card>
        )}

        {/* Brand */}
        <Controller
          control={control}
          name="brand"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Brand"
              placeholder="e.g. Blue Buffalo, Royal Canin"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.brand?.message}
            />
          )}
        />

        {/* Product Name */}
        <Controller
          control={control}
          name="productName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Product Name"
              placeholder="e.g. Life Protection Formula (optional)"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
            />
          )}
        />

        {/* Food Type */}
        <Text className="text-text-secondary text-sm mb-2 ml-1">
          Food Type
        </Text>
        <Controller
          control={control}
          name="foodType"
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <SegmentedControl
                options={FOOD_TYPE_OPTIONS}
                selected={value ?? ''}
                onSelect={(val) =>
                  onChange(val === value ? null : val)
                }
              />
            </View>
          )}
        />

        {/* Amount Per Meal */}
        <Controller
          control={control}
          name="amountPerMeal"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Amount Per Meal"
              placeholder="e.g. 1 cup, 200g (optional)"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
            />
          )}
        />

        {/* Meals Per Day */}
        <Controller
          control={control}
          name="mealsPerDay"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Meals Per Day"
              placeholder="e.g. 2 (optional)"
              keyboardType="number-pad"
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                onChange(isNaN(num) ? null : num);
              }}
              onBlur={onBlur}
              value={value != null ? String(value) : ''}
              error={errors.mealsPerDay?.message}
            />
          )}
        />

        {/* Reason for Change (only shown for food changes) */}
        {isChange && (
          <Controller
            control={control}
            name="reasonForChange"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Reason for Change"
                placeholder="e.g. Allergies, vet recommended (optional)"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
              />
            )}
          />
        )}

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Notes"
              placeholder="Any additional notes (optional)"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ''}
              multiline
              numberOfLines={3}
            />
          )}
        />

        <View className="mt-6">
          <Button
            title={isChange ? 'Change Food' : 'Add Food'}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
