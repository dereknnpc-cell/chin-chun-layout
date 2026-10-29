const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=f=>fs.readFileSync(require.resolve('../'+f),'utf8');
const window={};for(const f of ['building-geometry.js','site-access.js'])vm.runInNewContext(read(f),{window});
const access=window.ChinChunAccess,building=window.ChinChunBuilding;
const fixture=()=>JSON.parse(read('factory_layout_data.json'));
const plain=v=>JSON.parse(JSON.stringify(v));
const freeze=v=>{if(v && typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
function intersects(f,x,y,z){
  const ps=f.points;
  return Math.min(...ps.map(p=>p[0]))<=x && Math.max(...ps.map(p=>p[0]))>=x && Math.min(...ps.map(p=>p[1]))<=y && Math.max(...ps.map(p=>p[1]))>=y && Math.min(...ps.map(p=>p[2]))<=z && Math.max(...ps.map(p=>p[2]))>=z;
}
test('photo accesses derive from confirmed live drawing without changing any saved CAD or existing CNC connector',()=>{
  const d=freeze(fixture()),before=JSON.stringify(d),result=access.get(d);
  assert.equal(result.ramp.code,'RAMP-ANNEX-ENTRY');assert.equal(result.stairs.code,'STAIR-DIECUT');assert.equal(JSON.stringify(d),before);
  assert.equal(building.connectingRamp(d).x,86,'separate previously confirmed CNC ramp remains independent');
  assert.ok(!d.equipment.some(e=>e.id===result.stairs.id || e.id===result.ramp.id));
  assert.deepEqual(plain(access.get({})),{ramp:null,stairs:null},'unknown/legacy layouts never get guessed overlays');
});
test('middle ramp ascends east from road 0 to annex 1 using aisle width and exact slab boundary',()=>{
  const d=fixture(),{ramp}=access.get(d),lane=d.aisles.find(a=>a.id==='aisle_1');
  assert.deepEqual(plain(ramp.lowPoint),[30,47.5,0]);assert.deepEqual(plain(ramp.highPoint),[35,47.5,1]);
  assert.equal(ramp.width,lane.height);assert.equal(ramp.ramp.highEdge,'first');
  assert.equal(building.floorLevel(d,ramp.lowPoint),0);assert.equal(building.floorLevel(d,ramp.highPoint),1);
  assert.match(ramp.accuracy,/illustrative/);
  d.building_geometry.annex.rise=1.2;assert.equal(access.get(d).ramp.highPoint[2],1.2);
});
test('Die Cut access has discrete stair treads up from 1 to 1.5, with a clear doorway and retained wall/window/header',()=>{
  const {stairs}=access.get(fixture()),faces=access.stairFaces(stairs),p=stairs.portal,cx=stairs.x+stairs.width/2;
  assert.deepEqual(plain(stairs.lowPoint),[52.5,41,1]);assert.deepEqual(plain(stairs.highPoint),[52.5,40,1.5]);
  const treadTops=faces.filter(f=>f.part==='access-stair-tread' && f.points.every(v=>v[2]===f.points[0][2]) && f.points[0][2]>stairs.low);
  assert.deepEqual([...new Set(treadTops.map(f=>f.points[0][2]))].sort(),[1.25,1.5]);
  assert.equal(faces.filter(f=>f.part==='ramp-surface').length,0);
  const walls=[...new Set(faces.filter(f=>!f.part.startsWith('access-stair')).map(f=>f.part))].map(part=>({part,points:faces.filter(f=>f.part===part).flatMap(f=>f.points)}));
  assert.ok(walls.some(f=>f.part==='access-wall-left'));assert.ok(walls.some(f=>f.part==='access-wall-sill'));assert.ok(walls.some(f=>f.part==='access-wall-header'));
  assert.ok(!walls.some(f=>intersects(f,cx,p.y,2.5)),'walk-through doorway is open');
  assert.ok(walls.some(f=>intersects(f,(p.left+p.openingLeft)/2,p.y,2.5)),'left wall remains');
  assert.ok(walls.some(f=>intersects(f,(p.openingRight+p.right)/2,p.y,2)),'right waist wall remains');
  assert.ok(!walls.some(f=>intersects(f,(p.openingRight+p.right)/2,p.y,2.8)),'window above waist wall remains open');
  assert.ok(faces.every(f=>f.points.every(v=>v.every(Number.isFinite))));
});
test('a new user wall blocking the passage or moved Die Cut disables the photo stair overlay instead of cutting their drawing',()=>{
  let d=fixture();d.walls.push({id:'user-block',x1:51,y1:40,x2:54,y2:40});let before=JSON.stringify(d);
  assert.equal(access.get(d).stairs,null);assert.equal(JSON.stringify(d),before);
  d=fixture();d.equipment.find(e=>e.code==='Die Cut').x=80;before=JSON.stringify(d);assert.equal(access.get(d).stairs,null);assert.equal(JSON.stringify(d),before);
  d=fixture();d.aisles.find(a=>a.id==='aisle_2').y=42;assert.equal(access.get(d).stairs,null);
});
test('2D direction references are non-interactive and use the same locations as 2.5D',()=>{
  const d=fixture(),before=JSON.stringify(d),html=access.svg(d,20,{x:100,y:200});
  assert.match(html,/pointer-events="none"/);assert.match(html,/stroke="#2563eb"/);assert.match(html,/x1="700" y1="1150" x2="800" y2="1150"/);
  assert.match(html,/x1="1150" y1="1020" x2="1150" y2="1000"/);assert.ok(!html.includes('NaN'));assert.equal(JSON.stringify(d),before);
  assert.match(building.svg(d,20,{x:100,y:200},true),/photo-access-reference/);
});
test('Twin registers the stairs as read-only site geometry and renders the rotated middle ramp with its real levels',()=>{
  const source=read('digital-twin.js'),end='})();',w={};for(const f of ['building-geometry.js','site-access.js','twin-models.js'])vm.runInNewContext(read(f),{window:w});
  const noop=()=>{},elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{setAttribute:noop,replaceChildren:noop,add:noop});return elements.get(id);};
  const probe=`window.__accessTest={prepare(d){data=d;dialog={querySelector:element};rebuild();},scene:()=>scene,faces(s){allFaces=true;return objectFaces(s);},top:rampTopPoints};`;
  vm.runInNewContext(source.trimEnd().slice(0,-end.length)+probe+end,{window:w,element,document:{documentElement:{lang:'zh-Hant'}},Option:function(){},requestAnimationFrame:noop});
  const d=freeze(fixture()),before=JSON.stringify(d),api=w.__accessTest;api.prepare(d);
  const ramp=api.scene().find(s=>s.item.code==='RAMP-ANNEX-ENTRY'),stairs=api.scene().find(s=>s.item.code==='STAIR-DIECUT');
  assert.equal(stairs.type,'site');assert.ok(api.faces(stairs).some(f=>f.part==='access-wall-header'));
  const top=api.top(ramp);assert.ok(top.filter(p=>p[2]===1).every(p=>Math.abs(p[0]-35)<1e-8));assert.ok(top.filter(p=>p[2]===0).every(p=>Math.abs(p[0]-30)<1e-8));
  assert.equal(JSON.stringify(d),before);assert.ok(!source.includes('scheduleSave'));
});
