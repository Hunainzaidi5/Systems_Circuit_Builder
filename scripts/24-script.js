/* ══════════ v19 · STEAM TABLES (IAPWS) + PSYCHROMETRICS ══════════
 * IAPWS-IF97 Region 4 saturation equation (Wagner–Pruss, exact) for p_sat(T)/T_sat(p),
 * steam/water property correlations for the educational pressure range, and ASHRAE-style
 * psychrometrics (humidity ratio, dew point, enthalpy, wet bulb). Derived values are written
 * onto steam-system and air-side components each scan. Educational model only. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ── IAPWS IF97 Region 4: saturation pressure (MPa) from T (K) — Wagner equation ── */
const TC=647.096,PC=22.064e6,A=[-7.85951783,1.84408259,-11.7866497,22.6807411,-15.9618719,1.80122502];
function psatMPa(TK){
  if(TK<=273.15)return 0.000611213; if(TK>=TC)return PC;
  const t=1-TK/TC,t2=Math.sqrt(t);
  const s=A[0]*t+A[1]*Math.pow(t,1.5)+A[2]*Math.pow(t,3)+A[3]*Math.pow(t,3.5)+A[4]*Math.pow(t,4)+A[5]*Math.pow(t,7.5);
  return PC*Math.exp(TC/TK*s);
}
function tsatK(pPa){ /* iterative inverse of psatMPa */
  if(pPa<=611.213)return 273.15; if(pPa>=PC)return TC;
  let T=373.15;for(let i=0;i<40;i++){const d=(psatMPa(T)-pPa)/Math.max(1e-6,(psatMPa(T+0.5)-psatMPa(T-0.5)));T-=clamp((psatMPa(T)-pPa)/Math.max(1e-3,psatMPa(T)*0.06),-30,30);if(Math.abs(psatMPa(T)-pPa)<pPa*1e-5)break;}
  return clamp(T,273.15,TC);
}
/* saturation properties (educational fits, valid ~0.1–10 MPa / 100–320 °C) */
function steamProps(pBar,Tc){
  const TK=Tc+273.15,p=clamp(pBar,.05,150);
  const Ts=tsatK(p*1e5)-273.15;
  const Tsat=clamp(Ts,0.01,320);
  const superheat=Math.max(0,Tc-Tsat);
  const hfg=2500.8-2.36*Tsat;                 /* kJ/kg, Watson-type fit */
  const hf=4.186*Tsat,hg=hf+hfg;
  const x=superheat>0?clamp(superheat/(Tsat+50),0,1):0;
  const cp=1.88+0.9*Math.min(1,p/60)+0.4*x;    /* kJ/kg·K */
  const rhoIdeal=p*100/(0.4615*TK);
  const Z=1-0.02*Math.min(1,p/100)*Math.min(1,TK/500); /* crude compressibility */
  const rho=rhoIdeal/Z;
  const h=superheat>0?hg+cp*superheat:hf;      /* kJ/kg */
  const region=superheat>0?'superheated':(Math.abs(Tc-Tsat)<.5?'saturated':'compressed liquid');
  return{psat:psatMPa(TK)*10,Tsat,Tsat,h,hf,hg,hfg,cp,rho,Z,region,superheat};
}
function waterProps(Tc,pBar){
  const TK=Tc+273.15,rho=1000*(1-((Tc+288.9414)/(508929.2*(Tc+68.12963)))*(Tc-3.9863)*(Tc-3.9863)); /* Kell fit */
  const cp=4180+2.2*Math.max(0,Tc-20)/100;const h=4.186*Tc;
  return{rho:clamp(rho,800,1100),cp,h,Tsat:tsatK(Math.max(.1,pBar)*1e5)-273.15};
}

/* ── psychrometrics (ASHRAE fundamentals, p in kPa, T in °C) ── */
const pws=kPa=>0.61094*Math.exp(17.625*kPa/(kPa+243.04));           /* saturation vapour pressure */
function psychro(Tc,RH,pKPa){
  const p=clamp(pKPa||101.325,30,120),es=pws(Tc),ew=clamp(es*N(RH,50)/100,0,es);
  const w=0.622*ew/(p-ew);                                        /* kg/kg dry air */
  const ws=0.622*es/(p-es);
  const Tdp=17.625*Math.log(ew/0.61094)/(17.625-Math.log(ew/0.61094))-273.15+273.15; /* dew point °C */
  const TdpC=243.04*Math.log(ew/0.61094)/(17.625-Math.log(ew/0.61094));
  const h=1.006*Tc+w*(2501+1.86*Tc);                              /* kJ/kg dry air */
  /* wet-bulb: iterate h = 1.006Tw + w'(Tw)*(2501+1.86Tw) */
  let Tw=Tc;for(let i=0;i<25;i++){const esw=pws(Tw),ww=0.622*esw/(p-esw);Tw+=(h-(1.006*Tw+ww*(2501+1.86*Tw)))/5.8;Tw=clamp(Tw,-40,Tc+1);}
  return{es,ew,w,ws,RH:clamp(RH,0,100),Tdp:TdpC,h,Twb:Tw,p};
}

/* ── apply to components ── */
const STEAM=new Set(['boiler','steamsource','steamgenerator','steamturbine','steampipe','steamseparator','superheater','reheater','economizer','lpsystem','hpsystem','deaerator','condenser','steamtrap','dryer','hrsg','flame']);
const AIR=new Set(['ahu','fancoil','hvaczone','intakefilter','muffler']);
Game.register('thermolab',{tick(dt,gx){
  for(const c of comps){
    if(STEAM.has(c.type)){
      const p=N(c.pressure,c.steamPressure,c.outputPressure,0),T=N(c.temperature,c.steamTemp,c.tOut,100);
      if(p>0){const s=steamProps(p,T);c._steam={p,T,Tsat:s.Tsat,h:s.h,hg:s.hg,hf:s.hf,hfg:s.hfg,cp:s.cp,rho:s.rho,Z:s.Z,region:s.region,superheat:s.superheat};}
      else c._steam=null;
    }
    if(AIR.has(c.type)||c.type==='humiditysensor'){
      const T=N(c.temperature,c.measured,c.tIn,25),RH=N(c.rh??c.humidity,c.RH,50);
      c._psychro=psychro(T,RH,N(c._pKPa,101.325));
    }
  }
},
reset(){for(const c of comps){delete c._steam;delete c._psychro;}}});

/* properties panel additions — migrated to uxProps/uxDesc hooks (v30 registry) */
uxProps(c=>{if(!c)return;const el=$('props');if(!el)return;
  const f=(l,v)=>`<div class="f"><label>${l}</label><span style="font:11px ui-monospace,monospace">${v}</span></div>`;
  if(c._steam)el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#7dd3fc;font-weight:800">STEAM TABLE (IAPWS)</div>
    ${f('Region',c._steam.region)}${f('Tsat',c._steam.Tsat.toFixed(1)+' °C')}${f('Superheat',c._steam.superheat.toFixed(1)+' K')}
    ${f('h',c._steam.h.toFixed(1)+' kJ/kg')}${f('h_fg',c._steam.hfg.toFixed(1)+' kJ/kg')}${f('ρ',c._steam.rho.toFixed(3)+' kg/m³')}${f('cp',c._steam.cp.toFixed(2)+' kJ/kg·K')}${f('Z',c._steam.Z.toFixed(3))}`);
  if(c._psychro)el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#86efac;font-weight:800">PSYCHROMETRICS</div>
    ${f('W',c._psychro.w.toFixed(4)+' kg/kg')}${f('T_dp',c._psychro.Tdp.toFixed(1)+' °C')}${f('T_wb',c._psychro.Twb.toFixed(1)+' °C')}${f('h',c._psychro.h.toFixed(1)+' kJ/kg')}${f('p_ws',c._psychro.es.toFixed(2)+' kPa')}`);
});
uxDesc(c=>{let s='';
  if(c._steam)s+=`\nSteam: ${c._steam.region} · Tsat ${c._steam.Tsat.toFixed(1)} °C · h ${c._steam.h.toFixed(0)} kJ/kg · ρ ${c._steam.rho.toFixed(2)} kg/m³`;
  if(c._psychro)s+=`\nAir: w ${c._psychro.w.toFixed(4)} · Tdp ${c._psychro.Tdp.toFixed(1)} °C · Twb ${c._psychro.Twb.toFixed(1)} °C`;
  return s;});
window.STEAM={psatMPa,tsatK,steamProps,waterProps,psychro,pws};
log('v19 module ready — IAPWS saturation + steam/water properties and psychrometrics on steam and air-side components.');
})();
