const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={}; require('../twin-models.js');
test('M2-1 follows the 2D position and rotation without altering the source',()=>{
 const m=window.ChinChunModels, item=Object.freeze({code:'M2-1',x:4.85,y:15.2,width:28,height:4.3,rotation:0});
 const before=JSON.stringify(item), a=m.build(item), b=m.build({...item,x:item.x+3,y:item.y+2,rotation:90});
 assert.ok(m.matches(item)); assert.equal(JSON.stringify(item),before);
 for(const part of ['dryer','walkway','stair-tread','guardrail','laminating-drum','unwind-roll','rewind-roll','receiver-upper-roller','exhaust-duct']) assert.ok(a.some(f=>f.part===part),part);
 a.forEach((f,i)=>f.points.forEach((p,j)=>{const q=b[i].points[j],cx=item.x+14,cy=item.y+2.15;assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(q[0]-(cx+3-(p[1]-cy)))<1e-8);assert.ok(Math.abs(q[1]-(cy+2+(p[0]-cx)))<1e-8);assert.equal(q[2],p[2]);}));
});
test('oven uses the assembly drawing footprint and platform elevation at the nominal 2D size',()=>{
 const f=window.ChinChunModels.build({code:'M2-1',x:0,y:0,width:31.3,height:4.3});
 const p=f.filter(x=>x.part==='dryer').flatMap(x=>x.points);
 const extent=i=>Math.max(...p.map(x=>x[i]))-Math.min(...p.map(x=>x[i]));
 assert.ok(Math.abs(extent(0)-24.15)<1e-8); assert.ok(Math.abs(extent(1)-1.945)<1e-8);
 const deck=f.filter(x=>x.part==='walkway').flatMap(x=>x.points);assert.ok(Math.abs(Math.max(...deck.map(p=>p[2]))-2.73)<1e-8);
});

test('dimensioned end rolls retain their drawing diameters and shaft span',()=>{
 const faces=window.ChinChunModels.build({code:'M2-1',x:0,y:0,width:31.3,height:4.3});
 const extent=(part,axis)=>{const points=faces.filter(f=>f.part===part).flatMap(f=>f.points);assert.ok(points.length,part);return Math.max(...points.map(p=>p[axis]))-Math.min(...points.map(p=>p[axis]));};
 for(const [part,diameter] of [['unwind-roll',1.5],['laminating-drum',1.5],['rewind-roll',1],['receiver-upper-roller',.315]]){assert.ok(Math.abs(extent(part,0)-diameter)<1e-8,part);assert.ok(Math.abs(extent(part,2)-diameter)<1e-8,part);assert.ok(Math.abs(extent(part,1)-1.76)<1e-8,part);}
});
