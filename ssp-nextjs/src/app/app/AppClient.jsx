'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { installTarget } from '@/lib/installTarget';

/**
 * /app — the promotable install landing page.
 * One job: get the SSP app onto the phone in front of it.
 *  - Android/Chrome/Edge: fires the browser's real install prompt
 *  - iPhone/iPad (Safari): shows the two-step Add to Home Screen guide
 *  - Already installed: says so and points at /order
 * Share this URL (or its QR) on social, flyers, packaging and receipts.
 */

const FEATURES = [
  { icon: '⚡', title: 'Order in a few taps', sub: 'The full menu, made for your thumb — from craving to confirmed in under a minute.' },
  { icon: '🕐', title: 'Pick your collection slot', sub: 'Choose a 15-minute window and your food is packed fresh when you walk in.' },
  { icon: '💰', title: 'Save 10% on collection', sub: 'Every collection order, automatically — no codes.' },
  { icon: '🔔', title: 'Never miss a dish', sub: 'Restock alerts and offers land on your phone first.' },
];

export default function AppClient() {
  const [state, setState] = useState('loading'); // loading | installed | prompt | ios | mac-safari | inapp | fallback
  const [device, setDevice] = useState('iPhone');
  const [iosSteps, setIosSteps] = useState(false);

  useEffect(() => {
    const settle = () => {
      const t = installTarget();
      if (t.kind === 'ios') setDevice(t.device);
      return t.kind;
    };
    const first = settle();
    if (first !== 'other') { setState(first); if (first !== 'ios') return; }
    // Chrome and Edge hand us their install prompt a moment after load; wait for it before deciding
    const update = () => { if (window.__sspDeferredInstall) setState('prompt'); };
    window.addEventListener('ssp:caninstall', update);
    const timer = setTimeout(() => setState(s => (s === 'loading' ? 'fallback' : s)), 2500);
    return () => { window.removeEventListener('ssp:caninstall', update); clearTimeout(timer); };
  }, []);

  const install = async () => {
    const e = window.__sspDeferredInstall;
    if (!e) return;
    e.prompt();
    const { outcome } = await e.userChoice.catch(() => ({ outcome: 'dismissed' }));
    if (outcome === 'accepted') setState('installed');
    window.__sspDeferredInstall = null;
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] px-4 pb-14"
        style={{ background: 'linear-gradient(160deg, #800020 0%, #4A0012 100%)' }}>
        <div className="max-w-md mx-auto text-center pt-10">
          <div className="inline-block rounded-[28%] overflow-hidden shadow-2xl mb-6" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
            <Image src="/icons/icon-192.png" alt="SSP app icon" width={104} height={104} priority />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Amma&rsquo;s kitchen,<br />one tap away
          </h1>
          <p className="text-sm leading-relaxed mb-7" style={{ color: 'rgba(255,255,255,0.75)' }}>
            The SSP app — authentic Andhra food in Milton Keynes, ordered in seconds.
            Free, tiny, installs in 2 seconds. No app store needed.
          </p>

          {state === 'installed' && (
            <div className="space-y-3">
              <p className="text-sm font-bold" style={{ color: '#F4C430' }}>✓ You&rsquo;ve got the app — welcome back.</p>
              <Link href="/order" className="inline-block px-8 py-3.5 rounded-xl text-sm font-black" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                Start an Order
              </Link>
            </div>
          )}

          {state === 'prompt' && (
            <button onClick={install}
              className="px-10 py-4 rounded-xl text-base font-black shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
              📲 Install the App
            </button>
          )}

          {state === 'ios' && (
            !iosSteps ? (
              <button onClick={() => setIosSteps(true)} data-testid="install-ios"
                className="px-10 py-4 rounded-xl text-base font-black shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                📲 Install on {device}
              </button>
            ) : (
              <div className="rounded-2xl p-5 text-left text-sm space-y-2.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(244,196,48,0.4)', color: '#fff' }}>
                <p className="font-bold" style={{ color: '#F4C430' }}>Two taps in Safari:</p>
                <p>1. Tap the <b>Share</b> button <span aria-hidden>⎋</span> {device === 'iPad' ? 'at the top right, next to the address bar' : 'at the bottom of the screen'}</p>
                <p>2. Choose <b>&ldquo;Add to Home Screen&rdquo;</b> and tap <b>Add</b></p>
                <p className="text-xs pt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Using Chrome on your {device}? Open this page in Safari first — only Safari can add it on Apple devices.
                </p>
              </div>
            )
          )}

          {state === 'mac-safari' && (
            <div className="rounded-2xl p-5 text-left text-sm space-y-2.5" data-testid="install-mac"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(244,196,48,0.4)', color: '#fff' }}>
              <p className="font-bold" style={{ color: '#F4C430' }}>On your Mac, in Safari:</p>
              <p>1. Open the <b>File</b> menu</p>
              <p>2. Choose <b>&ldquo;Add to Dock&rdquo;</b> and click <b>Add</b></p>
              <p className="text-xs pt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Needs macOS Sonoma or newer. In Chrome or Edge, use the install icon at the right end of the address bar instead.</p>
            </div>
          )}

          {state === 'inapp' && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }} data-testid="install-inapp">
              You&rsquo;re inside another app&rsquo;s browser, which can&rsquo;t install apps. Tap ··· and choose
              <b> &ldquo;Open in Safari&rdquo;</b> (iPhone, iPad) or <b>&ldquo;Open in Chrome&rdquo;</b> (Android), then come back here.
            </p>
          )}

          {(state === 'loading' || state === 'fallback') && (
            <div className="space-y-3">
              {state === 'fallback' && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }} data-testid="install-fallback">
                  This browser can&rsquo;t install apps. Open this page in <b>Chrome</b> or <b>Edge</b> (Android, Windows, Mac)
                  or <b>Safari</b> (iPhone, iPad, Mac) and the install option appears here.
                </p>
              )}
              <Link href="/order" className="inline-block px-8 py-3.5 rounded-xl text-sm font-black" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                Or Just Order in the Browser
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12">
        <div className="max-w-md mx-auto space-y-3">
          {FEATURES.map(f => (
            <div key={f.title} className="flex items-start gap-4 rounded-2xl bg-white p-4"
              style={{ border: '1px solid rgba(128,0,32,0.1)', boxShadow: '0 2px 12px rgba(128,0,32,0.04)' }}>
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-sm font-bold" style={{ color: '#2D2422' }}>{f.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#5C4B47' }}>{f.sub}</p>
              </div>
            </div>
          ))}
          <p className="text-center text-xs pt-4" style={{ color: '#9CA3AF' }}>
            Works on Android, iPhone, iPad, Mac and Windows · under 1&nbsp;MB · always up to date
          </p>
        </div>
      </section>
    </main>
  );
}
