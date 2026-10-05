/**
 * Our own record of visits and events, sent to our backend (POST /api/events) —
 * independent of Google. Shown in Admin › Analytics.
 *
 * Privacy:
 * - No name, email, phone or address is ever sent.
 * - Unless the visitor pressed "Accept all" on the cookie banner, nothing is stored
 *   on their device: the visit id lives in memory only and ends with the page.
 * - With consent, the visit id is kept for the browser session and a visitor id is
 *   kept so a returning visitor can be recognised.
 */

const ENDPOINT = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com') + '/api/events';
const CONSENT_KEY = 'ssp_cookie_consent';
const VISIT_KEY = 'ssp_visit';
const VISITOR_KEY = 'ssp_visitor';
const FLUSH_MS = 4000;
const MAX_BATCH = 25;

let visit = null;      // { id, attribution }
let queue = [];
let timer = null;
let listening = false;

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
  if (visit) return visit;
  const consent = hasConsent();
  if (consent) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(VISIT_KEY) || 'null');
      if (stored && stored.id) { visit = stored; return visit; }
    } catch { /* fall through to a new visit */ }
  }
  visit = { id: newId(), attribution: readAttribution() };
  if (consent) { try { sessionStorage.setItem(VISIT_KEY, JSON.stringify(visit)); } catch { /* storage unavailable */ } }
  return visit;
}

/** The owner signed in as admin, and automated browsers (monitoring, crawlers, our own checks), are not customers.
 *  A check script can opt back in by setting localStorage "ssp_track_test" = "1". */
const isStaffOrRobot = () => {
  try {
    if (localStorage.getItem('ssp_track_test') === '1') return false;
    if (navigator.webdriver) return true;
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

function flush() {
  timer = null;
  if (!queue.length) return;
  const v = getVisit();
  const events = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({
    visit_id: v.id,
    visitor_id: getVisitorId(),
    signed_in: isSignedIn(),
    device: window.innerWidth < 768 ? 'phone' : 'desktop',
    attribution: v.attribution,
    events,
  });
  // keepalive lets the request finish even if the page is being closed
  fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  if (queue.length) timer = setTimeout(flush, FLUSH_MS);
}

/** Record one event. `props` are plain values; `items` are [{ id, name, quantity }]. */
export function record(name, props = {}, items = []) {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return;           // staff screens are not visits
  if (isStaffOrRobot()) return;                    // nor is the owner browsing, or an automated browser
  getVisit();
  queue.push({ name, path, props, items });
  if (!listening) {
    listening = true;
    const now = () => { if (timer) clearTimeout(timer); flush(); };
    window.addEventListener('pagehide', now);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') now(); });
  }
  if (queue.length >= MAX_BATCH) { if (timer) clearTimeout(timer); flush(); }
  else if (!timer) timer = setTimeout(flush, FLUSH_MS);
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

let capturing = false;

/** Start once per page load: taps and clicks, form submissions, scroll depth, time on page, script errors. */
export function startAutoCapture() {
  if (capturing || typeof window === 'undefined') return;
  capturing = true;

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

  // Which field someone was on — the field's name only, never what was typed
  const fieldsSeen = new Set();
  document.addEventListener('focusin', (e) => {
    const el = e.target instanceof Element ? e.target.closest('input, select, textarea') : null;
    if (!el || el.closest('[data-notrack]') || el.type === 'hidden') return;
    const id = el.getAttribute('id');
    const labelEl = (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest('label')
      || el.parentElement?.querySelector('label') || el.parentElement?.parentElement?.querySelector('label');
    // A real label first; then the kind of field; a placeholder is the last resort because it is usually an example value
    const byType = { email: 'Email', tel: 'Phone number', password: 'Password', search: 'Search', date: 'Date', number: 'Number' }[el.type];
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
      record('repeated_taps', { label: tidy(el.getAttribute('aria-label') || (text.length <= 50 ? text : '') || `(${el.tagName.toLowerCase()})`), area: areaOf(el) });
    }
  }, { capture: true, passive: true });

  document.addEventListener('submit', (e) => {
    const f = e.target instanceof HTMLFormElement ? e.target : null;
    if (!f || f.closest('[data-notrack]')) return;
    const heading = f.closest('section, [role="dialog"], main')?.querySelector('h1, h2, h3');
    record('form_submit', { label: tidy(f.getAttribute('aria-label') || f.getAttribute('name') || f.id || heading?.textContent || 'form'), area: areaOf(f) });
  }, { capture: true, passive: true });

  // How far down each page people get, and how long they stay
  let path = window.location.pathname, started = Date.now(), deepest = 0, sent = new Set();
  const leave = () => {
    const seconds = Math.round((Date.now() - started) / 1000);
    if (seconds >= 1 && !path.startsWith('/admin')) queue.push({ name: 'page_leave', path, props: { seconds: Math.min(seconds, 3600), percent: deepest }, items: [] });
  };
  const turnPage = () => {
    if (window.location.pathname === path) return;
    leave(); path = window.location.pathname; started = Date.now(); deepest = 0; sent = new Set();
  };
  window.addEventListener('scroll', () => {
    turnPage();
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const now = total > 0 ? Math.min(100, Math.round((window.scrollY / total) * 100)) : 100;
    if (now > deepest) deepest = now;
    for (const mark of [50, 90]) if (deepest >= mark && !sent.has(mark)) { sent.add(mark); record('scroll_depth', { percent: mark }); }
  }, { passive: true });
  document.addEventListener('click', () => setTimeout(turnPage, 800), { passive: true });
  window.addEventListener('pagehide', leave, { capture: true });

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
    if (ok) {
      if (hit[2] === 'order_placed' || hit[2] === 'plan_purchased') return;
      const props = {};
      if (hit[2] === 'payment_started') { props.value = req?.amount; props.method = req?.purpose; }
      record(hit[2], props);
    } else if (status) {
      const detail = responseData?.detail;
      record(`${hit[2]}_failed`, { status, reason: tidy(typeof detail === 'string' ? detail : 'error', 100) });
    }
  } catch { /* tracking must never break the site */ }
}
