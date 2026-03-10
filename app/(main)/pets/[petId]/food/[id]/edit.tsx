import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { addFoodSchema, AddFoodFormData } from '@/types/food';
import { foodService } from '@/services/foodService';
import { Colors } from '@/constants/colors';
import { FoodEntry } from '@/types';

const FOOD_TYPE_OPTIONS = [
  { label: 'Dry', value: 'dry' },
  { label: 'Wet', value: 'wet' },
  { label: 'Raw', value: 'raw' },
  { label: 'Mixed', value: 'mixed' },
];

export default function EditFoodScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddFoodFormData>({
    resolver: zodResolver(addFoodSchema),
    defaultValues: {
      brand: '',
      productName: null,
      foodType: null,
      amountPerMeal: null,
      mealsPerDay: null,
      notes: null,
    },
  });

  const loadEntry = useCallback(async () => {
    try {
      setLoading(true);
      const data = await foodService.getById(id!);
      setEntry(data);
      reset({
        brand: data.brand,
        productName: data.product_name,
        foodType: data.food_type,
        amountPerMeal: data.amount_per_meal,
        mealsPerDay: data.meals_per_day,
        notes: data.notes,
      });
    } catch {
      setServerError('Failed to load food entry');
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const onSubmit = async (data: AddFoodFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      await foodService.update(id!, {
        brand: data.brand,
        product_name: data.productName ?? null,
        food_type: data.foodType ?? null,
        amount_per_meal: data.amountPerMeal ?? null,
        meals_per_day: data.mealsPerDay ?? null,
        notes: data.notes ?? null,
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update food entry';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-3xl font-bold text-text-primary mb-6">
          Edit Food
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{serverError}</Text>
          </View>
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
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
