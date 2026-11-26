/* ══════════ v16 · HYDRAULIC ACTUATORS · ENCODER CONTROLLER · HMI · PLC · TACHOMETER · TURBOCHARGER ══════════
 * Real-world parameter models (ISO 4401 valves, ISO 6020/6022 bores, ISO 3320 rods, gear motors),
 * 24 V instruments, a scan-cycle PLC with programs, and a map-based turbocharger.
 * Educational model: solver flow units are scaled to L/min with window.HYD_LPM (default 60 L/min per unit). */
(function(){
'use strict';
const num=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2,PI=Math.PI;
const KQ=()=>num(window.HYD_LPM,60);            /* L/min per solver flow unit */
const AN=()=>window.ANIM||0;
const mixc=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const lag=(o,k,t,dt,tau)=>{const v=num(o[k],0);o[k]=v+(t-v)*Math.min(1,dt/Math.max(.001,tau));};
const ERR={};
const safe=(n,f)=>function(c){ctx.save();try{f(c);}catch(e){if(!ERR[n]){ERR[n]=1;console.warn('draw',n,e);}}ctx.restore();};
const T=(c,s,x,y,col,sz,al,wt)=>txt(c,s,x,y,col||COL.text,sz||8,al||'center',wt||700);
const PHS=['L','L2','L3'];
const CHYD=DEFS.spoolvalve?DEFS.spoolvalve.cat:'Hydraulics';
const CSEN=DEFS.encoder?DEFS.encoder.cat:'Sensors & Encoders';
const CPNL=(DEFS.pl_red&&DEFS.pl_red.cat)||'Control Panel Devices';
const pw=(c,a,b)=>{try{const st=sim.st;return !!st&&!!live(st,c,a,b);}catch(e){return false;}};
const sigHigh=(c,a)=>{try{const st=sim.st;return !!st&&PHS.includes(ntype(st,c,a));}catch(e){return false;}};
const R=(hu,c,t)=>hu.find(key(c.id,t));
const f1=(v,d)=>num(v,0).toFixed(d==null?1:d);
const def=(type,o)=>{DEFS[type]=Object.assign({icon:'⚙️',pins:{}},o,{init:Object.assign({},o.init||{})});if(o.blurb)COMP_BLURB[type]=o.blurb;if(o.draw)DRAW[type]=safe(type,o.draw);if(o.links)LINKS[type]=o.links;};
const MINE=new Set();
/* primitives */
const arrow=(x1,y1,x2,y2,col,w)=>{line([[x1,y1],[x2,y2]],col,w||1.6);const a=Math.atan2(y2-y1,x2-x1);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-6*Math.cos(a-.4),y2-6*Math.sin(a-.4));ctx.lineTo(x2-6*Math.cos(a+.4),y2-6*Math.sin(a+.4));ctx.closePath();ctx.fill();};
const metal=(x,y,w,h,b,r)=>{rr(x,y,w,h,r==null?3:r);ctx.fillStyle=GR(0,y,0,y+h,[[0,mixc(b,'#ffffff',.65)],[.3,mixc(b,'#ffffff',.2)],[.65,b],[1,mixc(b,'#000000',.6)]]);ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.stroke();};
const elec=(c,a,b)=>({on:pw(c,a,b)});

/* ═══════════════ ISO TABLES ═══════════════ */
const BORES=[25,32,40,50,63,80,100,125,160,200];                       /* ISO 6020/6022 */
const RODS={25:12,32:18,40:22,50:28,63:36,80:45,100:56,125:70,160:90,200:110};   /* ISO 3320 ratio 1.46 / 1.6 */
const NG={6:{q:30,qmax:80,dp:4,pmax:315,tt:'ISO 4401-03 (NG6 / D03)'},10:{q:60,qmax:160,dp:3.5,pmax:350,tt:'ISO 4401-05 (NG10 / D05)'},16:{q:150,qmax:300,dp:3.5,pmax:350,tt:'ISO 4401-07 (NG16 / D07)'},25:{q:300,qmax:650,dp:3,pmax:350,tt:'ISO 4401-08 (NG25 / D08)'}};
const VG=[4,6,8,11,14,16,20,25,32,40,50,63];                            /* cc/rev gear motors */
const CENTRES=[['closed','Closed centre (O) — all ports blocked'],['tandem','Tandem (H→P-T) — pump unloaded, A/B blocked'],['open','Open centre (H) — all ports joined'],['float','Float (Y) — A, B to tank']];
const area=(d)=>PI/4*d*d;                                              /* mm² */

/* ═══════════════ HYDRAULIC CYLINDERS ═══════════════ */
function cylGeo(c){const bore=num(c.bore,50),rod=num(c.rod,RODS[bore]||Math.round(bore*.56)),st=Math.max(10,num(c.strokeMm,300));
  const A1=area(bore),Ar=area(rod);return{bore,rod,st,A1,Ar,A2:Math.max(1,A1-Ar)};}
function cylLoadN(c,g){const m=num(c.loadKg,0),ori=c.orient||'horizontal',gN=9.81;let F=num(c.extraKN,0)*1000;
  if(ori==='horizontal')F+=.12*m*gN;else if(ori==='vert-up')F+=m*gN;else F-=m*gN;return F;}      /* N, +ve resists extension */
function cylPre(hu,pumps,dt){
  for(const c of comps){if(c.type!=='cylsingle'&&c.type!=='cyldouble')continue;
    c._pos0=num(c.pos,0);c.speed=100;
    if(c.ctrl!=='manual'){const dbl=c.type==='cyldouble',pa=dbl?'P1':'IN',pb=dbl?'P2':null;
      const hp=n=>pumps.some(p=>num(p.spin,0)>.05&&p._wet!==false&&R(hu,p,'DIS')===n);
      const a=hp(R(hu,c,pa)),b=pb?hp(R(hu,c,pb)):false;
      if(dbl)c._dir=a&&!b?1:(!a&&b?-1:(a&&b?1:0));
      else c._dir=a?1:(num(c.pos,0)>0?-1:0);}
    c._d0=c._dir||0;}}
function cylPost(hu,pumps,dt){
  const k=KQ();
  for(const c of comps){if(c.type!=='cylsingle'&&c.type!=='cyldouble')continue;
    const g=cylGeo(c),d=c._d0||0,p0=num(c._pos0,0),dbl=c.type==='cyldouble',psys=num(c.pSys,160);
    c._dir=d;c._alm='';
    const F=cylLoadN(c,g),eta=clamp(num(c.etaM,.92),.5,1),sp=c.type==='cylsingle'?num(c.springN,400):0;
    let v=0,Q=0,A=d<0&&dbl?g.A2:g.A1,preq=0;
    const atEnd0=(d>0&&num(c.pos,0)>=99.99)||(d<0&&num(c.pos,0)<=.01),mv=d&&!atEnd0;
    const q=Math.abs(num(c._in,0)-num(c._out,0));                      /* solver flow units this step; core applies pos += q·dt·speed·1.75 afterwards */
    if(mv&&q>1e-9){
      Q=q*k;
      if(d>0){preq=(F+sp*(1+num(c.pos,0)/100*.5))/(eta*A)*10;}            /* bar (N / mm² ×10) */
      else if(dbl){preq=Math.max(-F/(eta*A)*10,.5);}
      else preq=0;
      if(c.type==='cylsingle'&&d<0){v=num(c.retMms,120);}
      else{
        v=Q*16667/A;                                                       /* mm/s = L/min · 1e6/60 / mm² */
        const pump=pumps.find(x=>num(x.spin,0)>.05);if(pump){const kw=num(pump.hp,1)*.746*.85;const need=Q*Math.max(preq,5)/600;if(need>kw)v*=kw/need;}
        if(num(c.vMax,500)>0)v=Math.min(v,num(c.vMax,500));
        if(preq>psys){v=0;c._alm='STALL — needs '+f1(preq,0)+' bar > relief '+f1(psys,0)+' bar';}
      }
      if(c.cushion!==false){const pos=num(c.pos,0),near=d>0?100-pos:pos;if(near<6)v*=clamp(.2+.8*near/6,.2,1);}
      c.speed=v/g.st*100/(q*1.75);                                         /* core integrates with this gain */
    }else{c.speed=100;}
    c._v=num(c._v,0)+((mv&&Q>0?v*(d>0?1:-1):0)-num(c._v,0))*Math.min(1,dt/.12);
    c._Q=Q;c._preq=preq;
    const atEnd=atEnd0||(!c._dir&&(num(c.pos,0)>=99.9||num(c.pos,0)<=.1));
    const pw_=(mv&&v>0)?Math.min(psys,Math.max(preq,2)+NGdrop(Q)):(atEnd||(mv&&v===0)?psys:0);
    c._p=pw_;c._F=pw_*A/10*eta;                                          /* N */
    /* Euler buckling of the rod: fixed-free, L = 2·stroke, E = 210 GPa, safety 3.5 */
    const I=PI/64*Math.pow(g.rod,4),Lk=2*g.st*(num(c.pos,0)/100)+g.st*.2,Fcr=PI*PI*210000*I/Math.max(1,Lk*Lk)/3.5;
    c._Fcr=Fcr;if(c._F>Fcr&&num(c.pos,0)>5)c._alm=(c._alm?c._alm+' · ':'')+'BUCKLING RISK: '+f1(c._F/1000,1)+' kN > '+f1(Fcr/1000,1)+' kN';
    if(Math.abs(c._v)>500)c._alm=(c._alm?c._alm+' · ':'')+'rod speed > 0.5 m/s (seal limit)';
    c._ang=0;}
}
const NGdrop=(Q)=>.002*Q*Q/10;
const cylTerms=(dbl)=>dbl?[['P1',-70,-40,0,-1,'h'],['P2',0,-40,0,-1,'h'],['+V',-80,50,0,1],['0V',-48,50,0,1],['EXT',-16,50,0,1],['RET',16,50,0,1]]:
  [['IN',-70,-40,0,-1,'h'],['OUT',0,-40,0,-1,'h'],['+V',-80,50,0,1],['0V',-48,50,0,1],['EXT',-16,50,0,1],['RET',16,50,0,1]];
function drawCylinder(c){
  const dbl=c.type==='cyldouble',pos=clamp(num(c.pos,0),0,100)/100,g=cylGeo(c),d=c._dir||0;
  const bx=-85,bw=105,by=-16,bh=32,px0=bx+9,px1=bx+bw-12,px=px0+(px1-px0)*pos;
  const hpA=d>0?1:0,hpB=d<0?1:0;
  /* ports */
  for(const [x,col] of [[-70,d>0?'#ef4444':'#3b82f6'],[0,d<0?'#ef4444':'#3b82f6']]){tubeV2(x-5,by-24,10,24,'#8b98a6');}
  /* barrel */
  rr(bx,by,bw,bh,3);ctx.fillStyle='#0b1622';ctx.fill();
  /* oil chambers */
  const capCol=d>0?'rgba(239,68,68,.55)':(d<0?'rgba(59,130,246,.45)':'rgba(96,165,250,.28)'),rodCol=d<0&&dbl?'rgba(239,68,68,.55)':(d>0?'rgba(59,130,246,.45)':'rgba(96,165,250,.28)');
  ctx.fillStyle=capCol;ctx.fillRect(bx+6,by+2,px-(bx+6)-4,bh-4);
  if(dbl||true){ctx.fillStyle=dbl?rodCol:'rgba(120,130,140,.18)';ctx.fillRect(px+5,by+2,bx+bw-6-px-5,bh-4);}
  if(!dbl){const n=8,x0=px+8,x1=bx+bw-8;ctx.strokeStyle='#cbd5e1';ctx.lineWidth=1.6;ctx.beginPath();for(let i=0;i<=n*4;i++){const x=x0+(x1-x0)*i/(n*4),y=Math.sin(i*PI/2)*(bh/2-6);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  /* barrel tube walls, caps */
  metal(bx,by-4,bw,5,'#94a3b8',2);metal(bx,by+bh-1,bw,5,'#94a3b8',2);
  metal(bx-8,by-6,10,bh+12,'#64748b',2);metal(bx+bw-4,by-6,12,bh+12,'#64748b',2);
  /* piston + rod */
  metal(px-4,by+2,9,bh-4,'#cbd5e1',1);
  const tip=px+118;
  metal(px,-g.rod/10-3,tip-px,g.rod/10*2+6,'#e2e8f0',2);
  metal(bx+bw-2,-5,6,10,'#475569',1);
  /* clevis eye */
  metal(tip,-8,10,16,'#94a3b8',3);ctx.beginPath();ctx.arc(tip+5,0,3.5,0,TAU);ctx.fillStyle='#0b1622';ctx.fill();
  /* rear eye */
  metal(bx-18,-8,10,16,'#94a3b8',3);ctx.beginPath();ctx.arc(bx-13,0,3.5,0,TAU);ctx.fillStyle='#0b1622';ctx.fill();
  /* reed sensors */
  if(c.sensors!==false){const on=pw(c,'+V','0V');for(const [x,k] of [[bx+14,'RET'],[bx+bw-18,'EXT']]){rr(x-6,by+bh+3,12,6,2);ctx.fillStyle=on&&c['_s'+k]?'#22c55e':'#334155';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();}}
  T(c,c.label,-20,-70,COL.text,9,'center',800);
  T(c,`Ø${g.bore}/${g.rod} × ${g.st} mm · ${dbl?'DA':'SA'}`,-10,64,COL.mut,8,'center',800);
  const run=d!==0&&Math.abs(num(c._v,0))>1;
  T(c,`${f1(pos*g.st,0)} mm · ${f1(Math.abs(num(c._v,0)),0)} mm/s`,-10,76,run?COL.ok:COL.mut,8,'center',800);
  if(num(c._p,0)>1)T(c,`${f1(c._p,0)} bar · ${f1(num(c._F,0)/1000,1)} kN`,-10,88,COL.warn,8,'center',800);
  if(c._alm)T(c,'⚠ '+c._alm.split(' · ')[0].slice(0,34),-10,100,COL.bad,7,'center',800);
}
function tubeV2(x,y,w,h,b){metal(x,y,w,h,b,2);}
function cylDesc(c){const g=cylGeo(c);return `Ø${g.bore}/${g.rod} mm · stroke ${g.st} mm\nPos ${f1(num(c.pos,0)/100*g.st,0)} mm (${f1(num(c.pos,0),0)} %)\nv ${f1(num(c._v,0),0)} mm/s · Q ${f1(num(c._Q,0),1)} L/min\np ${f1(num(c._p,0),0)} bar · F ${f1(num(c._F,0)/1000,1)} kN\n`+(c._dir>0?'EXTENDING':c._dir<0?'RETRACTING':'HOLD')+(c._alm?'\n⚠ '+c._alm:'');}
function cylSens(c){c._sEXT=num(c.pos,0)>=98;c._sRET=num(c.pos,0)<=2;}
function cylLinks(c){const a=[];if(c.sensors===false||!c._pwS)return a;if(c._sEXT)a.push(['+V','EXT']);if(c._sRET)a.push(['+V','RET']);return a;}
const cylInit={pos:0,_dir:0,speed:100,bore:50,rod:28,strokeMm:300,pSys:160,loadKg:200,orient:'horizontal',extraKN:0,etaM:.92,cushion:true,vMax:500,ctrl:'auto',sensors:true,springN:400,retMms:120};
def('cylsingle',{name:'Single-Acting Hydraulic Cylinder (spring return)',tag:'SC',cat:CHYD,w:230,h:150,term:cylTerms(false),
 pins:{IN:'cap-end pressure port — extends',OUT:'rod-end breather / drain','+V':'reed sensor supply 24 V','0V':'0 V',EXT:'sensor: fully extended',RET:'sensor: fully retracted'},
 draw:drawCylinder,links:cylLinks,click:c=>{c.ctrl='manual';c._dir=c._dir>0?-1:1;},init:Object.assign({},cylInit,{rod:28,pSys:160}),
 blurb:'ISO 6020 ram-type cylinder. Extend speed v = Q / A, force F = p · A · ηm. Spring returns the rod when the port is vented to tank. Parameters: bore, rod, stroke, load, orientation, relief pressure, cushioning. Includes Euler rod-buckling check and reed position sensors.',
 desc:cylDesc});
def('cyldouble',{name:'Double-Acting Hydraulic Cylinder',tag:'DC',cat:CHYD,w:230,h:150,term:cylTerms(true),
 pins:{P1:'cap-end port — pressure here extends',P2:'rod-end port — pressure here retracts','+V':'reed sensor supply 24 V','0V':'0 V',EXT:'sensor: fully extended',RET:'sensor: fully retracted'},
 draw:drawCylinder,links:cylLinks,click:c=>{c.ctrl='manual';c._dir=c._dir>0?-1:1;},init:Object.assign({},cylInit),
 blurb:'ISO 6020/6022 double-acting cylinder. Direction follows which port the spool valve pressurises (set Control = manual to drive by click). Extend v = Q/A1 (cap area), retract v = Q/(A1−Arod) so retract is faster; F = p·A·ηm. Stall when load needs more than the relief setting; cushioning in the last 6 % stroke.',
 desc:cylDesc});
MINE.add('cylsingle');MINE.add('cyldouble');

/* ═══════════════ SPOOL VALVE 4/3 (ISO 4401) ═══════════════ */
function spoolCoils(c){const sol=c.act!=='manual';if(!sol)return;
  const y1=pw(c,'Y1','0V'),y2=pw(c,'Y2','0V');c._y1=y1;c._y2=y2;
  c._cmd=y1&&!y2?0:(y2&&!y1?1:2);}
function spoolTick(c,dt){
  if(c.act!=='manual')spoolCoils(c);else c._cmd=num(c.pos,2);
  const ttr=Math.max(10,num(c.tShift,40))/1000;                         /* solenoid shift time, ms */
  if(c._cmd!==c.pos){c._tm=num(c._tm,0)+dt;if(c._tm>=ttr){c.pos=c._cmd;c._tm=0;}}else c._tm=0;
  const target=c.pos===0?-1:(c.pos===1?1:0);c._sx=num(c._sx,0)+(target-num(c._sx,0))*Math.min(1,dt/Math.max(.015,ttr*.6));
  const ng=NG[num(c.size,10)]||NG[10],Q=num(c._Q,0);
  c._dp=c.pos<2||c.centre==='open'?ng.dp*Math.pow(Q/ng.q,2)*(c.pos<2?1:.5):0;
  c._leak=(c.pos<2?.2:.35)*num(c.pSys,160)/100*(ng.q/30)*.1;           /* spool leakage cm³/min (≈0.05–0.2 per bar·100) */
  c._alm=Q>ng.qmax?`Q ${f1(Q,0)} > ${ng.qmax} L/min limit (${ng.tt.split(' ')[2]})`:'';
}
const CPOS=['EXTEND (P→A, B→T)','RETRACT (P→B, A→T)','CENTRE'];
function drawSpool(c){
  const sx=num(c._sx,0),pos=num(c.pos,2);
  body(c,130,120,c._alm?COL.bad:COL.edge);
  /* port stubs */
  for(const [y,l] of [[-20,'P'],[20,'T']])T(c,l,-48,y-9,COL.mut,8,'center',800);
  for(const [y,l] of [[-20,'A'],[20,'B']])T(c,l,48,y-9,COL.mut,8,'center',800);
  line([[-58,-20],[-39,-20]],'#60a5fa',3);line([[-58,20],[-39,20]],'#38bdf8',3);line([[39,-20],[58,-20]],'#f97316',3);line([[39,20],[58,20]],'#fb923c',3);
  const bw=26,bh=44,x0=-39;
  const bx=[x0,x0+bw,x0+2*bw];
  /* sliding envelope: active box aligned with ports */
  const off=-sx*bw;ctx.save();ctx.translate(off,0);
  const names=[0,2,1];
  for(let i=0;i<3;i++){const act=names[i]===pos;rr(bx[i],-bh/2,bw,bh,0);ctx.fillStyle=act?'rgba(34,197,94,.14)':'rgba(20,30,45,.9)';ctx.fill();ctx.lineWidth=act?2:1;ctx.strokeStyle=act?COL.ok:'#7d8b9a';ctx.stroke();spoolBox(bx[i]+bw/2,names[i],c);}
  ctx.restore();
  ctx.save();ctx.beginPath();ctx.rect(-80,-60,160,120);ctx.restore();
  /* mask outside ports window */
  /* solenoids */
  for(const [x,l,on,k] of [[-52,'Y1',c._y1,'Y1'],[52,'Y2',c._y2,'Y2']]){rr(x-8,-58,16,16,3);ctx.fillStyle=on?'#22c55e':'#243447';ctx.fill();ctx.strokeStyle='#0b1622';ctx.stroke();T(c,l,x,-50,on?'#04230f':COL.mut,7,'center',800);line([[x,-42],[x,-30]],on?COL.ok:'#475569',2);}
  /* centring springs */
  for(const x of [-30,30]){ctx.beginPath();for(let i=0;i<=8;i++){const y=-48+0,px=x+(i%2?3:-3);}}
  T(c,c.label,0,-88,COL.text,9,'center',800);
  const ng=NG[num(c.size,10)]||NG[10];
  T(c,`NG${num(c.size,10)} · ${c.centre||'closed'} · ${num(c.pSys,160)} bar`,0,70,COL.mut,8,'center',800);
  T(c,CPOS[pos]||'CENTRE',0,82,pos<2?COL.ok:COL.mut,8,'center',800);
  if(num(c._Q,0)>.5)T(c,`ΔP ${f1(c._dp,1)} bar @ ${f1(c._Q,0)} L/min`,0,94,COL.warn,8,'center',800);
}
function spoolBox(x,p,c){const col='#60a5fa',h=10;
  const A=(x1,y1,x2,y2,cc)=>arrow(x+x1,y1,x+x2,y2,cc||col,1.4);
  if(p===0){A(-8,-h,8,-h);A(8,h,-8,h,'#38bdf8');}
  else if(p===1){A(-8,-h,8,h);A(8,-h,-8,h,'#38bdf8');}
  else{const k=c.centre||'closed';
    if(k==='closed'){for(const [px,py] of [[-8,-h],[-8,h],[8,-h],[8,h]]){line([[x+px-3,py],[x+px+3,py]],'#94a3b8',2);}}
    else if(k==='tandem'){A(-8,-h,-8,h);line([[x+5,-h],[x+11,-h]],'#94a3b8',2);line([[x+5,h],[x+11,h]],'#94a3b8',2);}
    else if(k==='open'){A(-8,-h,8,-h);A(-8,h,8,h);line([[x-8,-h],[x-8,h]],col,1.4);line([[x+8,-h],[x+8,h]],col,1.4);}
    else{line([[x-8,-h],[x-8,-h]],col,1);A(8,-h,8,h);A(8,h,-8,h,'#38bdf8');}}}
def('spoolvalve',{name:'Hydraulic Spool Valve 4/3 (ISO 4401)',tag:'FS',cat:CHYD,w:130,h:150,
 term:[['P',-58,-20,-1,0,'h'],['T',-58,20,-1,0,'h'],['A',58,-20,1,0,'h'],['B',58,20,1,0,'h'],['Y1',-52,-74,0,-1],['Y2',52,-74,0,-1],['0V',0,-74,0,-1]],
 pins:{P:'pressure supply',T:'tank return',A:'work port A (cylinder cap end)',B:'work port B (cylinder rod end)',Y1:'solenoid 1 24 V → P→A (extend)',Y2:'solenoid 2 24 V → P→B (retract)','0V':'solenoid common 0 V'},
 draw:drawSpool,click:c=>{c.act='manual';c.pos=(num(c.pos,2)+1)%3;},
 init:{pos:2,act:'solenoid',size:10,centre:'closed',pSys:160,tShift:40,_cmd:2,_sx:0,_Q:0,_dp:0,_y1:false,_y2:false},
 blurb:'4/3 spring-centred directional valve to ISO 4401 (NG6/10/16/25). Energise Y1 → P→A, B→T (extend); Y2 → P→B, A→T (retract); none → spring-centred with selectable centre (closed, tandem, open, float). 24 V DC coils, shift time ≈40 ms. Pressure drop ΔP = ΔPnom·(Q/Qnom)². Set Actuation = manual lever to cycle by click.',
 desc:c=>`NG${num(c.size,10)} · ${c.centre} centre\n${CPOS[num(c.pos,2)]}\nY1 ${c._y1?'ON':'off'} · Y2 ${c._y2?'ON':'off'}\nQ ${f1(num(c._Q,0),1)} L/min · ΔP ${f1(num(c._dp,0),1)} bar\nSpool leakage ${f1(num(c._leak,0),2)} cm³/min`+(c._alm?'\n⚠ '+c._alm:'')});
MINE.add('spoolvalve');

/* ═══════════════ POPPET VALVE (check / 2-2 solenoid cartridge) ═══════════════ */
function poppetTick(c,dt){
  const mode=c.vtype||'check';
  if(mode==='check'){if(c.open===false&&c.latched!==true)c.open=true;}
  else{const on=pw(c,'Y','0V');c._on=on;c.open=mode==='sol-nc'?on:!on;}
  const Q=num(c._Q,0),qn=num(c.qNom,60);c._dp=c.open!==false?num(c.crack,1)*(mode==='check'?1:0)+num(c.dpNom,2)*Math.pow(Q/Math.max(1,qn),2):0;
  c._alm=Q>qn*1.8?`Q ${f1(Q,0)} L/min exceeds rating ${qn}`:'';
}
function drawPoppet(c){const open=c.open!==false,mode=c.vtype||'check',lift=open?1:0;
  body(c,110,110,c._alm?COL.bad:COL.edge);
  line([[-45,0],[-22,0]],'#60a5fa',4);line([[22,0],[45,0]],open?'#f97316':'#64748b',4);
  rr(-22,-24,44,48,5);ctx.fillStyle='#0b1622';ctx.fill();ctx.strokeStyle='#7d8b9a';ctx.lineWidth=1.5;ctx.stroke();
  if(open&&num(c._Q,0)>.5){ctx.fillStyle='rgba(96,165,250,.35)';ctx.fillRect(-20,-8,40,16);}
  /* seat + poppet + spring */
  line([[-6,-24],[-6,-8]],'#94a3b8',3);line([[-6,24],[-6,8]],'#94a3b8',3);
  const px=-6-lift*14;ctx.fillStyle=open?COL.ok:'#cbd5e1';ctx.beginPath();ctx.moveTo(px+2,0);ctx.lineTo(px-8,-8);ctx.lineTo(px-8,8);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1.4;ctx.beginPath();const sx0=px-8;for(let i=0;i<=8;i++){const x=sx0-i*1.6,y=(i%2?3.2:-3.2);i?ctx.lineTo(x,y):ctx.moveTo(x,0);}ctx.stroke();
  if(mode!=='check'){rr(10,-40,16,16,3);ctx.fillStyle=c._on?'#22c55e':'#243447';ctx.fill();ctx.strokeStyle='#0b1622';ctx.stroke();T(c,'Y',18,-32,c._on?'#04230f':COL.mut,7,'center',800);line([[18,-24],[18,-14]],c._on?COL.ok:'#475569',2);}
  T(c,c.label,0,-58,COL.text,9,'center',800);
  T(c,mode==='check'?`CHECK · crack ${f1(c.crack,1)} bar`:(mode==='sol-nc'?'2/2 NC solenoid poppet':'2/2 NO solenoid poppet'),0,52,COL.mut,8,'center',800);
  T(c,open?(num(c._Q,0)>.5?`FLOW ${f1(c._Q,0)} L/min · ΔP ${f1(c._dp,1)} bar`:'OPEN'):'SEATED (zero leakage)',0,64,open?COL.ok:COL.mut,8,'center',800);}
def('poppetvalve',{name:'Poppet Valve (check / 2-2 solenoid cartridge)',tag:'PCV',cat:CHYD,w:110,h:130,
 term:[['IN',-45,0,-1,0,'h'],['OUT',45,0,1,0,'h'],['Y',18,-40,0,-1],['0V',-10,-40,0,-1]],
 pins:{IN:'inlet (A) — flow IN→OUT only for check type',OUT:'outlet (B)',Y:'solenoid 24 V (solenoid types)','0V':'solenoid common'},
 draw:drawPoppet,click:c=>{c.vtype='check';c.open=c.open===false;c.latched=c.open===false;},
 init:{vtype:'check',open:true,crack:1,qNom:60,dpNom:2,_Q:0,_dp:0,_on:false},
 blurb:'Seat-type poppet valve: leak-free when seated (unlike a spool). Types: spring check valve (cracking pressure 0.5–5 bar, flow IN→OUT only) or 2/2 solenoid cartridge, normally closed or normally open. ΔP = crack + ΔPnom·(Q/Qnom)².',
 desc:c=>`${c.vtype||'check'} · ${c.open!==false?'OPEN':'SEATED'}\nCracking ${f1(c.crack,1)} bar\nQ ${f1(num(c._Q,0),1)} L/min · ΔP ${f1(num(c._dp,0),1)} bar`+(c._alm?'\n⚠ '+c._alm:'')});
MINE.add('poppetvalve');

/* ═══════════════ GEAR MOTOR ═══════════════ */
function motorTick(c,dt,hu,hflow){
  const k=KQ(),Vg=num(c.vg,16),eV=clamp(num(c.etaV,.92),.5,1),eH=clamp(num(c.etaHM,.88),.4,1),psys=num(c.pSys,160),dpMax=num(c.dpMax,210);
  const rIN=R(hu,c,'IN'),fl=c.on!==false&&hflow.has(rIN);
  const q0=fl?num(c._rpm,0)/2400:0;let Q=q0*k;                         /* L/min from solver */
  const TL=num(c.loadNm,10)+num(c.fricNm,.3);                           /* load + seal friction, N·m */
  const dpReq=TL*20*PI/(Vg*eH),dpLim=Math.min(psys,dpMax);
  let target=0,alm='';
  if(fl){
    if(dpReq>=dpLim){alm=`STALL: load needs ${f1(dpReq,0)} bar > ${f1(dpLim,0)} bar (relief/limit)`;target=0;c._dp=dpLim;}
    else{target=Math.min(num(c.nMax,3000),Q*eV/Vg*1000);c._dp=dpReq;}
    if(target>=num(c.nMax,3000)-1)alm=alm||'max speed limit';
  }else c._dp=0;
  const J=Math.max(.001,num(c.inertia,.02)),tau=clamp(J*30,.05,2);
  lag(c,'_n',target,dt,tau);if(c._n<.5)c._n=0;
  const n=num(c._n,0),Tout=n>0?Math.min(TL,c._dp*Vg*eH/(20*PI)):c._dp*Vg*eH/(20*PI);
  c._Q=Q;c._T=Tout;c._Pmech=Tout*n*TAU/60/1000;c._Phyd=Q*num(c._dp,0)/600;
  c._eta=c._Phyd>.001?clamp(c._Pmech/c._Phyd,0,1):0;c._alm=alm;
  c._ang=num(c._ang,0)+Math.min(n,300)/60*TAU*dt;
}
function drawGearMotor(c){const on=c.on!==false,n=num(c._n,0),a=num(c._ang,0);
  body(c,150,130,c._alm?COL.bad:(n>5?COL.ok:COL.edge));
  /* housing */
  metal(-48,-38,86,76,'#475569',8);
  /* gear chambers */
  ctx.save();ctx.beginPath();ctx.arc(-14,0,24,0,TAU);ctx.arc(14,0,24,0,TAU);ctx.restore();
  rr(-42,-30,74,60,16);ctx.fillStyle='#0b1622';ctx.fill();
  if(on&&n>2){ctx.fillStyle='rgba(96,165,250,.22)';ctx.fillRect(-40,-28,70,56);}
  const gear=(x,dir,col)=>{ctx.save();ctx.translate(x,0);ctx.rotate(a*dir);ctx.fillStyle=col;ctx.beginPath();for(let i=0;i<24;i++){const t=i/24*TAU,r=(i%2?15:19);ctx.lineTo(Math.cos(t)*r,Math.sin(t)*r);}ctx.closePath();ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#0b1622';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();line([[0,0],[0,-10]],'#0b1622',1.5);ctx.restore();};
  gear(-14,1,'#cbd5e1');gear(14,-1,'#94a3b8');
  /* ports */
  line([[-52,-14],[-40,-14]],'#60a5fa',5);line([[-52,14],[-40,14]],'#38bdf8',5);
  /* shaft */
  metal(38,-6,28,12,'#e2e8f0',2);ctx.save();ctx.translate(64,0);ctx.rotate(a);ctx.fillStyle='#94a3b8';ctx.fillRect(-1,-5,3,10);ctx.restore();
  line([[50,-6],[50,6]],'#475569',2);
  /* flange */
  metal(34,-30,6,60,'#64748b',2);
  led(-44,30,on?'#22c55e':'#64748b',on);
  T(c,c.label,0,-56,COL.text,9,'center',800);
  T(c,`${num(c.vg,16)} cm³/rev · ${num(c.pSys,160)} bar`,0,56,COL.mut,8,'center',800);
  T(c,on?(n>1?`${f1(n,0)} rpm · ${f1(c._T,1)} N·m`:'NO FLOW / STALLED'):'OFF',0,68,on?(n>1?COL.ok:COL.warn):COL.mut,8,'center',800);
  if(n>1)T(c,`Q ${f1(c._Q,1)} L/min · Δp ${f1(c._dp,0)} bar · ${f1(c._Pmech,2)} kW`,0,80,COL.warn,8,'center',800);
  if(c._alm)T(c,'⚠ '+c._alm.slice(0,40),0,92,COL.bad,7,'center',800);}
def('hydmotor',{name:'Hydraulic Gear Motor',tag:'HM',cat:CHYD,w:150,h:150,term:[['IN',-52,-14,-1,0,'h'],['OUT',-52,14,-1,0,'h']],
 pins:{IN:'pressure inlet — drives rotation',OUT:'return to tank'},draw:drawGearMotor,click:c=>{c.on=c.on===false;},
 init:{on:true,_rpm:0,_n:0,_flow:0,vg:16,etaV:.92,etaHM:.88,pSys:160,dpMax:210,nMax:3000,loadNm:10,fricNm:.3,inertia:.02,_Q:0,_T:0,_dp:0,_ang:0},
 blurb:'External gear motor. Speed n = Q·ηv/Vg·1000 (rpm, Q in L/min, Vg in cm³/rev); torque T = Δp·Vg·ηhm/(20π) (N·m, Δp in bar); hydraulic power P = Q·Δp/600 (kW). Stalls when load torque needs more pressure than the relief setting or the motor rating (typ. 210 bar). Set displacement 4–63 cm³/rev, efficiencies, load torque and rotor inertia.',
 desc:c=>`Vg ${num(c.vg,16)} cm³/rev\n${f1(num(c._n,0),0)} rpm · ${f1(c._T,1)} N·m\nQ ${f1(c._Q,1)} L/min · Δp ${f1(c._dp,0)} bar\nP hyd ${f1(c._Phyd,2)} kW → mech ${f1(c._Pmech,2)} kW (η ${f1(num(c._eta,0)*100,0)} %)`+(c._alm?'\n⚠ '+c._alm:'')});
MINE.add('hydmotor');

/* ───── solver hooks ───── */
{const _sh=solveHydraulics;
 solveHydraulics=function(hu,pumps,sumps,tanks,hflow,warnings,dt){
  const n=dt>0;
  if(n){try{cylPre(hu,pumps,dt);}catch(e){console.warn('cylPre',e);}}
  const r=_sh.apply(this,arguments);
  try{
    for(const c of comps){
      if(c.type==='hydmotor')motorTick(c,Math.max(dt,0),hu,hflow);
    }
    if(n)cylPost(hu,pumps,dt);
    /* valve flows */
    for(const v of comps){
      if(v.type==='spoolvalve'){let Q=0;for(const c of comps)if((c.type==='cyldouble'||c.type==='cylsingle')&&c._Q>Q){const pa=R(hu,c,c.type==='cyldouble'?'P1':'IN'),pb=c.type==='cyldouble'?R(hu,c,'P2'):null;if(pa===R(hu,v,'A')||pa===R(hu,v,'B')||(pb&&(pb===R(hu,v,'A')||pb===R(hu,v,'B'))))Q=c._Q;}
        for(const c of comps)if(c.type==='hydmotor'&&c._Q>Q&&(R(hu,c,'IN')===R(hu,v,'A')||R(hu,c,'IN')===R(hu,v,'B')))Q=c._Q;v._Q=Q;}
      else if(v.type==='poppetvalve'){let Q=0;const a=R(hu,v,'OUT');for(const c of comps){if((c.type==='cyldouble'||c.type==='cylsingle')&&c._Q>Q&&(R(hu,c,c.type==='cyldouble'?'P1':'IN')===a))Q=c._Q;if(c.type==='hydmotor'&&c._Q>Q&&R(hu,c,'IN')===a)Q=c._Q;}v._Q=Q;}
    }
  }catch(e){if(!ERR.sh){ERR.sh=1;console.warn('hyd post',e);}}
  return r;};}
/* spool centre types in the hydraulic union-find */
{const _bh=buildHUF;
 buildHUF=function(){const uf=_bh();for(const c of comps){if(c.type!=='spoolvalve')continue;const p=num(c.pos,2),k=c.centre||'closed',u=(a,b)=>uf.union(key(c.id,a),key(c.id,b));
   if(p>=2){if(k==='tandem')u('P','T');else if(k==='open'){u('P','T');u('P','A');u('P','B');}else if(k==='float'){u('A','T');u('B','T');}}}
  return uf;};}

/* ═══════════════ ENCODER CONTROLLER ═══════════════ */
const ROT=['acmotor','dcmotor','motor3','servomotor','steppermotor','motor','gearpump','silopump','hydmotor','engine4s','encoder','turbocharger'];
function rotRpm(m){switch(m.type){case'motor':return num(m.spin,0)*2880;case'gearpump':return num(m.spin,0)*1450;case'hydmotor':return num(m._n,0);case'engine4s':return num(m.rpm,0);case'encoder':return num(m.rpmNow,0);case'turbocharger':return num(m._shaftRpm,0);default:return num(m.rpm,0);}}
function nearestRot(c,reach){let best=null,bd=reach;for(const m of comps){if(m===c||!ROT.includes(m.type)||m.type==='encoder')continue;const d=Math.hypot(m.x-c.x,m.y-c.y);if(d<bd){bd=d;best=m;}}return best;}
function encTick(c,dt){
  const st=sim.st;c._pw=pw(c,'+V','0V');c._alm='';
  let enc=null;if(st){const ra=st.uf.find(key(c.id,'A'));for(const e of comps)if(e.type==='encoder'&&st.uf.find(key(e.id,'A'))===ra){enc=e;break;}}
  c._enc=enc?enc.id:0;
  if(!c._pw){c._hz=0;c._o1=c._o2=false;return;}
  if(!enc){c._alm='NO ENCODER on A/B';c._rpm=0;c._hz=0;}
  else if(!enc.pw){c._alm='ENCODER UNPOWERED';c._rpm=0;}
  else{
    const mult=num(c.mult,4),ppr=num(enc.ppr,1000),cnt=num(enc.cnt,0);
    const reset=pw(c,'RST','0V')||sigHigh(c,'RST');
    if((reset&&!c._rstPrev)||c._cmdZero){c._off=cnt;c._cmdZero=false;}c._rstPrev=reset;
    c._raw=Math.round((cnt-num(c._off,0))*mult);
    const lead=num(c.lead,10);                                          /* mm per output rev (screw lead / roller circumference) */
    const ratio=Math.max(.01,num(c.ratio,1));
    c._pos=c._raw/(ppr*mult)*lead/ratio;                                /* mm */
    lag(c,'_rpm',num(enc.rpmNow,0),dt,num(c.filt,.2));
    c._hz=Math.abs(num(c._rpm,0))/60*ppr*mult;
    c._lin=num(c._rpm,0)/60*lead/ratio;                                  /* mm/s */
    if(c._hz>num(c.maxHz,100000))c._alm='INPUT > '+f1(num(c.maxHz,100000)/1000,0)+' kHz — counts lost';
    c._z=!!enc.sZ;
  }
  const mode=c.mode||'position',val=mode==='speed'?Math.abs(num(c._rpm,0)):(mode==='counter'?num(c._raw,0):num(c._pos,0));
  c._val=val;
  c._o1=mode==='speed'?val>=num(c.sp1,1000):val>=num(c.sp1,100);
  c._o2=Math.abs(num(c._rpm,0))>=num(c.ovr,3000);
}
function drawEncCtrl(c){const on=c._pw;body(c,150,150,c._alm?COL.bad:(on?COL.ok:COL.edge));
  const mode=c.mode||'position';
  rr(-52,-48,104,54,4);ctx.fillStyle=on?'#06251d':'#0a1613';ctx.fill();ctx.strokeStyle='#050a0c';ctx.stroke();
  const big=on?(mode==='counter'?String(Math.round(num(c._val,0))):f1(num(c._val,0),mode==='speed'?0:2)):'----';
  ctx.save();ctx.font='700 20px ui-monospace,Menlo,monospace';ctx.textAlign='right';ctx.fillStyle=on?'#3df5b0':'#2c4a40';ctx.fillText(big,46,-20);ctx.restore();
  T(c,on?(mode==='counter'?'COUNTS (×'+num(c.mult,4)+')':mode==='speed'?'RPM':'POSITION mm'):'NO SUPPLY',-48,-38,'#7fb8a3',7,'left',800);
  if(on){T(c,`${f1(c._rpm,0)} rpm`,-48,-6,'#7fb8a3',8,'left',800);T(c,`${f1((c._hz||0)/1000,2)} kHz`,48,-6,'#7fb8a3',8,'right',800);}
  led(-40,18,c._o1?'#22c55e':'#334155',c._o1);T(c,'SP1',-28,19,COL.mut,7,'left',800);
  led(8,18,c._o2?'#ef4444':'#334155',c._o2);T(c,'OVR',20,19,COL.mut,7,'left',800);
  led(-40,34,on&&c._enc?'#22c55e':'#334155',on&&c._enc);T(c,'ENC',-28,35,COL.mut,7,'left',800);
  led(8,34,c._z?'#f59e0b':'#334155',c._z);T(c,'Z',20,35,COL.mut,7,'left',800);
  T(c,c.label,0,-86,COL.text,9,'center',800);T(c,(c.mode||'position').toUpperCase()+' · '+(c._alm||'OK'),0,86,c._alm?COL.bad:COL.mut,8,'center',800);}
def('encctrl',{name:'Encoder Controller / Counter',tag:'ENC-C',cat:CSEN,w:150,h:150,
 term:[['+V',-75,-45,-1,0],['0V',-75,-15,-1,0],['A',-75,15,-1,0],['B',-75,45,-1,0],['Z',0,75,0,1],['RST',75,-45,1,0],['OUT1',75,-15,1,0],['OUT2',75,15,1,0]],
 pins:{'+V':'10…30 V DC','0V':'0 V',A:'encoder channel A',B:'encoder channel B',Z:'encoder index (optional)',RST:'zero / preset input (24 V)',OUT1:'PNP: value ≥ SP1',OUT2:'PNP: overspeed'},
 draw:drawEncCtrl,links:c=>{if(!c._pw)return[];const a=[];if(c._o1)a.push(['+V','OUT1']);if(c._o2)a.push(['+V','OUT2']);return a;},
 click:c=>{c._cmdZero=true;},
 init:{mode:'position',mult:4,lead:10,ratio:1,filt:.2,sp1:100,ovr:3000,maxHz:100000,_pw:false,_raw:0,_pos:0,_rpm:0,_hz:0,_o1:false,_o2:false,_off:0},
 blurb:'Quadrature counter for an incremental encoder: wire A/B (and Z) to the encoder. Decodes ×1/×2/×4 counts, shows position (mm via lead/gear ratio), speed (rpm, mm/s) and frequency. SP1 output when value ≥ setpoint, OVR output on overspeed; RST input or click zeroes the count. Flags input frequency above the counter limit.',
 desc:c=>`Mode ${c.mode} · ×${num(c.mult,4)}\nCounts ${num(c._raw,0)} · ${f1(c._pos,2)} mm\n${f1(c._rpm,0)} rpm · ${f1((c._hz||0)/1000,2)} kHz\nSP1 ${c._o1?'ON':'off'} · OVR ${c._o2?'ON':'off'}`+(c._alm?'\n⚠ '+c._alm:'')});

/* ═══════════════ TACHOMETER ═══════════════ */
const TSENS={optical:'Reflective optical (1 mark)',magnetic:'Magnetic pickup (gear teeth)',laser:'Laser non-contact',contact:'Contact wheel'};
function tachoTick(c,dt){
  c._pw=pw(c,'+V','0V');c._alm='';
  if(!c._pw){c._rpm=0;c._hi=c._lo=false;return;}
  const reach=num(c.reach,300);let src=null,true_=0;
  if(c.tmode==='manual')true_=num(c.rpmMan,0);
  else{src=nearestRot(c,reach);true_=src?rotRpm(src):0;c._src=src?(src.label||src.type):'';}
  const marks=Math.max(1,num(c.marks,1)),gate=clamp(num(c.gate,.5),.05,10);
  c._true=true_;c._g=num(c._g,0)+dt;c._ph=num(c._ph,0)+Math.abs(true_)/60*marks*dt;
  if(c._g>=gate){const n=Math.floor(c._ph);c._ph-=n;c._pulses=n;c._raw=n*60/(marks*gate)*Math.sign(true_||1);c._g=0;}
  c._res=60/(marks*gate);
  const filt=clamp(num(c.filt,.3),.02,5);
  lag(c,'_rpm',num(c._raw,0),dt,filt);if(Math.abs(c._rpm)<c._res*.5&&Math.abs(true_)<.5)c._rpm=0;
  const rng=num(c.range,6000);if(Math.abs(c._rpm)>rng){c._alm='OVER-RANGE';}
  const hy=num(c.hyst,20),a=Math.abs(c._rpm);
  if(a>num(c.hi,3000))c._hi=true;else if(a<num(c.hi,3000)-hy)c._hi=false;
  if(a<num(c.lo,100)&&num(c.loEn,false)!==false)c._lo=true;else if(a>num(c.lo,100)+hy)c._lo=false;
  if(c.tmode!=='manual'&&!src)c._alm='NO ROTATING TARGET';
}
function tachoVal(c){const r=num(c._rpm,0),u=c.unit||'rpm';return u==='rad/s'?r*TAU/60:u==='Hz'?r/60:u==='m/min'?r*TAU*num(c.rad,.05)*60/60*1:r;}
function drawTacho(c){const on=c._pw;body(c,130,130,c._alm&&c._alm!=='OVER-RANGE'?COL.warn:(on?COL.ok:COL.edge));
  /* dial */
  ctx.beginPath();ctx.arc(0,-6,46,0,TAU);ctx.fillStyle='#0b1622';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#94a3b8';ctx.stroke();
  const rng=num(c.range,6000);
  for(let i=0;i<=12;i++){const a=PI*.75+i/12*PI*1.5,r1=40,r2=i%2?44:36;line([[Math.cos(a)*r1,-6+Math.sin(a)*r1],[Math.cos(a)*r2,-6+Math.sin(a)*r2]],i>10?'#ef4444':'#cbd5e1',i%2?1:2);
    if(i%2===0)T(c,String(Math.round(rng*i/12/ (rng>=1000?1000:1)*(rng>=1000?10:1))/(rng>=1000?10:1)),Math.cos(a)*27,-6+Math.sin(a)*27+2,'#cbd5e1',6,'center',700);}
  const f=on?clamp(Math.abs(num(c._rpm,0))/rng,0,1.05):0,na=PI*.75+f*PI*1.5;
  line([[0,-6],[Math.cos(na)*38,-6+Math.sin(na)*38]],on?'#fb923c':'#64748b',2.5);ctx.beginPath();ctx.arc(0,-6,4,0,TAU);ctx.fillStyle='#fb923c';ctx.fill();
  T(c,on?f1(tachoVal(c),0)+' '+(c.unit||'rpm'):'NO SUPPLY',0,32,on?COL.ok:COL.mut,9,'center',800);
  led(-40,46,c._hi?'#ef4444':'#334155',c._hi);T(c,'HI',-28,47,COL.mut,7,'left',800);
  led(8,46,c._lo?'#f59e0b':'#334155',c._lo);T(c,'LO',20,47,COL.mut,7,'left',800);
  T(c,c.label,0,-76,COL.text,9,'center',800);
  T(c,c._alm||(c.tmode==='manual'?'manual input':(c._src?'on '+c._src:'')),0,76,c._alm?COL.warn:COL.mut,8,'center',800);}
def('tacho',{name:'Tachometer (optical / magnetic, 24 V)',tag:'SI',cat:CSEN,w:130,h:130,
 term:[['+V',-65,-30,-1,0],['0V',-65,0,-1,0],['HI',65,-20,1,0],['LO',65,20,1,0],['PUL',0,65,0,1]],
 pins:{'+V':'10…30 V DC','0V':'0 V',HI:'PNP alarm: speed above HI',LO:'PNP alarm: speed below LO',PUL:'PNP pulse train (marks × rev/s)'},
 draw:drawTacho,links:c=>{if(!c._pw)return[];const a=[];if(c._hi)a.push(['+V','HI']);if(c._lo)a.push(['+V','LO']);if(Math.abs(num(c._rpm,0))>.5&&Math.sin(AN()*Math.max(1,num(c._rpm,0)/60*num(c.marks,1))*.35)>0)a.push(['+V','PUL']);return a;},
 init:{sens:'optical',tmode:'auto',rpmMan:0,reach:300,marks:1,gate:.5,filt:.3,range:6000,hi:3000,lo:100,loEn:false,hyst:20,unit:'rpm',_pw:false,_rpm:0,_raw:0,_g:0,_ph:0,_hi:false,_lo:false},
 blurb:'Digital tachometer. Counts marks (optical/magnetic) in a gate time, so resolution = 60 / (marks × gate) rpm — raise marks or the gate for finer readout. Reads the nearest rotating machine (motors, hydraulic motor, engine, turbo shaft) within the reach, or a manual input. HI/LO PNP alarms with hysteresis, pulse output, over-range flag.',
 desc:c=>`${f1(tachoVal(c),0)} ${c.unit||'rpm'} (true ${f1(c._true,0)} rpm)\nGate ${f1(c.gate,2)} s · resolution ±${f1(c._res,1)} rpm\nHI ${c._hi?'ALARM':'ok'} · LO ${c._lo?'ALARM':'ok'}`+(c._alm?'\n⚠ '+c._alm:'')});

/* ═══════════════ HMI PANEL ═══════════════ */
const TAGT=['plc','encctrl','tacho','cyldouble','cylsingle','hydmotor','spoolvalve','poppetvalve','turbocharger','engine4s'];
function primary(c){switch(c.type){case'plc':return['outputs',(c.out||[]).filter(Boolean).length,'/4'];case'encctrl':return['value',num(c._val,0),c.mode==='speed'?'rpm':c.mode==='counter'?'cnt':'mm'];case'tacho':return['speed',num(c._rpm,0),'rpm'];
  case'cyldouble':case'cylsingle':return['stroke',num(c.pos,0)/100*cylGeo(c).st,'mm'];case'hydmotor':return['speed',num(c._n,0),'rpm'];case'spoolvalve':return['Q',num(c._Q,0),'L/min'];case'poppetvalve':return['Q',num(c._Q,0),'L/min'];
  case'turbocharger':return['boost',num(c._boost,0),'bar'];case'engine4s':return['speed',num(c.rpm,0),'rpm'];}return['',0,''];}
function hmiTags(c){const r=num(c.reach,600),out=[];for(const m of comps){if(m===c||!TAGT.includes(m.type))continue;if(Math.hypot(m.x-c.x,m.y-c.y)<=r)out.push(m);}return out.sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y));}
function hmiTick(c,dt){
  c._pw=pw(c,'+V','0V');if(!c._pw)return;
  c._di1=sigHigh(c,'DI1');c._di2=sigHigh(c,'DI2');
  const mom=c.btnMode!=='latch';if(mom){c._q1=!!c.b1;c._q2=!!c.b2;}else{c._q1=!!c.b1;c._q2=!!c.b2;}
  c._tags=hmiTags(c);c._alms=[];for(const m of c._tags)if(m._alm)c._alms.push((m.label||m.type)+': '+m._alm);
  c._tt=num(c._tt,0)+dt;if(c._tt>=.25){c._tt=0;const tg=c._tags[num(c.trendSel,0)%Math.max(1,c._tags.length)];const v=tg?primary(tg)[1]:0;(c._tr||(c._tr=[])).push(v);if(c._tr.length>120)c._tr.shift();}
}
function drawHMI(c){const on=c._pw,pg=num(c.page,0)%3;body(c,200,160,on?COL.ok:COL.edge);
  rr(-86,-60,172,100,5);ctx.fillStyle=on?'#09182a':'#05080c';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#1e293b';ctx.stroke();
  if(!on){T(c,'NO 24 V SUPPLY',0,-8,'#334155',10,'center',800);}
  else{const tags=c._tags||[];
    rr(-86,-60,172,12,0);ctx.fillStyle='#1d4ed8';ctx.fill();T(c,['PROCESS OVERVIEW','TREND','ALARMS'][pg],-80,-53,'#fff',8,'left',800);T(c,'P'+(pg+1)+'/3',80,-53,'#cbd5e1',7,'right',800);
    if(pg===0){tags.slice(0,6).forEach((m,i)=>{const [n,v,u]=primary(m),y=-40+i*13;T(c,(m.label||m.type).slice(0,10),-80,y,'#93c5fd',8,'left',800);T(c,n,-20,y,'#64748b',7,'left',700);T(c,(Math.abs(v)<100?f1(v,1):f1(v,0))+' '+u,80,y,m._alm?'#f87171':'#4ade80',8,'right',800);});if(!tags.length)T(c,'no tags in range',0,-10,'#64748b',8,'center',700);}
    else if(pg===1){const tr=c._tr||[];const mx=Math.max(1e-6,...tr.map(Math.abs)),tg=tags[num(c.trendSel,0)%Math.max(1,tags.length)];
      ctx.strokeStyle='#1e3a5f';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-82,-44+i*20);ctx.lineTo(82,-44+i*20);ctx.stroke();}
      ctx.strokeStyle='#4ade80';ctx.lineWidth=1.6;ctx.beginPath();tr.forEach((v,i)=>{const x=-82+i*164/119,y=34-(v/mx)*70;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
      T(c,tg?(tg.label||tg.type)+' · '+primary(tg)[0]+' (max '+f1(mx,1)+')':'—',-80,-41,'#93c5fd',7,'left',800);}
    else{const a=c._alms||[];if(!a.length)T(c,'NO ACTIVE ALARMS',0,-10,'#4ade80',9,'center',800);else a.slice(0,6).forEach((s,i)=>{rr(-84,-45+i*13,168,11,2);ctx.fillStyle=Math.floor(AN()*2+i)%2?'#7f1d1d':'#450a0a';ctx.fill();T(c,s.slice(0,40),-80,-39+i*13,'#fecaca',7,'left',800);});}
  }
  /* soft keys + lamps */
  for(const [x,l,k] of [[-60,'F1','b1'],[-20,'F2','b2']]){rr(x-16,48,32,14,3);ctx.fillStyle=c[k]?'#22c55e':'#334155';ctx.fill();ctx.strokeStyle='#0b1622';ctx.stroke();T(c,l,x,56,c[k]?'#04230f':'#cbd5e1',8,'center',800);}
  rr(14,48,32,14,3);ctx.fillStyle='#334155';ctx.fill();T(c,'PAGE',30,56,'#cbd5e1',7,'center',800);
  led(66,55,c._di1?'#22c55e':'#334155',c._di1);led(82,55,c._di2?'#f59e0b':'#334155',c._di2);
  T(c,c.label,0,-92,COL.text,9,'center',800);T(c,'click: next page',0,92,COL.mut,7,'center',700);}
def('hmi',{name:'HMI Operator Panel (24 V)',tag:'HMI',cat:CPNL,w:200,h:190,
 term:[['+V',-100,-30,-1,0],['0V',-100,0,-1,0],['DI1',-100,30,-1,0],['DI2',-100,60,-1,0],['Q1',100,-30,1,0],['Q2',100,0,1,0]],
 pins:{'+V':'24 V DC','0V':'0 V',DI1:'status lamp input 1',DI2:'status lamp input 2',Q1:'soft-key F1 output (PNP 24 V)',Q2:'soft-key F2 output'},
 draw:drawHMI,links:c=>{if(!c._pw)return[];const a=[];if(c._q1)a.push(['+V','Q1']);if(c._q2)a.push(['+V','Q2']);return a;},
 click:c=>{c.page=(num(c.page,0)+1)%3;},
 init:{page:0,reach:600,btnMode:'momentary',trendSel:0,b1:false,b2:false,_pw:false,_q1:false,_q2:false,_tr:[]},
 blurb:'Operator touch-panel. Shows live tags of every PLC, encoder controller, tachometer, cylinder, hydraulic motor, valve, engine and turbocharger within its reach (page 1), a trend of the selected tag (page 2) and the alarm list (page 3). F1/F2 soft keys drive PNP outputs Q1/Q2 (momentary or latching) — wire them to PLC inputs; DI1/DI2 light the status lamps. Click the panel to change page.',
 desc:c=>`${c._pw?'ONLINE':'NO SUPPLY'} · page ${num(c.page,0)+1}/3\nTags in range ${(c._tags||[]).length} · alarms ${(c._alms||[]).length}\nF1 ${c._q1?'ON':'off'} · F2 ${c._q2?'ON':'off'}`});

/* ═══════════════ PLC (scan-cycle, programs) ═══════════════ */
const PROGS=[['auto','Legacy AUTO (O1 = I1·¬I2)'],['manual','Manual outputs (buttons)'],['startstop','Motor start/stop seal-in + overload'],['ton','On-delay timer (TON)'],['toff','Off-delay timer (TOF)'],['counter','Counter (CTU) with reset'],['flasher','Flasher / blinker'],['cylseq','Hydraulic cylinder sequencer'],['custom','Custom boolean logic']];
function plcExpr(src,env){
  /* tiny boolean parser: names I1-I4 O1-O4 M1-M4 T1 T2 C1, ops ! & | ^ ( ), 0/1 */
  const tk=src.replace(/\s+/g,'').match(/[A-Za-z]+\d*|[01]|[!&|^()]/g)||[];let i=0;
  const prim=()=>{const t=tk[i++];if(t==='!')return+!prim();if(t==='('){const v=or();i++;return v;}if(t==='0'||t==='1')return +t;return env[t.toUpperCase()]?1:0;};
  const and=()=>{let v=prim();while(tk[i]==='&'){i++;v=v&prim();}return v;};
  const xor=()=>{let v=and();while(tk[i]==='^'){i++;v=v^and();}return v;};
  const or=()=>{let v=xor();while(tk[i]==='|'){i++;v=v|xor();}return v;};
  return or();}
function plcScan(c,dt){
  const I=[0,1,2,3].map(k=>!!c.in[k]),O=c.out,M=c.mem||(c.mem=[0,0,0,0]),pt=num(c.pt,3);
  const edge=k=>{const e=I[k]&&!c._ip[k];return e;};
  const p=c.prog;c._st=c._st||0;
  const tm=(name,en,preset,off)=>{const k=name;if(off){if(en){c['_'+k]=preset;}else c['_'+k]=Math.max(0,num(c['_'+k],0)-dt);return c['_'+k]>0||en;}c['_'+k]=en?num(c['_'+k],0)+dt:0;return en&&c['_'+k]>=preset;};
  if(p==='startstop'){const ol=I[2]||c._olLatch;if(I[2])c._olLatch=true;if(I[3])c._olLatch=false;
    O[0]=(I[0]||O[0])&&!I[1]&&!c._olLatch;O[1]=!O[0]&&!c._olLatch;O[2]=false;O[3]=!!c._olLatch;}
  else if(p==='ton'){O[0]=tm('t1',I[0],pt,false);O[1]=I[0]&&!O[0];O[2]=false;O[3]=false;c._ET=Math.min(pt,num(c._t1,0));}
  else if(p==='toff'){O[0]=tm('t1',I[0],pt,true);O[1]=!O[0];O[2]=I[0];O[3]=false;c._ET=num(c._t1,0);}
  else if(p==='counter'){if(edge(0))c._cv=num(c._cv,0)+1;if(I[1])c._cv=0;const pv=Math.max(1,num(c.pv,10));O[0]=c._cv>=pv;O[1]=I[0];O[2]=false;O[3]=false;c._ET=c._cv;}
  else if(p==='flasher'){c._fl=num(c._fl,0)+dt;if(c._fl>=pt)c._fl-=pt;const en=I[0]||c.fAlways!==false;O[0]=en&&c._fl<pt/2;O[1]=en&&!O[0];O[2]=false;O[3]=false;}
  else if(p==='cylseq'){
    /* I1 start, I2 stop/reset, I3 limit EXTENDED, I4 limit RETRACTED. O1 extend (Y1), O2 retract (Y2), O3 pump enable, O4 fault */
    const S=c._st;c._sT=num(c._sT,0)+dt;
    if(I[1]){c._st=0;c._fault=false;c._sT=0;}
    else if(c._fault){}
    else if(S===0){if(edge(0)){c._cyc=0;if(I[3]){c._st=1;c._sT=0;}else{c._st=3;c._sT=0;}}}
    else if(S===1){if(I[2]){c._st=2;c._sT=0;}}
    else if(S===2){if(c._sT>=num(c.dwell,1)){c._st=3;c._sT=0;}}
    else if(S===3){if(I[3]){c._st=0;c._cyc=num(c._cyc,0)+1;c._sT=0;if(c.auto&&num(c._cyc,0)<num(c.pv,5))c._st=1;}}
    if(c._st!==0&&c._sT>num(c.tmo,15)&&c._st!==2){c._fault=true;c._st=0;}
    O[0]=c._st===1;O[1]=c._st===3;O[2]=c._st!==0;O[3]=!!c._fault;c._ET=c._st;}
  else if(p==='custom'){const env={I1:I[0],I2:I[1],I3:I[2],I4:I[3],O1:O[0],O2:O[1],O3:O[2],O4:O[3],M1:M[0],M2:M[1],M3:M[2],M4:M[3]};
    for(const line of String(c.src||'').split(/[;\n]/)){const m=line.match(/^\s*([OM][1-4])\s*=\s*(.+)$/i);if(!m)continue;const v=!!plcExpr(m[2],env);const n=m[1].toUpperCase();env[n]=v;if(n[0]==='O')O[+n[1]-1]=v;else M[+n[1]-1]=v?1:0;}}
  for(let k=0;k<4;k++){c._ip[k]=I[k];}
}
function plcTick(c,dt){
  c.in=c.in||[0,0,0,0];c.out=c.out||[0,0,0,0];c._ip=c._ip||[0,0,0,0];
  if(c.prog===undefined)c.prog=c.program==='manual'?'manual':'auto';
  const raw=[c.input1,c.input2,c.input3,c.input4].map(Boolean);
  for(let k=0;k<4;k++){const f=c['fi'+(k+1)];c.in[k]=f==='on'?true:f==='off'?false:raw[k];}
  c._pw=!!c._pwSolver;const run=c.run!==false&&c._pw&&!c._wd;
  c._scanAcc=num(c._scanAcc,0)+dt*1000;
  if(!c._pw){c.out=[0,0,0,0];c._diag='NO POWER';c._scanMs=0;for(let k=1;k<=4;k++)c['out'+k]=false;c.man3=c.man4=false;return;}
  if(!run){c.out=[0,0,0,0];c._diag=c.run===false?'STOP':'FAULT';}
  else{
    if(c.prog==='auto'||c.prog==='manual'){c._diag=c.prog==='auto'?'RUN · legacy':'RUN · manual';}
    else if(c._scanAcc>=num(c.scanTime,10)){const dts=c._scanAcc/1000;c._scanAcc=0;const t0=performance.now();try{plcScan(c,dts);c._diag='RUN · '+c.prog;}catch(e){c._diag='PROGRAM ERROR';}
      c._scanMs=num(c._scanMs,0)*.9+(performance.now()-t0)*.1;c.scans=num(c.scans,0)+1;
      if(num(c.scanTime,10)<2||c._scanMs>num(c.wdMs,200)){c._wd=true;}}
  }
  /* forces on outputs, publish to solver */
  if(c.run===false||c._wd){c.program='manual';c.man1=c.man2=false;c.out=[0,0,0,0];}
  else if(c.prog!=='auto'&&c.prog!=='manual'){c.program='manual';c.man1=!!c.out[0];c.man2=!!c.out[1];}
  else if(c.prog==='manual'){c.program='manual';c.out=[!!c.man1,!!c.man2,!!c.man3,!!c.man4];}
  else c.program='auto';
  for(let k=0;k<4;k++){const f=c['fo'+(k+1)];if(f==='on')c.out[k]=true;else if(f==='off')c.out[k]=false;}
  if(c.prog!=='auto'){c.man1=!!c.out[0];c.man2=!!c.out[1];}
  c.out3=!!c.out[2]&&run;c.out4=!!c.out[3]&&run;
}
const _ev=evalCircuit;
evalCircuit=function(){const r=_ev.apply(this,arguments);
  try{const st=r;for(const c of comps){if(c.type!=='plc')continue;const p=live(st,c,'L','N');c._pwSolver=p;
    for(const k of [3,4])c['input'+k]=p&&PHS.includes(ntype(st,c,'I'+k));
    if(c.input3!==c._l3||c.input4!==c._l4){c._l3=c.input3;c._l4=c.input4;}}}catch(e){}
  return r;};
{const L=LINKS.plc;LINKS.plc=c=>{const a=[...(L?L(c):[])];if(c._pwSolver&&c.run!==false){if(c.out3)a.push(['L','O3']);if(c.out4)a.push(['L','O4']);}if(c.run===false)return[];return a;};}
function drawPLC(c){const on=c._pwSolver,run=on&&c.run!==false&&!c._wd;
  body(c,170,230,c._wd?COL.bad:(run?COL.ok:COL.edge));
  rr(-52,-80,104,26,4);ctx.fillStyle='#0a1613';ctx.fill();ctx.strokeStyle='#050a0c';ctx.stroke();
  T(c,on?(c._diag||'').slice(0,22):'NO POWER',0,-70,on?'#3df5b0':'#2c4a40',8,'center',800);
  T(c,on?`scan ${f1(c._scanMs,2)} ms · #${num(c.scans,0)}`:'',0,-59,'#7fb8a3',7,'center',700);
  /* status LEDs */
  led(-40,-44,on?'#22c55e':'#334155',on);T(c,'PWR',-30,-43,COL.mut,6,'left',800);
  led(-8,-44,run?'#22c55e':'#334155',run);T(c,'RUN',2,-43,COL.mut,6,'left',800);
  led(26,-44,c._wd?'#ef4444':'#334155',!!c._wd);T(c,'ERR',36,-43,COL.mut,6,'left',800);
  /* I/O */
  for(let k=0;k<4;k++){const y=-40+k*20,on_=c.in&&c.in[k],f=c['fi'+(k+1)]&&c['fi'+(k+1)]!=='auto';rr(28,y-6,50,14,3);ctx.fillStyle='#0a1613';ctx.fill();led(36,y+1,on_?'#22c55e':'#334155',!!on_);T(c,'I'+(k+1)+(f?' F':''),46,y+2,f?'#f59e0b':COL.mut,8,'left',800);}
  for(let k=0;k<4;k++){const y=40+k*20,on_=c.out&&c.out[k]&&on,f=c['fo'+(k+1)]&&c['fo'+(k+1)]!=='auto';rr(28,y-6,50,14,3);ctx.fillStyle='#0a1613';ctx.fill();led(36,y+1,on_?'#f59e0b':'#334155',!!on_);T(c,'O'+(k+1)+(f?' F':''),46,y+2,f?'#f59e0b':COL.mut,8,'left',800);}
  T(c,'PLC',-30,-10,COL.text,14,'center',800);T(c,(PROGS.find(p=>p[0]===c.prog)||['','Legacy'])[1].slice(0,16),-30,12,COL.mut,6,'center',700);
  T(c,c.label,0,-123,COL.text,9,'center',800);}
{const d=DEFS.plc;d.name='PLC (4 DI / 4 DO, scan-cycle)';d.w=170;d.h=230;
 d.term=[['L',-85,-30,-1,0],['N',-85,0,-1,0],['I1',85,-40,1,0],['I2',85,-20,1,0],['I3',85,0,1,0],['I4',85,20,1,0],['O1',85,40,1,0],['O2',85,60,1,0],['O3',85,80,1,0],['O4',85,100,1,0]];
 Object.assign(d.init,{prog:'auto',run:true,scanTime:10,pt:3,pv:10,dwell:1,tmo:15,auto:true,src:'O1 = (I1 | O1) & !I2',fi1:'auto',fi2:'auto',fi3:'auto',fi4:'auto',fo1:'auto',fo2:'auto',fo3:'auto',fo4:'auto',input3:false,input4:false,out3:false,out4:false,_pwSolver:false,wdMs:200});
 DRAW.plc=safe('plc',drawPLC);COMP_BLURB.plc='Scan-cycle PLC: 24 V (or mains) supply on L/N, 4 digital inputs, 4 digital outputs (O1–O4 switch L). Select a program: seal-in motor starter with overload latch, TON/TOF timers, up-counter, flasher, a hydraulic cylinder sequencer (extend → dwell → retract, limit-switch driven, step time-out fault) or custom boolean logic (O1 = (I1 | O1) & !I2). Force inputs/outputs, RUN/STOP, scan time and watchdog. Outputs update on the next scan, as on a real PLC.';}

/* ═══════════════ TURBOCHARGER (compressor map model) ═══════════════ */
const FRAMES={small:{n:'Small (GT15 class)',nMax:220000,D:41,mdot:.07},medium:{n:'Medium (GT28 class)',nMax:180000,D:52,mdot:.15},large:{n:'Large (GT35 class)',nMax:140000,D:68,mdot:.30},diesel:{n:'Heavy-duty diesel (TV class)',nMax:95000,D:92,mdot:.65}};
function turboTick(t,dt){
  const F=FRAMES[t.frame]||FRAMES.medium,nMax=num(t.nMaxOv,0)||F.nMax,boost=Math.max(0,num(t._boost,0)),P0=1.013,PR=(P0+boost)/P0;
  const k=.2857,x=Math.pow(PR,k)-1,xMax=Math.pow(3.2,k)-1;
  const idle=(num(t._boost,0)>.005||t._act)?.07:0;
  const tgt=nMax*clamp(idle+Math.sqrt(x/xMax)*(1-idle),0,1.08);
  lag(t,'_shaftRpm',tgt,dt,.08);if(t._shaftRpm<100)t._shaftRpm=0;
  const n=num(t._shaftRpm,0),nr=n/nMax,flow=F.mdot*clamp(nr*nr*1.05,0,1.2)*Math.max(.15,boost>0?1:.4);   /* kg/s */
  t._flow=flow;t._PR=PR;t._tip=PI*F.D/1000*n/60;                          /* m/s */
  /* compressor efficiency: peak island ~0.75, falls toward surge (low flow) and choke (high flow) */
  const fN=flow/F.mdot,ec=clamp(.76-1.1*Math.pow(fN-.62,2)-.012*Math.pow(Math.max(0,PR-2.2),2)*10,.3,.78);
  t._etaC=n>1000?ec:0;
  const T1=273.15+num(t.amb,25);t._T2=n>1000?T1*(1+x/Math.max(.3,ec))-273.15:num(t.amb,25);
  t._egt=n>1000?clamp(480+380*nr+70*Math.max(0,PR-1.2),0,1000):num(t.amb,25);
  lag(t,'_egtS',t._egt,dt,3);
  const gMax=num(t.maxBoost,1)*clamp(num(t.health,1),.2,1);
  t._wg=boost>0?clamp((boost/Math.max(.05,gMax)-.9)/.1,0,1):0;
  /* surge: sharp boost collapse (throttle lift) without a blow-off valve */
  const db=(boost-num(t._bPrev,0))/Math.max(dt,.001);t._bPrev=boost;
  if(db<-.9&&boost>.25){if(t.bov!==false){t._bovT=.6;}else{t._surgeT=1.5;t.health=Math.max(.2,num(t.health,1)-.004);}}
  t._bovT=Math.max(0,num(t._bovT,0)-dt);t._surgeT=Math.max(0,num(t._surgeT,0)-dt);
  const lim=1+(PR-1)/Math.max(.01,2.2*Math.max(.15,fN));t._surge=clamp(100*(1-(PR-1)/(2.6*Math.max(.1,fN+.25)+.5)),-50,100);   /* surge margin % */
  t._alm='';if(t._surgeT>0)t._alm='COMPRESSOR SURGE';else if(n>nMax*.98)t._alm='OVERSPEED '+f1(n/1000,0)+' krpm';else if(t._T2>200)t._alm='COMPRESSOR OUTLET '+f1(t._T2,0)+' °C — fit intercooler';else if(t._egt>950)t._alm='EGT '+f1(t._egt,0)+' °C';
  t._ang=num(t._ang,0)+Math.min(n,36000)/60*TAU*dt*.02+n/60*dt*.0;
}
function drawTurbo(t){
  const n=num(t._shaftRpm,0),nr=n/(num(t.nMaxOv,0)||(FRAMES[t.frame]||FRAMES.medium).nMax),hot=clamp((num(t._egtS,25)-200)/700,0,1);
  body(t,170,130,t._alm?COL.bad:(n>1000?COL.ok:COL.edge));
  /* centre housing / bearings */
  metal(-14,-14,28,28,'#6b7785',4);
  for(const x of [-8,8]){line([[x,-14],[x,-24]],'#d97706',2);}
  ctx.fillStyle='#d97706';rr(-6,-28,12,5,2);ctx.fill();T(t,'OIL',0,-33,'#d97706',6,'center',800);
  line([[0,14],[0,24]],'#92400e',3);
  /* compressor housing (cold side, left) */
  const cx=-44,tx=44;
  ctx.beginPath();ctx.arc(cx,0,32,0,TAU);ctx.fillStyle=GR(cx-30,-30,cx+30,30,[[0,'#cbd5e1'],[1,'#64748b']]);ctx.fill();ctx.strokeStyle='#0b1622';ctx.lineWidth=1.5;ctx.stroke();
  /* volute scroll toward top outlet */
  ctx.beginPath();ctx.arc(cx,0,24,0,TAU);ctx.fillStyle='#0b1622';ctx.fill();
  if(n>1000){ctx.fillStyle='rgba(96,165,250,'+(.18+.3*clamp(num(t._PR,1)/3,0,1))+')';ctx.beginPath();ctx.arc(cx,0,24,0,TAU);ctx.fill();}
  /* wheel */
  ctx.save();ctx.translate(cx,0);ctx.rotate(num(t._ang,0));ctx.strokeStyle='#e2e8f0';ctx.lineWidth=2;for(let i=0;i<10;i++){ctx.rotate(TAU/10);ctx.beginPath();ctx.moveTo(3,0);ctx.quadraticCurveTo(10,-5,19,-9);ctx.stroke();}ctx.fillStyle='#94a3b8';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();ctx.restore();
  /* inlet + outlet pipes */
  metal(-76,-8,26,16,'#94a3b8',3);metal(-50,-52,20,28,'#94a3b8',3);
  /* turbine housing (hot side, right) */
  ctx.beginPath();ctx.arc(tx,0,32,0,TAU);ctx.fillStyle=GR(tx-30,-30,tx+30,30,[[0,mixc('#6b7280','#ff7a2e',hot)],[1,mixc('#374151','#b91c1c',hot)]]);ctx.fill();ctx.stroke();
  if(hot>.05)glow(tx,0,44,rgba2('#ff7a2e',.15+.35*hot));
  ctx.beginPath();ctx.arc(tx,0,22,0,TAU);ctx.fillStyle='#0b1622';ctx.fill();
  ctx.save();ctx.translate(tx,0);ctx.rotate(num(t._ang,0));ctx.strokeStyle=mixc('#9ca3af','#fbbf24',hot);ctx.lineWidth=2.4;for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.beginPath();ctx.moveTo(3,0);ctx.lineTo(15,-4);ctx.stroke();}ctx.restore();
  metal(40,32,20,22,'#6b7280',3);metal(50,-8,26,16,'#6b7280',3);
  /* shaft */
  line([[cx+4,0],[tx-4,0]],'#e2e8f0',3);
  /* wastegate canister + rod */
  rr(52,-52,24,12,5);ctx.fillStyle='#475569';ctx.fill();ctx.strokeStyle='#0b1622';ctx.stroke();
  line([[64,-40],[64,-40+ (6+10*num(t._wg,0))],[56,-22]],'#cbd5e1',1.6);
  if(num(t._wg,0)>.05){ctx.strokeStyle='rgba(251,146,60,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(60,-18);ctx.lineTo(70,-8);ctx.stroke();}
  T(t,'WG '+f1(num(t._wg,0)*100,0)+'%',64,-58,COL.mut,6,'center',800);
  if(num(t._bovT,0)>0){for(let i=0;i<5;i++){ctx.fillStyle='rgba(226,232,240,'+(.5-i*.09)+')';ctx.beginPath();ctx.arc(-26-i*7,-60-i*5,3+i,0,TAU);ctx.fill();}T(t,'BOV',-26,-70,'#e2e8f0',7,'center',800);}
  if(num(t._surgeT,0)>0&&Math.floor(AN()*8)%2)T(t,'SURGE!',0,-70,COL.bad,9,'center',800);
  /* flow arrows */
  if(n>1000){arrow(-88,0,-78,0,'#60a5fa',1.6);arrow(-40,-52,-40,-62,'#60a5fa',1.6);arrow(40,62,40,54,'#fb923c',1.6);arrow(72,0,84,0,'#fb923c',1.6);}
  T(t,t.label,0,-84,COL.text,9,'center',800);
  T(t,`${f1(num(t._boost,0),2)} bar boost · PR ${f1(t._PR,2)} · ${f1(n/1000,0)} krpm`,0,68,n>1000?COL.ok:COL.mut,8,'center',800);
  T(t,`T2 ${f1(t._T2,0)} °C · EGT ${f1(t._egtS,0)} °C · ηc ${f1(num(t._etaC,0)*100,0)} %`,0,80,COL.warn,8,'center',800);
  T(t,`tip ${f1(t._tip,0)} m/s · surge margin ${f1(t._surge,0)} %`,0,92,num(t._surge,100)<15?COL.bad:COL.mut,8,'center',800);
  if(t._alm)T(t,'⚠ '+t._alm,0,104,COL.bad,7,'center',800);}
const rgba2=(h,a)=>`rgba(${[1,3,5].map(i=>parseInt(h.substr(i,2),16)).join(',')},${a})`;
{const d=DEFS.turbocharger;if(d){d.w=170;d.h=130;d.term=[['AIR_IN',-85,0,-1,0,'h'],['AIR_OUT',-40,-62,0,-1,'h'],['EXHAUST_IN',40,62,0,1,'h'],['EXHAUST_OUT',85,0,1,0,'h']];
 Object.assign(d.init,{frame:'medium',bov:true,amb:25,_shaftRpm:0,_PR:1,_T2:25,_egt:25,_egtS:25,_wg:0,_etaC:0,_ang:0,_surge:100,_bPrev:0});
 DRAW.turbocharger=safe('turbo',drawTurbo);
 COMP_BLURB.turbocharger='Exhaust-driven turbocharger with a compressor-map model: shaft speed from pressure ratio (PR = (1.013 + boost)/1.013, n ∝ √(PR^0.2857 − 1)), compressor efficiency island and outlet temperature T2 = T1·(1 + (PR^0.2857 − 1)/ηc), tip speed, EGT, wastegate opening near the boost limit, blow-off valve venting and compressor surge on a throttle-lift boost collapse (no BOV). Pick a frame size (small / medium / large / diesel); lag comes from the engine model.';
 d.desc=t=>`Boost ${f1(t._boost,2)} bar · PR ${f1(t._PR,2)}\nShaft ${f1(num(t._shaftRpm,0)/1000,0)} krpm · tip ${f1(t._tip,0)} m/s\nCompressor ηc ${f1(num(t._etaC,0)*100,0)} % · T2 ${f1(t._T2,0)} °C\nEGT ${f1(t._egtS,0)} °C · wastegate ${f1(num(t._wg,0)*100,0)} %\nSurge margin ${f1(t._surge,0)} %`+(t._alm?'\n⚠ '+t._alm:'');
 d.blurb=COMP_BLURB.turbocharger;}}

/* ═══════════════ SYSTEM TICK ═══════════════ */
Game.register('hydlab',{
 tick(dt,gx){dt=Math.max(0,dt);if(!sim.st)return;
  for(const c of comps){
    try{switch(c.type){
      case'spoolvalve':spoolTick(c,dt);break;
      case'poppetvalve':poppetTick(c,dt);break;
      case'cylsingle':case'cyldouble':c._pwS=pw(c,'+V','0V');cylSens(c);break;
      case'encctrl':encTick(c,dt);break;
      case'tacho':tachoTick(c,dt);break;
      case'hmi':hmiTick(c,dt);break;
      case'plc':plcTick(c,dt);break;
      case'turbocharger':turboTick(c,dt);break;
    }}catch(e){if(!ERR['t'+c.type]){ERR['t'+c.type]=1;console.warn('tick',c.type,e);}}
  }},
 reset(){for(const c of comps){
   if(c.type==='cylsingle'||c.type==='cyldouble'){c.pos=0;c._dir=0;c._v=0;c._p=0;c._F=0;c._Q=0;}
   if(c.type==='hydmotor'){c._rpm=0;c._n=0;c._T=0;c._Q=0;}
   if(c.type==='spoolvalve'){c.pos=2;c._tm=0;c._sx=0;}
   if(c.type==='encctrl'){c._off=0;c._raw=0;c._rpm=0;}
   if(c.type==='tacho'){c._rpm=0;c._raw=0;c._g=0;c._ph=0;}
   if(c.type==='hmi'){c._tr=[];c.b1=c.b2=false;}
   if(c.type==='plc'){c._st=0;c._fault=false;c._wd=false;c._cv=0;c._olLatch=false;c.scans=0;c.out=[0,0,0,0];c.mem=[0,0,0,0];c._t1=0;c._cyc=0;}
   if(c.type==='turbocharger'){c._shaftRpm=0;c._PR=1;c._wg=0;c._surgeT=0;c._bovT=0;}}}});

/* ═══════════════ PROPERTIES / ACTIONS / DESCRIBE / CLICK ═══════════════ */
const sel=(k,v,o)=>sI(k,String(v),o.map(x=>Array.isArray(x)?[String(x[0]),x[1]]:[String(x),String(x)]));
const btn=(l,fn)=>`<button data-act="h21" data-fn="${fn}">${l}</button>`;
const note=s=>`<div class="note">${s}</div>`;
const cylP=c=>{const g=cylGeo(c),dbl=c.type==='cyldouble';
  return fld('Bore Ø (mm, ISO 6020)',sel('bore',num(c.bore,50),BORES))+fld('Rod Ø (mm, ISO 3320)',sel('rod',num(c.rod,28),[...new Set(Object.values(RODS))].sort((a,b)=>a-b)))+fld('Stroke (mm)',nI('strokeMm',num(c.strokeMm,300),10,2000,10))
  +fld('System / relief pressure (bar)',nI('pSys',num(c.pSys,160),20,350,5))+fld('Load mass (kg)',nI('loadKg',num(c.loadKg,200),0,50000,10))+fld('Orientation',sel('orient',c.orient||'horizontal',[['horizontal','Horizontal (μ = 0.12)'],['vert-up','Vertical — lifting'],['vert-down','Vertical — lowering']]))
  +fld('Extra process force (kN)',nI('extraKN',num(c.extraKN,0),-500,500,.5))+fld('Mechanical efficiency ηm',nI('etaM',num(c.etaM,.92),.5,1,.01))+fld('Max rod speed (mm/s)',nI('vMax',num(c.vMax,500),10,2000,10))
  +fld('End cushioning',cI('cushion',c.cushion!==false))+fld('Reed position sensors',cI('sensors',c.sensors!==false))+fld('Direction control',sel('ctrl',c.ctrl||'auto',[['auto','Auto (follows pressurised port)'],['manual','Manual (click)']]))
  +(!dbl?fld('Return spring force (N)',nI('springN',num(c.springN,400),0,5000,50))+fld('Spring return speed (mm/s)',nI('retMms',num(c.retMms,120),10,500,10)):'')
  +note(`A<sub>cap</sub> ${f1(g.A1/100,1)} cm² · A<sub>ann</sub> ${f1(g.A2/100,1)} cm² · F<sub>max</sub> ${f1(num(c.pSys,160)*g.A1/10*num(c.etaM,.92)/1000,1)} kN @ ${num(c.pSys,160)} bar<br>Std rod for Ø${g.bore}: ${RODS[g.bore]||'—'} mm · Euler limit ${f1(num(c._Fcr,0)/1000,1)} kN`);};
const P21={
 cylsingle:cylP,cyldouble:cylP,
 spoolvalve:c=>fld('Size (ISO 4401)',sel('size',num(c.size,10),[[6,'NG6 · 80 L/min'],[10,'NG10 · 160 L/min'],[16,'NG16 · 300 L/min'],[25,'NG25 · 650 L/min']]))+fld('Centre position',sel('centre',c.centre||'closed',CENTRES))+fld('Actuation',sel('act',c.act||'solenoid',[['solenoid','24 V solenoids Y1/Y2'],['manual','Manual lever (click)']]))+fld('Solenoid shift time (ms)',nI('tShift',num(c.tShift,40),10,300,5))+fld('System pressure (bar)',nI('pSys',num(c.pSys,160),20,350,5))+`<div class="row">${btn('Y1 → extend','spY1')}${btn('Centre','spC')}${btn('Y2 → retract','spY2')}</div>`+note('Manual lever: pick a position above (sets Actuation = manual).'),
 poppetvalve:c=>fld('Type',sel('vtype',c.vtype||'check',[['check','Spring check valve'],['sol-nc','2/2 solenoid, normally closed'],['sol-no','2/2 solenoid, normally open']]))+fld('Cracking pressure (bar)',sel('crack',num(c.crack,1),[.5,1,3,5]))+fld('Nominal flow (L/min)',nI('qNom',num(c.qNom,60),5,600,5))+fld('ΔP at nominal flow (bar)',nI('dpNom',num(c.dpNom,2),.2,10,.1)),
 hydmotor:c=>fld('Displacement Vg (cm³/rev)',sel('vg',num(c.vg,16),VG))+fld('Volumetric efficiency ηv',nI('etaV',num(c.etaV,.92),.5,1,.01))+fld('Hydro-mech. efficiency ηhm',nI('etaHM',num(c.etaHM,.88),.4,1,.01))+fld('Relief pressure (bar)',nI('pSys',num(c.pSys,160),20,350,5))+fld('Max Δp rating (bar)',nI('dpMax',num(c.dpMax,210),50,350,5))+fld('Max speed (rpm)',nI('nMax',num(c.nMax,3000),500,6000,100))+fld('Load torque (N·m)',nI('loadNm',num(c.loadNm,10),0,500,.5))+fld('Seal friction (N·m)',nI('fricNm',num(c.fricNm,.3),0,10,.1))+fld('Rotor inertia (kg·m²)',nI('inertia',num(c.inertia,.02),.001,5,.005))+fld('Supply connected',cI('on',c.on!==false))+note(`Rated torque ≈ ${f1(num(c.dpMax,210)*num(c.vg,16)*num(c.etaHM,.88)/(20*PI),0)} N·m at ${num(c.dpMax,210)} bar · speed at 24 L/min ≈ ${f1(24*num(c.etaV,.92)/num(c.vg,16)*1000,0)} rpm`),
 encctrl:c=>fld('Mode',sel('mode',c.mode||'position',[['position','Position (mm)'],['speed','Speed (rpm)'],['counter','Counter']]))+fld('Quadrature decoding',sel('mult',num(c.mult,4),[[1,'×1'],[2,'×2'],[4,'×4']]))+fld('Lead / circumference (mm per rev)',nI('lead',num(c.lead,10),.1,1000,.1))+fld('Gear ratio (motor : load)',nI('ratio',num(c.ratio,1),.01,100,.01))+fld('Speed filter τ (s)',nI('filt',num(c.filt,.2),.02,5,.02))+fld('Setpoint SP1',nI('sp1',num(c.sp1,100),-1e6,1e6,1))+fld('Overspeed (rpm)',nI('ovr',num(c.ovr,3000),10,20000,10))+fld('Max input frequency (Hz)',nI('maxHz',num(c.maxHz,100000),1000,1e6,1000))+`<div class="row">${btn('Zero / preset','encZero')}</div>`,
 tacho:c=>fld('Sensor',sel('sens',c.sens||'optical',Object.entries(TSENS)))+fld('Source',sel('tmode',c.tmode||'auto',[['auto','Nearest rotating machine'],['manual','Manual speed']]))+fld('Manual speed (rpm)',nI('rpmMan',num(c.rpmMan,0),-30000,30000,10))+fld('Auto reach (px)',nI('reach',num(c.reach,300),30,600,10))+fld('Marks / teeth per rev',nI('marks',num(c.marks,1),1,200,1))+fld('Gate time (s)',nI('gate',num(c.gate,.5),.05,10,.05))+fld('Display filter τ (s)',nI('filt',num(c.filt,.3),.02,5,.02))+fld('Full scale (rpm)',nI('range',num(c.range,6000),100,60000,100))+fld('High alarm (rpm)',nI('hi',num(c.hi,3000),0,60000,50))+fld('Low alarm (rpm)',nI('lo',num(c.lo,100),0,60000,10))+fld('Low alarm enabled',cI('loEn',!!c.loEn))+fld('Hysteresis (rpm)',nI('hyst',num(c.hyst,20),0,500,5))+fld('Units',sel('unit',c.unit||'rpm',['rpm','rad/s','Hz']))+note(`Resolution ±${f1(num(c._res,60/(num(c.marks,1)*num(c.gate,.5))),1)} rpm = 60 / (marks × gate)`),
 hmi:c=>fld('Page',sel('page',num(c.page,0),[[0,'Process overview'],[1,'Trend'],[2,'Alarms']]))+fld('Tag reach (px)',nI('reach',num(c.reach,600),100,1500,50))+fld('Trend tag #',nI('trendSel',num(c.trendSel,0),0,20,1))+fld('Soft-key mode',sel('btnMode',c.btnMode||'momentary',[['momentary','Momentary'],['latch','Latching']]))+`<div class="row">${btn('F1','hmiF1')}${btn('F2','hmiF2')}${btn('Next page','hmiPg')}</div>`,
 plc:c=>fld('Program',sel('prog',c.prog||'auto',PROGS))+fld('RUN mode',cI('run',c.run!==false))+fld('Scan time (ms)',nI('scanTime',num(c.scanTime,10),1,200,1))+fld('Timer preset PT (s) / flash period',nI('pt',num(c.pt,3),.1,600,.1))+fld('Counter preset PV / cycles',nI('pv',num(c.pv,10),1,9999,1))+fld('Sequencer dwell (s)',nI('dwell',num(c.dwell,1),0,60,.1))+fld('Sequencer step time-out (s)',nI('tmo',num(c.tmo,15),1,300,1))+fld('Sequencer auto-cycle',cI('auto',c.auto!==false))
  +fld('Custom logic (O1 = (I1 | O1) & !I2; M1…M4 memory)',`<input type="text" data-k="src" data-t="t" value="${String(c.src||'').replace(/"/g,'&quot;')}">`)
  +[1,2,3,4].map(k=>fld('Force I'+k,sel('fi'+k,c['fi'+k]||'auto',['auto','on','off']))).join('')+[1,2,3,4].map(k=>fld('Force O'+k,sel('fo'+k,c['fo'+k]||'auto',['auto','on','off']))).join('')
  +`<div class="row">${btn('O3 (manual)','plcO3')}${btn('O4 (manual)','plcO4')}${btn('Clear faults / reset','plcRst')}</div>`+note(`Status: ${c._diag||'—'} · scans ${num(c.scans,0)} · cycle ${f1(c._scanMs,2)} ms<br>I/O: I1 L/N-referenced phase inputs; O1–O4 switch the L supply. Programs: ${PROGS.map(p=>p[0]).join(', ')}.<br>cylseq: I1 start · I2 stop · I3 extended LS · I4 retracted LS → O1 Y1 · O2 Y2 · O3 pump · O4 fault.`),
 turbocharger:c=>fld('Frame size',sel('frame',c.frame||'medium',Object.entries(FRAMES).map(([k,v])=>[k,v.n])))+fld('Blow-off valve (BOV)',cI('bov',c.bov!==false))+fld('Intake air temp (°C)',nI('amb',num(c.amb,25),-30,60,1))+note(`Max shaft speed ${f1((FRAMES[c.frame]||FRAMES.medium).nMax/1000,0)} krpm · wheel Ø${(FRAMES[c.frame]||FRAMES.medium).D} mm · rated flow ${(FRAMES[c.frame]||FRAMES.medium).mdot} kg/s`)
};
const ACT21={
 spY1:c=>{c.act='manual';c.pos=0;},spY2:c=>{c.act='manual';c.pos=1;},spC:c=>{c.act='manual';c.pos=2;},
 encZero:c=>{c._cmdZero=true;},
 hmiF1:c=>{c.b1=!c.b1;if(c.btnMode!=='latch')setTimeout(()=>{c.b1=false;},500);},hmiF2:c=>{c.b2=!c.b2;if(c.btnMode!=='latch')setTimeout(()=>{c.b2=false;},500);},hmiPg:c=>{c.page=(num(c.page,0)+1)%3;},
 plcO3:c=>{c.prog='manual';c.man3=!c.man3;},plcO4:c=>{c.prog='manual';c.man4=!c.man4;},plcRst:c=>{c._wd=false;c._fault=false;c._olLatch=false;c._st=0;c._cv=0;c._cyc=0;c.scans=0;c.run=true;}
};
const _rp=renderProps;
renderProps=function(){_rp();const c=selected&&selected.kind==='c'?getC(selected.id):null;if(!c)return;const f=P21[c.type];if(!f)return;
  const d=DEFS[c.type];let pins='';if(!MINE_UI.has(c.type)){pins=Object.entries(d.pins||{}).map(([k,v])=>`<b>${esc(k)}</b> ${esc(v)}`).join(' · ');}
  $('props').insertAdjacentHTML('beforeend',f(c)+(pins?`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">PINOUT</div><div class="note">${pins}</div>`:''));};
const MINE_UI=new Set(['cylsingle','cyldouble','spoolvalve','poppetvalve','hydmotor','turbocharger']);
$('props').addEventListener('click',e=>{if(!e.target.dataset||e.target.dataset.act!=='h21')return;const o=selObj(),f=ACT21[e.target.dataset.fn];if(!o||!f)return;pushUndo();f(o);renderProps();});
$('props').addEventListener('change',()=>{setTimeout(()=>{try{const c=selected&&selected.kind==='c'?getC(selected.id):null;if(c&&(c.type==='cylsingle'||c.type==='cyldouble')&&RODS[num(c.bore,50)]&&!c._rodTouched){}}catch(e){}},0);});
const _de=describe;
describe=function(c){if(['encctrl','tacho','hmi'].includes(c.type)){try{return DEFS[c.type].desc(c);}catch(e){return'';}}
  if(c.type==='plc'&&c.prog&&c.prog!=='auto'){return`${c._diag||'—'}\nProgram: ${c.prog}\nI: ${(c.in||[]).map(x=>+!!x).join('')} · O: ${(c.out||[]).map(x=>+!!x).join('')}\nScans ${num(c.scans,0)} · ${f1(c._scanMs,2)} ms`+(c._ET!=null?`\nET/CV/step: ${f1(c._ET,1)}`:'');}
  return _de(c);};
const _ck=clickAction;
clickAction=function(c){if(c.type==='encctrl'||c.type==='hmi'){pushUndo();DEFS[c.type].click(c);log(`${c.label}: ${c.type==='hmi'?'page '+(num(c.page,0)+1):'zeroed'}`);renderProps();return;}return _ck(c);};

/* ═══════════════ ICONS + PALETTE ═══════════════ */
const ICO21={encctrl:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 14h2M11 14h2M15 14h2"/><path d="M6 10h5"/>',tacho:'<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M7 8l1 1M12 5v1.5M17 8l-1 1"/>',hmi:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M6 14l3-3 3 2 4-4M8 21h8"/>'};
for(const k in ICO21)ICON[k]=SV(ICO21[k]);
(function(){const groups=$('componentGroups');if(!groups)return;
 const add=(k,cat,col)=>{if(groups.querySelector('.item[data-type="'+k+'"]'))return;let sec=[...groups.querySelectorAll('.palette-group')].find(s=>s.dataset.category===cat);
  if(!sec){sec=document.createElement('section');sec.className='palette-group';sec.dataset.category=cat;sec.innerHTML=`<div class="cat" style="--a:${col}">${cat}</div><div class="grid2"></div>`;groups.appendChild(sec);}
  const g=sec.querySelector('.grid2'),d=DEFS[k],el=document.createElement('div');el.className='item';el.draggable=true;el.dataset.type=k;el.style.setProperty('--a',col);el.title='Drag to board or click to add';
  el.innerHTML=`<div class="ic">${ICON[k]||d.icon}</div><div class="nm">${d.name}</div>`;
  el.addEventListener('dragstart',ev=>ev.dataTransfer.setData('text/plain',k));el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(k,p.x+n,p.y+n);});g.appendChild(el);
  const cnt=sec.querySelector('.cat .cnt');if(cnt)cnt.textContent=g.querySelectorAll('.item').length;};
 add('encctrl',CSEN,'#22d3ee');add('tacho',CSEN,'#22d3ee');add('hmi',CPNL,'#fbbf24');
 const s=$('componentSearch');if(s)s.dispatchEvent(new Event('input'));})();

/* saved circuits were loaded before these types existed — reload so they are not dropped */
try{const s=localStorage.getItem('circuitLab.v1');if(s){const o=JSON.parse(s);if(o.comps&&o.comps.length>comps.length){loadObj(o);fit();}}}catch(e){}
log('v16 module ready — hydraulic valves/cylinders/gear motor with ISO parameters, encoder controller, HMI, scan-cycle PLC, tachometer, map-based turbocharger.');
})();
