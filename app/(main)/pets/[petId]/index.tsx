import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { FAB } from '@/components/ui/FAB';
import { StickyHeader } from '@/components/pets/StickyHeader';
import { HealthSummaryCard } from '@/components/pets/HealthSummaryCard';
import { CurrentFoodCard } from '@/components/pets/CurrentFoodCard';
import { QuickAddSheet, QuickAddAction } from '@/components/pets/QuickAddSheet';
import { usePet } from '@/hooks/usePet';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useVaccinations } from '@/hooks/useVaccinations';
import { Colors } from '@/constants/colors';

export default function PetDetailScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { pet, loading, error, refresh } = usePet(petId!);
  const { currentFood, refresh: refreshFood } = useFoodEntries(petId!);
  const { vaccinations, refresh: refreshVaccinations } = useVaccinations(petId!);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
      refreshFood();
      refreshVaccinations();
    });
    return unsubscribe;
  }, [navigation, refresh, refreshFood, refreshVaccinations]);

  const openSheet = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleQuickAdd = (action: QuickAddAction) => {
    if (action === 'vaccination') {
      router.push(`/(main)/pets/${petId}/health/vaccination/add`);
      return;
    }
    if (action === 'food-change') {
      router.push(`/(main)/pets/${petId}/food/add?change=true`);
      return;
    }
    const labels: Record<QuickAddAction, string> = {
      'vet-visit': 'Vet Visit',
      vaccination: 'Vaccination',
      medication: 'Medication',
      weight: 'Weight',
      'food-change': 'Food Change',
    };
    Alert.alert(labels[action], 'Coming soon!');
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

  if (error || !pet) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-text-secondary text-base text-center mb-4">
            {error ?? 'Pet not found'}
          </Text>
          <View className="w-full">
            <Button title="Go Back" onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1">
        <StickyHeader pet={pet} onBack={() => router.back()} />
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <HealthSummaryCard
            petName={pet.name}
            vaccinations={vaccinations}
            onPress={() => router.push(`/(main)/pets/${petId}/health`)}
            onAddRecord={() =>
              router.push(`/(main)/pets/${petId}/health/vaccination/add`)
            }
          />
          <CurrentFoodCard
            petName={pet.name}
            foodEntry={currentFood}
            onAddFood={() => router.push(`/(main)/pets/${petId}/food/add`)}
            onChangeFood={() => router.push(`/(main)/pets/${petId}/food/add?change=true`)}
            onPress={() => router.push(`/(main)/pets/${petId}/food`)}
          />
        </ScrollView>
        <FAB onPress={openSheet} />
        <QuickAddSheet
          bottomSheetRef={bottomSheetRef}
          onSelect={handleQuickAdd}
        />
      </View>
    </Screen>
  );
}
