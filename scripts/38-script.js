/* ══════════ v34 · CENTRIFUGAL PUMP CURVE + NPSH ══════════
 * Formalises the pump head curve H(Q)=H0·(1−(Q/Qr)²) (matches the existing solver's
 * P0(1−r²) model) and adds net positive suction head analysis:
 *   NPSHa = Patm + P_suction(gauge) − Pv         (from hydraulic node pressures)
 *   NPSHr = npshRated·(Q/Qr)²                     (vendor curve, editable)
 * Cavitation when NPSHa < NPSHr → head/flow derate + warning.
 * Curve data on window.PUMPCURVES; readouts in props/describe. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const QK=0.0004,PATM=10.3,PV=0.24; /* m head, m head vapour pressure @~20 °C */
const PUMPS=['gearpump','pump','feedwaterpump','coolpump','silopump'];
let t=0;
function suctionP(c){
  /* gauge pressure at SUC node from the nodal solver (m head); fallback flooded suction */
  if(window.HYD2&&window.HYD2.P){const st=sim.st,hu=sim.hu;
    if(st&&hu){const r=hu.find(key(c.id,'SUC'));if(r!=null&&window.HYD2.P[r]!=null)return window.HYD2.P[r];}}
  return 2.0; /* assume ~2 m flooded suction when no solver data */
}
function curve(c){
  const hp=N(c.hp,1),fk=N(c.flowK,1),sp=N(c.spin,1)||1,hk=N(c.headK,1);
  const Qr=Math.max(.01,hp*.12*fk*sp)*QK;                    /* rated flow m³/s */
  const H0=Math.max(.1,(2.5+3*hp)*hk*sp*sp*10.2);             /* shutoff head m */
  return{Qr,H0,Q(c2){return N(c2.flow,0)*QK;},
    H(Q){return Math.max(0,H0*(1-Math.pow(clampQ(Q,Qr)/Qr,2)));},
    npshr(Q){return N(c.npshRated,3)*Math.pow(clampQ(Q,Qr)/Qr,2);}};
}
const clampQ=(q,r)=>Math.max(0,Math.min(q,r*1.5));
Game.register('pumpcurve',{tick(dt){t+=dt;if(t<0.5)return;t=0;
  window.PUMPCURVES={};
  for(const c of comps){if(!PUMPS.includes(c.type))continue;
    const cv=curve(c),Q=cv.Q(c);
    window.PUMPCURVES[c.id]={Qr:+(cv.Qr*60000).toFixed(1),H0:+cv.H0.toFixed(1),H:+cv.H(Q).toFixed(1),npshr:+cv.npshr(Q).toFixed(2)};
    const Ps=suctionP(c),npsha=PATM+Ps-PV,npshr=cv.npshr(Q);
    c._npsha=+npsha.toFixed(2);c._npshr=+npshr.toFixed(2);c._npshMargin=+(npsha-npshr).toFixed(2);
    c._cavitating=npsha<npshr&&Q>1e-6;
    if(c._cavitating&&!c._cvwarned){c._cvwarned=true;try{log(`⚠ ${c.label||'Pump'}: CAVITATION — NPSHa ${npsha.toFixed(1)} m < NPSHr ${npshr.toFixed(1)} m. Raise suction head or reduce flow.`);}catch(e){}}
    if(!c._cavitating)c._cvwarned=false;
    if(c._cavitating){c._headFactor=.55;c._flowFactor=.7;}else{delete c._headFactor;delete c._flowFactor;}
  }
},reset(){window.PUMPCURVES={};for(const c of comps){['npsha','npshr','npshMargin','cavitating','cvwarned','headFactor','flowFactor'].forEach(k=>delete c['_'+k]);}}});
/* readouts */
uxDesc(c=>{let s='';
  if(PUMPS.includes(c.type)&&c._npsha!==undefined)s+=`\nPump curve: Qr ${(window.PUMPCURVES?.[c.id]?.Qr||0)} L/min · H0 ${(window.PUMPCURVES?.[c.id]?.H0||0)} m\nNPSHa ${c._npsha} m · NPSHr ${c._npshr} m · margin ${c._npshMargin} m${c._cavitating?'\n⚠ CAVITATING — head/flow derated':''}`;
  return s;});
uxProps(c=>{if(!c||!PUMPS.includes(c.type))return;const el=$('props');if(!el)return;
  const pc=window.PUMPCURVES?.[c.id];
  el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#fbbf24;font-weight:800">CENTRIFUGAL CURVE + NPSH</div>
   <div class="f"><label>NPSHr rated (m)</label><input type="number" data-k="npshRated" data-t="n" min="0" max="30" step="0.1" value="${N(c.npshRated,3)}"></div>
   <div class="kpis" style="margin-top:6px"><div class="kpi"><b>Q rated</b><span>${pc?pc.Qr:'—'} L/min</span></div><div class="kpi"><b>H shutoff</b><span>${pc?pc.H0:'—'} m</span></div><div class="kpi"><b>NPSHa</b><span>${N(c._npsha,0).toFixed(1)} m</span></div><div class="kpi"><b>NPSHr</b><span style="color:${N(c._npshMargin,0)<0?'#ef4444':'#3df5b0'}">${N(c._npshr,0).toFixed(1)} m</span></div><div class="kpi"><b>Margin</b><span>${N(c._npshMargin,0).toFixed(1)} m</span></div></div>
   ${c._cavitating?'<div class="note" style="color:#ef4444">Cavitating — increase suction head or reduce speed/flow.</div>':''}
   <div class="note">H(Q)=H₀(1−(Q/Qr)²) · NPSHr=NPSHr_r·(Q/Qr)² · derate applied when NPSHa&lt;NPSHr.</div>`);});
log('v34 module ready — centrifugal pump curve + NPSH/cavitation analysis.');
})();
