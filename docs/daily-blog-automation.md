# Daily automotive blog publishing

The Sri Sai Shanmukha Auto Centre GitHub Pages website has a scheduled workflow to research a fresh two-wheeler topic, write an original practical article and publish it on the existing blog. It requires **one Gemini API key** as an encrypted repository secret. No Cloudflare or Railway backend is needed.

## One-time setup

1. Open [Google AI Studio](https://aistudio.google.com/api-keys), create a Gemini API key and keep it private.
2. Open [Shop-Website GitHub Actions secrets](https://github.com/Nithin0553/Shop-Website/settings/secrets/actions) and create a **new repository secret** named **GEMINI_API_KEY** containing the key. Never paste a key into repository code, issues, screenshots, or chat.
3. The workflow now defaults to **Gemini 3.8 Flash** (`gemini-3.8-flash`), with **Gemini 3.6 Flash** (`gemini-3.6-flash`) as a fallback for missing/overloaded models. These are more capable models than Flash-Lite, but Google may still return HTTP 503 under load. Free-tier availability and rate limits depend on your project; paid billing, if enabled separately, may incur charges.
4. Visit [Actions → Daily two-wheeler blog publisher](https://github.com/Nithin0553/Shop-Website/actions/workflows/daily-blog.yml) and select **Run workflow**. Choose **provider = gemini**, **gemini_model = gemini-3.8-flash**, and keep **dry_run checked (true)**. This previews an article in the workflow log without modifying the website. For an optional premium Gemini model, select **gemini-3.1-pro-preview** instead; your Google AI Studio project must have access and billing may be required.
5. Run again with **dry_run = false** to publish one article now. It validates, commits, rebuilds, and deploys the updated site. Subsequent scheduled runs work automatically.

### Optional Grok model (paid, not enabled by default)

If Google's models are persistently overloaded, the workflow can use **Grok 4.7** through the xAI API. Grok is a separately billed commercial API. **Do not enable it unless you agree to xAI's charges.**

1. Create an API key in [xAI Console](https://console.x.ai/) with the needed credits/billing and model access.
2. In the [Shop-Website Actions secrets](https://github.com/Nithin0553/Shop-Website/settings/secrets/actions), add a secret named **XAI_API_KEY**. Never share the key or put it in the source code.
3. To use Grok for **one manual run**, open the workflow, select **Run workflow → provider = grok**, keep **dry_run = true** for the first test, and run it. To publish later, uncheck dry_run. Gemini credentials are not required for Grok-only runs.
4. To enable **automatic paid Grok fallback only when Gemini models are unavailable**, create an Actions **repository variable** named **BLOG_GROK_FALLBACK** with value `true` in [Actions variables](https://github.com/Nithin0553/Shop-Website/settings/variables/actions), **after** adding `XAI_API_KEY`. Default is `false`. When disabled, Gemini errors cannot trigger a Grok request, even if a Grok key exists.
5. Daily scheduled jobs always start with Gemini 3.8 Flash and try Gemini 3.6 Flash. They only use paid Grok fallback if you explicitly set the opt-in variable and have an xAI key.

**Pricing:** Check the [xAI pricing page](https://docs.x.ai/developers/pricing) before setting up paid access. Grok 4.7 is currently listed at $2 per million input tokens and $6 per million output tokens (plus possible provider-specific fees). Retry attempts may affect usage and costs. Gemini Pro access/pricing is also project-dependent.

**Schedule:** Every morning at **8:37 AM India time (Asia/Kolkata)**. GitHub Actions scheduling may be delayed and occasional jobs may be dropped under load.

## What gets published

The generator checks Google News RSS headlines about Indian motorcycles, scooters, spares and related industry developments. It does NOT scrape or copy article bodies; RSS headlines are only topic signals. It also cycles through curated practical guides about helmets, tyres, brakes, oils, filters, batteries, genuine parts, chains, CVT and electric scooters.

Each article uses our existing blog format: original title, summary, category, appropriate shop illustration, publication date, structured 450–650-word guide, safety guidance and AI-assistance disclosure. News-inspired posts include an attributable source link. The writer is told not to invent model specifications, launch dates, prices, figures or vehicle-specific safety procedures. These safeguards do not guarantee perfect accuracy: review new posts periodically.

**Temporary Gemini outages:** If Google returns HTTP 500, 502, 503 or 504, the generator retries once after a short delay, then attempts Gemini 3.6 Flash as its backup. If both Gemini models fail, it will call paid Grok **only if you explicitly enabled BLOG_GROK_FALLBACK and provided XAI_API_KEY**. Authorization (401/403) and quota (429) errors do not trigger fallback. If no accessible configured model responds, no article is published.

The script checks existing titles, used news links, used topic variants and an Indian-date post ID. It will **not post duplicates or multiple generated entries in one day**. If a source, model, quota or quality check fails, the workflow reports failure instead of publishing uncertain material. That means a scheduled attempt is made daily, but a new post is not guaranteed every day.

## Why publication happens inside the same workflow

A GitHub Actions commit made with its built-in GitHub token does not trigger the normal push workflow, including a GitHub Pages build. Our daily workflow therefore:

1. Reads existing public blog data and fresh RSS headline metadata.
2. Calls Gemini with private GitHub Actions credentials.
3. Validates the draft and writes it to the public blog JSON only if acceptable.
4. Runs the complete automated test suite and builds the Pages artifact **before committing**.
5. Commits the vetted change to main and **directly publishes the new Pages artifact in the same workflow**.

No external database, new domain or extra server is required.

## Manage and pause

Use the [Shop Admin Dashboard](https://nithin0553.github.io/Shop-Website/admin/) to review, edit, unpublish or delete articles using your existing GitHub token. To check daily run results, open [daily blog workflow runs](https://github.com/Nithin0553/Shop-Website/actions/workflows/daily-blog.yml).

To pause publishing, open the GitHub Actions workflow menu and choose **Disable workflow**; enable it again to resume. Use **Run workflow** with dry_run enabled for a preview or disabled to manually publish.

Scheduled workflows on public repositories can be disabled after prolonged repository inactivity. The AI API has free-tier quotas and may incur charges if you opt into paid billing. GitHub Actions also has quotas. Keep secrets only in GitHub Actions settings.

## Local development

From the repository directory, run **npm test** and **npm run github:build** to validate existing content. The daily generator can also run with DAILY_BLOG_DRY_RUN=true and a private GEMINI_API_KEY environment variable, but a GitHub Actions manual preview is easier and avoids placing credentials in a terminal transcript.

## References

- [GitHub scheduled workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GitHub token push limitations](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs)
- [Gemini pricing and free tier](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini getting started](https://ai.google.dev/gemini-api/docs/get-started)
