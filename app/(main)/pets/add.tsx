import { useState } from 'react';
import { View, Text, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput } from '@/components/ui/DateInput';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { addPetSchema, AddPetFormData } from '@/types/pet';
import { allergySchema } from '@/types/petAllergy';
import { petService } from '@/services/petService';
import { allergyService } from '@/services/allergyService';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { getBreedsForType } from '@/constants/breeds';
import { CutenessGauge } from '@/components/pets/CutenessGauge';
import { Colors } from '@/constants/colors';

export default function AddPetScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const family = useFamilyStore((s) => s.family);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [useApproxAge, setUseApproxAge] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [allergenDraft, setAllergenDraft] = useState('');
  const [allergenInputOpen, setAllergenInputOpen] = useState(false);
  const [allergenError, setAllergenError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddPetFormData>({
    resolver: zodResolver(addPetSchema),
    defaultValues: {
      petType: 'dog',
      name: '',
      breed: null,
      sex: null,
      dateOfBirth: null,
      approximateAgeMonths: null,
      microchipNumber: null,
      insuranceProvider: null,
      insurancePolicyNumber: null,
    },
  });

  const petType = watch('petType');
  const petName = watch('name');

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to add a pet photo.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const addAllergen = () => {
    setAllergenError(null);
    const parsed = allergySchema.safeParse({ allergen: allergenDraft });
    if (!parsed.success) {
      setAllergenError(parsed.error.issues[0]?.message ?? 'Invalid allergen');
      return;
    }
    const next = parsed.data.allergen;
    if (allergens.some((a) => a.toLowerCase() === next.toLowerCase())) {
      setAllergenError('Already on the list.');
      return;
    }
    setAllergens((prev) => [...prev, next]);
    setAllergenDraft('');
    setAllergenInputOpen(false);
  };

  const removeAllergen = (idx: number) => {
    setAllergens((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: AddPetFormData) => {
    if (!session || !family) return;
    setSubmitting(true);
    setServerError(null);

    try {
      const pet = await petService.create({
        family_id: family.id,
        pet_type: data.petType,
        name: data.name,
        breed: data.breed ?? null,
        sex: data.sex ?? null,
        date_of_birth: useApproxAge ? null : (data.dateOfBirth ?? null),
        approximate_age_months: useApproxAge
          ? (data.approximateAgeMonths ?? null)
          : null,
        microchip_number: data.microchipNumber ?? null,
        insurance_provider: data.insuranceProvider?.trim() || null,
        insurance_policy_number: data.insurancePolicyNumber?.trim() || null,
      });

      if (photoUri) {
        try {
          const photoUrl = await petService.uploadProfilePhoto(
            session.user.id,
            pet.id,
            photoUri,
          );
          await petService.update(pet.id, { profile_photo_url: photoUrl });
        } catch {
          Alert.alert(
            'Photo Upload Failed',
            'Your pet was added but the photo could not be uploaded. You can add it later.',
          );
        }
      }

      // Best-effort batch-create allergies. If any fail, the pet is still
      // created; surface a non-blocking notice. The user can re-add from
      // the pet detail screen.
      if (allergens.length > 0) {
        const failed: string[] = [];
        for (const allergen of allergens) {
          try {
            await allergyService.create({ pet_id: pet.id, allergen });
          } catch {
            failed.push(allergen);
          }
        }
        if (failed.length > 0) {
          Alert.alert(
            'Allergies Partially Saved',
            `Couldn't save: ${failed.join(', ')}. You can re-add them from ${pet.name}'s profile.`,
          );
        }
      }

      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add pet';
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
          Add a Pet
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-footnote">{serverError}</Text>
          </View>
        )}

        {/* Pet Type */}
        <Text className="text-text-secondary text-body mb-2">
          What kind of pet?
        </Text>
        <Controller
          control={control}
          name="petType"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-3 mb-6">
              {(['dog', 'cat'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => {
                    onChange(type);
                    setValue('breed', null);
                  }}
                  className={`flex-1 items-center py-4 rounded-2xl border-2 ${
                    value === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white'
                  }`}
                >
                  <Text className="text-largeTitle mb-1">
                    {type === 'dog' ? '🐕' : '🐈'}
                  </Text>
                  <Text
                    className={`font-semibold ${
                      value === type ? 'text-primary' : 'text-text-primary'
                    }`}
                  >
                    {type === 'dog' ? 'Dog' : 'Cat'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />

        {/* Photo */}
        <Pressable onPress={pickImage} className="items-center mb-6">
          {photoUri ? (
            <Avatar uri={photoUri} name={petName || 'Pet'} size="lg" />
          ) : (
            <View
              className="items-center justify-center bg-white border-2 border-dashed border-border"
              style={{ width: 96, height: 96, borderRadius: 48 }}
            >
              <Ionicons
                name="camera-outline"
                size={32}
                color={Colors.textSecondary}
              />
            </View>
          )}
          <Text className="text-primary text-button-sm mt-2">
            {photoUri ? 'Change Photo' : 'Add Photo'}
          </Text>
        </Pressable>

        <Card className="px-5 pt-4 mb-4">
          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Name"
                placeholder="What's your pet's name?"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          {/* Breed */}
          <Controller
            control={control}
            name="breed"
            render={({ field: { onChange, value } }) => (
              <SearchableDropdown
                label="Breed"
                placeholder="Search breeds..."
                options={getBreedsForType(petType)}
                value={value ?? null}
                onSelect={onChange}
                error={errors.breed?.message}
              />
            )}
          />

          {/* Sex */}
          <Text className="text-text-secondary text-body mb-2">Sex</Text>
          <Controller
            control={control}
            name="sex"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <SegmentedControl
                  options={[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                    { label: 'Unknown', value: 'unknown' },
                  ]}
                  selected={value ?? 'unknown'}
                  onSelect={onChange}
                />
              </View>
            )}
          />

          {/* Age Toggle — gap-3 + flex-1 prevents the label from butting into
              the 51pt switch slot at larger Fraunces body sizes (designer spec
              docs/bemy-edit-pet-dob-toggle-spec.md, May 3 2026). */}
          <View className="flex-row items-center gap-3 mb-4">
            <Text className="text-text-secondary text-body flex-1 leading-snug">
              I don't know their exact birthday
            </Text>
            <Switch
              value={useApproxAge}
              onValueChange={(val) => {
                setUseApproxAge(val);
                if (val) {
                  setValue('dateOfBirth', null);
                } else {
                  setValue('approximateAgeMonths', null);
                }
              }}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          {useApproxAge ? (
            <Controller
              control={control}
              name="approximateAgeMonths"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Approximate Age (months)"
                  placeholder="e.g. 18"
                  keyboardType="number-pad"
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    onChange(isNaN(num) ? null : num);
                  }}
                  onBlur={onBlur}
                  value={value != null ? String(value) : ''}
                />
              )}
            />
          ) : (
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, value } }) => (
                <DateInput
                  label="Date of Birth"
                  value={value || null}
                  onChange={onChange}
                  maximumDate={new Date()}
                />
              )}
            />
          )}

          {/* Microchip */}
          <Controller
            control={control}
            name="microchipNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Microchip Number"
                placeholder="Optional"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
              />
            )}
          />
        </Card>

        {/* Allergies */}
        <Text className="text-eyebrow uppercase text-text-secondary mb-2">
          ALLERGIES
        </Text>
        <Card className="px-5 py-4 mb-4">
          {allergens.length === 0 && !allergenInputOpen ? (
            <Text className="text-body text-text-secondary mb-2">
              No allergies added yet.
            </Text>
          ) : null}

          {allergens.map((a, idx) => (
            <View
              key={`${a}-${idx}`}
              className="flex-row items-center justify-between py-2"
              testID={`allergen-row-${idx}`}
            >
              <Text className="text-body text-text-primary flex-1 mr-3">
                {a}
              </Text>
              <Pressable
                onPress={() => removeAllergen(idx)}
                hitSlop={8}
                testID={`remove-allergen-${idx}`}
              >
                <Ionicons
                  name="close-circle"
                  size={22}
                  color={Colors.textSecondary}
                />
              </Pressable>
            </View>
          ))}

          {allergenInputOpen ? (
            <View className="mt-2">
              <TextInput
                label="Allergen"
                placeholder="e.g. Chicken"
                value={allergenDraft}
                onChangeText={setAllergenDraft}
                error={allergenError ?? undefined}
                autoFocus
                testID="allergen-input"
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={addAllergen}
                  hitSlop={8}
                  className="py-1"
                  testID="save-allergen-button"
                >
                  <Text className="text-primary text-callout font-semibold">
                    Save
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setAllergenInputOpen(false);
                    setAllergenDraft('');
                    setAllergenError(null);
                  }}
                  hitSlop={8}
                  className="py-1"
                  testID="cancel-allergen-button"
                >
                  <Text className="text-text-secondary text-callout font-medium">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setAllergenInputOpen(true)}
              hitSlop={8}
              className="mt-1 py-1"
              testID="open-allergen-input"
            >
              <Text className="text-primary text-callout font-medium">
                + Add allergy
              </Text>
            </Pressable>
          )}
        </Card>

        {/* Insurance */}
        <Text className="text-eyebrow uppercase text-text-secondary mb-2">
          INSURANCE
        </Text>
        <Card className="px-5 pt-4 mb-4">
          <Controller
            control={control}
            name="insuranceProvider"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Provider"
                placeholder="e.g. Petplan"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
                error={errors.insuranceProvider?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="insurancePolicyNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Policy number"
                placeholder="Your policy reference"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
                error={errors.insurancePolicyNumber?.message}
              />
            )}
          />
        </Card>

        <CutenessGauge />

        <View className="mt-6">
          <Button
            title={`Add ${petName || 'Your Pet'} to Your Family`}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
