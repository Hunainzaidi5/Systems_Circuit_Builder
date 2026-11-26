
/* v11 realism layer: fluid properties, static head, service-aware instruments and component footer. */
(function(){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fprop={
    water:{rho:998,mu:0.001,cp:4180,compress:4.6e-10},
    steam:{rho:0.60,mu:0.000013,cp:2080,compress:1/100000},
    gas:{rho:0.72,mu:0.000011,cp:2200,compress:1/100000},
    flue:{rho:0.35,mu:0.000020,cp:1100,compress:1/50000},
    air:{rho:1.2,mu:0.000018,cp:1005,compress:1/101325}
  };
  const fluidName=k=>k==='steam'?'Steam':k==='gas'?'Gas':k==='flue'?'Flue gas':k==='air'?'Air':k==='water'?'Water':'No service';
  const pressureFromHead=(headM,k,temp)=>{
    const rho=fprop[k]?.rho||998;
    const tr=clamp(293/(Number(temp)||293),0.65,1.15);
    return rho*9.80665*headM*tr/1e5;
  };
  const componentService=c=>{
    if(!c)return '—';
    if(c.fluid&&c.fluid!=='none')return fluidName(c.fluid);
    const cat=DEFS[c.type]?.cat||'';
    if(cat.includes('Gas'))return 'Gas'; if(cat.includes('Steam'))return 'Steam'; if(cat.includes('Hydraulic'))return 'Water';
    return '—';
  };
  const oldRenderProps=renderProps;
  renderProps=function(){
    oldRenderProps();
    const c=selected&&selected.kind==='c'?getC(selected.id):null;
    const tag=$('footerTag'),name=$('footerName'),desc=$('footerDesc'),svc=$('footerService');
    if(!c){tag.textContent='—';name.innerHTML='No component selected<small>Select a part on the board</small>';svc.textContent='—';desc.textContent='Select a component to see a short description and how to connect it. Drag parts from the left palette, click terminals to start a wire or pipe; select a wire, double-click its path to add bends, then drag white handles to reshape it.';return;}
    const d=DEFS[c.type]||{};
    tag.textContent=d.tag||'—'; name.innerHTML=`${c.label||d.name}<small>${d.cat||'Component'}</small>`;
    svc.textContent=componentService(c).toUpperCase();
    let extra='';
    if(c.type==='motor')extra=' Electrical: L/N/PE. Fluid: SUC → DIS. Keep suction flooded and provide a discharge destination.';
    else if(c.type==='gearpump')extra=' Gear pump: drive via L/N/PE motor supply OR wire SHAFT to an engine/turbine drive. Fluid: SUC → DIS between tanks.';
    else if(INSTRUMENT_TYPES.has(c.type))extra=' Instrument: connect to the matching fluid service; it does not carry the process flow unless it has IN/OUT ports.';
    else if(c.type==='ats')extra=' ATS: SRC1–SRC4 are independent L/N source inputs; LOAD_L/LOAD_N feed the protected load. Never parallel sources. Use AUTO for automatic source selection or MANUAL to force the selected input.';
    else if((DEFS[c.type]?.term||[]).some(t=>t[5]==='h'))extra=' Fluid component: connect only to the correct service (water, steam or gas) and follow terminal direction.';
    desc.textContent=(COMP_BLURB[c.type]||'Process component. Connect according to the terminal names and operating conditions shown in Properties.')+extra;
  };

  // More physical instrument scaling: pressure/flow temperature compensation and service-specific ranges.
  const oldStep=step;
  step=function(dt){
    oldStep(dt);
    const sec=Math.max(0,dt||0);
    for(const c of comps){
      if(!INSTRUMENT_TYPES.has(c.type))continue;
      const kind=c.fluid&&c.fluid!=='none'?c.fluid:null;
      if(!kind)continue;
      const prop=fprop[kind]||fprop.water;
      if(c.type==='gauge'){
        const max=Number(c.max)||10;
        c.pressure=clamp(Number(c.pressure)||0,0,max*1.25);
        c._density=prop.rho;
      }
      if(c.type==='dpgauge')c.pressure=Math.max(0,Number(c.pressure)||0);
      if(c.type==='vacuumgauge')c.pressure=clamp(Number(c.pressure)||0,0,Number(c.max)||1);
      if(c.type==='tempgauge'){
        const t=Number(c.temperature)||20;
        c.temperature=clamp(t,-40,600);
        if(kind==='steam')c.temperature=Math.max(c.temperature,100);
      }
      if(c.type==='flowmeter'||c.type==='rotameter'){
        const q=Math.max(0,Number(c.flow)||0);
        const tempK=Math.max(180,(Number(c.temperature)||20)+273.15);
        // Rotameter indication is corrected for density; gas/steam use mass-flow-equivalent scaling.
        c._massFlow=q*(prop.rho/1000);
        c._density=prop.rho;
        if(kind==='gas')c.flow=q*Math.sqrt(293/tempK);
        if(kind==='steam')c.flow=q*Math.sqrt(373/tempK);
        c.total=Math.max(0,Number(c.total)||0);
      }
    }
    // Static pressure/head relation for water tanks and pump discharge, plus modest thermal drift.
    for(const t of comps.filter(x=>x.type==='tank'||x.type==='silo'||x.type==='silopump')){
      const head=Math.max(0,Number(t.level)||0)*0.03;
      t.pressure=Math.max(0.001,pressureFromHead(head,'water',t.temperature||20));
      t.temperature=clamp(Number(t.temperature)||20,5,95);
    }
    for(const p of comps.filter(x=>x.type==='motor'||x.type==='gearpump')){
      if(p.powered&&p.flow>0){
        const flowLmin=Math.max(0,Number(p.flow)*600);
        const hydraulicW=Math.max(0,(p.pressure||0)*1e5*(flowLmin/60000));
        const mechW=Math.max(1,Number(p.hp||1)*746);
        p._hydEff=clamp(hydraulicW/mechW,0,1);
      }else p._hydEff=0;
    }
  };

  // Make selection refresh the footer immediately after click/drag/duplicate operations.
  const oldSel=renderProps;
  window.refreshComponentFooter=()=>{try{oldSel();}catch(e){}};
  setTimeout(()=>{try{renderProps();}catch(e){}},0);
})();
