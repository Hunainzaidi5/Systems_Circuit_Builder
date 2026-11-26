
/* HVAC ANIMATION LAYER: refrigerant flow, cooling effects, active components. Additive; every hook is try/catch-guarded. */
(function(){
const TAU=Math.PI*2,A=()=>window.ANIM||0;
const lerp=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`;
const WARM=[255,176,90],COLD=[90,220,255],HOT=[255,80,50];
function hvacLab(c,bot,col){const d=DEFS[c.type];txt(c,c.label||d.name,0,-d.h/2-8,COL.text,9,'center',700);if(bot)txt(c,bot,0,d.h/2+9,col||COL.mut,9,'center',800);}
const run=()=>{let m=0;for(const c of comps)if(c.type==='refrigcompressor'&&c.powered)m=Math.max(m,(c.rpm||0)/2900);return Math.min(1,m);};
const cool=()=>comps.some(c=>((c.type==='dxevaporator'||c.type==='fancoil')&&c._cooling>0)||(c.type==='ahu'&&c.cooling>0)||(c.type==='chiller'&&c.powered));
const dot=(x,y,r,col,a)=>{ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.globalAlpha=1;};
function wrap(k,f,pre){const o=DRAW[k];if(!o)return;DRAW[k]=function(c){try{ctx.save();if(pre)pre(c);o(c);ctx.restore();f(c);}catch(e){try{ctx.restore();}catch(_){}}};}
function fan(x,y,r,on,col){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,r+1.5,0,TAU);ctx.strokeStyle=on?col:'#475569';ctx.lineWidth=1.2;ctx.stroke();ctx.rotate(on?A()*14:0);
  for(let i=0;i<4;i++){ctx.rotate(TAU/4);ctx.beginPath();ctx.ellipse(r*.5,0,r*.5,r*.2,0,0,TAU);ctx.fillStyle=on?col:'#475569';ctx.globalAlpha=on?.85:.6;ctx.fill();}ctx.restore();ctx.globalAlpha=1;}
function stream(x0,x1,y,n,a,b,spd,amp){const t0=A();for(let i=0;i<n;i++){const t=(t0*spd+i/n)%1;dot(x0+(x1-x0)*t,y+Math.sin(t0*5+i*2.1)*amp,1.8,lerp(a,b,Math.max(0,Math.min(1,(t-.3)/.4))),Math.sin(t*Math.PI)*.9);}}

/* ── refrigerant pipes, coloured by thermodynamic state ── */
const ST={hot:{c:'#ff4d2e',l:'#ffd2b0',g:'#7a1f14'},liq:{c:'#3b6cff',l:'#c7d7ff',g:'#1b2f8f'},mix:{c:'#22d3ee',l:'#e6fcff',g:'#0e5a73'},suc:{c:'#9be7f5',l:'#ffffff',g:'#12647a'}};
function rs(c,t){if(!c)return null;const T=c.type;
  if(T==='refrigcompressor')return t==='DIS'?'hot':'suc';
  if(T==='dxcondenser')return t==='REF_IN'?'hot':'liq';
  if(T==='dxevaporator')return t==='REF_IN'?'mix':'suc';
  if(T==='txv'||T==='eev')return t==='OUT'?'mix':'liq';
  if(T==='refrigaccum')return'suc';
  if(T==='reversingvalve'){if(t==='DIS_IN')return'hot';if(t==='SUC_OUT')return'suc';const h=t==='OUTDOOR'?!c.heat:!!c.heat;return h?'hot':'suc';}
  return'liq';}
function refState(w){const a=rs(getC(w.a.c),w.a.t),b=rs(getC(w.b.c),w.b.t);if(a===b)return a||'liq';
  for(const k of['hot','mix','suc'])if(a===k||b===k)return k;return'liq';}
const OUTS=new Set(['DIS','REF_OUT','OUT','SUC_OUT']);
function rdir(w){const a=OUTS.has(w.a.t),b=OUTS.has(w.b.t);return a&&!b?1:b&&!a?-1:pipeDir(w);}
function refOverlay(w,P){const tap=[getC(w.a.c),getC(w.b.c)].some(x=>x&&(x.type==='mgs'||x.type==='hpswitch')),k=run(),t=A(),s=refState(w),S=ST[s],dir=rdir(w);
  ctx.lineCap='round';ctx.lineJoin='round';
  drawPath(P);ctx.strokeStyle=S.g;ctx.globalAlpha=k?.95:.5;ctx.lineWidth=6.4;ctx.stroke();ctx.globalAlpha=1;
  if(!k||tap)return;
  drawPath(P);ctx.strokeStyle=S.c;ctx.globalAlpha=.55+.15*Math.sin(t*4);ctx.lineWidth=5;ctx.stroke();ctx.globalAlpha=1;
  const v=(s==='hot'?95:s==='suc'?85:s==='mix'?60:42)*k*dir;let i=0;
  if(s==='liq')walk(P,13,v,(x,y)=>{dot(x,y,4.5,S.c,.25);dot(x,y,2.6,S.l,.95);});
  else if(s==='mix')walk(P,11,v,(x,y)=>{dot(x,y,(i++%3===0)?3.2:1.6,S.l,.9);});
  else walk(P,19,v,(x,y)=>{dot(x,y,5,S.c,.2);dot(x+Math.sin(t*6+i)*1.4,y+Math.cos(t*5+i++)*1.4,2,S.l,.85);});ptTag(P,s);}

/* ── supply / return / exhaust air tinting ── */
function airOverlay(w,P){const hu=sim.hu,r=hu?hu.find(key(w.a.c,w.a.t)):null;if(!((hu&&sim.hflow.has(r))||(window.PF&&window.PF(w.a.c,w.a.t))))return;
  const e=[[getC(w.a.c),w.a.t],[getC(w.b.c),w.b.t]];let col=null;
  for(const[c,t]of e){if(!c)continue;const T=c.type;
    if(T==='diffuser'||(/AIR_OUT/.test(t)&&((T==='dxevaporator'||T==='fancoil')&&c._cooling>0||T==='ahu'&&c.cooling>0)))col=[90,220,255];
    else if(T==='dxcondenser'&&t==='AIR_OUT')col=[255,100,60];
    else if(!col&&(T==='hvaczone'||T==='returngrille'||T==='freshair'||T==='dxcondenser'||T==='dxevaporator'))col=[255,176,90];}
  if(!col)return;const cs=`rgb(${col})`;
  drawPath(P);ctx.strokeStyle=cs;ctx.globalAlpha=.2;ctx.lineWidth=7;ctx.lineCap='round';ctx.stroke();ctx.globalAlpha=1;
  walk(P,17,70*pipeDir(w),(x,y)=>{dot(x,y,3.6,cs,.2);dot(x,y,1.5,'#fff',.85);});}

const _dp=drawPipe;
drawPipe=function(w,P,now){_dp(w,P,now);if(w.broken)return;try{const pc=window.pipeClass?window.pipeClass(w):'water';
  if(pc==='refrig')refOverlay(w,P);else if(pc==='air')airOverlay(w,P);}catch(e){}};

/* ── half-cut (sectioned) reciprocating compressor: motor, crank, rod, piston, reed valves, oil sump ── */
const _cmpDraw=function(c){
  const on=!!c.powered,k=Math.min(1,(c.rpm||0)/2900),t=A();
  c._th=(c._th||0)+(sim.running?(window.dt||.016)*Math.min(sim.speed||1,4)*k*16:0);
  const th=c._th,sh=Math.sin(th),co=Math.cos(th),R=7,L=22,cy=16,pin=[14+R*sh,cy-R*co],py=pin[1]-Math.sqrt(L*L-R*R*sh*sh);
  const suc=sh>0,gasH=py-8+27,frac=Math.max(0,Math.min(1,1-(gasH-6)/14)),dis=!suc&&frac>.7;
  body(c,140,110,on?'#c084fc':COL.edge);
  ctx.fillStyle='#0a1220';rr(-60,-44,120,88,6);ctx.fill();
  ctx.save();ctx.beginPath();ctx.rect(-66,-50,132,100);ctx.rect(-60,-44,120,88);ctx.clip('evenodd');ctx.strokeStyle='#5b7088';ctx.lineWidth=.8;
  for(let i=-150;i<150;i+=5){ctx.beginPath();ctx.moveTo(i,-50);ctx.lineTo(i+100,50);ctx.stroke();}ctx.restore();
  // oil sump with splash
  ctx.fillStyle='rgba(183,121,31,.55)';ctx.beginPath();ctx.moveTo(-18,44);for(let x=-18;x<=60;x+=3)ctx.lineTo(x,34+Math.sin(x*.25+t*4*k)*1.2);ctx.lineTo(60,44);ctx.fill();
  if(on)for(let i=0;i<4;i++){const p=(t*1.6+i/4)%1;dot(14+Math.sin(i*4+th)*12,34-p*12,1.2,'#f6c453',(1-p)*.8);}
  // motor: stator cut + copper windings + rotor with rotating poles
  ctx.fillStyle='#475569';ctx.fillRect(-54,-8,34,12);ctx.fillRect(-54,28,34,10);
  for(let i=0;i<5;i++){dot(-50+i*7,-2,2.2,on?'#fbbf24':'#92400e',1);dot(-50+i*7,33,2.2,on?'#fbbf24':'#92400e',1);}
  if(on)glow(-37,16,30,`rgba(251,191,36,${.1+.08*Math.sin(t*8)})`);
  ctx.fillStyle='#94a3b8';ctx.fillRect(-50,6,26,20);ctx.fillStyle='#334155';for(let i=0;i<3;i++)ctx.fillRect(-48+((i*9+th*3)%26),6,3,20);
  ctx.strokeStyle='#cbd5e1';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-24,cy);ctx.lineTo(14,cy);ctx.stroke();
  // cylinder block, bore, gas
  ctx.fillStyle='#334155';ctx.fillRect(1,-27,5,44);ctx.fillRect(22,-27,5,44);
  const gc=suc?'rgba(90,220,255,.35)':null;ctx.fillStyle=gc||lerp(COLD,HOT,frac).replace('rgb','rgba').replace(')',',.45)');ctx.fillRect(6,-27,16,gasH-0);
  // crank, counterweight, rod, piston
  ctx.save();ctx.translate(14,cy);ctx.rotate(th);ctx.fillStyle='#64748b';ctx.beginPath();ctx.arc(0,0,11,0,Math.PI);ctx.fill();ctx.restore();
  ctx.fillStyle='#94a3b8';ctx.beginPath();ctx.arc(14,cy,3,0,TAU);ctx.fill();
  ctx.strokeStyle='#e2e8f0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(14,py);ctx.lineTo(pin[0],pin[1]);ctx.stroke();dot(pin[0],pin[1],2.4,'#f8fafc',1);
  ctx.fillStyle='#cbd5e1';ctx.fillRect(7,py-8,14,13);ctx.strokeStyle='#475569';ctx.lineWidth=1;for(const d of[-6,-3]){ctx.beginPath();ctx.moveTo(7,py+d);ctx.lineTo(21,py+d);ctx.stroke();}dot(14,py,1.8,'#334155',1);
  // head, suction/discharge chambers + passages, reed valves
  ctx.fillStyle='#64748b';ctx.fillRect(1,-37,26,10);ctx.fillStyle='#0e5a73';ctx.fillRect(3,-35,8,7);ctx.fillStyle='#7a1f14';ctx.fillRect(17,-35,8,7);
  ctx.fillStyle='#0e5a73';ctx.fillRect(-66,-30,70,8);ctx.fillStyle='#7a1f14';ctx.fillRect(24,-30,46,8);
  ctx.lineWidth=2;ctx.strokeStyle=suc&&on?'#7dd3fc':'#94a3b8';ctx.beginPath();ctx.moveTo(7,-27);ctx.lineTo(13,suc&&on?-22:-27);ctx.stroke();
  ctx.strokeStyle=dis&&on?'#fb923c':'#94a3b8';ctx.beginPath();ctx.moveTo(17,-27);ctx.lineTo(23,dis&&on?-32:-27);ctx.stroke();
  if(on)for(let i=0;i<6;i++){const p=(t*1.2*k+i/6)%1;dot(-64+66*p,-26,1.8,'#a5f3fc',.9);dot(26+42*p,-26,2,'#ffb089',.9);}
  glow(-66,-26,12,on?'rgba(90,220,255,.4)':'rgba(0,0,0,0)');glow(66,-26,14,on?'rgba(255,90,50,.5)':'rgba(0,0,0,0)');
  txt(c,'SUC',-52,-40,'#7dd3fc',7,'center',800);txt(c,'DIS',56,-40,'#fb923c',7,'center',800);txt(c,on?'RUN':'OFF',-36,45,on?COL.ok:COL.mut,8,'center',800);
  hvacLab(c,on?`${(c.suctionP||0).toFixed(1)}→${(c.dischargeP||0).toFixed(1)} bar · ${c.tons} T`:`${c.tons} T COMP`,on?COL.ok:COL.mut);};

DRAW.refrigcompressor=function(c){try{ctx.save();_cmpDraw(c);ctx.restore();}catch(e){try{ctx.restore();}catch(_){}if(!window._cmpErr){window._cmpErr=1;console.warn('compressor draw',e);}}};
/* ── corrected HVAC template: standard control circuit + standard refrigerant cycle ── */
function loadStd(){
  pushUndo();comps=[];wires=[];nextId=1;selected=null;
  const add=(t,x,y,ex,rot)=>{const c=newComp(t,x,y,rot||0);Object.assign(c,ex||{});comps.push(c);return c;};
  const L=(a,ta,b,tb,pts)=>wires.push({id:nextId++,a:{c:a.id,t:ta},b:{c:b.id,t:tb},pts:pts||[],bend:0,broken:false});
  const S=add('source',80,120,{label:'Mains',on:true}),Q=add('mcb',240,120,{label:'QF-HVAC',rating:32}),J=add('junction',400,140,{label:'N'});
  const KM=add('contactor',520,120,{label:'KM1'}),TS=add('thermostat',760,100,{label:'TSTAT',setpoint:22,mode:'cool'}),HP=add('hpswitch',900,100,{label:'HP'}),FZ=add('freezestat',1040,100,{label:'FZ'}),M=add('mgs',700,200,{label:'MGS'});
  const CMP=add('refrigcompressor',560,300,{label:'CMP-1',on:true,mode:'on',tons:5,kw:4.2}),CND=add('dxcondenser',820,300,{label:'COND'}),OA=add('freshair',820,190,{label:'Ambient',temperature:35});
  const RCV=add('receiver',940,420,{label:'RCV',level:70}),FD=add('filterdrier',820,440,{label:'FD'},2),SG=add('sightglass',680,440,{label:'SG'},2),TX=add('txv',540,440,{label:'TXV'},2);
  const EVP=add('dxevaporator',360,460,{label:'DX coil'},2),ACC=add('refrigaccum',360,320,{label:'ACC'});
  const ZN=add('hvaczone',300,660,{label:'Office',temperature:27,setpoint:22,load:3,occupancy:4}),DF=add('diffuser',160,560,{label:'SA'}),RG=add('returngrille',560,640,{label:'RA'});
  L(S,'L',Q,'Lin');L(S,'N',Q,'Nin');L(Q,'Nout',J,'l');L(S,'PE',CMP,'PE');
  L(Q,'Lout',KM,'L1');L(KM,'T1',CMP,'L');L(KM,'T1',CND,'L');L(J,'t',CMP,'N');L(J,'r',CND,'N');L(J,'b',EVP,'N');L(Q,'Lout',EVP,'L');
  L(Q,'Lout',TS,'COM');L(TS,'NO',HP,'a');L(HP,'b',FZ,'a');L(FZ,'b',KM,'A1');L(M,'LO',CMP,'SUC');L(M,'HI',CMP,'DIS');L(J,'t',KM,'A2');L(HP,'IN',CMP,'DIS');
  L(CMP,'DIS',CND,'REF_IN');L(CND,'REF_OUT',RCV,'IN');L(RCV,'OUT',FD,'IN');L(FD,'OUT',SG,'IN');L(SG,'OUT',TX,'IN');L(TX,'OUT',EVP,'REF_IN');L(EVP,'REF_OUT',ACC,'IN');L(ACC,'OUT',CMP,'SUC');
  L(OA,'OUT',CND,'AIR_IN');L(RG,'OUT',EVP,'AIR_IN');L(EVP,'AIR_OUT',DF,'IN');L(DF,'IN',ZN,'AIR_IN');L(ZN,'AIR_OUT',RG,'OUT');
  renderProps();fit();
  log('HVAC template (standard): thermostat COM–NO → HP switch → KM1 coil; KM1 contacts feed compressor + condenser fan. Charge held in liquid receiver (no service bottle). Press Run.');
}
const tb=$('bTplHVAC');if(tb)tb.onclick=loadStd;

/* ── condenser: fan, heat rejection, hot exhaust ── */
wrap('dxcondenser',c=>{tubes(c,'#ff7a45');fan(58,-37,6,!!c.fanOn,'#fdba74');if(!c.powered||run()<.05)return;const t=A();
  glow(0,-10,52,`rgba(255,110,50,${.14+.08*Math.sin(t*3)})`);stream(-66,66,16,9,WARM,HOT,.6,2);stream(-66,66,24,9,WARM,HOT,.6,2);
  for(let i=0;i<5;i++){const p=(t*.5+i/5)%1;dot(-40+i*20+Math.sin(t*3+i)*3,-30-p*14,2.4,'#ff9a5a',(1-p)*.5);}});

/* ── evaporator: fan, cold glow, frost, condensate, air cooled as it crosses the coil ── */
wrap('dxevaporator',c=>{tubes(c,'#67e8f9');fan(58,-37,6,!!c.fanOn,'#67e8f9');if(!(c._cooling>0))return;const t=A();
  glow(0,-10,52,`rgba(80,200,255,${.14+.08*Math.sin(t*3)})`);for(const y of[12,18,24])stream(-66,66,y,10,WARM,COLD,.5,2);
  for(let i=0;i<6;i++){const p=(t*.7+i*.37)%1;ctx.globalAlpha=Math.sin(p*Math.PI);ctx.fillStyle='#fff';ctx.fillRect(-46+((i*17)%92),-28+((i*13)%34),1.6,1.6);ctx.globalAlpha=1;}
  const fl=(c.rot||0)%4===2?-1:1;for(let i=0;i<3;i++){const p=(t*.8+i/3)%1;dot(-24+i*24,fl>0?10+p*18:-28-p*16,1.8,'#7dd3fc',1-p);}});

/* ── expansion valve: pressure drop + flash vapour ── */
wrap('txv',c=>{if(run()<.05)return;const t=A();
  for(let i=0;i<3;i++){const p=(t*1.4+i/3)%1;ctx.globalAlpha=1-p;ctx.strokeStyle='#a5f3fc';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(8,0,4+p*16,-1,1);ctx.stroke();ctx.globalAlpha=1;}
  for(let i=0;i<7;i++){const p=(t*1.2+i/7)%1;dot(10+p*24,Math.sin(i*5+t*6)*7*p,1.2+p*2,'#e6fcff',(1-p)*.9);}});

wrap('sightglass',c=>{if(!c.full||run()<.05)return;ctx.save();ctx.beginPath();ctx.arc(0,0,11,0,TAU);ctx.clip();ctx.strokeStyle='#e0f2fe';ctx.globalAlpha=.7;ctx.lineWidth=1.5;
  for(let i=0;i<4;i++){const x=-14+((A()*30+i*8)%32);ctx.beginPath();ctx.moveTo(x,-6+i*4);ctx.lineTo(x+5,-6+i*4);ctx.stroke();}
  if(c.bubbles)for(let i=0;i<4;i++){const p=(A()*.9+i/4)%1;dot(-8+i*5,8-p*16,1.6,'#fff',1);}ctx.restore();});
wrap('receiver',c=>{if(c.level<=5)return;const y=38-c.level*.76;ctx.save();rr(-18,-38,36,76,10);ctx.clip();ctx.beginPath();
  for(let x=-18;x<=18;x+=2)ctx.lineTo(x,y+Math.sin(x*.3+A()*4)*1.6);ctx.strokeStyle='#c4b5fd';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();});

/* ── hydronic / air-side active components ── */
for(const k of['chwpump','cwpump'])wrap(k,c=>{if(!(c.powered&&c.on))return;ctx.save();ctx.translate(0,-4);ctx.rotate(A()*12);ctx.strokeStyle='#7dd3fc';ctx.lineWidth=3;
  for(let i=0;i<3;i++){ctx.rotate(TAU/3);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(8,-6,18,-3);ctx.stroke();}ctx.restore();});
wrap('supplyfan',c=>fan(0,-4,16,!!(c.powered&&c.on),'#7dd3fc'));
wrap('chiller',c=>{if(!c.powered)return;ctx.save();ctx.beginPath();ctx.rect(-70,-40,140,50);ctx.clip();ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(-90+((A()*80)%230),-40,22,50);ctx.restore();
  fan(-56,-6,9,true,'#e0fbff');fan(56,-6,9,true,'#e0fbff');glow(0,-15,70,`rgba(80,220,255,${.1+.06*Math.sin(A()*3)})`);});
wrap('ahu',c=>{if(!c.powered)return;const f=(c.fanPct||80)/80;stream(-84,84,-25,10,WARM,c.cooling>0?COLD:WARM,.5*f,3);stream(-84,84,-14,8,WARM,c.cooling>0?COLD:WARM,.5*f,3);
  if(c.cooling>0)glow(5,-25,34,'rgba(80,200,255,.25)');if(c.heating>0)glow(55,-25,26,'rgba(255,120,50,.3)');});
wrap('fancoil',c=>{if(!c.powered)return;fan(38,-10,11,true,'#67e8f9');if(c._cooling>0){glow(-15,-10,32,'rgba(80,200,255,.25)');stream(-54,54,-10,8,WARM,COLD,.5,2);stream(-54,54,2,8,WARM,COLD,.5,2);}});
wrap('coolingcoil',c=>{if(c._cooling>0)glow(0,-2,46,`rgba(80,200,255,${.15+.08*Math.sin(A()*3)})`);});
wrap('heatingcoil',c=>{if((c.airOff||0)>30)glow(0,-2,46,`rgba(255,120,50,${.15+.08*Math.sin(A()*3)})`);});

/* ── room: warm/cool tint, drifting cold air, status chip ── */
wrap('hvaczone',c=>{const sp=+c.setpoint||22,e=(+c.temperature||sp)-sp,cl=cool();
  ctx.fillStyle=e>.5?`rgba(255,110,60,${Math.min(.28,e/20)})`:`rgba(70,190,255,${.12+Math.min(.14,-e/10)})`;ctx.fillRect(-58,-38,116,60);
  if(cl)for(let i=0;i<12;i++){const p=(A()*.25+i/12)%1;dot(-52+((i*53)%104)+Math.sin(A()*2+i)*4,-36+p*58,1.6,'#bfefff',Math.sin(p*Math.PI)*.8);}
  const lab=cl&&e>.5?'▼ COOLING':e<=.5?'✓ AT SETPOINT':'';if(lab)txt(c,lab,0,30,cl&&e>.5?'#7dd3fc':COL.ok,9,'center',800);});
wrap('diffuser',c=>{if(!cool())return;for(let i=0;i<3;i++){const p=(A()*.6+i/3)%1;ctx.globalAlpha=(1-p)*.7;ctx.strokeStyle='#7dd3fc';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,12+p*28,0,TAU);ctx.stroke();ctx.globalAlpha=1;}});
wrap('returngrille',c=>{if(!cool())return;for(let i=0;i<4;i++){const p=(A()*.5+i/4)%1;dot(-34+p*40,-8+(i%3)*8,1.8,'#ffb36b',Math.sin(p*Math.PI)*.8);}});
wrap('freshair',c=>{if(!c.on)return;for(let i=0;i<5;i++){const p=(A()*.5+i/5)%1;dot(-30+p*70,-14+(i%3)*14+Math.sin(A()*4+i)*2,1.8,'#ffd08a',Math.sin(p*Math.PI)*.8);}});
wrap('thermostat',c=>{if(c.call)glow(0,0,52,`rgba(255,159,28,${.12+.12*Math.sin(A()*6)})`);});
wrap('hvacctrl',c=>{if(!c.powered)return;dot(52,-34,3,'rgb(6,214,160)',.4+.6*(.5+.5*Math.sin(A()*5)));if(c.cool)glow(-30,12,16,'rgba(80,200,255,.35)');});

/* ── line P/T tags ── */
function ptTag(P,s){const cmp=comps.find(x=>x.type==='refrigcompressor'&&x.powered),cnd=comps.find(x=>x.type==='dxcondenser'),ev=comps.find(x=>x.type==='dxevaporator');if(!cmp)return;
  const sP=cmp.suctionP||0,dP=cmp.dischargeP||0,ct=cnd?cnd.temperature:45,et=ev?(ev.sst||4):4;
  const v={hot:[dP,ct+32],liq:[dP-.4,ct-(cnd?cnd.sc||6:6)],mix:[sP,et],suc:[sP,et+8]}[s];
  let bi=0,bl=0;for(let i=0;i<P.length-1;i++){const l=Math.hypot(P[i+1].x-P[i].x,P[i+1].y-P[i].y);if(l>bl){bl=l;bi=i;}}if(bl<60)return;
  const x=(P[bi].x+P[bi+1].x)/2,y=(P[bi].y+P[bi+1].y)/2,q=`${v[0].toFixed(1)} bar · ${Math.round(v[1])}°C`;
  ctx.font='700 9px Inter,sans-serif';const w=ctx.measureText(q).width+10;ctx.fillStyle='rgba(6,13,24,.88)';rr(x-w/2,y-18,w,13,4);ctx.fill();ctx.strokeStyle=ST[s].c;ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=ST[s].l;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(q,x,y-11.5);}

/* ── coil tube circuits (copper serpentine, refrigerant flowing inside) ── */
function tubes(c,col){const on=c.powered&&run()>.05,p=new Path2D();
  for(let i=0;i<4;i++){const y=-22+i*9,l=i%2===0;p.moveTo(l?-46:46,y);p.lineTo(l?46:-46,y);if(i<3)p.arc(l?46:-46,y+4.5,4.5,-Math.PI/2,Math.PI/2,!l);}
  ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#b45309';ctx.lineWidth=2.4;ctx.stroke(p);
  if(on){ctx.setLineDash([6,8]);ctx.lineDashOffset=-A()*40;ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.stroke(p);ctx.setLineDash([]);}}

/* ── manifold gauge set (service tool; taps SUC and DIS, passes no refrigerant) ── */
function gauge(x,y,r,v,mx,col){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,r+2,0,TAU);ctx.fillStyle='#1e293b';ctx.fill();ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fillStyle='#f3f1e8';ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r-3,Math.PI*.75,Math.PI*2.25);ctx.stroke();ctx.strokeStyle='#222';ctx.lineWidth=1;
  for(let i=0;i<=8;i++){const b=Math.PI*.75+Math.PI*1.5*i/8;ctx.beginPath();ctx.moveTo(Math.cos(b)*(r-9),Math.sin(b)*(r-9));ctx.lineTo(Math.cos(b)*(r-5),Math.sin(b)*(r-5));ctx.stroke();}
  const a=Math.PI*.75+Math.PI*1.5*Math.max(0,Math.min(1,v/mx));ctx.strokeStyle='#c0392b';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*(r-6),Math.sin(a)*(r-6));ctx.stroke();dot(0,0,2,'#222',1);ctx.restore();}
DEFS.mgs={name:'Manifold Gauge Set',tag:'MGS',icon:'🧭',cat:'HVAC System',w:150,h:110,term:[['LO',-45,55,0,1,'h'],['HI',45,55,0,1,'h']],init:{}};
if(window.PASSMAP)window.PASSMAP.mgs=()=>[];
try{COMP_BLURB.mgs='Service gauge set. LO hose to compressor suction, HI hose to discharge. Reads live pressure only; refrigerant is not consumed.';}catch(e){}
try{ICON.mgs=SV('<circle cx="8" cy="9" r="4"/><circle cx="16" cy="9" r="4"/><path d="M5 17h14M8 17v4M16 17v4"/>');}catch(e){}
DRAW.mgs=function(c){try{const cmp=comps.find(x=>x.type==='refrigcompressor'),has=t=>wires.some(w=>(w.a.c===c.id&&w.a.t===t)||(w.b.c===c.id&&w.b.t===t));
  const lo=has('LO')&&cmp?cmp.suctionP||0:0,hi=has('HI')&&cmp?cmp.dischargeP||0:0;c._lo=(c._lo||0)+(lo-(c._lo||0))*.12;c._hi=(c._hi||0)+(hi-(c._hi||0))*.12;
  body(c,150,110,'#94a3b8');ctx.fillStyle='#334155';ctx.fillRect(-62,24,124,14);dot(-30,31,5,'#2563eb',1);dot(30,31,5,'#dc2626',1);
  gauge(-40,-10,26,c._lo,10,'#2563eb');gauge(40,-10,26,c._hi,35,'#dc2626');txt(c,'LOW',-40,31,'#fff',7,'center',800);txt(c,'HIGH',40,31,'#fff',7,'center',800);
  hvacLab(c,`LO ${c._lo.toFixed(1)} · HI ${c._hi.toFixed(1)} bar`,COL.ok);}catch(e){}};
const _de=describe;describe=function(c){return c.type==='mgs'?`LO: ${(c._lo||0).toFixed(1)} bar\nHI: ${(c._hi||0).toFixed(1)} bar`:_de(c);};
setTimeout(function(){const g=[...document.querySelectorAll('.palette-group')].find(s=>s.dataset.category==='HVAC System');if(!g)return;const d=DEFS.mgs,el=document.createElement('div');
  el.className='item';el.draggable=true;el.dataset.type='mgs';el.style.setProperty('--a','#5eead4');el.innerHTML=`<div class="ic">${ICON.mgs||d.icon}</div><div class="nm">${d.name}</div>`;
  el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain','mgs'));
  el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2);addComp('mgs',p.x,p.y);});g.querySelector('.grid2').appendChild(el);},600);

/* ── anti-short-cycle lockout (runs after the hvac tick) ── */
Game.register('hvac-asc',{tick(dt,x){for(const c of comps)if(c.type==='refrigcompressor'){const lim=Number(c.ascTime)||60;
  if(c.powered){if(!c._on&&(c._off==null?1e9:c._off)<lim){c.powered=false;c._off+=dt;((x&&x.warnings)||[]).push(`${c.label}: anti-short-cycle lockout, ${Math.ceil(lim-c._off)} s left`);}else{c._on=true;c._off=0;}}
  else{c._on=false;c._off=(c._off==null?1e9:c._off+dt);}}},
  reset(){for(const c of comps)if(c.type==='refrigcompressor'){c._on=false;c._off=null;}}});

/* ── legend + circulation indicator ── */
const _d=draw;
draw=function(now){_d(now);try{if(!comps.some(c=>c.type==='refrigcompressor'))return;const r=cv.getBoundingClientRect(),k=run(),x=r.width-182,y=r.height-112;
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='rgba(6,13,24,.82)';ctx.strokeStyle='#1a2d48';rr(x,y,172,102,8);ctx.fill();ctx.stroke();
  ctx.font='800 9px Inter,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=k?'#06d6a0':'#7a92b0';ctx.fillText(k?'● REFRIGERANT CIRCULATING':'○ COMPRESSOR OFF',x+10,y+14);
  [['hot','Hot gas · high P'],['liq','Liquid · high P'],['mix','Cold mix · low P'],['suc','Cold vapour · low P']].forEach((q,i)=>{const yy=y+34+i*17;
    ctx.fillStyle=ST[q[0]].c;ctx.beginPath();ctx.arc(x+16,yy,5,0,TAU);ctx.fill();ctx.fillStyle='#e8f0fa';ctx.font='600 10px Inter,sans-serif';ctx.fillText(q[1],x+30,yy);});
  ctx.restore();}catch(e){try{ctx.restore();}catch(_){}}};
})();
