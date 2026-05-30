-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists public.users_profile (
  id          uuid        primary key references auth.users (id) on delete cascade,
  full_name   text,
  is_admin    boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- Enable Row-Level Security
alter table public.users_profile enable row level security;

-- Users can only read/update their own profile
create policy "Users can view own profile"
  on public.users_profile for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users_profile for update
  using (auth.uid() = id);

-- Automatically insert a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users_profile (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- Attach the trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
