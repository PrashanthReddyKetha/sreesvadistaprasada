import { CATEGORIES, CAT, ITEMISED, METHODS, METHOD, UNITS, PER, SUPPLIERS, money, iso, today, dayDate, shortDate, key, newId,
  parseAmount, parseQty, taxYearOf, tyLabel, unitPriceText } from "./util.js";
import { standardize, cleanName } from "./names.js";
import { parseReceipt } from "./parse.js";
import * as store from "./store.js";
import * as api from "./api.js";
import * as reader from "./reader.js";

const VERSION = "1.0.0";
const $ = (id) => document.getElementById(id);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else if (k === "checked") el.checked = !!v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k);
  return el;
}
const opts = (pairs, sel) => pairs.map(([k, l]) => h("option", { value: k, selected: k === sel }, l));
const sum = (xs) => xs.reduce((a, e) => a + (e.amountPence || 0), 0);
const nowIso = () => new Date().toISOString();

// ---- State ----
const TABS = ["overview", "ledger", "prices", "shopping", "more"];
const state = { all: [], expenses: [], period: "month", tab: "overview", grain: "day", cat: "", q: "", pq: "",
  app: { shopping: [], names: {}, suppliers: [], updatedAt: "", dirty: false } };
try {
  const s = JSON.parse(localStorage.getItem("ssp_exp_ui") || "{}");
  Object.assign(state, { period: s.period || state.period, grain: s.grain || state.grain, tab: TABS.includes(s.tab) ? s.tab : state.tab });
} catch {}
if (TABS.includes(location.hash.slice(1))) state.tab = location.hash.slice(1);
const remember = () => { try { localStorage.setItem("ssp_exp_ui", JSON.stringify({ period: state.period, grain: state.grain, tab: state.tab })); } catch {} };

async function loadLocal() {
  state.all = await store.all("expenses");
  state.expenses = state.all.filter((e) => !e.deleted)
    .sort((x, y) => y.date.localeCompare(x.date) || String(y.createdAt).localeCompare(String(x.createdAt)));
  const app = await store.kvGet("app");
  if (app) state.app = { shopping: [], names: {}, suppliers: [], ...app };
}
async function saveApp(change) {
  change(state.app);
  state.app.updatedAt = nowIso(); state.app.dirty = true;
  await store.kvSet("app", state.app);
  render(); syncSoon();
}
const allSuppliers = () => [...new Set([...state.app.suppliers, ...SUPPLIERS, ...state.expenses.map((e) => (e.supplier || "").trim()).filter(Boolean)])];

// ---- Periods ----
function periods() {
  const now = new Date();
  const ym = (d) => iso(d).slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const ty = taxYearOf(today());
  return [
    { key: "week", label: "This week", test: (e) => e.date >= iso(monday) && e.date <= today() },
    { key: "month", label: "This month", test: (e) => e.date.startsWith(ym(now)) },
    { key: "lastmonth", label: lastMonth.toLocaleString("en-GB", { month: "long" }), test: (e) => e.date.startsWith(ym(lastMonth)) },
    { key: "ty", label: `Tax year ${tyLabel(ty)}`, test: (e) => taxYearOf(e.date) === ty },
    { key: "lastty", label: `Tax year ${tyLabel(ty - 1)}`, test: (e) => taxYearOf(e.date) === ty - 1 },
    { key: "all", label: "All time", test: () => true },
  ];
}
const currentPeriod = () => { const P = periods(); return P.find((p) => p.key === state.period) || P[1]; };

// ---- Item purchases (prices and the shopping list) ----
function purchases() {
  const out = [];
  for (const e of state.expenses) for (const it of e.items || []) {
    const u = UNITS[it.unit]; const qty = Number(it.qty);
    if (!u || !(qty > 0) || !(it.pricePence > 0)) continue;
    const std = (it.standard || it.name || "").trim(); if (!std) continue;
    out.push({ k: key(std), std, name: it.name, supplier: (e.supplier || "Unknown supplier").trim(), date: e.date, base: u[1],
      unitPrice: it.pricePence / (qty * u[0]), qty, unit: it.unit, pricePence: it.pricePence });
  }
  return out;
}
function catalogue() {
  const groups = new Map();
  for (const p of purchases()) { if (!groups.has(p.k)) groups.set(p.k, []); groups.get(p.k).push(p); }
  const items = [];
  for (const [k, ps] of groups) {
    ps.sort((a, b) => b.date.localeCompare(a.date));
    const baseCount = {}; for (const p of ps) baseCount[p.base] = (baseCount[p.base] || 0) + 1;
    const base = Object.entries(baseCount).sort((a, b) => b[1] - a[1])[0][0];
    const bySup = new Map();
    for (const p of ps.filter((p) => p.base === base)) { if (!bySup.has(p.supplier)) bySup.set(p.supplier, []); bySup.get(p.supplier).push(p); }
    const suppliers = [...bySup.entries()].map(([s, xs]) => ({ supplier: s, latest: xs[0], count: xs.length,
      change: xs[1] ? (xs[0].unitPrice - xs[1].unitPrice) / xs[1].unitPrice : 0 })).sort((a, b) => a.latest.unitPrice - b.latest.unitPrice);
    items.push({ k, name: ps[0].std, base, suppliers, history: ps, last: ps[0].date, rise: suppliers.filter((s) => s.change >= 0.1) });
  }
  return items.sort((a, b) => (b.rise.length - a.rise.length) || b.last.localeCompare(a.last));
}

// ---- Render ----
function render() {
  const period = currentPeriod();
  const inPeriod = state.expenses.filter(period.test);
  for (const t of TABS) { $("p-" + t).hidden = state.tab !== t; $("tab-" + t).setAttribute("aria-selected", String(state.tab === t)); }
  $("periods").hidden = !["overview", "ledger"].includes(state.tab);
  $("periods").replaceChildren(...periods().map((p) => h("button", { class: "chip", type: "button", "aria-pressed": String(p.key === period.key),
    onclick: () => { state.period = p.key; remember(); render(); } }, p.label)));

  $("tPeriodLbl").textContent = period.label;
  $("tPeriod").textContent = money(sum(inPeriod));
  $("tPeriodNote").textContent = inPeriod.length ? `${inPeriod.length} expense${inPeriod.length === 1 ? "" : "s"}` : "Nothing recorded";
  const ty = taxYearOf(today());
  const tyItems = state.expenses.filter((e) => taxYearOf(e.date) === ty);
  $("tTaxLbl").textContent = `Tax year ${tyLabel(ty)}`;
  $("tTax").textContent = money(sum(tyItems));
  const owed = sum(tyItems.filter((e) => e.method === "personal"));
  $("tTaxNote").textContent = owed ? `${money(owed)} paid personally` : `6 Apr ${ty} – 5 Apr ${ty + 1}`;
  const byCat = {};
  for (const e of inPeriod) byCat[e.category] = (byCat[e.category] || 0) + (e.amountPence || 0);
  const ranked = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  if (ranked.length) { $("tTop").textContent = CAT[ranked[0][0]] || ranked[0][0]; $("tTopNote").textContent = `${money(ranked[0][1])} · ${Math.round((ranked[0][1] / sum(inPeriod)) * 100)}%`; }
  else { $("tTop").textContent = "—"; $("tTopNote").textContent = ""; }

  if (state.tab === "overview") renderOverview(period, inPeriod, ranked);
  if (state.tab === "ledger") renderLedger(inPeriod);
  if (state.tab === "prices") renderPrices();
  if (state.tab === "shopping") renderShopping();
  if (state.tab === "more") renderMore();
  if (!$("catFilter").options.length) $("catFilter").replaceChildren(h("option", { value: "" }, "All categories"), ...opts(CATEGORIES));
  $("suppliers").replaceChildren(...allSuppliers().slice(0, 80).map((s) => h("option", { value: s })));
  $("catalogue").replaceChildren(...catalogue().map((c) => h("option", { value: c.name })));
  renderPill();
}

function barList(el, entries, labelOf, emptyText) {
  const max = entries.length ? entries[0][1] : 1;
  el.replaceChildren(...(entries.length ? entries.map(([k, v], i) => h("div", { class: "bar-row" + (i === 0 ? " top" : "") },
    h("span", { class: "lbl", title: labelOf(k) }, labelOf(k)),
    h("div", { class: "track" }, h("div", { class: "fill", style: `width:${Math.max(2, (v / max) * 100)}%` })),
    h("span", { class: "num" }, money(v)))) : [h("p", { class: "status" }, emptyText)]));
}

function buckets(grain) {
  const now = new Date(); const out = [];
  if (grain === "day") for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i); const s = iso(d);
    out.push({ from: s, to: s, label: i === 0 ? "Today" : d.toLocaleDateString("en-GB", { weekday: "narrow" }) + d.getDate(), title: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) });
  }
  if (grain === "week") {
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    for (let i = 11; i >= 0; i--) {
      const a = new Date(mon); a.setDate(mon.getDate() - 7 * i); const b = new Date(a); b.setDate(a.getDate() + 6);
      out.push({ from: iso(a), to: iso(b), label: `${a.getDate()}/${a.getMonth() + 1}`, title: `Week of ${a.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` });
    }
  }
  if (grain === "month") for (let i = 11; i >= 0; i--) {
    const a = new Date(now.getFullYear(), now.getMonth() - i, 1); const b = new Date(a.getFullYear(), a.getMonth() + 1, 0);
    out.push({ from: iso(a), to: iso(b), label: a.toLocaleDateString("en-GB", { month: "short" }), title: a.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) });
  }
  for (const b of out) b.total = sum(state.expenses.filter((e) => e.date >= b.from && e.date <= b.to));
  return out;
}

function renderOverview(period, inPeriod, ranked) {
  for (const b of $("grain").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.g === state.grain));
  const bs = buckets(state.grain);
  const max = Math.max(1, ...bs.map((b) => b.total));
  const done = bs.slice(0, -1); const avg = done.length ? done.reduce((a, b) => a + b.total, 0) / done.length : 0;
  const cols = bs.map((b, i) => h("div", { class: "col" + (i === bs.length - 1 ? " now" : ""), title: `${b.title}: ${money(b.total)}` },
    h("div", { class: "b" + (b.total ? "" : " zero"), style: `height:${b.total ? Math.max(2, (b.total / max) * 100) : 1.5}%` })));
  if (avg > 0) cols.push(h("div", { class: "avgline", style: `bottom:calc(${avg / max} * (100% - 18px))`, "aria-hidden": "true" }));
  $("trend").replaceChildren(...cols);
  $("trendLabels").replaceChildren(...bs.map((b) => h("span", {}, b.label)));
  const cur = bs[bs.length - 1];
  const best = bs.reduce((a, b) => (b.total > a.total ? b : a), bs[0]);
  $("trendNote").replaceChildren(
    h("span", {}, `${cur.title}: `, h("b", { class: "num" }, money(cur.total))),
    h("span", {}, `Average per ${state.grain}: `, h("b", { class: "num" }, money(avg))),
    best.total ? h("span", {}, `Highest: ${best.title} `, h("b", { class: "num" }, money(best.total))) : null);
  $("catNote").textContent = period.label;
  barList($("bars"), ranked, (k) => CAT[k] || k, "Categories appear here once you add expenses for this period.");
  const bySup = {};
  for (const e of inPeriod) { const s = (e.supplier || "").trim() || "No supplier given"; bySup[s] = (bySup[s] || 0) + (e.amountPence || 0); }
  $("supNote").textContent = period.label;
  barList($("supBars"), Object.entries(bySup).sort((a, b) => b[1] - a[1]).slice(0, 10), (k) => k, "Suppliers appear here once you add expenses for this period.");
}

function renderLedger(inPeriod) {
  const q = key(state.q);
  const shown = inPeriod.filter((e) => (!state.cat || e.category === state.cat) &&
    (!q || key(`${e.supplier || ""} ${e.note || ""} ${(e.items || []).map((i) => i.name + " " + (i.standard || "")).join(" ")}`).includes(q)));
  $("status").textContent = state.expenses.length ? `${state.expenses.length} recorded` : "";
  const list = $("list");
  if (!state.expenses.length) {
    list.replaceChildren(h("div", { class: "empty" }, h("h2", {}, "Your first expense goes here"),
      h("p", {}, "Add each purchase as you make it. Take a photo of the receipt or pick the PDF, and the app reads the shop, the date and every item for you, right here on the phone."),
      h("button", { class: "btn primary", type: "button", onclick: () => openSheet() }, "+ Add your first expense")));
    return;
  }
  if (!shown.length) { list.replaceChildren(h("div", { class: "empty" }, h("p", {}, "No expenses match this period and filter."))); return; }
  const days = new Map();
  for (const e of shown) { if (!days.has(e.date)) days.set(e.date, []); days.get(e.date).push(e); }
  list.replaceChildren(...[...days.entries()].map(([d, xs]) => h("div", { class: "day" },
    h("div", { class: "day-head" }, h("span", {}, dayDate(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })), h("span", { class: "num" }, money(sum(xs)))),
    h("div", { class: "rows" }, ...xs.map((e) => h("button", { class: "row", type: "button", onclick: () => openSheet(e) },
      h("span", { class: "what" }, e.supplier || e.note || CAT[e.category] || "Expense"),
      h("span", { class: "amt" }, money(e.amountPence)),
      h("span", { class: "meta" }, h("span", { class: "tag" }, CAT[e.category] || e.category), METHOD[e.method] || "",
        (e.items || []).length ? h("span", { class: "tag warm" }, `${e.items.length} item${e.items.length === 1 ? "" : "s"}`) : null,
        e.receiptId ? h("span", { class: "tag warm" }, "Receipt") : null,
        e.dirty && api.token() ? h("span", { class: "tag bad" }, "Not synced yet") : null)))))));
}

function renderPrices() {
  const cat = catalogue();
  const q = key(state.pq);
  const shown = cat.filter((c) => !q || c.k.includes(q) || c.history.some((p) => key(p.name).includes(q)));
  const box = $("prices");
  if (!cat.length) {
    box.replaceChildren(h("div", { class: "empty" }, h("h2", {}, "No item prices yet"),
      h("p", {}, "Add a grocery receipt and its items are read automatically. Each item's price per kg or per litre is then compared across every supplier you buy from."),
      h("button", { class: "btn primary", type: "button", onclick: () => openSheet(null, "ingredients") }, "+ Add a grocery receipt")));
    return;
  }
  if (!shown.length) { box.replaceChildren(h("p", { class: "status" }, "No items match.")); return; }
  box.replaceChildren(...shown.map((c) => {
    const best = c.suppliers[0]; const next = c.suppliers[1];
    const saving = next ? Math.round((1 - best.latest.unitPrice / next.latest.unitPrice) * 100) : 0;
    return h("details", { class: "item" },
      h("summary", {},
        h("span", { class: "nm" }, c.name),
        h("span", { class: "best num" }, unitPriceText(best.latest.unitPrice, c.base)),
        h("span", { class: "sub" },
          h("span", {}, c.suppliers.length > 1 ? `Cheapest at ${best.supplier}` : `Only bought at ${best.supplier}`),
          saving > 0 ? h("span", { class: "tag" }, `${saving}% less than ${next.supplier}`) : null,
          ...c.rise.map((r) => h("span", { class: "tag bad" }, `Up ${Math.round(r.change * 100)}% at ${r.supplier}`)),
          h("span", {}, `· last bought ${shortDate(c.last)}`))),
      h("div", { class: "body" },
        h("div", { class: "tbl" }, h("table", {},
          h("thead", {}, h("tr", {}, h("th", {}, "Supplier"), h("th", { class: "r" }, "Latest price"), h("th", { class: "r" }, "Change"), h("th", {}, "Date"))),
          h("tbody", {}, ...c.suppliers.map((s, i) => h("tr", { class: i === 0 && c.suppliers.length > 1 ? "cheapest" : "" },
            h("td", {}, s.supplier), h("td", { class: "r num" }, unitPriceText(s.latest.unitPrice, c.base)),
            h("td", { class: "r num" }, s.count > 1 ? (s.change > 0 ? "+" : "") + Math.round(s.change * 100) + "%" : "—"),
            h("td", {}, shortDate(s.latest.date))))))),
        h("h3", {}, "Purchases"),
        h("div", { class: "tbl" }, h("table", {},
          h("thead", {}, h("tr", {}, h("th", {}, "Date"), h("th", {}, "Supplier"), h("th", {}, "On the receipt"), h("th", { class: "r" }, "Bought"), h("th", { class: "r" }, "Paid"), h("th", { class: "r" }, "Unit price"))),
          h("tbody", {}, ...c.history.slice(0, 12).map((p) => h("tr", {},
            h("td", {}, shortDate(p.date)), h("td", {}, p.supplier), h("td", {}, p.name || ""),
            h("td", { class: "r num" }, `${p.qty} ${p.unit}`), h("td", { class: "r num" }, money(p.pricePence)),
            h("td", { class: "r num" }, unitPriceText(p.unitPrice, p.base)))))))));
  }));
}

function costAt(line, c) {
  const u = UNITS[line.unit]; if (!u || u[1] !== c.base) return null;
  return c.suppliers.map((s) => ({ supplier: s.supplier, pence: Math.round(s.latest.unitPrice * line.qty * u[0]) })).sort((a, b) => a.pence - b.pence);
}
function renderShopping() {
  const cat = new Map(catalogue().map((c) => [c.k, c]));
  if (!$("sUnit").options.length) $("sUnit").replaceChildren(...opts(Object.keys(UNITS).map((u) => [u, u]), "kg"));
  const shop = state.app.shopping;
  const list = $("shopList");
  if (!shop.length) {
    list.replaceChildren(h("div", { class: "empty" }, h("p", {}, "Add what you need for the next shop. Items you have bought before show the cheapest supplier and an estimated cost, and the plan below works out where to go.")));
    $("planPanel").hidden = true; return;
  }
  list.replaceChildren(h("div", { class: "slist" }, ...shop.map((line, i) => {
    const c = cat.get(key(line.item)); const costs = c ? costAt(line, c) : null;
    const where = !c ? "Not bought before — no price yet" : !costs ? `Prices are ${PER[c.base]}; change the unit to compare` :
      costs.length > 1 ? `Cheapest at ${costs[0].supplier}: ${money(costs[0].pence)} · ${costs[1].supplier}: ${money(costs[1].pence)}` : `${costs[0].supplier}: ${money(costs[0].pence)}`;
    return h("div", { class: "sline" + (line.done ? " done" : "") },
      h("input", { type: "checkbox", checked: line.done, "aria-label": "Bought " + line.item, onchange: (ev) => saveApp((a) => { a.shopping[i].done = ev.target.checked; }) }),
      h("span", { class: "nm" }, line.item), h("span", { class: "num muted" }, `${line.qty} ${line.unit}`),
      h("button", { class: "x", type: "button", "aria-label": "Remove " + line.item, onclick: () => saveApp((a) => { a.shopping.splice(i, 1); }) }, "×"),
      h("span", { class: "where" }, where));
  })), h("div", { class: "toolbar", style: "margin-top:8px" },
    h("button", { class: "btn small", type: "button", onclick: () => saveApp((a) => { a.shopping = a.shopping.filter((x) => !x.done); }) }, "Remove ticked items")));

  const open = shop.filter((x) => !x.done);
  const priced = open.map((line) => { const c = cat.get(key(line.item)); return { line, costs: c ? costAt(line, c) : null }; }).filter((x) => x.costs);
  $("planPanel").hidden = !priced.length;
  if (!priced.length) return;
  const split = new Map();
  for (const p of priced) { const b = p.costs[0]; if (!split.has(b.supplier)) split.set(b.supplier, []); split.get(b.supplier).push({ item: p.line.item, pence: b.pence }); }
  const splitTotal = priced.reduce((a, p) => a + p.costs[0].pence, 0);
  const single = [...new Set(priced.flatMap((p) => p.costs.map((c) => c.supplier)))].map((s) => {
    let t = 0, missing = 0;
    for (const p of priced) { const c = p.costs.find((x) => x.supplier === s); if (c) t += c.pence; else missing++; }
    return { s, t, missing };
  }).sort((a, b) => (a.missing - b.missing) || (a.t - b.t));
  const unpriced = open.length - priced.length;
  $("plan").replaceChildren(
    h("div", { class: "tile hero" }, h("span", { class: "eyebrow" }, `Cheapest split · ${split.size} shop${split.size === 1 ? "" : "s"}`),
      h("span", { class: "big num" }, money(splitTotal)),
      ...[...split.entries()].map(([s, xs]) => h("span", { class: "note" }, `${s}: ${xs.map((x) => x.item).join(", ")} (${money(xs.reduce((a, x) => a + x.pence, 0))})`)),
      unpriced ? h("span", { class: "note" }, `${unpriced} item${unpriced === 1 ? "" : "s"} without a price yet`) : null),
    ...single.slice(0, 4).map((x) => h("div", { class: "tile" }, h("span", { class: "eyebrow" }, "All at one shop"), h("h3", {}, x.s),
      h("span", { class: "big num" }, money(x.t)),
      h("span", { class: "note" }, x.missing ? `Missing ${x.missing} item${x.missing === 1 ? "" : "s"} (no price there)` : x.t > splitTotal ? `${money(x.t - splitTotal)} more than the split` : "Same as the cheapest split"))));
}
$("addLine").onsubmit = (ev) => {
  ev.preventDefault();
  const item = $("sItem").value.trim(); const qty = parseQty($("sQty").value);
  if (!item) { $("sItem").focus(); return; }
  if (!qty) { $("shopStatus").textContent = "Enter how much you need, for example 5."; $("sQty").focus(); return; }
  $("shopStatus").textContent = "";
  const unit = $("sUnit").value;
  $("sItem").value = ""; $("sQty").value = ""; $("sItem").focus();
  saveApp((a) => { a.shopping.push({ item, qty, unit, done: false }); });
};
$("sItem").addEventListener("change", () => {
  const c = catalogue().find((x) => x.k === key($("sItem").value));
  if (c) $("sUnit").value = c.base;
});

// ---- More: account, offline reading, suppliers, names, backup ----
function renderMore() {
  const signedIn = !!api.token();
  const unsynced = state.all.filter((e) => e.dirty).length + (state.app.dirty ? 1 : 0);
  $("account").replaceChildren(
    signedIn ? h("p", {}, "Signed in as ", h("b", {}, api.who() || "admin"), ". A copy of everything is kept on the server.") :
      h("p", {}, "Not signed in. Everything is saved on this phone only."),
    h("p", { class: "status" }, lastSync ? `Last synced ${new Date(lastSync).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.` : "Not synced yet.",
      unsynced ? ` ${unsynced} change${unsynced === 1 ? "" : "s"} waiting to be sent.` : ""),
    h("div", { class: "toolbar" },
      signedIn ? h("button", { class: "btn primary", type: "button", onclick: () => sync(true) }, "Sync now") :
        h("button", { class: "btn primary", type: "button", onclick: openSignIn }, "Sign in"),
      signedIn ? h("button", { class: "btn", type: "button", onclick: () => {
        if (unsynced && !confirmSignOut) { confirmSignOut = true; renderMore(); return; }
        api.signOut(); confirmSignOut = false; render();
      } }, confirmSignOut ? `Sign out anyway (${unsynced} unsent)` : "Sign out") : null));
  $("offline").replaceChildren(
    h("p", {}, offlineReady ? "Ready. Receipts are read on this phone, with or without signal." :
      "The reading tools (about 11 MB) download the first time a receipt is read. Download them now on Wi-Fi to read receipts with no signal later."),
    offlineReady ? null : h("button", { class: "btn", type: "button", id: "warmBtn", onclick: warm }, "Download reading tools"));
  $("supList").replaceChildren(...state.app.suppliers.map((s, i) => h("span", { class: "chip" }, s,
    h("button", { class: "x", type: "button", "aria-label": "Remove " + s, onclick: () => saveApp((a) => { a.suppliers.splice(i, 1); }) }, "×"))),
    ...SUPPLIERS.filter((s) => !state.app.suppliers.includes(s)).map((s) => h("span", { class: "chip muted" }, s)));
  const names = Object.entries(state.app.names).sort((a, b) => a[1].localeCompare(b[1]));
  $("namesList").replaceChildren(names.length ? h("div", { class: "names" }, ...names.map(([raw, std]) => h("div", {},
    h("span", {}, h("b", {}, std), h("span", { class: "muted" }, " ← " + raw)),
    h("button", { class: "x", type: "button", "aria-label": "Forget " + raw, onclick: () => saveApp((a) => { delete a.names[raw]; }) }, "×")))) :
    h("p", { class: "status" }, "None yet."));
  $("version").textContent = `Svadista Prasada Expenses ${VERSION} · server ${api.BASE.replace(/^https?:\/\//, "")}`;
}
let confirmSignOut = false;
let offlineReady = false;
try { offlineReady = localStorage.getItem("ssp_exp_offline") === "1"; } catch {}
async function warm() {
  const b = $("warmBtn"); if (b) { b.disabled = true; b.textContent = "Downloading…"; }
  try { await reader.warmUp(); offlineReady = true; try { localStorage.setItem("ssp_exp_offline", "1"); } catch {} }
  catch { if (b) { b.disabled = false; b.textContent = "Download failed — try again"; } return; }
  renderMore();
}
$("supForm").onsubmit = (ev) => {
  ev.preventDefault();
  const s = $("supNew").value.trim().slice(0, 60);
  if (!s || state.app.suppliers.some((x) => key(x) === key(s))) return;
  $("supNew").value = "";
  saveApp((a) => { a.suppliers.push(s); });
};

// ---- Tabs ----
for (const t of document.querySelectorAll(".tab")) t.onclick = () => { state.tab = t.dataset.tab; remember(); render(); };
for (const b of $("grain").querySelectorAll("button")) b.onclick = () => { state.grain = b.dataset.g; remember(); render(); };
$("search").oninput = (ev) => { state.q = ev.target.value; render(); };
$("catFilter").onchange = (ev) => { state.cat = ev.target.value; render(); };
$("priceSearch").oninput = (ev) => { state.pq = ev.target.value; render(); };

// ---- Add / edit sheet ----
let editing = null, pendingFile = null, removeReceipt = false, saving = false, formItems = [], readToken = 0;
$("fCat").replaceChildren(...opts(CATEGORIES)); $("fMethod").replaceChildren(...opts(METHODS));
function formMsg(text, err) { const m = $("formMsg"); m.hidden = !text; m.textContent = text || ""; m.classList.toggle("err", !!err); }
function progress(p) { $("readProgress").hidden = p == null; $("readBar").style.width = `${Math.round((p || 0) * 100)}%`; }

let shownUrl = null;
async function receiptView() {
  const kids = [];
  const r = pendingFile ? { blob: pendingFile.blob, type: pendingFile.type } : (!removeReceipt && editing?.receiptId ? await localFile(editing.receiptId, editing.receiptType) : null);
  if (shownUrl) { URL.revokeObjectURL(shownUrl); shownUrl = null; }
  if (r?.blob) {
    shownUrl = URL.createObjectURL(r.blob);
    if (r.type.startsWith("image/")) kids.push(h("a", { href: shownUrl, target: "_blank", rel: "noopener" }, h("img", { src: shownUrl, alt: "Receipt" })));
    else kids.push(h("a", { href: shownUrl, target: "_blank", rel: "noopener", class: "btn small" }, "Open PDF"));
  } else if (r?.missing) kids.push(h("span", { class: "status" }, "Receipt saved on the server — it opens here when you have signal."));
  kids.push(h("button", { class: "btn small primary", type: "button", onclick: () => $("fCamera").click() }, "Take photo"));
  kids.push(h("button", { class: "btn small", type: "button", onclick: () => $("fFile").click() }, r ? "Choose another file" : "Choose photo or PDF"));
  if (r?.blob) {
    kids.push(h("button", { class: "btn small accent", type: "button", onclick: () => readReceipt(r.blob, r.type) }, "Read again"));
    kids.push(h("button", { class: "btn small", type: "button", onclick: () => { pendingFile = null; removeReceipt = true; receiptView(); } }, "Remove"));
  }
  $("receiptBox").replaceChildren(...kids);
}
async function localFile(id, type) {
  const f = await store.get("files", id);
  if (f) return { blob: f.blob, type: f.type };
  if (api.token() && navigator.onLine) {
    try { const blob = await api.getReceipt(id); await store.put("files", { id, blob, type: blob.type || type, uploaded: true }); return { blob, type: blob.type || type }; } catch {}
  }
  return { missing: true, type };
}

function itemRow(it, i) {
  const upd = (k) => (ev) => { formItems[i][k] = ev.target.value; if (k === "standard") formItems[i].touched = true; itemsTotal(); };
  return h("div", { class: "irow" },
    h("input", { class: "i-name", value: it.name || "", placeholder: "Item as on the receipt", "aria-label": "Item name", oninput: upd("name") }),
    h("input", { class: "i-std", value: it.standard || "", placeholder: "Compare as (e.g. Toor dal)", list: "catalogue", "aria-label": "Compare as", oninput: upd("standard") }),
    h("input", { value: it.qty ?? "", placeholder: "Qty", inputmode: "decimal", "aria-label": "Quantity", oninput: upd("qty") }),
    h("select", { "aria-label": "Unit", onchange: upd("unit") }, ...opts(Object.keys(UNITS).map((u) => [u, u]), it.unit || "kg")),
    h("input", { value: it.price ?? "", placeholder: "£", inputmode: "decimal", "aria-label": "Line price in pounds", oninput: upd("price") }),
    h("button", { class: "x", type: "button", "aria-label": "Remove item", onclick: () => { formItems.splice(i, 1); renderItems(); } }, "×"));
}
function renderItems() {
  const head = formItems.length ? h("div", { class: "irow head" }, h("span", {}, "On receipt"), h("span", {}, "Compare as"), h("span", {}, "Qty"), h("span", {}, "Unit"), h("span", {}, "Price £"), h("span", {})) : null;
  $("irows").replaceChildren(...[head, ...formItems.map(itemRow)].filter(Boolean));
  itemsTotal();
}
function itemsTotal() {
  const t = formItems.reduce((a, it) => a + (parseAmount(it.price, true) || 0), 0);
  const amt = parseAmount($("fAmount").value);
  if (!formItems.length) { $("itotal").textContent = ""; $("useTotalBtn").hidden = true; return; }
  $("itotal").textContent = `Items add up to ${money(t)}` + (amt != null && amt !== t ? ` · ${money(Math.abs(amt - t))} ${amt > t ? "more paid (delivery, bags?)" : "less paid (vouchers, discounts?)"}` : "");
  $("useTotalBtn").hidden = !t || amt === t;
}
$("fAmount").addEventListener("input", itemsTotal);
$("addItemBtn").onclick = () => { formItems.push({ name: "", standard: "", qty: "", unit: "kg", price: "" }); renderItems(); $("irows").querySelector(".irow:last-child input")?.focus(); };
$("useTotalBtn").onclick = () => { $("fAmount").value = (formItems.reduce((a, it) => a + (parseAmount(it.price, true) || 0), 0) / 100).toFixed(2); itemsTotal(); };

function openSheet(e, category) {
  editing = e || null; pendingFile = null; removeReceipt = false; readToken++;
  $("sheetTitle").textContent = e ? "Edit expense" : "Add expense";
  $("fAmount").value = e ? (e.amountPence / 100).toFixed(2) : "";
  $("fDate").value = e ? e.date : today();
  $("fCat").value = e ? e.category : category || "ingredients";
  $("fSupplier").value = e ? e.supplier || "" : "";
  $("fMethod").value = e ? e.method || "card" : "card";
  $("fNote").value = e ? e.note || "" : "";
  formItems = (e?.items || []).map((it) => ({ name: it.name || "", standard: it.standard || "", qty: it.qty, unit: it.unit, price: (it.pricePence / 100).toFixed(2) }));
  $("delBtn").hidden = !e; $("confirmBox").hidden = true; progress(null); formMsg("");
  receiptView(); renderItems();
  $("sheet").showModal();
}
const closeSheet = () => { readToken++; progress(null); $("sheet").close(); };
$("closeBtn").onclick = closeSheet; $("cancelBtn").onclick = closeSheet;
$("addBtn").onclick = () => openSheet();

async function attach(file) {
  if (!file) return;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  if (!isPdf && !file.type.startsWith("image/")) { formMsg("Use a photo (JPG or PNG) or a PDF.", true); return; }
  const blob = isPdf ? file : await reader.shrinkPhoto(file);
  const type = isPdf ? "application/pdf" : (blob.type || "image/jpeg");
  if (blob.size > 8 * 1024 * 1024) { formMsg("That file is over 8 MB. Take a photo of the receipt instead.", true); return; }
  pendingFile = { blob, type }; removeReceipt = false;
  await receiptView();
  readReceipt(file.type.startsWith("image/") ? file : blob, type);
}
$("fCamera").onchange = (ev) => { const f = ev.target.files[0]; ev.target.value = ""; attach(f); };
$("fFile").onchange = (ev) => { const f = ev.target.files[0]; ev.target.value = ""; attach(f); };

async function readReceipt(blob, type) {
  const mine = ++readToken;
  formMsg("Reading the receipt…"); progress(0.05);
  let lines;
  try {
    lines = type === "application/pdf"
      ? await reader.readPdf(blob, (msg) => { if (mine === readToken) formMsg(msg); })
      : await reader.readImage(blob, (msg) => { if (mine !== readToken) return; formMsg(msg); const m = msg.match(/(\d+)%/); progress(m ? 0.1 + 0.9 * (+m[1] / 100) : 0.08); });
  } catch {
    if (mine === readToken) { progress(null); formMsg(navigator.onLine ? "The receipt could not be read. Add the items by hand." : "The reading tools are not on this phone yet. Connect once to download them (More › Reading receipts).", true); }
    return;
  }
  if (mine !== readToken) return;
  progress(null);
  if (!offlineReady) { offlineReady = true; try { localStorage.setItem("ssp_exp_offline", "1"); } catch {} }
  const r = parseReceipt(lines, state.app.suppliers);
  const got = r.items.map((it) => ({ name: it.name, standard: standardize(it.name, state.app.names).standard, qty: it.qty, unit: it.unit, price: (it.pricePence / 100).toFixed(2) }));
  formItems = formItems.filter((it) => String(it.name || "").trim() && !it.fromReceipt).concat(got.map((g) => ({ ...g, fromReceipt: true })));
  if (r.supplier && !$("fSupplier").value.trim()) $("fSupplier").value = r.supplier;
  if (r.date && !editing) $("fDate").value = r.date;
  if (r.total && !$("fAmount").value.trim()) $("fAmount").value = (r.total / 100).toFixed(2);
  if (got.length && !ITEMISED.has($("fCat").value)) $("fCat").value = "ingredients";
  renderItems();
  const found = [r.supplier && "shop", r.date && "date", r.total && "total"].filter(Boolean);
  formMsg(got.length ? `Read ${got.length} item${got.length === 1 ? "" : "s"}${found.length ? " and the " + found.join(", ") : ""}. Check them, then save.`
    : `No items found${found.length ? ", but read the " + found.join(", ") : ""}. Add items by hand if you want their prices compared.`, !got.length && !found.length);
}

$("form").onsubmit = async (ev) => {
  ev.preventDefault();
  if (saving) return;
  const amountPence = parseAmount($("fAmount").value);
  if (amountPence == null) { formMsg("Enter the amount paid in pounds, for example 12.50.", true); $("fAmount").focus(); return; }
  const date = $("fDate").value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { formMsg("Pick the date you paid.", true); return; }
  const items = [];
  for (const it of formItems) {
    if (!String(it.name || "").trim() && !String(it.standard || "").trim()) continue;
    const pricePence = parseAmount(it.price, true);
    if (it.price !== "" && pricePence == null) { formMsg(`Check the price of “${it.name || it.standard}”, for example 4.99.`, true); return; }
    items.push({ name: String(it.name || it.standard).trim().slice(0, 120), standard: String(it.standard || standardize(it.name, state.app.names).standard || it.name).trim().slice(0, 80),
      qty: parseQty(it.qty) || 1, unit: UNITS[it.unit] ? it.unit : "each", pricePence: pricePence || 0 });
  }
  saving = true; $("saveBtn").disabled = true;
  try {
    let receiptId = removeReceipt ? null : editing?.receiptId || null, receiptType = removeReceipt ? null : editing?.receiptType || null;
    if (pendingFile) {
      receiptId = newId(); receiptType = pendingFile.type;
      await store.put("files", { id: receiptId, blob: pendingFile.blob, type: receiptType, uploaded: false });
    }
    if (editing?.receiptId && editing.receiptId !== receiptId) await store.del("files", editing.receiptId);
    const doc = { id: editing?.id || newId(), date, amountPence, category: $("fCat").value, method: $("fMethod").value,
      supplier: $("fSupplier").value.trim().slice(0, 120), note: $("fNote").value.trim().slice(0, 1000), items: items.slice(0, 200),
      receiptId, receiptType, createdAt: editing?.createdAt || nowIso(), updatedAt: nowIso(), deleted: false, dirty: true };
    await store.put("expenses", doc);
    // Remember names she changed, so the same product is named her way next time.
    const taught = {};
    for (const it of formItems) if (it.touched && it.name && it.standard && standardize(it.name, {}).standard !== it.standard.trim()) taught[cleanName(it.name)] = it.standard.trim().slice(0, 80);
    const sup = doc.supplier;
    const newSup = sup && !allSuppliers().some((s) => key(s) === key(sup));
    if (Object.keys(taught).length || newSup) await saveApp((a) => { Object.assign(a.names, taught); if (newSup) a.suppliers.push(sup); });
    closeSheet();
    await loadLocal(); render(); syncSoon();
  } catch { formMsg("That did not save on this phone. Try again.", true); }
  finally { saving = false; $("saveBtn").disabled = false; }
};

$("delBtn").onclick = () => {
  const box = $("confirmBox"); box.hidden = false;
  box.replaceChildren(h("div", { class: "confirm" }, h("span", {}, `Delete ${money(editing.amountPence)} on ${editing.date}? This cannot be undone.`),
    h("button", { class: "btn danger", type: "button", onclick: async () => {
      if (editing.receiptId) await store.del("files", editing.receiptId);
      await store.put("expenses", { ...editing, deleted: true, items: [], updatedAt: nowIso(), dirty: true });
      closeSheet(); await loadLocal(); render(); syncSoon();
    } }, "Yes, delete"),
    h("button", { class: "btn", type: "button", onclick: () => { box.hidden = true; } }, "Keep it")));
};

// ---- Sign in ----
function openSignIn() { $("siMsg").hidden = true; $("siEmail").value = api.who() || ""; $("signin").showModal(); }
$("signinClose").onclick = $("signinCancel").onclick = () => $("signin").close();
$("signinForm").onsubmit = async (ev) => {
  ev.preventDefault();
  const msg = (t, err) => { $("siMsg").hidden = false; $("siMsg").textContent = t; $("siMsg").classList.toggle("err", !!err); };
  const email = $("siEmail").value.trim(), pw = $("siPassword").value;
  if (!email || !pw) { msg("Enter your email and password.", true); return; }
  $("siBtn").disabled = true; msg("Signing in… the server can take up to a minute to wake up.");
  try {
    await api.signIn(email, pw);
    $("siPassword").value = ""; $("signin").close();
    sync(true);
  } catch (e) {
    msg(e.status === 401 || e.status === 400 ? "That email and password do not match." : e.status === 429 ? "Too many tries. Wait a minute." : e.status === 0 ? "No connection. Try again when you have signal." : e.message, true);
  } finally { $("siBtn").disabled = false; }
};

// ---- Sync with the server ----
let syncing = false, syncError = "", lastSync = null, syncTimer = null;
try { lastSync = localStorage.getItem("ssp_exp_lastsync"); } catch {}
const syncSoon = () => { clearTimeout(syncTimer); syncTimer = setTimeout(() => sync(), 1500); };

function renderPill() {
  const p = $("syncPill");
  const unsent = state.all.filter((e) => e.dirty).length + (state.app.dirty ? 1 : 0);
  let text, cls = "";
  if (!api.token()) { text = "On this phone only · Sign in"; cls = "warn"; }
  else if (syncing) text = "Syncing…";
  else if (syncError === "auth") { text = "Sign in again"; cls = "bad"; }
  else if (!navigator.onLine) { text = unsent ? `Offline · ${unsent} to send` : "Offline · saved on phone"; cls = "warn"; }
  else if (syncError) { text = unsent ? `${unsent} not sent · retry` : "Sync failed · retry"; cls = "bad"; }
  else if (unsent) { text = `${unsent} to send`; cls = "warn"; }
  else { text = "Synced"; cls = "ok"; }
  p.textContent = text; p.className = "pill " + cls;
}
$("syncPill").onclick = () => { if (!api.token() || syncError === "auth") openSignIn(); else sync(true); };

async function sync(manual) {
  if (syncing || !api.token()) { renderPill(); return; }
  if (!navigator.onLine) { renderPill(); return; }
  syncing = true; syncError = ""; renderPill();
  try {
    for (const e of (await store.all("expenses")).filter((x) => x.dirty)) {
      if (e.receiptId && !e.deleted) {
        const f = await store.get("files", e.receiptId);
        if (f && !f.uploaded) { await api.putReceipt(f.id, f.blob, f.type); await store.put("files", { ...f, uploaded: true }); }
      }
      const { dirty, seq, saved_at, ...body } = e;  // eslint-disable-line no-unused-vars
      const r = await api.putExpense(e.id, body);
      const now = await store.get("expenses", e.id);
      if (now && now.updatedAt !== e.updatedAt) continue;          // edited again while sending: send next time
      await store.put("expenses", r.applied ? { ...e, dirty: false } : { ...strip(r.expense), dirty: false });
    }
    let cursor = (await store.kvGet("cursor")) || 0, more = true;
    while (more) {
      const r = await api.changes(cursor);
      for (const s of r.expenses) {
        const local = await store.get("expenses", s.id);
        if (local?.dirty && local.updatedAt > s.updatedAt) continue;
        if (local?.receiptId && local.receiptId !== s.receiptId) await store.del("files", local.receiptId);
        await store.put("expenses", { ...strip(s), dirty: false });
      }
      cursor = r.cursor; more = r.more;
      await store.kvSet("cursor", cursor);
    }
    if (state.app.dirty) {
      const { dirty, ...body } = state.app;  // eslint-disable-line no-unused-vars
      const r = await api.putState(body);
      if (r.applied) state.app.dirty = false; else state.app = { ...r.state, dirty: false };
      await store.kvSet("app", state.app);
    }
    const server = await api.getState();
    if (server.updatedAt && server.updatedAt > (state.app.updatedAt || "") && !state.app.dirty) {
      state.app = { shopping: [], names: {}, suppliers: [], ...server, dirty: false };
      await store.kvSet("app", state.app);
    }
    lastSync = nowIso(); try { localStorage.setItem("ssp_exp_lastsync", lastSync); } catch {}
  } catch (e) {
    if (e.status === 401) { api.signOut(); syncError = "auth"; }
    else syncError = e.status === 0 ? "offline" : "error";
    if (manual && syncError === "error") console.warn("Sync failed:", e.message);
  } finally {
    syncing = false;
    await loadLocal(); render();
  }
}
const strip = ({ seq, saved_at, ...rest }) => rest;  // eslint-disable-line no-unused-vars
window.addEventListener("online", () => sync());
window.addEventListener("offline", renderPill);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sync(); });
setInterval(() => { if (document.visibilityState === "visible") sync(); }, 5 * 60 * 1000);

// ---- Exports and backup ----
const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = h("a", { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
$("exportCsv").onclick = () => {
  const period = currentPeriod();
  const rows = state.expenses.filter(period.test).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) { $("backupMsg").textContent = "Nothing to export for " + period.label + "."; return; }
  const lines = [["Date", "Tax year", "Amount (GBP)", "Category", "Supplier", "Paid by", "Items", "Note", "Receipt"].join(",")];
  for (const e of rows) lines.push([e.date, tyLabel(taxYearOf(e.date)), (e.amountPence / 100).toFixed(2), CAT[e.category] || e.category, e.supplier, METHOD[e.method] || e.method, (e.items || []).length, e.note, e.receiptId ? "yes" : "no"].map(esc).join(","));
  download(`ssp-expenses-${period.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, lines.join("\r\n") + "\r\n", "text/csv");
  $("backupMsg").textContent = `Exported ${rows.length} expenses.`;
};
$("itemsCsvBtn").onclick = () => {
  const ps = purchases().sort((a, b) => a.date.localeCompare(b.date));
  if (!ps.length) return;
  const lines = [["Date", "Supplier", "Item on receipt", "Compare as", "Quantity", "Unit", "Paid (GBP)", "Unit price (GBP)", "Per"].join(",")];
  for (const p of ps) lines.push([p.date, p.supplier, p.name, p.std, p.qty, p.unit, (p.pricePence / 100).toFixed(2), (p.unitPrice / 100).toFixed(4), PER[p.base]].map(esc).join(","));
  download("ssp-item-prices.csv", lines.join("\r\n") + "\r\n", "text/csv");
};
const toB64 = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.readAsDataURL(blob); });
$("exportJson").onclick = async () => {
  $("backupMsg").textContent = "Preparing the backup…";
  const files = [];
  if ($("withFiles").checked) for (const e of state.expenses) if (e.receiptId) {
    const f = await localFile(e.receiptId, e.receiptType);
    if (f.blob) files.push({ id: e.receiptId, type: f.type, data: await toB64(f.blob) });
  }
  const { dirty, ...app } = state.app;  // eslint-disable-line no-unused-vars
  const out = { app: "ssp-expenses", version: 1, exportedAt: nowIso(), expenses: state.expenses.map(({ dirty: _d, ...e }) => strip(e)), state: app, files };
  download(`ssp-expenses-backup-${today()}.json`, JSON.stringify(out), "application/json");
  $("backupMsg").textContent = `Backup saved: ${out.expenses.length} expenses, ${files.length} receipts.`;
};
$("importBtn").onclick = () => $("importFile").click();
$("importFile").onchange = async (ev) => {
  const f = ev.target.files[0]; ev.target.value = "";
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== "ssp-expenses" || !Array.isArray(data.expenses)) throw new Error("not a backup");
    let added = 0;
    for (const file of data.files || []) {
      if (!(await store.get("files", file.id))) {
        const bytes = Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0));
        await store.put("files", { id: file.id, blob: new Blob([bytes], { type: file.type }), type: file.type, uploaded: false });
      }
    }
    for (const e of data.expenses) {
      if (!e.id || !e.date) continue;
      const local = await store.get("expenses", e.id);
      if (local && local.updatedAt >= e.updatedAt) continue;
      await store.put("expenses", { ...strip(e), deleted: !!e.deleted, dirty: true }); added++;
    }
    if (data.state) await saveApp((a) => {
      a.names = { ...(data.state.names || {}), ...a.names };
      for (const s of data.state.suppliers || []) if (!a.suppliers.includes(s)) a.suppliers.push(s);
      if (!a.shopping.length && Array.isArray(data.state.shopping)) a.shopping = data.state.shopping;
    });
    $("backupMsg").textContent = `Restored ${added} expense${added === 1 ? "" : "s"}.`;
    await loadLocal(); render(); syncSoon();
  } catch { $("backupMsg").textContent = "That file is not a Svadista Prasada Expenses backup."; }
};

// ---- Start ----
(async () => {
  await store.persist();
  await loadLocal();
  render();
  sync();
  if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname) || new URLSearchParams(location.search).has("sw")) {
    try { await navigator.serviceWorker.register("sw.js"); } catch {}
  }
})();
