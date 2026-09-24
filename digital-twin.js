/* Isometric presentation of the live CAD model. Heights are illustrative, not telemetry. */
(() => {
  'use strict';
  let data, bridge, dialog, canvas, ctx, floor = '1F', scene = [], hits = [];
  let zoom = 1, pan = { x:0, y:0 }, angle = 0, selected = null, frame = 0;
  let width = 1, height = 1, baseScale = 1, bounds, labels = true;
  const pointers = new Map();
  let gesture = null;
  let detail = false;
  const zh = {
    title:'廠房數位孿生', close:'返回平面圖', floor:'樓層', fit:'全覽', rotate:'旋轉視角', labels:'設備標籤',
    select:'選取物件', all:'選擇設備／柱子／牆面', empty:'點選場景中的物件，查看尺寸與位置。', edit:'在平面圖編輯',
    note:'配置同步 · 高度為示意 · 未接入即時機台訊號', help:'拖曳巡覽 · 滾輪／雙指縮放 · Esc 返回',
    equipment:'設備', column:'柱子', wall:'牆面', aisle:'走道', zone:'夾層區域', size:'平面尺寸', position:'座標', rotation:'角度', count:'物件',
    updated:'已載入目前圖面', floor1:'1F 主廠房', floor2:'2F 夾層', focus:'設備特寫', photo:'烘箱頂部 2.40 m（已確認）\n平面圖左側收料、右側入料\n其餘部件比例為照片估算', feed:'入料（兩人端）', collect:'收料（一人端）'
  };
  const th = {
    title:'ดิจิทัลทวินโรงงาน', close:'กลับแปลน', floor:'ชั้น', fit:'ดูทั้งหมด', rotate:'หมุนมุมมอง', labels:'ป้ายอุปกรณ์',
    select:'เลือกวัตถุ', all:'เลือกอุปกรณ์ / เสา / ผนัง', empty:'คลิกวัตถุเพื่อดูขนาดและตำแหน่ง', edit:'แก้ไขในแปลน',
    note:'ใช้ข้อมูลแปลนเดียวกัน · ความสูงสมมติ · ยังไม่มีข้อมูลเครื่องจักรสด', help:'ลากเพื่อเลื่อน · ล้อเมาส์ / สองนิ้วเพื่อซูม · Esc กลับ',
    equipment:'อุปกรณ์', column:'เสา', wall:'ผนัง', aisle:'ทางเดิน', zone:'พื้นที่ชั้นลอย', size:'ขนาดแปลน', position:'พิกัด', rotation:'มุม', count:'วัตถุ',
    updated:'โหลดแปลนปัจจุบันแล้ว', floor1:'1F โรงงาน', floor2:'2F ชั้นลอย', focus:'ดูอุปกรณ์ระยะใกล้', photo:'ด้านบนเตาอบ 2.40 ม. (ยืนยันแล้ว)\nในแปลน: รับงานออกด้านซ้าย ป้อนเข้าด้านขวา\nสัดส่วนชิ้นส่วนอื่นประมาณจากภาพ', feed:'ป้อนเข้า (ฝั่งสองคน)', collect:'รับงานออก (ฝั่งหนึ่งคน)'
  };
  const t = key => (document.documentElement.lang.startsWith('th') ? th : zh)[key];
  const n = (v, fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  function localize() {
    dialog.querySelectorAll('[data-twin-text]').forEach(el => { el.textContent = t(el.dataset.twinText); });
  }
  function rect(item, centered=false) {
    const w = Math.max(.05,n(item.width, .5)), h = Math.max(.05,n(item.height,.5));
    const cx = n(item.x) + (centered ? 0 : w/2), cy = n(item.y) + (centered ? 0 : h/2);
    const a = n(item.rotation)*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
    return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>[cx+x*c-y*s,cy+x*s+y*c]);
  }
  function rebuild() {
    if (!data) return;
    dialog.querySelector('#twinFloor').value=floor;
    scene = [];
    const add = (item,type,points,z,color) => scene.push({item,type,points,z,color,model:type==='equipment'?window.ChinChunModels?.build(item):null});
    if(floor==='2F') (data.mezzanine_2f?.zones || []).forEach(item=>add(item,'zone',rect(item),.04,'#91afac'));
    (floor==='2F' ? data.equipment_2f || [] : data.equipment || []).forEach(item => {
      const category = item.category || '';
      const z = /Door|Window/.test(category) ? .25 : /Furniture|Office/.test(category) ? .9 : 1.7;
      add(item,'equipment',rect(item),z,item.color || '#719f95');
    });
    (data.columns || []).filter(item => !item.floor || item.floor===floor).forEach(item => add(item,'column',rect(item,true),3.2,'#b7c8b9'));
    (data.walls || []).filter(item => (item.floor || '1F')===floor).forEach(item => {
      const dx=n(item.x2)-n(item.x1), dy=n(item.y2)-n(item.y1), len=Math.hypot(dx,dy);
      if (len<.001) return;
      const a=dy/len*n(item.thickness,.2)/2,b=-dx/len*n(item.thickness,.2)/2;
      add(item,'wall',[[n(item.x1)+a,n(item.y1)+b],[n(item.x2)+a,n(item.y2)+b],[n(item.x2)-a,n(item.y2)-b],[n(item.x1)-a,n(item.y1)-b]],1.2,'#ddd4b9');
    });
    (data.aisles || []).filter(item => (item.floor || '1F')===floor).forEach(item=>add(item,'aisle',rect(item),.02,'#b7bd85'));
    const points=scene.flatMap(s=>s.points);
    const indoor=floor==='1F' || !points.length;
    bounds={x0:Math.min(...(indoor?[0]:[]),...points.map(p=>p[0]))-4,y0:Math.min(...(indoor?[0]:[]),...points.map(p=>p[1]))-4,
      x1:Math.max(...(indoor?[n(data.grid?.factory_width,100)]:[]),...points.map(p=>p[0]))+4,y1:Math.max(...(indoor?[n(data.grid?.factory_depth,40)]:[]),...points.map(p=>p[1]))+4};
    selected=scene.find(s=>s.item.id===selected?.item.id) || null;
    if(!selected)detail=false;
    const list=dialog.querySelector('#twinObjects');
    list.replaceChildren(new Option(t('all'),''));
    scene.filter(s=>s.type!=='aisle').forEach(s=>list.add(new Option(`${s.item.code || s.item.name || s.item.id}`,s.item.id)));
    updateInfo();
    requestDraw();
  }
  function iso(x,y,z=0) {
    const a=angle*Math.PI/2,c=Math.cos(a),s=Math.sin(a),u=x*c-y*s,v=x*s+y*c;
    return [(u-v)*.866,(u+v)*.5-z];
  }
  function project(p,z=0) {
    const b=viewBounds(),v=iso(p[0],p[1],z), center=iso((b.x0+b.x1)/2,(b.y0+b.y1)/2,detail?1.3:0);
    return [width/2+pan.x+(v[0]-center[0])*baseScale*zoom,height/2+pan.y+(v[1]-center[1])*baseScale*zoom];
  }
  function shade(color, amount) {
    const hex=/^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : '719f95';
    return '#'+[0,2,4].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+amount)).toString(16).padStart(2,'0')).join('');
  }
  function polygon(points,fill,stroke='#34483f') {
    const path=new Path2D(); points.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p)); path.closePath();
    ctx.fillStyle=fill;ctx.fill(path);ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke(path); return path;
  }
  function requestDraw() { if(dialog?.open && !frame) frame=requestAnimationFrame(draw); }
  function viewBounds() {
    if(!detail || !selected)return bounds;
    return {x0:Math.min(...selected.points.map(p=>p[0]))-1,y0:Math.min(...selected.points.map(p=>p[1]))-1,
      x1:Math.max(...selected.points.map(p=>p[0]))+1,y1:Math.max(...selected.points.map(p=>p[1]))+1};
  }
  function viewDepth(p) {
    const a=angle*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);
    return p[0]*(c+sn)+p[1]*(c-sn)+p[2];
  }
  function faceDepth(points) { return points.reduce((sum,p)=>sum+viewDepth(p),0)/points.length; }
  function drawFace(f) {
    let color=f.color;
    if(f.model){
      const [a,b,c]=f.points,u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
      const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...normal)||1;
      const light=(normal[0]*.25-normal[1]*.35+Math.abs(normal[2])*.65)/len;
      color=shade(color,Math.round(light*32)-8);
    }
    hits.push({path:polygon(f.points.map(p=>project(p,p[2])),color,f.s===selected?'#fff5ac':'#42574c'),s:f.s});
  }
  function drawModelAnnotations(s) {
    if(s===selected){ctx.setLineDash([6,4]);ctx.lineWidth=2;ctx.strokeStyle='#ffe5a1';const path=new Path2D();s.points.forEach((p,i)=>i?path.lineTo(...project(p,.02)):path.moveTo(...project(p,.02)));path.closePath();ctx.stroke(path);ctx.setLineDash([]);}
    if(labels || s===selected){const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]),p=project(center,2.7);ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillStyle='#fff5d7';ctx.fillText(s.item.code,p[0],p[1]);}
    if(detail){
      // Labels follow local CAD ends through both equipment and camera rotation.
      [[0,3,'collect'],[1,2,'feed']].forEach(([i,j,key])=>{
        const p=project([(s.points[i][0]+s.points[j][0])/2,(s.points[i][1]+s.points[j][1])/2],1.55);
        ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#18332e';ctx.strokeText(t(key),p[0],p[1]);ctx.fillStyle='#fff5d7';ctx.fillText(t(key),p[0],p[1]);
      });
    }
  }
  function drawGroundContact(s) {
    // A thin footprint shadow stays on the floor, independent of the machine's height.
    const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
    const contact=s.points.map(p=>[center[0]+(p[0]-center[0])*1.035,center[1]+(p[1]-center[1])*1.035]);
    const path=new Path2D();contact.forEach((p,i)=>i?path.lineTo(...project(p,.012)):path.moveTo(...project(p,.012)));path.closePath();
    ctx.fillStyle='#263a35';ctx.globalAlpha=.35;ctx.fill(path);ctx.globalAlpha=1;
  }
  function objectFaces(s) {
    if(s.model)return s.model.map(f=>({s,points:f.points,color:f.color,model:true,depth:faceDepth(f.points)}));
    const bottom=s.points.map(p=>[...p,0]),top=s.points.map(p=>[...p,s.z]);
    const faces=[];
    for(let i=0;i<4;i++){const j=(i+1)%4;
      // Only camera-facing sides are visible; sort each side independently of other objects.
      if(project(s.points[j],s.z)[0]<project(s.points[i],s.z)[0]){
        const points=[bottom[i],bottom[j],top[j],top[i]];
        faces.push({s,points,color:shade(s.color,i%2?-45:-25),depth:faceDepth(points)});
      }
    }
    faces.push({s,points:top,color:shade(s.color,25),depth:faceDepth(top)});
    if(s.type==='equipment'){
      const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
      const points=s.points.map(p=>[center[0]+(p[0]-center[0])*.65,center[1]+(p[1]-center[1])*.65,s.z+.03]);
      faces.push({s,points,color:shade(s.color,-14),depth:faceDepth(points)});
    }
    return faces;
  }
  function draw() {
    frame=0;if(!dialog?.open || !bounds)return;
    const size=canvas.getBoundingClientRect();width=size.width;height=size.height;
    const dpr=Math.min(devicePixelRatio || 1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const b=viewBounds(),visible=detail&&selected?[selected]:scene;
    const corners=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]];
    const raw=corners.map(p=>iso(...p));
    baseScale=Math.min(width/(Math.max(...raw.map(p=>p[0]))-Math.min(...raw.map(p=>p[0]))+12),height/(Math.max(...raw.map(p=>p[1]))-Math.min(...raw.map(p=>p[1]))+14))*.9;
    hits=[];
    polygon(corners.map(p=>project(p,-1.4)),'#344938');
    polygon(corners.map(p=>project(p)),'#829477');
    const x0=Math.ceil(b.x0/5)*5,y0=Math.ceil(b.y0/5)*5;
    // Alternating stone tiles create the JRPG diorama ground without changing CAD dimensions.
    for(let x=x0;x<b.x1-5;x+=5)for(let y=y0;y<b.y1-5;y+=5){
      polygon([[x,y],[x+5,y],[x+5,y+5],[x,y+5]].map(p=>project(p)),(Math.round(x/5+y/5)%2)?'#bdc6ac':'#c8ceb6','#a6b499');
    }
    visible.filter(s=>s.type==='aisle' || s.type==='zone').forEach(s=>{const path=polygon(s.points.map(p=>project(p,.03)),s.color,'#e5dca2');hits.push({path,s});});
    (detail?[]:data.flows || []).filter(f=>(f.floor || '1F')===floor).forEach(f=>{
      if(!Array.isArray(f.points) || f.points.length<2)return;
      ctx.beginPath();f.points.forEach((p,i)=>{const v=project([n(p.x),n(p.y)],.08);i?ctx.lineTo(...v):ctx.moveTo(...v);});
      ctx.strokeStyle='#f8e7a1';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.stroke();ctx.setLineDash([]);
      const end=project([n(f.points.at(-1).x),n(f.points.at(-1).y)],.08),prev=project([n(f.points.at(-2).x),n(f.points.at(-2).y)],.08),a=Math.atan2(end[1]-prev[1],end[0]-prev[0]);
      polygon([end,[end[0]-9*Math.cos(a-.45),end[1]-9*Math.sin(a-.45)],[end[0]-9*Math.cos(a+.45),end[1]-9*Math.sin(a+.45)]],'#f8e7a1','#927d3b');
    });
    const solids=visible.filter(s=>s.type!=='aisle' && s.type!=='zone');
    solids.filter(s=>s.type==='equipment').forEach(drawGroundContact);
    // Painter order must be per face: a whole long machine can straddle a column.
    solids.flatMap(objectFaces).sort((a,b)=>a.depth-b.depth).forEach(drawFace);
    solids.forEach(s=>{
      if(s.model){drawModelAnnotations(s);return;}
      if(s.type==='equipment'){
        const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]),p=project(center,s.z+.1);
        ctx.fillStyle='#e4e5b3';ctx.fillRect(p[0]-2,p[1]-2,4,4);
        if((labels && baseScale*zoom>6)||s===selected){ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#243f36';ctx.strokeText(s.item.code || s.item.name || '',p[0],p[1]-10);ctx.fillStyle='#fff8df';ctx.fillText(s.item.code || s.item.name || '',p[0],p[1]-10);}
      }
      if(s===selected){
        const outline=new Path2D();s.points.forEach((p,i)=>i?outline.lineTo(...project(p,s.z)):outline.moveTo(...project(p,s.z)));outline.closePath();
        ctx.strokeStyle='#fff1a1';ctx.lineWidth=3;ctx.stroke(outline);
      }
    });
    dialog.querySelector('#twinCount').textContent=`${floor} / ${scene.length} ${t('count')} · ${t('updated')}`;
  }
  function updateInfo() {
    const s=selected, item=s?.item;
    dialog.querySelector('#twinName').textContent=item ? (item.code || item.name || item.id) : t('select');
    dialog.querySelector('#twinDetails').textContent=item ? `${t(s.type)} · ${item.name || item.id}\n${t('position')}: ${n(item.x ?? item.x1).toFixed(2)}, ${n(item.y ?? item.y1).toFixed(2)} m\n${t('size')}: ${s.type==='wall'?Math.hypot(n(item.x2)-n(item.x1),n(item.y2)-n(item.y1)).toFixed(2)+' × '+n(item.thickness,.2).toFixed(2):n(item.width).toFixed(2)+' × '+n(item.height).toFixed(2)} m\n${t('rotation')}: ${n(item.rotation).toFixed(0)}°` : t('empty');
    dialog.querySelector('#twinEdit').hidden=!s;
    dialog.querySelector('#twinFocus').hidden=!s;
    if(s?.model)dialog.querySelector('#twinDetails').textContent+='\n'+t('photo');
    dialog.querySelector('#twinObjects').value=item?.id || '';
  }
  function fit(){zoom=detail?1.5:1;pan={x:0,y:0};requestDraw();}
  function zoomAt(factor,x=width/2,y=height/2){const next=Math.max(.4,Math.min(8,zoom*factor)),ratio=next/zoom;pan={x:x-width/2-(x-width/2-pan.x)*ratio,y:y-height/2-(y-height/2-pan.y)*ratio};zoom=next;requestDraw();}
  function mount() {
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='twin-dialog';dialog.setAttribute('aria-labelledby','twinHeading');
    dialog.innerHTML=`<div class="twin-shell"><header class="twin-header"><div><div class="twin-eyebrow">CHIN CHUN · WORLD VIEW</div><h2 id="twinHeading"><span data-twin-text="title"></span> / 2.5D</h2></div><button id="twinClose" data-twin-text="close"></button></header><nav class="twin-toolbar"><label><span data-twin-text="floor"></span><select id="twinFloor"><option value="1F" data-twin-text="floor1"></option><option value="2F" data-twin-text="floor2"></option></select></label><button id="twinFit" data-twin-text="fit"></button><button id="twinRotate" data-twin-text="rotate"></button><button id="twinMinus" aria-label="Zoom out">−</button><button id="twinPlus" aria-label="Zoom in">＋</button><label><input id="twinLabels" type="checkbox" checked><span data-twin-text="labels"></span></label><label><span data-twin-text="select"></span><select id="twinObjects" style="max-width:220px"></select></label></nav><div class="twin-stage"><canvas aria-label="Isometric factory layout"></canvas><div class="twin-plaque">FACTORY ATLAS<br>配置世界 / ISOMETRIC DIORAMA</div><aside class="twin-info"><h3 id="twinName"></h3><p id="twinDetails"></p><button id="twinEdit" data-twin-text="edit" hidden></button></aside></div><footer class="twin-footer"><span id="twinCount"></span><span data-twin-text="help"></span></footer><div class="twin-footer" data-twin-text="note"></div></div>`;
    document.body.append(dialog);canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d');
    const focus=document.createElement('button');focus.id='twinFocus';focus.dataset.twinText='focus';focus.hidden=true;
    dialog.querySelector('.twin-toolbar').append(focus);
    focus.onclick=()=>{if(selected){detail=true;fit();}};
    // Keep CAD delete/rotate/undo shortcuts from changing the model behind the modal.
    dialog.addEventListener('keydown',e=>e.stopPropagation());
    dialog.addEventListener('keyup',e=>e.stopPropagation());
    dialog.querySelector('#twinClose').onclick=()=>dialog.close();
    dialog.querySelector('#twinFloor').onchange=e=>{floor=e.target.value;selected=null;rebuild();fit();};
    dialog.querySelector('#twinFit').onclick=()=>{detail=false;fit();};
    dialog.querySelector('#twinRotate').onclick=()=>{angle=(angle+1)%4;fit();};
    dialog.querySelector('#twinPlus').onclick=()=>zoomAt(1.25);
    dialog.querySelector('#twinMinus').onclick=()=>zoomAt(.8);
    dialog.querySelector('#twinLabels').onchange=e=>{labels=e.target.checked;requestDraw();};
    dialog.querySelector('#twinObjects').onchange=e=>{selected=scene.find(s=>s.item.id===e.target.value)||null;if(!selected)detail=false;updateInfo();if(detail)fit();else requestDraw();};
    dialog.querySelector('#twinEdit').onclick=()=>{if(selected){const id=selected.item.id;dialog.close();bridge?.edit(id,floor);}};
    canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.001),e.clientX-r.left,e.clientY-r.top);},{passive:false});
    canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture={x:e.clientX,y:e.clientY,moved:false};};
    canvas.onpointermove=e=>{
      const old=pointers.get(e.pointerId);if(!old || !gesture)return;
      const before=[...pointers.values()];pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){const after=[...pointers.values()],dist=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(dist(before)>0)zoomAt(dist(after)/dist(before));gesture.moved=true;}
      else {pan.x+=e.clientX-old.x;pan.y+=e.clientY-old.y;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>4)gesture.moved=true;requestDraw();}
    };
    canvas.onpointerup=e=>{
      if(gesture && !gesture.moved){const r=canvas.getBoundingClientRect();ctx.save();ctx.setTransform(1,0,0,1,0,0);selected=[...hits].reverse().find(h=>ctx.isPointInPath(h.path,e.clientX-r.left,e.clientY-r.top))?.s || (detail?selected:null);ctx.restore();updateInfo();requestDraw();}
      pointers.delete(e.pointerId);if(pointers.size===0)gesture=null;
    };
    canvas.onpointercancel=e=>{pointers.delete(e.pointerId);gesture=null;};
    dialog.addEventListener('close',()=>{pointers.clear();gesture=null;document.getElementById('openDigitalTwin')?.focus();});
    new ResizeObserver(requestDraw).observe(canvas);
  }
  window.ChinChunTwin={
    connect(api){bridge=api;document.getElementById('openDigitalTwin')?.addEventListener('click',()=>{mount();localize();detail=false;dialog.showModal();rebuild();fit();});},
    update(layout,activeFloor){data=layout;if(!dialog?.open){floor=activeFloor==='2F'?'2F':'1F';return;}rebuild();}
  };
})();
