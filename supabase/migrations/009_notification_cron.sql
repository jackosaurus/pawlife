-- Schedule the send-reminders Edge Function to run hourly.
--
-- PREREQUISITES (do these first, in order, in the Supabase SQL editor):
--
-- 1. Enable extensions via Dashboard → Database → Extensions:
--    - pg_cron
--    - pg_net
--    These cannot be enabled from the SQL editor as a normal user.
--
-- 2. Store the service role key in Vault. First time:
--      SELECT vault.create_secret(
--        'eyJhbGci...REPLACE_WITH_REAL_KEY...',
--        'service_role_key'
--      );
--    To rotate later:
--      SELECT vault.update_secret(
--        (SELECT id FROM vault.secrets WHERE name = 'service_role_key'),
--        'eyJhbGci...NEW_KEY...'
--      );
--    Find the key at Project Settings → API → service_role (secret).
--
-- 3. Then run this file.
--
-- VERIFY AFTER RUNNING:
--   SELECT * FROM cron.job;
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--   SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;

-- ─── Guard: fail loudly if the Vault secret is missing ──────────
-- Without this, cron would silently POST with an empty Bearer token
-- and the Edge Function would 401 every hour with no visibility.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'service_role_key'
  ) THEN
    RAISE EXCEPTION
      'Vault secret "service_role_key" is missing. Run step 2 in the prerequisites block above before applying this migration.';
  END IF;
END
$$;

-- ─── send-reminders: hourly push notification dispatcher ────────
-- Idempotent: unschedule any prior job of the same name first.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-reminders-hourly') THEN
    PERFORM cron.unschedule('send-reminders-hourly');
  END IF;
END
$$;

SELECT cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $$
  SET LOCAL search_path = public, extensions;
  SELECT net.http_post(
    url     := 'https://kldjqualacoasxsrfbux.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- ─── notification_log cleanup: daily prune rows > 90 days old ───
-- The oldest reminder_key we ever check against is vax_overdue_30d,
-- so anything past 90 days is safe to drop. Keeps the unique index
-- fast and prevents unbounded table growth.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notification-log-cleanup') THEN
    PERFORM cron.unschedule('notification-log-cleanup');
  END IF;
END
$$;

SELECT cron.schedule(
  'notification-log-cleanup',
  '15 3 * * *',  -- daily 03:15 UTC
  $$
  SET LOCAL search_path = public;
  DELETE FROM public.notification_log WHERE sent_at < now() - interval '90 days';
  $$
);
