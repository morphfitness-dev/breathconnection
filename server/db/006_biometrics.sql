create table if not exists public.user_biometrics (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  resting_heart_rate   integer,
  hrv                  integer,
  sleep_hours          numeric(4,1),
  sleep_quality        integer check (sleep_quality between 1 and 5),
  systolic             integer,
  diastolic            integer,
  notes                text,
  recorded_at          timestamptz not null default now()
);

alter table public.user_biometrics enable row level security;
create policy "Users own biometrics" on public.user_biometrics for all using (auth.uid() = user_id);
