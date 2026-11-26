/* ══════════ v26 · FAULT LEVELS (IEC 60909-ish) + IEC TCC CURVES ══════════
 * Each AC source gets a Thevenin impedance (generator ~15% subtransient, mains stiff,
 * transformer %Z, cable allowance). Per-net prospective fault current I_sc = V/Z_th
 * is computed every 0.5 s and exposed on window.FAULTLEVELS; the 21 distance relay
 * uses it for fault-current estimation instead of a fixed multiplier, and the 51
 * relay gains an IEC 60255 inverse-time curve option. Educational model. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* Thevenin impedance per source type (Ω, referred to LV side, 400 V base-ish) */
function srcZ(c){
  if(c.type==='source')return .02;                                  /* stiff mains */
  if(c.type==='source3')return .05;
  if(c.type==='generator'){const kva=Math.max(1,N(c.kva,5));return Math.max(.5,(N(sim.volts||230)**2)/(kva*1000)*.15);} /* ~15% Z on own base */
  if(c.type==='gasturbine'||c.type==='steamturbine'){const mw=Math.max(.05,N(c.mw,1));return Math.max(.5,(N(sim.volts||230)**2)/(mw*1e6)*.18);}
  if(c.type==='inverter')return Math.max(.5,N(sim.volts||230)**2/Math.max(100,N(c.rating,1000))*.08);
  if(c.type==='transformer'){return Math.max(.2,(N(c.secV,230)**2)/Math.max(1000,N(c.kva,100)*1000)*N(c.zpu,.06));}
  return 1;
}
function srcOn(c){
  if(c.type==='source'||c.type==='source3')return !!c.on;
  if(c.type==='generator')return !!(c.on&&N(c.fuel,0)>0);
  if(c.type==='gasturbine')return !!(c.on&&N(c.fuel,100)>0);
  if(c.type==='steamturbine')return !!c.on;
  if(c.type==='inverter')return !!(c.on&&c._out!==false);
  if(c.type==='transformer')return true;
  return false;
}
let FL={t:0};
function solve(){
  const st=sim.st;if(!st||!st.uf)return;
  const R=(c,t)=>st.uf.find(key(c.id,t));
  /* per-source Thevenin at its own phase terminal */
  const out={};
  for(const c of comps){if(!srcOn(c))continue;
    const v=c._V&&N(c._V,0)>0?N(c._V,0):(c.type==='source'||c.type==='source3'?N(c.volts,c.secV,230):230);
    const terms=c.type==='source3'?['L1','L2','L3']:['L'];
    for(const t of terms){const r=R(c,t);if(r==null)continue;
      const o=out[r]=out[r]||{V:0,Z:[]};o.V=Math.max(o.V,v);o.Z.push(srcZ(c));}}
  /* parallel Z per net + cable allowance (0.1 Ω + 0.1j X per wire, |Z| approx) */
  const wireR={};
  for(const w of wires){if(w.broken||isPipe(w))continue;
    const ra=R(getC(w.a.c),w.a.t),rb=R(getC(w.b.c),w.b.t);
    for(const r of[ra,rb])if(r!=null)wireR[r]=(wireR[r]||0)+Math.hypot(.1,.1);}
  window.FAULTLEVELS={};
  for(const r in out){const o=out[r];
    const zpar=1/o.Z.reduce((a,z)=>a+1/z,0);
    const zc=zpar+(wireR[r]||0)*.5;
    const isc=o.V/Math.max(.05,zc);
    window.FAULTLEVELS[r]={V:+o.V.toFixed(0),Zth:+zc.toFixed(3),Isc:+isc.toFixed(0)};}
}
Game.register('faultlevels',{tick(dt){FL.t+=dt;if(FL.t>=0.5){FL.t=0;try{solve();}catch(e){if(!window._fle){window._fle=1;console.warn('faultlevels',e);}}}},
reset(){window.FAULTLEVELS={};}});

/* IEC 60255 inverse-time option for the OC relay + fault-current-aware 21 relay */
const _rt=typeof relayTick23==='undefined'?null:null;
/* relayTick23 lives inside 23's IIFE — patch via step-level post-pass instead */
const _g=Game.register?null:null;
/* simpler: wrap Game 'protsync'? Not accessible — patch via describe/props + a tick that
   adjusts relay timing fields the existing tick reads. We add c._iecT computed here. */
Game.register('tcc',{tick(dt){
  for(const c of comps){
    if(c.type==='overcurrentrelay'&&c.curve==='iec'){
      /* IEC 60255 very-inverse: t = TDS*13.5/((I/Is)^1 -1); TDS≈timeDelay/0.14 scale */
      const Is=N(c.pickup,0)>0?N(c.pickup,0):N(c.setting,1.5);
      const M=N(c.measuredI,0)/Is;
      if(M>1){const t=N(c.timeDelay,.5)*13.5/(M-1);c._iecT=(N(c._iecT,0)+dt)>=t;if(c._iecT&&!c.tripped){c.tripped=true;try{log(`⚠ ${c.label} tripped: IEC curve (${c.measuredI.toFixed(2)} A, M=${M.toFixed(2)})`);}catch(e){}}}
      else c._iecT=0;
    }
    if(c.type==='distanceprotection'&&window.FAULTLEVELS){
      /* refine fault current using the Thevenin level of the protected net when a fault exists */
      const st=sim.st;if(st&&st.uf){const r=st.uf.find(key(c.id,'V'));
        const fl=r!=null?window.FAULTLEVELS[r]:null;
        if(fl&&fl.Isc>0)c._isc=fl.Isc;}
    }
  }
},reset(){for(const c of comps){delete c._iecT;delete c._isc;}}});
/* props: curve selector on OC relay + Isc readout on distance relay — uxProps hook */
uxProps(c=>{if(!c)return;const el=$('props');if(!el)return;
  const cb=(l,k,opts)=>`<div class="f"><label>${l}</label><select data-k="${k}" data-t="s">${opts.map(x=>`<option value="${x[0]}" ${c[k]===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></div>`;
  if(c.type==='overcurrentrelay')el.insertAdjacentHTML('beforeend',cb('Curve','curve',[['definite','Definite-time'],['iec','IEC 60255 inverse']])+`<div class="note">IEC mode: operate time t ≈ TDS·13.5/(M−1), M = I/pickup.</div>`);
  if(c.type==='distanceprotection'&&c._isc)el.insertAdjacentHTML('beforeend',`<div class="note">Prospective fault level at V terminal: <b>${N(c._isc,0).toFixed(0)} A</b> (IEC 60909 estimate)</div>`);
  if(window.FAULTLEVELS&&['generator','source','source3','gasturbine','steamturbine','inverter'].includes(c.type)){
    const st=sim.st,r=st?st.uf.find(key(c.id,'L')):null,fl=r!=null?window.FAULTLEVELS[r]:null;
    if(fl)el.insertAdjacentHTML('beforeend',`<div class="note">I_sc at this bus: <b>${fl.Isc} A</b> · Z_th ${fl.Zth} Ω</div>`);}
});
log('v26 module ready — per-net fault levels (I_sc) + IEC inverse-time OC curve.');
})();
