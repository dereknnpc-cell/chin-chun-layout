const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const window={};vm.runInNewContext(read('boiler-equipment.js'),{window});vm.runInNewContext(read('twin-models.js'),{window});
const base=()=>{const d=JSON.parse(read('factory_layout_data.json'));d.dock_shutters_fixed=true;d.diecut_accessories_20261103={};d.equipment.find(q=>q.id==='eq_eva3').ls7as_dimensions_confirmed=true;return d;};
const id='eq_boiler_zh1500gf';
test('boiler addition uses the GF dimensions in the PDF blue corner, preserves the document and respects later edits/deletion',()=>{
  const d=base(),before=JSON.stringify(d),r=window.ChinChunBoiler.upgrade(d),item=r.layout.equipment.at(-1);
  assert.equal(r.migrated,true);assert.equal(JSON.stringify(d),before);
  assert.deepEqual(JSON.parse(JSON.stringify(r.layout.equipment.slice(0,-1))),d.equipment);
  assert.equal(r.layout.walls,d.walls);assert.equal(r.layout.aisles,d.aisles);
  assert.equal(item.code,'ZH-1500GF');assert.deepEqual([item.width,item.height,item.physicalHeight],[1.945,1.915,2.305]);
  assert.ok(item.x>=96.4 && item.x+item.width<=99.4 && item.y>=.7 && item.y+item.height<=3.6);
  assert.ok(item.y+item.height<d.equipment.find(q=>q.code==='H1-1').y);
  item.x=90;assert.equal(window.ChinChunBoiler.upgrade(r.layout).layout,r.layout);
  r.layout.equipment=r.layout.equipment.filter(q=>q.id!==id);assert.equal(window.ChinChunBoiler.upgrade(r.layout).migrated,false);
  const existing=base();existing.equipment.push({...item,id:'owner-boiler',x:95});
  const kept=window.ChinChunBoiler.upgrade(existing);assert.equal(kept.layout.equipment,existing.equipment);assert.equal(kept.layout.equipment.at(-1).x,95);
});
test('boiler never relocates occupied plans or adds to an unrelated/moved corner',()=>{
  for(const mutate of [d=>d.walls=[],d=>d.equipment.find(q=>q.code==='H1-1').x=80,d=>d.equipment.push({id:'user',x:97,y:2,width:1,height:1}),d=>d.equipment.push({id:'rotated',x:98.3,y:1.5,width:.2,height:2,rotation:90})]){
    const d=base();mutate(d);assert.equal(window.ChinChunBoiler.upgrade(d).layout,d);
  }
});
test('normal local/import/cloud migration includes the boiler helper and runs only once',()=>{
  const source=read('app.js'),section=source.slice(source.indexOf('  function applySourceGeometryRevision('),source.indexOf('  // --- State Variables ---'));
  const ctx={window,SOURCE_GEOMETRY_REVISION:base().source_geometry_revision};vm.createContext(ctx);vm.runInContext(section,ctx);
  const first=ctx.applySourceGeometryRevision(base());assert.ok(first.layout.equipment.some(q=>q.id===id));assert.equal(first.migrated,true);
  assert.equal(ctx.applySourceGeometryRevision(first.layout).migrated,false);
  const html=read('index.html');assert.ok(html.indexOf('boiler-equipment.js')<html.indexOf('<script src="app.js'));
  assert.ok(read('build.mjs').includes('"boiler-equipment.js"'));
});
test('boiler model fits the exact envelope, has identifiable photo components and follows CAD transforms',()=>{
  const item=Object.freeze({code:'ZH-1500GF',x:0,y:0,width:1.945,height:1.915}),before=JSON.stringify(item),m=window.ChinChunModels;
  const faces=m.build(item),points=faces.flatMap(f=>f.points);assert.equal(JSON.stringify(item),before);assert.equal(m.matches(item),true);
  assert.ok(faces.length>500);assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
  for(const [axis,max] of [[0,1.945],[1,1.915],[2,2.305]]){assert.ok(Math.abs(Math.min(...points.map(p=>p[axis])))<1e-9);assert.ok(Math.abs(Math.max(...points.map(p=>p[axis]))-max)<1e-9);}
  for(const part of ['vessel','control-cabinet','flue','gauge-face','blower','feed-pipe','valve-wheel'])assert.ok(faces.some(f=>f.part===part),part);
  const transformed=m.build({...item,x:3,y:4,rotation:90}),scaled=m.build({...item,width:3.89,height:3.83});
  faces.forEach((f,i)=>f.points.forEach((p,j)=>{const q=transformed[i].points[j],r=scaled[i].points[j];assert.ok(Math.abs(q[0]-(3+1.945/2-(p[1]-1.915/2)))<1e-9);assert.ok(Math.abs(q[1]-(4+1.915/2+(p[0]-1.945/2)))<1e-9);assert.equal(q[2],p[2]);assert.ok(Math.abs(r[0]-p[0]*2)<1e-9 && Math.abs(r[1]-p[1]*2)<1e-9);assert.equal(r[2],p[2]);}));
});

test('acoustic walls face EVA1 west and H1-1 south with exact 1 m clear gaps and an independent outer rail',()=>{
  const old=window.ChinChunBoiler.upgrade(base()).layout,before=JSON.stringify(old),r=window.ChinChunBoiler.upgradeSurround(old),b=old.equipment.find(q=>q.id===id);
  assert.equal(JSON.stringify(old),before);assert.equal(r.migrated,true);
  const west=r.layout.walls.find(q=>q.acousticSide==='eva1'),south=r.layout.walls.find(q=>q.acousticSide==='h1'),rail=r.layout.equipment.find(q=>q.code==='BOILER-RAIL');
  const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
  near(b.x-(west.x1+west.thickness/2),1);near(south.y1-south.thickness/2-b.y-b.height,1);
  near(west.x1-west.thickness/2-rail.x-rail.width,1);
  assert.equal(west.x1,west.x2);assert.equal(south.y1,south.y2);assert.equal(west.clearPanelHeight,0);assert.equal(south.clearPanelHeight,.85);
  assert.deepEqual(r.layout.equipment.slice(0,-1),old.equipment);assert.equal(JSON.stringify(r.layout.walls.slice(0,-2)),JSON.stringify(old.walls));assert.equal(r.layout.aisles,old.aisles);
  assert.equal(window.ChinChunBoiler.upgradeSurround(r.layout).migrated,false);
  r.layout.walls=[];r.layout.equipment=r.layout.equipment.filter(q=>q.code!=='BOILER-RAIL');assert.equal(window.ChinChunBoiler.upgradeSurround(r.layout).migrated,false,'later deletion is respected');
});
test('acoustic geometry includes framed foil, transparent upper H1 panels and orange mesh rail',()=>{
  const layout=window.ChinChunBoiler.upgradeSurround(window.ChinChunBoiler.upgrade(base()).layout).layout;
  const parts=[...layout.walls.filter(q=>q.acousticSide),layout.equipment.find(q=>q.code==='BOILER-RAIL')];
  const all=parts.map(q=>window.ChinChunBoiler.surroundFaces(q));
  assert.ok(!all[0].some(f=>f.opacity));assert.ok(all[1].some(f=>f.part==='acoustic-clear-panel' && f.opacity===.24));
  assert.ok(all[2].some(f=>f.part==='guardrail-mesh'));assert.ok(all.flat(2).every(f=>f.points.every(p=>p.every(Number.isFinite))));
  const west=parts[0],moved=window.ChinChunBoiler.surroundFaces({...west,x1:west.x1+3,x2:west.x2+3,y1:west.y1+2,y2:west.y2+2});
  all[0].forEach((f,i)=>f.points.forEach((p,j)=>{assert.ok(Math.abs(moved[i].points[j][0]-p[0]-3)<1e-9);assert.ok(Math.abs(moved[i].points[j][1]-p[1]-2)<1e-9);assert.equal(moved[i].points[j][2],p[2]);}));
  const source=read('digital-twin.js');assert.match(source,/opacity:f.opacity/);assert.match(source,/ChinChunBoiler\?\.surroundFaces\(item\)/);
});
