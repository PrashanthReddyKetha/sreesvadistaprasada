# Sree Svadista Prasada — Copilot Workspace Instructions

## Project Overview
Full-stack food ordering app for an authentic South Indian restaurant (Milton Keynes, Edinburgh, Glasgow).

- **Frontend**: React 19 + CRACO, Tailwind CSS, React Router v7, Axios — deployed on Vercel
- **Backend**: FastAPI + Uvicorn, MongoDB (Motor async), JWT auth — deployed on Render (free tier — spins down after inactivity)
- **Repo**: https://github.com/PrashanthReddyKetha/sreesvadistaprasada

## Build & Run

```bash
# Backend
cd backend && pip install -r requirements.txt
MONGO_URL=... uvicorn server:app --reload --port 8000

# Frontend (React)
cd frontend && yarn install
REACT_APP_BACKEND_URL=http://localhost:8000 yarn start

# Frontend (Next.js SEO site)
cd ssp-nextjs && yarn install && yarn dev
```

## Architecture

- All backend routes are prefixed `/api` — register new routers in `backend/server.py`
- JWT stored in `localStorage` as `ssp_token`; attached via `frontend/src/api/index.js` request interceptor
- `get_optional_user` in `backend/auth.py` — returns `None` if no token (use for public endpoints that optionally need user context)
- `GET /api/menu` defaults `available=None` (returns all — used by admin). Public menu pages pass `?available=true` explicitly

## Critical CORS Rule

CORS origins are **hardcoded** in `backend/server.py`. DO NOT add a `CORS_ORIGINS` env var on Render.
`allow_origins=["*"]` combined with `allow_credentials=True` is invalid and breaks browser logins.

Hardcoded origins:
```python
ALLOWED_ORIGINS = [
    "https://sreesvadistaprasada.com",
    "https://sreesvadistaprasada-git-main-prasanthreddykethas-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/server.py` | FastAPI app, CORS config, router registration |
| `backend/auth.py` | `get_current_user`, `require_admin`, `get_optional_user` |
| `backend/models.py` | All Pydantic models |
| `backend/seed.py` | Menu seed data + `create_admin_user()` |
| `frontend/src/api/index.js` | Axios instance |
| `frontend/src/App.js` | All routes + `ScrollToTop` |
| `frontend/src/context/AuthContext.jsx` | `user`, `login`, `logout`, `authOpen`, `setAuthOpen` |
| `frontend/src/context/CartContext.jsx` | `cartItems`, `cartCount`, `addToCart`, `removeFromCart` |
| `frontend/src/data/mockData.js` | Hero slides, gallery, meal moments (static fallback) |

## Env Vars (Render — backend)

| Variable | Purpose |
|----------|---------|
| `MONGO_URL` | MongoDB connection string (required) |
| `DB_NAME` | MongoDB database name |
| `JWT_SECRET` | JWT signing key |
| `ADMIN_EMAIL` | Admin account email |
| `ADMIN_PASSWORD` | Admin account password |
| `ANTHROPIC_API_KEY` | Claude Haiku for AI menu auto-fill |

## Conventions

- Commit co-author: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- All Pydantic models live in `backend/models.py`
- Admin URL: `/admin` — requires `user.role === 'admin'`
- Header shows "Admin Panel" button (not user name) when admin
- `ScrollToTop` in `App.js` fires `window.scrollTo({ top: 0, behavior: 'instant' })` on pathname change
