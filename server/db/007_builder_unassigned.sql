-- Allow sessions to be "unassigned" (0) when removed from a programme slot in the Programme Builder.
alter table public.programme_sessions drop constraint if exists programme_sessions_programme_id_check;
alter table public.programme_sessions add constraint programme_sessions_programme_id_check check (programme_id between 0 and 4);

alter table public.programme_sessions drop constraint if exists programme_sessions_week_check;
alter table public.programme_sessions add constraint programme_sessions_week_check check (week between 0 and 8);

alter table public.programme_sessions drop constraint if exists programme_sessions_phase_check;
alter table public.programme_sessions add constraint programme_sessions_phase_check check (phase between 0 and 4);
