import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Truck, Zap, Gift, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import LoyaltyProgressBar from './LoyaltyProgressBar';

const FREE_DELIVERY_THRESHOLD = 30;
const DELIVERY_FEE = 3.99;
const price = (val) => parseFloat(String(val).replace('£', '')) || 0;
const fmt   = (n)   => `£${n.toFixed(2)}`;

/* ── Free delivery bar ────────────────────────────────────────────────────── */
function DeliveryBar({ total, deliveryType }) {
  if (deliveryType === 'takeaway') return null;
  const remaining = FREE_DELIVERY_THRESHOLD - total;
  const pct = Math.min((total / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const isFree = total >= FREE_DELIVERY_THRESHOLD;
  return (
    <div className="px-6 py-3 border-b" style={{ backgroundColor: isFree ? '#F0FFF4' : '#FFFBEB', borderColor: 'rgba(128,0,32,0.08)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Truck size={13} style={{ color: isFree ? '#166534' : '#B8860B' }} />
          {isFree
            ? <span className="text-xs font-semibold" style={{ color: '#166534' }}>Delivery's on us.</span>
            : <span className="text-xs font-medium text-gray-600">Add <strong style={{ color: '#800020' }}>{fmt(remaining)}</strong> more and delivery's on us</span>
          }
        </div>
        {!isFree && <span className="text-[10px] text-gray-400">{fmt(DELIVERY_FEE)} fee</span>}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: isFree ? '#166534' : '#B8860B' }} />
      </div>
    </div>
  );
}

/* ── Smart upsell ─────────────────────────────────────────────────────────── */
const COMPLEMENTS = {
  nonVeg:    ['pickles', 'podis', 'veg', 'prasada'],
  veg:       ['pickles', 'podis', 'nonVeg', 'prasada'],
  prasada:   ['pickles', 'podis', 'veg', 'nonVeg'],
  breakfast: ['snacks', 'pickles', 'podis'],
  snacks:    ['pickles', 'podis', 'breakfast'],
  pickles:   ['nonVeg', 'veg', 'prasada'],
  podis:     ['nonVeg', 'veg', 'prasada'],
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
      const cartIds  = new Set(cartItems.map(i => i.id));
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
          <div key={item.id} className="flex-shrink-0 w-28 rounded-xl overflow-hidden border group"
            style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: 'white' }}>
            {item.image && <div className="h-16 overflow-hidden"><img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>}
            <div className="p-2">
              <p className="text-[10px] font-semibold leading-tight mb-1 line-clamp-2" style={{ color: '#2D2422' }}>{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: '#800020' }}>{fmt(price(item.price))}</span>
                <button onClick={() => onAdd(item)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  style={{ backgroundColor: '#800020' }}>
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

/* ── Free item picker modal ───────────────────────────────────────────────── */
function FreeItemModal({ onSelect, onClose }) {
  const [items, setItems]   = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/menu?available=true')
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Gift size={18} style={{ color: '#800020' }} />
              <h3 className="font-bold text-base" style={{ color: '#800020', fontFamily: "'Playfair Display', serif" }}>
                Choose your free dish
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={17} /></button>
          </div>
          <p className="text-xs text-[#5C4B47] mb-3">Any item from our entire menu — completely free.</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search dishes…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border-2 focus:outline-none"
              style={{ borderColor: 'rgba(128,0,32,0.2)', color: '#2D2422' }}
            />
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {loading && (
            <div className="flex justify-center py-10">
              <span className="w-6 h-6 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" />
            </div>
          )}
          {!loading && filtered.map(item => (
            <button key={item.id} onClick={() => onSelect(item)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-[#800020] hover:bg-[#800020]/3"
              style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
              {item.image
                ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                : <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(128,0,32,0.06)' }}>
                    <ShoppingBag size={16} style={{ color: '#800020', opacity: 0.4 }} />
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#2D2422' }}>{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs line-through text-gray-400">{fmt(price(item.price))}</span>
                  <span className="text-xs font-bold text-green-700">FREE</span>
                </div>
              </div>
              <Plus size={16} style={{ color: '#800020', flexShrink: 0 }} />
            </button>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No dishes found</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
const CartDrawer = () => {
  const navigate = useNavigate();
  const { cartItems, cartCount, cartTotal, cartOpen, setCartOpen, updateQuantity, removeFromCart, addToCart } = useCart();
  const { user, setAuthOpen } = useAuth();

  const [deliveryType, setDeliveryType] = useState('delivery');
  const [loyalty, setLoyalty]           = useState(null);
  const [freeItem, setFreeItem]         = useState(null);   // selected free item
  const [showPicker, setShowPicker]     = useState(false);

  useEffect(() => {
    if (user && cartOpen) {
      api.get('/loyalty/status').then(r => setLoyalty(r.data)).catch(() => {});
    }
    if (!cartOpen) { setShowPicker(false); }
  }, [user, cartOpen]);

  // When drawer closes, reset free item only if it wasn't locked in
  useEffect(() => { if (!cartOpen) setShowPicker(false); }, [cartOpen]);

  const pendingReward = loyalty?.pending_reward ?? false;

  const baseSubtotal     = cartTotal;
  const freeItemPrice    = freeItem ? price(freeItem.price) : 0;
  // Takeaway discount applies to the paying subtotal (regular items only, not the free one)
  const takeawayDiscount = deliveryType === 'takeaway' && baseSubtotal >= 15
    ? Math.round(baseSubtotal * 0.10 * 100) / 100 : 0;
  // Free delivery threshold counts all items (including free dish, since it still needs delivery)
  const deliveryFee      = deliveryType === 'takeaway' ? 0
    : ((baseSubtotal + freeItemPrice) >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);
  const grandTotal       = baseSubtotal - takeawayDiscount + deliveryFee;

  const handleClose = () => setCartOpen(false);

  const goToCheckout = () => {
    setCartOpen(false);
    navigate('/checkout', {
      state: {
        deliveryType,
        freeItem: freeItem ? {
          id: freeItem.id,
          name: freeItem.name,
          original_price: price(freeItem.price),
        } : null,
      },
    });
  };

  const handleSelectFreeItem = async (item) => {
    try {
      await api.post('/loyalty/redeem', { free_item_id: item.id });
    } catch (e) {
      // If the backend rejects (no pending reward, item unavailable etc.), bail out
      if (e.response?.status === 400 || e.response?.status === 403) return;
      // Network or server errors — still allow selection so checkout can validate
    }
    setFreeItem(item);
    setShowPicker(false);
  };

  if (!cartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/50" onClick={handleClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md flex flex-col bg-white shadow-2xl">

        {showPicker && (
          <FreeItemModal onSelect={handleSelectFreeItem} onClose={() => setShowPicker(false)} />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(128,0,32,0.12)', background: 'linear-gradient(135deg, #800020 0%, #5C0018 100%)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-white" />
            <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Basket ({cartCount})
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full transition-colors text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={52} className="mb-4 opacity-20" />
            <p className="text-base font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Nothing packed yet</p>
            <p className="text-xs text-gray-400 mb-5 italic">Start with a dish you miss.</p>
            <button onClick={handleClose} className="text-sm font-semibold" style={{ color: '#800020' }}>Open the Menu →</button>
          </div>
        ) : (
          <>
            <DeliveryBar total={cartTotal} deliveryType={deliveryType} />

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-0" style={{ borderColor: '#f0ebe6' }}>
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                      : <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                          <ShoppingBag size={20} style={{ color: '#800020', opacity: 0.4 }} />
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight" style={{ color: '#2D2422' }}>{item.name}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: '#800020' }}>
                        {fmt(price(item.price) * item.quantity)}
                        {item.quantity > 1 && <span className="text-xs font-normal text-gray-400 ml-1">({fmt(price(item.price))} each)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                        style={{ borderColor: '#ddd', color: '#5C4B47' }}><Minus size={11} /></button>
                      <span className="w-5 text-center text-sm font-bold" style={{ color: '#2D2422' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                        style={{ borderColor: '#ddd', color: '#5C4B47' }}><Plus size={11} /></button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-1 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Selected free item row */}
                {freeItem && (
                  <div className="flex items-center gap-3 pb-3 border-b border-dashed" style={{ borderColor: '#F4C430' }}>
                    {freeItem.image
                      ? <img src={freeItem.image} alt={freeItem.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 ring-2 ring-[#F4C430]" />
                      : <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#F4C430]/20 ring-2 ring-[#F4C430]">
                          <Gift size={20} style={{ color: '#800020' }} />
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight" style={{ color: '#2D2422' }}>{freeItem.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs line-through text-gray-400">{fmt(price(freeItem.price))}</span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#800020] text-white">FREE</span>
                      </div>
                    </div>
                    <button onClick={() => setFreeItem(null)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <UpsellRow cartItems={cartItems} onAdd={addToCart} />
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: '#FDFBF7' }}>

              {/* Delivery type selector */}
              <div className="px-4 pt-4 pb-2 space-y-2">
                <p className="text-[11px] font-semibold text-[#5C4B47] uppercase tracking-wide">How would you like your order?</p>
                <label className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${deliveryType === 'takeaway' ? 'border-[#800020] bg-[#800020]/5' : 'border-[#F4C430]/60 bg-[#F4C430]/5'}`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="dtype" value="takeaway" checked={deliveryType === 'takeaway'}
                      onChange={() => setDeliveryType('takeaway')} className="accent-[#800020]" />
                    <div>
                      <div className="font-semibold text-[#2D2422] text-xs">Collection / Takeaway</div>
                      <div className="text-[11px] text-green-700 font-medium">Save 10% on your order</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#5C4B47]">Delivery fee</div>
                    <div className="font-bold text-green-700 text-xs">£0.00</div>
                  </div>
                </label>
                <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                  ${deliveryType === 'delivery' ? 'border-[#800020] bg-[#800020]/5' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="dtype" value="delivery" checked={deliveryType === 'delivery'}
                      onChange={() => setDeliveryType('delivery')} className="accent-[#800020]" />
                    <div>
                      <div className="font-medium text-[#2D2422] text-xs">Home delivery</div>
                      <div className="text-[11px] text-[#9CA3AF]">
                        {cartTotal >= FREE_DELIVERY_THRESHOLD ? 'Free delivery' : 'Delivery fee applies'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#5C4B47]">Delivery fee</div>
                    <div className="font-bold text-[#2D2422] text-xs">
                      {cartTotal >= FREE_DELIVERY_THRESHOLD ? '£0.00' : fmt(DELIVERY_FEE)}
                    </div>
                  </div>
                </label>
                {deliveryType === 'takeaway' && takeawayDiscount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                    <span className="text-green-700 text-xs font-semibold">You save {fmt(takeawayDiscount)} by collecting!</span>
                  </div>
                )}
              </div>

              {/* Loyalty section */}
              <div className="border-t border-[#F4C430]/20 mx-4 pt-2">
                {user ? (
                  pendingReward && !freeItem ? (
                    <div className="py-2">
                      <div className="bg-[#800020] text-white rounded-xl p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold">🎁 Your free dish is ready!</p>
                          <p className="text-[11px] text-white/75 mt-0.5">Add any item from our menu — on us.</p>
                        </div>
                        <button
                          onClick={() => setShowPicker(true)}
                          className="flex-shrink-0 bg-[#F4C430] text-[#800020] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#e5b520] transition-colors">
                          Choose dish
                        </button>
                      </div>
                    </div>
                  ) : (
                    <LoyaltyProgressBar
                      orderCount={loyalty?.order_count ?? 0}
                      pendingReward={pendingReward}
                      compact={true}
                    />
                  )
                ) : (
                  <p className="text-[11px] text-[#5C4B47] text-center py-2.5">
                    🎁{' '}
                    <button onClick={() => { handleClose(); setAuthOpen(true); }} className="underline">Sign in</button>
                    {' '}to earn loyalty rewards — free dish every 5 orders
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="px-4 pb-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span><span>{fmt(baseSubtotal)}</span>
                  </div>
                  {freeItem && (
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5" style={{ color: '#166534' }}>
                        <Gift size={11} /> {freeItem.name}
                      </span>
                      <span className="font-semibold" style={{ color: '#166534' }}>FREE</span>
                    </div>
                  )}
                  {takeawayDiscount > 0 && (
                    <div className="flex justify-between text-xs text-green-700 font-medium">
                      <span>Takeaway discount (10%)</span><span>- {fmt(takeawayDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1 text-gray-500"><Truck size={11} /> Delivery</span>
                    {deliveryFee === 0
                      ? <span className="font-semibold text-xs" style={{ color: '#166534' }}>Free</span>
                      : <span className="text-gray-500">{fmt(deliveryFee)}</span>
                    }
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
                    <span style={{ color: '#2D2422' }}>Total</span>
                    <span style={{ color: '#800020' }}>{fmt(grandTotal)}</span>
                  </div>
                </div>

                <button onClick={goToCheckout}
                  className="w-full py-3.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                  style={{ backgroundColor: '#800020' }}>
                  {deliveryType === 'takeaway' ? 'Collect my order' : 'Send it Home'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
