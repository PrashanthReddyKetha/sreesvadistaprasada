'use client';
import React, { useEffect, useState } from 'react';
import { Tag, X, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import api from '@/api';

/**
 * "Apply coupon" at checkout and in the Dabba Wala wizard.
 *   • Offers for you — active public codes for this scope (+ exclusive codes for
 *     the signed-in / typed email), greyed out with a reason when the basket
 *     doesn't qualify yet.
 *   • Have a code? — manual entry for exclusive codes.
 * Pricing is always the server's: `applied` / `error` come back from
 * /orders/calculate or /subscriptions/quote; this panel only picks the code.
 */
const C = { primary: '#800020', green: '#166534', greenBg: '#F0FDF4', amber: '#92400E', amberBg: '#FFFBEB', muted: '#7A5C50' };

const fmt = (n) => `£${Number(n || 0).toFixed(2)}`;

const expiryLabel = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const days = Math.ceil((d - Date.now()) / 86400000);
  if (days <= 0) return 'Ends today';
  if (days === 1) return 'Ends tomorrow';
  if (days <= 7) return `Ends ${d.toLocaleDateString('en-GB', { weekday: 'long' })}`;
  return `Until ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
};

const describe = (o) => {
  if (o.discount_type === 'free_delivery') return 'Free delivery';
  if (o.discount_type === 'percent') return `${o.discount_value}% off${o.max_discount ? ` (up to ${fmt(o.max_discount)})` : ''}`;
  return `${fmt(o.discount_value)} off`;
};

/** Why this card can't be used on the current basket — null when it can. Server has the final say. */
const blocker = (o, ctx) => {
  if (ctx.scope === 'orders') {
    if (o.order_type !== 'any' && o.order_type !== ctx.orderType) return `${o.order_type === 'delivery' ? 'Delivery' : 'Collection'} orders only`;
    if (o.discount_type === 'free_delivery' && ctx.orderType === 'takeaway') return 'Delivery orders only';
  } else {
    if (o.plan !== 'any' && o.plan !== ctx.plan) return `${o.plan[0].toUpperCase() + o.plan.slice(1)} plan only`;
    if (o.box_type !== 'any' && o.box_type !== ctx.boxType) return `${o.box_type[0].toUpperCase() + o.box_type.slice(1)} box only`;
  }
  if (o.min_subtotal && ctx.subtotal < o.min_subtotal) return `Add ${fmt(o.min_subtotal - ctx.subtotal)} more to use this`;
  return null;
};

export default function CouponPanel({ scope, email, ctx, applied, error, onApply, onRemove, disabledReason }) {
  const [open, setOpen] = useState(false);
  const [offers, setOffers] = useState([]);
  const [code, setCode] = useState('');
  const [tried, setTried] = useState(null); // code we last sent, to show its error

  useEffect(() => {
    if (!open) return;
    const q = new URLSearchParams({ scope, ...(email ? { email } : {}) });
    api.get(`/coupons/available?${q}`).then(r => setOffers(r.data || [])).catch(() => setOffers([]));
  }, [open, scope, email]);

  useEffect(() => { if (applied) { setTried(null); setCode(''); } }, [applied]);

  const apply = (c) => { setTried(c); onApply(c); };

  /* Applied state — one compact green row */
  if (applied) return (
    <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: C.greenBg, border: '1px solid #BBF7D0' }}>
      <div className="flex items-center gap-2 min-w-0">
        <Check size={15} style={{ color: C.green }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: C.green }}>{applied.name} applied</p>
          <p className="text-xs" style={{ color: C.green }}>Code {applied.code} · {applied.label} · you save {fmt(applied.discount)}</p>
        </div>
      </div>
      <button onClick={onRemove} className="text-xs font-semibold flex items-center gap-1 shrink-0" style={{ color: C.muted }}><X size={12} /> Remove</button>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(128,0,32,0.15)', backgroundColor: 'white' }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.primary }}><Tag size={15} /> Apply coupon</span>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(128,0,32,0.08)' }}>
          {disabledReason && (
            <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: C.amberBg, color: C.amber }}>{disabledReason}</p>
          )}

          {/* Offers */}
          <div className="pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Offers for you</p>
            {offers.length === 0 ? (
              <p className="text-xs" style={{ color: C.muted }}>No open offers right now — if you have a code, enter it below.</p>
            ) : (
              <div className="space-y-2">
                {offers.map(o => {
                  const why = blocker(o, { scope, ...ctx });
                  const thisErr = tried === o.code && error;
                  const locked = !!why || !!disabledReason;
                  return (
                    <div key={o.code} className="rounded-lg px-3 py-2.5 flex items-center justify-between gap-3"
                      style={{ border: `1px solid ${o.exclusive ? '#F4C430' : '#e8e2da'}`, backgroundColor: locked ? '#FAFAF8' : 'white', opacity: locked ? 0.7 : 1 }}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#2D2422' }}>
                          {o.exclusive && <Sparkles size={12} className="inline mr-1" style={{ color: '#B8860B' }} />}
                          {o.name}{o.exclusive && <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FBF3DC', color: '#B8860B' }}>Just for you</span>}
                        </p>
                        <p className="text-xs" style={{ color: C.muted }}>
                          {describe(o)}{o.min_subtotal ? ` · Min. ${fmt(o.min_subtotal)}` : ''}{o.first_order_only ? ' · First order' : ''}{expiryLabel(o.expires_at) ? ` · ${expiryLabel(o.expires_at)}` : ''}
                        </p>
                        {why && <p className="text-[11px] mt-0.5 font-medium" style={{ color: C.amber }}>{why}</p>}
                        {thisErr && <p className="text-[11px] mt-0.5 font-medium text-red-600">{error}</p>}
                      </div>
                      <button type="button" disabled={locked} onClick={() => apply(o.code)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                        style={{ backgroundColor: C.primary }}>Apply</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manual code */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Have a code?</p>
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (code.trim()) apply(code.trim()); }}>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Enter your code"
                disabled={!!disabledReason}
                className="flex-1 px-3 py-2 rounded-lg text-sm uppercase tracking-wider focus:outline-none"
                style={{ border: '1px solid #e0d9d0', letterSpacing: '0.08em' }} />
              <button type="submit" disabled={!code.trim() || !!disabledReason}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ backgroundColor: C.primary }}>Apply</button>
            </form>
            {tried && error && !offers.some(o => o.code === tried) && (
              <p className="text-xs mt-2 font-medium text-red-600">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
