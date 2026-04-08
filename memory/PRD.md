# Sree Svadista Prasada - Product Requirements Document

## Original Problem Statement
Build a premium website for "Sree Svadista Prasada" - an authentic South Indian food business serving Edinburgh & Glasgow, UK. Dual identity: **Sree Prasada** (divine pure veg) and **Sree Svadista** (rustic non-veg). Based on a Master Design Brief PDF.

## Tech Stack
React, TailwindCSS, Shadcn UI, Lucide React, FastAPI (pending), MongoDB (pending)

## Architecture
```
/app/frontend/src/
├── App.js (routes for 10 pages)
├── App.css, index.css (design system)
├── mockData.js (all mock data)
├── components/
│   ├── Header.jsx (notification bar + dropdown nav + cart/account)
│   ├── Footer.jsx (4-column dark footer)
│   └── HeroSlider.jsx (3-slide auto-advancing hero)
├── pages/
│   ├── Home.jsx (12+ sections: hero, two worlds, trending, chef's special, meal moments, dabba wala, cinema, offers, snacks, story, testimonials)
│   ├── Svadista.jsx (earthy red theme, sticky filters, spice meter)
│   ├── Prasada.jsx (green theme, purity promise, sacred occasions)
│   ├── Breakfast.jsx (golden theme, tiffins/snacks)
│   ├── Snacks.jsx (UK-wide shipping, pickles/podis)
│   ├── Menu.jsx (combined view, all categories)
│   ├── Subscriptions.jsx (4-step wizard: Duration → Box → Preferences → Summary)
│   ├── OurStory.jsx, Catering.jsx, Contact.jsx
```

## What's Implemented

### Phase 1 — Homepage & Design System (Complete, Feb 2026)
- Notification bar, Header with dropdown nav/cart/account
- 3-slide hero, Two Worlds cards, Trending carousel, Chef's Special
- Meal Moments, Dabba Wala 3-step, Svadista Cinema, Offers banner
- Snacks & Pickles UK-Wide, Our Story teaser, Testimonials, Footer
- Full design system: Burgundy/Ivory/Saffron, Playfair Display + Lato, animations

### Phase 2 — Menu Page Overhaul (Complete, Feb 2026)
- Svadista page: Earthy red (#8B3A3A) theme, hero, sticky filters, spice meter (5-flame scale), food images, non-veg indicators
- Prasada page: Green (#4A7C59) theme, purity promise banner, sacred occasions, veg indicators
- Breakfast page (NEW): Golden (#B8860B) theme, tiffins/snacks, accompaniments section
- Snacks page (NEW): UK-Wide shipping banner, pickles/podis/sweets, gifting section
- Menu page: Combined view with all 7 categories, links to sub-menus

### Phase 3 — Subscription Wizard (Complete, Feb 2026)
- 4-step wizard with progress indicator
- Step 1: Duration (Weekly £45 / Monthly £160 / Family £280)
- Step 2: Box Type (Prasada/Svadista/Mixed) with included items
- Step 3: Preferences (8 dietary options) + start date
- Step 4: Summary with confirm button
- Validation: can't proceed without required selections

## Prioritized Backlog

### P1 - Polish & Enhance
- [ ] Polish Our Story page to match homepage quality
- [ ] Polish Catering page with new design language
- [ ] Polish Contact page with new design language

### P2 - Backend & Integration
- [ ] MongoDB schemas (menu items, categories, subscriptions, catering requests, contacts)
- [ ] FastAPI CRUD endpoints (/api/menu, /api/subscriptions, /api/catering, /api/contact)
- [ ] Seed database with current mock data
- [ ] Replace mocked data with live API calls
- [ ] Wire up forms (contact, catering inquiry, subscription)

### P3 - Future/Advanced
- [ ] Cart & checkout functionality
- [ ] User accounts & dashboard
- [ ] Location intelligence (Edinburgh/Glasgow = full menu, others = snacks only)
- [ ] Smart cart upsells
- [ ] Admin panel
- [ ] Payment integration (Stripe/Razorpay)

## Project Health
- **Broken**: Nothing
- **Mocked**: ALL frontend data
- **Testing**: 100% pass rate across 32 features (iteration_1 + iteration_2)
