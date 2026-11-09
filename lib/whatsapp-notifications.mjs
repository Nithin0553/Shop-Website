// Optional owner WhatsApp alert for a newly saved shop enquiry.
// Requires an approved Meta WhatsApp Business template and separate sending number.
// Deliberately never exposes tokens, customer data, or WhatsApp errors to the visitor.
const textParam = (value, max = 350) => {
  const cleaned = String(value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, max) || 'Not provided';
};

export const WHATSAPP_ENQUIRY_TEMPLATE = 'shop_new_enquiry_alert';

// Format matches the six body variables of the approved message template.
export function enquiryTemplateBody(entry) {
  return [
    textParam(entry.id, 90),
    textParam(entry.name, 90),
    textParam(entry.phone, 32),
    textParam([entry.brand, entry.model].filter(Boolean).join(' / '), 180),
    textParam(entry.part, 130),
    textParam(entry.message, 350)
  ];
}

export function whatsappConfigured(env) {
  const phoneId = String(env?.WHATSAPP_PHONE_NUMBER_ID || '');
  const to = String(env?.WHATSAPP_TO || '');
  return Boolean(env?.WHATSAPP_API_TOKEN &&
    /^\d{6,30}$/.test(phoneId) &&
    /^\d{10,15}$/.test(to));
}

export async function sendEnquiryWhatsAppNotification(env, entry, fetcher = fetch) {
  if (!whatsappConfigured(env)) return { queued: false, reason: 'not_configured' };

  const version = /^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_VERSION || '')
    ? env.WHATSAPP_GRAPH_VERSION : 'v25.0';
  const templateName = /^[a-z][a-z0-9_]{0,100}$/.test(env.WHATSAPP_TEMPLATE_NAME || '')
    ? env.WHATSAPP_TEMPLATE_NAME : WHATSAPP_ENQUIRY_TEMPLATE;
  const language = /^[a-z]{2}(_[A-Z]{2})?$/.test(env.WHATSAPP_TEMPLATE_LANGUAGE || '')
    ? env.WHATSAPP_TEMPLATE_LANGUAGE : 'en_US';
  const parameters = enquiryTemplateBody(entry).map(text => ({ type: 'text', text }));
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: env.WHATSAPP_TO,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: [{ type: 'body', parameters }]
    }
  };

  try {
    const response = await fetcher(`https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12_000)
    });
    // Only log the HTTP status: third-party error bodies can contain private user data.
    if (!response.ok) {
      console.warn('Shop WhatsApp notification API rejected request: HTTP', response.status);
      return { queued: false, reason: 'api_error' };
    }
    return { queued: true };
  } catch {
    console.warn('Shop WhatsApp notification request failed.');
    return { queued: false, reason: 'network_error' };
  }
}
