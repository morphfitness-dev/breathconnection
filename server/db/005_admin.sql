create table if not exists public.admin_notes (
  id              uuid primary key default gen_random_uuid(),
  admin_user_id   uuid not null references auth.users(id) on delete cascade,
  target_user_id  uuid not null references auth.users(id) on delete cascade,
  note            text not null,
  created_at      timestamptz not null default now()
);

alter table public.admin_notes enable row level security;
create policy "Admins only" on public.admin_notes for all
  using (exists (select 1 from public.users_profile where id = auth.uid() and is_admin = true));

create table if not exists public.invite_codes (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  email               text not null,
  used                boolean not null default false,
  created_by_admin    uuid references auth.users(id),
  used_at             timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.invite_codes enable row level security;
create policy "Admins can manage invite codes" on public.invite_codes for all
  using (exists (select 1 from public.users_profile where id = auth.uid() and is_admin = true));
create policy "Public can read unused code by value" on public.invite_codes for select
  using (true);
