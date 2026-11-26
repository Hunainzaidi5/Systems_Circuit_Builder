/* ══════════ v31 · UX: TOUCH SUPPORT ══════════
 * (The guided tutorial / "Guide" side card that used to live here has been removed.) */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ── touch: canvas already handles mouse events which mobile browsers synthesize;
      touch-action:none prevents scroll/zoom gestures stealing drags on the board. ── */
const st=document.createElement('style');
st.textContent='#cv{touch-action:none;-webkit-user-select:none;user-select:none}#cv{cursor:crosshair}';
document.head.appendChild(st);
/* pinch-zoom via two-pointer tracking */
let pinch=null;
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){pinch=pinch||new Map();pinch.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch.size===2){const p=[...pinch.values()];pinch.d0=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);pinch.z0=view.z;}}});
cv.addEventListener('pointermove',e=>{if(pinch&&pinch.has(e.pointerId)){pinch.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch.size===2&&pinch.d0){const p=[...pinch.values()];const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);view.z=clamp(pinch.z0*d/pinch.d0,.2,4);}}});
const pinchEnd=e=>{if(pinch)pinch.delete(e.pointerId);if(pinch&&pinch.size<2)pinch=null;};
cv.addEventListener('pointerup',pinchEnd);cv.addEventListener('pointercancel',pinchEnd);

log('v31 module ready — touch/pinch-zoom.');
})();
