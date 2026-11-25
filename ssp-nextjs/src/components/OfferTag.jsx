'use client';
import Link from 'next/link';
import { useKitchen } from '@/context/KitchenContext';
import { inOffer, OFFER_HREF } from '@/lib/offer';

/** The biryani multi-buy's words ("2 for £19.99") on a dish that is in it, shown only while the offer is running.
    `line`: a fuller line with a link to the offer on Order Now (the dish page); otherwise a small tag (dish cards). */
export default function OfferTag({ dish, line = false, className = '' }) {
  const { offer } = useKitchen();
  if (!offer?.live || !inOffer(dish)) return null;
  if (line) {
    return (
      <Link href={OFFER_HREF} data-testid="offer-line-link"
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${className}`}
        style={{ backgroundColor: '#FBF3DC', color: '#2D2422', border: '1px solid #EBD9A8' }}>
        <span className="rounded-full px-1.5 text-[9px] uppercase tracking-widest leading-[15px] text-white" style={{ backgroundColor: '#800020' }}>Offer</span>
        Any two biryanis for £{offer.price.toFixed(2)} →
      </Link>
    );
  }
  return (
    <span data-testid="offer-tag"
      className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-black whitespace-nowrap ${className}`}
      style={{ backgroundColor: '#FBF3DC', color: '#B8860B', border: '1px solid #EBD9A8' }}>
      {offer.label}
    </span>
  );
}
