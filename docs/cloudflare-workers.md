# Cloudflare Workers + D1 deployment

This option preserves the website frontend and admin API without a Node.js server. It uses one Worker, Workers static assets, and one D1 database. R2 is not required. Keep the existing Railway deployment until migration is verified.

## Changes

- Frontend files are served through Workers static assets.
- The Worker handles public APIs, admin APIs, dynamic blog meta tags, sitemap, and festival palette CSS.
- D1 stores shop details, blog posts, festivals, customer enquiries, newsletter subscribers, rate limits and uploaded blog image BLOBs.
- Login uses private Cloudflare secrets and a signed Secure, HttpOnly, SameSite cookie.
- Festival themes remain available. Open browser tabs refresh their published settings every 15 seconds rather than receiving instant server-sent events.
- Data already on the Railway volume is not copied automatically.

## Windows PowerShell setup

Open your existing project folder and switch to the migration branch:

    cd "B:\Sri Sai Shanmukha Auto Centre\Shop-Website"
    git fetch origin
    git switch feature/cloudflare-workers-d1
    npm test
    npx wrangler login

Create the D1 database. The location hint is appropriate for the India-based shop audience:

    npx wrangler d1 create sssa-shop-data --location apac

The command returns a database UUID. Replace the placeholder all-zero database_id in wrangler.jsonc with this real UUID. Keep binding DB unchanged.

Apply the schema locally (for testing) and remotely (for publishing):

    npm run cloudflare:db:local
    npm run cloudflare:db:remote

Generate a fresh strong password and session signing secret locally. Never reuse previously shared chat passwords or commit credentials to Git. You can run this command twice to generate separate random values:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"

Configure the two secrets through Wrangler secure prompts:

    npx wrangler secret put ADMIN_PASSWORD
    npx wrangler secret put SESSION_SECRET

Only paste values into the private terminal prompts, not into GitHub or public discussions. For local Wrangler testing you can create a gitignored .dev.vars file with ADMIN_PASSWORD and SESSION_SECRET. Local D1 is separate from the production database.

Run a local preview:

    npm run cloudflare:dev

Test home, parts, brands, all sample articles, admin login, customer enquiry submission, CSV downloads, blog editing, images and all festival previews.

When local tests pass, publish:

    npm run cloudflare:deploy

Wrangler then prints your actual https://...workers.dev URL. In Admin -> Shop details, set Public website URL to that URL so canonical links and sitemap.xml work.

## Import existing site data

Cloudflare starts with the committed site/blog/festival JSON defaults until the new D1 data is changed. Existing Railway customer enquiries, uploads and admin edits are NOT imported automatically.

If you have a backup of the actual production data directory on your PC, run the migration helper BEFORE taking live enquiries on Cloudflare:

    node scripts/cloudflare-export-sql.mjs "B:\path\to\saved\data"
    npx wrangler d1 execute sssa-shop-data --remote --file=.cloudflare-import.sql
    Remove-Item .cloudflare-import.sql

This transfers site details, festivals, blogs, enquiries and subscribers using private SQL written only to your computer. Review the generated file before running it. Do not commit or distribute it; it contains customer personal information.

If production data exists only on Railway, export/backup its /data volume first. Local repo data is not the same as Railway's persistent volume.

Custom blog images previously uploaded to Railway must be uploaded again from the Cloudflare admin. Reassign those images in the relevant blog entries, because Cloudflare generates new filenames. This workflow is deliberately manual to avoid putting customer records or images in GitHub.

Do not delete or cancel the Railway project until the Cloudflare site and its data are confirmed working.

## Optional GitHub automatic deployments

After the migration branch is merged into main and the first Worker deploy is successful, connect the GitHub repository in Cloudflare Dashboard -> Workers & Pages -> select your Worker -> Settings -> Builds -> Connect.

Select Nithin0553/Shop-Website, branch main, repository root, and deploy command npx wrangler deploy. The Cloudflare Worker name must equal sri-sai-shanmukha-auto-centre in wrangler.jsonc. Keep the DB binding and secrets on the Worker.

## Limits, data management and security

- Workers Free has 100,000 Worker requests per day and 10 ms CPU time per invocation. Test large blog image uploads on a real Worker: large base64 decoding can exceed this.
- D1 Free has 500 MB per database, 5 million rows read/day and 100,000 rows written/day. A single D1 BLOB is limited to 2 MB; this site enforces an image size of 1.8 MB.
- D1 stores image bytes directly rather than using a separate object storage/CDN service. For high traffic, R2 with its separately enabled subscription is a future option.
- Keep your admin password private. Back up D1 and follow a customer data retention policy.
- Hashed client identifiers used for rate limiting are stored; raw client IPs are not saved in app tables.
- The Worker does not keep the festival Server-Sent Events endpoint open; visitors update within approximately 15 seconds.
- A workers.dev address requires no custom domain purchase.

Official documentation:

- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/d1/worker-api/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
