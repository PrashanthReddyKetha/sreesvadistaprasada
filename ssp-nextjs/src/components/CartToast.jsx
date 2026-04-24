'use client';
import React from 'react';
import { Check, Trash2, RefreshCw, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CONFIGS = {
  add: {
    bg: '#14532D',
    border: 'rgba(74,200,100,0.4)',
    iconBg: 'rgba(74,200,100,0.2)',
    Icon: Check,
    iconColor: '#4ADE80',
    subtitleColor: '#86EFAC',
    label: (t) => `Added to basket — ${typeof t.price === 'number' ? `£${t.price.toFixed(2)}` : t.price || ''}`,
  },
  remove: {
    bg: '#7F1D1D',
    border: 'rgba(248,113,113,0.4)',
    iconBg: 'rgba(248,113,113,0.2)',
    Icon: Trash2,
    iconColor: '#F87171',
    subtitleColor: '#FCA5A5',
    label: () => 'Removed from basket',
  },
  update: {
    bg: '#1E3A5F',
    border: 'rgba(96,165,250,0.4)',
    iconBg: 'rgba(96,165,250,0.2)',
    Icon: RefreshCw,
    iconColor: '#60A5FA',
    subtitleColor: '#93C5FD',
    label: (t) => `Quantity updated to ${t.qty}`,
  },
};

const CartToast = () => {
  const { toast, cartCount } = useCart();
  if (!toast) return null;

  const cfg = CONFIGS[toast.type] || CONFIGS.add;
  const { Icon } = cfg;

  return (
    <div className="fixed top-24 right-4 z-[9999] animate-slide-in-right" data-testid="cart-toast">
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-xl shadow-2xl border"
        style={{
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          minWidth: '300px',
          maxWidth: '400px',
        }}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: cfg.iconBg }}>
          <Icon size={18} style={{ color: cfg.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{toast.name}</p>
          <p className="text-xs mt-0.5" style={{ color: cfg.subtitleColor }}>{cfg.label(toast)}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
          <ShoppingCart size={13} className="text-white/70" />
          <span className="text-white text-xs font-bold">{cartCount}</span>
        </div>
      </div>
    </div>
  );
};

export default CartToast;
