const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../twin-models.js');
const models=window.ChinChunModels;
const item=Object.freeze({id:'eq_eva2_a1_2',code:'A1-2',name:'EVA 2',x:81.5,y:16.5,width:16,height:2,rotation:0});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} vs ${b}`);

test('A1-2 is a separate six-section photo model inside its unchanged live CAD footprint',()=>{
  const before=JSON.stringify(item),faces=models.build(item),points=faces.flatMap(f=>f.points);
  assert.ok(models.matches(item));assert.ok(models.matches({code:' a1-2 '}));
  assert.equal(JSON.stringify(item),before);assert.equal(models.rotationOffset(item),0);
  assert.ok(faces.length>1500);assert.deepEqual([...new Set(faces.map(f=>f.section))],[1,2,3,4,5,6]);
  assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
  assert.ok(points.every(([x,y,z])=>x>=item.x-1e-9 && x<=item.x+16+1e-9 && y>=item.y-1e-9 && y<=item.y+2+1e-9 && z>=0 && z<=2.55+1e-9));
  near(Math.min(...points.map(p=>p[2])),0);near(Math.max(...points.map(p=>p[2])),2.55);
  assert.notDeepEqual(faces,models.build({...item,code:'A1-1'}));
});

test('A1-2 sections remain in PDF left-to-right order, with the oven only in section 5',()=>{
  const faces=models.build({...item,x:0,y:0});
  let end=0;
  for(let number=1;number<=6;number++){
    const points=faces.filter(f=>f.section===number).flatMap(f=>f.points),xs=points.map(p=>p[0]);
    assert.ok(Math.min(...xs)>end-1e-9);end=Math.max(...xs);
  }
  const oven=faces.filter(f=>f.section===5),bridge=faces.filter(f=>f.section===4);
  assert.ok(oven.some(f=>f.color==='#544c40'),'fixed mesh conveyor belongs to oven');
  assert.ok(oven.some(f=>f.color==='#303638'),'output blower belongs to oven');
  assert.ok(!bridge.some(f=>['#544c40','#303638','#86a437'].includes(f.color)),'section 4 is not the oven or green side trolley');
  const rollers=bridge.filter(f=>f.color==='#d0d9d8');
  assert.equal(rollers.length,5*26,'five fixed roller bridge cylinders');
});

test('A1-2 movement, resizing and arbitrary rotation follow 2D without changing heights',()=>{
  const base={...item,x:0,y:0},original=models.build(base),moved=models.build({...base,x:7,y:-3});
  // Include the old 20.23 m CAD record: never silently force it to PDF's 16 m.
  for(const width of [8,16,20.23,32])for(const rotation of [0,37,90,-90,180]){
    const height=3,turned=models.build({...base,width,height,rotation}),a=rotation*Math.PI/180;
    original.forEach((face,i)=>face.points.forEach((p,j)=>{
      const q=turned[i].points[j],lx=p[0]/16*width-width/2,ly=p[1]/2*height-height/2;
      near(q[0],width/2+lx*Math.cos(a)-ly*Math.sin(a));
      near(q[1],height/2+lx*Math.sin(a)+ly*Math.cos(a));near(q[2],p[2]);
      near(moved[i].points[j][0],p[0]+7);near(moved[i].points[j][1],p[1]-3);
      assert.equal(turned[i].section,face.section);
    }));
  }
});

test('A1-2 numbered section markers follow geometry through editing and renaming',()=>{
  const base={...item,x:0,y:0},markers=models.sectionMarkers(base);
  assert.deepEqual(markers.map(m=>m.number),[1,2,3,4,5,6]);
  assert.ok(markers.every((m,i)=>i===0 || m.point[0]>markers[i-1].point[0]));
  for(const rotation of [90,180,-90]){
    const turned=models.sectionMarkers({...base,rotation}),a=rotation*Math.PI/180;
    markers.forEach((m,i)=>{
      const [x,y,z]=m.point,q=turned[i].point;
      near(q[0],8+(x-8)*Math.cos(a)-(y-1)*Math.sin(a));
      near(q[1],1+(x-8)*Math.sin(a)+(y-1)*Math.cos(a));near(q[2],z);
    });
  }
  const renamed={...item,code:'黃膠二',photoModelCode:'A1-2'};
  assert.deepEqual(models.build(renamed),models.build(item));
  assert.deepEqual(models.sectionMarkers(renamed),models.sectionMarkers(item));
  assert.deepEqual(models.sectionMarkers({code:'A1-1'}),[]);
});
