/* ══════════ v33 · SCENARIO RUNNER + FAULT INJECTION ══════════
 * Toolbar "Faults ▾" menu injects faults into the live board:
 *  · Blow fuse/MCB      — set blown/tripped on protection devices
 *  · Stuck valve        — latch a valve open or closed
 *  · Sensor drift       — bias a transmitter/process sensor reading
 *  · Short circuit      — sim.short toggle (existing fault flag)
 *  · Clear all faults   — restore every injected fault
 * Each injection records an undo snapshot so Ctrl+Z reverses it. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const FUSE_TYPES=['fuse','mcb','acb','vcb','mcbr','rcd','tbfuse','switch','isolator'];
const VALVE_TYPES=['valve','gatevalve','globevalve','ballvalve','butterflyvalve','gasvalve','checkvalve','poppetvalve','sv22nc','sv22no','sv32','sv52','sv52d'];
const SENSOR_TYPES=['watertemp','watertempsensor','gasdetector','gaspressure','waterlevelsensor','pressuretransmitter','temperaturetransmitter','flowtransmitter','ind_sensor','capacitive','ultrasonic'];
const faults={};
function inject(kind){
  const targets={
    fuse:()=>comps.filter(c=>FUSE_TYPES.includes(c.type)),
    valveOpen:()=>comps.filter(c=>VALVE_TYPES.includes(c.type)),
    valveShut:()=>comps.filter(c=>VALVE_TYPES.includes(c.type)),
    drift:()=>comps.filter(c=>SENSOR_TYPES.includes(c.type)||(c.outputMA!==undefined&&c.type!=='aimodule'&&c.type!=='aomodule')),
    short:()=>[null]
  }[kind]();
  if(!targets.length){log(`No ${kind} targets on the board.`);return;}
  pushUndo();
  if(kind==='fuse'){const c=targets[0];c.blown=true;c.tripped=true;faults.fuse=c.id;log(`⚡ Fault injected: ${c.label} blown`);}
  else if(kind==='valveOpen'){const c=targets[0];c._stuckOpen=true;c.open=true;c.on=true;c.pos='A';faults.valve=c.id;log(`⚡ Fault injected: ${c.label} stuck OPEN`);}
  else if(kind==='valveShut'){const c=targets[0];c._stuckShut=true;c.open=false;c.on=false;if('pos' in c)c.pos='B';faults.valve=c.id;log(`⚡ Fault injected: ${c.label} stuck SHUT`);}
  else if(kind==='drift'){const c=targets[0];c._drift=(c._drift||0)+25;faults.drift=c.id;log(`⚡ Fault injected: ${c.label} sensor drift +${c._drift}%`);}
  else if(kind==='short'){sim.short=true;faults.short=true;log('⚡ Fault injected: bus short circuit');}
  renderProps();
}
function clearFaults(){
  for(const c of comps){if(c._stuckOpen||c._stuckShut){delete c._stuckOpen;delete c._stuckShut;if(c.type&&c.type.startsWith('sv'))c.on=false;}if(c._drift){delete c._drift;}}
  for(const id of['fuse','valve','drift']){const c=comps.find(x=>x.id===faults[id]);if(c){delete c.blown;delete c.tripped;if('pos' in c&&c.type&&c.type.startsWith('sv'))c.pos='A';}}
  sim.short=false;for(const k in faults)delete faults[k];log('✓ All injected faults cleared');renderProps();
}
/* apply drift inside sensor readings via a step-level nudge: wrap outputMA consumers? 
   Simplest: drift scales c.measured/outputMA readouts where present each frame. */
Game.register('faults',{tick(dt){
  if(faults.drift!==undefined){const c=comps.find(x=>x.id===faults.drift);if(c&&c._drift){
    if(c.outputMA!==undefined)c._driftMA=(c.outputMA||4)*(1+N(c._drift,0)/100);
    if(c.measured!==undefined)c._measDrift=N(c.measured,0)*(1+N(c._drift,0)/100);}}
},reset(){for(const k in faults)delete faults[k];sim.short=false;for(const c of comps){delete c._stuckOpen;delete c._stuckShut;delete c._drift;delete c._driftMA;delete c._measDrift;}}});
/* toolbar menu */
(function(){const b=$('bEx');if(!b)return;const tb=b.closest('.tb');if(!tb)return;
  const nb=document.createElement('button');nb.id='bFault';nb.textContent='⚡ Faults ▾';tb.appendChild(nb);
  const menu=document.createElement('div');menu.style.cssText='position:absolute;z-index:60;background:#1a0d0d;border:1px solid #7a2e2e;border-radius:8px;padding:6px;min-width:190px;display:none;box-shadow:0 8px 30px #000a';
  document.body.appendChild(menu);
  const place=()=>{const r=nb.getBoundingClientRect();menu.style.left=r.left+'px';menu.style.top=(r.bottom+4)+'px';};
  nb.onclick=()=>{place();menu.style.display=menu.style.display==='block'?'none':'block';};
  document.addEventListener('click',e=>{if(!menu.contains(e.target)&&e.target!==nb)menu.style.display='none';});
  const items=[['Blow fuse / trip breaker','fuse'],['Stuck valve — OPEN','valveOpen'],['Stuck valve — SHUT','valveShut'],['Sensor drift +25%','drift'],['Bus short circuit','short'],['── clear all ──','clear']];
  for(const [label,k] of items){const el=document.createElement('div');el.style.cssText='padding:6px 10px;border-radius:6px;cursor:pointer;font-size:12px;color:#fca5a5';el.textContent=label;
    el.onmouseenter=()=>el.style.background='#3a1414';el.onmouseleave=()=>el.style.background='';
    el.onclick=()=>{menu.style.display='none';if(k==='clear')clearFaults();else inject(k);};menu.appendChild(el);}
})();
log('v33 module ready — fault injection (fuse/valve/drift/short) + clear.');
})();
