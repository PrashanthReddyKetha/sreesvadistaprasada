'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Truck, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import api from '../api';

const FREE_DELIVERY_THRESHOLD = 30;
const DELIVERY_FEE = 3.99;
const price = (val) => parseFloat(String(val).replace('£', '')) || 0;
const fmt = (n) => `£${n.toFixed(2)}`;

function DeliveryBar({ total }) {
  const remaining = FREE_DELIVERY_THRESHOLD - total;
  const pct = Math.min((total / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const isFree = total >= FREE_DELIVERY_THRESHOLD;
  return (
    <div className="px-6 py-3 border-b" style={{ backgroundColor: isFree ? '#F0FFF4' : '#FFFBEB', borderColor: 'rgba(128,0,32,0.08)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Truck size={13} style={{ color: isFree ? '#166534' : '#B8860B' }} />
          {isFree ? (
            <span className="text-xs font-semibold" style={{ color: '#166534' }}>Delivery's on us.</span>
          ) : (
            <span className="text-xs font-medium text-gray-600">
              Add <strong style={{ color: '#800020' }}>{fmt(remaining)}</strong> more and delivery's on us
            </span>
          )}
        </div>
        {!isFree && <span className="text-[10px] text-gray-400">{fmt(DELIVERY_FEE)} fee</span>}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: isFree ? '#166534' : '#B8860B' }} />
      </div>
    </div>
  );
}

const COMPLEMENTS = {
  nonVeg: ['pickles', 'podis', 'veg', 'prasada'],
  veg: ['pickles', 'podis', 'nonVeg', 'prasada'],
  prasada: ['pickles', 'podis', 'veg', 'nonVeg'],
  breakfast: ['snacks', 'pickles', 'podis'],
  snacks: ['pickles', 'podis', 'breakfast'],
  pickles: ['nonVeg', 'veg', 'prasada'],
  podis: ['nonVeg', 'veg', 'prasada'],
};

function scoreComplement(item, cartCategories) {
  let best = 99;
  for (const cat of cartCategories) {
    const list = COMPLEMENTS[cat] || [];
    const idx = list.indexOf(item.category);
    if (idx !== -1 && idx < best) best = idx;
  }
  return best;
}

function UpsellRow({ cartItems, onAdd }) {
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    api.get('/menu?available=true').then(r => {
      const cartIds = new Set(cartItems.map(i => i.id));
      const cartCats = [...new Set(cartItems.map(i => i.category))];
      const candidates = r.data
        .filter(i => !cartIds.has(i.id))
        .map(i => ({ ...i, _score: scoreComplement(i, cartCats) }))
        .filter(i => i._score < 99)
        .sort((a, b) => a._score - b._score || a.price - b.price)
        .slice(0, 4);
      setSuggestions(candidates);
    }).catch(() => {});
  }, [cartItems]);

  if (suggestions.length === 0) return null;
  return (
    <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(128,0,32,0.08)', backgroundColor: '#FDFBF7' }}>
      <div className="flex items-center gap-1.5 mb-3">
        <Zap size={13} style={{ color: '#B8860B' }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B8860B' }}>Goes well on the same plate</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {suggestions.map(item => (
          <div key={item.id} className="flex-shrink-0 w-28 rounded-xl overflow-hidden border group" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: 'white' }}>
            {item.image && <div className="h-16 overflow-hidden"><img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>}
            <div className="p-2">
              <p className="text-[10px] font-semibold leading-tight mb-1 line-clamp-2" style={{ color: '#2D2422' }}>{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: '#800020' }}>{fmt(price(item.price))}</span>
                <button onClick={() => onAdd(item)} className="w-5 h-5 rounded-full flex items-center justify-center text-white transition-all hover:scale-110" style={{ backgroundColor: '#800020' }}>
                  <Plus size={10} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CartDrawer = () => {
  const router = useRouter();
  const { cartItems, cartCount, cartTotal, cartOpen, setCartOpen, updateQuantity, removeFromCart, addToCart } = useCart();
  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = cartTotal + deliveryFee;

  if (!cartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/50" onClick={() => setCartOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md flex flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(128,0,32,0.12)', background: 'linear-gradient(135deg, #800020 0%, #5C0018 100%)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-white" />
            <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Basket ({cartCount})
            </h2>
          </div>
          <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-full transition-colors text-white/80 hover:text-white"><X size={20} /></button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={52} className="mb-4 opacity-20" />
            <p className="text-base font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Nothing packed yet</p>
            <p className="text-xs text-gray-400 mb-5 italic">Start with a dish you miss.</p>
            <button onClick={() => setCartOpen(false)} className="text-sm font-semibold" style={{ color: '#800020' }}>Open the Menu →</button>
          </div>
        ) : (
          <>
            <DeliveryBar total={cartTotal} />
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-0" style={{ borderColor: '#f0ebe6' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                        <ShoppingBag size={20} style={{ color: '#800020', opacity: 0.4 }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight" style={{ color: '#2D2422' }}>{item.name}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: '#800020' }}>
                        {fmt(price(item.price) * item.quantity)}
                        {item.quantity > 1 && <span className="text-xs font-normal text-gray-400 ml-1">({fmt(price(item.price))} each)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]" style={{ borderColor: '#ddd', color: '#5C4B47' }}><Minus size={11} /></button>
                      <span className="w-5 text-center text-sm font-bold" style={{ color: '#2D2422' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]" style={{ borderColor: '#ddd', color: '#5C4B47' }}><Plus size={11} /></button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-1 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <UpsellRow cartItems={cartItems} onAdd={addToCart} />
            </div>
            <div className="flex-shrink-0 px-6 py-4 border-t space-y-3" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: '#FDFBF7' }}>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500"><Truck size={11} /> Delivery</span>
                  {deliveryFee === 0 ? <span className="font-semibold text-xs" style={{ color: '#166534' }}>Free</span> : <span className="text-gray-500">{fmt(deliveryFee)}</span>}
                </div>
                <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
                  <span style={{ color: '#2D2422' }}>Total</span>
                  <span style={{ color: '#800020' }}>{fmt(grandTotal)}</span>
                </div>
              </div>
              <button onClick={() => { setCartOpen(false); router.push('/checkout'); }}
                className="w-full py-3.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                style={{ backgroundColor: '#800020' }}>
                Send it Home <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
