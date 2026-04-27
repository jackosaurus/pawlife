import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { DateInput } from '@/components/ui/DateInput';
import { Avatar } from '@/components/ui/Avatar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { addPetSchema, AddPetFormData } from '@/types/pet';
import { petService } from '@/services/petService';
import { allergyService } from '@/services/allergyService';
import { usePetAllergies } from '@/hooks/usePetAllergies';
import { useAuthStore } from '@/stores/authStore';
import { getBreedsForType } from '@/constants/breeds';
import { CutenessGauge } from '@/components/pets/CutenessGauge';
import { Colors } from '@/constants/colors';

interface PendingAllergen {
  // Existing allergens have a server id; new ones are local-only and have no id.
  id: string | null;
  allergen: string;
}

export default function EditPetScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const session = useAuthStore((s) => s.session);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [useApproxAge, setUseApproxAge] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [petName, setPetName] = useState('');

  // Allergy local pending state — mutations (add/remove) only commit on Save.
  const { data: loadedAllergies } = usePetAllergies(petId!);
  const [originalAllergies, setOriginalAllergies] = useState<
    { id: string; allergen: string }[]
  >([]);
  const [pendingAllergies, setPendingAllergies] = useState<PendingAllergen[]>(
    [],
  );
  const [allergyInput, setAllergyInput] = useState('');
  const [allergyInlineError, setAllergyInlineError] = useState<string | null>(
    null,
  );
  const [allergiesSeeded, setAllergiesSeeded] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    // Seed pending state from the loaded list once. Subsequent refetches
    // (e.g. after a partial-failure retry) shouldn't clobber the user's
    // in-flight edits.
    if (allergiesSeeded) return;
    if (loadedAllergies.length === 0) return;
    const seeded = loadedAllergies.map((a) => ({
      id: a.id,
      allergen: a.allergen,
    }));
    setOriginalAllergies(seeded.map((a) => ({ id: a.id!, allergen: a.allergen })));
    setPendingAllergies(seeded);
    setAllergiesSeeded(true);
  }, [loadedAllergies, allergiesSeeded]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
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
  const watchedName = watch('name');

  useEffect(() => {
    setPetName(watchedName);
  }, [watchedName]);

  useEffect(() => {
    const loadPet = async () => {
      if (!petId) return;
      try {
        setLoading(true);
        const pet = await petService.getById(petId);
        const hasApproxAge =
          !pet.date_of_birth && pet.approximate_age_months != null;
        setUseApproxAge(hasApproxAge);
        setPhotoUri(pet.profile_photo_url);
        setPetName(pet.name);
        reset({
          petType: pet.pet_type,
          name: pet.name,
          breed: pet.breed,
          sex: pet.sex,
          dateOfBirth: pet.date_of_birth,
          approximateAgeMonths: pet.approximate_age_months,
          microchipNumber: pet.microchip_number,
          insuranceProvider: pet.insurance_provider,
          insurancePolicyNumber: pet.insurance_policy_number,
        });
      } catch {
        setServerError('Failed to load pet details');
      } finally {
        setLoading(false);
      }
    };
    loadPet();
  }, [petId, reset]);

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

  const onSubmit = async (data: AddPetFormData) => {
    if (!session || !petId) return;
    setSubmitting(true);
    setServerError(null);

    try {
      await petService.update(petId, {
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

      if (photoUri && !photoUri.startsWith('http')) {
        try {
          const photoUrl = await petService.uploadProfilePhoto(
            session.user.id,
            petId,
            photoUri,
          );
          await petService.update(petId, { profile_photo_url: photoUrl });
        } catch {
          Alert.alert(
            'Photo Upload Failed',
            'Your changes were saved but the photo could not be updated.',
          );
        }
      }

      // Diff allergies and apply add/remove operations. Bio is already saved;
      // failures here surface an error but don't roll back the bio update.
      const pendingIds = new Set(
        pendingAllergies
          .filter((a) => a.id != null)
          .map((a) => a.id as string),
      );
      const toRemove = originalAllergies.filter((a) => !pendingIds.has(a.id));
      const toAdd = pendingAllergies.filter((a) => a.id == null);

      // Track outcomes per pending item so we can rebuild state in one pass.
      const removedSucceeded = new Set<string>();
      const removedFailed: { id: string; allergen: string }[] = [];
      const addedResults: {
        allergen: string;
        outcome: 'success' | 'failure';
        id?: string;
      }[] = [];

      for (const item of toRemove) {
        try {
          await allergyService.remove(item.id);
          removedSucceeded.add(item.id);
        } catch {
          removedFailed.push(item);
        }
      }

      for (const item of toAdd) {
        try {
          const created = await allergyService.create({
            pet_id: petId,
            allergen: item.allergen,
          });
          addedResults.push({
            allergen: item.allergen,
            outcome: 'success',
            id: created.id,
          });
        } catch {
          addedResults.push({ allergen: item.allergen, outcome: 'failure' });
        }
      }

      const anyFailures =
        removedFailed.length > 0 ||
        addedResults.some((r) => r.outcome === 'failure');

      if (anyFailures) {
        // Rebuild pending state in original order:
        // - existing rows that we tried to remove and failed: keep with id
        // - existing rows we kept: keep
        // - newly added rows that succeeded: drop from pending here (will
        //   re-add below with their new server id, preserving order)
        // - newly added rows that failed: keep without id so the user can retry
        let addCursor = 0;
        const reconciled: PendingAllergen[] = [];
        for (const a of pendingAllergies) {
          if (a.id != null) {
            // It was an existing item. Either it was kept (still in
            // pendingIds — yes, by definition) and not removed; nothing
            // to do.
            reconciled.push(a);
          } else {
            const result = addedResults[addCursor++];
            if (!result) continue;
            if (result.outcome === 'failure') {
              reconciled.push({ id: null, allergen: a.allergen });
            } else if (result.id) {
              reconciled.push({ id: result.id, allergen: a.allergen });
            }
          }
        }
        // Re-add failed removals to the front so the user sees them.
        for (const failed of removedFailed) {
          if (!reconciled.some((a) => a.id === failed.id)) {
            reconciled.push({ id: failed.id, allergen: failed.allergen });
          }
        }
        setPendingAllergies(reconciled);

        // Snapshot now reflects server truth: removals that succeeded are
        // gone, additions that succeeded are present.
        setOriginalAllergies((prev) => {
          const next = prev.filter((a) => !removedSucceeded.has(a.id));
          for (const r of addedResults) {
            if (r.outcome === 'success' && r.id) {
              next.push({ id: r.id, allergen: r.allergen });
            }
          }
          return next;
        });

        const failedNames: string[] = [
          ...removedFailed.map((f) => f.allergen),
          ...addedResults
            .filter((r) => r.outcome === 'failure')
            .map((r) => r.allergen),
        ];
        setServerError(
          failedNames.length === 1
            ? `Couldn't save allergen "${failedNames[0]}". Other changes were saved.`
            : `Couldn't save allergens: ${failedNames.join(', ')}. Other changes were saved.`,
        );
        return;
      }

      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save changes';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAllergen = () => {
    const trimmed = allergyInput.trim();
    if (trimmed.length === 0) return;
    const lower = trimmed.toLowerCase();
    const isDuplicate = pendingAllergies.some(
      (a) => a.allergen.trim().toLowerCase() === lower,
    );
    if (isDuplicate) {
      setAllergyInlineError('Already on the list.');
      return;
    }
    setPendingAllergies((prev) => [...prev, { id: null, allergen: trimmed }]);
    setAllergyInput('');
    setAllergyInlineError(null);
  };

  const handleRemoveAllergen = (target: PendingAllergen) => {
    setPendingAllergies((prev) =>
      prev.filter((a) =>
        target.id != null
          ? a.id !== target.id
          : !(a.id == null && a.allergen === target.allergen),
      ),
    );
  };

  const handleArchive = () => {
    if (!petId) return;
    setShowArchive(true);
  };

  const handleConfirmArchive = async () => {
    if (!petId) return;
    setArchiving(true);
    try {
      await petService.archive(petId);
      setShowArchive(false);
      router.navigate('/(main)');
    } catch {
      Alert.alert('Error', 'Failed to archive pet. Please try again.');
    } finally {
      setArchiving(false);
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
          <Text className="text-headline text-text-primary">
            Edit {petName || 'Pet'}
          </Text>
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
            hitSlop={8}
            className="py-1"
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text className="text-primary text-callout font-bold">Save</Text>
            )}
          </Pressable>
        </View>

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

          {/* Age Toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-secondary text-body">
              I don't know the exact date of birth
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

        {/* Allergies */}
        <Text className="text-eyebrow uppercase text-text-secondary mb-2">
          ALLERGIES
        </Text>
        <Card className="px-5 pt-4 mb-4">
          {pendingAllergies.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {pendingAllergies.map((a, idx) => {
                const key = a.id ?? `new-${idx}-${a.allergen}`;
                return (
                  <View
                    key={key}
                    style={{ backgroundColor: `${Colors.statusNeutral}15` }}
                    className="flex-row items-center px-3 py-1.5 rounded-full"
                    testID={`allergy-chip-${a.allergen}`}
                  >
                    <Text
                      style={{ color: Colors.textPrimary }}
                      className="text-button-sm mr-1.5"
                    >
                      {a.allergen}
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveAllergen(a)}
                      hitSlop={8}
                      testID={`allergy-chip-remove-${a.allergen}`}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={Colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
          <View className="mb-4">
            <Text className="text-text-secondary text-body mb-1.5">
              Add allergen
            </Text>
            <View
              style={{
                borderColor: allergyInlineError
                  ? Colors.statusOverdue
                  : Colors.border,
                borderWidth: 1,
                borderRadius: 12,
              }}
              className="flex-row items-center bg-white px-4"
            >
              <RNTextInput
                value={allergyInput}
                onChangeText={(text) => {
                  setAllergyInput(text);
                  if (allergyInlineError) setAllergyInlineError(null);
                }}
                onSubmitEditing={handleAddAllergen}
                placeholder="e.g. Chicken"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="done"
                autoCapitalize="none"
                className="flex-1 py-3.5 text-body text-text-primary"
                testID="allergy-input"
              />
              <Pressable
                onPress={handleAddAllergen}
                disabled={allergyInput.trim().length === 0}
                hitSlop={8}
                testID="add-allergen-button"
              >
                <Text
                  style={{
                    color:
                      allergyInput.trim().length === 0
                        ? Colors.textSecondary
                        : Colors.primary,
                  }}
                  className="text-callout font-bold"
                >
                  Add
                </Text>
              </Pressable>
            </View>
            {allergyInlineError && (
              <Text className="text-status-overdue text-footnote mt-1">
                {allergyInlineError}
              </Text>
            )}
          </View>
        </Card>

        <CutenessGauge />

        {/* Archive Option */}
        <Pressable
          onPress={handleArchive}
          className="mt-6 py-3 items-center"
          hitSlop={8}
          testID="archive-button"
        >
          <Text className="text-status-overdue text-body font-medium">
            Archive {petName || 'Pet'}
          </Text>
        </Pressable>
      </View>

      <ConfirmationModal
        visible={showArchive}
        title={`Archive ${petName || 'pet'}?`}
        message={`We'll keep all of ${petName || 'their'} records safe. You can restore ${petName || 'them'} anytime from Pet Family.`}
        confirmLabel="Archive"
        severity="standard"
        onConfirm={handleConfirmArchive}
        onCancel={() => setShowArchive(false)}
        loading={archiving}
      />
    </Screen>
  );
}
