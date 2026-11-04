const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
function setup(){
  const item={id:'machine',x:55.76,y:40.3,rotation:90,width:3.25,height:3};
  const history=[],calls={saved:0,selected:0},ctx={selectedId:item.id,isDrawingRoute:false,isDragging:false,
    document:{querySelector:()=>null},findItemRecord:()=>({type:'equipment',item}),isRecordLayerLocked:()=>false,
    pushHistoryState:()=>history.push({...item}),selectItem:()=>calls.selected++,saveToLocalStorage:()=>calls.saved++,showToast(){}};
  vm.runInNewContext(source.slice(source.indexOf('  function nudgeSelectedEquipment('),source.indexOf('  function rotateSelected(')),ctx);
  const key=(key,extra={})=>{const e={key,target:{closest:()=>null},preventDefault(){this.prevented=true;},...extra};return {handled:ctx.nudgeSelectedEquipment(e),event:e};};
  return {item,history,calls,ctx,key};
}
test('arrow keys move equipment 0.1 m in drawing axes, preserve dimensions, and store an undo snapshot before each move',()=>{
  const {item,history,calls,key}=setup(),original={...item};
  assert.equal(key('ArrowRight').event.prevented,true);assert.equal(item.x,55.86);assert.equal(item.y,40.3);
  key('ArrowDown');assert.equal(item.y,40.4);key('ArrowLeft');key('ArrowUp');
  assert.deepEqual(item,original);assert.deepEqual(history[0],original);assert.equal(calls.saved,4);
  for(let i=0;i<100;i++)key('ArrowRight',{repeat:true});assert.equal(item.x,65.76);
});
test('locked, unselected, non-equipment, editing, modal and modified shortcuts do not move records or create history',()=>{
  for(const mode of ['locked','unselected','wall','input','dialog','route','drag','ctrlKey','metaKey','altKey','shiftKey']){
    const {item,ctx,history,calls,key}=setup(),before={...item};let extra={};
    if(mode==='locked')ctx.isRecordLayerLocked=()=>true;
    if(mode==='unselected')ctx.selectedId=null;
    if(mode==='wall')ctx.findItemRecord=()=>({type:'wall',item});
    if(mode==='input')extra.target={closest:()=>({})};
    if(mode==='dialog')ctx.document.querySelector=()=>({});
    if(mode==='route')ctx.isDrawingRoute=true;
    if(mode==='drag')ctx.isDragging=true;
    if(mode.endsWith('Key'))extra[mode]=true;
    key('ArrowRight',extra);assert.deepEqual(item,before,mode);assert.equal(history.length,0,mode);assert.equal(calls.saved,0,mode);
  }
});
