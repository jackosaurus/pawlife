import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { calculateAge } from '@/utils/dates';
import { useAgeMoment } from '@/hooks/useAgeMoment';
import { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onPress: () => void;
}

/**
 * Inner age line. Split out so we can call `useAgeMoment` (which requires a
 * dob) only when the pet has a real `date_of_birth`. Pets recorded with
 * `approximate_age_months` only fall back to the legacy static
 * `calculateAge` string — same fallback pattern as `StickyHeader`.
 *
 * Dashboard variant uses `shortLabel` (no pet name) since the card heading
 * is already the pet's name. We keep the line as plain text — no coral pill
 * treatment. The cake emoji on birthday is the only festive cue; for a
 * tiny lift, birthday-day text uses `text-accent`.
 */
function PetCardAgeLine({ pet }: { pet: Pet }) {
  if (!pet.date_of_birth) {
    const fallback = calculateAge(pet.date_of_birth, pet.approximate_age_months);
    return (
      <Text className="text-footnote text-text-secondary">{fallback}</Text>
    );
  }
  return <PetCardSmartAge name={pet.name} dob={pet.date_of_birth} />;
}

function PetCardSmartAge({ name, dob }: { name: string; dob: string }) {
  const { shortLabel, isFestive } = useAgeMoment(name, dob);
  return (
    <Text
      testID="pet-card-age"
      className={`text-footnote ${isFestive ? 'text-accent' : 'text-text-secondary'}`}
    >
      {shortLabel}
    </Text>
  );
}

export function PetCard({ pet, onPress }: PetCardProps) {
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
          <Text className="text-headline text-text-primary">
            {pet.name}
          </Text>
          <Text className="text-footnote text-text-secondary">
            {pet.breed ?? 'Mixed / Unknown'}
          </Text>
          <PetCardAgeLine pet={pet} />
        </View>
        <Text className="text-title text-text-secondary">
          {pet.pet_type === 'dog' ? '🐕' : '🐈'}
        </Text>
      </View>
    </Card>
  );
}
