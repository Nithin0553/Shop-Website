/* GitHub Pages-only browser runtime. Included by the static build instead of the API client. */
const GH_BASE = window.__SHOP_STATIC_BASE__ || '/Shop-Website';

function stripBase(pathname) {
  return pathname === GH_BASE ? '/' :
    pathname.startsWith(GH_BASE + '/') ? (pathname.slice(GH_BASE.length) || '/') : pathname;
}
function withBase(url) {
  if (url.startsWith(GH_BASE + '/') || url === GH_BASE) return url;
  return url.startsWith('/') ? GH_BASE + url : url;
}
function staticHtml(html) {
  // Some image URLs already come from asset(), which includes GH_BASE.
  // Prefix only truly root-relative links; never turn /Shop-Website/assets/
  // into the invalid /Shop-Website/Shop-Website/assets/ path.
  return html.replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_, attr, url) => {
    const target = url === GH_BASE || url.startsWith(GH_BASE + '/') ? url : GH_BASE + url;
    return attr + '="' + target + '"';
  });
}

async function handleSubmit(e) {
  if (e.target.id !== 'enquiry-form') return;
  e.preventDefault();
  if (formPending) return;
  const form = e.target;
  const payload = Object.fromEntries(new FormData(form));
  const feedback = document.getElementById('form-feedback');
  const digits = String(payload.phone || '').replace(/\D/g, '');
  if (String(payload.website || '').trim()) return;
  if (String(payload.name || '').trim().length < 2 ||
      digits.length < 10 || digits.length > 15 ||
      (!String(payload.part || '').trim() && !String(payload.message || '').trim())) {
    feedback.className = 'form-feedback error';
    feedback.textContent = 'Please enter your name, a valid phone number, and the part you need (or a message).';
    return;
  }
  const shopWhatsApp = String(SITE.whatsapp || SITE.phone || '').replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(shopWhatsApp)) {
    feedback.className = 'form-feedback error';
    feedback.textContent = 'WhatsApp is not configured. Please call our shop instead.';
    return;
  }
  const clean = value => String(value || '').trim().replace(/[\r\n\t]+/g, ' ').slice(0, 300);
  const message = [
    'Hello Sri Sai Shanmukha Auto Centre, I would like to enquire about spare parts.',
    'Name: ' + clean(payload.name),
    'Phone: ' + clean(payload.phone),
    'Bike brand: ' + (clean(payload.brand) || 'Not provided'),
    'Model / year: ' + (clean(payload.model) || 'Not provided'),
    'Required part: ' + (clean(payload.part) || 'Not provided'),
    'Message: ' + (clean(payload.message) || 'Not provided')
  ].join('\n');
  const url = 'https://wa.me/' + shopWhatsApp + '?text=' + encodeURIComponent(message);
  feedback.className = 'form-feedback success';
  feedback.textContent = 'Opening WhatsApp. Please press Send there to deliver your enquiry; the website does not save it.';
  // Navigation is caused directly by the user's submit gesture, not an API request.
  window.location.assign(url);
}

async function start() {
  const load = async name => {
    const url = GH_BASE + '/static-data/' + name + '.json';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Could not load local ' + name + ' data.');
    return response.json();
  };
  const [site, blogs, festivals] = await Promise.allSettled([
    load('site'), load('blogs'), load('festivals')
  ]);
  if (site.status === 'fulfilled') SITE = { ...SITE, ...site.value };
  if (blogs.status === 'fulfilled') {
    BLOGS = blogs.value.filter(post => post.status === 'published');
  }
  window.ShopFestivalEffects?.start(
    festivals.status === 'fulfilled' ? festivals.value : null,
    SITE.shopName
  );
  bindGlobal();
  render();
}
