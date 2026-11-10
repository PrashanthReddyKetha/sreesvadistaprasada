'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '@/api';
import { P } from './parts';

/* The analyst's reading (Claude Opus) of whatever dates are picked: written once per range in the background,
   saved, and opened again for free. One reading covers the whole screen, with a part for each tab (owner, 10 Nov 2026). */

const INK = '#2D2422';
const MUTED = '#6B5F5A';
const card = { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const POLL_MS = 6000;

export function useAnalysis(range) {
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const key = `${range.start}|${range.end}`;

  const write = useCallback(async (again = false) => {
    setBusy(true);
    try {
      const r = await api.post('/admin/analytics/analysis', { start: range.start, end: range.end, again });
      setDoc(r.data);
    } catch { setDoc(d => ({ ...(d || {}), status: 'failed', why: 'could not reach the server' })); }
    finally { setBusy(false); }
  }, [range.start, range.end]);

  useEffect(() => {
    let gone = false;
    api.get('/admin/analytics/analysis', { params: { start: range.start, end: range.end } }).then(r => {
      if (gone) return;
      setDoc(r.data);
      // Picking dates is asking for their reading: write it when there is none yet, or today's has gone stale
      if (r.data.status === 'none' || (r.data.status === 'ready' && !r.data.fresh)) write(false);
    }).catch(() => { if (!gone) setDoc({ status: 'failed', why: 'could not reach the server' }); });
    return () => { gone = true; };
  }, [key, write]); // eslint-disable-line react-hooks/exhaustive-deps

  // While it is being written, look again every few seconds
  useEffect(() => {
    if (doc?.status !== 'working') return undefined;
    const t = setTimeout(() => {
      api.get('/admin/analytics/analysis', { params: { start: range.start, end: range.end } }).then(r => setDoc(r.data)).catch(() => setDoc(d => ({ ...d })));
    }, POLL_MS);
    return () => clearTimeout(t);
  }, [doc, range.start, range.end]);

  return { doc, busy, write, setDoc };
}

const paras = (text) => String(text || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
const written = (iso) => new Date(String(iso) + (String(iso).endsWith('Z') ? '' : 'Z')).toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Limit({ ai, onSaved }) {
  const [edit, setEdit] = useState(false);
  const [cap, setCap] = useState(ai?.cost_cap_usd ?? 5);
  const [calls, setCalls] = useState(ai?.call_cap ?? 40);
  const [msg, setMsg] = useState('');
  if (!ai) return null;
  const save = async () => {
    try { const r = await api.put('/admin/ai/limits', { cost_cap_usd: Number(cap), call_cap: Number(calls) }); onSaved(r.data); setEdit(false); setMsg(''); }
    catch { setMsg('Could not save.'); }
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>AI this month: ${Number(ai.cost_usd).toFixed(2)} of ${Number(ai.cost_cap_usd).toFixed(2)} · {ai.calls} of {ai.call_cap} uses</span>
      {!edit ? <button onClick={() => setEdit(true)} className="underline" style={{ color: P }}>Change limit</button> : (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          $<input type="number" min="0" max="500" step="1" value={cap} onChange={e => setCap(e.target.value)} aria-label="Monthly AI spending limit in dollars"
            className="w-16 px-1.5 py-0.5 border rounded" style={{ borderColor: '#e0d9d0' }} />
          a month, up to <input type="number" min="0" max="5000" step="10" value={calls} onChange={e => setCalls(e.target.value)} aria-label="Monthly AI uses"
            className="w-16 px-1.5 py-0.5 border rounded" style={{ borderColor: '#e0d9d0' }} /> uses
          <button onClick={save} className="px-2 py-0.5 rounded text-white font-semibold" style={{ backgroundColor: P }}>Save</button>
          <button onClick={() => setEdit(false)} className="underline">Cancel</button>
        </span>
      )}
      {msg && <span style={{ color: '#B91C1C' }}>{msg}</span>}
    </span>
  );
}

function Points({ title, icon: Icon, color, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color }}><Icon size={13} aria-hidden="true" /> {title}</p>
      <ol className="space-y-2.5">
        {items.map((f, i) => (
          <li key={i} className="text-sm leading-relaxed" style={{ color: INK }}>
            <b>{f.area}.</b> <span style={{ color: MUTED }}>{f.evidence}</span>
            <span className="flex gap-1.5 mt-0.5"><ArrowRight size={14} className="shrink-0 mt-0.5" style={{ color }} aria-hidden="true" /><span>{f.action}</span></span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AnalystReading({ analysis, label }) {
  const { doc, busy, write, setDoc } = analysis;
  const r = doc?.reading;
  const status = doc?.status;
  return (
    <div className="bg-white rounded-xl p-5 space-y-4" style={{ ...card, borderTop: `3px solid ${P}` }} data-testid="analyst-reading">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles size={16} style={{ color: P }} aria-hidden="true" />
        <h3 className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: P }}>The analyst&apos;s reading · {label}</h3>
        {r && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F3EFEA', color: MUTED }}>{doc.reading.confidence} confidence</span>}
        {(status === 'ready' || status === 'failed' || status === 'skipped') && (
          <button onClick={() => write(true)} disabled={busy} className="ml-auto text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50" style={{ color: P }}>
            <RefreshCw size={12} className={busy ? 'animate-spin' : ''} /> {status === 'ready' ? 'Write it again' : 'Try again'}
          </button>
        )}
      </div>

      {(!doc || status === 'working' || status === 'none') && (
        <p className="text-sm" style={{ color: MUTED }}>
          <RefreshCw size={13} className="inline animate-spin mr-1.5" aria-hidden="true" />
          Reading every figure for these dates and the period before — this takes about a minute. You can keep looking around.
        </p>
      )}
      {status === 'skipped' && <p className="text-sm" style={{ color: '#8E1B1B' }}>Not written: {doc.why}.</p>}
      {status === 'failed' && <p className="text-sm" style={{ color: '#8E1B1B' }}>The reading could not be written: {doc.why}.</p>}
      {r && doc.limit_reached && <p className="text-xs" style={{ color: '#8E1B1B' }}>Showing the last reading: {doc.why}.</p>}

      {r && (
        <>
          <p className="text-base font-semibold leading-snug" style={{ color: INK }}>{r.headline}</p>
          <div className="space-y-2.5">
            {paras(r.overview).map((t, i) => <p key={i} className="text-sm leading-relaxed" style={{ color: INK }}>{t}</p>)}
          </div>
          <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#FBF7F1' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#8B6914' }}>What&apos;s likely next</p>
            {paras(r.outlook).map((t, i) => <p key={i} className="text-sm leading-relaxed" style={{ color: INK }}>{t}</p>)}
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <Points title="Where to focus to grow" icon={TrendingUp} color="#1B5E20" items={r.focus} />
            <Points title="Where we're losing out" icon={AlertTriangle} color="#8E1B1B" items={r.lacking} />
          </div>
          {r.caveats && <p className="text-xs italic" style={{ color: MUTED }}>{r.caveats}</p>}
        </>
      )}

      <div className="text-xs flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t" style={{ color: MUTED, borderColor: '#f0ebe6' }}>
        {doc?.written_at && <span className="pt-2">Written {written(doc.written_at)}{doc.cost_usd != null ? ` · cost about $${Number(doc.cost_usd).toFixed(2)}` : ''}</span>}
        <span className="pt-2"><Limit ai={doc?.ai_this_month} onSaved={ai => setDoc(d => ({ ...(d || {}), ai_this_month: ai }))} /></span>
      </div>
    </div>
  );
}

export function SectionReading({ analysis, section }) {
  const s = analysis.doc?.reading?.sections?.[section];
  if (!s) return null;
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#FBF7F1', border: '1px solid #EFE6D8' }} data-testid={`section-reading-${section}`}>
      <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#8B6914' }}><Sparkles size={12} aria-hidden="true" /> Reading this tab</p>
      <p className="text-sm font-semibold" style={{ color: INK }}>{s.headline}</p>
      {paras(s.reading).map((t, i) => <p key={i} className="text-sm leading-relaxed" style={{ color: INK }}>{t}</p>)}
      {s.do_next?.length > 0 && (
        <ul className="space-y-1 pt-1">
          {s.do_next.map((d, i) => <li key={i} className="text-sm flex gap-1.5" style={{ color: INK }}><ArrowRight size={14} className="shrink-0 mt-0.5" style={{ color: P }} aria-hidden="true" />{d}</li>)}
        </ul>
      )}
    </div>
  );
}
