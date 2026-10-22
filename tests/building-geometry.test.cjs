const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../building-geometry.js'),'utf8');
const window={};vm.runInNewContext(source,{window});const building=window.ChinChunBuilding;
const plain=v=>JSON.parse(JSON.stringify(v));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);
const fixture=()=>({source_geometry_revision:'existing-eps',grid:{factory_width:100,factory_depth:40,cols_x:21},
  equipment:[{id:'machine',code:'M1',x:55,y:41,width:3,height:4,rotation:33},{id:'office',code:'OFFICE',category:'Office',x:45,y:30,width:5,height:9}],
  columns:[{id:'user-column',x:100,y:40}],equipment_2f:[{id:'upstairs',x:1,y:1}],flows:[{id:'route',points:[{x:1,y:2},{x:3,y:4}]}],
  walls:[{id:'old',x1:0,y1:40,x2:100,y2:40},{id:'CNC',x1:81.5,y1:56.5,x2:100.7,y2:56.5},{id:'2F',floor:'2F',x1:0,y1:0,x2:5,y2:0}],
  floors:[{id:'1F',name:'first'}],title_block:{status:'APPROVED'},layer_settings:{locks:{walls:false}},custom:'retained'});

test('A3 dimension chain, 180 degree placement and right-end extension are exact',()=>{
  const b=building.reference();near(b.main.width,97.8);near(b.main.height,40);
  near(b.annex.x,32.82);near(b.annex.width,64.69);near(b.annex.height,19);near(b.annex.axisDepth+b.annex.eave,19);
  near(b.extension.x,87.51);near(b.extension.x+b.extension.width,b.annex.x+b.annex.width);
  assert.equal(b.sourceRotation,180);assert.deepEqual(plain(b.extension.axisBays),[5,5]);
  near(b.roof.x,31.44);near(b.roof.width,66.07);
});
test('calibration preserves every equipment field, columns, flows, upper floor and external CNC walls',()=>{
  const original=fixture(),before=JSON.stringify(original),result=building.apply(original);
  assert.equal(JSON.stringify(original),before,'pure input');
  for(const key of ['equipment','columns','equipment_2f','flows','layer_settings','custom','source_geometry_revision'])assert.deepEqual(plain(result[key]),original[key],key);
  assert.ok(result.walls.some(q=>q.id==='CNC'));assert.ok(result.walls.some(q=>q.id==='2F'));
  assert.deepEqual(plain(result.building_geometry.previousMainWalls),[original.walls[0]]);
  assert.equal(result.grid.cols_x,21);assert.equal(result.grid.factory_width,97.8);
  assert.ok(!result.title_block.status.includes('APPROVED'));
  result.walls[0].x1=84;result.equipment[0].x=56;const edited=JSON.stringify(result);
  assert.equal(JSON.stringify(building.apply(result)),edited,'reapply never erases post-calibration edits');
});
test('main, annex and road elevations use the same live building record',()=>{
  const d=building.apply(fixture());assert.equal(building.floorLevel(d,[55,39]),1.5);
  assert.equal(building.floorLevel(d,[55,41]),1);assert.equal(building.floorLevel(d,[90,58]),1);
  assert.equal(building.floorLevel(d,[15,45]),0);assert.equal(building.floorLevel(d,[98,58]),0);
  assert.equal(building.floorLevel({},[55,41]),null);d.building_geometry.annex.rise=NaN;assert.equal(building.get(d),null);
});
test('unmeasured partitions are explicit estimates and rotate once without machine transforms',()=>{
  const walls=building.partitions();assert.equal(new Set(walls.map(q=>q.id)).size,walls.length);
  assert.ok(walls.length>40);assert.ok(walls.slice(0,4).every(q=>q.sourceAccuracy==='dimension-chain'));
  assert.ok(walls.slice(4).every(q=>q.sourceAccuracy==='scaled-trace' && q.description.includes('待現場量測')));
  const q=walls.find(q=>q.name==='東側原有房間');near(q.x1,87.3);near(q.y1,40);near(q.y2,20);
});
test('conflicts flag crossing and contained walls plus annex boundary without moving any equipment',()=>{
  const d=building.apply(fixture());d.equipment=[{id:'m',code:'M1',x:50,y:20,width:5,height:5},
    {id:'room',code:'CNC Room',is_room:true,x:81.5,y:56.5,width:19.72,height:10.12},
    {id:'door',category:'Door',x:50,y:20,width:5,height:5}];
  d.walls=[{id:'short',source:'A3 L-02',x1:51,y1:21,x2:52,y2:22}];
  const before=JSON.stringify(d),issues=building.audit(d);assert.equal(issues.length,2);
  assert.deepEqual(plain(issues[0].walls),['short']);assert.equal(issues[1].kind,'annex-boundary');
  assert.equal(JSON.stringify(d),before);
  d.equipment[0].rotation=45;assert.ok(building.audit(d).some(q=>q.id==='m'));
});
test('2D reference overlay is non-interactive, bilingual and escapes conflict identifiers',()=>{
  const d=building.apply(fixture());d.equipment=[{id:'x" onload="bad',x:50,y:20,width:5,height:5}];
  d.walls=[{source:'A3 L-02',x1:51,y1:21,x2:52,y2:22}];
  const svg=building.svg(d,24,{x:100,y:200},true);
  assert.match(svg,/pointer-events="none"/);assert.match(svg,/最新增建/);assert.match(svg,/&quot;/);assert.ok(!svg.includes(' onload="'));
  assert.ok(!svg.includes('NaN'));assert.match(building.svg(d,24,{x:100,y:200},true,true),/ส่วนต่อเติม/);
});
test('2.5D structural depiction uses absolute floor levels; roof is opt-in and data is immutable',()=>{
  const d=building.apply(fixture()),before=JSON.stringify(d),open=building.frameFaces(d),roof=building.frameFaces(d,true);
  assert.ok(open.length>50);assert.ok(!open.some(f=>f.part==='canopy-roof'));assert.ok(roof.some(f=>f.part==='canopy-roof'));
  for(const f of roof)for(const p of f.points)assert.ok(p.every(Number.isFinite));
  near(Math.min(...open.flatMap(f=>f.points.map(p=>p[2]))),1);
  assert.ok(open.some(f=>f.color==='#32984b' && f.points.some(p=>Math.abs(p[2]-5.6)<1e-8)));
  assert.equal(JSON.stringify(d),before);
});
test('twin elevations follow calibrated A3 and fall back safely for older layouts',()=>{
  const twin=fs.readFileSync(require.resolve('../digital-twin.js'),'utf8');
  const section=twin.slice(twin.indexOf('  const elevation ='),twin.indexOf('  function localize()'));
  const c={window:{ChinChunBuilding:building},data:building.apply(fixture()),floor:'1F',isRamp:()=>false,inFactory:p=>p[1]<=40,isOfficeEntry:()=>false,factoryRise:1.5,dieGround:null};
  vm.createContext(c);vm.runInContext(section.replace('const elevation =','var elevation ='),c);
  const s=(x,y)=>({item:{id:'m'},type:'equipment',points:[[x,y],[x+1,y],[x+1,y+1],[x,y+1]]});
  assert.equal(c.elevation(s(55,42)),1);assert.equal(c.elevation(s(55,20)),1.5);assert.equal(c.elevation(s(10,42)),0);
  c.data={};assert.equal(c.elevation(s(55,42)),0);c.floor='2F';assert.equal(c.elevation(s(55,20)),0);
});
test('build and UI include the A3 module, reversible explicit application and non-intercepting roof',()=>{
  const app=fs.readFileSync(require.resolve('../app.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8'),twin=fs.readFileSync(require.resolve('../digital-twin.js'),'utf8');
  assert.ok(html.indexOf('src="building-geometry.js')<html.indexOf('src="digital-twin.js'));
  assert.match(app,/pushHistoryState\('套用 A3/);assert.match(app,/const calibrated=window.ChinChunBuilding.apply\(layoutData\)/);
  assert.match(twin,/nonInteractive:true/);assert.match(twin,/faces.filter\(f=>!f.nonInteractive\)/);
});
