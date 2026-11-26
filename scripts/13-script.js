
/* ── v13: booster pumps, air supply, flue-path requirements ── */
(function(){
const lag=(o,k,t,dt,tau)=>{const v=Number(o[k])||0;o[k]=v+(t-v)*Math.min(1,dt/Math.max(.04,tau));};
const HX=new Set(['economizer','superheater','reheater','hrsg']);
const has=(c,t,k)=>{if(!window.PR)return false;const s=window.PR.S.get(window.PR.uf.find(key(c.id,t)));return !!s&&s.has(k);};
const lab=(c,t,b,col)=>{const d=DEFS[c.type];if(t)txt(c,t,0,-d.h/2-6,COL.text,9,'center',700);if(b)txt(c,b,0,d.h/2+10,col||COL.mut,9,'center',800);};
const badge=(c,t,x,y,col)=>txt(c,t,x,y,col||COL.warn,7,'center',800);

/* ---- drawings (new components only; existing shapes untouched) ---- */
const _gc=DRAW.gascompressor,_fw=DRAW.feedwaterpump;
DRAW.gasboosterpump=function(c){_gc(c);badge(c,'GAS BOOSTER',0,44,'#e0a21a');};
DRAW.steamboosterpump=function(c){_fw(c);badge(c,'STEAM BOOSTER',28,-36,'#dfe6ee');};
DRAW.airsupply=function(c){const un=!!c.unlimited,spin=c.on,sup=spin||un,t=Date.now()/1000;
  body(c,100,80,sup?COL.ok:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-42,-32,84,64);
  ctx.save();ctx.translate(-8,0);
  ctx.beginPath();ctx.arc(0,0,26,0,7);ctx.fillStyle='#0f1a26';ctx.fill();ctx.strokeStyle='#8497ab';ctx.lineWidth=2;ctx.stroke();
  ctx.rotate(spin?t*9:0);
  for(let i=0;i<5;i++){ctx.rotate(Math.PI*2/5);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(10,-5,21,-3);ctx.quadraticCurveTo(12,6,0,0);ctx.fillStyle=spin?'#cfe8f7':'#7f93a6';ctx.fill();}
  ctx.restore();ctx.beginPath();ctx.arc(-8,0,3.5,0,7);ctx.fillStyle='#ddd';ctx.fill();
  const f=sup&&(window.PF&&window.PF(c.id,'OUT')||(sim.hu&&sim.hflow&&sim.hflow.has(sim.hu.find(key(c.id,'OUT')))));
  line([[22,0],[40,0]],'#56697f',9);line([[22,0],[40,0]],f?'#9fc4dd':'#152538',5);
  ctx.fillStyle='#8497ab';ctx.fillRect(18,-8,4,16);ctx.fillRect(38,-8,4,16);
  if(sup){ctx.globalAlpha=.5;for(let i=0;i<3;i++){const k=((t*.8+i/3)%1);line([[22+k*16,-4+i*4],[28+k*16,-4+i*4]],'#cfe8f7',1.4);}ctx.globalAlpha=1;}
  ctx.beginPath();ctx.arc(-38,-26,3,0,7);ctx.fillStyle=sup?COL.ok:'#2a3442';ctx.fill();
  lab(c,c.label,un?'UNLIMITED · ambient':spin?`${c.flow} m³/h · ${c.pressure} bar`:'OFF',sup?COL.ok:COL.mut);badge(c,un?'AIR ∞':'AIR',-30,26,'#9fc4dd');};
DRAW.fluestack=function(c){const rec=!!c._receiving,t=Date.now()/1000;
  ctx.beginPath();ctx.moveTo(-13,55);ctx.lineTo(-9,-48);ctx.lineTo(9,-48);ctx.lineTo(13,55);ctx.closePath();
  ctx.fillStyle=GR(-13,0,13,0,[[0,'#6b4a3a'],[.5,'#a8735a'],[1,'#5a3d30']]);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=COL.edge;ctx.stroke();
  for(const y of[-30,-8,14,36]){line([[-12+(y+48)*.0,y],[12,y]],'rgba(0,0,0,.28)',2);}
  ctx.fillStyle='#2b3846';ctx.fillRect(-11,-52,22,6);
  ctx.fillStyle='#8497ab';ctx.fillRect(-6,50,12,8);ctx.fillStyle='#b8442b';ctx.fillRect(-6,54,12,3);
  if(rec){for(let i=0;i<6;i++){const k=((t*.35+i/6)%1);ctx.globalAlpha=.5*(1-k);ctx.beginPath();ctx.arc(Math.sin(k*6+i)*6+k*14,-54-k*34,4+k*10,0,7);ctx.fillStyle='#9aa3ab';ctx.fill();}ctx.globalAlpha=1;}
  lab(c,c.label,rec?'EXHAUSTING':'IDLE',rec?COL.warn:COL.mut);};
/* flue status badge under the heat exchangers */
for(const k of HX){const o=DRAW[k];if(!o)continue;DRAW[k]=function(c){o(c);const ok=c._fin&&c._fout;badge(c,ok?'FLUE ✓ HEATING':!c._fin?'NO FLUE AT FLUE_IN':'FLUE_OUT → STACK?',0,DEFS[c.type].h/2+22,ok?COL.ok:COL.bad);};}

/* ---- behaviour ---- */
const _step=step;
step=function(dt){
  _step(dt);
  const al=Array.isArray(sim.alarms)?sim.alarms:(sim.alarms=[]);
  // booster pumps: need real supply at IN
  for(const c of comps){
    if(c.type!=='gasboosterpump'&&c.type!=='steamboosterpump')continue;
    const gas=c.type==='gasboosterpump',k=gas?'gas':'steam';
    c._supplied=has(c,'IN',k);
    const run=c.on&&c.powered&&c._supplied;
    const tp=Number(c.pressure)||(gas?30:40),tq=Number(c.flow)||(gas?60:5000);
    c._tp=c._tp&&c._tp>0?c._tp:tp;
    if(run){lag(c,'_pp',tp,dt,5);lag(c,'_ff',tq,dt,4);}else{lag(c,'_pp',0,dt,4);lag(c,'_ff',0,dt,3);}
    if(c.on&&c.powered&&!c._supplied)al.push(['warn',`${c.label}: NO ${gas?'GAS':'STEAM'} AT IN`]);
    else if(c.on&&!c.powered)al.push(['warn',`${c.label}: NO ELECTRICAL SUPPLY (M/N)`]);
    else if(run)al.push(['ok',`${c.label} boosting to ${tp} bar`]);
  }
  // combustion air requirement
  for(const c of comps){
    const f=c.type==='burner'?'GAS_IN':(c.type==='combustionchamber'||c.type==='furnace')?'FUEL_IN':null;
    if(f&&c.on){if(!has(c,f,'gas'))al.push(['warn',`${c.label}: NO FUEL AT ${f}`]);else if(!has(c,'AIR_IN','air'))al.push(['warn',`${c.label}: NO AIR AT AIR_IN`]);}
  }
  // flue path: FLUE_IN must receive hot flue gas, FLUE_OUT must reach a stack
  const hx=comps.filter(c=>HX.has(c.type)),stacks=comps.filter(c=>c.type==='fluestack');
  if(window.PR&&(hx.length||stacks.length)){
    // Pipes AND pass-through fittings (elbows, tees, flanges, open valves …) join the flue path.
    // Heat exchangers are excluded so FLUE_IN and FLUE_OUT stay on separate nets.
    const uf=makeUF();for(const w of wires)if(isPipe(w)&&!w.broken)uf.union(key(w.a.c,w.a.t),key(w.b.c,w.b.t));
    for(const c of comps){if(HX.has(c.type))continue;const f=window.PASSMAP&&window.PASSMAP[c.type];if(!f)continue;
      for(const g of f(c))for(let i=1;i<g.length;i++)uf.union(key(c.id,g[0]),key(c.id,g[i]));}
    const R=(c,t)=>uf.find(key(c.id,t));
    // Why is nothing arriving at FLUE_IN? Name the upstream heat source that is not firing.
    const why=c=>{const r=R(c,'FLUE_IN');const srcs=comps.filter(o=>SRC[o.type]&&R(o,SRC[o.type])===r);
      if(!srcs.length)return'NO BURNER / FURNACE / TURBINE EXHAUST PIPED TO FLUE_IN';
      const o=srcs[0],gp=(o.type==='burner'||o.type==='gasturbine')?'GAS_IN':'FUEL_IN';
      if(o.type==='gasturbine')return`${o.label} IS NOT RUNNING (needs gas + air, then start it)`;
      const miss=[];if(!has(o,gp,'gas'))miss.push(`GAS AT ${gp}`);if(o.type!=='flame'&&!has(o,'AIR_IN','air'))miss.push('AIR AT AIR_IN');
      if(miss.length)return`${o.label}: NO ${miss.join(' / NO ')}`;
      if(o._ignitionFault)return`${o.label} TRIPPED ON IGNITION — no live AUX_L/AUX_N supply (wire one, or untick “Electrical supply required” in its properties)`;
      return o.on?`${o.label} IS FIRING BUT FLUE IS NOT REACHING FLUE_IN`:`${o.label} IS NOT FIRING (click it to light)`;};
    const SRC={burner:'FLAME_OUT',combustionchamber:'FLAME_OUT',flame:'FLAME_OUT',furnace:'HEAT_OUT',gasturbine:'EXHAUST'};
    const lit=(o,pt)=>has(o,pt,'flue');
    const inOK=(c,seen)=>{const r=R(c,'FLUE_IN');
      for(const o of comps){if(o===c)continue;const pt=SRC[o.type];
        if(pt&&R(o,pt)===r&&lit(o,pt))return true;
        if(HX.has(o.type)&&R(o,'FLUE_OUT')===r&&!seen.has(o.id)){seen.add(o.id);if(inOK(o,seen))return true;}}
      return false;};
    const outOK=(c,seen)=>{const r=R(c,'FLUE_OUT');
      for(const o of comps){if(o===c)continue;
        if(o.type==='fluestack'&&R(o,'FLUE_IN')===r)return true;
        if(HX.has(o.type)&&R(o,'FLUE_IN')===r&&!seen.has(o.id)){seen.add(o.id);if(outOK(o,seen))return true;}}
      return false;};
    for(const c of hx){c._fin=inOK(c,new Set([c.id]));c._fout=outOK(c,new Set([c.id]));
      if(!c._fin)al.push(['warn',`${c.label}: NO FLUE GAS AT FLUE_IN — ${why(c)}`]);
      else if(!c._fout)al.push(['warn',`${c.label}: FLUE_OUT NOT CONNECTED TO A STACK`]);
      else al.push(['ok',`${c.label}: flue path complete`]);}
    for(const sk of stacks){const r=R(sk,'FLUE_IN');
      sk._receiving=comps.some(o=>(SRC[o.type]&&R(o,SRC[o.type])===r&&lit(o,SRC[o.type]))||(HX.has(o.type)&&R(o,'FLUE_OUT')===r&&o._fin));}
  }
};
/* pressure/flow shown on the booster pumps follow the supplied-and-running value */
const _clk=clickAction;
clickAction=function(c){
  if((c.type==='gasboosterpump'||c.type==='steamboosterpump')&&!c.on){
    const k=c.type==='gasboosterpump'?'gas':'steam';
    if(!has(c,'IN',k))log(`ℹ ${c.label}: no ${k} detected at IN yet — it will start but not boost until ${k} arrives.`);
  }
  return _clk(c);
};
})();
