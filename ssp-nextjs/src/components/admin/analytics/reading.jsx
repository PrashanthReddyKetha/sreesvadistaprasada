'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '@/api';

/* A short description under every table and graph for the dates picked, worked out by the site from the figures
   (backend/analyst.py) — no AI and no cost (owner, 10 Nov 2026). */

const INK = '#2D2422';
const MUTED = '#6B5F5A';

export function useAnalysis(range) {
  const [doc, setDoc] = useState(null);
  useEffect(() => {
    let gone = false;
    api.get('/admin/analytics/analysis', { params: { start: range.start, end: range.end } })
      .then(r => { if (!gone) setDoc(r.data); })
      .catch(() => { if (!gone) setDoc({ status: 'failed' }); });
    return () => { gone = true; };
  }, [range.start, range.end]);
  return { doc };
}

const paras = (text) => String(text || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);

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

/** One line saying where the descriptions come from. */
export function ReadingStatus({ analysis }) {
  const status = analysis.doc?.status;
  return (
    <p className="text-xs flex items-center gap-1.5 px-1" style={{ color: MUTED }} data-testid="reading-status">
      <Sparkles size={12} style={{ color: '#B08A3E' }} aria-hidden="true" />
      {status === 'failed' ? 'The descriptions could not be loaded — press Refresh to try again.'
        : 'The description under each table is worked out by the site from these figures — no AI, no cost.'}
    </p>
  );
}
