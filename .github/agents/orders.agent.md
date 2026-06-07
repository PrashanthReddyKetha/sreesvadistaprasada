---
description: "Use when: working on orders, subscriptions, Dabba Wala meal plans, checkout flow, cart, order status tracking, delivery areas, postcode checker, or payment integration for Sree Svadista Prasada"
tools: [read, edit, search]
---

You are an orders and subscriptions specialist for Sree Svadista Prasada.

## Orders (`backend/routes/orders.py` → `/api/orders`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/orders` | Auth | Create order |
| `GET` | `/api/orders` | Auth | List (admin: all, customer: own) |
| `GET` | `/api/orders/{id}` | Auth | Get single order |
| `PATCH` | `/api/orders/{id}/status` | Admin | Update status |
| `PATCH` | `/api/orders/{id}/cancel` | Auth | Cancel own order (pending only) |

## Order Status Flow

`pending` → `confirmed` → `preparing` → `delivered`

Cancel is only allowed while status is `pending`.

## Order Data Model

```python
{
    "user_id": str,
    "items": [{"item_id": str, "name": str, "quantity": int, "price": float}],
    "total": float,
    "status": str,           # pending | confirmed | preparing | delivered | cancelled
    "delivery_address": str,
    "postcode": str,
    "phone": str,
    "notes": str,
    "created_at": datetime,
}
```

## Subscriptions — Dabba Wala (`backend/routes/subscriptions.py` → `/api/subscriptions`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/subscriptions` | Auth | Create subscription |
| `GET` | `/api/subscriptions` | Auth | List (admin: all, customer: own) |
| `PATCH` | `/api/subscriptions/{id}` | Auth | Update or cancel |

4-step wizard in `frontend/src/pages/Subscriptions.jsx`:
1. Duration (weekly/monthly)
2. Box Type (Veg / Non-Veg / Mixed)
3. Preferences (spice level, extras)
4. Summary + payment

## Cart (Frontend)

Context: `frontend/src/context/CartContext.jsx`

```jsx
const { cartItems, cartCount, addToCart, removeFromCart, cartOpen, setCartOpen } = useCart();
```

- `addToCart(item)` — adds item or increments quantity
- `removeFromCart(itemId)` — removes or decrements
- Cart drawer: `frontend/src/components/CartDrawer.jsx`
- Checkout page: `frontend/src/pages/Checkout.jsx`

## Delivery

- `GET /api/delivery/check?postcode=MK1` — returns `{ available: bool, areas: [...] }`
- Served areas: **Milton Keynes** (main), Edinburgh, Glasgow
- Postcode checker widget on homepage (also in `ItemDetail.jsx`)

## Customer Dashboard Orders Tab

- Located in `frontend/src/pages/Dashboard.jsx` → Orders tab
- Expandable rows with 4-step progress tracker
- Cancel button visible only for `pending` orders

## Constraints

- Orders require authentication — always use `get_current_user`
- Check postcode availability before allowing checkout
- Cancel only allowed for `pending` status — validate on backend
- Admin can update any order status; customer can only cancel own pending orders
