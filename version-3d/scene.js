/* Self-contained interactive 3D auditorium. Pure Canvas 2D face rasterizer with 3D geometry,
   perspective camera / orbit rotation / seat picking, so it works without network access. */
(function(){
'use strict';
const d=window.CINEMA;
const canvas=document.getElementById('scene'),shell=document.getElementById('scene-shell');
const ctx=canvas.getContext('2d',{alpha:false});
let width=850,height=500,dpr=1,yaw=.52,elev=.47,dist=17.7,target=[0,1.18,-1.6];
let down=null,pixels=[],selected='C7',frames=[];
const clamp=(a,l,h)=>Math.min(h,Math.max(l,a));
function rgb(hex){let s=hex.replace('#','');return [parseInt(s.substring(0,2),16),parseInt(s.substring(2,4),16),parseInt(s.substring(4,6),16)];}
function tint(hex,mul,add=0){const c=rgb(hex);return 'rgb('+c.map(v=>clamp(Math.round(v*mul+add),0,255)).join(',')+')'}
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function norm(a){let l=Math.hypot(...a)||1;return a.map(v=>v/l)}
function camera(){
 const ce=Math.cos(elev),position=[target[0]+dist*ce*Math.sin(yaw),target[1]+dist*Math.sin(elev),target[2]+dist*ce*Math.cos(yaw)];
 const f=norm(sub(target,position)),r=norm(cross(f,[0,1,0])),u=norm(cross(r,f));
 return {position,f,r,u,focal:Math.min(width*1.04,height*1.37)};
}
let cam;
function project(pt){
 const v=sub(pt,cam.position),depth=dot(v,cam.f);
 if(depth<=.1)return null;
 const scale=cam.focal/depth;
 return {x:width*.5+dot(v,cam.r)*scale,y:height*.52-dot(v,cam.u)*scale,depth,scale};
}
function pushPolygon(verts,hex,light=1,alpha=1){
 const p=verts.map(project);if(p.some(v=>!v))return;
 frames.push({p,depth:p.reduce((s,v)=>s+v.depth,0)/p.length,color:tint(hex,light),alpha});
}
// Axis aligned box as real six-faced 3D geometry, with directional shading.
function cube(cx,cy,cz,sx,sy,sz,base,alpha=1){
 const x0=cx-sx/2,x1=cx+sx/2,y0=cy-sy/2,y1=cy+sy/2,z0=cz-sz/2,z1=cz+sz/2;
 const v=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
 const defs=[[[0,1,2,3],.6],[[4,7,6,5],.94],[[3,2,6,7],1.23],[[0,4,5,1],.54],[[0,3,7,4],.73],[[1,5,6,2],.85]];
 for(const [indices,light] of defs)pushPolygon(indices.map(i=>v[i]),base,light,alpha);
}
function buildGeometry(){
 frames=[];
 // Auditorium dimensions are artistically simplified from the actual seat map.
 // Screen at negative Z; every recliner faces negative Z.
 const floorLevels=[0,.46,.92,1.38];
 const rowZ=[-4.72,-2.35,.02,2.39];
 // Acoustic side walls; no solid room-sized box obscuring the seats.
 cube(-5.4,2.64,-.68,.16,5.45,15.4,'#202633',.90);
 cube( 5.4,2.64,-.68,.16,5.45,15.4,'#252b38',.90);
 // Projection screen with subtle bezel and vents.
 cube(0,2.26,-7.38,10.7,4.9,.23,'#141927');
 cube(0,2.74,-7.15,9.18,4.33,.18,'#05060e');
 cube(0,2.74,-7.028,8.88,4.04,.10,'#39394f');
 cube(0,2.74,-6.965,8.54,3.78,.06,'#81808f');
 cube(0,.05,-6.54,10.8,.38,.9,'#1f232f');
 for(let x of [-3.85,-2.25,2.25,3.85]) cube(x,.45,-6.88,1.3,.78,.18,'#0d111b');
 // Four tiered seating platforms, with visible risers and stairs on both side aisles.
 for(let ri=0;ri<4;ri++){
  const y=floorLevels[ri],z=rowZ[ri];
  cube(0,y-.20,z,10.57,.4,2.35,ri%2?'#272c3b':'#242939');
  // front edge of riser and muted stair lights
  cube(0,y-.08,z-1.16,10.42,.19,.12,'#384051');
  cube(0,y+.015,z-1.172,10.38,.024,.042,'#7b6689');
  for(let side of [-1,1]){
    const ax=side*4.94;
    cube(ax,y+.055,z,.44,.10,2.24,'#3a4050');
    if(ri>0){
      // A short stair between successive levels, descending toward the screen.
      const prev=floorLevels[ri-1];
      cube(ax,prev+.055,z-1.40,.47,.10,.42,'#3d4456');
      cube(ax,prev+.22,z-1.15,.47,.10,.38,'#41495b');
    }
  }
 }
 // Rear landing and open doorway: framed, not a wall that hides seats.
 cube(0,1.28,4.75,10.55,.30,2.34,'#292d3b');
 cube(0,1.88,5.52,10.5,.10,.13,'#5d6172');
 for(let x of [-5.08,-3.2,-1.32,.55,2.42,4.78])cube(x,1.63,5.52,.08,.68,.10,'#535b6e');
 // Entrance on rear-left: dark opening with lit lintel, flanked by vertical jambs.
 cube(-3.9,2.6,6.25,1.9,.13,.13,'#737b8c');
 cube(-4.83,1.86,6.25,.12,1.55,.13,'#656d7c');
 cube(-2.97,1.86,6.25,.12,1.55,.13,'#656d7c');
 cube(-3.9,2.44,6.18,.84,.18,.10,'#38534c');
 // wall lights & panel details
 for(let z of [-5.6,-3.1,-.6,1.9]){
  cube(-5.27,3.00,z,.14,.82,.11,'#565773');
  cube(5.27,3.00,z,.14,.82,.11,'#565773');
 }
 // Recliners: backrests are at +Z, footrests at -Z. This faces the screen.
 for(let ri=0;ri<4;ri++){
  const row='ABCD'[ri], yf=floorLevels[ri], z=rowZ[ri]-.03;
  for(let n=1;n<=10;n++){
   const id=row+n;
   if(!d.seatIds.includes(id))continue;
   const x=(n-5.5)*.93;
   if(d.accessible(id)){
    // D1/D2 wheelchair spaces are open bays as shown by the actual seat plan.
    cube(x,yf+.012,z,.78,.025,.90,'#35505a');
    cube(x,yf+.030,z,.42,.013,.50,'#84bcb9');
    continue;
   }
   const picked=id===selected;
   const frame=picked?'#6554aa':'#121723', leather=picked?'#8974ca':'#303747';
   const head=picked?'#b09ce8':'#465063';
   // Support frame, thick seat cushion and upper leather back (toward the rear).
   cube(x,yf+.105,z,.84,.20,.86,frame);
   cube(x,yf+.29,z+.025,.69,.19,.68,leather);
   cube(x,yf+.77,z+.43,.77,.96,.27,leather);
   cube(x,yf+1.20,z+.43,.70,.19,.28,head);
   cube(x,yf+.76,z+.275,.66,.37,.07,picked?'#9c8bdc':'#394353');
   // Broad recliner armrests at both sides.
   cube(x-.405,yf+.43,z,.18,.32,.82,picked?'#55477e':'#202635');
   cube(x+.405,yf+.43,z,.18,.32,.82,picked?'#55477e':'#202635');
   // Extended foot pad towards the SCREEN, not the back wall.
   cube(x,yf+.14,z-.45,.70,.16,.30,picked?'#594a84':'#283040');
   cube(x,yf+.10,z-.63,.65,.095,.12,picked?'#6a5a9d':'#343d4c');
   if(d.photo[id])cube(x,yf+.025,z-.71,.42,.025,.045,'#5bb6aa');
  }
 }
 // Vertical trim on the screen's sides.
 cube(-5.0,2.55,-6.9,.04,4.1,.10,'#575677');
 cube( 5.0,2.55,-6.9,.04,4.1,.10,'#575677');
}
function render(){
 if(!width||!height)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const grad=ctx.createLinearGradient(0,0,0,height);grad.addColorStop(0,'#121726');grad.addColorStop(.65,'#0e1420');grad.addColorStop(1,'#080b13');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
 const glow=ctx.createRadialGradient(width*.5,height*.33,10,width*.5,height*.45,width*.7);glow.addColorStop(0,'#62528c1b');glow.addColorStop(1,'#13152100');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 cam=camera();buildGeometry();
 frames.sort((a,b)=>b.depth-a.depth);
 for(const face of frames){ctx.globalAlpha=face.alpha;ctx.fillStyle=face.color;ctx.beginPath();face.p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill()}
 ctx.globalAlpha=1;
 // Screen label projected on plane.
 const center=project([0,2.85,-6.86]);if(center){ctx.save();ctx.textAlign='center';ctx.shadowColor='#ffffff44';ctx.shadowBlur=12;ctx.fillStyle='#c9c5e2';ctx.font=`800 ${clamp(Math.round(center.scale*.61),13,26)}px system-ui`;ctx.fillText('CINEMA 03',center.x,center.y);ctx.shadowBlur=0;ctx.font=`700 ${clamp(Math.round(center.scale*.22),9,13)}px system-ui`;ctx.fillStyle='#817da0';ctx.fillText('THE SCREEN',center.x,center.y+25);ctx.restore()}
 // Seat markers rendered on top for accurate selection.
 pixels=[];
 const fl=[0,.46,.92,1.38],rowZ=[-4.72,-2.35,.02,2.39];
 const marks=[];
 for(let ri=0;ri<4;ri++)for(let n=1;n<=10;n++){
  const id='ABCD'[ri]+n;if(!d.seatIds.includes(id))continue;
  const x=(n-5.5)*.93, pt=project([x,fl[ri]+1.42,rowZ[ri]-.17]);if(!pt)continue;
  marks.push({id,x:pt.x,y:pt.y,depth:pt.depth,r:clamp(13*15/pt.depth,8,13),photo:!!d.photo[id]});
 }
 marks.sort((a,b)=>b.depth-a.depth);
 for(let s of marks){
  let active=s.id===selected;
  const r=active?s.r+4:s.r;
  ctx.save();ctx.shadowBlur=active?18:s.photo?9:0;ctx.shadowColor=active?'#ac8dff':s.photo?'#4ce0b6':'transparent';
  ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);ctx.fillStyle=active?'#b29bff':s.photo?'#65d1b8':'#161c2add';ctx.fill();
  ctx.lineWidth=active?2:1;ctx.strokeStyle=active?'#efe5ff':s.photo?'#dcfff3':'#8892a383';ctx.stroke();
  ctx.shadowBlur=0;ctx.fillStyle=active?'#1c143a':s.photo?'#0c2c2c':'#ccd2e1';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${clamp(r*.9,8,12)}px system-ui`;ctx.fillText(s.id.substring(1),s.x,s.y+0.5);
  ctx.restore();
  pixels.push(s);
 }
 // vignette (minimal)
 const vg=ctx.createRadialGradient(width/2,height/2,height*.2,width/2,height/2,width*.75);vg.addColorStop(0,'#07091300');vg.addColorStop(1,'#05060b80');ctx.fillStyle=vg;ctx.fillRect(0,0,width,height);
}
function resize(){let rect=shell.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);render()}
let raf=0;function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;render()})}
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();down={px:e.clientX,py:e.clientY,yaw,elev,travel:0};canvas.setPointerCapture(e.pointerId);canvas.classList.add('grabbing')});
canvas.addEventListener('pointermove',e=>{if(!down)return;let dx=e.clientX-down.px,dy=e.clientY-down.py;down.travel=Math.max(down.travel,Math.hypot(dx,dy));if(down.travel>2){yaw=clamp(down.yaw-dx*.006,-1.28,1.28);elev=clamp(down.elev+dy*.0045,.19,1.35);schedule()}});
function end(e){if(!down)return;let moved=down.travel>8;down=null;canvas.classList.remove('grabbing');if(!moved){let r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 let possible=pixels.map(s=>({id:s.id,dist:Math.hypot(s.x-x,s.y-y),r:s.r})).sort((a,b)=>a.dist-b.dist)[0];
 if(possible&&possible.dist<Math.max(23,possible.r+10))window.chooseSeat(possible.id)
 }}
canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',()=>{down=null;canvas.classList.remove('grabbing')});
canvas.addEventListener('wheel',e=>{e.preventDefault();dist=clamp(dist+e.deltaY*.012,10.8,25);schedule()},{passive:false});
canvas.addEventListener('keydown',e=>{
 if(e.key==='ArrowLeft')yaw=clamp(yaw+.11,-1.28,1.28);
 else if(e.key==='ArrowRight')yaw=clamp(yaw-.11,-1.28,1.28);
 else if(e.key==='ArrowUp')elev=clamp(elev+.08,.19,1.35);
 else if(e.key==='ArrowDown')elev=clamp(elev-.08,.19,1.35);
 else return;e.preventDefault();schedule();
});
document.getElementById('reset-view').addEventListener('click',()=>{yaw=.52;elev=.47;dist=17.7;target=[0,1.18,-1.6];schedule()});
document.getElementById('top-view').addEventListener('click',()=>{yaw=0;elev=1.31;dist=16.6;target=[0,.6,-1.1];schedule()});
window.onSeatChange=function(id){selected=id;document.getElementById('scene-selected').textContent=d.label(id);schedule()};
if(window.ResizeObserver)new ResizeObserver(resize).observe(shell);else window.addEventListener('resize',resize);
resize();
})();
