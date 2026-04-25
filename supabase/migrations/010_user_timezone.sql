-- Add IANA timezone to users so push reminders can fire at the user's local time.
-- Values come from the client's Intl.DateTimeFormat().resolvedOptions().timeZone
-- (e.g. 'America/Los_Angeles', 'Europe/London'). Default UTC for safety — users
-- whose client hasn't reported a zone yet still get some reminder, just at UTC.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
