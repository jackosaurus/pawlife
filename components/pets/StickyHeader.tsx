import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { calculateAge } from '@/utils/dates';
import { Colors } from '@/constants/colors';
import { Pet } from '@/types';

interface StickyHeaderProps {
  pet: Pet;
  onBack: () => void;
}

export function StickyHeader({ pet, onBack }: StickyHeaderProps) {
  const age = calculateAge(pet.date_of_birth, pet.approximate_age_months);

  return (
    <View className="px-6 pt-4 pb-6">
      <Pressable onPress={onBack} hitSlop={8} className="mb-4" testID="back-button">
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </Pressable>

      <View className="flex-row items-center">
        <Avatar
          uri={pet.profile_photo_url}
          name={pet.name}
          size="lg"
          petType={pet.pet_type}
        />
        <View className="ml-4 flex-1">
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-text-primary">
              {pet.name}
            </Text>
            <Text className="text-xl ml-2">
              {pet.pet_type === 'dog' ? '🐕' : '🐈'}
            </Text>
          </View>
          <Text className="text-base text-text-secondary mt-0.5">
            {pet.breed ?? 'Mixed / Unknown'}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-sm text-text-secondary">{age}</Text>
            {pet.sex && pet.sex !== 'unknown' && (
              <Text className="text-sm text-text-secondary ml-3">
                {pet.sex === 'male' ? '♂ Male' : '♀ Female'}
              </Text>
            )}
            {pet.weight != null && (
              <Text className="text-sm text-text-secondary ml-3">
                {pet.weight} kg
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
