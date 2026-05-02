/**
 * Pure configuration helper for observability gating. Single source of truth
 * for "should the PostHog SDK be active right now?". No side effects — every
 * branch is a simple env-var read so the function is trivially unit-testable.
 *
 * Reviewer amendment §1: env vars are baked at bundle time via Expo's
 * EXPO_PUBLIC_* convention. We default `EXPO_PUBLIC_ENV` to `'development'`
 * so unset means "off" by accident, not by drift.
 */

import * as Application from 'expo-application';

export type Environment = 'development' | 'preview' | 'production' | 'test';

export function getEnvironment(): Environment {
  const raw = process.env.EXPO_PUBLIC_ENV;
  if (raw === 'production' || raw === 'preview' || raw === 'test') {
    return raw;
  }
  // Jest sets NODE_ENV=test; treat that as 'test' explicitly so the gate
  // can never accidentally enable in tests.
  if (process.env.NODE_ENV === 'test') return 'test';
  return 'development';
}

/**
 * Release tag attached to every event. Used by PostHog dashboards to filter
 * by app version (regression hunting). Format: `bemy@<version>+<build>`.
 */
export function getRelease(): string {
  const version = Application.nativeApplicationVersion ?? 'unknown';
  const build = Application.nativeBuildVersion ?? 'unknown';
  return `bemy@${version}+${build}`;
}

export function getAppVersion(): string {
  return Application.nativeApplicationVersion ?? 'unknown';
}

export function getBuildNumber(): string {
  return Application.nativeBuildVersion ?? 'unknown';
}

export function getPostHogKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  return typeof key === 'string' && key.length > 0 ? key : undefined;
}

export function getPostHogHost(): string {
  return process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';
}

/**
 * Gate. Returns true iff:
 *   - EXPO_PUBLIC_POSTHOG_KEY is non-empty
 *   - AND (env === 'production' OR EXPO_PUBLIC_TEST_OBSERVABILITY === 'true')
 *
 * Tests always disable (env === 'test').
 */
export function isObservabilityEnabled(): boolean {
  if (!getPostHogKey()) return false;
  const env = getEnvironment();
  if (env === 'test') return false;
  if (env === 'production') return true;
  return process.env.EXPO_PUBLIC_TEST_OBSERVABILITY === 'true';
}
