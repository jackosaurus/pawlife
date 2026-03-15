import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { MetadataPill } from '@/components/pets/MetadataPill';
import { calculateAge } from '@/utils/dates';
import { Colors } from '@/constants/colors';
import { Pet } from '@/types';

interface StickyHeaderProps {
  pet: Pet;
  onBack: () => void;
  onEdit?: () => void;
  latestWeight?: number | null;
}

export function StickyHeader({ pet, onBack, onEdit, latestWeight }: StickyHeaderProps) {
  const age = calculateAge(pet.date_of_birth, pet.approximate_age_months);

  const sexLabel =
    pet.sex === 'male' ? '♂ Male' : pet.sex === 'female' ? '♀ Female' : null;

  return (
    <View className="px-6 pt-4 pb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={onBack} hitSlop={8} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        {onEdit ? (
          <Pressable
            onPress={onEdit}
            testID="edit-button"
            className="flex-row items-center"
            hitSlop={8}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={Colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text className="text-base font-medium text-primary">Edit</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center">
        <Avatar
          uri={pet.profile_photo_url}
          name={pet.name}
          size="lg"
          petType={pet.pet_type}
        />
        <View className="ml-4 flex-1">
          <Text className="text-3xl font-bold text-text-primary">
            {pet.name}
          </Text>
          <Text className="text-base text-text-secondary mt-0.5">
            {pet.breed ?? 'Mixed / Unknown'}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-3">
        <MetadataPill label={age} />
        {sexLabel ? <MetadataPill label={sexLabel} /> : null}
        {latestWeight != null ? (
          <MetadataPill label={`${Number(latestWeight.toFixed(1))} kg`} />
        ) : null}
      </View>
    </View>
  );
}
