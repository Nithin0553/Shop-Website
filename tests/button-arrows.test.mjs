import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');

test('action links and buttons no longer render decorative forward-arrow SVGs',()=>{
  const app=read('public/app.js');
  assert.doesNotMatch(app, /\$\{ico\('arrow',\d+\)\}/);
  assert.doesNotMatch(app, /\$\{ico\('chevron',\d+\)\}/);
  // The pictured CTA, blog actions, product enquiries, and categories are links
  // or buttons; their labels should not append a navigation arrow.
  assert.match(app, /\$\{esc\(section\.buttonLabel\)\}<\/a>/);
  assert.match(app, /Read More<\/a>/);
  assert.match(app, /Enquire<\/a>/);
  assert.match(app, /Ask for help<\/a>/);
  assert.match(app, /Back to homepage<\/a>/);
  assert.doesNotMatch(app, /← Back to articles/);
  // Intentional leading function icons such as Call and WhatsApp still work.
  assert.match(app, /ico\(primaryIcon,20\)/);
  assert.match(app, /ico\('send',19\)/);
});

test('shop admin action buttons and customer contact link have plain labels',()=>{
  const admin=read('public/admin.js');
  const assistant=read('public/automobile-assistant.html');
  for(const label of [
    'Sign in', 'Save business details', 'Create article',
    'Save changes', 'View website', 'Open full preview'
  ])assert.ok(admin.includes(label),label);
  assert.doesNotMatch(admin, /(?:Sign in|Save business details|Create article|Save changes) →/);
  assert.doesNotMatch(admin, /(?:View website|Open full preview) ↗/);
  // Preserve UI instructions that legitimately use a right-arrow separator.
  assert.match(admin, /Share → Copy link/);
  assert.match(assistant, /Ask our shop<\/a>/);
  assert.doesNotMatch(assistant, /Ask our shop ↗/);
});
