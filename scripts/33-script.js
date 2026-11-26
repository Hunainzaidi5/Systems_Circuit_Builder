/* ══════════ v29 · WATER HAMMER (Joukowsky) ══════════
 * Estimates pressure surge on pump start/stop and valve closure:
 * ΔH = a·ΔV/g, wave speed a ≈ 1000–1200 m/s for steel pipe, ΔV = flow velocity change.
 * Velocity from pipe diameter (25 mm nominal) and solver flow (QK calibration).
 * Stores c._hammer (m head) and warns when surge exceeds ~60 m. Educational. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const QK=0.0004,A=1100,G=9.80665,D=0.025;
const PUMPS=['gearpump','pump','feedwaterpump','coolpump'];
const prev=new Map();let t=0;
Game.register('waterhammer',{tick(dt){t+=dt;if(t<0.1)return;t=0;
  for(const c of comps){
    if(!PUMPS.includes(c.type))continue;
    const q=N(c.flow,0)*QK; /* m³/s */
    const v=q/(Math.PI*D*D/4); /* m/s */
    const pv=prev.get(c.id)||0,dv=Math.abs(v-pv);prev.set(c.id,v);
    if(dv<0.05)continue; /* only on real step changes */
    const dH=A*dv/G; /* Joukowsky head rise, m */
    c._hammer=dH;c._hammerV=v;
    if(dH>60&&!c._hwarned){c._hwarned=true;try{log(`⚠ ${c.label||'Pump'}: water hammer ~${dH.toFixed(0)} m head surge on flow change — fit a soft-start or slow-closing valve`);}catch(e){}}
    if(dH<60)c._hwarned=false;
  }
  /* valve slam: rapid open→closed transitions on check/poppet valves */
  for(const c of comps){if(c.type!=='checkvalve'&&c.type!=='poppetvalve')continue;
    const f=N(c.flow,0)*QK,v=f/(Math.PI*D*D/4),pv=prev.get('v'+c.id)||0,dv=Math.abs(v-pv);prev.set('v'+c.id,v);
    if(dv>0.5){const dH=A*dv/G;c._hammer=dH;if(dH>60&&!c._hwarned){c._hwarned=true;try{log(`⚠ ${c.label||'Valve'}: check-valve slam ~${dH.toFixed(0)} m surge`);}catch(e){}}}
  }
},reset(){prev.clear();for(const c of comps){delete c._hammer;delete c._hammerV;delete c._hwarned;}}});
uxDesc(c=>{let s='';
  if(c._hammer!==undefined)s+=`\nWater hammer: last surge ~${N(c._hammer,0).toFixed(0)} m head (v ${N(c._hammerV,0).toFixed(2)} m/s)`;
  return s;});
uxProps(c=>{if(!c)return;const el=$('props');if(!el)return;
  if(c._hammer!==undefined)el.insertAdjacentHTML('beforeend',`<div class="note">Water hammer estimate: <b>${N(c._hammer,0).toFixed(0)} m</b> head surge · velocity ${N(c._hammerV,0).toFixed(2)} m/s · Joukowsky a≈1100 m/s, 25 mm nominal.</div>`);});
log('v29 module ready — Joukowsky water-hammer estimates on pump/valve flow steps.');
})();
