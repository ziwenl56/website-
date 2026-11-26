const byId = id => document.getElementById(id);
const siteTitle = '林子文 · Design Portfolio';
const byGroup = key => groups.find(group => group[0] === key);
const byWork = id => works.find(work => work.id === id);
const videoFolders = {
  'poem.mp4': '02-诗窗视频',
  'opera.mp4': '03-西厢记视频',
  'symphony.mp4': '04-元境交响视频'
};
const imgPath = name => (videoFolders[name] || '01-图片与展板') + '/media/' + name;
const routeTo = id => '#project/' + id;
const mediaImg = (name, alt, lazy = true) => '<img src="'+imgPath(name)+'" alt="'+alt+'" '+(lazy?'loading="lazy" ':'')+'decoding="async">';
const menu = byId('menu');
const menuButton = byId('menuButton');
menu.innerHTML = '<a href="#home">作品集封面</a><a href="#works">全部作品</a>' + groups.map(g=>'<a href="#works/'+g[0]+'">'+g[1]+'</a>').join('')+'<a href="#about">关于林子文</a>';
function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded',String(open));
  menuButton.setAttribute('aria-label',open?'关闭导航':'打开导航');
}
menuButton.addEventListener('click',()=>setMenu(menu.hidden));
document.addEventListener('click',e=>{if (!e.target.closest('.brand,#menu') || e.target.closest('#menu a')) setMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape' && !menu.hidden){setMenu(false);menuButton.focus()}});
function renderArchive(group){
  const filters = [['','全部作品'],...groups];
  byId('filters').innerHTML=filters.map(([key,name])=>'<a aria-current="'+(key===group)+'" href="#works'+(key?'/'+key:'')+'">'+name+'</a>').join('');
  const items=group?works.filter(w=>w.group===group):works;
  byId('count').textContent=items.length+' 件作品';
  byId('cards').innerHTML=items.map(w=>'<a class="card" href="'+routeTo(w.id)+'"><span class="card-img">'+mediaImg(w.cover,'')+'</span><div class="card-info"><h3>'+w.title+'</h3><small>'+byGroup(w.group)[1]+'</small></div><p>'+w.brief+'</p></a>').join('');
}
function figure([src,label],layout=''){
  return '<figure class="case-figure '+layout+'"><button type="button" data-image="'+src+'" data-caption="'+label+'" aria-label="放大查看：'+label+'">'+mediaImg(src,label,layout!=='lead')+'</button><figcaption>'+label+'</figcaption></figure>';
}
function renderDeck(work){
  const total = work.pages.length;
  const pageFigures = work.pages.map((label,index)=>{
    const n=String(index+1).padStart(2,'0');
    const file='pages/'+work.id+'/'+n+'.webp';
    return '<figure class="case-figure deck-page" id="folio-p'+n+'"><figcaption><b>'+n+' / '+String(total).padStart(2,'0')+'</b>'+label+'</figcaption><button type="button" data-image="'+file+'" data-caption="'+work.title+' · 第 '+(index+1)+' 页 · '+label+'" aria-label="放大第 '+(index+1)+' 页，'+label+'"><img width="2304" height="1296" src="'+imgPath(file)+'" alt="'+label+'" loading="'+(index===0?'eager':'lazy')+'"></button></figure>';
  }).join('');
  const options=work.pages.map((name,i)=>'<option value="'+String(i+1).padStart(2,'0')+'">'+(i+1)+' · '+name+'</option>').join('');
  return '<section class="folio"><div class="folio-bar"><h2>完整设计稿 <small>'+total+' 页</small></h2><label>跳至页面 <select aria-label="跳至设计稿页面">'+options+'</select></label></div>'+pageFigures+'</section>';
}
byId('casePage').addEventListener('change',event=>{
  if(event.target.matches('.folio-bar select'))byId('folio-p'+event.target.value)?.scrollIntoView({behavior:'instant'});
});
function renderCase(w){
  const g=byGroup(w.group),next=works[(works.indexOf(w)+1)%works.length];
  const deck=Array.isArray(w.pages);
  const lead=deck?'':w.video?'<figure class="film"><video controls playsinline preload="metadata" poster="'+imgPath(w.video[1])+'" aria-label="'+w.video[2]+'"><source src="'+imgPath(w.video[0])+'" type="video/mp4"></video><figcaption>'+w.video[2]+'</figcaption></figure>':figure(w.media[0],'lead');
  const rest=deck?[]:w.video?w.media:w.media.slice(1);
  const link=w.link?'<a class="case-action" href="'+imgPath(w.link[0])+'" target="_blank" rel="noopener">'+w.link[1]+'</a>':'';
  const info=w.boardOnly?'':'<div class="case-info"><dl class="facts">'+w.facts.map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('')+'</dl><div class="case-text"><h2>'+(w.heading||w.brief)+'</h2><p>'+w.text+'</p>'+(w.construction?'<h2 class="construction">装置构成</h2><p>'+w.construction+'</p>':'')+link+'</div></div>';
  byId('casePage').innerHTML='<header class="case-intro"><nav class="crumb" aria-label="面包屑"><a href="#works">作品索引</a><span>/</span><a href="#works/'+g[0]+'">'+g[1]+'</a></nav><h1>'+w.title+'</h1><div lang="en" class="case-en">'+(w.subtitle||w.en)+'</div></header><div class="case-body">'+lead+info+(deck?renderDeck(w):'')+'<div class="media-grid">'+rest.map(m=>figure(m,m[0]==='poem-scene.webp'?'wide':'')).join('')+'</div></div><nav class="case-end" aria-label="切换作品"><a href="#works/'+g[0]+'">返回'+g[1]+'作品</a><a href="'+routeTo(next.id)+'"><small>下一个项目</small>'+next.title+'</a></nav>';
}
const viewer=byId('viewer');
const scrollBox=viewer.querySelector('.viewer-body');
byId('casePage').addEventListener('click',e=>{
  const trigger=e.target.closest('[data-image]');
  if(!trigger)return;
  byId('largeImg').src=imgPath(trigger.dataset.image);
  byId('largeImg').alt=trigger.dataset.caption;
  byId('viewerTitle').textContent=trigger.dataset.caption;
  scrollBox.classList.remove('zoomed');byId('zoom').textContent='查看细节';
  viewer.showModal();document.body.style.overflow='hidden';
});
byId('zoom').addEventListener('click',()=>{
  const zoomed=scrollBox.classList.toggle('zoomed');
  byId('zoom').textContent=zoomed?'适应窗口':'查看细节';
  if(!zoomed)scrollBox.scrollTo(0,0);
});
byId('closeViewer').addEventListener('click',()=>viewer.close());
viewer.addEventListener('close',()=>{document.body.style.overflow=''});
function route(){
  const [page,slug]=location.hash.slice(1).split('/');
  const project=page==='project'&&byWork(slug==='pinggu'?'guanhe':slug);
  setMenu(false);if(viewer.open)viewer.close();
  byId('casePage').querySelectorAll('video').forEach(v=>v.pause());
  byId('homePage').hidden=!!project;byId('casePage').hidden=!project;
  document.title=project?project.title+' · 林子文作品集':siteTitle;
  if(project){renderCase(project);window.scrollTo({top:0,behavior:'instant'});return}
  byId('casePage').replaceChildren();
  renderArchive(page==='works' && byGroup(slug)?slug:'');
  const target=page==='works'?byId('workSection'):page==='about'?byId('aboutSection'):null;
  if(target)target.scrollIntoView({behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',route);
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');
  if(a && a.hash === location.hash)route();
});
route();
