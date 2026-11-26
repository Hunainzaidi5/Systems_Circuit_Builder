
/* Industrial process instruments: connected-process measurement, calibration, diagnostics and alarms. */
(function(){
 const types=['watersensor','waterflowsensor','waterlevelsensor','watertempsensor','steampressure','steamtemp','steamflow','steamquality','gaspressure','gasflow','gaslevel','gasdetector','oxygenanalyzer','phsensor','conductivity','humiditysensor'];
 const defs={
  watersensor:['pressure','water'],waterflowsensor:['flow','water'],waterlevelsensor:['level','water'],watertempsensor:['temperature','water'],
  steampressure:['pressure','steam'],steamtemp:['temperature','steam'],steamflow:['flow','steam'],steamquality:['quality','steam'],
  gaspressure:['pressure','gas'],gasflow:['flow','gas'],gaslevel:['level','gas'],gasdetector:['lel','gas'],oxygenanalyzer:['oxygen','gas'],
  phsensor:['ph','water'],conductivity:['conductivity','water'],humiditysensor:['humidity','gas']
 };
 const oldProps=renderProps;
 renderProps=function(){
  oldProps(); const c=selected&&selected.kind==='c'?getC(selected.id):null;
  if(!c)return;
  const el=$('props');
  const pf=(label,k,min,max,step)=>`<div class="f"><label>${label}</label><input type="number" data-k="${k}" data-t="n" min="${min}" max="${max}" step="${step}" value="${Number(c[k]??(k==='ph'?7:k==='conductivity'?500:k==='humidity'?45:k==='oxygenContent'?20.9:0))}"></div>`;
  if(['tank','sump','feedwatertank','deaerator'].includes(c.type))el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">WATER QUALITY PARAMETERS</div>${pf('Water pH','ph',0,14,0.01)}${pf('Conductivity (µS/cm)','conductivity',0,100000,1)}`);
  if(['naturalgas','gaswell','gastank','lpgtank','gascompressor','pressureregulator'].includes(c.type))el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">GAS COMPOSITION PARAMETERS</div>${pf('Combustible gas concentration (%LEL)','gasConcentration',0,100,0.1)}${pf('Gas humidity (%RH)','humidity',0,100,0.1)}`);
  if(['combustionchamber','gasturbine','furnace','flame'].includes(c.type))el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">FLUE GAS ANALYSIS</div>${pf('Oxygen content (% vol)','oxygenContent',0,25,0.1)}`);
  if(!types.includes(c.type))return;
  const f=(label,k,min,max,step)=>`<div class="f"><label>${label}</label><input type="number" data-k="${k}" data-t="n" min="${min}" max="${max}" step="${step}" value="${Number(c[k]??(k==='lowAlarm'?Number(c.lrv??0):k==='highAlarm'?Number(c.urv??c.span??100):0))}"></div>`;
  const sel=(label,k,opts)=>`<div class="f"><label>${label}</label><select data-k="${k}" data-t="s">${opts.map(x=>`<option value="${x[0]}" ${c[k]===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></div>`;
  const cb=(label,k)=>`<div class="f"><label>${label}</label><input type="checkbox" data-k="${k}" data-t="b" ${c[k]!==false?'checked':''}></div>`;
  const [kind,service]=defs[c.type];
  el.insertAdjacentHTML('beforeend',`<div class="note" style="margin:8px 0;color:var(--accent);font-weight:800">INSTRUMENT CONFIGURATION · ${service.toUpperCase()}</div>
   ${cb('Live process measurement (disable for manual test)','auto')}
   ${f('Manual process value','manualValue',-100000,100000,0.1)}
   ${f('Lower range value (LRV)','lrv',-100000,100000,0.1)}
   ${f('Upper range value (URV)','urv',-100000,100000,0.1)}
   ${f('Zero / calibration offset','offset',-100000,100000,0.01)}
   ${f('Accuracy (% of span)','accuracy',0,10,0.1)}
   ${f('Damping time (seconds)','damping',0,60,0.1)}
   ${f('Low alarm setpoint','lowAlarm',-100000,100000,0.1)}
   ${f('High alarm setpoint','highAlarm',-100000,100000,0.1)}
   ${c.type==='gasdetector'?f('Gas concentration (%LEL)','manualValue',0,100,0.1)+f('Alarm threshold (%LEL)','alarm',0,100,1)+f('Trip threshold (%LEL)','trip',0,100,1):''}
   ${c.type==='oxygenanalyzer'?f('O₂ concentration (% vol)','manualValue',0,25,0.1):''}
   ${c.type==='phsensor'?f('Water pH (0–14)','manualValue',0,14,0.01):''}
   ${c.type==='conductivity'?f('Conductivity (µS/cm)','manualValue',0,100000,1):''}
   ${c.type==='humiditysensor'?f('Gas humidity (%RH)','manualValue',0,100,0.1):''}
   ${sel('Simulated instrument fault','fault',[['none','Healthy'],['low','Output forced to LRV'],['high','Output forced to URV'],['fail','Sensor failure / no signal'],['frozen','Frozen last reading']])}
   <div class="kpis" style="margin-top:8px"><div class="kpi"><b>Live PV</b><span id="sensorLive">${Number(c.measured||0).toFixed(2)} ${c.unit||''}</span></div><div class="kpi"><b>Output</b><span id="sensorOut">${Number(c.outputMA||4).toFixed(2)} mA</span></div></div>
   <div class="note" id="sensorDiag" style="margin-top:6px">${c.sensorStatus||'Waiting for simulation scan'} · Connect the IN port to a compatible process pipe/vessel. Manual mode is for test-bench simulation. This is an educational model, not a certified safety instrument.</div>`);
 };
 const oldDraw=drawComp;
 drawComp=function(c){
  if(!types.includes(c.type)){oldDraw(c);return;}
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot*Math.PI/2);
  const failed=c.sensorStatus==='SENSOR FAILURE'||c.fault&&c.fault!=='none';
  ctx.fillStyle='#10243a';ctx.strokeStyle=failed?'#ef476f':'#35c9d8';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(-38,-30,76,60,9);ctx.fill();ctx.stroke();
  ctx.fillStyle='#dbe8f7';ctx.font='bold 9px Inter, sans-serif';ctx.textAlign='center';ctx.fillText(DEFS[c.type].tag||'TX',0,-15);
  ctx.fillStyle=failed?'#ff6b81':c.alarmState==='HIGH'||c.alarmState==='LOW'||c.alarmState==='ALARM'||c.alarmState==='TRIP'?'#ffbd4a':'#06d6a0';ctx.font='bold 12px ui-monospace, monospace';
  ctx.fillText(Number.isFinite(c.measured)?Number(c.measured).toFixed(1):'---',0,5);
  ctx.fillStyle='#8aa3bf';ctx.font='8px Inter, sans-serif';ctx.fillText(c.unit||'',0,19);
  ctx.fillStyle=failed?'#ef476f':'#35c9d8';ctx.beginPath();ctx.arc(-38,0,4,0,Math.PI*2);ctx.fill();ctx.restore();
 };
 function processPeers(c){
  const hu=sim.hu;if(!hu)return {connected:false,peers:[]};
  let root;try{root=hu.find(key(c.id,'IN'));}catch(e){return {connected:false,peers:[]};}
  if(!root)return {connected:false,peers:[]};
  const peers=[];
  for(const p of comps){if(p.id===c.id)continue;for(const t of (DEFS[p.type]?.term||[])){
   if(t[5]==='h'){try{if(hu.find(key(p.id,t[0]))===root){peers.push({c:p,port:t[0]});break;}}catch(e){}}
  }}
  return {connected:true,peers:peers.map(x=>x.c)};
 }
 function first(peers,names){return peers.find(x=>names.includes(x.type));}
 function measure(c,peers){
  const [kind,service]=defs[c.type];let p,v=null,unit=c.unit||'';
  const water=['motor','gearpump','silopump','tank','silo','sump','feedwatertank','feedwaterpump','tap'];
  const steam=['boiler','steamsource','steamgenerator','steamturbine','steampipe','steamseparator','superheater','reheater','economizer','lpsystem','hpsystem','deaerator','condenser'];
  const gas=['naturalgas','gaswell','gastank','lpgtank','gascompressor','gasboosterpump','pressureregulator','gasturbine','gasmeter','combustionchamber','furnace','flame'];
  const relevant=service==='water'?water:service==='steam'?steam:gas;
  p=first(peers,relevant);
  if(!p)return {value:null,unit,source:'No compatible process equipment detected'};
  if(kind==='pressure'){
   if(service==='water')v=first(peers,['motor','gearpump'])?.pressure??first(peers,['tank'])?.pressure??0;
   else if(service==='steam')v=first(peers,['boiler','steamsource','steamturbine','lpsystem','hpsystem'])?.pressure??0;
   else v=first(peers,['naturalgas','gaswell','gastank','lpgtank','gascompressor','pressureregulator','gasturbine'])?.pressure??0;
  }else if(kind==='flow'){
   if(service==='water'){const x=first(peers,['motor','gearpump']);v=x?Number(x.flow||0)*600:0;unit='L/min';}
   else if(service==='steam'){const x=first(peers,['boiler','steamsource','steamgenerator','steamturbine']);v=x?Number(x.flow??x.fuelRate??x.outputFlow??0):0;unit='kg/h';}
   else {const x=first(peers,['naturalgas','gaswell','gascompressor','gasmeter','gasturbine']);v=x?Number(x.flow??x.outputFlow??x.fuelRate??0):0;unit='Nm³/h';}
  }else if(kind==='level'){
   const x=service==='water'?first(peers,['tank','silo','silopump','sump','feedwatertank']):first(peers,['gastank','lpgtank']);
   v=x?Number(x.level??100):0;unit='%';
  }else if(kind==='temperature'){
   const x=service==='water'?first(peers,['tank','silo','silopump','motor','gearpump','feedwatertank','feedwaterpump']):service==='steam'?first(peers,['boiler','steamsource','steamgenerator','steamturbine','steampipe','superheater','reheater','condenser']):first(peers,['gasturbine','gascompressor','gasboosterpump','naturalgas','gaswell','gastank','lpgtank']);
   v=x?Number(x.temperature??20):20;unit='°C';
  }else if(kind==='quality'){
   const x=first(peers,['steamseparator']);v=x?Number(x.efficiency??0.98):null;if(v!==null&&v<=1)v*=100;unit='%';
  }else if(kind==='lel'){
   const x=first(peers,gas);v=x?Number(x.gasConcentration??c.gasConcentration??c.manualValue??0):0;unit='%LEL';
  }else if(kind==='oxygen'){
   const x=first(peers,['combustionchamber','gasturbine','furnace','flame']);v=x?Number(x.oxygenContent??c.oxygenValue??c.manualValue??20.9):Number(c.manualValue??20.9);unit='% vol';
  }else if(kind==='ph'||kind==='conductivity'){
   const x=first(peers,['tank','silo','silopump','sump','feedwatertank','deaerator']);v=Number(kind==='ph'?(x?.ph??c.manualValue??7):(x?.conductivity??c.manualValue??500));unit=kind==='ph'?'pH':'µS/cm';
  }else if(kind==='humidity'){
   v=Number(p.humidity??c.humidityValue??c.manualValue??45);unit='%RH';
  }
  return {value:Number.isFinite(Number(v))?Number(v):null,unit,source:p.label||DEFS[p.type]?.name||p.type};
 }
 const oldStep=step;
 step=function(dt){
  oldStep(dt);
  for(const c of comps){if(!types.includes(c.type))continue;
   const cfg=defs[c.type],kind=cfg[0],service=cfg[1],net=processPeers(c);let raw,source='';
   if(c.auto===false){raw=Number(c.manualValue??0);source='Manual test mode';}
   else {const m=measure(c,net.peers);raw=m.value;source=m.source;if(m.unit)c.unit=m.unit;}
   c.connected=net.connected;
   if(raw===null||!Number.isFinite(raw)){c.sensorStatus=net.connected?'NO COMPATIBLE PROCESS':'NO SIGNAL';c.rawValue=null;c.measured=NaN;c.outputMA=0;c.alarmState='BAD';c._sensorSource=source;continue;}
   const lrv=Number(c.lrv??0),urv=Number(c.urv??c.span??100),span=Math.max(0.000001,urv-lrv);
   let target=raw+Number(c.offset||0);
   // Deterministic bounded instrument accuracy error; avoids random flicker between scans.
   const phase=(Number(c._sensorPhase)||0)+Math.max(0,dt||0);c._sensorPhase=phase;
   target+=Math.sin(phase*2.17+(Number(c.id)||1))*span*(Number(c.accuracy||0)/100)*0.25;
   if(c.fault==='low')target=lrv;if(c.fault==='high')target=urv;
   if(c.fault==='fail'){c.sensorStatus='SENSOR FAILURE';c.measured=NaN;c.outputMA=0;c.alarmState='BAD';continue;}
   if(c.fault==='frozen')target=Number.isFinite(c._lastMeasured)?c._lastMeasured:target;
   const damping=Math.max(0,Number(c.damping)||0);if(!Number.isFinite(c._filtered))c._filtered=target;
   const alpha=damping>0?1-Math.exp(-Math.max(0,dt||0)/damping):1;c._filtered+= (target-c._filtered)*alpha;
   c.rawValue=raw;c.measured=c._filtered;c._lastMeasured=c.measured;
   const clamped=Math.max(lrv,Math.min(urv,c.measured));c.outputMA=4+16*(clamped-lrv)/span;
   const low=Number(c.lowAlarm),high=Number(c.highAlarm);
   c.alarmState=c.type==='gasdetector'?(c.measured>=Number(c.trip??40)?'TRIP':c.measured>=Number(c.alarm??20)?'ALARM':'NORMAL'):(Number.isFinite(low)&&c.measured<low?'LOW':Number.isFinite(high)&&c.measured>high?'HIGH':'NORMAL');
   c.sensorStatus=c.fault&&c.fault!=='none'?'SIMULATED '+c.fault.toUpperCase():c.alarmState==='NORMAL'?'HEALTHY':c.alarmState;
   c._sensorSource=source;
  }
  const c=selected&&selected.kind==='c'?getC(selected.id):null;
  if(c&&types.includes(c.type)){
   const live=$('sensorLive'),out=$('sensorOut'),diag=$('sensorDiag');
   if(live)live.textContent=Number.isFinite(c.measured)?`${c.measured.toFixed(2)} ${c.unit||''}`:'--- · BAD SIGNAL';
   if(out)out.textContent=Number(c.outputMA||0).toFixed(2)+' mA';
   if(diag)diag.textContent=`${c.sensorStatus||'WAITING'} · ${c._sensorSource||'No process source'} · ${c.connected?'PORT CONNECTED':'PORT OPEN'}`;
  }
 };
})();
