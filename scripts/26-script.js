/* ══════════ v21 · buildUF RESULT CACHE ══════════
 * buildUF() is called many times per frame (evalCircuit, every breaker downAmps,
 * UPS input checks, …) with identical inputs. Cache the union-find by a signature of
 * the wires and every comp field that LINKS[type] functions actually read.
 * Fields are extracted at runtime from the function sources — exact, no guessing.
 * If any links function references external mutable state (comps/sim/wires/hu),
 * caching disables itself rather than risk stale topology. */
(function(){
'use strict';
/* fields read by link helper functions whose bodies aren't visible in LINKS sources */
const EXTRA=['on','pos','fault','up','type','_noLink','manualInput','position','contact','mode','prog','output','enabled','open','blown','sheared','running','alarm','pressed','powered','synced','closed','tripped','coilOn','bridge','manual','group','_y1','_contact','_pwSolver','_out','_bypass','_src','_q1','_q2','_active','_dead','_cmdOpen','_cmdClose','_olLatch','_shaftRun','_pos','_dir','_lb','_alm','out3','out4'];
let FLD=null,UNSAFE=false;
function fields(){
  if(FLD)return FLD;
  FLD=new Set(EXTRA);
  for(const k in LINKS){try{
    const s=Function.prototype.toString.call(LINKS[k]);
    if(/\b(comps|sim|wires|hu|hflow|st|gx)\b/.test(s)){UNSAFE=true;console.warn('buildUF cache disabled: LINKS.'+k+' reads external state: '+s.slice(0,120));}
    for(const m of s.matchAll(/\bc\.([A-Za-z_]\w*)/g))FLD.add(m[1]);
    for(const m of s.matchAll(/\bc\[['"]([A-Za-z0-9_]+)['"]\]/g))FLD.add(m[1]);
  }catch(e){UNSAFE=true;}}
  return FLD;
}
function sig(){
  const F=fields();let s='';
  for(const w of wires)s+=w.a.c+':'+w.a.t+'>'+w.b.c+':'+w.b.t+(w.broken?'x':'')+';';
  for(const c of comps){s+=c.id+','+c.type+':';for(const f of F){const v=c[f];s+=(v===undefined?'':typeof v==='object'?JSON.stringify(v):v)+'|';}}
  return s;
}
const _b=buildUF;const cache=new Map();
buildUF=function(skipATS){
  fields();
  if(UNSAFE)return _b(skipATS);
  const s=sig()+'|'+(skipATS?1:0);
  const hit=cache.get(s);if(hit)return hit;
  const uf=_b(skipATS);cache.set(s,uf);
  if(cache.size>24)cache.delete(cache.keys().next().value);
  return uf;
};
log('v21 module ready — buildUF memoised by wire+link-state signature ('+(FLD?FLD.size:0)+' fields).');
})();
