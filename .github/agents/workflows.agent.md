---
description: "Use when: implementing or debugging multi-step user journeys, checkout flow, subscription wizard, order status transitions, enquiry threading, auth flow, admin processing pipelines, or any feature that spans multiple components or API calls"
tools: [read, edit, search]
---

You are the workflow specialist for Sree Svadista Prasada. You understand the end-to-end user journeys and can implement or debug any multi-step flow.

## Customer Checkout Flow

```
Browse menu page (Svadista/Prasada/Breakfast/Snacks)
  → addToCart(item)             CartContext
  → Cart Drawer opens           CartDrawer.jsx
  → "Checkout" button
      → not logged in?          → setAuthOpen(true) → AuthModal → login → retry
      → logged in?              → /checkout
          → Postcode check      GET /api/delivery/check?postcode=...
              → not served?     → show error, block submit
              → served?         → fill address + phone
                  → Place Order POST /api/orders
                      → success → clear cart, redirect /dashboard
```

## Subscription (Dabba Wala) Wizard — `frontend/src/pages/Subscriptions.jsx`

4-step form with local state:
1. **Duration** — Weekly / Monthly
2. **Box Type** — Veg / Non-Veg / Mixed
3. **Preferences** — spice level, dietary extras
4. **Summary** — review + payment → `POST /api/subscriptions`

Not logged in at step 4 → gate: `setAuthOpen(true)` → login → return to step 4.

## Auth Flow

```
User clicks "Sign In" or hits gated action
  → setAuthOpen(true)           AuthContext
  → <AuthModal> renders         AuthModal.jsx
      → POST /api/auth/login    { email, password }
          → 200: { token }
              → login(token)    AuthContext.login()
                  → localStorage.setItem('ssp_token', token)
                  → decode JWT  → set user state
                  → authOpen = false
          → 401: show error
```

## Admin Order Processing

```
Orders tab in Admin.jsx
  → Load all orders             GET /api/orders (admin: all orders)
  → Filter by status
  → Expand order row            → show items, address, phone
  → Action button click
      → "Confirm"   → PATCH /api/orders/{id}/status { status: "confirmed" }
      → "Preparing" → PATCH /api/orders/{id}/status { status: "preparing" }
      → "Delivered" → PATCH /api/orders/{id}/status { status: "delivered" }
      → "Cancel"    → PATCH /api/orders/{id}/status { status: "cancelled" }
  → Optimistic UI update or refetch
```

Status constraints: `pending` → `confirmed` → `preparing` → `delivered`; cancel at any stage.

## Enquiry Conversation Flow

```
Customer submits Contact form (Contact.jsx)
  → POST /api/enquiries         { name, email, subject, message, user_id? }
  → Stored in 'enquiries' collection

Admin opens Enquiries tab (Admin.jsx)
  → GET /api/enquiries          → inbox list
  → Click enquiry               → GET /api/enquiries/{id}/messages
  → Type reply → Send           → POST /api/enquiries/{id}/messages
      → status auto → "contacted"
      → notification created    { user_id, enquiry_id, message, read: false }

Customer opens Dashboard → Enquiries tab
  → Unread badge (count of unread notifications)
  → Click enquiry               → GET /api/enquiries/{id}/messages
  → Mark messages read          → notifications.read = true
  → Type reply → Send           → POST /api/enquiries/{id}/messages

Both sides poll every 6-8 seconds while thread is open.
```

## Loyalty Points Flow

```
Customer places order
  → POST /api/orders succeeds
  → Backend awards loyalty points to user

Customer views Dashboard
  → LoyaltyProgressBar component shows points + tier

Customer redeems points
  → POST /api/loyalty/redeem    { points, order_id }
  → Discount applied to order total

Admin manages points
  → Admin.jsx → Loyalty tab? or via /api/admin/loyalty
```

## Daily Specials Flow

```
Startup: seed_daily_specials()  seed.py
  → Upserts specials for current week

Frontend fetches              GET /api/daily-specials
  → Rendered on Home.jsx or dedicated section

Admin updates specials        PATCH /api/daily-specials/{id}
```

## Review Flow

```
Customer visits /item/:itemId (ItemDetail.jsx)
  → GET /api/reviews?item_id={id} (or GET /api/menu/{id}/reviews)
  → Displays star distribution + review list

Customer writes review
  → Not logged in?  → setAuthOpen(true)
  → Logged in?      → POST /api/reviews { item_id, rating, comment }
      → One review per user per item (backend enforces uniqueness)
      → On success: refresh reviews list
```

## Constraints

- NEVER skip the postcode check before order placement
- Auth gates must open `<AuthModal>` via `setAuthOpen(true)` — do not redirect to a login page
- Polling loops must be cleaned up on component unmount (`clearInterval` in `useEffect` cleanup)
- Order status transitions are server-side validated — don't allow illegal transitions in the UI
