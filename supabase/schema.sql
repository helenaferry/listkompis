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
  token      text        not null unique default rtrim(replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'), '='),
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
  with check (true);

-- list_members: see your own memberships; join via function only
create policy "Users can view their own memberships"
  on public.list_members for select to authenticated
  using (user_id = auth.uid());

create policy "Users can update their own membership (favorite)"
  on public.list_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can join lists"
  on public.list_members for insert to authenticated
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

-- list_invites: any authenticated user can view (needed to join via link)
create policy "Authenticated users can view invites"
  on public.list_invites for select to authenticated
  using (true);

create policy "Members can create invites"
  on public.list_invites for insert to authenticated
  with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.list_members
      where list_id = list_invites.list_id and user_id = auth.uid()
    )
  );

-- ─── RPC functions ───────────────────────────────────────────────────────────

create or replace function public.create_list(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_list_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.lists (name, created_by)
  values (p_name, v_user_id)
  returning id into v_list_id;

  insert into public.list_members (list_id, user_id)
  values (v_list_id, v_user_id);

  return v_list_id;
end;
$$;

create or replace function public.set_favorite(p_list_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.list_members set is_favorite = false where user_id = v_user_id;
  update public.list_members set is_favorite = true where user_id = v_user_id and list_id = p_list_id;
end;
$$;

create or replace function public.remove_favorite(p_list_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.list_members set is_favorite = false where user_id = v_user_id and list_id = p_list_id;
end;
$$;

create or replace function public.get_or_create_invite(p_list_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_token   text;
begin
  select token into v_token from public.list_invites where list_id = p_list_id limit 1;
  if v_token is not null then return v_token; end if;

  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  insert into public.list_invites (list_id, created_by) values (p_list_id, v_user_id) returning token into v_token;
  return v_token;
end;
$$;

create or replace function public.get_invite_details(p_token text)
returns table(list_name text, inviter_email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select l.name::text, u.email::text
  from public.list_invites li
  join public.lists l on l.id = li.list_id
  left join auth.users u on u.id = li.created_by
  where li.token = p_token;
end;
$$;

create or replace function public.rename_list(p_list_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  if not exists (
    select 1 from public.list_members
    where list_id = p_list_id and user_id = v_user_id
  ) then
    raise exception 'Not a member of this list';
  end if;

  update public.lists set name = p_name where id = p_list_id;
end;
$$;

create or replace function public.join_list_with_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
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

-- REPLICA IDENTITY FULL is required for filtered subscriptions (list_id=eq.x)
-- to work correctly for UPDATE and DELETE events.
alter table public.items replica identity full;

alter publication supabase_realtime add table public.items;
