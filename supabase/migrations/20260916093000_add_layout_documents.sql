create table if not exists public.layout_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  layout_data jsonb,
  custom_library jsonb not null default '[]'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (workspace_id, name)
);

create unique index if not exists layout_documents_one_primary_idx
  on public.layout_documents (workspace_id)
  where is_primary;

create index if not exists layout_documents_workspace_updated_idx
  on public.layout_documents (workspace_id, updated_at desc);

drop trigger if exists layout_documents_audit on public.layout_documents;
create trigger layout_documents_audit
before update on public.layout_documents
for each row execute function private.set_layout_audit_fields();

alter table public.layout_documents enable row level security;

drop policy if exists "members can read documents" on public.layout_documents;
create policy "members can read documents"
on public.layout_documents for select
to authenticated
using (private.current_workspace_role(workspace_id) is not null);

drop policy if exists "editors can create documents" on public.layout_documents;
create policy "editors can create documents"
on public.layout_documents for insert
to authenticated
with check (
  private.current_workspace_role(workspace_id) in ('owner', 'editor')
  and (created_by is null or created_by = (select auth.uid()))
);

drop policy if exists "editors can update documents" on public.layout_documents;
create policy "editors can update documents"
on public.layout_documents for update
to authenticated
using (private.current_workspace_role(workspace_id) in ('owner', 'editor'))
with check (private.current_workspace_role(workspace_id) in ('owner', 'editor'));

drop policy if exists "owners or creators can delete copies" on public.layout_documents;
create policy "owners or creators can delete copies"
on public.layout_documents for delete
to authenticated
using (
  not is_primary
  and (
    private.current_workspace_role(workspace_id) = 'owner'
    or created_by = (select auth.uid())
  )
);

revoke all on public.layout_documents from anon, authenticated;
grant select, insert, update, delete on public.layout_documents to authenticated;

insert into public.layout_documents (
  workspace_id,
  name,
  layout_data,
  custom_library,
  revision,
  is_primary,
  updated_at,
  updated_by
)
select
  workspace_id,
  '共用正式配置',
  layout_data,
  custom_library,
  revision,
  true,
  updated_at,
  updated_by
from public.factory_layouts source
where not exists (
  select 1
  from public.layout_documents existing
  where existing.workspace_id = source.workspace_id
    and existing.is_primary
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'layout_documents'
  ) then
    alter publication supabase_realtime add table public.layout_documents;
  end if;
end
$$;
