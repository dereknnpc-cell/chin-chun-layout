const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const css=fs.readFileSync(require.resolve('../style.css'),'utf8');

function setup() {
  let locked=false;
  const calls={saved:0,rendered:0,history:0,selected:[],toasts:[]};
  const toggle={checked:false,closest:()=>({classList:{add(){}}})};
  const c={layoutData:{walls:[{id:'w1',x1:1,y1:2,x2:6,y2:2,thickness:.3},{id:'w2',floor:'2F',x1:1,y1:2,x2:1,y2:8,thickness:.3}]},layerState:{walls:true},
    currentFloor:'1F',selectedId:'w1',isLayerLocked:()=>locked,
    escapeEquipmentText:v=>String(v).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])),
    metersToSvg:(x,y)=>({x:x*24,y:y*24}),viewBox:{x:0,y:0,width:2400,height:960},
    svgToMeters:(x,y)=>({x:x/24,y:y/24}),snapValue:v=>v,currentSnapM:.5,
    document:{getElementById:()=>toggle},Date:{now:()=>12345},
    pushHistoryState:()=>calls.history++,saveToLocalStorage:()=>calls.saved++,selectItem:id=>calls.selected.push(id),renderSvg:()=>calls.rendered++,showToast:msg=>calls.toasts.push(msg)};
  vm.createContext(c);
  vm.runInContext(source.slice(source.indexOf('  function getWallPolygon('),source.indexOf('  // Helper: calculate polyline path string')),c);
  vm.runInContext(source.slice(source.indexOf('  function isWallOnActiveFloor('),source.indexOf('  function refreshAnnotationVisibility()')),c);
  vm.runInContext(source.slice(source.indexOf('  function addNewWall()'),source.indexOf('  // --- Zoom & Pan Helper Functions')),c);
  return {c,calls,toggle,lock:v=>{locked=v;}};
}

test('top-level wall picking uses actual wall geometry and only the active floor',()=>{
  const {c}=setup(),before=JSON.stringify(c.layoutData);
  let svg=c.renderWallHitTargets();assert.match(svg,/data-id="w1"/);assert.ok(!svg.includes('data-id="w2"'));
  assert.match(svg,/wall-hit-body/);assert.match(svg,/wall-hit-line/);assert.match(svg,/x1="24" y1="48" x2="144" y2="48"/);
  c.currentFloor='2F';svg=c.renderWallHitTargets();assert.match(svg,/data-id="w2"/);assert.ok(!svg.includes('data-id="w1"'));
  c.currentFloor='OVERLAY';svg=c.renderWallHitTargets();assert.match(svg,/data-id="w1"/);assert.match(svg,/data-id="w2"/);
  assert.equal(JSON.stringify(c.layoutData),before);
});

test('hidden or locked walls never add invisible blocking hit surfaces',()=>{
  const {c,lock}=setup();c.layerState.walls=false;assert.equal(c.renderWallHitTargets(),'');
  c.layerState.walls=true;lock(true);assert.equal(c.renderWallHitTargets(),'');
  lock(false);assert.match(c.renderWallHitTargets(),/wall-hit-line/);
});

test('selected wall wins wall junctions without reordering saved walls or duplicating DOM IDs',()=>{
  const {c}=setup();c.layoutData.walls.push({id:'w3',x1:1,y1:2,x2:1,y2:7});
  const before=JSON.stringify(c.layoutData),svg=c.renderWallHitTargets();
  assert.ok(svg.indexOf('data-id="w1"')>svg.indexOf('data-id="w3"'));
  assert.ok(!/\sid="w1"/.test(svg));assert.equal(JSON.stringify(c.layoutData),before);
  c.layoutData.walls.push({id:'zero',x1:0,y1:0,x2:0,y2:0});assert.ok(!c.renderWallHitTargets().includes('data-id="zero"'));
});

test('picking stays 12 screen pixels wide; L4 handles remain above it and L1 paint stays below machines',()=>{
  assert.match(css,/\.wall-hit-line\s*\{[^}]*stroke-width:\s*12px;[^}]*vector-effect:\s*non-scaling-stroke;[^}]*pointer-events:\s*stroke;/);
  const wall=source.indexOf('id="layerWalls"'),equipment=source.indexOf('id="layerEquipment"'),picking=source.indexOf('html += renderWallHitTargets();'),controls=source.indexOf('id="layerControls"');
  assert.ok(wall<equipment && equipment<picking && picking<controls);
  assert.match(source,/const ghostWall = !isWallOnActiveFloor\(w\)/);
});

test('new wall is editable immediately, reveals hidden walls and belongs to the current floor',()=>{
  for(const [floor,expected] of [['1F','1F'],['2F','2F'],['3F','3F'],['OVERLAY','1F']]){
    const {c,calls,toggle}=setup();c.currentFloor=floor;c.layerState.walls=false;c.addNewWall();
    const wall=c.layoutData.walls.at(-1);assert.equal(wall.floor,expected);assert.equal(wall.x2-wall.x1,5);
    assert.equal(calls.history,1);assert.equal(calls.saved,1);assert.equal(calls.rendered,1);assert.equal(calls.selected[0],wall.id);
    assert.equal(c.layerState.walls,true);assert.equal(toggle.checked,true);assert.match(c.renderWallHitTargets(),/data-id="wall_12345"/);
  }
});

test('locked wall layer blocks creation without silently unlocking or modifying layout',()=>{
  const {c,calls,lock}=setup(),before=JSON.stringify(c.layoutData);lock(true);c.addNewWall();
  assert.equal(JSON.stringify(c.layoutData),before);assert.equal(calls.history,0);assert.equal(calls.saved,0);assert.equal(calls.selected.length,0);assert.match(calls.toasts[0],/已鎖定/);
});
