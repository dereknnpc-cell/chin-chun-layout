const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
const source=read('app.js'),html=read('index.html');

test('all original controls retain unique IDs; layers left, equipment and properties right, system actions on demand',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  const layers=html.slice(html.indexOf('<details class="layer-sidebar"'),html.indexOf('<!-- Right dropdown:'));
  for(const id of ['toggleEquipment','toggleGrid','toggleWalls','toggleFlows','toggleDims','toggleAisles','toggleMezzanine','toggleHandrails','toggleStairs'])assert.ok(layers.includes(`id="${id}"`));
  const system=html.slice(html.indexOf('id="systemMenu"'),html.indexOf('<!-- Row 2:'));
  for(const id of ['openCloudBtn','btnAddFloorModalBtn','saveJsonBtn','importJsonInput','exportSvgBtn','loadDesktopBaselineBtn'])assert.ok(system.includes(`id="${id}"`));
  assert.match(html,/<aside[^>]+id="mobileLibraryPanel"[^>]+inert>/);
  assert.match(html,/<aside[^>]+id="inspectorPanel"[^>]+inert>/);
  assert.ok(html.indexOf('id="mobileLibraryBtn"')<html.indexOf('</header>'));
});

function controller(mobile=true){
  function element(){const events={},classes=new Set();return {events,open:false,attrs:{},inert:false,
    classList:{contains:n=>classes.has(n),toggle(n,value){value?classes.add(n):classes.delete(n);}},
    setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){events[k]=fn;},focus(){this.focused=true;},
    querySelector(){return this;},contains(target){return target===this;}};}
  const ids=Object.fromEntries(['mobileLibraryPanel','mobileLibraryBtn','mobileCanvasBtn','mobileInspectorBtn','mobilePanelScrim','layerSidebar','inspectorPanel'].map(id=>[id,element()]));
  const menus=[element(),element()],closes=[element()],doc=element(),media=element();media.matches=mobile;
  const context={document:{getElementById:id=>ids[id],querySelectorAll:s=>s==='.workspace-menu'?menus:closes,addEventListener:doc.addEventListener},
    window:{matchMedia:()=>media,innerWidth:mobile?390:1280,addEventListener(){},clearTimeout(){},setTimeout(){}},
    inspectorPanel:ids.inspectorPanel,requestAnimationFrame:fn=>fn(),fitToScreen(){}};
  vm.runInNewContext(source.slice(source.indexOf('  function bindMobileWorkspace()'),source.indexOf('  // --- Dynamic Floor Management')),context);
  context.bindMobileWorkspace();return {ids,menus,doc,media,closes};
}
test('right dropdowns toggle independently, never overlap, support close/Escape, and keep hidden panels inert',()=>{
  const {ids,doc,closes}=controller();
  assert.equal(ids.layerSidebar.open,false);assert.equal(ids.mobileLibraryPanel.inert,true);
  ids.mobileLibraryBtn.events.click();assert.equal(ids.mobileLibraryPanel.inert,false);assert.equal(ids.mobileLibraryBtn.attrs['aria-expanded'],'true');
  ids.mobileInspectorBtn.events.click();assert.equal(ids.mobileLibraryPanel.inert,true);assert.equal(ids.inspectorPanel.inert,false);
  doc.events.keydown({key:'Escape'});assert.equal(ids.inspectorPanel.inert,true);assert.equal(ids.mobileInspectorBtn.focused,true);
  ids.mobileLibraryBtn.events.click();closes[0].events.click();assert.equal(ids.mobileLibraryPanel.inert,true);assert.equal(ids.mobileLibraryBtn.focused,true);
  ids.mobileLibraryBtn.events.click();ids.mobilePanelScrim.events.click();assert.equal(ids.mobileLibraryBtn.attrs['aria-expanded'],'false');
});
test('desktop layers default open; breakpoint changes close mobile overlays without reading or writing CAD data',()=>{
  const {ids,media,menus}=controller(false);assert.equal(ids.layerSidebar.open,true);
  ids.mobileLibraryBtn.events.click();menus[0].open=true;menus[0].events.toggle();assert.equal(ids.mobileLibraryPanel.inert,true);
  media.matches=true;media.events.change();assert.equal(ids.layerSidebar.open,false);
  const controllerSource=source.slice(source.indexOf('  function bindMobileWorkspace()'),source.indexOf('  // --- Dynamic Floor Management'));
  assert.doesNotMatch(controllerSource,/layoutData|localStorage|scheduleSave|pushHistoryState/);
});
test('phone fitting preserves aspect, centers every drawing extent including negative positions, and changes no input',()=>{
  const context={};vm.runInNewContext(source.slice(source.indexOf('  function fitDrawingBounds('),source.indexOf('  function fitToScreen()')),context);
  for(const [w,h] of [[360,724],[390,768],[844,314],[900,700]]){
    const bounds={x:-150,y:-200,width:2700,height:1900},before=JSON.stringify(bounds),r=context.fitDrawingBounds(bounds,w,h);
    assert.equal(JSON.stringify(bounds),before);assert.ok(Math.abs(r.width/r.height-w/h)<1e-10);
    assert.ok(r.x<bounds.x && r.y<bounds.y);assert.ok(r.x+r.width>bounds.x+bounds.width);assert.ok(r.y+r.height>bounds.y+bounds.height);
    assert.ok(Math.abs(r.x+r.width/2-(bounds.x+bounds.width/2))<1e-8);
  }
  assert.match(source,/window.innerWidth <= 900 && currentFloor !== "2F" && siteViewMode !== "max"/,'preserve the existing 2F mezzanine and explicit wide-site cameras');
});
