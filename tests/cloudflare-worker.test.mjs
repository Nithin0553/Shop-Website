import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';

// Tiny in-memory D1 stand-in for request contract tests. Real D1 is verified with wrangler dev.
class FakeD1 {
  constructor() { this.docs = new Map(); this.inquiries = []; this.images = new Map(); this.subscribers = []; this.rates = new Map(); }
  prepare(sql) {
    const db = this;
    const query = sql.replace(/\s+/g, ' ').trim();
    const statement = (...args) => ({
      async first() {
        if (query.startsWith('SELECT payload FROM documents')) return db.docs.has(args[0]) ? { payload: db.docs.get(args[0]) } : null;
        if (query.startsWith('INSERT INTO throttles')) {
          const key = args[0] + ':' + args[1], previous = db.rates.get(key);
          const hits = previous && previous.window === args[2] ? previous.hits + 1 : 1;
          db.rates.set(key, { window: args[2], hits });
          return { hits };
        }
        if (query.startsWith('SELECT filename FROM images WHERE')) return db.images.has(args[0]) ? { filename: args[0] } : null;
        if (query.startsWith('SELECT mime, data FROM images')) return db.images.get(args[0]) || null;
        if (query.startsWith('UPDATE inquiries SET status')) {
          const row = db.inquiries.find(x => x.id === args[1]);
          if (!row) return null;
          row.status = args[0];
          return row;
        }
        throw new Error('Unexpected first(): ' + query);
      },
      async all() {
        if (query.startsWith('SELECT filename FROM images')) return { results: [...db.images.keys()].map(filename => ({ filename })) };
        if (query.includes('FROM inquiries')) return { results: [...db.inquiries] };
        if (query.includes('FROM subscribers')) return { results: [...db.subscribers] };
        throw new Error('Unexpected all(): ' + query);
      },
      async run() {
        if (query.startsWith('INSERT INTO documents')) { db.docs.set(args[0], args[1]); return { success: true }; }
        if (query.startsWith('INSERT INTO inquiries')) {
          const [id, createdAt, status, name, phone, brand, model, part, message] = args;
          db.inquiries.push({ id, createdAt, status, name, phone, brand, model, part, message });
          return { success: true };
        }
        if (query.startsWith('INSERT OR IGNORE INTO subscribers')) {
          if (!db.subscribers.some(r => r.email === args[1])) db.subscribers.push({ id: args[0], email: args[1], createdAt: args[2] });
          return { success: true };
        }
        if (query.startsWith('INSERT INTO images')) {
          db.images.set(args[0], { mime: args[1], data: Array.from(args[2]) });
          return { success: true };
        }
        throw new Error('Unexpected run(): ' + query);
      }
    });
    return { bind: (...args) => statement(...args), first: () => statement().first(), all: () => statement().all(), run: () => statement().run() };
  }
}
const HOME = '<!doctype html><html><head><meta name="description" content="old" /><meta property="og:title" content="old" /><meta property="og:description" content="old" /><title>Old</title></head><body>Shop</body></html>';
const env = () => ({
  DB: new FakeD1(),
  ASSETS: { fetch: async request => new Response(new URL(request.url).pathname === '/index.html' ? HOME : '<h1>Admin</h1>', { headers: { 'Content-Type': 'text/html' } }) },
  ADMIN_PASSWORD: 'private-admin-password-2026',
  SESSION_SECRET: 'private-session-secret-long-enough-for-testing-2026'
});
const ask = (e, path, method = 'GET', data, cookie) => worker.fetch(new Request('https://shop.example.test' + path, {
  method,
  ...(data === undefined ? {} : { body: JSON.stringify(data), headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) } }),
  ...(data === undefined && cookie ? { headers: { Cookie: cookie } } : {})
}), e);

test('public site, sample articles and festival catalogue survive migration', async () => {
  const e = env();
  const site = await (await ask(e, '/api/site')).json();
  assert.equal(site.shopName, 'Sri Sai Shanmukha Auto Centre');
  const blogs = await (await ask(e, '/api/blogs')).json();
  assert.ok(blogs.length >= 6);
  assert.ok(blogs.every(p => !Object.hasOwn(p, 'body')));
  const festivals = await (await ask(e, '/api/festivals')).json();
  assert.equal(festivals.festivals.length, 20);
  assert.equal(festivals.pollOnly, true);
  const home = await ask(e, '/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Two-Wheeler Spare Parts/);
});

test('admin session and festival preview are protected', async () => {
  const e = env();
  assert.equal((await ask(e, '/api/admin/blogs')).status, 401);
  assert.equal((await ask(e, '/?festivalPreview=1')).status, 401);
  assert.equal((await ask(e, '/api/admin/login', 'POST', { password: 'wrong' })).status, 401);
  const logged = await ask(e, '/api/admin/login', 'POST', { password: e.ADMIN_PASSWORD });
  assert.equal(logged.status, 200);
  const cookie = logged.headers.get('Set-Cookie').split(';')[0];
  assert.match(logged.headers.get('Set-Cookie'), /HttpOnly; Secure/);
  const own = await (await ask(e, '/api/admin/me', 'GET', undefined, cookie)).json();
  assert.equal(own.authenticated, true);
  const preview = await ask(e, '/?festivalPreview=1', 'GET', undefined, cookie);
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /noindex,nofollow/);
  const festival = { enabled: true, festival: 'diwali', intensity: 'low', greetingVariant: 'default' };
  const saved = await ask(e, '/api/admin/festivals', 'PUT', festival, cookie);
  assert.equal(saved.status, 200);
  assert.equal((await (await ask(e, '/api/festivals')).json()).settings.festival, 'diwali');
  const logout = await ask(e, '/api/admin/logout', 'POST', {}, cookie);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
});

test('customer enquiries persist in D1 and can be updated by admin', async () => {
  const e = env();
  assert.equal((await ask(e, '/api/inquiries', 'POST', { name: 'A', phone: '123' })).status, 400);
  const result = await ask(e, '/api/inquiries', 'POST', { name: 'Ravi', phone: '9030084872', brand: 'Honda', model: 'Activa', part: 'Brake pads' });
  assert.equal(result.status, 201);
  const id = (await result.json()).id;
  assert.equal(e.DB.inquiries.length, 1);
  const logged = await ask(e, '/api/admin/login', 'POST', { password: e.ADMIN_PASSWORD });
  const cookie = logged.headers.get('Set-Cookie').split(';')[0];
  const update = await ask(e, '/api/admin/inquiries/' + encodeURIComponent(id), 'PATCH', { status: 'in-progress' }, cookie);
  assert.equal(update.status, 200);
  const rows = await (await ask(e, '/api/admin/inquiries', 'GET', undefined, cookie)).json();
  assert.equal(rows[0].status, 'in-progress');
});

test('uploaded images use D1 BLOB and preserve exact public URL', async () => {
  const e = env();
  const logged = await ask(e, '/api/admin/login', 'POST', { password: e.ADMIN_PASSWORD });
  const cookie = logged.headers.get('Set-Cookie').split(';')[0];
  const bytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, ...Array(48).fill(0)]);
  const dataUrl = 'data:image/png;base64,' + Buffer.from(bytes).toString('base64');
  const uploaded = await ask(e, '/api/admin/images', 'POST', { dataUrl }, cookie);
  assert.equal(uploaded.status, 201);
  const { url } = await uploaded.json();
  const image = await ask(e, url);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('Content-Type'), 'image/png');
  assert.deepEqual(new Uint8Array(await image.arrayBuffer()), bytes);
});
