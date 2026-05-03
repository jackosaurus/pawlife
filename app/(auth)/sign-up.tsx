import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Deprecated route. Auth lives in the bottom sheet on the welcome screen
 * (per `docs/bemy-auth-flow-decision.md` §3 — Option B). This stub redirects
 * any deep links / stale navigation history straight to welcome so we don't
 * 404 on a stale link.
 *
 * The sheet's default tab is contextual to which welcome CTA the user taps,
 * so we don't auto-open it here — the user lands on welcome and chooses.
 */
export default function SignUpScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/welcome');
  }, [router]);

  return <View testID="signup-redirect" className="flex-1 bg-background" />;
}
