# Pre-order (next-day collection) — switched per dish from Admin › Stock levels

The full pre-order flow shipped in Sept 2026. It is driven entirely by one
per-item flag: `preorder_only` on `menu_items`. Since 14 Nov 2026 the owner
sets it from **Admin › Stock levels › "Pre-order only"** (the other stock
options clear it); the backend no longer forces it off at startup.

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

## A basket collected twice (14 Nov 2026)

A pre-order dish no longer drags the whole basket to tomorrow. Today's dishes
keep their own collection time (ASAP or a slot); the pre-order dishes take a
time of their own tomorrow (`preorder_slot`). At payment the server splits the
basket into **two linked orders paid once**: today's order carries the
payment intent; the pre-order (`is_preorder`, `paid_with_order_id`,
`linked_order_*`) is a ticket of its own on the kitchen board, with its own
status, "ready" message and slot, and never counts twice for loyalty. Totals
are shared in proportion to each part's dishes and add up to the pence paid
(`split_totals`). Checkout shows two pickers (`CollectionTimes`), the
confirmation email and text name both times, the success screen shows both
order numbers, and the kitchen ticket reads "PRE-ORDER · TOMORROW 9:00 AM".
Cancelling the pre-order half frees its slot and flags `refund_due` (refund
against the partner's payment in Stripe).

## Where it shows

- `/order`, `/menu`, the Svadista / Prasada / Breakfast section pages and the
  dish page: a "Pre-order" button in place of "Add"; the basket carries
  `preorder`, so the slot picker locks to tomorrow and checkout is collection only.

## Open items for the future discussion

- ~~Admin UI toggle for `preorder_only`~~ — Admin › Stock levels, 14 Nov 2026.
- Cut-off time (e.g. order by 10 pm for next morning).
- Multi-day-ahead pre-orders (currently "tomorrow" only).
