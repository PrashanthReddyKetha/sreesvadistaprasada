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
- `/order` (`OrderClient.jsx`): the dish is listed on the Pre-order tab with a burgundy
  "Pre-order" button (see "Today's Menu and Pre-order" below).
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

## Today's Menu and Pre-order on Order Now (25 Nov 2026)

`/order` has one switch: **Today's Menu** (saffron, ready in about 30 minutes) and **Pre-order** (burgundy, collected
tomorrow). A dish is on one list only: Today's Menu is every dish that is not `preorder_only` and not `coming_soon`;
Pre-order is the `preorder_only` dishes, then "coming soon" in a group of its own (bell only). Today's specials
(Admin › Today's Specials › Order page specials: the owner's own list for this page, `GET /api/daily-specials/order-page`,
settings `order_specials`; it falls back to the home page specials until the owner saves one) sit in a photo strip
above Today's Menu and are also listed under their own section.

**A dish that has sold out today can be ordered for tomorrow.** On Today's Menu it is greyed with a "Tomorrow"
button, and it is listed on Pre-order. The rule is `restock.back_tomorrow` (sold out for today only, or back at a set
time today — not one sold out through a later day, and not a special, which the page keeps to today). Each basket
line carries its day (`CartItem.preorder`), checkout sends it (`preorder` on each line of `/orders/calculate` and
`/orders`), and `orders.py line_day()` decides: a pre-order dish is always tomorrow's; any other dish is today's
unless the line asks for tomorrow and the dish is back by then. `CartContext.refreshPrices` keeps each line's day
in step with the menu. The basket bar shows one chip per day; each day's time is picked on its own tab, and
checkout shows both pickers.

## Where it shows

- `/order`, `/menu`, the Svadista / Prasada / Breakfast section pages and the
  dish page: a "Pre-order" button in place of "Add"; the basket carries
  `preorder`, so the slot picker locks to tomorrow and checkout is collection only.

## Open items for the future discussion

- ~~Admin UI toggle for `preorder_only`~~ — Admin › Stock levels, 14 Nov 2026.
- Cut-off time (e.g. order by 10 pm for next morning).
- Multi-day-ahead pre-orders (currently "tomorrow" only).
