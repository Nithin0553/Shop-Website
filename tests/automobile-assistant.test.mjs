import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import handler from '../netlify/functions/automobile-assistant.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=pathName=>readFileSync(path.join(root,pathName),'utf8');
const origin='https://nithin0553.github.io';
function request(message,options={}){
  const obj={
    message,
    vehicle:{type:'scooter',model:'Honda Activa 6G',year:'2023',language:'te'},
    history:[],
    ...options.body
  };
  return new Request('https://example-shop.netlify.app/.netlify/functions/automobile-assistant',{
    method:'POST',
    headers:{
      Origin:options.origin===undefined?origin:options.origin,
      'Content-Type':options.contentType||'application/json',
      'x-nf-client-connection-ip':options.ip||'2001:db8::100'
    },
    body:JSON.stringify(obj)
  });
}
const withEnv=async (env,run)=>{
  const old=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));
  for(const [k,v] of Object.entries(env)) {
    if(v===undefined)delete process.env[k];
    else process.env[k]=v;
  }
  try{return await run();}
  finally {
    for(const [k,v] of Object.entries(old)){
      if(v===undefined)delete process.env[k];
      else process.env[k]=v;
    }
  }
};

test('the existing shop pages load the floating assistant CSS and JS',()=>{
  const html=read('public/index.html');
  const js=read('public/automobile-assistant.js');
  const template=read('public/automobile-assistant.html');
  const css=read('public/automobile-assistant.css');
  assert.match(html,/\/automobile-assistant\.css/);
  assert.match(html,/\/automobile-assistant\.js/);
  assert.match(template,/Motorcycle/);
  assert.match(template,/Scooter/);
  assert.match(template,/Car/);
  assert.match(template,/తెలుగు/);
  assert.match(template,/हिन्दी/);
  assert.match(template,/aria-live="polite"/);
  assert.match(css,/max-width:650px/);
  assert.match(css,/va-panel\[hidden\]/);
  assert.match(js,/\.textContent = text;/);
  assert.match(js,/\/static-data\/site\.json/);
  assert.match(js,/\.netlify\/functions\/automobile-assistant/);
  assert.match(template,/General guidance · No personal details/);
  assert.doesNotMatch(js,/GEMINI_API_KEY|x-goog-api-key|ghp_|github_pat_/);
  assert.doesNotMatch(js,/localStorage|sessionStorage|document\.cookie/);
});

test('the AI endpoint is configurable by the owner without exposing a secret',()=>{
  const site=JSON.parse(read('data/site.json'));
  assert.equal(typeof site.chatbotApiUrl,'string');
  if (site.chatbotApiUrl) {
    const target=new URL(site.chatbotApiUrl);
    assert.equal(target.protocol,'https:');
    assert.equal(target.pathname,'/.netlify/functions/automobile-assistant');
  }
  assert.match(read('public/admin.js'),/Auto Assistant AI endpoint \(Netlify Function URL\)/);
  assert.match(read('netlify.toml'),/directory = "netlify\/functions"/);
  assert.ok(existsSync(path.join(root,'netlify-site/index.html')));
});

test('CORS preflight permits only the GitHub Pages origin',async()=>{
  const allow=await handler(new Request('https://example-shop.netlify.app/.netlify/functions/automobile-assistant',{
    method:'OPTIONS',headers:{Origin:origin}
  }));
  assert.equal(allow.status,200);
  assert.equal(allow.headers.get('Access-Control-Allow-Origin'),origin);
  const deny=await handler(new Request('https://example-shop.netlify.app/.netlify/functions/automobile-assistant',{
    method:'OPTIONS',headers:{Origin:'https://untrusted.example'}
  }));
  assert.equal(deny.status,403);
  const malformed=await handler(request('Can you help me?',{origin:'https://untrusted.example'}));
  assert.equal(malformed.status,403);
});

test('API remains inactive without a server-side Gemini key and explicit enable toggle',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:undefined,GEMINI_API_KEY:undefined},async()=>{
    const response=await handler(request('How do I check tyre pressure?'));
    assert.equal(response.status,503);
    assert.ok((await response.json()).error.includes('not configured'));
  });
});

test('urgent safety issues do not call AI model',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:'true',GEMINI_API_KEY:'test-key'},async()=>{
    const old=globalThis.fetch;
    globalThis.fetch=async()=>{throw Error('Critical symptoms should never call the model');};
    try{
      const result=await handler(request('My brakes have failed and I smell smoke',{ip:'2001:db8::101'}));
      assert.equal(result.status,200);
      const answer=(await result.json()).answer;
      assert.match(answer,/Stop riding or driving/);
      assert.match(answer,/qualified mechanic/);
    } finally {globalThis.fetch=old;}
  });
});

test('AI requests remain server-side, bounded and follow the requested language and vehicle',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:'true',GEMINI_API_KEY:'private-test-gemini-key'},async()=>{
    const prev=globalThis.fetch;
    let called=0;
    globalThis.fetch=async (url,options)=>{
      called++;
      assert.match(url,/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-/);
      assert.equal(options.headers['x-goog-api-key'],'private-test-gemini-key');
      assert.ok(!options.body.includes('private-test-gemini-key'));
      const payload=JSON.parse(options.body);
      assert.ok(payload.systemInstruction.parts[0].text.includes('Telugu'));
      assert.ok(payload.systemInstruction.parts[0].text.includes('Activa 6G'));
      assert.equal(payload.contents.at(-1).parts[0].text,'What does the air filter do?');
      return {ok:true,status:200,json:async()=>({candidates:[{
        content:{parts:[{text:'An air filter helps keep dust out of an engine. Confirm the right model before replacing it.'}]}
      }]})};
    };
    try{
      const result=await handler(request('What does the air filter do?',{ip:'2001:db8::102'}));
      assert.equal(result.status,200);
      const value=await result.json();
      assert.equal(value.mode,'ai');
      assert.match(value.answer,/air filter/i);
      assert.equal(called,1);
      assert.ok(!JSON.stringify(value).includes('private-test-gemini-key'));
    }finally{globalThis.fetch=prev;}
  });
});

test('temporary Gemini HTTP 503 safely uses second model and hides internal diagnostics',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:'true',GEMINI_API_KEY:'test-key'},async()=>{
    const prev=globalThis.fetch,urls=[];
    globalThis.fetch=async url=>{
      urls.push(url);
      if(urls.length===1)return {ok:false,status:503};
      return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'A mechanic can check the starter and battery.'}]}}]})};
    };
    try{
      const response=await handler(request('Why does the starter click?',{ip:'2001:db8::103'}));
      assert.equal(response.status,200);
      assert.equal(urls.length,2);
      assert.match(urls[1],/gemini-3\.6-flash/);
    }finally{globalThis.fetch=prev;}
  });
});

test('invalid or oversized questions are rejected before AI requests',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:'true',GEMINI_API_KEY:'test-key'},async()=>{
    const bad=await handler(request('a',{ip:'2001:db8::104'}));
    assert.equal(bad.status,400);
    const long=await handler(request('x'.repeat(801),{ip:'2001:db8::105'}));
    assert.equal(long.status,400);
  });
});

test('Netlify function code has no embedded AI tokens or stored customer messages',()=>{
  const code=read('netlify/functions/automobile-assistant.mjs');
  assert.match(code,/process\.env\.GEMINI_API_KEY/);
  assert.match(code,/AUTO_CHAT_ENABLED/);
  assert.match(code,/best-effort/i);
  assert.doesNotMatch(code,/localStorage|sessionStorage|writeFile|JSON\.stringify\(attempts\)/);
});

test('chat has minimal copy, optional vehicle details and accessible microinteractions',()=>{
  const template=read('public/automobile-assistant.html');
  const css=read('public/automobile-assistant.css');
  const js=read('public/automobile-assistant.js');
  const backend=read('netlify/functions/automobile-assistant.mjs');
  assert.match(template,/id="va-vehicle-details"/);
  assert.match(template,/<details\b/);
  assert.doesNotMatch(template,/<details[^>]*\bopen\b/);
  assert.match(template,/Hi! What can I help you with\?/);
  assert.match(template,/id="va-status-text"/);
  assert.match(template,/Ask Auto/);
  assert.match(template,/Ask our shop/);
  assert.doesNotMatch(template,/Motorcycles · Scooters · Cars/);
  assert.doesNotMatch(template,/AI answers can be incorrect/);
  assert.doesNotMatch(template,/Please don't share personal or payment/);
  assert.match(css,/@keyframes va-panel-in/);
  assert.match(css,/@keyframes va-bounce/);
  assert.match(css,/@keyframes va-caret/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css,/va-vehicle\[open\]/);
  assert.match(js,/function makeThinking\(/);
  assert.match(js,/function revealAnswer\(/);
  assert.match(js,/Intl\.Segmenter/);
  assert.match(js,/window\.matchMedia/);
  assert.match(js,/\.requestSubmit\(\)/);
  assert.match(js,/\.setAttribute\('aria-busy','true'\)/);
  assert.match(js,/window\.requestAnimationFrame/);
  assert.match(backend,/aim for 45–100 words/);
  assert.match(backend,/at most three short, safe checks/);
  assert.match(backend,/more only for an urgent safety warning/);
});
