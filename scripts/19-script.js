
/* ───────────── v16: obstacle-aware orthogonal routing + rounded corners ─────────────
   Auto-routed wires/pipes (no manual bend nodes, no bend offset) are searched on the
   10 px grid with A*, avoiding component bodies, with a penalty per bend so runs stay
   short and straight. Manual routes keep the user's nodes but get cleaned up. */
(function(){
const G=GRID,STUB=20,MARGIN=70,BEND=24,PAD=8;
const _old=routeWire;
let obsT=0,obsSig='',obs=[];
function obstacles(){
  const t=performance.now();
  if(t-obsT<6)return;obsT=t;
  let sig='';const o=[];
  for(const c of comps){const d=DEFS[c.type];if(!d)continue;
    const sw=(c.rot%2+2)%2===1,w=(sw?d.h:d.w)/2+PAD,h=(sw?d.w:d.h)/2+PAD;
    o.push({x0:c.x-w,x1:c.x+w,y0:c.y-h,y1:c.y+h,id:c.id});sig+=c.id+':'+c.x+','+c.y+','+c.rot+';';}
  if(sig!==obsSig){obsSig=sig;obs=o;}
}
const inside=(r,p)=>p.x>r.x0&&p.x<r.x1&&p.y>r.y0&&p.y<r.y1;
function hits(rs,ax,ay,bx,by){
  const x0=Math.min(ax,bx),x1=Math.max(ax,bx),y0=Math.min(ay,by),y1=Math.max(ay,by);
  for(const r of rs)if(x1>r.x0&&x0<r.x1&&y1>r.y0&&y0<r.y1)return true;return false;}
function simplify(P){
  const o=[];
  for(const p of P){const l=o[o.length-1];if(l&&l.x===p.x&&l.y===p.y)continue;o.push({x:p.x,y:p.y});}
  let ch=true;
  while(ch){ch=false;
    for(let i=1;i<o.length-1;i++){const a=o[i-1],b=o[i],c=o[i+1];
      const col=(a.x===b.x&&b.x===c.x)||(a.y===b.y&&b.y===c.y);
      if(col){o.splice(i,1);ch=true;break;}}}
  return o;}
function search(A,B,s1,s2,rs){
  const xs=new Set([s1.x,s2.x]),ys=new Set([s1.y,s2.y]);
  const lx=Math.min(s1.x,s2.x)-MARGIN,hx=Math.max(s1.x,s2.x)+MARGIN,ly=Math.min(s1.y,s2.y)-MARGIN,hy=Math.max(s1.y,s2.y)+MARGIN;
  for(let x=Math.ceil(lx/G)*G;x<=hx;x+=G)xs.add(x);
  for(let y=Math.ceil(ly/G)*G;y<=hy;y+=G)ys.add(y);
  const X=[...xs].sort((a,b)=>a-b),Y=[...ys].sort((a,b)=>a-b);
  const nx=X.length,ny=Y.length;if(nx*ny>14000)return null;
  const ix=new Map(X.map((v,i)=>[v,i])),iy=new Map(Y.map((v,i)=>[v,i]));
  const blocked=new Uint8Array(nx*ny);
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const p={x:X[i],y:Y[j]};for(const r of rs)if(inside(r,p)){blocked[i*ny+j]=1;break;}}
  const D=[[1,0],[0,1],[-1,0],[0,-1]];
  const start=ix.get(s1.x)*ny+iy.get(s1.y),goal=ix.get(s2.x)*ny+iy.get(s2.y);
  const sd=D.findIndex(d=>d[0]===A.dx&&d[1]===A.dy);
  const N=nx*ny*4,g=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N);
  const heap=[];const push=(f,s)=>{heap.push([f,s]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const t=heap[0],l=heap.pop();if(heap.length){heap[0]=l;let i=0;for(;;){let a=2*i+1,b=a+1,m=i;if(a<heap.length&&heap[a][0]<heap[m][0])m=a;if(b<heap.length&&heap[b][0]<heap[m][0])m=b;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return t;};
  const h=(i,j)=>Math.abs(X[i]-s2.x)+Math.abs(Y[j]-s2.y);
  const s0=start*4+(sd<0?0:sd);g[s0]=0;push(h(ix.get(s1.x),iy.get(s1.y)),s0);
  let end=-1,it=0;
  while(heap.length&&it++<60000){
    const [,s]=pop();if(closed[s])continue;closed[s]=1;
    const cell=s>>2,dir=s&3,i=(cell/ny)|0,j=cell%ny;
    if(cell===goal){end=s;break;}
    for(let k=0;k<4;k++){
      if(k===((dir+2)&3))continue;
      const ni=i+D[k][0],nj=j+D[k][1];if(ni<0||nj<0||ni>=nx||nj>=ny)continue;
      const nc=ni*ny+nj;if(blocked[nc])continue;
      const c=g[s]+Math.abs(X[ni]-X[i])+Math.abs(Y[nj]-Y[j])+(k!==dir?BEND:0);
      const ns=nc*4+k;if(c<g[ns]){g[ns]=c;from[ns]=s;push(c+h(ni,nj),ns);}
    }
  }
  if(end<0)return null;
  const path=[];for(let s=end;s>=0;s=from[s]){const cell=s>>2;path.push({x:X[(cell/ny)|0],y:Y[cell%ny]});}
  return path.reverse();
}
const cache=new Map();
routeWire=function(w){
  if((w.pts&&w.pts.length)||w.bend)return simplifyManual(_old(w));
  const A=termWorld(w.a.c,w.a.t),B=termWorld(w.b.c,w.b.t);if(!A||!B)return null;
  obstacles();
  const key=[A.x,A.y,A.dx,A.dy,B.x,B.y,B.dx,B.dy,w.a.c,w.b.c,obsSig].join('|');
  if(w._rk===key&&w._rv)return w._rv.map(p=>({x:p.x,y:p.y}));
  const stub=(T)=>({x:T.x+T.dx*STUB,y:T.y+T.dy*STUB});
  let s1=stub(A),s2=stub(B);
  // put the stub end on the grid along the stub axis so the run lines up with the lattice
  if(A.dx)s1.x=Math.round(s1.x/G)*G;else s1.y=Math.round(s1.y/G)*G;
  if(B.dx)s2.x=Math.round(s2.x/G)*G;else s2.y=Math.round(s2.y/G)*G;
  const rs=obs.filter(r=>!inside(r,s1)&&!inside(r,s2));
  let out=null;
  try{const m=search(A,B,s1,s2,rs);if(m)out=simplify([{x:A.x,y:A.y},...m,{x:B.x,y:B.y}]);}catch(e){}
  if(!out)out=simplifyManual(_old(w));
  w._rk=key;w._rv=out;return out.map(p=>({x:p.x,y:p.y}));
};
function simplifyManual(P){return P?simplify(P):P;}
/* rounded corners for every stroked path (wire, pipe, preview) */
drawPath=function(P){
  ctx.beginPath();if(!P.length)return;ctx.moveTo(P[0].x,P[0].y);
  for(let i=1;i<P.length-1;i++){
    const a=P[i-1],b=P[i],c=P[i+1];
    const r=Math.min(9,Math.hypot(b.x-a.x,b.y-a.y)/2,Math.hypot(c.x-b.x,c.y-b.y)/2);
    if(r<1){ctx.lineTo(b.x,b.y);continue;}
    ctx.arcTo(b.x,b.y,c.x,c.y,r);
  }
  if(P.length>1)ctx.lineTo(P[P.length-1].x,P[P.length-1].y);
};
})();
