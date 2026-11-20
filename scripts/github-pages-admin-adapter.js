/* GitHub Pages admin API adapter. No server or embedded credentials.
   The GitHub fine-grained token is held in memory only until page unload/sign-out. */
const GH_BASE = '/Shop-Website';
const GH_REPOSITORY = 'Nithin0553/Shop-Website';
const GH_API_PREFIX = 'https://api.github.com/repos/' + GH_REPOSITORY + '/contents/';
let ghAdminToken = '';
const ghFileVersions = new Map();

function ghBase64EncodeText(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}
function ghBase64DecodeText(value) {
  const binary = atob(String(value || '').replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
async function ghRequest(url, method = 'GET', body) {
  if (!ghAdminToken) throw new Error('Sign in with your GitHub access token.');
  // Never send a token to an arbitrary URL or store it in site data.
  if (url !== 'https://api.github.com/user' &&
      !url.startsWith('https://api.github.com/repos/' + GH_REPOSITORY + '/')) {
    throw new Error('Refused an unexpected GitHub API destination.');
  }
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: 'Bearer ' + ghAdminToken,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer'
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('GitHub rejected the token. Check it or create a new fine-grained token.');
    if (response.status === 403) throw new Error('GitHub denied access. Grant this token Contents: Read and write for Shop-Website.');
    if (response.status === 409 || response.status === 422) throw new Error('GitHub could not save the change. The file may have changed; refresh this dashboard and try again.');
    if (response.status === 404) throw new Error('GitHub file not found or token cannot access Shop-Website.');
    throw new Error('GitHub request failed (HTTP ' + response.status + ').');
  }
  return response.status === 204 ? null : response.json();
}
async function ghRead(path) {
  const url = GH_API_PREFIX + path + '?ref=main';
  const file = await ghRequest(url);
  if (typeof file.content !== 'string' || !file.sha) throw new Error('GitHub did not return the expected file.');
  ghFileVersions.set(path, file.sha);
  return JSON.parse(ghBase64DecodeText(file.content));
}
async function ghWrite(path, data, message) {
  if (!ghFileVersions.has(path)) await ghRead(path);
  const oldSha = ghFileVersions.get(path);
  const result = await ghRequest(GH_API_PREFIX + path, 'PUT', {
    message,
    branch: 'main',
    sha: oldSha,
    content: ghBase64EncodeText(JSON.stringify(data, null, 2) + '\n')
  });
  if (!result.content || !result.content.sha) throw new Error('GitHub did not confirm this save.');
  ghFileVersions.set(path, result.content.sha);
  return data;
}
function ghPayload(options) {
  try { return JSON.parse(options.body || '{}'); }
  catch { throw new Error('Invalid form data.'); }
}
function ghValidateFestival(next, available) {
  if (typeof next.enabled !== 'boolean' || !available.festivals.some(f => f.id === next.festival)) {
    throw new Error('Select a valid festival.');
  }
  if (!Object.hasOwn(available.intensities, next.intensity)) throw new Error('Select a valid intensity.');
  const festival = available.festivals.find(f => f.id === next.festival);
  const variant = next.greetingVariant || 'default';
  if (variant !== 'default' && !Object.hasOwn(festival.greetingVariants || {}, variant)) {
    throw new Error('Select a valid greeting.');
  }
  return {enabled: next.enabled, festival: next.festival, intensity: next.intensity, greetingVariant: variant};
}
function ghValidatePost(values, previous, allPosts) {
  const title = String(values.title || '').trim();
  const body = String(values.body || '').trim();
  const slug = String(values.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
  if (title.length < 3 || title.length > 130 || body.length < 60 || !/^[a-z0-9-]{3,90}$/.test(slug)) {
    throw new Error('Add a title, a valid URL slug, and an article body of at least 60 characters.');
  }
  if (allPosts.some(post => post.slug === slug && post.id !== previous?.id)) {
    throw new Error('An article already uses that URL slug.');
  }
  const status = values.status === 'published' ? 'published' : 'draft';
  const image = String(values.image || '').trim();
  if (!/^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp)$/i.test(image)) {
    throw new Error('Choose an uploaded or existing image.');
  }
  return {
    ...previous,
    id: previous?.id || 'blog-' + crypto.randomUUID(),
    slug, title,
    category: ['Maintenance Tips', 'Spare Parts Guide', 'Buying Guide', 'Bike Care', 'Scooter Care'].includes(values.category) ? values.category : 'Spare Parts Guide',
    summary: String(values.summary || '').trim().slice(0, 260),
    image,
    readingMinutes: Math.max(1, Number(previous?.readingMinutes) || Math.ceil(body.split(/\s+/).length / 200)),
    publishedAt: previous?.publishedAt || new Date().toISOString().slice(0, 10),
    status,
    body
  };
}
async function ghImages() {
  const items = await ghRequest(GH_API_PREFIX + 'public/assets?ref=main');
  return items.filter(item => item.type === 'file' && /\.(webp|png|jpe?g)$/i.test(item.name))
    .map(item => item.name);
}
async function ghUpload(payload) {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(payload.dataUrl || ''));
  if (!match) throw new Error('Choose a JPG, PNG or WebP image.');
  const approximateBytes = Math.floor(match[2].length * 0.75);
  if (approximateBytes > 1_800_000) throw new Error('Images must be smaller than 1.8 MB.');
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const filename = 'custom-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8) + '.' + extension;
  await ghRequest(GH_API_PREFIX + 'public/assets/' + filename, 'PUT', {
    message: 'content: upload blog image ' + filename,
    branch: 'main',
    content: match[2]
  });
  return { filename };
}
async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (path === '/api/admin/me') return {authenticated: !!ghAdminToken, configured: true};
  if (path === '/api/admin/login' && method === 'POST') {
    const candidate = String(ghPayload(options).password || '').trim();
    if (!/^github_pat_[A-Za-z0-9_]+$/.test(candidate)) {
      throw new Error('Enter a fine-grained GitHub personal access token.');
    }
    ghAdminToken = candidate;
    try {
      const user = await ghRequest('https://api.github.com/user');
      if (user.login !== 'Nithin0553') throw new Error('Only the shop GitHub repository owner may sign in.');
      await ghRead('data/site.json');
      return {authenticated: true};
    } catch (error) {
      ghAdminToken = '';
      ghFileVersions.clear();
      throw error;
    }
  }
  if (path === '/api/admin/logout' && method === 'POST') {
    ghAdminToken = '';
    ghFileVersions.clear();
    return {ok: true};
  }
  if (!ghAdminToken) throw new Error('Please sign in first.');
  if (path === '/api/admin/site') {
    if (method === 'GET') return ghRead('data/site.json');
    if (method === 'PUT') {
      const previous = await ghRead('data/site.json');
      const proposed = ghPayload(options);
      const next = {...previous};
      for (const key of Object.keys(previous)) {
        if (Object.hasOwn(proposed, key)) next[key] = String(proposed[key] || '').trim().slice(0, 1200);
      }
      return ghWrite('data/site.json', next, 'content: update shop details from admin');
    }
  }
  if (path === '/api/admin/blogs' && method === 'GET') return ghRead('data/blogs.json');
  if (path === '/api/admin/images' && method === 'GET') return ghImages();
  if (path === '/api/admin/images' && method === 'POST') return ghUpload(ghPayload(options));
  if (path === '/api/admin/festivals') {
    const publicData = await fetch(GH_BASE + '/static-data/festivals.json', {cache: 'no-store'})
      .then(res => { if (!res.ok) throw new Error('Festival catalogue unavailable.'); return res.json(); });
    if (method === 'GET') return {...publicData, settings: await ghRead('data/festival.json')};
    if (method === 'PUT') {
      const next = ghValidateFestival(ghPayload(options), publicData);
      return ghWrite('data/festival.json', next, 'content: update festival theme from admin');
    }
  }
  const blogMatch = path.match(/^\/api\/admin\/blogs\/([^/]+)$/);
  if ((path === '/api/admin/blogs' || blogMatch) && ['POST', 'PUT', 'DELETE'].includes(method)) {
    const all = await ghRead('data/blogs.json');
    const id = blogMatch ? decodeURIComponent(blogMatch[1]) : null;
    const position = id ? all.findIndex(post => post.id === id) : -1;
    if (id && position === -1) throw new Error('Article was not found in GitHub.');
    if (method === 'DELETE') {
      await ghWrite('data/blogs.json', all.filter(post => post.id !== id), 'content: remove blog article');
      return {ok: true};
    }
    const previous = position < 0 ? null : all[position];
    const post = ghValidatePost(ghPayload(options), previous, all);
    if (previous) all[position] = post;
    else all.unshift(post);
    await ghWrite('data/blogs.json', all, 'content: ' + (previous ? 'edit' : 'create') + ' blog article');
    return post;
  }
  throw new Error('This feature requires the old server and is not supported on GitHub Pages.');
}
