import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { calculateAge } from '@/utils/dates';
import { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onPress: () => void;
}

export function PetCard({ pet, onPress }: PetCardProps) {
  const age = calculateAge(pet.date_of_birth, pet.approximate_age_months);

  return (
    <Card onPress={onPress} className="p-4 mb-3">
      <View className="flex-row items-center">
        <Avatar
          uri={pet.profile_photo_url}
          name={pet.name}
          size="md"
          petType={pet.pet_type}
        />
        <View className="ml-4 flex-1">
          <Text className="text-lg font-semibold text-text-primary">
            {pet.name}
          </Text>
          <Text className="text-sm text-text-secondary">
            {pet.breed ?? 'Mixed / Unknown'}
          </Text>
          <Text className="text-sm text-text-secondary">{age}</Text>
        </View>
        <Text className="text-2xl text-text-secondary">
          {pet.pet_type === 'dog' ? '🐕' : '🐈'}
        </Text>
      </View>
    </Card>
  );
}
