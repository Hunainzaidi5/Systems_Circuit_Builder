/* ══════════ v38 · NEW-PART VISUAL REDESIGN + SIDEBAR EXPAND / COLLAPSE ══════════
 * Load AFTER 41-script.js.
 *  1. Re-skins the parts added in scripts 39 / 40 (starters, relays, MCCB, bridge, bus-tie, instruments,
 *     process equipment, controllers, Modbus) with proper device shapes, and re-lays their terminals so
 *     wires/pipes enter from the sensible side. Terminal NAMES are unchanged, so saved boards still load.
 *  2. Sidebar: collapsible cards (remembered), Collapse-all / Expand-all, edge tabs to hide either
 *     sidebar, palette Collapse-all / Expand-all, Properties auto-opens when you select something. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2,AN=()=>performance.now()/1000;
const mix=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const T=(c,s,x,y,col,sz,al,wt)=>txt(c,s,x,y,col||'#dbe8f7',sz||8,al||'center',wt||700);
const PCOL=['#ffb020','#ff4fa0','#b07cff','#4da6ff','#2ec4b6'];
const heat=t=>mix('#38bdf8','#ef4444',clamp((t-20)/140,0,1));

/* ───────── drawing kit ───────── */
function dot(x,y,r,f,s){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=f;ctx.fill();if(s){ctx.strokeStyle=s;ctx.lineWidth=.8;ctx.stroke();}}
function plate(x,y,w,h,r,b){rr(x,y,w,h,r);ctx.fillStyle=GR(0,y,0,y+h,[[0,mix(b,'#ffffff',.6)],[.35,mix(b,'#ffffff',.15)],[.7,b],[1,mix(b,'#000000',.6)]]);ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.stroke();}
function tube(x,y,w,h,r,b,vert){const st=[[0,mix(b,'#ffffff',.55)],[.3,mix(b,'#ffffff',.18)],[.65,b],[1,mix(b,'#000000',.6)]];
  rr(x,y,w,h,r);ctx.fillStyle=vert?GR(x,0,x+w,0,st):GR(0,y,0,y+h,st);ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.stroke();}
function shell(c,w,h,acc,head,title){
  shadow(()=>{rr(-w/2,-h/2,w,h,9);ctx.fillStyle=GR(0,-h/2,0,h/2,[[0,'#34475f'],[.55,'#1b293c'],[1,'#0d1522']]);ctx.fill();});
  rr(-w/2,-h/2,w,h,9);ctx.lineWidth=1.4;ctx.strokeStyle=mix(acc,'#000000',.35);ctx.stroke();
  rr(-w/2+2.5,-h/2+2.5,w-5,h-5,7);ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.07)';ctx.stroke();
  ctx.save();rr(-w/2,-h/2,w,h,9);ctx.clip();
  if(head){ctx.fillStyle=GR(0,-h/2,0,-h/2+16,[[0,acc],[1,mix(acc,'#000000',.5)]]);ctx.fillRect(-w/2,-h/2,w,16);}
  else{ctx.fillStyle=acc;ctx.fillRect(-w/2,-h/2,w,3);}
  ctx.restore();
  if(head&&title){T(c,title,-w/2+8,-h/2+8.5,'#fff',8,'left',800);T(c,c.label||'',w/2-8,-h/2+8.5,'rgba(255,255,255,.85)',8,'right',700);}
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-w/2-3,-h/2-3,w+6,h+6,11);ctx.stroke();ctx.restore();}
}
function leads(c){for(const t of DEFS[c.type].term){const x=t[1],y=t[2],dx=t[3],dy=t[4];
  if(t[5]==='h'){ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));plate(-16,-6,16,12,2,'#8ea2b6');plate(-5,-9.5,5,19,1.5,'#5f7388');ctx.restore();}
  else{line([[x,y],[x-dx*9,y-dy*9]],'#c98a4b',2.6);dot(x-dx*11,y-dy*11,3,'#dfe5eb','#222');}}}
function lcd(x,y,w,h,on){rr(x,y,w,h,3);ctx.fillStyle=on?'#0b2a22':'#08130f';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='#04070a';ctx.stroke();
  rr(x+1,y+1,w-2,h*.4,2);ctx.fillStyle='rgba(255,255,255,.05)';ctx.fill();}
function bar(x,y,w,h,f,col){rr(x,y,w,h,h/2);ctx.fillStyle='#050b12';ctx.fill();if(f>0){rr(x,y,Math.max(h,w*clamp(f,0,1)),h,h/2);ctx.fillStyle=col;ctx.fill();}}
function mini(x,y,r,f,col){ctx.beginPath();ctx.arc(x,y,r+2,0,TAU);ctx.fillStyle=GR(x-r,y-r,x+r,y+r,[[0,'#e6edf4'],[1,'#566577']]);ctx.fill();
  ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle='#f3f1e8';ctx.fill();
  const a=Math.PI*.75+Math.PI*1.5*clamp(f,0,1);line([[x,y],[x+Math.cos(a)*r*.85,y+Math.sin(a)*r*.85]],col||'#c0392b',1.4);dot(x,y,1.6,'#222');}
function flowDots(x0,y0,x1,y1,n,col,on){if(!on)return;for(let k=0;k<n;k++){const p=(AN()*.7+k/n)%1;ctx.globalAlpha=Math.sin(p*Math.PI)*.9;dot(x0+(x1-x0)*p,y0+(y1-y0)*p,1.8,col);}ctx.globalAlpha=1;}
const safeErr={};
function reg(types,f){for(const t of [].concat(types)){if(!DEFS[t])continue;DRAW[t]=function(c){ctx.save();try{f(c);}catch(e){if(!safeErr[t]){safeErr[t]=1;console.warn('v38 draw',t,e);}}ctx.restore();};}}
function setT(type,w,h,terms){const d=DEFS[type];if(!d)return;d.w=w;d.h=h;d.term=terms.map(t=>t.slice());}
const boardI=()=>comps.filter(x=>x.powered).reduce((a,x)=>a+N(x.I,N(x.watts,0)/Math.max(1,sim.volts||230)),0);

/* ───────── terminal re-layout (names unchanged) ───────── */
const starT=[['L1',-60,-70,0,-1],['L2',-30,-70,0,-1],['L3',0,-70,0,-1],['N',30,-70,0,-1],['PE',60,-70,0,-1],['M1',-60,70,0,1],['M2',-30,70,0,1],['M3',0,70,0,1],['MN',30,70,0,1],['MPE',60,70,0,1],['A1',85,-12,1,0],['A2',85,12,1,0]];
for(const k of['dolstarter','stardelta','autoxfmr'])setT(k,170,140,starT);
setT('motorrelay',120,100,[['CT_IN',-60,-18,-1,0],['CT_OUT',60,-18,1,0],['TRIP',0,50,0,1]]);
setT('earthfaultrelay',120,90,[['CT_IN',-60,0,-1,0],['TRIP',60,0,1,0]]);
setT('mccb',100,130,[['Lin',-30,-65,0,-1],['Nin',30,-65,0,-1],['Lout',-30,65,0,1],['Nout',30,65,0,1],['TRIP',50,0,1,0]]);
setT('diodebridge',110,110,[['L',-55,-20,-1,0],['N',-55,20,-1,0],['DC+',55,-20,1,0],['DC-',55,20,1,0]]);
setT('bustie',190,120,[['L1a',-80,-60,0,-1],['L2a',-40,-60,0,-1],['L3a',0,-60,0,-1],['Na',40,-60,0,-1],['PEa',80,-60,0,-1],['L1b',-80,60,0,1],['L2b',-40,60,0,1],['L3b',0,60,0,1],['Nb',40,60,0,1],['PEb',80,60,0,1],['SYNC',-95,-20,-1,0],['A1',-95,5,-1,0],['A2',-95,30,-1,0]]);
setT('parallelingpanel',150,120,[['G_L',-75,-30,-1,0],['G_N',-75,-10,-1,0],['B_L',-75,15,-1,0],['B_N',-75,35,-1,0],['SYNC',0,60,0,1],['NO',30,60,0,1],['COM',60,60,0,1]]);
setT('multimeter',100,150,[['V1',-28,75,0,1],['COM',28,75,0,1]]);
setT('clampmeter',100,140,[['CT1',-50,-20,-1,0],['CT2',-50,20,-1,0]]);
setT('megger',130,100,[['TEST+',-65,-20,-1,0],['TEST-',-65,10,-1,0],['PE',65,0,1,0]]);
setT('pqanalyser',140,100,[['L',-70,-20,-1,0],['N',-70,10,-1,0],['CT',70,-10,1,0]]);
setT('orificeplate',130,110,[['IN',-65,10,-1,0,'h'],['OUT',65,10,1,0,'h'],['MA+',-10,-62,0,-1],['MA-',10,-62,0,-1]]);
setT('controlvalve',130,130,[['IN',-65,30,-1,0,'h'],['OUT',65,30,1,0,'h'],['SIG+',-15,-72,0,-1],['SIG-',15,-72,0,-1]]);
setT('heatexchanger',190,110,[['H_IN',-55,-55,0,-1,'h'],['H_OUT',55,55,0,1,'h'],['C_IN',-95,0,-1,0,'h'],['C_OUT',95,0,1,0,'h']]);
setT('flashtank',110,150,[['STEAM_IN',-55,-10,-1,0,'h'],['STEAM_OUT',0,-75,0,-1,'h'],['COND_OUT',0,75,0,1,'h']]);
setT('desuperheater',150,100,[['STEAM_IN',-75,10,-1,0,'h'],['STEAM_OUT',75,10,1,0,'h'],['WATER_IN',0,-50,0,-1,'h']]);
setT('steamheader',210,90,[['IN1',-70,-45,0,-1,'h'],['IN2',-25,-45,0,-1,'h'],['IN3',20,-45,0,-1,'h'],['OUT',105,0,1,0,'h']]);
setT('airreceiver',150,130,[['AIR_IN',-75,-15,-1,0,'h'],['AIR_OUT',75,-15,1,0,'h'],['DRAIN',0,65,0,1,'h']]);
setT('boilerdrum',190,100,[['WATER_IN',-95,-15,-1,0,'h'],['STEAM_OUT',0,-50,0,-1,'h'],['BLOWDOWN',0,50,0,1,'h']]);
const ctlT=[['PV+',-60,-40,-1,0],['PV-',-60,-20,-1,0],['SP+',-60,10,-1,0],['SP-',-60,30,-1,0],['OUT+',60,-20,1,0],['OUT-',60,5,1,0]];
const CTL=['pidblock','piblock','pblock','ratiostation','splstation'];
for(const k of CTL)setT(k,120,130,ctlT);
setT('modbusslave',120,100,[['A',-60,-20,-1,0],['B',-60,0,-1,0],['GND',-60,20,-1,0]]);
setT('modbusmaster',120,100,[['A',-60,-20,-1,0],['B',-60,0,-1,0],['GND',-60,20,-1,0],['PV+',60,-15,1,0],['PV-',60,10,1,0]]);

/* ═════════ motor starters ═════════ */
reg(['dolstarter','stardelta','autoxfmr'],c=>{
  const kind=c.type==='stardelta'?'sd':c.type==='autoxfmr'?'ax':'dol';
  const on=!!c.running;
  const acc={dol:'#22c55e',sd:'#f59e0b',ax:'#a78bfa'}[kind];
  const title={dol:'DOL STARTER',sd:'STAR-DELTA STARTER',ax:'AUTO-TRANSFORMER'}[kind];
  shell(c,170,140,acc,true,title);leads(c);

  // Phase rails L1 L2 L3 + N + PE
  const xs=[-60,-30,0],phaseCol=['#ef4444','#f59e0b','#3b82f6'];
  xs.forEach((x,i)=>{
    line([[x,-58],[x,-18]],phaseCol[i],2.2);
    line([[x,22],[x,58]],on?phaseCol[i]:mix(phaseCol[i],'#0e1724',.65),2.2);
  });
  line([[30,-58],[30,58]],on?'#94a3b8':'#475569',2);
  line([[60,-58],[60,58]],on?'#22c55e':'#475569',2);

  // Animated main contacts (travel)
  c._a=N(c._a,0)+((on?1:0)-N(c._a,0))*Math.min(1,(typeof fdt==='number'?fdt:.016)*14);
  const a=c._a;
  xs.forEach(x=>{
    const gap=(1-a)*10;
    dot(x,-18,2.6,'#e5e9ee');dot(x,22,2.6,'#e5e9ee');
    line([[x,-16],[x,-2-gap*0.5]],a>0.85?'#3df5b0':'#94a3b8',2.4);
    line([[x,2+gap*0.5],[x,16]],a>0.85?'#3df5b0':'#94a3b8',2.4);
    if(on)glow(x,2,12,'rgba(6,214,160,.2)');
    // Arc flash on make
    if(N(c._arc,0)>0.1&&a>0.5){
      for(let i=0;i<4;i++){
        const ang=AN()*9+i*1.3,r=3+c._arc*8;
        ctx.strokeStyle=`rgba(255,200,80,${c._arc*0.7})`;ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+Math.cos(ang)*r,Math.sin(ang)*r);ctx.stroke();
      }
    }
  });

  // Coil KM
  line([[85,-12],[76,-12]],'#c98a4b',2);line([[85,12],[76,12]],'#c98a4b',2);
  ctx.beginPath();ctx.arc(72,0,10,0,TAU);
  ctx.fillStyle=on?'rgba(6,214,160,.35)':'#0b1622';ctx.fill();
  ctx.strokeStyle=on?'#06d6a0':'#4a6a8a';ctx.lineWidth=1.6;ctx.stroke();
  T(c,'KM',72,0,on?'#06d6a0':'#7a92b0',7,'center',800);
  if(on){ctx.beginPath();ctx.arc(72,0,13+Math.sin(AN()*6)*2,0,TAU);ctx.strokeStyle='rgba(6,214,160,.25)';ctx.lineWidth=2;ctx.stroke();}

  // Status LCD + kind-specific readout
  lcd(-78,28,110,22,on);
  let mode;
  if(kind==='sd'){
    mode=on?(N(c.seq,0)<2?'STAR · ~58% V':N(c.seq,0)===2?'TRANSITION':'DELTA · FULL V'):'STOPPED';
    const st=N(c.starTime,3),tr=N(c.deltaTime,.5),total=st+tr+.5;
    const p=on?clamp(c.seqT/total,0,1):0;
    ctx.fillStyle='#050b12';ctx.fillRect(-78,18,90,5);
    ctx.fillStyle=p<st/total?'#f59e0b':'#22c55e';ctx.fillRect(-78,18,90*p,5);
    T(c,N(c.seq,0)===1?'Y':N(c.seq,0)>=3?'Δ':'…',40,20,'#cbd5e1',8,'center',800);
  }else if(kind==='ax'){
    mode=on?(N(c.seq,0)===1?('TAP '+N(c.tap,80)+'%'):'RUN · FULL V'):'STOPPED';
    T(c,on&&N(c.seq,0)===1?N(c.tap,80)+'%':'FULL',40,20,on?'#a78bfa':'#64748b',8,'center',800);
  }else{
    mode=on?'RUN · FULL V':'STOPPED';
    T(c,on?'FULL V':'READY',40,20,on?'#22c55e':'#64748b',8,'center',800);
  }
  T(c,mode,-22,39,on?'#3df5b0':'#4b6b60',8,'center',800);
  led(44,39,on?'#22c55e':'#334155',on);
  T(c,c.label||'',0,-52,'#9fb3c8',8,'center',700);
});

/* ═════════ protection relays ═════════ */
reg('motorrelay',c=>{shell(c,120,100,'#f43f5e',true,'MOTOR PROT');leads(c);
  const th=clamp(N(c.thermal,0)/8,0,1),ratio=N(c.unbalance,0);
  line([[-60,-18],[60,-18]],'#c98a4b',2);
  lcd(-46,-6,92,30,!c.tripped);T(c,'I / Ir  '+ratio.toFixed(2),0,2,c.tripped?'#ff6b81':'#3df5b0',9,'center',800);
  bar(-40,12,80,6,th,th>.75?'#ef4444':th>.4?'#f59e0b':'#22c55e');T(c,'THERMAL '+Math.round(th*100)+' %',0,24,'#7fb8a3',7,'center',700);
  led(-46,35,c.tripped?'#ef4444':'#22c55e',true);T(c,c.tripped?'TRIPPED · click to reset':'HEALTHY',-40,35,c.tripped?'#ff6b81':'#9fb3c8',7.5,'left',800);
});
reg('earthfaultrelay',c=>{shell(c,120,90,'#10b981',true,'EARTH FAULT · 50N');leads(c);
  const res=N(c._resI,0),pk=N(c.pickup,.5);
  line([[-60,0],[-30,0]],'#c98a4b',2);
  ctx.beginPath();ctx.arc(-14,6,15,0,TAU);ctx.lineWidth=7;ctx.strokeStyle='#b45309';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#fcd34d';ctx.stroke();
  line([[-34,6],[10,6]],'#8fb3c9',2.2);
  lcd(10,-8,34,28,!c.tripped);T(c,res.toFixed(2),27,0,c.tripped?'#ff6b81':'#3df5b0',10,'center',800);T(c,'A res',27,13,'#7fb8a3',7);
  T(c,'pickup '+pk+' A · '+N(c.delay,.1)+' s',0,33,'#9fb3c9',7.5,'center',700);
  led(-44,-26+4,c.tripped?'#ef4444':'#22c55e',true);
  if(c.tripped)T(c,'TRIP',8,-26+4,'#ff6b81',8,'center',800);
});
reg('mccb',c=>{
  tube(-44,-50,88,100,8,'#232c38',true);
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-47,-53,94,106,10);ctx.stroke();ctx.restore();}
  leads(c);
  for(const x of[-30,30]){line([[x,-58],[x,-50]],'#c98a4b',3);line([[x,50],[x,58]],'#c98a4b',3);plate(x-9,-52,18,8,2,'#b87333');plate(x-9,44,18,8,2,'#b87333');}
  rr(-34,-38,68,76,6);ctx.fillStyle=GR(0,-38,0,38,[[0,'#3a4452'],[1,'#222b36']]);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.08)';ctx.stroke();
  rr(-14,-26,28,52,4);ctx.fillStyle='#07090c';ctx.fill();
  const ly=c.tripped?-6:c.closed?-24:2;
  plate(-11,ly,22,22,3,c.tripped?'#f59e0b':c.closed?'#22c55e':'#8b95a1');
  line([[-6,ly+8],[6,ly+8]],'rgba(0,0,0,.4)',1);line([[-6,ly+14],[6,ly+14]],'rgba(0,0,0,.4)',1);
  T(c,c.tripped?'TRIP':c.closed?'ON':'OFF',0,30,c.tripped?'#f59e0b':c.closed?'#86efac':'#9ca3af',7.5,'center',800);
  rr(-30,-44,60,10,2);ctx.fillStyle='#e5e7eb';ctx.fill();T(c,N(c.rating,32)+' A  ·  '+c.curve,0,-39,'#111',7.5,'center',800);
  line([[44,0],[36,0]],'#c98a4b',2);dot(30,0,3,c.tripped?'#ef4444':'#475569');
  T(c,c.label||'',0,-72,'#dbe8f7',9,'center',800);
});

/* ═════════ diode bridge ═════════ */
reg('diodebridge',c=>{shell(c,110,110,'#f97316',true,'BRIDGE');leads(c);
  const on=c.on!==false,P={l:[-26,6],r:[26,6],t:[0,-22],b:[0,34]};
  const col=on?'#fbbf24':'#6b7280';
  const diode=(a,b)=>{const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0]);line([a,b],col,1.6);ctx.save();ctx.translate(mx,my);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(-5,5);ctx.lineTo(5,0);ctx.closePath();ctx.fillStyle=col;ctx.fill();line([[5,-5],[5,5]],col,1.8);ctx.restore();};
  diode(P.l,P.t);diode(P.r,P.t);diode(P.b,P.l);diode(P.b,P.r);
  line([[-55,-20],[-40,-20],[-40,6],[-26,6]],PCOL[0],1.6);line([[-55,20],[-36,20],[-36,12],[40,12],[40,6],[26,6]],PCOL[3],1.6);
  line([[0,-22],[0,-30],[55,-30],[55,-20]],'#fb7185',1.6);line([[0,34],[0,42],[55,42],[55,20]],'#7dd3fc',1.6);
  T(c,'~',-22,-1,'#ffb020',11,'center',800);T(c,'~',22,-1,'#4da6ff',11,'center',800);T(c,'+',8,-36,'#fb7185',9,'center',800);T(c,'−',8,48,'#7dd3fc',9,'center',800);
  if(on)glow(0,6,30,'rgba(251,191,36,.12)');
});

/* ═════════ bus-tie / paralleling panel ═════════ */
reg('bustie',c=>{
  const cl=!!c.closed;
  const blade=N(c._blade,cl?1:0);
  shell(c,190,120,cl?'#14b8a6':'#64748b',true,'BUS-TIE BREAKER');leads(c);

  // Bus A (top) and Bus B (bottom) copper rails
  tube(-90,-42,180,8,3,'#b87333');tube(-90,34,180,8,3,'#b87333');
  T(c,'BUS A',-72,-28,'#fbbf24',7,'left',800);T(c,'BUS B',-72,28,'#fbbf24',7,'left',800);

  const xs=[-80,-40,0,40,80];
  const phaseCol=['#ef4444','#f59e0b','#3b82f6','#94a3b8','#22c55e'];
  xs.forEach((x,i)=>{
    line([[x,-58],[x,-42]],phaseCol[i],2.2);
    line([[x,42],[x,58]],phaseCol[i],2.2);
    // Animated blade between rails
    const y1=-10+(1-blade)*8,y2=10-(1-blade)*8;
    line([[x,y1],[x,y2]],blade>0.85?'#3df5b0':'#64748b',3);
    if(N(c._arc,0)>0.1&&blade>0.6){
      for(let k=0;k<3;k++){
        const ang=AN()*8+k*1.5,r=3+c._arc*7;
        ctx.strokeStyle=`rgba(255,200,80,${c._arc*0.65})`;ctx.lineWidth=1.1;
        ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+Math.cos(ang)*r,Math.sin(ang)*r);ctx.stroke();
      }
    }
  });

  // Sync / force indicators
  rr(-70,-10,40,20,4);
  ctx.fillStyle=c._perm?'#0b3d2a':'#241616';ctx.fill();
  ctx.strokeStyle=c._perm?'#22c55e':'#7f1d1d';ctx.stroke();
  T(c,c._perm?'SYNC OK':'NO SYNC',-50,0,c._perm?'#3df5b0':'#f87171',7,'center',800);
  if(c.force)T(c,'FORCED',-50,12,'#fbbf24',6.5,'center',800);

  lcd(20,-10,55,20,cl);
  T(c,cl?'CLOSED':'OPEN',47,0,cl?'#3df5b0':'#64748b',9,'center',800);
  T(c,c.label||'',0,52,'#9fb3c8',8,'center',700);
});
reg('parallelingpanel',c=>{shell(c,150,120,'#6366f1',true,'PARALLELING');leads(c);
  const ok=!!c.synced;
  ctx.beginPath();ctx.arc(-30,10,24,0,TAU);ctx.fillStyle='#07101b';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=ok?'#22c55e':'#64748b';ctx.stroke();
  for(let i=0;i<12;i++){const a=i/12*TAU;line([[-30+Math.cos(a)*20,10+Math.sin(a)*20],[-30+Math.cos(a)*23,10+Math.sin(a)*23]],'#94a3b8',1);}
  const na=ok?-Math.PI/2:(AN()*1.4)%TAU;line([[-30,10],[-30+Math.cos(na)*18,10+Math.sin(na)*18]],ok?'#3df5b0':'#fbbf24',2.4);dot(-30,10,2.4,'#e2e8f0');
  T(c,'G',-62,-28,'#9fb3c9',7,'center',800);T(c,'BUS',-62,26,'#9fb3c9',7,'center',800);
  line([[-75,-30],[-62,-30]],'#c98a4b',1.4);line([[-75,15],[-62,15]],'#c98a4b',1.4);
  lcd(10,-16,54,26,ok);T(c,ok?'SYNCED':c.force?'FORCED':'WAIT',37,-3,ok?'#3df5b0':'#fbbf24',9,'center',800);
  led(18,22,ok?'#22c55e':'#f59e0b',true);T(c,'min '+N(c.minTime,.5)+' s',44,22,'#7fb8a3',7,'center',700);
  rr(10,32,54,14,3);ctx.fillStyle='#0b1622';ctx.fill();line([[30,60],[30,52]],'#c98a4b',1.6);line([[60,60],[60,52]],'#c98a4b',1.6);
  line([[30,40],[ok?60:46,ok?40:34]],ok?'#3df5b0':'#cfd8e1',2.4);T(c,'NO',30,52,'#9fb3c9',6,'center',700);T(c,'COM',60,52,'#9fb3c9',6,'center',700);
});

/* ═════════ test instruments ═════════ */
reg('multimeter',c=>{
  shadow(()=>{rr(-44,-70,88,140,16);ctx.fillStyle=GR(0,-70,0,70,[[0,'#fbd34d'],[1,'#c98a0a']]);ctx.fill();});rr(-44,-70,88,140,16);ctx.lineWidth=1.5;ctx.strokeStyle='#6b4a05';ctx.stroke();
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-47,-73,94,146,18);ctx.stroke();ctx.restore();}
  rr(-36,-62,72,36,5);ctx.fillStyle='#10201a';ctx.fill();ctx.strokeStyle='#050a08';ctx.lineWidth=2;ctx.stroke();
  T(c,N(c._v,0).toFixed(1),24,-48,'#9be8b8',16,'right',800);T(c,'V  AC',-30,-36,'#5c9a7a',7,'left',800);
  ctx.beginPath();ctx.arc(0,6,22,0,TAU);ctx.fillStyle=GR(-20,-14,20,26,[[0,'#3a3f46'],[1,'#14171b']]);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
  for(let i=0;i<8;i++){const a=i/8*TAU;line([[Math.cos(a)*16,6+Math.sin(a)*16],[Math.cos(a)*21,6+Math.sin(a)*21]],'#cbd5e1',1.2);}
  line([[0,6],[Math.cos(-.9)*17,6+Math.sin(-.9)*17]],'#fbbf24',3);
  for(const [x,col,l] of[[-28,'#dc2626','V'],[28,'#111827','COM']]){dot(x,64,7,'#0b0d10','#374151');dot(x,64,3.4,col);T(c,l,x,53,'#4a3203',6.5,'center',800);line([[x,75],[x,70]],'#c98a4b',2.4);}
  T(c,c.label||'DMM',0,-82,'#dbe8f7',9,'center',800);
});
reg('clampmeter',c=>{const I=boardI();
  tube(-34,-6,78,72,12,'#2f3d4e',true);
  ctx.beginPath();ctx.arc(10,-34,30,Math.PI*.12,Math.PI*1.88);ctx.lineWidth=13;ctx.strokeStyle='#1f2937';ctx.stroke();ctx.lineWidth=7;ctx.strokeStyle='#64748b';ctx.stroke();
  line([[-14,-24],[-14,-6]],'#475569',8);line([[38,-24],[38,-6]],'#475569',8);
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-37,-9,84,78,14);ctx.stroke();ctx.restore();}
  leads(c);
  rr(-24,2,58,26,4);ctx.fillStyle='#10201a';ctx.fill();T(c,I.toFixed(1),30,12,'#9be8b8',13,'right',800);T(c,'A',-18,22,'#5c9a7a',7,'left',800);
  dot(5,44,9,'#1f2937','#4b5563');dot(5,44,3,'#fbbf24');dot(-14,52,4,'#374151');dot(24,52,4,'#374151');
  T(c,c.label||'CLAMP',5,-72,'#dbe8f7',9,'center',800);
});
reg('megger',c=>{const r=N(c._riso,500),lim=N(c.limit,1),bad=r<lim,f=clamp((Math.log10(Math.max(.1,r))+1)/4,0,1);
  shadow(()=>{rr(-60,-46,120,92,10);ctx.fillStyle=GR(0,-46,0,46,[[0,'#f59e0b'],[1,'#b45309']]);ctx.fill();});rr(-60,-46,120,92,10);ctx.lineWidth=1.5;ctx.strokeStyle='#5a3203';ctx.stroke();
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-63,-49,126,98,12);ctx.stroke();ctx.restore();}
  leads(c);
  ctx.save();rr(-46,-38,92,50,5);ctx.fillStyle='#f3efe0';ctx.fill();ctx.clip();
  ctx.beginPath();ctx.arc(0,18,38,Math.PI*1.1,Math.PI*1.9);ctx.lineWidth=2;ctx.strokeStyle='#222';ctx.stroke();
  for(let i=0;i<=10;i++){const a=Math.PI*1.1+i/10*Math.PI*.8;line([[Math.cos(a)*34,18+Math.sin(a)*34],[Math.cos(a)*40,18+Math.sin(a)*40]],'#222',1.2);}
  const a=Math.PI*1.1+f*Math.PI*.8;line([[0,18],[Math.cos(a)*36,18+Math.sin(a)*36]],'#b91c1c',1.8);dot(0,18,3,'#222');ctx.restore();
  T(c,'MΩ',-36,2,'#444',7,'left',800);T(c,r.toFixed(r<10?2:0),38,2,'#111',8,'right',800);
  led(-34,30,bad?'#ef4444':'#22c55e',true);T(c,bad?'FAIL':'PASS',-14,30,bad?'#7f1d1d':'#14532d',8,'left',800);
  dot(40,31,6,'#78350f','#2b1503');line([[40,31],[46,25]],'#2b1503',2);
  T(c,c.label||'MEGGER',0,-58,'#dbe8f7',9,'center',800);
});
reg('pqanalyser',c=>{shell(c,140,100,'#8b5cf6',true,'PQ ANALYSER');leads(c);
  const V=sim.volts||230,I=boardI();
  lcd(-52,-30,104,50,true);
  ctx.save();rr(-52,-30,104,50,3);ctx.clip();ctx.beginPath();for(let x=-50;x<=50;x+=2){const y=-5+Math.sin(x*.16-AN()*6)*11+Math.sin(x*.48-AN()*18)*2.4;x===-50?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.strokeStyle='#4ade80';ctx.lineWidth=1.4;ctx.stroke();
  ctx.beginPath();for(let x=-50;x<=50;x+=2){const y=-5+Math.sin(x*.16-AN()*6+.5)*7;x===-50?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.strokeStyle='#fbbf24';ctx.stroke();ctx.restore();
  T(c,V.toFixed(0)+' V',-30,28,'#9fb3c9',8,'center',800);T(c,I.toFixed(1)+' A',6,28,'#9fb3c9',8,'center',800);
  T(c,'PF '+(I>0?'0.85':'1.00'),40,28,'#9fb3c9',8,'center',800);
  for(let i=0;i<6;i++){const h=3+((i*7+Math.floor(AN()*2))%5)*2*(i<3?1:.5);rr(-48+i*8,42-h,5,h,1);ctx.fillStyle='#8b5cf6';ctx.fill();}
  T(c,'THD',20,40,'#7a92b0',7,'center',800);
});

/* ═════════ process: flow / valves ═════════ */
reg('orificeplate',c=>{
  tube(-65,2,130,16,3,'#8ea2b6');
  tube(-14,-8,9,36,2,'#b9c5d1',true);tube(5,-8,9,36,2,'#b9c5d1',true);
  ctx.fillStyle='#e2e8f0';ctx.fillRect(-3,-4,6,28);ctx.fillStyle='#0b1622';ctx.fillRect(-3,6,6,8);
  for(const y of[-4,24]){dot(-10,y,1.6,'#374151');dot(10,y,1.6,'#374151');}
  line([[-10,-8],[-10,-20]],'#94a3b8',2);line([[10,-8],[10,-20]],'#94a3b8',2);
  line([[-10,-62],[-10,-38]],'#94a3b8',1.6);line([[10,-62],[10,-38]],'#94a3b8',1.6);
  tube(-24,-42,48,22,6,'#0ea5e9');rr(-19,-38,38,13,2);ctx.fillStyle='#08212d';ctx.fill();
  T(c,N(c.outputMA,4).toFixed(1)+' mA',0,-31.5,'#7df3d1',8,'center',800);
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-70,-66,140,108,8);ctx.stroke();ctx.restore();}
  leads(c);flowDots(-60,10,60,10,6,'#bae6fd',N(c._dp,0)>0);
  T(c,'β '+N(c.beta,.6)+'   ΔP '+N(c._dp,0).toFixed(1),0,42,'#9fb3c9',7.5,'center',700);T(c,c.label||'FE',34,-31,'#dbe8f7',9,'left',800);
});
reg('controlvalve',c=>{const op=clamp(N(c.open,50),0,100)/100;
  tube(-65,22,130,14,3,'#8ea2b6');
  tube(-34,18,10,22,2,'#b9c5d1',true);tube(24,18,10,22,2,'#b9c5d1',true);
  ctx.beginPath();ctx.arc(0,29,19,0,TAU);ctx.fillStyle=GR(-18,10,18,48,[[0,'#d9b45a'],[.5,'#9a7a2e'],[1,'#3d2f10']]);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.7)';ctx.stroke();
  ctx.beginPath();ctx.moveTo(-8,29);ctx.lineTo(0,22);ctx.lineTo(8,29);ctx.lineTo(0,36);ctx.closePath();ctx.fillStyle=op>.02?'#3df5b0':'#ef4444';ctx.fill();
  line([[0,10],[0,-6-op*0]],'#e2e8f0',3);
  plate(-9,6,18,8,2,'#6b7280');
  ctx.beginPath();ctx.arc(0,-6,26,Math.PI,TAU);ctx.closePath();ctx.fillStyle=GR(-26,-32,26,-6,[[0,'#4b6a8c'],[1,'#1e3248']]);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.7)';ctx.stroke();
  line([[-26,-6],[26,-6]],'#9fb3c9',2);
  ctx.beginPath();for(let i=0;i<6;i++){const y=-9-i*3-(1-op)*0,x=i%2?-8:8;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle='#cbd5e1';ctx.lineWidth=1.2;ctx.stroke();
  line([[-15,-72],[-15,-52]],'#94a3b8',1.6);line([[15,-72],[15,-52]],'#94a3b8',1.6);plate(-24,-52,48,18,4,'#1e293b');lcd(-19,-49,38,12,true);T(c,Math.round(op*100)+' %',0,-43,'#7df3d1',8,'center',800);
  line([[0,-34],[0,-30]],'#64748b',2);
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-68,-56,136,104,10);ctx.stroke();ctx.restore();}
  leads(c);flowDots(-60,29,60,29,6,'#bae6fd',N(c._flow,0)>0.001&&op>.02);
  T(c,'Cv '+N(c.Cv,50)+(c.auto?' · AUTO':' · MAN'),0,50,'#9fb3c9',7.5,'center',700);T(c,c.label||'FV',34,-43,'#dbe8f7',9,'left',800);
});

/* ═════════ process: vessels & exchangers ═════════ */
reg('heatexchanger',c=>{const th=N(c.T_hot_in,150),tho=N(c.T_hot_out,90),tc=N(c.T_cold_in,20),tco=N(c.T_cold_out,60);
  plate(-52,26,24,12,2,'#475569');plate(28,26,24,12,2,'#475569');
  tube(-70,-28,140,56,20,mix('#7a8ea3',heat(tho),.25));
  rr(-66,-22,132,44,16);ctx.fillStyle='#0b1622';ctx.fill();
  const g=ctx.createLinearGradient(-66,0,66,0);g.addColorStop(0,heat(tc));g.addColorStop(1,heat(tco));
  for(let y=-14;y<=14;y+=7){line([[-70,y],[70,y]],g,3);}
  rr(-66,-22,132,44,16);ctx.fillStyle=mix(heat(th),'#0b1622',.8);ctx.globalAlpha=.35;ctx.fill();ctx.globalAlpha=1;
  tube(-92,-24,24,48,10,'#5f7388',true);tube(68,-24,24,48,10,'#5f7388',true);
  plate(-64,-14,6,28,1,'#94a3b8');
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-98,-58,196,116,12);ctx.stroke();ctx.restore();}
  leads(c);flowDots(-90,0,90,0,7,'#93c5fd',true);
  rr(-52,-8,104,16,8);ctx.fillStyle='rgba(6,12,20,.82)';ctx.fill();
  T(c,`hot ${th.toFixed(0)}→${tho.toFixed(0)}  ·  cold ${tc.toFixed(0)}→${tco.toFixed(0)} °C`,0,0,'#e2e8f0',7,'center',800);
  T(c,c.label||'HX',20,-44,'#dbe8f7',9,'left',800);
});
reg('flashtank',c=>{const x=clamp(N(c.x,.15),0,1);
  tube(-32,-58,64,116,28,'#7f93a6',true);
  ctx.save();rr(-32,-58,64,116,28);ctx.clip();ctx.fillStyle='rgba(8,16,26,.55)';ctx.fillRect(-32,-58,64,116);
  const ly=30-x*40;ctx.fillStyle='rgba(56,150,220,.75)';ctx.fillRect(-32,ly,64,60);
  ctx.beginPath();for(let xx=-32;xx<=32;xx+=3){const y=ly+Math.sin(xx*.3+AN()*3)*1.4;xx===-32?ctx.moveTo(xx,y):ctx.lineTo(xx,y);}ctx.strokeStyle='#e0f2fe';ctx.lineWidth=1.2;ctx.stroke();
  for(let i=0;i<8;i++){const p=(AN()*.5+i/8)%1;ctx.globalAlpha=1-p;dot(-22+((i*13)%44),ly-p*(ly+50),1.8+p*2,'#f1f5f9');}ctx.globalAlpha=1;ctx.restore();
  plate(-52,-15,22,10,2,'#8ea2b6');plate(-5,-76,10,22,2,'#8ea2b6');plate(-5,54,10,22,2,'#8ea2b6');
  mini(44,-30,9,N(c.P,1)/3,'#c0392b');
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-35,-61,70,122,30);ctx.stroke();ctx.restore();}
  leads(c);T(c,'FLASH '+(x*100).toFixed(0)+'%',0,-4,'#fff',8,'center',800);T(c,N(c.P,1).toFixed(2)+' MPa',0,8,'#cfe3f2',7.5,'center',700);
  T(c,c.label||'FT',44,-58,'#dbe8f7',9,'left',800);
});
reg('desuperheater',c=>{const ti=N(c.T_steam_in,300),to=N(c.T_out,180);
  tube(-75,-2,150,24,4,'#9aa7b6');tube(-24,-6,52,32,8,mix('#9aa7b6',heat(to),.35));
  rr(-72,2,144,16,3);ctx.fillStyle=GR(-72,0,72,0,[[0,heat(ti)],[1,heat(to)]]);ctx.globalAlpha=.5;ctx.fill();ctx.globalAlpha=1;
  line([[0,-50],[0,-12]],'#59a6d8',5);plate(-6,-12,12,8,2,'#6b7f93');
  ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(-14,14);ctx.lineTo(14,14);ctx.closePath();ctx.fillStyle='rgba(125,211,252,.16)';ctx.fill();
  for(let i=0;i<9;i++){const p=(AN()*.9+i/9)%1;ctx.globalAlpha=1-p;dot(Math.sin(i*5)*p*12,-2+p*18,1.4,'#e0f2fe');}ctx.globalAlpha=1;
  line([[46,-2],[46,-14]],'#94a3b8',2.4);dot(46,-16,3,'#ef4444');
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-78,-54,156,82,8);ctx.stroke();ctx.restore();}
  leads(c);flowDots(-70,10,70,10,6,'#fecaca',true);
  T(c,ti.toFixed(0)+'°C',-52,30,heat(ti),8,'center',800);T(c,to.toFixed(0)+'°C',52,30,heat(to),8,'center',800);T(c,'DESUPERHEATER · '+(c.label||''),0,44,'#9fb3c9',7.5,'center',700);
});
reg('steamheader',c=>{
  tube(-100,-14,206,28,12,'#9aa7b6');plate(-104,-18,8,36,2,'#6b7f93');plate(98,-18,8,36,2,'#6b7f93');
  for(const x of[-70,-25,20]){line([[x,-45],[x,-14]],'#9aa7b6',9);line([[x,-45],[x,-14]],'#cbd5e1',4);
    ctx.beginPath();ctx.moveTo(x-7,-34);ctx.lineTo(x+7,-24);ctx.lineTo(x+7,-34);ctx.lineTo(x-7,-24);ctx.closePath();ctx.fillStyle='#b45309';ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=.8;ctx.stroke();
    line([[x,-29],[x+9,-29]],'#9ca3af',1.6);dot(x+10,-29,2.4,'#dc2626');}
  mini(68,-30,9,N(c.P,1.2)/3,'#c0392b');
  const g=ctx.createLinearGradient(-90,0,100,0);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,130,60,.25)');rr(-92,-10,190,20,8);ctx.fillStyle=g;ctx.fill();
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-108,-48,222,64,10);ctx.stroke();ctx.restore();}
  leads(c);flowDots(-95,0,100,0,8,'#fff',N(c.flow,0)>0);
  T(c,'STEAM HEADER  '+N(c.P,1.2).toFixed(1)+' MPa  ·  Tsat '+N(c.Tsat,0).toFixed(0)+'°C  ·  '+N(c.flow,0).toFixed(0)+' kg/h',0,28,'#9fb3c9',7.5,'center',700);T(c,c.label||'SH',-100,-52,'#dbe8f7',9,'left',800);
});
reg('airreceiver',c=>{const lv=clamp(N(c.level,50),0,100)/100;
  plate(-48,28,22,14,2,'#475569');plate(26,28,22,14,2,'#475569');
  tube(-66,-34,132,66,26,'#3b6ea5');
  ctx.save();rr(-66,-34,132,66,26);ctx.clip();ctx.fillStyle='rgba(125,211,252,.18)';ctx.fillRect(-66,-34+66*(1-lv),132,66*lv);ctx.restore();
  line([[-60,-14],[60,-14]],'rgba(255,255,255,.18)',2);
  mini(-18,-46,10,N(c.P,8)/12,'#c0392b');
  plate(26,-52,10,18,2,'#ef4444');line([[31,-52],[31,-60]],'#fca5a5',3);
  line([[0,32],[0,56]],'#94a3b8',5);plate(-7,52,14,8,2,'#6b7280');
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-70,-64,140,128,26);ctx.stroke();ctx.restore();}
  leads(c);flowDots(-70,-15,-40,-15,3,'#bae6fd',N(c._qin,0)>0);
  T(c,N(c.P,8).toFixed(1)+' barg',0,-4,'#e0f2fe',9,'center',800);T(c,Math.round(lv*100)+' % · '+N(c.volume,500)+' L',0,8,'#bcd4ea',7.5,'center',700);T(c,c.label||'AR',50,-62,'#dbe8f7',9,'left',800);
});
reg('boilerdrum',c=>{const lv=clamp(N(c.level,50),0,100)/100;
  plate(-56,28,24,12,2,'#475569');plate(32,28,24,12,2,'#475569');
  tube(-85,-30,170,60,28,'#6f7f92');
  ctx.save();rr(-85,-30,170,60,28);ctx.clip();ctx.fillStyle='rgba(8,16,26,.5)';ctx.fillRect(-85,-30,170,60);ctx.fillStyle='rgba(56,150,220,.6)';ctx.fillRect(-85,30-60*lv,170,60*lv);
  ctx.beginPath();for(let x=-85;x<=85;x+=3){const y=30-60*lv+Math.sin(x*.2+AN()*3)*1.4;x===-85?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.strokeStyle='#e0f2fe';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  tube(-14,-52,28,26,6,'#8ea2b6');plate(-5,-52,10,6,1,'#cbd5e1');
  rr(48,-22,12,44,3);ctx.fillStyle='#050b12';ctx.fill();ctx.fillStyle='#38bdf8';ctx.fillRect(49,22-44*lv,10,44*lv);ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1.2;rr(48,-22,12,44,3);ctx.stroke();
  line([[0,30],[0,48]],'#94a3b8',5);plate(-7,44,14,8,2,'#6b7280');
  if(isSel(c)){ctx.save();ctx.shadowColor='#00b4d8';ctx.shadowBlur=14;ctx.strokeStyle='#00b4d8';ctx.lineWidth=2;rr(-90,-56,180,110,28);ctx.stroke();ctx.restore();}
  leads(c);
  T(c,'LV '+Math.round(lv*100)+'%  ·  FW '+N(c.feedOpen,50).toFixed(0)+'%',6,2,'#fff',7.5,'center',800);T(c,'3-ELEMENT',6,-10,'#cfe3f2',6.5,'center',700);T(c,c.label||'BD',60,-40,'#dbe8f7',9,'left',800);
});

/* ═════════ controllers + Modbus ═════════ */
reg(CTL,c=>{const v={pidblock:['PID','#a855f7'],piblock:['PI','#8b5cf6'],pblock:['P','#6366f1'],ratiostation:['RATIO','#ec4899'],splstation:['SPLIT','#f59e0b']}[c.type]||['PID','#a855f7'];
  shell(c,120,130,v[1],true,v[0]+' CONTROLLER');leads(c);
  lcd(-30,-44,64,26,true);T(c,N(c.pv,0).toFixed(1),30,-31,'#ff5a5a',14,'right',800);T(c,'PV',-26,-38,'#a14040',6.5,'left',800);
  lcd(-30,-14,64,20,true);T(c,N(c.setpoint,50).toFixed(1),30,-4,'#4ade80',11,'right',800);T(c,'SP',-26,-9,'#3b8a5c',6.5,'left',800);
  const out=N(c.out,50);bar(-30,12,64,7,out/100,'#a855f7');T(c,'OUT '+out.toFixed(0)+' %  ·  '+N(c.outputMA,12).toFixed(1)+' mA',0,27,'#cbd5e1',7.5,'center',700);
  for(let i=0;i<4;i++){plate(-30+i*17,36,14,10,2,'#475569');}
  T(c,c.type==='ratiostation'?'K '+N(c.ratioK,2):c.type==='splstation'?'GAIN '+N(c.kp,1):'Kp '+N(c.kp,1)+(c.type==='pblock'?'':' Ki '+N(c.ki,.1)),0,54,'#9fb3c9',7.5,'center',700);
  led(-44,54,c.mode==='manual'?'#f59e0b':'#22c55e',true);
});
reg(['modbusslave','modbusmaster'],c=>{const m=c.type==='modbusmaster',acc=m?'#0ea5e9':'#14b8a6';
  shell(c,120,100,acc,true,m?'MODBUS MASTER':'MODBUS SLAVE');leads(c);
  const addr=N(m?c.slaveAddr:c.addr,1);
  for(let i=0;i<8;i++){const on=(addr>>i)&1;rr(-30+i*8,-30,6,12,1.5);ctx.fillStyle=on?'#22d3ee':'#334155';ctx.fill();ctx.strokeStyle='#05080c';ctx.stroke();}
  T(c,'ADDR '+addr,2,-12,'#7fb8a3',7,'center',800);
  const blink=m?(c._slave?Math.sin(AN()*10)>0:false):Math.sin(AN()*6)>.6;
  led(-6,-2,'#22c55e',true);led(10,-2,'#f59e0b',blink);led(26,-2,'#3b82f6',blink&&Math.sin(AN()*13)>-.3);T(c,'PWR   TX    RX',-12,8,'#7a92b0',6,'left',700);
  lcd(-30,14,76,34,true);
  if(m){T(c,'→ slave '+N(c.slaveAddr,1),8,24,'#7df3d1',8,'center',800);T(c,'wr '+N(c._reg0,0).toFixed(0)+' · rd '+N(c.pv,0).toFixed(0),8,36,'#9fb3c9',7.5,'center',700);}
  else{const r=Array.isArray(c.regs)?c.regs:[];for(let i=0;i<4;i++)T(c,'R'+i+' '+N(r[i],0),-24+(i%2)*38,24+Math.floor(i/2)*12,'#7df3d1',7.5,'left',800);}
});

/* ═════════════════ SIDEBAR EXPAND / COLLAPSE ═════════════════ */
const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const css=document.createElement('style');
css.textContent=`.card>h2{display:flex;align-items:center;cursor:pointer;user-select:none}
.card>h2::after{content:none!important}
.card>h2 .chev{margin-left:auto;font-size:11px;opacity:.65;transition:transform .18s}
.card>h2:hover .chev{opacity:1;color:var(--accent)}
.card.collapsed>.bd{display:none}.card.collapsed>h2{border-bottom:0}.card.collapsed>h2 .chev{transform:rotate(-90deg)}
.sidebar-tools{display:flex;gap:6px;flex:none}.sidebar-tools button{flex:1;font-size:10.5px;padding:5px 6px}
.palette-tools{display:flex;gap:6px;margin-top:7px}.palette-tools button{flex:1;font-size:10px;padding:4px 6px}
.edgeTab{position:absolute;top:50%;z-index:6;width:16px;height:60px;margin-top:-30px;border:1px solid var(--line);background:var(--panel);color:var(--mut);cursor:pointer;padding:0;font-size:12px;opacity:.6}
.edgeTab:hover{opacity:1;color:var(--accent);border-color:var(--accent)}
.edgeTab.l{left:0;border-left:0;border-radius:0 8px 8px 0}.edgeTab.r{right:0;border-right:0;border-radius:8px 0 0 8px}`;
document.head.appendChild(css);

const side=document.getElementById('side'),stage=document.getElementById('stage');
const cardKey=card=>'cl.card.'+(card.id||card.querySelector(':scope>h2').textContent.trim());
function setCard(card,v,save){card.classList.toggle('collapsed',v);if(save!==false)ls.set(cardKey(card),v?'1':'0');}
function wireCards(){if(!side)return;
  side.querySelectorAll(':scope>.card').forEach(card=>{const h=card.querySelector(':scope>h2');if(!h||h._v38)return;
    const nh=h.cloneNode(true);nh._v38=1;h.replaceWith(nh);                /* clone drops the older click handlers */
    nh.insertAdjacentHTML('beforeend','<span class="chev">▾</span>');nh.tabIndex=0;nh.title='Click to collapse / expand · double-click to focus only this card';
    if(ls.get(cardKey(card))==='1')card.classList.add('collapsed');
    const tog=()=>setCard(card,!card.classList.contains('collapsed'));
    nh.addEventListener('click',tog);
    nh.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}});
    nh.addEventListener('dblclick',()=>{side.querySelectorAll(':scope>.card').forEach(o=>setCard(o,o!==card));});
  });}
if(side){
  const tools=document.createElement('div');tools.className='sidebar-tools';
  tools.innerHTML='<button id="bCardsCollapse" title="Collapse every card">▸ Collapse all</button><button id="bCardsExpand" title="Expand every card">▾ Expand all</button>';
  side.insertBefore(tools,side.firstChild);
  document.getElementById('bCardsCollapse').onclick=()=>side.querySelectorAll(':scope>.card').forEach(c=>setCard(c,true));
  document.getElementById('bCardsExpand').onclick=()=>side.querySelectorAll(':scope>.card').forEach(c=>setCard(c,false));
  wireCards();setTimeout(wireCards,600);new MutationObserver(wireCards).observe(side,{childList:true});
}
/* Properties opens by itself when a new part / wire is selected */
{let last='';const _rp=renderProps;renderProps=function(){_rp.apply(this,arguments);try{const k=selected?selected.kind+selected.id:'';
  if(k&&k!==last){const card=document.getElementById('props').closest('.card');if(card&&card.classList.contains('collapsed'))card.classList.remove('collapsed');}last=k;}catch(e){}};}
/* component-library Collapse / Expand all */
(function(){const wrap=document.querySelector('.palette-search-wrap'),groups=document.getElementById('componentGroups');if(!wrap||!groups)return;
  const row=document.createElement('div');row.className='palette-tools';row.innerHTML='<button id="bPalCollapse">▸ Collapse all</button><button id="bPalExpand">▾ Expand all</button>';wrap.appendChild(row);
  const all=v=>groups.querySelectorAll('.palette-group').forEach(g=>{g.classList.toggle('collapsed',v);ls.set('cl.cat.'+(g.dataset.category||''),v?'1':'0');});
  document.getElementById('bPalCollapse').onclick=()=>all(true);document.getElementById('bPalExpand').onclick=()=>all(false);})();
/* edge tabs: hide / show a whole sidebar straight from the board */
if(stage){
  const mk=(cls,btnId)=>{const b=document.createElement('button');b.className='edgeTab '+cls;b.onclick=()=>{const t=document.getElementById(btnId);if(t)t.click();};stage.appendChild(b);return b;};
  const L=mk('l','bPalT'),Rr=mk('r','bSideT');
  const sync=()=>{const np=document.body.classList.contains('nopal'),ns=document.body.classList.contains('noside');
    L.textContent=np?'›':'‹';L.title=np?'Show component library':'Hide component library';Rr.textContent=ns?'‹':'›';Rr.title=ns?'Show readout & properties':'Hide readout & properties';};
  sync();new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
}
log('v38 module ready — redesigned new-part graphics + sidebar expand/collapse.');
})();
