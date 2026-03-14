import { useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
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

export default function AddMedicationScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isOngoing, setIsOngoing] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddMedicationFormData>({
    resolver: zodResolver(addMedicationSchema),
    defaultValues: {
      name: '',
      dosage: null,
      frequency: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      notes: null,
    },
  });

  const handleOngoingToggle = (value: boolean) => {
    setIsOngoing(value);
    if (value) {
      setValue('endDate', null);
    }
  };

  const onSubmit = async (data: AddMedicationFormData) => {
    if (!petId) return;
    setSubmitting(true);
    setServerError(null);

    try {
      await healthService.createMedication({
        pet_id: petId,
        name: data.name,
        dosage: data.dosage || null,
        frequency: data.frequency || null,
        start_date: data.startDate,
        end_date: isOngoing ? null : (data.endDate || null),
        notes: data.notes || null,
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add medication';
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

        <Text className="text-3xl font-bold text-text-primary mb-6">
          Add Medication
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{serverError}</Text>
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
                onSelect={onChange}
                showAllOnFocus
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
            <Text className="text-base font-medium text-text-primary">
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
        </Card>

        <View className="mt-6">
          <Button
            title="Save Medication"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
