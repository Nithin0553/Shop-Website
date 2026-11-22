/* Sri Sai Shanmukha Auto Centre — public vehicle help widget.
   Works on GitHub Pages without a server; AI requires an owner-configured
   separate HTTPS Netlify Function. No API keys or chat history persisted. */
(async () => {
  'use strict';
  const BASE = window.__SHOP_STATIC_BASE__ || '/Shop-Website';
  const prompts = [
    {label:'Won’t start',question:'My bike is not starting. What can I safely check?'},
    {label:'Tyre pressure',question:'How do I check the correct tyre pressure?'},
    {label:'Find a spare part',question:'How do I find a compatible spare part?'},
    {label:'Strange noise',question:'My scooter is making a strange noise. What should I check?'}
  ];
  const urgent = /(?:brak(?:e|es|ing).{0,55}(?:fail|not work|no response|lost|gone|stopp?ed)|(?:no|lost|without).{0,20}brak|fuel.{0,35}leak|petrol.{0,35}leak|smoke|fire|burning smell|(?:battery|charger).{0,45}(?:swoll|smok|hot|fire)|stuck throttle|steering.{0,35}(?:lock|fail|jam)|wheel.{0,20}(?:wobble|loose|detach)|accident|crash|overheat(?:ing)?|severe coolant leak)/i;
  const criticalAdvice = '⚠️ Stop the vehicle as soon as it is safe. Switch off the engine if safe. Stay away from smoke, fire or leaking petrol. Call a mechanic or roadside help. Do not try to repair brakes, steering, fuel leaks or EV batteries yourself.';
  function basicAdvice(question, vehicle) {
    const q = question.toLowerCase();
    if (urgent.test(q)) return criticalAdvice;
    const prefix = vehicle?.model ? 'For your ' + [vehicle.model,vehicle.year].filter(Boolean).join(' ') + ': ' : '';
    if (/(?:start|starting|ignition|crank|no power)/i.test(q))
      return prefix + '1. Check if there is enough petrol or battery charge.\n2. Check that the engine stop switch is ON and the side stand is up (if fitted).\n3. See if the dashboard lights turn on.\nDo you hear a clicking sound when you press start? Do not bypass any safety switch.';
    if (/(?:tyre|tire|puncture|pressure|wheel)/i.test(q))
      return prefix + '1. Check the air pressure when the tyres are cold. Use the number in your vehicle manual or tyre-pressure label.\n2. Look for cuts, bumps or worn-out tyres.\nDo not ride if a tyre is flat or damaged. Use only the tyre size recommended for your vehicle.';
    if (/(?:part|spare|compatib|fitment|genuine|oil filter|air filter)/i.test(q))
      return prefix + 'Tell us the vehicle company, exact model, year and the old part number (if available). This helps us find the correct spare part. Do not buy only by looking at a photo. Ask our shop on WhatsApp to check which two-wheeler parts are available.';
    if (/(?:oil|lubricat|service)/i.test(q))
      return prefix + 'Check your vehicle manual for the correct engine oil and when to change it. Park on flat ground and follow the manual to check the oil level. Do not touch a hot engine or add too much oil. If the oil warning light comes on or oil is leaking badly, stop driving and call a mechanic.';
    if (/(?:chain|sprocket|clutch|belt|cvt)/i.test(q))
      return prefix + 'Listen for unusual sounds and note when they happen. Do not touch the chain, belt or other moving parts while the engine is ON. The correct adjustment depends on your vehicle. Ask a mechanic to check it.';
    if (/(?:battery|light|indicator|electric|charging)/i.test(q))
      return prefix + 'First check whether the dashboard lights turn on. Look for loose or damaged wires without touching them. Do not touch bare wires or open an electric vehicle battery. A mechanic can test the battery and help you choose the right one.';
    if (/(?:sound|noise|rattle|vibrat)/i.test(q))
      return prefix + 'When do you hear the sound: when starting, speeding up, using the brakes or going over bumps? Where does it come from? If you notice smoke, strong shaking or a brake/steering problem, stop safely and call a mechanic.';
    if (/(?:car|suv|dashboard|check engine|coolant)/i.test(q))
      return prefix + 'Tell me the car model, year and which dashboard warning light is showing. Check your vehicle manual for what it means. If the engine is too hot or a red oil or brake warning is on, stop safely and call a mechanic. Our shop mainly sells bike and scooter parts.';
    return 'What bike, scooter or car do you have? Tell me the model and what problem you see. I can suggest simple checks or help find the right spare part.';
  }
  let html;
  try {
    const response = await fetch(BASE + '/automobile-assistant.html');
    if (!response.ok) return;
    html = await response.text();
  } catch { return; }
  const root = document.createElement('div');
  root.id = 'vehicle-assistant';
  root.innerHTML = html; // Trusted, repository-owned static HTML only.
  document.body.append(root);
  const $ = selector => root.querySelector(selector);
  const openButton = $('#va-open'), panel = $('#va-panel'), messages = $('#va-messages');
  const question = $('#va-question'), send = $('#va-send'), status = $('#va-status');
  const statusText = $('#va-status-text'), vehicleSummary = $('#va-vehicle-summary');
  const chips = $('#va-chips'), shopLink = $('#va-whatsapp');
  let endpoint = '', whatsapp = '', busy = false, history = [];
  async function configure() {
    try {
      const response = await fetch(BASE + '/static-data/site.json', {cache:'no-store'});
      if (!response.ok) return;
      const data = await response.json();
      const configured = String(data.chatbotApiUrl || '').trim();
      if (configured) {
        const url = new URL(configured);
        if (url.protocol === 'https:' &&
            (url.hostname === 'netlify.app' || url.hostname.endsWith('.netlify.app')) &&
            url.pathname === '/.netlify/functions/automobile-assistant' &&
            !url.username && !url.password && !url.search && !url.hash) {
          endpoint = url.href;
          statusText.textContent = 'AI ready';
          status.classList.remove('va-unavailable');
        }
      }
      const digits = String(data.whatsapp || data.phone || '').replace(/\D/g, '');
      if (/^\d{10,15}$/.test(digits)) {
        whatsapp = digits;
        shopLink.hidden = false;
        shopLink.href = 'https://wa.me/' + whatsapp;
      }
    } catch { /* Keep the basic assistant operational. */ }
  }
  void configure();

  // Vehicle details stay optional and out of the way until requested.
  const vehicleInputs = ['#va-type','#va-model','#va-year','#va-language'];
  function updateVehicleSummary() {
    const type = $('#va-type').selectedOptions[0]?.textContent || 'Motorcycle';
    const model = $('#va-model').value.trim();
    const language = $('#va-language').selectedOptions[0]?.textContent || 'English';
    vehicleSummary.textContent = model ? model + ' · ' + language : type + ' · ' + language;
  }
  vehicleInputs.forEach(selector => $(selector).addEventListener('input', updateVehicleSummary));
  vehicleInputs.forEach(selector => $(selector).addEventListener('change', updateVehicleSummary));
  updateVehicleSummary();

  function resizeQuestion() {
    question.style.height = '43px';
    question.style.height = Math.min(question.scrollHeight,115) + 'px';
  }
  question.addEventListener('input', resizeQuestion);

  function show(open) {
    panel.hidden = !open;
    openButton.setAttribute('aria-expanded', String(open));
    openButton.classList.toggle('va-active', open);
    if (open) {
      messages.scrollTop = messages.scrollHeight;
      question.focus();
    } else openButton.focus();
  }
  openButton.addEventListener('click', () => show(panel.hidden));
  $('#va-close').addEventListener('click', () => show(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) show(false);
  });
  function addBubble(text, who) {
    const element = document.createElement('div');
    element.className = 'va-bubble va-' + who;
    element.textContent = text; // AI/user responses are never executable HTML.
    messages.append(element);
    while (messages.children.length > 28) messages.firstElementChild.remove();
    messages.scrollTop = messages.scrollHeight;
    return element;
  }
  function makeThinking() {
    const bubble = addBubble('', 'assistant');
    bubble.classList.add('va-thinking');
    bubble.setAttribute('aria-label','Thinking');
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.setAttribute('aria-hidden','true');
      bubble.append(dot);
    }
    return bubble;
  }

  async function revealAnswer(text, immediate = false) {
    // One accessible full-text announcement; visual characters animate only
    // on devices that permit motion. Never stream live DOM fragments to readers.
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (immediate || reduceMotion || document.hidden || text.length < 12) {
      return addBubble(text, 'assistant');
    }
    const bubble = addBubble('', 'assistant');
    bubble.classList.add('va-revealing');
    const accessible = document.createElement('span');
    accessible.className = 'va-sr-only';
    accessible.textContent = text;
    bubble.append(accessible);
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden','true');
    bubble.append(visual);
    const cursor = document.createElement('span');
    cursor.className = 'va-caret';
    cursor.setAttribute('aria-hidden','true');
    bubble.append(cursor);
    const segments = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].map(x=>x.segment)
      : Array.from(text);
    const duration = Math.min(1000,Math.max(350,segments.length * 2.5));
    await new Promise(resolve => {
      let started;
      function frame(now) {
        if (started === undefined) started = now;
        const progress = Math.min(1,(now - started) / duration);
        const count = Math.max(1,Math.ceil(segments.length * (1 - Math.pow(1-progress,2))));
        visual.textContent = segments.slice(0,count).join('');
        messages.scrollTop = messages.scrollHeight;
        if (progress < 1 && !panel.hidden) window.requestAnimationFrame(frame);
        else {
          visual.textContent = text;
          cursor.remove();
          bubble.classList.remove('va-revealing');
          resolve();
        }
      }
      window.requestAnimationFrame(frame);
    });
    return bubble;
  }

  for (const prompt of prompts) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = prompt.label;
    button.addEventListener('click', () => {
      if (busy) return;
      question.value = prompt.question;
      resizeQuestion();
      $('#va-form').requestSubmit();
    });
    chips.append(button);
  }
  question.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      $('#va-form').requestSubmit();
    }
  });
  shopLink.addEventListener('click', () => {
    if (!whatsapp) return;
    const latest = [...history].reverse().find(entry => entry.role === 'user')?.text || '';
    shopLink.href = 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(
      'Hello Sri Sai Shanmukha Auto Centre, I need advice about my vehicle: ' + latest.slice(0,350)
    );
  });
  async function askAI(message, vehicle) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 29000);
    try {
      const response = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message,vehicle,history:history.slice(-6)}),
        signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'
      });
      if (!response.ok) throw Error('AI unavailable');
      const data = await response.json();
      if (!data || typeof data.answer !== 'string' || !data.answer.trim() || data.answer.length > 3500)
        throw Error('Unexpected response');
      return data.answer;
    } finally { clearTimeout(timeout); }
  }
  $('#va-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    const message = question.value.trim();
    if (!message || message.length > 800) return;
    const yearText = $('#va-year').value.trim();
    const vehicle = {
      type:$('#va-type').value,
      model:$('#va-model').value.trim().slice(0,70),
      year:/^(19|20)\d{2}$/.test(yearText) ? yearText : '',
      language:$('#va-language').value
    };
    question.value = '';
    resizeQuestion();
    addBubble(message,'user');
    chips.hidden = true;
    busy = true;
    send.disabled = true;
    $('#va-form').setAttribute('aria-busy','true');
    let answer;
    if (urgent.test(message)) answer = criticalAdvice;
    else if (!endpoint) answer = basicAdvice(message, vehicle);
    else {
      const indicator = makeThinking();
      try {
        answer = await askAI(message,vehicle);
        statusText.textContent = 'AI ready';
        status.classList.remove('va-unavailable');
      } catch {
        answer = 'AI is busy right now. ' + basicAdvice(message,vehicle);
        statusText.textContent = 'Quick help';
        status.classList.add('va-unavailable');
      } finally { indicator.remove(); }
    }
    await revealAnswer(answer,urgent.test(message));
    history.push({role:'user',text:message},{role:'assistant',text:answer});
    history = history.slice(-8);
    busy = false;
    send.disabled = false;
    $('#va-form').removeAttribute('aria-busy');
    if (!panel.hidden) question.focus();
  });
})();