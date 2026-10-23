const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../digital-twin.js'),'utf8');
const marker='})();';
assert.ok(source.trimEnd().endsWith(marker));
const window={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../building-geometry.js'),'utf8'),{window});
vm.runInNewContext(source.trimEnd().slice(0,-marker.length)+`window.__rampTopPoints=rampTopPoints;
window.__rampFaces=s=>{allFaces=true;try{return rampFaces(s);}finally{allFaces=false;}};
window.__rampEdges=rampEdges;window.__rampEndLabels=rampEndLabels;window.__rect=rect;`+marker,
{window,document:{documentElement:{lang:'zh-Hant'}}});
window.ChinChunTwin.update({grid:{factory_width:100,factory_depth:40}},'1F');

test('RAMP-5M keeps the first-version short-side slope',()=>{
  const item={code:'RAMP-5M',x:20,y:38,width:5,height:2.5};
  const points=[[20,38],[25,38],[25,40.5],[20,40.5]];
  const top=window.__rampTopPoints({item,points,z:1.5});
  assert.deepEqual(Array.from(top,p=>p[2]),[1.5,1.5,0,0]);
  assert.deepEqual(Array.from(top,p=>p.slice(0,2).join(',')),points.map(p=>p.join(',')));
});

test('the high edge remains on the factory side when ramp is reversed',()=>{
  const points=[[20,-2.5],[25,-2.5],[25,0],[20,0]];
  const top=window.__rampTopPoints({item:{code:'RAMP-5M'},points,z:1.5});
  assert.deepEqual(Array.from(top,p=>p[2]),[0,0,1.5,1.5]);
});

test('annotated connecting ramp joins +1.00 and +1.50 without touching CAD or silently migrating old layouts',()=>{
  const layout={building_geometry:{...window.ChinChunBuilding.reference(),connectingRamp:{x:86,y:40,width:3,height:5}},equipment:[{id:'D1-1',x:80,y:51}],walls:[{id:'user',x1:4,y1:8,x2:10,y2:8}]};
  const before=JSON.stringify(layout),item=window.ChinChunBuilding.connectingRamp(layout);
  assert.equal(item.x,86);assert.equal(item.y,40);assert.equal(item.width,3);assert.equal(item.height,5);
  assert.equal(item.geometryAccuracy,'annotation-approximate');
  const s={item,points:window.__rect(item),z:1.5},top=window.__rampTopPoints(s);
  assert.deepEqual(Array.from(top,p=>p[2]),[1.5,1.5,1,1]);
  const edges=window.__rampEdges(s);assert.ok(edges.high.every(p=>p[1]===40));assert.ok(edges.low.every(p=>p[1]===45));
  for(const p of edges.high)assert.equal(window.ChinChunBuilding.floorLevel(layout,[p[0],p[1]-.001]),p[2]);
  for(const p of edges.low)assert.equal(window.ChinChunBuilding.floorLevel(layout,p),p[2]);
  const faces=window.__rampFaces(s);
  assert.ok(faces.every(f=>f.points.every(p=>Number.isFinite(p[2]) && p[2]>=1)),'no wedge descending to road level');
  const markers=faces.filter(f=>f.part==='ramp-end-marker');assert.equal(markers.length,2);
  assert.ok(markers.find(f=>f.color==='#ff6258').points.every(p=>p[1]<40.1));
  assert.ok(markers.find(f=>f.color==='#ffdb48').points.every(p=>p[1]>44.9));
  assert.deepEqual(Array.from(window.__rampEndLabels(s),v=>v.text),['紅線高端 +1.50 m','黃線低端 +1.00 m']);
  assert.equal(JSON.stringify(layout),before);
  assert.equal(window.ChinChunBuilding.connectingRamp({}),null,'no connector on unverified default geometry');
  assert.equal(window.ChinChunBuilding.connectingRamp({building_geometry:window.ChinChunBuilding.reference()}),null,'no guessed position on another saved drawing');
  const invalid=JSON.parse(before);invalid.building_geometry.annex.rise=2;assert.equal(window.ChinChunBuilding.connectingRamp(invalid),null);
});

test('explicit ramp elevations and edge direction survive rigid rotation, without the centre heuristic or a zero-level assumption',()=>{
  const item={code:'RAMP-CONNECTOR',x:86.5,y:40,width:3.5,height:5,ramp:{low:1,high:1.5,highEdge:'last'}};
  for(const rotation of [0,90,180,270,37]){
    const input={...item,rotation},points=window.__rect(input),before=JSON.stringify(input);
    const s={item:input,points,z:9},top=window.__rampTopPoints(s);
    assert.deepEqual(Array.from(top,p=>p[2]),[1,1,1.5,1.5]);
    assert.deepEqual(Array.from(top,p=>p.slice(0,2).join(',')),Array.from(points,p=>p.join(',')));
    const faces=window.__rampFaces(s),surface=faces.find(f=>f.part==='ramp-surface');
    assert.equal(Math.min(...surface.points.map(p=>p[2])),1);assert.equal(Math.max(...surface.points.map(p=>p[2])),1.5);
    assert.equal(JSON.stringify(input),before);
  }
});
