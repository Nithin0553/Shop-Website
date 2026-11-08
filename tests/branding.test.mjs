import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get = p=>fs.readFileSync(path.join(root,p),'utf8');

test('peacock artwork replaces the previous bike icon in public branding',()=>{
  const js=get('public/app.js');
  assert.match(js,/<img class="header-full-logo" src="\$\{asset\('shop-logo-full.webp'\)\}"/);
  assert.match(js,/class="brand-mobile"/);
  assert.match(js,/class="footer-logo peacock-footer-logo"/);
  assert.ok(!js.includes('class="logo-icon">${ico(\'bike\''));
  assert.ok(js.includes('20261107-site-content-v4'));
  const index=get('public/index.html');
  assert.match(index,/shop-favicon\.png/);
  assert.match(get('public/admin.html'),/shop-favicon\.png/);
  assert.match(get('public/admin.js'),/shop-logo-mark\.webp/);
  for(const name of ['shop-logo-full.webp','shop-logo-mark.webp','shop-favicon.png']){
    const stat=fs.statSync(path.join(root,'public/assets',name));
    assert.ok(stat.size>1500,name);
  }
});

test('homepage and dashboard use the peacock gold, navy and teal design tokens',()=>{
  const css=get('public/styles.css');
  for(const declaration of ['--gold:#e8a047','--navy:#0a1a33','--teal:#267884','--ivory:#fffbf4','.primary-nav>a.active','.peacock-footer-logo'])
    assert.ok(css.includes(declaration),`Missing ${declaration}`);
  assert.match(get('public/admin.css'),/admin-sidebar \{background:linear-gradient/);
});

test('San Francisco is prioritized across storefront and dashboard',()=>{
  const style=get('public/styles.css');
  assert.match(style,/--shop-font-body:-apple-system,BlinkMacSystemFont,"SF Pro Text"/);
  assert.match(style,/--shop-font-heading:-apple-system,BlinkMacSystemFont,"SF Pro Display"/);
  assert.match(style,/html,body,button,input,textarea,select,option/);
  assert.match(style,/\.admin-topbar h1,\.panel-head h2/);
  assert.match(style,/font-family:var\(--shop-font-heading\)/);
  for(const page of ['public/index.html','public/admin.html'])
    assert.match(get(page),/fonts\.googleapis\.com\/css2\?family=Inter/);
  const backend=get('server.mjs');
  assert.match(backend,/style-src 'self' https:\/\/fonts\.googleapis\.com/);
  assert.match(backend,/font-src 'self' https:\/\/fonts\.gstatic\.com/);
});

test('Why Choose Us symbols use peacock green',()=>{
  const style=get('public/styles.css');
  assert.match(style,/\.design-why-section \.design-feature > span/);
  assert.match(style,/color:#21834d;/);
  assert.match(style,/\.design-why-section \.design-feature > span \.icon/);
});

test('public storefront uses white backgrounds while retaining brand headings and festival themes',()=>{
  const css=get('public/styles.css');
  const area='body:not(.admin-body):not([data-festival])';
  assert.ok(css.includes('Clean white storefront — remove the warm orange/ivory page gradients'));
  for(const selector of ['.showcase-hero','.design-brand-section','.design-categories-section','.spotlight-section','.design-why-section','.design-home-blogs','.page-hero','.shop-contact-section'])
    assert.ok(css.includes(area+' '+selector),selector);
  assert.ok(css.includes('background:#ffffff;'));
  assert.ok(css.includes(area+' .premium-section::before'));
  assert.ok(css.includes(area+' .spotlight-card::after'));
  assert.ok(css.includes('background-image:none;'));
  assert.ok(css.includes('color:#21834d;'),'green symbols remain unchanged');
  assert.ok(css.includes('.design-heading h2:before,.design-heading h2:after {background:linear-gradient'),'gold title accents remain');
});
