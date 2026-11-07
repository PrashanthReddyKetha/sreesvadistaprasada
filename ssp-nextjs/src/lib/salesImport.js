/* Turning a platform's order export (Deliveroo Partner Hub › Invoices or Orders › Download CSV) into sales rows.
   Column names differ between exports and change over time, so each field is matched by likely names and the
   owner can correct the match on screen before anything is saved. */

/** RFC 4180 CSV → array of string arrays (quoted fields, doubled quotes, commas and newlines inside quotes). */
export function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(v => v.trim() !== '')) rows.push(row);
  return rows;
}

/* Field → header patterns, best first. `fees` may take several columns (commission + VAT on commission + …). */
export const FIELDS = [
  { key: 'ref',      label: 'Order number',        need: true,  match: [/^order\s*(number|no\.?|#)$/i, /order.*(number|id|no\b)/i, /^(id|reference|ref)$/i] },
  { key: 'date',     label: 'Date',                need: true,  match: [/^(order\s*)?date$/i, /placed|created|ordered at|order time|date/i] },
  { key: 'time',     label: 'Time (if separate)',              match: [/^(order\s*)?time$/i] },
  { key: 'customer', label: 'Customer',                         match: [/customer/i, /^name$/i] },
  { key: 'items',    label: 'Items',                            match: [/^items?$/i, /order items|item names|dishes|items/i] },
  { key: 'gross',    label: 'Food total (gross)',  need: true,  match: [/^subtotal$/i, /order value|food total|gross|subtotal|item total|basket/i, /^(order\s*)?total$/i] },
  { key: 'discount', label: 'Discount / offers',                match: [/discount|offer|promotion|promo|voucher/i] },
  // Not guessed: on a Deliveroo-delivered order the customer's delivery fee is Deliveroo's money, not a sale
  { key: 'charges',  label: 'Delivery / fees you charged the customer', match: [] },
  { key: 'fees',     label: 'Platform fees (add up)', multi: true, match: [/commission|service fee|deliveroo fee|platform fee|vat on/i] },
  { key: 'payout',   label: 'Payout (if no fees column)',       match: [/payout|net payout|amount paid to you|you receive|net amount/i] },
  { key: 'status',   label: 'Order status',                     match: [/status/i] },
];

/** Best guess of which column holds each field: { ref: 2, fees: [7, 8], … } (index into headers, -1 = none). */
export function guessMapping(headers) {
  const used = new Set(); const map = {};
  for (const f of FIELDS) {
    if (f.multi) { map[f.key] = []; continue; }
    map[f.key] = -1;
    for (const re of f.match) {
      const i = headers.findIndex((h, j) => !used.has(j) && re.test(h.trim()));
      if (i >= 0) { map[f.key] = i; used.add(i); break; }
    }
  }
  const fees = FIELDS.find(f => f.key === 'fees');
  map.fees = headers.map((h, j) => j).filter(j => !used.has(j) && fees.match.some(re => re.test(headers[j])) && !/delivery fee/i.test(headers[j]));
  return map;
}

/** "£1,234.50", "-2.10", "(2.10)" → pence, always positive (exports show discounts and fees as negatives). */
export function toPence(v) {
  const s = String(v ?? '').replace(/[£,\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(Math.abs(n) * 100) : 0;
}

/** "2026-11-06 18:04", "06/11/2026 18:04:22", "6 Nov 2026" (+ optional separate time) → ISO instant, or null.
    Day-first, as UK exports are; read in the phone's own time zone (the owner's: London). */
export function toInstant(date, time = '') {
  const s = `${String(date || '').trim()} ${String(time || '').trim()}`.trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0), +(m[6] || 0)).toISOString();
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return new Date(y, m[2] - 1, +m[1], +(m[4] || 12), +(m[5] || 0), +(m[6] || 0)).toISOString();
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const statusOf = (v) => /refund/i.test(v || '') ? 'refunded' : /cancel|reject|fail|declin/i.test(v || '') ? 'cancelled' : 'completed';

/** Data rows + mapping → { rows, problems } ready for POST /sales/import. */
export function toSales(body, map, channel = 'deliveroo') {
  const at = (r, k) => (map[k] >= 0 ? (r[map[k]] ?? '') : '');
  const rows = []; const problems = [];
  body.forEach((r, n) => {
    const ref = String(at(r, 'ref')).trim();
    const when = toInstant(at(r, 'date'), at(r, 'time'));
    if (!ref || !when) { problems.push(`Line ${n + 2}: ${!ref ? 'no order number' : 'date not understood'}`); return; }
    const gross = toPence(at(r, 'gross'));
    const discount = Math.min(gross, toPence(at(r, 'discount')));
    const charges = toPence(at(r, 'charges'));
    let fees = (map.fees || []).reduce((t, j) => t + toPence(r[j]), 0);
    if (!fees && map.payout >= 0 && at(r, 'payout') !== '') fees = Math.max(0, gross - discount + charges - toPence(at(r, 'payout')));
    rows.push({
      channel, ref: ref.slice(0, 60), at: when, customer_name: String(at(r, 'customer')).slice(0, 120),
      items_text: String(at(r, 'items')).slice(0, 1000), gross, discount, charges, fees,
      fulfilment: 'delivery', payment_method: channel === 'deliveroo' ? 'deliveroo' : 'card', status: statusOf(at(r, 'status')),
    });
  });
  return { rows, problems };
}
