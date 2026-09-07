# Changelog

All changes listed in reverse chronological order. Each entry: `[YYYY-MM-DD] scope: description`.

---

## 2026-08-28 — 360 audit remediation (pre-launch, ssp-nextjs + backend)

Full-site 360 audit (59 findings) run against `frontend/`, `ssp-nextjs/`, `backend/`; fixes applied against `backend/` and the live `ssp-nextjs/` frontend only. Stripe payment unblocking intentionally left untouched (pre-launch hold) — everything else addressed below. `frontend/` (CRA) was left as-is; `ssp-nextjs` is the confirmed-live app.

**Critical — ordering/payment was effectively dead**
- `[2026-08-28]` backend/routes/orders.py, loyalty.py, daily_specials.py — `db.menu` → `db.menu_items` (6 call sites) — the collection name in use since commit `7520bfe` was never written to, so every order/calculate/redeem/live-price call 404'd
- `[2026-08-28]` ssp-nextjs/src/app/checkout/page.jsx — `/orders/calculate` payload fixed to `{menu_item_id, quantity}` (was sending `{price, quantity}`, always 422ing); pricing errors now clear `serverPricing` instead of leaving stale data; `handleOrder` refuses to charge unless server-verified pricing exists (was silently falling back to client-computed total — the "card charged, order not created" failure mode)
- `[2026-08-28]` backend/routes/subscriptions.py — subscription creation now verifies a Stripe PaymentIntent against `PLAN_PRICES` before insert (was completely unauthenticated — free subscriptions could be created via direct API call); added a 5/hr per-IP rate limiter
- `[2026-08-28]` backend/routes/orders.py — loyalty free-item discount now looked up server-side from `menu_items` instead of trusting `payload.loyalty_free_item_original_price` from the client; unauthenticated order creation no longer accepts a client-supplied `user_id` (was letting a guest attribute an order — and someone else's pending reward — to any account)
- `[2026-08-28]` backend/models.py, routes/orders.py — `OrderItem.quantity` and `OrderCalculateItem.quantity` bounded `ge=1, le=50` (was unbounded — negative quantities could reduce the charged total)
- `[2026-08-28]` ssp-nextjs — removed all fabricated ratings/reviews: hardcoded `aggregateRating` (4.8/94) in homepage + Milton Keynes JSON-LD, the auto-incrementing fake review counter (`getLiveReviewCount`) and 30 invented testimonials on Subscriptions, and the 3 fabricated homepage testimonials (Home/HomeClient.jsx) — DMCC Act 2024 / Google structured-data policy exposure on a site with zero real orders yet
- `[2026-08-28]` ssp-nextjs — Edinburgh/Glasgow delivery claims (including inside FAQPage/Restaurant JSON-LD) corrected to "coming soon" across faq, svadista, menu, subscriptions, subscriptions/about, Footer, mockData.js — was contradicting the backend's MK-only delivery area and the /edinburgh, /glasgow pages themselves
- `[2026-08-28]` ssp-nextjs/src/app/menu/MenuClient.jsx — `useState(initialItems)` (was discarding the server-fetched prop with `useState([])`) — the flagship `/menu` page was shipping zero dishes to crawlers

**High**
- `[2026-08-28]` ssp-nextjs/src/components/layout/Header.jsx — "launching soon" notification bar replaced with an order-now message; added "Order Now" CTA to desktop nav and mobile menu (previously no ordering CTA existed in the header at all)
- `[2026-08-28]` ssp-nextjs/src/app/HomeClient.jsx — removed unredeemable `HOME15` / "10% off first order" promo (no coupon field exists anywhere in checkout or the subscription wizard)
- `[2026-08-28]` ssp-nextjs/src/app/[menu]/[subsection]/[slug]/ItemDetailClient.jsx — removed false "Save 5% together" combo pricing claim (items were added at full price regardless)
- `[2026-08-28]` ssp-nextjs/src/components/CartDrawer.jsx — loyalty redemption payload fixed (`item_id` → `free_item_id`, matching backend); failed redemption calls now properly abort instead of silently proceeding
- `[2026-08-28]` backend/routes/delivery.py — `/delivery/check` now shares `orders.py`'s exact MK postcode-district whitelist (was matching any `MK*` prefix, promising delivery the order engine would then refuse)
- `[2026-08-28]` backend/routes/enquiries.py, reviews.py — `notify_admin` added on customer thread replies and on ≤2-star reviews (previously silent)
- `[2026-08-28]` ssp-nextjs/src/app/contact/ContactClient.jsx, Footer.jsx, page.jsx, milton-keynes/page.jsx, data/mockData.js — NAP consistency: address, email domain (`@sreesvadista.co.uk` → `@sreesvadistaprasada.com`), and weekend opening hours (08:00–22:00 vs 10am–11pm conflict) unified across contact page, footer, and structured data
- `[2026-08-28]` ssp-nextjs/src/app/sitemap.ts — fixed 404'ing `/prasada/starters-and-evening-delights` entry (→ `/prasada/bites-starters`); added `/blog`, all 3 blog posts, and the orphaned `/gongura` page
- `[2026-08-28]` ssp-nextjs/src/app/robots.ts — `/admin`, `/dashboard`, `/checkout` disallowed; added noindex `layout.jsx` (+ page titles) for all three since they're client components and couldn't otherwise export `metadata`
- `[2026-08-28]` ssp-nextjs/src/app/checkout/page.jsx, components/CartDrawer.jsx — "Add More Items" modal and loyalty free-item picker now filter through `isOrderable()` (were letting pickles/podis — explicitly soft-launch-gated elsewhere — be added to cart)
- `[2026-08-28]` ssp-nextjs/src/app/dashboard/page.jsx — added "Order Again" reorder button on delivered/cancelled orders (previously no repeat-purchase path existed)
- `[2026-08-28]` ssp-nextjs/src/api/index.ts, context/AuthContext.tsx — added 45s request timeout (Render cold starts) and a 401 interceptor that clears the stale token + logs the user out instead of leaving them silently "signed in" with an empty dashboard

**Medium**
- `[2026-08-28]` ssp-nextjs/src/components/layout/Header.jsx — brand-name `<h1>` in the header changed to `<p>` (was duplicating the page's real `<h1>` on every route)
- `[2026-08-28]` ssp-nextjs/next.config.js — added www→apex redirect; deduplicated all JSON-LD `@id`s onto the apex domain (was split across www/apex, diluting ranking signals)
- `[2026-08-28]` ssp-nextjs/src/app/page.jsx — removed `speakable` JSON-LD block pointing at CSS selectors that don't exist; `hasOfferCatalog` item types corrected (`MenuItem` → `Menu`/`Product`); flagged real `geo` coordinates as a TODO rather than guessing them
- `[2026-08-28]` ssp-nextjs/src/app/subscriptions/page.jsx — `Product` offer price corrected from a stray `£7.00` to `£75.00` (matches the real weekly plan price)
- `[2026-08-28]` ssp-nextjs/src/app/terms/TermsClient.jsx, subscriptions/about/page.jsx, data/mockData.js — Dabba Wala terms rewritten to match the actual backend model (one-time payment per fixed-term plan, no auto-renewal, 48h refund window) — was describing recurring billing that doesn't exist in the code
- `[2026-08-28]` ssp-nextjs/src/app/subscriptions/SubscriptionsClient.jsx — success screen no longer shows "Invalid Date"/"NaN days away" on page reload (plan/box/start-date are now persisted through the reload, not just a bare success flag)
- `[2026-08-28]` ssp-nextjs/src/app/dashboard/page.jsx, admin/page.jsx — fixed ", , " rendering for collection/takeaway orders (delivery address fields were undefined); `o.notes` used instead of the never-set `o.special_instructions`
- `[2026-08-28]` ssp-nextjs/src/components/AuthModal.jsx — fixed `/privacy` 404 link (→ `/privacy-policy`)
- `[2026-08-28]` ssp-nextjs/src/components/CartDrawer.jsx — upsell row now actually uses the previously-unused `COMPLEMENTS`/`scoreComplement` scoring logic (was hardcoding `category=breakfast` for every cart)
- `[2026-08-28]` backend/notifications.py — `send_email`/`send_sms` fire-and-forget tasks now hold a strong reference (were bare `asyncio.create_task` calls, garbage-collectable mid-flight under load)
- `[2026-08-28]` backend/routes/auth.py — rate limit added to `/auth/check-email`, `/auth/check-phone` (were unauthenticated, unlimited user-enumeration endpoints)
- `[2026-08-28]` **New: password reset.** backend/routes/auth.py, models.py, notifications.py — `POST /auth/forgot-password` + `POST /auth/reset-password`, single-use tokens with 1hr expiry, no user-enumeration leak; ssp-nextjs/src/components/AuthModal.jsx — "Forgot password?" flow; new `ssp-nextjs/src/app/reset-password/` page. Previously no password-reset path existed at all.
- `[2026-08-28]` ssp-nextjs/src/app/admin/page.jsx — orders/subscriptions/enquiries now poll every 30s; status-update failures surface the backend's actual error instead of failing silently
- `[2026-08-28]` ssp-nextjs/src/app/dashboard/page.jsx — the 6 parallel dashboard fetches switched from `Promise.all` to `Promise.allSettled` (one failing call no longer blanks out data the others fetched successfully); added a 20s poll and a retry UI for total failure
- `[2026-08-28]` ssp-nextjs/src/components/dashboard/EnquiriesTab.jsx — a failed thread fetch now shows a real error instead of "No replies yet"
- `[2026-08-28]` **New: Google review CTA.** backend/notifications.py (delivered-order email), ssp-nextjs/src/app/dashboard/page.jsx (delivered orders) — no review ask existed anywhere pre-fix; using a Maps-search fallback link pending a real Google Business Profile Place ID
- `[2026-08-28]` backend/notifications.py, routes/admin_dabba_wala.py — fixed dead `/dabbawala` links in renewal/expiry emails (→ `/subscriptions`)
- `[2026-08-28]` ssp-nextjs/src/lib/analytics.js, checkout/page.jsx — `trackPurchase` now reports the actual charged total (was `subtotal + deliveryFee`, ignoring discounts and the small-order fee); wired up the previously-defined-but-never-called `trackEnquirySubmit` (contact, catering forms) and `trackMenuCategoryView` (all 7 menu category pages)
- `[2026-08-28]` ssp-nextjs/src/data/mockData.js — added missing FAQ entries for dosa, idli, vada, tiffin, podi, naivedyam, biryani, and nut-free allergen info (feeds both the FAQ page and its FAQPage schema)
- `[2026-08-28]` ssp-nextjs/src/components/layout/Footer.jsx — hardcoded `© 2026` replaced with `new Date().getFullYear()`; phone link `pointer-events-none` on desktop removed; footer nav expanded to include Breakfast, Street Food, Ragi Specials, Drinks, Blog (previously unlinked)
- `[2026-08-28]` ssp-nextjs/src/app/blog/page.jsx — linked the orphaned `/gongura` page from the blog index (was reachable only via sitemap, zero inbound links)

Not done this pass (flagged, not silently skipped): Stripe key rename in checkout/subscriptions (pre-launch hold, by request); Firebase hard-dependency on web registration; owned imagery/favicon (needs real assets); blog post depth; abandoned-cart recovery; merging the two parallel review systems; the `frontend/` (CRA) vs `ssp-nextjs` duplication — recommend deleting the CRA app now that `ssp-nextjs` is confirmed live.

---

## 2026-07-08 — commit `f499117`

- `[2026-07-08]` audit: completed full cart→payment→tracking→admin audit (67 findings) — commit `f499117`
- `[2026-07-08]` backend/models.py — C1: `delivery_address` made `Optional[Address] = None` in `OrderCreate` (takeaway orders no longer 422)
- `[2026-07-08]` backend/routes/orders.py — C7: added `ALLOWED_TRANSITIONS` guard in `update_order_status`; returns 400 on invalid status jump
- `[2026-07-08]` backend/routes/orders.py — H10: `stripe.PaymentIntent.retrieve` wrapped in `asyncio.run_in_executor` (was blocking event loop)
- `[2026-07-08]` backend/routes/orders.py — M5: added `loyalty_credited` idempotency flag before calling `_update_loyalty_on_completion`
- `[2026-07-08]` backend/routes/orders.py — H7/H13: `create_notification` called for all 5 status transitions (confirmed/preparing/out_for_delivery/delivered/cancelled)
- `[2026-07-08]` backend/routes/orders.py — H8: `cancel_order` now sends email + SMS + in-app notification to customer
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — C2: free item included in `/calculate` items array
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — C3/H1: `smallOrderFee` (£1.50) computed and shown as line item in `OrderSummary`
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — C4: `capturedPI` recovery message shown if card charged but order DB write fails
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — C5: `BrowseModal` now receives `freeOver={zoneFreeOver}` prop (was using undefined `FREE_DELIVERY_THRESHOLD`)
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — C8: separate `billingPostcode` state; used in Stripe `billing_details`
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — H2: non-deliverable postcode sets `notDeliverable` flag + `pcError` banner; `handleOrder` blocks submission
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — H3: email regex validation before order submission
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — M1/L5: minimum order and delivery-fee threshold use `cartTotal` (not `effectiveSubtotal`)
- `[2026-07-08]` frontend/src/pages/Admin.jsx — H11: `out_for_delivery` added to filter statuses array
- `[2026-07-08]` frontend/src/pages/Admin.jsx — H15: `STATUS_LABELS` map added; Badge shows "Out for Delivery" not raw underscore string
- `[2026-07-08]` frontend/src/pages/Admin.jsx — L2: `out_for_delivery` badge colour changed to purple (distinct from preparing's blue)
- `[2026-07-08]` frontend/src/pages/Admin.jsx — H12: status update catch now `alert()`s error detail instead of swallowing silently
- `[2026-07-08]` frontend/src/pages/Admin.jsx — H14: 60s `setInterval` auto-refresh on Orders tab with cleanup
- `[2026-07-08]` frontend/src/pages/Admin.jsx — L8: `handleFilter` clears `expandedId` when switching filter
- `[2026-07-08]` frontend/src/pages/Admin.jsx — L1: order ID display changed to `slice(0, 8)` (was `slice(-6)`)
- `[2026-07-08]` frontend/src/pages/Admin.jsx — M6: `(o.delivery_fee ?? 0).toFixed(2)` — null-safe (was showing "£undefined")
- `[2026-07-08]` frontend/src/pages/Admin.jsx — C6: `o.notes` used in expanded order view (was `o.special_instructions`, wrong field name)

---

## 2026-07-08 — commit `7520bfe` — *audit round 2: 16 fixes*

- `[2026-07-08]` backend/routes/orders.py — CRITICAL: `/calculate` now looks up prices from DB by `menu_item_id`; client-supplied prices rejected — eliminates PI amount mismatch / chargeback risk
- `[2026-07-08]` backend/routes/orders.py — CRITICAL: postcode zone check in Checkout switched from `/delivery/check` to `/orders/check-postcode` (zone-aware fee — prevents Zone 4 chargeback)
- `[2026-07-08]` backend/routes/orders.py — admin orders `.to_list(200)` raised to `.to_list(1000)` (silent data loss after 200th order)
- `[2026-07-08]` backend/routes/orders.py — `OrderCalculateRequest` Pydantic model added (replaces raw `body: dict` on `/calculate`)
- `[2026-07-08]` backend/routes/loyalty.py — `LoyaltyRedeemRequest` Pydantic model replaces `body: dict`; `free_item_id` validated at FastAPI layer
- `[2026-07-08]` backend/routes/enquiries.py — rate limit added to newsletter POST (5/hr per IP, same as contact/catering)
- `[2026-07-08]` frontend/vercel.json — `Strict-Transport-Security` header added (max-age=2yr, includeSubDomains, preload)
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — `/calculate` payload changed to `{ menu_item_id, quantity }` (matches new server-side lookup)
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — postcode zone useEffect now calls `/orders/check-postcode`; reads `deliverable`/`delivery_fee`/`free_delivery_over`
- `[2026-07-08]` frontend/src/pages/Checkout.jsx — guest success screen: WhatsApp tracking link + "Create free account" nudge added
- `[2026-07-08]` frontend/src/pages/ItemDetail.jsx — Product + AggregateRating JSON-LD added (Google rich results for dish searches)
- `[2026-07-08]` frontend/src/App.js — `/snacks` removed from `MENU_PATHS` so TakeawayNudge doesn't show on postal delivery page
- `[2026-07-08]` frontend/src/api/index.js — duplicate health-check ping at module init removed (BackendWarmup in App.js already fires it)
- `[2026-07-08]` frontend/src/components/AuthModal.jsx — `useRef` inside `.map()` (hooks-rules violation) fixed; replaced with 6 explicit refs
- `[2026-07-08]` frontend/src/pages/Home.jsx — removed hardcoded Pulihora `chefSpecialId`; chef's special always links `/prasada`
- `[2026-07-08]` All 11 pages (Svadista, Prasada, Breakfast, Snacks, StreetFood, Drinks, RagiSpecials, Catering, OurStory, Gallery, FAQ) — unique `og:image` + `twitter:image` per page
- `[2026-07-08]` frontend/src/pages/Contact.jsx — email addresses corrected to `@sreesvadistaprasada.com`; `<link rel=canonical>` added
- `[2026-07-08]` frontend/public/index.html — JSON-LD email corrected to `info@sreesvadistaprasada.com` (NAP consistency)

---

## 2026-07-04 — commit `bf3f409` — *perf/seo: responsive srcSet + hero image alt texts*

- `[2026-07-04]` frontend/src/pages/Catering.jsx — responsive `srcSet` on hero image + keyword-rich alt text
- `[2026-07-04]` frontend/src/pages/Subscriptions.jsx — responsive `srcSet` on hero image + alt text
- `[2026-07-04]` All 8 menu pages (Svadista, Prasada, Breakfast, Snacks, StreetFood, Drinks, RagiSpecials, Menu) — responsive `srcSet` + keyword-rich alt text on hero images

---

## 2026-06-22 — commit `4676b39` — *full site audit: 34 fixes across SEO, security, UX & critical bugs*

- `[2026-06-22]` frontend/src/components/CartDrawer.jsx — CRITICAL: fixed `DELIVERY_FEE undefined` crash on delivery orders (use `deliveryFeeDisplay`)
- `[2026-06-22]` frontend/src/pages/Catering.jsx — CRITICAL: `guest_count` validated before submit (prevented NaN → 422 error)
- `[2026-06-22]` frontend/src/App.js — blank `<Suspense>` fallback replaced with branded maroon spinner
- `[2026-06-22]` frontend/src/data/mockData.js + Header + Footer + Home + Snacks — Edinburgh & Glasgow removed (Milton Keynes only delivery)
- `[2026-06-22]` backend/routes/auth.py — Firebase guard raises HTTP 503 in production if `FIREBASE_SERVICE_ACCOUNT_JSON` not set
- `[2026-06-22]` backend/models.py — `max_length` + `Field` validators on `ContactMessageCreate` and `CateringEnquiryCreate` (MongoDB DoS prevention)
- `[2026-06-22]` backend/routes/enquiries.py — in-memory rate limiter: 5/hr per IP on `/contact` and `/catering`
- `[2026-06-22]` backend/routes/payments.py — in-memory rate limiter: 10 PaymentIntents/minute per IP; `idempotency_key` on `stripe.PaymentIntent.create`
- `[2026-06-22]` backend/routes/orders.py — `/calculate` body replaced with `OrderCalculateRequest` Pydantic model (no raw `body: dict`)
- `[2026-06-22]` backend/seed.py — unique sparse index on `orders.payment_intent_id` (prevents duplicate orders)
- `[2026-06-22]` backend/seed.py — `apply_seo_h1_june_2026()` added: sets `seo_h1` on 50 featured dish pages
- `[2026-06-22]` frontend/vercel.json — security headers added: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `X-XSS-Protection`, `Permissions-Policy`, `Content-Security-Policy`
- `[2026-06-22]` frontend/src/pages/ItemDetail.jsx — `item.seo_h1` used as H1 when set (instead of bare `item.name`)
- `[2026-06-22]` frontend/src/pages/Home.jsx — postcode result for `snacks_only` zone now shows "Browse Snacks & Pickles" CTA
- `[2026-06-22]` frontend/src/pages/FAQ.jsx — FAQPage JSON-LD added (Google featured snippets)
- `[2026-06-22]` frontend/src/pages/Gallery.jsx — canonical, `og:url`, `og:image`, Twitter tags added
- `[2026-06-22]` frontend/src/pages/PrivacyPolicy.jsx — canonical tag added
- `[2026-06-22]` frontend/src/pages/TermsAndServices.jsx — canonical tag added
- `[2026-06-22]` frontend/src/pages/menu/Prasada.jsx — H1 updated to keyword-rich "Restaurant Quality Food in Milton Keynes"
- `[2026-06-22]` 8 menu pages — BreadcrumbList JSON-LD added
- `[2026-06-22]` frontend/public/sitemap.xml — `<lastmod>2026-06-22</lastmod>` added to all 17 URLs
- `[2026-06-22]` frontend/src/components/HeroSlider.jsx — height changed from `min(80vh,700px)` to `min(60vh,700px)` (hero no longer covers CTA on mobile)
- `[2026-06-22]` frontend/src/pages/Checkout.jsx — cart quantity `+/-` buttons enlarged from `w-7 h-7` to `w-9 h-9` (44px touch target)
- `[2026-06-22]` menu/StreetFood.jsx + menu/RagiSpecials.jsx — `menuCache` added (no duplicate API calls)

---

## 2026-06-22 — commit `64d5c37` — *fix: replace old Vercel URL with production domain sitewide*

- `[2026-06-22]` All files — `sreesvadistaprasada.vercel.app` replaced with `sreesvadistaprasada.com` sitewide

---

## 2026-06-18 — commit `4b21f30` — *deep copy + voice + visual overhaul: 53 changes across 22 files*

- `[2026-06-18]` CRITICAL: 5 menu pages fixed (Drinks, RagiSpecials, Breakfast, StreetFood, Snacks) — missing imports caused blank pages
- `[2026-06-18]` frontend/src/components/HeroSlider.jsx — auto-advance interval 3500ms → 5500ms
- `[2026-06-18]` frontend/src/components/layout/Header.jsx — transparent over homepage hero; transitions to solid on scroll; cart badge colour changed to maroon for WCAG contrast
- `[2026-06-18]` frontend/src/components/layout/Header.jsx — "Hot, Sweet & Pickles" → "Snacks & Pickles"
- `[2026-06-18]` frontend/src/components/layout/Footer.jsx — tagline rewritten; "Quick Links" → "Explore"; "Get in Touch" → "Come Find Us"
- `[2026-06-18]` frontend/src/pages/Home.jsx — SEO subtitle + loyalty banner rewritten; `useScrollReveal` applied
- `[2026-06-18]` frontend/src/pages/OurStory.jsx — "The Beginning" → "Born from Longing"; Meaning of Our Name upgraded to gold-bordered cards with Telugu script
- `[2026-06-18]` frontend/src/pages/Gallery.jsx — H1 "Gallery" → "The Kitchens. The Food. The Love."; lightbox prev/next navigation + counter added
- `[2026-06-18]` frontend/src/pages/FAQ.jsx — subtitle + CTA subtext rewritten; open items get elevated border+shadow
- `[2026-06-18]` frontend/src/pages/Catering.jsx — hero subtitle, submit CTA, call CTA heading+subtext rewritten
- `[2026-06-18]` frontend/src/pages/Subscriptions.jsx — plan name + step 6 label + wizard intro block rewritten
- `[2026-06-18]` frontend/src/pages/menu/Svadista.jsx — hero subtitle rewritten; `SECTION_MESSAGES` added for all 6 tabs; SpiceBar rewritten from emoji to SVG flame icon
- `[2026-06-18]` frontend/src/pages/menu/Prasada.jsx — both hero subtitles rewritten
- `[2026-06-18]` frontend/src/pages/menu/Breakfast.jsx — hero subtitles + `SECTION_MESSAGES` for 3 tabs
- `[2026-06-18]` frontend/src/pages/menu/StreetFood.jsx — "Fast Food" → "Street Bites"; hero subtitles; section intro rewritten
- `[2026-06-18]` frontend/src/pages/menu/Drinks.jsx — "Refreshments" → "House Drinks"; hero subtitles; section intro rewritten
- `[2026-06-18]` frontend/src/pages/menu/RagiSpecials.jsx — factual fix (pearl millet → finger millet); H1 + section intro rewritten
- `[2026-06-18]` frontend/src/pages/menu/Snacks.jsx — delivery banner rewritten
- `[2026-06-18]` frontend/src/pages/Contact.jsx — hero subtitle rewritten
- `[2026-06-18]` frontend/src/data/mockData.js — slide 1 description + slide 3 subtitle rewritten
- `[2026-06-18]` frontend/src/App.css + new `useScrollReveal.js` hook — scroll-reveal animation system added

---

## 2026-06-07 — commits `1cdd189`, `2f63fd8`, `4f90bff`, `181a466`, `6197074`, `73ca8e9`

- `[2026-06-07]` frontend/public/index.html — OG and Twitter Card meta tags added
- `[2026-06-07]` All routes — lazy-loaded via `React.lazy`; hero images reduced from `w=1920` to `w=1280`
- `[2026-06-07]` frontend/src/pages/* (14 files) — missing hero section JSX restored after SEO Helmet replacements
- `[2026-06-07]` frontend/src/pages/Home.jsx — missing closing brace on JSX comment fixed
- `[2026-06-07]` frontend/src/pages/Catering.jsx — catering CTA copy improved
- `[2026-06-07]` Multiple menu pages — star ratings added to dish cards
- `[2026-06-07]` frontend/src/pages/Home.jsx — newsletter incentive + daily specials add-to-cart added
- `[2026-06-07]` SEO: keyword H1s, `og`/Twitter/canonical tags on all major pages
- `[2026-06-07]` backend/seed.py — `seo_meta_description` added to 50 dishes

---

## 2026-05-03 — commits `eec1171`, `4895f11`, `a907c2e`, `8278bd3`, `09d2a30`

- `[2026-05-03]` mobile/src/screens — DabbaWala nav, hero header, sticky tabs scroll reset fixed
- `[2026-05-03]` backend/routes/loyalty.py — loyalty redeem field name corrected; `order_count` key fixed in mobile
- `[2026-05-03]` Loyalty flow bugs fixed across admin, web, and mobile
- `[2026-05-03]` mobile/src/screens/CategoryScreen — duplicate component body removed (syntax error)
- `[2026-05-03]` mobile/src/screens/CategoryScreen — reverted header logic to original

---

## 2026-05-01 — commits `9c690d4`, `06249ef`, `e024fd2`, `cffbebf`

- `[2026-05-01]` mobile — auth flow, navigation tab bar, checkout order logic fixed
- `[2026-05-01]` mobile — auth flow navigation freeze fixed; area-based delivery fees implemented
- `[2026-05-01]` mobile — DabbaWala nav, hero status bar, active tab scroll fixed
- `[2026-05-01]` frontend/src — auth actions unresponsive on first load fixed

---

## 2026-04-30 — commit `af387fa`

- `[2026-04-30]` mobile/ — complete React Native mobile app built with Expo (first version)
