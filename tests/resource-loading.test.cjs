const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=file=>fs.readFileSync(require.resolve('../'+file),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){
 const nodes=[],events=new Set(),ids=new Map();let calls=[];
 const button={disabled:false,setAttribute(){},removeAttribute(){},addEventListener:(_,f)=>events.add(f),removeEventListener:(_,f)=>events.delete(f),after:n=>ids.set(n.id,n)};
 const document={documentElement:{lang:'zh-TW'},getElementById:id=>id==='openDigitalTwin'?button:ids.get(id),createElement:tag=>({tag,setAttribute(){},remove(){this.removed=true;ids.delete(this.id);}}),head:{append:n=>nodes.push(n)}};
 const window={};vm.runInNewContext(read('twin-loader.js'),{window,document,console:{warn(){}}});
 const click=()=>Promise.all([...events].map(f=>f()));
 function finish(node){if(node.src==='digital-twin.js')window.ChinChunTwin={update:(...args)=>calls.push(['update',...args]),connect:api=>{calls.push(['connect',api]);events.add(()=>calls.push(['open']));},open:()=>calls.push(['open'])};node.onload();}
 return {window,nodes,button,ids,calls,click,finish};
}
test('2D loads no optional assets; concurrent clicks load once and use the latest layout',async()=>{
 const t=setup(),api={edit(){}};t.window.ChinChunTwin.connect(api);t.window.ChinChunTwin.update({version:1},'1F');assert.equal(t.nodes.length,0);
 const first=t.click(),second=t.click();assert.equal(t.nodes.length,3);assert.equal(t.button.disabled,true);
 t.window.ChinChunTwin.update({version:2},'2F');t.nodes.slice().forEach(t.finish);await tick();
 assert.equal(t.nodes.at(-1).src,'digital-twin.js');t.finish(t.nodes.at(-1));await Promise.all([first,second]);
 assert.deepEqual(t.calls,[['update',{version:2},'2F'],['connect',api],['open']]);assert.equal(t.button.disabled,false);
 await t.click();assert.equal(t.nodes.length,4);assert.equal(t.calls.filter(c=>c[0]==='open').length,2);
});
test('failed optional download leaves 2D usable and retries only failed assets',async()=>{
 const t=setup();t.window.ChinChunTwin.connect({});t.window.ChinChunTwin.update({},'1F');
 const first=t.click();t.finish(t.nodes[0]);t.nodes[1].onerror();t.finish(t.nodes[2]);await first;
 assert.equal(t.button.disabled,false);assert.ok(t.ids.has('twinLoadError'));
 const retry=t.click();assert.equal(t.nodes.length,4);assert.equal(t.nodes[3].src,'three-twin.js');t.finish(t.nodes[3]);await tick();t.finish(t.nodes[4]);await retry;
 assert.equal(t.ids.has('twinLoadError'),false);assert.equal(t.calls.filter(c=>c[0]==='open').length,1);
});
test('cloud timeout still aborts requests with caller signals and cleans listeners',async()=>{
 const source=read('cloud-sync-source.js'),start=source.indexOf('async function fetchWithTimeout('),end=source.indexOf('\nconst supabase',start);
 let timeout,cleared=0,observed;
 const context={AbortController,Request,setTimeout:fn=>(timeout=fn,1),clearTimeout:()=>cleared++,fetch:(_,init)=>{observed=init.signal;return new Promise((resolve,reject)=>{if(observed.aborted)reject(observed.reason);else observed.addEventListener('abort',()=>reject(observed.reason),{once:true});});}};
 vm.runInNewContext(source.slice(start,end),context);
 const caller=new AbortController();const pending=context.fetchWithTimeout('/test',{signal:caller.signal});timeout();await assert.rejects(pending);assert.equal(observed.aborted,true);assert.equal(caller.signal.aborted,false);assert.equal(cleared,1);
 const next=context.fetchWithTimeout('/test',{signal:caller.signal});caller.abort(new Error('caller canceled'));await assert.rejects(next,/caller canceled/);assert.equal(cleared,2);
 const canceled=new AbortController();canceled.abort(new Error('already canceled'));await assert.rejects(context.fetchWithTimeout('/test',{signal:canceled.signal}),/already canceled/);
});
test('production entry point defers the optional viewer but retains models needed by 2D',()=>{
 const html=read('index.html');assert.doesNotMatch(html,/<script[^>]+src="(?:three-twin|digital-twin|live-twin)\.js/);
 assert.match(html,/<script src="twin-loader\.js/);assert.match(html,/<script src="twin-models\.js/);
});
