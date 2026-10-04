'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Download, Search } from 'lucide-react';
import api from '@/api';

/* Admin › Customers — one row per person (matched on email), built from accounts, orders,
   Dabba Wala plans and the newsletter list. Read-only. */

const P = '#800020';
const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const SEGMENTS = {
  subscriber: { label: 'Subscriber', hint: 'Dabba Wala plan running now', bg: '#E8F5E9', color: '#2E7D32' },
  regular:    { label: 'Regular',    hint: '5 or more orders',            bg: '#F3E5F5', color: '#6A1B9A' },
  repeat:     { label: 'Repeat',     hint: '2 to 4 orders',               bg: '#E3F2FD', color: '#1565C0' },
  new:        { label: 'New',        hint: '1 order',                     bg: '#FFF8E1', color: '#8D6E00' },
  lapsed:     { label: 'Lapsed',     hint: 'Nothing for 60 days or more', bg: '#FBE9E7', color: '#BF360C' },
  lead:       { label: 'Not yet ordered', hint: 'Account or newsletter only', bg: '#F5F5F5', color: '#616161' },
};
const ORDER = ['subscriber', 'regular', 'repeat', 'new', 'lapsed', 'lead'];

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function CustomersTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await api.get('/admin/customers')).data); }
    catch { setError('Could not load customers. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.customers || []).filter(c =>
      (segment === 'all' || c.segment === segment) &&
      (!q || [c.name, c.email, c.phone].some(v => (v || '').toLowerCase().includes(q))));
  }, [data, segment, query]);

  const exportCsv = () => {
    const head = ['Name', 'Email', 'Phone', 'Group', 'Account', 'Orders', 'Order spend', 'Plans', 'Plan spend', 'Total spend', 'Average order', 'First order', 'Last order', 'Running plan', 'Newsletter'];
    const lines = rows.map(c => [c.name, c.email, c.phone, SEGMENTS[c.segment]?.label, c.has_account ? 'yes' : 'guest', c.orders, c.order_spend, c.plans, c.plan_spend, c.total_spend, c.average_order, fmtDate(c.first_order), fmtDate(c.last_order), c.active_plan || '', c.newsletter ? 'yes' : 'no'].map(csvCell).join(','));
    const blob = new Blob([[head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `customers-${segment}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading && !data) return <p className="text-center text-gray-400 py-16">Loading customers…</p>;
  if (error) return <p className="text-center py-16" style={{ color: '#B91C1C' }}>{error} <button onClick={load} className="underline ml-2">Retry</button></p>;

  const s = data.summary;
  const cards = [
    ['People', s.people, 'accounts, guests and newsletter'],
    ['Have bought', s.buyers, `${s.repeat_buyers} came back`],
    ['Order income', fmt(s.order_revenue), `average order ${fmt(s.average_order)}`],
    ['Dabba Wala income', fmt(s.plan_revenue), 'plans not cancelled'],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value, note]) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: P }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSegment('all')} className="px-3 py-1.5 rounded-full text-sm font-semibold border"
          style={segment === 'all' ? { backgroundColor: P, color: '#fff', borderColor: P } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>
          Everyone ({s.people})
        </button>
        {ORDER.map(k => (
          <button key={k} onClick={() => setSegment(k)} title={SEGMENTS[k].hint} className="px-3 py-1.5 rounded-full text-sm font-semibold border"
            style={segment === k ? { backgroundColor: P, color: '#fff', borderColor: P } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>
            {SEGMENTS[k].label} ({s.segments[k] || 0})
          </button>
        ))}
      </div>
      {segment !== 'all' && <p className="text-xs text-gray-500 -mt-2">{SEGMENTS[segment].hint}</p>}

      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3" style={{ borderColor: '#f0ebe6' }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email or phone" aria-label="Search customers"
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e0d9d0' }} />
          </div>
          <span className="text-sm text-gray-500">{rows.length} shown</span>
          <button onClick={load} className="p-2 rounded-lg border" style={{ borderColor: '#e0d9d0' }} aria-label="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={exportCsv} disabled={!rows.length} className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-40" style={{ backgroundColor: P, color: '#fff' }}>
            <Download size={15} /> Download list
          </button>
        </div>
        {rows.length === 0 ? <p className="text-center text-gray-400 py-16">No one in this group yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#FDFBF7' }}>
                <tr>{['Customer', 'Group', 'Orders', 'Spent', 'Average', 'Last order', 'Dabba Wala', 'Loyalty'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.map(c => {
                  const seg = SEGMENTS[c.segment] || SEGMENTS.lead;
                  return (
                    <tr key={c.email} className="border-t hover:bg-gray-50 align-top" style={{ borderColor: '#f9f6ee' }}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.name || '—'} {!c.has_account && <span className="text-xs text-gray-400 font-normal">(guest)</span>}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: seg.bg, color: seg.color }}>{seg.label}</span>
                        {c.newsletter && <p className="text-xs text-gray-400 mt-1">newsletter</p>}</td>
                      <td className="px-4 py-3">{c.orders}{c.cancelled_orders > 0 && <span className="text-xs text-gray-400"> (+{c.cancelled_orders} cancelled)</span>}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(c.total_spend)}</td>
                      <td className="px-4 py-3 text-gray-600">{c.orders ? fmt(c.average_order) : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(c.last_order)}
                        {c.days_since_last_order != null && <p className="text-xs text-gray-400">{c.days_since_last_order === 0 ? 'today' : `${c.days_since_last_order} days ago`}</p>}</td>
                      <td className="px-4 py-3 text-gray-600">{c.active_plan ? <span className="capitalize">{c.active_plan}</span> : c.plans ? <span className="text-xs text-gray-400">ended {c.last_plan_end || ''}</span> : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.has_account ? c.loyalty_orders : '—'}{c.loyalty_reward_waiting && <p className="text-xs" style={{ color: '#2E7D32' }}>free dish waiting</p>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">People are matched on email address. Spend leaves out cancelled orders and cancelled plans. A plan counts as running only until its end date.</p>
    </div>
  );
}
