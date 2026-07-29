-- users_profile: one row per authenticated user, holding role + display name
create table if not exists public.users_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('coach', 'client')),
  created_at timestamptz not null default now()
);

alter table public.users_profile enable row level security;

-- Users can read their own profile row (needed by middleware/layout role checks)
create policy "Users can view own profile"
  on public.users_profile
  for select
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth.users row is created.
-- Reads full_name/role out of the new user's metadata (set these when
-- creating the user in the Supabase dashboard or via the admin API).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
