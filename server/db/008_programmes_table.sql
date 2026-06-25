-- Programmes table: the 4 original fixed programmes become rows here, plus
-- admins can create additional custom programmes via the Programme Builder.
create table if not exists public.programmes (
  id            integer primary key,
  name          text not null,
  description   text,
  color         text not null default '#0D5C63',
  week_count    integer not null default 8,
  is_custom     boolean not null default false,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

insert into public.programmes (id, name, description, color, week_count, is_custom) values
(1, 'HRV Optimisation', 'Rebuilding autonomic resilience through all three pillars', '#0F4C81', 8, false),
(2, 'Anxiety Management', 'Calming the nervous system through breath, posture, and chemistry', '#6B21A8', 8, false),
(3, 'Cardiovascular Endurance', 'Expanding aerobic capacity through breathing efficiency', '#166534', 8, false),
(4, 'Sleep Improvement', 'Preparing the body and nervous system for deep, restorative rest', '#1E3A5F', 8, false)
on conflict (id) do nothing;

alter table public.programmes enable row level security;
create policy "Anyone can read programmes" on public.programmes for select using (true);
create policy "Admins can manage programmes" on public.programmes for all
  using (exists (select 1 from public.users_profile where id = auth.uid() and is_admin = true));

-- Relax programme_sessions constraints: week/phase length now varies per programme,
-- and 0 means "unassigned" (not yet placed in any programme).
alter table public.programme_sessions drop constraint if exists programme_sessions_programme_id_check;
alter table public.programme_sessions drop constraint if exists programme_sessions_week_check;
alter table public.programme_sessions drop constraint if exists programme_sessions_phase_check;
alter table public.programme_sessions add constraint programme_sessions_week_check check (week between 0 and 52);
alter table public.programme_sessions add constraint programme_sessions_phase_check check (phase between 0 and 26);

-- Allow assigning users to any programme (including custom ones), not just 1-4.
alter table public.user_assessments drop constraint if exists user_assessments_assigned_programme_check;
