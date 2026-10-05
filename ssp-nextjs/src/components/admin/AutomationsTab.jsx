'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, X, Eye, Send, Power } from 'lucide-react';
import api from '@/api';

/* Admin › Automations — messages the site can send by itself. Each is off until switched on,
   and can be previewed (who, and the exact message) without sending anything. */

const P = '#800020';
const card = { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;
const when = (iso) => iso ? new Date(iso + (/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? '' : 'Z')).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

function Preview({ automation, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    api.get(`/admin/automations/${automation.id}/preview`).then(r => { if (live) setData(r.data); }).catch(() => { if (live) setError('Could not load the preview.'); });
    return () => { live = false; };
  }, [automation.id]);
  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Automation preview" data-notrack>
      <button className="flex-1 bg-black/40" onClick={onClose} aria-label="Close preview" />
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b flex items-start gap-3" style={{ borderColor: '#f0ebe6' }}>
          <div className="flex-1"><h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: P }}>{automation.name}</h3>
            <p className="text-xs text-gray-500">Preview only. Nothing is sent from this screen.</p></div>
          <button onClick={onClose} className="p-2 rounded-lg border" style={{ borderColor: '#e0d9d0' }} aria-label="Close"><X size={16} /></button>
        </div>
        {error && <p className="p-6 text-sm" style={{ color: '#B91C1C' }}>{error}</p>}
        {!data && !error && <p className="p-6 text-sm text-gray-400">Loading…</p>}
        {data && (
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">The message</h4>
              <p className="text-sm mb-2"><span className="text-gray-500">Subject:</span> <b>{data.subject}</b></p>
              <iframe title="Message preview" sandbox="" srcDoc={data.html} className="w-full rounded-lg border" style={{ height: 460, borderColor: '#e0d9d0' }} />
              <p className="text-xs text-gray-400 mt-1">Every message also carries an unsubscribe link, added when it is sent.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Would receive it now ({data.would_send.length})</h4>
              {data.would_send.length === 0 ? <p className="text-sm text-gray-400">No one qualifies at the moment.</p> : (
                <ul className="text-sm space-y-1">{data.would_send.map(p => <li key={p.email}>{p.name || '—'} <span className="text-gray-500">· {p.email}</span></li>)}</ul>
              )}
            </div>
            {data.held_back.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Qualify, but held back ({data.held_back.length})</h4>
                <ul className="text-sm space-y-1">{data.held_back.map(p => <li key={p.email}>{p.name || '—'} <span className="text-gray-500">· {p.email} — {p.why}</span></li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Confirm({ automation, rules, onCancel, onConfirm, busy }) {
  const turningOn = !automation.enabled;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label="Confirm change" data-notrack>
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-3">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: P }}>{turningOn ? 'Switch this on?' : 'Switch this off?'}</h3>
        <p className="text-sm"><b>{automation.name}</b></p>
        <dl className="text-sm space-y-1.5">
          <div className="flex gap-2"><dt className="text-gray-500 w-28 shrink-0">Now</dt><dd>{automation.enabled ? 'On' : 'Off'}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-28 shrink-0">After</dt><dd className="font-semibold">{turningOn ? 'On' : 'Off'}</dd></div>
          {turningOn ? (<>
            <div className="flex gap-2"><dt className="text-gray-500 w-28 shrink-0">Who</dt><dd>{automation.would_send_now} customer{automation.would_send_now === 1 ? '' : 's'} qualify right now; others will as they come to qualify</dd></div>
            <div className="flex gap-2"><dt className="text-gray-500 w-28 shrink-0">When</dt><dd>Within about 30 minutes, between {rules.hours}</dd></div>
            <div className="flex gap-2"><dt className="text-gray-500 w-28 shrink-0">Limits</dt><dd>At most {rules.daily_cap} a day; no customer gets more than one automatic message in {rules.quiet_days} days; never to anyone who unsubscribed</dd></div>
            <div className="flex gap-2"><dt className="text-gray-500 w-28 shrink-0">Offer</dt><dd>{automation.coupon_code ? `Includes the code ${automation.coupon_code}` : 'No offer in the message'}</dd></div>
          </>) : (
            <div className="flex gap-2"><dt className="text-gray-500 w-28 shrink-0">Effect</dt><dd>No more of these messages are sent. Messages already sent are not affected.</dd></div>
          )}
        </dl>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Leave as it is</button>
          <button onClick={onConfirm} disabled={busy} className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50" style={{ backgroundColor: turningOn ? '#2E7D32' : P, color: '#fff' }}>
            {turningOn ? 'Yes, switch on' : 'Yes, switch off'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AutomationsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await api.get('/admin/automations')).data); }
    catch { setError('Could not load the automations. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const change = async (a, body, done) => {
    setBusy(true); setNote('');
    try { await api.put(`/admin/automations/${a.id}`, body); setNote(done); await load(); }
    catch (e) { setNote(e.response?.data?.detail || 'That did not work. Please try again.'); }
    finally { setBusy(false); setConfirm(null); }
  };
  const test = async (a) => {
    setBusy(true); setNote('');
    try { const r = await api.post(`/admin/automations/${a.id}/test`); setNote(`A test of "${a.name}" was sent to ${r.data.sent_to}.`); }
    catch (e) { setNote(e.response?.data?.detail || 'The test could not be sent.'); }
    finally { setBusy(false); }
  };

  if (loading && !data) return <p className="text-center text-gray-400 py-16">Loading…</p>;
  if (error) return <p className="text-center py-16" style={{ color: '#B91C1C' }}>{error} <button onClick={load} className="underline ml-2">Retry</button></p>;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <p className="text-sm text-gray-600 flex-1">Messages the site can send by itself. Each one is <b>off</b> until you switch it on. Use <b>Preview</b> to see exactly who would get it and what it says, and <b>Send me a test</b> to read it in your own inbox first.</p>
        <button onClick={load} className="p-2 rounded-lg border" style={{ borderColor: '#e0d9d0' }} aria-label="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      {note && <p className="text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: '#FFF8E1', color: '#5C4B47' }} role="status">{note}</p>}

      {data.automations.map(a => (
        <div key={a.id} className="bg-white rounded-xl p-5" style={card}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-[220px]">
              <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: P }}>{a.name}
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold align-middle" style={a.enabled ? { backgroundColor: '#E8F5E9', color: '#2E7D32' } : { backgroundColor: '#F5F5F5', color: '#616161' }}>{a.enabled ? 'On' : 'Off'}</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1"><span className="text-gray-500">Who:</span> {a.who}</p>
              <p className="text-sm text-gray-600"><span className="text-gray-500">What:</span> {a.what}</p>
              {a.changed_at && <p className="text-xs text-gray-400 mt-1">Last changed by {a.changed_by} on {when(a.changed_at)}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setPreview(a)} className="px-3 py-2 rounded-lg text-sm font-semibold border flex items-center gap-1.5" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}><Eye size={15} /> Preview</button>
              <button onClick={() => test(a)} disabled={busy} className="px-3 py-2 rounded-lg text-sm font-semibold border flex items-center gap-1.5 disabled:opacity-50" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}><Send size={15} /> Send me a test</button>
              <button onClick={() => setConfirm(a)} className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5" style={{ backgroundColor: a.enabled ? P : '#2E7D32', color: '#fff' }}><Power size={15} /> {a.enabled ? 'Switch off' : 'Switch on'}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {[['Would get it now', a.would_send_now, a.held_back_now ? `${a.held_back_now} held back` : ''],
              ['Sent so far', a.results.sent, a.results.last_sent ? `last ${when(a.results.last_sent)}` : ''],
              ['Ordered afterwards', a.results.ordered_after, `within ${a.results.window_days} days`],
              ['Income afterwards', fmt(a.results.income_after), '']].map(([l, v, n]) => (
              <div key={l} className="rounded-lg p-3" style={{ backgroundColor: '#FDFBF7' }}><p className="text-xs text-gray-500">{l}</p><p className="text-lg font-bold" style={{ color: P }}>{v}</p>{n && <p className="text-xs text-gray-400">{n}</p>}</div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
            <label htmlFor={`code-${a.id}`} className="text-gray-500">Offer code in the message (optional)</label>
            <input id={`code-${a.id}`} value={codes[a.id] ?? a.coupon_code ?? ''} onChange={e => setCodes({ ...codes, [a.id]: e.target.value.toUpperCase() })}
              placeholder="none" className="px-3 py-1.5 border rounded-lg w-36 uppercase" style={{ borderColor: '#e0d9d0' }} />
            <button onClick={() => change(a, (codes[a.id] ?? '').trim() ? { coupon_code: codes[a.id].trim() } : { clear_coupon: true }, 'Offer code saved.')} disabled={busy || codes[a.id] === undefined}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border disabled:opacity-40" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Save code</button>
            <span className="text-xs text-gray-400">The code must already exist under Coupons.</span>
          </div>
        </div>
      ))}

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5" style={card}>
          <h3 className="font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Already running</h3>
          <ul className="text-sm space-y-1.5">{data.built_in.map(b => <li key={b.name}><b>{b.name}</b> <span className="text-gray-600">— {b.what}</span></li>)}</ul>
        </div>
        <div className="bg-white rounded-xl p-5" style={card}>
          <h3 className="font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Not possible yet</h3>
          <ul className="text-sm space-y-1.5">{data.unavailable.map(u => <li key={u.id}><b>{u.name}</b> <span className="text-gray-600">— {u.why}</span></li>)}</ul>
        </div>
      </div>
      <p className="text-xs text-gray-400">Limits that always apply: at most {data.rules.daily_cap} messages a day from each automation; no customer receives more than one automatic message in {data.rules.quiet_days} days; sent only between {data.rules.hours}; never to anyone who has unsubscribed.</p>

      {preview && <Preview automation={preview} onClose={() => setPreview(null)} />}
      {confirm && <Confirm automation={confirm} rules={data.rules} busy={busy} onCancel={() => setConfirm(null)}
        onConfirm={() => change(confirm, { enabled: !confirm.enabled }, `"${confirm.name}" is now ${confirm.enabled ? 'off' : 'on'}.`)} />}
    </div>
  );
}
