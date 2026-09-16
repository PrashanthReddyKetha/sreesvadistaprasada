'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
  const [state, setState] = useState('loading'); // loading | installed | android | ios | fallback
  const [iosSteps, setIosSteps] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches
      || window.navigator.standalone === true;
    if (standalone) { setState('installed'); return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    if (ios) { setState('ios'); return; }
    const update = () => { if (window.__sspDeferredInstall) setState('android'); };
    update();
    window.addEventListener('ssp:caninstall', update);
    // If the prompt never becomes available (in-app browsers, Firefox), show guidance
    const t = setTimeout(() => setState(s => (s === 'loading' ? 'fallback' : s)), 2500);
    return () => { window.removeEventListener('ssp:caninstall', update); clearTimeout(t); };
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

          {state === 'android' && (
            <button onClick={install}
              className="px-10 py-4 rounded-xl text-base font-black shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
              📲 Install the App
            </button>
          )}

          {state === 'ios' && (
            !iosSteps ? (
              <button onClick={() => setIosSteps(true)}
                className="px-10 py-4 rounded-xl text-base font-black shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                📲 Install on iPhone
              </button>
            ) : (
              <div className="rounded-2xl p-5 text-left text-sm space-y-2.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(244,196,48,0.4)', color: '#fff' }}>
                <p className="font-bold" style={{ color: '#F4C430' }}>Two taps in Safari:</p>
                <p>1. Tap the <b>Share</b> button <span aria-hidden>⎋</span> at the bottom of the screen</p>
                <p>2. Choose <b>&ldquo;Add to Home Screen&rdquo;</b> and tap <b>Add</b></p>
                <p className="text-xs pt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Opened this from Instagram or WhatsApp? Tap ··· and choose &ldquo;Open in Safari&rdquo; first.
                </p>
              </div>
            )
          )}

          {(state === 'loading' || state === 'fallback') && (
            <div className="space-y-3">
              {state === 'fallback' && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Open this page in <b>Chrome</b> (Android) or <b>Safari</b> (iPhone) to install —
                  in-app browsers can&rsquo;t install apps.
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
            Works on Android, iPhone and desktop · under 1&nbsp;MB · always up to date
          </p>
        </div>
      </section>
    </main>
  );
}
