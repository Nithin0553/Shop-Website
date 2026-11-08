import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'pages-config', 'wrangler.jsonc'), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('Pages configuration preserves the production shop D1 database and binding', () => {
  assert.equal(config.name, 'sri-sai-shanmukha-auto-centre');
  assert.equal(config.pages_build_output_dir, '../dist-pages');
  assert.equal(config.d1_databases.length, 1);
  assert.deepEqual(config.d1_databases[0], {
    binding: 'DB',
    database_name: 'sssa-shop-data',
    database_id: '144a1bc5-c8b5-4500-b7ff-cbcaf964e255'
  });
  assert.equal(config.main, undefined, 'Pages config must not use the Workers main field');
  assert.equal(config.assets, undefined, 'Pages config must not use Workers static assets config');
});

test('Pages build and deployment commands are separate from existing Workers deployment', () => {
  assert.match(packageJson.scripts['cloudflare:pages:build'], /build-cloudflare-pages/);
  assert.match(packageJson.scripts['cloudflare:pages:deploy'], /wrangler pages deploy/);
  assert.match(packageJson.scripts['cloudflare:pages:deploy'], /cd pages-config/);
  assert.doesNotMatch(packageJson.scripts['cloudflare:pages:deploy'], /--config/);
  assert.match(packageJson.scripts['cloudflare:pages:dev'], /cd pages-config/);
  assert.doesNotMatch(packageJson.scripts['cloudflare:pages:dev'], /--config/);
  assert.equal(packageJson.scripts['cloudflare:deploy'], 'npx wrangler deploy');
  const script = fs.readFileSync(path.join(root, 'scripts/build-cloudflare-pages.mjs'), 'utf8');
  assert.match(script, /'_worker\.js'/);
  assert.match(script, /'\.assetsignore'/);
  assert.match(script, /bundle: true/);
});
