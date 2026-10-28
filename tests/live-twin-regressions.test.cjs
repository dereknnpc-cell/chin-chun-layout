const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../live-twin.js'),'utf8');
const layout=JSON.parse(fs.readFileSync(require.resolve('../factory_layout_data.json'),'utf8'));
const machine=layout.equipment.find(e=>e.code==='A1-1');

function setup(extra={}){
  let now=1792900000000,nextId=0;
  const timers=new Map(),window={};
  class ClockDate extends Date{static now(){return now;}}
  const setTimeout=(fn,delay)=>{const id=++nextId;timers.set(id,{fn,at:now+delay});return id;};
  const context={window,console:{warn(){}},Date:ClockDate,queueMicrotask,AbortController,
    setTimeout,clearTimeout:id=>timers.delete(id),...extra};
  vm.runInNewContext(source,context);
  const live=window.ChinChunLive;live.attach({layout:()=>layout});
  return {live,timers,now:()=>now,advance(ms){const end=now+ms;let safety=0;while(true){const entry=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;assert.ok(++safety<1000,'timer must not loop');now=entry[1].at;timers.delete(entry[0]);entry[1].fn();}now=end;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const event=(ts,values={})=>({type:'equipment',id:machine.id,status:'run',ts,...values});

test('MES binding targets normalize case-insensitive equipment codes to actual CAD IDs, including 2F',()=>{
  const {live}=setup(),before=JSON.stringify(layout);
  live.bind({'MES-07':' a1-1 ','MES-ID':machine.id});
  assert.equal(live.ingest({type:'equipment',id:'MES-07',status:'run'}),1);
  assert.equal(live.equipmentState(machine.id)?.status,'run');
  assert.equal(live.equipmentState('a1-1'),null,'store only canonical IDs');
  live.ingest({type:'equipment',id:'MES-ID',status:'down'});assert.equal(live.equipmentState(machine.id).status,'down');
  const upstairs=layout.equipment_2f.find(e=>e.code);live.bind({'UP':upstairs.code});live.ingest({type:'equipment',id:'UP',status:'setup'});assert.equal(live.equipmentState(upstairs.id)?.status,'setup');
  assert.equal(JSON.stringify(layout),before);
});
test('expired statuses and RTLS tags notify the view without new data or camera interaction',async()=>{
  const s=setup();let painted=null,visibleTags=null,updates=0;
  s.live.subscribe(()=>{painted=s.live.equipmentState(machine.id)?.status;visibleTags=s.live.positions().length;updates++;});
  s.live.ingest([event(s.now()),{type:'position',tag:'P1',x:1,y:2,frame:'cad',ts:s.now()}]);await flush();
  assert.equal(painted,'run');assert.equal(visibleTags,1);
  s.advance(30000);await flush();assert.equal(painted,'run');
  s.advance(1);await flush();assert.equal(painted,'offline');assert.equal(visibleTags,0);assert.equal(updates,2);assert.equal(s.timers.size,0,'expired data must not poll forever');
});
test('fresh updates postpone their expiry; staggered records expire separately and stop cancels the timer',async()=>{
  const s=setup();let updates=0;s.live.subscribe(()=>updates++);
  s.live.ingest(event(s.now()));await flush();s.advance(20000);s.live.ingest(event(s.now()));await flush();
  const afterUpdate=updates;s.advance(10001);await flush();assert.equal(updates,afterUpdate);assert.equal(s.live.equipmentState(machine.id).status,'run');
  s.advance(20000);await flush();assert.equal(s.live.equipmentState(machine.id).status,'offline');assert.equal(updates,afterUpdate+1);
  s.live.ingest(event(s.now()));s.advance(1000);s.live.ingest({type:'position',tag:'P2',x:2,y:3,frame:'cad',ts:s.now()});await flush();
  s.advance(29001);await flush();assert.equal(s.live.equipmentState(machine.id).status,'offline');assert.equal(s.live.positions().length,1);
  s.advance(1000);await flush();assert.equal(s.live.positions().length,0);
  s.live.ingest(event(s.now()));s.live.stop();await flush();const stoppedUpdates=updates;assert.equal(s.timers.size,0);s.advance(60000);await flush();assert.equal(updates,stoppedUpdates);
});
test('out-of-order machine events are rejected across CAD ID/code/alias while same-time partial updates remain valid',()=>{
  const s=setup();s.live.bind({'MES-07':'A1-1'});s.live.ingest(event(s.now(),{status:'down',count:500,workOrder:'current'}));
  for(const id of [machine.id,'A1-1','MES-07'])assert.equal(s.live.ingest(event(s.now()-1,{id,status:'run',count:2,workOrder:'old'})),0);
  assert.equal(s.live.equipmentState(machine.id).status,'down');assert.equal(s.live.equipmentState(machine.id).count,500);
  assert.equal(s.live.ingest(event(s.now(),{id:'MES-07',status:'unknown',target:1000})),1);const state=s.live.equipmentState(machine.id);assert.equal(state.status,'down');assert.equal(state.count,500);assert.equal(state.target,1000);
});
test('source epochs reject late events after switch or stop, including failed provider startup',()=>{
  const s=setup();let oldPush,failedPush,stopped=0;
  s.live.use({name:'old',start({ingest}){oldPush=ingest;ingest(event(s.now(),{count:1}));},stop(){oldPush(event(s.now()+1,{count:2}));}});
  s.live.use({name:'new',start({ingest}){ingest(event(s.now(),{count:900,status:'down'}));},stop(){}});
  assert.equal(oldPush(event(s.now()+10,{count:3})),0);assert.equal(s.live.equipmentState(machine.id).count,900);
  s.live.stop();assert.equal(oldPush(event(s.now()+20)),0);assert.equal(s.live.equipmentState(machine.id),null);
  s.live.use({name:'broken',start({ingest}){failedPush=ingest;ingest(event(s.now()));throw Error('broken');},stop(){stopped++;}});
  assert.equal(s.live.mode(),'off');assert.equal(s.live.equipmentState(machine.id),null);assert.equal(failedPush(event(s.now()+30)),0);assert.equal(stopped,1);
});
test('stopping a pending REST request aborts it and a late response cannot overwrite the new source',async()=>{
  let release,signal;const pending=new Promise(resolve=>{release=resolve;});const s=setup({fetch:(_url,init)=>{signal=init.signal;return pending;}});
  s.live.use(s.live.providers.poll('/old-MES'));s.live.use({name:'simulation',start({ingest}){ingest(event(s.now(),{status:'down',count:900}));},stop(){}});
  assert.equal(signal.aborted,true);release({ok:true,json:async()=>[event(s.now()+1,{count:1,status:'run'})]});await flush();
  assert.equal(s.live.mode(),'simulation');assert.equal(s.live.equipmentState(machine.id).count,900);assert.equal(s.live.equipmentState(machine.id).status,'down');
});
test('stopping during REST JSON decoding, not just fetch, rejects that response and any future polls',async()=>{
  let release;const json=new Promise(resolve=>{release=resolve;});const s=setup({fetch:async()=>({ok:true,json:()=>json})});
  s.live.use(s.live.providers.poll('/slow-json'));await flush();s.live.stop();release([event(s.now())]);await flush();assert.equal(s.live.equipmentState(machine.id),null);assert.equal(s.timers.size,0);
});
test('old websocket callbacks after stop/reconnect cannot publish data or open an old connection',async()=>{
  const sockets=[];class Socket{constructor(){sockets.push(this);}close(){this.onclose?.();}}
  const s=setup({WebSocket:Socket});s.live.use(s.live.providers.websocket('wss://gateway.test/twin'));
  const first=sockets[0];first.onmessage({data:JSON.stringify(event(s.now(),{count:1}))});first.onclose();
  first.onmessage({data:JSON.stringify(event(s.now()+1,{count:2}))});assert.equal(s.live.equipmentState(machine.id).count,1);
  s.advance(1000);assert.equal(sockets.length,2);sockets[1].onmessage({data:JSON.stringify(event(s.now(),{count:3}))});
  s.live.stop();first.onclose();sockets[1].onmessage({data:JSON.stringify(event(s.now()+1,{count:4}))});s.advance(100000);await flush();assert.equal(sockets.length,2);assert.equal(s.live.equipmentState(machine.id),null);
});
test('the same REST provider can restart; old requests cannot publish or start a second polling loop',async()=>{
  const pending=[];const s=setup({fetch:(_url,init)=>new Promise(resolve=>pending.push({resolve,init}))});
  const provider=s.live.providers.poll('/reusable',{intervalMs:5000,init:{headers:{Accept:'application/json'},credentials:'omit'}});
  s.live.use(provider);s.live.stop();s.live.use(provider);assert.equal(pending.length,2);assert.equal(pending[0].init.signal.aborted,true);
  assert.equal(pending[1].init.headers.Accept,'application/json');assert.equal(pending[1].init.credentials,'omit');
  pending[1].resolve({ok:true,json:async()=>[event(s.now(),{count:900})]});await flush();
  pending[0].resolve({ok:true,json:async()=>[event(s.now()+100,{count:1})]});await flush();assert.equal(s.live.equipmentState(machine.id).count,900);
  assert.equal([...s.timers.values()].filter(t=>t.at===s.now()+5000).length,1);s.live.stop();assert.equal(s.timers.size,0);
});
test('reusing a WebSocket provider does not revive callbacks from its previous session',()=>{
  const sockets=[];class Socket{constructor(){sockets.push(this);}close(){this.onclose?.();}}
  const s=setup({WebSocket:Socket}),provider=s.live.providers.websocket('wss://gateway.test/twin');
  s.live.use(provider);s.live.stop();s.live.use(provider);assert.equal(sockets.length,2);
  sockets[0].onmessage({data:JSON.stringify(event(s.now()+10,{count:1}))});sockets[0].onclose();s.advance(5000);assert.equal(sockets.length,2);assert.equal(s.live.equipmentState(machine.id),null);
  sockets[1].onmessage({data:JSON.stringify(event(s.now(),{count:900}))});assert.equal(s.live.equipmentState(machine.id).count,900);s.live.stop();
});
test('a caller AbortSignal still cancels REST decoding and prevents another polling request',async()=>{
  let release,signal;const json=new Promise(resolve=>{release=resolve;}),external=new AbortController();
  const s=setup({fetch:async(_url,init)=>{signal=init.signal;return {ok:true,json:()=>json};}});
  s.live.use(s.live.providers.poll('/external-abort',{init:{signal:external.signal}}));await flush();external.abort();assert.equal(signal.aborted,true);
  release([event(s.now())]);await flush();assert.equal(s.live.equipmentState(machine.id),null);assert.equal(s.timers.size,0);s.live.stop();
});
