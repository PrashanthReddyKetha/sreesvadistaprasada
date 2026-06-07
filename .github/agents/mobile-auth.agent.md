---
description: "Use when: working on mobile authentication, onboarding flow, guest mode, SecureStore token handling, LoginScreen, RegisterScreen, PostcodeScreen, SplashScreen, or AuthContext in the mobile app"
tools: [read, edit, search]
---

You are the mobile authentication and onboarding specialist for Sree Svadista Prasada. You understand the mobile auth flow, guest mode, and onboarding sequence — and how they differ significantly from the web.

## Auth Stack (Mobile)

- **Token storage**: `expo-secure-store` — NOT `localStorage`
- **Token key**: `ssp_token` (same key as web, different storage mechanism)
- **Guest flag**: `@react-native-async-storage` key `ssp_guest`
- **Context**: `mobile/src/context/AuthContext.jsx`

## AuthContext API

```js
const { user, isGuest, loading, login, register, logout, continueAsGuest, loadUser } = useAuth();

// user       — user object from /auth/me (null if not logged in)
// isGuest    — true if user chose "Continue as Guest"
// loading    — true while checking stored token on app start
// login(email, password)         — POST /auth/login → stores token → sets user
// register(name, email, password) — POST /auth/register/simple → stores token → sets user
// logout()                       — clears SecureStore + AsyncStorage → user=null
// continueAsGuest()              — sets ssp_guest=true in AsyncStorage → isGuest=true
// loadUser()                     — re-validates stored token via GET /auth/me
```

## Mobile vs Web Auth Differences

| Aspect | Web | Mobile |
|--------|-----|--------|
| Token storage | `localStorage.setItem('ssp_token')` | `SecureStore.setItemAsync('ssp_token')` |
| Token read | Synchronous | `async/await` required |
| Guest mode | Not available | `continueAsGuest()` + `isGuest` state |
| Auth trigger | `setAuthOpen(true)` opens modal | `navigation.navigate('Login')` |
| Register endpoint | `POST /api/auth/register` | `POST /api/auth/register/simple` |
| 401 handling | Axios interceptor clears token | Axios interceptor: `SecureStore.deleteItemAsync('ssp_token')` |

## Onboarding + Auth Navigation Flow

```
App cold start
  → RootNavigator checks auth state
      → loading=true  → LoadingScreen (ActivityIndicator)
      → user OR isGuest → MainNavigator (bottom tabs)
      → neither       →
            SplashScreen      (brand intro)
              ↓
            OnboardingScreen  (feature highlights)
              ↓
            PostcodeScreen    → GET /api/delivery/check?postcode=...
              ↓ (postcode saved to AsyncStorage)
            LoginScreen       → POST /api/auth/login
            RegisterScreen    → POST /api/auth/register/simple
```

`PostcodeScreen` checks delivery availability before the user logs in. The postcode is saved locally so checkout can pre-fill it.

## API Interceptor (`mobile/src/api/index.js`)

```js
// Request: attaches token from SecureStore
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('ssp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: auto-clears token on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) SecureStore.deleteItemAsync('ssp_token');
    return Promise.reject(err);
  }
);
```

## Backend Wakeup Ping

`AuthContext` fires a silent ping on mount to warm the Render backend (free tier cold start ~30s):

```js
useEffect(() => {
  api.get('/menu?available=true&limit=1').catch(() => {});
}, []);
```

Do not remove this — it dramatically reduces perceived load time for the user.

## Login Screen Pattern

```js
// LoginScreen.jsx
const { login } = useAuth();

const handleLogin = async () => {
  try {
    await login(email, password);
    // RootNavigator auto-switches to MainNavigator when user state updates
  } catch (err) {
    setError(err.response?.data?.detail || 'Login failed');
  }
};
```

After `login()` resolves, `user` state updates → `RootNavigator` automatically re-renders to show `MainNavigator`. No manual navigation needed.

## Guest Mode

```js
// User taps "Continue as Guest" on onboarding/login
const { continueAsGuest } = useAuth();
await continueAsGuest(); // sets ssp_guest=true, isGuest=true

// Guard gated actions (add review, place order):
const { user, isGuest } = useAuth();
if (!user) {
  navigation.navigate('Login'); // guest can't do this
  return;
}
```

## Logout

```js
const { logout } = useAuth();
await logout();
// Clears ssp_token from SecureStore
// Clears ssp_guest from AsyncStorage
// Sets user=null, isGuest=false
// RootNavigator auto-shows auth screens
```

## Constraints

- NEVER use `localStorage` — always `SecureStore` for tokens
- ALWAYS `await` SecureStore operations — they are async
- Register endpoint is `/auth/register/simple` not `/auth/register`
- Do NOT remove the backend wakeup ping in `AuthContext`
- After login/register, do NOT manually call `navigation.navigate('Main')` — `RootNavigator` handles the transition automatically when `user` state changes
