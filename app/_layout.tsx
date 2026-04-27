import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationSetup } from '@/hooks/useNotificationSetup';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { observabilityService } from '@/services/observabilityService';
import '../global.css';

SplashScreen.preventAutoHideAsync();

// Cap iOS Dynamic Type scaling so AX1+ users still get larger text but our
// fixed-width layouts (date column, status pill, log-dose pill) don't break.
// 1.3 corresponds to iOS "Larger" without crossing into the accessibility
// presets that overflow tightly-packed cards.
// @ts-ignore — defaultProps is set at runtime; RN's types don't expose it.
Text.defaultProps = Text.defaultProps || {};
// @ts-ignore — see above.
Text.defaultProps.maxFontSizeMultiplier = 1.3;

export default function RootLayout() {
  const { session, initialized, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useNotificationSetup(session?.user.id ?? null);
  // Auto screen tracking — no-op when observability is disabled.
  useScreenTracking();

  // Init the PostHog SDK once after mount. Reviewer amendment §2 (#2):
  // posthog-react-native's storage init is async-friendly when called from a
  // mounted-component effect, but flakier when called at module-import time.
  useEffect(() => {
    observabilityService.init();
  }, []);

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
    <ErrorBoundary>
      <ToastProvider>
        <StatusBar style="dark" />
        <Slot />
      </ToastProvider>
    </ErrorBoundary>
  );
}
