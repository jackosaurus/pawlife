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
import {
  addWeightEntrySchema,
  AddWeightEntryFormData,
} from '@/types/weightEntry';
import { healthService } from '@/services/healthService';
import { Colors } from '@/constants/colors';

export default function EditWeightEntryScreen() {
  const { petId, id } = useLocalSearchParams<{ petId: string; id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddWeightEntryFormData>({
    resolver: zodResolver(addWeightEntrySchema),
    defaultValues: {
      weight: '',
      date: '',
      note: null,
    },
  });

  const loadEntry = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthService.getWeightEntryById(id!);
      reset({
        weight: String(data.weight),
        date: data.date,
        note: data.note ?? null,
      });
    } catch {
      setServerError('Failed to load weight entry');
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const onSubmit = async (data: AddWeightEntryFormData) => {
    if (!id) return;
    setSubmitting(true);
    setServerError(null);

    try {
      await healthService.updateWeightEntry(id, {
        weight: Number(data.weight),
        date: data.date,
        note: data.note || null,
      });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update weight entry';
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
          Edit Weight Entry
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{serverError}</Text>
          </View>
        )}

        <Card className="px-5 pt-4 mb-4">
          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Weight (kg)"
                placeholder="e.g. 25.5"
                keyboardType="decimal-pad"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.weight?.message}
              />
            )}
          />

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
            name="note"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Note"
                placeholder="Optional note..."
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
              />
            )}
          />
        </Card>

        <View className="mt-6">
          <Button
            title="Update Weight"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
