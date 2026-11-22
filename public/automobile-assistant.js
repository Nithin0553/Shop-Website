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
  const criticalAdvice = '⚠️ Stop riding or driving as soon as it’s safe. Switch off the vehicle if safe, stay clear of smoke or leaking fuel, and contact roadside assistance or a qualified mechanic. Don’t attempt repairs to brakes, steering, fuel systems or EV batteries.';
  function basicAdvice(question, vehicle) {
    const q = question.toLowerCase();
    if (urgent.test(q)) return criticalAdvice;
    const prefix = vehicle?.model ? 'For a ' + [vehicle.model,vehicle.year].filter(Boolean).join(' ') + ', ' : '';
    if (/(?:start|starting|ignition|crank|no power)/i.test(q))
      return prefix + 'check the kill switch, fuel/charge and side-stand or neutral setting. Don’t bypass safety switches or repeatedly crank. Do the dashboard lights work? Do you hear a click?';
    if (/(?:tyre|tire|puncture|pressure|wheel)/i.test(q))
      return prefix + 'check pressure when tyres are cold, using your vehicle label or owner’s manual. Look for cuts, bulges or low tread. Don’t ride with a damaged or flat tyre. Use manufacturer-approved tyre sizes.';
    if (/(?:part|spare|compatib|fitment|genuine|oil filter|air filter)/i.test(q))
      return prefix + 'note the make, exact model/variant, year and part number. Match the manufacturer’s fitment specifications, not just a photo. Ask our shop on WhatsApp to confirm two-wheeler part availability.';
    if (/(?:oil|lubricat|service)/i.test(q))
      return prefix + 'use the oil specification and service interval from your owner’s manual. Check the level on level ground using the manual’s method. Avoid hot parts and overfilling. Stop driving if there’s an oil-pressure warning or major leak.';
    if (/(?:chain|sprocket|clutch|belt|cvt)/i.test(q))
      return prefix + 'note when the noise or vibration occurs and check the service history. Chain/CVT adjustments depend on the exact model. Never touch moving parts with the engine running; ask a mechanic to inspect them.';
    if (/(?:battery|light|indicator|electric|charging)/i.test(q))
      return prefix + 'check if dashboard lights work and look for visibly damaged connectors. Don’t touch live wiring, short battery terminals or open EV batteries. A mechanic can test the charging system and confirm the right replacement.';
    if (/(?:sound|noise|rattle|vibrat)/i.test(q))
      return prefix + 'tell me when the sound happens—at idle, during acceleration, braking or over bumps—and where it comes from. Stop driving if there’s smoke, severe vibration or a brake/steering problem.';
    if (/(?:car|suv|dashboard|check engine|coolant)/i.test(q))
      return prefix + 'tell me the model, year, warning light and when the problem occurs. Follow the owner’s manual for warning symbols. Stop safely for a red oil-pressure, overheating or brake warning. Our shop mainly stocks two-wheeler parts.';
    return 'Tell me your vehicle model, the symptom and when it happens. I can suggest basic checks or help identify parts, but can’t confirm a diagnosis or stock availability.';
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
    vehicleSummary.textContent = model ? type + ' · ' + model : type + ' · Add model';
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