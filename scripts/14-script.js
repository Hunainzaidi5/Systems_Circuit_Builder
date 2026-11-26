
/* ── Series LiFePO4 / battery banks: followers mirror the top pack, plus a bank badge ── */
(function(){
  const _s=step;
  step=function(dt){
    const banks=packBankList().filter(b=>b.packs.length>1);
    const pre=new Map(banks.map(b=>[b.top.id,Number(b.top.soc)||0]));
    _s(dt);
    for(const b of packBankList()){
      if(b.packs.length<2)continue;
      const h=b.top,p0=pre.has(h.id)?pre.get(h.id):Number(h.soc)||0,d=(Number(h.soc)||0)-p0;
      const hAh=packAh(h);
      for(const m of b.packs){
        if(m===h)continue;
        if(d)m.soc=Math.max(0,Math.min(100,(Number(m.soc)||0)+d*hAh/Math.max(.1,packAh(m))));
        m.charging=h.charging;m.discharging=h.discharging;m._packI=h._packI;m._srcW=h._srcW;m._loadW=h._loadW;
        m.temperature=h.temperature;m.capacity=packAh(m);m.nomVoltage=packNomV(m);m.voltage=packV(m);
      }
      if(b.packs.some(x=>Number(x.soc)<=0)){for(const m of b.packs){m.discharging=false;}}
    }
    // Cross-wired packs (+ to − AND − to +) form a loop, not a series string.
    const ps=comps.filter(isPack),uf=buildUF(true),f=(c,t)=>uf.find(key(c.id,t));
    for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],b=ps[j];
      if(f(a,'OUT+')===f(b,'OUT-')&&f(a,'OUT-')===f(b,'OUT+')&&f(a,'OUT+')!==f(a,'OUT-')){
        if(Array.isArray(sim.alarms))sim.alarms.push(['bad',`${a.label} / ${b.label}: wired + to − AND − to + (loop). For series use ONE link only: ${a.label} OUT+ → ${b.label} OUT−, then load across ${b.label} OUT+ and ${a.label} OUT−`]);}}
  };
  for(const k of ['lfpbattery','battery']){
    const o=DRAW[k];if(!o)continue;
    DRAW[k]=function(c){o(c);const b=bankOf(c);
      if(b.packs.length>1){const i=b.packs.indexOf(c)+1;
        txt(c,`SERIES ${i}/${b.packs.length} · BANK ${bankV(c).toFixed(1)} V`,0,-DEFS[c.type].h/2-14,COL.warn,8,'center',800);}};
  }
})();
