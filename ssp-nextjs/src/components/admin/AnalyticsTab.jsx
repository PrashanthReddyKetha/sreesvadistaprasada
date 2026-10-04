'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '@/api';

/* Admin › Analytics — the site's own record of visits (not Google's): visits, the path to an
   order, where visitors came from, and which dishes are looked at and added. */

const P = '#800020';
const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const STEP = {
  page_view: 'Visited the site', view_item: 'Opened a dish', add_to_cart: 'Added to basket',
  begin_checkout: 'Started checkout', purchase: 'Placed an order',
};
const card = { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };

const Table = ({ title, head, rows, empty }) => (
  <div className="bg-white rounded-xl overflow-hidden" style={card}>
    <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>{title}</h3>
    {rows.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">{empty}</p> : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#FDFBF7' }}><tr>{head.map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-t" style={{ borderColor: '#f9f6ee' }}>{r.map((c, j) => <td key={j} className={`px-4 py-2 ${j === 0 ? 'font-medium break-all' : 'text-gray-600 whitespace-nowrap'}`}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )}
  </div>
);

export default function AnalyticsTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await api.get('/admin/analytics', { params: { days } })).data); }
    catch { setError('Could not load the figures. Please try again.'); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <p className="text-center text-gray-400 py-16">Loading…</p>;
  if (error) return <p className="text-center py-16" style={{ color: '#B91C1C' }}>{error} <button onClick={load} className="underline ml-2">Retry</button></p>;

  const t = data.totals;
  const top = data.funnel[0]?.visits || 0;
  const maxDay = Math.max(1, ...data.by_day.map(d => d.visits));
  const cards = [
    ['Visits', t.visits, `${t.page_views} pages viewed`],
    ['Orders', t.orders, `${pct(t.orders, t.visits)} of visits`],
    ['Order income', fmt(t.income), t.orders ? `average ${fmt(t.income / t.orders)}` : 'no orders in this period'],
    ['Dabba Wala plans sold', t.plans_sold, `${t.returning_visitors_known} visitors accepted cookies`],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)} className="px-3 py-1.5 rounded-full text-sm font-semibold border"
            style={days === d ? { backgroundColor: P, color: '#fff', borderColor: P } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>Last {d} days</button>
        ))}
        <button onClick={load} className="p-2 rounded-lg border ml-auto" style={{ borderColor: '#e0d9d0' }} aria-label="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value, note]) => (
          <div key={label} className="bg-white rounded-xl p-4" style={card}>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: P }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{note}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4" style={card}>
        <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>From visit to order</h3>
        {top === 0 ? <p className="text-sm text-gray-400">No visits recorded in this period yet.</p> : data.funnel.map((f, i) => (
          <div key={f.step} className="mb-2">
            <div className="flex justify-between text-sm"><span>{STEP[f.step] || f.step}</span>
              <span className="text-gray-600">{f.visits} <span className="text-xs text-gray-400">({pct(f.visits, top)}{i > 0 ? `, ${pct(f.visits, data.funnel[i - 1].visits)} of the step before` : ''})</span></span></div>
            <div className="h-2.5 rounded-full mt-1" style={{ backgroundColor: '#f3ece6' }}><div className="h-2.5 rounded-full" style={{ width: `${Math.max(2, (f.visits / top) * 100)}%`, backgroundColor: P }} /></div>
          </div>
        ))}
      </div>

      <Table title="Where visitors came from" empty="Nothing recorded yet."
        head={['Source', 'Visits', 'Added to basket', 'Orders', 'Income']}
        rows={data.sources.map(s => [s.source, s.visits, s.added_to_basket, s.orders, fmt(s.income)])} />

      <div className="grid lg:grid-cols-2 gap-5">
        <Table title="Dishes opened most" empty="Nothing recorded yet." head={['Dish', 'Times opened']} rows={data.most_viewed_dishes.map(d => [d.name, d.count])} />
        <Table title="Dishes added to basket most" empty="Nothing recorded yet." head={['Dish', 'Quantity added']} rows={data.most_added_dishes.map(d => [d.name, d.count])} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Table title="Pages viewed most" empty="Nothing recorded yet." head={['Page', 'Views']} rows={data.top_pages.map(d => [d.name, d.count])} />
        <div className="bg-white rounded-xl overflow-hidden" style={card}>
          <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>Day by day</h3>
          {data.by_day.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Nothing recorded yet.</p> : (
            <div className="p-4 space-y-1.5 max-h-96 overflow-y-auto">
              {[...data.by_day].reverse().map(d => (
                <div key={d.day} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-gray-500 shrink-0">{new Date(d.day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: '#f3ece6' }}><div className="h-2 rounded-full" style={{ width: `${(d.visits / maxDay) * 100}%`, backgroundColor: P }} /></div>
                  <span className="w-36 text-right text-gray-600 shrink-0">{d.visits} visits · {d.orders} orders</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        This is the site's own count, kept on our server, and starts from the day it was switched on. It will not match Google Analytics exactly.
        A visit is one sitting on the site. Phones: {data.devices.phone || 0} · computers: {data.devices.desktop || 0}. Staff screens are not counted. No names or contact details are recorded here.
      </p>
    </div>
  );
}
