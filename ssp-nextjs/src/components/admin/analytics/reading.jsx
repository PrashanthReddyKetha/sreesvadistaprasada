'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import api from '@/api';
import { P } from './parts';

/* A short description under every table and graph, written by Claude Opus for the dates picked (owner, 10 Nov 2026).
   One call writes them all; it is saved per date range, so changing tabs, pressing Refresh or coming back is free. */

const INK = '#2D2422';
const MUTED = '#6B5F5A';
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

export const NotesContext = createContext(null);

/** The description under one table or graph. */
export function Note({ k, inset = false, card = false }) {
  const analysis = useContext(NotesContext);
  const doc = analysis?.doc;
  const text = doc?.reading?.notes?.[k];
  if (!text) {
    if (doc?.status !== 'working' && doc?.status !== 'none' && doc) return null;
    const wait = <p className={`px-4 pb-3 pt-2 text-xs italic ${inset ? '-mx-4 -mb-4 mt-2' : ''}`} style={{ color: '#A39A95' }}>Writing a description…</p>;
    return card ? <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>{wait}</div> : wait;
  }
  const body = (
    <div className={`px-4 pb-3 pt-2.5 flex gap-2 ${card ? 'pt-3' : 'border-t'} ${inset ? '-mx-4 -mb-4 mt-3 rounded-b-xl' : ''}`} style={{ borderColor: '#f3eee8', backgroundColor: '#FDFBF7' }} data-testid={`note-${k}`}>
      <Sparkles size={13} className="shrink-0 mt-0.5" style={{ color: '#B08A3E' }} aria-hidden="true" />
      <div className="space-y-1.5">{paras(text).map((t, i) => <p key={i} className="text-sm leading-relaxed" style={{ color: INK }}>{t}</p>)}</div>
    </div>
  );
  return card ? <div className="rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>{body}</div> : body;
}

/** One line saying where the descriptions come from, what they cost, and the monthly limit. */
export function ReadingStatus({ analysis }) {
  const { doc, busy, write, setDoc } = analysis;
  const status = doc?.status;
  return (
    <div className="text-xs flex flex-wrap items-center gap-x-3 gap-y-1 px-1" style={{ color: MUTED }} data-testid="reading-status">
      <Sparkles size={12} style={{ color: '#B08A3E' }} aria-hidden="true" />
      {(!doc || status === 'working' || status === 'none') && <span>Claude is writing the descriptions for these dates — about a minute.</span>}
      {status === 'ready' && <span>Descriptions written by Claude {doc.written_at ? written(doc.written_at) : ''}{doc.cost_usd != null ? ` · about $${Number(doc.cost_usd).toFixed(2)}` : ''}. Opening them again is free.</span>}
      {status === 'ready' && doc.limit_reached && <span style={{ color: '#8E1B1B' }}>Not refreshed: {doc.why}.</span>}
      {(status === 'failed' || status === 'skipped') && <span style={{ color: '#8E1B1B' }}>No descriptions: {doc.why}.</span>}
      {(status === 'ready' || status === 'failed' || status === 'skipped') && (
        <button onClick={() => write(true)} disabled={busy} className="font-semibold inline-flex items-center gap-1 disabled:opacity-50" style={{ color: P }}>
          <RefreshCw size={11} className={busy ? 'animate-spin' : ''} /> {status === 'ready' ? 'Write again' : 'Try again'}
        </button>
      )}
      <Limit ai={doc?.ai_this_month} onSaved={ai => setDoc(d => ({ ...(d || {}), ai_this_month: ai }))} />
    </div>
  );
}
