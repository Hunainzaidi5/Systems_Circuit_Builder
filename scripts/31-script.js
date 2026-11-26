/* ══════════ v27 · AC BUS VOLTAGE / CABLE-DROP ESTIMATES ══════════
 * Uses the per-net Thevenin impedance from the fault-level solver to estimate the
 * voltage at each loaded bus: V_bus ≈ |V_th − I_load·Z_th| (PF≈0.85 lag assumed).
 * Results on window.ACBus[root] and c._busV/_dropV on major loads. Educational. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const PF=0.85;
function loadI(c){ /* rough load current per comp */
  switch(c.type){
    case'motor':case'acmotor':case'dcmotor':return N(c.I,0)||N(c.watts,0)/Math.max(1,N(c.volts,230));
    case'gearpump':return N(c.I,0);
    case'lamp':return N(c.I,0)||N(c.watts,0)/12;
    case'heater':case'fan':return N(c.watts,0)/Math.max(1,sim.volts||230);
    case'vfd':return N(c.amps,0);
    case'motor3':case'load3':return Math.max(N(c.I1,0),N(c.I2,0),N(c.I3,0));
    default:return N(c.I,0)||N(c._iIn,0);
  }
}
let t=0;
Game.register('acbus',{tick(dt){t+=dt;if(t<0.5)return;t=0;
  const st=sim.st;if(!st||!st.uf||!window.FAULTLEVELS)return;
  const R=(c,x)=>st.uf.find(key(c.id,x));
  /* net load current: sum loadI over comps whose L-type terminal sits on the net */
  const netI=new Map();
  for(const c of comps){
    if(['motor','acmotor','dcmotor','gearpump','lamp','heater','fan','vfd','motor3','load3','ledstrip','solenoid'].includes(c.type)&&!c.powered&&!c.on)continue;
    const terms=['L','a','L1','U','AC_L','+'].filter(t2=>(DEFS[c.type].term||[]).some(x=>x[0]===t2));
    for(const tm of terms){const r=R(c,tm);if(r==null)continue;
      const fl=window.FAULTLEVELS[r];if(!fl)continue;
      const i=loadI(c);if(i>0){netI.set(r,(netI.get(r)||0)+i);break;}}
  }
  window.ACBus={};
  for(const r in window.FAULTLEVELS){const fl=window.FAULTLEVELS[r];const I=netI.get(r)||0;
    const dV=I*fl.Zth*PF; /* conservative magnitude estimate */
    window.ACBus[r]={Vth:fl.V,Isc:fl.Isc,Iload:+I.toFixed(1),Vbus:+Math.max(0,fl.V-dV).toFixed(0),dropV:+dV.toFixed(1)};}
  /* write back to loads */
  for(const c of comps){if(!['motor','acmotor','gearpump','lamp','heater','fan','vfd'].includes(c.type))continue;
    const tm=(DEFS[c.type].term||[]).map(x=>x[0]).find(t2=>['L','a','AC_L'].includes(t2));if(!tm)continue;
    const r=R(c,tm),b=r!=null?window.ACBus[r]:null;
    if(b){c._busV=b.Vbus;c._dropV=b.dropV;}
  }
},reset(){window.ACBus={};for(const c of comps){delete c._busV;delete c._dropV;}}});
uxDesc(c=>{let s='';
  if(c._busV!==undefined)s+=`\nBus: ${N(c._busV,0).toFixed(0)} V (drop ${N(c._dropV,0).toFixed(1)} V)`;
  return s;});
uxProps(c=>{if(!c)return;const el=$('props');if(!el)return;
  if(c._busV!==undefined)el.insertAdjacentHTML('beforeend',`<div class="note">Estimated bus voltage <b>${N(c._busV,0).toFixed(0)} V</b> · cable+source drop ${N(c._dropV,0).toFixed(1)} V (Thevenin estimate)</div>`);});
log('v27 module ready — AC bus voltage / cable-drop estimates.');
})();
