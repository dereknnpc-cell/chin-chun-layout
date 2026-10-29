/* Photo-confirmed access geometry, 2026-10-29. No storage writes here.
   Overlays are read-only; alignLoadingRamp returns an archived, corrected clone.
   Black PDF arrows locate photos; blue arrows indicate uphill/upstairs.
   Levels are confirmed; footprint lengths, door width and tread sizes are illustrative. */
(() => {
  'use strict';
  const source='工廠斜坡標示.pdf + 使用者確認：右側為樓梯、保留局部牆面';
  const finite=r=>r && ['x','y','width','height'].every(k=>Number.isFinite(r[k])) && r.width>0 && r.height>0;
  // Explicit user correction: extend only the original loading ramp's low edge
  // to the office south wall. Archive the old record; never overwrite later edits.
  function alignLoadingRamp(layout){
    const key='ramp-5m-office-alignment-20261029',b=window.ChinChunBuilding?.get(layout);
    if(!b || layout.access_geometry_adjustments?.[key])return {layout,migrated:false};
    const ramp=(layout.equipment || []).find(e=>e.id==='stairs_1789540016247' && e.code==='RAMP-5M' && (e.floor || '1F')==='1F');
    if(!ramp || ramp.x!==15 || ramp.y!==35 || ramp.width!==5 || ramp.height!==2.5 || (ramp.rotation || 0)!==0 || ramp.ramp)return {layout,migrated:false};
    const office=(layout.equipment || []).find(e=>e.id==='eq_office' && e.code==='Office' && (e.floor || '1F')==='1F' && finite(e));
    const wall=office && (layout.walls || []).find(w=>(w.floor || '1F')==='1F' && Math.abs(w.y1-w.y2)<1e-8 && Math.abs(w.y1-(b.main.y+b.main.height))<1e-8 && Math.abs(w.y1-office.y-office.height)<.5 && Math.abs(Math.min(w.x1,w.x2)-(ramp.x+ramp.width))<1e-8 && Math.max(w.x1,w.x2)>=office.x+office.width/2);
    if(!wall || wall.y1<=ramp.y+ramp.height)return {layout,migrated:false};
    const result=JSON.parse(JSON.stringify(layout)),item=result.equipment.find(e=>e.id===ramp.id);
    result.access_geometry_adjustments={...result.access_geometry_adjustments,[key]:{previous:JSON.parse(JSON.stringify(ramp)),alignedToWall:wall.id,lowY:wall.y1}};
    item.height=wall.y1-item.y;
    if(item.name==='車輛裝卸緩坡 (5.0×2.5M)')item.name='車輛裝卸緩坡 (5.0×5.0M)';
    return {layout:result,migrated:true};
  }
  function get(layout) {
    const b=window.ChinChunBuilding?.get(layout);if(!b)return {ramp:null,stairs:null};
    let ramp=null,stairs=null;
    const lanes=(layout.aisles || []).filter(a=>(a.floor || '1F')==='1F' && finite(a));
    const mainLane=lanes.find(a=>a.id==='aisle_1');
    if(mainLane && mainLane.x<b.annex.x && mainLane.x+mainLane.width>b.annex.x && mainLane.y>=b.annex.y && mainLane.y+mainLane.height<=b.annex.y+b.annex.height && b.annex.rise>b.roadRise){
      // Keep the uphill edge on the west slab edge, widening south along PL-1
      // until it meets the user's outer canopy boundary.
      const run=5,width=b.annex.y+b.annex.height-mainLane.y,cx=b.annex.x-run/2,cy=mainLane.y+width/2;
      ramp={id:'site_annex_west_ramp',code:'RAMP-ANNEX-ENTRY',name:'PL-1 左側外棚入口斜坡',
        x:cx-width/2,y:cy-run/2,width,height:run,rotation:90,
        ramp:{low:b.roadRise,high:b.annex.rise,highEdge:'first'},source,
        accuracy:'user-confirmed-canopy-edge; illustrative-run',
        lowPoint:[b.annex.x-run,cy,b.roadRise],highPoint:[b.annex.x,cy,b.annex.rise]};
    }
    const lane=lanes.find(a=>a.id==='aisle_2'),boundary=b.main.y+b.main.height;
    const die=(layout.equipment || []).find(e=>String(e.photoModelCode || e.code || '').trim().toUpperCase()==='DIE CUT' && (e.floor || '1F')==='1F');
    if(lane && die && lane.y<=boundary && lane.y+lane.height>boundary && b.main.rise>b.annex.rise){
      const cx=lane.x+lane.width/2,width=Math.min(1.2,lane.width),left=cx-width/2,right=cx+width/2;
      const walls=(layout.walls || []).filter(w=>(w.floor || '1F')==='1F' && Math.abs(w.y1-boundary)<.05 && Math.abs(w.y2-boundary)<.05);
      // Use the gap in the user's own drawing; never cut or remove an edited wall.
      const blocked=walls.some(w=>Math.min(w.x1,w.x2)<right && Math.max(w.x1,w.x2)>left);
      const lo=Math.max(...walls.map(w=>Math.max(w.x1,w.x2)).filter(x=>x<=left));
      const hi=Math.min(...walls.map(w=>Math.min(w.x1,w.x2)).filter(x=>x>=right));
      if(!blocked && Number.isFinite(lo) && Number.isFinite(hi) && hi-lo<=6 && die.x>right && die.x-cx<6 && die.y>=boundary && die.y-boundary<4){
        stairs={id:'site_diecut_stairs',code:'STAIR-DIECUT',name:'Die Cut 旁通行樓梯與局部牆面',
          x:left,y:boundary,width,height:1,rotation:0,low:b.annex.rise,high:b.main.rise,steps:3,
          portal:{left:lo,right:hi,y:boundary,openingLeft:left,openingRight:right,thickness:.2,top:b.main.rise+2.4,head:b.main.rise+2.1,sill:b.main.rise+.8},
          source,accuracy:'photo-position; illustrative-door-and-treads',
          lowPoint:[cx,boundary+1,b.annex.rise],highPoint:[cx,boundary,b.main.rise]};
      }
    }
    return {ramp,stairs};
  }
  function stairFaces(item) {
    if(item?.code!=='STAIR-DIECUT')return [];
    const faces=[],box=(x,y,z,w,d,h,color,part)=>{
      if(w<=0 || d<=0 || h<=0)return;
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      for(const ids of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])faces.push({points:ids.map(i=>p[i]),color,part});
    };
    for(let i=0;i<item.steps;i++){
      const run=item.height/item.steps,top=item.high-(item.high-item.low)*i/item.steps,y=item.y+i*run;
      box(item.x,y,item.low,item.width,run,top-item.low,'#b5b3a8','access-stair-tread');
      box(item.x,y+run-.035,top+.003,item.width,.035,.012,'#e4bc4b','access-stair-nosing');
    }
    const p=item.portal,y=p.y-p.thickness/2;
    // The photo shows a doorway, a neighbouring waist wall/window and an overhead beam.
    box(p.left,y,item.low,p.openingLeft-p.left,p.thickness,p.top-item.low,'#d9d4c4','access-wall-left');
    box(p.openingRight,y,item.low,p.right-p.openingRight,p.thickness,p.sill-item.low,'#d9d4c4','access-wall-sill');
    box(p.openingRight,y,p.sill,.22,p.thickness,p.head-p.sill,'#d9d4c4','access-door-jamb');
    box(p.right-.22,y,p.sill,.22,p.thickness,p.head-p.sill,'#d9d4c4','access-window-jamb');
    box(p.left,y,p.head,p.right-p.left,p.thickness,p.top-p.head,'#d9d4c4','access-wall-header');
    return faces;
  }
  function footprint(item,padding=0){
    const w=item.width+2*padding,h=item.height+2*padding,cx=item.x+item.width/2,cy=item.y+item.height/2;
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>[cx+x*c-y*s,cy+x*s+y*c]);
  }
  function references(layout){
    const access=get(layout),b=window.ChinChunBuilding?.get(layout);
    const ramps=[...(layout.equipment || []).filter(e=>(e.floor || '1F')==='1F' && /^RAMP(?:-|$)/i.test(String(e.code || ''))),access.ramp,window.ChinChunBuilding?.connectingRamp(layout)].filter(finite);
    const center=b?[b.main.x+b.main.width/2,b.main.y+b.main.height/2]:[(layout.grid?.factory_width || 100)/2,(layout.grid?.factory_depth || 40)/2];
    return [...ramps.map(item=>{
      const p=footprint(item),mid=(a,b)=>a.map((v,i)=>(v+b[i])/2),first=mid(p[0],p[1]),last=mid(p[3],p[2]);
      const spec=item.ramp,explicit=spec && Number.isFinite(spec.low) && Number.isFinite(spec.high) && spec.high>spec.low && ['first','last'].includes(spec.highEdge);
      const firstHigh=explicit?spec.highEdge==='first':Math.hypot(first[0]-center[0],first[1]-center[1])<=Math.hypot(last[0]-center[0],last[1]-center[1]);
      return {...item,lowPoint:[...(firstHigh?last:first),explicit?spec.low:(b?.roadRise || 0)],highPoint:[...(firstHigh?first:last),explicit?spec.high:(b?.main.rise ?? 1.5)]};
    }),...(access.stairs?[access.stairs]:[])];
  }
  function groundOpenings(layout){
    const b=window.ChinChunBuilding?.get(layout);
    return references(layout).filter(item=>!item.steps).map(item=>{
      const points=footprint(item),low=item.lowPoint;
      // RAMP-5M sits in the loading entrance recess. Keep the saved slope and
      // its road-level approach open through to the main slab's outer edge.
      if(item.code==='RAMP-5M' && b && window.ChinChunBuilding.inside(b.main,low)){
        const dx=low[0]-item.highPoint[0],dy=low[1]-item.highPoint[1];
        const distances=[dx>1e-8?(b.main.x+b.main.width-low[0])/dx:dx< -1e-8?(b.main.x-low[0])/dx:Infinity,dy>1e-8?(b.main.y+b.main.height-low[1])/dy:dy< -1e-8?(b.main.y-low[1])/dy:Infinity];
        const t=Math.min(...distances.filter(d=>d>=0));
        if(Number.isFinite(t))for(const p of points)if(Math.abs((p[0]-low[0])*dx+(p[1]-low[1])*dy)<1e-7){p[0]+=dx*t;p[1]+=dy*t;}
      }
      return {points,low:low[2],code:item.code};
    });
  }
  function svg(layout,scale,offset,thai=false){
    let html='';
    const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
    for(const item of references(layout)){
      const xy=p=>[offset.x+p[0]*scale,offset.y+p[1]*scale],a=xy(item.lowPoint),b=xy(item.highPoint);
      const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),head=7;
      const arrow=[b,[b[0]-head*Math.cos(angle-.45),b[1]-head*Math.sin(angle-.45)],[b[0]-head*Math.cos(angle+.45),b[1]-head*Math.sin(angle+.45)]];
      const outline=footprint(item).map(xy),cx=(a[0]+b[0])/2,labelY=Math.min(...outline.map(p=>p[1]))-5;
      html+=`<g class="photo-access-reference" data-access-code="${escape(item.code)}" pointer-events="none"><title>${thai?'ทิศขึ้นตามภาพ ตำแหน่งโดยประมาณ':'照片上行方向；尺寸為示意'}</title><polygon points="${outline.map(p=>p.join(',')).join(' ')}" fill="${item.steps?'#e2e0d6':'#f4d49b'}" stroke="#826b43" stroke-width="1.2"/>`;
      if(item.steps)for(let i=0;i<=item.steps;i++){
        const y=offset.y+(item.y+item.height*i/item.steps)*scale;
        html+=`<line x1="${offset.x+item.x*scale}" y1="${y}" x2="${offset.x+(item.x+item.width)*scale}" y2="${y}" stroke="#475569" stroke-width="1.2"/>`;
      }
      html+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#2563eb" stroke-width="2"/><polygon points="${arrow.map(p=>p.join(',')).join(' ')}" fill="#2563eb"/><circle cx="${a[0]}" cy="${a[1]}" r="2.5" fill="#eab308"/><circle cx="${b[0]}" cy="${b[1]}" r="2.5" fill="#dc2626"/><text x="${cx}" y="${labelY}" text-anchor="middle" font-size="8" font-weight="700" fill="#334155" stroke="white" stroke-width="2.5" paint-order="stroke">${escape(item.code)} · ${item.lowPoint[2].toFixed(2)} → ${item.highPoint[2].toFixed(2)} m${item.steps?` · ${item.steps}${thai?' ขั้น':'階'}`:''}</text>`;
      html+='</g>';
    }
    return html;
  }
  // Circulation paint must never hide the actual access surfaces. These convex
  // footprints are shared by SVG masks and both 2.5D renderers, including rotated ramps.
  function routeHoles(layout,floor='1F'){
    if(floor==='OVERLAY')floor='1F';
    const items=(floor==='2F'?layout.equipment_2f || []:layout.equipment || []).filter(e=>(e.floor || (floor==='2F'?'2F':'1F'))===floor && /^RAMP(?:-|$)/i.test(String(e.code || '')));
    if(floor==='1F'){
      const a=get(layout),connector=window.ChinChunBuilding?.connectingRamp(layout);
      items.push(...[a.ramp,a.stairs,connector].filter(Boolean));
    }
    return items.filter(finite).map(item=>footprint(item,.12));
  }
  const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
  function halfPlane(points,a,b,inside){
    const out=[];
    for(let i=0;i<points.length;i++){
      const p=points[i],q=points[(i+1)%points.length],dp=cross(a,b,p),dq=cross(a,b,q),ip=inside?dp>=0:dp<=0,iq=inside?dq>=0:dq<=0;
      if(ip)out.push([...p]);
      if(ip!==iq){const t=dp/(dp-dq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}
    }
    return out;
  }
  const area=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
  function clipRoutes(points,holes){
    let pieces=[points];
    for(const hole of holes){
      const next=[];
      for(const piece of pieces){
        let remaining=piece;
        for(let i=0;i<hole.length && remaining.length>=3;i++){
          const a=hole[i],b=hole[(i+1)%hole.length],outside=halfPlane(remaining,a,b,false);
          if(outside.length>=3 && area(outside)>1e-9)next.push(outside);
          remaining=halfPlane(remaining,a,b,true);
        }
      }
      pieces=next;
    }
    return pieces;
  }
  function routeMaskSvg(layout,scale,offset,width,height,floor){
    const holes=routeHoles(layout,floor);
    return `<mask id="accessRouteMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" style="mask-type:luminance"><rect width="${width}" height="${height}" fill="white"/>${holes.map(h=>`<polygon points="${h.map(p=>`${offset.x+p[0]*scale},${offset.y+p[1]*scale}`).join(' ')}" fill="black"/>`).join('')}</mask>`;
  }
  window.ChinChunAccess={get,stairFaces,svg,references,footprint,groundOpenings,routeHoles,clipRoutes,routeMaskSvg,alignLoadingRamp};
})();
