import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { FESTIVALS } from '../lib/festivals.mjs';

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
  await startServer();
  const response=await fetch(base+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
  assert.equal(response.status,200);cookie=response.headers.get('set-cookie').split(';')[0];
});
after(async()=>{await stopServer();fs.rmSync(temp,{recursive:true,force:true});});

test('old installations start with festival mode off and all 20 requested choices',async()=>{
  const result=await request('/api/festivals');
  assert.equal(result.status,200);
  assert.deepEqual(result.data.settings,{enabled:false,festival:'sankranti'});
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
    const desired={enabled:true,festival:festival.id};
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
  await update({enabled:true,festival:'bathukamma'});
  const site=await request('/api/admin/site',{admin:true});
  assert.equal((await request('/api/admin/site',{method:'PUT',admin:true,body:{...site.data,tagline:'Two-wheeler spare parts'}})).status,200);
  assert.deepEqual((await request('/api/festivals')).data.settings,{enabled:true,festival:'bathukamma'});
  assert.deepEqual((await update({enabled:false,festival:'bathukamma'})).data,{enabled:false,festival:'bathukamma'});
  assert.deepEqual((await request('/api/festivals')).data.settings,{enabled:false,festival:'bathukamma'});
  await update({enabled:false,festival:'diwali'});
  assert.deepEqual((await request('/api/festivals')).data.settings,{enabled:false,festival:'diwali'});
});

test('theme and on/off setting survive restarts in the persistent data directory',async()=>{
  await update({enabled:true,festival:'diwali'});
  await stopServer();await startServer();
  assert.deepEqual((await request('/api/festivals')).data.settings,{enabled:true,festival:'diwali'});
  await update({enabled:false,festival:'diwali'});
  await stopServer();await startServer();
  assert.deepEqual((await request('/api/festivals')).data.settings,{enabled:false,festival:'diwali'});
});

test('festival assets are served with correct types under the existing content security policy',async()=>{
  for(const [route,type] of [['/festival-effects.js','text/javascript'],['/festivals.css','text/css']]) {
    const response=await fetch(base+route);
    assert.equal(response.status,200);
    assert.ok(response.headers.get('content-type').includes(type));
    assert.ok(response.headers.get('content-security-policy').includes("script-src 'self'"));
  }
  for(const route of ['/','/admin']) {
    const html=await (await fetch(base+route)).text();
    assert.ok(html.includes('/festival-effects.js'));assert.ok(html.includes('/festivals.css'));
  }
});

test('every preview has distinct local vector artwork, an escaped greeting and a motion control',()=>{
  const context={window:{matchMedia:()=>({matches:false,addEventListener(){}})},document:{hidden:false,addEventListener(){}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'public/festival-effects.js'),'utf8'),context);
  const outputs=new Set();
  for(const theme of FESTIVALS) {
    const html=context.window.ShopFestivalEffects.preview(theme,'Shop <img src=x onerror=alert(1)>');
    assert.ok(html.includes(`data-festival="${theme.id}"`),theme.name);
    assert.ok(html.includes(theme.greeting),theme.name);
    assert.ok(html.includes('<svg '),theme.name);
    assert.ok(html.includes('data-festival-motion'),theme.name);
    assert.ok(html.includes('Shop &lt;img'));
    assert.ok(!html.includes('<img '));
    assert.ok(!html.includes('style='),'Artwork works with the strict CSP');
    outputs.add(html.match(/<svg[\s\S]*?<\/svg>/)[0]);
  }
  assert.equal(outputs.size,20,'Every festival has its own illustration');
  assert.equal(context.window.ShopFestivalEffects.preview({id:'unknown',motif:'__proto__'}),'');
});

test('reduced-motion users get paused artwork and a clearly labelled control',()=>{
  const context={window:{matchMedia:()=>({matches:true,addEventListener(){}})},document:{hidden:false,addEventListener(){}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'public/festival-effects.js'),'utf8'),context);
  const html=context.window.ShopFestivalEffects.preview(FESTIVALS.find(f=>f.id==='diwali'));
  assert.ok(html.includes('data-paused="true"'));
  assert.ok(html.includes('Motion reduced'));
  assert.ok(fs.readFileSync(path.join(root,'public/festivals.css'),'utf8').includes('@media(prefers-reduced-motion:reduce)'));
});
