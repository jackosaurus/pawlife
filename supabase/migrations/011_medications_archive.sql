-- Migration 011: Medications archive
-- Replaces the boolean `is_completed` column with an archive model that mirrors pets.
--
-- Why: "Completed" was rarely used. Many users leave finished meds sitting in the
-- active list cluttering the Medicines tab. An explicit archive lets people retire
-- old courses without losing history (and without manually editing each end_date).
--
-- Idempotent: the column adds, backfill, and partial index all guard against
-- being run twice. The drop of `is_completed` is conditional too.

-- ── 1. Add new columns (idempotent via IF NOT EXISTS) ───────────────────
alter table public.medications
  add column if not exists is_archived boolean not null default false;

alter table public.medications
  add column if not exists archived_at timestamptz null;

-- ── 2. Backfill: any historical row marked is_completed=true becomes archived ──
-- Only runs if the legacy column still exists. After the first successful run,
-- subsequent runs find no `is_completed` column and skip the update.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'medications'
      and column_name = 'is_completed'
  ) then
    update public.medications
       set is_archived = true,
           archived_at = coalesce(archived_at, now())
     where is_completed = true
       and is_archived = false;
  end if;
end $$;

-- ── 3. Partial index for the hot path (90%+ of queries are active-only) ──
create index if not exists idx_medications_pet_active
  on public.medications (pet_id)
  where is_archived = false;

-- ── 4. Drop the legacy column AFTER the backfill commits ────────────────
alter table public.medications drop column if exists is_completed;
