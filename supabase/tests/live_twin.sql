-- Production-compatible smoke test. All fixtures are isolated and rolled back.
begin;
select set_config('test.live_workspace', gen_random_uuid()::text, true);
select set_config('test.live_user', gen_random_uuid()::text, true);
insert into public.workspaces(id,name) values (current_setting('test.live_workspace')::uuid,'Live twin verification fixture');
insert into public.workspace_members(workspace_id,email,role) values
  (current_setting('test.live_workspace')::uuid,'live-owner@example.invalid','owner'),
  (current_setting('test.live_workspace')::uuid,'live-editor@example.invalid','editor'),
  (current_setting('test.live_workspace')::uuid,'live-viewer@example.invalid','viewer');

set local role service_role;
insert into public.equipment_status_events(workspace_id,cad_id,status,count,alarm,ts) values
  (current_setting('test.live_workspace')::uuid,'test-machine','down',41,'E1',now()),
  (current_setting('test.live_workspace')::uuid,'test-machine','run',1,null,now()-interval '1 minute'),
  (current_setting('test.live_workspace')::uuid,'test-machine','run',null,null,now()+interval '1 second');
insert into public.rtls_positions(workspace_id,tag,x,y,ts) values
  (current_setting('test.live_workspace')::uuid,'test-tag',11,12,now()),
  (current_setting('test.live_workspace')::uuid,'test-tag',1,2,now()-interval '1 minute');
do $$ begin
  if not exists(select 1 from public.equipment_status_current where workspace_id=current_setting('test.live_workspace')::uuid and cad_id='test-machine' and status='run' and count=41 and alarm is null) then raise exception 'equipment trigger/order/alarm failed'; end if;
  if not exists(select 1 from public.rtls_tags_current where workspace_id=current_setting('test.live_workspace')::uuid and x=11 and y=12) then raise exception 'position trigger/order failed'; end if;
  begin
    insert into public.rtls_positions(workspace_id,tag,x,y,ts) values(current_setting('test.live_workspace')::uuid,'bad','NaN'::float8,0,now());
    raise exception 'NaN accepted';
  exception when check_violation then null; end;
end $$;
reset role;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.live_user'),'role','authenticated','email','live-owner@example.invalid')::text,true);
set local role authenticated;
insert into public.equipment_bindings(workspace_id,source,source_id,cad_id) values(current_setting('test.live_workspace')::uuid,'mes','test-mes','test-machine');
insert into public.rtls_calibrations(workspace_id,pairs,is_active) values(current_setting('test.live_workspace')::uuid,'[{"rtls":[0,0],"cad":[10,0]},{"rtls":[1,0],"cad":[11,0]}]',true);
do $$ begin
  if not exists(select 1 from public.equipment_bindings where workspace_id=current_setting('test.live_workspace')::uuid and updated_by=current_setting('test.live_user')::uuid) then raise exception 'owner config/audit failed'; end if;
end $$;
reset role;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.live_user'),'role','authenticated','email','live-editor@example.invalid')::text,true);
set local role authenticated;
update public.equipment_bindings set note='editor verification' where workspace_id=current_setting('test.live_workspace')::uuid;
do $$ begin
  if not exists(select 1 from public.equipment_bindings where workspace_id=current_setting('test.live_workspace')::uuid and note='editor verification') then raise exception 'editor update failed'; end if;
  begin
    insert into public.equipment_status_events(workspace_id,cad_id,status,ts) values(current_setting('test.live_workspace')::uuid,'forbidden','run',now());
    raise exception 'editor wrote status';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.live_user'),'role','authenticated','email','live-viewer@example.invalid')::text,true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.equipment_status_current where workspace_id=current_setting('test.live_workspace')::uuid)<>1 then raise exception 'viewer read failed'; end if;
  begin
    insert into public.equipment_bindings(workspace_id,source,source_id,cad_id) values(current_setting('test.live_workspace')::uuid,'mes','forbidden','test-machine');
    raise exception 'viewer wrote config';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.live_user'),'role','authenticated','email','live-outsider@example.invalid')::text,true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.equipment_status_current where workspace_id=current_setting('test.live_workspace')::uuid) then raise exception 'non-member read data'; end if;
  if exists(select 1 from public.rtls_tags_current where workspace_id=current_setting('test.live_workspace')::uuid) then raise exception 'non-member read locations'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.equipment_status_current;
    raise exception 'anonymous read data';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: service writes, ordering, alarms, coordinates, owner/editor/viewer/non-member/anon RLS; fixtures rolled back' as live_twin_smoke_test;
