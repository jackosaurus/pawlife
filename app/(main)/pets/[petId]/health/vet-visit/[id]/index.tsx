import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { Button } from '@/components/ui/Button';
import { DestructiveTextButton } from '@/components/ui/DestructiveTextButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { healthService } from '@/services/healthService';
import { formatDate } from '@/utils/dates';
import { Colors } from '@/constants/colors';
import { VetVisit } from '@/types';

export default function VetVisitDetailScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [vetVisit, setVetVisit] = useState<VetVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadVetVisit = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getVetVisitById(id!);
      setVetVisit(data);
    } catch {
      setError('Failed to load vet visit');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVetVisit();
  }, [loadVetVisit]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await healthService.deleteVetVisit(id);
      router.back();
    } catch {
      setError('Failed to delete vet visit');
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

  if (error || !vetVisit) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-body text-center mb-4">
            {error ?? 'Vet visit not found'}
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

        <Text className="text-largeTitle text-text-primary mb-6">
          Vet Visit
        </Text>

        <Card className="px-5 mb-4">
          <DetailRow label="Date" value={formatDate(vetVisit.date)} />
          <DetailRow
            label="Clinic"
            value={vetVisit.clinic_name ?? 'Not specified'}
          />
          <DetailRow
            label="Reason"
            value={vetVisit.reason ?? 'Not specified'}
          />
          <DetailRow
            label="Notes"
            value={vetVisit.notes ?? 'No notes'}
            isLast
          />
        </Card>

        <View className="mt-4 gap-3">
          <Button
            title="Edit"
            onPress={() =>
              router.push(
                `/(main)/pets/${petId}/health/vet-visit/${id}/edit`,
              )
            }
          />
          <DestructiveTextButton
            label="Delete"
            onPress={() => setShowDelete(true)}
            testID="delete-button"
          />
        </View>

        <ConfirmationModal
          visible={showDelete}
          title="Delete vet visit?"
          message="This will permanently remove the record from this pet's history. This can't be undone."
          confirmLabel="Delete"
          severity="destructive"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      </View>
    </Screen>
  );
}

