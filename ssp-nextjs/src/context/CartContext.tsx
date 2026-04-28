'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number | string;
  image?: string;
  category?: string;
  quantity: number;
}

interface Toast {
  type: 'add' | 'update' | 'remove';
  name: string;
  qty?: number;
  price?: number | string;
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
  toast: Toast | null;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  // Shared delivery prefs — single source of truth for CartDrawer + Checkout
  deliveryType: string;
  setDeliveryType: (type: string) => void;
  zoneInfo: ZoneInfo | null;
  setZoneInfo: (info: ZoneInfo | null) => void;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'ssp_cart';
const DT_KEY      = 'ssp_delivery_type';
const ZONE_KEY    = 'ssp_delivery_zone';

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
  const [deliveryType, setDeliveryTypeRaw] = useState<string>('delivery');
  const [zoneInfo, setZoneInfoRaw]         = useState<ZoneInfo | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems)); } catch {}
  }, [cartItems]);

  // Setters that update state AND storage simultaneously
  const setDeliveryType = useCallback((type: string) => {
    setDeliveryTypeRaw(type);
    try { sessionStorage.setItem(DT_KEY, type); } catch {}
  }, []);

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
    setCartItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) showToast({ type: 'remove', name: item.name });
      return prev.filter(i => i.id !== id);
    });
  }, [showToast]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
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
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal,
      addToCart, removeFromCart, updateQuantity, clearCart,
      toast, cartOpen, setCartOpen,
      deliveryType, setDeliveryType,
      zoneInfo, setZoneInfo,
    }}>
      {children}
    </CartContext.Provider>
  );
};
