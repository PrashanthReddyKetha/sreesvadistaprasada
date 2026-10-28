import Image from 'next/image';

// Food Hygiene Rating from Milton Keynes Council (FSA FHRS 1941265), checked on the FSA API 2026-10-28.
// The badges in /public/fhrs are the FSA's own files, unaltered — the FSA allows only the current rating,
// so if a re-inspection changes it, download the new badges from FSA_URL/online-ratings and update these lines.
export const HYGIENE = {
  rating: 5,
  label: 'Very good',
  inspected: '16 October 2026',
  url: 'https://ratings.food.gov.uk/business/1941265/sree-svadista-prasada',
};

const BADGES = {
  stacked: { src: `/fhrs/fhrs-${HYGIENE.rating}-style3.svg`, w: 291, h: 162 },
  wide: { src: `/fhrs/fhrs-${HYGIENE.rating}-style1.svg`, w: 481, h: 115 },
};

const HygieneRating = ({ variant = 'stacked', width = 180, caption = true, dark = false, priority = false, className = '' }) => {
  const b = BADGES[variant];
  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="hygiene-rating">
      <a href={HYGIENE.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
        <Image
          src={b.src}
          width={width}
          height={Math.round((width * b.h) / b.w)}
          alt={`Food hygiene rating is ${HYGIENE.rating}: ${HYGIENE.label}`}
          unoptimized
          priority={priority}
        />
      </a>
      {caption && (
        <p className="text-xs leading-snug text-left" style={{ color: dark ? '#A09890' : '#5C4B47' }}>
          <strong style={{ color: dark ? '#FDFBF7' : '#2D2422' }}>Top hygiene rating.</strong>{' '}
          Inspected by Milton Keynes Council on {HYGIENE.inspected}.{' '}
          <a href={HYGIENE.url} target="_blank" rel="noopener noreferrer" className="underline">See it on the FSA website</a>
        </p>
      )}
    </div>
  );
};

export default HygieneRating;
