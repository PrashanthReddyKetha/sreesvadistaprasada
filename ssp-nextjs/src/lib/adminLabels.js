/** Plain words for the codes the database uses, so no admin screen shows a raw status, category or box type. */

export const ORDER_STATUS = {
  pending: 'Waiting for you', confirmed: 'Confirmed', preparing: 'Being cooked', ready: 'Ready to collect',
  out_for_delivery: 'On the way', delivered: 'Done', cancelled: 'Cancelled',
};
export const PLAN_STATUS = { active: 'Running', paused: 'Paused', cancelled: 'Cancelled', expired: 'Finished', pending: 'Not started' };
export const ENQUIRY_STATUS = { new: 'New', contacted: 'Replied', resolved: 'Closed', closed: 'Closed', pending: 'New' };
export const BOX_TYPE = { veg: 'Vegetarian', nonVeg: 'Non-vegetarian', nonveg: 'Non-vegetarian', non_veg: 'Non-vegetarian', mixed: 'Mixed' };
export const PLAN_NAME = { weekly: 'Weekly plan', monthly: 'Monthly plan', trial: 'Trial' };
export const CATEGORY = {
  breakfast: 'Breakfast', veg: 'Prasada (vegetarian)', nonVeg: 'Svadista (non-vegetarian)', streetFood: 'Street food',
  drinks: 'Drinks', ragiSpecials: 'Ragi specials', pickles: 'Pickles', podis: 'Podis', snacks: 'Snacks',
};
export const DELIVERY_TYPE = { takeaway: 'Collection', delivery: 'Delivery' };

/** Any code → words: a known label, otherwise the code with its underscores and camel-case spelt out. */
export const words = (code, table) => {
  if (code === null || code === undefined || code === '') return '—';
  const key = String(code);
  if (table && table[key]) return table[key];
  const spaced = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** A status from any part of the system, by the most likely table. */
export const statusWords = (status) => ORDER_STATUS[status] || PLAN_STATUS[status] || ENQUIRY_STATUS[status] || words(status);
