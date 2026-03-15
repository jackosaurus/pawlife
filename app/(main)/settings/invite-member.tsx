import { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFamilyStore } from '@/stores/familyStore';
import { familyService, formatInviteCode } from '@/services/familyService';
import { Colors } from '@/constants/colors';
import { FamilyInvite } from '@/types';

export default function InviteMemberScreen() {
  const router = useRouter();
  const family = useFamilyStore((s) => s.family);
  const [invite, setInvite] = useState<FamilyInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createOrGetInvite = async () => {
      if (!family) return;
      try {
        setLoading(true);
        setError(null);
        const newInvite = await familyService.createInvite(family.id);
        setInvite(newInvite);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create invite';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    createOrGetInvite();
  }, [family]);

  const formattedCode = invite ? formatInviteCode(invite.invite_code) : '';

  const handleShare = async () => {
    if (!formattedCode) return;
    try {
      await Share.share({
        message: `Join my pet family on Pawlife! Use code: ${formattedCode}`,
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const handleCopy = async () => {
    if (!formattedCode) return;
    try {
      await Clipboard.setStringAsync(formattedCode);
      Alert.alert('Copied', 'Invite code copied to clipboard.');
    } catch {
      Alert.alert('Error', 'Failed to copy code.');
    }
  };

  const daysUntilExpiry = invite
    ? Math.max(
        0,
        Math.ceil(
          (new Date(invite.expires_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        <Pressable onPress={() => router.back()} className="mb-4" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text className="text-3xl font-bold text-text-primary mb-2">
          Invite Member
        </Text>
        <Text className="text-text-secondary text-base mb-6">
          Share this code with the person you'd like to invite.
        </Text>

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-text-secondary text-sm mt-3">
              Generating invite code...
            </Text>
          </View>
        ) : error ? (
          <Card className="p-4 items-center">
            <Text className="text-status-overdue text-sm">{error}</Text>
          </Card>
        ) : invite ? (
          <>
            <Card className="p-6 items-center mb-6">
              <Text
                className="text-text-primary text-4xl font-bold tracking-widest"
                selectable
              >
                {formattedCode}
              </Text>
              <Text className="text-text-secondary text-sm mt-3">
                Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
              </Text>
            </Card>

            <View className="gap-3">
              <Button title="Share Code" onPress={handleShare} />
              <Button title="Copy Code" variant="secondary" onPress={handleCopy} />
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
