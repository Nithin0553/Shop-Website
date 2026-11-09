import { FESTIVALS, FESTIVAL_INTENSITIES, FESTIVAL_PALETTES, DEFAULT_FESTIVAL, normalizeFestivalSettings, validateFestivalSettings } from '../lib/festivals.mjs';
import initialSite from '../data/site.json' with { type: 'json' };
import { whatsappConfigured, sendEnquiryWhatsAppNotification } from '../lib/whatsapp-notifications.mjs';
import initialBlogs from '../data/blogs.json' with { type: 'json' };

const MAX_BODY = 100_000;
const MAX_IMAGE_BODY = 2_800_000;
const CUSTOM_IMAGE = /^custom-[a-f0-9]{32}\.(png|jpg|webp)$/;
const PRESET_IMAGES = ['oil-care.webp', 'brake-care.webp', 'battery-care.webp', 'chain-care.webp', 'filter-care.webp', 'scooter-care.webp', 'bike-scooter.webp'];
const CATEGORIES = ['Maintenance Tips', 'Spare Parts Guide', 'Buying Guide', 'Bike Care', 'Scooter Care'];
const HEADINGS = {
  '/': 'Two-Wheeler Spare Parts & Accessories',
  '/spare-parts': 'Spare Parts',
  '/brands': 'Two-Wheeler Brands',
  '/about': 'About Our Shop',
  '/blogs': 'Maintenance Tips & Blog',
  '/contact': 'Contact & Enquiries'
};
const ENCODER = new TextEncoder();
const str = (value, max = 100) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const numeric = value => typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
const slugify = value => str(value, 140).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 90);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = value => { const s = str(value, 500); if (!s) return ''; try { const u = new URL(s); return ['http:', 'https:'].includes(u.protocol) ? u.toString() : ''; } catch { return ''; } };
const json = (value, status = 200, headers = {}) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
const methodError = () => json({ error: 'Method not allowed' }, 405);
const csvResponse = (rows, name) => new Response('\uFEFF' + rows.join('\r\n'), {
  headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="' + name + '"', 'Cache-Control': 'no-store' }
});
const quoteCsv = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"';

// D1 holds settings and blogs in JSON documents. Enquiries, opt-ins, rate limits and images have separate rows.
async function readDoc(env, key, fallback) {
  const row = await env.DB.prepare('SELECT payload FROM documents WHERE doc_key = ?').bind(key).first();
  return row ? JSON.parse(row.payload) : structuredClone(fallback);
}
async function writeDoc(env, key, value) {
  await env.DB.prepare('INSERT INTO documents (doc_key, payload) VALUES (?, ?) ON CONFLICT(doc_key) DO UPDATE SET payload=excluded.payload')
    .bind(key, JSON.stringify(value)).run();
}
const getSite = env => readDoc(env, 'site', initialSite);
const getBlogs = env => readDoc(env, 'blogs', initialBlogs);
const getFestival = async env => normalizeFestivalSettings(await readDoc(env, 'festival', DEFAULT_FESTIVAL));
async function festivalPayload(env) {
  return { festivals: FESTIVALS, intensities: FESTIVAL_INTENSITIES, settings: await getFestival(env), pollOnly: true };
}

async function requestBody(req, maxBytes = MAX_BODY) {
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > maxBytes) throw new Error('Request too large');
  const reader = req.body?.getReader();
  if (!reader) return {};
  const chunks = [];
  let total = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    total += result.value.byteLength;
    if (total > maxBytes) { await reader.cancel(); throw new Error('Request too large'); }
    chunks.push(result.value);
  }
  const bytes = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes) || '{}'); }
  catch { throw new Error('Invalid JSON'); }
}
async function sha256(input) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', ENCODER.encode(input)));
}
const equals = (a, b) => { if (a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]; return diff === 0; };
const encode64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const decode64 = value => {
  const s = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
};
async function sign(secret, payload) {
  const key = await crypto.subtle.importKey('raw', ENCODER.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, ENCODER.encode(payload)));
}
async function sessionToken(env) {
  const payload = encode64(ENCODER.encode(JSON.stringify({ exp: Date.now() + 12 * 3600_000, nonce: crypto.randomUUID() })));
  return payload + '.' + encode64(await sign(env.SESSION_SECRET, payload));
}
async function authenticated(req, env) {
  if (!env.SESSION_SECRET || !env.ADMIN_PASSWORD) return false;
  const cookie = (req.headers.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith('sssa_session='));
  if (!cookie) return false;
  const pieces = cookie.slice('sssa_session='.length).split('.');
  if (pieces.length !== 2 || !/^[a-zA-Z0-9_-]+$/.test(pieces[0]) || !/^[a-zA-Z0-9_-]+$/.test(pieces[1])) return false;
  try {
    const expected = await sign(env.SESSION_SECRET, pieces[0]);
    if (!equals(decode64(pieces[1]), expected)) return false;
    const payload = JSON.parse(new TextDecoder().decode(decode64(pieces[0])));
    return Number.isFinite(payload.exp) && payload.exp > Date.now();
  } catch { return false; }
}
const cookie = token => 'sssa_session=' + token + '; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=' + (token ? '43200' : '0');
function sameOrigin(req) {
  const origin = req.headers.get('Origin');
  return !origin || origin === new URL(req.url).origin;
}
async function limited(req, env, bucket, allowed, intervalMs) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  // Never retain raw IPs in the database. Rotate the hash when SESSION_SECRET changes.
  const digest = await sha256((env.SESSION_SECRET || '') + ':' + ip);
  const key = Array.from(digest.slice(0, 12), n => n.toString(16).padStart(2, '0')).join('');
  const windowStart = Math.floor(Date.now() / intervalMs);
  const row = await env.DB.prepare(
    'INSERT INTO throttles (bucket, client_key, window_start, hits) VALUES (?, ?, ?, 1) ' +
    'ON CONFLICT(bucket, client_key) DO UPDATE SET ' +
    'hits=CASE WHEN window_start=excluded.window_start THEN hits + 1 ELSE 1 END, ' +
    'window_start=excluded.window_start RETURNING hits'
  ).bind(bucket, key, windowStart).first();
  return row.hits > allowed;
}

function validateImage(dataUrl) {
  if (typeof dataUrl !== 'string') throw new Error('Invalid image.');
  const match = dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Use a PNG, JPG or WebP image.');
  const bytes = decode64(match[2]);
  if (bytes.length < 50 || bytes.length > 1_800_000) throw new Error('Image must be under 1.8 MB.');
  const type = match[1], first = [...bytes.slice(0, 12)];
  const isPng = first.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10';
  const isJpg = first.slice(0, 3).join(',') === '255,216,255';
  const isWebp = String.fromCharCode(...first.slice(0, 4)) === 'RIFF' && String.fromCharCode(...first.slice(8, 12)) === 'WEBP';
  if (!((type === 'png' && isPng) || (type === 'jpeg' && isJpg) || (type === 'webp' && isWebp))) throw new Error('Image content does not match its type.');
  const ext = type === 'jpeg' ? 'jpg' : type;
  return { bytes, ext, mime: type === 'jpeg' ? 'image/jpeg' : 'image/' + type };
}
async function normalizePost(env, payload, old = {}) {
  const title = str(payload.title, 130), slug = slugify(payload.slug || title), body = str(payload.body, 20000);
  if (title.length < 5 || slug.length < 4 || body.length < 60) throw new Error('Provide a title, valid URL slug and article body (60+ characters).');
  let image = PRESET_IMAGES.includes(payload.image) ? payload.image : PRESET_IMAGES[0];
  if (CUSTOM_IMAGE.test(payload.image || '')) {
    const found = await env.DB.prepare('SELECT filename FROM images WHERE filename = ?').bind(payload.image).first();
    if (found) image = payload.image;
  }
  return {
    id: old.id || crypto.randomUUID(), slug, title,
    category: CATEGORIES.includes(payload.category) ? payload.category : CATEGORIES[0],
    summary: str(payload.summary, 260), image,
    readingMinutes: Math.max(1, Math.min(20, Math.round(numeric(payload.readingMinutes) || Math.ceil(body.split(/\s+/).length / 180)))),
    publishedAt: old.publishedAt || new Date().toISOString().slice(0, 10),
    status: payload.status === 'draft' ? 'draft' : 'published', body
  };
}

async function api(req, env, url, ctx) {
  const path = url.pathname, method = req.method;
  if (path === '/api/festivals' && method === 'GET') return json(await festivalPayload(env));
  // The Cloudflare edition uses 15-second polling instead of keeping long-lived SSE connections open.
  if (path === '/api/festivals/events') return json({ error: 'Use /api/festivals polling.' }, 404);
  if (path === '/api/site' && method === 'GET') {
    const settings = { ...initialSite, ...await getSite(env) };
    for (const field of ['phone', 'address', 'hours', 'mapsUrl']) if (!String(settings[field] || '').trim()) settings[field] = initialSite[field];
    return json(settings);
  }
  if (path === '/api/blogs' && method === 'GET') {
    const posts = await getBlogs(env);
    return json(posts.filter(p => p.status === 'published').map(({ body, ...rest }) => rest));
  }
  if (path.startsWith('/api/blogs/') && method === 'GET') {
    const slug = decodeURIComponent(path.slice('/api/blogs/'.length));
    const post = (await getBlogs(env)).find(p => p.slug === slug && p.status === 'published');
    return post ? json(post) : json({ error: 'Article not found' }, 404);
  }
  if (path === '/api/inquiries' && method === 'POST') {
    if (await limited(req, env, 'inquiries', 8, 15 * 60_000)) return json({ error: 'Too many enquiries. Please try again later.' }, 429);
    const body = await requestBody(req);
    if (str(body.website, 200)) return json({ message: 'Thank you.' });
    const name = str(body.name, 90), phone = str(body.phone, 32), brand = str(body.brand, 80);
    const model = str(body.model, 100), part = str(body.part, 130), message = str(body.message, 1500);
    const digits = phone.replace(/\D/g, '');
    if (name.length < 2 || digits.length < 10 || digits.length > 15 || (!part && !message)) return json({ error: 'Enter your name, valid phone number and a part or message.' }, 400);
    const entry = { id: 'INQ-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomUUID().slice(0, 4).toUpperCase(), name, phone, brand, model, part, message, status: 'new', createdAt: new Date().toISOString() };
    await env.DB.prepare('INSERT INTO inquiries (id, created_at, status, name, phone, brand, model, part, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(entry.id, entry.createdAt, entry.status, name, phone, brand, model, part, message).run();
    // Notify the shop only AFTER D1 confirms the enquiry was stored.
    // Never make an accepted customer enquiry depend on WhatsApp delivery.
    if (whatsappConfigured(env)) {
      const notification = sendEnquiryWhatsAppNotification(env, entry);
      if (ctx?.waitUntil) ctx.waitUntil(notification);
      else await notification;
    }
    return json({ id: entry.id, message: 'Your enquiry has been received.' }, 201);
  }
  if (path === '/api/subscriptions' && method === 'POST') {
    if (await limited(req, env, 'subscriptions', 5, 30 * 60_000)) return json({ error: 'Too many requests. Please try again later.' }, 429);
    const body = await requestBody(req), email = str(body.email, 160).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return json({ error: 'Enter a valid email address.' }, 400);
    await env.DB.prepare('INSERT OR IGNORE INTO subscribers (id, email, created_at) VALUES (?, ?, ?)')
      .bind(crypto.randomUUID(), email, new Date().toISOString()).run();
    return json({ message: 'Thanks! Your email has been saved for future shop updates.' });
  }
  if (path === '/api/admin/login' && method === 'POST') {
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || env.ADMIN_PASSWORD.length < 12 || env.SESSION_SECRET.length < 24) return json({ error: 'Admin login is not configured on the server.' }, 503);
    if (!sameOrigin(req)) return json({ error: 'Invalid request origin' }, 403);
    if (await limited(req, env, 'login', 8, 15 * 60_000)) return json({ error: 'Too many login attempts; try again later.' }, 429);
    const body = await requestBody(req);
    const valid = equals(await sha256(str(body.password, 400)), await sha256(env.ADMIN_PASSWORD));
    if (!valid) return json({ error: 'Incorrect password.' }, 401);
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(await sessionToken(env)) });
  }
  if (path === '/api/admin/logout' && method === 'POST') {
    if (!sameOrigin(req)) return json({ error: 'Invalid request origin' }, 403);
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('') });
  }
  if (path === '/api/admin/me' && method === 'GET') return json({ authenticated: await authenticated(req, env), configured: Boolean(env.ADMIN_PASSWORD?.length >= 12 && env.SESSION_SECRET?.length >= 24) });
  if (!path.startsWith('/api/admin/')) return json({ error: 'Unknown API endpoint' }, 404);
  if (!await authenticated(req, env)) return json({ error: 'Please log in' }, 401);
  if (!['GET', 'HEAD'].includes(method) && !sameOrigin(req)) return json({ error: 'Invalid request origin' }, 403);

  if (path === '/api/admin/festivals/preview' && method === 'GET') {
    const candidate = { enabled: true, festival: url.searchParams.get('festival'), intensity: url.searchParams.get('intensity') || 'low', greetingVariant: url.searchParams.get('greetingVariant') || 'default' };
    if (!validateFestivalSettings(candidate)) return json({ error: 'Choose a valid festival, greeting and intensity for the preview.' }, 400);
    return json({ festivals: FESTIVALS, intensities: FESTIVAL_INTENSITIES, settings: normalizeFestivalSettings(candidate), preview: true });
  }
  if (path === '/api/admin/festivals') {
    if (method === 'GET') return json(await festivalPayload(env));
    if (method === 'PUT') {
      const nextRaw = await requestBody(req);
      if (!validateFestivalSettings(nextRaw)) return json({ error: 'Choose a listed festival, a valid on/off setting, intensity and greeting.' }, 400);
      const previous = await getFestival(env);
      const next = normalizeFestivalSettings({ ...previous, ...nextRaw, greetingVariant: nextRaw.greetingVariant ?? (nextRaw.festival === previous.festival ? previous.greetingVariant : 'default') });
      await writeDoc(env, 'festival', next);
      return json(next);
    }
    return methodError();
  }
  if (path === '/api/admin/site') {
    if (method === 'GET') return json({ ...initialSite, ...await getSite(env) });
    if (method === 'PUT') {
      const b = await requestBody(req), next = { ...initialSite };
      for (const key of Object.keys(initialSite)) next[key] = key.endsWith('Url') ? safeUrl(b[key]) : str(b[key], key === 'address' ? 260 : 160);
      next.shopName = next.shopName || initialSite.shopName;
      next.phone = next.phone.replace(/[^+\d\s()-]/g, '');
      next.whatsapp = next.whatsapp.replace(/\D/g, '');
      if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) return json({ error: 'Invalid email address.' }, 400);
      await writeDoc(env, 'site', next);
      return json(next);
    }
    return methodError();
  }
  if (path === '/api/admin/images') {
    if (method === 'GET') {
      const rows = await env.DB.prepare('SELECT filename FROM images ORDER BY created_at DESC').all();
      return json(rows.results.map(row => row.filename).filter(name => CUSTOM_IMAGE.test(name)));
    }
    if (method === 'POST') {
      const b = await requestBody(req, MAX_IMAGE_BODY);
      const { bytes, ext, mime } = validateImage(b.dataUrl);
      const name = 'custom-' + crypto.randomUUID().replace(/-/g, '') + '.' + ext;
      await env.DB.prepare('INSERT INTO images (filename, mime, data, created_at) VALUES (?, ?, ?, ?)')
        .bind(name, mime, bytes, new Date().toISOString()).run();
      return json({ filename: name, url: '/assets/' + name }, 201);
    }
    return methodError();
  }
  if (path === '/api/admin/subscribers' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, email, created_at AS createdAt FROM subscribers ORDER BY created_at DESC').all();
    return json(rows.results);
  }
  if (path === '/api/admin/subscribers.csv' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT email, created_at AS createdAt FROM subscribers ORDER BY created_at DESC').all();
    return csvResponse(['email,createdAt', ...rows.results.map(r => [r.email, r.createdAt].map(quoteCsv).join(','))], 'shop-blog-subscribers.csv');
  }
  if (path === '/api/admin/inquiries' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, created_at AS createdAt, status, name, phone, brand, model, part, message FROM inquiries ORDER BY created_at DESC').all();
    return json(rows.results);
  }
  if (path === '/api/admin/inquiries.csv' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, created_at AS createdAt, status, name, phone, brand, model, part, message FROM inquiries ORDER BY created_at DESC').all();
    const columns = ['id', 'createdAt', 'status', 'name', 'phone', 'brand', 'model', 'part', 'message'];
    return csvResponse([columns.join(','), ...rows.results.map(row => columns.map(key => quoteCsv(row[key])).join(','))], 'shop-enquiries.csv');
  }
  if (path.startsWith('/api/admin/inquiries/') && method === 'PATCH') {
    const body = await requestBody(req);
    if (!['new', 'in-progress', 'closed'].includes(body.status)) return json({ error: 'Invalid status' }, 400);
    const id = decodeURIComponent(path.slice('/api/admin/inquiries/'.length));
    const row = await env.DB.prepare('UPDATE inquiries SET status = ? WHERE id = ? RETURNING id, created_at AS createdAt, status, name, phone, brand, model, part, message').bind(body.status, id).first();
    return row ? json(row) : json({ error: 'Enquiry not found' }, 404);
  }
  if (path === '/api/admin/blogs') {
    if (method === 'GET') return json(await getBlogs(env));
    if (method === 'POST') {
      const post = await normalizePost(env, await requestBody(req));
      const posts = await getBlogs(env);
      if (posts.some(p => p.slug === post.slug)) return json({ error: 'That URL slug is already in use.' }, 409);
      posts.unshift(post);
      await writeDoc(env, 'blogs', posts);
      return json(post, 201);
    }
    return methodError();
  }
  if (path.startsWith('/api/admin/blogs/')) {
    const id = decodeURIComponent(path.slice('/api/admin/blogs/'.length));
    const posts = await getBlogs(env), index = posts.findIndex(p => p.id === id);
    if (index < 0) return json({ error: 'Blog post not found.' }, 404);
    if (method === 'PUT') {
      const updated = await normalizePost(env, await requestBody(req), posts[index]);
      if (posts.some((post, i) => i !== index && post.slug === updated.slug)) return json({ error: 'That URL slug is already in use.' }, 409);
      posts[index] = updated;
      await writeDoc(env, 'blogs', posts);
      return json(updated);
    }
    if (method === 'DELETE') {
      posts.splice(index, 1);
      await writeDoc(env, 'blogs', posts);
      return json({ ok: true });
    }
    return methodError();
  }
  return methodError();
}

async function page(req, env, url, privatePreview) {
  const path = url.pathname.replace(/\/$/, '') || '/';
  const site = await getSite(env);
  const shop = site.shopName || initialSite.shopName;
  let heading = HEADINGS[path] || 'Page Not Found';
  let description = 'Explore two-wheeler spare parts and accessories for Hero, Honda, Bajaj, TVS, Yamaha, Suzuki, Royal Enfield and more. Contact our shop for availability.';
  let status = 200;
  if (path.startsWith('/blogs/')) {
    const slug = decodeURIComponent(path.slice('/blogs/'.length));
    const post = (await getBlogs(env)).find(item => item.slug === slug && item.status === 'published');
    if (post) { heading = post.title; description = post.summary || description; }
    else status = 404;
  } else if (!Object.hasOwn(HEADINGS, path)) status = 404;
  const title = heading + ' | ' + shop;
  const asset = await env.ASSETS.fetch(new Request(new URL('/index.html', req.url)));
  if (!asset.ok) return json({ error: 'Missing index.html asset' }, 500);
  let html = await asset.text();
  html = html.replace(/<title>.*?<\/title>/, '<title>' + escapeHtml(title) + '</title>')
    .replace(/<meta name="description" content="[^"]*" \/>/, '<meta name="description" content="' + escapeHtml(description) + '" />')
    .replace(/<meta property="og:title" content="[^"]*" \/>/, '<meta property="og:title" content="' + escapeHtml(title) + '" />')
    .replace(/<meta property="og:description" content="[^"]*" \/>/, '<meta property="og:description" content="' + escapeHtml(description) + '" />');
  const base = safeUrl(site.siteUrl).replace(/\/$/, '');
  if (base) html = html.replace('</head>', '<link rel="canonical" href="' + escapeHtml(base + path) + '" /><meta property="og:url" content="' + escapeHtml(base + path) + '" /></head>');
  if (privatePreview) html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow" /></head>');
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': privatePreview ? 'no-store' : 'no-cache' } });
}

async function sitemap(env) {
  const site = await getSite(env), base = safeUrl(site.siteUrl).replace(/\/$/, '');
  if (!base) return json({ error: 'Set the site URL in Admin to enable the sitemap.' }, 404);
  const blogs = (await getBlogs(env)).filter(p => p.status === 'published').map(p => '/blogs/' + p.slug);
  const paths = [...Object.keys(HEADINGS), ...blogs];
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths.map(path => '<url><loc>' + escapeHtml(base + path) + '</loc></url>').join('') + '</urlset>', {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' }
  });
}
function security(response, preview = false) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', preview ? 'SAMEORIGIN' : 'DENY');
  headers.set('Content-Security-Policy', "default-src 'self'; base-uri 'self'; img-src 'self' data: https://images.pexels.com https://images.unsplash.com; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-src https://maps.google.com https://www.google.com 'self'; form-action 'self'; frame-ancestors " + (preview ? "'self'" : "'none'"));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
async function route(req, env, ctx) {
  const url = new URL(req.url), path = url.pathname;
  const previewRequested = path === '/' && url.searchParams.has('festivalPreview');
  const privatePreview = previewRequested && url.searchParams.get('festivalPreview') === '1' && await authenticated(req, env);
  if (previewRequested && !privatePreview) return json({ error: 'Sign in to the dashboard to preview a festival.' }, 401);
  if (path.startsWith('/api/')) return api(req, env, url, ctx);
  if (!['GET', 'HEAD'].includes(req.method)) return methodError();
  if (path === '/festival-palettes.css') return new Response(FESTIVAL_PALETTES, { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-cache' } });
  if (path === '/sitemap.xml') return sitemap(env);
  if (path.startsWith('/assets/')) {
    const name = path.slice('/assets/'.length);
    if (CUSTOM_IMAGE.test(name)) {
      const row = await env.DB.prepare('SELECT mime, data FROM images WHERE filename = ?').bind(name).first();
      if (!row) return json({ error: 'Not found' }, 404);
      return new Response(new Uint8Array(row.data), { headers: { 'Content-Type': row.mime, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
    }
  }
  if (path === '/admin' || path === '/admin/') return env.ASSETS.fetch(new Request(new URL('/admin.html', req.url)));
  if (path === '/' || Object.hasOwn(HEADINGS, path.replace(/\/$/, '')) || path.startsWith('/blogs/')) return page(req, env, url, privatePreview);
  return env.ASSETS.fetch(req);
}

export default {
  async fetch(request, env, ctx) {
    try {
      if (!env.DB || !env.ASSETS) return json({ error: 'Cloudflare D1 or asset binding is not configured.' }, 503);
      return security(await route(request, env, ctx), new URL(request.url).searchParams.has('festivalPreview'));
    } catch (error) {
      console.error('Shop worker error:', error);
      const message = error?.message || '';
      const safe = message === 'Invalid JSON' || message === 'Request too large' || message.startsWith('Provide a title') || message.startsWith('Image ') || message.startsWith('Use a PNG') || message.startsWith('Invalid image') || message.startsWith('Image content');
      return security(json({ error: safe ? message : 'Something went wrong. Please try again.' }, safe ? 400 : 500));
    }
  }
};
