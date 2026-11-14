'use client';
import { useState } from 'react';
import { Clock, X } from 'lucide-react';
import useDialog from '@/lib/useDialog';

/** "When will it be ready?" — asked as the kitchen starts preparing an ASAP collection order (owner, 14 Nov 2026).
    The choices run from 30 to 60 minutes after the order was placed, ten minutes apart (ordered at 6:00 → 6:30,
    6:40, 6:50, 7:00); times already gone are dropped and a few from now are added instead. The pick goes into the
    "we're preparing your order" message, the ticket and the customer's order page. */

const C = { burgundy: '#800020', gold: '#B8860B', muted: '#5C4B47', line: '#E8DFCE' };

// London wall-clock parts for an instant
const london = (d) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(d).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  return { iso: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`, h: Number(parts.hour), m: Number(parts.minute) };
};
const label = ({ h, m }) => `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
const ceil5 = (d) => new Date(Math.ceil(d.getTime() / 300000) * 300000);

export function readyChoices(order, now = new Date()) {
  const placed = new Date(order.created_at);
  const soonest = now.getTime() + 5 * 60000;
  const out = [];
  for (const mins of [30, 40, 50, 60]) {
    const t = new Date(placed.getTime() + mins * 60000);
    if (t.getTime() >= soonest) out.push(t);
  }
  for (const mins of [10, 20, 30, 40]) {          // the order has been waiting: offer times from now
    if (out.length >= 4) break;
    const t = ceil5(new Date(now.getTime() + mins * 60000));
    if (!out.some(x => Math.abs(x - t) < 60000)) out.push(t);
  }
  return out.sort((a, b) => a - b).slice(0, 5).map(t => { const l = london(t); return { iso: l.iso, label: label(l) }; });
}

export default function ReadyTimeSheet({ order, onPick, onClose, busy }) {
  const ref = useDialog(!!order, onClose);
  const [choices] = useState(() => readyChoices(order));
  const placedAt = label(london(new Date(order.created_at)));
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label="When will it be ready?" onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3" data-testid="ready-time-sheet">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.gold }}>#{order.order_number} · ordered {placedAt}</p>
            <h3 className="text-lg font-bold" style={{ color: C.burgundy }}>When will it be ready?</h3>
            <p className="text-xs" style={{ color: C.muted }}>The customer gets &ldquo;we&rsquo;re preparing your order — ready at about …&rdquo; by email and text.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1"><X size={20} style={{ color: C.muted }} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {choices.map(c => (
            <button key={c.iso} onClick={() => onPick(c.iso)} disabled={busy} data-testid="ready-time-choice"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
              style={{ backgroundColor: C.burgundy }}>
              <Clock size={14} /> {c.label}
            </button>
          ))}
        </div>
        <button onClick={() => onPick(null)} disabled={busy} className="w-full py-2 text-xs font-semibold underline underline-offset-2" style={{ color: C.muted }}>
          Start preparing without a time
        </button>
      </div>
    </div>
  );
}
