import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { allergySchema, AllergyFormData } from '@/types/petAllergy';
import { allergyService } from '@/services/allergyService';
import { Colors } from '@/constants/colors';

export default function AddAllergyScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergen: '',
    },
  });

  const onSubmit = async (data: AllergyFormData) => {
    if (!petId) return;
    setSubmitting(true);
    setServerError(null);

    try {
      await allergyService.create({
        pet_id: petId,
        allergen: data.allergen,
      });
      router.back();
    } catch (err) {
      // The DB unique index on (pet_id, lower(allergen)) surfaces dupes
      // as a Postgres error; show a friendly message rather than the raw
      // constraint name.
      const message = err instanceof Error ? err.message : 'Failed to add allergy';
      const friendly = /duplicate|unique/i.test(message)
        ? 'That allergen is already on the list.'
        : message;
      setServerError(friendly);
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
          Add Allergy
        </Text>

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
                autoFocus
              />
            )}
          />
        </Card>

        <View className="mt-6">
          <Button
            title="Save Allergy"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
