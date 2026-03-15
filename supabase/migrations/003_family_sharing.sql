-- ============================================================
-- Migration 003: Family Sharing
-- Adds families, family_members, family_invites tables.
-- Migrates pets from user_id to family_id-based access control.
-- Adds created_by / modified_by audit columns to all record tables.
-- Updates RLS policies for family-based access.
-- ============================================================

-- ── New Tables ───────────────────────────────────────────────

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My human family',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.families enable row level security;

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique(family_id, user_id)
);

create index idx_family_members_family_id on public.family_members(family_id);
create index idx_family_members_user_id on public.family_members(user_id);
-- P1-2: Enforce one family per user at the DB level
create unique index idx_family_members_one_family_per_user on public.family_members(user_id);

alter table public.family_members enable row level security;

create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  invite_code text not null unique,
  invited_by uuid not null references public.users(id),
  expires_at timestamptz not null,
  accepted_by uuid references public.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_family_invites_code on public.family_invites(invite_code);
create index idx_family_invites_family_id on public.family_invites(family_id);

alter table public.family_invites enable row level security;

-- ── Schema Changes to Existing Tables ────────────────────────

-- pets: add family_id and created_by
alter table public.pets add column family_id uuid references public.families(id);
alter table public.pets add column created_by uuid references public.users(id);

-- Record tables: add created_by / modified_by audit columns
alter table public.vaccinations add column created_by uuid references public.users(id);
alter table public.vaccinations add column modified_by uuid references public.users(id);

alter table public.vet_visits add column created_by uuid references public.users(id);
alter table public.vet_visits add column modified_by uuid references public.users(id);

alter table public.medications add column created_by uuid references public.users(id);
alter table public.medications add column modified_by uuid references public.users(id);

alter table public.weight_entries add column created_by uuid references public.users(id);
alter table public.weight_entries add column modified_by uuid references public.users(id);

alter table public.food_entries add column created_by uuid references public.users(id);
alter table public.food_entries add column modified_by uuid references public.users(id);

alter table public.medication_doses add column created_by uuid references public.users(id);

-- ── Data Migration for Existing Users ────────────────────────

-- Step 1: Create a family for every existing user
insert into public.families (id, name, created_by)
select gen_random_uuid(), 'My human family', id
from public.users;

-- Step 2: Add each user as admin of their family
insert into public.family_members (family_id, user_id, role)
select f.id, f.created_by, 'admin'
from public.families f;

-- Step 3: Assign pets to their owner's family, set created_by
update public.pets p
set family_id = f.id,
    created_by = p.user_id
from public.families f
where f.created_by = p.user_id;

-- Step 4: Backfill created_by on all record tables using the pet's original owner
update public.vaccinations v
set created_by = p.user_id
from public.pets p where p.id = v.pet_id;

update public.vet_visits vv
set created_by = p.user_id
from public.pets p where p.id = vv.pet_id;

update public.medications m
set created_by = p.user_id
from public.pets p where p.id = m.pet_id;

update public.weight_entries w
set created_by = p.user_id
from public.pets p where p.id = w.pet_id;

update public.food_entries fe
set created_by = p.user_id
from public.pets p where p.id = fe.pet_id;

update public.medication_doses md
set created_by = m.created_by
from public.medications m where m.id = md.medication_id;

-- Step 5: Make family_id NOT NULL
alter table public.pets alter column family_id set not null;

-- ── Drop ALL old RLS policies BEFORE dropping user_id column ──
-- (Postgres tracks column dependencies in policies — drop would fail otherwise)

drop policy if exists "pets_own_data" on public.pets;
drop policy if exists "attachments_own_data" on public.vet_visit_attachments;
drop policy if exists "vaccinations_own_data" on public.vaccinations;
drop policy if exists "vet_visits_own_data" on public.vet_visits;
drop policy if exists "medications_own_data" on public.medications;
drop policy if exists "weight_entries_own_data" on public.weight_entries;
drop policy if exists "food_entries_own_data" on public.food_entries;
drop policy if exists "Users can manage their own medication doses" on public.medication_doses;

-- Step 6: Drop user_id from pets (no longer needed for access control)
alter table public.pets drop column user_id;

-- Step 7: Create index
create index idx_pets_family_id on public.pets(family_id);

-- ── Updated Signup Trigger ───────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_family_id uuid;
begin
  -- Create user profile
  insert into public.users (id, email)
  values (new.id, new.email);

  -- Create their family
  insert into public.families (id, name, created_by)
  values (gen_random_uuid(), 'My human family', new.id)
  returning id into new_family_id;

  -- Add them as admin
  insert into public.family_members (family_id, user_id, role)
  values (new_family_id, new.id, 'admin');

  return new;
end;
$$ language plpgsql security definer;

-- ── RLS Policies: families ───────────────────────────────────

create policy "family_members_view" on public.families
  for select using (
    id in (select family_id from public.family_members where user_id = auth.uid())
  );

create policy "family_admin_update" on public.families
  for update using (
    id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ── RLS Policies: family_members ─────────────────────────────

-- Helper functions to break RLS self-reference recursion on family_members
create or replace function public.get_my_family_id()
returns uuid as $$
  select family_id from public.family_members where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- P1-1: Helper to get current user's role without recursion
create or replace function public.get_my_family_role()
returns text as $$
  select role from public.family_members where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

create policy "view_own_membership" on public.family_members
  for select using (user_id = auth.uid());

create policy "view_family_members" on public.family_members
  for select using (family_id = public.get_my_family_id());

-- P1-1: Rewritten to use helper functions — no subquery recursion risk
create policy "admin_remove_members" on public.family_members
  for delete using (
    user_id != auth.uid()
    and family_id = public.get_my_family_id()
    and public.get_my_family_role() = 'admin'
  );

-- P0-3: No direct-DELETE "member_leave" policy. All leave operations
-- must go through the leave_family() RPC which creates a solo family first.

-- ── RLS Policies: family_invites ─────────────────────────────

create policy "admin_manage_invites" on public.family_invites
  for all using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- P0-1: No "anyone_read_invite_by_code" policy. Invite previews go through
-- the preview_invite() RPC (security definer). Accepting goes through accept_invite() RPC.

-- ── RLS Policies: users (add family visibility) ────────────

create policy "family_members_can_see_each_other" on public.users
  for select using (
    id in (
      select fm2.user_id from public.family_members fm1
      join public.family_members fm2 on fm1.family_id = fm2.family_id
      where fm1.user_id = auth.uid()
    )
  );

-- ── RLS Policies: pets ──────────────────────────────────────

create policy "family_pets_access" on public.pets
  for all using (
    family_id in (
      select family_id from public.family_members where user_id = auth.uid()
    )
  );

-- ── RLS Policies: vet_visit_attachments ─────────────────────

create policy "family_attachments_access" on public.vet_visit_attachments
  for all using (
    vet_visit_id in (
      select id from public.vet_visits where pet_id in (
        select id from public.pets where family_id in (
          select family_id from public.family_members where user_id = auth.uid()
        )
      )
    )
  );

-- ── RLS Policies: Record tables ─────────────────────────────

create policy "family_vaccinations_access" on public.vaccinations
  for all using (
    pet_id in (
      select id from public.pets where family_id in (
        select family_id from public.family_members where user_id = auth.uid()
      )
    )
  );

create policy "family_vet_visits_access" on public.vet_visits
  for all using (
    pet_id in (
      select id from public.pets where family_id in (
        select family_id from public.family_members where user_id = auth.uid()
      )
    )
  );

create policy "family_medications_access" on public.medications
  for all using (
    pet_id in (
      select id from public.pets where family_id in (
        select family_id from public.family_members where user_id = auth.uid()
      )
    )
  );

create policy "family_weight_entries_access" on public.weight_entries
  for all using (
    pet_id in (
      select id from public.pets where family_id in (
        select family_id from public.family_members where user_id = auth.uid()
      )
    )
  );

create policy "family_food_entries_access" on public.food_entries
  for all using (
    pet_id in (
      select id from public.pets where family_id in (
        select family_id from public.family_members where user_id = auth.uid()
      )
    )
  );

create policy "family_medication_doses_access" on public.medication_doses
  for all using (
    medication_id in (
      select id from public.medications where pet_id in (
        select id from public.pets where family_id in (
          select family_id from public.family_members where user_id = auth.uid()
        )
      )
    )
  );

-- ── RLS Policies: Storage (replace existing) ─────────────────

drop policy if exists "pet_photos_policy" on storage.objects;
drop policy if exists "vet_attachments_policy" on storage.objects;

-- Upload: user uploads to their own folder (no change)
create policy "pet_photos_upload" on storage.objects
  for insert with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: any family member can read photos of family pets
create policy "pet_photos_read" on storage.objects
  for select using (
    bucket_id = 'pet-photos'
    and (
      (storage.foldername(name))[1] in (
        select fm2.user_id::text from public.family_members fm1
        join public.family_members fm2 on fm1.family_id = fm2.family_id
        where fm1.user_id = auth.uid()
      )
    )
  );

-- Update/delete: only the uploader can modify/delete
create policy "pet_photos_modify" on storage.objects
  for update using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_delete" on storage.objects
  for delete using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Same pattern for vet-attachments
create policy "vet_attachments_upload" on storage.objects
  for insert with check (
    bucket_id = 'vet-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vet_attachments_read" on storage.objects
  for select using (
    bucket_id = 'vet-attachments'
    and (
      (storage.foldername(name))[1] in (
        select fm2.user_id::text from public.family_members fm1
        join public.family_members fm2 on fm1.family_id = fm2.family_id
        where fm1.user_id = auth.uid()
      )
    )
  );

create policy "vet_attachments_modify" on storage.objects
  for update using (
    bucket_id = 'vet-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vet_attachments_delete" on storage.objects
  for delete using (
    bucket_id = 'vet-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── RPC Functions ────────────────────────────────────────────

create or replace function public.preview_invite(code text)
returns json as $$
declare
  v_invite family_invites%rowtype;
  v_family_name text;
begin
  select * into v_invite
  from public.family_invites
  where invite_code = code
    and expires_at > now()
    and accepted_by is null;

  if v_invite is null then
    raise exception 'Invalid or expired invite code';
  end if;

  select name into v_family_name
  from public.families
  where id = v_invite.family_id;

  return json_build_object(
    'family_name', v_family_name,
    'expires_at', v_invite.expires_at
  );
end;
$$ language plpgsql security definer;

create or replace function public.accept_invite(invite_code text)
returns void as $$
declare
  v_invite family_invites%rowtype;
  v_current_family_id uuid;
  v_current_member_count int;
  v_new_family_member_count int;
begin
  -- P0-2: Lock the invite row to prevent two users accepting simultaneously
  select * into v_invite
  from public.family_invites
  where family_invites.invite_code = accept_invite.invite_code
    and expires_at > now()
    and accepted_by is null
  for update;

  if v_invite is null then
    raise exception 'Invalid or expired invite code';
  end if;

  -- P0-2: Lock existing member rows, then count (FOR UPDATE can't be used with aggregates)
  perform 1 from public.family_members
  where family_id = v_invite.family_id
  for update;

  select count(*) into v_new_family_member_count
  from public.family_members
  where family_id = v_invite.family_id;

  if v_new_family_member_count >= 4 then
    raise exception 'This family already has the maximum number of members';
  end if;

  -- Check user isn't already in this family
  if exists (
    select 1 from public.family_members
    where family_id = v_invite.family_id and user_id = auth.uid()
  ) then
    raise exception 'You are already a member of this family';
  end if;

  -- Get user's current family
  select family_id into v_current_family_id
  from public.family_members where user_id = auth.uid();

  -- Move user's pets to the new family
  update public.pets
  set family_id = v_invite.family_id
  where family_id = v_current_family_id
    and created_by = auth.uid();

  -- Remove user from old family
  delete from public.family_members where user_id = auth.uid();

  -- Delete old family if empty
  select count(*) into v_current_member_count
  from public.family_members where family_id = v_current_family_id;

  if v_current_member_count = 0 then
    delete from public.families where id = v_current_family_id;
  end if;

  -- Add user to new family
  insert into public.family_members (family_id, user_id, role)
  values (v_invite.family_id, auth.uid(), 'member');

  -- P0-2: Mark invite as accepted with accepted_by IS NULL guard
  -- (defense-in-depth against double-acceptance)
  update public.family_invites
  set accepted_by = auth.uid(), accepted_at = now()
  where id = v_invite.id
    and accepted_by is null;

  if not found then
    raise exception 'Invite has already been accepted';
  end if;
end;
$$ language plpgsql security definer;

create or replace function public.leave_family()
returns void as $$
declare
  v_current_family_id uuid;
  v_role text;
  v_new_family_id uuid;
begin
  -- Get current family and role
  select family_id, role into v_current_family_id, v_role
  from public.family_members where user_id = auth.uid();

  if v_role = 'admin' then
    raise exception 'Admin cannot leave the family. Remove all members first.';
  end if;

  -- Create a new solo family for the user
  insert into public.families (name, created_by)
  values ('My human family', auth.uid())
  returning id into v_new_family_id;

  -- Pets stay with the family (user leaves without taking pets)

  -- Remove from old family
  delete from public.family_members where user_id = auth.uid();

  -- Add to new family as admin
  insert into public.family_members (family_id, user_id, role)
  values (v_new_family_id, auth.uid(), 'admin');
end;
$$ language plpgsql security definer;
