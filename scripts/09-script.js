
/*
 * INDUSTRIAL SIMULATION UPGRADE v4
 * Adds fail-safe sensor interlocks, burner supply permissives, spatial heat transfer,
 * and more realistic adjustable motor models. Educational simulation only.
 */
(function(){
  const SENSOR_TYPES=new Set(['watersensor','waterflowsensor','waterlevelsensor','watertempsensor','steampressure','steamtemp','steamflow','steamquality','gaspressure','gasflow','gaslevel','gasdetector','oxygenanalyzer','phsensor','conductivity','humiditysensor']);
  const SAFETY_SENSORS=new Set(['gasdetector','watersensor','steampressure','watertempsensor','steamtemp','gaspressure','oxygenanalyzer','waterlevelsensor']);
  const isElectricalLoad=c=>c&&['motor','gearpump','acmotor','dcmotor','motor3','heater','fan','lamp','ledstrip','solenoid','load3','gasturbine','steamturbine','boiler','steamgenerator','gascompressor','feedwaterpump','gasboosterpump','steamboosterpump'].includes(c.type);
  const dist=(a,b)=>Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));
  const clampN=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));

  // Sensor defaults: fail-safe trip, alarm hysteresis and configurable target behavior.
  for(const t of SENSOR_TYPES){
    if(DEFS[t]) Object.assign(DEFS[t].init,{tripEnabled:true,tripMode:'load',tripLatch:true,resetBand:2,tripTarget:'nearest'});
  }
  Object.assign(DEFS.gasdetector?.init||{}, {tripEnabled:true,tripMode:'load',tripTarget:'nearest'});
  // New burner/flame auxiliary supply terminals. They are deliberately explicit so an ignition
  // command cannot create energy from nothing.
  if(DEFS.burner){
    DEFS.burner.term=[['GAS_IN',-40,-20,-1,0,'h'],['AIR_IN',-40,20,-1,0,'h'],['FLAME_OUT',40,0,1,0,'h'],['AUX_L',-10,40,0,1],['AUX_N',10,40,0,1]];
    Object.assign(DEFS.burner.init,{requiresSupply:true,supplyV:230,temperature:20,heatRate:140,heatRadius:150,flameTemp:1200,ignitionDelay:.8});
  }
  if(DEFS.flame){
    DEFS.flame.term=[['FUEL_IN',-30,0,-1,0,'h'],['AUX_L',-10,35,0,1],['AUX_N',10,35,0,1]];
    Object.assign(DEFS.flame.init,{requiresSupply:true,supplyV:24,heatRate:120,heatRadius:130,ignitionDelay:.5});
  }
  if(DEFS.furnace) Object.assign(DEFS.furnace.init,{requiresSupply:true,heatRate:180,heatRadius:170});
  if(DEFS.combustionchamber) Object.assign(DEFS.combustionchamber.init,{requiresSupply:true,heatRate:160,heatRadius:150});

  // Motor nameplate/model defaults.
  Object.assign(DEFS.acmotor.init,{ratedVoltage:230,ratedFrequency:50,ratedRPM:1440,voltageSet:230,rpmSet:1440,poles:4,slip:0.04});
  Object.assign(DEFS.dcmotor.init,{ratedVoltage:24,maxRPM:3000,voltageSet:24,rpmSet:3000,speedSet:100});
  if(DEFS.motor3) Object.assign(DEFS.motor3.init,{ratedVoltage:400,ratedFrequency:50,ratedRPM:1450,voltageSet:400,rpmSet:1450,poles:4,slip:0.033});

  // Add industrial controls to the property editor after the original editor has rendered.
  const oldRenderProps=renderProps;
  renderProps=function(){
    oldRenderProps();
    const c=selected&&selected.kind==='c'?getC(selected.id):null;
    if(!c)return;
    const el=$('props');
    const n=(label,k,min,max,step)=>`<div class="f"><label>${label}</label><input type="number" data-k="${k}" data-t="n" min="${min}" max="${max}" step="${step}" value="${Number(c[k]??0)}"></div>`;
    const s=(label,k,opts)=>`<div class="f"><label>${label}</label><select data-k="${k}" data-t="s">${opts.map(v=>`<option value="${v[0]}" ${c[k]===v[0]?'selected':''}>${v[1]}</option>`).join('')}</select></div>`;
    const b=(label,k)=>`<div class="f"><label>${label}</label><input type="checkbox" data-k="${k}" data-t="b" ${c[k]!==false?'checked':''}></div>`;
    if(SENSOR_TYPES.has(c.type)){
      el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--warn);font-weight:800">SAFETY INTERLOCK · FAIL-SAFE</div>${b('Trip enabled','tripEnabled')}${s('Trip action','tripMode',[['none','Alarm only'],['load','Stop nearest load'],['breaker','Trip nearest breaker']])}${s('Trip target','tripTarget',[['nearest','Nearest equipment'],['all','All local loads']])}${b('Latch trip','tripLatch')}${n('Reset band', 'resetBand',0,20,.1)}<div class="note">A HIGH/LOW/TRIP or failed sensor can de-energise the selected safety target. Reset the tripped device after the process returns to a safe state.</div>`);
    }
    if(c.type==='acmotor'){
      el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">MOTOR NAMEPLATE / DRIVE</div>${n('Rated voltage (V)','ratedVoltage',50,690,1)}${n('Applied voltage (V)','voltageSet',0,690,1)}${n('Rated frequency (Hz)','ratedFrequency',10,100,1)}${n('Speed setpoint (RPM)','rpmSet',0,3600,10)}${n('Poles','poles',2,12,2)}${n('Slip (%)','slip',0,15,.1)}`);
    }
    if(c.type==='dcmotor'){
      el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">DC MOTOR DRIVE</div>${n('Rated voltage (V)','ratedVoltage',6,600,1)}${n('Applied voltage (V)','voltageSet',0,600,1)}${n('Maximum RPM','maxRPM',100,10000,50)}${n('Speed setpoint (%)','speedSet',0,150,1)}${n('Speed setpoint (RPM)','rpmSet',0,10000,50)}`);
    }
    if(c.type==='motor3'){
      el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--accent);font-weight:800">3-PHASE MOTOR / VFD</div>${n('Rated line voltage (V)','ratedVoltage',200,690,1)}${n('Applied voltage (V)','voltageSet',0,690,1)}${n('Rated frequency (Hz)','ratedFrequency',10,100,1)}${n('Speed setpoint (RPM)','rpmSet',0,3600,10)}${n('Poles','poles',2,12,2)}${n('Slip (%)','slip',0,15,.1)}`);
    }
    if(['burner','flame','furnace','combustionchamber'].includes(c.type)){
      el.insertAdjacentHTML('beforeend',`<div class="note" style="margin-top:8px;color:var(--warn);font-weight:800">COMBUSTION SAFETY / HEAT TRANSFER</div>${b('Electrical supply required','requiresSupply')}${n('Supply requirement (V)','supplyV',12,690,1)}${n('Heat rate (°C/s)','heatRate',1,500,1)}${n('Heat radius (px)','heatRadius',40,300,10)}<div class="note">Ignition requires process fuel/air and a live auxiliary supply. Active flame transfers heat spatially to nearby tanks or process equipment even when no fluid pipe is connected.</div>`);
    }
  };

  function liveAuxSupply(c,st){
    if(!c.requiresSupply)return true;
    // Explicit auxiliary terminals are preferred.
    if(st&&live(st,c,'AUX_L','AUX_N')){
      const v=sim.volts||230;
      return v>=Number(c.supplyV||24)*.75;
    }
    // For legacy circuits, a nearby powered source/coil is accepted only if it is actually live.
    const near=comps.filter(x=>x!==c&&dist(c,x)<260&&['source','source3','dcsource','generator','inverter','hybrid','hybridlfp','hybridlfpgt','hybridbms'].includes(x.type));
    return near.some(x=>x.on!==false&&(x.type!=='generator'||Number(x.fuel)>0));
  }
  function hasFuelAir(c,st){
    const hu=sim.hu;
    const fuelPort=(c.type==='burner'?'GAS_IN':'FUEL_IN');
    const fuel=hu&&hu.find(key(c.id,fuelPort));
    if(!fuel)return false;
    const gasTypes=new Set(['naturalgas','gaswell','gastank','lpgtank','gascompressor','gasboosterpump','pressureregulator','gasvalve','gasfilter','gasmeter']);
    const peers=[];
    for(const x of comps){
      for(const t of (DEFS[x.type]?.term||[])){
        if(t[5]==='h'&&hu.find(key(x.id,t[0]))===fuel)peers.push(x);
      }
    }
    const gas=peers.some(x=>gasTypes.has(x.type)&&x.on!==false&&(x.type!=='gastank'&&x.type!=='lpgtank'||Number(x.level??1)>0));
    // The simulator has no dedicated combustion-air source. Treat AIR_IN as an
    // optional engineered air connection; otherwise ambient air is available.
    // This keeps the burner functional while still allowing a connected air line.
    // v13: a real Air Supply Source now exists, so AIR_IN must be fed with air.
    const airPort=DEFS[c.type]?.term?.some(t=>t[0]==='AIR_IN');
    const air=!airPort||!!(window.PR&&(()=>{const q=window.PR.S.get(window.PR.uf.find(key(c.id,'AIR_IN')));return !!q&&q.has('air');})());
    return gas && air;
  }

  function tripSensorTargets(sensor){
    if(!sensor.tripEnabled||sensor.tripMode==='none')return;
    const active=(sensor.alarmState==='TRIP'||sensor.alarmState==='BAD'||sensor.fault==='fail'||sensor.alarmState==='HIGH'||sensor.alarmState==='LOW');
    if(!active)return;
    const candidates=comps.filter(c=>c!==sensor&&isElectricalLoad(c)).sort((a,b)=>dist(sensor,a)-dist(sensor,b));
    if(sensor.tripMode==='load'){
      const targets=sensor.tripTarget==='all'?candidates.filter(c=>dist(sensor,c)<300):candidates.slice(0,1);
      for(const t of targets){t._sensorCutout=true;t._sensorTripBy=sensor.id;if(t.type==='motor'||t.type==='gearpump')t.cutout=true;if(t.type==='acmotor'||t.type==='dcmotor'||t.type==='motor3')t.powered=false;}
    }else if(sensor.tripMode==='breaker'){
      const brs=comps.filter(c=>['mcb','acbreaker','dcbreaker','mcb3','rcd'].includes(c.type)&&c.closed&&!c.tripped).sort((a,b)=>dist(sensor,a)-dist(sensor,b));
      const b=brs[0];if(b){b.tripped=true;b._sensorTripBy=sensor.id;}
    }
    sensor._tripLatched=!!sensor.tripLatch;
  }

  function clearSensorCutouts(){
    for(const c of comps){
      if(c._sensorCutout&&!c._sensorTripBy)c._sensorCutout=false;
    }
  }

  const baseStep=step;
  step=function(dt){
    baseStep(dt);
    const st=sim.st;
    // Sensor trips are evaluated from the final measurement/alarm state of this scan.
    for(const s of comps)if(SENSOR_TYPES.has(s.type))tripSensorTargets(s);

    // Burner/flame permissives. No gas/air + no auxiliary supply = no flame.
    for(const c of comps){
      if(!['burner','flame','furnace','combustionchamber'].includes(c.type))continue;
      const ready=hasFuelAir(c,sim.st)&&liveAuxSupply(c,sim.st);
      if(c.on&&!ready){c.on=false;c._ignitionFault=true;log(`⚠ ${c.label} ignition permissive failed — fuel/air/supply not healthy`);}
      if(!c.on){c.temperature=Math.max(20,(Number(c.temperature)||20)-Math.max(0,dt)*3);}
      if(c.on&&ready){
        c.temperature=Math.min(Number(c.flameTemp||1200), (Number(c.temperature)||20)+Math.max(0,dt)*Number(c.heatRate||100)*.05);
      }
    }

    // Spatial heat transfer: any active flame/burner/furnace can heat a nearby tank or process component.
    const heaters=comps.filter(c=>['burner','flame','furnace','combustionchamber'].includes(c.type)&&c.on&&!c._ignitionFault);
    for(const h of heaters){
      const radius=Number(h.heatRadius||150),rate=Number(h.heatRate||100);
      for(const t of comps){
        if(t===h||dist(h,t)>radius)continue;
        // Tank/process thermal mass. All objects may receive a simulated surface temperature.
        const d=Math.max(20,dist(h,t));
        const coupling=Math.max(0,1-d/radius);
        const target=Math.max(50,Number(h.flameTemp||h.temperature||800)*.35);
        const current=Number.isFinite(Number(t.temperature))?Number(t.temperature):20;
        t.temperature=current+(target-current)*Math.min(1,Math.max(0,dt)*rate/50000*coupling);
        t._heatedBy=h.id;t._heatInput=Math.max(0,rate*coupling);
      }
    }

    // Realistic motor dynamics after the legacy solver: voltage/frequency/slip determine speed.
    for(const c of comps){
      if(c.type==='acmotor'){
        const Vnom=Number(c.ratedVoltage||230),Vapp=Number(c.voltageSet||Vnom),f=Number(c.ratedFrequency||50),poles=Math.max(2,Number(c.poles||4));
        const sync=120*f/poles,baseRPM=Number(c.rpmSet||c.ratedRPM||1440),vFactor=clampN(Vapp/Math.max(1,Vnom),0,1.2);
        if(c.powered&&!c._sensorCutout){const target=Math.min(sync*(1-Number(c.slip||.04)),baseRPM)*vFactor;c.rpm+=(target-c.rpm)*Math.min(1,Math.max(0,dt)*2.8);c.ang+=(c.rpm/60)*Math.PI*2*Math.max(0,dt);}
        else{c.rpm=Math.max(0,c.rpm-Math.max(0,dt)*2200);}
        c.voltageActual=c.powered?Math.min(Vapp,Vnom*1.2):0;
      }
      if(c.type==='dcmotor'){
        const Vnom=Number(c.ratedVoltage||c.volts||24),Vapp=Number(c.voltageSet||c.volts||Vnom),maxRPM=Number(c.maxRPM||3000),setRPM=Number(c.rpmSet||maxRPM),pct=clampN(Number(c.speedSet??100)/100,0,1.5);
        if(c.powered&&!c._sensorCutout){const target=Math.min(maxRPM,setRPM)*clampN(Vapp/Math.max(1,Vnom),0,1.5)*pct;c.rpm+=(target-c.rpm)*Math.min(1,Math.max(0,dt)*4);c.ang+=(c.rpm/60)*Math.PI*2*Math.max(0,dt);c.voltageActual=Vapp;}
        else{c.rpm=Math.max(0,c.rpm-Math.max(0,dt)*5000);c.voltageActual=0;}
      }
      if(c.type==='motor3'){
        const Vnom=Number(c.ratedVoltage||400),Vapp=Number(c.voltageSet||Vnom),f=Number(c.ratedFrequency||50),poles=Math.max(2,Number(c.poles||4));
        const vFactor=clampN(Vapp/Math.max(1,Vnom),0,1.2),sync=120*f/poles,setRPM=Number(c.rpmSet||c.ratedRPM||1450);
        if(c.powered&&!c.phaseLoss&&!c._sensorCutout){const target=Math.min(sync*(1-Number(c.slip||.033)),setRPM)*vFactor;c.rpm+=(target-c.rpm)*Math.min(1,Math.max(0,dt)*2.5);c.ang+=(c.rpm/60)*Math.PI*2*Math.max(0,dt);c.voltageActual=Vapp;}
        else{c.rpm=Math.max(0,c.rpm-Math.max(0,dt)*2500);c.voltageActual=0;}
      }
    }

    // Clear non-latched sensor cutouts after the alarm returns to normal.
    for(const s of comps)if(SENSOR_TYPES.has(s.type)&&s.tripMode!=='none'&&!s.tripLatch){
      const safe=s.alarmState==='NORMAL'&&s.fault==='none';
      if(safe)for(const c of comps)if(c._sensorTripBy===s.id){c._sensorTripBy=null;c._sensorCutout=false;}
    }
    // Safety cutout alarms.
    for(const c of comps)if(c._sensorCutout&&!c._sensorTripLogged){c._sensorTripLogged=true;log(`🛑 ${c.label} de-energised by process safety interlock`);}
    for(const c of comps)if(!c._sensorCutout)c._sensorTripLogged=false;
    sim.alarms=sim.alarms||[];
    for(const s of comps)if(SENSOR_TYPES.has(s.type)&&(s.alarmState==='TRIP'||s.alarmState==='BAD'||s.alarmState==='HIGH'||s.alarmState==='LOW'))sim.alarms.push(['bad',`${s.label} SAFETY INTERLOCK ${s.alarmState}`]);
  };

  // Enforce ignition at the user interface as well as during simulation.
  const oldClick=clickAction;
  clickAction=function(c){
    if(['burner','flame','furnace','combustionchamber'].includes(c.type)&&!c.on){
      const st=sim.st||evalCircuit();
      if(!hasFuelAir(c,st)||!liveAuxSupply(c,st)){log(`⚠ ${c.label} will not ignite: establish fuel/air and auxiliary electrical supply first`);renderProps();return;}
      c._ignitionFault=false;
    }
    oldClick(c);
  };

  // Reset upgrade state.
  const oldReset=resetSim;
  resetSim=function(){oldReset();for(const c of comps){delete c._sensorCutout;delete c._sensorTripBy;delete c._sensorTripLogged;delete c._ignitionFault;if(c.type==='burner'||c.type==='flame'||c.type==='furnace'||c.type==='combustionchamber')c.temperature=20;}};

  // Industrial-looking motor graphics. Keep terminal geometry unchanged.
  function motorGraphic(c,kind){
    const powered=!!c.powered&&!c._sensorCutout, rpm=Number(c.rpm||0);
    body(c,kind==='3p'?130:110,kind==='3p'?110:100,powered?COL.ok:c._sensorCutout?COL.bad:COL.edge);
    ctx.save();
    ctx.fillStyle='#20344d';ctx.strokeStyle=powered?COL.ok:'#58708c';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(-36,-30,72,60,12);ctx.fill();ctx.stroke();
    // stator laminations / cooling fins
    for(let x=-28;x<=28;x+=8){line([[x,-34],[x,-27]],'#5b7590',2);line([[x,27],[x,34]],'#5b7590',2);}
    ctx.save();ctx.rotate((c.ang||0));ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fillStyle='#111f31';ctx.fill();ctx.strokeStyle=powered?COL.live:'#4a6a8a';ctx.lineWidth=2;ctx.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;line([[Math.cos(a)*3,Math.sin(a)*3],[Math.cos(a)*17,Math.sin(a)*17]],powered?COL.live:'#6f86a0',3);}ctx.restore();
    ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fillStyle=powered?COL.live:'#6a7f95';ctx.fill();
    txt(c,c.label,0,-48,COL.text,9,'center',800);
    txt(c,`${Math.round(rpm)} RPM`,0,41,powered?COL.ok:COL.mut,9,'center',800);
    txt(c,kind==='dc'?`${Number(c.voltageActual||0).toFixed(0)} V DC`:kind==='3p'?`${Number(c.voltageActual||0).toFixed(0)} V 3Φ`:`${Number(c.voltageActual||0).toFixed(0)} V 1Φ`,0,54,COL.mut,8,'center',700);
    if(c.phaseLoss)txt(c,'PHASE LOSS',0,0,COL.bad,8,'center',800);
    if(c._sensorCutout)txt(c,'SAFETY TRIP',0,0,COL.bad,8,'center',800);
    ctx.restore();
  }
  DRAW.acmotor=c=>motorGraphic(c,'1p');
  DRAW.dcmotor=c=>motorGraphic(c,'dc');
  if(DRAW.motor3)DRAW.motor3=c=>motorGraphic(c,'3p');else DRAW.motor3=c=>motorGraphic(c,'3p');

  // Improved burner/flame visuals with visible supply status and heat halo.
  function burnerGraphic(c,kind){
    const on=!!c.on&&!c._ignitionFault,ready=on;
    body(c,kind==='furnace'?140:100,kind==='furnace'?120:80,on?COL.warn:c._ignitionFault?COL.bad:COL.edge);
    ctx.fillStyle='#1a2a3c';ctx.fillRect(kind==='furnace'?-60:-40,kind==='furnace'?-50:-30,kind==='furnace'?120:80,kind==='furnace'?100:60);
    ctx.strokeStyle=on?COL.warn:c._ignitionFault?COL.bad:'#4a6a8c';ctx.lineWidth=2;ctx.strokeRect(kind==='furnace'?-60:-40,kind==='furnace'?-50:-30,kind==='furnace'?120:80,kind==='furnace'?100:60);
    if(on){glow(0,0,kind==='furnace'?70:45,'rgba(255,100,40,.55)');ctx.save();ctx.scale(1,1.15);ctx.beginPath();ctx.moveTo(0,-28);ctx.bezierCurveTo(-22,-6,-14,10,0,22);ctx.bezierCurveTo(16,10,22,-8,0,-28);ctx.fillStyle='#ff5a36';ctx.fill();ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(0,8,10,0,7);ctx.fill();ctx.restore();}
    txt(c,c.label,0,kind==='furnace'?-58:-38,COL.text,9,'center',800);
    txt(c,on?'FLAME ON':c._ignitionFault?'NO SUPPLY / PERMISSIVE':'OFF',0,kind==='furnace'?50:35,on?COL.warn:c._ignitionFault?COL.bad:COL.mut,8,'center',800);
    txt(c,`${Math.round(c.temperature||20)}°C`,0,kind==='furnace'?65:50,on?COL.warn:COL.mut,9,'center',800);
  }
  DRAW.burner=c=>burnerGraphic(c,'burner');
  DRAW.flame=c=>burnerGraphic(c,'flame');
  DRAW.furnace=c=>burnerGraphic(c,'furnace');
  DRAW.combustionchamber=c=>burnerGraphic(c,'combustionchamber');

  // Extend descriptions with industrial state.
  const oldDescribe=describe;
  describe=function(c){
    let s=oldDescribe(c)||'';
    if(SENSOR_TYPES.has(c.type))s+=`\nSafety trip: ${c.tripEnabled===false?'disabled':c.tripMode==='breaker'?'breaker trip':c.tripMode==='load'?'load cut-off':'alarm only'}\nAlarm: ${c.alarmState||'NORMAL'}\nPV: ${Number.isFinite(c.measured)?Number(c.measured).toFixed(2):'BAD'} ${c.unit||''}`;
    if(['acmotor','dcmotor','motor3'].includes(c.type))s+=`\nSpeed: ${Math.round(c.rpm||0)} RPM\nApplied voltage: ${Number(c.voltageActual||0).toFixed(1)} V${c.type==='motor3'?' 3-phase':''}`;
    if(['burner','flame','furnace','combustionchamber'].includes(c.type))s+=`\nIgnition permissive: ${c.on&&!c._ignitionFault?'HEALTHY':'NOT READY'}\nTemperature: ${Math.round(c.temperature||20)} °C${c._heatedBy?'\nHeat transferred to nearby equipment':''}`;
    return s;
  };

  // Update footer immediately when a safety trip is visible.
  const oldFooter=renderProps;
  // Keep original render pipeline intact; only append a small live safety status when selected.
  const originalHint=$('hint');
  if(originalHint)originalHint.innerHTML+=' · <b>Industrial interlocks:</b> sensor alarms can trip loads/breakers; burners require fuel/air + electrical supply; flames transfer heat by proximity.';
})();
