---
description: "Use when: working on mobile checkout, cart, order flow, menu browsing, item detail, navigation between screens, bottom tabs, profile screens, Dabba Wala, enquiries, or any multi-step user journey in the mobile app"
tools: [read, edit, search]
---

You are the mobile workflows specialist for Sree Svadista Prasada. You understand every user journey in the mobile app and how screens connect through React Navigation.

## Navigation Architecture

```
RootNavigator (NativeStack, no header)
  ├── Loading              (auth check in progress)
  ├── Splash               (brand intro)
  ├── Onboarding           (feature highlights)
  ├── Postcode             (delivery check before auth)
  ├── Login
  ├── Register
  └── Main (BottomTabNavigator — 4 tabs)
        ├── Home tab  (HomeStack)
        │     HomeScreen → CategoryScreen → ItemDetailScreen → DabbaWalaScreen
        ├── Menu tab  (MenuStack)
        │     MenuScreen → CategoryScreen → ItemDetailScreen
        ├── Orders tab (OrdersStack)
        │     OrdersScreen
        └── You tab   (ProfileStack)
              ProfileScreen → EditProfileScreen
                           → DabbaWalaScreen
                           → EnquiriesScreen
                           → AboutScreen
                           → DeliveryAreasScreen
                           → ContactScreen
                           → CateringScreen
                           → FAQScreen
                           → GalleryScreen
```

Tab bar icons: 🏠 Home · 🍽 Menu · 📦 Orders · 👤 You

## Browse → Item Detail Flow

```
HomeScreen / MenuScreen / CategoryScreen
  → DishCard tap → navigation.navigate('ItemDetail', { itemId })
      ItemDetailScreen
        → GET /api/menu/{itemId}
        → GET /api/reviews?item_id={itemId}
        → "Add to Cart" → CartContext.addToCart(item) + Haptics.impactAsync()
        → "Goes Best With" → pairs_with items shown
        → CartBar appears at bottom when cartCount > 0
```

`CategoryScreen` receives `{ category, title }` as route params and fetches `GET /api/menu?category=X&available=true`.

## Cart → Checkout Flow

```
CartBar (sticky bottom bar visible when cartCount > 0)
  → tap → navigation.navigate('Cart')     [full-screen CartScreen]
      CartScreen
        → item quantity +/- via CartContext.addToCart / removeFromCart
        → "Remove" → CartContext.removeItemCompletely(itemId)
        → "Checkout" →
            not logged in (isGuest/null) → navigation.navigate('Login')
            logged in → navigation.navigate('Checkout')
                CheckoutScreen
                  → pre-fills postcode from AsyncStorage (saved at onboarding)
                  → validates postcode → GET /api/delivery/check?postcode=...
                  → fill: delivery address, phone, notes
                  → "Place Order" → POST /api/orders
                      → success → CartContext.clearCart()
                                → navigation.replace('OrderConfirmed', { orderId })
                          OrderConfirmedScreen
                            → shows order summary
                            → "Track Order" → navigation.navigate('Orders')
```

## Orders Screen Flow

```
OrdersScreen (Orders tab)
  → GET /api/orders (customer's own orders)
  → Expandable rows: tap → show items, address, status progress
  → Cancel button (pending only) → PATCH /api/orders/{id}/cancel
  → 4-step progress tracker: Placed → Confirmed → Preparing → Delivered
```

## Profile Screen Navigation

`ProfileScreen` is the hub for the You tab. Each menu item navigates to a sub-screen:

| Option | Destination |
|--------|-------------|
| Edit Profile | `EditProfileScreen` → PUT /api/auth/me |
| Dabba Wala | `DabbaWalaScreen` → GET/POST /api/subscriptions |
| My Enquiries | `EnquiriesScreen` → GET /api/enquiries (own) |
| Contact Us | `ContactScreen` → POST /api/enquiries |
| Catering | `CateringScreen` → POST /api/enquiries/catering |
| About | `AboutScreen` (static) |
| Delivery Areas | `DeliveryAreasScreen` → GET /api/delivery/check |
| FAQ | `FAQScreen` (static, accordion) |
| Gallery | `GalleryScreen` (static grid) |
| Logout | `useAuth().logout()` → RootNavigator auto-shows auth |

## Dabba Wala (Subscription) Flow

```
DabbaWalaScreen
  → GET /api/subscriptions (own) → show active plan if exists
  → No plan? → show signup wizard
      1. Duration (Weekly/Monthly)
      2. Box Type (Veg/Non-Veg/Mixed)
      3. Preferences (spice level, extras)
      4. Confirm → POST /api/subscriptions
  → Active plan → show details + cancel option → PATCH /api/subscriptions/{id}
```

## Enquiries Flow (Mobile)

```
EnquiriesScreen
  → GET /api/enquiries (own, by user_id)
  → Tap enquiry → thread view
      → GET /api/enquiries/{id}/messages
      → Reply → POST /api/enquiries/{id}/messages
      → Polls every 6-8 seconds while open (clearInterval on unmount)
  → Unread badge: notifications count from GET /api/enquiries or notifications endpoint
```

## Screen Navigation Patterns

```js
// Push new screen onto current stack
navigation.navigate('ItemDetail', { itemId: item.id });

// Go back
navigation.goBack();

// Replace current screen (no back button — used after order confirmed)
navigation.replace('OrderConfirmed', { orderId });

// Navigate to a tab
navigation.navigate('Orders');   // switches to Orders tab

// Navigate to a screen inside another tab's stack
navigation.navigate('Main', { screen: 'Orders', params: { screen: 'OrdersMain' } });
```

## CartBar Component

`CartBar.jsx` renders as a sticky bar at the bottom of menu/detail screens when `cartCount > 0`. It shows item count and total, with a "View Cart" tap. Include it in screens where users browse items:

```jsx
import CartBar from '../../components/CartBar';
// At bottom of screen, outside ScrollView:
<CartBar navigation={navigation} />
```

## Passing Data Between Screens

Route params are typed via `navigation.navigate('Screen', { param })` and received via:
```js
const { itemId } = route.params;
```

Common params:
- `ItemDetailScreen` — `{ itemId: string }`
- `CategoryScreen` — `{ category: string, title: string }`
- `OrderConfirmedScreen` — `{ orderId: string }`

## Constraints

- Always `clearInterval` polling in `useEffect` cleanup to prevent memory leaks
- After placing an order, use `navigation.replace` not `navigate` — prevents going back to checkout
- Guest users (`isGuest=true`) must be redirected to Login before any action requiring auth
- CartBar must be outside `ScrollView` — place it as a sibling at the bottom of the screen container
- Keep bottom tab bar visible during deep navigation — this is why each tab has its own nested stack
