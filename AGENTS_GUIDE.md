# Sree Svadista Prasada — Copilot Agents Reference Guide

> **How to use this guide:** Every agent is invoked from the VS Code Copilot chat.
> Click the agent selector (top of the chat panel) and pick the agent by name, or type `@agent-name` inline.
> The `/complete` prompt appears when you type `/` in the chat input.

---

## Table of Contents

1. [How Agents Work](#how-agents-work)
2. [⭐ 360 Agent — Your Business Command Centre](#0-360-agent)
2. [Website Agents](#website-agents)
   - [backend](#1-backend)
   - [frontend](#2-frontend)
   - [admin](#3-admin)
   - [menu](#4-menu)
   - [orders](#5-orders)
   - [auth](#6-auth)
   - [enquiries](#7-enquiries)
   - [architecture](#8-architecture)
   - [workflows](#9-workflows)
   - [security](#10-security)
   - [business-logic](#11-business-logic)
   - [deployment](#12-deployment)
   - [testing](#13-testing)
3. [Mobile Agents](#mobile-agents)
   - [mobile](#14-mobile)
   - [mobile-auth](#15-mobile-auth)
   - [mobile-home](#16-mobile-home)
   - [mobile-menu](#17-mobile-menu)
   - [mobile-cart-orders](#18-mobile-cart-orders)
   - [mobile-profile](#19-mobile-profile)
   - [mobile-workflows](#20-mobile-workflows)
4. [Prompt: /complete](#21-complete-prompt)
5. [Always-on: copilot-instructions.md](#22-copilot-instructionsmd)
6. [Quick Decision Guide](#quick-decision-guide)

---

## How Agents Work

| Concept | Explanation |
|---------|-------------|
| **Agent** | A Copilot persona with specific knowledge and tool restrictions. Switch using the agent picker or `@name`. |
| **Auto-delegation** | The default agent reads each agent's `description` and may automatically hand off to the right specialist without you needing to switch. |
| **Tools** | Each agent only has the tools it needs. `read`-only agents can't accidentally edit files. |
| **Prompt** | A reusable task template. Type `/` in chat to trigger it. |
| **copilot-instructions.md** | Always-on background context — automatically loaded for every chat request in this workspace. You never invoke it manually. |

---

---

## 0. `360` — Your Business Command Centre

**File:** `.github/agents/360.agent.md`
**Prompt:** `/audit`
**Tools:** read, edit, search, execute

**What it is:**
A single agent that combines 7 roles: **Senior QA Tester + Developer + Growth Marketer + Business Owner + Creative Director + Revenue Optimizer + Security Auditor**. It knows every page, every flow, every API endpoint, every business rule, and every SEO requirement for Sree Svadista Prasada.

**When to use:**
- You want to know "what should I fix next?" — run `audit full`
- Before any major launch or update — run `audit full`
- You suspect a specific page is broken — run `audit page /pagename`
- You want to grow revenue — run `audit revenue`
- You want to improve Google ranking — run `audit seo`
- Something feels wrong in a flow — run `audit flow [name]`
- Anytime, on-demand — it retests everything and gives a prioritised fix list

**Audit commands:**
```
@360 audit full
@360 audit page /checkout
@360 audit flow checkout
@360 audit seo
@360 audit revenue
@360 audit ux
@360 audit security
@360 audit business
@360 quick wins
@360 prioritise
@360 fix [issue name or ID]
```

**Or use the prompt:**
```
/audit
```

**What you get back:**
A structured report with every issue tagged 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 LOW, the exact file and line, the business impact, and the fix. Plus **Top 3 Quick Wins for Revenue** at the end of every report.

---

## Website Agents

---

### 1. `backend`

**File:** `.github/agents/backend.agent.md`
**Tools:** read, edit, search, execute

**What it knows:**
- All 12 FastAPI route files and their API prefixes
- Pydantic model conventions (`backend/models.py`)
- MongoDB Motor async patterns
- Auth dependencies (`get_current_user`, `require_admin`, `get_optional_user`)
- CORS hardcoded origins rule
- All Render environment variables

**When to use:**
- Adding a new API endpoint
- Changing a MongoDB query or schema
- Debugging a 422 validation error or 500 server error
- Adding a new route file and registering it in `server.py`
- Working on `seed.py` or startup logic

**Example prompts:**
```
@backend Add a GET /api/menu/{id}/nutrition endpoint that returns calories and macros
@backend Why is my POST /api/orders returning a 422 error?
@backend Add an index on the orders collection for user_id + created_at
@backend Register the new payments route file in server.py
@backend Add a field "prep_time_minutes" to the menu item model
```

---

### 2. `frontend`

**File:** `.github/agents/frontend.agent.md`
**Tools:** read, edit, search

**What it knows:**
- All React pages and their routes in `App.js`
- Axios instance usage (`frontend/src/api/index.js`)
- `AuthContext` and `CartContext` APIs
- Tailwind CSS + Shadcn UI component patterns
- `ScrollToTop` behaviour
- Menu page themes (Svadista red, Prasada green, Breakfast gold)

**When to use:**
- Building or editing a React page or component
- Wiring up an API call in the web frontend
- Fixing a UI bug on the website
- Adding a new route to `App.js`
- Working with cart or auth state

**Example prompts:**
```
@frontend Add a "Save for Later" button to the cart drawer
@frontend The hero slider is broken on mobile — fix it
@frontend Build a new /offers page that lists discounted items
@frontend Wire up the loyalty points balance to the dashboard overview tab
@frontend Show a toast notification when an item is added to cart
```

---

### 3. `admin`

**File:** `.github/agents/admin.agent.md`
**Tools:** read, edit, search

**What it knows:**
- All 7 admin dashboard tabs and their functionality
- Order status flow (`pending → confirmed → preparing → delivered`)
- Admin menu tab components: `AllergenPicker`, `FaqEditor`, `PairsWithPicker`
- Admin enquiries inbox with conversation threading
- `require_admin` access control pattern
- How `seed.py` creates the admin user on startup

**When to use:**
- Adding a new tab or feature to the admin dashboard
- Changing how orders are displayed or actioned
- Modifying the menu edit/add form
- Fixing the admin enquiries inbox
- Adding admin-only API routes

**Example prompts:**
```
@admin Add a "Daily Specials" tab to the admin dashboard
@admin Show total revenue in the Overview tab stats cards
@admin The order status action buttons aren't updating the UI — fix it
@admin Add a "bulk hide" button to the menu tab to hide multiple items at once
@admin Add an export CSV button to the orders tab
```

---

### 4. `menu`

**File:** `.github/agents/menu.agent.md`
**Tools:** read, edit, search

**What it knows:**
- Full menu item data model (all fields including `allergens`, `pairs_with`, `faqs`, `featured`)
- All menu API endpoints (CRUD, AI enhance, reviews, likes)
- `GET /api/menu` query param conventions (`available`, `featured`, `category`)
- `ItemDetail` page (`/item/:itemId`) — reviews, combos, FAQs, star distribution
- Seed data in `seed.py`
- AI auto-fill via Claude Haiku

**When to use:**
- Adding or changing menu item fields
- Fixing the item detail page
- Working on reviews or likes
- Updating the "Goes Best With" combo section
- Changing how featured items are selected
- Working on the AI menu auto-fill feature

**Example prompts:**
```
@menu Add a "contains_onion_garlic" boolean field to menu items
@menu The item detail page isn't loading reviews — fix it
@menu Add a "Most Ordered" section below the trending carousel on the homepage
@menu Why isn't the AI auto-fill button working in the admin menu tab?
@menu Add a video_url field to menu items and display it on the item detail page
```

---

### 5. `orders`

**File:** `.github/agents/orders.agent.md`
**Tools:** read, edit, search

**What it knows:**
- Order data model and status transitions
- `POST /api/orders`, `PATCH /api/orders/{id}/status`, cancel endpoint
- Subscriptions (Dabba Wala) — 4-step wizard, plan structure
- `CartContext` API (`addToCart`, `removeFromCart`, `clearCart`)
- Delivery area check (`GET /api/delivery/check?postcode=...`)
- Customer dashboard orders tab with 4-step progress tracker

**When to use:**
- Changing order fields or the checkout flow
- Adding order filtering or sorting
- Modifying the Dabba Wala subscription wizard
- Fixing the customer dashboard orders tab
- Working on delivery area validation

**Example prompts:**
```
@orders Add an "estimated delivery time" field to orders
@orders The cancel button is showing for delivered orders — fix it
@orders Add a reorder button that re-adds items from a past order to the cart
@orders Show a delivery ETA on the 4-step progress tracker
@orders Add a minimum order value check (£12) before checkout
```

---

### 6. `auth`

**File:** `.github/agents/auth.agent.md`
**Tools:** read, edit, search

**What it knows:**
- JWT implementation details (HS256, 7-day expiry, `ssp_token` key)
- `create_access_token`, `get_current_user`, `require_admin`, `get_optional_user`
- bcrypt password hashing via passlib
- `AuthContext` — `user`, `login`, `logout`, `authOpen`, `setAuthOpen`
- `<AuthModal>` component
- Admin seeding via `seed.py` + `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars

**When to use:**
- Changing login or registration logic
- Adding a new user field
- Fixing auth-related errors (401, 403)
- Implementing a "forgot password" flow
- Working on protected routes

**Example prompts:**
```
@auth Add a phone number field to the registration form
@auth Users are getting logged out too quickly — extend the JWT expiry to 30 days
@auth Add a "change password" option to the customer dashboard account tab
@auth The admin panel is accessible without login — fix the frontend route guard
@auth Add Google OAuth login
```

---

### 7. `enquiries`

**File:** `.github/agents/enquiries.agent.md`
**Tools:** read, edit, search

**What it knows:**
- All enquiry types (contact, catering, newsletter)
- Conversation threading — `enquiry_messages` collection, polling every 6-8s
- Notification creation and unread badge logic
- Admin inbox UI and customer dashboard enquiries tab
- `POST /api/enquiries`, message threading endpoints
- Contact/Catering form field structure

**When to use:**
- Changing the contact or catering form
- Fixing the conversation thread or reply functionality
- Working on unread notification badges
- Adding a new enquiry type
- Debugging polling issues

**Example prompts:**
```
@enquiries Add a "callback requested" checkbox to the contact form
@enquiries The unread badge count on the dashboard isn't updating — fix it
@enquiries Add email notification when admin replies to an enquiry
@enquiries The conversation thread isn't loading messages — debug it
@enquiries Add a "WhatsApp" enquiry type
```

---

### 8. `architecture`

**File:** `.github/agents/architecture.agent.md`
**Tools:** read, search *(read-only — no editing)*

**What it knows:**
- Full system layer diagram (Browser → React → Axios → FastAPI → Motor → MongoDB)
- All 12 registered routers and their prefixes
- All 11 MongoDB collections and which module owns each
- Backend startup sequence (lifespan order)
- Request lifecycle (CORS → auth → handler → Motor → Pydantic)
- Where new code belongs (page, route, model, component)

**When to use:**
- Deciding where a new feature should live
- Understanding how layers connect
- Debugging a request that isn't reaching the backend
- Planning a new feature before writing code
- Understanding why something is structured a certain way

**Example prompts:**
```
@architecture Where should I add a discount code feature — what files would it touch?
@architecture Explain how a request flows from the React app to MongoDB and back
@architecture Which collection stores loyalty points transactions?
@architecture I want to add a "favourites" feature — what's the right architecture?
@architecture Why does the startup sequence run migrate_slugs() on every cold start?
```

---

### 9. `workflows`

**File:** `.github/agents/workflows.agent.md`
**Tools:** read, edit, search

**What it knows:**
- Full checkout flow (cart → postcode check → login gate → place order)
- Subscription wizard steps
- Admin order processing pipeline
- Enquiry conversation flow end-to-end
- Loyalty points earn/redeem flow
- Daily specials flow
- Review submission flow

**When to use:**
- Implementing a multi-step user journey
- Debugging a flow that breaks partway through
- Understanding how two features interact
- Adding a step to an existing flow (e.g. email confirmation after order)

**Example prompts:**
```
@workflows The checkout flow breaks after the postcode check — trace what's happening
@workflows Add an email confirmation step after a successful order
@workflows How does a customer reply reach the admin inbox?
@workflows Add a loyalty points summary step before the final order confirmation
@workflows Walk me through what happens when a customer cancels an order
```

---

### 10. `security`

**File:** `.github/agents/security.agent.md`
**Tools:** read, edit, search

**What it knows:**
- JWT security details (HS256, auto_error=False, 7-day expiry)
- OWASP Top 10 mitigations specific to this project
- CORS allowlist — why `allow_origins=["*"]` + `allow_credentials=True` is invalid
- Auth dependency matrix (when to use which dependency)
- Security checklist for new endpoints
- bcrypt timing-safe comparison
- Frontend JWT-in-localStorage tradeoffs

**When to use:**
- Code review for security vulnerabilities
- Adding a new endpoint and checking access control
- Hardening the JWT implementation
- Any change touching CORS, auth, or user data

**Example prompts:**
```
@security Review this new endpoint — is the access control correct?
@security Is it safe to store the order total in the request body, or should it be calculated server-side?
@security Add rate limiting to the login endpoint
@security The password reset link should expire after 1 hour — how to implement?
@security Review the CORS config before I add a new Vercel preview URL
```

---

### 11. `business-logic`

**File:** `.github/agents/business-logic.agent.md`
**Tools:** read, edit, search

**What it knows:**
- Dual brand identity: Svadista (non-veg, earthy red) vs Prasada (pure veg, green)
- Delivery locations: Milton Keynes (main), Edinburgh, Glasgow
- Menu categories and which page each belongs to
- Allergen list and display conventions
- Dabba Wala plan options (duration, box type, preferences)
- Order lifecycle business rules (cancel window, status flow, price snapshot)
- Loyalty points tiers
- Review rules (one per user per item)

**When to use:**
- Implementing any restaurant domain rule
- Deciding if a category goes on Svadista or Prasada page
- Setting allergen handling logic
- Pricing, discount, or loyalty calculation questions
- Delivery area rules

**Example prompts:**
```
@business-logic Should the "Pesarattu" dish appear on the Prasada or Breakfast page?
@business-logic What discount should a 5% combo deal calculate to on a £12 + £8 order?
@business-logic Add a "no onion/garlic" filter for the Prasada menu
@business-logic How long should a Dabba Wala subscription stay active after the end date?
@business-logic The menu has items without allergen tags — add a validation that warns admins
```

---

### 12. `deployment`

**File:** `.github/agents/deployment.agent.md`
**Tools:** read, edit, search

**What it knows:**
- Render (backend) and Vercel (frontend + Next.js) deployment config
- `render.yaml` structure and `$PORT` injection
- Full env var table for Render dashboard
- Backend startup sequence and cold start behaviour (~30s on free tier)
- How to add a new CORS origin when adding a new Vercel URL
- Common production issues and their fixes (CORS errors, 401s, cold start, AI auto-fill 400)
- Next.js SEO site deployment (`ssp-nextjs/`)

**When to use:**
- Deploying to production
- Fixing a production-only bug
- Adding a new environment variable
- Adding a new Vercel preview domain to CORS
- Debugging cold start or wakeup issues
- Updating `render.yaml`

**Example prompts:**
```
@deployment Add the new Vercel preview URL to the CORS allowlist
@deployment Why is the login working locally but broken in production?
@deployment Add ANTHROPIC_API_KEY to the Render environment configuration
@deployment The backend isn't waking up fast enough — what are my options?
@deployment How do I add a custom domain to the frontend Vercel project?
```

---

### 13. `testing`

**File:** `.github/agents/testing.agent.md`
**Tools:** read, edit, search, execute

**What it knows:**
- Backend testing with pytest + FastAPI `TestClient`
- `conftest.py` fixture patterns for auth and admin headers
- Critical endpoints to test with expected assertions
- Security test cases (403, 401, no password_hash in responses)
- Frontend testing with React Testing Library
- Test report format (`test_reports/iteration_*.json`)
- Smoke test checklist for after-deployment verification

**When to use:**
- Writing new tests for a feature
- Running the test suite
- Debugging a failing test
- Adding a smoke test after deployment
- Checking test coverage for a module

**Example prompts:**
```
@testing Write pytest tests for the POST /api/orders endpoint
@testing The test for admin access control is failing — debug it
@testing Add a test that confirms password_hash is never returned in any response
@testing Write a React Testing Library test for the CartContext addToCart function
@testing Generate a smoke test checklist for the new loyalty points feature
```

---

## Mobile Agents

---

### 14. `mobile`

**File:** `.github/agents/mobile.agent.md`
**Tools:** read, edit, search

**What it knows:**
- Full Expo + React Native stack (versions, all key packages)
- Complete screen map (every screen and its file path)
- Theme system: `COLORS`, `FONTS`, `SPACING`, `RADIUS`, `SHADOW` from `constants/theme.js`
- `StyleSheet` patterns (no Tailwind in mobile)
- Fonts: PlayfairDisplay (headings) + Inter (body), loaded in `App.js`
- All shared components: `DishCard`, `CartBar`, `AllergenBadge`, `VegDot`, `SpiceFlames`, `ScreenHeader`, `EmptyState`, `LoadingScreen`
- Key differences from the web frontend

**When to use:**
- General mobile development (not specific to one screen area)
- Adding a new shared component
- Changing the theme (colours, fonts, spacing)
- Running the app locally
- Understanding the overall mobile structure

**Example prompts:**
```
@mobile Add a new COLORS.saffron = '#FF9933' to the theme constants
@mobile Create a new shared StarRating component for the item detail screen
@mobile How do I run the app on an Android emulator?
@mobile Add expo-blur to the package.json and use it in the cart drawer
@mobile The app crashes on first launch — what's the likely cause?
```

---

### 15. `mobile-auth`

**File:** `.github/agents/mobile-auth.agent.md`
**Tools:** read, edit, search

**What it knows:**
- `expo-secure-store` vs `localStorage` difference
- `AuthContext` full API: `user`, `isGuest`, `login`, `register`, `logout`, `continueAsGuest`, `loadUser`
- Onboarding sequence: Splash → Onboarding → Postcode → Login/Register
- Guest mode implementation (AsyncStorage `ssp_guest` flag)
- Axios interceptor for token attachment and 401 auto-clear
- Backend wakeup ping (must not be removed)
- `RootNavigator` — how auth state drives the navigation tree
- Register endpoint difference: `/auth/register/simple` (not `/auth/register`)

**When to use:**
- Changing login or registration screens
- Modifying the onboarding flow
- Working with guest mode
- Fixing token storage or 401 handling
- Adding biometric auth or "remember me"

**Example prompts:**
```
@mobile-auth Add a "Forgot Password" button to the login screen
@mobile-auth The app isn't staying logged in after closing — fix the SecureStore logic
@mobile-auth Add a "Skip" button to the onboarding screen that goes straight to PostcodeScreen
@mobile-auth Why does the app show a flash of the auth screens after login?
@mobile-auth Add Face ID / biometric login option
```

---

### 16. `mobile-home`

**File:** `.github/agents/mobile-home.agent.md`
**Tools:** read, edit, search

**What it knows:**
- `HomeScreen.jsx` full structure — all 8 sections it renders
- Hero banners: static array in the file, image URLs, navigation targets
- Category shortcuts: static array, navigation targets
- API calls: daily specials, trending, subscription status, postcode from AsyncStorage
- `BANNER_W` sizing using `Dimensions.get('window')`
- `LinearGradient`, `Animated`, `RefreshControl` usage
- Where postcode is stored (`AsyncStorage` key `ssp_postcode`)

**When to use:**
- Changing home screen sections (banners, categories, carousels)
- Adding a new promotional section
- Fixing home screen data loading
- Changing banner images or copy
- Adding pull-to-refresh behaviour

**Example prompts:**
```
@mobile-home Change the second banner to promote the Prasada menu instead of Dabba Wala
@mobile-home Add a "Today's Special" section above the trending carousel
@mobile-home The trending items aren't loading — debug the API call
@mobile-home Add a "Recently Viewed" section below the category shortcuts
@mobile-home The home screen is slow to load — add a skeleton loader
```

---

### 17. `mobile-menu`

**File:** `.github/agents/mobile-menu.agent.md`
**Tools:** read, edit, search

**What it knows:**
- `MenuScreen` — two hero cards + small/micro menu grid
- `CategoryScreen` — route params `{ category, title }`, `GET /api/menu?category=X&available=true`
- `ItemDetailScreen` — parallel data loading, all sections (image, details, combo, reviews, FAQs)
- `CATEGORY_FAQS` and `GENERAL_FAQS` hardcoded in `ItemDetailScreen.jsx`
- All menu components: `DishCard`, `AllergenBadge`, `VegDot`, `SpiceFlames`
- `addToCart` item shape required by `CartContext`
- Review submission flow (one per user per item)
- Gradient colours for each brand card

**When to use:**
- Changing how menu items are displayed
- Adding a new section to the item detail screen
- Modifying menu card styles
- Fixing the "Goes Best With" combo strip
- Adding or editing category FAQs
- Working on reviews on mobile

**Example prompts:**
```
@mobile-menu Add a "Sold Out" badge to unavailable items in CategoryScreen
@mobile-menu The item detail screen shows the wrong FAQs for Breakfast items — fix it
@mobile-menu Add a video player section to ItemDetailScreen when item.video_url exists
@mobile-menu Change the Prasada hero card colour to a deeper forest green
@mobile-menu Add calorie count below the price on DishCard
```

---

### 18. `mobile-cart-orders`

**File:** `.github/agents/mobile-cart-orders.agent.md`
**Tools:** read, edit, search

**What it knows:**
- `CartContext` full API (including `removeItemCompletely`, `clearCart`, `cartTotal`)
- `CartScreen` — `Swipeable` swipe-to-delete, stepper `+`/`−`, line totals
- `CheckoutScreen` — postcode pre-fill from AsyncStorage, delivery validation, `POST /api/orders`
- `OrderConfirmedScreen` — `navigation.replace` pattern
- `OrdersScreen` — `useFocusEffect`, vertical timeline, status pills, cancel button
- Order status colours and labels
- `CartBar` component placement rules
- Full cart → order flow

**When to use:**
- Changing cart behaviour (swipe, quantities, totals)
- Modifying the checkout form
- Fixing the order confirmed or order tracking screen
- Adding new fields to the order (e.g. coupon code)
- Changing order status colours or timeline

**Example prompts:**
```
@mobile-cart-orders Add a promo code field to the checkout screen
@mobile-cart-orders The swipe-to-delete on CartScreen isn't working on Android — fix it
@mobile-cart-orders Show estimated delivery time on the order tracking timeline
@mobile-cart-orders Add a "Reorder" button to past orders in OrdersScreen
@mobile-cart-orders The cart total isn't updating when I remove items — debug CartContext
```

---

### 19. `mobile-profile`

**File:** `.github/agents/mobile-profile.agent.md`
**Tools:** read, edit, search

**What it knows:**
- `ProfileScreen` hub — `MenuRow` component, loyalty display, unread enquiry badge
- Guest mode UI on ProfileScreen
- All 10 sub-screens and their API calls
- `EditProfileScreen` — `PUT /api/auth/me`, `loadUser()` refresh
- `DabbaWalaScreen` — 4-step wizard + cancel subscription
- `EnquiriesScreen` — polling, thread view, reply
- `ContactScreen` / `CateringScreen` — form fields, endpoints
- Static screens: About, FAQ, Gallery, DeliveryAreas
- `ScreenHeader` component usage
- Unread badge: client-side filter on `has_unread_admin_reply`

**When to use:**
- Changing the profile menu options
- Adding a new sub-screen to the You tab
- Fixing the loyalty display or unread badge
- Modifying the enquiry thread on mobile
- Changing the contact or catering form fields
- Working on guest mode behaviour

**Example prompts:**
```
@mobile-profile Add a "Refer a Friend" option to the profile menu
@mobile-profile The unread enquiry badge is always showing 0 — fix it
@mobile-profile Add a profile photo upload option to EditProfileScreen
@mobile-profile The DabbaWala subscription wizard skips step 3 — fix it
@mobile-profile Show the user's loyalty tier (Bronze/Silver/Gold) on the profile header
```

---

### 20. `mobile-workflows`

**File:** `.github/agents/mobile-workflows.agent.md`
**Tools:** read, edit, search

**What it knows:**
- Full navigation tree (RootNavigator → MainNavigator → all tab stacks)
- Complete cart → checkout → order → tracking flow with step-by-step detail
- Profile screen navigation to all sub-screens
- Dabba Wala signup flow
- Enquiry conversation flow with polling
- Loyalty points flow
- Screen navigation patterns: `navigate`, `goBack`, `replace`, cross-tab navigation
- Route params for every screen
- `CartBar` placement rules
- Polling cleanup (`clearInterval` in `useEffect`)

**When to use:**
- Adding a new screen to the navigation tree
- Debugging navigation issues (screen not found, wrong params)
- Implementing a multi-step flow on mobile
- Understanding how screens connect
- Fixing back button behaviour

**Example prompts:**
```
@mobile-workflows Add a new "Loyalty" screen to the You tab stack
@mobile-workflows After placing an order, navigate to the specific order in OrdersScreen
@mobile-workflows The back button on OrderConfirmedScreen is going back to checkout — fix it
@mobile-workflows Add a deep link so push notifications open the right enquiry thread
@mobile-workflows The CartBar isn't showing on CategoryScreen — where should it be placed?
```

---

## 21. `/complete` Prompt

**File:** `.github/prompts/complete.prompt.md`
**Invocation:** Type `/complete` in the Copilot chat, then describe the feature

**What it does:**
A structured prompt that guides the agent through implementing a feature end-to-end:
1. Pydantic models in `backend/models.py`
2. FastAPI route in `backend/routes/`
3. Route registration in `server.py`
4. Frontend API call
5. React UI (page or component)
6. Verification checklist

**When to use:**
- You want a complete feature built from scratch (backend + frontend together)
- You want to ensure nothing is missed (no orphan routes, no unregistered files)

**Example prompts:**
```
/complete loyalty points history page
/complete promo code / discount system
/complete push notification when order status changes
/complete admin bulk-edit menu items
/complete review moderation panel for admins
```

---

## 22. `copilot-instructions.md`

**File:** `.github/copilot-instructions.md`
**Invocation:** Automatic — always active, never invoke manually

**What it provides:**
Background context loaded into every chat request:
- Full tech stack summary
- Build/run commands
- CORS rule (critical — hardcoded origins, no env var)
- Key files table
- Env vars table
- Commit conventions

You never switch to this — it silently informs every response.

---

## Quick Decision Guide

| "I want to..."  | Use |
|----------------|-----|
| **Full site audit — test everything** | `@360 audit full` or `/audit` |
| **SEO audit** | `@360 audit seo` |
| **Revenue audit / conversion** | `@360 audit revenue` |
| **UX audit** | `@360 audit ux` |
| **Security audit** | `@360 audit security` |
| **Audit a specific page** | `@360 audit page /pagename` |
| **Quick wins for revenue** | `@360 quick wins` |
| **Fix a specific issue** | `@360 fix [issue name]` |
| Add a new backend API endpoint | `@backend` |
| Build or fix a web page/component | `@frontend` |
| Change the admin dashboard | `@admin` |
| Work on menu items, reviews, combos | `@menu` |
| Change checkout, orders, subscriptions | `@orders` |
| Fix login, JWT, user roles | `@auth` |
| Fix contact form, enquiry inbox | `@enquiries` |
| Understand how the system works | `@architecture` |
| Implement a multi-step web flow | `@workflows` |
| Review code for security issues | `@security` |
| Apply restaurant business rules | `@business-logic` |
| Deploy or fix a production issue | `@deployment` |
| Write or run tests | `@testing` |
| Build any full feature end-to-end (web) | `/complete` |
| General mobile development | `@mobile` |
| Mobile login, onboarding, guest mode | `@mobile-auth` |
| Mobile home screen | `@mobile-home` |
| Mobile menu browsing + item detail | `@mobile-menu` |
| Mobile cart, checkout, orders | `@mobile-cart-orders` |
| Mobile profile section (You tab) | `@mobile-profile` |
| Mobile navigation or multi-step flows | `@mobile-workflows` |

---

*Last updated: June 2026 — 21 agents (incl. 360) + 2 prompts (/complete, /audit) + 1 always-on instruction file*
