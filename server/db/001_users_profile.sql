-- Run this in your Supabase SQL editor after creating the project.

create table if not exists public.users_profile (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Row Level Security: users can only read/update their own profile
alter table public.users_profile enable row level security;

create policy "Users can view own profile"
  on public.users_profile for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users_profile for update
  using (auth.uid() = id);

-- Trigger function: auto-insert a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users_profile (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
