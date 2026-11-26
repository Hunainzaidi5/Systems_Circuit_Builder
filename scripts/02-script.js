
/* ── v3: procedural icon set, realistic fluid/electron flow, live scope ── */
(function(){
const A={'Electrical Power':'#ffb020','Electrical Protection':'#ff6b81','Process Control':'#a78bfa','Hydraulic Loads':'#38bdf8','Electrical Loads':'#fb923c','Electrical Wiring':'#fbbf24','Hydraulic':'#38bdf8','Hydraulic Instrument':'#22d3ee','Power Generation':'#34d399','Gas System':'#bef264','Steam System':'#cbd5e1','Electrical Control':'#c084fc','Electrical Instrument':'#67e8f9','Gas':'#bef264','Steam':'#cbd5e1','Plumbing':'#5eead4'};
const G={
wave:'<circle class="f" cx="12" cy="12" r="9"/><path d="M6 12c2-5 4-5 6 0s4 5 6 0"/>',
sun:'<circle class="f" cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
batt:'<rect class="f" x="6" y="5" width="12" height="16" rx="2"/><path d="M10 3h4M13 9l-3 4h4l-3 4"/>',
bolt:'<path class="f" d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
coil:'<circle class="f" cx="8" cy="12" r="5"/><circle class="f" cx="16" cy="12" r="5"/>',
breaker:'<rect class="f" x="5" y="3" width="14" height="18" rx="2"/><path d="M12 7v6"/><circle cx="12" cy="17" r="1.2"/>',
shield:'<path class="f" d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
fuse:'<rect class="f" x="3" y="9" width="18" height="6" rx="3"/><path d="M6 12h3l1.5-2 2 4 1.5-2h3"/>',
ground:'<path d="M12 3v9M5 12h14M8 16h8M10.5 20h3"/>',
relay:'<rect class="f" x="3" y="5" width="18" height="14" rx="2"/><path d="M7 12h3M14 12h3M10 12l4-3"/>',
sw:'<circle class="f" cx="5" cy="16" r="2"/><circle class="f" cx="19" cy="16" r="2"/><path d="M6 15l11-8"/>',
pb:'<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
motor:'<rect class="f" x="3" y="7" width="13" height="10" rx="2"/><path d="M16 12h5M6 7V5h7v2M7 10v4M10 10v4M13 10v4"/>',
bulb:'<path class="f" d="M12 3a6 6 0 0 0-3.5 11c.7.7 1 1.5 1 3h5c0-1.5.3-2.3 1-3A6 6 0 0 0 12 3z"/><path d="M10 20h4M10.5 22h3"/>',
heat:'<rect class="f" x="3" y="6" width="18" height="12" rx="2"/><path d="M6 12l2-3 2 6 2-6 2 6 2-3h2"/>',
fan:'<circle cx="12" cy="12" r="1.8"/><path class="f" d="M12 10c0-5 5-6 5-3s-3 3-5 3zM14 12c5 0 6 5 3 5s-3-3-3-5zM12 14c0 5-5 6-5 3s3-3 5-3zM10 12c-5 0-6-5-3-5s3 3 3 5z"/>',
tank:'<path class="f" d="M5 6c0-1.7 3-3 7-3s7 1.3 7 3v12c0 1.7-3 3-7 3s-7-1.3-7-3z"/><path d="M5 6c0 1.7 3 3 7 3s7-1.3 7-3M5 13c2.5 1.5 11.5 1.5 14 0"/>',
drop:'<path class="f" d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
valve:'<path class="f" d="M3 14l9-6v12zM21 14l-9-6v12z"/><path d="M12 8V4M8 4h8"/>',
gauge:'<circle class="f" cx="12" cy="13" r="8"/><path d="M12 13l4-5M6 13h1.5M12 7v1.5M18 13h-1.5"/>',
pipe:'<rect class="f" x="3" y="9" width="18" height="6"/><path d="M6 6v12M18 6v12"/>',
flame:'<path class="f" d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 1 2 2 3 3 1-2 1-5 0-8z"/>',
turbine:'<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 10V4M13.7 13l5 3M10.3 13l-5 3"/>',
tower:'<path class="f" d="M7 3c1 5 1 11-2 18h14c-3-7-3-13-2-18z"/><path d="M8 9c2 1 6 1 8 0M7 15c3 1.5 7 1.5 10 0"/>',
chip:'<rect class="f" x="6" y="6" width="12" height="12" rx="2"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
clock:'<circle class="f" cx="12" cy="13" r="8"/><path d="M12 8v5l3 2M9 3h6"/>',
meter:'<rect class="f" x="4" y="3" width="16" height="18" rx="2"/><rect x="7" y="6" width="10" height="5"/><path d="M8 15h8M8 18h5"/>',
filter:'<path class="f" d="M4 5h16l-6 8v6l-4-2v-4z"/>',
elbow:'<path d="M3 12h9a4 4 0 0 1 4 4v5" stroke-width="5" stroke-opacity=".3"/><path d="M3 12h9a4 4 0 0 1 4 4v5"/>',
tee:'<path d="M3 8h18M12 8v13" stroke-width="5" stroke-opacity=".3"/><path d="M3 8h18M12 8v13"/>',
steam:'<path d="M7 20c-2-3 2-4 0-7s2-4 0-7M13 20c-2-3 2-4 0-7s2-4 0-7M19 20c-2-3 2-4 0-7s2-4 0-7"/>',
comp:'<circle class="f" cx="12" cy="12" r="9"/><path d="M7 15l10-3M7 9l10 3"/>',
bus:'<rect class="f" x="2" y="9" width="20" height="6" rx="1"/><path d="M6 9V5M12 9V5M18 9V5M6 15v4M12 15v4M18 15v4"/>',
cap:'<path d="M3 12h6M15 12h6M9 5v14M15 5v14"/>',
strip:'<rect class="f" x="2" y="8" width="20" height="8" rx="2"/><circle cx="6" cy="12" r="1.3"/><circle cx="10" cy="12" r="1.3"/><circle cx="14" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
solenoid:'<rect class="f" x="5" y="7" width="14" height="10" rx="2"/><path d="M8 7v10M11 7v10M14 7v10M12 17v4"/>',
check:'<path class="f" d="M7 6l9 6-9 6z"/><path d="M3 12h4M16 12h5M18 7v10"/>',
relief:'<path d="M3 18h18M12 18v-4M12 8V4"/><path class="f" d="M8 14h8l-4-6z"/>',
acc:'<rect class="f" x="7" y="3" width="10" height="18" rx="5"/><path d="M7 12h10"/>',
manifold:'<path d="M3 12h6M9 5v14M9 6h12M9 12h12M9 18h12"/>',
flow:'<rect class="f" x="3" y="7" width="18" height="10" rx="2"/><path d="M7 12h8M12 9l3 3-3 3"/>',
therm:'<path class="f" d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
cut:'<circle class="f" cx="12" cy="12" r="9"/><path d="M7 7l10 10"/>',
sel:'<circle class="f" cx="12" cy="12" r="8"/><path d="M12 12l4-5M12 2v3M2 12h3M22 12h-3"/>',
tap:'<path d="M3 10h9a4 4 0 0 1 4 4v1M16 15v3M8 6v4M5 6h6"/><path class="f" d="M14 18h4l-2 3z"/>',
junction:'<path d="M12 3v18M3 12h18"/><circle class="f" cx="12" cy="12" r="3.5"/>',
reducer:'<path class="f" d="M3 6l18 4v4L3 18z"/>',
flange:'<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>',
supp:'<path d="M4 8h16M7 8v12M17 8v12M4 20h6M14 20h6"/>',
expj:'<path d="M2 12h5M17 12h5"/><path class="f" d="M7 7v10M10 5v14M14 5v14M17 7v10z"/>',
transfer:'<rect class="f" x="3" y="5" width="18" height="14" rx="2"/><path d="M8 9h8l-2-2M16 15H8l2 2"/>',
well:'<path d="M12 21V6M5 21h14M7 9h10M9 6l3-3 3 3"/>'};
const M=('source:wave solar:sun battery:batt inverter:wave hybrid:wave chargecontroller:batt dcsource:bolt batterycharger:bolt generator:wave transformer:coil wind:fan capacitorbank:cap supercap:cap mcb:breaker rcd:shield overload:heat fuse:fuse spd:shield earthrod:ground lightning:bolt hvbreaker:breaker transformerhv:coil reactor:coil differentialrelay:relay overcurrentrelay:relay distanceprotection:relay generatorprotection:shield float:tank contactor:relay switch:sw pb:pb timer:clock relay:relay ssr:relay selector:sel transfer:transfer ats:transfer disconnect:sw plc:chip vfd:chip softstart:chip pid:chip avr:chip motor:motor lamp:bulb heater:heat fan:fan ledstrip:strip solenoid:solenoid junction:junction busbar:bus tank:tank sump:drop tee:tee valve:valve tap:tap gauge:gauge flowmeter:flow tempgauge:therm checkvalve:check reliefvalve:relief pressurecutoff:cut accumulator:acc filter:filter manifold:manifold ct:coil vt:coil energymeter:meter pfccap:cap synchroscope:gauge gasturbine:turbine steamturbine:turbine boiler:tank condenser:tank coolingtower:tower governor:sel exciter:bolt syncrelay:relay gascompressor:comp gasboosterpump:comp steamboosterpump:comp airsupply:fan fluestack:tower gasvalve:valve gasfilter:filter gasmeter:meter pressureregulator:gauge gastank:tank gaswell:well naturalgas:flame lpgtank:tank burner:flame combustionchamber:flame flame:flame furnace:flame steamsource:steam steamgenerator:steam steampipe:pipe steamtrap:steam steamseparator:steam feedwaterpump:comp economizer:heat superheater:heat reheater:heat gatevalve:valve globevalve:valve ballvalve:valve butterflyvalve:valve expansionjoint:expj flange:flange gasket:flange pipesupport:supp reducer:reducer teejoint:tee elbow90:elbow elbow45:elbow deaerator:tank lpsystem:steam hpsystem:steam feedwatertank:tank blowdown:steam levelgauge:gauge dpgauge:gauge vacuumgauge:gauge rotameter:flow').split(' ');
const GM={};M.forEach(s=>{const p=s.split(':');GM[p[0]]=p[1];});
for(const k in DEFS){if(GM[k]&&G[GM[k]])ICON[k]=SV(G[GM[k]]);}
document.querySelectorAll('#palette .item').forEach(el=>{const k=el.dataset.type,d=DEFS[k];if(!d)return;el.style.setProperty('--a',A[d.cat]||'#38bdf8');el.querySelector('.ic').innerHTML=ICON[k]||d.icon;});
document.querySelectorAll('#palette .cat').forEach(el=>{const a=A[el.textContent.trim()];if(a)el.style.setProperty('--a',a);});

/* animation clock that freezes when the sim is paused */
let AN=0;
function walk(P,sp,v,fn){const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y));const T=L[L.length-1];if(T<2)return;
  const off=((AN*v)%sp+sp)%sp;let k=0;
  for(let d=off;d<T;d+=sp){while(k<L.length-2&&L[k+1]<d)k++;const s=(d-L[k])/((L[k+1]-L[k])||1);fn(P[k].x+(P[k+1].x-P[k].x)*s,P[k].y+(P[k+1].y-P[k].y)*s,d/T);}}
const orb=(x,y,r,col,a)=>{ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.globalAlpha=1;};

/* realistic pipe: steel shell, glass-like bore, flowing droplets and sheen */
drawPipe=function(w,P,now){
  const hu=sim.hu,r=hu?hu.find(key(w.a.c,w.a.t)):null,sel=selected&&selected.kind==='w'&&selected.id===w.id;
  const flowing=!w.broken&&((hu&&sim.hflow.has(r))||(window.PF&&window.PF(w.a.c,w.a.t)));
  const pc=window.pipeClass?window.pipeClass(w):'water';
  const F=({steam:['#9fb0c4','#ffffff'],gas:['#c98a12','#ffe08a'],flue:['#7a5040','#ffb27a'],air:['#7fa3bd','#e6f4ff']})[pc]||['#1b78bd','#c6eeff'];
  ctx.lineCap='round';ctx.lineJoin='round';
  if(sel){drawPath(P);ctx.strokeStyle='rgba(0,200,255,.55)';ctx.lineWidth=18;ctx.stroke();}
  if(w.broken){drawPath(P);ctx.setLineDash([8,8]);ctx.strokeStyle=COL.bad;ctx.lineWidth=5;ctx.stroke();ctx.setLineDash([]);
    const m=P[Math.floor(P.length/2)];ctx.fillStyle=COL.bad;ctx.font='800 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',m.x,m.y);
    if(!(AN*3%2<1))return;orb(m.x,m.y,10,COL.bad,.25);return;}
  const S=[['#07101c',13],['#4d6277',11],['#93a9be',8.6],[flowing?F[0]:'#122033',6.4]];
  for(const s of S){drawPath(P);ctx.strokeStyle=s[0];ctx.lineWidth=s[1];ctx.stroke();}
  if(flowing){const dir=pipeDir(w);
    drawPath(P);ctx.setLineDash([10,24]);ctx.lineDashOffset=-AN*55*dir;ctx.strokeStyle=F[1];ctx.globalAlpha=.3;ctx.lineWidth=3.4;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    walk(P,15,75*dir,(x,y,u)=>{const p=.5+.5*Math.sin(AN*5+u*40);orb(x,y,4.2,F[1],.14+.12*p);orb(x,y,1.7,F[1],.95);});
    walk(P,41,38*dir,(x,y)=>{orb(x,y+.2,2.4,'#fff',.55);});}
  ctx.translate(-1.5,-1.5);drawPath(P);ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1.6;ctx.stroke();ctx.translate(1.5,1.5);
  for(let i=1;i<P.length-1;i++){const p=P[i];ctx.beginPath();ctx.arc(p.x,p.y,6.2,0,7);ctx.fillStyle=GR(p.x-6,p.y-6,p.x+6,p.y+6,[[0,'#d3dfeb'],[.5,'#6e859b'],[1,'#26384b']]);ctx.fill();ctx.strokeStyle='#07101c';ctx.lineWidth=1;ctx.stroke();}
};

/* wrap the frame renderer: electron flow, hot-wire glow, vignette */
const _draw=draw;
draw=function(now){
  AN+=fdt*(sim.running?Math.min(sim.speed,4):0);window.ANIM=AN;window.dt=fdt;
  _draw(now);
  const r=cv.getBoundingClientRect(),st=sim.st;
  if(st){ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.translate(view.x,view.y);ctx.scale(view.z,view.z);
    const sp=45+Math.min(sim.totalI||0,40)*4;
    for(const w of wires){const P=w._P;if(!P||w.broken||isPipe(w))continue;
      const ra=st.uf.find(key(w.a.c,w.a.t)),rb=st.uf.find(key(w.b.c,w.b.t));
      if(!(sim.flow.has(ra)||sim.flow.has(rb)))continue;
      const col=netColor(st.cl.m.get(ra)||st.cl.m.get(rb));
      walk(P,16,sp,(x,y)=>{orb(x,y,5,col,.28);orb(x,y,1.7,'#fff',.95);});}
    ctx.restore();}
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);
  const g=ctx.createRadialGradient(r.width/2,r.height/2,Math.min(r.width,r.height)*.32,r.width/2,r.height/2,Math.max(r.width,r.height)*.78);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(2,6,14,.6)');ctx.fillStyle=g;ctx.fillRect(0,0,r.width,r.height);ctx.restore();
};

/* live scope: supply current vs tank level */
const kp=document.querySelector('.kpis');
if(kp){kp.insertAdjacentHTML('afterend','<canvas id="trace" style="width:100%;height:70px;margin-top:8px;border-radius:8px;background:#06101d;border:1px solid var(--line)"></canvas><div class="note" style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#ffb020">● Current</span><span style="color:#38bdf8">● Tank level</span></div>');
  const tc=$('trace'),tx=tc.getContext('2d'),H={i:[],l:[]};
  setInterval(()=>{if(!sim.running)return;const tk=comps.find(c=>['tank','silo','silopump'].includes(c.type));H.i.push(sim.totalI||0);H.l.push(tk?tk.level:0);if(H.i.length>140){H.i.shift();H.l.shift();}
    const d=window.devicePixelRatio||1,W=tc.clientWidth,h=tc.clientHeight;tc.width=W*d;tc.height=h*d;tx.setTransform(d,0,0,d,0,0);
    tx.strokeStyle='rgba(60,95,140,.25)';tx.lineWidth=1;for(let y=h/4;y<h;y+=h/4){tx.beginPath();tx.moveTo(0,y);tx.lineTo(W,y);tx.stroke();}
    const mx=Math.max(5,...H.i);
    const tr=(a,m,col)=>{if(a.length<2)return;tx.beginPath();a.forEach((v,i)=>{const x=i/139*W,y=h-3-(v/m)*(h-8);i?tx.lineTo(x,y):tx.moveTo(x,y);});
      tx.strokeStyle=col;tx.lineWidth=1.8;tx.shadowColor=col;tx.shadowBlur=6;tx.stroke();tx.shadowBlur=0;
      tx.lineTo((a.length-1)/139*W,h);tx.lineTo(0,h);const f=tx.createLinearGradient(0,0,0,h);f.addColorStop(0,col+'44');f.addColorStop(1,col+'00');tx.fillStyle=f;tx.fill();};
    tr(H.l,100,'#38bdf8');tr(H.i,mx,'#ffb020');},100);}
})();
