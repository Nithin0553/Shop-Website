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

test('two-character replies reach Gemini with their preceding context',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:'true',GEMINI_API_KEY:'test-key'},async()=>{
    const old=globalThis.fetch;
    let requestPayload;
    globalThis.fetch=async (_url,options)=>{
      requestPayload=JSON.parse(options.body);
      return {ok:true,status:200,json:async()=>({
        candidates:[{content:{parts:[{text:'Check the dashboard lights next.'}]}}]
      })};
    };
    try {
      const history=[
        {role:'user',text:'My bike is not starting.'},
        {role:'assistant',text:'Do you hear a clicking sound?'}
      ];
      const res=await handler(request('No',{
        ip:'2001:db8::106',body:{history}
      }));
      assert.equal(res.status,200);
      assert.equal((await res.json()).mode,'ai');
      assert.equal(requestPayload.contents.at(-1).parts[0].text,'No');
      assert.equal(requestPayload.contents[0].parts[0].text,'My bike is not starting.');
      assert.equal(requestPayload.generationConfig.thinkingConfig.thinkingLevel,'LOW');
      assert.equal(requestPayload.generationConfig.maxOutputTokens,2048);
    }finally{globalThis.fetch=old;}
  });
});

test('an empty or token-limited primary reply tries the secondary model',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:'true',GEMINI_API_KEY:'test-key'},async()=>{
    const old=globalThis.fetch;
    let count=0;
    globalThis.fetch=async()=>{
      count++;
      if(count===1)return {ok:true,status:200,json:async()=>({
        candidates:[{finishReason:'MAX_TOKENS',content:{parts:[]}}]
      })};
      return {ok:true,status:200,json:async()=>({
        candidates:[{finishReason:'STOP',content:{parts:[{text:'Check the battery lights.'}]}}]
      })};
    };
    try {
      const res=await handler(request('Why does my scooter not start?',{ip:'2001:db8::107'}));
      assert.equal(res.status,200);
      assert.equal((await res.json()).answer,'Check the battery lights.');
      assert.equal(count,2);
    }finally{globalThis.fetch=old;}
  });
});

test('safety-blocked Gemini replies do not trigger model fallback',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:'true',GEMINI_API_KEY:'test-key'},async()=>{
    const old=globalThis.fetch;
    let count=0;
    globalThis.fetch=async()=>{
      count++;
      return {ok:true,status:200,json:async()=>({
        candidates:[{finishReason:'SAFETY',content:{parts:[]}}]
      })};
    };
    try {
      const res=await handler(request('A general question about an engine part?',{ip:'2001:db8::108'}));
      assert.equal(res.status,503);
      assert.equal(count,1);
    }finally{globalThis.fetch=old;}
  });
});

test('invalid or oversized questions are rejected before AI requests',async()=>{
  await withEnv({AUTO_CHAT_ENABLED:'true',GEMINI_API_KEY:'test-key'},async()=>{
    const bad=await handler(request('a',{ip:'2001:db8::104'}));
    assert.equal(bad.status,400);
    const empty=await handler(request('',{ip:'2001:db8::109'}));
    assert.equal(empty.status,400);
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
  assert.match(backend,/Aim for|aim for|40–85 words/);
  assert.match(backend,/simple, everyday Indian English/);
  assert.match(backend,/common, friendly spoken words/);
  assert.match(backend,/little or no technical vehicle knowledge/);
  assert.match(backend,/at most 2–3 short, numbered/);
  assert.match(backend,/immediately explain it in simple words/);
  assert.match(backend,/Do not assume the customer knows words like CVT/);
  assert.match(backend,/at most 2–3 short, numbered, LOW-RISK steps/);
  assert.match(backend,/End with no more than ONE simple follow-up question/);
});

test('offline help uses simple familiar words and preserves safety warnings',()=>{
  const js=read('public/automobile-assistant.js');
  assert.match(js,/Check if there is enough petrol or battery charge/);
  assert.match(js,/When do you hear the sound/);
  assert.match(js,/correct spare part/);
  assert.match(js,/Call a mechanic or roadside help/);
  assert.match(js,/Do not touch bare wires or open an electric vehicle battery/);
  assert.doesNotMatch(js,/Chain\/CVT adjustments depend/);
  assert.doesNotMatch(js,/fitment specifications/);
});

test('chat text is readable on phones and does not repeat misleading AI-busy prefixes',()=>{
  const css=read('public/automobile-assistant.css');
  const js=read('public/automobile-assistant.js');
  assert.match(css,/max-width:94%;padding:13px 15px;/);
  assert.match(css,/font-size:16px;line-height:1\.6/);
  assert.match(css,/#vehicle-assistant \.va-bubble\{font-size:16px\}/);
  assert.match(css,/#vehicle-assistant \.va-form textarea\{font-size:16px\}/);
  assert.match(js,/let retryAIAt = 0/);
  assert.match(js,/Date\.now\(\) \+ 60_000/);
  assert.match(js,/basicAdvice\(message, vehicle, history\)/);
  assert.match(js,/statusText\.textContent = 'Basic help'/);
  assert.doesNotMatch(js,/AI is busy right now\./);
  assert.doesNotMatch(js,/\+ basicAdvice\(message,vehicle\)/);
});

test('simple offline yes/no answers follow the previous starting problem',()=>{
  const js=read('public/automobile-assistant.js');
  // Evaluate only the pure built-in advice helpers, not the browser UI.
  const start=js.indexOf('  const urgent = ');
  const end=js.indexOf('\n  let html;',start);
  assert.ok(start>0 && end>start);
  const evaluate=new Function(js.slice(start,end)+'\nreturn basicAdvice;')();
  const history=[{role:'user',text:'My bike is not starting'},{role:'assistant',text:'Do you hear a clicking sound?'}];
  const negative=evaluate('No',{type:'motorcycle',model:'',year:''},history);
  const positive=evaluate('Yes',{type:'motorcycle',model:'',year:''},history);
  assert.match(negative,/dashboard lights turn on/);
  assert.match(positive,/hear a click/);
  assert.doesNotMatch(negative,/AI is busy/);
  assert.match(evaluate('How do I check tyres?',{model:''},[]),/tyre-pressure label/);
});
