# Sree Svadista Prasada - Product Requirements Document

## Original Problem Statement
Build a premium website for "Sree Svadista Prasada" - an authentic South Indian food business serving Edinburgh & Glasgow, UK. The brand has a **DUAL IDENTITY**:
- **Sree Prasada**: Divine, pure vegetarian, temple-style cooking (Turmeric/Saffron/Green palette)
- **Sree Svadista**: Rustic, spicy, traditional non-vegetarian (Earthy Red/Clay/Spice palette)

The website must evoke nostalgia and emotional connection ("Finally, I am home"). Based on a comprehensive Master Design Brief PDF provided by the user.

## User Personas
- South Indians living in UK (Edinburgh, Glasgow) missing authentic home food
- Students seeking affordable meal subscriptions
- Families wanting temple-style pure veg prasadam
- Corporate offices needing catering services

## Core Requirements
- **Dual Brand Identity**: Clear visual differentiation between Prasada and Svadista
- **Emotional Design**: Warm, nostalgic, premium yet homely
- **Mobile-First**: Priority #1 per design brief
- **Typography**: Playfair Display (headings), Lato (body)
- **Colors**: Deep Burgundy (#800020), Ivory (#FDFBF7), Saffron Gold (#F4C430)
- **No emojis**: Use Lucide React icons only

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn UI, Lucide React
- **Backend**: FastAPI (pending)
- **Database**: MongoDB (pending)
- **Images**: Unsplash

## Architecture
```
/app/
├── frontend/src/
│   ├── App.js, App.css, index.css
│   ├── mockData.js (centralized mock data)
│   ├── components/
│   │   ├── Header.jsx (notification bar + nav + dropdown + cart/account)
│   │   ├── Footer.jsx (dark footer with 4 columns)
│   │   ├── HeroSlider.jsx (3-slide auto-advancing hero)
│   │   └── ui/ (Shadcn components)
│   └── pages/
│       ├── Home.jsx (12 homepage sections)
│       ├── Menu.jsx, Svadista.jsx, Prasada.jsx
│       ├── Subscriptions.jsx, Catering.jsx
│       ├── OurStory.jsx, Contact.jsx
├── backend/server.py (default FastAPI - unused)
├── design_guidelines.json (design system reference)
```

## What's Implemented (Phase 1 Complete - Feb 2026)

### Homepage Sections (all in Home.jsx):
1. Sticky Notification Bar ("Swagatam! Edinburgh & Glasgow | Free Delivery £30+")
2. Header with Menus dropdown (Prasada/Svadista/Breakfast), Cart + Account icons
3. Hero Slider - 3 slides (Welcome Home, Dual Kitchen, Dabba Wala) with auto-advance
4. "Two Worlds" Navigation Cards (Svadista earthy red / Prasada green overlays)
5. Trending & Loved - horizontal scrollable carousel with dish cards
6. Chef's Special (Prasadam Pulihora spotlight)
7. Explore by Meal Moment (4 circular icons)
8. Dabba Wala 3-Step Guide (burgundy background)
9. Svadista Cinema (video section with play button)
10. Offers & Specials (15% OFF banner, code HOME15)
11. Snacks & Pickles UK-Wide (with product tags)
12. Our Story Teaser (emotional narrative)
13. Testimonials ("Finally, I Am Home")
14. Footer (brand, links, services, contact, social)

### All Sub-pages Built:
- Our Story, Svadista, Prasada, Menu, Subscriptions, Catering, Contact

### Design System:
- CSS variables for all brand colors
- Animations (fadeInUp, fadeIn, slideInLeft, scaleIn)
- Custom scrollbar, selection colors
- Grain overlay texture effect
- Card hover and image zoom effects

## Prioritized Backlog

### P0 - Next Up
- [ ] Phase 2: Menu page overhaul (Svadista with earthy theme, Prasada with saffron/green theme, sticky filters, spice meter, food images, AJAX filtering)
- [ ] Add Breakfast page (separate from Menu)
- [ ] Add Snacks/Pickles/Podis page (UK-Wide delivery focus)

### P1 - Important
- [ ] Phase 3: Subscription Wizard (step-by-step: Duration → Box Type → Fine Tuning → Schedule)
- [ ] Polish Catering page (hero, offering types, inquiry form)
- [ ] Enhance Our Story page (narrative, dual concept, kitchen/team)
- [ ] Refine sub-pages to match homepage premium design language

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
- [ ] Payment integration

## Project Health
- **Broken**: Nothing
- **Mocked**: ALL frontend data (dishes, pricing, testimonials, hero slides, chef special)
- **Testing**: 100% pass rate (17/17 features tested via testing agent)
