/* Owner-confirmed ZH-1500GF addition. Preserve the active document and user edits. */
(() => {
  'use strict';
  const marker='boiler_zh1500gf_20261104',id='eq_boiler_zh1500gf';
  function upgrade(layout) {
    if(!Array.isArray(layout?.equipment) || layout[marker])return {layout,migrated:false};
    const existing=layout.equipment.find(q=>q.id===id || String(q.code).toUpperCase()==='ZH-1500GF');
    if(existing)return {layout:{...layout,[marker]:true},migrated:true};
    // The PDF's X18/Y1 corner is x85/y0; east wall is x100. The blue
    // block is x96.4–99.4/y0.7–3.6. Do not invent this location on other plans.
    const h1=layout.equipment.find(q=>q.id==='eq_latex_h1_1' && q.code==='H1-1');
    const north=(layout.walls || []).some(q=>q.y1===0 && q.y2===0 && Math.min(q.x1,q.x2)<=96.9 && Math.max(q.x1,q.x2)>=98.845);
    const east=(layout.walls || []).some(q=>q.x1===100 && q.x2===100 && Math.min(q.y1,q.y2)<=1.2 && Math.max(q.y1,q.y2)>=3.115);
    if(!h1 || h1.x!==82 || h1.y!==6.5 || !north || !east)return {layout,migrated:false};
    const boiler={id,code:'ZH-1500GF',name:'瓦斯蒸汽鍋爐 ZH-1500GF',zone:'Utilities',category:'Boiler',floor:'1F',
      x:96.9,y:1.2,width:1.945,height:1.915,rotation:0,color:'#45635b',physicalHeight:2.305,
      geometryAccuracy:'manufacturer-envelope/photo-detail',specification:{lengthMM:1945,widthMM:1915,heightMM:2305,weightKG:1990,evaporationKgPerHour:1500},
      placementSource:'鍋爐位置.pdf · H1-1 上方藍色區塊'};
    // Respect a newer occupied drawing rather than relocating its equipment.
    const occupied=layout.equipment.some(q=>{
      if((q.floor || '1F')!=='1F' || q.is_room || !(q.width>0 && q.height>0))return false;
      const a=(Number(q.rotation)||0)*Math.PI/180,w=Number(q.width),h=Number(q.height),cx=Number(q.x)+w/2,cy=Number(q.y)+h/2;
      const hw=(Math.abs(w*Math.cos(a))+Math.abs(h*Math.sin(a)))/2,hh=(Math.abs(w*Math.sin(a))+Math.abs(h*Math.cos(a)))/2;
      return cx-hw<boiler.x+boiler.width && cx+hw>boiler.x && cy-hh<boiler.y+boiler.height && cy+hh>boiler.y;
    });
    if(occupied)return {layout,migrated:false};
    return {layout:{...layout,equipment:[...layout.equipment,boiler],[marker]:true},migrated:true};
  }
  // Two photo-confirmed inward-facing partitions. Existing north/east building
  // walls remain untouched; no unobserved doors, roof or closed box is invented.
  function upgradeSurround(layout) {
    const flag='boiler_acoustic_surround_20261104';
    if(!layout || layout[flag] || !Array.isArray(layout.walls))return {layout,migrated:false};
    const boiler=(layout.equipment || []).find(q=>q.id===id);
    if(!boiler || (boiler.floor || '1F')!=='1F' || (Number(boiler.rotation)||0)!==0)return {layout,migrated:false};
    const x=Number(boiler.x),y=Number(boiler.y),w=Number(boiler.width),d=Number(boiler.height);
    if(![x,y,w,d].every(Number.isFinite) || w<=0 || d<=0)return {layout,migrated:false};
    // Inner panel surfaces are exactly 1 m from the manufacturer's footprint.
    const t=.08,west=x-1-t/2,south=y+d+1+t/2,north=y-1,east=x+w+1+t;
    const walls=[
      {id:'wall_boiler_eva1',name:'鍋爐鋁箔隔音牆（面向 EVA1）',x1:west,y1:north,x2:west,y2:south+t/2,acousticSide:'eva1'},
      {id:'wall_boiler_h1',name:'鍋爐鋁箔隔音牆＋上方透明隔板（面向 H1-1）',x1:west,y1:south,x2:east,y2:south,acousticSide:'h1'}
    ].map(q=>({...q,floor:'1F',type:'interior',thickness:t,boilerId:id,foilHeight:2.2,clearPanelHeight:q.acousticSide==='h1'?.85:0,geometryAccuracy:'owner-clearance/photo-height-estimate'}));
    const rail={id:'eq_boiler_guardrail',code:'BOILER-RAIL',name:'鍋爐紅橘色安全欄杆（EVA1 側）',category:'Safety',zone:'Utilities',floor:'1F',
      x:west-t/2-1-t,y:north,width:t,height:south+t/2-north,rotation:0,color:'#dc682b',boilerId:id,physicalHeight:1.1,geometryAccuracy:'owner-clearance/photo-height-estimate'};
    const missingWalls=walls.filter(q=>!layout.walls.some(wall=>wall.id===q.id));
    const equipment=layout.equipment.some(q=>q.id===rail.id)?layout.equipment:[...layout.equipment,rail];
    return {layout:{...layout,walls:[...layout.walls,...missingWalls],equipment,[flag]:true},migrated:true};
  }
  function surroundFaces(item) {
    const wall=Boolean(item.acousticSide),rail=item.code==='BOILER-RAIL';
    if(!wall && !rail)return null;
    const faces=[],t=Number(item.thickness)||.08;
    const x0=wall?Number(item.x1):Number(item.x)+Number(item.width)/2,y0=wall?Number(item.y1):Number(item.y);
    const dx=wall?Number(item.x2)-x0:0,dy=wall?Number(item.y2)-y0:Number(item.height),len=Math.hypot(dx,dy);
    if(!len)return [];
    const ux=dx/len,uy=dy/len,rot=rail?(Number(item.rotation)||0)*Math.PI/180:0;
    const world=([u,v,z])=>{
      let x=x0+ux*u-uy*v,y=y0+uy*u+ux*v;
      if(rot){const cx=Number(item.x)+Number(item.width)/2,cy=Number(item.y)+Number(item.height)/2,a=x-cx,b=y-cy;x=cx+a*Math.cos(rot)-b*Math.sin(rot);y=cy+a*Math.sin(rot)+b*Math.cos(rot);}
      return [x,y,z];
    };
    const face=(points,color,part,opacity)=>faces.push({points:points.map(world),color,part,...(opacity?{opacity}:{})});
    const box=(u,v,z,w,d,h,color,part)=>{
      const p=[[u,v,z],[u+w,v,z],[u+w,v+d,z],[u,v+d,z],[u,v,z+h],[u+w,v,z+h],[u+w,v+d,z+h],[u,v+d,z+h]];
      for(const ids of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])face(ids.map(i=>p[i]),color,part);
    };
    if(wall){
      const h=Number(item.foilHeight)||2.2,glass=Number(item.clearPanelHeight)||0,frame='#62716d';
      box(0,-t/2,0,len,t,h,'#c5cfcc','acoustic-foil');
      // Foil seams and metal framing, with no printed photo text or stock.
      for(let z=.15;z<h;z+=.15)for(const side of [-1,1])box(0,side*t/2-.002,z,len,.004,.006,'#aab9b5','foil-seam');
      for(const z of [0,.75,h-.045])box(0,-t/2-.005,z,len,t+.01,.045,frame,'acoustic-frame');
      const count=Math.max(1,Math.ceil(len/1.25));
      for(let i=0;i<=count;i++)box(Math.min(len-.045,i*len/count),-t/2-.005,0,.045,t+.01,h+glass,frame,'acoustic-post');
      if(glass){
        face([[0,0,h],[len,0,h],[len,0,h+glass],[0,0,h+glass]],'#b6dbdf','acoustic-clear-panel',.24);
        box(0,-t/2-.005,h+glass-.045,len,t+.01,.045,frame,'clear-panel-top');
      }
    }else{
      const orange='#df692c',metal='#677e75',h=Number(item.physicalHeight)||1.1,th=Number(item.width)||.08;
      for(const z of [.08,h-.055])box(0,-th/2,z,len,th,.055,orange,'guardrail-rail');
      const count=Math.max(1,Math.ceil(len/1.35));
      for(let i=0;i<=count;i++)box(Math.min(len-.055,i*len/count),-th/2,0,.055,th,h,i===0||i===count?orange:metal,'guardrail-post');
      // Diamond mesh: clipped diagonal strips stay inside the railing frame.
      const z0=.135,z1=h-.055;
      for(const direction of [-1,1])for(let start=-h;start<len+h;start+=.13){
        const lo=Math.max(0,direction>0?-start:start-len),hi=Math.min(z1-z0,direction>0?len-start:start);
        if(hi<=lo)continue;
        const a=start+direction*lo,b=start+direction*hi;
        face([[a,0,z0+lo],[a+.006,0,z0+lo],[b+.006,0,z0+hi],[b,0,z0+hi]],orange,'guardrail-mesh');
      }
    }
    return faces;
  }
  window.ChinChunBoiler={upgrade,upgradeSurround,surroundFaces};
})();
