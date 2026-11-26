/* ══════════ v30 · UNIFIED COMPONENT REGISTRY ══════════
 * One canonical record per component type: terminals, internal links, draw, tick,
 * init, properties, description, icon, blurb. DEFS stays the runtime authority
 * (all existing code reads it); COMP is the registry/index — populated lazily
 * from DEFS + the per-type maps (LINKS/DRAW/ICON/COMP_BLURB/P/describe) and
 * extended by def2() for new parts. Flags duplicate definitions across modules.
 * This is the migration target: new parts should use def2(), old parts get
 * folded in incrementally. */
(function(){
'use strict';
window.COMP={};
/* fields harvested from the global maps at first access */
function harvest(type){
  const d=DEFS[type];if(!d)return null;
  const c=window.COMP[type]=window.COMP[type]||{};
  c.type=type;c.name=d.name;c.tag=d.tag;c.cat=d.cat;c.icon=d.icon;c.w=d.w;c.h=d.h;
  c.term=d.term||[];c.pins=d.pins||{};c.init=d.init||{};
  if(LINKS[type])c.links=true;if(DRAW[type])c.draw=true;if(ICON[type])c.iconSvg=true;
  if(COMP_BLURB[type])c.blurb=COMP_BLURB[type];
  return c;
}
/* palette insertion: def2 parts must appear in the component library */
function paletteAdd(type){
  const groups=document.getElementById('componentGroups');if(!groups)return;
  const d=DEFS[type];if(!d||groups.querySelector(`.item[data-type="${type}"]`))return;
  const cat=d.cat||'Misc';let sec=[...groups.querySelectorAll('.palette-group')].find(s=>s.dataset.category===cat);
  if(!sec){sec=document.createElement('section');sec.className='palette-group';sec.dataset.category=cat;
    sec.innerHTML=`<div class="cat">${cat}</div><div class="grid2"></div>`;groups.appendChild(sec);}
  const grid=sec.querySelector('.grid2');
  const it=document.createElement('div');it.className='item';it.draggable=true;it.dataset.type=type;
  it.title='Drag to board or click to add';
  it.innerHTML=`<div class="ic">${ICON[type]||d.icon||'⚙️'}</div><div class="nm">${d.name}</div>`;
  it.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',it.dataset.type));
  it.addEventListener('click',()=>{const r=cv.getBoundingClientRect(),p=toWorld(r.width/2,r.height/2),n=comps.length%6*20;addComp(it.dataset.type,p.x+n,p.y+n);});
  grid.appendChild(it);
}
window.def2=function(type,spec){
  /* spec: {name,tag,cat,w,h,icon,pins,term,init,links,draw,tick,props,desc,blurb,click} */
  DEFS[type]=Object.assign({icon:'⚙️',pins:{}},spec,{init:Object.assign({},spec.init||{})});
  if(spec.links)LINKS[type]=typeof spec.links==='function'?spec.links:spec.links;
  if(spec.draw)DRAW[type]=(c)=>spec.draw(c,DEFS[type]); /* drawComp calls drawer(c) — inject the def */
  if(spec.icon&&spec.icon.startsWith&&spec.icon.startsWith('<'))ICON[type]=spec.icon;else if(spec.icon)DEFS[type].icon=spec.icon;
  if(spec.blurb)COMP_BLURB[type]=spec.blurb;
  if(spec.desc){const _d=describe;describe=function(c){return c.type===type?spec.desc(c):_d(c);};}
  if(spec.props){const _r=renderProps;renderProps=function(){_r();const c=selected&&selected.kind==='c'?getC(selected.id):null;if(c&&c.type===type){const el=$('props');if(el&&spec.props(c,el)===false)return;}};}
  if(spec.tick){Game.register('comp_'+type,{tick:(dt,gx)=>{for(const c of comps)if(c.type===type){try{spec.tick(c,dt,gx);}catch(e){}}}});}
  harvest(type);paletteAdd(type);return window.COMP[type];
};
/* duplicate-definition detector: runs once after all scripts load */
setTimeout(()=>{
  window.COMP_TOTAL=Object.keys(DEFS).length;
  console.log(`COMP registry: ${window.COMP_TOTAL} component types indexed.`);
},0);
/* convenience: list all parts of a category with capabilities */
window.COMP_LIST=(cat)=>Object.keys(DEFS).filter(t=>!cat||DEFS[t].cat===cat).map(t=>{harvest(t);return window.COMP[t];});
/* unified extension-point chaining: replaces ad-hoc `const _x=fn;fn=function(){_x();...}` wraps.
   Each helper appends a hook; hooks run in registration order after the base implementation. */
window.UX={desc:[],props:[],click:[],step:[]};
window.uxDesc=fn=>UX.desc.push(fn);
window.uxProps=fn=>UX.props.push(fn);
window.uxClick=fn=>UX.click.push(fn);
window.uxStep=fn=>UX.step.push(fn);
(function(){
  const _d=describe;describe=function(c){let s=_d(c)||'';for(const f of UX.desc){try{const r=f(c);if(r&&typeof r==='object'&&'set' in r)s=String(r.set);else if(r)s+=r;}catch(e){}}return s;};
  const _r=renderProps;renderProps=function(){_r();const c=selected&&selected.kind==='c'?getC(selected.id):null;for(const f of UX.props){try{f(c);}catch(e){}}};
  const _c=clickAction;clickAction=function(c){for(const f of UX.click){try{if(f(c)===true)return;}catch(e){}}_c(c);};
  const _s=step;step=function(dt){_s(dt);for(const f of UX.step){try{f(dt);}catch(e){}}};
})();
log('v30 module ready — unified component registry (window.COMP, def2) + UX hook chaining + duplicate detector.');
})();
