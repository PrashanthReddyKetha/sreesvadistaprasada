/**
 * Our own record of visits and events, sent to our backend (POST /api/events) —
 * independent of Google. Shown in Admin › Analytics.
 *
 * Privacy:
 * - No name, email, phone or address is ever sent.
 * - Unless the visitor pressed "Accept all" on the cookie banner, nothing is stored
 *   on their device: the visit id lives in memory only and ends with the page.
 * - With consent, the visit (id, where it came from, when last active) is kept in the
 *   browser so every tab shares it, and a visitor id is kept so a return visit can be
 *   recognised. A pause of more than 30 minutes starts a new visit either way.
 *
 * Sending: the first batch of a page load goes almost at once, later ones every few
 * seconds, as plain text so the browser needs no permission round-trip first. When the
 * page is hidden or closed whatever is left goes by sendBeacon, which outlives the page.
 */

const ENDPOINT = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com') + '/api/events';
const CONSENT_KEY = 'ssp_cookie_consent';
const VISIT_KEY = 'ssp_visit';
const VISITOR_KEY = 'ssp_visitor';
const TEST_KEY = 'ssp_track_test';
const FLUSH_MS = 4000;
const FIRST_FLUSH_MS = 400;
const VISIT_GAP_MS = 30 * 60000;
const MAX_BATCH = 25;
const SITE = /(^|\.)sreesvadistaprasada\.com$/;
// Crawlers, link checkers, speed tests and scripts run this code too. They are not visitors.
const ROBOT = /bot\/|bot;|googlebot|bingbot|petalbot|crawler|spider|slurp|headless|lighthouse|page ?speed|gtmetrix|pingdom|ptst|prerender|phantomjs|datadog|site24x7|uptime|statuscake|screaming frog|facebookexternalhit|bingpreview|mediapartners|google-inspectiontool|googleother|feedfetcher|google-read-aloud|adsbot|apis-google|chatgpt|oai-search|gptbot|claudebot|claude-user|perplexity|bytespider|ia_archiver/i;

let visit = null;      // { id, attribution, seen }
let queue = [];
let timer = null;
let listening = false;
let sentOnce = false;

const newId = () => {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
};

const hasConsent = () => {
  try { return localStorage.getItem(CONSENT_KEY) === 'granted'; } catch { return false; }
};

function readAttribution() {
  const q = new URLSearchParams(window.location.search);
  let referrer = '';
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : '';
    if (host && host !== window.location.hostname) referrer = host;
  } catch { /* unparseable referrer — leave empty */ }
  return {
    source: q.get('utm_source') || '',
    medium: q.get('utm_medium') || '',
    campaign: q.get('utm_campaign') || '',
    referrer,
    landing: window.location.pathname,
  };
}

function getVisit() {
  const now = Date.now();
  const consent = hasConsent();
  if (consent) {
    // every tab shares one visit; the most recently active word wins
    try {
      const stored = JSON.parse(localStorage.getItem(VISIT_KEY) || 'null');
      if (stored && stored.id && now - (stored.seen || 0) < VISIT_GAP_MS && (!visit || (stored.seen || 0) >= (visit.seen || 0))) visit = stored;
    } catch { /* fall through */ }
  }
  if (visit && now - (visit.seen || now) > VISIT_GAP_MS) {
    // the same tab picked up again after a long pause: a new visit, still credited to where the visitor first came from
    visit = { id: newId(), attribution: { ...visit.attribution, landing: window.location.pathname }, seen: now };
  }
  if (!visit) visit = { id: newId(), attribution: readAttribution(), seen: now };
  visit.seen = now;
  if (consent) { try { localStorage.setItem(VISIT_KEY, JSON.stringify(visit)); } catch { /* storage unavailable */ } }
  return visit;
}

/** The server may answer with the number the visit already has (another tab, or pages opened before cookies were accepted). */
function adopt(id, sentAs) {
  if (!id || !visit || visit.id !== sentAs || id === sentAs) return;
  visit.id = id;
  if (hasConsent()) { try { localStorage.setItem(VISIT_KEY, JSON.stringify(visit)); } catch { /* storage unavailable */ } }
}

/** The owner signed in as admin, automated browsers and crawlers, and copies of the site being worked on
 *  (anything not on our own domain) are not visitors. A check script can opt back in by setting
 *  localStorage "ssp_track_test" = "1". */
const isStaffOrRobot = () => {
  try {
    if (localStorage.getItem(TEST_KEY) === '1') return false;
    if (navigator.webdriver || ROBOT.test(navigator.userAgent)) return true;
    if (!SITE.test(window.location.hostname)) return true;
    return JSON.parse(localStorage.getItem('ssp_user') || 'null')?.role === 'admin';
  } catch { return false; }
};

const isSignedIn = () => {
  try { return !!localStorage.getItem('ssp_token'); } catch { return false; }
};

function getVisitorId() {
  if (!hasConsent()) return null;
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) { id = newId(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch { return null; }
}

function send(body, sentAs, leaving) {
  if (leaving && navigator.sendBeacon) {
    try { if (navigator.sendBeacon(ENDPOINT, body)) return; } catch { /* fall back to fetch */ }
  }
  // keepalive lets the request finish even if the page is being closed
  fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body, keepalive: true })
    .then(r => (r.ok ? r.json() : null))
    .then(d => { if (d && d.visit) adopt(d.visit, sentAs); })
    .catch(() => {});
}

function flush(leaving = false) {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return;
  const v = getVisit();
  const events = queue.splice(0, MAX_BATCH).map(({ t, ...e }) => ({ ...e, ts: t }));
  sentOnce = true;
  send(JSON.stringify({
    visit_id: v.id,
    visitor_id: getVisitorId(),
    signed_in: isSignedIn(),
    device: window.innerWidth < 768 ? 'phone' : 'desktop',
    attribution: v.attribution,
    sent: Date.now(),
    events,
  }), v.id, leaving);
  if (queue.length) { if (leaving) flush(true); else timer = setTimeout(flush, FLUSH_MS); }
}

function schedule() {
  if (!timer) timer = setTimeout(flush, sentOnce ? FLUSH_MS : FIRST_FLUSH_MS);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener('pagehide', () => { pageHidden(); flush(true); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { pageHidden(); flush(true); } else pageShown();
  });
}

const allowed = () => !window.location.pathname.startsWith('/admin') && !isStaffOrRobot();   // staff screens are not visits

function enqueue(name, props, items, path) {
  if (!allowed()) return;
  getVisit();
  listen();
  queue.push({ name, path, props, items, t: Date.now() });
  if (queue.length >= MAX_BATCH) flush();
  else schedule();
}

/** Record one event. `props` are plain values; `items` are [{ id, name, quantity }]. */
export function record(name, props = {}, items = []) {
  if (typeof window === 'undefined') return;
  if (document.prerendering) {
    // the browser is loading the page ahead of time; nobody has seen it yet
    document.addEventListener('prerenderingchange', () => record(name, props, items), { once: true });
    return;
  }
  if (name === 'page_view') turnPage();
  enqueue(name, props, items, window.location.pathname);
}

/** Turn a dataLayer object (the shape Google Tag Manager receives) into one of our events. */
export function recordFromDataLayer(obj) {
  if (!obj || !obj.event) return;
  const { event, ecommerce, ...rest } = obj;
  const props = { ...rest };
  let items = [];
  if (ecommerce) {
    for (const k of ['value', 'transaction_id', 'coupon']) if (ecommerce[k] !== undefined && ecommerce[k] !== '') props[k] = ecommerce[k];
    items = (ecommerce.items || []).map(i => ({ id: i.item_id, name: i.item_name, quantity: i.quantity || 1 }));
  }
  delete props.page_location; delete props.page_title; delete props.page_path;
  record(event, props, items);
}

/** A menu search, recorded once the visitor stops typing — once per term per page. */
const searched = new Set();
let searchTimer = null;
export function recordSearch(term) {
  if (typeof window === 'undefined') return;
  if (searchTimer) clearTimeout(searchTimer);
  const q = String(term || '').trim().toLowerCase().slice(0, 60);
  if (q.length < 2) return;
  searchTimer = setTimeout(() => {
    const key = `${window.location.pathname}|${q}`;
    if (searched.has(key)) return;
    searched.add(key);
    record('search', { term: q });
  }, 1200);
}

// ── Everything a visitor does, captured without each screen having to ask ─────────────

/** Keep labels short and free of anything that could identify a person. */
function tidy(text, max = 60) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[^\s@]+@[^\s@]+/g, '[email]')
    .replace(/\d[\d\s-]{5,}\d/g, '[number]')
    .trim()
    .slice(0, max);
}

function areaOf(el) {
  if (el.closest('[role="dialog"], [aria-modal="true"]')) return 'pop-up';
  if (el.closest('header')) return 'header';
  if (el.closest('footer')) return 'footer';
  if (el.closest('nav')) return 'menu bar';
  return 'page';
}

// ── Reading: how long each page is actually on screen, and how far down it is read ──────
// One record per page view (identified by `view`), sent when the page is hidden and again, with more seconds, if
// the visitor comes back and reads on; the server keeps the last. Time with the tab in the background does not count.
let page = null;   // { path, view, since, ms, maxY, total, marks, told }

function startPage() {
  page = { path: window.location.pathname, view: newId().slice(0, 8), since: document.visibilityState === 'hidden' ? null : Date.now(),
           ms: 0, maxY: 0, total: 0, marks: new Set(), told: 0 };
  measure();
}
function measure() {
  page.total = document.documentElement.scrollHeight - window.innerHeight;
  page.maxY = Math.max(page.maxY, window.scrollY);
}
const percent = () => (page.total > 0 ? Math.min(100, Math.round((page.maxY / page.total) * 100)) : 100);
const onScreenMs = () => page.ms + (page.since ? Date.now() - page.since : 0);

function reportPage() {
  if (!page) return;
  const seconds = Math.min(Math.round(onScreenMs() / 1000), 3600);
  if (seconds < 1 || seconds === page.told) return;
  page.told = seconds;
  if (window.location.pathname === page.path) measure();
  enqueue('page_leave', { seconds, percent: percent(), view: page.view }, [], page.path);
}
function turnPage() {
  if (!page) { startPage(); return; }
  if (window.location.pathname === page.path) return;
  reportPage();
  startPage();
}
function pageHidden() {
  if (!page) return;
  reportPage();
  if (page.since) { page.ms += Date.now() - page.since; page.since = null; }
}
function pageShown() {
  if (page && !page.since) page.since = Date.now();
}

let capturing = false;
const MEANT_TO_REPEAT = /^\s*(increase|decrease|one more|one less|next|previous)\b/i;   // buttons made to be tapped several times

/** Start once per page load: taps and clicks, form submissions, scroll depth, time on page, script errors. */
export function startAutoCapture() {
  if (capturing || typeof window === 'undefined') return;
  capturing = true;
  startPage();

  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target.closest('a, button, [role="button"], summary') : null;
    if (!el || el.closest('[data-notrack]')) return;
    // Named controls first. Free text is only used when short: long text is a card or a row
    // (an address, an order) and could hold personal details.
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const testId = (el.getAttribute('data-testid') || '').replace(/[-_]+/g, ' ').replace(/\b(btn|button|cta)\b/gi, '').trim();
    const label = tidy(el.getAttribute('data-track-label') || el.getAttribute('aria-label') || (text.length <= 50 ? text : '')
      || el.getAttribute('title') || testId || (el.tagName === 'A' ? 'Unnamed link' : 'Unnamed button'));
    const href = el.tagName === 'A' ? (el.getAttribute('href') || '') : '';
    const props = { label, area: areaOf(el) };
    if (href.startsWith('tel:')) props.href = 'phone call';
    else if (href.startsWith('mailto:')) props.href = 'email';
    else if (/wa\.me|whatsapp/i.test(href)) props.href = 'WhatsApp';
    else if (/^https?:/i.test(href) && !href.includes(window.location.hostname)) { try { props.href = new URL(href).hostname; } catch { /* ignore */ } }
    else if (href) props.href = href.split('?')[0].slice(0, 120);
    record('click', props);
  }, { capture: true, passive: true });

  // Which field someone was on — the field's name only, never what was typed. Search boxes have their own record.
  const fieldsSeen = new Set();
  document.addEventListener('focusin', (e) => {
    const el = e.target instanceof Element ? e.target.closest('input, select, textarea') : null;
    if (!el || el.closest('[data-notrack]') || el.type === 'hidden' || el.type === 'search') return;
    if (/search/i.test(`${el.getAttribute('aria-label') || ''} ${el.getAttribute('placeholder') || ''} ${el.getAttribute('name') || ''}`)) return;
    const id = el.getAttribute('id');
    const labelEl = (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest('label')
      || el.parentElement?.querySelector('label') || el.parentElement?.parentElement?.querySelector('label');
    // A real label first; then the kind of field; a placeholder is the last resort because it is usually an example value
    const byType = { email: 'Email', tel: 'Phone number', password: 'Password', date: 'Date', number: 'Number' }[el.type];
    const name = tidy(el.getAttribute('aria-label') || labelEl?.textContent || byType || el.getAttribute('name') || el.getAttribute('placeholder') || 'Field', 40);
    const key = `${window.location.pathname}|${name}`;
    if (fieldsSeen.has(key)) return;
    fieldsSeen.add(key);
    const form = el.closest('form, [role="dialog"], section, main');
    const heading = form?.querySelector('h1, h2, h3') || el.closest('[role="dialog"], section, main')?.querySelector('h1, h2, h3');
    record('field_focus', { label: name, area: tidy(form?.getAttribute('aria-label') || heading?.textContent || areaOf(el), 40) });
  }, { capture: true, passive: true });

  // Three taps on the same thing within two seconds: it looks broken, or the page is slow
  let lastTap = { el: null, times: [] };
  const tapsReported = new WeakSet();
  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? (e.target.closest('a, button, [role="button"]') || e.target) : null;
    if (!el || el.closest('[data-notrack]')) return;
    const now = Date.now();
    lastTap = lastTap.el === el ? { el, times: [...lastTap.times.filter(t => now - t < 2000), now] } : { el, times: [now] };
    if (lastTap.times.length >= 3 && !tapsReported.has(el)) {
      tapsReported.add(el);
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const label = tidy(el.getAttribute('aria-label') || (text.length <= 50 ? text : '') || `(${el.tagName.toLowerCase()})`);
      if (MEANT_TO_REPEAT.test(label) || el.closest('[data-repeat-ok]')) return;
      record('repeated_taps', { label, area: areaOf(el) });
    }
  }, { capture: true, passive: true });

  document.addEventListener('submit', (e) => {
    const f = e.target instanceof HTMLFormElement ? e.target : null;
    if (!f || f.closest('[data-notrack]')) return;
    const heading = f.closest('section, [role="dialog"], main')?.querySelector('h1, h2, h3');
    record('form_submit', { label: tidy(f.getAttribute('aria-label') || f.getAttribute('name') || f.id || heading?.textContent || 'form'), area: areaOf(f) });
  }, { capture: true, passive: true });

  // How far down each page people get
  window.addEventListener('scroll', () => {
    turnPage();
    measure();
    for (const mark of [50, 90]) if (percent() >= mark && !page.marks.has(mark) && page.maxY > 0) { page.marks.add(mark); record('scroll_depth', { percent: mark }); }
  }, { passive: true });

  window.addEventListener('error', (e) => { record('site_error', { message: tidy(e.message, 120) }); });
  window.addEventListener('unhandledrejection', (e) => { record('site_error', { message: tidy(e.reason?.message || e.reason, 120) }); });
}

// Server calls → business events. [method, path pattern, event on success]; a failure records "<event>_failed".
const API_EVENTS = [
  ['post', /^\/auth\/login$/, 'login'],
  ['post', /^\/auth\/google$/, 'login'],
  ['post', /^\/auth\/(register|google\/complete)$/, 'sign_up'],
  ['post', /^\/auth\/forgot-password$/, 'password_reset_requested'],
  ['post', /^\/auth\/reset-password$/, 'password_reset_done'],
  ['put', /^\/auth\/me$/, 'profile_updated'],
  ['post', /^\/auth\/addresses$/, 'address_saved'],
  ['put', /^\/auth\/addresses\//, 'address_saved'],
  ['delete', /^\/auth\/addresses\//, 'address_deleted'],
  ['post', /^\/delivery\/check$/, 'postcode_checked'],
  ['post', /^\/payments\/create-intent$/, 'payment_started'],
  ['post', /^\/orders$/, 'order_placed'],
  ['delete', /^\/orders\//, 'order_cancelled'],
  ['post', /^\/subscriptions\/quote$/, 'plan_priced'],
  ['post', /^\/subscriptions$/, 'plan_purchased'],
  ['post', /^\/subscriptions\/.+\/skip$/, 'meal_skipped'],
  ['post', /^\/reviews\/.+\/submit$/, 'review_submitted'],
  ['post', /^\/reviews\/.+\/dismiss$/, 'review_dismissed'],
  ['post', /^\/menu\/.+\/reviews$/, 'review_submitted'],
  ['post', /^\/menu\/.+\/like$/, 'dish_liked'],
  ['post', /^\/menu\/.+\/notify-restock$/, 'restock_alert_requested'],
  ['post', /^\/loyalty\/redeem$/, 'loyalty_redeemed'],
  ['post', /^\/push\/subscribe$/, 'notifications_enabled'],
  ['post', /^\/kitchen-status\/notify-me$/, 'reopen_alert_requested'],
  ['post', /^\/enquiries\/.+\/reply$/, 'enquiry_reply'],
];
const couponSeen = new Set();

/** Called by the API client after every request. Never throws. */
export function recordApi(method, url, status, requestData, responseData) {
  try {
    if (typeof window === 'undefined' || !url) return;
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '').split('?')[0];
    const m = String(method || 'get').toLowerCase();
    const ok = status >= 200 && status < 300;
    let req = requestData;
    if (typeof req === 'string') { try { req = JSON.parse(req); } catch { req = null; } }

    if (m === 'post' && path === '/orders/calculate' && ok && req?.coupon_code) {
      const outcome = responseData?.coupon_error ? 'coupon_failed' : (responseData?.coupon_discount > 0 ? 'coupon_applied' : null);
      const key = `${outcome}:${req.coupon_code}`;
      if (outcome && !couponSeen.has(key)) {
        couponSeen.add(key);
        record(outcome, { coupon: tidy(req.coupon_code, 30), ...(responseData.coupon_error ? { reason: tidy(responseData.coupon_error, 100) } : { value: responseData.coupon_discount }) });
      }
      return;
    }
    const hit = API_EVENTS.find(([mm, re]) => mm === m && re.test(path));
    if (!hit) return;
    // paying for a meal plan and paying for an order are told apart by `method`
    const props = hit[2] === 'payment_started' ? { value: req?.amount, method: req?.purpose } : {};
    if (ok) {
      if (hit[2] === 'order_placed' || hit[2] === 'plan_purchased') return;
      record(hit[2], props);
    } else if (status) {
      const detail = responseData?.detail;
      record(`${hit[2]}_failed`, { ...props, status, reason: tidy(typeof detail === 'string' ? detail : 'error', 100) });
    }
  } catch { /* tracking must never break the site */ }
}
