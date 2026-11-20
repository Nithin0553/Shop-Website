// Original daily two-wheeler content. No source articles are scraped or republished.
export const NEWS_FEEDS = [
  'https://news.google.com/rss/search?q=' + encodeURIComponent('India motorcycle scooter two-wheeler industry when:7d') + '&hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=' + encodeURIComponent('India bike scooter electric vehicle parts safety maintenance when:7d') + '&hl=en-IN&gl=IN&ceid=IN:en'
];

export const TOPICS = [
  {key:'monsoon-brakes',category:'Maintenance Tips',image:'brake-care.webp',focus:'How rain affects motorcycle and scooter brakes, and the safe visual checks riders can make',angle:'rain, braking grip, qualified inspection'},
  {key:'helmet-buying',category:'Buying Guide',image:'bike-scooter.webp',focus:'How to choose a properly fitting BIS-certified two-wheeler helmet in India',angle:'fit, clear visor, certification and replacement after impacts'},
  {key:'tyre-markings',category:'Spare Parts Guide',image:'bike-scooter.webp',focus:'How to understand tyre sidewall markings when replacing two-wheeler tyres',angle:'manual specifications, matching fit, mechanic installation'},
  {key:'battery-health',category:'Maintenance Tips',image:'battery-care.webp',focus:'Simple ways to spot a weakening motorcycle or scooter battery',angle:'corrosion, cranking, safe testing and compatible replacement'},
  {key:'scooter-cvt',category:'Scooter Care',image:'scooter-care.webp',focus:'Early signs that an automatic scooter CVT belt needs professional inspection',angle:'wear, unusual noise and schedule checks'},
  {key:'air-filter',category:'Spare Parts Guide',image:'filter-care.webp',focus:'How to select the correct air filter for a motorbike or scooter',angle:'part fit, dusty conditions, owner manual'},
  {key:'chain-lube',category:'Bike Care',image:'chain-care.webp',focus:'Chain lubrication and alignment checks for everyday Indian motorcycle riders',angle:'maintenance intervals differ by model, avoid unsafe adjustments'},
  {key:'brake-pads',category:'Buying Guide',image:'brake-care.webp',focus:'What to know before buying replacement motorcycle brake pads or brake shoes',angle:'compatibility, material, warning signs, professional installation'},
  {key:'spark-plugs',category:'Spare Parts Guide',image:'oil-care.webp',focus:'Spark plug compatibility: what bike owners should check before buying',angle:'model-specific grades, gap, symptoms, authentic parts'},
  {key:'scooter-tyres',category:'Scooter Care',image:'scooter-care.webp',focus:'Scooter tyre maintenance for daily commuting and rainy conditions',angle:'pressure, tread, damage, manufacturer guidance'},
  {key:'engine-oil',category:'Buying Guide',image:'oil-care.webp',focus:'Choosing motorcycle engine oil without guessing viscosity or specification',angle:'owner manual, engine type, manufacturer API/JASO requirements'},
  {key:'lighting',category:'Maintenance Tips',image:'battery-care.webp',focus:'Night riding: checking motorcycle lights, indicators and reflectors',angle:'visibility, safe inspection, legal compliance'},
  {key:'clutch',category:'Spare Parts Guide',image:'chain-care.webp',focus:'How to recognize clutch slip and choose compatible replacement components',angle:'symptoms, cable adjustment by qualified mechanic, model fit'},
  {key:'bike-wash',category:'Bike Care',image:'bike-scooter.webp',focus:'Keeping a bike clean without damaging electrical and moving parts',angle:'gentle cleaning, avoid pressure jets, drying, corrosion'},
  {key:'fuel-efficiency',category:'Maintenance Tips',image:'oil-care.webp',focus:'Everyday maintenance habits that can help two-wheelers run efficiently',angle:'tyre pressure, service intervals, smooth riding, no promised mileage'},
  {key:'bearings',category:'Spare Parts Guide',image:'chain-care.webp',focus:'Signs of worn two-wheeler wheel bearings and when to seek help',angle:'roughness, wobble, safety and model-specific replacements'},
  {key:'scooter-filters',category:'Scooter Care',image:'filter-care.webp',focus:'What scooter owners should know about air filter inspection',angle:'dust, commute patterns, service schedule'},
  {key:'mirror-care',category:'Bike Care',image:'bike-scooter.webp',focus:'Adjusting motorcycle mirrors and keeping controls easy to reach',angle:'visibility, blind spots, safe ergonomic position'},
  {key:'authentic-spares',category:'Buying Guide',image:'brake-care.webp',focus:'How to avoid buying the wrong or counterfeit two-wheeler spare part',angle:'part number, fitment, packaging, safety-critical parts'},
  {key:'ev-tyres',category:'Buying Guide',image:'bike-scooter.webp',focus:'What electric scooter owners should verify before replacing tyres or brake parts',angle:'manufacturer fitment, battery safety, qualified technicians'},
  {key:'rain-riding',category:'Bike Care',image:'bike-scooter.webp',focus:'Pre-ride safety checklist for motorcycles during heavy rains',angle:'lights, tyres, brakes, standing water, visibility'},
  {key:'oil-leaks',category:'Maintenance Tips',image:'oil-care.webp',focus:'What bike owners should do when they notice engine oil leaking',angle:'check safely, avoid riding with serious leaks, mechanic diagnosis'},
  {key:'brake-fluid',category:'Maintenance Tips',image:'brake-care.webp',focus:'Brake fluid checks and why motorcycle owners should not mix unknown specifications',angle:'manual, replacement schedule, professional handling'},
  {key:'battery-replacement',category:'Buying Guide',image:'battery-care.webp',focus:'Checklist to confirm a replacement battery fits a bike or scooter',angle:'type, polarity, dimensions, capacity and safe disposal'}
];
export const CATEGORIES = ['Maintenance Tips','Spare Parts Guide','Buying Guide','Bike Care','Scooter Care'];
const IMAGE_BY_CATEGORY = {
  'Maintenance Tips':'oil-care.webp',
  'Spare Parts Guide':'filter-care.webp',
  'Buying Guide':'bike-scooter.webp',
  'Bike Care':'chain-care.webp',
  'Scooter Care':'scooter-care.webp'
};
export function indiaDate(date=new Date()){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function slugify(value){
  return String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,85).replace(/-$/,'');
}
export function words(value){return String(value||'').toLowerCase().match(/[a-z0-9]+/g)||[];}
export function similarity(a,b){
  const aa = new Set(words(a).filter(x=>x.length>2));
  const bb = new Set(words(b).filter(x=>x.length>2));
  let matching=0;for(const t of aa)if(bb.has(t))matching++;
  return matching / Math.max(1,aa.size+bb.size-matching);
}
export function decodeXml(value) {
  return String(value||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_,entity)=>{
      const e=entity.toLowerCase();
      if(e[0]==='#'){
        const numeric=e[1]==='x'?parseInt(e.slice(2),16):parseInt(e.slice(1),10);
        return numeric>=32&&numeric<=0x10ffff?String.fromCodePoint(numeric):' ';
      }
      return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[e]||'';
    }).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
export function parseNewsFeed(xml, now = new Date()) {
  const items=[];
  const maxAge=10*86400000;
  for(const match of String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
    const text=match[1];
    const capture=key=>new RegExp('<'+key+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+key+'>','i').exec(text)?.[1]||'';
    const title=decodeXml(capture('title')).slice(0,200);
    const source=decodeXml(capture('source')).slice(0,75);
    const date=new Date(decodeXml(capture('pubDate')));
    const link=decodeXml(capture('link'));
    if(!title||!link||!Number.isFinite(date.valueOf()))continue;
    if(date>now || now-date>maxAge)continue;
    let url;
    try{url=new URL(link);}catch{continue;}
    if(url.protocol!=='https:'||url.hostname!=='news.google.com')continue;
    if(!/\b(bike|motorcycle|motorbike|two.wheeler|scooter|ev|helmet|tyre|brake|bajaj|hero|tvs|yamaha|honda|suzuki|ather|ola)\b/i.test(title))continue;
    if(/\b(car|sedan|suv|truck|tractor|bus|car sales)\b/i.test(title)&&!/\b(scooter|motorcycle|bike|two.wheeler)\b/i.test(title))continue;
    items.push({title,source:source||'Automotive news',url:url.href,date:date.toISOString().slice(0,10)});
  }
  return items;
}
export function chooseTopic(existing, news, date=indiaDate()) {
  const used = new Set(existing.map(post=>post.topicKey).filter(Boolean));
  const usedSources = new Set(existing.map(post=>post.sourceUrl).filter(Boolean));
  const freshNews=news.filter(item=>!usedSources.has(item.url));
  const dayNumber=Math.floor(Date.parse(date+'T00:00:00Z')/86400000);
  if(dayNumber%4===0&&freshNews.length){
    const ranked=[...freshNews].sort((a,b)=>b.date.localeCompare(a.date));
    const selected=ranked[dayNumber%Math.min(ranked.length,6)];
    return {
      key:'industry-'+slugify(selected.title).slice(0,50),
      focus:'A practical, cautious explanation for Indian two-wheeler owners of this recent motorcycle/scooter industry headline',
      angle:'Explain what is stated in the headline, what is not yet confirmed, and what buyers should check for themselves.',
      category:'Buying Guide',image:IMAGE_BY_CATEGORY['Buying Guide'],
      source:selected
    };
  }
  // Rotate guide topics; avoid reusing an already published topic until the library is exhausted.
  for(let attempt=0;attempt<TOPICS.length;attempt++){
    const topic=TOPICS[(dayNumber+attempt*7)%TOPICS.length];
    if(!used.has(topic.key))return topic;
  }
  // When guide topics are exhausted, fresh news still provides genuinely new material.
  if(freshNews.length){
    const selected=[...freshNews].sort((a,b)=>b.date.localeCompare(a.date))[0];
    return {key:'industry-'+slugify(selected.title).slice(0,50),
      focus:'How this two-wheeler news headline may affect everyday riders',
      angle:'Stick to facts present in the source headline. Offer general practical questions and precautions.',
      category:'Buying Guide',image:'bike-scooter.webp',source:selected};
  }
  return null;
}
export function validateDraft(raw, existing, topic, date){
  if(!raw || typeof raw!=='object')throw Error('Model returned an invalid article object.');
  const title=String(raw.title||'').trim();
  const summary=String(raw.summary||'').trim();
  const body=String(raw.body||'').trim().replace(/\r/g,'');
  if(title.length<22||title.length>130||/[<>]/.test(title))throw Error('Draft title failed editorial checks.');
  if(summary.length<55||summary.length>260||/[<>]/.test(summary))throw Error('Draft summary failed editorial checks.');
  if(body.length<1400||body.length>7500||body.split(/\s+/).length<280||body.split(/\s+/).length>1050)throw Error('Draft body is too short or too long.');
  if((body.match(/^## /gm)||[]).length<3)throw Error('Draft needs at least three section headings.');
  if(/<\s*script|<\s*iframe|<\s*img|javascript:|data:/i.test(body))throw Error('Draft contains unsupported markup.');
  if(/\b(guarantee|miracle|100% safe|zero risk|definitely launched|confirmed price)\b/i.test(body))throw Error('Draft contains risky claims.');
  if(existing.some(p=>p.title.toLowerCase()===title.toLowerCase()||similarity(title,p.title)>.73))throw Error('Draft is too similar to an existing article.');
  if(topic.source && !/news\.google\.com/.test(topic.source.url))throw Error('Unexpected news source.');
  const suffix=date.replaceAll('-','');
  let slug=slugify(title)+'-'+suffix;
  if(existing.some(post=>post.slug===slug))throw Error('Article slug already exists.');
  const safety='For model-specific specifications, replacement intervals and safety-critical repairs, follow your vehicle owner’s manual and consult a qualified mechanic.';
  const attribution=topic.source?
    '\n\n## News reference\n- '+topic.source.source+': '+topic.source.title+'\n- '+topic.source.url:
    '';
  return {
    id:'auto-'+date, slug, title, summary,
    category:topic.category, image:topic.image,
    readingMinutes:Math.max(2,Math.ceil(body.split(/\s+/).length/200)),
    publishedAt:date,status:'published',
    topicKey:topic.key,
    ...(topic.source?{sourceUrl:topic.source.url}:{}),
    autoGenerated:true,
    body:body+attribution+'\n\n'+safety+'\n\nPrepared with AI assistance for general rider education; not a substitute for professional diagnosis.'
  };
}
