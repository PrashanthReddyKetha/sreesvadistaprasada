'use client';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ssp_cookie_consent';

function pushConsent(granted) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'consent_update',
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  });
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    } else {
      // Re-push stored consent so GTM picks it up on every page load
      const stored = localStorage.getItem(STORAGE_KEY);
      pushConsent(stored === 'granted');
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'granted');
    pushConsent(true);
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, 'denied');
    pushConsent(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4 py-4 md:px-8"
      style={{ backgroundColor: '#1C0A06', borderTop: '2px solid #800020' }}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1 text-sm" style={{ color: '#E8D5C4' }}>
          <p className="font-semibold mb-0.5" style={{ color: '#F4C430' }}>
            🍪 We use cookies
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#B8A090' }}>
            We use analytics cookies to understand how visitors use our site so we can improve it.
            No personal data is sold. See our{' '}
            <a href="/privacy-policy" className="underline hover:opacity-80" style={{ color: '#F4C430' }}>
              Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm font-semibold rounded-lg border transition-all hover:opacity-80"
            style={{ borderColor: 'rgba(244,196,48,0.4)', color: '#B8A090', backgroundColor: 'transparent' }}
          >
            Essential only
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-semibold rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: '#800020', color: '#FDFBF7' }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
