'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, PauseCircle, PlayCircle } from 'lucide-react';
import api from '@/api';
import ConfirmAction from '@/components/admin/ConfirmAction';

/** Collection Times — admin UI for GET/PUT /admin/settings/pickup-slots. */

const C = { burgundy: '#800020', gold: '#B8860B', muted: '#5C4B47', line: '#E8DFCE', green: '#2E6B4F', red: '#C62828' };
const DAYS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
];

export default function SlotSettingsTab() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [askPause, setAskPause] = useState(false);

  useEffect(() => {
    api.get('/admin/settings/pickup-slots')
      .then(r => setSettings(r.data))
      .catch(() => setMsg('Could not load settings.'));
  }, []);

  const save = async (patch) => {
    setSaving(true);
    setMsg('');
    try {
      const r = await api.put('/admin/settings/pickup-slots', patch);
      setSettings(r.data);
      setMsg('Saved ✓');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) {
      setMsg(e.response?.data?.detail?.[0]?.msg || e.response?.data?.detail || 'Could not save — check the values.');
    } finally { setSaving(false); }
  };

  if (!settings) return (
    <div className="flex items-center justify-center py-24">
      <RefreshCw size={28} className="animate-spin" style={{ color: C.burgundy }} />
    </div>
  );

  const unlimited = settings.max_orders_per_slot == null;

  return (
    <div className="max-w-2xl space-y-5">
      {askPause && (
        <ConfirmAction title={settings.paused ? 'Resume orders?' : 'Pause orders?'} danger={!settings.paused} busy={saving}
          confirmLabel={settings.paused ? 'Yes, resume' : 'Yes, pause'} onCancel={() => setAskPause(false)}
          onConfirm={async () => { await save({ paused: !settings.paused }); setAskPause(false); }}
          rows={settings.paused ? [
            ['Now', 'paused — checkout is switched off'],
            ['After', 'live — customers can order again'],
            ['Who is told', 'everyone who asked to be told and every device with notifications on — once, and only if orders were paused for over 30 minutes'],
          ] : [
            ['Now', 'live — customers can order'],
            ['After', 'paused — checkout is switched off and every page shows the message below'],
            ['Orders already placed', 'are not affected'],
            ['Undo', 'press Resume orders'],
          ]} />
      )}
      {/* Pause switch */}
      <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm" style={{ color: settings.paused ? C.red : C.green }}>
              {settings.paused ? '⏸ Ordering is PAUSED' : '▶ Ordering is live'}
            </p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>
              Pause instantly stops new checkout orders — for sick days, sold-out days, or festival rushes.
            </p>
          </div>
          <button onClick={() => setAskPause(true)} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white shrink-0 disabled:opacity-50"
            style={{ backgroundColor: settings.paused ? C.green : C.red }}>
            {settings.paused ? <><PlayCircle size={16} /> Resume orders</> : <><PauseCircle size={16} /> Pause orders</>}
          </button>
        </div>
        {settings.paused && (
          <input
            className="mt-3 w-full text-sm rounded-lg px-3 py-2"
            style={{ border: `1px solid ${C.line}` }}
            placeholder="Message customers see (optional)"
            defaultValue={settings.paused_message || ''}
            onBlur={e => e.target.value !== (settings.paused_message || '') && save({ paused_message: e.target.value })}
          />
        )}
      </div>

      {/* Slot basics */}
      <div className="bg-white rounded-xl p-5 space-y-4" style={{ border: `1px solid ${C.line}` }}>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.gold }}>Collection slots</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="text-xs font-semibold" style={{ color: C.muted }}>
            Slot length
            <select value={settings.slot_minutes} disabled={saving}
              onChange={e => save({ slot_minutes: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg px-2 py-2 text-sm" style={{ border: `1px solid ${C.line}` }}>
              {[10, 15, 20, 30].map(m => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold" style={{ color: C.muted }}>
            Prep time (mins before first slot)
            <input type="number" min="0" max="240" defaultValue={settings.lead_time_minutes} disabled={saving}
              onBlur={e => Number(e.target.value) !== settings.lead_time_minutes && save({ lead_time_minutes: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg px-2 py-2 text-sm" style={{ border: `1px solid ${C.line}` }} />
          </label>
          <div className="text-xs font-semibold" style={{ color: C.muted }}>
            Max orders per slot
            <div className="flex items-center gap-2 mt-1">
              <input type="number" min="1" max="100" disabled={saving || unlimited}
                defaultValue={unlimited ? '' : settings.max_orders_per_slot}
                placeholder="∞"
                key={unlimited ? 'unl' : settings.max_orders_per_slot}
                onBlur={e => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v !== settings.max_orders_per_slot) save({ max_orders_per_slot: v });
                }}
                className="w-20 rounded-lg px-2 py-2 text-sm" style={{ border: `1px solid ${C.line}` }} />
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={unlimited} disabled={saving}
                  onChange={e => e.target.checked ? save({ clear_max_orders: true }) : save({ max_orders_per_slot: 4 })} />
                Unlimited
              </label>
            </div>
          </div>
        </div>
      </div>

      <BlockedSlots />

      {/* Opening hours */}
      <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: C.gold }}>Opening hours</p>
        <div className="space-y-2">
          {DAYS.map(([key, label]) => {
            const d = settings.days?.[key] || { closed: false, open: '07:00', close: '23:00' };
            return (
              <div key={key} className="flex items-center gap-3 text-sm">
                <span className="w-24 font-semibold" style={{ color: d.closed ? '#B8AFA5' : '#2D2422' }}>{label}</span>
                <label className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                  <input type="checkbox" checked={!d.closed} disabled={saving}
                    onChange={e => save({ days: { [key]: { ...d, closed: !e.target.checked } } })} />
                  Open
                </label>
                {!d.closed && (
                  <>
                    <input type="time" value={d.open} disabled={saving}
                      onChange={e => save({ days: { [key]: { ...d, open: e.target.value } } })}
                      className="rounded-lg px-2 py-1 text-sm" style={{ border: `1px solid ${C.line}` }} />
                    <span style={{ color: C.muted }}>–</span>
                    <input type="time" value={d.close} disabled={saving}
                      onChange={e => save({ days: { [key]: { ...d, close: e.target.value } } })}
                      className="rounded-lg px-2 py-1 text-sm" style={{ border: `1px solid ${C.line}` }} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {msg && <p className="text-sm font-bold" style={{ color: msg === 'Saved ✓' ? C.green : C.red }}>{String(msg)}</p>}
    </div>
  );
}

const londonDate = (offsetDays) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' })
  .format(new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000));

/** Switch single collection times off (and back on) for today or tomorrow. */
function BlockedSlots() {
  const [day, setDay] = useState('today');
  const [slots, setSlots] = useState(null);
  const [busy, setBusy] = useState(null);       // iso being changed
  const [err, setErr] = useState('');

  const load = useCallback(async (which) => {
    try {
      const r = await api.get('/admin/settings/pickup-slots/grid', { params: { date: londonDate(which === 'tomorrow' ? 1 : 0) } });
      setSlots(r.data.slots);
      setErr('');
    } catch {
      setErr('Could not load collection times.');
    }
  }, []);

  useEffect(() => { load(day); }, [day, load]);

  const toggle = async (s) => {
    setBusy(s.iso);
    setErr('');
    try {
      const r = await api.put('/admin/settings/pickup-slots/blocked', { slot: s.iso, blocked: !s.blocked });
      const off = new Set(r.data.blocked_slots);
      setSlots(list => list.map(x => ({ ...x, blocked: off.has(x.iso) })));
    } catch (e) {
      setErr(e.response?.data?.detail || 'Could not change that time.');
      load(day);
    } finally { setBusy(null); }
  };

  const offCount = slots ? slots.filter(s => s.blocked).length : 0;

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.gold }}>Unavailable times</p>
        <div className="flex rounded-lg overflow-hidden text-xs font-bold" style={{ border: `1px solid ${C.line}` }}>
          {[['today', 'Today'], ['tomorrow', 'Tomorrow']].map(([v, l]) => (
            <button key={v} onClick={() => { if (v !== day) { setSlots(null); setErr(''); setDay(v); } }} className="px-3 py-1.5"
              style={day === v ? { backgroundColor: C.burgundy, color: '#fff' } : { color: C.muted }}>{l}</button>
          ))}
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: C.muted }}>
        Tap a time to stop customers choosing it; tap again to reopen it. Orders already booked for that time are kept.
      </p>
      {!slots && !err && <RefreshCw size={18} className="animate-spin" style={{ color: C.burgundy }} />}
      {slots && slots.length === 0 && (
        <p className="text-sm" style={{ color: C.muted }}>No collection times left to book {day === 'today' ? 'today' : 'tomorrow'}.</p>
      )}
      {slots && slots.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {slots.map(s => (
              <button key={s.iso} onClick={() => toggle(s)} disabled={busy === s.iso} aria-pressed={s.blocked}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                style={s.blocked
                  ? { backgroundColor: '#FDECEA', color: C.red, border: `1px solid ${C.red}`, textDecoration: 'line-through' }
                  : { backgroundColor: '#fff', color: C.green, border: `1px solid ${C.line}` }}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: offCount ? C.red : C.muted }}>
            {offCount ? `${offCount} time${offCount === 1 ? '' : 's'} switched off` : 'All times open'}
          </p>
        </>
      )}
      {err && <p className="text-xs font-bold mt-2" style={{ color: C.red }}>{String(err)}</p>}
    </div>
  );
}
