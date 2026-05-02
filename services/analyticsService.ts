/**
 * analyticsService — typed event API. The high-traffic surface used by the
 * service layer (petService, healthService, foodService) and the auto
 * screen-tracking hook.
 *
 * Reviewer amendment §7: signup funnel events (`auth_signup_started`,
 * `auth_signup_failed`) are first-class so the conversion funnel is
 * complete.
 *
 * Strict event taxonomy — no PII. `pet_id` only, never `pet_name`. See
 * `bemy-v1-posthog-plan.md` §4 for rationale.
 */

import { observabilityService } from './observabilityService';
import { isObservabilityEnabled } from './observabilityConfig';

export type EventMap = {
  pet_created: { pet_id: string; species: string };
  vaccination_logged: { pet_id: string };
  medication_dose_logged: { pet_id: string; medication_id: string };
  food_entry_logged: { pet_id: string };
  weight_entry_logged: { pet_id: string };
  auth_signup_started: Record<string, never>;
  auth_signup_failed: { reason: string };
};

export type EventName = keyof EventMap;

export const analyticsService = {
  /**
   * Capture a typed event. No-op when observability is disabled.
   * The TypeScript signature ensures `props` matches the event's schema.
   */
  track<E extends EventName>(event: E, props: EventMap[E]): void {
    if (!isObservabilityEnabled()) return;
    const client = observabilityService._getClient();
    if (!client) return;
    try {
      client.capture(event as string, props as Record<string, unknown>);
    } catch {
      /* swallow — analytics must never crash the app */
    }
  },

  /**
   * Auto screen-view event. Routed through the wrapper so the gate stays
   * centralized. `name` is the Expo Router pathname (e.g. "/pets/[petId]").
   */
  screen(name: string, props?: Record<string, string | number | boolean>): void {
    if (!isObservabilityEnabled()) return;
    const client = observabilityService._getClient();
    if (!client) return;
    try {
      client.screen(name, props);
    } catch {
      /* noop */
    }
  },
};
