/* User drawing is authoritative. No PDF tracing or equipment transforms.
   Red-line correction (2026-10-22 16:38): annex X35..100, latest X90..100.
   Rejected A3 walls are recoverably archived; original user walls are restored. */
(() => {
  'use strict';
  const revision='user-boundary-20261022-r2',previousBoundaryRevision='user-boundary-20261022-r1',rejectedRevision='a3-180-20261022';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const inside=(r,p)=>p[0]>=r.x-1e-6 && p[0]<=r.x+r.width+1e-6 && p[1]>=r.y-1e-6 && p[1]<=r.y+r.height+1e-6;
  function reference() {
    return {revision,source:'使用者原繪圖及2026-10-22紅線更正',
      main:{x:0,y:0,width:100,height:40,rise:1.5,color:'#a855cf'},
      annex:{x:35,y:40,width:65,height:19,rise:1,color:'#d3a42b',axisDepth:18.3,eave:.7,clearHeight:5.5},
      extension:{x:90,y:40,width:10,height:19,rise:1,color:'#32984b',axisBays:[5,5],axisDepth:18.3,clearHeight:4.6},
      roof:{x:35,y:40,width:65,height:19},roadRise:0,partitionAccuracy:'user-drawing',
      columnStatus:'使用者原繪圖柱位，不重新縮放或推算',
      derivations:['外棚左界X35、右界X100；增建分界X90，依16:38截圖紅線向右修正一個5米柱距',
        '廠內隔間以使用者原牆線為準，不採A3比例描繪',
        '外棚縱深及示意棚高沿用既有顯示值，未依紅線另行推算']};
  }
  function needsRepair(layout){return layout?.building_geometry?.revision===rejectedRevision;}
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
  // Read-only site presentation, NOT a CAD equipment record or a migration.
  // User's 2026-10-23 annotation: red/north edge high, yellow/south edge low.
  // Plan position must be supplied by the confirmed desktop drawing, not the
  // obsolete mobile/default thumbnail. Never silently reuse the old X86.5 box.
  function connectingRamp(layout) {
    const b=get(layout);if(!b || b.main.rise<=b.annex.rise)return null;
    const r=b.connectingRamp;
    if(!r || !['x','y','width','height'].every(k=>Number.isFinite(r[k])) || r.width<=0 || r.height<=0)return null;
    const {x,y,width,height}=r;
    if(Math.abs(y-b.main.y-b.main.height)>1e-6 || !inside(b.main,[x,y]) || !inside(b.main,[x+width,y]) || !inside(b.annex,[x,y]) || !inside(b.annex,[x+width,y+height]))return null;
    return {id:'site_annex_connecting_ramp',code:'RAMP-CONNECTOR',
      name:'原廠／擴建棚連接坡道',x,y,width,height,rotation:0,
      ramp:{low:b.annex.rise,high:b.main.rise,highEdge:'first'},
      geometryAccuracy:r.geometryAccuracy || 'annotation-approximate',source:r.source};
  }
  const generatedWall=w=>(w.floor || '1F')==='1F' && w.source==='A3 L-02' && /^a3_wall_\d+$/.test(w.id);
  function recoveryProblem(layout) {
    if(layout?.building_geometry?.revision===previousBoundaryRevision){
      const b=layout.building_geometry;
      if(!get({...layout,building_geometry:{...b,revision}}))return '邊界資料不完整，未更動原繪圖';
      if(b.annex.x+b.annex.width<=35 || b.roof.x+b.roof.width<=35)return '右界在修正左界以左，未更動原繪圖';
      return '';
    }
    if(!needsRepair(layout))return '';
    const archived=layout.building_geometry.previousMainWalls;
    if(!Array.isArray(archived))return '缺少套用前的原牆封存，請匯入你原本的備份；不以預設配置代替';
    const ids=new Set();
    for(const w of archived){
      if(!w || typeof w.id!=='string' || ids.has(w.id) || !['x1','y1','x2','y2'].every(k=>Number.isFinite(w[k])))return '原牆封存不完整，請匯入你原本的備份；未執行部分還原';
      ids.add(w.id);
    }
    return '';
  }
  function apply(candidate) {
    if(get(candidate))return clone(candidate); // Never overwrite subsequent user edits.
    if(candidate?.building_geometry?.revision===previousBoundaryRevision)return correctLeftBoundary(candidate);
    const problem=recoveryProblem(candidate);if(problem)throw new Error(problem);
    const result=clone(candidate),b=reference();
    if(needsRepair(candidate)){
      const previous=result.building_geometry,removed=(result.walls || []).filter(generatedWall);
      const retained=(result.walls || []).filter(w=>!generatedWall(w));
      const currentIds=new Set(retained.map(w=>w.id));
      const restored=previous.previousMainWalls.filter(w=>!currentIds.has(w.id));
      // A current user-edited wall wins an ID collision; never restore defaults.
      result.walls=[...retained,...clone(restored)];
      b.previousMainWalls=clone(previous.previousMainWalls);
      b.rejectedInterpretation={geometry:clone(previous),walls:clone(removed)};
      b.restoration={restoredWalls:restored.length,retainedWalls:retained.length,
        keptCurrentIds:previous.previousMainWalls.filter(w=>currentIds.has(w.id)).map(w=>w.id)};
    }
    // Fresh/unaffected drawings retain every original wall, including custom ones.
    result.building_geometry=b;
    result.grid={...result.grid,factory_width:100,factory_depth:40};
    if(result.title_block)Object.assign(result.title_block,{rev:'REV USER-BOUNDARY',date:'2026/10/22',
      spec:'原繪圖100×40M；紅線外棚X35–100／增建X90–100；隔間沿用原繪',
      status:'依使用者原繪圖／紅線更正',elevation:'路面0 / 外廠房+1.00M / 原廠房+1.50M'});
    const first=result.floors?.find(q=>q.id==='1F');
    if(first)Object.assign(first,{desc:'使用者原繪圖100×40M；廠內隔間及柱位沿用原繪',elev:'原廠+1.50 / 外棚+1.00M'});
    return result;
  }
  function correctLeftBoundary(candidate) {
    const result=clone(candidate),b=result.building_geometry;
    if(!get({...result,building_geometry:{...b,revision}}))throw new Error('邊界資料不完整，未更動原繪圖');
    const annexRight=b.annex.x+b.annex.width,roofRight=b.roof.x+b.roof.width;
    if(annexRight<=35 || roofRight<=35)throw new Error('右界在修正左界以左，未更動原繪圖');
    b.boundaryCorrections=[...(b.boundaryCorrections || []),{fromRevision:previousBoundaryRevision,
      previousAnnex:{x:b.annex.x,width:b.annex.width},previousRoof:{x:b.roof.x,width:b.roof.width},left:35}];
    b.annex.x=35;b.annex.width=annexRight-35;
    b.roof.x=35;b.roof.width=roofRight-35;
    b.revision=revision;
    b.derivations=(b.derivations || []).map(s=>s.replace('外棚左界X30','外棚左界X35'));
    if(typeof result.title_block?.spec==='string')result.title_block.spec=result.title_block.spec.replace('外棚X30','外棚X35');
    return result;
  }
  function repair(candidate) {
    if(candidate?.building_geometry?.revision===previousBoundaryRevision){
      try{return {layout:correctLeftBoundary(candidate),changed:true,blocked:false,leftBoundaryOnly:true};}
      catch(error){return {layout:candidate,changed:false,blocked:true,reason:error.message};}
    }
    if(!needsRepair(candidate))return {layout:candidate,changed:false,blocked:false};
    const reason=recoveryProblem(candidate);
    if(reason)return {layout:candidate,changed:false,blocked:true,reason};
    return {layout:apply(candidate),changed:true,blocked:false};
  }
  // Rejected inferred walls/boundaries must not generate false conflict marks.
  function audit(){return [];}
  function svg(layout,scale,offset,foreground=false,thai=false) {
    const b=get(layout);if(!b)return '';
    const rect=(r,attrs)=>`<rect x="${offset.x+r.x*scale}" y="${offset.y+r.y*scale}" width="${r.width*scale}" height="${r.height*scale}" ${attrs}/>`;
    let html='<g class="user-building-reference" pointer-events="none">';
    for(const [key,label] of [['main',thai?'อาคารเดิม · ยึดแปลนผู้ใช้':'原水泥廠房 · 以原繪圖為準'],['annex',thai?'อาคารภายนอก · ขอบตามเส้นแดง':'浪板外廠房 · 紅線邊界'],['extension',thai?'ต่อเติมล่าสุด 10.00 ม.':'最新增建 10.00 m']]){
      const r=b[key];html+=rect(r,foreground?`fill="none" stroke="${r.color}" stroke-width="2.2"`:`fill="${r.color}" fill-opacity=".055" stroke="none"`);
      if(foreground){
        const y=key==='main'?r.y-1.1:key==='annex'?r.y+r.height+.9:r.y+r.height-1;
        html+=`<text x="${offset.x+(r.x+r.width/2)*scale}" y="${offset.y+y*scale}" text-anchor="middle" font-size="10" font-weight="700" fill="${r.color}">${label}${key==='main'?` ${r.width.toFixed(2)} × ${r.height.toFixed(2)} m`:key==='annex'?` X=${r.x.toFixed(0)}–${(r.x+r.width).toFixed(0)} m · ＋${r.rise.toFixed(2)} m`:''}</text>`;
      }
    }
    if(foreground){
      const e=b.extension;
      html+=`<line x1="${offset.x+(e.x+e.width/2)*scale}" x2="${offset.x+(e.x+e.width/2)*scale}" y1="${offset.y+e.y*scale}" y2="${offset.y+(e.y+e.height)*scale}" stroke="${e.color}" stroke-width=".8" stroke-dasharray="3,3"/>`;
      html+=`<text x="${offset.x+b.annex.x*scale}" y="${offset.y+(b.annex.y+b.annex.height+1.8)*scale}" font-size="8" fill="#64748b">${thai?'ผนังกั้นและเสายึดแปลนผู้ใช้ ไม่ใช้ผนังประมาณจาก A3':'廠內隔間、牆線及柱位沿用使用者原繪圖；不採A3比例描繪'}</text>`;
    }
    if(foreground)html+=window.ChinChunAccess?.svg(layout,scale,offset,thai) || '';
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
      if(roof)box(r.x,r.y,top+.14,r.width,r.height,.06,r.color,'canopy-roof');
    }
    return faces;
  }
  window.ChinChunBuilding={revision,rejectedRevision,reference,get,inside,apply,repair,needsRepair,recoveryProblem,audit,svg,floorLevel,connectingRamp,frameFaces};
})();
