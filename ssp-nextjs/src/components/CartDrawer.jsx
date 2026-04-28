'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Truck, Zap, Gift, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const MINIMUM_ORDER = 15.00;
const price = (val) => parseFloat(String(val).replace('£', '')) || 0;
const fmt   = (n)   => `£${Number(n).toFixed(2)}`;

// ── Free delivery progress bar ────────────────────────────────────────────────
function DeliveryBar({ subtotal, freeOver }) {
  const remaining = freeOver - subtotal;
  const pct       = Math.min((subtotal / freeOver) * 100, 100);
  const isFree    = subtotal >= freeOver;
  return (
    <div className="px-6 py-3 border-b" style={{ backgroundColor: isFree ? '#F0FFF4' : '#FFFBEB', borderColor: 'rgba(128,0,32,0.08)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Truck size={13} style={{ color: isFree ? '#166534' : '#B8860B' }} />
          {isFree
            ? <span className="text-xs font-semibold" style={{ color: '#166534' }}>Delivery&apos;s on us!</span>
            : <span className="text-xs font-medium text-gray-600">
                Add <strong style={{ color: '#800020' }}>{fmt(remaining)}</strong> more for free delivery
              </span>
          }
        </div>
        {!isFree && <span className="text-[10px] text-gray-400">Free over {fmt(freeOver)}</span>}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: isFree ? '#166534' : '#B8860B' }} />
      </div>
    </div>
  );
}

// ── Minimum order progress bar ────────────────────────────────────────────────
function MinOrderBar({ subtotal }) {
  const remaining = MINIMUM_ORDER - subtotal;
  const pct       = Math.min((subtotal / MINIMUM_ORDER) * 100, 100);
  return (
    <div className="px-6 py-3 border-b" style={{ backgroundColor: '#FFF7ED', borderColor: 'rgba(128,0,32,0.08)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <AlertCircle size={13} style={{ color: '#C2410C' }} />
          <span className="text-xs font-medium" style={{ color: '#C2410C' }}>
            Add <strong>{fmt(remaining)}</strong> more to place an order
          </span>
        </div>
        <span className="text-[10px] text-gray-400">Min. {fmt(MINIMUM_ORDER)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: '#C2410C' }} />
      </div>
    </div>
  );
}

// ── Upsell row ────────────────────────────────────────────────────────────────
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
          <div key={item.id} className="flex-shrink-0 w-28 rounded-xl overflow-hidden border group" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: 'white' }}>
            {item.image && <div className="h-16 overflow-hidden"><img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>}
            <div className="p-2">
              <p className="text-[10px] font-semibold leading-tight mb-1 line-clamp-2" style={{ color: '#2D2422' }}>{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: '#800020' }}>{fmt(price(item.price))}</span>
                <button onClick={() => onAdd(item)} className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#800020' }}>
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

// ── Free item picker ──────────────────────────────────────────────────────────
function FreeItemPicker({ onSelect, onSkip }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/menu?available=true').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const shown = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col" style={{ maxHeight: '70vh' }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
        <p className="text-sm font-bold mb-1" style={{ color: '#800020' }}>🎁 Choose your free dish</p>
        <p className="text-xs text-gray-500 mb-2">Any item from our full menu — completely free.</p>
        <input type="text" placeholder="Search dishes…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
          style={{ borderColor: 'rgba(128,0,32,0.2)', color: '#2D2422' }} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {loading && <div className="flex justify-center py-8"><span className="w-5 h-5 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" /></div>}
        {shown.map(item => (
          <button key={item.id} onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-[#800020]/40"
            style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
            {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#2D2422' }}>{item.name}</p>
              <p className="text-xs line-through text-gray-400">{fmt(price(item.price))}</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>FREE</span>
          </button>
        ))}
      </div>
      <div className="px-5 py-3 border-t" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
        <button onClick={onSkip} className="w-full text-xs text-center text-gray-400 hover:text-gray-600">Skip for now — choose at checkout</button>
      </div>
    </div>
  );
}

// ── Postcode input ────────────────────────────────────────────────────────────
function PostcodeInput({ onZoneFound }) {
  const [pc, setPc]             = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError]       = useState('');

  const check = async (val) => {
    const stripped = val.replace(/\s/g, '');
    if (stripped.length < 3) return;
    setChecking(true); setError('');
    try {
      const r = await api.get(`/orders/check-postcode?postcode=${encodeURIComponent(val)}`);
      if (r.data.deliverable) {
        onZoneFound(r.data); // context setter handles persistence
      } else {
        setError("We don't deliver to this postcode yet — switch to Collect & save 10%.");
      }
    } catch (e) {
      if (e.response?.status === 404) {
        setError("We don't deliver to this postcode yet — switch to Collect & save 10%.");
      } else {
        setError('Could not verify postcode — please try again.');
      }
    } finally { setChecking(false); }
  };

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
    setPc(val);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      check(pc);
    }
  };

  return (
    <div className="px-6 py-3 border-b" style={{ borderColor: 'rgba(128,0,32,0.08)', backgroundColor: '#FDFBF7' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: '#5C4B47' }}>
        <MapPin size={11} className="inline mr-1" />What&apos;s your delivery postcode?
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text" value={pc} onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder="e.g. MK12 6LF" maxLength={8}
            className="w-full px-3 py-2 rounded-xl border text-sm uppercase focus:outline-none transition-colors"
            style={{ borderColor: error ? '#EF4444' : 'rgba(128,0,32,0.2)', color: '#2D2422', backgroundColor: 'white' }}
          />
          {checking && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" />
          )}
        </div>
        <button
          onClick={() => check(pc)}
          disabled={checking || pc.replace(/\s/g, '').length < 3}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-white flex-shrink-0 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#800020' }}>
          Check
        </button>
      </div>
      {error
        ? <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#EF4444' }}>{error}</p>
        : <p className="text-[11px] mt-1 text-gray-400">Enter your postcode and press Enter or Check</p>
      }
    </div>
  );
}

// ── Main CartDrawer ───────────────────────────────────────────────────────────
const CartDrawer = () => {
  const router = useRouter();
  const { cartItems, cartCount, cartTotal, cartOpen, setCartOpen, updateQuantity, removeFromCart, addToCart,
          deliveryType, setDeliveryType, zoneInfo, setZoneInfo } = useCart();
  const { user } = useAuth();

  const [loyaltyStatus, setLoyaltyStatus] = useState(null);
  const [freeItem, setFreeItem]           = useState(null);
  const [showPicker, setShowPicker]       = useState(false);

  // Hide picker when cart closes
  useEffect(() => {
    if (!cartOpen) setShowPicker(false);
  }, [cartOpen]);

  // Fetch loyalty status when drawer opens
  useEffect(() => {
    if (cartOpen && user) {
      api.get('/loyalty/status').then(r => setLoyaltyStatus(r.data)).catch(() => {});
    }
  }, [cartOpen, user]);

  const pendingReward     = loyaltyStatus?.pending_reward ?? false;
  const freeItemPrice     = freeItem ? price(freeItem.price) : 0;
  const effectiveSubtotal = cartTotal + freeItemPrice;
  const meetsMinimum      = effectiveSubtotal >= MINIMUM_ORDER;

  // Client-side preview pricing
  const takeawayDiscount = deliveryType === 'takeaway' && meetsMinimum
    ? Math.round(effectiveSubtotal * 0.10 * 100) / 100 : 0;

  const deliveryFee = (() => {
    if (deliveryType === 'takeaway') return 0;
    if (!zoneInfo) return null; // unknown until postcode entered
    return effectiveSubtotal >= zoneInfo.free_delivery_over ? 0 : zoneInfo.delivery_fee;
  })();

  const smallOrderFee = (() => {
    if (deliveryType === 'takeaway' || !zoneInfo || !meetsMinimum) return 0;
    return effectiveSubtotal <= 19.99 ? 1.50 : 0;
  })();

  const grandTotal = (() => {
    if (!meetsMinimum) return effectiveSubtotal;
    if (deliveryType === 'takeaway') return Math.round((effectiveSubtotal - takeawayDiscount) * 100) / 100;
    if (deliveryFee === null) return effectiveSubtotal;
    return Math.round((effectiveSubtotal + smallOrderFee + deliveryFee - takeawayDiscount) * 100) / 100;
  })();

  const needsPostcode = deliveryType === 'delivery' && !zoneInfo;

  const handleSelectFreeItem = async (item) => {
    try { await api.post('/loyalty/redeem', { item_id: item.id }); }
    catch (e) { if (e.response?.status === 400 || e.response?.status === 403) return; }
    setFreeItem(item);
    setShowPicker(false);
  };

  const handleCheckout = () => {
    try {
      // deliveryType + zoneInfo already live in context/storage; only freeItem needs handoff
      sessionStorage.setItem('ssp_checkout_state', JSON.stringify({ freeItem }));
    } catch {}
    setCartOpen(false);
    router.push('/checkout');
  };

  if (!cartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/50" onClick={() => setCartOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md flex flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(128,0,32,0.12)', background: 'linear-gradient(135deg, #800020 0%, #5C0018 100%)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-white" />
            <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Basket ({cartCount})
            </h2>
          </div>
          <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-full text-white/80 hover:text-white"><X size={20} /></button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={52} className="mb-4 opacity-20" />
            <p className="text-base font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Nothing packed yet</p>
            <p className="text-xs text-gray-400 mb-5 italic">Start with a dish you miss.</p>
            <button onClick={() => setCartOpen(false)} className="text-sm font-semibold" style={{ color: '#800020' }}>Open the Menu →</button>
          </div>
        ) : showPicker ? (
          <FreeItemPicker onSelect={handleSelectFreeItem} onSkip={() => setShowPicker(false)} />
        ) : (
          <>
            {/* Delivery / Takeaway toggle */}
            <div className="px-6 py-3 border-b flex gap-2" style={{ borderColor: 'rgba(128,0,32,0.08)', backgroundColor: '#FDFBF7' }}>
              {[
                { id: 'delivery', label: '🚚 Delivery' },
                { id: 'takeaway', label: '🛵 Collect & save 10%' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setDeliveryType(opt.id)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: deliveryType === opt.id ? '#800020' : 'white',
                    color: deliveryType === opt.id ? 'white' : '#5C4B47',
                    border: deliveryType === opt.id ? 'none' : '1px solid rgba(128,0,32,0.2)',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Takeaway: saving callout */}
            {deliveryType === 'takeaway' && meetsMinimum && (
              <div className="px-6 py-2.5 border-b flex items-center"
                style={{ backgroundColor: '#F0FFF4', borderColor: 'rgba(22,101,52,0.2)' }}>
                <span className="text-xs font-semibold" style={{ color: '#166534' }}>
                  🎉 You save {fmt(takeawayDiscount)} by collecting — no delivery fee either!
                </span>
              </div>
            )}

            {/* Delivery: postcode input */}
            {deliveryType === 'delivery' && !zoneInfo && (
              <PostcodeInput onZoneFound={setZoneInfo} />
            )}

            {/* Delivery: zone confirmed */}
            {deliveryType === 'delivery' && zoneInfo && (
              <div className="px-6 py-2 border-b flex items-center justify-between"
                style={{ backgroundColor: '#F0FFF4', borderColor: 'rgba(22,101,52,0.15)' }}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={13} style={{ color: '#166534' }} />
                  <span className="text-xs font-semibold" style={{ color: '#166534' }}>
                    Delivering to {zoneInfo.postcode} · {fmt(zoneInfo.delivery_fee)} fee
                  </span>
                </div>
                <button onClick={() => setZoneInfo(null)}
                  className="text-[11px] underline" style={{ color: '#5C4B47' }}>
                  Change
                </button>
              </div>
            )}

            {/* Takeaway nudge — shown on delivery to encourage switching */}
            {deliveryType === 'delivery' && meetsMinimum && (
              <div className="px-6 py-2 border-b flex items-center justify-between gap-2"
                style={{ backgroundColor: '#FFFBEB', borderColor: 'rgba(180,101,11,0.15)' }}>
                <span className="text-[11px] font-medium" style={{ color: '#92400E' }}>
                  🛵 Collect & save <strong>10%</strong> — switch above to apply
                </span>
                <button onClick={() => setDeliveryType('takeaway')}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                  style={{ backgroundColor: '#B45309', color: 'white' }}>
                  Switch
                </button>
              </div>
            )}

            {/* Min order bar or free delivery bar */}
            {!meetsMinimum
              ? <MinOrderBar subtotal={effectiveSubtotal} />
              : deliveryType === 'delivery' && zoneInfo
                ? <DeliveryBar subtotal={effectiveSubtotal} freeOver={zoneInfo.free_delivery_over} />
                : null
            }

            {/* Small order fee nudge */}
            {deliveryType === 'delivery' && zoneInfo && meetsMinimum && smallOrderFee > 0 && (
              <div className="px-6 py-2 border-b text-xs"
                style={{ backgroundColor: '#FFFBEB', borderColor: 'rgba(128,0,32,0.08)', color: '#92400E' }}>
                <AlertCircle size={11} className="inline mr-1" />
                <strong>£1.50 small order fee</strong> on orders under £20 — add {fmt(20 - effectiveSubtotal)} more to waive it.
              </div>
            )}

            {/* Loyalty reward banner */}
            {pendingReward && !freeItem && (
              <div className="px-6 py-3 border-b flex items-center justify-between gap-3"
                style={{ backgroundColor: 'rgba(128,0,32,0.04)', borderColor: 'rgba(128,0,32,0.1)' }}>
                <div className="flex items-center gap-2">
                  <Gift size={16} style={{ color: '#800020' }} />
                  <p className="text-xs font-semibold" style={{ color: '#800020' }}>You have a free dish reward!</p>
                </div>
                <button onClick={() => setShowPicker(true)}
                  className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                  style={{ backgroundColor: '#800020' }}>
                  Choose →
                </button>
              </div>
            )}

            {/* Cart items list */}
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
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]" style={{ borderColor: '#ddd', color: '#5C4B47' }}><Minus size={11} /></button>
                      <span className="w-5 text-center text-sm font-bold" style={{ color: '#2D2422' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]" style={{ borderColor: '#ddd', color: '#5C4B47' }}><Plus size={11} /></button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-1 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}

                {/* Free item row */}
                {freeItem && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(220,252,231,0.4)', border: '1px solid rgba(22,101,52,0.2)' }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Gift size={16} style={{ color: '#166534' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#166534' }}>{freeItem.name}</p>
                        <p className="text-xs line-through text-gray-400">{fmt(price(freeItem.price))}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>FREE</span>
                      <button onClick={() => setFreeItem(null)} className="text-gray-300 hover:text-red-400"><X size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
              <UpsellRow cartItems={cartItems} onAdd={addToCart} />
            </div>

            {/* Footer: breakdown + checkout button */}
            <div className="flex-shrink-0 px-6 py-4 border-t space-y-3" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: '#FDFBF7' }}>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span><span>{fmt(cartTotal)}</span>
                </div>
                {freeItem && (
                  <div className="flex justify-between text-xs font-semibold" style={{ color: '#166534' }}>
                    <span>🎁 {freeItem.name}</span><span>FREE</span>
                  </div>
                )}
                {deliveryType === 'takeaway' && takeawayDiscount > 0 && (
                  <div className="flex justify-between text-xs font-semibold" style={{ color: '#166534' }}>
                    <span>Collect 10% off</span><span>-{fmt(takeawayDiscount)}</span>
                  </div>
                )}
                {deliveryType === 'delivery' && smallOrderFee > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: '#92400E' }}>
                    <span>Small order fee</span><span>{fmt(smallOrderFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500"><Truck size={11} /> Delivery</span>
                  {deliveryType === 'takeaway'
                    ? <span className="font-semibold text-xs" style={{ color: '#166534' }}>Free</span>
                    : deliveryFee === null
                      ? <span className="text-gray-400 text-xs italic">Enter postcode</span>
                      : deliveryFee === 0
                        ? <span className="font-semibold text-xs" style={{ color: '#166534' }}>Free</span>
                        : <span className="text-gray-500 text-xs">{fmt(deliveryFee)}</span>
                  }
                </div>
                <div className="flex justify-between font-bold pt-1.5 border-t" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
                  <span style={{ color: '#2D2422' }}>Total</span>
                  <span style={{ color: '#800020' }}>{fmt(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!meetsMinimum || needsPostcode}
                className="w-full py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: !meetsMinimum || needsPostcode ? '#D1D5DB' : '#800020',
                  color: !meetsMinimum || needsPostcode ? '#9CA3AF' : 'white',
                  cursor: !meetsMinimum || needsPostcode ? 'not-allowed' : 'pointer',
                }}>
                {!meetsMinimum
                  ? `Add ${fmt(MINIMUM_ORDER - effectiveSubtotal)} more to order`
                  : needsPostcode
                    ? 'Enter postcode to continue'
                    : deliveryType === 'takeaway'
                      ? 'Collect my order'
                      : 'Send it Home'
                }
                {meetsMinimum && !needsPostcode && <ArrowRight size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
