const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../twin-models.js');
const models=window.ChinChunModels;
const item=Object.freeze({id:'eq_pf1_c1_1',code:'C1-1',x:59.89,y:30.55,width:20.23,height:4.2,rotation:0});
const local={...item,x:0,y:0};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} vs ${b}`);
const points=(faces,part)=>faces.filter(f=>f.part===part).flatMap(f=>f.points);
const extent=(p,axis)=>[Math.min(...p.map(p=>p[axis])),Math.max(...p.map(p=>p[axis]))];

test('C1-1 is a bounded photo model, without borrowing the adjacent C1-2 identity',()=>{
  const before=JSON.stringify(item),faces=models.build(item),p=faces.flatMap(f=>f.points);
  assert.ok(models.matches(item));assert.ok(faces.length>2000 && faces.length<6000);
  assert.ok(p.every(p=>p.length===3 && p.every(Number.isFinite)));
  assert.ok(p.every(([x,y,z])=>x>=item.x && x<=item.x+item.width && y>=item.y-1e-9 && y<=item.y+item.height && z>=0 && z<=3.15+1e-9));
  near(extent(p,2)[1],3.15);assert.equal(JSON.stringify(item),before);
  assert.equal(models.matches({...item,code:'C1-2'}),false);assert.equal(models.build({...item,code:'C1-2'}),null);
  assert.ok(!faces.some(f=>/stock|material|scrap|cart|crane|trolley/.test(f.part)));
});

test('PDF viewpoints place two unwind shafts left, the press centrally, take-up right and flywheel on the south side',()=>{
  const f=models.build(local),shaft=points(f,'unwind-mandrel'),press=points(f,'press-header'),takeup=points(f,'takeup-mandrel');
  const unwindCaps=f.filter(f=>f.part==='unwind-mandrel' && f.points.length===16);
  const unwindXs=[...new Set(unwindCaps.map(f=>Number((f.points.reduce((sum,p)=>sum+p[0],0)/16).toFixed(6))))];
  assert.equal(unwindXs.length,2);
  assert.ok(extent(shaft,0)[1]<extent(press,0)[0]);
  assert.ok(extent(press,0)[1]<extent(takeup,0)[0]);
  assert.ok(extent(points(f,'flywheel'),1)[0]>local.height/2);
  assert.ok(extent(points(f,'control-console'),1)[1]<local.height/2);
  const feed=points(f,'inclined-feed-roller'),start=extent(feed,0)[0],end=extent(feed,0)[1];
  assert.ok(Math.max(...feed.filter(p=>p[0]>end-.12).map(p=>p[2]))>Math.max(...feed.filter(p=>p[0]<start+.12).map(p=>p[2]))+.4);
  assert.ok(extent(points(f,'overhead-guide-roller'),2)[0]>2.5);
  // No solid full-height box fills the press's working throat.
  const bedTop=extent(points(f,'press-table'),2)[1],headBottom=extent(points(f,'press-crosshead'),2)[0];
  assert.ok(headBottom-bedTop>.15);assert.ok(points(f,'return-spring').length>0);
});

test('C1-1 geometry follows live CAD translation, independent XY resize and arbitrary rotation without changing height',()=>{
  const faces=models.build(local);
  for(const [width,height,rotation] of [[20.23,4.2,0],[14,3,37],[25,5,90],[18,4,-90],[20.23,4.2,180]]){
    const next={...local,x:7,y:-3,width,height,rotation},out=models.build(Object.freeze(next)),a=rotation*Math.PI/180;
    faces.forEach((f,i)=>f.points.forEach(([x,y,z],j)=>{
      const u=x/local.width*width-width/2,v=y/local.height*height-height/2,q=out[i].points[j];
      near(q[0],7+width/2+u*Math.cos(a)-v*Math.sin(a));
      near(q[1],-3+height/2+u*Math.sin(a)+v*Math.cos(a));near(q[2],z);
    }));
  }
  assert.deepEqual(models.build({...item,code:'沖孔一',photoModelCode:'C1-1'}),models.build(item));
  assert.equal(models.rotationOffset(item),0);
});

test('input, press and take-up annotations remain attached through CAD rotation and renaming',()=>{
  const markers=models.flowMarkers(local);
  assert.deepEqual(markers.map(m=>m.key),['c11Feed','c11Press','c11Discharge']);
  assert.ok(markers[0].point[0]<markers[1].point[0] && markers[1].point[0]<markers[2].point[0]);
  for(const rotation of [37,90,180,-90]){
    const next={...local,x:4,y:6,width:25,height:5,rotation},out=models.flowMarkers(next),a=rotation*Math.PI/180;
    markers.forEach((m,i)=>{
      const [x,y,z]=m.point,u=x/local.width*25-12.5,v=y/local.height*5-2.5,q=out[i].point;
      near(q[0],16.5+u*Math.cos(a)-v*Math.sin(a));near(q[1],8.5+u*Math.sin(a)+v*Math.cos(a));near(q[2],z);
    });
  }
  assert.deepEqual(models.flowMarkers({...item,code:'沖孔一',photoModelCode:'C1-1'}),models.flowMarkers(item));
  assert.deepEqual(models.flowMarkers({code:'C1-2'}),[]);
});
