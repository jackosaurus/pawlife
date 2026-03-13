import { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput } from '@/components/ui/DateInput';
import { SearchableDropdown, DropdownOption } from '@/components/ui/SearchableDropdown';
import { Button } from '@/components/ui/Button';
import { addVetVisitSchema, AddVetVisitFormData } from '@/types/vetVisit';
import { healthService } from '@/services/healthService';
import { formatDate } from '@/utils/dates';
import { Colors } from '@/constants/colors';

export default function AddVetVisitScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [recentClinics, setRecentClinics] = useState<{ clinicName: string; lastVisitDate: string }[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddVetVisitFormData>({
    resolver: zodResolver(addVetVisitSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      clinicName: null,
      reason: null,
      notes: null,
    },
  });

  useEffect(() => {
    if (!petId) return;
    healthService.getRecentClinics(petId).then(setRecentClinics).catch(() => {});
  }, [petId]);

  const clinicOptions: DropdownOption[] = useMemo(
    () =>
      recentClinics.map((c) => ({
        label: `${c.clinicName} (last visit: ${formatDate(c.lastVisitDate)})`,
        value: c.clinicName,
      })),
    [recentClinics],
  );

  const onSubmit = async (data: AddVetVisitFormData) => {
    if (!petId) return;
    setSubmitting(true);
    setServerError(null);

    try {
      await healthService.createVetVisit({
        pet_id: petId,
        date: data.date,
        clinic_name: data.clinicName || null,
        reason: data.reason || null,
        notes: data.notes || null,
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add vet visit';
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
          Add Vet Visit
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{serverError}</Text>
          </View>
        )}

        <Card className="px-5 pt-4 mb-4">
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <DateInput
                label="Date"
                value={value || null}
                onChange={onChange}
                error={errors.date?.message}
                maximumDate={new Date()}
              />
            )}
          />

          <Controller
            control={control}
            name="clinicName"
            render={({ field: { onChange, value } }) => (
              <SearchableDropdown
                label="Clinic Name"
                placeholder="Search or type clinic name..."
                options={clinicOptions}
                value={value || null}
                onSelect={onChange}
                showAllOnFocus
              />
            )}
          />

          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Reason for Visit"
                placeholder="e.g. Annual checkup, limping..."
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
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
        </Card>

        <View className="mt-6">
          <Button
            title="Save Vet Visit"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
