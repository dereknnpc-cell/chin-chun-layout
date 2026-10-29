const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../live-twin.js'),'utf8');
const W='workspace',now=1792900000000;
const layout={equipment:[{id:'machine',code:'A1-1'}]};
const pairs=x=>[{rtls:[0,0],cad:[x,0]},{rtls:[1,0],cad:[x+1,0]}];
const calibration=x=>[{workspace_id:W,is_active:true,pairs:pairs(x)}];
const position=(ts=now,x=1)=>({workspace_id:W,tag:'T',kind:'person',x,y:0,frame:'rtls',ts});
const status=(extra={})=>({workspace_id:W,cad_id:'machine',status:'run',ts:now,...extra});
const flush=()=>new Promise(r=>setImmediate(r));
function setup(){
  const window={},timers=new Map();let timerId=0;
  class Clock extends Date{static now(){return now;}}
  vm.runInNewContext(source,{window,Date:Clock,queueMicrotask,console:{warn(){}},setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
  const live=window.ChinChunLive;live.attach({layout:()=>layout});return {live,timers};
}
function fake(tables,holdTable){
  const channels=[],queries=[];let release,held=false,fail=false;
  const client={from(table){
    const q={filters:[],select(){return q;},eq(k,v){q.filters.push([k,v]);return q;},limit(){return q;},then(ok,bad){
      queries.push(table);
      const result={data:(tables[table]||[]).filter(r=>q.filters.every(([k,v])=>r[k]===v)),error:fail?Error('offline'):null};
      if(table===holdTable&&!held){held=true;return new Promise(r=>release=()=>r(result)).then(ok,bad);}
      return Promise.resolve(result).then(ok,bad);
    }};return q;
  },channel(){const ch={handlers:[],on(_,cfg,fn){ch.handlers.push({cfg,fn});return ch;},subscribe(fn){ch.status=fn;return ch;},emit(table,row){ch.handlers.filter(h=>h.cfg.table===table).forEach(h=>h.fn({new:row}));}};channels.push(ch);return ch;},removeChannel(ch){ch.removed=true;}};
  return {client,channels,queries,get release(){return release;},set fail(value){fail=value;}};
}
function start(live,f){const provider=live.providers.supabase(f.client,{workspaceId:W});live.use(provider);f.channels.at(-1).status('SUBSCRIBED');return provider;}

test('cloud buffers newer realtime rows until calibration/bindings finish and never paints uncalibrated positions',async()=>{
  const {live}=setup(),tables={equipment_bindings:[{workspace_id:W,source_id:'MES-07',cad_id:'A1-1'}],rtls_calibrations:calibration(10),rtls_tags_current:[position(now-1)],equipment_status_current:[status({ts:now-1,count:1})]};
  const f=fake(tables,'equipment_bindings');start(live,f);await flush();
  f.channels[0].emit('rtls_tags_current',position());f.channels[0].emit('equipment_status_current',status({cad_id:'MES-07',count:99}));
  assert.equal(live.positions().length,0);assert.equal(live.equipmentState('machine'),null);
  f.release();await flush();assert.equal(live.positions()[0].x,11);assert.equal(live.equipmentState('machine').count,99);live.stop();
});
test('config changes during an outstanding snapshot invalidate it and trigger another complete load',async()=>{
  const {live}=setup(),tables={rtls_calibrations:calibration(10)},f=fake(tables,'equipment_status_current');start(live,f);await flush();
  tables.rtls_calibrations=calibration(20);f.channels[0].emit('rtls_calibrations',{});f.channels[0].emit('rtls_tags_current',position());
  f.release();await flush();assert.equal(live.toCad(0,0)[0],20);assert.equal(live.positions()[0].x,21);
  assert.equal(f.queries.filter(t=>t==='rtls_calibrations').length,2);live.stop();
});
test('recalibration reprojects the latest raw position and its entire trail even when snapshot timestamps are older',async()=>{
  const {live}=setup(),tables={rtls_calibrations:calibration(10),rtls_tags_current:[position(now-10)]},f=fake(tables);start(live,f);await flush();
  f.channels[0].emit('rtls_tags_current',position(now,2));assert.equal(live.positions()[0].x,12);
  live.ingest({type:'position',tag:'CAD',x:100,y:0,frame:'cad',ts:now});
  tables.rtls_calibrations=calibration(20);f.channels[0].emit('rtls_calibrations',{});await flush();
  const tag=live.positions().find(t=>t.tag==='T');assert.equal(tag.x,22);assert.equal(tag.ts,now);assert.deepEqual(Array.from(tag.trail,p=>Array.from(p)),[[21,0],[22,0]]);
  assert.equal(live.positions().find(t=>t.tag==='CAD').x,100);live.stop();
});
test('a cleared database alarm replaces the old alarm instead of being treated as an omitted field',async()=>{
  const {live}=setup(),f=fake({equipment_status_current:[status({status:'down',alarm:'E1'})]});start(live,f);await flush();
  f.channels[0].emit('equipment_status_current',status({alarm:null,ts:now+1}));assert.equal(live.equipmentState('machine').alarm,null);assert.equal(live.equipmentState('machine').status,'run');live.stop();
});
test('late cloud loads and callbacks cannot mutate a new source, including its calibration and bindings',async()=>{
  const {live,timers}=setup(),f=fake({rtls_calibrations:calibration(100),equipment_bindings:[{workspace_id:W,source_id:'external',cad_id:'missing'}]},'equipment_bindings');
  start(live,f);await flush();live.use({name:'new',start({calibrate,bind,ingest}){calibrate({tx:5});bind({external:'A1-1'});ingest({type:'equipment',id:'external',status:'down',ts:now});},stop(){}});
  f.release();f.channels[0].emit('rtls_tags_current',position());f.channels[0].status('SUBSCRIBED');await flush();
  assert.equal(live.mode(),'new');assert.equal(live.toCad(0,0)[0],5);assert.equal(live.equipmentState('machine').status,'down');assert.equal(live.positions().length,0);assert.equal(f.channels[0].removed,true);
  live.stop();assert.equal(timers.size,0);
});
test('source guards protect calibration and bindings even for a misbehaving custom provider',()=>{
  const {live}=setup();let callbacks;
  live.use({start(api){callbacks=api;},stop(){}});live.stop();live.calibrate({tx:5});live.bind({external:'A1-1'});
  callbacks.calibrate({tx:99});callbacks.bind({external:'missing'});live.ingest({type:'equipment',id:'external',status:'run',ts:now});
  assert.equal(live.toCad(0,0)[0],5);assert.equal(live.equipmentState('machine').status,'run');live.stop();
});
test('cloud retry recovers atomically from query errors and stopping cancels retry timers',async()=>{
  const {live,timers}=setup(),f=fake({rtls_calibrations:calibration(10),rtls_tags_current:[position()]});f.fail=true;start(live,f);await flush();
  assert.equal(live.positions().length,0);assert.equal(live.toCad(0,0)[0],0);
  const [id,retry]=[...timers].find(([,t])=>t.ms===1000);timers.delete(id);f.fail=false;retry.fn();await flush();
  assert.equal(live.positions()[0].x,11);live.stop();assert.equal(timers.size,0);
});
test('reusing a cloud provider does not reactivate its previous session',async()=>{
  const {live}=setup(),f=fake({rtls_calibrations:calibration(10)},'equipment_status_current');const provider=start(live,f);await flush();
  live.stop();live.use(provider);f.channels[1].status('SUBSCRIBED');await flush();
  f.release();f.channels[0].emit('rtls_tags_current',position(now+1,99));f.channels[1].emit('rtls_tags_current',position());await flush();
  assert.equal(live.positions()[0].x,11);live.stop();
});
