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
import { petService } from '@/services/petService';
import { useAuthStore } from '@/stores/authStore';
import { getBreedsForType } from '@/constants/breeds';
import { CutenessGauge } from '@/components/pets/CutenessGauge';
import { Colors } from '@/constants/colors';

export default function AddPetScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [useApproxAge, setUseApproxAge] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
      weight: null,
      microchipNumber: null,
    },
  });

  const petType = watch('petType');
  const petName = watch('name');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: AddPetFormData) => {
    if (!session) return;
    setSubmitting(true);
    setServerError(null);

    try {
      const pet = await petService.create({
        user_id: session.user.id,
        pet_type: data.petType,
        name: data.name,
        breed: data.breed ?? null,
        sex: data.sex ?? null,
        date_of_birth: useApproxAge ? null : (data.dateOfBirth ?? null),
        approximate_age_months: useApproxAge
          ? (data.approximateAgeMonths ?? null)
          : null,
        weight: data.weight ?? null,
        microchip_number: data.microchipNumber ?? null,
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

        <Text className="text-3xl font-bold text-text-primary mb-6">
          Add a Pet
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{serverError}</Text>
          </View>
        )}

        {/* Pet Type */}
        <Text className="text-text-secondary text-base mb-2">
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
                  <Text className="text-3xl mb-1">
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
          <Text className="text-primary text-sm font-medium mt-2">
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
          <Text className="text-text-secondary text-base mb-2">Sex</Text>
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
            <Text className="text-text-secondary text-base">
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

          {/* Weight */}
          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Weight (kg)"
                placeholder="e.g. 12.5"
                keyboardType="decimal-pad"
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  onChange(isNaN(num) ? null : num);
                }}
                onBlur={onBlur}
                value={value != null ? String(value) : ''}
                error={errors.weight?.message}
              />
            )}
          />

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
