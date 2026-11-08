import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('public/app.js'), css=read('public/styles.css'), server=read('server.mjs');
const settings=JSON.parse(read('data/site.json'));

test('shop contact details and real map destinations match approved information',()=>{
  assert.equal(settings.phone,'+91 9030084872');
  assert.match(settings.address,/Kaman Chowrasta, Opp: Bank of India/);
  assert.match(settings.address,/Boiwada, Karimnagar, Telangana 505001, India/);
  assert.match(settings.hours,/Mon–Sun: 8:30 AM – 9:30 PM/);
  assert.match(settings.mapsUrl,/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  assert.ok(js.includes('class="store-map-frame"'));
  assert.ok(js.includes('Open in Google Maps'));
  assert.ok(server.includes('frame-src https://maps.google.com https://www.google.com'));
});

test('homepage refinements remove superfluous labels and keep requested headings',()=>{
  assert.ok(js.includes("sectionTitle('','Popular Brands')"));
  assert.ok(js.includes("sectionTitle('','Spare Parts Categories')"));
  assert.ok(!js.includes("Premium-looking featured sections for popular rider essentials"));
  assert.ok(!js.includes("Spare parts for leading two-wheeler brands under one roof."));
  assert.ok(!js.includes("Find the right spare parts for your two-wheeler, quickly and easily."));
  assert.ok(!js.includes("Quality spare parts for all major two-wheeler brands at reasonable prices."));
  assert.ok(!js.includes('class="spotlight-tag"'));
  assert.ok(js.includes("kind==='home'?'':'<span"));
  assert.match(css,/design-brand-section \.design-heading h2/);
  assert.match(css,/color:#101010 !important/);
});

test('contact form and footer use approved help wording and accessible contrast',()=>{
  assert.ok(js.includes('<h2>Need Help?</h2>'));
  assert.ok(js.includes("Need Help?</a>"));
  assert.ok(!js.includes('Enquiries are saved privately for the shop to follow up.'));
  assert.ok(!js.includes('శ్రీ సాయి షణ్ముఖ ఆటో సెంటర్'));
  assert.ok(css.includes('.contact-band .strip-whatsapp'));
  assert.ok(css.includes('background:#0a1a33 !important;'));
});

test('blog photography, map and navigation support graceful fallbacks',()=>{
  for(const slug of [
    'essential-two-wheeler-maintenance-tips',
    'when-to-replace-bike-brake-parts',
    'two-wheeler-battery-buying-guide',
    'chain-and-sprocket-care-guide',
    'air-filter-maintenance-guide',
    'scooter-belt-and-cvt-care'
  ]) assert.ok(js.includes('"' + slug + '"'),slug);
  assert.ok(js.includes('data-blog-fallback'));
  assert.ok(server.includes('https://images.pexels.com'));
  assert.ok(server.includes('https://images.unsplash.com'));
  assert.ok(css.includes('::view-transition-new(shop-page)'));
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(js.includes("document.startViewTransition"));
  assert.ok(fs.existsSync(path.join(root,'docs/blog-photo-credits.md')));
});
