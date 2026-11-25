/** The biryani multi-buy as the site shows it (owner, 25 Nov 2026). The server prices it and says whether it is
    running (backend offers.py, served with /kitchen-status as useKitchen().offer); this file only mirrors which
    dishes are in it and what a basket saves, so a page can say so before checkout. Checkout shows the server's figure.
    Keep inOffer() in step with offers.applies_to(). */

// Opens Order Now on the offer's dishes
export const OFFER_HREF = '/order?offer=1';

// Every biryani except the vegetarian one
export const inOffer = (d) => d?.category === 'nonVeg' && (d.subcategory || '').trim().toLowerCase() === 'biryani';

const pence = (v) => Math.round((parseFloat(String(v).replace('£', '')) || 0) * 100);

/** What the offer does for a basket: { count, saving, short }. `lines` are basket or menu lines with a price and a
    quantity; only the offer's dishes are counted. The dearest are paired first, so an odd one out is the cheapest,
    and a set that already costs no more than the offer price is left alone. `short` is how many more dishes
    complete the next set (0 when the basket is in whole sets, or has none of the offer's dishes). */
export function offerFor(lines, offer) {
  if (!offer?.live) return { count: 0, saving: 0, short: 0 };
  const units = [];
  for (const l of lines) if (inOffer(l)) for (let k = 0; k < (l.quantity || 0); k++) units.push(pence(l.price));
  units.sort((a, b) => b - a);
  const set = Math.round(offer.price * 100);
  let saving = 0;
  for (let k = 0; k + offer.qty <= units.length; k += offer.qty) {
    const full = units.slice(k, k + offer.qty).reduce((sum, p) => sum + p, 0);
    if (full > set) saving += full - set;
  }
  const over = units.length % offer.qty;
  return { count: units.length, saving: saving / 100, short: over ? offer.qty - over : 0 };
}
