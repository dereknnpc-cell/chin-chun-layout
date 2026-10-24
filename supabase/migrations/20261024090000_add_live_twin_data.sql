-- IoT/MES equipment status and RTLS positions for the live twin (see LIVE-DATA.md).
-- Gateways write with the service role (bypasses RLS); members read; owners/editors
-- manage MES bindings and RTLS calibration. Layout tables are not touched.
begin;

create table if not exists public.equipment_bindings (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source text not null check (char_length(btrim(source)) between 1 and 40),
  source_id text not null check (char_length(btrim(source_id)) between 1 and 120),
  cad_id text not null check (char_length(btrim(cad_id)) between 1 and 120),
  note text check (note is null or char_length(note) <= 200),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid,
  primary key (workspace_id, source, source_id)
);

create table if not exists public.equipment_status_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  cad_id text not null check (char_length(btrim(cad_id)) between 1 and 120),
  source_id text,
  source text not null default 'iot',
  status text not null check (status in ('run', 'idle', 'setup', 'down', 'offline')),
  work_order text,
  product text,
  count integer check (count is null or count >= 0),
  target integer check (target is null or target >= 0),
  oee numeric(5, 4) check (oee is null or oee between 0 and 1),
  alarm text,
  ts timestamptz not null,
  received_at timestamptz not null default timezone('utc', now())
);

create index if not exists equipment_status_events_lookup_idx
  on public.equipment_status_events (workspace_id, cad_id, ts desc);
create index if not exists equipment_status_events_ts_brin
  on public.equipment_status_events using brin (ts);

-- Latest state per machine, kept by trigger; the twin subscribes to this table.
create table if not exists public.equipment_status_current (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  cad_id text not null,
  source_id text,
  source text not null,
  status text not null check (status in ('run', 'idle', 'setup', 'down', 'offline')),
  work_order text,
  product text,
  count integer,
  target integer,
  oee numeric(5, 4),
  alarm text,
  ts timestamptz not null,
  primary key (workspace_id, cad_id)
);

-- Positions are stored as received: frame 'rtls' is raw anchor coordinates
-- (converted with the active calibration), 'cad' is already CAD metres.
create table if not exists public.rtls_positions (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  tag text not null check (char_length(btrim(tag)) between 1 and 120),
  kind text not null default 'person' check (kind in ('person', 'forklift', 'cart', 'asset')),
  label text,
  x double precision not null check (abs(x) < 1e6),
  y double precision not null check (abs(y) < 1e6),
  floor text not null default '1F' check (floor in ('1F', '2F')),
  frame text not null default 'rtls' check (frame in ('rtls', 'cad')),
  source text not null default 'rtls',
  ts timestamptz not null,
  received_at timestamptz not null default timezone('utc', now())
);

create index if not exists rtls_positions_tag_idx
  on public.rtls_positions (workspace_id, tag, ts desc);
create index if not exists rtls_positions_ts_brin
  on public.rtls_positions using brin (ts);

create table if not exists public.rtls_tags_current (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  tag text not null,
  kind text not null,
  label text,
  x double precision not null,
  y double precision not null,
  floor text not null,
  frame text not null,
  source text not null,
  ts timestamptz not null,
  primary key (workspace_id, tag)
);

create table if not exists public.rtls_calibrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  -- [{"rtls":[x,y],"cad":[x,y]}, ...] as accepted by ChinChunLive.calibrate().
  pairs jsonb not null check (jsonb_typeof(pairs) = 'array' and jsonb_array_length(pairs) >= 2),
  note text check (note is null or char_length(note) <= 200),
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create unique index if not exists rtls_calibrations_one_active_idx
  on public.rtls_calibrations (workspace_id)
  where is_active;

-- Out-of-order rows stay in history but never overwrite a newer current state.
create or replace function private.upsert_equipment_status_current()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.equipment_status_current as c
    (workspace_id, cad_id, source_id, source, status, work_order, product, count, target, oee, alarm, ts)
  values
    (new.workspace_id, new.cad_id, new.source_id, new.source, new.status, new.work_order, new.product, new.count, new.target, new.oee, new.alarm, new.ts)
  on conflict (workspace_id, cad_id) do update set
    source_id = excluded.source_id,
    source = excluded.source,
    status = excluded.status,
    work_order = coalesce(excluded.work_order, c.work_order),
    product = coalesce(excluded.product, c.product),
    count = coalesce(excluded.count, c.count),
    target = coalesce(excluded.target, c.target),
    oee = coalesce(excluded.oee, c.oee),
    alarm = excluded.alarm,
    ts = excluded.ts
  where excluded.ts >= c.ts;
  return null;
end;
$$;

create or replace function private.upsert_rtls_tag_current()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.rtls_tags_current as c
    (workspace_id, tag, kind, label, x, y, floor, frame, source, ts)
  values
    (new.workspace_id, new.tag, new.kind, new.label, new.x, new.y, new.floor, new.frame, new.source, new.ts)
  on conflict (workspace_id, tag) do update set
    kind = excluded.kind,
    label = coalesce(excluded.label, c.label),
    x = excluded.x,
    y = excluded.y,
    floor = excluded.floor,
    frame = excluded.frame,
    source = excluded.source,
    ts = excluded.ts
  where excluded.ts >= c.ts;
  return null;
end;
$$;

create or replace function private.set_live_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'equipment_bindings' then
    new.updated_at := timezone('utc', now());
    new.updated_by := auth.uid();
  elsif tg_op = 'INSERT' then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function private.upsert_equipment_status_current() from public, anon, authenticated;
revoke all on function private.upsert_rtls_tag_current() from public, anon, authenticated;
revoke all on function private.set_live_audit_fields() from public, anon, authenticated;

drop trigger if exists equipment_status_events_current on public.equipment_status_events;
create trigger equipment_status_events_current
after insert on public.equipment_status_events
for each row execute function private.upsert_equipment_status_current();

drop trigger if exists rtls_positions_current on public.rtls_positions;
create trigger rtls_positions_current
after insert on public.rtls_positions
for each row execute function private.upsert_rtls_tag_current();

drop trigger if exists equipment_bindings_audit on public.equipment_bindings;
create trigger equipment_bindings_audit
before insert or update on public.equipment_bindings
for each row execute function private.set_live_audit_fields();

drop trigger if exists rtls_calibrations_audit on public.rtls_calibrations;
create trigger rtls_calibrations_audit
before insert on public.rtls_calibrations
for each row execute function private.set_live_audit_fields();

alter table public.equipment_bindings enable row level security;
alter table public.equipment_status_events enable row level security;
alter table public.equipment_status_current enable row level security;
alter table public.rtls_positions enable row level security;
alter table public.rtls_tags_current enable row level security;
alter table public.rtls_calibrations enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['equipment_bindings', 'equipment_status_events', 'equipment_status_current', 'rtls_positions', 'rtls_tags_current', 'rtls_calibrations'] loop
    execute format('drop policy if exists "members can read live data" on public.%I', t);
    execute format('create policy "members can read live data" on public.%I for select to authenticated using (private.current_workspace_role(workspace_id) is not null)', t);
  end loop;
  foreach t in array array['equipment_bindings', 'rtls_calibrations'] loop
    execute format('drop policy if exists "editors can add live config" on public.%I', t);
    execute format('create policy "editors can add live config" on public.%I for insert to authenticated with check (private.current_workspace_role(workspace_id) in (''owner'', ''editor''))', t);
    execute format('drop policy if exists "editors can update live config" on public.%I', t);
    execute format('create policy "editors can update live config" on public.%I for update to authenticated using (private.current_workspace_role(workspace_id) in (''owner'', ''editor'')) with check (private.current_workspace_role(workspace_id) in (''owner'', ''editor''))', t);
    execute format('drop policy if exists "editors can delete live config" on public.%I', t);
    execute format('create policy "editors can delete live config" on public.%I for delete to authenticated using (private.current_workspace_role(workspace_id) in (''owner'', ''editor''))', t);
  end loop;
end
$$;

revoke all on public.equipment_bindings, public.equipment_status_events, public.equipment_status_current,
  public.rtls_positions, public.rtls_tags_current, public.rtls_calibrations from anon, authenticated;
grant select on public.equipment_status_events, public.equipment_status_current,
  public.rtls_positions, public.rtls_tags_current to authenticated;
grant select, insert, update, delete on public.equipment_bindings, public.rtls_calibrations to authenticated;
grant select, insert on public.equipment_status_events, public.rtls_positions to service_role;
grant select on public.equipment_status_current, public.rtls_tags_current to service_role;
grant select, insert, update, delete on public.equipment_bindings, public.rtls_calibrations to service_role;

do $$
declare
  t text;
begin
  foreach t in array array['equipment_status_current', 'rtls_tags_current', 'rtls_calibrations', 'equipment_bindings'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;

commit;
