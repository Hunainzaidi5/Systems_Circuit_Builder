/* ══════════ v23 · LEARNING: EXAMPLES GALLERY + CHALLENGE MODE ══════════ */
(function(){
'use strict';
const N=(v,d)=>{const n=Number(v);return Number.isFinite(n)?n:d;};

/* ── examples gallery removed: script 20 already consolidates all template
      buttons into the "★ Templates ▾" dropdown — this menu was a duplicate. ── */

/* ── challenge mode: live-checked objectives ── */
const CH=[
  {id:'power',title:'First light',desc:'Get any motor, lamp, heater or fan running under power.',
   chk:()=>comps.some(c=>c.powered&&['motor','acmotor','dcmotor','gearpump','lamp','heater','fan','ledstrip'].includes(c.type))},
  {id:'fill',title:'Fill it up',desc:'Raise any tank or silo to 50% level.',
   chk:()=>comps.some(c=>(c.type==='tank'||c.type==='silo')&&N(c.level,0)>=50)},
  {id:'band',title:'Hold 60–80%',desc:'Keep a tank level inside 60–80% for 10 continuous seconds (with the pump running).',
   prog:c=>{const t=comps.find(x=>(x.type==='tank'||x.type==='silo')&&N(x.level,0)>0);if(!t)return null;const lv=N(t.level,0),ok=lv>=60&&lv<=80;CH._bandT=ok?(CH._bandT||0)+0.5:0;return{t,lv,ok,hold:CH._bandT};},
   chk:()=>CH._bandT>=10},
  {id:'sync',title:'Synchronise',desc:'Close a Sync Relay (COM→NO) by matching generator V & f to the bus.',
   chk:()=>comps.some(c=>c.type==='syncrelay'&&c.synced)},
  {id:'protect',title:'Protection armed',desc:'Wire a protection relay TRIP terminal so it can clear a fault — place any 21/87/51 relay on the board.',
   chk:()=>comps.some(c=>['distanceprotection','differentialrelay','overcurrentrelay','generatorprotection'].includes(c.type))},
  {id:'loop',title:'Close the loop',desc:'Wire a transmitter MA+/MA− into an Analog Input channel reading OK.',
   chk:()=>comps.some(c=>c.type==='aimodule'&&(c._st1==='OK'||c._st2==='OK'))},
  {id:'steady',title:'Clean run',desc:'Run the sim for 60 s with zero alarms and no short circuit.',
   prog:()=>({t:sim.tHold=(sim.tHold||0)+0.5}),chk:()=>false}
];
const CHstate={done:new Set(),t:0};
(function(){
  const side=$('side')||document.querySelector('aside');if(!side)return;
  const card=document.createElement('div');card.className='card';
  card.innerHTML='<h2>Challenges</h2><div class="bd" id="chList"><div class="note">Evaluating…</div></div>';
  side.insertBefore(card,side.querySelector('.card:last-child')||null);
  setInterval(()=>{
    const el=$('chList');if(!el)return;
    CHstate.t+=0.5;
    let html='';
    for(const ch of CH){
      if(CHstate.done.has(ch.id))continue;
      let extra='';
      if(ch.prog){try{const r=ch.prog();if(r&&r.hold!==undefined)extra=` · hold ${Math.min(10,r.hold).toFixed(1)}s`;else if(r&&r.lv!==undefined)extra=` · ${r.lv.toFixed(0)}%`;else if(r&&r.t!==undefined)extra=` · ${Math.min(60,sim.tHold||0).toFixed(0)}s`;}catch(e){}}
      const ok=(()=>{try{return ch.chk();}catch(e){return false;}})();
      if(ok){CHstate.done.add(ch.id);html+=`<div class="note" style="color:#3df5b0">✓ ${ch.title} — ${ch.desc}</div>`;continue;}
      html+=`<div class="note" style="margin:5px 0"><b>${ch.title}</b> — ${ch.desc}${extra}</div>`;
    }
    if(!html)html='<div class="note" style="color:#3df5b0">All challenges complete — nice work!</div>';
    el.innerHTML=html;
    /* 'steady' needs clean-run tracking */
    if(!CHstate.done.has('steady')){
      const bad=(sim.alarms||[]).some(a=>a[0]==='bad')||sim.short;
      if(!bad)CHstate._clean=(CHstate._clean||0)+0.5;else CHstate._clean=0;
      if(CHstate._clean>=60){CHstate.done.add('steady');}
    }
  },500);
})();
log('v23 module ready — examples gallery + live challenge mode.');
})();
