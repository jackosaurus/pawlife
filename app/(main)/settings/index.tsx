import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { useFamilyStore } from '@/stores/familyStore';
import { petService } from '@/services/petService';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { familyService, formatInviteCode } from '@/services/familyService';
import { Colors } from '@/constants/colors';
import { formatDistanceToNow } from '@/utils/dates';
import { Pet, FamilyInvite } from '@/types';

export default function SettingsScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const setWeightUnit = useSettingsStore((s) => s.setWeightUnit);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const setRemindersEnabled = useSettingsStore((s) => s.setRemindersEnabled);
  const medicationReminderTime = useSettingsStore(
    (s) => s.medicationReminderTime,
  );
  const setMedicationReminderTime = useSettingsStore(
    (s) => s.setMedicationReminderTime,
  );
  const vaccinationAdvanceDays = useSettingsStore(
    (s) => s.vaccinationAdvanceDays,
  );
  const setVaccinationAdvanceDays = useSettingsStore(
    (s) => s.setVaccinationAdvanceDays,
  );
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

  // Reminder time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Display name state
  const [displayName, setDisplayName] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  // Family state
  const family = useFamilyStore((s) => s.family);
  const members = useFamilyStore((s) => s.members);
  const myRole = useFamilyStore((s) => s.myRole);
  const familyLoading = useFamilyStore((s) => s.loading);
  const loadFamily = useFamilyStore((s) => s.loadFamily);
  const [activeInvite, setActiveInvite] = useState<FamilyInvite | null>(null);
  const [editingFamilyName, setEditingFamilyName] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [savingFamilyName, setSavingFamilyName] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [leavingFamily, setLeavingFamily] = useState(false);
  const [revokingInvite, setRevokingInvite] = useState(false);

  const userId = session?.user.id;
  const email = session?.user.email ?? '';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const isAdmin = myRole === 'admin';

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

  const loadActiveInvite = useCallback(async () => {
    if (!family || myRole !== 'admin') return;
    try {
      const invite = await familyService.getActiveInvite(family.id);
      setActiveInvite(invite);
    } catch {
      // Silently handle
    }
  }, [family, myRole]);

  const loadDisplayName = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await userService.getProfile(userId);
      setDisplayName(profile.display_name ?? '');
    } catch {
      // Silently handle
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      initializeSettings(userId);
      loadDisplayName();
    }
    loadPets();
    loadFamily();
  }, [userId, initializeSettings, loadPets, loadFamily, loadDisplayName]);

  useEffect(() => {
    loadActiveInvite();
  }, [loadActiveInvite]);

  const handleSaveFamilyName = async () => {
    if (!family || !familyNameInput.trim()) return;
    setSavingFamilyName(true);
    try {
      await familyService.updateFamilyName(family.id, familyNameInput.trim());
      await loadFamily();
      setEditingFamilyName(false);
    } catch {
      Alert.alert('Error', 'Failed to update family name.');
    } finally {
      setSavingFamilyName(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!userId) return;
    const trimmed = displayNameInput.trim();
    setSavingDisplayName(true);
    try {
      await userService.updateProfile(userId, {
        display_name: trimmed || null,
      });
      setDisplayName(trimmed);
      setEditingDisplayName(false);
    } catch {
      Alert.alert('Error', 'Failed to update display name.');
    } finally {
      setSavingDisplayName(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${memberName} from the family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingMemberId(memberId);
              await familyService.removeMember(memberId);
              await loadFamily();
              await loadActiveInvite();
            } catch {
              Alert.alert('Error', 'Failed to remove member.');
            } finally {
              setRemovingMemberId(null);
            }
          },
        },
      ],
    );
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      'Leave Family',
      'Are you sure? Your pets will stay with this family.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLeavingFamily(true);
              await familyService.leaveFamily();
              await loadFamily();
              await loadPets();
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Failed to leave family';
              Alert.alert('Error', message);
            } finally {
              setLeavingFamily(false);
            }
          },
        },
      ],
    );
  };

  const handleRevokeInvite = () => {
    if (!activeInvite) return;
    Alert.alert('Revoke Invite', 'This will invalidate the current invite code.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            setRevokingInvite(true);
            await familyService.revokeInvite(activeInvite.id);
            setActiveInvite(null);
          } catch {
            Alert.alert('Error', 'Failed to revoke invite.');
          } finally {
            setRevokingInvite(false);
          }
        },
      },
    ]);
  };

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

  const handleRemindersToggle = (value: boolean) => {
    if (userId) {
      setRemindersEnabled(userId, value);
    }
  };

  const handleTimeChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate && userId) {
      // Reminders fire on the hour via pg_cron, so any selected minutes
      // would be ignored. Round to the picked hour so the stored value
      // matches what will actually happen.
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      setMedicationReminderTime(userId, `${hours}:00`);
    }
  };

  const handleAdvanceDaysToggle = (value: string) => {
    if (userId) {
      setVaccinationAdvanceDays(userId, parseInt(value, 10));
    }
  };

  const reminderTimeDate = (() => {
    const [h, m] = medicationReminderTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  })();

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
        {/* Display Name */}
        {editingDisplayName ? (
          <Card className="p-4 mt-3">
            <TextInput
              label="Display Name"
              placeholder="Set your name"
              value={displayNameInput}
              onChangeText={setDisplayNameInput}
              autoFocus
              autoCapitalize="words"
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setEditingDisplayName(false)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Save"
                  onPress={handleSaveDisplayName}
                  loading={savingDisplayName}
                />
              </View>
            </View>
          </Card>
        ) : (
          <Pressable
            onPress={() => {
              setDisplayNameInput(displayName);
              setEditingDisplayName(true);
            }}
            className="mt-3"
            testID="edit-display-name-button"
          >
            <Card className="p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-text-secondary text-sm">Display Name</Text>
                <Text
                  className={`text-base ${displayName ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
                >
                  {displayName || 'Set your name'}
                </Text>
              </View>
              <Ionicons
                name="pencil-outline"
                size={18}
                color={Colors.textSecondary}
              />
            </Card>
          </Pressable>
        )}
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

        {/* Reminders Section */}
        {renderSection('Reminders')}
        <Card className="p-4">
          {/* Master toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-text-primary text-base font-medium">
                Push Reminders
              </Text>
              <Text className="text-text-secondary text-sm">
                Get notified about medications and vaccinations
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={handleRemindersToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
              testID="reminders-toggle"
            />
          </View>

          {remindersEnabled && (
            <>
              {/* Medication reminder time */}
              <View className="border-t border-border pt-4 mb-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-text-primary text-base font-medium">
                      Medication Reminder Time
                    </Text>
                    <Text className="text-text-secondary text-sm">
                      Daily reminder to log medications
                    </Text>
                  </View>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={reminderTimeDate}
                      mode="time"
                      display="compact"
                      minuteInterval={30}
                      onChange={handleTimeChange}
                      testID="reminder-time-picker"
                    />
                  ) : (
                    <>
                      <Pressable
                        onPress={() => setShowTimePicker(true)}
                        testID="reminder-time-button"
                      >
                        <View className="bg-input-fill rounded-xl px-4 py-3">
                          <Text className="text-text-primary text-base">
                            {formatTime(medicationReminderTime)}
                          </Text>
                        </View>
                      </Pressable>
                      {showTimePicker && (
                        <DateTimePicker
                          value={reminderTimeDate}
                          mode="time"
                          display="default"
                          minuteInterval={30}
                          onChange={handleTimeChange}
                          testID="reminder-time-picker"
                        />
                      )}
                    </>
                  )}
                </View>
                <Text className="text-text-secondary text-xs mt-2">
                  Reminders fire at the top of the hour.
                </Text>
              </View>

              {/* Vaccination advance notice */}
              <View className="border-t border-border pt-4">
                <Text className="text-text-primary text-base font-medium mb-1">
                  Vaccination Advance Notice
                </Text>
                <Text className="text-text-secondary text-sm mb-2">
                  How early to remind about upcoming vaccinations
                </Text>
                <SegmentedControl
                  options={[
                    { label: '1 week', value: '7' },
                    { label: '2 weeks', value: '14' },
                    { label: '1 month', value: '30' },
                  ]}
                  selected={String(vaccinationAdvanceDays)}
                  onSelect={handleAdvanceDaysToggle}
                />
              </View>
            </>
          )}
        </Card>

        {/* Family Section */}
        {renderSection('Family')}
        {familyLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : family ? (
          <Card className="p-4">
            {/* Family Name */}
            {editingFamilyName ? (
              <View className="mb-3">
                <TextInput
                  label="Family Name"
                  value={familyNameInput}
                  onChangeText={setFamilyNameInput}
                  autoFocus
                />
                <View className="flex-row gap-3 mt-2">
                  <View className="flex-1">
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setEditingFamilyName(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title="Save"
                      onPress={handleSaveFamilyName}
                      loading={savingFamilyName}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-text-primary text-lg font-semibold">
                  {family.name}
                </Text>
                {isAdmin && (
                  <Pressable
                    onPress={() => {
                      setFamilyNameInput(family.name);
                      setEditingFamilyName(true);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
            )}

            {/* Member List */}
            {members.map((member) => {
              const isMe = member.user_id === userId;
              const memberDisplayName = isMe
                ? displayName || email
                : member.display_name || 'No name set';
              const nameWithYou = isMe
                ? `${memberDisplayName} (You)`
                : memberDisplayName;
              const roleLabel =
                member.role === 'admin' ? 'Admin' : 'Member';
              const joinedLabel = member.joined_at
                ? `Joined ${formatDistanceToNow(member.joined_at)}`
                : '';

              return (
                <View
                  key={member.id}
                  className="flex-row items-center py-3 border-t border-border"
                >
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-text-primary text-sm font-medium"
                      numberOfLines={1}
                    >
                      {nameWithYou}
                    </Text>
                    <Text className="text-text-secondary text-xs">
                      {roleLabel}{joinedLabel ? ` · ${joinedLabel}` : ''}
                    </Text>
                  </View>
                  {isAdmin && !isMe && (
                    <Pressable
                      onPress={() =>
                        handleRemoveMember(
                          member.id,
                          member.display_name || 'this member',
                        )
                      }
                      disabled={removingMemberId === member.id}
                      hitSlop={8}
                    >
                      {removingMemberId === member.id ? (
                        <ActivityIndicator size="small" color={Colors.statusOverdue} />
                      ) : (
                        <Ionicons
                          name="close-circle-outline"
                          size={20}
                          color={Colors.statusOverdue}
                        />
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })}

            {/* Active Invite Display */}
            {isAdmin && activeInvite && (
              <View className="flex-row items-center justify-between mt-3 bg-input-fill rounded-xl px-3 py-2">
                <View className="flex-1">
                  <Text className="text-text-secondary text-xs">Active invite</Text>
                  <Text className="text-text-primary text-sm font-medium">
                    {formatInviteCode(activeInvite.invite_code)}
                  </Text>
                  <Text className="text-text-secondary text-xs">
                    Expires {new Date(activeInvite.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Pressable
                  onPress={handleRevokeInvite}
                  disabled={revokingInvite}
                  hitSlop={8}
                >
                  {revokingInvite ? (
                    <ActivityIndicator size="small" color={Colors.statusOverdue} />
                  ) : (
                    <Ionicons
                      name="close-circle-outline"
                      size={20}
                      color={Colors.statusOverdue}
                    />
                  )}
                </Pressable>
              </View>
            )}

            {/* Contextual action buttons */}
            {isAdmin && members.length === 1 && (
              /* Solo admin: show Invite + Join side by side */
              <View className="flex-row gap-3 mt-3">
                <View className="flex-1">
                  <Button
                    title="Invite Member"
                    onPress={() => router.push('/(main)/settings/invite-member')}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Join a Family"
                    variant="secondary"
                    onPress={() => router.push('/(main)/settings/join-family')}
                  />
                </View>
              </View>
            )}

            {isAdmin && members.length > 1 && (
              /* Admin with members: Invite only */
              <View className="mt-3">
                <Button
                  title="Invite Member"
                  variant="secondary"
                  onPress={() => router.push('/(main)/settings/invite-member')}
                  disabled={members.length >= 4}
                />
              </View>
            )}

            {!isAdmin && (
              /* Member: Leave Family */
              <View className="mt-3">
                <Button
                  title="Leave Family"
                  variant="secondary"
                  onPress={handleLeaveFamily}
                  loading={leavingFamily}
                />
              </View>
            )}
          </Card>
        ) : null}

        {/* Pet Family Section */}
        {renderSection('Your Pets')}
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

        {/* Support Section */}
        {renderSection('Support')}
        <Pressable
          onPress={() => router.push('/(main)/feedback')}
          testID="send-feedback-button"
        >
          <Card className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={Colors.textSecondary}
              />
              <Text className="text-text-primary text-base ml-3">
                Send Feedback
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </Card>
        </Pressable>

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
