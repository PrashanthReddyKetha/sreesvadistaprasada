'use client';
import { Lock } from 'lucide-react';
import { DELIVERY_LOCKED_MESSAGE } from '@/config/softLaunch';

/**
 * Replaces the Delivery/Takeaway toggle everywhere while DELIVERY_LOCKED is
 * on (src/config/softLaunch.ts) — a single takeaway badge plus a themed
 * explanation, instead of a toggle the customer can't actually use.
 */
export default function DeliveryLockedNotice({ compact = false }) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
      <div
        className={`w-full text-center rounded-xl font-bold ${compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm'}`}
        style={{ backgroundColor: '#800020', color: '#fff' }}
      >
        🛵 Takeaway — Collect &amp; save 10%
      </div>
      <div
        className={`flex items-start gap-2 rounded-xl ${compact ? 'px-3 py-2 text-[11px]' : 'px-3 py-2.5 text-xs'}`}
        style={{ backgroundColor: '#FBF3DC', border: '1px solid rgba(244,196,48,0.5)', color: '#5C4B47' }}
      >
        <Lock size={compact ? 11 : 13} className="mt-0.5 flex-shrink-0" style={{ color: '#8B6914' }} />
        <span>{DELIVERY_LOCKED_MESSAGE}</span>
      </div>
    </div>
  );
}
