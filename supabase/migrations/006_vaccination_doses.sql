-- Migration: Add vaccination dose tracking (parallels medication_doses)
-- Run this in the Supabase SQL editor before testing.

-- 1. Add interval_months to vaccinations table
ALTER TABLE vaccinations ADD COLUMN interval_months integer;

-- 2. Create vaccination_doses table
CREATE TABLE vaccination_doses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccination_id uuid NOT NULL REFERENCES vaccinations(id) ON DELETE CASCADE,
  date_administered date NOT NULL,
  clinic_name text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes (matches medication_doses pattern)
CREATE INDEX idx_vaccination_doses_vaccination_id
  ON vaccination_doses(vaccination_id);
CREATE INDEX idx_vaccination_doses_latest
  ON vaccination_doses(vaccination_id, date_administered DESC);

-- 4. Enable RLS
ALTER TABLE vaccination_doses ENABLE ROW LEVEL SECURITY;

-- 5. RLS policy (single "for all" policy, matches medication_doses pattern from 003)
CREATE POLICY "family_vaccination_doses_access" ON vaccination_doses
  FOR ALL USING (
    vaccination_id IN (
      SELECT id FROM vaccinations WHERE pet_id IN (
        SELECT id FROM pets WHERE family_id IN (
          SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- 6. Migrate existing vaccination records → dose records
-- Note: vaccinations with NULL date_administered (schedule-only, no dose yet) are intentionally skipped
INSERT INTO vaccination_doses (vaccination_id, date_administered, clinic_name, created_by, created_at)
SELECT id, date_administered, clinic_name, created_by, created_at
FROM vaccinations
WHERE date_administered IS NOT NULL;

-- 7. Set interval_months from known vaccine defaults
UPDATE vaccinations SET interval_months = 6 WHERE vaccine_name = 'Bordetella';
UPDATE vaccinations SET interval_months = 12 WHERE interval_months IS NULL;
