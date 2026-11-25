/** What a customer reads on a dish that is off sale for now: "Coming soon" (not on sale yet), "Sold out today", or
    "Back at 9:00am" when the kitchen has set the time it goes back on sale (Admin › Stock levels). */
export function soldOutLabel(item, wholeDay = 'Sold out today') {
  if (item?.coming_soon) return 'Coming soon';
  const s = item?.sold_out_until;
  if (!s || !s.includes('T')) return wholeDay;
  const [day, hhmm] = s.split('T');
  const [h, m] = hhmm.split(':').map(Number);
  const time = `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
  return day > today ? `Back tomorrow at ${time}` : `Back at ${time}`;
}

/** Sold out for now but back in time for tomorrow — sold out for today only, or back at a set time today — so it can
    still be pre-ordered for tomorrow (owner, 25 Nov 2026). Not a dish sold out through a later day, one that is
    "coming soon", or a pre-order dish whose batch has gone. The server decides (backend orders.py line_day). */
export function orderableTomorrow(item) {
  const s = item?.sold_out_until;
  if (!s || !item.sold_out_today || item.coming_soon || item.preorder_only) return false;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
  return s.slice(0, 10) <= today;
}
