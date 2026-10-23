const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../digital-twin.js'),'utf8');
const controller=source.slice(source.indexOf('  function bindCompactTwinControls('),source.indexOf('  function mount()'));

function setup(isMobile=true){
  class Element {
    constructor(tag='div',id='',className=''){Object.assign(this,{tag,id,className,children:[],parent:null,attrs:{},events:{},dataset:{},hidden:false});}
    remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
    append(...nodes){for(const node of nodes){node.remove();node.parent=this;this.children.push(node);}}
    before(node){const parent=this.parent;node.remove();node.parent=parent;parent.children.splice(parent.children.indexOf(this),0,node);}
    after(node){const parent=this.parent;node.remove();node.parent=parent;parent.children.splice(parent.children.indexOf(this)+1,0,node);}
    closest(tag){return this.tag===tag?this:this.parent?.closest(tag)||null;}
    all(){return this.children.flatMap(node=>[node,...node.all()]);}
    querySelector(selector){return this.all().find(node=>selector[0]==='#'?node.id===selector.slice(1):node.className.split(' ').includes(selector.slice(1)));}
    querySelectorAll(){return this.all().filter(node=>['twin-info','twin-footer'].includes(node.className));}
    setAttribute(key,value){this.attrs[key]=value;}
    getAttribute(key){return this.attrs[key]??null;}
    addEventListener(key,fn){this.events[key]=fn;}
    focus(){this.focused=true;}
  }
  const root=new Element('dialog'),shell=new Element('div','','twin-shell'),toolbar=new Element('nav','','twin-toolbar'),stage=new Element('div','','twin-stage');
  root.append(shell);shell.append(toolbar,stage);
  const controls={};
  for(const id of ['twinFloor','twinFit','twinRotate','twinOrbitLeft','twinTiltUp','twinTiltDown','twinResetView','twinTopView','twinMinus','twinPlus','twinCameraStatus','twinFocus','twinEngine','twinLabels','twinRoof','twinPhotoDirections','twinRestroomCutaway','twinEngineStatus','twinObjects']){
    const control=new Element('button',id);controls[id]=control;control.onclick=()=>id;
    if(['twinFloor','twinEngine','twinLabels','twinObjects'].includes(id)){const label=new Element('label');label.append(control);toolbar.append(label);}else toolbar.append(control);
  }
  controls.twinObjects.value='machine-42';controls.twinLabels.checked=true;controls.twinFocus.hidden=true;
  const info=new Element('aside','','twin-info'),footer=new Element('footer','','twin-footer'),note=new Element('div','','twin-footer');stage.append(info);shell.append(footer,note);
  const media={matches:isMobile,addEventListener(_name,fn){this.change=fn;}};
  const context={window:{matchMedia:()=>media},document:{createElement:tag=>new Element(tag),createComment:()=>new Element('comment')},t:key=>key};
  vm.runInNewContext(controller,context);const collapse=context.bindCompactTwinControls(root);
  return {root,shell,toolbar,stage,controls,info,footer,note,media,collapse,find:id=>root.querySelector('#'+id)};
}
test('mobile defaults to three closed menus, moves information off the canvas and reuses every original control',()=>{
  const s=setup();
  for(const name of ['view','display','info']){assert.equal(s.find(`twin${name}Panel`).hidden,true);assert.equal(s.find(`twin${name}Menu`).getAttribute('aria-expanded'),'false');}
  for(const [id,control] of Object.entries(s.controls)){assert.equal(s.find(id),control);assert.equal(control.onclick(),id);}
  assert.equal(s.info.parent,s.find('twininfoPanel'));assert.equal(s.footer.parent,s.find('twininfoPanel'));assert.equal(s.note.parent,s.find('twininfoPanel'));
  assert.equal(s.controls.twinFloor.closest('label').parent,s.toolbar);assert.equal(s.controls.twinFit.parent,s.toolbar);
});
test('only one mobile menu opens; close, backdrop and Escape collapse it without dismissing the 3D dialog',()=>{
  const s=setup(),view=s.find('twinviewMenu'),display=s.find('twindisplayMenu');
  view.events.click();assert.equal(s.find('twinviewPanel').hidden,false);
  display.events.click();assert.equal(s.find('twinviewPanel').hidden,true);assert.equal(s.find('twindisplayPanel').hidden,false);
  const event={key:'Escape',preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};
  s.root.events.keydown(event);assert.ok(event.prevented && event.stopped);assert.equal(s.find('twindisplayPanel').hidden,true);assert.equal(display.focused,true);
  view.events.click();s.shell.children.find(n=>n.className==='twin-menu-backdrop').events.click();assert.equal(s.find('twinviewPanel').hidden,true);
  view.events.click();s.find('twinviewPanel').children[0].children[1].events.click();assert.equal(s.find('twinviewPanel').hidden,true);
  const unhandled={key:'Escape'};s.root.events.keydown(unhandled);assert.equal(unhandled.prevented,undefined,'normal Escape remains available to close the dialog');
});
test('desktop restores information to its original slots and makes all controls available; responsive changes preserve values',()=>{
  const s=setup();s.media.matches=false;s.media.change();
  assert.equal(s.info.parent,s.stage);assert.equal(s.footer.parent,s.shell);assert.equal(s.note.parent,s.shell);
  for(const name of ['view','display','info'])assert.equal(s.find(`twin${name}Panel`).hidden,false);
  s.media.matches=true;s.media.change();assert.equal(s.info.parent,s.find('twininfoPanel'));
  assert.equal(s.controls.twinObjects.value,'machine-42');assert.equal(s.controls.twinLabels.checked,true);assert.equal(s.controls.twinFocus.hidden,true);
  assert.equal(s.root.all().filter(n=>n.id==='twinObjects').length,1);
});
test('close and reopening start collapsed; presentation controller cannot write layout, models or camera state',()=>{
  const s=setup();s.find('twininfoMenu').events.click();s.root.events.close();assert.equal(s.find('twininfoPanel').hidden,true);
  s.find('twinviewMenu').events.click();s.collapse();assert.equal(s.find('twinviewPanel').hidden,true);
  assert.doesNotMatch(controller,/layoutData|localStorage|scheduleSave|setScene|setCamera|threeView|pushHistoryState/);
});
