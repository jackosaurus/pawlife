# EAS Environment Variables — Bemy

Reference for the env vars Bemy relies on across EAS build profiles. Set these once via `eas env:create` (or the EAS dashboard); the values then flow into every build of the matching profile.

## Profile matrix

| Variable | development | preview | observability-test | testflight | production |
|---|---|---|---|---|---|
| `EXPO_PUBLIC_ENV` | `development` | `preview` | `preview` | `preview` | `production` |
| `EXPO_PUBLIC_TEST_OBSERVABILITY` | (not set) | (not set) | `true` | (not set) | (not set) |
| `EXPO_PUBLIC_POSTHOG_KEY` | (not set) | (not set) | EAS secret | (not set) | EAS secret |
| `EXPO_PUBLIC_POSTHOG_HOST` | (not set) | (not set) | `https://eu.i.posthog.com` | (not set) | `https://eu.i.posthog.com` |
| `EXPO_PUBLIC_SUPABASE_URL` | EAS secret | EAS secret | EAS secret | EAS secret | EAS secret |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | EAS secret | EAS secret | EAS secret | EAS secret | EAS secret |

`EXPO_PUBLIC_ENV` is set inline in `eas.json` (it is not secret). The PostHog key is technically not secret either (it's a "public" project key in PostHog's terminology), but we still treat it as an EAS secret to keep dashboards clean and to support easy rotation.

## Why a dedicated `observability-test` profile

The `production` profile turns the SDK on. The `preview` profile turns it off (so internal smoke tests do not pollute the production analytics dashboard). That leaves "I want to validate a PostHog change end-to-end on my phone before cutting a release" with no profile that actually fires events. `observability-test` plugs that gap: it builds like `preview` but flips `EXPO_PUBLIC_TEST_OBSERVABILITY=true`, which the gate in `services/observabilityConfig.ts` honors regardless of `EXPO_PUBLIC_ENV`.

## Edge Function (Supabase project secrets, NOT EAS)

These are set with `supabase secrets set …`, not `eas env:create`.

| Variable | Required | Value |
|---|---|---|
| `POSTHOG_API_KEY` | Yes for capture | Same project key as the mobile app |
| `POSTHOG_HOST` | No (defaults to `https://eu.i.posthog.com`) | EU PostHog endpoint |
| `HEALTHCHECK_URL` | Yes for heartbeat | The hc-ping.com URL (`https://hc-ping.com/<uuid>`) |
| `OBSERVABILITY_ENV` | No (defaults to `production`) | Tag attached to every captured exception |

If `POSTHOG_API_KEY` is unset, the Edge Function still runs — it just no-ops the capture call. Same for `HEALTHCHECK_URL` and the heartbeat. This is intentional: the function never fails because of an observability env-var miss.

## Source map upload (production builds)

Without source map upload, every production stack trace in PostHog is unreadable hex offsets. The upload requires a one-line addition to your build pipeline.

1. Generate a PostHog **personal API key** (Settings → Personal API keys → Create) and store it in EAS:
   ```
   eas secret:create --name POSTHOG_PERSONAL_API_KEY --value phx_… --scope project
   ```
2. Add a build hook. Two options:
   - **Recommended (managed):** add a `postPublish` script to `app.json`'s `expo.hooks` that runs `npx posthog-cli sourcemaps inject` then `npx posthog-cli sourcemaps upload`.
   - **Alternative (eas-build hook):** add an `eas-build-on-success.sh` to the project root that runs the same two commands. EAS executes it after every successful build.
3. The PostHog CLI reads `POSTHOG_PERSONAL_API_KEY` from the env automatically. No code changes required.

`posthog-cli` is published as a separate npm package (`posthog-cli`); add it as a dev dep when wiring the hook.

The upload step can be added **after** the first production build ships — production stack traces will be unreadable until then, but the rest of the observability pipeline (events, screen views, crash counts) still works. Treat it as a v1.0.1 follow-up if release pressure is high.

## Deploy ordering reminder

Coordinate the migration + Edge Function deploy carefully when you push:
1. `supabase secrets set POSTHOG_API_KEY=… HEALTHCHECK_URL=… OBSERVABILITY_ENV=production`
2. `supabase functions deploy send-reminders`
3. `eas env:create EXPO_PUBLIC_POSTHOG_KEY` for the production profile
4. `eas build --profile production`

Reverse the order and the function runs without env vars (silent event drop) or the app build is missing the key (silent SDK no-op).
