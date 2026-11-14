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
