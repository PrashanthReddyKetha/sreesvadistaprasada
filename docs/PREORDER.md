# Pre-order (next-day collection) — built, currently parked

The full pre-order flow shipped in Sept 2026 and is **dormant, not deleted**.
It is driven entirely by one per-item flag: `preorder_only` on `menu_items`.
Right now `backend/menu_additions.py` forces `preorder_only: False` on the
Overnight Oats items at every startup, so everything behaves as normal
add-to-cart.

## What the flag does when `preorder_only: true`

Backend (`backend/routes/orders.py`):
- `/orders/calculate` and `create_order` reject a basket containing the item
  unless `delivery_type == takeaway` **and** `scheduled_slot` is a date after
  today (Europe/London).

Frontend (all conditional on `preorder_only` / cart item `preorder`):
- `/order` (`OrderClient.jsx`): "Pre-order" button label (burgundy), item
  sheet note "🌙 Made fresh overnight — pre-order today, collect tomorrow."
- `/menu` (`MenuClient.jsx`): "Pre-order" button label.
- `SlotPicker.jsx` `requireTomorrow` prop: locks the picker to Tomorrow,
  hides Today/ASAP, shows an explainer line. Passed from OrderClient and
  checkout as `requireTomorrow={hasPreorder}`.
- `checkout/page.jsx`: `hasPreorder` — if on Delivery, shows a
  collection-only strip with a one-tap "Switch" button.
- `CartContext.tsx`: `CartItem.preorder?: boolean` flows through the cart.

## To re-enable

1. In `backend/menu_additions.py`, change the `update_many` back to
   `{"$set": {"preorder_only": True}}` (or remove the block and set the flag
   per item in Mongo / a future admin toggle).
2. Deploy backend. No frontend change needed — everything reads the flag.

## Open items for the future discussion

- Admin UI toggle for `preorder_only` (currently DB/migration only).
- Cut-off time (e.g. order by 10 pm for next morning).
- Multi-day-ahead pre-orders (currently "tomorrow" only).
