'use client';
import { useState, useEffect } from 'react';

/**
 * Tasteful add-to-home-screen nudge.
 * - Android/Chrome: triggers the browser's own install prompt (captured in SWRegister)
 * - iOS Safari: shows the Share → Add to Home Screen steps
 * - Hidden entirely when already installed, or when the browser can't install
 *
 * variant="card"  — brand-voice card (order confirmation)
 * variant="footer" — one-line button
 */
export default function AddToHomeScreen({ variant = 'card' }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [showIOSteps, setShowIOSteps] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches
      || window.navigator.standalone === true;
    if (standalone) return; // already installed
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);
    const update = () => setCanPrompt(!!window.__sspDeferredInstall);
    update();
    window.addEventListener('ssp:caninstall', update);
    setHidden(!(ios || window.__sspDeferredInstall));
    const t = setTimeout(() => setHidden(!(ios || window.__sspDeferredInstall)), 1500);
    return () => { window.removeEventListener('ssp:caninstall', update); clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (canPrompt || isIOS) setHidden(false);
  }, [canPrompt, isIOS]);

  const install = async () => {
    const e = window.__sspDeferredInstall;
    if (!e) { if (isIOS) setShowIOSteps(s => !s); return; }
    e.prompt();
    const { outcome } = await e.userChoice.catch(() => ({ outcome: 'dismissed' }));
    if (outcome === 'accepted') setHidden(true);
    window.__sspDeferredInstall = null;
    setCanPrompt(false);
  };

  if (hidden) return null;

  if (variant === 'footer') {
    return (
      <button onClick={install}
        className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2"
        style={{ color: '#F4C430' }}>
        📲 Add Svadista to your home screen
      </button>
    );
  }

  return (
    <div className="rounded-xl px-4 py-3.5 text-left mb-6"
      style={{ backgroundColor: 'rgba(244,196,48,0.12)', border: '1px solid rgba(244,196,48,0.5)' }}>
      <p className="text-sm font-bold mb-1" style={{ color: '#800020' }}>
        🪷 Keep Amma&apos;s kitchen one tap away
      </p>
      <p className="text-xs leading-relaxed mb-2.5" style={{ color: '#5C4B47' }}>
        Add Svadista to your home screen — next time, your dosa is just one tap and ~40 minutes away.
      </p>
      {isIOS && !canPrompt ? (
        showIOSteps ? (
          <p className="text-xs font-semibold" style={{ color: '#800020' }}>
            Tap the <span aria-label="share">Share</span> button ↑ in Safari, then choose
            {' '}<b>&ldquo;Add to Home Screen&rdquo;</b>. That&apos;s it — see you at the table. 🙏
          </p>
        ) : (
          <button onClick={() => setShowIOSteps(true)}
            className="px-4 py-2 rounded-lg text-xs font-black text-white"
            style={{ backgroundColor: '#800020' }}>
            Show me how
          </button>
        )
      ) : (
        <button onClick={install}
          className="px-4 py-2 rounded-lg text-xs font-black text-white"
          style={{ backgroundColor: '#800020' }}>
          Add to home screen
        </button>
      )}
    </div>
  );
}
