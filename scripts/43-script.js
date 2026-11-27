/* ══════════ v39 · COMPONENT LIBRARY RE-CATEGORISATION ══════════
 * Load AFTER 42-script.js. Regroups every palette item into one clean, ordered set of
 * categories (power → protection → control → process → mechanical → HVAC). Items keep
 * their drag/click handlers; DEFS is untouched, so saved boards and the simulator are
 * unaffected. Any part that is not listed is placed by its original DEFS category, so
 * nothing can disappear. Missing palette items are created automatically. */
(function(){
'use strict';
const byPrefix=p=>Object.keys(DEFS).filter(k=>k.startsWith(p));

/* [group name, accent colour, [types…]] — order here = order in the library */
const GROUPS=[
['Power Sources & Storage','#ffb020',['source','source3','dcsource','generator','solar','wind','battery','lfpbattery','bms','supercap']],
['Power Conversion & Hybrid Systems','#fb923c',['inverter','hybrid','hybridlfp','hybridlfpgt','hybridbms','chargecontroller','batterycharger','psu24','diodebridge','ups1','ups3','trf1p','trf3p','transformerhv','reactor','capacitorbank','pfccap','harmfilter']],
['Breakers, Switches & Contactors','#f87171',['mcb','mcb3','mccb','acbreaker','dcbreaker','rcd','acb','vcb','hvbreaker','fuse','disconnect','switch','selector','transfer','ats','bustie','contactor','overload']],
['Protection Relays & Earthing','#ff6b81',['differentialrelay','overcurrentrelay','distanceprotection','generatorprotection','motorrelay','earthfaultrelay','spd','lightning','earthrod']],
['Distribution & Wiring','#fbbf24',['junction','busbar','phasetap','tbfeed','tbpe','tbfuse','tbdisc','tbstrip']],
['Generator Control & Synchronising','#c084fc',['governor','exciter','avr','syncrelay','synchroscope','parallelingpanel']],
['Motors, Starters & Drives','#f59e0b',['acmotor','dcmotor','motor3','dolstarter','stardelta','autoxfmr','vfd','softstart','servodrive','servomotor','stepperdrive','steppermotor']],
['Electrical Loads','#fb923c',['lamp','heater','fan','ledstrip','load3']],
['Control Relays & Timers','#f472b6',['relay','ssr','timer',...byPrefix('rly_')]],
['Push Buttons, Lamps & Limit Switches','#fbbf24',['pb','pbno','pbnc','pbdual','pbestop','pbillum',...byPrefix('pl_'),'ls1','ls2','float']],
['PLC, HMI & Controllers','#a78bfa',['plc','hmi','pid','pidblock','piblock','pblock','ratiostation','splstation','tempctrl','modbusmaster','modbusslave','aimodule','aomodule','encctrl','tacho']],
['Electrical Meters & Test Equipment','#67e8f9',['acvawmeter','dcvawmeter','energymeter','multimeter','clampmeter','megger','pqanalyser']],
['Process Instruments & Transmitters','#22d3ee',['gauge','tempgauge','levelgauge','dpgauge','vacuumgauge','flowmeter','rotameter','orificeplate','gasmeter',
  'watersensor','waterflowsensor','waterlevelsensor','watertempsensor','steampressure','steamtemp','steamflow','steamquality','gaspressure','gasflow','gaslevel','gasdetector','oxygenanalyzer','phsensor','conductivity','humiditysensor']],
['Position, Proximity & Temperature Sensors','#2dd4bf',['tc','rtd','ind_sensor','cap_sensor','photo_sensor','npn_sensor','pnp_sensor','target','encoder']],
['Water Pumps & Tanks','#38bdf8',['sump','tank','silo','silopump','motor','gearpump','tap','accumulator','filter','manifold']],
['Hydraulic Valves & Actuators','#60a5fa',['valve','controlvalve','checkvalve','reliefvalve','pressurecutoff','spoolvalve','poppetvalve','cylsingle','cyldouble','hydmotor']],
['Pipe Valves & Fittings','#5eead4',['gatevalve','globevalve','ballvalve','butterflyvalve','tee','teejoint','elbow90','elbow45','reducer','flange','gasket','expansionjoint','pipesupport']],
['Solenoid Valves','#7dd3fc',['sv22nc','sv22no','sv32','sv52','sv52d']],
['Gas Supply & Combustion','#bef264',['naturalgas','gaswell','lpgtank','gastank','gascompressor','gasboosterpump','gasvalve','gasfilter','pressureregulator','airsupply','burner','flame','combustionchamber','furnace','fluestack']],
['Steam & Boiler Plant','#cbd5e1',['boiler','steamgenerator','steamsource','boilerdrum','hrsg','steampipe','steamheader','steamseparator','steamtrap','superheater','reheater','economizer','desuperheater','flashtank','dryer','deaerator','feedwatertank','feedwaterpump','steamboosterpump','blowdown','lpsystem','hpsystem']],
['Turbines & Heat Rejection','#34d399',['gasturbine','steamturbine','condenser','coolingtower','heatexchanger']],
['Compressors & Air Receivers','#4ade80',['aircompressor1','aircompressor2','gascompressor1','gascompressor2','airreceiver']],
['Engines & Drive Trains','#f59e0b',['engine4s','shaftcoupling','geartrain','beltdrive','chaindrive','fueltank','oiltank']],
['Engine Air, Exhaust & Cooling','#fdba74',['intakefilter','turbocharger','intercooler','muffler','radiator','enginethermostat','coolpump','chwcondenser']],
['HVAC · Refrigeration Circuit','#5eead4',['refrigcylinder','refrigcompressor','dxcondenser','dxevaporator','txv','eev','reversingvalve','liquidsolenoid','filterdrier','sightglass','receiver','refrigaccum','hpswitch','lpswitch','mgs']],
['HVAC · Chilled-Water Plant','#22d3ee',['chiller','chwpump','cwpump','chwbuffer','platehx','threewayvalve']],
['HVAC · Air Handling & Zones','#99f6e4',['ahu','fancoil','supplyfan','returnfan','heatingcoil','coolingcoil','humidifier','damper','vavbox','duct','airfilter','freshair','exhaustair','diffuser','returngrille','airecon','hvaczone']],
['HVAC · Controls','#a7f3d0',['thermostat','humidistat','freezestat','hvacctrl']]
];

/* fallback for any future / unlisted part: original DEFS category → group name */
const FALLBACK={
'Electrical Power':'Power Sources & Storage','Electrical Protection':'Protection Relays & Earthing','Electrical Wiring':'Distribution & Wiring',
'Electrical Loads':'Electrical Loads','Electrical Control':'Generator Control & Synchronising','Electrical Instrument':'Electrical Meters & Test Equipment',
'Process Control':'PLC, HMI & Controllers','Process Instrument':'Process Instruments & Transmitters','Hydraulic Instrument':'Electrical Meters & Test Equipment',
'Hydraulic Loads':'Water Pumps & Tanks','Hydraulic':'Water Pumps & Tanks','Plumbing':'Pipe Valves & Fittings','Power Generation':'Turbines & Heat Rejection',
'Gas System':'Gas Supply & Combustion','Gas':'Gas Supply & Combustion','Steam System':'Steam & Boiler Plant','Steam':'Steam & Boiler Plant',
'3-Phase Power':'Distribution & Wiring','Motors':'Motors, Starters & Drives','Motor Control':'Motors, Starters & Drives','Motion Control':'Motors, Starters & Drives',
'Relays (Industrial)':'Control Relays & Timers','Solenoid Valves':'Solenoid Valves','Control Panel Devices':'Push Buttons, Lamps & Limit Switches',
'Terminal Blocks':'Distribution & Wiring','Sensors & Encoders':'Position, Proximity & Temperature Sensors','Switchgear (ACB / VCB)':'Breakers, Switches & Contactors',
'Power Quality & UPS':'Power Conversion & Hybrid Systems','Power Electronics':'Power Conversion & Hybrid Systems','Process Conditioning':'Steam & Boiler Plant',
'Process Equipment':'Steam & Boiler Plant','Test & Measurement':'Electrical Meters & Test Equipment','Analog I/O':'PLC, HMI & Controllers',
'Hydraulic Actuators & Valves':'Hydraulic Valves & Actuators','Compressors & Blowers':'Compressors & Air Receivers','Engines & Drive Trains':'Engines & Drive Trains',
'HVAC System':'HVAC · Air Handling & Zones','Plumbing & Fittings':'Pipe Valves & Fittings'
};

const OTHER='Other';
const gOf=name=>GROUPS.findIndex(g=>g[0]===name);
const sig=a=>a.map(([n,t])=>n+':'+t.join(',')).join('|');

function mkItem(k){
  const d=DEFS[k],el=document.createElement('div');
  el.className='item';el.draggable=true;el.dataset.type=k;el.title='Drag to board or click to add';
  el.innerHTML=`<div class="ic">${ICON[k]||d.icon||'⚙️'}</div><div class="nm">${d.name}</div>`;
  el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',k));
  el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(k,p.x+n,p.y+n);});
  return el;
}

let busy=false,obs=null;
function organize(){
  const groups=document.getElementById('componentGroups');if(!groups||busy)return;
  /* 1 · collect one element per type (first wins), create any that are missing */
  const items=new Map();
  groups.querySelectorAll('.item').forEach(el=>{const k=el.dataset.type;if(DEFS[k]&&!items.has(k))items.set(k,el);});
  for(const k of Object.keys(DEFS))if(!items.has(k))items.set(k,mkItem(k));
  /* 2 · decide each part's group */
  const plan=GROUPS.map(g=>[g[0],[]]),assigned=new Set();
  GROUPS.forEach((g,gi)=>{for(const k of g[2])if(items.has(k)&&!assigned.has(k)){plan[gi][1].push(k);assigned.add(k);}});
  const extra=[];
  for(const k of items.keys()){if(assigned.has(k))continue;
    const gi=gOf(FALLBACK[DEFS[k].cat]);
    if(gi>=0)plan[gi][1].push(k);else extra.push(k);}
  if(extra.length)plan.push([OTHER,extra]);
  const want=plan.filter(p=>p[1].length);
  /* 3 · nothing to do if the DOM already matches (prevents observer loops) */
  const have=[...groups.querySelectorAll(':scope>.palette-group')].map(s=>[s.dataset.category,[...s.querySelectorAll('.item')].map(i=>i.dataset.type)]);
  if(sig(have)===sig(want)&&groups.querySelectorAll('.item').length===items.size)return;
  /* 4 · rebuild */
  busy=true;if(obs)obs.disconnect();
  try{
    groups.querySelectorAll(':scope>.palette-group').forEach(s=>s.remove());
    const colOf=n=>{const g=GROUPS[gOf(n)];return g?g[1]:'#94a3b8';};
    for(const [name,types] of want){
      const col=colOf(name),s=document.createElement('section');
      s.className='palette-group';s.dataset.category=name;
      s.innerHTML=`<div class="cat" style="--a:${col}">${name}</div><div class="grid2"></div>`;
      const grid=s.querySelector('.grid2');
      for(const k of types){const el=items.get(k);el.style.setProperty('--a',col);grid.appendChild(el);}
      groups.appendChild(s);
    }
    /* drop duplicate leftovers that were not reused */
    groups.querySelectorAll(':scope>*:not(.palette-group)').forEach(x=>{if(x.classList.contains('item'))x.remove();});
  }finally{busy=false;watch();}
  const q=document.getElementById('componentSearch');if(q)q.dispatchEvent(new Event('input'));
}
let timer=null;
function watch(){
  const groups=document.getElementById('componentGroups');if(!groups)return;
  if(!obs)obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(organize,150);});
  obs.observe(groups,{childList:true,subtree:true});
}
organize();watch();
/* earlier modules add some HVAC / gauge items on timers (200–600 ms) — sweep again afterwards */
setTimeout(organize,1000);setTimeout(organize,2500);
window.reorganizePalette=organize;
log('v39 module ready — component library regrouped into '+GROUPS.length+' categories.');
})();
