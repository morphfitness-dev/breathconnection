create table if not exists public.user_assessments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  bolt_score          integer,
  symptoms            text[] default '{}',
  stress_level        integer check (stress_level between 1 and 5),
  anxiety_level       integer check (anxiety_level between 1 and 5),
  sleep_quality       integer check (sleep_quality between 1 and 5),
  energy_level        integer check (energy_level between 1 and 5),
  panic_frequency     text,
  goals               text[] default '{}',
  activity_level      text,
  time_commitment     text,
  prior_experience    text,
  contraindications   text[] default '{}',
  assigned_programme  integer check (assigned_programme between 1 and 4),
  pillar_weights      jsonb,
  created_at          timestamptz not null default now()
);

alter table public.user_assessments enable row level security;

create policy "Users can view own assessment"
  on public.user_assessments for select
  using (auth.uid() = user_id);

create policy "Users can insert own assessment"
  on public.user_assessments for insert
  with check (auth.uid() = user_id);
