-- Listkompis – shared checklist schema
-- Run this in the Supabase SQL editor after creating a project.

create table if not exists public.items (
  id         uuid        primary key default gen_random_uuid(),
  text       text        not null check (char_length(text) > 0 and char_length(text) <= 500),
  is_checked boolean     not null default false,
  created_at timestamptz not null default now(),
  created_by uuid        references auth.users(id) on delete set null
);

-- Row Level Security
alter table public.items enable row level security;

create policy "Authenticated users can view items"
  on public.items for select
  to authenticated
  using (true);

create policy "Authenticated users can insert their own items"
  on public.items for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can toggle items"
  on public.items for update
  to authenticated
  using (true)
  with check (true);

-- Enable Realtime for live sync across users
alter publication supabase_realtime add table public.items;
