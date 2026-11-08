import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { FESTIVALS, DEFAULT_FESTIVAL, FESTIVAL_INTENSITIES, normalizeFestivalSettings } from '../lib/festivals.mjs';
import { renderArtwork, renderDecoration, ARTWORK_IDS } from '../public/festival-artwork.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sssa-festivals-'));
const port=52000+Math.floor(Math.random()*9000), base=`http://127.0.0.1:${port}`;
const password='festival-test-admin-password';
let server, cookie;
async function startServer() {
  server=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),DATA_DIR:temp,ADMIN_PASSWORD:password,SESSION_SECRET:'festival-test-secret-with-at-least-forty-characters'},stdio:'ignore'});
  for(let i=0;i<90;i++) {
    try{if((await fetch(base+'/api/festivals')).ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.fail('Festival test server did not start');
}
async function stopServer() {
  if(!server || server.exitCode!==null)return;
  const exit=once(server,'exit');server.kill('SIGTERM');await exit;
}
async function request(route,options={}) {
  const {body,admin,...rest}=options;
  const response=await fetch(base+route,{...rest,headers:{'Content-Type':'application/json',...(admin?{Cookie:cookie}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json(),headers:response.headers};
}
const update=body=>request('/api/admin/festivals',{method:'PUT',admin:true,body});

before(async()=>{
  // Simulate an existing installation: no festival.json and no private fixtures.
  fs.copyFileSync(path.join(root,'data/site.json'),path.join(temp,'site.json'));
  // Use explicit test fixtures so locally edited festival settings never affect tests.
  fs.writeFileSync(path.join(temp,'festival.json'),JSON.stringify(DEFAULT_FESTIVAL,null,2)+'\n');
  await startServer();
  const response=await fetch(base+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
  assert.equal(response.status,200);cookie=response.headers.get('set-cookie').split(';')[0];
});
after(async()=>{await stopServer();fs.rmSync(temp,{recursive:true,force:true});});

test('old installations start with festival mode off and all 20 requested choices',async()=>{
  const result=await request('/api/festivals');
  assert.equal(result.status,200);
  assert.deepEqual(result.data.settings,{...DEFAULT_FESTIVAL});
  assert.equal(result.data.festivals.length,20);
  assert.equal(new Set(result.data.festivals.map(f=>f.id)).size,20);
  assert.deepEqual(result.data.festivals.map(f=>f.name),[
    'Sankranti','Bhogi','Pongal','Kanuma','Maha Shivaratri','Holi','Ugadi','Sri Rama Navami','Hanuman Jayanti','Akshaya Tritiya','Raksha Bandhan','Krishna Janmashtami','Ganesh Chaturthi / Vinayaka Chavithi','Dussehra / Vijayadashami','Bonalu','Bathukamma','Diwali','Onam','Ramzan','Christmas'
  ]);
  assert.match(result.headers.get('cache-control'),/no-store/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp,'festival.json'),'utf8')),result.data.settings);
});

test('festival mutations and admin reads require an authenticated session',async()=>{
  assert.equal((await request('/api/admin/festivals')).status,401);
  assert.equal((await request('/api/admin/festivals',{method:'PUT',body:{enabled:true,festival:'holi'}})).status,401);
  assert.equal((await request('/api/festivals',{method:'PUT',body:{enabled:true,festival:'holi'}})).status,404);
  assert.equal((await request('/api/festivals')).data.settings.enabled,false);
});

test('all 20 themes save on the server and are shared with anonymous visitors',async()=>{
  for(const festival of FESTIVALS) {
    const desired={enabled:true,festival:festival.id,intensity:'low',greetingVariant:'default'};
    const saved=await update(desired);
    assert.equal(saved.status,200,festival.name);
    assert.deepEqual(saved.data,desired);
    assert.deepEqual((await request('/api/festivals')).data.settings,desired);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp,'festival.json'),'utf8')),desired);
  }
});

test('invalid IDs, string booleans and malformed settings cannot overwrite a valid theme',async()=>{
  const previous=(await request('/api/festivals')).data.settings;
  for(const payload of [null,[],{},'diwali',{enabled:'false',festival:'diwali'},{enabled:1,festival:'holi'},{enabled:true,festival:'unknown'},{enabled:true,festival:'__proto__'},{enabled:true,festival:'<script>alert(1)</script>'}]) {
    assert.equal((await update(payload)).status,400,JSON.stringify(payload));
    assert.deepEqual((await request('/api/festivals')).data.settings,previous);
  }
  assert.equal((await request('/api/admin/festivals',{method:'DELETE',admin:true})).status,405);
});

test('shop-detail edits preserve festival settings and off retains the selected festival',async()=>{
  await update({...DEFAULT_FESTIVAL,enabled:true,festival:'bathukamma'});
  const site=await request('/api/admin/site',{admin:true});
  assert.equal((await request('/api/admin/site',{method:'PUT',admin:true,body:{...site.data,tagline:'Two-wheeler spare parts'}})).status,200);
  assert.deepEqual((await request('/api/festivals')).data.settings,{...DEFAULT_FESTIVAL,enabled:true,festival:'bathukamma'});
  assert.deepEqual((await update({...DEFAULT_FESTIVAL,enabled:false,festival:'bathukamma'})).data,{...DEFAULT_FESTIVAL,enabled:false,festival:'bathukamma'});
  assert.deepEqual((await request('/api/festivals')).data.settings,{...DEFAULT_FESTIVAL,enabled:false,festival:'bathukamma'});
  await update({...DEFAULT_FESTIVAL,enabled:false,festival:'diwali'});
  assert.deepEqual((await request('/api/festivals')).data.settings,{...DEFAULT_FESTIVAL,enabled:false,festival:'diwali'});
});

test('theme and on/off setting survive restarts in the persistent data directory',async()=>{
  await update({...DEFAULT_FESTIVAL,enabled:true,festival:'diwali'});
  await stopServer();await startServer();
  assert.deepEqual((await request('/api/festivals')).data.settings,{...DEFAULT_FESTIVAL,enabled:true,festival:'diwali'});
  await update({...DEFAULT_FESTIVAL,enabled:false,festival:'diwali'});
  await stopServer();await startServer();
  assert.deepEqual((await request('/api/festivals')).data.settings,{...DEFAULT_FESTIVAL,enabled:false,festival:'diwali'});
});

test('festival assets are served with correct types under the existing content security policy',async()=>{
  for(const [route,type] of [['/festival-effects.js','text/javascript'],['/festival-artwork.js','text/javascript'],['/festivals.css','text/css'],['/festival-palettes.css','text/css']]) {
    const response=await fetch(base+route);
    assert.equal(response.status,200);
    assert.ok(response.headers.get('content-type').includes(type));
    assert.ok(response.headers.get('content-security-policy').includes("script-src 'self'"));
  }
  for(const route of ['/']) {
    const html=await (await fetch(base+route)).text();
    assert.ok(html.includes('/festival-effects.js'));assert.ok(html.includes('/festivals.css'));
  }
});


test('all festivals have distinct animation recipes, valid assets and 3–5 second entrances',()=>{
  const artwork=new Set(),recipes=new Set();
  for(const theme of FESTIVALS) {
    const svg=renderArtwork(theme);artwork.add(svg);recipes.add(theme.heroAnimation.id);
    assert.ok(ARTWORK_IDS.includes(theme.motif));
    assert.match(svg,/aria-hidden="true"/);assert.match(svg,/focusable="false"/);
    assert.ok(!svg.includes('style='));
    assert.ok(theme.heroAnimation.durationMs>=3000&&theme.heroAnimation.durationMs<=5000);
    assert.ok(theme.heroAnimation.stages.length>=2);
    for(const stage of theme.heroAnimation.stages)assert.ok(svg.includes(`data-entrance="${stage.part}"`),`${theme.name}: missing ${stage.part}`);
    for(const kind of [theme.pageEffects.primary,theme.pageEffects.secondary])assert.ok(renderDecoration(kind),`${theme.name}: ${kind}`);
    for(const color of Object.values(theme.colors))assert.match(color,/^#[a-f0-9]{6}$/i);
  }
  assert.equal(artwork.size,20);assert.equal(recipes.size,20);
  assert.equal(renderDecoration('__proto__'),'');assert.equal(renderArtwork({motif:'constructor'}),'');
});

test('Telugu greetings and all three bounded intensity levels are configured',()=>{
  assert.equal(FESTIVALS.find(f=>f.id==='ugadi').teluguGreeting,'ఉగాది శుభాకాంక్షలు');
  assert.equal(FESTIVALS.find(f=>f.id==='diwali').teluguGreeting,'దీపావళి శుభాకాంక్షలు');
  for(const density of Object.values(FESTIVAL_INTENSITIES)) {assert.ok(density.particles<=8);assert.ok(density.edges<=6);}
  assert.ok(FESTIVAL_INTENSITIES.low.particles<FESTIVAL_INTENSITIES.high.particles);
  const css=fs.readFileSync(path.join(root,'public/festivals.css'),'utf8');
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(css.includes('pointer-events:none!important'));
  assert.ok(css.includes('object-fit:contain'));
});

test('legacy saved data migrates without resetting an enabled festival',()=>{
  assert.deepEqual(normalizeFestivalSettings({enabled:true,festival:'diwali'}),{...DEFAULT_FESTIVAL,enabled:true,festival:'diwali'});
  assert.deepEqual(normalizeFestivalSettings({enabled:true,festival:'unknown'}),{...DEFAULT_FESTIVAL});
});

test('all intensity levels and the Ramzan/Eid greeting persist and validate',async()=>{
  for(const intensity of ['low','medium','high']) {
    const desired={enabled:true,festival:'ramzan',intensity,greetingVariant:'eid'};
    assert.deepEqual((await update(desired)).data,desired);
    assert.deepEqual((await request('/api/festivals')).data.settings,desired);
  }
  const previous=(await request('/api/festivals')).data.settings;
  for(const bad of [{...previous,intensity:'extreme'},{...previous,greetingVariant:'<script>'},{...previous,festival:'diwali'}]){
    assert.equal((await update(bad)).status,400);
    assert.deepEqual((await request('/api/festivals')).data.settings,previous);
  }
  await stopServer();await startServer();
  assert.deepEqual((await request('/api/festivals')).data.settings,previous);
  // Older dashboard clients may still send just enabled + festival.
  const oldClient=await update({enabled:false,festival:'ramzan'});
  assert.deepEqual(oldClient.data,{...previous,enabled:false});
});

test('private previews use real public pages, require auth and never publish settings',async()=>{
  const original=fs.readFileSync(path.join(temp,'festival.json'),'utf8');
  for(const theme of FESTIVALS) {
    const route=`/api/admin/festivals/preview?festival=${theme.id}&intensity=medium&greetingVariant=default`;
    assert.equal((await request(route)).status,401);
    const preview=await request(route,{admin:true});
    assert.equal(preview.status,200);assert.equal(preview.data.preview,true);
    assert.deepEqual(preview.data.settings,{enabled:true,festival:theme.id,intensity:'medium',greetingVariant:'default'});
  }
  assert.equal((await request('/api/admin/festivals/preview?festival=unknown',{admin:true})).status,400);
  assert.equal((await request('/api/admin/festivals/preview?festival=diwali&intensity=extreme',{admin:true})).status,400);
  assert.equal(fs.readFileSync(path.join(temp,'festival.json'),'utf8'),original);
  const denied=await fetch(base+'/?festivalPreview=1&festival=diwali');assert.equal(denied.status,401);
  const html=await fetch(base+'/?festivalPreview=1&festival=diwali',{headers:{Cookie:cookie}});
  assert.equal(html.status,200);assert.equal(html.headers.get('x-frame-options'),'SAMEORIGIN');
  assert.match(html.headers.get('content-security-policy'),/frame-ancestors 'self'/);
  assert.match(html.headers.get('cache-control'),/no-store/);
  assert.ok((await html.text()).includes('noindex,nofollow'));
  const publicPage=await fetch(base+'/');assert.equal(publicPage.headers.get('x-frame-options'),'DENY');
  assert.match(publicPage.headers.get('content-security-policy'),/frame-ancestors 'none'/);
});

test('server-sent updates publish changes and switch off without a page reload',async()=>{
  const abort=new AbortController();
  const response=await fetch(base+'/api/festivals/events',{signal:abort.signal});
  assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/event-stream/);
  const reader=response.body.getReader(),decoder=new TextDecoder();
  try {
    const first=decoder.decode((await reader.read()).value);assert.ok(first.includes('event: festival'));
    const theme={enabled:true,festival:'diwali',intensity:'medium',greetingVariant:'default'};
    await update(theme);
    const activation=decoder.decode((await reader.read()).value);
    assert.ok(activation.includes(JSON.stringify(theme)));
    await update({...theme,enabled:false});
    const off=decoder.decode((await reader.read()).value);
    assert.ok(off.includes('"enabled":false'));
  } finally {await reader.cancel();abort.abort();}
});

test('provider connections and listeners are bounded and explicitly disposed',()=>{
  const handlers=new Set(),streams=[];
  const target=()=>({addEventListener(type,fn){handlers.add(fn);},removeEventListener(type,fn){handlers.delete(fn);}});
  class FakeEvents {
    constructor(){this.closed=false;streams.push(this);}
    addEventListener(){}
    close(){this.closed=true;}
  }
  const document={...target(),hidden:false,body:{dataset:{}},querySelectorAll:()=>[]};
  const window={...target(),EventSource:FakeEvents,matchMedia:()=>({...target(),matches:false})};
  const context={window,document,console,localStorage:{getItem:()=>null},setInterval:()=>1,clearInterval(){}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'public/festival-effects.js'),'utf8'),context);
  const provider=window.ShopFestivalEffects;
  const payload={festivals:FESTIVALS,intensities:FESTIVAL_INTENSITIES,settings:{...DEFAULT_FESTIVAL}};
  provider.start(payload);const count=handlers.size;
  provider.start(payload);assert.equal(handlers.size,count);assert.ok(streams[0].closed);
  provider.dispose();assert.equal(handlers.size,0);assert.ok(streams.every(stream=>stream.closed));
  provider.dispose();assert.equal(handlers.size,0);
});

test('intensity and greeting options reject non-string values without publishing',async()=>{
  const previous=(await request('/api/festivals')).data.settings;
  for(const invalid of [[],['low'],{},null,4,{toString:'high'}]){
    assert.equal((await update({...previous,intensity:invalid})).status,400);
    assert.equal((await update({...previous,festival:'ramzan',greetingVariant:invalid})).status,400);
  }
  assert.deepEqual((await request('/api/festivals')).data.settings,previous);
});

test('ordinary page clicks do not toggle motion or mutate mobile branding',()=>{
  const writes=[],handlers={};
  const target=()=>({addEventListener(type,fn){handlers[type]=fn;},removeEventListener(){}});
  const document={...target(),hidden:false,body:{dataset:{festivalMotion:'running'}},querySelectorAll:()=>[]};
  const window={...target(),matchMedia:()=>({...target(),matches:false})};
  const context={window,document,console,localStorage:{getItem:()=>null,setItem:(...args)=>writes.push(args)},setInterval:()=>1,clearInterval(){}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'public/festival-effects.js'),'utf8'),context);
  window.ShopFestivalEffects.start({festivals:FESTIVALS,intensities:FESTIVAL_INTENSITIES,settings:{...DEFAULT_FESTIVAL}});
  // A normal link has the motion-marked body as an ancestor, but is not the control.
  handlers.click({target:{closest:selector=>selector==='[data-festival-motion]'?document.body:null}});
  assert.equal(writes.length,0);
  handlers.click({target:{closest:()=>({tagName:'BUTTON'})}});
  assert.deepEqual(writes,[['sssa-festival-motion','paused']]);
  window.ShopFestivalEffects.dispose();
});
