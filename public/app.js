/* Sri Sai Shanmukha Auto Centre — customer website. No build step required. */
const BRANDS = [
  {name:'Hero',logoCard:'brand-card-hero.png'},
  {name:'Honda',logoCard:'brand-card-honda.png'},
  {name:'Bajaj',logoCard:'brand-card-bajaj.png'},
  {name:'TVS',logoCard:'brand-card-tvs.png'},
  {name:'Yamaha',logoCard:'brand-card-yamaha.png'},
  {name:'Suzuki',logoCard:'brand-card-suzuki.png'},
  {name:'Royal Enfield',logoCard:'brand-card-royal-enfield.png'},
];
const BRAND_NAMES = BRANDS.map(brand => brand.name);
const CATEGORIES = [
  {id:'engine',title:'Engine Parts',sub:'Essential engine components',image:'category-engine.webp',homeCard:'category-engine.webp',icon:'settings',examples:['Gaskets','Pistons & rings','Valves','Engine seals'],keywords:'motor bike scooter motor engine gasket piston'},
  {id:'brakes',title:'Brake Parts',sub:'Parts for safer stopping',image:'category-brakes.webp',homeCard:'category-brakes.webp',icon:'disc',examples:['Brake pads','Brake shoes','Brake discs','Brake cables'],keywords:'braking shoes pads disc caliper'},
  {id:'clutch',title:'Clutch Parts',sub:'Clutch and drive components',image:'category-clutch.webp',homeCard:'category-clutch.webp',icon:'layers',examples:['Clutch plates','Clutch springs','Clutch cables','Clutch assemblies'],keywords:'plates clutch assembly springs'},
  {id:'chain',title:'Chain & Sprockets',sub:'Keep the drive running smoothly',image:'category-chain.webp',homeCard:'category-chain.webp',icon:'link',examples:['Drive chains','Front sprockets','Rear sprockets','Chain kits'],keywords:'chains sprocket kits drive'},
  {id:'filters',title:'Filters & Lubrication',sub:'Everyday maintenance items',image:'category-filters.webp',homeCard:'category-filters.webp',icon:'filter',examples:['Air filters','Oil filters','Fuel filters','Lubrication items'],keywords:'air oil fuel filter maintenance'},
  {id:'electrical',title:'Electrical & Batteries',sub:'Electrical essentials',image:'category-electrical.webp',homeCard:'category-electrical.webp',icon:'zap',examples:['Batteries','Spark plugs','Bulbs','Switches & wiring'],keywords:'electric battery plug spark bulb wiring'},
  {id:'cables',title:'Cables & Bearings',sub:'Reliable small components',image:'category-cables.webp',homeCard:'category-cables.webp',icon:'wrench',examples:['Control cables','Wheel bearings','Rubber bushes','Levers'],keywords:'bearings cables rubber bush cable'},
  {id:'body',title:'Body & Accessories',sub:'Complete the look and fit',image:'category-body.webp',homeCard:'category-body.webp',icon:'package',examples:['Body panels','Mirrors','Mudguards','General accessories'],keywords:'body panels lights accessory accessories mirrors'},
  {id:'tyres',title:'Tires & Tubes',sub:'Road-grip essentials for daily riding',image:'category-tyres.png',homeCard:'category-tyres.png',icon:'disc',examples:['Tyres','Tubes','Valve items','Wheel fitment support'],keywords:'tyre tires tyre tube mrf ceat tvs tube wheel'},
];
const SPOTLIGHT_SECTIONS = [
  {id:'tyres',title:'Tires & Tubes',tag:'Road grip essentials',description:'Tyres and tubes available for everyday commuting and workshop needs.',image:'category-tyres.png',highlights:['Tyres','Tubes','Fitment guidance'],brands:[{name:'CEAT',image:'logo-ceat.png'},{name:'TVS',image:'logo-tvs-tyres.png'},{name:'MRF',image:'logo-mrf.png'}],buttonLabel:'Ask for tyres & tubes'},
  {id:'helmets',title:'Helmets',tag:'Highlighted safety gear',description:'Premium-looking helmets for riders looking for comfort, style and daily safety.',image:'promo-helmets.png',highlights:['Rider safety','Multiple sizes','Daily use helmets'],brands:[],buttonLabel:'Enquire about helmets'},
  {id:'oils',title:'Engine Oils',tag:'Highlighted maintenance essentials',description:'Engine oil options for smooth performance, cleaner running and periodic servicing.',image:'oil-care.webp',highlights:['2-wheeler oils','Service interval support','Trusted brands'],brands:[{name:'Castrol',image:'logo-castrol.png'},{name:'GS Caltex',image:'logo-gs-caltex.png'},{name:'Shell Oil',image:'logo-shell.png'}],buttonLabel:'Enquire about engine oils'},
  {id:'activa',title:'Activa Accessories',tag:'Highlighted scooter accessories',description:'Popular Activa accessories available to upgrade appearance, comfort and convenience.',image:'promo-activa.png',highlights:['Mirrors & trims','Grips & guards','Body add-ons'],brands:[],buttonLabel:'Ask about Activa accessories'},
];
const icons={
  bike:'<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="m5.5 17.5 5-9h4l4 9H5.5l7-6m1-3-2-3h-3"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  diagonal:'<path d="M7 17 17 7M8 7h9v9"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.5 19.5 0 0 1-8.5-3 19.2 19.2 0 0 1-6-6 19.5 19.5 0 0 1-3-8.6A2 2 0 0 1 4.3 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.45 2.1L8.3 10a16 16 0 0 0 5.7 5.7l1.3-1.2a2 2 0 0 1 2.1-.45c.9.4 1.9.6 2.9.7a2 2 0 0 1 1.7 1.95Z"/>',
  map:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  whatsapp:'<path d="M20.5 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.3-4.6A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M9 9c.1 2.7 2.4 4.8 5 5l1.6-1.3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16.4 16.4 4.1 4.1"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  close:'<path d="M5 5l14 14M19 5 5 19"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m8 12 3 3 5-6"/>',
  rupee:'<path d="M6 5h12M6 9h12M6 5c8 0 8 10 0 10l9 6"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 6a3 3 0 0 1 0 6m1 8v-2a6 6 0 0 0-2-4.5"/>',
  package:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V7m-9 5v10"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1m0-14.2L17 7M7 17l-2.1 2.1"/>',
  disc:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M3 12h3m6 6v3m6-9h3"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  link:'<path d="m10 13 4-4M8 16H6a4 4 0 0 1 0-8h4m4 0h4a4 4 0 0 1 0 8h-4"/>',
  filter:'<path d="M4 5h16l-6.5 7v6l-3 2v-8L4 5Z"/>',
  zap:'<path d="m13 2-9 11h7l-1 9 10-12h-7l0-8Z"/>',
  wrench:'<path d="M14 5a6 6 0 0 0-8 8l-4 4a3 3 0 0 0 5 5l4-4a6 6 0 0 0 8-8l-4 4-4-4 3-5Z"/>',
  book:'<path d="M3 5a2 2 0 0 1 2-2h6v18H5a2 2 0 0 0-2 2V5Zm18 0a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 1 2 2V5Z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  send:'<path d="m22 2-7 20-4-9-9-4 20-7Zm0 0L11 13"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  star:'<path d="m12 2 3 6.5 7 .9-5 5 .9 7.1-5.9-3.3-5.9 3.3.9-7.1-5-5 7-.9L12 2Z"/>',
  copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  sliders:'<path d="M4 7h16M4 17h16M9 4v6m6 4v6"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/>',
};
const ico=(name,size=20)=>`<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.package}</svg>`;
const esc = v => String(v ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
// Bust old browser caches when shop imagery is refreshed. Increment this token when asset files change.
const ASSET_VERSION = '20261107-visual-polish';
const asset = img => `/assets/${encodeURIComponent(img)}?v=${ASSET_VERSION}`;
const siteDefault={shopName:'Sri Sai Shanmukha Auto Centre',tagline:'Two-Wheeler Spare Parts & Accessories',phone:'',whatsapp:'',email:'',address:'',city:'',hours:'',mapsUrl:''};
let SITE={...siteDefault}, BLOGS=[], menuOpen=false, blogCategory='All', blogQuery='', partsBrand='All',partsQuery='',formPending=false,subscribing=false;
const loadingArticles = new Set();
const app=document.getElementById('app');

function smartLink(path,text,attrs=''){return `<a href="${esc(path)}" ${attrs}>${text}</a>`;}
function whatsappUrl(message='Hello, I would like to enquire about two-wheeler spare parts.') {
  const digits=(SITE.whatsapp||'').replace(/\D/g,'');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`:'';
}
function phoneUrl(){return SITE.phone ? `tel:${SITE.phone.replace(/[^+\d]/g,'')}`:'';}
function mapsUrl(){if(SITE.mapsUrl)return SITE.mapsUrl;if(SITE.address)return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address+(SITE.city?', '+SITE.city:''))}`;return '';}
function shopMark(){return esc(SITE.shopName||siteDefault.shopName).replace(/\s+Auto Centre$/i,'<br/>Auto Centre');}
function brandName(brand){return brand==='Royal Enfield'?'ROYAL ENFIELD':brand.toUpperCase();}
function marquee(items, renderer, className='', duration='32s'){return `<div class="marquee-shell ${className}" style="--marquee-duration:${duration}"><div class="marquee-track">${[...items,...items].map((item,index)=>renderer(item,index,index>=items.length)).join('')}</div></div>`;}
function brandCard(item,clone=false){return `<a class="brand-card logo-card ${clone?'is-clone':''}" href="/spare-parts?brand=${encodeURIComponent(item.name)}" aria-label="Explore ${esc(item.name)} spare parts"><img src="${asset(item.logoCard)}" alt="${esc(item.name)} logo" loading="lazy"/></a>`;}
function brandGrid(){return marquee(BRANDS,brandCard,'brand-marquee','28s');}
function homeCategoryCard(c,clone=false){return `<a class="category-card compact-category marquee-category ${clone?'is-clone':''}" href="/spare-parts?category=${esc(c.id)}" aria-label="Explore ${esc(c.title)}"><span class="marquee-part-frame"><span class="marquee-part-photo"><img class="compact-card-photo" src="${asset(c.homeCard||c.image)}" alt="${esc(c.title)}" loading="lazy"/></span><span class="marquee-part-title">${esc(c.title)}</span></span></a>`;}
function spotlightSection(){const cards=SPOTLIGHT_SECTIONS.map(section=>`<article class="spotlight-card spotlight-${section.id}"><div class="spotlight-art"><img src="${asset(section.image)}" alt="${esc(section.title)}" loading="lazy"/></div><div class="spotlight-copy"><span class="spotlight-tag">${esc(section.tag)}</span><h3>${esc(section.title)}</h3><p>${esc(section.description)}</p><ul class="spotlight-list">${section.highlights.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>${section.brands.length?`<div class="spotlight-brand-row">${section.brands.map(brand=>`<span class="spotlight-brand-pill"><img src="${asset(brand.image)}" alt="${esc(brand.name)} logo" loading="lazy"/></span>`).join('')}</div>`:''}<a class="btn btn-primary btn-small" href="/contact?part=${encodeURIComponent(section.title)}">${esc(section.buttonLabel)} ${ico('arrow',16)}</a></div></article>`).join('');return `<section class="section spotlight-section" id="special-sections"><div class="container">${sectionTitle('','Highlighted In Our Shop','Premium-looking featured sections for popular rider essentials and scooter accessories.')}<div class="spotlight-grid">${cards}</div></div></section>`;}
function header(active) {
  const nav=[['/','Home'],['/about','About'],['/spare-parts','Spare Parts'],['/brands','Brands'],['/blogs','Blogs'],['/contact','Contact']];
  return `<header class="site-header"><div class="container header-inner">
    <a class="logo" href="/" aria-label="Sri Sai Shanmukha Auto Centre home"><span class="logo-icon">${ico('bike',47)}</span><span class="logo-text"><strong>${shopMark()}</strong><small>${esc(SITE.tagline||siteDefault.tagline)}</small></span></a>
    <nav id="primary-nav" class="primary-nav ${menuOpen?'is-open':''}" aria-label="Main navigation">${nav.map(([href,label])=>`<a href="${href}" class="${active===href?'active':''}" ${active===href?'aria-current="page"':''}>${label}${href==='/spare-parts'?ico('chevron',13):''}</a>`).join('')}</nav>
    <button class="menu-toggle" id="menu-toggle" aria-label="${menuOpen?'Close':'Open'} menu" aria-expanded="${menuOpen}" aria-controls="primary-nav">${ico(menuOpen?'close':'menu',25)}</button>
  </div></header>`;
}
function footer() {
  const socials=[['Facebook',SITE.facebookUrl,'facebook'],['Instagram',SITE.instagramUrl,'instagram']].filter(x=>x[1]);
  return `<footer class="footer"><div class="container footer-main">
    <div class="footer-brand"><a class="footer-logo" href="/">${ico('bike',44)}<span>${shopMark()}<small>${esc(SITE.tagline||siteDefault.tagline)}</small></span></a></div>
    <div class="footer-about"><p>Your trusted local shop for quality two-wheeler spare parts, accessories and helpful support.</p><span class="telugu">శ్రీ సాయి షణ్ముఖ ఆటో సెంటర్</span></div>
    <div class="footer-links"><h4>Quick Links</h4><div><a href="/">Home</a><a href="/about">About</a><a href="/spare-parts">Spare Parts</a><a href="/brands">Brands</a><a href="/blogs">Blogs</a><a href="/contact">Contact</a></div></div>
    <div class="footer-social"><h4>Follow Us</h4>${socials.length?`<div class="social-icons">${socials.map(([name,href,key])=>`<a class="social-icon social-${key}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${name}">${key==='facebook'?'f':'◎'}</a>`).join('')}</div>`:'<p>Connect with our shop for updates and enquiries.</p>'}<a class="footer-reach" href="/contact">Get in touch ${ico('arrow',14)}</a></div>
  </div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Sri Sai Shanmukha Auto Centre.</span><span>Two-Wheeler Spare Parts & Accessories</span></div></footer>`;
}
function sectionTitle(kicker,title,lead='',center=true) {
  return `<div class="section-heading design-heading ${center?'centered':''}"><span class="design-label">${kicker}</span><h2>${title}</h2>${lead?`<p>${lead}</p>`:''}</div>`;
}
function pageHero(kicker,title,subtitle){return `<section class="page-hero"><div class="container"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${subtitle}</p></div></section>`;}
function showcaseHero({kind='home',titleBefore,titleAccent,subtitle,primaryText,primaryHref,primaryIcon='phone',secondaryText,secondaryHref}) {
  return `<section class="showcase-hero showcase-${kind}"><div class="container showcase-layout"><div class="showcase-copy">
    <span class="showcase-kicker">SRI SAI SHANMUKHA AUTO CENTRE <i></i></span>
    <h1>${titleBefore}<span>${titleAccent}</span></h1><p>${subtitle}</p><div class="showcase-actions">
      <a class="btn btn-primary" href="${esc(primaryHref)}">${ico(primaryIcon,20)} ${primaryText}</a>
      <a class="btn btn-outline" href="${esc(secondaryHref)}">${ico('package',20)} ${secondaryText}</a>
    </div></div><div class="showcase-image"><img src="${asset('hero-shop.webp')}" alt="Motorcycle, scooter and an arrangement of two-wheeler spare parts" fetchpriority="high"/></div></div></section>`;
}
function featureGrid(){
  const features=[['shield','Quality Spare Parts','Parts selected with fit and reliability in mind.'],['rupee','Affordable Prices','Practical spare-parts options at reasonable prices.'],['users','Mechanic Support','We also help mechanics find suitable parts.'],['package','Wide Availability','A broad selection of popular two-wheeler parts.']];
  return `<div class="design-feature-grid">${features.map(([icon,title,desc])=>`<div class="design-feature"><span>${ico(icon,35)}</span><div><h3>${title}</h3><p>${desc}</p></div></div>`).join('')}</div>`;
}
function dateLabel(value){const d=new Date(`${value||'2026-11-07'}T12:00:00`);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}
function blogCategoryCounts(){return ['Maintenance Tips','Buying Guide','Spare Parts Guide','Bike Care','Scooter Care'].map(name=>({name,count:BLOGS.filter(p=>p.category===name).length}));}
function inquiryForm(){
  const params=new URLSearchParams(location.search);
  const brand=BRANDS.includes(params.get('brand'))?params.get('brand'):'';
  const part=(params.get('part')||'').slice(0,130);
  return `<form id="enquiry-form" novalidate>
    <div class="form-row"><div class="field"><label for="customer-name">Name *</label><input id="customer-name" name="name" required minlength="2" maxlength="90" autocomplete="name" placeholder="Enter your name"/></div><div class="field"><label for="customer-phone">Phone *</label><input id="customer-phone" name="phone" type="tel" required maxlength="32" autocomplete="tel" placeholder="Enter your phone number"/></div></div>
    <div class="form-row"><div class="field"><label for="customer-brand">Bike Brand</label><select id="customer-brand" name="brand"><option value="">Select bike brand</option>${BRANDS.map(b=>`<option value="${esc(b)}" ${brand===b?'selected':''}>${esc(b)}</option>`).join('')}<option value="Other">Other</option></select></div><div class="field"><label for="customer-part">Required Part *</label><input id="customer-part" name="part" maxlength="130" placeholder="e.g., Brake pad, chain kit, filter" value="${esc(part)}"/></div></div>
    <div class="field"><label for="customer-model">Vehicle model / year</label><input id="customer-model" name="model" maxlength="100" placeholder="e.g., Honda Activa 6G / 2022"/></div>
    <div class="field"><label for="customer-message">Message (Optional)</label><textarea id="customer-message" name="message" rows="4" maxlength="1500" placeholder="Tell us more (model, year, quantity, part number…)"></textarea></div>
    <div class="hidden-field" aria-hidden="true"><label for="website-field">Website</label><input id="website-field" name="website" tabindex="-1" autocomplete="off"/></div>
    <div class="form-feedback" id="form-feedback" role="status" aria-live="polite"></div>
    <button class="btn btn-primary submit-btn" id="submit-enquiry" type="submit">${ico('send',19)} Send Inquiry</button>
    <p class="form-privacy">Enquiries are saved privately for the shop to follow up. Please do not include sensitive personal information.</p>
  </form>`;
}
function shopContactSection(){
  const map=mapsUrl();
  return `<section class="shop-contact-section" id="visit-us"><div class="container shop-contact-layout">
    <div class="shop-contact-left"><div class="design-heading left-heading"><h2>Get in Touch / Visit Our Store</h2><p>For spare parts, availability, or any assistance, reach out or visit our shop.</p></div>
      <div class="shop-contact-columns"><div class="contact-list design-contact-list">
        <div class="contact-item"><div class="contact-item-icon">${ico('phone',23)}</div><div><strong>Call Us</strong><p>${SITE.phone?`<a href="${phoneUrl()}">${esc(SITE.phone)}</a>`:'<a href="/contact">Send a phone enquiry</a>'}</p></div></div>
        <div class="contact-item"><div class="contact-item-icon whatsapp-icon">${ico('whatsapp',23)}</div><div><strong>Chat on WhatsApp</strong><p>${SITE.whatsapp?`<a href="${esc(whatsappUrl())}" target="_blank" rel="noopener noreferrer">Ask about availability</a>`:'<a href="/contact">Send an enquiry</a>'}</p></div></div>
        <div class="contact-item"><div class="contact-item-icon">${ico('map',23)}</div><div><strong>Our Address</strong><p>${SITE.address?esc(SITE.address):'Store address coming soon'}${SITE.city?`, ${esc(SITE.city)}`:''}</p></div></div>
        <div class="contact-item"><div class="contact-item-icon">${ico('clock',23)}</div><div><strong>Business Hours</strong><p class="preserve-lines">${SITE.hours?esc(SITE.hours):'Contact us for current hours'}</p></div></div>
      </div><div class="contact-map design-map"><div class="map-streets"></div><span class="map-pin">${ico('map',27)}</span><div class="map-callout"><strong>${esc(SITE.shopName)}</strong><span>${SITE.city?esc(SITE.city):'Two-wheeler spare parts shop'}</span></div>${map?`<a class="map-link" href="${esc(map)}" target="_blank" rel="noopener noreferrer">Get Directions ${ico('diagonal',14)}</a>`:'<span class="map-placeholder">Map location will appear when configured</span>'}</div></div>
    </div><div class="shop-contact-right"><div class="design-heading left-heading"><h2>Send an Inquiry</h2><p>Tell us the part you need. Our team can contact you about it.</p></div><div class="enquiry-panel design-enquiry-panel">${inquiryForm()}</div></div>
  </div></section>`;
}
function contactCta() {
  const phone=SITE.phone?`<a href="${phoneUrl()}">${esc(SITE.phone)}</a>`:'<a href="/contact">Contact our shop</a>';
  const addr=SITE.address?`${esc(SITE.address)}${SITE.city?', '+esc(SITE.city):''}`:'View contact details';
  const addrLink=SITE.address&&mapsUrl()?esc(mapsUrl()):'/contact';
  return `<section class="contact-band"><div class="container contact-strip">
    <div class="strip-detail">${ico('phone',30)}<div><strong>Call Us</strong>${phone}</div></div>
    <div class="strip-detail">${ico('map',30)}<div><strong>Our Address</strong><a href="${addrLink}" ${SITE.address?'target="_blank" rel="noopener noreferrer"':''}>${addr}</a></div></div>
    <div class="strip-detail">${ico('clock',30)}<div><strong>Business Hours</strong><span class="preserve-lines">${esc(SITE.hours||'Contact us for current hours')}</span></div></div>
    ${SITE.whatsapp?`<a class="strip-whatsapp" href="${esc(whatsappUrl())}" target="_blank" rel="noopener noreferrer">${ico('whatsapp',21)} Chat on WhatsApp</a>`:`<a class="strip-whatsapp" href="/contact">${ico('send',20)} Send an Enquiry</a>`}
  </div></section>`;
}
function categoryCard(c){return `<a class="category-card compact-category" href="/spare-parts?category=${esc(c.id)}" aria-label="Explore ${esc(c.title)}"><span class="category-image"><img src="${asset(c.image)}" alt="${esc(c.title)}" loading="lazy"/></span><span class="category-name">${esc(c.title)}</span></a>`;}
function postCard(p){return `<article class="blog-card design-blog-card"><a class="blog-image" href="/blogs/${esc(p.slug)}"><img src="${asset(p.image)}" alt="${esc(p.title)}" loading="lazy"/><span class="pill over-image">${esc(p.category)}</span></a><div class="blog-card-content"><h3><a href="/blogs/${esc(p.slug)}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p><div class="blog-card-bottom"><span class="blog-date">${ico('calendar',15)} ${dateLabel(p.publishedAt)}</span><a class="read-more-button" href="/blogs/${esc(p.slug)}">Read More ${ico('arrow',15)}</a></div></div></article>`;}
function home(){return `<main id="main">
  ${showcaseHero({titleBefore:'Your Trusted Source for',titleAccent:'Two-Wheeler Spare Parts',subtitle:'Quality spare parts for all major two-wheeler brands at reasonable prices. Keep your bike or scooter running smoothly and reliably.',primaryText:SITE.phone?'Call Now':'Contact Us',primaryHref:SITE.phone?phoneUrl():'/contact',secondaryText:'Explore Parts',secondaryHref:'/spare-parts'})}
  <section class="section design-brand-section premium-section" id="our-brands"><div class="container">${sectionTitle('','Popular Brands','Spare parts for leading two-wheeler brands under one roof.')}${brandGrid()}</div></section>
  <section class="section design-categories-section premium-section" id="categories"><div class="container">${sectionTitle('','Spare Parts Categories','Find the right spare parts for your two-wheeler, quickly and easily.')} ${marquee(CATEGORIES,homeCategoryCard,'parts-marquee','34s')}</div></section>
  ${spotlightSection()}
  <section class="section design-why-section"><div class="container">${sectionTitle('','Why Choose Us?','A reliable local partner for your two-wheeler spare parts needs.')}${featureGrid()}</div></section>
  <section class="section design-home-blogs"><div class="container">${sectionTitle('','Latest Blogs','Tips, maintenance guides and two-wheeler care advice.')}<div class="blogs-grid">${BLOGS.slice(0,3).map(postCard).join('')}</div><div class="view-blogs"><a class="text-link" href="/blogs">View all blogs ${ico('arrow',17)}</a></div></div></section>
  ${contactCta()}
</main>`;}
function parts(){const params=new URLSearchParams(location.search), filter=params.get('category')||'';partsBrand=BRAND_NAMES.includes(params.get('brand'))?params.get('brand'):partsBrand;const matches=CATEGORIES.filter(c=>(!filter||c.id===filter)&&(!partsQuery||`${c.title} ${c.sub} ${c.examples.join(' ')} ${c.keywords}`.toLowerCase().includes(partsQuery.toLowerCase())));return `<main id="main">${pageHero('OUR SPARE PARTS','Find parts for your next ride.','Browse categories, choose your two-wheeler brand and enquire about the exact part you need.')}<section class="section parts-section"><div class="container"><div class="parts-toolbar"><label class="search-control">${ico('search',20)}<input id="parts-search" type="search" placeholder="Search brakes, engine, filters…" aria-label="Search spare parts categories" value="${esc(partsQuery)}" /></label><label class="select-wrap"><span>Vehicle brand</span><select id="parts-brand"><option value="All">All brands</option>${BRANDS.map(b=>`<option value="${esc(b.name)}" ${partsBrand===b.name?'selected':''}>${esc(b.name)}</option>`).join('')}</select></label><button class="btn btn-reset" id="parts-reset" type="button">Clear filters</button></div><div class="results-note">${matches.length} part categor${matches.length===1?'y':'ies'} ${partsBrand!=='All'?`for ${esc(partsBrand)}`:''}</div><div class="part-list">${matches.map(c=>`<article class="part-list-card"><div class="part-list-photo"><img src="${asset(c.image)}" alt="${esc(c.title)}"/></div><div class="part-list-body"><div class="part-topline">${ico(c.icon,20)} <span>SPARE PARTS</span></div><h2>${esc(c.title)}</h2><p>${esc(c.sub)}. Common requests include:</p><div class="part-tags">${c.examples.map(e=>`<span>${esc(e)}</span>`).join('')}</div></div><div class="part-list-action"><a class="btn btn-primary btn-small" href="/contact?part=${encodeURIComponent(c.title)}${partsBrand!=='All'?'&brand='+encodeURIComponent(partsBrand):''}">Enquire ${ico('arrow',16)}</a><small>Confirm fitment & stock</small></div></article>`).join('')}</div>${matches.length?'':`<div class="empty-state">${ico('search',30)}<h3>No matching categories</h3><p>Try another keyword or clear the filters.</p></div>`}<div class="notice-card">${ico('info',23)} <div><strong>Looking for a specific item?</strong><p>We don't show live inventory or prices online. Send us your vehicle make, model, year and required part so we can confirm compatibility and availability.</p></div><a href="/contact" class="inline-link">Ask us ${ico('arrow',16)}</a></div></div></section>${contactCta()}</main>`;}
function brands(){return `<main id="main">${pageHero('BRANDS WE SUPPORT','For the bike in your garage.','Explore spare-part enquiries for popular two-wheeler manufacturers.')}<section class="section premium-section"><div class="container">${sectionTitle('BRANDS','Start with your two-wheeler brand','Choose a manufacturer, then browse the categories of parts we can help you find.')}<div class="brand-grid static-brand-grid">${BRANDS.map(item=>brandCard(item,false)).join('')}</div><div class="brand-help"><div class="brand-help-icon">${ico('info',27)}</div><div><h3>Not sure about a part number?</h3><p>Tell us your vehicle brand, model, year and the part you are looking for. We can help you narrow down compatible options.</p></div><a class="btn btn-primary" href="/contact">Ask for help ${ico('arrow',17)}</a></div><p class="disclaimer">Brand names and logos are shown only to identify vehicle makes. This site does not claim to be an authorized dealership or an official brand website.</p></div></section>${contactCta()}</main>`;}
function about(){return `<main id="main">
  ${showcaseHero({kind:'about',titleBefore:'Your Trusted Local',titleAccent:'Two-Wheeler Spare Parts Center',subtitle:'Quality spare parts, fair prices and friendly support for every bike and scooter rider.',primaryText:SITE.phone?'Call Now':'Contact Us',primaryHref:SITE.phone?phoneUrl():'/contact',secondaryText:'Explore Parts',secondaryHref:'/spare-parts'})}
  <section class="section design-about-section"><div class="container about-layout"><div class="about-photo"><img src="${asset('shop-front-concept.webp')}" alt="Illustration of a two-wheeler spare parts storefront" loading="lazy"/><span class="concept-caption">Storefront illustration — not a photo of our actual shop</span></div><div class="about-copy"><div class="design-heading left-heading"><h2>About Us</h2></div><p>Sri Sai Shanmukha Auto Centre is a local two-wheeler spare parts shop offering a wide variety of parts and accessories for popular motorcycle and scooter brands.</p><p>We aim to make it easier for everyday riders, mechanics and service professionals to find suitable spare parts at reasonable prices.</p><p>Whether you need a small maintenance item or parts for a repair job, our shop is here to help you find what you are looking for.</p><a class="inline-link" href="/contact">Contact our team ${ico('arrow',17)}</a></div></div></section>
  <section class="section design-why-section"><div class="container">${sectionTitle('','Why Customers Trust Us','Our focus is on practical support and a wide range of parts.')}${featureGrid()}</div></section>
  <section class="section design-brand-section"><div class="container">${sectionTitle('','Brands We Deal In','Spare parts for leading two-wheeler brands under one roof.')}${brandGrid()}</div></section>
  ${shopContactSection()}
</main>`;}
function blogsPage(){
  const filtered=BLOGS.filter(p=>(blogCategory==='All'||p.category===blogCategory)&&(!blogQuery||`${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(blogQuery.toLowerCase())));
  const featured=BLOGS[0];const counts=blogCategoryCounts();
  return `<main id="main">
    ${showcaseHero({kind:'blogs',titleBefore:'Maintenance Tips, Buying',titleAccent:'Guides & Spare Parts Advice',subtitle:'Useful tips and practical guides to keep your bike or scooter running smoothly, safely and for longer.',primaryText:'Browse All Blogs',primaryHref:'#latest-blogs',primaryIcon:'book',secondaryText:'Explore by Category',secondaryHref:'#blog-categories'})}
    <section class="section featured-blog-section"><div class="container featured-layout"><div class="featured-main"><div class="design-heading left-heading"><h2>Featured Blog</h2></div>${featured?`<article class="featured-post"><a href="/blogs/${esc(featured.slug)}" class="featured-post-image"><img src="${asset(featured.image)}" alt="${esc(featured.title)}" loading="lazy"/><span class="pill over-image">${esc(featured.category)}</span></a><div class="featured-post-body"><h3><a href="/blogs/${esc(featured.slug)}">${esc(featured.title)}</a></h3><p>${esc(featured.summary)}</p><div class="featured-post-foot"><span class="blog-date">${ico('calendar',15)} ${dateLabel(featured.publishedAt)}</span><a class="read-more-button" href="/blogs/${esc(featured.slug)}">Read More ${ico('arrow',15)}</a></div></div></article>`:'<p>Blog articles are being prepared.</p>'}</div>
      <aside class="blog-category-side" id="blog-categories"><div class="design-heading left-heading"><h2>Browse by Category</h2></div><div class="category-filter-list">${counts.map(({name,count})=>`<button type="button" class="category-filter-row ${blogCategory===name?'selected':''}" data-blog-category="${esc(name)}" aria-pressed="${blogCategory===name}"><span>${ico(name==='Maintenance Tips'?'wrench':name==='Buying Guide'?'book':name==='Spare Parts Guide'?'package':name==='Bike Care'?'bike':'settings',19)} ${esc(name)}</span><span class="count-pill">${count}</span>${ico('chevron',17)}</button>`).join('')}</div></aside></div></section>
    <section class="section design-blogs-list" id="latest-blogs"><div class="container">${sectionTitle('','Latest Blogs','Explore articles on two-wheeler maintenance, spare parts, buying guides and more.')}
      <div class="blog-controls"><div class="filter-chips" role="group" aria-label="Filter by blog category">${['All',...counts.map(x=>x.name)].map(c=>`<button type="button" class="filter-chip ${blogCategory===c?'selected':''}" data-blog-category="${esc(c)}" aria-pressed="${blogCategory===c}">${esc(c)}</button>`).join('')}</div><label class="search-control blog-search">${ico('search',19)}<input type="search" id="blog-search" placeholder="Search articles…" value="${esc(blogQuery)}" aria-label="Search blog articles"/></label></div>
      <p class="results-note" aria-live="polite">${filtered.length} article${filtered.length===1?'':'s'} found</p><div class="blogs-grid blogs-page-grid">${filtered.map(postCard).join('')}</div>${filtered.length?'':'<div class="empty-state"><h3>No articles found</h3><p>Try another search or category.</p></div>'}
    </div></section>
    <section class="subscribe-section"><div class="container"><div class="subscribe-panel"><div class="subscribe-intro"><span class="subscribe-icon">${ico('mail',32)}</span><div><h2>Stay Updated with Our Latest Blogs</h2><p>Get tips, buying guides and spare-parts advice. We’ll save your email for shop updates.</p></div></div><form id="subscribe-form" class="subscribe-form"><label class="sr-only" for="subscribe-email">Email address</label><input id="subscribe-email" type="email" name="email" maxlength="160" placeholder="Enter your email address" required autocomplete="email"/><button type="submit" class="btn btn-primary">Subscribe</button><span class="subscribe-feedback" id="subscribe-feedback" role="status" aria-live="polite"></span></form><span class="subscribe-or">or</span>${SITE.whatsapp?`<a class="strip-whatsapp" href="${esc(whatsappUrl('Hello, please share new blog and maintenance updates.'))}" target="_blank" rel="noopener noreferrer">${ico('whatsapp',19)} WhatsApp Updates</a>`:`<a class="strip-whatsapp" href="/contact">${ico('send',17)} Contact Our Shop</a>`}</div><p class="subscribe-fineprint">Your email is stored for future updates; automatic email delivery is not enabled yet. No spam.</p></div></section>
    ${contactCta()}
  </main>`;
}
function articleHtml(source=''){const text=String(source).replace(/\r/g,'');return text.split(/\n\n+/).map(block=>{const b=block.trim();if(!b)return '';if(b.startsWith('## '))return `<h2>${esc(b.slice(3))}</h2>`;if(b.startsWith('### '))return `<h3>${esc(b.slice(4))}</h3>`;if(b.startsWith('- ')){return `<ul>${b.split('\n').filter(x=>x.startsWith('- ')).map(x=>`<li>${esc(x.slice(2))}</li>`).join('')}</ul>`;}return `<p>${esc(b).replace(/\n/g,'<br>')}</p>`;}).join('');}
function articlePage(post){const related=BLOGS.filter(p=>p.id!==post.id).slice(0,3);return `<main id="main"><div class="article-top"><div class="container narrow"><a href="/blogs" class="back-link">← Back to articles</a><div class="article-labels"><span class="pill">${esc(post.category)}</span><span>${ico('book',16)} ${Number(post.readingMinutes)||3} min read</span></div><h1>${esc(post.title)}</h1><p>${esc(post.summary)}</p><div class="article-actions"><span>Sri Sai Shanmukha Auto Centre</span><button class="inline-share" type="button" id="share-article">${ico('copy',17)} Copy article link</button></div></div></div><div class="container article-layout"><article class="article-main"><div class="article-cover"><img src="${asset(post.image)}" alt="${esc(post.title)}"/></div><div class="article-body">${articleHtml(post.body)}<div class="article-end"><h3>Need help finding a spare part?</h3><p>Share your vehicle make and model, and we can help with an enquiry.</p><a class="btn btn-primary" href="/contact">Enquire about a part ${ico('arrow',17)}</a></div></div></article><aside class="article-aside"><div class="aside-card"><span class="eyebrow">OUR SHOP</span><h3>Parts for your everyday ride.</h3><p>Motorcycles, scooters and maintenance essentials across popular two-wheeler brands.</p><a class="inline-link" href="/spare-parts">Browse parts ${ico('arrow',16)}</a></div><div class="aside-links"><h4>More useful reads</h4>${related.map(p=>`<a href="/blogs/${esc(p.slug)}">${esc(p.title)} ${ico('chevron',17)}</a>`).join('')}</div></aside></div></main>`;}
function contact(){return `<main id="main">${showcaseHero({kind:'contact',titleBefore:'We’re Here to Help',titleAccent:'Find the Right Spare Part',subtitle:'Contact us about engine parts, brakes, clutch, filters and accessories for your bike or scooter.',primaryText:SITE.phone?'Call Now':'Send Inquiry',primaryHref:SITE.phone?phoneUrl():'#visit-us',secondaryText:'Browse Parts',secondaryHref:'/spare-parts'})}${shopContactSection()}</main>`;}
function missing(){return `<main id="main">${pageHero('PAGE NOT FOUND','This road leads nowhere.','The page you requested could not be found.')}<div class="container missing-page"><a class="btn btn-primary" href="/">Back to homepage ${ico('arrow',17)}</a></div></main>`;}
function pageRoute(){const path=decodeURI(location.pathname).replace(/\/$/,'')||'/';if(path==='/')return {active:'/',html:home(),title:'Home'};if(path==='/spare-parts')return {active:'/spare-parts',html:parts(),title:'Spare Parts'};if(path==='/brands')return {active:'/brands',html:brands(),title:'Brands'};if(path==='/about')return {active:'/about',html:about(),title:'About Us'};if(path==='/blogs')return {active:'/blogs',html:blogsPage(),title:'Blogs'};if(path.startsWith('/blogs/')){const post=BLOGS.find(b=>b.slug===path.slice(7));return post?{active:'/blogs',html:articlePage(post),title:post.title}:{active:'/blogs',html:missing(),title:'Not Found'};}if(path==='/contact')return {active:'/contact',html:contact(),title:'Contact'};return {active:'',html:missing(),title:'Not Found'};}
async function loadFullArticle(slug){
  if(loadingArticles.has(slug))return;loadingArticles.add(slug);
  try{const res=await fetch(`/api/blogs/${encodeURIComponent(slug)}`);if(!res.ok)throw new Error('Article could not be loaded.');const post=await res.json();BLOGS=BLOGS.map(p=>p.slug===slug?post:p);if(location.pathname===`/blogs/${slug}`)render(false);}
  catch(error){console.error(error);const article=document.querySelector('.article-body');if(article)article.insertAdjacentHTML('afterbegin','<p>We could not load this article. Please refresh the page.</p>');}
  finally{loadingArticles.delete(slug);}
}
function render(scroll=false){const r=pageRoute();const slug=location.pathname.startsWith('/blogs/')?location.pathname.slice(7):null;if(slug&&BLOGS.some(p=>p.slug===slug&&!p.body))loadFullArticle(slug);document.title=`${r.title} | ${SITE.shopName||siteDefault.shopName}`;app.innerHTML=header(r.active)+r.html+footer()+`<div id="toast" class="toast" role="status" aria-live="polite"></div>`; if(scroll)window.scrollTo({top:0,behavior:'instant'});}
function go(url){const previous=location.pathname;history.pushState(null,'',url);menuOpen=false;if(previous!==location.pathname){blogCategory='All';blogQuery='';partsQuery='';partsBrand='All';}render(true);}
function toast(text){let t=document.getElementById('toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(window._toastTimeout);window._toastTimeout=setTimeout(()=>t.classList.remove('show'),3200);}
function bindGlobal(){document.addEventListener('click',async e=>{const menu=e.target.closest('#menu-toggle');if(menu){menuOpen=!menuOpen;render(false);return;}const category=e.target.closest('[data-blog-category]');if(category){blogCategory=category.dataset.blogCategory;const fromSidebar=!!category.closest('.category-filter-list');const y=window.scrollY;render(false);if(fromSidebar)document.getElementById('latest-blogs')?.scrollIntoView({block:'start'});else window.scrollTo({top:y});return;}const reset=e.target.closest('#parts-reset');if(reset){partsQuery='';partsBrand='All';go('/spare-parts');return;}if(e.target.closest('#share-article')){try{await navigator.clipboard.writeText(location.href);toast('Article link copied.');}catch{toast('Copy the page URL from your browser.');}return;}const a=e.target.closest('a[href]');if(a){const url=new URL(a.href,location.href);if(url.origin===location.origin&&!a.hasAttribute('download')&&!a.hasAttribute('target')&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){if(url.pathname==='/admin')return;if(url.hash&&url.pathname===location.pathname){return;}e.preventDefault();go(url.pathname+url.search+url.hash);}}});document.addEventListener('input',e=>{if(e.target.id==='blog-search'){const start=e.target.selectionStart;blogQuery=e.target.value;updateBlogResults(start);}if(e.target.id==='parts-search'){partsQuery=e.target.value;updatePartsResults();}});document.addEventListener('change',e=>{if(e.target.id==='parts-brand'){partsBrand=e.target.value;updatePartsResults();}});document.addEventListener('submit',handleSubmit);window.addEventListener('popstate',()=>{menuOpen=false;render(true)});}
function updateBlogResults(cursor){const element=document.getElementById('blog-search');if(!element)return;const focus=document.activeElement===element;const y=window.scrollY;render(false);if(focus){const x=document.getElementById('blog-search');x.focus();x.setSelectionRange(cursor,cursor);}window.scrollTo(0,y);}
function updatePartsResults(){const element=document.getElementById('parts-search');const focus=document.activeElement===element;const cursor=focus?element.selectionStart:0,y=window.scrollY;render(false);if(focus){const x=document.getElementById('parts-search');x.focus();x.setSelectionRange(cursor,cursor);}window.scrollTo(0,y);}
async function handleSubmit(e){
  if(e.target.id==='subscribe-form'){
    e.preventDefault();if(subscribing)return;
    const form=e.target, input=form.querySelector('input[name="email"]'),feedback=document.getElementById('subscribe-feedback');
    if(!input.checkValidity()){feedback.textContent='Enter a valid email address.';return;}
    subscribing=true;const button=form.querySelector('button');button.disabled=true;button.textContent='Saving…';
    try{const res=await fetch('/api/subscriptions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:input.value})});const result=await res.json();if(!res.ok)throw new Error(result.error||'Subscription could not be saved.');feedback.textContent=result.message||'Your email is saved. Thank you!';form.reset();}
    catch(err){feedback.textContent=err.message||'Could not save your email.';}
    finally{subscribing=false;button.disabled=false;button.textContent='Subscribe';}
    return;
  }
  if(e.target.id!=='enquiry-form')return;e.preventDefault();if(formPending)return;const form=e.target;const fd=new FormData(form), payload=Object.fromEntries(fd);const phone=(payload.phone||'').replace(/\D/g,'');const feedback=document.getElementById('form-feedback');if((payload.name||'').trim().length<2||phone.length<10||phone.length>15||(!String(payload.part||'').trim()&&!String(payload.message||'').trim())){feedback.className='form-feedback error';feedback.textContent='Please enter your name, a valid phone number, and the part you need (or a message).';return;}formPending=true;const btn=document.getElementById('submit-enquiry');btn.disabled=true;btn.textContent='Sending enquiry…';try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to send enquiry.');feedback.className='form-feedback success';feedback.innerHTML=`${ico('check',19)} Enquiry received. Your reference: <strong>${esc(data.id)}</strong>. Our team will review it.`;form.reset();}catch(error){feedback.className='form-feedback error';feedback.textContent=error.message||'Could not send enquiry. Please try again.';}finally{formPending=false;btn.disabled=false;btn.innerHTML=`Send enquiry ${ico('send',18)}`;}}
async function start(){try{const [s,b]=await Promise.all([fetch('/api/site'),fetch('/api/blogs')]);if(s.ok)SITE={...SITE,...await s.json()};if(b.ok)BLOGS=await b.json();}catch(error){console.error('Unable to load shop content',error);}bindGlobal();render();}
start();
