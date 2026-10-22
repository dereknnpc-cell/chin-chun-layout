/* 2026-10-22 annotated photo batch. Display geometry only: never edits CAD.
   No stock, foam, moulds, carts, people, cars or neighbouring equipment. */
(() => {
  'use strict';
  const code=item=>String(item.photoModelCode || item.code || '').trim().toUpperCase();
  const heights={'PL-1':4.8,'PL-2':4.8,'J1-3':2.4,'D1-1':2.8,'WELDING':2.35,'L4-1':2.55};
  const matches=item=>Object.hasOwn(heights,code(item));
  function mesh(item,w,d) {
    const faces=[],W=Math.max(.05,Number(item.width)||w),D=Math.max(.05,Number(item.height)||d);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    // Some existing plans express these inline machines with a vertical long
    // footprint and rotation=0. Fit their process axis to that long side before
    // applying the CAD rotation; do not squash a 12 m conveyor across 4 m.
    const portrait=['D1-1','WELDING'].includes(code(item)) && W<D;
    const point=([x,y,z])=>{const u=(portrait?1-y/d:x/w)*W-W/2,v=(portrait?x/w:y/d)*D-D/2;return[(Number(item.x)||0)+W/2+u*c-v*s,(Number(item.y)||0)+D/2+u*s+v*c,z];};
    const face=(points,color,part)=>faces.push({points:points.map(point),color,part});
    const box=(x,y,z,bw,bd,bh,color,part)=>{
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      for(const ids of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])face(ids.map(i=>p[i]),color,part);
    };
    const tube=(start,end,r,color,part,count=16)=>{
      const delta=end.map((v,i)=>v-start[i]),len=Math.hypot(...delta);if(len<1e-8)return;
      const axis=delta.map(v=>v/len),seed=Math.abs(axis[2])<.9?[0,0,1]:[0,1,0];
      const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const raw=cross(axis,seed),norm=Math.hypot(...raw),u=raw.map(v=>v/norm),v=cross(axis,u);
      const ring=p=>Array.from({length:count},(_,i)=>p.map((q,k)=>q+r*(u[k]*Math.cos(i*2*Math.PI/count)+v[k]*Math.sin(i*2*Math.PI/count))));
      const p=ring(start),q=ring(end);face([...p].reverse(),color,part);face(q,color,part);
      for(let i=0;i<count;i++){const j=(i+1)%count;face([p[i],p[j],q[j],q[i]],color,part);}
    };
    const wheel=(x,y,z,r,color,part)=>{
      for(let i=0;i<20;i++){
        const a=i*Math.PI/10,b=(i+1)*Math.PI/10;
        tube([x+r*Math.cos(a),y,z+r*Math.sin(a)],[x+r*Math.cos(b),y,z+r*Math.sin(b)],.018,color,part,6);
        if(i%5===0)tube([x,y,z],[x+r*Math.cos(a),y,z+r*Math.sin(a)],.014,color,part,6);
      }
      tube([x,y-.035,z],[x,y+.035,z],.04,color,part,12);
    };
    return {faces,point,face,box,tube,wheel};
  }
  const cream='#dfdecc',steel='#b7c3c3',dark='#364343',red='#a83e32',green='#527b5b',wood='#99754f';
  function rack(item) {
    const w=code(item)==='PL-1'?18:17,d=4,m=mesh(item,w,d),{box,tube}=m;
    const bays=Math.ceil(w/3),step=(w-.16)/bays;
    for(let i=0;i<=bays;i++)for(const y of [.05,3.82]){
      const x=.06+i*step;
      box(x-.045,y,0,.09,.12,4.8,dark,'rack-upright');box(Math.min(w-.20,Math.max(0,x-.10)),y-.025,0,.20,.18,.045,steel,'rack-foot');
    }
    for(const z of [.32,2.48,4.65]){
      for(const y of [.05,3.82])box(.06,y,z,w-.12,.12,.12,dark,'rack-long-beam');
      for(let x=.10;x<w-.12;x+=step)box(x,.08,z,.08,3.77,.12,dark,'rack-cross-beam');
      // Fixed shelf decking only, never the trays or stock seen in the photos.
      for(let y=.4;y<3.8;y+=.55)box(.08,y,z+.10,w-.16,.045,.035,'#68736d','rack-fixed-deck');
    }
    for(const x of [.06,w-.10])for(const [lo,hi] of [[.5,2.45],[2.65,4.6]]){
      tube([x,.15,lo],[x,3.8,hi],.025,dark,'rack-diagonal',6);
      tube([x,.15,hi],[x,3.8,lo],.025,dark,'rack-diagonal',6);
    }
    return m.faces;
  }
  function j13(item) {
    const m=mesh(item,4,3.4),{box,tube,wheel}=m;
    for(const x of [.18,3.10])for(const y of [.65,2.98]){
      box(x,y,0,.09,.11,.88,cream,'table-leg');box(x-.04,y-.04,0,.17,.19,.04,steel,'table-foot');
    }
    for(const x of [.18,3.10])box(x,.65,.25,.09,2.45,.08,cream,'table-stretcher');
    box(.12,.62,.88,3.14,2.63,.085,cream,'fixed-work-table');
    box(.12,2.92,.965,3.14,.34,.025,wood,'wood-extension');
    for(const x of [.30,2.94])box(x,.14,0,.22,.32,2.34,x<1?'#bd6538':cream,'saw-portal');
    box(.30,.14,2.08,2.86,.34,.32,'#3b4945','dark-header');
    box(.32,.13,.12,.18,.34,1.92,'#b45c35','orange-side-cover');
    box(.48,.62,.977,2.38,.055,.025,steel,'cutting-rail');
    box(.51,.62,.98,.008,2.05,.018,dark,'band-knife');
    box(.24,1.00,.98,2.79,.085,.51,cream,'guide-fence');
    for(const x of [.27,2.92])tube([x,.98,1.0],[x,.98,1.56],.022,steel,'fence-adjustment');
    wheel(2.98,.93,1.43,.08,dark,'fence-handwheel');
    box(3.42,.47,0,.51,.65,1.24,cream,'control-pedestal');
    box(3.43,.48,1.24,.49,.63,.16,'#9ea9a2','sloped-control');
    box(3.49,.46,1.07,.36,.018,.20,'#334f53','control-screen');
    for(const x of [3.50,3.66,3.82])tube([x,.45,.96],[x,.43,.96],.025,x<3.6?red:green,'control-button',10);
    box(.18,.51,.965,3.08,.02,.04,steel,'rear-edge');
    return m.faces;
  }
  function d11(item) {
    const m=mesh(item,12,4),{box,tube,wheel,face}=m;
    box(8.55,.15,0,3.30,3.65,.14,'#c2c4b4','machine-plinth');
    for(const y of [.36,3.12]){
      box(9.0,y,.14,.48,.45,1.74,cream,'cast-side-frame');
      box(10.45,y,.14,.58,.45,1.74,cream,'cast-side-frame');
      box(8.88,y,.14,2.30,.50,.16,cream,'cast-foot');
    }
    box(9.1,.65,.40,1.82,2.60,.20,cream,'lower-cross-frame');
    box(9.05,.37,1.74,1.89,3.20,.19,cream,'upper-cross-frame');
    for(const x of [9.34,10.05,10.67])tube([x,.52,1.26],[x,3.48,1.26],.16,steel,'main-roller',24);
    tube([9.8,.46,1.60],[9.8,3.53,1.60],.15,green,'pressure-roller',24);
    // Short horizontal feed end; long rising conveyor is the discharge end.
    box(10.72,.60,1.02,1.12,2.83,.065,cream,'feed-frame');
    box(10.76,.65,1.086,1.04,2.73,.022,green,'feed-belt');
    for(const x of [11.0,11.65])tube([x,.59,1.05],[x,3.43,1.05],.065,steel,'feed-guide');
    tube([9.65,.13,.95],[9.65,.35,.95],.68,red,'red-flywheel',28);
    tube([9.65,.11,.95],[9.65,.12,.95],.45,'#66764f','flywheel-hub',24);
    for(const y of [.12,3.56]){
      box(9.15,y,.65,1.73,.15,.83,red,'red-side-guard');
      wheel(10.85,y-.02,.95,.15,dark,'height-handwheel');
    }
    // Two motors, a green slotted blade bar and working gap, without material.
    for(const y of [.38,3.35])tube([9.34,y,2.0],[9.34,y+.23,2.0],.19,dark,'drive-motor',20);
    box(9.14,.62,1.48,.18,2.78,.25,green,'blade-bar');
    for(let y=.8;y<3.4;y+=.28)tube([9.13,y,1.64],[9.12,y,1.64],.025,dark,'blade-bar-bolt',8);
    const left=.24,right=9.17,zLeft=2.55,zRight=1.45;
    const z=x=>zLeft+(zRight-zLeft)*(x-left)/(right-left);
    face([[left,.65,zLeft],[right,.65,zRight],[right,3.35,zRight],[left,3.35,zLeft]],'#3c6655','rising-discharge-belt');
    for(const y of [.56,3.38]){
      tube([left,y,zLeft-.06],[right,y,zRight-.06],.055,cream,'discharge-rail');
      for(const x of [.4,4.5,8.55]){
        box(x,y-.035,0,.07,.07,z(x)-.07,steel,'discharge-stand');
        box(x-.14,y-.10,0,.35,.20,.035,cream,'discharge-stand-foot');
      }
    }
    for(let x=.35;x<9;x+=.65)tube([x,.61,z(x)-.05],[x,3.40,z(x)-.05],.045,steel,'discharge-roller');
    // A slim top return run captures the raised conveyor frame in the photos.
    for(const y of [.60,3.40])tube([.25,y,2.75],[9.15,y,1.65],.025,dark,'conveyor-return-rail');
    box(10.87,.015,.75,.92,.27,.95,red,'red-control-cabinet');
    for(const x of [11.03,11.30,11.57]){
      box(x,.002,1.31,.13,.013,.14,'#d0d2bd','meter-face');
      tube([x+.06,.002,1.13],[x+.06,.001,1.13],.027,green,'control-button',10);
    }
    return m.faces;
  }
  function welding(item) {
    const m=mesh(item,5,4),{box,tube,wheel}=m;
    box(.12,.20,0,4.73,3.60,.10,cream,'base-frame');
    for(const x of [.22,2.15,4.65])for(const y of [.33,3.42])box(x,y,.10,.09,.11,.80,cream,'table-leg');
    box(2.10,.40,.85,.84,3.13,.19,cream,'press-bed');
    box(2.18,.40,1.11,.67,3.13,.26,cream,'pressure-beam');
    for(const y of [.61,1.90,3.18]){
      tube([2.49,y,1.38],[2.49,y,1.94],.12,steel,'pneumatic-cylinder',20);
      tube([2.49,y,1.94],[2.49,y,2.01],.14,dark,'cylinder-cap',16);
      tube([2.49,y,1.04],[2.49,y,1.38],.035,steel,'cylinder-rod',12);
      tube([2.55,y,1.92],[2.87,y,1.85],.012,red,'air-hose',6);
    }
    for(const y of [.36,3.46])box(2.14,y,.98,.77,.10,.45,red,'red-side-cover');
    for(const x of [.32,1.02,1.70])tube([x,.47,1.05],[x,3.50,1.05],.16,'#c3bc9c','fixed-discharge-roller',24);
    box(.19,.36,.75,1.77,3.27,.10,cream,'discharge-support');
    for(const x of [2.96,3.24,3.52])tube([x,.47,.96],[x,3.50,.96],.035,steel,'feed-roller');
    box(3.58,.40,.90,1.25,3.16,.08,wood,'wood-feed-table');
    box(3.02,.19,.12,1.77,.18,.72,cream,'control-console');
    box(3.09,.17,.30,1.61,.018,.46,'#657368','control-panel');
    for(const x of [3.22,3.62,4.02,4.40]){
      box(x,.14,.60,.12,.035,.12,'#c3cbb8','temperature-meter');
      tube([x+.06,.13,.46],[x+.06,.11,.46],.035,dark,'control-dial',12);
    }
    for(const x of [.16,4.72])for(const y of [.32,3.52])box(x,y,.12,.055,.055,2.23,cream,'lamp-post');
    for(const y of [.32,3.52])box(.16,y,2.29,4.62,.055,.055,cream,'lamp-frame');
    box(2.02,.34,2.25,.07,3.14,.035,'#f0f0dc','lamp');
    for(const y of [.46,3.42]){
      tube([2.94,y,1.08],[2.94,y,1.72],.022,steel,'adjustment-screw');
      wheel(2.94,y,1.56,.12,red,'red-handwheel');
    }
    return m.faces;
  }
  function l41(item) {
    const m=mesh(item,3.25,3),{box,tube,wheel}=m;
    box(.17,.97,0,2.73,1.28,.87,cream,'vented-base-cabinet');
    for(const x of [.21,1.54]){
      box(x,.95,.12,1.28,.025,.68,'#d0d1bf','cabinet-door');
      for(let z=.22;z<.75;z+=.09)for(let xx=x+.13;xx<x+1.1;xx+=.30)box(xx,.939,z,.16,.012,.013,'#9ba69a','cabinet-vent');
    }
    box(.25,.69,.89,2.58,1.88,.09,wood,'fixed-work-table');
    for(const x of [.22,2.73])for(const y of [.74,2.42])box(x,y,.02,.08,.10,.87,cream,'table-leg');
    for(const x of [.30,2.68])for(const y of [1.07,1.98]){
      tube([x,y,.89],[x,y,1.83],.055,steel,'four-guide-post');
      tube([x,y,1.81],[x,y,2.03],.12,cream,'round-adjustment-cap');
    }
    box(.17,1.03,1.42,2.73,1.09,.39,cream,'manual-press-head');
    box(.36,1.12,1.38,2.32,.89,.045,'#4c5750','permanent-platen');
    for(const x of [.14,2.84]){
      box(x,1.00,1.07,.11,1.16,.31,red,'red-vent-side-cover');
      for(let y=1.12;y<2.1;y+=.20)box(x-.005,y,1.17,.12,.10,.018,'#74372c','side-cover-vent');
    }
    for(const x of [.52,1.54,2.54])tube([x,2.02,1.84],[x,2.02,1.88],.085,dark,'chain-sprocket',18);
    for(const y of [1.96,2.08])for(let x=.52;x<2.54;x+=.07)box(x,y,1.85,.045,.022,.022,dark,'exposed-chain-link');
    box(.20,1.00,1.70,2.67,.035,.10,cream,'front-button-panel');
    for(const x of [.70,1.54,2.35])tube([x,.987,1.75],[x,.969,1.75],.026,x===1.54?'#c3b16d':red,'front-control-button',12);
    box(2.98,1.22,.15,.22,.52,1.49,cream,'side-control-box');
    for(let z=.55;z<1.5;z+=.17)tube([3.10,1.20,z],[3.10,1.18,z],.026,z<.8?red:green,'side-control-button',10);
    for(const x of [.08,3.10])for(const y of [.55,2.46])box(x,y,0,.045,.045,2.55,cream,'lamp-post');
    for(const y of [.55,2.46])box(.08,y,2.50,3.065,.05,.05,cream,'lamp-frame');
    box(.12,.56,2.45,2.96,.04,.035,'#f0f0dc','lamp');
    return m.faces;
  }
  function build(item) {
    switch(code(item)){
      case 'PL-1':case 'PL-2':return rack(item);
      case 'J1-3':return j13(item);
      case 'D1-1':return d11(item);
      case 'WELDING':return welding(item);
      case 'L4-1':return l41(item);
      default:return null;
    }
  }
  function markers(item) {
    const key=code(item);if(!['D1-1','WELDING'].includes(key))return [];
    const w=key==='D1-1'?12:5,m=mesh(item,w,4);
    return [{key:'photoFeed',point:m.point([w-.10,2,1.30])},
      {key:key==='D1-1'?'d11Discharge':'photoDischarge',point:m.point([.16,2,key==='D1-1'?2.78:1.4])}];
  }
  window.ChinChunPhotoModels={matches,build,markers,height:item=>heights[code(item)] || null};
})();
