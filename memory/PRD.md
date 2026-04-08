# Sree Svadista Prasada - Product Requirements Document

## Original Problem Statement
Build a premium website for "Sree Svadista Prasada" - authentic South Indian food business serving **Milton Keynes** (main), Edinburgh & Glasgow, UK. Dual identity: **Sree Prasada** (divine pure veg) and **Sree Svadista** (rustic non-veg).

## Tech Stack
React, TailwindCSS, Shadcn UI, Lucide React | FastAPI + MongoDB (pending)

## Architecture — 12 Pages
```
/app/frontend/src/
├── App.js (12 routes)
├── components/
│   ├── Header.jsx (notification bar + dropdown nav + cart/account)
│   ├── Footer.jsx (newsletter + 4-column footer)
│   ├── HeroSlider.jsx (3-slide hero, mobile-safe)
│   └── WhatsAppButton.jsx (floating green button)
├── pages/
│   ├── Home.jsx (hero, two worlds, trending w/allergens, chef's special, meal moments, dabba wala, postcode checker, delivery areas, gallery preview, offers, snacks, story teaser, testimonials)
│   ├── Svadista.jsx, Prasada.jsx, Breakfast.jsx, Snacks.jsx, Menu.jsx (with search)
│   ├── Subscriptions.jsx (4-step wizard)
│   ├── OurStory.jsx, Catering.jsx, Contact.jsx
│   ├── FAQ.jsx (searchable accordion, 5 categories, 18 questions)
│   └── Gallery.jsx (filterable grid, lightbox)
├── mockData.js (dishes, plans, delivery areas, FAQ, gallery)
```

## Completed Features

### Phase 1 — Homepage & Design System
- 3-slide hero (dark moody images, strong gradient, mobile arrows hidden)
- Two Worlds cards, Trending carousel (w/allergen tags), Chef's Special
- Meal Moments, Dabba Wala 3-step, Offers banner, Snacks UK-Wide
- Story teaser, Testimonials, Footer w/newsletter

### Phase 2 — Menu Overhaul
- Svadista (earthy red), Prasada (green), Breakfast (golden), Snacks (UK-wide)
- Combined Menu with search + 7-category filter

### Phase 3 — Subscription Wizard
- 4-step: Duration → Box Type → Preferences → Summary

### Phase 4 — Polish + Milton Keynes
- Hero slider revamped, all pages polished, MK highlighted everywhere

### Phase 5 — UX Enhancements (Latest)
- Mobile hero arrow fix + compact notification bar
- Floating WhatsApp button (all pages)
- Newsletter signup in footer
- Allergen tags on dish cards (nuts, dairy, sesame)
- FAQ page: 5 categories, 18 Qs, searchable accordion
- Gallery page: 6 filters, 12 images, lightbox
- Delivery postcode checker + areas table on homepage
- Menu search bar
- "More" dropdown (Gallery, FAQ, Contact)

## Project Health
- **Pages**: 12 routes, all working, all responsive
- **Broken**: Nothing
- **Mocked**: ALL frontend data
- **Testing**: 100% pass (iterations 1-4, 70+ features verified)

## Backlog
### P2 - Backend
- [ ] MongoDB schemas + FastAPI endpoints
- [ ] Wire up forms (contact, catering, subscription, newsletter)
- [ ] Cart + ordering functionality

### P3 - Future
- [ ] User accounts, admin panel, payment integration
- [ ] Weekly menu preview for subscribers
- [ ] Blog/updates section
