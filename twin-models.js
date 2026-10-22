/* Photo-informed display geometry only. Never writes CAD dimensions or cloud data. */
(() => {
  'use strict';
  const modelCode = item => String(item.photoModelCode || item.code || '').trim().toUpperCase();
  // Display-only calibration; rotate each corrected mesh and its footprint
  // rigidly about the same CAD center. Never rescale it to the old rectangle.
  const rotationOffset = item => ({'Q2-3':-90,'G2-1':180})[modelCode(item)] || 0;
  const matches = item => ['DIE CUT', 'WC-STALLS', 'H1-1', 'A1-1', 'A1-2', 'F1-1', 'G2-1', 'G2-2', 'B1-1', 'B1-2', 'B1-3', 'B1-4', 'E1-1', 'E1-2', 'Q2-1', 'Q2-2', 'Q2-3', 'J1-2'].includes(modelCode(item)) || Boolean(window.ChinChunPhotoModels?.matches(item));
  // Site relationship is a display overlay derived from live 2D, not another
  // equipment record or a mutation of the wall. Dimensions remain provisional.
  function dieCutSite(layout) {
    const item=(layout.equipment || []).find(q=>modelCode(q)==='DIE CUT');
    if(!item || (item.floor || '1F')!=='1F')return null;
    const w=Number(item.width),h=Number(item.height),x=Number(item.x),y=Number(item.y);
    if(![w,h,x,y].every(Number.isFinite) || w<=0 || h<=0)return null;
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const point=(u,v)=>[x+w/2+(u-w/2)*c-(v-h/2)*s,y+h/2+(u-w/2)*s+(v-h/2)*c];
    const footprint=[[0,0],[w,0],[w,h],[0,h]].map(p=>point(...p));
    const out=point(w/2,0),feed=point(w/2,h),boundary=Number(layout.grid?.factory_depth)||40;
    // Never invent a connection if moved inside, turned away, or far from the wall.
    if(c<.85 || Math.min(...footprint.map(p=>p[1]))<=boundary+.1)return null;
    const travel=(out[1]-boundary)/c;
    if(travel<0 || travel>3)return null;
    const cx=out[0]+s*travel,openingWidth=w*.70,lo=cx-openingWidth/2,hi=cx+openingWidth/2;
    const wall=(layout.walls || []).find(q=>(q.floor || '1F')==='1F' && Math.abs(Number(q.y1)-boundary)<.05 && Math.abs(Number(q.y2)-boundary)<.05 && Math.min(q.x1,q.x2)<=lo && Math.max(q.x1,q.x2)>=hi);
    const l41=(layout.equipment || []).find(q=>modelCode(q)==='L4-1');
    if(!wall || !l41 || hi>=Number(l41.x)-.1)return null;
    const collection={x:lo-.15,y:boundary-2.5,width:openingWidth+.3,height:2.2};
    const table={x:lo+.05,y:boundary-.85,width:openingWidth-.1,height:out[1]-boundary+.88};
    const pad={x:Math.min(lo-.35,...footprint.map(p=>p[0]))-.1,y:boundary+.11,
      width:Math.max(hi+.35,...footprint.map(p=>p[0]))-Math.min(lo-.35,...footprint.map(p=>p[0]))+.2,
      height:Math.max(...footprint.map(p=>p[1]))-boundary+.25};
    return {item,wall,footprint,out,feed,opening:{x:lo,y:boundary,width:openingWidth,sill:.35,top:1.6},collection,table,pad,
      // Owner confirmed this filled extension is only 0.5 m below the main floor.
      insideRise:1.5,outsideRise:1.0,beltHeight:1.0};
  }
  function dieCutSiteFaces(site) {
    const faces=[];
    const box=(x,y,z,w,d,h,color,part)=>{
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      for(const ids of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])faces.push({points:ids.map(i=>p[i]),color,part});
    };
    const p=site.pad,t=site.table;
    box(p.x,p.y,0,p.width,p.height,site.outsideRise,'#9caa91','filled-ground');
    const r=site.collection;
    for(const y of [r.y,r.y+r.height-.025])box(r.x,y,site.insideRise+.005,r.width,.025,.015,'#229d80','collection-zone');
    for(const x of [r.x,r.x+r.width-.025])box(x,r.y,site.insideRise+.005,.025,r.height,.015,'#229d80','collection-zone');
    box(t.x,t.y,1.96,t.width,t.height,.04,'#a47c54','collection-table');
    for(const x of [t.x+.06,t.x+t.width-.12])for(const y of [t.y+.05,t.y+t.height-.12]){
      const base=y<site.opening.y?site.insideRise:site.outsideRise;
      box(x,y,base,.06,.06,1.96-base,'#aab7b3','collection-table-leg');
    }
    return faces;
  }
  function buildDieCut(item) {
    const faces=[],cream='#e4e3d5',steel='#b9c9c8',dark='#3e4b50',green='#16836d',yellow='#e8b831';
    const w=Math.max(.05,Number(item.width)||3.25),h=Math.max(.05,Number(item.height)||3);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{const u=x/3.25*w-w/2,v=y/3*h-h/2;return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+h/2+u*s+v*c,z];};
    function box(x,y,z,bw,bd,bh,color=cream,part='frame') {
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      for(const ids of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])faces.push({points:ids.map(i=>world(p[i])),color,part});
    }
    function roller(x,y,z,length,r,color=steel,part='roller') {
      const rings=[x,x+length].map(v=>Array.from({length:16},(_,i)=>world([v,y+r*Math.cos(i*Math.PI/8),z+r*Math.sin(i*Math.PI/8)])));
      faces.push({points:[...rings[0]].reverse(),color,part},{points:rings[1],color,part});
      rings[0].forEach((p,i)=>{const j=(i+1)%16;faces.push({points:[p,rings[0][j],rings[1][j],rings[1][i]],color,part});});
    }
    // Local top is discharge toward the original building; bottom is extension feed.
    box(.37,.08,.88,2.45,2.77,.10,cream,'conveyor-frame');
    box(.48,.08,.98,2.22,2.72,.025,green,'green-belt');
    for(const x of [.39,2.72])for(const y of [.14,2.66])box(x,y,0,.08,.10,.88,steel,'conveyor-leg');
    for(const x of [.39,2.72])box(x,.16,.22,.07,2.60,.07,cream);
    // Full-height cheeks, open working throat, open-top housing and exposed ribs.
    for(const x of [.34,2.70]) {
      box(x,1.12,0,.19,.76,2.34,cream,'press-cheek');
      box(x-.01,1.13,.55,.21,.73,1.30,dark,'dark-side-cover');
    }
    box(.34,1.12,1.58,2.55,.12,.76,cream,'open-top-housing');
    box(.34,1.77,1.58,2.55,.12,.76,cream,'open-top-housing');
    for(const x of [.74,1.36,1.98,2.58])box(x,1.24,1.94,.035,.53,.22,steel,'housing-rib');
    for(const x of [1.00,2.03])box(x,1.37,2.10,.36,.28,.15,dark,'drive-motor');
    box(.53,1.16,.22,2.17,.60,.32,cream,'press-base');
    box(.53,1.16,1.13,2.17,.60,.20,'#a64b37','press-crossbeam');
    box(.53,1.13,1.03,2.17,.65,.10,yellow,'press-platen');
    for(const y of [1.04,1.95])roller(.51,y,1.54,2.20,.024,steel,'actuator-rail');
    for(const x of [.72,1.54,2.35]) {
      box(x,1.92,1.28,.10,.09,.36,steel,'actuator');
      box(x+.035,1.91,1.07,.03,.10,.24,dark,'actuator-rod');
    }
    // Yellow mesh guards are permanent equipment, not surrounding stored material.
    for(const x of [.34,2.80])for(const [y,d] of [[.08,1.00],[1.93,.88]]){
      for(const z of [1.02,1.57])box(x,y,z,.035,d,.035,yellow,'safety-guard');
      for(const yy of [y,y+d-.035])box(x,yy,1.02,.035,.035,.585,yellow,'safety-guard');
      for(let yy=y+.1;yy<y+d-.03;yy+=.1)box(x,yy,1.06,.013,.012,.50,yellow,'guard-mesh');
      for(let z=1.15;z<1.55;z+=.1)box(x,y,z,.013,d,.012,yellow,'guard-mesh');
    }
    for(const y of [2.86,2.95])roller(.36,y,.96,2.47,.022,steel,'feed-guide');
    box(.01,1.13,0,.29,.66,1.63,cream,'control-cabinet');
    box(.015,1.115,1.07,.27,.016,.44,'#398f91','control-panel');
    box(.05,1.095,1.22,.20,.016,.22,'#253e46','touchscreen');
    box(.05,1.09,.94,.045,.03,.045,'#b6412c','emergency-stop');
    return faces;
  }
  function restroomLayout(item) {
    const width=Math.max(.2,Number(item.width)||5),height=Math.max(.2,Number(item.height)||5);
    const wall=Math.min(.15,width*.03,height*.03),doorWidth=Math.min(.9,height-2*wall);
    const doorStart=(height-doorWidth)/2,doorEnd=(height+doorWidth)/2;
    const upper=Math.max(.01,doorStart-wall),urinalSize=Math.min(.48,upper/2.6);
    const urinals=[.25,.73].map(r=>({x:wall+.02,y:wall+upper*r-urinalSize/2,width:Math.min(.4,width*.12),height:urinalSize}));
    const stallStart=Math.max(wall+Math.min(.4,width*.12)+.55,width*.36);
    const stallWidth=Math.max(.02,(width-wall-stallStart)/3);
    const stallDepth=Math.max(.02,Math.min(1.65,doorStart-wall-.10));
    const stalls=Array.from({length:3},(_,i)=>({x:stallStart+i*stallWidth,y:wall,width:stallWidth,height:stallDepth,
      doorWidth:Math.max(.01,Math.min(.65,stallWidth-.16))}));
    const sink={x:wall+.12,y:height-wall-Math.min(.55,height*.13),width:Math.min(2,Math.max(.02,width-2*wall-.24)),height:Math.min(.55,height*.13)};
    return {width,height,wall,doorWidth,doorStart,doorEnd,urinals,stalls,sink,
      compact:upper<1.1 || stallWidth<.8 || stallDepth<1.2 || sink.width<2-.001};
  }
  function buildRestroom(item) {
    const l=restroomLayout(item),faces=[],wallColor='#c7d6d3',white='#edf3ed',ceramic='#d2e6e7',doorColor='#af825b';
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{
      const lx=x-l.width/2,ly=y-l.height/2;
      return [(Number(item.x)||0)+l.width/2+lx*c-ly*s,(Number(item.y)||0)+l.height/2+lx*s+ly*c,z];
    };
    function box(x,y,z,w,d,h,color,part,cutaway=false) {
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>faces.push({points:ids.map(i=>world(p[i])),color,part,cutaway}));
    }
    function panel(x,y,w,d,h,color,part) {
      box(x,y,0,w,d,Math.min(.45,h),color,part);
      if(h>.45)box(x,y,.45,w,d,h-.45,color,part,true);
    }
    function oval(cx,cy,z,rx,ry,h,color,part) {
      const rings=[z,z+h].map(high=>Array.from({length:24},(_,i)=>world([cx+rx*Math.cos(i*Math.PI/12),cy+ry*Math.sin(i*Math.PI/12),high])));
      faces.push({points:[...rings[0]].reverse(),color,part},{points:rings[1],color,part});
      rings[0].forEach((p,i)=>{const j=(i+1)%24;faces.push({points:[p,rings[0][j],rings[1][j],rings[1][i]],color,part});});
    }
    const t=l.wall,w=l.width,h=l.height;
    box(0,0,0,w,h,.035,'#b8c9c4','floor');
    // All four exterior sides exist; only the centered left entrance is cut out.
    panel(0,0,w,t,2.4,wallColor,'north-wall');panel(0,h-t,w,t,2.4,wallColor,'south-wall');
    panel(w-t,t,t,h-2*t,2.4,wallColor,'east-wall');
    panel(0,t,t,Math.max(.001,l.doorStart-t),2.4,wallColor,'west-wall');
    panel(0,l.doorEnd,t,Math.max(.001,h-t-l.doorEnd),2.4,wallColor,'west-wall');
    box(0,l.doorStart,2.05,t,l.doorWidth,.35,wallColor,'entrance-lintel',true);
    // Single entrance door shown inward-open; handing and heights are illustrative.
    panel(t,l.doorEnd-.035,l.doorWidth,.035,2.02,doorColor,'entrance-door');
    for(const u of l.urinals){
      box(u.x,u.y,.58,u.width*.28,u.height,.64,white,'urinal');
      oval(u.x+u.width*.57,u.y+u.height/2,.55,u.width*.48,u.height*.43,.14,ceramic,'urinal');
      oval(u.x+u.width*.57,u.y+u.height/2,.695,u.width*.30,u.height*.27,.008,'#749ba0','urinal');
    }
    const sy=l.stalls[0].y,sh=l.stalls[0].height;
    for(const st of l.stalls){
      panel(st.x,sy,.065,sh,1.8,wallColor,'stall-partition');
      const gap=(st.width-st.doorWidth)/2,front=sy+sh;
      panel(st.x,front,gap,.065,1.8,wallColor,'stall-front');
      panel(st.x+gap+st.doorWidth,front,gap,.065,1.8,wallColor,'stall-front');
      panel(st.x+gap,front,st.doorWidth,.04,1.72,doorColor,'stall-door');
      const cx=st.x+st.width/2,cy=sy+sh*.48,bw=Math.min(.36,st.width*.48),bd=Math.min(.50,sh*.50);
      box(cx-bw/2,sy+.08,.25,bw,Math.min(.18,sh*.18),.38,white,'toilet-tank');
      oval(cx,cy,.10,bw*.42,bd*.42,.27,white,'toilet');
      oval(cx,cy,.37,bw*.5,bd*.5,.045,ceramic,'toilet');
      oval(cx,cy,.418,bw*.30,bd*.30,.005,'#789ca1','toilet');
    }
    const sink=l.sink;
    box(sink.x,sink.y,.12,sink.width,sink.height,.64,'#a0b4ad','sink');
    box(sink.x,sink.y,.76,sink.width,sink.height,.07,white,'sink');
    for(const r of [.27,.73]){
      oval(sink.x+sink.width*r,sink.y+sink.height*.52,.832,Math.min(.23,sink.width*.16),sink.height*.34,.008,'#83a8ae','basin');
      box(sink.x+sink.width*r-.018,sink.y+sink.height*.82,.83,.036,.036,.15,'#b9cdd0','faucet');
    }
    return faces;
  }
  function a12Point(item, [x,y,z]) {
    // PDF is the 16 x 2 m reference. Live CAD alone owns the actual footprint.
    const w=Math.max(.05,Number(item.width)||16),d=Math.max(.05,Number(item.height)||2);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const lx=x/16*w-w/2,ly=y/2*d-d/2;
    return [(Number(item.x)||0)+w/2+lx*c-ly*s,(Number(item.y)||0)+d/2+lx*s+ly*c,z];
  }
  function sectionMarkers(item) {
    if(modelCode(item)!=='A1-2')return [];
    return [.8,2.25,4.45,6.8,10.9,15.15].map((x,i)=>({number:i+1,point:a12Point(item,[x,1,2.8])}));
  }
  function buildA12(item) {
    // Six distinct units, numbered from CAD-left to CAD-right as in the PDF.
    // Corrected D7413BEC photo belongs to section 5 (oven), not section 4.
    // Section lengths/heights are estimates; no stock, carts beside the line,
    // building columns, people, material rolls or freestanding fans are modeled.
    const faces=[],cream='#ded5b7',steel='#aebcbd',chrome='#d0d9d8',dark='#333e3e';
    const red='#c65333',green='#86a437',brown='#a17852',mesh='#544c40';
    let section=1;
    const face=(points,color)=>faces.push({points:points.map(p=>a12Point(item,p)),color,section});
    function box(x,y,z,w,d,h,color=cream) {
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=chrome,segments=16) {
      const v=b.map((n,i)=>n-a[i]),len=Math.hypot(...v),u=v.map(n=>n/len);
      const ref=Math.abs(u[2])<.9?[0,0,1]:[0,1,0];
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,ref);const el=Math.hypot(...e);e=e.map(n=>n/el);const f=cross(u,e);
      const ring=p=>Array.from({length:segments},(_,i)=>p.map((n,j)=>n+r*(e[j]*Math.cos(i*2*Math.PI/segments)+f[j]*Math.sin(i*2*Math.PI/segments))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>{const j=(i+1)%segments;face([p,ra[j],rb[j],rb[i]],color);});
    }
    const roller=(x,z,r,color=chrome)=>tube([x,.19,z],[x,1.81,z],r,color,24);
    function frame(x,w,top=1.0) {
      for(const y of [.05,1.83]) {
        box(x,y,.13,w,.12,.13);
        box(x,y,top,w,.12,.10);
        for(const px of [x,x+w-.12])box(px,y,.04,.12,.12,top);
      }
      for(const px of [x,x+w-.12])box(px,.05,.22,.12,1.90,.10);
    }
    function handwheel(x,y,z,r=.12) {
      tube([x,y-.025,z],[x,y+.025,z],r,dark,20);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;tube([x,y-.03,z],[x+Math.cos(a)*r,y-.03,z+Math.sin(a)*r],.009,chrome,6);}
    }
    function control(x,y,z,w=.34,h=.65) {
      box(x,y,z,w,.15,h,red);
      box(x+.06,y-.012,z+h-.22,w-.12,.012,.13,dark);
      for(const dz of [.12,.28])tube([x+w/2,y-.018,z+dz],[x+w/2,y-.006,z+dz],.025,dz===.12?'#9e3d2a':'#41834a',10);
    }
    // 1. Winder: two fixed silver drums and rear guide bars, not a stock coil.
    frame(.08,1.38,.81);box(.08,.05,.17,1.38,1.90,.56);
    for(const x of [.40,.95])roller(x,.99,.22);
    for(const x of [1.17,1.39])roller(x,1.28,.045,steel);
    box(.98,1.79,.83,.07,.08,.74);control(.86,1.72,1.46,.35,.57);
    // 2. Separate vertical press pair with two screw-adjustment towers.
    section=2;frame(1.65,1.18,.65);
    roller(2.23,.66,.27,steel);roller(2.23,1.20,.27,chrome);
    for(const y of [.07,1.82]) {
      for(const x of [1.98,2.49])box(x,y,.13,.075,.10,1.78);
      box(1.98,y,1.82,.59,.10,.08);
      tube([2.23,y+.05,1.26],[2.23,y+.05,2.04],.025,steel,10);
      tube([2.23,y+.05,2.05],[2.23,y+.05,2.08],.11,dark,20);
    }
    tube([2.23,.93,.31],[2.23,1.32,.31],.15,dark,20);
    control(2.49,1.72,1.93,.31,.53);
    // 3. Laminating station: green entry belt at the right, brown nip rolls,
    // two independently driven silver rolls nearer the left, and open bed.
    section=3;frame(3.05,2.93,.83);
    box(4.65,.15,.81,1.27,1.70,.11,'#365d48');
    face([[4.67,.18,.94],[5.90,.18,.94],[5.90,1.82,.94],[4.67,1.82,.94]],'#35694f');
    for(const [x,z,r,col] of [[3.40,1.02,.24,chrome],[3.99,1.02,.24,steel],[4.70,1.26,.24,brown],[5.16,1.22,.23,brown],[5.71,.98,.07,brown]])roller(x,z,r,col);
    for(const x of [3.39,3.98,4.72])for(const y of [.08,1.82]) {
      box(x-.09,y,.72,.18,.10,.86);tube([x,y+.05,1.52],[x,y+.05,1.79],.032,steel,10);
    }
    for(const x of [3.42,4.0]) {
      tube([x,1.73,1.77],[x,1.90,1.77],.13,'#596364',20);
      tube([x,.04,.48],[x,.29,.48],.13,dark,16);
    }
    roller(4.97,1.96,.045,steel);
    for(const y of [.09,1.84])box(4.92,y,.05,.07,.07,2.48,green);
    box(4.92,.09,2.48,.07,1.82,.07,green);
    control(3.10,.04,1.57,.35,.65);
    // 4. Inline wheeled roller bridge. The green trolley beside it is excluded.
    section=4;frame(6.20,1.16,.90);
    for(const x of [6.26,6.49,6.72,6.95,7.18])roller(x,1.0,.045);
    for(const x of [6.27,7.12])for(const y of [.16,1.84]) {
      tube([x,y-.04,.075],[x,y+.04,.075],.075,dark,12);
      box(x-.035,y-.04,.10,.07,.08,.08,steel);
    }
    // 5. Long low insulated conveyor oven with open underside, green trims,
    // brown mesh/red belt edges, output extraction hood, blower and controls.
    section=5;frame(7.49,6.87,.88);
    box(8.12,.06,.92,5.51,1.88,.34);
    box(8.12,.045,1.10,5.51,.035,.13,green);
    box(8.12,1.92,1.10,5.51,.035,.13,green);
    box(8.12,.08,1.26,5.51,1.84,.025,'#bdc4b5');
    // The belt is a fixed machine component; no production sheet is added.
    box(7.50,.20,.88,6.84,1.60,.035,mesh);
    for(const y of [.20,1.77])box(7.50,y,.917,6.84,.03,.012,'#ad4243');
    for(const x of [7.53,14.27])roller(x,.87,.09,mesh);
    // Hollow trapezoidal hood over the oven's section-4 / discharge end.
    const hood=[[7.70,.13,1.23],[8.76,.13,1.23],[8.76,1.87,1.23],[7.70,1.87,1.23],
      [8.04,.65,1.80],[8.46,.65,1.80],[8.46,1.35,1.80],[8.04,1.35,1.80]];
    [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>hood[i]),cream));
    for(const y of [.70,1.31])tube([8.25,y-.07,2.02],[8.25,y+.07,2.02],.22,'#303638',24);
    box(8.15,.73,1.79,.21,.54,.12,dark);
    tube([8.25,.93,2.02],[8.25,1.07,2.02],.11,steel,16);
    box(12.92,.41,1.29,.61,1.18,.35,'#bbbbaa');
    box(12.95,.395,1.33,.55,.015,.27,cream);
    for(const x of [13.04,13.23,13.42])box(x,.38,1.46,.09,.02,.09,dark);
    for(const x of [9.35,11.15]) {
      tube([x,.93,1.29],[x,.93,1.48],.008,dark,6);
      tube([x,.91,1.49],[x,.95,1.49],.025,steel,10);
    }
    // 6. Glue head at the rightmost end; entry roller bank, angled glue tray,
    // orange side cabinet, lower pneumatic cylinder and overhead light frame.
    section=6;frame(14.60,1.30,.85);
    roller(15.27,1.22,.18,steel);roller(15.27,.86,.16,'#dfdfc9');
    for(const x of [14.70,15.72])roller(x,.71,.045,chrome);
    for(const y of [.06,1.82]) {
      box(15.12,y,.65,.14,.12,.93);
      tube([15.17,y+.07,.27],[15.17,y+.07,.57],.045,steel,12);
      tube([15.17,y+.07,.57],[15.17,y+.07,.81],.018,chrome,10);
      handwheel(15.56,y+.06,1.40,.10);
      box(14.82,y,.04,.07,.07,2.39);
    }
    face([[15.32,.21,1.33],[15.74,.21,1.48],[15.74,1.79,1.48],[15.32,1.79,1.33]],'#928966');
    box(14.82,.06,2.39,.07,1.83,.07);
    box(14.91,.18,2.36,.06,1.62,.04,'#e8ece7');
    control(15.34,.04,1.73,.42,.65);
    tube([15.34,.08,.50],[15.34,.26,.50],.14,dark,16);
    return faces;
  }
  function buildH1(item) {
    const faces = [], cream = '#d8d1ad', steel = '#a8b9ba', dark = '#303b3c', red = '#c94e31';
    // Owner confirmed oven top = 2.4 m; other component heights remain estimates.
    // CAD-left (local x=0) is collection; CAD-right is the two-person feed end.
    const verticalScale = .64;
    // H1-1 is 14.82 × 2 m in the validated 2D layout.
    const referenceLength = 14.82;
    const length = Math.max(.05, Number(item.width) || referenceLength), depth = Math.max(.05, Number(item.height) || 2);
    const angle = (Number(item.rotation) || 0) * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
    const world = ([x,y,z]) => {
      x = x / 20.23 * length - length / 2; y = y / 2 * depth - depth / 2;
      return [(Number(item.x)||0)+length/2+x*c-y*s, (Number(item.y)||0)+depth/2+x*s+y*c, z*verticalScale];
    };
    const face = (points,color) => faces.push({points:points.map(world),color});
    function box(x,y,z,w,d,h,color) {
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color,segments=12) {
      const v=b.map((n,i)=>n-a[i]),len=Math.hypot(...v),u=v.map(n=>n/len);
      const ref=Math.abs(u[2])<.9?[0,0,1]:[0,1,0];
      const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
      let e=cross(u,ref);const el=Math.hypot(...e);e=e.map(n=>n/el);const f=cross(u,e);
      const ring=p=>Array.from({length:segments},(_,i)=>p.map((n,j)=>n+r*(e[j]*Math.cos(i*2*Math.PI/segments)+f[j]*Math.sin(i*2*Math.PI/segments))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>{const j=(i+1)%segments;face([p,ra[j],rb[j],rb[i]],color);});
    }
    const roller=(x,z,r,color=steel,y=.14,d=1.72)=>tube([x,y,z],[x,y+d,z],r,color,24);
    function web(path,color='#e8dfba') {
      for(let i=1;i<path.length;i++) {
        const [x,z]=path[i-1],[nx,nz]=path[i];
        face([[x,.23,z],[nx,.23,nz],[nx,1.77,nz],[x,1.77,z]],color);
      }
    }
    function frame(x,w,top=1.25) {
      for(const y of [.05,1.83]) {
        box(x,y,.08,w,.12,.14,cream);
        for(const px of [x,x+w-.12]){box(px,y,.08,.12,.12,top,cream);box(px-.04,y-.03,.025,.20,.18,.055,dark);}
      }
      for(const px of [x,x+w-.12])box(px,.05,.22,.12,1.9,.12,cream);
    }
    // Collection at x=.25 (left in the unrotated plan); feed at x=18.25.
    for(const x of [.25,18.25]) {
      frame(x,1.65,1.35);
      roller(x+.8,1.32,.47,'#e8dfba');roller(x+.8,.72,.18,dark);roller(x+1.22,.37,.18,'#ac8354');
      tube([x+.8,0,1.32],[x+.8,2,1.32],.065,steel);
      for(const y of [.04,1.83])box(x+.62,y,1.15,.34,.13,.22,'#547966');
    }
    // Open web gantries on the feed side.
    for(const x of [2.5,5.2]) {
      for(const y of [.06,1.82])box(x,y,0,.13,.12,2.55,cream);
      box(x,.06,2.5,.13,1.88,.13,cream);roller(x,2.43,.065);
    }
    web([[1.05,1.65],[2.5,2.43],[5.2,2.43],[6.9,1.45]]);
    // Central drum: horizontal axle, exposed circular ends and polygonal frame.
    frame(6.55,3.5,1.05);
    const cx=8.25,cz=1.95,r=1.24;
    roller(cx,cz,r,'#9a7757',.18,1.64);
    // Cream process sheet follows the upper drum surface.
    const wrap=Array.from({length:25},(_,i)=>{const a=(-25+i*230/24)*Math.PI/180;return[cx+Math.cos(a)*(r+.015),cz+Math.sin(a)*(r+.015)];});
    web(wrap);
    for(const y of [.14,1.86]) {
      tube([cx,y-.025,cz],[cx,y+.025,cz],r,'#899697',40);
      for(let k=0;k<8;k++) {
        const a=k*Math.PI/4,b=(k+1)*Math.PI/4;
        const p=[cx+Math.cos(a)*1.37,y,cz+Math.sin(a)*1.37],q=[cx+Math.cos(b)*1.37,y,cz+Math.sin(b)*1.37];
        tube(p,q,.072,cream,4);
        if(k%2===0)tube([cx,y,cz],[cx+Math.cos(a)*1.17,y,cz+Math.sin(a)*1.17],.018,'#cbb04d',6);
      }
      tube([cx,y-.08,cz],[cx,y+.08,cz],.16,cream,16);
      tube([cx-.65,y,.24],[cx,y,cz],.075,cream,4);
      tube([cx+.65,y,.24],[cx,y,cz],.075,cream,4);
      for(const side of [-1,1]) {
        const a=[cx+side*.94,y,cz+.94],b=[cx+side*1.4,y,cz+1.4];
        tube(a,b,.075,steel);tube(b,[cx+side*1.55,y,cz+1.55],.035,dark);
      }
    }
    for(const x of [6.85,9.65]){roller(x,.98,.16,'#795c42');roller(x,.61,.19,steel);}
    box(7.45,.03,.18,1.4,.18,.65,red);box(7.75,1.78,.2,1.0,.19,1.28,red);
    // Control panel and its visible buttons/meters.
    box(6.75,.015,1.08,.55,.19,.72,cream);
    for(const x of [6.82,7.06]) {
      box(x,.006,1.52,.16,.01,.16,dark);
      for(const z of [1.2,1.36])tube([x+.08,-.004,z],[x+.08,.006,z],.033,z===1.2?'#ac3324':'#5d9c5f',10);
    }
    // Silver oven: confirmed highest point, exactly 2.4 m above the equipment floor.
    for(const x of [10.25,14.9]) {
      for(const y of [.05,1.83])box(x,y,0,.12,.12,2.12/verticalScale,cream);
      roller(x,2.03/verticalScale,.08);box(x,.05,.22,.12,1.9,.1,cream);
    }
    box(10.1,.02,2.12/verticalScale,5.2,1.96,.28/verticalScale,'#aababc');
    for(let x=10.3;x<15.1;x+=.44)box(x,.008,2.14/verticalScale,.018,.014,.24/verticalScale,'#d1d9d6');
    web([[9.1,2.87],[10.25,2.03/verticalScale],[14.9,2.03/verticalScale],[16.6,1.4],[19.05,1.62]]);
    frame(15.7,1.8,1.4);roller(16.1,1.42,.09);roller(17.2,1.42,.09);
    for(const y of [.08,1.86]) {
      tube([16.2,y,.45],[16.2,y,1.95],.065,steel);
      tube([16.2,y,.35],[16.2,y,.85],.09,cream);
    }
    // Green fan frame above the feed path; fan itself faces down.
    for(const y of [.12,1.83])box(4.1,y,2.55,.065,.065,.92,'#699438');
    box(4.1,.12,3.4,.065,1.78,.065,'#699438');
    tube([4.12,1,3.27],[4.12,1,3.33],.37,dark,20);
    for(let k=0;k<6;k++) {const a=k*Math.PI/3;tube([4.12,1,3.26],[4.12+Math.cos(a)*.34,1+Math.sin(a)*.34,3.26],.017,steel,4);}
    // Representative hoses, not a wiring diagram.
    for(const y of [.11,1.89]) {
      const path=[[6.8,y,.6],[6.55,y,1.3],[6.8,y,2.8],[7.3,y,3.12]];
      for(let i=1;i<path.length;i++)tube(path[i-1],path[i],.016,red,6);
    }
    return faces;
  }
  function buildA1(item) {
    // A1-1 is an open EVA processing line. All vertical dimensions are photo estimates.
    // Coordinates are local to the existing 13.6 × 3.7 m CAD footprint.
    const faces = [];
    const cream = '#d9d2b8', steel = '#a8b6b7', chrome = '#c9d2d0';
    const dark = '#303a3c', belt = '#244944', red = '#bc3326', green = '#668744';
    const length = Math.max(.05, Number(item.width) || 13.6);
    const depth = Math.max(.05, Number(item.height) || 3.7);
    const angle = (Number(item.rotation) || 0) * Math.PI / 180;
    const c = Math.cos(angle), s = Math.sin(angle);
    const centerX = (Number(item.x) || 0) + length / 2;
    const centerY = (Number(item.y) || 0) + depth / 2;
    const world = ([x,y,z]) => {
      const lx = x / 13.6 * length - length / 2;
      const ly = y / 3.7 * depth - depth / 2;
      return [centerX + lx*c - ly*s, centerY + lx*s + ly*c, z];
    };
    const face = (points,color) => faces.push({points:points.map(world),color});
    function box(x,y,z,w,d,h,color) {
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color,segments=12) {
      const v=b.map((n,i)=>n-a[i]),len=Math.hypot(...v),u=v.map(n=>n/len);
      const ref=Math.abs(u[2])<.9?[0,0,1]:[0,1,0];
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,ref);const el=Math.hypot(...e);e=e.map(n=>n/el);const f=cross(u,e);
      const ring=p=>Array.from({length:segments},(_,i)=>p.map((n,j)=>n+r*(e[j]*Math.cos(i*2*Math.PI/segments)+f[j]*Math.sin(i*2*Math.PI/segments))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>{const j=(i+1)%segments;face([p,ra[j],rb[j],rb[i]],color);});
    }
    const roller=(x,z,r,color=chrome)=>tube([x,.28,z],[x,3.42,z],r,color,20);
    // Photo 1 shows the entire side elevation: collection rolls at local left,
    // a long open transfer span, the large drum near the right, and the entry
    // conveyor still farther right. No people, surrounding columns, or carts.
    for(const y of [.12,3.46]) {
      box(.2,y,.02,13.15,.12,.13,cream);
      box(.3,y,2.08,7.45,.065,.075,cream);
      for(const x of [.35,3.45,7.65]) {
        box(x,y,.04,.075,.075,2.08,cream);
        box(x-.04,y-.035,0,.21,.20,.06,green);
      }
    }
    for(const x of [.35,7.65])box(x,.12,2.08,.075,3.40,.075,cream);
    // Collection bank: broad polished rolls at the left and smaller brown guides
    // above the open frame (photos 1 and the earlier front/overhead series).
    for(const [x,z,r,color] of [[.55,.49,.22,chrome],[1.04,.56,.24,steel],[1.52,.7,.14,'#876c4e'],[2.08,.86,.10,'#987c59'],[2.7,.98,.09,'#ad8b61']])roller(x,z,r,color);
    for(const x of [.35,1.35,2.7]) {
      for(const y of [.15,3.39])box(x,y,.12,.14,.15,.85,cream);
    }
    // The sheet visibly spans diagonally from the high drum toward the left
    // collection bank. These connected panels are material, not a solid block.
    const web='#e4dec9',webY0=.44,webY1=3.26;
    function sheet(path,color=web) {
      for(let i=1;i<path.length;i++) {
        const [x,z]=path[i-1],[nx,nz]=path[i];
        face([[x,webY0,z],[nx,webY0,nz],[nx,webY1,nz],[x,webY1,z]],color);
      }
    }
    sheet([[1.06,.83],[2.1,.92],[4.1,1.02],[6.7,1.22],[7.62,1.47],[8.2,1.99]]);
    // The large exposed wheel is toward the right end of the long machine.
    const drumX=8.75,drumZ=1.35,drumR=.78;
    tube([drumX,.34,drumZ],[drumX,3.36,drumZ],drumR,'#5b6060',32);
    for(let i=0;i<20;i++) {
      const a=(-205+i*230/20)*Math.PI/180,b=(-205+(i+1)*230/20)*Math.PI/180;
      face([[drumX+Math.cos(a)*(.79),webY0,drumZ+Math.sin(a)*(.79)],
        [drumX+Math.cos(b)*(.79),webY0,drumZ+Math.sin(b)*(.79)],
        [drumX+Math.cos(b)*(.79),webY1,drumZ+Math.sin(b)*(.79)],
        [drumX+Math.cos(a)*(.79),webY1,drumZ+Math.sin(a)*(.79)]],web);
    }
    for(const y of [.25,3.36]) {
      tube([drumX,y-.08,drumZ],[drumX,y+.08,drumZ],.17,steel,16);
      box(7.84,y,.18,1.82,.12,.16,cream);
      tube([8.06,y,.18],[8.55,y,1.54],.055,cream,6);
      tube([9.44,y,.2],[8.96,y,1.55],.055,cream,6);
    }
    // Process nip/coating station sits between wheel and green entrance table
    // (photos 3–4). The entrance belt is genuinely to the wheel's right.
    for(const [x,z,r,color] of [[9.66,.77,.15,'#8b725a'],[9.93,.92,.12,chrome],[10.26,.85,.14,steel],[10.48,1.0,.09,chrome]])roller(x,z,r,color);
    box(9.74,.27,.2,.58,3.15,.14,dark);
    for(const y of [.26,3.28])box(9.73,y,.2,.73,.12,.72,cream);
    sheet([[9.43,1.6],[9.68,1.02],[10.1,.94],[10.48,.93],[10.8,.88]]);
    box(10.62,.3,.45,2.7,3.1,.17,green);
    face([[10.68,.32,.67],[13.24,.32,.67],[13.24,3.38,.67],[10.68,3.38,.67]],belt);
    roller(10.73,.67,.13,dark);roller(13.16,.67,.13,steel);
    for(const y of [.27,3.35])box(10.6,y,.17,2.75,.1,.59,cream);
    for(const x of [11.0,12.25,13.08])for(const y of [.31,3.26])box(x,y,.03,.08,.09,.5,green);
    sheet([[10.8,.88],[11.6,.69],[13.12,.69]]);
    // Two separate red electrical cabinets are visible in the side photos:
    // one at collection and another beside the drum.
    box(.65,3.28,.08,.075,.075,1.22,cream);
    box(.40,3.23,.94,.65,.16,.70,red);
    for(const x of [.52,.72,.92])for(const z of [1.08,1.27,1.45])
      tube([x,3.39,z],[x,3.41,z],.025,z===1.08?green:dark,8);
    box(7.15,3.23,.16,1.15,.31,1.65,red);
    box(7.21,3.55,.31,1.03,.025,1.43,'#ce402d');
    for(const x of [7.38,7.68,7.98])for(const z of [.58,.88,1.18,1.5])
      tube([x,3.59,z],[x,3.60,z],.047,z===.58?green:z===.88?dark:steel,10);
    box(7.64,3.30,.32,.56,.18,.54,green);
    // Open transfer-span rails and suspended fan, without a closed box body.
    box(7.28,1.51,1.80,.09,.68,.66,'#697273');
    tube([7.26,1.85,2.12],[7.28,1.85,2.12],.29,dark,24);
    for(let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      tube([7.25,1.85,2.12],[7.25,1.85+Math.cos(a)*.26,2.12+Math.sin(a)*.26],.012,steel,6);
    }
    return faces;
  }
  function buildF1(item) {
    // Six owner-supplied photos: overhead catwalk, orange rails and ladder,
    // cream enclosure, process rolls and empty right-end winding shaft.
    // Foam is consumable material and deliberately excluded from machine geometry.
    // Owner confirmed winding end = CAD-right and maximum height approximately 2.8 m.
    const faces=[],cream='#dcd6bb',steel='#bac4c2',dark='#303339',orange='#d9542c',green='#4e8263';
    const length=Math.max(.05,Number(item.width)||15),depth=Math.max(.05,Number(item.height)||3.8);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{const u=x/15*length-length/2,v=y/3.8*depth-depth/2;return[(Number(item.x)||0)+length/2+u*c-v*s,(Number(item.y)||0)+depth/2+u*s+v*c,z*2.8/3.049];};
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,w,d,h,color=cream){
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,segments=16){
      const v=b.map((n,i)=>n-a[i]),len=Math.hypot(...v),u=v.map(n=>n/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);const el=Math.hypot(...e);e=e.map(n=>n/el);const f=cross(u,e);
      const ring=p=>Array.from({length:segments},(_,i)=>p.map((n,j)=>n+r*(e[j]*Math.cos(i*2*Math.PI/segments)+f[j]*Math.sin(i*2*Math.PI/segments))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>{const j=(i+1)%segments;face([p,ra[j],rb[j],rb[i]],color);});
    }
    const roll=(x,z,r,color=steel)=>tube([x,.66,z],[x,3.08,z],r,color,28);
    // Raised maintenance walkways sit on open cream supports, leaving the
    // process strip visible between them. Rails do not enclose the lower coil.
    for(const y of [.18,3.15]){
      box(.28,y,2.10,14.05,.43,.10,steel);
      box(.28,y,1.99,14.05,.10,.14);
      for(const x of [.4,3.25,6.2,9.5,12.2,14.15]){
        box(x,y,.03,.11,.12,2.09);box(x-.06,y-.035,0,.23,.21,.05,green);
        tube([x,y+.20,2.2],[x,y+.20,3.02],.028,orange,10);
      }
      for(const z of [2.59,3.02])tube([.4,y+.20,z],[14.25,y+.20,z],.029,orange,10);
    }
    for(const x of [.4,6.2,9.5,14.15])box(x,.26,2.00,.10,3.19,.10);
    // Access ladder on the aisle side, beside the vertical roller frame.
    for(const x of [.43,1.0])tube([x,3.69,.03],[x,3.69,3.02],.026,orange,10);
    for(let z=.23;z<2.96;z+=.28)tube([.43,3.69,z],[1,3.69,z],.022,orange,10);
    // Left end: exposed upper/lower rolls, without foam threaded through them.
    for(const x of [.85,2.2])for(const y of [.55,3.10])box(x,y,.07,.10,.12,1.97);
    roll(1.02,1.91,.14);roll(1.02,.47,.14);roll(2.05,.77,.19,dark);
    box(.83,.57,2.16,.075,2.59,.58);
    // Exposed upper guide rollers.
    for(const x of [2.5,4.8,7.2,9.35])roll(x,2.24,.085);
    // Cream electrical/process enclosure below the maintenance deck.
    box(3.50,2.31,.08,3.05,1.05,1.86);
    for(const x of [3.55,5.06]){
      box(x,3.365,.18,1.40,.025,1.68,'#e6e1ce');
      box(x+1.18,3.398,.90,.035,.04,.23,'#737c75');
    }
    box(4.15,3.4,1.15,.26,.018,.26,'#c1a744');
    // Process section: stacked machine rollers.
    for(const y of [.58,3.10])for(const x of [8.3,10.55])box(x,y,.04,.11,.12,1.98);
    for(const [x,z,r,col] of [[8.45,1.77,.13,steel],[8.6,1.36,.18,'#8b7557'],[8.7,.94,.14,steel],[10.05,.92,.20,steel],[10.3,.64,.15,'#705a46']])roll(x,z,r,col);
    box(9.78,.57,.97,.24,2.6,.16,'#ded8c6');
    // Tall red control cabinet beside the process, not a factory column.
    box(7.0,3.13,.04,.85,.48,1.87,'#bd3929');
    for(const x of [7.12,7.34,7.56]){
      for(const z of [1.51,1.69])box(x,3.62,z,.14,.018,.12,'#c8c6ac');
      for(const z of [.55,.76,.97,1.18,1.38])tube([x+.07,3.63,z],[x+.07,3.65,z],.024,z===.97?green:dark,10);
    }
    box(1.9,3.20,.85,.43,.27,.58,'#c5472b');
    // Empty winding hardware: axle, chucks and support uprights only.
    const cx=13.30,cz=.93;
    for(const y of [.64,3.10]){
      tube([cx,y-.04,cz],[cx,y+.04,cz],.16,green,20);
      box(12.72,y,.02,.12,.13,1.84);
      tube([12.78,y,1.0],[12.78,y,1.77],.043,steel);
    }
    tube([cx,.47,cz],[cx,3.30,cz],.042,steel);
    box(10.60,.62,.20,2.95,2.53,.10,green);
    for(const x of [11.1,11.6,12.15])roll(x,.48,.07);
    // Two upper cooling fans seen along the maintenance platform.
    for(const x of [2.10,6.45]){
      box(x,.73,2.20,.09,.81,.72,'#646c6b');
      tube([x-.035,1.135,2.56],[x-.01,1.135,2.56],.32,dark,28);
      tube([x-.055,1.135,2.56],[x-.04,1.135,2.56],.07,steel,12);
      for(let k=0;k<8;k++){const a=k*Math.PI/4;tube([x-.055,1.135,2.56],[x-.055,1.135+Math.cos(a)*.29,2.56+Math.sin(a)*.29],.012,steel,5);}
    }
    return faces;
  }
  function buildG2(item) {
    // Five reference photographs; CAD footprint is retained. Vertical dimensions
    // and orientation are provisional, not surveyed. No stock rolls or web material.
    const faces=[],cream='#ddd6bd',steel='#b9c5c7',green='#477d5d',orange='#c96532',dark='#354044';
    const w=Math.max(.05,Number(item.width)||4),d=Math.max(.05,Number(item.height)||2.4);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{const u=x/4*w-w/2,v=y/2.4*d-d/2;return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+d/2+u*s+v*c,z];};
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,w,d,h,color=cream){
      const p=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,n=12){
      const v=b.map((x,i)=>x-a[i]),len=Math.hypot(...v),u=v.map(x=>x/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);const el=Math.hypot(...e);e=e.map(x=>x/el);const f=cross(u,e);
      const ring=p=>Array.from({length:n},(_,i)=>p.map((x,j)=>x+r*(e[j]*Math.cos(i*2*Math.PI/n)+f[j]*Math.sin(i*2*Math.PI/n))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>face([p,ra[(i+1)%n],rb[(i+1)%n],rb[i]],color));
    }
    // Transverse machine axes run across local y; process path along local x.
    const roll=(x,z,r,col=steel)=>tube([x,.39,z],[x,1.99,z],r,col,24);
    for(const y of [.10,2.04]){
      box(.12,y,0,3.74,.23,.10);
      box(.15,y,.10,.68,.23,.64);
      // Sloping tall cheeks beside knife station, not a solid cross-machine wall.
      const profile=[[1.23,.10],[2.98,.10],[2.98,1.26],[2.20,1.34],[1.23,.80]];
      face(profile.map(([x,z])=>[x,y,z]),cream);
      face(profile.map(([x,z])=>[x,y+.23,z]).reverse(),cream);
      profile.forEach(([x,z],i)=>{const [xx,zz]=profile[(i+1)%profile.length];face([[x,y,z],[xx,y,zz],[xx,y+.23,zz],[x,y+.23,z]],cream);});
    }
    box(.22,.34,.17,1.04,1.69,.08,orange);
    box(1.33,.34,.18,.07,1.69,.49,orange);
    // Empty winding axle, bearings and green end brackets.
    for(const x of [.42,3.58]){
      tube([x,.13,.79],[x,2.26,.79],.037,steel,20);
      for(const y of [.25,2.09]){
        tube([x,y-.055,.79],[x,y+.055,.79],.075,dark,16);
        box(x-.065,y-.035,.57,.13,.07,.16,green);
      }
    }
    for(const y of [.26,2.07]){
      tube([2.95,y,.31],[3.58,y,.74],.045,cream,8);
      tube([2.93,y,.14],[3.57,y,.38],.035,cream,8);
      tube([3.57,y,.38],[3.58,y,.79],.035,cream,8);
    }
    // Open bed of independent rollers: do not fill with foam or paper sheets.
    for(const [x,z,r,col] of [[.88,.65,.052,green],[1.13,.75,.055,green],[1.46,.84,.052,'#947f62'],[1.71,.91,.055,green],[1.98,1.01,.052,steel],[2.22,1.06,.056,green],[2.57,1.01,.12,steel]])roll(x,z,r,col);
    box(2.43,.37,1.25,.095,1.64,.065,orange);
    tube([2.44,.35,1.36],[2.44,2.03,1.36],.029,steel,16);
    for(let i=0;i<14;i++){
      const y=.44+i*.112;
      box(2.40,y,1.27,.19,.064,.12,'#88969a');
      tube([2.48,y+.03,1.22],[2.48,y+.04,1.22],.058,steel,12);
      // Individual arched pneumatic lines, not an invented upper conveyor.
      let prev=[2.38,y+.03,1.40];
      for(let k=1;k<=8;k++){
        const t=k/8,p=[2.38+.29*t,y+.03,1.40+.24*Math.sin(Math.PI*t)];
        tube(prev,p,.009,'#3297b9',6);prev=p;
      }
    }
    // Side drive/control cabinet and small raised operator console.
    box(1.59,2.08,.10,1.41,.25,1.18);
    box(2.19,2.337,.71,.67,.016,.39,orange);
    for(const x of [2.58,2.77]){
      tube([x,2.356,.97],[x,2.365,.97],.066,dark,16);
      tube([x,2.366,.97],[x,2.370,.97],.051,'#e0e1cf',16);
    }
    for(const x of [2.29,2.45,2.63,2.79])tube([x,2.36,.81],[x,2.38,.81],.021,dark,10);
    box(2.30,2.16,1.28,.055,.07,.23);
    box(2.07,2.10,1.49,.67,.21,.24);
    box(2.11,2.317,1.53,.57,.017,.14,dark);
    for(const x of [2.16,2.28,2.40,2.52,2.64])tube([x,2.34,1.56],[x,2.35,1.56],.013,steel,8);
    // Thin overhead lighting frame. Its estimated 2.3 m height is NOT F1's 2.8 m.
    for(const x of [.22,2.92])for(const y of [.12,2.10])box(x,y,.10,.045,.045,2.15);
    for(const y of [.12,2.10])box(.22,y,2.25,2.745,.045,.045);
    for(const x of [.22,2.92]){
      box(x,.12,2.25,.045,2.025,.045);
      box(x,.36,2.19,.07,1.58,.055,steel);
      box(x+.015,.38,2.177,.04,1.54,.012,'#f1f2df');
    }
    return faces;
  }
  function buildB12(item) {
    // The new photo set covers B1-1 and B1-2, but does not identify which
    // individual view belongs to which code. Use their shared visible structure,
    // not the B1-3 model or neighbouring machines. No foam webs or stock rolls.
    // Reference plan is 2.85 x 5 m; vertical dimensions remain photo estimates.
    const faces=[],cream='#dcd5b9',steel='#b9c3c3',grey='#62696b';
    const chrome='#c8d2d3',orange='#bb632f',wood='#a07549',dark='#323b3e';
    const w=Math.max(.05,Number(item.width)||2.85),d=Math.max(.05,Number(item.height)||5);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{
      const u=x/2.85*w-w/2,v=y/5*d-d/2;
      return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+d/2+u*s+v*c,z];
    };
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,bw,bd,bh,color=cream) {
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,n=16) {
      const v=b.map((value,i)=>value-a[i]),len=Math.hypot(...v),u=v.map(value=>value/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);
      const el=Math.hypot(...e);e=e.map(value=>value/el);const f=cross(u,e);
      const ring=p=>Array.from({length:n},(_,i)=>p.map((value,j)=>value+r*(e[j]*Math.cos(i*2*Math.PI/n)+f[j]*Math.sin(i*2*Math.PI/n))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>face([p,ra[(i+1)%n],rb[(i+1)%n],rb[i]],color));
    }
    const roll=(y,z,r,color=steel)=>{
      tube([.18,y,z],[2.60,y,z],.028,steel,16);
      tube([.31,y,z],[2.47,y,z],r,color,32);
      for(const x of [.16,2.51])box(x,y-.065,z-.075,.11,.13,.15,dark);
    };
    // Open cream chassis, with no solid floor or invented process chamber.
    for(const x of [.10,2.54]) {
      box(x,.13,.10,.15,4.72,.15);
      for(const y of [.13,1.92,3.56,4.70]) {
        box(x,y,0,.15,.15,.12);
        box(x,y,.25,.10,.10,.62);
      }
      box(x,1.93,.71,.10,1.73,.09);
    }
    for(const y of [.13,1.92,3.56,4.70])box(.10,y,.22,2.59,.12,.12);
    // Three permanently mounted large rolls: grey, grey, polished metal.
    // Their axle/bearing connections distinguish them from removable foam.
    for(const [y,z,r,col] of [[.60,.94,.22,grey],[1.16,.99,.21,grey],[1.70,1.02,.20,chrome]]) {
      roll(y,z,r,col);
      for(const x of [.28,2.44])tube([x,y,z],[x+.06,y,z],r+.004,steel,32);
      for(const x of [.10,2.54])box(x,y-.12,.30,.15,.24,.76);
    }
    // Low orange side covers flank only the roll bank, not the open guide bed.
    for(const x of [.095,2.65]) {
      box(x,.30,.30,.045,1.64,.82);
      box(x-.004,.37,.36,.053,1.49,.69,orange);
    }
    // Low vertical drive motor visible through the open side frame.
    box(2.21,2.10,.26,.29,.30,.07,dark);
    tube([2.36,2.25,.33],[2.36,2.25,.66],.12,dark,20);
    for(const z of [.37,.43,.49,.55,.61])tube([2.36,2.25,z],[2.36,2.25,z+.014],.132,dark,20);
    // Slender guide rolls and lower empty winding shaft. No material sheet.
    for(const [y,z,r,col] of [[2.15,1.10,.055,'#927755'],[2.59,1.08,.065,'#d0cbb7'],[3.04,1.14,.051,'#927755'],[3.52,1.10,.047,steel]]) {
      roll(y,z,r,col);
      for(const x of [.16,2.51])box(x,y-.06,.77,.11,.12,z-.77);
    }
    roll(2.66,.59,.066,chrome);
    tube([.18,3.22,1.22],[2.60,3.22,1.22],.022,steel,16);
    for(const x of [.62,2.07]) {
      box(x,3.01,1.16,.12,.10,.095,dark);
      box(x+.015,3.015,1.255,.09,.07,.008,'#80a4ac');
    }
    // Photo-visible operator table at the far end; free-standing steel carts,
    // loose cores and neighbouring work benches are deliberately omitted.
    for(const x of [.22,2.45])for(const y of [3.76,4.70])box(x,y,.16,.07,.07,.78);
    box(.20,3.69,.91,2.34,1.15,.065,wood);
    box(.20,4.76,.95,2.34,.045,.075,wood);
    box(.24,4.74,.38,2.26,.035,.51,'#88633f');
    // Single wide header and task light, not a platform or upper conveyor.
    for(const x of [.19,2.53]) {
      box(x,3.56,.10,.075,.09,1.98);
      box(x-.02,3.52,.79,.115,.16,.25);
    }
    box(.15,3.53,2.00,2.49,.115,.30,'#454d56');
    box(.42,3.47,1.92,1.95,.12,.045,steel);
    tube([.46,3.44,1.925],[2.33,3.44,1.925],.018,'#f2f0d8',12);
    // Orange electrical enclosure on the roll-bank outboard post, kept inside
    // this machine's CAD bounds. No duplicate cabinets from adjacent units.
    box(2.72,.73,.12,.07,.09,1.17);
    box(2.64,.52,1.28,.19,.50,.63,orange);
    for(const y of [.62,.79,.93]) {
      tube([2.832,y,1.72],[2.843,y,1.72],.019,dark,10);
      tube([2.832,y,1.58],[2.843,y,1.58],.019,'#447b59',10);
      tube([2.832,y,1.44],[2.843,y,1.44],.019,'#aa4030',10);
    }
    return faces;
  }
  function buildB13(item) {
    // B1-4 is the same machine type, confirmed by the owner. Each instance
    // retains its own CAD footprint, location and rotation.
    // Three owner-supplied photos of QC 3. Only this machine is modeled:
    // attached grey rolls stay; loose foam, paper cores, carts and adjacent
    // orange control cabinets do not. Height and orientation are provisional.
    // Local x runs across the rollers; local y follows the existing 5 m bed.
    const faces=[],cream='#dcd5b9',steel='#b9c3c3',grey='#62696b';
    const dark='#323b3e',brown='#927755',header='#454d56',light='#f2f0d8';
    const w=Math.max(.05,Number(item.width)||2.2),d=Math.max(.05,Number(item.height)||5);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{
      const u=x/2.2*w-w/2,v=y/5*d-d/2;
      return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+d/2+u*s+v*c,z];
    };
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,bw,bd,bh,color=cream) {
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,n=16) {
      const v=b.map((value,i)=>value-a[i]),len=Math.hypot(...v),u=v.map(value=>value/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);
      const el=Math.hypot(...e);e=e.map(value=>value/el);const f=cross(u,e);
      const ring=p=>Array.from({length:n},(_,i)=>p.map((value,j)=>value+r*(e[j]*Math.cos(i*2*Math.PI/n)+f[j]*Math.sin(i*2*Math.PI/n))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>face([p,ra[(i+1)%n],rb[(i+1)%n],rb[i]],color));
    }
    const roll=(y,z,r,color=steel)=>{
      tube([.13,y,z],[2.07,y,z],.026,steel,16);
      tube([.24,y,z],[1.96,y,z],r,color,32);
      for(const x of [.10,1.99])box(x,y-.065,z-.075,.11,.13,.15,dark);
    };
    // Low, open rectangular chassis. Gaps under the front crossmember are
    // structural fork/foot recesses, not an invented continuous cabinet.
    for(const x of [.04,2.00]) {
      box(x,.12,.08,.16,4.72,.15);
      box(x,.16,.38,.10,4.64,.10);
      for(const y of [.12,1.48,3.23,4.70]) {
        box(x,y,0,.16,.14,.12);
        box(x,y,.18,.12,.12,.68);
      }
    }
    for(const y of [.12,1.50,3.23,4.72])box(.04,y,.18,2.12,.12,.12);
    for(const x of [.04,.86,1.75])box(x,.12,0,.41,.16,.12);
    box(.04,.12,.12,2.12,.16,.14);
    // Twin permanent grey machine rolls, with exposed shafts and silver collars.
    for(const [y,z,r] of [[.59,.88,.19],[1.12,.89,.18]]) {
      roll(y,z,r,grey);
      for(const x of [.22,1.93])tube([x,y,z],[x+.05,y,z],r+.006,steel,32);
      for(const x of [.04,2.00])box(x,y-.14,.30,.16,.28,.56);
    }
    // Compact motor sits low within the right chassis, not on a free-standing
    // cabinet. The attached rollers must not be mistaken for foam stock.
    tube([1.69,.72,.49],[2.05,.72,.49],.115,dark,20);
    box(1.71,.63,.30,.29,.20,.10,dark);
    for(const x of [1.73,1.79,1.85,1.91])box(x,.61,.44,.014,.22,.10,'#4c5658');
    // Slim brown guides and their bearing supports between the main roll bank
    // and the two silver inspection surfaces visible in the overhead photo.
    for(const [y,z,r] of [[1.64,1.05,.064],[2.00,1.13,.057],[2.37,1.03,.048],[3.53,1.04,.046],[4.69,1.06,.054]]) {
      roll(y,z,r,brown);
      for(const x of [.10,1.99])box(x,y-.065,.73,.11,.13,z-.73);
    }
    for(const [y,length,z] of [[2.40,.96,.93],[3.70,.92,.94]]) {
      box(.22,y,z-.10,1.76,length,.08);
      box(.24,y,z-.02,1.72,length,.025,steel);
      for(const x of [.24,1.94])box(x,y,z+.005,.024,length,.025,'#d0d5ce');
      for(const yy of [y+.08,y+length-.12])box(.27,yy,.78,1.66,.045,.06);
    }
    // Empty rear mounting rail. No suspended sheet or material web is added.
    tube([.12,4.82,1.10],[2.08,4.82,1.10],.023,steel,16);
    for(const x of [.10,1.99])box(x,4.72,.83,.11,.14,.25);
    // Mechanical counter and one adjustment handwheel fixed to the right guide.
    box(2.03,1.91,1.10,.13,.18,.13,dark);
    box(2.045,1.93,1.23,.10,.10,.008,'#d2b34e');
    tube([2.07,2.34,1.03],[2.16,2.34,1.03],.025,dark,12);
    const wheelX=2.16,wheelY=2.34,wheelZ=1.03;
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
      tube([wheelX,wheelY+.09*Math.cos(a),wheelZ+.09*Math.sin(a)],
        [wheelX,wheelY+.09*Math.cos(b),wheelZ+.09*Math.sin(b)],.009,dark,6);
      if(i%3===0)tube([wheelX,wheelY,wheelZ],
        [wheelX,wheelY+.087*Math.cos(a),wheelZ+.087*Math.sin(a)],.007,dark,6);
    }
    // Single high transverse gantry, wide dark header board and task light.
    // 2.3 m maximum is a photo estimate, not a surveyed measurement.
    for(const x of [.11,2.01]) {
      box(x,3.52,.10,.075,.09,1.98);
      box(x-.02,3.48,.80,.115,.16,.25);
    }
    box(.11,3.52,1.99,1.975,.09,.075);
    box(.08,3.49,2.00,2.04,.115,.30,header);
    box(.29,3.42,1.91,1.62,.13,.045,steel);
    tube([.33,3.39,1.915],[1.87,3.39,1.915],.018,light,12);
    return faces;
  }
  function buildE1(item) {
    // Photo-informed Auto Cut pair. Long local x follows the existing 5.03 m
    // CAD footprint, not a photo's screen direction. Individual photo/code
    // correspondence and flow direction remain unconfirmed. No foam or dies.
    const faces=[],cream='#dcd5b9',steel='#b9c3c3',dark='#323b3e';
    const blue='#328eaa',deepBlue='#285e88',orange='#c56b32',belt='#d8d5c8';
    const w=Math.max(.05,Number(item.width)||5.03),d=Math.max(.05,Number(item.height)||2);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{
      const u=x/5.03*w-w/2,v=y/2*d-d/2;
      return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+d/2+u*s+v*c,z];
    };
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,bw,bd,bh,color=cream) {
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,n=16) {
      const v=b.map((value,i)=>value-a[i]),len=Math.hypot(...v),u=v.map(value=>value/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);
      const el=Math.hypot(...e);e=e.map(value=>value/el);const f=cross(u,e);
      const ring=p=>Array.from({length:n},(_,i)=>p.map((value,j)=>value+r*(e[j]*Math.cos(i*2*Math.PI/n)+f[j]*Math.sin(i*2*Math.PI/n))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>face([p,ra[(i+1)%n],rb[(i+1)%n],rb[i]],color));
    }
    const hose=points=>points.slice(1).forEach((p,i)=>tube(points[i],p,.026,dark,8));
    // Central pedestal and four exposed chrome guide columns.
    box(1.91,.20,.07,1.22,1.60,.18);
    box(2.03,.31,.25,.98,1.38,.44);
    box(1.98,.21,.69,1.08,1.58,.20);
    for(const x of [1.99,2.97])for(const y of [.27,1.73]) {
      box(x-.10,y-.10,0,.20,.20,.07,dark);
      tube([x,y,.26],[x,y,2.17],.052,steel,20);
      for(const z of [.76,1.27,1.82])tube([x,y,z],[x,y,z+.15],.083,cream,20);
    }
    // Two pale endless conveyor belts. They are permanent machine parts,
    // not white foam sheets. No material web is laid across the press.
    for(const [start,end] of [[.13,1.94],[3.06,4.90]]) {
      for(const y of [.20,1.70])box(start,y,.64,end-start,.10,.29);
      box(start,.31,.90,end-start,1.38,.027,belt);
      box(start,.31,.67,end-start,1.38,.018,belt);
      for(const x of [start+.115,end-.115]) {
        tube([x,.29,.797],[x,1.71,.797],.115,belt,24);
        for(const y of [.24,1.74])tube([x,y,.797],[x,y+.025,.797],.048,steel,12);
      }
      const legX=start<1?start+.17:end-.27;
      for(const y of [.23,1.68]) {
        box(legX,y,.06,.11,.11,.59);
        box(legX-.06,y-.05,0,.23,.21,.06,dark);
      }
      box(legX,.23,.13,.10,1.56,.10);
    }
    // Small drive beneath the conveyor, not a stock roll under the machine.
    tube([4.39,.87,.35],[4.74,.87,.35],.13,dark,20);
    box(4.39,.74,.19,.32,.26,.07,dark);
    // Cutting bed and raised platen leave the working throat visibly open.
    box(1.96,.25,.91,1.10,1.50,.085,steel);
    box(2.07,.35,1.19,.88,1.30,.12);
    for(const y of [.22,1.66])box(1.92,y,1.30,1.20,.12,.16);
    tube([2.52,1,1.43],[2.52,1,1.84],.18,dark,24);
    // Crown with sloped shoulders, extruded across the press depth.
    const outline=[[1.91,1.82],[3.12,1.82],[3.12,2.02],[2.88,2.02],[2.72,2.16],[2.31,2.16],[2.15,2.02],[1.91,2.02]];
    const near=outline.map(([x,z])=>[x,.22,z]),far=outline.map(([x,z])=>[x,1.78,z]);
    face([...near].reverse(),cream);face(far,cream);
    near.forEach((p,i)=>face([p,near[(i+1)%near.length],far[(i+1)%far.length],far[i]],cream));
    // Hydraulic deck, turquoise reservoir, motor and blue upright accumulator.
    box(1.91,.19,2.18,1.21,1.62,.075);
    box(2.14,.31,2.255,.70,.80,.34,blue);
    box(2.13,1.22,2.255,.66,.49,.47,deepBlue);
    for(let i=0;i<7;i++)box(2.19+i*.072,1.713,2.35,.030,.006,.27,dark);
    tube([2.30,.50,2.70],[2.70,.50,2.70],.105,dark,20);
    for(const x of [2.34,2.41,2.48,2.55,2.62])tube([x,.50,2.70],[x+.012,.50,2.70],.115,dark,16);
    // Rounded end profile rather than a square-ended tank. Maximum 3.0 m
    // is a photo estimate only, independent of F1-1's confirmed 2.8 m.
    const tankX=2.98,tankY=1.28,levels=[[2.34,0],[2.37,.065],[2.43,.105],[2.86,.105],[2.93,.085],[2.97,.045],[2.98,0]];
    const rings=levels.map(([z,r])=>Array.from({length:20},(_,i)=>[tankX+r*Math.cos(i*Math.PI/10),tankY+r*Math.sin(i*Math.PI/10),z]));
    rings.slice(1).forEach((ring,k)=>ring.forEach((p,i)=>{
      const next=(i+1)%20;
      if(k===0)face([rings[k][i],ring[next],p],deepBlue);
      else if(k===rings.length-2)face([rings[k][i],rings[k][next],p],deepBlue);
      else face([rings[k][i],rings[k][next],ring[next],p],deepBlue);
    }));
    tube([tankX,tankY,2.98],[tankX,tankY,3.00],.018,steel,12);
    hose([[2.91,1.25,2.40],[2.85,1.24,2.83],[2.68,1.18,2.96],[2.46,1.08,2.93],[2.30,.86,2.69]]);
    hose([[2.72,.83,2.59],[2.88,.72,2.61],[3.03,.64,2.47],[3.04,.55,1.94],[2.82,.48,1.65]]);
    hose([[2.35,.76,2.59],[2.20,.68,2.77],[2.05,.62,2.73],[1.98,.54,2.32],[2.03,.48,1.96]]);
    // Orange side cabinet and small operator screen mounted to the press.
    box(1.96,.055,.23,1.11,.12,1.91,orange);
    box(2.19,.025,.94,.43,.045,.79);
    box(2.23,.018,1.43,.35,.007,.22,dark);
    box(2.25,.010,1.45,.31,.007,.18,'#547d8d');
    for(const [x,col] of [[2.27,dark],[2.40,'#447b59'],[2.53,'#aa4030']])tube([x,.017,1.34],[x,.006,1.34],.023,col,12);
    // Task lights on both press faces; no room-spanning lighting frame.
    for(const x of [1.82,3.16]) {
      box(x,.24,2.12,.045,1.52,.05,steel);
      tube([x-.006,.29,2.115],[x-.006,1.71,2.115],.017,'#f2f0d8',12);
    }
    // Adjustable silver hold-down roll at one conveyor end, with two screws.
    for(const y of [.20,1.80]) {
      box(4.65,y-.055,.84,.10,.11,.45);
      tube([4.70,y,1.04],[4.70,y,1.43],.018,steel,12);
      tube([4.70,y,1.43],[4.70,y,1.445],.075,dark,16);
    }
    tube([4.70,.28,1.12],[4.70,1.72,1.12],.105,steel,32);
    return faces;
  }
  function buildQ2(item) {
    // QA 002 is visible on the open-frame machine's sign. Assign the other,
    // closed-base photo provisionally to Q2-1. Keep their structures distinct.
    // Local x follows the 4 m CAD length; y spans the roll axes. No foam web,
    // stock coils, cardboard sleeves, loose cores, bins or warehouse structure.
    const open=modelCode(item)==='Q2-2';
    const faces=[],cream='#dcd5b9',steel='#b9c3c3',dark='#323b3e';
    const blue='#2d527e',floorBlue='#329cba',orange='#c56b32',brown='#927755';
    const w=Math.max(.05,Number(item.width)||4),d=Math.max(.05,Number(item.height)||2.65);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{
      const u=x/4*w-w/2,v=y/2.65*d-d/2;
      return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+d/2+u*s+v*c,z];
    };
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,bw,bd,bh,color=cream) {
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,n=16) {
      const v=b.map((value,i)=>value-a[i]),len=Math.hypot(...v),u=v.map(value=>value/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);
      const el=Math.hypot(...e);e=e.map(value=>value/el);const f=cross(u,e);
      const ring=p=>Array.from({length:n},(_,i)=>p.map((value,j)=>value+r*(e[j]*Math.cos(i*2*Math.PI/n)+f[j]*Math.sin(i*2*Math.PI/n))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>face([p,ra[(i+1)%n],rb[(i+1)%n],rb[i]],color));
    }
    const roll=(x,z,r,col=steel)=>{
      tube([x,.18,z],[x,2.30,z],.025,steel,16);
      tube([x,.32,z],[x,2.16,z],r,col,32);
      for(const y of [.18,2.20])box(x-.07,y,z-.065,.14,.10,.13,cream);
    };
    // Cream base and bearing pedestals. Q2-2 remains visibly open underneath.
    for(const y of [.12,2.23]) {
      box(.12,y,.08,3.55,.13,.14);
      for(const x of [.12,1.18,2.55,3.52]) {
        box(x,y,0,.15,.13,.10);
        box(x,y,.22,.12,.13,.64);
      }
      box(.12,y,.77,2.55,.11,.10);
    }
    for(const x of [.12,1.22,2.58,3.52])box(x,.12,.16,.13,2.24,.13);
    for(const y of [.12,2.23])box(.13,y,.44,.96,.13,.55);
    if(open)box(.18,.26,.225,2.45,1.96,.025,floorBlue);
    else {
      box(.13,.15,.23,2.53,2.18,.51);
      box(.21,.139,.29,1.10,.011,.39,'#ccc7b4');
      box(1.35,.139,.29,1.10,.011,.39,'#ccc7b4');
      for(const x of [1.13,1.50])box(x,.118,.48,.13,.02,.025,steel);
    }
    // Permanent driven rollers are blue on QA 002. Pale stock covering the
    // other machine is omitted; only its metal axes/drums remain.
    for(const x of [.43,.88]) {
      roll(x,.99,.17,open?blue:steel);
      for(const y of [.30,2.12])tube([x,y,.99],[x,y+.06,.99],.176,cream,32);
    }
    for(const [x,z,r] of [[1.35,1.07,.050],[1.71,1.03,.055],[2.10,1.09,.057],[2.55,1.15,.060]])roll(x,z,r,brown);
    tube([1.46,.18,1.19],[1.46,2.30,1.19],.019,steel,16);
    // Two mechanical length counters and one handwheel on the measuring bar.
    for(const y of [.81,1.13]) {
      box(1.39,y,1.17,.14,.12,.11,dark);
      box(1.405,y+.015,1.28,.10,.08,.008,'#d2b34e');
    }
    tube([1.47,2.31,1.13],[1.47,2.40,1.13],.022,dark,12);
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
      tube([1.47+.072*Math.cos(a),2.40,1.13+.072*Math.sin(a)],[1.47+.072*Math.cos(b),2.40,1.13+.072*Math.sin(b)],.008,dark,6);
      if(i%3===0)tube([1.47,2.40,1.13],[1.47+.07*Math.cos(a),2.40,1.13+.07*Math.sin(a)],.006,dark,6);
    }
    // Empty roll mounting at the far end. Cardboard sleeves and the black
    // wound material seen in photos are removable consumables, not machinery.
    if(open) {
      for(const y of [.20,2.24]) {
        box(2.55,y-.055,.23,.12,.11,1.25);
        box(2.60,y-.055,1.20,1.17,.11,.12);
        tube([2.63,y,.19],[3.17,y,.63],.045,steel,12);
        tube([3.17,y,.63],[3.67,y,1.24],.018,steel,12);
        box(3.68,y-.06,1.18,.15,.12,.18);
      }
      tube([3.76,.16,1.31],[3.76,2.39,1.31],.032,steel,20);
    } else {
      for(const y of [.20,2.24])box(3.35,y,.21,.12,.12,1.20);
      tube([3.41,.18,1.34],[3.41,2.38,1.34],.032,steel,20);
      for(const y of [.25,2.19])box(3.31,y,1.24,.20,.10,.15);
    }
    // Thin, machine-mounted lighting gantry, not the factory mezzanine above.
    // Maximum 2.35 m is estimated from these photos, not a field measurement.
    for(const y of [.12,2.26]) {
      box(2.60,y,.12,.055,.055,2.18);
      box(2.57,y-.015,.87,.12,.09,.32);
    }
    box(2.60,.12,2.30,.055,2.195,.05);
    box(2.53,.32,2.24,.13,1.80,.045,steel);
    tube([2.51,.36,2.235],[2.51,2.08,2.235],.019,'#f2f0d8',12);
    if(open) {
      // Separate orange control enclosure and small screen, both supported.
      box(.60,2.45,.10,.07,.08,1.22);
      box(.39,2.39,1.30,.55,.19,.62,orange);
      for(const x of [.48,.65,.82])for(const [z,col] of [[1.72,dark],[1.57,'#447b59'],[1.42,'#aa4030']])tube([x,2.582,z],[x,2.595,z],.020,col,10);
      box(.51,2.43,.99,.055,.06,.30);
      box(.40,2.42,1.09,.40,.05,.24,steel);
      box(.425,2.473,1.115,.35,.006,.19,dark);
    } else {
      // Closed QA 1 has a low side console with an orange fascia, not QA 2's
      // tall free-standing box. Keep the photo-visible blue lower cabinet.
      box(.15,2.36,.09,1.05,.24,.89,floorBlue);
      box(.15,2.36,.98,1.05,.24,.20);
      box(.19,2.603,.99,.97,.015,.15,orange);
      for(const x of [.28,.43,.60,.78,1.03])tube([x,2.62,1.06],[x,2.63,1.06],.018,dark,10);
      box(.78,2.41,1.18,.055,.06,.21);
      box(.64,2.40,1.37,.39,.055,.23,steel);
      box(.66,2.458,1.39,.35,.006,.19,dark);
    }
    return faces;
  }
  function buildQ23(item) {
    // Three owner photos: narrower upright CAD footprint than Q2-1/2.
    // The green twin rolls beside this machine belong to its neighbour.
    // Model the empty stock axle, never the large pale foam coil or yellow web.
    // Owner clarified the previous displayed machine must turn 90° CCW as a
    // whole. Keep all existing geometry, then apply the rigid display offset.
    const faces=[],cream='#dcd5b9',steel='#b9c3c3',dark='#323b3e',brown='#927755';
    const w=Math.max(.05,Number(item.width)||2.65),d=Math.max(.05,Number(item.height)||4);
    const a=((Number(item.rotation)||0)+rotationOffset(item))*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{
      const u=y/4*w-w/2,v=(1-x/2.65)*d-d/2;
      return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+d/2+u*s+v*c,z];
    };
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,bw,bd,bh,color=cream) {
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,n=16) {
      const v=b.map((value,i)=>value-a[i]),len=Math.hypot(...v),u=v.map(value=>value/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);
      const el=Math.hypot(...e);e=e.map(value=>value/el);const f=cross(u,e);
      const ring=p=>Array.from({length:n},(_,i)=>p.map((value,j)=>value+r*(e[j]*Math.cos(i*2*Math.PI/n)+f[j]*Math.sin(i*2*Math.PI/n))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>face([p,ra[(i+1)%n],rb[(i+1)%n],rb[i]],color));
    }
    const roll=(y,z,r,col=steel)=>{
      tube([.17,y,z],[2.19,y,z],.025,steel,16);
      tube([.31,y,z],[2.05,y,z],r,col,32);
      for(const x of [.17,2.10])box(x,y-.065,z-.065,.10,.13,.13);
    };
    // Low cream chassis and thin blue floor pan (not a conveyor belt).
    for(const x of [.12,2.14]) {
      box(x,.15,.08,.13,3.65,.17);
      for(const y of [.15,1.48,3.62])box(x,y,0,.13,.18,.09);
    }
    for(const y of [.16,1.52,3.65])box(.12,y,.16,2.15,.13,.14);
    box(.26,.55,.255,1.87,3.10,.025,'#329cba');
    // Shaped side cheeks supporting the empty rear stock axle.
    const outline=[[2.08,.28],[3.77,.28],[3.77,1.40],[3.42,1.40],[3.29,1.27],[2.37,1.02],[2.08,.94]];
    for(const x of [.17,2.08]) {
      const near=outline.map(([y,z])=>[x,y,z]),far=outline.map(([y,z])=>[x+.10,y,z]);
      face([...near].reverse(),cream);face(far,cream);
      near.forEach((p,i)=>face([p,near[(i+1)%near.length],far[(i+1)%far.length],far[i]],cream));
      box(x,3.16,1.27,.10,.25,.18,dark);
    }
    tube([.13,3.29,1.38],[2.24,3.29,1.38],.033,steel,20);
    // Bearing hubs, not a material roll around the axle.
    for(const x of [.13,2.15])tube([x,3.29,1.38],[x+.08,3.29,1.38],.075,dark,20);
    // Fixed guide rolls exposed once the foam sheet is removed.
    for(const [y,z,r,col] of [[.55,.98,.115,steel],[.91,1.01,.10,steel],[1.42,1.06,.057,brown],[1.86,1.00,.055,brown],[2.30,.98,.052,brown]]) {
      roll(y,z,r,col);
      for(const x of [.17,2.10])box(x,y-.065,.75,.10,.13,z-.75);
    }
    for(const x of [.17,2.10])box(x,.39,.28,.10,1.58,.47);
    // Length measuring bar with two fixed counters and adjustment wheel.
    tube([.18,1.19,1.21],[2.18,1.19,1.21],.019,steel,16);
    for(const x of [.69,1.02]) {
      box(x,1.13,1.19,.12,.13,.10,dark);
      box(x+.015,1.145,1.29,.09,.09,.008,'#d2b34e');
    }
    tube([2.19,1.46,1.11],[2.30,1.46,1.11],.022,dark,12);
    for(let i=0;i<12;i++) {
      const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
      tube([2.30,1.46+.075*Math.cos(a),1.11+.075*Math.sin(a)],[2.30,1.46+.075*Math.cos(b),1.11+.075*Math.sin(b)],.008,dark,6);
      if(i%3===0)tube([2.30,1.46,1.11],[2.30,1.46+.072*Math.cos(a),1.11+.072*Math.sin(a)],.006,dark,6);
    }
    // Cream side cabinet, inclined orange fascia and attached small monitor.
    box(2.23,.22,.09,.35,1.37,1.00);
    const panel=[[2.23,.28,1.09],[2.58,.28,1.09],[2.58,.55,1.29],[2.23,.55,1.29]];
    face(panel,'#c56b32');face(panel.map(([x,y,z])=>[x,y,z-.035]).reverse(),cream);
    for(const x of [2.29,2.40,2.51])for(const y of [.35,.46]) {
      const z=1.09+(y-.28)*.20/.27;
      tube([x,y,z],[x,y-.009,z+.012],.019,dark,10);
    }
    box(2.24,.63,1.09,.33,.89,.055);
    box(2.37,.77,1.145,.045,.07,.16,steel);
    box(2.24,.75,1.29,.33,.06,.24,steel);
    box(2.26,.742,1.31,.29,.007,.20,'#547d8d');
    box(2.586,.60,.19,.008,.83,.72,'#ccc7b4');
    box(2.597,.68,.56,.015,.13,.025,steel);
    // Low rear brake/drive and a short air cylinder on the axle support.
    tube([.13,3.29,1.38],[.065,3.29,1.38],.10,dark,20);
    box(.05,3.19,1.15,.12,.20,.13,dark);
    tube([.21,3.51,.73],[.21,3.51,1.04],.042,steel,16);
    tube([.21,3.51,1.04],[.21,3.51,1.27],.016,steel,12);
    // Machine-mounted pipe light frame; the building column and mezzanine
    // behind it are not part of the machine. Height 2.30 m remains estimated.
    for(const x of [.19,2.15])tube([x,1.92,.27],[x,1.92,2.27],.023,cream,12);
    tube([.19,1.92,2.27],[2.15,1.92,2.27],.03,cream,12);
    box(.34,1.80,2.16,1.66,.16,.06,steel);
    tube([.37,1.77,2.16],[1.97,1.77,2.16],.020,'#f2f0d8',12);
    return faces;
  }
  function buildG21(item) {
    // G2-1 has a closed roll cabinet, sloped side console and separate open
    // rear stock stand. Do not reuse G2-2's arched pneumatic knife-head model.
    // All material rolls, paper sleeves and the black web are omitted.
    const faces=[],cream='#ddd6bb',steel='#bbc7c8',chrome='#cbd5d5',dark='#303a3d',orange='#b96537';
    const w=Math.max(.05,Number(item.width)||2.4),d=Math.max(.05,Number(item.height)||4.19);
    // Owner correction: turn the complete previous model 180° about its CAD
    // center. Future 2D rotation remains additive; never mutate the CAD record.
    const a=((Number(item.rotation)||0)+rotationOffset(item))*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{
      const u=x/2.4*w-w/2,v=y/4.19*d-d/2;
      return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+d/2+u*s+v*c,z];
    };
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,bw,bd,bh,color=cream) {
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,n=16) {
      const v=b.map((value,i)=>value-a[i]),len=Math.hypot(...v),u=v.map(value=>value/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);
      const el=Math.hypot(...e);e=e.map(value=>value/el);const f=cross(u,e);
      const ring=p=>Array.from({length:n},(_,i)=>p.map((value,j)=>value+r*(e[j]*Math.cos(i*2*Math.PI/n)+f[j]*Math.sin(i*2*Math.PI/n))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>face([p,ra[(i+1)%n],rb[(i+1)%n],rb[i]],color));
    }
    const roll=(y,z,r,color=chrome)=>{
      tube([.14,y,z],[1.96,y,z],.025,steel,16);
      tube([.25,y,z],[1.85,y,z],r,color,32);
      for(const x of [.12,1.88])box(x,y-.055,z-.06,.10,.11,.12,dark);
    };
    // Main closed cabinet with separate front access doors and orange rear fascia.
    box(.12,.38,.12,1.88,1.48,.72);
    for(const x of [.15,1.82])box(x,.35,0,.16,1.54,.12);
    for(const x of [.18,1.08]) {
      box(x,.365,.18,.84,.012,.59,'#cdc6b0');
      box(x+.025,.350,.205,.79,.010,.54);
      box(x+.68,.335,.43,.035,.015,.09,steel);
    }
    box(.20,1.867,.24,1.70,.018,.36,orange);
    // Side cheeks stay separate; no material plane bridges the exposed rolls.
    for(const x of [.10,1.89])box(x,.40,.84,.12,1.48,.57);
    for(const [y,z,r] of [[.51,.93,.10],[.88,1.14,.13],[1.28,1.16,.13],[1.72,1.07,.065],[2.24,1.02,.055],[2.64,.98,.055]])roll(y,z,r);
    // Front bare shaft: paper cores and partially wound product are consumables.
    tube([.07,.27,1.03],[2.04,.27,1.03],.031,steel,20);
    for(const x of [.11,1.91])tube([x-.02,.27,1.03],[x+.06,.27,1.03],.075,dark,20);
    // Steel measuring bar and an orange knife rail with individual metal heads.
    box(.17,1.48,1.43,1.77,.055,.06,orange);
    box(.18,1.54,1.46,1.75,.025,.035,steel);
    for(let i=0;i<31;i++)box(.23+i*.053,1.568,1.462,.004,.005,i%5===0?.025:.012,dark);
    for(let i=0;i<13;i++) {
      const x=.78+i*.075;
      box(x,1.44,1.30,.025,.12,.17,steel);
      tube([x,1.47,1.29],[x+.015,1.47,1.29],.055,'#929e9e',16);
    }
    // Sloping right console, two gauge faces, displays and discrete buttons.
    box(2.02,.37,.06,.34,1.54,1.08);
    const panel=[[2.02,.38,1.14],[2.36,.38,1.14],[2.36,1.23,1.40],[2.02,1.23,1.40]];
    face(panel,'#677071');
    face([[2.02,.38,1.14],[2.02,1.23,1.40],[2.02,1.90,1.40],[2.02,1.90,1.14]],cream);
    face([[2.36,.38,1.14],[2.36,1.90,1.14],[2.36,1.90,1.40],[2.36,1.23,1.40]],cream);
    box(2.02,1.23,1.14,.34,.67,.26);
    for(const x of [2.10,2.27]) {
      tube([x,1.02,1.337],[x,1.012,1.350],.053,dark,20);
      tube([x,1.010,1.352],[x,1.005,1.360],.043,'#e0e1d1',20);
      box(x-.045,.66,1.235,.09,.09,.012,dark);
      for(const y of [.45,.55,.78]) {
        const z=1.14+(y-.38)*.26/.85;
        tube([x,y,z],[x,y-.009,z+.015],.018,y===.45?'#baa73d':dark,10);
      }
    }
    box(2.367,.63,.20,.012,1.06,.82,'#d0c8b2');
    box(2.382,1.11,.57,.007,.035,.10,steel);
    tube([2.18,1.62,1.40],[2.18,1.62,1.49],.035,cream,12);
    tube([2.18,1.62,1.49],[2.18,1.62,1.51],.09,cream,20);
    tube([2.23,1.62,1.51],[2.23,1.62,1.60],.018,dark,10);
    // Rear stock stand is open, on parallel floor rails, with shaped axle arms.
    for(const x of [.12,1.88]) {
      box(x,2.03,0,.12,2.10,.08,steel);
      box(x,2.09,.10,.13,1.95,.15);
      for(const y of [2.12,3.77])box(x,y,.08,.15,.26,.08);
      const outline=[[2.05,.26],[3.96,.26],[3.96,1.15],[3.69,1.15],[2.05,.70]];
      const p=outline.map(([y,z])=>[x,y,z]),q=outline.map(([y,z])=>[x+.12,y,z]);
      face([...p].reverse(),cream);face(q,cream);
      p.forEach((point,i)=>face([point,p[(i+1)%p.length],q[(i+1)%q.length],q[i]],cream));
      box(x-.006,3.76,.70,.132,.18,.48,orange);
    }
    for(const y of [2.08,3.87])box(.12,y,.19,1.91,.13,.13);
    tube([.06,3.78,1.16],[2.10,3.78,1.16],.037,steel,24);
    for(const x of [.11,1.91])tube([x-.02,3.78,1.16],[x+.08,3.78,1.16],.08,dark,20);
    tube([.08,3.78,1.16],[.025,3.78,1.16],.16,cream,24);
    for(const y of [2.26,2.65])for(const x of [.14,1.89])box(x,y-.06,.26,.10,.12,.75);
    // Pneumatic cylinders outside both main cheeks and small red air lines.
    for(const x of [.065,2.005]) {
      tube([x,.53,1.18],[x,1.01,1.18],.045,steel,16);
      tube([x,1.01,1.18],[x,1.42,1.18],.018,chrome,12);
      for(const y of [.52,1.00])box(x-.03,y-.025,1.115,.06,.05,.13);
      const path=[[x,.62,1.13],[x,.55,.62],[x,.85,.20],[x,1.60,.20]];
      for(let i=1;i<path.length;i++)tube(path[i-1],path[i],.009,'#b74630',6);
    }
    // Machine-mounted overhead rectangular light frame, not building columns.
    for(const x of [.08,2.28])for(const y of [.42,3.03])tube([x,y,.10],[x,y,2.32],.022,cream,12);
    for(const y of [.42,3.03])tube([.08,y,2.32],[2.28,y,2.32],.025,cream,12);
    for(const x of [.08,2.28])tube([x,.42,2.32],[x,3.03,2.32],.025,cream,12);
    for(const y of [.52,2.83]) {
      box(.31,y,2.23,1.75,.10,.06,steel);
      tube([.34,y-.01,2.22],[2.02,y-.01,2.22],.018,'#f2f2df',12);
    }
    return faces;
  }
  function buildJ12(item) {
    // Four owner photos: broad sliding worktable, open cream portal, a long
    // aluminium fence and exposed under-table rails. No foam, pallet or carts.
    // Plan orientation and 2.30 m overall height are provisional photo estimates.
    const faces=[],cream='#ded7bd',steel='#b8c4c4',dark='#303b3d',rail='#356e62',wood='#675346';
    const w=Math.max(.05,Number(item.width)||4.45),d=Math.max(.05,Number(item.height)||4.57);
    const a=(Number(item.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const world=([x,y,z])=>{
      const u=x/4.45*w-w/2,v=y/4.57*d-d/2;
      return[(Number(item.x)||0)+w/2+u*c-v*s,(Number(item.y)||0)+d/2+u*s+v*c,z];
    };
    const face=(points,color)=>faces.push({points:points.map(world),color});
    function box(x,y,z,bw,bd,bh,color=cream) {
      const p=[[x,y,z],[x+bw,y,z],[x+bw,y+bd,z],[x,y+bd,z],[x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh]];
      [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(ids=>face(ids.map(i=>p[i]),color));
    }
    function tube(a,b,r,color=steel,n=16) {
      const v=b.map((value,i)=>value-a[i]),len=Math.hypot(...v),u=v.map(value=>value/len);
      const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let e=cross(u,Math.abs(u[2])<.9?[0,0,1]:[0,1,0]);
      const el=Math.hypot(...e);e=e.map(value=>value/el);const f=cross(u,e);
      const ring=p=>Array.from({length:n},(_,i)=>p.map((value,j)=>value+r*(e[j]*Math.cos(i*2*Math.PI/n)+f[j]*Math.sin(i*2*Math.PI/n))));
      const ra=ring(a),rb=ring(b);face([...ra].reverse(),color);face(rb,color);
      ra.forEach((p,i)=>face([p,ra[(i+1)%n],rb[(i+1)%n],rb[i]],color));
    }
    // Cream table is permanent machine structure, not a sheet of foam.
    // Two main panels and the dark wooden extension remain visibly separate.
    for(const [x,bw] of [[.08,2.06],[2.18,1.63]]) {
      box(x,.68,.91,bw,3.66,.075);
      box(x,.68,.986,bw,3.66,.009,'#e8e5d5');
      for(const y of [.75,4.20])box(x,y,.79,bw,.10,.12);
    }
    box(3.84,.68,.91,.51,3.66,.075);
    box(3.84,.68,.987,.51,3.66,.015,wood);
    for(const x of [.15,4.12]) {
      box(x,.69,.76,.11,3.60,.14);
      for(const y of [1.00,3.94]) {
        box(x,y,.07,.10,.14,.72);
        box(Math.max(.03,x-.12),y-.08,0,.32,.30,.065);
      }
    }
    // Open sliding rails and central low drive base, not a closed pedestal.
    for(const x of [.85,3.10]) {
      box(x,.45,.58,.10,3.95,.11,dark);
      box(x+.015,.45,.69,.07,3.95,.018,steel);
    }
    box(.64,.38,.09,3.11,.48,.49);
    box(.64,.87,.12,3.11,.025,.36,'#cfc7ae');
    for(const x of [.72,3.45])box(x,.35,0,.20,.58,.09);
    // Portal's chamfered lower beam leaves the cutting opening unobstructed.
    const beam=[[.16,2.30],[4.25,2.30],[4.25,1.47],[3.28,1.47],[3.05,1.67],[1.20,1.67],[.96,1.47],[.16,1.47]];
    const near=beam.map(([x,z])=>[x,.15,z]),far=beam.map(([x,z])=>[x,.64,z]);
    face([...near].reverse(),cream);face(far,cream);
    near.forEach((p,i)=>face([p,near[(i+1)%near.length],far[(i+1)%far.length],far[i]],cream));
    for(const x of [.16,3.77]) {
      box(x,.15,.08,.48,.49,1.39);
      box(Math.max(.02,x-.08),.05,0,.64,.72,.08);
    }
    box(.16,.15,2.285,4.09,.49,.015,'#8b8c80');
    // Service cover, height-setting wheel, thin blade/guide at the throat.
    box(2.93,.646,1.79,.56,.012,.36,'#cec6b0');
    for(const x of [2.98,3.43])for(const z of [1.84,2.10])tube([x,.661,z],[x,.671,z],.014,dark,8);
    box(2.10,.37,1.43,.14,.18,.24,steel);
    box(2.158,.44,.995,.014,.025,.435,'#858f8f');
    const wheel=(x,y,z,r)=>{
      tube([x,y-.04,z],[x,y+.03,z],.034,dark,12);
      for(let i=0;i<20;i++) {
        const a=i*Math.PI/10,b=(i+1)*Math.PI/10;
        tube([x+r*Math.cos(a),y,z+r*Math.sin(a)],[x+r*Math.cos(b),y,z+r*Math.sin(b)],.014,dark,6);
        if(i%5===0)tube([x,y,z],[x+r*Math.cos(a),y,z+r*Math.sin(a)],.010,dark,6);
      }
      tube([x+r*.7,y,z+r*.7],[x+r*.7,y+.08,z+r*.7],.018,dark,8);
    };
    wheel(.66,.70,1.97,.16);
    // Tall aluminium fence runs from the portal to the front table carriage.
    box(2.08,.68,1.005,.10,3.62,.035,steel);
    box(2.11,.68,1.04,.045,3.62,.27,steel);
    for(const z of [1.07,1.25])box(2.158,.68,z,.012,3.62,.014,'#e1e6df');
    for(const y of [.75,2.55,4.13])box(2.16,y,1.04,.05,.045,.27,dark);
    box(2.04,4.20,.84,.24,.15,.21);
    wheel(2.16,4.37,.98,.15);
    for(const x of [.08,3.78]) {
      box(x,.68,.87,.025,3.66,.05,rail);
      box(x+.028,.68,.93,.018,3.66,.035,steel);
    }
    // Exposed drive motor and its cooling ribs below the portal.
    tube([3.46,.67,.49],[3.46,1.11,.49],.18,dark,24);
    for(let y=.70;y<1.08;y+=.055)tube([3.46,y,.49],[3.46,y+.018,.49],.188,'#465051',20);
    box(3.29,.60,.25,.34,.38,.08);
    box(3.84,.65,.43,.24,.015,.26,'#56786a');
    for(const z of [.49,.59])tube([3.96,.669,z],[3.96,.679,z],.025,z===.49?'#9e4935':'#5d9c68',10);
    return faces;
  }
  function build(item) {
    switch(modelCode(item)) {
      case 'DIE CUT': return buildDieCut(item);
      case 'WC-STALLS': return buildRestroom(item);
      case 'H1-1': return buildH1(item);
      case 'A1-1': return buildA1(item);
      case 'A1-2': return buildA12(item);
      case 'F1-1': return buildF1(item);
      case 'G2-1': return buildG21(item);
      case 'G2-2': return buildG2(item);
      case 'B1-1':
      case 'B1-2': return buildB12(item);
      case 'B1-3':
      case 'B1-4': return buildB13(item);
      case 'E1-1':
      case 'E1-2': return buildE1(item);
      case 'Q2-1':
      case 'Q2-2': return buildQ2(item);
      case 'Q2-3': return buildQ23(item);
      case 'J1-2': return buildJ12(item);
      default: return window.ChinChunPhotoModels?.build(item) || null;
    }
  }
  window.ChinChunModels = {matches,build,rotationOffset,referenceCode:modelCode,sectionMarkers,restroomLayout,dieCutSite,dieCutSiteFaces};
})();
