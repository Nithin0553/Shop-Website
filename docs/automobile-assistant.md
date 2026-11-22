# Auto Assistant — motorcycles, scooters and cars

Sri Sai Shanmukha Auto Centre has an accessible, responsive chat widget on **every public website page**, while the original public storefront remains on **GitHub Pages**.

It supports:
- Asking about bike/scooter/car symptoms, basic maintenance, model information and spare-parts compatibility.
- Vehicle type, make/model, optional year and English/Telugu/Hindi language selection.
- One-tap starter questions and follow-up questions during the current browser session.
- Escalation for brake/steering failure, fuel leaks, smoke, stuck throttles, overheating and high-voltage battery hazards.
- A WhatsApp handoff to the shop; the customer must tap **Send** in WhatsApp.
- Mobile-friendly floating placement and screen-reader/keyboard navigation.

## Updated chat experience

The assistant now uses a compact floating launcher, a shorter greeting, one-tap quick questions, collapsible vehicle details, and small typing/loading animations. Answers appear with a fast text-reveal effect; reduced-motion devices see the full reply immediately. Critical warnings always appear immediately.

To apply the **frontend improvements**, GitHub Pages updates automatically after the change is merged into `main`.

To apply the **shorter Gemini responses**, the separate Netlify Function must be deployed again. From PowerShell, in the same linked project directory:

```powershell
cd "B:\\Sri Sai Shanmukha Auto Centre\\Shop-Website"
git pull origin main
netlify deploy --prod --dir=netlify-site --functions=netlify/functions
```

No additional Gemini key or Netlify environment configuration is required if the existing function already works. The backend now aims for roughly 45–100 words, up to three short checks and one follow-up question, while retaining essential safety warnings.

The chat has **two distinct modes**. **Basic guidance** is always available on GitHub Pages using curated rules for common questions, but it is not a general AI model and replies in English. **Online AI** answers more varied questions and can reply in Telugu/Hindi; it requires the optional separate Netlify Function described below.

**No one can safely run a shared Gemini API key directly on GitHub Pages.** The key stays on the Netlify server, never in HTML, GitHub JSON, or client-side JavaScript. The assistant does not claim the shop sells car parts; Sri Sai Shanmukha Auto Centre primarily sells two-wheeler spares.

## Publish the basic assistant

The normal GitHub Pages workflow builds the assistant automatically whenever changes to main are merged. Test at:

https://nithin0553.github.io/Shop-Website/

The floating **Ask Auto Assistant** button should appear at the lower-right. Open it and ask about tyre pressure, compatible parts, unusual sounds or starting problems. The status will show **Basic guidance available** until online AI has been connected.

You do not need a new hosting account for the basic mode.

## Enable online AI (separate Netlify Function)

Netlify offers a free tier that permits commercial projects within usage limits. You do **not** have to move your main website off GitHub Pages. A small separate Netlify project runs just one AI endpoint.

### 1. Create the separate Netlify project

On your PC in **PowerShell**:

```powershell
cd "B:\Sri Sai Shanmukha Auto Centre\Shop-Website"
git pull origin main
npm test
npm install -g netlify-cli
netlify login
netlify sites:create --name sssa-vehicle-assistant
```

If the name is unavailable, pick another. **Do not connect this Netlify project to GitHub auto-deploy**: the repo's daily blog commits would otherwise trigger needless Netlify deploys and consume free credits. The CLI's `sites:create` creates a site and links it to your current directory without Git.

### 2. Configure private environment variables in Netlify

Open [Netlify Projects](https://app.netlify.com/) and select the new assistant-only project.

Open **Project configuration → Environment variables** and create:

| Name | Value |
| --- | --- |
| `GEMINI_API_KEY` | Your **private** Google AI Studio Gemini API key (do not paste it into ChatGPT or GitHub files) |
| `AUTO_CHAT_ENABLED` | `true` |
| `AUTOMOBILE_AI_MODEL` | `gemini-3.8-flash` (optional) |

These are **Netlify runtime environment variables**. The existing `GEMINI_API_KEY` stored in GitHub Actions for daily blogs does **not** automatically transfer to Netlify. If you cannot retrieve the previous key, create a new one in [Google AI Studio](https://aistudio.google.com/api-keys).

**Billing & privacy:** Model availability and no-cost quotas vary. Public visitor questions and limited in-session conversation context are sent to the Google Gemini API. Free-tier data handling may differ from paid-tier data handling; consult Google's privacy/pricing documentation. Set limits and monitor usage in Google AI Studio before inviting public traffic.

### 3. Deploy only the backend

From the same project directory:

```powershell
netlify deploy --prod --dir=netlify-site --functions=netlify/functions
```

If you added the env vars after deployment, deploy again so the Function receives them. Verify **Functions → automobile-assistant** and inspect its deploy log for a recognized native rate limiting rule.

Your Netlify function URL is:

```text
https://YOUR-ACTUAL-NETLIFY-SITE.netlify.app/.netlify/functions/automobile-assistant
```

Replace the placeholder with the actual Netlify URL printed after your deploy. Do not invent a URL.

### 4. Connect the AI endpoint in the shop's existing admin

1. Open the [Sri Sai Shanmukha Auto Centre Admin Dashboard](https://nithin0553.github.io/Shop-Website/admin/) and sign in using the repository-scoped GitHub token.
2. Go to **Shop details / Business information**.
3. In **Auto Assistant AI endpoint (Netlify Function URL)**, paste the **actual** URL from step 3, ending in `/.netlify/functions/automobile-assistant`.
4. Save business details. GitHub Actions will republish the storefront and the assistant will show **AI help enabled**.
5. Refresh the storefront on desktop and mobile and ask a genuinely new question such as: **"My Honda Activa 6G hesitates when starting. What can I safely check?"** Then test Telugu/Hindi and a safety-critical question.

The browser only accepts HTTPS `*.netlify.app` URLs with the exact function route; it never sends a GitHub token or Gemini API key. If Netlify is down or the API key is exhausted, the widget falls back to basic guidance without losing the rest of the website.

### Security and operating limitations

- The Netlify Function allows browser calls from only `https://nithin0553.github.io`, has a **Netlify platform-enforced rate-limit of 6 requests/minute per IP and domain**, and also uses a best-effort warm-instance limit of 12 requests/hour per IP. The second limit is not durable or shared between instances.
- **CORS is not authentication.** A public AI API can still receive non-browser/bot requests; network rate limiting and the provider's quota help, but cannot guarantee zero abuse or cost. Set Google AI Studio quotas/billing alerts, monitor Netlify Functions usage, and disable `AUTO_CHAT_ENABLED` if unexpected volume appears.
- The site does not save conversation history. Recent chat messages are held in the browser tab's JavaScript memory during the current session and sent with the next user question. Netlify/Google may process the request according to their platform policies. Avoid collecting names, phone numbers, identity, payment details or other private data.
- The chat **does not inspect a customer's vehicle directly**, cannot provide a verified fault diagnosis or exact parts compatibility, and has no access to live inventory. It should ask clarifying questions rather than assert unverified specifications.
- For brake failure, steering faults, smoke, fuel leakage, overheating, stuck throttle, major wheel damage or EV high-voltage hazards, advice should be to stop and seek qualified assistance—not continue riding or undertake high-risk repairs.
- The initial UI is text only. It does not upload vehicle photos or access camera/microphone. It does not pretend to connect to a mechanic or automatically send WhatsApp messages.

### Maintenance

- The public widget: `public/automobile-assistant.html`, `public/automobile-assistant.js`, `public/automobile-assistant.css`.
- Server-side AI handler: `netlify/functions/automobile-assistant.mjs`.
- Netlify deployment configuration: `netlify.toml` and `netlify-site/index.html`.
- Public admin endpoint value: `data/site.json` → `chatbotApiUrl` (or the existing Admin Dashboard).
- Run `npm test` before publishing modifications.
- When the backend code changes, run `netlify deploy --prod --dir=netlify-site --functions=netlify/functions` again. GitHub Pages code changes continue to deploy from GitHub Actions.

Official references:

- [Netlify Functions](https://docs.netlify.com/build/functions/get-started/)
- [Netlify native function rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/)
- [Netlify manual deploy via CLI](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/)
- [Gemini API](https://ai.google.dev/gemini-api/docs/get-started)
- [Gemini pricing and usage](https://ai.google.dev/gemini-api/docs/pricing)
