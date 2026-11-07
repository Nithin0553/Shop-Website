import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sssa-test-'));
const port=41000+Math.floor(Math.random()*10000);
const base=`http://127.0.0.1:${port}`;
const password='strong-admin-password-123';
let server,cookie;
async function request(endpoint,opts={}) {
 const headers={...(opts.headers||{})};
 if(opts.body&&typeof opts.body!=='string'){headers['Content-Type']='application/json';opts={...opts,body:JSON.stringify(opts.body)};}
 const response=await fetch(base+endpoint,{...opts,headers});
 const type=response.headers.get('content-type')||'';
 return {res:response,data:type.includes('application/json')?await response.json():await response.text()};
}
before(async()=>{
  for(const f of ['site.json','blogs.json','inquiries.json'])fs.copyFileSync(path.join(root,'data',f),path.join(temp,f));
  server=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),DATA_DIR:temp,ADMIN_PASSWORD:password,SESSION_SECRET:'test-secret-with-at-least-forty-characters'},stdio:'ignore'});
  let ready=false;
  for(let i=0;i<90;i++){try{const r=await fetch(base+'/api/site');if(r.ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,60));}
  assert.ok(ready,'test server started');
});
after(()=>{server?.kill('SIGTERM');fs.rmSync(temp,{recursive:true,force:true});});
test('website pages and public articles load',async()=>{
  for(const route of ['/','/spare-parts','/about','/brands','/blogs','/blogs/essential-two-wheeler-maintenance-tips','/contact','/admin','/styles.css','/admin.css','/app.js','/assets/hero-shop.webp']){
    const {res}=await request(route);assert.equal(res.status,200,route);
  }
  const updatedLogo=await request('/assets/brand-card-honda.png?v=20261107-parts-grid');
  assert.equal(updatedLogo.res.status,200);
  assert.match(updatedLogo.res.headers.get('cache-control')||'',/no-cache/,'Brand images must revalidate after updates');
  const {res,data}=await request('/api/blogs');assert.equal(res.status,200);assert.equal(data.length,6);assert.ok(data.every(p=>!('body' in p)));
});
test('enquiry validation and server persistence',async()=>{
  const invalid=await request('/api/inquiries',{method:'POST',body:{name:'A',phone:'1234',part:''}});assert.equal(invalid.res.status,400);
  const added=await request('/api/inquiries',{method:'POST',body:{name:'Customer Example',phone:'9876543210',brand:'Honda',model:'Activa',part:'Brake shoe',message:'Need compatibility check'}});
  assert.equal(added.res.status,201);assert.match(added.data.id,/^INQ-/);
  const saved=JSON.parse(fs.readFileSync(path.join(temp,'inquiries.json'),'utf8'));assert.equal(saved.length,1);assert.equal(saved[0].part,'Brake shoe');
});
test('admin session, enquiries and status update',async()=>{
  const denied=await request('/api/admin/inquiries');assert.equal(denied.res.status,401);
  const wrong=await request('/api/admin/login',{method:'POST',body:{password:'wrong'}});assert.equal(wrong.res.status,401);
  const login=await request('/api/admin/login',{method:'POST',body:{password}});assert.equal(login.res.status,200);
  cookie=(login.res.headers.get('set-cookie')||'').split(';')[0];assert.ok(cookie.includes('sssa_session='));
  const loaded=await request('/api/admin/inquiries',{headers:{Cookie:cookie}});assert.equal(loaded.data.length,1);
  const modified=await request(`/api/admin/inquiries/${loaded.data[0].id}`,{method:'PATCH',headers:{Cookie:cookie},body:{status:'closed'}});assert.equal(modified.res.status,200);assert.equal(modified.data.status,'closed');
  const csv=await request('/api/admin/inquiries.csv',{headers:{Cookie:cookie}});assert.equal(csv.res.status,200);assert.ok(csv.data.includes('Customer Example'));
});
test('shop details update and blog create/edit/delete',async()=>{
  const settings=await request('/api/admin/site',{method:'PUT',headers:{Cookie:cookie},body:{shopName:'Sri Sai Shanmukha Auto Centre',phone:'+91 9876543210',whatsapp:'919876543210',address:'Sample street',siteUrl:'https://example.com',email:'shop@example.com'}});
  assert.equal(settings.res.status,200);
  const publicSettings=await request('/api/site');assert.equal(publicSettings.data.phone,'+91 9876543210');
  const added=await request('/api/admin/blogs',{method:'POST',headers:{Cookie:cookie},body:{title:'Test Parts Buying Guide',slug:'test-parts-buying-guide',category:'Buying Guide',summary:'A test summary',image:'oil-care.webp',body:'A sufficiently detailed guide for replacing or buying parts. Check your motorcycle model and follow the recommended specifications before buying.'}});
  assert.equal(added.res.status,201);
  const post=await request('/api/blogs/test-parts-buying-guide');assert.equal(post.res.status,200);
  const changed=await request(`/api/admin/blogs/${added.data.id}`,{method:'PUT',headers:{Cookie:cookie},body:{...added.data,title:'Updated Parts Guide',status:'draft'}});
  assert.equal(changed.res.status,200);
  const hidden=await request('/api/blogs/test-parts-buying-guide');assert.equal(hidden.res.status,404);
  const deleted=await request(`/api/admin/blogs/${added.data.id}`,{method:'DELETE',headers:{Cookie:cookie}});assert.equal(deleted.res.status,200);
  const sitemap=await request('/sitemap.xml');assert.equal(sitemap.res.status,200);assert.ok(sitemap.data.includes('https://example.com/blogs'));
});
test('admin can upload an image for blog articles',async()=>{
  const denied=await request('/api/admin/images');assert.equal(denied.res.status,401);
  const original='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/N88AAAAASUVORK5CYII=';
  const uploaded=await request('/api/admin/images',{method:'POST',headers:{Cookie:cookie},body:{dataUrl:`data:image/png;base64,${original}`}});
  assert.equal(uploaded.res.status,201);assert.match(uploaded.data.filename,/^custom-[0-9a-f]{32}\.png$/);
  const image=await request('/assets/'+uploaded.data.filename);assert.equal(image.res.status,200);assert.match(image.res.headers.get('content-type'),/image\/png/);
  const listing=await request('/api/admin/images',{headers:{Cookie:cookie}});assert.ok(listing.data.includes(uploaded.data.filename));
  const blog=await request('/api/admin/blogs',{method:'POST',headers:{Cookie:cookie},body:{title:'Article With Uploaded Image',category:'Bike Care',image:uploaded.data.filename,body:'This is a complete sample article with a custom uploaded image. It contains enough text for our article body requirement.'}});
  assert.equal(blog.res.status,201);assert.equal(blog.data.image,uploaded.data.filename);
  const removed=await request(`/api/admin/blogs/${blog.data.id}`,{method:'DELETE',headers:{Cookie:cookie}});assert.equal(removed.res.status,200);
});
test('SEO head title changes for blog articles',async()=>{
  const article=await request('/blogs/essential-two-wheeler-maintenance-tips');
  assert.equal(article.res.status,200);assert.match(article.data,/<title>Essential Two-Wheeler Maintenance Tips for a Longer Life/);
  const notFound=await request('/blogs/does-not-exist');assert.equal(notFound.res.status,404);
});
test('blog email subscriptions validate, deduplicate and remain admin-only',async()=>{
  const bad=await request('/api/subscriptions',{method:'POST',body:{email:'not-an-address'}});
  assert.equal(bad.res.status,400);
  const first=await request('/api/subscriptions',{method:'POST',body:{email:'visitor@example.com'}});
  assert.equal(first.res.status,200);
  const duplicate=await request('/api/subscriptions',{method:'POST',body:{email:'Visitor@Example.com'}});
  assert.equal(duplicate.res.status,200);
  const denied=await request('/api/admin/subscribers');
  assert.equal(denied.res.status,401);
  const list=await request('/api/admin/subscribers',{headers:{Cookie:cookie}});
  assert.equal(list.res.status,200);
  assert.equal(list.data.length,1);
  assert.equal(list.data[0].email,'visitor@example.com');
  const csv=await request('/api/admin/subscribers.csv',{headers:{Cookie:cookie}});
  assert.equal(csv.res.status,200);
  assert.ok(csv.data.includes('visitor@example.com'));
  assert.ok(fs.existsSync(path.join(temp,'subscribers.json')));
});
