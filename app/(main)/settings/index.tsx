import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { petService } from '@/services/petService';
import { authService } from '@/services/authService';
import { Colors } from '@/constants/colors';
import { Pet } from '@/types';

export default function SettingsScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const setWeightUnit = useSettingsStore((s) => s.setWeightUnit);
  const initializeSettings = useSettingsStore((s) => s.initialize);

  const [activePets, setActivePets] = useState<Pet[]>([]);
  const [archivedPets, setArchivedPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const userId = session?.user.id;
  const email = session?.user.email ?? '';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const loadPets = useCallback(async () => {
    try {
      setLoadingPets(true);
      const [active, archived] = await Promise.all([
        petService.getAll(),
        petService.getArchived(),
      ]);
      setActivePets(active);
      setArchivedPets(archived);
    } catch {
      // Silently handle — pets will show empty
    } finally {
      setLoadingPets(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      initializeSettings(userId);
    }
    loadPets();
  }, [userId, initializeSettings, loadPets]);

  const handleRestore = async (pet: Pet) => {
    Alert.alert(
      `Restore ${pet.name}?`,
      `${pet.name} will be back in your active pet family.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              setRestoringId(pet.id);
              await petService.restore(pet.id);
              await loadPets();
            } catch {
              Alert.alert('Error', 'Failed to restore pet. Please try again.');
            } finally {
              setRestoringId(null);
            }
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(newPassword);
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been updated.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  const handleWeightToggle = (value: string) => {
    if (userId && (value === 'kg' || value === 'lbs')) {
      setWeightUnit(userId, value);
    }
  };

  const renderSection = (title: string) => (
    <Text className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 ml-1 mt-6">
      {title}
    </Text>
  );

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-3xl font-bold text-text-primary mb-2">
          Settings
        </Text>

        {/* Account Section */}
        {renderSection('Account')}
        <Card className="p-4 mb-1">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-text-secondary text-sm">Signed in as</Text>
              <Text className="text-text-primary text-base font-medium">
                {email}
              </Text>
            </View>
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </View>
        </Card>
        {/* Change Password */}
        {showChangePassword ? (
          <Card className="p-4 mt-3">
            <Text className="text-text-primary text-base font-medium mb-3">
              Change Password
            </Text>
            {passwordError && (
              <View className="bg-status-overdue/10 rounded-xl px-4 py-2 mb-3">
                <Text className="text-status-overdue text-sm">{passwordError}</Text>
              </View>
            )}
            <TextInput
              label="New Password"
              placeholder="At least 6 characters"
              secureTextEntry
              onChangeText={setNewPassword}
              value={newPassword}
            />
            <TextInput
              label="Confirm Password"
              placeholder="Re-enter new password"
              secureTextEntry
              onChangeText={setConfirmPassword}
              value={confirmPassword}
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setShowChangePassword(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError(null);
                  }}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Update"
                  onPress={handleChangePassword}
                  loading={changingPassword}
                />
              </View>
            </View>
          </Card>
        ) : (
          <Pressable
            onPress={() => setShowChangePassword(true)}
            className="mt-3"
            testID="change-password-button"
          >
            <Card className="p-4 flex-row items-center justify-between">
              <Text className="text-text-primary text-base">Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Card>
          </Pressable>
        )}

        <View className="mt-3">
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="secondary"
          />
        </View>

        {/* Preferences Section */}
        {renderSection('Preferences')}
        <Card className="p-4">
          <Text className="text-text-primary text-base font-medium mb-3">
            Weight Unit
          </Text>
          <SegmentedControl
            options={[
              { label: 'Kilograms (kg)', value: 'kg' },
              { label: 'Pounds (lbs)', value: 'lbs' },
            ]}
            selected={weightUnit}
            onSelect={handleWeightToggle}
          />
        </Card>

        {/* Pet Family Section */}
        {renderSection('Pet Family')}
        {loadingPets ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <>
            {activePets.length === 0 ? (
              <Card className="p-4 items-center">
                <Text className="text-text-secondary text-sm">
                  No active pets yet
                </Text>
              </Card>
            ) : (
              activePets.map((pet) => (
                <Card
                  key={pet.id}
                  onPress={() =>
                    router.push(`/(main)/pets/${pet.id}/edit`)
                  }
                  className="p-4 mb-2"
                >
                  <View className="flex-row items-center">
                    <Avatar
                      uri={pet.profile_photo_url}
                      name={pet.name}
                      size="sm"
                      petType={pet.pet_type}
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-text-primary text-base font-medium">
                        {pet.name}
                      </Text>
                      <Text className="text-text-secondary text-sm">
                        {pet.breed ?? 'Mixed / Unknown'}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </View>
                </Card>
              ))
            )}

            {/* Archived Pets */}
            {archivedPets.length > 0 && (
              <>
                {renderSection('Archived Pets')}
                {archivedPets.map((pet) => (
                  <Card key={pet.id} className="p-4 mb-2">
                    <View className="flex-row items-center">
                      <Avatar
                        uri={pet.profile_photo_url}
                        name={pet.name}
                        size="sm"
                        petType={pet.pet_type}
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-text-primary text-base font-medium opacity-60">
                          {pet.name}
                        </Text>
                        <Text className="text-text-secondary text-sm opacity-60">
                          {pet.breed ?? 'Mixed / Unknown'}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleRestore(pet)}
                        disabled={restoringId === pet.id}
                        hitSlop={8}
                        testID={`restore-${pet.id}`}
                      >
                        {restoringId === pet.id ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.primary}
                          />
                        ) : (
                          <Text className="text-primary text-sm font-semibold">
                            Restore
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        {/* App Version */}
        <View className="mt-8 items-center">
          <Text className="text-text-secondary text-xs">
            Pawlife v{appVersion}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
