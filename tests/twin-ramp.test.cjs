const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../digital-twin.js'),'utf8');
const marker='})();';
assert.ok(source.trimEnd().endsWith(marker));
const window={};
vm.runInNewContext(source.trimEnd().slice(0,-marker.length)+'window.__rampTopPoints=rampTopPoints;'+marker,{window});
window.ChinChunTwin.update({grid:{factory_width:100,factory_depth:40}},'1F');

test('RAMP-5M keeps the first-version short-side slope',()=>{
  const item={code:'RAMP-5M',x:20,y:38,width:5,height:2.5};
  const points=[[20,38],[25,38],[25,40.5],[20,40.5]];
  const top=window.__rampTopPoints({item,points,z:1.5});
  assert.deepEqual(Array.from(top,p=>p[2]),[1.5,1.5,0,0]);
  assert.deepEqual(Array.from(top,p=>p.slice(0,2).join(',')),points.map(p=>p.join(',')));
});

test('the high edge remains on the factory side when ramp is reversed',()=>{
  const points=[[20,-2.5],[25,-2.5],[25,0],[20,0]];
  const top=window.__rampTopPoints({item:{code:'RAMP-5M'},points,z:1.5});
  assert.deepEqual(Array.from(top,p=>p[2]),[0,0,1.5,1.5]);
});
