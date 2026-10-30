const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../building-geometry.js'),'utf8');
const window={};vm.runInNewContext(source,{window});const building=window.ChinChunBuilding;
const plain=v=>JSON.parse(JSON.stringify(v));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);
test('older cloud drawings recover the E1-1 right-hand ramp from their own corridor without writes or duplicates',()=>{
  const d=JSON.parse(fs.readFileSync(require.resolve('../factory_layout_data.json'),'utf8'));delete d.building_geometry.connectingRamp;delete d.baseline_revision;
  const before=JSON.stringify(d),r=building.connectingRamp(d),lane=d.aisles.find(a=>a.id==='aisle_3');
  assert.deepEqual([r.x,r.y,r.width,r.height],[lane.x,40,lane.width,5]);assert.deepEqual(plain(r.ramp),{low:1,high:1.5,highEdge:'first'});
  assert.match(r.name,/E1-1/);assert.equal(JSON.stringify(d),before);
  d.building_geometry.connectingRamp={x:86.25,y:40,width:2.5,height:4,source:'user edit'};
  const explicit=building.connectingRamp(d);assert.equal(explicit.x,86.25);assert.equal(explicit.height,4);assert.equal(explicit.source,'user edit');
  d.building_geometry.connectingRamp=null;assert.equal(building.connectingRamp(d),null,'an explicit removal is not recreated');
  d.building_geometry.connectingRamp={x:'bad'};assert.equal(building.connectingRamp(d),null,'invalid explicit geometry does not invoke a default');
});
test('corridor recovery respects unknown drawings, floor, orientation, machine location and walls closing the passage',()=>{
  const base=()=>{const d=JSON.parse(fs.readFileSync(require.resolve('../factory_layout_data.json'),'utf8'));delete d.building_geometry.connectingRamp;return d;};
  for(const edit of [d=>{delete d.building_geometry;},d=>{d.aisles=[];},d=>{d.aisles.find(a=>a.id==='aisle_3').y=48;},d=>{d.aisles.find(a=>a.id==='aisle_3').floor='2F';},d=>{d.aisles.find(a=>a.id==='aisle_3').rotation=90;},d=>{d.equipment.find(e=>e.code==='E1-1').x=60;},d=>{d.walls.push({id:'user-closed',x1:86,y1:40,x2:89,y2:40});}]){
    const d=base();edit(d);const before=JSON.stringify(d);assert.equal(building.connectingRamp(d),null);assert.equal(JSON.stringify(d),before);
  }
  const d=base();d.aisles.find(a=>a.id==='aisle_3').x=86.5;assert.equal(building.connectingRamp(d).x,86.5,'position follows the live confirmed corridor');
});
const fixture=()=>({source_geometry_revision:'existing-eps',grid:{factory_width:100,factory_depth:40,cols_x:21},
  equipment:[{id:'machine',code:'M1',x:55,y:41,width:3,height:4,rotation:33},{id:'office',code:'OFFICE',category:'Office',x:45,y:30,width:5,height:9}],
  columns:[{id:'user-column',x:100,y:40}],equipment_2f:[{id:'upstairs',x:1,y:1}],flows:[{id:'route',points:[{x:1,y:2},{x:3,y:4}]}],
  walls:[{id:'old',x1:0,y1:40,x2:100,y2:40,thickness:.32,name:'User custom wall'},
    {id:'interior',x1:45,y1:30,x2:45,y2:39.6,color:'#123456'},
    {id:'CNC',x1:81.5,y1:56.5,x2:100.7,y2:56.5},{id:'2F',floor:'2F',x1:0,y1:0,x2:5,y2:0}],
  floors:[{id:'1F',name:'first'}],title_block:{status:'APPROVED'},layer_settings:{locks:{walls:true}},custom:'retained'});
function legacy(input=fixture()){
  const d=plain(input),original=d.walls.slice(0,2);
  d.walls=[...d.walls.slice(2),{id:'a3_wall_1',source:'A3 L-02',x1:0,y1:0,x2:97.8,y2:0},
    {id:'a3_wall_2',source:'A3 L-02',x1:55,y1:5,x2:55,y2:20}];
  d.building_geometry={revision:'a3-180-20261022',previousMainWalls:original,main:{width:97.8},annex:{x:32.82,width:64.69},extension:{x:87.51}};
  d.grid.factory_width=97.8;return d;
}
test('16:38 red line aligns annex X35..100 while right-end section stays X90..100',()=>{
  const b=building.reference();near(b.main.width,100);near(b.main.height,40);
  near(b.annex.x,35);near(b.annex.width,65);near(b.annex.x+b.annex.width,100);
  near(b.extension.x,90);near(b.extension.width,10);near(b.extension.x+b.extension.width,100);
  near(b.roof.x,35);near(b.roof.width,65);assert.equal(b.partitionAccuracy,'user-drawing');
  assert.ok(!('sourceRotation' in b));assert.match(b.source,/使用者/);assert.ok(!('partitions' in building));
});
test('unaffected user drawings retain every wall, equipment field, column, route and upper-floor record',()=>{
  const original=fixture(),before=JSON.stringify(original),result=building.apply(original);
  assert.equal(JSON.stringify(original),before);
  for(const key of ['walls','equipment','columns','equipment_2f','flows','layer_settings','custom','source_geometry_revision'])assert.deepEqual(plain(result[key]),original[key],key);
  assert.equal(result.grid.cols_x,21);assert.ok(!result.title_block.spec.includes('97.80'));
  result.walls[0].x1=84;result.equipment[0].x=56;const edited=JSON.stringify(result);
  assert.equal(JSON.stringify(building.apply(result)),edited,'reapply never erases later edits');
  assert.equal(building.repair(result).changed,false);
});
test('rejected A3 is repaired from its own original-wall archive, never from default geometry',()=>{
  const d=legacy(),before=JSON.stringify(d),result=building.repair(d);
  assert.equal(result.changed,true);assert.equal(result.blocked,false);assert.equal(JSON.stringify(d),before);
  const r=result.layout;assert.equal(r.grid.factory_width,100);
  for(const w of fixture().walls)assert.deepEqual(plain(r.walls.find(q=>q.id===w.id)),w);
  assert.ok(!r.walls.some(w=>/^a3_wall_/.test(w.id)));
  assert.equal(r.building_geometry.restoration.restoredWalls,2);
  assert.equal(r.building_geometry.restoration.retainedWalls,2);
  assert.equal(r.building_geometry.rejectedInterpretation.walls.length,2);
  assert.deepEqual(plain(r.building_geometry.previousMainWalls),fixture().walls.slice(0,2));
  for(const key of ['equipment','columns','equipment_2f','flows','layer_settings','custom','source_geometry_revision'])assert.deepEqual(plain(r[key]),d[key]);
});
test('post-A3 new walls and existing same-ID user edits survive, including their exact fields',()=>{
  const d=legacy(),newWall={id:'new',x1:2,y1:3,x2:4,y2:3},edited={...fixture().walls[0],x1:1.37};
  d.walls.push(newWall,edited,{id:'user-copy',source:'A3 L-02',x1:4,y1:5,x2:8,y2:5});
  const r=building.apply(d);
  assert.deepEqual(plain(r.walls.find(w=>w.id==='new')),newWall);
  assert.deepEqual(plain(r.walls.find(w=>w.id==='old')),edited);
  assert.equal(r.walls.filter(w=>w.id==='old').length,1);assert.ok(r.walls.some(w=>w.id==='user-copy'));
  assert.deepEqual(plain(r.building_geometry.restoration.keptCurrentIds),['old']);
  const later=plain(r);later.walls[0].x1=9.2;later.building_geometry.annex.x=31;
  assert.deepEqual(plain(building.repair(later).layout),later,'no repeated correction overwrites');
});
test('r1 upgrade moves only left annex/roof edge; original walls and all other geometry remain byte-identical',()=>{
  const d=building.apply(fixture());d.building_geometry.revision='user-boundary-20261022-r1';
  d.building_geometry.annex.x=30;d.building_geometry.annex.width=70;
  d.building_geometry.roof.x=30;d.building_geometry.roof.width=70;
  d.building_geometry.restoration={restoredWalls:30,retainedWalls:5};
  const before=JSON.stringify(d),r=building.repair(d);
  assert.equal(r.changed,true);assert.equal(r.leftBoundaryOnly,true);assert.equal(JSON.stringify(d),before);
  for(const key of ['walls','equipment','columns','flows','equipment_2f','grid','floors','layer_settings'])assert.equal(JSON.stringify(r.layout[key]),JSON.stringify(d[key]),key);
  for(const key of ['main','extension','restoration'])assert.equal(JSON.stringify(r.layout.building_geometry[key]),JSON.stringify(d.building_geometry[key]),key);
  const b=r.layout.building_geometry;assert.equal(b.annex.x,35);assert.equal(b.annex.width,65);assert.equal(b.roof.x,35);assert.equal(b.roof.width,65);
  assert.equal(b.annex.y,d.building_geometry.annex.y);assert.equal(b.annex.height,d.building_geometry.annex.height);
  assert.equal(b.boundaryCorrections.length,1);assert.equal(building.repair(r.layout).changed,false);
  const custom=plain(d);custom.building_geometry.annex.width=72;custom.building_geometry.roof.width=73;
  const updated=building.apply(custom).building_geometry;near(updated.annex.x+updated.annex.width,102);near(updated.roof.x+updated.roof.width,103);
  const broken=plain(d);delete broken.building_geometry.roof;
  const blocked=building.repair(broken);assert.equal(blocked.blocked,true);assert.equal(blocked.layout,broken);assert.ok(building.recoveryProblem(broken));
});
test('missing, malformed or duplicate archive blocks ALL repair and never substitutes baseline walls',()=>{
  for(const archive of [undefined,null,{},[{id:'bad',x1:NaN,y1:0,x2:1,y2:0}],
    [fixture().walls[0],fixture().walls[0]]]){
    const d=legacy();d.building_geometry.previousMainWalls=archive;
    const before=JSON.stringify(d),result=building.repair(d);
    assert.equal(result.changed,false);assert.equal(result.blocked,true);assert.equal(result.layout,d);
    assert.equal(JSON.stringify(d),before);assert.throws(()=>building.apply(d));assert.ok(result.reason);
  }
  const d=legacy();d.building_geometry.previousMainWalls=[];assert.equal(building.repair(d).changed,true,'empty original document is valid');
});
test('local/cloud/import common loader repairs original walls before any EPS baseline migration',()=>{
  const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const section=app.slice(app.indexOf('  function applySourceGeometryRevision('),app.indexOf('  // --- State Variables ---'));
  const c={window:{ChinChunBuilding:building},SOURCE_GEOMETRY_REVISION:'new-eps',INITIAL_LAYOUT:{equipment:[],walls:[{id:'NOT_USER'}]}};
  vm.createContext(c);vm.runInContext(section,c);
  const repaired=c.applySourceGeometryRevision(legacy());assert.equal(repaired.buildingRepaired,true);
  assert.deepEqual(plain(repaired.layout.equipment),fixture().equipment);
  assert.ok(repaired.layout.walls.some(w=>w.id==='interior'));assert.ok(!repaired.layout.walls.some(w=>w.id==='NOT_USER'));
  const current=building.apply(fixture());assert.equal(c.applySourceGeometryRevision(current).layout,current);
  const broken=legacy();delete broken.building_geometry.previousMainWalls;
  const blocked=c.applySourceGeometryRevision(broken);assert.equal(blocked.buildingBlocked,true);assert.equal(blocked.layout,broken);
  assert.ok((app.match(/applySourceGeometryRevision\(/g) || []).length>=4,'shared by local, cloud, JSON import');
});
test('main/annex/road elevations follow the corrected live boundaries',()=>{
  const d=building.apply(fixture());assert.equal(building.floorLevel(d,[99,39]),1.5);
  assert.equal(building.floorLevel(d,[35.5,41]),1);assert.equal(building.floorLevel(d,[99.5,58]),1);
  assert.equal(building.floorLevel(d,[34,45]),0);assert.equal(building.floorLevel(d,[101,58]),0);
  assert.equal(building.floorLevel({},[55,41]),null);assert.equal(building.get(legacy()),null);
  d.building_geometry.annex.rise=NaN;assert.equal(building.get(d),null);
});
test('2D overlay shows user drawing and red-line bounds without false A3 conflict circles',()=>{
  const d=building.apply(fixture()),svg=building.svg(d,24,{x:100,y:200},true);
  assert.match(svg,/pointer-events="none"/);assert.match(svg,/原繪圖/);assert.match(svg,/紅線邊界/);assert.match(svg,/X=35–100/);
  assert.ok(!svg.includes('97.80'));assert.ok(!svg.includes('64.69'));assert.ok(!svg.includes('data-conflict-id'));
  assert.ok(!svg.includes('NaN'));assert.match(building.svg(d,24,{x:100,y:200},true,true),/เส้นแดง/);
  assert.equal(building.audit(d).length,0);
});
test('2.5D roof and frame use the same corrected bounds and never mutate layout',()=>{
  const d=building.apply(fixture()),before=JSON.stringify(d),open=building.frameFaces(d),roof=building.frameFaces(d,true);
  assert.ok(open.length>50);assert.ok(!open.some(f=>f.part==='canopy-roof'));
  const points=roof.filter(f=>f.part==='canopy-roof').flatMap(f=>f.points);
  near(Math.min(...points.map(p=>p[0])),35);near(Math.max(...points.map(p=>p[0])),100);
  near(Math.min(...open.flatMap(f=>f.points.map(p=>p[2]))),1);
  assert.ok(open.some(f=>f.color==='#32984b' && f.points.some(p=>Math.abs(p[2]-5.6)<1e-8)));
  assert.equal(JSON.stringify(d),before);
});
test('twin elevations follow corrected boundaries and fall back safely for older layouts',()=>{
  const twin=fs.readFileSync(require.resolve('../digital-twin.js'),'utf8');
  const section=twin.slice(twin.indexOf('  const elevation ='),twin.indexOf('  function localize()'));
  const c={window:{ChinChunBuilding:building},data:building.apply(fixture()),floor:'1F',isRamp:()=>false,inFactory:p=>p[1]<=40,isOfficeEntry:()=>false,factoryRise:1.5,dieGround:null};
  vm.createContext(c);vm.runInContext(section.replace('const elevation =','var elevation ='),c);
  const s=(x,y)=>({item:{id:'m'},type:'equipment',points:[[x,y],[x+1,y],[x+1,y+1],[x,y+1]]});
  assert.equal(c.elevation(s(35,42)),1);assert.equal(c.elevation(s(98,20)),1.5);assert.equal(c.elevation(s(34,42)),0);
  c.data={};assert.equal(c.elevation(s(55,42)),0);c.floor='2F';assert.equal(c.elevation(s(55,20)),0);
});
test('UI cannot reintroduce the rejected inferred partitions',()=>{
  const app=fs.readFileSync(require.resolve('../app.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  assert.match(app,/pushHistoryState\('套用紅線邊界/);assert.match(html,/套用紅線邊界（不動隔間）/);
  assert.ok(!html.includes('套用 A3 建築基準'));assert.ok(!app.includes('97.80×40.00M'));
  assert.ok(!source.includes("['東側原有房間'"));
});
