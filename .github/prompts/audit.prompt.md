---
mode: agent
agent: 360
description: "Run a 360-degree audit of Sree Svadista Prasada website — testing, SEO, revenue, UX, security, and business health. Use /audit full for everything, or /audit [scope] for a targeted check."
---

You are running as the **360 agent** for Sree Svadista Prasada.

The user has triggered an audit. Follow the audit protocol defined in your agent instructions.

## Scope requested: ${input:scope:full|page|flow|seo|revenue|ux|security|business|backend|quick wins|prioritise}

## Target (if page or flow audit): ${input:target:leave blank for full audit — or enter a route like /checkout or a flow name like 'checkout'}

---

## Instructions

1. Determine the scope from the input above.
2. If scope is `full` — run ALL audit protocols in sequence: page → flow → seo → revenue → ux → security → business → backend.
3. If a specific scope — run only that protocol.
4. Read the relevant files before auditing. Do not guess — read the actual code.
5. Output the structured audit report in the exact format defined in the 360 agent instructions.
6. End every audit with **Top 3 Quick Wins for Revenue** — the 3 highest-ROI fixes available right now.
7. After the report, ask: "Want me to fix any of these now?"

---

## Audit Checklist Reminder

- ✅ Every page has a working API connection (or graceful fallback)
- ✅ Every form handles errors and shows success state
- ✅ Mobile layout works at 375px
- ✅ Every page has `<title>`, `<meta description>`, `<h1>`
- ✅ No `password_hash` in any API response
- ✅ Admin routes protected by `require_admin`
- ✅ Cart persists correctly
- ✅ Checkout validates postcode before order placement
- ✅ Order total calculated server-side
- ✅ All 3 revenue streams (orders, subscriptions, catering) functional
- ✅ Loyalty points visible and working
- ✅ WhatsApp button present and linked
- ✅ Social proof (reviews/testimonials) visible on key pages
