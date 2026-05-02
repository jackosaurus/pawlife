# Bemy — Family Sharing Feature

## Overview

Allow multiple people (up to 4) to manage the same pets together. A couple who shares a dog can both track vaccinations, log medication doses, update food — without needing to share a single account.

### Core Concepts

- **Family:** A group of 1–4 users who share access to all pets in the family. Every user belongs to exactly one family at a time.
- **Admin:** The family creator. Can invite/remove members and rename the family. One admin per family.
- **Member:** Can do everything with pets and records (add, edit, delete, archive) but cannot manage family membership.
- **Invite code:** A 6-character code (e.g., `PAW-3KX`) shared via the native share sheet. Valid for 7 days. One active code per family.

### Permission Matrix

| Action | Admin | Member |
|--------|-------|--------|
| View/edit all pets & records | Yes | Yes |
| Add/archive/delete pets | Yes | Yes |
| Add/edit/delete any record | Yes | Yes |
| Log medication doses | Yes | Yes |
| Invite members | Yes | No |
| Remove members | Yes | No |
| Rename family | Yes | No |
| Leave family | No* | Yes |

\* Admin cannot leave while other members exist — must remove them first, or transfer ownership (v2).

---

## Data Model Changes

### New Tables

#### families

```sql
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My human family',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.families enable row level security;
```

#### family_members

```sql
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

alter table public.family_members enable row level security;
```

#### family_invites

```sql
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

alter table public.family_members enable row level security;
```

### Schema Changes to Existing Tables

#### pets — add family_id, add created_by

```sql
alter table public.pets add column family_id uuid references public.families(id);
alter table public.pets add column created_by uuid references public.users(id);

-- After backfill migration:
alter table public.pets alter column family_id set not null;
```

The existing `user_id` column on pets becomes redundant once `family_id` is in place. It can be dropped after migration, or kept as a legacy alias for `created_by`. Decision: **drop `user_id` from pets** after migration — `family_id` is the access-control column, `created_by` tracks who added the pet.

#### Record tables — add created_by, modified_by

Add audit columns to all record tables. These are nullable for backwards compatibility with existing data (backfill with the pet owner's user_id).

```sql
-- Apply to: vaccinations, vet_visits, medications, weight_entries, food_entries, medication_doses
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
```

### Updated Signup Trigger

When a new user signs up, auto-create a family and add them as admin:

```sql
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
```

### Data Migration for Existing Users

```sql
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

-- Step 6: Drop user_id from pets (no longer needed for access control)
alter table public.pets drop column user_id;

-- Step 7: Create index
create index idx_pets_family_id on public.pets(family_id);
```

---

## RLS Policy Changes

### families

```sql
-- Users can see families they belong to
create policy "family_members_view" on public.families
  for select using (
    id in (select family_id from public.family_members where user_id = auth.uid())
  );

-- Only admin can update their family
create policy "family_admin_update" on public.families
  for update using (
    id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Family creation is handled by the trigger (security definer), not direct inserts
```

### family_members

```sql
-- Users can see members of their own family
create policy "view_family_members" on public.family_members
  for select using (
    family_id in (select family_id from public.family_members where user_id = auth.uid())
  );

-- Only admin can delete members (remove from family)
create policy "admin_remove_members" on public.family_members
  for delete using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Members can delete their own row (leave family)
create policy "member_leave" on public.family_members
  for delete using (user_id = auth.uid() and role = 'member');

-- Insert is handled by the invite acceptance flow (via service function or RPC)
```

### family_invites

```sql
-- Admin can see and create invites for their family
create policy "admin_manage_invites" on public.family_invites
  for all using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Any authenticated user can read an invite by code (to preview before accepting)
create policy "anyone_read_invite_by_code" on public.family_invites
  for select using (auth.uid() is not null);
```

### pets (replace existing policy)

```sql
-- Drop old policy
drop policy "pets_own_data" on public.pets;

-- Family members can access all family pets
create policy "family_pets_access" on public.pets
  for all using (
    family_id in (
      select family_id from public.family_members where user_id = auth.uid()
    )
  );
```

### Record tables (replace existing policies)

Same pattern for all record tables — access is derived through pet → family membership:

```sql
-- Template for: vaccinations, vet_visits, medications, weight_entries, food_entries
drop policy "vaccinations_own_data" on public.vaccinations;

create policy "family_vaccinations_access" on public.vaccinations
  for all using (
    pet_id in (
      select id from public.pets where family_id in (
        select family_id from public.family_members where user_id = auth.uid()
      )
    )
  );

-- Same pattern for medication_doses (through medications → pets → family)
drop policy "medication_doses_own_data" on public.medication_doses;

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
```

### Storage (updated read access)

```sql
-- Drop old policies
drop policy "pet_photos_policy" on storage.objects;
drop policy "vet_attachments_policy" on storage.objects;

-- Upload: user uploads to their own folder (no change)
create policy "pet_photos_upload" on storage.objects
  for insert with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: any family member can read photos of family pets
-- (We keep the simple folder-based check for upload, but allow read for family members)
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

-- Update/delete: only the uploader (original owner) can modify/delete
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
```

---

## Invite Flow

### Creating an Invite (Admin)

```
Admin taps "Invite Member" in Family settings
       │
       ▼
App calls familyService.createInvite(familyId)
  → Checks: family has < 4 members
  → Checks: no active (unexpired, unaccepted) invite exists, or revokes it
  → Generates 6-char alphanumeric code (uppercase, no ambiguous chars like 0/O/1/I)
  → Inserts into family_invites with expires_at = now() + 7 days
  → Returns the invite code
       │
       ▼
App shows the code prominently with a "Share" button
  → Native Share API opens (iMessage, WhatsApp, etc.)
  → Share text: "Join my pet family on Bemy! Use code: PAW-3KX"
       │
       ▼
Admin can also see the active code in the family settings card
  → With option to revoke (delete) the invite
```

### Accepting an Invite (New/Existing User)

```
User opens app → goes to Settings → "Join a Family"
  → Or: sees a banner if they're in a solo family with no pets (optional, v2)
       │
       ▼
User enters the 6-character invite code
       │
       ▼
App calls familyService.previewInvite(code)
  → Validates code exists and hasn't expired
  → Returns: family name, admin name, member count
  → Shows preview: "Join 'The Dinhs'? Created by Jack. 1 member."
       │
       ▼
User taps "Join"
       │
       ▼
App calls familyService.acceptInvite(code)
  → Server-side logic (Supabase RPC function):
    1. Validate code is active and unexpired
    2. Check family has < 4 members
    3. Check user is not already in this family
    4. If user has pets in their current (solo) family:
       a. Move all pets to the new family (update family_id)
       b. Update pet photos storage paths? No — keep as-is, RLS handles read access
    5. Remove user from their old family
    6. Delete old family if it's now empty
    7. Insert user into new family as 'member'
    8. Mark invite as accepted (set accepted_by, accepted_at)
       │
       ▼
App refreshes family data and pet list
  → User now sees all pets from the family they joined
```

### Invite Code Format

- 6 alphanumeric characters, uppercase
- Exclude ambiguous characters: 0, O, 1, I, L
- Character set: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (30 chars)
- Display format: `XXX-XXX` (hyphenated for readability)
- ~729 million possible codes — more than sufficient

---

## Service Layer

### New: familyService.ts

```typescript
// services/familyService.ts
export const familyService = {
  // Get current user's family with members
  async getFamily(): Promise<Family & { members: FamilyMember[] }>,

  // Update family name (admin only)
  async updateFamilyName(familyId: string, name: string): Promise<void>,

  // Create an invite code (admin only)
  async createInvite(familyId: string): Promise<FamilyInvite>,

  // Revoke active invite (admin only)
  async revokeInvite(inviteId: string): Promise<void>,

  // Get active invite for a family (admin only)
  async getActiveInvite(familyId: string): Promise<FamilyInvite | null>,

  // Preview an invite by code (any authenticated user)
  async previewInvite(code: string): Promise<InvitePreview>,

  // Accept an invite (joins the family)
  async acceptInvite(code: string): Promise<void>,

  // Remove a member (admin only)
  async removeMember(memberId: string): Promise<void>,

  // Leave family (member only — moves to a new solo family)
  async leaveFamily(): Promise<void>,

  // Get current user's role in their family
  async getMyRole(): Promise<'admin' | 'member'>,
};
```

### Changes to petService.ts

```typescript
// petService.create() — pass family_id and created_by instead of user_id
async create(pet: PetInsert): Promise<Pet> {
  // pet now includes family_id and created_by (from session + familyStore)
  // No user_id field
}
```

### Changes to record services

All `create` and `update` methods set `created_by` / `modified_by`:

```typescript
// Example: healthService.createVaccination()
async createVaccination(vaccination: VaccinationInsert): Promise<Vaccination> {
  const { data, error } = await supabase
    .from('vaccinations')
    .insert({
      ...vaccination,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();
  // ...
}

// Example: healthService.updateVaccination()
async updateVaccination(id: string, updates: Partial<Vaccination>): Promise<Vaccination> {
  const { data, error } = await supabase
    .from('vaccinations')
    .update({
      ...updates,
      modified_by: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  // ...
}
```

---

## State Management

### New: familyStore.ts (Zustand)

```typescript
// stores/familyStore.ts
interface FamilyState {
  family: Family | null;
  members: FamilyMember[];
  myRole: 'admin' | 'member' | null;
  loading: boolean;

  loadFamily: () => Promise<void>;
  clearFamily: () => void;
}
```

Family data is loaded once on app startup (after auth) and refreshed when:
- User accepts an invite (joins a family)
- Admin invites/removes a member
- User leaves a family

### Changes to authStore

On sign-out, also clear family store.

---

## New Types

```typescript
// types/index.ts additions

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // Joined from users table:
  email?: string;
}

export interface FamilyInvite {
  id: string;
  family_id: string;
  invite_code: string;
  invited_by: string;
  expires_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface InvitePreview {
  family_name: string;
  admin_email: string;
  member_count: number;
  expires_at: string;
}
```

---

## UI/UX Design

### Settings Screen — Family Section

Positioned between "Preferences" and "Your Pets" sections.

```
FAMILY
┌─────────────────────────────────────────────┐
│  My human family                          ✎ │  ← editable name (admin only)
│                                             │
│  📧 jack@email.com (You)          Admin     │
│  📧 sarah@email.com               Member  ✕ │  ← remove button (admin only)
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │       Invite Member                 │    │  ← admin only, disabled if 4 members
│  └─────────────────────────────────────┘    │
│                                             │
│  Active invite: PAW-3KX (expires in 5d)  ✕  │  ← shown if active invite exists
└─────────────────────────────────────────────┘
```

**For members**, the card shows a "Leave Family" link at the bottom instead of invite controls.

### Invite Flow Screen

New screen: `app/(main)/settings/join-family.tsx`

```
┌──────────────────────────────────────┐
│  ← Back          Join a Family       │
│                                      │
│  Enter the invite code shared with   │
│  you by a family admin.              │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  Invite Code                 │    │
│  │  [ PAW-3KX ]                 │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │  ← shown after valid code entered
│  │  You're joining:             │    │
│  │  "The Dinhs"                 │    │
│  │  Created by jack@email.com   │    │
│  │  1 member                    │    │
│  └──────────────────────────────┘    │
│                                      │
│  ⚠ Your existing pets will move to   │  ← shown if user has pets
│  this family.                        │
│                                      │
│  ┌──────────────────────────────┐    │
│  │          Join Family          │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Invite Share Screen

New screen or modal: `app/(main)/settings/invite-member.tsx`

```
┌──────────────────────────────────────┐
│  ← Back        Invite Member         │
│                                      │
│  Share this code with the person     │
│  you'd like to invite.               │
│                                      │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │        PAW - 3KX             │    │  ← large, prominent code
│  │                              │    │
│  │     Expires in 7 days        │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        Share Code             │    │  ← opens native share sheet
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        Copy Code              │    │  ← copies to clipboard
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Navigation Entry Point

In Settings, below the member list, add a link for non-admin users:

```
Join a Family →
```

This navigates to the join-family screen.

### Dashboard Changes

No major changes. `petService.getAll()` returns family pets automatically via RLS. Optional future enhancement: show a small member avatar on pet cards.

---

## Supabase RPC Functions

Some operations (like accepting an invite) involve multi-step logic that should be atomic. Use Supabase RPC (Postgres functions) for these:

### accept_invite(invite_code text)

```sql
create or replace function public.accept_invite(invite_code text)
returns void as $$
declare
  v_invite family_invites%rowtype;
  v_current_family_id uuid;
  v_current_member_count int;
  v_new_family_member_count int;
begin
  -- Find the invite
  select * into v_invite
  from public.family_invites
  where family_invites.invite_code = accept_invite.invite_code
    and expires_at > now()
    and accepted_by is null;

  if v_invite is null then
    raise exception 'Invalid or expired invite code';
  end if;

  -- Check new family isn't full
  select count(*) into v_new_family_member_count
  from public.family_members where family_id = v_invite.family_id;

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

  -- Mark invite as accepted
  update public.family_invites
  set accepted_by = auth.uid(), accepted_at = now()
  where id = v_invite.id;
end;
$$ language plpgsql security definer;
```

### leave_family()

```sql
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

  -- Move pets they created to their new family (optional: move all or none)
  -- Decision: pets stay with the family, user leaves without taking pets
  -- If we want to let them take their pets:
  -- update public.pets set family_id = v_new_family_id
  -- where family_id = v_current_family_id and created_by = auth.uid();

  -- Remove from old family
  delete from public.family_members where user_id = auth.uid();

  -- Add to new family as admin
  insert into public.family_members (family_id, user_id, role)
  values (v_new_family_id, auth.uid(), 'admin');
end;
$$ language plpgsql security definer;
```

**Open question:** When a member leaves, do their pets stay with the family or go with them? For MVP, **pets stay with the family** — this avoids messy "who gets the dog" logic. The user can always re-add their pets in their new solo family.

---

## Implementation Sequence

### Phase 1: Database Foundation
1. Write and run the migration SQL (new tables, schema changes, RLS policies, RPC functions)
2. Backfill data for existing users (create families, assign pets)
3. Regenerate TypeScript types from Supabase

### Phase 2: Service & State Layer
4. Add new types to `types/index.ts`
5. Create `familyService.ts` with all methods
6. Create `familyStore.ts` (Zustand)
7. Update `petService.ts` — use `family_id` instead of `user_id` on create
8. Update all record service `create`/`update` methods to set `created_by`/`modified_by`
9. Update signup flow to work with new trigger (verify auto-family-creation works)

### Phase 3: UI — Family Management
10. Add Family section to Settings screen (member list, admin controls)
11. Build invite-member screen (code generation, share sheet)
12. Build join-family screen (code entry, preview, accept)
13. Add "Leave Family" flow for members

### Phase 4: Polish & Edge Cases
14. Handle the "user with existing pets joins a family" migration UX
15. Error handling for expired/invalid codes
16. Loading states and optimistic updates
17. Tests for familyService, updated petService tests, UI tests

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/003_family_sharing.sql` | All schema + RLS + RPC changes |
| `services/familyService.ts` | Family CRUD, invite management |
| `stores/familyStore.ts` | Zustand store for family state |
| `hooks/useFamily.ts` | Hook for family data fetching |
| `app/(main)/settings/invite-member.tsx` | Invite code generation/sharing screen |
| `app/(main)/settings/join-family.tsx` | Join family via code screen |
| `types/family.ts` | Zod schemas for family forms (optional) |

## Files to Modify

| File | Change |
|------|--------|
| `types/database.ts` | Regenerate from Supabase |
| `types/index.ts` | Add Family, FamilyMember, FamilyInvite types |
| `services/petService.ts` | Use `family_id` + `created_by` instead of `user_id` |
| `services/healthService.ts` | Add `created_by`/`modified_by` to create/update methods |
| `services/foodService.ts` | Same |
| `stores/authStore.ts` | Clear family store on sign-out |
| `app/(main)/settings/index.tsx` | Add Family section UI |
| `app/(main)/settings/_layout.tsx` | Add routes for new screens (if using Stack) |
| `app/(main)/pets/add.tsx` | Pass `family_id` instead of `user_id` on pet create |
| `hooks/usePets.ts` | May need to pass `family_id` for pet creation |
| `docs/pawlife-data-model.md` | Update ERD and table definitions |

---

## Future Enhancements (Not in Scope)

- **Transfer admin ownership** — let admin promote a member to admin
- **Activity feed** — "Sarah logged Buddy's medication 5m ago"
- **Per-pet permissions** — member can only see certain pets (not needed for families)
- **Deep link invites** — `bemy://invite/PAW-3KX` for one-tap join
- **Temporary access / pet sitter view** — different model, read-only, time-limited
- **Multiple families** — one user in several families (shared custody scenarios)
- **Member avatars/display names** — currently using email, could add profile names
