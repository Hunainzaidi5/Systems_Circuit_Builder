/* ══════════ v24 · HYDRAULIC NODAL PRESSURE PROFILE ══════════
 * Builds the hydraulic node graph (union-find nets joined by component bridges that
 * are NOT shorted by buildHUF: pumps, check/poppet valves, manifolds, cylinders),
 * then for each running pump traces discharge→sink paths (BFS) and computes a
 * Hazen-Williams pressure profile per node. Pressures are stored on window.HYD.nodes
 * and on each pump (_pathP). Units: metres of water head. Educational model. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const HW_C=130,d_m=0.025,QK=0.0004; /* sim flow unit → m³/s calibration */
const hwR=L=>10.67*L/(Math.pow(HW_C,1.852)*Math.pow(d_m,4.87)); /* hf = hwR(L)*Q^1.852 */
const hf=(Q,L)=>Q<=1e-9?0:hwR(L)*Math.pow(Q,1.852);
window.__hyd={wireLen:null,hwR,hf,QK,d_m,HW_C}; /* shared with 32 (loads after this) */
function wireLen(w){const A=termWorld(w.a.c,w.a.t),B=termWorld(w.b.c,w.b.t);if(!A||!B)return 0;
  let L=Math.hypot(B.x-A.x,B.y-A.y),px=A.x,py=A.y;for(const p of(w.pts||[])){L+=Math.hypot(p.x-px,p.y-py);px=p.x;py=p.y;}return L+Math.hypot(B.x-px,B.y-py);}
window.__hyd.wireLen=wireLen;
/* net → total pipe length */
function netLengths(hu){const m=new Map();
  for(const w of wires){if(!isPipe(w)||w.broken)continue;const r=hu.find(key(w.a.c,w.a.t));if(r==null)continue;m.set(r,(m.get(r)||0)+wireLen(w));}
  return m;}
/* component bridges: returns [{a:rootA,b:rootB,kind,comp}] for directional internal links */
function bridges(hu){
  const R=(c,t)=>hu.find(key(c.id,t)),out=[];
  const add=(c,a,b,kind)=>{const ra=R(c,a),rb=R(c,b);if(ra==null||rb==null||ra===rb)return;out.push({a:ra,b:rb,kind,c});};
  for(const c of comps){
    if(['gearpump','pump','feedwaterpump','coolpump'].includes(c.type)&&c.powered!==false)add(c,'SUC','DIS','pump');
    else if(c.type==='checkvalve'||c.type==='poppetvalve'){if(!(c.type==='poppetvalve'&&c.open===false))add(c,'IN','OUT','cv');}
    else if(c.type==='manifold'){for(const t of['OUT1','OUT2','OUT3'])if(c['o'+t.slice(3)]!==false)add(c,'IN',t,'mf');}
    else if(c.type==='cylsingle'){const d=N(c._dir,0);if(d>0)add(c,'IN','OUT','cyl');else if(d<0)add(c,'OUT','IN','cyl');}
    else if(c.type==='cyldouble'){const d=N(c._dir,0);if(d>0){add(c,'P1','P2','cyl');add(c,'P2','P1','cylR');}else if(d<0){add(c,'P2','P1','cyl');add(c,'P1','P2','cylR');}}
  }
  return out;
}
/* sink roots: tank IN/RETURN + process ports + cylinder ports */
function sinkRoots(hu){
  const R=(c,t)=>hu.find(key(c.id,t)),s=new Set();
  for(const c of comps){
    if(['tank','silo','feedwatertank','silopump'].includes(c.type)){const r=R(c,'IN');if(r!=null)s.add(r);if(c.type==='feedwatertank'){const r2=R(c,'RETURN');if(r2!=null)s.add(r2);}}
    const PROC={boiler:['WATER'],steamgenerator:['WATER_IN'],steamsource:['WATER_IN'],condenser:['WATER_IN'],coolingtower:['HOT_IN'],chwcondenser:['WATER_IN'],radiator:['WATER_IN'],engine4s:['COOL_IN']};
    for(const t of(PROC[c.type]||[])){const r=R(c,t);if(r!=null)s.add(r);}
    if(c.type==='cylsingle'||c.type==='cyldouble'){for(const t of['IN','P1','P2','OUT']){const r=R(c,t);if(r!=null)s.add(r);}}
  }
  return s;
}
Game.register('hydnodes',{tick(dt,gx){
  const hu=sim.hu,hflow=sim.hflow;if(!hu||!hflow)return;
  const R=(c,t)=>hu.find(key(c.id,t));
  const L=netLengths(hu),B=bridges(hu),SINK=sinkRoots(hu);
  /* adjacency: node → [{to,kind,c}] respecting direction (pump SUC→DIS, cv IN→OUT, mf IN→OUTi) */
  const adj=new Map();
  for(const b of B){if(!adj.has(b.a))adj.set(b.a,[]);adj.get(b.a).push(b);}
  /* BFS path from each pump DIS to nearest sink */
  window.HYD=window.HYD||{};window.HYD.nodes={};
  const pumps=comps.filter(c=>['gearpump','pump','feedwaterpump','coolpump'].includes(c.type)&&N(c.flow,0)>0.001);
  for(const p of pumps){
    const start=R(p,'DIS'),Q=N(p.flow,0)*QK;
    /* BFS */
    const prev=new Map([[start,null]]),q=[start];let goal=null;
    for(let i=0;i<q.length&&!goal;i++){const n=q[i];
      if(SINK.has(n)&&n!==start){goal=n;break;}
      for(const b of adj.get(n)||[]){if(!prev.has(b.b)){prev.set(b.b,{from:n,edge:b});q.push(b.b);if(SINK.has(b.b)){goal=b.b;i=q.length;break;}}}}
    /* reconstruct node list start→goal */
    const path=[];if(goal){let n=goal;while(n!=null){path.unshift(n);const e=prev.get(n);n=e?e.from:null;}}
    /* pressure profile: DIS at pump head, drop hf per node traversed */
    let P=N(p.head,0);p._pathP=[];p._pathLen=0;
    for(let i=0;i<path.length;i++){
      const node=path[i],len=L.get(node)||0;p._pathLen+=len;
      window.HYD.nodes[node]={P:+P.toFixed(2),L_m:+len.toFixed(1),via:p.label};
      p._pathP.push({node,P:+P.toFixed(2)});
      /* drop across this node's pipes + minor loss for the bridge leaving it */
      const drop=hf(Q,len);
      const edge=prev.get(path[i+1]||null);
      const minor=(edge&&(edge.edge.kind==='cv'?0.5:edge.edge.kind==='mf'?0.3:0.2));
      P=Math.max(0,P-drop-minor);
    }
    p._endPressure=P;
    if(P<0.5&&path.length>1&&!p._lpwarn){p._lpwarn=true;try{log(`⚠ ${p.label||'Pump'}: pressure at far end of run ≈ ${P.toFixed(1)} m — likely air-bound or undersized pipe`);}catch(e){}}
    if(P>=0.5)p._lpwarn=false;
  }
},
reset(){for(const c of comps){delete c._pathP;delete c._pathLen;delete c._endPressure;delete c._lpwarn;}}});
uxDesc(c=>{let s='';
  if(c._pathP&&c._pathP.length)s+=`\nHydraulic nodes: ${c._pathP.length} · end pressure ${N(c._endPressure,0).toFixed(1)} m · run ${N(c._pathLen,0).toFixed(0)} m pipe`;
  return s;});
log('v24 module ready — per-node hydraulic pressure profiles along pump runs.');
})();
