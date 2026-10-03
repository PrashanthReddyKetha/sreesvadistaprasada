'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Copy, Pause, Play, Trash2, X, Tag, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/api';

/* Admin › Coupons — create single-use / multi-use codes with every rule, batch-generate, pause, delete, see redemptions. */

const P = '#800020';
const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;
const fmtDT = (iso) => iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
/** <input type="datetime-local"> value → ISO (UTC) and back */
const toISO = (local) => local ? new Date(local).toISOString() : null;
const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const STATE = {
  active:    { label: 'Active',    bg: '#E8F5E9', color: '#2E7D32' },
  scheduled: { label: 'Scheduled', bg: '#E3F2FD', color: '#1565C0' },
  paused:    { label: 'Paused',    bg: '#FFF3E0', color: '#E65100' },
  expired:   { label: 'Expired',   bg: '#F5F5F5', color: '#757575' },
  used_up:   { label: 'Used up',   bg: '#F5F5F5', color: '#757575' },
};

const BLANK = {
  code: '', name: '', description: '', scope: 'orders', kind: 'multi',
  discount_type: 'percent', discount_value: '', max_discount: '', min_subtotal: '',
  starts_at: '', expires_at: '', max_redemptions: '', per_customer_limit: '1',
  first_order_only: false, order_type: 'any', plan: 'any', box_type: 'any',
  assigned_email: '', listed: true, status: 'active', internal_note: '',
  // batch only
  count: '20', prefix: '',
};

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="text-xs font-semibold block mb-1" style={{ color: '#2D2422' }}>{label}</span>
    {children}
    {hint && <span className="text-[11px] block mt-1" style={{ color: '#7A5C50' }}>{hint}</span>}
  </label>
);
const inp = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none';
const inpStyle = { border: '1px solid #e0d9d0', backgroundColor: 'white' };

const Toggle = ({ value, onChange, options }) => (
  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e0d9d0' }}>
    {options.map(([v, l]) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        className="flex-1 px-3 py-2 text-xs font-semibold"
        style={{ backgroundColor: value === v ? P : 'white', color: value === v ? 'white' : '#5C4B47' }}>{l}</button>
    ))}
  </div>
);

/* ── Create / edit form ─────────────────────────────────── */
function CouponForm({ initial, mode, onDone, onCancel }) {
  const [f, setF] = useState({ ...BLANK, ...initial });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));
  const isBatch = mode === 'batch';
  const isEdit = mode === 'edit';
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const body = {
      code: f.code || undefined, name: f.name, description: f.description, scope: f.scope,
      kind: isBatch ? 'single' : f.kind, discount_type: f.discount_type,
      discount_value: f.discount_type === 'free_delivery' ? null : num(f.discount_value),
      max_discount: f.discount_type === 'percent' ? num(f.max_discount) : null,
      min_subtotal: num(f.min_subtotal),
      starts_at: toISO(f.starts_at), expires_at: toISO(f.expires_at),
      max_redemptions: f.kind === 'multi' ? num(f.max_redemptions) : 1,
      per_customer_limit: f.kind === 'multi' ? num(f.per_customer_limit) : 1,
      first_order_only: !!f.first_order_only, order_type: f.order_type, plan: f.plan, box_type: f.box_type,
      assigned_email: f.assigned_email || null, listed: !!f.listed, status: f.status, internal_note: f.internal_note,
    };
    try {
      if (isBatch) {
        const r = await api.post('/admin/coupons/batch', { ...body, count: Number(f.count), prefix: f.prefix });
        setResult(r.data);
      } else if (isEdit) {
        await api.patch(`/admin/coupons/${initial.id}`, body);
        onDone();
      } else {
        await api.post('/admin/coupons', body);
        onDone();
      }
    } catch (ex) {
      const d = ex.response?.data?.detail;
      setErr(typeof d === 'string' ? d : Array.isArray(d) ? d.map(x => x.msg).join('; ') : 'Could not save the coupon.');
    } finally { setBusy(false); }
  };

  if (result) return (
    <div className="bg-white rounded-xl p-5 space-y-3" style={{ border: '1px solid #e0d9d0' }}>
      <p className="font-bold" style={{ color: P }}>{result.count} codes generated</p>
      <textarea readOnly rows={Math.min(12, result.count)} value={result.codes.join('\n')} className={inp} style={{ ...inpStyle, fontFamily: 'monospace' }} />
      <div className="flex gap-2">
        <button onClick={() => navigator.clipboard.writeText(result.codes.join('\n'))} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg" style={{ backgroundColor: '#F9F6EE', color: P }}><Copy size={13} /> Copy all</button>
        <button onClick={onDone} className="px-4 py-2 text-xs font-semibold text-white rounded-lg" style={{ backgroundColor: P }}>Done</button>
      </div>
    </div>
  );

  const scopeIsOrders = f.scope === 'orders';
  return (
    <form onSubmit={submit} className="bg-white rounded-xl p-5 space-y-5" style={{ border: '1px solid #e0d9d0' }}>
      <div className="flex items-center justify-between">
        <p className="font-bold" style={{ color: P }}>{isBatch ? 'Generate a batch of single-use codes' : isEdit ? `Edit ${initial.code}` : 'New coupon'}</p>
        <button type="button" onClick={onCancel} className="text-gray-400"><X size={16} /></button>
      </div>

      {/* Scope — hard wall */}
      <Field label="Where can it be used?" hint="A coupon works in one place only. Dabba Wala codes are refused at checkout and vice versa.">
        <Toggle value={f.scope} onChange={set('scope')} options={[['orders', 'Single orders'], ['subscriptions', 'Dabba Wala plans']]} />
      </Field>

      <div className="grid md:grid-cols-2 gap-4">
        {!isBatch && (
          <Field label="Type">
            <Toggle value={f.kind} onChange={set('kind')} options={[['multi', 'Shared code (many customers)'], ['single', 'Exclusive (one use, then dead)']]} />
          </Field>
        )}
        {isBatch ? (
          <>
            <Field label="How many codes" hint="Up to 500 at once"><input type="number" min="1" max="500" value={f.count} onChange={set('count')} className={inp} style={inpStyle} required /></Field>
            <Field label="Code prefix" hint="e.g. FLYER → FLYER7K2M9X4P"><input value={f.prefix} onChange={e => setF(p => ({ ...p, prefix: e.target.value.toUpperCase() }))} className={inp} style={inpStyle} maxLength={8} /></Field>
          </>
        ) : (
          <Field label="Code" hint={isEdit ? 'Codes can’t be changed after creation' : 'Leave blank to generate one. Case and spaces are ignored.'}>
            <input value={f.code} onChange={e => setF(p => ({ ...p, code: e.target.value.toUpperCase() }))} className={inp} style={{ ...inpStyle, letterSpacing: '0.08em' }} placeholder="e.g. DIWALI10" disabled={isEdit} />
          </Field>
        )}
        <Field label="Customer-facing name" hint="Shown on the offer card and the receipt line">
          <input value={f.name} onChange={set('name')} className={inp} style={inpStyle} placeholder="10% off your first order" required maxLength={80} />
        </Field>
        <Field label="Short description (optional)">
          <input value={f.description} onChange={set('description')} className={inp} style={inpStyle} placeholder="A little welcome from our kitchen" maxLength={140} />
        </Field>
      </div>

      {/* Discount */}
      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Discount">
          <select value={f.discount_type} onChange={set('discount_type')} className={inp} style={inpStyle}>
            <option value="percent">Percentage off</option>
            <option value="fixed">Fixed amount off (£)</option>
            <option value="free_delivery">Free delivery</option>
          </select>
        </Field>
        {f.discount_type !== 'free_delivery' && (
          <Field label={f.discount_type === 'percent' ? 'Percent (%)' : 'Amount (£)'}>
            <input type="number" step="0.01" min="0.01" max={f.discount_type === 'percent' ? 100 : undefined} value={f.discount_value} onChange={set('discount_value')} className={inp} style={inpStyle} required />
          </Field>
        )}
        {f.discount_type === 'percent' && (
          <Field label="Max saving (£, optional)" hint="Caps the percentage, e.g. 10% up to £5">
            <input type="number" step="0.01" min="0" value={f.max_discount} onChange={set('max_discount')} className={inp} style={inpStyle} />
          </Field>
        )}
        <Field label={scopeIsOrders ? 'Minimum basket (£, optional)' : 'Minimum plan price (£, optional)'} hint={scopeIsOrders ? 'Food total before fees. Orders already need £15 minimum.' : 'Weekly is £75, monthly £250'}>
          <input type="number" step="0.01" min="0" value={f.min_subtotal} onChange={set('min_subtotal')} className={inp} style={inpStyle} />
        </Field>
      </div>

      {/* Validity */}
      <div className="grid md:grid-cols-4 gap-4">
        <Field label="Starts (optional)"><input type="datetime-local" value={f.starts_at} onChange={set('starts_at')} className={inp} style={inpStyle} /></Field>
        <Field label="Expires (optional)"><input type="datetime-local" value={f.expires_at} onChange={set('expires_at')} className={inp} style={inpStyle} /></Field>
        {f.kind === 'multi' && !isBatch && (
          <>
            <Field label="Total uses (optional)" hint="Blank = unlimited"><input type="number" min="1" value={f.max_redemptions} onChange={set('max_redemptions')} className={inp} style={inpStyle} /></Field>
            <Field label="Uses per customer" hint="Blank = unlimited. Matched by account and email."><input type="number" min="1" value={f.per_customer_limit} onChange={set('per_customer_limit')} className={inp} style={inpStyle} /></Field>
          </>
        )}
      </div>

      {/* Who / what */}
      <div className="grid md:grid-cols-3 gap-4">
        {scopeIsOrders ? (
          <Field label="Order type">
            <select value={f.order_type} onChange={set('order_type')} className={inp} style={inpStyle}>
              <option value="any">Delivery or collection</option><option value="delivery">Delivery only</option><option value="takeaway">Collection only</option>
            </select>
          </Field>
        ) : (
          <>
            <Field label="Plan">
              <select value={f.plan} onChange={set('plan')} className={inp} style={inpStyle}>
                <option value="any">Weekly or monthly</option><option value="weekly">Weekly only</option><option value="monthly">Monthly only</option>
              </select>
            </Field>
            <Field label="Box">
              <select value={f.box_type} onChange={set('box_type')} className={inp} style={inpStyle}>
                <option value="any">Prasada or Svadista</option><option value="prasada">Prasada only</option><option value="svadista">Svadista only</option>
              </select>
            </Field>
          </>
        )}
        {!isBatch && (
          <Field label="Exclusive to one customer (email, optional)" hint="Only this customer can use it. It shows as “Just for you” in their checkout.">
            <input type="email" value={f.assigned_email} onChange={set('assigned_email')} className={inp} style={inpStyle} placeholder="customer@example.com" />
          </Field>
        )}
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm" style={{ color: '#2D2422' }}>
          <input type="checkbox" checked={!!f.first_order_only} onChange={set('first_order_only')} className="accent-[#800020]" /> First-time customers only
        </label>
        {!isBatch && f.kind === 'multi' && (
          <label className="flex items-center gap-2 text-sm" style={{ color: '#2D2422' }}>
            <input type="checkbox" checked={!!f.listed} onChange={set('listed')} className="accent-[#800020]" /> Show in the checkout “Offers for you” list
            <span className="text-[11px]" style={{ color: '#7A5C50' }}>(untick for a code that only works when typed)</span>
          </label>
        )}
        {isEdit && (
          <label className="flex items-center gap-2 text-sm" style={{ color: '#2D2422' }}>
            <input type="checkbox" checked={f.status === 'paused'} onChange={e => setF(p => ({ ...p, status: e.target.checked ? 'paused' : 'active' }))} className="accent-[#800020]" /> Paused
          </label>
        )}
      </div>

      <Field label="Internal note (optional, admin only)"><input value={f.internal_note} onChange={set('internal_note')} className={inp} style={inpStyle} placeholder="Why this code exists" /></Field>

      {err && <p className="text-sm font-medium px-3 py-2 rounded-lg" style={{ backgroundColor: '#FFF0F0', color: P }}>{err}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ color: '#5C4B47', border: '1px solid #e0d9d0' }}>Cancel</button>
        <button type="submit" disabled={busy} className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ backgroundColor: P }}>
          {busy ? 'Saving…' : isBatch ? 'Generate codes' : isEdit ? 'Save changes' : 'Create coupon'}
        </button>
      </div>
    </form>
  );
}

/* ── Redemption log ─────────────────────────────────────── */
function Redemptions({ coupon }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get(`/admin/coupons/${coupon.id}/redemptions`).then(r => setRows(r.data)).catch(() => setRows([])); }, [coupon.id]);
  if (!rows) return <p className="text-xs py-2" style={{ color: '#7A5C50' }}>Loading…</p>;
  if (!rows.length) return <p className="text-xs py-2" style={{ color: '#7A5C50' }}>Not used yet.</p>;
  return (
    <table className="w-full text-xs mt-2">
      <thead><tr style={{ color: '#7A5C50' }}><th className="text-left py-1">When</th><th className="text-left py-1">Customer</th><th className="text-left py-1">Saving</th><th className="text-left py-1">Ref</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: '1px solid #f0ebe6', color: '#2D2422' }}>
            <td className="py-1.5">{fmtDT(r.created_at)}</td>
            <td className="py-1.5">{r.customer_name || '—'} <span style={{ color: '#7A5C50' }}>{r.email_key || ''}</span></td>
            <td className="py-1.5">{fmt(r.discount)}{r.over_cap && <span className="ml-1 text-[10px] font-bold" style={{ color: '#E65100' }}>over cap</span>}</td>
            <td className="py-1.5 font-mono" style={{ color: '#7A5C50' }}>{(r.ref_id || '').slice(0, 8)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Main tab ───────────────────────────────────────────── */
export default function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);       // null | 'create' | 'batch' | {edit}
  const [filter, setFilter] = useState('all');  // all | orders | subscriptions
  const [stateFilter, setStateFilter] = useState('live');  // live | all
  const [openId, setOpenId] = useState(null);
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/admin/coupons'); setCoupons(r.data); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (c, patch) => { await api.patch(`/admin/coupons/${c.id}`, patch); load(); };
  const remove = async (c) => {
    if (!confirm(`Delete ${c.code}? Customers won't be able to use it any more. Its redemption history stays.`)) return;
    await api.delete(`/admin/coupons/${c.id}`); load();
  };
  const copy = (code) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 1200); };

  const shown = coupons
    .filter(c => filter === 'all' || c.scope === filter)
    .filter(c => stateFilter === 'all' || ['active', 'scheduled', 'paused'].includes(c.state));
  const totals = {
    live: coupons.filter(c => c.state === 'active').length,
    uses: coupons.reduce((s, c) => s + (c.redemptions_count || 0), 0),
    given: coupons.reduce((s, c) => s + (c.total_discount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Coupons</h2>
          <p className="text-sm" style={{ color: '#7A5C50' }}>{totals.live} live · {totals.uses} redemptions · {fmt(totals.given)} given away</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode('batch')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg" style={{ backgroundColor: '#F9F6EE', color: P }}><Layers size={14} /> Batch of codes</button>
          <button onClick={() => setMode('create')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: P }}><Plus size={14} /> New coupon</button>
        </div>
      </div>

      {mode && (
        <CouponForm
          mode={typeof mode === 'object' ? 'edit' : mode}
          initial={typeof mode === 'object' ? {
            ...mode.edit,
            discount_value: mode.edit.discount_value ?? '', max_discount: mode.edit.max_discount ?? '', min_subtotal: mode.edit.min_subtotal ?? '',
            max_redemptions: mode.edit.max_redemptions ?? '', per_customer_limit: mode.edit.per_customer_limit ?? '',
            starts_at: toLocal(mode.edit.starts_at), expires_at: toLocal(mode.edit.expires_at), assigned_email: mode.edit.assigned_email || '',
          } : {}}
          onDone={() => { setMode(null); load(); }}
          onCancel={() => setMode(null)}
        />
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <Toggle value={filter} onChange={setFilter} options={[['all', 'All'], ['orders', 'Single orders'], ['subscriptions', 'Dabba Wala']]} />
        <Toggle value={stateFilter} onChange={setStateFilter} options={[['live', 'Live & upcoming'], ['all', 'Everything']]} />
        <button onClick={load} className="ml-auto p-2 rounded-lg" style={{ color: '#7A5C50' }}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e0d9d0' }}>
        {shown.length === 0 ? (
          <p className="text-center text-sm py-14" style={{ color: '#7A5C50' }}>{loading ? 'Loading…' : 'No coupons here yet.'}</p>
        ) : shown.map(c => {
          const st = STATE[c.state] || STATE.active;
          const cap = c.kind === 'single' ? 1 : c.max_redemptions;
          const open = openId === c.id;
          return (
            <div key={c.id} style={{ borderBottom: '1px solid #f0ebe6' }}>
              <div className="px-4 py-3 flex items-center gap-3 flex-wrap cursor-pointer hover:bg-gray-50" onClick={() => setOpenId(open ? null : c.id)}>
                <button onClick={e => { e.stopPropagation(); copy(c.code); }} title="Copy code"
                  className="font-mono font-bold text-sm px-2 py-1 rounded flex items-center gap-1.5" style={{ backgroundColor: '#F9F6EE', color: P, letterSpacing: '0.06em' }}>
                  <Tag size={12} /> {c.code} {copied === c.code ? <span className="text-[10px] font-sans" style={{ color: '#2E7D32' }}>copied</span> : <Copy size={11} className="opacity-50" />}
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.scope === 'orders' ? '#FBF3DC' : '#E1F5EE', color: c.scope === 'orders' ? '#B8860B' : '#0F6E56' }}>
                  {c.scope === 'orders' ? 'Single orders' : 'Dabba Wala'}
                </span>
                {c.kind === 'single' && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F3E8FF', color: '#6B21A8' }}>Exclusive</span>}
                {c.assigned_email && <span className="text-[10px]" style={{ color: '#7A5C50' }}>for {c.assigned_email}</span>}
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-semibold" style={{ color: '#2D2422' }}>{c.name} <span className="font-normal" style={{ color: '#7A5C50' }}>· {c.label}</span></p>
                  <p className="text-xs" style={{ color: '#7A5C50' }}>
                    {c.redemptions_count || 0}{cap ? ` / ${cap}` : ''} used · {fmt(c.total_discount)} given
                    {c.expires_at ? ` · expires ${fmtDT(c.expires_at)}` : ''}{c.starts_at && c.state === 'scheduled' ? ` · starts ${fmtDT(c.starts_at)}` : ''}
                    {c.min_subtotal ? ` · min ${fmt(c.min_subtotal)}` : ''}{c.first_order_only ? ' · first order only' : ''}{!c.listed && c.kind === 'multi' ? ' · hidden (type-in only)' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  {!['expired', 'used_up'].includes(c.state) && (
                    <button onClick={() => act(c, { status: c.status === 'paused' ? 'active' : 'paused' })} title={c.status === 'paused' ? 'Resume' : 'Pause'}
                      className="p-2 rounded-lg" style={{ backgroundColor: '#F9F6EE', color: P }}>{c.status === 'paused' ? <Play size={13} /> : <Pause size={13} />}</button>
                  )}
                  <button onClick={() => setMode({ edit: c })} className="px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ backgroundColor: '#F9F6EE', color: P }}>Edit</button>
                  <button onClick={() => remove(c)} title="Delete" className="p-2 rounded-lg" style={{ color: '#C62828' }}><Trash2 size={13} /></button>
                  {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </div>
              {open && (
                <div className="px-4 pb-4 pt-1" style={{ backgroundColor: '#FDFBF7' }}>
                  {c.description && <p className="text-xs mb-1" style={{ color: '#5C4B47' }}>{c.description}</p>}
                  {c.internal_note && <p className="text-xs italic mb-1" style={{ color: '#7A5C50' }}>Note: {c.internal_note}</p>}
                  <p className="text-xs" style={{ color: '#7A5C50' }}>Created {fmtDT(c.created_at)} by {c.created_by}{c.batch_id ? ' · part of a batch' : ''}</p>
                  <Redemptions coupon={c} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
