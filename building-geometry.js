/* A3 architectural reference. Pure transformations; no network/storage writes.
   L-02/L-03 overall dimensions, A-02/A-03 axes, A-05 clear heights.
   Interior lines without written dimensions are traced estimates, not a survey. */
(() => {
  'use strict';
  const revision='a3-180-20261022';
  const round=n=>Math.round(n*100)/100;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inside=(r,p)=>p[0]>=r.x-1e-6 && p[0]<=r.x+r.width+1e-6 && p[1]>=r.y-1e-6 && p[1]<=r.y+r.height+1e-6;
  function reference() {
    // Plot width 109.80, side setbacks 6.00 + 6.00. L-02 canopy
    // offsets: 6.29 from left plot edge, 38.82 from right plot edge.
    const mainWidth=round(109.8-6-6),annexWidth=round(109.8-6.29-38.82);
    const annexRight=round(mainWidth-(6.29-6)),annexLeft=round(annexRight-annexWidth);
    return {revision,source:'แบบขออนุญาต A3.pdf',sourceRotation:180,
      main:{x:0,y:0,width:mainWidth,height:40,rise:1.5,color:'#a855cf'},
      annex:{x:annexLeft,y:40,width:annexWidth,height:19,rise:1,color:'#d3a42b',axisDepth:18.3,eave:.7,clearHeight:5.5},
      extension:{x:round(annexRight-10),y:40,width:10,height:19,rise:1,color:'#32984b',axisBays:[5,5],axisDepth:18.3,clearHeight:4.6},
      roof:{x:round(annexLeft-1.38),y:40,width:round(annexWidth+1.38),height:19},
      roadRise:0,partitionAccuracy:'scaled-trace',columnStatus:'Existing EPS reference columns retained; not re-surveyed',
      derivations:['Main width = 109.80 - 6.00 - 6.00 = 97.80 m',
        'Canopy width = 109.80 - 6.29 - 38.82 = 64.69 m',
        'A-B axes = 18.30 m; outer edge includes 0.70 m = 19.00 m',
        'Roof edge from L-03 has 37.44 m setback; 1.38 m beyond L-02 edge']};
  }
  function get(layout) {
    const b=layout?.building_geometry;
    if(b?.revision!==revision)return null;
    for(const key of ['main','annex','extension','roof']){
      const r=b[key];
      if(!r || !['x','y','width','height'].every(k=>Number.isFinite(r[k])) || r.width<=0 || r.height<=0)return null;
    }
    if(!['main','annex','extension'].every(k=>Number.isFinite(b[k].rise)) || !Number.isFinite(b.roadRise))return null;
    return b;
  }
  function floorLevel(layout,p) {
    const b=get(layout);if(!b)return null;
    return inside(b.main,p)?b.main.rise:inside(b.annex,p)?b.annex.rise:b.roadRise;
  }
  function partitions(b=reference()) {
    const walls=[];
    const add=(name,x1,y1,x2,y2,estimated=true)=>walls.push({id:`a3_wall_${walls.length+1}`,name,
      x1:round(x1),y1:round(y1),x2:round(x2),y2:round(y2),thickness:estimated?.15:.2,
      type:estimated?'interior':'exterior',floor:'1F',source:'A3 L-02',sourceAccuracy:estimated?'scaled-trace':'dimension-chain',
      description:estimated?'A3 隔間按圖面比例描繪；未標尺寸，待現場量測':'A3 尺寸鏈校正外牆；建築基準旋轉 180°'});
    const w=b.main.width,h=b.main.height;
    add('A3 原廠房北牆',0,0,w,0,false);add('A3 原廠房東牆',w,0,w,h,false);
    add('A3 原廠房南牆／外廠房連接牆',0,h,w,h,false);add('A3 原廠房西牆',0,0,0,h,false);
    // Coordinates below are in the original L-02 plan (west-to-east and
    // top-to-bottom), rotated once around the main building center. Never
    // rotate/scale equipment, doors, columns or circulation with this trace.
    const trace=(name,x1,y1,x2,y2)=>add(name,w-x1,h-y1,w-x2,h-y2);
    const traces=[
      ['東側原有房間',10.5,0,10.5,20],['東側房間中隔牆',0,20,15,20],
      ['東側下段房間',6,25,6,40],['東側小房間',5.2,0,5.2,5.3],['東側小房間',0,5.3,5.2,5.3],
      ['東側大房間',0,11.1,7.3,11.1],['東側大房間',7.3,11.1,7.3,20],
      ['東側房間通道',15,0,15,15],['東側房間通道',15,20,15,25],['東側房間通道',15,30,15,40],
      ['原廠房辦公通道',41,0,41,23.3],['原廠房辦公通道',41,24.7,56,24.7],
      ['南側辦公室外牆',44.1,0,44.1,6],['南側辦公室外牆',44.1,7.3,44.1,10],
      ['南側辦公室',50,0,50,10],['南側辦公室',55,0,55,10],
      ['南側辦公室',60,5,60,10],['南側辦公室',65,0,65,9],
      ['南側辦公室橫牆',44.1,10,46.4,10],['南側辦公室橫牆',47.7,10,50.2,10],
      ['南側辦公室橫牆',51.6,10,54.8,10],['南側辦公室橫牆',56.2,10,58.8,10],
      ['南側辦公室橫牆',60.3,10,64.5,10],['南側辦公室橫牆',65.9,10,82.8,10],
      ['南側辦公室內牆',44.1,3.2,50,3.2],['南側辦公室內牆',44.1,6.2,50,6.2],
      ['南側辦公室內牆',50,4.1,55,4.1],['南側辦公室內牆',60,5,65,5],
      ['南側辦公室',72.6,0,72.6,10],['南側辦公室',82.8,0,82.8,10],
      ['中央獨立房間',44.1,13,45,13],['中央獨立房間',46.5,13,56,13],
      ['中央獨立房間',44.1,13,44.1,22],['中央獨立房間',44.1,22,56,22],
      ['中央獨立房間',56,13,56,22],['中央獨立房間',50,13,50,22],
      ['中央獨立房間',50,17,56,17],['中央獨立房間',53,17,53,22],
      ['北側辦公室',47,24.7,47,40],['北側辦公室',56,24.7,56,40],
      ['北側辦公室',47,34.8,50,34.8],['北側辦公室',50,34.8,50,40],
      ['原兩棟分界',65,10,65,15],['原兩棟分界',65,30,65,40],
      ['西側梯廳',60,15,65,15],['西側梯廳',60,15,60,19.4],
      ['西側梯廳',60,25,60,30],['西側梯廳',60,30,65,30],
      ['東側梯廳',15,15,20,15],['東側梯廳',20,15,20,19.4],
      ['東側梯廳',20,25,20,30],['東側梯廳',15,30,20,30]
    ];
    traces.forEach(v=>trace(...v));return walls;
  }
  function apply(candidate) {
    const result=clone(candidate);
    if(get(result))return result; // Reload/reapply never wipes subsequent wall edits.
    const b=reference(),oldMain=(result.walls || []).filter(q=>(q.floor || '1F')==='1F' &&
      [q.x1,q.x2].every(x=>x>=-.5 && x<=100.5) && [q.y1,q.y2].every(y=>y>=-.5 && y<=40.5));
    const ids=new Set(oldMain.map(q=>q.id));b.previousMainWalls=clone(oldMain);
    result.walls=[...(result.walls || []).filter(q=>!ids.has(q.id)),...partitions(b)];
    result.building_geometry=b;
    result.grid={...result.grid,factory_width:b.main.width,factory_depth:b.main.height};
    if(result.title_block)Object.assign(result.title_block,{rev:'REV A3-180',date:'2026/10/22',
      spec:'A3 建築 97.80×40.00M；EPS 柱位僅參考；隔間按比例描繪',status:'建築校正 · 隔間及衝突待現場覆核',elevation:'路面0 / 外廠房+1.00M / 原廠房+1.50M'});
    const first=result.floors?.find(q=>q.id==='1F');
    if(first)Object.assign(first,{desc:'A3 建築97.80×40.00M；保留EPS參考柱網',elev:'原廠+1.50 / 外棚+1.00M'});
    return result;
  }
  function audit(layout) {
    const b=get(layout);if(!b)return [];
    const issues=[];
    const cross=(a,c,p,q)=>{
      const d=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]);
      return d(a,c,p)*d(a,c,q)<-1e-8 && d(p,q,a)*d(p,q,c)<-1e-8;
    };
    for(const item of layout.equipment || []){
      if((item.floor || '1F')!=='1F' || ![item.x,item.y,item.width,item.height].every(Number.isFinite))continue;
      const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),cx=item.x+item.width/2,cy=item.y+item.height/2;
      const p=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[cx+u*item.width/2*c-v*item.height/2*s,cy+u*item.width/2*s+v*item.height/2*c]);
      if(item.is_room || item.category==='CNC'){
        if(p.some(q=>inside(b.annex,q)) && p.some(q=>!inside(b.annex,q)))issues.push({id:item.id,code:item.code,kind:'annex-boundary',message:'跨越 A3 外廠房邊界；保留原位，請覆核'});
        continue;
      }
      if(['Door','Window','Office','Stairs','Elevator'].includes(item.category))continue;
      const interior=point=>{
        const dx=point[0]-cx,dy=point[1]-cy;
        return Math.abs(dx*c+dy*s)<item.width/2-1e-6 && Math.abs(-dx*s+dy*c)<item.height/2-1e-6;
      };
      const walls=(layout.walls || []).filter(w=>w.source==='A3 L-02' &&
        (interior([w.x1,w.y1]) || interior([w.x2,w.y2]) || p.some((q,i)=>cross(q,p[(i+1)%4],[w.x1,w.y1],[w.x2,w.y2]))));
      if(walls.length)issues.push({id:item.id,code:item.code,kind:'wall',walls:walls.map(w=>w.id),message:'與 A3 牆線相交；保留原位，請覆核'});
      if(p.some(q=>q[1]<40 && q[0]>b.main.width))issues.push({id:item.id,code:item.code,kind:'main-boundary',message:'超出 A3 原廠房東邊界；未自動搬動'});
    }
    return issues;
  }
  function svg(layout,scale,offset,foreground=false,thai=false) {
    const b=get(layout);if(!b)return '';
    const rect=(r,attrs)=>`<rect x="${offset.x+r.x*scale}" y="${offset.y+r.y*scale}" width="${r.width*scale}" height="${r.height*scale}" ${attrs}/>`;
    let html='<g class="a3-building-reference" pointer-events="none">';
    for(const [key,label] of [['main',thai?'อาคารเดิม A3':'原水泥廠房 A3'],['annex',thai?'อาคารเมทัลชีท +1.00 ม.':'浪板外廠房 · 路面＋1.00 m'],['extension',thai?'ส่วนต่อเติมล่าสุด 10 ม.':'最新增建 10.00 m']]){
      const r=b[key];html+=rect(r,foreground?`fill="none" stroke="${r.color}" stroke-width="2.2"`:`fill="${r.color}" fill-opacity=".055" stroke="none"`);
      if(foreground){
        const y=key==='main'?r.y-1.1:key==='annex'?r.y+r.height+.9:r.y+r.height-1;
        html+=`<text x="${offset.x+(r.x+r.width/2)*scale}" y="${offset.y+y*scale}" text-anchor="middle" font-size="10" font-weight="700" fill="${r.color}">${label}${key==='main'?' 97.80 × 40.00 m':key==='annex'?' 64.69 × 19.00 m':''}</text>`;
      }
    }
    if(foreground){
      const e=b.extension;
      html+=`<line x1="${offset.x+(e.x+5)*scale}" x2="${offset.x+(e.x+5)*scale}" y1="${offset.y+e.y*scale}" y2="${offset.y+(e.y+e.height)*scale}" stroke="${e.color}" stroke-width=".8" stroke-dasharray="3,3"/>`;
      html+=`<text x="${offset.x+b.annex.x*scale}" y="${offset.y+(b.annex.y+b.annex.height+1.8)*scale}" font-size="8" fill="#64748b">${thai?'แกนลึก 18.30 ม. + ขอบ 0.70 ม.; ผนังกั้นประมาณจากแปลน; เสา EPS เป็นข้อมูลอ้างอิง':'柱軸進深18.30 m＋外緣0.70 m；隔間按比例描繪／EPS柱位僅參考'}</text>`;
      for(const issue of audit(layout)){
        const item=layout.equipment.find(q=>q.id===issue.id);html+=`<circle data-conflict-id="${escape(item.id)}" cx="${offset.x+(item.x+item.width/2)*scale}" cy="${offset.y+(item.y+item.height/2)*scale}" r="5" fill="none" stroke="#e45b35" stroke-width="2"/>`;
      }
    }
    return html+'</g>';
  }
  function frameFaces(layout,roof=false) {
    const b=get(layout);if(!b)return [];
    const faces=[];
    const box=(x,y,z,w,d,h,color,part)=>{
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      for(const ids of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])faces.push({points:ids.map(i=>p[i]),color,part});
    };
    const groups=[{...b.annex,width:b.extension.x-b.annex.x},b.extension];
    for(const r of groups){
      const top=r.rise+r.clearHeight,front=r.y+r.axisDepth;
      const xs=[r.x];for(let x=r.x+5;x<r.x+r.width-.1;x+=5)xs.push(x);xs.push(r.x+r.width);
      for(const x of xs)box(x-.06,front-.06,r.rise,.12,.12,r.clearHeight,'#9caaa7','canopy-post');
      for(const y of [r.y,front])box(r.x,y-.07,top,r.width,.14,.14,r.color,'canopy-beam');
      for(const x of xs)box(x-.05,r.y,top,.10,r.axisDepth,.12,'#9caaa7','canopy-rafter');
      if(roof){
        const x=r.x===b.annex.x?b.roof.x:r.x,w=r.x+r.width-x;
        box(x,r.y,top+.14,w,r.height,.06,r.color,'canopy-roof');
      }
    }
    return faces;
  }
  window.ChinChunBuilding={revision,reference,get,inside,partitions,apply,audit,svg,floorLevel,frameFaces};
})();
