/**
 * observabilityService — owns the PostHog singleton and the error/lifecycle
 * surface (init, identify, alias, reset, captureException). Feature code uses
 * `analyticsService` for events; this module is for low-traffic infra hooks
 * (auth lifecycle, ErrorBoundary, app background).
 *
 * CLAUDE.md rule 1: PostHog is imported here and in `analyticsService.ts`
 * only. Components and other services never touch the SDK directly.
 *
 * Reviewer amendment §2 (verified 2026-04-27): posthog-react-native v4 still
 * exports an imperative `new PostHog(apiKey, options)` constructor, so the
 * singleton model is OK. The Provider model is opt-in (used only if you want
 * the React-context hooks). We use the imperative model.
 *
 * Reviewer amendment §5: every event carries `app_version` + `build_number`
 * + `env` via `register()` super-properties on init.
 *
 * Reviewer amendment §6: `identify()` calls `alias()` first to preserve the
 * anon → identified merge funnel.
 */

import PostHog from 'posthog-react-native';
import {
  getAppVersion,
  getBuildNumber,
  getEnvironment,
  getPostHogHost,
  getPostHogKey,
  isObservabilityEnabled,
} from './observabilityConfig';

let client: PostHog | null = null;
let initialized = false;
// Re-entrancy guard so an exception inside captureException can't recurse.
let inCapture = false;

function buildClient(): PostHog | null {
  const key = getPostHogKey();
  if (!key) return null;
  return new PostHog(key, {
    host: getPostHogHost(),
    // Cost + privacy posture per plan §10:
    captureAppLifecycleEvents: true, // app open/background/install events
    enableSessionReplay: false, // explicit off
    // Identified-persons-only is set in the PostHog dashboard, not here.
  });
}

export const observabilityService = {
  /**
   * Idempotent. Safe to call multiple times (hot reload). No-op when disabled.
   * Registers super-properties so every event carries release tags.
   */
  init(): void {
    if (initialized) return;
    if (!isObservabilityEnabled()) {
      initialized = true;
      return;
    }
    client = buildClient();
    if (client) {
      // register() returns a Promise but we don't await — it's a fire-and-forget
      // store write that PostHog handles internally.
      void client.register({
        app_version: getAppVersion(),
        build_number: getBuildNumber(),
        env: getEnvironment(),
      });
    }
    initialized = true;
  },

  /**
   * Identify a user by Supabase auth UUID. Never pass email or other PII.
   * Calls alias() first so the anon→identified merge works in PostHog v3+.
   */
  identify(userId: string): void {
    if (!isObservabilityEnabled() || !client) return;
    try {
      client.alias(userId);
      client.identify(userId);
    } catch {
      // Ignore; identification failures should never crash the app.
    }
  },

  alias(userId: string): void {
    if (!isObservabilityEnabled() || !client) return;
    try {
      client.alias(userId);
    } catch {
      /* noop */
    }
  },

  /**
   * Clear identity. Call on signOut.
   */
  reset(): void {
    if (!isObservabilityEnabled() || !client) return;
    try {
      client.reset();
    } catch {
      /* noop */
    }
  },

  /**
   * Capture an exception (render error, async catch). No-op when disabled.
   * Re-entrancy guarded — a throw inside this method does not recurse.
   */
  captureException(
    err: unknown,
    context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
  ): void {
    if (!isObservabilityEnabled() || !client) return;
    if (inCapture) return;
    inCapture = true;
    try {
      const error =
        err instanceof Error
          ? err
          : new Error(typeof err === 'string' ? err : 'Unknown error');
      client.captureException(error, {
        ...(context?.tags ?? {}),
        ...(context?.extra ?? {}),
      });
    } catch {
      /* swallow — re-entry would be worse */
    } finally {
      inCapture = false;
    }
  },

  /**
   * For tests + edge function teardown. No-op when disabled.
   */
  async shutdown(): Promise<void> {
    if (!isObservabilityEnabled() || !client) return;
    try {
      await client.shutdown();
    } catch {
      /* noop */
    }
    client = null;
    initialized = false;
  },

  /** @internal — only `analyticsService` should call this. */
  _getClient(): PostHog | null {
    return client;
  },

  /** @internal — testing helper. Resets module state. */
  _resetForTests(): void {
    client = null;
    initialized = false;
    inCapture = false;
  },
};
