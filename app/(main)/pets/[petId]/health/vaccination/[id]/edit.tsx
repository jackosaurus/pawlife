import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import {
  editVaccinationSchema,
  EditVaccinationFormData,
} from '@/types/vaccination';
import { healthService } from '@/services/healthService';
import { getVaccinesForType, VACCINATION_INTERVALS } from '@/constants/vaccines';
import { Colors } from '@/constants/colors';

export default function EditVaccinationScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentDateAdministered, setCurrentDateAdministered] = useState<string | null>(null);
  const [petType] = useState<'dog' | 'cat'>('dog');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditVaccinationFormData>({
    resolver: zodResolver(editVaccinationSchema),
    defaultValues: {
      vaccineName: '',
      intervalMonths: 12,
      clinicName: null,
    },
  });

  const loadVaccination = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthService.getVaccinationById(id!);
      setCurrentDateAdministered(data.date_administered);
      reset({
        vaccineName: data.vaccine_name,
        intervalMonths: data.interval_months ?? 12,
        clinicName: data.clinic_name ?? null,
      });
    } catch {
      setServerError('Failed to load vaccination');
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadVaccination();
  }, [loadVaccination]);

  const onSubmit = async (data: EditVaccinationFormData) => {
    if (!id) return;
    setSubmitting(true);
    setServerError(null);

    try {
      // Recalculate next_due_date based on current date_administered + new interval
      let nextDueDate: string | null = null;
      if (currentDateAdministered) {
        const doseDate = new Date(currentDateAdministered);
        doseDate.setMonth(doseDate.getMonth() + data.intervalMonths);
        nextDueDate = doseDate.toISOString().split('T')[0];
      }

      await healthService.updateVaccination(id, {
        vaccine_name: data.vaccineName,
        interval_months: data.intervalMonths,
        clinic_name: data.clinicName || null,
        ...(nextDueDate ? { next_due_date: nextDueDate } : {}),
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update vaccination';
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
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text className="text-lg font-semibold text-text-primary">
            Edit Vaccination
          </Text>
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
            hitSlop={8}
          >
            <Text className="text-base font-semibold text-primary">
              {submitting ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{serverError}</Text>
          </View>
        )}

        <Card className="px-5 pt-4 mb-4">
          <Controller
            control={control}
            name="vaccineName"
            render={({ field: { onChange, value } }) => (
              <SearchableDropdown
                label="Vaccine Name"
                placeholder="Search or type vaccine name..."
                options={getVaccinesForType(petType)}
                value={value || null}
                onSelect={(v) => {
                  onChange(v);
                }}
                error={errors.vaccineName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="intervalMonths"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View className="mb-4">
                <Text className="text-sm font-medium text-text-primary mb-2">Schedule</Text>
                <View className="flex-row flex-wrap gap-2">
                  {VACCINATION_INTERVALS.map((interval) => (
                    <Pressable
                      key={interval.value}
                      onPress={() => onChange(interval.value)}
                      className={`px-4 py-2 rounded-full border ${
                        value === interval.value
                          ? 'bg-primary border-primary'
                          : 'bg-white border-border'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          value === interval.value ? 'text-white' : 'text-text-primary'
                        }`}
                      >
                        {interval.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {error && <Text className="text-status-overdue text-xs mt-1">{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="clinicName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Clinic Name"
                placeholder="Optional"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
              />
            )}
          />
        </Card>
      </View>
    </Screen>
  );
}
