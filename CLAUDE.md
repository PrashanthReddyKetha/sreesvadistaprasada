# Sree Svadista Prasada — Project Context for Claude Code

## Response Style
Minimal words. No pleasantries, no preamble, no summaries. Code only unless explanation is essential. One sentence max per thought. Never say "I'll now...", "Let me...", "Great!", or similar filler.

## What This Is
A full-stack food ordering web app for an authentic South Indian restaurant serving Milton Keynes, Edinburgh, and Glasgow. Customers can browse menus, place orders, subscribe to a weekly meal plan (Dabba Wala), and contact the restaurant. Admins manage everything through a dashboard.

---

## Deployments

| Layer     | Platform | URL |
|-----------|----------|-----|
| Frontend  | Vercel   | https://sreesvadistaprasada.vercel.app |
| Backend   | Render   | https://svadista-backend.onrender.com |
| Repo      | GitHub   | https://github.com/PrashanthReddyKetha/sreesvadistaprasada |

- Frontend auto-deploys from `main` branch on Vercel.
- Backend auto-deploys from `main` branch on Render (free tier — spins down after inactivity).
- Push to `main` → both redeploy automatically.

---

## Tech Stack

### Frontend
- React 19 + CRACO (not CRA default)
- React Router v7
- Tailwind CSS
- Axios (via `frontend/src/api.js` — baseURL = `REACT_APP_BACKEND_URL` or `https://svadista-backend.onrender.com`)
- Lucide React icons
- `frontend/src/context/AuthContext.jsx` — `user`, `login`, `logout`, `authOpen`, `setAuthOpen`
- `frontend/src/context/CartContext.jsx` — `cartItems`, `cartCount`, `addToCart`, `removeFromCart`, `cartOpen`, `setCartOpen`

### Backend
- FastAPI + Uvicorn
- MongoDB via Motor (async) — `MONGO_URL` env var required
- JWT auth (python-jose), bcrypt passwords
- Anthropic Claude Haiku for AI menu item enhancement (`ANTHROPIC_API_KEY` env var)
- All routes prefixed `/api`

---

## Environment Variables (Render backend)

| Variable          | Purpose |
|-------------------|---------|
| `MONGO_URL`       | MongoDB connection string (required) |
| `DB_NAME`         | MongoDB database name |
| `JWT_SECRET`      | JWT signing key (defaults to dev key if unset) |
| `ADMIN_EMAIL`     | Admin account email (used by seed.py) |
| `ADMIN_PASSWORD`  | Admin account password (used by seed.py) |
| `ANTHROPIC_API_KEY` | Claude Haiku API key for AI auto-fill |

**IMPORTANT — CORS:** `CORS_ORIGINS` env var on Render was previously set to `"*"` which broke browser logins (`allow_origins=["*"]` + `allow_credentials=True` is invalid). It was removed. CORS origins are now **hardcoded** in `backend/server.py`:
```python
ALLOWED_ORIGINS = [
    "https://sreesvadistaprasada.vercel.app",
    "https://sreesvadistaprasada-git-main-prasanthreddykethas-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]
```
Do NOT add a `CORS_ORIGINS` env var back on Render — it would override this and break logins again.

---

## Admin Access

- URL: `/admin`
- Credentials set via `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars on Render
- `seed.py` upserts the admin user on every startup (sets `role=admin` even if user already existed as customer)
- Header shows "Admin Panel" button (not the user name) when `user.role === 'admin'`

---

## Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI app, CORS, router registration
│   ├── database.py        # Motor MongoDB client
│   ├── models.py          # All Pydantic models
│   ├── auth.py            # JWT helpers, get_current_user, require_admin, get_optional_user
│   ├── seed.py            # Menu seed data + create_admin_user()
│   └── routes/
│       ├── auth.py        # /api/auth — register, login, /me
│       ├── menu.py        # /api/menu — CRUD, reviews, likes, social, AI enhance
│       ├── orders.py      # /api/orders
│       ├── subscriptions.py # /api/subscriptions
│       ├── enquiries.py   # /api/enquiries — contact, catering, newsletter, threads, notifications
│       └── delivery.py    # /api/delivery/check (postcode checker)
├── frontend/
│   ├── src/
│   │   ├── App.js         # Routes + ScrollToTop component
│   │   ├── api.js         # Axios instance
│   │   ├── mockData.js    # Static fallback data (hero slides, meal moments, gallery)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx     # Logo scrolls to top on click; admin sees "Admin Panel" btn
│   │   │   ├── Footer.jsx
│   │   │   ├── HeroSlider.jsx
│   │   │   └── AuthModal.jsx
│   │   └── pages/
│   │       ├── Home.jsx        # Fetches featured items from API for trending carousel
│   │       ├── Admin.jsx       # Full admin dashboard (7 tabs)
│   │       ├── Dashboard.jsx   # Customer dashboard (5 tabs incl. Enquiries)
│   │       ├── ItemDetail.jsx  # /item/:itemId — reviews, likes, combos, FAQs
│   │       ├── Svadista.jsx    # /svadista menu page
│   │       ├── Prasada.jsx     # /prasada menu page
│   │       ├── Breakfast.jsx   # /breakfast menu page
│   │       ├── Snacks.jsx      # /snacks menu page
│   │       ├── Contact.jsx     # Submits with user_id if logged in
│   │       └── ...
└── render.yaml            # Render deployment config
```

---

## Key Architecture Decisions

### Menu / Available Items
- `GET /api/menu` defaults `available=None` (returns all items, used by admin)
- Public menu pages pass `?available=true` explicitly
- `GET /api/menu?featured=true&available=true` used by home page trending carousel

### Auth Flow
- JWT stored in `localStorage` as `ssp_token`
- `api.js` attaches it via request interceptor
- `get_optional_user` in `auth.py` returns `None` if no token (used for public endpoints that optionally need user context)

### Enquiry Conversation Threading
- `enquiry_messages` MongoDB collection stores thread messages
- `notifications` collection stores in-app notifications for customers
- Admin opens conversation in Enquiries tab → sends message → auto-updates status to "contacted"
- Customer sees unread badge on Dashboard Enquiries tab + alert on Overview
- Both sides poll every 6-8 seconds while conversation is open
- Contact form attaches `user_id` if user is logged in (links enquiry to account for notifications)

### Item Detail Pages (`/item/:itemId`)
- Loads item + reviews + social data (likes, order_count) in parallel
- `item.pairs_with` (array of IDs) used for "Goes Best With" section
- `item.faqs` (custom array) prepended before category FAQs
- Combo deal shows 5% saving, "Add Both to Cart"
- Reviews: star distribution, write-review form (requires login), one review per user

### Admin Dashboard Tabs
1. **Overview** — stats cards
2. **Orders** — filter by status, expandable rows, action buttons (Confirm → Preparing → Delivered → Cancel)
3. **Subscriptions**
4. **Menu** — category filter + search, Live/Hidden toggle, Edit/Add forms with:
   - AllergenPicker, FaqEditor, PairsWithPicker components
   - AI Auto-fill button (calls `/api/menu/ai/enhance` → Claude Haiku)
   - `BLANK_ITEM` constant for new item defaults
5. **Users**
6. **Enquiries** — inbox UI: list → click → conversation thread, reply box, status actions
7. **Newsletter**

### Customer Dashboard Tabs
1. **Overview** — stats + active subscription banner + recent orders + unread enquiry alert
2. **Orders** — expandable with 4-step progress tracker, cancel button
3. **Dabba Wala** — subscription details
4. **Enquiries** — see own enquiries, read/reply to admin messages, unread badge
5. **My Account** — edit name/phone inline

---

## ScrollToTop
`App.js` has a `ScrollToTop` component inside `BrowserRouter` that fires `window.scrollTo({ top: 0, behavior: 'instant' })` on every pathname change. Logo also has an `onClick` for when already on `/`.

---

## Known Issues / Gotchas
- **AI Auto-fill**: Requires `ANTHROPIC_API_KEY` env var on Render with credit balance. Currently shows 400 error if balance is zero.
- **Render free tier**: Backend spins down after ~15 min inactivity. First request after sleep takes ~30s to wake.
- **Mock data**: `frontend/src/mockData.js` is used for hero slides, gallery, meal moments. The trending carousel on Home now fetches live from API but falls back to mockData if API fails.
- **Social links** in Footer: Facebook/Twitter are still `href="#"` — user hasn't provided handles.
- **Catering form** on public site: submits to `/api/enquiries/catering`.

---

## Commit Convention
All commits are co-authored:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Running Locally
```bash
# Backend
cd backend && pip install -r requirements.txt
MONGO_URL=... uvicorn server:app --reload --port 8000

# Frontend
cd frontend && yarn install
REACT_APP_BACKEND_URL=http://localhost:8000 yarn start
```
