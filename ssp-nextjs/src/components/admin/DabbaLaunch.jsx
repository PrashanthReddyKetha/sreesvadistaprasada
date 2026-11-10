'use client';
import { useState, useEffect } from 'react';
import { Copy, Rocket, Users } from 'lucide-react';
import api from '@/api';
import { useKitchen } from '@/context/KitchenContext';
import ConfirmAction from '@/components/admin/ConfirmAction';

/** Dabba Wala launch switch and the list of people waiting for it (owner, 10 Nov 2026).
    Off = the Dabba page says "opening soon" and takes emails; on = plans are on sale. */

const C = { burgundy: '#800020', muted: '#7A5C50', line: '#E8DFCE', green: '#2E7D32', gold: '#8B6914' };
const WHERE = { home: 'Home', work: 'Work', both: 'Home & work' };
const PICKED = { weekly: 'Weekly', monthly: 'Monthly', prasada: 'Prasada', svadista: 'Svadista' };
const fmt = (iso) => (iso ? new Date(/Z|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

export default function DabbaLaunch() {
  const kitchen = useKitchen();
  const open = kitchen.dabbaOpen;
  const [people, setPeople] = useState(null);
  const [showList, setShowList] = useState(false);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    api.get('/admin/dabba-wala/interest').then(r => setPeople(r.data)).catch(() => setPeople([]));
  }, []);

  const flip = async () => {
    setBusy(true);
    try {
      await api.put('/admin/settings/pickup-slots', { dabba_open: !open });
      await kitchen.refresh();
      setNote(open ? 'Dabba Wala is back to "opening soon".' : 'Dabba Wala plans are on sale.');
    } catch (e) {
      setNote(e.response?.data?.detail || 'Could not change it — please try again.');
    } finally { setBusy(false); setAsk(false); }
  };

  const copyEmails = async () => {
    try { await navigator.clipboard.writeText(people.map(p => p.email).join(', ')); setNote(`${people.length} email${people.length === 1 ? '' : 's'} copied.`); }
    catch { setNote('Could not copy — select them from the list instead.'); }
  };

  const counts = (people || []).reduce((acc, p) => { if (p.where) acc[p.where] = (acc[p.where] || 0) + 1; return acc; }, {});

  return (
    <div className="bg-white rounded-xl p-4 mb-6 space-y-3" style={{ border: `1px solid ${C.line}` }} data-testid="dabba-launch">
      <div className="flex items-center gap-3 flex-wrap">
        <Rocket size={18} style={{ color: open ? C.green : C.gold }} />
        <div className="flex-1 min-w-[12rem]">
          <p className="text-sm font-bold" style={{ color: '#2D2422' }}>{open ? 'Dabba Wala: on sale' : 'Dabba Wala: opening soon'}</p>
          <p className="text-xs" style={{ color: C.muted }}>
            {open ? 'Customers can buy weekly and monthly plans.' : 'The Dabba page takes emails instead of plans.'}
          </p>
        </div>
        <button onClick={() => setAsk(true)} disabled={busy || !kitchen.loaded}
          className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-60"
          style={open ? { border: `1px solid ${C.line}`, color: C.muted } : { backgroundColor: C.burgundy, color: 'white' }}>
          {open ? 'Back to opening soon' : 'Open Dabba Wala'}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: C.muted }}>
        <span className="flex items-center gap-1 font-semibold" style={{ color: '#2D2422' }}>
          <Users size={13} /> {people === null ? '…' : `${people.length} waiting to hear`}
        </span>
        {Object.entries(counts).map(([k, n]) => <span key={k}>{WHERE[k]} {n}</span>)}
        {people?.length > 0 && (
          <>
            <button onClick={() => setShowList(v => !v)} className="underline">{showList ? 'Hide list' : 'See who'}</button>
            <button onClick={copyEmails} className="flex items-center gap-1 underline"><Copy size={11} /> Copy emails</button>
          </>
        )}
      </div>

      {showList && people?.length > 0 && (
        <ul className="text-xs divide-y max-h-64 overflow-y-auto" style={{ borderColor: C.line }}>
          {people.map(p => (
            <li key={p.email} className="py-1.5 flex gap-3">
              <span className="flex-1 truncate" style={{ color: '#2D2422' }}>{p.name ? `${p.name} · ` : ''}{p.email}</span>
              <span style={{ color: C.muted }}>{[PICKED[p.plan], PICKED[p.box_type]].filter(Boolean).join(' · ')}</span>
              <span style={{ color: C.muted }}>{WHERE[p.where] || ''}</span>
              <span style={{ color: C.muted }}>{fmt(p.created_at)}</span>
            </li>
          ))}
        </ul>
      )}

      {note && <p className="text-xs font-semibold" style={{ color: C.burgundy }} role="status">{note}</p>}

      {ask && (
        <ConfirmAction title={open ? 'Put Dabba Wala back to "opening soon"?' : 'Open Dabba Wala for sign-ups?'} busy={busy}
          confirmLabel={open ? 'Yes, opening soon' : 'Yes, open Dabba Wala'} onCancel={() => setAsk(false)} onConfirm={flip}
          rows={open
            ? [['After', 'The Dabba page takes emails again; nobody can buy a new plan.'], ['Who', 'Plans already bought carry on as normal.'], ['Undo', 'Open it again at any time.']]
            : [['After', 'The Dabba page shows plans and prices; customers can pay for a plan straight away.'],
               ['Waiting', `${people?.length || 0} people asked to hear. Nobody is emailed automatically — use Copy emails or Comms to tell them.`],
               ['Undo', 'Put it back to opening soon at any time.']]} />
      )}
    </div>
  );
}
