import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/authStore';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, initialized, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(main)');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    }
  }, [session, initialized, segments, router]);

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Slot />
    </>
  );
}
