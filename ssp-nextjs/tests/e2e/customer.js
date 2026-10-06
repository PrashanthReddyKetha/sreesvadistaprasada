// Customer and admin journeys on the built site against the full local backend (tests/e2e/local_backend.py).
// Everything that needs no card payment: browse, basket to checkout, sign in, an enquiry answered by the owner,
// the Dabba Wala steps up to payment, pausing and reopening the kitchen with its confirmation, the health panel.
// Fails (exit 1) when a step does not behave as a customer or the owner would expect.
//
//   node customer.js [site url]       site: http://localhost:3001 (built with NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8765)
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:3001';
const LOCAL = 'http://127.0.0.1:8765';
const ADMIN = { email: 'owner@test.example', password: 'Test-Admin-Pass-1' };
const CUSTOMER = { name: 'Asha Rao', email: 'asha.rao@test.example', password: 'Customer-Pass-1', phone: '+447700900123' };
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const NOGOOGLE = '--host-resolver-rules=MAP www.googletagmanager.com 0.0.0.0, MAP googletagmanager.com 0.0.0.0, MAP www.google-analytics.com 0.0.0.0, MAP region1.google-analytics.com 0.0.0.0, MAP analytics.google.com 0.0.0.0, MAP stats.g.doubleclick.net 0.0.0.0, MAP js.stripe.com 0.0.0.0';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const TOKEN = `Q${Date.now().toString(36)}`;
const QUESTION = `${TOKEN}: do you cook gongura pachadi on Fridays?`;   // unique per run; lists may shorten the text
const api = async (path, method = 'GET', body) => (await fetch(LOCAL + path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })).json();

const failures = [];
const check = (what, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ' — ' + detail : ''}`); if (!ok) failures.push(what); };
const money = (text) => parseFloat((String(text).match(/£\s*([\d.]+)/) || [])[1] || '0');

async function signIn(page, who) {
  const desktop = page.locator('[data-testid="account-button"]:visible');
  if (await desktop.count()) await desktop.first().click();
  else { await page.locator('[data-testid="mobile-menu-toggle"]').click(); await sleep(400); await page.locator('[data-testid="mobile-account-button"]').click(); }
  await sleep(500);
  const dialog = page.locator('[role="dialog"]').filter({ has: page.locator('input[type="email"]') }).first();
  await dialog.locator('input[type="email"]').first().fill(who.email);
  await dialog.locator('input[type="password"]').first().fill(who.password);
  await dialog.locator('button[type="submit"]').first().click();
  await page.waitForFunction(() => !!localStorage.getItem('ssp_token'), null, { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ args: [NOGOOGLE, `--user-agent=${UA} AuditIP/10.1.0.1`] });
  const desk = await chromium.launch({ args: [NOGOOGLE, `--user-agent=${UA.replace('Mobile ', '').replace('Linux; Android 14; Pixel 8', 'Windows NT 10.0; Win64; x64')} AuditIP/10.1.0.2`] });
  await api('/__reset', 'POST');
  await api('/__seed_customer', 'POST', CUSTOMER);

  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('ssp_cookie_consent', 'denied'); } catch {} });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(String(e).slice(0, 160)));

  // 1 — browse: home, a menu section, a dish page
  await p.goto(BASE + '/', { waitUntil: 'load' });
  check('home page shows a heading', (await p.locator('h1').count()) >= 1);
  await p.goto(BASE + '/breakfast', { waitUntil: 'load' }); await sleep(1500);
  const addButtons = await p.locator('button:visible:has-text("Add")').count();
  check('breakfast menu lists dishes with Add buttons', addButtons >= 3, `${addButtons} buttons`);
  const hrefs = await p.locator('a[href^="/breakfast/"]').evaluateAll(as => as.map(a => a.getAttribute('href')));
  const href = hrefs.find(h => h.split('/').length === 4) || hrefs[0];      // /breakfast/<section>/<dish>
  await p.goto(BASE + href, { waitUntil: 'load' }); await sleep(1000);
  check('a dish page opens with a name and a price', (await p.locator('h1').count()) >= 1 && /£\s*\d/.test(await p.locator('main').innerText()), href);

  // 2 — basket on the order page, then checkout
  await p.goto(BASE + '/order', { waitUntil: 'load' });
  await p.waitForSelector('button:has-text("+ ADD")'); await sleep(800);
  const rows = p.locator('div.flex.items-center.gap-3.py-3').filter({ has: p.locator('button:has-text("+ ADD")') });
  const info = async (row) => ({ name: (await row.locator('span.truncate').first().innerText()).trim(), price: money(await row.locator('span.font-black').first().innerText()) });
  const A = await info(rows.nth(0)), B = await info(rows.nth(1));
  const row = (d) => p.locator('div.flex.items-center.gap-3.py-3').filter({ has: p.getByText(d.name, { exact: true }) }).first();
  const tap = (loc) => loc.evaluate(el => el.click());
  await tap(row(A).locator('button:has-text("+ ADD")')); await sleep(600);
  let qtyA = 1;
  while (qtyA * A.price + B.price < 15.5) { await tap(row(A).locator('button[aria-label="Increase quantity"]')); qtyA++; await sleep(600); }
  await tap(row(B).locator('button:has-text("+ ADD")')); await sleep(800);
  const expected = +(qtyA * A.price + B.price).toFixed(2);
  const bar = await p.locator('button:has-text("Go to Checkout")').innerText().catch(() => '');
  check('the basket bar shows the right count and total', bar.includes(`${qtyA + 1} items`) && Math.abs(money(bar) - expected) < 0.01, `${bar.replace(/\s+/g, ' ')} vs £${expected}`);
  await p.locator('button:has-text("Go to Checkout")').click();
  await p.waitForURL(/\/checkout/, { timeout: 20000 });
  await sleep(2500);
  const checkout = await p.locator('main').innerText();
  check('checkout lists both dishes', checkout.includes(A.name) && checkout.includes(B.name));
  check('checkout shows the subtotal', checkout.includes(`£${expected.toFixed(2)}`), `looking for £${expected.toFixed(2)}`);

  // 3 — sign in as a customer, send an enquiry, see it in the account
  await p.goto(BASE + '/', { waitUntil: 'load' }); await sleep(800);
  await signIn(p, CUSTOMER);
  check('a customer can sign in', !!(await p.evaluate(() => localStorage.getItem('ssp_token'))));
  await p.goto(BASE + '/contact', { waitUntil: 'load' }); await sleep(800);
  const form = p.locator('form').filter({ has: p.locator('textarea') }).first();
  await form.locator('input[type="text"]').first().fill(CUSTOMER.name);
  await form.locator('input[type="email"]').first().fill(CUSTOMER.email);
  await form.locator('textarea').first().fill(QUESTION);
  await form.locator('button[type="submit"]').click(); await sleep(2500);
  const afterSend = await p.locator('main').innerText();
  check('the contact form says the message was sent', /Thank you! We'll get back to you soon/.test(afterSend), afterSend.replace(/\s+/g, ' ').slice(-200));

  // 4 — the owner sees it and replies; the customer sees the reply
  const admin = await desk.newContext({ viewport: { width: 1366, height: 900 } });
  await admin.addInitScript(() => { try { localStorage.setItem('ssp_cookie_consent', 'denied'); } catch {} });
  const a = await admin.newPage();
  await a.goto(BASE + '/', { waitUntil: 'load' }); await sleep(800);
  await signIn(a, ADMIN);
  await a.goto(BASE + '/admin', { waitUntil: 'load' }); await sleep(2500);
  await a.locator('button:has-text("Overview")').first().click(); await sleep(3000);
  const overview = await a.locator('body').innerText();
  check('admin Overview shows the health panel', /Everything is working|need(s)? a look|Checking that everything/.test(overview));
  await a.locator('button:has-text("Enquiries")').first().click(); await sleep(1500);
  const inbox = a.getByText(TOKEN, { exact: false }).first();
  check('the owner sees the enquiry in Enquiries', (await inbox.count()) > 0);
  await inbox.click().catch(() => {}); await sleep(1000);
  await a.locator('textarea[placeholder^="Type your reply"]').fill('Yes — every Friday from 11am.');
  await a.locator('textarea[placeholder^="Type your reply"]').press('Enter'); await sleep(2500);
  await p.goto(BASE + '/dashboard', { waitUntil: 'load' }); await sleep(2500);
  await p.locator('button:has-text("Enquiries")').first().click().catch(() => {}); await sleep(1500);
  const mine = p.getByText(TOKEN, { exact: false }).first();
  await mine.waitFor({ timeout: 10000 }).catch(() => {});
  await mine.click().catch(() => {}); await sleep(2000);
  const dash = await p.locator('main').innerText();
  check('the customer sees the owner\'s reply in their account', dash.includes('every Friday from 11am'), dash.slice(0, 160).replace(/\s+/g, ' '));

  // 5 — Dabba Wala: choose a plan, a box, a week, give delivery details with a postcode check, reach the confirmation step
  await p.goto(BASE + '/subscriptions', { waitUntil: 'load' }); await sleep(2000);
  const planButton = p.locator('button').filter({ hasText: /per meal/i }).first();
  check('the plan page offers plans', (await planButton.count()) > 0);
  const next = () => p.getByRole('button', { name: /^Next$/ }).last();     // not "Next week"
  const stepText = async () => (await p.locator('main').innerText()).replace(/\s+/g, ' ');
  await planButton.click(); await sleep(400); await next().click(); await sleep(900);                  // 1 plan
  const box = p.locator('div.cursor-pointer').filter({ hasText: /veg/i }).first();
  await box.click(); await sleep(400); await next().click(); await sleep(900);                          // 2 box
  check('the menu / start-week step is reached', /week|menu/i.test(await stepText()));
  if (await next().isEnabled()) { await next().click(); await sleep(900); }                           // 3 week (pre-chosen)
  await next().click().catch(() => {}); await sleep(900);                                              // 4 preferences
  const details = await stepText();
  check('the details step is reached with the signed-in customer filled in', /Address Line 1/i.test(details) && details.includes(CUSTOMER.email), details.slice(0, 120));
  await p.locator('input[placeholder="12 Curry Lane"]').fill('5 Greenleys Lane');
  await p.locator('input[placeholder="Milton Keynes"]').fill('Milton Keynes');
  await p.locator('input[placeholder="MK9 1AB"]').fill('MK12 6LF'); await sleep(2500);
  const afterPostcode = await stepText();
  check('the postcode is checked and the delivery choices appear', /If you are not home/i.test(afterPostcode), afterPostcode.slice(-200));
  await p.locator('button').filter({ hasText: /Leave at my door/ }).first().click(); await sleep(600);
  check('details complete: Next is enabled', await next().isEnabled());
  await next().click(); await sleep(1500);
  const confirm = await stepText();
  check('the confirmation step shows the plan and a price before any payment', /£\s*\d/.test(confirm) && /confirm|terms|total/i.test(confirm), confirm.slice(0, 160));

  // 6 — the owner pauses the kitchen through the confirmation; customers see it; the owner reopens
  await a.locator('[data-testid="kitchen-toggle"]').click(); await sleep(500);
  check('closing the kitchen asks first and says what will happen', (await a.locator('[role="dialog"]:has-text("Close the kitchen?")').count()) > 0);
  await a.locator('button:has-text("Yes, close it")').click(); await sleep(2500);
  await p.goto(BASE + '/order', { waitUntil: 'load' }); await sleep(2500);
  check('customers see the kitchen is closed', (await p.locator('[data-testid="kitchen-closed-bar"]').count()) > 0 || /kitchen (is )?closed/i.test(await p.locator('body').innerText()));
  await a.locator('[data-testid="kitchen-toggle"]').click(); await sleep(500);
  await a.locator('button:has-text("Yes, open it")').click(); await sleep(2500);
  await p.reload({ waitUntil: 'load' }); await sleep(2500);
  check('and that it has reopened', (await p.locator('[data-testid="kitchen-closed-bar"]').count()) === 0);
  await a.locator('button:has-text("System log")').first().click(); await sleep(2500);
  const log = await a.locator('main, body').first().innerText();
  check('"What you changed" records the pause and the reopening', /paused ordering/.test(log) && /resumed ordering/.test(log));

  check('no script errors on the customer side', errors.length === 0, errors[0] || '');
  const messages = await api('/__messages');
  check('nothing was really sent (no provider keys): every message logged as not set up', messages.every(m => /not set up|skipped/.test(m.status)), JSON.stringify(messages.slice(0, 2)));

  await browser.close(); await desk.close();
  console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nall customer journeys passed');
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
