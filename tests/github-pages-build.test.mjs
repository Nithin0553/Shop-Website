import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist-github-pages');
const read=relative=>readFileSync(path.join(out,relative),'utf8');

test('static export publishes direct repository-scoped routes and all committed blogs',()=>{
  execFileSync(process.execPath,['scripts/build-github-pages.mjs'],{cwd:root,stdio:'pipe'});
  const blogs=JSON.parse(read('static-data/blogs.json'));
  assert.ok(blogs.length>=6);
  assert.ok(blogs.every(post=>post.status==='published'&&post.body));
  for(const route of ['index.html','spare-parts/index.html','brands/index.html',
    'about/index.html','blogs/index.html','contact/index.html','404.html']) {
    assert.ok(existsSync(path.join(out,route)),route);
    assert.match(read(route),/\/Shop-Website\/app.js/);
    assert.match(read(route),/\/Shop-Website\/styles.css/);
  }
  for(const post of blogs) {
    const page=read('blogs/'+post.slug+'/index.html');
    assert.ok(page.includes(post.title),post.slug);
    assert.ok(page.includes('rel="canonical"'),post.slug);
  }
  assert.match(read('sitemap.xml'),/nithin0553.github.io\/Shop-Website\/contact\//);
});

test('the static browser runtime does not depend on server APIs',()=>{
  const app=read('app.js');
  const festival=read('festival-effects.js');
  assert.ok(app.includes('const GH_BASE = window.__SHOP_STATIC_BASE__'));
  assert.ok(app.includes('staticHtml('));
  assert.ok(app.includes('stripBase(location.pathname)'));
  assert.ok(app.includes('withBase(url)'));
  assert.ok(!app.includes("fetch('/api/"));
  assert.ok(!app.includes('async function loadFullArticle'));
  assert.ok(!app.includes('subscribe-form'));
  assert.ok(!app.includes('Enquiry received. Your reference:'));
  assert.ok(!festival.includes("fetch('/api/festivals'"));
  assert.ok(!festival.includes("new window.EventSource"));
  assert.ok(read('index.html').includes('window.SHOP_STATIC_MODE=true'));
});

test('enquiry flow requires customer to send WhatsApp message manually',()=>{
  const app=read('app.js');
  assert.match(app,/Continue on WhatsApp/);
  assert.match(app,/WhatsApp\. Please press Send there to deliver your enquiry/);
  assert.match(app,/https:\/\/wa\.me\//);
  assert.match(app,/window\.location\.assign\(url\)/);
  assert.match(app,/Your enquiry is not stored here/);
  const site=JSON.parse(read('static-data/site.json'));
  assert.equal(site.phone,'+91 9030084872');
  assert.equal(site.whatsapp,'919030084872');
});

test('festival artwork and data are included without a live dashboard',()=>{
  const festivals=JSON.parse(read('static-data/festivals.json'));
  assert.equal(festivals.festivals.length,20);
  assert.equal(festivals.settings.enabled,false);
  assert.ok(read('festival-palettes.css').includes('data-festival="diwali"'));
  assert.ok(existsSync(path.join(out,'festival-artwork.js')));
  assert.ok(!existsSync(path.join(out,'admin.js')));
  assert.ok(!existsSync(path.join(out,'admin.html')));
  assert.ok(!existsSync(path.join(out,'_worker.js')));
  assert.match(read('admin/index.html'),/no customer database or online admin dashboard/);
});

test('only public storefront assets and static JSON are exported',()=>{
  for(const privatePath of ['data/inquiries.json','data/subscribers.json','.env','.dev.vars',
    'cloudflare/worker.mjs','server.mjs','migrations/0001_init.sql']) {
    assert.ok(!existsSync(path.join(out,privatePath)),privatePath);
  }
  const site=JSON.parse(read('static-data/site.json'));
  assert.equal(site.siteUrl,'https://nithin0553.github.io/Shop-Website/');
});
