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
import { getIntervalLabel } from '@/constants/vaccines';
import { formatDate } from '@/utils/dates';
import { Colors } from '@/constants/colors';
import { Vaccination, VaccinationDose } from '@/types';

const STATUS_LABELS: Record<'green' | 'amber' | 'overdue', string> = {
  green: 'Up to date',
  amber: 'Due soon',
  overdue: 'Overdue',
};

export default function VaccinationDetailScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [vaccination, setVaccination] = useState<Vaccination | null>(null);
  const [doses, setDoses] = useState<VaccinationDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logging, setLogging] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vaxData, doseData] = await Promise.all([
        healthService.getVaccinationById(id!),
        healthService.getVaccinationDoses(id!),
      ]);
      setVaccination(vaxData);
      setDoses(doseData);
    } catch {
      setError('Failed to load vaccination');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleLog = async () => {
    if (!vaccination || logging) return;
    setLogging(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await healthService.logVaccinationDose(
        {
          vaccination_id: vaccination.id,
          date_administered: today,
          clinic_name: vaccination.clinic_name,
        },
        vaccination.interval_months ?? 12,
      );
      await loadData();
    } catch {
      setError('Failed to log vaccination');
    } finally {
      setLogging(false);
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
  const showLogButton = status !== 'green' || !vaccination.date_administered;

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
          <DetailRow
            label="Schedule"
            value={getIntervalLabel(vaccination.interval_months)}
          />
          <DetailRow
            label="Last Administered"
            value={vaccination.date_administered ? formatDate(vaccination.date_administered) : 'Not yet given'}
          />
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

        {/* Dose History */}
        {doses.length > 0 && (
          <>
            <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-1">
              Dose History
            </Text>
            <Card className="px-5 mb-4">
              {doses.map((dose, index) => (
                <DetailRow
                  key={dose.id}
                  label={formatDate(dose.date_administered)}
                  value={dose.clinic_name ?? ''}
                  isLast={index === doses.length - 1}
                />
              ))}
            </Card>
          </>
        )}

        <View className="mt-4 gap-3">
          {showLogButton && (
            <Button
              title={logging ? 'Logging...' : 'Log Vaccination'}
              onPress={handleLog}
              loading={logging}
            />
          )}
          <Button
            title="Edit"
            variant={showLogButton ? 'secondary' : undefined}
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
