
/* ══════════ v15 · INDUSTRIAL I/O · MOTION · SWITCHGEAR · POWER QUALITY MODULE ══════════
 * Thermocouple/RTD + controller, industrial relays (standard pinouts), solenoid valves,
 * 24 V pilot lights, push buttons, limit switches, terminal blocks, 24 V PSU, NPN/PNP/inductive/
 * capacitive/photoelectric sensors + target, encoder, servo & stepper (motor + drive), ACB, VCB,
 * harmonic filter, steam/water dryer, UPS. Educational model only. */
(function(){
'use strict';
const num=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
/* host step() references a global num() that only exists inside another IIFE (breaks 3-phase-only circuits); publish it */
if(typeof window.num!=='function')window.num=num;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2,SQ3=Math.sqrt(3),PXMM=5,TCOMP=60;
const PHs=new Set(['L','L2','L3']);
const MY=new Set(),ST={t:0,held:null},ERR={};
const AN=()=>window.ANIM||0,DT=()=>window.dt||.016;
const liveT=(x,y)=>{if(!x||!y)return false;const px=PHs.has(x),py=PHs.has(y);return (px&&y==='N')||(py&&x==='N')||(px&&py&&x!==y);};
const lag=(o,k,t,dt,tau)=>{const v=num(o[k],0);o[k]=v+(t-v)*Math.min(1,dt/Math.max(.001,tau));};
const mixc=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const rgba=(h,a)=>`rgba(${[1,3,5].map(i=>parseInt(h.substr(i,2),16)).join(',')},${a})`;
const C_REL='Relays (Industrial)',C_SOL='Solenoid Valves',C_PNL='Control Panel Devices',C_TB='Terminal Blocks',C_SEN='Sensors & Encoders',C_MOT='Motion Control',C_SW='Switchgear (ACB / VCB)',C_PQ='Power Quality & UPS',C_PRC='Process Conditioning';

/* ───────── drawing primitives ───────── */
const tubeH=(x,y,w,h,b,r)=>{const R=r==null?Math.min(h/2,6):r;shadow(()=>{rr(x,y,w,h,R);ctx.fillStyle=GR(0,y,0,y+h,[[0,mixc(b,'#ffffff',.7)],[.25,mixc(b,'#ffffff',.25)],[.6,b],[1,mixc(b,'#000000',.65)]]);ctx.fill();});rr(x,y,w,h,R);ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.stroke();};
const tubeV=(x,y,w,h,b,r)=>{const R=r==null?Math.min(w/2,6):r;shadow(()=>{rr(x,y,w,h,R);ctx.fillStyle=GR(x,0,x+w,0,[[0,mixc(b,'#ffffff',.7)],[.25,mixc(b,'#ffffff',.25)],[.6,b],[1,mixc(b,'#000000',.65)]]);ctx.fill();});rr(x,y,w,h,R);ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.stroke();};
const slab=(x,y,w,h,r,t,b)=>{shadow(()=>{rr(x,y,w,h,r);ctx.fillStyle=GR(0,y,0,y+h,[[0,t],[1,b]]);ctx.fill();});rr(x,y,w,h,r);ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.7)';ctx.stroke();};
const stub=c=>{for(const t of DEFS[c.type].term){const x=t[1],y=t[2],dx=t[3],dy=t[4];line([[x,y],[x-dx*12,y-dy*12]],'#b87333',3);screw(x-dx*14,y-dy*14,2.6);}};
const dot=(x,y,r,col,a)=>{ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.globalAlpha=1;};
const lcd=(c,x,y,w,h,on)=>{rr(x,y,w,h,3);ctx.fillStyle=on?'#0e2a24':'#0a1613';ctx.fill();ctx.strokeStyle='#050a0c';ctx.stroke();};
const tx=(c,s,x,y,col,sz,al,wt)=>txt(c,s,x,y,col||COL.text,sz||8,al||'center',wt||700);
const head=(c,s,b,col)=>{const d=DEFS[c.type];tx(c,c.label||d.tag,0,-d.h/2-8,COL.text,9,'center',800);if(s)tx(c,s,0,d.h/2+10,col||COL.mut,8,'center',800);};

/* ───────── tables ───────── */
const TCT={K:[[-200,-5.891],[-100,-3.554],[0,0],[100,4.096],[200,8.138],[300,12.209],[400,16.397],[500,20.644],[600,24.905],[700,29.129],[800,33.275],[900,37.326],[1000,41.276],[1100,45.119],[1200,48.838],[1300,52.41]],
J:[[-200,-7.89],[-100,-4.633],[0,0],[100,5.269],[200,10.779],[300,16.327],[400,21.848],[500,27.393],[600,33.102],[700,39.132],[800,45.494],[900,51.877],[1000,57.953],[1200,69.553]],
T:[[-200,-5.603],[-100,-3.379],[0,0],[100,4.279],[200,9.288],[300,14.862],[400,20.872]],
E:[[-200,-8.825],[-100,-5.237],[0,0],[100,6.319],[200,13.421],[300,21.036],[400,28.946],[500,37.005],[600,45.093],[700,53.112],[800,61.017],[900,68.787],[1000,76.373]],
N:[[-200,-3.99],[-100,-2.407],[0,0],[100,2.774],[200,5.913],[300,9.341],[400,12.974],[500,16.748],[600,20.613],[700,24.527],[800,28.455],[900,32.371],[1000,36.256],[1100,40.087],[1200,43.846],[1300,47.513]],
R:[[0,0],[100,.647],[200,1.469],[300,2.401],[400,3.408],[500,4.471],[600,5.583],[700,6.741],[800,7.949],[900,9.205],[1000,10.506],[1200,13.228],[1400,15.945],[1600,18.849]],
S:[[0,0],[100,.646],[200,1.441],[300,2.323],[400,3.259],[500,4.233],[600,5.239],[700,6.275],[800,7.345],[900,8.449],[1000,9.587],[1200,11.951],[1400,14.373],[1600,16.777]],
B:[[0,0],[200,.178],[400,.787],[600,1.791],[800,3.154],[1000,4.834],[1200,6.786],[1400,8.956],[1600,11.263]]};
const TCR={K:[-200,1260],J:[-200,1200],T:[-200,400],E:[-200,1000],N:[-200,1300],R:[0,1600],S:[0,1600],B:[200,1700]};
const TCC={K:'#16a34a',J:'#374151',T:'#92400e',E:'#7c3aed',N:'#ec4899',R:'#f97316',S:'#f97316',B:'#9ca3af'};
function interp(tab,x){const n=tab.length;let a,b;if(x<=tab[0][0]){a=tab[0];b=tab[1];}else if(x>=tab[n-1][0]){a=tab[n-2];b=tab[n-1];}else{for(let i=1;i<n;i++)if(x<=tab[i][0]){a=tab[i-1];b=tab[i];break;}}return a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]);}
const tcEmf=(t,T)=>TCT[t]?interp(TCT[t],T):0;
const bis=(f,y,lo,hi)=>{for(let i=0;i<48;i++){const m=(lo+hi)/2;if(f(m)<y)lo=m;else hi=m;}return(lo+hi)/2;};
const tcInv=(t,mv)=>bis(T=>tcEmf(t,T),mv,-270,1800);
const RTD0={Pt100:100,Pt1000:1000,Ni1000:1000,Cu50:50};
function rtdR(t,T){const R0=RTD0[t]||100;if(t.startsWith('Pt'))return R0*(T>=0?1+3.9083e-3*T-5.775e-7*T*T:1+3.9083e-3*T-5.775e-7*T*T-4.183e-12*(T-100)*T*T*T);if(t==='Ni1000')return R0*(1+5.485e-3*T+6.65e-6*T*T);return R0*(1+4.28e-3*T);}
const rtdInv=(t,R)=>bis(T=>rtdR(t,T),R,-200,850);
const HOTT=new Set(['heater','tank','boiler','burner','flame','furnace','combustionchamber','steamgenerator','steampipe','superheater','reheater','economizer','hvaczone','lfpbattery','gasturbine','steamturbine','feedwatertank','silo','silopump','condenser','deaerator','motor','gearpump','steamsource','engine4s']);
function nearestHeat(c,r){let best=null,bd=r;for(const x of comps){if(x===c||!HOTT.has(x.type))continue;const T=Number(x.temperature);if(!Number.isFinite(T))continue;const d=Math.hypot(x.x-c.x,x.y-c.y);if(d<bd){bd=d;best={T,label:x.label||x.type};}}return best;}

/* ───────── electrical helpers ───────── */
function srcMap(st){const m=new Map(),R=(c,t)=>st.uf.find(key(c.id,t));const S=(c,t,kind,role,v)=>m.set(R(c,t),{kind,role,v});
  for(const c of comps){switch(c.type){
    case'source':if(c.on){S(c,'L','ac','p1',num(c.volts,220));S(c,'N','ac','n',0);}break;
    case'source3':if(c.on){const v=num(c.volts,400)/SQ3;S(c,'L1','ac','p1',v);S(c,'L2','ac','p2',v);S(c,'L3','ac','p3',v);S(c,'N','ac','n',0);}break;
    case'generator':if(c.on&&num(c.fuel,0)>0){const v=num(c.volts,400)/SQ3;S(c,'L1','ac','p1',v);S(c,'L2','ac','p2',v);S(c,'L3','ac','p3',v);S(c,'N','ac','n',0);}break;
    case'dcsource':if(c.on){S(c,'+','dc','p',num(c.volts,24));S(c,'-','dc','n',0);}break;
    case'psu24':if(num(c._vout,0)>=.5*num(c.vset,24)){S(c,'+','dc','p',c._vout);S(c,'-','dc','n',0);}break;
    case'battery':case'lfpbattery':{const v=bankV(c);S(c,'OUT+','dc','p',v);S(c,'OUT-','dc','n',0);}break;
    case'trf1p':S(c,'S_L','ac','p1',num(c.secV,230));S(c,'S_N','ac','n',0);break;
    case'inverter':if(c.on&&c._out){S(c,'AC_L','ac','p1',230);S(c,'AC_N','ac','n',0);}break;
    case'ups1':if(c._outInv||c._bypL||c._ecoL){S(c,'OUT_L','ac','p1',230);S(c,'OUT_N','ac','n',0);}break;
    case'ups3':if(c._outInv||c._bypL||c._ecoL){S(c,'OUT1','ac','p1',230);S(c,'OUT2','ac','p2',230);S(c,'OUT3','ac','p3',230);S(c,'OUTN','ac','n',0);}break;
  }}
  return m;}
function volts(st,c,ta,tb){if(!live(st,c,ta,tb))return null;const m=st._sm||(st._sm=srcMap(st));
  const ia=m.get(st.uf.find(key(c.id,ta))),ib=m.get(st.uf.find(key(c.id,tb)));let kind='?',v=null,pol=0;
  if(ia&&ib&&ia.kind==='dc'&&ib.kind==='dc'){kind='dc';const sa=ia.role==='p'?ia.v:0,sb=ib.role==='p'?ib.v:0;v=Math.abs(sa-sb);pol=sa>sb?1:-1;}
  else if(ia&&ib&&ia.kind==='ac'&&ib.kind==='ac'){kind='ac';const pp=ia.role!=='n'&&ib.role!=='n'&&ia.role!==ib.role;v=pp?Math.max(ia.v,ib.v)*SQ3:Math.max(ia.v,ib.v);}
  else if(ia||ib){const q=ia||ib;kind=q.kind;v=q.v;if(kind==='dc')pol=ia&&ia.role==='p'?1:ib&&ib.role==='p'?-1:(PHs.has(ntype(st,c,ta))?1:-1);}
  return{v,kind,pol};}
function coil(st,c,ta,tb,rated,ctype,was,polar){const o={on:false,v:0,kind:'?',burn:false,msg:''};const i=volts(st,c,ta,tb);if(!i)return o;
  o.v=i.v==null?rated:i.v;o.kind=i.kind;const ok=i.kind==='?'||(ctype==='AC'?i.kind==='ac':i.kind==='dc');
  if(!ok){o.msg=ctype==='AC'?'AC coil on DC supply':'DC coil on AC supply';if(ctype==='AC'&&o.v>=.5*rated)o.burn=true;return o;}
  if(o.v>1.35*rated){o.burn=true;o.msg='overvoltage';return o;}
  if(polar&&i.kind==='dc'&&i.pol<0){o.msg='reverse polarity';return o;}
  o.on=o.v>=(ctype==='AC'?.85:.75)*rated||(!!was&&o.v>=.3*rated);if(!o.on)o.msg='undervoltage';return o;}
const NLP={pfc:{3:.04,5:.03,7:.02,9:.01,11:.01,13:.01},diode:{3:.8,5:.6,7:.4,9:.22,11:.1,13:.06},six:{3:.02,5:.3,7:.14,9:.01,11:.09,13:.06},twelve:{5:.03,7:.02,11:.07,13:.05},igbt:{5:.03,7:.02,11:.02,13:.01}};
function collectLoads(uf){const V=sim.volts||230,out=[],R=(c,t)=>uf.find(key(c.id,t));const add=(c,t,I,P,nl)=>{if(I>0.001)out.push({r:R(c,t),I,P:P==null?I*V*.9:P,nl,c});};
  for(const c of comps){const d=DEFS[c.type];if(!d)continue;
    if(d.acT){if(num(c._iIn,0)>.001)for(const t of d.acT)add(c,t,c._iIn,num(c._pIn,0)/d.acT.length,c._nlp);continue;}
    switch(c.type){
      case'motor':case'acmotor':if(c.powered)add(c,'L',c.I||0,(c.I||0)*V*num(c.pf,.8));break;
      case'gearpump':if(c.powered&&c.drive!=='shaft'&&c.I>0)add(c,'L',c.I,(c.I)*V*num(c.pf,.85));break;
      case'lamp':if(c.powered)add(c,'a',c.I||0,c.watts);break;
      case'heater':case'fan':if(c.powered)add(c,'L',c.watts/V,c.watts);break;
      case'load3':for(let k=1;k<=3;k++)add(c,'L'+k,c['I'+k],c['P'+k]);break;
      case'motor3':if(c.powered||c.phaseLoss)['U','V','W'].forEach((t,k)=>add(c,t,c['I'+(k+1)],c['P'+(k+1)]));break;
      case'vfd':if(c._real)['L1','L2','L3'].forEach(t=>add(c,t,num(c.amps,10),num(c.amps,10)*V*.95,'six'));break;
      case'batterycharger':if(c.status==='CHARGING')add(c,'AC_L',c.inputCurrent,null,'diode');break;
    }}
  return out;}
function downAmps(c,terms){c._noLink=true;let uf;try{uf=buildUF();}finally{c._noLink=false;}const L=collectLoads(uf);return{I:terms.map(t=>{const r=uf.find(key(c.id,t));return L.filter(x=>x.r===r).reduce((a,x)=>a+x.I,0);}),L,uf};}
function wire3(st,d,dts,m,mts){const R=(c,t)=>st.uf.find(key(c.id,t));const dr=dts.map(t=>R(d,t));const p=mts.map(t=>dr.indexOf(R(m,t)));const n=p.filter(i=>i>=0).length;
  if(n<3||new Set(p).size<3)return{n,ok:false,rev:false};let inv=0;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(p[i]>p[j])inv++;return{n:3,ok:true,rev:inv%2===1};}
function wire2ph(st,d,m){const R=(c,t)=>st.uf.find(key(c.id,t));const N=['A+','A-','B+','B-'],dr={};N.forEach(t=>dr[t]=R(d,t));const map={};let n=0;
  for(const t of N){const k=N.find(x=>dr[x]===R(m,t));if(k){map[t]=k;n++;}}if(n<4)return{n,ok:false};
  const pr=(a,b,x,y)=>(map[a]===x&&map[b]===y)||(map[a]===y&&map[b]===x);
  if(pr('A+','A-','A+','A-')&&pr('B+','B-','B+','B-'))return{n,ok:true,sign:(map['A+']==='A+'?1:-1)*(map['B+']==='B+'?1:-1)};
  if(pr('A+','A-','B+','B-')&&pr('B+','B-','A+','A-'))return{n,ok:true,sign:-(map['A+']==='B+'?1:-1)*(map['B+']==='A+'?1:-1)};
  return{n,ok:false};}
const MATF={inductive:{steel:1,stainless:.7,aluminium:.4,brass:.4,copper:.3,plastic:0,wood:0,water:0,glass:0,paper:0},capacitive:{steel:1,stainless:1,aluminium:1,brass:1,copper:1,plastic:.55,wood:.5,water:1,glass:.6,paper:.4},photoelectric:{steel:1,stainless:1,aluminium:1,brass:1,copper:1,plastic:1,wood:.9,water:.4,glass:.2,paper:1},mech:{steel:1,stainless:1,aluminium:1,brass:1,copper:1,plastic:1,wood:1,water:0,glass:1,paper:.2}};
function detect(c,fx,fy,ux,uy,range,pr,was){const o=rotv(fx,fy,c.rot),u=rotv(ux,uy,c.rot),X=c.x+o[0],Y=c.y+o[1];let hit=false,dmin=1e9;
  for(const t of comps){if(t.type!=='target'||t._wx==null)continue;const f=(MATF[pr]||MATF.inductive)[t.material]||0;if(f<=0)continue;
    const dx=t._wx-X,dy=t._wy-Y,al=dx*u[0]+dy*u[1],cr=Math.abs(-dx*u[1]+dy*u[0]),d=Math.hypot(dx,dy)-12,r=range*f*(was?1.12:1);
    if(al>-8&&cr<=.6*range+14&&d<=r){hit=true;dmin=Math.min(dmin,d);}}
  return{hit,d:dmin};}

/* ───────── component registry ───────── */
function def(type,o){DEFS[type]=Object.assign({icon:'⚙️',pins:{}},o,{init:Object.assign({},o.init||{})});MY.add(type);if(o.blurb)COMP_BLURB[type]=o.blurb;}
const IC={};const SVG=d=>SV(d);
/* ---- relays ---- */
const RLY={
 rly_oct8:{name:'Relay 8-pin octal DPDT (MY2 / MK2P)',tag:'K8',coil:['2','7'],poles:[['1','4','3'],['8','5','6']],v:24,amp:10,model:'MY2 · 8-pin octal'},
 rly_oct11:{name:'Relay 11-pin octal 3PDT (MK3P)',tag:'K11',coil:['2','10'],poles:[['1','4','3'],['11','8','9'],['6','7','5']],v:24,amp:10,model:'MK3P · 11-pin octal'},
 rly_sq14:{name:'Relay 14-pin 4PDT (MY4 / MK4P)',tag:'K14',coil:['13','14'],poles:[['1','5','9'],['2','6','10'],['3','7','11'],['4','8','12']],v:24,amp:5,model:'MY4 · 14-pin'},
 rly_auto5:{name:'Relay 5-pin automotive SPDT (30/85/86/87/87a)',tag:'KA',coil:['86','85'],poles:[['30','87a','87']],v:12,amp:30,model:'ISO 280 · 5-pin'},
 rly_din2:{name:'Interface relay DIN DPDT (A1/A2, 11-14, 21-24)',tag:'KD',coil:['A1','A2'],poles:[['11','12','14'],['21','22','24']],v:24,amp:8,model:'DIN slim · IEC 60947-5-1'}};
function relayRelax(st,c,set){const r=coil(st,c,DEFS[c.type].coilT[0],DEFS[c.type].coilT[1],num(c.coilV,24),c.coilType||'DC',c.on,c.polar);
  if(r.burn&&!c.burnt)set(c,'burnt',true);set(c,'on',!c.burnt&&(r.on||!!c.manual));c._cv=r.v;c._msg=r.msg;}
function drawRelay(c){const d=DEFS[c.type],r=RLY[c.type],W=110,H=d.h,on=!!c.on;c._a=num(c._a,0)+((on?1:0)-num(c._a,0))*Math.min(1,DT()*18);const a=c._a;
  const T=id=>d.term.find(t=>t[0]===id);stub(c);
  slab(-W/2+14,-H/2+4,W-28,H-8,7,'#2d3d50','#18222e');
  rr(-W/2+18,-H/2+8,W-36,H-16,6);ctx.fillStyle=GR(0,-H/2,0,H/2,[[0,'rgba(215,232,248,.30)'],[1,'rgba(120,160,195,.16)']]);ctx.fill();ctx.strokeStyle='rgba(210,230,250,.45)';ctx.stroke();
  const c1=T(r.coil[0]),c2=T(r.coil[1]),cx=-W/2+36,cm=(c1[2]+c2[2])/2;
  line([[c1[1],c1[2]],[cx,c1[2]],[cx,cm-9]],'#c98a4b',2);line([[c2[1],c2[2]],[cx,c2[2]],[cx,cm+9]],'#c98a4b',2);
  rr(cx-9,cm-9,18,18,2);ctx.fillStyle=on?'rgba(6,214,160,.35)':'rgba(180,110,40,.35)';ctx.fill();ctx.strokeStyle=on?COL.ok:'#c98a4b';ctx.stroke();line([[cx-9,cm+9],[cx+9,cm-9]],on?COL.ok:'#c98a4b',1.2);
  const px=-4,kx=W/2-28;
  r.poles.forEach(p=>{const Tc=T(p[0]),Tn=T(p[1]),To=T(p[2]),py=(Tn[2]+To[2])/2,ay=Tn[2]+(To[2]-Tn[2])*a;
    line([[Tc[1],Tc[2]],[px-12,Tc[2]],[px-12,py],[px,py]],'#9aa8b6',2);line([[kx,Tn[2]],[Tn[1],Tn[2]]],'#9aa8b6',2);line([[kx,To[2]],[To[1],To[2]]],'#9aa8b6',2);
    dot(kx,Tn[2],2.6,'#e5e9ee',1);dot(kx,To[2],2.6,'#e5e9ee',1);line([[px,py],[kx-3,ay]],on?COL.ok:'#dfe6ee',2.6);dot(px,py,2.5,'#cfd8e1',1);});
  ctx.save();ctx.setLineDash([3,3]);line([[cx+9,cm],[px,cm]],'rgba(200,220,240,.5)',1);ctx.restore();
  tx(c,r.model,0,-H/2+14,'#8ea3b8',7);if(c.type==='rly_din2'){led(W/2-26,-H/2+14,'#06d6a0',on);}
  if(c.burnt)tx(c,'COIL BURNT',0,0,COL.bad,9,'center',800);else if(c.manual)tx(c,'MANUAL',0,H/2-12,COL.warn,7,'center',800);
  head(c,`${c.coilV} V${c.coilType==='AC'?'AC':'DC'} · ${c.on?'ENERGISED':'OFF'}`,'',on?COL.ok:COL.mut);}
for(const k in RLY){const r=RLY[k],n=r.poles.length,rl=2+n,rr_=2*n,rows=Math.max(rl,rr_),step=22,W=110,H=rows*step+44,y0L=-(rl-1)*step/2,y0R=-(rr_-1)*step/2,term=[],pins={};
  r.coil.forEach((id,i)=>{term.push([id,-W/2,y0L+i*step,-1,0]);pins[id]='coil '+(i?'(−)':'(+)');});
  r.poles.forEach((p,i)=>{term.push([p[0],-W/2,y0L+(2+i)*step,-1,0],[p[1],W/2,y0R+2*i*step,1,0],[p[2],W/2,y0R+(2*i+1)*step,1,0]);pins[p[0]]=`pole ${i+1} COM`;pins[p[1]]=`pole ${i+1} NC`;pins[p[2]]=`pole ${i+1} NO`;});
  def(k,{name:r.name,tag:r.tag,cat:C_REL,w:W,h:H,term,coilT:r.coil,pins,sup:r.coil,dcLoad:c=>c.on&&c.coilType!=='AC'?.9/num(c.coilV,24):0,relax:relayRelax,draw:drawRelay,
   links:c=>r.poles.map(p=>[p[0],c.on?p[2]:p[1]]),click:c=>{c.manual=!c.manual;},
   init:{coilV:r.v,coilType:'DC',polar:false,on:false,manual:false,burnt:false,ops:0,rating:r.amp},
   blurb:`${r.model}. Coil ${r.coil.join('–')}; poles (COM/NC/NO): ${r.poles.map(p=>p.join('/')).join(' · ')}. Pin numbers follow the common manufacturer base pattern — check the datasheet of the exact part.`,
   desc:c=>`Coil: ${c.burnt?'BURNT':c.on?'ENERGISED':'off'}${c.manual?' (manual)':''}\nCoil voltage: ${num(c._cv,0).toFixed(1)} V (rated ${c.coilV} ${c.coilType})\n${c._msg||''}\nContacts: ${c.on?'COM–NO closed':'COM–NC closed'}\nOperations: ${c.ops||0}`});}

/* ---- pilot lights ---- */
const PLC={red:['#ff3b30','#7a0d08'],green:['#2ddc6b','#0b5d2a'],amber:['#ffb020','#7a4a00'],blue:['#3b82f6','#0b2f7a'],white:['#f1f5f9','#6b7280']};
function plRelax(st,c,set){const i=volts(st,c,'X1','X2');let on=false,burn=false;
  if(i){const v=i.v==null?24:i.v;if(v>40)burn=true;else if(i.kind==='dc')on=i.pol>0&&v>=17;else if(i.kind==='ac')on=!!c.acdc&&v>=17;else on=v>=17;}
  if(burn)set(c,'burnt',true);set(c,'lit',on&&!c.burnt);}
function drawPilot(c){const col=PLC[c.color]||PLC.red;c.br=num(c.br,0)+((c.lit&&!c.burnt?1:0)-num(c.br,0))*Math.min(1,DT()*14);let v=c.br;if(c.lit&&c.flash&&c.flash!=='none')v*=Math.sin(AN()*TAU*(c.flash==='fast'?4:1.2))>0?1:.1;
  slab(-30,-38,60,56,8,'#cfd6de','#7d8895');tubeV(-14,16,28,22,'#2b3440',3);stub(c);
  ctx.beginPath();ctx.arc(0,-10,23,0,TAU);ctx.fillStyle=GR(-20,-30,20,10,[[0,'#f2f5f8'],[.5,'#a9b4bf'],[1,'#4d5864']]);ctx.fill();ctx.strokeStyle='#222';ctx.stroke();
  if(v>.05)glow(0,-10,50,rgba(col[0],.5*v));
  ctx.beginPath();ctx.arc(0,-10,18,0,TAU);const g=ctx.createRadialGradient(-6,-16,2,0,-10,18);g.addColorStop(0,mixc(col[0],'#ffffff',.25+.55*v));g.addColorStop(.6,mixc(col[1],col[0],.15+.85*v));g.addColorStop(1,mixc(col[1],'#000000',.4));ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(0,0,0,.6)';ctx.stroke();
  ctx.beginPath();ctx.ellipse(-6,-18,6,3.5,-.5,0,TAU);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fill();
  tx(c,'+',-17,30,COL.mut,8);tx(c,'−',17,30,COL.mut,8);if(c.burnt)tx(c,'LED BURNT',0,-10,COL.bad,7,'center',800);
  tx(c,c.label,0,-46,COL.text,9,'center',800);tx(c,'22 mm · 24 V',0,60,COL.mut,7);}
for(const k in PLC)def('pl_'+k,{name:`Pilot Light ${k[0].toUpperCase()+k.slice(1)} 22 mm LED 24 V`,tag:'H',cat:C_PNL,w:70,h:90,term:[['X1',-17,45,0,1],['X2',17,45,0,1]],pins:{X1:'+24 V DC (anode)',X2:'0 V (cathode)'},sup:['X1','X2'],dcLoad:c=>c.lit?.02:0,relax:plRelax,draw:drawPilot,
  init:{color:k,acdc:true,lit:false,br:0,burnt:false,flash:'none'},blurb:'22 mm LED panel indicator, 24 V DC (AC/DC selectable). X1 = +, X2 = 0 V. Lights from 17 V; above 40 V the LED is destroyed. Can flash.',desc:c=>`State: ${c.burnt?'LED burnt':c.lit?'ON':'off'}\nColour: ${c.color}\nFlash: ${c.flash}`});

/* ---- push buttons ---- */
const PBD={
 pbno:{name:'Push Button START green (1NO 13-14)',kind:'no',col:'#22c55e',h:90,term:[['13',-45,0,-1,0],['14',45,0,1,0]]},
 pbnc:{name:'Push Button STOP red (1NC 11-12)',kind:'nc',col:'#ef4444',h:90,term:[['11',-45,0,-1,0],['12',45,0,1,0]]},
 pbdual:{name:'Double Push Button I/O (NO 13-14 + NC 21-22)',kind:'dual',h:110,term:[['13',-45,-22,-1,0],['14',45,-22,1,0],['21',-45,22,-1,0],['22',45,22,1,0]]},
 pbestop:{name:'Emergency Stop mushroom 2NC (11-12, 21-22)',kind:'estop',col:'#dc2626',h:110,term:[['11',-45,-22,-1,0],['12',45,-22,1,0],['21',-45,22,-1,0],['22',45,22,1,0]]},
 pbillum:{name:'Illuminated Push Button (NO 13-14 + LED X1/X2)',kind:'illum',h:120,term:[['13',-45,-10,-1,0],['14',45,-10,1,0],['X1',-15,60,0,1],['X2',15,60,0,1]]}};
const MOM=new Set(['pbno','pbnc','pbdual','pbillum']);
function pbLinks(k){return c=>{const p=!!(c.pressed);switch(PBD[k].kind){case'no':return p?[['13','14']]:[];case'nc':return p?[]:[['11','12']];case'dual':return[...(p?[['13','14']]:[]),...(p?[]:[['21','22']])];case'estop':return c.latched?[]:[['11','12'],['21','22']];case'illum':return p?[['13','14']]:[];}return[];};}
function swSym(x1,x2,y,closed){line([[x1,y],[x1+6,y]],'#9aa8b6',2);line([[x2-6,y],[x2,y]],'#9aa8b6',2);dot(x1+6,y,2,'#e5e9ee',1);dot(x2-6,y,2,'#e5e9ee',1);line([[x1+6,y],[closed?x2-6:x2-10,closed?y:y-8]],closed?COL.ok:'#dfe6ee',2);}
function drawPB(c){const d=DEFS[c.type],k=d.pb,pr=!!c.pressed,H=d.h;stub(c);
  const dep=k.kind==='estop'?(c.latched?6:0):(pr?4:0);
  slab(-32,-H/2+6,64,H-12,6,'#2b3440','#161c24');
  const sw=(a,y,cl)=>swSym(-30,30,y,cl);
  if(k.kind==='no')sw(0,0,pr);else if(k.kind==='nc')sw(0,0,!pr);
  else if(k.kind==='dual'){sw(0,-22,pr);sw(0,22,!pr);}else if(k.kind==='estop'){sw(0,-22,!c.latched);sw(0,22,!c.latched);}else if(k.kind==='illum')sw(0,-10,pr);
  const hy=k.kind==='illum'?-4:-H/2-2;const hx=0;
  const head=(x,y,r,col,lab,lit)=>{if(lit)glow(x,y,r*2.4,rgba(col,.5));ctx.beginPath();ctx.arc(x,y+dep*.4,r+4,0,TAU);ctx.fillStyle=GR(x-r,y-r,x+r,y+r,[[0,'#f2f5f8'],[1,'#69747f']]);ctx.fill();ctx.strokeStyle='#222';ctx.stroke();
    ctx.beginPath();ctx.arc(x,y+dep*.4,r,0,TAU);ctx.fillStyle=GR(x-r,y-r,x+r,y+r,[[0,mixc(col,'#ffffff',lit?.6:.35)],[.6,col],[1,mixc(col,'#000000',.55)]]);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.6)';ctx.stroke();if(lab)txt(c,lab,x,y+dep*.4,'#fff',9,'center',800);};
  if(k.kind==='no')head(0,-H/2-6,15,k.col,'I');else if(k.kind==='nc')head(0,-H/2-6,15,k.col,'O');
  else if(k.kind==='dual'){head(-14,-H/2-6,11,'#22c55e','I');head(14,-H/2-6,11,'#ef4444','O');}
  else if(k.kind==='illum'){head(0,-H/2-6,15,PLC[c.color||'green'][0],'',c.lit);}
  else{ctx.beginPath();ctx.arc(0,-H/2-4,20,0,TAU);ctx.fillStyle='#facc15';ctx.fill();ctx.strokeStyle='#222';ctx.stroke();head(0,-H/2-4+dep*.3,17,'#dc2626','');tx(c,c.latched?'LATCHED':'TWIST↻',0,-H/2+16,c.latched?COL.bad:COL.mut,7,'center',800);}
  tx(c,c.label,0,H/2+10,COL.text,9,'center',800);}
for(const k in PBD){const p=PBD[k];def(k,{name:p.name,tag:k==='pbestop'?'SB-E':'SB',cat:C_PNL,w:90,h:p.h,term:p.term,pb:p,draw:drawPB,links:pbLinks(k),
  init:Object.assign({pressed:false,latched:false},k==='pbillum'?{color:'green',lit:false,burnt:false,acdc:true,br:0}:{}),
  relax:k==='pbillum'?plRelax:undefined,sup:k==='pbillum'?['X1','X2']:undefined,dcLoad:k==='pbillum'?(c=>c.lit?.02:0):undefined,
  click:k==='pbestop'?(c=>{c.latched=!c.latched;}):undefined,
  blurb:{no:'Momentary NO (13-14). Hold the mouse on the button to close the contact.',nc:'Momentary NC (11-12). Hold the mouse to open the contact.',dual:'Double-headed I/O: green NO 13-14, red NC 21-22.',estop:'Mushroom E-stop, 2 NC (11-12, 21-22). Click to latch, click again to twist-release.',illum:'Illuminated button: NO 13-14 contact block plus 24 V LED lamp X1(+)/X2(−).'}[p.kind],
  pins:Object.fromEntries(p.term.map(t=>[t[0],{'13':'NO','14':'NO','11':'NC','12':'NC','21':'NC','22':'NC','X1':'LED +24 V','X2':'LED 0 V'}[t[0]]||''])),
  desc:c=>`Pressed: ${c.pressed||c.latched?'YES':'no'}\n${PBD[c.type].kind==='estop'?'Latched: '+(c.latched?'YES':'no'):''}`});}

/* ---- limit switches ---- */
function drawLS(c){const d=DEFS[c.type],two=c.type==='ls2',a=c._p=num(c._p,0)+((c.act?1:0)-num(c._p,0))*Math.min(1,DT()*16);stub(c);
  slab(-38,-4,76,56,6,'#d8b92b','#8a7516');rr(-34,0,68,6,2);ctx.fillStyle='#444';ctx.fill();
  tubeV(-9,-18,18,16,'#9aa6b2',3);const ang=-.6*a;
  ctx.save();ctx.translate(0,-18);ctx.rotate(ang);const st=c.head||'roller';
  if(st==='plunger'){ctx.restore();tubeV(-5,-40+a*8,10,24,'#cbd5df',3);ctx.beginPath();ctx.arc(0,-42+a*8,6,0,TAU);ctx.fillStyle='#8da2b6';ctx.fill();ctx.strokeStyle='#222';ctx.stroke();}
  else{line([[0,0],[-6,-44]],'#cbd5df',5);ctx.beginPath();ctx.arc(-6,-48,st==='roller'?9:4,0,TAU);ctx.fillStyle=st==='roller'?'#2b3440':'#cbd5df';ctx.fill();ctx.strokeStyle='#111';ctx.stroke();if(st==='rod')line([[-6,-48],[-34,-52]],'#cbd5df',2);if(st==='whisker')line([[-6,-48],[-6,-70]],'#cbd5df',1.5);ctx.restore();}
  if(two){tx(c,'2NC+2NO',0,30,'#4a3f0a',8,'center',800);}else tx(c,'1NC+1NO',0,30,'#4a3f0a',8,'center',800);
  led(30,12,'#ffd166',c.act);tx(c,c.label+(c.act?' · ACTUATED':''),0,-82,c.act?COL.warn:COL.text,9,'center',800);}
def('ls1',{name:'Limit Switch 1NC+1NO (11-12, 23-24)',tag:'SQ',cat:C_PNL,w:90,h:110,term:[['11',-30,52,0,1],['12',-10,52,0,1],['23',10,52,0,1],['24',30,52,0,1]],pins:{'11':'NC','12':'NC','23':'NO','24':'NO'},draw:drawLS,
 links:c=>c.act?[['23','24']]:[['11','12']],init:{head:'roller',manual:false,act:false,ops:0},click:c=>{c.manual=!c.manual;},blurb:'Snap-action limit switch (IEC 60947-5-1): NC 11-12, NO 23-24. Actuated by a nearby Target (lever travel ≈ 22 px) or by clicking (manual).',desc:c=>`Actuated: ${c.act?'YES':'no'}${c.manual?' (manual)':''}\nHead: ${c.head}\nOperations: ${c.ops||0}`,
 tick:(c,dt)=>{const r=detect(c,0,-62,0,-1,22,'mech',c.act);const a=!!(r.hit||c.manual);if(a&&!c.act)c.ops=(c.ops||0)+1;c.act=a;}});
def('ls2',{name:'Limit Switch 2NC+2NO (11-12, 21-22, 33-34, 43-44)',tag:'SQ2',cat:C_PNL,w:170,h:110,term:[['11',-70,52,0,1],['12',-50,52,0,1],['21',-30,52,0,1],['22',-10,52,0,1],['33',10,52,0,1],['34',30,52,0,1],['43',50,52,0,1],['44',70,52,0,1]],pins:{'11':'NC1','12':'NC1','21':'NC2','22':'NC2','33':'NO1','34':'NO1','43':'NO2','44':'NO2'},draw:drawLS,
 links:c=>c.act?[['33','34'],['43','44']]:[['11','12'],['21','22']],init:{head:'roller',manual:false,act:false,ops:0},click:c=>{c.manual=!c.manual;},blurb:'Limit switch with 2NC (11-12, 21-22) + 2NO (33-34, 43-44) contacts.',desc:c=>`Actuated: ${c.act?'YES':'no'}`,tick:DEFS.ls1.tick});

/* ---- terminal blocks ---- */
const TBCOL={grey:'#9aa4ae',blue:'#3b82f6',pe:'#84cc16',orange:'#f59e0b',red:'#ef4444',black:'#374151'};
function drawTB(c){const d=DEFS[c.type],col=c.type==='tbpe'?'#84cc16':(TBCOL[c.color]||TBCOL.grey);
  if(c.type==='tbstrip'){const n=6;ctx.fillStyle='#4b5563';ctx.fillRect(-88,-8,176,16);for(let i=0;i<n;i++){const x=-70+i*28;slab(x-12,-52,24,104,3,mixc(col,'#ffffff',.3),mixc(col,'#000000',.35));screw(x,-36,4);screw(x,36,4);line([[x,-52],[x,-45]],'#b87333',3);line([[x,52],[x,45]],'#b87333',3);tx(c,String(i+1),x,0,'#111',9,'center',800);}
    if(c.bridge==='all'||c.bridge==='pair'){for(let i=0;i<n;i+=(c.bridge==='pair'?2:5)){const x1=-70+i*28,x2=-70+(c.bridge==='pair'?i+1:n-1)*28;slab(x1-6,-26,x2-x1+12,8,2,'#fbbf24','#b45309');slab(x1-6,18,x2-x1+12,8,2,'#fbbf24','#b45309');}}
    tx(c,c.label,0,-66,COL.text,9,'center',800);return;}
  ctx.fillStyle='#4b5563';ctx.fillRect(-26,-6,52,12);
  slab(-14,-42,28,84,4,mixc(col,'#ffffff',.3),mixc(col,'#000000',.35));if(c.type==='tbpe'){ctx.fillStyle='#facc15';for(let i=0;i<5;i++)ctx.fillRect(-14,-42+i*17,28,8);}
  line([[0,-45],[0,-38]],'#b87333',3);line([[0,45],[0,38]],'#b87333',3);screw(0,-28,5);screw(0,28,5);
  if(c.type==='tbfuse'){slab(-10,-16,20,32,3,c.blown?'#ef4444':'#e5e7eb','#9ca3af');if(c.open)line([[-14,0],[14,-14]],'#111',2);led(0,-20,'#ef476f',c.blown);tx(c,c.rating+'A',0,2,'#111',8,'center',800);}
  if(c.type==='tbdisc'){line([[-10,-10],[c.open?10:0,c.open?-18:10]],'#111',3);tx(c,c.open?'OPEN':'CLOSED',0,6,'#111',6,'center',800);}
  tx(c,c.label,0,-56,COL.text,9,'center',800);}
const tbT=[['T',0,-45,0,-1],['B',0,45,0,1]];
def('tbfeed',{name:'Terminal Block feed-through 2.5 mm²',tag:'X',cat:C_TB,w:40,h:90,term:tbT,pins:{T:'upper screw',B:'lower screw'},draw:drawTB,links:()=>[['T','B']],init:{color:'grey'},blurb:'DIN-rail feed-through terminal: top and bottom screw clamps are bonded. Colour: grey (L), blue (N), orange/black (control).'});
def('tbpe',{name:'Terminal Block PE (earth)',tag:'XPE',cat:C_TB,w:40,h:90,term:tbT,pins:{T:'upper',B:'lower'},draw:drawTB,links:()=>[['T','B']],init:{},blurb:'Green/yellow PE terminal; clamps are bonded to the DIN rail earth.'});
def('tbfuse',{name:'Terminal Block with fuse holder',tag:'XF',cat:C_TB,w:40,h:90,term:tbT,pins:{T:'supply',B:'load'},draw:drawTB,links:c=>(!c.blown&&!c.open&&!c._noLink)?[['T','B']]:[],init:{color:'grey',rating:6,blown:false,open:false,heat:0},click:c=>{if(c.blown)c.blown=false;else c.open=!c.open;},
 blurb:'Fused terminal with pivoting holder and blown-fuse LED. Click: open/close the holder, or replace a blown fuse.',desc:c=>`Fuse: ${c.blown?'BLOWN':c.open?'holder open':'OK'} ${c.rating} A`,
 tick:(c,dt,st,gx)=>{if(c.blown||c.open){return;}const I=downAmps(c,['B']).I[0],r=I/num(c.rating,6);c.heat=r>1?num(c.heat,0)+dt*(r*r-1)*.4:Math.max(0,num(c.heat,0)-dt*.2);if(r>8||c.heat>3){c.blown=true;c.heat=0;log(`⚠ ${c.label} fuse blown (${I.toFixed(1)} A)`);}}});
def('tbdisc',{name:'Terminal Block knife disconnect',tag:'XD',cat:C_TB,w:40,h:90,term:tbT,pins:{T:'supply',B:'load'},draw:drawTB,links:c=>c.open?[]:[['T','B']],init:{color:'grey',open:false},click:c=>{c.open=!c.open;},blurb:'Test/disconnect terminal with hinged knife link. Click to open or close.'});
{const t=[];for(let i=0;i<6;i++)t.push(['T'+(i+1),-70+i*28,-52,0,-1]);for(let i=0;i<6;i++)t.push(['B'+(i+1),-70+i*28,52,0,1]);
def('tbstrip',{name:'Terminal Strip 6-pole (T1-T6 / B1-B6)',tag:'XS',cat:C_TB,w:180,h:112,term:t,pins:{T1:'pole 1 upper',B1:'pole 1 lower'},draw:drawTB,
 links:c=>{const a=[];for(let i=1;i<=6;i++)a.push(['T'+i,'B'+i]);if(c.bridge==='all'){for(let i=1;i<6;i++)a.push(['T'+i,'T'+(i+1)]);}else if(c.bridge==='pair'){a.push(['T1','T2'],['T3','T4'],['T5','T6']);}return a;},
 init:{color:'grey',bridge:'none'},blurb:'Six feed-through poles; each T(n)–B(n) is bonded. Optional jumper bar commons all poles or pairs them (1-2, 3-4, 5-6).'});}

/* ---- 24 V PSU ---- */
function drawPSU(c){const ok=c._ok;stub(c);slab(-45,-60,90,120,5,'#6b7a8a','#2d3844');rr(-36,-50,72,50,3);ctx.fillStyle='#10202c';ctx.fill();
  tx(c,'24 V DC',0,-38,COL.ok,12,'center',800);tx(c,`${num(c._vout,0).toFixed(1)} V  ${num(c._iOut,0).toFixed(1)} A`,0,-20,COL.text,10,'center',800);tx(c,`${num(c.rating,10)} A · ${num(c.vset,24)} V`,0,-6,COL.mut,8);
  rr(-36,8,72,6,2);ctx.fillStyle='#08121a';ctx.fill();const f=clamp(num(c._iOut,0)/num(c.rating,10),0,1);rr(-36,8,72*f,6,2);ctx.fillStyle=f>1?COL.bad:f>.8?COL.warn:COL.ok;ctx.fill();
  led(-28,28,'#06d6a0',ok);led(-12,28,'#ffb020',c._ovl);tx(c,'DC OK',-28,40,COL.mut,6);tx(c,'OVL',-12,40,COL.mut,6);tx(c,'AC–DC SMPS',16,32,'#9fb0c0',7);head(c,'',''); }
def('psu24',{name:'DIN-rail Power Supply 230 VAC / 24 VDC',tag:'PSU',cat:C_PNL,w:110,h:130,term:[['L',-55,-30,-1,0],['N',-55,0,-1,0],['PE',-55,30,-1,0],['+',55,-30,1,0],['-',55,0,1,0],['DCOK',55,30,1,0]],pins:{L:'mains line',N:'mains neutral',PE:'earth','+':'+24 V','-':'0 V',DCOK:'DC-OK signal (24 V when healthy)'},
 draw:drawPSU,links:c=>c._ok?[['DCOK','+']]:[],acT:['L'],init:{vset:24,rating:10,enabled:true,_vout:0,_ok:false,_ovl:false,_iOut:0,_nlp:'pfc'},click:c=>{c.enabled=!c.enabled;},
 blurb:'SMPS 85–264 VAC → regulated 24 VDC, current-limited. Output collapses when loaded beyond its rating. DCOK = +24 V signal while healthy. Click to switch on/off.',desc:c=>`Output: ${num(c._vout,0).toFixed(2)} V\nLoad: ${num(c._iOut,0).toFixed(2)} A / ${c.rating} A\n${c._ovl?'OVERLOAD / current limit':c._ok?'DC OK':'no output'}\nInput: ${num(c._pIn,0).toFixed(0)} W`,
 tick:(c,dt,st,gx)=>{const V=volts(st,c,'L','N'),inOK=!!V&&V.kind!=='dc'&&(V.v==null||(V.v>=85&&V.v<=300));const root=st.uf.find(key(c.id,'+'));let I=0;for(const x of comps)if(x._pRoot===root)I+=num(x._iDC,0);c._iOut=I;
  const lim=num(c.rating,10);let tg=inOK&&c.enabled!==false?num(c.vset,24):0;c._ovl=I>lim*1.05;if(c._ovl)tg*=clamp(1-(I/lim-1.05)*3,0,1);lag(c,'_vout',tg,dt,.15);c._ok=c._vout>=.9*num(c.vset,24);
  c._pIn=inOK?c._vout*Math.min(I,lim*1.1)/.9+5:0;c._iIn=inOK?c._pIn/(num(V.v,230)*.95):0;}});

/* ---- sensors ---- */
const SEN={npn_sensor:{name:'NPN Sensor 3-wire (generic, sinking output)',tag:'SN',out:'NPN',pr:'inductive',sn:8,b:'#7c8da0'},pnp_sensor:{name:'PNP Sensor 3-wire (generic, sourcing output)',tag:'SP',out:'PNP',pr:'inductive',sn:8,b:'#a07c5c'},
 ind_sensor:{name:'Inductive Proximity Sensor M18 (metal)',tag:'IS',out:'PNP',pr:'inductive',sn:8,b:'#b9c3cc'},cap_sensor:{name:'Capacitive Proximity Sensor M30',tag:'CS',out:'PNP',pr:'capacitive',sn:15,b:'#c9b48a'},photo_sensor:{name:'Photoelectric Proximity Sensor (diffuse)',tag:'PHS',out:'PNP',pr:'photoelectric',sn:20,b:'#4b5563'}};
function senRelax(st,c,set){const i=volts(st,c,'BN','BU');let pw=false;if(i){const v=i.v==null?24:i.v;if(i.kind==='ac'&&v>40)set(c,'burnt',true);else if(v>36&&i.kind==='dc')set(c,'burnt',true);else pw=i.kind==='dc'?(i.pol>0&&v>=10):(i.kind==='?'&&v>=10);}
  pw=pw&&!c.burnt;set(c,'pw',pw);set(c,'out',pw&&(c.contact==='NC'?!c.act:!!c.act));}
function drawSensor(c){const d=DEFS[c.type],S=SEN[c.type],pr=c.principle||S.pr,act=!!c.act;stub(c);
  if(c.pw){ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle=rgba(act?'#ffd166':'#7dd3fc',act?.7:.25);ctx.beginPath();ctx.ellipse(75,0,num(c.sn,8)*PXMM,num(c.sn,8)*PXMM*.7,0,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.restore();}
  tubeH(-62,-9,12,18,'#1f2933',3);line([[-62,0],[-74,0]],'#222',5);
  const body=pr==='photoelectric'?'#3d4753':pr==='capacitive'?'#cdbb92':'#c4ced7';tubeH(-50,-15,100,30,body,5);
  for(let x=-40;x<40;x+=5)line([[x,-15],[x+2,15]],'rgba(0,0,0,.18)',1);
  tubeH(8,-19,10,38,'#8d9aa8',2);tubeH(30,-19,10,38,'#8d9aa8',2);
  const face=pr==='inductive'?'#facc15':pr==='capacitive'?'#e5e7eb':'#111827';tubeH(50,-14,22,28,face,4);if(pr==='photoelectric'){ctx.beginPath();ctx.arc(61,0,8,0,TAU);ctx.fillStyle=GR(55,-8,67,8,[[0,'#7dd3fc'],[1,'#0b2a44']]);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();}
  if(act&&c.pw)glow(72,0,22,'rgba(255,209,102,.5)');
  led(-38,-10,'#22c55e',c.pw);led(-38,10,'#f59e0b',c.out);
  tx(c,`${c.outType} ${c.contact}`,10,26,COL.mut,7,'center',800);if(c.burnt)tx(c,'BURNT',0,0,COL.bad,9,'center',800);
  tx(c,c.label,0,-28,COL.text,9,'center',800);}
for(const k in SEN){const S=SEN[k];def(k,{name:S.name,tag:S.tag,cat:C_SEN,w:150,h:60,term:[['BN',-75,-20,-1,0],['BK',-75,0,-1,0],['BU',-75,20,-1,0]],pins:{BN:'brown +10…30 V DC',BK:'black output',BU:'blue 0 V'},sup:['BN','BU'],dcLoad:c=>c.pw?.012:0,relax:senRelax,draw:drawSensor,
 links:c=>(!c.pw||!c.out)?[]:(c.outType==='NPN'?[['BK','BU']]:[['BK','BN']]),
 init:{outType:S.out,contact:'NO',principle:S.pr,sn:S.sn,manual:false,act:false,pw:false,out:false,burnt:false},click:c=>{c.manual=!c.manual;},
 blurb:`${S.name}. BN +24 V, BU 0 V, BK output: NPN switches BK to 0 V (load between +24 V and BK); PNP switches BK to +24 V (load between BK and 0 V). Detects a Target within Sn (1 mm = ${PXMM} px) in front of its face; click = manual target.`,
 desc:c=>`Powered: ${c.pw?'yes':'NO'}\nTarget: ${c.act?'DETECTED':'none'}\nOutput: ${c.out?'ON':'off'} (${c.outType} ${c.contact})\nPrinciple: ${c.principle} · Sn ${c.sn} mm`,
 tick:(c,dt)=>{const r=detect(c,75,0,1,0,num(c.sn,8)*PXMM,c.principle||S.pr,c.act);c.act=!!(r.hit||c.manual);}});}
def('target',{name:'Sensing Target (metal / plastic / liquid)',tag:'TGT',cat:C_SEN,w:60,h:44,term:[],draw:c=>{const m=c.material,col={steel:'#8a97a5',stainless:'#c3ccd4',aluminium:'#d6dde3',brass:'#c9a24a',copper:'#b87333',plastic:'#4f8fd6',wood:'#a67c52',water:'#38bdf8',glass:'#bfe3f0',paper:'#f1efe6'}[m]||'#8a97a5';
  if(c.motion==='rotary'){ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(125,211,252,.4)';ctx.beginPath();ctx.arc(0,0,num(c.orbit,40),0,TAU);ctx.stroke();ctx.restore();}
  if(c.motion==='oscillate'){ctx.save();ctx.setLineDash([3,4]);line([[-num(c.amp,60),0],[num(c.amp,60),0]],'rgba(125,211,252,.4)',1);ctx.restore();}
  const x=num(c._dx,0),y=num(c._dy,0);ctx.save();ctx.translate(x,y);tubeH(-12,-12,24,24,col,3);line([[-8,-4],[8,-4]],'rgba(255,255,255,.4)',1);ctx.restore();tx(c,`${c.label} · ${m}`,0,-30,COL.text,8,'center',700);},
 init:{material:'steel',motion:'static',amp:60,period:3,rpm:60,orbit:40,_t:0,_dx:0,_dy:0},blurb:'Moves/oscillates in front of sensors and limit switches. Materials decide what each sensing principle can detect (inductive: metals only).',
 desc:c=>`Material: ${c.material}\nMotion: ${c.motion}`});

/* ---- encoder ---- */
function encRelax(st,c,set){const i=volts(st,c,'+V','0V');let pw=!!i&&i.kind!=='ac'&&(i.kind!=='dc'||i.pol>0)&&(i.v==null||(i.v>=10&&i.v<=30));if(i&&i.v>36)set(c,'burnt',true);set(c,'pw',pw&&!c.burnt);}
function drawEnc(c){stub(c);tubeH(-60,-30,80,60,'#9aa7b4',8);tubeH(20,-6,44,12,'#cfd8e1',3);line([[44,-6],[44,6]],'#555',2);
  ctx.save();ctx.beginPath();ctx.arc(-20,0,22,0,TAU);ctx.fillStyle='#0d1319';ctx.fill();ctx.translate(-20,0);ctx.rotate(num(c._ph,0)*TAU*.2);ctx.strokeStyle=c.pw?'#e2e8f0':'#64748b';ctx.lineWidth=2;for(let i=0;i<16;i++){ctx.rotate(TAU/16);ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(20,0);ctx.stroke();}ctx.restore();
  led(-52,-22,'#22c55e',c.pw);led(-52,22,'#f59e0b',c.sZ);tx(c,`${c.ppr} PPR ${c.outType}`,-10,40,COL.mut,7,'center',800);tx(c,`${Math.round(num(c.rpmNow,0))} rpm`,-10,-40,c.pw?COL.ok:COL.mut,8,'center',800);tx(c,c.label,0,-55,COL.text,9,'center',800);}
def('encoder',{name:'Incremental Encoder A/B/Z (24 V)',tag:'ENC',cat:C_SEN,w:130,h:130,term:[['+V',-65,-40,-1,0],['0V',-65,-20,-1,0],['A',-65,0,-1,0],['B',-65,20,-1,0],['Z',-65,40,-1,0]],pins:{'+V':'10…30 V DC','0V':'0 V',A:'channel A',B:'channel B (90° lag)',Z:'index pulse'},sup:['+V','0V'],dcLoad:c=>c.pw?.05:0,relax:encRelax,draw:drawEnc,
 links:c=>{if(!c.pw)return[];const a=[];for(const ch of['A','B','Z']){const hi=!!c['s'+ch];if(c.outType==='PNP'){if(hi)a.push([ch,'+V']);}else if(c.outType==='NPN'){if(hi)a.push([ch,'0V']);}else a.push([ch,hi?'+V':'0V']);}return a;},
 init:{ppr:1000,outType:'PNP',src:'auto',rpmMan:0,pw:false,burnt:false,cnt:0,_ph:0,sA:false,sB:false,sZ:false,rpmNow:0},blurb:'Incremental encoder: A, B (quadrature), Z (index) with PNP / NPN / push-pull outputs. Follows the nearest motor (or a manual rpm). Counts are exact; outputs are drawn at a visual rate ≤15 Hz.',
 desc:c=>`Speed: ${num(c.rpmNow,0).toFixed(0)} rpm\nCounts: ${Math.round(num(c.cnt,0))} cycles\nA/B/Z: ${+c.sA}${+c.sB}${+c.sZ}\nSupply: ${c.pw?'OK':'NO'}`,
 tick:(c,dt)=>{let rpm=num(c.rpmMan,0);if(c.src!=='manual'){let best=null,bd=280;for(const m of comps){if(!['acmotor','dcmotor','motor3','servomotor','steppermotor','motor'].includes(m.type))continue;const d=Math.hypot(m.x-c.x,m.y-c.y);if(d<bd){bd=d;best=m;}}rpm=best?(best.type==='motor'?num(best.spin,0)*2880:num(best.rpm,0)):0;}
  c.rpmNow=rpm;if(!c.pw){c.sA=c.sB=c.sZ=false;return;}const step=rpm/60*num(c.ppr,1000)*dt;c.cnt=num(c.cnt,0)+step;c._ph=((num(c._ph,0)+clamp(step,-.25,.25))%1+1)%1;
  c.sA=c._ph<.5;c.sB=((c._ph-.25+1)%1)<.5;c.sZ=((c.cnt%num(c.ppr,1000))+num(c.ppr,1000))%num(c.ppr,1000)<1.5;}});

/* ---- thermocouple / RTD / controller ---- */
function drawTC(c){const T=num(c.measured,25),hot=clamp((T-30)/600,0,1),col=TCC[c.ttype]||TCC.K;stub(c);slab(-82,-24,44,48,7,'#d6dde4','#6f8193');rr(-76,-18,32,36,4);ctx.fillStyle='#0f1923';ctx.fill();
  line([[-85,-12],[-70,-12]],col,3);line([[-85,12],[-70,12]],'#f1f5f9',3);tx(c,'+',-54,-12,col,9,'center',800);tx(c,'−',-54,12,'#f1f5f9',9,'center',800);tubeH(-38,-7,14,14,'#8d9aa8',3);tubeH(-24,-4,102,8,'#aab4bf',3);
  if(hot>.03)glow(78,0,16+12*hot,rgba('#ff7a2e',.25+.55*hot));dot(78,0,4.5,mixc('#9aa7b4','#ff6a1a',hot),1);tx(c,`Type ${c.ttype}`,-5,-22,col,8,'center',800);
  tx(c,c.label,0,-40,COL.text,9,'center',800);tx(c,`${T.toFixed(1)} °C · ${num(c.emf,0).toFixed(3)} mV`,0,30,c.over||c.open?COL.bad:COL.ok,8,'center',800);}
def('tc',{name:'Thermocouple (K J T E N R S B)',tag:'TC',cat:C_SEN,w:170,h:64,term:[['+',-85,-12,-1,0],['-',-85,12,-1,0]],pins:{'+':'positive leg (IEC colour by type)','-':'negative leg (white)'},draw:drawTC,
 init:{ttype:'K',tmode:'auto',tman:25,tau:4,reach:170,amb:25,cj:25,open:false,measured:25,emf:0,proc:25,over:false},blurb:'Thermocouple with IEC 60584 EMF tables. Reads the nearest hot component within its reach (or a manual temperature). Connect + / − to a Temperature Controller TC+ / TC−.',
 desc:c=>`Process: ${num(c.proc,25).toFixed(1)} °C (${c._src||''})\nSensor: ${num(c.measured,25).toFixed(1)} °C\nEMF: ${num(c.emf,0).toFixed(3)} mV (CJ ${c.cj} °C)\nRange: ${TCR[c.ttype][0]}…${TCR[c.ttype][1]} °C${c.over?'  OUT OF RANGE':''}`,
 tick:(c,dt)=>{const S=nearestHeat(c,num(c.reach,170)),T=c.tmode==='manual'?num(c.tman,25):(S?S.T:num(c.amb,25));c.proc=T;c._src=c.tmode==='manual'?'manual':(S?S.label:'ambient');lag(c,'measured',T,dt,Math.max(.1,num(c.tau,4)));
  const r=TCR[c.ttype]||TCR.K;c.over=c.measured>r[1]||c.measured<r[0];c.emf=c.open?NaN:tcEmf(c.ttype,c.measured)-tcEmf(c.ttype,num(c.cj,25));}});
function drawRTD(c){const T=num(c.measured,25);stub(c);slab(-82,-30,44,60,7,'#d6dde4','#6f8193');rr(-76,-24,32,48,4);ctx.fillStyle='#0f1923';ctx.fill();
  [[-20,'#ef4444','A'],[0,'#f1f5f9','B'],[20,'#f1f5f9','b']].forEach(q=>{line([[-85,q[0]],[-70,q[0]]],q[1],3);tx(c,q[2],-54,q[0],q[1],8,'center',800);});
  tubeH(-38,-7,14,14,'#8d9aa8',3);tubeH(-24,-4,100,8,'#c3ccd4',3);ctx.beginPath();for(let i=0;i<5;i++){ctx.moveTo(60+i*3,-3);ctx.lineTo(62+i*3,3);}ctx.strokeStyle='#555';ctx.stroke();tubeH(58,-5,22,10,'#e2e8f0',4);
  tx(c,c.rtype,-5,-36,COL.text,8,'center',800);tx(c,c.label,0,-48,COL.text,9,'center',800);tx(c,`${T.toFixed(1)} °C · ${num(c.res,0).toFixed(2)} Ω`,0,44,c.open?COL.bad:COL.ok,8,'center',800);}
def('rtd',{name:'RTD Pt100 / Pt1000 / Ni1000 / Cu50 (3-wire)',tag:'RTD',cat:C_SEN,w:170,h:70,term:[['A',-85,-20,-1,0],['B',-85,0,-1,0],['b',-85,20,-1,0]],pins:{A:'single lead (red)',B:'compensation lead (white)',b:'compensation lead (white)'},draw:drawRTD,
 init:{rtype:'Pt100',tmode:'auto',tman:25,tau:6,reach:170,amb:25,lead:.4,open:false,measured:25,res:109.7,proc:25},blurb:'3-wire resistance thermometer (IEC 60751 Callendar–Van Dusen). A on one side, B/b on the other. Connect to a Temperature Controller RTD input A/B/b.',
 desc:c=>`Process: ${num(c.proc,25).toFixed(1)} °C\nResistance: ${num(c.res,0).toFixed(2)} Ω (${c.rtype})`,
 tick:(c,dt)=>{const S=nearestHeat(c,num(c.reach,170)),T=c.tmode==='manual'?num(c.tman,25):(S?S.T:num(c.amb,25));c.proc=T;c._src=S?S.label:'ambient';lag(c,'measured',T,dt,Math.max(.1,num(c.tau,6)));c.res=c.open?Infinity:rtdR(c.rtype,c.measured);}});
function relaxCtrl(st,c,set){const i=volts(st,c,'L','N');set(c,'pw',!!i&&i.kind!=='dc');}
function ctrlRead(k,st){const R=(c,t)=>st.uf.find(key(c.id,t));
  if(TCT[k.inType]){const p=R(k,'TC+'),n=R(k,'TC-');for(const s of comps){if(s.type!=='tc')continue;const sp=R(s,'+'),sn=R(s,'-');
    if(sp===p&&sn===n){if(s.open)return{err:'SENSOR BREAK'};return{pv:tcInv(k.inType,s.emf+tcEmf(k.inType,25))};}
    if(sp===n&&sn===p){if(s.open)return{err:'SENSOR BREAK'};return{pv:tcInv(k.inType,-s.emf+tcEmf(k.inType,25)),rev:true};}}return{err:'NO SENSOR'};}
  const a=R(k,'A'),b=R(k,'B'),b2=R(k,'b');
  for(const s of comps){if(s.type!=='rtd')continue;if(R(s,'A')===a&&R(s,'B')===b){if(s.open)return{err:'SENSOR BREAK'};
    const comp=R(s,'b')===b2&&b2!==b;const Rm=s.res+(comp?0:(b2===b?2*num(s.lead,.4):NaN));if(!Number.isFinite(Rm))return{err:'LEAD BREAK b'};return{pv:rtdInv(k.inType,Rm),err:comp?'':''};}}
  return{err:'NO SENSOR'};}
function drawCtrl(c){stub(c);slab(-50,-90,100,180,5,'#2a323c','#111820');slab(-44,-84,88,100,3,'#0b1117','#050a0e');
  const pv=c.err?'----':num(c.pv,0).toFixed(1);tx(c,pv,0,-60,c.pw?'#ff4d4d':'#3a1515',20,'center',800);tx(c,num(c.sp,50).toFixed(1),0,-30,c.pw?'#35e08a':'#103020',14,'center',800);
  tx(c,c.err||`${c.inType} · ${c.cmode==='pid'?'PID':'ON/OFF'}`,0,-10,c.err?COL.bad:COL.mut,7,'center',800);
  led(-30,6,'#22c55e',c.out);led(-10,6,'#ef4444',c.alm);tx(c,'OUT',-30,16,COL.mut,6);tx(c,'AL1',-10,16,COL.mut,6);
  for(let i=0;i<4;i++){rr(-34+i*18,24,14,10,2);ctx.fillStyle='#3a4552';ctx.fill();}
  tx(c,c.label+' · TEMP CTRL',0,-100,COL.text,9,'center',800);tx(c,'TC+ TC− A B b',0,60,COL.mut,6);tx(c,c.pw?(c.run===false?'STOP':'RUN'):'NO POWER',0,70,c.pw?COL.ok:COL.mut,8,'center',800);}
def('tempctrl',{name:'Temperature Controller (TC / RTD input, relay output)',tag:'TIC',cat:C_SEN,w:130,h:200,term:[['L',-65,-60,-1,0],['N',-65,-38,-1,0],['O_C',65,-40,1,0],['O_NO',65,-18,1,0],['AL_C',65,12,1,0],['AL_NO',65,34,1,0],['TC+',-50,100,0,1],['TC-',-25,100,0,1],['A',0,100,0,1],['B',25,100,0,1],['b',50,100,0,1]],
 pins:{L:'supply 100–240 VAC',N:'neutral','O_C':'control relay COM','O_NO':'control relay NO','AL_C':'alarm relay COM','AL_NO':'alarm relay NO','TC+':'thermocouple +','TC-':'thermocouple −',A:'RTD A',B:'RTD B',b:'RTD b'},
 relax:relaxCtrl,draw:drawCtrl,acT:['L'],links:c=>[...(c.out?[['O_C','O_NO']]:[]),...(c.alm?[['AL_C','AL_NO']]:[])],click:c=>{c.run=c.run===false;},
 init:{inType:'K',sp:50,cmode:'onoff',action:'heat',hyst:2,kp:8,ti:60,td:10,cyc:4,alHi:150,offset:0,pw:false,out:false,alm:false,pv:NaN,err:'NO SENSOR',run:true,_o:false,_i:0,_e:0,_ph:0,_pIn:0,_iIn:0,_nlp:'diode'},
 blurb:'PID / on-off temperature controller. Input type selects TC (K J T E N R S B) or RTD (Pt100 / Pt1000). Wire a Thermocouple to TC+/TC− or an RTD to A/B/b. Output relay O_C–O_NO switches the heater; AL_C–AL_NO closes on high alarm or sensor error.',
 desc:c=>`PV: ${c.err?c.err:num(c.pv,0).toFixed(1)+' °C'}\nSP: ${c.sp} °C (${c.cmode})\nOutput: ${c.out?'ON':'off'}\nAlarm: ${c.alm?'ACTIVE':'off'}`,
 tick:(c,dt,st)=>{if(!c.pw){c.out=false;c.alm=false;c.pv=NaN;c._pIn=c._iIn=0;return;}c._pIn=4;c._iIn=4/230;const r=ctrlRead(c,st);c.err=r.err||'';
  if(r.rev){c.err='TC REVERSED';c.pv=NaN;c.out=false;c.alm=true;return;}
  if(r.pv==null){c.pv=NaN;c.out=false;c.alm=true;return;}c.pv=r.pv+num(c.offset,0);
  if(c.run===false){c.out=false;c.alm=false;return;}const sp=num(c.sp,50),heat=c.action!=='cool',e=heat?sp-c.pv:c.pv-sp;
  if(c.cmode==='pid'){const ki=num(c.ti,60)>0?1/num(c.ti,60):0;c._i=clamp(num(c._i,0)+e*dt,-100/Math.max(ki,.001)/num(c.kp,8),100/Math.max(ki,.001)/num(c.kp,8));const dd=dt>0?(e-num(c._e,0))/dt:0;c._e=e;const u=clamp(num(c.kp,8)*(e+ki*c._i+num(c.td,10)*dd),0,100);c._u=u;
    c._ph=num(c._ph,0)+dt;const cy=Math.max(1,num(c.cyc,4));if(c._ph>=cy)c._ph-=cy;c.out=(c._ph/cy*100)<u;}
  else{const h=num(c.hyst,2)/2;if(e>h)c._o=true;else if(e<-h)c._o=false;c.out=!!c._o;}
  c.alm=c.pv>num(c.alHi,150);}});

/* ---- solenoid valves ---- */
function svRelax(st,c,set){const d=DEFS[c.type],pt=d.coil2?null:['1','2'];
  const run=(a,b,was)=>coil(st,c,a,b,num(c.coilV,24),c.coilType||'DC',was,false);
  if(c.type==='sv52d'){const r1=run('Y14+','Y14-',c._y1),r2=run('Y12+','Y12-',c._y2);if(r1.burn||r2.burn)set(c,'burnt',true);set(c,'_y1',r1.on&&!c.burnt);set(c,'_y2',r2.on&&!c.burnt);
    if(c._y1&&!c._y2)set(c,'pos','A');else if(c._y2&&!c._y1)set(c,'pos','B');set(c,'on',c.pos==='A');c._cv=Math.max(r1.v,r2.v);c._msg=r1.msg||r2.msg;return;}
  const r=run('1','2',c.on);if(r.burn&&!c.burnt)set(c,'burnt',true);set(c,'on',!c.burnt&&(r.on||!!c.manual));c._cv=r.v;c._msg=r.msg;}
function svOpen(c){if(c.fault==='stuckClosed')return false;if(c.fault==='stuckOpen')return true;return c.type==='sv22no'?!c.on:!!c.on;}
function svPairs(c){switch(c.type){case'sv22nc':case'sv22no':return svOpen(c)?[['IN','OUT']]:[];case'sv32':return c.on?[['P','A']]:[['A','R']];case'sv52':return c.on?[['P','A'],['B','R']]:[['P','B'],['A','S']];case'sv52d':return c.pos==='A'?[['P','A'],['B','R']]:[['P','B'],['A','S']];}return[];}
function isoSym(c,x,y,w,h){const t=c.type;ctx.save();ctx.translate(x,y);ctx.fillStyle='#f4f1e6';ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle='#222';ctx.lineWidth=1;
  const box=(bx,on)=>{ctx.strokeRect(bx,-h/2+2,w/2-2,h-4);};
  const two=t!=='sv22nc'&&t!=='sv22no';ctx.strokeRect(-w/2+2,-h/2+2,w/2-3,h-4);ctx.strokeRect(1,-h/2+2,w/2-3,h-4);
  const a=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
  const q=-w/4,r=w/4;const open=t==='sv22no'||t==='sv22nc'?(c.type==='sv22no'?!c.on:c.on):0;
  if(t==='sv22nc'||t==='sv22no'){const ph=(t==='sv22no')?!c.on:c.on; /* active box */ a(q,-h/2+4,q,h/2-4);a(r,-h/2+4,r,-3);a(r-3,-3,r+3,-3);a(r,3,r,h/2-4);}
  else if(t==='sv32'){a(q,-h/2+4,q,h/2-4);a(q-2,-3,q,-6);a(r,-h/2+4,r,0);a(r,0,r-3,6);a(r,0,r+3,6);}
  else{a(q-3,h/2-5,q+3,-h/2+5);a(r-3,-h/2+5,r+3,h/2-5);}
  const act=c.on||c.pos==='A';ctx.fillStyle=act?'rgba(6,214,160,.25)':'rgba(0,0,0,0)';ctx.fillRect(act?1:-w/2+2,-h/2+2,w/2-3,h-4);ctx.restore();}
function drawSV(c){const d=DEFS[c.type],open=c.type.startsWith('sv22')?svOpen(c):c.on||c.pos==='A';c._x=num(c._x,0)+((c.on?1:0)-num(c._x,0))*Math.min(1,DT()*20);stub(c);
  tubeH(-40,24,80,34,'#c9a24a',6);ctx.fillStyle='#8a6a22';ctx.fillRect(-12,12,24,14);
  const dbl=c.type==='sv52d';tubeV(dbl?-42:-24,-44,dbl?32:48,56,'#1c2530',4);if(dbl)tubeV(10,-44,32,56,'#1c2530',4);
  ctx.fillStyle='#e5e7eb';ctx.fillRect(dbl?-38:-16,-48,dbl?24:32,6);if(dbl)ctx.fillRect(14,-48,24,6);
  led(dbl?-26:-8,-30,'#22c55e',c.on||c._y1);if(dbl)led(26,-30,'#22c55e',c._y2);
  isoSym(c,dbl?0:0,38,60,22);
  if(open&&!dbl){ctx.fillStyle='rgba(56,189,248,.4)';ctx.fillRect(-36,36,72,4);}
  tx(c,c.label+' · '+(c.type.startsWith('sv22')?(open?'OPEN':'CLOSED'):(c.on||c.pos==='A'?'ENERGISED':'SPRING')),0,-62,open?COL.ok:COL.text,8,'center',800);if(c.burnt)tx(c,'COIL BURNT',0,-14,COL.bad,8,'center',800);tx(c,`${c.coilV} V ${c.coilType}`,0,76,COL.mut,7);}
const SVD={sv22nc:{name:'Solenoid Valve 2/2 NC (IN-OUT)',w:90,h:130,term:[['IN',-45,40,-1,0,'h'],['OUT',45,40,1,0,'h'],['1',-20,-58,0,-1],['2',20,-58,0,-1],['PE',0,-58,0,-1]]},
 sv22no:{name:'Solenoid Valve 2/2 NO (IN-OUT)',w:90,h:130,term:[['IN',-45,40,-1,0,'h'],['OUT',45,40,1,0,'h'],['1',-20,-58,0,-1],['2',20,-58,0,-1],['PE',0,-58,0,-1]]},
 sv32:{name:'Solenoid Valve 3/2 NC (P-A-R)',w:100,h:130,term:[['P',-50,40,-1,0,'h'],['A',50,40,1,0,'h'],['R',0,68,0,1,'h'],['1',-20,-58,0,-1],['2',20,-58,0,-1],['PE',0,-58,0,-1]]},
 sv52:{name:'Solenoid Valve 5/2 single (P A B R S)',w:110,h:140,term:[['P',-55,20,-1,0,'h'],['A',55,5,1,0,'h'],['B',55,35,1,0,'h'],['R',-20,73,0,1,'h'],['S',20,73,0,1,'h'],['1',-20,-58,0,-1],['2',20,-58,0,-1],['PE',0,-58,0,-1]]},
 sv52d:{name:'Solenoid Valve 5/2 double (bistable, Y14/Y12)',w:120,h:140,term:[['P',-60,20,-1,0,'h'],['A',60,5,1,0,'h'],['B',60,35,1,0,'h'],['R',-20,73,0,1,'h'],['S',20,73,0,1,'h'],['Y14+',-42,-58,0,-1],['Y14-',-22,-58,0,-1],['Y12+',22,-58,0,-1],['Y12-',42,-58,0,-1]]}};
for(const k in SVD){const s=SVD[k];def(k,{name:s.name,tag:'YV',cat:C_SOL,w:s.w,h:s.h,term:s.term,draw:drawSV,relax:svRelax,
 sup:k==='sv52d'?['Y14+','Y14-']:['1','2'],dcLoad:c=>(c.on||c._y1||c._y2)&&c.coilType!=='AC'?num(c.watts,4)/num(c.coilV,24):0,
 init:{coilV:24,coilType:'DC',watts:4,on:false,manual:false,burnt:false,fault:'none',pos:'B',_y1:false,_y2:false,_x:0,coilT:25},click:c=>{c.manual=!c.manual;},
 pins:Object.fromEntries(s.term.map(t=>[t[0],t[5]?{IN:'inlet',OUT:'outlet',P:'pressure 1',A:'work 4/2',B:'work 2',R:'exhaust 3/5',S:'exhaust 5'}[t[0]]:{'1':'coil (DIN 43650 pin 1)','2':'coil (pin 2)','PE':'earth','Y14+':'coil 14 +','Y14-':'coil 14 −','Y12+':'coil 12 +','Y12-':'coil 12 −'}[t[0]]])),
 blurb:`${s.name}. Coil via DIN 43650 plug (1, 2, PE). Fluid ports pass water, steam, gas or air when the spool position allows. Click = manual override.`,
 desc:c=>`Coil: ${c.burnt?'BURNT':(c.on||c._y1)?'ENERGISED':'off'}${c.manual?' (manual)':''}\nSupply: ${num(c._cv,0).toFixed(1)} V\nCoil temp: ${num(c.coilT,25).toFixed(0)} °C\nFlow paths: ${svPairs(c).map(p=>p.join('→')).join(', ')||'none (closed)'}`,
 tick:(c,dt)=>{const P=(c.on||c._y1||c._y2)&&c.coilType==='AC'&&c.fault==='stuckClosed'?6:1,W=((c.on||c._y1||c._y2)?num(c.watts,4)*P:0);lag(c,'coilT',25+W*5,dt,90);if(c.coilT>155&&!c.burnt){c.burnt=true;log(`⚠ ${c.label} coil burnt out`);}}});}

/* ---- servo / stepper ---- */
function drawMotorBody(c,sq,rpm,ang){stub(c);tubeH(-60,-34,12,68,'#333c46',4);if(sq)slab(-50,-36,76,72,5,'#4b5563','#1f2933');else tubeH(-50,-34,76,68,'#3e6a9a',8);
  for(let i=0;i<6;i++)line([[-44+i*10,-32],[-44+i*10,32]],'rgba(0,0,0,.25)',1.5);slab(26,-40,14,80,3,'#cbd5df','#6b7785');tubeH(40,-7,34,14,'#cfd8e1',3);
  ctx.save();ctx.translate(74,0);ctx.rotate(ang);ctx.fillStyle='#8da2b6';ctx.fillRect(-3,-7,6,14);ctx.restore();line([[48,-7],[48,7]],'#555',2);}
function brkRelax(st,c,set){const r=coil(st,c,'BRK+','BRK-',24,'DC',c.brkRel,true);set(c,'brkRel',c.brake?r.on:true);}
def('servomotor',{name:'AC Servo Motor (U V W, brake 24 V, encoder)',tag:'SM',cat:C_MOT,w:140,h:100,term:[['U',-70,-30,-1,0],['V',-70,-10,-1,0],['W',-70,10,-1,0],['PE',-70,30,-1,0],['BRK+',-25,50,0,1],['BRK-',25,50,0,1]],pins:{U:'phase U',V:'phase V',W:'phase W',PE:'earth','BRK+':'holding brake +24 V','BRK-':'brake 0 V'},
 sup:['BRK+','BRK-'],dcLoad:c=>c.brake&&c.brkRel?.4:0,relax:brkRelax,
 draw:c=>{drawMotorBody(c,true,c.rpm,(c.ang||0)*Math.PI/180);ctx.fillStyle='#111';ctx.fillRect(-58,-16,6,32);tx(c,`${Math.round(num(c.rpm,0))} rpm`,0,-48,Math.abs(num(c.rpm,0))>1?COL.ok:COL.mut,9,'center',800);tx(c,`${(num(c.ang,0)%360).toFixed(1)}°  ${num(c.T,0).toFixed(2)} Nm`,0,64,COL.mut,8);tx(c,c.brake?(c.brkRel?'BRAKE RELEASED':'BRAKE ENGAGED'):'',0,76,c.brkRel?COL.ok:COL.warn,7,'center',800);tx(c,c.label,0,-60,COL.text,9,'center',800);},
 init:{ratedRpm:3000,ratedT:1.27,ratedI:2.6,load:.2,brake:false,brkRel:true,rpm:0,vel:0,ang:0,T:0,I:0,temp:25},blurb:'AC servo (400 W class). Power U/V/W from a Servo Drive (swapping two phases reverses direction). Optional 24 V holding brake. Built-in encoder follows position.',
 desc:c=>`Speed: ${num(c.rpm,0).toFixed(0)} rpm\nPosition: ${num(c.ang,0).toFixed(1)}°\nTorque: ${num(c.T,0).toFixed(2)} / ${c.ratedT} Nm\nCurrent: ${num(c.I,0).toFixed(2)} A\nTemp: ${num(c.temp,25).toFixed(0)} °C`});
def('servodrive',{name:'Servo Drive 230 VAC (speed / position)',tag:'SD',cat:C_MOT,w:180,h:240,term:[['L',-90,-90,-1,0],['N',-90,-65,-1,0],['PE',-90,-40,-1,0],['DICOM',-90,-5,-1,0],['SON',-90,20,-1,0],['RUN',-90,45,-1,0],['DIR',-90,70,-1,0],['RST',-90,95,-1,0],['U',90,-90,1,0],['V',90,-65,1,0],['W',90,-40,1,0],['PEM',90,-15,1,0],['RDY_C',90,25,1,0],['RDY_NO',90,50,1,0],['ALM_C',90,80,1,0],['ALM_NO',90,105,1,0]],
 pins:{L:'mains L',N:'mains N',PE:'earth',DICOM:'digital-input common (0 V)',SON:'servo-on (24 V)',RUN:'run / start move (24 V)',DIR:'reverse (24 V)',RST:'alarm reset (24 V)',U:'to motor U',V:'to motor V',W:'to motor W',PEM:'motor earth',RDY_C:'ready relay COM',RDY_NO:'ready relay NO (closed when ready)',ALM_C:'alarm relay COM',ALM_NO:'alarm relay NO (closed on alarm)'},
 relax:(st,c,set)=>{const pw=live(st,c,'L','N');set(c,'pw',pw);const di=k=>pw&&live(st,c,k,'DICOM');set(c,'son',di('SON'));set(c,'run',di('RUN'));set(c,'dir',di('DIR'));set(c,'rst',di('RST'));},
 links:c=>[...(c.pw&&!c.alarm?[['RDY_C','RDY_NO']]:[]),...(c.pw&&c.alarm?[['ALM_C','ALM_NO']]:[])],acT:['L'],click:c=>{c._cmdRst=true;},
 draw:c=>{stub(c);slab(-72,-110,144,220,6,'#d5dbe2','#8793a0');rr(-54,-98,108,60,3);ctx.fillStyle='#0a1a22';ctx.fill();tx(c,c.state||'OFF',0,-84,c.alarm?COL.bad:c.state==='RUN'?COL.ok:COL.warn,13,'center',800);tx(c,c.alarm||`${c.mode==='position'?'POSITION':'SPEED'} · ${c.mode==='position'?c.moveDeg+'°':c.speedCmd+' rpm'}`,0,-62,c.alarm?COL.bad:COL.mut,7,'center',800);tx(c,c._mot?'MOTOR '+c._mot:'NO MOTOR',0,-48,COL.mut,7);
  [['SON',c.son],['RUN',c.run],['DIR',c.dir],['RST',c.rst]].forEach((q,i)=>{led(-45+i*30,-24,'#22c55e',q[1]);tx(c,q[0],-45+i*30,-12,COL.mut,6);});led(-45,6,'#06d6a0',c.pw&&!c.alarm);led(-15,6,'#ef4444',!!c.alarm);tx(c,'RDY',-45,18,COL.mut,6);tx(c,'ALM',-15,18,COL.mut,6);
  tx(c,c.label,0,-122,COL.text,9,'center',800);tx(c,'SERVO DRIVE',0,50,'#556',9,'center',800);},
 init:{mode:'speed',speedCmd:1500,moveDeg:360,accel:200,pw:false,son:false,run:false,dir:false,rst:false,state:'OFF',alarm:'',tgt:0,inPos:false,_nlp:'diode',_pIn:0,_iIn:0},blurb:'Single-phase 230 V servo amplifier. Digital inputs (24 V against DICOM): SON enables, RUN runs (speed mode) or starts a relative move (position mode), DIR reverses, RST resets alarms. Dry contacts RDY / ALM. Wire U/V/W to a Servo Motor.',
 desc:c=>`State: ${c.state}\n${c.alarm}\nMode: ${c.mode}\nMotor: ${c._mot||'—'}\nInput: ${num(c._pIn,0).toFixed(0)} W`,
 tick:(d,dt,st)=>{let m=null,w=null;for(const x of comps)if(x.type==='servomotor'){const q=wire3(st,d,['U','V','W'],x,['U','V','W']);if(q.n>0){m=x;w=q;break;}}d._mot=m?m.label:'';
  if((d.rst&&!d._rp)||d._cmdRst){d.alarm='';d._cmdRst=false;d._ot=0;}d._rp=!!d.rst;const edge=d.run&&!d._runP;d._runP=!!d.run;
  if(!d.pw){d.state='OFF';if(m){m.vel=num(m.vel,0)*Math.exp(-dt/1.5);m.rpm=m.vel/6;m.ang=num(m.ang,0)+m.vel*dt;m.T=0;m.I=0;}d._pIn=d._iIn=0;return;}
  if(d.son&&!d.alarm){if(!m)d.alarm='AL.03 MOTOR NOT CONNECTED';else if(!w.ok)d.alarm='AL.02 PHASE LOSS / WIRING';}
  const en=d.son&&!d.alarm&&m&&w.ok;d.state=d.alarm?'ALARM':en?'RUN':'READY';if(!en)d._mv=false;let P=25;
  if(m){const rated=num(m.ratedRpm,3000),acc=rated*6*1000/Math.max(20,num(d.accel,200)),sg=(d.dir?-1:1)*(w&&w.rev?-1:1);let vd=0;
    if(en){if(d.mode==='position'){if(edge&&!d._mv){d.tgt=num(m.ang,0)+sg*num(d.moveDeg,360);d._mv=true;d.inPos=false;}
      if(d._mv){const rem=d.tgt-num(m.ang,0);vd=Math.sign(rem)*Math.min(num(d.speedCmd,1500)*6,Math.sqrt(2*acc*Math.abs(rem)));if(Math.abs(rem)<.4&&Math.abs(num(m.vel,0))<30){d._mv=false;d.inPos=true;m.ang=d.tgt;vd=0;m.vel=0;}}}
      else vd=d.run?sg*num(d.speedCmd,1500)*6:0;}
    const brk=m.brake&&!m.brkRel;if(brk&&Math.abs(vd)>0){m.vel=0;d._bt=num(d._bt,0)+dt;if(d._bt>2)d.alarm='AL.16 BRAKE NOT RELEASED';}else d._bt=0;
    const stall=Math.abs(num(m.load,0))>3*num(m.ratedT,1.27);
    if(en&&!brk&&!stall)m.vel=num(m.vel,0)+clamp(vd-num(m.vel,0),-acc*dt,acc*dt);else if(!en)m.vel=num(m.vel,0)*Math.exp(-dt/2);else m.vel=0;
    m.ang=num(m.ang,0)+m.vel*dt;m.rpm=m.vel/6;m.T=Math.abs(num(m.load,0))+(en?.25*num(m.ratedT,1.27)*clamp(Math.abs(vd-m.vel)/(acc*.1),0,1):0);m.I=num(m.ratedI,2.6)*(m.T/num(m.ratedT,1.27)+.15);
    lag(m,'temp',25+55*Math.pow(m.I/num(m.ratedI,2.6),2),dt,60);
    if(m.T>1.8*num(m.ratedT,1.27)&&en){d._ot=num(d._ot,0)+dt;if(d._ot>3)d.alarm='AL.07 OVERLOAD';}else d._ot=Math.max(0,num(d._ot,0)-dt);
    P+=Math.abs(m.T*m.vel*Math.PI/180)/.85+(en?40:0);}
  d._pIn=P;d._iIn=P/(230*.65);}});
def('steppermotor',{name:'Stepper Motor NEMA 17/23 bipolar (A+ A− B+ B−)',tag:'SPM',cat:C_MOT,w:120,h:100,term:[['A+',-60,-30,-1,0],['A-',-60,-10,-1,0],['B+',-60,10,-1,0],['B-',-60,30,-1,0]],pins:{'A+':'coil A start (black)','A-':'coil A end (green)','B+':'coil B start (red)','B-':'coil B end (blue)'},
 draw:c=>{drawMotorBody(c,true,c.rpm,(c.ang||0)*Math.PI/180);tx(c,`${Math.round(num(c.rpm,0))} rpm`,0,-48,c.stall?COL.bad:Math.abs(num(c.rpm,0))>1?COL.ok:COL.mut,9,'center',800);tx(c,c.stall?'STALLED / LOST STEPS':`${num(c.ang,0).toFixed(1)}° · ${Math.round(num(c.steps,0))} steps`,0,64,c.stall?COL.bad:COL.mut,8,'center',800);tx(c,c.label+` · ${c.hold} Nm`,0,-60,COL.text,9,'center',800);},
 init:{stepDeg:1.8,hold:.45,ratedA:1.5,rpmMax0:900,load:.1,rpm:0,vel:0,ang:0,steps:0,stall:false,temp:25},blurb:'Two-phase 1.8° stepper. Coil A = A+/A−, coil B = B+/B−. Swapping the leads of one coil reverses direction; an open coil stops it. Loses steps above its pull-out speed.',
 desc:c=>`Speed: ${num(c.rpm,0).toFixed(0)} rpm\nAngle: ${num(c.ang,0).toFixed(1)}°\nSteps: ${Math.round(num(c.steps,0))}\n${c.stall?'STALLED':''}\nTemp: ${num(c.temp,25).toFixed(0)} °C`});
def('stepperdrive',{name:'Stepper Driver (VCC GND PUL DIR ENA A± B±)',tag:'SPD',cat:C_MOT,w:170,h:200,term:[['VCC',-30,-100,0,-1],['GND',30,-100,0,-1],['PUL+',-85,-65,-1,0],['PUL-',-85,-40,-1,0],['DIR+',-85,-10,-1,0],['DIR-',-85,15,-1,0],['ENA+',-85,45,-1,0],['ENA-',-85,70,-1,0],['A+',85,-55,1,0],['A-',85,-30,1,0],['B+',85,0,1,0],['B-',85,25,1,0]],
 pins:{VCC:'DC supply + (9–48 V)',GND:'DC supply −','PUL+':'pulse + (5–24 V)','PUL-':'pulse −','DIR+':'direction +','DIR-':'direction −','ENA+':'enable +','ENA-':'enable −','A+':'motor A+','A-':'motor A−','B+':'motor B+','B-':'motor B−'},
 sup:['VCC','GND'],dcLoad:c=>c.pw?(c.en2?num(c.current,1.5)*.6+.1:.05):0,
 relax:(st,c,set)=>{const i=volts(st,c,'VCC','GND');let pw=false;if(i){const v=i.v==null?24:i.v;if(i.kind==='dc'&&i.pol<0)set(c,'dead',true);else if(v>num(c.vmax,48)*1.2)set(c,'dead',true);else pw=i.kind==='dc'&&v>=9&&v<=num(c.vmax,48);set(c,'vcc',v);}
  set(c,'pw',pw&&!c.dead);set(c,'pul',c.pw&&live(st,c,'PUL+','PUL-'));set(c,'dirS',c.pw&&live(st,c,'DIR+','DIR-'));set(c,'ena',c.pw&&live(st,c,'ENA+','ENA-'));},
 click:c=>{c.dead=false;},
 draw:c=>{stub(c);slab(-70,-90,140,180,5,'#1d4ed8','#0b1f66');rr(-50,-76,100,38,3);ctx.fillStyle='#08112a';ctx.fill();tx(c,c.dead?'DESTROYED':c.state||'NO POWER',0,-64,c.dead||c.stall?COL.bad:c.pw?COL.ok:COL.mut,11,'center',800);tx(c,`${c.micro}x µstep · ${c.current} A · ${c.pmode}`,0,-48,'#9fb0ff',7,'center',700);
  [['PUL',c.pul],['DIR',c.dirS],['ENA',c.ena],['PWR',c.pw]].forEach((q,i)=>{led(-45+i*30,-20,'#22c55e',q[1]);tx(c,q[0],-45+i*30,-8,'#9fb0ff',6);});
  for(let i=0;i<6;i++){rr(-50+i*18,10,14,18,2);ctx.fillStyle=i<3?'#e5e7eb':'#9ca3af';ctx.fill();}tx(c,'DIP: µstep / current',0,40,'#9fb0ff',7);
  tx(c,c.label+' · STEPPER DRIVER',0,-110,COL.text,9,'center',800);tx(c,`${num(c._f,0).toFixed(0)} Hz`,0,60,COL.ok,9,'center',800);},
 init:{micro:8,current:1.5,vmax:48,pmode:'run',freq:800,burst:200,accel:4000,enaMode:'disable',pw:false,pul:false,dirS:false,ena:false,vcc:0,dead:false,state:'NO POWER',_f:0,_q:0,en2:false,stall:false},
 blurb:'TB6600/DM542-style driver. Pulse (PUL±) and direction (DIR±) are opto inputs (5–24 V). Run mode: steps at the set frequency while PUL is on; Index mode: every rising edge on PUL moves a burst of steps. ENA± ON disables the motor (typical). Wrong supply polarity/overvoltage destroys it.',
 desc:c=>`State: ${c.state}\nSupply: ${num(c.vcc,0).toFixed(1)} V\nStep rate: ${num(c._f,0).toFixed(0)} Hz\nMotor: ${c._mot||'—'}`,
 tick:(d,dt,st)=>{let m=null,w=null;for(const x of comps)if(x.type==='steppermotor'){const q=wire2ph(st,d,x);if(q.n>0){m=x;w=q;break;}}d._mot=m?m.label:'';
  if(!d.pw){d.state=d.dead?'DESTROYED':'NO POWER';d.en2=false;d._f=0;if(m){m.rpm=0;m.vel=0;}return;}
  const en=d.pw&&(d.enaMode==='enable'?d.ena:!d.ena);d.en2=en;const edge=d.pul&&!d._pp;d._pp=!!d.pul;if(d.pmode==='index'&&edge)d._q=num(d._q,0)+num(d.burst,200);
  let ft=0;if(d.pmode==='run')ft=d.pul?num(d.freq,800):0;else if(d._q>0)ft=Math.min(num(d.freq,800),Math.sqrt(2*num(d.accel,4000)*d._q+25));
  const a=Math.max(100,num(d.accel,4000));d._f=num(d._f,0)+clamp(ft-num(d._f,0),-a*dt,a*dt);if(d._f<.5&&ft===0)d._f=0;
  if(!m){d.state=en?'NO MOTOR':'DISABLED';return;}if(!w.ok){d.state='OPEN / MISWIRED COIL';m.vel=0;m.rpm=0;return;}
  const degP=num(m.stepDeg,1.8)/Math.max(1,num(d.micro,8)),rpm=d._f*degP/6,Teff=num(m.hold,.45)*clamp(num(d.current,1.5)/num(m.ratedA,1.5),0,1.3),ld=num(m.load,.1);
  const rmax=num(m.rpmMax0,900)*clamp(num(d.vcc,24)/24,.5,2)*(Teff>0?(1-clamp(ld/Teff,0,1)):0);
  if(en&&d._f>0&&(rpm>rmax||ld>Teff*.98))m.stall=true;if(d._f<5)m.stall=false;
  if(en&&d._f>0&&!m.stall){const sg=(d.dirS?-1:1)*w.sign,n=d._f*dt;m.ang=num(m.ang,0)+sg*n*degP;m.steps=num(m.steps,0)+sg*n/Math.max(1,num(d.micro,8));m.vel=sg*rpm*6;m.rpm=m.vel/6;if(d.pmode==='index')d._q=Math.max(0,d._q-n);}else{m.vel=0;m.rpm=0;}
  const I=en?num(d.current,1.5):0;lag(m,'temp',25+65*Math.pow(I/num(m.ratedA,1.5),2)*(en?1:0),dt,90);
  d.state=!en?'DISABLED':m.stall?'STALL':d._f>0?'RUNNING':'HOLDING';if(m.temp>95)d.state='OVERTEMP';}});

/* ---- ACB / VCB ---- */
function brkDef(kind){const acb=kind==='acb',ph=acb?['L1','L2','L3','N']:['L1','L2','L3'],ys=acb?[-75,-50,-25,0]:[-60,-30,0],term=[],pins={};
  ph.forEach((p,i)=>{term.push([p+'_in',-125,ys[i],-1,0],[p+'_out',125,ys[i],1,0]);pins[p+'_in']='line side '+p;pins[p+'_out']='load side '+p;});
  const ctl=acb?['XF+','XF-','MX+','MX-','M+','M-','OF_C','OF_NO','OF_NC','SD_C','SD_NO']:['CC+','CC-','TC+','TC-','M+','M-','OF_C','OF_NO','OF_NC','SD_C','SD_NO'];
  const desc={ 'XF+':'closing coil +','XF-':'closing coil −','MX+':'shunt trip +','MX-':'shunt trip −','CC+':'closing coil +','CC-':'closing coil −','TC+':'trip coil +','TC-':'trip coil −','M+':'spring-charge motor +','M-':'spring-charge motor −',OF_C:'aux COM',OF_NO:'aux NO (closed when ON)',OF_NC:'aux NC (closed when OFF)',SD_C:'trip-alarm COM',SD_NO:'trip-alarm NO'};
  ctl.forEach((id,i)=>{term.push([id,-110+22*i,i%2?138:114,0,1]);pins[id]=desc[id];});
  def(kind,{name:acb?'ACB Air Circuit Breaker 3P+N (LSIG, draw-out)':'VCB Vacuum Circuit Breaker 3P (draw-out)',tag:acb?'ACB':'VCB',cat:C_SW,w:250,h:240,term,pins,
   init:{rating:acb?800:1250,kv:acb?.69:12,ctlV:24,ctlKind:'DC',closed:false,tripped:false,position:'connected',spring:0,chargeT:5,ir:1,tr:12,isd:6,tsd:.2,ii:12,heat:0,_cause:'',ops:0,wear:0,gfOn:true,tg:.4,I1:0,I2:0,I3:0,_sd:0,_gt:0},
   links:c=>{const a=[];if(c.closed&&c.position==='connected'&&!c.tripped&&!c._noLink)ph.forEach(p=>a.push([p+'_in',p+'_out']));a.push(c.closed?['OF_C','OF_NO']:['OF_C','OF_NC']);if(c.tripped)a.push(['SD_C','SD_NO']);return a;},
   click:c=>{if(c.closed)c._cmdOpen=true;else c._cmdClose=true;},draw:acb?drawACB:drawVCB,tick:(c,dt,st,gx)=>brkTick(c,dt,st,gx,acb),
   blurb:acb?'Low-voltage ACB 3P+N with LSIG trip unit (Ir, tr, Isd, tsd, Ii, ground fault), motor-charged spring, closing coil XF, shunt trip MX, draw-out positions, OF/SD aux contacts. Close needs a charged spring: supply M+/M− or use Charge spring.':'Medium-voltage vacuum breaker with spring mechanism: closing coil CC, trip coil TC, charging motor M, aux OF, trip-alarm SD and draw-out truck. Wire a protection relay TRIP to TC+ to trip it. Contact wear is tracked.',
   desc:c=>`State: ${c.tripped?'TRIPPED':c.closed?'CLOSED':'OPEN'} · ${c.position}\nSpring: ${c.spring>=1?'CHARGED':Math.round(c.spring*100)+'%'}\nCurrents: ${[c.I1,c.I2,c.I3].map(x=>num(x,0).toFixed(0)).join(' / ')} A\nThermal: ${Math.round(clamp(c.heat,0,1)*100)}%\n${c._cause?'Cause: '+c._cause:''}\nOperations: ${c.ops||0}${acb?'':'\nContact wear: '+num(c.wear,0).toFixed(1)+'%'}`});}
function relayTripped(st,c,term){const r=st.uf.find(key(c.id,term));return comps.some(x=>['overcurrentrelay','differentialrelay','distanceprotection','generatorprotection'].includes(x.type)&&x.tripped&&st.uf.find(key(x.id,'TRIP'))===r);}
function brkTick(c,dt,st,gx,acb){const cs=acb?['XF+','XF-']:['CC+','CC-'],ts=acb?['MX+','MX-']:['TC+','TC-'],cv=num(c.ctlV,24),ct=c.ctlKind||'DC';
  const ctl=c.position!=='disconnected';const rc=ctl?coil(st,c,cs[0],cs[1],cv,ct,false,false):{on:false},rt=ctl?coil(st,c,ts[0],ts[1],cv,ct,false,false):{on:false},rm=ctl?coil(st,c,'M+','M-',cv,ct,c._mo,false):{on:false};c._mo=rm.on;
  if(c._lp&&c.closed&&c.position!==c._lp){c.position=c._lp;log(`⚠ ${c.label}: cannot move a closed breaker`);}if(!c.closed)c._lp=c.position;
  if(rm.on&&c.spring<1)c.spring=Math.min(1,c.spring+dt/Math.max(.5,num(c.chargeT,5)));
  const trip=(why,fault)=>{if(!c.closed)return;c.closed=false;c.tripped=true;c._cause=why;c.ops++;if(!acb&&fault)c.wear=num(c.wear,0)+3;log(`⚠ ${c.label} TRIPPED: ${why}`);};
  const edge=rc.on&&!c._cp;c._cp=rc.on;
  if(c.closed&&(c._cmdOpen||rt.on)){c.closed=false;c.ops++;c._cause=rt.on?'SHUNT TRIP':'MANUAL OPEN';if(!acb)c.wear=num(c.wear,0)+.02;}c._cmdOpen=false;
  if(c.closed&&relayTripped(st,c,ts[0]))trip('PROTECTION RELAY',true);
  if(!c.closed&&(edge||c._cmdClose)){if(c.tripped)log(`${c.label}: reset the trip before closing`);else if(rt.on)log(`${c.label}: trip coil energised — cannot close`);else if(c.spring<1)log(`${c.label}: spring not charged`);else{c.closed=true;c.spring=0;c.ops++;c._cause='';}}c._cmdClose=false;
  if(c.closed&&c.position==='connected'){const {I,L}=downAmps(c,['L1_out','L2_out','L3_out']);c.I1=I[0];c.I2=I[1];c.I3=I[2];const In=num(c.rating,800),Ir=Math.max(1,num(c.ir,1)*In),Im=Math.max(...I),m=Im/Ir;
    if(m>1.05)c.heat+=dt*m*m/(Math.max(.5,num(c.tr,12))*36);else c.heat=Math.max(0,c.heat-dt*.02);if(c.heat>=1)trip('LONG-TIME OVERLOAD (Ir/tr)',false);
    if(Im>=num(c.isd,6)*Ir){c._sd+=dt;if(c._sd>=num(c.tsd,.2))trip('SHORT-TIME (Isd/tsd)',true);}else c._sd=0;
    if(Im>=num(c.ii,12)*In)trip('INSTANTANEOUS (Ii)',true);
    const gf=acb&&c.gfOn&&L.some(x=>x.c.fault==='earth'&&x.c.powered);if(gf){c._gt+=dt;if(c._gt>=num(c.tg,.4))trip('GROUND FAULT (Ig)',true);}else c._gt=0;
    if(sim.short&&c.closed){c.closed=false;const clr=!evalCircuit().cl.short;if(clr){c.tripped=true;c._cause='SHORT CIRCUIT';c.ops++;if(!acb)c.wear=num(c.wear,0)+5;log(`⚠ ${c.label} cleared a short circuit`);}else c.closed=true;}}
  else{c.I1=c.I2=c.I3=0;c.heat=Math.max(0,c.heat-dt*.1);}
  c._cl=num(c._cl,0)+((c.closed?1:0)-num(c._cl,0))*Math.min(1,dt*12);
  if(c.tripped)(gx&&gx.hazards||[]).push(`${c.label} TRIPPED — ${c._cause}`);if(!acb&&c.wear>100)(gx&&gx.warnings||[]).push(`${c.label}: vacuum interrupter end of life`);}
function drawACB(c){const cl=num(c._cl,0),ys=[-75,-50,-25,0];stub(c);slab(-100,-110,200,208,10,'#3a4350','#1b212a');
  for(let i=0;i<9;i++)line([[-84+i*21,-106],[-84+i*21,-98]],'#10151b',3);
  rr(-90,-94,180,110,4);ctx.fillStyle='#0b1016';ctx.fill();ctx.strokeStyle='#050709';ctx.stroke();
  ys.forEach((y,i)=>{const col=['#ffb020','#ff4fa0','#b07cff','#4da6ff'][i];line([[-100,y],[-62,y]],'#b87333',6);line([[100,y],[62,y]],'#b87333',6);dot(-60,y,5,'#e5e9ee',1);dot(60,y,5,'#e5e9ee',1);
    line([[-60,y],[60-(1-cl)*0,y-(1-cl)*18]],cl>.5?COL.ok:'#dfe6ee',4);if(c.tripped){ctx.save();ctx.globalAlpha=.4+.4*Math.sin(AN()*20);glow(0,y,20,'rgba(255,100,50,.5)');ctx.restore();}});
  slab(-100,24,200,74,6,'#d3dae2','#8e99a6');lcd(c,-92,30,86,40,true);
  tx(c,`I ${num(c.I1,0).toFixed(0)}/${num(c.I2,0).toFixed(0)}/${num(c.I3,0).toFixed(0)} A`,-49,40,COL.ok,8,'center',800);tx(c,`Ir ${(num(c.ir,1)*num(c.rating,800)).toFixed(0)}  Isd ${c.isd}  Ii ${c.ii}`,-49,53,COL.mut,6);
  rr(-92,58,86,8,2);ctx.fillStyle='#08130f';ctx.fill();rr(-92,58,86*clamp(c.heat,0,1),8,2);ctx.fillStyle=c.heat>.7?COL.bad:COL.ok;ctx.fill();
  const flag=(x,y,txt0,col,on)=>{rr(x,y,40,16,3);ctx.fillStyle=on?col:'#58606a';ctx.fill();tx(c,txt0,x+20,y+8,'#fff',8,'center',800);};
  flag(0,30,c.closed?'ON':'OFF',c.closed?'#dc2626':'#16a34a',true);flag(46,30,c.spring>=1?'CHARGED':Math.round(c.spring*100)+'%',c.spring>=1?'#eab308':'#6b7280',true);
  ctx.fillStyle='#111';rr(0,52,38,16,3);ctx.fill();tx(c,'I  ON',19,60,'#fff',8,'center',800);ctx.fillStyle='#e5e7eb';rr(46,52,40,16,3);ctx.fill();tx(c,'O  OFF',66,60,'#222',8,'center',800);
  ['CONN','TEST','DISC'].forEach((p,i)=>{const on=(c.position==='connected'&&i===0)||(c.position==='test'&&i===1)||(c.position==='disconnected'&&i===2);rr(-92+i*30,78,28,12,2);ctx.fillStyle=on?'#2563eb':'#9aa4ae';ctx.fill();tx(c,p,-78+i*30,84,'#fff',6,'center',800);});
  tx(c,c.tripped?'TRIPPED: '+c._cause:`${c.rating} A · ${c.kv} kV`,46,84,c.tripped?'#ff8a8a':'#e2e8f0',7,'center',800);tx(c,c.label+' · ACB',0,-122,COL.text,9,'center',800);}
function drawVCB(c){const cl=num(c._cl,0),ys=[-60,-30,0];stub(c);slab(-100,-90,200,186,8,'#6f7b88','#2c343e');
  ys.forEach((y,i)=>{line([[-125,y],[-95,y]],'#b87333',7);line([[125,y],[95,y]],'#b87333',7);tubeH(-92,y-12,184,24,'#c9a46a',6);tubeH(-32,y-10,64,20,'#cfe8f4',5);ctx.globalAlpha=.55;ctx.fillStyle='#bfe3f0';ctx.fillRect(-30,y-8,60,16);ctx.globalAlpha=1;
    const gap=(1-cl)*14;line([[-90,y],[-4-gap/2+4,y]],'#e5e9ee',4);line([[90,y],[4+gap/2-4,y]],'#e5e9ee',4);dot(-gap/2,y,4,'#cbd5df',1);dot(gap/2,y,4,'#cbd5df',1);if(c.tripped&&Math.sin(AN()*18)>0)glow(0,y,18,'rgba(160,200,255,.7)');});
  slab(-96,22,192,74,5,'#c7ced6','#7e8996');
  tx(c,c.closed?'CLOSED':'OPEN',-60,36,c.closed?'#dc2626':'#16a34a',10,'center',800);rr(-4,28,90,12,2);ctx.fillStyle=c.spring>=1?'#eab308':'#6b7280';ctx.fill();tx(c,c.spring>=1?'SPRING CHARGED':'SPRING DISCHARGED',41,34,'#fff',7,'center',800);
  rr(-90,48,60,16,2);ctx.fillStyle='#08130f';ctx.fill();tx(c,String(Math.round(num(c.ops,0))).padStart(6,'0'),-60,56,COL.ok,9,'center',800);
  tx(c,`I ${num(c.I1,0).toFixed(0)}/${num(c.I2,0).toFixed(0)}/${num(c.I3,0).toFixed(0)} A`,40,52,'#e2e8f0',8,'center',800);tx(c,`wear ${num(c.wear,0).toFixed(1)}%`,40,64,num(c.wear,0)>80?'#ff8a8a':'#cbd5e1',7);
  ['CONN','TEST','DISC'].forEach((p,i)=>{const on=(c.position==='connected'&&i===0)||(c.position==='test'&&i===1)||(c.position==='disconnected'&&i===2);rr(-92+i*30,76,28,12,2);ctx.fillStyle=on?'#2563eb':'#9aa4ae';ctx.fill();tx(c,p,-78+i*30,82,'#fff',6,'center',800);});
  tx(c,c.tripped?'TRIPPED: '+c._cause:`${c.kv} kV · ${c.rating} A`,46,86,c.tripped?'#ff8a8a':'#e2e8f0',7,'center',800);tx(c,c.label+' · VCB',0,-100,COL.text,9,'center',800);}
brkDef('acb');brkDef('vcb');

/* ---- harmonic filter ---- */
const ATT={passive5:{3:.15,5:.85,7:.35,9:.2,11:.25,13:.2},passive7:{3:.1,5:.35,7:.85,9:.15,11:.4,13:.3},passive57:{3:.15,5:.8,7:.8,9:.2,11:.4,13:.3},detuned:{3:.1,5:.25,7:.3,9:.15,11:.2,13:.2}};
const ORD=[3,5,7,9,11,13];
function drawHF(c){stub(c);slab(-65,-75,130,150,5,'#cfd6dd','#7e8a97');for(let i=0;i<3;i++){const x=-38+i*38;ctx.strokeStyle='#b45309';ctx.lineWidth=3;for(let k=0;k<5;k++){ctx.beginPath();ctx.ellipse(x,-58+k*7,10,3,0,0,TAU);ctx.stroke();}tubeV(x-8,-22,16,30,'#2563eb',4);}
  rr(-56,14,112,52,3);ctx.fillStyle='#08130f';ctx.fill();const on=c.on&&c.sup;
  ORD.forEach((h,i)=>{const x=-48+i*17,b=num(c.spB&&c.spB[i],0),a=num(c.spA&&c.spA[i],0),m=Math.max(1,num(c._mx,1));ctx.fillStyle='#ef4444';ctx.fillRect(x,64-36*clamp(b/m,0,1),6,36*clamp(b/m,0,1));ctx.fillStyle='#22c55e';ctx.fillRect(x+7,64-36*clamp(a/m,0,1),6,36*clamp(a/m,0,1));tx(c,String(h),x+7,70-0,COL.mut,6);});
  tx(c,`THDi ${num(c.thdB,0).toFixed(0)}% → ${num(c.thdA,0).toFixed(0)}%`,0,22,on?COL.ok:COL.mut,8,'center',800);led(52,-62,'#22c55e',on);
  tx(c,c.label+' · '+({passive5:'5th',passive7:'7th',passive57:'5th+7th',detuned:'detuned',active:'ACTIVE'}[c.ftype]||'')+' filter',0,-86,COL.text,9,'center',800);tx(c,c.res||(on?(num(c.thdA,0)>num(c.limit,8)?'THDi above limit':'within limit'):(c.sup?'FILTER OFF':'NO 3-PHASE SUPPLY')),0,90,c.res?COL.bad:on?(num(c.thdA,0)>num(c.limit,8)?COL.warn:COL.ok):COL.mut,8,'center',800);}
def('harmfilter',{name:'Harmonic Filter (passive / detuned / active)',tag:'HF',cat:C_PQ,w:140,h:160,term:[['L1',-70,-40,-1,0],['L2',-70,-20,-1,0],['L3',-70,0,-1,0],['N',-70,20,-1,0],['PE',-70,40,-1,0]],pins:{L1:'phase L1',L2:'phase L2',L3:'phase L3',N:'neutral',PE:'earth'},draw:drawHF,
 init:{ftype:'passive5',on:true,ratedA:100,kvar:25,ssc:5,limit:8,sup:false,thdB:0,thdA:0,vthd:0,spB:[0,0,0,0,0,0],spA:[0,0,0,0,0,0],_mx:1,res:''},click:c=>{c.on=!c.on;},
 blurb:'Shunt harmonic filter on a 3-phase bus. Finds the non-linear loads on the same network (VFD, UPS, PSU, drives, chargers), computes THDi before/after for the selected type, estimates voltage THD from the source short-circuit power, and flags parallel resonance with PFC capacitors.',
 desc:c=>`State: ${c.on&&c.sup?'FILTERING':c.sup?'off':'no supply'}\nTHDi: ${num(c.thdB,0).toFixed(1)}% → ${num(c.thdA,0).toFixed(1)}%\nVTHD: ${num(c.vthd,0).toFixed(1)}% (Ssc ${c.ssc} MVA)\n${c.res||''}`,
 tick:(c,dt,st,gx)=>{const ph=['L1','L2','L3'],ty=ph.map(t=>ntype(st,c,t));c.sup=ty.every(t=>PHs.has(t))&&new Set(ty).size===3;const roots=ph.map(t=>st.uf.find(key(c.id,t)));
  const I=[0,0,0],H=[{},{},{}];for(const x of collectLoads(st.uf)){const k=roots.indexOf(x.r);if(k<0)continue;I[k]+=x.I;const sp=NLP[x.nl];if(sp)for(const h of ORD)H[k][h]=(H[k][h]||0)+x.I*(sp[h]||0)*.85;}
  const Ia=(I[0]+I[1]+I[2])/3,B=ORD.map(h=>(H[0][h]||0)/3+(H[1][h]||0)/3+(H[2][h]||0)/3);const act=c.on&&c.sup;let A=B.slice();
  if(act){if(c.ftype==='active'){const tot=Math.sqrt(B.reduce((s,v)=>s+v*v,0)),f=tot>0?Math.min(.95,num(c.ratedA,100)/tot*.95):0;A=B.map(v=>v*(1-f));}else{const t=ATT[c.ftype]||ATT.passive5;A=B.map((v,i)=>v*(1-t[ORD[i]]));}}
  const thd=a=>Ia>.01?Math.sqrt(a.reduce((s,v)=>s+v*v,0))/Ia*100:0;c.spB=B;c.spA=A;c._mx=Math.max(1,...B);c.thdB=thd(B);c.thdA=thd(A);
  const Zs=Math.pow(230,2)/(num(c.ssc,5)*1e6/3);c.vthd=Math.sqrt(A.reduce((s,v,i)=>s+Math.pow(v*ORD[i]*Zs,2),0))/230*100;
  let Qc=0;for(const k of comps)if((k.type==='capacitorbank'||k.type==='pfccap')&&k.connected&&roots.includes(st.uf.find(key(k.id,'A'))))Qc+=num(k.kvar,0);
  c.res='';if(Qc>0&&c.ftype!=='detuned'){const hr=Math.sqrt(num(c.ssc,5)*1000/Qc);for(const h of[5,7,11])if(Math.abs(hr-h)<.8&&B[ORD.indexOf(h)]>.2)c.res=`PFC capacitors resonate near ${hr.toFixed(1)}th`;}
  if(c.res)(gx&&gx.warnings||[]).push(`${c.label}: ${c.res}`);else if(act&&c.thdA>num(c.limit,8)&&Ia>1)(gx&&gx.warnings||[]).push(`${c.label}: THDi ${c.thdA.toFixed(0)}% above limit`);}});

/* ---- UPS ---- */
const UPSM={OFF:'OFF',ONLINE:'ONLINE',ECO:'ECO',BATTERY:'ON BATTERY',BYPASS:'BYPASS',FAULT:'OVERLOAD / FAULT',SHUTDOWN:'BATTERY EMPTY'};
function drawUPS(c){const three=c.type==='ups3';stub(c);slab(-85,-95,170,190,6,'#2a3039','#12161b');slab(-78,-88,156,100,4,'#1b212a','#0e1217');lcd(c,-68,-80,136,56,true);
  const m=c.mode||'OFF';tx(c,UPSM[m]||m,0,-68,m==='ONLINE'||m==='ECO'?COL.ok:m==='BATTERY'||m==='BYPASS'?COL.warn:COL.bad,12,'center',800);
  tx(c,`OUT ${m==='OFF'?0:(three?400:230)} V · LOAD ${num(c._loadPct,0).toFixed(0)}%`,0,-50,COL.text,8,'center',700);tx(c,`BATT ${num(c.soc,0).toFixed(0)}% · ${c._runMin>0?Math.min(999,c._runMin).toFixed(0)+' min':'—'}`,0,-38,num(c.soc,0)<25?COL.bad:COL.mut,8,'center',700);
  [['NORMAL','#22c55e',m==='ONLINE'||m==='ECO'],['BATT','#f59e0b',m==='BATTERY'],['BYPASS','#facc15',m==='BYPASS'],['FAULT','#ef4444',m==='FAULT'||m==='SHUTDOWN']].forEach((q,i)=>{led(-54+i*36,-8,q[1],q[2]);tx(c,q[0],-54+i*36,4,COL.mut,6);});
  rr(-60,22,120,10,3);ctx.fillStyle='#08130f';ctx.fill();rr(-60,22,120*clamp(num(c.soc,0)/100,0,1),10,3);ctx.fillStyle=c.soc<25?COL.bad:COL.ok;ctx.fill();tx(c,'BATTERY',0,40,COL.mut,7);
  rr(-60,48,120,10,3);ctx.fillStyle='#08130f';ctx.fill();rr(-60,48,120*clamp(num(c._loadPct,0)/100,0,1.2),10,3);ctx.fillStyle=c._loadPct>100?COL.bad:COL.warn;ctx.fill();tx(c,'LOAD',0,66,COL.mut,7);
  tx(c,c.label+(three?' · UPS 3Φ':' · UPS 1Φ')+` ${c.kva} kVA`,0,-108,COL.text,9,'center',800);tx(c,c._alm||'',0,106,COL.bad,8,'center',800);}
function upsTerms(three){const t=[];if(three){['IN1','IN2','IN3','INN'].forEach((id,i)=>t.push([id,-100,-75+i*20,-1,0]));t.push(['PE',-100,15,-1,0]);['OUT1','OUT2','OUT3','OUTN'].forEach((id,i)=>t.push([id,100,-75+i*20,1,0]));t.push(['OUTPE',100,15,1,0]);}
  else{[['IN_L',-75],['IN_N',-55],['PE',-35],['BYP_L',0],['BYP_N',20]].forEach(q=>t.push([q[0],-100,q[1],-1,0]));[['OUT_L',-75],['OUT_N',-55],['OUT_PE',-35]].forEach(q=>t.push([q[0],100,q[1],1,0]));}
  ['OB_C','OB_NO','LB_C','LB_NO','AL_C','AL_NO'].forEach((id,i)=>t.push([id,-55+i*22,i%2?132:110,0,1]));return t;}
function upsDef(three){const k=three?'ups3':'ups1';def(k,{name:three?'UPS Online 3-phase (double conversion)':'UPS Online 1-phase (double conversion / eco)',tag:three?'UPS3':'UPS',cat:C_PQ,w:200,h:220,term:upsTerms(three),
 pins:three?{IN1:'mains L1',IN2:'mains L2',IN3:'mains L3',INN:'mains N',PE:'earth',OUT1:'out L1',OUT2:'out L2',OUT3:'out L3',OUTN:'out N',OUTPE:'out earth',OB_C:'on-battery COM',OB_NO:'on-battery NO',LB_C:'low-battery COM',LB_NO:'low-battery NO',AL_C:'alarm COM',AL_NO:'alarm NO'}:{IN_L:'mains line',IN_N:'mains neutral',PE:'earth',BYP_L:'bypass line (optional)',BYP_N:'bypass neutral',OUT_L:'output line',OUT_N:'output neutral',OUT_PE:'output earth',OB_C:'on-battery COM',OB_NO:'on-battery NO',LB_C:'low-battery COM',LB_NO:'low-battery NO',AL_C:'alarm COM',AL_NO:'alarm NO'},
 acT:three?['IN1','IN2','IN3']:['IN_L'],draw:drawUPS,click:c=>{c.on=!c.on;},
 links:c=>{const a=[];if(c.mode==='BYPASS'){if(three)a.push(['IN1','OUT1'],['IN2','OUT2'],['IN3','OUT3'],['INN','OUTN']);else a.push(c._bypW?['BYP_L','OUT_L']:['IN_L','OUT_L'],c._bypW?['BYP_N','OUT_N']:['IN_N','OUT_N']);}
  else if(c.mode==='ECO'){if(three)a.push(['IN1','OUT1'],['IN2','OUT2'],['IN3','OUT3'],['INN','OUTN']);else a.push(['IN_L','OUT_L'],['IN_N','OUT_N']);}
  if(c.mode==='BATTERY')a.push(['OB_C','OB_NO']);if(c._lb)a.push(['LB_C','LB_NO']);if(c._alm)a.push(['AL_C','AL_NO']);if(!c._noLink)a.push(three?['PE','OUTPE']:['PE','OUT_PE']);return a.filter(p=>!c._noLink||!/^(IN|BYP|OUT)/.test(p[1])||p[0].startsWith('OB')||p[0].startsWith('LB')||p[0].startsWith('AL')||p[1]==='OUT_PE'||p[1]==='OUTPE'?true:false);},
 init:{kva:three?20:3,pf:.9,on:true,topology:'online',vbat:three?192:72,ah:three?40:9,soc:100,lowPct:25,eff:three?.95:.94,ichg:three?4:1,battFault:false,mode:'OFF',_inOK:false,_bypOK:false,_outInv:false,_bypL:false,_ecoL:false,_olT:0,_loadPct:0,_runMin:0,_alm:'',_lb:false,_nlp:three?'six':'pfc'},
 blurb:`${three?'3-phase':'Single-phase'} online UPS: ONLINE (double conversion) or ECO, battery backup (time compressed ×${TCOMP}), automatic static bypass on overload, dry contacts On-Battery / Low-Battery / Alarm. Click to switch on/off.`,
 desc:c=>`Mode: ${UPSM[c.mode]||c.mode}\nLoad: ${num(c._loadPct,0).toFixed(0)}% (${num(c._loadW,0).toFixed(0)} W)\nBattery: ${num(c.soc,0).toFixed(0)}% · ~${num(c._runMin,0).toFixed(0)} min\nInput: ${num(c._pIn,0).toFixed(0)} W\n${c._alm||''}`,
 tick:(c,dt,st,gx)=>upsTick(c,dt,st,gx,three)});}
function upsTick(c,dt,st,gx,three){c._noLink=true;let uf;try{uf=buildUF();}finally{c._noLink=false;}
  const rs=(three?['OUT1','OUT2','OUT3']:['OUT_L']).map(t=>uf.find(key(c.id,t)));let P=0,S=0;for(const x of collectLoads(uf))if(rs.includes(x.r)){P+=x.P;S+=x.I*230;}
  const rating=num(c.kva,1)*1000;c._loadW=P;c._loadPct=S/rating*100;c._bypW=wires.some(w=>!w.broken&&((w.a.c===c.id&&String(w.a.t).startsWith('BYP'))||(w.b.c===c.id&&String(w.b.t).startsWith('BYP'))));
  const mains=!!c._inOK,byp=three?mains:(c._bypW?!!c._bypOK:mains);if(c.battFault)c.soc=0;let mode;
  if(!c.on)mode='OFF';else{const ol=c._loadPct;c._olT=ol>105?c._olT+dt:Math.max(0,c._olT-dt);const over=ol>150||c._olT>(ol>125?5:30);
    if(c._ovl&&ol<95)c._ovl=false;if(over)c._ovl=true;
    if(c._ovl)mode=byp?'BYPASS':'FAULT';else if(mains)mode=(c.topology==='eco')?'ECO':'ONLINE';else mode=c.soc>5?'BATTERY':'SHUTDOWN';}
  c.mode=mode;c._outInv=mode==='ONLINE'||mode==='BATTERY';c._bypL=mode==='BYPASS';c._ecoL=mode==='ECO';
  const Vb=Math.max(12,num(c.vbat,72)),Ah=Math.max(1,num(c.ah,9));let Pdc=0;
  if(mode==='BATTERY'){Pdc=P/.93+.02*rating;c.soc=Math.max(0,c.soc-Pdc/(Vb*Ah)*dt/3600*100*TCOMP);}
  if(mains&&c.on&&c.soc<100&&!c.battFault){const tp=c.soc<90?1:.3,I=num(c.ichg,1)*tp;c.soc=Math.min(100,c.soc+I*.9/Ah*dt/3600*100*TCOMP);c._pch=I*Vb;}else c._pch=0;
  c._runMin=Pdc>0?c.soc/100*Vb*Ah*.8/Pdc*60:(P>0?c.soc/100*Vb*Ah*.8/(P/.93+.02*rating)*60:0);
  c._lb=(mode==='BATTERY'&&c.soc<=num(c.lowPct,25))||mode==='SHUTDOWN';
  const alm=mode==='FAULT'?'OVERLOAD — OUTPUT OFF':mode==='SHUTDOWN'?'BATTERY EMPTY — OUTPUT OFF':c._lb?'LOW BATTERY':mode==='BYPASS'?'ON BYPASS (overload)':mode==='BATTERY'?'ON BATTERY':c.battFault?'BATTERY FAULT':c._ovl?'OVERLOAD':'';
  c._alm=(mode==='BATTERY'&&!c._lb)?'':alm;const w=(gx&&gx.warnings)||[],h=(gx&&gx.hazards)||[];
  if(mode==='FAULT'||mode==='SHUTDOWN')h.push(`${c.label}: ${alm}`);else if(alm)w.push(`${c.label}: ${alm}`);
  let Pin=0;if(mains&&c.on){Pin=(mode==='ONLINE'?P/num(c.eff,.94):P/.98)+(c._pch||0)/.9+.02*rating*.3;}c._pIn=Pin;c._iIn=Pin/(three?3*230*.95:230*.95);}
upsDef(false);upsDef(true);

/* ---- dryer ---- */
function drawDryer(c){const st=c.svc==='steam',wt=c.svc==='water';stub(c);tubeH(-60,-30,120,50,st?'#8a97a5':'#5b8db8',22);
  ctx.save();rr(-56,-26,112,42,18);ctx.clip();ctx.fillStyle='rgba(8,18,28,.55)';ctx.fillRect(-60,-30,120,50);ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;for(let i=0;i<5;i++){const x=-40+i*20;ctx.beginPath();ctx.moveTo(x,-26);ctx.lineTo(x+10,-5);ctx.lineTo(x,16);ctx.stroke();}
  if(c.svc!=='idle')for(let i=0;i<8;i++){const p=(AN()*.6+i/8)%1;dot(-56+p*112,-14+((i*13)%26),1.6,st?'#e2e8f0':'#7dd3fc',.8);}ctx.restore();
  tubeV(-14,20,28,30,'#6b7a8a',4);rr(-8,24,16,24,2);ctx.fillStyle='#08131c';ctx.fill();const lv=clamp(num(c.level,0)/100,0,1);ctx.fillStyle=lv>.85?COL.bad:'#2a8bd0';ctx.fillRect(-7,47-22*lv,14,22*lv);
  tx(c,c.label+' · DRYER',0,-48,COL.text,9,'center',800);tx(c,st?`STEAM  x ${num(c.xin,92)}% → ${num(c.xout,0).toFixed(1)}%`:wt?`WATER  air ${num(c.airIn,3)}% → ${num(c.airOut,0).toFixed(2)}%`:'IDLE',0,-36+84,st||wt?COL.ok:COL.mut,8,'center',800);
  tx(c,c.drainOK?'':'NO DRAIN',34,34,COL.bad,8,'center',800);}
def('dryer',{name:'Steam & Water Line Dryer (moisture separator)',tag:'DRY',cat:C_PRC,w:150,h:150,term:[['IN',-75,-5,-1,0,'h'],['OUT',75,-5,1,0,'h'],['COND_OUT',0,75,0,1,'h']],pins:{IN:'inlet (steam or water)',OUT:'outlet — dry steam / de-aerated water',COND_OUT:'condensate drain → steam trap'},draw:drawDryer,
 init:{xin:92,eff:.95,flow:5000,airIn:3,svc:'idle',drainOK:false,level:0,xout:0,airOut:0,cond:0,dp:0},blurb:'Chevron-vane separator for steam lines (raises dryness fraction, drains condensate through COND_OUT — fit a steam trap) and for water lines (removes entrained air/vapour). Needs a drain, otherwise it floods and carry-over returns.',
 desc:c=>`Service: ${c.svc}\n${c.svc==='steam'?`Dryness in/out: ${c.xin}% / ${num(c.xout,0).toFixed(1)}%\nCondensate: ${num(c.cond,0).toFixed(0)} kg/h`:`Entrained air in/out: ${c.airIn}% / ${num(c.airOut,0).toFixed(2)}%`}\nPot level: ${num(c.level,0).toFixed(0)}%\nΔP: ${num(c.dp,0).toFixed(2)} bar`,
 tick:(c,dt,st,gx)=>{const has=(t,k)=>{if(!window.PR)return false;const s=PR.S.get(PR.uf.find(key(c.id,t)));return!!s&&s.has(k);};const steam=has('IN','steam'),water=!steam&&has('IN','water');c.svc=steam?'steam':water?'water':'idle';
  c.drainOK=wires.some(w=>!w.broken&&((w.a.c===c.id&&w.a.t==='COND_OUT')||(w.b.c===c.id&&w.b.t==='COND_OUT')));const eff=num(c.eff,.95)*(c.drainOK?1:.25)*(1-.6*clamp(c.level/100,0,1));
  if(steam){const x=num(c.xin,92)/100;c.xout=100*(1-(1-x)*(1-eff));c.cond=num(c.flow,5000)*(c.xout/100-x);c.dp=.1+num(c.flow,5000)/10000*.15;c.level=clamp(c.level+((c.cond/120)-(c.drainOK?c.cond/120*1.3+.5:0))*dt,0,100);
    if(window.PR&&c.cond>0){try{const r=PR.uf.find(key(c.id,'COND_OUT'));let s=PR.S.get(r);if(!s)PR.S.set(r,s=new Set());s.add('water');}catch(e){}}
    if(!c.drainOK)(gx&&gx.warnings||[]).push(`${c.label}: no condensate drain (COND_OUT → steam trap)`);if(c.level>=95)(gx&&gx.warnings||[]).push(`${c.label}: FLOODED — wet-steam carry-over`);}
  else{c.level=Math.max(0,c.level-dt*2);if(water){c.airOut=num(c.airIn,3)*(1-eff);c.dp=.15;}c.cond=0;}}});

/* ───────── 4-STROKE ENGINE + SHAFT COUPLING + FUEL / OIL RESOURCES ───────── */
const C_ENG='Engines & Drive Trains',C_CMP='Compressors & Blowers',ENG_TC=120;
const CMP_TYPES=['aircompressor1','aircompressor2','gascompressor1','gascompressor2'];
const DRIVEN=['generator','motor','gearpump','feedwaterpump','gasboosterpump','steamboosterpump','gascompressor',...CMP_TYPES];
function compressorPowerKw(c){const air=c.type.startsWith('air');const base=air?(c.type.endsWith('1')?5:11):(c.type.endsWith('1')?8:16);return Math.max(.5,num(c.powerKw,base)*clamp(num(c.stages,c.type.endsWith('1')?1:2)/(c.type.endsWith('1')?1:2),.5,2));}
function shaftLoadKw(m){if(!m._shaftRun)return 0;if(m.type==='motor')return num(m.hp,1)*.746;if(m.type==='gearpump')return num(m.hp,1)*.746*(0.6+0.4*num(m.headK,1));if(CMP_TYPES.includes(m.type))return m.on!==false?compressorPowerKw(m):0;return 4;}
const FUELS={diesel:{sub:'diesel',bsfc:215,dens:.84,fire:140,pre:true},gasoline:{sub:'gasoline',bsfc:270,dens:.74,fire:180,pre:false},gas:{sub:'gas',bsfc:230,dens:0,fire:180,pre:false}};
const FUEL_COL={diesel:'#d97706',gasoline:'#dc2626',gas:'#2563eb'};
const visRpm=r=>{r=Math.abs(r);return r<120?r:120+(r-120)*.04;};
const subAt=(c,t,k)=>{if(!window.PR)return false;const s=PR.S.get(PR.uf.find(key(c.id,t)));return!!s&&s.has(k);};
const addSub=(c,t,k)=>{if(!window.PR)return;const r=PR.uf.find(key(c.id,t));let s=PR.S.get(r);if(!s)PR.S.set(r,s=new Set());s.add(k);};
const useRoot=(c,t)=>{if(window.PR)PR.cons.add(PR.uf.find(key(c.id,t)));};
const srcTank=(type,c,term,flt)=>{if(!window.PR)return null;const r=PR.uf.find(key(c.id,term));return comps.find(t=>t.type===type&&PR.uf.find(key(t.id,'OUT'))===r&&flt(t))||null;};
const engGeom=c=>{const n=clamp(Math.round(num(c.nCyl,6)),1,12),Vd=n*Math.PI/4*Math.pow(num(c.bore,110),2)*num(c.stroke,125)/1e6;return{n,Vd,kw:num(c.bmep,16)*Vd*num(c.ratedRpm,1500)/1200};};
/* ── shaft-driven air / gas compressors — same visual family as the turbine redraw (skid, faceted casing, blade window, shaft line, lamp box) ── */
const pipeC=(P,col,w)=>{for(const q of [['#06101c',w+3],['#56697f',w+1.5],['#a3b0bd',w-1],[col||'#152538',w-3.5]]){ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=q[0];ctx.lineWidth=q[1];ctx.stroke();}};
function drawCompressor(c){const air=c.type.startsWith('air'),st=Math.max(1,Math.round(num(c.stages,c.type.endsWith('1')?1:2))),run=!!(c._shaftRun&&c.on&&c._supplied),col=air?'#38bdf8':'#f59e0b',body=air?'#6d8499':'#94703f',w=run?AN()*TAU:0;
 /* skid + shaft line — identical base to the turbine */
 ctx.fillStyle='#202a36';rr(-76,44,152,10,3);ctx.fill();ctx.fillStyle='#46566a';ctx.fillRect(-66,40,132,5);
 ctx.fillStyle='#a3b0bd';ctx.fillRect(-74,-3,150,6);ctx.save();ctx.setLineDash([4,6]);ctx.lineDashOffset=-w*6;line([[-74,0],[80,0]],'rgba(0,0,0,.35)',5);ctx.restore();
 /* faceted casing — same silhouette language as the turbine (air = steam-steel, gas = gas-bronze) */
 const P=[[-70,-24],[-22,-33],[36,-42],[36,42],[-22,33],[-70,24]];
 shadow(()=>{ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=GR(0,-42,0,42,[[0,mixc(body,'#ffffff',.35)],[.5,body],[1,mixc(body,'#000000',.5)]]);ctx.fill();});
 ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.strokeStyle='rgba(0,0,0,.72)';ctx.lineWidth=1;ctx.stroke();
 /* suction / discharge nozzles at the fluid terminals (thick multi-stroke pipe, like the turbine ports) */
 pipeC([[-84,-22],[-70,-22]],air?'#7fb6d9':'#d9b06a',10);
 pipeC([[36,-22],[84,-22]],run?col:'#5a6a78',11);
 /* external interstage run for multi-stage units */
 if(st>1)pipeC([[-34,-46],[-4,-56],[30,-46]],run?col:'#5a6a78',7);
 /* rotor window with animated blade rows — same blading field as the turbine */
 rr(-54,-16,68,32,4);ctx.fillStyle='#0a121c';ctx.fill();ctx.strokeStyle='rgba(0,0,0,.8)';ctx.stroke();
 if(run){rr(-54,-16,68,32,4);ctx.fillStyle=GR(-54,0,14,0,[[0,air?'rgba(190,225,255,.35)':'rgba(255,170,60,.4)'],[1,'rgba(255,255,255,.04)']]);ctx.fill();}
 const rows=st>1?2:1;
 for(let r=0;r<rows;r++){const cyy=rows>1?-8+r*16:0,L=rows>1?7:11;
  for(let k=0;k<6;k++){const x=-49+k*10.4;for(let b=0;b<7;b++){const y=cyy+Math.sin(w+b*Math.PI/7+r*.6+k*.4)*L;ctx.fillStyle=run?'#e7eef5':'#8795a5';ctx.fillRect(x-1.2,y-2,2.4,4);}}}
 if(rows>1){ctx.fillStyle='#3a4655';ctx.fillRect(-54,-1,68,2);ctx.fillRect(-54,-17,68,2);ctx.fillRect(-54,15,68,2);}
 /* discharge flow animation */
 if(run){ctx.save();ctx.setLineDash([6,10]);ctx.lineDashOffset=-AN()*70;line([[38,-22],[80,-22]],'rgba(255,255,255,.55)',2);ctx.setLineDash([]);ctx.restore();}
 /* status lamp box — same trio as the turbine exhaust box */
 rr(42,-16,20,34,3);ctx.fillStyle='#1b2430';ctx.fill();ctx.strokeStyle='rgba(0,0,0,.8)';ctx.stroke();
 [['#06d6a0',-8],['#ffd166',0],['#4da6ff',8]].forEach(q=>{ctx.beginPath();ctx.arc(52,q[1],3,0,TAU);ctx.fillStyle=q[0];ctx.fill();});
 if(run)glow(0,0,70,rgba(col,.14));
 tx(c,st>1?'MULTI-STAGE':'SINGLE-STAGE',0,27,col,7,'center',700);
 led(-66,44,run?'#22c55e':'#64748b',run);
 head(c,(air?'AIR':'GAS')+' · '+st+' STAGE'+(st>1?'S':''),'',run?COL.ok:(c._shaftRun?COL.warn:COL.mut));}
function cmpTick(c,dt,st,gx){dt=Math.min(dt,.1);const air=c.type.startsWith('air'),inT=air?'AIR_IN':'GAS_IN',outT=air?'AIR_OUT':'GAS_OUT',kind=air?'air':'gas';
 const supplied=!!subAt(c,inT,kind);c._supplied=supplied;const stages=clamp(Math.round(num(c.stages,c.type.endsWith('1')?1:2)),1,6),pIn0=air?.18:2.5,pOutT=num(c.pressureBar,air?8:20),pInT=air?.22:num(c.inletBar,2.5);
 const driving=!!(c.on&&c._shaftRun);const running=driving&&supplied;const ratio=Math.max(1,pOutT/Math.max(.1,pInT));const per=Math.pow(ratio,1/stages);
 lag(c,'_pIn',running?pInT:0,dt,1.2);lag(c,'_pOut',running?pOutT:0,dt,1.6);lag(c,'_tOut',running?num(c.amb,25)+(air?18:26)*Math.log(per)+stages*(air?4:7):num(c.amb,25),dt,2.5);
 lag(c,'flow',running?num(c.ratedFlow,air?80:120):0,dt,1.4);lag(c,'rpm',running?Math.min(3600,900+220*stages+60*num(c._shaftRun?1:0)):0,dt,1.8);lag(c,'kwOut',running?compressorPowerKw(c)*clamp(.55+.45*Math.min(1,ratio/8),0,1):0,dt,2);
 c.pressure=running?num(c._pOut,0):0;c.temperature=num(c._tOut,num(c.amb,25));c.running=running;c.powered=!!c._shaftRun;
 c.state=!c.on?'OFF':!c._shaftRun?'NO SHAFT DRIVE':!supplied?(air?'NO AIR AT AIR_IN':'NO GAS AT GAS_IN'):'RUNNING';
 if(c._shaftRun&&c.on&&!supplied)(gx&&gx.warnings||[]).push(`${c.label}: compressor armed but no ${kind} at ${inT}`);}
const CMP_DEF=(type,name,tag,air,stages)=>({name,tag,cat:C_CMP,w:180,h:132,term:[[air?'AIR_IN':'GAS_IN',-84,-22,-1,0,'h'],[air?'AIR_OUT':'GAS_OUT',84,-22,1,0,'h'],['SHAFT',0,64,0,1]],
 pins:{[air?'AIR_IN':'GAS_IN']:(air?'suction air':'suction gas')+' inlet',[air?'AIR_OUT':'GAS_OUT']:(air?'discharge air':'discharge gas')+' outlet',SHAFT:'drive shaft in — wire to engine / turbine / coupling'},draw:drawCompressor,click:c=>{c.on=!c.on;},tick:cmpTick,
 init:{on:true,stages,pressureBar:air?8:20,inletBar:air?.22:2.5,ratedFlow:air?80:120,ratedKw:air?(stages>1?11:5):(stages>1?16:8),powerKw:air?(stages>1?11:5):(stages>1?16:8),eff:.72,amb:25,pressure:0,flow:0,temperature:25,running:false,powered:false,rpm:0,kwOut:0,state:'',_supplied:false},
 blurb:(air?'Shaft-driven ':'Shaft-driven ')+(stages>1?'multi-stage ':'single-stage ')+(air?'air':'process-gas')+' compressor. Wire '+ (air?'AIR_IN ← air source and AIR_OUT → consumer':'GAS_IN ← gas source and GAS_OUT → consumer')+'; drive it from an engine or turbine SHAFT through a coupling / gearbox / belt / chain. Discharge pressure, interstage count, flow and shaft kW are adjustable.',
 desc:c=>`State: ${c.state||'—'}\nDrive: ${c._shaftRun?'shaft OK':'NO SHAFT'} · ${num(c.rpm,0).toFixed(0)} rpm\n${air?'Air':'Gas'}: ${num(c._pIn,0).toFixed(2)} → ${num(c._pOut,0).toFixed(1)} bar · ${(num(c.flow,0)).toFixed(1)} m³/h\nDischarge temp: ${num(c.temperature,25).toFixed(1)} °C · Shaft load ${num(c.kwOut,0).toFixed(1)} kW`});
def('aircompressor1',CMP_DEF('aircompressor1','Air Compressor — Single Stage','AC1',true,1));
def('aircompressor2',CMP_DEF('aircompressor2','Air Compressor — Two Stage','AC2',true,2));
def('gascompressor1',CMP_DEF('gascompressor1','Gas Compressor — Single Stage','GC1',false,1));
def('gascompressor2',CMP_DEF('gascompressor2','Gas Compressor — Multi-Stage','GC2',false,2));
/* ── hydraulic valves & actuators ── */
const C_HYD='Hydraulic Actuators & Valves';
function drawSpoolV(c){const p=clamp(num(c.pos,0),0,2),nm=['EXTEND','RETRACT','NEUTRAL'][p];
 slab(-56,-36,112,72,8,'#5d7388','#2c3a4c');rr(-64,-36,112,72,8);ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=1;ctx.stroke();
 for(const t of DEFS[c.type].term){const x=t[1]*.86,y=t[2]*.86;line([[x*.4,y*.4],[x,y]],'#8fa4b8',5);tx(c,t[0],x,y*.92,'#cfe0ee',8,'center',800);}
 rr(-42,-18,84,36,4);ctx.fillStyle='#0d1622';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
 const sx=-22+p*22;rr(sx-7,-11,14,22,2);ctx.fillStyle=p===2?'#64748b':'#f59e0b';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
 line([[-34,0],[34,0]],'rgba(255,255,255,.15)',1);
 if(p===0){line([[-46,-20],[-32,-20]],'#38bdf8',3);line([[32,20],[46,20]],'#38bdf8',3);}
 if(p===1){line([[-46,20],[-32,20]],'#38bdf8',3);line([[32,-20],[46,-20]],'#38bdf8',3);}
 led(-48,32,p===2?'#94a3b8':'#38bdf8',true);
 head(c,'SPOOL VALVE 4/3 — '+nm,nm,p===2?COL.mut:COL.ok);}
function drawPoppet(c){const f=!!(sim.hu&&sim.hflow.has(sim.hu.find(key(c.id,'IN')))),op=c.open!==false;
 slab(-52,-20,104,40,9,'#6d8095','#3a4a5c');
 line([[-52,0],[-16,0]],'#8fb7d9',6);line([[16,0],[52,0]],'#8fb7d9',6);
 ctx.beginPath();ctx.arc(0,0,14,0,TAU);ctx.fillStyle='#22303e';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
 ctx.beginPath();ctx.arc(op&&f?4:0,0,7,0,TAU);ctx.fillStyle=op&&f?'#f59e0b':'#5b6b78';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
 line([[0,-14],[0,-24]],'#94a3b8',2.4);rr(-9,-32,18,8,2);ctx.fillStyle='#cbd5e1';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
 tx(c,'crack '+num(c.crack,1).toFixed(1)+' bar',0,14,'#8fa4b8',7,'center',700);
 led(-44,-27,f?'#22c55e':'#64748b',!!f);
 head(c,'POPPET CHECK VALVE',op?(f?'FLOWING':'CHECK'):'CLOSED',f?COL.ok:op?COL.mut:COL.bad);}
function drawCyl(c){const dbl=c.type==='cyldouble',pos=clamp(num(c.pos,0),0,100)/100,run=c._dir!==0;
 slab(-66,-24,132,48,10,'#7d8ea0','#3c4c5e');
 const bx=dbl?-50:-46,bw=dbl?92:84,by=-17,bh=34;
 rr(bx,by,bw,bh,6);ctx.fillStyle='#16222e';ctx.fill();ctx.strokeStyle='rgba(0,0,0,.8)';ctx.stroke();
 if(pos>0){rr(bx,by,bw*Math.min(1,pos),bh,6);ctx.fillStyle='rgba(56,150,220,.5)';ctx.fill();}
 const px=bx+bw*Math.min(1,pos);ctx.fillStyle='#c7d2dd';ctx.fillRect(px-3,by+2,6,bh-4);
 const rx=px+3;ctx.fillStyle='#9aa7b5';ctx.fillRect(rx,by+bh/2-5,Math.max(8,bx+bw+14-rx),10);
 if(dbl){tubeH(-58,-11,12,9,'#8fb7d9',2);tubeH(-58,2,12,9,'#8fb7d9',2);tx(c,'P1',-64,-8,'#cfe0ee',7,'center',800);tx(c,'P2',-64,8,'#cfe0ee',7,'center',800);}
 else{tubeH(-58,-4,12,9,'#8fb7d9',2);tubeH(58,-4,12,9,'#8fb7d9',2);tx(c,'IN',-64,0,'#cfe0ee',7,'center',800);tx(c,'OUT',64,0,'#cfe0ee',7,'center',800);}
 if(run)glow(0,0,60,'rgba(56,150,220,.18)');
 led(-56,30,run?'#22c55e':'#64748b',run);
 head(c,dbl?'DOUBLE-ACTING CYLINDER':'SINGLE-ACTING CYLINDER','POS '+Math.round(pos*100)+'%'+(run?(c._dir>0?' · EXT':' · RETR'):' · HOLD'),run?COL.ok:COL.mut);}
function drawHMotor(c){const on=c.on!==false,rpm=num(c._rpm,0),a=AN()*rpm/60*TAU;
 slab(-54,-36,108,72,10,'#5d7388','#2c3a4c');rr(-54,-36,108,72,10);ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=1;ctx.stroke();
 ctx.save();ctx.translate(-12,0);ctx.rotate(a);ctx.fillStyle='#c7d2dd';for(let i=0;i<8;i++){ctx.rotate(TAU/8);ctx.fillRect(-4,-24,8,12);}ctx.restore();
 ctx.beginPath();ctx.arc(-12,0,15,0,TAU);ctx.fillStyle='#22303e';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();ctx.beginPath();ctx.arc(-12,0,4,0,TAU);ctx.fillStyle='#9aa7b5';ctx.fill();
 tubeH(8,-6,34,12,'#c7d2dd',3);tx(c,'SHAFT',30,12,'#8fa4b8',7,'center',700);
 tubeH(-46,-16,12,10,'#8fb7d9',2);tubeH(34,-16,12,10,'#8fb7d9',2);tx(c,'IN',-52,-11,'#cfe0ee',7,'center',800);tx(c,'OUT',40,-11,'#cfe0ee',7,'center',800);
 if(on&&rpm>10)glow(-12,0,50,'rgba(56,150,220,.15)');
 led(-44,30,on?'#22c55e':'#64748b',on);
 head(c,'HYDRAULIC GEAR MOTOR',on?(rpm>10?rpm.toFixed(0)+' rpm':'NO FLOW'):'OFF',on?COL.ok:COL.mut);}
def('spoolvalve',{name:'Hydraulic Spool Valve 4/3 (P-T-A-B)',tag:'FS',cat:C_HYD,w:130,h:120,term:[['P',-58,-20,-1,0,'h'],['T',-58,20,-1,0,'h'],['A',58,-20,1,0,'h'],['B',58,20,1,0,'h']],
 pins:{P:'pressure supply',T:'tank return',A:'port A — cylinder cap end',B:'port B — cylinder rod end'},draw:drawSpoolV,click:c=>{pushUndo&&pushUndo();c.pos=(num(c.pos,0)+1)%3;},init:{pos:0},
 blurb:'4/3 directional control valve. Click cycles EXTEND (P→A, B→T) → RETRACT (P→B, A→T) → NEUTRAL (all blocked). Wire P to pump discharge, T to tank return, A/B to a double-acting cylinder.',
 desc:c=>['EXTEND','RETRACT','NEUTRAL'][num(c.pos,0)]||'NEUTRAL'});
def('poppetvalve',{name:'Poppet Check Valve',tag:'PCV',cat:C_HYD,w:110,h:90,term:[['IN',-45,0,-1,0,'h'],['OUT',45,0,1,0,'h']],
 pins:{IN:'inlet — flow enters here',OUT:'outlet — check direction'},draw:drawPoppet,click:c=>{c.open=c.open===false;},init:{open:true,crack:1},
 blurb:'Spring-loaded poppet check valve — passes flow IN→OUT only once inlet pressure exceeds the cracking pressure. Use on cylinder drain lines or pump discharge protection.',
 desc:c=>'Cracking pressure: '+num(c.crack,1).toFixed(1)+' bar\n'+(c.open===false?'CLOSED (latched)':'CHECK — IN→OUT only')});
def('cylsingle',{name:'Single-Acting Hydraulic Cylinder',tag:'SC',cat:C_HYD,w:150,h:100,term:[['IN',-66,-4,-1,0,'h'],['OUT',66,-4,1,0,'h']],
 pins:{IN:'pressure inlet — extend',OUT:'drain / spring return'},draw:drawCyl,click:c=>{c._dir=c._dir>0?-1:1;},init:{pos:0,_dir:0,speed:8},
 blurb:'Single-acting cylinder: pressure at IN extends the rod against a spring; OUT drains return flow. Click toggles EXTEND/RETRACT.',
 desc:c=>'Stroke: '+num(c.pos,0).toFixed(0)+'% · Speed '+(Number(c.speed)||8).toFixed(0)+'%/s\nCommand: '+(c._dir>0?'EXTEND':c._dir<0?'RETRACT':'HOLD')});
def('cyldouble',{name:'Double-Acting Hydraulic Cylinder',tag:'DC',cat:C_HYD,w:150,h:110,term:[['P1',-66,-12,-1,0,'h'],['P2',-66,12,-1,0,'h']],
 pins:{P1:'port 1 — extend (pressure in, P2 drains)',P2:'port 2 — retract (pressure in, P1 drains)'},draw:drawCyl,click:c=>{c._dir=c._dir>0?-1:1;},init:{pos:0,_dir:0,speed:8},
 blurb:'Double-acting cylinder: pressure at P1 extends, P2 retracts (each port drains the other side). Drive it from a spool valve or two supply lines. Click toggles EXTEND/RETRACT.',
 desc:c=>'Stroke: '+num(c.pos,0).toFixed(0)+'% · Speed '+(Number(c.speed)||8).toFixed(0)+'%/s at rated flow\nCommand: '+(c._dir>0?'EXTEND (P1)':c._dir<0?'RETRACT (P2)':'HOLD')});
def('hydmotor',{name:'Hydraulic Gear Motor (continuous rotary actuator)',tag:'HM',cat:C_HYD,w:130,h:110,term:[['IN',-52,-14,-1,0,'h'],['OUT',-52,14,-1,0,'h']],
 pins:{IN:'pressure inlet — drives rotation',OUT:'case drain / return'},draw:drawHMotor,click:c=>{c.on=c.on===false;},init:{on:true,_rpm:0,_flow:0},
 blurb:'Continuous rotary actuator: fluid flow through IN→OUT spins the shaft. Speed follows the supplied flow; no flow = stalled. Click toggles supply path.',
 desc:c=>'Speed: '+num(c._rpm,0).toFixed(0)+' rpm · Flow '+(num(c._flow,0)*1000).toFixed(1)+' L/min\n'+(c.on?'RUNNING':'OFF')});

/* shaft terminals on the host's generator and pumps so a coupling can be WIRED to them */
const SHAFT_POS={generator:[-60,40],motor:[-60,25],feedwaterpump:[-50,0],gasboosterpump:[-60,-5],steamboosterpump:[-50,0],gascompressor:[-60,-5],aircompressor1:[0,64],aircompressor2:[0,64],gascompressor1:[0,64],gascompressor2:[0,64]};
function drawShaftFlange(c,p){const x=p[0],y=p[1],run=!!(c._shaftRun||(c.type==='generator'&&c.on&&c._eng));tubeV(x-6,y-11,7,22,'#8a97a5',2);tubeH(x-19,y-3.5,14,7,'#cfd8e1',2);
  for(let k=0;k<3;k++){const yy=y-3+((run?AN()*18:0)+k*2.4)%6;line([[x-18,yy],[x-7,yy]],'rgba(20,24,30,.45)',1);}tx(c,'SHAFT',x-14,y+14,'#64748b',6,'center',800);}
for(const t in SHAFT_POS){const d=DEFS[t];if(!d)continue;if(!d.term.some(x=>x[0]==='SHAFT'))d.term.push(['SHAFT',SHAFT_POS[t][0],SHAFT_POS[t][1],-1,0]);if(d.pins&&!d.pins.SHAFT)d.pins.SHAFT='drive shaft';
  const f=DRAW[t];if(typeof f==='function'&&!f._sh){const g=cc=>{f(cc);try{ctx.save();drawShaftFlange(cc,SHAFT_POS[t]);ctx.restore();}catch(e){}};g._sh=1;DRAW[t]=g;}}
const TRANS=['shaftcoupling','geartrain','beltdrive','chaindrive'];
function trRatio(cp){const t=cp.type;if(t==='geartrain')return num(cp.ratio,1);
  if(t==='beltdrive'){const slip=cp._slip?0.97:0.99;return num(cp.d1,200)/Math.max(10,num(cp.d2,200))*slip;}
  if(t==='chaindrive')return num(cp.z1,17)/Math.max(6,num(cp.z2,17))*(cp._slack?.985:1);
  return cp.ctype==='gear'?num(cp.ratio,1):1;}
function trEff(cp){const t=cp.type;if(t==='geartrain')return .97;if(t==='beltdrive')return cp._slip?.88:.95;if(t==='chaindrive')return cp._slack?.9:.96;return 1;}
function engDrives(c,st){const R=(o,t)=>st.uf.find(key(o.id,t)),mach=comps.filter(m=>DRIVEN.includes(m.type)),on=(root,ratio)=>mach.filter(m=>R(m,'SHAFT')===root).map(m=>({m,ratio}));
  const out={base:{cp:null,ratio:1,parent:-1,kw:0,machines:on(R(c,'SHAFT'),1)},cps:[]},seen=new Set(),q=[{root:R(c,'SHAFT'),ratio:1,parent:-1}];
  for(let qi=0;qi<q.length;qi++){const cur=q[qi];for(const cp of comps){if(!TRANS.includes(cp.type)||seen.has(cp.id)||R(cp,'A')!==cur.root)continue;seen.add(cp.id);
    const ratio=cur.ratio*trRatio(cp),idx=out.cps.length,bRoot=R(cp,'B');out.cps.push({cp,eff:trEff(cp),ratio,parent:cur.parent,kw:0,machines:on(bRoot,ratio)});q.push({root:bRoot,ratio,parent:idx});}}
  return out;}
function engTick(c,dt,st,gx){dt=Math.min(dt,.1);const G=engGeom(c),Rr=num(c.ratedRpm,1500),P0n=G.kw,ENV=engEnv(c,dt,Rr,P0n),P0=P0n*ENV.pf,Tmax=P0*9549/Rr*1.15,Vd=G.Vd,sysV=num(c.sysV,24),F=FUELS[c.fuelType]||FUELS.diesel;c._kw=P0;c._Vd=Vd;let rpm=num(c.rpm,0);
  /* electrical inputs */
  const vb=volts(st,c,'B+','B-');let battOK=true;if(c.needBatt!==false)battOK=!!vb&&vb.kind!=='ac'&&(vb.v==null||vb.v>=.75*sysV)&&vb.pol>=0;
  c._battV=vb?(vb.v==null?sysV:vb.v):0;if(vb&&vb.v!=null&&vb.v>1.4*sysV&&!c.fault)c.fault='STARTER OVERVOLTAGE';
  const startSig=!!live(st,c,'START','B-');if(startSig&&!c._startP){c._cmdStartT=Math.max(num(c._cmdStartT,0),10);c.failMsg='';}else if(startSig)c._cmdStartT=Math.max(num(c._cmdStartT,0),2);c._startP=startSig;
  const prevT=num(c._cmdStartT,0),startReq=prevT>0;c._cmdStartT=Math.max(0,prevT-dt);
  const fsol=!!c.cmdRun||!!live(st,c,'FSOL','B-');
  /* resources arriving through pipes */
  const fuelHere=subAt(c,'FUEL_IN',F.sub),wrong=['diesel','gasoline','gas'].filter(k=>k!==F.sub&&subAt(c,'FUEL_IN',k)),waterFuel=subAt(c,'FUEL_IN','water'),fuelOK=fuelHere&&!wrong.length&&!waterFuel;
  let oilL=clamp(num(c.oilLevel,0),0,100);const sumpL=4+Vd*1.2,oilSup=subAt(c,'OIL_IN','oil'),oilRes=srcTank('oiltank',c,'OIL_IN',t=>num(t.level,0)>0);
  if(oilSup&&oilL<100){const inc=Math.min(100-oilL,10*dt);oilL+=inc;useRoot(c,'OIL_IN');if(oilRes)oilRes.level=Math.max(0,num(oilRes.level,0)-inc/100*sumpL/num(oilRes.cap,200)*100);}
  let coolL=clamp(num(c.coolLevel,0),0,100);const water=subAt(c,'COOL_IN','water'),filling=water&&coolL<100;
  if(filling){coolL=Math.min(100,coolL+12*dt);useRoot(c,'COOL_IN');}
  if(water&&c.cooling==='water'&&c.firing)useRoot(c,'COOL_IN');
  c._cflow=water&&(filling||(c.cooling==='water'&&!!c.firing));c._oflow=oilSup&&oilL<100;c._coolFlow=water;
  c._res={fuel:fuelOK,oil:oilL>=20,cool:coolL>=50,batt:battOK};
  const why=[];if(!fuelOK)why.push(wrong.length?'WRONG FUEL ('+wrong[0].toUpperCase()+' IN '+F.sub.toUpperCase()+' ENGINE)':waterFuel?'WATER IN FUEL':'NO '+F.sub.toUpperCase()+' AT FUEL_IN');
  if(oilL<20)why.push('NO / LOW ENGINE OIL');if(coolL<50)why.push('NO / LOW COOLANT');if(c.needBatt!==false&&!battOK)why.push('STARTER BATTERY');if(!fsol)why.push('FUEL SOLENOID (FSOL) NOT ENERGISED');if(c.estop)why.push('E-STOP');
  if(!ENV.airOK)why.push('NO AIR AT AIR_IN (CHECK FILTER / INTAKE)');c.why=why.join(' · ');
  /* drives and load */
  const D=engDrives(c,st);let Pload=0;c._drv=D;const recs=[D.base,...D.cps];
  for(const rec of recs){rec.kw=0;if(rec.cp&&rec.cp.sheared)continue;
    for(const x of rec.machines){const m=x.m;let kw=0;
      if(m.type==='generator'){const roots=['L1','L2','L3'].map(t=>st.uf.find(key(m.id,t)));let Pel=0;for(const l of collectLoads(st.uf))if(roots.includes(l.r))Pel+=l.P;kw=m.on&&m._eng===c.id?Pel/1000/.93+.02*num(m.kva,5)*.8:0;m._pel=Pel;}
      else kw=shaftLoadKw(m);
      x.kw=kw;rec.kw+=kw;}}
  for(let i=D.cps.length-1;i>=0;i--){const r=D.cps[i];if(r.parent>=0)D.cps[r.parent].kw+=r.kw/r.eff;}
  Pload=D.base.kw;for(const r of D.cps)if(r.parent<0)Pload+=r.kw/r.eff;
  /* state machine */
  if(c.estop)c.cmdRun=false;
  const crank=startReq&&battOK&&!c.estop&&rpm<.4*Rr&&!c.firing;
  if(crank)c._crankT=num(c._crankT,0)+dt;else if(!c.firing)c._crankT=0;
  const preheat=F.pre&&c._crankT<1.5;
  const canRun=fuelOK&&oilL>=20&&coolL>=50&&fsol&&ENV.airOK&&!c.fault&&!c.estop;
  if(!c.firing&&canRun&&rpm>=F.fire&&!preheat&&startReq){c.firing=true;c.sp=Math.max(rpm,500);c._ri=.25;c.starts=num(c.starts,0)+1;c.failMsg='';}
  if(c.firing&&(!fsol||!fuelOK||!ENV.airOK||c.fault||c.estop)){c.firing=false;if(!fuelOK&&fsol)log(`${c.label}: fuel supply lost — engine stopped`);}
  if(c.firing&&rpm<.08*Rr){c.firing=false;c.stalls=num(c.stalls,0)+1;log(`⚠ ${c.label} stalled (load ${Pload.toFixed(0)} kW too high)`);}
  if(c.firing)c._cmdStartT=0;
  if(prevT>0&&c._cmdStartT<=0&&!c.firing&&rpm<.4*Rr&&!c.fault)c.failMsg='FAIL TO START — '+(c.why||'no ignition');
  /* dynamics */
  let rack=0,Tind=0,Tload=0,Tf=Tmax*(.07+.10*rpm/Rr);const J=.5+.4*Vd;
  if(c.firing){c.sp=Math.min(Rr,num(c.sp,500)+350*dt);const sp=c.sp*(1-num(c.droop,0)/100*num(c.rack,0)),err=sp-rpm;c._ri=clamp(num(c._ri,0)+5*err/Rr*dt,-.3,1);
    rack=clamp(.04+9*err/Rr+c._ri+num(c._govRack,0),0,1);Tind=rack*Tmax*clamp(.65+.35*rpm/Rr,0,1)*(rpm>1.3*Rr?0:1);Tf*=.6;
    Tload=Pload*9549/Math.max(rpm,150);rpm+=(Tind-Tload-Tf)/J*9.549*dt;if(rpm<0)rpm=0;}
  else if(crank){rpm+=((F.pre?200:230)-rpm)*Math.min(1,dt/.5);}
  else{rpm+=(-(Tmax*(.16+.1*rpm/Rr))/J*9.549)*dt;if(rpm<2)rpm=0;}
  c.rpm=rpm;c.rack=rack;c._Tind=Tind;c._Tload=Tload;const wn=rpm/9.549,kwInd=Tind*wn/1000;c.kwOut=Math.min(Pload,kwInd);c.loadPct=P0>0?Pload/P0*100:0;c._lf=P0>0?clamp(kwInd/P0,0,1.2):0;if(ENV.post)ENV.post(rpm,kwInd,P0,dt);
  /* thermal */
  const Ct=25*Vd,Qh=c.firing?.85*kwInd+.05*P0*rpm/Rr:.02*P0*rpm/Rr,Tamb=num(c.amb,25);let T=num(c.temperature,Tamb);
  const K=.85*P0/63,th=T<75?.25:T<85?.25+.75*(T-75)/10:1,fan=c.cooling==='water'?(water?1.25:.08):clamp(.15+.85*rpm/Rr,.15,1.1);
  const Qr=ENV.loop?(T-Tamb)*(.06*P0n/63+ENV.Krad)*clamp(coolL/100,.05,1):(T-Tamb)*K*th*fan*clamp(coolL/100,.05,1);if(ENV.after)ENV.after(T,Qr);T+=(Qh-Qr)/Ct*dt;c.temperature=T;c.exhT=Math.round(Tamb+(c.firing?120+430*clamp(kwInd/P0,0,1.1)+ENV.exhAdd:Math.max(0,num(c.exhT,Tamb)-Tamb-60*dt)));
  if(T>105)coolL=Math.max(0,coolL-.5*dt);
  c.oilP=clamp(rpm/Rr*4.6,0,5.2)*num(c.oilHealth,1)*clamp(oilL/40,0,1);
  /* consumption */
  if(c.firing){useRoot(c,'FUEL_IN');oilL=Math.max(0,oilL-.012*dt);c.hours=num(c.hours,0)+dt/3600;
    if(F.dens>0){const lph=F.bsfc*kwInd/(F.dens*1000);c._lph=lph;const tk=srcTank('fueltank',c,'FUEL_IN',t=>t.fuel===F.sub);if(tk)tk.level=Math.max(0,num(tk.level,0)-lph/3600*dt*ENG_TC/Math.max(1,num(tk.cap,1000))*100);}else c._lph=0;}else c._lph=0;
  c.oilLevel=oilL;c.coolLevel=coolL;
  /* protection */
  const trip=w2=>{if(!c.fault){c.fault=w2;c.firing=false;log(`⚠ ${c.label} SHUTDOWN: ${w2}`);}};
  if(rpm>1.15*Rr)trip('OVERSPEED');if(ENV.back>35)trip('EXHAUST BLOCKED (BACK-PRESSURE)');if(T>112)trip('HIGH COOLANT TEMP');if(c.firing&&coolL<30)trip('LOW COOLANT LEVEL');
  if(rpm>500&&c.oilP<1.2){c._oilT=num(c._oilT,0)+dt;if(c._oilT>3)trip('LOW OIL PRESSURE');}else c._oilT=0;
  const warn=[...ENV.warn];if(T>100)warn.push('HIGH TEMP');if(oilL<30&&c.firing)warn.push('LOW OIL');if(c.firing&&rack>.97&&rpm<.97*Rr)warn.push('OVERLOAD');if(c.cooling==='water'&&c.firing&&!water)warn.push('NO COOLANT FLOW');
  const tkf=srcTank('fueltank',c,'FUEL_IN',t=>t.fuel===F.sub);if(tkf&&num(tkf.level,0)<12&&c.firing)warn.push('LOW FUEL');if(c._gtrip)warn.push('GEN TRIPPED (reset fault)');
  c.warn=warn.join(' · ');c.running=!!c.firing&&rpm>=.9*Rr;c.alarm=!!c.fault;
  c.state=c.estop?'E-STOP':c.fault?'FAULT':c.firing?(rpm>=.97*Rr?(Pload>1?'LOADED':'RUNNING'):'STARTING'):crank?(preheat?'PRE-HEAT':'CRANKING'):rpm>5?'COASTING':'STOPPED';
  c._th=num(c._th,0)+visRpm(rpm)*6*dt;
  /* drive machines */
  for(const rec of D.cps){const cp=rec.cp;cp._seen=3;cp._rpmIn=rpm*(rec.parent>=0?D.cps[rec.parent].ratio:1);cp._rpmOut=rpm*rec.ratio;cp._kw=rec.kw;
    cp._T=cp._rpmIn>20?rec.kw*9549/cp._rpmIn:0;cp._n=rec.machines.map(x=>x.m.label).join(', ');
    if(cp.type==='beltdrive')cp._slip=cp._T>.75*num(cp.tlim,1500)||num(cp.tension,100)<50;if(cp.type==='chaindrive')cp._slack=num(cp.wear,0)>60;if(cp._kw>0&&cp._rpmIn>20&&(cp.type==='geartrain'||cp.type==='chaindrive'))cp.wear=Math.min(100,num(cp.wear,0)+dt*(cp.type==='chaindrive'?.02:.008)*(cp._T/Math.max(1,num(cp.tlim,1500))+.3)*(100-num(cp.lube,100)*.8)/20);cp._lossKw=cp._kw*(1/(cp.type==='shaftcoupling'?1:trEff(cp))-1);if(!cp.sheared&&cp._T>num(cp.tlim,1500)){cp.sheared=true;log(`⚠ ${cp.label}: shear pin broke at ${cp._T.toFixed(0)} N·m`);}}
  for(const rec of recs){const cp=rec.cp;for(const x of rec.machines){const m=x.m,cut=cp&&cp.sheared;
    if(m.type==='generator'){m._eng=c.id;m.fuel=100;m.freq=+(rpm*x.ratio/30).toFixed(2);if(!c.firing)c._genTrip=false;const under=m.on&&c.firing&&rpm<.9*Rr&&!cut;
      if(under&&!c._genTrip){c._genTrip=true;log(`⚠ ${m.label} under-frequency trip — engine overloaded (${rpm.toFixed(0)} rpm)`);}
      m.on=!cut&&c.firing&&!c._genTrip&&(m.on?rpm>=.9*Rr:rpm>=.97*Rr)&&rpm<=1.12*Rr;c._gtrip=!!c._genTrip;}
    else{m._shaftRun=!cut&&c.firing&&rpm>=.7*Rr;m._eng=c.id;}}}
  const driven=new Set();for(const rec of recs)for(const x of rec.machines)driven.add(x.m.id);
  for(const m of comps){if(m._eng===c.id&&!driven.has(m.id)){m._eng=null;m._shaftRun=false;if(m.type==='generator')m.on=false;}}
  if(c.fault)(gx&&gx.hazards||[]).push(`${c.label}: ${c.fault}`);else if(c.warn)(gx&&gx.warnings||[]).push(`${c.label}: ${c.warn}`);}
function drawEngine(c){const n=clamp(Math.round(num(c.nCyl,6)),1,12),ns=Math.min(n,6),Rr=num(c.ratedRpm,1500),fk=c.fuelType||'diesel',gas=fk==='gas',col=gas?'#2f5a7a':fk==='gasoline'?'#7a3b2e':'#2f5870',ang=num(c._th,0),rpm=num(c.rpm,0),firing=!!c.firing,T=num(c.temperature,25),coolL=clamp(num(c.coolLevel,0),0,100),oilL=clamp(num(c.oilLevel,0),0,100);
  stub(c);slab(-122,78,244,22,3,'#59636f','#1f2933');for(const bx of[-110,-60,60,110])screw(bx,89,3);
  rr(-88,56,150,20,6);ctx.fillStyle='#161b22';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
  if(oilL>0){const h=16*oilL/100;ctx.fillStyle='rgba(217,119,6,.9)';ctx.fillRect(-86,74-h,146,h);if(c._oflow)for(let k=0;k<5;k++){const p=(AN()*.9+k/5)%1;dot(-70+k*30,56-p*16,1.8,'#d97706',1-p);}}
  const bx=-104,by=-72,bw=166,bh=130;slab(bx,by,bw,bh,6,mixc(col,'#ffffff',.18),mixc(col,'#000000',.5));
  rr(bx-4,by-10,bw+8,16,3);ctx.fillStyle=GR(0,by-10,0,by+6,[[0,'#d5dde5'],[1,'#7c8895']]);ctx.fill();ctx.strokeStyle='#222';ctx.stroke();
  for(let i=0;i<ns;i++)screw(bx+16+i*((bw-32)/Math.max(1,ns-1||1)),by-2,2.2);
  rr(bx+8,by+26,bw-16,bh-46,4);ctx.fillStyle='#0a1118';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.18)';ctx.stroke();
  /* water jacket */
  if(coolL>0){const topY=38-84*coolL/100,wc=mixc('#38bdf8','#ef4444',clamp((T-40)/75,0,1));ctx.save();rr(bx+8,by+26,bw-16,bh-46,4);ctx.clip();ctx.fillStyle=rgba(wc,.3);ctx.fillRect(bx+8,topY,bw-16,84);
    ctx.strokeStyle=rgba(wc,.75);ctx.lineWidth=1.2;ctx.beginPath();for(let x=bx+8;x<=bx+bw-8;x+=4){const y=topY+Math.sin(x*.25+AN()*3)*1.2;x===bx+8?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
    if(c._cflow){for(let k=0;k<14;k++){const p=(AN()*.55+k/14)%1;dot(bx+10+p*(bw-20),topY+8+((k*29)%Math.max(10,38-topY-10)),1.8,'#e0f2fe',.85);}ctx.strokeStyle='rgba(224,242,254,.55)';for(let k=0;k<4;k++){const yy=topY+14+k*16,o=(AN()*40)%24;ctx.beginPath();ctx.moveTo(bx+10+o,yy);ctx.lineTo(bx+22+o,yy);ctx.stroke();}}
    else if(firing&&T>60)for(let k=0;k<6;k++){const p=(AN()*.4+k/6)%1;dot(bx+16+k*24,38-p*(38-topY),1.6,'#e0f2fe',.6*(1-p));}ctx.restore();}
  const x0=bx+14,span=bw-28,pw=span/ns,cw=Math.min(30,pw-8),cy=28,r=10,L=34;
  ctx.fillStyle='#202a34';ctx.fillRect(bx+10,cy+8,bw-20,5);
  for(let i=0;i<ns;i++){const cx=x0+pw*(i+.5),th=(((ang-i*720/n)%720)+720)%720,ph=(th%360)*Math.PI/180,st=Math.floor(th/180);
    const py=cy-r*Math.cos(ph)-Math.sqrt(L*L-Math.pow(r*Math.sin(ph),2)),topY=by+30;
    const sc=['#60a5fa','#fbbf24','#fb923c','#9ca3af'][st],al=[.28,.4,.65,.3][st];
    ctx.fillStyle='#46515d';ctx.fillRect(cx-cw/2-2,topY,2,py-topY+30);ctx.fillRect(cx+cw/2,topY,2,py-topY+30);
    ctx.globalAlpha=al;ctx.fillStyle=sc;ctx.fillRect(cx-cw/2,topY,cw,Math.max(2,py-8-topY));ctx.globalAlpha=1;
    if(firing&&st===2&&th<420)glow(cx,topY+8,cw,'rgba(255,170,60,.85)');
    const open=[st===0,false,false,st===3];
    line([[cx-cw/3,topY],[cx-cw/3,topY-(open[0]?5:0)]],'#cfd8e1',2);line([[cx+cw/3,topY],[cx+cw/3,topY-(open[3]?5:0)]],'#cfd8e1',2);
    line([[cx,topY-8],[cx,topY]],fk==='diesel'?'#e5e7eb':'#facc15',2.2);
    tubeV(cx-cw/2+1,py-8,cw-2,14,'#cbd5df',2);line([[cx-cw/2+2,py-4],[cx+cw/2-2,py-4]],'rgba(0,0,0,.4)',1);line([[cx-cw/2+2,py-1],[cx+cw/2-2,py-1]],'rgba(0,0,0,.4)',1);
    const pinx=cx+r*Math.sin(ph),piny=cy-r*Math.cos(ph);line([[cx,py+5],[pinx,piny]],'#9aa7b4',3.5);
    ctx.beginPath();ctx.arc(cx,cy,r+3,0,TAU);ctx.fillStyle='#3a4552';ctx.fill();line([[cx,cy],[pinx,piny]],'#6b7785',4);dot(pinx,piny,2.8,'#e5e9ee',1);dot(cx,cy,2.2,'#111',1);}
  tubeV(80,-44,22,96,'#8896a5',4);for(let k=0;k<6;k++){const yy=4+40*Math.sin(ang*Math.PI/180+k*Math.PI/3);if(Math.cos(ang*Math.PI/180+k*Math.PI/3)>-.2)line([[80,yy],[102,yy]],'rgba(20,24,30,.55)',1.4);}
  tubeH(100,-5,34,10,'#cfd8e1',3);line([[118,-5],[118,5]],'#555',2);
  tubeV(-90,-114,10,46,'#566170',3);ctx.fillStyle='#2a3038';ctx.fillRect(-93,-118,16,6);
  if(firing)for(let k=0;k<6;k++){const p=(AN()*.7+k/6)%1;dot(-85+Math.sin(k*2+AN()*2)*4+p*10,-120-p*28,3+p*7,gas?'#cbd5e1':fk==='gasoline'?'#9ca3af':'#374151',.4*(1-p));}
  tubeH(30,58,34,14,'#6b7280',4);if(c.state==='CRANKING'||c.state==='PRE-HEAT')glow(47,65,18,'rgba(255,200,60,.5)');
  const lc=(t,on,flow,colr)=>{line([[t[0],t[1]],[t[0],76]],on?colr:'#64748b',4);if(flow){for(let k=0;k<3;k++){const p=(AN()*.8+k/3)%1;dot(t[0],t[1]-p*(t[1]-76),2,'#fff',.85);}}};
  lc([-100,110],c._res&&c._res.fuel,firing,FUEL_COL[fk]);lc([-65,132],c._oflow||oilL>=20,c._oflow,'#d97706');lc([-25,110],coolL>=50,c._cflow,'#38bdf8');
  led(-112,88,'#22c55e',!!c.running);led(-98,88,'#f59e0b',c.state==='CRANKING'||c.state==='PRE-HEAT');led(-84,88,'#ef4444',!!c.fault);
  const rs=c._res||{};[['FUEL',rs.fuel],['OIL',rs.oil],['H2O',rs.cool],['BATT',rs.batt]].forEach((q,i)=>{led(36+i*21,84,q[1]?'#22c55e':'#ef4444',true);tx(c,q[0],36+i*21,95,'#e2e8f0',5.5,'center',800);});
  tx(c,`${Math.round(rpm)} rpm · ${num(c.kwOut,0).toFixed(0)} kW · ${T.toFixed(0)}°C · ${num(c.oilP,0).toFixed(1)} bar`,-48,88,'#e5e7eb',7.5,'center',800);
  const g=engGeom(c);tx(c,`${c.label} · ${n}-cyl 4-stroke ${fk} · ${g.Vd.toFixed(1)} L · ${g.kw.toFixed(0)} kW @ ${Rr}`,0,-132,COL.text,9,'center',800);
  tx(c,c.fault?c.fault:c.failMsg?c.failMsg:(c.state==='STOPPED'&&c.why?'NOT READY: '+c.why:c.state+(c.warn?' · '+c.warn:'')),0,-146,c.fault||c.failMsg?COL.bad:(c.state==='STOPPED'&&c.why)||c.warn?COL.warn:c.running?COL.ok:COL.mut,8,'center',800);}
def('engine4s',{name:'4-Stroke Cylinder Engine (diesel / gasoline / gas, custom bore-stroke)',tag:'ENG',cat:C_ENG,w:270,h:300,
 term:[['B+',-130,-70,-1,0],['B-',-130,-45,-1,0],['START',-130,-15,-1,0],['FSOL',-130,10,-1,0],['SHAFT',130,0,1,0],['RUN_C',45,-110,0,-1],['RUN_NO',70,-110,0,-1],['ALM_C',95,-110,0,-1],['ALM_NO',120,-110,0,-1],['FUEL_IN',-100,110,0,1,'h'],['OIL_IN',-65,132,0,1,'h'],['COOL_IN',-25,110,0,1,'h'],['COOL_OUT',10,132,0,1,'h'],['AIR_IN',-30,-110,0,-1,'h'],['EXHAUST',130,-60,1,0,'h']],
 pins:{'B+':'starter battery + (12 / 24 V DC)','B-':'starter battery −',START:'starter solenoid — pulse battery + to crank (one pulse = full crank cycle)',FSOL:'fuel solenoid / ECU run — battery + to allow fuel',SHAFT:'output flange → coupling A (or straight to a machine SHAFT)',RUN_C:'running contact COM',RUN_NO:'running contact NO (closes ≥90% rated rpm)',ALM_C:'alarm contact COM',ALM_NO:'alarm contact NO (closes on shutdown)',FUEL_IN:'fuel inlet — diesel / gasoline tank or gas line matching the engine fuel',OIL_IN:'engine oil fill from an Engine Oil Reservoir',COOL_IN:'coolant (water) fill / supply for the water jacket',COOL_OUT:'hot coolant out — flow-through return, or → thermostat WATER_IN to close a radiator loop',AIR_IN:'intake air (optional) ← air filter / turbo / intercooler; unwired = ideal intake',EXHAUST:'exhaust (optional) → turbo EXHAUST_IN / muffler; unwired = open exhaust'},
 draw:drawEngine,links:c=>[...(c.running?[['RUN_C','RUN_NO']]:[]),...(c.alarm?[['ALM_C','ALM_NO']]:[])],
 click:c=>{if(c.estop){c.estop=false;return;}c.cmdRun=!c.cmdRun;if(c.cmdRun){c._cmdStartT=10;c.failMsg='';}},tick:engTick,
 init:{aspiration:'natural',nCyl:6,bore:110,stroke:125,ratedRpm:1500,bmep:16,fuelType:'diesel',cooling:'radiator',sysV:24,needBatt:true,droop:0,amb:25,oilHealth:1,oilLevel:0,coolLevel:0,cmdRun:false,estop:false,fault:'',failMsg:'',why:'',warn:'',state:'STOPPED',rpm:0,rack:0,firing:false,running:false,alarm:false,temperature:25,exhT:25,oilP:0,kwOut:0,loadPct:0,hours:0,starts:0,stalls:0,_th:0},
 blurb:'Customisable 4-stroke engine. It consumes real resources: fuel (diesel / gasoline tank or gas line) on FUEL_IN, engine oil on OIL_IN and coolant water on COOL_IN — with none of them it will not start. Wire a 12/24 V battery to B+/B−, pulse START and hold FSOL, or click the engine. SHAFT → coupling A → generator or pump SHAFT.',
 desc:c=>`State: ${c.state}${c.fault?'  '+c.fault:''}\n${c.failMsg||''}\nSpeed: ${num(c.rpm,0).toFixed(0)} / ${c.ratedRpm} rpm\nPower: ${num(c.kwOut,0).toFixed(1)} kW of ${num(c._kw,0).toFixed(0)} kW (${num(c.loadPct,0).toFixed(0)}%)\nDisplacement: ${num(c._Vd,0).toFixed(2)} L   Rack ${(num(c.rack,0)*100).toFixed(0)}%\nCoolant: ${num(c.temperature,25).toFixed(0)} °C, jacket ${num(c.coolLevel,0).toFixed(0)}%\nOil: ${num(c.oilLevel,0).toFixed(0)}% in sump, ${num(c.oilP,0).toFixed(1)} bar\nFuel: ${c.fuelType} ${num(c._lph,0).toFixed(1)} L/h\nMissing: ${c.why||'nothing'}\nHours ${num(c.hours,0).toFixed(2)} · starts ${c.starts||0} · stalls ${c.stalls||0}\n${c.warn||''}`});
{const _d0=DEFS.engine4s.desc;DEFS.engine4s.desc=c=>{let t=_d0(c);const e=c._env;if(e){if(e.air)t+=`\nIntake: boost ${num(e.boost,0).toFixed(2)} bar, ΔP ${num(e.dp,0).toFixed(1)} kPa, charge ${num(e.tCharge,25).toFixed(0)} °C, power ×${num(e.pf,1).toFixed(2)}`;if(e.exh)t+=`\nExhaust back-pressure: ${num(e.back,0).toFixed(1)} kPa, ${num(c.exhT,25).toFixed(0)} °C`;if(e.loop)t+=`\nCoolant loop: radiator circuit active`;}return t;};}
function drawCoupling(c){const th=num(c._th,0),sh=c.sheared,fl=c.ctype||'flexible';stub(c);
  tubeH(-65,-5,16,10,'#cfd8e1',3);tubeH(49,-5,16,10,'#cfd8e1',3);
  tubeV(-52,-24,26,48,'#8a97a5',5);tubeV(26,-24,26,48,'#8a97a5',5);
  if(fl==='flexible'){for(let i=0;i<6;i++){ctx.save();rr(-26,-20,52,40,4);ctx.clip();ctx.fillStyle=i%2?'#f59e0b':'#d97706';ctx.fillRect(-26+((i*9+th*.15)%52),-20,8,40);ctx.restore();}rr(-26,-20,52,40,4);ctx.strokeStyle='#111';ctx.stroke();}
  else if(fl==='gear'){for(let i=0;i<10;i++){const x=-24+i*5+((th*.2)%5);line([[x,-22],[x,22]],'#b7c1cc',3);}rr(-26,-22,52,44,3);ctx.strokeStyle='#111';ctx.stroke();}
  else{tubeV(-26,-22,52,44,'#9aa7b4',3);for(let i=0;i<4;i++)dot(-16+i*10,-14+((th*.05+i*3)%2),2.2,'#333',1);}
  if(sh){line([[-18,-18],[18,18]],COL.bad,3);line([[-18,18],[18,-18]],COL.bad,3);}else dot(0,-26,3,'#ef4444',1);
  ctx.save();ctx.setLineDash([4,3]);rr(-58,-32,116,64,6);ctx.strokeStyle='rgba(250,204,21,.65)';ctx.stroke();ctx.restore();
  tx(c,c.label+' · '+({flexible:'jaw',gear:'gear ×'+num(c.ratio,1),rigid:'rigid'}[fl]||fl)+' coupling',0,-46,COL.text,9,'center',800);
  const alive=num(c._seen,0)>0;tx(c,sh?'SHEARED — replace pin':alive?`${Math.round(num(c._rpmOut,0))} rpm · ${num(c._T,0).toFixed(0)} N·m / ${c.tlim}`:'NO ENGINE ON SHAFT (wire A to engine SHAFT)',0,48,sh?COL.bad:alive&&num(c._rpmOut,0)>20?COL.ok:COL.mut,8,'center',800);
  if(alive&&c._n)tx(c,'→ '+c._n,0,60,COL.mut,8,'center',700);else if(alive)tx(c,'nothing wired to B (SHAFT of a generator / pump)',0,60,COL.warn,8,'center',700);}
def('shaftcoupling',{name:'Shaft Coupling (jaw / rigid / gear) — wire engine SHAFT to generator or pump SHAFT',tag:'CPL',cat:C_ENG,w:130,h:80,term:[['A',-65,0,-1,0],['B',65,0,1,0]],pins:{A:'engine-side flange — wire to engine SHAFT (or the B end of a previous coupling)',B:'load-side flange — wire to the SHAFT terminal of a generator or pump (several machines may share one B net; chain B → next coupling A for tandem drives)'},draw:drawCoupling,
 init:{ctype:'flexible',ratio:1,tlim:1500,sheared:false,_th:0,_seen:0,_rpmIn:0,_rpmOut:0,_T:0,_n:''},
 tick:(c,dt)=>{c._seen=Math.max(0,num(c._seen,0)-1);if(c._seen<=0){c._rpmIn=c._rpmOut=0;c._T=0;c._n='';}c._th=num(c._th,0)+visRpm(num(c._rpmIn,0))*6*dt;},
 blurb:'Flexible jaw, rigid or gear (speed ratio) coupling with a shear pin. Wire A to the engine SHAFT and B to the SHAFT terminal on a generator or pump (generator turns on at ≥97% speed, pumps run ≥70%). The pin shears when the transmitted torque exceeds its limit.',
 desc:c=>`${c.sheared?'SHEARED':'Engaged'}\nSpeed out: ${num(c._rpmOut,0).toFixed(0)} rpm\nTorque: ${num(c._T,0).toFixed(0)} N·m (limit ${c.tlim})\nDriving: ${c._n||'—'}`});

/* ===== gear / belt / chain transmissions + turbine shaft output ===== */
function gearSh(x,y,r,n,th,col){ctx.save();ctx.translate(x,y);ctx.rotate(th*Math.PI/180);ctx.beginPath();for(let i=0;i<n;i++){const a=i/n*Math.PI*2,w=Math.PI/n*.5;ctx.lineTo(Math.cos(a-w)*r*.88,Math.sin(a-w)*r*.88);ctx.lineTo(Math.cos(a-w*.6)*r,Math.sin(a-w*.6)*r);ctx.lineTo(Math.cos(a+w*.6)*r,Math.sin(a+w*.6)*r);ctx.lineTo(Math.cos(a+w)*r*.88,Math.sin(a+w)*r*.88);}ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=1.2;ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.28,0,7);ctx.fillStyle='#1f2933';ctx.fill();ctx.beginPath();ctx.moveTo(-r*.5,0);ctx.lineTo(r*.5,0);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.stroke();ctx.restore();}
function trStat(c,units){const alive=num(c._seen,0)>0,sh=c.sheared;
  tx(c,sh?'BROKEN — replace':alive?`${Math.round(num(c._rpmIn,0))} → ${Math.round(num(c._rpmOut,0))} rpm · ${num(c._T,0).toFixed(0)} N·m / ${c.tlim}`:'NO PRIME MOVER (wire A to a SHAFT)',0,62,sh?COL.bad:alive&&num(c._rpmOut,0)>20?COL.ok:COL.mut,8,'center',800);
  if(alive&&c._n)tx(c,'→ '+c._n,0,74,COL.mut,8,'center',700);else if(alive)tx(c,'nothing wired to B',0,74,COL.warn,8,'center',700);}
function drawGearTrain(c){const th=num(c._th,0),r=num(c.ratio,1),r1=26,r2=clamp(26/Math.max(.25,r),12,48),sh=c.sheared;stub(c);
  slab(-80,-52,160,104,6,'#3a4450','#1f2933');tubeH(-100,-4,22,8,'#cfd8e1',2);tubeH(78,-4,22,8,'#cfd8e1',2);
  const x1=-80+30,x2=x1+r1+r2-3;gearSh(x1,0,r1,16,th,'#9fb0c0');gearSh(x2,0,r2,Math.max(6,Math.round(16*r2/r1)),-th*r1/r2+8,'#c9a227');
  if(sh){line([[-30,-30],[30,30]],COL.bad,3);line([[-30,30],[30,-30]],COL.bad,3);}
  const w=num(c.wear,0);tx(c,`${c.label} · gear ×${r} · wear ${w.toFixed(0)}%`,0,-62,w>70?COL.warn:COL.text,9,'center',800);trStat(c);}
function drawBelt(c){const th=num(c._th,0),d1=num(c.d1,200),d2=num(c.d2,200),r1=clamp(d1/10,10,36),r2=clamp(d2/10,10,36),sh=c.sheared;stub(c);
  slab(-85,-50,170,100,6,'#2b333c','#1f2933');tubeH(-105,-4,22,8,'#cfd8e1',2);tubeH(83,-4,22,8,'#cfd8e1',2);
  const x1=-50,x2=50,k=sh?0:1;
  if(!sh){ctx.beginPath();ctx.moveTo(x1,-r1);ctx.lineTo(x2,-r2);ctx.moveTo(x1,r1);ctx.lineTo(x2,r2);ctx.strokeStyle=c._slip?'#ef4444':'#111';ctx.lineWidth=3;ctx.stroke();
   ctx.setLineDash([4,6]);ctx.lineDashOffset=-th*.3;ctx.strokeStyle='#777';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);}
  else{line([[x1,-r1],[x1+20,-r1-12]],COL.bad,3);line([[x2,r2],[x2-20,r2+12]],COL.bad,3);}
  for(const [x,r,a] of[[x1,r1,th],[x2,r2,-th*r1/r2]]){ctx.save();ctx.translate(x,0);ctx.rotate(a*Math.PI/180);ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fillStyle='#9fb0c0';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=1.5;ctx.stroke();for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r*.8,0);ctx.stroke();}ctx.restore();}
  tx(c,`${c.label} · V-belt ${d1}/${d2} mm${c._slip?' · SLIPPING':''}`,0,-60,c._slip?COL.warn:COL.text,9,'center',800);trStat(c);}
function drawChain(c){const th=num(c._th,0),z1=num(c.z1,17),z2=num(c.z2,17),r1=clamp(z1*1.4,11,36),r2=clamp(z2*1.4,11,36),sh=c.sheared;stub(c);
  slab(-85,-50,170,100,6,'#2b333c','#1f2933');tubeH(-105,-4,22,8,'#cfd8e1',2);tubeH(83,-4,22,8,'#cfd8e1',2);
  const x1=-50,x2=50;
  if(!sh){ctx.beginPath();ctx.moveTo(x1,-r1);ctx.lineTo(x2,-r2);ctx.moveTo(x1,r1+(c._slack?4:0));ctx.lineTo(x2,r2+(c._slack?4:0));ctx.strokeStyle='#d6dde4';ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([3,3]);ctx.lineDashOffset=-th*.35;ctx.strokeStyle='#222';ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);}
  else{line([[x1,-r1],[x1+20,-r1-12]],COL.bad,3);line([[x2,r2],[x2-20,r2+12]],COL.bad,3);}
  gearSh(x1,0,r1,z1>20?20:z1,th,'#b7c1cc');gearSh(x2,0,r2,z2>20?20:z2,-th*z1/z2,'#b7c1cc');
  const w=num(c.wear,0);tx(c,`${c.label} · chain ${z1}T/${z2}T · stretch ${w.toFixed(0)}%${c._slack?' SLACK':''}`,0,-60,w>60?COL.warn:COL.text,9,'center',800);trStat(c);}
const TR_TERM=[['A',-105,0,-1,0],['B',105,0,1,0]],TR_PIN={A:'input shaft — wire to an engine / gas-turbine / steam-turbine SHAFT (or the B end of another transmission)',B:'output shaft — wire to the SHAFT of a generator, pump or compressor, or to the next transmission A'};
const TR_INIT={tlim:1500,sheared:false,wear:0,lube:100,_th:0,_seen:0,_rpmIn:0,_rpmOut:0,_T:0,_n:'',_kw:0,_lossKw:0};
const trTick=(c,dt)=>{c._seen=Math.max(0,num(c._seen,0)-1);if(c._seen<=0){c._rpmIn=c._rpmOut=0;c._T=0;c._n='';c._kw=0;c._lossKw=0;}c._th=num(c._th,0)+visRpm(num(c._rpmIn,0))*6*dt;};
const trDesc=c=>`${c.sheared?'BROKEN':'Engaged'}\nIn → out: ${num(c._rpmIn,0).toFixed(0)} → ${num(c._rpmOut,0).toFixed(0)} rpm\nTorque: ${num(c._T,0).toFixed(0)} N·m (limit ${c.tlim})\nTransmitted: ${num(c._kw,0).toFixed(1)} kW · loss ${num(c._lossKw,0).toFixed(2)} kW\nWear: ${num(c.wear,0).toFixed(0)}%\nDriving: ${c._n||'—'}`;
def('geartrain',{name:'Gearbox (spur gear pair) — speed reducer / increaser',tag:'GBX',cat:C_ENG,w:210,h:110,term:TR_TERM,pins:TR_PIN,draw:drawGearTrain,init:Object.assign({ratio:.5},TR_INIT),tick:trTick,desc:trDesc,
 blurb:'Gear pair, ~97% efficient. Output rpm = input × ratio (0.5 halves speed and doubles torque). Teeth wear with load and poor lubrication; torque above the limit strips the gears.'});
def('beltdrive',{name:'Pulley & V-Belt Drive',tag:'BLT',cat:C_ENG,w:210,h:110,term:TR_TERM,pins:TR_PIN,draw:drawBelt,init:Object.assign({d1:200,d2:200,tension:100},TR_INIT,{tlim:900}),tick:trTick,desc:trDesc,
 blurb:'Two pulleys joined by a V-belt. Ratio = driver diameter / driven diameter. ~95% efficient, but the belt slips (−3% speed, 88% efficiency) above 75% of the torque limit or with low tension, and snaps above the limit.'});
def('chaindrive',{name:'Chain & Sprocket Drive',tag:'CHN',cat:C_ENG,w:210,h:110,term:TR_TERM,pins:TR_PIN,draw:drawChain,init:Object.assign({z1:17,z2:34},TR_INIT,{tlim:2500}),tick:trTick,desc:trDesc,
 blurb:'Roller chain between two sprockets. Ratio = driver teeth / driven teeth, ~96% efficient, no slip. The chain stretches with use and lack of lube; past 60% stretch it goes slack and loses efficiency, and it snaps above the torque limit.'});
/* turbines become prime movers: SHAFT terminal + same shaft-train solver */
for(const t of['gasturbine','steamturbine']){const d=DEFS[t];if(d&&!d.term.some(x=>x[0]==='SHAFT'))d.term.push(['SHAFT',-70,20,-1,0]);if(d){d.pins=d.pins||{};d.pins.SHAFT='drive shaft — 3000 rpm at full speed; wire to a gearbox / belt / chain or straight to a generator or pump SHAFT';}}
Game.register('turbshaft',{tick(dt,gx){const st=sim.st;if(!st)return;for(const c of comps){if(c.type!=='gasturbine'&&c.type!=='steamturbine')continue;
  const rpm=3000*num(c._spool,0),run=!!c.on&&!!c._gen,Rr=3000;let D;try{D=engDrives(c,st);}catch(e){continue;}const recs=[D.base,...D.cps];let P=0;
  for(const rec of recs){rec.kw=0;if(rec.cp&&rec.cp.sheared)continue;for(const x of rec.machines){const m=x.m;let kw=0;
    if(m.type==='generator'){let Pel=0;const roots=['L1','L2','L3'].map(t=>st.uf.find(key(m.id,t)));for(const l of collectLoads(st.uf))if(roots.includes(l.r))Pel+=l.P;kw=m.on&&m._eng===c.id?Pel/1000/.93+.02*num(m.kva,5)*.8:0;m._pel=Pel;}
    else kw=shaftLoadKw(m);x.kw=kw;rec.kw+=kw;}}
  for(let i=D.cps.length-1;i>=0;i--){const r=D.cps[i];if(r.parent>=0)D.cps[r.parent].kw+=r.kw/r.eff;}
  P=D.base.kw;for(const r of D.cps)if(r.parent<0)P+=r.kw/r.eff;c._shaftKw=P;
  for(const rec of D.cps){const cp=rec.cp;cp._seen=3;cp._rpmIn=rpm*(rec.parent>=0?D.cps[rec.parent].ratio:1);cp._rpmOut=rpm*rec.ratio;cp._kw=rec.kw;cp._T=cp._rpmIn>20?rec.kw*9549/cp._rpmIn:0;cp._n=rec.machines.map(x=>x.m.label).join(', ');
    if(cp.type==='beltdrive')cp._slip=cp._T>.75*num(cp.tlim,1500)||num(cp.tension,100)<50;if(cp.type==='chaindrive')cp._slack=num(cp.wear,0)>60;
    if(cp._kw>0&&cp._rpmIn>20&&(cp.type==='geartrain'||cp.type==='chaindrive'))cp.wear=Math.min(100,num(cp.wear,0)+dt*(cp.type==='chaindrive'?.02:.008)*(cp._T/Math.max(1,num(cp.tlim,1500))+.3)*(100-num(cp.lube,100)*.8)/20);
    cp._lossKw=cp._kw*(1/trEff(cp)-1);if(!cp.sheared&&cp._T>num(cp.tlim,1500)){cp.sheared=true;log(`⚠ ${cp.label}: broke at ${cp._T.toFixed(0)} N·m`);}}
  for(const rec of recs){const cp=rec.cp,cut=cp&&cp.sheared;for(const x of rec.machines){const m=x.m;m._eng=c.id;
    if(m.type==='generator'){m.fuel=100;m.freq=+(rpm*x.ratio/30).toFixed(2);m.on=!cut&&run&&(m.on?rpm>=.9*Rr:rpm>=.97*Rr);}else m._shaftRun=!cut&&run&&rpm>=.7*Rr;}}
  const driven=new Set();for(const rec of recs)for(const x of rec.machines)driven.add(x.m.id);
  for(const m of comps)if(m._eng===c.id&&!driven.has(m.id)){m._eng=null;m._shaftRun=false;if(m.type==='generator')m.on=false;}
  c._th=num(c._th,0)+visRpm(rpm)*6*dt;}}});
function drawFuelTank(c){const fk=c.fuel||'diesel',fc=FUEL_COL[fk]||'#d97706',lv=clamp(num(c.level,0),0,100)/100;stub(c);
  slab(-46,40,16,14,2,'#4b5563','#1f2933');slab(26,40,16,14,2,'#4b5563','#1f2933');
  shadow(()=>{rr(-56,-30,112,76,30);ctx.fillStyle=GR(0,-30,0,46,[[0,'#e5e7eb'],[.3,mixc(fc,'#ffffff',.5)],[.7,fc],[1,mixc(fc,'#000000',.6)]]);ctx.fill();});rr(-56,-30,112,76,30);ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.65)';ctx.stroke();
  tubeV(-8,-42,16,14,'#9aa7b4',3);ctx.save();ctx.translate(0,8);ctx.rotate(Math.PI/4);ctx.fillStyle='#fde047';ctx.fillRect(-8,-8,16,16);ctx.strokeStyle='#111';ctx.strokeRect(-8,-8,16,16);ctx.restore();tx(c,fk==='gasoline'?'G':'D',0,9,'#111',9,'center',800);
  rr(38,-14,10,50,3);ctx.fillStyle='#0b1117';ctx.fill();rr(39,36-48*lv,8,48*lv,2);ctx.fillStyle=lv<.12?COL.bad:'#fbbf24';ctx.fill();
  line([[56,36],[60,36]],'#b87333',4);tubeH(40,30,16,12,'#6b7280',3);
  tx(c,`${c.label} · ${fk.toUpperCase()}`,0,-56,COL.text,9,'center',800);tx(c,`${(lv*num(c.cap,1000)).toFixed(0)} / ${c.cap} L · ${(lv*100).toFixed(0)}%`,0,66,lv<.12?COL.bad:COL.mut,8,'center',800);}
def('fueltank',{name:'Fuel Tank (gasoline / diesel resource)',tag:'FT',cat:C_ENG,w:130,h:130,term:[['OUT',62,36,1,0,'h']],pins:{OUT:'fuel outlet → engine FUEL_IN (carries the tank\'s fuel type)'},draw:drawFuelTank,init:{fuel:'diesel',cap:1000,level:100},
 blurb:'Fuel resource. Choose gasoline or diesel; OUT supplies that fuel to a pipe. The engine draws it down while running (time-compressed). A gasoline engine on a diesel line (or the reverse) will not run.',
 desc:c=>`Fuel: ${c.fuel}\nLevel: ${num(c.level,0).toFixed(0)}% (${(num(c.level,0)/100*num(c.cap,1000)).toFixed(0)} L)`});
function drawOilTank(c){const lv=clamp(num(c.level,0),0,100)/100;stub(c);
  shadow(()=>{rr(-34,-40,68,90,8);ctx.fillStyle=GR(-34,0,34,0,[[0,'#1e3a5f'],[.35,'#3b6ea8'],[1,'#10233d']]);ctx.fill();});rr(-34,-40,68,90,8);ctx.strokeStyle='#000';ctx.stroke();
  for(const y of[-22,0,22])line([[-34,y],[34,y]],'rgba(255,255,255,.25)',2);tubeH(-36,-46,72,8,'#9aa7b4',3);
  rr(-22,-34,44,72,4);ctx.fillStyle='rgba(8,14,22,.55)';ctx.fill();rr(-22,38-72*lv,44,72*lv,4);ctx.fillStyle='rgba(217,119,6,.9)';ctx.fill();tx(c,'OIL',0,-8,'#fff',11,'center',800);
  line([[34,40],[38,40]],'#b87333',4);tx(c,`${c.label} · ENGINE OIL`,0,-62,COL.text,9,'center',800);tx(c,`${(lv*num(c.cap,200)).toFixed(0)} / ${c.cap} L`,0,66,lv<.12?COL.bad:COL.mut,8,'center',800);}
def('oiltank',{name:'Engine Oil Reservoir (lube-oil resource)',tag:'OT',cat:C_ENG,w:90,h:130,term:[['OUT',38,40,1,0,'h']],pins:{OUT:'oil outlet → engine OIL_IN'},draw:drawOilTank,init:{cap:200,level:100},blurb:'Lubricating-oil resource. OUT supplies oil; the engine sump fills from it through OIL_IN (the sump level drives oil pressure).',desc:c=>`Level: ${num(c.level,0).toFixed(0)}% (${(num(c.level,0)/100*num(c.cap,200)).toFixed(0)} L)`});
/* ───────── v16: engine cooling loop + air intake / exhaust parts ───────── */
const ADJ={enginethermostat:[['WATER_IN','WATER_OUT','WATER_RAD','WATER_RET']],radiator:[['WATER_IN','WATER_OUT']],coolpump:[['WATER_IN','WATER_OUT']],motor:[['SUC','DIS']],chwcondenser:[['WATER_IN','WATER_OUT']],turbocharger:[['AIR_IN','AIR_OUT'],['EXHAUST_IN','EXHAUST_OUT']],intercooler:[['AIR_IN','AIR_OUT']],muffler:[['EXHAUST_IN','EXHAUST_OUT']],intakefilter:[]};
const hasPipe=(c,t)=>wires.some(w=>!w.broken&&((w.a.c===c.id&&w.a.t===t)||(w.b.c===c.id&&w.b.t===t)));
/* every new part reachable from one engine port through pipes (static — ignores valve/pump state) */
function netParts(c,port){const adj=new Map(),link=(a,b)=>{let l=adj.get(a);if(!l)adj.set(a,l=[]);l.push(b);};
  for(const w of wires){if(w.broken)continue;const a=key(w.a.c,w.a.t),b=key(w.b.c,w.b.t);link(a,b);link(b,a);}
  for(const p of comps){const g=ADJ[p.type];if(g)for(const grp of g)for(const x of grp)for(const y of grp)if(x!==y)link(key(p.id,x),key(p.id,y));}
  const st=key(c.id,port),seen=new Set([st]),q=[st];
  while(q.length){const k=q.pop();for(const n of adj.get(k)||[])if(!seen.has(n)){seen.add(n);q.push(n);}}
  const out=[];for(const p of comps){const g=ADJ[p.type];if(!g)continue;if(Object.keys(DEFS[p.type].pins||{}).some(t=>seen.has(key(p.id,t))))out.push(p);}
  return out;}
const NOENV={pf:1,airOK:true,loop:false,Krad:0,exhAdd:0,back:0,warn:[],post(){},after(){}};
function engEnv(c,dt,Rr,P0n){
  if(!window.PR)return NOENV;
  const R=t=>PR.uf.find(key(c.id,t)),airW=hasPipe(c,'AIR_IN'),exhW=hasPipe(c,'EXHAUST'),outW=hasPipe(c,'COOL_OUT');
  const Tamb=num(c.amb,25),rpm=num(c.rpm,0),rpmF=rpm/Rr,lfp=num(c._lf,0);
  const E={pf:1,airOK:true,loop:false,Krad:0,exhAdd:0,back:0,warn:[],post:null,after:null};
  /* ── intake ── */
  let filters=[],turbos=[],coolers=[],boost=0;
  if(airW){const rA=R('AIR_IN'),ps=netParts(c,'AIR_IN');
    filters=ps.filter(p=>p.type==='intakefilter');turbos=ps.filter(p=>p.type==='turbocharger');coolers=ps.filter(p=>p.type==='intercooler');
    E.airOK=subAt(c,'AIR_IN','air')||filters.some(f=>num(f.clog,0)<99.5&&PR.uf.find(key(f.id,'AIR_OUT'))===rA);
    const rE=exhW?R('EXHAUST'):null;
    turbos.forEach(t=>{t._act=PR.uf.find(key(t.id,'AIR_OUT'))===rA;t._tur=!!rE&&PR.uf.find(key(t.id,'EXHAUST_IN'))===rE;});
    boost=turbos.reduce((m,t)=>t._act?Math.max(m,num(t._boost,0)):m,0);
    const flowF=Math.max(.15,rpmF*(.4+.6*lfp)*(1+boost));
    let dp=0;filters.forEach(f=>{const cl=clamp(num(f.clog,0),0,100)/100;f._dp=(.8+7.2*cl*cl)*(.3+.7*flowF*flowF);dp+=f._dp;});
    turbos.forEach(t=>{if(t._act)dp+=.4+(t._tur?0:1.2);});
    coolers.forEach(k=>{dp+=.4*(1+num(k.foul,0)/50);});
    let kf=1;coolers.forEach(k=>{kf*=1-clamp(num(k.eff,.75),0,.95)*(1-.8*clamp(num(k.foul,0),0,100)/100);});
    const dTc=85*boost,dTa=dTc*kf,af=(1+boost)*Math.max(.3,1-dp/101)*(273+Tamb)/(273+Tamb+dTa);
    const ref=c.aspiration==='turbo'?1.8*.99*(273+25)/(273+25+85*.8*.25):.99;
    E.pf=clamp(af/ref,.4,1.35);E._dp=dp;E._boost=boost;E._tCharge=Tamb+dTa;E._flowF=flowF;E._dTc=dTc;
    if(E.pf<.9)E.warn.push(boost<.05&&c.aspiration==='turbo'?'NO BOOST':'LOW AIR / DERATED');
    if(filters.some(f=>num(f.clog,0)>70))E.warn.push('AIR FILTER CLOGGED');
    E.exhAdd+=clamp((1-E.pf)*260,-60,160);
  }
  /* ── exhaust ── */
  let mufflers=[];
  if(exhW){const ps=netParts(c,'EXHAUST'),rE=R('EXHAUST');mufflers=ps.filter(p=>p.type==='muffler');
    const tb=ps.filter(p=>p.type==='turbocharger'),fl=Math.max(.15,rpmF*(.4+.6*lfp));let back=0;
    mufflers.forEach(m=>{m._dp=num(m.rest,3)*(1+4*Math.pow(clamp(num(m.clog,0),0,100)/100,2))*(.3+.7*fl*fl);back+=m._dp;});
    tb.forEach(t=>{back+=.8*(.3+.7*fl*fl);});
    E.back=back;E.pf*=1-.006*Math.max(0,back-3);E.exhAdd+=2.5*Math.max(0,back-3);
    if(back>15)E.warn.push('HIGH EXHAUST BACK-PRESSURE');
    mufflers.forEach(m=>{m._db=Math.round(62+38*clamp(rpmF,0,1.1)*clamp(1-.35*(num(m.rest,3)-1)/6,.4,1)+(c.firing?0:-62));});
  }
  /* ── coolant loop ── */
  let lp=[];if(outW&&c.cooling==='radiator')lp=netParts(c,'COOL_OUT').filter(p=>p.type==='radiator'||p.type==='enginethermostat'||p.type==='coolpump'||p.type==='motor'||p.type==='chwcondenser');
  if(lp.length){E.loop=true;
    const rO=R('COOL_OUT'),closed=rO===R('COOL_IN'),pump=lp.find(p=>p.type==='coolpump'||p.type==='motor'),th=lp.find(p=>p.type==='enginethermostat'),rads=lp.filter(p=>p.type==='radiator'),chws=lp.filter(p=>p.type==='chwcondenser');
    const pumpCirc=pump?(pump.type==='motor'?(num(pump.flow,0)>0||num(pump.spin,0)>0?clamp(num(pump.flow,0)*10,0.2,1.2):0):(pump.broken?0:clamp(.2+.8*rpmF,0,1))):.3;
    const circ=closed?pumpCirc:.04;
    const flowFrac=th?clamp(num(th.pos,0),0,1):1;
    const act=rads.filter(r=>PR.uf.find(key(r.id,'WATER_IN'))===rO||lp.some(x=>x.type==='chwcondenser'&&PR.uf.find(key(x.id,'WATER_OUT'))===PR.uf.find(key(r.id,'WATER_IN'))));
    act.forEach(r=>{const air=r.fan==='on'?1:r.fan==='off'?.25:(r._fanOn?1:.3);r._k=num(r.kw,160)/60*(1-.9*clamp(num(r.foul,0),0,100)/100)*air;});
    const chwK=chws.reduce((s,cw)=>s+(cw._act?num(cw.cap,800)/40:0),0);
    E.Krad=(act.reduce((s,r)=>s+r._k,0)+chwK)*flowFrac*circ;
    if(c.firing&&!closed)E.warn.push(pump&&(pump.broken||pumpCirc===0)?'COOLANT PUMP FAILED / STOPPED':'NO COOLANT CIRCULATION');
    if(rads.some(r=>num(r.foul,0)>70))E.warn.push('RADIATOR FOULED');
    E.after=(T,Qr)=>{
      if(th){th._tgt=th.fault==='stuck_open'?1:th.fault==='stuck_closed'?0:clamp((T-num(th.open,82))/10,0,1);th._T=T;}
      const kt=Math.max(.001,E.Krad);
      rads.forEach(r=>{const on=act.includes(r),chw=comps.find(x=>x.type==='chwcondenser'&&PR.uf.find(key(x.id,'WATER_OUT'))===PR.uf.find(key(r.id,'WATER_IN'))),Tin=chw?num(chw._tOut,T):T,q=on?Qr*(r._k*flowFrac*circ)/kt:0;r._q=q;r._tIn=Tin;
        r._tOut=on?Tin-Math.min(Math.max(0,Tin-Tamb),q/(.0425*P0n*Math.max(.05,circ)+.01)):Tin;r._flow=on?circ*flowFrac:0;});
      if(pump&&pump.type==='coolpump'){pump._rpm=rpm*.9;pump._flow=circ;pump._Tm=T*(1-flowFrac)+(rads.length?num(rads[0]._tOut,T):T)*flowFrac;}};
  }
  /* ── per-tick bookkeeping after the engine has integrated ── */
  E.post=(rpm2,kwInd,P0,dt2)=>{const lf=P0>0?clamp(kwInd/P0,0,1.2):0,rf=rpm2/Rr;
    turbos.forEach(t=>{const drive=t._tur?clamp(1.3*lf*Math.pow(rf,1.5)+.12*rf-.05,0,1):0,tgt=drive*num(t.maxBoost,1)*clamp(num(t.health,1),0,1);
      t._boost=num(t._boost,0)+(tgt-num(t._boost,0))*Math.min(1,dt2/1.5);t._spd=t._boost/Math.max(.1,num(t.maxBoost,1));});
    const fl=Math.max(.15,rf*(.4+.6*lf)*(1+boost));
    filters.forEach(f=>{f._flow=c.firing?fl:0;if(c.firing)f.clog=Math.min(100,num(f.clog,0)+fl*num(f.dirt,1)*dt2*.08);});
    coolers.forEach(k=>{const tc=Tamb+85*num(boost,0),kf=clamp(num(k.eff,.75),0,.95)*(1-.8*clamp(num(k.foul,0),0,100)/100);k._tIn=tc;k._tOut=tc-(tc-Tamb)*kf;});
    mufflers.forEach(m=>{if(c.firing&&c.fuelType==='diesel'&&lf>.9)m.clog=Math.min(100,num(m.clog,0)+dt2*.004);});
  };
  c._env={pf:E.pf,boost:E._boost||0,dp:E._dp||0,back:E.back,tCharge:E._tCharge,air:airW,exh:exhW,loop:E.loop};
  return E;}
/* a rotating blade helper used by several parts */
function blades(x,y,r,n,a,col){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=col;for(let i=0;i<n;i++){ctx.rotate(TAU/n);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(r*.55,-r*.35,r,-r*.1);ctx.quadraticCurveTo(r*.55,r*.1,0,0);ctx.fill();}ctx.restore();}
function flowDots(x0,y0,x1,y1,n,col,on){if(!on)return;for(let k=0;k<n;k++){const p=(AN()*.9+k/n)%1;dot(x0+(x1-x0)*p,y0+(y1-y0)*p,1.8,col,.9);}}
const heatCol=T=>mixc('#38bdf8','#ef4444',clamp((T-30)/75,0,1));
/* ---- radiator + fan ---- */
function drawRadiator(c){const T=num(c._tIn,25),fo=clamp(num(c.foul,0),0,100)/100,hc=heatCol(T),fanOn=!!c._fanOn||c.fan==='on';stub(c);
  slab(-62,-54,16,108,4,'#4a5562','#1c232c');slab(8,-54,16,108,4,'#4a5562','#1c232c');
  rr(-46,-46,54,92,2);ctx.fillStyle=GR(-46,0,8,0,[[0,mixc(hc,'#0b1220',.45)],[1,mixc(hc,'#0b1220',.7)]]);ctx.fill();
  for(let y=-44;y<=44;y+=4)line([[-46,y],[8,y]],'rgba(200,215,230,.35)',1);
  if(fo>0){ctx.fillStyle=`rgba(120,90,50,${.65*fo})`;ctx.fillRect(-46,-46,54,92);}
  if(num(c._flow,0)>.08){flowDots(-54,-36,-54,36,5,'#e0f2fe',1);flowDots(16,-40,16,40,5,'#e0f2fe',1);}
  ctx.save();ctx.beginPath();ctx.arc(50,0,34,0,TAU);ctx.fillStyle='#10161d';ctx.fill();ctx.strokeStyle='#4b5563';ctx.lineWidth=3;ctx.stroke();ctx.restore();
  blades(50,0,29,5,num(c._fa,0),fanOn?'#9ca3af':'#6b7280');dot(50,0,5,'#e5e7eb',1);
  if(fanOn){ctx.strokeStyle='rgba(186,230,253,.35)';ctx.lineWidth=1;for(let k=0;k<3;k++){const o=(AN()*30+k*10)%30;ctx.beginPath();ctx.moveTo(86+o,-14+k*14);ctx.lineTo(98+o,-14+k*14);ctx.stroke();}}
  led(-54,-62,'#22c55e',fanOn);tx(c,'FAN '+(c.fan||'auto').toUpperCase(),-30,-62,'#cbd5e1',6.5,'center',800);
  tx(c,`${c.label} · ${c.kw} kW radiator`,0,-76,COL.text,9,'center',800);
  tx(c,`${T.toFixed(0)}→${num(c._tOut,25).toFixed(0)} °C · ${num(c._q,0).toFixed(0)} kW${fo>.05?' · fouled '+Math.round(fo*100)+'%':''}`,0,78,fo>.7?COL.warn:COL.mut,8,'center',800);}
def('radiator',{name:'Radiator + Fan (coolant cooler, auto / on / off fan)',tag:'RAD',cat:C_ENG,w:150,h:120,term:[['WATER_IN',-75,-30,-1,0,'h'],['WATER_OUT',-75,30,-1,0,'h']],
 pins:{WATER_IN:'hot coolant in ← thermostat radiator port',WATER_OUT:'cooled coolant out → thermostat return port'},draw:drawRadiator,
 init:{kw:160,foul:0,fan:'auto',_fanOn:false,_fa:0,_tIn:25,_tOut:25,_q:0,_flow:0},
 click:c=>{c.fan=({auto:'on',on:'off',off:'auto'})[c.fan||'auto'];},
 tick:(c,dt)=>{const hu=sim.hu;if(hu){const rIn=hu.find(key(c.id,'WATER_IN')),cwc=comps.find(x=>x.type==='chwcondenser'&&hu.find(key(x.id,'WATER_OUT'))===rIn);if(cwc){c._tIn=num(cwc._tOut,25);c._flow=cwc._act?clamp(num(cwc._lpm,0)/600,.1,1):0;const Tamb=num(cwc.amb,25),fanK=c.fan==='on'||(c.fan==='auto'&&c._tIn>90)?1:(c.fan==='off'?.2:.35),k=num(c.kw,160)*(1-.9*clamp(num(c.foul,0),0,100)/100)*fanK,dT=c._tIn-Tamb;c._q=Math.abs(dT)*k/100;c._tOut=c._tIn-dT*Math.min(.8,k/Math.max(10,num(cwc._lpm,100)*.8));}}const t=num(c._tIn,25);c._fanOn=c.fan==='on'||(c.fan==='auto'&&(c._fanOn?t>86:t>90));c._fa=(num(c._fa,0)+(c._fanOn?16:0)*dt)%TAU;},
 blurb:'Rejects engine heat to the air. Wire the thermostat radiator port to WATER_IN and WATER_OUT back to the thermostat return. Fan: auto switches on above 90 °C, click to cycle auto / on / off. Fouling cuts cooling; an undersized radiator overheats the engine under load.',
 desc:c=>`Fan: ${c.fan}${c._fanOn?' (running)':''}\nCoolant: ${num(c._tIn,25).toFixed(0)} → ${num(c._tOut,25).toFixed(0)} °C\nHeat rejected: ${num(c._q,0).toFixed(0)} kW of ${c.kw} kW rated\nFouling: ${num(c.foul,0).toFixed(0)}%`});
/* ---- thermostat ---- */
function drawThermostat(c){const pos=clamp(num(c.pos,0),0,1),T=num(c._T,25),hc=heatCol(T);stub(c);
  slab(-38,-34,76,68,8,'#5b6572','#222a33');rr(-30,-26,60,52,5);ctx.fillStyle='#0b1118';ctx.fill();
  line([[-30,-20],[-8,-20],[-8,-2]],hc,5);line([[-30,20],[-8,20],[-8,2]],'#38bdf8',5);
  line([[30,-20],[10,-20],[10,-6]],pos>.02?hc:'#475569',5);line([[30,20],[10,20],[10,6]],pos>.02?'#38bdf8':'#475569',5);
  rr(-4,-8,16,16,3);ctx.fillStyle=mixc('#f59e0b','#ef4444',pos);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
  const a=-pos*.9;ctx.save();ctx.translate(-8,0);ctx.rotate(a);line([[0,0],[18,0]],'#e5e7eb',3);ctx.restore();
  tx(c,`${c.label} · ${num(c.open,82)}°C wax`,0,-50,COL.text,9,'center',800);
  const bf=c.fault&&c.fault!=='ok'&&c.fault!=='none';
  tx(c,bf?c.fault.replace('_',' ').toUpperCase():`${Math.round(pos*100)}% open · ${T.toFixed(0)} °C`,0,52,bf?COL.bad:COL.mut,8,'center',800);}
def('enginethermostat',{name:'Engine Thermostat Valve (wax, 3-way bypass)',tag:'THV',cat:C_ENG,w:80,h:70,term:[['WATER_IN',-40,-20,-1,0,'h'],['WATER_OUT',-40,20,-1,0,'h'],['WATER_RAD',40,-20,1,0,'h'],['WATER_RET',40,20,1,0,'h']],
 pins:{WATER_IN:'hot coolant ← engine COOL_OUT',WATER_OUT:'coolant → water pump (bypass or returning from radiator)',WATER_RAD:'→ radiator WATER_IN (opens above the wax temperature)',WATER_RET:'← radiator WATER_OUT'},draw:drawThermostat,
 init:{open:82,pos:0,fault:'none',_tgt:0,_T:25},
 tick:(c,dt)=>{c.pos=num(c.pos,0)+(num(c._tgt,0)-num(c.pos,0))*Math.min(1,dt/5);},
 blurb:'Wax thermostat. Cold, coolant bypasses the radiator (IN→OUT) so the engine warms up fast; above the opening temperature it opens fully ~10 °C later and sends coolant through the radiator. Faults: stuck open (engine runs cold) or stuck closed (overheats).',
 desc:c=>`Opening: ${num(c.open,82)} °C\nPosition: ${Math.round(num(c.pos,0)*100)}% open\nCoolant: ${num(c._T,25).toFixed(0)} °C\nCondition: ${c.fault&&c.fault!=='none'&&c.fault!=='ok'?c.fault:'OK'}`});
/* ---- coolant pump ---- */
function drawCoolPump(c){const rp=num(c._rpm,0),br=!!c.broken;stub(c);
  slab(-40,-30,80,60,8,'#4b5563','#1c232c');ctx.beginPath();ctx.arc(0,0,24,0,TAU);ctx.fillStyle='#0b1118';ctx.fill();ctx.strokeStyle='#8a97a5';ctx.lineWidth=2.5;ctx.stroke();
  blades(0,0,20,6,num(c._a,0),br?'#64748b':'#38bdf8');dot(0,0,4,'#e5e7eb',1);
  rr(-8,-44,16,12,3);ctx.fillStyle='#374151';ctx.fill();line([[0,-32],[0,-24]],br?COL.bad:'#111827',4);
  if(br){line([[-16,-16],[16,16]],COL.bad,3);line([[-16,16],[16,-16]],COL.bad,3);}
  if(num(c._flow,0)>.1&&!br)flowDots(-36,0,36,0,5,'#e0f2fe',1);
  tx(c,`${c.label} · coolant pump`,0,-56,COL.text,9,'center',800);tx(c,br?'BELT BROKEN — click to replace':`${rp.toFixed(0)} rpm`,0,46,br?COL.bad:COL.mut,8,'center',800);}
def('coolpump',{name:'Coolant Water Pump (engine belt driven)',tag:'WP',cat:C_ENG,w:80,h:60,term:[['WATER_IN',-40,0,-1,0,'h'],['WATER_OUT',40,0,1,0,'h']],
 pins:{WATER_IN:'coolant in ← thermostat WATER_OUT',WATER_OUT:'coolant out → engine COOL_IN'},draw:drawCoolPump,
 init:{broken:false,_rpm:0,_a:0,_flow:0},click:c=>{c.broken=!c.broken;},
 tick:(c,dt)=>{c._a=(num(c._a,0)+visRpm(num(c._rpm,0))*.04*dt*6)%TAU;if(c.broken){c._rpm=0;c._flow=0;}},
 blurb:'Engine-driven coolant pump closing the loop back to COOL_IN. Flow follows engine speed. Click to snap / replace the drive belt — with the belt broken the loop opens, circulation stops and the engine overheats.',
 desc:c=>`${c.broken?'BELT BROKEN':'Running'}\nSpeed: ${num(c._rpm,0).toFixed(0)} rpm\nFlow: ${Math.round(num(c._flow,0)*100)}%`});
/* ---- air filter ---- */
function drawAirFilter(c){const cl=clamp(num(c.clog,0),0,100)/100,f=num(c._flow,0);stub(c);
  tubeV(-30,-38,60,76,mixc('#64748b','#d97706',cl*.4),6);
  for(let y=-30;y<=30;y+=5){line([[-26,y],[26,y]],mixc('#f1f5f9','#78350f',cl),2);}
  rr(-34,-46,68,10,3);ctx.fillStyle='#374151';ctx.fill();
  for(let k=0;k<4;k++){const p=(AN()*.7+k/4)%1;if(f>.05)dot(-58+p*26,-12+k*8,1.8,'#e0f2fe',.9*(1-p));}
  line([[-52,-20],[-36,-20]],'#94a3b8',2);line([[-52,0],[-36,0]],'#94a3b8',2);line([[-52,20],[-36,20]],'#94a3b8',2);tx(c,'AMBIENT',-44,34,'#94a3b8',6,'center',800);
  tx(c,`${c.label} · intake filter`,0,-62,COL.text,9,'center',800);tx(c,`clog ${Math.round(cl*100)}% · ΔP ${num(c._dp,.8).toFixed(1)} kPa`,0,56,cl>.7?COL.bad:cl>.4?COL.warn:COL.mut,8,'center',800);}
def('intakefilter',{name:'Air Intake Filter (draws ambient air)',tag:'AF',cat:C_ENG,w:90,h:80,term:[['AIR_OUT',45,0,1,0,'h']],pins:{AIR_OUT:'filtered air → turbo AIR_IN / intercooler / engine AIR_IN'},draw:drawAirFilter,
 init:{clog:0,dirt:1,_dp:.8,_flow:0},click:c=>{c.clog=0;},
 blurb:'Pulls ambient air through a paper element. The element clogs with engine airflow (raise Dust to speed it up); a clogged filter chokes intake and cuts power. Click to fit a new element. At 100% clogged no air reaches the engine.',
 desc:c=>`Element: ${num(c.clog,0).toFixed(0)}% clogged\nRestriction: ${num(c._dp,.8).toFixed(1)} kPa\nDust factor: ×${num(c.dirt,1)}`});
/* ---- turbocharger ---- */
function drawTurbo(c){const b=num(c._boost,0),sp=num(c._spd,0),hot=clamp(sp,0,1);stub(c);
  line([[-8,0],[8,0]],'#9aa7b4',6);
  ctx.beginPath();ctx.arc(-34,0,34,0,TAU);ctx.fillStyle=GR(-60,-34,-8,34,[[0,'#7c8a99'],[1,'#2c3640']]);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1.2;ctx.stroke();
  ctx.beginPath();ctx.arc(34,0,34,0,TAU);ctx.fillStyle=GR(8,-34,60,34,[[0,mixc('#8b5a3c','#ff6a2a',hot*.8)],[1,mixc('#3b2a22','#a33a12',hot*.7)]]);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
  if(hot>.2)glow(34,0,40,`rgba(255,120,40,${.25*hot})`);
  const a=num(c._a,0);blades(-34,0,22,9,a,'#cbd5e1');blades(34,0,22,11,-a,'#f59e0b');dot(-34,0,4,'#111',1);dot(34,0,4,'#111',1);
  tx(c,`${c.label} · turbocharger`,0,-70,COL.text,9,'center',800);tx(c,`boost ${b.toFixed(2)} bar · ${Math.round(sp*100)}%`,0,70,b>.05?COL.ok:COL.mut,8,'center',800);}
def('turbocharger',{name:'Turbocharger (exhaust-driven compressor)',tag:'TC',cat:C_ENG,w:150,h:104,term:[['AIR_IN',-75,-15,-1,0,'h'],['AIR_OUT',-40,-52,0,-1,'h'],['EXHAUST_IN',40,52,0,1,'h'],['EXHAUST_OUT',75,15,1,0,'h']],
 pins:{AIR_IN:'compressor inlet ← air filter',AIR_OUT:'compressed charge air → intercooler / engine AIR_IN',EXHAUST_IN:'turbine inlet ← engine EXHAUST',EXHAUST_OUT:'turbine outlet → muffler'},draw:drawTurbo,
 init:{maxBoost:1,health:1,_boost:0,_spd:0,_a:0,_act:false,_tur:false},
 tick:(c,dt)=>{c._a=(num(c._a,0)+num(c._spd,0)*30*dt)%TAU;if(!window.PR)return;},
 blurb:'Exhaust turbine spins a compressor. Put the engine EXHAUST through the turbine side and the intake through the compressor side: boost builds with load and speed (with turbo lag) and raises available power. Without exhaust energy the compressor just restricts the intake.',
 desc:c=>`Boost: ${num(c._boost,0).toFixed(2)} bar (max ${num(c.maxBoost,1)})\nSpeed: ${Math.round(num(c._spd,0)*100)}%\nTurbine on engine exhaust: ${c._tur?'yes':'no'}\nHealth: ${Math.round(num(c.health,1)*100)}%`});
/* ---- intercooler ---- */
function drawIntercooler(c){const a=num(c._tIn,25),b=num(c._tOut,25);stub(c);slab(-56,-30,112,60,5,'#4a5562','#1c232c');
  rr(-48,-24,96,48,3);ctx.fillStyle=GR(-48,0,48,0,[[0,heatCol(a)],[1,heatCol(b)]]);ctx.globalAlpha=.5;ctx.fill();ctx.globalAlpha=1;
  for(let x=-44;x<=44;x+=5)line([[x,-24],[x,24]],'rgba(200,215,230,.4)',1);
  tx(c,`${c.label} · intercooler`,0,-44,COL.text,9,'center',800);tx(c,`${a.toFixed(0)} → ${b.toFixed(0)} °C charge air`,0,46,COL.mut,8,'center',800);}
def('intercooler',{name:'Intercooler (charge-air cooler)',tag:'IC',cat:C_ENG,w:120,h:60,term:[['AIR_IN',-60,0,-1,0,'h'],['AIR_OUT',60,0,1,0,'h']],pins:{AIR_IN:'hot compressed air ← turbo AIR_OUT',AIR_OUT:'cooled air → engine AIR_IN'},draw:drawIntercooler,
 init:{eff:.75,foul:0,_tIn:25,_tOut:25},blurb:'Cools compressed intake air so it is denser — more air, more power. Efficiency drops as the core fouls.',
 desc:c=>`Charge air: ${num(c._tIn,25).toFixed(0)} → ${num(c._tOut,25).toFixed(0)} °C\nEffectiveness: ${Math.round(num(c.eff,.75)*100)}%`});
/* ---- muffler ---- */
function drawMuffler(c){const f=!!c._on;stub(c);tubeH(-60,-24,120,48,'#6b7280',12);
  for(const x of[-30,0,30])line([[x,-22],[x,22]],'rgba(0,0,0,.45)',2);
  const cl=clamp(num(c.clog,0),0,100)/100;if(cl>0){ctx.fillStyle=`rgba(20,20,20,${.55*cl})`;ctx.fillRect(-56,-20,112,40);}
  tx(c,`${c.label} · muffler`,0,-40,COL.text,9,'center',800);tx(c,`ΔP ${num(c._dp,0).toFixed(1)} kPa · ${num(c._db,0)} dB(A)`,0,40,num(c._dp,0)>15?COL.bad:COL.mut,8,'center',800);}
def('muffler',{name:'Exhaust Muffler / Silencer',tag:'MUF',cat:C_ENG,w:120,h:48,term:[['EXHAUST_IN',-60,0,-1,0,'h'],['EXHAUST_OUT',60,0,1,0,'h']],pins:{EXHAUST_IN:'exhaust ← turbo / engine EXHAUST',EXHAUST_OUT:'→ atmosphere (or flue stack)'},draw:drawMuffler,
 init:{rest:3,clog:0,_dp:0,_db:0},blurb:'Silencer. Quieter mufflers add exhaust back-pressure which costs power and raises exhaust temperature; a sooted or blocked muffler can shut the engine down on high back-pressure.',
 desc:c=>`Back-pressure: ${num(c._dp,0).toFixed(1)} kPa\nNoise: ${num(c._db,0)} dB(A)\nSoot: ${num(c.clog,0).toFixed(0)}%`});
const ICO_EXTRA={geartrain:'<circle class="f" cx="8" cy="12" r="5"/><circle class="f" cx="16.5" cy="12" r="3.5"/>',beltdrive:'<circle class="f" cx="7" cy="12" r="4"/><circle class="f" cx="17" cy="12" r="3"/><path d="M7 8l10 1M7 16l10-1"/>',chaindrive:'<circle class="f" cx="7" cy="12" r="4"/><circle class="f" cx="17" cy="12" r="4"/><path d="M7 8h10M7 16h10" stroke-dasharray="2 1"/>',enginethermostat:'<rect class="f" x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h5M4 15h5M15 9h5M15 15h5M12 8v8"/>',radiator:'<rect class="f" x="3" y="4" width="11" height="16" rx="1"/><path d="M6 4v16M9 4v16M12 4v16"/><circle cx="18" cy="12" r="3.5"/>',coolpump:'<circle class="f" cx="12" cy="13" r="6.5"/><path d="M12 6.5V3M9 3h6M12 13l3-3M12 13l-3 3"/>',intakefilter:'<rect class="f" x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 11h6M9 14h6M2 12h4"/>',turbocharger:'<circle class="f" cx="8" cy="12" r="5"/><circle class="f" cx="16" cy="12" r="5"/><path d="M8 9l2 3-2 3M16 9l-2 3 2 3"/>',intercooler:'<rect class="f" x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 7v10M10 7v10M13 7v10M16 7v10"/>',muffler:'<rect class="f" x="3" y="8" width="18" height="8" rx="4"/><path d="M9 8v8M13 8v8M17 8v8"/>',engine4s:'<rect class="f" x="3" y="7" width="13" height="10" rx="1.5"/><path d="M5 7V4h3v3M9 7V4h3v3M16 12h3M19 9v6M6 12h7M8 17v2M13 17v2"/>',shaftcoupling:'<rect class="f" x="2" y="8" width="6" height="8" rx="1"/><rect class="f" x="16" y="8" width="6" height="8" rx="1"/><path d="M8 10h8v4H8zM11 10v4M13 10v4"/>',fueltank:'<rect class="f" x="3" y="8" width="18" height="10" rx="5"/><path d="M12 8V5M10 5h4M9 13h6"/>',oiltank:'<rect class="f" x="6" y="4" width="12" height="16" rx="2"/><path d="M6 9h12M6 15h12M12 11c-1.5 2-1.5 3 0 3s1.500-1 0-3z"/>'};
/* ───────── v17: chilled-water condenser unit + engine exhaust / coolant-loop animation ───────── */
const _an=()=>window.ANIM||0;
/* walk along a pipe path P (array of {x,y}); v = px/s along the path (sign = direction) */
function pwalk(P,sp,v,fn){if(!P||P.length<2)return;const Ls=[0];let T=0;for(let i=1;i<P.length;i++){T+=Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);Ls.push(T);}if(T<2)return;
  const off=(((_an()*v)%sp)+sp)%sp;let k=0;
  for(let d=off;d<T;d+=sp){while(k<Ls.length-2&&Ls[k+1]<d)k++;const sg=(Ls[k+1]-Ls[k])||1,s=Math.min(1,Math.max(0,(d-Ls[k])/sg)),dx=P[k+1].x-P[k].x,dy=P[k+1].y-P[k].y;fn(P[k].x+dx*s,P[k].y+dy*s,Math.atan2(dy,dx),d/T);}}
function chev(x,y,a,col,al,s){s=s||1;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=clamp(al,0,1);ctx.strokeStyle=col;ctx.lineWidth=1.8*s;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-3.5*s,-3.8*s);ctx.lineTo(2.2*s,0);ctx.lineTo(-3.5*s,3.8*s);ctx.stroke();ctx.restore();}
function sparkle(x,y,r,al){ctx.save();ctx.globalAlpha=clamp(al,0,1);ctx.strokeStyle='#e0f7ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.moveTo(x-r*.6,y-r*.6);ctx.lineTo(x+r*.6,y+r*.6);ctx.moveTo(x-r*.6,y+r*.6);ctx.lineTo(x+r*.6,y-r*.6);ctx.stroke();ctx.restore();}
/* smoke / hot-gas plume that always rises in screen space (undoes the part rotation) */
function plume(c,ox,oy,k,soot){ctx.save();ctx.translate(ox,oy);ctx.rotate(-(c.rot||0)*Math.PI/2);const a=_an();
  glow(0,0,12+8*k,`rgba(255,140,60,${.14+.18*k})`);
  for(let i=0;i<10;i++){const t=((a*(.42+.55*k)+i/10)%1),x=4+t*(24+22*k)+Math.sin(t*7+i*1.9)*3,y=-2-t*(38+34*k),r=2.4+t*(9+9*k),g=Math.round(168-soot*104);
    ctx.globalAlpha=Math.max(0,1-t)*(.2+.38*k);ctx.fillStyle=`rgb(${g},${g},${g+6})`;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
  ctx.globalAlpha=1;ctx.restore();}

/* ── port roles used to find the direction of flow in coolant / exhaust pipes ── */
const COOL_OUTP={engine4s:['COOL_OUT'],enginethermostat:['WATER_OUT','WATER_RAD'],radiator:['WATER_OUT'],coolpump:['WATER_OUT'],motor:['DIS'],chwcondenser:['WATER_OUT']};
const COOL_INP={engine4s:['COOL_IN'],enginethermostat:['WATER_IN','WATER_RET'],radiator:['WATER_IN'],coolpump:['WATER_IN'],motor:['SUC'],chwcondenser:['WATER_IN']};
const EXH_OUTP={engine4s:['EXHAUST'],turbocharger:['EXHAUST_OUT'],muffler:['EXHAUST_OUT']};
const EXH_INP={turbocharger:['EXHAUST_IN'],muffler:['EXHAUST_IN']};
const roleOf=(c,t,O,I)=>c&&O[c.type]&&O[c.type].includes(t)?1:c&&I[c.type]&&I[c.type].includes(t)?-1:0;
function pipeDirOf(w,O,I){const ca=getC(w.a.c),cb=getC(w.b.c);if(!ca||!cb)return null;const ra=roleOf(ca,w.a.t,O,I),rb=roleOf(cb,w.b.t,O,I);if(!ra||!rb||ra===rb)return null;
  return ra===1?{dir:1,src:ca,srcT:w.a.t,dst:cb,dstT:w.b.t}:{dir:-1,src:cb,srcT:w.b.t,dst:ca,dstT:w.a.t};}

/* coolant loop pipes: temperature-coloured stream with direction chevrons (engine → thermostat → radiator → pump → engine) */
function coolOverlay(w,P){const d=pipeDirOf(w,COOL_OUTP,COOL_INP);if(!d)return false;
  if(d.src.type==='chwcondenser'||d.dst.type==='chwcondenser')return false;
  const E=comps.find(e=>e.type==='engine4s'&&e._env&&e._env.loop&&(e.firing||num(e.rpm,0)>20));if(!E)return true;
  const pump=comps.find(p=>p.type==='coolpump'),th=comps.find(p=>p.type==='enginethermostat'),rad=comps.find(p=>p.type==='radiator');
  const circ=pump?(pump.broken?0:num(pump._flow,0)):.3,onRad=d.src.type==='radiator'||d.dst.type==='radiator'||(d.src.type==='enginethermostat'&&d.srcT==='WATER_RAD')||(d.dst.type==='enginethermostat'&&d.dstT==='WATER_RET');
  const pos=th?clamp(num(th.pos,0),0,1):1,flow=circ*(onRad?pos:1);if(flow<.04)return true;
  const T=num(E.temperature,25),Tc=rad?num(rad._tOut,T):T;let Tp;
  if(d.src.type==='engine4s'||(d.src.type==='enginethermostat'&&d.srcT==='WATER_RAD'))Tp=T;else if(d.src.type==='radiator')Tp=Tc;else Tp=T*(1-pos)+Tc*pos;
  const col=heatCol(Tp),v=(34+120*flow)*d.dir;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  drawPath(P);ctx.strokeStyle=rgba(col,.5);ctx.lineWidth=5.4;ctx.stroke();
  drawPath(P);ctx.setLineDash([8,16]);ctx.lineDashOffset=-_an()*v;ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
  pwalk(P,44,v,(x,y,a,u)=>{chev(x,y,d.dir>0?a:a+Math.PI,'#ffffff',.9,1.05);});
  ctx.restore();return true;}

/* exhaust pipes: hot gas pulses (engine → turbo → muffler), colour fades from glowing orange to grey */
function exhOverlay(w,P){const d=pipeDirOf(w,EXH_OUTP,EXH_INP);if(!d)return false;
  const E=comps.find(e=>e.type==='engine4s'&&e.firing&&e._env&&e._env.exh);if(!E)return true;
  const k=clamp(num(E.rpm,0)/Math.max(1,num(E.ratedRpm,1500)),0,1.15)*(.45+.55*clamp(num(E.loadPct,0)/100,0,1));if(k<.05)return true;
  const stage=d.src.type==='engine4s'?0:d.src.type==='turbocharger'?1:2,H=[['255,110,40','255,216,150'],['232,120,72','255,200,160'],['150,150,156','226,226,232']][stage],v=(70+190*k)*d.dir;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  drawPath(P);ctx.strokeStyle=`rgba(${H[0]},${.2+.2*k})`;ctx.lineWidth=11;ctx.stroke();
  pwalk(P,28-8*k,v,(x,y,a,u)=>{const pul=.5+.5*Math.sin(_an()*(9+15*k)-u*38);ctx.save();ctx.translate(x,y);ctx.rotate(a);
    ctx.fillStyle=`rgba(${H[1]},${.5+.45*pul})`;ctx.beginPath();ctx.ellipse(0,0,5+7*k*pul,2.6+1.6*pul,0,0,TAU);ctx.fill();
    ctx.fillStyle=`rgba(${H[0]},${.35+.3*pul})`;ctx.beginPath();ctx.arc(1,0,1.6,0,TAU);ctx.fill();ctx.restore();});
  ctx.restore();return true;}

/* chilled-water pipes: cyan stream with ice sparkles leaving the condenser unit; warm stream entering it */
function chwOverlay(w,P){for(const [cEnd,tEnd,oEnd,oT] of [[getC(w.a.c),w.a.t,getC(w.b.c),w.b.t],[getC(w.b.c),w.b.t,getC(w.a.c),w.a.t]]){
  if(!cEnd||cEnd.type!=='chwcondenser')continue;const fromA=(cEnd.id===w.a.c&&tEnd===w.a.t);
  if(tEnd==='WATER_OUT'&&num(cEnd._lpm,0)>.5){const act=!!cEnd._act,dir=fromA?1:-1,v=(40+90*clamp(num(cEnd._lpm,0)/900,0,1))*dir,col=chillCol(num(cEnd._tOut,cEnd._Tin));
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';drawPath(P);ctx.strokeStyle=rgba(col,.55);ctx.lineWidth=5.6;ctx.stroke();
    drawPath(P);ctx.setLineDash([8,16]);ctx.lineDashOffset=-_an()*v;ctx.strokeStyle='rgba(240,253,255,.85)';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
    pwalk(P,44,v,(x,y,a)=>chev(x,y,dir>0?a:a+Math.PI,'#ecfeff',.95,1.05));
    if(act)pwalk(P,53,v*.4,(x,y,a,u)=>sparkle(x,y-5,2.4+1.4*Math.sin(_an()*5+u*40),.35+.45*Math.sin(_an()*4+u*30)));ctx.restore();return true;}
  if(tEnd==='WATER_IN'&&num(cEnd._lpm,0)>.5){const dir=fromA?-1:1,v=(40+90*clamp(num(cEnd._lpm,0)/900,0,1))*dir,col=chillCol(num(cEnd._Tin,25));
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';drawPath(P);ctx.strokeStyle=rgba(col,.4);ctx.lineWidth=5.2;ctx.stroke();
    pwalk(P,44,v,(x,y,a)=>chev(x,y,dir>0?a:a+Math.PI,'#ffffff',.8,1));ctx.restore();return true;}}
  return false;}

const _dp17=drawPipe;
drawPipe=function(w,P,now){_dp17(w,P,now);if(w.broken||!P||P.length<2)return;try{if(coolOverlay(w,P))return;if(exhOverlay(w,P))return;chwOverlay(w,P);}catch(e){if(!ERR.dp17){ERR.dp17=1;console.warn('pipe overlay',e);}}};

/* radiator: hot coolant IN → core (down-pass hot, return pass cold) → cooled coolant OUT, plus hot-air stream */
function radFlow(c){const fl=clamp(num(c._flow,0),0,1);if(fl<.04)return;
  const Ti=num(c._tIn,25),To=num(c._tOut,25),hot=heatCol(Ti),cold=heatCol(To),a=_an(),v=22+70*fl,q=clamp(num(c._q,0)/Math.max(1,num(c.kw,100)),0,1);
  ctx.save();rr(-46,-46,54,92,2);ctx.clip();ctx.lineCap='round';
  for(let y=-42;y<=42;y+=6){const col=mixc(hot,cold,(y+42)/84);ctx.strokeStyle=rgba(col,.85);ctx.lineWidth=1.7;ctx.setLineDash([7,9]);ctx.lineDashOffset=(y<0?-1:1)*a*v;ctx.beginPath();ctx.moveTo(-46,y);ctx.lineTo(8,y);ctx.stroke();}
  ctx.setLineDash([]);ctx.restore();
  glow(-54,-26,16,rgba(hot,.4));glow(-54,26,16,rgba(cold,.4));
  for(let k=0;k<3;k++){const p=((a*.9*(.4+fl)+k/3)%1),al=1-Math.abs(p-.5)*1.5;chev(-102+p*36,-30,0,hot,al,1.2);chev(-64-p*36,30,Math.PI,cold,al,1.2);}
  tx(c,'IN '+Ti.toFixed(0)+'°C',32,-60,hot,7.5,'center',800);tx(c,'OUT '+To.toFixed(0)+'°C',32,64,cold,7.5,'center',800);
  if(q>.02)for(let k=0;k<8;k++){const p=((a*.8+k/8)%1);ctx.globalAlpha=(1-p)*.4*Math.min(1,q*1.6);ctx.fillStyle=`rgb(255,${Math.round(190-100*q)},90)`;ctx.beginPath();ctx.arc(88+p*52,-26+k*7.5+Math.sin(p*9+k)*2,2+p*3.2,0,TAU);ctx.fill();}
  ctx.globalAlpha=1;}
{const f=DEFS.radiator.draw;DEFS.radiator.draw=c=>{ctx.save();f(c);ctx.restore();ctx.save();try{radFlow(c);}catch(e){}ctx.restore();};}

/* coolant pump: swirl in the volute, IN / OUT chevrons and temperatures */
function pumpFlow(c){const fl=clamp(num(c._flow,0),0,1);if(fl<.04||c.broken)return;const a=_an(),th=comps.find(t=>t.type==='enginethermostat'),rad=comps.find(t=>t.type==='radiator'),pos=th?clamp(num(th.pos,0),0,1):0,T=th?num(th._T,25):25,Tm=T*(1-pos)+(rad?num(rad._tOut,T):T)*pos,col=heatCol(Tm);
  ctx.save();ctx.lineWidth=1.8;ctx.lineCap='round';
  for(let k=0;k<3;k++){ctx.strokeStyle=rgba(mixc(col,'#ffffff',.45),.8-.15*k);ctx.beginPath();ctx.arc(0,0,9+k*4.5,a*7*fl+k*2.1,a*7*fl+k*2.1+1.5);ctx.stroke();}
  for(let k=0;k<3;k++){const p=((a*.9*(.4+fl)+k/3)%1),al=1-Math.abs(p-.5)*1.5;chev(-62+p*22,0,0,col,al,1.1);chev(44+p*22,0,0,mixc(col,'#ffffff',.35),al,1.25);}
  glow(40,0,10,rgba(col,.35));ctx.restore();
  tx(c,'IN',-52,-12,col,6.5,'center',800);tx(c,'OUT '+Tm.toFixed(0)+'°C',54,-12,col,6.5,'center',800);}
{const f=DEFS.coolpump.draw;DEFS.coolpump.draw=c=>{ctx.save();f(c);ctx.restore();ctx.save();try{pumpFlow(c);}catch(e){}ctx.restore();};}

/* engine exhaust port: heat glow, pressure pulses and (open exhaust) a rising smoke plume */
function engExh(c){if(!c.firing)return;const k=clamp(num(c.rpm,0)/Math.max(1,num(c.ratedRpm,1500)),0,1.15)*(.45+.55*clamp(num(c.loadPct,0)/100,0,1));if(k<.05)return;const a=_an();
  glow(124,-60,20+8*k,`rgba(255,110,40,${.18+.2*k})`);
  for(let i=0;i<3;i++){const t=((a*(1.2+1.6*k)+i/3)%1);ctx.strokeStyle=`rgba(255,170,90,${(1-t)*.6})`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(130,-60,4+t*16,-.9,.9);ctx.stroke();}
  if(!hasPipe(c,'EXHAUST'))plume(c,134,-60,k,c.fuelType==='diesel'?.55:.2);}
{const f=DEFS.engine4s.draw;DEFS.engine4s.draw=c=>{ctx.save();f(c);ctx.restore();ctx.save();try{engExh(c);}catch(e){}ctx.restore();};}
/* muffler: open outlet puffs smoke, darker when sooted */
{const f=DEFS.muffler.draw;DEFS.muffler.draw=c=>{ctx.save();f(c);ctx.restore();ctx.save();try{const k=clamp(num(c._db,0)/100,0,1.1);if(k>.1&&!hasPipe(c,'EXHAUST_OUT'))plume(c,60,0,k,clamp(.12+num(c.clog,0)/100*.85,0,1));}catch(e){}ctx.restore();};}

/* ───────── Chilled-Water Condenser Unit (water chiller with air-cooled condenser) ───────── */
const chillCol=T=>T<0?mixc('#818cf8','#22d3ee',clamp((T+40)/40,0,1)):mixc('#22d3ee','#f97316',clamp((T-8)/40,0,1));
function drawChwCond(c){const on=c.on!==false,act=!!c._act,sp=clamp(num(c._sp,0),0,1),Tin=num(c._Tin,20),To=num(c._tOut,Tin),a=_an(),lpm=num(c._lpm,0),fr=clamp(lpm/900,0,1),Tset=num(c.setpoint,7);
  c._fa=(num(c._fa,0)+(window.dt||.016)*(sim.running?Math.min(sim.speed||1,4):0)*(on&&c.powered?2+16*sp:0))%(TAU*500);
  stub(c);slab(-88,-62,176,124,8,'#475569','#1e293b');[[-80,-54],[80,-54],[-80,54],[80,54]].forEach(p=>screw(p[0],p[1],2.6));
  tx(c,'PE',-80,-45,'#a3e635',6,'left',700);tx(c,'L',-80,-25,'#ef4444',6.5,'left',800);tx(c,'N',-80,-5,'#38bdf8',6.5,'left',800);
  tx(c,'IN',-80,25,'#94a3b8',6.5,'left',700);tx(c,'OUT',80,25,'#94a3b8',6.5,'right',700);
  /* condenser coil (top-left) */
  rr(-76,-54,100,36,3);ctx.fillStyle='#0b1220';ctx.fill();ctx.strokeStyle='#64748b';ctx.lineWidth=1;ctx.stroke();
  for(let x=-72;x<=20;x+=4)line([[x,-52],[x,-20]],act&&c.powered?mixc('#94a3b8','#fb923c',.3+.5*sp):'#475569',1);
  for(let y=-48;y<=-24;y+=8)line([[-74,y],[22,y]],act&&c.powered?rgba('#ef4444',.35+.3*sp):'rgba(148,163,184,.35)',1.4);
  /* condenser fan (top-right) */
  ctx.beginPath();ctx.arc(52,-36,24,0,TAU);ctx.fillStyle='#0b1118';ctx.fill();ctx.strokeStyle='#4b5563';ctx.lineWidth=3;ctx.stroke();
  blades(52,-36,20,5,c._fa,on&&c.powered?'#a3b0bf':'#4b5563');dot(52,-36,4.5,'#e5e7eb',1);
  if(act&&c.powered&&sp>.2)for(let i=0;i<7;i++){const t=((a*.8+i/7)%1);ctx.globalAlpha=(1-t)*.4*sp;ctx.fillStyle='#fdba74';ctx.beginPath();ctx.arc(52+Math.sin(t*6+i*1.7)*8,-62-t*34,3+t*7,0,TAU);ctx.fill();}ctx.globalAlpha=1;
  /* compressor + refrigerant circuit */
  ctx.beginPath();ctx.arc(-56,-3,10,0,TAU);ctx.fillStyle=GR(-66,-13,-46,7,[[0,'#cbd5e1'],[1,'#475569']]);ctx.fill();ctx.strokeStyle='#0f172a';ctx.lineWidth=1;ctx.stroke();
  if(act&&c.powered)ctx.save(),ctx.translate(-56,-3),ctx.rotate(c._fa*1.3),line([[-5,0],[5,0]],'#0f172a',2),line([[0,-5],[0,5]],'#0f172a',2),ctx.restore();
  line([[-56,-13],[-56,-18]],'#ef4444',2.4);line([[24,-18],[24,10]],'#60a5fa',2.4);line([[-40,10],[-40,-3],[-46,-3]],'#a78bfa',2.4);
  ctx.save();ctx.translate(24,-4);ctx.rotate(Math.PI/4);ctx.fillStyle='#e2e8f0';ctx.fillRect(-3.2,-3.2,6.4,6.4);ctx.strokeStyle='#0f172a';ctx.strokeRect(-3.2,-3.2,6.4,6.4);ctx.restore();
  flowDots(-56,-13,-56,-18,2,'#fecaca',act&&c.powered);flowDots(24,-18,24,10,5,'#bfdbfe',act&&c.powered);flowDots(-40,10,-46,-3,3,'#ddd6fe',act&&c.powered);
  /* evaporator barrel: process water passes through, warm on the left, chilled on the right */
  line([[-88,25],[-44,25]],'#94a3b8',7);line([[44,25],[88,25]],'#94a3b8',7);line([[-88,25],[-44,25]],lpm>.5?rgba(chillCol(Tin),.9):'#334155',4);line([[44,25],[88,25]],lpm>.5?rgba(chillCol(To),.9):'#334155',4);
  tubeH(-48,10,96,30,'#64748b',12);rr(-43,14,86,22,9);ctx.fillStyle=GR(-43,0,43,0,[[0,chillCol(Tin)],[.55,mixc(chillCol(Tin),chillCol(To),.6)],[1,chillCol(To)]]);ctx.globalAlpha=lpm>.5?.95:.5;ctx.fill();ctx.globalAlpha=1;
  for(let y=19;y<=31;y+=4)line([[-40,y],[40,y]],'rgba(255,255,255,.16)',1);
  if(lpm>.5)for(let k=0;k<7;k++){const p=((a*(.25+.75*fr)+k/7)%1);dot(-90+p*180,25+(Math.abs(p-.5)<.25?Math.sin(p*18+k)*3.2:0),1.9,'#ffffff',.8);}
  if(act&&c.powered&&To<=0){glow(0,25,24,'rgba(196,181,253,.45)');sparkle(-20,25,4,.9);sparkle(20,25,4,.9);for(let i=0;i<6;i++)sparkle(-35+i*14,14+((i*5)%16),2.6+Math.sin(a*3+i)*1.2,.7+.3*Math.sin(a*4+i));}
  else if(act&&c.powered&&To<14)for(let i=0;i<4;i++)sparkle(-8+i*14,18+((i*7)%14),2.2+Math.sin(a*3+i)*1.2,.4+.45*Math.sin(a*4+i*2));
  /* readouts */
  const clName=c.coolant==='water'?'H2O':c.coolant==='brine'?'BRINE':'GLYCOL';
  const st=!c.powered?'NO POWER':!on?'OFF':lpm<=.5?'NO FLOW':act?(To<=Tset+.8?'CHILLED':c._over?'OVERLOADED':'CHILLING'):'STARTING';
  led(-78,56,c.powered?(act?'#22c55e':on&&lpm>.5?'#f59e0b':'#3b82f6'):'#ef4444',c.powered&&act);
  led(-66,56,'#f59e0b',c.powered&&on&&lpm>.5&&!act);
  led(-54,56,!c.powered?'#ef4444':c._freezeRisk?'#ef4444':num(c.foul,0)>70?'#ef4444':'#22c55e',!c.powered||c._freezeRisk||num(c.foul,0)>70);
  tx(c,`IN ${Tin.toFixed(0)}°C`,-40,50,chillCol(Tin),8,'center',800);tx(c,`OUT ${To.toFixed(1)}°C`,44,50,chillCol(To),8.5,'center',800);
  tx(c,`${c.label} · CHILLED-WATER CONDENSER (${clName})`,0,-76,COL.text,9,'center',800);
  tx(c,`${st} · ${num(c._Q,0).toFixed(0)} kW · set ${Tset.toFixed(1)}°C · cond ${num(c._tCond,40).toFixed(0)}°C`,0,76,!c.powered?COL.bad:c._freezeRisk?COL.bad:st==='CHILLED'?COL.ok:st==='OFF'||st==='NO FLOW'?COL.mut:st==='OVERLOADED'?COL.bad:COL.warn,8,'center',800);}
def('chwcondenser',{name:'Chilled-Water Condenser Unit (water chiller + air-cooled condenser)',tag:'CWC',cat:C_ENG,w:190,h:130,
 term:[['PE',-95,-45,-1,0],['L',-95,-25,-1,0],['N',-95,-5,-1,0],['WATER_IN',-95,25,-1,0,'h'],['WATER_OUT',95,25,1,0,'h']],
 pins:{PE:'protective earth',L:'mains line (230 V AC) — MUST be powered to run',N:'mains neutral — MUST be connected to complete 230 V circuit',WATER_IN:'process water / coolant in ← pump DIS, radiator OUT, tank OUT, or engine COOL_OUT',WATER_OUT:'chilled fluid out → radiator WATER_IN, engine COOL_IN, or tank IN'},
 draw:drawChwCond,click:c=>{c.on=c.on===false;},
 init:{on:true,setpoint:7,cap:800,amb:30,foul:0,coolant:'glycol',copNom:3.4,_sp:0,_tOut:20,_Tin:20,_lpm:0,_Q:0,_kw:0,_tCond:42,_act:false,_st:'STANDBY',_fa:0,powered:false,_elecWired:false,_freezeRisk:false},
 blurb:'Industrial chiller: requires 230 V AC electrical power across L and N. It WILL NOT run without electrical power. An evaporator barrel cools process water or glycol to setpoint (supports minus degrees down to -50 °C) while a compressor and air-cooled condenser reject heat to ambient air. Connect pump discharge (DIS) to WATER_IN, and WATER_OUT to engine radiator WATER_IN or coolant circuit. Switch on/off with Click or an external circuit breaker/contactor across L and N.',
 desc:c=>`State: ${c._st||'STANDBY'}${c.on===false?' (switched off)':''}\nPower: ${c.powered?'230 V LIVE (powered)':'NO POWER (needs 230 V AC across L & N)'}\nCoolant: ${c.coolant==='water'?'Pure Water (0°C freeze pt)':c.coolant==='brine'?'Calcium Chloride Brine (-52°C)':'Glycol/Water 50:50 (-37°C)'}\nFluid in: ${num(c._Tin,20).toFixed(1)} °C at ${num(c._lpm,0).toFixed(0)} L/min\nChilled out: ${num(c._tOut,20).toFixed(1)} °C (setpoint ${num(c.setpoint,7)} °C)\nCooling duty: ${num(c._Q,0).toFixed(0)} of ${num(c.cap,800).toFixed(0)} kW · input ${num(c._kw,0).toFixed(0)} kW\nCondensing: ${num(c._tCond,40).toFixed(0)} °C · fouling ${num(c.foul,0).toFixed(0)} %${c._freezeRisk?'\n⚠ FREEZE RISK: Pure water freezing in chiller tubes!':''}`,
 tick:(c,dt,st,gx)=>{const on=c.on!==false,hu=sim.hu;let q=0,tq=0;
  const hasL=wires.some(w=>!w.broken&&((w.a.c===c.id&&w.a.t==='L')||(w.b.c===c.id&&w.b.t==='L')));
  const hasN=wires.some(w=>!w.broken&&((w.a.c===c.id&&w.a.t==='N')||(w.b.c===c.id&&w.b.t==='N')));
  const wiredElec=hasL&&hasN;
  c._elecWired=wiredElec;
  const elecLive=wiredElec&&st&&st.cl?(live(st,c,'L','N')||liveT(ntype(st,c,'L'),ntype(st,c,'N'))):false;
  const powered=elecLive;
  c.powered=powered;

  if(hu){const rI=hu.find(key(c.id,'WATER_IN'));
    for(const p of comps)if((p.type==='motor'||p.type==='gearpump')&&(num(p.flow,0)>0||num(p.spin,0)>0)&&hu.find(key(p.id,'DIS'))===rI){const f=Math.max(p.flow*600,(p.spin||0)*100);q+=f;tq+=f*num(p.temperature,20);}
    if(q<=0)for(const t of comps)if((t.type==='tank'||t.type==='silo'||t.type==='silopump')&&num(t._out,0)>.0001&&hu.find(key(t.id,'OUT'))===rI){const f=t._out*600;q+=f;tq+=f*num(t.temperature,20);}
    if(q<=0)for(const p of comps)if(p.type==='coolpump'&&(num(p._flow,0)>0||!p.broken)&&hu.find(key(p.id,'WATER_OUT'))===rI){const f=Math.max(num(p._flow,0)*400,200);q+=f;tq+=f*num(p._Tm||25,25);}
    if(q<=0)for(const r of comps)if(r.type==='radiator'&&hu.find(key(r.id,'WATER_OUT'))===rI){const f=Math.max(num(r._flow,0)*500,200);q+=f;tq+=f*num(r._tOut,25);}
    if(q<=0)for(const t of comps)if(t.type==='enginethermostat'&&(hu.find(key(t.id,'WATER_RAD'))===rI||hu.find(key(t.id,'WATER_OUT'))===rI)){const f=250;q+=f;tq+=f*num(t._T,25);}
    if(q<=0)for(const e of comps)if(e.type==='engine4s'&&hu.find(key(e.id,'COOL_OUT'))===rI){const f=300;q+=f;tq+=f*num(e.temperature,25);}
    if(q<=0){const anyIn=comps.some(x=>x.id!==c.id&&wires.some(w=>!w.broken&&((w.a.c===c.id&&w.a.t==='WATER_IN')||(w.b.c===c.id&&w.b.t==='WATER_IN'))));if(anyIn&&sim.running){q=150;tq=150*num(c._Tin,20);}}
  }

  const lpm=q,Tin=q>0?tq/q:num(c._Tin,20);
  const coolant=c.coolant||'glycol';
  const Tset=clamp(num(c.setpoint,7),-50,30);
  const foul=clamp(num(c.foul,0),0,100)/100,amb=num(c.amb,30);
  const run=on&&powered&&lpm>.5;
  c._sp=num(c._sp,0)+((run?1:0)-num(c._sp,0))*Math.min(1,dt*.45);

  const capKW=num(c.cap,800);
  const cp=coolant==='brine'?3.1:coolant==='glycol'?3.55:4.18;
  const mcp=Math.max(.001,lpm/60*cp);
  const avail=powered?(capKW*(1-.65*foul)*clamp(1.12-.012*(amb-25),.4,1.1)*c._sp):0;
  const dT=Math.max(0,Tin-Tset);
  const dTdone=powered?Math.min(dT,avail/mcp):0;
  const tgt=Tin-dTdone;

  c._tOut=num(c._tOut,Tin)+(tgt-num(c._tOut,Tin))*Math.min(1,dt*(lpm>.5?1.2:.15));
  c._Tin=Tin;c._lpm=lpm;
  const Q=powered?lpm/60*cp*Math.max(0,Tin-c._tOut):0;
  const copNom=num(c.copNom,3.4);
  const cop=clamp(copNom*(1-.015*Math.max(0,amb-25))*(1-.5*foul)*(1-Math.max(0,-Tset)*.012),1.2,5.0);
  c._Q=Q;c._kw=powered?Q/cop:0;
  c._tCond=amb+10+18*clamp(Q/Math.max(1,capKW),0,1.3);
  c._act=run&&c._sp>.25;
  c._over=run&&c._sp>.9&&dT-dTdone>.6;

  if(powered&&c._act&&c._kw>0){
    const P=c._kw*1000;
    sim.power=(sim.power||0)+P;
    sim.totalI=(sim.totalI||0)+P/Math.max(1,sim.volts||230);
    try{addFlow(c,'L','N');}catch(e){}
  }

  c._freezeRisk=powered&&coolant==='water'&&c._tOut<=0;
  if(c._freezeRisk)(gx&&gx.warnings||[]).push(`${c.label}: FREEZE RISK (${c._tOut.toFixed(1)}°C) — pure water freezes at 0°C. Switch coolant to Glycol or Brine!`);

  c._st=!powered?'NO POWER':!on?'OFF':lpm<=.5?'NO FLOW':c._act?(c._tOut<=Tset+.8?'CHILLED':c._over?'OVERLOADED':'CHILLING'):'STARTING';
  if(c._act&&foul>.7)(gx&&gx.warnings||[]).push(`${c.label}: condenser coil fouled, cooling reduced (clean the coil)`);
  if(c._over)(gx&&gx.warnings||[]).push(`${c.label}: duty exceeds the ${capKW.toFixed(0)} kW capacity, outlet not fully chilled`);
  if(on&&!powered)(gx&&gx.warnings||[]).push(`${c.label}: Chilled-Water Condenser Unit has no electrical power (connect 230 V AC supply to L and N)`);
 }});
ICO_EXTRA.chwcondenser='<rect class="f" x="3" y="12" width="18" height="8" rx="4"/><circle cx="8" cy="6" r="3"/><circle cx="16" cy="6" r="3"/><path d="M5 16h14M12 3v2"/>';
ICO_EXTRA.aircompressor1=ICO_EXTRA.aircompressor2='<rect class="f" x="3" y="9" width="18" height="7" rx="3.5"/><path d="M7 9v4M10 9v4M13 9v4M17 9v4M12 3v3M6 19h12"/>';
ICO_EXTRA.gascompressor1=ICO_EXTRA.gascompressor2='<rect class="f" x="3" y="9" width="18" height="7" rx="3.5"/><path d="M7 9v4M10 9v4M13 9v4M17 9v4M12 3v3M6 19h12"/>';



/* ───────── registry: icons, links, draw ───────── */
const ICO={rly_oct8:'<circle class="f" cx="12" cy="12" r="8"/><rect x="9" y="8" width="6" height="4"/><path d="M8 16l3-2M13 16h3"/>',rly_oct11:'<circle class="f" cx="12" cy="12" r="8"/><rect x="8" y="7" width="8" height="4"/><path d="M8 14h8M8 17h8"/>',rly_sq14:'<rect class="f" x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="7" width="8" height="4"/><path d="M8 14h8M8 17h8"/>',rly_auto5:'<rect class="f" x="5" y="4" width="14" height="16" rx="2"/><path d="M8 4v-2M12 4v-2M16 4v-2M9 9h6M9 13l4-2"/>',rly_din2:'<rect class="f" x="8" y="3" width="8" height="18" rx="1.5"/><rect x="10" y="5" width="4" height="3"/><path d="M10 12h4M10 16h4"/>',
 sv22nc:'<rect class="f" x="8" y="3" width="8" height="7" rx="1.5"/><path d="M4 14h16v5H4zM12 10v4M9 16.5h6"/>',sv22no:'<rect class="f" x="8" y="3" width="8" height="7" rx="1.5"/><path d="M4 14h16v5H4zM12 10v4M9 16.5h6"/>',sv32:'<rect class="f" x="8" y="3" width="8" height="7" rx="1.5"/><path d="M4 14h16v5H4zM12 10v4M12 19v3"/>',sv52:'<rect class="f" x="8" y="3" width="8" height="7" rx="1.5"/><path d="M3 14h18v5H3zM12 10v4M8 19v3M16 19v3"/>',sv52d:'<rect class="f" x="3" y="3" width="7" height="7" rx="1.5"/><rect class="f" x="14" y="3" width="7" height="7" rx="1.5"/><path d="M3 14h18v5H3zM8 19v3M16 19v3"/>',
 pbno:'<circle class="f" cx="12" cy="9" r="6.5"/><path d="M5 17h14v3H5zM9 20v2M15 20v2"/>',pbnc:'<circle class="f" cx="12" cy="9" r="6.5"/><path d="M9 6h6M5 17h14v3H5z"/>',pbdual:'<circle class="f" cx="8" cy="9" r="4.5"/><circle class="f" cx="16" cy="9" r="4.5"/><path d="M4 16h16v4H4z"/>',pbestop:'<circle class="f" cx="12" cy="8" r="7"/><path d="M8 15h8v4H8z"/>',pbillum:'<circle class="f" cx="12" cy="9" r="6.5"/><circle cx="12" cy="9" r="2.5"/><path d="M5 17h14v3H5z"/>',
 ls1:'<rect class="f" x="6" y="12" width="12" height="9" rx="1.5"/><path d="M12 12V8M12 8l6-4"/><circle cx="19" cy="4" r="2"/>',ls2:'<rect class="f" x="4" y="12" width="16" height="9" rx="1.5"/><path d="M12 12V8M12 8l6-4"/><circle cx="19" cy="4" r="2"/>',
 tbfeed:'<rect class="f" x="8" y="3" width="8" height="18" rx="1.5"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/>',tbpe:'<rect class="f" x="8" y="3" width="8" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h8"/>',tbfuse:'<rect class="f" x="8" y="3" width="8" height="18" rx="1.5"/><rect x="10" y="9" width="4" height="6"/>',tbdisc:'<rect class="f" x="8" y="3" width="8" height="18" rx="1.5"/><path d="M10 14l5-5"/>',tbstrip:'<rect class="f" x="2" y="5" width="20" height="14" rx="1.5"/><path d="M6 5v14M10 5v14M14 5v14M18 5v14"/>',
 psu24:'<rect class="f" x="3" y="4" width="18" height="16" rx="2"/><path d="M6 9h5M6 12h5M13 9l4 3-4 3"/>',tc:'<rect class="f" x="3" y="3" width="9" height="7" rx="1.5"/><path d="M7.5 10v2.5M7.5 12.5l9 8"/><circle cx="17.5" cy="21" r="1.4" fill="currentColor"/>',rtd:'<rect class="f" x="3" y="3" width="9" height="7" rx="1.5"/><path d="M7.5 10v3"/><rect class="f" x="6" y="13" width="3" height="9" rx="1.5"/><path d="M14 8h6M14 12h6M14 16h6"/>',tempctrl:'<rect class="f" x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="6" width="12" height="4"/><path d="M6 13h12M6 17h5"/>',
 npn_sensor:'<rect class="f" x="3" y="8" width="14" height="8" rx="1.5"/><path d="M17 9v6M20 7v10M5 12h10"/>',pnp_sensor:'<rect class="f" x="3" y="8" width="14" height="8" rx="1.5"/><path d="M17 9v6M20 7v10M5 12h10"/>',ind_sensor:'<rect class="f" x="3" y="8" width="14" height="8" rx="1.5"/><path d="M7 8v8M10 8v8M13 8v8M17 9v6M20 7v10"/>',cap_sensor:'<rect class="f" x="3" y="7" width="14" height="10" rx="1.5"/><path d="M17 9v6M20 8v8M8 10v4M12 10v4"/>',photo_sensor:'<rect class="f" x="3" y="8" width="14" height="8" rx="1.5"/><circle cx="19" cy="12" r="2.5"/>',
 target:'<rect class="f" x="5" y="7" width="14" height="10" rx="1"/><path d="M5 11h14"/>',encoder:'<circle class="f" cx="10" cy="12" r="7"/><circle cx="10" cy="12" r="2"/><path d="M17 12h5M10 5v2M10 17v2M3 12h2"/>',
 servomotor:'<rect class="f" x="3" y="6" width="14" height="12" rx="2"/><path d="M17 12h4M6 9h8M6 15h8"/>',steppermotor:'<rect class="f" x="3" y="6" width="14" height="12" rx="1"/><path d="M17 12h4M7 6v12M10 6v12M13 6v12"/>',servodrive:'<rect class="f" x="4" y="3" width="16" height="18" rx="2"/><path d="M7 7h10M8 16l2-3 2 3 2-3 2 3"/>',stepperdrive:'<rect class="f" x="4" y="3" width="16" height="18" rx="2"/><path d="M7 8h3v3h3v3h4"/>',
 acb:'<rect class="f" x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h8M12 3v3"/>',vcb:'<rect class="f" x="4" y="3" width="16" height="18" rx="2"/><rect x="8" y="7" width="8" height="10" rx="3"/><path d="M12 9v6"/>',harmfilter:'<path d="M3 12c2-6 4-6 6 0s4 6 6 0"/><path d="M17 12h4"/><rect class="f" x="4" y="17" width="16" height="4"/>',ups1:'<rect class="f" x="4" y="3" width="16" height="18" rx="2"/><rect x="7" y="6" width="10" height="4"/><path d="M8 14h8M9 17l2-2 2 2 2-2"/>',ups3:'<rect class="f" x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="6" width="12" height="4"/><path d="M6 14h12M6 17h12"/>',dryer:'<rect class="f" x="3" y="7" width="18" height="8" rx="4"/><path d="M7 9l2 4M11 9l2 4M15 9l2 4M12 15v5"/>'};
for(const k in PLC)ICO['pl_'+k]='<circle class="f" cx="12" cy="10" r="7"/><circle cx="12" cy="10" r="3"/><path d="M8 20h8M9 17v3M15 17v3"/>';
for(const k of MY){const d=DEFS[k];if(d.links)LINKS[k]=d.links;const f=d.draw;DRAW[k]=c=>{ctx.save();try{f(c);}catch(e){if(!ERR[k]){ERR[k]=1;console.warn('draw',k,e);}}ctx.restore();};ICON[k]=SVG(ICO[k]||ICO_EXTRA[k]||'<rect x="5" y="5" width="14" height="14" rx="2"/>');}
for(const k of CMP_TYPES){const f=DRAW[k];if(typeof f!=='function'||f._sh)continue;const g=cc=>{f(cc);try{ctx.save();drawShaftFlange(cc,[0,64]);ctx.restore();}catch(e){}};g._sh=1;DRAW[k]=g;}

/* ───────── solver hooks ───────── */
const _ev=evalCircuit;
evalCircuit=function(){let r=_ev();for(let i=0;i<5;i++){let ch=false;const set=(o,k,v)=>{if(o[k]!==v){o[k]=v;ch=true;}};for(const c of comps){const d=DEFS[c.type];if(d&&d.relax){try{d.relax(r,c,set);}catch(e){if(!ERR['r'+c.type]){ERR['r'+c.type]=1;console.warn('relax',c.type,e);}}}}if(!ch)break;r=_ev();}return r;};
const _lvOrig=live;live=function(st,c,a,b){if(c&&c._shaftRun&&b==='N'&&(a==='L'||a==='M'))return true;return _lvOrig(st,c,a,b);};
const _cl=classify;
classify=function(uf){const r=_cl(uf),m=r.m,R=(c,t)=>uf.find(key(c.id,t));
  const put=(c,t,ty)=>{const root=R(c,t),o=m.get(root);if(!o){m.set(root,ty);return;}if(o===ty)return;const oP=PHs.has(o),tP=PHs.has(ty);if((oP&&tP)||(oP&&ty==='N')||(tP&&o==='N'))r.short=true;else r.bond=true;};
  const typ=(c,t)=>m.get(R(c,t)),lv=(a,b)=>liveT(a,b);
  for(let pass=0;pass<3;pass++)for(const c of comps){
    if(c.type==='psu24'){if(num(c._vout,0)>=.5*num(c.vset,24)&&lv(typ(c,'L'),typ(c,'N'))){put(c,'+','L');put(c,'-','N');}}
    else if(c.type==='ups1'){c._inOK=lv(typ(c,'IN_L'),typ(c,'IN_N'));c._bypOK=lv(typ(c,'BYP_L'),typ(c,'BYP_N'));if(c._outInv){put(c,'OUT_L','L');put(c,'OUT_N','N');put(c,'OUT_PE','PE');}}
    else if(c.type==='ups3'){const t=['IN1','IN2','IN3'].map(x=>typ(c,x));c._inOK=t.every(x=>PHs.has(x))&&new Set(t).size===3;if(c._outInv){put(c,'OUT1','L');put(c,'OUT2','L2');put(c,'OUT3','L3');put(c,'OUTN','N');put(c,'OUTPE','PE');}}}
  return r;};
const _bh=buildHUF;
buildHUF=function(){const uf=_bh();for(const c of comps){if(c.type==='dryer')uf.union(key(c.id,'IN'),key(c.id,'OUT'));else if(c.type==='chwcondenser')uf.union(key(c.id,'WATER_IN'),key(c.id,'WATER_OUT'));else if(c.type==='radiator')uf.union(key(c.id,'WATER_IN'),key(c.id,'WATER_OUT'));else if(c.type==='coolpump')uf.union(key(c.id,'WATER_IN'),key(c.id,'WATER_OUT'));else if(c.type==='engine4s')uf.union(key(c.id,'COOL_IN'),key(c.id,'COOL_OUT'));else if(c.type.startsWith('aircompressor')&&c.on&&c.powered)uf.union(key(c.id,'AIR_IN'),key(c.id,'AIR_OUT'));else if((c.type==='gascompressor1'||c.type==='gascompressor2')&&c.on&&c.powered)uf.union(key(c.id,'GAS_IN'),key(c.id,'GAS_OUT'));else if(c.type==='spoolvalve'){const p=num(c.pos,0);if(p===0){uf.union(key(c.id,'P'),key(c.id,'A'));uf.union(key(c.id,'B'),key(c.id,'T'));}else if(p===1){uf.union(key(c.id,'P'),key(c.id,'B'));uf.union(key(c.id,'A'),key(c.id,'T'));}}else if(c.type==='hydmotor'&&c.on)uf.union(key(c.id,'IN'),key(c.id,'OUT'));else if(c.type&&c.type.startsWith('sv'))for(const g of svPairs(c))uf.union(key(c.id,g[0]),key(c.id,g[1]));}return uf;};
if(window.PASSMAP){for(const k of['sv22nc','sv22no','sv32','sv52','sv52d'])window.PASSMAP[k]=c=>svPairs(c);window.PASSMAP.dryer=()=>[['IN','OUT']];window.PASSMAP.chwcondenser=()=>[['WATER_IN','WATER_OUT']];window.PASSMAP.radiator=c=>c.foul>=99?[]:[['WATER_IN','WATER_OUT']];window.PASSMAP.coolpump=c=>c.broken?[]:[['WATER_IN','WATER_OUT']];window.PASSMAP.engine4s=c=>c._env&&c._env.loop?[]:[['COOL_IN','COOL_OUT']];}
const EXT_DC={ledstrip:['+',c=>c.powered?num(c.watts,50)/24:0],solenoid:['+',c=>c.powered?num(c.watts,20)/24:0],dcmotor:['+',c=>c.powered?num(c.I,0):0]};
Game.register('iolab',{tick(dt,gx){const st=sim.st;if(!st)return;dt=Math.max(0,dt);ST.t+=dt;
  for(const c of comps){if(c.type!=='target')continue;c._t=num(c._t,0)+dt;if(c.motion==='oscillate'){c._dx=num(c.amp,60)*Math.sin(TAU*c._t/Math.max(.2,num(c.period,3)));c._dy=0;}else if(c.motion==='rotary'){const a=TAU*num(c.rpm,60)/60*c._t;c._dx=num(c.orbit,40)*Math.cos(a);c._dy=num(c.orbit,40)*Math.sin(a);}else{c._dx=0;c._dy=0;}const o=rotv(c._dx,c._dy,c.rot);c._wx=c.x+o[0];c._wy=c.y+o[1];}
  for(const c of comps){if(c.type==='fueltank'&&num(c.level,0)>0)addSub(c,'OUT',c.fuel||'diesel');else if(c.type==='oiltank'&&num(c.level,0)>0)addSub(c,'OUT','oil');}
  for(const c of comps){const d=DEFS[c.type];if(d&&d.sup&&MY.has(c.type)){c._pRoot=st.uf.find(key(c.id,d.sup[0]));c._iDC=d.dcLoad?d.dcLoad(c):0;}else if(EXT_DC[c.type]){c._pRoot=st.uf.find(key(c.id,'+'));c._iDC=EXT_DC[c.type][1](c);}}
  for(const c of comps){const d=DEFS[c.type];if(d&&MY.has(c.type)&&d.tick){try{d.tick(c,dt,st,gx);}catch(e){if(!ERR['t'+c.type]){ERR['t'+c.type]=1;console.warn('tick',c.type,e);}}}}
  let W=0;for(const c of comps){const d=DEFS[c.type];if(d&&d.acT&&num(c._pIn,0)>0)W+=c._pIn;}if(W>0){sim.power=(sim.power||0)+W;sim.totalI=(sim.totalI||0)+W/Math.max(1,sim.volts||230);}},
 reset(){for(const c of comps){if(!MY.has(c.type))continue;c._cmdOpen=c._cmdClose=false;
  if(c.type==='acb'||c.type==='vcb'){c.closed=false;c.tripped=false;c.heat=0;c.spring=0;c._cause='';}
  if(c.type==='ups1'||c.type==='ups3'){c.soc=100;c.mode='OFF';c._ovl=false;c._olT=0;}
  if(c.type==='psu24'){c._vout=0;}if(c.type==='servomotor'||c.type==='steppermotor'){c.vel=c.rpm=0;c.ang=0;c.steps=0;c.stall=false;}
  if(c.type==='servodrive'){c.alarm='';c._mv=false;}if(c.type==='stepperdrive'){c._f=0;c._q=0;c.dead=false;}
  if(c.burnt!==undefined)c.burnt=false;if(c.blown!==undefined)c.blown=false;if(c.type==='dryer')c.level=0;if(c.type==='chwcondenser'){c._sp=0;c._tOut=20;c._act=false;c._lpm=0;c._Q=0;}if(c.type==='engine4s'){c.rpm=0;c.firing=false;c.fault='';c.cmdRun=false;c.estop=false;c.temperature=num(c.amb,25);c.state='STOPPED';c.sp=0;c.failMsg='';c._cmdStartT=0;}if(c.type==='shaftcoupling')c.sheared=false;if(c._shaftRun)c._shaftRun=false;}}});

/* ───────── UI: clicks, momentary buttons, properties ───────── */
const _ck=clickAction;
clickAction=function(c){if(!MY.has(c.type))return _ck(c);const d=DEFS[c.type];if(MOM.has(c.type)){renderProps();return;}if(d.click){pushUndo();d.click(c);log(`${c.label}: toggled`);}renderProps();};
cv.addEventListener('mousedown',e=>{if(e.button!==0)return;const r=cv.getBoundingClientRect(),p=toWorld(e.clientX-r.left,e.clientY-r.top);if(hitTerm(p))return;const c=hitComp(p);if(c&&MOM.has(c.type)){c.pressed=true;ST.held=c;}});
window.addEventListener('mouseup',()=>{const h=ST.held;ST.held=null;if(h)setTimeout(()=>{h.pressed=false;},140);});
const sel=(k,v,o)=>sI(k,v,o.map(x=>Array.isArray(x)?x:[x,x]));
const btn=(l,fn)=>`<button data-act="myact" data-fn="${fn}">${l}</button>`;
const P={};
const relayP=c=>fld('Coil voltage (V)',nI('coilV',c.coilV,3,400,1))+fld('Coil type',sel('coilType',c.coilType,['DC','AC']))+fld('Suppression diode / polarised',cI('polar',c.polar))+fld('Contact rating (A)',nI('rating',c.rating,1,40,1))+`<div class="row">${btn('Replace burnt coil','fixburn')}</div>`;
for(const k in RLY)P[k]=relayP;
P.pbillum=c=>fld('Lamp colour',sel('color',c.color,['green','red','amber','blue','white']));
for(const k in PLC)P['pl_'+k]=c=>fld('Colour',sel('color',c.color,['red','green','amber','blue','white']))+fld('24 V AC/DC type',cI('acdc',c.acdc))+fld('Flash',sel('flash',c.flash,['none','slow','fast']))+`<div class="row">${btn('Replace LED','fixburn')}</div>`;
P.ls1=P.ls2=c=>fld('Actuator head',sel('head',c.head,['roller','plunger','whisker','rod']));
P.tbfeed=P.tbfuse=P.tbdisc=P.tbstrip=c=>fld('Colour',sel('color',c.color,['grey','blue','orange','red','black']))+(c.type==='tbfuse'?fld('Fuse rating (A)',nI('rating',c.rating,.5,32,.5))+`<div class="row">${btn('Replace fuse','fixburn')}</div>`:'')+(c.type==='tbstrip'?fld('Jumper bar',sel('bridge',c.bridge,['none','pair','all'])):'');
P.psu24=c=>fld('Output set (V)',nI('vset',c.vset,12,28,.1))+fld('Rating (A)',nI('rating',c.rating,1,40,.5))+fld('Enabled',cI('enabled',c.enabled));
for(const k in SEN)P[k]=c=>fld('Output type',sel('outType',c.outType,['NPN','PNP']))+fld('Contact',sel('contact',c.contact,['NO','NC']))+fld('Principle',sel('principle',c.principle,['inductive','capacitive','photoelectric']))+fld('Sensing distance Sn (mm)',nI('sn',c.sn,1,60,1))+fld('Force target present',cI('manual',c.manual))+`<div class="note">1 mm = ${PXMM} px on the board. Put a Target in front of the face (right end). Inductive sensors only see metals.</div>`+`<div class="row">${btn('Replace sensor','fixburn')}</div>`;
P.target=c=>fld('Material',sel('material',c.material,['steel','stainless','aluminium','brass','copper','plastic','wood','water','glass','paper']))+fld('Motion',sel('motion',c.motion,['static','oscillate','rotary']))+fld('Amplitude (px)',nI('amp',c.amp,10,300,5))+fld('Period (s)',nI('period',c.period,.5,30,.5))+fld('Orbit radius (px)',nI('orbit',c.orbit,10,200,5))+fld('Rotation (rpm)',nI('rpm',c.rpm,1,600,1));
P.encoder=c=>fld('Pulses per rev',nI('ppr',c.ppr,10,10000,10))+fld('Output stage',sel('outType',c.outType,['PNP','NPN','PUSHPULL']))+fld('Speed source',sel('src',c.src,['auto','manual']))+fld('Manual speed (rpm)',nI('rpmMan',c.rpmMan,-6000,6000,10))+`<div class="row">${btn('Reset count','zerocnt')}${btn('Replace encoder','fixburn')}</div>`;
P.tc=c=>fld('Type',sel('ttype',c.ttype,['K','J','T','E','N','R','S','B']))+fld('Source',sel('tmode',c.tmode,['auto','manual']))+fld('Manual temp (°C)',nI('tman',c.tman,-200,1700,1))+fld('Response τ (s)',nI('tau',c.tau,.2,60,.2))+fld('Auto reach (px)',nI('reach',c.reach,30,400,10))+fld('Ambient (°C)',nI('amb',c.amb,-20,60,1))+fld('Cold junction (°C)',nI('cj',c.cj,-20,60,1))+fld('Broken wire',cI('open',c.open));
P.rtd=c=>fld('Type',sel('rtype',c.rtype,['Pt100','Pt1000','Ni1000','Cu50']))+fld('Source',sel('tmode',c.tmode,['auto','manual']))+fld('Manual temp (°C)',nI('tman',c.tman,-200,850,1))+fld('Response τ (s)',nI('tau',c.tau,.2,60,.2))+fld('Auto reach (px)',nI('reach',c.reach,30,400,10))+fld('Lead resistance (Ω)',nI('lead',c.lead,0,10,.1))+fld('Broken wire',cI('open',c.open));
P.tempctrl=c=>fld('Input type',sel('inType',c.inType,['K','J','T','E','N','R','S','B','Pt100','Pt1000']))+fld('Setpoint (°C)',nI('sp',c.sp,-200,1700,1))+fld('Control',sel('cmode',c.cmode,['onoff','pid']))+fld('Action',sel('action',c.action,['heat','cool']))+fld('Hysteresis (K)',nI('hyst',c.hyst,.1,50,.1))+fld('PID gain Kp',nI('kp',c.kp,.1,100,.1))+fld('PID Ti (s)',nI('ti',c.ti,0,600,1))+fld('PID Td (s)',nI('td',c.td,0,120,1))+fld('Cycle time (s)',nI('cyc',c.cyc,1,60,1))+fld('High alarm (°C)',nI('alHi',c.alHi,-200,1700,1))+fld('Offset (°C)',nI('offset',c.offset,-50,50,.1));
const coilP=c=>fld('Coil voltage (V)',nI('coilV',c.coilV,6,240,1))+fld('Coil type',sel('coilType',c.coilType,['DC','AC']))+fld('Coil power (W)',nI('watts',c.watts,1,30,.5))+fld('Fault',sel('fault',c.fault,['none','stuckClosed','stuckOpen']))+`<div class="row">${btn('Replace coil','fixburn')}</div>`;
for(const k in SVD)P[k]=coilP;
P.servomotor=c=>fld('Rated speed (rpm)',nI('ratedRpm',c.ratedRpm,500,6000,100))+fld('Rated torque (Nm)',nI('ratedT',c.ratedT,.1,50,.1))+fld('Rated current (A)',nI('ratedI',c.ratedI,.5,60,.1))+fld('Load torque (Nm)',nI('load',c.load,-20,20,.05))+fld('Holding brake',cI('brake',c.brake))+`<div class="row">${btn('Zero position','zeroang')}</div>`;
P.servodrive=c=>fld('Mode',sel('mode',c.mode,['speed','position']))+fld('Speed (rpm)',nI('speedCmd',c.speedCmd,10,6000,10))+fld('Move distance (°)',nI('moveDeg',c.moveDeg,1,36000,1))+fld('Accel time (ms)',nI('accel',c.accel,20,5000,10))+`<div class="row">${btn('Reset alarm','rstalm')}</div>`;
P.steppermotor=c=>fld('Step angle (°)',sel('stepDeg',String(c.stepDeg),['1.8','0.9']))+fld('Holding torque (Nm)',nI('hold',c.hold,.05,15,.05))+fld('Rated current (A)',nI('ratedA',c.ratedA,.2,10,.1))+fld('Max speed @24 V (rpm)',nI('rpmMax0',c.rpmMax0,100,3000,50))+fld('Load torque (Nm)',nI('load',c.load,0,15,.05))+`<div class="row">${btn('Zero position','zeroang')}</div>`;
P.stepperdrive=c=>fld('Microstep',sel('micro',String(c.micro),['1','2','4','8','16','32']))+fld('Current (A)',nI('current',c.current,.3,6,.1))+fld('Pulse mode',sel('pmode',c.pmode,['run','index']))+fld('Step rate (Hz)',nI('freq',c.freq,10,20000,10))+fld('Burst per pulse (steps)',nI('burst',c.burst,1,100000,1))+fld('Accel (Hz/s)',nI('accel',c.accel,100,50000,100))+fld('ENA signal',sel('enaMode',c.enaMode,[['disable','ON = disable'],['enable','ON = enable']]))+fld('Max supply (V)',nI('vmax',c.vmax,12,80,1))+`<div class="row">${btn('Replace driver','fixburn')}</div>`;
const brkP=c=>fld('Rated current (A)',nI('rating',c.rating,50,6300,10))+fld('Control voltage (V)',nI('ctlV',c.ctlV,12,250,1))+fld('Control type',sel('ctlKind',c.ctlKind,['DC','AC']))+fld('Draw-out position',sel('position',c.position,['connected','test','disconnected']))+fld('Spring charge time (s)',nI('chargeT',c.chargeT,1,30,.5))+fld('Long-time Ir (×In)',nI('ir',c.ir,.4,1,.05))+fld('Long-time tr @6Ir (s)',nI('tr',c.tr,.5,24,.5))+fld('Short-time Isd (×Ir)',nI('isd',c.isd,1.5,12,.5))+fld('Short-time tsd (s)',nI('tsd',c.tsd,0,.5,.05))+fld('Instantaneous Ii (×In)',nI('ii',c.ii,2,20,.5))+(c.type==='acb'?fld('Ground fault',cI('gfOn',c.gfOn))+fld('tg (s)',nI('tg',c.tg,.1,1,.1)):'')+`<div class="row">${btn('Close','close')}${btn('Open','open')}${btn('Charge spring','charge')}${btn('Reset trip','rsttrip')}</div>`;
P.acb=P.vcb=brkP;
P.harmfilter=c=>fld('Filter type',sel('ftype',c.ftype,[['passive5','Passive 5th'],['passive7','Passive 7th'],['passive57','Passive 5th+7th'],['detuned','Detuned reactor'],['active','Active (AHF)']]))+fld('Connected',cI('on',c.on))+fld('Active rating (A)',nI('ratedA',c.ratedA,10,600,10))+fld('Source Ssc (MVA)',nI('ssc',c.ssc,.5,100,.5))+fld('THDi limit (%)',nI('limit',c.limit,2,30,1));
const upsP=c=>fld('Power (kVA)',nI('kva',c.kva,.5,200,.5))+fld('Power factor',nI('pf',c.pf,.5,1,.05))+fld('Switched on',cI('on',c.on))+fld('Topology',sel('topology',c.topology,['online','eco']))+fld('Battery (V)',nI('vbat',c.vbat,12,600,12))+fld('Battery (Ah)',nI('ah',c.ah,1,500,1))+fld('Battery SOC (%)',nI('soc',c.soc,0,100,1))+fld('Low-battery alarm (%)',nI('lowPct',c.lowPct,5,60,1))+fld('Battery fault',cI('battFault',c.battFault));
P.ups1=P.ups3=upsP;
P.dryer=c=>fld('Inlet dryness (%)',nI('xin',c.xin,50,100,1))+fld('Steam flow (kg/h)',nI('flow',c.flow,100,50000,100))+fld('Entrained air in water (%)',nI('airIn',c.airIn,0,20,.5))+fld('Separation efficiency',nI('eff',c.eff,.5,.99,.01));
const ACT={fixburn:c=>{c.burnt=false;c.blown=false;c.dead=false;c.coilT=25;},close:c=>{c._cmdClose=true;},open:c=>{c._cmdOpen=true;},charge:c=>{c.spring=1;},rsttrip:c=>{c.tripped=false;c.heat=0;c._cause='';},rstalm:c=>{c._cmdRst=true;},zeroang:c=>{c.ang=0;c.steps=0;},zerocnt:c=>{c.cnt=0;}};
const _rp=renderProps;
renderProps=function(){_rp();const c=selected&&selected.kind==='c'?getC(selected.id):null;if(!c||!MY.has(c.type))return;const d=DEFS[c.type];const f=P[c.type];
  const pins=Object.entries(d.pins||{}).map(([k,v])=>`<b>${esc(k)}</b> ${esc(v)}`).join(' · ');
  $('props').insertAdjacentHTML('beforeend',(f?f(c):'')+(pins?`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">PINOUT</div><div class="note">${pins}</div>`:''));};
$('props').addEventListener('click',e=>{if(e.target.dataset.act!=='myact')return;const o=selObj(),f=ACT[e.target.dataset.fn];if(!o||!f)return;pushUndo();f(o);renderProps();});
const _de=describe;describe=function(c){if(MY.has(c.type)&&DEFS[c.type].desc){try{return DEFS[c.type].desc(c);}catch(e){return'';}}return _de(c);};

/* engine / coupling / tanks: properties, actions, genset template */
P.engine4s=c=>fld('Cylinders',nI('nCyl',c.nCyl,1,12,1))+fld('Bore (mm)',nI('bore',c.bore,50,300,1))+fld('Stroke (mm)',nI('stroke',c.stroke,50,350,1))+fld('Rated speed (rpm)',sel('ratedRpm',String(c.ratedRpm),['1000','1500','1800','3000']))+fld('BMEP (bar)',nI('bmep',c.bmep,5,30,.5))+fld('Fuel',sel('fuelType',c.fuelType,[['diesel','Diesel'],['gasoline','Gasoline'],['gas','Natural gas']]))+fld('Cooling',sel('cooling',c.cooling,[['radiator','Closed jacket + radiator'],['water','Flow-through water']]))+fld('Starter system (V)',sel('sysV',String(c.sysV),['12','24']))+fld('Battery required to crank',cI('needBatt',c.needBatt!==false))+fld('Oil in sump (%)',nI('oilLevel',c.oilLevel,0,100,1))+fld('Coolant in jacket (%)',nI('coolLevel',c.coolLevel,0,100,1))+fld('Speed droop (%)',nI('droop',c.droop,0,8,.5))+fld('Ambient (°C)',nI('amb',c.amb,-20,55,1))+fld('Oil health (1 = new)',nI('oilHealth',c.oilHealth,.1,1,.05))+`<div class="row">${btn('Start','engstart')}${btn('Stop','engstop')}${btn('E-stop','estop')}${btn('Reset fault','engrst')}</div><div class="row">${btn('Drain oil','drainoil')}${btn('Drain coolant','draincool')}</div><div class="note">Resources: FUEL_IN ← fuel tank (or gas line), OIL_IN ← oil reservoir, COOL_IN ← water. The engine will not start without them. Power = BMEP × displacement × rpm / 1200.</div>`;
P.shaftcoupling=c=>fld('Type',sel('ctype',c.ctype,[['flexible','Flexible jaw'],['rigid','Rigid'],['gear','Gear (ratio)']]))+fld('Speed ratio (gear)',nI('ratio',c.ratio,.25,4,.05))+fld('Shear-pin limit (N·m)',nI('tlim',c.tlim,50,20000,50))+`<div class="row">${btn('Replace shear pin','fixburn')}</div>`;
P.fueltank=c=>fld('Fuel',sel('fuel',c.fuel,[['diesel','Diesel'],['gasoline','Gasoline']]))+fld('Capacity (L)',nI('cap',c.cap,20,20000,10))+fld('Level (%)',nI('level',c.level,0,100,1))+`<div class="row">${btn('Refill','refill')}</div>`;
P.oiltank=c=>fld('Capacity (L)',nI('cap',c.cap,10,2000,10))+fld('Level (%)',nI('level',c.level,0,100,1))+`<div class="row">${btn('Refill','refill')}</div>`;
/* properties + actions */
P.radiator=c=>fld('Rated heat rejection (kW)',nI('kw',c.kw,20,2000,10))+fld('Fan',sel('fan',c.fan||'auto',[['auto','Auto (>90 °C)'],['on','Always on'],['off','Off']]))+fld('Fouling (%)',nI('foul',c.foul,0,100,5))+`<div class="row">${btn('Clean radiator','cleanrad')}</div>`;
P.enginethermostat=c=>fld('Opens at (°C)',nI('open',c.open,60,105,1))+fld('Condition',sel('fault',c.fault==='ok'||!c.fault?'none':c.fault,[['none','OK'],['stuck_open','Stuck open'],['stuck_closed','Stuck closed']]));
P.coolpump=c=>`<div class="row">${btn(c.broken?'Replace belt':'Break belt','togglebelt')}</div>`;
P.intakefilter=c=>fld('Clogging (%)',nI('clog',c.clog,0,100,5))+fld('Dust factor (×)',nI('dirt',c.dirt,0,50,.5))+`<div class="row">${btn('Replace element','newfilter')}</div>`;
P.turbocharger=c=>fld('Max boost (bar)',nI('maxBoost',c.maxBoost,.2,3,.1))+fld('Health (1 = new)',nI('health',c.health,0,1,.05));
P.intercooler=c=>fld('Effectiveness',nI('eff',c.eff,.1,.95,.05))+fld('Fouling (%)',nI('foul',c.foul,0,100,5))+`<div class="row">${btn('Clean core','cleanrad')}</div>`;
P.muffler=c=>fld('Back-pressure at rated (kPa)',nI('rest',c.rest,.5,15,.5))+fld('Soot (%)',nI('clog',c.clog,0,100,5))+`<div class="row">${btn('Clean muffler','cleanmuf')}</div>`;
{const _pe=P.engine4s;P.engine4s=c=>_pe(c)+fld('Rated with',sel('aspiration',c.aspiration||'natural',[['natural','Natural aspiration'],['turbo','Turbocharger']]));}
Object.assign(ACT,{cleanrad:c=>{c.foul=0;},togglebelt:c=>{c.broken=!c.broken;},newfilter:c=>{c.clog=0;},cleanmuf:c=>{c.clog=0;}});
for(const [k,f] of Object.entries({radiator:c=>c.foul>=99?[]:[['WATER_IN','WATER_OUT']],coolpump:c=>c.broken?[]:[['WATER_IN','WATER_OUT']],intercooler:()=>[['AIR_IN','AIR_OUT']],muffler:c=>c.clog>=99?[]:[['EXHAUST_IN','EXHAUST_OUT']],turbocharger:()=>[['AIR_IN','AIR_OUT'],['EXHAUST_IN','EXHAUST_OUT']],
  enginethermostat:c=>{const p=num(c.pos,0),o=[];if(p<.999)o.push(['WATER_IN','WATER_OUT']);if(p>.001)o.push(['WATER_IN','WATER_RAD'],['WATER_RET','WATER_OUT']);return o;}}))window.PASSMAP[k]=f;
/* air + exhaust substances for the pipe network */
{const _s=step;step=function(dt){_s(dt);try{if(!window.PR)return;for(const p of comps)if(p.type==='intakefilter'&&num(p.clog,0)<99.5)addSub(p,'AIR_OUT','air');
  for(const e of comps)if(e.type==='engine4s'&&e.firing)addSub(e,'EXHAUST','flue');}catch(x){}};}
/* chilled water delivered to a tank: the tank takes the condenser's outlet temperature instead of the pump's */
{const _s2=step;step=function(dt){const prev=new Map();for(const t of comps)if(t.type==='tank'||t.type==='silo'||t.type==='silopump')prev.set(t.id,Number(t.temperature));
  _s2(dt);try{const hu=sim.hu;if(!hu)return;
    for(const c of comps){if(c.type!=='chwcondenser'||!c._act)continue;const rO=hu.find(key(c.id,'WATER_OUT'));
      for(const t of comps){if((t.type!=='tank'&&t.type!=='silo'&&t.type!=='silopump')||hu.find(key(t.id,'IN'))!==rO)continue;const inflow=Math.max(0,num(t._in,0));if(inflow<=0)continue;
        const p0=Number.isFinite(prev.get(t.id))?prev.get(t.id):20;t.temperature=p0+(c._tOut-p0)*Math.min(1,inflow*dt*.6);}}}catch(e){}};}
P.chwcondenser=c=>fld('Running',cI('on',c.on!==false))
  +`<div class="note" style="color:${c.powered?'var(--ok)':'var(--bad)'};font-weight:700">ELECTRICAL POWER: ${c.powered?'230 V LIVE (powered)':'NO POWER (wire 230 V AC supply to L and N)'}</div>`
  +fld('Coolant fluid',sel('coolant',c.coolant||'glycol',[['glycol','Glycol / Water 50:50 (to -37°C)'],['brine','Calcium Chloride Brine (to -52°C)'],['water','Pure Water (freezes at 0°C)']]))
  +fld('Target setpoint (°C)',nI('setpoint',c.setpoint,-50,30,.5))
  +fld('Cooling capacity (kW)',nI('cap',c.cap,10,5000,25))
  +fld('Ambient air (°C)',nI('amb',c.amb,-20,60,1))
  +fld('Nominal COP rating',nI('copNom',c.copNom||3.4,1.5,6.0,.1))
  +fld('Condenser coil fouling (%)',nI('foul',c.foul,0,100,5))
  +`<div class="row">${btn('Clean condenser coil','cleancond')}</div>`;
ACT.cleancond=c=>{c.foul=0;};


Object.assign(ACT,{engstart:c=>{c.estop=false;c.cmdRun=true;c._cmdStartT=10;c.failMsg='';},engstop:c=>{c.cmdRun=false;},estop:c=>{c.estop=!c.estop;if(c.estop)c.cmdRun=false;},engrst:c=>{c.fault='';c.failMsg='';c._oilT=0;c.estop=false;c._genTrip=false;},drainoil:c=>{c.oilLevel=0;},draincool:c=>{c.coolLevel=0;},refill:c=>{c.level=100;}});
ACT.fixburn=(o=>c=>{o(c);c.sheared=false;})(ACT.fixburn);
P.geartrain=c=>fld('Speed ratio (out/in)',nI('ratio',c.ratio,.1,10,.05))+fld('Break torque (N·m)',nI('tlim',c.tlim,100,50000,100))+fld('Lubrication %',nI('lube',c.lube,0,100,5))+(c.sheared||num(c.wear,0)>0?btn('trfix','Replace / service'):'');
P.beltdrive=c=>fld('Driver pulley (mm)',nI('d1',c.d1,50,600,10))+fld('Driven pulley (mm)',nI('d2',c.d2,50,600,10))+fld('Belt tension %',nI('tension',c.tension,0,100,5))+fld('Break torque (N·m)',nI('tlim',c.tlim,100,50000,100))+(c.sheared?btn('trfix','Replace belt'):'');
P.chaindrive=c=>fld('Driver sprocket (teeth)',nI('z1',c.z1,8,60,1))+fld('Driven sprocket (teeth)',nI('z2',c.z2,8,100,1))+fld('Lubrication %',nI('lube',c.lube,0,100,5))+fld('Break torque (N·m)',nI('tlim',c.tlim,100,50000,100))+(c.sheared||num(c.wear,0)>0?btn('trfix','Replace / re-tension'):'');
const cmpP=(multi)=>c=>{const air=c.type.startsWith('air');return fld('Armed',cI('on',c.on!==false))+(multi?fld('Stages',nI('stages',c.stages,2,6,1)):'<div class="note">Single-stage compression.</div>')+fld('Discharge pressure (bar)',nI('pressureBar',c.pressureBar,air?1:2,air?20:80,.5))+fld('Inlet pressure (bar)',nI('inletBar',c.inletBar,air?.05:.5,air?5:30,.05))+fld('Rated flow (m³/h)',nI('ratedFlow',c.ratedFlow,air?5:5,air?500:2000,5))+fld('Shaft power (kW)',nI('powerKw',c.powerKw,1,120,.5))+fld('Ambient (°C)',nI('amb',c.amb,-20,55,1))+`<div class="note">${c.state||'—'} · ${num(c._pIn,0).toFixed(2)} → ${num(c._pOut,0).toFixed(1)} bar · ${(num(c.flow,0)).toFixed(1)} m³/h · ${num(c.kwOut,0).toFixed(1)} kW shaft load. Drive via SHAFT from engine / turbine.</div>`;};
P.aircompressor1=cmpP(false);P.aircompressor2=cmpP(true);P.gascompressor1=cmpP(false);P.gascompressor2=cmpP(true);
ACT.trfix=c=>{c.sheared=false;c.wear=0;c.lube=100;c._slip=false;c._slack=false;};
function loadGenset(){pushUndo();comps=[];wires=[];nextId=1;selected=null;
 const add=(t,x,y,ex,rot)=>{const c=newComp(t,x,y,rot||0);Object.assign(c,ex||{});comps.push(c);return c;};
 const L=(a,ta,b,tb)=>wires.push({id:nextId++,a:{c:a.id,t:ta},b:{c:b.id,t:tb},pts:[],bend:0,broken:false});
 const B=add('dcsource',60,330,{label:'BATT 24V',volts:24,on:true}),STP=add('pbnc',220,140,{label:'STOP'}),STA=add('pbno',220,470,{label:'START'}),
  E=add('engine4s',500,320,{label:'ENG1',nCyl:4,bore:100,stroke:120,bmep:16,cooling:'radiator',coolLevel:100,aspiration:'turbo'}),
  FT=add('fueltank',230,700,{label:'DIESEL',fuel:'diesel'}),OT=add('oiltank',400,730,{label:'LUBE'}),
  AF=add('intakefilter',330,40,{label:'AF1'}),TCH=add('turbocharger',760,120,{label:'TURBO'}),IC=add('intercooler',590,90,{label:'IC1'},2),MF=add('muffler',960,215,{label:'MUF1'}),
  WP=add('coolpump',560,560,{label:'WP1'},2),TH=add('enginethermostat',650,650,{label:'THV1'}),RD=add('radiator',880,700,{label:'RAD1'}),
  C1=add('shaftcoupling',760,320,{label:'CPL1'}),C2=add('shaftcoupling',760,520,{label:'CPL2'}),
  G=add('generator',940,320,{label:'GEN1',kva:80}),M=add('motor',940,560,{label:'PUMP1',hp:10}),LD=add('load3',1160,320,{label:'LOAD',kw:30}),SP=add('sump',1160,740,{label:'SUMP'}),CW=add('chwcondenser',1250,520,{label:'CHW1'}),TK=add('tank',1530,520,{label:'CHW TANK'});
 L(B,'+',E,'B+');L(B,'-',E,'B-');L(B,'+',STP,'11');L(STP,'12',E,'FSOL');L(B,'+',STA,'13');L(STA,'14',E,'START');
 L(FT,'OUT',E,'FUEL_IN');L(OT,'OUT',E,'OIL_IN');
 L(AF,'AIR_OUT',TCH,'AIR_IN');L(TCH,'AIR_OUT',IC,'AIR_IN');L(IC,'AIR_OUT',E,'AIR_IN');L(E,'EXHAUST',TCH,'EXHAUST_IN');L(TCH,'EXHAUST_OUT',MF,'EXHAUST_IN');
 L(E,'COOL_OUT',TH,'WATER_IN');L(TH,'WATER_RAD',RD,'WATER_IN');L(RD,'WATER_OUT',TH,'WATER_RET');L(TH,'WATER_OUT',WP,'WATER_IN');L(WP,'WATER_OUT',E,'COOL_IN');
 L(E,'SHAFT',C1,'A');L(C1,'B',G,'SHAFT');L(E,'SHAFT',C2,'A');L(C2,'B',M,'SHAFT');
 ['L1','L2','L3','N'].forEach(t=>L(G,t,LD,t));L(G,'L1',CW,'L');L(G,'N',CW,'N');L(SP,'OUT',M,'SUC');L(M,'DIS',CW,'WATER_IN');L(CW,'WATER_OUT',TK,'IN');
 renderProps();fit();log('Loaded engine-genset: fuel tank and oil reservoir are piped to the engine; coolant runs in a closed loop (engine → thermostat → radiator → pump), intake air goes filter → turbo → intercooler and exhaust goes turbo → muffler; shafts are wired engine → coupling → generator / pump. Tap START once to crank; the STOP circuit feeds the fuel solenoid. The generator supplies electrical power to the 3-phase load and powers the chilled-water condenser unit (CHW1) across L and N. The engine-driven pump sends water through CHW1 into the tank, so the tank fills with chilled water.');}
{const h=$('bTplIO')||$('bTplHVAC')||$('bTpl3')||$('bTpl');if(h){h.insertAdjacentHTML('afterend','<button id="bTplGen">★ Engine-genset</button>');$('bTplGen').onclick=loadGenset;}window.loadGensetTemplate=loadGenset;}

/* ───────── palette ───────── */
(function(){const groups=$('componentGroups');if(!groups)return;
 const SEC=[[C_HYD,'#60a5fa',['spoolvalve','poppetvalve','cylsingle','cyldouble','hydmotor']],[C_CMP,'#34d399',CMP_TYPES],[C_ENG,'#f59e0b',['engine4s','shaftcoupling','geartrain','beltdrive','chaindrive','fueltank','oiltank','radiator','enginethermostat','coolpump','intakefilter','turbocharger','intercooler','muffler','chwcondenser']],[C_REL,'#f472b6',Object.keys(RLY)],[C_SOL,'#38bdf8',Object.keys(SVD)],[C_PNL,'#fbbf24',[...Object.keys(PLC).map(k=>'pl_'+k),...Object.keys(PBD),'ls1','ls2','psu24']],[C_TB,'#a3e635',['tbfeed','tbpe','tbfuse','tbdisc','tbstrip']],[C_SEN,'#22d3ee',['tc','rtd','tempctrl',...Object.keys(SEN),'target','encoder']],[C_MOT,'#fb923c',['servodrive','servomotor','stepperdrive','steppermotor']],[C_SW,'#f87171',['acb','vcb']],[C_PQ,'#c084fc',['harmfilter','ups1','ups3']],[C_PRC,'#5eead4',['dryer']]];
 for(const [cat,col,keys] of SEC.slice().reverse()){const s=document.createElement('section');s.className='palette-group';s.dataset.category=cat;s.innerHTML=`<div class="cat" style="--a:${col}">${cat}</div><div class="grid2"></div>`;const g=s.querySelector('.grid2');
  for(const k of keys){const d=DEFS[k];const el=document.createElement('div');el.className='item';el.draggable=true;el.dataset.type=k;el.style.setProperty('--a',col);el.title='Drag to board or click to add';el.innerHTML=`<div class="ic">${ICON[k]}</div><div class="nm">${d.name}</div>`;
   el.addEventListener('dragstart',ev=>ev.dataTransfer.setData('text/plain',k));el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(k,p.x+n,p.y+n);});g.appendChild(el);}
  groups.insertBefore(s,groups.firstChild);}
 const pin=()=>{const order=SEC.map(x=>x[0]);const els=order.map(n=>[...groups.querySelectorAll('.palette-group')].find(g=>g.dataset.category===n)).filter(Boolean);els.slice().reverse().forEach(e=>groups.insertBefore(e,groups.firstChild));};pin();setTimeout(pin,700);setTimeout(pin,2500);
 const s=$('componentSearch');if(s)s.dispatchEvent(new Event('input'));})();

/* ───────── control-panel template ───────── */
function loadIO(){pushUndo();comps=[];wires=[];nextId=1;selected=null;
 const add=(t,x,y,ex,rot)=>{const c=newComp(t,x,y,rot||0);Object.assign(c,ex||{});comps.push(c);return c;};
 const L=(a,ta,b,tb,pts)=>wires.push({id:nextId++,a:{c:a.id,t:ta},b:{c:b.id,t:tb},pts:pts||[],bend:0,broken:false});
 const S=add('source',80,170,{label:'Mains'}),Q=add('mcb',230,170,{label:'QF1'}),P=add('psu24',400,170,{label:'PSU'}),
  STP=add('pbnc',640,60,{label:'STOP'}),STA=add('pbno',800,60,{label:'START'}),K=add('rly_din2',1000,200,{label:'K1'}),H1=add('pl_green',1200,150,{label:'RUN'}),H2=add('pl_red',1200,290,{label:'STOPPED'}),
  SN=add('ind_sensor',640,430,{label:'IS1'}),TG=add('target',800,430,{label:'TGT',motion:'oscillate',amp:70,period:4}),H3=add('pl_amber',1000,430,{label:'PART'}),
  TC=add('tc',250,560,{label:'TC1',reach:260}),HT=add('heater',440,600,{label:'HT1',watts:2000}),TIC=add('tempctrl',250,740,{label:'TIC1',sp:50});
 L(S,'L',Q,'Lin');L(S,'N',Q,'Nin');L(Q,'Lout',P,'L');L(Q,'Nout',P,'N');L(S,'PE',P,'PE');
 L(P,'+',STP,'11');L(STP,'12',STA,'13');L(STA,'14',K,'A1');L(STP,'12',K,'11');L(K,'14',STA,'14');L(K,'A2',P,'-');
 L(P,'+',K,'21');L(K,'24',H1,'X1');L(K,'22',H2,'X1');L(H1,'X2',P,'-');L(H2,'X2',P,'-');
 L(P,'+',SN,'BN');L(P,'-',SN,'BU');L(SN,'BK',H3,'X1');L(H3,'X2',P,'-');
 L(Q,'Lout',TIC,'L');L(Q,'Nout',TIC,'N');L(TC,'+',TIC,'TC+');L(TC,'-',TIC,'TC-');L(Q,'Lout',TIC,'O_C');L(TIC,'O_NO',HT,'L');L(Q,'Nout',HT,'N');
 renderProps();fit();log('Loaded control-panel template: 24 V PSU, START/STOP seal-in on a DIN relay with RUN/STOP lamps, inductive sensor + oscillating target, thermocouple + temperature controller + heater. Press START (hold the mouse on it).');}
const host=$('bTplHVAC')||$('bTplCG')||$('bTpl3')||$('bTpl');if(host){host.insertAdjacentHTML('afterend','<button id="bTplIO">★ Control-panel I/O</button>');$('bTplIO').onclick=loadIO;}
window.loadIOTemplate=loadIO;

/* saved circuits are loaded before these types exist — reload so they are not dropped */
try{const s=localStorage.getItem('circuitLab.v1');if(s){const o=JSON.parse(s);if(o.comps&&o.comps.length>comps.length){loadObj(o);fit();}}}catch(e){}
log(`v15 module ready — ${MY.size} industrial components. Use ★ Control-panel I/O.`);
})();

