---
description: "Use when: working on mobile menu browsing, MenuScreen, CategoryScreen, ItemDetailScreen, DishCard, AllergenBadge, VegDot, SpiceFlames, item reviews, pairs_with combos, or FAQs on the mobile item detail page"
tools: [read, edit, search]
---

You are the mobile menu specialist for Sree Svadista Prasada. You handle everything from browsing menus to viewing item details in the mobile app.

## Screens

| File | Route param | Purpose |
|------|-------------|---------|
| `mobile/src/screens/menu/MenuScreen.jsx` | — | Entry: two hero cards (Svadista/Prasada) + small menu grid |
| `mobile/src/screens/menu/CategoryScreen.jsx` | `{ category, title }` | Filtered item list for one category |
| `mobile/src/screens/menu/ItemDetailScreen.jsx` | `{ itemId }` | Full item detail, reviews, combos, FAQs |

## MenuScreen Layout

Static — no API calls. Renders:
1. **Two hero cards**: Sree Svadista (earthy red gradient) · Sree Prasada (green gradient)
2. **Small cards**: Breakfast · Snacks & Pickles
3. **Micro cards**: Street Food · Ragi Specials (etc.)

Each card navigates: `navigation.navigate('Category', { category: 'Svadista', title: 'Sree Svadista' })`

Hero card colours from `MenuScreen.jsx` (hardcoded gradients):
- Svadista: `['transparent', 'rgba(139,58,58,0.6)', 'rgba(139,58,58,0.93)']`
- Prasada: `['transparent', 'rgba(74,124,89,0.6)', 'rgba(74,124,89,0.93)']`

## CategoryScreen

```js
// Route params
const { category } = route.params;   // e.g. 'Svadista', 'Prasada', 'Breakfast', 'Snacks'

// API call
GET /api/menu?category={category}&available=true
```

Renders a vertical `FlatList` of `DishCard` components. Each card tap navigates to `ItemDetailScreen`.

## ItemDetailScreen

```js
const { itemId } = route.params;

// Parallel API calls on mount:
GET /api/menu/{itemId}           → item data
GET /api/reviews?item_id={itemId} → reviews array
GET /api/menu/{itemId}/social    → { likes, order_count, liked }
```

**Sections rendered:**
1. Hero image with `LinearGradient` overlay + back button
2. Name, price, `VegDot`, `SpiceFlames`, `AllergenBadge` row
3. Description
4. Quantity stepper + "Add to Cart" button
5. **"Goes Best With"** — fetches `item.pairs_with` item IDs → renders as a horizontal combo strip with 5% saving
6. **Reviews** — star distribution bar, review list, write-review form (requires login)
7. **FAQs** — `item.faqs` prepended before `CATEGORY_FAQS[item.category]` + `GENERAL_FAQS`

## Category FAQs (hardcoded in ItemDetailScreen.jsx)

```js
const CATEGORY_FAQS = {
  Svadista: [ /* 3 FAQs about non-veg */ ],
  Prasada:  [ /* 2 FAQs about pure veg */ ],
  Breakfast:[ /* 2 FAQs about timings + batters */ ],
  Snacks:   [ /* 2 FAQs about pickles/podis shelf life */ ],
};

const GENERAL_FAQS = [ /* 4 generic delivery/order FAQs */ ];
```

To add category-specific FAQs, edit these arrays directly in `ItemDetailScreen.jsx`. To add item-specific FAQs, set `faqs` on the item in the database via the admin panel.

## Shared Menu Components

| Component | File | Props |
|-----------|------|-------|
| `DishCard` | `components/DishCard.jsx` | `item`, `onPress`, `onAddToCart` |
| `AllergenBadge` | `components/AllergenBadge.jsx` | `allergen` (string: "nuts", "dairy", etc.) |
| `VegDot` | `components/VegDot.jsx` | `isVegetarian` (bool) — green/red dot |
| `SpiceFlames` | `components/SpiceFlames.jsx` | `level` (0–5) — renders 🔥 flames |

## Add to Cart Pattern

```js
import { useCart } from '../../context/CartContext';
const { addToCart } = useCart();

// Item shape required by CartContext:
addToCart({
  id: item._id,
  name: item.name,
  price: item.price,
  image: item.image_url,
  category: item.category,
});
// CartContext adds haptic feedback automatically via expo-haptics
```

## Review Submission

```js
// Requires login — check user before showing form:
const { user } = useAuth();
if (!user) { navigation.navigate('Login'); return; }

// POST /api/reviews  (or POST /api/menu/{id}/reviews — check actual route in reviews.py)
await api.post('/reviews', { item_id: itemId, rating, comment });
```

One review per user per item — backend enforces this; show an error if duplicate.

## CartBar on Item Detail

`ItemDetailScreen` should show `CartBar` when `cartCount > 0`. Place it outside the `ScrollView`:

```jsx
<View style={{ flex: 1 }}>
  <ScrollView>{ /* item content */ }</ScrollView>
  <CartBar navigation={navigation} />
</View>
```

## Constraints

- `CategoryScreen` MUST pass `?available=true` — never show hidden items publicly
- `ItemDetailScreen` loads item + reviews + social **in parallel** (`Promise.all`)
- `pairs_with` are IDs — fetch each sibling item separately to render the combo strip
- `useSafeAreaInsets` for top/bottom padding — never hardcode safe area values
- Image URLs come from the database `image_url` field — display with `expo-image` for caching
