const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={}; require('../twin-models.js');
test('M2-1 follows the 2D position and rotation without altering the source',()=>{
 const m=window.ChinChunModels, item=Object.freeze({code:'M2-1',x:4.85,y:15.2,width:28,height:4.3,rotation:0});
 const before=JSON.stringify(item), a=m.build(item), b=m.build({...item,x:item.x+3,y:item.y+2,rotation:90});
 assert.ok(m.matches(item)); assert.equal(JSON.stringify(item),before);
 for(const part of ['dryer','walkway','stair-tread','guardrail','laminating-drum','roller','exhaust-duct']) assert.ok(a.some(f=>f.part===part),part);
 a.forEach((f,i)=>f.points.forEach((p,j)=>{const q=b[i].points[j],cx=item.x+14,cy=item.y+2.15;assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(q[0]-(cx+3-(p[1]-cy)))<1e-8);assert.ok(Math.abs(q[1]-(cy+2+(p[0]-cx)))<1e-8);assert.equal(q[2],p[2]);}));
});
