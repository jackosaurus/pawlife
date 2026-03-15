-- Add notification preference columns to users table
ALTER TABLE users
  ADD COLUMN push_tokens JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN medication_reminder_time TIME NOT NULL DEFAULT '20:00',
  ADD COLUMN vaccination_advance_days INT NOT NULL DEFAULT 14
    CHECK (vaccination_advance_days IN (7, 14, 30));

-- Notification log for deduplication
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('medication', 'vaccination')),
  reference_id UUID NOT NULL,
  reminder_key TEXT NOT NULL CHECK (reminder_key != ''),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index for dedup: one notification per (user, type, reference, key)
CREATE UNIQUE INDEX idx_notification_log_dedup
  ON notification_log (user_id, notification_type, reference_id, reminder_key);

-- Index for cleanup queries
CREATE INDEX idx_notification_log_sent_at ON notification_log (sent_at);

-- RLS
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification log"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- Note: service_role key bypasses RLS entirely.
-- Edge Function writes use the service role, so no explicit write policy needed.
