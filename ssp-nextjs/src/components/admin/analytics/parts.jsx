'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';

/* Pieces of Admin › Analytics added with the date calendar (owner, 10 Nov 2026): the period picker, figures against
   the period before, the traffic graph, and every visit told as a short story. */

export const P = '#800020';
const INK = '#2D2422';
const MUTED = '#7A6F6A';
const GRID = '#EFE8E1';
const card = { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };

// ── Dates (always the kitchen's: London) ───────────────────────────────────────
export const londonToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/London' }).format(new Date());
export const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const niceDate = (iso, withYear = false) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' });
export const rangeLabel = (r) => (r.start === r.end ? niceDate(r.start, true) : `${niceDate(r.start)} – ${niceDate(r.end, true)}`);

const PRESETS = [
  ['Today', 0, 0], ['Yesterday', 1, 1], ['Last 7 days', 6, 0], ['Last 30 days', 29, 0], ['Last 90 days', 89, 0],
];
export const presetRange = (back, upTo) => { const t = londonToday(); return { start: addDays(t, -back), end: addDays(t, -upTo) }; };

export function DateRange({ value, onChange }) {
  const today = londonToday();
  const match = PRESETS.find(([, b, u]) => { const r = presetRange(b, u); return r.start === value.start && r.end === value.end; });
  const [custom, setCustom] = useState(!match);
  const [draft, setDraft] = useState(value);
  const apply = (r) => onChange(r.start > r.end ? { start: r.end, end: r.start } : r);
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="date-range">
      {PRESETS.map(([label, b, u]) => {
        const on = !custom && match?.[0] === label;
        return (
          <button key={label} onClick={() => { setCustom(false); apply(presetRange(b, u)); }} className="px-3 py-1.5 rounded-full text-sm font-semibold border"
            style={on ? { backgroundColor: P, color: '#fff', borderColor: P } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>{label}</button>
        );
      })}
      <button onClick={() => { setCustom(true); setDraft(value); }} className="px-3 py-1.5 rounded-full text-sm font-semibold border"
        style={custom ? { backgroundColor: P, color: '#fff', borderColor: P } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>Pick dates</button>
      {custom && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={e => { e.preventDefault(); apply(draft); }}>
          <label className="text-xs text-gray-500">From <input type="date" value={draft.start} max={today} onChange={e => setDraft(d => ({ ...d, start: e.target.value }))}
            className="ml-1 px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#e0d9d0' }} aria-label="From" /></label>
          <label className="text-xs text-gray-500">to <input type="date" value={draft.end} max={today} onChange={e => setDraft(d => ({ ...d, end: e.target.value }))}
            className="ml-1 px-2 py-1.5 border rounded-lg text-sm" style={{ borderColor: '#e0d9d0' }} aria-label="To" /></label>
          <button type="submit" disabled={!draft.start || !draft.end} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: P }}>Show</button>
        </form>
      )}
    </div>
  );
}

// ── Figures against the period before ──────────────────────────────────────────
export function Change({ now, before, money = false, label }) {
  if (before == null) return null;
  if (!before && !now) return <span className="text-xs text-gray-400">no change on {label}</span>;
  if (!before) return <span className="text-xs font-semibold" style={{ color: '#2E7D32' }}>new — none in {label}</span>;
  const diff = (now - before) / before;
  const pctText = `${Math.abs(Math.round(diff * 100))}%`;
  if (Math.abs(diff) < 0.005) return <span className="text-xs text-gray-400">same as {label}</span>;
  const up = diff > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="text-xs font-semibold inline-flex items-center gap-0.5" style={{ color: up ? '#2E7D32' : '#B91C1C' }}
      title={`${label}: ${money ? `£${Number(before).toFixed(2)}` : before}`}>
      <Icon size={11} aria-hidden="true" /> {up ? 'up' : 'down'} {pctText} on {label}
    </span>
  );
}

// ── Traffic graph: one measure at a time, by day — or by hour for a single day ─────
function niceMax(v) {
  if (v <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => v / s <= 4) || 10 * mag;
  return Math.ceil(v / step) * step;
}

export function TrafficChart({ data }) {
  const single = data.days === 1;
  const [measure, setMeasure] = useState('page_views');
  const box = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = single
    ? (data.by_hour || []).map(h => ({ key: h.hour, label: `${String(h.hour).padStart(2, '0')}:00`, short: h.hour % 3 === 0 ? String(h.hour) : '', value: h.page_views, detail: `${h.page_views} page views` }))
    : (data.by_day || []).map(d => ({
      key: d.day, label: new Date(`${d.day}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
      short: niceDate(d.day), value: measure === 'visits' ? d.visits : d.page_views,
      detail: `${d.visits} visits · ${d.page_views} page views · ${d.orders} orders seen`,
    }));
  const H = 200, top = 12, bottom = 24, left = 34, right = 8;
  const plotW = width - left - right, plotH = H - top - bottom;
  const max = niceMax(Math.max(0, ...rows.map(r => r.value)));
  const n = Math.max(1, rows.length);
  const slot = plotW / n;
  const barW = Math.max(2, Math.min(36, slot - 2));       // a 2px gap between bars
  const y = (v) => top + plotH - (v / max) * plotH;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 64))));
  const total = rows.reduce((s, r) => s + r.value, 0);
  const busiest = rows.reduce((b, r) => (r.value > (b?.value ?? -1) ? r : b), null);
  const name = single ? 'page views' : measure === 'visits' ? 'visits' : 'page views';
  const bar = (x, yTop, w, h) => {
    const r = Math.min(4, w / 2, h);
    return `M${x},${yTop + h} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + w - r} Q${x + w},${yTop} ${x + w},${yTop + r} V${yTop + h} Z`;
  };

  return (
    <div className="bg-white rounded-xl p-4" style={card} data-testid="traffic-chart">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: P }}>
          {single ? 'Page views, hour by hour' : measure === 'visits' ? 'Visits, day by day' : 'Page views, day by day'}
        </h3>
        {!single && (
          <div className="ml-auto flex rounded-lg border overflow-hidden text-xs font-semibold" style={{ borderColor: '#e0d9d0' }} role="group" aria-label="Measure">
            {[['page_views', 'Page views'], ['visits', 'Visits']].map(([id, label]) => (
              <button key={id} onClick={() => setMeasure(id)} aria-pressed={measure === id} className="px-3 py-1.5"
                style={measure === id ? { backgroundColor: '#F7E9EC', color: P } : { color: '#5C4B47' }}>{label}</button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs mb-3" style={{ color: MUTED }}>
        {total} {name} in all{n > 1 && total ? `, ${total / n < 1 ? 'under 1' : `about ${Math.round(total / n)}`} a ${single ? 'hour' : 'day'} on average` : ''}
        {busiest?.value ? ` · busiest: ${busiest.label} (${busiest.value})` : ''}. UK time.
      </p>
      <div ref={box} className="relative" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={H} role="img" aria-label={`${name} by ${single ? 'hour' : 'day'}`} className="block">
          {ticks.map(t => (
            <g key={t}>
              <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
              <text x={left - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill={MUTED}>{Number.isInteger(t) ? t : t.toFixed(1)}</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const x = left + i * slot + (slot - barW) / 2;
            const h = Math.max(r.value ? 2 : 0, (r.value / max) * plotH);
            return (
              <g key={r.key}>
                {h > 0 && <path d={bar(x, top + plotH - h, barW, h)} fill={P} opacity={hover == null || hover === i ? 1 : 0.45} />}
                {i % labelEvery === 0 && <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="10" fill={MUTED}>{r.short}</text>}
                <rect x={left + i * slot} y={top} width={slot} height={plotH} fill="transparent"
                  onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
        {hover != null && rows[hover] && (
          <div className="absolute pointer-events-none bg-white rounded-lg px-3 py-2 text-xs shadow-lg border"
            style={{ borderColor: '#e0d9d0', top: 0, left: Math.min(Math.max(0, left + hover * slot + slot / 2 - 90), width - 180), width: 180, color: INK }}>
            <p className="font-semibold">{rows[hover].label}</p>
            <p style={{ color: MUTED }}>{rows[hover].detail}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Every visit, told as a short story ─────────────────────────────────────────
const OUTCOME_STYLE = {
  'Ordered': { bg: '#E8F5E9', fg: '#1B5E20' }, 'Bought a Dabba Wala plan': { bg: '#E8F5E9', fg: '#1B5E20' },
  'Left with food in the basket': { bg: '#FFF4E0', fg: '#7A4B00' }, 'Left at checkout': { bg: '#FFF4E0', fg: '#7A4B00' },
  'Left while paying': { bg: '#FDECEC', fg: '#8E1B1B' }, 'Hit a problem': { bg: '#FDECEC', fg: '#8E1B1B' }, 'Kitchen was closed': { bg: '#FDECEC', fg: '#8E1B1B' },
};
const outcomeStyle = (o) => OUTCOME_STYLE[o] || { bg: '#F3EFEA', fg: '#4A3F3B' };
const when = (iso) => new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function PeriodSummary({ summary, total, label, onPick, picked }) {
  if (!summary) return null;
  return (
    <div className="bg-white rounded-xl p-4" style={card} data-testid="period-summary">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-sm leading-relaxed" style={{ color: INK }}>{summary.text}</p>
      {summary.outcomes?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {onPick && <button onClick={() => onPick(null)} className="px-2.5 py-1 rounded-full text-xs font-semibold border"
            style={!picked ? { backgroundColor: P, color: '#fff', borderColor: P } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>All {total}</button>}
          {summary.outcomes.map(o => {
            const st = outcomeStyle(o.outcome);
            const on = picked === o.outcome;
            return (
              <button key={o.outcome} onClick={() => onPick?.(on ? null : o.outcome)} disabled={!onPick}
                className="px-2.5 py-1 rounded-full text-xs font-semibold" aria-pressed={on}
                style={{ backgroundColor: on ? P : st.bg, color: on ? '#fff' : st.fg }}>{o.outcome} · {o.visits}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function VisitStories({ visits, total, actionName, detail }) {
  const [open, setOpen] = useState(null);
  const [count, setCount] = useState(20);
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={card} data-testid="visit-stories">
      <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>
        Every visit — what they did, and why they likely left
      </h3>
      {visits.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">No visits match.</p> : visits.slice(0, count).map(v => {
        const st = outcomeStyle(v.story.outcome);
        const key = v.visit_id + v.started;
        return (
          <div key={key} className="border-t px-4 py-3" style={{ borderColor: '#f3eee8' }}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-semibold" style={{ color: INK }}>{when(v.started)}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: st.bg, color: st.fg }}>{v.story.outcome}</span>
              <span className="text-xs text-gray-500">{v.story.who} · {v.story.minutes < 1 ? 'under a minute' : `${v.story.minutes} min`}</span>
            </div>
            <p className="text-sm mt-1.5" style={{ color: '#4A3F3B' }}>{v.story.did}</p>
            <p className="text-sm mt-1 italic" style={{ color: v.ordered ? '#1B5E20' : '#6B4A3A' }}>{v.story.why}</p>
            <button onClick={() => setOpen(open === key ? null : key)} className="mt-1 text-xs font-semibold inline-flex items-center gap-1" style={{ color: P }}>
              {open === key ? <>Hide the steps <ChevronUp size={12} /></> : <>Every step ({v.events.length}) <ChevronDown size={12} /></>}
            </button>
            {open === key && (
              <ol className="mt-2 space-y-1">
                {v.events.map((e, i) => (
                  <li key={i} className="text-xs flex gap-3">
                    <span className="text-gray-400 w-12 shrink-0">{new Date(e.at + (e.at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-medium w-44 shrink-0">{actionName(e.name)}</span>
                    <span className="text-gray-500 break-all">{e.path}{detail(e) ? ` — ${detail(e)}` : ''}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      })}
      {visits.length > count && (
        <button onClick={() => setCount(count + 20)} className="w-full py-2 text-xs font-semibold border-t" style={{ borderColor: '#f0ebe6', color: P }}>
          Show 20 more ({visits.length - count} left{total > visits.length ? `; the latest ${visits.length} of ${total} are loaded` : ''})
        </button>
      )}
    </div>
  );
}
