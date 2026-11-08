// Offline helper for transferring backed-up JSON records to a newly created D1 database.
// Never commit the generated SQL: it contains customer contact details.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.resolve(process.argv[2] || process.env.DATA_DIR || path.join(root, 'data'));
const output = path.resolve(process.argv[3] || path.join(root, '.cloudflare-import.sql'));
const quote = value => "'" + String(value ?? '').replace(/'/g, "''") + "'";
const entries = [];
const warnings = [];

function load(file) {
  const filename = path.join(directory, file);
  return fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : null;
}
function documentRow(key, file, type) {
  const value = load(file);
  if (value === null) return;
  if (type === 'array' && !Array.isArray(value)) throw new Error(file + ' should contain an array.');
  if (type === 'object' && (!value || Array.isArray(value) || typeof value !== 'object')) throw new Error(file + ' should contain an object.');
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized) >= 90000) {
    throw new Error(file + ' is too large for a single D1 SQL statement. Split the export into smaller batches or use a dedicated import tool.');
  }
  entries.push('INSERT INTO documents (doc_key, payload) VALUES (' + quote(key) + ', ' + quote(serialized) + ') ON CONFLICT(doc_key) DO UPDATE SET payload=excluded.payload;');
  console.log('Prepared ' + file);
  return value;
}
if (!fs.existsSync(directory)) throw new Error('Data folder does not exist: ' + directory);
documentRow('site', 'site.json', 'object');
documentRow('festival', 'festival.json', 'object');
const blogs = documentRow('blogs', 'blogs.json', 'array');
const enquiries = load('inquiries.json');
if (enquiries) {
  if (!Array.isArray(enquiries)) throw new Error('inquiries.json should contain an array.');
  for (const row of enquiries) {
    const values = [row.id, row.createdAt, row.status || 'new', row.name, row.phone, row.brand || '', row.model || '', row.part || '', row.message || ''];
    entries.push('INSERT OR IGNORE INTO inquiries (id, created_at, status, name, phone, brand, model, part, message) VALUES (' + values.map(quote).join(', ') + ');');
  }
  console.log('Prepared ' + enquiries.length + ' enquiries');
}
const subscribers = load('subscribers.json');
if (subscribers) {
  if (!Array.isArray(subscribers)) throw new Error('subscribers.json should contain an array.');
  for (const row of subscribers) {
    entries.push('INSERT OR IGNORE INTO subscribers (id, email, created_at) VALUES (' + [row.id, row.email, row.createdAt].map(quote).join(', ') + ');');
  }
  console.log('Prepared ' + subscribers.length + ' subscribers');
}
const uploads = path.join(directory, 'uploads');
const imageFiles = fs.existsSync(uploads) ? fs.readdirSync(uploads).filter(name => /^custom-[a-f0-9]{32}\.(png|jpg|webp)$/.test(name)) : [];
if (imageFiles.length || blogs?.some(post => /^custom-/.test(post.image))) warnings.push('Custom blog images cannot be migrated through D1 SQL: reupload them through the Cloudflare admin and reassign images in affected posts.');
if (!entries.length) throw new Error('No JSON records were found in: ' + directory);
fs.writeFileSync(output, '-- PRIVATE DATA: NEVER COMMIT OR SHARE THIS FILE.\n-- Apply ONLY to your new D1 database, before accepting live enquiries.\n' + entries.join('\n') + '\n', { flag: 'w', mode: 0o600 });
console.log('Created private import file: ' + output);
for (const warning of warnings) console.warn('WARNING: ' + warning);
console.log('Review the file, then apply with: npx wrangler d1 execute sssa-shop-data --remote --file=.cloudflare-import.sql');
