
/* ── v5: process network (gas / steam / water supply), turbine spool-up, turbine-fed electrical circuit ── */
(function(){
function portClass(c,t){if(INSTRUMENT_TYPES.has(c.type))return'any';const d=DEFS[c.type],n=String(t).toUpperCase(),cat=d.cat||'';
  if(c.type==='airsupply')return'air';if(c.type==='fluestack')return'flue';if(c.type==='steamboosterpump')return'steam';if(c.type==='gasboosterpump')return'gas';
  if(c.type==='feedwatertank'||c.type==='feedwaterpump'||c.type==='coolingtower')return'water';
  if(c.type==='gasturbine'&&n==='EXHAUST')return'flue';if(c.type==='steamturbine'&&n==='EXHAUST')return'steam';
  if(c.type==='steamtrap'&&n==='COND')return'water';
  if(/STEAM/.test(n))return'steam';if(/GAS|FUEL|LPG/.test(n))return'gas';if(/AIR/.test(n))return'air';
  if(/FLUE|EXHAUST|HEAT|FLAME/.test(n))return'flue';if(/WATER|COND|RETURN/.test(n))return'water';
  if(/Gas/.test(cat))return'gas';if(/Steam/.test(cat))return'steam';if(/Hydraulic/.test(cat))return'water';return'any';}
window.pipeClass=w=>{const a=getC(w.a.c),b=getC(w.b.c);const x=a?portClass(a,w.a.t):'any',y=b?portClass(b,w.b.t):'any';return x!=='any'?x:y!=='any'?y:'water';};
/* wiring rules: join by fluid, not by category name */
addWire=function(a,b,pts){if(a.c===b.c&&a.t===b.t)return;
  if(tkind(a)!==tkind(b)){log('⚠ Cannot join an electrical terminal to a hydraulic port.');return;}
  if(tkind(a)==='h'){const x=portClass(getC(a.c),a.t),y=portClass(getC(b.c),b.t);
    if(x!=='any'&&y!=='any'&&x!==y){log(`⚠ Cannot join a ${x} port to a ${y} port.`);return;}}
  if(wires.some(w=>(w.a.c===a.c&&w.a.t===a.t&&w.b.c===b.c&&w.b.t===b.t)||(w.a.c===b.c&&w.a.t===b.t&&w.b.c===a.c&&w.b.t===a.t)))return;
  pushUndo();const w={id:nextId++,a:{c:a.c,t:a.t},b:{c:b.c,t:b.t},pts:pts||[],bend:0,broken:false,color:tkind(a)==='h'?'#59c3ff':'#ff9f1c',style:'industrial',trace:true};wires.push(w);
  log(`${tkind(a)==='h'?'Pipe':'Wire'} ${getC(a.c).label}.${a.t} → ${getC(b.c).label}.${b.t}`);selected={kind:'w',id:w.id};renderProps();};
/* parts that pass fluid straight through (when open / running) */
const P1=[['IN','OUT']],OPEN=c=>c.open?P1:[],ON=c=>c.on?P1:[];
const CMP=new Set(['aircompressor1','aircompressor2','gascompressor1','gascompressor2']);
const PA=[['AIR_IN','AIR_OUT']],PG=[['GAS_IN','GAS_OUT']],PCMP=c=>c.on&&c.powered?PA:[],PGCMP=c=>c.on&&c.powered?PG:[];
const PASS={steampipe:()=>P1,expansionjoint:()=>P1,flange:()=>P1,gasket:()=>P1,reducer:()=>P1,elbow90:()=>P1,elbow45:()=>P1,teejoint:()=>[['IN','OUT1','OUT2']],tee:()=>[['t','r','b','l']],
  flowmeter:()=>P1,rotameter:()=>P1,filter:c=>c.clogged?[]:P1,valve:c=>(c.flowPercent??25)>0?[['a','b']]:[],manifold:()=>[['IN','OUT1','OUT2','OUT3']],
  gasfilter:c=>c.clogged?[]:P1,gasmeter:()=>P1,pressureregulator:()=>P1,lpsystem:()=>P1,hpsystem:()=>P1,feedwatertank:()=>[['IN','OUT','RETURN']],steamseparator:()=>[['IN','STEAM','WATER']],
  gasvalve:OPEN,gatevalve:OPEN,globevalve:OPEN,ballvalve:OPEN,butterflyvalve:OPEN,blowdown:OPEN,steamtrap:c=>c.open?[['IN','OUT','COND']]:[],
  gascompressor:c=>c.on&&c.powered?P1:[],aircompressor1:PCMP,aircompressor2:PCMP,gascompressor1:PGCMP,gascompressor2:PGCMP,feedwaterpump:c=>c.on&&c.powered?P1:[],gasboosterpump:c=>c.on&&c.powered?P1:[],steamboosterpump:c=>c.on&&c.powered?P1:[],economizer:()=>[['WATER_IN','WATER_OUT'],['FLUE_IN','FLUE_OUT']],superheater:()=>[['STEAM_IN','STEAM_OUT'],['FLUE_IN','FLUE_OUT']],reheater:()=>[['STEAM_IN','STEAM_OUT'],['FLUE_IN','FLUE_OUT']],
  deaerator:()=>[['STEAM_IN','WATER_OUT']],steamheader:()=>[['IN1','IN2','IN3','OUT']],desuperheater:()=>[['STEAM_IN','STEAM_OUT']],flashtank:()=>[['STEAM_IN','STEAM_OUT']],airreceiver:()=>[['AIR_IN','AIR_OUT']]};
window.PASSMAP=PASS;
PASS.motor=c=>(c.powered&&!c.cutout&&(Number(c.flow)||0)>0)?[['SUC','DIS']]:[];
let PR=null;
function solve(dt){
  // Electrically driven process equipment cannot run merely because its Run command is latched.
  // Feedwater pump requires a real live/neutral circuit across its M/N terminals.
  const electricalState=evalCircuit();
  for(const c of comps)if(c.type==='feedwaterpump'||c.type==='gascompressor'||c.type==='gasboosterpump'||c.type==='steamboosterpump')c.powered=!!live(electricalState,c,'M','N')&&!electricalState.cl.short;
  for(const c of comps)if(c.type==='airsupply')c.powered=!c.unlimited&&!electricalState.cl.short&&!!live(electricalState,c,'L','N')&&c.fault!=='open'&&!c.cutout;
  for(const c of comps)if(CMP.has(c.type))c.powered=!!c._shaftRun;
  const uf=makeUF();for(const w of wires)if(isPipe(w)&&!w.broken)uf.union(key(w.a.c,w.a.t),key(w.b.c,w.b.t));
  for(const c of comps){const f=PASS[c.type];if(f)for(const g of f(c))for(let i=1;i<g.length;i++)uf.union(key(c.id,g[0]),key(c.id,g[i]));}
  const S=new Map(),cons=new Set();
  const add=(c,t,k)=>{const r=uf.find(key(c.id,t));let s=S.get(r);if(!s)S.set(r,s=new Set());if(s.has(k))return false;s.add(k);return true;};
  const has=(c,t,k)=>{const s=S.get(uf.find(key(c.id,t)));return!!s&&s.has(k);};
  const use=(c,t)=>cons.add(uf.find(key(c.id,t)));
  let ch=true,n=0;
  while(ch&&n++<14){ch=false;for(const c of comps){const T=c.type;let r=false;
    if((T==='gaswell'||T==='naturalgas')&&c.on)r=add(c,'OUT','gas');
    else if(T==='lpgtank'&&c.level>0)r=add(c,'OUT','gas');
    else if(T==='airsupply'&&airReady(c))r=add(c,'OUT','air');
    else if(T==='gasturbine'&&c.on&&Number(c.fuel)>0&&has(c,'GAS_IN','gas')&&has(c,'AIR_IN','air'))r=add(c,'EXHAUST','flue');
    else if(T==='steamsource'&&c.on)r=add(c,'STEAM_OUT','steam');
    else if(T==='sump'&&c.level>0)r=add(c,'OUT','water');
    else if(T==='tank'&&c.level>3)r=add(c,'OUT','water');
    else if(T==='feedwatertank'&&c.level>5)r=add(c,'OUT','water');
    else if(T==='boiler'&&c.on&&has(c,'FUEL','gas')&&has(c,'WATER','water'))r=add(c,'STEAM','steam');
    else if(T==='steamgenerator'&&c.on&&has(c,'FUEL_IN','gas')&&has(c,'WATER_IN','water'))r=add(c,'STEAM_OUT','steam');
    else if(T==='condenser'&&has(c,'STEAM_IN','steam')&&has(c,'WATER_IN','water'))r=add(c,'CONDENSATE','water');
    else if(T==='deaerator'&&has(c,'STEAM_IN','steam')&&has(c,'WATER_IN','water'))r=add(c,'WATER_OUT','water');
    else if(T==='burner'&&c.on&&has(c,'GAS_IN','gas')&&has(c,'AIR_IN','air'))r=add(c,'FLAME_OUT','flue');
    else if(T==='combustionchamber'&&c.on&&has(c,'FUEL_IN','gas')&&has(c,'AIR_IN','air'))r=add(c,'FLAME_OUT','flue');
    else if(T==='furnace'&&c.on&&has(c,'FUEL_IN','gas')&&has(c,'AIR_IN','air'))r=add(c,'HEAT_OUT','flue');
    else if(T==='lpsystem'&&c.on)r=add(c,'OUT','water');
    else if(T==='hpsystem'&&c.on)r=add(c,'OUT','steam');
    else if(T==='steamtrap'&&c.open&&has(c,'IN','steam'))r=add(c,'COND','water');
    else if(T==='steamturbine'&&c.on&&(c._spool||0)>.15&&has(c,'STEAM_IN','steam'))r=add(c,'EXHAUST','steam');
    else if(T==='hrsg'){let a=false,b=false;if(has(c,'FLUE_IN','flue')){a=add(c,'FLUE_OUT','flue');if(has(c,'WATER_IN','water')&&comps.some(s=>s.type==='fluestack'&&uf.find(key(s.id,'FLUE_IN'))===uf.find(key(c.id,'FLUE_OUT'))))b=add(c,'STEAM_OUT','steam');}r=a||b;}
    if(r)ch=true;}}
  for(const c of comps){const T=c.type;
    if(T==='gasturbine'||T==='steamturbine'){const gas=T==='gasturbine',inp=gas?'GAS_IN':'STEAM_IN',rd=!!c.on&&has(c,inp,gas?'gas':'steam')&&(!gas||(Number(c.fuel)>0&&has(c,'AIR_IN','air')));
      c.fuelRate=0;c._ready=rd;c._why=!c.on?'STOPPED':rd?'':gas?(has(c,inp,'gas')?'NO AIR AT AIR_IN':'NO GAS AT GAS_IN'):'NO STEAM AT STEAM_IN';
      c._spool=Math.max(0,Math.min(1,(c._spool||0)+dt*(rd?1/6:-1/5)));c._gen=c._spool>.97;if(rd){use(c,inp);use(c,'EXHAUST');if(gas)use(c,'AIR_IN');}}
    else if(T==='boiler'&&c.on){if(has(c,'FUEL','gas')&&has(c,'WATER','water')){use(c,'FUEL');use(c,'WATER');}}
    else if(T==='hrsg'){if(has(c,'FLUE_IN','flue')){use(c,'FLUE_IN');use(c,'FLUE_OUT');if(has(c,'WATER_IN','water'))use(c,'WATER_IN');}}
    else if(T==='steamgenerator'&&c.on){if(has(c,'FUEL_IN','gas')&&has(c,'WATER_IN','water')){use(c,'FUEL_IN');use(c,'WATER_IN');}}
    else if((T==='burner'&&c.on&&has(c,'GAS_IN','gas')&&has(c,'AIR_IN','air'))){use(c,'GAS_IN');use(c,'AIR_IN');}
    else if((T==='combustionchamber'||T==='furnace')&&c.on&&has(c,'FUEL_IN','gas')&&has(c,'AIR_IN','air')){use(c,'FUEL_IN');use(c,'AIR_IN');}
    else if(T==='condenser'&&has(c,'STEAM_IN','steam')&&has(c,'WATER_IN','water')){use(c,'STEAM_IN');use(c,'WATER_IN');}
    else if(T==='deaerator'&&has(c,'STEAM_IN','steam')&&has(c,'WATER_IN','water')){use(c,'STEAM_IN');use(c,'WATER_IN');}
    else if(T==='steamtrap'||T==='blowdown')if(c.open&&has(c,'IN','steam'))use(c,'IN');}
  window.PR=PR={uf,S,cons};window.PF=(cid,t)=>{if(!PR)return false;const r=PR.uf.find(key(cid,t)),s=PR.S.get(r);return!!s&&s.size>0&&PR.cons.has(r);};
}
/* run the supply network before every solver step, then publish turbine results */
const _step=step;
step=function(dt){
  solve(dt);
  _step(dt);
  let gen=false;for(const c of comps)if(c.type==='gasturbine'||c.type==='steamturbine'){c.rpm=Math.round(3000*(c._spool||0));c.outputPower=c._gen?c.mw*1e6:0;if(c._gen)gen=true;
      if(c.type==='gasturbine'){if(c._ready&&c._gen)c.fuel=Math.max(0,Number(c.fuel||0)-Math.max(0.002,Number(c.mw||50)*0.0002)*0.1);c.temperature=Math.round(20+(c._spool||0)*600);}}
  if(gen&&!sim.volts)sim.volts=220;
  const al=Array.isArray(sim.alarms)?sim.alarms:(sim.alarms=[]);
  for(const c of comps){if(c.type!=='gasturbine'&&c.type!=='steamturbine')continue;
    if(c.on&&!c._ready)al.push(['warn',`${c.label}: ${c._why}`]);else if(c._ready&&!c._gen)al.push(['warn',`${c.label} spooling ${Math.round((c._spool||0)*100)}%`]);else if(c._gen)al.push(['ok',`${c.label} generating ${c.mw} MW`]);}
  for(const c of comps)if((c.type==='boiler'||c.type==='steamgenerator')&&c.on&&PR){const f=c.type==='boiler'?'FUEL':'FUEL_IN',w=c.type==='boiler'?'WATER':'WATER_IN';
    const g=PR.S.get(PR.uf.find(key(c.id,f))),h=PR.S.get(PR.uf.find(key(c.id,w)));if(!g||!g.has('gas'))al.push(['warn',`${c.label}: NO FUEL AT ${f}`]);else if(!h||!h.has('water'))al.push(['warn',`${c.label}: NO FEEDWATER AT ${w}`]);}
};
/* running turbines energise their L / N / PE terminals */
const _cl=classify;
classify=function(uf){const r=_cl(uf);for(const c of comps)if((c.type==='gasturbine'||c.type==='steamturbine')&&c._gen)for(const t of['L','N','PE']){const k=uf.find(key(c.id,t)),o=r.m.get(k);if(!o)r.m.set(k,t);else if(o!==t){if(o==='L'||t==='L')r.short=true;else r.bond=true;}}return r;};
const _d=describe;
describe=function(c){if(c.type!=='gasturbine'&&c.type!=='steamturbine')return _d(c);const gas=c.type==='gasturbine';
  return`Status: ${c._gen?'GENERATING':c._ready?'SPOOLING '+Math.round((c._spool||0)*100)+'%':c.on?c._why:'STOPPED'}\nOutput: ${c._gen?c.mw+' MW':'0 MW'}\nSpeed: ${c.rpm||0} RPM\n${gas?'Gas supply':'Steam supply'}: ${c._ready?'OK':'NOT CONNECTED'}\nElectrical: ${c._gen?'L / N / PE live':'dead'}`;};
const _clickAction=clickAction;
clickAction=function(c){
  if((c.type==='feedwaterpump'||c.type==='gascompressor'||c.type==='gasboosterpump'||c.type==='steamboosterpump')&&!c.on){
    const st=evalCircuit();
    if(st.cl.short||!live(st,c,'M','N')){log(`⚠ ${c.label} cannot start: connect a live electrical supply across M and N first.`);renderProps();return;}
  }
  if(c.type==='gasturbine'&&!c.on){
    // Starting is allowed only when a real gas supply reaches GAS_IN; ambient air is assumed at AIR_IN.
    const gasReady=comps.some(g=>(g.type==='gaswell'||g.type==='naturalgas')&&g.on)||comps.some(g=>g.type==='lpgtank'&&Number(g.level)>0);
    if(!gasReady){log(`⚠ ${c.label} cannot start: connect an available gas source to GAS_IN first.`);renderProps();return;}
    if(!comps.some(g=>g.type==='airsupply'&&airReady(g))){log(`⚠ ${c.label} cannot start: add an Air Supply Source, power it (L/N) and pipe it to AIR_IN first.`);renderProps();return;}
  }
  return _clickAction(c);
};
const _r=resetSim;resetSim=function(){_r();for(const c of comps){c._spool=0;c._gen=false;c._w=0;c.powered=false;if(c.type==='expansionjoint')c.expansion=0;if(c.type==='pipesupport')c.load=0;if(c.type==='feedwatertank')c.level=70;if(c.type==='deaerator')c.efficiency=0.98;if(c.type==='lpsystem')c.pressure=5;if(c.type==='hpsystem')c.pressure=160;if(c.type==='steampipe')c.temperature=500;if(c.type==='superheater'||c.type==='reheater')c.temperature=540;if(c.type==='economizer')c.efficiency=0.85;if(c.type==='steamseparator')c.efficiency=0.95;}};$('bReset').onclick=resetSim;
})();
