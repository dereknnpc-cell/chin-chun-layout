begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.workspaces (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and position('@' in email) > 1),
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, email)
);

create index if not exists workspace_members_email_workspace_idx
  on public.workspace_members (email, workspace_id);

create table if not exists public.factory_layouts (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  layout_data jsonb,
  custom_library jsonb not null default '[]'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid
);

create or replace function private.current_workspace_role(target_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select wm.role
  from public.workspace_members wm
  where (select auth.uid()) is not null
    and wm.workspace_id = target_workspace_id
    and wm.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  limit 1
$$;

revoke all on function private.current_workspace_role(uuid) from public, anon;
grant execute on function private.current_workspace_role(uuid) to authenticated;

create or replace function private.set_layout_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := timezone('utc', now());
  new.updated_by := auth.uid();
  return new;
end;
$$;

revoke all on function private.set_layout_audit_fields() from public, anon, authenticated;

drop trigger if exists factory_layouts_audit on public.factory_layouts;
create trigger factory_layouts_audit
before update on public.factory_layouts
for each row execute function private.set_layout_audit_fields();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.factory_layouts enable row level security;

drop policy if exists "members can view workspace" on public.workspaces;
create policy "members can view workspace"
on public.workspaces for select
to authenticated
using (private.current_workspace_role(id) is not null);

drop policy if exists "members can view member list" on public.workspace_members;
create policy "members can view member list"
on public.workspace_members for select
to authenticated
using (private.current_workspace_role(workspace_id) is not null);

drop policy if exists "owners can add members" on public.workspace_members;
create policy "owners can add members"
on public.workspace_members for insert
to authenticated
with check (private.current_workspace_role(workspace_id) = 'owner');

drop policy if exists "owners can update members" on public.workspace_members;
create policy "owners can update members"
on public.workspace_members for update
to authenticated
using (private.current_workspace_role(workspace_id) = 'owner')
with check (private.current_workspace_role(workspace_id) = 'owner');

drop policy if exists "owners can remove members" on public.workspace_members;
create policy "owners can remove members"
on public.workspace_members for delete
to authenticated
using (
  private.current_workspace_role(workspace_id) = 'owner'
  and not (
    email = lower(coalesce(((select auth.jwt()) ->> 'email'), ''))
    and role = 'owner'
  )
);

drop policy if exists "members can read layout" on public.factory_layouts;
create policy "members can read layout"
on public.factory_layouts for select
to authenticated
using (private.current_workspace_role(workspace_id) is not null);

drop policy if exists "editors can initialize layout" on public.factory_layouts;
create policy "editors can initialize layout"
on public.factory_layouts for insert
to authenticated
with check (private.current_workspace_role(workspace_id) in ('owner', 'editor'));

drop policy if exists "editors can update layout" on public.factory_layouts;
create policy "editors can update layout"
on public.factory_layouts for update
to authenticated
using (private.current_workspace_role(workspace_id) in ('owner', 'editor'))
with check (private.current_workspace_role(workspace_id) in ('owner', 'editor'));

revoke all on public.workspaces, public.workspace_members, public.factory_layouts from anon;
revoke all on public.workspaces, public.workspace_members, public.factory_layouts from authenticated;
grant select on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update on public.factory_layouts to authenticated;

insert into public.workspaces (id, name)
values ('4b6e4e34-c332-4edc-9d06-a7c380272496', '金讚廠房配置')
on conflict (id) do update set name = excluded.name;

insert into public.workspace_members (workspace_id, email, role)
values ('4b6e4e34-c332-4edc-9d06-a7c380272496', 'dereknnpc@gmail.com', 'owner')
on conflict (workspace_id, email) do update set role = excluded.role;

insert into public.factory_layouts (workspace_id, layout_data, custom_library)
values ('4b6e4e34-c332-4edc-9d06-a7c380272496', null, '[]'::jsonb)
on conflict (workspace_id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'factory_layouts'
  ) then
    alter publication supabase_realtime add table public.factory_layouts;
  end if;
end
$$;

commit;
