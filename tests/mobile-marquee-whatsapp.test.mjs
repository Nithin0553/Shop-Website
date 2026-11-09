import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WHATSAPP_ENQUIRY_TEMPLATE,
  enquiryTemplateBody,
  whatsappConfigured,
  sendEnquiryWhatsAppNotification
} from '../lib/whatsapp-notifications.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = {
  id: 'INQ-ABC',
  name: 'Customer Example',
  phone: '9876543210',
  brand: 'Honda',
  model: 'Activa',
  part: 'Brake shoe',
  message: 'Need compatible part'
};
const env = {
  WHATSAPP_API_TOKEN: 'private-test-api-token',
  WHATSAPP_PHONE_NUMBER_ID: '123456789012345',
  WHATSAPP_TO: '919030084872'
};

test('brand and category marquees have identical grouped copies and accessible clones', () => {
  const js = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'public/styles.css'), 'utf8');
  assert.match(js, /class="marquee-group" aria-hidden="true"/);
  assert.match(js, /items\.map\(\(item,index\)=>renderer\(item,index,false\)\)/);
  assert.match(js, /items\.map\(\(item,index\)=>renderer\(item,index,true\)\)/);
  assert.match(js, /clone\?'tabindex="-1" '/);
  assert.match(css, /\.marquee-group\s*\{[^}]*gap:14px;[^}]*padding-right:14px;/);
  assert.match(css, /@keyframes scroll-x\s*\{[^}]*translate3d\(0,0,0\)[^}]*\}[^}]*translate3d\(-50%,0,0\)/);
  assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)/);
  assert.match(css, /@media \(hover:none\)/);
  assert.match(css, /\.brand-marquee \.marquee-track\s*\{ animation-duration:15\.5s;/);
  assert.match(css, /\.parts-marquee \.marquee-track\s*\{ animation-duration:18\.5s;/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('WhatsApp template contains each enquiry field in the exact approved variable order', () => {
  assert.equal(WHATSAPP_ENQUIRY_TEMPLATE, 'shop_new_enquiry_alert');
  assert.deepEqual(enquiryTemplateBody(entry), [
    entry.id, entry.name, entry.phone, 'Honda / Activa', entry.part, entry.message
  ]);
  const escaped = enquiryTemplateBody({ ...entry, message: 'hello\nthere\t! ' });
  assert.equal(escaped.at(-1), 'hello there !');
  assert.equal(enquiryTemplateBody({ ...entry, message: 'x'.repeat(400) }).at(-1).length, 350);
});

test('WhatsApp service silently skips notifications without all private credentials', async () => {
  assert.equal(whatsappConfigured({}), false);
  assert.equal(whatsappConfigured({ ...env, WHATSAPP_TO: 'invalid' }), false);
  const result = await sendEnquiryWhatsAppNotification({ ...env, WHATSAPP_API_TOKEN: '' }, entry, () => { throw Error('Should not fetch'); });
  assert.equal(result.queued, false);
  assert.equal(result.reason, 'not_configured');
});

test('WhatsApp sends Meta an approved template message to the shop owner', async () => {
  let called = 0;
  const result = await sendEnquiryWhatsAppNotification(env, entry, async (url, options) => {
    called++;
    assert.equal(url, 'https://graph.facebook.com/v25.0/123456789012345/messages');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer private-test-api-token');
    const payload = JSON.parse(options.body);
    assert.equal(payload.to, env.WHATSAPP_TO);
    assert.equal(payload.messaging_product, 'whatsapp');
    assert.equal(payload.type, 'template');
    assert.equal(payload.template.name, WHATSAPP_ENQUIRY_TEMPLATE);
    assert.equal(payload.template.language.code, 'en_US');
    assert.deepEqual(payload.template.components[0].parameters.map(p => p.text), enquiryTemplateBody(entry));
    return { ok: true, status: 200 };
  });
  assert.equal(called, 1);
  assert.deepEqual(result, { queued: true });
});

test('WhatsApp API errors cannot turn a saved enquiry into a visitor-facing failure', async () => {
  const warn = console.warn;
  const messages = [];
  console.warn = (...args) => messages.push(args.join(' '));
  try {
    const result = await sendEnquiryWhatsAppNotification(env, entry, async () => ({ ok: false, status: 403 }));
    assert.deepEqual(result, { queued: false, reason: 'api_error' });
    assert.ok(messages.some(s => s.includes('HTTP 403')));
    assert.ok(!messages.some(s => s.includes(entry.phone) || s.includes(entry.name)));
  } finally { console.warn = warn; }
});

test('Worker awaits D1 persistence and uses waitUntil to dispatch optional notification', () => {
  const worker = fs.readFileSync(path.join(root, 'cloudflare/worker.mjs'), 'utf8');
  assert.match(worker, /\.bind\(entry\.id, entry\.createdAt, entry\.status, name, phone, brand, model, part, message\)\.run\(\);[\s\S]*?whatsappConfigured\(env\)/);
  assert.match(worker, /ctx\?\.waitUntil\) ctx\.waitUntil\(notification\)/);
  assert.match(worker, /async fetch\(request, env, ctx\)/);
});
