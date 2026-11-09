import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'public/admin.js'), 'utf8');
const start = app.indexOf('function specificShopMapsSearch(){');
const end = app.indexOf('function shopMark(){', start);
assert.ok(start >= 0 && end > start, 'Expected standalone Google Maps URL functions');
const mapsFns = app.slice(start, end);

const shopAddress = 'Kaman Chowrasta, Opp: Bank of India, Kaman, to, Busstand Rd, Boiwada, Karimnagar, Telangana 505001, India';
const shopName = 'Sri Sai Shanmukha Auto Centre';
const legacyLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(shopAddress);

function resolveLink(configured) {
  return vm.runInNewContext(mapsFns + '\nmapsUrl()', {
    SITE: { shopName, address: shopAddress, mapsUrl: configured },
    siteDefault: { shopName, address: shopAddress },
    URL,
    encodeURIComponent
  });
}

test('legacy address-only search is upgraded to a shop-specific Google Maps search', () => {
  const link = resolveLink(legacyLink);
  const u = new URL(link);
  assert.equal(u.hostname, 'www.google.com');
  assert.equal(u.searchParams.get('api'), '1');
  assert.ok(u.searchParams.get('query').includes(shopName));
  assert.ok(u.searchParams.get('query').includes('Karimnagar'));
  assert.notEqual(link, legacyLink);
});

test('owner-provided exact Google Maps pin URLs always take priority', () => {
  const shared = 'https://maps.app.goo.gl/ExampleShopPin123';
  const place = 'https://www.google.com/maps/place/Our+Shop/@18.45,79.1,17z';
  const placeIdUrl = 'https://www.google.com/maps/search/?api=1&query=Our+Shop&query_place_id=SomeActualPlaceId';
  for (const link of [shared, place, placeIdUrl]) assert.equal(resolveLink(link), link);
});

test('invalid Maps URL schemes cannot become customer-facing links', () => {
  const link = resolveLink('javascript:alert(1)');
  assert.equal(new URL(link).hostname, 'www.google.com');
  assert.ok(new URL(link).searchParams.get('query').includes(shopName));
});

test('map button and footer address use the same configured Maps URL', () => {
  assert.match(app, /const map=mapsUrl\(\)/);
  assert.match(app, /class="map-link store-map-directions" href="\$\{esc\(map\)\}"/);
  assert.match(app, /SITE\.address&&mapsUrl\(\)\?esc\(mapsUrl\(\)\)/);
});

test('admin explicitly requests the shop Maps share link and provides a preview link', () => {
  assert.match(admin, /Exact Google Maps shop link \(Share → Copy link\)/);
  assert.match(admin, /Check current Google Maps link/);
});
