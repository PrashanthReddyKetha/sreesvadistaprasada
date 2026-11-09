'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, X, RefreshCw, Check, Clock, Ban, PackageX } from 'lucide-react';
import api from '@/api';
import { clearMenuCache } from '@/api/menuCache';
import { CATEGORY } from '@/lib/adminLabels';
import useDialog from '@/lib/useDialog';

/** Stock levels — every dish as a tile under its menu section. Tap one to mark it in stock, sold out for today,
    opening at a set time (back on sale by itself), or off the menu. */

const C = { burgundy: '#800020', gold: '#B8860B', muted: '#5C4B47', line: '#E8DFCE', green: '#2E6B4F', red: '#C62828', amber: '#B45309' };

// London "YYYY-MM-DDTHH:MM", the same form the server stores
const londonNow = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date()).replace(' ', 'T');

const fmtTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
};

const statusOf = (item, now) => {
  if (!item.available) return 'off';
  const s = item.sold_out_until;
  if (s && s.includes('T') && s > now) return 'opens';
  if (s && !s.includes('T') && s >= now.slice(0, 10)) return 'sold';
  return 'in';
};

const STATUS = {
  in:    { label: 'In stock',           color: C.green },
  sold:  { label: 'Sold out for today', color: C.amber },
  opens: { label: 'Opens later',        color: C.amber },
  off:   { label: 'Off the menu',       color: C.red },
};

const statusLabel = (item, now) => {
  const st = statusOf(item, now);
  if (st !== 'opens') return STATUS[st].label;
  const [day, time] = item.sold_out_until.split('T');
  return `Opens at ${fmtTime(time)}${day > now.slice(0, 10) ? ' tomorrow' : ''}`;
};

const CATEGORY_ORDER = Object.keys(CATEGORY);
const sectionOf = (item) => {
  const cat = CATEGORY[item.category] || item.category || 'Other';
  return item.subcategory ? `${cat} · ${item.subcategory}` : cat;
};
const sectionRank = (item) => {
  const i = CATEGORY_ORDER.indexOf(item.category);
  return `${String(i < 0 ? 99 : i).padStart(2, '0')}${(item.subcategory || '').toLowerCase()}`;
};

// The next whole hour, as the time picker's starting value
const nextHour = (now) => `${String((Number(now.slice(11, 13)) + 1) % 24).padStart(2, '0')}:00`;

function Option({ id, current, busy, icon: Icon, title, hint, onClick }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="w-full flex items-start gap-3 text-left px-4 py-3 rounded-xl border-2 disabled:opacity-60"
      style={{ borderColor: current === id ? C.burgundy : C.line, backgroundColor: current === id ? 'rgba(128,0,32,0.04)' : 'white' }}>
      <Icon size={18} className="mt-0.5 shrink-0" style={{ color: STATUS[id].color }} />
      <span className="flex-1">
        <span className="block text-sm font-bold" style={{ color: '#2D2422' }}>{title}</span>
        <span className="block text-xs" style={{ color: C.muted }}>{hint}</span>
      </span>
      {current === id && <Check size={16} style={{ color: C.burgundy }} />}
    </button>
  );
}

function StockSheet({ item, now, onClose, onSaved }) {
  const ref = useDialog(!!item, onClose);
  const [time, setTime] = useState(() => nextHour(now));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const current = statusOf(item, now);

  const save = async (patch) => {
    setBusy(true); setErr('');
    try {
      const r = await api.put(`/menu/${item.id}`, patch);
      clearMenuCache();
      onSaved(r.data);
    } catch (e) {
      setErr(typeof e.response?.data?.detail === 'string' ? e.response.data.detail : 'Could not save — please try again.');
      setBusy(false);
    }
  };

  // A time already gone today means tomorrow (e.g. "opens at 7am" set the night before)
  const opensAt = () => {
    if (!time) { setErr('Pick a time.'); return; }
    const today = now.slice(0, 10);
    let day = today;
    if (`${today}T${time}` <= now) {
      const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1);
      day = d.toISOString().slice(0, 10);
    }
    save({ available: true, sold_out_until: `${day}T${time}` });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={`Stock for ${item.name}`} onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.gold }}>{sectionOf(item)}</p>
            <h3 className="text-lg font-bold" style={{ color: C.burgundy }}>{item.name}</h3>
            <p className="text-xs" style={{ color: STATUS[current].color }}>Now: {statusLabel(item, now)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1"><X size={20} style={{ color: C.muted }} /></button>
        </div>

        <Option id="in" current={current} busy={busy} icon={Check} title="In stock" hint="On sale now"
          onClick={() => save({ available: true, clear_sold_out: true })} />
        <Option id="sold" current={current} busy={busy} icon={PackageX} title="Sold out for today" hint="Back on sale by itself tomorrow"
          onClick={() => save({ available: true, sold_out_until: now.slice(0, 10) })} />

        <div className="px-4 py-3 rounded-xl border-2 space-y-2"
          style={{ borderColor: current === 'opens' ? C.burgundy : C.line, backgroundColor: current === 'opens' ? 'rgba(128,0,32,0.04)' : 'white' }}>
          <div className="flex items-start gap-3">
            <Clock size={18} className="mt-0.5 shrink-0" style={{ color: C.amber }} />
            <span className="flex-1">
              <span className="block text-sm font-bold" style={{ color: '#2D2422' }}>Opens at a set time</span>
              <span className="block text-xs" style={{ color: C.muted }}>Customers see when it&apos;s back; it goes on sale by itself</span>
            </span>
            {current === 'opens' && <Check size={16} style={{ color: C.burgundy }} />}
          </div>
          <div className="flex items-center gap-2 pl-7">
            <input type="time" value={time} onChange={e => setTime(e.target.value)} disabled={busy} aria-label="Opens at"
              className="rounded-lg px-2 py-1.5 text-sm" style={{ border: `1px solid ${C.line}` }} />
            <button onClick={opensAt} disabled={busy}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: C.burgundy }}>
              Set
            </button>
          </div>
        </div>

        <Option id="off" current={current} busy={busy} icon={Ban} title="Off the menu" hint="Hidden from the website until you put it back"
          onClick={() => save({ available: false, clear_sold_out: true })} />

        {err && <p role="alert" className="text-sm font-semibold" style={{ color: C.red }}>{err}</p>}
      </div>
    </div>
  );
}

export default function StockTab() {
  const [items, setItems] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(londonNow);
  const [open, setOpen] = useState(null);

  const load = useCallback(() => api.get('/menu')
    .then(r => { setItems(r.data); setLoadErr(''); })
    .catch(() => setLoadErr('Could not load the menu.')), []);

  useEffect(() => { load(); }, [load]);
  // Keeps "Opens at" tiles honest: they turn back to In stock on their own
  useEffect(() => { const t = setInterval(() => setNow(londonNow()), 30000); return () => clearInterval(t); }, []);

  if (!items) return (
    <div className="text-sm" style={{ color: loadErr ? C.red : C.muted }}>{loadErr || 'Loading…'}</div>
  );

  const counts = { all: items.length, in: 0, sold: 0, opens: 0, off: 0 };
  items.forEach(i => { counts[statusOf(i, now)]++; });

  const q = search.trim().toLowerCase();
  const shown = items
    .filter(i => (filter === 'all' || statusOf(i, now) === filter) && (!q || i.name.toLowerCase().includes(q)))
    .sort((a, b) => sectionRank(a).localeCompare(sectionRank(b)) || a.name.localeCompare(b.name));
  const sections = [];
  shown.forEach(i => {
    const title = sectionOf(i);
    if (sections.at(-1)?.title !== title) sections.push({ title, items: [] });
    sections.at(-1).items.push(i);
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: `1px solid ${C.line}` }}>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: `1px solid ${C.line}` }}>
            <Search size={15} style={{ color: C.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes"
              aria-label="Search dishes" className="flex-1 text-sm outline-none bg-transparent" />
            {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14} style={{ color: C.muted }} /></button>}
          </label>
          <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Stock status"
            className="flex-1 sm:w-60 px-3 py-2 rounded-lg text-sm bg-white" style={{ border: `1px solid ${C.line}` }}>
            <option value="all">All stock status ({counts.all})</option>
            <option value="in">In stock ({counts.in})</option>
            <option value="sold">Sold out for today ({counts.sold})</option>
            <option value="opens">Opens at a set time ({counts.opens})</option>
            <option value="off">Off the menu ({counts.off})</option>
          </select>
          <button onClick={load} aria-label="Refresh" className="px-3 py-2 rounded-lg" style={{ border: `1px solid ${C.line}` }}>
            <RefreshCw size={15} style={{ color: C.muted }} />
          </button>
          </div>
        </div>
      </div>

      {!sections.length && <p className="text-sm" style={{ color: C.muted }}>No dishes match.</p>}

      {sections.map(s => (
        <section key={s.title} className="space-y-2">
          <h3 className="text-sm font-bold" style={{ color: '#2D2422' }}>{s.title}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {s.items.map(i => (
              <button key={i.id} onClick={() => setOpen(i)}
                className="text-left bg-white rounded-lg px-3 py-2.5 hover:shadow-sm transition-shadow"
                style={{ border: `1px solid ${C.line}` }}>
                <span className="block text-sm" style={{ color: '#2D2422' }}>{i.name}</span>
                <span className="block text-xs font-semibold" style={{ color: STATUS[statusOf(i, now)].color }}>{statusLabel(i, now)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <StockSheet key={open.id} item={open} now={now} onClose={() => setOpen(null)}
          onSaved={doc => { setItems(xs => xs.map(x => x.id === doc.id ? { ...x, ...doc } : x)); setOpen(null); }} />
      )}
    </div>
  );
}
