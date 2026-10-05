const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../twin-models.js');
const models=window.ChinChunModels;
test('G2-2 stays grounded in its CAD footprint and rotates without changing height',()=>{
  const item=Object.freeze({code:'G2-2',x:0,y:0,width:4,height:2.4});
  const original=models.build(item),turned=models.build({...item,rotation:90}),resized=models.build({...item,width:8,height:4.8});
  assert.ok(models.matches(item));
  const points=original.flatMap(f=>f.points);
  assert.ok(points.every(p=>p.every(Number.isFinite)));
  assert.ok(points.every(([x,y,z])=>x>=0 && x<=4 && y>=0 && y<=2.4 && z>=0 && z<=2.3));
  assert.equal(Math.min(...points.map(p=>p[2])),0);
  assert.ok(Math.max(...points.map(p=>p[2]))>2.29);
  original.forEach((face,i)=>face.points.forEach((p,j)=>{
    const q=turned[i].points[j],r=resized[i].points[j];
    assert.ok(Math.abs(q[0]-(2-(p[1]-1.2)))<1e-9);
    assert.ok(Math.abs(q[1]-(1.2+(p[0]-2)))<1e-9);
    assert.equal(q[2],p[2]);
    assert.ok(Math.abs(r[0]-2*p[0])<1e-9 && Math.abs(r[1]-2*p[1])<1e-9);
    assert.equal(r[2],p[2]);
  }));
});
test('F1-1 respects the confirmed 2.8 m height and excludes foam consumables',()=>{
  const item=Object.freeze({code:'F1-1',x:0,y:0,width:15,height:3.8,rotation:0});
  const faces=models.build(item),points=faces.flatMap(f=>f.points);
  assert.ok(models.matches(item));
  assert.ok(points.every(p=>p.every(Number.isFinite)));
  assert.ok(points.every(([x,y,z])=>x>=0 && x<=15 && y>=0 && y<=3.8 && z>=0 && z<=2.8));
  assert.ok(Math.abs(Math.max(...points.map(p=>p[2]))-2.8)<.01);
  assert.equal(Math.min(...points.map(p=>p[2])),0);
  assert.ok(!faces.some(f=>f.color==='#272a31' || f.color==='#53565b'));
  const turned=models.build({...item,rotation:90});
  faces.forEach((f,i)=>f.points.forEach((p,j)=>{
    const q=turned[i].points[j];
    assert.ok(Math.abs(q[0]-(7.5-(p[1]-1.9)))<1e-9);
    assert.ok(Math.abs(q[1]-(1.9+(p[0]-7.5)))<1e-9);
    assert.equal(q[2],p[2]);
  }));
});
const base={id:'eq_latex_h1_1',code:'H1-1',x:82.08,y:7.5,width:14.82,height:2,rotation:0};
test('silver oven is the highest point at the confirmed 2.4 m',()=>{
  const faces=models.build(base);
  const maxZ=list=>Math.max(...list.flatMap(f=>f.points.map(p=>p[2])));
  assert.ok(Math.abs(maxZ(faces)-2.4)<1e-9);
  assert.ok(Math.abs(maxZ(faces.filter(f=>f.color==='#aababc'))-2.4)<1e-9);
  assert.ok(maxZ(faces.filter(f=>f.color!=='#aababc'))<2.4);
});
test('H1-1 gets photo-reference geometry and input is unchanged',()=>{
  const input=Object.freeze({...base}),before=JSON.stringify(input);
  const faces=models.build(input);
  assert.ok(faces.length>500);
  assert.equal(JSON.stringify(input),before);
  assert.equal(models.build({...base,code:'A1-2'}),null);
  for(const face of faces) {
    assert.ok(face.points.length>=3);
    assert.match(face.color,/^#[0-9a-f]{6}$/i);
    for(const p of face.points)assert.ok(p.every(Number.isFinite));
  }
});
const eva={id:'eq_eva1_a1_1',code:'A1-1',x:65,y:.95,width:13.6,height:3.7,rotation:0};
test('A1-1 has its own grounded photo-reference geometry inside the CAD footprint',()=>{
  const input=Object.freeze({...eva}),before=JSON.stringify(input),faces=models.build(input);
  assert.ok(models.matches(input));
  assert.ok(faces.length>300);
  assert.equal(JSON.stringify(input),before);
  assert.equal(models.build({...input,code:'A1-2'}),null);
  const points=faces.flatMap(f=>f.points);
  assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
  assert.ok(points.every(p=>p[0]>=eva.x-1e-9 && p[0]<=eva.x+eva.width+1e-9));
  assert.ok(points.every(p=>p[1]>=eva.y-1e-9 && p[1]<=eva.y+eva.height+1e-9));
  assert.ok(Math.abs(Math.min(...points.map(p=>p[2])))<1e-9);
  assert.ok(Math.max(...points.map(p=>p[2]))<3);
  for(const color of ['#d9d2b8','#c9d2d0','#244944','#bc3326','#697273'])
    assert.ok(faces.some(f=>f.color===color),`missing photo feature ${color}`);
});
test('A1-1 rotates and resizes with its CAD footprint without changing estimated height',()=>{
  const original=models.build({...eva,x:0,y:0});
  const rotated=models.build({...eva,x:0,y:0,rotation:90});
  const resized=models.build({...eva,x:0,y:0,width:27.2,height:7.4});
  const cx=eva.width/2,cy=eva.height/2;
  original.forEach((face,i)=>face.points.forEach((p,j)=>{
    const q=rotated[i].points[j],r=resized[i].points[j];
    assert.ok(Math.abs(q[0]-(cx-(p[1]-cy)))<1e-9);
    assert.ok(Math.abs(q[1]-(cy+(p[0]-cx)))<1e-9);
    assert.equal(q[2],p[2]);
    assert.ok(Math.abs(r[0]-p[0]*2)<1e-9);
    assert.ok(Math.abs(r[1]-p[1]*2)<1e-9);
    assert.equal(r[2],p[2]);
  }));
});
test('A1-1 entrance conveyor is right of the large wheel',()=>{
  const faces=models.build(eva);
  const centerX=color=>{
    const xs=faces.filter(f=>f.color===color).flatMap(f=>f.points.map(p=>p[0]));
    return xs.reduce((sum,x)=>sum+x,0)/xs.length;
  };
  assert.ok(centerX('#244944')>centerX('#5b6060'));
  assert.ok(centerX('#bc3326')<centerX('#244944'));
});
test('rotation follows CAD center without changing height',()=>{
  const a=models.build(base),b=models.build({...base,rotation:90});
  const cx=base.x+base.width/2,cy=base.y+base.height/2;
  a.forEach((f,i)=>f.points.forEach((p,j)=>{
    const q=b[i].points[j];
    assert.ok(Math.abs(q[0]-(cx-(p[1]-cy)))<1e-9);
    assert.ok(Math.abs(q[1]-(cy+(p[0]-cx)))<1e-9);
    assert.equal(q[2],p[2]);
  }));
});
test('resize follows planar dimensions, not estimated vertical height',()=>{
  const a=models.build({...base,x:0,y:0}),b=models.build({...base,x:0,y:0,width:29.64,height:4});
  a.forEach((f,i)=>f.points.forEach((p,j)=>{
    const q=b[i].points[j];
    assert.ok(Math.abs(q[0]-p[0]*2)<1e-9);
    assert.ok(Math.abs(q[1]-p[1]*2)<1e-9);
    assert.equal(q[2],p[2]);
  }));
});
