'use client';
import { useEffect, useMemo, useState } from 'react';
import api from '@/api';
import { ArrowUp, Search, X } from 'lucide-react';

/** Admin › Today's Specials › the dishes in the Today's Specials strip on Order Now (backend
    routes/daily_specials.py, settings "order_specials"). This list is for the order page only; the home page has
    its own below. Every tap saves. Until the owner changes it, it shows the home page specials. */

const P = '#800020';
const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;
const onToday = (d) => !d.preorder_only && !d.coming_soon;

export default function OrderSpecials() {
  const [ids, setIds] = useState(null);         // chosen dish ids, in the order they show
  const [saved, setSaved] = useState(true);     // false until the owner has a list of their own
  const [menu, setMenu] = useState([]);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState(null);       // { ok, text } after a save

  useEffect(() => {
    api.get('/daily-specials/order-page/chosen').then(r => { setIds(r.data.ids || []); setSaved(!!r.data.saved); }).catch(() => setIds([]));
    api.get('/menu?available=true').then(r => setMenu(r.data || [])).catch(() => {});
  }, []);

  const byId = useMemo(() => new Map(menu.map(d => [d.id, d])), [menu]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !ids) return [];
    return menu.filter(d => onToday(d) && !ids.includes(d.id) && d.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, menu, ids]);

  const save = async (next) => {
    const before = ids;
    setIds(next);
    setNote(null);
    try {
      const r = await api.put('/daily-specials/order-page/chosen', { ids: next });
      setIds(r.data.ids || []);
      setSaved(true);
      setNote({ ok: true, text: 'Saved' });
    } catch {
      setIds(before);
      setNote({ ok: false, text: "Couldn't save — please try again" });
    }
  };
  const add = (d) => { setQuery(''); save([...ids, d.id]); };
  const remove = (id) => save(ids.filter(i => i !== id));
  const moveUp = (k) => { const next = [...ids]; [next[k - 1], next[k]] = [next[k], next[k - 1]]; save(next); };

  if (!ids) return null;

  return (
    <div className="rounded-xl border p-4 space-y-3 mb-8" style={{ borderColor: 'rgba(128,0,32,0.15)', backgroundColor: '#fff' }} data-testid="order-specials">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Order page specials</h3>
        {note && <span className="text-sm font-semibold" role="status" style={{ color: note.ok ? '#2E7D32' : '#C62828' }}>{note.text}</span>}
      </div>
      <p className="text-sm" style={{ color: '#7A5C50' }}>
        The dishes in the Today's Specials strip on Order Now, in this order. This list is for the order page only.
        {!saved && ' It shows the home page specials until you change it.'}
      </p>

      {ids.length === 0 ? (
        <p className="text-sm font-semibold" style={{ color: '#757575' }}>No specials on the order page.</p>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'rgba(128,0,32,0.08)' }}>
          {ids.map((id, k) => {
            const d = byId.get(id);
            const hidden = menu.length > 0 && (!d || !onToday(d));
            return (
              <li key={id} className="flex items-center gap-3 py-2" data-testid="order-special-row">
                <span className="w-5 text-xs font-bold text-center" style={{ color: '#7A5C50' }}>{k + 1}</span>
                {d?.image
                  ? <img loading="lazy" decoding="async" src={d.image} alt="" className="w-10 h-10 rounded object-cover flex-none" />
                  : <span className="w-10 h-10 rounded flex-none" style={{ backgroundColor: '#F5F5F5' }} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: '#2D2422' }}>{d?.name || 'A dish that is hidden'}</p>
                  <p className="text-xs" style={{ color: hidden || d?.sold_out_today ? '#C62828' : '#7A5C50' }}>
                    {hidden ? "Not on today's menu — not shown" : d?.sold_out_today ? 'Sold out today' : d ? fmt(d.price) : ''}
                  </p>
                </div>
                {k > 0 && (
                  <button type="button" onClick={() => moveUp(k)} aria-label={`Move ${d?.name || 'dish'} up`}
                    className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: P }}><ArrowUp size={16} /></button>
                )}
                <button type="button" onClick={() => remove(id)} aria-label={`Remove ${d?.name || 'dish'}`}
                  className="p-2 rounded-lg" style={{ backgroundColor: '#FFF0F0', color: '#B91C1C' }}><X size={16} /></button>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Add a dish — type its name…"
            aria-label="Add a dish to the order page specials" data-testid="order-special-search"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white" style={{ borderColor: 'rgba(128,0,32,0.2)' }} />
        </div>
        {matches.length > 0 && (
          <div className="mt-1 border rounded-lg overflow-hidden" style={{ borderColor: 'rgba(128,0,32,0.15)' }}>
            {matches.map(d => (
              <button key={d.id} type="button" onClick={() => add(d)} data-testid="order-special-add"
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-amber-50 border-b last:border-0"
                style={{ borderColor: 'rgba(128,0,32,0.08)' }}>
                {d.image && <img loading="lazy" decoding="async" src={d.image} alt="" className="w-10 h-10 rounded object-cover flex-none" />}
                <span className="min-w-0 flex-1 text-sm font-semibold truncate" style={{ color: '#2D2422' }}>{d.name}</span>
                <span className="text-xs font-bold flex-none" style={{ color: P }}>{fmt(d.price)}</span>
              </button>
            ))}
          </div>
        )}
        {query.trim() && matches.length === 0 && (
          <p className="mt-1 text-xs" style={{ color: '#7A5C50' }}>No dish on today's menu by that name, or it is already in the list.</p>
        )}
      </div>
    </div>
  );
}
