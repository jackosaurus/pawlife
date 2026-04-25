import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notificationService';
import { userService } from '@/services/userService';

// Show notification when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function getExpoPushToken(): Promise<string | null> {
  // Check permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get project ID from app config
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('No EAS project ID found for push notifications');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

async function syncUserTimezone(userId: string): Promise<void> {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!detected) return;

  // Older Hermes builds can return 'UTC' from Intl even on non-UTC devices.
  // If the device clock isn't actually on UTC, skip — don't overwrite a
  // correct stored zone with a fabricated 'UTC'.
  if (detected === 'UTC' && new Date().getTimezoneOffset() !== 0) return;

  const profile = await userService.getProfile(userId);
  if (profile.timezone === detected) return;

  await userService.updateProfile(userId, { timezone: detected });
}

export function useNotificationSetup(userId: string | null) {
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!userId) return;

    // Sync the device's IANA timezone so the Edge Function can fire reminders
    // at the user's local hour, not UTC. Only writes if the stored value is
    // different — avoids an update every app launch.
    syncUserTimezone(userId).catch((err) =>
      console.warn('Failed to sync user timezone:', err),
    );

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Register push token
    getExpoPushToken().then((token) => {
      if (token) {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        notificationService
          .registerPushToken(userId, token, platform)
          .catch((err) =>
            console.warn('Failed to register push token:', err),
          );
      }
    });

    // Handle notification tap — navigate to dashboard
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        router.replace('/(main)');
      });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(
          responseListener.current,
        );
      }
    };
  }, [userId, router]);
}
