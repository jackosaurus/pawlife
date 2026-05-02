import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { familyService } from '@/services/familyService';
import { Colors } from '@/constants/colors';

interface DeletionContext {
  activePetCount: number;
  archivedPetCount: number;
  otherFamilyMemberCount: number;
  isSoleAdmin: boolean;
}

/**
 * Compose the body copy for the Delete Account confirmation modal.
 *
 * The copy is intentionally count-based (never lists pet names) and uses
 * no hyphens of any kind. Sentences are short. Lists use bullet points.
 *
 * Lines that would render with a count of 0 are omitted entirely.
 */
export function buildDeletionBody(ctx: DeletionContext | null): string {
  const activePetCount = ctx?.activePetCount ?? 0;
  const archivedPetCount = ctx?.archivedPetCount ?? 0;
  const otherFamilyMemberCount = ctx?.otherFamilyMemberCount ?? 0;
  const isSoleAdmin = ctx?.isSoleAdmin ?? false;

  const lines: string[] = [];

  if (activePetCount > 0) {
    lines.push(
      `• ${activePetCount} active ${pluralize('pet', activePetCount)}`,
    );
  }
  if (archivedPetCount > 0) {
    lines.push(
      `• ${archivedPetCount} archived ${pluralize('pet', archivedPetCount)}`,
    );
  }
  lines.push('• All your health, food, and weight records');
  lines.push('• All photos you have uploaded');

  if (otherFamilyMemberCount > 0) {
    const memberWord = pluralize('member', otherFamilyMemberCount);
    if (isSoleAdmin) {
      lines.push(
        `• Your family and the ${otherFamilyMemberCount} other ${memberWord} you share it with. The family itself will be deleted.`,
      );
    } else {
      lines.push(
        `• Your access to the family you share with ${otherFamilyMemberCount} other ${memberWord}`,
      );
    }
  }

  return [
    'This permanently deletes your account and everything in it.',
    '',
    'What gets deleted:',
    ...lines,
    '',
    'Your account will no longer exist and you will not be able to sign back in.',
    '',
    'This cannot be undone.',
  ].join('\n');
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const { show: showToast } = useToast();
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

  // Account deletion state
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [deletionContext, setDeletionContext] =
    useState<DeletionContext | null>(null);

  const userId = session?.user.id;
  const email = session?.user.email ?? '';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const loadDisplayName = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await userService.getProfile(userId);
      setDisplayName(profile.display_name ?? '');
    } catch {
      // Silently handle
    }
  }, [userId]);

  const loadDeletionContext = useCallback(async () => {
    if (!userId) return;
    try {
      const ctx = await familyService.getDeletionContext();
      setDeletionContext(ctx);
    } catch {
      // Silently degrade — body copy will use the generic fallback.
      setDeletionContext(null);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      initializeSettings(userId);
      loadDisplayName();
      loadDeletionContext();
    }
  }, [userId, initializeSettings, loadDisplayName, loadDeletionContext]);

  const handleOpenDeleteModal = () => {
    setDeletionError(null);
    setDeletionModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    setDeletionLoading(true);
    setDeletionError(null);
    try {
      await authService.deleteAccount();
      // Cascade has already removed the public.users row. Sign the user
      // out so the auth listener in the root layout routes back to
      // /(auth)/welcome.
      await signOut();
      setDeletionModalVisible(false);
      showToast('Account deleted.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not delete account. Please try again.';
      setDeletionError(message);
    } finally {
      setDeletionLoading(false);
    }
  };

  const handleCancelDelete = () => {
    if (deletionLoading) return;
    setDeletionModalVisible(false);
    setDeletionError(null);
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
    <Text className="text-text-secondary text-eyebrow uppercase mb-2 ml-1 mt-6">
      {title}
    </Text>
  );

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-largeTitle text-text-primary mb-2">
          Settings
        </Text>

        {/* Account Section */}
        {renderSection('Account')}
        <Card className="p-4 mb-1">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-text-secondary text-footnote">Signed in as</Text>
              <Text className="text-text-primary text-body font-medium">
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
                <Text className="text-text-secondary text-footnote">Display Name</Text>
                <Text
                  className={`text-body ${displayName ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
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
            <Text className="text-text-primary text-headline mb-3">
              Change Password
            </Text>
            {passwordError && (
              <View className="bg-status-overdue/10 rounded-xl px-4 py-2 mb-3">
                <Text className="text-status-overdue text-footnote">{passwordError}</Text>
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
              <Text className="text-text-primary text-body">Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Card>
          </Pressable>
        )}

        {/* Preferences Section */}
        {renderSection('Preferences')}
        <Card className="p-4">
          <Text className="text-text-primary text-headline mb-3">
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
              <Text className="text-text-primary text-headline">
                Push Reminders
              </Text>
              <Text className="text-text-secondary text-footnote">
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
                    <Text className="text-text-primary text-headline">
                      Medication Reminder Time
                    </Text>
                    <Text className="text-text-secondary text-footnote">
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
                          <Text className="text-text-primary text-body">
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
                <Text className="text-text-secondary text-caption mt-2">
                  Reminders fire at the top of the hour.
                </Text>
              </View>

              {/* Vaccination advance notice */}
              <View className="border-t border-border pt-4">
                <Text className="text-text-primary text-headline mb-1">
                  Vaccination Advance Notice
                </Text>
                <Text className="text-text-secondary text-footnote mb-2">
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

        {/* Account Management — destructive section, last */}
        {renderSection('Account Management')}
        <Pressable
          onPress={handleOpenDeleteModal}
          testID="delete-account-button"
        >
          <Card className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons
                name="trash-outline"
                size={20}
                color={Colors.destructive}
              />
              <Text
                className="text-body font-medium ml-3"
                style={{ color: Colors.destructive }}
              >
                Delete Account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </Card>
        </Pressable>

        {/* Inline error after a failed delete attempt — modal closes
            on success, but on error it stays open so the user can retry.
            We also show the error here for accessibility / visibility
            after the modal closes (e.g. if ConfirmationModal in a future
            iteration auto-dismisses on cancel). */}
        {deletionError && !deletionModalVisible && (
          <View className="mt-3 bg-status-overdue/10 rounded-xl px-4 py-2">
            <Text className="text-status-overdue text-footnote">
              {deletionError}
            </Text>
          </View>
        )}

        {/* App Version */}
        <View className="mt-8 items-center">
          <Text className="text-text-secondary text-caption">
            Bemy v{appVersion}
          </Text>
        </View>
      </View>

      <ConfirmationModal
        visible={deletionModalVisible}
        title="Delete Account"
        message={buildDeletionBody(deletionContext)}
        confirmLabel="Delete Account"
        severity="irreversible"
        typedConfirmationWord="DELETE"
        loading={deletionLoading}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Inline error displayed inside the modal context — the
          ConfirmationModal does not yet support an errorMessage prop, so
          we render it adjacent in the screen. The modal stays open so
          the user can retry. */}
      {deletionError && deletionModalVisible && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: 200,
          }}
        >
          <View className="bg-status-overdue rounded-xl px-4 py-3">
            <Text
              className="text-white text-footnote font-medium text-center"
              testID="deletion-error"
            >
              {deletionError}
            </Text>
          </View>
        </View>
      )}
    </Screen>
  );
}
