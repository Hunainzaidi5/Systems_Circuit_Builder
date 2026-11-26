/* ══════════ v25 · DC NODAL SOLVER (24 V controls, batteries, cable drop) ══════════
 * Real nodal analysis for the DC world: wires are 50 mΩ resistors, sources are
 * Thevenin→Norton equivalents, coils/loads are resistances. Solved by SOR iteration
 * on the electrical union-find roots every 0.5 s. Results: per-comp _dcV/_dcI,
 * window.DCVolts map, and voltage-drop warnings when a coil sees <80% of nominal.
 * AC nets are ignored (no DC injection → they solve to ~0 V harmlessly). */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const WIRE_R=0.05; /* Ω per wire segment — educational cable resistance */
const SRC_R={dcsource:.05,psu24:.08,battery:.05,lfpbattery:.03};
/* load models: [type, ta, tb, wattsFn(c)->W or null] — coil/control loads only */
const LOADS=[
  ['contactor','A1','A2',c=>12],
  ['relay','A1','A2',c=>3],
  ['timer','A1','A2',c=>3],
  ['ssr','+','-',c=>c.on?1:0.2],
  ['solenoid','+','-',c=>c.powered?N(c.watts,20):0],
  ['dcmotor','+','-',c=>c.powered?N(c.watts,500):0],
  ['ledstrip','+','-',c=>c.powered?N(c.watts,50)*N(c.brightness,100)/100:0.5],
  ['aimodule','+','-',()=>2.5],
  ['aomodule','+','-',()=>2.5],
  ['exciter','ARMATURE','FIELD',()=>8]
];
function srcVolts(c){
  if(c.type==='dcsource')return c.on?N(c.volts,24):0;
  if(c.type==='psu24')return N(c._vout,0)>=.5*N(c.vset,24)?N(c._vout,24):0;
  if(c.type==='battery'||c.type==='lfpbattery'){const v=(typeof bankV==='function'?bankV(c):0)||(typeof packV==='function'?packV(c):0)||N(c.voltage,12);return N(c.soc,50)>0?v:0;}
  return 0;
}
let DC={V:null,nodes:0,t:0};
function solve(){
  const st=sim.st;if(!st||!st.uf)return;
  const R=(c,t)=>st.uf.find(key(c.id,t));
  /* collect nodes & edges */
  const idx=new Map(),nodes=[];
  const nid=r=>{if(r==null)return -1;if(!idx.has(r)){idx.set(r,nodes.length);nodes.push(r);}return idx.get(r);};
  const G=[],B=[]; /* conductance edges {a,b,g}; injections {i,I} */
  const addG=(a,b,g)=>{if(a<0||b<0||a===b||g<=0)return;if(!G[a])G[a]=[];if(!G[b])G[b]=[];G[a].push([b,g]);G[b].push([a,g]);};
  const inj=new Map();const addI=(i,I)=>inj.set(i,(inj.get(i)||0)+I);
  for(const w of wires){if(w.broken||isPipe(w))continue;const a=nid(R(getC(w.a.c),w.a.t)),b=nid(R(getC(w.b.c),w.b.t));addG(a,b,1/WIRE_R);}
  for(const c of comps){
    if(['dcsource','psu24','battery','lfpbattery'].includes(c.type)){
      const E=srcVolts(c);if(E<=0)continue;
      const a=nid(R(c,'+')??R(c,'OUT+')),b=nid(R(c,'-')??R(c,'OUT-'));if(a<0||b<0)continue;
      const Ri=SRC_R[c.type]||.05,g=1/Ri;addG(a,b,g);addI(a,E*g);addI(b,-E*g);
    }
  }
  const loads=[];
  for(const [t,ta,tb,fn] of LOADS){for(const c of comps){if(c.type!==t)continue;const P=fn(c);if(P<=0)continue;
    const a=nid(R(c,ta)),b=nid(R(c,tb));if(a<0||b<0)continue;
    const V=Math.max(1,N(c.coilV,c.volts,24));const Rl=V*V/P,g=1/Rl;addG(a,b,g);loads.push({c,a,b,Rl,V});}}
  const n=nodes.length;if(!n){DC={V:null,nodes:0};return;}
  /* SOR solve */
  const V=new Array(n).fill(0);
  for(let it=0;it<400;it++){let err=0;
    for(let i=0;i<n;i++){const es=G[i];if(!es||!es.length)continue;
      let sum=inj.get(i)||0,den=0;for(const[b,g]of es){sum+=g*V[b];den+=g;}
      const nv=sum/den;err=Math.max(err,Math.abs(nv-V[i]));V[i]=V[i]+1.6*(nv-V[i]);}
    if(err<1e-4)break;}
  DC={V,nodes:n};
  window.DCVolts={};nodes.forEach((r,i)=>window.DCVolts[r]=+V[i].toFixed(2));
  /* write back per-load */
  for(const L of loads){const v=Math.abs(V[L.a]-V[L.b]);L.c._dcV=v;L.c._dcI=v/L.Rl;
    if(v<0.8*L.V&&!L.c._dclogged){L.c._dclogged=true;try{log(`⚠ ${L.c.label||L.c.type}: coil sees ${v.toFixed(1)} V (needs ${L.V} V) — check wiring / supply capacity`);}catch(e){}}
    if(v>=0.8*L.V)L.c._dclogged=false;}
  for(const c of comps){if(['dcsource','psu24','battery','lfpbattery'].includes(c.type)){
    const E=srcVolts(c);if(E<=0){c._dcI=0;continue;}const a=idx.get(R(c,'+')??R(c,'OUT+')),b=idx.get(R(c,'-')??R(c,'OUT-'));
    c._dcV=a>=0?V[a]:0;c._dcI=a>=0&&b>=0?(V[a]-V[b])/SRC_R[c.type]:0;}}
}
Game.register('dcsolver',{tick(dt){DC.t+=dt;if(DC.t>=0.5){DC.t=0;try{solve();}catch(e){if(!window._dce){window._dce=1;console.warn('dcsolver',e);}}}},
reset(){DC={V:null,nodes:0,t:0};for(const c of comps){delete c._dcV;delete c._dcI;delete c._dclogged;}}});
uxDesc(c=>{let s='';
  if(c._dcV!==undefined&&(LOADS.some(l=>l[0]===c.type)||['dcsource','psu24','battery','lfpbattery'].includes(c.type)))
    s+=`\nDC: ${N(c._dcV,0).toFixed(1)} V · ${N(c._dcI,0).toFixed(2)} A`;
  return s;});
log('v25 module ready — DC nodal solver (wire R, source Thevenin, coil loads).');
})();
