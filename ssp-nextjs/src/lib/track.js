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
