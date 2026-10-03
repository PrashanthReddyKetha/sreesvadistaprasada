'use client';

/**
 * Introductory-pricing note — premium, quiet, confident. No countdowns,
 * no flashing: scarcity stated once, in the brand's voice.
 * The owner has confirmed these are opening prices that will rise. The note
 * speaks only about our own food and prices — nothing about other kitchens,
 * which could not be backed up.
 */
export default function IntroPricesBanner({ compact = false }) {
  return (
    <div className={compact ? 'px-4 py-3' : 'px-5 py-4'}
      style={{
        background: 'linear-gradient(120deg, #800020 0%, #5C0017 100%)',
        borderRadius: 14,
      }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#F4C430' }}>
        Introductory prices · limited period
      </p>
      <p className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed`} style={{ color: '#F9EFDD' }}>
        Every dish is cooked fresh to order, with premium ingredients and true Andhra spices —
        food we believe is worth more than we are asking. These are our opening prices, and they will rise.
        <span className="font-semibold" style={{ color: '#F4C430' }}> Taste it at today&apos;s price while it lasts.</span>
      </p>
    </div>
  );
}
