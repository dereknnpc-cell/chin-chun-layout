/* Photo-informed display geometry only. Never writes CAD dimensions or cloud data. */
(() => {
  'use strict';
  const modelCode = item => String(item.code || '').trim().toUpperCase();
  const matches = item => ['H1-1', 'A1-1', 'F1-1', 'G2-2'].includes(modelCode(item));
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
  function build(item) {
    switch(modelCode(item)) {
      case 'H1-1': return buildH1(item);
      case 'A1-1': return buildA1(item);
      case 'F1-1': return buildF1(item);
      case 'G2-2': return buildG2(item);
      default: return null;
    }
  }
  window.ChinChunModels = {matches,build};
})();
