import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmation } from '@/components/ui/DeleteConfirmation';
import { healthService } from '@/services/healthService';
import { formatDate } from '@/utils/dates';
import { Colors } from '@/constants/colors';
import { Medication } from '@/types';

export default function MedicationDetailScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const loadMedication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getMedicationById(id!);
      setMedication(data);
    } catch {
      setError('Failed to load medication');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMedication();
  }, [loadMedication]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await healthService.deleteMedication(id);
      router.back();
    } catch {
      setError('Failed to delete medication');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!id) return;
    setCompleting(true);
    try {
      const updated = await healthService.markMedicationCompleted(id);
      setMedication(updated);
    } catch {
      setError('Failed to mark as completed');
    } finally {
      setCompleting(false);
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

  if (error || !medication) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-base text-center mb-4">
            {error ?? 'Medication not found'}
          </Text>
          <View className="w-full">
            <Button title="Go Back" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  const isActive = !medication.is_completed;

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View className="flex-row items-center justify-between mb-6">
          <Text
            className={`text-3xl font-bold flex-1 mr-3 ${
              isActive ? 'text-text-primary' : 'text-text-secondary'
            }`}
          >
            {medication.name}
          </Text>
          <StatusPill
            label={isActive ? 'Active' : 'Completed'}
            status={isActive ? 'green' : 'neutral'}
          />
        </View>

        <Card
          className={`px-5 mb-4 ${!isActive ? 'opacity-70' : ''}`}
        >
          <DetailRow label="Dosage" value={medication.dosage ?? 'Not specified'} />
          <DetailRow
            label="Frequency"
            value={medication.frequency ?? 'Not specified'}
          />
          <DetailRow
            label="Prescribing Vet"
            value={medication.prescribing_vet ?? 'Not specified'}
            isLast={!medication.notes}
          />
          {medication.notes ? (
            <DetailRow
              label="Notes"
              value={medication.notes}
              isLast
            />
          ) : null}
        </Card>

        <Text className={`text-sm font-medium text-text-secondary uppercase tracking-wide ml-1 mb-2 ${!isActive ? 'opacity-70' : ''}`}>
          Timeline
        </Text>
        <Card
          className={`px-5 mb-4 ${!isActive ? 'opacity-70' : ''}`}
        >
          <DetailRow
            label="Start Date"
            value={formatDate(medication.start_date)}
          />
          <DetailRow
            label="End Date"
            value={medication.end_date ? formatDate(medication.end_date) : 'Ongoing'}
            isLast
          />
        </Card>

        <View className="mt-4 gap-3">
          {isActive && (
            <Button
              title="Mark as Completed"
              onPress={handleMarkCompleted}
              loading={completing}
            />
          )}
          <Button
            title="Edit Medication"
            variant={isActive ? 'secondary' : undefined}
            onPress={() =>
              router.push(
                `/(main)/pets/${petId}/health/medication/${id}/edit`,
              )
            }
          />
          <Button
            title="Delete Medication"
            variant="secondary"
            onPress={() => setShowDelete(true)}
          />
        </View>

        <DeleteConfirmation
          visible={showDelete}
          title="Delete Medication"
          message="Are you sure you want to delete this medication record? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      </View>
    </Screen>
  );
}
