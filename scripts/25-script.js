/* ══════════ v20 · UX: SAVE v2 · EXPORTS (PNG/BOM/NETLIST) · TREND RECORDER · WIRE NUMBERS ══════════ */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const dl=(name,text,mime)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime||'text/plain'}));a.download=name;a.click();URL.revokeObjectURL(a.href);};
const csvEsc=s=>/[",\n]/.test(s)?'"'+String(s).replace(/"/g,'""')+'"':s;

/* transient-field stripping lives in 01-script.js savePayload() */

/* ── exports ── */
function exportPNG(){try{const a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='circuit-board.png';a.click();log('Board exported as PNG.');}catch(e){log('PNG export failed: '+e.message);}}
function bomCSV(){
  const agg={};for(const c of comps){const d=DEFS[c.type]||{};(agg[c.type]=agg[c.type]||{name:d.name||c.type,cat:d.cat||'',n:0,kw:c.kw||c.power||''});agg[c.type].n++;}
  let s='Type,Name,Category,Qty,Note\n';
  for(const t in agg){const a=agg[t];s+=[csvEsc(t),csvEsc(a.name),csvEsc(a.cat),a.n,''].join(',')+'\n';}
  s+='\nTotal components: '+comps.length+'\nTotal wires/pipes: '+wires.length+'\n';
  dl('bom.csv',s,'text/csv');log('BOM exported ('+comps.length+' parts).');
}
function netlistCSV(){
  const uf=buildUF();
  const nets=new Map();
  const add=(c,t)=>{const r=uf.find(key(c.id,t));if(r==null)return;if(!nets.has(r))nets.set(r,[]);nets.get(r).push(`${DEFS[c.type]?.name||c.type}#${c.id}.${t}`);};
  for(const c of comps)for(const t of(DEFS[c.type].term||[]))if(t[5]!=='h')add(c,t[0]);
  let s='Net,Connected terminals\n';let n=1;
  for(const [r,members] of[...nets.entries()].sort((a,b)=>a[1].length-b[1].length)){
    if(members.length<2)continue;s+=`N${n++},"${members.join(' | ')}"\n`;
  }
  /* wire schedule with wire numbers */
  s+='\nWire schedule\nWire,A (component.terminal),B (component.terminal)\n';
  wires.forEach((w,i)=>{const A=comps.find(c=>c.id===w.a.c),B=comps.find(c=>c.id===w.b.c);
    s+=`W${i+1},${A?DEFS[A.type]?.name+'#'+A.id+'.'+w.a.t:'?'},${B?DEFS[B.type]?.name+'#'+B.id+'.'+w.b.t:'?'}\n`;});
  dl('netlist.csv',s,'text/csv');log('Netlist + wire schedule exported.');
}

/* ── trend recorder ── */
const TR_FIELDS={
  tank:['level'],sump:['level'],feedwatertank:['level'],silo:['level'],
  motor:['I','rpm'],acmotor:['I','rpm'],dcmotor:['I','rpm'],gearpump:['I'],vfd:['amps','rpm'],
  generator:['_f','_V','_P'],gasturbine:['_f','_V','_P'],steamturbine:['_f','_V','_P'],engine4s:['rpm','sp','temperature'],
  boiler:['pressure','temperature'],steamturbine2:[],gastank:['level','pressure'],
  watertemp:['measured','outputMA'],watertempsensor:['measured','outputMA'],gasdetector:['measured','outputMA'],gaspressure:['measured','outputMA'],waterlevelsensor:['measured','outputMA'],
  aimodule:['_mA1','_pv1','_mA2','_pv2'],aomodule:['_mA1','_mA2'],
  pressurecutoff:['pressure'],overcurrentrelay:['measuredI'],differentialrelay:['measuredDiff'],distanceprotection:['measuredZ','measuredI']
};
const TR={on:false,buf:[],cols:null,t:0,max:6000};
function trSample(){
  if(!TR.cols){TR.cols=['time_s'];for(const c of comps)for(const f of(TR_FIELDS[c.type]||[]))TR.cols.push(`${c.label}.${f}`);}
  const row=[+(TR.t).toFixed(1)];
  for(const c of comps)for(const f of(TR_FIELDS[c.type]||[]))row.push(N(c[f],NaN));
  TR.buf.push(row);if(TR.buf.length>TR.max)TR.buf.shift();
}
function trExport(){if(!TR.buf.length){log('No trend data recorded yet.');return;}
  dl('trend.csv','time_s,'+TR.cols.slice(1).join(',')+'\n'+TR.buf.map(r=>r.map(v=>Number.isFinite(v)?v:'').join(',')).join('\n'),'text/csv');
  log(`Trend exported: ${TR.buf.length} samples, ${TR.cols.length-1} channels.`);}
Game.register('uxlab',{tick(dt){if(!TR.on)return;TR.t+=dt;if(TR.t>=0.5){trSample();TR.t=0;}},reset(){TR.buf=[];TR.cols=null;TR.t=0;}});

/* ── wire numbers overlay ── */
let wnums=false;
const _dr25=draw;
draw=function(now){_dr25(now);if(!wnums||!wires.length)return;
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.translate(view.x,view.y);ctx.scale(view.z,view.z);
  ctx.font='600 9px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  wires.forEach((w,i)=>{const P=w._P||routeWire(w);if(!P||P.length<2)return;const m=P[Math.floor(P.length/2)];
    const ox=(m.x>P[0].x?10:-10);ctx.fillStyle='rgba(5,12,22,.75)';ctx.fillRect(m.x+ox-9,m.y-7,18,14);
    ctx.fillStyle='#ffd166';ctx.fillText('W'+(i+1),m.x+ox,m.y);});
  ctx.restore();};

/* ── toolbar buttons ── */
(function(){
  const anchor=$('bLoad');if(!anchor)return;
  const tb=document.createElement('div');tb.className='tb';
  tb.innerHTML='<button id="bPng" title="Export board as PNG image">PNG</button><button id="bBom" title="Bill of materials CSV">BOM</button><button id="bNet" title="Netlist + wire schedule CSV">Netlist</button><button id="bTr" title="Toggle trend recorder">● Rec</button><button id="bWnum" title="Toggle wire numbers on canvas">W#</button><button id="bCsv" title="Export recorded trend CSV">CSV</button>';
  anchor.closest('.tb').insertAdjacentElement('afterend',tb);
  $('bPng').onclick=exportPNG;$('bBom').onclick=bomCSV;$('bNet').onclick=netlistCSV;
  $('bTr').onclick=function(){TR.on=!TR.on;TR.buf=[];TR.cols=null;this.classList.toggle('on',TR.on);this.textContent=TR.on?'■ Stop':'● Rec';log(TR.on?'Trend recorder ON (0.5 s/sample)':'Trend recorder OFF');};
  $('bCsv').onclick=trExport;
  $('bWnum').onclick=function(){wnums=!wnums;this.classList.toggle('on',wnums);};
})();

/* save v2 is handled in 01-script.js via savePayload() — strips transient _ fields, emits {v:2}.
   loadObj() already tolerates both v1 and v2 payloads (it merges DEFS init over saved fields). */
log('v20 module ready — PNG/BOM/netlist export, trend recorder + CSV, wire numbers, save-v2 transient stripping.');
})();
