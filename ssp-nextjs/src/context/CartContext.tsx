'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics';
import { record } from '@/lib/track';
import { useKitchen } from '@/context/KitchenContext';
import { isOrderable } from '@/config/softLaunch';
import api from '@/api';

interface CartItem {
  id: string;
  name: string;
  price: number | string;
  image?: string;
  category?: string;
  quantity: number;
  preorder?: boolean; // made overnight — collection only, next-day slot
}

interface Toast {
  type: 'add' | 'update' | 'remove';
  name: string;
  qty?: number;
  price?: number | string;
}

export interface PickupSlot {
  iso: string;    // "2026-09-07T18:15" (London time)
  label: string;  // "6:15 pm"
  date: string;   // "2026-09-07"
}

export interface ZoneInfo {
  postcode: string;
  delivery_fee: number;
  free_delivery_over: number;
  zone?: number;
  deliverable?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  refreshPrices: () => Promise<void>;
  toast: Toast | null;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  // Shared delivery prefs — single source of truth for CartDrawer + Checkout
  deliveryType: string;
  setDeliveryType: (type: string) => void;
  zoneInfo: ZoneInfo | null;
  setZoneInfo: (info: ZoneInfo | null) => void;
  // Collection slot (takeaway only) — null = ASAP
  pickupSlot: PickupSlot | null;
  setPickupSlot: (slot: PickupSlot | null) => void;
  preorderSlot: PickupSlot | null;          // when the pre-order dishes are collected (tomorrow)
  setPreorderSlot: (slot: PickupSlot | null) => void;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'ssp_cart';
const DT_KEY      = 'ssp_delivery_type';
const ZONE_KEY    = 'ssp_delivery_zone';
const SLOT_KEY    = 'ssp_pickup_slot';

const loadCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems]          = useState<CartItem[]>([]);
  const [toast, setToast]                  = useState<Toast | null>(null);
  const [cartOpen, setCartOpen]            = useState(false);
  // Collection is the default — customers only switch to delivery deliberately
  const [deliveryType, setDeliveryTypeRaw] = useState<string>('takeaway');
  const [zoneInfo, setZoneInfoRaw]         = useState<ZoneInfo | null>(null);
  const [pickupSlot, setPickupSlotRaw]     = useState<PickupSlot | null>(null);
  const [preorderSlot, setPreorderSlotRaw] = useState<PickupSlot | null>(null);
  const [hydrated, setHydrated]            = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The basket as last rendered, so the analytics calls below can read it without going through a state updater
  // (updaters may run more than once, and must not have side effects)
  const cartRef = useRef<CartItem[]>([]);
  useEffect(() => { cartRef.current = cartItems; }, [cartItems]);
  const { deliveryEnabled, loaded: kitchenLoaded } = useKitchen();

  // Hydrate from storage once on mount
  useEffect(() => {
    setCartItems(loadCart());
    try {
      const dt = sessionStorage.getItem(DT_KEY);
      if (dt === 'delivery' || dt === 'takeaway') setDeliveryTypeRaw(dt);
    } catch {}
    try {
      const zi = localStorage.getItem(ZONE_KEY);
      if (zi) setZoneInfoRaw(JSON.parse(zi));
    } catch {}
    try {
      const ps = sessionStorage.getItem(SLOT_KEY);
      if (ps) setPickupSlotRaw(JSON.parse(ps));
      const pre = sessionStorage.getItem(SLOT_KEY + '_preorder');
      if (pre) setPreorderSlotRaw(JSON.parse(pre));
    } catch {}
    setHydrated(true);
  }, []);

  // Another tab changed the cart (added items, or placed the order) — follow it,
  // so a stale tab can never resurrect a basket that has already been paid for.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCartItems(loadCart());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Persist cart to localStorage — but never before hydration, or the initial
  // empty state overwrites the saved cart
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems)); } catch {}
  }, [cartItems, hydrated]);

  // Setters that update state AND storage simultaneously
  const setPickupSlot = useCallback((slot: PickupSlot | null) => {
    setPickupSlotRaw(slot);
    try {
      if (slot) sessionStorage.setItem(SLOT_KEY, JSON.stringify(slot));
      else sessionStorage.removeItem(SLOT_KEY);
    } catch {}
  }, []);

  const setPreorderSlot = useCallback((slot: PickupSlot | null) => {
    setPreorderSlotRaw(slot);
    try {
      if (slot) sessionStorage.setItem(SLOT_KEY + '_preorder', JSON.stringify(slot));
      else sessionStorage.removeItem(SLOT_KEY + '_preorder');
    } catch {}
  }, []);

  const setDeliveryType = useCallback((type: string) => {
    // While the admin has delivery switched off this is the one place that
    // can never be routed around, no matter which screen calls it.
    const next = deliveryEnabled ? type : 'takeaway';
    record('delivery_type_selected', { method: next });
    setDeliveryTypeRaw(next);
    try { sessionStorage.setItem(DT_KEY, next); } catch {}
    if (next !== 'takeaway') { setPickupSlot(null); setPreorderSlot(null); }
  }, [setPickupSlot, setPreorderSlot, deliveryEnabled]);

  // Delivery switched off (or a stale 'delivery' choice restored from an old
  // session) — fall back to collection as soon as the server has told us.
  useEffect(() => {
    if (kitchenLoaded && !deliveryEnabled && deliveryType === 'delivery') {
      setDeliveryTypeRaw('takeaway');
      try { sessionStorage.setItem(DT_KEY, 'takeaway'); } catch {}
    }
  }, [kitchenLoaded, deliveryEnabled, deliveryType]);

  // A dish's price is whatever the menu says now, not what it was when it went in the basket: re-read it when the
  // page loads, the basket opens, the tab comes back or checkout opens, so a price changed in admin shows here too
  // (the server always charges the menu price, so a stale basket would show one figure and charge another).
  const refreshPrices = useCallback(async () => {
    if (!cartRef.current.length) return;
    try {
      const { data } = await api.get('/menu', { params: { available: true } });
      const now = new Map<string, number>((data || []).map((m: { id: string; price: number }) => [m.id, Number(m.price)]));
      setCartItems(prev => {
        let changed = false;
        const next = prev.map(i => {
          const price = now.get(i.id);
          if (price === undefined || Number.isNaN(price) || price === parseFloat(String(i.price).replace('£', ''))) return i;
          changed = true;
          return { ...i, price };
        });
        return changed ? next : prev;
      });
    } catch { /* keep the basket as it is — checkout prices it on the server anyway */ }
  }, []);
  useEffect(() => { if (hydrated) refreshPrices(); }, [hydrated, refreshPrices]);
  useEffect(() => { if (cartOpen) refreshPrices(); }, [cartOpen, refreshPrices]);
  useEffect(() => {
    window.addEventListener('focus', refreshPrices);
    return () => window.removeEventListener('focus', refreshPrices);
  }, [refreshPrices]);

  const setZoneInfo = useCallback((info: ZoneInfo | null) => {
    setZoneInfoRaw(info);
    try {
      if (info) localStorage.setItem(ZONE_KEY, JSON.stringify(info));
      else localStorage.removeItem(ZONE_KEY);
    } catch {}
  }, []);

  const showToast = useCallback((t: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => {
    return sum + (parseFloat(String(i.price).replace('£', '')) || 0) * i.quantity;
  }, 0);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    // Sections that are still "coming soon" (pickles, podis) cannot be bought, whichever button was pressed
    const category = (item as { category?: string }).category;
    if (category && !isOrderable(category)) return;
    trackAddToCart(item, 1);
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        showToast({ type: 'update', name: item.name, qty: existing.quantity + 1 });
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      showToast({ type: 'add', name: item.name, price: item.price });
      return [...prev, { ...item, quantity: 1 }];
    });
  }, [showToast]);

  const removeFromCart = useCallback((id: string) => {
    const item = cartRef.current.find(i => i.id === id);
    if (item) trackRemoveFromCart(item, item.quantity);
    setCartItems(prev => {
      const gone = prev.find(i => i.id === id);
      if (gone) showToast({ type: 'remove', name: gone.name });
      return prev.filter(i => i.id !== id);
    });
  }, [showToast]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    // The + and − buttons add to or take from the basket just as the Add and Remove buttons do, and are counted the same way
    const item = cartRef.current.find(i => i.id === id);
    if (item) {
      const change = quantity - item.quantity;
      if (change > 0) trackAddToCart(item, change);
      else if (change < 0) trackRemoveFromCart(item, Math.min(-change, item.quantity));
    }
    if (quantity > 0) record('cart_quantity_change', { item_id: id, quantity });
    if (quantity <= 0) {
      setCartItems(prev => {
        const item = prev.find(i => i.id === id);
        if (item) showToast({ type: 'remove', name: item.name });
        return prev.filter(i => i.id !== id);
      });
    } else {
      setCartItems(prev => {
        const item = prev.find(i => i.id === id);
        if (item) showToast({ type: 'update', name: item.name, qty: quantity });
        return prev.map(i => i.id === id ? { ...i, quantity } : i);
      });
    }
  }, [showToast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setPickupSlot(null);
    setPreorderSlot(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, [setPickupSlot, setPreorderSlot]);

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal,
      addToCart, removeFromCart, updateQuantity, clearCart, refreshPrices,
      toast, cartOpen, setCartOpen,
      deliveryType, setDeliveryType,
      zoneInfo, setZoneInfo,
      pickupSlot, setPickupSlot,
      preorderSlot, setPreorderSlot,
    }}>
      {children}
    </CartContext.Provider>
  );
};
