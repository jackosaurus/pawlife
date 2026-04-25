import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmation } from '@/components/ui/DeleteConfirmation';
import { allergySchema, AllergyFormData } from '@/types/petAllergy';
import { allergyService } from '@/services/allergyService';
import { Colors } from '@/constants/colors';

export default function AllergyDetailScreen() {
  const { allergyId } = useLocalSearchParams<{
    petId: string;
    allergyId: string;
  }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: { allergen: '' },
  });

  const loadAllergy = useCallback(async () => {
    if (!allergyId) return;
    try {
      setLoading(true);
      const data = await allergyService.getById(allergyId);
      reset({ allergen: data.allergen });
    } catch {
      setServerError('Failed to load allergy');
    } finally {
      setLoading(false);
    }
  }, [allergyId, reset]);

  useEffect(() => {
    loadAllergy();
  }, [loadAllergy]);

  const onSubmit = async (data: AllergyFormData) => {
    if (!allergyId) return;
    setSubmitting(true);
    setServerError(null);

    try {
      await allergyService.update(allergyId, { allergen: data.allergen });
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update allergy';
      const friendly = /duplicate|unique/i.test(message)
        ? 'That allergen is already on the list.'
        : message;
      setServerError(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!allergyId) return;
    setDeleting(true);
    try {
      await allergyService.remove(allergyId);
      router.back();
    } catch {
      setServerError('Failed to delete allergy');
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

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-16">
        {/* Header: Back + Title + Save */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={8} className="py-1">
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text className="text-lg font-bold text-text-primary">
            Edit Allergy
          </Text>
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
            hitSlop={8}
            className="py-1"
            testID="save-button"
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text className="text-primary text-base font-bold">Save</Text>
            )}
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
            name="allergen"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Allergen"
                placeholder="e.g. Chicken"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.allergen?.message}
              />
            )}
          />
        </Card>

        <View className="mt-4">
          <Button
            title="Delete"
            variant="secondary"
            onPress={() => setShowDelete(true)}
          />
        </View>

        <DeleteConfirmation
          visible={showDelete}
          title="Delete Allergy"
          message="Are you sure you want to delete this allergy? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      </View>
    </Screen>
  );
}
