'use client';
import { Lock } from 'lucide-react';
import { DELIVERY_LOCKED_MESSAGE } from '@/config/softLaunch';

/**
 * Drop-in replacement for the old Delivery/Takeaway toggle while
 * DELIVERY_LOCKED is on (src/config/softLaunch.ts) — same two-segment
 * shape, but Delivery is shown disabled with a lock + "soon" instead of
 * being removed, and Takeaway sits selected as the only working option.
 */
export default function DeliveryLockedNotice({ compact = false }) {
  const pad = compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm';
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex gap-2">
        <button
          type="button"
          disabled
          title="Delivery is coming soon"
          className={`flex-1 ${pad} rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed`}
          style={{ backgroundColor: '#F3EDE2', color: '#9C9088', border: '1px solid rgba(92,75,71,0.12)' }}
        >
          <Lock size={compact ? 11 : 13} />
          Delivery <span className="font-normal opacity-80">· soon</span>
        </button>
        <div
          className={`flex-1 ${pad} rounded-xl font-semibold text-center text-white`}
          style={{ backgroundColor: '#800020' }}
        >
          🛵 Takeaway — save 10%
        </div>
      </div>
      <p className={compact ? 'text-[10px] leading-snug' : 'text-[11px] leading-snug'} style={{ color: '#8B6914' }}>
        🔒 {DELIVERY_LOCKED_MESSAGE}
      </p>
    </div>
  );
}
