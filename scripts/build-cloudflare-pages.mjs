// Build the existing Cloudflare Worker as a Pages advanced-mode _worker.js.
// Only static public assets and the bundled server entry belong in dist-pages.
import { cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceAssets = path.join(root, 'public');
const output = path.join(root, 'dist-pages');

await rm(output, { recursive: true, force: true });
await cp(sourceAssets, output, {
  recursive: true,
  filter(source) {
    const relative = path.relative(sourceAssets, source);
    if (!relative) return true;
    // .assetsignore applies to Workers static assets, not Pages Functions.
    // Avoid copying an old Pages entry that could shadow the freshly built one.
    return !['.assetsignore', '_worker.js'].includes(path.basename(source));
  }
});

await build({
  entryPoints: [path.join(root, 'cloudflare', 'worker.mjs')],
  outfile: path.join(output, '_worker.js'),
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  legalComments: 'none',
  logLevel: 'info'
});

console.log('Pages bundle ready in dist-pages/ (static assets + _worker.js).');
