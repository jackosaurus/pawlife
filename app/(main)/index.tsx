import { useEffect, useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PetCard } from '@/components/pets/PetCard';
import { NeedsAttentionSummary } from '@/components/dashboard/NeedsAttentionSummary';
import { PetActionList } from '@/components/dashboard/PetActionList';
import { usePets } from '@/hooks/usePets';
import { useActionItems } from '@/hooks/useActionItems';
import { healthService } from '@/services/healthService';
import { Colors } from '@/constants/colors';
import { ActionItem } from '@/types';

const welcomeHero = require('@/assets/illustrations/welcome-hero.png');
const emptyPets = require('@/assets/images/welcome-hero.png');

export default function DashboardScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { pets, loading, error, refresh } = usePets();
  const { actionItems, refresh: refreshActions } = useActionItems(pets);
  const [loggingDose, setLoggingDose] = useState<string | null>(null);

  const refreshAll = useCallback(() => {
    refresh();
    refreshActions();
  }, [refresh, refreshActions]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshAll();
    });
    return unsubscribe;
  }, [navigation, refreshAll]);

  const handleLogDose = useCallback(async (medicationId: string) => {
    if (loggingDose) return;
    try {
      setLoggingDose(medicationId);
      await healthService.logMedicationDose({
        medication_id: medicationId,
        given_at: new Date().toISOString(),
      });
      refreshActions();
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoggingDose(null);
    }
  }, [loggingDose, refreshActions]);

  const handleLogVaccination = useCallback(async (vaccinationId: string, intervalMonths: number) => {
    if (loggingDose) return;
    try {
      setLoggingDose(vaccinationId);
      const today = new Date();
      await healthService.logVaccinationDose(
        {
          vaccination_id: vaccinationId,
          date_administered: today.toISOString().split('T')[0],
        },
        intervalMonths,
      );
      refreshActions();
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoggingDose(null);
    }
  }, [loggingDose, refreshActions]);

  // Group action items by pet ID once per actionItems change
  const itemsByPetId = useMemo(() => {
    const map = new Map<string, ActionItem[]>();
    for (const item of actionItems) {
      const existing = map.get(item.petId);
      if (existing) {
        existing.push(item);
      } else {
        map.set(item.petId, [item]);
      }
    }
    return map;
  }, [actionItems]);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-largeTitle text-text-primary">
            Your Pet Family
          </Text>
          <Pressable onPress={() => router.push('/(main)/menu')} hitSlop={8} testID="menu-button">
            <Ionicons
              name="paw-outline"
              size={24}
              color={Colors.textSecondary}
            />
          </Pressable>
        </View>

        {loading && pets.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-text-secondary text-body text-center mb-4">
              {error}
            </Text>
            <View className="w-full">
              <Button title="Try Again" onPress={refresh} />
            </View>
          </View>
        ) : pets.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Image
              source={emptyPets}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
            <Text className="text-title font-semibold text-text-primary mb-2 mt-4">
              Welcome to Bemy!
            </Text>
            <Text className="text-body text-text-secondary text-center mb-8">
              Let's meet your pet family.
            </Text>
            <View className="w-full">
              <Button
                title="Add Your First Pet"
                onPress={() => router.push('/(main)/pets/add')}
              />
            </View>
          </View>
        ) : (
          <FlatList
            data={pets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const petItems = itemsByPetId.get(item.id) ?? [];
              return (
                <View>
                  <PetCard
                    pet={item}
                    onPress={() => router.push(`/(main)/pets/${item.id}`)}
                  />
                  <PetActionList
                    petId={item.id}
                    petName={item.name}
                    items={petItems}
                    onLogDose={handleLogDose}
                    onLogVaccination={handleLogVaccination}
                  />
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                <View className="items-center mb-4">
                  <Image
                    source={welcomeHero}
                    style={{ width: 200, height: 130 }}
                    resizeMode="contain"
                  />
                </View>
                <NeedsAttentionSummary items={actionItems} />
              </>
            }
            ListFooterComponent={
              <Card
                onPress={() => router.push('/(main)/pets/add')}
                className="p-4 mb-3 items-center border border-dashed border-border"
              >
                <Ionicons name="add" size={28} color={Colors.textSecondary} />
                <Text className="text-text-secondary text-button-sm mt-1">
                  Add to your family
                </Text>
              </Card>
            }
          />
        )}
      </View>
    </Screen>
  );
}
