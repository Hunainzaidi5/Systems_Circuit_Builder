/* ══════════ v45 · ROOT-CAUSE FIXES · LIBRARY CLEAN-UP · MULTIMETER · V/A/W METERS · AC/DC BREAKERS · TRANSFORMERS ══════════
 * Load LAST (after 43-script.js).
 *  1. Old saved boards: migrates SPD / Pipe Support / Reactor / Flash Tank saved before the init-key rename (see 01 + 40-script.js).
 *  2. Library: Current/Voltage transformers, generic Transformer and the extra Solenoid Valve (Electrical Loads) removed.
 *  3. Real multimeter: AUTO / V AC / V DC / Ohms / Continuity (beeper) / Diode test.
 *  4. AC + DC V/A/W meters: real net voltage, downstream current, P/S/PF/Hz, kWh, Ah, min/max, alarm contact.
 *  5. AC + DC breakers: thermal-magnetic curves, breaking capacity, AC-on-DC detection, shunt trip, aux contacts, drawing.
 *  6. 1-phase isolation, 3-phase Dyn11 and HV transformers: ratio, taps/OLTC, regulation, losses, thermal, inrush,
 *     over/under voltage, fault level, trip. Educational model only. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SQ3=Math.sqrt(3),TAU=Math.PI*2,FIN=Number.isFinite;
const PH=new Set(['L','L2','L3']);
const PCOL=['#ffb020','#ff4fa0','#b07cff','#4da6ff'];
const T_=(c,s,x,y,col,sz,al,wt)=>txt(c,s,x,y,col||COL.text,sz||8,al||'center',wt||700);
const R_=(uf,c,t)=>uf.find(key(c.id,t));
const hexMix=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const wiredT=(c,t)=>wires.some(w=>!w.broken&&((w.a.c===c.id&&w.a.t===t)||(w.b.c===c.id&&w.b.t===t)));

/* ═══════════ 1 · OLD SAVED BOARDS (made before the init-key rename) ═══════════
 * SPD / Pipe Support were saved with type:'type2' / 'fixed'; Reactor / Flash Tank with x:0.2 / 0.15. */
function migrate(list){for(const c of list||[]){
  if(/^type[123]$/.test(c.type)){c.spdType=c.type;c.type='spd';}
  else if(c.type==='fixed'||c.type==='spring'||c.type==='roller'){c.supportType=c.type;c.type='pipesupport';}
  const k=c.type==='reactor'?'xpu':c.type==='flashtank'?'xf':null;
  if(k&&c[k]==null&&FIN(c.x)&&Math.abs(c.x)<1){c[k]=c.x;c.x=200+((c.id||0)%6)*40;}
  if(c.type==='multimeter'&&(!c.mode||c.mode==='VAC'))c.mode='auto';
}}
migrate(comps);
{const _lo=loadObj;loadObj=function(o){if(o&&o.comps)migrate(o.comps);return _lo.apply(this,arguments);};}

/* ═══════════ 2 · LIBRARY CLEAN-UP ═══════════ */
const REMOVED=['ct','vt','transformer','solenoid'];
REMOVED.forEach(t=>{delete DEFS[t];if(window.COMP)delete window.COMP[t];});
{const ids=new Set();comps=comps.filter(c=>DEFS[c.type]||(ids.add(c.id),false));
 if(ids.size){wires=wires.filter(w=>!ids.has(w.a.c)&&!ids.has(w.b.c));selected=null;multiSelected.clear();}}
document.querySelectorAll('#componentGroups .item').forEach(el=>{if(!DEFS[el.dataset.type])el.remove();});
document.querySelectorAll('#componentGroups .palette-group').forEach(g=>{if(!g.querySelector('.item'))g.remove();});
try{if(window.reorganizePalette)window.reorganizePalette();}catch(e){}

/* ═══════════ 3 · SHARED ELECTRICAL HELPERS ═══════════ */
const PHASOR={p1:[1,0],p2:[-.5,-SQ3/2],p3:[-.5,SQ3/2],n:[0,0],e:[0,0]};
/* net root -> {k:'ac'|'dc', role, v, f}: every energised source in the board */
function srcTable(uf){
  const m=new Map();
  const A=(c,t,role,v,f)=>{const r=R_(uf,c,t);if(!m.has(r))m.set(r,{k:'ac',role,v:N(v,0),f:N(f,50)});};
  const D=(c,t,role,v)=>{const r=R_(uf,c,t);if(!m.has(r))m.set(r,{k:'dc',role,v:N(v,0)});};
  for(const c of comps){switch(c.type){
    case'source':if(c.on){A(c,'L','p1',c.volts,50);A(c,'N','n',0,50);A(c,'PE','e',0,50);}break;
    case'source3':if(c.on){const v=N(c.volts,400)/SQ3,f=N(c.freq,50);A(c,'L1','p1',v,f);A(c,'L2','p2',v,f);A(c,'L3','p3',v,f);A(c,'N','n',0,f);A(c,'PE','e',0,f);}break;
    case'generator':if(c.on&&N(c.fuel,0)>0){const v=N(c.volts,400)/SQ3*((.3+.7*N(c._exc,.85))/.895)*(1-.04*clamp(N(c._pu,0),0,1.2)),f=N(c._f,0)>1?c._f:N(c.freq,50);
      A(c,'L1','p1',v,f);A(c,'L2','p2',v,f);A(c,'L3','p3',v,f);A(c,'N','n',0,f);A(c,'PE','e',0,f);}break;
    case'gasturbine':case'steamturbine':if(c._gen){const v=400/SQ3;A(c,'L1','p1',v);A(c,'L2','p2',v);A(c,'L3','p3',v);A(c,'N','n',0);A(c,'PE','e',0);}break;
    case'trf1p':if(c._secOn){A(c,'S_L','p1',c._vSec);A(c,'S_N','n',0);}break;
    case'trf3p':if(c._secOn){const v=N(c._vSec,400)/SQ3;A(c,'a','p1',v);A(c,'b','p2',v);A(c,'c','p3',v);A(c,'n','n',0);}break;
    case'transformerhv':if(c._secOn){A(c,'SEC_L','p1',c._vSec);A(c,'SEC_N','n',0);}break;
    case'inverter':if(c.on&&c._out!==false&&!c._bypass){A(c,'AC_L','p1',230);A(c,'AC_N','n',0);}break;
    case'ups1':if(c._outInv||c._bypL||c._ecoL){A(c,'OUT_L','p1',230);A(c,'OUT_N','n',0);A(c,'OUT_PE','e',0);}break;
    case'ups3':if(c._outInv||c._bypL||c._ecoL){A(c,'OUT1','p1',230);A(c,'OUT2','p2',230);A(c,'OUT3','p3',230);A(c,'OUTN','n',0);}break;
    case'hybrid':case'hybridlfp':case'hybridlfpgt':case'hybridbms':if(c.on&&c._out!==false&&c._src==='INV'){A(c,'OUT_L','p1',230);A(c,'OUT_N','n',0);A(c,'OUT_PE','e',0);}break;
    case'dcsource':if(c.on){D(c,'+','p',c.volts);D(c,'-','n',0);}break;
    case'psu24':if(N(c._vout,0)>.5){D(c,'+','p',c._vout);D(c,'-','n',0);}break;
    case'solar':case'wind':if(N(c.outputPower,0)>0){D(c,'+','p',N(c.voltage,30));D(c,'-','n',0);}break;
    case'batterycharger':if(c.status==='CHARGING'||c.status==='READY'){D(c,'DC+','p',c.dcVoltage);D(c,'DC-','n',0);}break;
    case'supercap':if(N(c.soc,0)>2){D(c,'+','p',c.voltage);D(c,'-','n',0);}break;
    case'bms':if(c.on&&!c.tripped&&c.dsgOk){D(c,'P+','p',N(c.packV,0)||48);D(c,'P-','n',0);}break;
  }}
  try{for(const b of packBankList())if(b.packs.every(x=>N(x.soc,0)>0)){D(b.top,'OUT+','p',bankV(b.top));D(b.bottom,'OUT-','n',0);}}catch(e){}
  return m;
}
function ground(st,r){const t=st.cl&&st.cl.m.get(r);return(t==='PE'||t==='N')?{k:'g',role:'e',v:0}:null;}
/* voltage between two nets: rms AC (phasor difference), signed DC (a - b) */
function measureV(st,tbl,ra,rb){
  const o={ac:0,dc:0,f:0},A=tbl.get(ra)||ground(st,ra),B=tbl.get(rb)||ground(st,rb);
  if(!A||!B||ra===rb)return o;
  if(A.k==='ac'||B.k==='ac'){
    const pa=A.k==='ac'?PHASOR[A.role]||[0,0]:[0,0],pb=B.k==='ac'?PHASOR[B.role]||[0,0]:[0,0],va=A.k==='ac'?A.v:0,vb=B.k==='ac'?B.v:0;
    o.ac=Math.hypot(pa[0]*va-pb[0]*vb,pa[1]*va-pb[1]*vb);o.f=A.k==='ac'?A.f:B.f;}
  if(A.k==='dc'&&B.k==='dc')o.dc=(A.role==='p'?A.v:0)-(B.role==='p'?B.v:0);
  return o;
}
/* AC load list [{r,I,P,S,c}] — what every energised load draws, used for "current through" a device */
function collectAC(uf,tbl,ov){
  const V0=N(sim.volts,230)||230,out=[];
  const vAt=r=>{if(ov&&r===ov.r)return ov.v;const i=tbl.get(r);return i&&i.k==='ac'&&(i.role==='p1'||i.role==='p2'||i.role==='p3')&&i.v>1?i.v:V0;};
  const addW=(c,t,W,pf)=>{if(!(W>.01))return;const r=R_(uf,c,t),v=vAt(r);out.push({r,I:W/(v*pf),P:W,S:W/pf,c});};
  const addI=(c,t,I,pf)=>{if(!(I>1e-4))return;const r=R_(uf,c,t),v=vAt(r);out.push({r,I,P:I*v*pf,S:I*v,c});};
  const addX=(c,t,I,P,S)=>{if(!(I>1e-4))return;out.push({r:R_(uf,c,t),I,P,S,c});};
  for(const c of comps){const d=DEFS[c.type];if(!d)continue;
    if(d.acT){const I=N(c._iIn,0);if(I>1e-4)for(const t of d.acT){const r=R_(uf,c,t);addX(c,t,I,N(c._pIn,0)/d.acT.length,I*vAt(r));}continue;}
    switch(c.type){
      case'motor':case'acmotor':case'silopump':if(c.powered)addI(c,'L',N(c.I,0),N(c.pf,.8));break;
      case'gearpump':if(c.powered&&c.drive!=='shaft')addI(c,'L',N(c.I,0),N(c.pf,.85));break;
      case'lamp':if(c.powered)addW(c,'a',N(c.watts,0),1);break;
      case'heater':if(c.powered)addW(c,'L',N(c.watts,0),1);break;
      case'fan':if(c.powered)addW(c,'L',N(c.watts,0),.85);break;
      case'load3':for(let k=1;k<=3;k++)addX(c,'L'+k,N(c['I'+k],0),N(c['P'+k],0),N(c['S'+k],0));break;
      case'motor3':if(c.powered||c.phaseLoss)['U','V','W'].forEach((t,k)=>addX(c,t,N(c['I'+(k+1)],0),N(c['P'+(k+1)],0),N(c['S'+(k+1)],0)));break;
      case'vfd':if(c.on)['L1','L2','L3'].forEach(t=>addI(c,t,N(c.amps,10),.95));break;
      case'batterycharger':if(c.status==='CHARGING')addI(c,'AC_L',N(c.inputCurrent,0),.7);break;
      case'chwcondenser':if(c.powered&&N(c._kw,0)>0)addW(c,'L',c._kw*1000,.85);break;
      case'trf1p':addX(c,'P1',N(c._iPri,0),N(c._pPri,0),N(c._sPri,0));break;
      case'trf3p':['A','B','C'].forEach(t=>addX(c,t,N(c._iPri,0),N(c._pPri,0)/3,N(c._sPri,0)/3));break;
      case'transformerhv':addX(c,'PRI_L',N(c._iPri,0),N(c._pPri,0),N(c._sPri,0));break;
      default:if(d.cat==='HVAC System'&&c.powered&&N(c.watts,0)>0&&d.term.some(t=>t[0]==='L'))addW(c,'L',c.watts,.85);
    }}
  return out;
}
/* DC load list [{r,I,c}]: + = draws current from the net, − = pushes current into it */
const DCL={contactor:'A1',relay:'A1',timer:'A1',ssr:'+',aimodule:'+',aomodule:'+',exciter:'ARMATURE'},EXTSUP={ledstrip:'+',dcmotor:'+'};
function collectDC(uf,tbl){
  const out=[];
  const add=(c,t,I)=>{if(!FIN(I)||Math.abs(I)<1e-5)return;out.push({r:R_(uf,c,t),I,c});};
  const Vb=(c,t,d)=>{const i=tbl.get(R_(uf,c,t));return i&&i.k==='dc'&&i.v>1?i.v:d;};
  for(const c of comps){const d=DEFS[c.type];if(!d)continue;
    const sup=(d.sup&&d.sup[0])||EXTSUP[c.type];
    if(sup&&N(c._iDC,0)>0)add(c,sup,c._iDC);
    else if(DCL[c.type]&&N(c._dcI,0)>0)add(c,DCL[c.type],c._dcI);
    switch(c.type){
      case'inverter':if(c.on&&N(c._dcW,0)>0)add(c,'DC+',c._dcW/Vb(c,'DC+',48));break;
      case'hybrid':case'hybridlfp':case'hybridlfpgt':case'hybridbms':if(c.on){add(c,'BAT+',(N(c._dcW,0)-N(c._chgW,0))/Vb(c,'BAT+',N(c.battNom,48)));if(N(c.pvW,0)>0)add(c,'PV+',c.pvW/Vb(c,'PV+',60));}break;
      case'solar':case'wind':if(N(c.outputPower,0)>0)add(c,'+',-c.outputPower/Math.max(6,N(c.voltage,30)));break;
      case'battery':case'lfpbattery':{const b=bankOf(c);if(b.top===c)add(c,'OUT+',-N(c._packI,0));}break;
    }}
  return out;
}
/* continuity / resistance graph (roots as nodes) */
function ohmGraph(st){
  const g=new Map(),V0=N(sim.volts,230)||230;
  const link=(a,b,Rv,vf)=>{if(a===b||!(Rv>=0))return;(g.get(a)||g.set(a,[]).get(a)).push({to:b,R:Rv,vf});if(vf==null)(g.get(b)||g.set(b,[]).get(b)).push({to:a,R:Rv});};
  const E=(c,a,b,Rv,vf)=>link(R_(st.uf,c,a),R_(st.uf,c,b),Rv,vf);
  for(const c of comps){const T=c.type,d=DEFS[T];if(!d)continue;
    if(T==='lamp')E(c,'a','b',c.fault==='open'?Infinity:V0*V0/Math.max(1,N(c.watts,60))/12);
    else if(T==='heater')E(c,'L','N',V0*V0/Math.max(1,N(c.watts,2000)));
    else if(T==='fan')E(c,'L','N',V0*V0/Math.max(1,N(c.watts,100))*.5);
    else if(T==='motor'||T==='acmotor'||T==='gearpump'||T==='silopump'){const P=Math.max(100,N(c.hp,1)*746/Math.max(.3,N(c.eff,.75)));E(c,'L','N',c.fault==='open'?Infinity:V0*V0/P*.12);}
    else if(T==='dcmotor')E(c,'+','-',c.fault==='open'?Infinity:Math.pow(N(c.volts,24),2)/Math.max(10,N(c.watts,500))*.15);
    else if(T==='motor3'){const Rw=2*V0*V0/Math.max(100,N(c.hp,5)*746/Math.max(.3,N(c.eff,.9)))*.12*1.5;E(c,'U','V',Rw);E(c,'V','W',Rw);E(c,'U','W',Rw);}
    else if(T==='load3'){const Rp=V0*V0/Math.max(1,N(c.kw,6)*1000/3);E(c,'L1','N',Rp);E(c,'L2','N',Rp);E(c,'L3','N',Rp);}
    else if(T==='contactor')E(c,'A1','A2',c.fault==='coilopen'?Infinity:48);
    else if(T==='relay')E(c,'A1','A2',192);
    else if(T==='timer')E(c,'A1','A2',480);
    else if(T==='ssr')E(c,'+','-',1200);
    else if(T==='ledstrip')E(c,'+','-',0,2.8);
    else if(T.startsWith('rly_')&&d.coilT)E(c,d.coilT[0],d.coilT[1],Math.pow(N(c.coilV,24),2)/1.5);
    else if(T.startsWith('pl_')||T==='pbillum')E(c,'X1','X2',0,2.0);
    else if(d.cat==='Solenoid Valves'){const R1=Math.pow(N(c.coilV,24),2)/Math.max(1,N(c.watts,4));if(T==='sv52d'){E(c,'Y14+','Y14-',R1);E(c,'Y12+','Y12-',R1);}else E(c,'1','2',R1);}
    else if(T==='diodebridge'){E(c,'L','DC+',0,.7);E(c,'N','DC+',0,.7);E(c,'DC-','L',0,.7);E(c,'DC-','N',0,.7);}
    else if(T==='earthrod')link(R_(st.uf,c,'PE'),'EARTH',N(c.resistance,10));
    else if(T==='acbreaker'||T==='dcbreaker')E(c,T==='acbreaker'?'MX+':'MX+',T==='acbreaker'?'MX-':'MX-',Math.pow(N(c.coilV,T==='acbreaker'?230:24),2)/6);
    else if(XF[T]){const q=xfR(c);
      if(T==='trf1p'){E(c,'P1','P2',q.rp);E(c,'S_L','S_N',q.rs);}
      else if(T==='trf3p'){E(c,'A','B',1.5*q.rp);E(c,'B','C',1.5*q.rp);E(c,'C','A',1.5*q.rp);E(c,'a','n',q.rs);E(c,'b','n',q.rs);E(c,'c','n',q.rs);}
      else{E(c,'PRI_L','PRI_N',q.rp);E(c,'SEC_L','SEC_N',q.rs);}}
  }
  return g;
}
function shortest(g,from,to,diode){
  const dist=new Map([[from,0]]),vf=new Map([[from,0]]),done=new Set();
  for(;;){let u=null,best=Infinity;for(const[k,v]of dist)if(!done.has(k)&&v<best){best=v;u=k;}
    if(u===null)break;if(u===to)return{c:best,vf:vf.get(u)||0,nd:Math.round((best%1e6>5e5?best+5e5:best)/1e6)};
    done.add(u);
    for(const e of g.get(u)||[]){if(!FIN(e.R))continue;if(e.vf!=null&&!diode)continue;
      const nd=best+e.R+(e.vf!=null?1e6:0);if(nd<(dist.has(e.to)?dist.get(e.to):Infinity)){dist.set(e.to,nd);vf.set(e.to,(vf.get(u)||0)+(e.vf||0));}}}
  return null;
}
const fmtV=v=>{const a=Math.abs(v);return a>=1000?(v/1000).toFixed(3):a>=100?v.toFixed(1):a>=10?v.toFixed(2):v.toFixed(3);};
const fmtR=r=>r<1000?[r.toFixed(r<10?2:1),'Ω']:r<1e6?[(r/1000).toFixed(2),'kΩ']:r<1e8?[(r/1e6).toFixed(2),'MΩ']:['OL',''];

/* ═══════════ 4 · TRANSFORMER ENGINE (1Φ isolation · 3Φ Dyn11 · HV) ═══════════ */
const XF={
  trf1p:{ph:1,P:['P1','P2'],S:['S_L'],vp:c=>N(c.priV,400),vs:c=>N(c.secV,230),S0:c=>N(c.kva,2)*1000},
  trf3p:{ph:3,P:['A','B','C'],S:['a','b','c'],vp:c=>N(c.priV,400),vs:c=>N(c.secV,400),S0:c=>N(c.kva,100)*1000},
  transformerhv:{ph:3,P:['PRI_L','PRI_N'],S:['SEC_L'],vp:c=>N(c.priKv,11)*1000,vs:c=>N(c.secKv,.4)*1000,S0:c=>N(c.mva,1)*1e6}
};
const DFL={
  trf1p:{z:5,xr:2,i0:3,pfe:.5,inr:5,rise:90,tAl:130,tTr:150,tau:60,amb:25},
  trf3p:{z:4,xr:4,i0:1.5,pfe:.4,inr:6,rise:90,tAl:130,tTr:150,tau:60,amb:25},
  transformerhv:{z:6,xr:12,i0:.5,pfe:.15,inr:7,rise:65,tAl:105,tTr:120,tau:120,amb:30}
};
/* definitions: sizes, terminals, defaults */
{const d=DEFS.trf1p;if(d){d.w=130;d.h=110;d.term=[['P1',-65,-20,-1,0],['P2',-65,20,-1,0],['S_L',65,-20,1,0],['S_N',65,20,1,0]];
  Object.assign(d.init,{priV:400,secV:230,zPct:5,xr:2,i0Pct:3,pfePct:.5,inrush:5,tap:0,on:true,amb:25,tripped:false,loading:0});}}
{const d=DEFS.trf3p;if(d){d.w=170;d.h=150;d.term=[['A',-85,-40,-1,0],['B',-85,0,-1,0],['C',-85,40,-1,0],['a',85,-45,1,0],['b',85,-15,1,0],['c',85,15,1,0],['n',85,45,1,0],['PE',0,75,0,1]];
  Object.assign(d.init,{priV:400,secV:400,zPct:4,xr:4,i0Pct:1.5,pfePct:.4,inrush:6,tap:0,on:true,amb:25,tripped:false,loading:0});}}
{const d=DEFS.transformerhv;if(d){d.w=190;d.h=150;d.name='HV Transformer';
  d.term=[['PRI_L',-95,-30,-1,0],['PRI_N',-95,30,-1,0],['SEC_L',95,-30,1,0],['SEC_N',95,30,1,0],['ALM',-25,75,0,1],['TRIP',25,75,0,1]];
  d.pins=Object.assign(d.pins||{},{PRI_L:'HV primary line (single-line equivalent)',PRI_N:'HV primary neutral / return',SEC_L:'LV secondary line',SEC_N:'LV secondary neutral',ALM:'alarm output — asserts + on high temperature / overload',TRIP:'trip output — asserts + when the protection trips (wire to a breaker MX/TC coil)'});
  Object.assign(d.init,{priKv:11,secKv:.4,mva:1,vgroup:'Dyn11',tap:0,tapMode:'auto',vSetPct:100,zPct:6,xr:12,i0Pct:.5,pfePct:.15,inrush:7,on:true,amb:30,fanOn:75,tripped:false,loading:0,ratio:27.5});}}
COMP_BLURB.trf1p='1-phase isolation transformer. P1–P2 across the primary (must be at the rated primary voltage), S_L/S_N give an isolated secondary. Output follows the turns ratio, tap and load regulation (%Z), with iron/copper losses, inrush, winding temperature and over-temperature / over-voltage trip.';
COMP_BLURB.trf3p='3-phase Dyn11 distribution transformer. Delta primary A/B/C needs all three phases; star secondary a/b/c + neutral n. Real ratio, ±5 % taps, voltage regulation, per-phase and neutral current, losses, inrush, thermal model, primary-voltage and overload protection.';
COMP_BLURB.transformerhv='HV power transformer (single-line equivalent). Real turns ratio priKv/secKv with on-load tap changer (manual or AUTO voltage control), %Z regulation, iron/copper losses, inrush, oil/winding temperature with fans, alarm and trip outputs, and a prospective fault level at the LV side. It no longer passes the primary straight through to the secondary.';

/* resistances of windings (for the multimeter) */
function xfR(c){const cfg=XF[c.type],D=DFL[c.type],S0=Math.max(100,cfg.S0(c)),z=N(c.zPct,D.z)/100,xr=Math.max(.5,N(c.xr,D.xr)),rPu=z/Math.sqrt(1+xr*xr);
  return{rp:.5*rPu*Math.pow(cfg.vp(c),2)/S0,rs:.5*rPu*Math.pow(cfg.vs(c),2)/S0};}

function xfStep(c,h,st,tbl,loads,last){
  const cfg=XF[c.type],D=DFL[c.type],ph3=cfg.ph===3;
  const Vpn=cfg.vp(c),Vsn=cfg.vs(c),S0=Math.max(100,cfg.S0(c));
  const z=N(c.zPct,D.z)/100,xr=Math.max(.5,N(c.xr,D.xr)),rPu=z/Math.sqrt(1+xr*xr),xPu=rPu*xr;
  const rp=cfg.P.map(t=>R_(st.uf,c,t));
  /* primary voltage */
  let Vp=0;
  if(c.type==='trf3p'){const a=measureV(st,tbl,rp[0],rp[1]).ac,b=measureV(st,tbl,rp[1],rp[2]).ac,d=measureV(st,tbl,rp[2],rp[0]).ac;Vp=(a+b+d)/3;c._unb=Vp>1?(Math.max(a,b,d)-Math.min(a,b,d))/Vp*100:0;}
  else Vp=measureV(st,tbl,rp[0],rp[1]).ac;
  const live44=!!c.active&&!st.cl.short;
  if(live44&&Vp<.5)Vp=Vpn;                      /* fed by a source the table does not know — assume rated */
  if(!live44)Vp=0;
  let vpu=Vpn>0?Vp/Vpn:0;
  if(c.type==='transformerhv'&&Vp>0){const alt=Vp*SQ3/Vpn;if(Math.abs(Math.log(Math.max(alt,1e-6)))<Math.abs(Math.log(Math.max(vpu,1e-6))))vpu=alt;}
  const kconv=(Vp>0&&vpu>0)?Vp/(vpu*Vpn):1;
  /* taps */
  const tapStep=c.type==='transformerhv'?1.25:2.5,tapMax=c.type==='transformerhv'?8:4;
  c.tap=clamp(Math.round(N(c.tap,0)),-tapMax,tapMax);
  const vsOC0=Vp*(Vsn/Vpn);
  /* secondary load */
  const rs=c.type==='trf3p'?['a','b','c'].map(t=>R_(st.uf,c,t)):[R_(st.uf,c,c.type==='transformerhv'?'SEC_L':'S_L')];
  let I=0,P=0,Sx=0;const Ip=[0,0,0];
  for(const l of loads){const i=rs.indexOf(l.r);if(i>=0){I+=l.I;P+=l.P;Sx+=l.S;Ip[i]+=l.I;}}
  const pf=Sx>1?clamp(P/Sx,.05,1):1,sinF=Math.sqrt(1-pf*pf),lf=Sx/S0;
  const dV=lf*(rPu*pf+xPu*sinF);
  /* HV on-load tap changer */
  if(c.type==='transformerhv'&&c.tapMode!=='manual'&&last&&Vp>0&&!c.tripped){
    c._tapT=N(c._tapT,0)+h;
    if(c._tapT>2){c._tapT=0;const ref=Vsn*kconv,pu=(vsOC0*(1+c.tap*tapStep/100)*(1-dV))/Math.max(1,ref),tg=N(c.vSetPct,100)/100;
      if(pu<tg-.0125&&c.tap<tapMax)c.tap++;else if(pu>tg+.0125&&c.tap>-tapMax)c.tap--;}}
  const tapF=1+c.tap*tapStep/100;
  c._cut=!!c.tripped||c.on===false;
  c._secOn=!!c.active&&!c._cut&&Vp>0;
  const vs=c._secOn?vsOC0*tapF*(1-dV):0;
  /* losses and primary current */
  const Pcu=lf*lf*rPu*S0,Pfe=N(c.pfePct,D.pfe)/100*S0*vpu*vpu,i0=N(c.i0Pct,D.i0)/100;
  const Qm=Math.sqrt(Math.max(0,Math.pow(i0*S0*vpu,2)-Pfe*Pfe)),Ql=Math.sqrt(Math.max(0,Sx*Sx-P*P)),Qx=lf*lf*xPu*S0;
  const Pin=live44?(c._secOn?P:0)+(c._secOn?Pcu:0)+Pfe:0,Qin=live44?(c._secOn?Ql+Qx:0)+Qm:0,Sin=Math.hypot(Pin,Qin);
  if(live44&&!c._wasA){c._tE=0;}c._wasA=live44;if(last)c._tE=N(c._tE,0)+h;
  const In=S0/(Math.max(Vpn,1)*(ph3?SQ3:1)),Iinr=live44?In*N(c.inrush,D.inr)*Math.exp(-N(c._tE,0)/.1):0;
  const Vref=Math.max(Vp,Vpn*.02),Ipri=Sin/(Vref*(ph3?SQ3:1))+Iinr;
  c._iPri=live44?Ipri:0;c._sPri=Sin;c._pPri=Pin;c._pfIn=Sin>1?Pin/Sin:1;
  /* thermal */
  let rise=N(c.riseK,D.rise)*(.12+.88*Math.pow(Math.min(lf,3),1.8));
  if(c.type==='transformerhv'){c._fans=N(c._temp,25)>N(c.fanOn,75);if(c._fans)rise*=.85;}
  const Tamb=N(c.amb,D.amb);if(!FIN(c._temp))c._temp=Tamb;
  if(last)c._temp+=((live44?Tamb+rise:Tamb)-c._temp)*Math.min(1,h/D.tau);
  /* warnings / trips */
  const warn=[];
  if(c._temp>N(c.tAlarm,D.tAl))warn.push('HIGH TEMPERATURE');
  if(lf>1.05)warn.push('OVERLOAD '+(lf*100).toFixed(0)+'%');
  if(live44&&vpu<.8)warn.push('PRIMARY '+(vpu*100).toFixed(0)+'% OF RATED → LOW SECONDARY');
  if(vpu>1.1)warn.push('OVER-VOLTAGE '+(vpu*100).toFixed(0)+'% (V/Hz)');
  if(c.type==='trf3p'&&N(c._unb,0)>5)warn.push('PRIMARY UNBALANCE '+c._unb.toFixed(1)+'%');
  c._warn=warn.join(' · ');c._alarm=warn.length>0;
  if(last&&!c.tripped){const trip=w=>{c.tripped=true;c._cause=w;log(`⚠ ${c.label} TRIPPED: ${w}`);};
    if(c._temp>N(c.tTrip,D.tTr))trip('OVER-TEMPERATURE');
    else if(vpu>1.3)trip('OVER-EXCITATION (V/Hz)');
    else if(lf>3)trip('SEVERE OVERLOAD');}
  /* outputs */
  c._vp=Vp;c._vpu=vpu;c._vSec=vs;c._iSec=c.type==='trf3p'?(Ip[0]+Ip[1]+Ip[2])/3:I;c._sSec=Sx;c._pSec=P;c._pfSec=pf;
  c._eff=P>1?P/(P+Pcu+Pfe)*100:0;c._reg=dV*100;c._lf=lf;c.loading=lf*100;
  c._pcu=Pcu;c._pfe=Pfe;
  if(c.type==='trf3p'){const a=Ip[0],b=Ip[1],d=Ip[2];c._iN=Math.sqrt(Math.max(0,a*a+b*b+d*d-a*b-b*d-d*a));c._ia=Ip;}
  if(c.type==='transformerhv')c.ratio=+(Vpn/Math.max(1,Vsn)).toFixed(2);
  /* prospective fault level on the secondary */
  if(last&&window.FAULTLEVELS&&c._secOn){
    const fp=window.FAULTLEVELS[rp[0]],Zt=z*Vsn*Vsn/S0,Zs=fp?fp.Zth*Math.pow(Vsn/Vpn,2):0,vph=c.type==='trf3p'?vs/SQ3:vs,Isc=vph/Math.max(.001,Zt+Zs);
    for(const r of rs)window.FAULTLEVELS[r]={V:+vph.toFixed(0),Zth:+(Zt+Zs).toFixed(3),Isc:+Isc.toFixed(0)};}
}

/* the old HV transformer simply short-linked primary to secondary — remove that, the model below energises SEC_L/SEC_N itself */
LINKS.transformerhv=()=>[];

/* classification: HV isolation, tripped units dead, TRIP / ALM outputs */
{const _cl=classify;
classify=function(uf){
  const r=_cl(uf),m=r.m;
  const put=(root,ty)=>{const o=m.get(root);if(!o)m.set(root,ty);else if(o!==ty){const oP=PH.has(o),tP=PH.has(ty);if((oP&&tP)||(oP&&ty==='N')||(tP&&o==='N'))r.short=true;else r.bond=true;}};
  for(const c of comps){
    if(c.type==='transformerhv'){
      const x=m.get(R_(uf,c,'PRI_L')),y=m.get(R_(uf,c,'PRI_N'));
      const act=(PH.has(x)&&(y==='N'||(PH.has(y)&&x!==y)))||(PH.has(y)&&(x==='N'||(PH.has(x)&&x!==y)));
      c.active=act&&!c._cut;
      if(c.active){put(R_(uf,c,'SEC_L'),'L');put(R_(uf,c,'SEC_N'),'N');}
      for(const[t,f]of[['ALM',c._alarm],['TRIP',c.tripped]])if(f){const root=R_(uf,c,t);if(m.get(root)===undefined)m.set(root,'L');}
    }else if((c.type==='trf1p'||c.type==='trf3p')&&c._cut){
      for(const t of c.type==='trf1p'?['S_L','S_N']:['a','b','c','n'])m.delete(R_(uf,c,t));
      c.active=false;
    }
  }
  return r;};}
uxClick(c=>{if(XF[c.type]){if(c.tripped){pushUndo();c.tripped=false;c._cause='';c._temp=N(c.amb,25);log(`${c.label} protection reset`);renderProps();}return true;}return false;});

/* ═══════════ 5 · AC / DC BREAKERS ═══════════ */
for(const t of['acbreaker','dcbreaker']){const d=DEFS[t],ac=t==='acbreaker';if(!d)continue;
  d.w=110;d.h=170;
  d.term=ac?[['L_in',-55,-25,-1,0],['N_in',-55,25,-1,0],['L_out',55,-25,1,0],['N_out',55,25,1,0]]:[['+_in',-55,-25,-1,0],['-_in',-55,25,-1,0],['+_out',55,-25,1,0],['-_out',55,25,1,0]];
  d.term.push(['MX+',-20,-80,0,-1],['MX-',20,-80,0,-1],['AUX_C',-30,80,0,1],['AUX_NO',0,80,0,1],['AUX_NC',30,80,0,1]);
  Object.assign(d.pins=d.pins||{},{'MX+':'shunt-trip coil + (energise to trip)','MX-':'shunt-trip coil −',AUX_C:'auxiliary contact COM',AUX_NO:'aux NO — closed while the breaker is ON',AUX_NC:'aux NC — closed while OFF / tripped'});
  Object.assign(d.init,{curve:'C',icu:ac?6:10,coilV:ac?230:24,polarized:true,ops:0,trips:0,wear:0,heat:0,fault:'none',damaged:false,_I:0,_cause:'',_mt:0});
  if(!ac)d.init.volts=48;
}
COMP_BLURB.acbreaker='2-pole AC thermal-magnetic breaker. Measures the real current drawn downstream; trips on overload (inverse-time) and short circuit (B/C/D curve), checks its breaking capacity (Icu) against the prospective fault level, and can be tripped remotely through the shunt coil MX+/MX−. Using an AC breaker on a DC supply cannot interrupt the arc — the contacts weld. Aux contacts show the state.';
COMP_BLURB.dcbreaker='2-pole DC thermal-magnetic breaker with polarity marking. Wire + to +_in and − to −_in (reversed polarity defeats the arc blow-out). Same B/C/D curves (higher magnetic threshold on DC), shunt trip MX and aux contacts. Rated voltage must be at or above the DC bus voltage.';
LINKS.acbreaker=c=>c._noLink?[]:[...((c.closed&&!c.tripped)||c.fault==='welded'?[['L_in','L_out'],['N_in','N_out']]:[]),...(c.closed&&!c.tripped?[['AUX_C','AUX_NO']]:[['AUX_C','AUX_NC']])];
LINKS.dcbreaker=c=>c._noLink?[]:[...((c.closed&&!c.tripped)||c.fault==='welded'?[['+_in','+_out'],['-_in','-_out']]:[]),...(c.closed&&!c.tripped?[['AUX_C','AUX_NO']]:[['AUX_C','AUX_NC']])];

function brkTick(c,h,st,tbl){
  const ac=c.type==='acbreaker',T=ac?{li:'L_in',ni:'N_in',lo:'L_out'}:{li:'+_in',ni:'-_in',lo:'+_out'};
  const rIn=R_(st.uf,c,T.li),rNin=R_(st.uf,c,T.ni),vm=measureV(st,tbl,rIn,rNin),info=tbl.get(rIn);
  c._kind=info?info.k:null;c._vl=ac?vm.ac:Math.abs(vm.dc);
  c._rev=!ac&&info&&info.k==='dc'&&info.role==='n';
  const In=Math.max(.1,N(c.rating,16)),welded=c.fault==='welded';
  /* downstream current */
  let I=0;
  if((c.closed&&!c.tripped)||welded){
    c._noLink=true;let uf2;try{uf2=buildUF();}finally{c._noLink=false;}
    const t2=srcTable(uf2),out=R_(uf2,c,T.lo);
    const dcPath=c._kind==='dc'||(!ac&&c._kind!=='ac');   /* follow the REAL supply type, whatever the breaker is rated for */
    if(!dcPath){for(const l of collectAC(uf2,t2,{r:out,v:c._vl>1?c._vl:N(sim.volts,230)}))if(l.r===out)I+=l.I;}
    else for(const l of collectDC(uf2,t2))if(l.r===out)I+=l.I;
  }
  c._I=N(c._I,0)+(Math.abs(I)-N(c._I,0))*Math.min(1,h*8);
  const ratio=c._I/In;
  const onTrip=(why)=>{
    c.tripped=true;c.closed=false;c._cause=why;c.ops=N(c.ops,0)+1;c.trips=N(c.trips,0)+1;c.heat=0;
    let bad='';
    if(ac&&c._kind==='dc'&&c._I>.5)bad='AC breaker cannot interrupt a DC arc';
    const fl=window.FAULTLEVELS&&window.FAULTLEVELS[rIn];
    if(!bad&&fl&&/SHORT/.test(why)&&fl.Isc>N(c.icu,6)*1000)bad=`prospective ${fl.Isc} A exceeds Icu ${c.icu} kA`;
    c.wear=Math.min(100,N(c.wear,0)+(/SHORT/.test(why)?4:1.5));
    if(bad){c.fault='welded';c.damaged=true;c._dmg=bad;log(`⛔ ${c.label} FAILED TO CLEAR: ${bad} — contacts welded`);}
    log(`⚠ ${c.label} tripped: ${why}`);};
  if(c.tripped&&!c._wasT){if(!c._cause||c._cause==='')c._cause=sim.short?'SHORT CIRCUIT':'TRIPPED';
    if(c.closed){c.closed=false;}c.ops=N(c.ops,0)+1;c.trips=N(c.trips,0)+1;
    const fl=window.FAULTLEVELS&&window.FAULTLEVELS[rIn];
    if(fl&&sim.short&&fl.Isc>N(c.icu,6)*1000){c.fault='welded';c.damaged=true;c._dmg=`prospective ${fl.Isc} A exceeds Icu ${c.icu} kA`;}}
  c._wasT=!!c.tripped;if(!c.tripped)c._cause=c._cause&&c.closed?'':c._cause;
  if(c.closed&&!c.tripped){
    const mag={B:4,C:7.5,D:14}[c.curve]||7.5,thr=mag*In*(ac?1:1.4);
    if(ratio>1.05)c.heat+=h*(ratio*ratio-1)/24;else c.heat=Math.max(0,c.heat-h*.05);
    if(c.heat>=1)onTrip(`OVERLOAD ${(ratio*100).toFixed(0)}% (thermal)`);
    else if(c._I>=thr){c._mt+=h;if(c._mt>=.02)onTrip(`SHORT-CIRCUIT ${c._I.toFixed(0)} A (magnetic ${c.curve})`);}else c._mt=0;
    if(!c.tripped&&live(st,c,'MX+','MX-'))onTrip('SHUNT TRIP (MX coil)');
  }else{c.heat=Math.max(0,N(c.heat,0)-h*.1);c._mt=0;}
  /* installation warnings */
  const w=[];
  if(welded)w.push('CONTACTS WELDED — replace');
  if(ac&&c._kind==='dc')w.push('AC BREAKER ON DC SUPPLY');
  if(!ac&&c._rev&&c.polarized!==false)w.push('REVERSED POLARITY');
  if(c._vl>N(c.volts,ac?230:48)*1.15)w.push('SUPPLY ABOVE RATED VOLTAGE');
  if(ratio>1.05&&c.closed&&!c.tripped)w.push('OVERLOAD '+(ratio*100).toFixed(0)+'%');
  if(N(c.wear,0)>80)w.push('CONTACT WEAR '+c.wear.toFixed(0)+'%');
  c._warn=w.join(' · ');
}
uxClick(c=>{if(c.type!=='acbreaker'&&c.type!=='dcbreaker')return false;
  if(c.fault==='welded'){log(`${c.label}: contacts welded — use "Replace breaker" in Properties`);return true;}
  pushUndo();
  if(c.tripped){c.tripped=false;c.closed=false;c.heat=0;log(`${c.label} reset (handle OFF) — switch ON to energise`);}
  else{c.closed=!c.closed;c.ops=N(c.ops,0)+1;log(`${c.label} ${c.closed?'closed':'opened'}`);}
  renderProps();return true;});

function hl(x,y,w,h,r){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(x,y,w,h,r);ctx.stroke();ctx.restore();}
function bar(x,y,w,h,f,col){rr(x,y,w,h,h/2);ctx.fillStyle='#050b12';ctx.fill();if(f>0){rr(x,y,Math.max(h,w*clamp(f,0,1)),h,h/2);ctx.fillStyle=col;ctx.fill();}}
function drawBrk(c){
  const ac=c.type==='acbreaker',on=c.closed&&!c.tripped,tr=c.tripped,wl=c.fault==='welded',In=Math.max(.1,N(c.rating,16));
  shadow(()=>{rr(-34,-56,68,112,6);ctx.fillStyle=GR(-34,0,34,0,[[0,'#c9d0d8'],[.12,'#f3f5f7'],[.88,'#e2e6ea'],[1,'#a3acb7']]);ctx.fill();});
  ctx.strokeStyle='#4a525c';ctx.lineWidth=1;ctx.stroke();
  if(isSel(c))hl(-37,-59,74,118,8);
  rr(-34,50,68,6,2);ctx.fillStyle='#2b313a';ctx.fill();
  /* terminal bars and screws */
  for(const[y,l]of[[-25,ac?'L':'+'],[25,ac?'N':'−']]){
    for(const x of[-1,1]){line([[x*55,y],[x*34,y]],'#b87333',3);rr(x<0?-40:30,y-6,10,12,2);ctx.fillStyle=GR(0,y-6,0,y+6,[[0,'#e8a56a'],[1,'#9a5a22']]);ctx.fill();screw(x*35,y,2);}
    T_(c,l,x0(),y-9,'#445',7,'center',800);
    if(on)line([[-30,y],[30,y]],'rgba(6,214,160,.85)',2);}
  function x0(){return 0;}
  /* rating strip */
  rr(-30,-52,60,16,2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#999';ctx.lineWidth=.6;ctx.stroke();
  T_(c,`${c.curve||'C'}${In}  2P`,0,-47,'#111',8,'center',800);T_(c,ac?`${N(c.volts,230)}V~ ${N(c.icu,6)}kA`:`${N(c.volts,48)}V⎓ ${N(c.icu,10)}kA`,0,-39,'#333',5.5,'center',700);
  /* handle */
  rr(-12,-30,24,52,4);ctx.fillStyle='#12161b';ctx.fill();
  const hy=on?-28:tr?-10:0;
  rr(-9,hy,18,24,3);ctx.fillStyle=GR(-9,0,9,0,[[0,'#20252c'],[.5,'#4a525e'],[1,'#1a1e24']]);ctx.fill();
  for(let i=0;i<3;i++)line([[-6,hy+5+i*5],[6,hy+5+i*5]],'#0c0f12',1);
  rr(-9,on?hy+18:hy,18,6,2);ctx.fillStyle=wl?'#7f1d1d':on?'#e0242a':tr?'#ff9f1c':'#1bb76e';ctx.fill();
  /* meters */
  const ratio=c._I/In;bar(-28,26,56,5,ratio,ratio>1?COL.bad:ratio>.8?COL.warn:COL.ok);
  bar(-28,34,56,3,clamp(N(c.heat,0),0,1),N(c.heat,0)>.7?COL.bad:'#f59e0b');
  T_(c,`${c._I.toFixed(1)} A`,0,43,'#223',7.5,'center',800);
  T_(c,wl?'WELDED':tr?'TRIP':on?'ON':'OFF',0,51,wl?'#b91c1c':tr?'#c2410c':on?'#b91c1c':'#15803d',6.5,'center',800);
  /* MX coil + aux dots */
  led(0,-68,'#c084fc',live(sim.st||{uf:{find:()=>0},cl:{m:new Map()}},c,'MX+','MX-')&&!!sim.st);
  led(0,68,on?'#22c55e':'#475569',true);
  T_(c,c.label+(c._warn?' ⚠':''),0,-92,c._warn?COL.warn:COL.text,9,'center',800);
  if(c._kind==='dc'&&ac||wl){ctx.save();ctx.translate(0,0);ctx.rotate(-.5);ctx.font='800 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(220,38,38,.85)';ctx.fillText(wl?'DAMAGED':'AC ON DC!',0,4);ctx.restore();}
  if(!ac&&c._rev){ctx.font='800 8px sans-serif';ctx.textAlign='center';ctx.fillStyle='#dc2626';ctx.fillText('REV POL',0,18);}
}
DRAW.acbreaker=drawBrk;DRAW.dcbreaker=drawBrk;

/* ═══════════ 6 · AC / DC  V·A·W  METERS ═══════════ */
for(const t of['acvawmeter','dcvawmeter']){const d=DEFS[t],ac=t==='acvawmeter';if(!d)continue;
  d.w=130;d.h=120;
  d.term=ac?[['L_in',-65,-25,-1,0],['N_in',-65,25,-1,0],['L_out',65,-25,1,0],['N_out',65,25,1,0]]:[['+_in',-65,-25,-1,0],['-_in',-65,25,-1,0],['+_out',65,-25,1,0],['-_out',65,25,1,0]];
  d.term.push(['ALM_C',-20,60,0,1],['ALM_NO',20,60,0,1]);
  d.pins=Object.assign(d.pins||{},{ALM_C:'alarm contact COM',ALM_NO:'alarm contact NO — closes on over/under-voltage or over-current'});
  Object.assign(d.init,ac?{page:0,vHi:253,vLo:207,iHi:16,alarmOn:true,_kwh:0,_kvah:0,_vmin:0,_vmax:0,_imax:0}:{page:0,vHi:60,vLo:0,iHi:20,alarmOn:true,shuntA:100,_kwh:0,_ah:0,_vmin:0,_vmax:0,_imax:0});
}
LINKS.acvawmeter=c=>c._noLink?[]:[['L_in','L_out'],['N_in','N_out'],...(c._alm?[['ALM_C','ALM_NO']]:[])];
LINKS.dcvawmeter=c=>c._noLink?[]:[['+_in','+_out'],['-_in','-_out'],...(c._alm?[['ALM_C','ALM_NO']]:[])];
COMP_BLURB.acvawmeter='Series AC meter: L_in/N_in from the source, L_out/N_out to the load. Reads true net voltage, the real downstream current, W, VA, var, PF, frequency, kWh/kVAh, min/max, with an adjustable alarm contact (ALM_C/ALM_NO). Click the meter to change page.';
COMP_BLURB.dcvawmeter='Series DC meter: +_in/−_in from the source or BMS, +_out/−_out to the load or inverter. Reads signed voltage (polarity), signed current (negative = charging), W, Ah, kWh, min/max, shunt range and an alarm contact. Click the meter to change page.';

function meterTick(m,h,st,tbl){
  const ac=m.type==='acvawmeter',T=ac?{li:'L_in',ni:'N_in',lo:'L_out'}:{li:'+_in',ni:'-_in',lo:'+_out'};
  const rin=R_(st.uf,m,T.li),rni=R_(st.uf,m,T.ni),vm=measureV(st,tbl,rin,rni),info=tbl.get(rin);
  let V=ac?vm.ac:vm.dc;
  m._noLink=true;let uf2;try{uf2=buildUF();}finally{m._noLink=false;}
  const t2=srcTable(uf2),out=R_(uf2,m,T.lo);let I=0,P=0,S=0;
  if(ac){for(const l of collectAC(uf2,t2,{r:out,v:V>1?V:N(sim.volts,230)}))if(l.r===out){I+=l.I;P+=l.P;S+=l.S;}}
  else{for(const l of collectDC(uf2,t2))if(l.r===out)I+=l.I;P=V*I;}
  const live44=Math.abs(V)>.5&&!st.cl.short;
  if(!live44){I=0;P=0;S=0;}
  m._V=V;m._I=N(m._I,0)+(I-N(m._I,0))*Math.min(1,h*10);m._P=ac?P:V*m._I;m._S=ac?S:Math.abs(m._P);
  m._PF=ac&&S>1?clamp(P/S,0,1):1;m._Q=ac?Math.sqrt(Math.max(0,S*S-P*P)):0;m._f=ac&&info&&info.k==='ac'?info.f:0;
  m._live=live44;m._kind=info?info.k:null;
  if(h>0&&live44){const dt=h;
    if(ac){m._kwh=N(m._kwh,0)+Math.max(0,m._P)*dt/3.6e6;m._kvah=N(m._kvah,0)+m._S*dt/3.6e6;}
    else{m._kwh=N(m._kwh,0)+Math.max(0,m._P)*dt/3.6e6;m._ah=N(m._ah,0)+m._I*dt/3600;}
    m._vmin=m._vmin?Math.min(m._vmin,Math.abs(V)):Math.abs(V);m._vmax=Math.max(N(m._vmax,0),Math.abs(V));m._imax=Math.max(N(m._imax,0),Math.abs(m._I));}
  /* alarm contact */
  let al=false;const w=[];
  if(live44&&m.alarmOn!==false){
    if(Math.abs(V)>N(m.vHi,ac?253:60)){al=true;w.push('OVER-VOLTAGE');}
    if(Math.abs(V)<N(m.vLo,ac?207:0)&&Math.abs(V)>1){al=true;w.push('UNDER-VOLTAGE');}
    if(Math.abs(m._I)>N(m.iHi,ac?16:20)){al=true;w.push('OVER-CURRENT');}}
  if(!ac&&V<-.5)w.push('REVERSED POLARITY');
  if(!ac&&info&&info.k==='ac')w.push('AC PRESENT ON DC METER');
  if(ac&&info&&info.k==='dc')w.push('DC PRESENT ON AC METER');
  if(!ac&&Math.abs(m._I)>N(m.shuntA,100))w.push('OVER-RANGE');
  m._alm=al;m._warn=w.join(' · ');
  m.voltage=Math.abs(V);m.current=Math.abs(m._I);m.watts=Math.abs(m._P);m.kwh=m._kwh;if(ac){m.pf=m._PF;m.freq=m._f;}
}
uxClick(c=>{if(c.type!=='acvawmeter'&&c.type!=='dcvawmeter')return false;pushUndo();c.page=(N(c.page,0)+1)%3;renderProps();return true;});
function drawMeter(c){
  const ac=c.type==='acvawmeter',pg=N(c.page,0)%3,live44=!!c._live,acc=ac?'#38bdf8':'#2ec4b6',al=!!c._alm;
  shadow(()=>{rr(-52,-52,104,104,9);ctx.fillStyle=GR(0,-52,0,52,[[0,'#2f3b4b'],[1,'#121a25']]);ctx.fill();});
  rr(-52,-52,104,104,9);ctx.lineWidth=1.6;ctx.strokeStyle=al?COL.bad:live44?acc:COL.edge;ctx.stroke();
  if(isSel(c))hl(-55,-55,110,110,11);
  ctx.save();rr(-52,-52,104,104,9);ctx.clip();ctx.fillStyle=acc;ctx.fillRect(-52,-52,104,14);ctx.restore();
  T_(c,ac?'AC  V · A · W':'DC  V · A · W',-46,-45,'#04202a',7.5,'left',800);T_(c,c.label||'',46,-45,'#04202a',7.5,'right',800);
  for(const[x,y]of[[-65,-25],[-65,25],[65,-25],[65,25]])line([[x,y],[x*.8,y]],'#c98a4b',2.6);
  for(const x of[-1,1]){line([[x*52,-25],[x*65,-25]],'#c98a4b',2.6);line([[x*52,25],[x*65,25]],'#c98a4b',2.6);}
  rr(-46,-34,92,62,4);ctx.fillStyle=live44?'#0b2a22':'#08130f';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='#04070a';ctx.stroke();
  const g=live44?'#7df3d1':'#2c5a4a',g2=live44?'#4ade80':'#2c5a4a',f=(v,d)=>live44?v.toFixed(d):'--';
  const V=N(c._V,0),I=N(c._I,0);
  if(pg===0){
    T_(c,f(V,Math.abs(V)>=100?1:2),20,-14,g,17,'right',800);T_(c,'V',24,-8,'#5c9a7a',7,'left',800);
    T_(c,f(I,Math.abs(I)<10?2:1),20,4,g2,13,'right',800);T_(c,'A',24,7,'#5c9a7a',7,'left',800);
    const P=N(c._P,0);T_(c,live44?(Math.abs(P)>=1000?(P/1000).toFixed(2)+' k':P.toFixed(0)+' '):'--',20,17,'#fbbf24',11,'right',800);T_(c,'W',24,19,'#5c9a7a',7,'left',800);}
  else if(pg===1){
    if(ac){T_(c,'PF',-40,-16,'#5c9a7a',7,'left',800);T_(c,f(N(c._PF,1),2),24,-16,g,13,'right',800);
      T_(c,'Hz',-40,-1,'#5c9a7a',7,'left',800);T_(c,f(N(c._f,0),1),24,-1,g,13,'right',800);
      T_(c,'VA',-40,14,'#5c9a7a',7,'left',800);T_(c,f(N(c._S,0),0),24,14,'#fbbf24',11,'right',800);}
    else{T_(c,'Ah',-40,-16,'#5c9a7a',7,'left',800);T_(c,N(c._ah,0).toFixed(3),24,-16,g,12,'right',800);
      T_(c,'kWh',-40,-1,'#5c9a7a',7,'left',800);T_(c,N(c._kwh,0).toFixed(4),24,-1,g,12,'right',800);
      T_(c,I<-.05?'CHARGING':I>.05?'DISCHARGE':'IDLE',24,14,'#fbbf24',9,'right',800);}}
  else{
    T_(c,ac?'kWh':'Vmin',-40,-16,'#5c9a7a',7,'left',800);T_(c,ac?N(c._kwh,0).toFixed(4):N(c._vmin,0).toFixed(1),24,-16,g,12,'right',800);
    T_(c,ac?'kVAh':'Vmax',-40,-1,'#5c9a7a',7,'left',800);T_(c,ac?N(c._kvah,0).toFixed(3):N(c._vmax,0).toFixed(1),24,-1,g,12,'right',800);
    T_(c,'Imax',-40,14,'#5c9a7a',7,'left',800);T_(c,N(c._imax,0).toFixed(2),24,14,'#fbbf24',11,'right',800);}
  /* direction arrow / status */
  if(live44&&Math.abs(I)>.02){const d=I>0?1:-1;ctx.fillStyle='#7df3d1';ctx.beginPath();ctx.moveTo(-38*d*-1,-30);ctx.lineTo(-38*d*-1+7*d,-27);ctx.lineTo(-38*d*-1,-24);ctx.closePath();ctx.fill();}
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-6+i*6,30,1.8,0,TAU);ctx.fillStyle=i===pg?acc:'#33475b';ctx.fill();}
  led(40,30,al?'#ef4444':'#334155',al);
  T_(c,live44?(c._warn||'LIVE'):'NO SUPPLY',-6,40,c._warn?COL.warn:live44?COL.ok:COL.mut,6.5,'center',800);
}
DRAW.acvawmeter=drawMeter;DRAW.dcvawmeter=drawMeter;

/* ═══════════ 7 · MULTIMETER ═══════════ */
{const d=DEFS.multimeter;if(d){Object.assign(d.init,{mode:'auto',hold:false,sound:true,maxV:1000,_rd:'0.000',_u:'V',_sub:''});}}
COMP_BLURB.multimeter='Digital multimeter. Wire V1 (red) and COM (black) to the two points. Functions (click it or use Properties): AUTO (detects AC or DC), V AC, V DC, Ohms, Continuity with beeper, Diode test. Resistance and continuity need the circuit de-energised — the meter shows LIVE if voltage is present.';
const MM_MODES=['auto','VAC','VDC','OHM','CONT','DIODE'];
const MM_LBL={auto:'AUTO V',VAC:'V AC',VDC:'V DC',OHM:'OHMS Ω',CONT:'CONT',DIODE:'DIODE'};
let AC_=null,osc=null,gn=null,beepState=false;
window.addEventListener('pointerdown',()=>{try{if(!AC_){AC_=new(window.AudioContext||window.webkitAudioContext)();osc=AC_.createOscillator();gn=AC_.createGain();osc.type='square';osc.frequency.value=2200;gn.gain.value=0;osc.connect(gn);gn.connect(AC_.destination);osc.start();}if(AC_.state==='suspended')AC_.resume();}catch(e){}},{once:false});
function setBeep(on){if(on===beepState)return;beepState=on;try{if(gn)gn.gain.setTargetAtTime(on?.035:0,AC_.currentTime,.01);}catch(e){}}
function mmTick(c,h,st,tbl){
  const mode=c.mode||'auto',wired=wiredT(c,'V1')&&wiredT(c,'COM'),ra=R_(st.uf,c,'V1'),rb=R_(st.uf,c,'COM');
  const vm=wired?measureV(st,tbl,ra,rb):{ac:0,dc:0,f:0},liveV=Math.max(vm.ac,Math.abs(vm.dc)),maxV=N(c.maxV,1000);
  let rd='',u='',sub='',beep=false;
  if(mode==='auto'||mode==='VAC'||mode==='VDC'){
    const kind=mode==='VAC'?'ac':mode==='VDC'?'dc':(vm.ac>.5&&vm.ac>=Math.abs(vm.dc)?'ac':'dc'),v=kind==='ac'?vm.ac:vm.dc;
    rd=Math.abs(v)>maxV?'OL':fmtV(v);u=kind==='ac'?'V AC':'V DC';
    sub=kind==='ac'?(vm.f&&vm.ac>1?vm.f.toFixed(1)+' Hz':''):(v<-.05?'REVERSED':mode==='auto'?'':'');
    if(!wired)sub='probes not connected';c._v=v;
  }else if(liveV>5){rd='LIVE';sub=liveV.toFixed(0)+' V present — power off';}
  else if(!wired)rd='OL';
  else{
    const g=ohmGraph(st);
    if(mode==='DIODE'){
      const r=ra===rb?{c:0,nd:0,vf:0}:shortest(g,ra,rb,true);
      if(r&&r.nd>0){rd=r.vf.toFixed(3);u='V';sub='forward';}else if(r&&r.c<30){rd='0.000';u='V';sub='short';beep=true;}else rd='OL';
    }else{
      const r=ra===rb?{c:0}:shortest(g,ra,rb,false),Rv=r?r.c+.2:Infinity;
      if(!FIN(Rv)||Rv>1e8)rd='OL';else{const f=fmtR(Rv);rd=f[0];u=f[1];}
      if(mode==='CONT'){beep=FIN(Rv)&&Rv<30;sub=beep?'CONTINUITY':'open';}
    }
  }
  if(!c.hold){c._rd=rd;c._u=u;c._sub=sub;c._beep=beep;}
  c._live=liveV;
}
uxClick(c=>{if(c.type!=='multimeter')return false;pushUndo();c.mode=MM_MODES[(MM_MODES.indexOf(c.mode||'auto')+1)%MM_MODES.length];log(`${c.label}: ${MM_LBL[c.mode]}`);renderProps();return true;});
DRAW.multimeter=function(c){
  const mode=c.mode||'auto',bp=!!c._beep&&c.sound!==false&&sim.running&&Math.sin((window.ANIM||0)*0)>=0;
  shadow(()=>{rr(-46,-74,92,148,14);ctx.fillStyle=GR(0,-74,0,74,[[0,'#fbd34d'],[1,'#c98a0a']]);ctx.fill();});
  rr(-46,-74,92,148,14);ctx.lineWidth=1.5;ctx.strokeStyle='#6b4a05';ctx.stroke();
  if(isSel(c))hl(-49,-77,98,154,16);
  rr(-38,-66,76,46,5);ctx.fillStyle=c._beep?'#1d3a12':'#10201a';ctx.fill();ctx.strokeStyle='#050a08';ctx.lineWidth=2;ctx.stroke();
  const bad=c._rd==='OL'||c._rd==='LIVE';
  T_(c,MM_LBL[mode],-34,-60,'#5c9a7a',6.5,'left',800);if(c.hold)T_(c,'HOLD',34,-60,'#fbbf24',6.5,'right',800);if(bp)T_(c,'♪',34,-42,'#9be8b8',10,'right',800);
  T_(c,c._rd||'0.000',30,-45,bad?'#fbbf24':'#9be8b8',c._rd&&c._rd.length>7?13:17,'right',800);
  T_(c,c._u||'',34,-29,'#5c9a7a',7,'left',800);T_(c,c._sub||'',-34,-27,'#5c9a7a',6,'left',700);
  ctx.beginPath();ctx.arc(0,6,24,0,TAU);ctx.fillStyle=GR(-20,-14,20,26,[[0,'#3a3f46'],[1,'#14171b']]);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();
  const lab=['AUTO','V~','V=','Ω','))','▷|'];
  MM_MODES.forEach((m,i)=>{const a=-Math.PI*.9+i*Math.PI*1.8/5,x=Math.cos(a)*34,y=6+Math.sin(a)*34;T_(c,lab[i],x,y,m===mode?'#7c2d12':'#4a3203',6,'center',m===mode?900:700);});
  const a=-Math.PI*.9+Math.max(0,MM_MODES.indexOf(mode))*Math.PI*1.8/5;line([[0,6],[Math.cos(a)*19,6+Math.sin(a)*19]],'#fbbf24',3);ctx.beginPath();ctx.arc(0,6,4,0,TAU);ctx.fillStyle='#fbbf24';ctx.fill();
  for(const[x,col,l]of[[-28,'#dc2626','V/Ω'],[28,'#111827','COM']]){ctx.beginPath();ctx.arc(x,64,7,0,TAU);ctx.fillStyle='#0b0d10';ctx.fill();ctx.strokeStyle='#374151';ctx.stroke();ctx.beginPath();ctx.arc(x,64,3.4,0,TAU);ctx.fillStyle=col;ctx.fill();T_(c,l,x,50,'#4a3203',6.5,'center',800);}
  T_(c,c.label||'DMM',0,-84,COL.text,9,'center',800);
};

/* ═══════════ 8 · MAIN TICK (after every other module, ~20 Hz) ═══════════ */
let ACC=0;
function tick44(dt){
  const st=sim.st;if(!st||!st.uf||!st.cl)return;
  ACC+=Math.max(0,dt);if(dt>0&&ACC<.05)return;
  const h=ACC;ACC=0;
  const tbl=srcTable(st.uf),xfs=comps.filter(c=>XF[c.type]);
  for(let pass=0;pass<2&&xfs.length;pass++){const loads=collectAC(st.uf,tbl);for(const c of xfs)xfStep(c,h,st,tbl,loads,pass===1);}
  const tbl2=xfs.length?srcTable(st.uf):tbl;
  let beep=false,anyOhm=false;
  for(const c of comps){
    if(c.type==='acbreaker'||c.type==='dcbreaker')brkTick(c,h,st,tbl2);
    else if(c.type==='acvawmeter'||c.type==='dcvawmeter')meterTick(c,h,st,tbl2);
    else if(c.type==='multimeter'){mmTick(c,h,st,tbl2);if(c._beep&&c.sound!==false)beep=true;}
  }
  setBeep(beep&&sim.running);
}
{const _s=step;step=function(dt){_s(dt);try{tick44(dt);}catch(e){if(!window._v45e){window._v45e=1;console.warn('v45 tick',e);}}
  if(Array.isArray(sim.alarms))for(const c of comps){
    if(XF[c.type]){if(c.tripped)sim.alarms.push(['bad',`${c.label} TRIPPED — ${c._cause||''}`]);else if(c._warn)sim.alarms.push(['warn',`${c.label}: ${c._warn}`]);}
    else if((c.type==='acbreaker'||c.type==='dcbreaker')&&c._warn)sim.alarms.push([c.fault==='welded'||/ON DC|REVERSED/.test(c._warn)?'bad':'warn',`${c.label}: ${c._warn}`]);
    else if((c.type==='acvawmeter'||c.type==='dcvawmeter')&&c._alm)sim.alarms.push(['warn',`${c.label}: ${c._warn}`]);}
};}
Game.register('v45',{reset(){for(const c of comps){
  if(c.type==='acbreaker'||c.type==='dcbreaker'){c.fault='none';c.damaged=false;c._I=0;c._cause='';c._mt=0;c.heat=0;}
  if(c.type==='acvawmeter'||c.type==='dcvawmeter'){c._kwh=c._kvah=c._ah=0;c._vmin=c._vmax=c._imax=0;c._alm=false;}
  if(XF[c.type]){c.tripped=false;c._cause='';c._temp=N(c.amb,25);c._tE=0;c._secOn=false;c._vSec=0;c._iPri=0;}
  if(c.type==='transformerhv')c._tapT=0;}setBeep(false);}});

/* ═══════════ 9 · PROPERTIES · DESCRIPTIONS · ACTIONS ═══════════ */
const rmF=(el,k)=>{const n=el.querySelector(`[data-k="${k}"]`);if(n){const f=n.closest('.f');(f||n).remove();}};
const kp=(a,b)=>`<div class="kpi"><b>${a}</b><span>${b}</span></div>`;
const btn=(l,fn,cls)=>`<button data-act="f44" data-fn="${fn}"${cls?` class="${cls}"`:''}>${l}</button>`;
const hd=(t,col)=>`<div class="note" style="margin-top:8px;color:${col||'var(--accent)'};font-weight:800">${t}</div>`;
uxProps(c=>{
  if(!c)return;const el=$('props');if(!el)return;
  switch(c.type){
    case'source':case'source3':{const i=el.querySelector('[data-k="volts"]');if(i){i.max=33000;i.min=1;}break;}
    case'multimeter':
      el.insertAdjacentHTML('beforeend',fld('Function',sI('mode',c.mode||'auto',MM_MODES.map(m=>[m,{auto:'Auto V (AC/DC)',VAC:'Volts AC',VDC:'Volts DC',OHM:'Resistance Ω',CONT:'Continuity + beep',DIODE:'Diode test'}[m]])))+fld('Hold reading',cI('hold',c.hold))+fld('Beeper',cI('sound',c.sound!==false))+fld('Max input (V)',nI('maxV',c.maxV,50,1000,50))+
        `<div class="note">Click the meter to step through the functions. V1 = red probe, COM = black. Ω / continuity / diode need the circuit switched off.</div>`);break;
    case'acvawmeter':case'dcvawmeter':{const ac=c.type==='acvawmeter';
      el.querySelectorAll('.kpis,.note').forEach(n=>n.remove());
      el.insertAdjacentHTML('beforeend',`<div class="kpis">${kp('Voltage',N(c._V,0).toFixed(1)+' V')}${kp('Current',N(c._I,0).toFixed(2)+' A')}${kp('Power',N(c._P,0).toFixed(0)+' W')}${kp('Energy',N(c._kwh,0).toFixed(4)+' kWh')}</div>`+
        fld('Alarm contact enabled',cI('alarmOn',c.alarmOn!==false))+fld('High voltage (V)',nI('vHi',c.vHi,1,40000,1))+fld('Low voltage (V)',nI('vLo',c.vLo,0,40000,1))+fld('High current (A)',nI('iHi',c.iHi,.1,2000,.1))+(ac?'':fld('Shunt range (A)',nI('shuntA',c.shuntA,5,2000,5)))+
        `<div class="row">${btn('Next page','mPage')}${btn('Reset energy / min-max','mReset')}</div><div class="note">${ac?'Series AC meter: L_in/N_in from the source, L_out/N_out to the load.':'Series DC meter: +_in/−_in from the source, +_out/−_out to the load. Negative current = charging.'} ALM_C–ALM_NO closes on an alarm.</div>`);break;}
    case'acbreaker':case'dcbreaker':{const ac=c.type==='acbreaker';
      el.insertAdjacentHTML('beforeend',hd('THERMAL-MAGNETIC MODEL')+`<div class="kpis">${kp('Current',N(c._I,0).toFixed(1)+' A')}${kp('Thermal',(clamp(N(c.heat,0),0,1)*100).toFixed(0)+' %')}${kp('Operations',N(c.ops,0))}${kp('Contact wear',N(c.wear,0).toFixed(0)+' %')}</div>`+
        fld('Trip curve',sI('curve',c.curve||'C',[['B','B (3–5×In)'],['C','C (5–10×In)'],['D','D (10–20×In)']]))+fld('Breaking capacity Icu (kA)',nI('icu',c.icu,1,100,1))+fld('Shunt coil voltage (V)',nI('coilV',c.coilV,12,400,1))+(ac?'':fld('Polarity-sensitive',cI('polarized',c.polarized!==false)))+
        `<div class="note">${c.tripped?'<b>TRIPPED</b> — '+esc(c._cause||''):c.fault==='welded'?'<b style="color:#ef476f">WELDED</b> — '+esc(c._dmg||''):'Supply: '+(c._kind==='dc'?'DC':c._kind==='ac'?'AC':'none')+' '+N(c._vl,0).toFixed(0)+' V'}${c._warn?'<br>⚠ '+esc(c._warn):''}</div>`+
        `<div class="row">${btn('Test trip','bTest')}${btn('Replace breaker','bFix')}</div>`);break;}
    case'trf1p':case'trf3p':case'transformerhv':{const hv=c.type==='transformerhv',t3=c.type==='trf3p',D=DFL[c.type];
      el.insertAdjacentHTML('beforeend',hd('TRANSFORMER MODEL')+`<div class="kpis">${kp('Primary',hv?N(c._vp,0).toFixed(0)+' V':N(c._vp,0).toFixed(1)+' V')}${kp('Secondary',N(c._vSec,0).toFixed(1)+' V')}${kp('Load',N(c.loading,0).toFixed(0)+' %')}${kp('Winding',N(c._temp,25).toFixed(0)+' °C')}${kp('I pri',N(c._iPri,0).toFixed(2)+' A')}${kp('I sec',N(c._iSec,0).toFixed(2)+' A')}${kp('Efficiency',N(c._eff,0).toFixed(1)+' %')}${kp('Regulation',N(c._reg,0).toFixed(1)+' %')}</div>`+
        fld('In service',cI('on',c.on!==false))+
        (hv?'':fld('Primary rated (V)',sI('priV',String(N(c.priV,400)),t3?[['400','400'],['690','690'],['11000','11 000'],['33000','33 000']]:[['400','400'],['230','230'],['110','110'],['690','690']])))+
        (t3?fld('Secondary rated LL (V)',sI('secV',String(N(c.secV,400)),[['400','400 (230 ph)'],['230','230'],['690','690']])):'')+
        fld('Impedance %Z',nI('zPct',N(c.zPct,D.z),1,15,.1))+fld('X/R ratio',nI('xr',N(c.xr,D.xr),.5,30,.5))+fld('No-load current (%)',nI('i0Pct',N(c.i0Pct,D.i0),.1,10,.1))+fld('Iron loss (% rated)',nI('pfePct',N(c.pfePct,D.pfe),.05,2,.05))+fld('Inrush (× rated)',nI('inrush',N(c.inrush,D.inr),1,15,.5))+fld('Ambient (°C)',nI('amb',N(c.amb,D.amb),-20,55,1))+
        (hv?fld('Vector group',sI('vgroup',c.vgroup||'Dyn11',[['Dyn11','Dyn11'],['YNyn0','YNyn0'],['YNd1','YNd1'],['Dyn5','Dyn5']]))+fld('Tap changer',sI('tapMode',c.tapMode||'auto',[['auto','AUTO (voltage control)'],['manual','Manual']]))+fld('Voltage set-point (%)',nI('vSetPct',c.vSetPct,90,110,.5))+fld('Fans start at (°C)',nI('fanOn',c.fanOn,40,100,1)):'')+
        fld('Tap (steps)',nI('tap',N(c.tap,0),hv?-8:-4,hv?8:4,1))+
        `<div class="note">Ratio ${(XF[c.type].vp(c)/XF[c.type].vs(c)).toFixed(2)} : 1 · tap ${(N(c.tap,0)*(hv?1.25:2.5)).toFixed(2)} % · ${c._secOn?'<b style="color:#06d6a0">ENERGISED</b>':c.tripped?'<b style="color:#ef476f">TRIPPED</b>':'secondary dead'}${t3?` · neutral ${N(c._iN,0).toFixed(1)} A · unbalance ${N(c._unb,0).toFixed(1)} %`:''}${hv?` · fans ${c._fans?'ON':'off'}`:''}${c._warn?'<br>⚠ '+esc(c._warn):''}</div><div class="row">${btn('Reset protection','xReset')}</div>`);
      el.querySelectorAll('.note').forEach(n=>{if(/^Loading .*(ENERGISED|primary not live)/.test(n.textContent.trim()))n.remove();});break;}
  }
});
const ACT={
  mPage:c=>{c.page=(N(c.page,0)+1)%3;},
  mReset:c=>{c._kwh=c._kvah=c._ah=0;c.kwh=0;c._vmin=c._vmax=c._imax=0;},
  bTest:c=>{if(c.closed&&!c.tripped){c.tripped=true;c.closed=false;c._cause='TEST TRIP';c._wasT=true;c.ops=N(c.ops,0)+1;c.trips=N(c.trips,0)+1;log(`${c.label} test trip`);}},
  bFix:c=>{c.fault='none';c.damaged=false;c.wear=0;c.heat=0;c._cause='';c._dmg='';c.tripped=false;c.closed=false;c._I=0;log(`${c.label} replaced (OFF)`);},
  xReset:c=>{c.tripped=false;c._cause='';c._temp=N(c.amb,25);}
};
$('props').addEventListener('click',e=>{const t=e.target;if(!t.dataset||t.dataset.act!=='f44')return;const o=selObj(),f=ACT[t.dataset.fn];if(!o||!f)return;pushUndo();f(o);renderProps();});

uxDesc(c=>{
  if(c.type==='acvawmeter'||c.type==='dcvawmeter'){const ac=c.type==='acvawmeter';
    return{set:`${c._live?'LIVE':'no supply'} · ${c._kind||'—'}\nV: ${N(c._V,0).toFixed(2)} V${ac?` · ${N(c._f,0).toFixed(1)} Hz`:''}\nI: ${N(c._I,0).toFixed(3)} A\nP: ${N(c._P,0).toFixed(1)} W${ac?` · S ${N(c._S,0).toFixed(0)} VA · Q ${N(c._Q,0).toFixed(0)} var · PF ${N(c._PF,1).toFixed(2)}`:''}\n${ac?`kWh ${N(c._kwh,0).toFixed(4)} · kVAh ${N(c._kvah,0).toFixed(3)}`:`Ah ${N(c._ah,0).toFixed(3)} · kWh ${N(c._kwh,0).toFixed(4)}`}\nmin/max V: ${N(c._vmin,0).toFixed(1)} / ${N(c._vmax,0).toFixed(1)}\nAlarm: ${c._alm?'ACTIVE':'off'}${c._warn?'\n⚠ '+c._warn:''}`};}
  if(c.type==='acbreaker'||c.type==='dcbreaker')return{set:`State: ${c.fault==='welded'?'WELDED':c.tripped?'TRIPPED':c.closed?'ON':'OFF'}${c._cause?' — '+c._cause:''}\nCurrent: ${N(c._I,0).toFixed(2)} A of ${N(c.rating,16)} A (${c.curve||'C'})\nThermal: ${(clamp(N(c.heat,0),0,1)*100).toFixed(0)} %\nSupply: ${c._kind||'none'} ${N(c._vl,0).toFixed(0)} V (rated ${N(c.volts,230)} V)\nIcu ${N(c.icu,6)} kA · ops ${N(c.ops,0)} · wear ${N(c.wear,0).toFixed(0)} %${c._warn?'\n⚠ '+c._warn:''}`};
  if(XF[c.type]){const hv=c.type==='transformerhv';
    return{set:`${c.tripped?'TRIPPED — '+(c._cause||''):c._secOn?'ENERGISED':c.on===false?'out of service':'secondary dead'}\nPrimary: ${N(c._vp,0).toFixed(hv?0:1)} V (${(N(c._vpu,0)*100).toFixed(0)} % of rated)\nSecondary: ${N(c._vSec,0).toFixed(1)} V · ${N(c._iSec,0).toFixed(2)} A\nPrimary current: ${N(c._iPri,0).toFixed(2)} A\nLoad: ${N(c.loading,0).toFixed(1)} % · PF ${N(c._pfSec,1).toFixed(2)}\nLosses: Cu ${N(c._pcu,0).toFixed(0)} W · Fe ${N(c._pfe,0).toFixed(0)} W · η ${N(c._eff,0).toFixed(1)} %\nRegulation: ${N(c._reg,0).toFixed(2)} % · tap ${N(c.tap,0)}\nWinding: ${N(c._temp,25).toFixed(0)} °C${c.type==='trf3p'?`\nNeutral: ${N(c._iN,0).toFixed(1)} A · unbalance ${N(c._unb,0).toFixed(1)} %`:''}${hv?`\nGroup ${c.vgroup||'Dyn11'} · fans ${c._fans?'ON':'off'}`:''}${c._warn?'\n⚠ '+c._warn:''}`};}
  return'';});
/* multimeter's own def2 description wraps the base chain, so it must be intercepted outermost */
{const _d=describe;describe=function(c){
  if(c.type==='multimeter')return`Function: ${MM_LBL[c.mode||'auto']}\nReading: ${c._rd||'0.000'} ${c._u||''}\n${c._sub||''}\nProbe voltage: ${N(c._live,0).toFixed(1)} V${c.hold?'\nHOLD':''}`;
  return _d(c);};}

/* ═══════════ 10 · TRANSFORMER DRAWINGS ═══════════ */
function limbCoil(cx,y0,y1,hw,col,turns){
  rr(cx-hw,y0,hw*2,y1-y0,4);ctx.fillStyle=GR(cx-hw,0,cx+hw,0,[[0,hexMix(col,'#ffffff',.35)],[.5,col],[1,hexMix(col,'#000000',.5)]]);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1;ctx.stroke();
  for(let i=1;i<turns;i++){const y=y0+(y1-y0)*i/turns;line([[cx-hw,y],[cx+hw,y+1.5]],'rgba(0,0,0,.35)',1);}}
function flux(x0,y0,x1,y1,on,spd){if(!on)return;const t=(window.ANIM||0)*spd,w=x1-x0,h=y1-y0,per=2*(w+h);
  for(let k=0;k<6;k++){const d=(((t+k/6)%1)+1)%1*per;let x,y;
    if(d<w){x=x0+d;y=y0;}else if(d<w+h){x=x1;y=y0+d-w;}else if(d<2*w+h){x=x1-(d-w-h);y=y1;}else{x=x0;y=y1-(d-2*w-h);}
    ctx.globalAlpha=.85;ctx.fillStyle='#7df3ff';ctx.beginPath();ctx.arc(x,y,2,0,TAU);ctx.fill();}ctx.globalAlpha=1;}
const xState=c=>c.tripped?['TRIPPED',COL.bad]:c._secOn?[`${N(c._vSec,0).toFixed(c.type==='transformerhv'?0:1)} V`,COL.ok]:['DEAD',COL.mut];
function drawT1(c){
  const on=!!c._secOn,col=c.tripped?COL.bad:c._alarm?COL.warn:on?COL.ok:COL.edge,s=xState(c);
  shadow(()=>{rr(-54,-46,108,92,8);ctx.fillStyle=GR(0,-46,0,46,[[0,'#2e3a49'],[1,'#141c27']]);ctx.fill();});
  rr(-54,-46,108,92,8);ctx.lineWidth=1.6;ctx.strokeStyle=col;ctx.stroke();if(isSel(c))hl(-57,-49,114,98,10);
  for(const y of[-20,20]){line([[-65,y],[-54,y]],'#b87333',3);line([[54,y],[65,y]],on?'#b87333':'#6b5a48',3);}
  ctx.lineWidth=10;ctx.strokeStyle='#6c7a8b';ctx.lineJoin='miter';ctx.strokeRect(-26,-24,52,46);
  limbCoil(-26,-18,16,11,'#c27a3a',9);limbCoil(26,-18,16,11,on?'#d8dee6':'#8f98a3',9);flux(-26,-24,26,22,on,.5);
  T_(c,`${N(c.kva,2)} kVA · ${N(c.priV,400)}/${N(c.secV,230)} V`,0,-37,'#cfe3f5',7,'center',800);
  T_(c,'PRI',-40,-4,'#d9a066',6,'center',800);T_(c,'SEC',40,-4,'#cfd8e1',6,'center',800);
  bar(-40,28,80,5,N(c.loading,0)/100,N(c.loading,0)>100?COL.bad:N(c.loading,0)>80?COL.warn:COL.ok);
  T_(c,`${s[0]} · ${N(c.loading,0).toFixed(0)}% · ${N(c._temp,25).toFixed(0)}°C`,0,40,s[1],7,'center',800);
  T_(c,c.label+' · 1Φ isolation',0,-58,COL.text,9,'center',800);
  if(c._warn)T_(c,c._warn.slice(0,34),0,56,COL.warn,6.5,'center',700);}
function drawT3(c){
  const on=!!c._secOn,col=c.tripped?COL.bad:c._alarm?COL.warn:on?COL.ok:COL.edge,s=xState(c);
  shadow(()=>{rr(-70,-58,140,114,8);ctx.fillStyle=GR(0,-58,0,56,[[0,'#2e3a49'],[1,'#141c27']]);ctx.fill();});
  rr(-70,-58,140,114,8);ctx.lineWidth=1.6;ctx.strokeStyle=col;ctx.stroke();if(isSel(c))hl(-73,-61,146,120,10);
  const yP=[-40,0,40],yS=[-45,-15,15];
  yP.forEach((y,i)=>{line([[-85,y],[-70,y]],PCOL[i],3);});yS.forEach((y,i)=>line([[70,y],[85,y]],on?PCOL[i]:'#5b6572',3));line([[70,45],[85,45]],on?PCOL[3]:'#5b6572',3);
  ctx.lineWidth=7;ctx.strokeStyle='#6c7a8b';ctx.strokeRect(-36,-40,72,56);line([[-12,-40],[-12,16]],'#6c7a8b',7);line([[12,-40],[12,16]],'#6c7a8b',7);
  for(const x of[-36,0,36]){limbCoil(x,-34,10,12,'#c27a3a',8);limbCoil(x,-28,4,7.5,on?'#d8dee6':'#8f98a3',6);}
  flux(-36,-40,36,16,on,.45);
  T_(c,`Δ`,-58,-52,'#d9a066',10,'center',800);T_(c,'Yn',58,-52,'#cfd8e1',10,'center',800);
  T_(c,`${c.group||'Dyn11'} · ${N(c.kva,100)} kVA · ${N(c.priV,400)}/${N(c.secV,400)} V`,0,-51,'#cfe3f5',7,'center',800);
  bar(-56,24,112,5,N(c.loading,0)/100,N(c.loading,0)>100?COL.bad:N(c.loading,0)>80?COL.warn:COL.ok);
  T_(c,`${s[0]} · ${N(c.loading,0).toFixed(0)}% · ${N(c._temp,25).toFixed(0)}°C`,0,38,s[1],8,'center',800);
  T_(c,`In ${N(c._iN,0).toFixed(1)} A · unb ${N(c._unb,0).toFixed(1)}% · tap ${(N(c.tap,0)*2.5).toFixed(1)}%`,0,49,COL.mut,6.5,'center',700);
  T_(c,c.label+' · 3Φ',0,-68,COL.text,9,'center',800);}
function drawHV(c){
  const on=!!c._secOn,col=c.tripped?COL.bad:c._alarm?COL.warn:on?COL.ok:COL.edge,s=xState(c),t=window.ANIM||0;
  for(let i=0;i<8;i++){const x=-56+i*16;rr(x-5,52,10,22,3);ctx.fillStyle=GR(x-5,0,x+5,0,[[0,'#8793a1'],[.5,'#c5ced8'],[1,'#6b7785']]);ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=.8;ctx.stroke();}
  if(c._fans)for(const x of[-40,40]){ctx.save();ctx.translate(x,66);ctx.rotate(t*18);ctx.strokeStyle='#e5e7eb';ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.rotate(TAU/3);line([[0,0],[8,0]],'#e5e7eb',2);}ctx.restore();}
  shadow(()=>{rr(-66,-18,132,72,8);ctx.fillStyle=GR(0,-18,0,54,[[0,'#7b8ea2'],[1,'#3d4c5c']]);ctx.fill();});
  rr(-66,-18,132,72,8);ctx.lineWidth=1.6;ctx.strokeStyle=col;ctx.stroke();if(isSel(c))hl(-98,-70,196,146,10);
  for(let x=-54;x<=54;x+=12)line([[x,-14],[x,50]],'rgba(0,0,0,.18)',2);
  for(const[x0,tx,y]of[[-84,-95,-30],[-84,-95,30],[64,95,-30],[64,95,30]]){rr(x0,-42,20,84,4);}
  rr(-84,-42,20,84,4);ctx.fillStyle='#5b6b7c';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=1;ctx.stroke();rr(64,-42,20,84,4);ctx.fillStyle='#5b6b7c';ctx.fill();ctx.stroke();
  for(const y of[-30,30]){line([[-95,y],[-84,y]],'#b87333',4);line([[84,y],[95,y]],on?'#b87333':'#6b5a48',4);}
  for(let i=0;i<3;i++){const x=-50+i*14;rr(x-3,-52,6,34,2);ctx.fillStyle=GR(x-3,0,x+3,0,[[0,'#d6a36a'],[.5,'#9a5d2b'],[1,'#5b3314']]);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=.8;ctx.stroke();for(let k=0;k<4;k++)line([[x-5,-48+k*8],[x+5,-48+k*8]],'#6b3a14',2);}
  for(let i=0;i<3;i++){const x=22+i*14;rr(x-2.5,-40,5,22,2);ctx.fillStyle=GR(x-3,0,x+3,0,[[0,'#e8e0d0'],[.5,'#bfb49a'],[1,'#7d745e']]);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=.8;ctx.stroke();}
  rr(-30,-60,60,12,6);ctx.fillStyle='#8896a5';ctx.fill();ctx.strokeStyle='#222';ctx.stroke();line([[0,-48],[0,-18]],'#6b7785',3);
  /* tap indicator + temperature dial */
  ctx.beginPath();ctx.arc(-30,24,13,0,TAU);ctx.fillStyle='#f3f1e8';ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=1;ctx.stroke();
  const f=clamp((N(c._temp,25)-20)/110,0,1),a=Math.PI*.75+Math.PI*1.5*f;line([[-30,24],[-30+Math.cos(a)*10,24+Math.sin(a)*10]],f>.7?'#c0392b':'#111',1.6);T_(c,'°C',-30,33,'#444',5,'center',700);
  rr(4,10,48,28,3);ctx.fillStyle='#0a1118';ctx.fill();T_(c,'OLTC',28,17,'#7fb8a3',6,'center',800);T_(c,`TAP ${N(c.tap,0)>0?'+':''}${N(c.tap,0)}${c.tapMode==='manual'?' M':' A'}`,28,29,'#7df3d1',9,'center',800);
  flux(-52,-8,52,44,on,.35);
  T_(c,`${N(c.priKv,11)}/${N(c.secKv,.4)} kV · ${N(c.mva,1)} MVA · ${c.vgroup||'Dyn11'}`,0,-2,'#e5edf5',7,'center',800);
  T_(c,`${s[0]} · ${N(c.loading,0).toFixed(0)}% · η ${N(c._eff,0).toFixed(1)}%`,0,86,s[1],8,'center',800);
  T_(c,c.label+' · HV',0,-70,COL.text,9,'center',800);
  if(c._warn)T_(c,c._warn.slice(0,40),0,97,COL.warn,6.5,'center',700);}
DRAW.trf1p=drawT1;DRAW.trf3p=drawT3;DRAW.transformerhv=drawHV;

/* ═══════════ 11 · MIGRATE WHAT IS ALREADY ON THE BOARD ═══════════ */
try{
  for(const c of comps){const d=DEFS[c.type];if(!d)continue;for(const k of Object.keys(d.init))if(c[k]===undefined)c[k]=JSON.parse(JSON.stringify(d.init[k]));}
  renderProps();
}catch(e){console.warn('v45 migrate',e);}
log('v45 module ready — CT/VT/Transformer/Solenoid removed, multimeter, V/A/W meters, AC/DC breakers, 1Φ/3Φ/HV transformers.');
})();
