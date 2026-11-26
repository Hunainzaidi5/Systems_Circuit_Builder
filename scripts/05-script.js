
/* Realistic process dynamics and multi-service instruments (water / steam / gas). */
(function(){
 const lag=(obj,k,target,dt,tau)=>{const cur=Number(obj[k])||0;obj[k]=cur+(target-cur)*Math.min(1,dt/Math.max(.04,tau));};
 const rank={none:0,air:.5,water:1,gas:2,steam:3,flue:4};
 const pickKind=(a,b)=>rank[b||'none']>rank[a||'none']?b:a;
 const unitsFor=kind=>kind==='steam'?{flow:'kg/h',vol:'kg'}:kind==='gas'?{flow:'m³/h',vol:'m³'}:{flow:'L/min',vol:'L'};
 function samplePort(cid,term){
  const hu=buildHUF(),root=hu.find(key(cid,term));
  let kind='none',P=0,T=20,Q=0,L=NaN,vac=0,flowing=!!(sim.hflow&&sim.hflow.has(root))||!!(window.PF&&window.PF(cid,term));
  const add=(k,p,t,q,lv,v)=>{kind=pickKind(kind,k);if(p>P)P=p;if(t>T)T=t;if(q>Q)Q=q;if(Number.isFinite(lv))L=Number.isFinite(L)?Math.max(L,lv):lv;if(v>vac)vac=v;};
  for(const x of comps){
   for(const tm of (DEFS[x.type]&&DEFS[x.type].term)||[]){
    if(tm[5]!=='h'||hu.find(key(x.id,tm[0]))!==root)continue;
    const p=tm[0],n=String(p).toUpperCase();
    if(x.type==='motor'||x.type==='gearpump'){
     if(p==='DIS')add('water',x.pressure||0,x.temperature||20,(x.flow||0)*600,NaN,0);
     if(p==='SUC')add('water',0.02,20,(x.flow||0)*600,NaN,x.powered?Math.max(0.02,(x.pressure||0)*0.08):0);
    }
    else if(x.type==='tank'||x.type==='silo'||x.type==='silopump')add('water',Math.max(x.pressure||0,0.0294*(x.level||0)),x.temperature||20,((x._in||0)+(x._out||0))*600,x.level,0);
    else if(x.type==='sump')add('water',0.02,20,0,x.unlimited?100:x.level,0);
    else if(x.type==='feedwatertank')add('water',0.05+0.02*(x.level||0),x.temperature||120,0,x.level,0);
    else if(x.type==='feedwaterpump')add('water',x.on&&x.powered?(x.pressure||8):0,x.temperature||80,x.on&&x.powered?(x.flow||100)*10:0,NaN,x.on&&x.powered&&p==='IN'?0.15:0);
    else if(x.type==='boiler'){if(/STEAM/.test(n))add('steam',x.pressure||0,x.temperature||200,x.on?x.fuelRate*20:0,NaN,0);else if(/WATER/.test(n))add('water',0.08,120,0,x.waterLevel,0);else if(/FUEL/.test(n))add('gas',2,40,x.on?x.fuelRate:0,NaN,0);}
    else if(x.type==='steamgenerator'){if(/STEAM/.test(n))add('steam',x.pressure||0,x.temperature||500,x.on?40:0,NaN,0);else if(/WATER/.test(n))add('water',2,120,x.on?30:0,NaN,0);else if(/FUEL/.test(n))add('gas',3,40,x.on?20:0,NaN,0);}
    else if(x.type==='hrsg'){if(/STEAM/.test(n))add('steam',x._active?x.pressure||60:0,x._active?x.temperature||480:40,x._active?(x.steamFlow||0)*1000:0,NaN,0);else if(/WATER/.test(n))add('water',2,60,0,NaN,0);else add('flue',0.04,x._active?280:150,0,NaN,0);}
    else if(x.type==='steamsource'){if(/STEAM/.test(n))add('steam',x.on?x.pressure||100:0,x.on?x.temperature||500:40,x.on?(x.flow||50)*1000:0,NaN,0);else add('water',1,90,0,NaN,0);}
    else if(x.type==='steampipe'||x.type==='superheater'||x.type==='reheater'||x.type==='hpsystem')add('steam',x.pressure||100,((x.type==='superheater'||x.type==='reheater')&&x._fin===false||x._fout===false)?150:(x.temperature||500),flowing?20000:0,NaN,0);
    else if(x.type==='lpsystem')add('steam',x.pressure||5,x.temperature||150,flowing?4000:0,NaN,0);
    else if(x.type==='steamheader'&&x.flow>0)add('steam',x.pressure||0,x.temperature||0,x.flow,NaN,0);
    else if(x.type==='condenser'){if(/STEAM/.test(n))add('steam',x.pressure||0.08,x.temperature||40,0,NaN,Math.max(0,1-(x.pressure||0.08)));else if(/COND/.test(n))add('water',0.2,x.temperature||35,20,NaN,0);else add('water',1.5,25,40,NaN,0);}
    else if(x.type==='steamturbine'){if(/STEAM/.test(n))add('steam',x.pressure||20,x.temperature||480,x.on?30000:0,NaN,0);else if(/COND/.test(n))add('water',0.3,40,x.on?20:0,NaN,0);else add('steam',0.2,80,x.on?5000:0,NaN,0);}
    else if(x.type==='naturalgas'||x.type==='gaswell')add('gas',x.on?x.pressure||20:0,x.temperature||40,x.on?x.flow||100:0,NaN,0);
    else if(x.type==='lpgtank')add('gas',x.pressure||8,x.temperature||20,x.level>0?50:0,x.level,0);
    else if(x.type==='gastank')add('gas',x.pressure||20,30,x.level>0?x.flow||20:0,x.level,0);
    else if(x.type==='gasboosterpump')add('gas',x.on&&x.powered&&x._supplied?(p==='OUT'?x.pressure||30:Math.max(1,(x.pressure||30)*0.3)):0,45,x.on&&x.powered&&x._supplied?x.flow||60:0,NaN,0);
    else if(x.type==='steamboosterpump')add('steam',x.on&&x.powered&&x._supplied?(p==='OUT'?x.pressure||40:Math.max(1,(x.pressure||40)*0.4)):0,x.on&&x.powered&&x._supplied?280:150,x.on&&x.powered&&x._supplied?x.flow||5000:0,NaN,0);
    else if(x.type==='airsupply'){const un=!!x.unlimited,sup=airReady(x),sp=un?1:Math.min(1,Math.max(0,Number(x._spd)||0));add('air',sup?(un?1.013:(x.pressure||1.2)*sp):0,sup?(Number(x.temperature)||25):25,sup?(un?1e9:(x.flow||2000)*sp):0,NaN,0);}
    else if(x.type==='fluestack')add('flue',0.01,x._receiving?250:25,0,NaN,0);
    else if(x.type==='gascompressor')add('gas',x.on&&x.powered?(p==='OUT'?x.pressure||20:x.pressure*0.4||4):0,45,x.on&&x.powered?x.flow||100:0,NaN,x.on&&x.powered&&p==='IN'?0.2:0);
    else if(x.type==='aircompressor1'||x.type==='aircompressor2'){const on=!!(x.on&&x.powered);add('air',on?(p==='AIR_OUT'?x._pOut||x.pressureBar||x.pressure||8:(x._pIn||Math.max(.2,(x.pressureBar||x.pressure||8)*.25))):0,on?(x._tOut||35):25,on&&x._supplied?(x.flow||30):0,NaN,on&&p==='AIR_IN'?Math.max(0,.08-(x._pIn||0)):0);}
    else if(x.type==='gascompressor1'||x.type==='gascompressor2'){const on=!!(x.on&&x.powered);add('gas',on?(p==='GAS_OUT'?x._pOut||x.pressureBar||x.pressure||20:(x._pIn||Math.max(1,(x.pressureBar||x.pressure||20)*.3))):0,on?(x._tOut||45):40,on&&x._supplied?(x.flow||60):0,NaN,on&&p==='GAS_IN'?Math.max(0,.1-(x._pIn||0)):0);}
    else if(x.type==='pressureregulator')add('gas',p==='OUT'?x.output||x.setpoint||20:x.setpoint*1.6||30,25,flowing?80:0,NaN,0);
    else if(x.type==='gasmeter')add('gas',x.pressure||0,25,x.flow||0,NaN,0);
    else if(x.type==='gasturbine'){if(/GAS/.test(n))add('gas',12,40,x.on?200:0,NaN,0);else if(/AIR/.test(n))add('air',1,20,0,NaN,0);else add('flue',0.05,x.temperature||400,x.on?180:0,NaN,0);}
    else if(x.type==='burner'||x.type==='combustionchamber'||x.type==='furnace'||x.type==='flame'){if(/GAS|FUEL/.test(n))add('gas',x.on?3:0,40,x.on?40:0,NaN,0);else if(/AIR/.test(n))add('air',0.05,20,0,NaN,0);else add('flue',0.04,x.flameTemp||x.temperature||800,x.on?50:0,NaN,0);}
    else if(x.type==='deaerator')add(/STEAM/.test(n)?'steam':'water',/STEAM/.test(n)?2:1.5,x.temperature||150,10,60,0);
    else if(x.type==='coolingtower')add('water',0.8,p==='HOT_IN'?38:24,30,NaN,0);
    else if(x.type==='economizer')add(/WATER/.test(n)?'water':'flue',/WATER/.test(n)?8:0.04,/WATER/.test(n)?((x._fin===false||x._fout===false)?60:180):280,20,NaN,0);
   }
  }
  if(window.PR){
   const s=window.PR.S.get(window.PR.uf.find(key(cid,term)));
   if(s){if(s.has('steam'))kind=pickKind(kind,'steam');else if(s.has('gas'))kind=pickKind(kind,'gas');else if(s.has('flue'))kind=pickKind(kind,'flue');else if(s.has('air'))kind=pickKind(kind,'air');else if(s.has('water'))kind=pickKind(kind,'water');}
  }
  if(kind==='none'&&(P>0.01||Q>0||Number.isFinite(L)))kind='water';
  return{kind,P,T,Q,L,vac,flowing};
 }
 const originalStep=step;
 step=function(dt){
  originalStep(dt);
  const st=evalCircuit();
  const has= (c,t,k)=>{if(!window.PR)return false;const s=window.PR.S.get(window.PR.uf.find(key(c.id,t)));return!!s&&s.has(k);};
  for(const c of comps){
   if(c.type==='boiler'){
    const fire=!!c.on&&has(c,'FUEL','gas')&&has(c,'WATER','water');
    const targetP=fire?Math.max(8,Number(c.pressure)||100):1;
    const sat=100+0.7*targetP;
    lag(c,'pressure',fire?targetP:Math.max(1,(c.pressure||1)*0.92),dt,fire?25:40);
    lag(c,'temperature',fire?sat:22,dt,fire?30:50);
    if(fire)c.waterLevel=Math.max(8,(c.waterLevel||80)-dt*0.04);
    else if(has(c,'WATER','water'))c.waterLevel=Math.min(95,(c.waterLevel||80)+dt*0.02);
   }
   if(c.type==='steamgenerator'){
    const fire=!!c.on&&has(c,'FUEL_IN','gas')&&has(c,'WATER_IN','water');
    lag(c,'pressure',fire?Number(c.pressure||100):2,dt,fire?20:35);
    lag(c,'temperature',fire?Number(c.temperature||500):40,dt,fire?28:45);
   }
   if(c.type==='steamtrap')c.open=has(c,'IN','steam')||has(c,'IN','water');
   if(c.type==='feedwaterpump'){
    const wet=has(c,'IN','water')||(sim.hu&&comps.some(t=>t.type==='feedwatertank'&&sim.hu.find(key(t.id,'OUT'))===sim.hu.find(key(c.id,'IN'))));
    if(c.on&&c.powered&&wet){lag(c,'pressure',12,dt,4);lag(c,'flow',Number(c.flow||100),dt,3);c.temperature=90;}
    else{lag(c,'pressure',0,dt,3);lag(c,'flow',0,dt,2);}
   }
   if(c.type==='gascompressor'){
    if(c.on&&c.powered&&(has(c,'IN','gas')||comps.some(g=>['naturalgas','gaswell','gastank','lpgtank'].includes(g.type)))){lag(c,'pressure',Number(c.pressure||20),dt,5);lag(c,'flow',Number(c.flow||100),dt,4);}
    else{lag(c,'pressure',0,dt,4);lag(c,'flow',0,dt,3);}
   }
   if(c.type==='expansionjoint'){const s=samplePort(c.id,'IN');lag(c,'expansion',Math.max(0,(s.T-20)*0.12),dt,8);}
   if(c.type==='pipesupport'){const s=samplePort(c.id,'PIPE');c.load=s.P*12+(s.flowing?8:0);}
   if(c.type==='steampipe'){const s=samplePort(c.id,'IN');if(s.kind==='steam'){lag(c,'pressure',Math.max(c.pressure||0,s.P),dt,6);lag(c,'temperature',Math.max(c.temperature||100,s.T),dt,10);}else if(!s.flowing)lag(c,'temperature',40,dt,80);}
   if(c.type==='heater'&&c.powered)lag(c,'temperature',Math.min(180,20+c.watts/40),dt,20);
   else if(c.type==='heater')lag(c,'temperature',20,dt,40);
  }
  for(const m of comps.filter(x=>x.type==='energymeter')){
   const active=!st.cl.short&&live(st,m,'L','N');let watts=0;
   if(active){
    for(const c of comps){if(c.id===m.id)continue;let a,b,p=0;
     if(c.type==='motor'&&c.powered){a='L';b='N';p=c.hp*746/Math.max(.1,c.eff);}
     else if(c.type==='gearpump'&&c.powered&&c.drive!=='shaft'){a='L';b='N';p=c.hp*746/Math.max(.1,c.eff);}
     else if(c.type==='lamp'&&c.powered){a='a';b='b';p=c.watts;}
     else if(['heater','fan','ledstrip'].includes(c.type)&&c.powered){a='L';b='N';p=c.watts;}
     if(a&&b){const ra=st.uf.find(key(c.id,a)),rb=st.uf.find(key(c.id,b)),rl=st.uf.find(key(m.id,'L')),rn=st.uf.find(key(m.id,'N'));if(ra===rl||rb===rl||ra===rn||rb===rn)watts+=p;}
    }
   }
   m.voltage=active?(sim.volts||220):0;m.kw=watts/1000;m.current=active?watts/Math.max(1,m.voltage):0;if(dt>0)m.kwh+=(m.kw*dt/3600);
  }
  const gasTypes=new Set(['gaswell','naturalgas','lpgtank','gastank','gasvalve','gasfilter','gasmeter','pressureregulator','gascompressor','gascompressor1','gascompressor2','gasboosterpump','burner','combustionchamber','flame','furnace','gasturbine']);
  const edges=new Map(),edge=(a,b)=>{if(!edges.has(a))edges.set(a,[]);edges.get(a).push(b);};
  for(const w of wires)if(isPipe(w)&&!w.broken){edge(key(w.a.c,w.a.t),key(w.b.c,w.b.t));edge(key(w.b.c,w.b.t),key(w.a.c,w.a.t));}
  for(const c of comps){if(!gasTypes.has(c.type))continue;let pairs=[];
   if(['gasmeter','gasfilter','pressureregulator'].includes(c.type)&&!(c.type==='gasfilter'&&c.clogged))pairs=[['IN','OUT']];
   if(c.type==='gasvalve'&&c.open)pairs=[['IN','OUT']];
   if((c.type==='gascompressor'||c.type==='gascompressor1'||c.type==='gascompressor2'||c.type==='gasboosterpump')&&c.on&&c.powered)pairs=[c.type==='gascompressor'||c.type==='gasboosterpump'?[['IN','OUT']]:[['GAS_IN','GAS_OUT']]];
   if(c.type==='gastank'&&c.level>0)pairs=[['IN','OUT']];
   if(c.type==='gasturbine'&&c.on&&c.fuel>0)pairs=[['GAS_IN','EXHAUST']];
   if(c.type==='burner'&&c.on)pairs=[['GAS_IN','FLAME_OUT']];
   if(c.type==='combustionchamber'&&c.on)pairs=[['FUEL_IN','FLAME_OUT']];
   if(c.type==='furnace'&&c.on)pairs=[['FUEL_IN','HEAT_OUT']];
   for(const [a,b] of pairs){edge(key(c.id,a),key(c.id,b));edge(key(c.id,b),key(c.id,a));}
  }
  const seen=new Set(),q=[];for(const c of comps)if((c.type==='naturalgas'&&c.on)||(c.type==='gaswell'&&c.on)||(c.type==='lpgtank'&&c.level>0)||(c.type==='gastank'&&c.level>0)){const k=key(c.id,'OUT');seen.add(k);q.push(k);}
  while(q.length){for(const v of edges.get(q.shift())||[])if(!seen.has(v)){seen.add(v);q.push(v);}}
  for(const m of comps.filter(x=>x.type==='gasmeter')){
   const supplied=seen.has(key(m.id,'IN'))&&seen.has(key(m.id,'OUT'));
   const src=comps.find(c=>['naturalgas','gaswell','lpgtank','gastank'].includes(c.type)&&seen.has(key(c.id,'OUT')));
   const demand=comps.some(c=>['burner','combustionchamber','furnace','gasturbine'].includes(c.type)&&seen.has(key(c.id,c.type==='gasturbine'?'GAS_IN':c.type==='burner'?'GAS_IN':'FUEL_IN'))&&c.on);
   const tgtF=supplied&&src&&demand?Math.max(0,Number(src.flow||100)):0,tgtP=supplied&&src?Number(src.pressure||20):0;
   lag(m,'flow',tgtF,dt,.6);lag(m,'pressure',tgtP,dt,.5);if(dt>0)m.total+=(m.flow||0)*dt/3600;
  }
  const applyService=(c,detected)=>{const s=c.service&&c.service!=='auto'?c.service:detected;c.fluid=s||'none';return c.fluid;};
  for(const c of comps){
   if(c.type==='gauge'){const s=samplePort(c.id,'IN');applyService(c,s.kind);lag(c,'pressure',s.P,dt,.35);}
   if(c.type==='tempgauge'){const s=samplePort(c.id,'IN');applyService(c,s.kind);lag(c,'temperature',s.T,dt,.8);}
   if(c.type==='levelgauge'){const s=samplePort(c.id,'IN');applyService(c,s.kind);lag(c,'level',Number.isFinite(s.L)?s.L:0,dt,.5);}
   if(c.type==='vacuumgauge'){const s=samplePort(c.id,'IN');applyService(c,s.kind);lag(c,'pressure',s.vac,dt,.4);}
   if(c.type==='dpgauge'){const hi=samplePort(c.id,'HI'),lo=samplePort(c.id,'LO');applyService(c,pickKind(hi.kind,lo.kind));lag(c,'pressure',(hi.P||0)-(lo.P||0),dt,.4);}
   if(c.type==='flowmeter'||c.type==='rotameter'){
    const s=samplePort(c.id,'IN');const fluid=applyService(c,s.kind);const u=unitsFor(fluid);c.unit=u.flow;
    let q=s.Q;if(fluid==='steam'&&q<50&&s.flowing)q=Math.max(q,8000);if(fluid==='gas'&&q<1&&s.flowing)q=Math.max(q,40);
    if(!s.flowing&&s.Q<0.2)q=0;
    lag(c,'flow',q,dt,.45);if(dt>0)c.total+=(c.flow||0)*dt/3600;
   }
  }
 };
 const fluidCol=k=>k==='steam'?COL.warn:k==='gas'?'#e0a21a':k==='flue'?'#ef6f4a':k==='air'?'#9fc4dd':COL.neu;
 const dial=(c,label,value,max,unit,color)=>{body(c,c.w||70,c.h||70,COL.edge);ctx.beginPath();ctx.arc(0,0,19,Math.PI,2*Math.PI);ctx.strokeStyle='#5c7894';ctx.lineWidth=3;ctx.stroke();const f=Math.max(0,Math.min(1,(value||0)/Math.max(.001,max)));ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-19*Math.cos(Math.PI*f),-19*Math.sin(Math.PI*f));ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fillStyle=color;ctx.fill();txt(c,label,0,-25,COL.text,8,'center',800);txt(c,`${(value||0).toFixed(1)} ${unit}`,0,22,color,8,'center',800);txt(c,(c.fluid&&c.fluid!=='none'?c.fluid:'').toUpperCase(),0,32,fluidCol(c.fluid),7,'center',700);};
 DRAW.selector=function(c){body(c,100,80,COL.edge);rr(-37,-24,74,48,7);ctx.fillStyle='#071321';ctx.fill();ctx.strokeStyle='#6684a3';ctx.stroke();const pos=Number(c.position)||0;ctx.save();ctx.translate(-25,0);ctx.rotate(pos===0?Math.PI/2:((pos-1)-1)*.48);ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.lineTo(4,-14);ctx.lineTo(-4,-14);ctx.closePath();ctx.fillStyle=pos===0?COL.bad:'#b7c8d9';ctx.fill();ctx.restore();for(let i=1;i<=3;i++){const y=-14+(i-1)*14;ctx.beginPath();ctx.arc(27,y,3.5,0,7);ctx.fillStyle=pos===i?COL.ok:COL.off;ctx.fill();txt(c,String(i),16,y+3,COL.mut,7,'center',700);}ctx.beginPath();ctx.arc(-25,0,4,0,7);ctx.fillStyle=pos===0?COL.bad:COL.ok;ctx.fill();txt(c,pos===0?'OFF':`POS ${pos}`,0,35,pos===0?COL.bad:COL.ok,9,'center',800);txt(c,c.label,0,-35,COL.text,9,'center',800);};
 DRAW.levelgauge=c=>dial(c,'LEVEL',c.level||0,c.max||100,'%',COL.neu);
 DRAW.dpgauge=c=>dial(c,'ΔP',c.pressure||0,c.max||10,'bar',COL.warn);
 DRAW.vacuumgauge=c=>dial(c,'VAC',c.pressure||0,c.max||1,'bar',COL.neu);
 DRAW.rotameter=c=>{body(c,70,80,COL.edge);rr(-13,-23,26,46,8);ctx.fillStyle='#102a3c';ctx.fill();ctx.strokeStyle='#7aa2bf';ctx.stroke();const f=Math.max(0,Math.min(1,(c.flow||0)/(c.max||100)));ctx.beginPath();ctx.arc(0,16-f*32,4,0,7);ctx.fillStyle=c.flow>0?COL.ok:COL.off;ctx.fill();txt(c,c.label,0,-30,COL.text,8,'center',800);txt(c,`${(c.flow||0).toFixed(1)} ${c.unit||'L/min'}`,0,28,COL.ok,7,'center',800);txt(c,(c.fluid&&c.fluid!=='none'?c.fluid:'').toUpperCase(),0,38,fluidCol(c.fluid),7,'center',700);};
 const _g=DRAW.gauge,_t=DRAW.tempgauge,_f=DRAW.flowmeter;
 DRAW.gauge=function(c){_g(c);if(c.fluid&&c.fluid!=='none')txt(c,c.fluid.toUpperCase(),0,50,fluidCol(c.fluid),7,'center',700);};
 DRAW.tempgauge=function(c){_t(c);if(c.fluid&&c.fluid!=='none')txt(c,c.fluid.toUpperCase(),0,50,fluidCol(c.fluid),7,'center',700);};
 DRAW.flowmeter=function(c){_f(c);txt(c,`${(c.flow||0).toFixed(1)} ${c.unit||'L/min'}`,0,-17,COL.text,8,'center',800);if(c.fluid&&c.fluid!=='none')txt(c,c.fluid.toUpperCase(),0,28,fluidCol(c.fluid),7,'center',700);};
})();
