# SEO Task Log — Sree Svadista Prasada

Living execution queue for the continuous SEO improvement system. Statuses:
Discovered / Validating / Prioritised / In progress / Implemented / Verified /
Blocked / Rejected / Monitoring. A task is only "Verified" after the change was
checked in a build or on the live site. Full audit evidence: the three-agent
360° audit of 2026-09-12 (codebase review + live crawl + performance/local).

## Cycle 1 — 2026-09-12 — COMPLETED

| ID | Task | Evidence | Status |
|----|------|----------|--------|
| S1 | /menu: canonical, OG/twitter images, description trimmed to <160 | Live crawl: no canonical, no og:image, 264-char description | Verified (build HTML) |
| S2 | /order: `noindex,follow` + fixed doubled title ("Order Now \| SSP \| SSP") | Live crawl: indexable 723KB near-duplicate of /menu | Verified (build HTML) |
| S3 | Item route: 308 redirect when path ≠ `buildItemUrl(item)`; canonical from item data not params | Any /x/y/{slug} returned 200 with self-confirming canonical | Verified (code + build) |
| S4 | Item breadcrumbs from real category/subcategory (was raw URL params, "Street-food") | codebase audit H1/M10 | Implemented |
| S5 | Subsection pages: self-canonicals + de-doubled titles (template appends brand) | No canonicals; titles doubled brand | Implemented |
| S6 | Prasada subsections: stale `curries-daal→Curries & Daal` mapping fixed to `curries→Curries`; `curries-daal` + `rice-bowls` now 308 legacy redirects | Tab rename left broken initialTab; duplicate URLs | Implemented |
| S7 | Breakfast: added `english-breakfast` subsection (tab existed, no page/sitemap entry) | TABS vs SLUG_TO_TAB mismatch | Implemented |
| S8 | Crawlable subsection links: FaqSection nav chips on /breakfast /svadista /prasada (tabs are hash-only pushState) | ~19 sitemap-only orphan URLs | Verified (hrefs in build HTML) |
| S9 | Visible FAQ accordions on /breakfast /svadista /prasada /milton-keynes /edinburgh /glasgow — same array feeds FAQPage JSON-LD (`FaqSection` + `faqSchema`) | FAQPage schema with zero visible Q&A on 6 pages | Verified (details in build HTML) |
| S10 | Removed false claims: "MK's only dedicated authentic South Indian restaurant", "UK's only dedicated Andhra kitchen" (×2) → defensible wording | 4 named MK competitors verified | Implemented |
| S11 | Edinburgh/Glasgow: removed Restaurant JSON-LD claiming premises in those cities; softened hero copy; fixed "pickles ship UK-wide today" claim (pickles are coming-soon) | Doorway/spam-markup risk | Implemented — **owner should confirm the Dabba/collection wording** |
| S12 | Home + /milton-keynes schema: `geo` 52.05313,-0.828507 (MK12 6LF centroid, postcodes.io), `hasMap` → exact address query | hasMap pointed at whole city; geo missing | Implemented — swap for GBP pin when profile opens |
| S13 | Removed bogus SearchAction (pointed at /breakfast?search=, no real search route) | codebase audit M5 | Implemented |
| S14 | Removed `keywords` meta (home, category pages, item pages) | Dead weight since 2009 | Implemented |
| S15 | Removed /menu hidden sr-only keyword block + duplicate hidden nav | Hidden-text pattern risk | Implemented |
| S16 | Custom `not-found.jsx` (branded 404, own metadata) | Live 404 emitted two `<title>` tags | Implemented |
| S17 | sitemap.ts: item URLs now via shared `buildItemUrl` (no drift), stable lastModified (was "now" on every regen), fixed `prasada/curries-daal→curries`, added breakfast subsections | codebase audit M3/L6 | Implemented |
| S18 | /milton-keynes description 248→~150 chars | SERP truncation | Implemented |

Earlier same day (audit cycle 0): GBP status clarified — profile exists, owner
keeps it closed until launch and will handle it themselves. Do not re-raise.

## Cycle 2 — 2026-09-12 — COMPLETED

| ID | Task | Status |
|----|------|--------|
| Q3 | `/delivery` landing page built from the real order engine (zones/fees/thresholds verified against backend/routes/orders.py), visible FAQ + FAQPage/Breadcrumb schema, sitemap entry, footer link | Verified (build) |
| Q11 | Fixed contradictory item-page FAQ ("60–90 mins Edinburgh/Glasgow") and wrong money facts: "£30 free delivery everywhere" → zone-based £28–£40; "collection has no minimum" → £15 minimum applies to all orders (matches engine) | Implemented |
| Q12 | next.config images restricted from `**` wildcard to the 6 hosts actually in use (checked live menu DB) — migrate the imglink.cc/vecteezy/edgeone item images to Firebase, then trim the list | Implemented |

## Cycle 3 — 2026-09-12 — COMPLETED (on-page pass)

| ID | Task | Status |
|----|------|--------|
| Q7 | Single H1 per page: 10 duplicate sr-only H1s removed; visible hero H1s now carry a keyword subtitle span (menu, breakfast, svadista, prasada, drinks, street-food, ragi, catering, subscriptions) | Verified — h1_count=1 in built HTML on all checked pages |
| Q8 | /subscriptions hidden sr-only block converted to a visible server-rendered content section (plans, dabba contents, how it works); its heading is now the page's SSR'd h1 (client hero demoted to h2 — client h1 was never in server HTML); hidden "MK's only weekly subscription" claim dropped; keywords meta removed | Verified (build) |
| — | Home title 92→54 chars ("Indian Takeaway Milton Keynes \| Sree Svadista Prasada") | Implemented |
| — | Remaining >160-char descriptions trimmed: /blog, /edinburgh, /glasgow | Implemented |

On-page keyword map now live in H1s: menu→"170+ South Indian dishes · Milton Keynes"; breakfast→"South Indian breakfast … dosa, idli & vada"; svadista→"Andhra non-veg curries, biryani"; prasada→"pure veg South Indian food"; catering→"South Indian catering … weddings, corporate"; subscriptions→"Dabba Wala — weekly South Indian meal subscription"; delivery→"Food Delivery in Milton Keynes".

## Cycle 4 — 2026-09-13 — COMPLETED (performance)

| ID | Task | Status |
|----|------|--------|
| Q4a | Hero slides self-hosted in public/hero — LCP image no longer fetched from Unsplash through the optimizer on cache misses; preload + fetchPriority high confirmed in served HTML; webp variants 9–40KB | Verified live |
| Q6 | All 7 raw `<img>` on home converted to next/image fill with sizes (two-worlds cards, chef special, meal moments, pickles, story) — 0 raw imgs in live HTML | Verified live |
| Q10 | /menu + /order initialItems slimmed to rendered fields — HTML 710→633KB / 723→651KB (~11%); remaining bulk is 170 cards' srcset markup (compresses well under brotli); flight payload measured at 91KB | Verified live |
| Q5 | JS diet: investigated — CartDrawer and AuthModal(+Firebase/Google, ~186KB) were already dynamically deferred in earlier perf work; remaining large chunks are framework (react-dom). No further safe cut without route-level refactor. | Closed (no action) |

Re-run Lighthouse mobile after a few days of edge-cache warmth to quantify the LCP change (lab was 4.7s with the Unsplash proxy in the chain).

## Cycle 5 — 2026-09-16 — COMPLETED (content & AI-search depth)

| ID | Task | Status |
|----|------|--------|
| Q9a | Blog + ItemList schema and twitter card on /blog index | Implemented |
| Q9b | New post /blog/dosa-milton-keynes — guide to all 12 live dosa varieties (names/prices/slugs verified against API), Article + FAQPage + Breadcrumb schema, internal links to dish pages + /delivery | Implemented |
| Q9c | New post /blog/biryani-milton-keynes — 3 live biryanis + veg rice plates (verified), Andhra-vs-Hyderabadi context, same schema set | Implemented |
| — | Visible intro sections on thin pages /drinks, /street-food, /snacks (server-rendered, with internal links) | Implemented |
| Q12b | Stray image hosts closed out: imglink.cc/vecteezy images self-hosted in public/dishes + DB migration keyed on exact old URLs; the edgeone URL was ALREADY 404 in production ("Special Chicken Biryani with Egg" had a broken image) — repointed to the Dum Biryani photo as placeholder; hosts removed from next.config allowlist | Implemented — **owner: real photo needed for Special Chicken Biryani with Egg** |

Content facts policy held: posts reference only live menu items with API-verified names/prices; no allergen or certification claims; dietary questions deferred to per-dish labels.

## Cycle 6 — 2026-10-03 — COMPLETED (accuracy, keyword research, full on-page pass; keyword set FROZEN)

| ID | Task | Status |
|----|------|--------|
| A1 | Opening hours in structured data read from admin Collection Times via /api/opening-hours (were hard-coded and wrong) | Verified locally |
| A2 | Vegetarian-kitchen claims corrected to "separate utensils, same kitchen"; unverifiable "only…" claims removed from descriptions; dishes not on sale removed from search text | Implemented |
| R1 | Search Console (3 months), Keyword Planner export and Google UK suggestions analysed; keyword-to-page map written | Done |
| S1 | Central SEO source of truth: `ssp-nextjs/src/lib/seo/pages.js` + `src/lib/categorySeo.js`; every page reads title, description, keywords and H1 line from there | Verified — 188 pages crawled |
| S2 | Site-wide default meta keywords removed; each page has its own (0 pages on the default, was 178) | Verified |
| T1 | 17 menu sub-pages: own title, H1 line, description, keywords and a paragraph each (were sharing the parent H1) | Verified |
| T2 | 134 dish pages: title pattern `<Dish> in Milton Keynes` (was `<Dish> \| Indian Takeaway Milton Keynes`, which competed with the homepage); keyword line under the H1 | Verified — no duplicate titles |
| T3 | Retitled: /menu, /subscriptions (tiffin *service*), /milton-keynes (South Indian restaurant & takeaway), /delivery, /catering, /story (Telugu & Andhra), /contact (Greenleys MK12), /faq, /snacks (Andhra pickles) | Verified locally |
| T4 | Over-long titles/descriptions trimmed on 5 about pages, 3 blog posts, /gongura (titles >70: 74 → 10; descriptions >160: 20 → 5) | Verified |
| C1 | Homepage: visible H1 and intro with keyword links (H1 was sr-only); supporting copy on /menu, /prasada, /svadista, /breakfast, /catering, /subscriptions | Implemented |
| C2 | Footer "Popular in Milton Keynes" link block on every page; /what-is-gongura → /gongura redirect | Implemented |

Keyword freeze: titles, primary keywords and H1 lines stay as set until at least 2026-12-01. Changes are recorded in the SEO status document. Review dates: 2026-10-17, 2026-10-31, 2026-12-01.

## Cycle 6b — 2026-10-03 — COMPLETED locally (content pass: page text read, corrected, keyworded)

| ID | Task | Status |
|----|------|--------|
| K1 | New check `content_check`: for every page, is each keyword actually in the page's own text (header/footer excluded) | Done — 13 of 48 pages lacked the main keyword as a phrase; 39 of 232 secondary keywords absent |
| K2 | Missing phrases written into the body of home, tiffin, pickles, ragi, street food, drinks, story, contact, delivery, catering, menu, Prasada, Svadista, FAQ, blog index and 12 menu sub-pages | Verified locally — 228 of 232 secondary keywords now in body text |
| F1 | Contact page hours read from admin Collection Times (were hard-coded and wrong); FAQ and guides no longer state fixed hours | Verified locally |
| F2 | Home page server-renders the live featured dishes and prices (first HTML used to carry sample dishes that are not sold) | Verified locally |
| F3 | Dishes not on sale, wrong prices, "only in MK/UK" claims, "ships UK-wide", "free over £30", health/diet claims removed from body copy, FAQ data and structured data | Verified locally — scan of 22 pages clean |

Titles, descriptions and primary keywords unchanged (identical to live on all 188 pages).

## Cycle 6c — 2026-10-03 — COMPLETED locally (dish pages: own paragraph for all 134 dishes)

| ID | Task | Status |
|----|------|--------|
| D1 | `src/lib/seo/dishCopy.js`: a written paragraph per dish (what it is, how it is eaten, what to order with it) — 134 entries, 4,730 words | Verified locally — every key matches a dish on sale |
| D2 | Dish page shows the paragraph, an ordering line and a link up to its section page; heading "About <dish>" | Verified locally — 134 pages, 21 link targets all load |
| D3 | Breadcrumb data for the vegetarian starters pointed to a 404 address; fixed | Verified locally |

Dish page length: median 220 → 286 words. Titles and descriptions unchanged.

## Queue — next cycles (priority order)

| ID | Task | Evidence / value | Effort | Can Claude do it? |
|----|------|------------------|--------|-------------------|
| Q1 | Fix Uber Eats store listed as "London" | Only citation found; direct NAP mismatch | — | No — owner contacts Uber Eats |
| Q2 | Citations at launch: Just Eat, Deliveroo, TripAdvisor, Yell, Bing Places (exact NAP) | Competitors have them all; we have none | — | No — owner accounts |
| Q3 | `/delivery` landing page: zones/postcodes (from backend delivery.py data), fees, minimums, slots, FAQ + schema | Highest-intent local query, no dedicated page | M | Yes |
| Q4 | Self-host home hero image (currently Unsplash proxied at request time) + replace stock OG images with real dish photos | LCP 4.7s mobile; cache-MISS round trip | M | Partially — needs real photos from owner |
| Q5 | JS diet: dynamic-import cart drawer/auth modal/carousels; ~300KB unused JS, TTI 12.5s | Lighthouse unused-javascript | M | Yes |
| Q6 | Convert raw Unsplash `<img>` on home to next/image | 194KB–746KB oversized-image waste | S | Yes |
| Q7 | Single h1 per page (~12 pages have sr-only + visible h1 with different text) | Diluted heading signal | M | Yes |
| Q8 | /subscriptions: reveal or shrink the large sr-only block; trim description | Hidden-text pattern | S | Yes |
| Q9 | Blog: Blog/ItemList schema on index; more posts (dosa guide, MK tiffin guide, biryani) | 3 posts vs competitor content | M | Yes (content needs owner fact-check) |
| Q10 | Trim ~700KB HTML on /menu + /order (item data duplicated in RSC flight payload) | Parse cost on mobile | L | Yes (careful) |
| Q11 | Item FAQ text fix: "60–90 mins for Edinburgh and Glasgow" contradicts MK-only | Consistency for AI answers | S | Yes (data lives in Mongo item.faqs / ItemDetailClient GENERAL_FAQS) |
| Q12 | Restrict next.config images remotePatterns from `**` to real hosts | Open optimisation proxy | S | Yes |
| Q13 | Review CTA after order (Google review link) — needs GBP place ID | Review velocity at launch | S | Blocked on GBP opening |
| Q14 | GA4/GSC audit: verify Search Console property + submit sitemap after this deploy | Measurement | S | Needs owner access |
| Q15 | aggregateRating on Restaurant schema once real Google reviews exist | Rich results | S | Blocked on GBP |

## External dependencies (owner)
- GBP: owner handles at launch (their decision, 2026-09-12).
- Uber Eats city fix (Q1); marketplace/citation listings (Q2).
- Real food photography for hero + OG images (Q4).
- Confirm: Dabba Wala availability wording on Edinburgh/Glasgow pages (S11);
  Prasada "dedicated pure-veg kitchen / zero cross-contamination" claims
  (pre-existing — verify before launch marketing).
- Google Search Console access for measurement (Q14).
