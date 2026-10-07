'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Download, Search, X } from 'lucide-react';
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

const STAGES = {
  trial:     { label: 'On a first weekly plan', hint: 'Their first plan, weekly, running now' },
  active:    { label: 'Plan running',           hint: 'A plan running now (not a first weekly plan)' },
  expiring:  { label: 'Plan ending soon',       hint: 'Last meal within 3 days' },
  expired:   { label: 'Plan finished',          hint: 'Had a plan; none running' },
  cancelled: { label: 'Plan cancelled',         hint: 'Their latest plan was cancelled' },
  prospect:  { label: 'Orders, never a plan',   hint: 'Has ordered food but never taken Dabba Wala' },
};
const STAGE_ORDER = ['trial', 'active', 'expiring', 'expired', 'cancelled', 'prospect'];
const FLAGS = {
  high_value: { label: 'High spender', hint: 'Spent £150 or more in total', bg: '#FFF3E0', color: '#E65100' },
  at_risk:    { label: 'Going quiet',  hint: 'Ordered at least twice, nothing for 30 to 60 days', bg: '#FCE4EC', color: '#AD1457' },
  only_cancelled: { label: 'Only cancelled orders', hint: 'Every order so far was cancelled', bg: '#F5F5F5', color: '#616161' },
};
const RISK = { high: { label: 'Likely to drift away', color: '#B91C1C' }, medium: { label: 'Overdue an order', color: '#8D6E00' }, low: { label: 'On their usual rhythm', color: '#2E7D32' } };
const KIND = { order: '#800020', plan: '#2E7D32', review: '#6A1B9A', enquiry: '#1565C0', loyalty: '#E65100', coupon: '#8D6E00', account: '#616161', newsletter: '#616161' };
const fmtWhen = (iso) => new Date(iso + (/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? '' : 'Z')).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const rate = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);

function CustomerPage({ email, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    api.get('/admin/customers/timeline', { params: { email } })
      .then(r => { if (live) setData(r.data); })
      .catch(() => { if (live) setError('Could not load this customer.'); });
    return () => { live = false; };
  }, [email]);
  const c = data?.customer;
  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Customer history" data-notrack>
      <button className="flex-1 bg-black/40" onClick={onClose} aria-label="Close customer history" />
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto" style={{ boxShadow: '-8px 0 24px rgba(0,0,0,0.15)' }}>
        <div className="sticky top-0 bg-white px-5 py-4 border-b flex items-start gap-3" style={{ borderColor: '#f0ebe6' }}>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate" style={{ fontFamily: "'Playfair Display', serif", color: P }}>{c?.name || email}</h3>
            <p className="text-xs text-gray-500 truncate">{email}{c?.phone ? ` · ${c.phone}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border" style={{ borderColor: '#e0d9d0' }} aria-label="Close"><X size={16} /></button>
        </div>
        {error && <p className="p-6 text-sm" style={{ color: '#B91C1C' }}>{error}</p>}
        {!data && !error && <p className="p-6 text-sm text-gray-400">Loading…</p>}
        {data && (
          <div className="p-5 space-y-5">
            {c && (
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Orders', c.orders], ['Spent', fmt(c.total_spend)], ['Average order', c.orders ? fmt(c.average_order) : '—']].map(([l, v]) => (
                  <div key={l} className="rounded-lg p-3" style={{ backgroundColor: '#FDFBF7' }}><p className="text-xs text-gray-500">{l}</p><p className="font-bold" style={{ color: P }}>{v}</p></div>
                ))}
              </div>
            )}
            {c && (
              <p className="text-sm text-gray-600">
                {(SEGMENTS[c.segment] || SEGMENTS.lead).label}
                {STAGES[c.dabba_stage] ? ` · ${STAGES[c.dabba_stage].label}` : ''}
                {(c.flags || []).map(f => FLAGS[f] ? ` · ${FLAGS[f].label}` : '').join('')}
                {c.has_account ? ' · has an account' : ' · guest'}{c.newsletter ? ' · newsletter' : ''}
              </p>
            )}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">History, newest first</h4>
              {data.timeline.length === 0 ? <p className="text-sm text-gray-400">Nothing on record yet.</p> : (
                <ol className="space-y-3">
                  {data.timeline.map((e, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: KIND[e.kind] || '#999' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{e.title}{e.amount != null && <span className="font-normal text-gray-600"> · {e.amount < 0 ? `−${fmt(-e.amount)}` : fmt(e.amount)}</span>}</p>
                        {e.detail && <p className="text-xs text-gray-500 break-words">{e.detail}</p>}
                        <p className="text-xs text-gray-400">{fmtWhen(e.at)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <p className="text-xs text-gray-400">Shows orders, plans, skipped meals, reviews, messages, loyalty and coupons. Website visits are not linked to named customers.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Insights({ data }) {
  if (!data) return null;
  const o = data.orders, d = data.dabba;
  const tile = (label, value, note) => (
    <div key={label} className="rounded-lg p-3" style={{ backgroundColor: '#FDFBF7' }}>
      <p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold" style={{ color: P }}>{value}</p>{note && <p className="text-xs text-gray-400">{note}</p>}
    </div>
  );
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Do customers come back?</h3>
        <div className="grid grid-cols-3 gap-3">
          {tile('Ordered more than once', rate(o.repeat_rate), `${o.ordered_more_than_once} of ${o.buyers} buyers`)}
          {tile('Typical gap to 2nd order', o.median_days_to_second_order == null ? '—' : `${o.median_days_to_second_order} days`)}
          {tile('Buyers who took a plan', o.buyers_who_also_took_a_plan)}
        </div>
        {data.cohorts.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-500">{['First ordered in', 'New customers', 'Back in 30 days', '60 days', '90 days'].map(h => <th key={h} className="py-1 pr-3 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{data.cohorts.map(c => (
                <tr key={c.month} className="border-t" style={{ borderColor: '#f9f6ee' }}>
                  <td className="py-1 pr-3">{new Date(c.month + '-01').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</td>
                  <td className="py-1 pr-3">{c.new_customers}</td>
                  {[30, 60, 90].map(n => <td key={n} className="py-1 pr-3">{c[`old_enough_${n}`] ? `${Math.round((c[`back_within_${n}`] / c[`old_enough_${n}`]) * 100)}%` : 'too early'}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Dabba Wala</h3>
        <div className="grid grid-cols-3 gap-3">
          {tile('Plans sold', d.plans_sold, `${d.weekly} weekly · ${d.monthly} monthly`)}
          {tile('Running now', d.running, `${d.expiring_soon} ending within 3 days`)}
          {tile('Bought again', rate(d.renewal_rate), `${d.bought_again_after_first_plan} of ${d.first_plan_finished} whose first plan ended`)}
          {tile('Weekly to monthly', d.moved_from_weekly_to_monthly, `of ${d.started_with_a_weekly_plan} who began weekly`)}
          {tile('Meals skipped', rate(d.skip_rate), `${d.meals_skipped} of ${d.meals_sold} · ${d.makeup_meals} made up`)}
          {tile('Cancelled', d.cancelled, `${d.finished} finished without cancelling`)}
          {data.next_week_meals && tile('Meals to cook next week', data.next_week_meals.meals, 'from plans already bought')}
        </div>
        {(data.dabba_forecast || []).some(w => w.plans_ending > 0) && (
          <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs mt-4">
            <thead><tr className="text-left text-gray-500">{['Week starting', 'Plans ending', 'Renewals to expect'].map(h => <th key={h} className="py-1 pr-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{data.dabba_forecast.map(w => (
              <tr key={w.week_starting} className="border-t" style={{ borderColor: '#f9f6ee' }}>
                <td className="py-1 pr-3">{new Date(w.week_starting).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                <td className="py-1 pr-3">{w.plans_ending}</td><td className="py-1 pr-3">{w.expected_renewals == null ? 'not enough history' : w.expected_renewals}</td>
              </tr>
            ))}</tbody>
          </table>
          </div>
        )}
      </div>
      {(data.sells_together || []).length > 0 && (
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Bought together most</h3>
          <ul className="text-sm space-y-1">{data.sells_together.map(p => <li key={p.dishes} className="flex justify-between gap-3"><span>{p.dishes}</span><span className="text-gray-500 whitespace-nowrap">{p.baskets} baskets</span></li>)}</ul>
        </div>
      )}
      {data.time_patterns && data.time_patterns.by_weekday.some(d => d.orders > 0) && (
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>When people order</h3>
          <div className="flex items-end gap-1.5 h-20 mb-1">
            {data.time_patterns.by_weekday.map(d => { const max = Math.max(1, ...data.time_patterns.by_weekday.map(x => x.orders)); return (
              <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.day}: ${d.orders} orders`}>
                <div className="w-full rounded-t" style={{ height: `${(d.orders / max) * 100}%`, minHeight: d.orders ? 3 : 0, backgroundColor: P }} />
                <span className="text-[10px] text-gray-400 mt-1">{d.day.slice(0, 3)}</span>
              </div>); })}
          </div>
          <ul className="text-xs text-gray-600 space-y-1 mt-3">{data.time_patterns.top_by_time_of_day.filter(t => t.dishes.length).map(t => <li key={t.when}><b>{t.when}:</b> {t.dishes.join(', ')}</li>)}</ul>
        </div>
      )}
      {((data.postcodes || []).length > 0 || (data.loyalty && data.loyalty.member_orders > 0)) && (
        <div className="bg-white rounded-xl p-4 lg:col-span-2 grid md:grid-cols-2 gap-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {(data.postcodes || []).length > 0 && (
            <div>
              <h3 className="font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Where delivery orders went</h3>
              <ul className="text-sm space-y-1">{data.postcodes.map(p => <li key={p.district} className="flex justify-between"><span>{p.district}</span><span className="text-gray-500">{p.orders} orders · {fmt(p.income)}</span></li>)}</ul>
            </div>
          )}
          {data.loyalty && data.loyalty.member_orders > 0 && (
            <div>
              <h3 className="font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: P }}>What loyalty costs and brings</h3>
              <p className="text-sm text-gray-600">{data.loyalty.free_dishes_given} free dish{data.loyalty.free_dishes_given === 1 ? '' : 'es'} given, worth {fmt(data.loyalty.value_given)}.
                Customers on the scheme placed {data.loyalty.member_orders} orders worth {fmt(data.loyalty.member_income)}
                {data.loyalty.income_per_pound_given != null ? ` — ${fmt(data.loyalty.income_per_pound_given)} of orders for every £1 given away.` : '.'}</p>
            </div>
          )}
        </div>
      )}
      {(data.coupons || []).length > 0 && (
        <div className="bg-white rounded-xl p-4 lg:col-span-2" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>What each coupon gave away and brought in</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 uppercase tracking-wider">{['Code', 'Orders', 'Discount given', 'Order income', 'Income per £1 given'].map(h => <th key={h} className="py-1 pr-4 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{data.coupons.map(k => (
                <tr key={k.code} className="border-t" style={{ borderColor: '#f9f6ee' }}>
                  <td className="py-1.5 pr-4 font-medium">{k.code}</td><td className="py-1.5 pr-4">{k.orders}</td><td className="py-1.5 pr-4">{fmt(k.discount_given)}</td>
                  <td className="py-1.5 pr-4">{fmt(k.income)}</td><td className="py-1.5 pr-4">{k.income_per_pound_given == null ? '—' : fmt(k.income_per_pound_given)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function CustomersTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState('all');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('all');
  const [flag, setFlag] = useState('all');
  const [risk, setRisk] = useState('all');
  const [open, setOpen] = useState(null);
  const [insights, setInsights] = useState(null);
  const [showTest, setShowTest] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setData((await api.get('/admin/customers', { params: { include_test: showTest } })).data);
      api.get('/admin/customers/insights').then(r => setInsights(r.data)).catch(() => {});
    }
    catch { setError('Could not load customers. Please try again.'); }
    finally { setLoading(false); }
  }, [showTest]);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.customers || []).filter(c =>
      (segment === 'all' || c.segment === segment) &&
      (stage === 'all' || c.dabba_stage === stage) &&
      (flag === 'all' || (c.flags || []).includes(flag)) &&
      (risk === 'all' || c.return_risk === risk) &&
      (!q || [c.name, c.email, c.phone].some(v => (v || '').toLowerCase().includes(q))));
  }, [data, segment, stage, flag, risk, query]);

  const exportCsv = () => {
    const head = ['Name', 'Email', 'Phone', 'Group', 'Dabba Wala stage', 'Account', 'Orders', 'Order spend', 'Plans', 'Plan spend', 'Total spend', 'Average order', 'First order', 'Last order', 'Running plan', 'Newsletter'];
    const lines = rows.map(c => [c.name, c.email, c.phone, SEGMENTS[c.segment]?.label, STAGES[c.dabba_stage]?.label || '', c.has_account ? 'yes' : 'guest', c.orders, c.order_spend, c.plans, c.plan_spend, c.total_spend, c.average_order, fmtDate(c.first_order), fmtDate(c.last_order), c.active_plan || '', c.newsletter ? 'yes' : 'no'].map(csvCell).join(','));
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

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Dabba Wala</span>
        {STAGE_ORDER.map(k => (
          <button key={k} onClick={() => setStage(stage === k ? 'all' : k)} title={STAGES[k].hint} className="px-3 py-1 rounded-full text-xs font-semibold border"
            style={stage === k ? { backgroundColor: '#2E7D32', color: '#fff', borderColor: '#2E7D32' } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>
            {STAGES[k].label} ({(s.dabba_stages || {})[k] || 0})
          </button>
        ))}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-3 mr-1">Worth a look</span>
        {['high_value', 'at_risk'].map(k => (
          <button key={k} onClick={() => setFlag(flag === k ? 'all' : k)} title={FLAGS[k].hint} className="px-3 py-1 rounded-full text-xs font-semibold border"
            style={flag === k ? { backgroundColor: FLAGS[k].color, color: '#fff', borderColor: FLAGS[k].color } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>
            {FLAGS[k].label} ({(s.flags || {})[k] || 0})
          </button>
        ))}
        {['high', 'medium'].map(k => (
          <button key={k} onClick={() => setRisk(risk === k ? 'all' : k)} title="Judged from how long they have been quiet against their own usual gap between orders" className="px-3 py-1 rounded-full text-xs font-semibold border"
            style={risk === k ? { backgroundColor: RISK[k].color, color: '#fff', borderColor: RISK[k].color } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>
            {RISK[k].label} ({(s.return_risk || {})[k] || 0})
          </button>
        ))}
      </div>
      {(stage !== 'all' || flag !== 'all') && <p className="text-xs text-gray-500 -mt-2">{[stage !== 'all' && STAGES[stage].hint, flag !== 'all' && FLAGS[flag].hint].filter(Boolean).join(' · ')}</p>}

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
                    <tr key={c.email} onClick={() => setOpen(c.email)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setOpen(c.email); }}
                      className="border-t hover:bg-gray-50 align-top cursor-pointer" style={{ borderColor: '#f9f6ee' }} title="Open this customer's history">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.name || '—'} {!c.has_account && <span className="text-xs text-gray-400 font-normal">(guest)</span>}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: seg.bg, color: seg.color }}>{seg.label}</span>
                        {(c.flags || []).filter(f => FLAGS[f]).map(f => <span key={f} className="block mt-1"><span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: FLAGS[f].bg, color: FLAGS[f].color }}>{FLAGS[f].label}</span></span>)}
                        {c.newsletter && <p className="text-xs text-gray-400 mt-1">newsletter</p>}</td>
                      <td className="px-4 py-3">{c.orders}{c.cancelled_orders > 0 && <span className="text-xs text-gray-400"> (+{c.cancelled_orders} cancelled)</span>}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(c.total_spend)}
                        {c.expected_90_day_spend != null && <p className="text-xs font-normal text-gray-400" title="A rough estimate from their usual pace and order size, scaled down if they have gone quiet">next 90 days ≈ {fmt(c.expected_90_day_spend)}</p>}</td>
                      <td className="px-4 py-3 text-gray-600">{c.orders ? fmt(c.average_order) : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(c.last_order)}
                        {c.days_since_last_order != null && <p className="text-xs text-gray-400">{c.days_since_last_order === 0 ? 'today' : `${c.days_since_last_order} days ago`}</p>}
                        {RISK[c.return_risk] && c.return_risk !== 'low' && <p className="text-xs" style={{ color: RISK[c.return_risk].color }}>{RISK[c.return_risk].label}</p>}</td>
                      <td className="px-4 py-3 text-gray-600">{c.active_plan ? <span className="capitalize">{c.active_plan}</span> : c.plans ? <span className="text-xs text-gray-400">ended {c.last_plan_end || ''}</span> : '—'}
                        {STAGES[c.dabba_stage] && c.dabba_stage !== 'prospect' && <p className="text-xs text-gray-400">{STAGES[c.dabba_stage].label}</p>}</td>
                      <td className="px-4 py-3 text-gray-600">{c.has_account ? c.loyalty_orders : '—'}{c.loyalty_reward_waiting && <p className="text-xs" style={{ color: '#2E7D32' }}>free dish waiting</p>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Insights data={insights} />
      {open && <CustomerPage email={open} onClose={() => setOpen(null)} />}
      {s.test_accounts > 0 && (
        <p className="text-xs text-gray-500">
          {showTest ? `Showing ${s.test_accounts} test account${s.test_accounts === 1 ? '' : 's'} as well.` : `${s.test_accounts} test account${s.test_accounts === 1 ? ' is' : 's are'} hidden (addresses such as test@test.com made while the site was being built). They are left out of every figure and never sent a message.`}{' '}
          <button onClick={() => setShowTest(!showTest)} className="underline" style={{ color: P }}>{showTest ? 'Hide them' : 'Show them'}</button>
        </p>
      )}
      <p className="text-xs text-gray-400">Select a row to open that customer's full history. People are matched on email address. Spend leaves out cancelled orders and cancelled plans. A plan counts as running only until its end date.</p>
    </div>
  );
}
