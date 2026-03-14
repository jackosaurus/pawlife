import { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PetCard } from '@/components/pets/PetCard';
import { usePets } from '@/hooks/usePets';
import { Colors } from '@/constants/colors';

const welcomeHero = require('@/assets/illustrations/welcome-hero.png');
const emptyPets = require('@/assets/illustrations/empty-pets.png');

export default function DashboardScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { pets, loading, error, refresh } = usePets();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refresh();
    });
    return unsubscribe;
  }, [navigation, refresh]);

  return (
    <Screen>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-text-primary">
            Your Pet Family
          </Text>
          <Pressable onPress={() => router.push('/(main)/settings')} hitSlop={8} testID="settings-button">
            <Ionicons
              name="settings-outline"
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
            <Text className="text-text-secondary text-base text-center mb-4">
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
            <Text className="text-xl font-semibold text-text-primary mb-2 mt-4">
              Welcome to Pawlife!
            </Text>
            <Text className="text-base text-text-secondary text-center mb-8">
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
            renderItem={({ item }) => (
              <PetCard
                pet={item}
                onPress={() => router.push(`/(main)/pets/${item.id}`)}
              />
            )}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="items-center mb-4">
                <Image
                  source={welcomeHero}
                  style={{ width: 200, height: 130 }}
                  resizeMode="contain"
                />
              </View>
            }
            ListFooterComponent={
              <Card
                onPress={() => router.push('/(main)/pets/add')}
                className="p-4 mb-3 items-center border border-dashed border-border"
              >
                <Ionicons name="add" size={28} color={Colors.textSecondary} />
                <Text className="text-text-secondary text-sm mt-1">
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
