import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(path.join(root,name),'utf8');
const expectedId='cab6ea0c-9837-402f-8370-759a63ce2e5f';
const baseUrl='https://vdk-viber-runtime-prod.bot.botpress.host';

function harness(overrides={}) {
  const code=read('public/automobile-assistant.js');
  const start=code.indexOf('  function verifiedBotpressUrl(');
  const end=code.indexOf('  const prompts = [',start);
  assert.ok(start>0 && end>start, 'Botpress functions found before legacy assistant');
  const section=code.slice(start,end)
    .replace('  if (await switchToBotpress()) return;', '');
  const requests=[], loaded=[], appended=[], mounts=[];
  const site={
    whatsapp:'+91 9030084872',
    botpressInjectUrl:'',
    botpressConfigUrl:'',
    botpressEdgeBotId:expectedId,
    ...overrides
  };
  const webchat={
    mode:'embed',
    baseUrl:'https://untrusted.example',
    botId:'not-real',
    theme:'light'
  };
  const document={
    head:{append(element) {
      loaded.push({tag:element.tagName,src:element.src,href:element.href});
      queueMicrotask(()=>element.onload?.());
    }},
    body:{append(element){appended.push(element);}},
    createElement(tag) {
      return {tagName:tag,remove(){},setAttribute(k,v){this[k]=v}};
    }
  };
  const win={VdkEdgeWebchat:{mount:async options=>{mounts.push(options);}}};
  const fetcher=async url=>{
    requests.push(url);
    if(url==='/Shop-Website/static-data/site.json')
      return {ok:true,json:async()=>site};
    if(url===baseUrl+'/edge/bots/'+expectedId+'/config')
      return {ok:overrides.remoteOk!==false,json:async()=>({webchat})};
    throw Error('Unexpected fetch '+url);
  };
  const loader=new Function('window','document','fetch','BASE',section+'\nreturn switchToBotpress;');
  return {run:loader(win,document,fetcher,'/Shop-Website'),requests,loaded,appended,mounts};
}

test('the submitted Botpress bot ID is configured and supersedes old injector',()=>{
  const data=JSON.parse(read('data/site.json'));
  assert.equal(data.botpressEdgeBotId,expectedId);
  assert.equal(data.botpressInjectUrl,'');
  assert.equal(data.botpressConfigUrl,'');
  assert.match(read('public/admin.js'),/Botpress Edge bot ID \(bubble widget\)/);
});

test('official Edge embed URLs are used and bubble mode cannot be overridden by fetched config',async()=>{
  const h=harness();
  assert.equal(await h.run(),true);
  assert.deepEqual(h.loaded,[
    {tag:'link',src:undefined,href:baseUrl+'/edge/webchat.css'},
    {tag:'script',src:baseUrl+'/edge/webchat.js',href:undefined}
  ]);
  assert.deepEqual(h.requests,[
    '/Shop-Website/static-data/site.json',
    baseUrl+'/edge/bots/'+expectedId+'/config'
  ]);
  assert.equal(h.mounts.length,1);
  assert.equal(h.mounts[0].mode,'bubble');
  assert.equal(h.mounts[0].baseUrl,baseUrl);
  assert.equal(h.mounts[0].botId,expectedId);
  assert.equal(h.mounts[0].theme,'light');
  assert.equal(h.appended.length,0);
});

test('an invalid Edge bot ID cannot lead to an arbitrary URL or legacy chatbot',async()=>{
  const h=harness({botpressEdgeBotId:'cab6ea0c-9837-402f-8370-759a63ce2e5f/../../../bad'});
  assert.equal(await h.run(),true);
  assert.deepEqual(h.requests,['/Shop-Website/static-data/site.json']);
  assert.equal(h.loaded.length,0);
  assert.equal(h.mounts.length,0);
  assert.equal(h.appended.length,1);
  assert.equal(h.appended[0].href,'https://wa.me/919030084872');
});

test('unavailable Edge configuration shows shop contact, not a second inaccurate chatbot',async()=>{
  const h=harness({remoteOk:false});
  assert.equal(await h.run(),true);
  assert.equal(h.mounts.length,0);
  assert.equal(h.appended.length,1);
  assert.equal(h.appended[0].textContent,'Ask our shop');
});

test('blank Botpress configuration keeps preexisting assistant during intentional rollback',async()=>{
  const h=harness({botpressEdgeBotId:''});
  assert.equal(await h.run(),false);
  assert.equal(h.mounts.length,0);
  assert.equal(h.loaded.length,0);
  assert.equal(h.appended.length,0);
});
