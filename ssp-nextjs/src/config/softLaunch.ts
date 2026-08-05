/**
 * Soft-launch configuration.
 * When the full menu is ready, remove this file and all imports of it.
 * Single place to flip: add categories to ORDERABLE_CATEGORIES as they go live.
 */

const ORDERABLE_CATEGORIES = new Set(['breakfast'])

/** Returns true if the given menu category can be ordered right now */
export const isOrderable = (category?: string | null): boolean =>
  ORDERABLE_CATEGORIES.has((category ?? '').toLowerCase())

/** WhatsApp bulk-order enquiry URL */
export const WA_BULK =
  'https://wa.me/447307119962?text=Hi%2C%20I%27m%20interested%20in%20a%20bulk%20order.%20Please%20tell%20me%20more!'
