
/* ── v4: realistic redraw of turbines, boilers, gas, steam, plumbing, HV and protection gear ── */
(function(){
const mc=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const ST=(b,f)=>[[0,mc(b,'#ffffff',.65)],[.22,mc(b,'#ffffff',.22)],[.55,b],[1,mc(b,'#000000',.7)]];
const tn=(y0,y1,b)=>GR(0,y0,0,y1,ST(b)),vt=(x0,x1,b)=>GR(x0,0,x1,0,ST(b));
const INK='rgba(0,0,0,.72)',sp=()=>sim.running?sim.speed:0;
const A=()=>window.ANIM||0;
function edge(){ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.stroke();}
function cyl(x,y,w,h,b,r){const R=r==null?Math.min(w,h)/2.5:r;shadow(()=>{rr(x,y,w,h,R);ctx.fillStyle=tn(y,y+h,b);ctx.fill();});rr(x,y,w,h,R);edge();rr(x+R*.6,y+h*.12,Math.max(1,w-R*1.2),Math.max(1.5,h*.07),2);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fill();}
function cylv(x,y,w,h,b,r){const R=r==null?Math.min(w,h)/2.5:r;shadow(()=>{rr(x,y,w,h,R);ctx.fillStyle=vt(x,x+w,b);ctx.fill();});rr(x,y,w,h,R);edge();rr(x+w*.14,y+R*.6,Math.max(1.5,w*.07),Math.max(1,h-R*1.2),2);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fill();}
function poly(P,fill){ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();edge();}
function mg(x,y,r,v,mx,col){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,r+2,0,7);ctx.fillStyle=GR(-r,-r,r,r,[[0,'#e8eef4'],[1,'#566577']]);ctx.fill();ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fillStyle='#f3f1e8';ctx.fill();
  for(let i=0;i<=8;i++){const b=Math.PI*.75+Math.PI*1.5*i/8;line([[Math.cos(b)*r*.7,Math.sin(b)*r*.7],[Math.cos(b)*r*.92,Math.sin(b)*r*.92]],'#222',.8);}
  const a=Math.PI*.75+Math.PI*1.5*Math.max(0,Math.min(1,(v||0)/mx));line([[0,0],[Math.cos(a)*r*.85,Math.sin(a)*r*.85]],col||'#c0392b',1.4);ctx.restore();}
function flm(x,y,s,rot){const t=A()*11;ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);glow(0,-14*s,42*s,'rgba(255,150,40,.5)');
  [['rgba(255,80,20,.92)',1],['#ffa726',.7],['#fff1a8',.4]].forEach((q,i)=>{const w=9*s*q[1],h=(34+Math.sin(t+i*2)*5)*s*q[1];ctx.beginPath();ctx.moveTo(-w,0);ctx.bezierCurveTo(-w*1.3,-h*.4,-w*.3+Math.sin(t*1.3+i)*3*s,-h*.75,Math.sin(t*.9)*2*s,-h);ctx.bezierCurveTo(w*.3+Math.sin(t+i)*3*s,-h*.7,w*1.3,-h*.4,w,0);ctx.closePath();ctx.fillStyle=q[0];ctx.fill();});ctx.restore();}
function puff(x,y,n,col,rise,s){for(let i=0;i<n;i++){const t=((A()*(s||.5)+i/n)%1);ctx.globalAlpha=.4*(1-t);ctx.fillStyle=col;ctx.beginPath();ctx.arc(x+Math.sin(t*7+i*2)*5+t*8,y-t*rise,3+t*9,0,7);ctx.fill();}ctx.globalAlpha=1;}
function water(x,y,w,h,pct,col){const hh=h*Math.max(0,Math.min(1,pct/100)),top=y+h-hh;ctx.save();rr(x,y,w,h,3);ctx.clip();ctx.beginPath();ctx.moveTo(x,y+h);for(let i=0;i<=w;i+=3)ctx.lineTo(x+i,top+Math.sin(A()*3+i*.25)*1.3);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fillStyle=GR(0,top,0,y+h,[[0,mc(col,'#ffffff',.35)],[1,mc(col,'#000000',.45)]]);ctx.fill();ctx.restore();}
function bub(x,y,w,h,n){ctx.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<n;i++){const t=((A()*.5+i/n)%1);ctx.beginPath();ctx.arc(x+(i*37%w),y+h-t*h,1+i%2*.6,0,7);ctx.fill();}}
function spinA(c,on,rate){c._w=(c._w||0)+((on?1:0)-(c._w||0))*Math.min(1,fdt*1.6);c.ang=(c.ang||0)+c._w*rate*fdt*sp();return c.ang;}
const fcol=n=>/STEAM/.test(n)?'#dfe6ee':/GAS|FUEL|LPG/.test(n)?'#e0a21a':/AIR/.test(n)?'#9fc4dd':/FLUE|EXHAUST|HEAT|FLAME/.test(n)?'#b8442b':/WATER|COND|RETURN/.test(n)?'#2a8bd0':'#8fa3b7';
const fk=c=>{const k=DEFS[c.type].cat;return/Steam/.test(k)?'#9fb0c4':/Gas/.test(k)?'#c98a12':'#1b78bd';};
const fl=(c,t)=>!!(sim.hu&&sim.hflow.has(sim.hu.find(key(c.id,t))))||!!(window.PF&&window.PF(c.id,t));
const anyFl=c=>DEFS[c.type].term.some(t=>t[5]==='h'&&fl(c,t[0]));
function nozzles(c){for(const t of DEFS[c.type].term){if(t[5]!=='h')continue;const x=t[1],y=t[2],hz=Math.abs(x)>=Math.abs(y),s=hz?(x<0?0:Math.PI):(y<0?Math.PI/2:-Math.PI/2);
  ctx.save();ctx.translate(x,y);ctx.rotate(s);ctx.fillStyle=tn(-5,5,'#8497ab');ctx.fillRect(0,-4.5,16,9);ctx.fillStyle=fcol(t[0]);ctx.fillRect(9,-4.6,3,9.2);
  ctx.fillStyle=GR(0,-8,0,8,[[0,'#e6edf4'],[.5,'#7d90a4'],[1,'#33414f']]);ctx.fillRect(-2.5,-8,5,16);ctx.fillStyle='#222';ctx.fillRect(-1,-6.5,2,2);ctx.fillRect(-1,4.5,2,2);
  if(fl(c,t[0])){ctx.globalAlpha=.55;ctx.fillStyle=fcol(t[0]);ctx.fillRect(2.5,-2.5,13,5);ctx.globalAlpha=1;}ctx.restore();}}
function pseg(P,col,w){ctx.lineCap='butt';ctx.lineJoin='round';for(const q of [['#06101c',w+3],['#56697f',w+1.5],['#a3b6c8',w-1],[col||'#152538',w-3.5]]){ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=q[0];ctx.lineWidth=q[1];ctx.stroke();}}
function lab(c,t,b,col){const d=DEFS[c.type];if(t)txt(c,t,0,-d.h/2-6,COL.text,9,'center',700);if(b)txt(c,b,0,d.h/2+10,col||COL.mut,9,'center',800);}
function wheel(x,y,r,a,col,flat){ctx.save();ctx.translate(x,y);if(flat)ctx.scale(1,.28);ctx.rotate(a);ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.strokeStyle=mc(col,'#000000',.4);ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=2.4;ctx.stroke();
  for(let i=0;i<3;i++){ctx.rotate(Math.PI/3);line([[-r,0],[r,0]],col,2);}ctx.beginPath();ctx.arc(0,0,2.4,0,7);ctx.fillStyle='#ddd';ctx.fill();ctx.restore();}
const X={};
/* ---------- turbines ---------- */
X.turb=function(c,gas){const on=c.on&&(c._spool||0)>.02,w=spinA(c,on,16);
  ctx.fillStyle='#202a36';rr(-80,42,160,10,3);ctx.fill();ctx.fillStyle='#46566a';ctx.fillRect(-70,38,140,5);
  if(gas){pseg([[-70,-40],[-40,-40],[-40,-24]],on?'#c98a12':null,9);pseg([[-70,-20],[-56,-20],[-56,-14]],null,8);}else{pseg([[-70,-40],[-34,-40],[-34,-26]],on?'#cdd6df':null,9);pseg([[-70,-20],[-56,-20]],null,8);}
  pseg([[70,-40],[22,-40]],on?(gas?'#8a3a1c':'#cdd6df'):null,9);
  ctx.fillStyle=tn(-3,3,'#a3b0bd');ctx.fillRect(-78,-3,160,6);ctx.save();ctx.setLineDash([4,6]);ctx.lineDashOffset=-w*6;line([[-78,0],[82,0]],'rgba(0,0,0,.35)',5);ctx.restore();
  const P=gas?[[-68,-18],[-10,-26],[18,-36],[18,36],[-10,26],[-68,18]]:[[-68,-16],[-20,-24],[18,-42],[18,42],[-20,24],[-68,16]];
  shadow(()=>poly(P,tn(-42,42,gas?'#94703f':'#6d8499')));
  rr(-52,-15,64,30,4);ctx.fillStyle='#0a121c';ctx.fill();edge();
  if(on){rr(-52,-15,64,30,4);ctx.fillStyle=GR(-52,0,12,0,[[0,gas?'rgba(255,170,60,.5)':'rgba(190,225,255,.4)'],[1,'rgba(255,255,255,.05)']]);ctx.fill();}
  for(let r=0;r<6;r++){const x=-47+r*10.5,L=Math.min(13,6+r*(gas?1.2:1.5));if(on){ctx.fillStyle='rgba(220,230,240,.16)';ctx.fillRect(x-1.2,-L,2.4,2*L);}
    for(let k=0;k<7;k++){const y=Math.sin(w+k*Math.PI/7+r*.6)*L;ctx.fillStyle=on?'#e7eef5':'#8795a5';ctx.fillRect(x-1.2,y-2,2.4,4);}}
  ctx.fillStyle='#3a4655';ctx.fillRect(-52,-17,64,3);ctx.fillRect(-52,14,64,3);
  cyl(22,-26,52,52,'#2c6a58',11);for(let i=0;i<7;i++)line([[28+i*6,-22],[28+i*6,22]],'rgba(0,0,0,.22)',1);
  rr(56,-20,24,62,4);ctx.fillStyle='#1b2430';ctx.fill();edge();[['#ff9f1c',-10],['#4da6ff',10],['#2ec4b6',30]].forEach(q=>{ctx.beginPath();ctx.arc(70,q[1],4,0,7);ctx.fillStyle=q[0];ctx.fill();});
  led(-60,44,'#06d6a0',on);
  if(on){puff(70,-44,4,gas?'#ff9a55':'#ffffff',26,.8);glow(0,0,70,gas?'rgba(255,140,40,.12)':'rgba(120,200,255,.1)');}
  lab(c,c.label,c._gen?`${c.mw} MW · ${c.rpm} RPM`:c.on?(c._ready?`SPOOLING ${Math.round((c._spool||0)*100)}%`:(c._why||'STARTING')):'STOPPED',c._gen?COL.ok:c.on?COL.warn:COL.mut);};
/* ---------- fired equipment: boiler, steam generator, furnace, combustion chamber ---------- */
X.fired=function(c,k){const d=DEFS[c.type],W=d.w-16,H=d.h-18,x=-W/2,y=-H/2+4,on=c.on,T=c.temperature||c.flameTemp||800,hot=on?Math.min(1,T/1300):0,wet=k==='boiler'||k==='steamgen',brick=!wet;
  if(wet){ctx.fillStyle='#24303d';rr(x-4,y+H-2,W+8,8,3);ctx.fill();}
  shadow(()=>{rr(x,y,W,H,12);ctx.fillStyle=tn(y,y+H,brick?'#8a4a33':(k==='boiler'?'#7f93a6':'#7b88b0'));ctx.fill();});rr(x,y,W,H,12);edge();
  if(wet)for(let i=1;i<5;i++)line([[x+i*W/5,y+2],[x+i*W/5,y+H-2]],'rgba(0,0,0,.28)',2.4);
  const ix=x+10,iy=y+10,iw=W-20,ih=H-20;rr(ix,iy,iw,ih,7);ctx.fillStyle='#0b121b';ctx.fill();
  if(on){rr(ix,iy,iw,ih,7);ctx.fillStyle=GR(ix,0,ix+iw,0,[[0,`rgba(255,190,80,${.3+hot*.5})`],[1,'rgba(150,25,0,.5)']]);ctx.fill();}
  if(brick){ctx.save();rr(ix,iy,iw,ih,7);ctx.clip();for(let r=0;r<ih/8;r++){line([[ix,iy+r*8],[ix+iw,iy+r*8]],'rgba(0,0,0,.28)',.8);for(let j=0;j<iw/16;j++){const bx=ix+j*16+(r%2)*8;line([[bx,iy+r*8],[bx,iy+r*8+8]],'rgba(0,0,0,.25)',.8);}}ctx.restore();}
  if(wet){water(ix+2,iy+ih*.3,iw-4,ih*.68,c.waterLevel==null?65:c.waterLevel,'#2a8bd0');if(on)bub(ix+4,iy+ih*.3,iw-8,ih*.66,9);
    for(let i=0;i<3;i++){const ty=iy+ih*.45+i*ih*.17;rr(ix+4,ty-3,iw-8,6,3);ctx.fillStyle=on?GR(0,ty-3,0,ty+3,[[0,'#ffd27a'],[1,'#e8501c']]):'#46515f';ctx.fill();edge();if(on)flm(ix+10,ty,.42,Math.PI/2);}}
  else if(on){flm(ix+14,iy+ih*.7,.9);flm(ix+iw*.5,iy+ih*.78,.7);flm(ix+iw-16,iy+ih*.72,.8);glow(x+W/2,y+H/2,W*.5,`rgba(255,130,30,${.15+hot*.2})`);}
  const gx=x+W-18;ctx.fillStyle=tn(y-18,y,'#8b99a8');ctx.fillRect(gx,y-16,12,18);if(on)puff(gx+6,y-16,5,'#9aa6b2',44,.45);
  if(k!=='chamber')mg(x+20,y-6,9,c.pressure,k==='furnace'?10:200);
  const col=on?COL.warn:COL.mut;lab(c,c.label,k==='furnace'?`${Math.round(c.temperature||0)}°C`:`${c.pressure||0} bar · ${Math.round(c.temperature||0)}°C`,col);};
/* ---------- heat exchangers ---------- */
X.hx=function(c,k){const d=DEFS[c.type],W=d.w-30,H=d.h-26,x=-W/2,y=-H/2,hotc=k==='econ'?'#2a8bd0':'#e8501c';
  shadow(()=>{rr(x,y,W,H,6);ctx.fillStyle=tn(y,y+H,'#6e5a52');ctx.fill();});rr(x,y,W,H,6);edge();
  rr(x+5,y+5,W-10,H-10,4);ctx.fillStyle='#0d141c';ctx.fill();
  for(let i=0;i<4;i++){const gy=y+9+i*(H-18)/3.4;ctx.fillStyle=`rgba(255,120,40,${.07+.05*Math.sin(A()*3+i)})`;ctx.fillRect(x+7,gy-3,W-14,6);}
  const ys=[];for(let i=0;i<4;i++)ys.push(y+12+i*(H-24)/3);
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-6,ys[0]);ys.forEach((yy,i)=>{const L=i%2?x+10:x+W-10,R=i%2?x+W-10:x+10;ctx.lineTo(i%2?x+W-10:x+10,yy);ctx.lineTo(i%2?x+10:x+W-10,yy);if(i<3)ctx.lineTo(i%2?x+10:x+W-10,ys[i+1]);});
  ctx.strokeStyle='#05080c';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#9aa9b8';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=anyFl(c)?hotc:'#34404f';ctx.lineWidth=3;ctx.stroke();
  if(anyFl(c)){ctx.setLineDash([3,10]);ctx.lineDashOffset=-A()*40;ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.6;ctx.stroke();}ctx.restore();
  for(let i=0;i<4;i++)for(let j=0;j<9;j++)line([[x+14+j*(W-28)/8,ys[i]-4],[x+14+j*(W-28)/8,ys[i]+4]],'rgba(200,210,220,.35)',.8);
  ctx.fillStyle='rgba(255,140,60,.75)';for(let i=0;i<3;i++){const t=((A()*.7+i/3)%1);ctx.beginPath();ctx.moveTo(x+8+t*(W-30),y+H-7);ctx.lineTo(x+8+t*(W-30)+8,y+H-4.5);ctx.lineTo(x+8+t*(W-30),y+H-2);ctx.fill();}
  lab(c,c.label,c.temperature?`${c.temperature.toFixed(0)}°C`:`${(c.efficiency*100).toFixed(0)}% eff`,COL.mut);};
/* ---------- vessels ---------- */
X.vess=function(c,o){const d=DEFS[c.type],W=o.w||d.w-22,H=o.h||d.h-26,x=-W/2,y=-H/2;
  if(o.sad){ctx.fillStyle='#2a3542';ctx.fillRect(x+W*.18,y+H-2,14,9);ctx.fillRect(x+W*.68,y+H-2,14,9);}
  if(o.dome)cylv(-14,y-14,28,22,o.col,8);
  o.v?cylv(x,y,W,H,o.col,Math.min(W,H)*.4):cyl(x,y,W,H,o.col,H*.42);
  for(const f of [.28,.5,.72])o.v?line([[x+1,y+H*f],[x+W-1,y+H*f]],'rgba(0,0,0,.28)',1.2):line([[x+W*f,y+1],[x+W*f,y+H-1]],'rgba(0,0,0,.28)',1.2);
  if(o.lvl!=null){const sx=o.v?x+W-12:-5,sy=o.v?y+10:y+5,sw=10,sh=o.v?H-20:H-10;rr(sx,sy,sw,sh,3);ctx.fillStyle='#0b1a26';ctx.fill();water(sx+1,sy+1,sw-2,sh-2,o.lvl,o.fluid||'#2a8bd0');rr(sx,sy,sw,sh,3);ctx.strokeStyle='#cfe3f2';ctx.lineWidth=1.4;ctx.stroke();}
  if(o.txt)txt(c,o.txt,0,o.v?-H*.1:0,'rgba(255,255,255,.85)',9,'center',800);
  if(o.g)mg(o.gx==null?x+16:o.gx,o.gy==null?y-5:o.gy,8,c.pressure||0,o.g);
  lab(c,c.label,o.bot,o.botc);};
X.sphere=function(c){const R=48,on=c.level>0;ctx.fillStyle='#2a3542';[-34,0,34].forEach(l=>{ctx.fillRect(l-3,36,6,34);});ctx.fillStyle='#46566a';ctx.fillRect(-48,68,96,5);
  shadow(()=>{ctx.beginPath();ctx.arc(0,-4,R,0,7);ctx.fillStyle=GR(-34,-40,30,40,[[0,'#ffffff'],[.3,'#c3ced9'],[.7,'#6d8095'],[1,'#222d3a']]);ctx.fill();});ctx.beginPath();ctx.arc(0,-4,R,0,7);edge();
  ctx.save();ctx.beginPath();ctx.arc(0,-4,R,0,7);ctx.clip();ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(-R,-8,2*R,8);ctx.restore();
  const lv=Math.max(0,Math.min(1,c.level/100));rr(-5,-40,10,72,4);ctx.fillStyle='#08131c';ctx.fill();ctx.fillStyle=lv>.2?'#e0a21a':'#ef476f';ctx.fillRect(-4,32-70*lv,8,70*lv);rr(-5,-40,10,72,4);ctx.strokeStyle='#cfe3f2';ctx.lineWidth=1.3;ctx.stroke();
  mg(30,-30,8,c.pressure,40);txt(c,'GAS',0,22,'rgba(20,30,40,.75)',9,'center',800);lab(c,c.label,`${c.level.toFixed(0)}% · ${c.pressure} bar`,COL.mut);};
X.tower=function(c){const on=c.fanSpeed>0||c.capacity>0,w=spinA(c,on,14);ctx.fillStyle='#244a66';rr(-56,48,112,12,3);ctx.fill();water(-52,50,104,8,70,'#2a8bd0');
  poly([[-54,48],[-44,-34],[44,-34],[54,48]],GR(-54,0,54,0,[[0,'#6c7e90'],[.5,'#a9b8c6'],[1,'#566779']]));
  for(let i=0;i<9;i++)line([[-50+i*1.5-.5,-28+i*8.4],[50-i*1.5+.5,-28+i*8.4]],'rgba(0,0,0,.35)',1.6);
  cylv(-24,-52,48,20,'#8697a8',6);ctx.save();ctx.translate(0,-42);ctx.scale(1,.32);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.ellipse(10,0,16,4.5,w,0,7);ctx.fillStyle='rgba(235,242,248,.85)';ctx.fill();}ctx.restore();
  if(on)puff(0,-52,6,'#ffffff',54,.5);lab(c,c.label,`fan ${c.fanSpeed.toFixed(0)}% · cap ${c.capacity}%`,COL.mut);};
X.condenser=function(c){const x=-42,y=-30,W=84,H=56;cyl(x,y,W,H,'#7f93a6',10);rr(x+8,y+7,W-16,H-24,3);ctx.fillStyle='#0b121b';ctx.fill();
  for(let i=0;i<6;i++){const ty=y+11+i*5.6;rr(x+10,ty,W-20,3.6,1.8);ctx.fillStyle=anyFl(c)?'#2a8bd0':'#58687a';ctx.fill();}
  water(x+8,y+H-17,W-16,11,35,'#2a8bd0');cylv(x-8,y+6,10,H-12,'#2a6f9c',4);cylv(x+W-2,y+6,10,H-12,'#2a6f9c',4);
  if(anyFl(c)){ctx.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<4;i++){const t=((A()*.8+i/4)%1);ctx.beginPath();ctx.arc(x+14+i*16,y+12+t*(H-34),1.4,0,7);ctx.fill();}}
  lab(c,c.label,`${c.pressure} bar · ${c.temperature}°C`,COL.mut);};
/* ---------- rotating: feedwater pump, gas compressor ---------- */
X.pump=function(c,comp){const on=c.on,w=spinA(c,on,24),d=DEFS[c.type];ctx.fillStyle='#202a36';rr(-58,26,116,9,3);ctx.fill();
  cyl(-58,-12,52,36,comp?'#c0762a':'#2f6a95',9);for(let i=0;i<6;i++)line([[-52+i*7,-9],[-52+i*7,21]],'rgba(0,0,0,.22)',1);
  ctx.fillStyle='#394655';ctx.fillRect(-6,2,12,8);ctx.save();ctx.setLineDash([3,3]);ctx.lineDashOffset=-w*5;line([[-6,6],[6,6]],'#ff9f1c',8);ctx.restore();
  const cx=24,cy=6,R=comp?28:24;shadow(()=>{ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fillStyle=GR(cx-R,cy-R,cx+R,cy+R,[[0,'#e8eef4'],[.5,'#8497ab'],[1,'#2b3846']]);ctx.fill();});ctx.beginPath();ctx.arc(cx,cy,R,0,7);edge();
  ctx.beginPath();ctx.arc(cx,cy,R*.62,0,7);ctx.fillStyle='#0f1a26';ctx.fill();ctx.save();ctx.translate(cx,cy);ctx.rotate(w);for(let i=0;i<(comp?8:6);i++){ctx.rotate(Math.PI*2/(comp?8:6));ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(R*.3,-R*.2,R*.55,-R*.1);ctx.strokeStyle=on?'#dfe8f0':'#8190a0';ctx.lineWidth=2.4;ctx.stroke();}ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,3,0,7);ctx.fillStyle='#ddd';ctx.fill();
  pseg(comp?[[-60,-25],[-30,-25],[-30,-12]]:[[-50,-20],[-30,-20],[-30,-12]],anyFl(c)?fk(c):null,8);pseg(comp?[[60,-25],[cx,-25],[cx,cy-R]]:[[50,-20],[cx,-20],[cx,cy-R]],anyFl(c)?fk(c):null,8);
  led(-52,-17,'#06d6a0',on);if(comp)mg(-20,-26+6,8,c.pressure,40);lab(c,c.label,on?`${c.flow} m³/h · ${c.pressure} bar`:'STOPPED',on?COL.ok:COL.mut);};
/* ---------- valves ---------- */
X.vlv=function(c,k){const d=DEFS[c.type],cy=d.term[0][2],f=anyFl(c);const _tgt=c.open?(c.opening==null?1:Math.max(0,Math.min(1,(c.opening||0)/100))):0;c._o=c._o==null?_tgt:c._o+(_tgt-c._o)*Math.min(1,fdt*5);const o=c._o,fc=f?fk(c):null;ctx.save();ctx.translate(0,cy);
  const Lx=d.term[0][1]+4,Rx=d.term[1][1]-4;
  if(k==='trap'){pseg([[-25,0],[-6,0],[-6,10]],fc,8);pseg([[6,10],[6,0],[25,0]],fc,8);pseg([[6,28],[6,30],[25,30]],fc,8);cylv(-13,8,26,26,'#738496',9);cylv(-7,2,14,8,'#566a7e',3);line([[0,34],[0,40]],'#555',3);led(0,22,o>.5?'#06d6a0':'#2a3442',o>.5);ctx.restore();lab(c,c.label,`cond ${c.condensate.toFixed(0)}%`);return;}
  pseg([[Lx,0],[Rx,0]],fc,10);
  if(k==='gate'||k==='blow'||k==='globe'){const col=k==='blow'?'#a8392d':'#5d7388';if(k==='globe'){shadow(()=>{ctx.beginPath();ctx.arc(0,0,14,0,7);ctx.fillStyle=GR(-14,-14,14,14,ST(col).map(s=>s));ctx.fill();});ctx.beginPath();ctx.arc(0,0,14,0,7);edge();}else cylv(-13,-13,26,26,col,5);
    cylv(-6,-28,12,16,mc(col,'#000000',.2),3);line([[0,-28],[0,-34-o*8]],'#dfe6ec',2.4);wheel(0,-36-o*8,11,o*6,k==='blow'?'#e0a21a':'#c43d3d',true);if(k==='blow')pseg([[0,12],[0,26]],null,8);}
  else if(k==='ball'){shadow(()=>{ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.fillStyle=GR(-12,-12,12,12,[[0,'#f6e3a0'],[.4,'#c9a24a'],[1,'#4e3a10']]);ctx.fill();});ctx.beginPath();ctx.arc(0,0,12,0,7);edge();cylv(-3,-20,6,10,'#c9a24a',2);const a=(1-o)*Math.PI/2;line([[0,-18],[Math.cos(a)*24,-18-Math.sin(a)*14]],'#c43d3d',5);ctx.beginPath();ctx.arc(Math.cos(a)*24,-18-Math.sin(a)*14,3.5,0,7);ctx.fillStyle='#e8503a';ctx.fill();}
  else if(k==='fly'){ctx.fillStyle=tn(-16,16,'#66798d');ctx.fillRect(-5,-16,10,32);edge();ctx.fillStyle='#222';[-14,14].forEach(y=>[-8,8].forEach(x=>{ctx.beginPath();ctx.arc(x,y,1.8,0,7);ctx.fill();}));
    ctx.beginPath();ctx.ellipse(0,0,1+(1-o)*4.5,11,0,0,7);ctx.fillStyle=tn(-11,11,'#cfd8e1');ctx.fill();edge();cylv(-4,-26,8,12,'#566a7e',2);const a=(1-o)*Math.PI/2;line([[0,-24],[Math.cos(a)*22,-24-Math.sin(a)*12]],'#2a8bd0',5);}
  else if(k==='gasv'){cylv(-13,-13,26,26,'#d9a521',5);cylv(-9,-32,18,20,'#1c2530',5);led(0,-22,o>.5?'#06d6a0':'#ef476f',true);txt(c,'SOL',0,-35,'#cfd8e1',6,'center',700);}
  ctx.restore();lab(c,c.label,c.open?(o>.96?'OPEN':Math.round(o*100)+'% OPEN'):'CLOSED',c.open?COL.ok:COL.bad);};
X.reg=function(c){const f=anyFl(c),y0=-20;ctx.save();ctx.translate(0,y0);pseg([[-35,0],[35,0]],f?fk(c):null,10);cylv(-13,-12,26,26,'#b08a2a',5);cylv(-9,-30,18,18,'#3b4a5b',4);
  ctx.beginPath();ctx.moveTo(-22,-30);ctx.quadraticCurveTo(0,-52,22,-30);ctx.closePath();ctx.fillStyle=tn(-52,-30,'#2f7d4d');ctx.fill();edge();ctx.save();ctx.setLineDash([2,2]);line([[0,-34],[0,-18]],'#ddd',2);ctx.restore();ctx.restore();lab(c,c.label,`${c.output} bar`,COL.mut);};
X.gfilt=function(c){const f=anyFl(c);ctx.save();ctx.translate(0,-20);pseg([[-35,0],[35,0]],f?fk(c):null,10);cylv(-14,-13,28,16,'#b08a2a',5);cylv(-10,2,20,36,'#c9a24a',6);for(let i=0;i<4;i++)line([[-9,10+i*7],[9,10+i*7]],'rgba(0,0,0,.25)',1);ctx.fillStyle='#444';ctx.fillRect(-4,38,8,5);mg(0,-22,7,c.clogged?9:2,10);led(18,10,c.clogged?'#ef476f':'#06d6a0',true);ctx.restore();lab(c,c.label,c.clogged?'CLOGGED':'CLEAR',c.clogged?COL.bad:COL.ok);};
X.gmeter=function(c){const f=anyFl(c);ctx.save();ctx.translate(0,0);pseg([[-35,-20],[-16,-20],[-16,-10]],f?fk(c):null,9);pseg([[35,-20],[16,-20],[16,-10]],f?fk(c):null,9);
  cyl(-28,-12,56,46,'#3f6fa0',8);rr(-20,-4,40,16,3);ctx.fillStyle='#071a1f';ctx.fill();txt(c,String(Math.floor(c.total||0)).padStart(6,'0'),0,4,'#7df3d1',9,'center',800);txt(c,`${(c.flow||0).toFixed(0)} m³/h`,0,24,'#e8f0fa',7,'center',700);
  ctx.save();ctx.translate(0,16);ctx.beginPath();ctx.arc(-16,0,3,0,7);ctx.fillStyle='#ddd';ctx.fill();ctx.rotate(A()*(f?4:0));line([[-16,0],[-16,-3]],'#c0392b',1.2);ctx.restore();ctx.restore();lab(c,c.label,null);};
/* ---------- plumbing & fittings ---------- */
X.fit=function(c,k){const f=anyFl(c),fc=f?fk(c):null;
  if(k==='pipe'){shadow(()=>{rr(-46,-9,92,18,8);ctx.fillStyle=tn(-9,9,'#b9c4cf');ctx.fill();});rr(-46,-9,92,18,8);edge();for(let i=-3;i<=3;i++)line([[i*13,-9],[i*13,9]],'rgba(0,0,0,.25)',1.2);ctx.fillStyle=f?fk(c):'#c9d3dc';ctx.fillRect(-46,-1.5,6,3);const hp=(c.temperature||0)>300;if(hp)glow(0,0,30,'rgba(255,120,40,.12)');return;}
  if(k==='exp'){pseg([[-40,0],[40,0]],fc,10);const s=(c.expansion||0)/60;for(let i=0;i<8;i++){const x=-24+i*7*(1+s*.2);rr(x,-12,5,24,2.5);ctx.fillStyle=tn(-12,12,'#aebbc8');ctx.fill();edge();}return;}
  if(k==='flange'||k==='gasket'){pseg([[-25,0],[25,0]],fc,12);[-6,6].forEach(x=>{ctx.fillStyle=GR(x-4,0,x+4,0,[[0,'#d9e2ea'],[.5,'#7d90a4'],[1,'#2e3b49']]);ctx.fillRect(x-3.5,-19,7,38);edge();[-14,14].forEach(y=>{ctx.fillStyle='#222';ctx.fillRect(x-1,y-2,2,4);});});
    if(k==='gasket'){ctx.fillStyle=c.material==='PTFE'?'#f2f2ee':c.material==='Graphite'?'#222':'#8a5a2b';ctx.fillRect(-2,-19,4,38);}else{[-14,14].forEach(y=>line([[-9,y],[9,y]],'#cfd8e1',2.6));}return;}
  if(k==='supp'){ctx.fillStyle='#2a3542';ctx.fillRect(-22,34,44,8);ctx.fillStyle=tn(-8,8,'#6d8095');ctx.fillRect(-5,-14,10,50);ctx.fillRect(-14,-22,28,8);edge();
    if(c.type==='pipesupport'&&c.supportType==='spring'){ctx.strokeStyle='#c9a24a';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(0,0+i*7,10,2.5,0,0,7);ctx.stroke();}}
    pseg([[-26,-30],[26,-30]],f?fk(c):null,12);ctx.strokeStyle='#cfd8e1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-30,10,0,Math.PI);ctx.stroke();return;}
  if(k==='red'){poly([[-34,-14],[34,-8],[34,8],[-34,14]],tn(-14,14,'#8aa0b4'));for(let i=0;i<4;i++)line([[-34+i*17,-14+i*1.6],[-34+i*17,14-i*1.6]],'rgba(0,0,0,.2)',1);if(f){ctx.fillStyle='rgba(0,150,230,.35)';poly([[-30,-9],[30,-5],[30,5],[-30,9]],'rgba(70,160,220,.4)');}return;}
  if(k==='tee'){pseg([[-25,0],[6,0]],fc,10);pseg([[6,-20],[6,20]],fc,10);pseg([[6,-20],[25,-20]],fc,10);pseg([[6,20],[25,20]],fc,10);ctx.beginPath();ctx.arc(6,0,7,0,7);ctx.fillStyle=tn(-7,7,'#9fb0c0');ctx.fill();edge();return;}
  if(k==='e90'){pseg([[-25,0],[-8,0],[0,8],[0,25]],fc,10);return;}
  if(k==='e45'){pseg([[-25,0],[-4,0],[20,20]],fc,10);}};
/* ---------- sources & burners ---------- */
X.well=function(c){const on=c.on;ctx.fillStyle='#3a2f24';ctx.fillRect(-48,46,96,14);ctx.fillStyle='#6a5a48';ctx.fillRect(-36,40,72,8);
  cylv(-10,10,20,32,'#6d8095',4);cylv(-14,-8,28,18,'#8a2f2a',4);cylv(-9,-30,18,24,'#6d8095',4);wheel(0,-14,0,0,'#c43d3d',true);
  pseg([[0,0],[50,0]],on&&anyFl(c)?'#c98a12':null,9);cylv(18,-8,14,16,'#c43d3d',3);wheel(25,-14,9,A()*(on?1:0),'#e0a21a',true);mg(0,-42,8,c.pressure,100);
  for(const x of [-18,18])line([[x,-20],[x,-20]],'#fff',1);if(on){glow(0,-4,50,'rgba(255,200,60,.12)');puff(0,-50,3,'#d6dde4',18,.5);}lab(c,c.label,on?`${c.flow} m³/h`:'SHUT-IN',on?COL.ok:COL.mut);};
X.supply=function(c){const on=c.on;cyl(-34,-12,60,24,'#e0b21a',9);for(let i=0;i<4;i++)line([[-26+i*14,-12],[-26+i*14,12]],'rgba(0,0,0,.18)',1);pseg([[24,0],[40,0]],on&&anyFl(c)?'#c98a12':null,9);
  cylv(-18,-28,12,18,'#2a3542',3);mg(-12,-34,8,c.pressure,40);cylv(8,-26,12,16,'#c43d3d',3);txt(c,'NG',-4,0,'rgba(30,20,0,.8)',9,'center',800);if(on)glow(0,0,44,'rgba(255,210,70,.1)');lab(c,c.label,on?`${c.flow} m³/h`:'OFF',on?COL.warn:COL.mut);};
X.burner=function(c,pilot){const on=c.on;if(pilot){pseg([[-30,0],[0,0],[0,14]],null,8);cylv(-6,8,12,22,'#6d8095',3);if(on)flm(0,8,1.1);lab(c,c.label,on?`${c.temperature}°C`:'OFF',on?COL.warn:COL.mut);return;}
  cyl(-36,-26,36,52,'#3a4d63',12);ctx.save();ctx.translate(-18,0);ctx.rotate(A()*(on?9:0));for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);line([[3,0],[12,0]],'#cfd8e1',2);}ctx.restore();
  cyl(0,-12,36,24,'#9a6a2a',6);poly([[36,-14],[46,-9],[46,9],[36,14]],tn(-14,14,'#8a3a1c'));if(on){flm(46,0,1.5,Math.PI/2);}lab(c,c.label,on?`${c.flameTemp}°C`:'OFF',on?COL.warn:COL.mut);};
/* ---------- electrical: panels, HV gear ---------- */
function bush(x0,x1,y){const a=Math.min(x0,x1),w=Math.abs(x1-x0);rr(a,y-6,w,12,4);ctx.fillStyle=tn(y-6,y+6,'#9a5a38');ctx.fill();edge();for(let i=a+4;i<a+w-2;i+=5)line([[i,y-8],[i,y+8]],'rgba(60,25,10,.65)',2);ctx.beginPath();ctx.arc(x1,y,5,0,7);ctx.fillStyle=GR(x1-5,y-5,x1+5,y+5,[[0,'#f6e3a0'],[1,'#7a5a18']]);ctx.fill();}
X.panel=function(c,ttl,col,vals,leds,sub){const d=DEFS[c.type],W=d.w-26,H=d.h-8,x=-W/2,y=-H/2;shadow(()=>{rr(x,y,W,H,7);ctx.fillStyle=GR(x,y,x,y+H,[[0,'#d3dce5'],[.08,'#8a9bad'],[1,'#3a4859']]);ctx.fill();});rr(x,y,W,H,7);edge();[[x+5,y+5],[x+W-5,y+5],[x+5,y+H-5],[x+W-5,y+H-5]].forEach(p=>screw(p[0],p[1],2));
  rr(x+10,y+4,W-20,13,3);ctx.fillStyle=col;ctx.fill();txt(c,ttl,0,y+10.5,'#fff',7.5,'center',800);
  const lx=x+8,ly=y+22,lw=W-16,lh=Math.max(20,H*.4);rr(lx,ly,lw,lh,3);ctx.fillStyle='#04202a';ctx.fill();ctx.strokeStyle='#0e5666';ctx.lineWidth=1;ctx.stroke();
  if(vals&&vals.length){const n=vals.length,bw=(lw-10)/n;vals.forEach((v,i)=>{const bx=lx+5+i*bw+2,bh=lh-14,f=Math.max(0,Math.min(1,v[1]));ctx.fillStyle='rgba(120,230,255,.12)';ctx.fillRect(bx,ly+4,bw-6,bh);ctx.fillStyle=v[2]||'#7df3d1';ctx.fillRect(bx,ly+4+bh*(1-f),bw-6,bh*f);txt(c,v[0],bx+(bw-6)/2,ly+lh-5,'#9fe9ff',6,'center',700);});}
  else txt(c,sub||'',0,ly+lh/2,'#7df3d1',9,'center',800);
  (leds||[]).forEach((l,i,a)=>led(-((a.length-1)*8)/2+i*8+0,y+H-9,l[1],l[0]));};
X.sync=function(c){const R=36,a=(c.angle||0)*Math.PI/180;shadow(()=>{ctx.beginPath();ctx.arc(0,0,R+7,0,7);ctx.fillStyle=GR(-R,-R,R,R,[[0,'#e6edf4'],[.5,'#7b8da1'],[1,'#222d3a']]);ctx.fill();});ctx.beginPath();ctx.arc(0,0,R,0,7);ctx.fillStyle='#0b121b';ctx.fill();
  for(let i=0;i<36;i++){const b=i*Math.PI/18-Math.PI/2,m=i%9===0;line([[Math.cos(b)*(R-(m?10:5)),Math.sin(b)*(R-(m?10:5))],[Math.cos(b)*(R-2),Math.sin(b)*(R-2)]],m?'#e8f0fa':'#6c7f95',m?1.6:.8);}
  ctx.beginPath();ctx.arc(0,-R+5,3,0,7);ctx.fillStyle='#06d6a0';ctx.fill();ctx.save();ctx.rotate(a);glow(0,-R*.6,16,'rgba(255,176,32,.35)');poly([[-3,6],[0,-R+6],[3,6]],'#ffb020');ctx.restore();ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fillStyle='#ddd';ctx.fill();
  txt(c,'SYNC',0,14,'#7df3d1',7,'center',800);lab(c,c.label,`${(c.angle||0).toFixed(0)}° · ${(c.freqDiff||0).toFixed(2)} Hz`);};
X.bus=function(c){const cols=['#ff9f1c','#ef476f','#4da6ff','#4da6ff'];for(let i=0;i<4;i++){const x=-90+i*60;ctx.fillStyle=GR(0,-8,0,8,[[0,'#f2c58a'],[.4,'#c0772a'],[1,'#5c3510']]);if(i<3)ctx.fillRect(x-6,-6,66,12);ctx.fillStyle='#e9efe6';ctx.fillRect(x-4,6,8,10);ctx.fillStyle='#b9c3b3';ctx.fillRect(x-6,14,12,3);}
  ctx.fillStyle=GR(0,-6,0,6,[[0,'#f2c58a'],[.4,'#c0772a'],[1,'#5c3510']]);ctx.fillRect(-96,-6,192,12);edge();for(let i=0;i<4;i++){ctx.fillStyle=cols[i];ctx.beginPath();ctx.arc(-90+i*60,0,4,0,7);ctx.fill();}
  const v=c.current>0;if(v){ctx.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<8;i++){const t=((A()*.6+i/8)%1);ctx.fillRect(-96+t*192,-1,6,2);}}txt(c,`${(c.voltage/1000).toFixed(1)} kV`,0,-14,COL.text,9,'center',800);};
X.hvb=function(c){const cl=c.closed&&!c.tripped;[[-40,-25],[-40,25],[40,-25],[40,25]].forEach(p=>bush(p[0]<0?-18:18,p[0],p[1]));cyl(-22,-38,44,76,c.tripped?'#7a2b34':'#6d8095',9);rr(-14,-20,28,22,3);ctx.fillStyle='#0b121b';ctx.fill();ctx.fillStyle=cl?'#ef476f':'#06d6a0';ctx.fillRect(-10,-16,20,14);txt(c,cl?'I':'O',0,-9,'#fff',11,'center',900);
  mg(0,16,8,cl?c.rating*.4:0,c.rating);led(-12,30,'#ef476f',c.tripped);led(12,30,'#06d6a0',cl);lab(c,c.label,c.tripped?'TRIPPED':cl?'CLOSED':'OPEN',c.tripped?COL.bad:cl?COL.ok:COL.mut);};
X.trf=function(c){[[-60,-30],[-60,30],[60,-30],[60,30]].forEach(p=>bush(p[0]<0?-36:36,p[0],p[1]));cyl(-16,-52,32,14,'#7f93a6',5);ctx.fillStyle='#2a3542';ctx.fillRect(-4,-40,8,10);
  [-1,1].forEach(s=>{for(let i=0;i<5;i++){rr(s*(40+i*4.5)-2.2,-30,4.4,64,2);ctx.fillStyle=vt(s*(40+i*4.5)-2,s*(40+i*4.5)+2,'#7f93a6');ctx.fill();edge();}});
  cyl(-38,-34,76,70,'#4f6b86',8);for(let i=0;i<8;i++)line([[-34+i*9,-30],[-34+i*9,32]],'rgba(0,0,0,.2)',1);ctx.fillStyle='#d9e2ea';rr(-18,-8,36,18,2);ctx.fill();txt(c,`${c.mva} MVA`,0,1,'#223',7,'center',800);txt(c,`${c.priKv}/${c.secKv} kV`,0,8,'#334',6,'center',700);
  mg(0,22,6,c.mva*.6,c.mva);lab(c,c.label,null);};
X.rea=function(c){const cx=0,cy=0;ctx.fillStyle='#8c8c86';[[-34,52],[34,52],[-34,-56],[34,-56]].forEach(p=>ctx.fillRect(p[0]-5,p[1]-5,10,10));
  for(let i=12;i>=0;i--){const r=50-i*2.6;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.strokeStyle=i%2?'#a35f27':'#d9954a';ctx.lineWidth=2.6;ctx.stroke();}
  ctx.beginPath();ctx.arc(cx,cy,14,0,7);ctx.fillStyle='#0b121b';ctx.fill();ctx.save();ctx.beginPath();ctx.arc(cx,cy,52,0,7);ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1.4;ctx.setLineDash([60,300]);ctx.stroke();ctx.restore();
  pseg([[-50,-30],[-34,-30]],null,6);pseg([[-50,30],[-34,30]],null,6);if(c.mvar>0)glow(0,0,60,'rgba(120,180,255,.08)');lab(c,c.label,`${c.mvar} MVAr`);};
/* ---------- register ---------- */
const ok=(c,t)=>c[t]?'#06d6a0':'#2a3442';
const reg={
gasturbine:c=>X.turb(c,true),steamturbine:c=>X.turb(c,false),
boiler:c=>X.fired(c,'boiler'),steamgenerator:c=>X.fired(c,'steamgen'),furnace:c=>X.fired(c,'furnace'),combustionchamber:c=>X.fired(c,'chamber'),
economizer:c=>X.hx(c,'econ'),superheater:c=>X.hx(c,'sup'),reheater:c=>X.hx(c,'sup'),
condenser:X.condenser,coolingtower:X.tower,gastank:X.sphere,
lpgtank:c=>X.vess(c,{w:100,h:50,col:'#d8dee4',sad:1,lvl:c.level,fluid:'#e0a21a',g:12,gx:-30,gy:-30,txt:'LPG',bot:`${c.level.toFixed(0)}% · ${c.pressure} bar`}),
deaerator:c=>X.vess(c,{w:96,h:52,col:'#7f93a6',sad:1,dome:1,lvl:60,g:20,gx:-30,gy:-34,bot:`${c.temperature}°C`}),
feedwatertank:c=>X.vess(c,{w:96,h:56,col:'#6d8095',sad:1,lvl:c.level,g:0,bot:`${c.level.toFixed(0)}% · ${c.temperature}°C`}),
steamseparator:c=>X.vess(c,{v:1,w:50,h:80,col:'#8497ab',lvl:50,g:20,gx:-8,gy:-48,txt:'SEP',bot:`${(c.efficiency*100).toFixed(0)}%`}),
steamsource:c=>X.vess(c,{v:1,w:56,h:78,col:'#7f93a6',lvl:60,g:200,gx:-10,gy:-46,bot:`${c.pressure} bar · ${c.flow} t/h`,botc:c.on?COL.warn:COL.mut}),
lpsystem:c=>X.vess(c,{w:80,h:26,col:'#3f8f5f',g:20,gx:0,gy:-26,bot:`${c.pressure} bar`}),
hpsystem:c=>X.vess(c,{w:80,h:26,col:'#b5382b',g:200,gx:0,gy:-26,bot:`${c.pressure} bar`}),
feedwaterpump:c=>X.pump(c,false),gascompressor:c=>X.pump(c,true),
gatevalve:c=>X.vlv(c,'gate'),globevalve:c=>X.vlv(c,'globe'),ballvalve:c=>X.vlv(c,'ball'),butterflyvalve:c=>X.vlv(c,'fly'),gasvalve:c=>X.vlv(c,'gasv'),blowdown:c=>X.vlv(c,'blow'),steamtrap:c=>X.vlv(c,'trap'),
pressureregulator:X.reg,gasfilter:X.gfilt,gasmeter:X.gmeter,
steampipe:c=>X.fit(c,'pipe'),expansionjoint:c=>X.fit(c,'exp'),flange:c=>X.fit(c,'flange'),gasket:c=>X.fit(c,'gasket'),pipesupport:c=>X.fit(c,'supp'),reducer:c=>X.fit(c,'red'),teejoint:c=>X.fit(c,'tee'),elbow90:c=>X.fit(c,'e90'),elbow45:c=>X.fit(c,'e45'),
gaswell:X.well,naturalgas:X.supply,burner:c=>X.burner(c,false),flame:c=>X.burner(c,true),
governor:c=>X.panel(c,'GOVERNOR','#7a4bd0',[['OUT',c.output/100,'#ffb020'],['SPD',c.setpoint/3600,'#38bdf8']],[[1,'#06d6a0']]),
exciter:c=>X.panel(c,'EXCITER','#b5701c',[['V',c.voltage/400,'#ffb020'],['A',c.current/100,'#38bdf8']],[[c.voltage>0,'#06d6a0']]),
avr:c=>X.panel(c,'AVR','#2c7d66',[['EXC',c.excitation/100,'#ffb020'],['SET',c.setpoint/460,'#7df3d1']],[[c.mode==='auto','#06d6a0']]),
syncrelay:c=>X.panel(c,'SYNC RELAY','#a33a5a',null,[[c.voltageMatch,'#06d6a0'],[c.freqMatch,'#06d6a0'],[c.synced,'#ffd166']],c.synced?'SYNCED':'OPEN'),
differentialrelay:c=>X.panel(c,'87 DIFF','#b8402b',null,[[!c.tripped,'#06d6a0'],[c.tripped,'#ef476f']],c.tripped?'TRIP':`Id ${c.setting}`),
overcurrentrelay:c=>X.panel(c,'51 O/C','#b8402b',null,[[!c.tripped,'#06d6a0'],[c.tripped,'#ef476f']],c.tripped?'TRIP':`${c.setting}× · ${c.timeDelay}s`),
distanceprotection:c=>X.panel(c,'21 DISTANCE','#2c5fa8',[['Z1',c.zone1/3,'#06d6a0'],['Z2',c.zone2/3,'#ffd166'],['Z3',c.zone3/3,'#ef476f']],[[1,'#06d6a0']]),
generatorprotection:c=>X.panel(c,'GEN PROTECTION','#2c5fa8',null,[[1,'#06d6a0'],[1,'#06d6a0'],[1,'#ffd166'],[0,'#ef476f']],`${(c.functions||[]).length} FUNCTIONS`),
synchroscope:X.sync,busbar:X.bus,hvbreaker:X.hvb,transformerhv:X.trf,reactor:X.rea};
for(const k in reg){const f=reg[k];DRAW[k]=function(c){f(c);nozzles(c);};}
})();
