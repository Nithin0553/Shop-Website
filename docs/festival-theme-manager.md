# Festival Theme Manager

The homepage greeting is part of the existing right-hand motorcycle, scooter and spare-parts visual. The original image remains in place with `object-fit: contain`; the greeting and festival illustration occupy reserved space above it. There is no separate full-width greeting banner. The white storefront, San Francisco/system font stack, logo, catalogue, contact details, blog and enquiry flows remain shared across themes.

## For the shop administrator

1. Sign in at `/admin` and open **Festival Theme Manager**.
2. Select any of the 20 festivals. The embedded preview is the actual website, including the original product hero.
3. Choose **Minimal**, **Subtle** or **Festive** intensity. These control decoration density; even the highest setting is bounded.
4. For Ramzan, choose **Ramzan Mubarak!** or **Eid Mubarak!** for Eid-ul-Fitr.
5. Inspect **Desktop**, **Tablet** or **Mobile**, replay the entrance if desired, or open the full private preview.
6. Turn **Festival mode** on and choose **Enable & publish** / **Publish theme**. Selecting or previewing a festival never publishes it.
7. Turn **Festival mode** off to immediately end a live theme. This action does not require another publish click.

The status card distinguishes the published theme from unpublished preview changes. Published settings survive refreshes and server restarts. Browser preview dimensions are 1280×840, 768×1024 and 390×844; the production CSS also supports smaller phones. The preview scales to fit the dashboard while retaining those real viewport sizes.

## Theme registry and unique entrances

`lib/festivals.mjs` defines a JSDoc-typed registry. Each entry includes its ID, name, English and optional Telugu greeting, palette, lazy asset reference, hero animation ID and stages, primary/secondary decorations and pattern family. Intensity budgets are shared: 3/5/8 small hero particles, 2/4/6 edge symbols, and 2/3/4 section accents. Mobile hides the edge rails and reduces visible particles further.

| Festival | Entrance | Page accents |
| --- | --- | --- |
| Sankranti | Two kites fly in; sunlight settles | Kites, sunlight, fine strings |
| Bhogi | A small bonfire glows; embers rise | Tiny embers and warm accents |
| Pongal | The decorated pot appears and gently overflows | Kolam and sugarcane |
| Kanuma | Decorated cattle appear with unfolding greenery | Grain and marigold details |
| Maha Shivaratri | Trishul, damaru and silver moonlight appear in sequence | Crescents and tiny stars |
| Holi | Two restrained powder bursts reveal the greeting | Translucent colour accents |
| Ugadi | Mango leaves unfold before the greeting | Mango-leaf torans and flowers |
| Sri Rama Navami | A golden bow is revealed, followed by its arrow | Bow and marigold accents |
| Hanuman Jayanti | The gada arrives with restrained radiance | Saffron ribbons and flowers |
| Akshaya Tritiya | Golden lotus petals open individually | Lotus and subtle shimmer |
| Raksha Bandhan | A rakhi rotates gently into place | Rakhi and thread borders |
| Krishna Janmashtami | Flute appears, then a peacock feather floats in | Feathers and flute motifs |
| Vinayaka Chavithi | Ganesha line art appears with soft petals | Modaks and marigolds |
| Dussehra | Bow and arrow reveal with a soft golden burst | Marigolds and ornaments |
| Bonalu | Bonam pot and neem leaves appear with illumination | Neem leaves and Telangana details |
| Bathukamma | Five flower tiers assemble, followed by the crown | Flowers and petals |
| Diwali | Diyas light sequentially, followed by gentle fireworks | Corner diyas and warm lights |
| Onam | Flowers assemble into a pookalam | Pookalam and banana leaves |
| Ramzan / Eid | Crescent appears; two lanterns illuminate in sequence | Lanterns, crescents and golden accents |
| Christmas | Tree lights appear in sequence; the top star glows | Ornaments and light edge snowfall |

The entrance lasts approximately 4.2 seconds and uses the Web Animations API. Its final state is ordinary static markup. Low-amplitude ambient CSS movement may continue; Diwali's background firework repeats only at a restrained 44-second interval. There is no video, autoplay audio or animation-library dependency.

## Shared renderer and lifecycle

`public/festival-artwork.js` exports local SVG artwork and small decoration primitives. `public/festival-effects.js` lazy-loads this module only for an active theme or private preview. `public/festivals.css` handles the shared responsive layout, motion, reserved hero space and decorative positioning. `/festival-palettes.css` is generated from the registry, keeping the palette definitions in one place.

The central provider owns settings, live updates, the hero element, active entrance animations and registered listeners. `app.js` calls `beforeRender()` and `mount()` around its existing render operation. The provider retains the same hero node and its animation state on minor rerenders, including mobile-menu changes. It does not replay the entrance for search/filter updates or intensity changes. A new page visit, festival change or greeting variant is a relevant activation. Switching themes cancels the previous entrance and replaces all old scenery; disabling removes the hero enrichment, decorative nodes, added host classes and body attributes.

Header/logo corners, selected section headings, empty section corners, page edges and the footer use the current festival's primary and secondary motifs. Decorative elements are `aria-hidden`, non-focusable, bounded and `pointer-events: none`. Section scenery sits behind content; mobile edge rails are hidden.

Visitor pause preferences are saved locally. A stored pause preference or `prefers-reduced-motion` renders the complete greeting statically. Pausing during an entrance settles it to its readable final state. Visibility changes pause nonessential animation and disconnect the live stream while hidden; returning reconnects and refreshes the published setting. Listener setup is idempotent, and `dispose()` cancels animations, removes listeners, closes the stream and clears fallback polling.

## Persistence, authorization and preview isolation

The existing JSON storage is retained. `DATA_DIR/festival.json` stores only:

```json
{
  "enabled": false,
  "festival": "sankranti",
  "intensity": "low",
  "greetingVariant": "default"
}
```

Older two-field records migrate on read without resetting their enabled festival. Business-detail edits use a different file. Writes validate strict boolean/enum types, use the existing authenticated admin session, and use the existing atomic file-write helper. There is no new database or external service.

| Route | Access and behavior |
| --- | --- |
| `GET /api/festivals` | Public registry, intensity budgets and published settings |
| `GET /api/festivals/events` | Public read-only server-sent events for immediate published changes |
| `GET /api/admin/festivals` | Authenticated published settings and registry |
| `PUT /api/admin/festivals` | Authenticated validation, atomic persistence and live notification |
| `GET /api/admin/festivals/preview` | Authenticated validated preview payload; never writes or broadcasts |
| `/?festivalPreview=1&festival=…&intensity=…&greetingVariant=…` | Actual public page with private, non-published configuration |

A preview payload disables the public live-update connection, so a live theme cannot overwrite the administrator's draft preview. Preview page responses are non-cacheable and `noindex,nofollow`. Only an authenticated preview page may be embedded by the same origin. Ordinary public pages retain `X-Frame-Options: DENY` and `frame-ancestors 'none'`; no authentication or framing exception is added to the general public site.

Server-sent events deliver enable, switch and disable immediately. The browser falls back to 15-second polling if streaming is unavailable and refreshes on focus/visibility changes. Heartbeats and stream-close handlers clean up disconnected clients; slow stream buffers are bounded. This follows the app's existing single-server/persistent-volume storage model.

## Verification and extending the system

Run `npm test`. The suite covers all 20 IDs, palettes, distinct entrance recipes and asset references; preview isolation and authorization; malformed settings; intensity and Eid variants; legacy migration; restart persistence; immediate stream updates; resource disposal; and existing storefront/admin behavior. JavaScript has no build step or separate lint task; use `node --check` for changed scripts.

Browser verification covers all 20 themes at desktop, tablet, mobile and 320px widths; product-image loading; greeting bounds; decoration cleanup; publish versus preview; pause, reduced motion and stable settled entrances; navigation and form-value preservation during live disable. Backend authorization is tested against the production server with isolated test data. Browser UI checks use disposable test data and a local authenticated fixture, without user credentials.

To add a festival, add its typed registry entry, an SVG composition and valid stage markers in `festival-artwork.js`, and any new small decoration primitive. Entrance stages target `data-entrance` markers; the automated registry/asset test rejects missing markers. Keep durations within 3–5 seconds, use transform/opacity where practical, retain a readable static final state, and respect the shared intensity budgets.
