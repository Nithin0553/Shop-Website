# GitHub Pages: static, no backend

This repository also contains a **public-only static build** for the Sri Sai Shanmukha Auto Centre website. It preserves the original design, brand and parts marquees, contact information, spare-parts catalogue, all committed published blog articles, and festival artwork/effects.

The expected GitHub Pages URL is:

**https://nithin0553.github.io/Shop-Website/**

The GitHub Pages site is deliberately separate from the existing Cloudflare Workers, Cloudflare Pages and Railway deployments. Do not delete those services until you have exported/backed up any customer enquiries, subscribers, unpublished blogs or uploaded images you need.

## What changes with a fully static site

| Website feature | GitHub Pages behavior |
| --- | --- |
| Homepage, About, Brands, Spare Parts, Contact | Fully static, with the original responsive styles and mobile carousels |
| Six committed blog articles | Published as individual static paths, with article bodies loaded from JSON |
| Blog management | Edit `data/blogs.json` in GitHub and republish; no online admin dashboard |
| Festival theme manager | Edit `data/festival.json` in GitHub and republish; 20 themes/artwork are retained |
| Contact details and shop Maps link | Edit `data/site.json` in GitHub and republish |
| Customer enquiries | Contact form opens WhatsApp with a pre-filled enquiry; **customer must press Send** |
| Automatic WhatsApp notifications | Not available on GitHub Pages without an external service |
| Email subscriptions | Removed; the blog section offers WhatsApp contact instead |
| Uploaded blog images from D1/Railway | Must be copied into `public/assets/` and referred to from `data/blogs.json` before publishing |

**No website-submitted form values are stored in GitHub or a database.** The browser does not send an enquiry itself: it opens WhatsApp, where the visitor decides whether to send the message. This is not the same as an automatic notification.

## First deployment (GitHub repository owner)

1. Open [Shop-Website on GitHub](https://github.com/Nithin0553/Shop-Website).
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the Source. GitHub Pages on GitHub Free requires a **public repository**. You may need to enable Pages in repository settings before deployment.
3. The repository includes `.github/workflows/github-pages.yml`, which runs the tests, generates `dist-github-pages/`, and publishes it using the official GitHub Pages Actions.
4. A push to `main` triggers publication automatically. Or open **Actions → Deploy static shop to GitHub Pages → Run workflow** once GitHub Pages is enabled.
5. When the workflow succeeds, open **https://nithin0553.github.io/Shop-Website/** and test the Home, About, Brands, Spare Parts, Blogs, Contact, each article URL, and the responsive layout on a phone.

You can also build a local static output from PowerShell:

```powershell
cd "B:\Sri Sai Shanmukha Auto Centre\Shop-Website"
git pull origin main
npm test
npm run github:build
```

The build output will be in `dist-github-pages/`. Do not commit this folder; the workflow generates it. To preview locally, serve the **parent directory** with an HTTP server that mounts the build at `/Shop-Website/`; opening HTML files directly with `file://` won't load JSON reliably.

### Why the project URL has /Shop-Website/

For a repository named `Shop-Website`, GitHub Pages uses the project URL `https://nithin0553.github.io/Shop-Website/`, not the root of `github.io`. The builder updates the public CSS, scripts, images, navigation links, direct page routes and blog links to account for the repository prefix.

Direct paths such as `/Shop-Website/contact/` and `/Shop-Website/blogs/essential-two-wheeler-maintenance-tips/` are generated as physical `index.html` files, not just client-side routes.

## Update the shop after publication

**Shop details:** Open `data/site.json` and edit the public phone, WhatsApp number, address, hours, and Google Maps URL. Commit the change to `main`. The WhatsApp destination should be a WhatsApp-active number in international digits (example `919030084872` only if that is your real shop WhatsApp number). If no WhatsApp field is set, the build provisionally uses the shop's phone number; please verify it works before sharing the site.

**Exact Maps location:** Replace `mapsUrl` in `data/site.json` with the exact link obtained from your shop's Google Maps listing via **Share → Copy link**. The default address search cannot guarantee the correct pin.

**Blogs:** Edit `data/blogs.json` (title, summary, body, category, slug, publishedAt and status). Only records with `status: "published"` are exported. For new images, add files to `public/assets/` and reference their filenames. Blog records added only in the Cloudflare/Railway admin are **not** automatically included; export and copy them if needed.

**Festival visual:** Edit `data/festival.json`, for example:

```json
{
  "enabled": true,
  "festival": "diwali",
  "intensity": "low",
  "greetingVariant": "default"
}
```

The site will display the chosen theme after GitHub republishes. Turn `enabled` back to `false` and commit after the festival. All 20 themes remain in the `lib/festivals.mjs` registry.

**Enquiry form:** Customers fill the enquiry, select **Continue on WhatsApp**, and then tap **Send** in their WhatsApp application. The shop receives the message only after the customer sends it. Verify the destination on a phone. GitHub Pages cannot receive, store or automatically forward forms by itself.

## Data and security

GitHub Pages deployments contain only files from `public/` (excluding admin dashboard scripts and server configuration), plus explicitly selected **public** JSON and generated festival assets. Enquiries, subscribers, API credentials, `.env`, backups, migrations and D1 database content are not published.

Never put customer enquiries, email subscriber lists, password hashes, authentication tokens, private uploads or admin API secrets into `data/site.json`, `data/blogs.json`, `data/festival.json`, or `public/` since these are hosted publicly. The source repository may also be public.

Do not change the GitHub Pages source to **Deploy from a branch** unless you intentionally switch away from the prepared Actions workflow.

## Official docs

- [GitHub Pages publishing with GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
