/* ══════════ v28 · HYDRAULIC NODAL SOLVER (Newton) ══════════
 * Real nodal pressure solve on the hydraulic graph: nodes = union-find nets,
 * edges = component bridges (pumps, check/poppet valves, manifolds, cylinders)
 * plus per-net pipe friction (Hazen-Williams on actual wire length).
 * Pump edges inject head H(Q)=H0(1-(Q/Qr)^2); tank/process ports are pressure
 * boundaries; check valves are directional diodes. Solved by fixed-point
 * iteration on node pressures every 0.5 s. window.HYD2 exposes P per node.
 * Educational model — flows remain governed by the max-flow solver; this adds
 * a consistent pressure field and pump operating points. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const HW_C=130,d_m=0.025,QK=0.0004;
/* shared Hazen-Williams helpers live in 29 (window.__hyd) — local fallback kept for safety */
const _H=window.__hyd||{};
const hwR=_H.hwR||((L)=>10.67*L/(Math.pow(HW_C,1.852)*Math.pow(d_m,4.87)));
const wireLen=_H.wireLen||function(w){const A=termWorld(w.a.c,w.a.t),B=termWorld(w.b.c,w.b.t);if(!A||!B)return 0;
  let L=Math.hypot(B.x-A.x,B.y-A.y),px=A.x,py=A.y;for(const p of(w.pts||[])){L+=Math.hypot(p.x-px,p.y-py);px=p.x;py=p.y;}return L+Math.hypot(B.x-px,B.y-py);};
let S={t:0};
function solve(){
  const hu=sim.hu,hflow=sim.hflow;if(!hu||!hflow)return;
  const R=(c,t)=>hu.find(key(c.id,t));
  /* node pipe resistance: total wire length per net */
  const netL=new Map();
  for(const w of wires){if(!isPipe(w)||w.broken)continue;const r=hu.find(key(w.a.c,w.a.t));if(r==null)continue;netL.set(r,(netL.get(r)||0)+wireLen(w));}
  /* edges between distinct roots */
  const E=[];
  const add=(c,a,b,kind,dir)=>{const ra=R(c,a),rb=R(c,b);if(ra==null||rb==null||ra===rb)return;E.push({a:ra,b:rb,kind,c,dir:dir||0});};
  for(const c of comps){
    if(['gearpump','pump','feedwaterpump','coolpump'].includes(c.type)&&c.powered!==false)add(c,'SUC','DIS','pump');
    else if(c.type==='checkvalve'||c.type==='poppetvalve'){if(!(c.type==='poppetvalve'&&c.open===false))add(c,'IN','OUT','cv');}
    else if(c.type==='manifold'){for(const t of['OUT1','OUT2','OUT3'])if(c['o'+t.slice(3)]!==false)add(c,'IN',t,'mf');}
    else if(c.type==='cylsingle'){const d=N(c._dir,0);if(d>0)add(c,'IN','OUT','cyl');else if(d<0)add(c,'OUT','IN','cyl');}
  }
  /* boundary nodes: tank OUT = pressure source (level head), tank IN/process = sink (0 gauge + small back-pressure) */
  const P=new Map(),fixed=new Map();
  const PROC={boiler:['WATER'],steamgenerator:['WATER_IN'],steamsource:['WATER_IN'],condenser:['WATER_IN'],coolingtower:['HOT_IN'],chwcondenser:['WATER_IN'],radiator:['WATER_IN'],engine4s:['COOL_IN']};
  for(const c of comps){
    if(['tank','silo','feedwatertank','silopump'].includes(c.type)){
      const ro=R(c,'OUT'),ri=R(c,'IN');if(ro!=null&&N(c.level,0)>0)fixed.set(ro,Math.max(.5,N(c.level,0)/100*3)); /* ~3 m full head */
      if(ri!=null)fixed.set(ri,0);
      if(c.type==='feedwatertank'){const rr=R(c,'RETURN');if(rr!=null)fixed.set(rr,0);}
    }
    for(const t of(PROC[c.type]||[])){const r=R(c,t);if(r!=null&&!fixed.has(r))fixed.set(r,0);}
  }
  /* node set */
  const nodes=new Set(fixed.keys());
  for(const e of E){nodes.add(e.a);nodes.add(e.b);}
  for(const r of netL.keys())if(nodes.has(r)){}
  const list=[...nodes];
  if(list.length<2){window.HYD2={P:{},edges:0};return;}
  /* init pressures: fixed or mid */
  for(const n of list)P.set(n,fixed.has(n)?fixed.get(n):5);
  /* edge flow helpers */
  const pumpH=(c,Q)=>{const hp=N(c.hp,1),fk=N(c.flowK,1),sp=N(c.spin,1)||1;const Qr=Math.max(.01,hp*.12*fk*sp),H0=(2.5+3*hp)*N(c.headK,1)*sp*sp*10.2;return Math.max(0,H0*(1-Math.pow(Q/Qr,2)));};
  const qEdge=(e)=>{ /* flow a→b in m³/s given pressures */
    const Pa=P.get(e.a)||0,Pb=P.get(e.b)||0,dP=Pa-Pb;
    if(e.kind==='pump'){
      /* pump adds head: effective dP = Pa + H(Q) - Pb; solve Q iteratively per edge */
      let Q=N(e.c.flow,0)*QK;
      for(let i=0;i<6;i++){const H=pumpH(e.c,Math.abs(Q));const f=Math.sign(Q||1)*Math.sqrt(Math.max(0,Math.abs(dP+H))/Math.max(.01,hwR(netL.get(e.a)||10)+hwR(netL.get(e.b)||10)))*Math.sign(dP+H||1);Q=Q*.5+f*.5;}
      return Q;
    }
    if(e.kind==='cv')return dP>0?Math.sqrt(dP/Math.max(.01,hwR(netL.get(e.a)||10)))*1e-3*(dP>0.01?1:0):0; /* check valve forward only, small loss */
    if(e.kind==='mf')return dP>0?Math.sqrt(dP/Math.max(.05,hwR(netL.get(e.a)||10)*.5)):0;
    if(e.kind==='cyl')return clamp(dP/Math.max(.5,hwR(netL.get(e.a)||10)*10),-.05,.05);
    return 0;
  };
  /* Newton/fixed-point: iterate node pressures to satisfy ΣQ=0 at free nodes.
     Use simple gradient: adjust P by imbalance conductance. ~60 iterations. */
  for(let it=0;it<60;it++){
    const inj=new Map(); /* net inflow per node */
    for(const e of E){const q=qEdge(e);inj.set(e.a,(inj.get(e.a)||0)+q);inj.set(e.b,(inj.get(e.b)||0)-q);}
    let maxD=0;
    for(const n of list){if(fixed.has(n))continue;
      const im=inj.get(n)||0;
      /* stiffness estimate: sum of edge conductances touching n */
      let g=1e-4;for(const e of E){if(e.a===n||e.b===n)g+=1e-3;}
      const dP=im/g*.02; /* small relaxation */
      P.set(n,Math.max(0,P.get(n)+clamp(dP,-2,2)));maxD=Math.max(maxD,Math.abs(dP));}
    if(maxD<1e-4)break;
  }
  /* outputs */
  window.HYD2={P:{},Q:{},t:performance.now()};
  for(const n of list)window.HYD2.P[n]=+P.get(n).toFixed(2);
  for(const e of E){const q=qEdge(e);const k=e.c.id+':'+(e.kind==='pump'?'DIS':e.kind==='cv'?'OUT':'');window.HYD2.Q[k]=+(q*60000).toFixed(2); /* L/min */
    if(e.c._np===undefined)e.c._np={};e.c._np[e.kind==='pump'?'dis':'in']=+P.get(e.a).toFixed(2);
    if(e.kind==='pump'){ /* margin: head the pump develops vs what its curve says it should at this flow */
      const dP=(P.get(e.b)||0)-(P.get(e.a)||0),cap=pumpH(e.c,Math.abs(q));
      e.c._sysHead=dP;e.c._margin=cap-dP;
      if(Math.abs(q)>1e-6&&dP<cap*0.5&&!e.c._lpwarn){e.c._lpwarn=true;try{log(`⚠ ${e.c.label||'Pump'}: only ${dP.toFixed(1)} m head developed vs ${cap.toFixed(1)} m expected — check for air binding or a closed path`);}catch(_){}}
      if(dP>=cap*0.5)e.c._lpwarn=false;}}
}
/* expose pump operating point — uxDesc hook */
uxDesc(c=>{let s='';
  if(c._np&&c._np.dis!==undefined)s+=`\nHydraulic node P: DIS ${c._np.dis} m · IN ${c._np.in??'—'} m${c._sysHead!==undefined?` · head ${N(c._sysHead,0).toFixed(1)} m · margin ${N(c._margin,0).toFixed(1)} m`:''}`;
  return s;});
Game.register('hydsolver',{tick(dt){S.t+=dt;if(S.t>=0.5){S.t=0;try{solve();}catch(e){if(!window._hse){window._hse=1;console.warn('hydsolver',e);}}}},
reset(){window.HYD2={P:{},Q:{}};for(const c of comps){delete c._np;delete c._sysHead;delete c._margin;delete c._lpwarn;}}});
log('v28 module ready — hydraulic nodal pressure solver (Newton iteration on net graph).');
})();
