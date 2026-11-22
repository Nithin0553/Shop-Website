# Switch the shop website from Auto Assistant to Botpress

This integration is **prepared, not activated**. The existing assistant remains visible until the shop owner provides the **real Botpress embed URLs**. Do not use sample IDs or invented script URLs.

## 1. Create and publish the Botpress agent

1. Open https://botpress.com/ and sign in to Botpress Studio.
2. Create an agent named **Sri Sai Shanmukha Auto Assistant**.
3. In the agent's Instructions, paste the contents of `docs/botpress/agent-instructions.md` (without the introductory heading).
4. In the Knowledge section, open the default Knowledge Base and choose **Add Knowledge Source**. Upload `docs/botpress/shop-facts.md` and `docs/botpress/troubleshooting-knowledge.md`, or paste their information into appropriate rich-text knowledge sources.
5. Optionally index the public shop website at https://nithin0553.github.io/Shop-Website/ for current shop content. **Do not** treat a product-category gallery as proof of live inventory or compatibility. Manually verify the knowledge sources after indexing.
6. Test the assistant in the Botpress preview. When satisfied, **publish the agent**.

## 2. Configure the Botpress widget

In the Botpress Dashboard open the agent and go to **Webchat**:
- **Bot identity:** Display name "Auto Assistant"; greeting "Hi! Ask me about your bike, scooter, car or spare parts."
- **Appearance:** Light theme, navy/blue accent matching the shop, readable 16px+ message text where supported. Keep a normal-size bottom-right launcher rather than opening automatically.
- **Features:** Enable message feedback if available. Use session-based history unless you intentionally want persistence, and review your privacy disclosures.
- **Deploy Settings:** Choose **Toggle** / the standard chat launcher, then **Publish Configuration**.

Choose **Webchat → Deploy Settings → Copy Embed Code**. It should contain **two** script addresses:
1. A CDN URL like `https://cdn.botpress.cloud/webchat/v3.3/inject.js` (the precise version can differ).
2. A settings URL from `https://files.bpcontent.cloud/...js`.

These are *public embedding scripts*, not credentials. **Never** paste your Botpress login, access token, API key or personal information into a website setting.

## 3. Activate on the shop website

Open https://nithin0553.github.io/Shop-Website/admin/ and sign in using the established shop-admin method.

In **Shop details**, set:
- **Botpress Webchat loader URL (cdn.botpress.cloud)** = the *first* script URL.
- **Botpress configuration URL (files.bpcontent.cloud)** = the *second* script URL.

Save business details. The GitHub Pages workflow republishes the public site.

After the updated `static-data/site.json` is published, the website loads the two authorized Botpress scripts in order. **The original Auto Assistant does not initialize when Botpress successfully loads**. The legacy function and Gemini key are not used by the new widget.

When **both Botpress fields are blank**, the old assistant stays available during setup. Once you fill either Botpress field, the old assistant is **not shown**. If the embed is incomplete, invalid or unavailable, a small **Ask our shop** WhatsApp button appears instead of unreliable generic advice. When both correct URLs are published, only Botpress Webchat appears. To roll back temporarily, clear both Botpress URLs in Shop details.

The loader only accepts exact HTTPS domains `cdn.botpress.cloud` and `files.bpcontent.cloud` with standard Webchat script paths. It rejects other hosts and script URLs containing query fragments or user info.

## 4. Check the live experience

In the published website, test these questions in English, Telugu and Hindi:
1. "My Activa won't start" then answer the bot's follow-up with "No".
2. "My tyre has a nail and no air." (must not tell them to keep riding)
3. "My brake light is not working" versus "My brakes have failed" (different safety severity).
4. "Can I get Activa 6G brake pads and what is the price?" (must not invent stock or price).
5. "My electric scooter won't start" (must not recommend checking petrol).
6. "Where is your shop?" (must give the configured address).

A good Botpress model **still needs tuning**. Use real customer questions and user feedback, then refine the agent's instructions and knowledge. Botpress cannot inspect vehicles or verify live shop inventory without an authorized integration.

## Costs, privacy and eventual cleanup

Review https://botpress.com/pricing/ before launch. At the time this guide was prepared, Botpress showed a Free plan with **100 included conversations**, subject to the platform's current restrictions. Higher traffic may require a paid plan.

Botpress processes chat messages through its hosted platform. Do not ask customers for passwords, payment details, ID documents or unnecessary personal information. Display clear privacy information appropriate to your business and check Botpress retention options.

After Botpress has been tested live, the legacy Netlify Function and `GEMINI_API_KEY` used **only by the old Auto Assistant** may be disabled/retired. Check whether any other automation (such as the daily blog) uses that key **before** deleting any credentials.

Official references:
- https://botpress.com/docs/webchat/get-started/quick-start/
- https://botpress.com/docs/webchat/get-started/configure-your-webchat/
- https://botpress.com/docs/studio/get-started/manage-your-agent/knowledge/
- https://botpress.com/pricing/
