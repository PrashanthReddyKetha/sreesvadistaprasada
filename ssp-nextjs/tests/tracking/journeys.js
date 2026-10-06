// The tracking test: scripted visits to the built site, judged by the real events code (tests/e2e/local_backend.py).
// Each visitor is its own browser with a plain browser name, nothing is intercepted and Google is cut off by
// name resolution, so the browser behaves as it does for a real visitor. Fails (exit 1) when what was done
// does not match what was recorded. Found-and-fixed faults from audit A-0002 are pinned here.
//
//   node journeys.js [site url]        site: http://localhost:3001, built with NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8765 against tests/e2e/local_backend.py
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:3001';
const LOCAL = 'http://127.0.0.1:8765';
const PHONE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const DESK_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const NOGOOGLE = '--host-resolver-rules=MAP www.googletagmanager.com 0.0.0.0, MAP googletagmanager.com 0.0.0.0, MAP www.google-analytics.com 0.0.0.0, MAP region1.google-analytics.com 0.0.0.0, MAP analytics.google.com 0.0.0.0, MAP stats.g.doubleclick.net 0.0.0.0';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const api = async (path, method = 'GET') => (await fetch(LOCAL + path, { method })).json();

const failures = [];
const check = (what, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ' — ' + detail : ''}`); if (!ok) failures.push(what); };

async function visitor({ ip, ua = PHONE_UA, consent = null, phone = true }) {
  const browser = await chromium.launch({ args: [NOGOOGLE, `--user-agent=${ua} AuditIP/${ip}`] });
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 800 } : { width: 1280, height: 800 } });
  await ctx.addInitScript((c) => { try { localStorage.setItem('ssp_track_test', '1'); if (c) localStorage.setItem('ssp_cookie_consent', c); } catch {} }, consent);
  return { browser, ctx };
}
const done = async (v, ...pages) => { for (const p of pages) await p.close({ runBeforeUnload: true }).catch(() => {}); await sleep(1500); await v.browser.close(); };
const visitsOf = (dump) => { const m = {}; for (const e of dump) (m[e.visit_id] ||= []).push(e); return Object.values(m); };
const has = (evs, name, path) => evs.some(e => e.name === name && (!path || e.path === path));

// 1 — the main ordering page; declines cookies; first page left after two seconds
async function orderPage() {
  const v = await visitor({ ip: '10.0.0.1' });
  const p = await v.ctx.newPage();
  await p.goto(BASE + '/?utm_source=tracking-test&utm_medium=print', { waitUntil: 'load' }); await sleep(1500);
  await p.locator('button:has-text("Essential only")').click(); await sleep(600);
  await p.goto(BASE + '/order', { waitUntil: 'load' });
  await p.waitForSelector('button:has-text("+ ADD")'); await sleep(1000);
  const rows = p.locator('div.flex.items-center.gap-3.py-3').filter({ has: p.locator('button:has-text("+ ADD")') });
  const info = async (row) => ({ name: (await row.locator('span.truncate').first().innerText()).trim(), price: parseFloat((await row.locator('span.font-black').first().innerText()).replace('£', '')) });
  const A = await info(rows.nth(0)), B = await info(rows.nth(1));
  const row = (d) => p.locator('div.flex.items-center.gap-3.py-3').filter({ has: p.getByText(d.name, { exact: true }) }).first();
  const tap = (loc) => loc.evaluate(el => el.click());          // on the element itself: fixed bars cover rows on a phone
  await tap(row(A).locator('button.flex-1')); await sleep(700);  // opens the dish sheet
  await p.locator('button[aria-label="Close"]').click(); await sleep(700);
  await tap(row(A).locator('button:has-text("+ ADD")')); await sleep(900);
  let qtyA = 1;
  while (qtyA < 3 || qtyA * A.price < 15.5) { await tap(row(A).locator('button[aria-label="Increase quantity"]')); qtyA++; await sleep(900); }
  await tap(row(B).locator('button:has-text("+ ADD")')); await sleep(900);
  await tap(row(B).locator('button[aria-label="Decrease quantity"]')); await sleep(900);
  await p.locator('input[placeholder="Search dishes…"]').fill('dosa'); await sleep(1800);
  await p.locator('button:has-text("Go to Checkout")').click();
  await p.waitForURL(/\/checkout/, { timeout: 20000 }).catch(() => {}); await sleep(5000);
  await done(v, p);
  return { A: { ...A, qty: qtyA }, B };
}

// 2 — accepts cookies part-way, then a refresh and a second tab
async function consentMidway() {
  const v = await visitor({ ip: '10.0.0.2' });
  const p = await v.ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'load', referer: 'https://www.google.com/' }); await sleep(5500);
  await p.locator('button:has-text("Accept all")').click(); await sleep(1000);
  await p.goto(BASE + '/story', { waitUntil: 'load' }); await sleep(5000);
  await p.reload({ waitUntil: 'load' }); await sleep(5000);
  const p2 = await v.ctx.newPage();
  await p2.goto(BASE + '/faq', { waitUntil: 'load' }); await sleep(5500);
  await done(v, p2, p);
}

// 3 — cookies accepted; the same tab used again after 45 minutes
async function longPause() {
  const v = await visitor({ ip: '10.0.0.3', consent: 'granted' });
  const p = await v.ctx.newPage();
  await p.goto(BASE + '/gallery', { waitUntil: 'load' }); await sleep(5500);
  await api('/__age?minutes=45', 'POST');
  await p.goto(BASE + '/terms', { waitUntil: 'load' }); await sleep(5500);
  await done(v, p);
}

// 4 — a search engine's crawler that runs scripts
async function crawler() {
  const v = await visitor({ ip: '66.249.66.1', ua: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' });
  const p = await v.ctx.newPage();
  await p.goto(BASE + '/catering', { waitUntil: 'load' }); await sleep(5500);
  await done(v, p);
}

// 5 — tab in the background: 2s reading, 8s away, 1s reading, then on to another page
async function backgroundTab() {
  const v = await visitor({ ip: '10.0.0.6', phone: false, ua: DESK_UA });
  const p = await v.ctx.newPage();
  await p.goto(BASE + '/delivery', { waitUntil: 'load' }); await sleep(2000);
  const setVis = (s) => p.evaluate((s) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => s === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); }, s);
  await setVis('hidden'); await sleep(8000); await setVis('visible'); await sleep(1000);
  await p.goto(BASE + '/terms', { waitUntil: 'load' }); await sleep(6000);
  await done(v, p);
}

// 6 — basket drawer: add on a menu page, + twice and − once in the drawer
async function drawer() {
  const v = await visitor({ ip: '10.0.0.7', phone: false, ua: DESK_UA });
  const p = await v.ctx.newPage();
  await p.goto(BASE + '/breakfast', { waitUntil: 'load' }); await sleep(2500);
  await p.locator('button:has-text("Essential only")').click(); await sleep(400);
  await p.locator('button:visible:has-text("Add")').first().click(); await sleep(1200);
  await p.locator('[data-testid="cart-button"]:visible').first().click(); await sleep(1500);
  const more = p.locator('button[aria-label^="One more"]').first(), less = p.locator('button[aria-label^="One less"]').first();
  const dish = ((await more.getAttribute('aria-label')) || '').replace('One more ', '');
  await more.click(); await sleep(900); await more.click(); await sleep(900); await less.click(); await sleep(5000);
  await done(v, p);
  return dish;
}

// 7 — a quick look from Pinterest: arrives, leaves after 1.5 seconds for another site
async function bounce() {
  const v = await visitor({ ip: '10.0.0.8' });
  const p = await v.ctx.newPage();
  await p.goto(BASE + '/story', { waitUntil: 'load', referer: 'https://www.pinterest.com/' }); await sleep(1500);
  await p.goto(LOCAL + '/__dump', { waitUntil: 'commit' }); await sleep(2500);
  await done(v, p);
}

(async () => {
  await api('/__reset', 'POST');
  const order = await orderPage(); await consentMidway(); await longPause(); await crawler(); await backgroundTab(); const dish = await drawer(); await bounce();
  const dump = await api('/__dump'); const r = await api('/__report?days=2'); const visits = visitsOf(dump);

  // order page
  const ov = visits.find(evs => evs.some(e => e.source === 'tracking-test'));
  check('order page: one visit from arrival to checkout, credited to the campaign tag', !!ov && ov[0].landing === '/' && has(ov, 'page_view', '/order') && has(ov, 'page_view', '/checkout'));
  const ranking = Object.fromEntries((r.dish_ranking || []).map(d => [d.name, d]));
  check(`order page: dish A opened once and added ${order.A.qty}`, ranking[order.A.name]?.opened === 1 && ranking[order.A.name]?.added === order.A.qty, JSON.stringify(ranking[order.A.name]));
  check('order page: dish B added once and taken back out', (r.removals || []).some(x => x.name === order.B.name && x.removed === 1 && x.added === 1), JSON.stringify(r.removals));
  check('order page: search recorded', (r.searches || []).some(s => s.name === 'dosa'), JSON.stringify(r.searches));
  check('order page: checkout started', ov && has(ov, 'begin_checkout'));
  check('order page: quantity buttons are not "repeated taps"; the search box is not a form field', (r.repeated_taps || []).length === 0 && (r.field_drop_off || []).every(f => !/search/i.test(f.last_field)));

  // sittings
  const google = visits.filter(evs => evs[0].referrer === 'www.google.com');
  check('accepting cookies part-way, a refresh and a second tab: still one visit', google.length === 1 && has(google[0], 'page_view', '/faq'), `${google.length} visits`);
  check('…labelled a first visit, not "cookies not accepted"', (r.visitor_funnels || []).some(f => f.name === 'First visit' && f.visits >= 1));
  const pause = visits.filter(evs => evs.some(e => e.path === '/gallery') || evs.some(e => e.path === '/terms' && e.visitor_id));
  check('a 45-minute pause starts a new visit', pause.length === 2, `${pause.length} visits`);
  check('the second of them counts as a returning visitor', (r.visitor_funnels || []).some(f => f.name === 'Returning visitor' && f.visits === 1));
  check('a crawler is not a visitor', !visits.some(evs => evs.some(e => e.path === '/catering')));

  // reading time
  const stay = (r.time_on_page || []).find(t => t.page === '/delivery');
  check('time on a page counts on-screen time only (2s + 1s, not 11s)', !!stay && stay.average_seconds >= 2 && stay.average_seconds <= 5, JSON.stringify(stay));

  // drawer
  check(`drawer: "${dish}" added three times, removed once`, ranking[dish]?.added === 3 && (r.removals || []).some(x => x.name === dish && x.removed === 1), JSON.stringify(ranking[dish]));

  // the bounce and the source name
  const pin = visits.find(evs => evs[0].referrer === 'www.pinterest.com');
  check('a 1.5-second look that leaves for another site is still recorded', !!pin && has(pin, 'page_view', '/story'));
  check('Pinterest is named as the source', (r.sources || []).some(s => s.source === 'Pinterest'), (r.sources || []).map(s => s.source).join(', '));

  console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nall tracking checks passed');
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
