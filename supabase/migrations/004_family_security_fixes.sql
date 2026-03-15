-- ============================================================
-- Migration 004: Family Sharing Security & Integrity Fixes
-- P0-1: Drop overly permissive invite read policy
-- P0-2: Fix accept_invite race condition with row locking
-- P0-3: Drop member_leave direct-delete policy
-- P1-1: Add get_my_family_role() helper, rewrite admin_remove_members
-- P1-2: Add unique constraint enforcing one family per user
-- ============================================================

-- ── P1-2: One family per user constraint ────────────────────
-- Prevents a bug from putting a user in two families.
-- The existing UNIQUE(family_id, user_id) only prevents duplicates
-- within the same family, not across families.
create unique index if not exists idx_family_members_one_family_per_user
  on public.family_members(user_id);

-- ── P1-1: get_my_family_role() security definer ────────────
-- Breaks RLS self-reference recursion for role checks on family_members.
create or replace function public.get_my_family_role()
returns text as $$
  select role from public.family_members where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- ── P0-1: Drop overly permissive invite read policy ────────
-- The preview_invite() and accept_invite() RPCs (security definer)
-- handle all invite access for non-admins. admin_manage_invites
-- covers admin CRUD. This policy exposed ALL invite codes to
-- any authenticated user.
drop policy if exists "anyone_read_invite_by_code" on public.family_invites;

-- ── P0-3: Drop member_leave direct-delete policy ───────────
-- Members must go through leave_family() RPC which creates a
-- new solo family first, preventing self-orphaning.
drop policy if exists "member_leave" on public.family_members;

-- ── P1-1: Rewrite admin_remove_members to use helpers ──────
-- Old policy had subquery hitting family_members SELECT policies,
-- creating fragile recursion dependency. New version uses
-- get_my_family_id() and get_my_family_role() security definers.
drop policy if exists "admin_remove_members" on public.family_members;

create policy "admin_remove_members" on public.family_members
  for delete using (
    user_id != auth.uid()
    and family_id = public.get_my_family_id()
    and public.get_my_family_role() = 'admin'
  );

-- ── P0-2: Fix accept_invite race condition ─────────────────
-- Add FOR UPDATE locking to prevent two users from accepting
-- the same invite simultaneously and exceeding the 4-member cap.
-- Add accepted_by IS NULL guard on the final UPDATE as defense-in-depth.
create or replace function public.accept_invite(invite_code text)
returns void as $$
declare
  v_invite family_invites%rowtype;
  v_current_family_id uuid;
  v_current_member_count int;
  v_new_family_member_count int;
begin
  -- Lock the invite row to prevent concurrent acceptance
  select * into v_invite
  from public.family_invites
  where family_invites.invite_code = accept_invite.invite_code
    and expires_at > now()
    and accepted_by is null
  for update;

  if v_invite is null then
    raise exception 'Invalid or expired invite code';
  end if;

  -- Lock existing member rows, then count (FOR UPDATE can't be used with aggregates)
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

  -- Mark invite as accepted with accepted_by IS NULL guard
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
