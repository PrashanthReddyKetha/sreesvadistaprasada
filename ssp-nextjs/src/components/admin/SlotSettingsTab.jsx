'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, PauseCircle, PlayCircle } from 'lucide-react';
import api from '@/api';

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
          <button onClick={() => save({ paused: !settings.paused })} disabled={saving}
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

      {/* Opening hours */}
      <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: C.gold }}>Opening hours</p>
        <div className="space-y-2">
          {DAYS.map(([key, label]) => {
            const d = settings.days?.[key] || { closed: false, open: '08:00', close: '20:30' };
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
