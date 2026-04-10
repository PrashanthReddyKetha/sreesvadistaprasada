import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Truck, CheckCircle, MapPin, User, Mail, Phone, FileText,
  Plus, Minus, Trash2, ArrowLeft, X, Zap, Lock, Eye, EyeOff,
  LogIn, UserPlus, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const FREE_DELIVERY_THRESHOLD = 30;
const DELIVERY_FEE = 3.99;
const price = (val) => parseFloat(String(val).replace('£', '')) || 0;
const fmt   = (n)   => `£${Number(n).toFixed(2)}`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function Field({ label, icon: Icon, type = 'text', placeholder, value, onChange, locked, hint, required: req }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: '#5C4B47' }}>
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={locked}
          className="w-full py-2.5 rounded-xl border-2 text-sm focus:outline-none transition-colors"
          style={{
            paddingLeft: Icon ? '2.25rem' : '0.75rem',
            paddingRight: locked ? '2.25rem' : '0.75rem',
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

/* ── Delivery bar ────────────────────────────────────────────────────────── */
function DeliveryBar({ total, onAddMore }) {
  const remaining = FREE_DELIVERY_THRESHOLD - total;
  const pct = Math.min((total / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const isFree = total >= FREE_DELIVERY_THRESHOLD;
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: isFree ? '#F0FFF4' : '#FFFBEB' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Truck size={14} style={{ color: isFree ? '#166534' : '#B8860B' }} />
          {isFree ? (
            <span className="text-sm font-semibold" style={{ color: '#166534' }}>Free delivery unlocked!</span>
          ) : (
            <span className="text-sm text-gray-600">
              Add <strong style={{ color: '#800020' }}>{fmt(remaining)}</strong> more for free delivery
            </span>
          )}
        </div>
        {!isFree && (
          <button onClick={onAddMore}
            className="text-xs font-semibold hover:underline flex-shrink-0 ml-2"
            style={{ color: '#800020' }}>
            + Add items
          </button>
        )}
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-gray-200">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: isFree ? '#166534' : '#B8860B' }} />
      </div>
    </div>
  );
}

/* ── Order summary panel ─────────────────────────────────────────────────── */
function OrderSummary({ cartItems, cartTotal, updateQuantity, removeFromCart, deliveryFee }) {
  const [collapsed, setCollapsed] = useState(false);
  const grandTotal = cartTotal + deliveryFee;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(128,0,32,0.15)', backgroundColor: '#FDFBF7' }}>
      <button onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(128,0,32,0.1)' }}>
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} style={{ color: '#800020' }} />
          <span className="font-bold text-sm" style={{ color: '#800020' }}>
            Order ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: '#800020' }}>{fmt(grandTotal)}</span>
          {collapsed ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronUp size={15} className="text-gray-400" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-5 py-4 space-y-3">
          {cartItems.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              {item.image
                ? <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                    <ShoppingBag size={18} style={{ color: '#800020', opacity: 0.4 }} />
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate" style={{ color: '#2D2422' }}>{item.name}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: '#800020' }}>
                  {fmt(price(item.price) * item.quantity)}
                  {item.quantity > 1 && <span className="text-xs font-normal text-gray-400 ml-1">({fmt(price(item.price))} ea)</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center transition-all hover:bg-[#800020] hover:border-[#800020] hover:text-white"
                  style={{ borderColor: '#ddd', color: '#5C4B47' }}>
                  {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                </button>
                <span className="w-6 text-center text-sm font-bold" style={{ color: '#2D2422' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center transition-all hover:bg-[#800020] hover:border-[#800020] hover:text-white"
                  style={{ borderColor: '#ddd', color: '#5C4B47' }}>
                  <Plus size={11} />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-3 space-y-2 border-t" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{fmt(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500"><Truck size={13} /> Delivery</span>
              {deliveryFee === 0
                ? <span className="font-semibold" style={{ color: '#166534' }}>Free</span>
                : <span className="text-gray-600">{fmt(deliveryFee)}</span>
              }
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ borderColor: 'rgba(128,0,32,0.12)', color: '#800020' }}>
              <span style={{ color: '#2D2422' }}>Total</span>
              <span>{fmt(cartTotal + deliveryFee)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inline sign-in / guest prompt ──────────────────────────────────────── */
function GuestPrompt({ onSignedIn, onGuest, onRegister, login }) {
  const [mode, setMode]       = useState('options'); // 'options' | 'signin'
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

  if (mode === 'signin') {
    return (
      <div className="rounded-2xl border-2 p-5 space-y-4" style={{ borderColor: 'rgba(128,0,32,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogIn size={16} style={{ color: '#800020' }} />
            <p className="text-sm font-bold" style={{ color: '#800020' }}>Sign in to your account</p>
          </div>
          <button onClick={() => setMode('options')} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSignIn} className="space-y-3">
          {error && <p className="text-xs p-2.5 rounded-lg" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>{error}</p>}
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 text-sm focus:outline-none transition-colors"
              style={{ borderColor: email ? 'rgba(128,0,32,0.3)' : '#E5E7EB', color: '#2D2422' }} />
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} required
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 text-sm focus:outline-none transition-colors"
              style={{ borderColor: pw ? 'rgba(128,0,32,0.3)' : '#E5E7EB', color: '#2D2422' }} />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md disabled:opacity-60"
            style={{ backgroundColor: '#800020' }}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in…</> : 'Sign In & Continue →'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 p-5 space-y-3" style={{ borderColor: 'rgba(128,0,32,0.15)', backgroundColor: '#FDFBF7' }}>
      <p className="text-sm font-bold" style={{ color: '#2D2422' }}>How would you like to continue?</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setMode('signin')}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:border-[#800020] hover:bg-white"
          style={{ borderColor: 'rgba(128,0,32,0.2)' }}>
          <LogIn size={20} style={{ color: '#800020' }} />
          <span className="text-xs font-semibold text-center" style={{ color: '#2D2422' }}>Sign In</span>
          <span className="text-[10px] text-gray-400 text-center">Auto-fill your saved details</span>
        </button>
        <button onClick={onRegister}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:border-[#800020] hover:bg-white"
          style={{ borderColor: 'rgba(128,0,32,0.2)' }}>
          <UserPlus size={20} style={{ color: '#800020' }} />
          <span className="text-xs font-semibold text-center" style={{ color: '#2D2422' }}>Create Account</span>
          <span className="text-[10px] text-gray-400 text-center">Track orders & save address</span>
        </button>
      </div>
      <button onClick={onGuest}
        className="w-full py-2.5 text-sm font-medium rounded-xl border-2 transition-all hover:bg-white flex items-center justify-center gap-2"
        style={{ borderColor: '#E5E7EB', color: '#5C4B47' }}>
        Continue as Guest
      </button>
    </div>
  );
}

/* ── Browse more items modal ─────────────────────────────────────────────── */
const CATEGORY_LABELS = {
  nonVeg: 'Non-Veg', veg: 'Veg', prasada: 'Prasada',
  breakfast: 'Breakfast', snacks: 'Snacks', pickles: 'Pickles', podis: 'Podis',
};

function BrowseModal({ cartItems, onAdd, onClose, cartTotal }) {
  const [allItems, setAllItems] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const cartIds = new Set(cartItems.map(i => i.id));
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  useEffect(() => {
    api.get('/menu?available=true').then(r => setAllItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS).filter(c => allItems.some(i => i.category === c))];
  const shown = activeCat === 'all' ? allItems : allItems.filter(i => i.category === activeCat);

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
          <div>
            <h3 className="font-bold text-base" style={{ color: '#800020', fontFamily: "'Playfair Display', serif" }}>Add More Items</h3>
            {remaining > 0 && (
              <p className="text-xs text-gray-500">Add <strong style={{ color: '#800020' }}>{fmt(remaining)}</strong> more for free delivery</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto border-b flex-shrink-0"
          style={{ borderColor: 'rgba(128,0,32,0.08)', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ backgroundColor: activeCat === cat ? '#800020' : 'rgba(128,0,32,0.07)', color: activeCat === cat ? 'white' : '#800020' }}>
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading && <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" /></div>}
          {!loading && shown.map(item => {
            const inCart = cartIds.has(item.id);
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{ borderColor: inCart ? 'rgba(128,0,32,0.2)' : 'rgba(128,0,32,0.08)', backgroundColor: inCart ? 'rgba(128,0,32,0.03)' : 'white' }}>
                {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight" style={{ color: '#2D2422' }}>{item.name}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: '#800020' }}>{fmt(price(item.price))}</p>
                </div>
                <button onClick={() => onAdd(item)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 flex-shrink-0"
                  style={{ backgroundColor: '#800020' }}>
                  <Plus size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t flex-shrink-0" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
          <button onClick={onClose}
            className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:shadow-md"
            style={{ backgroundColor: '#800020' }}>
            Done — Back to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart, addToCart } = useCart();
  const { user, login, setAuthOpen } = useAuth();

  const [guestMode, setGuestMode] = useState(false); // true = proceed as guest
  const [showBrowse, setShowBrowse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // { orderId }

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    line1: '', line2: '', city: '', postcode: '',
    notes: '',
  });

  const pcDebounceRef = useRef(null);
  const [pcLookingUp, setPcLookingUp] = useState(false);
  const [pcError, setPcError] = useState('');
  const [addressOptions, setAddressOptions] = useState([]);
  const [addressDropdown, setAddressDropdown] = useState(false);

  // Pre-fill from user
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name:     f.name     || user.name     || '',
        email:    f.email    || user.email    || '',
        phone:    f.phone    || user.phone    || '',
        line1:    f.line1    || user.address?.line1    || '',
        line2:    f.line2    || user.address?.line2    || '',
        city:     f.city     || user.address?.city     || '',
        postcode: f.postcode || user.address?.postcode || '',
      }));
    }
  }, [user]);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  // Fallback: postcodes.io for city auto-fill
  const fallbackPostcodeIo = async (pc) => {
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc.trim())}`);
      if (!r.ok) return false;
      const data = await r.json();
      const city = data.result?.admin_district || data.result?.parliamentary_constituency || '';
      if (city) setForm(f => ({ ...f, city: f.city || city }));
      return true;
    } catch { return false; }
  };

  const lookupPostcode = useCallback(async (pc) => {
    const clean = pc.replace(/\s/g, '').toUpperCase();
    if (clean.length < 5) return;
    setPcError(''); setPcLookingUp(true); setAddressOptions([]); setAddressDropdown(false);
    const apiKey = process.env.REACT_APP_GETADDRESS_API_KEY;
    try {
      if (apiKey) {
        const r = await fetch(`https://api.getaddress.io/find/${encodeURIComponent(pc.trim())}?api-key=${apiKey}&expand=true`);
        if (r.status === 404 || r.status === 429 || !r.ok) {
          // getAddress.io failed — fall back to postcodes.io for city
          await fallbackPostcodeIo(pc);
          return;
        }
        const data = await r.json();
        const addrs = (data.addresses || []).map(a => ({
          label: [a.line_1, a.line_2, a.town_or_city].filter(Boolean).join(', '),
          line1: a.line_1 || '', line2: a.line_2 || '', city: a.town_or_city || '',
        }));
        if (addrs.length === 0) {
          await fallbackPostcodeIo(pc); // at least fill city
          return;
        }
        setAddressOptions(addrs); setAddressDropdown(true);
      } else {
        await fallbackPostcodeIo(pc);
      }
    } catch {
      await fallbackPostcodeIo(pc);
    }
    finally { setPcLookingUp(false); }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const selectAddress = (addr) => {
    setForm(f => ({ ...f, line1: addr.line1, line2: addr.line2, city: addr.city }));
    setAddressDropdown(false);
  };

  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal  = cartTotal + deliveryFee;

  const handleOrder = async () => {
    setError('');
    const required = ['name', 'email', 'phone', 'line1', 'city', 'postcode'];
    if (required.some(k => !form[k].trim())) { setError('Please fill in all required fields.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        customer_name:  form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        items: cartItems.map(i => ({
          menu_item_id: i.id, name: i.name,
          price: price(i.price), quantity: i.quantity,
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
      setSuccess({ orderId: res.data?.id?.slice(-6).toUpperCase() || '' });
      clearCart();
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  };

  // Redirect if cart is empty (and not on success screen)
  useEffect(() => {
    if (cartItems.length === 0 && !success) {
      // small delay so post-order clearCart doesn't trigger this
    }
  }, [cartItems, success]);

  /* ── SUCCESS ─────────────────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #800020, #5C0018)' }}>
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Thank You{user ? `, ${user.name.split(' ')[0]}` : ''}!
          </h2>
          {success.orderId && (
            <div className="inline-block mb-4 px-5 py-2 rounded-2xl text-sm font-bold"
              style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>
              Order #{success.orderId}
            </div>
          )}
          <p className="text-gray-600 mb-2 leading-relaxed">
            Your order has been received and is being prepared. We'll send a confirmation to{' '}
            <strong>{form.email}</strong>.
          </p>
          <p className="text-sm text-gray-400 mb-8">Estimated time: 30–45 minutes</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/')}
              className="flex-1 py-3 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: '#800020', color: '#800020' }}>
              Back to Home
            </button>
            {user && (
              <button onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all hover:shadow-md"
                style={{ backgroundColor: '#800020' }}>
                Track My Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── EMPTY CART ──────────────────────────────────────────────────────── */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
          <h2 className="text-xl font-bold mb-2" style={{ color: '#800020', fontFamily: "'Playfair Display', serif" }}>Your basket is empty</h2>
          <p className="text-sm text-gray-500 mb-6">Add some delicious South Indian food to your basket first.</p>
          <button onClick={() => navigate('/svadista')}
            className="px-8 py-3 text-sm font-bold text-white rounded-xl transition-all hover:shadow-md"
            style={{ backgroundColor: '#800020' }}>
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  const showGuestPrompt = !user && !guestMode;
  const canCheckout = user || guestMode;

  /* ── MAIN CHECKOUT ───────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
      {showBrowse && (
        <BrowseModal
          cartItems={cartItems}
          onAdd={addToCart}
          onClose={() => setShowBrowse(false)}
          cartTotal={cartTotal}
        />
      )}

      {/* Page header */}
      <div className="border-b bg-white" style={{ borderColor: 'rgba(128,0,32,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: '#800020' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Checkout
          </h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            <Lock size={12} /> Secure order
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── LEFT: Form ───────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Guest prompt */}
            {showGuestPrompt && (
              <GuestPrompt
                onSignedIn={() => {}}
                onGuest={() => setGuestMode(true)}
                onRegister={() => { setAuthOpen(true); }}
                login={login}
              />
            )}

            {/* Delivery details */}
            {canCheckout && (
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5"
                style={{ border: '1px solid rgba(128,0,32,0.1)' }}>
                <div className="flex items-center gap-2">
                  <MapPin size={16} style={{ color: '#800020' }} />
                  <h2 className="font-bold text-base" style={{ color: '#800020' }}>Delivery Details</h2>
                  {user && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold ml-auto"
                      style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                      Auto-filled from account
                    </span>
                  )}
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" icon={User} value={form.name} onChange={set('name')}
                    placeholder="Your name" locked={!!user?.name && form.name === user.name} required />
                  <Field label="Phone" icon={Phone} type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="+44..." locked={!!user?.phone && form.phone === user.phone} required />
                </div>
                <Field label="Email" icon={Mail} type="email" value={form.email} onChange={set('email')}
                  placeholder="you@example.com" locked={!!user?.email && form.email === user.email}
                  hint={user ? 'Order confirmation will be sent here' : ''} required />

                {/* Postcode */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#5C4B47' }}>
                    Postcode <span className="text-red-400">*</span>
                    <span className="font-normal text-gray-400 ml-1">— we'll find your address</span>
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text" placeholder="e.g. MK9 1AB"
                      value={form.postcode}
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        set('postcode')(val);
                        setPcError(''); setAddressDropdown(false);
                        clearTimeout(pcDebounceRef.current);
                        if (val.replace(/\s/g, '').length >= 5) {
                          pcDebounceRef.current = setTimeout(() => lookupPostcode(val), 600);
                        }
                      }}
                      onBlur={() => { clearTimeout(pcDebounceRef.current); lookupPostcode(form.postcode); }}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 text-sm uppercase focus:outline-none transition-colors"
                      style={{
                        borderColor: form.postcode ? 'rgba(128,0,32,0.3)' : '#E5E7EB',
                        color: '#2D2422',
                      }}
                    />
                    {pcLookingUp && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" />}
                    {!pcLookingUp && form.line1 && <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#166534' }} />}
                  </div>

                  {addressDropdown && addressOptions.length > 0 && (
                    <div className="mt-1.5 border-2 rounded-xl overflow-hidden shadow-lg"
                      style={{ borderColor: 'rgba(128,0,32,0.2)', backgroundColor: 'white', maxHeight: '200px', overflowY: 'auto' }}>
                      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider bg-gray-50 sticky top-0" style={{ color: '#9C7B6B' }}>
                        {addressOptions.length} addresses — select yours
                      </p>
                      {addressOptions.map((addr, i) => (
                        <button key={i} type="button" onClick={() => selectAddress(addr)}
                          className="w-full text-left px-3 py-2.5 text-sm border-t hover:bg-[#800020]/5 transition-colors"
                          style={{ borderColor: 'rgba(128,0,32,0.06)', color: '#2D2422' }}>
                          {addr.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {form.postcode.replace(/\s/g, '').length >= 5 && (
                  <div className="space-y-4">
                    <Field label="Address Line 1" icon={MapPin} value={form.line1} onChange={set('line1')}
                      placeholder="123 High Street" locked={!!form.line1 && !addressDropdown} required />
                    <Field label="Address Line 2 (optional)" icon={null} value={form.line2} onChange={set('line2')}
                      placeholder="Flat / Apartment" />
                    <Field label="Town / City" icon={null} value={form.city} onChange={set('city')}
                      placeholder="Milton Keynes" locked={!!form.city && !addressDropdown} required />
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {canCheckout && (
              <div className="bg-white rounded-2xl shadow-sm p-6" style={{ border: '1px solid rgba(128,0,32,0.1)' }}>
                <label className="text-xs font-semibold block mb-2 flex items-center gap-1.5" style={{ color: '#5C4B47' }}>
                  <FileText size={13} /> Delivery Notes <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea value={form.notes} onChange={e => set('notes')(e.target.value)}
                  placeholder="e.g. Leave at the door, ring bell twice…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none focus:border-[#800020] transition-colors"
                  style={{ borderColor: '#E5E7EB', color: '#2D2422' }}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm font-medium p-4 rounded-xl" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>{error}</p>
            )}

            {/* Mobile: Place Order button */}
            {canCheckout && (
              <div className="lg:hidden">
                <button onClick={handleOrder} disabled={submitting}
                  className="w-full py-4 text-sm font-bold text-white rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60"
                  style={{ backgroundColor: '#800020' }}>
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Placing Order…</>
                    : <>Place Order · {fmt(grandTotal)}</>
                  }
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: Order Summary (sticky) ────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-4">

              {/* Delivery nudge */}
              <DeliveryBar total={cartTotal} onAddMore={() => setShowBrowse(true)} />

              {/* Order summary */}
              <OrderSummary
                cartItems={cartItems}
                cartTotal={cartTotal}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                deliveryFee={deliveryFee}
              />

              {/* Trust badges */}
              <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid rgba(128,0,32,0.1)' }}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[['🔒', 'Secure order'], ['⚡', '30–45 min'], ['🍛', 'Freshly made']].map(([icon, label]) => (
                    <div key={label}>
                      <span className="text-2xl block mb-1">{icon}</span>
                      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Place Order button */}
              {canCheckout && (
                <div className="hidden lg:block">
                  <button onClick={handleOrder} disabled={submitting}
                    className="w-full py-4 text-sm font-bold text-white rounded-2xl flex items-center justify-center gap-2 hover:shadow-xl transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #800020, #5C0018)' }}>
                    {submitting
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Placing Order…</>
                      : <>Place Order · {fmt(grandTotal)}</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
