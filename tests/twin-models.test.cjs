const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../twin-models.js');
const models=window.ChinChunModels;
const qc3={id:'eq_qc3_b1_3',code:'B1-3',x:60.53,y:15.18,width:2.2,height:5,rotation:0};
test('J1-2 photo model preserves its CAD record and fits its existing footprint',()=>{
  const item=Object.freeze({id:'eq_vcut1_j1_2',code:'J1-2',x:75.25,y:35.34,width:4.45,height:4.57,rotation:0});
  const before=JSON.stringify(item),faces=models.build(item),points=faces.flatMap(f=>f.points);
  assert.ok(models.matches(item));assert.ok(models.matches({code:' j1-2 '}));
  assert.equal(JSON.stringify(item),before);assert.equal(models.rotationOffset(item),0);
  assert.ok(faces.length>600);
  assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
  assert.ok(points.every(([x,y,z])=>x>=item.x-1e-9 && x<=item.x+item.width+1e-9 && y>=item.y-1e-9 && y<=item.y+item.height+1e-9 && z>=0 && z<=2.30+1e-9));
  assert.equal(Math.min(...points.map(p=>p[2])),0);
  assert.ok(Math.abs(Math.max(...points.map(p=>p[2]))-2.30)<1e-9);
  for(const color of ['#ded7bd','#b8c4c4','#e8e5d5','#675346','#356e62','#303b3d'])assert.ok(faces.some(f=>f.color===color));
  for(const code of ['J1-1','J1-3'])assert.equal(models.build({...item,code}),null,'other J machines are not changed');
});
test('J1-2 has two fixed work surfaces, a wooden edge and an open cutting throat without foam',()=>{
  const faces=models.build({code:'J1-2',x:0,y:0,width:4.45,height:4.57});
  const tops=faces.filter(f=>f.color==='#e8e5d5' && f.points.every(p=>Math.abs(p[2]-.995)<1e-9));
  assert.equal(tops.length,2);
  assert.ok(tops.every(f=>Math.max(...f.points.map(p=>p[1]))-Math.min(...f.points.map(p=>p[1]))>3.6));
  const wood=faces.filter(f=>f.color==='#675346');
  assert.equal(wood.length,6);assert.ok(wood.every(f=>f.points.every(p=>p[0]>=3.84-1e-9 && p[2]<=1.002+1e-9)));
  const beam=faces.filter(f=>f.color==='#ded7bd' && f.points.length===8);
  assert.equal(beam.length,2);
  assert.ok(beam.every(f=>f.points.some(p=>Math.abs(p[0]-1.20)<1e-9 && Math.abs(p[2]-1.67)<1e-9)));
  assert.ok(!faces.some(f=>['#329cba','#2d527e','#272a31','#53565b','#62696b'].includes(f.color)),'no foam or blue pallet');
});
test('J1-2 rotates about its CAD center and rescales only its plan dimensions',()=>{
  const item={code:'J1-2',x:0,y:0,width:4.45,height:4.57},original=models.build(item),resized=models.build({...item,width:8.9,height:6.855});
  for(const rotation of [90,-90,180]) {
    const turned=models.build({...item,rotation}),a=rotation*Math.PI/180;
    original.forEach((face,i)=>face.points.forEach((p,j)=>{
      const q=turned[i].points[j],r=resized[i].points[j];
      assert.ok(Math.abs(q[0]-(2.225+(p[0]-2.225)*Math.cos(a)-(p[1]-2.285)*Math.sin(a)))<1e-9);
      assert.ok(Math.abs(q[1]-(2.285+(p[0]-2.225)*Math.sin(a)+(p[1]-2.285)*Math.cos(a)))<1e-9);
      assert.equal(q[2],p[2]);assert.equal(r[2],p[2]);
      assert.ok(Math.abs(r[0]-2*p[0])<1e-9 && Math.abs(r[1]-1.5*p[1])<1e-9);
    }));
  }
});
test('Q2-3 has its own narrow photo model without mutating its CAD footprint',()=>{
  const item=Object.freeze({code:'Q2-3',x:11.55,y:25.18,width:2.65,height:4,rotation:0});
  const before=JSON.stringify(item),faces=models.build(item),points=faces.flatMap(f=>f.points);
  assert.ok(models.matches(item));assert.ok(models.matches({code:' q2-3 '}));
  assert.equal(JSON.stringify(item),before);
  assert.ok(faces.length>700);
  assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
  const cx=item.x+item.width/2,cy=item.y+item.height/2;
  assert.ok(points.every(([x,y,z])=>x>=cx-2-1e-9 && x<=cx+2+1e-9 && y>=cy-1.325-1e-9 && y<=cy+1.325+1e-9 && z>=0 && z<=2.30+1e-9));
  assert.equal(Math.min(...points.map(p=>p[2])),0);
  assert.ok(Math.abs(Math.max(...points.map(p=>p[2]))-2.30)<1e-9);
  for(const color of ['#dcd5b9','#927755','#329cba','#c56b32','#547d8d','#f2f0d8'])assert.ok(faces.some(f=>f.color===color));
  for(const code of ['Q2-1','Q2-2'])assert.notDeepEqual(faces,models.build({...item,code}));
  assert.ok(!faces.some(f=>['#2d527e','#272a31','#53565b','#62696b'].includes(f.color)),'no blue QA 2 rolls or foam material');
});
test('Q2-3 exposes an empty right stock axle and guide bed, not the foam coil or adjacent green machine',()=>{
  // Cancel the calibration only to inspect the original component coordinates.
  const faces=models.build({code:'Q2-3',x:0,y:0,width:4,height:2.65,rotation:90});
  const stock=faces.filter(f=>f.points.every(p=>Math.abs(p[0]-3.29)<=.033+1e-9 && Math.abs(p[2]-1.38)<=.033+1e-9) && f.color==='#b9c3c3');
  assert.equal(stock.length,22);
  const floor=faces.filter(f=>f.color==='#329cba');
  assert.ok(floor.every(f=>f.points.every(p=>p[2]<=.28+1e-9)),'blue surface stays at floor level');
  assert.ok(!faces.some(f=>Math.min(...f.points.map(p=>p[0]))<1.5 && Math.max(...f.points.map(p=>p[0]))>2.2 && Math.min(...f.points.map(p=>p[1]))<.5 && Math.max(...f.points.map(p=>p[1]))>1.9 && f.points.every(p=>p[2]>.8)),'no continuous material web');
  assert.ok(!faces.some(f=>['#297452','#2f734c','#32784f'].includes(f.color)),'neighbouring green drums excluded');
});
test('Q2-3 keeps its original feed and discharge components while turning the whole previous model CCW 90 degrees',()=>{
  const item={code:'Q2-3',x:11.55,y:25.18,width:2.65,height:4,rotation:90};
  const faces=models.build(item),stockX=item.x+item.width*3.29/4;
  const stock=faces.filter(f=>f.color==='#b9c3c3' && f.points.every(p=>Math.abs(p[0]-stockX)<=item.width*.033/4+1e-9 && Math.abs(p[2]-1.38)<=.033+1e-9));
  assert.equal(stock.length,22);
  assert.ok(stock.every(f=>f.points.every(p=>p[0]>item.x+item.width*.75)));
  // Full-width caps of the two permanent discharge drums must be at local left.
  for(const [y,z,r] of [[.55,.98,.115],[.91,1.01,.10]]) {
    const center=item.x+item.width*y/4;
    const parts=faces.filter(f=>f.color==='#b9c3c3' && f.points.every(p=>Math.abs(p[0]-center)<=item.width*r/4+1e-9 && Math.abs(p[2]-z)<=r+1e-9));
    assert.equal(parts.length,52);
    assert.ok(parts.every(f=>f.points.every(p=>p[0]<item.x+item.width*.30)));
  }
});
test('Q2-3 rotates around its CAD center and resizes only in plan',()=>{
  const item={code:'Q2-3',x:0,y:0,width:2.65,height:4},original=models.build(item),resized=models.build({...item,width:5.3,height:6});
  for(const rotation of [90,-90,180]) {
    const turned=models.build({...item,rotation}),a=rotation*Math.PI/180;
    original.forEach((face,i)=>face.points.forEach((p,j)=>{
      const q=turned[i].points[j],r=resized[i].points[j];
      assert.ok(Math.abs(q[0]-(1.325+(p[0]-1.325)*Math.cos(a)-(p[1]-2)*Math.sin(a)))<1e-9);
      assert.ok(Math.abs(q[1]-(2+(p[0]-1.325)*Math.sin(a)+(p[1]-2)*Math.cos(a)))<1e-9);
      assert.equal(q[2],p[2]);
      assert.ok(Math.abs(r[0]-(2.65+1.5*(p[0]-1.325)))<1e-9 && Math.abs(r[1]-(3+2*(p[1]-2)))<1e-9);
      assert.equal(r[2],p[2]);
    }));
  }
});
test('Q2-3 CCW calibration is a rigid center rotation, not a mirror or nonuniform squeeze',()=>{
  const item=Object.freeze({code:'Q2-3',x:11.55,y:25.18,width:2.65,height:4,rotation:0});
  assert.equal(models.rotationOffset(item),-90);
  for(const code of ['Q2-1','Q2-2','E1-1','B1-1'])assert.equal(models.rotationOffset({code}),0);
  const corrected=models.build(item),previous=models.build({...item,rotation:90});
  const cx=item.x+item.width/2,cy=item.y+item.height/2;
  previous.forEach((face,i)=>face.points.forEach((p,j)=>{
    const q=corrected[i].points[j];
    assert.ok(Math.abs(q[0]-(cx+p[1]-cy))<1e-9);
    assert.ok(Math.abs(q[1]-(cy-p[0]+cx))<1e-9);
    assert.equal(q[2],p[2]);
    assert.ok(Math.abs(Math.hypot(q[0]-cx,q[1]-cy)-Math.hypot(p[0]-cx,p[1]-cy))<1e-9);
  }));
});
test('Q2-1/2 preserve their CAD records and have distinct photo structures',()=>{
  for(const [code,x,y] of [['Q2-1',23.95,22.94],['Q2-2',23.91,19.89]]) {
    const item=Object.freeze({code,x,y,width:4,height:2.65,rotation:0});
    const before=JSON.stringify(item),faces=models.build(item),points=faces.flatMap(f=>f.points);
    assert.ok(models.matches(item));
    assert.ok(models.matches({code:` ${code.toLowerCase()} `}));
    assert.equal(JSON.stringify(item),before);
    assert.ok(faces.length>700);
    assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
    assert.ok(points.every(([px,py,z])=>px>=x-1e-9 && px<=x+4+1e-9 && py>=y-1e-9 && py<=y+2.65+1e-9 && z>=0 && z<=2.35+1e-9));
    assert.equal(Math.min(...points.map(p=>p[2])),0);
    assert.ok(Math.abs(Math.max(...points.map(p=>p[2]))-2.35)<1e-9);
    assert.notDeepEqual(faces,models.build({...item,code:code==='Q2-1'?'Q2-2':'Q2-1'}));
    for(const color of ['#dcd5b9','#927755','#c56b32','#329cba','#f2f0d8'])assert.ok(faces.some(f=>f.color===color));
    assert.ok(!faces.some(f=>['#272a31','#53565b','#62696b'].includes(f.color)),'no foam sheet or stock rolls');
  }
  assert.equal(models.build({code:'Q2-4'}),null,'unphotographed machines are unchanged');
});
test('Q2-2 has two blue driven rolls and an open bed, unlike closed-base Q2-1',()=>{
  const item={x:0,y:0,width:4,height:2.65};
  const open=models.build({...item,code:'Q2-2'}),closed=models.build({...item,code:'Q2-1'});
  const drums=open.filter(f=>f.color==='#2d527e');
  assert.equal(drums.length,68);
  assert.ok(!closed.some(f=>f.color==='#2d527e'));
  for(const x of [.43,.88]) {
    const parts=drums.filter(f=>f.points.every(p=>Math.abs(p[0]-x)<=.17+1e-9));
    assert.equal(parts.length,34);
    assert.ok(parts.every(f=>f.points.every(p=>p[1]>=.32-1e-9 && p[1]<=2.16+1e-9 && Math.abs(p[2]-.99)<=.17+1e-9)));
  }
  const cabinet=faces=>faces.some(f=>f.points.some(p=>Math.abs(p[2]-.23)<1e-9) && f.points.some(p=>Math.abs(p[2]-.74)<1e-9) && f.points.every(p=>p[0]>=.13-1e-9 && p[0]<=2.66+1e-9));
  assert.equal(cabinet(open),false);
  assert.equal(cabinet(closed),true);
  // No broad foam face bridging guide rolls or hanging from the front drums.
  for(const faces of [open,closed])assert.ok(!faces.some(f=>Math.min(...f.points.map(p=>p[0]))<1.4 && Math.max(...f.points.map(p=>p[0]))>2.4 && Math.min(...f.points.map(p=>p[1]))<.5 && Math.max(...f.points.map(p=>p[1]))>2 && f.points.every(p=>p[2]>.9)));
});
test('both Q2 variants rotate about their CAD center and scale only in plan',()=>{
  for(const code of ['Q2-1','Q2-2']) {
    const item={code,x:0,y:0,width:4,height:2.65},original=models.build(item),resized=models.build({...item,width:6,height:5.3});
    for(const rotation of [90,-90,180]) {
      const turned=models.build({...item,rotation}),a=rotation*Math.PI/180;
      original.forEach((face,i)=>face.points.forEach((p,j)=>{
        const q=turned[i].points[j],r=resized[i].points[j];
        assert.ok(Math.abs(q[0]-(2+(p[0]-2)*Math.cos(a)-(p[1]-1.325)*Math.sin(a)))<1e-9);
        assert.ok(Math.abs(q[1]-(1.325+(p[0]-2)*Math.sin(a)+(p[1]-1.325)*Math.cos(a)))<1e-9);
        assert.equal(q[2],p[2]);
        assert.ok(Math.abs(r[0]-1.5*p[0])<1e-9 && Math.abs(r[1]-2*p[1])<1e-9);
        assert.equal(r[2],p[2]);
      }));
    }
  }
});
test('E1-1 and E1-2 retain independent CAD footprints and use photo-based press geometry',()=>{
  for(const [code,y,depth] of [['E1-1',36.28,1.99],['E1-2',30.77,2]]) {
    const item=Object.freeze({code,x:81.19,y,width:5.03,height:depth,rotation:0});
    const before=JSON.stringify(item),faces=models.build(item),points=faces.flatMap(f=>f.points);
    assert.ok(models.matches(item));
    assert.ok(models.matches({code:` ${code.toLowerCase()} `}));
    assert.equal(JSON.stringify(item),before);
    assert.ok(faces.length>1000);
    assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
    assert.ok(points.every(([x,py,z])=>x>=item.x-1e-9 && x<=item.x+item.width+1e-9 && py>=y-1e-9 && py<=y+depth+1e-9 && z>=0 && z<=3));
    assert.equal(Math.min(...points.map(p=>p[2])),0);
    assert.equal(Math.max(...points.map(p=>p[2])),3);
    for(const color of ['#328eaa','#285e88','#c56b32','#d8d5c8','#b9c3c3'])
      assert.ok(faces.some(f=>f.color===color),`missing ${code} photo feature ${color}`);
    assert.deepEqual(faces,models.build({...item,code:code==='E1-1'?'E1-2':'E1-1'}));
    assert.ok(!faces.some(f=>['#272a31','#53565b','#a07549'].includes(f.color)),'no foam or surrounding wooden tables');
  }
});
test('E1 pair has two separate conveyor belts, an open press throat and central-only hydraulic assembly',()=>{
  const faces=models.build({code:'E1-1',x:0,y:0,width:5.03,height:2});
  const belt=faces.filter(f=>f.color==='#d8d5c8');
  assert.ok(belt.length>0);
  assert.ok(belt.every(f=>f.points.every(p=>p[0]<=1.94+1e-9) || f.points.every(p=>p[0]>=3.06-1e-9)),'no belt or material web across press throat');
  const upper=faces.filter(f=>f.color==='#328eaa' || f.color==='#285e88');
  assert.ok(upper.every(f=>f.points.every(([x,,z])=>x>=1.9 && x<=3.13 && z>=2.255 && z<=3)));
  // Exposed guide shafts at all four corners, not a solid box hiding the throat.
  for(const x of [1.99,2.97])for(const y of [.27,1.73]) {
    const shaft=faces.filter(f=>f.color==='#b9c3c3' && f.points.every(p=>Math.abs(p[0]-x)<=.052+1e-9 && Math.abs(p[1]-y)<=.052+1e-9));
    const points=shaft.flatMap(f=>f.points);
    assert.ok(points.some(p=>Math.abs(p[2]-.26)<1e-9));
    assert.ok(points.some(p=>Math.abs(p[2]-2.17)<1e-9));
  }
});
test('E1 pair scales in plan and rotates around the CAD center without changing height',()=>{
  const item={code:'E1-2',x:0,y:0,width:5.03,height:2};
  const original=models.build(item),resized=models.build({...item,width:10.06,height:3});
  for(const rotation of [90,-90,180]) {
    const turned=models.build({...item,rotation}),a=rotation*Math.PI/180;
    original.forEach((face,i)=>face.points.forEach((p,j)=>{
      const q=turned[i].points[j],r=resized[i].points[j];
      assert.ok(Math.abs(q[0]-(2.515+(p[0]-2.515)*Math.cos(a)-(p[1]-1)*Math.sin(a)))<1e-9);
      assert.ok(Math.abs(q[1]-(1+(p[0]-2.515)*Math.sin(a)+(p[1]-1)*Math.cos(a)))<1e-9);
      assert.equal(q[2],p[2]);
      assert.ok(Math.abs(r[0]-2*p[0])<1e-9 && Math.abs(r[1]-1.5*p[1])<1e-9);
      assert.equal(r[2],p[2]);
    }));
  }
});
test('B1-1 and B1-2 use the new shared photo structure, retaining independent CAD records',()=>{
  for(const [code,x,y] of [['B1-1',70.59,15.13],['B1-2',66.63,15.10]]) {
    const item=Object.freeze({code,x,y,width:2.85,height:5,rotation:0});
    const before=JSON.stringify(item),faces=models.build(item),points=faces.flatMap(f=>f.points);
    assert.ok(models.matches(item));
    assert.ok(models.matches({code:` ${code.toLowerCase()} `}));
    assert.equal(JSON.stringify(item),before);
    assert.ok(faces.length>700);
    assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
    assert.ok(points.every(p=>p[0]>=x-1e-9 && p[0]<=x+2.85+1e-9 && p[1]>=y-1e-9 && p[1]<=y+5+1e-9 && p[2]>=0 && p[2]<=2.3));
    assert.equal(Math.min(...points.map(p=>p[2])),0);
    assert.equal(Math.max(...points.map(p=>p[2])),2.3);
    for(const color of ['#62696b','#c8d2d3','#bb632f','#a07549','#454d56','#f2f0d8'])
      assert.ok(faces.some(f=>f.color===color),`missing ${code} feature ${color}`);
    assert.notDeepEqual(faces,models.build({...item,code:'B1-3'}));
    assert.deepEqual(faces,models.build({...item,code:code==='B1-1'?'B1-2':'B1-1'}));
    assert.ok(!faces.some(f=>['#272a31','#53565b'].includes(f.color)),'no foam material palette');
  }
});
test('B1-1/2 have two fixed grey rolls plus a polished roll, with an open guide bed',()=>{
  const faces=models.build({code:'B1-1',x:0,y:0,width:2.85,height:5});
  for(const [y,z,r,color] of [[.60,.94,.22,'#62696b'],[1.16,.99,.21,'#62696b'],[1.70,1.02,.20,'#c8d2d3']]) {
    const parts=faces.filter(f=>f.color===color && Math.abs(f.points.reduce((sum,p)=>sum+p[1],0)/f.points.length-y)<=r+1e-9);
    assert.equal(parts.length,34);
    const points=parts.flatMap(f=>f.points);
    assert.ok(Math.abs(Math.min(...points.map(p=>p[0]))-.31)<1e-9);
    assert.ok(Math.abs(Math.max(...points.map(p=>p[0]))-2.47)<1e-9);
    assert.ok(points.every(p=>Math.abs(p[1]-y)<=r+1e-9 && Math.abs(p[2]-z)<=r+1e-9));
  }
  // No continuous foam web or invented table covering the guide-roll region.
  assert.ok(!faces.some(f=>Math.min(...f.points.map(p=>p[0]))<.5 && Math.max(...f.points.map(p=>p[0]))>2.3 && Math.min(...f.points.map(p=>p[1]))<2.4 && Math.max(...f.points.map(p=>p[1]))>3.4));
});
test('B1-1/2 rotate around their own centers and scale only in plan',()=>{
  const item={code:'B1-2',x:0,y:0,width:2.85,height:5};
  const original=models.build(item),resized=models.build({...item,width:5.7,height:7.5});
  for(const rotation of [90,-90,180]) {
    const turned=models.build({...item,rotation}),a=rotation*Math.PI/180;
    original.forEach((face,i)=>face.points.forEach((p,j)=>{
      const q=turned[i].points[j],r=resized[i].points[j];
      assert.ok(Math.abs(q[0]-(1.425+(p[0]-1.425)*Math.cos(a)-(p[1]-2.5)*Math.sin(a)))<1e-9);
      assert.ok(Math.abs(q[1]-(2.5+(p[0]-1.425)*Math.sin(a)+(p[1]-2.5)*Math.cos(a)))<1e-9);
      assert.equal(q[2],p[2]);
      assert.ok(Math.abs(r[0]-2*p[0])<1e-9 && Math.abs(r[1]-1.5*p[1])<1e-9);
      assert.equal(r[2],p[2]);
    }));
  }
});
test('B1-4 shares the B1-3 machine without changing its own CAD dimensions or rotation',()=>{
  const item=Object.freeze({id:'eq_qc4_b1_4',code:'B1-4',x:56.97,y:15.22,width:2.35,height:5,rotation:90});
  const before=JSON.stringify(item),faces=models.build(item);
  assert.ok(models.matches(item));
  assert.ok(models.matches({code:' b1-4 '}));
  assert.deepEqual(faces,models.build({...item,code:'B1-3'}));
  assert.equal(JSON.stringify(item),before);
  const unrotated=models.build({...item,rotation:0});
  const cx=item.x+item.width/2,cy=item.y+item.height/2;
  unrotated.forEach((face,i)=>face.points.forEach((p,j)=>{
    const q=faces[i].points[j];
    assert.ok(p[0]>=item.x-1e-9 && p[0]<=item.x+item.width+1e-9);
    assert.ok(p[1]>=item.y-1e-9 && p[1]<=item.y+item.height+1e-9);
    assert.ok(Math.abs(q[0]-(cx-(p[1]-cy)))<1e-9);
    assert.ok(Math.abs(q[1]-(cy+(p[0]-cx)))<1e-9);
    assert.equal(q[2],p[2]);
  }));
  assert.equal(Math.max(...faces.flatMap(f=>f.points.map(p=>p[2]))),2.3);
});
test('B1-3 uses its own photo model without changing CAD or adding adjacent equipment',()=>{
  const item=Object.freeze({...qc3}),before=JSON.stringify(item);
  const faces=models.build(item),points=faces.flatMap(f=>f.points);
  assert.ok(models.matches(item));
  assert.ok(models.matches({code:' b1-3 '}));
  assert.ok(faces.length>500);
  assert.equal(JSON.stringify(item),before);
  assert.equal(models.build({...item,code:'B1-5'}),null);
  assert.ok(points.every(p=>p.length===3 && p.every(Number.isFinite)));
  assert.ok(points.every(([x,y,z])=>x>=qc3.x-1e-9 && x<=qc3.x+qc3.width+1e-9 && y>=qc3.y-1e-9 && y<=qc3.y+qc3.height+1e-9 && z>=0 && z<=2.3));
  assert.equal(Math.min(...points.map(p=>p[2])),0);
  assert.equal(Math.max(...points.map(p=>p[2])),2.3);
  for(const color of ['#dcd5b9','#62696b','#927755','#b9c3c3','#454d56','#f2f0d8'])
    assert.ok(faces.some(f=>f.color===color),`missing QC photo feature ${color}`);
  assert.ok(!faces.some(f=>['#bc3326','#c96532','#272a31','#53565b'].includes(f.color)), 'no neighbouring orange control box or foam material');
});
test('B1-3 has two attached full-width grey machine rollers, not a material roll',()=>{
  const faces=models.build({...qc3,x:0,y:0});
  const rolls=faces.filter(f=>f.color==='#62696b');
  const front=rolls.filter(f=>f.points.reduce((sum,p)=>sum+p[1],0)/f.points.length<.85);
  const back=rolls.filter(f=>!front.includes(f));
  for(const [parts,y,z,r] of [[front,.59,.88,.19],[back,1.12,.89,.18]]) {
    const points=parts.flatMap(f=>f.points);
    assert.equal(parts.length,34);
    assert.ok(Math.abs(Math.min(...points.map(p=>p[0]))-.24)<1e-9);
    assert.ok(Math.abs(Math.max(...points.map(p=>p[0]))-1.96)<1e-9);
    assert.ok(points.every(p=>Math.abs(p[1]-y)<=r+1e-9 && Math.abs(p[2]-z)<=r+1e-9));
  }
});
test('B1-3 rotates about the CAD center and scales only in plan',()=>{
  const item={...qc3,x:0,y:0};
  const original=models.build(item),turned=models.build({...item,rotation:90});
  const resized=models.build({...item,width:4.4,height:7.5});
  original.forEach((face,i)=>face.points.forEach((p,j)=>{
    const q=turned[i].points[j],r=resized[i].points[j];
    assert.ok(Math.abs(q[0]-(1.1-(p[1]-2.5)))<1e-9);
    assert.ok(Math.abs(q[1]-(2.5+(p[0]-1.1)))<1e-9);
    assert.equal(q[2],p[2]);
    assert.ok(Math.abs(r[0]-2*p[0])<1e-9);
    assert.ok(Math.abs(r[1]-1.5*p[1])<1e-9);
    assert.equal(r[2],p[2]);
  }));
});
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
