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
import { getVaccinationStatus } from '@/utils/status';
import { formatDate } from '@/utils/dates';
import { Colors } from '@/constants/colors';
import { Vaccination } from '@/types';

const STATUS_LABELS: Record<'green' | 'amber' | 'overdue', string> = {
  green: 'Up to date',
  amber: 'Due soon',
  overdue: 'Overdue',
};

export default function VaccinationDetailScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [vaccination, setVaccination] = useState<Vaccination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadVaccination = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getVaccinationById(id!);
      setVaccination(data);
    } catch {
      setError('Failed to load vaccination');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVaccination();
  }, [loadVaccination]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await healthService.deleteVaccination(id);
      router.back();
    } catch {
      setError('Failed to delete vaccination');
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

  if (error || !vaccination) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-base text-center mb-4">
            {error ?? 'Vaccination not found'}
          </Text>
          <View className="w-full">
            <Button title="Go Back" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  const status = getVaccinationStatus(vaccination.next_due_date);

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-3xl font-bold text-text-primary flex-1 mr-3">
            {vaccination.vaccine_name}
          </Text>
          <StatusPill label={STATUS_LABELS[status]} status={status} />
        </View>

        <Card className="px-5 mb-4">
          <DetailRow label="Date Administered" value={formatDate(vaccination.date_administered)} />
          <DetailRow
            label="Next Due Date"
            value={vaccination.next_due_date ? formatDate(vaccination.next_due_date) : 'Not set'}
          />
          <DetailRow
            label="Clinic"
            value={vaccination.clinic_name ?? 'Not specified'}
            isLast
          />
        </Card>

        <View className="mt-4 gap-3">
          <Button
            title="Edit"
            onPress={() =>
              router.push(
                `/(main)/pets/${petId}/health/vaccination/${id}/edit`,
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
          title="Delete Vaccination"
          message="Are you sure you want to delete this vaccination record? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      </View>
    </Screen>
  );
}
