
(function(){
const $=s=>document.querySelector(s),ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
/* templates → one drop-down */
try{const ids=['bTpl','bTpl3','bTplCG','bTplHVAC','bTplIO','bTplGen'],btns=ids.map(i=>document.getElementById(i)).filter(Boolean);
  if(btns.length){const host=btns[0].parentElement,wrap=document.createElement('div');wrap.className='tplwrap';
    wrap.innerHTML='<button id="tplBtn" title="Load a ready-made example circuit">★ Templates ▾</button><div class="tplmenu"><div class="tplh">Example circuits</div></div>';
    host.classList.add('hasmenu');host.insertBefore(wrap,host.firstChild);const menu=wrap.querySelector('.tplmenu');btns.forEach(b=>menu.appendChild(b));
    wrap.querySelector('#tplBtn').addEventListener('click',e=>{e.stopPropagation();wrap.classList.toggle('open');});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target)||e.target.closest('.tplmenu button'))wrap.classList.remove('open');});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')wrap.classList.remove('open');});}}catch(e){console.warn('tpl menu',e);}
/* dockable side panels */
try{const hdr=$('header');if(hdr){const d=document.createElement('div');d.className='tb';d.innerHTML='<button class="ptog act" id="bPalT" title="Show / hide component library">◧</button><button class="ptog act" id="bSideT" title="Show / hide readout &amp; properties">◨</button>';hdr.appendChild(d);
  const fire=()=>{try{window.dispatchEvent(new Event('resize'));}catch(e){}};
  const apply=()=>{document.body.classList.toggle('nopal',ls.get('cl.nopal')==='1');document.body.classList.toggle('noside',ls.get('cl.noside')==='1');
    $('#bPalT').classList.toggle('act',!document.body.classList.contains('nopal'));$('#bSideT').classList.toggle('act',!document.body.classList.contains('noside'));setTimeout(fire,30);};
  $('#bPalT').onclick=()=>{ls.set('cl.nopal',document.body.classList.contains('nopal')?'0':'1');apply();};
  $('#bSideT').onclick=()=>{ls.set('cl.noside',document.body.classList.contains('noside')?'0':'1');apply();};apply();}}catch(e){console.warn('panel toggles',e);}
/* collapsible library categories with counts */
try{const pal=$('#componentGroups')||$('#palette');
  const wire=()=>{pal.querySelectorAll('.palette-group').forEach(g=>{const cat=g.querySelector(':scope>.cat');if(!cat||cat._w)return;cat._w=1;
    const n=g.querySelectorAll('.item').length;if(!cat.querySelector('.cnt')){const s=document.createElement('span');s.className='cnt';s.textContent=n;cat.appendChild(s);}
    const name=g.dataset.category||cat.textContent;if(ls.get('cl.cat.'+name)==='1')g.classList.add('collapsed');
    cat.addEventListener('click',e=>{g.classList.toggle('collapsed');ls.set('cl.cat.'+name,g.classList.contains('collapsed')?'1':'0');});
    cat.addEventListener('dblclick',e=>{const all=[...pal.querySelectorAll('.palette-group')],c=g.classList.contains('collapsed');all.forEach(x=>{if(x!==g)x.classList.toggle('collapsed',!c);});});});};
  wire();setTimeout(wire,800);setTimeout(wire,2800);new MutationObserver(()=>wire()).observe(pal,{childList:true});
  /* a search should always show matches, even inside collapsed groups */
  const q=$('#componentSearch');if(q)q.addEventListener('input',()=>{if(q.value.trim())pal.querySelectorAll('.palette-group.collapsed').forEach(g=>g.classList.add('searchopen'));else pal.querySelectorAll('.searchopen').forEach(g=>g.classList.remove('searchopen'));});
  const st=document.createElement('style');st.textContent='.palette-group.collapsed.searchopen>.grid2{display:grid}';document.head.appendChild(st);}catch(e){console.warn('palette',e);}
/* zoom / cursor HUD */
try{const main=$('#stage'),cvs=$('#cv');if(main&&cvs){const h=document.createElement('div');h.id='hud';h.innerHTML='<b id="hudZ">100%</b><i>|</i><span id="hudP">x 0 · y 0</span><i>|</i><span id="hudC"></span>';main.appendChild(h);
  let wp=null;cvs.addEventListener('mousemove',e=>{const r=cvs.getBoundingClientRect();try{wp=toWorld(e.clientX-r.left,e.clientY-r.top);}catch(x){}});cvs.addEventListener('mouseleave',()=>{wp=null;});
  setInterval(()=>{try{$('#hudZ').textContent=Math.round(view.z*100)+'%';$('#hudP').textContent=wp?`x ${Math.round(wp.x)} · y ${Math.round(wp.y)}`:'x – · y –';$('#hudC').textContent=`${comps.length} parts · ${wires.length} links`;}catch(e){}},300);}}catch(e){console.warn('hud',e);}
})();
