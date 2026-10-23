const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const window={};
vm.runInNewContext(read('twin-models.js'),{window});
const previous=JSON.stringify(window.ChinChunModels.build({code:'G2-1',width:2.4,height:4.19,rotation:0}));
vm.runInNewContext(read('photo-models.js'),{window});
const models=window.ChinChunModels,photo=window.ChinChunPhotoModels;
const sizes={'PL-1':[18,4],'PL-2':[17,4],'J1-3':[4,3.4],'D1-1':[12,4],WELDING:[5,4],'L4-1':[3.25,3]};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} vs ${b}`);
for(const [code,[width,height]] of Object.entries(sizes)){
  test(`${code}: finite display mesh fits the existing CAD footprint without writing to it`,()=>{
    const item=Object.freeze({code,x:35.7,y:41.2,width,height,rotation:0});
    const before=JSON.stringify(item),faces=models.build(item),points=faces.flatMap(f=>f.points);
    assert.ok(photo.matches(item));assert.ok(models.matches(item));assert.ok(photo.matches({code:` ${code.toLowerCase()} `}));
    assert.equal(JSON.stringify(item),before);assert.ok(faces.length>200);
    assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
    for(const [x,y,z] of points){
      assert.ok(x>=item.x-1e-9 && x<=item.x+width+1e-9,`x ${x}`);
      assert.ok(y>=item.y-1e-9 && y<=item.y+height+1e-9,`y ${y}`);
      assert.ok(z>=-1e-9 && z<=photo.height(item)+1e-9,`z ${z}`);
    }
    assert.equal(models.rotationOffset(item),0);
    assert.ok(faces.every(f=>f.part && /^#[0-9a-f]{6}$/i.test(f.color)));
    assert.ok(!faces.some(f=>/foam|stock|cart|mould|material|person|car-/.test(f.part)));
  });
  test(`${code}: every component follows 2D translation, center rotation and plan-only scaling`,()=>{
    const item={code,x:0,y:0,width,height,rotation:0},base=models.build(item);
    const moved=models.build({...item,x:8.3,y:-2.7}),scaled=models.build({...item,width:width*1.5,height:height*1.25});
    for(const rotation of [-90,33,90,180]){
      const turned=models.build({...item,rotation}),a=rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
      base.forEach((face,i)=>face.points.forEach((p,j)=>{
        const q=turned[i].points[j],m=moved[i].points[j],r=scaled[i].points[j],u=p[0]-width/2,v=p[1]-height/2;
        near(q[0],width/2+u*c-v*s);near(q[1],height/2+u*s+v*c);near(q[2],p[2]);
        near(m[0],p[0]+8.3);near(m[1],p[1]-2.7);near(m[2],p[2]);
        near(r[0],p[0]*1.5);near(r[1],p[1]*1.25);near(r[2],p[2]);
      }));
    }
    assert.equal(JSON.stringify(models.build(item)),JSON.stringify(base));
  });
}
test('new models remain available after equipment label edits via photoModelCode',()=>{
  for(const [code,[width,height]] of Object.entries(sizes)){
    assert.equal(JSON.stringify(models.build({code:'renamed',photoModelCode:code,width,height})),JSON.stringify(models.build({code,width,height})));
  }
  assert.equal(JSON.stringify(models.build({code:'G2-1',width:2.4,height:4.19,rotation:0})),previous);
  assert.equal(models.build({code:'EVA 3',width:5,height:15}),null);
  assert.equal(models.build({code:'P1-2',width:5,height:4}),null,'unresolved handwritten P1-2 is not silently remapped');
});
test('PL-1 and PL-2 are open steel racks with fixed shelves and end bracing',()=>{
  for(const code of ['PL-1','PL-2']){
    const [width,height]=sizes[code],faces=models.build({code,width,height});
    for(const part of ['rack-upright','rack-long-beam','rack-cross-beam','rack-diagonal','rack-fixed-deck'])assert.ok(faces.some(f=>f.part===part));
    assert.ok(faces.every(f=>f.part.startsWith('rack-')));
    assert.ok(!faces.some(f=>f.points.every(p=>p[2]>3) && Math.max(...f.points.map(p=>p[0]))-Math.min(...f.points.map(p=>p[0]))>width/2 && Math.max(...f.points.map(p=>p[1]))-Math.min(...f.points.map(p=>p[1]))>height/2),'no large solid stock block');
  }
});
test('J1-3 and confirmed MANUAL L4-1 have distinct photo structures',()=>{
  const j=models.build({code:'J1-3',width:4,height:3.4}),l=models.build({code:'L4-1',width:3.25,height:3});
  for(const part of ['wood-extension','orange-side-cover','dark-header','guide-fence','control-pedestal'])assert.ok(j.some(f=>f.part===part));
  for(const part of ['vented-base-cabinet','four-guide-post','round-adjustment-cap','red-vent-side-cover','exposed-chain-link','lamp-frame'])assert.ok(l.some(f=>f.part===part));
  assert.equal(l.filter(f=>f.part==='four-guide-post').length,4*18);
  assert.ok(!l.some(f=>/hydraulic|conveyor|fence/.test(f.part)));
  assert.notEqual(JSON.stringify(j),JSON.stringify(models.build({code:'J1-2',width:4,height:3.4})));
});
test('D1-1 rising discharge and Welding roller discharge are not interchangeable',()=>{
  const d=models.build({code:'D1-1',width:12,height:4}),w=models.build({code:'Welding',width:5,height:4});
  const belt=d.find(f=>f.part==='rising-discharge-belt');assert.ok(belt);
  near(belt.points[0][2],2.55);near(belt.points[1][2],1.45);assert.ok(belt.points[0][0]<belt.points[1][0]);
  assert.ok(d.some(f=>f.part==='feed-belt'));assert.ok(d.some(f=>f.part==='red-flywheel'));
  assert.ok(!w.some(f=>f.part==='rising-discharge-belt'));
  for(const part of ['pneumatic-cylinder','wood-feed-table','fixed-discharge-roller','red-handwheel'])assert.ok(w.some(f=>f.part===part));
  for(const code of ['D1-1','WELDING']){
    const [width,height]=sizes[code],base=photo.markers({code,width,height}),turned=photo.markers({code,width,height,rotation:180});
    assert.equal(base.length,2);assert.ok(base[0].point[0]>base[1].point[0]);
    base.forEach((marker,i)=>{near(turned[i].point[0],width-marker.point[0]);near(turned[i].point[1],height-marker.point[1]);near(turned[i].point[2],marker.point[2]);});
  }
});
test('withdrawn D1-2 model cannot reappear or silently alias the confirmed Welding machine',()=>{
  for(const item of [{code:'D1-2'},{code:'renamed',photoModelCode:'D1-2'}]){
    const record=Object.freeze({...item,id:'user-record',x:5,y:7,width:3.6,height:8,rotation:90});
    const before=JSON.stringify(record);
    assert.equal(photo.matches(record),false);assert.equal(models.matches(record),false);
    assert.equal(photo.build(record),null);assert.equal(models.build(record),null);
    assert.equal(photo.height(record),null);assert.deepEqual(Array.from(photo.markers(record)),[]);
    assert.equal(JSON.stringify(record),before,'withdraw presentation only; do not delete or rename user CAD records');
  }
  const welding=models.build({code:'Welding',width:5,height:4});
  for(const part of ['wood-feed-table','pneumatic-cylinder','red-side-cover','fixed-discharge-roller'])assert.ok(welding.some(f=>f.part===part));
  assert.ok(!welding.some(f=>/d12-|cart|stock|material/.test(f.part)));
  const renderer=read('digital-twin.js');
  assert.ok(!renderer.includes('d12Photo'));
  assert.match(renderer,/綠色板車/);assert.match(renderer,/不將錯誤D1-2模型改名套用/);
});
test('vertical D1-1 and Welding footprints fit the process axis to the long side before rigid CAD rotation',()=>{
  for(const [code,width,height] of [['D1-1',4.2,12.09],['WELDING',4.2,9]]){
    const faces=models.build({code,width,height,x:0,y:0}),points=faces.flatMap(f=>f.points),marks=photo.markers({code,width,height});
    assert.ok(points.every(([x,y])=>x>=-1e-9 && x<=width+1e-9 && y>=-1e-9 && y<=height+1e-9));
    near(marks[0].point[0],marks[1].point[0]);assert.ok(marks[0].point[1]>marks[1].point[1]);
    const turned=models.build({code,width,height,rotation:90});
    faces.forEach((face,i)=>face.points.forEach((p,j)=>{
      near(turned[i].points[j][0],width/2-(p[1]-height/2));
      near(turned[i].points[j][1],height/2+(p[0]-width/2));
      near(turned[i].points[j][2],p[2]);
    }));
    const feed=faces.filter(f=>f.part===(code==='D1-1'?'feed-belt':'wood-feed-table'));
    assert.ok(feed.every(f=>f.points.every(p=>p[1]>height*.70)));
  }
});
test('runtime loads the new module before old model dispatch, and ships it in the static build',()=>{
  const html=read('index.html');assert.ok(html.indexOf('src="photo-models.js')<html.indexOf('src="twin-models.js'));
  assert.ok(html.indexOf('src="twin-models.js')<html.indexOf('src="digital-twin.js'));
  assert.match(read('build.mjs'),/"photo-models\.js"/);
  const renderer=read('digital-twin.js');
  for(const key of ['rackPhoto','j13Photo','d11Photo','weldingPhoto','l41Photo','eva3Deferred','photoSiteNote']){
    assert.ok(renderer.includes(`zh.${key}=`));assert.ok(renderer.includes(`th.${key}=`));
  }
  assert.match(renderer,/ChinChunPhotoModels\?\.height\(s\.item\)/);
  assert.match(renderer,/ChinChunPhotoModels\?\.markers\(s\.item\)/);
  assert.ok(!/localStorage|supabase|fetch\(|\.setItem\(|\.rotation\s*=|\.x\s*=|\.y\s*=/.test(read('photo-models.js')));
});
