'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, Check } from 'lucide-react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { trackNotifyMeSignup } from '@/lib/analytics';

/** Dabba Wala "opening soon": takes an email (and home or work) for the launch, and points to today's menu
    meanwhile. Shown in place of the plan picker while the admin switch is off (owner, 10 Nov 2026). */

const C = { primary: '#800020', gold: '#F4C430', darkGold: '#8B6914', dark: '#2D2422', muted: '#7A5C50', line: '#e0d9d0', surface: '#F9F6EE' };
const LS_KEY = 'ssp_dabba_notify';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHERE = [
  { id: 'home', label: 'At home' },
  { id: 'work', label: 'At work' },
  { id: 'both', label: 'A bit of both' },
];

export default function DabbaNotify() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [where, setWhere] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(() => { try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; } });

  const submit = async (e) => {
    e.preventDefault();
    const addr = (email || user?.email || '').trim();
    if (!EMAIL_RE.test(addr)) { setErr('Pop in your email so we can tell you.'); return; }
    setBusy(true); setErr('');
    try {
      await api.post('/subscriptions/notify-me', { email: addr, name: name.trim() || user?.name || undefined, where: where || undefined });
      trackNotifyMeSignup('Dabba Wala', 'dabba');
      const first = (name.trim() || user?.name || '').split(' ')[0];
      try { localStorage.setItem(LS_KEY, first || 'yes'); } catch {}
      setDone(first || 'yes');
    } catch (e2) {
      setErr(e2.response?.status === 429 ? 'Lots of tries from here — please wait a little and try again.' : 'That didn’t go through — please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div id="notify" className="rounded-2xl bg-white p-6 sm:p-8" style={{ border: `0.5px solid ${C.line}`, boxShadow: '0 10px 28px rgba(45,36,34,0.08)', scrollMarginTop: 120 }}
      data-testid="dabba-coming-soon">
      <p className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: C.darkGold }}>Opening soon</p>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>
        Your dabba is almost ready
      </h2>

      {done ? (
        <div className="rounded-xl px-5 py-4 mb-6 flex gap-3" style={{ backgroundColor: C.surface }} role="status">
          <Check size={18} className="shrink-0 mt-0.5" style={{ color: C.primary }} />
          <p className="text-sm leading-relaxed" style={{ color: C.dark }}>
            <b>Thank you{done !== 'yes' ? `, ${done}` : ''}! 🙏</b> You&apos;re on our list — you&apos;ll be among the very first to hear
            when the dabbas start going out.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed mb-5" style={{ color: C.muted }}>
            How lovely that you came looking for a Dabba Wala. We&apos;re putting the finishing touches to our round — a hot South Indian
            lunch, cooked that morning and brought to your home or your workplace, Monday to Friday. Leave your email and you&apos;ll be
            the first to know when we open.
          </p>
          <form onSubmit={submit} noValidate className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your first name" aria-label="Your first name" autoComplete="given-name"
                maxLength={80} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ border: `1px solid ${C.line}` }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={user?.email || 'your@email.com'} aria-label="Your email"
                autoComplete="email" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ border: `1px solid ${C.line}` }} />
            </div>
            <fieldset>
              <legend className="text-xs font-semibold mb-2" style={{ color: C.dark }}>Where would you enjoy it?</legend>
              <div className="flex flex-wrap gap-2">
                {WHERE.map(w => (
                  <button key={w.id} type="button" onClick={() => setWhere(where === w.id ? null : w.id)} aria-pressed={where === w.id}
                    className="px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                    style={where === w.id ? { backgroundColor: C.primary, color: 'white' } : { border: `1px solid ${C.line}`, color: C.dark }}>
                    {w.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="submit" disabled={busy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: C.gold, color: C.dark }}>
              <Bell size={15} /> {busy ? 'Saving…' : 'Tell me when it opens'}
            </button>
            {err && <p role="alert" className="text-sm font-semibold" style={{ color: C.primary }}>{err}</p>}
            <p className="text-xs" style={{ color: C.muted }}>Just one email when we open — nothing else, unless you ask.</p>
          </form>
        </>
      )}

      <div className="mt-6 pt-5" style={{ borderTop: `0.5px solid ${C.line}` }}>
        <p className="text-sm" style={{ color: C.muted }}>
          Can&apos;t wait till then? The same kitchen is cooking our full menu today.{' '}
          <Link href="/order" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2" style={{ color: C.primary }}>
            Try our menu <ArrowRight size={13} />
          </Link>
        </p>
      </div>
    </div>
  );
}
