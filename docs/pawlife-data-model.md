# Bemy — Data Model & Data Flow

## How the Pieces Fit Together

```
User opens app
       │
       ▼
┌─────────────────┐     JWT token      ┌──────────────────┐
│  Expo App        │◄──────────────────►│  Supabase Auth   │
│                  │                    │  (GoTrue)        │
│  Screen          │                    └──────────────────┘
│    ↓             │
│  Hook            │    HTTPS + JWT     ┌──────────────────┐
│    ↓             │◄──────────────────►│  Supabase REST   │
│  Service Layer   │                    │  (PostgREST)     │
│                  │                    │    ↓              │
│                  │                    │  Postgres + RLS   │
│                  │                    └──────────────────┘
│                  │
│  Image Picker    │    HTTPS + JWT     ┌──────────────────┐
│    ↓             │◄──────────────────►│  Supabase Storage│
│  Service Layer   │                    │  (S3-compatible)  │
└─────────────────┘                    └──────────────────┘
```

Every request from the app includes a JWT token. Supabase uses that token to identify the user and enforce Row Level Security — the database itself rejects any query that tries to access another user's data. There is no API server in between. The app talks directly to Supabase's REST API.

---

## Data Model

### Entity Relationship Diagram

```
users (1) ──── (many) pets (1) ──┬── (many) vet_visits (1) ── (many) vet_visit_attachments
                                 ├── (many) vaccinations
                                 ├── (many) medications
                                 ├── (many) weight_entries
                                 └── (many) food_entries
```

Every record belongs to a pet. Every pet belongs to a user. This is the only relationship that matters for authorization — if you own the pet, you own all its records.

### Table Definitions

These are written as Supabase SQL migrations. You'd run these in the Supabase SQL editor or via the CLI (`supabase db push`).

#### users

This extends Supabase's built-in `auth.users` table with app-specific profile data.

```sql
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
```

#### pets

```sql
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
```

#### vet_visits

```sql
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
```

#### vet_visit_attachments

```sql
create table public.vet_visit_attachments (
  id uuid primary key default gen_random_uuid(),
  vet_visit_id uuid not null references public.vet_visits(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'document')),
  file_name text,
  created_at timestamptz not null default now()
);

create index idx_attachments_visit_id on public.vet_visit_attachments(vet_visit_id);
```

#### vaccinations

```sql
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
```

#### medications

```sql
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
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_medications_pet_id on public.medications(pet_id);
create index idx_medications_pet_active on public.medications(pet_id) where is_archived = false;
```

#### weight_entries

```sql
create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  weight decimal not null,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_weight_entries_pet_id on public.weight_entries(pet_id);
```

#### food_entries

```sql
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
```

### Row Level Security (RLS)

This is what replaces your entire authorization layer. Every query automatically gets filtered by the logged-in user.

```sql
-- Enable RLS on all tables
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

-- For record tables, verify ownership through the pet
-- (user owns the pet that owns the record)
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
```

### Storage Buckets

```sql
-- Create storage buckets
insert into storage.buckets (id, name, public)
values
  ('pet-photos', 'pet-photos', true),        -- Profile photos are public (accessible via URL)
  ('vet-attachments', 'vet-attachments', false); -- Attachments are private (signed URLs)

-- RLS for storage: users can only upload/access files in their own folder
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
```

File paths follow the pattern: `{user_id}/{pet_id}/{filename}`. This keeps files organized and makes RLS simple.

---

## Data Flows

### Flow 1: Sign Up

```
User taps "Create Account"
       │
       ▼
App calls: supabase.auth.signUp({ email, password })
       │
       ▼
Supabase Auth creates user in auth.users
       │
       ▼
Database trigger fires: handle_new_user()
  → Creates row in public.users with id + email
       │
       ▼
Supabase returns session (JWT token)
       │
       ▼
App stores session (Supabase JS client handles this automatically via AsyncStorage)
       │
       ▼
App navigates to Dashboard (empty state)
```

### Flow 2: Add a Pet

```
User fills out Add Pet form and taps "Add Luna to Your Family"
       │
       ▼
If user selected a profile photo:
  App compresses image (expo-image-manipulator, ~500KB target)
       │
       ▼
  App calls: supabase.storage.from('pet-photos').upload(
    `${userId}/${petId}/profile.jpg`, compressedImage
  )
       │
       ▼
  Supabase Storage saves file, returns public URL
       │
       ▼
App calls: supabase.from('pets').insert({
  user_id: session.user.id,
  pet_type: 'dog',
  name: 'Luna',
  breed: 'Golden Retriever',
  date_of_birth: '2023-03-15',
  sex: 'female',
  weight: 28.5,
  profile_photo_url: photoUrl   // from storage upload, or null
})
       │
       ▼
Supabase checks RLS: does user_id match auth.uid()? ✓
       │
       ▼
Row inserted into pets table, returns the new pet object
       │
       ▼
App navigates to Dashboard, new pet card appears
```

### Flow 3: Add a Vaccination

```
User is on Luna's Pet Detail screen, taps FAB → "Vaccination"
       │
       ▼
Add Vaccination form opens
  - User selects "Rabies" from dropdown
  - App auto-suggests next_due_date = date_administered + 3 years
  - User confirms or adjusts
       │
       ▼
User taps "Save"
       │
       ▼
App calls: supabase.from('vaccinations').insert({
  pet_id: luna.id,
  vaccine_name: 'Rabies',
  date_administered: '2026-03-10',
  next_due_date: '2029-03-10',
  clinic_name: 'City Vet Clinic'
})
       │
       ▼
RLS check: does luna.id belong to a pet where user_id = auth.uid()? ✓
       │
       ▼
Row inserted, returned to app
       │
       ▼
App navigates back to Pet Detail
  - Health summary card updates (vaccination count, status pill)
  - Recent activity shows the new vaccination
```

### Flow 4: Load Pet Detail Screen

This is the most data-heavy screen. Here's what it fetches:

```
User taps Luna's card on Dashboard
       │
       ▼
App navigates to Pet Detail screen for luna.id
       │
       ▼
Screen calls the petService to load all data for this pet.
Multiple parallel requests fire:

  1. supabase.from('pets').select('*').eq('id', petId).single()
     → Returns Luna's profile

  2. supabase.from('vaccinations').select('*').eq('pet_id', petId)
       .order('date_administered', { ascending: false })
     → Returns all vaccinations (for status pill calculation)

  3. supabase.from('medications').select('*').eq('pet_id', petId)
       .eq('is_archived', false)
     → Returns active medications count

  4. supabase.from('vet_visits').select('*').eq('pet_id', petId)
       .order('date', { ascending: false }).limit(1)
     → Returns most recent vet visit

  5. supabase.from('weight_entries').select('*').eq('pet_id', petId)
       .order('date', { ascending: false }).limit(1)
     → Returns latest weight

  6. supabase.from('food_entries').select('*').eq('pet_id', petId)
       .is('end_date', null)
     → Returns current food (end_date is null = current)

  7. Combined recent activity query (latest 3 records across all types):
     This can be done client-side by merging the results above,
     or via a Postgres view/function if you want it server-side.

       │
       ▼
All requests resolve (typically 100-300ms total with parallel execution)
       │
       ▼
Screen renders:
  - Pet header (from query 1)
  - Health summary card (derived from queries 2, 3, 4, 5)
  - Recent activity (derived from merging latest records)
  - Current food card (from query 6)
```

**Design decision:** These are multiple small queries rather than one big join. This is intentional — it keeps each query simple, cacheable, and independently loadable. The screen can render progressively (pet header first, then health data as it arrives) rather than waiting for one massive response.

### Flow 5: Edit a Record

```
User is viewing a Vaccination Detail screen, taps "Edit"
       │
       ▼
Edit form opens, pre-filled with existing data
User changes next_due_date from 2029 to 2027
       │
       ▼
User taps "Save Changes"
       │
       ▼
App calls: supabase.from('vaccinations')
  .update({ next_due_date: '2027-03-10', updated_at: new Date() })
  .eq('id', vaccinationId)
       │
       ▼
RLS check passes → Row updated → Returned to app
       │
       ▼
App navigates back to detail view with updated data
```

### Flow 6: Delete a Record

```
User is viewing a Vet Visit Detail, taps "Delete"
       │
       ▼
Confirmation dialog appears: "Delete this vet visit?"
       │
       ▼
User confirms
       │
       ▼
App calls: supabase.from('vet_visits')
  .delete()
  .eq('id', visitId)
       │
       ▼
RLS check passes → Row deleted
  (vet_visit_attachments cascade-deleted automatically via FK)
       │
       ▼
App navigates back to health records list
```

### Flow 7: Upload a Vet Visit Attachment

```
User is on Add/Edit Vet Visit form, taps "Add photos or files"
       │
       ▼
expo-image-picker opens (camera or library)
       │
       ▼
User selects a photo of a vet receipt
       │
       ▼
App compresses image (expo-image-manipulator)
       │
       ▼
App shows thumbnail preview in the form (local URI)
       │
       ▼
User fills out rest of form, taps "Save"
       │
       ▼
Step 1: Insert vet visit record
  supabase.from('vet_visits').insert({...}).select().single()
  → Returns new vet visit with id
       │
       ▼
Step 2: Upload file to storage
  supabase.storage.from('vet-attachments')
    .upload(`${userId}/${petId}/${visitId}/${filename}`, file)
  → Returns file path
       │
       ▼
Step 3: Create attachment record
  supabase.from('vet_visit_attachments').insert({
    vet_visit_id: visitId,
    file_url: filePath,
    file_type: 'image',
    file_name: 'receipt.jpg'
  })
       │
       ▼
Done — navigate back to pet detail
```

**Note:** Steps 1-3 are sequential (each depends on the previous). If step 2 or 3 fails, you'd want to clean up. For MVP, a simple try/catch with an error toast is fine. Transactional uploads are a Phase 2 concern.

### Flow 8: Change Food

```
User taps "Change food" on Pet Detail
       │
       ▼
Change Food form opens with banner:
  "Luna's current food (Royal Canin) will be saved to her food history"
       │
       ▼
User fills out new food details, taps "Save"
       │
       ▼
Step 1: Close out current food
  supabase.from('food_entries')
    .update({ end_date: new Date(), reason_for_change: 'Vet recommended' })
    .eq('pet_id', petId)
    .is('end_date', null)
       │
       ▼
Step 2: Insert new food entry
  supabase.from('food_entries').insert({
    pet_id: petId,
    brand: 'Hills Science Diet',
    product_name: 'Adult Large Breed',
    food_type: 'dry',
    amount_per_meal: '2 cups',
    meals_per_day: 2,
    start_date: new Date(),
    end_date: null          // null = this is the current food
  })
       │
       ▼
Both succeed → navigate back to pet detail with updated food card
```

---

## Service Layer Pattern

Here's what the service layer looks like in practice. This is the abstraction that keeps Supabase contained.

```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,    // Persists session across app restarts
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

```typescript
// services/petService.ts
import { supabase } from './supabase';
import { Pet, PetInsert } from '../types';

export const petService = {
  async getAll(): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('is_archived', false)
      .order('created_at');

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(pet: PetInsert): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .insert(pet)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Pet>): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('pets')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('pets')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
```

```typescript
// Usage in a screen component
import { useState, useEffect } from 'react';
import { petService } from '../services/petService';
import { Pet } from '../types';

function DashboardScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPets();
  }, []);

  async function loadPets() {
    try {
      setLoading(true);
      const data = await petService.getAll();
      setPets(data);
    } catch (err) {
      setError('Failed to load your pet family');
    } finally {
      setLoading(false);
    }
  }

  // ... render loading/error/data states
}
```

Every other record type (vaccinations, medications, etc.) follows the same pattern: a service file with `getAll`, `getById`, `create`, `update`, `delete` methods. The screen components call the service, manage loading/error state, and render.

---

## Decisions to Make Now

### 1. Supabase project region
Pick the region closest to you. For Australia: Sydney (`ap-southeast-2`). This affects latency for every API call. Can't change later without migrating.

### 2. UUID generation strategy
The schema above uses `gen_random_uuid()` in Postgres (server-side). This is simpler. The alternative is generating UUIDs client-side (for optimistic UI updates — you know the ID before the server responds). For MVP, server-side is fine.

### 3. Image compression target
Recommend 500KB max for profile photos, 1MB max for vet attachments. This keeps storage costs low and upload times fast on mobile data. Set this as a constant and compress client-side before upload.

### 4. Date handling
Store all dates as `date` (no timezone) for things like vaccination dates and vet visits — these are calendar dates, not moments in time. Store `timestamptz` for system fields (created_at, updated_at). Use `date-fns` in the app for formatting and age calculation.

### 5. How to handle "current food"
The schema uses `end_date is null` to indicate current food. This is simpler than a separate `is_current` boolean because you never have to worry about two foods both being marked current. When changing food, you set end_date on the old one and insert the new one with null end_date in sequence.

### 6. Environment variables
You need two: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Both are safe to embed in the client — the anon key only grants access to what RLS allows. Never embed the service_role key in the app.

### 7. Typing
Generate TypeScript types from your Supabase schema using the CLI: `supabase gen types typescript`. This gives you type-safe queries and catches schema mismatches at compile time. Worth doing from day one.
