/* Sri Sai Shanmukha Auto Centre — public vehicle help widget.
   Works on GitHub Pages without a server; AI requires an owner-configured
   separate HTTPS Netlify Function. No API keys or chat history persisted. */
(async () => {
  'use strict';
  const BASE = window.__SHOP_STATIC_BASE__ || '/Shop-Website';
  const prompts = [
    'My bike is not starting',
    'How do I check tyre pressure?',
    'How do I choose the right spare part?',
    'My scooter is making a strange noise'
  ];
  const urgent = /(?:brak(?:e|es|ing).{0,55}(?:fail|not work|no response|lost|gone|stopp?ed)|(?:no|lost|without).{0,20}brak|fuel.{0,35}leak|petrol.{0,35}leak|smoke|fire|burning smell|(?:battery|charger).{0,45}(?:swoll|smok|hot|fire)|stuck throttle|steering.{0,35}(?:lock|fail|jam)|wheel.{0,20}(?:wobble|loose|detach)|accident|crash|overheat(?:ing)?|severe coolant leak)/i;
  const criticalAdvice = '⚠️ This may be unsafe. Stop driving or riding as soon as you can safely do so. Turn the vehicle off if safe, stay away from fire, smoke or leaking fuel, and contact roadside assistance or a qualified mechanic. Do not attempt roadside repairs to brakes, steering, fuel systems or high-voltage EV batteries.';
  function basicAdvice(question, vehicle) {
    const q = question.toLowerCase();
    if (urgent.test(q)) return criticalAdvice;
    const prefix = vehicle?.model ? 'For a ' + [vehicle.model,vehicle.year].filter(Boolean).join(' ') + ', ' : '';
    if (/(?:start|starting|ignition|crank|no power)/i.test(q))
      return prefix + 'first check the ignition/kill switch, adequate fuel or charge, and the side-stand/neutral interlock (if equipped). Do the dashboard lights turn on? Do you hear a click, a normal starter sound or nothing? Do not repeatedly crank, bypass safety switches or short battery terminals. Tell me what you observe.';
    if (/(?:tyre|tire|puncture|pressure|wheel)/i.test(q))
      return prefix + 'check cold tyre pressure against your owner manual or vehicle label, not the maximum on the tyre sidewall. Inspect tread and sidewalls for cuts, bulges, cords or other damage. Do not ride on a punctured, badly damaged or rapidly deflating tyre. Replacement tyre dimensions and ratings must match the manufacturer specifications.';
    if (/(?:part|spare|compatib|fitment|genuine|oil filter|air filter)/i.test(q))
      return prefix + 'check the exact make, model, variant, model year and existing part number. Confirm size, connector/mounting style and the manufacturer-approved specification before purchasing. Avoid guessing from a photo. Our shop primarily sells two-wheeler spares; WhatsApp the shop to confirm fitment and availability.';
    if (/(?:oil|lubricat|service)/i.test(q))
      return prefix + 'check your model-specific oil grade, specification and service interval in the owner manual. For a safe level check, park on level ground and follow the dipstick/sight-glass instructions. Avoid hot components and overfilling. If an oil-pressure warning or major leak is present, stop using the vehicle and contact a mechanic.';
    if (/(?:chain|sprocket|clutch|belt|cvt)/i.test(q))
      return prefix + 'note unusual noise, vibration or visible wear, and check maintenance history. Chain slack and CVT service intervals vary by model. Never touch moving parts with the engine on. A qualified technician should inspect and adjust drivetrain parts.';
    if (/(?:battery|light|indicator|electric|charging)/i.test(q))
      return prefix + 'check the dashboard lights and look for obvious damaged connectors without touching bare wires. Do not short terminals, probe live wiring or open an EV battery pack. A mechanic can safely test the battery and charging circuit and verify replacement compatibility.';
    if (/(?:sound|noise|rattle|vibrat)/i.test(q))
      return prefix + 'tell me when the sound happens (idle, acceleration, braking, turning or bumps) and where it seems to come from. Do not keep driving with loss of braking, steering issues, smoke or severe vibration. An inspection is safer than guessing which part to replace.';
    if (/(?:car|suv|dashboard|check engine|coolant)/i.test(q))
      return prefix + 'identify the model, year, warning light and whether the problem happens when starting, idling or driving. Refer to the manual for the exact light. Red oil-pressure, overheating or brake warnings need prompt safe stopping. Our shop mainly sells two-wheeler spares, but I can offer general car-care information.';
    return 'I can help with motorcycle, scooter and car symptoms, spare parts and basic maintenance. Please tell me the vehicle type, make, model, year, symptoms, warning lights and when the problem happens. I can suggest safe checks, but I cannot confirm a diagnosis or stock availability.';
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
          status.textContent = 'AI help enabled';
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

  function show(open) {
    panel.hidden = !open;
    openButton.setAttribute('aria-expanded', String(open));
    openButton.classList.toggle('va-active', open);
    if (open) question.focus();
    else openButton.focus();
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
  for (const prompt of prompts) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = prompt;
    button.addEventListener('click', () => {
      question.value = prompt;
      question.focus();
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
    addBubble(message,'user');
    chips.hidden = true;
    busy = true;
    send.disabled = true;
    let answer;
    if (urgent.test(message)) answer = criticalAdvice;
    else if (!endpoint) answer = basicAdvice(message, vehicle);
    else {
      const indicator = addBubble('Checking your question…','assistant');
      try {
        answer = await askAI(message,vehicle);
        status.textContent = 'AI help enabled';
      } catch {
        answer = 'Online AI is temporarily unavailable. Here is some general guidance:\n\n' +
          basicAdvice(message,vehicle);
        status.textContent = 'Basic guidance available · AI temporarily unavailable';
      } finally { indicator.remove(); }
    }
    addBubble(answer,'assistant');
    history.push({role:'user',text:message},{role:'assistant',text:answer});
    history = history.slice(-8);
    busy = false;
    send.disabled = false;
    question.focus();
  });
})();