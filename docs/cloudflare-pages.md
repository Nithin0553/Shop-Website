# Cloudflare Pages + existing D1 (shorter free URL)

This is an **additional deployment** of Sri Sai Shanmukha Auto Centre to Cloudflare Pages. It uses the same Cloudflare Worker application code, the same existing **production D1 database**, and a new Pages address of the form `https://sri-sai-shanmukha-auto-centre.pages.dev` **if that globally unique project name is available**.

**Do not delete the existing Cloudflare Worker or Railway site during migration.** This procedure never drops or recreates D1 tables. It does not import the separate Railway /data volume.

## How it works

Cloudflare Pages "advanced mode" runs a bundled `dist-pages/_worker.js` instead of a `/functions` directory. The bundle is built from the existing `cloudflare/worker.mjs`, so its protected admin API, inquiry form, D1-backed blog editor, image uploads, festival settings, SEO, and sitemap use the same logic as the Worker. Static pages/assets come from the existing `public/` directory through `env.ASSETS.fetch`.

`wrangler.pages.jsonc` is deliberately separate from the Workers `wrangler.jsonc` file. Its `DB` binding references the **existing** `sssa-shop-data` D1 UUID `144a1bc5-c8b5-4500-b7ff-cbcaf964e255`. Shop records, saved settings, uploaded images stored in D1, and customer enquiries therefore remain in the same database when the Pages site is added.

The Pages project **has separate secrets**. Copying a D1 binding does *not* copy `ADMIN_PASSWORD` or `SESSION_SECRET`. Create these private secrets on Pages separately.

## PowerShell: first deployment

From the shop website folder:

```powershell
cd "B:\Sri Sai Shanmukha Auto Centre\Shop-Website"
git pull origin main
npm install
npm test
npm run cloudflare:pages:build
```

`dist-pages/_worker.js` should exist after building. The output folder is ignored by Git and contains only deployable public assets plus the bundled Worker. Do **not** upload any private `data/inquiries.json`, `.env`, or `.dev.vars` files.

Cloudflare login was already completed for the Workers deployment. Create a new Pages project (once only):

```powershell
npx wrangler pages project create sri-sai-shanmukha-auto-centre --production-branch main --config wrangler.pages.jsonc
```

If Cloudflare reports this Pages project name is already taken, choose another available name, and update **both** the `name` in `wrangler.pages.jsonc` and the `--project-name` used by the deployment script. Do not change the D1 UUID or DB binding.

Now add the Pages **production** secrets (separate from the old Worker). Input values only at Wrangler's private prompt; never paste them into chat or source control. You may reuse a strong unexposed Worker admin password to maintain the same login, but generating a new unique one is safer. Always use a separately generated random `SESSION_SECRET` for the Pages project.

```powershell
npx wrangler pages secret put ADMIN_PASSWORD --project-name sri-sai-shanmukha-auto-centre --config wrangler.pages.jsonc
npx wrangler pages secret put SESSION_SECRET --project-name sri-sai-shanmukha-auto-centre --config wrangler.pages.jsonc
npx wrangler pages secret list --project-name sri-sai-shanmukha-auto-centre --config wrangler.pages.jsonc
```

Generate strong secret values locally (run twice for **different** values):

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Deploy the Pages project:

```powershell
npm run cloudflare:pages:deploy
```

Wrangler prints the real deployment URL. The project's canonical `.pages.dev` hostname is available if creation succeeded under the requested name; it is **not** guaranteed until Cloudflare accepts the project name.

## Verification before switching customers

1. Browse the new `https://<YOUR-PAGES-PROJECT>.pages.dev/`, `/blogs`, `/spare-parts` and `/admin`.
2. Open `/api/site` and `/api/blogs` on Pages; verify JSON and current D1-backed edits.
3. Open `/api/admin/me` on Pages; it should report `configured: true` and `authenticated: false` before login. Log in using the new Pages admin password.
4. Verify admin enquiries, subscribers, blog edits and festivals appear as expected. Test a customer enquiry and confirm it shows in the Pages dashboard. Because both Cloudflare sites share D1, the test record also appears in the original Workers admin dashboard.
5. Test uploaded images, festival previews, blog articles and the contact form. Review Pages Functions logs if a feature fails.
6. In **Admin → Shop details**, set the Public website URL to your verified Pages URL **only after** confirming Pages works. This updates canonical URLs and the sitemap for both sites because the settings are in shared D1.

Keep the existing Worker as a fallback until the Pages site is verified. Do not use the production database for destructive tests.

### Notes

- This preserves **data already stored in the Cloudflare D1 database**. Railway-only enquiries, images and edits remain on Railway until explicitly exported/imported. See `docs/cloudflare-workers.md` before retiring Railway.
- Pages and Workers share the D1 database. They do **not** automatically share cookies, login sessions, or platform secret configurations.
- The `dist-pages/` output is created by `npm run cloudflare:pages:build` and must not be committed.
- Local preview: `npm run cloudflare:pages:dev`. Local D1 defaults to a separate local resource, not production.
- Direct Upload Pages projects cannot later be switched to Cloudflare's built-in Git integration. For automatic deployment, use a separate CI workflow deploying with Wrangler, or create a new Git-integrated Pages project instead.
- Remember: Pages uses `pages.dev`; the original `workers.dev` hostname cannot be shortened by removing the Cloudflare account subdomain.

## References

- https://developers.cloudflare.com/pages/functions/advanced-mode/
- https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/workers/wrangler/commands/pages/
