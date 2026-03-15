-- Feedback table for bug reports and feature ideas
create table public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  category text check (category in ('bug', 'idea')),
  description text not null,
  app_version text,
  device_model text,
  os_name text,
  os_version text,
  screen_name text,
  created_at timestamptz default now()
);

-- RLS: users can insert their own feedback, cannot read/update/delete
alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);
