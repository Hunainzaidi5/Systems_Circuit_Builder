/* ══════════ v37 · SHARED SCHEMATIC GLYPHS + SIDEBAR COLLAPSE ══════════ */
(function(){
'use strict';
/* nicer per-type schematic glyph for def2 parts — delegates from 40/41 G() */
window.__glyph=function(c){
  const t=c.type,d=DEFS[c.type]||{};
  ctx.save();ctx.strokeStyle='#e8eef5';ctx.fillStyle='#e8eef5';ctx.lineWidth=1.4;
  if(/starter|mccb|relay|contactor|breaker|bustie|paralleling/.test(t)){
    ctx.beginPath();ctx.moveTo(-12,8);ctx.lineTo(0,-8);ctx.lineTo(12,8);ctx.stroke();ctx.beginPath();ctx.arc(0,8,2,0,7);ctx.fill();
    ctx.beginPath();ctx.moveTo(-12,-8);ctx.lineTo(-12,-12);ctx.moveTo(12,-8);ctx.lineTo(12,-12);ctx.stroke();
  }else if(/motor|pump|fan|compressor/.test(t)){
    ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.stroke();ctx.font='bold 11px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('M',0,1);
  }else if(/bridge|rectifier|scr|igbt|inverter|evcharger/.test(t)){
    ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-4,-8);ctx.lineTo(-4,8);ctx.closePath();ctx.stroke();
    ctx.beginPath();ctx.moveTo(4,-8);ctx.lineTo(4,8);ctx.lineTo(14,0);ctx.closePath();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-14,10);ctx.lineTo(14,10);ctx.stroke();
  }else if(/valve|orifice|controlvalve|flashtank|desuperheater/.test(t)){
    ctx.beginPath();ctx.moveTo(-12,-8);ctx.lineTo(12,8);ctx.moveTo(-12,8);ctx.lineTo(12,-8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.stroke();
  }else if(/tank|receiver|drum|header|hx|boiler/.test(t)){
    ctx.strokeRect(-14,-10,28,20);ctx.beginPath();ctx.moveTo(-14,-3);ctx.lineTo(14,-3);ctx.stroke();
    if(/hx|exchanger/.test(t)){ctx.beginPath();ctx.moveTo(-6,-10);ctx.lineTo(-6,10);ctx.moveTo(6,-10);ctx.lineTo(6,10);ctx.stroke();}
  }else if(/sensor|transmitter|orificeplate|dp/.test(t)){
    ctx.beginPath();ctx.arc(0,-3,3,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,14);ctx.stroke();ctx.beginPath();ctx.moveTo(-6,14);ctx.lineTo(6,14);ctx.stroke();
  }else if(/pid|ratio|split|modbus/.test(t)){
    ctx.strokeRect(-13,-9,26,18);ctx.beginPath();ctx.moveTo(-6,-3);ctx.lineTo(-1,2);ctx.lineTo(4,-5);ctx.stroke();
  }else if(/meter|megger|pqa|clamp|multi/.test(t)){
    ctx.strokeRect(-10,-12,20,24);ctx.beginPath();ctx.moveTo(-5,4);ctx.lineTo(5,-4);ctx.stroke();
  }else{
    ctx.strokeRect(-13,-9,26,18);ctx.fillStyle='#8fb3c9';ctx.font='bold 9px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.tag||t.slice(0,3).toUpperCase(),0,0);
  }
  ctx.restore();
};
/* delegate 40/41 G() to the shared glyph — they call G(c) / G(c,d) inside draw specs */
try{if(typeof G!=='undefined'){} }catch(e){}

/* ── sidebar collapse: click a card header OR the master toggle ── */
(function(){
  const side=document.getElementById('side')||document.querySelector('aside');if(!side)return;
  const st=document.createElement('style');
  st.textContent='.card>h2{cursor:pointer;user-select:none}.card>h2::after{content:"▾";float:right;opacity:.5}.card.collapsed>.bd{display:none}.card.collapsed>h2::after{content:"▸"}#bCollapseAll{font-size:11px;padding:3px 10px}';
  document.head.appendChild(st);
  const cards=()=>[...side.querySelectorAll('.card')];
  const allCollapsed=()=>cards().every(c=>c.classList.contains('collapsed'));
  /* master toggle button — insert at top of sidebar */
  const btn=document.createElement('button');btn.id='bCollapseAll';btn.textContent='⇅ Collapse all';btn.className='ptog';btn.style.margin='4px 8px';
  side.insertBefore(btn,side.firstChild);
  btn.onclick=()=>{const col=!allCollapsed();cards().forEach(c=>c.classList.toggle('collapsed',col));btn.textContent=col?'⇅ Expand all':'⇅ Collapse all';};
  side.querySelectorAll('.card>h2').forEach(h=>{
    h.addEventListener('click',()=>{const card=h.parentElement;card.classList.toggle('collapsed');
      btn.textContent=allCollapsed()?'⇅ Expand all':'⇅ Collapse all';});
  });
})();

/* ── realistic part body: rounded chassis, terminal studs, status LED, label plate ── */
window.__partBody=function(c,d,col){
  const w=d.w||100,h=d.h||80;
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate((c.rot||0)*Math.PI/2);
  /* chassis shadow + bezel */
  ctx.fillStyle='rgba(0,0,0,.35)';rr(-w/2+2,-h/2+3,w,h,8);ctx.fill();
  const g=ctx.createLinearGradient(0,-h/2,0,h/2);
  g.addColorStop(0,'#2b3a4d');g.addColorStop(.5,'#1a2634');g.addColorStop(1,'#101a26');
  ctx.fillStyle=g;rr(-w/2,-h/2,w,h,8);ctx.fill();
  ctx.strokeStyle=col||'#3d5a76';ctx.lineWidth=1.5;rr(-w/2,-h/2,w,h,8);ctx.stroke();
  /* top label plate */
  ctx.fillStyle='rgba(255,255,255,.06)';rr(-w/2+6,-h/2+5,w-12,16,3);ctx.fill();
  ctx.fillStyle='#cfe3f5';ctx.font='700 10px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(c.label||d.tag||d.name||'',0,-h/2+13);
  /* terminal studs at each terminal position */
  ctx.fillStyle='#ffd166';
  for(const t of(d.term||[])){const x=t[1],y=t[2];ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();ctx.strokeStyle='#8a6a22';ctx.lineWidth=.8;ctx.stroke();}
  /* status LED bottom-right */
  const on=!c.tripped&&!c.broken;ctx.fillStyle=on?'#3df5b0':'#ef4444';
  ctx.beginPath();ctx.arc(w/2-10,h/2-10,3.5,0,7);ctx.fill();
  ctx.restore();
};
log('v37 module ready — collapse-all sidebar toggle + realistic part chassis.');
})();
