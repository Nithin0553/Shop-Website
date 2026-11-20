// Create a standalone GitHub Pages site from public assets and committed public data.
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { FESTIVALS, FESTIVAL_INTENSITIES, FESTIVAL_PALETTES, normalizeFestivalSettings } from '../lib/festivals.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist-github-pages');
const base = (process.env.GITHUB_PAGES_BASE || '/Shop-Website').replace(/\/$/, '');
if (!/^\/[A-Za-z0-9._-]+$/.test(base)) throw Error('Invalid GITHUB_PAGES_BASE');
const origin = process.env.GITHUB_PAGES_ORIGIN || 'https://nithin0553.github.io';
const parsed = new URL(origin);
if (parsed.protocol !== 'https:' || parsed.pathname !== '/') throw Error('Invalid GITHUB_PAGES_ORIGIN');
const publicUrl = parsed.origin + base + '/';
const pageUrl = route => parsed.origin + base + (route === '/' ? '/' : route + '/');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'
}[c]));
const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw Error('Expected application section missing: ' + label);
  return source.replace(before, after);
};
const readJson = async name => JSON.parse(await readFile(path.join(root,'data',name+'.json'),'utf8'));
async function write(name, body) {
  const file = path.join(output,name);
  await mkdir(path.dirname(file),{recursive:true});
  await writeFile(file,body,'utf8');
}
await rm(output,{recursive:true,force:true});
await cp(path.join(root,'public'),output,{recursive:true,filter(source){
  const name=path.basename(source);
  return !['admin.html','admin.js','.assetsignore','_worker.js','_redirects','_headers'].includes(name);
}});
const site=await readJson('site');
const blogs=(await readJson('blogs')).filter(post=>post.status==='published');
const settings=normalizeFestivalSettings(await readJson('festival'));
// The shop phone is provisional as a WhatsApp destination unless the owner supplies a specific WhatsApp number.
if(!site.whatsapp)site.whatsapp=String(site.phone||'').replace(/\D/g,'');
site.siteUrl=publicUrl;
await write('static-data/site.json',JSON.stringify(site,null,2)+'\n');
await write('static-data/blogs.json',JSON.stringify(blogs,null,2)+'\n');
await write('static-data/festivals.json',JSON.stringify({festivals:FESTIVALS,intensities:FESTIVAL_INTENSITIES,settings,preview:false},null,2)+'\n');
await write('festival-palettes.css',FESTIVAL_PALETTES+'\n');

let app=await readFile(path.join(root,'public/app.js'),'utf8');
const runtime=await readFile(path.join(root,'scripts/github-pages-static-runtime.js'),'utf8');
const oldAsset=app.match(/^const asset = img => .*;$/m)?.[0];
if(!oldAsset)throw Error('Missing asset() helper');
app=replaceOnce(app,oldAsset,"const asset = img => GH_BASE + '/assets/' + encodeURIComponent(img) + '?v=' + ASSET_VERSION;",'asset()');
app=replaceOnce(app,"const path=decodeURI(location.pathname).replace(/\\/$/,'')||'/';","const path=decodeURI(stripBase(location.pathname)).replace(/\\/$/,'')||'/';",'routing');
const renderStart=app.indexOf('app.innerHTML=header(r.active)+r.html+footer()+');
const renderEnd=app.indexOf('; window.ShopFestivalEffects',renderStart);
if(renderStart<0||renderEnd<0)throw Error('Cannot locate render() HTML');
const existingRender=app.slice(renderStart+'app.innerHTML='.length,renderEnd);
app=app.slice(0,renderStart)+'app.innerHTML=staticHtml('+existingRender+')'+app.slice(renderEnd);
app=replaceOnce(app,"history.pushState(null,'',url);","history.pushState(null,'',withBase(url));",'navigation');
// All published blog bodies are bundled in static JSON; remove the API-only lazy loader.
const lazyStart=app.indexOf('async function loadFullArticle(slug){');
const lazyEnd=app.indexOf('\nfunction render(',lazyStart);
if(lazyStart<0||lazyEnd<0)throw Error('Cannot locate lazy blog loader');
app=app.slice(0,lazyStart)+app.slice(lazyEnd);
app=replaceOnce(app,'if(slug&&BLOGS.some(p=>p.slug===slug&&!p.body))loadFullArticle(slug);','', 'static articles');
const handlerStart=app.indexOf('async function handleSubmit(e){');
const handlerEnd=app.lastIndexOf('\nstart();');
if(handlerStart<0||handlerEnd<=handlerStart)throw Error('Cannot locate API client section');
app=app.slice(0,handlerStart)+runtime+'\n'+app.slice(handlerEnd);
const form=/<form id="subscribe-form"[\s\S]*?<\/form><span class="subscribe-or">or<\/span>/;
if(!form.test(app))throw Error('Could not remove subscription API form');
app=app.replace(form,'');
app=replaceOnce(app,'We’ll save your email for shop updates.','Contact our team on WhatsApp for updates.','subscription description');
app=replaceOnce(app,'Your email is stored for future updates; automatic email delivery is not enabled yet. No spam.','This static website does not collect email addresses or send automated updates.','subscription notice');
app=replaceOnce(app,'Our shop team may receive an enquiry summary through WhatsApp.','Your enquiry is not stored here. You must press Send in WhatsApp to contact our shop.','form privacy');
app=replaceOnce(app,'Send Inquiry</button>','Continue on WhatsApp</button>','submit label');
await write('app.js',app);

let festival=await readFile(path.join(root,'public/festival-effects.js'),'utf8');
// Remove the live API polling and EventSource logic from the static festival copy.
const refreshStart=festival.indexOf('async function refresh() {');
const refreshEnd=festival.indexOf('function startPolling()',refreshStart);
const connectStart=festival.indexOf('function resumeResources() {');
const connectEnd=festival.indexOf('function start(data,name) {',connectStart);
if(refreshStart<0||refreshEnd<0||connectStart<0||connectEnd<0)throw Error('Cannot locate festival API section');
festival=festival.slice(0,connectStart)+'function resumeResources() { /* no backend on GitHub Pages */ }\n  '+festival.slice(connectEnd);
festival=festival.slice(0,refreshStart)+'async function refresh() { /* static festival settings */ }\n  '+festival.slice(refreshEnd);
await write('festival-effects.js',festival);

let html=await readFile(path.join(root,'public/index.html'),'utf8');
html=html.replace(/\b(href|src)="\/(?!\/)/g,(_,key)=>key+'="'+base+'/');
// Bust cached browser JS whenever the generated storefront changes.
const appVersion=createHash('sha256').update(app).digest('hex').slice(0,12);
html=replaceOnce(html,
  'src="'+base+'/app.js"',
  'src="'+base+'/app.js?v='+appVersion+'"',
  'versioned storefront asset'
);
html=replaceOnce(html,
  '<script src="'+base+'/festival-effects.js" defer></script>',
  '<script>window.SHOP_STATIC_MODE=true;window.__SHOP_STATIC_BASE__='+JSON.stringify(base)+';</script>\n' +
  '<script src="'+base+'/festival-effects.js" defer></script>',
  'static runtime configuration'
);
const routes=[
  {path:'/',title:'Two-Wheeler Spare Parts & Accessories',description:'Two-wheeler spare parts and accessories in Karimnagar. Browse leading brands and contact Sri Sai Shanmukha Auto Centre.'},
  {path:'/spare-parts',title:'Spare Parts',description:'Explore engine parts, brakes, clutch, tyres, filters, batteries and more.'},
  {path:'/brands',title:'Two-Wheeler Brands',description:'Explore spare parts for Hero, Honda, Bajaj, TVS, Yamaha, Suzuki and Royal Enfield.'},
  {path:'/about',title:'About Our Shop',description:'Learn about Sri Sai Shanmukha Auto Centre, a two-wheeler parts shop in Karimnagar.'},
  {path:'/blogs',title:'Maintenance Tips and Blog',description:'Two-wheeler maintenance tips, buying guides and spare-parts advice.'},
  {path:'/contact',title:'Contact Our Shop',description:'Contact Sri Sai Shanmukha Auto Centre in Karimnagar by phone or WhatsApp.'},
  ...blogs.filter(post=>/^[a-z0-9-]+$/.test(post.slug)).map(post=>({
    path:'/blogs/'+post.slug,title:post.title,description:post.summary||'Read our two-wheeler blog.'
  }))
];
function renderHead(route,noindex=false){
  const title=route.title+' | Sri Sai Shanmukha Auto Centre',url=pageUrl(route.path);
  return html
    .replace(/<title>[\s\S]*?<\/title>/,'<title>'+escapeHtml(title)+'</title>')
    .replace(/<meta name="description" content="[^"]*" \/>/,'<meta name="description" content="'+escapeHtml(route.description)+'" />')
    .replace(/<meta property="og:title" content="[^"]*" \/>/,'<meta property="og:title" content="'+escapeHtml(title)+'" />')
    .replace(/<meta property="og:description" content="[^"]*" \/>/,'<meta property="og:description" content="'+escapeHtml(route.description)+'" />')
    .replace('</head>','<link rel="canonical" href="'+escapeHtml(url)+'" />\n'+
      '<meta property="og:url" content="'+escapeHtml(url)+'" />\n'+
      (noindex?'<meta name="robots" content="noindex" />\n':'')+'</head>');
}
for(const route of routes){
  const file=route.path==='/'?'index.html':route.path.slice(1)+'/index.html';
  await write(file,renderHead(route));
}
await write('404.html',renderHead({path:'/',title:'Page Not Found',description:'This page was not found.'},true));
// Keep the original admin dashboard design and event handlers, replacing only
// its protected Node/Workers API with a GitHub owner-authorized contents adapter.
let admin = await readFile(path.join(root,'public/admin.js'),'utf8');
const adapter = await readFile(path.join(root,'scripts/github-pages-admin-adapter.js'),'utf8');
const apiStart = admin.indexOf('async function api(path,options={})');
const apiEnd = admin.indexOf('\nfunction notice(',apiStart);
if(apiStart<0||apiEnd<0)throw Error('Could not identify original admin API adapter.');
admin=admin.slice(0,apiStart)+admin.slice(apiEnd);
admin=replaceOnce(admin,"let tab='inquiries'","let tab='blogs'",'default admin tab');
// In the static edition, enquiries and subscribers stay in WhatsApp and never
// get saved in a public repo. Do not show misleading empty server-only panels.
admin=admin.replace(/<button class="sidebar-link [^"]*" data-tab="inquiries"[\s\S]*?<\/button>/,'');
admin=admin.replace(/<button class="sidebar-link [^"]*" data-tab="subscribers"[\s\S]*?<\/button>/,'');
const oldLoadStart=admin.indexOf('async function loadData(){');
const oldLoadEnd=admin.indexOf('\nasync function boot()',oldLoadStart);
if(oldLoadStart<0||oldLoadEnd<0)throw Error('Could not identify admin data loader.');
admin=admin.slice(0,oldLoadStart)+
  "async function loadData(){\n"+
  "  [settings,posts,images,festivalData]=await Promise.all([\n"+
  "    api('/api/admin/site'),api('/api/admin/blogs'),api('/api/admin/images'),api('/api/admin/festivals')\n"+
  "  ]);\n"+
  "  festivalDraft={...festivalData.settings};\n"+
  "}\n"+admin.slice(oldLoadEnd);
admin=replaceOnce(admin,'Admin password</label>','GitHub access token</label>','admin login label');
admin=replaceOnce(admin,'Enter your admin password','Paste your fine-grained GitHub token','admin login placeholder');
admin=replaceOnce(admin,'autocomplete="current-password"','autocomplete="off"','admin password autocomplete');
admin=replaceOnce(admin,'Sign in to manage customer enquiries, contact information and blog articles.',
  'Sign in with a repository-scoped GitHub token to manage blog articles, festival themes, shop information and images. This token stays only in this browser tab until you leave or sign out.',
  'admin login description');
admin=replaceOnce(admin,'Enquiries. Blog posts. Business details.','Blog posts. Festivals. Business details.','admin login art');
admin=admin.replaceAll('href="/"','href="'+base+'/"');
admin=admin.replaceAll('src="/assets/','src="'+base+'/assets/');
admin=replaceOnce(admin,"return '/?'+new URLSearchParams(","return GH_BASE+'/?'+new URLSearchParams(",'festival preview link');
admin=admin.replace("['siteUrl','Public website URL (for SEO sitemap)','url']", '');
admin=admin.replace("['instagramUrl','Instagram page URL','url'],,","['instagramUrl','Instagram page URL','url'],");
// The Pages URL is generated during publishing rather than edited by the admin.
admin=replaceOnce(admin,'Changes are now visible on the website.',
  'GitHub saved this change. The public website updates after GitHub Pages deploys.',
  'admin publish notice');
admin=admin.replaceAll('updates open pages immediately.','appears after GitHub Pages republishes.');
admin=admin.replaceAll('takes effect immediately.','publishes after the GitHub Pages build.');
admin=adapter+'\n'+admin;
await write('admin.js',admin);

let adminHtml=await readFile(path.join(root,'public/admin.html'),'utf8');
adminHtml=adminHtml.replace(/\b(href|src)="\/(?!\/)/g,(_,key)=>key+'="'+base+'/');
const adminVersion=createHash('sha256').update(admin).digest('hex').slice(0,12);
adminHtml=replaceOnce(adminHtml,'src="'+base+'/admin.js"',
  'src="'+base+'/admin.js?v='+adminVersion+'"','versioned admin entry');
adminHtml=replaceOnce(adminHtml,'</head>',
  '<meta name="robots" content="noindex,nofollow" />\n'+
  '<meta http-equiv="Content-Security-Policy" content="default-src &#39;self&#39;; script-src &#39;self&#39;; connect-src &#39;self&#39; https://api.github.com; style-src &#39;self&#39; &#39;unsafe-inline&#39; https://fonts.googleapis.com; font-src &#39;self&#39; https://fonts.gstatic.com; img-src &#39;self&#39; data:; frame-src &#39;self&#39;; base-uri &#39;self&#39;; form-action &#39;self&#39;" />\n'+
  '</head>','admin CSP');
await write('admin/index.html',adminHtml);

await write('.nojekyll','');
await write('robots.txt','User-agent: *\nAllow: /\nSitemap: '+publicUrl+'sitemap.xml\n');
await write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
  routes.map(route=>'<url><loc>'+escapeHtml(pageUrl(route.path))+'</loc></url>').join('')+'</urlset>\n');
console.log('GitHub Pages build ready: '+publicUrl);
console.log('Published '+routes.length+' public routes, static blogs, festivals, and WhatsApp enquiry handoff.');
console.log('Output: dist-github-pages/ (no admin APIs, private records, or secrets).');
