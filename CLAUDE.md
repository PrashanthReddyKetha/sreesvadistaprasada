# Sree Svadista Prasada — Project Context for Claude Code

## Response Style
Minimal words. No pleasantries, no preamble, no summaries. Code only unless explanation is essential. One sentence max per thought. Never say "I'll now...", "Let me...", "Great!", or similar filler.

## What This Is
Food ordering and Dabba Wala (tiffin subscription) web app for a South Indian **home kitchen in Milton Keynes** (one owner; not a restaurant; not family-run). Collection-only launch; single-order delivery sits behind an admin switch; Edinburgh and Glasgow are "coming soon". Admin runs the business from a phone.

Programme records, decisions, risks and audits live in `docs/ops/` (its own git repository inside this one; start with `docs/ops/MASTER_BRIEF.md`, `PHASE_SPECS.md`, `LAUNCH_CHECKLIST.md`, `audits/`). Owner facts that copy must respect are in `docs/ops/DECISION_LOG.md`.

---

## Deployments

| Layer    | Platform | URL | Deploys |
|----------|----------|-----|---------|
| Frontend | Vercel   | https://sreesvadistaprasada.com | from `ssp-nextjs/` on push to `main` |
| Backend  | Render (free tier, sleeps when idle) | https://svadista-backend.onrender.com | from `backend/` on push to `main` |
| CI       | GitHub Actions `.github/workflows/ci.yml` | backend tests · lint/type-check/build · browser journeys | does **not** gate deploys |
| Uptime   | `.github/workflows/keep-alive.yml` | cron `*/14` but GitHub runs it every 2–9 h in practice | emails the GitHub account on failure |

`frontend/` (CRA) and `mobile/` (Expo) are legacy; `frontend/` is not deployed. **Work in `ssp-nextjs/`.**

---

## Tech Stack

### Frontend — `ssp-nextjs/`
- Next.js 16 app router, React 19, Tailwind, lucide-react, `@/` alias → `src/`
- Pattern: server `page.jsx` (metadata, JSON-LD via `src/lib/seo/jsonLd.js` — always use the helper) → client island (`*Client.jsx`)
- `src/api.js` axios instance (`NEXT_PUBLIC_BACKEND_URL`), JWT in `localStorage` as `ssp_token`
- Contexts: `AuthContext` (user, login, logout, authOpen), `CartContext` (basket in `localStorage`, deltas tracked), `KitchenContext` (open, deliveryEnabled)
- Analytics: `src/lib/track.js` first-party visit record (plain-text batches to `/api/events`), `src/lib/analytics.js` GTM dataLayer
- Dialogs use `src/lib/useDialog.js` (focus, Escape, Tab trap, focus return); admin confirmations use `components/admin/ConfirmAction.jsx`
- Tests: `tests/e2e/customer.js`, `tests/tracking/journeys.js` (Playwright against `tests/e2e/local_backend.py`, the real backend on an in-memory DB)

### Backend — `backend/`
- FastAPI + Motor (MongoDB Atlas), all routes under `/api`; 23 routers in `routes/`
- `server.py` lifespan: indexes, version-gated seeds/migrations, six background loops (push, renewals, orphan payments, plan expiry, automations, nightly review)
- Middleware order: `CatchErrors` (inside CORS, `error_log.py`) → CORS → `AdminActionLog` (`audit_log.py`)
- Auth: JWT (python-jose), bcrypt; `ENVIRONMENT=production` is the **only** production test; role read from DB per request
- Pricing is server-authoritative (`routes/orders.py` `price_with_coupon`); Stripe intents verified on status, purpose and exact pence; one intent per order/plan (unique sparse indexes)
- Messaging: `notifications.py` (Resend with Idempotency-Key, Twilio), `whatsapp.py`, `automations.py` (consent-based audience, pause-all), `routes/comms.py`
- AI: `ai_ops.py` (Opus nightly investigator, aggregates only, 40 calls / $5 a month) and menu auto-fill (Haiku) — both under `ai_ops.allowed()`
- Tests: `backend/tests/` (pytest, mongomock_motor; `conftest.py` fakes Stripe and providers, keeps the kitchen "open" and Dabba selling by default)

---

## Environment Variables (Render)

`MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ENVIRONMENT=production`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_ALERT_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_WHATSAPP_FROM`, `FIREBASE_SERVICE_ACCOUNT_JSON` (set **before** the Stripe key), `GOOGLE_CLIENT_ID`, `ANTHROPIC_API_KEY`, `RESEND_WEBHOOK_SECRET`, `MOBILE_API_KEY`. Vercel: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, Firebase/Google public keys.

**CORS is hardcoded** in `backend/server.py` (`ALLOWED_ORIGINS`). Do not add a `CORS_ORIGINS` env var on Render — it broke logins before.

Admin › Overview › "Is everything working?" shows which keys the server can see and the launch list.

---

## Rules That Came From Audits
- Never write a status word (VERIFIED, COMPLETE, "every N minutes") without observing it; cite the observation.
- Audits are read-only until the owner asks for a fix pass; record findings under a new audit ID in `docs/ops/audits/`.
- Marketing goes only to people who ticked the consent box or joined the newsletter; review requests go by email only.
- Any customer-authored text in structured data goes through `jsonLd()`.
- Material business rules (prices, refunds, plan terms, policy wording, data deletion, big campaigns) are the owner's decisions.

## Commit Convention
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Running Locally
```bash
cd backend && pip install -r requirements.txt -r requirements-dev.txt && python -m pytest tests -q
cd ssp-nextjs && npm ci && python tests/e2e/local_backend.py &   # http://127.0.0.1:8765
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8765 npm run build && npx next start -p 3001
node tests/tracking/journeys.js http://localhost:3001 && node tests/e2e/customer.js http://localhost:3001
```
