/* ══════════ v44 · AIR SUPPLY (electrical + animated) · FAULT DIAGNOSTICS · LIBRARY TINT ══════════
 * Load LAST (after 43-script.js).
 *  1. Air Supply Source: L / N / PE power inputs, spin-up, motor current, thermal cut-out, fault injection,
 *     and a fully animated blower (motor → shaft → impeller → outlet duct).
 *  2. Fault diagnostics: names every component / wire that is faulty, tripped, overloaded or unsupplied,
 *     traces the exact path of a short circuit, highlights it on the board and lists it in a side card.
 *  3. Tints each component-library group with its accent colour (used by the new left-panel styling). */
(function(){
'use strict';
const $id=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const lblOf=c=>c.label||(DEFS[c.type]&&DEFS[c.type].tag)||c.type;

/* ════════════════════════ 1 · AIR SUPPLY ════════════════════════ */
function airTick(dt){
  const V=sim.volts||230,al=Array.isArray(sim.alarms)?sim.alarms:(sim.alarms=[]);
  for(const c of comps){
    if(c.type!=='airsupply')continue;
    const un=!!c.unlimited;
    const want=!un&&!!c.on&&!!c.powered&&c.fault!=='open'&&!c.cutout;
    const stalled=want&&c.fault==='stall';
    const target=want&&!stalled?1:0;
    const s0=c._spd||0;
    c._spd=s0+(target-s0)*Math.min(1,dt/(target?2.2:3.5));
    if(c._spd<0.002)c._spd=0;
    c._rot=(c._rot||0)+dt*c._spd*38;
    const pf=clamp(Number(c.pf)||.85,.3,1),kw=Math.max(0,Number(c.powerKw)||0);
    const run=kw*1000/(V*pf);
    let I=0;
    if(want){const inr=Math.max(1,Number(c.inrush)||6);I=stalled?run*inr:run*(.35+.65*c._spd)+run*(inr-1)*Math.pow(1-c._spd,3);}
    c.I=I;
    if(I>0&&sim.st){
      sim.totalI+=I;sim.power+=V*I*pf;
      if(sim.flow&&sim.st.uf){sim.flow.add(sim.st.uf.find(key(c.id,'L')));sim.flow.add(sim.st.uf.find(key(c.id,'N')));}
    }
    /* thermal overload: a jammed rotor (or heavy overload) trips the internal cut-out after ~5 s */
    if(want&&run>0&&I>1.8*run)c._heat=(c._heat||0)+dt;else c._heat=Math.max(0,(c._heat||0)-dt*.5);
    if(c._heat>5&&!c.cutout){c.cutout=true;c.powered=false;log(`⚠ ${c.label} thermal cut-out tripped (${c.fault==='stall'?'jammed rotor':'overload'}) — click it to reset after clearing the cause`);}
    /* earth leakage → RCD trips, or the enclosure becomes live */
    if(want&&c.fault==='earth'&&sim.st&&typeof earthFault==='function'){const n=(sim.hazards||[]).length;earthFault(c,sim.st,sim.hazards||(sim.hazards=[]));
      if((sim.hazards||[]).length>n)al.push(['bad',sim.hazards[sim.hazards.length-1]]);}
    if(un)continue;
    if(c.cutout){/* core alarm list already reports the cut-out */}
    else if(c.fault==='open')al.push(['bad',`${c.label}: OPEN MOTOR WINDING – no current`]);
    else if(c.fault==='stall'&&c.on&&c.powered)al.push(['bad',`${c.label}: ROTOR JAMMED – locked-rotor current`]);
    else if(c.on&&!c.powered)al.push(['warn',`${c.label}: NO ELECTRICAL SUPPLY (wire L / N to a live source)`]);
  }
}

/* ── legacy boards (saved before the blower had power inputs): keep them running as ambient vents ── */
const _loadObj=loadObj;
loadObj=function(o){
  const legacy=new Set(((o&&o.comps)||[]).filter(c=>c&&c.type==='airsupply'&&c.elec===undefined).map(c=>c.id));
  const r=_loadObj.apply(this,arguments);
  for(const c of comps)if(c.type==='airsupply'&&legacy.has(c.id)){c.elec=true;if(c.on&&!c.unlimited){c.unlimited=true;log(`${c.label}: older board — Air Supply kept as an ambient (unlimited) vent. Untick "Unlimited air" and wire L/N/PE to power it electrically.`);}}
  INCIDENTS.length=0;
  return r;
};

/* ── blower drawing ── */
DRAW.airsupply=function(c){
  const t=Date.now()/1000,un=!!c.unlimited,spd=un?1:clamp(c._spd||0,0,1),ready=airReady(c);
  const f=c.fault&&c.fault!=='none'?c.fault:null;
  const bad=!!(c.cutout||f==='open'||f==='stall'),warn=!bad&&(f==='earth'||(!un&&c.on&&!c.powered));
  const edge=bad?COL.bad:warn?COL.warn:ready?(!un&&spd<.95?'#38bdf8':COL.ok):COL.edge;
  const pulse=.5+.5*Math.sin(t*7);
  const dim=un?.4:1;

  /* housing */
  rr(-75,-60,150,120,12);ctx.fillStyle=GR(-75,-60,75,60,[[0,'#17344f'],[.55,'#0e2137'],[1,'#0a1626']]);ctx.fill();
  ctx.save();ctx.lineWidth=2.2;ctx.strokeStyle=edge;ctx.shadowColor=edge;ctx.shadowBlur=ready?12:(bad?8*pulse+4:0);ctx.stroke();ctx.restore();
  ctx.fillStyle='rgba(255,255,255,.04)';ctx.fillRect(-73,-58,146,10);

  /* power input terminals L / N / PE + feed lines into the motor */
  const live=!un&&!!c.powered;
  const feed=[['L',-34,COL.live,[[-58,-34],[-50,-34],[-50,-14],[-42,-14]]],['N',0,COL.neu,[[-58,0],[-42,0]]],['PE',34,COL.pe,[[-58,34],[-50,34],[-50,14],[-42,14]]]];
  ctx.save();ctx.globalAlpha=dim;
  for(const [nm,y,col,pts] of feed){
    line([[-75,y],[-58,y]],'#3b4f66',5);line([[-75,y],[-58,y]],col,2.5);
    line(pts,'#06101d',5);line(pts,live?col:'#3b4f66',2.4);
    if(live&&nm!=='PE'&&c.I>0){ctx.save();ctx.setLineDash([2,8]);ctx.lineDashOffset=-t*34*(nm==='L'?1:-1);line(pts,'#ffffff',2);ctx.restore();}
    ctx.beginPath();ctx.arc(-66,y-8,2.4,0,7);ctx.fillStyle=live?(nm==='PE'?COL.pe:col):'#27384c';ctx.fill();
  }
  ctx.restore();

  /* motor */
  ctx.save();
  if(f==='stall'&&c.on&&c.powered&&!c.cutout)ctx.translate((Math.random()-.5)*1.6,(Math.random()-.5)*1.6);
  rr(-42,-26,40,52,6);ctx.fillStyle=GR(-42,-26,-2,26,[[0,un?'#2b3a4a':'#35506b'],[1,un?'#1b2735':'#1f3248']]);ctx.fill();
  ctx.lineWidth=1.6;ctx.strokeStyle=live?(c._spd>.05?COL.ok:'#38bdf8'):'#4a6a8a';ctx.stroke();
  for(let i=0;i<4;i++)line([[-38+i*9,-22],[-38+i*9,22]],'rgba(0,0,0,.28)',2);
  ctx.beginPath();ctx.arc(-22,0,11,0,7);ctx.fillStyle='#0b1829';ctx.fill();ctx.lineWidth=1.4;ctx.strokeStyle='#6c8aa8';ctx.stroke();
  ctx.save();ctx.translate(-22,0);ctx.rotate(c._rot||0);line([[-8,0],[8,0]],spd>.05?COL.ok:'#7f93a6',2);line([[0,-8],[0,8]],spd>.05?'#9fe8d0':'#5b7089',2);ctx.restore();
  if(un){txt(c,'∞',-22,3,'#9fc4dd',13,'center',800);}
  ctx.restore();
  /* shaft */
  ctx.fillStyle='#9eb2c6';ctx.fillRect(-2,-3,16,6);ctx.fillStyle='#d8e4f0';ctx.fillRect(-2,-3,16,1.8);

  /* blower: inlet duct, volute, impeller, outlet duct */
  const cx=38,cy=0,R=25;
  ctx.beginPath();ctx.moveTo(cx-9,-R+1);ctx.lineTo(cx-13,-52);ctx.lineTo(cx+13,-52);ctx.lineTo(cx+9,-R+1);ctx.closePath();
  ctx.fillStyle='#16283c';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle='#5b7a99';ctx.stroke();
  for(let i=-1;i<=1;i++)line([[cx+i*7,-52],[cx+i*7,-46]],'#5b7a99',1.4);
  ctx.beginPath();ctx.moveTo(cx+R*.7,cy-R*.72);ctx.lineTo(cx+R+14,-8);ctx.lineTo(cx+R+14,8);ctx.lineTo(cx+R*.7,cy+R*.72);ctx.closePath();
  ctx.fillStyle='#16283c';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle='#5b7a99';ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fillStyle='#0b1829';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=ready?'#79b9e0':'#6c8aa8';ctx.stroke();
  ctx.save();ctx.translate(cx,cy);
  if(spd>.35){ctx.globalAlpha=.16*spd;ctx.beginPath();ctx.arc(0,0,R-3,0,7);ctx.fillStyle='#8fd3ff';ctx.fill();ctx.globalAlpha=1;}
  ctx.rotate(c._rot||0);
  const nb=8;
  for(let i=0;i<nb;i++){ctx.rotate(Math.PI*2/nb);ctx.beginPath();ctx.moveTo(4,0);ctx.quadraticCurveTo(10,-7,R-4,-5);ctx.lineTo(R-4,-1.5);ctx.quadraticCurveTo(12,0,4,3);ctx.closePath();
    ctx.fillStyle=spd>.05?(spd>.6?'#cfeeff':'#a4c4dc'):'#6f869c';ctx.fill();}
  ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,4.2,0,7);ctx.fillStyle='#e5edf5';ctx.fill();ctx.beginPath();ctx.arc(cx,cy,1.6,0,7);ctx.fillStyle='#31475e';ctx.fill();
  /* inlet air streaks (drawn toward the impeller) */
  if(spd>.04||un){ctx.save();ctx.lineCap='round';
    for(let i=0;i<5;i++){const k=((t*(.5+1.1*spd)+i/5)%1),x=cx+(i-2)*4.6,y=-58+k*28;ctx.globalAlpha=Math.sin(k*Math.PI)*.85*Math.max(.35,spd);line([[x,y],[x,y+6]],'#bfe9ff',1.6);}
    ctx.restore();}
  /* outlet: duct to OUT terminal + moving air chevrons */
  const flowing=ready&&(window.PF&&window.PF(c.id,'OUT')||(sim.hu&&sim.hflow&&sim.hflow.has(sim.hu.find(key(c.id,'OUT')))));
  line([[cx+R+13,0],[75,0]],'#4a6482',9);line([[cx+R+13,0],[75,0]],flowing?'#9fc4dd':'#13263a',5);
  ctx.fillStyle='#8497ab';ctx.fillRect(cx+R+12,-9,3,18);ctx.fillRect(70,-9,4,18);
  if(spd>.05){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(let i=0;i<3;i++){const k=((t*(.4+1.6*spd)+i/3)%1),x=cx+R+2+k*(75-(cx+R+2));ctx.globalAlpha=Math.sin(k*Math.PI)*.95;
      line([[x-3,-3.5],[x,0],[x-3,3.5]],'#d8f1ff',1.6);}ctx.restore();}

  /* pressure / speed bar */
  rr(-42,36,72,7,3.5);ctx.fillStyle='#07111e';ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='#27415b';ctx.stroke();
  const fr=clamp(spd*(Number(un?1.013:c.pressure)||1.2)/3,0,1);
  if(fr>.01){rr(-42,36,72*fr,7,3.5);ctx.fillStyle=GR(-42,0,30,0,[[0,'#06d6a0'],[.6,'#38bdf8'],[1,'#a78bfa']]);ctx.fill();}
  txt(c,un?'AMBIENT':`${Math.round(spd*100)}%`,-42,52,spd>.05||un?COL.ok:COL.mut,8,'left',800);
  txt(c,un?'1.01 bar':`${(c.pressure*spd).toFixed(2)} bar`,32,52,'#bfe3ff',8,'right',800);
  txt(c,un?'∞ m³/h':`${Math.round(c.flow*spd)} m³/h`,75-6,40,'#9fc4dd',8,'right',700);

  /* labels + status */
  txt(c,c.label,0,-68,COL.text,10,'center',800);
  const status=un?'AMBIENT VENT · NO POWER NEEDED':c.cutout?'THERMAL CUT-OUT':f==='open'?'OPEN WINDING':f==='stall'&&c.on&&c.powered?'ROTOR JAMMED':!c.on?'OFF':!c.powered?'NO POWER AT L / N':spd<.6?'SPINNING UP…':'SUPPLYING AIR';
  txt(c,status,0,72,bad?COL.bad:(warn||(!un&&!c.on))?(warn?COL.warn:COL.mut):COL.ok,9,'center',800);
  if(live&&!c.cutout)txt(c,`${sim.volts||230} V · ${(c.I||0).toFixed(1)} A`,-14,-40,'#ffd9a0',7.5,'center',800);
  if(f==='earth')txt(c,'⚠ earth leak',0,-80,COL.warn,8,'center',800);
  if(bad){ctx.save();ctx.globalAlpha=.55+.45*pulse;ctx.strokeStyle=COL.bad;ctx.lineWidth=2.4;ctx.lineCap='round';line([[-37,-21],[-7,21]],COL.bad,2.4);line([[-7,-21],[-37,21]],COL.bad,2.4);ctx.restore();}
};

/* ════════════════════════ 2 · FAULT DIAGNOSTICS ════════════════════════ */
const FAULT_NAMES={stall:'Stalled / jammed rotor',open:'Open winding / open circuit',earth:'Earth leakage to enclosure',weld:'Contacts welded shut',coilopen:'Coil open-circuit',stuckNC:'Stuck in NC position',stuckNO:'Stuck in NO position',stuck_open:'Stuck open',stuck_closed:'Stuck closed',blade:'Blade damage',gen:'Generator fault',short:'Internal short circuit',leak:'Leaking',stuck:'Stuck / seized',fail:'Failed'};
const SWITCHING=new Set(['mcb','mcb3','mccb','acbreaker','dcbreaker','rcd','acb','vcb','hvbreaker','fuse','disconnect','switch','selector','transfer','ats','bustie','contactor','pb','pbno','pbnc','pbdual','pbestop','pbillum','ssr','relay','dolstarter','stardelta','overload']);
const PUMPS=new Set(['feedwaterpump','gascompressor','gasboosterpump','steamboosterpump']);
let FAULTS=[],INCIDENTS=[],MARKS=new Map(),WMARKS=new Map(),lastSig='',lastAnalysis=0,incSeq=1;

function ufSkip(skipC,skipW){
  const uf=makeUF();
  for(const w of wires){if(w===skipW||w.broken||isPipe(w))continue;uf.union(key(w.a.c,w.a.t),key(w.b.c,w.b.t));}
  for(const c of comps){if(c===skipC)continue;const f=LINKS[c.type];if(!f)continue;for(const[a,b]of f(c))uf.union(key(c.id,a),key(c.id,b));}
  return uf;
}
/* pin polarity by name (L / + versus N / −); null when it cannot be told */
const POL=t=>{t=String(t);
  if(/^(L\d?|Lin|Lout|\+|DC\+|IN\+|OUT\+|AC_L\d?|[A-Z]+_L\d?|[A-Z]+\+)$/i.test(t))return'L';
  if(/^(N|Nin|Nout|-|DC-|IN-|OUT-|AC_N|[A-Z]+_N|[A-Z]+-)$/i.test(t))return'N';return null;};
const SOURCES=new Set(['source','source3','generator','dcsource','solar','wind','battery','lfpbattery','batterycharger','inverter','hybrid','hybridlfp','hybridlfpgt','hybridbms','ups1','ups3','psu24']);
function shortPath(){
  if(!classify(ufSkip(null,null)).short)return null;
  const pc=[],pw=[],bc=[],bw=[];
  /* every element on the loop carries the current; the "bridge" is the one that joins an L-side pin to an N-side pin */
  for(const c of comps){const f=LINKS[c.type];if(!f)continue;const pairs=f(c);if(!pairs.length)continue;
    if(classify(ufSkip(c,null)).short)continue;pc.push(c.id);
    if(pairs.some(([x,y])=>{const a=POL(x),b=POL(y);return a&&b&&a!==b;}))bc.push(c.id);}
  for(const w of wires){if(w.broken||isPipe(w))continue;if(classify(ufSkip(null,w)).short)continue;pw.push(w.id);
    const ca=getC(w.a.c),cb=getC(w.b.c),a=POL(w.a.t),b=POL(w.b.t);
    if(a&&b?a!==b:!(ca&&SOURCES.has(ca.type))&&!(cb&&SOURCES.has(cb.type)))bw.push(w.id);}
  return{pc,pw,bc,bw,parallel:!pc.length&&!pw.length};
}
const wireName=w=>{const a=getC(w.a.c),b=getC(w.b.c);return`Wire ${a?lblOf(a):'?'}.${w.a.t} → ${b?lblOf(b):'?'}.${w.b.t}`;};

/* called right before the simulator trips breakers, so the short path is captured while it still exists */
const _handleShort=handleShort;
handleShort=function(){
  const now=performance.now();let rec=null;
  const before=new Set(comps.filter(c=>c.tripped).map(c=>c.id));
  try{
    /* an active record whose path elements all still exist describes this same short — skip the costly re-trace */
    const live=INCIDENTS.find(i=>i.state==='active'&&i.pc.every(id=>getC(id))&&i.pw.every(id=>{const w=wires.find(x=>x.id===id);return w&&!w.broken;}));
    if(!live||now-lastAnalysis>1500){
      const p=shortPath();
      if(p){const sig=p.pc.slice().sort().join(',')+'|'+p.pw.slice().sort().join(',');
        rec=INCIDENTS.find(i=>i.sig===sig);
        if(rec){if(rec.state!=='active'){rec.count++;rec.t=new Date();}rec.state='active';}
        else{rec={id:incSeq++,sig,pc:p.pc,pw:p.pw,bc:p.bc,bw:p.bw,parallel:p.parallel,trip:[],state:'active',count:1,t:new Date()};INCIDENTS.unshift(rec);if(INCIDENTS.length>8)INCIDENTS.pop();}
        lastAnalysis=now;
        const names=[...p.pc.map(id=>{const c=getC(id);return c?lblOf(c):'?';}),...p.pw.map(id=>{const w=wires.find(x=>x.id===id);return w?wireName(w):'wire';})];
        log(`⚠ SHORT CIRCUIT traced: ${p.parallel?'multiple parallel paths':names.join(' → ')}`);
      }
    }
  }catch(e){console.warn('short analysis',e);}
  const r=_handleShort.apply(this,arguments);
  try{if(rec){const after=comps.filter(c=>c.tripped&&!before.has(c.id)).map(c=>c.id);if(after.length)rec.trip=Array.from(new Set(rec.trip.concat(after)));}}catch(e){}
  return r;
};

function computeFaults(){
  const out=[],marks=new Map(),wm=new Map();
  const mark=(id,sev,tag)=>{const m=marks.get(id);if(!m||(sev==='bad'&&m.sev!=='bad'))marks.set(id,{sev,tag});};
  const add=o=>{out.push(o);if(o.comp!=null)mark(o.comp,o.sev,o.tag);if(o.wire!=null)wm.set(o.wire,o.sev);};

  /* a) short-circuit incidents (latched until cleared) */
  for(const inc of INCIDENTS){
    const active=sim.short||inc.trip.some(id=>{const c=getC(id);return c&&c.tripped;});
    if(inc.state==='active'&&!active)inc.state='cleared';
  }
  for(const inc of INCIDENTS){
    const on=inc.state==='active',sevOf=on?'bad':'info';
    if(inc.parallel){add({comp:null,sev:sevOf,title:'Short circuit',detail:'Several parallel paths bridge L and N — inspect the wiring between the sources and the loads.',tag:'SHORT',cleared:!on,inc:inc.id});}
    const bC=new Set(inc.bc||[]),bW=new Set(inc.bw||[]),hasBridge=bC.size||bW.size;
    for(const id of inc.pc){const c=getC(id);if(!c)continue;const sw=SWITCHING.has(c.type),br=bC.has(id)||(!hasBridge&&!sw);
      add({comp:on?id:null,locate:id,sev:on?(br?'bad':'warn'):'info',title:`${lblOf(c)} · ${DEFS[c.type].name}`,
        detail:br?'This component is the short circuit — it connects L directly to N':'Carries the short-circuit current (in series with the fault) — not the cause',tag:br?'SHORT BRIDGE':'IN FAULT PATH',cleared:!on,inc:inc.id});}
    let nw=0;
    const wl=inc.pw.slice().sort((x,y)=>(bW.has(y)?1:0)-(bW.has(x)?1:0));
    for(const id of wl){const w=wires.find(x=>x.id===id);if(!w)continue;if(++nw>6){continue;}const br=bW.has(id)||(!hasBridge);
      add({comp:null,locate:w.a.c,wire:on?id:null,sev:on?(br?'bad':'warn'):'info',title:wireName(w),detail:br?'This conductor is the short circuit — it connects L directly to N':'Carries the short-circuit current — not the cause',tag:br?'SHORT BRIDGE':'IN FAULT PATH',cleared:!on,inc:inc.id});}
    if(inc.pw.length>6)add({comp:null,sev:on?'warn':'info',title:`+${inc.pw.length-6} more conductors`,detail:'Also carry the short-circuit current',tag:'IN FAULT PATH',cleared:!on,inc:inc.id,nolocate:true});
    for(const id of inc.trip){const c=getC(id);if(!c)continue;
      add({comp:c.tripped?id:null,locate:id,sev:c.tripped?'warn':'info',title:`${lblOf(c)} · ${DEFS[c.type].name}`,detail:c.tripped?'Tripped to clear the short circuit — find and fix the cause, then reset it':'Tripped on the short circuit (since reset)',tag:'TRIPPED',cleared:!c.tripped,inc:inc.id});}
  }
  if(sim.short&&!INCIDENTS.some(i=>i.state==='active'))add({comp:null,sev:'bad',title:'Short circuit',detail:'L and N are bridged and no protective device cleared it.',tag:'SHORT'});

  /* b) component-level faults */
  for(const c of comps){
    const d=DEFS[c.type];if(!d)continue;const nm=`${lblOf(c)} · ${d.name}`;
    if(c.fault&&c.fault!=='none'&&c.fault!=='ok'&&c.fault!==false){
      const nam=FAULT_NAMES[c.fault]||String(c.fault);
      const extra=c.type==='airsupply'&&c.fault==='stall'?(c.cutout?' — thermal cut-out has tripped':' — draws locked-rotor current'):'';
      add({comp:c.id,sev:'bad',title:nm,detail:`Injected fault: ${nam}${extra}`,tag:String(nam).split(/[\/ ]/)[0].toUpperCase()});}
    if(c.cutout)add({comp:c.id,sev:'bad',title:nm,detail:'Thermal cut-out tripped — remove the cause, let it cool, then click it to reset',tag:'CUT-OUT'});
    if(c.tripped&&!INCIDENTS.some(i=>i.state==='active'&&i.trip.includes(c.id))){
      add({comp:c.id,sev:'warn',title:nm,detail:c.type==='pressurecutoff'?'Pressure cut-off active':'Protective device tripped — clear the cause, then reset it',tag:'TRIPPED'});}
    if(c.overflow)add({comp:c.id,sev:'bad',title:nm,detail:'Tank overflow — inflow exceeds capacity; stop the pump or open the outlet',tag:'OVERFLOW'});
    if(PUMPS.has(c.type)&&c.on&&c.powered===false)add({comp:c.id,sev:'warn',title:nm,detail:'Start command is ON but there is no live supply across its power terminals',tag:'NO POWER'});
    if(c.type==='airsupply'&&!c.unlimited&&c.on&&!c.powered&&!c.cutout&&c.fault!=='open')add({comp:c.id,sev:'warn',title:nm,detail:'Blower is switched on but L / N are not live — wire it to a live source',tag:'NO POWER'});
    if(c.type==='motor'&&c.dryHeat>40)add({comp:c.id,sev:'warn',title:nm,detail:'Pump running dry — overheating',tag:'DRY RUN'});
  }
  for(const w of wires)if(w.broken)add({comp:null,locate:w.a.c,wire:w.id,sev:'bad',title:isPipe(w)?`Pipe ${wireName(w).replace(/^Wire /,'')}`:wireName(w),detail:isPipe(w)?'Pipe is broken / leaking':'Conductor is broken — open circuit',tag:'BROKEN'});

  /* c) any remaining alarm that names a component */
  const named=new Set(out.filter(o=>!o.cleared).map(o=>o.comp).filter(x=>x!=null));
  for(const a of (sim.alarms||[])){
    if(!a||a[0]==='ok')continue;const text=String(a[1]);
    const hits=comps.filter(c=>{const l=String(c.label||'');if(!l)return false;
      const re=new RegExp('(^|[^A-Za-z0-9_])'+l.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^A-Za-z0-9_]|$)');return re.test(text);});
    const fresh=hits.filter(c=>!named.has(c.id));
    if(hits.length&&!fresh.length)continue;
    if(/^SHORT CIRCUIT/i.test(text))continue;
    if(fresh.length){for(const c of fresh){named.add(c.id);add({comp:c.id,sev:a[0]==='bad'?'bad':'warn',title:`${lblOf(c)} · ${DEFS[c.type].name}`,detail:text,tag:a[0]==='bad'?'ALARM':'WARNING'});}}
    else add({comp:null,sev:a[0]==='bad'?'bad':'warn',title:'System',detail:text,tag:a[0]==='bad'?'ALARM':'WARNING',nolocate:true});
  }
  const rank=o=>(o.cleared?3:o.sev==='bad'?0:o.sev==='warn'?1:2);
  out.sort((a,b)=>rank(a)-rank(b));
  return{out,marks,wm};
}

/* ── side card ── */
let card,badgeEl;
function buildUI(){
  const side=$id('side');if(!side||$id('faultCard'))return;
  card=document.createElement('div');card.className='card';card.id='faultCard';
  card.innerHTML='<h2>Fault diagnostics<span id="fcPill" class="fcpill ok">ALL CLEAR</span></h2><div class="bd"><div id="faultList"></div><div class="row"><button id="fcClear" title="Forget cleared short-circuit records">Clear history</button></div></div>';
  side.insertBefore(card,side.firstChild);
  const listEl=$id('faultList');
  $id('fcClear').onclick=()=>{for(let i=INCIDENTS.length-1;i>=0;i--)if(INCIDENTS[i].state!=='active')INCIDENTS.splice(i,1);lastSig='';refresh(true);};
  listEl.addEventListener('click',e=>{const row=e.target.closest('.fr');if(!row||row.dataset.loc===undefined||row.dataset.loc==='')return;focusComp(+row.dataset.loc);});
  const stage=$id('stage');
  if(stage){badgeEl=document.createElement('button');badgeEl.id='faultBadge';badgeEl.hidden=true;stage.appendChild(badgeEl);
    badgeEl.onclick=()=>{document.body.classList.remove('noside');try{window.dispatchEvent(new Event('resize'));}catch(e){}card.scrollIntoView({behavior:'smooth',block:'nearest'});};}
}
function focusComp(id){
  const c=getC(id);if(!c)return;
  selected={kind:'c',id};
  try{const r=cv.getBoundingClientRect();view.x=r.width/2-c.x*view.z;view.y=r.height/2-c.y*view.z;}catch(e){}
  try{renderProps();}catch(e){}
}
function refresh(force){
  if(!card)return;
  const pillEl=card.querySelector('.fcpill'),listEl=card.querySelector('#faultList');if(!pillEl||!listEl)return;
  const {out,marks,wm}=computeFaults();
  FAULTS=out;MARKS=marks;WMARKS=wm;
  const act=out.filter(o=>!o.cleared&&o.sev!=='info');
  const nBad=act.filter(o=>o.sev==='bad').length,nWarn=act.length-nBad;
  const sig=out.map(o=>[o.sev,o.title,o.detail,o.cleared?1:0,o.tag].join('~')).join('||');
  if(sig===lastSig&&!force)return;lastSig=sig;
  if(nBad&&card.classList.contains('collapsed'))card.classList.remove('collapsed');
  pillEl.className='fcpill '+(nBad?'bad':nWarn?'warn':'ok');
  pillEl.textContent=nBad?`${nBad} FAULT${nBad>1?'S':''}`:nWarn?`${nWarn} WARNING${nWarn>1?'S':''}`:'ALL CLEAR';
  if(badgeEl){badgeEl.hidden=!act.length;badgeEl.className=nBad?'bad':'warn';badgeEl.textContent=`⚠ ${act.length} ${nBad?'fault':'warning'}${act.length>1?'s':''} — click for details`;}
  listEl.innerHTML=out.length?out.map(o=>{const loc=o.nolocate?'':(o.locate!=null?o.locate:o.comp);
    return`<div class="fr ${o.cleared?'cleared':o.sev}"${loc!=null&&loc!==''?` data-loc="${loc}"`:''}><i class="dot"></i><div class="fb"><div class="ft"><b>${esc(o.title)}</b>${o.tag?`<span class="tag">${esc(o.cleared?'CLEARED':o.tag)}</span>`:''}</div><small>${esc(o.detail)}</small></div>${loc!=null&&loc!==''?'<span class="loc" title="Select and centre on the board">⌖</span>':''}</div>`;}).join('')
    :'<div class="fok"><b>No faults detected</b><small>Every component is healthy. Faults, short circuits, trips and un-supplied equipment will be named here and highlighted on the board.</small></div>';
}

/* ── board overlay ── */
let ov,octx;
function buildOverlay(){
  const stage=$id('stage');if(!stage||ov)return;
  ov=document.createElement('canvas');ov.id='faultOv';ov.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3';
  stage.appendChild(ov);octx=ov.getContext('2d');
}
function drawOverlay(now){
  if(!ov)return;
  const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1,W=Math.max(1,Math.round(r.width*dpr)),H=Math.max(1,Math.round(r.height*dpr));
  if(ov.width!==W||ov.height!==H){ov.width=W;ov.height=H;}
  octx.setTransform(1,0,0,1,0,0);octx.clearRect(0,0,W,H);
  if(!MARKS.size&&!WMARKS.size)return;
  const z=view.z,pulse=.5+.5*Math.sin(now/170);
  octx.setTransform(dpr,0,0,dpr,0,0);octx.translate(view.x,view.y);octx.scale(z,z);
  const colOf=s=>s==='bad'?'239,71,111':'255,209,102';
  /* conductors */
  octx.lineJoin='round';octx.lineCap='round';
  for(const [id,sev] of WMARKS){const w=wires.find(x=>x.id===id);if(!w||!w._P)continue;
    const P=w._P;octx.beginPath();P.forEach((p,i)=>i?octx.lineTo(p.x,p.y):octx.moveTo(p.x,p.y));
    octx.strokeStyle=`rgba(${colOf(sev)},${.22+.3*pulse})`;octx.lineWidth=15;octx.stroke();
    octx.setLineDash([7,9]);octx.lineDashOffset=-now*.05;octx.strokeStyle=`rgba(${colOf(sev)},.95)`;octx.lineWidth=3;octx.stroke();octx.setLineDash([]);}
  /* components */
  const k=1/Math.max(z,.55);
  for(const [id,m] of MARKS){const c=getC(id);if(!c)continue;const d=DEFS[c.type];if(!d)continue;
    const odd=(c.rot||0)%2!==0,hw=(odd?d.h:d.w)/2+10,hh=(odd?d.w:d.h)/2+26,col=colOf(m.sev);
    octx.save();octx.translate(c.x,c.y);
    octx.beginPath();if(octx.roundRect)octx.roundRect(-hw,-hh,hw*2,hh*2,12);else octx.rect(-hw,-hh,hw*2,hh*2);
    octx.fillStyle=`rgba(${col},${.05+.08*pulse})`;octx.fill();
    octx.shadowColor=`rgba(${col},.9)`;octx.shadowBlur=14*pulse+4;octx.lineWidth=2.6;octx.strokeStyle=`rgba(${col},${.65+.35*pulse})`;
    octx.setLineDash([9,6]);octx.lineDashOffset=-now*.03;octx.stroke();octx.setLineDash([]);octx.shadowBlur=0;
    /* tag pill above the part */
    const txtv='⚠ '+(m.tag||'FAULT');octx.save();octx.translate(0,-hh-10*k);octx.scale(k,k);
    octx.font='800 10px Inter,system-ui,sans-serif';const tw=octx.measureText(txtv).width+14;
    octx.beginPath();if(octx.roundRect)octx.roundRect(-tw/2,-10,tw,17,8);else octx.rect(-tw/2,-10,tw,17);
    octx.fillStyle=m.sev==='bad'?'#ef476f':'#ffd166';octx.fill();octx.fillStyle=m.sev==='bad'?'#fff':'#3a2a00';octx.textAlign='center';octx.textBaseline='middle';octx.fillText(txtv,0,-1.5);
    octx.restore();octx.restore();}
}
(function loop(now){try{drawOverlay(now||performance.now());}catch(e){if(!loop.err){loop.err=1;console.warn('fault overlay',e);}}requestAnimationFrame(loop);})(performance.now());

/* ── step / reset hooks ── */
const _step=step;
step=function(dt){
  _step(dt);
  try{airTick(dt);}catch(e){if(!airTick.err){airTick.err=1;console.warn('air supply',e);}}
};
setInterval(()=>{try{refresh(false);}catch(e){if(!refresh.err){refresh.err=1;console.warn('fault panel',e);}}},250);
const _reset=resetSim;
resetSim=function(){const r=_reset.apply(this,arguments);INCIDENTS.length=0;lastSig='';return r;};

/* ════════════════════════ 3 · LIBRARY TINT (left panel) ════════════════════════ */
function tint(){
  const g=$id('componentGroups')||$id('palette');if(!g)return;
  g.querySelectorAll(':scope>.palette-group').forEach((s,i)=>{const cat=s.querySelector(':scope>.cat');const a=cat&&cat.style.getPropertyValue('--a');if(a&&s.style.getPropertyValue('--a')!==a)s.style.setProperty('--a',a);s.style.setProperty('--i',i);});
}
try{const g=$id('componentGroups')||$id('palette');if(g){new MutationObserver(tint).observe(g,{childList:true});}}catch(e){}
tint();setTimeout(tint,400);setTimeout(tint,1200);setTimeout(tint,3000);

buildUI();buildOverlay();
window.FaultDiag={faults:()=>FAULTS.slice(),incidents:()=>INCIDENTS,marks:()=>MARKS,refresh:()=>refresh(true)};
log('v44 module ready — powered Air Supply, fault diagnostics, ambient component library.');
})();
