const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../live-twin.js'),'utf8');
const layout=JSON.parse(fs.readFileSync(require.resolve('../factory_layout_data.json'),'utf8'));

function load(){
  const window={},timers=[];
  const context={window,console,queueMicrotask,Date,Math,JSON,Number,String,Array,Map,Set,Object,Error,
    setInterval:(fn)=>{timers.push(fn);return timers.length;},clearInterval:()=>{timers.length=0;}};
  vm.runInNewContext(source,context);
  window.ChinChunLive.attach({layout:()=>layout});
  return {live:window.ChinChunLive,timers};
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('equipment events resolve by CAD id, equipment code or explicit MES binding',()=>{
  const {live}=load(),a11=layout.equipment.find(e=>e.code==='A1-1');
  assert.equal(live.ingest([{type:'equipment',id:'a1-1',status:'run',workOrder:'WO-1'},{type:'equipment',id:'eq_dc_n1_1',status:'down'}]),2);
  assert.equal(live.equipmentState(a11.id).status,'run');
  assert.equal(live.equipmentState(a11.id).workOrder,'WO-1');
  assert.equal(live.equipmentState('eq_dc_n1_1').status,'down');
  live.bind({'MES-WC-07':a11.id});live.ingest({type:'equipment',id:'MES-WC-07',status:'setup',count:12});
  assert.equal(live.equipmentState(a11.id).status,'setup');
  assert.equal(live.equipmentState(a11.id).workOrder,'WO-1');
  assert.equal(live.equipmentState(a11.id).count,12);
});

test('unknown status keeps the previous state and stale data reads as offline',()=>{
  const {live}=load();
  live.ingest({type:'equipment',id:'eq_dc_n1_1',status:'run'});
  live.ingest({type:'equipment',id:'eq_dc_n1_1',status:'exploded'});
  assert.equal(live.equipmentState('eq_dc_n1_1').status,'run');
  live.ingest({type:'equipment',id:'eq_dc_n1_1',status:'run',ts:Date.now()-live.options.staleMs-1000});
  const state=live.equipmentState('eq_dc_n1_1');
  assert.equal(state.status,'offline');assert.equal(state.stale,true);
});

test('RTLS positions: invalid rows dropped, out-of-order rejected, trail bounded, floor filtered',()=>{
  const {live}=load(),t0=Date.now();
  assert.equal(live.ingest([{type:'position',tag:'P1',x:'nan',y:1},{type:'position',x:1,y:1},{type:'bogus'}]),0);
  for(let i=0;i<40;i++)live.ingest({type:'position',tag:'P1',kind:'person',x:i,y:2,frame:'cad',ts:t0+i});
  assert.equal(live.ingest({type:'position',tag:'P1',x:-5,y:-5,frame:'cad',ts:t0}),0);
  const [p]=live.positions('1F');
  assert.equal(p.x,39);assert.equal(p.trail.length,live.options.trail);
  live.ingest({type:'position',tag:'F2',kind:'forklift',x:1,y:1,floor:'2F',frame:'cad'});
  assert.equal(live.positions('2F').map(t=>t.tag).join(),'F2');
  assert.equal(live.positions('1F').length,1);
});

test('two-pair calibration fits rotation, scale and offset into CAD metres',()=>{
  const {live}=load();
  // RTLS frame rotated 90°, 1 unit = 0.5 m, origin at CAD (10, 20).
  live.calibrate([{rtls:[0,0],cad:[10,20]},{rtls:[2,0],cad:[10,21]}]);
  const [x,y]=live.toCad(0,4);close(x,8);close(y,20);
  live.ingest({type:'position',tag:'T',x:2,y:0});
  const [p]=live.positions('1F');close(p.x,10);close(p.y,21);
});

test('three-pair calibration fits an affine including a flipped Y axis',()=>{
  const {live}=load();
  live.calibrate([{rtls:[0,0],cad:[5,40]},{rtls:[10,0],cad:[15,40]},{rtls:[0,10],cad:[5,30]},{rtls:[10,10],cad:[15,30]}]);
  const [x,y]=live.toCad(3,7);close(x,8);close(y,33);
  assert.throws(()=>live.calibrate([{rtls:[0,0],cad:[0,0]},{rtls:[1,1],cad:[1,1]},{rtls:[2,2],cad:[2,2]}]),/collinear/);
  assert.throws(()=>live.calibrate([{rtls:[0,0],cad:[0,0]}]),/two point pairs/);
});

test('simulation moves tags along CAD routes and reports every machine without touching layout',()=>{
  const {live,timers}=load(),before=JSON.stringify(layout);
  live.use(live.providers.simulation({people:4}));
  assert.equal(live.mode(),'simulation');assert.equal(timers.length,1);
  const tags=live.positions('1F');
  assert.equal(tags.filter(t=>t.kind==='forklift').length,layout.flows.filter(f=>f.type==='forklift').length);
  assert.equal(tags.filter(t=>t.kind==='person').length,4);
  const width=layout.grid.factory_width+5,depth=layout.grid.factory_depth+10;
  for(const t of tags)assert.ok(t.x>=-2 && t.x<=width && t.y>=-1 && t.y<=depth,`${t.tag} ${t.x},${t.y}`);
  const machines=layout.equipment.filter(e=>e.code && !/^(Furniture|Door|Window|Storage|Elevator|Stairs|Infrastructure|Office|Sanitary)$/.test(e.category||''));
  assert.equal(live.snapshot().equipment.length,machines.length);
  assert.ok(live.snapshot().equipment.every(s=>live.STATUS.includes(s.status)));
  timers[0]();
  live.stop();
  assert.equal(live.mode(),'off');assert.equal(live.positions('1F').length,0);assert.equal(timers.length,0);
  assert.equal(JSON.stringify(layout),before);
});

test('websocket provider maps gateway payloads, ignores bad JSON and reconnects with backoff',()=>{
  const sockets=[],delays=[];
  class FakeSocket{constructor(url){this.url=url;sockets.push(this);}close(){this.onclose?.();}}
  const window={},context={window,console:{warn(){}},queueMicrotask,Date,Math,JSON,Number,String,Array,Map,Set,Object,Error,WebSocket:FakeSocket,
    setTimeout:(fn,ms)=>{delays.push(ms);fn();return delays.length;},clearTimeout(){}};
  vm.runInNewContext(source,context);const live=window.ChinChunLive;live.attach({layout:()=>layout});
  live.use(live.providers.websocket('wss://gateway.local/twin',{map:raw=>raw.rows.map(r=>({type:'position',tag:r.id,x:r.px,y:r.py,frame:'cad'}))}));
  assert.equal(live.mode(),'live');assert.equal(sockets[0].url,'wss://gateway.local/twin');
  sockets[0].onopen();sockets[0].onmessage({data:JSON.stringify({rows:[{id:'R1',px:3,py:4}]})});
  sockets[0].onmessage({data:'{broken'});
  assert.equal(live.positions('1F')[0].x,3);
  sockets[0].onclose();
  assert.equal(sockets.length,2);assert.equal(delays[0],1000);
  sockets[1].onclose();assert.equal(delays[1],2000);
  live.stop();const count=sockets.length;sockets.at(-1).onclose?.();assert.equal(sockets.length,count);
});

function fakeSupabase(tables){
  const queries=[],channels=[];
  const client={
    from(table){
      const q={table,filters:[],select(){return q;},eq(k,v){q.filters.push([k,v]);return q;},limit(n){q.n=n;return q;},
        then(resolve,reject){queries.push(q);const rows=(tables[table]||[]).filter(r=>q.filters.every(([k,v])=>r[k]===v)).slice(0,q.n??Infinity);return Promise.resolve({data:rows,error:null}).then(resolve,reject);}};
      return q;
    },
    channel(name){const ch={name,handlers:[],removed:false,on(type,cfg,fn){ch.handlers.push({cfg,fn});return ch;},subscribe(fn){ch.status=fn;return ch;},emit(table,row){ch.handlers.filter(h=>h.cfg.table===table).forEach(h=>h.fn({new:row}));}};channels.push(ch);return ch;},
    removeChannel(ch){ch.removed=true;}
  };
  return {client,queries,channels};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));

test('supabase provider seeds from current tables with calibration and bindings, then follows realtime',async()=>{
  const W='ws-1',now=new Date().toISOString(),a11=layout.equipment.find(e=>e.code==='A1-1');
  const tables={
    equipment_bindings:[{workspace_id:W,source:'mes',source_id:'WC-07',cad_id:a11.id},{workspace_id:'other',source:'mes',source_id:'X',cad_id:'eq_dc_n1_1'}],
    rtls_calibrations:[{workspace_id:W,is_active:true,pairs:[{rtls:[0,0],cad:[5,40]},{rtls:[95,0],cad:[100,40]},{rtls:[0,40],cad:[5,0]}]}],
    equipment_status_current:[{workspace_id:W,cad_id:'WC-07',status:'down',work_order:'WO-9',count:3,target:null,oee:'0.8125',alarm:null,source:'mes',ts:now}],
    rtls_tags_current:[{workspace_id:W,tag:'EMP-1',kind:'person',label:null,x:10,y:10,floor:'1F',frame:'rtls',source:'rtls',ts:now}]
  };
  const {live}=load(),fake=fakeSupabase(tables);
  live.use(live.providers.supabase(fake.client,{workspaceId:W}));
  assert.equal(live.mode(),'cloud');
  const ch=fake.channels[0];
  assert.equal(ch.handlers.map(h=>h.cfg.table).join(),'equipment_status_current,rtls_tags_current,rtls_calibrations,equipment_bindings');
  assert.ok(ch.handlers.every(h=>h.cfg.filter==='workspace_id=eq.ws-1'));
  ch.status('SUBSCRIBED');await settle();await settle();
  assert.ok(fake.queries.every(q=>q.filters.some(([k,v])=>k==='workspace_id' && v===W)));
  const state=live.equipmentState(a11.id);
  assert.equal(state.status,'down');assert.equal(state.workOrder,'WO-9');assert.equal(state.oee,.8125);assert.equal(state.target,undefined);
  let [tag]=live.positions('1F');close(tag.x,15);close(tag.y,30);assert.equal(tag.label,'EMP-1');
  ch.emit('rtls_tags_current',{workspace_id:W,tag:'EMP-1',kind:'person',x:20,y:20,floor:'1F',frame:'rtls',source:'rtls',ts:new Date(Date.now()+1000).toISOString()});
  [tag]=live.positions('1F');close(tag.x,25);close(tag.y,20);
  ch.emit('equipment_status_current',{workspace_id:W,cad_id:a11.id,status:'run',source:'iot',ts:new Date(Date.now()+1000).toISOString()});
  assert.equal(live.equipmentState(a11.id).status,'run');
  // A new calibration reloads everything and re-projects stored raw positions.
  tables.rtls_calibrations=[{workspace_id:W,is_active:true,pairs:[{rtls:[0,0],cad:[0,0]},{rtls:[1,0],cad:[1,0]}]}];
  tables.rtls_tags_current[0]={...tables.rtls_tags_current[0],x:20,y:20,ts:new Date(Date.now()+1000).toISOString()};
  ch.emit('rtls_calibrations',{});await settle();await settle();
  [tag]=live.positions('1F');close(tag.x,20);close(tag.y,20);
  live.stop();
  assert.equal(ch.removed,true);assert.equal(live.mode(),'off');
});

test('supabase provider falls back to identity on a bad calibration and survives query errors',async()=>{
  const {live}=load(),fake=fakeSupabase({rtls_calibrations:[{workspace_id:'w',is_active:true,pairs:[{rtls:[0,0],cad:[0,0]},{rtls:[1,1],cad:[1,1]},{rtls:[2,2],cad:[2,2]}]}],
    rtls_tags_current:[{workspace_id:'w',tag:'T',kind:'cart',x:7,y:8,floor:'1F',frame:'rtls',source:'rtls',ts:new Date().toISOString()}]});
  live.use(live.providers.supabase(fake.client,{workspaceId:'w'}));fake.channels[0].status('SUBSCRIBED');await settle();await settle();
  const [tag]=live.positions('1F');assert.equal(tag.x,7);assert.equal(tag.y,8);assert.equal(tag.kind,'cart');
  const broken={...fake.client,from(){return {select(){return this;},eq(){return this;},limit(){return this;},then(resolve){return Promise.resolve({data:null,error:new Error('rls')}).then(resolve);}};}};
  live.use(live.providers.supabase(broken,{workspaceId:'w'}));fake.channels[1].status('SUBSCRIBED');await settle();await settle();
  assert.equal(live.mode(),'cloud');assert.equal(live.positions('1F').length,0);
});
