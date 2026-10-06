'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '@/api';

/* Admin › Overview › Is everything working? One line per thing the business depends on: green, amber or red,
   what it means, and what to do. Checked when the screen opens and every two minutes. */
const STATE = {
  ok:    { dot: '#2E7D32', label: 'Working' },
  watch: { dot: '#D97706', label: 'Needs a look' },
  down:  { dot: '#B91C1C', label: 'Not working' },
};
const when = (iso) => new Date(iso + (/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? '' : 'Z')).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });

export default function HealthPanel() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const load = useCallback(() => { api.get('/admin/health').then(r => { setData(r.data); setFailed(false); }).catch(() => setFailed(true)); }, []);
  useEffect(() => { load(); const id = setInterval(load, 120000); return () => clearInterval(id); }, [load]);

  const overall = failed ? 'down' : data?.overall;
  const s = STATE[overall] || { dot: '#9CA3AF', label: 'Checking…' };
  const problems = (data?.checks || []).filter(c => c.state !== 'ok');
  return (
    <div className="bg-white rounded-xl" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex flex-wrap items-center gap-3 text-left">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
        <span className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
          {failed ? 'The server is not answering' : !data ? 'Checking that everything works…' : overall === 'ok' ? 'Everything is working' : `${problems.length} thing${problems.length === 1 ? '' : 's'} need${problems.length === 1 ? 's' : ''} a look`}
        </span>
        {data && !open && problems.length > 0 && <span className="text-sm text-gray-500">{problems.map(p => p.name).join(' · ')}</span>}
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-2">{data && `checked ${when(data.checked_at)}`}
          <RefreshCw size={13} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); load(); }} />
          <span>{open ? '▲' : '▼'}</span></span>
      </button>
      {open && data && (
        <div className="border-t px-5 py-3 grid md:grid-cols-2 gap-x-6" style={{ borderColor: '#f0ebe6' }}>
          {data.checks.map(c => (
            <div key={c.name} className="flex gap-3 py-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: STATE[c.state].dot }} />
              <div><p><b>{c.name}</b> <span className="text-gray-400">· {STATE[c.state].label}</span></p>
                <p className="text-gray-600">{c.note}</p>
                {c.fix && <p className="text-xs mt-0.5" style={{ color: '#8D6E00' }}>What to do: {c.fix}</p>}</div>
            </div>
          ))}
        </div>
      )}
      {open && failed && <p className="border-t px-5 py-3 text-sm" style={{ borderColor: '#f0ebe6', color: '#B91C1C' }}>The server did not answer. If this lasts more than a minute, customers cannot order either — check the hosting status page.</p>}
    </div>
  );
}
