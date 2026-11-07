import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Native, dependency-free .env support for local development. Deployed env vars win.
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || Object.hasOwn(process.env, m[1])) continue;
    let val=m[2];
    if ((val.startsWith('"')&&val.endsWith('"'))||(val.startsWith("'")&&val.endsWith("'"))) val=val.slice(1,-1);
    process.env[m[1]]=val;
  }
}
const PUBLIC = path.join(ROOT, 'public');
const DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const prod = process.env.NODE_ENV === 'production';
const MAX_BODY = 100_000;
const MAX_IMAGE_BODY = 2_800_000;
const UPLOADS = path.join(DATA, 'uploads');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.json':'application/json; charset=utf-8' };

if (prod && (ADMIN_PASSWORD.length < 12 || !process.env.SESSION_SECRET || SESSION_SECRET.length < 24)) {
  console.error('Production requires ADMIN_PASSWORD (12+ characters) and SESSION_SECRET (24+ characters).');
  process.exit(1);
}
if (!ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD not set. Admin login is disabled until configured.');
if (!process.env.SESSION_SECRET) console.warn('SESSION_SECRET missing; admin sessions expire whenever the server restarts.');

fs.mkdirSync(DATA, { recursive:true });
fs.mkdirSync(UPLOADS, { recursive:true });
const dataPath = name => path.join(DATA, name);
const defaults = { shopName:'Sri Sai Shanmukha Auto Centre', tagline:'Two-Wheeler Spare Parts & Accessories', phone:'',whatsapp:'',email:'',address:'',city:'',hours:'',mapsUrl:'',instagramUrl:'',facebookUrl:'',siteUrl:'' };
for (const [file, defaultVal] of [['site.json', defaults], ['blogs.json', []], ['inquiries.json', []]]) {
  const dest=dataPath(file), source=path.join(ROOT,'data',file);
  if (!fs.existsSync(dest)) {
    if (fs.existsSync(source)) fs.copyFileSync(source, dest);
    else fs.writeFileSync(dest, JSON.stringify(defaultVal, null, 2) + '\n', {mode:0o600});
  }
}
const read = name => JSON.parse(fs.readFileSync(dataPath(name), 'utf8'));
const write = (name, value) => {
  const target = dataPath(name), temp = `${target}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { mode:0o600 });
  fs.renameSync(temp, target);
};
const json = (res, status, value, headers={}) => {
  const data=Buffer.from(JSON.stringify(value));
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff', ...headers});
  res.end(data);
};
const str = (v, max=100) => typeof v === 'string' ? v.trim().slice(0,max) : '';
const slugify = v => str(v,140).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,90);
const numeric = v => typeof v==='number' && Number.isFinite(v) ? v : Number(v)||0;
const allowHttp = v => { const s=str(v,500); if (!s) return ''; try {const u=new URL(s);return ['http:','https:'].includes(u.protocol) ? u.toString() : '';}catch{return '';} };
const badMethod = res => json(res,405,{error:'Method not allowed'});
const clientIP = req => req.socket.remoteAddress || 'unknown';
const limits=new Map();
function limited(ip, bucket, allowed, interval) {
  const key=`${ip}:${bucket}`, now=Date.now();
  let arr=(limits.get(key)||[]).filter(t=>now-t<interval); arr.push(now); limits.set(key,arr);
  if (limits.size>3000) for(const [k,v] of limits) if(v.every(t=>now-t>interval)) limits.delete(k);
  return arr.length>allowed;
}
async function body(req, maxSize=MAX_BODY) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size+=chunk.length; if(size>maxSize) throw new Error('Request too large'); chunks.push(chunk); }
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
  catch {throw new Error('Invalid JSON');}
}
function token() {
  const payload=Buffer.from(JSON.stringify({exp:Date.now()+12*60*60*1000,nonce:crypto.randomBytes(8).toString('hex')})).toString('base64url');
  const sig=crypto.createHmac('sha256',SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
function authenticated(req) {
  const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('sssa_session='));
  if(!cookie) return false;
  const [payload,sig]=cookie.slice('sssa_session='.length).split('.');
  if(!payload||!sig) return false;
  const good=crypto.createHmac('sha256',SESSION_SECRET).update(payload).digest('base64url');
  if (sig.length!==good.length || !crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(good))) return false;
  try {return JSON.parse(Buffer.from(payload,'base64url').toString()).exp>Date.now();}catch{return false;}
}
const cookieString = value => `sssa_session=${value}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${value?43200:0}${prod?'; Secure':''}`;
function authRequired(req,res) {if(!authenticated(req)){json(res,401,{error:'Please log in'});return false;}return true;}
function isCustomImage(name) {
  return typeof name==='string' && /^custom-[0-9a-f]{32}\.(png|jpg|webp)$/.test(name) && fs.existsSync(path.join(UPLOADS,name));
}
function validateUploadedImage(dataUrl) {
  if(typeof dataUrl!=='string')throw new Error('Invalid image.');
  const m=dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/);
  if(!m)throw new Error('Use a PNG, JPG or WebP image.');
  const bytes=Buffer.from(m[2],'base64');
  if(bytes.length<50||bytes.length>1_800_000)throw new Error('Image must be under 1.8 MB.');
  const kind=m[1];
  const matches=kind==='png' ? bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) :
    kind==='jpeg' ? bytes.subarray(0,3).equals(Buffer.from('ffd8ff','hex')) :
    bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  if(!matches)throw new Error('Image content does not match its type.');
  return {bytes,ext:kind==='jpeg'?'jpg':kind};
}
function normalizePost(payload, old={}) {
  const title=str(payload.title,130), slug=slugify(payload.slug||title), bodyText=str(payload.body,20000);
  if(title.length<5||slug.length<4||bodyText.length<60) throw new Error('Provide a title, valid URL slug and article body (60+ characters).');
  const images=['oil-care.webp','brake-care.webp','battery-care.webp','chain-care.webp','filter-care.webp','scooter-care.webp','bike-scooter.webp'];
  const categories=['Maintenance Tips','Spare Parts Guide','Buying Guide','Bike Care','Scooter Care'];
  return { id:old.id||crypto.randomUUID(), slug, title, category:categories.includes(payload.category)?payload.category:categories[0], summary:str(payload.summary,260), image:images.includes(payload.image)||isCustomImage(payload.image)?payload.image:images[0], readingMinutes:Math.max(1,Math.min(20,Math.round(numeric(payload.readingMinutes)||Math.ceil(bodyText.split(/\s+/).length/180)))), publishedAt:old.publishedAt||new Date().toISOString().slice(0,10), status:payload.status==='draft'?'draft':'published', body:bodyText };
}
function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; base-uri 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'");
}
async function handleApi(req,res,url) {
  const { pathname }=url;
  if(pathname==='/api/site'&&req.method==='GET') return json(res,200,{...defaults,...read('site.json')});
  if(pathname==='/api/blogs'&&req.method==='GET') return json(res,200,read('blogs.json').filter(b=>b.status==='published').map(({body,...rest})=>rest));
  if(pathname.startsWith('/api/blogs/')&&req.method==='GET') {
    const post=read('blogs.json').find(b=>b.slug===decodeURIComponent(pathname.slice('/api/blogs/'.length))&&b.status==='published');
    return post ? json(res,200,post):json(res,404,{error:'Article not found'});
  }
  if(pathname==='/api/inquiries'&&req.method==='POST') {
    if(limited(clientIP(req),'inquiries',8,15*60*1000)) return json(res,429,{error:'Too many enquiries. Please try again later.'});
    const b=await body(req);
    if(str(b.website,200)) return json(res,200,{message:'Thank you.'}); // honeypot
    const name=str(b.name,90), phone=str(b.phone,32), brand=str(b.brand,80), model=str(b.model,100), part=str(b.part,130),message=str(b.message,1500);
    const digits=phone.replace(/\D/g,'');
    if(name.length<2 ||digits.length<10||digits.length>15||(!part&&!message)) return json(res,400,{error:'Enter your name, valid phone number and a part or message.'});
    const entry={ id:`INQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`, name,phone,brand,model,part,message,status:'new',createdAt:new Date().toISOString() };
    const enquiries=read('inquiries.json');enquiries.unshift(entry);write('inquiries.json',enquiries);
    return json(res,201,{id:entry.id,message:'Your enquiry has been received.'});
  }
  if(pathname==='/api/admin/login'&&req.method==='POST') {
    if(!ADMIN_PASSWORD) return json(res,503,{error:'Admin login is not configured on the server.'});
    if(limited(clientIP(req),'login',8,15*60*1000)) return json(res,429,{error:'Too many login attempts; try again later.'});
    const b=await body(req), submitted=str(b.password,400);
    const a=crypto.createHash('sha256').update(submitted).digest(),c=crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
    if(!crypto.timingSafeEqual(a,c)) return json(res,401,{error:'Incorrect password.'});
    return json(res,200,{ok:true},{'Set-Cookie':cookieString(token())});
  }
  if(pathname==='/api/admin/logout'&&req.method==='POST') return json(res,200,{ok:true},{'Set-Cookie':cookieString('')});
  if(pathname==='/api/admin/me'&&req.method==='GET') return json(res,200,{authenticated:authenticated(req),configured:!!ADMIN_PASSWORD});
  if(pathname.startsWith('/api/admin/')) {
    if(!authRequired(req,res)) return;
    if(pathname==='/api/admin/site') {
      if(req.method==='GET') return json(res,200,{...defaults,...read('site.json')});
      if(req.method==='PUT') {
        const b=await body(req), next={...defaults};
        for (const key of Object.keys(defaults)) next[key]=key.endsWith('Url')?allowHttp(b[key]):str(b[key],key==='address'?260:160);
        next.shopName=next.shopName||defaults.shopName;
        next.phone=next.phone.replace(/[^+\d\s()-]/g,'');next.whatsapp=next.whatsapp.replace(/\D/g,'');
        if(next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) return json(res,400,{error:'Invalid email address.'});
        write('site.json',next);return json(res,200,next);
      }
    }
    if(pathname==='/api/admin/images') {
      if(req.method==='GET') return json(res,200,fs.readdirSync(UPLOADS).filter(isCustomImage));
      if(req.method==='POST') {
        const b=await body(req,MAX_IMAGE_BODY);
        const {bytes,ext}=validateUploadedImage(b.dataUrl);
        const name=`custom-${crypto.randomBytes(16).toString('hex')}.${ext}`;
        fs.writeFileSync(path.join(UPLOADS,name),bytes,{flag:'wx',mode:0o600});
        return json(res,201,{filename:name,url:`/assets/${name}`});
      }
      return badMethod(res);
    }
    if(pathname==='/api/admin/inquiries'&&req.method==='GET') return json(res,200,read('inquiries.json'));
    if(pathname==='/api/admin/inquiries.csv'&&req.method==='GET') {
      const rows=read('inquiries.json'),cols=['id','createdAt','status','name','phone','brand','model','part','message'];
      const esc=v=>'"'+String(v??'').replace(/^[=+@-]/,'\'$&').replace(/"/g,'""')+'"';
      const csv=[cols.join(','),...rows.map(r=>cols.map(k=>esc(r[k])).join(','))].join('\r\n');
      res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="shop-enquiries.csv"','Cache-Control':'no-store'});
      return res.end('\uFEFF'+csv);
    }
    if(pathname.startsWith('/api/admin/inquiries/')&&req.method==='PATCH') {
      const b=await body(req),entries=read('inquiries.json'),entry=entries.find(x=>x.id===pathname.split('/').pop());
      if(!entry)return json(res,404,{error:'Enquiry not found'});
      if(!['new','in-progress','closed'].includes(b.status))return json(res,400,{error:'Invalid status'});
      entry.status=b.status;write('inquiries.json',entries);return json(res,200,entry);
    }
    if(pathname==='/api/admin/blogs') {
      if(req.method==='GET') return json(res,200,read('blogs.json'));
      if(req.method==='POST') {
        const b=await body(req), posts=read('blogs.json'), newPost=normalizePost(b);
        if(posts.some(p=>p.slug===newPost.slug))return json(res,409,{error:'That URL slug is already in use.'});
        posts.unshift(newPost);write('blogs.json',posts);return json(res,201,newPost);
      }
    }
    if(pathname.startsWith('/api/admin/blogs/')) {
      const id=decodeURIComponent(pathname.slice('/api/admin/blogs/'.length)),posts=read('blogs.json'),idx=posts.findIndex(p=>p.id===id);
      if(idx<0)return json(res,404,{error:'Blog post not found.'});
      if(req.method==='PUT') {
        const b=await body(req),updated=normalizePost(b,posts[idx]);
        if(posts.some((p,i)=>i!==idx&&p.slug===updated.slug))return json(res,409,{error:'That URL slug is already in use.'});
        posts[idx]=updated;write('blogs.json',posts);return json(res,200,updated);
      }
      if(req.method==='DELETE') {posts.splice(idx,1);write('blogs.json',posts);return json(res,200,{ok:true});}
    }
    return badMethod(res);
  }
  return json(res,404,{error:'Unknown API endpoint'});
}
function htmlEscape(s) {
  return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function serveIndex(res, pathname) {
  const site=read('site.json'), shop=site.shopName||defaults.shopName;
  const headings={'/':'Two-Wheeler Spare Parts & Accessories','/spare-parts':'Spare Parts','/brands':'Two-Wheeler Brands','/about':'About Our Shop','/blogs':'Maintenance Tips & Blog','/contact':'Contact & Enquiries'};
  let label=headings[pathname]||'Page Not Found';
  let description='Explore two-wheeler spare parts and accessories for Hero, Honda, Bajaj, TVS, Yamaha, Suzuki, Royal Enfield and more. Contact our shop for availability.';
  let status=200;
  if (pathname.startsWith('/blogs/')) {
    const slug=pathname.slice('/blogs/'.length), post=read('blogs.json').find(p=>p.slug===slug&&p.status==='published');
    if(post){label=post.title;description=post.summary||description;}else status=404;
  } else if (!Object.hasOwn(headings,pathname)) status=404;
  const title=`${label} | ${shop}`;
  let html=fs.readFileSync(path.join(PUBLIC,'index.html'),'utf8');
  html=html.replace(/<title>.*?<\/title>/,()=>`<title>${htmlEscape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/,()=>`<meta name="description" content="${htmlEscape(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/,()=>`<meta property="og:title" content="${htmlEscape(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/,()=>`<meta property="og:description" content="${htmlEscape(description)}" />`);
  const base=allowHttp(site.siteUrl).replace(/\/$/,'');
  if(base) html=html.replace('</head>',`<link rel="canonical" href="${htmlEscape(base+pathname)}" />\n<meta property="og:url" content="${htmlEscape(base+pathname)}" />\n</head>`);
  res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});
  res.end(html);
}
function serveFile(res, filename) {
  const resolved=path.resolve(PUBLIC,filename);
  if(!(resolved===PUBLIC||resolved.startsWith(PUBLIC+path.sep)))return json(res,403,{error:'Forbidden'});
  fs.readFile(resolved,(error,content)=>{
    if(error) return json(res,404,{error:'Not found'});
    res.writeHead(200,{'Content-Type':mime[path.extname(resolved)]||'application/octet-stream','Cache-Control':filename.startsWith('assets/')?'public, max-age=86400':'no-cache'});
    res.end(content);
  });
}
const server=http.createServer(async(req,res)=>{
  securityHeaders(res);
  try {
    const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`), pathname=url.pathname;
    if(pathname.startsWith('/api/')) return await handleApi(req,res,url);
    if(!['GET','HEAD'].includes(req.method))return badMethod(res);
    if(pathname==='/robots.txt')return serveFile(res,'robots.txt');
    if(pathname==='/favicon.svg')return serveFile(res,'favicon.svg');
    if(pathname==='/admin'||pathname==='/admin/')return serveFile(res,'admin.html');
    if(pathname.startsWith('/assets/')) {
      const file=decodeURIComponent(pathname.slice('/assets/'.length));
      if(/^custom-[0-9a-f]{32}\.(png|jpg|webp)$/.test(file) && fs.existsSync(path.join(UPLOADS,file))) {
        const ext=path.extname(file);
        res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'public, max-age=3600'});
        return fs.createReadStream(path.join(UPLOADS,file)).pipe(res);
      }
      return serveFile(res,decodeURIComponent(pathname.slice(1)));
    }
    if(pathname==='/styles.css'||pathname==='/admin.css'||pathname==='/app.js'||pathname==='/admin.js')return serveFile(res,pathname.slice(1));
    if(pathname==='/sitemap.xml') {
      const config=read('site.json'); const base=allowHttp(config.siteUrl).replace(/\/$/,'');
      if(!base)return json(res,404,{error:'Set the site URL in Admin to enable the sitemap.'});
      const routes=['/','/spare-parts','/brands','/about','/blogs','/contact',...read('blogs.json').filter(p=>p.status==='published').map(p=>`/blogs/${p.slug}`)];
      res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8'});
      return res.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(r=>`<url><loc>${base}${r}</loc></url>`).join('')+'</urlset>');
    }
    return serveIndex(res,pathname.replace(/\/$/,'')||'/');
  } catch(error) {
    console.error(error);
    const msg=['Invalid JSON','Request too large'].includes(error.message)?error.message:error.message?.startsWith('Provide a title')?error.message:'Something went wrong. Please try again.';
    return json(res,msg==='Something went wrong. Please try again.'?500:400,{error:msg});
  }
});
server.listen(PORT,'0.0.0.0',()=>console.log(`Sri Sai Shanmukha Auto Centre → http://localhost:${PORT}`));
