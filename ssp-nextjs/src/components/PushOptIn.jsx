'use client';
import { useState, useEffect } from 'react';
import api from '@/api';

/**
 * Web-push opt-in for people who installed the app.
 * Shows a slim brand strip on /order only when:
 *   - running as an installed PWA (standalone / iOS standalone), and
 *   - the browser supports push, and
 *   - permission hasn't been decided yet.
 * If permission is already granted, it silently re-syncs the subscription with
 * the backend (endpoints rotate; upsert keeps the store fresh).
 */

const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

async function subscribeAndSave() {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { data } = await api.get('/push/public-key');
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.public_key),
    });
  }
  const json = sub.toJSON();
  await api.post('/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
}

export default function PushOptIn() {
  const [state, setState] = useState('hidden'); // hidden | ask | busy | done

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    if (!isInstalled()) return;
    if (Notification.permission === 'granted') {
      subscribeAndSave().catch(() => {}); // keep the stored endpoint fresh
      return;
    }
    if (Notification.permission === 'default') setState('ask');
  }, []);

  if (state === 'hidden') return null;

  const enable = async () => {
    setState('busy');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setState('hidden'); return; }
      await subscribeAndSave();
      setState('done');
      setTimeout(() => setState('hidden'), 3500);
    } catch {
      setState('hidden');
    }
  };

  if (state === 'done') {
    return (
      <div className="rounded-xl px-4 py-3 text-[13px] font-bold"
        style={{ backgroundColor: '#E8F5E9', color: '#2E6B4F', border: '1px solid #A5D6A7' }}>
        ✓ You're on the list — offers and restock alerts will find you first.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
      style={{ backgroundColor: '#FBF3DC', border: '1px solid #EBD9A8' }}>
      <div className="text-[12px] leading-snug" style={{ color: '#5C4B47' }}>
        <span className="font-black" style={{ color: '#800020' }}>🔔 Never miss a dish.</span>{' '}
        Offers, restock alerts &amp; order updates — straight to this device.
      </div>
      <button onClick={enable} disabled={state === 'busy'}
        className="shrink-0 px-3.5 py-2 rounded-lg text-[12px] font-black text-white disabled:opacity-60"
        style={{ backgroundColor: '#800020' }}>
        {state === 'busy' ? '…' : 'Turn on'}
      </button>
    </div>
  );
}
