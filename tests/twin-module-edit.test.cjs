const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const operations=source.slice(
  source.indexOf('  function moveTwinEquipment('),
  source.indexOf('  function duplicateSelected()',source.indexOf('  function moveTwinEquipment('))
);

function setup({locked=false}={}){
  const equipment=[{id:'machine-1',code:'M2-1',x:10,y:20,width:31.3,height:2,rotation:0,photoModelCode:'M2-1'}];
  const equipment_2f=[{id:'machine-2f',code:'UP-1',x:4,y:5,width:2,height:1,rotation:90,model:{parts:[1,2,3]}}];
  const actions=[];
  const findItemRecord=id=>{
    let item=equipment.find(q=>q.id===id);if(item)return {item,type:'equipment',collection:equipment};
    item=equipment_2f.find(q=>q.id===id);return item?{item,type:'equipment',collection:equipment_2f}:null;
  };
  const context={
    findItemRecord,isRecordLayerLocked:()=>locked,
    pushHistoryState:name=>actions.push(['history',name]),
    selectItem:id=>actions.push(['select',id]),saveToLocalStorage:()=>actions.push(['save']),
    renderSvg:()=>actions.push(['render']),showToast:()=>actions.push(['toast'])
  };
  vm.runInNewContext(`${operations}\nthis.moveTwinEquipment=moveTwinEquipment;this.duplicateTwinEquipment=duplicateTwinEquipment;`,context);
  return {equipment,equipment_2f,actions,...context};
}

test('2.5D move writes one equipment record, preserves dimensions, and remains undoable',()=>{
  const ctx=setup(),before={width:ctx.equipment[0].width,height:ctx.equipment[0].height,rotation:ctx.equipment[0].rotation};
  const result=ctx.moveTwinEquipment('machine-1',.5,-.1);
  assert.deepEqual(JSON.parse(JSON.stringify(result)),{ok:true,id:'machine-1',x:10.5,y:19.9});
  assert.deepEqual({width:ctx.equipment[0].width,height:ctx.equipment[0].height,rotation:ctx.equipment[0].rotation},before);
  assert.equal(ctx.equipment[0].width,31.3);
  assert.deepEqual(ctx.actions.map(q=>q[0]),['history','select','save','render']);
});

test('2.5D copy stays in its source floor collection and preserves the complete model record',()=>{
  const ctx=setup(),original=JSON.parse(JSON.stringify(ctx.equipment_2f[0]));
  const result=ctx.duplicateTwinEquipment('machine-2f');
  assert.equal(result.ok,true);assert.equal(ctx.equipment.length,1);assert.equal(ctx.equipment_2f.length,2);
  const copy=ctx.equipment_2f[1];
  assert.notEqual(copy.id,original.id);assert.equal(copy.code,'UP-1-COPY');
  assert.equal(copy.x,5);assert.equal(copy.y,6);assert.equal(copy.rotation,original.rotation);
  assert.equal(JSON.stringify(copy.model),JSON.stringify(original.model));assert.notEqual(copy.model,ctx.equipment_2f[0].model);
  assert.deepEqual(ctx.actions.map(q=>q[0]),['history','select','save','render']);
});

test('locked equipment rejects 2.5D move and copy without mutating layout or history',()=>{
  const ctx=setup({locked:true}),before=JSON.stringify([ctx.equipment,ctx.equipment_2f]);
  assert.equal(ctx.moveTwinEquipment('machine-1',1,0).reason,'locked');
  assert.equal(ctx.duplicateTwinEquipment('machine-1').reason,'locked');
  assert.equal(JSON.stringify([ctx.equipment,ctx.equipment_2f]),before);
  assert.deepEqual(ctx.actions.map(q=>q[0]),['toast','toast']);
});
