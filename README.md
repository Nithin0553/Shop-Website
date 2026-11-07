# Sri Sai Shanmukha Auto Centre — Website

A responsive, working website for a local two-wheeler spare-parts and accessories shop, based on the approved blue-and-white design. It includes a public site, blog, customer enquiry form, and protected shop dashboard.

**Built with:** HTML, CSS, browser JavaScript, Node.js, and JSON file storage. No paid services, third-party packages, or build step are required.

## Quick start on Windows (or Mac/Linux)

1. Install [Node.js](https://nodejs.org/) version 20 or later.
2. Extract the ZIP and open a terminal in the `sri-sai-shanmukha-website` folder.
3. Run:

   ```sh
   npm run setup
   npm start
   ```

4. Open **http://localhost:3000** to view the public website.
5. Open **http://localhost:3000/admin** to manage the shop. Use the **admin password printed by `npm run setup`** (save it privately).
6. Stop the site with **Ctrl+C** in the terminal.

On Windows, you can also double-click `start-windows.bat` after installing Node.js. The script generates an admin password on its first run.

`npm run setup` creates a local `.env` file with randomly generated administrator credentials. It never overwrites an existing `.env`. **Keep `.env` private. Do not upload it to GitHub or send it to customers.**

## Before publishing publicly

Go to **Shop dashboard → Shop details** and replace the blank details with your real:

- Phone number and WhatsApp number (international digits, e.g. `91` + your number)
- Full shop address, town/city, hours, and official Google Maps link
- Business email and optional social links
- Public website URL once you have a domain name

The placeholder shop/storefront photography is illustrative, not a verified photograph of your premises. Replace it with a real shop photo when you have one. Review all six starter blog articles for accuracy and relevance before launching; they are sample content, not verified statements from shop staff.

**No phone number, address, business hours, or actual inventory/pricing has been invented.** Empty contact details are hidden from the public site where possible.

## Public pages

| Page | Route | Purpose |
| --- | --- | --- |
| Home | `/` | Promote the shop and link to parts, brands, articles, and enquiries |
| Spare parts | `/spare-parts` | Search categories and filter by vehicle brand; enquiry links preserve selection |
| Brands | `/brands` | Hero, Honda, Bajaj, TVS, Yamaha, Suzuki, Royal Enfield |
| About | `/about` | Shop introduction and store benefits |
| Blogs | `/blogs` | Searchable/filterable article library |
| Article | `/blogs/example-slug` | Complete individual blog article and related reading |
| Contact | `/contact` | Shop info, phone/WhatsApp/map links, customer enquiry form |
| Dashboard | `/admin` | Private business-management area |

The website is **not** an online ordering or inventory system. Visitors enquire about an item and the shop confirms part compatibility, price and availability offline.

## Dashboard

- **Customer enquiries:** See customer name, phone, vehicle and requested part; mark enquiries New, In Progress or Closed; download CSV.
- **Blog articles:** Create, edit, delete, publish or unpublish posts; choose a category, write headings/paragraphs/lists, and upload your own JPG/PNG/WebP images (up to 1.8 MB each).
- **Shop details:** Update the address, number, WhatsApp, email, location links, hours and site URL without editing code.

Enquiries are stored in `data/inquiries.json` (ignored by Git; created automatically if missing). The admin needs to **check the dashboard for new requests**; automatic email, SMS, and WhatsApp notifications have **not** been configured.

## Local data and backups

- `data/site.json`: editable business details
- `data/blogs.json`: sample blogs and new article content
- `data/inquiries.json`: customer enquiries
- `data/uploads/`: uploaded blog images

Back up the **whole data directory** regularly. Files are stored on the server rather than in an external database. The app uses safe temporary-file writes for the JSON records, but this storage model is intended for a small shop and **a single running server instance**.

To start with a different data location, set `DATA_DIR` in the server's environment. If that directory is empty, the app initializes it with the provided sample data. For production, ensure the data volume is private, writable and persistent.

## Deployment on a Node.js host (Railway, Render, VPS, Docker, etc.)

This is a Node.js server website; **do not deploy the `public/` folder alone** to a static host, or enquiries/admin/blog APIs will not work.

1. Upload this project or push it to a private/source-controlled repository (excluding `.env`).
2. Set the start command to `npm start` (or `node server.mjs`).
3. Set these variables on your hosting provider:

   ```env
   NODE_ENV=production
   ADMIN_PASSWORD=YOUR_STRONG_PRIVATE_PASSWORD_12_OR_MORE_CHARACTERS
   SESSION_SECRET=YOUR_LONG_RANDOM_SECRET_24_OR_MORE_CHARACTERS
   DATA_DIR=/data
   ```

4. Attach a **persistent writable volume at `/data`** (or adjust `DATA_DIR` to its mount path). This is important: without a persistent volume, deployment restarts may lose shop enquiries, uploaded images, and blog changes.
5. Point your own domain to the deployment, enable HTTPS (typically supplied by the hosting provider), and enter your real `https://yourdomain.example` into **Dashboard → Shop details → Public website URL**.
6. Check the contact form end-to-end and make a test enquiry before sharing the link with customers. Delete the test enquiry from the saved data only if you are comfortable working with its JSON file.

**Security/privacy:** Serve it over HTTPS, keep passwords private, regularly back up and restrict access to customer enquiry records, and add whatever privacy notice, consent details and retention process apply to your business. If site traffic grows significantly, consider a hosted database and managed auth instead of JSON files.

The server supports a sitemap at `/sitemap.xml` when a public website URL is configured, dynamic article titles/descriptions for sharing, security headers, an admin session cookie, enquiry form rate limiting, and basic bot protection.

## Development and testing

```sh
npm test
npm run dev
```

Tests cover the web pages, enquiries, admin authentication, blog CRUD, CSV, image upload, persistence, SEO metadata and sitemap. No `npm install` is necessary because the project uses only Node.js built-in modules.

## What is not yet included

- Payments, checkout, live prices or live stock tracking
- Automatic SMS/email/WhatsApp notifications of enquiries
- Advanced e-commerce product management and SKU-specific inventory
- Hosting, domain registration, or Google Business Profile connection

These can be added in a later phase without discarding this website.

## Source control safety

The repository intentionally excludes `.env`, `data/inquiries.json`, and user-uploaded blog images under `data/uploads/`. The editable starter files `data/site.json` and `data/blogs.json` are committed for new installations, but production must use a persistent `DATA_DIR` volume. Do not commit customer data, real credentials, or sensitive private contact records.

The three large reference mockup PNGs are distributed separately in the original website ZIP and are not needed to run the website. The site's optimized production images remain in `public/assets/`.
