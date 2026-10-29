const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(require.resolve('../'+f),'utf8');
const window={};for(const f of ['building-geometry.js','site-access.js'])vm.runInNewContext(read(f),{window});
const access=window.ChinChunAccess,layout=JSON.parse(read('factory_layout_data.json'));
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
const sumArea=ps=>ps.reduce((s,p)=>s+area(p),0);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const contains=(poly,p)=>poly.every((a,i)=>{const b=poly[(i+1)%poly.length];return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])>=-1e-8;});

test('subtracting an access footprint preserves outside route area and its original elevations',()=>{
  const p=rect(0,0,10,10).map(([x,y])=>[x,y,x+y]),hole=rect(4,4,2,2),before=JSON.stringify({p,hole});
  const clipped=access.clipRoutes(p,[hole]);near(sumArea(clipped),96);assert.ok(!clipped.some(q=>contains(q,[5,5])));
  for(const q of clipped)for(const [x,y,z] of q)near(z,x+y);
  assert.equal(JSON.stringify({p,hole}),before);
  assert.equal(access.clipRoutes(p,[rect(-1,-1,12,12)]).length,0);
  near(sumArea(access.clipRoutes(p,[rect(20,20,2,2)])),100);
  near(sumArea(access.clipRoutes(p,[rect(-1,-1,2,2)])),99);
});
test('overlapping or rotated access masks never restore circulation inside another protected area',()=>{
  const p=rect(0,0,10,10),holes=[rect(2,2,4,4),rect(4,4,4,4)];
  near(sumArea(access.clipRoutes(p,holes)),72);
  const diamond=[[5,3],[7,5],[5,7],[3,5]],out=access.clipRoutes(p,[diamond]);near(sumArea(out),92);
  assert.ok(!out.some(q=>contains(q,[5,5])));
});
test('all current ramps and the photo stair are protected, with floor-specific, read-only masks',()=>{
  const before=JSON.stringify(layout),holes=access.routeHoles(layout);
  for(const p of [[17.5,36],[32.5,47.5],[52.5,40.5],[87.5,42]])assert.ok(holes.some(h=>contains(h,p)),p.join(','));
  assert.equal(holes.length,4);assert.equal(access.routeHoles(layout,'2F').length,0);
  const d={equipment:[{code:'RAMP-CUSTOM',x:1,y:2,width:4,height:1,rotation:37}]};
  const h=access.routeHoles(d)[0];near(sumArea([h]),4.24*1.24);assert.ok(contains(h,[3,2.5]));
  assert.equal(JSON.stringify(layout),before);
});
test('SVG masks erase both aisle bands and flow arrowheads without changing layer controls or CAD data',()=>{
  const svg=access.routeMaskSvg(layout,24,{x:400,y:400},3200,2400,'1F'),app=read('app.js');
  assert.match(svg,/maskUnits="userSpaceOnUse"/);assert.match(svg,/mask-type:luminance/);assert.match(svg,/fill="white"/);assert.equal((svg.match(/fill="black"/g)||[]).length,4);
  assert.match(app,/id="layerAisles"[^\n]+accessRouteMask/);assert.match(app,/id="layerFlows"[^\n]+accessRouteMask/);
  assert.match(app,/if \(layerState\.flows\)/);assert.match(app,/if \(layerState\.aisles/);
});
test('shared 2.5D circulation leaves every access surface clear, including an arrow ending on the stairs',()=>{
  const source=read('digital-twin.js'),end='})();',w={};for(const f of ['building-geometry.js','site-access.js','twin-models.js'])vm.runInNewContext(read(f),{window:w});
  const noop=()=>{},elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{setAttribute:noop,replaceChildren:noop,add:noop});return elements.get(id);};
  const probe=`window.__routeTest={prepare(d){data=d;dialog={querySelector:element};rebuild();},faces:()=>circulationFaces(scene),ground:()=>threeGroundFaces(scene,bounds)};`;
  vm.runInNewContext(source.trimEnd().slice(0,-end.length)+probe+end,{window:w,element,document:{documentElement:{lang:'zh-Hant'}},Option:function(){},requestAnimationFrame:noop});
  const d=JSON.parse(JSON.stringify(layout));d.flows=[{floor:'1F',points:[{x:26,y:47.5},{x:40,y:47.5}]},{floor:'1F',points:[{x:52.5,y:38},{x:52.5,y:40.5}]}];
  const before=JSON.stringify(d);w.__routeTest.prepare(d);const faces=w.__routeTest.faces();
  assert.ok(faces.some(f=>f.part==='aisle'));assert.ok(faces.some(f=>f.part==='flow'));assert.ok(faces.some(f=>f.part==='flow-arrow'));
  for(const [x,y] of [[17.5,36],[32.5,47.5],[52.5,40.5],[87.5,42]])for(const dx of [-.3,0,.3])for(const dy of [-.15,0,.15])assert.ok(!faces.some(f=>contains(f.points,[x+dx,y+dy])),`${x+dx},${y+dy} must stay clear`);
  assert.ok(!faces.filter(f=>f.part==='flow-arrow').some(f=>contains(f.points,[52.5,40.4])));
  const ground=w.__routeTest.ground().filter(f=>['aisle','flow','flow-arrow'].includes(f.part));assert.equal(ground.length,faces.length);
  assert.match(source,/for\(const f of circulationFaces\(visible\)\)/,'legacy uses the same clipped faces');
  assert.equal(JSON.stringify(d),before);
});
