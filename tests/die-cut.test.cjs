const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
global.window={};require('../twin-models.js');
const models=window.ChinChunModels;
const item=Object.freeze({id:'eq_diecut_sub',code:'Die Cut',x:55.76,y:40.9,width:3.25,height:3,floor:'1F',rotation:0});
const wall={id:'wall_10',x1:55,y1:40,x2:85.25,y2:40,thickness:.2,type:'interior'};
const l41={id:'eq_diecut_l4_1',code:'L4-1',x:60.2,y:36.73,width:3.25,height:3};
const layout={grid:{factory_depth:40},equipment:[item,l41],walls:[wall]};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} vs ${b}`);

test('unnumbered Die Cut has photo geometry, while L4-1 remains a different machine',()=>{
  const faces=models.build(item),before=JSON.stringify(item);
  assert.equal(models.matches(item),true);assert.equal(models.matches(l41),false);assert.equal(models.build(l41),null);
  assert.ok(faces.length>500);
  for(const part of ['green-belt','press-cheek','dark-side-cover','open-top-housing','housing-rib','drive-motor','press-platen','actuator','safety-guard','guard-mesh','control-cabinet','touchscreen','feed-guide'])assert.ok(faces.some(f=>f.part===part),part);
  for(const p of faces.flatMap(f=>f.points)){
    assert.ok(p.every(Number.isFinite));assert.ok(p[0]>=item.x && p[0]<=item.x+item.width+1e-9);
    assert.ok(p[1]>=item.y && p[1]<=item.y+item.height+1e-9);assert.ok(p[1]>40,'entire machine is outside original building');
    assert.ok(p[2]>=0 && p[2]<=2.34+1e-9);
  }
  assert.equal(JSON.stringify(item),before);
  assert.deepEqual(models.build({...item,code:'模切',photoModelCode:'DIE CUT'}),faces);
});

test('all machine parts rotate rigidly, translate and resize with live 2D',()=>{
  const original=models.build(item),cx=item.x+item.width/2,cy=item.y+item.height/2;
  for(const rotation of [90,180,-90,33]){
    const turned=models.build({...item,x:item.x+2,y:item.y-3,rotation}),a=rotation*Math.PI/180;
    original.forEach((f,i)=>f.points.forEach(([x,y,z],j)=>{
      const q=turned[i].points[j];near(q[0],cx+2+(x-cx)*Math.cos(a)-(y-cy)*Math.sin(a));near(q[1],cy-3+(x-cx)*Math.sin(a)+(y-cy)*Math.cos(a));near(q[2],z);
    }));
  }
  const bigger=models.build({...item,width:6.5,height:6});
  original.forEach((f,i)=>f.points.forEach(([x,y,z],j)=>{near(bigger[i].points[j][0],item.x+(x-item.x)*2);near(bigger[i].points[j][1],item.y+(y-item.y)*2);near(bigger[i].points[j][2],z);}));
});

test('site keeps machine outside, opening on original wall and collection inside left of L4-1',()=>{
  const before=JSON.stringify(layout),s=models.dieCutSite(layout);
  assert.ok(s);assert.equal(s.item,item);assert.equal(s.wall,wall);near(s.opening.y,40);
  assert.ok(s.collection.y+s.collection.height<40);assert.ok(s.collection.x+s.collection.width<l41.x);
  assert.ok(s.feed[1]>s.out[1]);assert.ok(s.table.y<40 && s.table.y+s.table.height>40);
  near(s.insideRise-s.outsideRise,.5);near(s.outsideRise+s.beltHeight,2);
  const context=models.dieCutSiteFaces(s);
  assert.ok(context.some(f=>f.part==='filled-ground'));assert.ok(context.some(f=>f.part==='collection-table'));
  near(Math.max(...context.filter(f=>f.part==='filled-ground').flatMap(f=>f.points.map(p=>p[2]))),1);
  near(Math.max(...context.filter(f=>f.part==='collection-table').flatMap(f=>f.points.map(p=>p[2]))),2);
  assert.equal(JSON.stringify(layout),before,'no CAD/cloud mutation');
});

test('site is recalculated after 2D move but never connects the wrong machine or wall',()=>{
  const moved=models.dieCutSite({...layout,equipment:[{...item,x:56},l41]});
  near(moved.opening.x-models.dieCutSite(layout).opening.x,.24);
  for(const change of [{rotation:90},{rotation:180},{y:39},{y:48},{x:70},{floor:'2F'}])assert.equal(models.dieCutSite({...layout,equipment:[{...item,...change},l41]}),null);
  assert.equal(models.dieCutSite({...layout,equipment:[l41]}),null);
  assert.equal(models.dieCutSite({...layout,walls:[]}),null);
  assert.equal(models.dieCutSite({...layout,equipment:[item]}),null);
});

test('2D site overlay shares the site geometry, is bilingual and cannot intercept equipment editing',()=>{
  const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const start=source.indexOf('  function renderDieCutSiteSvg('),end=source.indexOf('  function renderRestroomSvg(',start);
  const c={window:{ChinChunModels:models},document:{documentElement:{lang:'zh-TW'}},SCALE:24,metersToSvg:(x,y)=>({x:x*24,y:y*24})};
  vm.createContext(c);vm.runInContext(source.slice(start,end),c);
  const svg=c.renderDieCutSiteSvg(layout);assert.match(svg,/pointer-events="none"/);assert.match(svg,/出料收集區/);assert.match(svg,/data-height-difference="0.5"/);assert.match(svg,/出料牆洞/);assert.ok(!svg.includes('NaN'));
  c.document.documentElement.lang='th';assert.match(c.renderDieCutSiteSvg(layout),/พื้นที่รับงาน/);
});

test('only this filled extension gets its local elevation; main floor and other exterior machines are unchanged',()=>{
  const source=fs.readFileSync(require.resolve('../digital-twin.js'),'utf8');
  const start=source.indexOf('  const elevation ='),end=source.indexOf('  function localize()',start);
  const c={floor:'1F',isRamp:()=>false,isOfficeEntry:()=>false,inFactory:p=>p[1]<=40,factoryRise:1.5,dieGround:models.dieCutSite(layout)};
  vm.createContext(c);vm.runInContext(source.slice(start,end).replace('const elevation =','var elevation ='),c);
  const s={item,type:'equipment',points:c.dieGround.footprint};near(c.elevation(s),1);
  near(c.elevation({...s,item:{id:'another'}}),0);
  near(c.elevation({...s,item:l41,points:[[60,36],[63,36],[63,39],[60,39]]}),1.5);
  near(c.elevation({...s,type:'site'}),0);
});

test('live scene cuts only the discharge aperture, preserving the sill, lintel and rest of the wall',()=>{
  const source=fs.readFileSync(require.resolve('../digital-twin.js'),'utf8');
  const start=source.indexOf('  function rect('),end=source.indexOf('  function iso(',start);
  const c={window:{ChinChunModels:models},data:layout,scene:[],selected:null,floor:'1F',dieSite:null,dieGround:null,
    dialog:{querySelector:()=>({replaceChildren(){},add(){}})},Option:function(){},n:(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,
    isRamp:()=>false,isOfficeEntry:()=>false,referenceCode:models.referenceCode,t:()=>'',updateInfo(){},requestDraw(){}};
  vm.createContext(c);vm.runInContext(source.slice(start,end),c);c.rebuild();
  const walls=c.scene.filter(s=>s.type==='wall'),cx=c.dieSite.opening.x+c.dieSite.opening.width/2;
  const atOpening=walls.filter(s=>Math.min(...s.points.map(p=>p[0]))<cx && Math.max(...s.points.map(p=>p[0]))>cx);
  assert.equal(atOpening.length,2);assert.ok(atOpening.some(s=>s.z===.35));assert.ok(atOpening.some(s=>s.zBase===1.6 && s.z===2.4));
  assert.ok(atOpening.every(s=>s.z<=.35 || s.zBase>=1.6),'no solid wall across the belt-height opening');
  assert.ok(walls.some(s=>Math.min(...s.points.map(p=>p[0]))>=c.dieSite.opening.x+c.dieSite.opening.width));
  c.data={...layout,equipment:[{...item,rotation:180},l41]};c.rebuild();
  assert.equal(c.dieSite,null);assert.ok(c.dieGround,'rotation does not drop the machine from the filled ground');
  assert.equal(c.scene.filter(s=>s.type==='wall').length,1,'no false connection when turned away');
});
