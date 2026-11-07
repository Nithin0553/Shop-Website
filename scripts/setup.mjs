import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile=path.join(root,'.env');
if (fs.existsSync(envFile)) {
  console.log('A .env file already exists. Its credentials were not changed.');
  console.log('If you have forgotten your admin password, edit .env while the server is stopped.');
} else {
  const password=crypto.randomBytes(18).toString('base64url');
  const secret=crypto.randomBytes(36).toString('hex');
  fs.writeFileSync(envFile,`PORT=3000\nADMIN_PASSWORD=${password}\nSESSION_SECRET=${secret}\n`,{flag:'wx',mode:0o600});
  console.log('Created your local .env settings.');
  console.log('Admin password (save it somewhere private): '+password);
}
console.log('Run: npm start');
console.log('Public website: http://localhost:3000');
console.log('Shop dashboard: http://localhost:3000/admin');
