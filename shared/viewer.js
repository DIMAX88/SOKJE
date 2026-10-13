(function(){
const d=window.CINEMA;
const available=d.available;
let chosen='C7';
const photoPlace=document.querySelector('#photo-stage');
const statBadge=document.querySelector('#photo-status');
function viewerHTML(){
 return `
 <div class="view-stage" id="photo-stage" aria-live="polite">
   <img id="seat-photo" src="${d.photo.C7}" alt="C열 7번에서 촬영한 실제 시야 사진" />
   <div id="photo-missing" class="missing hidden"><div><div class="icon">▦</div><h3>아직 등록된 시야 사진이 없어요</h3><p>촬영 사진이 추가되면 이 좌석에서도 실제 시야를 확인할 수 있습니다.</p></div></div>
   <div class="image-top"><span class="glass-pill" id="image-badge">● VERIFIED PHOTO</span><button type="button" class="zoom" title="사진 크게 보기" id="zoom-photo">⤢</button></div>
   <div class="photo-bottom"><span id="photo-kicker">ACTUAL SEAT VIEW</span><h2 id="photo-seat-title">C열 7번</h2><small id="photo-source">실제 좌석에서 촬영한 사진</small></div>
 </div>
 <div class="details"><div class="detail-top"><div><div class="tag">YOUR PERSPECTIVE</div><h3 style="margin-top:8px" id="detail-title">C7 · 스크린 시야</h3><p id="detail-sub">실제 촬영 이미지 · 시뮬레이션 아님</p></div><div class="detail-stat"><b id="detail-count">04</b><span>촬영 완료 좌석</span></div></div>
 <div class="photo-list" id="photo-list"></div><div class="disclaimer">* 촬영한 원본의 시야를 바탕으로 표시합니다. 사진이 없는 좌석에 가상의 시야를 만들어 넣지 않습니다.</div></div>`;
}
const holder=document.querySelector('#viewer-body');holder.innerHTML=viewerHTML();
const list=document.querySelector('#photo-list');
list.innerHTML=available.map(id=>`<button class="photo-thumb" type="button" data-photo-seat="${id}"><img src="${d.photo[id]}" alt="${d.label(id)}" loading="lazy"><b>${d.label(id)}</b></button>`).join('');
const overlay=document.querySelector('#picture-overlay');
const modalImg=document.querySelector('#modal-img');
function select(id){
 if(!d.seatIds.includes(id))return;
 chosen=id;window.SELECTED_SEAT=id;
 const has=!!d.photo[id];
 document.querySelector('#seat-photo').src=has?d.photo[id]:'../assets/theater.webp';
 document.querySelector('#seat-photo').alt=has?`${d.label(id)}에서 찍은 실제 시야 사진`:'3관 내부 참고 사진';
 document.querySelector('#seat-photo').style.opacity=has?'1':'0.16';
 document.querySelector('#photo-missing').classList.toggle('hidden',has);
 document.querySelector('#image-badge').textContent=has?'● VERIFIED PHOTO':'○ PHOTO NOT AVAILABLE';
 document.querySelector('#photo-seat-title').textContent=d.label(id);
 document.querySelector('#photo-source').textContent=has?d.sourceName[id]:'사진 미등록 · 향후 촬영 예정';
 document.querySelector('#detail-title').textContent=id+' · 스크린 시야';
 document.querySelector('#detail-sub').textContent=has?'실제 촬영 이미지 · 시뮬레이션 아님':'좌석은 확인 가능 · 시야 사진 준비 중';
 document.querySelector('#zoom-photo').disabled=!has;
 for(const el of document.querySelectorAll('[data-photo-seat]'))el.classList.toggle('selected',el.dataset.photoSeat===id);
 for(const el of document.querySelectorAll('[data-seat]')){
  el.classList.toggle('active',el.dataset.seat===id);
  el.setAttribute('aria-pressed',String(el.dataset.seat===id));
 }
 if(window.onSeatChange)window.onSeatChange(id);
 }
 window.chooseSeat=select;
 document.querySelectorAll('[data-photo-seat]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.photoSeat)));
 document.querySelector('#zoom-photo').addEventListener('click',()=>{
  if(!d.photo[chosen])return;modalImg.src=d.photo[chosen];modalImg.alt=d.label(chosen)+' 실제 시야';
  document.querySelector('#modal-label').textContent=d.label(chosen)+' · 실제 좌석 시야';overlay.classList.add('show');
 });
 document.querySelector('#close-modal').addEventListener('click',()=>overlay.classList.remove('show'));
 overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('show')});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.classList.remove('show')});
 select(chosen);
})();
