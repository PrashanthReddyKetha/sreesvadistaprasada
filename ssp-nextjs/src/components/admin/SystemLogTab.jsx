'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Undo2, Play } from 'lucide-react';
import api from '@/api';

/* Admin › System log — what the system noticed, what it decided, what it did, and whether it worked.
   Also the three switches for what it may do by itself. */

const P = '#800020';
const card = { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const when = (iso) => new Date(iso + (/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? '' : 'Z')).toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const LEVEL = {
  1: { label: 'Done automatically', bg: '#E8F5E9', color: '#2E7D32' },
  2: { label: 'Done within your limits', bg: '#E3F2FD', color: '#1565C0' },
  3: { label: 'For you to decide', bg: '#FFF8E1', color: '#8D6E00' },
};
const SWITCHES = [
  ['menu_decisions', 'Menu decisions', 'Featured dishes follow what sells; dishes with no “goes well with” get one from what is bought together.'],
  ['owner_alerts', 'Alerts to you', 'An email when visits, orders, income or failures move sharply against a normal day.'],
  ['ai_investigation', 'Ask Claude when something is unexplained', 'When a figure falls sharply and no rule explains it, Claude is shown summary figures (never customer details) and writes what it thinks happened. At most once a day, within the monthly limit below.'],
  ['customer_messages', 'Customer messages', 'Lets the system switch on the four customer messages under Automations by itself. Off until you allow it.'],
];
const show = (v, metric) => v == null ? '—' : metric === 'income' ? `£${Number(v).toFixed(2)}` : /rate|done/.test(metric) ? `${Math.round(v * 100)}%` : Math.round(v * 10) / 10;

export default function SystemLogTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await api.get('/admin/system-log')).data); }
    catch { setError('Could not load the system log. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, done) => {
    setBusy(true); setNote('');
    try { await fn(); setNote(done); await load(); }
    catch (e) { setNote(e.response?.data?.detail || 'That did not work. Please try again.'); }
    finally { setBusy(false); setConfirm(null); }
  };

  if (loading && !data) return <p className="text-center text-gray-400 py-16">Loading…</p>;
  if (error) return <p className="text-center py-16" style={{ color: '#B91C1C' }}>{error} <button onClick={load} className="underline ml-2">Retry</button></p>;

  const s = data.settings;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <p className="text-sm text-gray-600 flex-1 min-w-[240px]">
          Every night, {data.rules.runs_at}, the system measures the day, compares it with a normal day, acts where its rules allow, and writes down what it did and why.
          {s.last_run_at ? ` Last run: ${when(s.last_run_at)}.` : ' It has not run yet.'}
        </p>
        <button onClick={() => act(() => api.post('/admin/system-log/run'), 'The review has run. New entries are below.')} disabled={busy}
          className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50" style={{ backgroundColor: P, color: '#fff' }}><Play size={15} /> Run the review now</button>
        <button onClick={load} className="p-2 rounded-lg border" style={{ borderColor: '#e0d9d0' }} aria-label="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      {note && <p className="text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: '#FFF8E1', color: '#5C4B47' }} role="status">{note}</p>}

      <div className="bg-white rounded-xl p-5" style={card}>
        <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>What the system may do by itself</h3>
        <div className="space-y-3">
          {SWITCHES.map(([key, label, text]) => (
            <div key={key} className="flex items-start gap-3">
              <button onClick={() => setConfirm({ key, label, text, to: !s[key] })} role="switch" aria-checked={!!s[key]} aria-label={label}
                className="mt-0.5 w-11 h-6 rounded-full relative shrink-0 transition-colors" style={{ backgroundColor: s[key] ? '#2E7D32' : '#cfc7bd' }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: s[key] ? 22 : 2 }} />
              </button>
              <div><p className="text-sm font-semibold">{label} <span className="font-normal text-gray-500">— {s[key] ? 'on' : 'off'}</span></p><p className="text-xs text-gray-500">{text}</p></div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">It never changes prices, plan terms, refunds or the wording of your menu. Those are only ever listed below for you.</p>
      </div>

      {data.ai && (
        <div className="bg-white rounded-xl p-5" style={card}>
          <h3 className="font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: P }}>AI use this month</h3>
          <p className="text-sm text-gray-600">{data.ai.calls} of {data.ai.call_cap} calls · about ${Number(data.ai.cost_usd).toFixed(2)} of ${Number(data.ai.cost_cap_usd).toFixed(2)}.
            {data.ai.calls === 0 ? ' Nothing has needed it yet.' : ''} When a limit is reached, AI calls stop until next month; the nightly checks carry on without it.</p>
          {data.ai.recent.length > 0 && (
            <ul className="text-xs text-gray-500 mt-2 space-y-0.5">{data.ai.recent.slice(0, 6).map((u, i) => <li key={i}>{when(u.at)} — {u.purpose} — {u.outcome} — ${Number(u.cost_usd || 0).toFixed(3)}</li>)}</ul>
          )}
        </div>
      )}

      {data.latest_day && (
        <div className="bg-white rounded-xl overflow-hidden" style={card}>
          <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>
            {new Date(data.latest_day.day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} against a normal day</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#FDFBF7' }}><tr>{['Figure', 'That day', 'Usually', 'Change', ''].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody>{data.signals.map(g => (
                <tr key={g.metric} className="border-t" style={{ borderColor: '#f9f6ee' }}>
                  <td className="px-4 py-2 font-medium">{g.label}</td>
                  <td className="px-4 py-2">{show(g.current, g.metric)}</td>
                  <td className="px-4 py-2 text-gray-600">{show(g.usual, g.metric)}</td>
                  <td className="px-4 py-2 text-gray-600">{g.change == null ? '—' : `${g.change > 0 ? '+' : ''}${Math.round(g.change * 100)}%`}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: g.worse ? '#B91C1C' : g.material ? '#2E7D32' : '#9e9e9e' }}>{g.note || (g.worse ? 'Sharply worse' : g.material ? 'Sharply different' : 'Normal')}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl overflow-hidden" style={card}>
        <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>What the system did and why</h3>
        {data.entries.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">Nothing yet. The first entry appears after tonight's review, or press “Run the review now”.</p> : data.entries.map(e => {
          const lv = LEVEL[e.level] || LEVEL[1];
          const quiet = e.kind === 'nightly review' && /No action taken/.test(e.did);
          return (
            <div key={e.id} className="px-4 py-4 border-t" style={{ borderColor: '#f9f6ee', opacity: e.undone_at ? 0.6 : 1 }}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm font-semibold capitalize">{e.kind}</span>
                {!quiet && <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: lv.bg, color: lv.color }}>{lv.label}</span>}
                {e.undone_at && <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F5F5F5', color: '#616161' }}>Undone by {e.undone_by}</span>}
                <span className="text-xs text-gray-400 ml-auto">{when(e.at)}</span>
              </div>
              <p className="text-sm"><span className="text-gray-500">Noticed:</span> {e.noticed}</p>
              <p className="text-sm"><span className="text-gray-500">Decided:</span> {e.decided}</p>
              <p className="text-sm"><span className="text-gray-500">Did:</span> {e.did}</p>
              {e.outcome && <p className="text-sm mt-1"><span className="text-gray-500">Two weeks on:</span> {e.outcome}</p>}
              {e.response && <p className="text-xs mt-1 text-gray-500">You answered: <b>{e.response}</b>{e.responded_by ? ` (${e.responded_by})` : ''}</p>}
              {e.can_respond && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => act(() => api.post(`/admin/system-log/${e.id}/respond`, { answer: 'agreed' }), 'Noted: agreed.')} disabled={busy}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: '#2E7D32', color: '#fff' }}>I agree — I will deal with it</button>
                  <button onClick={() => act(() => api.post(`/admin/system-log/${e.id}/respond`, { answer: 'not now' }), 'Noted: not now.')} disabled={busy}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Not now</button>
                </div>
              )}
              {e.can_undo && (
                <button onClick={() => act(() => api.post(`/admin/system-log/${e.id}/undo`), 'Undone.')} disabled={busy}
                  className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 disabled:opacity-50" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}><Undo2 size={13} /> Undo this</button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">
        Rules it follows: featured dishes follow sales once {data.rules.featured_from_portions} portions have sold in {data.rules.featured_window_days} days; a pairing needs two dishes bought together {data.rules.bought_together_from} times;
        an automation is switched off if more than {data.rules.unsubscribe_limit_percent}% of recipients unsubscribe; each action is checked again after {data.rules.review_after_days} days. Below those minimums it watches and changes nothing.
      </p>

      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label="Confirm change" data-notrack>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: P }}>{confirm.to ? 'Switch on' : 'Switch off'}: {confirm.label}?</h3>
            <p className="text-sm text-gray-600">{confirm.text}</p>
            <p className="text-sm"><span className="text-gray-500">Now:</span> {s[confirm.key] ? 'on' : 'off'} &nbsp;→&nbsp; <b>{confirm.to ? 'on' : 'off'}</b>. Takes effect at the next review.</p>
            {confirm.key === 'customer_messages' && confirm.to && <p className="text-sm" style={{ color: '#8D6E00' }}>This lets the system email your past customers without asking you first. Read each message under Automations → Preview before allowing it.</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Leave as it is</button>
              <button onClick={() => act(() => api.put('/admin/system-log/settings', { [confirm.key]: confirm.to }), `${confirm.label} is now ${confirm.to ? 'on' : 'off'}.`)} disabled={busy}
                className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50" style={{ backgroundColor: P, color: '#fff' }}>Yes, {confirm.to ? 'switch on' : 'switch off'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
