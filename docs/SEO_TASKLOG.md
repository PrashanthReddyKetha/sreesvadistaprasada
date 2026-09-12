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
