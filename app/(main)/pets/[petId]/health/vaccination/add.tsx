import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
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
import { getVaccinesForType, getIntervalForVaccine, VACCINATION_INTERVALS } from '@/constants/vaccines';
import { Colors } from '@/constants/colors';

export default function AddVaccinationScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Default to dog vaccines; in the future we can pass petType via params
  const [petType] = useState<'dog' | 'cat'>('dog');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddVaccinationFormData>({
    resolver: zodResolver(addVaccinationSchema),
    defaultValues: {
      vaccineName: '',
      intervalMonths: 12,
      dateAdministered: '',
      clinicName: null,
    },
  });

  const onSubmit = async (data: AddVaccinationFormData) => {
    if (!petId) return;
    setSubmitting(true);
    setServerError(null);

    try {
      const doseDate = new Date(data.dateAdministered);
      doseDate.setMonth(doseDate.getMonth() + data.intervalMonths);
      const nextDueDate = doseDate.toISOString().split('T')[0];

      const vaccination = await healthService.createVaccination({
        pet_id: petId,
        vaccine_name: data.vaccineName,
        date_administered: data.dateAdministered,
        next_due_date: nextDueDate,
        interval_months: data.intervalMonths,
        clinic_name: data.clinicName || null,
      });

      // Create initial dose record
      await healthService.logVaccinationDose(
        {
          vaccination_id: vaccination.id,
          date_administered: data.dateAdministered,
          clinic_name: data.clinicName || null,
        },
        data.intervalMonths,
      );

      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add vaccination';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-largeTitle text-text-primary mb-6">
          Add Vaccination
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-footnote">{serverError}</Text>
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
                  if (v) {
                    const interval = getIntervalForVaccine(v);
                    setValue('intervalMonths', interval ?? 12);
                  }
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
            name="intervalMonths"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View className="mb-4">
                <Text className="text-footnote font-medium text-text-primary mb-2">Schedule</Text>
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
                        className={`text-button-sm ${
                          value === interval.value ? 'text-white' : 'text-text-primary'
                        }`}
                      >
                        {interval.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {error && <Text className="text-status-overdue text-footnote mt-1">{error.message}</Text>}
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

        <View className="mt-6">
          <Button
            title="Save Vaccination"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
