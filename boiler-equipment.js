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
  window.ChinChunBoiler={upgrade};
})();
