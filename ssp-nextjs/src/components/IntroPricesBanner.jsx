'use client';

/**
 * Introductory-pricing note — premium, quiet, confident. No countdowns,
 * no flashing: scarcity stated once, in the brand's voice.
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
        Premium ingredients, true Andhra spices, everything cooked fresh to order —
        at prices no kitchen in Milton Keynes can hold for long. Ours won&apos;t either.
        <span className="font-semibold" style={{ color: '#F4C430' }}> Taste the real thing while they last.</span>
      </p>
    </div>
  );
}
