import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { MenuRow } from '@/components/ui/MenuRow';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/userService';
import { Colors } from '@/constants/colors';

export default function MenuScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  const userId = session?.user.id;
  const email = session?.user.email ?? '';

  const [displayName, setDisplayName] = useState<string>('');
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadDisplayName = async () => {
      if (!userId) return;
      try {
        const profile = await userService.getProfile(userId);
        if (!cancelled) {
          setDisplayName(profile.display_name ?? '');
        }
      } catch {
        // Silently handle — name falls back to email
      }
    };
    loadDisplayName();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleNavigate = (path: '/(main)/settings' | '/(main)/pet-family' | '/(main)/feedback') => {
    router.push(path);
  };

  const handleSignOut = () => {
    setShowSignOut(true);
  };

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      // Dismiss the sheet first so the root layout's auth redirect
      // doesn't race with an open modal.
      router.back();
      await signOut();
    } finally {
      setSigningOut(false);
      setShowSignOut(false);
    }
  };

  const heading = displayName || email || 'Account';

  return (
    <Screen scroll edges={['left', 'right']}>
      <View className="px-5 pt-6 pb-8">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <View
            className="w-10 h-10 rounded-full bg-input-fill items-center justify-center mr-3"
            testID="menu-avatar"
          >
            <Ionicons
              name="person-circle-outline"
              size={40}
              color={Colors.primary}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-text-primary text-base font-semibold"
              numberOfLines={1}
              testID="menu-display-name"
            >
              {heading}
            </Text>
            {displayName && email ? (
              <Text
                className="text-text-secondary text-sm"
                numberOfLines={1}
                testID="menu-email"
              >
                {email}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-border mb-2" />

        {/* Menu rows */}
        <View>
          <MenuRow
            label="Settings"
            icon="settings-outline"
            onPress={() => handleNavigate('/(main)/settings')}
            testID="menu-row-settings"
          />
          <MenuRow
            label="Pet Family"
            icon="people-outline"
            onPress={() => handleNavigate('/(main)/pet-family')}
            testID="menu-row-pet-family"
          />
          <MenuRow
            label="Send Feedback"
            icon="chatbubble-outline"
            onPress={() => handleNavigate('/(main)/feedback')}
            testID="menu-row-feedback"
          />
        </View>

        {/* Divider */}
        <View className="h-px bg-border my-2" />

        {/* Destructive action */}
        <MenuRow
          label="Sign Out"
          onPress={handleSignOut}
          destructive
          testID="menu-row-signout"
        />
      </View>

      <ConfirmationModal
        visible={showSignOut}
        title="Sign out?"
        message="You'll need to sign in again to access your pet family."
        confirmLabel="Sign Out"
        severity="standard"
        onConfirm={handleConfirmSignOut}
        onCancel={() => setShowSignOut(false)}
        loading={signingOut}
      />
    </Screen>
  );
}
