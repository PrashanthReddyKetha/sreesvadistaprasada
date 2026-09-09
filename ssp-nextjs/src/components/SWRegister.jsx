'use client';
import { useEffect } from 'react';

/** Registers the service worker (production only) so the site is installable. */
export default function SWRegister() {
  useEffect(() => {
    // Capture the browser's install prompt so AddToHomeScreen can trigger it
    // from our own buttons (must listen early — the event fires on page load)
    const onBIP = (e) => {
      e.preventDefault();
      window.__sspDeferredInstall = e;
      window.dispatchEvent(new Event('ssp:caninstall'));
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);
  return null;
}
