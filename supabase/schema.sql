-- Listkompis – multi-list schema
-- Run this in the Supabase SQL editor (fresh project).

-- Lists
create table if not exists public.lists (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null check (char_length(name) > 0 and char_length(name) <= 100),
  created_at timestamptz not null default now(),
  created_by uuid        references auth.users(id) on delete set null
);

-- Memberships (user ↔ list, with favorite flag)
create table if not exists public.list_members (
  list_id     uuid        not null references public.lists(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  is_favorite boolean     not null default false,
  joined_at   timestamptz not null default now(),
  primary key (list_id, user_id)
);

-- Checklist items
create table if not exists public.items (
  id         uuid        primary key default gen_random_uuid(),
  list_id    uuid        not null references public.lists(id) on delete cascade,
  text       text        not null check (char_length(text) > 0 and char_length(text) <= 500),
  is_checked boolean     not null default false,
  created_at timestamptz not null default now(),
  created_by uuid        references auth.users(id) on delete set null
);

-- Invite tokens for sharing lists
create table if not exists public.list_invites (
  id         uuid        primary key default gen_random_uuid(),
  list_id    uuid        not null references public.lists(id) on delete cascade,
  token      text        not null unique default encode(gen_random_bytes(24), 'base64url'),
  created_by uuid        references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.lists        enable row level security;
alter table public.list_members enable row level security;
alter table public.items        enable row level security;
alter table public.list_invites enable row level security;

-- lists: readable/writable only if you are a member
create policy "Members can view their lists"
  on public.lists for select to authenticated
  using (exists (
    select 1 from public.list_members
    where list_id = lists.id and user_id = auth.uid()
  ));

create policy "Authenticated users can create lists"
  on public.lists for insert to authenticated
  with check (auth.uid() = created_by);

-- list_members: see your own memberships; join via function only
create policy "Users can view their own memberships"
  on public.list_members for select to authenticated
  using (user_id = auth.uid());

create policy "Users can update their own membership (favorite)"
  on public.list_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- items: members of the list can read/write
create policy "Members can view items"
  on public.items for select to authenticated
  using (exists (
    select 1 from public.list_members
    where list_id = items.list_id and user_id = auth.uid()
  ));

create policy "Members can insert items"
  on public.items for insert to authenticated
  with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.list_members
      where list_id = items.list_id and user_id = auth.uid()
    )
  );

create policy "Members can toggle items"
  on public.items for update to authenticated
  using (exists (
    select 1 from public.list_members
    where list_id = items.list_id and user_id = auth.uid()
  ));

-- list_invites: members can view and create invites for their lists
create policy "Members can view invites"
  on public.list_invites for select to authenticated
  using (exists (
    select 1 from public.list_members
    where list_id = list_invites.list_id and user_id = auth.uid()
  ));

create policy "Members can create invites"
  on public.list_invites for insert to authenticated
  with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.list_members
      where list_id = list_invites.list_id and user_id = auth.uid()
    )
  );

-- ─── Join-via-invite function ─────────────────────────────────────────────────

create or replace function public.join_list_with_token(p_token text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_list_id uuid;
begin
  select list_id into v_list_id
  from public.list_invites
  where token = p_token;

  if v_list_id is null then
    raise exception 'Invalid invite token';
  end if;

  insert into public.list_members (list_id, user_id)
  values (v_list_id, auth.uid())
  on conflict (list_id, user_id) do nothing;

  return v_list_id;
end;
$$;

-- ─── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.items;
