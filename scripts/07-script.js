
/* ── v12: theme, 3-phase power, solver fixes ── */
(function(){
const PH=new Set(['L','L2','L3']);
const PCOL=['#ffb020','#ff4fa0','#b07cff'];
const SQ3=Math.sqrt(3);
const G3=['generator','gasturbine','steamturbine'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const ratio=r=>{if(typeof r==='string'&&r.includes('/')){const p=r.split('/').map(Number);return p[1]?p[0]/p[1]:1;}return Number(r)||1;};
const safe=f=>function(c){try{f(c);}catch(e){console.warn('draw',e);}};
const AN=()=>window.ANIM||0;

/* ───────── theme ───────── */
const TK='circuitLab.theme';
function applyTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem(TK,t);}catch(e){}
  const b=$('bTheme');if(b)b.textContent=t==='light'?'🌙 Dark':'☀ Light';}
document.querySelector('header').insertAdjacentHTML('beforeend','<div class="tb"><button id="bTheme" title="Switch light / dark theme"></button></div>');
$('bTpl').insertAdjacentHTML('afterend','<button id="bTpl3">★ 3-Φ template</button>');
let t0='dark';try{t0=localStorage.getItem(TK)||(window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');}catch(e){}
applyTheme(t0);
$('bTheme').onclick=()=>applyTheme(document.documentElement.getAttribute('data-theme')==='light'?'dark':'light');

/* ───────── component definitions ───────── */
const CAT3='3-Phase Power';
Object.assign(DEFS,{
 source3:{name:'3-Phase AC Source',tag:'G3',icon:'⚡',cat:CAT3,w:100,h:120,term:[['L1',50,-40,1,0],['L2',50,-20,1,0],['L3',50,0,1,0],['N',50,20,1,0],['PE',0,60,0,1]],init:{on:true,volts:400,freq:50}},
 mcb3:{name:'3P+N Breaker',tag:'QF3',icon:'🔌',cat:CAT3,w:100,h:100,term:[['L1_in',-50,-40,-1,0],['L2_in',-50,-20,-1,0],['L3_in',-50,0,-1,0],['N_in',-50,20,-1,0],['L1_out',50,-40,1,0],['L2_out',50,-20,1,0],['L3_out',50,0,1,0],['N_out',50,20,1,0]],init:{closed:true,tripped:false,rating:32,heat:0,I1:0,I2:0,I3:0}},
 phasetap:{name:'3Φ→1Φ Distribution Board',tag:'DB',icon:'🔀',cat:CAT3,w:170,h:140,term:[['L1',-85,-40,-1,0],['L2',-85,-20,-1,0],['L3',-85,0,-1,0],['N',-85,20,-1,0],['PE',-85,40,-1,0],['F1_L',85,-60,1,0],['F1_N',85,-40,1,0],['F2_L',85,-20,1,0],['F2_N',85,0,1,0],['F3_L',85,20,1,0],['F3_N',85,40,1,0],['PE_out',85,60,1,0]],init:{f1:true,f2:true,f3:true,t1:false,t2:false,t3:false,h1:0,h2:0,h3:0,rating:16,cur1:0,cur2:0,cur3:0}},
 trf3p:{name:'3-Phase Transformer (Dyn11)',tag:'T3',icon:'🔄',cat:CAT3,w:150,h:130,term:[['A',-75,-40,-1,0],['B',-75,0,-1,0],['C',-75,40,-1,0],['a',75,-45,1,0],['b',75,-15,1,0],['c',75,15,1,0],['n',75,45,1,0],['PE',0,65,0,1]],init:{kva:100,group:'Dyn11',active:false,loading:0}},
 trf1p:{name:'1-Phase Isolation Transformer (400/230 V)',tag:'T1',icon:'🔄',cat:CAT3,w:110,h:90,term:[['P1',-55,-20,-1,0],['P2',-55,20,-1,0],['S_L',55,-20,1,0],['S_N',55,20,1,0]],init:{kva:2,secV:230,active:false,loading:0}},
 load3:{name:'3-Phase Load Bank',tag:'LD3',icon:'🔥',cat:CAT3,w:120,h:110,term:[['L1',-60,-30,-1,0],['L2',-60,-10,-1,0],['L3',-60,10,-1,0],['N',-60,30,-1,0]],init:{kw:6,pf:0.9,u1:100,u2:100,u3:100,powered:false,I1:0,I2:0,I3:0,In:0,P1:0,P2:0,P3:0,S1:0,S2:0,S3:0}},
 motor3:{name:'3-Phase Motor',tag:'M3',icon:'⚙️',cat:CAT3,w:130,h:110,term:[['U',-65,-30,-1,0],['V',-65,-10,-1,0],['W',-65,10,-1,0],['PE',0,55,0,1]],init:{hp:5,pf:0.85,eff:0.9,inrush:6,fault:'none',spin:0,powered:false,phaseLoss:false,I:0,rpm:0,startT:0,ang:0,P1:0,P2:0,P3:0,S1:0,S2:0,S3:0,I1:0,I2:0,I3:0}}
});
DEFS.dcmotor={name:'DC Motor',tag:'MD',icon:'⚙️',cat:'Electrical Loads',w:110,h:100,term:[['+',-55,-20,-1,0],['-',-55,20,-1,0]],init:{watts:500,volts:24,eff:0.8,inrush:3,fault:'none',ang:0,startT:0,powered:false,rpm:0,I:0,speedPct:100}};

// power-generation machines are 3-phase as standard
DEFS.generator.term=[['L1',-60,-40,-1,0],['L2',-60,-20,-1,0],['L3',-60,0,-1,0],['N',-60,20,-1,0],['PE',0,50,0,1]];
DEFS.generator.name='3-Phase Generator';DEFS.generator.init.freq=50;DEFS.generator.init.volts=400;
for(const k of ['gasturbine','steamturbine']){const d=DEFS[k];
  d.term=d.term.filter(t=>t[5]==='h').concat([['L1',70,-20,1,0],['L2',70,0,1,0],['L3',70,20,1,0],['N',70,40,1,0],['PE',40,60,0,1]]);
  d.init.freq=50;d.name=(k==='gasturbine'?'Gas Turbine':'Steam Turbine')+' (3-Phase Gen)';}
DEFS.solenoid.init.drive=true;
DEFS.pid.init.drive=false;DEFS.pid.init.act='fill';DEFS.pid.init.manualOut=0;
Object.assign(COMP_BLURB,{
 source3:'3-phase 4-wire grid (L1/L2/L3/N + PE). Line voltage 400 V, phase voltage 230 V. Click to energise / isolate.',
 mcb3:'3-pole + neutral breaker. Trips on thermal overload of the most loaded phase or on a short circuit.',
 phasetap:'Industrial 3Φ→1Φ conversion: each feeder takes ONE phase + neutral (230 V) from the 400 V bus. Spread loads over L1/L2/L3 to keep imbalance under ~10 %.',
 trf3p:'Dyn11 distribution transformer. Delta primary A/B/C, star secondary a/b/c + neutral n. Needs all three primary phases; secondary is galvanically isolated.',
 trf1p:'Single-phase isolation / control transformer. Connect P1–P2 across two phases (400 V) or phase–neutral; S_L/S_N give isolated single-phase supply.',
 load3:'Balanced/unbalanced resistive 3-phase load. Set kW, power factor and per-phase loading to study imbalance and neutral current.',
 motor3:'3-phase induction motor. Needs all three phases; losing one phase (single-phasing) makes it stall and draw high current. Follows a VFD frequency.',
 generator:'3-phase engine generator (L1/L2/L3/N/PE). Start to energise; overload for several seconds trips it.',
 gasturbine:'3-phase gas-turbine generator. GAS_IN gas, EXHAUST out; L1/L2/L3/N/PE are live once at full speed.',
 steamturbine:'3-phase steam-turbine generator. STEAM_IN steam; L1/L2/L3/N/PE are live once at full speed.',
 vfd:'VFD: L1–L3 in, U/V/W out when running. Feeds a 3-phase motor and sets its speed from the frequency.',
 softstart:'Soft starter: L1–L3 in, T1–T3 out when running. Reduces motor inrush.',
 plc:'PLC: powered on L/N. I1/I2 sense live inputs. AUTO: O1 = I1 AND NOT I2; O2 = standby. MANUAL: use buttons.',
 relay:'Relay: coil A1–A2 energised → COM–NO closed, else COM–NC. Click = manual override.',
 ssr:'Solid-state relay: control +/- energised → A1–A2 conducts. Click = manual override.',
 solenoid:'Pilot solenoid: when energised opens the nearest valve (within ~170 px), closes it when de-energised.',
 pid:'PID: PV is the nearest tank level. Enable "Drive nearest control valve" to close the loop.',
 earthrod:'Local earth electrode: provides a PE reference for equipment bonded to it.'
});
const ICO={source3:'<path d="M3 9c2-4 4-4 6 0s4 4 6 0M3 14c2-4 4-4 6 0s4 4 6 0M3 19c2-4 4-4 6 0s4 4 6 0"/><circle cx="20" cy="14" r="1.5"/>',
 mcb3:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7v7M12 7v7M16 7v7"/>',
 phasetap:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h8M3 12h8M3 16h8M11 8l5-2M11 12h5M11 16l5 2"/>',
 trf3p:'<circle cx="7" cy="8" r="3"/><circle cx="7" cy="16" r="3"/><circle cx="17" cy="8" r="3"/><circle cx="17" cy="16" r="3"/><path d="M12 4v16"/>',
 trf1p:'<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M12 6v12"/>',
 load3:'<path d="M3 6h5l1-3 2 6 2-6 2 6 1-3h5M3 12h5l1-3 2 6 2-6 2 6 1-3h5M3 18h5l1-3 2 6 2-6 2 6 1-3h5"/>',
 motor3:'<circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/><text x="8.3" y="13.4" font-size="5" stroke="none" fill="currentColor">M3~</text>'};
for(const k in ICO)ICON[k]=SV(ICO[k]);

/* ───────── migrate old single-phase generator terminals ───────── */
function migrate3p(){
  for(const c of comps)if(G3.includes(c.type)&&c.freq==null){c.freq=50;if(c.type==='generator'&&c.volts==null)c.volts=400;}
  for(const w of wires)for(const e of [w.a,w.b]){const c=getC(e.c);if(c&&G3.includes(c.type)&&e.t==='L')e.t='L1';}
}
migrate3p();
const _lo=loadObj;loadObj=function(o){_lo(o);migrate3p();};

/* ───────── palette ───────── */
(function(){
  const groups=$('componentGroups');if(!groups)return;
  const keys=['source3','mcb3','trf3p','trf1p','phasetap','load3','motor3'],ac='#f59e0b';
  const sec=document.createElement('section');sec.className='palette-group';sec.dataset.category=CAT3;
  sec.innerHTML=`<div class="cat" style="--a:${ac}">${CAT3}</div><div class="grid2">`+keys.map(k=>`<div class="item" draggable="true" style="--a:${ac}" data-type="${k}" title="Drag to board or click to add"><div class="ic">${ICON[k]}</div><div class="nm">${DEFS[k].name}</div></div>`).join('')+'</div>';
  groups.insertBefore(sec,groups.firstChild);
  sec.querySelectorAll('.item').forEach(el=>{
    el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',el.dataset.type));
    el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(el.dataset.type,p.x+n,p.y+n);});
  });
  for(const k of ['generator','gasturbine','steamturbine']){const nm=groups.querySelector(`.item[data-type="${k}"] .nm`);if(nm)nm.textContent=DEFS[k].name;}
  $('componentSearch').dispatchEvent(new Event('input'));
})();

/* ───────── electrical solver extensions ───────── */
const _nc=netColor;netColor=function(t){return t==='L2'?PCOL[1]:t==='L3'?PCOL[2]:_nc(t);};
live=function(st,c,a,b){const x=ntype(st,c,a),y=ntype(st,c,b);if(!x||!y)return false;const px=PH.has(x),py=PH.has(y);
  return (px&&y==='N')||(py&&x==='N')||(px&&py&&x!==y);};

const _cl2=classify;
classify=function(uf){
  const r=_cl2(uf),m=r.m;
  const put=(k,ty)=>{const root=uf.find(k),o=m.get(root);if(!o){m.set(root,ty);return;}if(o===ty)return;
    const oP=PH.has(o),tP=PH.has(ty);if((oP&&tP)||(oP&&ty==='N')||(tP&&o==='N'))r.short=true;else r.bond=true;};
  const k3=(c,t)=>{put(key(c.id,t[0]),'L');put(key(c.id,t[1]),'L2');put(key(c.id,t[2]),'L3');put(key(c.id,t[3]),'N');};
  for(const c of comps){
    if(c.type==='source3'&&c.on){k3(c,['L1','L2','L3','N']);put(key(c.id,'PE'),'PE');}
    else if(c.type==='generator'&&c.on&&num(c.fuel,0)>0){k3(c,['L1','L2','L3','N']);put(key(c.id,'PE'),'PE');}
    else if((c.type==='gasturbine'||c.type==='steamturbine')&&c._gen){k3(c,['L1','L2','L3','N']);put(key(c.id,'PE'),'PE');}
    else if(c.type==='solar'&&num(c.outputPower,0)>0){put(key(c.id,'+'),'L');put(key(c.id,'-'),'N');}
    else if(c.type==='wind'&&num(c.outputPower,0)>0){put(key(c.id,'+'),'L');put(key(c.id,'-'),'N');}
    else if(c.type==='dcsource'&&c.on){put(key(c.id,'+'),'L');put(key(c.id,'-'),'N');}
    else if(c.type==='earthrod')put(key(c.id,'PE'),'PE');
  }
  for(let pass=0;pass<3;pass++){
    for(const c of comps){
      if(c.type==='trf3p'){const ty=['A','B','C'].map(t=>m.get(uf.find(key(c.id,t))));
        const act=ty.every(t=>PH.has(t))&&new Set(ty).size===3;
        if(act&&!c._applied){c._applied=true;k3(c,['a','b','c','n']);}
        if(!act&&c._applied&&pass===0)c._applied=false;c.active=act;}
      else if(c.type==='trf1p'){const x=m.get(uf.find(key(c.id,'P1'))),y=m.get(uf.find(key(c.id,'P2')));
        const act=(PH.has(x)&&(y==='N'||(PH.has(y)&&x!==y)))||(PH.has(y)&&(x==='N'||(PH.has(x)&&x!==y)));
        if(act&&!c._applied){c._applied=true;put(key(c.id,'S_L'),'L');put(key(c.id,'S_N'),'N');}
        if(!act&&c._applied&&pass===0)c._applied=false;c.active=act;}
    }
  }
  for(const c of comps)if(c.type==='trf3p'||c.type==='trf1p')c._applied=false;
  for(const c of comps)if(c.type==='supercap'){
    const a=m.get(uf.find(key(c.id,'+'))),b=m.get(uf.find(key(c.id,'-')));
    if(a==='L'&&b==='N'){c._chg=true;c._dis=false;}
    else{c._chg=false;if(num(c.soc,0)>2){put(key(c.id,'+'),'L');put(key(c.id,'-'),'N');c._dis=true;}else c._dis=false;}
  }
  // Battery / LFP pack supplies DC from OUT terminals when SOC > 0
  for(const bk of packBankList())if(bk.packs.every(x=>Number(x.soc)>0)){
    put(key(bk.top.id,'OUT+'),'L');put(key(bk.bottom.id,'OUT-'),'N');
  }
  // BMS passes pack voltage to P+/P- when discharge MOSFET closed
  for(const c of comps)if(c.type==='bms'&&c.on&&!c.tripped&&c.dsgOk){
    const packL=m.get(uf.find(key(c.id,'PACK+')));
    if(packL==='L'){put(key(c.id,'P+'),'L');put(key(c.id,'P-'),'N');}
  }
  // Inverter / charger: AC output is an independent source when inverting from a live DC bus.
  for(const c of comps)if(c.type==='inverter'&&c.on){
    const dcOk=m.get(uf.find(key(c.id,'DC+')))==='L'&&m.get(uf.find(key(c.id,'DC-')))==='N';
    if(c._bypass){
      if(c.chargeMode){put(key(c.id,'DC+'),'L');put(key(c.id,'DC-'),'N');}
    }else if(dcOk&&c._out!==false){put(key(c.id,'AC_L'),'L');put(key(c.id,'AC_N'),'N');}
  }
  // Hybrid family: inject AC on OUT when unit is on and able to invert
  for(const c of comps)if((c.type==='hybrid'||c.type==='hybridlfp'||c.type==='hybridlfpgt'||c.type==='hybridbms')&&c.on){
    const batLive = (m.get(uf.find(key(c.id,'BAT+')))==='L' && m.get(uf.find(key(c.id,'BAT-')))==='N');
    const pvLive = (m.get(uf.find(key(c.id,'PV+')))==='L' && m.get(uf.find(key(c.id,'PV-')))==='N');
    if(c._bypass==='GRID'||c._bypass==='GEN'){
      if(c.chargeMode&&batLive===false){ /* charging handled by model */ }
      put(key(c.id,'OUT_PE'),'PE');
      // pass-through: LINKS already bridges GRID/GEN to OUT; ensure PE
    }else if(c._out!==false && c.status!=='OVERLOAD TRIP' && c.status!=='OFF'){
      // Inverting path: energise OUT whenever battery or PV DC is present, or model already chose INV
      if(c._src==='INV' || c.mode==='INVERTING' || c.mode==='SOLAR' || c.mode==='BATTERY' ||
         c.mode==='SOLAR + BATTERY' || c.mode==='SOLAR + CHARGE' || c.mode==='STANDBY' ||
         batLive || pvLive || c.canOnline){
        put(key(c.id,'OUT_L'),'L');put(key(c.id,'OUT_N'),'N');put(key(c.id,'OUT_PE'),'PE');
      }
    }
  }
  return r;
};

LINKS.mcb3=c=>c.closed&&!c.tripped?[['L1_in','L1_out'],['L2_in','L2_out'],['L3_in','L3_out'],['N_in','N_out']]:[];
LINKS.phasetap=c=>{const a=[['PE','PE_out']];
  for(let k=1;k<=3;k++)if(c['f'+k]!==false&&!c['t'+k]){a.push(['L'+k,'F'+k+'_L'],['N','F'+k+'_N']);}return a;};
LINKS.vfd=c=>c._real?[['L1','U'],['L2','V'],['L3','W']]:[];
LINKS.softstart=c=>c._real?[['L1','T1'],['L2','T2'],['L3','T3']]:[];
LINKS.relay=c=>c.coilOn?[['COM','NO']]:[['COM','NC']];
LINKS.ssr=c=>c.on?[['A1','A2']]:[];
LINKS.plc=c=>{const a=[];if(c.output1)a.push(['L','O1']);if(c.output2)a.push(['L','O2']);return a;};

evalCircuit=function(){
  updateATSSelection();
  let uf,cl;
  for(let it=0;it<10;it++){
    uf=buildUF();cl=classify(uf);let ch=false;const st={uf,cl};
    if(!cl.short)for(const c of comps){
      if(c.type==='contactor'){const on=c.fault!=='coilopen'&&live(st,c,'A1','A2');if(on!==c.coilOn){c.coilOn=on;ch=true;}}
      else if(c.type==='relay'){const on=!!c.manual||live(st,c,'A1','A2');if(on!==c.coilOn){c.coilOn=on;ch=true;}}
      else if(c.type==='ssr'){const on=!!c.manual||live(st,c,'+','-');if(on!==c.on){c.on=on;ch=true;}}
      else if(c.type==='plc'){const pw=live(st,c,'L','N'),i1=pw&&PH.has(ntype(st,c,'I1')),i2=pw&&PH.has(ntype(st,c,'I2'));
        let o1,o2;if(c.program==='manual'){o1=pw&&!!c.man1;o2=pw&&!!c.man2;}else{o1=i1&&!i2;o2=pw&&!o1;}
        if(i1!==c.input1||i2!==c.input2||o1!==c.output1||o2!==c.output2){c.input1=i1;c.input2=i2;c.output1=o1;c.output2=o2;ch=true;}}
    }
    if(!ch)break;
  }
  return{uf,cl};
};
handleShort=function(){
  const brs=comps.filter(c=>['mcb','rcd','acbreaker','dcbreaker','mcb3'].includes(c.type)&&c.closed&&!c.tripped);
  const ok=[];
  for(const b of brs){b.tripped=true;if(!evalCircuit().cl.short)ok.push(b);b.tripped=false;}
  if(ok.length){ok.sort((a,b)=>(a.rating||99)-(b.rating||99));const b=ok[0];b.tripped=true;log(`⚠ ${b.label} tripped: short circuit`);return;}
  if(brs.length){brs.forEach(b=>b.tripped=true);log('⚠ Short circuit: all breakers tripped');}
};

/* ───────── helpers: valves, consumers, protection ───────── */
function syncValve(c){const fp=num(c.flowPercent,25);
  if(!c.open){if(fp>0){c._fp=fp;c.flowPercent=0;}}
  else if(fp<=0&&c._fp>0){c.flowPercent=c._fp;c._fp=0;}}

function consumers(ufR){
  const st=sim.st,uf=ufR||st.uf,V=sim.volts||230,out=[];
  const rt=(c,t)=>uf.find(key(c.id,t));
  const ph=(c,ts)=>{for(const t of ts)if(PH.has(ntype(st,c,t)))return rt(c,t);return null;};
  const push=(r,I,P,S)=>{if(r!=null&&I>0)out.push({r,I,P,S});};
  for(const c of comps){
    if(c.type==='motor'&&c.powered)push(ph(c,['L','N']),c.I||0,(c.I||0)*V*(c.pf||.8),(c.I||0)*V);
    else if(c.type==='gearpump'&&c.powered&&c.drive!=='shaft')push(ph(c,['L','N']),c.I||0,(c.I||0)*V*(c.pf||.8),(c.I||0)*V);
    else if(c.type==='lamp'&&c.powered)push(ph(c,['a','b']),c.I||0,c.watts,c.watts);
    else if((c.type==='heater'||c.type==='fan')&&c.powered)push(ph(c,['L','N']),c.watts/V,c.watts,c.watts/(c.type==='fan'?.85:1));
    else if(c.type==='load3'&&c.powered)['L1','L2','L3'].forEach((t,k)=>push(rt(c,t),c['I'+(k+1)],c['P'+(k+1)],c['S'+(k+1)]));
    else if(c.type==='acmotor'&&c.powered)push(ph(c,['L','N']),c.I||0,(c.I||0)*V*(c.pf||.8),(c.I||0)*V);
    else if(c.type==='dcmotor'&&c.powered){const r=rt(c,'+');push(r,c.I||0,(c.I||0)*(c.volts||24),(c.I||0)*(c.volts||24));}
    else if(c.type==='motor3'&&(c.powered||c.phaseLoss))['U','V','W'].forEach((t,k)=>push(rt(c,t),c['I'+(k+1)],c['P'+(k+1)],c['S'+(k+1)]));
  }
  return out;
}
function openUF(c,prop){const sv=c[prop];c[prop]=false;let uf;try{uf=buildUF();}finally{c[prop]=sv;}return uf;}
const sumI=(cons,r)=>cons.filter(q=>q.r===r).reduce((a,q)=>a+q.I,0);

function updLoads(dt){
  const st=sim.st,V=230;
  for(const c of comps){
    if(c.type==='load3'){
      const ty=['L1','L2','L3'].map(t=>ntype(st,c,t)),nn=ntype(st,c,'N')==='N';
      const distinct=new Set(ty.filter(t=>PH.has(t))).size===3;
      const pf=clamp(num(c.pf,.9),.3,1),I=[0,0,0];
      ty.forEach((t,k)=>{if(!sim.short&&PH.has(t)&&(nn||distinct))I[k]=(num(c.kw,0)*1000/3)*(num(c['u'+(k+1)],100)/100)/(V*pf);});
      c.I1=I[0];c.I2=I[1];c.I3=I[2];
      c.In=nn?Math.sqrt(Math.max(0,I[0]**2+I[1]**2+I[2]**2-I[0]*I[1]-I[1]*I[2]-I[2]*I[0])):0;
      for(let k=0;k<3;k++){c['P'+(k+1)]=I[k]*V*pf;c['S'+(k+1)]=I[k]*V;}
      c.powered=I.some(x=>x>0);
    }else if(c.type==='motor3'){
      const ty=['U','V','W'].map(t=>ntype(st,c,t)),has=ty.map(t=>PH.has(t));
      const nph=new Set(ty.filter(t=>PH.has(t))).size;
      const full=nph===3&&!sim.short,two=nph===2&&!sim.short;
      let hz=50,soft=false;const rU=st.uf.find(key(c.id,'U'));
      for(const v of comps){if(v.type==='vfd'&&v.on&&st.uf.find(key(v.id,'U'))===rU)hz=num(v.hz,50);
        if(v.type==='softstart'&&v.on&&st.uf.find(key(v.id,'T1'))===rU)soft=true;}
      const was=c.powered;c.powered=full;c.phaseLoss=two;
      const tgt=full&&c.fault!=='stall'?hz/50:0;
      c.spin=num(c.spin,0)+(tgt-num(c.spin,0))*Math.min(1,dt/(soft?4:1.2));
      if(full&&!was)c.startT=0;if(full)c.startT=num(c.startT,0)+dt;
      const Ir=num(c.hp,5)*746/num(c.eff,.9)/(SQ3*400*num(c.pf,.85));
      const mult=c.fault==='stall'?num(c.inrush,6):(c.startT<(soft?4:1.5)?(soft?1.5:num(c.inrush,6)):1);
      const I=full?Ir*mult:two?Ir*3:0;
      c.I=I;c.rpm=Math.round(1440*Math.max(0,c.spin));c.ang=num(c.ang,0)+c.spin*dt*20;
      const pf=num(c.pf,.85);
      ty.forEach((t,k)=>{const on=PH.has(t)&&(full||two);c['I'+(k+1)]=on?I:0;c['S'+(k+1)]=on?I*V:0;c['P'+(k+1)]=on?I*V*pf:0;});
    }
  }
}
function phaseSources(){const a=[];
  for(const c of comps){
    if(c.type==='source3'&&c.on)a.push({c,t:['L1','L2','L3','N'],kind:'3Φ source',VL:num(c.volts,400),f:num(c.freq,50)});
    else if(c.type==='generator'&&c.on&&num(c.fuel,0)>0)a.push({c,t:['L1','L2','L3','N'],kind:'Generator',VL:num(c.volts,400),f:num(c.freq,50),kva:num(c.kva,0)});
    else if((c.type==='gasturbine'||c.type==='steamturbine')&&c._gen)a.push({c,t:['L1','L2','L3','N'],kind:c.type==='gasturbine'?'Gas turbine gen':'Steam turbine gen',VL:400,f:num(c.freq,50),kva:num(c.mw,0)*1250});
    else if(c.type==='trf3p'&&c.active)a.push({c,t:['a','b','c','n'],kind:'Transformer '+c.group,VL:400,f:50,kva:num(c.kva,0)});
  }
  return a;}

window.PM=[];
function post(dt){
  const st=sim.st;if(!st)return;
  const V=sim.volts||230;
  for(const c of comps){
    if(c.type==='heater'||c.type==='fan')c.powered=!sim.short&&live(st,c,'L','N');
    else if(c.type==='ledstrip'||c.type==='solenoid')c.powered=!sim.short&&live(st,c,'+','-');
    else if(c.type==='acmotor'){
      const was=c.powered;c.powered=!sim.short&&live(st,c,'L','N')&&c.fault!=='open';
      if(c.powered&&!was)c.startT=0;if(c.powered)c.startT=(c.startT||0)+dt;
      const Ir=c.hp*746/Math.max(.1,c.eff)/(230*Math.max(.3,c.pf));
      const mult=c.fault==='stall'?c.inrush:(c.startT<1.5?c.inrush:1);
      c.I=c.powered?Ir*mult:0;c.rpm=c.powered?Math.round(1440*(c.fault==='stall'?0.05:1)):0;
      c.ang=(c.ang||0)+(c.powered?dt*20*(c.fault==='stall'?0.2:1):0);
    }else if(c.type==='dcmotor'){
      const was=c.powered;c.powered=!sim.short&&live(st,c,'+','-')&&c.fault!=='open';
      if(c.powered&&!was)c.startT=0;if(c.powered)c.startT=(c.startT||0)+dt;
      const V=c.volts||24;const Ir=(c.watts||500)/Math.max(1,V)/Math.max(.3,c.eff);
      const mult=c.fault==='stall'?c.inrush:(c.startT<0.8?c.inrush:1);
      const sp=Math.max(0,Math.min(1.5,(c.speedPct||100)/100));
      c.I=c.powered?Ir*mult*sp:0;c.rpm=c.powered?Math.round(3000*sp*(c.fault==='stall'?0.05:1)):0;
      c.ang=(c.ang||0)+(c.powered?dt*25*sp*(c.fault==='stall'?0.2:1):0);
    }
    else if(c.type==='vfd'){c.rpm=c.on?Math.round(1440*num(c.hz,50)/50):0;c.torque=c.on?100:0;}
  }
  // solenoids actuate nearest valve
  const VT=['valve','gasvalve','gatevalve','globevalve','ballvalve','butterflyvalve','blowdown'];
  for(const s of comps.filter(x=>x.type==='solenoid'&&x.drive!==false)){
    let best=null,bd=170*170;
    for(const v of comps)if(VT.includes(v.type)){const d=(v.x-s.x)**2+(v.y-s.y)**2;if(d<bd){bd=d;best=v;}}
    if(best){best._sol=s.id;best.open=!!s.powered;}
  }
  // PID
  const tanks=comps.filter(t=>['tank','silo','silopump'].includes(t.type));
  for(const c of comps)if(c.type==='pid'){
    const t=nearest(c,tanks);c.pv=t?t.level:num(c.pv,0);
    if(c.mode==='auto'){
      const e=(c.act==='drain'?-1:1)*(num(c.setpoint,50)-c.pv),ki=Math.max(.01,num(c.ki,1));
      c._i=clamp(num(c._i,0)+e*dt,-100/ki,100/ki);
      const d=dt>0?(e-num(c._e,0))/dt:0;c._e=e;
      c.output=clamp(num(c.kp,0)*e+num(c.ki,0)*c._i+num(c.kd,0)*d,0,100);
    }else c.output=clamp(num(c.manualOut,0),0,100);
    if(c.drive){const v=nearest(c,comps.filter(x=>x.type==='valve'));if(v){v.open=true;v.flowPercent=c.output;v._fp=0;}}
  }
  // CT / VT
  for(const c of comps){
    if(c.type==='ct'){c.primary=live(st,c,'P1','P2')?sim.totalI:0;c.secondary=c.primary/ratio(c.ratio);}
    else if(c.type==='vt'){c.primary=live(st,c,'P1','P2')?V:0;c.secondary=c.primary/ratio(c.ratio);}
    else if(c.type==='supercap'){c.charging=!!c._chg;
      const load=comps.some(l=>(l.type==='ledstrip'||l.type==='solenoid')&&l.powered&&st.uf.find(key(l.id,'+'))===st.uf.find(key(c.id,'+')));
      c.discharging=!!c._dis&&!c._chg&&load;c.voltage=num(c.soc,0)/100*2.7;}
  }
  // charge controller: PV/wind → battery (time compressed ×120)
  for(const cc of comps.filter(x=>x.type==='chargecontroller'&&x.on)){
    const pvR=st.uf.find(key(cc.id,'PV+')),batR=st.uf.find(key(cc.id,'BAT+'));
    let P=0;for(const g of comps)if((g.type==='solar'||g.type==='wind')&&st.uf.find(key(g.id,'+'))===pvR)P+=num(g.outputPower,0);
    const bat=comps.find(b=>b.type==='battery'&&(st.uf.find(key(b.id,'IN+'))===batR||st.uf.find(key(b.id,'OUT+'))===batR));
    if(bat&&P>0&&bat.soc<100){const Vb=Math.max(10,num(bat.voltage,12));
      bat.soc=Math.min(100,bat.soc+(P*.95/Vb)/Math.max(1,num(bat.capacity,100))*100*dt/3600*120);bat.charging=true;bat.discharging=false;}
  }
  // ---- Inverter / charger model ----
  for(const iv of comps.filter(x=>x.type==='inverter')){
    const R=t=>st.uf.find(key(iv.id,t));
    const dcP=R('DC+'),dcN=R('DC-');
    const bat=comps.find(b=>b.type==='battery'&&((st.uf.find(key(b.id,'OUT+'))===dcP&&st.uf.find(key(b.id,'OUT-'))===dcN)||(st.uf.find(key(b.id,'IN+'))===dcP&&st.uf.find(key(b.id,'IN-'))===dcN)));
    const cap=Math.max(1,bat?packAh(bat):100),Vb=Math.max(10,bat?packV(bat):(num(iv.battNom,48)));
    iv._dcW=0;iv._chgW=0;iv.loadW=0;
    if(!iv.on){iv.status='OFF';iv.mode='OFF';iv._bypass=false;iv._out=false;iv.tripped=false;continue;}
    const acIn=live(st,iv,'IN_L','IN_N');
    if(acIn&&iv.acPriority!==false){
      iv._bypass=true;iv._out=true;iv.mode='BYPASS';iv.status='AC PASS-THRU';
      if(iv.chargeMode&&bat){
        if(bat.soc<100){
          const taper=bat.soc<80?1:Math.max(.1,(100-bat.soc)/20);
          const I=num(iv.chargeCurrent,10)*taper;
          bat.soc=Math.min(100,bat.soc+I/cap*100*dt/3600*120);
          iv._chgW=I*Vb/0.9;bat.charging=true;bat.discharging=false;
          iv.mode='CHARGING';iv.status=(bat.soc<80?'BULK ':'ABSORB ')+I.toFixed(1)+' A';
        }else{iv.mode='FLOAT';iv.status='FLOAT (full)';bat.charging=false;}
      }
      continue;
    }
    iv._bypass=false;
    const dcLive=live(st,iv,'DC+','DC-');
    if(!dcLive){iv._out=false;iv.mode='IDLE';iv.status='NO DC INPUT';continue;}
    const lowCut=num(iv.lowCut,10);
    if(bat&&bat.soc<=lowCut){iv._lowLock=true;}
    else if(!bat||bat.soc>=lowCut+10)iv._lowLock=false;
    if(iv._lowLock){iv._out=false;iv.mode='IDLE';iv.status='LOW BATTERY';continue;}
    if(iv.tripped){iv._out=false;iv.mode='FAULT';iv.status='OVERLOAD TRIP';continue;}
    const rA=R('AC_L');
    const Pl=consumers().filter(q=>q.r===rA).reduce((a,q)=>a+q.P,0);
    if(Pl>num(iv.rating,2000)*1.2){iv.tripped=true;iv._out=false;iv.mode='FAULT';iv.status='OVERLOAD TRIP';log(`${iv.label}: overload trip (${Pl.toFixed(0)} W > ${iv.rating} W). Toggle OFF/ON to reset.`);continue;}
    iv._out=true;iv.loadW=Pl;iv.mode='INVERTING';
    iv._dcW=Pl/Math.max(.5,num(iv.efficiency,.92))+15;
    iv.status=Pl>num(iv.rating,2000)?'OVERLOAD WARN':(Pl>0?'INVERTING':'STANDBY');
    if(!sim.volts)sim.volts=230;
  }
  // ---- Hybrid solar inverter model ----
  for(const h of comps.filter(x=>x.type==='hybrid'||x.type==='hybridlfp'||x.type==='hybridlfpgt'||x.type==='hybridbms')){
    const R=t=>st.uf.find(key(h.id,t));
    h._dcW=0;h._chgW=0;h.loadW=0;h.pvW=0;
    if(!h.on){h.status='OFF';h.mode='OFF';h._bypass=null;h._src='NONE';h._out=false;h.tripped=false;h._plHold=0;continue;}
    const bP=R('BAT+'),bN=R('BAT-');
    // Robust pack detection: same net as BAT+/BAT-, via BMS P+/P-, or any pack whose OUT is live on this DC bus
    let bat=comps.find(b=>(b.type==='battery'||b.type==='lfpbattery')&&Number(b.soc)>0&&(
      (st.uf.find(key(b.id,'OUT+'))===bP&&st.uf.find(key(b.id,'OUT-'))===bN)||
      (st.uf.find(key(b.id,'IN+'))===bP&&st.uf.find(key(b.id,'IN-'))===bN)||
      (st.uf.find(key(b.id,'OUT+'))===bP)||(st.uf.find(key(b.id,'OUT-'))===bN)
    ));
    if(!bat){
      const bms=comps.find(m=>m.type==='bms'&&st.uf.find(key(m.id,'P+'))===bP&&st.uf.find(key(m.id,'P-'))===bN);
      if(bms){
        bat=comps.find(b=>(b.type==='battery'||b.type==='lfpbattery')&&Number(b.soc)>0&&(
          st.uf.find(key(b.id,'OUT+'))===st.uf.find(key(bms.id,'PACK+'))||st.uf.find(key(b.id,'OUT-'))===st.uf.find(key(bms.id,'PACK-'))
        ));
        if(bat){h.canOnline=true; if(bms.tripped||!bms.dsgOk){h._lowLock=true;}}
      }
    }
    // Fallback: any LFP/battery with SOC on the board when BAT terminals are electrically live
    const batLive=live(st,h,'BAT+','BAT-');
    if(!bat&&batLive){
      bat=comps.find(b=>(b.type==='battery'||b.type==='lfpbattery')&&Number(b.soc)>0);
    }
    if(bat)bat=bankOf(bat).top; // series bank: operate on the bank's top pack
    if((h.type==='hybridbms'||h.type==='hybridlfp'||h.type==='hybridlfpgt')&&bat){
      h.canOnline=true;
      if(h.type==='hybridbms'){h.bmsStatus=(bat.soc>5&&!h._lowLock)?'OK':'PROTECT';h.chgOk=true;h.dsgOk=!h._lowLock;}
    }
    const cap=Math.max(1,bat?packAh(bat):100),Vb=Math.max(10,bat?bankV(bat):num(iv.battNom,48));
    let pvW=0;{
      const pr=R('PV+'),pn=R('PV-');
      for(const g of comps)if((g.type==='solar'||g.type==='wind')&&num(g.outputPower,0)>0){
        if(st.uf.find(key(g.id,'+'))===pr||st.uf.find(key(g.id,'-'))===pn||st.uf.find(key(g.id,'+'))===pn)pvW+=num(g.outputPower,0);
      }
      // also count if PV terminals are simply connected to any producing array
      if(pvW<1)for(const g of comps)if(g.type==='solar'&&num(g.outputPower,0)>0){
        const wiresHit=wires.some(w=>!w.broken&&((w.a.c===h.id&&(w.a.t==='PV+'||w.a.t==='PV-')&&w.b.c===g.id)||(w.b.c===h.id&&(w.b.t==='PV+'||w.b.t==='PV-')&&w.a.c===g.id)));
        if(wiresHit)pvW+=num(g.outputPower,0);
      }
    }
    h.pvW=pvW;
    const gridLive=live(st,h,'GRID_L','GRID_N'),genLive=h.genMode!=='off'&&live(st,h,'GEN_L','GEN_N');
    const lowCut=num(h.lowCut,10),swSOC=num(h.switchSOC,20);
    if(bat&&bat.soc<=lowCut)h._lowLock=true;else if(!bat||bat.soc>=lowCut+10)h._lowLock=false;
    if(bat&&bat.soc<=swSOC)h._gridHold=true;else if(!bat||bat.soc>=swSOC+20)h._gridHold=false;
    const canInv=(bat&&!h._lowLock&&Number(bat.soc)>0)||pvW>50||batLive;
    let src=null;
    if(h.tripped)src='TRIP';
    else if(gridLive&&(h.priority==='UTI'||h._gridHold||!canInv))src='GRID';
    else if(genLive&&((h._src==='GEN'&&bat&&bat.soc<90)||!canInv||(h.genMode==='auto'&&bat&&bat.soc<=num(h.genStart,30))))src='GEN';
    else if(canInv)src='INV';
    else if(gridLive)src='GRID';
    // With battery or PV present, default to inverting unless grid is forced
    if(!src&&(bat||pvW>50||batLive))src='INV';
    h._src=src||'NONE';h.src=h._src;h._bypass=(src==='GRID'||src==='GEN')?src:null;
    if(h.bmsRequired&&!h.canOnline&&src==='INV'){h._out=false;h.mode='IDLE';h.status='BMS REQUIRED';src=null;h._src='NONE';h.src='NONE';}
    if(src==='INV')h._out=true;
    const rO=R('OUT_L');
    let Pl=consumers().filter(q=>q.r===rO).reduce((a,q)=>a+q.P,0);
    if(h._out===false&&src==='INV')Pl=h._plHold||0;
    let chg=0,pvUse=0;
    h._out=true;
    if(src==='TRIP'){h._out=false;h.mode='FAULT';h.status='OVERLOAD TRIP';}
    else if(!src){h._out=false;h.mode='IDLE';h.status=h._lowLock?'LOW BATTERY':'NO SOURCE';}
    else if(src==='INV'){
      if(Pl>num(h.rating,5000)*1.2){h.tripped=true;h._out=false;h.mode='FAULT';h.status='OVERLOAD TRIP';log(`${h.label}: overload trip (${Pl.toFixed(0)} W > ${h.rating} W). Toggle OFF/ON to reset.`);}
      else{
        const need=Pl/Math.max(.5,num(h.efficiency,.95))+(Pl>0||pvW>0||bat?20:0);
        pvUse=Math.min(pvW,need);const bn=need-pvUse;
        if(bn>1&&(!bat||h._lowLock)){h._out=false;h.mode='IDLE';h.status=bat?'LOW BATTERY':'PV INSUFFICIENT';}
        else{h._plHold=Pl;h.loadW=Pl;h._dcW=bn;chg=pvW-pvUse;
          h.mode=pvUse>=need-1&&pvW>0?(chg>1?'SOLAR + CHARGE':'SOLAR'):(pvUse>1?'SOLAR + BATTERY':'BATTERY');
          h.status=Pl>num(h.rating,5000)?'OVERLOAD WARN':(Pl>0?h.mode:(chg>10||(pvW>50&&bat&&bat.soc<99)?'CHARGING':'STANDBY'));}
      }
    }else{ // GRID or GEN pass-through
      h.loadW=Pl;chg=pvW;h.mode=src==='GRID'?'GRID':'GENERATOR';h.status=h.mode+' PASS-THRU';
    }
    if(bat&&chg>1&&bat.soc<100){const I=Math.min(num(h.maxPV,60),chg*.97/Vb);
      bat.soc=Math.min(100,bat.soc+I/cap*100*dt/3600*120);h._chgW+=I*Vb;}
    if(bat&&h._bypass&&h.chargeMode&&bat.soc<100){
      const taper=bat.soc<80?1:Math.max(.1,(100-bat.soc)/20),I=num(h.chargeCurrent,40)*taper;
      bat.soc=Math.min(100,bat.soc+I/cap*100*dt/3600*120);h._chgW+=I*Vb/0.9;
      h.status+=' · CHG '+I.toFixed(1)+'A';
    }
    if(h._out&&!sim.volts)sim.volts=230;
  }
  updLoads(dt);
  const cons=consumers();
  // energy meter power factor (with PFC capacitors)
  for(const m of comps.filter(x=>x.type==='energymeter')){
    const r=st.uf.find(key(m.id,'L')),rn=st.uf.find(key(m.id,'N'));
    const q=cons.filter(x=>x.r===r||x.r===rn);let P=0,S=0;for(const x of q){P+=x.P;S+=x.S;}
    let pf=S>0?Math.min(1,P/S):1;
    if(S>0){let Qc=0;for(const k of comps)if((k.type==='pfccap'||k.type==='capacitorbank')&&k.connected&&(st.uf.find(key(k.id,'A'))===r||st.uf.find(key(k.id,'A'))===rn))Qc+=num(k.kvar,0)*1000;
      const Q=Math.sqrt(Math.max(0,S*S-P*P));pf=P/Math.sqrt(P*P+(Q-Qc)**2);}
    m.pf=pf;
  }
  // AC/DC V/A/W meters — series meters measure voltage across and current through the path
  for(const m of comps.filter(x=>x.type==='acvawmeter'||x.type==='dcvawmeter')){
    const isAC=m.type==='acvawmeter';
    const tIn=isAC?['L_in','N_in']:['+_in','-_in'];
    const tOut=isAC?['L_out','N_out']:['+_out','-_out'];
    const rIn=st.uf.find(key(m.id,tIn[0]));
    const rInN=st.uf.find(key(m.id,tIn[1]));
    const rOut=st.uf.find(key(m.id,tOut[0]));
    const liveIn=live(st,m,tIn[0],tIn[1]);
    let P=0,I=0,V=0;
    if(liveIn){
      if(isAC){
        V=sim.volts||0;
        if(V<1){
          // hybrid / inverter feeding this net
          for(const h of comps){
            if(isHyb(h)&&h.on&&h._out!==false&&st.uf.find(key(h.id,'OUT_L'))===rIn){V=230;break;}
            if(h.type==='inverter'&&h.on&&h._out!==false&&st.uf.find(key(h.id,'AC_L'))===rIn){V=230;break;}
            if(h.type==='source'&&h.on&&st.uf.find(key(h.id,'L'))===rIn){V=num(h.volts,220);break;}
            if(h.type==='source3'&&h.on&&['L1','L2','L3'].some(t=>st.uf.find(key(h.id,t))===rIn)){V=num(h.volts,400)/Math.sqrt(3);break;}
          }
          if(V<1&&!st.cl.short)V=230;
        }
        // power = sum of loads on the OUT side of the meter (series)
        const cons=consumers();
        P=cons.filter(x=>x.r===rOut).reduce((a,x)=>a+x.P,0);
        // if nothing on OUT, still count loads sharing the IN net (meter may be at end)
        if(P<1)P=cons.filter(x=>x.r===rIn).reduce((a,x)=>a+x.P,0);
        I=V>1?P/V:0;
        m.pf=1;m.freq=50;
      }else{
        // DC voltage: pack, solar estimate, or dcsource
        let pack=findPack(st.uf,rIn,rInN);
        if(pack)V=bankV(pack);
        if(V<1){
          for(const s of comps){
            if(s.type==='dcsource'&&s.on&&st.uf.find(key(s.id,'+'))===rIn){V=num(s.volts,24);break;}
            if(s.type==='solar'&&num(s.outputPower,0)>0&&st.uf.find(key(s.id,'+'))===rIn){
              // operating voltage ~30 V for Si modules, or scaled from power
              V=Math.max(18, Math.min(60, num(s._vBus,0)|| (num(s.outputPower,0)>0?30:0)));
              break;
            }
            if(s.type==='lfpbattery'&&Number(s.soc)>0&&(st.uf.find(key(s.id,'OUT+'))===rIn||st.uf.find(key(s.id,'IN+'))===rIn)){V=packV(s);break;}
            if(s.type==='battery'&&Number(s.soc)>0&&(st.uf.find(key(s.id,'OUT+'))===rIn||st.uf.find(key(s.id,'IN+'))===rIn)){V=num(s.voltage,12);break;}
          }
        }
        if(V<1)V=12;
        // DC power: loads on out net + solar power flowing into this net when meter is series on PV
        let solarP=0;
        for(const s of comps)if(s.type==='solar'&&num(s.outputPower,0)>0&&st.uf.find(key(s.id,'+'))===rIn)solarP+=num(s.outputPower,0);
        for(const s of comps)if(s.type==='wind'&&num(s.outputPower,0)>0&&st.uf.find(key(s.id,'+'))===rIn)solarP+=num(s.outputPower,0);
        // load draw on OUT side
        let loadP=0;
        for(const c of comps){
          if(c.type==='ledstrip'&&c.powered&&st.uf.find(key(c.id,'+'))===rOut)loadP+=c.watts||0;
          if(c.type==='solenoid'&&c.powered&&st.uf.find(key(c.id,'+'))===rOut)loadP+=c.watts||0;
          if(c.type==='dcmotor'&&c.powered&&st.uf.find(key(c.id,'+'))===rOut)loadP+=(c.I||0)*V;
          if((c.type==='inverter'||isHyb(c))&&c._dcW>0){
            const batT=c.type==='inverter'?'DC+':'BAT+';
            if(st.uf.find(key(c.id,batT))===rOut||st.uf.find(key(c.id,batT))===rIn)loadP+=c._dcW||0;
          }
        }
        // series PV meter: if solar on IN and hybrid/load on OUT, power is solar (or load)
        P=Math.max(loadP, (solarP>0&&loadP<1?solarP:loadP));
        // if meter only shunts voltage (OUT open) but solar present, show solar power as available
        if(P<1&&solarP>0)P=solarP;
        I=V>1?P/V:0;
        m.pf=1;m.freq=0;
      }
    }
    m.voltage=V;m.current=I;m.watts=P;
    if(dt>0&&P>0)m.kwh+=(P/1000)*dt/3600;
  }

// mcb3 protection
  for(const b of comps.filter(x=>x.type==='mcb3'&&x.closed&&!x.tripped)){
    const uf2=openUF(b,'closed'),c2=consumers(uf2);
    const I=[1,2,3].map(k=>sumI(c2,uf2.find(key(b.id,'L'+k+'_out'))));
    b.I1=I[0];b.I2=I[1];b.I3=I[2];
    const r=Math.max(...I)/Math.max(1,num(b.rating,32));
    if(r>1)b.heat+=dt*(r*r-1)*.5;else b.heat=Math.max(0,b.heat-dt*.3);
    if(r>8||b.heat>3){b.tripped=true;b.heat=0;log(`⚠ ${b.label} tripped: overcurrent (${Math.max(...I).toFixed(1)} A on worst phase)`);}
  }
  for(const b of comps.filter(x=>x.type==='mcb3'&&!x.closed||x.type==='mcb3'&&x.tripped)){b.I1=b.I2=b.I3=0;}
  // distribution board feeders
  for(const d of comps.filter(x=>x.type==='phasetap')){
    for(let k=1;k<=3;k++){
      if(d['f'+k]===false||d['t'+k]){d['cur'+k]=0;continue;}
      const uf2=openUF(d,'f'+k),c2=consumers(uf2),I=sumI(c2,uf2.find(key(d.id,'F'+k+'_L')));
      d['cur'+k]=I;const r=I/Math.max(1,num(d.rating,16));
      if(r>1)d['h'+k]=num(d['h'+k],0)+dt*(r*r-1)*.4;else d['h'+k]=Math.max(0,num(d['h'+k],0)-dt*.3);
      if(r>8||d['h'+k]>3){d['t'+k]=true;d['h'+k]=0;log(`⚠ ${d.label} feeder F${k} tripped: ${I.toFixed(1)} A`);}
    }
  }
  // 3-phase monitor
  const al=Array.isArray(sim.alarms)?sim.alarms:(sim.alarms=[]);
  const PM=[];
  for(const s of phaseSources()){
    const R=s.t.slice(0,3).map(t=>st.uf.find(key(s.c.id,t)));
    const q=cons.filter(x=>R.includes(x.r));
    const I=R.map(r=>sumI(cons,r)),P=q.reduce((a,x)=>a+x.P,0),S=q.reduce((a,x)=>a+x.S,0);
    const avg=(I[0]+I[1]+I[2])/3,imb=avg>0.05?(Math.max(...I)-avg)/avg*100:0;
    const In=Math.sqrt(Math.max(0,I[0]**2+I[1]**2+I[2]**2-I[0]*I[1]-I[1]*I[2]-I[2]*I[0]));
    const load=s.kva?S/1000/s.kva*100:null;
    PM.push({name:s.c.label,kind:s.kind,VL:s.VL,f:s.f,I,In,imb,P,S,pf:S>0?P/S:1,load});
    if(s.c.type==='trf3p')s.c.loading=load||0;
    if(s.c.type==='generator'){
      if(load>120){s.c._ol=num(s.c._ol,0)+dt;if(s.c._ol>8){s.c.on=false;s.c._ol=0;log(`⚠ ${s.c.label} tripped on overload (${load.toFixed(0)} %)`);}}else s.c._ol=0;
    }
    if(load>100)al.push(['warn',`${s.c.label} overloaded ${load.toFixed(0)} %`]);
    if(imb>15&&avg>.5)al.push(['warn',`${s.c.label}: phase imbalance ${imb.toFixed(0)} %`]);
    al.push(['ok',`${s.c.label}: 3Φ ${s.VL} V live`]);
    if(!sim.volts)sim.volts=230;
  }
  window.PM=PM;
  for(const t of comps.filter(x=>x.type==='trf1p')){const r=st.uf.find(key(t.id,'S_L'));
    const S=cons.filter(x=>x.r===r).reduce((a,x)=>a+x.S,0);t.loading=t.kva?S/1000/t.kva*100:0;if(t.loading>100)al.push(['warn',`${t.label} overloaded`]);}
  for(const m of comps.filter(x=>x.type==='motor3')){
    if(m.phaseLoss)al.push(['bad',`${m.label}: PHASE LOSS – single-phasing`]);
    if(m.powered&&!st.uf.find(key(m.id,'PE'))&&false)0;
    if((m.powered||m.phaseLoss)&&ntype(st,m,'PE')!=='PE')al.push(['warn',`${m.label}: frame not earthed`]);
  }
  for(const d of comps.filter(x=>x.type==='phasetap'))for(let k=1;k<=3;k++)if(d['t'+k])al.push(['bad',`${d.label} FEEDER F${k} TRIPPED`]);
}
const _stepP=step;
function sub(dt){
  try{for(const c of comps){if(c.type==='vfd'||c.type==='softstart'){c._real=!!c.on;c.on=false;}else if(c.type==='valve')syncValve(c);}}catch(e){console.warn(e);}
  try{_stepP(dt);}finally{for(const c of comps)if(c.type==='vfd'||c.type==='softstart')c.on=!!c._real;}
  try{post(dt);}catch(e){console.warn('post',e);}
}
step=function(dt){if(!(dt>0)){sub(0);return;}const n=clamp(Math.ceil(dt/.08),1,6);for(let i=0;i<n;i++)sub(dt/n);};

/* ───────── click actions ───────── */
const _ca=clickAction;
clickAction=function(c){
  if(c.type==='source3'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'energised':'switched off'}`);renderProps();return;}
  if(c.type==='mcb3'){pushUndo();if(c.tripped){c.tripped=false;c.closed=true;c.heat=0;log(`${c.label} reset`);}else{c.closed=!c.closed;log(`${c.label} ${c.closed?'closed':'opened'}`);}renderProps();return;}
  if(c.type==='phasetap'){pushUndo();let any=false;for(let k=1;k<=3;k++)if(c['t'+k]){c['t'+k]=false;c['h'+k]=0;any=true;}log(any?`${c.label} feeders reset`:`${c.label}: no tripped feeders`);renderProps();return;}
  if(c.type==='relay'||c.type==='ssr'){pushUndo();c.manual=!c.manual;log(`${c.label} manual override ${c.manual?'ON':'OFF'}`);renderProps();return;}
  if(c.type==='plc')return;
  if(c.type==='generator'&&!c.on&&num(c.fuel,0)<=0){log(`⚠ ${c.label} has no fuel`);return;}
  _ca(c);
  if(c.type==='valve'){syncValve(c);renderProps();}
};
const _rs=resetSim;
resetSim=function(){_rs();for(const c of comps){
  if(c.type==='mcb3'){c.tripped=false;c.heat=0;}
  if(c.type==='phasetap')for(let k=1;k<=3;k++){c['t'+k]=false;c['h'+k]=0;}
  if(c.type==='motor3'){c.spin=0;c.startT=0;c.powered=false;c.phaseLoss=false;}
  if(c.type==='acmotor'||c.type==='dcmotor'){c.startT=0;c.powered=false;c.rpm=0;c.I=0;}
  if(c.type==='generator')c._ol=0;
  if(c.type==='spd'||c.type==='lightning'){c.status='ok';c.surges=0;}
  if(c.type==='pid'){c._i=0;c._e=0;}}};
$('bReset').onclick=resetSim;

/* ───────── properties extras ───────── */
function surge(s){const st=sim.st;if(!st)return;pushUndo();
  const earthed=ntype(st,s,'PE')==='PE';s.surges=num(s.surges,0)+1;
  if(s.status==='failed'||!earthed){
    let n=0;for(const l of comps)if(l.type==='lamp'&&l.powered){l.fault='open';n++;}
    log(`⚡ Surge at ${s.label}: ${earthed?'protector failed':'protector NOT earthed'} — ${n} lamp(s) damaged`);
  }else{
    if(s.surges>=10)s.status='failed';else if(s.surges>=5)s.status='degraded';
    log(`⚡ Surge diverted to earth by ${s.label} (${s.surges} events, status ${s.status})`);
  }
  renderProps();}
const EX={
 source3:c=>fld('Energised',cI('on',c.on))+fld('Line voltage (V)',nI('volts',c.volts,200,690,10))+fld('Frequency (Hz)',sI('freq',String(c.freq),[['50','50 Hz'],['60','60 Hz']]))+`<div class="note">Phase voltage ${(num(c.volts,400)/SQ3).toFixed(0)} V. Colours: L1 orange · L2 pink · L3 violet · N blue.</div>`,
 mcb3:c=>fld('Trip rating (A)',nI('rating',c.rating,1,630,1))+`<div class="row"><button data-act="click">Toggle / reset</button></div>`,
 phasetap:c=>fld('Feeder 1 (L1–N)',cI('f1',c.f1!==false))+fld('Feeder 2 (L2–N)',cI('f2',c.f2!==false))+fld('Feeder 3 (L3–N)',cI('f3',c.f3!==false))+fld('Feeder rating (A)',nI('rating',c.rating,1,125,1))+`<div class="row"><button data-act="click">Reset tripped feeders</button></div>`,
 load3:c=>fld('Total power (kW)',nI('kw',c.kw,0,500,.5))+fld('Power factor',nI('pf',c.pf,.3,1,.01))+fld('L1 loading (%)',nI('u1',c.u1,0,150,5))+fld('L2 loading (%)',nI('u2',c.u2,0,150,5))+fld('L3 loading (%)',nI('u3',c.u3,0,150,5))+`<div class="note">Connect N to see neutral current from unbalance; without N all three phases must be present.</div>`,
 motor3:c=>fld('Power (HP)',nI('hp',c.hp,.5,200,.5))+fld('Power factor',nI('pf',c.pf,.3,1,.01))+fld('Efficiency',nI('eff',c.eff,.3,1,.01))+fld('Inrush ×',nI('inrush',c.inrush,2,9,.5))+fld('Fault',sI('fault',c.fault,[['none','None'],['stall','Stalled rotor']])),
 trf3p:c=>fld('Rating (kVA)',nI('kva',c.kva,5,5000,5))+fld('Vector group',sI('group',c.group,[['Dyn11','Dyn11 (delta/star)'],['Dyn5','Dyn5'],['Yyn0','Yyn0']]))+`<div class="note">Loading ${num(c.loading,0).toFixed(0)} % · ${c.active?'ENERGISED':'primary not live'}</div>`,
 trf1p:c=>fld('Rating (kVA)',nI('kva',c.kva,.1,100,.1))+fld('Secondary (V)',sI('secV',String(c.secV),[['230','230 V'],['110','110 V'],['24','24 V']]))+`<div class="note">Loading ${num(c.loading,0).toFixed(0)} % · ${c.active?'ENERGISED':'primary not live'}</div>`,
 g3:c=>fld('Frequency (Hz)',sI('freq',String(c.freq||50),[['50','50 Hz'],['60','60 Hz']]))+`<div class="note">3-phase, 4-wire: L1/L2/L3 + N, with PE.</div>`,
 pid:c=>fld('Drive nearest control valve',cI('drive',c.drive))+fld('Action',sI('act',c.act||'fill',[['fill','Fill (open when PV low)'],['drain','Drain (open when PV high)']]))+fld('Manual output (%)',nI('manualOut',c.manualOut||0,0,100,1))+`<div class="note">PV = nearest tank level. Output ${num(c.output,0).toFixed(0)} %.</div>`,
 solenoid:c=>fld('Operate nearest valve',cI('drive',c.drive!==false)),
 plc:c=>`<div class="row"><button data-act="plc1">Toggle O1 (manual)</button><button data-act="plc2">Toggle O2 (manual)</button></div>`,
 spd:c=>`<div class="note">Status ${c.status||'ok'} · surges ${c.surges||0}</div><div class="row"><button data-act="surge">Inject surge</button></div>`,
 lightning:c=>`<div class="note">Status ${c.status||'ok'} · strikes ${c.surges||0}</div><div class="row"><button data-act="surge">Inject strike</button></div>`
};
const _rp=renderProps;
renderProps=function(){
  _rp();
  const c=selected&&selected.kind==='c'?getC(selected.id):null;if(!c)return;
  const f=EX[c.type]||(G3.includes(c.type)?EX.g3:null);
  const el=$('props');
  if(f){const html=f(c);const rows=el.querySelectorAll('.row'),last=rows[rows.length-1];
    if(last)last.insertAdjacentHTML('beforebegin',html);else el.insertAdjacentHTML('beforeend',html);}
  if(c.type==='relay'){const s=el.querySelector('select[data-k="contact"]');if(s&&s.closest('.f'))s.closest('.f').remove();}
};
$('props').addEventListener('click',e=>{const a=e.target.dataset&&e.target.dataset.act,o=selObj();if(!a||!o)return;
  if(a==='plc1'||a==='plc2'){pushUndo();const k='man'+a.slice(3);o[k]=!o[k];o.program='manual';log(`${o.label} output ${a.slice(3)} ${o[k]?'ON':'OFF'} (manual)`);renderProps();}
  else if(a==='surge')surge(o);});

/* ───────── descriptions ───────── */
const _d=describe;
describe=function(c){
  switch(c.type){
    case'source3':return`Status: ${c.on?'ENERGISED':'OFF'}\nLine-line: ${c.volts} V\nLine-neutral: ${(num(c.volts,400)/SQ3).toFixed(0)} V\nFrequency: ${c.freq} Hz`;
    case'mcb3':return`Status: ${c.tripped?'TRIPPED':c.closed?'closed':'open'}\nI1/I2/I3: ${[c.I1,c.I2,c.I3].map(x=>num(x,0).toFixed(1)).join(' / ')} A\nRating: ${c.rating} A\nThermal: ${Math.min(100,c.heat/3*100).toFixed(0)}%`;
    case'phasetap':return[1,2,3].map(k=>`F${k} (L${k}-N): ${c['t'+k]?'TRIPPED':c['f'+k]===false?'off':num(c['cur'+k],0).toFixed(1)+' A'}`).join('\n')+`\nRating: ${c.rating} A per feeder`;
    case'trf3p':return`Group: ${c.group}\nPrimary: ${c.active?'3 phases present':'not live'}\nRating: ${c.kva} kVA\nLoading: ${num(c.loading,0).toFixed(0)}%`;
    case'trf1p':return`Primary: ${c.active?'LIVE':'dead'}\nSecondary: ${c.active?c.secV+' V isolated':'0 V'}\nLoading: ${num(c.loading,0).toFixed(0)}%`;
    case'load3':return`State: ${c.powered?'consuming':'off'}\nI1/I2/I3: ${[c.I1,c.I2,c.I3].map(x=>num(x,0).toFixed(1)).join(' / ')} A\nNeutral: ${num(c.In,0).toFixed(1)} A\nPower: ${((num(c.P1,0)+num(c.P2,0)+num(c.P3,0))/1000).toFixed(2)} kW`;
        case'acmotor':return`State: ${c.powered?(c.startT<1.5?'starting':'running'):'stopped'}\nSpeed: ${Math.round(c.rpm||0)} rpm\nCurrent: ${(c.I||0).toFixed(2)} A\nFLA: ${(c.hp*746/Math.max(.1,c.eff)/(230*Math.max(.3,c.pf))).toFixed(1)} A`;
    case'dcmotor':return`State: ${c.powered?'running':'stopped'}\nSpeed: ${Math.round(c.rpm||0)} rpm\nCurrent: ${(c.I||0).toFixed(2)} A\nVoltage: ${c.volts} V · ${c.watts} W`;
    case'motor3':return`State: ${c.phaseLoss?'SINGLE-PHASING':c.powered?(c.startT<1.5?'starting':'running'):'stopped'}\nSpeed: ${c.rpm} rpm\nLine current: ${num(c.I,0).toFixed(1)} A\nFLA: ${(c.hp*746/c.eff/(SQ3*400*c.pf)).toFixed(1)} A`;
    case'relay':return`Coil: ${c.coilOn?'ENERGISED':'off'}${c.manual?' (manual)':''}\nContact: ${c.coilOn?'COM–NO closed':'COM–NC closed'}`;
    case'ssr':return`Control: ${c.on?'ON':'OFF'}${c.manual?' (manual)':''}\nA1–A2: ${c.on?'conducting':'open'}`;
    case'plc':return`Program: ${c.program}\nI1:${c.input1?'ON':'off'} I2:${c.input2?'ON':'off'}\nO1:${c.output1?'ON':'off'} O2:${c.output2?'ON':'off'}`;
    case'pid':return`Mode: ${c.mode}\nSP: ${c.setpoint}  PV: ${num(c.pv,0).toFixed(1)}\nOutput: ${num(c.output,0).toFixed(1)} %\nDrives valve: ${c.drive?'yes':'no'}`;
    case'spd':case'lightning':return`Status: ${c.status||'ok'}\nEvents: ${c.surges||0}`;

    case'lfpbattery':return`LiFePO4 ${packSeries(c)}S${packParallel(c)}P\nSOC: ${(c.soc||0).toFixed(1)} %\nVoltage: ${packV(c).toFixed(2)} V (nom ${packNomV(c).toFixed(1)} V)\nCapacity: ${packAh(c).toFixed(0)} Ah\nTemp: ${(c.temperature||25).toFixed(1)} °C\n${c.charging?'CHARGING':c.discharging?'DISCHARGING':'IDLE'}`;
    case'bms':return`Status: ${c.status||'OK'}\nPack V: ${(c.packV||0).toFixed(2)} V\nCurrent: ${(c.current||0).toFixed(1)} A\nCharge MOSFET: ${c.chgOk?'OK':'OPEN'}\nDischarge MOSFET: ${c.dsgOk?'OK':'OPEN'}\nCell Δ: ${c.cellDelta||0} mV\nTemp: ${(c.temperature||25).toFixed(1)} °C`;
    case'hybridlfp':case'hybridlfpgt':case'hybridbms':return`Mode: ${c.mode||'OFF'}\nStatus: ${c.status||'STANDBY'}\nSource: ${c.src||c._src||'NONE'}\nLoad: ${Math.round(c.loadW||0)} W\nPV: ${Math.round(c.pvW||0)} W\nBatt: ${c.battNom||48} V LFP`;
    case'acvawmeter':return`AC Meter\nV: ${(c.voltage||0).toFixed(1)} V\nA: ${(c.current||0).toFixed(2)} A\nW: ${(c.watts||0).toFixed(0)} W\nkWh: ${(c.kwh||0).toFixed(3)}\nPF: ${(c.pf||1).toFixed(2)} · ${c.freq||50} Hz`;
    case'dcvawmeter':return`DC Meter\nV: ${(c.voltage||0).toFixed(1)} V\nA: ${(c.current||0).toFixed(2)} A\nW: ${(c.watts||0).toFixed(0)} W\nkWh: ${(c.kwh||0).toFixed(3)}`;
  }
  const s=_d(c);return G3.includes(c.type)?s+'\n3Φ: L1/L2/L3/N/PE · 400 V · '+(c.freq||50)+' Hz':s;
};

/* ───────── drawing ───────── */
const term=(c,ts,cols)=>{};
const bodyBox=(c,w,h,e)=>{body(c,w,h,e);};
DRAW.source3=safe(c=>{const o=c.on;body(c,100,120,o?COL.live:COL.edge);
  for(let k=0;k<3;k++){ctx.beginPath();for(let i=0;i<=36;i++){const x=-34+i*1.6,y=-12+Math.sin(i/36*Math.PI*4-AN()*3*(o?1:0)-k*2.094)*9;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=o?PCOL[k]:COL.off;ctx.lineWidth=2;ctx.stroke();}
  txt(c,c.label,-4,-50,COL.text,10);txt(c,o?`${c.volts} V · ${c.freq} Hz`:'OFF',-4,16,o?COL.live:COL.bad,10,'center',800);
  txt(c,'3Φ 4-wire + PE',-4,32,COL.mut,8);txt(c,'click: on/off',-4,46,COL.mut,8);});
DRAW.mcb3=safe(c=>{const up=c.closed&&!c.tripped;body(c,100,100,c.tripped?COL.bad:up?COL.ok:COL.edge);
  [-40,-20,0,20].forEach((y,i)=>{const col=i<3?PCOL[i]:COL.neu;line([[-50,y],[-30,y]],up?col:COL.off,2);line([[30,y],[50,y]],up?col:COL.off,2);if(up)line([[-30,y],[30,y]],col,2);else line([[-30,y],[18,y-8]],COL.off,2);});
  rr(-10,-46,20,70,3);ctx.fillStyle='#223a58';ctx.fill();rr(-8,up?-44:-4,16,22,2);ctx.fillStyle=c.tripped?COL.bad:up?COL.ok:COL.off;ctx.fill();
  txt(c,c.label,0,-60,COL.text,10);txt(c,`3P+N ${c.rating} A`,0,38,COL.text,9,'center',800);
  txt(c,c.tripped?'TRIPPED':`Imax ${Math.max(num(c.I1,0),num(c.I2,0),num(c.I3,0)).toFixed(1)} A`,0,52,c.tripped?COL.bad:COL.mut,8,'center',800);});
DRAW.phasetap=safe(c=>{body(c,170,140,COL.pe);
  [-40,-20,0,20].forEach((y,i)=>line([[-85,y],[-55,y]],i<3?PCOL[i]:COL.neu,3));line([[-85,40],[-55,40]],COL.pe,3);
  line([[-55,20],[-40,20],[-40,-35]],COL.neu,2);
  for(let k=0;k<3;k++){const yl=-60+k*40,on=c['f'+(k+1)]!==false&&!c['t'+(k+1)],col=PCOL[k];
    line([[-55,-40+k*20],[-30,-40+k*20],[-30,yl],[-6,yl]],col,2.5);
    rr(-6,yl-9,22,18,3);ctx.fillStyle=c['t'+(k+1)]?COL.bad:on?COL.ok:COL.off;ctx.fill();
    txt(c,c['t'+(k+1)]?'TRIP':on?'I':'O',5,yl,'#fff',8,'center',800);
    line([[16,yl],[85,yl]],on?col:COL.off,3);line([[-40,yl+20],[85,yl+20]],on?COL.neu:COL.off,2);
    txt(c,`${num(c['cur'+(k+1)],0).toFixed(1)} A`,52,yl-9,on?col:COL.mut,8,'center',800);}
  line([[-55,40],[-40,40],[-40,60],[85,60]],COL.pe,2);
  txt(c,c.label+' · 3Φ→1Φ',0,-82,COL.text,10);txt(c,`feeders ${c.rating} A`,0,82,COL.mut,8,'center',800);});
DRAW.load3=safe(c=>{const on=c.powered;body(c,120,110,on?COL.warn:COL.edge);
  [-30,-10,10].forEach((y,i)=>line([[-60,y],[-34,y]],PCOL[i],2));line([[-60,30],[34,30]],COL.neu,2);
  for(let k=0;k<3;k++){const y=-30+k*20,col=on?PCOL[k]:COL.off;line([[-34,y],[-26,y],[-20,y-6],[-10,y+6],[0,y-6],[10,y+6],[18,y]],col,2);line([[18,y],[34,y]],col,2);}
  line([[34,-30],[34,30]],on?COL.neu:COL.off,2);
  txt(c,c.label+' · '+c.kw+' kW',0,-62,COL.text,10);
  txt(c,on?`${num(c.I1,0).toFixed(1)}/${num(c.I2,0).toFixed(1)}/${num(c.I3,0).toFixed(1)} A`:'OFF',0,50,on?COL.warn:COL.mut,9,'center',800);
  if(on&&num(c.In,0)>.05)txt(c,`N ${c.In.toFixed(1)} A`,0,62,COL.neu,8,'center',800);});
DRAW.acmotor=safe(c=>{const on=c.powered;body(c,110,100,on?COL.ok:COL.edge);
    ctx.beginPath();ctx.arc(5,0,32,0,7);ctx.fillStyle='#0c1a2a';ctx.fill();ctx.strokeStyle=on?COL.ok:COL.edge;ctx.lineWidth=3;ctx.stroke();
    ctx.save();ctx.translate(5,0);ctx.rotate(num(c.ang,0));for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);line([[0,0],[0,-22]],on?COL.ok:COL.off,3);}ctx.restore();
    ctx.beginPath();ctx.arc(5,0,6,0,7);ctx.fillStyle=on?COL.ok:COL.off;ctx.fill();
    line([[0,50],[0,32]],COL.pe,3);
    txt(c,`${c.label} · ${c.hp} HP`,0,-52,COL.text,9);txt(c,on?`${Math.round(c.rpm||0)} rpm`:'STOPPED',5,48,on?COL.ok:COL.mut,9,'center',800);
    if(on)txt(c,`${(c.I||0).toFixed(1)} A`,5,60,COL.warn,8,'center',800);});
DRAW.dcmotor=safe(c=>{const on=c.powered;body(c,110,100,on?COL.ok:COL.edge);
    ctx.beginPath();ctx.arc(5,0,32,0,7);ctx.fillStyle='#0c1a2a';ctx.fill();ctx.strokeStyle=on?'#2ec4b6':COL.edge;ctx.lineWidth=3;ctx.stroke();
    ctx.save();ctx.translate(5,0);ctx.rotate(num(c.ang,0));for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);line([[0,0],[0,-22]],on?'#2ec4b6':COL.off,3);}ctx.restore();
    ctx.beginPath();ctx.arc(5,0,6,0,7);ctx.fillStyle=on?'#2ec4b6':COL.off;ctx.fill();
    txt(c,`${c.label} · ${c.watts} W`,0,-52,COL.text,9);txt(c,on?`${Math.round(c.rpm||0)} rpm`:'STOPPED',5,48,on?COL.ok:COL.mut,9,'center',800);
    if(on)txt(c,`${(c.I||0).toFixed(1)} A DC`,5,60,COL.warn,8,'center',800);});
DRAW.motor3=safe(c=>{const on=c.powered;body(c,130,110,c.phaseLoss?COL.bad:on?COL.ok:COL.edge);
  [-30,-10,10].forEach((y,i)=>line([[-65,y],[-35,y]],PCOL[i],2.5));
  ctx.beginPath();ctx.arc(10,0,38,0,7);ctx.fillStyle='#0c1a2a';ctx.fill();ctx.strokeStyle=on?COL.ok:COL.edge;ctx.lineWidth=3;ctx.stroke();
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line([[10+Math.cos(a)*30,Math.sin(a)*30],[10+Math.cos(a)*42,Math.sin(a)*42]],'#4a6a8a',2);}
  ctx.save();ctx.translate(10,0);ctx.rotate(num(c.ang,0));for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);line([[0,0],[0,-26]],on?COL.ok:COL.off,4);}ctx.restore();
  ctx.beginPath();ctx.arc(10,0,7,0,7);ctx.fillStyle=on?COL.ok:COL.off;ctx.fill();
  if(on)glow(10,0,48,'rgba(6,214,160,.25)');
  line([[0,55],[0,38]],COL.pe,3);
  txt(c,`${c.label} · ${c.hp} HP`,0,-60,COL.text,10);
  txt(c,c.phaseLoss?'SINGLE-PHASING':on?`${c.rpm} rpm`:'STOPPED',10,66,c.phaseLoss?COL.bad:on?COL.ok:COL.mut,9,'center',800);
  if(on||c.phaseLoss)txt(c,`${num(c.I,0).toFixed(1)} A`,10,78,COL.warn,8,'center',800);});
function coilPair(x,y,on){for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x,y-18+i*12,6,-Math.PI/2,Math.PI/2);ctx.strokeStyle=on?'#d99a4a':'#7a8795';ctx.lineWidth=2.5;ctx.stroke();}}
DRAW.trf3p=safe(c=>{const on=c.active;body(c,150,130,on?COL.ok:COL.edge);
  [-40,0,40].forEach((y,i)=>line([[-75,y],[-50,y]],PCOL[i],2.5));[-45,-15,15].forEach((y,i)=>line([[50,y],[75,y]],on?PCOL[i]:COL.off,2.5));line([[50,45],[75,45]],on?COL.neu:COL.off,2.5);
  for(let k=0;k<3;k++){const x=-24+k*24;coilPair(x-6,-4+(k-1)*0,on);ctx.fillStyle=on?'#6e8197':'#445';ctx.fillRect(x+3,-34,3,60);}
  txt(c,c.label,0,-78,COL.text,10);txt(c,`${c.group} · ${c.kva} kVA`,0,-62,COL.mut,8,'center',800);
  rr(-40,50,80,6,3);ctx.fillStyle='#0a141f';ctx.fill();const l=clamp(num(c.loading,0)/100,0,1);rr(-40,50,80*l,6,3);ctx.fillStyle=c.loading>100?COL.bad:COL.ok;ctx.fill();
  txt(c,`load ${num(c.loading,0).toFixed(0)}%`,0,70,on?COL.ok:COL.mut,8,'center',800);});
DRAW.trf1p=safe(c=>{const on=c.active;body(c,110,90,on?COL.ok:COL.edge);
  line([[-55,-20],[-30,-20]],COL.mut,2.5);line([[-55,20],[-30,20]],COL.mut,2.5);line([[30,-20],[55,-20]],on?PCOL[0]:COL.off,2.5);line([[30,20],[55,20]],on?COL.neu:COL.off,2.5);
  coilPair(-12,0,on);coilPair(12,0,on);line([[0,-30],[0,30]],'#6e8197',3);
  txt(c,c.label,0,-56,COL.text,10);txt(c,`1Φ ${c.kva} kVA · 400/${c.secV} V`,0,56,on?COL.ok:COL.mut,8,'center',800);});
for(const k of G3){const f=DRAW[k];DRAW[k]=safe(c=>{f(c);txt(c,'3Φ · 400 V · '+(c.freq||50)+' Hz',k==='generator'?0:44,k==='generator'?30:-56,COL.live,8,'center',800);});}

/* ───────── hover tip for L2/L3 ───────── */
window.addEventListener('mousemove',()=>{const tip=$('tip');if(!hoverTerm||tip.style.display==='none')return;const c=getC(hoverTerm.c),st=sim.st;if(!c||!st)return;
  const ty=st.cl.m.get(st.uf.find(key(c.id,hoverTerm.t)));
  if(ty==='L2'||ty==='L3')tip.textContent=`${c.label}.${hoverTerm.t} — LIVE phase ${ty} (230 V to N, 400 V to other phases)`;});

/* ───────── 3-phase monitor card + docs ───────── */
(function(){
  const pc=$('props').closest('.card');const card=document.createElement('div');card.className='card';card.id='pm3';
  card.innerHTML='<h2>3-phase monitor</h2><div class="bd" id="pm3body"></div>';pc.parentNode.insertBefore(card,pc);
  setInterval(()=>{const b=$('pm3body'),P=window.PM||[];
    if(!P.length){b.innerHTML='<div class="note">No 3-phase source energised. Add a 3-Phase AC Source, generator, turbine or Dyn11 transformer.</div>';return;}
    b.innerHTML=P.map(p=>`<div class="pm"><b>${esc(p.name)}</b> · ${esc(p.kind)}<br>L–L ${p.VL} V · L–N ${(p.VL/SQ3).toFixed(0)} V · ${p.f} Hz<br>I: <span class="p1">${p.I[0].toFixed(1)}</span> / <span class="p2">${p.I[1].toFixed(1)}</span> / <span class="p3">${p.I[2].toFixed(1)}</span> A · N ${p.In.toFixed(1)} A<br>Imbalance <span class="${p.imb>10?'bad':'okc'}">${p.imb.toFixed(0)} %</span> · ${(p.P/1000).toFixed(2)} kW · ${(p.S/1000).toFixed(2)} kVA · PF ${p.pf.toFixed(2)}${p.load!=null?`<br>Loading <span class="${p.load>100?'bad':'okc'}">${p.load.toFixed(0)} %</span>`:''}</div>`).join('');},300);
  const ol=document.querySelector('#procedure ol');
  if(ol)ol.insertAdjacentHTML('beforeend','<li><b>3-phase:</b> 3-Phase Source/Generator L1–L3,N → 3P+N Breaker → Distribution Board (3Φ→1Φ). Each feeder gives 230 V single-phase (phase + neutral); balance loads across feeders. Use Dyn11 for isolation and the 1Φ isolation transformer for L–L control supplies. Motors/VFDs use L1–L3, PE bonded.</li>');
  const ft=document.querySelector('#flowText .bd .note');
  if(ft)ft.insertAdjacentHTML('beforebegin','<div class="flowline"><span>3-Phase</span> Gen/Source → 3P Breaker → Dyn11 / Board → 1Φ feeders &amp; motors</div>');
})();

/* ───────── 3-phase template ───────── */
function loadTemplate3p(){
  pushUndo();comps=[];wires=[];nextId=1;selected=null;
  const add=(t,x,y,r,ex)=>{const c=newComp(t,x,y,r||0);Object.assign(c,ex||{});comps.push(c);return c;};
  const L=(a,ta,b,tb,pts)=>wires.push({id:nextId++,a:{c:a.id,t:ta},b:{c:b.id,t:tb},pts:pts||[],bend:0,broken:false});
  const S=add('source3',120,200,0,{label:'Grid'}),Q=add('mcb3',330,200,0,{label:'QF3'}),T=add('phasetap',620,230,0,{label:'DB1'});
  const H1=add('lamp',900,150,0,{label:'H1'}),HT=add('heater',920,270,0,{label:'HT1',watts:2000}),FN=add('fan',920,380,0,{label:'FAN1',watts:300}),LD=add('load3',540,450,0,{label:'Bank',kw:6});
  L(S,'L1',Q,'L1_in');L(S,'L2',Q,'L2_in');L(S,'L3',Q,'L3_in');L(S,'N',Q,'N_in');
  L(Q,'L1_out',T,'L1');L(Q,'L2_out',T,'L2');L(Q,'L3_out',T,'L3');L(Q,'N_out',T,'N');
  L(S,'PE',T,'PE',[{x:120,y:330},{x:480,y:330},{x:480,y:270}]);
  L(T,'F3_L',FN,'L',[{x:860,y:250},{x:860,y:360}]);L(T,'F3_N',FN,'N',[{x:790,y:270},{x:790,y:400}]);
  L(Q,'L1_out',LD,'L1',[{x:410,y:160},{x:410,y:420}]);L(Q,'L2_out',LD,'L2',[{x:420,y:180},{x:420,y:440}]);
  L(Q,'L3_out',LD,'L3',[{x:430,y:200},{x:430,y:460}]);L(Q,'N_out',LD,'N',[{x:440,y:220},{x:440,y:480}]);
  renderProps();fit();log('Loaded 3-phase template: grid → 3P breaker → distribution board (3Φ→1Φ feeders) + balanced load bank.');
}
$('bTpl3').onclick=loadTemplate3p;

// Ensure motors & late components appear in palette
(function(){
  const groups=$('componentGroups'); if(!groups)return;
  const need=['acmotor','dcmotor','motor3','hybridbms','hybridlfp','hybridlfpgt','lfpbattery','bms','acvawmeter','dcvawmeter'];
  const ac='#38bdf8';
  for(const k of need){
    if(!DEFS[k])continue;
    if(groups.querySelector('.item[data-type="'+k+'"]'))continue;
    let sec=[...groups.querySelectorAll('.palette-group')].find(s=>s.dataset.category===DEFS[k].cat);
    if(!sec){
      sec=document.createElement('section'); sec.className='palette-group'; sec.dataset.category=DEFS[k].cat;
      sec.innerHTML='<div class="cat" style="--a:'+ac+'">'+DEFS[k].cat+'</div><div class="grid2"></div>';
      groups.appendChild(sec);
    }
    const grid=sec.querySelector('.grid2');
    const el=document.createElement('div');
    el.className='item'; el.draggable=true; el.dataset.type=k; el.style.setProperty('--a',ac);
    el.title='Drag to board or click to add';
    el.innerHTML='<div class="ic">'+(ICON[k]||DEFS[k].icon||'⚙️')+'</div><div class="nm">'+DEFS[k].name+'</div>';
    el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',k));
    el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(k,p.x+n,p.y+n);});
    grid.appendChild(el);
  }
  const search=$('componentSearch'); if(search)search.dispatchEvent(new Event('input'));
})();

renderProps();
log('v14: Hybrid Solar Inverter (PV/BAT/GRID/GEN/LOAD). v13: inverter/charger + battery net-power model. v12: light/dark theme, 3-phase generation, 3Φ→1Φ conversion components and solver fixes loaded.');
})();

