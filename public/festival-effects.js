/* Self-contained, locally drawn festival artwork. No trackers or animation libraries. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gold = 'var(--festival-gold)', petal = 'var(--festival-petal)', leaf = 'var(--festival-leaf)';
  const flower = (x,y,r=12) => `<g transform="translate(${x} ${y})">${Array.from({length:8},(_,i)=>`<ellipse rx="${r*.35}" ry="${r*.7}" cy="${-r*.6}" transform="rotate(${i*45})" fill="${i%2?petal:gold}"/>`).join('')}<circle r="${r*.3}" fill="#fff5d7"/></g>`;
  const star = (x,y,r=7) => `<path d="M${x} ${y-r}l${r*.3} ${r*.7} ${r*.7} ${r*.3}-${r*.7} ${r*.3}-${r*.3} ${r*.7}-${r*.3}-${r*.7}-${r*.7}-${r*.3} ${r*.7}-${r*.3}Z" fill="${gold}"/>`;
  const leaves = `<g fill="${leaf}">${[48,85,122,159,196,233,270].map((x,i)=>`<path class="festival-leaf" d="M${x} ${22+i%2*7}q-17 26 0 43q18-19 0-43Z"/>`).join('')}</g><path d="M28 19q132 33 264 0" stroke="${gold}" stroke-width="3"/>`;
  const lamp = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="5" rx="32" ry="7" fill="${gold}"/><path d="M-32 4q9 34 32 34T32 4" fill="${petal}" stroke="${gold}" stroke-width="2"/><path class="festival-flame" d="M0 3q-18-12 0-37Q18-8 0 3Z" fill="#ffe6a0"/><path d="M0 1q-6-6 0-16q6 10 0 16" fill="#fffdf0"/></g>`;
  const pot = (bonam=false) => `<g><path d="M122 89q-23 23-14 52q10 32 52 32t52-32q9-29-14-52Z" fill="${petal}" stroke="${gold}" stroke-width="3"/><ellipse cx="160" cy="89" rx="39" ry="9" fill="${gold}"/><path d="M110 125h100M122 148h76" stroke="${gold}" stroke-width="6"/><path d="M125 109l12 10 12-10 12 10 12-10 12 10 12-10" stroke="#fff3cb" stroke-width="3" fill="none"/>${bonam?`<path d="M128 80q-14-26-24-25q-1 23 24 25m16-2q-8-37-18-40q-7 25 18 40m35 0q8-37 18-40q7 25-18 40m17 2q14-26 24-25q1 23-24 25" fill="${leaf}"/>${lamp(160,58,.52)}`:`<path d="M127 89q-9-25 10-20q-1-20 18-9q14-22 20-3q24-9 17 11q16-2 7 22" fill="#fff4d7"/><path class="festival-steam" d="M146 48q-15-15 0-30m27 30q-15-15 0-30" stroke="#fff5d7" stroke-width="3" stroke-linecap="round" fill="none"/>`}</g>`;
  const bow = `<path d="M113 33q102 61 0 122M113 33l23 61-23 61" stroke="${gold}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M84 94h156m-20-12 20 12-20 12M89 85l14 9-14 9" stroke="#fff1d1" stroke-width="3" fill="none"/>`;
  const MOTIFS = {
    kite: `<circle cx="239" cy="49" r="29" fill="${gold}" opacity=".25"/><g class="festival-sway"><path d="m148 22 52 47-45 55-49-48Z" fill="${petal}" stroke="${gold}" stroke-width="3"/><path d="m148 22 7 102m-49-48 94-7" stroke="#fff2d5" stroke-width="2"/><path d="M155 124q-33 17-7 29t-25 25" stroke="${gold}" stroke-width="2" fill="none"/><path d="m146 144-15-2 4 13m10 8 14-4-1 13" fill="${gold}"/></g><g class="festival-float"><path d="m69 53 23 23-21 26-24-24Z" fill="${gold}"/><path d="m71 101-11 32" stroke="#fff2d5" stroke-width="2"/></g>${flower(245,142,18)}`,
    bonfire: `<ellipse cx="160" cy="166" rx="85" ry="10" fill="${gold}" opacity=".15"/><g stroke="#b87945" stroke-width="13" stroke-linecap="round"><path d="m113 163 88-26m-79-4 79 35"/></g><path class="festival-flame" d="M155 151q-75-9-27-77q-6 33 14 24q-11-42 27-78q-3 42 17 66q14-5 10-26q52 83-41 91" fill="${petal}"/><path class="festival-glow" d="M157 148q-39-6-17-45q0 19 15 14q-4-25 15-41q-1 26 9 42q18 29-22 30" fill="${gold}"/><g class="festival-embers" fill="${gold}"><circle cx="113" cy="60" r="3"/><circle cx="197" cy="42" r="4"/><circle cx="169" cy="17" r="2"/></g>`,
    pongal: `<g class="festival-sway" stroke="${leaf}" fill="none" stroke-width="7"><path d="m70 170 13-140m167 140-13-140"/><path d="M83 46q-30-28-47 1m47-6q24-34 43-16m111 21q30-28 47 1m-47-6q-24-34-43-16" stroke-width="5"/></g><g stroke="#fff3cd" stroke-width="2"><path d="m76 78 12 1m-15 36 12 1m-15 36 12 1m150-74 12-1m-9 38 12-1m-9 38 12-1"/></g>${pot()}${flower(77,158,10)}${flower(237,158,10)}`,
    cattle: `${leaves}<g transform="translate(8 3)"><path d="M87 104q4-25 39-25h57q21 0 27 23v40H94Z" fill="#fff2cf"/><path d="m109 139-4 31m79-31 4 31" stroke="#fff2cf" stroke-width="11" stroke-linecap="round"/><path d="M89 101q-26-30-32 8" stroke="${gold}" stroke-width="3" fill="none"/><path d="M204 94q-10-23 3-42q6 12 7 22m15 0q2-17 10-22q10 24-5 43" fill="${gold}"/><path d="M204 78q15-9 31 0l6 40q-4 17-21 17t-21-17Z" fill="#fff2cf"/><path d="m202 91-19-9 8 21m45-12 19-9-8 21" fill="${petal}"/><circle cx="210" cy="103" r="2" fill="#49302b"/><circle cx="229" cy="103" r="2" fill="#49302b"/><ellipse cx="220" cy="123" rx="15" ry="8" fill="${petal}"/><path d="M204 139q16 10 31 0" stroke="${gold}" stroke-width="4"/>${flower(133,97,10)}${flower(156,99,10)}${flower(179,97,10)}</g>`,
    trident: `<g class="festival-float"><path d="M102 21a30 30 0 1 0 35 39a27 27 0 0 1-35-39Z" fill="${gold}"/></g><path d="M180 163V43m-31-13v20q0 26 31 26t31-26V30m-39 19 8-24 8 24m-47-7 8-20 8 20m46 0 8-20 8 20" stroke="${gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="m163 97 34 24V97l-34 24Z" fill="${petal}" stroke="${gold}" stroke-width="2"/><g class="festival-float" fill="${leaf}"><path d="M100 125q-25-28-32-6q-3 18 32 6m0 0q25-28 32-6q3 18-32 6m0 0q-16-38 0-41q16 3 0 41"/></g>`,
    colours: `<g class="festival-colour-cloud"><circle cx="109" cy="103" r="47" fill="#f77897" opacity=".8"/><circle cx="166" cy="69" r="43" fill="#f7ca54" opacity=".85"/><circle cx="214" cy="112" r="50" fill="#6fcebc" opacity=".8"/><circle cx="156" cy="133" r="40" fill="#ae85dc" opacity=".85"/></g><g class="festival-float" fill="#fff8dc"><circle cx="90" cy="49" r="7"/><circle cx="242" cy="46" r="5"/><circle cx="260" cy="155" r="6"/><circle cx="63" cy="141" r="4"/></g><g fill="#d655a1"><circle cx="65" cy="88" r="5"/><circle cx="229" cy="29" r="4"/></g>`,
    toran: `${leaves}<path d="M108 123q13 48 52 48t52-48Z" fill="${petal}" stroke="${gold}" stroke-width="3"/><ellipse cx="160" cy="123" rx="52" ry="11" fill="${gold}"/><ellipse cx="160" cy="121" rx="44" ry="7" fill="#826b32"/><g fill="${leaf}"><ellipse cx="145" cy="120" rx="8" ry="3"/><ellipse cx="175" cy="121" rx="7" ry="3"/></g><path d="m193 117 29-36" stroke="#fff0d0" stroke-width="6" stroke-linecap="round"/>${flower(72,108,15)}${flower(251,130,12)}<g class="festival-float">${flower(235,85,9)}${flower(79,154,9)}</g>`,
    bow: `<circle class="festival-radiance" cx="167" cy="94" r="66" stroke="${gold}" stroke-width="1" stroke-dasharray="3 9" opacity=".5"/>${bow}${flower(79,145,15)}${flower(243,48,13)}<g class="festival-float">${flower(239,145,9)}</g>`,
    gada: `<g class="festival-radiance" stroke="${gold}" stroke-width="2" opacity=".5">${Array.from({length:12},(_,i)=>`<path d="M160 19v15" transform="rotate(${i*30} 160 82)"/>`).join('')}</g><g transform="rotate(-24 160 95)"><path d="M153 98h14v70h-14Z" fill="${gold}"/><path d="M148 161h24v10h-24Z" fill="${petal}"/><circle cx="160" cy="72" r="35" fill="${petal}" stroke="${gold}" stroke-width="4"/><ellipse cx="160" cy="72" rx="14" ry="35" stroke="${gold}" stroke-width="3" fill="none"/><path d="M125 72h70m-41-40h12v9h-12" stroke="${gold}" stroke-width="3"/></g>${flower(238,140,14)}`,
    lotus: `<g transform="translate(160 99)"><g class="festival-float">${[-60,-30,0,30,60].map(a=>`<path d="M0 50q-44-34 0-93q44 59 0 93Z" transform="rotate(${a} 0 50)" fill="${a%60===0?gold:petal}" stroke="#fff0c0" stroke-width="1.5"/>`).join('')}</g></g><g class="festival-glow" fill="${gold}" stroke="#fff2ce" stroke-width="2"><ellipse cx="72" cy="149" rx="27" ry="9"/><ellipse cx="72" cy="140" rx="27" ry="9"/><ellipse cx="72" cy="131" rx="27" ry="9"/><circle cx="242" cy="58" r="20"/><circle cx="242" cy="58" r="13" fill="none"/></g>`,
    rakhi: `<path class="festival-thread" d="M30 119q34-63 84-22m92 0q38 41 84-18M30 127q34-63 84-22m92 0q38 41 84-18" stroke="${petal}" stroke-width="4" fill="none"/><g class="festival-sway"><circle cx="160" cy="96" r="48" fill="${gold}"/><circle cx="160" cy="96" r="38" fill="${petal}" stroke="#fff0d0" stroke-width="2"/>${flower(160,96,30)}<circle cx="160" cy="96" r="9" fill="#fff2d0"/></g>${star(78,45)}${star(247,153)}`,
    flute: `<g transform="rotate(-22 156 112)"><rect x="61" y="105" width="190" height="16" rx="7" fill="${gold}"/><path d="M78 105v16m152-16v16" stroke="${petal}" stroke-width="5"/><g fill="var(--festival-deep)">${[115,137,159,181,203].map(x=>`<circle cx="${x}" cy="113" r="3"/>`).join('')}</g></g><g class="festival-sway"><path d="M143 99q-21-65 9-81q50 23 2 83" fill="${leaf}"/><ellipse cx="153" cy="53" rx="13" ry="20" fill="${gold}"/><ellipse cx="153" cy="53" rx="7" ry="12" fill="#29497b"/><path d="m154 69-10 42" stroke="${gold}" stroke-width="2"/></g><path d="M195 141q-15 31 17 33q35 0 21-33Z" fill="${petal}" stroke="${gold}" stroke-width="2"/><ellipse cx="214" cy="140" rx="20" ry="6" fill="#fff4d5"/><g class="festival-notes" stroke="${gold}" stroke-width="3" fill="${gold}"><path d="M88 64V44l16-5v20" fill="none"/><ellipse cx="84" cy="65" rx="5" ry="4"/><ellipse cx="100" cy="60" rx="5" ry="4"/></g>`,
    ganesha: `<circle cx="160" cy="92" r="70" stroke="${gold}" stroke-width="1" opacity=".35"/><g stroke="${gold}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M143 64q-17-24 17-37q34 13 17 37m-39 7q-35-25-41 7q-6 34 33 31m52-38q35-25 41 7q6 34-33 31M140 73q-7 27 10 36q24 10 13 26q-10 15-22 2m-7-25q-24 10-22 36m70-36q24 10 22 36m-80 9q36 18 72 0"/><path d="m152 52 8 6 8-6"/></g><circle cx="147" cy="82" r="2.5" fill="#fff2cd"/><circle cx="176" cy="82" r="2.5" fill="#fff2cd"/><path d="M231 158q2-16 12-23q10 7 12 23Z" fill="${petal}"/>${flower(78,143,14)}`,
    victory: `<path d="M85 167V91a75 75 0 0 1 150 0v76" stroke="${petal}" stroke-width="11" fill="none"/><path d="M95 167V91a65 65 0 0 1 130 0v76" stroke="${gold}" stroke-width="2" fill="none"/><g transform="translate(15 13) scale(.86)">${bow}</g><g class="festival-float" fill="${gold}"><path d="M61 62q-28 7-16 26q23-1 16-26m199 39q-28 7-16 26q23-1 16-26"/></g>${flower(87,92,12)}${flower(233,92,12)}`,
    bonam: `<circle cx="160" cy="94" r="76" stroke="${gold}" stroke-width="2" stroke-dasharray="2 9" opacity=".6"/>${pot(true)}${flower(93,140,15)}${flower(230,145,15)}<g class="festival-float">${flower(77,73,9)}${flower(252,86,10)}</g>`,
    flowers: `<ellipse cx="160" cy="168" rx="103" ry="10" fill="${gold}" opacity=".3"/>${[0,1,2,3,4].map(row=>{const y=153-row*25,n=9-row*2;return `<path d="M${68+row*20} ${y+8}h${184-row*40}" stroke="${leaf}" stroke-width="14"/>`+Array.from({length:n},(_,i)=>flower(76+row*21+i*21,y,13-row*.4)).join('');}).join('')}<path d="m154 36 6-19 6 19Z" fill="${gold}"/><g class="festival-float">${flower(54,72,10)}${flower(267,105,10)}</g>`,
    diya: `<g class="festival-fireworks">${[[-5,0],[139,-10]].map(([x,y])=>`<g transform="translate(${x} ${y})" stroke="${gold}" stroke-width="2">${Array.from({length:8},(_,i)=>`<path d="M84 26v15" transform="rotate(${i*45} 84 60)"/>`).join('')}</g>`).join('')}</g>${lamp(92,133,.76)}${lamp(160,118,1.1)}${lamp(237,135,.76)}<g class="festival-glow">${star(160,23,10)}${star(40,104,6)}${star(281,89,6)}</g>`,
    pookalam: `<g transform="translate(161 101)"><g class="festival-flower-ring"><circle r="70" fill="${leaf}"/><circle r="62" fill="${gold}"/><circle r="49" fill="${petal}"/>${Array.from({length:12},(_,i)=>`<g transform="rotate(${i*30})">${flower(0,-55,10)}</g>`).join('')}${flower(0,0,38)}</g></g><path d="M39 160q125 33 242-7q-20 33-142 29q-77-2-100-22" fill="${gold}"/><path d="m48 160-8-12m221 8 21-18" stroke="${gold}" stroke-width="4"/>`,
    lanterns: `<g class="festival-float"><path d="M151 29a55 55 0 1 0 54 80a49 49 0 0 1-54-80Z" fill="${gold}"/></g>${[65,250].map((x,i)=>`<g class="festival-lantern"><path d="M${x} 0v${39+i*26}" stroke="${gold}" stroke-width="2"/><g transform="translate(${x} ${42+i*26})"><path d="m0-6 16 17v40L0 65-16 51V11Z" stroke="${gold}" stroke-width="2" fill="var(--festival-deep)"/><path class="festival-glow" d="M-9 16H9v32l-9 8-9-8Z" fill="${gold}"/><path d="M0 17v36" stroke="var(--festival-deep)" stroke-width="2"/></g></g>`).join('')}<g class="festival-glow">${star(200,27)}${star(114,137)}${star(215,158)}</g>`,
    tree: `<path d="M154 143h13v30h-13Z" fill="${gold}"/><path d="m160 30-39 48h20l-39 42h25l-37 40h140l-37-40h25l-39-42h20Z" fill="${leaf}" stroke="${gold}" stroke-width="2"/><path d="m130 83 55 19m-67 21 83 23" stroke="${gold}" stroke-width="3"/><g class="festival-glow" fill="${petal}"><circle cx="145" cy="72" r="5"/><circle cx="176" cy="102" r="6"/><circle cx="140" cy="131" r="6"/><circle cx="188" cy="148" r="5"/></g>${star(160,24,14)}<path d="M64 143h38v30H64Zm161 6h32v24h-32Z" fill="${petal}"/><path d="M83 143v30m-19-21h38m139-3v24m-16-15h32" stroke="${gold}" stroke-width="3"/>`,
  };

  let catalogue=[], settings={enabled:false,festival:'sankranti'}, shopName='Sri Sai Shanmukha Auto Centre';
  let pollId=null, inFlight=false, connected=false, manualPaused=false;
  try { manualPaused=localStorage.getItem('sssa-festival-motion')==='paused'; } catch { /* Storage is optional. */ }
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const paused=()=>manualPaused || !!reducedMotion?.matches || !!document.hidden;
  const validTheme=theme=>theme && /^[a-z-]+$/.test(theme.id) && Object.hasOwn(MOTIFS,theme.motif);
  function scene(theme) {
    return `<div class="festival-scene festival-scene--${esc(theme.motif)}" aria-hidden="true"><svg class="festival-art" viewBox="0 0 320 190" xmlns="http://www.w3.org/2000/svg" focusable="false" fill="none">${MOTIFS[theme.motif]}</svg><div class="festival-particles">${Array.from({length:12},(_,i)=>`<i class="festival-particle festival-particle-${i+1}"></i>`).join('')}</div></div>`;
  }
  function content(theme, name) {
    return `<div class="container festival-banner-inner"><div class="festival-copy"><p class="festival-from">Warm wishes from ${esc(name)}</p><h2>${esc(theme.greeting)}</h2><p class="festival-message">${esc(theme.message)}</p><button type="button" class="festival-motion" data-festival-motion aria-pressed="${paused()}">${reducedMotion?.matches?'Motion reduced':paused()?'Play animation':'Pause animation'}</button></div>${scene(theme)}</div>`;
  }
  function syncMotion() {
    document.querySelectorAll('.festival-banner, .festival-preview').forEach(node=>{node.dataset.paused=String(paused());});
    document.querySelectorAll('[data-festival-motion]').forEach(button=>{
      button.setAttribute('aria-pressed',String(paused()));
      button.disabled=!!reducedMotion?.matches;
      button.textContent=reducedMotion?.matches?'Motion reduced':manualPaused?'Play animation':'Pause animation';
    });
  }
  function mount() {
    document.getElementById('festival-banner')?.remove();
    const theme=catalogue.find(f=>f.id===settings.festival);
    if(!settings.enabled || !validTheme(theme)) { delete document.body.dataset.festival; return; }
    document.body.dataset.festival=theme.id;
    document.querySelector('.site-header')?.insertAdjacentHTML('afterend',`<section id="festival-banner" class="festival-banner" aria-label="${esc(theme.name)} wishes" data-paused="${paused()}">${content(theme,shopName)}</section>`);
    syncMotion();
  }
  async function refresh() {
    if(inFlight || document.hidden)return;
    inFlight=true;
    try {
      const response=await fetch('/api/festivals',{cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      if(!Array.isArray(data.festivals) || typeof data.settings?.enabled!=='boolean')return;
      const changed=JSON.stringify(settings)!==JSON.stringify(data.settings);
      catalogue=data.festivals;settings=data.settings;
      if(changed)mount();
    } catch { /* Keep the last successful theme during a network interruption. */ }
    finally {inFlight=false;}
  }
  function resumePolling() {if(!pollId)pollId=setInterval(refresh,30000);}
  function start(data,name) {
    catalogue=Array.isArray(data?.festivals)?data.festivals:[];
    settings=data?.settings||{enabled:false};shopName=name||shopName;
    if(!connected) {
      connected=true;resumePolling();
      window.addEventListener('focus',refresh);
      window.addEventListener('pagehide',()=>{clearInterval(pollId);pollId=null;});
      window.addEventListener('pageshow',()=>{resumePolling();refresh();});
      document.addEventListener('visibilitychange',()=>{syncMotion();if(!document.hidden)refresh();});
    }
  }
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-festival-motion]') || reducedMotion?.matches)return;
    manualPaused=!manualPaused;
    try{localStorage.setItem('sssa-festival-motion',manualPaused?'paused':'auto');}catch{}
    syncMotion();
  });
  reducedMotion?.addEventListener('change',syncMotion);
  window.ShopFestivalEffects=Object.freeze({start,mount,syncMotion,
    preview(theme,name) {
      if(!validTheme(theme))return '';
      return `<div class="festival-preview" data-festival="${esc(theme.id)}" data-paused="${paused()}"><div class="festival-preview-band">${content(theme,name||shopName)}</div><div class="festival-preview-shop"><span>YOUR SHOP, IN SEASON</span><h3>Parts for every journey.</h3><p>Your catalogue, enquiries and shop information stay within the festival theme.</p><span class="festival-preview-cta">Explore spare parts <span aria-hidden="true">→</span></span></div></div>`;
    }
  });
})();
