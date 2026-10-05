'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
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

// Plain names for every action the site records. Anything not listed is shown as recorded.
const ACTION = {
  page_view: 'Viewed a page', page_leave: 'Left a page', scroll_depth: 'Scrolled down a page', click: 'Tapped a button or link',
  form_submit: 'Sent a form', search: 'Searched the menu', menu_category_view: 'Opened a menu section', view_item: 'Opened a dish',
  add_to_cart: 'Added to basket', remove_from_cart: 'Removed from basket', cart_quantity_change: 'Changed a quantity', view_cart: 'Opened the basket',
  delivery_type_selected: 'Chose delivery or collection', begin_checkout: 'Started checkout', postcode_checked: 'Checked a postcode',
  coupon_applied: 'Coupon accepted', coupon_failed: 'Coupon refused', payment_started: 'Started paying', payment_started_failed: 'Payment could not start',
  purchase: 'Order placed', order_placed_failed: 'Order failed', order_cancelled: 'Order cancelled',
  login: 'Signed in', login_failed: 'Sign-in failed', sign_up: 'Created an account', sign_up_failed: 'Account creation failed', logout: 'Signed out',
  password_reset_requested: 'Asked for a password reset', password_reset_done: 'Reset their password', profile_updated: 'Updated their details',
  address_saved: 'Saved an address', address_deleted: 'Deleted an address',
  begin_subscription: 'Started the Dabba Wala steps', subscription_step_view: 'Viewed a Dabba Wala step', select_subscription_plan: 'Chose a Dabba Wala plan',
  plan_priced: 'Priced a Dabba Wala plan', subscription_purchase: 'Dabba Wala plan bought', plan_purchased_failed: 'Dabba Wala purchase failed',
  meal_skipped: 'Skipped a meal', review_submitted: 'Left a review', review_dismissed: 'Dismissed a review request', dish_liked: 'Liked a dish',
  restock_alert_requested: 'Asked to be told when back in stock', reopen_alert_requested: 'Asked to be told when the kitchen reopens',
  loyalty_redeemed: 'Used a free loyalty dish', notifications_enabled: 'Turned on notifications', notify_me_signup: 'Joined a waiting list',
  newsletter_signup: 'Joined the newsletter', whatsapp_click: 'Tapped WhatsApp', enquiry_submit: 'Sent an enquiry', enquiry_reply: 'Replied to an enquiry',
  site_error: 'Script error on the site',
};
const actionName = (n) => ACTION[n] || n.replace(/_/g, ' ');
const time = (iso) => new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const detail = (e) => [e.props.label, e.props.term && `"${e.props.term}"`, e.items.join(', '), e.props.value != null && fmt(e.props.value), e.props.transaction_id,
  e.props.coupon, e.props.plan, e.props.method, e.props.reason, e.props.message, e.props.percent != null && `${e.props.percent}%`, e.props.seconds != null && `${e.props.seconds}s`]
  .filter(Boolean).join(' · ');

function Visits({ visits }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={card}>
      <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>Latest visits — everything each visitor did</h3>
      {visits.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Nothing recorded yet.</p> : visits.map(v => (
        <div key={v.visit_id + v.started} className="border-t" style={{ borderColor: '#f9f6ee' }}>
          <button onClick={() => setOpen(open === v.visit_id ? null : v.visit_id)} className="w-full px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-left text-sm hover:bg-gray-50">
            <span className="font-medium w-28 shrink-0">{time(v.started)}</span>
            <span className="text-gray-600">{v.source}</span>
            <span className="text-gray-400 text-xs">{v.device || '—'} · {v.events.length} actions · {v.minutes} min{v.returning ? ' · returning' : ''}{v.signed_in ? ' · signed in' : ''}</span>
            {v.ordered ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>Ordered</span>
              : v.added_to_basket ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FFF8E1', color: '#8D6E00' }}>Basket, no order</span> : null}
            <span className="ml-auto text-gray-400">{open === v.visit_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
          </button>
          {open === v.visit_id && (
            <ol className="px-4 pb-3 space-y-1">
              {v.events.map((e, i) => (
                <li key={i} className="text-xs flex gap-3">
                  <span className="text-gray-400 w-12 shrink-0">{new Date(e.at + (e.at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-medium w-48 shrink-0">{actionName(e.name)}</span>
                  <span className="text-gray-500 break-all">{e.path}{detail(e) ? ` — ${detail(e)}` : ''}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}

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
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [a, v] = await Promise.all([api.get('/admin/analytics', { params: { days } }), api.get('/admin/analytics/visits', { params: { limit: 40 } })]);
      setData(a.data); setVisits(v.data.visits || []);
    }
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

      {(() => {
        const funnelRows = (list) => (list || []).map(f => [f.name, f.visits, f.view_item, f.add_to_cart, f.begin_checkout, f.payment_started, f.purchase, pct(f.purchase, f.visits)]);
        const head = (first) => [first, 'Visits', 'Opened a dish', 'Added to basket', 'Started checkout', 'Started paying', 'Ordered', 'Visits that ordered'];
        const stopTop = Math.max(1, ...(data.stopped_at || []).map(x => x.visits));
        const subTop = (data.subscription_funnel || [])[0]?.visits || 0;
        return (
          <>
            <Table title="From the page they landed on to an order" empty="Nothing recorded yet." head={head('Landed on')} rows={funnelRows(data.landing_funnels)} />
            <div className="grid lg:grid-cols-2 gap-5">
              <Table title="Phone or computer" empty="Nothing recorded yet." head={head('Device')} rows={funnelRows(data.device_funnels)} />
              <Table title="First visit or returning" empty="Nothing recorded yet." head={head('Visitor')} rows={funnelRows(data.visitor_funnels)} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl p-4" style={card}>
                <h3 className="font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Where visits that did not order stopped</h3>
                <p className="text-xs text-gray-500 mb-3">The furthest each visit got.</p>
                {(data.stopped_at || []).map(x => (
                  <div key={x.step} className="mb-2">
                    <div className="flex justify-between text-sm"><span>{x.step}, then left</span><span className="text-gray-600">{x.visits}</span></div>
                    <div className="h-2 rounded-full mt-1" style={{ backgroundColor: '#f3ece6' }}><div className="h-2 rounded-full" style={{ width: `${(x.visits / stopTop) * 100}%`, backgroundColor: P }} /></div>
                  </div>
                ))}
                <p className="text-sm text-gray-600 mt-3">
                  <b>{data.abandoned?.visits || 0}</b> visit{(data.abandoned?.visits || 0) === 1 ? '' : 's'} left with food in the basket, worth about <b>{fmt(data.abandoned?.basket_value)}</b>.
                  {data.minutes_to_order?.median != null && <> Those who ordered took a typical <b>{data.minutes_to_order.median} minutes</b> from arriving to ordering.</>}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4" style={card}>
                <h3 className="font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Dabba Wala: step by step</h3>
                <p className="text-xs text-gray-500 mb-3">Visits that reached each step of choosing and buying a plan.</p>
                {subTop === 0 ? <p className="text-sm text-gray-400">No one has started the plan steps in this period.</p> : data.subscription_funnel.map(x => (
                  <div key={x.step} className="mb-2">
                    <div className="flex justify-between text-sm"><span>{x.step}</span><span className="text-gray-600">{x.visits} <span className="text-xs text-gray-400">({pct(x.visits, subTop)})</span></span></div>
                    <div className="h-2 rounded-full mt-1" style={{ backgroundColor: '#f3ece6' }}><div className="h-2 rounded-full" style={{ width: `${Math.max(2, (x.visits / subTop) * 100)}%`, backgroundColor: '#2E7D32' }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <Table title="Last thing done before leaving the checkout" empty="No one has left the checkout in this period." head={['Last action', 'Visits']}
                rows={(data.last_action_before_leaving_checkout || []).map(d => [d.name, d.count])} />
              <Table title="Last thing done before leaving with a basket" empty="No one has left with a basket in this period." head={['Last action', 'Visits']}
                rows={(data.last_action_before_leaving_with_a_basket || []).map(d => [d.name, d.count])} />
            </div>

            <Table title="Dishes taken back out of the basket" empty="Nothing has been removed from a basket in this period." head={['Dish', 'Removed', 'Added', 'Removed for every 10 added']}
              rows={(data.removals || []).map(d => [d.name, d.removed, d.added, d.removal_rate == null ? '—' : Math.round(d.removal_rate * 10)])} />
          </>
        );
      })()}

      <div className="grid lg:grid-cols-2 gap-5">
        <Table title="Checkout, step by step" empty="No one has reached checkout in this period." head={['Step', 'Visits']}
          rows={(data.checkout || []).filter(c => c.visits > 0 || c.step !== 'Payment or order failed').map(c => [c.step, c.visits])} />
        <Table title="Where visits end without an order" empty="Nothing recorded yet." head={['Last page seen', 'Visits']}
          rows={(data.exit_pages || []).map(d => [d.name, d.count])} />
      </div>

      <Table title="How each dish is doing" empty="Nothing recorded yet." head={['Dish', 'Opened', 'Added to basket', 'Ordered', 'Reading']}
        rows={(data.dish_ranking || []).map(d => [d.name, d.opened, d.added, d.ordered, d.verdict])} />

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

      <Table title="Every action recorded" empty="Nothing recorded yet." head={['Action', 'Times', 'In how many visits']}
        rows={(data.actions || []).map(a => [actionName(a.name), a.count, a.visits])} />

      <div className="grid lg:grid-cols-2 gap-5">
        <Table title="Buttons and links tapped most" empty="Nothing recorded yet." head={['Button or link', 'Where', 'Page', 'Taps']}
          rows={(data.top_clicks || []).map(c => [c.label, c.area, c.page, c.count])} />
        <div className="space-y-5">
          <Table title="What people searched for" empty="No searches yet." head={['Search', 'Times']} rows={(data.searches || []).map(d => [d.name, d.count])} />
          <Table title="Problems visitors hit" empty="None recorded." head={['Problem', 'Detail', 'Page', 'Times']}
            rows={(data.problems || []).map(p => [actionName(p.name), p.detail || '—', p.page, p.count])} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Table title="Time spent and how far people scroll" empty="Nothing recorded yet." head={['Page', 'Views measured', 'Average time', 'Average scroll']}
          rows={(data.time_on_page || []).map(r => [r.page, r.views, r.average_seconds >= 60 ? `${Math.floor(r.average_seconds / 60)}m ${r.average_seconds % 60}s` : `${r.average_seconds}s`, `${r.average_scroll}%`])} />
        <div className="bg-white rounded-xl p-4" style={card}>
          <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Busiest hours (UK time)</h3>
          <div className="flex items-end gap-1 h-32">
            {(data.by_hour || []).map(h => { const max = Math.max(1, ...data.by_hour.map(x => x.page_views)); return { ...h, uk: h.hour, max }; })
              .sort((a, b) => a.uk - b.uk).map(h => (
                <div key={h.uk} className="flex-1 flex flex-col items-center justify-end h-full" title={`${String(h.uk).padStart(2, '0')}:00 — ${h.page_views} page views`}>
                  <div className="w-full rounded-t" style={{ height: `${(h.page_views / h.max) * 100}%`, minHeight: h.page_views ? 3 : 0, backgroundColor: P }} />
                  <span className="text-[9px] text-gray-400 mt-1">{h.uk % 3 === 0 ? h.uk : ''}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <Visits visits={visits} />

      <p className="text-xs text-gray-400">
        This is the site's own count, kept on our server, and starts from the day it was switched on. It will not match Google Analytics exactly.
        A visit is one sitting on the site. Phones: {data.devices.phone || 0} · computers: {data.devices.desktop || 0}. Staff screens are not counted. No names or contact details are recorded here.
      </p>
    </div>
  );
}
