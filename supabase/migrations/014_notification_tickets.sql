-- ============================================================
-- Migration 014: notification_tickets
--
-- Persists Expo Push ticket IDs returned by send-reminders so a future
-- receipt-poller (v1.1+) can call Expo's GetReceipts endpoint, clean up
-- dead push tokens, and surface delivery failures.
--
-- For v1 the table is write-only from send-reminders — the poller is
-- not yet shipped. The table size grows ~1 row per push notification,
-- bounded by user count × frequency. A future migration can add a
-- prune cron once the poller exists.
--
-- Idempotent.
-- ============================================================

create table if not exists public.notification_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ticket_id text,                              -- Expo's "id" field on ok tickets;
                                               -- null when status='error'
  push_token text not null,                    -- the device token we sent to
  notification_type text not null
    check (notification_type in ('medication', 'vaccination')),
  reference_id uuid not null,                  -- pet_id (medication) or
                                               -- vaccination_id (vaccination)
  status text not null
    check (status in ('ok', 'error', 'unchecked')),
  error_code text,                             -- DeviceNotRegistered, etc.
  receipt_checked_at timestamptz,              -- null = not yet polled
  created_at timestamptz not null default now()
);

-- Hot path: the future poller scans unchecked ok-tickets in time order.
create index if not exists idx_notification_tickets_unchecked
  on public.notification_tickets(created_at)
  where receipt_checked_at is null and status = 'ok';

-- Per-user audit / debug.
create index if not exists idx_notification_tickets_user_created
  on public.notification_tickets(user_id, created_at desc);

-- RLS: deny direct client access. Only service_role (Edge Function) writes
-- and reads. We enable RLS with no policies; service role bypasses RLS,
-- regular clients fail closed.
alter table public.notification_tickets enable row level security;
