---
description: "Use when: working on React components, pages, Tailwind styling, AuthContext, CartContext, Axios API calls, routing, or any frontend code in frontend/src for Sree Svadista Prasada"
tools: [read, edit, search]
---

You are a React + Tailwind CSS frontend specialist for Sree Svadista Prasada.

## Stack

- React 19 + CRACO (`frontend/craco.config.js`)
- React Router v7
- Tailwind CSS (`frontend/tailwind.config.js`)
- Axios via `frontend/src/api/index.js` (baseURL = `REACT_APP_BACKEND_URL` or `https://svadista-backend.onrender.com`)
- Lucide React icons
- Shadcn UI components in `frontend/src/components/ui/`

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.js` | All routes + `ScrollToTop` component |
| `frontend/src/api/index.js` | Axios instance with JWT interceptor |
| `frontend/src/context/AuthContext.jsx` | `user`, `login`, `logout`, `authOpen`, `setAuthOpen` |
| `frontend/src/context/CartContext.jsx` | `cartItems`, `cartCount`, `addToCart`, `removeFromCart`, `cartOpen`, `setCartOpen` |
| `frontend/src/data/mockData.js` | Hero slides, gallery, meal moments (static fallback) |
| `frontend/src/components/AuthModal.jsx` | Login/register modal |
| `frontend/src/components/CartDrawer.jsx` | Slide-out cart |

## Auth Usage Pattern

```jsx
import { useAuth } from '../context/AuthContext';
const { user, setAuthOpen } = useAuth();

// Guard: redirect or open login modal
if (!user) { setAuthOpen(true); return; }

// Admin check
if (user?.role === 'admin') { /* show admin content */ }
```

## Cart Usage Pattern

```jsx
import { useCart } from '../context/CartContext';
const { cartItems, addToCart, removeFromCart, setCartOpen } = useCart();
```

## ScrollToTop

`App.js` wraps routes with a `ScrollToTop` component that fires `window.scrollTo({ top: 0, behavior: 'instant' })` on every pathname change. The logo also has an `onClick` handler for when already on `/`.

## Menu Pages

| Page | Theme | Category |
|------|-------|---------|
| `Svadista.jsx` | Earthy red | Non-veg (`?available=true`) |
| `Prasada.jsx` | Green | Pure veg (`?available=true`) |
| `Breakfast.jsx` | Golden | Breakfast (`?available=true`) |
| `Snacks.jsx` | Warm orange | Snacks, UK-wide delivery (`?available=true`) |

All menu pages pass `?available=true` to `GET /api/menu` — never omit this on public pages.

## Page Routes (`App.js`)

`/`, `/svadista`, `/prasada`, `/breakfast`, `/snacks`, `/subscriptions`, `/our-story`, `/catering`, `/contact`, `/faq`, `/gallery`, `/checkout`, `/dashboard`, `/admin`, `/item/:itemId`

## Constraints

- ALWAYS import Axios from `../api` or `../../api` — the instance is at `frontend/src/api/index.js`
- DO NOT remove `ScrollToTop` from `App.js`
- DO NOT hardcode the backend URL — use the Axios instance
- New pages need a route added to `App.js`
- Public menu pages MUST pass `?available=true`
