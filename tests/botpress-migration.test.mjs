import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(path.join(root,name),'utf8');

test('Botpress switch is opt-in with no placeholder credentials or duplicate assistant',()=>{
  const site=JSON.parse(read('data/site.json'));
  const js=read('public/automobile-assistant.js');
  const admin=read('public/admin.js');
  assert.equal(site.botpressInjectUrl,'');
  assert.equal(site.botpressConfigUrl,'');
  assert.match(admin,/Botpress Webchat loader URL/);
  assert.match(admin,/Botpress configuration URL/);
  assert.match(js,/if \(await switchToBotpress\(\)\) return;/);
  assert.ok(js.indexOf('if (await switchToBotpress()) return;') < js.indexOf('const prompts ='));
  assert.match(js,/botpressInjectUrl/);
  assert.match(js,/botpressConfigUrl/);
  assert.match(js,/cdn\.botpress\.cloud/);
  assert.match(js,/files\.bpcontent\.cloud/);
  assert.doesNotMatch(js,/GEMINI_API_KEY|x-goog-api-key/);
});

test('only approved Botpress HTTPS embed script URLs are accepted',()=>{
  const js=read('public/automobile-assistant.js');
  const start=js.indexOf('  function verifiedBotpressUrl(');
  const end=js.indexOf('\n  function loadBotpressScript(',start);
  assert.ok(start>0 && end>start);
  const verify=new Function(js.slice(start,end)+'\nreturn verifiedBotpressUrl;')();
  const inject=/^\/webchat\/v\d+\.\d+\/inject\.js$/;
  const settings=/^\/[A-Za-z0-9/_-]+\.js$/;
  const goodInject='https://cdn.botpress.cloud/webchat/v3.3/inject.js';
  const goodConfig='https://files.bpcontent.cloud/2026/11/shop-123.js';
  assert.equal(verify(goodInject,'cdn.botpress.cloud',inject),goodInject);
  assert.equal(verify(goodConfig,'files.bpcontent.cloud',settings),goodConfig);
  for(const bad of [
    'http://cdn.botpress.cloud/webchat/v3.3/inject.js',
    'https://cdn.botpress.cloud.evil.example/webchat/v3.3/inject.js',
    'https://cdn.botpress.cloud/webchat/v3.3/inject.js?run=1',
    'https://cdn.botpress.cloud/webchat/v3.3/not-the-injector.js',
    'javascript:alert(1)'
  ])assert.equal(verify(bad,'cdn.botpress.cloud',inject),'',bad);
  for(const bad of [
    'https://files.bpcontent.cloud.evil.example/evil.js',
    'https://files.bpcontent.cloud/a.js#fragment',
    'https://files.bpcontent.cloud/a.txt',
    'https://user:password@files.bpcontent.cloud/x.js'
  ])assert.equal(verify(bad,'files.bpcontent.cloud',settings),'',bad);
});

test('Botpress agent instructions and knowledge do not invent verified inventory',()=>{
  const instructions=read('docs/botpress/agent-instructions.md');
  const shop=read('docs/botpress/shop-facts.md');
  const troubleshooting=read('docs/botpress/troubleshooting-knowledge.md');
  assert.match(instructions,/Romanized Telugu\/Hindi/);
  assert.match(instructions,/Never say “Yes, we have it”/);
  assert.match(instructions,/brake \*\*lamp\*\*/);
  assert.match(shop,/Sri Sai Shanmukha Auto Centre/);
  assert.match(shop,/Do \*\*not\*\* claim that car spare parts are sold/);
  assert.match(troubleshooting,/Electric scooter doesn't start/);
  assert.match(troubleshooting,/Flat or punctured tyre/);
});
