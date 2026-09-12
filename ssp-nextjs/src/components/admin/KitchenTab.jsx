'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Bell, BellOff } from 'lucide-react';
import api from '@/api';

/**
 * Kitchen board — the live ticket view for whoever is cooking.
 * Own 12s poll (independent of the admin page's 30s fetchAll), optimistic
 * status updates, new-order chime, escalating alert for unaccepted tickets.
 */

const C = {
  burgundy: '#800020', saffron: '#F4C430', gold: '#B8860B', green: '#2E6B4F',
  ink: '#2D2422', muted: '#5C4B47', line: '#E8DFCE', red: '#C62828',
};

const LANES = [
  { id: 'new',   label: 'NEW',       statuses: ['pending', 'confirmed'], color: '#5C0017' },
  { id: 'prep',  label: 'PREPARING', statuses: ['preparing'],            color: C.saffron },
  { id: 'ready', label: 'READY',     statuses: ['ready', 'out_for_delivery'], color: C.green },
];

const ALLERGY_WORDS = /allerg|nut|gluten|dairy|lactose|shellfish|celiac|coeliac|intoleran/i;

const dispNo = (o) => o.order_number || o.id?.slice(0, 8).toUpperCase();
const slotLabel = (iso) => {
  if (!iso || iso.length < 16) return null;
  const hh = parseInt(iso.slice(11, 13), 10);
  return `${hh % 12 || 12}:${iso.slice(14, 16)} ${hh < 12 ? 'am' : 'pm'}`;
};
const minsSince = (iso, now) => Math.max(0, Math.floor((now - new Date(iso)) / 60000));

// Advance button per ticket, branched by delivery type
function nextAction(o) {
  const takeaway = o.delivery_type === 'takeaway';
  switch (o.status) {
    case 'pending':   return { status: 'confirmed', label: 'Accept order', color: C.burgundy };
    case 'confirmed': return { status: 'preparing', label: 'Start preparing', color: C.burgundy };
    case 'preparing': return takeaway
      ? { status: 'ready', label: 'Mark ready', color: C.green }
      : { status: 'out_for_delivery', label: 'Out for delivery', color: C.burgundy };
    case 'ready': return takeaway
      ? { status: 'delivered', label: 'Collected ✓', color: C.green }
      : { status: 'out_for_delivery', label: 'Out for delivery', color: C.burgundy };
    case 'out_for_delivery': return { status: 'delivered', label: 'Delivered ✓', color: C.green };
    default: return null;
  }
}

function Ticket({ order, now, onAdvance, onCancel, onEightySix, busy }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const takeaway = order.delivery_type === 'takeaway';
  const slot = slotLabel(order.scheduled_slot_final);
  const mins = minsSince(order.created_at, now);
  const late = ['pending', 'confirmed', 'preparing'].includes(order.status) && mins >= 20;
  const action = nextAction(order);
  const allergyNote = order.notes && ALLERGY_WORDS.test(order.notes);
  const laneColor = order.status === 'preparing' ? C.saffron
    : ['ready', 'out_for_delivery'].includes(order.status) ? C.green : C.saffron;

  return (
    <div className="rounded-xl bg-white p-3.5 mb-3"
      style={{ border: `1px solid ${C.line}`, borderLeft: `5px solid ${laneColor}` }}>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: C.burgundy }}>
          {dispNo(order)}
        </span>
        <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: late ? C.red : C.muted }}>
          {mins}m{late ? ' ⚠️' : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1.5">
        <span className="text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full"
          style={takeaway
            ? { backgroundColor: '#FBF3DC', color: C.gold, border: '1px solid #EBD9A8' }
            : { backgroundColor: '#F0E9F5', color: '#5E4B8B', border: '1px solid #D9CCE8' }}>
          {takeaway ? (slot ? `COLLECTION ${slot}` : 'COLLECTION · ASAP') : `DELIVERY · ${order.delivery_address?.postcode || ''}`}
        </span>
        {order.customer_name && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F6F1E7', color: C.muted }}>
            {order.customer_name.split(' ')[0]}
          </span>
        )}
      </div>

      <div className="mt-2 space-y-0.5">
        {(order.items || []).map((it, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.ink }}>
            <b style={{ color: C.burgundy }} className="tabular-nums">{it.quantity} ×</b>
            <span className="flex-1 truncate">{it.name}</span>
            <button
              onClick={() => onEightySix(it)}
              title={`Mark "${it.name}" sold out on the menu`}
              className="text-[9px] font-black px-1.5 py-0.5 rounded"
              style={{ border: `1px solid ${C.line}`, color: C.muted }}>
              86
            </button>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mt-2 text-[12px] px-2.5 py-1.5 rounded-lg"
          style={allergyNote
            ? { backgroundColor: '#FDECEA', color: C.red, border: `1px solid ${C.red}`, fontWeight: 700 }
            : { backgroundColor: '#FBF3DC', color: C.muted }}>
          {allergyNote && '⚠️ '}{order.notes}
        </div>
      )}

      {action && (
        <button onClick={() => onAdvance(order, action.status)} disabled={busy}
          className="mt-2.5 w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-50"
          style={{ backgroundColor: action.color }}>
          {busy ? <RefreshCw size={14} className="animate-spin inline" /> : action.label}
        </button>
      )}
      {['pending', 'confirmed', 'preparing'].includes(order.status) && (
        confirmCancel ? (
          <div className="flex gap-2 mt-1.5">
            <button onClick={() => { onCancel(order); setConfirmCancel(false); }}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: C.red }}>
              Yes, cancel order
            </button>
            <button onClick={() => setConfirmCancel(false)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{ border: `1px solid ${C.line}`, color: C.muted }}>
              Keep it
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmCancel(true)}
            className="mt-1.5 w-full py-1.5 text-xs font-semibold" style={{ color: C.red }}>
            Cancel order
          </button>
        )
      )}
    </div>
  );
}

export default function KitchenTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [mobileLane, setMobileLane] = useState('new');
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState('');
  const seenIds = useRef(null); // null until first fetch — no chime for pre-existing orders
  const audioRef = useRef(null);
  const soundOnRef = useRef(false);
  const lastChimeRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const r = await api.get('/orders');
      const active = r.data.filter(o => !['delivered', 'cancelled'].includes(o.status));
      setOrders(active);
      const ids = new Set(active.map(o => o.id));
      if (seenIds.current) {
        const hasNew = active.some(o => !seenIds.current.has(o.id));
        // Escalation: any NEW ticket older than 3 minutes keeps chiming each poll
        const stuck = active.some(o => ['pending'].includes(o.status) && minsSince(o.created_at, Date.now()) >= 3);
        if ((hasNew || stuck) && soundOnRef.current && audioRef.current && Date.now() - lastChimeRef.current > 8000) {
          audioRef.current.play().catch(() => {});
          lastChimeRef.current = Date.now();
        }
      }
      seenIds.current = ids;
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/new-order.wav');
    fetchOrders();
    const poll = setInterval(fetchOrders, 12000);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    const onVis = () => { if (!document.hidden) fetchOrders(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(poll); clearInterval(tick); document.removeEventListener('visibilitychange', onVis); };
  }, [fetchOrders]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    if (next && audioRef.current) {
      // Unlock autoplay with a user gesture
      audioRef.current.play().then(() => { audioRef.current.pause(); audioRef.current.currentTime = 0; }).catch(() => {});
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const advance = async (order, status) => {
    setBusyId(order.id);
    const prev = orders;
    setOrders(os => os.map(o => o.id === order.id ? { ...o, status } : o)
      .filter(o => !['delivered', 'cancelled'].includes(o.status)));
    try {
      await api.put(`/orders/${order.id}/status`, { status });
    } catch (e) {
      setOrders(prev);
      showToast(e.response?.data?.detail || 'Could not update — try again.');
    } finally { setBusyId(null); }
  };

  const cancel = (order) => advance(order, 'cancelled');

  const eightySix = async (item) => {
    try {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
      await api.put(`/menu/${item.menu_item_id}`, { sold_out_until: today });
      showToast(`"${item.name}" is sold out for today — back automatically tomorrow.`);
    } catch {
      showToast('Could not mark sold out — try the Menu tab.');
    }
  };

  const lanes = LANES.map(l => ({ ...l, orders: orders.filter(o => l.statuses.includes(o.status)) }));

  // Today-at-a-glance: upcoming collection slots
  const slotCounts = {};
  orders.forEach(o => {
    if (o.scheduled_slot_final && !['delivered', 'cancelled'].includes(o.status)) {
      slotCounts[o.scheduled_slot_final] = (slotCounts[o.scheduled_slot_final] || 0) + 1;
    }
  });
  const slotStrip = Object.keys(slotCounts).sort().map(iso => `${slotLabel(iso)} ×${slotCounts[iso]}`);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <RefreshCw size={28} className="animate-spin" style={{ color: C.burgundy }} />
    </div>
  );

  return (
    <div>
      {/* Controls row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <button onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: soundOn ? '#EDF4EF' : 'white', color: soundOn ? C.green : C.muted, border: `1px solid ${C.line}` }}>
          {soundOn ? <Bell size={13} /> : <BellOff size={13} />}
          New-order sound {soundOn ? 'on' : 'off'}
        </button>
        {slotStrip.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-bold overflow-x-auto" style={{ color: C.muted }}>
            <span className="uppercase tracking-widest" style={{ color: C.gold }}>Collections:</span>
            {slotStrip.map(s => <span key={s} className="whitespace-nowrap px-2 py-0.5 rounded-full bg-white" style={{ border: `1px solid ${C.line}` }}>{s}</span>)}
          </div>
        )}
      </div>

      {toast && (
        <div className="mb-3 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FBF3DC', color: C.muted }}>
          {toast}
        </div>
      )}

      {/* Mobile lane tabs */}
      <div className="flex md:hidden gap-1 mb-3 rounded-xl p-1" style={{ backgroundColor: '#5C0017' }}>
        {lanes.map(l => (
          <button key={l.id} onClick={() => setMobileLane(l.id)}
            className="flex-1 py-2.5 rounded-lg text-[11px] font-black tracking-wide"
            style={{ backgroundColor: mobileLane === l.id ? C.burgundy : 'transparent', color: mobileLane === l.id ? '#fff' : '#D9B8C0' }}>
            {l.label}
            <span className="ml-1.5 px-1.5 rounded-full text-[10px]" style={{ backgroundColor: C.saffron, color: C.ink }}>{l.orders.length}</span>
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lanes.map(l => (
          <div key={l.id} className={mobileLane === l.id ? '' : 'hidden md:block'}>
            <div className="hidden md:flex items-center justify-between rounded-lg px-3 py-2 mb-3 text-white text-xs font-black tracking-widest"
              style={{ backgroundColor: l.id === 'prep' ? C.saffron : l.id === 'ready' ? C.green : '#5C0017', color: l.id === 'prep' ? C.ink : '#fff' }}>
              {l.label}
              <span>{l.orders.length}</span>
            </div>
            {l.orders.length === 0 ? (
              <p className="text-center text-xs py-10" style={{ color: C.muted }}>Nothing here right now.</p>
            ) : (
              l.orders.map(o => (
                <Ticket key={o.id} order={o} now={now}
                  onAdvance={advance} onCancel={cancel} onEightySix={eightySix}
                  busy={busyId === o.id} />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
