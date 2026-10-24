// Reads a receipt's text (from a PDF's own text, or from text recognition on a photo) into
// { supplier, date, total, items: [{ name, qty, unit, pricePence }] }. Rules only; nothing leaves the phone.
//
// Two layouts are understood:
// - online orders that list "3 x Product 400g" with the full line price (Asda, Tesco and Sainsbury's orders);
//   multibuy offers printed under a line ("Any 5 for £2") are taken off that line, order vouchers are not;
// - till receipts: one product per line with its price at the end, with quantity, weight and discount lines.

import { SUPPLIERS } from "./util.js";

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const PRICE = "(\\d{1,4}(?:[.,]\\d{1,2})?)";
const pence = (s) => Math.round(parseFloat(String(s).replace(",", ".")) * 100);
const r3 = (n) => Math.round(n * 1000) / 1000;

// Lines from positioned text pieces (pdf.js text items): same height on the page = same line, left to right.
export function linesFromPieces(pieces, tolerance = 3, sep = "  ") {
  const out = [];
  const pages = new Map();
  for (const p of pieces) { if (!pages.has(p.page)) pages.set(p.page, []); pages.get(p.page).push(p); }
  for (const [, ps] of [...pages.entries()].sort((a, b) => a[0] - b[0])) {
    ps.sort((a, b) => b.y - a.y || a.x - b.x);
    let row = [], y = null;
    const flush = () => { if (row.length) out.push(row.sort((a, b) => a.x - b.x).map((p) => p.str.trim()).filter(Boolean).join(sep)); row = []; };
    for (const p of ps) {
      if (!p.str.trim()) continue;
      if (y !== null && Math.abs(p.y - y) > tolerance) flush();
      if (!row.length) y = p.y;
      row.push(p);
    }
    flush();
  }
  return out;
}

// Size from a product name: "400g", "5 Litres", "4 x 400g". Weights in kg, volumes in litres.
export function sizeOf(name) {
  const n = String(name).toLowerCase();
  const unitOf = (u) => /^(kg|kilos?)$/.test(u) ? ["kg", 1] : /^(g|gm|gms|grams?)$/.test(u) ? ["kg", 0.001]
    : /^(ml)$/.test(u) ? ["L", 0.001] : /^(l|lt|ltr|litres?|liters?)$/.test(u) ? ["L", 1] : null;
  const pack = n.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|kilos?|g|gm|gms|grams?|ml|l|lt|ltr|litres?|liters?)\b/);
  if (pack) { const u = unitOf(pack[3]); if (u) return { qty: r3(+pack[1] * +pack[2] * u[1]), unit: u[0] }; }
  const all = [...n.matchAll(/(\d+(?:\.\d+)?)\s*(kg|kilos?|g|gm|gms|grams?|ml|l|lt|ltr|litres?|liters?)\b/g)];
  if (all.length) { const m = all[all.length - 1]; const u = unitOf(m[2]); if (u) return { qty: r3(+m[1] * u[1]), unit: u[0] }; }
  const pcs = n.match(/(\d+)\s*(?:pcs|pieces|pack|pk)\b/);
  if (pcs) return { qty: +pcs[1], unit: "each" };
  return null;
}

function normalise(line) {
  return String(line)
    .replace(/[€]/g, "£")
    .replace(/(\d)[oO](\d)/g, "$10$2").replace(/(\d)[oO](\d)/g, "$10$2").replace(/([.,]\d)[oO]\b/g, "$10")
    .replace(/(\d) ?[.,] ?(\d{2})\b/g, "$1.$2")
    .replace(/[|]/g, " ")
    .replace(/\s+$/g, "");
}

export function findSupplier(text, extra = []) {
  const t = text.toLowerCase();
  const rules = [["Sainsbury's", /sainsbury/], ["Sujas", /\bsuja'?s\b/], ["Morrisons", /morrisons/], ["Costco", /costco/], ["Booker", /\bbooker\b/],
    ...SUPPLIERS.filter((s) => !/sainsbury|sujas/i.test(s)).map((s) => [s, new RegExp(`\\b${s.toLowerCase()}\\b`)])];
  for (const s of extra) if (s && s.length >= 3) rules.unshift([s, new RegExp(`\\b${s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)]);
  for (const [name, rx] of rules) if (rx.test(t)) return name;
  return null;
}

export function findDate(text) {
  const t = text.toLowerCase();
  let m = t.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s*(\d{4})\b/);
  if (m) return ymd(+m[3], MONTHS[m[2]], +m[1]);
  m = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
  if (m) { let y = +m[3]; if (y < 100) y += 2000; return ymd(y, +m[2], +m[1]); }
  m = t.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (m) return ymd(+m[1], +m[2], +m[3]);
  return null;
}
function ymd(y, mo, d) {
  if (!(y >= 2000 && y <= 2100 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getMonth() !== mo - 1) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function findTotal(lines) {
  let best = null;
  for (const raw of lines) {
    const l = normalise(raw).toLowerCase();
    if (/(sub ?-?total|shopping total|savings|saved|multibuy|vat|points|items?\b.*total)/.test(l)) continue;
    const m = l.match(new RegExp(`\\b(total|balance due|amount due|to pay|grand total|total to pay|amount paid)\\b[^\\d£-]*£?\\s?${PRICE}`));
    if (m) best = pence(m[2]);
  }
  if (best != null) return best;
  for (const raw of lines) {                        // the card payment line, if there is no total line
    const m = normalise(raw).toLowerCase().match(new RegExp(`\\b(visa|mastercard|debit|contactless|card)\\b.*£?\\s?${PRICE}\\s*$`));
    if (m) best = pence(m[2]);
  }
  return best;
}

const ONLINE_ITEM = /^(\d{1,3})\s*x\s+(.+)$/i;
const OFFER = /(?:any\s+)?(\d+)\s+for\s+£\s?(\d+(?:\.\d{1,2})?)/i;

function parseOnline(lines) {
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const m = normalise(lines[i]).match(ONLINE_ITEM);
    if (!m) continue;
    const count = +m[1];
    let name = m[2], prices = [];
    const cut = name.search(/£\s?\d/);
    if (cut >= 0) { prices.push(...[...name.slice(cut).matchAll(/£\s?(\d+(?:\.\d{1,2})?)/g)].map((x) => pence(x[1]))); name = name.slice(0, cut); }
    let offer = null;
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
      const l = normalise(lines[j]);
      if (ONLINE_ITEM.test(l) || /\(\d+ items?\)|total|delivery/i.test(l)) break;
      const o = l.match(OFFER);
      if (o) { offer = [+o[1], pence(o[2])]; continue; }
      prices.push(...[...l.matchAll(/£\s?(\d+(?:\.\d{1,2})?)/g)].map((x) => pence(x[1])));
    }
    name = name.trim().replace(/\s{2,}.*$/, "");
    if (!prices.length || !name) continue;
    const full = prices[0];                          // the full price comes first; the lower one has vouchers spread in
    let price = full;
    if (offer && count >= offer[0]) {
      const each = full / count;
      price = Math.round(Math.floor(count / offer[0]) * offer[1] + (count % offer[0]) * each);
    }
    const size = sizeOf(name);
    items.push({ name: `${count} x ${name}`, qty: size ? r3(size.qty * count) : count, unit: size ? size.unit : "each", pricePence: price });
  }
  return items;
}

const SKIP = /\b(sub ?-?total|total|balance|change|cash|card|visa|mastercard|maestro|amex|debit|credit|contactless|chip|pin|auth|vat|tax|tendered|due|paid|refund|points|clubcard points|nectar points|merchant|terminal|tel|phone|www|http|thank|receipt|store|till|cashier|served|items? sold|no of items|qty|reg no|vat no|ref|transaction|aid|pan|approved|copy|customer)\b/i;
const DISCOUNT = /\b(discount|offer|saving|savings|price cut|reduced|clubcard price|nectar price|lidl plus|coupon|promo|multibuy|deal)\b/i;

function parseTill(lines) {
  const items = [];
  const last = () => items[items.length - 1];
  const near = (a, b) => Math.abs(a - b) <= 2;
  // Tills print quantity and weight lines either above or below the product, so each is matched by its price.
  let pendingName = null, pendingQty = null;
  for (const raw of lines) {
    const l = normalise(raw).trim();
    if (!l) continue;
    // "2 x £1.29" / "2 @ 1.29": a quantity and unit price
    let m = l.match(new RegExp(`^(\\d{1,3})\\s*[x@*]\\s*£?\\s?${PRICE}(?:\\s+£?\\s?${PRICE})?\\s*[A-Z*]?$`, "i"));
    if (m) {
      const q = { count: +m[1], each: pence(m[2]) };
      if (last() && last().count === 1 && near(last().pricePence, q.count * q.each)) last().count = q.count;
      else pendingQty = q;
      continue;
    }
    // "0.512 kg @ £2.50/kg  1.28": a weighed item, its name usually on the line above
    m = l.match(new RegExp(`(\\d+[.,]\\d+)\\s*kg\\s*@\\s*£?\\s?(\\d+[.,]\\d{2})\\s*\\/\\s*kg(?:\\s+£?\\s?${PRICE})?`, "i"));
    if (m) {
      const weight = parseFloat(m[1].replace(",", "."));
      const price = m[3] ? pence(m[3]) : Math.round(weight * pence(m[2]));
      if (pendingName) items.push({ name: pendingName, count: 1, weight, pricePence: price });
      else if (last() && near(last().pricePence, price)) last().weight = weight;
      else items.push({ name: "Loose item", count: 1, weight, pricePence: price });
      pendingName = null;
      continue;
    }
    m = l.match(new RegExp(`^(.*?[A-Za-z].*?)\\s+(-)?\\s?£?\\s?${PRICE}\\s*(-)?\\s*(?:[A-Z]{1,2}|\\*)?$`));
    if (!m) {
      if (/[A-Za-z]{3}/.test(l) && !SKIP.test(l) && l.length <= 40) pendingName = l;
      continue;
    }
    const name = m[1].replace(/\s+£$/, "").trim();
    const value = pence(m[3]) * (m[2] || m[4] ? -1 : 1);
    if (DISCOUNT.test(name) || value < 0) { if (last()) last().pricePence -= Math.abs(value); continue; }
    if (SKIP.test(name) || name.replace(/[^A-Za-z]/g, "").length < 2) continue;
    if (!/[.,]\d{2}$/.test(m[3])) continue;          // a till price always has pence
    let count = 1, clean = name;
    const lead = clean.match(/^(\d{1,2})\s*x?\s+(?=[A-Za-z])/i);
    if (lead && +lead[1] <= 30) { count = +lead[1]; clean = clean.slice(lead[0].length); }
    if (pendingQty && near(value, pendingQty.count * pendingQty.each)) count = pendingQty.count;
    pendingQty = null; pendingName = null;
    items.push({ name: clean, count, pricePence: value });
  }
  return items.map((it) => {
    if (it.weight) return { name: it.name, qty: r3(it.weight), unit: "kg", pricePence: it.pricePence };
    const size = sizeOf(it.name);
    return { name: it.count > 1 ? `${it.count} x ${it.name}` : it.name, qty: size ? r3(size.qty * it.count) : it.count, unit: size ? size.unit : "each", pricePence: it.pricePence };
  }).filter((it) => it.pricePence > 0);
}

export function parseReceipt(lines, extraSuppliers = []) {
  const text = lines.join("\n");
  const online = lines.filter((l) => ONLINE_ITEM.test(normalise(l))).length >= 2;
  const items = online ? parseOnline(lines) : parseTill(lines);
  return {
    supplier: findSupplier(text, extraSuppliers),
    date: findDate(text),
    total: findTotal(lines),
    items,
    layout: online ? "online order" : "till receipt",
  };
}
