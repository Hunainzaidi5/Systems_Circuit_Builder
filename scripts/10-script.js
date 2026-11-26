
(function(){
  /* ---------------------------------------------------------------
     V5 visual + thermal process revision
     - AC/DC motors follow the supplied reference: light rounded housing,
       three dark mounting/vent circles, yellow central gear/rotor,
       black/red bottom terminals.
     - Burner/flame is reversed to point downward, with a broad thermal
       plume around the lower nozzle. Heat is transferred to nearby tanks,
       process equipment and connected pipe fluid.
  ---------------------------------------------------------------- */
  const motorKinds=new Set(['acmotor','dcmotor','motor3']);

  // Move motor terminals to the bottom to match the supplied reference.
  if(DEFS.acmotor) DEFS.acmotor.term=[['L',-18,58,0,1],['N',18,58,0,1],['PE',0,66,0,1]];
  if(DEFS.dcmotor) DEFS.dcmotor.term=[['+',-18,58,0,1],['-',18,58,0,1]];
  if(DEFS.motor3) DEFS.motor3.term=[['U',-30,62,0,1],['V',0,66,0,1],['W',30,62,0,1],['PE',0,70,0,1]];

  function gearPath(cx,cy,r1,r2,n){
    ctx.beginPath();
    for(let i=0;i<n*2;i++){
      const a=-Math.PI/2+i*Math.PI/n, r=i%2?r2:r1;
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
  }
  function terminalPost(x,y,cap,sub){
    ctx.save();
    ctx.strokeStyle='#9a9a9a';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+12);ctx.stroke();
    ctx.fillStyle=cap;ctx.beginPath();ctx.roundRect(x-11,y-1,22,15,3);ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.18)';ctx.stroke();
    ctx.fillStyle='#777';ctx.beginPath();ctx.arc(x,y+15,4,0,Math.PI*2);ctx.fill();
    if(sub){ctx.fillStyle='#fff';ctx.font='800 8px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sub,x,y+6);}
    ctx.restore();
  }
  function referenceMotor(c,kind){
    const running=!!c.powered&&!c._sensorCutout;
    const w=kind==='3p'?130:110,h=kind==='3p'?108:100;
    ctx.save();
    // Reference-style pale enclosure with clipped/octagonal corners.
    ctx.beginPath();
    ctx.moveTo(-w/2+22,-h/2);ctx.lineTo(w/2-22,-h/2);
    ctx.quadraticCurveTo(w/2,-h/2,w/2-8,-h/2+20);
    ctx.lineTo(w/2-8,h/2-20);ctx.quadraticCurveTo(w/2,h/2,w/2-22,h/2);
    ctx.lineTo(-w/2+22,h/2);ctx.quadraticCurveTo(-w/2,h/2,-w/2+8,h/2-20);
    ctx.lineTo(-w/2+8,-h/2+20);ctx.quadraticCurveTo(-w/2,-h/2,-w/2+22,-h/2);
    ctx.closePath();
    ctx.fillStyle='#bdbdbd';ctx.fill();ctx.strokeStyle='#d2d2d2';ctx.lineWidth=9;ctx.stroke();

    // Three dark mounting/vent circles.
    const r=Math.min(15,w*.14);
    [[0,-h*.29],[-w*.31,0],[w*.31,0]].forEach(([x,y])=>{
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='#606060';ctx.fill();
    });

    // Yellow gear/rotor in the centre.
    gearPath(0,0,25,31,10);ctx.fillStyle=running?'#f0d34a':'#d8c044';ctx.fill();ctx.strokeStyle='#b79c23';ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fillStyle=running?'#d7bd43':'#c9b43f';ctx.fill();ctx.strokeStyle='#b39a26';ctx.stroke();
    if(running){
      ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.strokeStyle='rgba(255,220,70,.18)';ctx.lineWidth=5;ctx.stroke();
    }

    // Bottom terminals: black/red for 1-phase/DC; three coloured phase posts for 3Φ.
    if(kind==='3p'){
      terminalPost(-30,h/2-2,'#2d2d2d','U');terminalPost(0,h/2+1,'#b72b2b','V');terminalPost(30,h/2-2,'#2d5e9e','W');
    }else if(kind==='dc'){
      terminalPost(-18,h/2-2,'#2d2d2d','+');terminalPost(18,h/2-2,'#b72b2b','−');
    }else{
      terminalPost(-18,h/2-2,'#2d2d2d','L');terminalPost(18,h/2-2,'#b72b2b','N');
    }

    ctx.fillStyle='#4a4a4a';ctx.font='800 9px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillText(c.label,0,-h/2-8);
    ctx.fillStyle=running?'#287a52':'#555';ctx.font='700 8px ui-monospace,Consolas,monospace';
    const mode=kind==='dc'?'DC':kind==='3p'?'3Φ AC':'1Φ AC';
    ctx.fillText(`${mode} · ${Math.round(c.rpm||0)} RPM`,0,h/2+30);
    if(c._sensorCutout){ctx.fillStyle='#c62828';ctx.font='800 8px sans-serif';ctx.fillText('SAFETY TRIP',0,10);}
    if(c.phaseLoss){ctx.fillStyle='#c62828';ctx.font='800 8px sans-serif';ctx.fillText('PHASE LOSS',0,10);}
    ctx.restore();
  }
  DRAW.acmotor=c=>referenceMotor(c,'ac');
  DRAW.dcmotor=c=>referenceMotor(c,'dc');
  DRAW.motor3=c=>referenceMotor(c,'3p');

  // Reversed burner: nozzle above, flame/thermal plume points downward.
  function downwardFlame(x,y,scale){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    glow(0,18,44,'rgba(255,108,35,.34)');
    ctx.beginPath();ctx.moveTo(0,-4);ctx.bezierCurveTo(-17,10,-22,28,-12,43);ctx.bezierCurveTo(-6,52,6,52,13,42);ctx.bezierCurveTo(23,27,14,10,0,-4);ctx.closePath();
    ctx.fillStyle='#ef4d2f';ctx.fill();ctx.strokeStyle='#b9321f';ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,7);ctx.bezierCurveTo(-9,19,-10,31,-4,38);ctx.bezierCurveTo(1,44,7,39,8,32);ctx.bezierCurveTo(11,22,5,14,0,7);ctx.closePath();
    ctx.fillStyle='#ffd44d';ctx.fill();
    ctx.restore();
  }
  function reversedBurner(c,kind){
    const on=!!c.on&&!c._ignitionFault;
    const w=kind==='furnace'?140:kind==='flame'?84:110;
    const h=kind==='furnace'?120:kind==='flame'?90:100;
    ctx.save();
    // Heat field around the lower side where a tank/pipe can sit.
    if(on){
      const R=Number(c.heatRadius||150);
      const g=ctx.createRadialGradient(0,34,8,0,34,R*.62);
      g.addColorStop(0,'rgba(255,145,45,.30)');g.addColorStop(.55,'rgba(255,95,35,.12)');g.addColorStop(1,'rgba(255,60,20,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,40,Math.min(w*.95,R*.55),Math.min(h*.7,R*.42),0,0,Math.PI*2);ctx.fill();
    }
    // Main casing/nozzle.
    ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h*.48,12);ctx.fillStyle='#b8b8b8';ctx.fill();ctx.strokeStyle=on?'#d27a2b':'#7b7b7b';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#555';ctx.fillRect(-w*.23,-h*.04,w*.46,h*.12);
    ctx.fillStyle='#333';ctx.fillRect(-w*.12,h*.02,w*.24,h*.10);
    if(on)downwardFlame(0,h*.09,kind==='furnace'?1.25:kind==='flame'?.9:1.05);
    else {ctx.fillStyle='#777';ctx.beginPath();ctx.arc(0,h*.13,8,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#4b4b4b';ctx.font='800 9px Inter,sans-serif';ctx.textAlign='center';ctx.fillText(c.label,0,-h*.38);
    ctx.fillStyle=on?'#b95c19':c._ignitionFault?'#c62828':'#555';ctx.font='800 8px ui-monospace,Consolas,monospace';ctx.fillText(on?`FLAME · ${Math.round(c.temperature||20)}°C`:c._ignitionFault?'NO IGNITION':'OFF',0,h*.43);
    ctx.restore();
  }
  DRAW.burner=c=>reversedBurner(c,'burner');
  DRAW.flame=c=>reversedBurner(c,'flame');
  DRAW.furnace=c=>reversedBurner(c,'furnace');
  DRAW.combustionchamber=c=>reversedBurner(c,'chamber');

  // Thermal network: spatial heat plus pipe-fluid conduction/advection.
  const oldStepV5=step;
  step=function(dt){
    oldStepV5(dt);
    const heaters=comps.filter(c=>['burner','flame','furnace','combustionchamber'].includes(c.type)&&c.on&&!c._ignitionFault);
    const nowTemp=(c)=>Number.isFinite(Number(c.temperature))?Number(c.temperature):20;
    // Heat component surfaces and connected process vessels.
    for(const h of heaters){
      const radius=Math.max(40,Number(h.heatRadius||150));
      const source=Math.max(150,Number(h.flameTemp||h.temperature||800));
      for(const c of comps){
        if(c===h)continue;
        const d=Math.hypot((h.x||0)-(c.x||0),(h.y||0)-(c.y||0));if(d>radius)continue;
        const coupling=Math.pow(Math.max(0,1-d/radius),1.35);
        const mass=(c.type==='tank'||c.type==='feedwatertank'||c.type==='silo'||c.type==='silopump'||c.type==='gastank'||c.type==='lpgtank')?0.055:0.12;
        const target=20+(source-20)*.58;
        c.temperature=nowTemp(c)+(target-nowTemp(c))*Math.min(.08,Math.max(0,dt)*mass*coupling);
        c._heatedBy=h.id;c._heatInput=Math.max(Number(c._heatInput||0),coupling*Number(h.heatRate||100));
      }
    }
    // Cool thermal marks and propagate heat into the fluid contained in pipe runs.
    for(const w of wires.filter(isPipe)){
      const P=w._P||routeWire(w);if(!P||P.length<2)continue;
      let minD=1e9,hot=null;
      for(const h of heaters){
        for(const p of P){const d=Math.hypot(p.x-h.x,p.y-h.y);if(d<minD){minD=d;hot=h;}}
      }
      const radius=hot?Number(hot.heatRadius||150):0;
      if(hot&&minD<radius){
        const coupling=Math.max(0,1-minD/radius);
        const source=Number(hot.flameTemp||hot.temperature||800);
        const target=20+(source-20)*.48;
        const cur=Number.isFinite(Number(w._fluidTemp))?Number(w._fluidTemp):20;
        w._fluidTemp=cur+(target-cur)*Math.min(.12,Math.max(0,dt)*.18*coupling);
        w._heatInput=coupling*Number(hot.heatRate||100);
        // Heat the components at both ends, representing fluid/wall conduction.
        for(const end of [w.a,w.b]){const c=getC(end.c);if(c&&c.type!=='burner'&&c.type!=='flame'){
          const tc=nowTemp(c);c.temperature=tc+(w._fluidTemp-tc)*Math.min(.18,Math.max(0,dt)*.12*coupling);c._heatedBy=hot.id;
        }}
      }else if(Number.isFinite(Number(w._fluidTemp))){
        w._fluidTemp+= (20-w._fluidTemp)*Math.min(.004,Math.max(0,dt)/300);
        if(w._fluidTemp<20.2)delete w._fluidTemp;
      }
    }
  };

  // Thermal colouring on pipe runs: the pipe visibly transitions from blue/brown to hot orange.
  const oldDrawPipeV5=drawPipe;
  drawPipe=function(w,P,now){
    const hot=Number(w._heatInput||0)>0&&Number.isFinite(Number(w._fluidTemp));
    if(hot){
      drawPath(P);ctx.strokeStyle='rgba(255,110,35,.18)';ctx.lineWidth=18;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
    }
    oldDrawPipeV5(w,P,now);
    if(hot){
      drawPath(P);ctx.setLineDash([3,9]);ctx.lineDashOffset=-now*.025;ctx.strokeStyle='rgba(255,190,70,.85)';ctx.lineWidth=2.5;ctx.stroke();ctx.setLineDash([]);
    }
  };

  // Thermal halo on heated tanks/process components.
  const oldDrawCompV5=drawComp;
  drawComp=function(c){
    if(Number(c._heatInput||0)>0&&Number(c.temperature||20)>35){
      ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot*Math.PI/2);
      const d=DEFS[c.type],q=Math.min(1,Number(c._heatInput||0)/150);
      ctx.shadowColor=`rgba(255,100,30,${.2+.35*q})`;ctx.shadowBlur=16+20*q;
      ctx.strokeStyle=`rgba(255,120,35,${.35+.35*q})`;ctx.lineWidth=3;ctx.strokeRect(-d.w/2,-d.h/2,d.w,d.h);ctx.restore();
    }
    oldDrawCompV5(c);
  };
})();
