/* Central festival provider: shared public/preview renderer, bounded effects and cleanup. */
(() => {
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const empty={enabled:false,festival:'sankranti',intensity:'low',greetingVariant:'default'};
  let catalogue=[],intensities={},settings={...empty},shopName='Sri Sai Shanmukha Auto Centre',preview=false;
  let artwork=null,artworkPromise=null,source=null,pollId=null,connected=false,inFlight=false,generation=0,record=null,lastPath='';
  let manuallyPaused=false;
  try{manuallyPaused=localStorage.getItem('sssa-festival-motion')==='paused';}catch{}
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const paused=()=>manuallyPaused||!!reducedMotion?.matches||!!document.hidden;
  const listeners=[];
  const listen=(target,event,callback)=>{target.addEventListener(event,callback);listeners.push(()=>target.removeEventListener(event,callback));};
  function normalize(value) {
    if(!value||!catalogue.some(f=>f.id===value.festival))return {...empty};
    const theme=catalogue.find(f=>f.id===value.festival);
    return {enabled:value.enabled===true,festival:theme.id,intensity:Object.hasOwn(intensities,value.intensity)?value.intensity:'low',greetingVariant:value.greetingVariant==='default'||Object.hasOwn(theme.greetingVariants||{},value.greetingVariant)?value.greetingVariant:'default'};
  }
  function selected() {
    const theme=catalogue.find(f=>f.id===settings.festival);
    return theme?{...theme,...theme.greetingVariants?.[settings.greetingVariant]}:null;
  }
  async function loadArtwork() {
    if(artwork)return artwork;
    if(!artworkPromise)artworkPromise=import('./festival-artwork.js').then(module=>artwork=module).catch(error=>{artworkPromise=null;throw error;});
    return artworkPromise;
  }
  function cancelRecord() {
    if(!record)return;
    for(const animation of record.animations)animation.cancel();
    record.element.remove();record=null;
  }
  function clearScenery() {
    document.querySelectorAll('[data-festival-decoration],#festival-header-motion,#festival-preview-state').forEach(node=>node.remove());
    document.querySelectorAll('.festival-decorated-section,.festival-logo-host').forEach(node=>node.classList.remove('festival-decorated-section','festival-logo-host'));
  }
  function restore() {
    cancelRecord();clearScenery();
    document.querySelectorAll('.festival-visual-host').forEach(node=>node.classList.remove('festival-visual-host'));
    for(const name of ['festival','festivalIntensity','festivalMotion'])delete document.body.dataset[name];
  }
  function syncMotion() {
    const freeze=paused();
    if(settings.enabled)document.body.dataset.festivalMotion=freeze?'paused':'running';
    if(record) {
      if(reducedMotion?.matches||manuallyPaused) {
        for(const animation of record.animations)animation.cancel();
        record.animations=[];record.complete=true;record.element.dataset.phase='settled';
      } else for(const animation of record.animations) {
        if(animation.playState==='finished'||animation.playState==='idle')continue;
        if(freeze)animation.pause();else animation.play();
      }
    }
    document.querySelectorAll('button[data-festival-motion]').forEach(button=>{
      button.setAttribute('aria-pressed',String(freeze));button.disabled=!!reducedMotion?.matches;
      button.setAttribute('aria-label',reducedMotion?.matches?'Festive effects: reduced motion':manuallyPaused?'Resume festive effects':'Pause festive effects');
      button.title=reducedMotion?.matches?'Your device prefers reduced motion':manuallyPaused?'Resume festive effects':'Pause festive effects';
      const label=button.querySelector('span');if(label)label.textContent=reducedMotion?.matches?'Reduced motion':manuallyPaused?'Resume effects':'Pause effects';
    });
  }
  const KEYFRAMES={
    reveal:[{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],
    'fly-left':[{opacity:0,transform:'translate(-75px,22px) rotate(-12deg)'},{opacity:1,transform:'translate(7px,-4px) rotate(3deg)',offset:.75},{opacity:1,transform:'translate(0,0) rotate(0)'}],
    'fly-right':[{opacity:0,transform:'translate(70px,-20px) rotate(14deg)'},{opacity:1,transform:'translate(0,0) rotate(0)'}],
    illuminate:[{opacity:.12},{opacity:1}],
    kindle:[{opacity:0,scale:'.35 .55'},{opacity:.8,scale:'.96 1',offset:.65},{opacity:1,scale:'1 1'}],
    rise:[{opacity:0,translate:'0 16px'},{opacity:1,translate:'0 0'}],
    overflow:[{opacity:0,scale:'1 .15'},{opacity:1,scale:'1 1.05',offset:.75},{opacity:1,scale:'1 1'}],
    arrive:[{opacity:0,translate:'24px 0'},{opacity:1,translate:'0 0'}],
    unfold:[{opacity:0,scale:'1 .05',rotate:'-12deg'},{opacity:1,scale:'1 1',rotate:'0deg'}],
    'powder-left':[{opacity:0,translate:'-38px 12px',scale:'.2'},{opacity:1,translate:'0 0',scale:'1.04',offset:.72},{opacity:1,translate:'0 0',scale:'1'}],
    'powder-right':[{opacity:0,translate:'38px 12px',scale:'.2'},{opacity:1,translate:'0 0',scale:'1.04',offset:.72},{opacity:1,translate:'0 0',scale:'1'}],
    arrow:[{opacity:0,translate:'-40px 0'},{opacity:1,translate:'0 0'}],
    gada:[{opacity:0,translate:'0 20px',rotate:'-12deg'},{opacity:1,translate:'0 0',rotate:'0deg'}],
    lotus:[{opacity:0,scale:'.5 .15'},{opacity:1,scale:'1 1'}],
    rakhi:[{opacity:0,rotate:'-70deg',scale:'.65'},{opacity:1,rotate:'4deg',scale:'1',offset:.8},{opacity:1,rotate:'0deg',scale:'1'}],
    flute:[{opacity:0,scale:'.15 1'},{opacity:1,scale:'1 1'}],
    feather:[{opacity:0,translate:'0 -18px',rotate:'12deg'},{opacity:1,translate:'0 0',rotate:'0deg'}],
    petal:[{opacity:0,translate:'0 -18px',rotate:'-20deg'},{opacity:1,translate:'0 0',rotate:'0deg'}],
    assemble:[{opacity:0,translate:'0 15px',scale:'.7'},{opacity:1,translate:'0 0',scale:'1'}],
    firework:[{opacity:0,scale:'.45'},{opacity:.8,scale:'1',offset:.65},{opacity:.5,scale:'1.03'}],
    moon:[{opacity:0,translate:'0 7px',scale:'.85'},{opacity:1,translate:'0 0',scale:'1'}],
  };
  function runEntrance(current,theme) {
    if(reducedMotion?.matches||manuallyPaused||typeof current.element.animate!=='function'){current.complete=true;current.element.dataset.phase='settled';return;}
    const animate=(target,frames,delay,duration)=>{
      const animation=target.animate(frames,{duration,delay,easing:'cubic-bezier(.22,.65,.3,1)',fill:'both'});
      current.animations.push(animation);if(paused())animation.pause();
    };
    for(const stage of theme.heroAnimation.stages) {
      current.element.querySelectorAll(`[data-entrance="${stage.part}"]`).forEach((target,index)=>{
        if(stage.effect==='draw'&&typeof target.getTotalLength==='function') {
          const length=target.getTotalLength();
          animate(target,[{opacity:0,strokeDasharray:`${length}`,strokeDashoffset:length},{opacity:1,strokeDasharray:`${length}`,strokeDashoffset:0}],stage.at+index*(stage.stagger||0),stage.duration);
        } else animate(target,KEYFRAMES[stage.effect]||KEYFRAMES.reveal,stage.at+index*(stage.stagger||0),stage.duration);
      });
    }
    animate(current.element.querySelector('.festival-hero-copy'),KEYFRAMES.reveal,1900,theme.heroAnimation.durationMs-1900);
    const telugu=current.element.querySelector('.festival-hero-telugu');
    if(telugu)animate(telugu,KEYFRAMES.reveal,2600,1400);
    Promise.all(current.animations.map(animation=>animation.finished.catch(()=>{}))).then(()=>{
      if(record!==current)return;
      current.complete=true;current.element.dataset.phase='settled';
      // Final styles are already the static CSS state; release completed effects.
      for(const animation of current.animations)animation.cancel();
      current.animations=[];
    });
  }
  function syncParticles(element) {
    const sky=element.querySelector('.festival-hero-sky');
    const count=(intensities[settings.intensity]||{particles:3}).particles;
    if(sky.dataset.count===String(count))return;
    sky.dataset.count=String(count);
    sky.innerHTML='<div class="festival-hero-particles">'+Array.from({length:count},(_,i)=>`<i class="festival-particle festival-particle-${i}"></i>`).join('')+'</div>';
  }
  function makeHero(theme) {
    const element=document.createElement('div');element.className='festival-hero';
    element.dataset.animation=theme.heroAnimation.id;element.dataset.phase='entering';
    element.setAttribute('role','region');element.setAttribute('aria-label',`${theme.name} greeting`);
    element.innerHTML=`<div class="festival-hero-sky" aria-hidden="true"></div><div class="festival-hero-copy"><p class="festival-hero-from">Warm wishes from our shop</p><h2>${esc(theme.greeting)}</h2>${theme.teluguGreeting?`<p class="festival-hero-telugu" lang="te">${esc(theme.teluguGreeting)}</p>`:''}</div><div class="festival-hero-art" aria-hidden="true">${artwork.renderArtwork(theme)}</div>`;
    syncParticles(element);return element;
  }
  function decoration(kind,className) {
    const node=document.createElement('span');node.className=`festival-decoration ${className}`;
    node.dataset.festivalDecoration=kind;node.setAttribute('aria-hidden','true');node.innerHTML=artwork.renderDecoration(kind);return node;
  }
  function decoratePage(theme) {
    const density=intensities[settings.intensity]||{edges:2,sections:2,headings:2,particles:3};
    const {primary,secondary,pattern}=theme.pageEffects;
    const logo=document.querySelector('.site-brand');
    if(logo){logo.classList.add('festival-logo-host');logo.append(decoration(primary,'festival-decoration--logo'));}
    const header=document.querySelector('.header-inner');
    if(header) {
      header.append(decoration(secondary,'festival-decoration--header'));
      const button=document.createElement('button');button.id='festival-header-motion';button.className='festival-motion';button.type='button';button.dataset.festivalMotion='';
      button.innerHTML='<i aria-hidden="true"></i><span>Pause effects</span>';
      const menu=header.querySelector('#menu-toggle');header.insertBefore(button,menu||null);
    }
    document.querySelectorAll('main .design-heading').forEach((heading,index)=>{
      if(index<density.headings){heading.classList.add('festival-decorated-section');heading.append(decoration(index%2?secondary:primary,'festival-decoration--heading'));}
    });
    const sections=document.querySelectorAll('main .design-brand-section,main .design-categories-section,main .spotlight-section,main .design-why-section,main .design-home-blogs,main .shop-contact-section,main .design-blogs-list,main .parts-section');
    sections.forEach((section,index)=>{
      if(index>=density.sections)return;
      section.classList.add('festival-decorated-section');
      const wash=decoration(index%2?secondary:primary,'festival-decoration--wash');wash.dataset.pattern=pattern;section.append(wash);
    });
    const footer=document.querySelector('.footer');
    if(footer){footer.classList.add('festival-decorated-section');footer.append(decoration(primary,'festival-decoration--footer'));footer.append(decoration(secondary,'festival-decoration--footer-small'));}
    for(const side of ['left','right']) {
      const rail=document.createElement('div');rail.dataset.festivalDecoration='edge';rail.className=`festival-edge-rail festival-edge-rail--${side}`;rail.setAttribute('aria-hidden','true');
      for(let i=0;i<Math.ceil(density.edges/2);i++)rail.append(decoration(i%2?secondary:primary,`festival-decoration--edge festival-edge-${i}`));
      document.body.append(rail);
    }
    if(preview) {
      const label=document.createElement('div');label.id='festival-preview-state';label.textContent='Private preview · Not published';label.setAttribute('role','status');document.body.append(label);
    }
  }
  async function mount() {
    const turn=++generation;
    const theme=selected();
    if(!settings.enabled||!theme){restore();return;}
    const key=`${settings.festival}:${settings.greetingVariant}`;
    const path=location.pathname;
    if(record&&(record.key!==key||lastPath!==path))cancelRecord();
    lastPath=path;
    clearScenery();
    document.body.dataset.festival=theme.id;document.body.dataset.festivalIntensity=settings.intensity;
    try{await loadArtwork();}catch{if(turn===generation)restore();return;}
    if(turn!==generation)return;
    const host=document.querySelector('.showcase-home .showcase-image');
    if(host) {
      host.classList.add('festival-visual-host');
      if(!record){record={key,element:makeHero(theme),animations:[],complete:false};host.append(record.element);runEntrance(record,theme);}
      else if(record.element.parentElement!==host)host.append(record.element);
      syncParticles(record.element);
    } else cancelRecord();
    decoratePage(theme);syncMotion();
  }
  function accept(value) {
    const next=normalize(value);
    if(JSON.stringify(next)===JSON.stringify(settings)){if(next.enabled&&!artwork)mount();return;}
    const changedFestival=next.festival!==settings.festival||next.greetingVariant!==settings.greetingVariant;
    if(changedFestival)cancelRecord();
    settings=next;mount();
  }
  async function refresh() {
    if(inFlight||document.hidden||preview)return;
    inFlight=true;
    try{const response=await fetch('/api/festivals',{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(Array.isArray(data.festivals)){catalogue=data.festivals;intensities=data.intensities||intensities;accept(data.settings);}}
    catch{}finally{inFlight=false;}
  }
  function startPolling(){if(connected&&!document.hidden&&!pollId&&!preview)pollId=setInterval(refresh,15000);}
  function closeResources(){if(source){source.close();source=null;}if(pollId){clearInterval(pollId);pollId=null;}}
  function resumeResources() {
    if(preview||document.hidden)return;
    if(typeof window.EventSource!=='function'){startPolling();return;}
    if(source)return;
    source=new window.EventSource('/api/festivals/events');
    source.addEventListener('festival',event=>{try{accept(JSON.parse(event.data));}catch{}});
    source.onopen=()=>{if(pollId){clearInterval(pollId);pollId=null;}};
    source.onerror=startPolling;
  }
  function start(data,name) {
    closeResources();
    catalogue=Array.isArray(data?.festivals)?data.festivals:[];intensities=data?.intensities||{};settings=normalize(data?.settings);shopName=name||shopName;preview=data?.preview===true;
    if(!connected) {
      connected=true;
      listen(document,'click',event=>{
        if(!event.target.closest('button[data-festival-motion]')||reducedMotion?.matches)return;
        manuallyPaused=!manuallyPaused;try{localStorage.setItem('sssa-festival-motion',manuallyPaused?'paused':'auto');}catch{}syncMotion();
      });
      listen(document,'visibilitychange',()=>{syncMotion();if(document.hidden)closeResources();else{resumeResources();refresh();}});
      listen(window,'focus',refresh);
      listen(window,'pagehide',closeResources);
      listen(window,'pageshow',()=>{resumeResources();refresh();});
      if(reducedMotion?.addEventListener)listen(reducedMotion,'change',syncMotion);
    }
    resumeResources();
  }
  function beforeRender(){if(record?.element.isConnected)record.element.remove();}
  function dispose(){++generation;connected=false;closeResources();restore();while(listeners.length)listeners.pop()();connected=false;artworkPromise=null;}
  window.ShopFestivalEffects=Object.freeze({start,mount,beforeRender,syncMotion,dispose});
})();
