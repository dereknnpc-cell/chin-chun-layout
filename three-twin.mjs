// Read-only Three.js presentation adapter. No CAD, storage or cloud writes.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// CAD's plan is screen-style (x right, y down) with z up. Three uses Y up.
// Keep positive CAD y on positive Z so the existing plan is not mirrored.
// Geometry is double-sided; no model-local rotations are applied a second time.
export const toWorld = ([x,y,z=0]) => [x,z,y];
export const toCad = ([x,y,z]) => [x,z,y];
export const DEFAULT_PITCH = Math.atan(1/Math.SQRT2);

export function triangulateFace(points) {
  if(!Array.isArray(points) || points.length<3 || points.some(p=>p.length<3 || !p.every(Number.isFinite)))return [];
  const normal=[0,0,0];
  points.forEach((p,i)=>{const q=points[(i+1)%points.length];normal[0]+=(p[1]-q[1])*(p[2]+q[2]);normal[1]+=(p[2]-q[2])*(p[0]+q[0]);normal[2]+=(p[0]-q[0])*(p[1]+q[1]);});
  const magnitude=Math.max(...normal.map(Math.abs));if(magnitude<1e-12)return [];
  const drop=normal.map(Math.abs).indexOf(magnitude),axes=[0,1,2].filter(i=>i!==drop);
  // Ear clipping also preserves the concave portal panels in the existing models.
  const contour=points.map(p=>new THREE.Vector2(p[axes[0]],p[axes[1]]));
  return THREE.ShapeUtils.triangulateShape(contour,[]);
}

export function geometryFromFaces(faces) {
  const positions=[],colors=[],edges=[],edgeColors=[];
  for(const face of faces){
    const triangles=triangulateFace(face.points);if(!triangles.length)continue;
    const color=new THREE.Color(/^#[\da-f]{6}$/i.test(face.color)?face.color:'#719f95');
    const world=face.points.map(toWorld);
    for(const triangle of triangles)for(const i of triangle){positions.push(...world[i]);colors.push(color.r,color.g,color.b);}
    if(face.edges)for(let i=0;i<world.length;i++){
      edges.push(...world[i],...world[(i+1)%world.length]);
      const tint=new THREE.Color(face.stroke || '#52675c');edgeColors.push(tint.r,tint.g,tint.b,tint.r,tint.g,tint.b);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  let lines=null;
  if(edges.length){lines=new THREE.BufferGeometry();lines.setAttribute('position',new THREE.Float32BufferAttribute(edges,3));lines.setAttribute('color',new THREE.Float32BufferAttribute(edgeColors,3));}
  return {geometry,lines};
}

export function groupFaces(faces) {
  const groups=new Map();
  for(const face of faces){
    const key=!face.nonInteractive && face.s?.item?.id ? face.s.item.id : '__site';
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(face);
  }
  return groups;
}

export function createCamera() {
  const camera=new THREE.OrthographicCamera(-10,10,10,-10,.05,2000);
  camera.up.set(0,1,0);
  return camera;
}

export function setOrientation(camera,target,yaw=0,pitch=DEFAULT_PITCH,distance=200) {
  const theta=Math.PI/4+yaw,horizontal=distance*Math.cos(pitch);
  camera.position.set(target.x+horizontal*Math.sin(theta),target.y+distance*Math.sin(pitch),target.z+horizontal*Math.cos(theta));
  camera.lookAt(target);camera.updateMatrixWorld(true);
}

export function cameraAngles(camera,target) {
  const offset=camera.position.clone().sub(target),theta=Math.atan2(offset.x,offset.z);
  return {yaw:((theta-Math.PI/4)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),pitch:Math.atan2(offset.y,Math.hypot(offset.x,offset.z))};
}

export function fitCamera(camera,target,box,aspect) {
  const center=box.getCenter(new THREE.Vector3()),{yaw,pitch}=cameraAngles(camera,target);
  const radius=Math.max(2,box.getSize(new THREE.Vector3()).length()/2);
  target.copy(center);setOrientation(camera,target,yaw,pitch,Math.max(100,radius*4));
  const local=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])local.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  const xs=local.map(p=>p.x),ys=local.map(p=>p.y);
  const half=Math.max(2,(Math.max(...ys)-Math.min(...ys))/2,(Math.max(...xs)-Math.min(...xs))/(2*Math.max(.1,aspect)))*1.16;
  camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
  camera.near=.05;camera.far=Math.max(1000,radius*10);camera.zoom=1;camera.updateProjectionMatrix();
  return half;
}

export function projectPoint(camera,point,width,height) {
  const p=new THREE.Vector3(...toWorld(point)).project(camera);
  return [(p.x+1)*width/2,(1-p.y)*height/2,p.z];
}

export function createThreeTwin({canvas,onChange=()=>{},onPick=()=>{},onError=()=>{}}) {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.domElement.className='twin-three-surface';renderer.domElement.setAttribute('aria-hidden','true');
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;
  const scene=new THREE.Scene(),root=new THREE.Group(),camera=createCamera();scene.add(root);
  scene.add(new THREE.HemisphereLight(0xf2f4df,0x526557,2.2));
  const light=new THREE.DirectionalLight(0xffffff,1.5);light.position.set(-40,90,30);scene.add(light);
  const material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  const lineMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.55});
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=false;controls.screenSpacePanning=true;controls.enableZoom=false;
  controls.minPolarAngle=.000001;controls.maxPolarAngle=65*Math.PI/180;
  controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.PAN,RIGHT:THREE.MOUSE.ROTATE};
  controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN};
  // Disable OrbitControls wheel zoom: our capture listener retains independent
  // Command/Shift orbit, Alt tilt, and unmodified zoom for the existing users.
  setOrientation(camera,controls.target);controls.update();
  let width=1,height=1,halfHeight=10,enabled=true,disposed=false,down=null,meshes=[],box=new THREE.Box3();
  const raycaster=new THREE.Raycaster();
  const changed=()=>onChange();controls.addEventListener('change',changed);
  const resetPointer=()=>{down=null;};
  const pointerDown=e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId,button:e.button};};
  const pointerUp=e=>{
    const start=down;down=null;if(!enabled || !start || start.id!==e.pointerId || start.button!==0 || Math.hypot(e.clientX-start.x,e.clientY-start.y)>4)return;
    const rect=canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
    const hit=raycaster.intersectObjects(meshes,false)[0];onPick(hit?.object.userData.cadId || null);
  };
  let pinchDistance=null;
  const pointers=new Map();
  const touchDown=e=>{if(e.pointerType==='touch'){pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const p=[...pointers.values()];pinchDistance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);down=null;}}};
  const touchMove=e=>{if(!enabled || !pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const p=[...pointers.values()],distance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinchDistance>0){camera.zoom=THREE.MathUtils.clamp(camera.zoom*distance/pinchDistance,.25,12);camera.updateProjectionMatrix();onChange();}pinchDistance=distance;down=null;}};
  const touchEnd=e=>{pointers.delete(e.pointerId);pinchDistance=null;};
  const contextLost=e=>{e.preventDefault();if(!disposed)onError(new Error('WebGL context lost'));};
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',resetPointer);
  canvas.addEventListener('pointerdown',touchDown);canvas.addEventListener('pointermove',touchMove);canvas.addEventListener('pointerup',touchEnd);canvas.addEventListener('pointercancel',touchEnd);
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function clearGeometry(){
    for(const child of [...root.children]){root.remove(child);child.geometry?.dispose();}
    meshes=[];box.makeEmpty();
  }
  function setScene(faces) {
    clearGeometry();
    for(const [id,parts] of groupFaces(faces)){
      const {geometry,lines}=geometryFromFaces(parts);
      if(!geometry.attributes.position.count){geometry.dispose();lines?.dispose();continue;}
      const mesh=new THREE.Mesh(geometry,material);mesh.userData={cadId:id==='__site'?null:id,faceCount:parts.length};root.add(mesh);meshes.push(mesh);
      box.union(geometry.boundingBox);
      if(lines)root.add(new THREE.LineSegments(lines,lineMaterial));
    }
    root.updateMatrixWorld(true);
    if(box.isEmpty())box.set(new THREE.Vector3(0,0,-40),new THREE.Vector3(100,5,0));
  }
  function resize(w,h,dpr=1){
    if(w<=0 || h<=0)return;
    width=w;height=h;
    const pixelRatio=Math.min(2,Math.max(1,dpr));
    if(renderer.getPixelRatio()!==pixelRatio)renderer.setPixelRatio(pixelRatio);
    const size=renderer.getSize(new THREE.Vector2());if(size.x!==w || size.y!==h)renderer.setSize(w,h,true);
    const aspect=w/h;camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
  }
  function orbit(delta){const {yaw,pitch}=cameraAngles(camera,controls.target);setOrientation(camera,controls.target,yaw+delta,pitch,camera.position.distanceTo(controls.target));controls.update();onChange();}
  function tilt(delta){const {yaw,pitch}=cameraAngles(camera,controls.target);setOrientation(camera,controls.target,yaw,THREE.MathUtils.clamp(pitch+delta,25*Math.PI/180,85*Math.PI/180),camera.position.distanceTo(controls.target));controls.update();onChange();}
  return {
    element:renderer.domElement,
    setScene,resize,
    render(){if(!disposed)renderer.render(scene,camera);},
    fit(){halfHeight=fitCamera(camera,controls.target,box,width/height);controls.update();onChange();},
    orbit,tilt,
    setAngles(yaw,pitch){setOrientation(camera,controls.target,yaw,pitch,camera.position.distanceTo(controls.target));controls.update();onChange();},
    reset(){setOrientation(camera,controls.target);controls.update();onChange();},
    top(){setOrientation(camera,controls.target,-Math.PI/4,Math.PI/2-.000001,camera.position.distanceTo(controls.target));controls.update();onChange();},
    zoomBy(factor){camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.25,12);camera.updateProjectionMatrix();onChange();},
    project(point){return projectPoint(camera,point,width,height);},
    state(){const a=cameraAngles(camera,controls.target);return {yaw:a.yaw*180/Math.PI,pitch:a.pitch*180/Math.PI,zoom:camera.zoom,objects:meshes.length,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls};},
    setEnabled(value){enabled=value;controls.enabled=value;renderer.domElement.hidden=!value;down=null;pointers.clear();pinchDistance=null;},
    dispose(){if(disposed)return;disposed=true;controls.removeEventListener('change',changed);controls.dispose();clearGeometry();material.dispose();lineMaterial.dispose();renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.dispose();renderer.domElement.remove();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',resetPointer);canvas.removeEventListener('pointerdown',touchDown);canvas.removeEventListener('pointermove',touchMove);canvas.removeEventListener('pointerup',touchEnd);canvas.removeEventListener('pointercancel',touchEnd);}
  };
}

if(typeof window!=='undefined')window.ChinChunThree={create:createThreeTwin,revision:THREE.REVISION};
