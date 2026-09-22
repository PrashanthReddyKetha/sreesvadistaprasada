'use client';
import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useKitchen } from '@/context/KitchenContext';
import { subscribeAndSave } from '@/components/PushOptIn';

const LS_KEY = 'ssp_reopen_notify';

/**
 * "Notify me when we reopen" — shown only while the kitchen is closed.
 * Registers the email for the reopen broadcast; also (best-effort) enables
 * web push so installed-app users get the instant ping.
 */
export default function KitchenClosedNotify({ compact = false }) {
  const kitchen = useKitchen();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
  });

  if (kitchen.open) return null;

  const submit = async (addr) => {
    const e = (addr || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return;
    setBusy(true);
    try {
      await api.post('/kitchen-status/notify-me', { email: e, name: user?.name || '' });
      try {
        if ('PushManager' in window && Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') await subscribeAndSave();
        }
      } catch { /* push is a bonus — email is the guarantee */ }
      try { localStorage.setItem(LS_KEY, '1'); } catch {}
      setDone(true); setOpen(false);
    } catch { /* keep form open for retry */ }
    finally { setBusy(false); }
  };

  if (done) {
    return (
      <span className={compact ? 'text-[11px] font-semibold' : 'text-xs font-semibold'} style={{ color: '#F4C430' }}>
        ✓ We'll let you know when we reopen
      </span>
    );
  }

  // Logged in: one click, no form
  if (user?.email) {
    return (
      <button onClick={() => submit(user.email)} disabled={busy}
        className="inline-flex items-center gap-1 underline font-bold whitespace-nowrap disabled:opacity-60"
        style={{ color: '#F4C430' }}>
        <Bell size={11} /> {busy ? 'Saving…' : 'Notify me when you reopen'}
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 underline font-bold whitespace-nowrap"
        style={{ color: '#F4C430' }}>
        <Bell size={11} /> Notify me when you reopen
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={() => setOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); submit(email); }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative">
            <button type="button" onClick={() => setOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" aria-label="Close"><X size={18} /></button>
            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>We'll ping you when we reopen</h3>
            <p className="text-sm text-gray-600 mb-4">One email the moment the kitchen is back on — nothing else.</p>
            <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border text-sm mb-3 focus:outline-none focus:ring-2"
              style={{ borderColor: 'rgba(128,0,32,0.2)' }} />
            <button type="submit" disabled={busy}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: '#800020' }}>
              {busy ? 'Saving…' : 'Notify me'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
