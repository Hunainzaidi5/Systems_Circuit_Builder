/* ══════════ v18 · PROTECTION RELAYS · SYNCHRONISING / PARALLELING · 4–20 mA LOOP I/O · WIRED SAFETY TRIPS ══════════
 *  - 21 distance, 87 differential, 51/OC and generator protection relays now measure their CT/VT inputs and
 *    assert the TRIP terminal (wired to an ACB/VCB trip coil or any relay/contactor coil).
 *  - Synchroscope / Sync Relay measure real V & f of the wired sources; Sync Relay has a COM/NO contact.
 *  - Governor / Exciter / AVR act on the generator identified by their wired nets (engine rack bias,
 *    field excitation). Generators get a droop/load-sharing model so paralleled sets share load.
 *  - Process transmitters get MA+/MA− loop terminals; Analog Input / Output modules complete 4–20 mA loops
 *    and their alarm contacts can drive breakers, contactors, relays or PLC inputs.
 *  - Sensor safety trips wired through an analog loop are routed via the AI alarm contact instead of
 *    tripping the nearest load by distance.
 * Educational model only. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2;
const PH=new Set(['L','L2','L3']);
const R=(st,c,t)=>{try{return st.uf.find(key(c.id,t));}catch(e){return null;}};
const num=N;

/* ─────────── component sets ─────────── */
const SENSOR_TYPES=new Set(['watersensor','waterflowsensor','waterlevelsensor','watertempsensor','steampressure','steamtemp','steamflow','steamquality','gaspressure','gasflow','gaslevel','gasdetector','oxygenanalyzer','phsensor','conductivity','humiditysensor']);
const GEN_TYPES=['generator','gasturbine','steamturbine'];
const TRIP_TYPES=new Set(['overcurrentrelay','differentialrelay','distanceprotection','generatorprotection']);
const GT_SET=new Set(GEN_TYPES);

/* ═══════════ 1 · generator electrical model (voltage, frequency, droop, load sharing) ═══════════ */
function genService(c){
  if(c.type==='generator')return !!(c.on&&N(c.fuel,0)>0);
  if(c.type==='gasturbine')return !!(c.on&&N(c.fuel,100)>0);
  if(c.type==='steamturbine')return !!c.on;
  return false;
}
function genS(c){return c.type==='generator'?Math.max(1,N(c.kva,5))*1000:Math.max(1,N(c.mw,50))*1e6;}
/* approximate load list on electrical nets (mirrors collectLoads for the common load types) */
function loads23(uf){
  const V=sim.volts||230,out=[],Rr=(c,t)=>uf.find(key(c.id,t));
  const add=(c,t,I,P)=>{if(I>0.001)out.push({r:Rr(c,t),I,P:P==null?I*V*.9:P,c});};
  for(const c of comps){const d=DEFS[c.type];if(!d)continue;
    if(d.acT){if(N(c._iIn,0)>.001)for(const t of d.acT)add(c,t,N(c._iIn,0),N(c._pIn,0)/d.acT.length);continue;}
    switch(c.type){
      case'motor':case'acmotor':if(c.powered)add(c,'L',N(c.I,0),N(c.I,0)*V*N(c.pf,.8));break;
      case'gearpump':if(c.powered&&c.drive!=='shaft'&&N(c.I,0)>0)add(c,'L',N(c.I,0),N(c.I,0)*V*N(c.pf,.85));break;
      case'lamp':if(c.powered)add(c,'a',N(c.I,0),c.watts);break;
      case'heater':case'fan':if(c.powered)add(c,'L',N(c.watts,0)/V,N(c.watts,0));break;
      case'load3':for(let k=1;k<=3;k++)add(c,'L'+k,N(c['I'+k],0),N(c['P'+k],0));break;
      case'motor3':if(c.powered||c.phaseLoss)['U','V','W'].forEach((t,k)=>add(c,t,N(c['I'+(k+1)],0),N(c['P'+(k+1)],0)));break;
      case'vfd':if(c._real)['L1','L2','L3'].forEach(t=>add(c,t,N(c.amps,10),N(c.amps,10)*V*.95));break;
      case'batterycharger':if(c.status==='CHARGING')add(c,'AC_L',N(c.inputCurrent,0));break;
    }}
  return out;
}
/* group generators by the net feeding their L terminal, solve droop load sharing */
function genTick23(dt,st){
  if(!st||!st.uf)return;
  const L=loads23(st.uf);
  const groups=new Map();
  for(const c of comps)if(GT_SET.has(c.type)&&genService(c)){
    const root=R(st,c,'L');if(root==null)continue;
    if(!groups.has(root))groups.set(root,[]);groups.get(root).push(c);
  }
  for(const [root,mem] of groups){
    let Pload=0;for(const x of L)if(x.r===root)Pload+=x.P;
    const eng=mem.filter(g=>g._eng&&comps.some(e=>e.id===g._eng&&e.firing));
    const drp=mem.filter(g=>!eng.includes(g));
    const f0=g=>N(g._fSet,50),droop=g=>Math.max(.1,N(g.droopPct,g.type==='generator'?4:2))/100;
    const S=genS;
    let fbus=null;
    if(eng.length){
      /* engine-driven sets set the bus frequency */
      fbus=eng.reduce((a,g)=>a+N(g.freq,50)*S(g),0)/eng.reduce((a,g)=>a+S(g),0);
      /* droop-following units pick up what the engines leave */
      let pres=Math.max(0,Pload);
      for(const g of drp){const pu=clamp((f0(g)-fbus)/(droop(g)*f0(g)),-.2,1.2);g._pu=Math.max(0,pu);g._P=g._pu*S(g);pres-=g._P;}
      let cap=eng.reduce((a,g)=>a+S(g),0);
      for(const g of eng){const share=cap>0?Math.min(S(g),Math.max(0,pres)*(S(g)/cap)):0;g._pu=clamp(share/S(g),0,1.2);g._P=share;}
    }else{
      /* isochronous/droop gens solve a common bus frequency */
      let act=drp.slice();
      for(let it=0;it<4&&act.length;it++){
        let sf=0,sa=0;for(const g of act){const A=S(g)/(droop(g)*f0(g));sa+=A;sf+=A*f0(g);}
        fbus=clamp((sf-Pload)/Math.max(1e-6,sa),38,62);
        const bad=act.filter(g=>fbus>=f0(g));
        if(!bad.length)break;act=act.filter(g=>!bad.includes(g));
      }
      for(const g of mem){
        if(eng.includes(g))continue;
        const pu=clamp((f0(g)-fbus)/(droop(g)*f0(g)),-.2,1.2);g._pu=Math.max(0,pu);g._P=g._pu*S(g);
      }
    }
    for(const g of mem){
      g._f=fbus!=null?fbus:(eng.includes(g)?N(g.freq,50):f0(g));
      const exc=clamp(N(g._exc,.85),0,1),Vn=N(g.vSet,g.volts,230);
      g._V=Vn*(.30+.70*exc)*(1-.04*clamp(g._pu||0,0,1.2));
      if(g.type==='generator')g.outputPower=g._P||0;
    }
  }
  /* gens that dropped out of service decay toward zero */
  for(const c of comps)if(GT_SET.has(c.type)&&!genService(c)){c._f=0;c._V=0;c._pu=0;c._P=0;}
}

/* ═══════════ 2 · AC net information (voltage / frequency of whatever source feeds a net) ═══════════ */
function acMap(st){
  const m=new Map(),put=(c,t,v,f)=>{const r=R(st,c,t);if(r==null)return;const o=m.get(r);if(!o)m.set(r,{v,f,c});};
  for(const c of comps){
    if(c.type==='source'&&c.on){put(c,'L',N(c.volts,220),50);put(c,'N',0,50);}
    else if(c.type==='source3'&&c.on){const v=N(c.volts,400)/1.7322;['L1','L2','L3'].forEach(t=>put(c,t,v,50));put(c,'N',0,50);}
    else if(c.type==='inverter'&&c.on&&c._out!==false){put(c,'AC_L',230,50);put(c,'AC_N',0,50);}
    else if(c.type==='ups1'&&(c._outInv||c._bypL||c._ecoL)){put(c,'OUT_L',230,50);put(c,'OUT_N',0,50);}
    else if(c.type==='trf1p'){put(c,'S_L',N(c.secV,230),50);put(c,'S_N',0,50);}
  }
  for(const c of comps)if(GT_SET.has(c.type)&&genService(c)){const v=N(c._V,230),f=N(c._f,50);put(c,'L',v,f);put(c,'N',0,f);}
  return m;
}
function netInfo(st,c,t,am){
  const root=R(st,c,t);if(root==null)return null;
  const ty=st.cl&&st.cl.m?st.cl.m.get(root):undefined;
  const o=am.get(root);
  if(o)return o;
  if(ty&&PH.has(ty))return{v:sim.volts||230,f:50,c:null};
  return null;
}
function netV(st,c,t,am){const i=netInfo(st,c,t,am);return i?N(i.v,0):0;}
function netF(st,c,t,am,fallback){
  let i=netInfo(st,c,t,am);
  if((!i||!i.f)&&fallback){const r=R(st,c,fallback);const o=am.get(r);if(o)i=o;}
  return i?N(i.f,50):0;
}
function dcV23(st,c,ta,tb){
  /* DC volts between two terminals: scan simple DC sources */
  const ra=R(st,c,ta),rb=R(st,c,tb);if(ra==null||rb==null||ra===rb)return 0;
  const va=new Map(),vb=new Map();
  const feed=(root,sign)=>{for(const x of comps){
    if(x.type==='dcsource'&&x.on){const rp=R(st,x,'+'),rn=R(st,x,'-');if(root===rp)va.set(root,N(x.volts,24));if(root===rn)vb.set(root,0);}
    if(x.type==='psu24'&&N(x._vout,0)>=.5*N(x.vset,24)){const rp=R(st,x,'+'),rn=R(st,x,'-');if(root===rp)va.set(root,N(x._vout,24));if(root===rn)vb.set(root,0);}
    if((x.type==='battery'||x.type==='lfpbattery')){const rp=R(st,x,'OUT+'),rn=R(st,x,'OUT-');const v=(typeof bankV==='function'?bankV(x):N(x.voltage,12));if(root===rp)va.set(root,v);if(root===rn)vb.set(root,0);}
  }};
  feed(ra);feed(rb);
  const a=va.get(ra)??vb.get(ra),b=va.get(rb)??vb.get(rb);
  if(a==null&&b==null)return 0;
  return Math.abs(N(a,0)-N(b,0));
}
function genAtNet(st,root){for(const c of comps)if(GT_SET.has(c.type)&&genService(c)&&R(st,c,'L')===root)return c;return null;}

/* ═══════════ 3 · protection relay measurements ═══════════ */
function ctrRatio(c){const r=String(c.ratio||'100/5');const p=r.split('/');return p.length===2?N(p[0],100)/Math.max(.1,N(p[1],5)):N(r,20);}
function ctPrimaryA(ct,uf){
  /* primary amps through the CT = loads on its P-side net (single-phase equivalent) */
  const root=uf.find(key(ct.id,'P1'));let I=0;
  for(const x of loads23(uf))if(x.r===root)I+=x.I;
  return I;
}
function ctsOnNet(st,term){
  /* CTs whose secondary (S1/S2) lands on this relay input net; returns [{ct,sign}] */
  const root=R(st,term.c,term.t),out=[];
  for(const ct of comps){if(ct.type!=='ct')continue;
    if(R(st,ct,'S1')===root)out.push({ct,sign:1});
    else if(R(st,ct,'S2')===root)out.push({ct,sign:-1});}
  return out;
}
function relayTick23(dt,st){
  const uf=st.uf,L=loads23(uf);
  const lineI=root=>{let I=0;for(const x of L)if(x.r===root)I+=x.I;return I;};
  const netRoot=(c,t)=>R(st,c,t);
  for(const c of comps){
    if(c.type==='differentialrelay'){
      const s1=ctsOnNet(st,{c,t:'CT1_IN'}),s2=ctsOnNet(st,{c,t:'CT2_IN'});
      if(s1.length||s2.length){
        const cur=side=>side.reduce((a,x)=>a+x.sign*ctPrimaryA(x.ct,uf)/ctrRatio(x.ct),0);
        c.measuredDiff=Math.abs(cur(s1)-cur(s2));
        c._diffT=c.measuredDiff>=Math.max(.01,N(c.setting,.2))?(N(c._diffT,0)+dt):0;
        if(!c.tripped&&c._diffT>=N(c.delay,.05)){c.tripped=true;log(`⚠ ${c.label} tripped: 87 differential (${c.measuredDiff.toFixed(2)} A sec)`);}
      }else{
        /* legacy fallback: board-level earth fault flag */
        const ef=comps.some(x=>['motor','lamp','heater','fan','ledstrip','solenoid'].includes(x.type)&&x.fault==='earth'&&x.powered);
        c.measuredDiff=ef?Math.max(N(c.setting,.2),.3):0;
        if(!c.tripped&&c.measuredDiff>=Math.max(.01,N(c.setting,.2))){c.tripped=true;log(`⚠ ${c.label} tripped: differential fault detected`);}
      }
    }
    else if(c.type==='overcurrentrelay'){
      const ct=ctsOnNet(st,{c,t:'CT_IN'})[0];
      let Isec;
      if(ct){const p=ctPrimaryA(ct.ct,uf);Isec=p/ctrRatio(ct.ct)*ct.sign;}
      else{ /* no CT: measure current on the CT_IN net itself as a fallback */
        const root=netRoot(c,'CT_IN');Isec=lineI(root);
      }
      c.measuredI=Math.abs(Isec);
      const pickup=N(c.pickup,0)>0?N(c.pickup,0):N(c.setting,1.5);
      if(c.measuredI>pickup*4){if(!c.tripped){c.tripped=true;log(`⚠ ${c.label} tripped: instantaneous OC (${c.measuredI.toFixed(2)} A)`);}}
      else{
        c.elapsedOvercurrent=c.measuredI>pickup?(N(c.elapsedOvercurrent,0)+dt):0;
        if(!c.tripped&&c.elapsedOvercurrent>=Math.max(.05,N(c.timeDelay,.5))){c.tripped=true;c.elapsedOvercurrent=0;log(`⚠ ${c.label} tripped: overcurrent (${c.measuredI.toFixed(2)} A, ${N(c.timeDelay,.5)} s)`);}
      }
    }
    else if(c.type==='distanceprotection'){
      const am=acMap(st);
      const ct=ctsOnNet(st,{c,t:'I'})[0];
      const iBase=N(c.iBase,1000),vNom=sim.volts||230;
      let Iprim=0,vLn=0;
      if(ct)Iprim=Math.abs(ctPrimaryA(ct.ct,uf));
      else{const root=netRoot(c,'I');Iprim=lineI(root);}
      vLn=netV(st,c,'V',am);
      /* fault current: bolted short or an earthed load on the protected line */
      let If=0;
      const flV=window.FAULTLEVELS?window.FAULTLEVELS[netRoot(c,'V')]:null;
      if(sim.short)If+=flV?flV.Isc:iBase*30;
      if(ct){const proot=uf.find(key(ct.ct.id,'P1'));
        for(const x of comps){if(!(x.powered&&x.fault==='earth'))continue;
          const hits=(DEFS[x.type].term||[]).some(t=>{try{return uf.find(key(x.id,t[0]))===proot;}catch(e){return false;}});
          if(hits){If+=flV?flV.Isc*iBase/Math.max(1,flV.Isc||1)*N(c.faultMul,8)/8:iBase*N(c.faultMul,8);break;}}}
      const Imeas=Iprim+If;
      c.measuredV=vLn;c.measuredI=Imeas;
      /* Z_pu = (V_ln/V_nom)/(I_meas/I_base) — collapses toward zero on a fault */
      c.measuredZ=vLn>1&&Imeas>1?(vLn/vNom)/(Imeas/iBase):999;
      const z1=N(c.zone1,.8),z2=N(c.zone2,1.2),z3=N(c.zone3,2),t2=N(c.zone2Delay,.3),t3=N(c.zone3Delay,1);
      const z=c.measuredZ;
      c._zT2=z<z2?(N(c._zT2,0)+dt):0;c._zT3=z<z3?(N(c._zT3,0)+dt):0;
      if(!c.tripped){
        if(z<z1){c.tripped=true;log(`⚠ ${c.label} tripped: ZONE 1 (${z.toFixed(2)} pu < ${z1})`);}
        else if(z<z2&&c._zT2>=t2){c.tripped=true;log(`⚠ ${c.label} tripped: ZONE 2 (${z.toFixed(2)} pu, ${t2} s)`);}
        else if(z<z3&&c._zT3>=t3){c.tripped=true;log(`⚠ ${c.label} tripped: ZONE 3 (${z.toFixed(2)} pu, ${t3} s)`);}
      }
      c.zoneNow=z<z1?1:z<z2?2:z<z3?3:0;
    }
    else if(c.type==='generatorprotection'){
      const am=acMap(st),iBase=N(c.iBase,100),vNom=sim.volts||230;
      const fns=Array.isArray(c.functions)?c.functions:[];
      /* currents: prefer CTs on each input net, else loads on the input net itself */
      const Ik=k=>{const hits=ctsOnNet(st,{c,t:'CT'+k});
        if(hits.length)return hits.reduce((a,x)=>a+x.sign*ctPrimaryA(x.ct,uf),0);
        const root=netRoot(c,'CT'+k);let s=0,nn=0;for(const x of L)if(x.r===root){s+=x.I;nn++;}return nn?s/nn:0;};
      const I=[Ik(1),Ik(2),Ik(3)].map(Math.abs);
      const Iavg=(I[0]+I[1]+I[2])/3, Imax=Math.max(...I);
      const residual=Math.abs(I[0]+I[1]+I[2]);
      const negSeq=Iavg>0.2*iBase?Math.max(...I.map(x=>Math.abs(x-Iavg)))/Iavg:0;
      const vRoot=netRoot(c,'VT1'),info=netInfo(st,c,'VT1',am);
      const Vmeas=info?N(info.v,0):0, freq=info?N(info.f,50):50;
      const g=genAtNet(st,vRoot);
      const ocPickup=N(c.ocPickup,0)||iBase*N(c.ocPu,1.5);
      const diffPk=N(c.diffPickup,0)||iBase*N(c.diffPu,.05);
      const checks={
        overcurrent:Imax>ocPickup,
        differential:residual>diffPk,
        reversePower:!!(fns.includes('reversePower')&&vRoot&&Iavg>0.3*iBase&&!(g&&genService(g)&&N(g._pu,0)>.02)),
        overexcitation:fns.includes('overexcitation')&&Vmeas>0&&(Vmeas/vNom)/(Math.max(1,freq)/50)>N(c.vfPu,1.05),
        underfrequency:fns.includes('underfrequency')&&freq>0&&freq<N(c.ufLo,47),
        overfrequency:fns.includes('overfrequency')&&freq>N(c.ufHi,52),
        lossOfField:!!(fns.includes('lossOfField')&&g&&genService(g)&&Iavg>0.3*iBase&&Vmeas>0&&Vmeas<0.75*vNom),
        negativeSequence:fns.includes('negativeSequence')&&negSeq>N(c.negPu,.15)
      };
      /* overcurrent/differential only run when listed */
      if(!fns.includes('overcurrent'))checks.overcurrent=false;
      if(!fns.includes('differential'))checks.differential=false;
      c.measuredV=Vmeas;c.measuredI=I;c.freq=freq;c.residual=residual;
      const bad=Object.keys(checks).find(k=>checks[k]);
      c._fnT=bad?(N(c._fnT,0)+dt):0;c._lastFn=bad||'';
      if(!c.tripped&&bad&&c._fnT>=N(c.delay,.1)){c.tripped=true;log(`⚠ ${c.label} tripped: ${bad.toUpperCase().replace(/([A-Z])/g,' $1').trim()} (${Vmeas.toFixed(0)} V, ${Iavg.toFixed(1)} A, ${freq.toFixed(1)} Hz)`);}
    }
  }
}

/* ═══════════ 4 · synchronising instruments ═══════════ */
function syncTick23(dt,st){
  const am=acMap(st);
  for(const c of comps){
    if(c.type==='synchroscope'){
      const vg=netV(st,c,'V_G',am),vs=netV(st,c,'V_S',am);
      const fg=netF(st,c,'F_G',am,'V_G'),fs=netF(st,c,'F_S',am,'V_S');
      c.voltDiff=Math.abs(vg-vs);c.freqDiff=fg-fs;
      c.angle=((N(c.angle,0)+TAU*(fg-fs)*Math.max(0,dt))%TAU+TAU)%TAU;
      c._vg=vg;c._vs=vs;c._fg=fg;c._fs=fs;
    }
    else if(c.type==='syncrelay'){
      const vb=Math.abs(netV(st,c,'V_L',am)-netV(st,c,'V_N',am));
      const vg=Math.abs(netV(st,c,'G_L',am)-netV(st,c,'G_N',am));
      const fb=netF(st,c,'V_L',am),fg=netF(st,c,'G_L',am,'G_N');
      const dV=Math.abs(vg-vb),df=fg-fb;
      c.voltageMatch=dV<=Math.max(2,N(c.vTol,3));
      c.freqMatch=Math.abs(df)<=N(c.fTol,.2);
      c.voltDiff=dV;c.freqDiff=df;c._vb=vb;c._vg=vg;c._fb=fb;c._fg=fg;
      const ok=c.voltageMatch&&c.freqMatch;
      c._syncT=ok?N(c._syncT,0)+dt:0;
      const was=c.synced;
      c.synced=c.force===true||c._syncT>=N(c.minTime,.8);
      c._contact=c.synced;
      if(c.synced&&!was)log(`⚠ ${c.label} SYNC OK — V ${vg.toFixed(0)}/${vb.toFixed(0)} · f ${fg.toFixed(2)}/${fb.toFixed(2)} Hz`);
      if(was&&!c.synced&&c._syncT===0)log(`${c.label} sync lost`);
    }
  }
}

/* ═══════════ 5 · governor / exciter / AVR ═══════════ */
function ctrlTick23(dt,st){
  const am=acMap(st);
  /* governor: PI on frequency → engine rack bias or genset frequency setpoint */
  for(const c of comps)if(c.type==='governor'){
    const fm=netF(st,c,'SPEED',am);
    c.freqMeas=fm;
    const sroot=R(st,c,'SPEED');
    const g=sroot!=null?genAtNet(st,sroot):null;
    c._unit=g?g.label:'';
    if(!g||fm<=0){c.output=50;c._diag=g?'NO SPEED SIGNAL':'NO GOVERNED UNIT';continue;}
    const ft=N(c.setpointHz,50),kp=N(c.kp,4),ki=N(c.ki,.6),auth=N(c.authority,.35);
    const err=ft-fm;c._i=clamp(N(c._i,0)+err*dt,-40,40);
    const out=clamp(kp*err+ki*c._i,0,100);c.output=out;
    if(g._eng){const e=comps.find(x=>x.id===g._eng);if(e)e._govRack=(out-50)/50*auth;}
    else{
      if(!Number.isFinite(N(g._fSetBase,NaN)))g._fSetBase=N(g._fSet,50);
      g._fSet=clamp(g._fSetBase+(g._fTrim||0),45,65);
    }
    c._diag=`${g.label} · ${fm.toFixed(2)}/${ft.toFixed(1)} Hz`;
  }
  /* exciter writes field excitation first; AVR (regulated) overrides it */
  for(const pass of['exciter','avr'])for(const c of comps)if(c.type===pass){
    const froot=R(st,c,'FIELD');
    const g=froot!=null?GT_SET&&comps.find(x=>GT_SET.has(x.type)&&genService(x)&&R(st,x,'FIELD')===froot):null;
    c._gen=g?g.label:'';
    if(c.type==='exciter'){
      const vs=dcV23(st,c,'ARMATURE','FIELD');
      c._supV=vs;c.powered=vs>3;
      if(g)c._excT=clamp(vs/Math.max(1,N(c.voltage,200)),0,1)*clamp(N(c.current,50)/50,.2,1.5);
      else c._excT=0;
      if(g)g._exc=clamp(N(g._exc,.85)*.5+c._excT*.5,0,1);
      c._diag=g?`→ ${g.label} · ${vs.toFixed(1)} V supply`:(vs>3?'FIELD NOT WIRED':'NO SUPPLY');
    }else{
      const vm=netV(st,c,'VOLTAGE',am),fm=netF(st,c,'SPEED',am);
      c.voltMeas=vm;c.freqMeas=fm;
      if(c.mode==='manual'){if(g)g._exc=clamp(N(c.excitation,50)/100,0,1);c._diag='MANUAL';}
      else{
        const sp=N(c.setpoint,230),kp=N(c.kp,2),ki=N(c.ki,.4);
        const err=sp-vm;c._i=clamp(N(c._i,0)+err*dt,-60,60);
        const out=clamp(.85+kp*err/230+ki*c._i/230,0,1);c.excitation=Math.round(out*100);
        if(g)g._exc=out;
        c._diag=g?`→ ${g.label} · ${vm.toFixed(0)}/${sp} V`:'NO FIELD CONNECTION';
      }
    }
  }
}

/* ═══════════ 6 · analog I/O modules ═══════════ */
const LOOP_SOURCES=()=>comps.filter(c=>SENSOR_TYPES.has(c.type)||c.type==='aomodule');
function aiSources(st,mod,k){
  /* mA sources feeding analog-input channel k of module `mod` */
  const out=[],ap=R(st,mod,'AI'+k+'+'),an=R(st,mod,'AI'+k+'-');
  if(ap==null||an==null)return out;
  for(const s of comps){
    if(SENSOR_TYPES.has(s.type)){
      if(R(st,s,'MA+')===ap&&R(st,s,'MA-')===an)out.push({c:s,mA:N(s.outputMA,0)});
    }else if(s.type==='aomodule'){
      if(R(st,s,'AO'+k+'+')===ap&&R(st,s,'AO'+k+'-')===an)out.push({c:s,mA:N(s['_mA'+k],0)});
    }
  }
  return out;
}
function aiTick23(dt,st){
  for(const c of comps){
    if(c.type==='aimodule'){
      c._supplyV=dcV23(st,c,'+','-');c._pw=c._supplyV>10;
      for(const k of[1,2]){
        const src=aiSources(st,c,k);
        const mA=src.reduce((a,x)=>a+x.mA,0);
        const lrv=N(c['lrv'+k],0),urv=N(c['urv'+k],100),span=Math.max(.001,urv-lrv);
        const pv=mA>=3.5&&mA<=21.5?lrv+(mA-4)/16*span:NaN;
        let state;
        if(!c._pw)state='NOSUPPLY';
        else if(mA<3.5)state='UNDER';
        else if(mA>21.5)state='OVER';
        else if(!src.length)state='OPEN';
        else{
          const hi=N(c['hi'+k],0),lo=N(c['lo'+k],0),hy=N(c['hyst'+k],0)*span/100,band=hi>lo;
          const prev=c['_st'+k]||'OK';
          if(band&&(prev==='HI'?pv>hi-hy:pv>hi))state='HI';
          else if(band&&(prev==='LO'?pv<lo+hy:pv<lo))state='LO';
          else state='OK';
        }
        c['_mA'+k]=mA;c['_pv'+k]=pv;c['_st'+k]=state;
        c['_src'+k]=src.map(x=>x.c.label).join(',')||'—';
      }
    }
    else if(c.type==='aomodule'){
      c._supplyV=dcV23(st,c,'+','-');c._pw=c._supplyV>10;
      for(const k of[1,2]){
        const lrv=N(c['lrv'+k],0),urv=N(c['urv'+k],100),val=N(c['val'+k],lrv);
        const frac=clamp((val-lrv)/Math.max(.001,urv-lrv),0,1);
        c['_mA'+k]=c._pw?4+16*frac:0;
        c['_pv'+k]=val;
      }
    }
  }
}

/* ═══════════ 7 · sensor loop detection → wired safety path ═══════════ */
function loopDetect23(st){
  for(const s of comps){if(!SENSOR_TYPES.has(s.type))continue;
    s._viaIO=null;
    if(s.tripMode==='none'||s.tripEnabled===false)continue;
    const rp=R(st,s,'MA+'),rn=R(st,s,'MA-');if(rp==null||rn==null)continue;
    for(const m of comps){if(m.type!=='aimodule')continue;
      for(const k of[1,2]){
        if(R(st,m,'AI'+k+'+')===rp&&R(st,m,'AI'+k+'-')===rn){s._viaIO={mod:m.id,ch:k};break;}
      }
      if(s._viaIO)break;
    }
  }
}
/* sensors routed through the analog loop must not ALSO trip the nearest load */
const _step23=step;
step=function(dt){
  const routed=[];
  for(const s of comps)if(SENSOR_TYPES.has(s.type)&&(s.tripMode==='io'||s._viaIO)&&s.tripMode!=='none'&&s.tripEnabled!==false){routed.push(s);s._tm=s.tripMode;s.tripMode='none';}
  try{_step23(dt);}finally{for(const s of routed)s.tripMode=s._tm;}
  /* IO-mode diagnostic: warn once when the loop is not wired to an AI channel */
  for(const s of comps){if(!SENSOR_TYPES.has(s.type))continue;
    if(s.tripMode==='io'&&!s._viaIO){s._ioT=(s._ioT||0)+dt;if(s._ioT>8&&!s._ioLogged){s._ioLogged=true;log(`⚠ ${s.label}: safety trip set to analog-loop mode but MA+/MA− are not wired to an Analog Input channel`);}}
    else{s._ioT=0;if(s._ioLogged){s._ioLogged=false;if(s._viaIO)log(`${s.label} safety trip routed via analog input alarm contact`);}}
  }
};

/* ═══════════ 8 · relay TRIP assertion + classify / links / resets ═══════════ */
const _cl23=classify;
classify=function(uf){
  const r=_cl23(uf);
  /* a tripped protection relay asserts its TRIP terminal as a + rail so it can feed any coil */
  for(const c of comps){
    if(!c.tripped||!TRIP_TYPES.has(c.type))continue;
    const t=(DEFS[c.type].term||[]).find(x=>x[0]==='TRIP');if(!t)continue;
    const root=uf.find(key(c.id,'TRIP')),cur=r.m.get(root);
    if(cur===undefined)r.m.set(root,'L');
  }
  /* DC supplies also classify their rails so 24 V control wiring works with live() */
  const put=(root,ty)=>{const o=r.m.get(root);if(o===undefined)r.m.set(root,ty);else if((o==='L'&&ty==='N')||(o==='N'&&ty==='L'))r.short=true;};
  for(const c of comps){
    if(c.type==='dcsource'&&c.on){put(uf.find(key(c.id,'+')),'L');put(uf.find(key(c.id,'-')),'N');}
    else if(c.type==='gasturbine'&&c.on&&N(c.fuel,100)>0){put(uf.find(key(c.id,'L')),'L');put(uf.find(key(c.id,'N')),'N');put(uf.find(key(c.id,'PE')),'PE');}
    else if(c.type==='steamturbine'&&c.on){put(uf.find(key(c.id,'L')),'L');put(uf.find(key(c.id,'N')),'N');put(uf.find(key(c.id,'PE')),'PE');}
  }
  return r;
};
/* generator L/N/PE alias to phantom L1/L2/L3 so engine shaft-load sees real electrical demand */
/* (only L↔L1: also tying L to L2/L3 merged the three phases into one net and raised a false phase-to-phase short) */
{const g=LINKS.generator;LINKS.generator=c=>[...(g?g(c):[]),['L','L1']];
 for(const t of['gasturbine','steamturbine']){const f=LINKS[t];LINKS[t]=c=>[...(f?f(c):[]),['L','L1']];}}
/* sync relay contact + AI alarm contacts */
LINKS.syncrelay=c=>c._contact?[['COM','NO']]:[];
LINKS.aimodule=c=>{const a=[],s=[c._st1,c._st2];for(let k=0;k<2;k++){const v=s[k];if(v==='HI'||v==='LO'||((v==='BAD'||v==='UNDER'||v==='OVER'||v==='NOSUPPLY')&&c.failSafe!==false))a.push(['C'+(k+1),'N'+(k+1)]);}return a;};

/* ═══════════ 9 · new parts: Analog Input / Output modules ═══════════ */
function defP(type,o){DEFS[type]=Object.assign({icon:'⚙️',pins:{}},o,{init:Object.assign({},o.init||{})});if(o.blurb)COMP_BLURB[type]=o.blurb;if(o.draw)DRAW[type]=o.draw;}
const AIC=['#22d3ee','#0e7490'];
function drawAI(c){
  body(c,220,240,c._pw?COL.ok:COL.edge);
  rr(-105,-115,210,52,4);ctx.fillStyle='#0a1613';ctx.fill();ctx.strokeStyle='#050a0c';ctx.stroke();
  txt(c,c._pw?`24 V · ${c._supplyV.toFixed(1)} V`:'NO SUPPLY',0,-104,c._pw?'#3df5b0':'#ef4444',8,'center',800);
  txt(c,'ANALOG INPUT · 4–20 mA',0,-92,COL.mut,7,'center',800);
  for(const k of[1,2]){
    const y=-60+k*44,mA=N(c['_mA'+k],0),pv=c['_pv'+k],st=c['_st'+k]||'—';
    rr(-100,y-16,200,36,3);ctx.fillStyle='#0d1b2a';ctx.fill();ctx.strokeStyle=st==='OK'?'#1f4a5a':'#7a2d3a';ctx.stroke();
    txt(c,`CH${k}  ${mA.toFixed(2)} mA`,-90,y-4,st==='OK'?COL.ok:COL.warn,8,'left',800);
    txt(c,Number.isFinite(pv)?`${pv.toFixed(1)} ${c['unit'+k]||''}`.trim():(st==='OPEN'?'loop open':st),-90,y+9,Number.isFinite(pv)?COL.text:COL.bad,8,'left',800);
    const col=st==='OK'?'#22c55e':st==='HI'||st==='LO'?'#f59e0b':'#ef4444';
    led(88,y+1,col,st!=='OK');
    txt(c,st,-78,y+13,COL.mut,6,'left',700);
  }
  txt(c,c.label,0,-132,COL.text,9,'center',800);
}
function drawAO(c){
  body(c,200,170,c._pw?COL.ok:COL.edge);
  rr(-92,-78,184,40,4);ctx.fillStyle='#0a1613';ctx.fill();ctx.strokeStyle='#050a0c';ctx.stroke();
  txt(c,c._pw?`24 V · ${c._supplyV.toFixed(1)} V`:'NO SUPPLY',0,-67,c._pw?'#3df5b0':'#ef4444',8,'center',800);
  txt(c,'ANALOG OUTPUT · 4–20 mA',0,-55,COL.mut,7,'center',800);
  for(const k of[1,2]){
    const y=-18+k*44,mA=N(c['_mA'+k],0),pv=N(c['_pv'+k],0);
    rr(-92,y-16,184,36,3);ctx.fillStyle='#0d1b2a';ctx.fill();ctx.strokeStyle='#1f4a5a';ctx.stroke();
    txt(c,`CH${k}  ${pv.toFixed(1)} ${c['unit'+k]||''}`.trim(),-82,y-4,COL.text,8,'left',800);
    txt(c,`${mA.toFixed(2)} mA`,-82,y+9,COL.mut,8,'left',800);
  }
  txt(c,c.label,0,-100,COL.text,9,'center',800);
}
defP('aimodule',{name:'Analog Input Module 2-ch (4–20 mA, alarm contacts)',tag:'AI',cat:'Process Control',w:220,h:240,
  term:[['+',-110,-84,-1,0],['-',-110,-62,-1,0],['AI1+',110,-84,1,0],['AI1-',110,-62,1,0],['AI2+',110,-18,1,0],['AI2-',110,4,1,0],['C1',-60,118,0,1],['N1',-20,118,0,1],['C2',20,118,0,1],['N2',60,118,0,1]],
  pins:{'+':'24 V DC supply','-':'0 V supply','AI1+':'channel 1 loop + (to TX MA+)','AI1-':'channel 1 loop − (to TX MA−)','AI2+':'channel 2 loop +','AI2-':'channel 2 loop −',C1:'alarm relay 1 COM',N1:'alarm relay 1 NO (closes on HI/LO/BAD)',C2:'alarm relay 2 COM',N2:'alarm relay 2 NO'},
  init:{lrv1:0,urv1:100,hi1:90,lo1:10,hyst1:1,unit1:'',lrv2:0,urv2:100,hi2:90,lo2:10,hyst2:1,unit2:'',failSafe:true},
  draw:drawAI,
  blurb:'Two-channel 4–20 mA analog input. Power it from 24 V (+/−). Wire each transmitter MA+/MA− to an AI channel pair; the module converts mA to engineering units (LRV/URV) and closes the C/N alarm contact when PV leaves the HI/LO band or the loop fails (fail-safe). Wire N→contactor A1, C→24 V, or N→PLC I1 / breaker MX+ to act on the alarm.'});
defP('aomodule',{name:'Analog Output Module 2-ch (4–20 mA)',tag:'AO',cat:'Process Control',w:200,h:170,
  term:[['+',-100,-50,-1,0],['-',-100,-28,-1,0],['AO1+',100,-50,1,0],['AO1-',100,-28,1,0],['AO2+',100,16,1,0],['AO2-',100,38,1,0]],
  pins:{'+':'24 V DC supply','-':'0 V supply','AO1+':'channel 1 loop +','AO1-':'channel 1 loop −','AO2+':'channel 2 loop +','AO2-':'channel 2 loop −'},
  init:{lrv1:0,urv1:100,val1:50,unit1:'',lrv2:0,urv2:100,val2:50,unit2:''},
  draw:drawAO,
  blurb:'Two-channel 4–20 mA analog output. Power from 24 V. Each channel sources 4–20 mA proportional to its set value between LRV and URV — wire the loop into an Analog Input channel (or a field device) to close the control loop.'});

/* ═══════════ 10 · patch existing parts ═══════════ */
/* transmitter loop terminals on all process sensors */
for(const t of SENSOR_TYPES){const d=DEFS[t];if(d&&!d.term.some(x=>x[0]==='MA+')){
  d.term.push(['MA+',38,-12,1,0],['MA-',38,12,1,0]);
  d.pins=d.pins||{};d.pins['MA+']='4–20 mA loop + (wire to AI module AIx+)';d.pins['MA-']='4–20 mA loop − (wire to AI module AIx−)';
}}
/* generator FIELD terminal for exciter/AVR */
for(const t of GEN_TYPES){const d=DEFS[t];if(d&&!d.term.some(x=>x[0]==='FIELD')){
  const pos=t==='generator'?[60,0,1,0]:[0,62,0,1];
  d.term.push(['FIELD',pos[0],pos[1],pos[2],pos[3]]);
  d.pins=d.pins||{};d.pins.FIELD='rotor field input (DC) — wire Exciter OUTPUT or AVR FIELD';
}}
/* sync relay contact terminals */
{const d=DEFS.syncrelay;if(d&&!d.term.some(x=>x[0]==='COM')){
  d.term.push(['COM',-18,42,0,1],['NO',18,42,0,1]);
  d.pins=d.pins||{};d.pins.COM='sync contact COM';d.pins.NO='sync contact NO — closes when voltage & frequency match';
  Object.assign(d.init,{vTol:3,fTol:.2,minTime:.8,force:false});
}}
/* protection relay extra settings */
if(DEFS.distanceprotection)Object.assign(DEFS.distanceprotection.init,{iBase:1000,zone2Delay:.3,zone3Delay:1,faultMul:8,tripped:false,measuredZ:999,zoneNow:0});
if(DEFS.generatorprotection)Object.assign(DEFS.generatorprotection.init,{iBase:100,ocPu:1.5,diffPu:.05,vfPu:1.05,ufLo:47,ufHi:52,negPu:.15,delay:.1,tripped:false,measuredV:0,measuredI:[0,0,0],freq:0,residual:0,_lastFn:''});
if(DEFS.overcurrentrelay)Object.assign(DEFS.overcurrentrelay.init,{pickup:0,delay:.05,measuredI:0});
if(DEFS.differentialrelay)Object.assign(DEFS.differentialrelay.init,{delay:.05});
/* governor / avr extra fields */
if(DEFS.governor)Object.assign(DEFS.governor.init,{setpointHz:50,kp:4,ki:.6,authority:.35,govRange:3,freqMeas:0,output:50});
if(DEFS.avr)Object.assign(DEFS.avr.init,{kp:2,ki:.4,voltMeas:0,freqMeas:0});
if(DEFS.synchroscope)Object.assign(DEFS.synchroscope.init,{_vg:0,_vs:0,_fg:50,_fs:50});

/* ═══════════ 11 · game tick ═══════════ */
Game.register('protsync',{tick(dt,gx){
  const st=sim.st;if(!st||!st.uf)return;dt=Math.max(0,Math.min(.1,dt));
  try{genTick23(dt,st);}catch(e){if(!window._e1){window._e1=1;console.warn('gen',e);}}
  try{ctrlTick23(dt,st);}catch(e){if(!window._e2){window._e2=1;console.warn('ctrl',e);}}
  try{syncTick23(dt,st);}catch(e){if(!window._e3){window._e3=1;console.warn('sync',e);}}
  try{aiTick23(dt,st);}catch(e){if(!window._e4){window._e4=1;console.warn('ai',e);}}
  try{relayTick23(dt,st);}catch(e){if(!window._e5){window._e5=1;console.warn('relay',e);}}
  try{loopDetect23(st);}catch(e){if(!window._e6){window._e6=1;console.warn('loop',e);}}
},
reset(){for(const c of comps){
  if(GT_SET.has(c.type)){c._f=0;c._V=0;c._pu=0;c._P=0;c._exc=.85;c._fSet=50;c._fSetBase=undefined;c._fTrim=0;delete c._viaIO;}
  if(c.type==='engine4s')c._govRack=0;
  if(c.type==='aimodule'||c.type==='aomodule'){for(const k of[1,2]){c['_mA'+k]=0;c['_pv'+k]=NaN;c['_st'+k]='—';c['_src'+k]='—';}}
  if(c.type==='syncrelay'){c.synced=false;c._contact=false;c._syncT=0;}
  if(c.type==='synchroscope'){c.angle=0;c.freqDiff=0;c.voltDiff=0;}
  if(TRIP_TYPES.has(c.type)){c.tripped=false;c._diffT=0;c._zT2=0;c._zT3=0;c._fnT=0;c.elapsedOvercurrent=0;}
}}});

/* ═══════════ 12 · UI: palette, properties, describe, click, reset ═══════════ */
/* palette section */
(function(){const groups=$('componentGroups');if(!groups)return;
  let sec=[...groups.querySelectorAll('.palette-group')].find(s=>s.dataset.category==='Analog I/O');
  if(!sec){sec=document.createElement('section');sec.className='palette-group';sec.dataset.category='Analog I/O';
    sec.innerHTML='<div class="cat" style="--a:#22d3ee">Analog I/O · 4–20 mA</div><div class="grid2"></div>';groups.appendChild(sec);}
  const g=sec.querySelector('.grid2');
  for(const k of['aimodule','aomodule']){if(g.querySelector('.item[data-type="'+k+'"]'))continue;
    const d=DEFS[k];const el=document.createElement('div');el.className='item';el.draggable=true;el.dataset.type=k;
    el.title='Drag to board or click to add';
    el.innerHTML=`<div class="ic">${ICON[k]||d.icon||'⚙️'}</div><div class="nm">${d.name}</div>`;
    el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',k));
    el.addEventListener('click',()=>{const r=(typeof cv!=='undefined'?cv:document.getElementById('cv')).getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(k,p.x+n,p.y+n);});
    g.appendChild(el);}
})();
ICON.aimodule=SV('<rect class="f" x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 15h10"/><circle class="f" cx="7" cy="9" r="1.4"/><circle class="f" cx="7" cy="15" r="1.4"/>');
ICON.aomodule=SV('<rect class="f" x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 15h10"/><circle cx="7" cy="9" r="1.4" fill="currentColor"/><circle cx="7" cy="15" r="1.4" fill="currentColor"/>');

/* properties */
/* properties additions — uxProps hook */
uxProps(()=>{
  const c=selected&&selected.kind==='c'?getC(selected.id):null;if(!c)return;
  const el=$('props');if(!el)return;
  const f=(l,k,min,max,st)=>`<div class="f"><label>${l}</label><input type="number" data-k="${k}" data-t="n" min="${min}" max="${max}" step="${st}" value="${Number(c[k]??0)}"></div>`;
  const sel=(l,k,o)=>`<div class="f"><label>${l}</label><select data-k="${k}" data-t="s">${o.map(x=>`<option value="${x[0]}" ${c[k]===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></div>`;
  const cb=(l,k)=>`<div class="f"><label>${l}</label><input type="checkbox" data-k="${k}" data-t="b" ${c[k]!==false?'checked':''}></div>`;
  const note=s=>`<div class="note" style="margin-top:6px">${s}</div>`;
  if(c.type==='aimodule'){
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#22d3ee;font-weight:800">ANALOG INPUT · 4–20 mA LOOP</div>
     Supply: <b>${c._pw?'OK':'MISSING — wire +/− to 24 V'}</b><br>
     ${f('CH1 LRV','lrv1',-1e6,1e6,.01)}${f('CH1 URV','urv1',-1e6,1e6,.01)}${f('CH1 HI alarm','hi1',-1e6,1e6,.01)}${f('CH1 LO alarm','lo1',-1e6,1e6,.01)}${f('CH1 hysteresis %','hyst1',0,50,.1)}${f('CH2 LRV','lrv2',-1e6,1e6,.01)}${f('CH2 URV','urv2',-1e6,1e6,.01)}${f('CH2 HI alarm','hi2',-1e6,1e6,.01)}${f('CH2 LO alarm','lo2',-1e6,1e6,.01)}${f('CH2 hysteresis %','hyst2',0,50,.1)}
     ${cb('Fail-safe contact on loop fault','failSafe')}
     <div class="kpis" style="margin-top:6px"><div class="kpi"><b>CH1</b><span>${N(c._mA1,0).toFixed(2)} mA · ${c._st1||'—'}</span></div><div class="kpi"><b>CH2</b><span>${N(c._mA2,0).toFixed(2)} mA · ${c._st2||'—'}</span></div></div>
     ${note(`CH1: ${Number.isFinite(c._pv1)?c._pv1.toFixed(2):'—'} ← ${c._src1||'—'}<br>CH2: ${Number.isFinite(c._pv2)?c._pv2.toFixed(2):'—'} ← ${c._src2||'—'}<br>Alarm contacts C1/N1, C2/N2 close on HI/LO (and loop faults when fail-safe). Wire a contact into a breaker trip coil, contactor or PLC input.`)}`);
  }
  if(c.type==='aomodule'){
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#22d3ee;font-weight:800">ANALOG OUTPUT · 4–20 mA LOOP</div>
     Supply: <b>${c._pw?'OK':'MISSING — wire +/− to 24 V'}</b><br>
     ${f('CH1 setpoint','val1',-1e6,1e6,.01)}${f('CH1 LRV','lrv1',-1e6,1e6,.01)}${f('CH1 URV','urv1',-1e6,1e6,.01)}
     ${f('CH2 setpoint','val2',-1e6,1e6,.01)}${f('CH2 LRV','lrv2',-1e6,1e6,.01)}${f('CH2 URV','urv2',-1e6,1e6,.01)}
     <div class="kpis" style="margin-top:6px"><div class="kpi"><b>CH1</b><span>${N(c._mA1,0).toFixed(2)} mA</span></div><div class="kpi"><b>CH2</b><span>${N(c._mA2,0).toFixed(2)} mA</span></div></div>
     ${note('Wire AOx+/AOx− into an Analog Input channel to close the loop, or to a field device that accepts 4–20 mA.')}`);
  }
  if(SENSOR_TYPES.has(c.type)){
    const via=c._viaIO?`WIRED → ${getC(c._viaIO.mod)?.label||'AI'} CH${c._viaIO.ch}`:(c.tripMode==='io'?'LOOP MODE — MA+/MA− not connected to an AI channel':'not wired');
    el.insertAdjacentHTML('beforeend',note(`4–20 mA loop: <b>${via}</b> · output ${N(c.outputMA,0).toFixed(2)} mA${c.tripMode==='io'||c._viaIO?' — safety action goes through the AI alarm contact (wire it to the load/breaker).':''}`));
    /* add 'io' option to the trip-mode select rendered by the safety module */
    const selEl=el.querySelector('select[data-k="tripMode"]');
    if(selEl&&!selEl.querySelector('option[value="io"]')){
      const o=document.createElement('option');o.value='io';o.textContent='Analog loop → AI alarm contact';selEl.appendChild(o);
      if(c.tripMode==='io')selEl.value='io';
    }
  }
  if(c.type==='distanceprotection'){
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#f87171;font-weight:800">21 DISTANCE — wired measurement</div>
     ${f('Base current iBase (A)','iBase',10,1e5,10)}${f('Zone 2 delay (s)','zone2Delay',0,10,.05)}${f('Zone 3 delay (s)','zone3Delay',0,30,.1)}${f('Earth-fault multiplier','faultMul',1,50,1)}
     <div class="kpis" style="margin-top:6px"><div class="kpi"><b>Z</b><span>${N(c.measuredZ,999).toFixed(2)} pu</span></div><div class="kpi"><b>I</b><span>${N(c.measuredI,0).toFixed(0)} A</span></div><div class="kpi"><b>V</b><span>${N(c.measuredV,0).toFixed(0)} V</span></div></div>
     ${note(`Zone: ${c.zoneNow||'—'} · measured from wired V and CT secondary. TRIP asserts + on the TRIP terminal — wire it to an ACB/VCB MX/TC coil or any relay coil.`)}`);
  }
  if(c.type==='overcurrentrelay'){
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#f87171;font-weight:800">51/50 OVERCURRENT — wired measurement</div>
     ${f('Pickup (A secondary)','pickup',.1,100,.1)}${f('Time delay (s)','timeDelay',.05,60,.05)}
     <div class="kpis" style="margin-top:6px"><div class="kpi"><b>I sec</b><span>${N(c.measuredI,0).toFixed(2)} A</span></div></div>
     ${note('Wire CT_IN to a CT secondary (S1/S2). Pickup is in secondary amps; >4× pickup trips instantaneously.')}`);
  }
  if(c.type==='differentialrelay'){
    el.insertAdjacentHTML('beforeend',note(`87 differential: measured ΔI = ${N(c.measuredDiff,0).toFixed(2)} A (setting ${N(c.setting,.2)})${c._diffT?' · timing…':''}. Wire CT1_IN/CT2_IN to the two CT secondaries of the protected zone.`));
  }
  if(c.type==='generatorprotection'){
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#f87171;font-weight:800">GENERATOR PROTECTION — wired CT/VT</div>
     ${f('Base current iBase (A)','iBase',1,1e5,1)}${f('OC pickup (×iBase)','ocPu',.2,10,.1)}${f('Diff pickup (×iBase)','diffPu',.001,1,.001)}${f('V/Hz limit (pu)','vfPu',.8,1.5,.01)}${f('UF (Hz)','ufLo',40,55,.1)}${f('OF (Hz)','ufHi',45,65,.1)}${f('Neg-seq (pu)','negPu',.02,1,.01)}${f('Operate delay (s)','delay',.02,5,.02)}
     <div class="kpis" style="margin-top:6px"><div class="kpi"><b>I avg</b><span>${((Array.isArray(c.measuredI)?c.measuredI:[0,0,0]).reduce((a,x)=>a+N(x,0),0)/3).toFixed(1)} A</span></div><div class="kpi"><b>V/f</b><span>${N(c.freq,0).toFixed(1)} Hz</span></div><div class="kpi"><b>Last fn</b><span>${c._lastFn||'—'}</span></div></div>
     ${note('Functions active: '+(Array.isArray(c.functions)?c.functions.join(', '):'—')+'. TRIP asserts + — wire to the generator breaker MX/TC coil.')}`);
  }
  if(c.type==='syncrelay'){
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#34d399;font-weight:800">SYNC RELAY — live comparison</div>
     ${f('V tolerance (V)','vTol',.5,20,.5)}${f('F tolerance (Hz)','fTol',.01,2,.01)}${f('Min sync time (s)','minTime',.1,10,.1)}${cb('Force contact','force')}
     <div class="kpis" style="margin-top:6px"><div class="kpi"><b>Gen</b><span>${N(c._vg,0).toFixed(0)} V · ${N(c._fg,0).toFixed(2)} Hz</span></div><div class="kpi"><b>Bus</b><span>${N(c._vb,0).toFixed(0)} V · ${N(c._fb,0).toFixed(2)} Hz</span></div></div>
     ${note(`Status: <b>${c.synced?'SYNCED':'WAITING'}</b> · COM/NO contact ${c.synced?'CLOSED':'open'} — wire NO→breaker closing coil or a relay to parallel the generator.`)}`);
  }
  if(c.type==='synchroscope'){
    el.insertAdjacentHTML('beforeend',note(`Slip: ${N(c.freqDiff,0).toFixed(2)} Hz (${N(c._fg,0).toFixed(2)} vs ${N(c._fs,0).toFixed(2)}) · ΔV ${N(c.voltDiff,0).toFixed(0)} V · angle ${((N(c.angle,0)*180/Math.PI)%360).toFixed(0)}° — close the breaker as the needle crosses 12 o’clock.`));
  }
  if(c.type==='governor'){
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#c084fc;font-weight:800">GOVERNOR — wired to unit on SPEED net</div>
     ${f('Frequency setpoint (Hz)','setpointHz',45,65,.1)}${f('Kp','kp',.1,50,.1)}${f('Ki','ki',0,10,.05)}${f('Authority','authority',0,1,.05)}${f('Setpoint trim range (Hz)','govRange',.5,10,.5)}
     ${note(`Unit: <b>${c._unit||'—'}</b> · measured ${N(c.freqMeas,0).toFixed(2)} Hz · output ${N(c.output,0).toFixed(0)}% · ${c._diag||''}<br>Wire SPEED to the generator L net. Engine-driven sets get a rack bias; standalone sets get a frequency-setpoint trim.`)}`);
  }
  if(c.type==='avr'){
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:#c084fc;font-weight:800">AVR — wired measurement</div>
     ${f('Kp','kp',.1,20,.1)}${f('Ki','ki',0,5,.05)}
     ${note(`Measured ${N(c.voltMeas,0).toFixed(0)} V · ${N(c.freqMeas,0).toFixed(1)} Hz · excitation ${N(c.excitation,0)}% → ${c._gen||'no FIELD link'}<br>Wire VOLTAGE to the generator L net and FIELD to the generator FIELD terminal.`)}`);
  }
  if(c.type==='exciter'){
    el.insertAdjacentHTML('beforeend',note(`DC supply ${N(c._supV,0).toFixed(1)} V · output → ${c._gen||'no FIELD link'} · ${c._diag||''}`));
  }
});

/* describe additions — uxDesc hook ({set:x} replaces base text) */
uxDesc(c=>{
  if(GT_SET.has(c.type))return `\nElectrical: ${N(c._f,0).toFixed(2)} Hz · ${N(c._V,0).toFixed(0)} V · ${(N(c._pu,0)*100).toFixed(0)}% load · ${(N(c._P,0)/1000).toFixed(1)} kW${c._eng?'\nDriven by engine shaft':''}`;
  if(c.type==='synchroscope')return{set:`Angle: ${((N(c.angle,0)*180/Math.PI)%360).toFixed(0)}°\nFreq diff: ${N(c.freqDiff,0).toFixed(2)} Hz\nVolt diff: ${N(c.voltDiff,0).toFixed(0)} V`};
  if(c.type==='syncrelay')return{set:`Status: ${c.synced?'SYNCED':'WAITING'}\nGen: ${N(c._vg,0).toFixed(0)} V ${N(c._fg,0).toFixed(2)} Hz\nBus: ${N(c._vb,0).toFixed(0)} V ${N(c._fb,0).toFixed(2)} Hz\nContact: ${c.synced?'CLOSED':'open'}`};
  if(c.type==='governor')return{set:`Speed: ${N(c.freqMeas,0).toFixed(2)} Hz → ${c._unit||'—'}\nSetpoint: ${N(c.setpointHz,50)} Hz\nOutput: ${N(c.output,0).toFixed(0)}%`};
  if(c.type==='avr')return{set:`Voltage: ${N(c.voltMeas,0).toFixed(0)} V (set ${N(c.setpoint,230)})\nExcitation: ${N(c.excitation,0)}% → ${c._gen||'—'}`};
  if(c.type==='exciter')return{set:`Supply: ${N(c._supV,0).toFixed(1)} V\nOutput → ${c._gen||'—'}`};
  if(c.type==='distanceprotection')return{set:`Z = ${N(c.measuredZ,999).toFixed(2)} pu (${N(c.zoneNow,0)||'—'} zone)\nV ${N(c.measuredV,0).toFixed(0)} · I ${N(c.measuredI,0).toFixed(0)} A\nStatus: ${c.tripped?'TRIPPED':'OK'}`};
  if(c.type==='overcurrentrelay')return{set:`I = ${N(c.measuredI,0).toFixed(2)} A sec (pickup ${N(c.pickup,N(c.setting,1.5))})\nStatus: ${c.tripped?'TRIPPED':'OK'}`};
  if(c.type==='differentialrelay')return{set:`ΔI = ${N(c.measuredDiff,0).toFixed(2)} A (setting ${N(c.setting,.2)})\nStatus: ${c.tripped?'TRIPPED':'OK'}`};
  if(c.type==='generatorprotection')return{set:`V ${N(c.measuredV,0).toFixed(0)} · I ${N(c.measuredI,0).map(x=>N(x,0).toFixed(0)).join('/')} A · ${N(c.freq,0).toFixed(1)} Hz\nFunctions: ${(Array.isArray(c.functions)?c.functions:[]).join(', ')||'—'}\n${c._lastFn?'Last: '+c._lastFn:''}\nStatus: ${c.tripped?'TRIPPED':'OK'}`};
  if(c.type==='aimodule')return`\nSupply ${c._pw?'OK':'MISSING'} · CH1 ${N(c._mA1,0).toFixed(2)} mA (${c._st1}) · CH2 ${N(c._mA2,0).toFixed(2)} mA (${c._st2})`;
  if(c.type==='aomodule')return`\nSupply ${c._pw?'OK':'MISSING'} · CH1 ${N(c._mA1,0).toFixed(2)} mA · CH2 ${N(c._mA2,0).toFixed(2)} mA`;
  return'';});

/* clicks: relay resets + sync relay force-clear — uxClick hook (return true consumes) */
uxClick(c=>{
  if(TRIP_TYPES.has(c.type)){pushUndo();c.tripped=false;c._diffT=0;c._zT2=0;c._zT3=0;c._fnT=0;c.elapsedOvercurrent=0;log(`${c.label} reset`);renderProps();return true;}
  if(c.type==='syncrelay'){pushUndo();c._syncT=0;c.force=!c.force;log(`${c.label} force ${c.force?'ON':'OFF'}`);renderProps();return true;}
  return false;});

log('v18 module ready — wired protection relays, generator paralleling (synchroscope/sync relay/governor/exciter/AVR), 4–20 mA analog I/O, wired safety trips.');
})();
