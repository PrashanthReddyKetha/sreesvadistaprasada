# Changelog

All changes listed in reverse chronological order. Each entry: `[YYYY-MM-DD] scope: description`.

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
