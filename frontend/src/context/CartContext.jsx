import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext();
const STORAGE_KEY = 'ssp_cart';

const loadCart = () => {
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

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadCart);
  const [toast, setToast]         = useState(null);
  const [cartOpen, setCartOpen]   = useState(false);
  const toastTimer = React.useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems)); } catch {}
  }, [cartItems]);

  const showToast = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => {
    return sum + (parseFloat(String(i.price).replace('£', '')) || 0) * i.quantity;
  }, 0);

  const addToCart = useCallback((item) => {
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

  const removeFromCart = useCallback((id) => {
    setCartItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) showToast({ type: 'remove', name: item.name });
      return prev.filter(i => i.id !== id);
    });
  }, [showToast]);

  const updateQuantity = useCallback((id, quantity) => {
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
    }}>
      {children}
    </CartContext.Provider>
  );
};
