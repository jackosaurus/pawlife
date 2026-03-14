-- Medication dose tracking for recurring medications
create table medication_doses (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  given_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_medication_doses_medication_id on medication_doses(medication_id);
create index idx_medication_doses_latest on medication_doses(medication_id, given_at desc);

-- RLS
alter table medication_doses enable row level security;

create policy "Users can manage their own medication doses"
  on medication_doses
  for all
  using (
    medication_id in (
      select id from medications where pet_id in (
        select id from pets where user_id = auth.uid()
      )
    )
  );
