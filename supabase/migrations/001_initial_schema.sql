-- Bemy Initial Schema Migration
-- Run this in the Supabase SQL editor after creating your project

-- ============================================
-- TABLES
-- ============================================

-- Users (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lbs')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pets
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  pet_type text not null check (pet_type in ('dog', 'cat')),
  name text not null,
  breed text,
  date_of_birth date,
  approximate_age_months integer,
  sex text check (sex in ('male', 'female', 'unknown')),
  weight decimal,
  microchip_number text,
  profile_photo_url text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pets_user_id on public.pets(user_id);

-- Vet Visits
create table public.vet_visits (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  clinic_name text,
  reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_vet_visits_pet_id on public.vet_visits(pet_id);

-- Vet Visit Attachments
create table public.vet_visit_attachments (
  id uuid primary key default gen_random_uuid(),
  vet_visit_id uuid not null references public.vet_visits(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'document')),
  file_name text,
  created_at timestamptz not null default now()
);

create index idx_attachments_visit_id on public.vet_visit_attachments(vet_visit_id);

-- Vaccinations
create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  vaccine_name text not null,
  date_administered date not null,
  next_due_date date,
  clinic_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_vaccinations_pet_id on public.vaccinations(pet_id);

-- Medications
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  start_date date not null,
  end_date date,
  prescribing_vet text,
  notes text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_medications_pet_id on public.medications(pet_id);

-- Weight Entries
create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  weight decimal not null,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_weight_entries_pet_id on public.weight_entries(pet_id);

-- Food Entries
create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  brand text not null,
  product_name text,
  food_type text check (food_type in ('dry', 'wet', 'raw', 'mixed')),
  amount_per_meal text,
  meals_per_day integer,
  start_date date not null,
  end_date date,
  reason_for_change text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_food_entries_pet_id on public.food_entries(pet_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.users enable row level security;
alter table public.pets enable row level security;
alter table public.vet_visits enable row level security;
alter table public.vet_visit_attachments enable row level security;
alter table public.vaccinations enable row level security;
alter table public.medications enable row level security;
alter table public.weight_entries enable row level security;
alter table public.food_entries enable row level security;

-- Users can only access their own profile
create policy "users_own_data" on public.users
  for all using (id = auth.uid());

-- Users can only access their own pets
create policy "pets_own_data" on public.pets
  for all using (user_id = auth.uid());

-- Record tables: verify ownership through the pet
create policy "vet_visits_own_data" on public.vet_visits
  for all using (
    pet_id in (select id from public.pets where user_id = auth.uid())
  );

create policy "attachments_own_data" on public.vet_visit_attachments
  for all using (
    vet_visit_id in (
      select vv.id from public.vet_visits vv
      join public.pets p on p.id = vv.pet_id
      where p.user_id = auth.uid()
    )
  );

create policy "vaccinations_own_data" on public.vaccinations
  for all using (
    pet_id in (select id from public.pets where user_id = auth.uid())
  );

create policy "medications_own_data" on public.medications
  for all using (
    pet_id in (select id from public.pets where user_id = auth.uid())
  );

create policy "weight_entries_own_data" on public.weight_entries
  for all using (
    pet_id in (select id from public.pets where user_id = auth.uid())
  );

create policy "food_entries_own_data" on public.food_entries
  for all using (
    pet_id in (select id from public.pets where user_id = auth.uid())
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================

insert into storage.buckets (id, name, public)
values
  ('pet-photos', 'pet-photos', true),
  ('vet-attachments', 'vet-attachments', false);

-- Storage RLS: users can only upload/access files in their own folder
create policy "pet_photos_policy" on storage.objects
  for all using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vet_attachments_policy" on storage.objects
  for all using (
    bucket_id = 'vet-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
