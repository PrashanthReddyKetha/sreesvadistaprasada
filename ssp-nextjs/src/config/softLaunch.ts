/**
 * Soft-launch configuration.
 * When the full menu is ready, remove this file and all imports of it.
 * Single place to flip: add/remove categories from ORDERABLE_CATEGORIES as they go live.
 *
 * Pickles & Podis (Hot, Sweet & Pickles / /snacks) are intentionally excluded —
 * that section shows a dedicated "coming soon" page instead of Add to Cart.
 */

const ORDERABLE_CATEGORIES = new Set(['breakfast', 'nonveg', 'veg', 'drinks', 'streetfood', 'ragispecials'])

/** Returns true if the given menu category can be ordered right now */
export const isOrderable = (category?: string | null): boolean =>
  ORDERABLE_CATEGORIES.has((category ?? '').toLowerCase())

/** WhatsApp bulk-order enquiry URL */
export const WA_BULK =
  'https://wa.me/447307119962?text=Hi%2C%20I%27m%20interested%20in%20a%20bulk%20order.%20Please%20tell%20me%20more!'

/**
 * Delivery is paused while we get it running properly — takeaway only for
 * now. Every delivery/takeaway toggle in the app reads this single flag;
 * flip it back to false (and nothing else) to bring delivery back.
 */
export const DELIVERY_LOCKED = true
export const DELIVERY_LOCKED_MESSAGE =
  "Delivery's warming up in the kitchen — we're putting the finishing touches on it. Takeaway only for now, but we'll unlock delivery very soon!"
