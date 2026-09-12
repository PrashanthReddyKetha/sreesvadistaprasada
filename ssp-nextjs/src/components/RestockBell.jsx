'use client';
import { useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';

/**
 * "Sold out today" bell. Signed-in: one tap subscribes to an email + SMS the
 * moment the dish is back. Guests: a tiny chooser — sign in for alerts, or
 * install the app (home-screen) to catch updates there.
 */
export default function RestockBell({ item, compact = false }) {
  const { user, openAuth } = useAuth();
  const [state, setState] = useState('idle'); // idle | busy | done | guest

  const subscribe = async () => {
    if (!user) { setState('guest'); return; }
    setState('busy');
    try {
      await api.post(`/menu/${item.id}/notify-restock`);
      setState('done');
    } catch { setState('idle'); }
  };

  const install = () => {
    const e = window.__sspDeferredInstall;
    if (e) { e.prompt(); window.__sspDeferredInstall = null; }
  };

  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: '#166534' }}>
        <CheckCircle size={12} /> We&apos;ll tell you first
      </span>
    );
  }

  if (state === 'guest') {
    return (
      <span className="inline-flex flex-col gap-1 items-end">
        <button onClick={() => openAuth('login')}
          className="px-2.5 py-1 rounded-full text-[10px] font-black text-white whitespace-nowrap"
          style={{ backgroundColor: '#800020' }}>
          Sign in for the alert
        </button>
        {typeof window !== 'undefined' && window.__sspDeferredInstall && (
          <button onClick={install}
            className="px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap"
            style={{ border: '1px solid #800020', color: '#800020' }}>
            📲 Install app · 2 secs
          </button>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#8B3A3A' }}>
        Sold out today
      </span>
      <button onClick={subscribe} disabled={state === 'busy'}
        className={`inline-flex items-center gap-1 rounded-full font-black whitespace-nowrap ${compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'}`}
        style={{ border: '1.5px solid #B8860B', color: '#8B6914', backgroundColor: 'rgba(244,196,48,0.12)' }}>
        <Bell size={11} /> {state === 'busy' ? 'Saving…' : 'Notify me'}
      </button>
    </span>
  );
}
