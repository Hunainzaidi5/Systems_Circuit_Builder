/* ══════════ v17 · PIN POINTS & TAGS · MARQUEE SELECTION OF WIRES / PIPES ══════════
 * 1. Pin overlay: clearer pin glyphs (colour-coded by function, open pins drawn hollow), name tags in pills that do
 *    not overlap, hover card with function + live state + what it is wired to, wiring-mode highlight of compatible
 *    pins, "Pins" display mode button, and a pinout table in the properties panel (click a row to locate the pin).
 * 2. Drag a box on empty canvas to select wires and pipes (→ window: fully inside, ← crossing: touching),
 *    Shift+click adds/removes one, Ctrl+A selects all, Delete removes the group, group panel in Properties. */
(function(){
'use strict';
const num=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2;
const LS={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};

/* ═════════ pin classification & descriptions ═════════ */
const CLS={
 pwr:{col:'#ffb020',name:'power / live'},neu:{col:'#4aa3ff',name:'neutral / 0 V'},pe:{col:'#4ade80',name:'protective earth'},
 sig:{col:'#2dd4bf',name:'signal / I-O'},coil:{col:'#c084fc',name:'coil / control'},hyd:{col:'#59c3ff',name:'fluid port'},
 out:{col:'#f97316',name:'output / load'},oth:{col:'#9db4cf',name:'terminal'}};
function pinClass(name,isH){
  if(isH)return'hyd';const n=String(name);
  if(/^PE/i.test(n)||/^GND$/i.test(n)||/^E$/i.test(n))return'pe';
  if(/^(N|0V|-|N_|IN_N|AC_N|GRID_N|GEN_N|OUT_N|N\d)/i.test(n)||/(^|_)(N|0V|NEG)$/i.test(n))return'neu';
  if(/^(L\d?|L_|\+V?|VCC|24V|IN_L|AC_L|GRID_L|GEN_L|OUT_L|U|V|W|T\d|R|S|T)$/i.test(n)||/^(L\d?_|\+)/.test(n))return'pwr';
  if(/^(A1|A2|Y\d?|\+_in|-_in|coil)/i.test(n))return'coil';
  if(/^(I\d|DI\d|AI\d|RST|EXT|RET|HI|LO|PUL|A|B|Z|ALM|SIG|CH\d)$/i.test(n)||/^(DI|AI|I)\d/i.test(n))return'sig';
  if(/^(O\d|Q\d|OUT\d|DO\d|NO|NC|COM|C\d?)$/i.test(n)||/_out$/i.test(n))return'out';
  return'oth';}
const DICT={L:'Line / live (phase)',N:'Neutral',PE:'Protective earth','+':'Positive','-':'Negative','+V':'Supply + (24 V DC)','0V':'Supply 0 V / common',
 A1:'Coil A1 (+)',A2:'Coil A2 (−)',COM:'Common contact',NO:'Normally-open contact',NC:'Normally-closed contact',IN:'Inlet',OUT:'Outlet',
 P:'Pressure supply',T:'Tank return',A:'Work port A',B:'Work port B',SUC:'Pump suction',DIS:'Pump discharge',
 L1:'Phase L1',L2:'Phase L2',L3:'Phase L3',U:'Motor phase U',V:'Motor phase V',W:'Motor phase W',Z:'Index pulse',RST:'Reset / zero input',
 EXT:'Fully-extended sensor',RET:'Fully-retracted sensor',HI:'High alarm output',LO:'Low alarm output',PUL:'Pulse output',DI1:'Digital input 1',DI2:'Digital input 2',
 Q1:'Digital output 1',Q2:'Digital output 2',P1:'Port 1',P2:'Port 2',Y1:'Solenoid Y1 (+)',Y2:'Solenoid Y2 (+)',Y:'Solenoid (+)',
 AIR_IN:'Air inlet',AIR_OUT:'Charge-air outlet',EXHAUST_IN:'Exhaust gas inlet',EXHAUST_OUT:'Exhaust gas outlet'};
function pinDesc(c,t){const d=DEFS[c.type]||{};if(d.pins&&d.pins[t])return d.pins[t];
  if(DICT[t])return DICT[t];
  let m;if((m=/^I(\d+)$/.exec(t)))return'Digital input '+m[1];if((m=/^O(\d+)$/.exec(t)))return'Digital output '+m[1]+' (switches L)';
  if((m=/^(.*)_(in|out)$/i.exec(t)))return(DICT[m[1]]||m[1])+(m[2].toLowerCase()==='in'?' — input side':' — output side');
  if((m=/^OUT(\d)$/.exec(t)))return'Output '+m[1];return'';}
const MODES=[['tags','Pins: tags'],['detail','Pins: + functions']];
let mode=LS.get('circuitLab.pinMode');if(!MODES.some(m=>m[0]===mode))mode='tags';

/* ═════════ overlay canvas ═════════ */
const ov=document.createElement('canvas');ov.id='pinOverlay';ov.style.cssText='position:absolute;pointer-events:none;z-index:2';
cv.parentNode.insertBefore(ov,cv.nextSibling);const o=ov.getContext('2d');
const st0=document.createElement('style');
st0.textContent=`#tip.pinhide{visibility:hidden!important}
.pintbl{width:100%;border-collapse:collapse;font-size:11px;margin-top:4px}.pintbl td{padding:3px 4px;border-bottom:1px solid var(--line,#22364f);vertical-align:top}
.pintbl tr.pr{cursor:pointer}.pintbl tr.pr:hover td{background:rgba(0,180,216,.13)}
.pdot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:-1px;border:1.5px solid}.pdot.h{border-radius:2px}
.pintbl .st{font-weight:700;white-space:nowrap}.pintbl .pk{opacity:.65;font-size:10px}
#bPins{white-space:nowrap}.mwbox .row{flex-wrap:wrap}`;
document.head.appendChild(st0);
function syncOv(){const r=cv.getBoundingClientRect();
  if(ov.width!==cv.width||ov.height!==cv.height){ov.width=cv.width;ov.height=cv.height;}
  const s=ov.style;s.left=cv.offsetLeft+'px';s.top=cv.offsetTop+'px';s.width=r.width+'px';s.height=r.height+'px';return r;}

/* header button */
{const tb=document.createElement('div');tb.className='tb';tb.innerHTML='<button id="bPins" title="Cycle pin display: name tags / tags with functions">'+MODES.find(m=>m[0]===mode)[1]+'</button>';
 const h=document.querySelector('header');if(h)h.appendChild(tb);
 document.getElementById('bPins').onclick=()=>{mode=MODES[(MODES.findIndex(m=>m[0]===mode)+1)%MODES.length][0];LS.set('circuitLab.pinMode',mode);document.getElementById('bPins').textContent=MODES.find(m=>m[0]===mode)[1];};}

/* ═════════ geometry helpers ═════════ */
const wireById=id=>wires.find(w=>w.id===id);
function connMap(){const m=new Map();for(const w of wires){const a=key(w.a.c,w.a.t),b=key(w.b.c,w.b.t);(m.get(a)||m.set(a,[]).get(a)).push(w.b);(m.get(b)||m.set(b,[]).get(b)).push(w.a);}return m;}
const pinLabel=r=>{const c=getC(r.c);return c?c.label+'.'+r.t:'?';};
function netState(c,t,isH){const st=sim.st,k=key(c.id,t);
  if(isH){const fl=sim.hu&&sim.hflow&&sim.hflow.has(sim.hu.find(k));return fl?['flowing','#59c3ff']:['no flow','#6b8299'];}
  const ty=st?st.cl.m.get(st.uf.find(k)):null;
  if(!ty)return['dead / floating','#6b8299'];
  const nm={L:'LIVE phase / +',L2:'LIVE phase L2',L3:'LIVE phase L3',N:'neutral / −',PE:'earth'}[ty]||String(ty);
  return[nm,(typeof netColor==='function'?netColor(ty):'#9db4cf')];}
function textW(s,font){o.font=font;return o.measureText(s).width;}
function rrect(x,y,w,h,r){o.beginPath();o.moveTo(x+r,y);o.arcTo(x+w,y,x+w,y+h,r);o.arcTo(x+w,y+h,x,y+h,r);o.arcTo(x,y+h,x,y,r);o.arcTo(x,y,x+w,y,r);o.closePath();}
let flash=null;                                  /* {c,t,until} from the properties table */

/* ═════════ drawing ═════════ */
function drawPins(now){
  const r=syncOv();o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,ov.width,ov.height);
  const sc=ov.width/Math.max(1,r.width);o.setTransform(sc,0,0,sc,0,0);
  const tip=document.getElementById('tip');if(tip)tip.classList.toggle('pinhide',!!hoverTerm);
  const z=view.z,wiringOn=!!wiring&&!!wiring.from,fromKind=wiringOn?tkind(wiring.from):null;
  const conn=connMap(),selC=selected&&selected.kind==='c'?selected.id:null,showAll=true;
  /* --- marquee preview of wires --- */
  if(marquee&&Math.hypot(marquee.cx-marquee.sx,marquee.cy-marquee.sy)>5){const ids=marqueeWires();
    o.save();o.translate(view.x,view.y);o.scale(z,z);o.lineJoin='round';o.lineCap='round';
    for(const w of wires)if(ids.has(w.id)&&w._P){pathOf(w._P);o.strokeStyle='rgba(255,209,102,.5)';o.lineWidth=14;o.stroke();}
    o.restore();}
  /* --- multi-selected wires --- */
  if(multiWires.size){o.save();o.translate(view.x,view.y);o.scale(z,z);o.lineJoin='round';o.lineCap='round';
    for(const id of multiWires){const w=wireById(id);if(!w||!w._P)continue;
      pathOf(w._P);o.strokeStyle='rgba(255,209,102,.30)';o.lineWidth=16;o.stroke();
      pathOf(w._P);o.setLineDash([7,6]);o.lineDashOffset=-now*.02;o.strokeStyle='#ffd166';o.lineWidth=2.2;o.stroke();o.setLineDash([]);}
    o.restore();}
  /* --- pins --- */
  o.save();o.translate(view.x,view.y);o.scale(z,z);
  const tags=[];
  for(const c of comps){const d=DEFS[c.type];if(!d)continue;
    for(const t of d.term){const p=termWorld(c.id,t[0]);if(!p)continue;const isH=t[5]==='h',k=key(c.id,t[0]),cls=CLS[pinClass(t[0],isH)],isConn=conn.has(k);
      const hot=hoverTerm&&hoverTerm.c===c.id&&hoverTerm.t===t[0];
      const fl=flash&&flash.c===c.id&&flash.t===t[0]&&flash.until>now;
      const compat=!wiringOn||tkind({c:c.id,t:t[0]})===fromKind;
      const isFrom=wiringOn&&wiring.from.c===c.id&&wiring.from.t===t[0];
      const al=compat?1:.28;o.globalAlpha=al;
      /* stub from the body edge to the pin so the pin reads as a connection point */
      o.strokeStyle=cls.col;o.lineWidth=1.6;o.globalAlpha=.55*al;o.beginPath();o.moveTo(p.x,p.y);o.lineTo(p.x-p.dx*6,p.y-p.dy*6);o.stroke();o.globalAlpha=al;
      const R=hot?7.5:5.6;
      if(wiringOn&&compat&&!isFrom){const pu=.5+.5*Math.sin(now*.008);o.beginPath();o.arc(p.x,p.y,R+3+3*pu,0,TAU);o.strokeStyle=cls.col;o.globalAlpha=.35+.35*pu;o.lineWidth=1.6;o.stroke();o.globalAlpha=al;}
      if(fl){const pu=.5+.5*Math.sin(now*.02);o.beginPath();o.arc(p.x,p.y,10+6*pu,0,TAU);o.strokeStyle='#fff';o.lineWidth=2.4;o.stroke();}
      if(isConn){o.beginPath();o.arc(p.x,p.y,R+2.2,0,TAU);o.fillStyle=cls.col;o.globalAlpha=.22*al;o.fill();o.globalAlpha=al;}
      /* glyph: hydraulic = square port, electrical = round terminal; open pins hollow, wired pins filled */
      o.beginPath();if(isH)o.rect(p.x-R,p.y-R,R*2,R*2);else o.arc(p.x,p.y,R,0,TAU);
      o.fillStyle=isConn?cls.col:'#08111f';o.fill();o.lineWidth=hot?2.4:1.9;o.strokeStyle=hot?'#fff':cls.col;o.stroke();
      if(!isConn){o.beginPath();o.arc(p.x,p.y,1.5,0,TAU);o.fillStyle=cls.col;o.fill();}
      else{o.beginPath();o.arc(p.x,p.y,2,0,TAU);o.fillStyle='#08111f';o.fill();}
      o.globalAlpha=1;
      if(c.type!=='junction'&&(showAll||selC===c.id||hot||wiringOn||fl))
        tags.push({c,t:t[0],p,cls,hot,fl,isH,compat,detail:mode==='detail'&&z>=.9});
    }}
  /* --- tags: pill labels, anchored inside the part like the original, nudged apart --- */
  const fs=clamp(9.5/clamp(z,.8,1.7),8,12),font='700 '+fs+'px Inter,system-ui,sans-serif',dfont='600 '+(fs-1)+'px Inter,system-ui,sans-serif';
  for(const g of tags){const p=g.p,txt=g.t,w=textW(txt,font)+8,h=fs+4;let x,y;
    if(p.dx>0){x=p.x-7-w;y=p.y-h/2;}else if(p.dx<0){x=p.x+7;y=p.y-h/2;}else if(p.dy<0){x=p.x-w/2;y=p.y+5;}else{x=p.x-w/2;y=p.y-5-h;}
    g.x=x;g.y=y;g.w=w;g.h=h;}
  const byC=new Map();for(const g of tags)(byC.get(g.c.id)||byC.set(g.c.id,[]).get(g.c.id)).push(g);
  for(const arr of byC.values()){arr.sort((a,b)=>a.y-b.y||a.x-b.x);
    for(let i=1;i<arr.length;i++){for(let j=0;j<i;j++){const a=arr[j],b=arr[i];
      if(b.x<a.x+a.w&&a.x<b.x+b.w&&b.y<a.y+a.h&&a.y<b.y+b.h)b.y=a.y+a.h+1;}}}
  for(const g of tags){o.globalAlpha=g.compat?1:.3;
    rrect(g.x,g.y,g.w,g.h,g.h/2);o.fillStyle=g.hot?'rgba(0,40,62,.98)':'rgba(7,15,28,.93)';o.fill();
    o.lineWidth=g.hot?1.6:1;o.strokeStyle=g.hot?'#fff':g.cls.col;o.globalAlpha=(g.compat?1:.3)*(g.hot?1:.7);o.stroke();o.globalAlpha=g.compat?1:.3;
    o.font=font;o.textBaseline='middle';o.textAlign='center';o.fillStyle=g.hot?'#fff':g.cls.col;o.fillText(g.t,g.x+g.w/2,g.y+g.h/2+.5);
    if(g.detail){const ds=pinDesc(g.c,g.t);if(ds){const dw=textW(ds,dfont)+8,dx=g.p.dx>0?g.x-dw-3:g.x+g.w+3;o.font=dfont;rrect(dx,g.y,dw,g.h,g.h/2);o.fillStyle='rgba(7,15,28,.88)';o.fill();o.fillStyle='#9fb6d0';o.fillText(ds,dx+dw/2,g.y+g.h/2+.5);}}
    o.globalAlpha=1;}
  o.restore();
  /* --- hover card (screen space) --- */
  if(hoverTerm&&!wiringOn||(wiringOn&&wiring.target)){const ref=wiringOn?wiring.target:hoverTerm;if(ref)hoverCard(ref,sc,r,wiringOn);}
}
function pathOf(P){o.beginPath();P.forEach((q,i)=>i?o.lineTo(q.x,q.y):o.moveTo(q.x,q.y));}
function hoverCard(ref,sc,r,wiringOn){
  const c=getC(ref.c);if(!c)return;const d=DEFS[c.type],t=d.term.find(q=>q[0]===ref.t);if(!t)return;const isH=t[5]==='h';
  const cls=CLS[pinClass(ref.t,isH)],desc=pinDesc(c,ref.t),[state,scol]=netState(c,ref.t,isH);
  const link=(connMap().get(key(c.id,ref.t))||[]).map(pinLabel);
  const lines=[[c.label+' · '+ref.t,'#fff','800 12px Inter,system-ui,sans-serif']];
  if(desc)lines.push([desc,'#cfe0f2','600 11px Inter,system-ui,sans-serif']);
  lines.push([(isH?'pipe port':'wire terminal')+' · '+cls.name,cls.col,'600 10px Inter,system-ui,sans-serif']);
  lines.push([state,scol,'700 11px Inter,system-ui,sans-serif']);
  if(link.length)lines.push(['→ '+link.slice(0,3).join(', ')+(link.length>3?' …':''),'#9db4cf','600 10px Inter,system-ui,sans-serif']);
  else lines.push([wiringOn?'click to connect':'not connected','#7e93ab','600 10px Inter,system-ui,sans-serif']);
  o.save();o.setTransform(sc,0,0,sc,0,0);
  let w=0;for(const l of lines)w=Math.max(w,textW(l[0],l[2]));w+=18;const lh=16,h=lines.length*lh+10;
  const p=termWorld(c.id,ref.t),sx=p.x*view.z+view.x,sy=p.y*view.z+view.y;
  let x=sx+(p.dx>=0?18:-18-w),y=sy-h/2;if(p.dx===0){x=sx-w/2;y=sy+(p.dy>0?18:-18-h);}
  x=clamp(x,4,r.width-w-4);y=clamp(y,4,r.height-h-4);
  rrect(x,y,w,h,8);o.fillStyle='rgba(6,14,26,.96)';o.fill();o.strokeStyle=cls.col;o.lineWidth=1.4;o.stroke();
  o.fillStyle=cls.col;o.fillRect(x+1,y+8,3,h-16);
  o.textAlign='left';o.textBaseline='middle';lines.forEach((l,i)=>{o.font=l[2];o.fillStyle=l[1];o.fillText(l[0],x+11,y+5+lh*i+lh/2);});
  o.restore();}

/* ═════════ multi-selection of wires / pipes ═════════ */
const multiWires=new Set();
function rectWorld(m){const a=toWorld(Math.min(m.sx,m.cx),Math.min(m.sy,m.cy)),b=toWorld(Math.max(m.sx,m.cx),Math.max(m.sy,m.cy));return{x0:a.x,y0:a.y,x1:b.x,y1:b.y};}
const inR=(p,r)=>p.x>=r.x0&&p.x<=r.x1&&p.y>=r.y0&&p.y<=r.y1;
function segHits(a,b,r){if(inR(a,r)||inR(b,r))return true;const dx=b.x-a.x,dy=b.y-a.y,P=[-dx,dx,-dy,dy],Q=[a.x-r.x0,r.x1-a.x,a.y-r.y0,r.y1-a.y];let t0=0,t1=1;
  for(let i=0;i<4;i++){if(P[i]===0){if(Q[i]<0)return false;}else{const t=Q[i]/P[i];if(P[i]<0){if(t>t1)return false;if(t>t0)t0=t;}else{if(t<t0)return false;if(t<t1)t1=t;}}}return true;}
function wireInRect(w,r,windowMode){const P=w._P;if(!P||P.length<2)return false;
  if(windowMode)return P.every(p=>inR(p,r));
  for(let i=0;i<P.length-1;i++)if(segHits(P[i],P[i+1],r))return true;return false;}
function marqueeWires(m){m=m||marquee;if(!m)return new Set();const r=rectWorld(m),win=m.cx>=m.sx,s=new Set();
  for(const w of wires)if(wireInRect(w,r,win))s.add(w.id);return s;}
let snap_=null;                                    /* marquee snapshot taken before the core handler clears it */
window.addEventListener('mouseup',e=>{
  snap_=null;if(marquee){const moved=Math.hypot(marquee.cx-marquee.sx,marquee.cy-marquee.sy)>5;
    snap_={moved,ids:moved?marqueeWires():null,shift:e.shiftKey||(marquee.base&&marquee.base.size>0)};}},true);
window.addEventListener('mouseup',e=>{
  if(!snap_)return;const s=snap_;snap_=null;
  if(s.moved){if(!s.shift)multiWires.clear();for(const id of s.ids)multiWires.add(id);
    if(multiWires.size){selected=multiSelected.size?selected:null;
      log(`Selected ${multiWires.size} wire/pipe${multiWires.size>1?'s':''}${multiSelected.size?' and '+multiSelected.size+' part'+(multiSelected.size>1?'s':''):''}`);}
    renderProps();}
  else if(!e.shiftKey){if(multiWires.size){multiWires.clear();renderProps();}}
});
/* Shift+click a wire/pipe toggles it in the group */
cv.addEventListener('mousedown',e=>{
  if(e.button!==0||!e.shiftKey||wiring)return;const r=cv.getBoundingClientRect(),p=toWorld(e.clientX-r.left,e.clientY-r.top);
  if(hitTerm(p)||hitComp(p))return;const w=hitWire(p);if(!w)return;
  if(selected&&selected.kind==='w'&&!multiWires.size)multiWires.add(selected.id);
  if(multiWires.has(w.id))multiWires.delete(w.id);else multiWires.add(w.id);
  selected=null;renderProps();e.stopImmediatePropagation();e.preventDefault();},true);
/* plain click on any part / wire / terminal clears the wire group */
cv.addEventListener('mousedown',e=>{if(e.button===0&&!e.shiftKey&&multiWires.size){const r=cv.getBoundingClientRect(),p=toWorld(e.clientX-r.left,e.clientY-r.top);
  if(hitTerm(p)||hitComp(p)||hitWire(p)){multiWires.clear();}}},true);
window.addEventListener('keydown',e=>{
  if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)&&document.activeElement.type!=='range')return;
  const k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&k==='a'){for(const w of wires)multiWires.add(w.id);setTimeout(renderProps,0);}
  else if(k==='escape'){multiWires.clear();setTimeout(renderProps,0);}
},true);
const _del=delSel;
delSel=function(){
  if(multiWires.size){pushUndo();const n=multiWires.size;wires=wires.filter(w=>!multiWires.has(w.id));multiWires.clear();selected=multiSelected.size?selected:null;
    log(`Deleted ${n} wire/pipe${n>1?'s':''}`);
    if(multiSelected.size){_del();return;}renderProps();return;}
  return _del();};
{const b=document.getElementById('bDel');if(b)b.onclick=()=>delSel();}
{const _r=restore;restore=function(s){multiWires.clear();return _r(s);};}
const WCOL=[['','Automatic (by net)'],['#ef4444','Red'],['#f97316','Orange'],['#facc15','Yellow'],['#22c55e','Green'],['#3b82f6','Blue'],['#a855f7','Violet'],['#e5e7eb','White'],['#6b7280','Grey']];

/* ═════════ properties: group panel + pinout table ═════════ */
const _rp=renderProps;
renderProps=function(){
  _rp();const el=document.getElementById('props');if(!el)return;
  const c=selected&&selected.kind==='c'?getC(selected.id):null;
  /* replace the old one-line PINOUT notes with the table */
  [...el.querySelectorAll('.note')].forEach(n=>{if(n.textContent.trim()==='PINOUT'){const nx=n.nextElementSibling;if(nx&&nx.classList.contains('note'))nx.remove();n.remove();}});
  if(c){const d=DEFS[c.type];if(d&&d.term&&d.term.length&&c.type!=='junction'){
    const conn=connMap();
    const rows=d.term.map(t=>{const isH=t[5]==='h',cls=CLS[pinClass(t[0],isH)],link=(conn.get(key(c.id,t[0]))||[]).map(pinLabel);
      return`<tr class="pr" data-pt="${esc(t[0])}"><td><span class="pdot${isH?' h':''}" style="border-color:${cls.col};background:${link.length?cls.col:'transparent'}"></span><b style="color:${cls.col}">${esc(t[0])}</b><div class="pk">${isH?'pipe':'wire'}</div></td>`+
        `<td>${esc(pinDesc(c,t[0])||'—')}${link.length?`<div class="pk">→ ${esc(link.slice(0,3).join(', '))}</div>`:''}</td><td class="st" data-st="${esc(t[0])}">…</td></tr>`;}).join('');
    el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">PINOUT · ${d.term.length} pins <span class="pk">(click a row to locate it)</span></div><table class="pintbl">${rows}</table>`);
    refreshPinState();}}
  if(multiWires.size){
    const ws=[...multiWires].map(wireById).filter(Boolean);multiWires.clear();ws.forEach(w=>multiWires.add(w.id));
    if(!ws.length)return;const np=ws.filter(isPipe).length,ne=ws.length-np;
    const opt=WCOL.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
    const html=`<div class="mwbox"><div class="note" style="color:#ffd166;font-weight:800">${ws.length} wires/pipes selected</div>`+
      `<div class="note">${ne} wire${ne===1?'':'s'} · ${np} pipe${np===1?'':'s'}. Drag a box on empty canvas to select more (→ fully inside, ← touching), Shift+click to add/remove one.</div>`+
      `<div class="row"><button data-act="mwdel" class="danger">Delete selected</button><button data-act="mwroute">Auto-route</button><button data-act="mwclr">Clear selection</button></div>`+
      (ne?`<div class="f"><label>Wire colour (electrical only)</label><select id="mwcol">${opt}</select></div>`:'')+`</div>`;
    if(c)el.insertAdjacentHTML('beforeend',html);else el.innerHTML=html;}
};
function refreshPinState(){const el=document.getElementById('props');if(!el)return;const c=selected&&selected.kind==='c'?getC(selected.id):null;if(!c)return;
  const d=DEFS[c.type];el.querySelectorAll('td[data-st]').forEach(td=>{const t=td.dataset.st,def=d.term.find(q=>q[0]===t);if(!def)return;const[s,col]=netState(c,t,def[5]==='h');if(td.textContent!==s)td.textContent=s;td.style.color=col;});}
setInterval(refreshPinState,400);
const propsEl=document.getElementById('props');
propsEl.addEventListener('click',e=>{
  const a=e.target.dataset&&e.target.dataset.act;
  if(a==='mwdel'){delSel();return;}
  if(a==='mwclr'){multiWires.clear();renderProps();return;}
  if(a==='mwroute'){pushUndo();for(const id of multiWires){const w=wireById(id);if(w){w.pts=[];w.bend=0;}}log('Auto-routed '+multiWires.size+' wire/pipe(s)');renderProps();return;}
  const tr=e.target.closest&&e.target.closest('tr.pr');if(tr&&selected&&selected.kind==='c'){flash={c:selected.id,t:tr.dataset.pt,until:performance.now()+1800};}
});
propsEl.addEventListener('change',e=>{if(e.target.id==='mwcol'){pushUndo();const v=e.target.value;for(const id of multiWires){const w=wireById(id);if(w&&!isPipe(w)){if(v)w.color=v;else delete w.color;}}}});
propsEl.addEventListener('mouseover',e=>{const tr=e.target.closest&&e.target.closest('tr.pr');if(tr&&selected&&selected.kind==='c')flash={c:selected.id,t:tr.dataset.pt,until:performance.now()+900};});

/* hint */
{const h=document.getElementById('hint');if(h)h.insertAdjacentHTML('beforeend',' · <b>drag a box</b> on empty canvas to select wires &amp; pipes (→ fully inside, ← touching), Shift+click adds one · <b>Pins</b> button toggles function text beside every pin');}

/* main loop */
(function loop(now){try{drawPins(now||performance.now());}catch(e){if(!loop.err){loop.err=1;console.warn('pin overlay',e);}}requestAnimationFrame(loop);})(performance.now());
log('v17: pin overlay (tags / detail / off), pinout table, and marquee selection of wires & pipes loaded.');
})();
