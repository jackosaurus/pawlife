import { View, Text, Pressable, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { MetadataPill } from '@/components/pets/MetadataPill';
import { AgePill } from '@/components/pets/AgePill';
import { calculateAge } from '@/utils/dates';
import { Colors } from '@/constants/colors';
import { Pet } from '@/types';

const headerBg = require('@/assets/images/pet-detail-header-bg.png');

interface StickyHeaderProps {
  pet: Pet;
  onBack: () => void;
  latestWeight?: number | null;
}

export function StickyHeader({ pet, onBack, latestWeight }: StickyHeaderProps) {
  // Pets with a precise date_of_birth get the smart AgePill (default /
  // birthday / savor / puppy). Pets recorded only with an approximate age
  // in months fall back to the legacy static MetadataPill — there's no
  // birthday to celebrate without a real date.
  const fallbackAge = !pet.date_of_birth
    ? calculateAge(pet.date_of_birth, pet.approximate_age_months)
    : null;

  const sexLabel =
    pet.sex === 'male' ? '♂ Male' : pet.sex === 'female' ? '♀ Female' : null;

  return (
    <ImageBackground
      source={headerBg}
      resizeMode="cover"
      className="px-6 pt-4 pb-6"
    >
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={onBack} hitSlop={8} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View className="flex-row items-center">
        <Avatar
          uri={pet.profile_photo_url}
          name={pet.name}
          size="lg"
          petType={pet.pet_type}
        />
        <View className="ml-4 flex-1">
          <Text className="text-largeTitle text-text-primary">
            {pet.name}
          </Text>
          <Text className="text-callout text-text-secondary mt-0.5">
            {pet.breed ?? 'Mixed / Unknown'}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-3">
        {pet.date_of_birth ? (
          <AgePill petName={pet.name} dob={pet.date_of_birth} />
        ) : fallbackAge ? (
          <MetadataPill label={fallbackAge} />
        ) : null}
        {sexLabel ? <MetadataPill label={sexLabel} /> : null}
        {latestWeight != null ? (
          <MetadataPill label={`${Number(latestWeight.toFixed(1))} kg`} />
        ) : null}
      </View>
    </ImageBackground>
  );
}
