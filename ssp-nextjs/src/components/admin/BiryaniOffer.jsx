'use client';
import { useCallback, useEffect, useState } from 'react';
import api from '@/api';

/** Admin › Coupons › the biryani multi-buy (backend offers.py): switch it on or off, choose when it starts and
    ends, and set its price. Times are UK time, exactly as typed. Off until the owner switches it on. */

const P = '#800020';
const STATE = {
  off:       { label: 'Off',       bg: '#F5F5F5', color: '#757575' },
  scheduled: { label: 'Scheduled', bg: '#E3F2FD', color: '#1565C0' },
  live:      { label: 'Live now',  bg: '#E8F5E9', color: '#2E7D32' },
  ended:     { label: 'Ended',     bg: '#FFF3E0', color: '#E65100' },
};
const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;
const when = (s) => new Date(s).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const field = 'w-full px-3 py-2 text-sm rounded-lg border bg-white';

export default function BiryaniOffer() {
  const [offer, setOffer] = useState(null);     // as the server holds it
  const [form, setForm] = useState(null);       // as typed
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);       // { ok, text } after a save

  const take = useCallback((data) => {
    setOffer(data);
    setForm({ enabled: !!data.enabled, starts_at: data.starts_at || '', ends_at: data.ends_at || '', price: String(data.price) });
  }, []);
  useEffect(() => { api.get('/admin/offers/multibuy').then(r => take(r.data)).catch(() => {}); }, [take]);

  if (!offer || !form) return null;
  const set = (patch) => { setForm(f => ({ ...f, ...patch })); setNote(null); };
  const save = async () => {
    setBusy(true);
    try {
      const r = await api.put('/admin/offers/multibuy', {
        enabled: form.enabled, starts_at: form.starts_at || null, ends_at: form.ends_at || null, price: Number(form.price),
      });
      take(r.data);
      setNote({ ok: true, text: 'Saved' });
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setNote({ ok: false, text: typeof detail === 'string' ? detail : 'Could not save — check the price and the times.' });
    } finally { setBusy(false); }
  };

  const st = STATE[offer.state] || STATE.off;
  const prices = offer.dishes.map(d => d.price);
  const runs = offer.state === 'off' ? 'Customers do not see it and checkout does not apply it.'
    : offer.state === 'scheduled' ? `Starts ${when(offer.starts_at)}${offer.ends_at ? `, ends ${when(offer.ends_at)}` : ', runs until you switch it off'}.`
    : offer.state === 'ended' ? `Ended ${when(offer.ends_at)}. Set a new end time to run it again.`
    : offer.ends_at ? `Running until ${when(offer.ends_at)}.` : 'Running until you switch it off.';

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'rgba(128,0,32,0.15)', backgroundColor: '#fff' }} data-testid="biryani-offer">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Biryani offer · {offer.label}</h3>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }} data-testid="biryani-offer-state">{st.label}</span>
      </div>
      <p className="text-sm" style={{ color: '#7A5C50' }}>
        Any two non-veg biryanis for one price. The 10% collection discount still applies on top. A coupon works on the
        rest of the basket only. {runs}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <label className="block text-xs font-semibold" style={{ color: '#7A5C50' }}>
          Offer
          <button type="button" role="switch" aria-checked={form.enabled} onClick={() => set({ enabled: !form.enabled })}
            className="mt-1 w-full px-3 py-2 text-sm font-bold rounded-lg"
            style={form.enabled ? { backgroundColor: '#2E7D32', color: '#fff' } : { backgroundColor: '#F5F5F5', color: '#757575' }}>
            {form.enabled ? 'On' : 'Off'}
          </button>
        </label>
        <label className="block text-xs font-semibold" style={{ color: '#7A5C50' }}>
          Price for two (£)
          <input type="number" min="0.01" step="0.01" inputMode="decimal" value={form.price} onChange={e => set({ price: e.target.value })}
            className={`mt-1 ${field}`} />
        </label>
        <label className="block text-xs font-semibold" style={{ color: '#7A5C50' }}>
          Starts
          <input type="datetime-local" value={form.starts_at} onChange={e => set({ starts_at: e.target.value })} className={`mt-1 ${field}`} />
        </label>
        <label className="block text-xs font-semibold" style={{ color: '#7A5C50' }}>
          Ends
          <input type="datetime-local" value={form.ends_at} onChange={e => set({ ends_at: e.target.value })} className={`mt-1 ${field}`} />
        </label>
      </div>
      <p className="text-xs" style={{ color: '#7A5C50' }}>
        Leave Starts empty to begin as soon as it is on. Leave Ends empty to run until you switch it off.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={save} disabled={busy} className="px-5 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: P, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Save offer'}
        </button>
        {note && <span className="text-sm font-semibold" role="status" style={{ color: note.ok ? '#2E7D32' : '#C62828' }}>{note.text}</span>}
      </div>

      {offer.dishes.length > 0 && (
        <p className="text-xs" style={{ color: '#7A5C50' }}>
          <b>In the offer:</b> {offer.dishes.map(d => `${d.name} ${fmt(d.price)}`).join(' · ')}.
          {' '}Two cost {fmt(2 * Math.min(...prices))}{Math.min(...prices) !== Math.max(...prices) ? `–${fmt(2 * Math.max(...prices))}` : ''} without it.
        </p>
      )}
    </div>
  );
}
