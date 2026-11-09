# Mobile carousels and shop WhatsApp enquiry notifications

## Mobile carousels

The homepage's brand and spare-parts marquees now use two equal-width groups: one visible group and an inert, `aria-hidden` duplicate. CSS moves the track by exactly half its width, so the next cycle begins without a visible gap or jump. Mobile scrolling is faster (brands 15.5 seconds; categories 18.5 seconds). The hover pause is now limited to fine-pointer/hover devices, so taps on smartphones do not leave the strip paused. `prefers-reduced-motion: reduce` disables animation for visitors who request less motion.

## Automatic WhatsApp alerts: separate Meta setup required

When a valid contact form submission is saved to **Cloudflare D1**, the Cloudflare Worker / Pages Functions implementation can automatically send the **shop owner's WhatsApp number** a template alert containing the enquiry reference, customer name, customer phone, vehicle make/model, part and message.

**The code alone does not send alerts.** This feature is inactive until Meta WhatsApp Business API access and the three server-side secrets below are configured. The form continues to save enquiries when alerts are unavailable or fail. A successful Meta API acceptance does not guarantee actual delivery. WhatsApp messaging may incur Meta fees.

**Important:** The WhatsApp **sending** business phone number must be registered with the WhatsApp Cloud API and be **different** from the receiving shop owner's WhatsApp number. If `+91 9030084872` is the shop's actual WhatsApp number, use `919030084872` as the recipient only after confirming it. Do not attempt to send a WhatsApp message from that same number to itself.

### 1. Create a WhatsApp Cloud API sender

1. In [Meta for Developers](https://developers.facebook.com/), create or select your Meta app with WhatsApp Business Platform (Cloud API). Configure the WhatsApp Business Account, a dedicated sender phone number and a system-user access token with `whatsapp_business_messaging` permission (and necessary account access). Complete any business verification required for production use.
2. Get the **Phone Number ID** for the Cloud API **sending** number (this is an ID, not the phone digits) and an access token. Add the shop owner's WhatsApp-enabled destination as an opted-in recipient. In Meta's test environment, recipients usually must be explicitly listed as test numbers.
3. In WhatsApp Manager, create and submit an **approved** message template named `shop_new_enquiry_alert`, language **English (US) / `en_US`**, with this exact body and six variables in order:

```text
New website enquiry for Sri Sai Shanmukha Auto Centre.
Reference: {{1}}
Customer: {{2}}
Phone: {{3}}
Vehicle: {{4}}
Part: {{5}}
Message: {{6}}
Please check the admin dashboard to follow up.
```

The six variables are filled with the enquiry ID, customer name, customer phone, brand/model, part, and message. Do not send unapproved free-form WhatsApp messages as business-initiated alerts. If Meta declines the template, revise the text and update the code/configuration accordingly. Confirm any Meta fees before enabling production messaging.

### 2. Configure secrets on Cloudflare Pages

From the shop project directory in **PowerShell**:

```powershell
Push-Location .\pages-config
npx wrangler pages secret put WHATSAPP_API_TOKEN --project-name sri-sai-shanmukha-auto-centre
npx wrangler pages secret put WHATSAPP_PHONE_NUMBER_ID --project-name sri-sai-shanmukha-auto-centre
npx wrangler pages secret put WHATSAPP_TO --project-name sri-sai-shanmukha-auto-centre
npx wrangler pages secret list --project-name sri-sai-shanmukha-auto-centre
Pop-Location
npm run cloudflare:pages:deploy
```

At the prompts, enter respectively the access token, sender's Meta Phone Number ID, and the receiving shop WhatsApp number **including the country code and digits only** (example `919030084872` if that is correct). Never paste access tokens into the source code or chat.

For the still-active Cloudflare Worker, the optional equivalents are `npx wrangler secret put WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_TO`, then `npm run cloudflare:deploy`. The two deployments have **separate** secrets but share D1. Do not deploy the old Worker until ready.

The optional `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE`, `WHATSAPP_GRAPH_VERSION` bindings allow changing the template name (default `shop_new_enquiry_alert`), language (default `en_US`) and Graph API version (default `v25.0`). If Meta requires a different supported Graph version, set `WHATSAPP_GRAPH_VERSION` accordingly via Pages secret or environment configuration.

### 3. Verify from the website

After deploying and configuring the secrets, submit **one genuine test enquiry** through the Pages website, using a dummy name and test phone number that you control. Confirm the enquiry appears in `/admin` and the notification appears in the **shop's** WhatsApp inbox with every expected field.

If the enquiry is saved but WhatsApp did not arrive, check [Cloudflare Pages Functions logs](https://developers.cloudflare.com/pages/functions/debugging-and-logging/) and Meta WhatsApp Manager to confirm the access token, sender ID, recipient eligibility, template name/language, template approval, Meta balance and delivery status. The code intentionally logs only failures and HTTP status, not customer data or tokens.

**Privacy:** Customer enquiry details are sent to the external Meta WhatsApp API only after the store owner has explicitly enabled the integration. Update your site's privacy notice to disclose this handling before enabling it. Avoid passing private enquiry data into client-side JavaScript logging or public URLs.

**Railway note:** These automatic notifications are implemented in `cloudflare/worker.mjs`, which serves the Cloudflare Pages and Workers deployments. The separate Railway Node.js server is not connected to this notification feature.

## References

- Meta WhatsApp Business Messaging Policy: https://whatsappbusiness.com/policy/
- Meta's WhatsApp message-template API example: https://www.postman.com/meta/whatsapp-business-platform/request/o65u5m5/send-message-template-text
- Cloudflare background tasks: https://developers.cloudflare.com/workers/runtime-apis/context/
- Cloudflare Pages secrets: https://developers.cloudflare.com/pages/functions/bindings/#secrets
