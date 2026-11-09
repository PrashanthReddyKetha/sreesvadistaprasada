'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BellRing, Bell, BellOff } from 'lucide-react';
import api from '@/api';
import { urlBase64ToUint8Array } from '@/components/PushOptIn';

/** The new-order alarm, on every admin screen (owner request, 9 Nov 2026).

    While an order waits to be accepted: a red bar with the count, the alarm sound on a loop (until accepted or
    silenced), and the tab title flashing so it shows from another tab. "Switch on" makes this device one of the
    owner's alert devices: the server pushes every new order to it, then again each minute until it is accepted,
    even with the browser closed. On that device the screen is also kept awake while Admin is open (a kitchen tablet). */

const C = { burgundy: '#800020', red: '#B91C1C', muted: '#5C4B47', line: '#E8DFCE', green: '#2E6B4F' };
const DEVICE_KEY = 'ssp_owner_alerts';      // this device's push address, once alerts are on here
const POLL_MS = 15000;

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch {} };
// Order times come back as UTC without a zone
const utc = (iso) => new Date(/Z|[+-]\d\d:?\d\d$/.test(iso || '') ? iso : `${iso}Z`).getTime();

const deviceLabel = () => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone/.test(ua)) return 'iPhone or iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  return 'Computer';
};

export default function OrderAlarm({ showSettings = false, onOpenKitchen }) {
  const [waiting, setWaiting] = useState([]);
  const [checkedAt, setCheckedAt] = useState(0);
  const [silenced, setSilenced] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [device, setDevice] = useState(() => read(DEVICE_KEY));
  const [hideSetup, setHideSetup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const audio = useRef(null);

  const poll = useCallback(() => api.get('/orders', { params: { status: 'pending', limit: 50 } })
    .then(r => { setWaiting(r.data.map(o => ({ id: o.id, n: o.order_number, at: utc(o.created_at) }))); setCheckedAt(Date.now()); })
    .catch(() => {}), []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_MS);
    window.addEventListener('focus', poll);
    window.addEventListener('ssp:orders-changed', poll);     // accepted on the Kitchen or Orders screen: stop at once
    return () => { clearInterval(t); window.removeEventListener('focus', poll); window.removeEventListener('ssp:orders-changed', poll); };
  }, [poll]);

  // Browsers only play sound after a tap on the page: the first tap anywhere arms the alarm
  useEffect(() => {
    const a = new Audio('/sounds/new-order.wav');
    a.loop = true;
    audio.current = a;
    const arm = () => {
      a.muted = true;
      a.play().then(() => {
        a.pause(); a.currentTime = 0; a.muted = false;
        setUnlocked(true);
        document.removeEventListener('pointerdown', arm);
      }).catch(() => { a.muted = false; });
    };
    document.addEventListener('pointerdown', arm);
    return () => { document.removeEventListener('pointerdown', arm); a.pause(); };
  }, []);

  const ringing = waiting.some(o => !silenced.includes(o.id));
  const count = waiting.length;

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (ringing && unlocked) a.play().catch(() => {});
    else { a.pause(); a.currentTime = 0; }
  }, [ringing, unlocked]);

  useEffect(() => {
    if (!ringing) return undefined;
    const base = document.title;
    let on = false;
    const t = setInterval(() => { on = !on; document.title = on ? `🔔 (${count}) New order` : base; }, 1000);
    return () => { clearInterval(t); document.title = base; };
  }, [ringing, count]);

  // Another tab on a device without phone alerts: a system notification each minute instead
  useEffect(() => {
    if (!ringing || device || typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return undefined;
    const show = () => {
      if (!document.hidden) return;
      navigator.serviceWorker.ready.then(reg => reg.showNotification(`🔔 ${count} new order${count > 1 ? 's' : ''} waiting`, {
        body: 'Tap to open the Kitchen screen and accept', tag: 'admin-waiting', renotify: true, requireInteraction: true,
        icon: '/icons/icon-192.png', data: { url: '/admin?tab=kitchen' },
      })).catch(() => {});
    };
    show();
    const t = setInterval(show, 60000);
    return () => clearInterval(t);
  }, [ringing, device, count]);

  // A kitchen tablet with alerts on stays awake while Admin is open
  useEffect(() => {
    if (!device || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    const hold = () => { if (!document.hidden) navigator.wakeLock.request('screen').then(l => { lock = l; }).catch(() => {}); };
    hold();
    document.addEventListener('visibilitychange', hold);
    return () => { document.removeEventListener('visibilitychange', hold); lock?.release().catch(() => {}); };
  }, [device]);

  const switchOn = async () => {
    setBusy(true); setMsg('');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
        setMsg(/iPad|iPhone/.test(navigator.userAgent)
          ? 'On iPhone: tap Share › Add to Home Screen, open the site from that icon, sign in, then switch on here.'
          : 'This browser cannot show notifications. The alarm still rings while this page is open.');
        return;
      }
      if (await Notification.requestPermission() !== 'granted') {
        setMsg('Notifications are blocked for this site. Allow them in the browser’s site settings, then try again.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { data } = await api.get('/push/public-key');
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(data.public_key) });
      }
      const json = sub.toJSON();
      await api.post('/admin/push/owner-device', { endpoint: json.endpoint, keys: json.keys, label: deviceLabel() });
      write(DEVICE_KEY, json.endpoint);
      setDevice(json.endpoint);
      await api.post('/admin/push/owner-test');
      setMsg('Alerts are on for this device — a test alert is on its way.');
    } catch (e) {
      setMsg(`Could not switch on alerts — please try again.${e?.message ? ` (${e.message})` : ''}`);
    } finally { setBusy(false); }
  };

  const sendTest = async () => {
    setMsg('');
    try { const r = await api.post('/admin/push/owner-test'); setMsg(`Test sent to ${r.data.sent} device${r.data.sent === 1 ? '' : 's'}.`); }
    catch { setMsg('Could not send a test.'); }
  };

  const switchOff = async () => {
    try { await api.post('/admin/push/owner-device/remove', { endpoint: device }); } catch {}
    write(DEVICE_KEY, null);
    setDevice(null);
    setMsg('Alerts are off for this device.');
  };

  const oldestMins = count && checkedAt ? Math.max(0, Math.floor((checkedAt - Math.min(...waiting.map(o => o.at))) / 60000)) : 0;

  return (
    <div className="space-y-2 mb-4">
      {count > 0 && (
        <div role="alert" className="sticky top-2 z-40 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap text-white shadow-lg"
          style={{ backgroundColor: ringing ? C.red : C.burgundy }}>
          <BellRing size={20} className={ringing ? 'animate-pulse' : ''} />
          <div className="flex-1 min-w-[10rem]">
            <p className="font-bold text-sm">{count} new order{count > 1 ? 's' : ''} waiting to be accepted</p>
            <p className="text-xs opacity-90">
              {oldestMins ? `Oldest ${oldestMins} min ago · ` : ''}
              {ringing && !unlocked ? 'Tap anywhere on this page to let the alarm ring' : ringing ? 'Alarm ringing' : 'Silenced — rings again for the next order'}
            </p>
          </div>
          {onOpenKitchen && (
            <button onClick={onOpenKitchen} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white" style={{ color: C.red }}>Open Kitchen</button>
          )}
          {ringing && (
            <button onClick={() => setSilenced(waiting.map(o => o.id))} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/70">
              Silence
            </button>
          )}
        </div>
      )}

      {!device && !hideSetup && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap bg-white" style={{ border: `1px solid ${C.line}` }}>
          <Bell size={18} style={{ color: C.burgundy }} />
          <p className="flex-1 min-w-[12rem] text-xs" style={{ color: C.muted }}>
            <b style={{ color: '#2D2422' }}>Get new-order alerts on this device</b> — a notification for every order, repeated each minute
            until you accept it, even when the browser is closed.
          </p>
          <button onClick={switchOn} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: C.burgundy }}>
            {busy ? 'Switching on…' : 'Switch on'}
          </button>
          <button onClick={() => setHideSetup(true)} className="text-xs underline" style={{ color: C.muted }}>Not now</button>
        </div>
      )}

      {device && showSettings && (
        <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: C.green }}>
          <span className="flex items-center gap-1 font-bold"><Bell size={13} /> Order alerts on for this device</span>
          <button onClick={sendTest} className="underline" style={{ color: C.muted }}>Send a test</button>
          <button onClick={switchOff} className="flex items-center gap-1 underline" style={{ color: C.muted }}><BellOff size={12} /> Turn off</button>
        </div>
      )}

      {msg && <p className="text-xs font-semibold" style={{ color: C.muted }}>{msg}</p>}
    </div>
  );
}
