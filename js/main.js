(function(){
  var d=document, b=d.body;
  d.documentElement.classList.remove('no-js');

  /* header shadow + mobile call bar */
  var header=d.querySelector('.header'), callbar=d.querySelector('.callbar');
  function onScroll(){
    var y=window.scrollY;
    if(header) header.classList.toggle('is-scrolled', y>8);
    if(callbar) callbar.classList.toggle('is-on', y>420);
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* mobile nav */
  var burger=d.querySelector('.burger');
  if(burger){
    burger.addEventListener('click', function(){
      var open=b.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open);
    });
    d.querySelectorAll('.nav a').forEach(function(a){ a.addEventListener('click', function(){ b.classList.remove('nav-open'); burger.setAttribute('aria-expanded','false'); }); });
    d.addEventListener('keydown', function(e){ if(e.key==='Escape'){ b.classList.remove('nav-open'); burger.setAttribute('aria-expanded','false'); } });
  }

  /* opening hours in Irish time: Thu 9-17, Sun 11-15 */
  var HOURS={4:[9,17],0:[11,15]};
  var NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function irishNow(){
    try{
      var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Dublin',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
      var o={}; p.forEach(function(x){o[x.type]=x.value;});
      var map={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
      return {day:map[o.weekday], h:parseInt(o.hour,10)%24 + parseInt(o.minute,10)/60};
    }catch(e){ var n=new Date(); return {day:n.getDay(), h:n.getHours()+n.getMinutes()/60}; }
  }
  function fmt(h){ return h===12?'12pm':(h>12?(h-12)+'pm':h+'am'); }
  var now=irishNow(), today=HOURS[now.day], open=today && now.h>=today[0] && now.h<today[1], text;
  if(open){ text='Open now until '+fmt(today[1]); }
  else{
    var k, nd, label;
    for(k=0;k<8;k++){
      nd=(now.day+k)%7;
      if(HOURS[nd] && (k>0 || now.h<HOURS[nd][0])){ break; }
    }
    label = k===0 ? 'today' : (k===1 ? 'tomorrow' : NAMES[nd]);
    text='Closed now. Opens '+label+' at '+fmt(HOURS[nd][0]);
  }
  d.querySelectorAll('[data-status]').forEach(function(el){
    el.classList.toggle('is-open', !!open);
    var t=el.querySelector('.status__text'); if(t) t.textContent=text;
  });
  d.querySelectorAll('.hours li[data-day]').forEach(function(li){
    if(parseInt(li.getAttribute('data-day'),10)===now.day) li.classList.add('is-today');
  });

  /* health / aesthetics switch */
  var KEY='nh-track';
  function setTrack(t){
    b.setAttribute('data-track', t);
    d.querySelectorAll('[data-set-track]').forEach(function(btn){ btn.setAttribute('aria-pressed', btn.getAttribute('data-set-track')===t); });
    d.querySelectorAll('[data-track-panel]').forEach(function(p){ p.hidden = p.getAttribute('data-track-panel')!==t; });
    try{ localStorage.setItem(KEY,t); }catch(e){}
  }
  if(d.querySelector('[data-set-track]')){
    var saved=null; try{ saved=localStorage.getItem(KEY); }catch(e){}
    setTrack(saved==='aesthetics'?'aesthetics':'health');
    d.querySelectorAll('[data-set-track]').forEach(function(btn){
      btn.addEventListener('click', function(){ setTrack(btn.getAttribute('data-set-track')); });
    });
  }

  /* scroll reveal */
  var items=d.querySelectorAll('.rv-in');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target);} }); },{rootMargin:'0px 0px -8% 0px',threshold:.08});
    items.forEach(function(el){ io.observe(el); });
  } else { items.forEach(function(el){ el.classList.add('is-in'); }); }

  /* reviews slider */
  var track=d.querySelector('.rv-track');
  if(track){
    var prev=d.querySelector('[data-rv="prev"]'), next=d.querySelector('[data-rv="next"]');
    function step(){ var c=track.querySelector('.rv'); return c ? c.getBoundingClientRect().width+20 : 300; }
    function upd(){ if(!prev) return; prev.disabled = track.scrollLeft<8; next.disabled = track.scrollLeft+track.clientWidth >= track.scrollWidth-8; }
    if(prev) prev.addEventListener('click', function(){ track.scrollBy({left:-step(),behavior:'smooth'}); });
    if(next) next.addEventListener('click', function(){ track.scrollBy({left:step(),behavior:'smooth'}); });
    track.addEventListener('scroll', upd, {passive:true}); window.addEventListener('resize', upd); upd();
  }

  /* table of contents highlight */
  var toc=d.querySelectorAll('.toc a');
  if(toc.length && 'IntersectionObserver' in window){
    var map={}; toc.forEach(function(a){ map[a.getAttribute('href').slice(1)]=a; });
    var tio=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          toc.forEach(function(a){ a.classList.remove('is-active'); });
          var a=map[e.target.id]; if(a){ a.classList.add('is-active'); var ol=a.closest('ol'); if(ol && ol.scrollWidth>ol.clientWidth){ ol.scrollTo({left:a.offsetLeft-20,behavior:'smooth'}); } }
        }
      });
    },{rootMargin:'-30% 0px -60% 0px'});
    Object.keys(map).forEach(function(id){ var s=d.getElementById(id); if(s) tio.observe(s); });
  }

  /* price search + filter */
  var q=d.getElementById('price-search');
  if(q){
    var groups=d.querySelectorAll('.pgroup'), chips=d.querySelectorAll('[data-filter]'), empty=d.querySelector('.pempty'), cat='all';
    function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
    function run(){
      var term=q.value.trim().toLowerCase(), any=false;
      groups.forEach(function(g){
        var gOk = cat==='all' || g.getAttribute('data-cat')===cat, shown=0;
        g.querySelectorAll('.prow').forEach(function(r){
          var name=r.querySelector('.pname');
          if(!name.dataset.raw) name.dataset.raw=name.innerHTML;
          var hay=(r.textContent+' '+g.querySelector('h2').textContent).toLowerCase();
          var ok = gOk && (!term || hay.indexOf(term)>-1);
          r.hidden=!ok; if(ok) shown++;
          name.innerHTML = name.dataset.raw;
          if(ok && term){ var first=name.firstChild; if(first && first.nodeType===3){ var re=new RegExp('('+esc(term)+')','ig'); var span=d.createElement('span'); span.innerHTML=first.textContent.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}).replace(re,'<mark>$1</mark>'); name.replaceChild(span, first); } }
        });
        g.hidden = shown===0; if(shown) any=true;
      });
      if(empty) empty.classList.toggle('is-on', !any);
    }
    q.addEventListener('input', run);
    chips.forEach(function(c){ c.addEventListener('click', function(){ cat=c.getAttribute('data-filter'); chips.forEach(function(x){ x.setAttribute('aria-pressed', x===c); }); run(); }); });
    var clear=d.querySelector('[data-clear]'); if(clear) clear.addEventListener('click', function(){ q.value=''; cat='all'; chips.forEach(function(x){ x.setAttribute('aria-pressed', x.getAttribute('data-filter')==='all'); }); run(); q.focus(); });
  }

  var y=d.querySelector('[data-year]'); if(y) y.textContent=new Date().getFullYear();
})();
