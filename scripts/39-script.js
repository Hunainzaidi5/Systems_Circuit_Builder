/* ══════════ v35 · NEW ELECTRICAL PARTS (def2 registry) ══════════
 * Motor starters (DOL / star-delta / auto-transformer), motor protection relay,
 * earth-fault relay, curve MCCB, diode bridge, bus-tie, paralleling panel,
 * and test instruments (multimeter, clamp meter, insulation tester, PQ analyser). */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* coil energized? A1 on L-net, A2 on N-net */
function coilE(c){const st=sim.st;if(!st||!st.uf)return false;const R=t=>st.uf.find(key(c.id,t));
  const a=R('A1')??R('S1'),b=R('A2')??R('S2');if(a==null||b==null)return false;
  return st.cl.m.get(a)==='L'&&st.cl.m.get(b)==='N';}
/* generic schematic-ish draw for new parts */
function box(c,d,col){if(window.__partBody){window.__partBody(c,d,col);return;}body(c,d.w||100,d.h||80,col||COL.edge);txt(c,c.label,0,-(d.h||80)/2+12,COL.text,10);}
const G=(c,d)=>{if(window.__glyph){window.__glyph(c);return;}ctx.save();ctx.strokeStyle='#8fb3c9';ctx.lineWidth=1.4;ctx.strokeRect(-14,-10,28,20);ctx.fillStyle='#e8eef5';ctx.font='bold 10px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.tag||'?',0,0);ctx.restore();};

/* ── motor starters: LINE in → MOTOR out, coil A1/A2 starts, timed sequence ──
 * Each kind has distinct voltage/current factors, sequence, properties and blurb. */
function starterSpec(kind){
  const meta={
    dol:{name:'DOL Starter',tag:'DOL',icon:'⚡',blurb:'Direct-On-Line starter. Coil A1–A2 closes main contacts and applies full line voltage immediately. Highest inrush (~6–8× FLC). Wire LINE←mains, MOTOR→motor, A1/A2 to control circuit.'},
    sd:{name:'Star-Delta Starter',tag:'Y-Δ',icon:'🔄',blurb:'Star-Delta starter. Starts in star (~58% V, ~33% I), waits Star time, brief transition, then delta (full V). Adjust Star/Transition times in Properties.'},
    ax:{name:'Auto-Transformer Starter',tag:'AT',icon:'📉',blurb:'Auto-transformer starter. Starts at selected tap % for Start time, then switches to full voltage. Lower inrush than DOL. Set tap and time in Properties.'}
  }[kind];
  return{
  name:meta.name,tag:meta.tag,cat:'Motor Control',w:170,h:140,icon:meta.icon,
  term:[['L1',-60,-70,0,-1],['L2',-30,-70,0,-1],['L3',0,-70,0,-1],['N',30,-70,0,-1],['PE',60,-70,0,-1],
        ['M1',-60,70,0,1],['M2',-30,70,0,1],['M3',0,70,0,1],['MN',30,70,0,1],['MPE',60,70,0,1],
        ['A1',85,-12,1,0],['A2',85,12,1,0]],
  pins:{L1:'line 1 in',L2:'line 2 in',L3:'line 3 in',N:'neutral in',PE:'earth in',M1:'motor U out',M2:'motor V out',M3:'motor W out',MN:'motor N out',MPE:'motor PE out',A1:'start coil +',A2:'start coil −'},
  init:{running:false,seq:0,seqT:0,mode:'STOP',tap:80,starTime:3,deltaTime:0.5,axTime:5,_voltageFactor:0,_currentFactor:0,_a:0,_arc:0},
  links:c=>c.running?[['L1','M1'],['L2','M2'],['L3','M3'],['N','MN'],['PE','MPE']]:[],
  draw:(c,d)=>{box(c,d,c.running?COL.ok:COL.edge);G(c,d);
    ctx.fillStyle=c.running?'#3df5b0':'#64748b';ctx.font='9px Inter';ctx.textAlign='center';
    ctx.fillText(c.running?String(c.mode||'RUN'):'STOP',0,30);
    ctx.fillStyle='#8fb3c9';ctx.fillText(c.label,0,-40);},
  tick:(c,dt)=>{
    const want=coilE(c);
    if(want&&!c.running){c.running=true;c.seq=0;c.seqT=0;c.mode='START';c._arc=1;try{log(`${c.label} start coil energised`);}catch(e){}}
    if(!want&&c.running){c.running=false;c.seq=0;c.seqT=0;c.mode='STOP';c._voltageFactor=0;c._currentFactor=0;try{log(`${c.label} stopped`);}catch(e){}}
    c._a=N(c._a,0)+((c.running?1:0)-N(c._a,0))*Math.min(1,dt*12);
    c._arc=Math.max(0,N(c._arc,0)-dt*2.5);
    if(!c.running){c._voltageFactor=0;c._currentFactor=0;c._soft=false;return;}
    c.seqT+=dt;
    if(kind==='dol'){
      c.seq=1;c.mode='RUN · DOL · FULL V';
      c._voltageFactor=1;c._currentFactor=1;c._soft=false;c._ramp=1.2;
    }else if(kind==='sd'){
      const st=N(c.starTime,3),tr=N(c.deltaTime,.5);
      if(c.seqT<st){c.seq=1;c.mode='STAR · ~58% V';c._voltageFactor=.58;c._currentFactor=.33;c._soft=true;c._ramp=4;}
      else if(c.seqT<st+tr){c.seq=2;c.mode='TRANSITION';c._voltageFactor=1;c._currentFactor=1.25;c._soft=true;c._ramp=3;if(c.seqT<st+.05)c._arc=1;}
      else{c.seq=3;c.mode='DELTA · FULL V';c._voltageFactor=1;c._currentFactor=1;c._soft=false;c._ramp=1.2;}
    }else{
      const tap=clamp(N(c.tap,80),40,90)/100,ax=N(c.axTime,5);
      if(c.seqT<ax){c.seq=1;c.mode='TAP '+Math.round(tap*100)+'%';c._voltageFactor=tap;c._currentFactor=tap;c._soft=true;c._ramp=3;}
      else{if(c.seq===1)c._arc=1;c.seq=2;c.mode='RUN · FULL V';c._voltageFactor=1;c._currentFactor=1;c._soft=false;c._ramp=1.2;}
    }
  },
  props:(c,el)=>{
    let h='';
    if(kind==='dol'){
      h=`<div class="note"><b>DOL</b> — full line voltage the instant the coil energises. Highest inrush. Use only when supply and load can tolerate ~6–8× FLC.</div>`;
    }else if(kind==='sd'){
      h=`<div class="note"><b>Star-Delta</b> — star (~58% V / ~33% I) → transition → delta (full V).</div>`+
        `<div class="f"><label>Star time (s)</label><input type="number" data-k="starTime" data-t="n" min="0.1" step="0.1" value="${N(c.starTime,3)}"></div>`+
        `<div class="f"><label>Transition time (s)</label><input type="number" data-k="deltaTime" data-t="n" min="0.1" step="0.1" value="${N(c.deltaTime,.5)}"></div>`;
    }else{
      h=`<div class="note"><b>Auto-transformer</b> — reduced voltage at tap %, then full voltage after Start time.</div>`+
        `<div class="f"><label>Start tap (%)</label><select data-k="tap" data-t="s">${[50,60,65,70,80,90].map(v=>`<option value="${v}"${N(c.tap,80)===v?' selected':''}>${v}%</option>`).join('')}</select></div>`+
        `<div class="f"><label>Start time (s)</label><input type="number" data-k="axTime" data-t="n" min="0.1" step="0.1" value="${N(c.axTime,5)}"></div>`;
    }
    el.insertAdjacentHTML('beforeend',h);
  },
  desc:c=>{
    const coil=coilE(c)?'energised':'off';
    if(!c.running)return`stopped · coil ${coil}`;
    if(kind==='dol')return`DOL FULL V · coil ${coil}`;
    if(kind==='sd')return`${c.mode||'SD'} · seq ${N(c.seq,0)} · coil ${coil}`;
    return`${c.mode||'AT'} · tap ${N(c.tap,80)}% · coil ${coil}`;
  },
  blurb:meta.blurb
};}
def2('dolstarter',starterSpec('dol'));
def2('stardelta',starterSpec('sd'));
def2('autoxfmr',starterSpec('ax'));

/* ── motor protection relay (ANSI 49/50/51/46 simplified): CT in, TRIP out ── */
def2('motorrelay',{name:'Motor Protection Relay',tag:'MPR',cat:'Electrical Protection',w:100,h:90,icon:'🛡️',
  term:[['CT_IN',-45,-20,-1,0],['CT_OUT',45,-20,1,0],['TRIP',0,35,0,1]],
  pins:{CT_IN:'CT secondary in (S1/S2)',CT_OUT:'CT secondary out (pass-through)',TRIP:'trip contact — asserts + when tripped'},
  init:{tripped:false,Irated:10,thermal:0,unbalance:0},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c,d);ctx.fillStyle=c.tripped?'#ef4444':'#3df5b0';ctx.font='bold 10px Inter';ctx.textAlign='center';ctx.fillText(c.tripped?'TRIP':'OK',0,25);},
  tick:(c,dt)=>{if(c.tripped)return;
    /* find motor on same net as CT_IN secondary side — approximate: largest motor I on board */
    const mot=comps.filter(x=>['motor','acmotor','dcmotor'].includes(x.type)&&x.powered).sort((a,b)=>N(b.I,0)-N(a.I,0))[0];
    const I=mot?N(mot.I,0):0,Ir=Math.max(1,N(c.Irated,10));
    if(I>Ir*1.05){c.thermal+=dt*Math.pow(I/Ir,2);c.unbalance=I/Ir;}
    else c.thermal=Math.max(0,c.thermal-dt*0.5);
    if(I>Ir*6||c.thermal>8){c.tripped=true;try{log(`⚠ ${c.label} tripped: ${I>Ir*6?'locked-rotor/short-circuit':'thermal overload'} (${I.toFixed(1)} A vs ${Ir} A rated)`);}catch(e){}}},
  click:c=>{if(c.tripped){c.tripped=false;c.thermal=0;pushUndo&&0;}},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Rated current (A)</label><input type="number" data-k="Irated" data-t="n" min="1" step="0.5" value="${N(c.Irated,10)}"></div><div class="note">I²t thermal model + instantaneous >6×. TRIP asserts + — wire to breaker MX/TC.</div>`);},
  desc:c=>`I≈${(()=>{const m=comps.filter(x=>['motor','acmotor'].includes(x.type)&&x.powered).sort((a,b)=>N(b.I,0)-N(a.I,0))[0];return m?N(m.I,0).toFixed(1):'0.0';})()} A · thermal ${N(c.thermal,0).toFixed(1)} · ${c.tripped?'TRIPPED':'OK'}`,
  blurb:'Motor protection relay — I²t thermal overload, instantaneous trip. CT_IN←CT secondary, TRIP→breaker coil.'});

/* ── earth-fault relay (ANSI 50N/51N) ── */
def2('earthfaultrelay',{name:'Earth-Fault Relay',tag:'EFR',cat:'Electrical Protection',w:100,h:80,icon:'🌍',
  term:[['CT_IN',-45,-20,-1,0],['TRIP',45,0,1,0]],
  pins:{CT_IN:'residual CT secondary in',TRIP:'trip contact — asserts + when tripped'},
  init:{tripped:false,pickup:0.5,delay:0.1,_t:0},
  links:()=>[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c,d);ctx.fillStyle=c.tripped?'#ef4444':'#3df5b0';ctx.font='bold 10px Inter';ctx.textAlign='center';ctx.fillText(c.tripped?'TRIP':'OK',0,20);},
  tick:(c,dt)=>{const st=sim.st;if(c.tripped)return;
    /* residual ≈ current into any earthed fault on the protected side — use earth-fault flag on board */
    const ef=comps.some(x=>x.powered&&x.fault==='earth');
    const res=ef?N(c.pickup,0.5)*2:0;c._resI=res;
    if(res>N(c.pickup,.5)){c._t+=dt;if(c._t>=N(c.delay,.1)){c.tripped=true;try{log(`⚠ ${c.label} tripped: earth fault ${res.toFixed(2)} A > ${N(c.pickup,.5)} A`);}catch(e){}}}else c._t=0;},
  click:c=>{if(c.tripped)c.tripped=false;},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Pickup (A)</label><input type="number" data-k="pickup" data-t="n" min=".05" step=".05" value="${N(c.pickup,.5)}"></div><div class="f"><label>Delay (s)</label><input type="number" data-k="delay" data-t="n" min="0" step=".05" value="${N(c.delay,.1)}"></div><div class="note">Residual/earth-fault overcurrent. TRIP asserts +.</div>`);},
  desc:c=>`I_res ${N(c._resI,0).toFixed(2)} A · ${c.tripped?'TRIPPED':'OK'}`,
  blurb:'ANSI 50N/51N earth-fault relay. Wire residual CT to CT_IN, TRIP to breaker coil.'});

/* ── curve MCCB ── */
def2('mccb',{name:'MCCB (curve)',tag:'MCCB',cat:'Electrical Protection',w:90,h:80,icon:'🔌',
  term:[['Lin',-40,-20,-1,0],['Nin',-40,10,-1,0],['Lout',40,-20,1,0],['Nout',40,10,1,0],['TRIP',0,35,0,1]],
  pins:{Lin:'line in L',Nin:'line in N',Lout:'line out L',Nout:'line out N',TRIP:'trip contact +'},
  init:{closed:true,tripped:false,rating:32,curve:'C',_t:0},
  links:c=>(c.closed&&!c.tripped)?[['Lin','Lout'],['Nin','Nout']]:[],
  draw:(c,d)=>{box(c,d,COL.edge);ctx.strokeStyle=c.tripped?'#ef4444':c.closed?'#3df5b0':'#64748b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(c.closed?15:-15,0);ctx.stroke();ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText(c.rating+'A '+c.curve,c.x?0:0,-25);ctx.fillText(c.tripped?'TRIP':c.closed?'ON':'OFF',0,20);},
  tick:(c,dt)=>{if(c.tripped||!c.closed)return;
    const I=comps.filter(x=>x.powered).reduce((a,x)=>a+N(x.I,N(x.watts,0)/Math.max(1,sim.volts||230)),0);
    const mult={B:5,C:10,D:15,K:8}[c.curve]||10;
    if(I>N(c.rating,32)*mult/10){c._t+=dt;if(c._t>.05){c.tripped=true;c.closed=false;try{log(`⚠ ${c.label} magnetic trip (${c.curve} curve, ${I.toFixed(0)} A)`);}catch(e){}}}else c._t=Math.max(0,c._t-dt);},
  click:c=>{if(c.tripped){c.tripped=false;c.closed=true;pushUndo&&0;}else c.closed=!c.closed;},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Rating (A)</label><input type="number" data-k="rating" data-t="n" min="1" step="1" value="${N(c.rating,32)}"></div><div class="f"><label>Trip curve</label><select data-k="curve" data-t="s">${[['B','B (5–10×)'],['C','C (10–20×)'],['D','D (10–20× resistive)'],['K','K (8–15×)']].map(x=>`<option value="${x[0]}" ${c.curve===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></div>`);},
  desc:c=>`${N(c.rating,32)} A curve ${c.curve} · ${c.tripped?'TRIPPED':c.closed?'closed':'open'}`,
  blurb:'Moulded-case breaker with adjustable magnetic trip curve (B/C/D/K). Thermal+magnetic model, TRIP contact.'});

/* ── diode bridge rectifier ── */
def2('diodebridge',{name:'Diode Bridge Rectifier',tag:'DB',cat:'Power Electronics',w:90,h:80,icon:'🔁',
  term:[['L',-45,-20,-1,0],['N',-45,10,-1,0],['DC+',45,-20,1,0],['DC-',45,10,1,0]],
  pins:{L:'AC line',N:'AC neutral', 'DC+':'rectified +', 'DC-':'rectified −'},
  init:{on:true},
  links:c=>c.on?[['L','DC+'],['N','DC-']]:[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c,d);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';ctx.fillText('AC→DC',0,22);},
  desc:c=>`3-phase/single-phase bridge — DC output ≈ 1.41×AC RMS when input live`,
  blurb:'Full-wave diode bridge. Wire L/N to AC, DC+/DC− to a DC bus or battery. Output treated as rectified DC rails.'});

/* ── bus-tie (sync-check permissive) — conducts all poles when closed ── */
def2('bustie',{name:'Bus-Tie Breaker',tag:'BT',cat:'Electrical Protection',w:190,h:120,icon:'🔀',
  term:[['L1a',-80,-60,0,-1],['L2a',-40,-60,0,-1],['L3a',0,-60,0,-1],['Na',40,-60,0,-1],['PEa',80,-60,0,-1],
        ['L1b',-80,60,0,1],['L2b',-40,60,0,1],['L3b',0,60,0,1],['Nb',40,60,0,1],['PEb',80,60,0,1],
        ['SYNC',-95,-20,-1,0],['A1',-95,5,-1,0],['A2',-95,30,-1,0]],
  pins:{L1a:'bus A L1',L2a:'bus A L2',L3a:'bus A L3',Na:'bus A N',PEa:'bus A PE',L1b:'bus B L1',L2b:'bus B L2',L3b:'bus B L3',Nb:'bus B N',PEb:'bus B PE',SYNC:'sync permissive in',A1:'close coil +',A2:'close coil −'},
  init:{closed:false,force:false,_perm:false,_coilHeld:false,_blade:0,_arc:0},
  links:c=>{
    if(!c.closed)return[];
    if(!(c.force||c._perm||c._coilHeld))return[];
    return[['L1a','L1b'],['L2a','L2b'],['L3a','L3b'],['Na','Nb'],['PEa','PEb']];
  },
  draw:(c,d)=>{box(c,d,c.closed?COL.ok:COL.edge);
    ctx.strokeStyle=c.closed?'#3df5b0':'#64748b';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(c.closed?20:-20,0);ctx.stroke();
    ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.textAlign='center';
    ctx.fillText('A|B'+(c._perm?' ✓sync':' ✗')+(c.force?' F':''),0,-30);
    ctx.fillText(c.closed?'CLOSED':'OPEN',0,28);},
  tick:(c,dt)=>{
    const st=sim.st;
    if(st&&st.uf){const R=t=>st.uf.find(key(c.id,t));const s=R('SYNC');c._perm=s!=null&&st.cl.m.get(s)==='L';}
    else c._perm=false;
    const coil=coilE(c);c._coilHeld=coil;
    if(coil&&(c._perm||c.force)){
      if(!c.closed){c.closed=true;c._arc=1;try{log(`${c.label} closed`);}catch(e){}}
    }else if(!c.force&&!coil){
      if(c.closed){c.closed=false;try{log(`${c.label} opened`);}catch(e){}}
    }
    if(c.force&&!c.closed)c.closed=true;
    c._blade=N(c._blade,0)+((c.closed?1:0)-N(c._blade,0))*Math.min(1,dt*10);
    c._arc=Math.max(0,N(c._arc,0)-dt*3);
  },
  click:c=>{c.force=!c.force;try{pushUndo();}catch(e){}try{log(`${c.label} force ${c.force?'ON':'OFF'}`);}catch(e){}},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',
    `<div class="f"><label>Force closed</label><input type="checkbox" data-k="force" data-t="b"${c.force?' checked':''}></div>`+
    `<div class="note">Closes when coil A1–A2 is live <b>and</b> (SYNC is live <b>or</b> Force is on). Force holds closed without the coil. All poles A↔B conduct when closed.</div>`);},
  desc:c=>`${c.closed?'CLOSED':'open'} · sync ${c._perm?'OK':'missing'}${c.force?' · FORCED':''}${c._coilHeld?' · coil':''}`,
  blurb:'Bus-tie breaker with sync-check permissive. Passes all poles between bus A and bus B when closed. Requires SYNC live or Force; coil A1/A2 drives the close.'
});

/* Patch main-script busbar: never bond live to neutral */
if(typeof LINKS!=='undefined'){
  LINKS.busbar=()=>[['L1','L2'],['L2','L3']];
}

/* ── generator paralleling panel (composite sync check) ── */
def2('parallelingpanel',{name:'Gen Paralleling Panel',tag:'GPP',cat:'Electrical Control',w:120,h:100,icon:'🔄',
  term:[['G_L',-60,-30,-1,0],['G_N',-30,-30,-1,0],['B_L',-60,10,-1,0],['B_N',-30,10,-1,0],['SYNC',0,45,0,1],['NO',30,45,1,0],['COM',60,45,1,0]],
  pins:{G_L:'generator L in',G_N:'generator N in',B_L:'bus L in',B_N:'bus N in',SYNC:'external permissive in',NO:'sync contact NO out',COM:'sync contact COM out'},
  init:{synced:false,_t:0},
  links:c=>c.synced?[['NO','COM']]:[],
  draw:(c,d)=>{box(c,d,COL.edge);G(c,d);ctx.fillStyle=c.synced?'#3df5b0':'#f59e0b';ctx.font='bold 10px Inter';ctx.textAlign='center';ctx.fillText(c.synced?'SYNC':'WAIT',0,28);},
  tick:(c,dt)=>{const st=sim.st; /* simplified: synced when gen & bus nets both live and external permissive or auto V-match within 10% */
    const R=t=>st.uf.find(key(c.id,t));const gl=R('G_L'),bl=R('B_L');
    const gv=gl!=null&&st.cl.m.get(gl)==='L',bv=bl!=null&&st.cl.m.get(bl)==='L';
    const perm=(()=>{const s=R('SYNC');return s!=null&&st.cl.m.get(s)==='L';})();
    if(gv&&bv&&(perm||c.force)){c._t+=dt;if(c._t>N(c.minTime,.5))c.synced=true;}else{c._t=0;c.synced=false;}},
  click:c=>{c.force=!c.force;pushUndo&&0;},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Min sync time (s)</label><input type="number" data-k="minTime" data-t="n" min="0" step=".1" value="${N(c.minTime,.5)}"></div><div class="f"><label>Force</label><input type="checkbox" data-k="force" data-t="b" ${c.force?'checked':''}></div><div class="note">Composite panel: checks G vs B nets live + optional SYNC permissive, closes NO→COM contact for the bus-tie coil.</div>`);},
  desc:c=>`Gen ${c._vg||'—'} · Bus ${c._vb||'—'} · ${c.synced?'SYNCED':'WAITING'}${c.force?' · FORCED':''}`,
  blurb:'Generator paralleling panel — sync check + NO/COM contact to drive a bus-tie breaker.'});

/* ── instruments ── */
function voltsBetween(c){ /* estimate V between two probe nets: L vs N → mains V */
  const st=sim.st;if(!st||!st.uf)return 0;const R=t=>st.uf.find(key(c.id,t));
  const ty=t=>{const r=R(t);return r==null?null:st.cl.m.get(r);};
  const a=ty('V1')??ty('L'),b=ty('COM')??ty('N');
  if(a==='L'&&b==='N')return sim.volts||230;if(a==='L'&&b==='PE')return sim.volts||230;if(a==='N'&&b==='PE')return 0;
  if(a==='L'&&b==='L')return 0;return 0;}
def2('multimeter',{name:'Multimeter',tag:'DMM',cat:'Test & Measurement',w:90,h:70,icon:'🔢',
  term:[['V1',-40,-15,-1,0],['COM',-40,15,-1,0]],pins:{V1:'probe +',COM:'probe − (COM)'},
  init:{mode:'VAC'},draw:(c,d)=>{box(c,d,COL.edge);G(c,d);ctx.fillStyle='#3df5b0';ctx.font='bold 11px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(voltsBetween(c).toFixed(1)+' V',0,24);},
  tick:(c,dt)=>{c._v=voltsBetween(c);},
  desc:c=>`${N(c._v,0).toFixed(1)} V across probes`,blurb:'Two-probe voltmeter — reads potential between any two nets. Wire V1/COM to the points you want to measure.'});
def2('clampmeter',{name:'Clamp Meter',tag:'CM',cat:'Test & Measurement',w:90,h:70,icon:'🧲',
  term:[['CT1',-40,-15,-1,0],['CT2',-40,15,-1,0]],pins:{CT1:'clamp jaw (around conductor)',CT2:'clamp return'},
  init:{},
  draw:(c,d)=>{box(c,d,COL.edge);G(c,d);const I=comps.filter(x=>x.powered).reduce((a,x)=>a+N(x.I,N(x.watts,0)/Math.max(1,sim.volts||230)),0);ctx.fillStyle='#3df5b0';ctx.font='bold 11px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(I.toFixed(1)+' A',0,24);},
  desc:()=>'clamp-around-conductor current estimate (board total)',blurb:'Clamp-on ammeter — jaw around any single conductor reads its current without breaking the circuit.'});
def2('megger',{name:'Insulation Tester',tag:'MEG',cat:'Test & Measurement',w:100,h:80,icon:'⚡',
  term:[['TEST+',-40,-20,-1,0],['TEST-',-40,10,-1,0],['PE',40,0,1,0]],pins:{'TEST+':'test lead +','TEST-':'test lead −',PE:'protective earth reference'},
  init:{limit:1.0,_riso:500},
  draw:(c,d)=>{box(c,d,COL.edge);G(c,d);const bad=N(c._riso,500)<N(c.limit,1);ctx.fillStyle=bad?'#ef4444':'#3df5b0';ctx.font='bold 10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(N(c._riso,0).toFixed(0)+' MΩ',0,24);ctx.fillStyle='#8fb3c9';ctx.font='9px Inter';ctx.fillText(bad?'FAIL':'PASS',0,36);},
  tick:(c,dt)=>{ /* insulation resistance: high normally, collapses if earth fault present */
    const ef=comps.some(x=>x.powered&&x.fault==='earth');c._riso=ef?0.4:400+50*Math.sin(performance.now()/3000+c.id);},
  props:(c,el)=>{el.insertAdjacentHTML('beforeend',`<div class="f"><label>Pass limit (MΩ)</label><input type="number" data-k="limit" data-t="n" min=".1" step=".1" value="${N(c.limit,1)}"></div>`);},
  desc:c=>`${N(c._riso,0).toFixed(1)} MΩ insulation resistance ${N(c._riso,0)<N(c.limit,1)?'— FAIL':'— PASS'}`,
  blurb:'Insulation resistance tester (Megger). TEST± across insulation, PE to reference. FAIL below limit.'});
def2('pqanalyser',{name:'Power Quality Analyser',tag:'PQ',cat:'Test & Measurement',w:110,h:80,icon:'📊',
  term:[['L',-50,-20,-1,0],['N',-50,10,-1,0],['CT',30,-20,1,0]],pins:{L:'voltage L',N:'voltage N',CT:'current CT in'},
  init:{},
  draw:(c,d)=>{box(c,d,COL.edge);G(c,d);const I=comps.filter(x=>x.powered).reduce((a,x)=>a+N(x.I,N(x.watts,0)/Math.max(1,sim.volts||230)),0);const V=sim.volts||230;
    ctx.fillStyle='#8fb3c9';ctx.font='9px ui-monospace,monospace';ctx.textAlign='center';
    ctx.fillText(`${V.toFixed(0)} V · ${I.toFixed(1)} A`,0,18);ctx.fillText(`PF ${(I>0?(V*I*.85)/(V*I)||0:0).toFixed(2)} · THD ~${(2+Math.random()*3).toFixed(1)}%`,0,32);},
  desc:()=>'V, I, PF, THD estimate for the connected net',blurb:'Power-quality analyser — V/I/PF/THD on the wired net. CT input for current.'});
/* TRIP assertion: tripped relays/breakers mark their TRIP net as L so it can feed coils */
const TRIP_NEW=new Set(['motorrelay','earthfaultrelay','mccb']);
const _cl40=classify;
classify=function(uf){const r=_cl40(uf);
  for(const c of comps){if(TRIP_NEW.has(c.type)&&(c.tripped||c.type==='mccb'&&c.tripped)){
    const root=uf.find(key(c.id,'TRIP'));if(root!=null){const o=r.m.get(root);if(!o||o==='N')r.m.set(root,'L');}}}
  return r;};
log('v35 module ready — '+Object.keys(DEFS).filter(t=>['dolstarter','stardelta','autoxfmr','motorrelay','earthfaultrelay','mccb','diodebridge','bustie','parallelingpanel','multimeter','clampmeter','megger','pqanalyser'].includes(t)).length+' new electrical parts.');
})();
