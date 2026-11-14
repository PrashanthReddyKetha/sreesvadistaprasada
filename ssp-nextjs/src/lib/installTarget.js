/** Which install path this browser has. iPad Safari calls itself a Mac ("Macintosh" with a touch screen), so a plain
    iPhone/iPad check misses it and the page used to call it an in-app browser (owner, 14 Nov 2026).
      installed  — already running as the app
      inapp      — Instagram / Facebook / WhatsApp / Gmail web view: cannot install, open in the real browser
      ios        — iPhone or iPad Safari: Share → Add to Home Screen (the Share button sits at the top on an iPad)
      mac-safari — Safari on a Mac: File → Add to Dock
      prompt     — the browser gave us its own install prompt (Chrome / Edge on Android, Windows, Mac, ChromeOS)
      other      — no install path known (Firefox, older browsers) */
export function installTarget() {
  if (typeof window === 'undefined') return { kind: 'other' };
  const ua = navigator.userAgent || '';
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
  if (standalone) return { kind: 'installed' };
  const inApp = /\b(Instagram|FBAN|FBAV|FB_IAB|Line\/|WhatsApp|GSA\/|Snapchat|Twitter|LinkedInApp|; wv\))/i.test(ua);
  const iPhone = /iphone|ipod/i.test(ua);
  const iPad = /ipad/i.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  const macSafari = /Macintosh/.test(ua) && !iPad && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\/|OPR\/|Firefox/.test(ua);
  if (inApp) return { kind: 'inapp', apple: iPhone || iPad };
  if (window.__sspDeferredInstall) return { kind: 'prompt' };
  if (iPhone || iPad) return { kind: 'ios', device: iPad ? 'iPad' : 'iPhone' };
  if (macSafari) return { kind: 'mac-safari' };
  return { kind: 'other' };
}
