const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
global.window={};require('../twin-models.js');
const models=window.ChinChunModels;
const item=Object.freeze({id:'test_wc',code:'WC-STALLS',category:'Sanitary',x:80,y:20,width:5,height:5,rotation:0});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} vs ${b}`);

test('WC layout has centered left single door, two upper-left urinals, three upper-right stalls and a 2m lower sink',()=>{
  const l=models.restroomLayout(item);
  near(l.doorWidth,.9);near((l.doorStart+l.doorEnd)/2,2.5);assert.equal(l.compact,false);
  assert.equal(l.urinals.length,2);assert.equal(l.stalls.length,3);near(l.sink.width,2);
  for(const u of l.urinals){near(u.x,l.wall+.02);assert.ok(u.y+u.height<l.doorStart);}
  for(const st of l.stalls){assert.ok(st.x>l.urinals[0].x+l.urinals[0].width);assert.ok(st.y+st.height<l.doorStart);assert.ok(st.doorWidth>0);}
  assert.ok(l.sink.y>l.doorEnd);near(l.sink.y+l.sink.height,l.height-l.wall);
});

test('restroom full model has four complete walls, doorway void, three independent doors and interior fixtures',()=>{
  const before=JSON.stringify(item),faces=models.build(item),l=models.restroomLayout(item);
  assert.ok(models.matches(item));assert.equal(JSON.stringify(item),before);assert.ok(faces.length>300);
  const points=faces.flatMap(f=>f.points);
  assert.ok(points.every(p=>p.every(Number.isFinite)));
  assert.ok(points.every(([x,y,z])=>x>=80-1e-9 && x<=85+1e-9 && y>=20-1e-9 && y<=25+1e-9 && z>=0 && z<=2.4+1e-9));
  for(const part of ['north-wall','south-wall','east-wall','west-wall']){
    const wall=faces.filter(f=>f.part===part);assert.ok(wall.length);near(Math.max(...wall.flatMap(f=>f.points.map(p=>p[2]))),2.4);
  }
  for(const f of faces.filter(f=>f.part==='west-wall')){
    const ys=f.points.map(p=>p[1]-20);
    assert.ok(Math.max(...ys)<=l.doorStart+1e-9 || Math.min(...ys)>=l.doorEnd-1e-9,'no wall blocking the entrance');
  }
  assert.equal(faces.filter(f=>f.part==='stall-door').length,3*12);
  for(const part of ['urinal','toilet','sink','entrance-door','entrance-lintel'])assert.ok(faces.some(f=>f.part===part));
  const cutaway=faces.filter(f=>!f.cutaway);
  assert.ok(cutaway.length<faces.length);
  for(const part of ['north-wall','south-wall','east-wall','west-wall']){
    near(Math.max(...cutaway.filter(f=>f.part===part).flatMap(f=>f.points.map(p=>p[2]))),.45);
  }
  assert.equal(cutaway.filter(f=>f.part==='urinal').length,faces.filter(f=>f.part==='urinal').length);
});

test('restroom and fixtures rotate and move rigidly with the same 2D record, including renamed codes',()=>{
  const base={...item,x:0,y:0},original=models.build(base);
  for(const rotation of [37,90,180,-90]){
    const turned=models.build({...base,x:7,y:3,rotation}),a=rotation*Math.PI/180;
    original.forEach((f,i)=>f.points.forEach(([x,y,z],j)=>{
      const q=turned[i].points[j];near(q[0],9.5+(x-2.5)*Math.cos(a)-(y-2.5)*Math.sin(a));near(q[1],5.5+(x-2.5)*Math.sin(a)+(y-2.5)*Math.cos(a));near(q[2],z);
    }));
  }
  const resized=models.restroomLayout({...item,width:6,height:6});near(resized.sink.width,2);near(resized.doorWidth,.9);
  assert.deepEqual(models.build({...item,code:'廁所',photoModelCode:'WC-STALLS'}),models.build(item));
  assert.ok(models.restroomLayout({...item,width:3,height:2}).compact,'legacy library size gets a feasibility warning');
  assert.equal(models.matches({code:'SINK-IND'}),false,'other sanitary objects are unchanged');
});

test('2D restroom uses the same fixture layout and shows separate stall doors instead of the old generic ellipse',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
  const start=source.indexOf('  function renderRestroomSvg('),end=source.indexOf('  function renderSingleItemSvg(',start);
  const context={window:{ChinChunModels:models},SCALE:24};vm.createContext(context);vm.runInContext(source.slice(start,end),context);
  const svg=context.renderRestroomSvg(item,{x:0,y:0});
  assert.equal((svg.match(/data-fixture="urinal"/g)||[]).length,2);
  assert.equal((svg.match(/data-fixture="stall"/g)||[]).length,3);
  assert.equal((svg.match(/data-fixture="stall-door"/g)||[]).length,3);
  assert.equal((svg.match(/data-fixture="toilet"/g)||[]).length,3);
  assert.match(svg,/data-fixture="entrance" data-width="0.9"/);assert.match(svg,/data-fixture="sink" data-length="2"/);
  assert.match(svg,/class="main-box"/);assert.ok(!svg.includes('NaN'));
});

test('2.5D cutaway only hides upper panels of the selected restroom, never deletes model geometry',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../digital-twin.js'),'utf8');
  const start=source.indexOf('  function objectFaces(s)'),end=source.indexOf('  function draw()',start);
  const room={item,model:models.build(item)},before=JSON.stringify(room.model);
  const context={elevation:()=>0,faceDepth:()=>0,selected:room,restroomCutaway:true,referenceCode:models.referenceCode};
  vm.createContext(context);vm.runInContext(source.slice(start,end),context);
  assert.equal(context.objectFaces(room).length,room.model.filter(f=>!f.cutaway).length);
  context.restroomCutaway=false;assert.equal(context.objectFaces(room).length,room.model.length);
  context.restroomCutaway=true;context.selected=null;assert.equal(context.objectFaces(room).length,room.model.length);
  assert.equal(JSON.stringify(room.model),before);
});
