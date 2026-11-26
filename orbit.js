(() => {
  const stage = byId('gallery');
  const modal = byId('spotlight');
  const large = byId('spotImage');
  const motion = byId('motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const order = ['coordinates','glowher','symphony','coffee','poetry','west-chamber','guanhe'];
  // The outer track uses the published covers. The inner track shows the work at a closer scale.
  const details = [
    ['glowher','pages/glowher/06.webp',16/9],
    ['coordinates','industrial-gallery.webp',1.3],
    ['poetry','poem-scene.webp',1.8],
    ['symphony','symphony-warm.jpg',1.45],
    ['west-chamber','opera-reading.jpg',1.35]
  ];
  let time = 0, velocity = 0, last = 0, raf = 0;
  let inView = false, paused = reduced.matches, pointer = null, picked = null;
  let ignoreClick = 0, nearby = null, focused = null, returning = false;
  let pointerX = 0, pointerY = 0, leanX = 0, leanY = 0;
  let width = 0, height = 0;
  const tiles = [];
  function add(id, src, ratio, isDetail, i){
    const work = byWork(id);
    const link = document.createElement('a');
    link.className = 'drift-tile '+(isDetail?'detail':'cover');
    link.href = routeTo(id);
    link.setAttribute('aria-label','预览'+work.title+(isDetail?'的项目细节':''));
    link.draggable = false;
    link.innerHTML = mediaImg('drift/'+src.replaceAll('/','-')+'.webp','',false);
    link.firstElementChild.draggable = false;
    stage.append(link);
    tiles.push({link,work,src,ratio,isDetail,i});
  }
  order.forEach((id,i)=>add(id,byWork(id).cover,16/9,false,i));
  details.forEach(([id,src,ratio],i)=>add(id,src,ratio,true,i));
  function draw(){
    const narrow=width<700;
    for(const tile of tiles){
      const {link,i,isDetail}=tile;
      const a = i*2*Math.PI/(isDetail?details.length:order.length) + (isDetail? .46 : -.22) + time*(isDetail?-.79:1);
      const depth = (Math.cos(a-.35)+1)/2;
      const phase = i*2.13;
      const rx = width * (isDetail?.286:.371);
      const ry = height * (isDetail?.232:.334);
      const x = Math.cos(a)*rx + Math.sin(a*2+phase)*width*.031;
      const y = Math.sin(a)*ry + Math.cos(a*2+phase)*height*.047;
      const scale = (isDetail?.88:1)*(.86+.23*depth);
      const z = 8+Math.round(35*depth)-(isDetail?7:0);
      const isFocused = tile===focused || tile===nearby;
      const parallax=(depth-.34)*(narrow?0:14);
      link.style.transform='translate(-50%,-50%) translate3d('+(x+leanX*parallax)+'px,'+(y+leanY*parallax)+'px,0) scale('+(scale*(isFocused?1.05:1))+')';
      link.style.opacity=isFocused?'1':String(isDetail?.62+.37*depth:.9+.1*depth);
      link.style.zIndex=isFocused?'60':String(z);
    }
  }
  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;
    if(!width||!height)return;
    const narrow=width<700;
    tiles.forEach(({link,ratio,i,isDetail})=>{
      const w=Math.min(width*(narrow?(isDetail?.17:.222):(isDetail?.126:.166)),isDetail?189:250)*(1+(i%3-1)*.06);
      link.style.width=w+'px';link.style.height=w/ratio+'px';
      link.hidden=narrow&&isDetail&&i%2===1;
    });
    draw();
  }
  function tick(now){
    raf=0;
    if(!inView || document.hidden || picked)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    const auto=!paused&&!pointer&&!focused;
    if(auto)time+=dt*(nearby ? .12 : .38);
    if(!pointer && Math.abs(velocity)>.002){time+=velocity*dt;velocity*=Math.exp(-dt*5)}
    leanX+=(pointerX-leanX)*Math.min(1,dt*8);leanY+=(pointerY-leanY)*Math.min(1,dt*8);
    draw();
    if(auto || Math.abs(velocity)>.002 || Math.abs(leanX-pointerX)+Math.abs(leanY-pointerY)>.01)raf=requestAnimationFrame(tick);
  }
  function start(){if(!raf && inView && !document.hidden && !picked){last=0;raf=requestAnimationFrame(tick)}}
  function showMotion(){
    motion.innerHTML=paused?'<i class="play" aria-hidden="true"></i><span>播放动效</span>':'<i class="pause" aria-hidden="true"></i><span>暂停动效</span>';
    motion.setAttribute('aria-pressed',String(paused));
  }
  motion.addEventListener('click',()=>{paused=!paused;velocity=0;showMotion();start()});
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([e])=>{inView=e.isIntersecting;start()}).observe(stage);
  document.addEventListener('visibilitychange',start);
  reduced.addEventListener('change',()=>{paused=reduced.matches;velocity=0;showMotion();start()});
  stage.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),prev:e.clientX,moved:false};
    velocity=0;
  });
  stage.addEventListener('pointermove',e=>{
    if(!pointer){
      if(e.pointerType==='mouse'&&!paused&&!reduced.matches){
        const box=stage.getBoundingClientRect();
        pointerX=(e.clientX-box.left)/width*2-1;pointerY=(e.clientY-box.top)/height*2-1;
        start();
      }return;
    }
    if(pointer.id!==e.pointerId)return;
    if(!pointer.moved){
      if(Math.abs(e.clientX-pointer.x)<6 || Math.abs(e.clientX-pointer.x)<Math.abs(e.clientY-pointer.y))return;
      stage.setPointerCapture(e.pointerId);pointer.moved=true;stage.classList.add('dragging');nearby=null;
    }
    const delta=(e.clientX-pointer.prev)*4/width;
    const now=performance.now();velocity=Math.max(-3,Math.min(3,delta/Math.max(.016,(now-pointer.t)/1000)));
    pointer.prev=e.clientX;pointer.t=now;time+=delta;draw();
  });
  function release(e){
    if(!pointer || pointer.id!==e.pointerId)return;
    if(pointer.moved){ignoreClick=performance.now()+300;if(paused||reduced.matches||performance.now()-pointer.t>90)velocity=0}
    pointer=null;stage.classList.remove('dragging');start();
  }
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  stage.addEventListener('pointerleave',()=>{nearby=null;pointerX=0;pointerY=0;start()});
  stage.addEventListener('wheel',e=>{
    if(e.ctrlKey)return;
    const horizontal=Math.abs(e.deltaX)>Math.abs(e.deltaY);
    if(horizontal||e.shiftKey)e.preventDefault();
    time+=Math.max(-150,Math.min(150,(horizontal?e.deltaX:e.deltaY)*(e.deltaMode===1?16:1)))*.004;
    nearby=null;draw();start();
  },{passive:false});
  stage.addEventListener('pointerover',e=>{if(e.pointerType==='mouse'&&!pointer){nearby=tiles.find(t=>t.link.contains(e.target))||null;draw();start()}});
  stage.addEventListener('pointerout',e=>{if(nearby&&!nearby.link.contains(e.relatedTarget)){nearby=null;start()}});
  stage.addEventListener('focusin',e=>{focused=e.target.matches(':focus-visible')?tiles.find(t=>t.link===e.target):null;draw();start()});
  stage.addEventListener('focusout',()=>{focused=null;start()});
  function rectTransform(from,to){
    return 'translate('+(from.left-to.left)+'px,'+(from.top-to.top)+'px) scale('+from.width/to.width+','+from.height/to.height+')';
  }
  function openTile(tile){
    picked=tile;velocity=0;returning=false;
    byId('spotName').textContent=tile.work.title;
    byId('spotGroup').textContent=byGroup(tile.work.group)[1];
    byId('spotOpen').href=routeTo(tile.work.id);
    large.src=imgPath(tile.src);large.alt=tile.work.title;
    // Reserve the source aspect ratio before the decoded image reaches the dialog.
    const image=tile.link.firstElementChild;
    large.style.aspectRatio=(image.naturalWidth||16)+' / '+(image.naturalHeight||9);
    const from=tile.link.getBoundingClientRect();
    modal.showModal();document.body.style.overflow='hidden';
    if(!reduced.matches){const to=large.getBoundingClientRect();
      large.animate([{transform:rectTransform(from,to),opacity:.7},{transform:'none',opacity:1}],{duration:430,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
  }
  function dismiss(){
    if(!modal.open||returning)return;
    returning=true;
    if(reduced.matches || !picked){modal.close();return}
    const from=large.getBoundingClientRect(),to=picked.link.getBoundingClientRect();
    const anim=large.animate([{transform:'none',opacity:1},{transform:rectTransform(to,from),opacity:.35}],{duration:250,easing:'ease-in-out',fill:'forwards'});
    anim.finished.then(()=>{if(modal.open)modal.close();anim.cancel()},()=>{});
  }
  stage.addEventListener('click',e=>{
    if(performance.now()<ignoreClick){e.preventDefault();return}
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const tile=tiles.find(t=>t.link.contains(e.target));
    if(tile){e.preventDefault();openTile(tile)}
  });
  byId('spotClose').addEventListener('click',dismiss);byId('spotBack').addEventListener('click',dismiss);
  modal.addEventListener('click',e=>{if(e.target===modal)dismiss()});
  modal.addEventListener('cancel',e=>{e.preventDefault();dismiss()});
  byId('spotOpen').addEventListener('click',()=>modal.close());
  modal.addEventListener('close',()=>{picked=null;returning=false;nearby=null;document.body.style.overflow='';start()});
  window.addEventListener('hashchange',()=>{if(modal.open)modal.close()});
  resize();showMotion();
})();
