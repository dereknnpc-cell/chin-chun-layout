/* Isometric presentation of the live CAD model. Heights are illustrative, not telemetry. */
(() => {
  'use strict';
  let data, bridge, dialog, canvas, ctx, floor = '1F', scene = [], hits = [];
  let zoom = 1, pan = { x:0, y:0 }, angle = 0, pitch = Math.atan(1/Math.SQRT2), selected = null, frame = 0;
  let width = 1, height = 1, baseScale = 1, bounds, labels = true;
  const baseHeight = .22;
  const factoryRise = 1.5;
  const pointers = new Map();
  let gesture = null;
  let detail = false;
  const zh = {
    title:'廠房數位孿生', close:'返回平面圖', floor:'樓層', fit:'全覽', rotate:'旋轉視角', labels:'設備標籤',
    select:'選取物件', all:'選擇設備／柱子／牆面', empty:'點選場景中的物件，查看尺寸與位置。', edit:'在平面圖編輯',
    note:'配置同步 · 廠內外高差約 1.5 m；台階與月台細節為照片示意 · 未接入即時機台訊號', help:'拖曳巡覽 · 滾輪縮放 · ⌘＋橫滾旋轉、縱滾傾斜（Shift＋縱滾旋轉） · Esc 返回',
    equipment:'設備', column:'柱子', wall:'牆面', aisle:'走道', zone:'夾層區域', size:'平面尺寸', position:'座標', rotation:'角度', count:'物件',
    updated:'已載入目前圖面', floor1:'1F 主廠房', floor2:'2F 夾層', focus:'設備特寫', photo:'烘箱頂部 2.40 m（已確認）\n平面圖左側收料、右側入料\n其餘部件比例為照片估算', feed:'入料（兩人端）', collect:'收料（一人端）', ramp:'坡道高差：約 1.50 m（廠內高、廠外低）', rampInside:'廠內 +1.5m', rampOutside:'廠外 0m', officeSteps:'辦公室入口台階跟隨 DOOR-1800 位置；階高為照片示意，待現場量測。', dockSite:'西側上貨月台依照片示意；廠內高於外側約 1.5 m。'
  };
  const th = {
    title:'ดิจิทัลทวินโรงงาน', close:'กลับแปลน', floor:'ชั้น', fit:'ดูทั้งหมด', rotate:'หมุนมุมมอง', labels:'ป้ายอุปกรณ์',
    select:'เลือกวัตถุ', all:'เลือกอุปกรณ์ / เสา / ผนัง', empty:'คลิกวัตถุเพื่อดูขนาดและตำแหน่ง', edit:'แก้ไขในแปลน',
    note:'ใช้ข้อมูลแปลนเดียวกัน · พื้นโรงงานสูงกว่าภายนอกประมาณ 1.5 ม.; ขั้นบันไดและท่าโหลดอ้างอิงภาพ · ยังไม่มีข้อมูลเครื่องจักรสด', help:'ลากเพื่อเลื่อน · ล้อเมาส์ซูม · ⌘ + เลื่อนแนวนอนหมุน แนวตั้งปรับมุมก้ม · Esc กลับ',
    equipment:'อุปกรณ์', column:'เสา', wall:'ผนัง', aisle:'ทางเดิน', zone:'พื้นที่ชั้นลอย', size:'ขนาดแปลน', position:'พิกัด', rotation:'มุม', count:'วัตถุ',
    updated:'โหลดแปลนปัจจุบันแล้ว', floor1:'1F โรงงาน', floor2:'2F ชั้นลอย', focus:'ดูอุปกรณ์ระยะใกล้', photo:'ด้านบนเตาอบ 2.40 ม. (ยืนยันแล้ว)\nในแปลน: รับงานออกด้านซ้าย ป้อนเข้าด้านขวา\nสัดส่วนชิ้นส่วนอื่นประมาณจากภาพ', feed:'ป้อนเข้า (ฝั่งสองคน)', collect:'รับงานออก (ฝั่งหนึ่งคน)', ramp:'ทางลาดต่างระดับประมาณ 1.50 ม. (ด้านในสูงกว่าด้านนอก)', rampInside:'ภายใน +1.5 ม.', rampOutside:'ภายนอก 0 ม.', officeSteps:'ขั้นทางเข้าสำนักงานยึดตำแหน่ง DOOR-1800; ความสูงเป็นภาพจำลองจากรูปถ่าย ต้องวัดจริง', dockSite:'ท่าโหลดฝั่งตะวันตกจำลองจากรูปถ่าย; พื้นในสูงกว่าด้านนอกประมาณ 1.5 ม.'
  };
  const t = key => (document.documentElement.lang.startsWith('th') ? th : zh)[key];
  const n = (v, fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const isRamp = item => /^RAMP(?:-|$)/i.test(String(item?.code || ''));
  // The reference photo marks the office entrance at the south wall between X6 and X7.
  const isOfficeEntry = item => /^DOOR-1800$/i.test(String(item?.code || '')) && n(item.x)+n(item.width)/2>=20 && n(item.x)+n(item.width)/2<=35 && n(item.y)+n(item.height)/2>=37 && n(item.y)+n(item.height)/2<=42;
  const inFactory = p => p[0]>=0 && p[0]<=n(data?.grid?.factory_width,100) && p[1]>=0 && p[1]<=n(data?.grid?.factory_depth,40);
  const elevation = s => {
    if(floor!=='1F' || isRamp(s.item))return 0;
    const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
    return (inFactory(center) || isOfficeEntry(s.item) && center[0]>=0 && center[0]<=n(data?.grid?.factory_width,100) && center[1]>=-.5 && center[1]<=n(data?.grid?.factory_depth,40)+.5) ? factoryRise : 0;
  };
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
      const z = isRamp(item) ? factoryRise : category==='Door' ? (/ROLL/i.test(item.code || '') ? 2.7 : 2.1) : category==='Window' ? .25 : /Furniture|Office/.test(category) ? .9 : 1.7;
      const points=rect(item);
      if(floor==='1F' && /ROLL/i.test(item.code || '') && Math.abs(n(item.x))<1){
        const center=points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
        points.forEach(p=>{p[0]-=center[0];});
      }
      add(item,'equipment',points,z,item.color || '#719f95');
    });
    (data.columns || []).filter(item => !item.floor || item.floor===floor).forEach(item => add(item,'column',rect(item,true),3.2,'#b7c8b9'));
    (data.walls || []).filter(item => (item.floor || '1F')===floor).forEach(item => {
      const dx=n(item.x2)-n(item.x1), dy=n(item.y2)-n(item.y1), len=Math.hypot(dx,dy);
      if (len<.001) return;
      const a=dy/len*n(item.thickness,.2)/2,b=-dx/len*n(item.thickness,.2)/2;
      let segments=[[0,1]];
      // A loading shutter must be an opening in the west wall, not painted over a solid wall.
      const cuts=[];
      if(floor==='1F' && Math.abs(n(item.x1))<.35 && Math.abs(n(item.x2))<.35){
        const shutters=(data.equipment || []).filter(q=>q.category==='Door' && /ROLL/i.test(q.code || '') && Math.abs(n(q.x))<1);
        cuts.push(...shutters.flatMap(q=>{
          const ys=rect(q).map(p=>p[1]),lo=Math.min(...ys),hi=Math.max(...ys);
          return [[(lo-n(item.y1))/dy,(hi-n(item.y1))/dy]];
        }));
      }
      if(floor==='1F' && Math.abs(dy)<.01){
        (data.equipment || []).filter(isOfficeEntry).forEach(q=>{
          const door=rect(q),xs=door.map(p=>p[0]),ys=door.map(p=>p[1]);
          if(Math.abs((Math.min(...ys)+Math.max(...ys))/2-n(item.y1))<.4)
            cuts.push([(Math.min(...xs)-n(item.x1))/dx,(Math.max(...xs)-n(item.x1))/dx]);
        });
      }
      for(const cut of cuts){
        const lo=Math.min(...cut),hi=Math.max(...cut);
        if(hi<=0 || lo>=1)continue;
        segments=segments.flatMap(([a,b])=>{
          const start=Math.max(a,lo),end=Math.min(b,hi);
          return end<=start?[[a,b]]:[...(a<start?[[a,start]]:[]),...(end<b?[[end,b]]:[])];
        });
      }
      segments.forEach(([start,end],index)=>{
        const p=(t,side)=>[n(item.x1)+dx*t+a*side,n(item.y1)+dy*t+b*side];
        add(index?{...item,id:`${item.id}_part_${index}`}:item,'wall',[p(start,1),p(end,1),p(end,-1),p(start,-1)],item.type==='exterior'?2.8:2.4,'#ddd4b9');
      });
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
    const scale=Math.sqrt(3/2),horizontal=scale/Math.SQRT2;
    return [(u-v)*horizontal,(u+v)*horizontal*Math.sin(pitch)-z*scale*Math.cos(pitch)];
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
    const xs=selected.points.map(p=>p[0]),ys=selected.points.map(p=>p[1]);
    if(isOfficeEntry(selected.item)){
      const entry=officeEntrance(selected);
      for(const p of [entry.edge(-entry.half,2.6),entry.edge(entry.half,2.6)]){xs.push(p[0]);ys.push(p[1]);}
    }
    if(selected.item.category==='Door' && /ROLL/i.test(selected.item.code || '') && Math.abs(n(selected.item.x))<1){xs.push(-2);ys.push(Math.min(...ys)-.5);}
    return {x0:Math.min(...xs)-1,y0:Math.min(...ys)-1,x1:Math.max(...xs)+1,y1:Math.max(...ys)+1};
  }
  function viewDepth(p) {
    const a=angle*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);
    const u=p[0]*c-p[1]*sn,v=p[0]*sn+p[1]*c;
    return (u+v)*Math.cos(pitch)/Math.SQRT2+p[2]*Math.sin(pitch);
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
    // Segmented walls need seamless joints; their selection outline is drawn once below.
    const stroke=f.stroke || (f.s===selected?'#fff5ac':'#42574c');
    hits.push({path:polygon(f.points.map(p=>project(p,p[2])),color,stroke),s:f.s});
  }
  function drawModelAnnotations(s) {
    const z=elevation(s);
    if(s===selected){ctx.setLineDash([6,4]);ctx.lineWidth=2;ctx.strokeStyle='#ffe5a1';const path=new Path2D();s.points.forEach((p,i)=>i?path.lineTo(...project(p,z+.02)):path.moveTo(...project(p,z+.02)));path.closePath();ctx.stroke(path);ctx.setLineDash([]);}
    if(labels || s===selected){const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]),p=project(center,z+2.7);ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillStyle='#fff5d7';ctx.fillText(s.item.code,p[0],p[1]);}
    if(detail){
      // Labels follow local CAD ends through both equipment and camera rotation.
      [[0,3,'collect'],[1,2,'feed']].forEach(([i,j,key])=>{
        const p=project([(s.points[i][0]+s.points[j][0])/2,(s.points[i][1]+s.points[j][1])/2],z+1.55);
        ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#18332e';ctx.strokeText(t(key),p[0],p[1]);ctx.fillStyle='#fff5d7';ctx.fillText(t(key),p[0],p[1]);
      });
    }
  }
  function drawGroundContact(s) {
    // A thin footprint shadow stays on the floor, independent of the object's height.
    let contact;
    if(s.type==='wall'){
      const [a,b,c,d]=s.points,dx=d[0]-a[0],dy=d[1]-a[1],length=Math.hypot(dx,dy)||1;
      const offset=[dx/length*.12,dy/length*.12];
      contact=[a.map((v,i)=>v-offset[i]),b.map((v,i)=>v-offset[i]),c.map((v,i)=>v+offset[i]),d.map((v,i)=>v+offset[i])];
    } else {
      const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
      contact=s.points.map(p=>[center[0]+(p[0]-center[0])*1.035,center[1]+(p[1]-center[1])*1.035]);
    }
    const path=new Path2D();contact.forEach((p,i)=>i?path.lineTo(...project(p,elevation(s)+.012)):path.moveTo(...project(p,elevation(s)+.012)));path.closePath();
    ctx.fillStyle='#263a35';ctx.globalAlpha=.35;ctx.fill(path);ctx.globalAlpha=1;
  }
  function wallFaces(s) {
    const [a,b,c,d]=s.points,length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const count=Math.max(1,Math.ceil(length/2));
    const lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
    const faces=[];
    for(let k=0;k<count;k++){
      // A tiny overlap prevents antialiased seams from showing as holes.
      const start=Math.max(0,(k-.015)/count),end=Math.min(1,(k+1+.015)/count);
      const footprint=[lerp(a,b,start),lerp(a,b,end),lerp(d,c,end),lerp(d,c,start)];
      const bottom=footprint.map(p=>[...p,0]),top=footprint.map(p=>[...p,s.z]);
      for(let i=0;i<4;i++){
        if((i===1 && k<count-1)||(i===3 && k>0))continue;
        const j=(i+1)%4;
        if(project(footprint[j],s.z)[0]<project(footprint[i],s.z)[0]){
          const points=[bottom[i],bottom[j],top[j],top[i]],color=shade(s.color,i%2?-45:-25);
          faces.push({s,points,color,stroke:color,depth:faceDepth(points)});
        }
      }
      faces.push({s,points:top,color:shade(s.color,25),stroke:shade(s.color,25),depth:faceDepth(top)});
    }
    return faces;
  }
  function columnFaces(s) {
    const faces=[],bands=[0,.8,1.6,2.4,s.z];
    for(let band=0;band<bands.length-1;band++){
      for(let i=0;i<4;i++){
        const j=(i+1)%4;
        if(project(s.points[j],s.z)[0]>=project(s.points[i],s.z)[0])continue;
        const points=[[...s.points[i],bands[band]],[...s.points[j],bands[band]],[...s.points[j],bands[band+1]],[...s.points[i],bands[band+1]]];
        const color=shade(s.color,i%2?-45:-25);
        faces.push({s,points,color,stroke:color,depth:faceDepth(points)});
      }
    }
    const points=s.points.map(p=>[...p,s.z]);
    faces.push({s,points,color:shade(s.color,25),depth:faceDepth(points)});
    return faces;
  }
  function equipmentBaseFaces(s) {
    const [a,b,,d]=s.points,along=[b[0]-a[0],b[1]-a[1]],across=[d[0]-a[0],d[1]-a[1]];
    const al=Math.hypot(...along)||1,bl=Math.hypot(...across)||1;
    const u=along.map(v=>v/al*.14),v=across.map(n=>n/bl*.14);
    const signs=[[-1,-1],[1,-1],[1,1],[-1,1]];
    const footprint=s.points.map((p,i)=>[p[0]+signs[i][0]*u[0]+signs[i][1]*v[0],p[1]+signs[i][0]*u[1]+signs[i][1]*v[1]]);
    const bottom=footprint.map(p=>[...p,0]),top=footprint.map(p=>[...p,baseHeight]),faces=[];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(project(footprint[j],baseHeight)[0]>=project(footprint[i],baseHeight)[0])continue;
      const points=[bottom[i],bottom[j],top[j],top[i]];
      const color=shade(s.color,-80);
      faces.push({s,points,color,stroke:color,depth:faceDepth(points)});
    }
    const color=shade(s.color,-58);
    faces.push({s,points:top,color,stroke:color,depth:faceDepth(top)});
    return faces;
  }
  function doorFaces(s) {
    const roll=/ROLL/i.test(s.item.code || ''),bottom=s.points.map(p=>[...p,0]),top=s.points.map(p=>[...p,s.z]),faces=[];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(project(s.points[j],s.z)[0]>=project(s.points[i],s.z)[0])continue;
      const points=[bottom[i],bottom[j],top[j],top[i]];
      faces.push({s,points,color:shade(s.color,roll?10:-10),depth:faceDepth(points)});
      if(i!==0 && i!==2)continue;
      const edge=(t,z)=>[s.points[i][0]*(1-t)+s.points[j][0]*t,s.points[i][1]*(1-t)+s.points[j][1]*t,z];
      const panel=[edge(.06,.1),edge(.94,.1),edge(.94,s.z-.1),edge(.06,s.z-.1)];
      const panelColor=roll?'#94a3b8':'#b7793e';
      const panelDepth=faceDepth(panel)+.02;
      faces.push({s,points:panel,color:panelColor,stroke:panelColor,depth:panelDepth});
      if(roll){
        for(let z=.35;z<s.z-.1;z+=.31){
          const slat=[edge(.07,z),edge(.93,z),edge(.93,z+.045),edge(.07,z+.045)];
          faces.push({s,points:slat,color:'#526477',stroke:'#526477',depth:panelDepth+.04+z*.001});
        }
      } else {
        [[.3,.85],[1.22,1.88]].forEach(([low,high])=>{
          const inset=[edge(.17,low),edge(.83,low),edge(.83,high),edge(.17,high)];
          faces.push({s,points:inset,color:'#8f562d',stroke:'#8f562d',depth:panelDepth+.04+low*.001});
        });
        const knob=[edge(.76,.98),edge(.82,.98),edge(.82,1.05),edge(.76,1.05)];
        faces.push({s,points:knob,color:'#f5d373',stroke:'#f5d373',depth:panelDepth+.06});
      }
    }
    faces.push({s,points:top,color:shade(s.color,28),depth:faceDepth(top)});
    return faces;
  }
  function rampTopPoints(s) {
    const [a,b,c,d]=s.points;
    const center=[n(data?.grid?.factory_width,100)/2,n(data?.grid?.factory_depth,40)/2];
    const distance=p=>Math.hypot(p[0]-center[0],p[1]-center[1]);
    // The five-metre dimension is the run of the slope; the 2.5-metre dimension is its width.
    const firstInside=distance([(a[0]+d[0])/2,(a[1]+d[1])/2])<=distance([(b[0]+c[0])/2,(b[1]+c[1])/2]);
    return s.points.map((p,i)=>[...p,(firstInside ? i===0 || i===3 : i===1 || i===2) ? s.z : 0]);
  }
  function rampFaces(s) {
    const top=rampTopPoints(s),bottom=s.points.map(p=>[...p,0]),faces=[];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(top[i][2]===0 && top[j][2]===0)continue;
      if(project(s.points[j],top[j][2])[0]>=project(s.points[i],top[i][2])[0])continue;
      const points=[bottom[i],bottom[j],top[j],top[i]];
      faces.push({s,points,color:shade(s.color,i%2?-55:-30),depth:faceDepth(points)});
    }
    const topDepth=faceDepth(top);
    faces.push({s,points:top,color:'#dca84f',depth:topDepth});
    const highFirst=top[0][2]>0,[highLeft,highRight,lowLeft,lowRight]=highFirst?[top[0],top[3],top[1],top[2]]:[top[1],top[2],top[0],top[3]];
    const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
    for(const t of [.2,.4,.6,.8]){
      const stripe=[lerp(highLeft,lowLeft,t),lerp(highRight,lowRight,t),lerp(highRight,lowRight,t+.018),lerp(highLeft,lowLeft,t+.018)];
      faces.push({s,points:stripe,color:'#f8ddb1',stroke:'#f8ddb1',depth:topDepth+.03+t*.001});
    }
    return faces;
  }
  function blockFaces(s,footprint,bottom,top,color) {
    const faces=[];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(project(footprint[j],top)[0]>=project(footprint[i],top)[0])continue;
      const points=[[...footprint[i],bottom],[...footprint[j],bottom],[...footprint[j],top],[...footprint[i],top]];
      faces.push({s,points,color:shade(color,i%2?-45:-25),depth:faceDepth(points)});
    }
    const points=footprint.map(p=>[...p,top]);
    faces.push({s,points,color:shade(color,18),depth:faceDepth(points)});
    return faces;
  }
  function officeEntrance(s) {
    const xs=s.points.map(p=>p[0]),ys=s.points.map(p=>p[1]);
    const horizontal=Math.max(...xs)-Math.min(...xs)>=Math.max(...ys)-Math.min(...ys);
    const midX=(Math.min(...xs)+Math.max(...xs))/2,midY=(Math.min(...ys)+Math.max(...ys))/2;
    const outward=horizontal?[0,midY>=n(data?.grid?.factory_depth,40)/2?1:-1]:[midX>=n(data?.grid?.factory_width,100)/2?1:-1,0];
    const tangent=horizontal?[1,0]:[0,1];
    const front=horizontal?[midX,outward[1]>0?Math.max(...ys):Math.min(...ys)]:[outward[0]>0?Math.max(...xs):Math.min(...xs),midY];
    const half=Math.max(1.4,(horizontal?Math.max(...xs)-Math.min(...xs):Math.max(...ys)-Math.min(...ys))/2+.45);
    return {half,outward,edge:(along,offset)=>[front[0]+tangent[0]*along+outward[0]*offset,front[1]+tangent[1]*along+outward[1]*offset]};
  }
  function siteFaces() {
    if(floor!=='1F')return [];
    const faces=[];
    const office=scene.find(s=>isOfficeEntry(s.item));
    if(office && (!detail || selected===office)){
      const entry=officeEntrance(office),steps=6,depth=.42;
      for(let k=0;k<steps;k++){
        const near=k*depth,far=near+depth;
        faces.push(...blockFaces(office,[entry.edge(-entry.half,near),entry.edge(entry.half,near),entry.edge(entry.half,far),entry.edge(-entry.half,far)],0,factoryRise*(steps-k)/steps,'#aeb8af'));
      }
    }
    const shutter=scene.find(s=>s.item.category==='Door' && /ROLL/i.test(s.item.code || '') && Math.abs(n(s.item.x))<1);
    if(shutter && (!detail || selected===shutter)){
      const ys=shutter.points.map(p=>p[1]),lo=Math.min(...ys),hi=Math.max(...ys);
      const landing=[[-2,lo-.45],[.05,lo-.45],[.05,hi+.45],[-2,hi+.45]];
      faces.push(...blockFaces(shutter,landing,0,factoryRise,'#a6a79c'));
      const line=[[-2,lo-.36,factoryRise+.025],[-1.86,lo-.36,factoryRise+.025],[-1.86,hi+.36,factoryRise+.025],[-2,hi+.36,factoryRise+.025]];
      faces.push({s:shutter,points:line,color:'#f0c35b',stroke:'#f0c35b',depth:faceDepth(line)+.05});
    }
    return faces;
  }
  function drawOfficeFacade() {
    if(floor!=='1F')return;
    const office=scene.find(s=>isOfficeEntry(s.item));
    if(!office || (detail && selected!==office))return;
    const entry=officeEntrance(office),z=elevation(office),out=entry.edge(0,.08),inside=entry.edge(0,-1);
    if(viewDepth([...out,0])<=viewDepth([...inside,0]))return;
    const glass=[entry.edge(-.9,.05),entry.edge(.9,.05),entry.edge(.9,.05),entry.edge(-.9,.05)].map((p,i)=>[...p,i<2?z+.12:z+2.45]);
    hits.push({path:polygon(glass.map(p=>project(p,p[2])),'#6d9ba4','#e9eee4'),s:office});
    const mullion=[entry.edge(-.035,.06),entry.edge(.035,.06),entry.edge(.035,.06),entry.edge(-.035,.06)].map((p,i)=>[...p,i<2?z+.12:z+2.45]);
    polygon(mullion.map(p=>project(p,p[2])),'#e3e8dc','#e3e8dc');
    const canopy=[entry.edge(-2.2,-.05),entry.edge(2.2,-.05),entry.edge(2.2,.72),entry.edge(-2.2,.72)].map(p=>[...p,z+2.67]);
    polygon(canopy.map(p=>project(p,p[2])),'#cfd7cf','#edf1e7');
  }
  function objectFaces(s) {
    const rise=elevation(s);
    const lift=faces=>rise?faces.map(f=>{const points=f.points.map(p=>[p[0],p[1],p[2]+rise]);return {...f,points,depth:faceDepth(points)};}):faces;
    if(s.model)return lift(s.model.map(f=>({s,points:f.points,color:f.color,model:true,depth:faceDepth(f.points)})));
    if(s.type==='wall')return lift(wallFaces(s));
    if(s.type==='column')return lift(columnFaces(s));
    if(s.item.category==='Door')return lift(doorFaces(s));
    if(isRamp(s.item))return rampFaces(s);
    const hasBase=s.type==='equipment' && !/Window|Furniture|Office/.test(s.item.category || '');
    const bottom=s.points.map(p=>[...p,hasBase ? baseHeight : 0]),top=s.points.map(p=>[...p,s.z]);
    const faces=hasBase?equipmentBaseFaces(s):[];
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
    return lift(faces);
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
    if(floor==='1F'){
      const slabWidth=n(data.grid?.factory_width,100),slabDepth=n(data.grid?.factory_depth,40);
      const left=Math.max(0,b.x0),right=Math.min(slabWidth,b.x1),top=Math.max(0,b.y0),bottom=Math.min(slabDepth,b.y1);
      const slab=[[left,top],[right,top],[right,bottom],[left,bottom]];
      if(right>left && bottom>top){
      for(let i=0;i<4;i++){
        const j=(i+1)%4;
        if(project(slab[j],factoryRise)[0]>=project(slab[i],factoryRise)[0])continue;
        polygon([[...slab[i],0],[...slab[j],0],[...slab[j],factoryRise],[...slab[i],factoryRise]].map(p=>project(p,p[2])),'#68766f','#52625a');
      }
      polygon(slab.map(p=>project(p,factoryRise)),'#c3c6af','#697b6c');
      for(let x=Math.floor(left/5)*5;x<right;x+=5)for(let y=Math.floor(top/5)*5;y<bottom;y+=5){
        polygon([[x,y],[x+5,y],[x+5,y+5],[x,y+5]].map(p=>project(p,factoryRise)),(Math.round(x/5+y/5)%2)?'#c4c8b4':'#cdd0bc','#aeb7a4');
      }
      }
    }
    visible.filter(s=>s.type==='aisle' || s.type==='zone').forEach(s=>{const path=polygon(s.points.map(p=>project(p,elevation(s)+.03)),s.color,'#e5dca2');hits.push({path,s});});
    (detail?[]:data.flows || []).filter(f=>(f.floor || '1F')===floor).forEach(f=>{
      if(!Array.isArray(f.points) || f.points.length<2)return;
      ctx.beginPath();f.points.forEach((p,i)=>{const xy=[n(p.x),n(p.y)],v=project(xy,.08+(floor==='1F' && inFactory(xy)?factoryRise:0));i?ctx.lineTo(...v):ctx.moveTo(...v);});
      ctx.strokeStyle='#f8e7a1';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.stroke();ctx.setLineDash([]);
      const endPoint=[n(f.points.at(-1).x),n(f.points.at(-1).y)],prevPoint=[n(f.points.at(-2).x),n(f.points.at(-2).y)];
      const end=project(endPoint,.08+(floor==='1F' && inFactory(endPoint)?factoryRise:0)),prev=project(prevPoint,.08+(floor==='1F' && inFactory(prevPoint)?factoryRise:0)),a=Math.atan2(end[1]-prev[1],end[0]-prev[0]);
      polygon([end,[end[0]-9*Math.cos(a-.45),end[1]-9*Math.sin(a-.45)],[end[0]-9*Math.cos(a+.45),end[1]-9*Math.sin(a+.45)]],'#f8e7a1','#927d3b');
    });
    const solids=visible.filter(s=>s.type!=='aisle' && s.type!=='zone');
    solids.filter(s=>s.type==='equipment' || s.type==='wall').forEach(drawGroundContact);
    // Painter order must be per face: a whole long machine can straddle a column.
    [...solids.flatMap(objectFaces),...siteFaces()].sort((a,b)=>a.depth-b.depth).forEach(drawFace);
    // Continuous wall crowns prevent gaps where independently sorted wall sections meet.
    solids.filter(s=>s.type==='wall').forEach(s=>{
      const path=polygon(s.points.map(p=>project(p,elevation(s)+s.z)),shade(s.color,25),'#f1e6ca');
      hits.push({path,s});
    });
    solids.filter(s=>s.type==='column').forEach(s=>{
      const path=polygon(s.points.map(p=>project(p,elevation(s)+s.z)),shade(s.color,25),'#42574c');
      hits.push({path,s});
    });
    // Machine roofs are uninterrupted surfaces; redraw only their tops above columns.
    solids.filter(s=>s.type==='equipment' && !s.model && s.item.category!=='Door' && !isRamp(s.item)).forEach(s=>{
      const top=s.points.map(p=>project(p,elevation(s)+s.z));
      hits.push({path:polygon(top,shade(s.color,25),'#42574c'),s});
      const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
      const inset=s.points.map(p=>[center[0]+(p[0]-center[0])*.65,center[1]+(p[1]-center[1])*.65]);
      polygon(inset.map(p=>project(p,elevation(s)+s.z+.03)),shade(s.color,-14),shade(s.color,-35));
    });
    drawOfficeFacade();
    solids.forEach(s=>{
      if(s.model){drawModelAnnotations(s);return;}
      if(s.type==='equipment'){
        const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]),p=project(center,elevation(s)+(isRamp(s.item)?s.z/2+.12:s.z+.1));
        ctx.fillStyle='#e4e5b3';ctx.fillRect(p[0]-2,p[1]-2,4,4);
        if((labels && baseScale*zoom>6)||s===selected){ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#243f36';ctx.strokeText(s.item.code || s.item.name || '',p[0],p[1]-10);ctx.fillStyle='#fff8df';ctx.fillText(s.item.code || s.item.name || '',p[0],p[1]-10);}
        if(isRamp(s.item) && detail){
          const top=rampTopPoints(s),high=top.filter(q=>q[2]>0),low=top.filter(q=>q[2]===0);
          [[high,'rampInside'],[low,'rampOutside']].forEach(([edge,key])=>{
            const q=project([(edge[0][0]+edge[1][0])/2,(edge[0][1]+edge[1][1])/2],edge[0][2]+.2);
            ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#3e392b';ctx.strokeText(t(key),q[0],q[1]);ctx.fillStyle='#fff1c8';ctx.fillText(t(key),q[0],q[1]);
          });
        }
      }
      if(s===selected){
        const outline=new Path2D(),outlinePoints=isRamp(s.item)?rampTopPoints(s):s.points.map(p=>[...p,elevation(s)+s.z]);
        outlinePoints.forEach((p,i)=>i?outline.lineTo(...project(p,p[2])):outline.moveTo(...project(p,p[2])));outline.closePath();
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
    if(item && isRamp(item))dialog.querySelector('#twinDetails').textContent+='\n'+t('ramp');
    if(item && isOfficeEntry(item))dialog.querySelector('#twinDetails').textContent+='\n'+t('officeSteps');
    if(item?.category==='Door' && /ROLL/i.test(item.code || '') && Math.abs(n(item.x))<1)dialog.querySelector('#twinDetails').textContent+='\n'+t('dockSite');
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
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();
      const unit=e.deltaMode===1?16:e.deltaMode===2?height:1;
      let dx=e.deltaX*unit,dy=e.deltaY*unit;
      if(e.metaKey){
        // Trackpad/Magic Mouse: horizontal orbit, vertical tilt. Shift+wheel orbits on a regular mouse.
        if(e.shiftKey && Math.abs(dx)<.01){dx=dy;dy=0;}
        angle=((angle+dx*.0035)%4+4)%4;
        pitch=Math.max(Math.PI/10,Math.min(Math.PI*7/18,pitch+dy*.0025));
        requestDraw();
      } else {
        const r=canvas.getBoundingClientRect();
        zoomAt(Math.exp(-dy*.001),e.clientX-r.left,e.clientY-r.top);
      }
    },{passive:false});
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
