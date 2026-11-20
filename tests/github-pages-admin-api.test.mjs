import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readFileSync(path.join(root,'scripts/github-pages-admin-adapter.js'),'utf8');
const encode=obj=>Buffer.from(JSON.stringify(obj),'utf8').toString('base64');
const decode=base64=>JSON.parse(Buffer.from(base64,'base64').toString('utf8'));

function setupAdmin() {
  const files=new Map([
    ['data/site.json',{shopName:'Sri Sai Shanmukha Auto Centre',phone:'+91 9030084872',mapsUrl:''}],
    ['data/blogs.json',[]],
    ['data/festival.json',{enabled:false,festival:'sankranti',intensity:'low',greetingVariant:'default'}]
  ]);
  const shas=new Map([...files.keys()].map(file=>[file,'sha-original-'+file]));
  const observed=[];
  const festivals={
    festivals:[{id:'sankranti',greetingVariants:{default:{greeting:'Happy Sankranti'}}},
      {id:'diwali',greetingVariants:{default:{greeting:'Happy Diwali'}}}],
    intensities:{low:{label:'Minimal'},medium:{label:'Subtle'},high:{label:'Festive'}},
    settings:files.get('data/festival.json')
  };
  let nextSha=1;
  async function fetchMock(url,options={}) {
    const target=new URL(url);
    observed.push({url,options});
    const reply=(body,status=200)=>({status,ok:status>=200&&status<300,json:async()=>body});
    if(target.href==='https://api.github.com/user'){
      if(options.headers?.Authorization!=='Bearer github_pat_admin_test')return reply({},401);
      return reply({login:'Nithin0553'});
    }
    if(target.pathname==='/Shop-Website/static-data/festivals.json')return reply(festivals);
    const prefix='/repos/Nithin0553/Shop-Website/contents/';
    if(target.hostname!=='api.github.com'||!target.pathname.startsWith(prefix))return reply({},404);
    if(options.headers?.Authorization!=='Bearer github_pat_admin_test')return reply({},401);
    const file=decodeURIComponent(target.pathname.slice(prefix.length));
    if(options.method==='PUT') {
      const body=JSON.parse(options.body);
      if(file==='public/assets/custom-test.png')return reply({content:{sha:'image-sha'}},201);
      if(file.startsWith('public/assets/custom-'))return reply({content:{sha:'image-sha'}},201);
      if(!files.has(file))return reply({},404);
      if(body.branch!=='main'||body.sha!==shas.get(file))return reply({},409);
      files.set(file,decode(body.content));
      const next='sha-'+nextSha++;
      shas.set(file,next);
      return reply({content:{sha:next}},200);
    }
    if(file==='public/assets')return reply([{type:'file',name:'oil-care.webp'},{type:'file',name:'readme.txt'}]);
    if(!files.has(file))return reply({},404);
    return reply({content:encode(files.get(file)),sha:shas.get(file)});
  }
  const context=vm.createContext({
    fetch:fetchMock, URL, TextEncoder, TextDecoder, Uint8Array, atob, btoa,
    crypto:webcrypto, Date, Map, Object, String, Number, console
  });
  vm.runInContext(source+'\n;globalThis.adminApi=api;',context);
  return {api:context.adminApi, files,observed};
}
const request=(method,data)=>({method,body:JSON.stringify(data)});

test('GitHub-backed admin requires owner authentication and stores no tokens',async()=>{
  const {api,observed}=setupAdmin();
  assert.equal((await api('/api/admin/me')).authenticated,false);
  await assert.rejects(api('/api/admin/login',request('POST',{password:'incorrect'})),/fine-grained GitHub/);
  await api('/api/admin/login',request('POST',{password:'github_pat_admin_test'}));
  assert.equal((await api('/api/admin/me')).authenticated,true);
  assert.equal(observed.filter(x=>x.url.startsWith('https://api.github.com')).length>0,true);
  assert.ok(observed.every(x=>x.url.startsWith('https://api.github.com/repos/Nithin0553/Shop-Website/') || x.url==='https://api.github.com/user'));
  await api('/api/admin/logout',request('POST',{}));
  assert.equal((await api('/api/admin/me')).authenticated,false);
  await assert.rejects(api('/api/admin/site'),/Please sign in/);
  assert.doesNotMatch(source,/localStorage|sessionStorage|document\.cookie/);
});

test('shop settings commits to GitHub with the current SHA and main branch',async()=>{
  const {api,files,observed}=setupAdmin();
  await api('/api/admin/login',request('POST',{password:'github_pat_admin_test'}));
  const initial=await api('/api/admin/site');
  assert.equal(initial.shopName,'Sri Sai Shanmukha Auto Centre');
  const saved=await api('/api/admin/site',request('PUT',{phone:'+91 9000000000',mapsUrl:'https://maps.app.goo.gl/TestShop'}));
  assert.equal(saved.phone,'+91 9000000000');
  assert.equal(saved.mapsUrl,'https://maps.app.goo.gl/TestShop');
  assert.equal(files.get('data/site.json').phone,'+91 9000000000');
  const commits=observed.filter(x=>x.options.method==='PUT');
  assert.equal(commits.length,1);
  const body=JSON.parse(commits[0].options.body);
  assert.equal(body.branch,'main');
  assert.equal(body.sha,'sha-original-data/site.json');
  assert.ok(body.message.includes('shop details'));
});

test('blog CRUD and image upload use GitHub Contents API without a server',async()=>{
  const {api,files}=setupAdmin();
  await api('/api/admin/login',request('POST',{password:'github_pat_admin_test'}));
  const images=await api('/api/admin/images');
  assert.deepEqual(JSON.stringify(images),JSON.stringify(['oil-care.webp']));
  const payload={title:'How to take care of your bike',slug:'bike-care-guide',category:'Bike Care',
    summary:'Advice for everyday riders.',image:'oil-care.webp',status:'published',
    body:'Regular motorcycle maintenance keeps your bike safe and reliable. Always check oil, tyres, brakes and service intervals. Consult a qualified mechanic for unexpected problems.'};
  const created=await api('/api/admin/blogs',request('POST',payload));
  assert.equal(created.slug,'bike-care-guide');
  assert.equal(files.get('data/blogs.json').length,1);
  const changed=await api('/api/admin/blogs/'+created.id,request('PUT',{...payload,title:'Bike care and maintenance'}));
  assert.equal(changed.title,'Bike care and maintenance');
  const uploaded=await api('/api/admin/images',request('POST',{dataUrl:'data:image/png;base64,aGVsbG8='}));
  assert.ok(uploaded.filename.startsWith('custom-'));
  await api('/api/admin/blogs/'+created.id,request('DELETE',{}));
  assert.equal(files.get('data/blogs.json').length,0);
});

test('festival updates validate choices and commit only settings',async()=>{
  const {api,files}=setupAdmin();
  await api('/api/admin/login',request('POST',{password:'github_pat_admin_test'}));
  const current=await api('/api/admin/festivals');
  assert.equal(current.festivals.length,2);
  await assert.rejects(api('/api/admin/festivals',request('PUT',{
    enabled:true,festival:'not-a-real-festival',intensity:'low'})),/valid festival/);
  const saved=await api('/api/admin/festivals',request('PUT',{
    enabled:true,festival:'diwali',intensity:'high',greetingVariant:'default'
  }));
  assert.equal(saved.enabled,true);
  assert.equal(files.get('data/festival.json').festival,'diwali');
});
