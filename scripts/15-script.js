
/* ── HRSG (heat recovery steam generator) + CoGen template ── */
(function(){
DEFS.hrsg={name:'Heat Recovery Steam Generator (HRSG)',tag:'HRSG',icon:'♨️',cat:'Steam System',w:170,h:120,
  term:[['FLUE_IN',-85,-30,-1,0,'h'],['WATER_IN',-85,30,-1,0,'h'],['STEAM_OUT',85,-30,1,0,'h'],['FLUE_OUT',0,-60,0,-1,'h']],
  init:{pressure:0,temperature:40,ratedPressure:60,steamFlow:0,heatMW:0,drumLevel:70,_active:false}};
ICON.hrsg=SV('<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M8 11c1.5-1.5 2.5 1.5 4 0s2.5 1.5 4 0M8 15c1.5-1.5 2.5 1.5 4 0s2.5 1.5 4 0M12 3v4"/>');
COMP_BLURB.hrsg='Heat Recovery Steam Generator. Hot gas-turbine exhaust enters FLUE_IN, passes through tube banks and leaves at FLUE_OUT (must reach a Flue Stack). Feed water at WATER_IN becomes high-pressure steam at STEAM_OUT, which can drive a steam turbine.';
DRAW.hrsg=function(c){const on=!!c._active,t=Date.now()/1000;body(c,170,120,on?COL.warn:COL.edge);
  ctx.fillStyle='#1a2a3c';ctx.fillRect(-78,-48,156,96);
  ctx.strokeStyle=on?COL.warn:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(-78,-48,156,96);
  // tube bundles
  for(let i=0;i<3;i++){const x=-50+i*42;ctx.strokeStyle=on?'#4fc3f7':'#3a5a7c';ctx.lineWidth=3;
    for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(x-14,-30+j*18);ctx.lineTo(x+14,-30+j*18);ctx.stroke();}}
  if(on){for(let k=0;k<6;k++){const p=((t*0.6+k/6)%1);const x=-70+p*140,y=-40+Math.sin(k*2+t*2)*6+((k%3)*26);
    glow(x,y,10,'rgba(255,120,50,0.35)');}}
  // drum
  ctx.fillStyle='#223a55';rr(-40,-46,80,14,7);ctx.fill();ctx.strokeStyle=on?'#4fc3f7':'#4a6a8c';ctx.lineWidth=1.5;ctx.stroke();
  line([[85,-30],[78,-30]],on?COL.warn:'#4a6a8c',5);
  txt(c,c.label,0,-68,COL.text,10);
  txt(c,on?`${(c.pressure||0).toFixed(0)} bar · ${Math.round(c.temperature||0)}°C`:'NO STEAM',0,0,on?COL.warn:COL.mut,11,'center',800);
  txt(c,on?`${(c.heatMW||0).toFixed(0)} MWth · ${(c.steamFlow||0).toFixed(0)} t/h`:'HRSG',0,58,on?COL.warn:COL.mut,10,'center',800);};
// palette
(function(){const groups=document.getElementById('componentGroups');if(!groups)return;
  let sec=[...groups.querySelectorAll('.palette-group')].find(s=>s.dataset.category==='Steam System');
  if(!sec){sec=document.createElement('section');sec.className='palette-group';sec.dataset.category='Steam System';sec.innerHTML='<div class="cat">Steam System</div><div class="grid2"></div>';groups.appendChild(sec);}
  const el=document.createElement('div');el.className='item';el.draggable=true;el.dataset.type='hrsg';el.title='Drag to board or click to add';
  el.innerHTML='<div class="ic">'+ICON.hrsg+'</div><div class="nm">'+DEFS.hrsg.name+'</div>';
  el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain','hrsg'));
  el.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp('hrsg',p.x+n,p.y+n);});
  sec.querySelector('.grid2').appendChild(el);
  const s=document.getElementById('componentSearch');if(s)s.dispatchEvent(new Event('input'));})();
// properties
const _rp=renderProps;renderProps=function(){_rp();const c=selected&&selected.kind==='c'?getC(selected.id):null;if(!c||c.type!=='hrsg')return;
  $('props').insertAdjacentHTML('beforeend',fld('Rated pressure (bar)',nI('ratedPressure',c.ratedPressure,10,150,5))+`<div class="note" style="margin-top:6px">Needs: exhaust gas at FLUE_IN from a running gas turbine, feed water at WATER_IN, and FLUE_OUT piped to a Flue Stack.</div>`);};
const _d=describe;describe=function(c){if(c.type!=='hrsg')return _d(c);
  return`Status: ${c._active?'GENERATING STEAM':'NO STEAM'}\nHeat in: ${(c.heatMW||0).toFixed(1)} MW(th)\nPressure: ${(c.pressure||0).toFixed(1)} bar\nTemp: ${Math.round(c.temperature||0)}°C\nSteam: ${(c.steamFlow||0).toFixed(1)} t/h\n${c._why||''}`;};
const _rs=resetSim;resetSim=function(){_rs();for(const c of comps)if(c.type==='hrsg'){c.pressure=0;c.temperature=40;c.steamFlow=0;c.heatMW=0;c._active=false;}};
// simulation
const _st=step;step=function(dt){_st(dt);
  const has=(c,t,k)=>{if(!window.PR)return false;const s=PR.S.get(PR.uf.find(key(c.id,t)));return!!s&&s.has(k);};
  for(const c of comps){if(c.type!=='hrsg')continue;
    const rIn=PR&&PR.uf.find(key(c.id,'FLUE_IN'));let mw=0;
    if(PR)for(const g of comps)if(g.type==='gasturbine'&&g._ready&&PR.uf.find(key(g.id,'EXHAUST'))===rIn)mw+=Number(g.mw||0)*1.4*(g._spool||0);
    const flue=has(c,'FLUE_IN','flue'),water=has(c,'WATER_IN','water'),steam=has(c,'STEAM_OUT','steam');
    const stk=PR&&comps.some(s=>s.type==='fluestack'&&PR.uf.find(key(s.id,'FLUE_IN'))===PR.uf.find(key(c.id,'FLUE_OUT')));
    c._why=!flue?'NO EXHAUST GAS AT FLUE_IN':!stk?'FLUE_OUT NOT CONNECTED TO A STACK':!water?'NO FEED WATER AT WATER_IN':'';
    c._active=steam;c.heatMW=flue?mw:0;
    const tgtP=steam?c.ratedPressure*Math.min(1,0.4+c.heatMW/60):0,tgtT=steam?Math.min(540,200+c.heatMW*4):40;
    const k=Math.min(1,dt*0.4);c.pressure=(c.pressure||0)+(tgtP-(c.pressure||0))*k;c.temperature=(c.temperature||40)+(tgtT-(c.temperature||40))*k;
    c.steamFlow=steam?c.heatMW*1.2:0;
    if(Array.isArray(sim.alarms)){if(c._why&&flue)sim.alarms.push(['warn',`${c.label}: ${c._why}`]);else if(!flue)sim.alarms.push(['warn',`${c.label}: ${c._why}`]);else sim.alarms.push(['ok',`${c.label}: producing ${c.steamFlow.toFixed(0)} t/h steam`]);}
  }};
// CoGen template
$('bTpl3').insertAdjacentHTML('afterend','<button id="bTplCG">★ CoGen template</button>');
function loadCoGen(){
  pushUndo();comps=[];wires=[];nextId=1;selected=null;
  const add=(t,x,y,ex)=>{const c=newComp(t,x,y,0);Object.assign(c,ex||{});comps.push(c);return c;};
  const L=(a,ta,b,tb,pts)=>wires.push({id:nextId++,a:{c:a.id,t:ta},b:{c:b.id,t:tb},pts:pts||[],bend:0,broken:false});
  const NG=add('naturalgas',100,120,{label:'Fuel'}),AIR=add('airsupply',100,200,{label:'Air',unlimited:true});
  const GT=add('gasturbine',400,160,{label:'GT1',on:true,mw:40});
  const STK=add('fluestack',700,110,{label:'Stack'});
  const HR=add('hrsg',700,320,{label:'HRSG1'});
  const WS=add('sump',440,450,{label:'Feed water'});
  const S1=add('steamturbine',1000,340,{label:'ST1',on:true,mw:20}),S2=add('steamturbine',1000,560,{label:'ST2',on:true,mw:10});
  const CD=add('condenser',1250,560,{label:'Cond'}),WS2=add('sump',1250,700,{label:'Cooling water'});
  const LD=add('load3',760,640,{label:'Grid load',kw:9000});
  L(NG,'OUT',GT,'GAS_IN');
  L(AIR,'OUT',GT,'AIR_IN',[{x:240,y:200},{x:240,y:140}]);
  L(GT,'EXHAUST',HR,'FLUE_IN',[{x:560,y:120},{x:560,y:290}]);
  L(HR,'FLUE_OUT',STK,'FLUE_IN');
  L(WS,'OUT',HR,'WATER_IN',[{x:350,y:450},{x:350,y:520},{x:560,y:520},{x:560,y:350}]);
  L(HR,'STEAM_OUT',S1,'STEAM_IN',[{x:860,y:290},{x:860,y:300}]);
  L(S1,'EXHAUST',S2,'STEAM_IN',[{x:1110,y:300},{x:1110,y:450},{x:890,y:450},{x:890,y:520}]);
  L(S2,'EXHAUST',CD,'STEAM_IN',[{x:1150,y:520},{x:1150,y:560}]);
  L(WS2,'OUT',CD,'WATER_IN',[{x:1170,y:700},{x:1170,y:580}]);
  for(const p of['L1','L2','L3','N']){const q=p==='N'?'N':p;L(GT,p,LD,q);L(S1,p,LD,q);L(S2,p,LD,q);}
  renderProps();fit();log('Loaded CoGen template: Fuel + Air → Gas Turbine → HRSG (+ water) → steam → ST1 → ST2 (series) → Condenser; all generators feed one load bank. Press Run and wait ~10 s for spool-up.');
}
$('bTplCG').onclick=loadCoGen;
})();
