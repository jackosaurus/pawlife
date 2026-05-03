import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
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

  // Load Fraunces — display face for the wordmark + hero headlines on
  // welcome / sign-in / sign-up. The rest of the app stays on the system
  // sans. Loaded via JS at runtime (no `expo-font` plugin entry needed in
  // app.json), so EAS rebuilds aren't required to ship this — but the first
  // launch on a new install does block the splash until the font resolves
  // (we hold the splash via SplashScreen.preventAutoHideAsync above).
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

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
    if (initialized && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [initialized, fontsLoaded]);

  if (!initialized || !fontsLoaded) {
    return null;
  }

  return (
    // GestureHandlerRootView must wrap the whole app so any bottom sheet
    // (AuthSheet on welcome, QuickAddSheet inside pet detail) finds it as
    // an ancestor regardless of the auth state. Sign-out crash fix May 3
    // 2026 — without this, the AuthSheet that mounts on welcome after
    // sign-out would render before the gesture handler ancestor existed.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ToastProvider>
          <StatusBar style="dark" />
          <Slot />
        </ToastProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
