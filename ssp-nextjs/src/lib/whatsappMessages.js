/**
 * One-tap WhatsApp updates for the admin dashboard.
 *
 * Each helper returns the ready-to-send message for a customer; waLink() opens
 * it in WhatsApp (app or web) from the kitchen's own number — staff just hit send.
 * Edit the wording here; every button in the admin picks it up.
 */
const SITE_URL = 'https://sreesvadistaprasada.com';
const SIGN_OFF = '— Sree Svadista Prasada';

const firstName = (name) => (name || '').trim().split(/\s+/)[0] || 'there';

const trackLink = (tab, orderId) =>
  `${SITE_URL}/dashboard?tab=${tab}${orderId ? `&order=${orderId}` : ''}`;

const slotTime = (iso) => {
  if (!iso || iso.length < 16) return null;
  const h = parseInt(iso.slice(11, 13), 10);
  return `${h % 12 || 12}:${iso.slice(14, 16)} ${h < 12 ? 'am' : 'pm'}`;
};

const longDate = (iso) =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

/** UK-first: 07xxx → 447xxx. Returns digits only (what wa.me expects) or null. */
export const waPhone = (phone) => {
  let d = (phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '44' + d.slice(1);
  return d.length >= 10 ? d : null;
};

export const waLink = (phone, text) => {
  const p = waPhone(phone);
  return p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : null;
};

const money = (n) => `£${(n || 0).toFixed(2)}`;

const addressLine = (a) =>
  a ? [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(', ') : '';

/** Itemised receipt: one line per dish, then fees/discounts that apply, then the total (*bold* in WhatsApp). */
const orderSummary = (o) => [
  '*Your order*',
  ...(o.items || []).map(i => `${i.quantity} × ${i.name} — ${money(i.price * i.quantity)}`),
  o.free_item_discount > 0 ? `Loyalty free dish — -${money(o.free_item_discount)}` : '',
  o.takeaway_discount > 0 ? `Collection discount — -${money(o.takeaway_discount)}` : '',
  o.coupon_code ? `Coupon ${o.coupon_code} — -${money(o.coupon_discount)}` : '',
  o.small_order_fee > 0 ? `Small order fee — ${money(o.small_order_fee)}` : '',
  o.delivery_type !== 'takeaway' ? `Delivery — ${o.delivery_fee > 0 ? money(o.delivery_fee) : 'Free'}` : '',
  `*Total paid: ${money(o.total)}*`,
].filter(Boolean).join('\n');

/** Message matching the order's current status. Returns null for unknown statuses. */
export const orderMessage = (o) => {
  const name = firstName(o.customer_name);
  const num = o.order_number || (o.id || '').slice(0, 8).toUpperCase();
  const takeaway = o.delivery_type === 'takeaway';
  const slot = slotTime(o.scheduled_slot_final);
  const track = `Track your order: ${trackLink('orders', o.id)}`;
  const collectAt = slot ? `Your collection time is ${slot} at our Greenleys kitchen.` : '';

  const body = {
    pending: [
      `Namaste ${name} 🙏`,
      `Thank you for ordering from Sree Svadista Prasada! We have your order #${num} and our kitchen will confirm it in a moment.`,
      orderSummary(o),
      takeaway
        ? (collectAt || 'Collection from our Greenleys kitchen — we\'ll message you when it\'s ready.')
        : `Delivering to: ${addressLine(o.delivery_address)}`,
      track,
    ],
    confirmed: [
      `Good news, ${name}! Order #${num} is confirmed. 🎉`,
      takeaway
        ? `We'll cook it fresh and have it ready for you${slot ? ` at ${slot}` : ''} — we'll message you the moment it's packed.`
        : `We'll cook it fresh and message you the moment it leaves our kitchen.`,
      track,
    ],
    preparing: [
      `${name}, order #${num} is on the stove right now 🔥 — cooked fresh, just the way we'd make it at home.`,
      takeaway ? `We'll message you as soon as it's ready to collect.` : `We'll message you as soon as it's on its way.`,
      track,
    ],
    ready: [
      `${name}, order #${num} is ready — hot, fresh and waiting for you! 🛍️`,
      `Collect it from our Greenleys kitchen and just give your order number at the door. See you soon!`,
    ],
    out_for_delivery: [
      `${name}, order #${num} has left our kitchen and is on its way to you 🛵`,
      `It should be with you in about 10–15 minutes — please keep your phone handy.`,
      track,
    ],
    delivered: [
      takeaway
        ? `Thank you for collecting order #${num}, ${name}! 🙏`
        : `${name}, order #${num} has been delivered. 🙏`,
      `We hope every bite tastes like home. If you enjoyed it, a quick rating means the world to our small family kitchen:`,
      trackLink('reviews'),
    ],
    cancelled: [
      `${name}, order #${num} has been cancelled.`,
      `If this isn't what you expected, just reply here and we'll put it right straight away. 🙏`,
    ],
  }[o.status];

  return body ? [...body.filter(Boolean), SIGN_OFF].join('\n\n') : null;
};

const WHERE_LEFT = {
  door: 'left at your door',
  neighbour: 'left with your neighbour',
  safeplace: 'left in your safe place',
};

/** Daily Dabba Wala update for a row of /admin/dabba-wala/deliveries/today. */
export const dabbaDeliveryMessage = (d) => {
  const name = firstName(d.full_name || d.name);
  const plan = `Your plan and this week's menu: ${trackLink('subscriptions')}`;
  if (d.status === 'delivered') {
    const where = WHERE_LEFT[d.delivery_instruction];
    return [
      `${name}, today's dabba has been delivered${where ? ` — ${where}` : ''}. Enjoy it while it's warm! 🍛`,
      `Tell us how today's meal was: ${trackLink('reviews')}`,
      SIGN_OFF,
    ].join('\n\n');
  }
  const dishes = (d.menu?.items || []).join(', ');
  return [
    `Namaste ${name} 🙏 Your Dabba Wala is on its way — cooked fresh this morning.`,
    dishes ? `In today's dabba: ${dishes}.` : '',
    `It will be with you between 12 and 2pm.`,
    plan,
    SIGN_OFF,
  ].filter(Boolean).join('\n\n');
};

/** Welcome note for a new subscriber. */
export const dabbaWelcomeMessage = (sub) => [
  `Namaste ${firstName(sub.customer_name)} 🙏 Welcome to the Dabba Wala family!`,
  `Your ${sub.plan} ${sub.box_type === 'prasada' ? 'Prasada' : 'Svadista'} plan starts on ${longDate(sub.start_date)}, with lunch delivered between 12 and 2pm, Monday to Friday. Every box is cooked that same morning — the way we'd cook for our own family.`,
  `See your menu, skip a day or manage your plan: ${trackLink('subscriptions')}`,
  SIGN_OFF,
].join('\n\n');

/** Gentle renewal nudge near the end of a plan. */
export const dabbaRenewalMessage = (sub) => [
  `Namaste ${firstName(sub.customer_name)} 🙏 Your Dabba Wala plan ends on ${longDate(sub.end_date)} — we've loved cooking for you!`,
  `To keep your meals coming without a break, renew by Sunday 5pm: ${SITE_URL}/subscriptions`,
  SIGN_OFF,
].join('\n\n');
