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
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { Colors } from '@/constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
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

  useEffect(() => {
    if (userId) {
      initializeSettings(userId);
      loadDisplayName();
    }
  }, [userId, initializeSettings, loadDisplayName]);

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
    <Text className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2 ml-1 mt-6">
      {title}
    </Text>
  );

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8} testID="back-button">
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
