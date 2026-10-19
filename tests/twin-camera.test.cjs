const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../digital-twin.js'),'utf8');
function setup(){
  const window={};
  const marker='})();';
  assert.ok(source.trimEnd().endsWith(marker));
  const probe=`window.__camera={cameraWheel,cameraKey,orbit,tilt,resetView,iso,viewDepth,fittedScale,
    state:()=>({angle,pitch,zoom,pan:{...pan}}),
    prepare:()=>{width=1200;height=600;zoom=2;pan={x:37,y:-18};canvas={getBoundingClientRect:()=>({left:0,top:0})};}};`;
  vm.runInNewContext(source.trimEnd().slice(0,-marker.length)+probe+marker,{window});
  window.__camera.prepare();return window.__camera;
}
function event(values={}){
  return {deltaX:0,deltaY:0,deltaMode:0,clientX:600,clientY:300,
    prevented:false,preventDefault(){this.prevented=true;},...values};
}
function near(a,b){assert.ok(Math.abs(a-b)<1e-9,`${a} vs ${b}`);}
test('diagonal Command/Shift wheel gestures rotate only horizontally',()=>{
  for(const modifier of ['metaKey','shiftKey'])for(const delta of [[18,45],[45,18],[-45,-18]]){
    const camera=setup(),before=camera.state(),e=event({[modifier]:true,deltaX:delta[0],deltaY:delta[1]});
    camera.cameraWheel(e);const after=camera.state();
    assert.notEqual(after.angle,before.angle);assert.equal(after.pitch,before.pitch);
    assert.equal(after.zoom,before.zoom);assert.deepEqual(after.pan,before.pan);assert.ok(e.prevented);
  }
});
test('Alt wheel gestures tilt only; ambiguous modifier combinations do nothing',()=>{
  const camera=setup(),before=camera.state();
  camera.cameraWheel(event({altKey:true,deltaX:10,deltaY:30}));
  const after=camera.state();assert.equal(after.angle,before.angle);assert.notEqual(after.pitch,before.pitch);
  assert.equal(after.zoom,before.zoom);assert.deepEqual(after.pan,before.pan);
  for(const modifier of ['metaKey','shiftKey']){
    camera.cameraWheel(event({altKey:true,[modifier]:true,deltaX:80,deltaY:100}));
    assert.deepEqual(camera.state(),after);
  }
});
test('ordinary wheel zoom does not rotate or tilt the scene',()=>{
  const camera=setup(),before=camera.state();camera.cameraWheel(event({deltaX:10,deltaY:30}));
  const after=camera.state();assert.equal(after.angle,before.angle);assert.equal(after.pitch,before.pitch);
  assert.notEqual(after.zoom,before.zoom);
});
test('arrow shortcuts independently rotate or tilt, but do not hijack form fields',()=>{
  for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']){
    const camera=setup(),before=camera.state(),e=event({key});camera.cameraKey(e);const after=camera.state();
    if(key==='ArrowLeft' || key==='ArrowRight'){
      assert.notEqual(after.angle,before.angle);assert.equal(after.pitch,before.pitch);
    }else{assert.equal(after.angle,before.angle);assert.notEqual(after.pitch,before.pitch);}
    assert.equal(after.zoom,before.zoom);assert.deepEqual(after.pan,before.pan);assert.ok(e.prevented);
    const field=event({key,target:{closest:()=>({tagName:'SELECT'})}});camera.cameraKey(field);
    assert.deepEqual(camera.state(),after);assert.equal(field.prevented,false);
    camera.cameraKey(event({key,metaKey:true}));assert.deepEqual(camera.state(),after);
  }
});
test('orbit and tilt retain fitted scale, zoom and pan until an explicit reset',()=>{
  const camera=setup(),b={x0:0,y0:0,x1:100,y1:40};
  const scale=camera.fittedScale(b,1200,600),before=camera.state();
  for(let i=0;i<32;i++){
    camera.orbit(.125);camera.tilt((i%2?1:-1)*.02);
    assert.equal(camera.fittedScale(b,1200,600),scale);
    assert.equal(camera.state().zoom,before.zoom);assert.deepEqual(camera.state().pan,before.pan);
  }
  near(camera.fittedScale(b,600,300),scale/2);
  camera.cameraKey(event({key:'0'}));const reset=camera.state();
  assert.equal(reset.angle,0);near(reset.pitch,Math.atan(1/Math.SQRT2));assert.equal(reset.zoom,1);
  assert.equal(reset.pan.x,0);assert.equal(reset.pan.y,0);
});
test('tilt limits avoid near-flat/near-overhead extremes',()=>{
  const camera=setup();camera.tilt(100);near(camera.state().pitch,65*Math.PI/180);
  camera.tilt(-100);near(camera.state().pitch,25*Math.PI/180);
});
test('projection is a uniform orthographic camera, not anisotropic model deformation',()=>{
  const camera=setup();
  for(let i=0;i<16;i++){
    camera.orbit(.25);camera.tilt(i%2?.03:-.03);
    const basis=[[1,0,0],[0,1,0],[0,0,1]].map(p=>[...camera.iso(...p),camera.viewDepth(p)*Math.sqrt(1.5)]);
    basis.forEach(p=>near(Math.hypot(...p),Math.sqrt(1.5)));
    for(const [a,b] of [[0,1],[0,2],[1,2]])near(basis[a].reduce((sum,n,j)=>sum+n*basis[b][j],0),0);
  }
});
test('camera shortcuts never mutate CAD records or photo-model vertices',()=>{
  const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../twin-models.js'),'utf8'),{window});
  const item=Object.freeze({code:'G2-1',x:51.2,y:15.25,width:2.4,height:4.19,rotation:90});
  const before=JSON.stringify(item),model=JSON.stringify(window.ChinChunModels.build(item)),camera=setup();
  for(const key of ['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','0'])camera.cameraKey(event({key}));
  camera.cameraWheel(event({metaKey:true,deltaX:30,deltaY:80}));camera.cameraWheel(event({altKey:true,deltaY:60}));
  assert.equal(JSON.stringify(item),before);assert.equal(JSON.stringify(window.ChinChunModels.build(item)),model);
});
