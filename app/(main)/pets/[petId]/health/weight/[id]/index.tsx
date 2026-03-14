import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmation } from '@/components/ui/DeleteConfirmation';
import { healthService } from '@/services/healthService';
import { formatDate } from '@/utils/dates';
import { Colors } from '@/constants/colors';
import { WeightEntry } from '@/types';

export default function WeightEntryDetailScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<WeightEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEntry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getWeightEntryById(id!);
      setEntry(data);
    } catch {
      setError('Failed to load weight entry');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await healthService.deleteWeightEntry(id);
      router.back();
    } catch {
      setError('Failed to delete weight entry');
    } finally {
      setDeleting(false);
      setShowDelete(false);
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

  if (error || !entry) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-base text-center mb-4">
            {error ?? 'Weight entry not found'}
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
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-3xl font-bold text-text-primary mb-6">
          Weight Entry
        </Text>

        <Card className="px-5 mb-4">
          <DetailRow label="Weight" value={`${entry.weight} kg`} />
          <DetailRow label="Date" value={formatDate(entry.date)} />
          <DetailRow
            label="Note"
            value={entry.note ?? 'No note'}
            isLast
          />
        </Card>

        <View className="mt-4 gap-3">
          <Button
            title="Edit"
            onPress={() =>
              router.push(
                `/(main)/pets/${petId}/health/weight/${id}/edit`,
              )
            }
          />
          <Button
            title="Delete"
            variant="secondary"
            onPress={() => setShowDelete(true)}
          />
        </View>

        <DeleteConfirmation
          visible={showDelete}
          title="Delete Weight Entry"
          message="Are you sure you want to delete this weight entry? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      </View>
    </Screen>
  );
}
