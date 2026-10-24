const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
let adapter,THREE,OrbitControls;
before(async()=>{adapter=await import('../three-twin.mjs');THREE=await import('three');({OrbitControls}=await import('three/addons/controls/OrbitControls.js'));});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(){
  const doc=new EventTarget(),canvas=new EventTarget();Object.assign(canvas,{ownerDocument:doc,style:{},clientWidth:390,clientHeight:759,getRootNode:()=>doc,getBoundingClientRect:()=>({left:0,top:0,width:390,height:759}),setPointerCapture(){},releasePointerCapture(){}});
  const camera=adapter.createCamera(),controls=new OrbitControls(camera,canvas);
  controls.enableDamping=false;controls.screenSpacePanning=true;controls.enableZoom=false;
  controls.minPolarAngle=.000001;controls.maxPolarAngle=65*Math.PI/180;
  controls.touches={ONE:THREE.TOUCH.PAN,TWO:null};adapter.setOrientation(camera,controls.target);controls.update();
  let enabled=true,picked=0,down=null;
  canvas.addEventListener('pointerdown',e=>{down={id:e.pointerId,x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',e=>{if(down?.id===e.pointerId && Math.hypot(e.clientX-down.x,e.clientY-down.y)<=4)picked++;down=null;});
  const touch=adapter.bindTwoFingerCamera({canvas,camera,controls,isEnabled:()=>enabled,onMultiTouch:()=>{down=null;}});
  const event=(type,id,x,y,pointerType='touch')=>{
    const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,pointerType,clientX:x,clientY:y,pageX:x,pageY:y,button:0});canvas.dispatchEvent(e);doc.dispatchEvent(e);return e;
  };
  const pair=()=>{event('pointerdown',1,120,300);event('pointerdown',2,240,300);};
  const state=()=>({...adapter.cameraAngles(camera,controls.target),zoom:camera.zoom,target:controls.target.toArray(),frustum:[camera.left,camera.right,camera.top,camera.bottom]});
  return {camera,controls,touch,event,pair,state,picked:()=>picked,disable(){enabled=false;controls.enabled=false;controls.disconnect();touch.reset();},enable(){controls.connect(canvas);controls.enabled=true;enabled=true;},dispose(){touch.dispose();controls.dispose();}};
}
test('two-finger translation separates horizontal orbit, vertical tilt and pinch without moving the target',()=>{
  for(const [dx,dy] of [[60,0],[0,-80]]){
    const s=setup(),b=s.state();s.pair();s.event('pointermove',1,120+dx,300+dy);s.event('pointermove',2,240+dx,300+dy);const a=s.state();
    if(dx){assert.notEqual(a.yaw,b.yaw);near(a.pitch,b.pitch);}else{near(a.yaw,b.yaw);assert.ok(a.pitch>b.pitch);}
    near(a.zoom,b.zoom);assert.deepEqual(a.target,b.target);assert.deepEqual(a.frustum,b.frustum);s.dispose();
  }
  const s=setup(),b=s.state();s.pair();s.event('pointermove',1,90,300);s.event('pointermove',2,270,300);const a=s.state();near(a.zoom,1.5);near(a.yaw,b.yaw);near(a.pitch,b.pitch);assert.deepEqual(a.target,b.target);s.dispose();
});
test('twisting rotates with no tilt/zoom drift; reversing sequential pointer events returns to the baseline',()=>{
  const s=setup(),b=s.state();s.pair();s.event('pointermove',1,180,240);s.event('pointermove',2,180,360);let a=s.state();near(a.yaw,(b.yaw-Math.PI/2+2*Math.PI)%(2*Math.PI));near(a.pitch,b.pitch);near(a.zoom,1);
  s.event('pointermove',2,240,300);s.event('pointermove',1,120,300);a=s.state();near(a.yaw,b.yaw);near(a.pitch,b.pitch);near(a.zoom,b.zoom);s.dispose();
});
test('one-finger pan remains in OrbitControls and two-finger releases never become object clicks',()=>{
  const s=setup(),b=s.state();s.event('pointerdown',1,120,300);s.event('pointermove',1,160,320);assert.notDeepEqual(s.state().target,b.target);near(s.state().yaw,b.yaw);near(s.state().pitch,b.pitch);s.event('pointerup',1,160,320);
  s.pair();s.event('pointerup',2,240,300);s.event('pointerup',1,120,300);assert.equal(s.picked(),0);s.dispose();
});
test('third fingers, cancellation, lost capture, disable/reopen and disposal cannot leave a stale gesture',()=>{
  const s=setup();s.pair();s.event('pointerdown',3,300,400);const b=s.state();s.event('pointermove',3,340,440);assert.deepEqual(s.state(),b);s.event('pointercancel',3,340,440);s.event('pointermove',1,140,300);assert.notEqual(s.state().yaw,b.yaw);
  s.event('lostpointercapture',1,140,300);const after=s.state();s.event('pointermove',2,240,320);near(s.state().yaw,after.yaw);near(s.state().zoom,after.zoom);
  s.disable();const disabled=s.state();s.event('pointermove',2,300,600);assert.deepEqual(s.state(),disabled);s.enable();s.pair();s.event('pointermove',1,120,280);s.event('pointermove',2,240,280);assert.ok(s.state().pitch>disabled.pitch);s.dispose();
  const ended=s.state();s.event('pointerdown',4,100,100);s.event('pointermove',4,200,200);assert.deepEqual(s.state(),ended);
});
test('gesture math wraps the twist branch cut, ignores degenerate fingers and clamps camera zoom/tilt',()=>{
  const radians=d=>d*Math.PI/180,points=a=>[[0,0],[100*Math.cos(a),100*Math.sin(a)]];
  const delta=adapter.twoTouchDelta(points(radians(179)),points(radians(-179)),390,759);assert.ok(Math.abs(delta.yaw)<radians(3));
  for(const pair of [[],[[0,0],[0,0]],[[NaN,0],[100,0]]])assert.deepEqual(adapter.twoTouchDelta(pair,[[0,0],[100,0]],390,759),{yaw:0,pitch:0,zoom:1});
  const s=setup();s.pair();s.event('pointermove',1,-9000,-9000);s.event('pointermove',2,9000,-9000);near(s.state().zoom,12);near(s.state().pitch,radians(85));s.dispose();
});
test('touch implementation has no CAD/storage writes and retains the existing local Three bundle',()=>{
  const source=fs.readFileSync(require.resolve('../three-twin.mjs'),'utf8');assert.doesNotMatch(source,/localStorage|supabase|fetch\(|\.setItem\(|layoutData\s*=/);
  assert.match(source,/touch\.reset\(\)/);assert.match(source,/touch\.dispose\(\)/);assert.match(source,/TWO:null/);
});
test('legacy comparison uses the same two-finger math without altering its supplied CAD records',()=>{
  const source=fs.readFileSync(require.resolve('../digital-twin.js'),'utf8'),window={ChinChunThree:{touchDelta:adapter.twoTouchDelta}};
  const probe=`window.testTouch={applyLegacyTouchGesture,state:()=>({angle,pitch,zoom}),prepare:d=>{data=d;width=390;height=759;}};`;
  vm.runInNewContext(source.trimEnd().slice(0,-5)+probe+'})();',{window});
  const layout=JSON.parse(fs.readFileSync(require.resolve('../factory_layout_data.json'),'utf8')),before=JSON.stringify(layout);Object.freeze(layout);
  window.testTouch.prepare(layout);const state=window.testTouch.state(),baseline={...state,points:[[120,300],[240,300]]};
  window.testTouch.applyLegacyTouchGesture(baseline,[[160,250],[280,250]]);const changed=window.testTouch.state();assert.notEqual(changed.angle,state.angle);assert.ok(changed.pitch>state.pitch);near(changed.zoom,state.zoom);
  window.testTouch.applyLegacyTouchGesture(baseline,baseline.points);const restored=window.testTouch.state();near(restored.angle,state.angle);near(restored.pitch,state.pitch);near(restored.zoom,state.zoom);assert.equal(JSON.stringify(layout),before);
});
