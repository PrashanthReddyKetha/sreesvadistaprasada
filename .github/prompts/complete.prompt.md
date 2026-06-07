---
description: "Implement a full-stack feature end-to-end: Pydantic models, FastAPI route, frontend API call, and React UI for Sree Svadista Prasada"
argument-hint: "Describe the feature to implement (e.g. 'loyalty points system', 'order tracking page', 'review moderation')"
agent: "agent"
tools: [read, edit, search, execute]
---

Implement the following feature end-to-end for Sree Svadista Prasada:

**Feature**: $feature

---

## Step 1 — Backend: Models

Add any new Pydantic models to `backend/models.py`:
- Request models (for POST/PUT body validation)
- Response models (for consistent API responses)
- Database models (for MongoDB document structure)

## Step 2 — Backend: Route

Create or update the appropriate route file in `backend/routes/`:

```python
# Auth dependencies to use:
# get_current_user  → authenticated customers and admins
# require_admin     → admin-only endpoints
# get_optional_user → public endpoints that optionally personalize

@router.get("/endpoint")
async def handler(current_user = Depends(get_current_user)):
    ...
```

If creating a new route file, register it in `backend/server.py`:
```python
from routes.my_new_module import router as my_new_router
app.include_router(my_new_router)
```

All routes are prefixed `/api`.

## Step 3 — Frontend: API Call

Add the API function to `frontend/src/api/index.js` or call inline using the Axios instance:

```js
import api from '../api'; // always use this instance, never fetch directly

const result = await api.get('/endpoint');
const result = await api.post('/endpoint', payload);
```

## Step 4 — Frontend: UI

Create or update the page in `frontend/src/pages/` or component in `frontend/src/components/`:

- Follow Tailwind utility classes used throughout the codebase
- Use Shadcn UI components from `frontend/src/components/ui/` where appropriate
- Use `useAuth()` from `AuthContext` and `useCart()` from `CartContext` as needed
- Show login modal for auth-required actions: `setAuthOpen(true)`
- Admin-only UI: check `user?.role === 'admin'`

If creating a new page, add a route to `frontend/src/App.js`.

## Step 5 — Verify

- [ ] Happy path: API returns data, UI renders correctly
- [ ] Auth guard: unauthenticated requests return 401, frontend handles it
- [ ] Admin guard: non-admin requests to admin endpoints return 403
- [ ] No CORS issues (origins hardcoded in `backend/server.py` — do NOT add `CORS_ORIGINS` env var)
- [ ] Public menu endpoints pass `?available=true`

## Project Constraints

| Rule | Detail |
|------|--------|
| JWT key | `ssp_token` in localStorage — do not change |
| CORS | Hardcoded in `backend/server.py` — never use `CORS_ORIGINS` env var |
| New routes | Must be registered in `server.py` |
| New models | Must go in `backend/models.py` |
| Public menus | Always pass `?available=true` |
| Commit | `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` |
