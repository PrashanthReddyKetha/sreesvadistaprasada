/**
 * GTM / GA4 analytics helpers for Sree Svadista Prasada.
 * All functions push to window.dataLayer — GTM picks them up and
 * forwards to GA4 via the tags configured in the GTM workspace.
 *
 * Consent Mode v2: events are queued by GTM and only processed
 * after the user accepts cookies (analytics_storage: 'granted').
 */

function push(obj) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(obj);
}

// ── E-commerce helpers ───────────────────────────────────────────────────

function itemPayload(item, quantity = 1) {
  return {
    item_id:       item.id   || item.item_id,
    item_name:     item.name || item.item_name,
    item_category: item.category || '',
    price:         parseFloat(String(item.price).replace('£', '')) || 0,
    quantity,
    currency: 'GBP',
  };
}

// ── Events ───────────────────────────────────────────────────────────────

/** Fired when a product detail page loads */
export function trackViewItem(item) {
  push({ ecommerce: null }); // clear previous ecommerce object
  push({
    event: 'view_item',
    ecommerce: {
      currency: 'GBP',
      value: parseFloat(String(item.price).replace('£', '')) || 0,
      items: [itemPayload(item)],
    },
  });
}

/** Fired when an item is added to the basket */
export function trackAddToCart(item, quantity = 1) {
  const price = parseFloat(String(item.price).replace('£', '')) || 0;
  push({ ecommerce: null });
  push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'GBP',
      value: price * quantity,
      items: [itemPayload(item, quantity)],
    },
  });
}

/** Fired when an item is removed from the basket */
export function trackRemoveFromCart(item, quantity = 1) {
  const price = parseFloat(String(item.price).replace('£', '')) || 0;
  push({ ecommerce: null });
  push({
    event: 'remove_from_cart',
    ecommerce: {
      currency: 'GBP',
      value: price * quantity,
      items: [itemPayload(item, quantity)],
    },
  });
}

/** Fired when the cart drawer is opened */
export function trackViewCart(cartItems, cartTotal) {
  push({ ecommerce: null });
  push({
    event: 'view_cart',
    ecommerce: {
      currency: 'GBP',
      value: cartTotal,
      items: cartItems.map(i => itemPayload(i, i.quantity)),
    },
  });
}

/** Fired when the user clicks "Send it Home" / "Collect my order" */
export function trackBeginCheckout(cartItems, cartTotal, coupon = '') {
  push({ ecommerce: null });
  push({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'GBP',
      value: cartTotal,
      coupon,
      items: cartItems.map(i => itemPayload(i, i.quantity)),
    },
  });
}

/** Fired when payment is confirmed and order is placed */
export function trackPurchase(orderId, cartItems, cartTotal, deliveryFee = 0, coupon = '') {
  push({ ecommerce: null });
  push({
    event: 'purchase',
    ecommerce: {
      transaction_id: orderId,
      currency:       'GBP',
      value:          cartTotal + deliveryFee,
      shipping:       deliveryFee,
      coupon,
      items: cartItems.map(i => itemPayload(i, i.quantity)),
    },
  });
}

// ── Custom events ────────────────────────────────────────────────────────

/** Fired when a user joins the Notify Me waitlist */
export function trackNotifyMeSignup(itemName, category) {
  push({
    event:     'notify_me_signup',
    item_name: itemName,
    item_category: category,
  });
}

/** Fired when the newsletter subscription form is submitted */
export function trackNewsletterSignup(location = 'footer') {
  push({
    event:    'newsletter_signup',
    location,
  });
}

/** Fired when the WhatsApp CTA button is clicked */
export function trackWhatsAppClick(source = 'floating_button') {
  push({
    event:  'whatsapp_click',
    source,
  });
}

/** Fired when the contact / enquiry form is submitted */
export function trackEnquirySubmit(type = 'contact') {
  push({
    event:        'enquiry_submit',
    enquiry_type: type,
  });
}

/** Fired when user views a menu category page */
export function trackMenuCategoryView(category) {
  push({
    event:    'menu_category_view',
    category,
  });
}
