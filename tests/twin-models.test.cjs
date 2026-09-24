const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../twin-models.js');
const models=window.ChinChunModels;
const base={id:'eq_eva2_a1_2',code:'A1-2',x:65.07,y:41.47,width:20.23,height:2,rotation:0};
test('silver oven is the highest point at the confirmed 2.4 m',()=>{
  const faces=models.build(base);
  const maxZ=list=>Math.max(...list.flatMap(f=>f.points.map(p=>p[2])));
  assert.ok(Math.abs(maxZ(faces)-2.4)<1e-9);
  assert.ok(Math.abs(maxZ(faces.filter(f=>f.color==='#aababc'))-2.4)<1e-9);
  assert.ok(maxZ(faces.filter(f=>f.color!=='#aababc'))<2.4);
});
test('only A1-2 gets photo-reference geometry and input is unchanged',()=>{
  const input=Object.freeze({...base}),before=JSON.stringify(input);
  const faces=models.build(input);
  assert.ok(faces.length>500);
  assert.equal(JSON.stringify(input),before);
  assert.equal(models.build({...base,code:'A1-1'}),null);
  for(const face of faces) {
    assert.ok(face.points.length>=3);
    assert.match(face.color,/^#[0-9a-f]{6}$/i);
    for(const p of face.points)assert.ok(p.every(Number.isFinite));
  }
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
  const a=models.build({...base,x:0,y:0}),b=models.build({...base,x:0,y:0,width:40.46,height:4});
  a.forEach((f,i)=>f.points.forEach((p,j)=>{
    const q=b[i].points[j];
    assert.ok(Math.abs(q[0]-p[0]*2)<1e-9);
    assert.ok(Math.abs(q[1]-p[1]*2)<1e-9);
    assert.equal(q[2],p[2]);
  }));
});
