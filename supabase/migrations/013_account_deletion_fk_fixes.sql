-- ============================================================
-- Migration 013: Account deletion — FK ON DELETE rules + rate-limit table
--
-- Purpose: enable hard delete of a user via supabase.auth.admin.deleteUser()
-- without FK NO ACTION blocking the cascade. 16 audit/creator FKs move from
-- NO ACTION → SET NULL so family-shared records survive the deleter, while
-- per-user records continue to CASCADE through auth.users → public.users.
--
-- Adds account_deletion_attempts table for rate-limiting (5/day per user)
-- and audit. No ip_address column — collecting IPs creates a privacy-
-- disclosure burden with zero v1 value (reviewer amendment §6).
--
-- IMPORTANT: This migration MUST run BEFORE the delete-account Edge
-- Function is deployed. Otherwise the function will succeed against
-- auth but the cascade will fail with constraint violations, leaving
-- an orphaned public.users row.
--
-- Idempotent: every constraint drop uses IF EXISTS, every recreate
-- uses the same name, the table create uses IF NOT EXISTS. Safe to
-- re-run.
-- ============================================================

-- ── 1. Drop NOT NULL on family_invites.invited_by ──────────────
-- Required for the SET NULL rule below to be legal. Existing
-- application code (services/familyService.ts:107) only ever inserts
-- a non-null user.id, so dropping NOT NULL doesn't change the write
-- path; it only allows the FK action to nullify on delete.
alter table public.family_invites
  alter column invited_by drop not null;

-- ── 2. Recreate FKs as ON DELETE SET NULL ──────────────────────
-- All 16 constraints below move NO ACTION → SET NULL.
--
-- Decision rule: family-shared records' audit columns (created_by,
-- modified_by) should outlive the original author. Per-user records
-- (notification_log, family_members.user_id) keep their existing
-- CASCADE rules (untouched here).

-- families.created_by — the parent family must outlive its creator
alter table public.families
  drop constraint if exists families_created_by_fkey;
alter table public.families
  add constraint families_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

-- family_invites.invited_by + accepted_by — audit only
alter table public.family_invites
  drop constraint if exists family_invites_invited_by_fkey;
alter table public.family_invites
  add constraint family_invites_invited_by_fkey
  foreign key (invited_by) references public.users(id) on delete set null;

alter table public.family_invites
  drop constraint if exists family_invites_accepted_by_fkey;
alter table public.family_invites
  add constraint family_invites_accepted_by_fkey
  foreign key (accepted_by) references public.users(id) on delete set null;

-- pets.created_by — pets are family-shared
alter table public.pets
  drop constraint if exists pets_created_by_fkey;
alter table public.pets
  add constraint pets_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

-- vaccinations
alter table public.vaccinations
  drop constraint if exists vaccinations_created_by_fkey;
alter table public.vaccinations
  add constraint vaccinations_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.vaccinations
  drop constraint if exists vaccinations_modified_by_fkey;
alter table public.vaccinations
  add constraint vaccinations_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- vet_visits
alter table public.vet_visits
  drop constraint if exists vet_visits_created_by_fkey;
alter table public.vet_visits
  add constraint vet_visits_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.vet_visits
  drop constraint if exists vet_visits_modified_by_fkey;
alter table public.vet_visits
  add constraint vet_visits_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- medications
alter table public.medications
  drop constraint if exists medications_created_by_fkey;
alter table public.medications
  add constraint medications_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.medications
  drop constraint if exists medications_modified_by_fkey;
alter table public.medications
  add constraint medications_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- weight_entries
alter table public.weight_entries
  drop constraint if exists weight_entries_created_by_fkey;
alter table public.weight_entries
  add constraint weight_entries_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.weight_entries
  drop constraint if exists weight_entries_modified_by_fkey;
alter table public.weight_entries
  add constraint weight_entries_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- food_entries
alter table public.food_entries
  drop constraint if exists food_entries_created_by_fkey;
alter table public.food_entries
  add constraint food_entries_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.food_entries
  drop constraint if exists food_entries_modified_by_fkey;
alter table public.food_entries
  add constraint food_entries_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- medication_doses (single audit column)
alter table public.medication_doses
  drop constraint if exists medication_doses_created_by_fkey;
alter table public.medication_doses
  add constraint medication_doses_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

-- vaccination_doses — NB: targets auth.users directly (per migration 006),
-- unlike the others which target public.users. The cascade chain
-- auth.users → public.users runs before this constraint is hit, so without
-- SET NULL the delete would block.
alter table public.vaccination_doses
  drop constraint if exists vaccination_doses_created_by_fkey;
alter table public.vaccination_doses
  add constraint vaccination_doses_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- pet_allergies
alter table public.pet_allergies
  drop constraint if exists pet_allergies_created_by_fkey;
alter table public.pet_allergies
  add constraint pet_allergies_created_by_fkey
  foreign key (created_by) references public.users(id) on delete set null;

alter table public.pet_allergies
  drop constraint if exists pet_allergies_modified_by_fkey;
alter table public.pet_allergies
  add constraint pet_allergies_modified_by_fkey
  foreign key (modified_by) references public.users(id) on delete set null;

-- ── 3. account_deletion_attempts: rate-limit + audit ───────────
-- Intentionally NOT a FK on user_id: we must keep the row after the
-- user is deleted, both for audit and to keep the rate-limit window
-- meaningful across a re-signup. A user_id of a no-longer-existing
-- account is fine.
create table if not exists public.account_deletion_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  attempted_at timestamptz not null default now(),
  succeeded boolean not null default false
);

create index if not exists idx_account_deletion_attempts_user_attempted
  on public.account_deletion_attempts(user_id, attempted_at desc);

-- RLS: lock down all client access. Service role bypasses RLS, which
-- is the only path that should ever read/write this table (Edge Function).
-- We keep RLS enabled but define no policies, so unauthorized reads and
-- writes both fail closed.
alter table public.account_deletion_attempts enable row level security;
