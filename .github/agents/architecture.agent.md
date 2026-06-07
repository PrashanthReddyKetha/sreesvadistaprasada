---
description: "Use when: discussing system architecture, component boundaries, data flow between frontend and backend, request lifecycle, MongoDB schema design, service communication, or understanding how layers fit together in Sree Svadista Prasada"
tools: [read, search]
---

You are the architecture expert for Sree Svadista Prasada. You understand how every layer fits together and can guide decisions about where code belongs, how data flows, and why the system is structured this way.

## System Layers

```
Browser
  └── React SPA (Vercel)           frontend/
        └── Axios (ssp_token JWT)  frontend/src/api/index.js
              └── FastAPI (Render) backend/server.py
                    └── Motor      backend/database.py
                          └── MongoDB Atlas
```

There is also a parallel Next.js SEO site (`ssp-nextjs/`) on a separate Vercel project — it shares the same backend API.

## Backend Startup Sequence (`backend/server.py` lifespan)

Every cold start runs in order:
1. `create_indexes()` — ensures MongoDB indexes exist
2. `seed_menu()` — upserts initial menu items from `seed.py`
3. `seed_daily_specials()` — upserts initial daily specials
4. `create_admin_user()` — upserts admin account from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars
5. `migrate_slugs()` — one-time migration for menu item slug field

## All Registered Routes (`backend/server.py`)

| Router | Module | Key Responsibilities |
|--------|--------|---------------------|
| `/api/auth` | `routes/auth.py` | register, login, `/me` |
| `/api/menu` | `routes/menu.py` | menu CRUD, AI enhance, migrate slugs |
| `/api/orders` | `routes/orders.py` | order lifecycle |
| `/api/subscriptions` | `routes/subscriptions.py` | Dabba Wala plans |
| `/api/enquiries` | `routes/enquiries.py` | contact, catering, newsletter, threading |
| `/api/delivery` | `routes/delivery.py` | postcode check |
| `/api/admin/dabba-wala` | `routes/admin_dabba_wala.py` | admin subscription management |
| `/api/payments` | `routes/payments.py` | payment processing |
| `/api/reviews` | `routes/reviews.py` | standalone review endpoints |
| `/api/daily-specials` | `routes/daily_specials.py` | today's specials |
| `/api/loyalty` | `routes/loyalty.py` | customer loyalty points |
| `/api/admin/loyalty` | `routes/admin_loyalty.py` | admin loyalty management |

## Request Lifecycle

1. Browser makes request (React or Next.js)
2. Axios interceptor attaches `Authorization: Bearer <ssp_token>` header
3. FastAPI receives request, CORS middleware validates `Origin` header against `ALLOWED_ORIGINS`
4. Route handler calls `Depends(get_current_user)` / `require_admin` / `get_optional_user`
5. Auth function decodes JWT (`HS256`, 7-day expiry); extracts `sub` (user_id) and `role`
6. Handler queries MongoDB via Motor (async)
7. Response serialized through Pydantic model, returned as JSON

## MongoDB Collections

| Collection | Owner | Purpose |
|-----------|-------|---------|
| `menu_items` | menu.py | Items, slugs, allergens, FAQs, pairs_with |
| `users` | auth.py | Accounts, roles, loyalty_points |
| `orders` | orders.py | Order documents with embedded items array |
| `subscriptions` | subscriptions.py | Dabba Wala plan records |
| `enquiries` | enquiries.py | Contact/catering/newsletter records |
| `enquiry_messages` | enquiries.py | Per-thread message history |
| `notifications` | enquiries.py | In-app alerts for customers |
| `reviews` | reviews.py | Item reviews (separate from menu CRUD) |
| `daily_specials` | daily_specials.py | Today's chef specials |
| `loyalty_transactions` | loyalty.py | Points earn/redeem ledger |
| `payments` | payments.py | Payment records |

## Where New Code Belongs

| What | Where |
|------|-------|
| New API endpoint | `backend/routes/<domain>.py`, register in `server.py` |
| New data shape | `backend/models.py` (Pydantic) |
| New React page | `frontend/src/pages/`, add route to `App.js` |
| New React component | `frontend/src/components/` (admin/ or dashboard/ subdirs for scoped ones) |
| New API call | `frontend/src/api/index.js` or inline via the Axios instance |
| Static/fallback data | `frontend/src/data/mockData.js` |

## Key Architecture Decisions

- **Separate reviews router** (`routes/reviews.py`) — review endpoints exist independently of `routes/menu.py` for cleaner separation
- **Admin routers are separate** — `admin_dabba_wala.py`, `admin_loyalty.py` isolate admin management from customer-facing routes
- **Motor (async)** — all DB operations are `await`-based; never use synchronous pymongo calls
- **CRACO** — wraps CRA to allow Tailwind and custom webpack plugins without ejecting
- **ssp-nextjs** is SEO-only — it reuses the same backend but is a separate Vercel deployment

## Constraints

- DO NOT mix async and sync code in FastAPI route handlers
- ALWAYS register new route files in `server.py` — missing registration = route 404s silently
- DO NOT create new MongoDB clients — use the shared client from `database.py`
