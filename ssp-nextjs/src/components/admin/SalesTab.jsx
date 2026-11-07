'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Download, Upload, X, Trash2, Pencil, Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/api';
import ConfirmAction from '@/components/admin/ConfirmAction';
import { parseCsv, FIELDS, guessMapping, toSales } from '@/lib/salesImport';

/* Admin › Sales — every sale in one book: website orders and Dabba plans (automatic), WhatsApp and phone orders
   (typed in here), Deliveroo (uploaded from the Partner Hub export). Money is pence throughout. */

const P = '#800020';
const gbp = (p) => `£${(Number(p || 0) / 100).toFixed(2)}`;
const toP = (v) => Math.round((parseFloat(v) || 0) * 100);
const fromP = (p) => (p ? (p / 100).toFixed(2) : '');
const fmtDT = (iso) => iso ? new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const pad = (n) => String(n).padStart(2, '0');
const dayStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localNow = () => { const d = new Date(); return `${dayStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const toLocal = (iso) => { const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z'); return `${dayStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

const CHANNEL = {
  website:   { label: 'Website',   bg: '#E8F5E9', color: '#2E7D32' },
  whatsapp:  { label: 'WhatsApp',  bg: '#DCFCE7', color: '#166534' },
  deliveroo: { label: 'Deliveroo', bg: '#E0F7F5', color: '#00796B' },
  phone:     { label: 'Phone',     bg: '#E3F2FD', color: '#1565C0' },
  walk_in:   { label: 'Walk-in',   bg: '#FFF8E1', color: '#8B6914' },
  other:     { label: 'Other',     bg: '#F5F5F5', color: '#616161' },
};
const STATUS = { completed: 'Completed', open: 'In progress', cancelled: 'Cancelled', refunded: 'Refunded' };
const METHOD = { cash: 'Cash', bank: 'Bank transfer', card: 'Card', deliveroo: 'Deliveroo', unpaid: 'Not paid yet' };

const RANGES = [
  ['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['last_month', 'Last month'], ['custom', 'Pick dates'],
];
function rangeFor(kind, from, to) {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth(); const d = now.getDate();
  if (kind === 'today') return [new Date(y, m, d), new Date(y, m, d + 1)];
  if (kind === 'week') { const back = (now.getDay() + 6) % 7; return [new Date(y, m, d - back), new Date(y, m, d + 1)]; }
  if (kind === 'month') return [new Date(y, m, 1), new Date(y, m + 1, 1)];
  if (kind === 'last_month') return [new Date(y, m - 1, 1), new Date(y, m, 1)];
  const [fy, fm, fd] = (from || dayStr(now)).split('-').map(Number);
  const [ty, tm, td] = (to || dayStr(now)).split('-').map(Number);
  return [new Date(fy, fm - 1, fd), new Date(ty, tm - 1, td + 1)];
}

const Field = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="text-xs font-semibold block mb-1" style={{ color: '#2D2422' }}>{label}</span>
    {children}
    {hint && <span className="text-[11px] block mt-1" style={{ color: '#7A5C50' }}>{hint}</span>}
  </label>
);
const inp = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none';
const inpStyle = { border: '1px solid #e0d9d0', backgroundColor: 'white' };
const errText = (ex, fallback) => {
  const d = ex.response?.data?.detail;
  return typeof d === 'string' ? d : Array.isArray(d) ? d.map(x => x.msg.replace(/^Value error, /, '')).join('; ') : fallback;
};

/* ── Add / edit a sale by hand ───────────────────────────── */
const BLANK = {
  channel: 'whatsapp', ref: '', at: '', customer_name: '', customer_phone: '', customer_email: '', address: '',
  fulfilment: 'collection', items: [{ name: '', qty: 1, price: '' }], gross: '', discount: '', charges: '', fees: '',
  payment_method: 'cash', status: 'completed', notes: '',
};

function SaleForm({ initial, menu, onDone, onCancel }) {
  const [f, setF] = useState(() => initial ? {
    ...BLANK, ...initial, at: toLocal(initial.at),
    items: initial.items?.length ? initial.items.map(i => ({ ...i, price: fromP(i.price) })) : [{ name: initial.items_text || '', qty: 1, price: '' }],
    gross: initial.items?.length ? '' : fromP(initial.gross), discount: fromP(initial.discount), charges: fromP(initial.charges), fees: fromP(initial.fees),
  } : { ...BLANK, at: localNow() });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const priceOf = useMemo(() => Object.fromEntries(menu.map(m => [m.name.toLowerCase(), m.price])), [menu]);

  const setItem = (i, k, v) => setF(p => {
    const items = p.items.map((it, j) => j === i ? { ...it, [k]: v } : it);
    if (k === 'name' && priceOf[v.toLowerCase()] !== undefined && !p.items[i].price) items[i].price = priceOf[v.toLowerCase()].toFixed(2);
    return { ...p, items };
  });
  const items = f.items.filter(i => i.name.trim());
  const gross = items.length ? items.reduce((t, i) => t + Math.round((Number(i.qty) || 0) * toP(i.price)), 0) : toP(f.gross);
  const net = gross - toP(f.discount); const paid = net + toP(f.charges); const payout = paid - toP(f.fees);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const body = {
      channel: f.channel, ref: f.ref.trim(), at: new Date(f.at).toISOString(),
      customer_name: f.customer_name.trim(), customer_phone: f.customer_phone.trim(), customer_email: f.customer_email.trim(),
      address: f.address.trim(), fulfilment: f.fulfilment,
      items: items.map(i => ({ name: i.name.trim(), qty: Number(i.qty) || 1, price: toP(i.price) })),
      items_text: items.length ? '' : (initial?.items_text || ''),
      gross: items.length ? 0 : toP(f.gross), discount: toP(f.discount), charges: toP(f.charges), fees: toP(f.fees),
      payment_method: f.payment_method, status: f.status, notes: f.notes,
    };
    try {
      if (initial) await api.put(`/sales/${initial.id}`, body); else await api.post('/sales', body);
      onDone();
    } catch (ex) { setErr(errText(ex, 'Could not save the sale.')); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl p-5 space-y-4" style={{ border: '1px solid #e0d9d0' }}>
      <div className="flex items-center justify-between">
        <p className="font-bold" style={{ color: P }}>{initial ? 'Edit sale' : 'Add a WhatsApp / phone order'}</p>
        <button type="button" onClick={onCancel} aria-label="Close" className="text-gray-400"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Came in by">
          <select value={f.channel} onChange={set('channel')} className={inp} style={inpStyle}>
            {['whatsapp', 'phone', 'walk_in', 'deliveroo', 'other'].map(c => <option key={c} value={c}>{CHANNEL[c].label}</option>)}
          </select>
        </Field>
        <Field label="Date and time"><input type="datetime-local" required value={f.at} onChange={set('at')} className={inp} style={inpStyle} /></Field>
        <Field label="Collection / delivery">
          <select value={f.fulfilment} onChange={set('fulfilment')} className={inp} style={inpStyle}>
            <option value="collection">Collection</option><option value="delivery">Delivery</option>
          </select>
        </Field>
        <Field label="Reference (optional)" hint="e.g. Deliveroo order no."><input value={f.ref} onChange={set('ref')} maxLength={60} className={inp} style={inpStyle} /></Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Customer name"><input value={f.customer_name} onChange={set('customer_name')} maxLength={120} className={inp} style={inpStyle} /></Field>
        <Field label="Phone"><input type="tel" value={f.customer_phone} onChange={set('customer_phone')} maxLength={40} className={inp} style={inpStyle} /></Field>
        <Field label="Email"><input type="email" value={f.customer_email} onChange={set('customer_email')} maxLength={160} className={inp} style={inpStyle} /></Field>
      </div>
      {f.fulfilment === 'delivery' && (
        <Field label="Delivery address"><input value={f.address} onChange={set('address')} maxLength={300} className={inp} style={inpStyle} /></Field>
      )}

      <div>
        <span className="text-xs font-semibold block mb-1" style={{ color: '#2D2422' }}>Items</span>
        <datalist id="sales-menu">{menu.map(m => <option key={m.id} value={m.name}>£{Number(m.price).toFixed(2)}</option>)}</datalist>
        <div className="space-y-2">
          {f.items.map((it, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input list="sales-menu" placeholder="Dish" value={it.name} onChange={e => setItem(i, 'name', e.target.value)} maxLength={120} className={`${inp} flex-1`} style={inpStyle} aria-label="Dish" />
              <input type="number" min="1" step="1" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} className={`${inp} !w-16`} style={inpStyle} aria-label="Quantity" />
              <input type="number" min="0" step="0.01" placeholder="£ each" value={it.price} onChange={e => setItem(i, 'price', e.target.value)} className={`${inp} !w-24`} style={inpStyle} aria-label="Price each" />
              <button type="button" aria-label="Remove item" onClick={() => setF(p => ({ ...p, items: p.items.length > 1 ? p.items.filter((_, j) => j !== i) : [{ name: '', qty: 1, price: '' }] }))} className="text-gray-400"><X size={15} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setF(p => ({ ...p, items: [...p.items, { name: '', qty: 1, price: '' }] }))}
          className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: P }}><Plus size={13} /> Add item</button>
        {!items.length && (
          <Field label="Or the food total (£)" className="mt-2" hint="Only when you don't list the dishes.">
            <input type="number" min="0" step="0.01" value={f.gross} onChange={set('gross')} className={inp} style={inpStyle} />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Discount (£)"><input type="number" min="0" step="0.01" value={f.discount} onChange={set('discount')} className={inp} style={inpStyle} /></Field>
        <Field label="Delivery / extra charge (£)"><input type="number" min="0" step="0.01" value={f.charges} onChange={set('charges')} className={inp} style={inpStyle} /></Field>
        <Field label="Platform fees (£)" hint="Commission kept by an app"><input type="number" min="0" step="0.01" value={f.fees} onChange={set('fees')} className={inp} style={inpStyle} /></Field>
        <Field label="Paid by">
          <select value={f.payment_method} onChange={set('payment_method')} className={inp} style={inpStyle}>
            {Object.entries(METHOD).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="Status">
          <select value={f.status} onChange={set('status')} className={inp} style={inpStyle}>
            <option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option>
          </select>
        </Field>
        <Field label="Notes" className="md:col-span-3"><input value={f.notes} onChange={set('notes')} maxLength={1000} className={inp} style={inpStyle} /></Field>
      </div>

      <div className="rounded-lg p-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm" style={{ backgroundColor: '#F9F6EE' }}>
        <span>Gross <b>{gbp(gross)}</b></span><span>Discount <b>{gbp(toP(f.discount))}</b></span>
        <span>Net sale <b>{gbp(net)}</b></span><span>Customer paid <b>{gbp(paid)}</b></span><span>Payout <b>{gbp(payout)}</b></span>
      </div>
      {err && <p className="text-sm" style={{ color: '#B91C1C' }}>{err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Cancel</button>
        <button disabled={busy || net < 0} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: P }}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add sale'}</button>
      </div>
    </form>
  );
}

/* ── Upload a Deliveroo export ───────────────────────────── */
function ImportPanel({ onDone, onCancel }) {
  const [table, setTable] = useState(null);      // { name, headers, body }
  const [map, setMap] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async (file) => {
    setMsg('');
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { setMsg('That file has no order rows.'); return; }
    const [headers, ...body] = rows;
    setTable({ name: file.name, headers, body });
    setMap(guessMapping(headers));
  };
  const result = useMemo(() => table && map ? toSales(table.body, map) : null, [table, map]);
  const sum = (k) => result ? result.rows.filter(r => r.status === 'completed').reduce((t, r) => t + r[k], 0) : 0;

  const save = async () => {
    setBusy(true); setMsg('');
    try {
      let added = 0; let updated = 0;
      for (let i = 0; i < result.rows.length; i += 500) {
        const r = await api.post('/sales/import', { channel: 'deliveroo', rows: result.rows.slice(i, i + 500) });
        added += r.data.added; updated += r.data.updated;
      }
      onDone(`Deliveroo: ${added} new order${added === 1 ? '' : 's'}, ${updated} already in the book updated.`);
    } catch (ex) { setMsg(errText(ex, 'Could not import the file.')); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-xl p-5 space-y-4" style={{ border: '1px solid #e0d9d0' }}>
      <div className="flex items-center justify-between">
        <p className="font-bold" style={{ color: P }}>Import Deliveroo orders</p>
        <button type="button" onClick={onCancel} aria-label="Close" className="text-gray-400"><X size={16} /></button>
      </div>
      <p className="text-xs" style={{ color: '#7A5C50' }}>
        In Deliveroo Partner Hub open <b>Invoices</b> (or <b>Orders</b>), choose the dates and download the CSV, then pick it here.
        Uploading the same orders again updates them; nothing is counted twice. Deliveroo does not share customers&apos; phone numbers or emails.
      </p>
      <input type="file" accept=".csv,text/csv" onChange={e => e.target.files?.[0] && load(e.target.files[0])} className="text-sm" />
      {table && (
        <>
          <p className="text-xs font-semibold" style={{ color: '#2D2422' }}>Check which column is which ({table.body.length} rows in {table.name})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FIELDS.map(fld => (
              <Field key={fld.key} label={`${fld.label}${fld.need ? ' *' : ''}`}>
                {fld.multi ? (
                  <div className="flex flex-wrap gap-1.5">
                    {table.headers.map((h, j) => { const on = map.fees.includes(j); return (
                      <button key={j} type="button" onClick={() => setMap(m => ({ ...m, fees: on ? m.fees.filter(x => x !== j) : [...m.fees, j] }))}
                        className="px-2 py-1 rounded text-[11px] font-semibold" style={{ border: '1px solid #e0d9d0', backgroundColor: on ? P : 'white', color: on ? 'white' : '#5C4B47' }}>{h || `Column ${j + 1}`}</button>
                    ); })}
                  </div>
                ) : (
                  <select value={map[fld.key]} onChange={e => setMap(m => ({ ...m, [fld.key]: Number(e.target.value) }))} className={inp} style={inpStyle}>
                    <option value={-1}>— not in this file —</option>
                    {table.headers.map((h, j) => <option key={j} value={j}>{h || `Column ${j + 1}`}{table.body[0]?.[j] ? ` (e.g. ${String(table.body[0][j]).slice(0, 24)})` : ''}</option>)}
                  </select>
                )}
              </Field>
            ))}
          </div>
          {result && (
            <div className="rounded-lg p-3 text-sm space-y-1" style={{ backgroundColor: '#F9F6EE' }}>
              <p><b>{result.rows.length}</b> orders ready · gross <b>{gbp(sum('gross'))}</b> · discounts <b>{gbp(sum('discount'))}</b> · fees <b>{gbp(sum('fees'))}</b></p>
              {result.rows[0] && <p className="text-xs text-gray-500">First: {result.rows[0].ref} · {fmtDT(result.rows[0].at)} · {gbp(result.rows[0].gross)}</p>}
              {result.problems.length > 0 && <p className="text-xs" style={{ color: '#B45309' }}>Skipped {result.problems.length}: {result.problems.slice(0, 3).join('; ')}{result.problems.length > 3 ? '…' : ''}</p>}
            </div>
          )}
        </>
      )}
      {msg && <p className="text-sm" style={{ color: '#B91C1C' }}>{msg}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Cancel</button>
        <button onClick={save} disabled={busy || !result?.rows.length} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: P }}>{busy ? 'Importing…' : `Import ${result?.rows.length || ''} orders`}</button>
      </div>
    </div>
  );
}

/* ── One sale in the list ────────────────────────────────── */
function SaleRow({ s, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ch = CHANNEL[s.channel] || CHANNEL.other;
  const out = s.status === 'cancelled' || s.status === 'refunded';
  const items = s.items?.length ? s.items.map(i => `${i.qty} × ${i.name}`).join(', ') : s.items_text;
  const wa = s.customer_phone.replace(/\D/g, '').replace(/^0/, '44');
  return (
    <div className="bg-white rounded-xl px-4 py-3" style={{ border: '1px solid #EDE7DF', opacity: out ? 0.6 : 1 }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 text-left" aria-expanded={open}>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0" style={{ backgroundColor: ch.bg, color: ch.color }}>{s.kind === 'dabba' ? 'Dabba' : ch.label}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold truncate" style={{ color: '#2D2422' }}>{s.customer_name || '—'} <span className="font-normal text-gray-400">· {s.ref || 'no ref'}</span></span>
          <span className="block text-xs text-gray-500 truncate">{fmtDT(s.at)} · {items || 'no items listed'}</span>
        </span>
        <span className="text-right shrink-0">
          <span className={`block text-sm font-bold ${out ? 'line-through' : ''}`} style={{ color: '#2D2422' }}>{gbp(s.net)}</span>
          {s.discount > 0 && <span className="block text-[11px]" style={{ color: '#B45309' }}>−{gbp(s.discount)}</span>}
        </span>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t text-sm space-y-2" style={{ borderColor: '#F0EAE2' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
            <span>Gross <b>{gbp(s.gross)}</b></span><span>Discount <b>{gbp(s.discount)}</b></span>
            <span>Net sale <b>{gbp(s.net)}</b></span><span>Delivery / fees <b>{gbp(s.charges)}</b></span>
            <span>Customer paid <b>{gbp(s.paid)}</b></span><span>Platform fees <b>{gbp(s.fees)}</b></span>
            <span>Payout <b>{gbp(s.payout)}</b></span><span>{METHOD[s.payment_method] || s.payment_method} · {STATUS[s.status] || s.status}</span>
          </div>
          {s.items?.length > 0 && (
            <ul className="text-xs text-gray-600">{s.items.map((i, k) => <li key={k}>{i.qty} × {i.name} @ {gbp(i.price)}</li>)}</ul>
          )}
          <p className="text-xs text-gray-600">
            {s.fulfilment === 'delivery' ? 'Delivery' : 'Collection'}{s.address ? ` · ${s.address}` : ''}
            {s.customer_email ? ` · ${s.customer_email}` : ''}{s.coupon_code ? ` · coupon ${s.coupon_code}` : ''}{s.notes ? ` · ${s.notes}` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {s.customer_phone && <a href={`tel:${s.customer_phone}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: '1px solid #e0d9d0', color: '#1565C0' }}><Phone size={12} /> {s.customer_phone}</a>}
            {wa.length >= 10 && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: '1px solid #e0d9d0', color: '#166534' }}><MessageCircle size={12} /> WhatsApp</a>}
            {s.editable ? (
              <>
                <button onClick={() => onEdit(s)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: '1px solid #e0d9d0', color: P }}><Pencil size={12} /> Edit</button>
                <button onClick={() => onDelete(s)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: '1px solid #FECACA', color: '#B91C1C' }}><Trash2 size={12} /> Delete</button>
              </>
            ) : <span className="text-xs text-gray-400 self-center">Website sale — change it from Orders</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── The tab ─────────────────────────────────────────────── */
export default function SalesTab() {
  const [range, setRange] = useState('month');
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [channel, setChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(null);          // 'add' | 'import' | sale being edited
  const [menu, setMenu] = useState([]);
  const [askDelete, setAskDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const params = useCallback(() => {
    const [s, e] = rangeFor(range, from, to);
    return { start: s.toISOString(), end: e.toISOString(), channel };
  }, [range, from, to, channel]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await api.get('/sales', { params: params() })).data); }
    catch (ex) { setError(errText(ex, 'Could not load sales.')); }
    finally { setLoading(false); }
  }, [params]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/menu').then(r => setMenu(r.data || [])).catch(() => {}); }, []);

  const download = async () => {
    try {
      const r = await api.get('/sales/export.csv', { params: params(), responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url; a.download = `svadista-sales-${params().start.slice(0, 10)}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('Could not download the spreadsheet.'); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/sales/${askDelete.id}`); setAskDelete(null); await load(); }
    catch (ex) { setError(errText(ex, 'Could not delete the sale.')); setAskDelete(null); }
    finally { setBusy(false); }
  };

  const done = (msg) => { setMode(null); setNote(typeof msg === 'string' ? msg : ''); load(); };
  const t = data?.totals;
  const q = search.trim().toLowerCase();
  const sales = (data?.sales || []).filter(s => !q || [s.customer_name, s.customer_phone, s.customer_email, s.ref, s.items_text, ...(s.items || []).map(i => i.name)]
    .some(v => (v || '').toLowerCase().includes(q)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setMode('add'); setNote(''); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: P }}><Plus size={14} /> WhatsApp order</button>
        <button onClick={() => { setMode('import'); setNote(''); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white" style={{ border: '1px solid #e0d9d0', color: P }}><Upload size={14} /> Import Deliveroo</button>
        <button onClick={download} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white" style={{ border: '1px solid #e0d9d0', color: '#5C4B47' }}><Download size={14} /> Spreadsheet</button>
        <button onClick={load} disabled={loading} aria-label="Refresh" className="px-3 py-2 rounded-lg bg-white" style={{ border: '1px solid #e0d9d0', color: '#5C4B47' }}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {note && <p className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#F0FDF4', color: '#166534' }}>{note}</p>}
      {mode === 'add' && <SaleForm menu={menu} onDone={done} onCancel={() => setMode(null)} />}
      {mode === 'import' && <ImportPanel onDone={done} onCancel={() => setMode(null)} />}
      {mode && typeof mode === 'object' && <SaleForm key={mode.id} initial={mode} menu={menu} onDone={done} onCancel={() => setMode(null)} />}

      <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: '1px solid #EDE7DF' }}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {RANGES.map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border"
              style={{ backgroundColor: range === v ? P : 'white', color: range === v ? 'white' : '#5C4B47', borderColor: range === v ? P : '#E5E7EB' }}>{l}</button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="flex gap-2 items-center text-sm">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inp} style={inpStyle} aria-label="From" />
            <span className="text-gray-400">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inp} style={inpStyle} aria-label="To" />
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'website', 'whatsapp', 'deliveroo', 'phone', 'walk_in', 'other'].map(c => (
            <button key={c} onClick={() => setChannel(c)} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border"
              style={{ backgroundColor: channel === c ? '#2D2422' : 'white', color: channel === c ? 'white' : '#5C4B47', borderColor: channel === c ? '#2D2422' : '#E5E7EB' }}>{c === 'all' ? 'All channels' : CHANNEL[c].label}</button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: '#B91C1C' }}>{error}</p>}

      {t && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['Orders', t.orders], ['Gross sales', gbp(t.gross)], ['Discounts', gbp(t.discount)], ['Net sales', gbp(t.net)],
              ['Delivery & fees charged', gbp(t.charges)], ['Customers paid', gbp(t.paid)], ['Platform fees', gbp(t.fees)], ['Payout', gbp(t.payout)]].map(([l, v]) => (
              <div key={l} className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p className="text-xl font-bold" style={{ color: l === 'Net sales' ? P : '#1a1a1a' }}>{v}</p>
                <p className="text-xs font-medium text-gray-500">{l}</p>
              </div>
            ))}
          </div>
          {Object.keys(t.by_channel).length > 1 && (
            <div className="bg-white rounded-xl overflow-x-auto" style={{ border: '1px solid #EDE7DF' }}>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-500">
                  {['Channel', 'Orders', 'Gross', 'Discount', 'Net', 'Fees', 'Payout'].map(h => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
                </tr></thead>
                <tbody>{Object.entries(t.by_channel).map(([c, v]) => (
                  <tr key={c} className="border-t" style={{ borderColor: '#F0EAE2' }}>
                    <td className="px-3 py-2 font-semibold">{CHANNEL[c]?.label || c}</td><td className="px-3 py-2">{v.orders}</td>
                    <td className="px-3 py-2">{gbp(v.gross)}</td><td className="px-3 py-2">{gbp(v.discount)}</td><td className="px-3 py-2 font-semibold">{gbp(v.net)}</td>
                    <td className="px-3 py-2">{gbp(v.fees)}</td><td className="px-3 py-2">{gbp(v.payout)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-gray-500">Net sales = gross − discounts. Payout = what customers paid − platform fees. Cancelled and refunded sales are listed but not counted.</p>
        </>
      )}

      <input type="search" placeholder="Search name, phone, dish or order no." value={search} onChange={e => setSearch(e.target.value)} className={inp} style={inpStyle} />
      <div className="space-y-2">
        {sales.map(s => <SaleRow key={s.id} s={s} onEdit={(x) => { setMode(x); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={setAskDelete} />)}
        {data && !sales.length && <p className="text-sm text-gray-500 text-center py-8">No sales in this period.</p>}
      </div>

      {askDelete && (
        <ConfirmAction title="Delete this sale?" danger confirmLabel="Yes, delete it" busy={busy} onCancel={() => setAskDelete(null)} onConfirm={remove}
          rows={[['Sale', `${CHANNEL[askDelete.channel]?.label} · ${askDelete.customer_name || '—'} · ${gbp(askDelete.net)}`],
                 ['When', fmtDT(askDelete.at)], ['Undo', 'cannot be undone (a Deliveroo order comes back if you import it again)']]} />
      )}
    </div>
  );
}
