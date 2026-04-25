import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { DetailRow } from '@/components/ui/DetailRow';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmation } from '@/components/ui/DeleteConfirmation';
import { healthService } from '@/services/healthService';
import { useMedicationDoses } from '@/hooks/useMedicationDoses';
import { isRecurringFrequency, getDosesPerDay } from '@/constants/frequencies';
import { getRecurringMedicationStatus, getOneOffMedicationStatus } from '@/utils/status';
import { formatDate, formatDateTime } from '@/utils/dates';
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
  const [loggingDose, setLoggingDose] = useState(false);
  const [deletingDoseId, setDeletingDoseId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const isRecurring = isRecurringFrequency(medication?.frequency);
  const { doses, refresh: refreshDoses } = useMedicationDoses(id!);

  // Check if med is finished (past end date)
  const isFinished = (() => {
    if (!medication?.end_date) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const [y, m, d] = medication.end_date.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    end.setHours(0, 0, 0, 0);
    return end.getTime() < now.getTime();
  })();

  const isArchived = medication?.is_archived === true;

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

  const handleDeleteDose = async (doseId: string) => {
    setDeletingDoseId(doseId);
    try {
      await healthService.deleteMedicationDose(doseId);
      await refreshDoses();
    } catch {
      setError('Failed to delete dose');
    } finally {
      setDeletingDoseId(null);
    }
  };

  const handleLogDose = async () => {
    if (!id) return;
    setLoggingDose(true);
    try {
      await healthService.logMedicationDose({ medication_id: id });
      await refreshDoses();
    } catch {
      setError('Failed to log dose');
    } finally {
      setLoggingDose(false);
    }
  };

  const performArchive = async () => {
    if (!id) return;
    setArchiving(true);
    try {
      await healthService.archiveMedication(id);
      await loadMedication();
    } catch {
      setError('Failed to archive medication');
    } finally {
      setArchiving(false);
    }
  };

  const performRestore = async () => {
    if (!id) return;
    setArchiving(true);
    try {
      await healthService.restoreMedication(id);
      await loadMedication();
    } catch {
      setError('Failed to restore medication');
    } finally {
      setArchiving(false);
    }
  };

  const handleArchivePress = () => {
    if (!medication) return;
    Alert.alert(
      'Archive medication?',
      `Archive ${medication.name}? It'll move out of active medications. You can restore it anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', onPress: performArchive },
      ],
    );
  };

  const handleRestorePress = () => {
    if (!medication) return;
    Alert.alert(
      'Restore medication?',
      `Restore ${medication.name}? It'll move back to active medications.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: performRestore },
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

  // Compute status
  const latestDoseDate = doses.length > 0 ? doses[0].given_at : null;
  const dosesPerDay = getDosesPerDay(medication.frequency);

  // Count today's doses
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayDoseCount = doses.filter(
    (d) => new Date(d.given_at).getTime() >= startOfToday.getTime(),
  ).length;

  const liveStatus = isRecurring
    ? getRecurringMedicationStatus(latestDoseDate, medication.frequency!, todayDoseCount, dosesPerDay)
    : getOneOffMedicationStatus(medication.end_date);

  const statusForPill: 'green' | 'amber' | 'overdue' | 'neutral' = isArchived
    ? 'neutral'
    : liveStatus;

  const statusLabel = isArchived
    ? 'Archived'
    : isRecurring
      ? (dosesPerDay != null && dosesPerDay > 1 && liveStatus === 'amber'
          ? `${todayDoseCount}/${dosesPerDay} today`
          : liveStatus === 'green' ? 'Up to date' : liveStatus === 'amber' ? 'Due soon' : liveStatus === 'overdue' ? 'Overdue' : 'New')
      : (liveStatus === 'green' ? 'Current' : 'Finished med');

  const showLogDoseButton = !isArchived && !isFinished;

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-3xl font-bold text-text-primary flex-1 mr-3">
            {medication.name}
          </Text>
          <StatusPill label={statusLabel} status={statusForPill} />
        </View>

        {isArchived && medication.archived_at ? (
          <Text className="text-text-secondary text-sm mb-4">
            Archived {formatDate(medication.archived_at)}
          </Text>
        ) : (
          <View className="mb-4" />
        )}

        <Card className="px-5 mb-4">
          <DetailRow label="Dosage" value={medication.dosage ?? 'Not specified'} />
          <DetailRow
            label="Frequency"
            value={medication.frequency ?? 'Not specified'}
            isLast={!medication.notes}
          />
          {medication.notes ? (
            <DetailRow label="Notes" value={medication.notes} isLast />
          ) : null}
        </Card>

        <Text className="text-sm font-medium text-text-secondary uppercase tracking-wide ml-1 mb-2">
          Timeline
        </Text>
        <Card className="px-5 mb-4">
          <DetailRow
            label="Start Date"
            value={formatDate(medication.start_date)}
            isLast={!medication.end_date}
          />
          {medication.end_date ? (
            <DetailRow
              label="End Date"
              value={formatDate(medication.end_date)}
              isLast
            />
          ) : null}
        </Card>

        {doses.length > 0 ? (
          <>
            <Text className="text-sm font-medium text-text-secondary uppercase tracking-wide ml-1 mb-2">
              Dose History
            </Text>
            <Card className="px-5 mb-4">
              {doses.map((dose, idx) => (
                <View
                  key={dose.id}
                  className={`flex-row items-center justify-between py-3.5 ${
                    idx === doses.length - 1 ? '' : 'border-b border-border'
                  }`}
                >
                  <Text className="text-base text-text-primary flex-1 mr-3">
                    {formatDateTime(dose.given_at)}
                  </Text>
                  <Pressable
                    onPress={() => handleDeleteDose(dose.id)}
                    disabled={deletingDoseId === dose.id}
                    hitSlop={8}
                    testID={`delete-dose-${dose.id}`}
                  >
                    {deletingDoseId === dose.id ? (
                      <ActivityIndicator size="small" color={Colors.statusOverdue} />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                    )}
                  </Pressable>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <View className="mt-4 gap-3">
          {isArchived ? (
            <>
              <Button
                title="Restore"
                onPress={handleRestorePress}
                loading={archiving}
              />
              <Button
                title="Edit"
                variant="secondary"
                onPress={() =>
                  router.push(
                    `/(main)/pets/${petId}/health/medication/${id}/edit`,
                  )
                }
              />
              <Pressable
                onPress={() => setShowDelete(true)}
                hitSlop={8}
                className="items-center py-2"
                testID="delete-link"
              >
                <Text className="text-sm text-text-secondary">Delete</Text>
              </Pressable>
            </>
          ) : (
            <>
              {showLogDoseButton ? (
                <Button
                  title="Log Dose"
                  onPress={handleLogDose}
                  loading={loggingDose}
                />
              ) : null}
              <Button
                title="Edit"
                variant={showLogDoseButton ? 'secondary' : undefined}
                onPress={() =>
                  router.push(
                    `/(main)/pets/${petId}/health/medication/${id}/edit`,
                  )
                }
              />
              <Button
                title="Archive"
                variant="secondary"
                onPress={handleArchivePress}
                loading={archiving}
              />
              <Pressable
                onPress={() => setShowDelete(true)}
                hitSlop={8}
                className="items-center py-2"
                testID="delete-link"
              >
                <Text className="text-sm text-text-secondary">Delete</Text>
              </Pressable>
            </>
          )}
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
