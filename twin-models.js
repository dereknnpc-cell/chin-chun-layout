/* Photo-informed display geometry only. Never writes CAD dimensions or cloud data. */
(() => {
  'use strict';
  const modelCode = item => String(item.code || '').trim().toUpperCase();
  const matches = item => ['H1-1', 'A1-1'].includes(modelCode(item));
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
    // Floor-contacting frame and open, overhead longitudinal rails.
    for(const y of [.12,3.46]) {
      box(.2,y,.02,13.15,.12,.13,cream);
      box(.3,y,2.08,12.85,.09,.1,cream);
      for(const x of [.35,2.85,5.55,8.1,10.65,13.05]) {
        box(x,y,.04,.13,.13,2.13,cream);
        box(x-.04,y-.035,0,.21,.20,.06,green);
      }
    }
    for(const x of [.35,5.55,8.1,10.65,13.05])box(x,.12,2.1,.11,3.46,.09,cream);
    // The front of the photo shows two bright steel rolls followed by brown guide rolls.
    for(const [x,z,r,color] of [[.75,.52,.22,chrome],[1.17,.62,.25,steel],[1.65,.68,.17,'#876c4e'],[2.15,.82,.11,'#987c59'],[2.65,.95,.1,'#ad8b61'],[3.25,1.01,.09,chrome]])roller(x,z,r,color);
    for(const x of [.68,1.35,2.7]) {
      for(const y of [.15,3.39])box(x,y,.12,.14,.15,.85,cream);
      box(x,.15,.95,.1,3.25,.09,cream);
    }
    // Dark green processing conveyor, exposed around the front and back cylinders.
    box(3.55,.3,.47,4.28,3.1,.23,dark);
    face([[3.58,.31,.79],[7.75,.31,.79],[7.75,3.39,.79],[3.58,3.39,.79]],belt);
    roller(3.65,.72,.16,dark);roller(7.72,.72,.16,steel);
    for(const y of [.27,3.35])box(3.5,y,.25,4.35,.1,.72,cream);
    // Large rear drum and the cream sheet wrapping its visible upper arc.
    const drumX=9.26,drumZ=1.37,drumR=.77;
    tube([drumX,.34,drumZ],[drumX,3.36,drumZ],drumR,'#5b6060',32);
    for(let i=0;i<20;i++) {
      const a=(-55+i*190/20)*Math.PI/180,b=(-55+(i+1)*190/20)*Math.PI/180;
      face([[drumX+Math.cos(a)*(.79),.38,drumZ+Math.sin(a)*(.79)],
        [drumX+Math.cos(b)*(.79),.38,drumZ+Math.sin(b)*(.79)],
        [drumX+Math.cos(b)*(.79),3.32,drumZ+Math.sin(b)*(.79)],
        [drumX+Math.cos(a)*(.79),3.32,drumZ+Math.sin(a)*(.79)]],'#e6dcc0');
    }
    for(const y of [.25,3.36]) {
      tube([drumX,y-.08,drumZ],[drumX,y+.08,drumZ],.17,steel,16);
      box(8.37,y,.18,1.8,.12,.16,cream);
    }
    roller(10.22,.63,.17,'#8b725a');roller(10.65,1.15,.1,chrome);
    // Red side-mounted control cabinet, dials, push-buttons and green drive guard.
    box(7.2,3.25,.16,1.28,.31,1.65,red);
    box(7.26,3.57,.31,1.16,.025,1.43,'#ce402d');
    for(const x of [7.48,7.82,8.16])for(const z of [.58,.88,1.18,1.5])
      tube([x,3.59,z],[x,3.60,z],.047,z===.58?green:z===.88?dark:steel,10);
    box(8.48,3.31,.32,.83,.18,.54,green);
    // Rear open gantry, overhead fan housing and silver exhaust/guide pipes.
    for(const y of [.14,3.43])for(const x of [11.15,13.1])box(x,y,.03,.13,.14,2.14,cream);
    for(const x of [11.2,12.3,13.05])roller(x,1.47,.08,steel);
    box(10.65,.95,1.69,.62,1.8,.52,'#697273');
    tube([10.60,1.85,1.96],[10.62,1.85,1.96],.36,dark,24);
    for(let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      tube([10.62,1.85,1.96],[10.62,1.85+Math.cos(a)*.3,1.96+Math.sin(a)*.3],.018,steel,6);
    }
    tube([10.95,.2,2.24],[13.0,.2,2.24],.06,chrome);
    tube([10.95,3.5,2.24],[13.0,3.5,2.24],.06,chrome);
    return faces;
  }
  function build(item) {
    switch(modelCode(item)) {
      case 'H1-1': return buildH1(item);
      case 'A1-1': return buildA1(item);
      default: return null;
    }
  }
  window.ChinChunModels = {matches,build};
})();
