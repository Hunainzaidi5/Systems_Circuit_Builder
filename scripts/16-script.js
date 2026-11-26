
/* ═══════════════════════════════════════════════════════════════════════════
 * HVAC SYSTEM + GAME ARCHITECTURE
 * Complete refrigeration, chilled-water, air-side and controls library.
 * Registers as Game system "hvac". Educational model only.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function(){
const CAT='HVAC System';
const lag=(o,k,t,dt,tau)=>{const v=Number(o[k])||0;o[k]=v+(t-v)*Math.min(1,dt/Math.max(.05,tau));};
const liveLN=(c)=>!!(sim.st&&live(sim.st,c,'L','N')&&!sim.st.cl.short);
const P1=[['IN','OUT']];
const HVAC_TYPES=[];
function def(type,spec){DEFS[type]=spec;HVAC_TYPES.push(type);}

def('refrigcylinder',{name:'Refrigerant Cylinder',tag:'CYL',icon:'🧴',cat:CAT,w:80,h:110,
  term:[['OUT',40,0,1,0,'h']],init:{on:true,charge:80,refrigerant:'R410A',pressure:8}});
def('filterdrier',{name:'Filter Drier',tag:'FD',icon:'🧫',cat:CAT,w:70,h:50,
  term:[['IN',-35,0,-1,0,'h'],['OUT',35,0,1,0,'h']],init:{clogged:false,dp:0}});
def('sightglass',{name:'Sight Glass',tag:'SG',icon:'👁',cat:CAT,w:60,h:50,
  term:[['IN',-30,0,-1,0,'h'],['OUT',30,0,1,0,'h']],init:{bubbles:false,full:true}});
def('receiver',{name:'Liquid Receiver',tag:'RCV',icon:'🛢',cat:CAT,w:80,h:100,
  term:[['IN',-40,-20,-1,0,'h'],['OUT',40,20,1,0,'h']],init:{level:70,pressure:14}});
def('refrigaccum',{name:'Suction Accumulator',tag:'ACC',icon:'🛢',cat:CAT,w:80,h:100,
  term:[['IN',-40,20,-1,0,'h'],['OUT',40,-20,1,0,'h']],init:{level:20,pressure:4}});
def('refrigcompressor',{name:'Refrigerant Compressor',tag:'CMP',icon:'⚙️',cat:CAT,w:140,h:110,
  term:[['SUC',-70,-25,-1,0,'h'],['DIS',70,-25,1,0,'h'],['L',-70,20,-1,0],['N',-70,40,-1,0],['PE',0,55,0,1]],
  init:{on:true,mode:'auto',tons:3,kw:3.2,eff:0.72,powered:false,rpm:0,suctionP:0,dischargeP:0,superheat:8,fault:'none',watts:0,_cooling:0}});
def('dxcondenser',{name:'Air-Cooled Condenser',tag:'CND',icon:'❄️',cat:CAT,w:140,h:100,
  term:[['REF_IN',-70,-20,-1,0,'h'],['REF_OUT',70,-20,1,0,'h'],['AIR_IN',-70,20,-1,0,'h'],['AIR_OUT',70,20,1,0,'h'],['L',-20,50,0,1],['N',20,50,0,1]],
  init:{fanOn:false,sc:6,pressure:16,temperature:42,watts:250,powered:false}});
def('dxevaporator',{name:'DX Evaporator / Coil',tag:'EVP',icon:'💨',cat:CAT,w:140,h:100,
  term:[['REF_IN',-70,-20,-1,0,'h'],['REF_OUT',70,-20,1,0,'h'],['AIR_IN',-70,20,-1,0,'h'],['AIR_OUT',70,20,1,0,'h'],['L',-20,50,0,1],['N',20,50,0,1]],
  init:{fanOn:false,sst:4,temperature:8,airOff:14,watts:180,powered:false,_cooling:0}});
def('txv',{name:'Thermostatic Expansion Valve',tag:'TXV',icon:'🔻',cat:CAT,w:80,h:60,
  term:[['IN',-40,0,-1,0,'h'],['OUT',40,0,1,0,'h']],init:{opening:45,superheat:8}});
def('eev',{name:'Electronic Expansion Valve',tag:'EEV',icon:'🔻',cat:CAT,w:80,h:60,
  term:[['IN',-40,0,-1,0,'h'],['OUT',40,0,1,0,'h'],['L',-15,30,0,1],['N',15,30,0,1]],init:{opening:40,superheat:7,powered:false}});
def('reversingvalve',{name:'4-Way Reversing Valve',tag:'RV',icon:'🔁',cat:CAT,w:100,h:70,
  term:[['DIS_IN',-50,-15,-1,0,'h'],['SUC_OUT',-50,15,-1,0,'h'],['INDOOR',50,-15,1,0,'h'],['OUTDOOR',50,15,1,0,'h'],['L',0,35,0,1],['N',20,35,0,1]],
  init:{heat:false,powered:false}});
def('liquidsolenoid',{name:'Liquid Line Solenoid',tag:'LLS',icon:'🔧',cat:CAT,w:80,h:55,
  term:[['IN',-40,0,-1,0,'h'],['OUT',40,0,1,0,'h'],['L',-15,28,0,1],['N',15,28,0,1]],init:{open:false,powered:false}});
def('hpswitch',{name:'High-Pressure Switch',tag:'HPS',icon:'⬆',cat:CAT,w:70,h:50,
  term:[['IN',-35,0,-1,0,'h'],['a',-15,25,0,1],['b',15,25,0,1]],init:{setting:28,tripped:false,pressure:0}});
def('lpswitch',{name:'Low-Pressure Switch',tag:'LPS',icon:'⬇',cat:CAT,w:70,h:50,
  term:[['IN',-35,0,-1,0,'h'],['a',-15,25,0,1],['b',15,25,0,1]],init:{setting:1.5,tripped:false,pressure:0}});
def('chiller',{name:'Water Chiller',tag:'CH',icon:'❄️',cat:CAT,w:170,h:120,
  term:[['CHW_IN',-85,-25,-1,0,'h'],['CHW_OUT',85,-25,1,0,'h'],['CDW_IN',-85,10,-1,0,'h'],['CDW_OUT',85,10,1,0,'h'],['L',-85,40,-1,0],['N',-85,55,-1,0],['PE',0,60,0,1]],
  init:{on:true,mode:'auto',tons:20,kw:18,setpoint:7,chwT:12,cdwT:32,powered:false,watts:0,_cooling:0,cop:4.2}});
def('chwpump',{name:'CHW Pump',tag:'PCH',icon:'⚙️',cat:CAT,w:110,h:80,
  term:[['IN',-55,-15,-1,0,'h'],['OUT',55,-15,1,0,'h'],['L',-55,20,-1,0],['N',-55,38,-1,0]],
  init:{on:true,flow:0,pressure:0,powered:false,watts:750}});
def('cwpump',{name:'Condenser Water Pump',tag:'PCW',icon:'⚙️',cat:CAT,w:110,h:80,
  term:[['IN',-55,-15,-1,0,'h'],['OUT',55,-15,1,0,'h'],['L',-55,20,-1,0],['N',-55,38,-1,0]],
  init:{on:true,flow:0,pressure:0,powered:false,watts:900}});
def('chwbuffer',{name:'CHW Buffer Tank',tag:'BUF',icon:'🛢️',cat:CAT,w:100,h:120,
  term:[['IN',-50,20,-1,0,'h'],['OUT',50,30,1,0,'h']],init:{level:80,temperature:10}});
def('platehx',{name:'Plate Heat Exchanger',tag:'PHE',icon:'▦',cat:CAT,w:120,h:90,
  term:[['H_IN',-60,-20,-1,0,'h'],['H_OUT',60,-20,1,0,'h'],['C_IN',-60,20,-1,0,'h'],['C_OUT',60,20,1,0,'h']],
  init:{effectiveness:0.75,hT:40,cT:12}});
def('threewayvalve',{name:'3-Way Mixing Valve',tag:'3WV',icon:'🔀',cat:CAT,w:80,h:70,
  term:[['IN1',-40,-15,-1,0,'h'],['IN2',-40,15,-1,0,'h'],['OUT',40,0,1,0,'h']],init:{position:50,open:true}});
def('ahu',{name:'Air Handling Unit',tag:'AHU',icon:'🏢',cat:CAT,w:180,h:130,
  term:[['AIR_IN',-90,-20,-1,0,'h'],['AIR_OUT',90,-20,1,0,'h'],['OA',-90,15,-1,0,'h'],['EA',90,15,1,0,'h'],['CHW_IN',-40,65,0,1,'h'],['CHW_OUT',40,65,0,1,'h'],['HW_IN',-10,65,0,1,'h'],['HW_OUT',10,65,0,1,'h'],['L',-90,40,-1,0],['N',-90,55,-1,0]],
  init:{on:true,fanPct:80,oaPct:20,sat:16,rat:24,cooling:0,heating:0,powered:false,watts:2200,filterDp:0.08}});
def('fancoil',{name:'Fan Coil Unit',tag:'FCU',icon:'💨',cat:CAT,w:120,h:90,
  term:[['AIR_IN',-60,-15,-1,0,'h'],['AIR_OUT',60,-15,1,0,'h'],['CHW_IN',-60,20,-1,0,'h'],['CHW_OUT',60,20,1,0,'h'],['L',-20,45,0,1],['N',20,45,0,1]],
  init:{on:true,speed:2,sat:16,powered:false,watts:180,_cooling:0}});
def('supplyfan',{name:'Supply Fan',tag:'SF',icon:'🌀',cat:CAT,w:90,h:80,
  term:[['AIR_IN',-45,0,-1,0,'h'],['AIR_OUT',45,0,1,0,'h'],['L',-20,40,0,1],['N',20,40,0,1]],
  init:{on:true,powered:false,speed:0,watts:750,flow:0}});
def('returnfan',{name:'Return Fan',tag:'RF',icon:'🌀',cat:CAT,w:90,h:80,
  term:[['AIR_IN',-45,0,-1,0,'h'],['AIR_OUT',45,0,1,0,'h'],['L',-20,40,0,1],['N',20,40,0,1]],
  init:{on:true,powered:false,speed:0,watts:550,flow:0}});
def('heatingcoil',{name:'Heating Coil',tag:'HC',icon:'🔥',cat:CAT,w:110,h:70,
  term:[['AIR_IN',-55,0,-1,0,'h'],['AIR_OUT',55,0,1,0,'h'],['HW_IN',-20,35,0,1,'h'],['HW_OUT',20,35,0,1,'h']],
  init:{capacity:20,airOff:28}});
def('coolingcoil',{name:'CHW Cooling Coil',tag:'CC',icon:'❄️',cat:CAT,w:110,h:70,
  term:[['AIR_IN',-55,0,-1,0,'h'],['AIR_OUT',55,0,1,0,'h'],['CHW_IN',-20,35,0,1,'h'],['CHW_OUT',20,35,0,1,'h']],
  init:{capacity:25,airOff:14,_cooling:0}});
def('humidifier',{name:'Humidifier',tag:'HUM',icon:'💧',cat:CAT,w:90,h:70,
  term:[['AIR_IN',-45,0,-1,0,'h'],['AIR_OUT',45,0,1,0,'h'],['L',-15,35,0,1],['N',15,35,0,1]],
  init:{on:false,powered:false,rhAdd:15,watts:800}});
def('damper',{name:'Volume Damper',tag:'DMP',icon:'▌',cat:CAT,w:70,h:55,
  term:[['AIR_IN',-35,0,-1,0,'h'],['AIR_OUT',35,0,1,0,'h']],init:{open:true,position:70}});
def('vavbox',{name:'VAV Box',tag:'VAV',icon:'▭',cat:CAT,w:90,h:70,
  term:[['AIR_IN',-45,-10,-1,0,'h'],['AIR_OUT',45,-10,1,0,'h'],['L',-15,35,0,1],['N',15,35,0,1]],
  init:{damper:60,flow:0,powered:false,setpoint:22}});
def('duct',{name:'Duct Section',tag:'DCT',icon:'▬',cat:CAT,w:100,h:28,
  term:[['IN',-50,0,-1,0,'h'],['OUT',50,0,1,0,'h']],init:{size:300,dp:0.02}});
def('airfilter',{name:'HVAC Air Filter',tag:'AF',icon:'▦',cat:CAT,w:80,h:60,
  term:[['IN',-40,0,-1,0,'h'],['OUT',40,0,1,0,'h']],init:{clogged:false,dp:0.05}});
def('freshair',{name:'Fresh Air Intake',tag:'OA',icon:'🌬️',cat:CAT,w:90,h:70,
  term:[['OUT',45,0,1,0,'h']],init:{on:true,temperature:32,rh:45,flow:2000}});
def('exhaustair',{name:'Exhaust Outlet',tag:'EA',icon:'📤',cat:CAT,w:80,h:60,
  term:[['IN',-40,0,-1,0,'h']],init:{flow:0}});
def('diffuser',{name:'Supply Diffuser',tag:'SDF',icon:'⊕',cat:CAT,w:70,h:55,
  term:[['IN',-35,0,-1,0,'h']],init:{flow:0,temperature:16}});
def('returngrille',{name:'Return Grille',tag:'RG',icon:'⊖',cat:CAT,w:70,h:55,
  term:[['OUT',35,0,1,0,'h']],init:{flow:0}});
def('airecon',{name:'Air-Side Economizer',tag:'ECO',icon:'♻️',cat:CAT,w:120,h:80,
  term:[['RA',-60,-15,-1,0,'h'],['OA',-60,15,-1,0,'h'],['SA',60,-15,1,0,'h'],['EA',60,15,1,0,'h']],
  init:{oaPct:20,enabled:true}});
def('hvaczone',{name:'Conditioned Zone',tag:'ZN',icon:'🏠',cat:CAT,w:140,h:110,
  term:[['AIR_IN',-70,-15,-1,0,'h'],['AIR_OUT',70,-15,1,0,'h']],
  init:{temperature:26,rh:50,setpoint:22,load:4,volume:150,occupancy:1}});
def('thermostat',{name:'Room Thermostat',tag:'TSTAT',icon:'🌡️',cat:CAT,w:80,h:70,
  term:[['COM',-40,0,-1,0],['NC',40,-18,1,0],['NO',40,18,1,0]],
  init:{setpoint:22,mode:'cool',deadband:0.8,call:false,pv:24}});
def('humidistat',{name:'Humidistat',tag:'HSTAT',icon:'💧',cat:CAT,w:80,h:70,
  term:[['COM',-40,0,-1,0],['NC',40,-18,1,0],['NO',40,18,1,0]],
  init:{setpoint:45,deadband:3,call:false,pv:50}});
def('freezestat',{name:'Freeze Stat',tag:'FZ',icon:'❄️',cat:CAT,w:70,h:55,
  term:[['a',-35,0,-1,0],['b',35,0,1,0],['AIR',0,-28,0,-1,'h']],init:{setting:4,tripped:false,temperature:16}});
def('hvacctrl',{name:'HVAC Controller',tag:'DDC',icon:'🖥️',cat:CAT,w:130,h:90,
  term:[['L',-65,-20,-1,0],['N',-65,20,-1,0],['Y',65,-25,1,0],['G',65,0,1,0],['W',65,25,1,0]],
  init:{mode:'auto',cool:false,heat:false,fan:false,powered:false}});

const BLURB={
  refrigcylinder:'Service bottle. Pipe OUT into the liquid line or receiver to prime a closed DX loop (R-410A educational charge).',
  filterdrier:'Removes moisture and debris from liquid refrigerant. IN from condenser/receiver, OUT to TXV.',
  sightglass:'Shows liquid refrigerant. Full = good charge; bubbles = undercharge or flash gas.',
  receiver:'Stores high-pressure liquid. IN from condenser, OUT to drier/TXV.',
  refrigaccum:'Protects the compressor from liquid slugging. IN from evaporator, OUT to compressor SUC.',
  refrigcompressor:'Vapour-compression heart. Electrical L/N/PE plus refrigerant SUC (low) and DIS (high). Auto follows a cooling thermostat.',
  dxcondenser:'Rejects heat to outdoor air. REF_IN (hot gas) → REF_OUT (liquid). AIR_IN/OUT plus L/N for the condenser fan.',
  dxevaporator:'Absorbs heat from room air. REF_IN (liquid/mix) → REF_OUT (vapour). AIR_IN from zone return, AIR_OUT to supply. L/N fan.',
  txv:'Meters refrigerant from high-pressure liquid to low-pressure mix. IN from drier, OUT to evaporator.',
  eev:'Modulating expansion valve. Needs L/N to hold opening; otherwise it stays at the last position.',
  reversingvalve:'Heat-pump 4-way valve. Energise L/N for heating; de-energised is cooling.',
  liquidsolenoid:'Shuts the liquid line when L/N is dead (pump-down). Pipe in series with the drier.',
  hpswitch:'Opens a–b if refrigerant pressure exceeds the setting. Tee IN onto the discharge line.',
  lpswitch:'Opens a–b if suction pressure falls below the setting. Tee IN onto the suction line.',
  chiller:'Packaged water chiller. CHW_IN/OUT to the building loop, CDW_IN/OUT to a cooling tower, L/N/PE power.',
  chwpump:'Chilled-water circulator. IN from buffer/chiller CHW_OUT, OUT to coils. Needs live L/N.',
  cwpump:'Condenser-water circulator between chiller CDW and cooling tower.',
  chwbuffer:'Thermal buffer on the chilled-water loop. Prevents short-cycling the chiller.',
  platehx:'Two-circuit plate pack. H_IN/OUT hot circuit, C_IN/OUT cold circuit.',
  threewayvalve:'Blends IN1 and IN2 to OUT. Position 0 = all IN1, 100 = all IN2.',
  ahu:'Air handler: mixed air, filter, cooling/heating coils, supply fan. OA/EA for ventilation, CHW/HW coils, L/N fan.',
  fancoil:'Terminal unit. AIR_IN/OUT in the zone, CHW_IN/OUT from the plant, L/N for the fan.',
  supplyfan:'Ducted supply fan. AIR_IN → AIR_OUT when L/N is live and Start is on.',
  returnfan:'Ducted return/relief fan.',
  heatingcoil:'Hot-water coil in a duct. AIR_IN/OUT plus HW_IN/OUT.',
  coolingcoil:'Chilled-water coil in a duct. AIR_IN/OUT plus CHW_IN/OUT.',
  humidifier:'Adds moisture to supply air when L/N is live.',
  damper:'Manual/modulating volume damper in a duct.',
  vavbox:'Variable-air-volume terminal. Damper modulates to the zone setpoint.',
  duct:'Rectangular duct spool. IN → OUT, air service only.',
  airfilter:'Panel filter. Clog it to raise pressure drop and cut airflow.',
  freshair:'Outdoor air source. Pipe OUT to AHU OA, economizer OA or condenser AIR_IN.',
  exhaustair:'Terminates relief/exhaust air.',
  diffuser:'Ceiling supply outlet into a zone. Pipe IN from the supply duct.',
  returngrille:'Zone return. Pipe OUT to AHU AIR_IN or evaporator AIR_IN.',
  airecon:'Free-cooling damper module. Mixes RA and OA to SA, spills EA.',
  hvaczone:'A room with thermal mass. AIR_IN supply, AIR_OUT return. Thermostats read the nearest zone.',
  thermostat:'Cooling: COM–NO closes when zone temperature is above setpoint. Heat: COM–NO closes when below setpoint.',
  humidistat:'COM–NO closes when zone RH is below setpoint (humidify call).',
  freezestat:'Opens a–b if coil air falls below the freeze setting.',
  hvacctrl:'Simple DDC: Y cooling, G fan, W heat. Needs L/N. Follows the nearest thermostat.'
};
Object.assign(COMP_BLURB,BLURB);

LINKS.thermostat=c=>[['COM',c.call?'NO':'NC']];
LINKS.humidistat=c=>[['COM',c.call?'NO':'NC']];
LINKS.freezestat=c=>c.tripped?[]:[['a','b']];
LINKS.hpswitch=c=>c.tripped?[]:[['a','b']];
LINKS.lpswitch=c=>c.tripped?[]:[['a','b']];
LINKS.hvacctrl=c=>{const a=[];if(c.cool)a.push(['L','Y']);if(c.fan)a.push(['L','G']);if(c.heat)a.push(['L','W']);return a;};

if(window.PASSMAP){
  const OPEN=c=>c.open||(c.position||0)>2?P1:[];
  Object.assign(window.PASSMAP,{
    filterdrier:c=>c.clogged?[]:P1,sightglass:()=>P1,receiver:()=>[['IN','OUT']],refrigaccum:()=>[['IN','OUT']],
    refrigcompressor:c=>c.powered?[['SUC','DIS']]:[],
    dxcondenser:c=>{const a=[['REF_IN','REF_OUT']];if(c.fanOn||c.powered)a.push(['AIR_IN','AIR_OUT']);return a;},
    dxevaporator:c=>{const a=[['REF_IN','REF_OUT']];if(c.fanOn||c.powered)a.push(['AIR_IN','AIR_OUT']);return a;},
    txv:()=>P1,eev:()=>P1,liquidsolenoid:c=>c.open?P1:[],
    reversingvalve:c=>c.heat?[['DIS_IN','INDOOR'],['OUTDOOR','SUC_OUT']]:[['DIS_IN','OUTDOOR'],['INDOOR','SUC_OUT']],
    chiller:c=>c.powered?[['CHW_IN','CHW_OUT'],['CDW_IN','CDW_OUT']]:[],
    chwpump:c=>c.on&&c.powered?P1:[],cwpump:c=>c.on&&c.powered?P1:[],
    chwbuffer:()=>[['IN','OUT']],platehx:()=>[['H_IN','H_OUT'],['C_IN','C_OUT']],
    threewayvalve:c=>c.open!==false?[['IN1','OUT'],['IN2','OUT']]:[],
    ahu:c=>{const a=[];if(c.powered)a.push(['AIR_IN','AIR_OUT'],['OA','AIR_OUT'],['AIR_IN','EA']);a.push(['CHW_IN','CHW_OUT'],['HW_IN','HW_OUT']);return a;},
    fancoil:c=>{const a=[['CHW_IN','CHW_OUT']];if(c.powered)a.push(['AIR_IN','AIR_OUT']);return a;},
    supplyfan:c=>c.on&&c.powered?[['AIR_IN','AIR_OUT']]:[],returnfan:c=>c.on&&c.powered?[['AIR_IN','AIR_OUT']]:[],
    heatingcoil:()=>[['AIR_IN','AIR_OUT'],['HW_IN','HW_OUT']],coolingcoil:()=>[['AIR_IN','AIR_OUT'],['CHW_IN','CHW_OUT']],
    humidifier:c=>c.powered?[['AIR_IN','AIR_OUT']]:[['AIR_IN','AIR_OUT']],
    damper:c=>(c.open&&(c.position||0)>2)?[['AIR_IN','AIR_OUT']]:[],
    vavbox:c=>(c.damper||0)>2?[['AIR_IN','AIR_OUT']]:[],
    duct:()=>P1,airfilter:c=>c.clogged?[]:P1,airecon:()=>[['RA','SA'],['OA','SA'],['RA','EA']],
    hvaczone:()=>[['AIR_IN','AIR_OUT']],diffuser:()=>[],exhaustair:()=>[],freshair:()=>[],returngrille:()=>[]
  });
}

function hvacKind(c,t){
  if(!c||!t)return null;
  const _hd=DEFS[c.type];
  if(!_hd||_hd.cat!==CAT)return null; /* HVAC naming rules apply to HVAC components only */
  if(typeof INSTRUMENT_TYPES!=='undefined'&&INSTRUMENT_TYPES.has(c.type))return'any';
  const n=String(t).toUpperCase();
  const elec=/^(L|N|PE|COM|NC|NO|A|B|Y|G|W)$/.test(n)||n==='A1'||n==='A2';
  if(elec)return null;
  if(/REF|SUC|DIS_IN|SUC_OUT|LIQ|VAP/.test(n))return'refrig';
  if(c.type==='refrigcompressor'&&(n==='SUC'||n==='DIS'))return'refrig';
  if(['filterdrier','sightglass','receiver','refrigaccum','txv','eev','refrigcylinder','liquidsolenoid'].includes(c.type)&&(n==='IN'||n==='OUT'))return'refrig';
  if(c.type==='reversingvalve')return'refrig';
  if(/CHW|CDW|HW_/.test(n))return'water';
  if(/AIR|OA|EA|RA|SA|SUPPLY|RETURN/.test(n))return'air';
  if(['duct','airfilter','damper','vavbox','supplyfan','returnfan','diffuser','returngrille','freshair','exhaustair','airecon','hvaczone','humidifier'].includes(c.type))return'air';
  if(['chwpump','cwpump','chwbuffer','threewayvalve'].includes(c.type)&&(n==='IN'||n==='OUT'||n==='IN1'||n==='IN2'))return'water';
  if(c.type==='platehx')return'water';
  if(c.type==='hpswitch'||c.type==='lpswitch')return n==='IN'?'refrig':null;
  if(c.type==='freezestat'&&n==='AIR')return'air';
  return null;
}
function processPortClass(c,t){
  const h=hvacKind(c,t);if(h)return h;
  if(!c)return'any';
  if(typeof INSTRUMENT_TYPES!=='undefined'&&INSTRUMENT_TYPES.has(c.type))return'any';
  const d=DEFS[c.type],n=String(t).toUpperCase(),cat=d&&d.cat||'';
  if(c.type==='airsupply')return'air';if(c.type==='fluestack')return'flue';if(c.type==='steamboosterpump')return'steam';if(c.type==='gasboosterpump')return'gas';
  if(c.type==='feedwatertank'||c.type==='feedwaterpump'||c.type==='coolingtower')return'water';
  if(c.type==='gasturbine'&&n==='EXHAUST')return'flue';if(c.type==='steamturbine'&&n==='EXHAUST')return'steam';
  if(c.type==='steamtrap'&&n==='COND')return'water';
  if(/STEAM/.test(n))return'steam';if(/GAS|FUEL|LPG/.test(n))return'gas';if(/AIR/.test(n))return'air';
  if(/FLUE|EXHAUST|HEAT|FLAME/.test(n))return'flue';if(/WATER|COND|RETURN/.test(n))return'water';
  if(/Gas/.test(cat))return'gas';if(/Steam/.test(cat))return'steam';if(/Hydraulic/.test(cat))return'water';
  if(cat===CAT)return'any';
  return'any';
}
const _addWire=addWire;
addWire=function(a,b,pts){
  if(a.c===b.c&&a.t===b.t)return;
  if(tkind(a)!==tkind(b)){log('⚠ Cannot join an electrical terminal to a hydraulic port.');return;}
  if(tkind(a)==='h'){const x=processPortClass(getC(a.c),a.t),y=processPortClass(getC(b.c),b.t);
    if(x!=='any'&&y!=='any'&&x!==y){log(`⚠ Cannot join a ${x} port to a ${y} port.`);return;}}
  return _addWire(a,b,pts);
};
const _pipeClass=window.pipeClass;
window.pipeClass=function(w){
  const a=getC(w.a.c),b=getC(w.b.c);
  const x=a?processPortClass(a,w.a.t):'any',y=b?processPortClass(b,w.b.t):'any';
  if(x!=='any')return x;if(y!=='any')return y;
  return _pipeClass?_pipeClass(w):'water';
};
const _drawPipe=drawPipe;
drawPipe=function(w,P,now){
  const prev=drawPipe;
  const pc=window.pipeClass?window.pipeClass(w):'water';
  if(pc==='refrig'){
    const hu=sim.hu,r=hu?hu.find(key(w.a.c,w.a.t)):null,sel=selected&&selected.kind==='w'&&selected.id===w.id;
    const flowing=!w.broken&&((hu&&sim.hflow.has(r))||(window.PF&&window.PF(w.a.c,w.a.t)));
    ctx.lineCap='round';ctx.lineJoin='round';
    if(sel){drawPath(P);ctx.strokeStyle='rgba(168,85,247,.5)';ctx.lineWidth=16;ctx.stroke();}
    if(w.broken){drawPath(P);ctx.setLineDash([8,8]);ctx.strokeStyle=COL.bad;ctx.lineWidth=5;ctx.stroke();ctx.setLineDash([]);return;}
    drawPath(P);ctx.strokeStyle='#2e1064';ctx.lineWidth=12;ctx.stroke();
    drawPath(P);ctx.strokeStyle=flowing?'#7c3aed':'#3b0764';ctx.lineWidth=7;ctx.stroke();
    drawPath(P);ctx.strokeStyle=flowing?'#e9d5ff':'#6b21a8';ctx.lineWidth=2.5;ctx.stroke();
    return;
  }
  return _drawPipe(w,P,now);
};

/* ── icons ── */
const SVG=SV;
Object.assign(ICON,{
  refrigcylinder:SVG('<rect x="8" y="3" width="8" height="18" rx="3"/><path d="M10 7h4M10 11h4M10 15h4"/>'),
  filterdrier:SVG('<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8v8M12 8v8M17 8v8"/>'),
  sightglass:SVG('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>'),
  receiver:SVG('<rect x="7" y="3" width="10" height="18" rx="4"/><path d="M7 12h10"/>'),
  refrigaccum:SVG('<rect x="7" y="3" width="10" height="18" rx="4"/><path d="M7 14h10"/>'),
  refrigcompressor:SVG('<circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/>'),
  dxcondenser:SVG('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 9h12M6 12h12M6 15h12"/>'),
  dxevaporator:SVG('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 9h12M6 15h12"/>'),
  txv:SVG('<path d="M4 12h6l6-6v12l-6-6h4"/>'),
  eev:SVG('<path d="M4 12h6l6-6v12l-6-6"/><path d="M18 8v8"/>'),
  reversingvalve:SVG('<rect x="4" y="7" width="16" height="10" rx="2"/><path d="M7 10h10M7 14h10"/>'),
  liquidsolenoid:SVG('<rect x="4" y="8" width="16" height="8" rx="2"/><path d="M12 4v4"/>'),
  hpswitch:SVG('<circle cx="12" cy="12" r="8"/><path d="M12 16V8l3 3"/>'),
  lpswitch:SVG('<circle cx="12" cy="12" r="8"/><path d="M12 8v8l3-3"/>'),
  chiller:SVG('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 9h12M6 15h12"/><circle cx="12" cy="12" r="2"/>'),
  chwpump:SVG('<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>'),
  cwpump:SVG('<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>'),
  chwbuffer:SVG('<path d="M6 5h12v14H6z"/><path d="M6 14h12"/>'),
  platehx:SVG('<rect x="4" y="5" width="16" height="14"/><path d="M8 5v14M12 5v14M16 5v14"/>'),
  threewayvalve:SVG('<path d="M4 8h8v8H4zM12 10h8v4h-8z"/>'),
  ahu:SVG('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h10M7 14h6"/>'),
  fancoil:SVG('<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="3"/>'),
  supplyfan:SVG('<circle cx="12" cy="12" r="8"/><path d="M12 6v4M12 14v4M6 12h4M14 12h4"/>'),
  returnfan:SVG('<circle cx="12" cy="12" r="8"/><path d="M12 6v4M12 14v4"/>'),
  heatingcoil:SVG('<rect x="3" y="8" width="18" height="8"/><path d="M6 8v8M10 8v8M14 8v8M18 8v8"/>'),
  coolingcoil:SVG('<rect x="3" y="8" width="18" height="8"/><path d="M6 8v8M12 8v8M18 8v8"/>'),
  humidifier:SVG('<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M12 8v6M9 14c2 2 4 2 6 0"/>'),
  damper:SVG('<rect x="3" y="8" width="18" height="8"/><path d="M5 16L19 8"/>'),
  vavbox:SVG('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M8 12h8"/>'),
  duct:SVG('<rect x="2" y="9" width="20" height="6" rx="1"/>'),
  airfilter:SVG('<path d="M4 5h16l-5 7v6l-6-2v-4z"/>'),
  freshair:SVG('<circle cx="12" cy="12" r="8"/><path d="M12 5v3M8 8l4-3 4 3"/>'),
  exhaustair:SVG('<circle cx="12" cy="12" r="8"/><path d="M12 19v-3M8 16l4 3 4-3"/>'),
  diffuser:SVG('<circle cx="12" cy="12" r="8"/><path d="M12 6v12M6 12h12"/>'),
  returngrille:SVG('<rect x="4" y="6" width="16" height="12"/><path d="M4 10h16M4 14h16"/>'),
  airecon:SVG('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 9h8M8 15h8"/>'),
  hvaczone:SVG('<path d="M4 20V10l8-6 8 6v10H4z"/><path d="M10 20v-6h4v6"/>'),
  thermostat:SVG('<rect x="7" y="3" width="10" height="18" rx="2"/><circle cx="12" cy="14" r="3"/>'),
  humidistat:SVG('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M12 8v5"/>'),
  freezestat:SVG('<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M12 8v6"/>'),
  hvacctrl:SVG('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 9h12M6 13h8"/>')
});

function hvacBox(c,w,h,ok,accent){
  body(c,w,h,ok?accent:COL.edge);
  ctx.fillStyle='#0c1928';ctx.fillRect(-w/2+6,-h/2+6,w-12,h-22);
}
function hvacLab(c,bot,col){const d=DEFS[c.type];txt(c,c.label||d.name,0,-d.h/2-8,COL.text,9,'center',700);if(bot)txt(c,bot,0,d.h/2+9,col||COL.mut,9,'center',800);}
function coilFins(x,y,w,h,n,col){ctx.strokeStyle=col;ctx.lineWidth=1.4;for(let i=0;i<n;i++){const xx=x+i*(w/(n-1));ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+h);ctx.stroke();}}

DRAW.refrigcylinder=function(c){hvacBox(c,80,110,c.on,'#a78bfa');
  // Cylinder body
  ctx.fillStyle='#6d28d9';rr(-16,-40,32,80,12);ctx.fill();
  // Valve at top
  ctx.fillStyle='#c4b5fd';ctx.fillRect(-6,-48,12,10);
  // Liquid level animation
  if(c.on&&c.charge>0){const h=70*c.charge/100;ctx.fillStyle='#38bdf8';ctx.globalAlpha=0.6;ctx.fillRect(-14,-20+h,28,-h);ctx.globalAlpha=1;
    // Bubbles animation
    if(Math.random()>0.7){const bx=-10+Math.random()*20,by=-30+Math.random()*40;ctx.beginPath();ctx.arc(bx,by,2,0,7);ctx.fillStyle='#fff';ctx.fill();}}
  hvacLab(c,c.on?`${c.refrigerant} ${c.charge.toFixed(0)}%`:'CLOSED',c.on?COL.ok:COL.mut);};
DRAW.filterdrier=function(c){hvacBox(c,70,50,!c.clogged,'#a78bfa');ctx.fillStyle='#7c3aed';ctx.fillRect(-24,-10,48,20);hvacLab(c,c.clogged?'CLOGGED':'DRIER',c.clogged?COL.bad:COL.mut);};
DRAW.sightglass=function(c){hvacBox(c,60,50,c.full,'#a78bfa');ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.fillStyle=c.full?'#38bdf8':'#1e293b';ctx.fill();ctx.strokeStyle='#e9d5ff';ctx.stroke();if(c.bubbles){for(const p of[[-4,2],[3,-3],[5,4]]){ctx.beginPath();ctx.arc(p[0],p[1],2,0,7);ctx.fillStyle='#fff';ctx.fill();}}hvacLab(c,c.full?'FULL':'FLASH');};
DRAW.receiver=function(c){hvacBox(c,80,100,c.level>5,'#a78bfa');ctx.fillStyle='#312e81';rr(-18,-38,36,76,10);ctx.fill();ctx.fillStyle='#7c3aed';ctx.fillRect(-18,38-c.level*0.76,36,c.level*0.76);hvacLab(c,`LIQ ${c.level.toFixed(0)}%`);};
DRAW.refrigaccum=function(c){hvacBox(c,80,100,true,'#a78bfa');ctx.fillStyle='#1e1b4b';rr(-18,-38,36,76,10);ctx.fill();hvacLab(c,'ACCUM');};
DRAW.refrigcompressor=function(c){const on=c.powered;hvacBox(c,140,110,on,'#c084fc');ctx.beginPath();ctx.arc(-10,0,28,0,7);ctx.fillStyle='#1e1b4b';ctx.fill();ctx.strokeStyle=on?'#e9d5ff':'#64748b';ctx.lineWidth=3;ctx.stroke();
  ctx.save();ctx.translate(-10,0);ctx.rotate(on?(Date.now()/180):0);for(let i=0;i<3;i++){ctx.rotate(2.09);ctx.fillStyle=on?'#ddd6fe':'#475569';ctx.fillRect(0,-4,22,8);}ctx.restore();
  if(on)glow(-10,0,36,'rgba(167,139,250,.35)');
  txt(c,on?'RUN':'OFF',42,0,on?COL.ok:COL.mut,11,'center',800);
  hvacLab(c,on?`${(c.suctionP||0).toFixed(1)}→${(c.dischargeP||0).toFixed(1)} bar · ${c.tons} T`:`${c.tons} T COMP`,on?COL.ok:COL.mut);};
DRAW.dxcondenser=function(c){hvacBox(c,140,100,c.powered,'#38bdf8');coilFins(-48,-28,96,36,9,c.powered?'#7dd3fc':'#334155');ctx.strokeStyle='#64748b';ctx.strokeRect(-52,-32,104,44);hvacLab(c,c.powered?`SC ${c.sc} K · ${Math.round(c.temperature)}°C`:'CONDENSER');};
DRAW.dxevaporator=function(c){hvacBox(c,140,100,c.powered,'#22d3ee');coilFins(-48,-28,96,36,9,c.powered?'#67e8f9':'#334155');ctx.strokeStyle='#64748b';ctx.strokeRect(-52,-32,104,44);hvacLab(c,c.powered?`OFF ${(c.airOff||0).toFixed(1)}°C · ${(c._cooling||0).toFixed(1)} kW`:'EVAPORATOR');};
DRAW.txv=function(c){hvacBox(c,80,60,true,'#a78bfa');ctx.fillStyle='#7c3aed';ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(8,-16);ctx.lineTo(8,16);ctx.closePath();ctx.fill();hvacLab(c,`TXV ${c.opening}%`);};
DRAW.eev=function(c){DRAW.txv(c);txt(c,'EEV',0,-8,COL.warn,8,'center',800);};
DRAW.reversingvalve=function(c){hvacBox(c,100,70,c.powered,'#c084fc');txt(c,c.heat?'HEAT':'COOL',0,0,c.heat?COL.warn:COL.ok,12,'center',800);hvacLab(c,'4-WAY');};
DRAW.liquidsolenoid=function(c){hvacBox(c,80,55,c.open,'#a78bfa');txt(c,c.open?'OPEN':'SHUT',0,0,c.open?COL.ok:COL.bad,11,'center',800);hvacLab(c,'LLS');};
DRAW.hpswitch=function(c){hvacBox(c,70,50,!c.tripped,'#ef476f');txt(c,c.tripped?'TRIP':'OK',0,0,c.tripped?COL.bad:COL.ok,11,'center',800);hvacLab(c,'HP');};
DRAW.lpswitch=function(c){hvacBox(c,70,50,!c.tripped,'#38bdf8');txt(c,c.tripped?'TRIP':'OK',0,0,c.tripped?COL.bad:COL.ok,11,'center',800);hvacLab(c,'LP');};
DRAW.chiller=function(c){hvacBox(c,170,120,c.powered,'#22d3ee');ctx.fillStyle='#0ea5e9';ctx.fillRect(-70,-40,140,50);txt(c,c.powered?'CHILLING':'OFF',0,-18,c.powered?COL.ok:COL.mut,12,'center',800);txt(c,`CHW ${(c.chwT||0).toFixed(1)}°C`,0,8,COL.text,10,'center',700);hvacLab(c,`${c.tons} T · COP ${c.cop}`);};
DRAW.chwpump=function(c){hvacBox(c,110,80,c.powered,'#38bdf8');ctx.beginPath();ctx.arc(0,-4,22,0,7);ctx.fillStyle='#0c4a6e';ctx.fill();ctx.strokeStyle=c.powered?COL.ok:COL.edge;ctx.stroke();hvacLab(c,c.powered?`CHW ${c.flow.toFixed(0)} L/s`:'CHW PUMP');};
DRAW.cwpump=function(c){hvacBox(c,110,80,c.powered,'#38bdf8');ctx.beginPath();ctx.arc(0,-4,22,0,7);ctx.fillStyle='#0c4a6e';ctx.fill();ctx.strokeStyle=c.powered?COL.ok:COL.edge;ctx.stroke();hvacLab(c,c.powered?`CW ${c.flow.toFixed(0)} L/s`:'CW PUMP');};
DRAW.chwbuffer=function(c){hvacBox(c,100,120,true,'#38bdf8');ctx.fillStyle='#082f49';rr(-28,-44,56,88,8);ctx.fill();ctx.fillStyle='#0ea5e9';ctx.globalAlpha=.7;ctx.fillRect(-28,44-c.level*0.88,56,c.level*0.88);ctx.globalAlpha=1;hvacLab(c,`${(c.temperature||10).toFixed(1)}°C`);};
DRAW.platehx=function(c){hvacBox(c,120,90,true,'#67e8f9');coilFins(-40,-24,80,48,8,'#38bdf8');hvacLab(c,`HX ε=${c.effectiveness}`);};
DRAW.threewayvalve=function(c){hvacBox(c,80,70,true,'#38bdf8');txt(c,`${c.position}%`,0,0,COL.text,12,'center',800);hvacLab(c,'3-WAY');};
DRAW.ahu=function(c){hvacBox(c,180,130,c.powered,'#38bdf8');
  // Filter section
  ctx.fillStyle='#94a3b8';ctx.fillRect(-70,-40,40,30);
  ctx.strokeStyle='#64748b';ctx.lineWidth=2;ctx.strokeRect(-70,-40,40,30);
  ctx.fillStyle='#64748b';ctx.font='8px sans-serif';ctx.fillText('FILTER',-60,-25);
  // Cooling coil
  coilFins(-20,-40,50,30,6,c.cooling>0?'#67e8f9':'#475569');
  if(c.cooling>0){ctx.fillStyle='#3b82f6';ctx.fillRect(-20,-38,50,26);ctx.globalAlpha=0.3;ctx.fill();ctx.globalAlpha=1;}
  // Heating coil
  coilFins(35,-40,40,30,5,c.heating>0?'#fb923c':'#475569');
  if(c.heating>0){ctx.fillStyle='#ef4444';ctx.fillRect(35,-38,40,26);ctx.globalAlpha=0.3;ctx.fill();ctx.globalAlpha=1;}
  // Supply fan
  ctx.save();ctx.translate(55,-24);if(c.powered){c.ang=(c.ang||0)+DT()*sim.speed*c.fanPct/30;ctx.rotate(c.ang);}
  ctx.strokeStyle=c.powered?COL.ok:'#94a3b8';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.moveTo(0,-12);ctx.lineTo(0,12);ctx.stroke();
  ctx.restore();
  hvacLab(c,c.powered?`SAT ${(c.sat||0).toFixed(1)}°C · OA ${c.oaPct}%`:'AHU');};
DRAW.fancoil=function(c){hvacBox(c,120,90,c.powered,'#22d3ee');coilFins(-40,-24,50,28,6,c.powered?'#67e8f9':'#475569');hvacLab(c,c.powered?`SPD ${c.speed} · ${(c.sat||0).toFixed(1)}°C`:'FCU');};
DRAW.supplyfan=function(c){hvacBox(c,90,80,c.powered,'#38bdf8');ctx.beginPath();ctx.arc(0,-4,20,0,7);ctx.strokeStyle=c.powered?COL.ok:COL.edge;ctx.lineWidth=3;ctx.stroke();hvacLab(c,c.powered?`${Math.round(c.speed)}%`:'SUPPLY');};
DRAW.returnfan=function(c){DRAW.supplyfan(c);};
DRAW.heatingcoil=function(c){hvacBox(c,110,70,true,'#fb923c');coilFins(-40,-16,80,28,8,'#fdba74');hvacLab(c,`HW ${(c.airOff||0).toFixed(0)}°C`);};
DRAW.coolingcoil=function(c){hvacBox(c,110,70,true,'#22d3ee');coilFins(-40,-16,80,28,8,'#67e8f9');hvacLab(c,`CHW ${(c.airOff||0).toFixed(0)}°C`);};
DRAW.humidifier=function(c){hvacBox(c,90,70,c.powered,'#38bdf8');txt(c,c.powered?'STEAM':'OFF',0,0,c.powered?COL.ok:COL.mut,11,'center',800);hvacLab(c,'HUM');};
DRAW.damper=function(c){hvacBox(c,70,55,c.open,'#94a3b8');ctx.strokeStyle='#e2e8f0';ctx.beginPath();ctx.moveTo(-20,8);ctx.lineTo(20,-8);ctx.stroke();hvacLab(c,`${c.position}%`);};
DRAW.vavbox=function(c){hvacBox(c,90,70,true,'#38bdf8');txt(c,`VAV ${c.damper}%`,0,0,COL.text,11,'center',800);hvacLab(c,'BOX');};
DRAW.duct=function(c){ctx.fillStyle='#334155';rr(-50,-12,100,24,4);ctx.fill();ctx.strokeStyle='#64748b';ctx.stroke();hvacLab(c,`${c.size} Ø`);};
DRAW.airfilter=function(c){hvacBox(c,80,60,!c.clogged,'#94a3b8');txt(c,c.clogged?'DIRTY':'FILTER',0,0,c.clogged?COL.warn:COL.mut,10,'center',800);hvacLab(c,'AF');};
DRAW.freshair=function(c){hvacBox(c,90,70,c.on,'#7dd3fc');txt(c,`OA ${c.temperature}°C`,0,0,COL.text,11,'center',800);hvacLab(c,'INTAKE');};
DRAW.exhaustair=function(c){hvacBox(c,80,60,true,'#64748b');txt(c,'EXH',0,0,COL.mut,12,'center',800);hvacLab(c,'');};
DRAW.diffuser=function(c){hvacBox(c,70,55,true,'#38bdf8');ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.strokeStyle='#7dd3fc';ctx.stroke();hvacLab(c,'SUPPLY');};
DRAW.returngrille=function(c){hvacBox(c,70,55,true,'#64748b');for(const y of[-8,0,8]){ctx.fillStyle='#94a3b8';ctx.fillRect(-18,y-2,36,3);}hvacLab(c,'RETURN');};
DRAW.airecon=function(c){hvacBox(c,120,80,c.enabled,'#34d399');txt(c,`OA ${c.oaPct}%`,0,0,COL.text,12,'center',800);hvacLab(c,'ECONOMIZER');};
DRAW.hvaczone=function(c){hvacBox(c,140,110,true,'#38bdf8');ctx.fillStyle='#0f172a';ctx.fillRect(-58,-38,116,60);txt(c,`${(c.temperature||0).toFixed(1)} °C`,0,-10,COL.ok,16,'center',800);txt(c,`RH ${(c.rh||0).toFixed(0)}% · ${c.occupancy} pax`,0,12,COL.mut,9,'center',700);hvacLab(c,`SP ${c.setpoint}°C`);};
DRAW.thermostat=function(c){hvacBox(c,80,70,c.call,'#fbbf24');
  // Temperature display
  ctx.fillStyle='#0f172a';ctx.fillRect(-28,-20,56,30);
  ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;ctx.strokeRect(-28,-20,56,30);
  txt(c,`${(c.pv||0).toFixed(1)}°C`,0,-6,COL.text,14,'center',800);
  // Mode indicator
  const modeColor=c.mode==='cool'?COL.ok:c.mode==='heat'?COL.warn:COL.mut;
  ctx.fillStyle=modeColor;ctx.beginPath();ctx.arc(-20,14,5,0,7);ctx.fill();
  txt(c,c.call?'CALL':'OK',0,14,c.call?COL.warn:COL.ok,9,'center',800);
  // Setpoint indicator
  ctx.fillStyle='#fbbf24';ctx.fillRect(15,10,4,8);
  txt(c,c.mode.toUpperCase(),0,30,COL.mut,8,'center',800);};
DRAW.humidistat=function(c){hvacBox(c,80,70,c.call,'#38bdf8');txt(c,`${(c.pv||0).toFixed(0)}%`,0,-4,COL.text,14,'center',800);hvacLab(c,'RH');};
DRAW.freezestat=function(c){hvacBox(c,70,55,!c.tripped,'#7dd3fc');txt(c,c.tripped?'FREEZE':'OK',0,0,c.tripped?COL.bad:COL.ok,10,'center',800);hvacLab(c,'FZ');};
DRAW.hvacctrl=function(c){hvacBox(c,130,90,c.powered,'#a78bfa');txt(c,c.powered?'DDC':'OFF',0,-10,c.powered?COL.ok:COL.mut,12,'center',800);txt(c,`Y${c.cool?'●':'○'} G${c.fan?'●':'○'} W${c.heat?'●':'○'}`,0,12,COL.text,10,'center',700);hvacLab(c,c.mode.toUpperCase());};

/* palette */
setTimeout(function(){
  const groups=$('componentGroups');if(!groups)return;
  let sec=[...groups.querySelectorAll('.palette-group')].find(s=>s.dataset.category===CAT);
  if(!sec){sec=document.createElement('section');sec.className='palette-group';sec.dataset.category=CAT;sec.innerHTML='<div class="cat">HVAC System</div><div class="grid2"></div>';groups.insertBefore(sec,groups.firstChild);sec.querySelector('.cat').style.setProperty('--a','#5eead4');}
  const grid=sec.querySelector('.grid2');
  for(const k of HVAC_TYPES){
    const d=DEFS[k];if(!d)continue;
    const el=document.createElement('div');el.className='item';el.draggable=true;el.dataset.type=k;el.title='Drag to board or click to add';
    el.style.setProperty('--a','#5eead4');
    el.innerHTML=`<div class="ic">${ICON[k]||d.icon}</div><div class="nm">${d.name}</div>`;
    el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',k));
    el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(k,p.x+n,p.y+n);});
    grid.appendChild(el);
  }
  const s=$('componentSearch');if(s)s.dispatchEvent(new Event('input'));
},200);

const PROP={
  refrigcylinder:c=>fld('Open',cI('on',c.on))+fld('Charge (%)',nI('charge',c.charge,0,100,1))+fld('Refrigerant',sI('refrigerant',c.refrigerant,[['R410A','R-410A'],['R32','R-32'],['R134a','R-134a'],['R22','R-22']])),
  refrigcompressor:c=>fld('Command',cI('on',c.on))+fld('Mode',sI('mode',c.mode,[['auto','Auto (thermostat)'],['on','Force ON'],['off','Force OFF']]))+fld('Capacity (tons)',nI('tons',c.tons,.5,40,.5))+fld('Input (kW)',nI('kw',c.kw,.2,50,.1))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  dxcondenser:c=>fld('Fan watts',nI('watts',c.watts,40,2000,10)),
  dxevaporator:c=>fld('Fan watts',nI('watts',c.watts,40,2000,10)),
  txv:c=>fld('Opening (%)',nI('opening',c.opening,5,100,1))+fld('Superheat (K)',nI('superheat',c.superheat,2,16,.5)),
  eev:c=>fld('Opening (%)',nI('opening',c.opening,5,100,1)),
  receiver:c=>fld('Level (%)',nI('level',c.level,0,100,1)),
  filterdrier:c=>fld('Clogged',cI('clogged',c.clogged)),
  liquidsolenoid:c=>`<div class="row"><button data-act="click">Toggle</button></div>`,
  reversingvalve:c=>fld('Heating',cI('heat',c.heat))+`<div class="row"><button data-act="click">Cool/Heat</button></div>`,
  hpswitch:c=>fld('Trip (bar)',nI('setting',c.setting,10,45,.5))+`<div class="row"><button data-act="click">Reset</button></div>`,
  lpswitch:c=>fld('Trip (bar)',nI('setting',c.setting,.3,6,.1))+`<div class="row"><button data-act="click">Reset</button></div>`,
  chiller:c=>fld('Command',cI('on',c.on))+fld('Mode',sI('mode',c.mode,[['auto','Auto'],['on','Force ON'],['off','Off']]))+fld('Tons',nI('tons',c.tons,5,500,1))+fld('CHW setpoint (°C)',nI('setpoint',c.setpoint,4,12,.5))+fld('COP',nI('cop',c.cop,2,7,.1))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  chwpump:c=>fld('On',cI('on',c.on))+fld('Watts',nI('watts',c.watts,100,15000,50))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  cwpump:c=>fld('On',cI('on',c.on))+fld('Watts',nI('watts',c.watts,100,15000,50))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  chwbuffer:c=>fld('Level (%)',nI('level',c.level,0,100,1))+fld('Temp (°C)',nI('temperature',c.temperature,4,20,.5)),
  threewayvalve:c=>fld('Position (%)',nI('position',c.position,0,100,1)),
  ahu:c=>fld('Fan on',cI('on',c.on))+fld('Fan (%)',nI('fanPct',c.fanPct,20,100,5))+fld('OA (%)',nI('oaPct',c.oaPct,0,100,5))+fld('Fan watts',nI('watts',c.watts,200,15000,50))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  fancoil:c=>fld('On',cI('on',c.on))+fld('Speed 1–3',nI('speed',c.speed,1,3,1))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  supplyfan:c=>fld('On',cI('on',c.on))+fld('Watts',nI('watts',c.watts,100,15000,50))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  returnfan:c=>fld('On',cI('on',c.on))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  humidifier:c=>fld('On',cI('on',c.on))+fld('RH add (%)',nI('rhAdd',c.rhAdd,1,40,1))+`<div class="row"><button data-act="click">Start/Stop</button></div>`,
  damper:c=>fld('Open',cI('open',c.open))+fld('Position (%)',nI('position',c.position,0,100,1))+`<div class="row"><button data-act="click">Open/Close</button></div>`,
  vavbox:c=>fld('Damper (%)',nI('damper',c.damper,0,100,1))+fld('Setpoint (°C)',nI('setpoint',c.setpoint,16,28,.5)),
  airfilter:c=>fld('Clogged',cI('clogged',c.clogged)),
  freshair:c=>fld('Open',cI('on',c.on))+fld('OA temp (°C)',nI('temperature',c.temperature,-10,50,1))+fld('OA RH (%)',nI('rh',c.rh,10,95,1)),
  airecon:c=>fld('Enabled',cI('enabled',c.enabled))+fld('OA (%)',nI('oaPct',c.oaPct,0,100,5)),
  hvaczone:c=>fld('Air temp (°C)',nI('temperature',c.temperature,10,40,.1))+fld('Setpoint (°C)',nI('setpoint',c.setpoint,16,30,.5))+fld('RH (%)',nI('rh',c.rh,20,80,1))+fld('Internal load (kW)',nI('load',c.load,0,40,.5))+fld('Occupancy',nI('occupancy',c.occupancy,0,50,1))+fld('Volume (m³)',nI('volume',c.volume,20,2000,10)),
  thermostat:c=>fld('Setpoint (°C)',nI('setpoint',c.setpoint,16,30,.5))+fld('Mode',sI('mode',c.mode,[['cool','Cool'],['heat','Heat'],['off','Off']]))+fld('Deadband (K)',nI('deadband',c.deadband,.2,3,.1)),
  humidistat:c=>fld('RH setpoint (%)',nI('setpoint',c.setpoint,20,70,1)),
  freezestat:c=>fld('Trip (°C)',nI('setting',c.setting,1,8,.5))+`<div class="row"><button data-act="click">Reset</button></div>`,
  hvacctrl:c=>fld('Mode',sI('mode',c.mode,[['auto','Auto'],['off','Off']]))
};
const _rp=renderProps;
renderProps=function(){_rp();const c=selected&&selected.kind==='c'?getC(selected.id):null;if(!c||!PROP[c.type])return;
  $('props').insertAdjacentHTML('beforeend',PROP[c.type](c)+`<div class="note" style="margin-top:6px">${COMP_BLURB[c.type]||''}</div>`);};

const _desc=describe;
describe=function(c){
  if(!HVAC_TYPES.includes(c.type))return _desc(c);
  const rows={
    refrigcompressor:`Status: ${c.powered?'RUNNING':c.on?'NO POWER / NO CALL':'STOPPED'}\nSuction: ${(c.suctionP||0).toFixed(2)} bar\nDischarge: ${(c.dischargeP||0).toFixed(2)} bar\nCooling: ${(c._cooling||0).toFixed(2)} kW\nInput: ${(c.watts||0).toFixed(0)} W`,
    dxevaporator:`Fan: ${c.powered?'ON':'OFF'}\nAir off: ${(c.airOff||0).toFixed(1)} °C\nCooling: ${(c._cooling||0).toFixed(2)} kW`,
    dxcondenser:`Fan: ${c.powered?'ON':'OFF'}\nCondensing: ${(c.temperature||0).toFixed(1)} °C\nPressure: ${(c.pressure||0).toFixed(1)} bar`,
    chiller:`Status: ${c.powered?'RUNNING':'STOPPED'}\nCHW: ${(c.chwT||0).toFixed(1)} °C (SP ${c.setpoint}°C)\nCooling: ${(c._cooling||0).toFixed(1)} kW\nInput: ${(c.watts||0).toFixed(0)} W`,
    hvaczone:`Air: ${(c.temperature||0).toFixed(1)} °C\nRH: ${(c.rh||0).toFixed(0)} %\nSetpoint: ${c.setpoint} °C\nLoad: ${c.load} kW + ${c.occupancy} people`,
    thermostat:`PV: ${(c.pv||0).toFixed(1)} °C\nSP: ${c.setpoint} °C\nCall: ${c.call?'YES ('+c.mode+')':'no'}\nCOM–${c.call?'NO':'NC'} closed`,
    ahu:`Fan: ${c.powered?'ON':'OFF'}\nSAT: ${(c.sat||0).toFixed(1)} °C\nRAT: ${(c.rat||0).toFixed(1)} °C\nCooling: ${(c.cooling||0).toFixed(1)} kW`,
    fancoil:`Fan: ${c.powered?'ON':'OFF'} spd ${c.speed}\nSAT: ${(c.sat||0).toFixed(1)} °C\nCooling: ${(c._cooling||0).toFixed(2)} kW`,
    hvacctrl:`Power: ${c.powered?'YES':'NO'}\nY cool: ${c.cool}\nG fan: ${c.fan}\nW heat: ${c.heat}`
  };
  return rows[c.type]||`${DEFS[c.type].name}\n${c.powered?'energised':'idle'}`;
};

const TOGGLE=new Set(['refrigcompressor','chiller','ahu','fancoil','supplyfan','returnfan','humidifier','chwpump','cwpump','freshair','damper','liquidsolenoid','reversingvalve']);
const _click=clickAction;
clickAction=function(c){
  if(c.type==='refrigcylinder'){pushUndo();c.on=!c.on;log(`${c.label} ${c.on?'opened':'closed'}`);renderProps();return;}
  if(TOGGLE.has(c.type)){
    if(['refrigcompressor','chiller','ahu','fancoil','supplyfan','returnfan','chwpump','cwpump'].includes(c.type)&&!c.on){
      const st=evalCircuit();
      const hasLN=(DEFS[c.type].term||[]).some(t=>t[0]==='L');
      if(hasLN&&(st.cl.short||!live(st,c,'L','N'))){log(`⚠ ${c.label} cannot start: connect live L/N first.`);renderProps();return;}
    }
    pushUndo();
    if(c.type==='damper'){c.open=!c.open;log(`${c.label} ${c.open?'opened':'closed'}`);}
    else if(c.type==='reversingvalve'){c.heat=!c.heat;log(`${c.label} ${c.heat?'HEATING':'COOLING'}`);}
    else if(c.type==='liquidsolenoid'){c.on=!c.on;log(`${c.label} command ${c.on?'open':'close'}`);}
    else {c.on=!c.on;log(`${c.label} ${c.on?'started':'stopped'}`);}
    renderProps();return;
  }
  if((c.type==='hpswitch'||c.type==='lpswitch'||c.type==='freezestat')&&c.tripped){pushUndo();c.tripped=false;log(`${c.label} reset`);renderProps();return;}
  return _click(c);
};

function nearestZone(c){return nearest(c,comps.filter(z=>z.type==='hvaczone'));}
function hasPR(c,t,k){if(!window.PR)return false;const s=PR.S.get(PR.uf.find(key(c.id,t)));return!!s&&s.has(k);}

Game.register('hvac',{
  tick(dt,ctx){
    const warnings=ctx&&ctx.warnings||sim.warnings||[];
    const st=sim.st||evalCircuit();
    const V=sim.volts||220;
    const outdoor=comps.find(x=>x.type==='freshair');
    const oaT=outdoor&&outdoor.on?Number(outdoor.temperature):32;
    const oaRH=outdoor&&outdoor.on?Number(outdoor.rh):45;

    for(const c of comps){
      if(c.type==='refrigcompressor'||c.type==='chiller'||c.type==='ahu'||c.type==='fancoil'||c.type==='supplyfan'||c.type==='returnfan'||c.type==='chwpump'||c.type==='cwpump'||c.type==='eev'||c.type==='dxcondenser'||c.type==='dxevaporator'||c.type==='humidifier'||c.type==='hvacctrl'||c.type==='vavbox'||c.type==='liquidsolenoid'||c.type==='reversingvalve'){
        c.powered=liveLN(c)&&(c.on!==false);
      }
    }
    for(const c of comps)if(c.type==='liquidsolenoid')c.open=!!c.powered||!!c.on&&liveLN(c);
    for(const c of comps)if(c.type==='dxcondenser'||c.type==='dxevaporator'){c.powered=liveLN(c);c.fanOn=c.powered;}
    for(const c of comps)if(c.type==='eev')c.powered=liveLN(c);

    /* thermostat / humidistat follow nearest zone */
    for(const c of comps)if(c.type==='thermostat'){
      const z=nearestZone(c);c.pv=z?z.temperature:c.pv||24;
      const db=Number(c.deadband)||0.8,sp=Number(c.setpoint)||22;
      if(c.mode==='off')c.call=false;
      else if(c.mode==='cool'){if(c.pv>sp+db)c.call=true;else if(c.pv<sp-db*0.3)c.call=false;}
      else if(c.mode==='heat'){if(c.pv<sp-db)c.call=true;else if(c.pv>sp+db*0.3)c.call=false;}
    }
    for(const c of comps)if(c.type==='humidistat'){
      const z=nearestZone(c);c.pv=z?z.rh:50;
      if(c.pv<c.setpoint-c.deadband)c.call=true;else if(c.pv>c.setpoint+c.deadband)c.call=false;
    }
    for(const c of comps)if(c.type==='hvacctrl'){
      c.powered=liveLN(c);const t=nearest(c,comps.filter(x=>x.type==='thermostat'));
      if(c.mode==='off'||!c.powered){c.cool=c.heat=c.fan=false;}
      else {c.fan=true;c.cool=!!(t&&t.mode==='cool'&&t.call);c.heat=!!(t&&t.mode==='heat'&&t.call);}
    }

    /* auto compressor / chiller from thermostat */
    const coolCall=comps.some(t=>t.type==='thermostat'&&t.mode==='cool'&&t.call)||comps.some(k=>k.type==='hvacctrl'&&k.cool);
    for(const c of comps)if(c.type==='refrigcompressor'||c.type==='chiller'){
      if(c.mode==='off')c.powered=false;
      else if(c.mode==='auto')c.powered=liveLN(c)&&!!c.on&&coolCall;
      else c.powered=liveLN(c)&&!!c.on;
    }

    /* HP/LP switches */
    for(const c of comps){
      if(c.type==='hpswitch'||c.type==='lpswitch'){
        const cmp=comps.find(x=>x.type==='refrigcompressor');
        c.pressure=cmp?(c.type==='hpswitch'?cmp.dischargeP:cmp.suctionP):c.pressure||0;
        if(c.type==='hpswitch'&&c.pressure>=c.setting)c.tripped=true;
        if(c.type==='lpswitch'&&cmp&&cmp.powered&&c.pressure>0&&c.pressure<=c.setting)c.tripped=true;
        if(c.tripped&&cmp){cmp.powered=false;warnings.push(`${c.label} OPEN — compressor locked out`);}
      }
    }

    /* propagate HVAC fluids into PR */
    if(window.PR){
      const uf=PR.uf,S=PR.S;
      const add=(c,t,k)=>{try{const r=uf.find(key(c.id,t));let s=S.get(r);if(!s)S.set(r,s=new Set());if(s.has(k))return false;s.add(k);return true;}catch(e){return false;}};
      let ch=true,n=0;
      while(ch&&n++<12){ch=false;
        for(const c of comps){
          if(c.type==='refrigcylinder'&&c.on&&c.charge>2){if(add(c,'OUT','refrig'))ch=true;}
          if(c.type==='receiver'&&c.level>5){if(add(c,'OUT','refrig'))ch=true;}
          if(c.type==='freshair'&&c.on){if(add(c,'OUT','air'))ch=true;}
          if(c.type==='hvaczone'){if(add(c,'AIR_OUT','air'))ch=true;}
          if(c.type==='returngrille'){if(add(c,'OUT','air'))ch=true;}
          if(c.type==='refrigcompressor'&&c.powered){if(add(c,'DIS','refrig'))ch=true;}
          if(c.type==='dxcondenser'&&hasPR(c,'REF_IN','refrig')){if(add(c,'REF_OUT','refrig'))ch=true;if(c.fanOn)add(c,'AIR_OUT','air');}
          if(c.type==='dxevaporator'&&hasPR(c,'REF_IN','refrig')){if(add(c,'REF_OUT','refrig'))ch=true;if(c.fanOn)add(c,'AIR_OUT','air');}
          if((c.type==='txv'||c.type==='eev'||c.type==='filterdrier'||c.type==='sightglass')&&hasPR(c,'IN','refrig')){if(add(c,'OUT','refrig'))ch=true;}
          if(c.type==='liquidsolenoid'&&c.open&&hasPR(c,'IN','refrig')){if(add(c,'OUT','refrig'))ch=true;}
          if(c.type==='chiller'&&c.powered){add(c,'CHW_OUT','water');add(c,'CDW_OUT','water');}
          if((c.type==='chwpump'||c.type==='cwpump')&&c.on&&c.powered){if(add(c,'OUT','water'))ch=true;}
          if(c.type==='supplyfan'&&c.powered&&hasPR(c,'AIR_IN','air')){if(add(c,'AIR_OUT','air'))ch=true;}
          if(c.type==='ahu'&&c.powered){add(c,'AIR_OUT','air');}
          if(c.type==='fancoil'&&c.powered){add(c,'AIR_OUT','air');}
        }
      }
    }

    /* compressor physics */
    for(const c of comps)if(c.type==='refrigcompressor'){
      const charged=hasPR(c,'SUC','refrig')||hasPR(c,'DIS','refrig')||comps.some(x=>x.type==='refrigcylinder'&&x.on&&x.charge>2)||comps.some(x=>x.type==='receiver'&&x.level>10);
      if(c.powered&&!charged){warnings.push(`${c.label}: NO REFRIGERANT CHARGE (open cylinder into the liquid line)`);c.powered=false;}
      const run=c.powered&&charged&&c.fault==='none';
      lag(c,'suctionP',run?4.2:0,dt,3);lag(c,'dischargeP',run?16.5:0,dt,4);
      lag(c,'rpm',run?2900:0,dt,2);
      c._cooling=run?c.tons*3.517:0;c.watts=run?c.kw*1000:0;
      if(run&&sim.hflow&&sim.hu){sim.hflow.add(sim.hu.find(key(c.id,'SUC')));sim.hflow.add(sim.hu.find(key(c.id,'DIS')));}
    }
    for(const c of comps)if(c.type==='dxcondenser'){
      const hot=hasPR(c,'REF_IN','refrig')&&comps.some(x=>x.type==='refrigcompressor'&&x.powered);
      lag(c,'temperature',hot?oaT+12:oaT,dt,8);lag(c,'pressure',hot?16:oaT>20?8:5,dt,6);c.sc=hot?6:0;
      c.watts=c.fanOn?(Number(DEFS.dxcondenser.init.watts)&&c.watts)||c.watts:0;
      if(c.fanOn)c.watts=Number(c.watts)||250;else c.watts=0;
    }
    for(const c of comps)if(c.type==='dxevaporator'){
      const cold=hasPR(c,'REF_IN','refrig')&&comps.some(x=>x.type==='refrigcompressor'&&x.powered);
      const cmp=comps.find(x=>x.type==='refrigcompressor'&&x.powered);
      c._cooling=cold&&c.fanOn?(cmp?cmp._cooling:8):0;
      lag(c,'airOff',cold&&c.fanOn?12:24,dt,6);c.watts=c.fanOn?(Number(c.watts)||180):0;
    }
    for(const c of comps)if(c.type==='sightglass'){
      const charged=hasPR(c,'IN','refrig');c.full=charged;c.bubbles=charged&&comps.some(x=>x.type==='refrigcompressor'&&x.powered&&(x.suctionP||0)<3);
    }
    for(const c of comps)if(c.type==='refrigcylinder'&&c.on&&comps.some(x=>x.type==='refrigcompressor'&&x.powered)){
      c.charge=Math.max(5,c.charge-dt*0.02);
    }

    /* chiller / CHW */
    for(const c of comps)if(c.type==='chiller'){
      const run=c.powered;const demand=Math.max(0,(c.chwT||12)-c.setpoint);
      c._cooling=run?Math.min(c.tons*3.517,4+demand*6):0;
      lag(c,'chwT',run?c.setpoint:Math.min(18,oaT-4),dt,12);
      lag(c,'cdwT',run?oaT+3:oaT,dt,10);
      c.watts=run?(c._cooling/Math.max(.8,c.cop))*1000:0;
      if(c.on&&!liveLN(c))warnings.push(`${c.label}: NO ELECTRICAL SUPPLY (L/N)`);
    }
    for(const c of comps)if(c.type==='chwpump'||c.type==='cwpump'){
      const run=c.on&&c.powered;lag(c,'flow',run?8:0,dt,2);lag(c,'pressure',run?2.5:0,dt,2);if(!run)c.watts=0;
      else if(!liveLN(c))warnings.push(`${c.label}: NO ELECTRICAL SUPPLY`);
    }
    for(const c of comps)if(c.type==='chwbuffer'){
      const ch=comps.find(x=>x.type==='chiller'&&x.powered);lag(c,'temperature',ch?ch.chwT:c.temperature||12,dt,20);
    }

    /* air handlers */
    for(const c of comps)if(c.type==='supplyfan'||c.type==='returnfan'){
      lag(c,'speed',c.powered&&c.on?100:0,dt,2);c.flow=c.speed*12;c.watts=c.powered?(Number(c.watts)||750)*c.speed/100:0;
    }
    for(const c of comps)if(c.type==='ahu'){
      c.powered=liveLN(c)&&c.on;c.rat=comps.reduce((a,z)=>z.type==='hvaczone'?z.temperature:a,24);
      const chw=hasPR(c,'CHW_IN','water')||comps.some(x=>x.type==='chiller'&&x.powered);
      const hw=hasPR(c,'HW_IN','water')||hasPR(c,'HW_IN','steam');
      c.cooling=c.powered&&chw?Math.max(0,(c.rat-12)*0.6):0;
      c.heating=c.powered&&hw&&c.cooling<=0.2?Math.max(0,(22-c.rat)*0.5):0;
      const mix=c.rat*(1-c.oaPct/100)+oaT*(c.oaPct/100);
      lag(c,'sat',c.powered?mix-c.cooling*1.4+c.heating*1.2:mix,dt,6);
      c.watts=c.powered?Number(c.watts)||2200:0;
    }
    for(const c of comps)if(c.type==='fancoil'){
      c.powered=liveLN(c)&&c.on;const chw=hasPR(c,'CHW_IN','water')||comps.some(x=>x.type==='chiller'&&x.powered);
      c._cooling=c.powered&&chw?3.5*c.speed:0;lag(c,'sat',c.powered&&chw?13:24,dt,5);c.watts=c.powered?80*c.speed:0;
    }
    for(const c of comps)if(c.type==='coolingcoil'){
      const chw=hasPR(c,'CHW_IN','water')||comps.some(x=>x.type==='chiller'&&x.powered);
      c._cooling=chw?c.capacity:0;lag(c,'airOff',chw?13:24,dt,5);
    }
    for(const c of comps)if(c.type==='heatingcoil'){
      const hw=hasPR(c,'HW_IN','water')||hasPR(c,'HW_IN','steam');lag(c,'airOff',hw?35:22,dt,6);
    }
    for(const c of comps)if(c.type==='humidifier'){c.powered=liveLN(c)&&c.on;c.watts=c.powered?Number(c.watts)||800:0;}
    for(const c of comps)if(c.type==='freezestat'){
      const coil=comps.find(x=>x.type==='coolingcoil'||x.type==='dxevaporator'||x.type==='ahu');
      c.temperature=coil?(coil.airOff||coil.sat||16):16;if(c.temperature<c.setting)c.tripped=true;
    }
    for(const c of comps)if(c.type==='vavbox'){
      const z=nearestZone(c);if(z){const e=z.temperature-c.setpoint;c.damper=Math.max(10,Math.min(100,(c.damper||60)+e*dt*8));}
    }
    for(const c of comps)if(c.type==='airecon'&&c.enabled){
      if(oaT<18)c.oaPct=Math.min(100,c.oaPct+dt*4);else if(oaT>22)c.oaPct=Math.max(10,c.oaPct-dt*4);
    }

    /* zone heat balance */
    for(const c of comps)if(c.type==='hvaczone'){
      const vol=Math.max(20,Number(c.volume)||150);
      const people=(Number(c.occupancy)||0)*0.12;
      const ua=vol*0.04;
      let qIn=(Number(c.load)||0)+people;
      const evaps=comps.filter(x=>x.type==='dxevaporator'&&x._cooling>0&&x.fanOn);
      const fcus=comps.filter(x=>x.type==='fancoil'&&x._cooling>0);
      const ahus=comps.filter(x=>x.type==='ahu'&&x.powered);
      const diffs=comps.filter(x=>x.type==='diffuser');
      let cool=0,sat=null;
      for(const e of evaps){if(sim.hu&&sim.hu.find(key(e.id,'AIR_OUT'))===sim.hu.find(key(c.id,'AIR_IN'))){cool+=e._cooling;sat=e.airOff;}}
      for(const e of fcus){if(sim.hu&&sim.hu.find(key(e.id,'AIR_OUT'))===sim.hu.find(key(c.id,'AIR_IN'))){cool+=e._cooling;sat=e.sat;}}
      for(const e of ahus){if(sim.hu&&(sim.hu.find(key(e.id,'AIR_OUT'))===sim.hu.find(key(c.id,'AIR_IN')))){cool+=e.cooling;sat=e.sat;}}
      if(!cool&&(evaps.length||fcus.length||ahus.length)){
        const near=nearest(c,evaps.concat(fcus).concat(ahus));
        if(near&&Math.hypot(near.x-c.x,near.y-c.y)<420){cool+=(near._cooling||near.cooling||0);sat=near.airOff||near.sat;}
      }
      for(const d of diffs){if(sim.hu&&sim.hu.find(key(d.id,'IN'))===sim.hu.find(key(c.id,'AIR_IN')))d.temperature=sat||16;}
      const qNet=qIn-cool+ua*(oaT-(c.temperature||24))/10;
      const dT=qNet*dt*3600/(1.2*vol*1.005)/50;
      c.temperature=Math.max(8,Math.min(45,(c.temperature||24)+dT));
      let rh=c.rh||50;if(cool>0)rh-=dt*1.2;if(comps.some(h=>h.type==='humidifier'&&h.powered))rh+=dt*2;
      rh+=(oaRH-rh)*dt/80;c.rh=Math.max(20,Math.min(90,rh));
    }

    /* electrical accounting */
    let extraW=0;
    for(const c of comps){
      if(!HVAC_TYPES.includes(c.type))continue;
      if(c.powered&&c.watts>0)extraW+=Number(c.watts)||0;
    }
    if(extraW>0){sim.power=(sim.power||0)+extraW;sim.totalI=(sim.totalI||0)+extraW/Math.max(1,V);}
  },
  reset(){
    for(const c of comps){
      if(c.type==='hvaczone'){c.temperature=26;c.rh=50;}
      if(c.type==='refrigcompressor'){c.powered=false;c.suctionP=0;c.dischargeP=0;c._cooling=0;c.rpm=0;}
      if(c.type==='chiller'){c.powered=false;c.chwT=12;c._cooling=0;}
      if(c.type==='thermostat')c.call=false;
      if(c.type==='hpswitch'||c.type==='lpswitch'||c.type==='freezestat')c.tripped=false;
      if(c.type==='refrigcylinder')c.charge=80;
      if(c.type==='receiver')c.level=70;
    }
  }
});

const _rs=resetSim;resetSim=function(){_rs();Game.reset();};
$('bReset').onclick=resetSim;

function loadHVAC(){
  pushUndo();comps=[];wires=[];nextId=1;selected=null;
  const add=(t,x,y,ex)=>{const c=newComp(t,x,y,0);Object.assign(c,ex||{});comps.push(c);return c;};
  const L=(a,ta,b,tb,pts)=>wires.push({id:nextId++,a:{c:a.id,t:ta},b:{c:b.id,t:tb},pts:pts||[],bend:0,broken:false});
  const S=add('source',80,120,{label:'Mains',on:true});
  const Q=add('mcb',240,120,{label:'QF-HVAC',rating:32});
  const J=add('junction',400,140,{label:'N'});
  const TS=add('thermostat',980,80,{label:'TSTAT',setpoint:22,mode:'cool'});
  const CMP=add('refrigcompressor',560,160,{label:'CMP-1',on:true,mode:'auto',tons:5,kw:4.2});
  const CND=add('dxcondenser',820,160,{label:'COND'});
  const OA=add('freshair',820,40,{label:'OA',temperature:35});
  const FD=add('filterdrier',820,300,{label:'FD'});
  const SG=add('sightglass',680,300,{label:'SG'});
  const TX=add('txv',540,300,{label:'TXV'});
  const EVP=add('dxevaporator',360,320,{label:'DX coil'});
  const ACC=add('refrigaccum',360,180,{label:'ACC'});
  const CYL=add('refrigcylinder',980,300,{label:'R-410A',on:true,charge:90});
  const ZN=add('hvaczone',360,500,{label:'Office',temperature:27,setpoint:22,load:3,occupancy:4});
  const RG=add('returngrille',200,500,{label:'RA'});
  const DF=add('diffuser',520,500,{label:'SA'});
  L(S,'L',Q,'Lin');L(S,'N',Q,'Nin');L(Q,'Nout',J,'l');
  L(Q,'Lout',CMP,'L',[{x:330,y:100},{x:490,y:100}]);L(J,'t',CMP,'N',[{x:400,y:80},{x:490,y:80},{x:490,y:200}]);
  L(Q,'Lout',CND,'L',[{x:330,y:100},{x:800,y:100}]);L(J,'r',CND,'N',[{x:480,y:140},{x:800,y:140}]);
  L(Q,'Lout',EVP,'L',[{x:330,y:100},{x:330,y:370}]);L(J,'b',EVP,'N',[{x:400,y:250},{x:340,y:250},{x:340,y:370}]);
  L(S,'PE',CMP,'PE',[{x:80,y:230},{x:560,y:230}]);
  L(CMP,'DIS',CND,'REF_IN');
  L(CND,'REF_OUT',FD,'IN',[{x:890,y:140},{x:890,y:300}]);
  L(CYL,'OUT',FD,'IN',[{x:940,y:300}]);
  L(FD,'OUT',SG,'IN');L(SG,'OUT',TX,'IN');L(TX,'OUT',EVP,'REF_IN');
  L(EVP,'REF_OUT',ACC,'IN',[{x:290,y:300},{x:290,y:200}]);L(ACC,'OUT',CMP,'SUC');
  L(OA,'OUT',CND,'AIR_IN');
  L(RG,'OUT',EVP,'AIR_IN',[{x:200,y:430},{x:290,y:430},{x:290,y:340}]);
  L(EVP,'AIR_OUT',DF,'IN',[{x:430,y:340},{x:520,y:340},{x:520,y:470}]);
  L(DF,'IN',ZN,'AIR_IN');
  L(ZN,'AIR_OUT',RG,'OUT',[{x:290,y:500}]);
  renderProps();fit();
  log('Loaded HVAC template: R-410A DX split — compressor + condenser + TXV + evaporator serving a zone. Thermostat auto-starts the compressor. Press Run.');
}
const host=$('bTplCG')||$('bTpl3')||$('bTpl');
if(host){host.insertAdjacentHTML('afterend','<button id="bTplHVAC">★ HVAC template</button>');$('bTplHVAC').onclick=loadHVAC;}
log('HVAC system library ready — '+HVAC_TYPES.length+' components. Use ★ HVAC template.');
})();
