# Sree Svadista Prasada - Product Requirements Document

## Original Problem Statement
Build a premium website for "Sree Svadista Prasada" - an authentic South Indian food business serving Milton Keynes (main), Edinburgh & Glasgow, UK. Dual identity: **Sree Prasada** (divine pure veg) and **Sree Svadista** (rustic non-veg). Based on Master Design Brief PDF.

## Tech Stack
React, TailwindCSS, Shadcn UI, Lucide React, FastAPI (pending), MongoDB (pending)

## Architecture
```
/app/frontend/src/
├── App.js (10 routes)
├── App.css, index.css (design system)
├── mockData.js (all mock data)
├── components/
│   ├── Header.jsx (notification bar + dropdown nav + cart/account)
│   ├── Footer.jsx (4-column dark footer)
│   └── HeroSlider.jsx (3-slide auto-advancing hero)
├── pages/
│   ├── Home.jsx (12+ sections)
│   ├── Svadista.jsx (earthy red theme, sticky filters, spice meter)
│   ├── Prasada.jsx (green theme, purity promise)
│   ├── Breakfast.jsx (golden theme, tiffins/snacks)
│   ├── Snacks.jsx (UK-wide shipping, pickles/podis)
│   ├── Menu.jsx (combined view, 7 categories)
│   ├── Subscriptions.jsx (4-step wizard)
│   ├── OurStory.jsx (5 narrative sections)
│   ├── Catering.jsx (services, enquiry form)
│   ├── Contact.jsx (info cards, form, Milton Keynes main)
```

## What's Implemented

### Phase 1 — Homepage & Design System (Complete)
- Notification bar, Header with dropdown nav/cart/account
- 3-slide hero with dark moody images (excellent readability)
- Two Worlds cards, Trending carousel, Chef's Special
- Meal Moments, Dabba Wala 3-step, Svadista Cinema, Offers
- Snacks UK-Wide, Our Story teaser, Testimonials, Footer

### Phase 2 — Menu Page Overhaul (Complete)
- Svadista: earthy red theme, spice meter, food images
- Prasada: green theme, purity promise, sacred occasions
- Breakfast (NEW): golden theme, tiffins/snacks
- Snacks (NEW): UK-Wide shipping, pickles/podis/sweets
- Menu: combined view with 7-category filter

### Phase 3 — Subscription Wizard (Complete)
- 4-step wizard: Duration → Box Type → Preferences → Summary

### Phase 4 — Page Polish + Milton Keynes (Complete)
- Hero slider revamped with dark moody food images for readability
- Milton Keynes added as main/highlighted location everywhere
- Our Story redesigned: 5 sections (Beginning, Name Meaning, Two Worlds, Promise, Serving UK)
- Catering redesigned: services cards, Why Choose Us, enquiry form
- Contact redesigned: info cards (MK as Main Kitchen), form, social links

## Prioritized Backlog

### P2 - Backend & Integration
- [ ] MongoDB schemas (menu items, categories, subscriptions, catering requests, contacts)
- [ ] FastAPI CRUD endpoints
- [ ] Seed database with current mock data
- [ ] Replace mocked data with live API calls
- [ ] Wire up forms (contact, catering, subscription)

### P3 - Future/Advanced
- [ ] Cart & checkout functionality
- [ ] User accounts & dashboard
- [ ] Admin panel
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Location intelligence (MK/Edinburgh/Glasgow = full menu, others = snacks)

## Project Health
- **Broken**: Nothing
- **Mocked**: ALL frontend data
- **Testing**: 100% pass rate across 57+ features (iterations 1-3)
- **Pages**: 10 routes, all working, all responsive
