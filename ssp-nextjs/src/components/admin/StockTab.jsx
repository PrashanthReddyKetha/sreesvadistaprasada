'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, X, RefreshCw, Check, Clock, Ban, PackageX, CalendarClock, Sparkles, Layers } from 'lucide-react';
import api from '@/api';
import { clearMenuCache } from '@/api/menuCache';
import { CATEGORY } from '@/lib/adminLabels';
import useDialog from '@/lib/useDialog';

/** Stock levels — every dish as a tile under its menu section. Tap one to mark it in stock, sold out for today,
    opening at a set time (back on sale by itself), coming soon (shown with a notify-me bell, not for sale yet),
    pre-order only (ordered today, collected tomorrow), or off the menu. "Set all" on a section or a whole menu
    applies one choice to every dish shown there (owner, 14 Nov 2026). */

const C = { burgundy: '#800020', gold: '#B8860B', muted: '#5C4B47', line: '#E8DFCE', green: '#2E6B4F', red: '#C62828', amber: '#B45309', plum: '#6B21A8' };

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
  if (item.coming_soon) return 'soon';
  if (item.preorder_only) return 'pre';
  return 'in';
};

const STATUS = {
  in:    { label: 'In stock',           color: C.green },
  sold:  { label: 'Sold out for today', color: C.amber },
  opens: { label: 'Opens later',        color: C.amber },
  soon:  { label: 'Coming soon',        color: C.plum },
  pre:   { label: 'Pre-order · collect tomorrow', color: C.burgundy },
  off:   { label: 'Off the menu',       color: C.red },
};

const statusLabel = (item, now) => {
  const st = statusOf(item, now);
  if (st !== 'opens') return STATUS[st].label;
  const [day, time] = item.sold_out_until.split('T');
  return `Opens at ${fmtTime(time)}${day > now.slice(0, 10) ? ' tomorrow' : ''}`;
};

const CATEGORY_ORDER = Object.keys(CATEGORY);
const categoryOf = (item) => CATEGORY[item.category] || item.category || 'Other';
const sectionOf = (item) => item.subcategory ? `${categoryOf(item)} · ${item.subcategory}` : categoryOf(item);
const sectionRank = (item) => {
  const i = CATEGORY_ORDER.indexOf(item.category);
  return `${String(i < 0 ? 99 : i).padStart(2, '0')}${(item.subcategory || '').toLowerCase()}`;
};

// The next whole hour, as the time picker's starting value
const nextHour = (now) => `${String((Number(now.slice(11, 13)) + 1) % 24).padStart(2, '0')}:00`;

// Every choice names all three flags, so one dish is never in two states at once
const PATCH = {
  in:   { available: true, clear_sold_out: true, coming_soon: false, preorder_only: false },
  sold: (now) => ({ available: true, sold_out_until: now.slice(0, 10), coming_soon: false, preorder_only: false }),
  opens: (when) => ({ available: true, sold_out_until: when, coming_soon: false, preorder_only: false }),
  soon: { available: true, clear_sold_out: true, coming_soon: true, preorder_only: false },
  pre:  { available: true, clear_sold_out: true, coming_soon: false, preorder_only: true },
  off:  { available: false, clear_sold_out: true, coming_soon: false, preorder_only: false },
};

function Option({ id, current, busy, icon: Icon, title, hint, onClick }) {
  return (
    <button onClick={onClick} disabled={busy} data-testid={`stock-option-${id}`}
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

/** One dish (items.length === 1) or every dish shown in a section or a menu (scope names it). */
function StockSheet({ items, scope, now, onClose, onSaved }) {
  const ref = useDialog(!!items, onClose);
  const [time, setTime] = useState(() => nextHour(now));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const one = items.length === 1 ? items[0] : null;
  const statuses = new Set(items.map(i => statusOf(i, now)));
  const current = statuses.size === 1 ? [...statuses][0] : null;   // several states at once: nothing is ticked

  const save = async (patch) => {
    setBusy(true); setErr('');
    const saved = [];
    let failed = 0;
    for (let at = 0; at < items.length; at += 5) {        // five at a time: quick on a phone, kind to the server
      const results = await Promise.allSettled(items.slice(at, at + 5).map(i => api.put(`/menu/${i.id}`, patch)));
      results.forEach(r => { if (r.status === 'fulfilled') saved.push(r.value.data); else failed++; });
    }
    clearMenuCache();
    if (saved.length) onSaved(saved, failed === 0);
    if (failed) {
      setErr(items.length === 1 ? 'Could not save — please try again.' : `${failed} of ${items.length} could not be saved — please try again.`);
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
    save(PATCH.opens(`${day}T${time}`));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={one ? `Stock for ${one.name}` : `Stock for every dish in ${scope}`} onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.gold }}>{one ? sectionOf(one) : scope}</p>
            <h3 className="text-lg font-bold" style={{ color: C.burgundy }}>{one ? one.name : `All ${items.length} dishes shown here`}</h3>
            {one
              ? <p className="text-xs" style={{ color: STATUS[current].color }}>Now: {statusLabel(one, now)}</p>
              : <p className="text-xs" style={{ color: C.muted }}>{current ? `All ${STATUS[current].label.toLowerCase()} now.` : 'Mixed at the moment.'} Your choice applies to every one of them.</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1"><X size={20} style={{ color: C.muted }} /></button>
        </div>

        <Option id="in" current={current} busy={busy} icon={Check} title="In stock" hint="On sale now"
          onClick={() => save(PATCH.in)} />
        <Option id="sold" current={current} busy={busy} icon={PackageX} title="Sold out for today" hint="Back on sale by itself tomorrow"
          onClick={() => save(PATCH.sold(now))} />

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

        <Option id="soon" current={current} busy={busy} icon={Sparkles} title="Coming soon" hint="Shown on the website with a Notify-me bell; not for sale until you change it. People who tap the bell hear first when you set it In stock"
          onClick={() => save(PATCH.soon)} />
        <Option id="pre" current={current} busy={busy} icon={CalendarClock} title="Pre-order only" hint="Ordered today, collected tomorrow — the website says so and checkout asks for a next-day collection time"
          onClick={() => save(PATCH.pre)} />
        <Option id="off" current={current} busy={busy} icon={Ban} title="Off the menu" hint="Hidden from the website until you put it back"
          onClick={() => save(PATCH.off)} />

        {err && <p role="alert" className="text-sm font-semibold" style={{ color: C.red }}>{err}</p>}
      </div>
    </div>
  );
}

function SetAllButton({ label, onClick, testId }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ border: `1px solid ${C.line}`, color: C.burgundy, backgroundColor: 'white' }}>
      <Layers size={12} /> {label}
    </button>
  );
}

export default function StockTab() {
  const [items, setItems] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(londonNow);
  const [open, setOpen] = useState(null);     // { items, scope }

  const load = useCallback(() => api.get('/menu')
    .then(r => { setItems(r.data); setLoadErr(''); })
    .catch(() => setLoadErr('Could not load the menu.')), []);

  useEffect(() => { load(); }, [load]);
  // Keeps "Opens at" tiles honest: they turn back to In stock on their own
  useEffect(() => { const t = setInterval(() => setNow(londonNow()), 30000); return () => clearInterval(t); }, []);

  if (!items) return (
    <div className="text-sm" style={{ color: loadErr ? C.red : C.muted }}>{loadErr || 'Loading…'}</div>
  );

  const counts = { all: items.length, in: 0, sold: 0, opens: 0, soon: 0, pre: 0, off: 0 };
  items.forEach(i => { counts[statusOf(i, now)]++; });

  const q = search.trim().toLowerCase();
  const shown = items
    .filter(i => (filter === 'all' || statusOf(i, now) === filter) && (!q || i.name.toLowerCase().includes(q)))
    .sort((a, b) => sectionRank(a).localeCompare(sectionRank(b)) || a.name.localeCompare(b.name));
  // Menus (Breakfast, Prasada, Svadista…), each with its sections, in menu order
  const menus = [];
  shown.forEach(i => {
    const menuTitle = categoryOf(i), title = sectionOf(i);
    if (menus.at(-1)?.title !== menuTitle) menus.push({ title: menuTitle, items: [], sections: [] });
    const menu = menus.at(-1);
    menu.items.push(i);
    if (menu.sections.at(-1)?.title !== title) menu.sections.push({ title, items: [] });
    menu.sections.at(-1).items.push(i);
  });

  const saved = (docs, done) => {
    const byId = Object.fromEntries(docs.map(d => [d.id, d]));
    setItems(xs => xs.map(x => byId[x.id] ? { ...x, ...byId[x.id] } : x));
    if (done) setOpen(null);
  };

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
            <option value="soon">Coming soon ({counts.soon})</option>
            <option value="pre">Pre-order only ({counts.pre})</option>
            <option value="off">Off the menu ({counts.off})</option>
          </select>
          <button onClick={load} aria-label="Refresh" className="px-3 py-2 rounded-lg" style={{ border: `1px solid ${C.line}` }}>
            <RefreshCw size={15} style={{ color: C.muted }} />
          </button>
          </div>
        </div>
        <p className="text-xs" style={{ color: C.muted }}>Tap a dish to change it. &ldquo;Set all&rdquo; on a section or a whole menu changes every dish shown there{(q || filter !== 'all') ? ' (only the ones that match your search and filter)' : ''}.</p>
      </div>

      {!menus.length && <p className="text-sm" style={{ color: C.muted }}>No dishes match.</p>}

      {menus.map(menu => (
        <section key={menu.title} className="space-y-3" data-testid="stock-menu">
          <div className="flex items-center justify-between gap-2 pt-2" style={{ borderBottom: `1px solid ${C.line}` }}>
            <h2 className="text-base font-bold pb-1" style={{ color: C.burgundy, fontFamily: "'Playfair Display', serif" }}>{menu.title}</h2>
            <SetAllButton label={`Set all ${menu.items.length}`} testId="stock-set-menu"
              onClick={() => setOpen({ items: menu.items, scope: menu.title })} />
          </div>
          {menu.sections.map(s => (
            <div key={s.title} className="space-y-2" data-testid="stock-section">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold" style={{ color: '#2D2422' }}>{s.title}</h3>
                {menu.sections.length > 1 && (
                  <SetAllButton label={`Set all ${s.items.length}`} testId="stock-set-section"
                    onClick={() => setOpen({ items: s.items, scope: s.title })} />
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {s.items.map(i => (
                  <button key={i.id} onClick={() => setOpen({ items: [i], scope: s.title })}
                    className="text-left bg-white rounded-lg px-3 py-2.5 hover:shadow-sm transition-shadow"
                    style={{ border: `1px solid ${C.line}` }}>
                    <span className="block text-sm" style={{ color: '#2D2422' }}>{i.name}</span>
                    <span className="block text-xs font-semibold" style={{ color: STATUS[statusOf(i, now)].color }}>{statusLabel(i, now)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      {open && (
        <StockSheet key={open.items.map(i => i.id).join(',')} items={open.items} scope={open.scope} now={now}
          onClose={() => setOpen(null)} onSaved={saved} />
      )}
    </div>
  );
}
