import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const code=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
const posts=JSON.parse(fs.readFileSync(path.join(root,'data/blogs.json'),'utf8')).filter(p=>p.status==='published');
const data={shopName:'Sri Sai Shanmukha Auto Centre',tagline:'Two-Wheeler Spare Parts & Accessories',phone:'',whatsapp:'',address:'',city:'',hours:''};
async function renderAt(route){
  const app={innerHTML:''};
  const location={pathname:route,search:'',href:'http://localhost:3000'+route,origin:'http://localhost:3000'};
  const document={getElementById:id=>id==='app'?app:null,addEventListener(){},title:''};
  const fetch=async url=>({ok:true,json:async()=>{
    if(url==='/api/site')return data;
    if(url==='/api/blogs')return posts.map(({body,...rest})=>rest);
    if(url.startsWith('/api/blogs/'))return posts.find(p=>p.slug===url.slice(11));
    return {};
  }});
  const context=vm.createContext({document,location,fetch,console,URL,URLSearchParams,encodeURIComponent,decodeURIComponent,Number,String,Date,Promise,clearTimeout,setTimeout,
    window:{addEventListener(){},scrollTo(){}},history:{pushState(){}},navigator:{},FormData:class {}});
  vm.runInContext(code,context,{timeout:3000});
  await new Promise(resolve=>setTimeout(resolve,30));
  return app.innerHTML;
}
test('homepage follows approved design hierarchy',async()=>{
  const html=await renderAt('/');
  for(const text of ['Your Trusted Source for','Popular Brands','Spare Parts Categories','Helmets','Engine Oils','Activa Accessories','Why Choose Us?','Latest Blogs','Call Us','Our Address','Business Hours','Need Help?'])
    assert.ok(html.includes(text),`Missing ${text}`);
  assert.ok((html.match(/class=\"brand-card/g)||[]).length >= 7);
  assert.ok((html.match(/compact-category/g)||[]).length >= 9);
  assert.equal((html.match(/design-blog-card/g)||[]).length,3);
  assert.ok(html.includes('logo-card'));
  assert.ok(html.includes('/assets/brand-card-honda.png?v=20261107-site-content-v4'), 'Homepage should request refreshed logo URLs');
  assert.ok(html.includes('spotlight-card'));
  assert.ok(html.indexOf('Popular Brands')<html.indexOf('Spare Parts Categories'));
  assert.ok(html.indexOf('Spare Parts Categories')<html.indexOf('Why Choose Us?'));
  assert.ok(!html.includes('98765 43210'),'No fake phone numbers should be displayed');
});
test('blog page features article, sidebar, filters and working subscribe form',async()=>{
  const html=await renderAt('/blogs');
  for(const text of ['Maintenance Tips, Buying','Featured Blog','Browse by Category','Latest Blogs','subscribe-form','subscribe-email'])assert.ok(html.includes(text),`Missing ${text}`);
  assert.equal((html.match(/design-blog-card/g)||[]).length,posts.length);
  assert.ok(html.includes('category-filter-row'));
});
test('about and contact mockup sections include real enquiry form',async()=>{
  for(const route of ['/about','/contact']){
    const html=await renderAt(route);
    for(const text of ['Get in Touch / Visit Our Store','Need Help?','enquiry-form','customer-phone','customer-brand','Required Part','contact-map']) assert.ok(html.includes(text),`${route}: missing ${text}`);
    assert.ok(!html.includes('[object Object]'), 'Enquiry brands should be readable names');
    for(const brand of ['Hero','Honda','Bajaj','TVS','Yamaha','Suzuki','Royal Enfield'])
      assert.ok(html.includes(`<option value="${brand}"`),`${route}: missing enquiry brand ${brand}`);
  }
});
test('public article pages fetch and display the full article body',async()=>{
  const html=await renderAt('/blogs/'+posts[0].slug);
  assert.ok(html.includes('article-body'));
  assert.ok(html.includes('##')===false || html.includes('<h2>'));
  assert.ok(!html.includes('We could not load this article.'));
  assert.ok(html.includes(posts[0].body.slice(0,20)) || html.includes(posts[0].body.split('\n').find(x=>x.length>20).slice(0,20)));
});
test('responsive design breakpoints and design reference classes exist',()=>{
  const css=fs.readFileSync(path.join(root,'public/styles.css'),'utf8');
  for(const text of ['showcase-hero','brand-wordmark','featured-layout','shop-contact-layout','subscribe-panel','marquee-track','spotlight-grid','@media (max-width:650px)'])assert.ok(css.includes(text));
});


test('highlighted brand wordmarks have larger artwork and three-up layout',()=>{
  const sheet=fs.readFileSync(path.join(root,'public/styles.css'),'utf8');
  assert.ok(sheet.includes('.spotlight-grid .spotlight-brand-row'));
  assert.ok(sheet.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
  for(const name of ['logo-ceat.png','logo-tvs-tyres.png','logo-mrf.png','logo-castrol.png','logo-gs-caltex.png','logo-shell.png']){
    const png=fs.readFileSync(path.join(root,'public/assets',name));
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png.readUInt32BE(16),640);
    assert.equal(png.readUInt32BE(20),220);
  }
});
