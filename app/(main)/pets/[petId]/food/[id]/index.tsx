import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { foodService } from '@/services/foodService';
import { Colors } from '@/constants/colors';
import { formatDate } from '@/utils/dates';
import { FoodEntry } from '@/types';

const FOOD_TYPE_LABELS: Record<string, string> = {
  dry: 'Dry',
  wet: 'Wet',
  raw: 'Raw',
  mixed: 'Mixed',
};

export default function FoodDetailScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await foodService.getById(id!);
      setEntry(data);
    } catch {
      setError('Failed to load food entry');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadEntry();
    });
    return unsubscribe;
  }, [navigation, loadEntry]);

  const isCurrent = entry && !entry.end_date;

  const handleEdit = () => {
    router.push(`/pets/${petId}/food/${id}/edit`);
  };

  const handleChangeFood = () => {
    router.push(`/pets/${petId}/food/add?change=true`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Food Entry',
      'Are you sure you want to delete this food entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await foodService.delete(id!);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete food entry');
            }
          },
        },
      ],
    );
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

  if (error || !entry) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-base text-center mb-4">
            {error ?? 'Food entry not found'}
          </Text>
          <View className="w-full">
            <Button title="Go Back" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <View className="flex-row items-center mb-6">
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors.textPrimary}
            onPress={() => router.back()}
          />
          <Text className="text-xl font-bold text-text-primary ml-3">
            Food Details
          </Text>
        </View>

        {isCurrent && (
          <View className="bg-primary/10 rounded-xl px-4 py-2 mb-4 self-start">
            <Text className="text-primary font-medium text-sm">
              Current Food
            </Text>
          </View>
        )}

        <Card className="p-5 mb-4">
          <DetailRow label="Brand" value={entry.brand} />
          {entry.product_name ? (
            <DetailRow label="Product Name" value={entry.product_name} />
          ) : null}
          {entry.food_type ? (
            <DetailRow
              label="Food Type"
              value={FOOD_TYPE_LABELS[entry.food_type] ?? entry.food_type}
            />
          ) : null}
          {entry.amount_per_meal ? (
            <DetailRow label="Amount Per Meal" value={entry.amount_per_meal} />
          ) : null}
          {entry.meals_per_day ? (
            <DetailRow
              label="Meals Per Day"
              value={String(entry.meals_per_day)}
            />
          ) : null}
          <DetailRow label="Started" value={formatDate(entry.start_date)} />
          <DetailRow
            label="Ended"
            value={entry.end_date ? formatDate(entry.end_date) : 'Current'}
          />
          {entry.reason_for_change ? (
            <DetailRow
              label="Reason for Change"
              value={entry.reason_for_change}
            />
          ) : null}
          {entry.notes ? (
            <DetailRow label="Notes" value={entry.notes} />
          ) : null}
        </Card>

        <View className="gap-3 mt-4">
          {isCurrent ? (
            <Button
              title="Change Food"
              onPress={handleChangeFood}
            />
          ) : null}
          <Button
            title="Edit"
            variant="secondary"
            onPress={handleEdit}
          />
          <Button
            title="Delete"
            variant="text"
            onPress={handleDelete}
          />
        </View>
      </View>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="text-xs text-text-secondary mb-0.5">{label}</Text>
      <Text className="text-base text-text-primary">{value}</Text>
    </View>
  );
}
