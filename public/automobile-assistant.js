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
  const urgent = /(?:brak(?:e|es|ing).{0,55}(?:fail|not work|no response|lost|gone|stopp?ed)|(?:no|lost|without).{0,20}brak|fuel.{0,35}leak|petrol.{0,35}leak|smok(?:e|ing)|\bfire\b|burning smell|(?:battery|charger).{0,45}(?:swoll|smok|hot|fire)|stuck throttle|steering.{0,35}(?:lock|fail|jam)|wheel.{0,20}(?:wobble|loose|detach)|accident|crash|overheat(?:ing)?|severe coolant leak)/i;
  const criticalAdvice = '⚠️ Stop the vehicle as soon as it is safe. Switch off the engine if safe. Stay away from smoke, fire or leaking petrol. Call a mechanic or roadside help. Do not try to repair brakes, steering, fuel leaks or EV batteries yourself.';
  function basicAdvice(question, vehicle, conversation = []) {
    const q = String(question || '').trim().toLowerCase();
    const brakeLightQuestion = /\bbrake\s+lights?\b/.test(q) && !/\bbrakes?\s+(?:fail|don.t stop|not working|not stopping)\b|\bno brakes\b/.test(q);
    if (!brakeLightQuestion && urgent.test(q)) return criticalAdvice;
    const vehicleName = [vehicle?.model, vehicle?.year].filter(Boolean).join(' ');
    const prefix = vehicleName ? 'For your ' + vehicleName + ': ' : '';
    const priorUsers = conversation.filter(item => item.role === 'user').map(item => item.text || '');
    const lastAssistant = [...conversation].reverse().find(item => item.role === 'assistant')?.text.toLowerCase() || '';
    const followUp = (lastAssistant.match(/[^.!?\n]+\?/g) || []).at(-1) || '';
    const symptom = priorUsers.slice(-4).join(' ').toLowerCase();
    const context = (symptom + ' ' + q).trim();
    const isElectric = /\b(ev|electric (?:bike|car|scooter|vehicle)|e-scooter)\b|ather|ola s1|chetak electric/i.test(
      context + ' ' + (vehicle?.model || '')
    );

    // Short replies MUST follow the assistant's actual last question; earlier
    // versions guessed from the first customer symptom and went down wrong paths.
    if (/^(?:no|nope|nah|nothing|ledu|nahi|లేదు|नहीं)[.! ]*$/i.test(q) ||
        /^(?:yes|yeah|yep|avunu|haan|అవును|हाँ)[.! ]*$/i.test(q)) {
      const yes = /^(?:yes|yeah|yep|avunu|haan|అవును|हाँ)/i.test(q);
      if (/\bor nothing\b|\bclick[^?]{0,40}\bor\b/.test(followUp)) {
        return 'When you press start, which one happens: a click, the engine turning, or no sound at all?';
      }
      if (/\b(click|clicking)\b/.test(followUp)) {
        return yes
          ? 'If you hear a click but the engine does not start, the battery or starter may need checking. Do not keep pressing start. Do the dashboard lights become dim when you press it?'
          : 'Okay, no clicking sound. Check whether the dashboard lights turn on when the key is ON. If they are off too, the battery, switch or fuse may need checking. Do the dashboard lights turn on?';
      }
      if (/\b(dim|dimmer|fainter)\b/.test(followUp)) {
        return yes
          ? 'If the lights dim strongly when pressing start, the battery may be weak, but this needs testing. Avoid repeated starting attempts. Does the engine turn at all?'
          : 'If the lights stay bright but the starter does not turn, a mechanic may need to check the starter circuit. Does the engine turn at all when you press start?';
      }
      if (/\b(dashboard lights|dash lights|lights turn on)\b/.test(followUp)) {
        return yes
          ? 'The dashboard has power, so a completely dead battery is less likely, but it can still be weak. When you press start once, do you hear a click, the engine turning, or nothing?'
          : 'No dashboard lights means the electrical supply may be interrupted. Check that the key and engine switch are ON. Do not touch wires. A mechanic can check the battery and fuse safely.';
      }
      if (/\b(flat tyre|flat tire|puncture)\b/.test(followUp)) {
        return yes
          ? 'Do not ride on a flat or punctured tyre. Use roadside help or take the wheel to a tyre repair shop. Do not pull out a nail or screw yourself.'
          : 'Okay. Is the tyre losing air slowly, or are you asking for the correct pressure?';
      }
      return 'Could you tell me what you mean by ' + (yes ? '"yes"' : '"no"') +
        '? I want to follow the right question, not guess about your vehicle.';
    }

    // Distinguish a real puncture from a routine pressure question.
    if (/\b(punctur(?:e|ed)|flat tyre|flat tire|tyre is flat|tire is flat|tyre got flat|tire got flat|nail in (?:my |the )?(?:tyre|tire)|air leak(?:ing)? from (?:my |the )?(?:tyre|tire))\b/i.test(q)) {
      return prefix + 'Do not ride on a flat tyre. If you can see a nail or screw, leave it in place. Ask a tyre repair shop to check whether it can be repaired safely. Is the tyre completely flat or losing air slowly?';
    }
    if (/\b(tyre|tire)\b/.test(q) && /\b(pressure|psi|air|inflate|fill)\b/.test(q)) {
      return prefix + '1. Check tyre pressure before riding, when the tyres are cold.\n2. Use a tyre-pressure gauge and the value on your vehicle label or in the owner manual. Front and rear values can differ.\nTell me the exact model and year if you need help finding the label.';
    }

    if (/\b(tyre|tire)s?\b/.test(q) && /\b(check|inspect|look|maintenance)\b/.test(q)) {
      return prefix + 'Check the tyre for cuts, bulges, nails and worn tread while parked. Check pressure when cold using the tyre-pressure label or owner manual. Do not ride if the tyre is flat, badly damaged or losing air quickly.';
    }

    if (brakeLightQuestion) {
      return prefix + 'The brake light tells vehicles behind you that you are slowing down. With the bike parked, check whether it lights up when each brake lever or pedal is pressed. Avoid opening live wiring. Have a mechanic check it before riding if it stays off. Does it fail with both brakes?';
    }

    // A warning light is not the same as a dead headlight or a battery problem.
    if (/\b(check engine|engine warning|oil warning|red oil|warning light|abs light)\b/.test(q)) {
      return prefix + 'Which warning symbol is showing, and is it red or amber? If the red oil or brake warning stays on, or the engine is overheating, stop safely and arrange inspection. Do not assume a warning light means a specific part must be replaced.';
    }

    if (/\b(start|starting|crank|ignition|won.t start|no power)\b/.test(q)) {
      if (/\b(click|clicking)\b/.test(q) && !/\b(no|without|doesn.t|not|never)\s+(?:any\s+)?(?:click|clicking)\b/.test(q)) {
        return prefix + 'A click when starting can happen with a weak battery or a starter problem, but it is not a confirmed diagnosis. Check whether the dashboard lights become dim as you press start once. Do they dim?';
      }
      if (/\b(no lights|dash(?:board)? (?:is )?(?:off|dead)|nothing happens|completely dead|no (?:click|clicking))\b/.test(q)) {
        return prefix + 'If no lights or clicking appear, first see whether the dashboard lights work with the key ON. If they do not, the battery, key switch or fuse may need checking. Do the dashboard lights turn on?';
      }
      if (/\b(cranks? but|engine turns over|turns over but)\b/.test(q)) {
        return prefix + (isElectric
          ? 'If the motor does not move although the display is on, check for a stand or brake-start warning. Do not open the battery.'
          : 'If the starter turns the engine but it does not fire, check there is petrol and the engine-stop switch is ON. Do not keep trying for long.') +
          ' Is any warning light showing?';
      }
      return prefix + (isElectric
        ? 'Check whether the display turns on and the vehicle is charged. Do not open the EV battery or bypass a safety switch.'
        : 'Check whether the dashboard lights turn on with the key ON. Check if there is enough petrol or battery charge, as appropriate for your vehicle.') +
        ' When you press start, do you hear a click, the engine turning, or nothing?';
    }

    if (/\b(air filter)\b/.test(q)) {
      return prefix + 'An air filter keeps dust and dirt from entering the engine. A blocked filter can reduce airflow, but it is not proof of a particular fault. The correct filter depends on your exact model and variant. Are you asking what it does or looking for a replacement?';
    }
    if (/\b(part|spare|compatib|fitment|genuine|original|price|cost|available|stock|buy)\b/.test(q)) {
      return prefix + 'To find the correct spare part, tell us its name and your bike or scooter company, exact model, variant and year. An old part number helps too. Our shop can check availability and price on WhatsApp; I cannot confirm live stock or fitment here.';
    }
    if (/\b(oil|lubricat|service)\b/.test(q)) {
      return prefix + 'Use the engine oil type and service interval given in your vehicle manual; they differ by model. Check the level only as your manual explains, on level ground. Do not open a hot engine. Which model and year are you asking about?';
    }
    if (/\b(chain|sprocket|clutch|belt|cvt)\b/.test(q)) {
      return prefix + 'If there is unusual sound or slipping, note when it happens. Never touch the chain, belt or moving parts with the engine ON. A mechanic can inspect wear and adjustment. Does the problem happen while starting or while riding?';
    }
    if (/\b(battery|headlight|indicator|electric|charging|horn)\b/.test(q)) {
      return prefix + 'Check whether the dashboard lights and horn work when the key is ON. If the lights dim strongly when starting, the battery may be weak, but it needs testing to confirm. Do not touch bare wires or open an electric vehicle battery. Which part is not working?';
    }
    if (/\b(sound|noise|rattle|vibrat|squeak|knock)\b/.test(q)) {
      return prefix + 'When do you hear the sound: while starting, speeding up, braking or going over bumps? Tell me where it comes from too. Do not ride if there is strong shaking, brake trouble or a loose wheel. When do you hear the sound?';
    }
    if (/\b(car|suv|coolant|radiator)\b/.test(q)) {
      return prefix + 'Tell me the car model, year and exactly what happens. If the engine is overheating or a red oil or brake warning is on, stop safely and call a mechanic. Our shop mainly sells bike and scooter spare parts.';
    }
    return prefix + 'Tell me the exact problem you notice and when it happens (starting, riding or braking). Also tell me the vehicle model if you know it. Then I can suggest a relevant safe check instead of guessing.';
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
  let retryAIAt = 0; // A short cooldown prevents repeated failed calls.
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
          statusText.textContent = 'Quick help';
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
      const type = $('#va-type').value;
      const vehicle = type === 'car' ? 'car' : type === 'scooter' ? 'scooter' : 'bike';
      question.value = prompt.question.replace(/\b(bike|scooter)\b/i, vehicle);
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
      if (!response.ok) throw Error('AI service unavailable (HTTP ' + response.status + ')');
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
    else if (!endpoint || Date.now() < retryAIAt) {
      answer = basicAdvice(message, vehicle, history);
      if (endpoint) {
        statusText.textContent = 'Basic help';
        status.classList.add('va-unavailable');
      }
    } else {
      const indicator = makeThinking();
      try {
        answer = await askAI(message,vehicle);
        retryAIAt = 0;
        statusText.textContent = 'AI connected';
        status.classList.remove('va-unavailable');
      } catch (error) {
        // Live AI can fail due to configuration, timeout, provider quota or
        // service overload. Show usable basic help without repeating an error
        // message inside every answer.
        retryAIAt = Date.now() + 60_000;
        answer = basicAdvice(message, vehicle, history);
        statusText.textContent = 'Basic help';
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