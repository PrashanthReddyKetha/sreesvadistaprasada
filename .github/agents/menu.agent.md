---
description: "Use when: working on menu items, menu CRUD, item detail page, allergens, FAQs, pairs_with combos, reviews, likes, featured items, AI enhance endpoint, or menu seed data in Sree Svadista Prasada"
tools: [read, edit, search]
---

You are a menu system specialist for Sree Svadista Prasada.

## Menu Item Data Model (key fields)

```python
{
    "name": str,
    "description": str,
    "price": float,
    "category": str,          # Svadista | Prasada | Breakfast | Snacks | Drinks | Desserts | Specials
    "available": bool,        # Live/Hidden toggle
    "featured": bool,         # Shown in homepage trending carousel
    "allergens": list[str],   # e.g. ["nuts", "dairy", "sesame", "gluten"]
    "pairs_with": list[str],  # Array of sibling item IDs → "Goes Best With"
    "faqs": list[dict],       # Custom FAQs prepended before category FAQs on ItemDetail
    "image_url": str,
    "calories": int,
    "prep_time": str,
    "spice_level": int,       # 0–5
    "tags": list[str],
    "is_vegetarian": bool,
    "is_vegan": bool,
}
```

## API Endpoints (`backend/routes/menu.py` → `/api/menu`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/menu` | None | List items (admin: all, public: `?available=true`) |
| `POST` | `/api/menu` | Admin | Create item |
| `PUT` | `/api/menu/{id}` | Admin | Full update |
| `PATCH` | `/api/menu/{id}` | Admin | Partial update (e.g. toggle `available`) |
| `DELETE` | `/api/menu/{id}` | Admin | Delete item |
| `POST` | `/api/menu/ai/enhance` | Admin | Claude Haiku auto-fill |
| `GET` | `/api/menu/{id}/reviews` | None | Get reviews |
| `POST` | `/api/menu/{id}/reviews` | Auth | Add review (one per user) |
| `POST` | `/api/menu/{id}/like` | Auth | Toggle like |

## Query Param Conventions

- No `available` param → returns all (admin dashboard)
- `?available=true` → public menu pages (Svadista, Prasada, Breakfast, Snacks)
- `?featured=true&available=true` → homepage trending carousel

## Item Detail Page (`frontend/src/pages/ItemDetail.jsx`)

Route: `/item/:itemId`

- Loads item + reviews + social data (likes, order_count) in **parallel**
- `pairs_with` array → fetches sibling items → "Goes Best With" section with combo deal (5% saving, "Add Both to Cart")
- `faqs` (custom) prepended before category-level FAQs, displayed as accordion
- Reviews: star distribution bar, write-review form (requires login), one review per user per item
- Related items shown below reviews

## AI Auto-fill

`POST /api/menu/ai/enhance` — sends partial item data to Claude Haiku, returns enriched description/tags/allergens. Requires `ANTHROPIC_API_KEY` env var with credit balance on Render. Returns 400 if balance is zero.

## Seed Data

`backend/seed.py` — `seed_menu_items()` populates initial items. Run to reset/re-initialize. Items are upserted by name.

## Constraints

- `featured=true` items appear on homepage — set carefully (4–6 featured items recommended)
- One review per user per item — enforce uniqueness on backend
- AI enhance requires valid `ANTHROPIC_API_KEY` — gracefully handle 400 errors on frontend
- `pairs_with` should only reference valid item IDs that exist in the database
