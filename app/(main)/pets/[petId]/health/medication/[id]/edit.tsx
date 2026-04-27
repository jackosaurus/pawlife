import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput } from '@/components/ui/DateInput';
import { Button } from '@/components/ui/Button';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import {
  addMedicationSchema,
  AddMedicationFormData,
} from '@/types/medication';
import { healthService } from '@/services/healthService';
import { MEDICATION_FREQUENCIES } from '@/constants/frequencies';
import { Colors } from '@/constants/colors';

export default function EditMedicationScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isOngoing, setIsOngoing] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddMedicationFormData>({
    resolver: zodResolver(addMedicationSchema),
    defaultValues: {
      name: '',
      dosage: null,
      frequency: null as unknown as string,
      startDate: '',
      endDate: null,
      notes: null,
    },
  });

  const loadMedication = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthService.getMedicationById(id!);
      setIsOngoing(!data.end_date);
      reset({
        name: data.name,
        dosage: data.dosage ?? null,
        frequency: data.frequency ?? (null as unknown as string),
        startDate: data.start_date,
        endDate: data.end_date ?? null,
        notes: data.notes ?? null,
      });
    } catch {
      setServerError('Failed to load medication');
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadMedication();
  }, [loadMedication]);

  const handleOngoingToggle = (value: boolean) => {
    setIsOngoing(value);
    if (value) {
      setValue('endDate', null);
    }
  };

  const onSubmit = async (data: AddMedicationFormData) => {
    if (!id) return;
    setSubmitting(true);
    setServerError(null);

    try {
      await healthService.updateMedication(id, {
        name: data.name,
        dosage: data.dosage || null,
        frequency: data.frequency,
        start_date: data.startDate,
        end_date: isOngoing ? null : (data.endDate || null),
        notes: data.notes || null,
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update medication';
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

        <Text className="text-largeTitle text-text-primary mb-6">
          Edit Medication
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-footnote">{serverError}</Text>
          </View>
        )}

        <Card className="px-5 pt-4 mb-4">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Medication Name"
                placeholder="e.g. Apoquel, Heartgard..."
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="dosage"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Dosage"
                placeholder="e.g. 16mg, 1 tablet..."
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
              />
            )}
          />

          <Controller
            control={control}
            name="frequency"
            render={({ field: { onChange, value } }) => (
              <SearchableDropdown
                label="Frequency"
                placeholder="Select frequency..."
                options={[...MEDICATION_FREQUENCIES]}
                value={value || null}
                onSelect={(val) => onChange(val ?? null)}
                showAllOnFocus
                strictMode
                error={errors.frequency?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Notes"
                placeholder="Optional notes..."
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
                multiline
              />
            )}
          />

          <Controller
            control={control}
            name="startDate"
            render={({ field: { onChange, value } }) => (
              <DateInput
                label="Start Date"
                value={value || null}
                onChange={onChange}
                error={errors.startDate?.message}
              />
            )}
          />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-body font-medium text-text-primary">
              Ongoing medication
            </Text>
            <Switch
              value={isOngoing}
              onValueChange={handleOngoingToggle}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          {!isOngoing && (
            <Controller
              control={control}
              name="endDate"
              render={({ field: { onChange, value } }) => (
                <DateInput
                  label="End Date"
                  placeholder="Select date (optional)"
                  value={value || null}
                  onChange={onChange}
                />
              )}
            />
          )}
        </Card>

        <View className="mt-6">
          <Button
            title="Update Medication"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
