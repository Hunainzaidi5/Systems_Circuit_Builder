/* ══════════ v32 · SCHEMATIC SYMBOL MODE (IEC/ANSI-style) ══════════
 * Toggle replaces realistic component art with simplified schematic symbols:
 * terminal stubs, tag label, and a small per-category glyph (motor M, source ~,
 * switch blade, valve bowtie, tank weir). Purely visual — simulation untouched. */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
let sym=false;
/* glyph per category / type */
function glyph(c,d){
  const t=c.type,cat=d.cat||'';
  ctx.save();ctx.strokeStyle='#e8eef5';ctx.fillStyle='#e8eef5';ctx.lineWidth=1.4;
  if(/motor|pump|fan|compressor/.test(t)){
    ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.stroke();ctx.font='bold 11px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('M',0,1);
  }else if(/source|battery|psu|charger|generator|turbine|inverter|ups/.test(t)){
    ctx.beginPath();for(let x=-14;x<=14;x+=2){const y=x===-14?0:Math.sin(x*.7)*5;ctx.lineTo(x,y);}ctx.stroke();ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(20,0);ctx.stroke();
  }else if(/switch|relay|contact|breaker|mcb|acb|vcb|fuse|isolator|changeover|ats/.test(t)){
    ctx.beginPath();ctx.moveTo(-12,8);ctx.lineTo(0,-8);ctx.lineTo(12,8);ctx.stroke();ctx.beginPath();ctx.arc(0,8,2,0,7);ctx.fill();
  }else if(/valve|actuator|cylinder|damper/.test(t)){
    ctx.beginPath();ctx.moveTo(-12,-8);ctx.lineTo(12,8);ctx.moveTo(-12,8);ctx.lineTo(12,-8);ctx.stroke();
  }else if(/tank|silo|reservoir|drum/.test(t)){
    ctx.strokeRect(-14,-10,28,20);ctx.beginPath();ctx.moveTo(-14,-4);ctx.lineTo(14,-4);ctx.stroke();
  }else if(/sensor|transmitter|transducer|probe/.test(t)){
    ctx.beginPath();ctx.arc(0,-2,3,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(0,1);ctx.lineTo(0,14);ctx.stroke();ctx.beginPath();ctx.moveTo(-6,14);ctx.lineTo(6,14);ctx.stroke();
  }else if(/transformer|reactor|inductor/.test(t)){
    for(let i=-1;i<=1;i++){ctx.beginPath();for(let a=0;a<6.3;a+=.3){const x=i*10+Math.cos(a)*4,y=-10+Math.sin(a)*4;if(a===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
  }else if(/capacitor/.test(t)){
    ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-4,0);ctx.moveTo(4,0);ctx.lineTo(10,0);ctx.stroke();ctx.beginPath();ctx.moveTo(-4,-8);ctx.lineTo(-4,8);ctx.moveTo(4,-8);ctx.lineTo(4,8);ctx.stroke();
  }else{
    /* generic IEC box */
    ctx.strokeRect(-13,-9,26,18);
  }
  ctx.restore();
}
function symDraw(c){
  const d=DEFS[c.type]||{w:60,h:40};
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot*Math.PI/2);
  /* IEC outline: terminals as stubs + small squares */
  ctx.strokeStyle='#8fb3c9';ctx.fillStyle='#0d1b2a';ctx.lineWidth=1;
  ctx.fillRect(-d.w/2-6,-d.h/2-6,d.w+12,d.h+12);ctx.strokeRect(-d.w/2-6,-d.h/2-6,d.w+12,d.h+12);
  for(const t of(d.term||[])){
    const x=t[1],y=t[2]; /* terminal local coords: [name,x,y,dx,dy] */
    ctx.fillStyle='#ffd166';ctx.fillRect(x-2,y-2,4,4);
    ctx.strokeStyle='#5a7a90';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(t[3]||0)*10,y+(t[4]||0)*10);ctx.stroke();
  }
  glyph(c,d);
  ctx.fillStyle='#e8eef5';ctx.font='600 9px Inter';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillText(d.tag||c.type,0,d.h/2+8);
  ctx.restore();
}
const _dc=drawComp;
drawComp=function(c){if(!sym){_dc(c);return;}try{symDraw(c);}catch(e){_dc(c);}};
/* toolbar toggle */
(function(){const b=$('bWnum');if(!b){const tb=document.querySelector('.tb');if(!tb)return;const nb=document.createElement('button');nb.id='bSym';nb.textContent='Sym';nb.title='Toggle IEC schematic symbols';tb.appendChild(nb);b=nb;}
  b.id='bSym';b.textContent='Sym';b.title='Toggle IEC schematic symbols';
  b.onclick=()=>{sym=!sym;b.classList.toggle('on',sym);b.textContent=sym?'Real':'Sym';log(sym?'IEC schematic symbol mode':'Realistic graphics mode');};})();
log('v32 module ready — IEC schematic symbol mode toggle.');
})();
