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
test('requested RAMP-5M extension aligns its low edge to the office wall, archives the old record and leaves every other CAD record intact',()=>{
  const d=freeze(fixture()),before=JSON.stringify(d),result=access.alignLoadingRamp(d),next=result.layout;
  assert.equal(result.migrated,true);assert.equal(JSON.stringify(d),before);
  const ramp=next.equipment.find(e=>e.code==='RAMP-5M');
  assert.deepEqual([ramp.x,ramp.y,ramp.width,ramp.height,ramp.rotation],[15,35,5,5,0]);
  const reference=access.references(next).find(e=>e.code==='RAMP-5M');
  assert.deepEqual(plain(reference.highPoint),[17.5,35,1.5]);assert.deepEqual(plain(reference.lowPoint),[17.5,40,0]);
  assert.equal(reference.lowPoint[1],next.walls.find(w=>w.id==='wall_1789539311074').y1);
  for(const key of Object.keys(d).filter(k=>k!=='equipment'))assert.deepEqual(plain(next[key]),plain(d[key]),key);
  assert.deepEqual(plain(next.equipment.filter(e=>e.id!==ramp.id)),plain(d.equipment.filter(e=>e.id!==ramp.id)));
  assert.deepEqual(plain(Object.values(next.access_geometry_adjustments)[0].previous),plain(d.equipment.find(e=>e.id===ramp.id)));
  ramp.height=6.25;const later=access.alignLoadingRamp(next);assert.equal(later.layout,next);assert.equal(later.migrated,false);assert.equal(ramp.height,6.25);
});
test('loading ramp correction skips moved, resized, rotated, absent and unverified drawings',()=>{
  for(const patch of [{x:16},{y:36},{width:6},{height:3},{rotation:90},{code:'CUSTOM-RAMP'}]){
    const d=fixture();Object.assign(d.equipment.find(e=>e.code==='RAMP-5M'),patch);const before=JSON.stringify(d);
    const result=access.alignLoadingRamp(d);assert.equal(result.migrated,false);assert.equal(result.layout,d);assert.equal(JSON.stringify(d),before);
  }
  for(const mutate of [d=>{delete d.building_geometry;},d=>{d.walls=[];},d=>{d.equipment=d.equipment.filter(e=>e.code!=='Office');}]){
    const d=fixture();mutate(d);assert.equal(access.alignLoadingRamp(d).migrated,false);
  }
});
test('the application revision bridge applies the same extended CAD record to local, imported and cloud drawings',()=>{
  const app=read('app.js'),ctx={window,SOURCE_GEOMETRY_REVISION:fixture().source_geometry_revision};
  vm.runInNewContext(app.slice(app.indexOf('  function applySourceGeometryRevision('),app.indexOf('  // --- State Variables ---'))+'this.apply=applySourceGeometryRevision;',ctx);
  const result=ctx.apply(fixture());assert.equal(result.migrated,true);assert.equal(result.layout.equipment.find(e=>e.code==='RAMP-5M').height,5);
  assert.equal(access.routeHoles(result.layout).filter(h=>h.some(p=>p[0]<16 && p[0]>14)).length,1);
  const svg=access.svg(result.layout,1,{x:0,y:0});assert.match(svg,/x1="17.5" y1="40" x2="17.5" y2="35"/);
});
test('a cloud document missing connector metadata still registers one ramp in 2D, circulation clearance and both 2.5D engines',()=>{
  const source=read('digital-twin.js'),end='})();',w={};for(const f of ['building-geometry.js','site-access.js','twin-models.js'])vm.runInNewContext(read(f),{window:w});
  const noop=()=>{},element=()=>({setAttribute:noop,replaceChildren:noop,add:noop});
  const probe=`window.__cloudRampTest={prepare(d){data=d;dialog={querySelector:element};rebuild();},scene:()=>scene,faces(s){allFaces=true;return objectFaces(s);},routes:()=>circulationFaces(scene)};`;
  vm.runInNewContext(source.trimEnd().slice(0,-end.length)+probe+end,{window:w,element,document:{documentElement:{lang:'zh-Hant'}},Option:function(){},requestAnimationFrame:noop});
  const d=fixture();delete d.building_geometry.connectingRamp;delete d.baseline_revision;const before=JSON.stringify(d);freeze(d);
  const api=w.__cloudRampTest;api.prepare(d);
  const ramps=api.scene().filter(s=>s.item.code==='RAMP-CONNECTOR');assert.equal(ramps.length,1);assert.equal(ramps[0].type,'site');
  const surface=api.faces(ramps[0]).find(f=>f.part==='ramp-surface');assert.deepEqual(plain(surface.points),[[86,40,1.5],[89,40,1.5],[89,45,1],[86,45,1]]);
  assert.match(access.svg(d,1,{x:0,y:0}),/data-access-code="RAMP-CONNECTOR"/);
  const contains=(poly,p)=>poly.every((a,i)=>{const b=poly[(i+1)%poly.length];return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])>=-1e-8;});
  assert.ok(access.routeHoles(d).some(h=>contains(h,[87.5,42])));
  assert.ok(!api.routes().some(f=>contains(f.points,[87.5,42])));
  assert.equal(JSON.stringify(d),before);assert.equal(api.scene().filter(s=>s.type==='equipment').length,d.equipment.length);
});
test('photo accesses derive from confirmed live drawing without changing any saved CAD or existing CNC connector',()=>{
  const d=freeze(fixture()),before=JSON.stringify(d),result=access.get(d);
  assert.equal(result.ramp.code,'RAMP-ANNEX-ENTRY');assert.equal(result.stairs.code,'STAIR-DIECUT');assert.equal(JSON.stringify(d),before);
  assert.equal(building.connectingRamp(d).x,86,'separate previously confirmed CNC ramp remains independent');
  assert.ok(!d.equipment.some(e=>e.id===result.stairs.id || e.id===result.ramp.id));
  assert.deepEqual(plain(access.get({})),{ramp:null,stairs:null},'unknown/legacy layouts never get guessed overlays');
});
test('middle ramp ascends east from road 0 to annex 1 and extends south past PL-1 to the canopy edge',()=>{
  const d=fixture(),{ramp}=access.get(d),lane=d.aisles.find(a=>a.id==='aisle_1');
  assert.deepEqual(plain(ramp.lowPoint),[30,52.25,0]);assert.deepEqual(plain(ramp.highPoint),[35,52.25,1]);
  const ys=access.footprint(ramp).map(p=>p[1]);assert.equal(Math.min(...ys),lane.y);assert.equal(Math.max(...ys),d.building_geometry.annex.y+d.building_geometry.annex.height);
  const pl=d.equipment.find(e=>e.code==='PL-1');assert.ok(Math.max(...ys)>pl.y+pl.height);assert.equal(ramp.ramp.highEdge,'first');
  assert.equal(building.floorLevel(d,ramp.lowPoint),0);assert.equal(building.floorLevel(d,ramp.highPoint),1);
  assert.match(ramp.accuracy,/illustrative/);
  d.building_geometry.annex.rise=1.2;assert.equal(access.get(d).ramp.highPoint[2],1.2);
});
test('Die Cut access has discrete stair treads up from 1 to 1.5, with a clear doorway and retained wall/window/header',()=>{
  const {stairs}=access.get(fixture()),faces=access.stairFaces(stairs),p=stairs.portal,cx=stairs.x+stairs.width/2;
  assert.deepEqual(plain(stairs.lowPoint),[52.5,41,1]);assert.deepEqual(plain(stairs.highPoint),[52.5,40,1.5]);
  const treadTops=faces.filter(f=>f.part==='access-stair-tread' && f.points.every(v=>v[2]===f.points[0][2]) && f.points[0][2]>stairs.low);
  const tops=[...new Set(treadTops.map(f=>f.points[0][2]))].sort();assert.equal(stairs.steps,3);assert.equal(tops.length,3);
  tops.forEach((z,i)=>assert.ok(Math.abs(z-(1+(i+1)/6))<1e-8));
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
  assert.match(html,/pointer-events="none"/);assert.match(html,/stroke="#2563eb"/);assert.match(html,/x1="700" y1="1245" x2="800" y2="1245"/);
  assert.match(html,/x1="1150" y1="1020" x2="1150" y2="1000"/);assert.ok(!html.includes('NaN'));assert.equal(JSON.stringify(d),before);
  assert.match(building.svg(d,20,{x:100,y:200},true),/photo-access-reference/);
  for(const code of ['RAMP-5M','RAMP-ANNEX-ENTRY','STAIR-DIECUT','RAMP-CONNECTOR'])assert.ok(html.includes(`data-access-code="${code}"`),code);
  assert.match(html,/STAIR-DIECUT · 1.00 → 1.50 m · 3階/);
  assert.match(html,/RAMP-CONNECTOR · 1.00 → 1.50 m/);
});
test('slab skins leave RAMP-5M exposed at every camera angle without lifting or moving its CAD geometry',()=>{
  const source=read('digital-twin.js'),end='})();',w={};for(const f of ['building-geometry.js','site-access.js','twin-models.js'])vm.runInNewContext(read(f),{window:w});
  const noop=()=>{},element=()=>({setAttribute:noop,replaceChildren:noop,add:noop});
  const probe=`window.__groundTest={prepare(d){data=d;dialog={querySelector:element};rebuild();},scene:()=>scene,ground:()=>threeGroundFaces(scene,bounds),top:rampTopPoints};`;
  vm.runInNewContext(source.trimEnd().slice(0,-end.length)+probe+end,{window:w,element,document:{documentElement:{lang:'zh-Hant'}},Option:function(){},requestAnimationFrame:noop});
  const d=freeze(fixture()),before=JSON.stringify(d),api=w.__groundTest;api.prepare(d);
  const ramp=api.scene().find(s=>s.item.code==='RAMP-5M'),top=api.top(ramp);
  assert.deepEqual(plain(top),[[15,35,1.5],[20,35,1.5],[20,37.5,0],[15,37.5,0]]);
  const covers=(poly,p)=>{
    const cs=poly.map((a,i)=>{const b=poly[(i+1)%poly.length];return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);});
    return cs.every(c=>c>=-1e-8)||cs.every(c=>c<=1e-8);
  };
  const skin=api.ground().filter(f=>f.part==='ground' && f.points.length>=3 && f.points.every(p=>p[2]===f.points[0][2]) && f.points[0][2]>1);
  for(const p of [[16,35.5],[17.5,36.25],[19,37],[17.5,39.5]])assert.ok(!skin.some(f=>covers(f.points,p)),`slab must not bury ramp or road approach at ${p}`);
  const front=api.ground().filter(f=>f.part==='ground' && f.points.every(p=>p[1]===40) && f.points.some(p=>p[2]>0));
  assert.ok(!front.some(f=>Math.min(...f.points.map(p=>p[0]))<17.5 && Math.max(...f.points.map(p=>p[0]))>17.5),'outer slab edge cannot block the road-level entrance');
  assert.ok(skin.some(f=>covers(f.points,[21,36])),'adjacent factory floor remains');
  assert.equal(JSON.stringify(d),before);
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
