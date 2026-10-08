'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Download, Copy } from 'lucide-react';
import api from '@/api';

/* Admin › Analytics — the site's own record of visits (not Google's): visits, the path to an
   order, where visitors came from, and which dishes are looked at and added. */

const P = '#800020';
const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const STEP = {
  page_view: 'Visited the site', looked_at_menu: 'Looked at the menu or a dish', view_item: 'Opened a dish', add_to_cart: 'Added to basket',
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
  site_error: 'Script error on the site', field_focus: 'Moved to a form field', repeated_taps: 'Tapped the same thing repeatedly',
  slots_viewed: 'Saw the collection times', slot_selected: 'Chose a collection time',
};
const actionName = (n) => ACTION[n] || n.replace(/_/g, ' ');
const time = (iso) => new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const detail = (e) => [e.props.label, e.props.term && `"${e.props.term}"`, e.items.join(', '), e.props.value != null && fmt(e.props.value), e.props.transaction_id,
  e.props.coupon, e.props.plan, e.props.method, e.props.reason, e.props.message, e.props.percent != null && `${e.props.percent}%`, e.props.seconds != null && `${e.props.seconds}s`]
  .filter(Boolean).join(' · ');

function Visits({ visits }) {
  const [open, setOpen] = useState(null);
  const [count, setCount] = useState(10);
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={card}>
      <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>Latest visits — everything each visitor did</h3>
      {visits.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Nothing recorded yet.</p> : visits.slice(0, count).map(v => (
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
                  <span className="text-gray-400 w-12 shrink-0">{new Date(e.at + (e.at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-medium w-48 shrink-0">{actionName(e.name)}</span>
                  <span className="text-gray-500 break-all">{e.path}{detail(e) ? ` — ${detail(e)}` : ''}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
      {visits.length > count && (
        <button onClick={() => setCount(count + 10)} className="w-full py-2 text-xs font-semibold border-t" style={{ borderColor: '#f0ebe6', color: P }}>Show 10 more ({visits.length - count} left)</button>
      )}
    </div>
  );
}

const SHORT = 8;

function Table({ title, head, rows, empty }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, SHORT);
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={card}>
      <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>{title}</h3>
      {rows.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">{empty}</p> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#FDFBF7' }}><tr>{head.map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{shown.map((r, i) => <tr key={i} className="border-t" style={{ borderColor: '#f9f6ee' }}>{r.map((c, j) => <td key={j} className={`px-4 py-2 ${j === 0 ? 'font-medium break-all' : 'text-gray-600 whitespace-nowrap'}`}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {rows.length > SHORT && (
            <button onClick={() => setAll(!all)} className="w-full py-2 text-xs font-semibold border-t" style={{ borderColor: '#f0ebe6', color: P }}>
              {all ? 'Show fewer' : `Show all ${rows.length}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Dishes({ dishes }) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');
  const [touched, setTouched] = useState(false);
  const sectionsList = [...new Set(dishes.map(d => d.section).filter(Boolean))];
  const q = query.trim().toLowerCase();
  const rows = dishes.filter(d => (section === 'all' || d.section === section) && (!q || d.name.toLowerCase().includes(q)) && (!touched || d.opened || d.added || d.ordered));
  const active = dishes.filter(d => d.opened || d.added || d.ordered).length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a dish" aria-label="Find a dish" className="px-3 py-2 text-sm border rounded-lg w-56" style={{ borderColor: '#e0d9d0' }} />
        <select value={section} onChange={e => setSection(e.target.value)} aria-label="Menu section" className="px-3 py-2 text-sm border rounded-lg bg-white" style={{ borderColor: '#e0d9d0' }}>
          <option value="all">Every section</option>
          {sectionsList.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <label className="text-sm text-gray-600 flex items-center gap-2"><input type="checkbox" checked={touched} onChange={e => setTouched(e.target.checked)} /> Only dishes someone has looked at</label>
        <span className="text-sm text-gray-500 ml-auto">{dishes.length} dishes on the menu · {active} looked at, added or ordered in this period</span>
      </div>
      <Table key={`${q}|${section}|${touched}`} title="How each dish is doing" empty="No dish matches." head={['Dish', 'Section', 'Price', 'Opened', 'Added to basket', 'Ordered (seen in visits)', 'Reading']}
        rows={rows.map(d => [d.name, d.section || '—', d.price != null ? fmt(d.price) : '—', d.opened, d.added, d.ordered, d.verdict])} />
    </div>
  );
}

const VIEWS = [
  ['summary', 'Summary', 'Totals, the path to an order, and where visitors came from'],
  ['journeys', 'Journeys', 'Where people land, where they stop, and why'],
  ['dishes', 'Dishes', 'What is looked at, added and ordered'],
  ['behaviour', 'Behaviour', 'Pages, taps, searches, problems, timing'],
  ['visits', 'Visits', 'The latest visits, one by one'],
];

/** Every figure on this screen as plain sections: used for the download and for "copy summary". */
function sections(data, days) {
  const f = (list) => (list || []).map(x => [x.name, x.visits, x.looked_at_menu, x.add_to_cart, x.begin_checkout, x.payment_started, x.purchase]);
  const fh = (first) => [first, 'Visits', 'Looked at the menu', 'Added to basket', 'Started checkout', 'Started paying', 'Ordered'];
  const t = data.totals;
  const book = data.order_book || { orders: t.orders, income: t.income, orders_seen_in_a_visit: t.orders, plans_sold: t.plans_sold };
  return [
    [`Totals, last ${days} days`, ['Visits', 'Pages viewed', 'Orders', 'Order income', 'Plans sold', 'Orders traced to a visit'],
      [[t.visits, t.page_views, book.orders, book.income, book.plans_sold, book.orders_seen_in_a_visit]]],
    ['From visit to order', ['Step', 'Visits'], data.funnel.map(x => [STEP[x.step] || x.step, x.visits])],
    ['Where visitors came from', ['Source', 'Visits', 'Added to basket', 'Orders seen in visits', 'Income seen in visits (estimate)'], data.sources.map(x => [x.source, x.visits, x.added_to_basket, x.orders, x.income])],
    ['By landing page', fh('Landed on'), f(data.landing_funnels)],
    ['By device', fh('Device'), f(data.device_funnels)],
    ['By visitor type', fh('Visitor'), f(data.visitor_funnels)],
    ['By day of the week', fh('Day'), f(data.weekday_funnels)],
    ['Where visits that did not order stopped', ['Furthest step', 'Visits'], (data.stopped_at || []).map(x => [x.step, x.visits])],
    ['Left with food in the basket', ['Visits', 'Basket value'], [[data.abandoned?.visits || 0, data.abandoned?.basket_value || 0]]],
    ['Checkout step by step', ['Step', 'Visits'], (data.checkout || []).map(x => [x.step, x.visits])],
    ['Last action before leaving the checkout', ['Action', 'Visits'], (data.last_action_before_leaving_checkout || []).map(x => [x.name, x.count])],
    ['Last action before leaving with a basket', ['Action', 'Visits'], (data.last_action_before_leaving_with_a_basket || []).map(x => [x.name, x.count])],
    ['Dabba Wala step by step', ['Step', 'Visits'], (data.subscription_funnel || []).map(x => [x.step, x.visits])],
    ['Minutes between steps', ['Between', 'Typical minutes', 'Visits measured'], (data.step_times || []).map(x => [x.between, x.median_minutes ?? '', x.visits])],
    ['Dishes', ['Dish', 'Section', 'Price', 'Opened', 'Added to basket', 'Ordered (seen in visits)', 'Reading'], (data.dish_ranking || []).map(x => [x.name, x.section, x.price ?? '', x.opened, x.added, x.ordered, x.verdict])],
    ['Dishes taken back out of the basket', ['Dish', 'Removed', 'Added'], (data.removals || []).map(x => [x.name, x.removed, x.added])],
    ['Add rate by price', ['Price', 'Opened', 'Added'], (data.price_bands || []).map(x => [x.band, x.opened, x.added])],
    ['Pages viewed most', ['Page', 'Views'], data.top_pages.map(x => [x.name, x.count])],
    ['Where visits ended without an order', ['Page', 'Visits'], (data.exit_pages || []).map(x => [x.name, x.count])],
    ['Time and scroll per page', ['Page', 'Views measured', 'Average seconds', 'Average scroll %'], (data.time_on_page || []).map(x => [x.page, x.views, x.average_seconds, x.average_scroll])],
    ['Every action', ['Action', 'Times', 'Visits'], (data.actions || []).map(x => [actionName(x.name), x.count, x.visits])],
    ['Buttons and links tapped most', ['Label', 'Where', 'Page', 'Taps'], (data.top_clicks || []).map(x => [x.label, x.area, x.page, x.count])],
    ['Searches', ['Search', 'Times'], (data.searches || []).map(x => [x.name, x.count])],
    ['Problems visitors hit', ['Problem', 'Detail', 'Page', 'Times'], (data.problems || []).map(x => [actionName(x.name), x.detail, x.page, x.count])],
    ['Field people were on when they gave up', ['Page', 'Form', 'Field', 'Visits'], (data.field_drop_off || []).map(x => [x.page, x.form, x.last_field, x.visits])],
    ['Day by day', ['Day', 'Visits', 'Page views', 'Orders seen in visits', 'Income seen in visits (estimate)'], data.by_day.map(x => [x.day, x.visits, x.page_views, x.orders, x.income])],
    ['Busiest hours (UK)', ['Hour', 'Page views'], (data.by_hour || []).map(x => [`${x.hour}:00`, x.page_views])],
  ].filter(([, , rows]) => rows.length);
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function AnalyticsTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [visits, setVisits] = useState([]);
  const [view, setView] = useState('summary');
  const [copied, setCopied] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // "Don't count this device": kept in this browser only, so it holds when the owner browses signed out
  const [deviceOff, setDeviceOff] = useState(false);
  useEffect(() => { try { setDeviceOff(localStorage.getItem('ssp_no_track') === '1'); } catch {} }, []);
  const setDevice = (off) => {
    try { if (off) localStorage.setItem('ssp_no_track', '1'); else localStorage.removeItem('ssp_no_track'); } catch {}
    setDeviceOff(off);
  };

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
  // Orders and income come from the order book, which is the truth; the visit record only knows the orders it saw placed
  const book = data.order_book || { orders: t.orders, income: t.income, orders_seen_in_a_visit: t.orders, plans_sold: t.plans_sold };
  const top = data.funnel[0]?.visits || 0;
  const maxDay = Math.max(1, ...data.by_day.map(d => d.visits));
  const cards = [
    ['Visits', t.visits, `${t.page_views} pages viewed`],
    ['Orders', book.orders, `${pct(book.orders, t.visits)} of visits${book.orders_seen_in_a_visit < book.orders ? ` · ${book.orders_seen_in_a_visit} traced to a visit` : ''}`],
    ['Order income', fmt(book.income), book.orders ? `average ${fmt(book.income / book.orders)}` : 'no orders in this period'],
    ['Dabba Wala plans sold', book.plans_sold, `${t.returning_visitors_known} visitors accepted cookies`],
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

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => {
          const out = [`Sree Svadista Prasada — site analytics, last ${days} days, downloaded ${new Date().toLocaleString('en-GB')}`, ''];
          sections(data, days).forEach(([title, head, rows]) => { out.push(csvCell(title)); out.push(head.map(csvCell).join(',')); rows.forEach(r => out.push(r.map(csvCell).join(','))); out.push(''); });
          const blob = new Blob(['\ufeff' + out.join('\n')], { type: 'text/csv;charset=utf-8' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `analytics-${days}-days-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
        }} className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: P, color: '#fff' }}><Download size={15} /> Download everything (spreadsheet)</button>
        <button onClick={async () => {
          const text = [`Sree Svadista Prasada — site analytics, last ${days} days`, ''];
          sections(data, days).forEach(([title, head, rows]) => { text.push(`## ${title}`); text.push(head.join(' | ')); rows.slice(0, 15).forEach(r => text.push(r.join(' | '))); text.push(''); });
          try { await navigator.clipboard.writeText(text.join('\n')); setCopied('Copied. Paste it into a message or a document.'); } catch { setCopied('Could not copy — use the download instead.'); }
          setTimeout(() => setCopied(''), 5000);
        }} className="px-3 py-2 rounded-lg text-sm font-semibold border flex items-center gap-2" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}><Copy size={15} /> Copy as text</button>
        <button onClick={() => window.print()} className="px-3 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Print or save as PDF</button>
        {copied && <span className="text-sm text-gray-600" role="status">{copied}</span>}
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

      <div className="flex flex-wrap gap-2 border-b pb-3" style={{ borderColor: '#e9e2d8' }} role="tablist" aria-label="Analytics sections">
        {VIEWS.map(([id, label, hint]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)} title={hint} className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={view === id ? { backgroundColor: '#F7E9EC', color: P } : { color: '#5C4B47' }}>{label}</button>
        ))}
      </div>
      <p className="text-xs text-gray-500 -mt-2">{VIEWS.find(v => v[0] === view)[2]}.</p>

      {view === 'summary' && (<>
      <div className="bg-white rounded-xl p-4" style={card}>
        <h3 className="font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: P }}>From visit to order</h3>
        {top === 0 ? <p className="text-sm text-gray-400">No visits recorded in this period yet.</p> : data.funnel.map((f, i) => (
          <div key={f.step} className="mb-2">
            <div className="flex justify-between text-sm"><span>{STEP[f.step] || f.step}</span>
              <span className="text-gray-600">{f.visits} <span className="text-xs text-gray-400">({pct(f.visits, top)}{i > 0 && data.funnel[i - 1].visits >= f.visits && data.funnel[i - 1].visits > 0 ? `, ${pct(f.visits, data.funnel[i - 1].visits)} of the step before` : ''})</span></span></div>
            <div className="h-2.5 rounded-full mt-1" style={{ backgroundColor: '#f3ece6' }}><div className="h-2.5 rounded-full" style={{ width: `${Math.max(2, (f.visits / top) * 100)}%`, backgroundColor: P }} /></div>
          </div>
        ))}
      </div>

      <Table title="Where visitors came from" empty="Nothing recorded yet."
        head={['Source', 'Visits', 'Added to basket', 'Orders', 'Income']}
        rows={data.sources.map(s => [s.source, s.visits, s.added_to_basket, s.orders, fmt(s.income)])} />

      </>)}
      {view === 'journeys' && (<>
      {(() => {
        const funnelRows = (list) => (list || []).map(f => [f.name, f.visits, f.looked_at_menu, f.add_to_cart, f.begin_checkout, f.payment_started, f.purchase, pct(f.purchase, f.visits)]);
        const head = (first) => [first, 'Visits', 'Looked at the menu', 'Added to basket', 'Started checkout', 'Started paying', 'Ordered', 'Visits that ordered'];
        const stopTop = Math.max(1, ...(data.stopped_at || []).map(x => x.visits));
        const subTop = (data.subscription_funnel || [])[0]?.visits || 0;
        return (
          <>
            <Table title="From the page they landed on to an order" empty="Nothing recorded yet." head={head('Landed on')} rows={funnelRows(data.landing_funnels)} />
            <Table title="Phone or computer" empty="Nothing recorded yet." head={head('Device')} rows={funnelRows(data.device_funnels)} />
            <Table title="First visit or returning" empty="Nothing recorded yet." head={head('Visitor')} rows={funnelRows(data.visitor_funnels)} />

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

            <Table title="By day of the week" empty="Nothing recorded yet." head={head('Day')} rows={funnelRows(data.weekday_funnels)} />

            <div className="grid lg:grid-cols-2 gap-5">
              <Table title="How long each step takes" empty="Nothing recorded yet." head={['Between', 'Typical minutes', 'Visits measured']}
                rows={(data.step_times || []).filter(t => t.visits > 0).map(t => [t.between, t.median_minutes, t.visits])} />
              <Table title="Does price put people off?" empty="No dish views with a price recorded yet." head={['Dish price', 'Opened', 'Added to basket', 'Added for every 10 opened']}
                rows={(data.price_bands || []).map(b => [b.band, b.opened, b.added, b.add_rate == null ? '—' : Math.round(b.add_rate * 10)])} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <Table title="Page routes that ended in an order" empty="No orders in this period." head={['Pages, in order', 'Visits']} rows={(data.paths_that_ordered || []).map(d => [d.name, d.count])} />
              <Table title="Page routes that ended without one" empty="Nothing recorded yet." head={['Pages, in order', 'Visits']} rows={(data.paths_that_left || []).map(d => [d.name, d.count])} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <Table title="The field people were on when they gave up" empty="No one has left part-way through a form in this period." head={['Page', 'Form', 'Last field touched', 'Visits']}
                rows={(data.field_drop_off || []).map(f => [f.page, f.form, f.last_field, f.visits])} />
              <Table title="Tapped again and again" empty="Nothing has been tapped repeatedly in this period." head={['What was tapped', 'Page', 'Visits']}
                rows={(data.repeated_taps || []).map(t => [t.label, t.page, t.visits])} />
            </div>

            <div className="bg-white rounded-xl p-4" style={card}>
              <h3 className="font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Collection times</h3>
              {(() => {
                const c = data.collection_slots || { times_shown: {}, chosen: [] };
                const t = c.times_shown.today || {}, m = c.times_shown.tomorrow || {};
                if (!t.views && !m.views && !c.chosen.length) return <p className="text-sm text-gray-400">No one has looked at collection times in this period.</p>;
                return (
                  <>
                    <p className="text-sm text-gray-600">
                      Today's times were shown {t.views || 0} times{t.average_percent_full != null ? `, on average ${t.average_percent_full}% already full` : ''}.
                      Tomorrow's were shown {m.views || 0} times{m.average_percent_full != null ? `, ${m.average_percent_full}% full` : ''}.
                      {c.chose_asap_share != null && ` ${Math.round(c.chose_asap_share * 100)}% of choices were "as soon as possible".`}
                    </p>
                    {c.chosen.length > 0 && <p className="text-sm text-gray-600 mt-2"><span className="text-gray-500">Chosen most:</span> {c.chosen.map(x => `${x.name} (${x.count})`).join(', ')}</p>}
                  </>
                );
              })()}
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
      </>)}

      {view === 'dishes' && (<>
      <Dishes dishes={data.dish_ranking || []} />

      <div className="grid lg:grid-cols-2 gap-5">
        <Table title="Dishes opened most" empty="Nothing recorded yet." head={['Dish', 'Times opened']} rows={data.most_viewed_dishes.map(d => [d.name, d.count])} />
        <Table title="Dishes added to basket most" empty="Nothing recorded yet." head={['Dish', 'Quantity added']} rows={data.most_added_dishes.map(d => [d.name, d.count])} />
      </div>
      </>)}

      {view === 'behaviour' && (<>
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
                  <span className="text-[10px] text-gray-400 mt-1">{h.uk % 3 === 0 ? h.uk : ''}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
      </>)}

      {view === 'visits' && (<>
      <Visits visits={visits} />
      </>)}

      <p className="text-xs text-gray-400">
        This is the site's own count, kept on our server. It will not match Google Analytics exactly. A visit is one sitting: everything the same browser does with no pause longer than 30 minutes.
        Your own visits while signed in as admin, automated browsers and search-engine crawlers are not counted. The cards take orders and income from the order book, which is the truth. Columns marked "seen in visits" count only what the visit record saw being placed — a lost connection or a later cancellation makes them differ, so treat them as estimates.
        Time on a page counts only while the page is on screen. All times are UK time. Phones: {data.devices.phone || 0} · computers: {data.devices.desktop || 0}. No names or contact details are recorded here.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setConfirmReset(true)} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Start counting afresh…</button>
        <span className="text-xs text-gray-400">Empties the visit record, for example to clear visits made while the site was being tested.</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#5C4B47' }}>
          <input type="checkbox" checked={deviceOff} onChange={e => setDevice(e.target.checked)} /> Don't count visits from this device
        </label>
        <span className="text-xs text-gray-400">
          {deviceOff ? 'This browser is not counted, even when signed out. ' : 'Signed-out browsing from this browser counts as visits. '}
          Set it on each phone or computer you test from, by opening this screen there.
        </span>
      </div>
      {confirmReset && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label="Confirm" data-notrack>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Start counting afresh?</h3>
            <p className="text-sm"><span className="text-gray-500">Now:</span> {t.visits} visits recorded in the last {days} days, and everything before.</p>
            <p className="text-sm"><span className="text-gray-500">After:</span> the visit record is empty and counting starts again from this moment.</p>
            <p className="text-sm"><span className="text-gray-500">Not affected:</span> orders, customers, meal plans, messages, the menu.</p>
            <p className="text-sm" style={{ color: '#B91C1C' }}>This cannot be undone. Download the figures first if you want to keep them.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setConfirmReset(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: '#e0d9d0', color: '#5C4B47' }}>Keep the record</button>
              <button onClick={async () => { try { await api.post('/admin/analytics/reset'); setCopied('The visit record is empty. Counting starts again now.'); } catch { setCopied('That did not work. Please try again.'); } setConfirmReset(false); load(); }}
                className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ backgroundColor: P, color: '#fff' }}>Yes, empty it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
