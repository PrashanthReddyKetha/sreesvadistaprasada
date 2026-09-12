'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Clock, Trash2, RefreshCw } from 'lucide-react';
import api from '@/api';

/**
 * Push notifications — compose, send now or schedule (London time), and see
 * per-campaign analytics (targeted / delivered / received / clicked).
 * Audience is everyone who enabled notifications in the installed app.
 */

const C = { burgundy: '#800020', gold: '#B8860B', ink: '#2D2422', muted: '#5C4B47', line: '#E8DFCE' };

const STATUS_STYLE = {
  scheduled: { bg: '#FFF8E1', text: '#8B6914' },
  queued:    { bg: '#E3F2FD', text: '#1565C0' },
  sending:   { bg: '#E3F2FD', text: '#1565C0' },
  sent:      { bg: '#E8F5E9', text: '#2E6B4F' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

const fmtWhen = (iso) => iso
  ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—';

export default function PushTab() {
  const [overview, setOverview] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', url: '/order', schedule_at: '' });
  const [mode, setMode] = useState('now'); // 'now' | 'schedule'
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api.get('/admin/push/overview');
      setOverview(r.data);
    } catch { setMsg('Could not load push data.'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) { flash('Title and message are both needed.'); return; }
    if (mode === 'schedule' && !form.schedule_at) { flash('Pick a date & time, or switch to Send now.'); return; }
    setBusy(true);
    try {
      const payload = {
        title: form.title, body: form.body, url: form.url || '/order',
        schedule_at: mode === 'schedule' ? form.schedule_at : null,
      };
      const r = await api.post('/admin/push/send', payload);
      flash(r.data.status === 'scheduled' ? 'Scheduled ✓' : 'Sending to all subscribers ✓');
      setForm({ title: '', body: '', url: '/order', schedule_at: '' });
      setTimeout(load, 1500);
    } catch (e) {
      flash(e.response?.data?.detail || 'Send failed.');
    } finally { setBusy(false); }
  };

  const cancel = async (id) => {
    try { await api.delete(`/admin/push/campaigns/${id}`); load(); }
    catch (e) { flash(e.response?.data?.detail || 'Could not cancel.'); }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2';
  const inputStyle = { borderColor: C.line, color: C.ink };

  return (
    <div className="space-y-6">
      {/* Header + subscriber count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} style={{ color: C.burgundy }} />
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.ink }}>
            Push Notifications
          </h2>
        </div>
        <button onClick={load} className="p-2 rounded-lg" style={{ color: C.muted }} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="rounded-xl px-4 py-3 flex items-baseline gap-2"
        style={{ backgroundColor: '#FBF3DC', border: '1px solid #EBD9A8' }}>
        <span className="text-2xl font-bold tabular-nums" style={{ color: C.burgundy }}>
          {overview ? overview.subscribers : '…'}
        </span>
        <span className="text-sm" style={{ color: C.muted }}>
          device{overview?.subscribers === 1 ? '' : 's'} subscribed — people who installed the app and turned notifications on.
        </span>
      </div>

      {/* Compose */}
      <div className="rounded-xl bg-white p-4 space-y-3" style={{ border: `1px solid ${C.line}` }}>
        <input className={inputCls} style={inputStyle} maxLength={80}
          placeholder="Title — e.g. 🪷 Weekend Special is live"
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <textarea className={inputCls} style={{ ...inputStyle, minHeight: 72 }} maxLength={300}
          placeholder="Message — e.g. Natukodi Pulusu is on the menu today only. First come, first served."
          value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
        <input className={inputCls} style={inputStyle} maxLength={300}
          placeholder="Link to open (default /order)"
          value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {['now', 'schedule'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="px-3 py-2 text-xs font-bold capitalize"
                style={{ backgroundColor: mode === m ? C.burgundy : '#fff', color: mode === m ? '#fff' : C.muted }}>
                {m === 'now' ? 'Send now' : 'Schedule'}
              </button>
            ))}
          </div>
          {mode === 'schedule' && (
            <input type="datetime-local" className="px-3 py-2 rounded-lg border text-sm" style={inputStyle}
              value={form.schedule_at} onChange={e => setForm(f => ({ ...f, schedule_at: e.target.value }))} />
          )}
          <button onClick={submit} disabled={busy}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-black text-white disabled:opacity-50"
            style={{ backgroundColor: C.burgundy }}>
            {busy ? <RefreshCw size={14} className="animate-spin" /> : mode === 'schedule' ? <Clock size={14} /> : <Send size={14} />}
            {mode === 'schedule' ? 'Schedule it' : 'Send to everyone'}
          </button>
        </div>
        {mode === 'schedule' && (
          <p className="text-[11px]" style={{ color: C.muted }}>Times are UK (Europe/London). The scheduler checks every minute.</p>
        )}
        {msg && <p className="text-xs font-bold" style={{ color: C.gold }}>{msg}</p>}
      </div>

      {/* Campaign history + analytics */}
      <div className="rounded-xl bg-white overflow-x-auto" style={{ border: `1px solid ${C.line}` }}>
        <table className="w-full text-sm" style={{ minWidth: 640 }}>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider" style={{ color: C.muted }}>
              {['Notification', 'Status', 'When', 'Sent', 'Received', 'Clicked', ''].map(h => (
                <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(overview?.campaigns || []).map(c => {
              const st = STATUS_STYLE[c.status] || STATUS_STYLE.sent;
              return (
                <tr key={c.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td className="px-3 py-2.5">
                    <div className="font-bold" style={{ color: C.ink }}>{c.title}</div>
                    <div className="text-xs truncate max-w-[260px]" style={{ color: C.muted }}>{c.body}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: st.bg, color: st.text }}>{c.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: C.muted }}>
                    {fmtWhen(c.sent_at || c.send_at_utc || c.created_at)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{c.stats?.sent ?? 0}<span className="text-xs" style={{ color: C.muted }}>/{c.stats?.targeted ?? 0}</span></td>
                  <td className="px-3 py-2.5 tabular-nums">{c.stats?.received ?? 0}</td>
                  <td className="px-3 py-2.5 tabular-nums">{c.stats?.clicked ?? 0}</td>
                  <td className="px-3 py-2.5">
                    {c.status === 'scheduled' && (
                      <button onClick={() => cancel(c.id)} title="Cancel scheduled send"
                        className="p-1.5 rounded text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              );
            })}
            {overview && overview.campaigns.length === 0 && (
              <tr style={{ borderTop: `1px solid ${C.line}` }}>
                <td colSpan={7} className="px-3 py-6 text-center text-sm" style={{ color: C.muted }}>
                  No notifications sent yet — your first one lands above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
