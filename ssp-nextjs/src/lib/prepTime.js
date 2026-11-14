/** How long a fresh-cooked basket takes, and the words for it (owner, 14 Nov 2026).
    Most dishes about 30 minutes; curries (veg and non-veg) and thalis about 60; a basket of 6 or more dishes about 40.
    The numbers come from the kitchen (GET /kitchen-status → prep); each dish carries its own prep_minutes from /menu;
    at checkout the server's prep_minutes from /orders/calculate is the one that counts. */

export const FRESH_LINE = 'Nothing waits under a heat lamp — every dish is cooked fresh the moment you order.';

const DEFAULT_PREP = { quick: 30, long: 60, big: 40, big_from: 6 };

/** { minutes, kind: 'quick' | 'long' | 'big', dish?, count } for the basket items (each with prep_minutes and quantity). */
export function estimatePrep(items, prep) {
  const p = { ...DEFAULT_PREP, ...(prep || {}) };
  const today = (items || []).filter(i => !i.preorder);
  const slow = today.find(i => (i.prep_minutes || p.quick) > p.quick);
  if (slow) return { minutes: slow.prep_minutes || p.long, kind: 'long', dish: slow.name };
  const count = today.reduce((n, i) => n + (i.quantity || 1), 0);
  if (count >= p.big_from) return { minutes: p.big, kind: 'big', count };
  return { minutes: p.quick, kind: 'quick', count };
}

/** "11:05 am" — the clock time this many minutes from now, London time. */
export function readyBy(minutes) {
  const t = new Date(Date.now() + minutes * 60000);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: 'numeric', minute: '2-digit', hour12: true }).format(t).replace(/\s?(am|pm)/i, ' $1').trim();
}

/** The sentence under the estimate: why it takes this long. */
export function prepReason(est) {
  if (est.kind === 'long') return `${est.dish} is slow-cooked the Andhra way — give it about ${est.minutes} minutes.`;
  if (est.kind === 'big') return `${est.count} dishes, every one cooked fresh for you — about ${est.minutes} minutes.`;
  return `Cooked fresh when you order — about ${est.minutes} minutes.`;
}
