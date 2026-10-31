const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
let adapter,THREE;
before(async()=>{adapter=await import('../three-twin.mjs');THREE=await import('three');});
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));
const near=(a,b,epsilon=1e-7)=>assert.ok(Math.abs(a-b)<epsilon,`${a} vs ${b}`);
const freeze=v=>{if(v && typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
function loadModels(){
  const window={};for(const file of ['photo-models.js','twin-models.js','building-geometry.js'])vm.runInNewContext(read(file),{window});
  return window;
}
function fixture(){
  const app=read('app.js'),start=app.indexOf('  const INITIAL_LAYOUT = '),end=app.indexOf('  const SOURCE_GEOMETRY_REVISION',start);
  const context={};vm.runInNewContext(app.slice(start,end)+'\nthis.layout=INITIAL_LAYOUT;',context);return plain(context.layout);
}
function setup(){
  const window=loadModels(),elements=new Map(),noop=()=>{};
  window.ChinChunThree={revision:'test'};
  const element=selector=>{if(!elements.has(selector))elements.set(selector,{textContent:'',value:'',hidden:false,setAttribute:noop,replaceChildren:noop,add:noop,getBoundingClientRect:()=>({left:970,top:220,width:260,height:360})});return elements.get(selector);};
  const dialog={open:false,querySelector:element};
  const ctx=new Proxy({measureText:text=>({width:String(text).length*7})},{get:(target,key)=>target[key] || noop});
  const canvas={getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
  const context={window,document:{documentElement:{lang:'zh-Hant'}},Option:function(){},console:{warn:noop},Path2D:class{moveTo(){}lineTo(){}closePath(){}},requestAnimationFrame:noop};
  const source=read('digital-twin.js'),marker='})();';
  const probe=`window.__test={
    prepare(d,ui,c,x){dialog=ui;canvas=c;ctx=x;width=1280;height=720;engineMode='legacy';data=d;rebuild();},
    layout:d=>{data=d;rebuild();}, floor:f=>{floor=f;rebuild();}, scene:()=>scene,
    select:(id,close=false)=>{selected=scene.find(s=>s.item.id===id)||null;detail=close;},
    faces:()=>{allFaces=true;try{return scene.filter(s=>s.type!=='aisle').flatMap(objectFaces);}finally{allFaces=false;}},
    ground:()=>threeGroundFaces(scene,bounds),
    flags:(roof,cutaway)=>{buildingRoof=roof;restroomCutaway=cutaway;},
    three:v=>{engineMode='three';threeView=v;threeSceneCache=null;},
    draw:()=>drawThree(detail&&selected?[selected]:scene,viewBounds(),1),
    orbit,tilt,cameraKey,cameraWheel,fit,resetView,startThree,switchEngine,
    cache:()=>threeSceneCache,mode:()=>engineMode,error:()=>engineError
  };`;
  vm.runInNewContext(source.trimEnd().slice(0,-marker.length)+probe+marker,context);
  return {window,api:window.__test,elements,dialog,ctx,canvas,prepare(d){window.__test.prepare(d,dialog,canvas,ctx);}};
}

test('CAD-to-Three coordinate conversion roundtrips without changing distances or elevations',()=>{
  for(const p of [[0,0,0],[35,40,1],[100,59,1.5],[-6,3,4.4]])assert.deepEqual(adapter.toCad(adapter.toWorld(p)),p);
  assert.deepEqual(adapter.toWorld([35,40,1]),[35,1,40]);
  const a=[2,3,4],b=[7,-2,1],worldA=adapter.toWorld(a),worldB=adapter.toWorld(b);
  near(Math.hypot(...a.map((n,i)=>n-b[i])),Math.hypot(...worldA.map((n,i)=>n-worldB[i])));
});
test('standard Three camera reproduces the established CAD left/right and plan orientation',()=>{
  const camera=adapter.createCamera(),target=new THREE.Vector3();
  camera.left=-16;camera.right=16;camera.top=10;camera.bottom=-10;camera.updateProjectionMatrix();
  for(const yaw of [0,.37,Math.PI/2,Math.PI,Math.PI*1.8])for(const pitch of [.5,.7,1.05]){
    adapter.setOrientation(camera,target,yaw,pitch);
    const origin=adapter.projectPoint(camera,[0,0,0],1600,1000);
    for(const [x,y,z] of [[1,0,0],[0,1,0],[0,0,1],[5,3,2]]){
      const p=adapter.projectPoint(camera,[x,y,z],1600,1000),u=x*Math.cos(yaw)-y*Math.sin(yaw),v=x*Math.sin(yaw)+y*Math.cos(yaw);
      near(p[0]-origin[0],50*(u-v)/Math.SQRT2);
      near(p[1]-origin[1],50*((u+v)*Math.sin(pitch)/Math.SQRT2-z*Math.cos(pitch)));
    }
  }
});
test('camera rotation changes view only, without changing zoom, frustum or model-space geometry',()=>{
  const camera=adapter.createCamera(),target=new THREE.Vector3(50,1,30),points=[[0,0,0],[100,40,1.5],[35,59,1]],before=JSON.stringify(points);
  adapter.setOrientation(camera,target);adapter.fitCamera(camera,target,new THREE.Box3(new THREE.Vector3(0,0,0),new THREE.Vector3(100,7,60)),16/9);
  const lens=[camera.left,camera.right,camera.top,camera.bottom,camera.zoom];
  for(let i=0;i<72;i++){
    adapter.setOrientation(camera,target,i*Math.PI/36,.45+i%5*.16);
    assert.deepEqual([camera.left,camera.right,camera.top,camera.bottom,camera.zoom],lens);
    const a=new THREE.Vector3(...adapter.toWorld(points[0])).applyMatrix4(camera.matrixWorldInverse),b=new THREE.Vector3(...adapter.toWorld(points[1])).applyMatrix4(camera.matrixWorldInverse);
    near(a.distanceTo(b),Math.hypot(100,40,1.5));
  }
  assert.equal(JSON.stringify(points),before);
});
test('fit and viewport aspect use equal pixel scale along both camera axes',()=>{
  for(const [width,height] of [[1280,720],[600,900],[1800,500]]){
    const camera=adapter.createCamera(),target=new THREE.Vector3();adapter.setOrientation(camera,target);
    adapter.fitCamera(camera,target,new THREE.Box3(new THREE.Vector3(0,0,0),new THREE.Vector3(100,7,60)),width/height);
    near(width/(camera.right-camera.left),height/(camera.top-camera.bottom));
    near(adapter.cameraAngles(camera,target).pitch,adapter.DEFAULT_PITCH);
  }
});
test('top view aligns CAD x right and y down, with equal scale rather than a diamond plan',()=>{
  const camera=adapter.createCamera(),target=new THREE.Vector3();
  camera.left=-16;camera.right=16;camera.top=10;camera.bottom=-10;camera.updateProjectionMatrix();
  adapter.setOrientation(camera,target,-Math.PI/4,Math.PI/2-.000001);
  const o=adapter.projectPoint(camera,[0,0,0],1600,1000),x=adapter.projectPoint(camera,[1,0,0],1600,1000),y=adapter.projectPoint(camera,[0,1,0],1600,1000);
  near(x[0]-o[0],50);near(x[1]-o[1],0);near(y[0]-o[0],0);near(y[1]-o[1],50);
});
test('concave portal polygons are triangulated without filling their opening',()=>{
  const points=freeze([[0,0,0],[3,0,0],[3,0,3],[2,0,3],[2,0,1],[1,0,1],[1,0,3],[0,0,3]]),before=JSON.stringify(points);
  const triangles=adapter.triangulateFace(points);assert.equal(triangles.length,6);
  const area=triangles.reduce((sum,ids)=>{const [a,b,c]=ids.map(i=>points[i]);return sum+Math.abs((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]))/2;},0);
  near(area,7);assert.equal(JSON.stringify(points),before);
  assert.deepEqual(adapter.triangulateFace([[0,0,0],[1,0,0],[2,0,0]]),[]);
});

const codes=['DIE CUT','WC-STALLS','H1-1','A1-1','A1-2','C1-1','F1-1','G2-1','G2-2','B1-1','B1-2','B1-3','B1-4','E1-1','E1-2','Q2-1','Q2-2','Q2-3','J1-2','J1-3','D1-1','Welding','L4-1','PL-1','PL-2'];
for(const code of codes)test(`${code}: all existing model geometry survives the Three.js adapter without a second rotation`,()=>{
  const window=loadModels(),item=freeze({id:code,code,x:13.2,y:41.4,width:6,height:4,rotation:37}),before=JSON.stringify(item);
  const faces=window.ChinChunModels.build(item);assert.ok(faces?.length>0);
  const original=JSON.stringify(faces),{geometry,lines}=adapter.geometryFromFaces(faces),box=geometry.boundingBox;
  const points=faces.flatMap(f=>f.points.map(adapter.toWorld));
  for(let i=0;i<3;i++){near(box.min.getComponent(i),Math.min(...points.map(p=>p[i])),1e-4);near(box.max.getComponent(i),Math.max(...points.map(p=>p[i])),1e-4);}
  assert.ok(geometry.attributes.position.count>100);assert.equal(JSON.stringify(item),before);assert.equal(JSON.stringify(faces),original);
  geometry.dispose();lines?.dispose();
});

test('full layout update keeps every 2D field and follows move, resize, rotation, rename and deletion',()=>{
  const test=setup(),layout=fixture();test.prepare(freeze(layout));const before=JSON.stringify(layout);
  assert.equal(test.api.scene().filter(s=>s.type==='equipment').length,layout.equipment.length);
  test.api.faces();test.api.ground();assert.equal(JSON.stringify(layout),before);
  const next=plain(layout),item=next.equipment.find(q=>q.code==='L4-1');
  item.x+=7;item.y+=2;item.width*=1.2;item.height*=1.1;item.rotation=90;item.photoModelCode='L4-1';item.code='新名稱';
  const id=item.id;test.api.layout(freeze(next));const s=test.api.scene().find(s=>s.item.id===id);
  assert.equal(s.item.code,'新名稱');assert.ok(s.model.length>500);near(s.points.reduce((sum,p)=>sum+p[0]/4,0),item.x+item.width/2);
  assert.equal(JSON.stringify(s.model),JSON.stringify(test.window.ChinChunModels.build(item)));
  const deleted=plain(next);deleted.equipment=deleted.equipment.filter(q=>q.id!==id);test.api.layout(freeze(deleted));assert.ok(!test.api.scene().some(s=>s.item.id===id));
  test.api.floor('2F');assert.equal(test.api.scene().filter(s=>s.type==='equipment').length,deleted.equipment_2f.length);
});
test('Three geometry includes every wall side, preserves aperture and the confirmed floor levels',()=>{
  const test=setup(),layout=test.window.ChinChunBuilding.apply(fixture());
  const die=layout.equipment.find(q=>q.code==='Die Cut'),l41=layout.equipment.find(q=>q.code==='L4-1');
  Object.assign(die,{x:l41.x-4,y:41,width:3.25,height:3,rotation:0});
  layout.walls.push({id:'opening-fixture',x1:l41.x-5,y1:40,x2:l41.x,y2:40,thickness:.2,floor:'1F'});
  const before=JSON.stringify(layout);test.prepare(freeze(layout));
  const faces=test.api.faces(),ground=test.api.ground(),slabHeights=new Set(ground.filter(f=>f.part==='ground' && f.points.every(p=>p[2]===f.points[0][2])).map(f=>f.points[0][2]));
  for(const z of [0,1,1.5])assert.ok(slabHeights.has(z));
  const connectedWall=test.window.ChinChunModels.dieCutSite(layout).wall.id;
  const walls=test.api.scene().filter(s=>s.type==='wall' && s.item.id.startsWith(connectedWall));
  assert.ok(walls.some(s=>s.zBase===1.6));assert.ok(walls.some(s=>s.z===.35));
  assert.ok(faces.some(f=>f.s?.type==='wall' && f.points.every(p=>p[0]===f.points[0][0])));
  assert.ok(faces.some(f=>f.s?.type==='wall' && f.points.every(p=>p[1]===f.points[0][1])));
  assert.equal(JSON.stringify(layout),before);
});
test('connecting ramp is selectable read-only site geometry in both engines and never a duplicate CAD machine',()=>{
  const test=setup(),layout=test.window.ChinChunBuilding.apply(fixture()),before=JSON.stringify(layout);
  test.prepare(freeze(layout));
  const ramp=test.api.scene().find(s=>s.item.id==='site_annex_connecting_ramp');assert.ok(ramp);assert.equal(ramp.type,'site');
  assert.equal(test.api.scene().filter(s=>s.type==='equipment').length,layout.equipment.length);
  const faces=test.api.faces().filter(f=>f.s===ramp);assert.ok(faces.length>6);
  const surface=faces.find(f=>f.part==='ramp-surface');assert.deepEqual(Array.from(surface.points,p=>p[2]),[1.5,1.5,1,1]);
  const {geometry}=adapter.geometryFromFaces(faces);near(geometry.boundingBox.min.y,1,1e-4);near(geometry.boundingBox.max.y,1.508,1e-4);geometry.dispose();
  test.api.select(ramp.item.id,true);test.api.layout(layout);
  assert.equal(test.elements.get('#twinEdit').hidden,true);assert.match(test.elements.get('#twinDetails').textContent,/0\.50 m/);
  test.api.three({resize(){},setScene(){},render(){},fit(){},project:p=>[p[0]*4,p[1]*4,.5],state:()=>({yaw:0,pitch:.6})});test.api.draw();
  test.api.floor('2F');assert.ok(!test.api.scene().some(s=>s.item.id===ramp.item.id));
  assert.equal(JSON.stringify(layout),before);
});
test('GPU scene cache is reused during camera movement; selection, roof and live layout invalidate it',()=>{
  const test=setup(),layout=fixture();test.prepare(freeze(layout));let builds=0,rendered=0,fit=0;
  test.api.three({resize(){},setScene(){builds++;},render(){rendered++;},fit(){fit++;},project:p=>[p[0]*4,p[1]*4,.5],state:()=>({yaw:0,pitch:35}),orbit(){},tilt(){},zoomBy(){}});
  test.api.draw();test.api.orbit(.1);test.api.draw();test.api.tilt(.05);test.api.draw();
  assert.equal(builds,1);assert.equal(rendered,3);assert.equal(fit,1);
  test.api.select(layout.equipment.find(q=>q.code==='L4-1').id);test.api.draw();assert.equal(builds,2);
  test.api.flags(true,false);test.api.draw();assert.equal(builds,3);
  test.api.layout(freeze(plain(layout)));test.api.draw();assert.equal(builds,4);
});
test('missing Three/WebGL safely returns to legacy without changing the layout',()=>{
  const test=setup(),layout=fixture();test.prepare(freeze(layout));const before=JSON.stringify(layout);
  test.api.startThree();assert.equal(test.api.mode(),'legacy');assert.equal(test.api.error(),true);assert.equal(JSON.stringify(layout),before);
});
test('switching engines carries camera angle only and never writes any layout field',()=>{
  const test=setup(),layout=fixture();test.prepare(freeze(layout));const before=JSON.stringify(layout),states=[];
  test.api.three({state:()=>({yaw:95,pitch:40}),setEnabled:v=>states.push(['enabled',v]),setAngles:(yaw,pitch)=>states.push([yaw,pitch])});
  test.api.switchEngine('legacy');assert.equal(test.api.mode(),'legacy');
  test.api.switchEngine('three');assert.equal(test.api.mode(),'three');
  near(states[1][0],95*Math.PI/180);near(states[1][1],40*Math.PI/180);
  assert.equal(JSON.stringify(layout),before);
});
test('runtime bundles Three locally and retains a read-only 2D bridge and legacy comparison',()=>{
  const html=read('index.html'),source=read('three-twin.mjs'),twin=read('digital-twin.js'),app=read('app.js');
  assert.ok(html.indexOf('src="three-twin.js')<html.indexOf('src="digital-twin.js'));
  assert.match(read('build.mjs'),/entryPoints:\["three-twin\.mjs"\]/);assert.match(read('package.json'),/"three": "0\.186\.1"/);
  assert.match(twin,/ChinChunModels\?\.build\(item\)/);assert.match(app,/ChinChunTwin\?\.update\(layoutData, currentFloor\)/);
  assert.match(twin,/\['legacy','legacyEngine'\]/);assert.match(twin,/if\(!allFaces && project/);
  assert.ok(!/localStorage|supabase|fetch\(|\.setItem\(|layoutData\s*=/.test(source));
  assert.match(source,/geometry\?\.dispose\(\)/);assert.match(source,/controls\.dispose\(\)/);
});
