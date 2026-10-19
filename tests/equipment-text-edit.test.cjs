const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const controller = source.slice(source.indexOf('  // --- Quick Rename Box Controller'), source.indexOf('  // --- Add Custom Equipment Modal Controller'));

function setup() {
  const item = {id:'machine', code:'G2-1', name:'原設備', x:51.2, y:15.25, width:2.4, height:4.19, rotation:90};
  const fields = Object.fromEntries(['Box','Title','Name','Code','CodeGroup'].map(key => [`quickRename${key}`, {
    value:'', style:{display:'none'}, focus(){this.focused=true;}, select(){},
    getBoundingClientRect:()=>({width:290,height:230})
  }]));
  let locked = false, now = 1000;
  const history = [], calls = {saved:0, renders:0, selected:0};
  const context = {
    window:{}, currentFloor:'1F', dragHasMoved:false, Date:{now:()=>now},
    document:{getElementById:id=>fields[id]},
    viewportEl:{getBoundingClientRect:()=>({left:0,top:0,width:800,height:600})},
    findItemRecord:id=>id==='machine'?{type:'equipment',item}:null,
    isRecordLayerLocked:()=>locked,
    pushHistoryState:()=>history.push(JSON.stringify(item)),
    saveToLocalStorage:()=>calls.saved++, selectItem:()=>calls.selected++, renderSvg:()=>calls.renders++
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../twin-models.js'), 'utf8'),context);
  vm.runInContext(controller,context);
  return {context,item,fields,history,calls, lock:()=>{locked=true;}, tick:ms=>{now+=ms;}};
}
const pointer = (x=100,y=100)=>({clientX:x, clientY:y, button:0});

test('double-click is matched by equipment ID across selection re-renders',()=>{
  const {context:c, fields:f, calls, history} = setup();
  assert.equal(c.beginEquipmentTextGesture('machine',pointer()),false);
  c.finishEquipmentTextGesture(pointer(102,101));
  assert.equal(c.beginEquipmentTextGesture('machine',pointer(103,101)),true);
  assert.equal(f.quickRenameBox.style.display,'flex');
  assert.equal(f.quickRenameCode.focused,true);
  assert.equal(calls.saved,0); assert.equal(history.length,0);
});

test('slow, far, different-equipment, cross-floor and dragged clicks do not edit',()=>{
  for(const scenario of ['slow','far','different','floor','drag']) {
    const {context:c, tick, fields:f} = setup();
    c.beginEquipmentTextGesture('machine',pointer());
    if(scenario==='drag')c.dragHasMoved=true;
    c.finishEquipmentTextGesture(pointer());
    c.dragHasMoved=false;
    if(scenario==='slow')tick(451);
    if(scenario==='floor')c.currentFloor='2F';
    assert.equal(c.beginEquipmentTextGesture(scenario==='different'?'other':'machine',scenario==='far'?pointer(120,100):pointer()),false,scenario);
    assert.equal(f.quickRenameBox.style.display,'none');
  }
});

test('cancel and unchanged save do not modify records or create undo entries',()=>{
  const {context:c,item,fields:f,history,calls}=setup(), before=JSON.stringify(item);
  c.openQuickRenameBox('machine',790,590);
  assert.equal(f.quickRenameBox.style.left,'500px');
  assert.equal(f.quickRenameBox.style.top,'360px');
  f.quickRenameName.value='取消的文字'; c.closeQuickRenameBox(); c.saveQuickRename();
  assert.equal(JSON.stringify(item),before);
  c.openQuickRenameBox('machine',100,100); c.saveQuickRename();
  assert.equal(history.length,0); assert.equal(calls.saved,0);
});

test('saving text creates one undo snapshot and preserves CAD geometry and photo model',()=>{
  const {context:c,item,fields:f,history,calls}=setup(), before=JSON.stringify(item);
  const modelBefore=JSON.stringify(c.window.ChinChunModels.build(item));
  c.openQuickRenameBox('machine',100,100);
  f.quickRenameName.value=' 新設備 & 品檢 '; f.quickRenameCode.value=' 新編號-01 ';
  c.saveQuickRename();
  assert.equal(item.name,'新設備 & 品檢'); assert.equal(item.code,'新編號-01');
  assert.equal(item.photoModelCode,'G2-1');
  assert.equal(history.length,1); assert.equal(history[0],before); assert.equal(calls.saved,1);
  assert.equal(JSON.stringify(c.window.ChinChunModels.build(item)),modelBefore);
  assert.equal(c.window.ChinChunModels.rotationOffset(item),180);
  const old=JSON.parse(before);
  for(const key of ['id','x','y','width','height','rotation'])assert.equal(item[key],old[key]);
  assert.equal(f.quickRenameBox.style.display,'none');
  c.openQuickRenameBox('machine',100,100); f.quickRenameCode.value='再次改名'; c.saveQuickRename();
  assert.equal(item.photoModelCode,'G2-1');
});

test('locked layers block both opening and saving an already-open editor',()=>{
  const {context:c,item,fields:f,history,calls,lock}=setup(), before=JSON.stringify(item);
  c.openQuickRenameBox('machine',100,100); f.quickRenameCode.value='禁止變更'; lock(); c.saveQuickRename();
  c.openQuickRenameBox('machine',100,100);
  assert.equal(f.quickRenameBox.style.display,'none');
  assert.equal(JSON.stringify(item),before); assert.equal(history.length,0); assert.equal(calls.saved,0);
});

test('custom label markup is rendered as literal text, not SVG elements',()=>{
  const start=source.indexOf('  function escapeEquipmentText(');
  const end=source.indexOf('  function renderSingleItemSvg(',start);
  const c={}; vm.createContext(c); vm.runInContext(source.slice(start,end),c);
  assert.equal(c.escapeEquipmentText('<tspan>"新機" & \'ไทย\'</tspan>'),'&lt;tspan&gt;&quot;新機&quot; &amp; &#39;ไทย&#39;&lt;/tspan&gt;');
  assert.equal(c.escapeEquipmentText(null),'');
});
