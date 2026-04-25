-- ============================================================
-- Migration 012: Pet allergies + insurance
--
-- Adds two optional insurance columns to `pets` and a new
-- `pet_allergies` table for tracking pet allergies as a list.
--
-- Idempotent: every column add, table create, index create, and
-- policy create uses IF NOT EXISTS or DROP IF EXISTS guards so this
-- migration is safe to re-run.
--
-- Cut from v1 (deferred to a future migration if/when needed):
--   * Allergy severity field
--   * Allergy notes field
--   * Insurance phone, expiry, coverage type, multi-policy support
-- ============================================================

-- ── 1. Insurance fields on pets (nullable, no default) ──────
alter table public.pets
  add column if not exists insurance_provider text null;

alter table public.pets
  add column if not exists insurance_policy_number text null;

-- ── 2. pet_allergies table ──────────────────────────────────
create table if not exists public.pet_allergies (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  allergen text not null,
  created_by uuid references public.users(id),
  modified_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 3. Indexes ──────────────────────────────────────────────
-- Hot-path: list-by-pet query
create index if not exists idx_pet_allergies_pet_id
  on public.pet_allergies(pet_id);

-- Case-insensitive uniqueness: prevents "Chicken" / "chicken" / "CHICKEN" dupes
create unique index if not exists idx_pet_allergies_pet_allergen_unique
  on public.pet_allergies(pet_id, lower(allergen));

-- ── 4. Row Level Security ───────────────────────────────────
alter table public.pet_allergies enable row level security;

-- Modeled on family_vaccinations_access in 003_family_sharing.sql:260-267
drop policy if exists "family_pet_allergies_access" on public.pet_allergies;
create policy "family_pet_allergies_access" on public.pet_allergies
  for all using (
    pet_id in (
      select id from public.pets where family_id in (
        select family_id from public.family_members where user_id = auth.uid()
      )
    )
  );
