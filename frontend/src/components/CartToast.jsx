import React from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartToast = () => {
  const { toast, cartCount } = useCart();

  if (!toast) return null;

  return (
    <div
      className="fixed top-24 right-4 z-[100] animate-slide-in-right"
      data-testid="cart-toast"
    >
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-lg shadow-2xl border"
        style={{
          backgroundColor: '#1a472a',
          borderColor: 'rgba(74, 124, 89, 0.5)',
          minWidth: '300px',
          maxWidth: '400px',
        }}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(74, 200, 100, 0.2)' }}
        >
          <Check size={20} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{toast.name}</p>
          <p className="text-green-300 text-xs mt-0.5">Added to cart — {toast.price}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <ShoppingCart size={14} className="text-green-300" />
          <span className="text-white text-xs font-bold">{cartCount}</span>
        </div>
      </div>
    </div>
  );
};

export default CartToast;
