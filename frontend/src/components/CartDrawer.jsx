import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, ChevronDown, ChevronUp,
  User, Mail, Phone, MapPin, CheckCircle, Truck, Tag, Zap, Edit2, FileText,
  Lock, Eye, EyeOff, LogIn, UserPlus
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const FREE_DELIVERY_THRESHOLD = 30;
const DELIVERY_FEE = 3.99;

/* ── helpers ─────────────────────────────────────────────────────────────── */
const price = (val) => parseFloat(String(val).replace('£', '')) || 0;
const fmt   = (n)   => `£${n.toFixed(2)}`;

/* ── Free delivery progress bar ──────────────────────────────────────────── */
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
            <span className="text-xs font-semibold" style={{ color: '#166534' }}>You've unlocked free delivery!</span>
          ) : (
            <span className="text-xs font-medium text-gray-600">
              Add <strong style={{ color: '#800020' }}>{fmt(remaining)}</strong> more for free delivery
            </span>
          )}
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

/* ── Upsell suggestions ───────────────────────────────────────────────────── */
// What each category pairs well with (ordered by priority)
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
  return best; // lower = better match
}

function UpsellRow({ cartItems, onAdd }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    api.get('/menu?available=true')
      .then(r => {
        const cartIds   = new Set(cartItems.map(i => i.id));
        const cartCats  = [...new Set(cartItems.map(i => i.category))];
        const candidates = r.data
          .filter(i => !cartIds.has(i.id))
          .map(i => ({ ...i, _score: scoreComplement(i, cartCats) }))
          .filter(i => i._score < 99)          // only items that genuinely complement
          .sort((a, b) => a._score - b._score || a.price - b.price)
          .slice(0, 4);
        setSuggestions(candidates);
      })
      .catch(() => {});
  }, [cartItems]);

  if (suggestions.length === 0) return null;

  return (
    <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(128,0,32,0.08)', backgroundColor: '#FDFBF7' }}>
      <div className="flex items-center gap-1.5 mb-3">
        <Zap size={13} style={{ color: '#B8860B' }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#B8860B' }}>Frequently added together</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {suggestions.map(item => (
          <div key={item.id} className="flex-shrink-0 w-28 rounded-xl overflow-hidden border group"
            style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: 'white' }}>
            {item.image && (
              <div className="h-16 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-2">
              <p className="text-[10px] font-semibold leading-tight mb-1 line-clamp-2" style={{ color: '#2D2422' }}>{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: '#800020' }}>{fmt(item.price)}</span>
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

/* ── Order summary (in checkout) ─────────────────────────────────────────── */
function OrderSummary({ cartItems, cartTotal, collapsed, onToggle, updateQuantity, removeFromCart }) {
  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = cartTotal + deliveryFee;

  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'rgba(128,0,32,0.15)', backgroundColor: '#FDFBF7' }}>
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(128,0,32,0.1)' }}>
        <div className="flex items-center gap-2">
          <ShoppingBag size={14} style={{ color: '#800020' }} />
          <span className="text-sm font-semibold" style={{ color: '#800020' }}>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[10px] text-gray-400 font-normal">(tap to edit)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: '#800020' }}>{fmt(grandTotal)}</span>
          {collapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 py-3 space-y-3">
          {cartItems.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#2D2422' }}>{item.name}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: '#800020' }}>{fmt(price(item.price) * item.quantity)}</p>
              </div>
              {/* Quantity controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                  style={{ borderColor: '#ddd', color: '#5C4B47' }}>
                  {item.quantity === 1 ? <Trash2 size={10} /> : <Minus size={10} />}
                </button>
                <span className="w-5 text-center text-xs font-bold" style={{ color: '#2D2422' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                  style={{ borderColor: '#ddd', color: '#5C4B47' }}>
                  <Plus size={10} />
                </button>
              </div>
            </div>
          ))}
          <div className="pt-2 mt-2 space-y-1.5 border-t" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{fmt(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-gray-500">
                <Truck size={11} /> Delivery
              </span>
              {deliveryFee === 0
                ? <span className="font-semibold" style={{ color: '#166534' }}>Free</span>
                : <span className="text-gray-600">{fmt(deliveryFee)}</span>
              }
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
              <span style={{ color: '#2D2422' }}>Total</span>
              <span style={{ color: '#800020' }}>{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pre-filled field ─────────────────────────────────────────────────────── */
function Field({ label, icon: Icon, type = 'text', placeholder, value, onChange, locked, hint }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: '#5C4B47' }}>{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border-2 text-sm focus:outline-none transition-colors"
          style={{
            borderColor: locked ? 'rgba(22,101,52,0.3)' : value ? 'rgba(128,0,32,0.3)' : '#E5E7EB',
            backgroundColor: locked ? 'rgba(22,101,52,0.04)' : 'white',
            color: '#2D2422',
          }}
        />
        {locked && <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#166534' }} />}
      </div>
      {hint && <p className="text-[10px] mt-0.5" style={{ color: '#9C7B6B' }}>{hint}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
const CartDrawer = () => {
  const { cartItems, cartCount, cartTotal, cartOpen, setCartOpen, updateQuantity, removeFromCart, clearCart, addToCart } = useCart();
  const { user, login, setAuthOpen } = useAuth();

  const [step, setStep]           = useState('cart');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [orderId, setOrderId]     = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    line1: '', line2: '', city: '', postcode: '',
    notes: '',
  });

  // Address lookup state
  const [pcLookingUp, setPcLookingUp]     = useState(false);
  const [pcError, setPcError]             = useState('');
  const [addressOptions, setAddressOptions] = useState([]);
  const [addressDropdown, setAddressDropdown] = useState(false);

  // Pre-fill from user account whenever user or step changes
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name:  f.name  || user.name  || '',
        email: f.email || user.email || '',
        phone: f.phone || user.phone || '',
        line1: f.line1 || user.address?.line1 || '',
        line2: f.line2 || user.address?.line2 || '',
        city:  f.city  || user.address?.city  || '',
        postcode: f.postcode || user.address?.postcode || '',
      }));
    }
  }, [user, step]);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const lookupPostcode = async (pc) => {
    const clean = pc.replace(/\s/g, '').toUpperCase();
    if (clean.length < 5) return;
    setPcError(''); setPcLookingUp(true); setAddressOptions([]); setAddressDropdown(false);
    const apiKey = process.env.REACT_APP_GETADDRESS_API_KEY;
    try {
      if (apiKey) {
        // Full address lookup via getAddress.io
        const r = await fetch(`https://api.getaddress.io/find/${encodeURIComponent(pc.trim())}?api-key=${apiKey}&expand=true`);
        if (r.status === 404) { setPcError('Postcode not found. Please check and try again.'); return; }
        if (!r.ok) throw new Error();
        const data = await r.json();
        const addrs = (data.addresses || []).map(a => ({
          label: [a.line_1, a.line_2, a.town_or_city].filter(Boolean).join(', '),
          line1: a.line_1 || '',
          line2: a.line_2 || '',
          city:  a.town_or_city || '',
        }));
        if (addrs.length === 0) { setPcError('No addresses found for this postcode.'); return; }
        setAddressOptions(addrs);
        setAddressDropdown(true);
      } else {
        // Free fallback: postcodes.io — just auto-fills city
        const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc.trim())}`);
        if (!r.ok) { setPcError('Postcode not found. Please check and try again.'); return; }
        const data = await r.json();
        const city = data.result?.admin_district || data.result?.parliamentary_constituency || '';
        if (city) setForm(f => ({ ...f, city: f.city || city }));
      }
    } catch { setPcError('Could not look up postcode. Please enter your address manually.'); }
    finally { setPcLookingUp(false); }
  };

  const selectAddress = (addr) => {
    setForm(f => ({ ...f, line1: addr.line1, line2: addr.line2, city: addr.city }));
    setAddressDropdown(false);
  };

  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal  = cartTotal + deliveryFee;

  const handleOrder = async () => {
    setError('');
    const required = ['name', 'email', 'phone', 'line1', 'city', 'postcode'];
    if (required.some(k => !form[k].trim())) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        customer_name:    form.name,
        customer_email:   form.email,
        customer_phone:   form.phone,
        items: cartItems.map(i => ({
          menu_item_id: i.id,
          name: i.name,
          price: price(i.price),
          quantity: i.quantity,
        })),
        delivery_address: {
          line1: form.line1,
          line2: form.line2 || undefined,
          city:  form.city,
          postcode: form.postcode,
        },
        special_instructions: form.notes || undefined,
        delivery_fee: deliveryFee,
        total: grandTotal,
      });
      setOrderId(res.data?.id?.slice(-6).toUpperCase() || '');
      setStep('success');
      clearCart();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCartOpen(false);
    setTimeout(() => { setStep('cart'); setError(''); }, 300);
  };

  if (!cartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/50" onClick={handleClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md flex flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(128,0,32,0.12)', background: step === 'success' ? 'white' : 'linear-gradient(135deg, #800020 0%, #5C0018 100%)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className={step === 'success' ? '' : 'text-white'} style={step === 'success' ? { color: '#800020' } : {}} />
            <h2 className="text-base font-bold" style={{ fontFamily: "'Playfair Display', serif", color: step === 'success' ? '#800020' : 'white' }}>
              {step === 'success' ? 'Order Confirmed!' : step === 'checkout' ? 'Checkout' : step === 'browse' ? 'Add More Items' : step === 'guest_prompt' ? 'How would you like to proceed?' : `Your Basket (${cartCount})`}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full transition-colors" style={{ color: step === 'success' ? '#5C4B47' : 'rgba(255,255,255,0.8)' }}>
            <X size={20} />
          </button>
        </div>

        {/* ── SUCCESS ─────────────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #800020, #5C0018)' }}>
              <CheckCircle size={38} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Thank You{user ? `, ${user.name.split(' ')[0]}` : ''}!
            </h3>
            {orderId && (
              <div className="mb-3 px-4 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>
                Order #{orderId}
              </div>
            )}
            <p className="text-gray-600 mb-2 leading-relaxed text-sm">
              Your order has been received and is being reviewed. We'll send a confirmation to <strong>{form.email}</strong>.
            </p>
            <p className="text-xs text-gray-400 mb-8">Estimated preparation time: 30–45 minutes</p>
            <button onClick={handleClose}
              className="px-8 py-3 text-sm font-semibold text-white rounded-xl"
              style={{ backgroundColor: '#800020' }}>
              Continue Shopping
            </button>
          </div>
        )}

        {/* ── CART ────────────────────────────────────────────────────── */}
        {step === 'cart' && (
          <>
            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-gray-400">
                <ShoppingBag size={48} className="mb-3 opacity-20" />
                <p className="text-sm font-medium text-gray-500 mb-1">Your basket is empty</p>
                <p className="text-xs text-gray-400 mb-4">Add some delicious South Indian food!</p>
                <button onClick={handleClose} className="text-sm font-semibold" style={{ color: '#800020' }}>
                  Browse Menu →
                </button>
              </div>
            ) : (
              <>
                {/* Delivery bar */}
                <DeliveryBar total={cartTotal} />

                {/* Items list */}
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
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                            style={{ borderColor: '#ddd' }}>
                            <Minus size={11} />
                          </button>
                          <span className="w-5 text-center text-sm font-bold" style={{ color: '#2D2422' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:bg-[#800020] hover:text-white hover:border-[#800020]"
                            style={{ borderColor: '#ddd' }}>
                            <Plus size={11} />
                          </button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-1 text-gray-300 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upsell */}
                  <UpsellRow cartItems={cartItems} onAdd={addToCart} />
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t space-y-3" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: '#FDFBF7' }}>
                  {/* Price breakdown */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span><span>{fmt(cartTotal)}</span>
                    </div>
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

                  <button onClick={() => setStep(user ? 'checkout' : 'guest_prompt')}
                    className="w-full py-3.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    style={{ backgroundColor: '#800020' }}>
                    Proceed to Checkout <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── CHECKOUT ─────────────────────────────────────────────────── */}
        {step === 'checkout' && (
          <>
            {/* Free delivery nudge */}
            {cartTotal < FREE_DELIVERY_THRESHOLD && (
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b"
                style={{ backgroundColor: '#FFFBEB', borderColor: 'rgba(128,0,32,0.08)' }}>
                <div className="flex items-center gap-1.5">
                  <Truck size={13} style={{ color: '#B8860B' }} />
                  <span className="text-xs text-gray-600">
                    Add <strong style={{ color: '#800020' }}>{fmt(FREE_DELIVERY_THRESHOLD - cartTotal)}</strong> more for free delivery
                  </span>
                </div>
                <button onClick={() => setStep('browse')}
                  className="text-xs font-semibold hover:underline flex-shrink-0 ml-2"
                  style={{ color: '#800020' }}>
                  + Add items
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Order summary toggle */}
              <OrderSummary
                cartItems={cartItems}
                cartTotal={cartTotal}
                collapsed={summaryOpen}
                onToggle={() => setSummaryOpen(o => !o)}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
              />

              {/* Delivery details section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} style={{ color: '#800020' }} />
                  <p className="text-sm font-bold" style={{ color: '#800020' }}>Delivery Details</p>
                  {user && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold ml-auto"
                      style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                      Auto-filled from your account
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full Name *" icon={User} value={form.name} onChange={set('name')}
                      placeholder="Your name" locked={!!user?.name && form.name === user.name} />
                    <Field label="Phone *" icon={Phone} type="tel" value={form.phone} onChange={set('phone')}
                      placeholder="+44..." locked={!!user?.phone && form.phone === user.phone} />
                  </div>
                  <Field label="Email *" icon={Mail} type="email" value={form.email} onChange={set('email')}
                    placeholder="you@example.com" locked={!!user?.email && form.email === user.email}
                    hint={user ? 'Order confirmation will be sent here' : ''} />

                  {/* Postcode first */}
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#5C4B47' }}>
                      Postcode * <span className="font-normal text-gray-400">— we'll find your address</span>
                    </label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text" placeholder="e.g. MK9 1AB"
                        value={form.postcode}
                        onChange={e => { set('postcode')(e.target.value.toUpperCase()); setPcError(''); setAddressDropdown(false); }}
                        onBlur={() => lookupPostcode(form.postcode)}
                        className="w-full pl-9 pr-10 py-2.5 rounded-lg border-2 text-sm focus:outline-none transition-colors uppercase"
                        style={{ borderColor: pcError ? '#FCA5A5' : form.postcode ? 'rgba(128,0,32,0.3)' : '#E5E7EB', color: '#2D2422' }}
                      />
                      {pcLookingUp && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" />
                      )}
                      {!pcLookingUp && form.line1 && (
                        <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#166534' }} />
                      )}
                    </div>
                    {pcError && <p className="text-[10px] mt-0.5" style={{ color: '#EF4444' }}>{pcError}</p>}

                    {/* Address dropdown */}
                    {addressDropdown && addressOptions.length > 0 && (
                      <div className="mt-1.5 border-2 rounded-lg overflow-hidden shadow-lg"
                        style={{ borderColor: 'rgba(128,0,32,0.2)', backgroundColor: 'white', maxHeight: '180px', overflowY: 'auto' }}>
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider bg-gray-50" style={{ color: '#9C7B6B' }}>
                          {addressOptions.length} addresses found — select yours
                        </p>
                        {addressOptions.map((addr, i) => (
                          <button key={i} type="button" onClick={() => selectAddress(addr)}
                            className="w-full text-left px-3 py-2 text-xs border-t hover:bg-[#800020]/5 transition-colors"
                            style={{ borderColor: 'rgba(128,0,32,0.06)', color: '#2D2422' }}>
                            {addr.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Address fields — shown after postcode entered */}
                  {form.postcode.replace(/\s/g,'').length >= 5 && (
                    <>
                      <Field label="Address Line 1 *" icon={MapPin} value={form.line1} onChange={set('line1')}
                        placeholder="123 High Street" locked={!!form.line1 && !addressDropdown} />
                      <Field label="Address Line 2" icon={null} value={form.line2} onChange={set('line2')}
                        placeholder="Flat / Apartment (optional)" />
                      <Field label="Town / City *" icon={null} value={form.city} onChange={set('city')}
                        placeholder="Milton Keynes" locked={!!form.city && !addressDropdown} />
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold block mb-1 flex items-center gap-1" style={{ color: '#5C4B47' }}>
                  <FileText size={12} /> Delivery Notes <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)}
                  placeholder="e.g. Leave at the door, ring bell twice…"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border-2 text-sm resize-none focus:outline-none focus:border-[#800020] transition-colors"
                  style={{ borderColor: '#E5E7EB', color: '#2D2422' }}
                />
              </div>

              {error && (
                <p className="text-xs font-medium p-3 rounded-xl" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>{error}</p>
              )}

              {/* Trust badges */}
              <div className="flex items-center gap-4 py-2">
                {[['🔒', 'Secure order'], ['⚡', '30–45 min'], ['🍛', 'Freshly made']].map(([icon, label]) => (
                  <div key={label} className="flex-1 text-center">
                    <span className="text-lg block">{icon}</span>
                    <span className="text-[10px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t space-y-2" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: '#FDFBF7' }}>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span style={{ color: '#2D2422' }}>Total to pay</span>
                <span style={{ color: '#800020' }}>{fmt(grandTotal)}</span>
              </div>
              <button onClick={handleOrder} disabled={submitting}
                className="w-full py-4 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60"
                style={{ backgroundColor: '#800020' }}>
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Placing Order…</>
                  : <>Place Order · {fmt(grandTotal)}</>
                }
              </button>
              <button onClick={() => setStep('cart')} className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                ← Back to basket
              </button>
            </div>
          </>
        )}

        {/* ── GUEST PROMPT ─────────────────────────────────────────── */}
        {step === 'guest_prompt' && (
          <GuestPrompt
            onSignedIn={() => setStep('checkout')}
            onGuest={() => setStep('checkout')}
            onRegister={() => { handleClose(); setAuthOpen(true); }}
            login={login}
          />
        )}

        {/* ── BROWSE ───────────────────────────────────────────────── */}
        {step === 'browse' && (
          <BrowseMenu
            cartItems={cartItems}
            onAdd={(item) => { addToCart(item); }}
            onBack={() => setStep('checkout')}
            cartTotal={cartTotal}
          />
        )}

      </div>
    </>
  );
};

/* ── Guest prompt ─────────────────────────────────────────────────────────── */
function GuestPrompt({ onSignedIn, onGuest, onRegister, login }) {
  const [email, setEmail]     = useState('');
  const [pw, setPw]           = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password: pw });
      login(res.data.user, res.data.access_token);
      onSignedIn();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

      {/* Sign in block */}
      <div className="rounded-2xl border-2 p-5 space-y-4" style={{ borderColor: 'rgba(128,0,32,0.15)' }}>
        <div className="flex items-center gap-2">
          <LogIn size={16} style={{ color: '#800020' }} />
          <p className="text-sm font-bold" style={{ color: '#800020' }}>Sign in for faster checkout</p>
        </div>
        <p className="text-xs text-gray-500">Your saved address and details will be filled in automatically.</p>

        <form onSubmit={handleSignIn} className="space-y-3">
          {error && (
            <p className="text-xs p-2.5 rounded-lg" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>{error}</p>
          )}
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border-2 text-sm focus:outline-none transition-colors"
              style={{ borderColor: email ? 'rgba(128,0,32,0.3)' : '#E5E7EB', color: '#2D2422' }} />
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={pw}
              onChange={e => setPw(e.target.value)} required autoComplete="current-password"
              className="w-full pl-9 pr-10 py-2.5 rounded-lg border-2 text-sm focus:outline-none transition-colors"
              style={{ borderColor: pw ? 'rgba(128,0,32,0.3)' : '#E5E7EB', color: '#2D2422' }} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md disabled:opacity-60"
            style={{ backgroundColor: '#800020' }}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in…</> : 'Sign In & Continue'}
          </button>
        </form>
      </div>

      {/* Register block */}
      <div className="rounded-2xl border-2 p-5" style={{ borderColor: 'rgba(128,0,32,0.1)', backgroundColor: '#FDFBF7' }}>
        <div className="flex items-center gap-2 mb-2">
          <UserPlus size={16} style={{ color: '#800020' }} />
          <p className="text-sm font-bold" style={{ color: '#800020' }}>New here?</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">Create an account to track orders, save your address, and get exclusive offers.</p>
        <button onClick={onRegister}
          className="w-full py-2.5 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-[#800020]/5"
          style={{ borderColor: '#800020', color: '#800020' }}>
          Create Account
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Guest */}
      <button onClick={onGuest}
        className="w-full py-3 text-sm font-semibold rounded-xl border-2 flex items-center justify-center gap-2 transition-all hover:bg-gray-50"
        style={{ borderColor: '#E5E7EB', color: '#5C4B47' }}>
        Continue as Guest <ArrowRight size={14} />
      </button>
      <p className="text-center text-[10px] text-gray-400">You can still track your order using your email address.</p>
    </div>
  );
}

/* ── Inline menu browser ──────────────────────────────────────────────────── */
const CATEGORY_LABELS = {
  nonVeg: 'Non-Veg', veg: 'Veg', prasada: 'Prasada',
  breakfast: 'Breakfast', snacks: 'Snacks & Pickles', pickles: 'Pickles', podis: 'Podis',
};

function BrowseMenu({ cartItems, onAdd, onBack, cartTotal }) {
  const [allItems, setAllItems]   = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading]     = useState(true);
  const cartIds = new Set(cartItems.map(i => i.id));
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  useEffect(() => {
    api.get('/menu?available=true')
      .then(r => setAllItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS).filter(c =>
    allItems.some(i => i.category === c)
  )];

  const shown = activeCat === 'all' ? allItems : allItems.filter(i => i.category === activeCat);

  return (
    <>
      {/* Free delivery progress */}
      {remaining > 0 && (
        <div className="flex-shrink-0 px-5 py-2.5 border-b text-xs text-gray-600 flex items-center gap-1.5"
          style={{ backgroundColor: '#FFFBEB', borderColor: 'rgba(128,0,32,0.08)' }}>
          <Truck size={13} style={{ color: '#B8860B' }} />
          Add <strong style={{ color: '#800020' }} className="mx-0.5">{fmt(remaining)}</strong> more to unlock free delivery
        </div>
      )}
      {remaining === 0 && (
        <div className="flex-shrink-0 px-5 py-2.5 border-b text-xs font-semibold flex items-center gap-1.5"
          style={{ backgroundColor: '#F0FFF4', borderColor: 'rgba(128,0,32,0.08)', color: '#166534' }}>
          <Truck size={13} /> Free delivery unlocked!
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto border-b"
        style={{ borderColor: 'rgba(128,0,32,0.08)', scrollbarWidth: 'none' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: activeCat === cat ? '#800020' : 'rgba(128,0,32,0.06)',
              color: activeCat === cat ? 'white' : '#800020',
            }}>
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="flex justify-center py-10">
            <span className="w-6 h-6 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" />
          </div>
        )}
        {!loading && shown.map(item => {
          const inCart = cartIds.has(item.id);
          return (
            <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl border transition-all"
              style={{ borderColor: inCart ? 'rgba(128,0,32,0.2)' : 'rgba(128,0,32,0.08)', backgroundColor: inCart ? 'rgba(128,0,32,0.03)' : 'white' }}>
              {item.image && (
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate" style={{ color: '#2D2422' }}>{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: '#800020' }}>{fmt(price(item.price))}</p>
              </div>
              <button onClick={() => onAdd(item)}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: '#800020' }}>
                <Plus size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Back to checkout */}
      <div className="flex-shrink-0 px-5 py-4 border-t" style={{ borderColor: 'rgba(128,0,32,0.12)', backgroundColor: '#FDFBF7' }}>
        <button onClick={onBack}
          className="w-full py-3.5 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          style={{ backgroundColor: '#800020' }}>
          Back to Checkout <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}

export default CartDrawer;
