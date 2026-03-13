import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
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
  addVaccinationSchema,
  AddVaccinationFormData,
} from '@/types/vaccination';
import { healthService } from '@/services/healthService';
import { getVaccinesForType, getIntervalForVaccine } from '@/constants/vaccines';
import { Colors } from '@/constants/colors';

export default function EditVaccinationScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [petType] = useState<'dog' | 'cat'>('dog');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddVaccinationFormData>({
    resolver: zodResolver(addVaccinationSchema),
    defaultValues: {
      vaccineName: '',
      dateAdministered: '',
      nextDueDate: null,
      clinicName: null,
    },
  });

  const dateAdministered = watch('dateAdministered');

  const loadVaccination = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthService.getVaccinationById(id!);
      reset({
        vaccineName: data.vaccine_name,
        dateAdministered: data.date_administered,
        nextDueDate: data.next_due_date ?? null,
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

  const autoSuggestNextDue = (vaccineName: string) => {
    const interval = getIntervalForVaccine(vaccineName);
    if (interval && dateAdministered) {
      try {
        const date = new Date(dateAdministered);
        if (!isNaN(date.getTime())) {
          date.setMonth(date.getMonth() + interval);
          setValue('nextDueDate', date.toISOString().split('T')[0]);
        }
      } catch {
        // Invalid date, skip auto-suggest
      }
    }
  };

  const onSubmit = async (data: AddVaccinationFormData) => {
    if (!id) return;
    setSubmitting(true);
    setServerError(null);

    try {
      await healthService.updateVaccination(id, {
        vaccine_name: data.vaccineName,
        date_administered: data.dateAdministered,
        next_due_date: data.nextDueDate || null,
        clinic_name: data.clinicName || null,
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
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-3xl font-bold text-text-primary mb-6">
          Edit Vaccination
        </Text>

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
                  autoSuggestNextDue(v);
                }}
                error={errors.vaccineName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="dateAdministered"
            render={({ field: { onChange, value } }) => (
              <DateInput
                label="Date Administered"
                value={value || null}
                onChange={onChange}
                error={errors.dateAdministered?.message}
                maximumDate={new Date()}
              />
            )}
          />

          <Controller
            control={control}
            name="nextDueDate"
            render={({ field: { onChange, value } }) => (
              <DateInput
                label="Next Due Date"
                placeholder="Select date (optional)"
                value={value || null}
                onChange={onChange}
              />
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

        <View className="mt-6">
          <Button
            title="Update Vaccination"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
