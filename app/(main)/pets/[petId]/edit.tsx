import { useState, useEffect } from 'react';
import { View, Text, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { addPetSchema, AddPetFormData } from '@/types/pet';
import { petService } from '@/services/petService';
import { useAuthStore } from '@/stores/authStore';
import { getBreedsForType } from '@/constants/breeds';
import { Colors } from '@/constants/colors';

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
      weight: null,
      microchipNumber: null,
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
          weight: pet.weight,
          microchipNumber: pet.microchip_number,
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
        weight: data.weight ?? null,
        microchip_number: data.microchipNumber ?? null,
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

      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save changes';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = () => {
    if (!petId) return;
    Alert.alert(
      `Archive ${petName}?`,
      `They'll be moved to your archived pets. You can restore them anytime from Settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await petService.archive(petId);
              router.navigate('/(main)');
            } catch {
              Alert.alert(
                'Error',
                'Failed to archive pet. Please try again.',
              );
            }
          },
        },
      ],
    );
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
          Edit {petName || 'Pet'}
        </Text>

        {serverError && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{serverError}</Text>
          </View>
        )}

        {/* Pet Type */}
        <Text className="text-text-secondary text-sm mb-2 ml-1">
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
        <Text className="text-text-secondary text-sm mb-2 ml-1">Sex</Text>
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
          <Text className="text-text-secondary text-sm ml-1">
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
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
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

        <View className="mt-6">
          <Button
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </View>

        {/* Archive Option */}
        <Pressable
          onPress={handleArchive}
          className="mt-6 py-3 items-center"
          hitSlop={8}
          testID="archive-button"
        >
          <Text className="text-status-overdue text-base font-medium">
            Archive {petName || 'Pet'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
