import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useFamilyStore } from '@/stores/familyStore';
import { familyService, normalizeInviteCode } from '@/services/familyService';
import { Colors } from '@/constants/colors';
import { InvitePreview } from '@/types';

export default function JoinFamilyScreen() {
  const router = useRouter();
  const loadFamily = useFamilyStore((s) => s.loadFamily);
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    const normalized = normalizeInviteCode(code);
    if (normalized.length !== 8) {
      setError('Please enter a valid 8-character invite code');
      return;
    }

    setPreviewing(true);
    setError(null);
    setPreview(null);

    try {
      const result = await familyService.previewInvite(normalized);
      setPreview(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid or expired invite code';
      setError(message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleJoin = async () => {
    const normalized = normalizeInviteCode(code);
    setJoining(true);
    setError(null);

    try {
      await familyService.acceptInvite(normalized);
      await loadFamily();
      Alert.alert('Welcome!', 'You have joined the family.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('[join-family] accept error:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to join family';
      setError(message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-largeTitle text-text-primary mb-2">
          Join a Family
        </Text>
        <Text className="text-text-secondary text-body mb-6">
          Enter the invite code shared with you by a family admin.
        </Text>

        {error && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-footnote">{error}</Text>
          </View>
        )}

        <Card className="px-5 pt-4 mb-4">
          <TextInput
            label="Invite Code"
            placeholder="e.g. ABC-123"
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              setPreview(null);
              setError(null);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </Card>

        {!preview && (
          <Button
            title="Look Up Code"
            variant="secondary"
            onPress={handlePreview}
            loading={previewing}
            disabled={normalizeInviteCode(code).length < 8}
          />
        )}

        {preview && (
          <>
            <Card className="p-4 mb-4">
              <Text className="text-eyebrow uppercase text-text-secondary mb-2">
                You're joining
              </Text>
              <Text className="text-text-primary text-headline">
                "{preview.family_name}"
              </Text>
            </Card>

            <View className="bg-status-amber/10 rounded-xl px-4 py-3 mb-4">
              <Text className="text-text-secondary text-footnote">
                Your existing pets will move to this family.
              </Text>
            </View>

            <Button
              title="Join Family"
              onPress={handleJoin}
              loading={joining}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
