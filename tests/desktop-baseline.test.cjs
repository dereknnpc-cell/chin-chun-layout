const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const source=read('app.js'),desktop=JSON.parse(read('factory_layout_data.json'));
const rawText=read('baselines/desktop-confirmed-20261022.json'),raw=JSON.parse(rawText);
const old=JSON.parse(read('baselines/legacy-default-55.json'));
const window={};vm.runInNewContext(read('desktop-baseline.js'),{window});
function storage(){const entries=new Map();return {entries,getItem:key=>entries.get(key)??null,setItem:(key,v)=>entries.set(key,v)};}

test('the byte-preserved desktop export stays intact and the two PDF-mapped cutting accessories append independently',()=>{
  assert.equal(desktop.equipment.length,110);assert.equal(desktop.walls.length,35);
  for(const key of ['walls','columns','aisles','flows','equipment_2f','mezzanine_2f','grid','layer_settings'])assert.deepEqual(desktop[key],raw[key],key);
  assert.deepEqual(desktop.equipment.slice(0,raw.equipment.length),raw.equipment,'all 108 confirmed equipment records remain unchanged and in order');
  assert.deepEqual(desktop.equipment.slice(raw.equipment.length).map(q=>[q.id,q.code,q.x,q.y,q.width,q.height]),[
    ['eq_cutting_office_desk','DESK-CUT',1.1,.55,2.4,1.9],
    ['eq_cutting_bench_grinder','GRINDER-CUT',7.95,.55,1.1,.9]
  ]);
  assert.equal(desktop.source_geometry_revision,'2026-layout-for-ai-eps-v1.2-r3-cutting-accessories');
  assert.equal(desktop.baseline_origin.sha256,crypto.createHash('sha256').update(rawText).digest('hex'));
  assert.equal(desktop.equipment.find(q=>q.code==='D1-1').width,12);
  assert.ok(!desktop.equipment.some(q=>q.code==='PL-3'));
  const ctx={};vm.runInNewContext(source.slice(source.indexOf('  const INITIAL_LAYOUT = '),source.indexOf('  const SOURCE_GEOMETRY_REVISION'))+'this.layout=INITIAL_LAYOUT;',ctx);
  assert.deepEqual(plain(ctx.layout),desktop,'live application embeds the same confirmed data');
  const building={};vm.runInNewContext(read('building-geometry.js'),{window:building});
  const ramp=building.ChinChunBuilding.connectingRamp(desktop),aisle=raw.aisles.find(q=>q.id==='aisle_3');
  assert.equal(ramp.x,aisle.x);assert.equal(ramp.width,aisle.width);assert.deepEqual(plain(ramp.ramp),{low:1,high:1.5,highEdge:'first'});
});

test('desktop replacement preserves a complete recoverable snapshot before returning a new independent layout',()=>{
  const current={...plain(old),equipment:[...plain(old.equipment),{id:'unsaved-custom',x:1.37,y:2.19}],notes:'Keep my work'};
  const before=JSON.stringify(current),store=storage(),result=window.ChinChunDesktop.prepare(current,desktop,store,'test');
  assert.equal(store.getItem(result.backupKey),before);assert.deepEqual(plain(result.layout),desktop);
  assert.equal(JSON.stringify(current),before);result.layout.equipment[0].x=-100;assert.notEqual(desktop.equipment[0].x,-100);
  assert.throws(()=>window.ChinChunDesktop.prepare(current,desktop,store,'test'),/exists/);
  assert.equal(store.getItem(result.backupKey),before,'a reused key cannot overwrite an older backup');
});

test('full/disabled/corrupted backup storage prevents replacement; malformed desktop files are rejected',()=>{
  const current=plain(old),before=JSON.stringify(current);
  for(const store of [{getItem:()=>null,setItem(){throw Error('quota');}},{getItem:()=>null,setItem(){}}])assert.throws(()=>window.ChinChunDesktop.prepare(current,desktop,store,'fail'));
  assert.throws(()=>window.ChinChunDesktop.prepare(current,{},storage()));assert.equal(JSON.stringify(current),before);
});

test('local, imported and cloud revisions append accessories only to r2 while preserving every prior drawing record',()=>{
  const section=source.slice(source.indexOf('  function applySourceGeometryRevision('),source.indexOf('  // --- State Variables ---'));
  const ctx={window:{},SOURCE_GEOMETRY_REVISION:desktop.source_geometry_revision};vm.createContext(ctx);vm.runInContext(section,ctx);
  for(const candidate of [
    {...plain(old),source_geometry_revision:'legacy-user-revision'},
    {...plain(raw),source_geometry_revision:'older-user-revision'}
  ]){
    candidate.equipment[0].x=8.713;candidate.walls.push({id:'user-wall',x1:1,y1:2,x2:4,y2:2});
    const before=JSON.stringify(candidate),result=ctx.applySourceGeometryRevision(candidate);
    assert.equal(result.layout,candidate);assert.equal(result.migrated,false);assert.equal(JSON.stringify(candidate),before);
  }
  const candidate={...plain(raw),baseline_revision:'future-desktop'};
  candidate.equipment[0].x=8.713;candidate.walls.push({id:'user-wall',x1:1,y1:2,x2:4,y2:2});
  const before=plain(candidate),result=ctx.applySourceGeometryRevision(candidate);
  assert.notEqual(result.layout,candidate);assert.equal(result.migrated,true);assert.equal(result.accessoriesAdded,true);
  assert.deepEqual(plain(result.layout.equipment.slice(0,before.equipment.length)),before.equipment);
  assert.deepEqual(plain(result.layout.walls),before.walls);
  for(const key of Object.keys(before).filter(k=>!['equipment','source_geometry_revision'].includes(k)))assert.deepEqual(plain(result.layout[key]),before[key],key);
  assert.deepEqual(plain(result.layout.equipment.slice(-2).map(q=>q.id)),['eq_cutting_office_desk','eq_cutting_bench_grinder']);
  assert.equal(result.layout.source_geometry_revision,desktop.source_geometry_revision);
  assert.ok(!section.includes('INITIAL_LAYOUT.equipment'));assert.ok(!section.includes('INITIAL_LAYOUT.walls'));
  const reload=source.slice(source.indexOf('    const forceReloadBtn ='),source.indexOf("    document.getElementById('loadDesktopBaselineBtn')"));
  assert.ok(!reload.includes('removeItem'),'refresh must preserve local drawing and custom library');
});

function ui(accepted=true,store=storage()){
  const calls=[],ctx={window,document:{documentElement:{lang:'zh-Hant'},createElement:()=>({click:()=>calls.push('download'),remove(){}}),body:{appendChild(){}}},
    layoutData:plain(old),INITIAL_LAYOUT:desktop,currentFloor:'2F',localStorage:store,applySourceGeometryRevision:layout=>({layout,migrated:false}),
    confirm:text=>{assert.match(text,/雲端/);return accepted;},Blob:class{},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){},
    pushHistoryState:()=>calls.push('undo'),ensureLayerSettings(){},updateLayerLockControls(){},deselectAll(){},renderFloorSelector(){},renderSvg(){},fitToScreen(){},updateViewBox(){},
    saveToLocalStorage:()=>calls.push('save'),showToast:(_text,type)=>calls.push(type)};
  vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function loadConfirmedDesktopBaseline('),source.indexOf('  function refreshBuildingReview(')),ctx);
  return {ctx,calls,store};
}
test('cancel and failed backup do not save or sync; explicit load downloads a backup, creates undo and then saves',()=>{
  let t=ui(false),before=JSON.stringify(t.ctx.layoutData);t.ctx.loadConfirmedDesktopBaseline();assert.equal(JSON.stringify(t.ctx.layoutData),before);assert.deepEqual(t.calls,[]);
  t=ui(true,{getItem:()=>null,setItem(){throw Error('quota');}});before=JSON.stringify(t.ctx.layoutData);t.ctx.loadConfirmedDesktopBaseline();assert.equal(JSON.stringify(t.ctx.layoutData),before);assert.deepEqual(t.calls,['error']);
  t=ui();before=JSON.stringify(t.ctx.layoutData);t.ctx.loadConfirmedDesktopBaseline();assert.deepEqual(plain(t.ctx.layoutData),desktop);
  assert.equal([...t.store.entries.values()][0],before);assert.deepEqual(t.calls,['download','undo','save','success']);assert.equal(t.ctx.currentFloor,'1F');
});

test('production ships desktop helper/data, and all existing model builders remain separate and unchanged',()=>{
  const html=read('index.html'),build=read('build.mjs');assert.ok(html.indexOf('desktop-baseline.js')<html.indexOf('<script src="app.js'));
  assert.match(build,/"desktop-baseline.js"/);assert.match(build,/"factory_layout_data.json"/);
  assert.match(html,/desktopBaselineStatus/);assert.match(html,/loadDesktopBaselineBtn/);
  assert.ok(!read('desktop-baseline.js').includes('scheduleSave'),'pure backup helper has no cloud side effects');
});
