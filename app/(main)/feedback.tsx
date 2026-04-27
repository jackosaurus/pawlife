import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput as RNTextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAuthStore } from '@/stores/authStore';
import { feedbackService } from '@/services/feedbackService';
import { Colors } from '@/constants/colors';

type FeedbackCategory = 'bug' | 'idea';

export default function FeedbackScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const canSubmit = description.trim().length > 0 && !submitting;

  const handleCategorySelect = (value: string) => {
    // Toggle: if already selected, deselect
    if (value === category) {
      setCategory(null);
    } else {
      setCategory(value as FeedbackCategory);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await feedbackService.submit({
        user_id: session?.user.id ?? null,
        user_email: session?.user.email ?? null,
        category,
        description: description.trim(),
        app_version: Constants.expoConfig?.version ?? null,
        device_model: Device.modelName ?? null,
        os_name: Device.osName ?? null,
        os_version: Device.osVersion ?? null,
        screen_name: 'settings',
      });
      Alert.alert('Thanks!', 'Your feedback has been sent.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const borderColor = focused ? Colors.primary : Colors.border;

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text className="text-headline text-text-primary">
            Send Feedback
          </Text>
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              hitSlop={8}
              testID="send-button"
            >
              <Text
                className={`text-callout font-semibold ${
                  canSubmit ? 'text-primary' : 'text-text-secondary opacity-40'
                }`}
              >
                Send
              </Text>
            </Pressable>
          )}
        </View>

        {/* Form */}
        <Card className="px-5 pt-4 pb-5">
          <Text className="text-text-secondary text-body mb-1.5">
            Category
          </Text>
          <SegmentedControl
            options={[
              { label: 'Bug', value: 'bug' },
              { label: 'Idea', value: 'idea' },
            ]}
            selected={category ?? ''}
            onSelect={handleCategorySelect}
          />

          <View className="mt-4">
            <Text className="text-text-secondary text-body mb-1.5">
              Description
            </Text>
            <View
              style={{ borderColor, borderWidth: 1, borderRadius: 12 }}
              className="bg-white px-4"
            >
              <RNTextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What's on your mind? Describe the issue or share your idea..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                textAlignVertical="top"
                style={{ minHeight: 120, paddingTop: 14, paddingBottom: 14 }}
                className="text-body text-text-primary"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                testID="description-input"
              />
            </View>
          </View>
        </Card>

        <Text className="text-text-secondary text-caption mt-3 ml-1">
          We'll automatically include device info to help us investigate.
        </Text>
      </View>
    </Screen>
  );
}
