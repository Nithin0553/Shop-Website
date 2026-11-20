# GitHub Pages admin dashboard (original UI, GitHub-backed)

The original Sri Sai Shanmukha Auto Centre admin layout is now available at:

**https://nithin0553.github.io/Shop-Website/admin/**

It retains the existing login screen, side navigation, blog editor, image uploader, festival theme manager and shop-details form. No database or standalone server is required: each save uses the authenticated GitHub Contents API to commit changes to `main`. The existing `Deploy static shop to GitHub Pages` Actions workflow then publishes the new public content.

## Why the previous shop admin password no longer works

The original password was checked by the Railway/Cloudflare backend. GitHub Pages cannot verify that password securely because it does not run a backend. The new dashboard therefore authenticates **directly with the shop GitHub repository owner account** using a fine-grained GitHub personal access token.

The login box looks like our original dashboard, but it now asks for a **GitHub access token**, not the old password. The access token is never hardcoded in the website, never submitted to the shop itself, and is kept **only in JavaScript memory** on this browser tab. Leaving/reloading the tab or clicking Sign out clears it. **Do not paste your token into ChatGPT, GitHub source files, or screenshots.**

A public static admin URL cannot hide the login screen from visitors. Visitors cannot edit repository content without GitHub-granted access. Anyone with a stolen authorized token could edit the repository, so protect it like a password. A dedicated OAuth/GitHub App server would provide a smoother sign-in and stronger token isolation, but would no longer be fully static.

## One-time GitHub token setup

1. In your GitHub account go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens** ([GitHub fine-grained tokens](https://github.com/settings/personal-access-tokens/new)).
2. Name it e.g. **Shop Website Admin**. Select a **short expiration**, such as 30 days, and use your own account as the resource owner.
3. Under **Repository access**, choose **Only select repositories** and select **Nithin0553/Shop-Website**.
4. Under **Repository permissions**, grant **Contents: Read and write**. **Metadata: Read-only** is automatic. No administrator, Actions, secrets or other repository permissions are needed.
5. Generate the token and copy it **privately**. Keep it in your password manager if desired; it will not be saved by the site.
6. Open the [shop admin dashboard](https://nithin0553.github.io/Shop-Website/admin/), paste the token into the **GitHub access token** field and click **Sign in**.
7. GitHub verifies your token and repo access. If a save is rejected with permission errors, check its repository selection, Contents permission and expiration.

Use the dashboard only on your trusted device/browser. The token is transmitted over HTTPS to `https://api.github.com`; it is never stored in localStorage, sessionStorage, a cookie or any repository file. The admin HTML also includes a Content Security Policy limiting scripts to this site and outgoing network requests to GitHub's API.

If your token expires or is exposed, revoke it in GitHub settings and create a new one.

## Supported dashboard features

- **Shop details:** Edit phone number, WhatsApp number, exact Google Maps share link, address, business hours and public contact/social details. Saves `data/site.json`.
- **Blogs:** Create, edit, publish, unpublish and delete articles, plus upload JPG/PNG/WebP images up to 1.8 MB. Saves `data/blogs.json` and new files in `public/assets/`. Only published blogs are included in the public build.
- **Festival Theme Manager:** Enable/disable and select any of the 20 supported themes, intensity and greeting; preview before publishing. Saves `data/festival.json`. Unpublished previews run in your preview page, without changing the committed theme.
- **Customer enquiries:** Not part of the static dashboard. Customers send their completed enquiry through their own WhatsApp app, and you read it in the shop WhatsApp inbox.
- **Blog subscribers:** Not supported on the static website.

Changes appear on the public website **after GitHub Actions finishes rebuilding**, not instantly. Review [the Pages deployment workflow](https://github.com/Nithin0553/Shop-Website/actions/workflows/github-pages.yml) if a change does not appear. Commits target `main` with SHA checks; if someone else edits a file simultaneously, refresh the admin before retrying. If branch protection prevents direct commits, either permit owner-initiated API updates to main or use the GitHub editor and pull requests.

## Important limits

- No application-side login password, multi-factor login screen, or protected server session; GitHub's fine-grained token authorizes API edits directly.
- No private customers list or database. Existing Railway and Cloudflare customer records are not imported.
- Do not add private customer data or tokens to public site data. The repository and built site are public.
- The public website's **Public website URL** is automatically generated from the GitHub Pages address during build. Editing it in the admin has therefore been removed.
- New image uploads publish only once GitHub Actions completes. An image can be committed even if saving its corresponding blog article later fails—simply select it and retry.
- GitHub Pages remains free, but GitHub API and Actions quotas/limits apply.

For deployment instructions, see [GitHub Pages static website guide](github-pages-static.md).

## Official GitHub documentation

- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub REST API authentication](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api)
- [GitHub REST API Contents endpoints](https://docs.github.com/en/rest/repos/contents)
- [GitHub REST API CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)
