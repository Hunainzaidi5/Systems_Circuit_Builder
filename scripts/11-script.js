
/* V6 stability patch: guaranteed motor palette + crash-safe motor/combustion drawing. */
(function(){
  try{
    const groups=$('componentGroups');
    if(groups && !groups.querySelector('.motors-v6')){
      const sec=document.createElement('section');
      sec.className='palette-group motors-v6';
      sec.dataset.category='Motors';
      sec.innerHTML='<div class="cat" style="--a:#f59e0b">Motors</div><div class="grid2">'+
        ['acmotor','dcmotor','motor3'].map(k=>`<div class="item" draggable="true" style="--a:#f59e0b" data-type="${k}" title="Drag to board or click to add"><div class="ic">${ICON[k]||'⚙️'}</div><div class="nm">${DEFS[k]?.name||k}</div></div>`).join('')+
        '</div>';
      groups.insertBefore(sec,groups.firstChild);
      sec.querySelectorAll('.item').forEach(el=>{
        el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',el.dataset.type));
        el.addEventListener('click',()=>{try{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=(comps.length%3)*180;addComp(el.dataset.type,p.x+n,p.y+n);}catch(err){console.warn('motor add',err);}});
      });
    }
  }catch(e){console.warn('motor palette',e);}

  // Use a renderer that cannot throw on older canvas implementations.
  function motorFallback(c,kind){
    try{
      const running=!!c.powered&&!c._sensorCutout;
      const w=kind==='3p'?130:110,h=100;
      ctx.save();
      ctx.fillStyle='#bdbdbd';ctx.strokeStyle='#d2d2d2';ctx.lineWidth=8;
      ctx.beginPath();
      ctx.moveTo(-w/2+18,-h/2);ctx.lineTo(w/2-18,-h/2);ctx.quadraticCurveTo(w/2,-h/2,w/2-7,-h/2+18);
      ctx.lineTo(w/2-7,h/2-18);ctx.quadraticCurveTo(w/2,h/2,w/2-18,h/2);ctx.lineTo(-w/2+18,h/2);
      ctx.quadraticCurveTo(-w/2,h/2,-w/2+7,h/2-18);ctx.lineTo(-w/2+7,-h/2+18);ctx.quadraticCurveTo(-w/2,-h/2,-w/2+18,-h/2);ctx.closePath();ctx.fill();ctx.stroke();
      [[0,-29],[-34,0],[34,0]].forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],14,0,Math.PI*2);ctx.fillStyle='#606060';ctx.fill();});
      // Gear-like rotor, matching the supplied reference.
      ctx.beginPath();
      const teeth=10;
      for(let i=0;i<teeth*2;i++){const a=-Math.PI/2+i*Math.PI/teeth,r=i%2?24:31,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();
      ctx.fillStyle=running?'#f0d34a':'#d8c044';ctx.fill();ctx.strokeStyle='#b79c23';ctx.lineWidth=1.5;ctx.stroke();
      ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fillStyle='#c9b43f';ctx.fill();ctx.strokeStyle='#b39a26';ctx.stroke();
      const posts=kind==='3p'?[[-30,'#2d2d2d','U'],[0,'#b72b2b','V'],[30,'#2d5e9e','W']]:kind==='dc'?[[-18,'#2d2d2d','+'],[18,'#b72b2b','−']]:[[-18,'#2d2d2d','L'],[18,'#b72b2b','N']];
      posts.forEach(q=>{ctx.fillStyle=q[1];ctx.fillRect(q[0]-10,47,20,14);ctx.fillStyle='#777';ctx.beginPath();ctx.arc(q[0],64,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(q[2],q[0],57);});
      ctx.fillStyle='#4a4a4a';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(c.label||'MOTOR',0,-58);
      ctx.fillStyle=running?'#287a52':'#555';ctx.font='bold 8px monospace';ctx.fillText(`${kind==='dc'?'DC':kind==='3p'?'3Φ AC':'1Φ AC'} · ${Math.round(c.rpm||0)} RPM`,0,76);
      ctx.restore();
    }catch(e){console.warn('motor draw',e);}
  }
  DRAW.acmotor=c=>motorFallback(c,'ac');
  DRAW.dcmotor=c=>motorFallback(c,'dc');
  DRAW.motor3=c=>motorFallback(c,'3p');

  // Never let a combustion/thermal drawing exception stop the animation loop.
  for(const k of ['burner','flame','furnace','combustionchamber']){
    const old=DRAW[k];
    DRAW[k]=c=>{try{old(c);}catch(e){console.warn('combustion draw',k,e);try{body(c,k==='furnace'?140:100,k==='furnace'?120:80,c.on?COL.warn:COL.edge);txt(c,c.label||k,0,0,COL.text,9,'center',800);}catch(_){}}};
  }

  // Catch a bad thermal tick rather than killing requestAnimationFrame.
  const currentStep=step;
  step=function(dt){try{return currentStep(dt);}catch(e){console.warn('simulation tick recovered',e);sim.alarms=sim.alarms||[];sim.alarms.push(['bad','Recovered from simulation calculation error']);}};
})();
