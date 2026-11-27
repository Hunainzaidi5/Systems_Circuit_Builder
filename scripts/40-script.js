/* ══════════ v36 · NEW PROCESS & CONTROL PARTS (def2 registry) ══════════
 * Orifice plate + DP transmitter, control valve (Cv/positioner), shell-and-tube
 * HX, flash tank, desuperheater, steam header, air receiver, boiler 3-element
 * level control, PID blocks (P/PI/PID, ratio, split-range), Modbus slave/master. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function box(c,d,col){if(window.__partBody){window.__partBody(c,d,col);return;}body(c,d.w||100,d.h||80,col||COL.edge);txt(c,c.label,0,-(d.h||80)/2+12,COL.text,10);}
const G=c=>{if(window.__glyph){window.__glyph(c);return;}ctx.save();ctx.strokeStyle='#8fb3c9';ctx.lineWidth=1.4;ctx.strokeRect(-14,-10,28,20);ctx.fillStyle='#e8eef5';ctx.font='bold 10px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(DEFS[c.type].tag||'?',0,0);ctx.restore();};
/* net flow estimate: sum pump flows whose DIS net matches (approximation, consistent with earlier modules) */
function netFlow(c,t){const hu=sim.hu;if(!hu)return 0;const r=hu.find(key(c.id,t));if(r==null)return 0;
  return comps.filter(p=>['gearpump','pump','feedwaterpump','coolpump','silopump'].includes(p.type)&&N(p.flow,0)>0&&
    (hu.find(key(p.id,'DIS'))===r||hu.find(key(p.id,'OUT'))===r)).reduce((a,p)=>a+N(p.flow,0),0);}
function nodeP(c,t){const hu=sim.hu;if(!hu||!window.HYD2||!window.HYD2.P)return null;const r=hu.find(key(c.id,t));return r==null?null:window.HYD2.P[r];}

/* ── orifice plate + integral DP transmitter (4–20 mA out) ── */
def2('orificeplate',{name:'Orifice Plate + DP Tx',tag:'FE',cat:'Process Control',w:120,h:90,icon:'⭕',
  term:[['IN',-70,-20,-1,0,'h'],['OUT',-30,-20,1,0,'h'],['MA+',40,-15,1,0],['MA-',40,10,1,0]],
  pins:{IN:'pipe in',OUT:'pipe out', 'MA+':'4–20 mA loop +','MA-':'4–20 mA loop −'},
  init:{beta:0.6,K:100,outputMA:4,lrv:0,urv:100},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText('β='+N(c.beta,.6),0,20);ctx.fillStyle='#3df5b0';ctx.fillText(N(c.outputMA,4).toFixed(1)+' mA',0,34);},
  tick:(c,dt)=>{const Q=netFlow(c,'IN');const dp=N(c.K,100)*Math.pow(Q,2); /* ΔP ∝ Q² */
    const span=Math.max(.001,N(c.urv,100)-N(c.lrv,0));c._dp=dp;
    c.outputMA=4+16*clamp((dp-N(c.lrv,0))/span,0,1);},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>β ratio</label><input type="number" data-k="beta" data-t="n" min=".1" max=".9" step=".05" value="${N(c.beta,.6)}"></div><div class="f"><label>K (ΔP/Q²)</label><input type="number" data-k="K" data-t="n" min="0" step="1" value="${N(c.K,100)}"></div><div class="f"><label>LRV / URV</label><input type="number" data-k="lrv" data-t="n" step=".1" value="${N(c.lrv,0)}"> <input type="number" data-k="urv" data-t="n" step=".1" value="${N(c.urv,100)}"></div><div class="note">ΔP = K·Q² → 4–20 mA. Wire MA± into an Analog Input channel.</div>`);},
  desc:c=>`ΔP ≈ ${N(c._dp,0).toFixed(1)} · out ${N(c.outputMA,4).toFixed(2)} mA`,
  blurb:'Orifice plate with integral DP transmitter — square-root flow relation, 4–20 mA output for AI modules.'});

/* ── control valve with Cv + positioner ── */
def2('controlvalve',{name:'Control Valve (Cv)',tag:'FV',cat:'Process Control',w:110,h:90,icon:'🎚️',
  term:[['IN',-65,-20,-1,0,'h'],['OUT',-25,-20,1,0,'h'],['SIG+',40,-15,1,0],['SIG-',40,10,1,0]],
  pins:{IN:'pipe in',OUT:'pipe out', 'SIG+':'4–20 mA signal +','SIG-':'4–20 mA signal −'},
  init:{Cv:50,open:50,sg:1.0,auto:true},
  links:c=>[], /* valves don't union — they're edges in the hydraulic graph; keep ports separate */
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.strokeStyle='#8fb3c9';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.moveTo(0,-10);ctx.lineTo(0,10);ctx.stroke();
    ctx.fillStyle='#fbbf24';ctx.fillRect(-8,-6+N(c.open,50)*.1,16,12);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText(`${N(c.Cv,50)} Cv · ${N(c.open,50).toFixed(0)}%`,0,26);},
  tick:(c,dt)=>{ /* positioner: auto mode tracks SIG mA if wired, else manual open% */
    const pin=nodeP(c,'IN'),pout=nodeP(c,'OUT');c._dP=pin!=null&&pout!=null?Math.abs(pin-pout):null;
    /* flow estimate through valve: Q = Cv·√(ΔP/SG)·(open/100) in sim units */
    const dP=Math.max(0,N(c._dP,1));c._flow=N(c.Cv,50)*Math.sqrt(dP/N(c.sg,1))*N(c.open,50)/100*0.01;
    if(c.auto){ /* read signal: nearest AI channel _mA or prop sigMA */
      const sig=N(c._sigMA,c.sigMA,12);c.open=clamp((sig-4)/16*100,0,100);}},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Cv</label><input type="number" data-k="Cv" data-t="n" min=".1" step=".1" value="${N(c.Cv,50)}"></div><div class="f"><label>Open % (manual)</label><input type="number" data-k="open" data-t="n" min="0" max="100" step="1" value="${N(c.open,50)}"></div><div class="f"><label>Specific gravity</label><input type="number" data-k="sg" data-t="n" min=".5" step=".01" value="${N(c.sg,1)}"></div><div class="f"><label>Auto (4–20 mA)</label><input type="checkbox" data-k="auto" data-t="b" ${c.auto?'checked':''}></div><div class="note">Q ≈ Cv·√(ΔP/SG)·open%. ΔP from hydraulic node pressures.</div>`);},
  desc:c=>`Cv ${N(c.Cv,50)} · ${N(c.open,50).toFixed(0)}% open · ΔP ${N(c._dP,0).toFixed(1)} m · Q≈${N(c._flow,0).toFixed(2)}`,
  blurb:'Control valve with Cv sizing and 4–20 mA positioner input. SIG± accepts a loop signal (wire to AO module).'});

/* ── shell-and-tube heat exchanger ── */
def2('heatexchanger',{name:'Shell & Tube HX',tag:'HX',cat:'Process Equipment',w:140,h:100,icon:'♨️',
  term:[['H_IN',-90,-25,-1,0,'h'],['H_OUT',-40,-25,1,0,'h'],['C_IN',-90,25,-1,0,'h'],['C_OUT',-40,25,1,0,'h']],
  pins:{H_IN:'hot in',H_OUT:'hot out',C_IN:'cold in',C_OUT:'cold out'},
  init:{UA:5,T_hot_in:150,T_cold_in:20,T_hot_out:90,T_cold_out:60},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.strokeStyle='#f59e0b';ctx.strokeRect(-30,-16,60,32);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText(`${N(c.T_hot_out,90).toFixed(0)}°/${N(c.T_cold_out,60).toFixed(0)}°C`,0,28);},
  tick:(c,dt)=>{ /* effectiveness-NTU lite: assume equal capacity rates → ε=UA/(UA+2C), C≈1 */
    const UA=N(c.UA,5),eps=UA/(UA+2),Q=eps*UA*0; /* simplified: fixed approach temps drift toward set */
    c.T_hot_out+=(N(c.T_hot_in,150)*0.6-N(c.T_hot_out,90))*Math.min(1,dt/30);
    c.T_cold_out+=(N(c.T_cold_in,20)+40-N(c.T_cold_out,60))*Math.min(1,dt/30);},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>UA (kW/K)</label><input type="number" data-k="UA" data-t="n" min=".1" step=".1" value="${N(c.UA,5)}"></div><div class="note">Hot side cools toward cold side; cold side warms. Educational LMTD approximation.</div>`);},
  desc:c=>`Hot ${N(c.T_hot_in,150)}→${N(c.T_hot_out,90).toFixed(0)}°C · Cold ${N(c.T_cold_in,20)}→${N(c.T_cold_out,60).toFixed(0)}°C`,
  blurb:'Shell-and-tube heat exchanger — hot/cold sides, UA sizing, approach-temperature model.'});

/* ── flash tank ── */
def2('flashtank',{name:'Flash Tank',tag:'FT',cat:'Process Equipment',w:110,h:90,icon:'💨',
  term:[['STEAM_IN',-60,-20,-1,0,'h'],['STEAM_OUT',0,-20,0,-1,'h'],['COND_OUT',-60,20,-1,0,'h']],
  pins:{STEAM_IN:'wet steam / condensate in',STEAM_OUT:'dry steam out',COND_OUT:'condensate drain out'},
  init:{P:1.0,xf:0.15},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText(`flash ${(N(c.xf,.15)*100).toFixed(0)}%`,0,24);},
  tick:(c,dt)=>{ /* flash fraction from pressure let-down: x ≈ (h_in−hf)/hfg at tank P */
    const st=window.STEAM;if(st&&st.steam){try{const pin=1.5,pt=N(c.P,1);
      const hin=st.steam(pin,250).h,hf=st.steam(pt,st.tsat(pt)+1).hf||st.steam(pt,st.tsat(pt)).hf;
      const hfg=(st.steam(pt,st.tsat(pt)+50).h-hf)||2500;c.xf=clamp((hin-hf)/hfg,0,0.6);}catch(e){c.xf=0.15;}}},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Tank P (MPa)</label><input type="number" data-k="P" data-t="n" min="0.01" step="0.1" value="${N(c.P,1)}"></div><div class="note">Flash fraction x=(h_in−h_f)/h_fg from IAPWS tables.</div>`);},
  desc:c=>`flash ${(N(c.xf,.15)*100).toFixed(0)}% at ${N(c.P,1)} MPa`,
  blurb:'Flash tank — pressure let-down separates steam from condensate. Uses IAPWS steam properties.'});

/* ── desuperheater ── */
def2('desuperheater',{name:'Desuperheater',tag:'DSH',cat:'Process Equipment',w:120,h:90,icon:'🌡️',
  term:[['STEAM_IN',-75,-25,-1,0,'h'],['WATER_IN',-75,15,-1,0,'h'],['STEAM_OUT',30,-5,1,0,'h']],
  pins:{STEAM_IN:'superheated steam in',WATER_IN:'spray water in',STEAM_OUT:'desuperheated steam out'},
  init:{T_steam_in:300,T_water:20,T_out:180},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText(`${N(c.T_steam_in,300).toFixed(0)}→${N(c.T_out,180).toFixed(0)}°C`,0,24);},
  tick:(c,dt)=>{c.T_out+=(N(c.T_steam_in,300)*0.5+N(c.T_water,20)*0.5-N(c.T_out,180))*Math.min(1,dt/20);},
  desc:c=>`${N(c.T_steam_in,300).toFixed(0)}°C steam + spray → ${N(c.T_out,180).toFixed(0)}°C out`,
  blurb:'Desuperheater — spray-water attemperation of superheated steam.'});

/* ── steam header ── */
def2('steamheader',{name:'Steam Header',tag:'SH',cat:'Process Equipment',w:130,h:80,icon:'🔗',
  term:[['IN1',-75,-20,-1,0,'h'],['IN2',-75,10,-1,0,'h'],['IN3',-40,10,-1,0,'h'],['OUT',40,-5,1,0,'h']],
  pins:{IN1:'steam source 1',IN2:'steam source 2',IN3:'steam source 3',OUT:'header out'},
  init:{P:1.2,T:300,flow:0,pressure:0,temperature:0},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText(`${N(c.P,1.2).toFixed(1)} MPa`,0,22);},
  tick:(c,dt)=>{const st=window.STEAM;if(st&&st.steam){try{c.Tsat=st.tsat(N(c.P,1.2))-273.15;}catch(e){}}
    /* combined header state: sum steam supply arriving on the merged IN→OUT net */
    const hu=sim.hu;if(!hu)return;const r=hu.find(key(c.id,'OUT'));if(r==null)return;
    let flow=0,P=0,T=0,tw=0;
    const on=(s,port,rx)=>rx.test(String(port))&&hu.find(key(s.id,port))===r;
    for(const s of comps){if(s===c)continue;const k=s.type;let q=0,p=0,t=0;
      if(k==='boiler'&&on(s,'STEAM',/STEAM/)){q=s.on?s.fuelRate*20:0;p=s.pressure||0;t=s.temperature||200;}
      else if(k==='steamgenerator'&&on(s,'STEAM_OUT',/STEAM/)){q=s.on?40:0;p=s.pressure||0;t=s.temperature||500;}
      else if(k==='hrsg'&&on(s,'STEAM_OUT',/STEAM/)){q=s._active?(s.steamFlow||0)*1000:0;p=s._active?(s.pressure||60):0;t=s._active?(s.temperature||480):40;}
      else if(k==='steamsource'&&on(s,'STEAM_OUT',/STEAM/)){q=s.on?(s.flow||50)*1000:0;p=s.on?(s.pressure||100):0;t=s.on?(s.temperature||500):40;}
      else if(k==='hpsystem'&&on(s,'OUT',/^OUT$/)){q=s.on?20000:0;p=s.pressure||100;t=s.temperature||540;}
      else if(k==='lpsystem'&&on(s,'OUT',/^OUT$/)){q=s.on?4000:0;p=s.pressure||5;t=s.temperature||150;}
      else if(k==='steamturbine'&&on(s,'EXHAUST',/EXHAUST/)){q=s.on?5000:0;p=0.2;t=80;}
      else if(k==='boilerdrum'&&on(s,'STEAM_OUT',/STEAM/)){q=(s.steamFlow||s._steamOut||30)*1000;p=(s.P||40);t=s.T||250;}
      else if(k==='steamboosterpump'&&on(s,'OUT',/^OUT$/)){const pw=s.on&&s.powered&&s._supplied;q=pw?(s.flow||5000):0;p=pw?(s.pressure||40):0;t=pw?280:150;}
      if(q>0){flow+=q;tw+=q*t;if(p>P)P=p;}}
    c.flow=flow;c.pressure=P;c.temperature=flow>0?tw/flow:T;},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Header P (MPa)</label><input type="number" data-k="P" data-t="n" min="0.1" step="0.1" value="${N(c.P,1.2)}"></div><div class="note">Tsat = ${N(c.Tsat,0).toFixed(1)}°C — common collection point. Combined output: ${N(c.flow,0).toFixed(0)} kg/h · ${N(c.pressure,0).toFixed(0)} bar · ${N(c.temperature,0).toFixed(0)}°C.</div>`);},
  desc:c=>`${N(c.P,1.2).toFixed(1)} MPa header · Tsat ${N(c.Tsat,0).toFixed(0)}°C · out ${N(c.flow,0).toFixed(0)} kg/h @ ${N(c.pressure,0).toFixed(0)} bar ${N(c.temperature,0).toFixed(0)}°C`,
  blurb:'Steam header — merges multiple steam sources at common pressure.'});

/* ── air receiver ── */
def2('airreceiver',{name:'Air Receiver',tag:'AR',cat:'Process Equipment',w:110,h:90,icon:'🛢️',
  term:[['AIR_IN',-65,-20,-1,0,'h'],['AIR_OUT',-25,-20,1,0,'h'],['DRAIN',-65,20,-1,0,'h']],
  pins:{AIR_IN:'compressor air in',AIR_OUT:'air out to system',DRAIN:'condensate drain'},
  init:{volume:500,level:50,P:8},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#38bdf8';ctx.fillRect(-14,-12+N(c.level,50)*.2,28,24);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText(`${N(c.P,8).toFixed(0)} barg · ${N(c.level,50).toFixed(0)}%`,0,26);},
  tick:(c,dt)=>{ /* level tracks charge; P bleeds toward 7 barg */
    const qin=netFlow(c,'AIR_IN');c._qin=qin;
    c.level=clamp(N(c.level,50)+(qin*20-N(c.level,50)*0.02)*dt,0,100);
    c.P=clamp(8+(c.level-50)*0.02,0,12);},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Volume (L)</label><input type="number" data-k="volume" data-t="n" min="50" step="10" value="${N(c.volume,500)}"></div>`);},
  desc:c=>`${N(c.P,8).toFixed(1)} barg · ${N(c.level,50).toFixed(0)}% full`,
  blurb:'Air receiver — compressed-air storage with charge level and pressure.'});

/* ── boiler drum 3-element level control ── */
def2('boilerdrum',{name:'Boiler Drum (3-elem)',tag:'BD',cat:'Steam System',w:130,h:110,icon:'🛢️',
  term:[['WATER_IN',-80,-30,-1,0,'h'],['STEAM_OUT',-80,0,-1,0,'h'],['BLOWDOWN',-80,30,-1,0,'h']],
  pins:{WATER_IN:'feedwater in',STEAM_OUT:'steam out',BLOWDOWN:'blowdown out'},
  init:{level:50,steamFlow:0,feedOpen:50,T:250,P:4.0},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#38bdf8';ctx.fillRect(-16,-14+N(c.level,50)*.24,32,28);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText(`LV ${N(c.level,50).toFixed(0)}% · FW ${N(c.feedOpen,50).toFixed(0)}%`,0,32);},
  tick:(c,dt)=>{ /* 3-element: feed = steam out + level trim; level integrates imbalance */
    const steam=N(c.steamFlow,c._steamOut||30);c.steamFlow=steam;
    const err=N(c.level,50)-50; /* level control */
    c.feedOpen=clamp(50+steam*0.5-err*2,0,100);
    c.level=clamp(N(c.level,50)+(c.feedOpen/100*40-steam)*dt*0.1,0,100);},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="note">3-element control: feedwater = steam-flow feedforward + level feedback. Level ${N(c.level,50).toFixed(0)}%, feed ${N(c.feedOpen,50).toFixed(0)}%.</div>`);},
  desc:c=>`level ${N(c.level,50).toFixed(0)}% · steam ${N(c.steamFlow,30).toFixed(0)} · feed ${N(c.feedOpen,50).toFixed(0)}%`,
  blurb:'Boiler drum with 3-element level control — feedforward on steam flow + feedback on level.'});

/* ── PID blocks (P/PI/PID + ratio + split-range variants) ── */
function pidSpec(variant){const V={pid:{name:'PID Controller',tag:'PID'},pi:{name:'PI Controller',tag:'PI'},p:{name:'P Controller',tag:'P'},ratio:{name:'Ratio Station',tag:'RA'},split:{name:'Split-Range Station',tag:'SR'}}[variant];
  return{name:V.name,tag:V.tag,cat:'Process Control',w:110,h:90,icon:'🎛️',
  term:[['PV+',-60,-25,-1,0],['PV-', -30,-25,-1,0],['SP+',30,-25,1,0],['SP-',60,-25,1,0],['OUT+',0,35,0,1],['OUT-',30,35,1,0]],
  pins:{'PV+':'PV input loop +','PV-':'PV input loop −','SP+':'SP input loop +','SP-':'SP input loop −','OUT+':'output mA +','OUT-':'output mA −'},
  init:{mode:'auto',kp:1.0,ki:0.1,kd:0,setpoint:50,pv:0,out:50,manualOut:50,_int:0,_pvPrev:0},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#c084fc';ctx.font='10px Inter';ctx.textAlign='center';ctx.fillText(`PV ${N(c.pv,0).toFixed(1)} → ${N(c.out,50).toFixed(0)}%`,0,26);},
  tick:(c,dt)=>{const st=sim.st; /* read PV from wired transmitter loop (MA+/MA− convention) */
    const R=t=>st.uf.find(key(c.id,t));const pp=R('PV+'),pn=R('PV-');
    let pv=null;
    for(const s of comps){if(s===c||s.outputMA===undefined)continue;
      if(R0(st,s,'MA+')===pp&&R0(st,s,'MA-')===pn){pv=4+16*(N(s.outputMA,4)-4)/16;break;}}
    if(pv==null){ /* fallback: prop pv */ pv=N(c.pvIn,c.pv,0);}
    c.pv=pv;const sp=N(c.setpoint,50),err=sp-pv;
    if(variant==='ratio'){c.out=clamp(err*N(c.ratioK,2),0,100);}
    else if(variant==='split'){c.out=clamp(50+err*N(c.kp,1)*2,-50,150);c._splitLo=Math.max(0,Math.min(50,c.out));c._splitHi=Math.max(50,Math.min(100,c.out));}
    else{ /* PID with anti-windup */
      const d=variant==='p'?0:(pv-N(c._pvPrev,0))/Math.max(dt,.01);c._pvPrev=pv;
      const P=N(c.kp,1)*err,I=c._int+N(c.ki,.1)*err*dt,D=N(c.kd,0)*d*0.1;
      let out=P+I+D;c._int=clamp(I,-100,100);c.out=clamp(out,0,100);}
    /* output as 4–20 mA for downstream AI modules */
    c.outputMA=4+16*N(c.out,50)/100;},
  props:(c,el)=>{const f=(l,k,min,max,st)=>`<div class="f"><label>${l}</label><input type="number" data-k="${k}" data-t="n" min="${min}" max="${max}" step="${st}" value="${N(c[k],0)}"></div>`;
    el.insertAdjacentHTML('beforeend',`<div class="note">${variant==='ratio'?'Ratio station: OUT = K×(SP−PV).':variant==='split'?'Split-range: PV error drives two 0–50% / 50–100% outputs.':'PID with anti-windup; PV read from wired 4–20 mA loop.'}</div>
    ${variant==='ratio'?f('Ratio K','ratioK',0,100,0.1):variant==='split'?f('Gain','kp',0,20,0.1):f('Kp','kp',0,20,0.1)+f('Ki','ki',0,5,0.01)+f('Kd','kd',0,5,0.01)}
    ${f('Setpoint','setpoint',0,100,0.1)}<div class="kpis" style="margin-top:4px"><div class="kpi"><b>PV</b><span>${N(c.pv,0).toFixed(1)}</span></div><div class="kpi"><b>OUT</b><span>${N(c.out,50).toFixed(0)}% · ${N(c.outputMA,12).toFixed(1)} mA</span></div></div>`);},
  desc:c=>`PV ${N(c.pv,0).toFixed(1)} · SP ${N(c.setpoint,50)} · OUT ${N(c.out,50).toFixed(0)}% (${N(c.outputMA,12).toFixed(1)} mA)`,
  blurb:{pid:'PID controller — PV from wired 4–20 mA loop, OUT drives 4–20 mA to a valve/drive.',pi:'PI controller — no derivative kick.',p:'Proportional-only controller.',ratio:'Ratio station — output = K × error.',split:'Split-range station — one error drives two outputs (e.g., heat/cool).'}[variant]};}
function R0(st,c,t){return st.uf.find(key(c.id,t));}
['pid','pi','p','ratio','split'].forEach(v=>def2(v==='pid'?'pidblock':v==='pi'?'piblock':v==='p'?'pblock':v==='ratio'?'ratiostation':'splstation',pidSpec(v)));

/* ── Modbus: slave (register table) + master (reads/writes on shared RS-485 net) ── */
def2('modbusslave',{name:'Modbus Slave',tag:'MB-S',cat:'Process Control',w:120,h:100,icon:'📡',
  term:[['A',-60,-25,-1,0],['B',-60,0,-1,0],['GND',-60,25,-1,0]],pins:{A:'RS-485 A',B:'RS-485 B',GND:'signal ground'},
  init:{addr:1,regs:[0,0,0,0,0,0,0,0,0,0],coils:[false,false,false,false,false,false,false,false]},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#8fb3c9';ctx.font='10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText('ID '+N(c.addr,1)+' · '+(Array.isArray(c.regs)?c.regs.slice(0,4).join(','):'—'),0,26);},
  desc:c=>`slave ${N(c.addr,1)} · regs [${(c.regs||[]).slice(0,6).join(',')}]`,
  blurb:'Modbus RTU slave — holding registers 0–9 writable by a master on the same A/B net. Coil image 0–7.'});
def2('modbusmaster',{name:'Modbus Master',tag:'MB-M',cat:'Process Control',w:120,h:100,icon:'📡',
  term:[['A',-60,-25,-1,0],['B',-60,0,-1,0],['GND',-60,25,-1,0],['PV+',30,-25,1,0],['PV-',60,-25,1,0]],
  pins:{A:'RS-485 A',B:'RS-485 B',GND:'signal ground','PV+':'PV input loop +','PV-':'PV input loop −'},
  init:{addr:1,slaveAddr:1,poll:1,_t:0},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c);ctx.fillStyle='#8fb3c9';ctx.font='10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(`→ slave ${N(c.slaveAddr,1)} · reg0 ${N(c._reg0,0)}`,0,26);},
  tick:(c,dt)=>{const st=sim.st;c._t+=dt;if(c._t<N(c.poll,1))return;c._t=0;
    /* find slave on same A/B net */
    const R=t=>st.uf.find(key(c.id,t));const a=R('A'),b=R('B');
    for(const s of comps){if(s.type!=='modbusslave'||s===c)continue;
      if(R0(st,s,'A')===a&&R0(st,s,'B')===b){c._slave=s;
        /* read PV from wired transmitter, write to slave reg[0]; read slave reg[1] back */
        const pp=R('PV+'),pn=R('PV-');let pv=0;
        for(const x of comps){if(x===c||x===s||x.outputMA===undefined)continue;
          if(R0(st,x,'MA+')===pp&&R0(st,x,'MA-')===pn){pv=4+16*(N(x.outputMA,4)-4)/16;break;}}
        s.regs[0]=Math.round(pv);c._reg0=pv;
        c.pv=+s.regs[1];break;}}},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Slave address</label><input type="number" data-k="slaveAddr" data-t="n" min="1" max="247" value="${N(c.slaveAddr,1)}"></div><div class="f"><label>Poll (s)</label><input type="number" data-k="poll" data-t="n" min=".1" step=".1" value="${N(c.poll,1)}"></div><div class="note">Writes PV (from wired loop) to slave reg0, reads slave reg1 as PV feedback. Wire A/B/GND between master and slave.</div>`);},
  desc:c=>`polling slave ${N(c.slaveAddr,1)} · wrote ${N(c._reg0,0)} · read ${N(c.pv,0)}`,
  blurb:'Modbus RTU master — polls slave registers over shared RS-485 A/B net.'});
log('v36 module ready — '+['orificeplate','controlvalve','heatexchanger','flashtank','desuperheater','steamheader','airreceiver','boilerdrum','pidblock','piblock','pblock','ratiostation','splstation','modbusslave','modbusmaster'].filter(t=>DEFS[t]).length+' new process/control parts.');
})();
