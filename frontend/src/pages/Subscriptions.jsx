import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Calendar, Leaf, Flame, Sparkles, Sun, Moon, RotateCcw, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

/* ── constants ────────────────────────────────────────── */
const STORAGE_KEY = 'ssp_dabba_progress';
const PROGRESS_TTL = 7 * 24 * 60 * 60 * 1000;

const STEPS = [
  { num: 1, label: 'Plan' },
  { num: 2, label: 'Box' },
  { num: 3, label: 'Menu' },
  { num: 4, label: 'Days' },
  { num: 5, label: 'Prefs' },
  { num: 6, label: 'Details' },
  { num: 7, label: 'Confirm' },
];

const DURATIONS = [
  { id: 'weekly',  name: 'Weekly Trial',  days: '5 Days',       price: '£45',  perMeal: '£9/meal',  desc: 'Try before you commit. 5 meals, Mon–Fri.' },
  { id: 'monthly', name: 'Monthly Saver', days: '20 Days',       price: '£160', perMeal: '£8/meal',  desc: 'Best value. Full month of homely meals.', popular: true },
  { id: 'family',  name: 'Family Plan',   days: '20 Days × 2',  price: '£280', perMeal: '£7/meal',  desc: 'Feed the whole family. 40 meals total.' },
];

const BOX_TYPES = [
  { id: 'prasada', name: 'Prasada Box',  icon: Leaf,     color: '#4A7C59', apiCategory: 'veg',    desc: '100% pure vegetarian. Temple-style cooking.',   items: ['Rice / Roti', 'Dal', 'Veg Curry', 'Chutney / Pickle', 'Papad'] },
  { id: 'svadista', name: 'Svadista Box', icon: Flame,    color: '#8B3A3A', apiCategory: 'nonVeg', desc: 'Traditional non-veg. Bold village flavours.',   items: ['Rice', 'Non-Veg Curry', 'Side Dish', 'Rasam / Sambar', 'Pickle'] },
  { id: 'mixed',   name: 'Mixed Box',    icon: Sparkles, color: '#B8860B', apiCategory: 'veg',    desc: 'Best of both worlds. Chef-curated daily.',      items: ['Alternating veg / non-veg', 'Full meal each day', 'Chef curated', 'Festival specials'] },
];

const PREFERENCES = [
  { id: 'no-onion',     label: 'No Onion / Garlic' },
  { id: 'less-spice',   label: 'Less Spicy' },
  { id: 'extra-spice',  label: 'Extra Spicy' },
  { id: 'no-egg',       label: 'No Egg' },
  { id: 'jain',         label: 'Jain Preference' },
  { id: 'no-mushroom',  label: 'No Mushroom' },
  { id: 'no-brinjal',   label: 'No Brinjal' },
  { id: 'gluten-free',  label: 'Gluten-Free where possible' },
];

const WEEKDAYS = [
  { id: 'monday',    label: 'Mon' },
  { id: 'tuesday',   label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday',  label: 'Thu' },
  { id: 'friday',    label: 'Fri' },
];

/* ── helpers ──────────────────────────────────────────── */
function getNextMonday(minDays = 3) {
  const d = new Date();
  d.setDate(d.getDate() + minDays);
  const dow = d.getDay(); // 0=Sun, 1=Mon ...
  const add = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  d.setDate(d.getDate() + add);
  return d.toISOString().split('T')[0];
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Date.now() - p.savedAt > PROGRESS_TTL) { localStorage.removeItem(STORAGE_KEY); return null; }
    return p;
  } catch { return null; }
}

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch {}
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

const STEP_LABELS = { 1: 'Step 1 – Choosing a Plan', 2: 'Step 2 – Choosing your Box', 3: 'Step 3 – Viewing the Menu', 4: 'Step 4 – Choosing Delivery Days', 5: 'Step 5 – Setting Preferences', 6: 'Step 6 – Adding your Details', 7: 'Step 7 – Summary' };

/* ══════════════════════════════════════════════════════ */
const Subscriptions = () => {
  const { user } = useAuth();

  // Page-level state
  const [pageState, setPageState] = useState('loading'); // loading | wizard | active | lapsed
  const [activeSub, setActiveSub] = useState(null);
  const [lapsedSub, setLapsedSub] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState(null);
  const [box, setBox] = useState(null);
  const [slots, setSlots] = useState({}); // { monday: 'lunch'|'dinner', ... }
  const [prefs, setPrefs] = useState([]);
  const [startDate, setStartDate] = useState(() => getNextMonday());
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', line1: '', line2: '', city: '', postcode: '' });
  const [postcodeStatus, setPostcodeStatus] = useState(null); // null | 'checking' | { ok, city, msg }
  const [submitStatus, setSubmitStatus] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  /* detect user state on mount */
  useEffect(() => {
    const progress = loadProgress();
    if (progress) setSavedProgress(progress);

    if (!user) { setPageState('wizard'); return; }

    // pre-fill name/email from account
    setCustomer(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));

    api.get('/subscriptions')
      .then(res => {
        const active = res.data.find(s => s.status === 'active' || s.status === 'paused');
        const lapsed = res.data.find(s => s.status === 'cancelled');
        if (active) { setActiveSub(active); setPageState('active'); }
        else if (lapsed) { setLapsedSub(lapsed); setPageState('lapsed'); }
        else setPageState('wizard');
      })
      .catch(() => setPageState('wizard'));
  }, [user]);

  /* save wizard progress */
  useEffect(() => {
    if (pageState !== 'wizard' || step <= 1) return;
    saveProgress({ step, plan, box, slots, prefs, startDate });
  }, [step, plan, box, slots, prefs, startDate, pageState]);

  /* fetch menu preview when box selected */
  useEffect(() => {
    if (!box) return;
    const cat = BOX_TYPES.find(b => b.id === box)?.apiCategory || 'veg';
    setMenuLoading(true);
    api.get(`/menu?category=${cat}&available=true`)
      .then(r => setMenuItems(r.data.slice(0, 6)))
      .catch(() => setMenuItems([]))
      .finally(() => setMenuLoading(false));
  }, [box]);

  /* postcode validation */
  const checkPostcode = useCallback(async (pc) => {
    if (pc.trim().length < 3) { setPostcodeStatus(null); return; }
    setPostcodeStatus('checking');
    try {
      const res = await api.post('/delivery/check', { postcode: pc.trim() });
      const ok = res.data.service_type === 'full';
      setPostcodeStatus({ ok, city: res.data.city, msg: ok ? `We deliver to ${res.data.city} ✓` : 'Dabba Wala is not available in your area yet' });
    } catch { setPostcodeStatus({ ok: false, msg: 'Could not verify postcode' }); }
  }, []);

  /* restore saved progress */
  const restoreProgress = () => {
    if (!savedProgress) return;
    setPlan(savedProgress.plan || null);
    setBox(savedProgress.box || null);
    setSlots(savedProgress.slots || {});
    setPrefs(savedProgress.prefs || []);
    setStartDate(savedProgress.startDate || getNextMonday());
    setStep(savedProgress.step || 1);
    setSavedProgress(null);
  };

  /* quick re-subscribe from lapsed state */
  const quickResubscribe = () => {
    if (lapsedSub) {
      setPlan(lapsedSub.plan || null);
      setBox(lapsedSub.box_type || null);
      setPrefs(lapsedSub.preferences || []);
      const addr = lapsedSub.delivery_address || {};
      setCustomer(prev => ({ ...prev, line1: addr.line1 || '', line2: addr.line2 || '', city: addr.city || '', postcode: addr.postcode || '' }));
    }
    setPageState('wizard');
    setStep(lapsedSub ? 5 : 1);
  };

  /* slot toggle helpers */
  const toggleDay = (day) => {
    setSlots(prev => {
      if (prev[day]) { const n = { ...prev }; delete n[day]; return n; }
      return { ...prev, [day]: 'lunch' };
    });
  };
  const setSlotTime = (day, time) => setSlots(prev => ({ ...prev, [day]: time }));

  /* can proceed per step */
  const canProceed = () => {
    if (step === 1) return !!plan;
    if (step === 2) return !!box;
    if (step === 3) return true;
    if (step === 4) return Object.keys(slots).length >= (plan === 'weekly' ? 3 : 3);
    if (step === 5) return !!startDate;
    if (step === 6) return !!(customer.name && customer.email && customer.phone && customer.line1 && customer.city && customer.postcode && postcodeStatus?.ok);
    return true;
  };

  const goNext = () => { if (canProceed() && step < 7) setStep(s => s + 1); };
  const goBack = () => { if (step > 1) setStep(s => s - 1); };

  /* submit */
  const handleConfirm = async () => {
    setSubmitStatus('loading');
    try {
      await api.post('/subscriptions', {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        plan,
        box_type: box,
        preferences: prefs,
        start_date: startDate,
        delivery_slots: Object.entries(slots).map(([day, time]) => ({ day, time })),
        delivery_address: { line1: customer.line1, line2: customer.line2 || undefined, city: customer.city, postcode: customer.postcode },
      });
      clearProgress();
      setSubmitStatus('success');
    } catch { setSubmitStatus('error'); }
  };

  const planData     = DURATIONS.find(d => d.id === plan);
  const boxData      = BOX_TYPES.find(b => b.id === box);
  const selectedDays = WEEKDAYS.filter(d => slots[d.id]);

  /* ── loading ── */
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#800020', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  /* ── active subscriber ── */
  if (pageState === 'active' && activeSub) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            You're part of the Dabba Wala family
          </h1>
          <p className="text-gray-500 mb-8">Your subscription is active and meals are on their way.</p>

          <div className="rounded-2xl p-6 mb-8 text-left" style={{ background: 'linear-gradient(135deg, #800020 0%, #5C0015 100%)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(244,196,48,0.8)' }}>Active Subscription</p>
            <p className="text-xl font-bold text-white mb-1">{activeSub.plan?.charAt(0).toUpperCase() + activeSub.plan?.slice(1)} Plan — {activeSub.box_type} Box</p>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Delivering to {activeSub.delivery_address?.city}</p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/dashboard" className="px-5 py-2.5 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                Manage Subscription
              </Link>
              <button
                onClick={() => { setActiveSub(null); setPageState('wizard'); }}
                className="px-5 py-2.5 rounded text-sm font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              >
                Add a second subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── lapsed / welcome back ── */
  if (pageState === 'lapsed' && lapsedSub) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🍛</div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Welcome back! We've missed cooking for you
          </h1>
          <p className="text-gray-500 mb-2">Your last subscription was a <strong>{lapsedSub.plan}</strong> — {lapsedSub.box_type} box, delivering to {lapsedSub.delivery_address?.city}.</p>
          <p className="text-gray-400 text-sm mb-8">Pick up where you left off or start fresh.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={quickResubscribe}
              className="px-8 py-3.5 text-sm font-semibold text-white rounded-sm"
              style={{ backgroundColor: '#800020' }}
            >
              Re-subscribe with same preferences
            </button>
            <button
              onClick={() => setPageState('wizard')}
              className="px-8 py-3.5 text-sm font-semibold rounded-sm border-2"
              style={{ borderColor: '#800020', color: '#800020' }}
            >
              Start fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══ WIZARD ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ height: 'min(45vh, 360px)' }}>
        <img
          src="https://images.unsplash.com/photo-1657205937707-940bf77b2602?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Dabba Wala"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.92) 0%, rgba(128,0,32,0.7) 50%, rgba(128,0,32,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-end md:items-center pb-8 md:pb-0"
          style={{ paddingTop: 'calc(32px + 68px)' }}>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#F4C430' }}>The Dabba Wala Service</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Daily Dose of Home
            </h1>
            <p className="text-base text-gray-200 leading-relaxed">
              Fresh home-cooked South Indian meals delivered to your door. Mon–Fri, no cooking required.
            </p>
          </div>
        </div>
      </section>

      {/* Resume banner */}
      {savedProgress && pageState === 'wizard' && (
        <div className="px-4 md:px-8 py-3" style={{ backgroundColor: '#FFF8E6', borderBottom: '1px solid rgba(184,134,11,0.2)' }}>
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm font-medium" style={{ color: '#5C4B47' }}>
              <RotateCcw size={14} className="inline mr-1.5" />
              Welcome back! You left off at <strong>{STEP_LABELS[savedProgress.step]}</strong>.
            </p>
            <div className="flex gap-2">
              <button onClick={restoreProgress} className="px-4 py-1.5 text-xs font-semibold text-white rounded" style={{ backgroundColor: '#800020' }}>
                Continue
              </button>
              <button onClick={() => { clearProgress(); setSavedProgress(null); }} className="px-4 py-1.5 text-xs font-medium rounded border" style={{ color: '#9C7B6B', borderColor: 'rgba(128,0,32,0.2)' }}>
                Start fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="py-5 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE', borderBottom: '1px solid rgba(128,0,32,0.1)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{ backgroundColor: step > s.num ? '#4A7C59' : step === s.num ? '#800020' : '#e5e7eb', color: step >= s.num ? 'white' : '#9CA3AF' }}>
                    {step > s.num ? <Check size={14} /> : s.num}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:block" style={{ color: step >= s.num ? '#3D2B1F' : '#9CA3AF' }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1" style={{ backgroundColor: step > s.num ? '#4A7C59' : '#e5e7eb' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Wizard content */}
      <section className="py-10 md:py-14 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">

          {/* STEP 1 — Plan */}
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Choose Your Plan</h2>
              <p className="text-sm text-gray-400 mb-8">How long do you want homely meals delivered?</p>
              <div className="grid md:grid-cols-3 gap-5">
                {DURATIONS.map(dur => (
                  <button key={dur.id} onClick={() => setPlan(dur.id)}
                    className="relative p-6 rounded-xl text-left transition-all duration-200"
                    style={{ backgroundColor: 'white', border: plan === dur.id ? '2px solid #800020' : '2px solid transparent', boxShadow: plan === dur.id ? '0 8px 24px rgba(128,0,32,0.12)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {dur.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>Most Popular</span>
                    )}
                    <h3 className="text-xl font-bold mb-0.5" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>{dur.name}</h3>
                    <p className="text-xs text-gray-400 mb-3">{dur.days}</p>
                    <p className="text-3xl font-bold mb-0.5" style={{ color: '#800020' }}>{dur.price}</p>
                    <p className="text-xs font-semibold mb-3" style={{ color: '#B8860B' }}>{dur.perMeal}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{dur.desc}</p>
                    {plan === dur.id && <div className="absolute top-4 right-4"><Check size={18} style={{ color: '#800020' }} /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Box type */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Choose Your Box</h2>
              <p className="text-sm text-gray-400 mb-8">What kind of meals would you like every day?</p>
              <div className="grid md:grid-cols-3 gap-5">
                {BOX_TYPES.map(b => (
                  <button key={b.id} onClick={() => setBox(b.id)}
                    className="relative p-6 rounded-xl text-left transition-all duration-200"
                    style={{ backgroundColor: 'white', border: box === b.id ? `2px solid ${b.color}` : '2px solid transparent', boxShadow: box === b.id ? `0 8px 24px ${b.color}22` : '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <b.icon size={26} style={{ color: b.color }} className="mb-3" />
                    <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: b.color }}>{b.name}</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">{b.desc}</p>
                    <ul className="space-y-1.5">
                      {b.items.map(item => (
                        <li key={item} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Check size={11} style={{ color: b.color }} />{item}
                        </li>
                      ))}
                    </ul>
                    {box === b.id && <div className="absolute top-4 right-4"><Check size={18} style={{ color: b.color }} /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Menu preview */}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>A Taste of What's Coming</h2>
              <p className="text-sm text-gray-400 mb-8">Sample dishes from your <strong>{boxData?.name}</strong> — freshly made each morning.</p>
              {menuLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#800020', borderTopColor: 'transparent' }} />
                </div>
              ) : menuItems.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {menuItems.map(item => (
                    <div key={item.id} className="rounded-xl overflow-hidden bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover" />
                      )}
                      <div className="p-3">
                        <p className="text-sm font-bold mb-0.5" style={{ color: '#3D2B1F' }}>{item.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'rgba(128,0,32,0.04)' }}>
                  <p className="text-gray-400 text-sm">Menu loading — you'll receive a full preview by email once subscribed.</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-6 text-center">Menu rotates weekly. What you see above is a representative sample from our current menu.</p>
            </div>
          )}

          {/* STEP 4 — Delivery days */}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Choose Your Delivery Days</h2>
              <p className="text-sm text-gray-400 mb-2">Pick which days you want your meals delivered.</p>
              <p className="text-xs mb-8" style={{ color: '#B8860B' }}>
                {plan === 'weekly' ? 'Minimum 3 days required.' : 'Select your weekly pattern — it repeats every week.'}
              </p>

              <div className="grid grid-cols-5 gap-3 mb-6">
                {WEEKDAYS.map(day => {
                  const selected = !!slots[day.id];
                  return (
                    <button key={day.id} onClick={() => toggleDay(day.id)}
                      className="rounded-xl py-4 flex flex-col items-center gap-2 transition-all duration-200 font-medium text-sm"
                      style={{ border: selected ? '2px solid #800020' : '2px solid #e5e7eb', backgroundColor: selected ? 'rgba(128,0,32,0.06)' : 'white', color: selected ? '#800020' : '#6B7280' }}>
                      <span>{day.label}</span>
                      {selected && <Check size={14} style={{ color: '#800020' }} />}
                    </button>
                  );
                })}
              </div>

              {/* Time slot per selected day */}
              {Object.keys(slots).length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold" style={{ color: '#3D2B1F' }}>Preferred delivery time per day:</p>
                  {WEEKDAYS.filter(d => slots[d.id]).map(day => (
                    <div key={day.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'white', border: '1px solid rgba(128,0,32,0.1)' }}>
                      <span className="text-sm font-medium capitalize" style={{ color: '#3D2B1F', minWidth: 80 }}>{day.id}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setSlotTime(day.id, 'lunch')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ backgroundColor: slots[day.id] === 'lunch' ? '#800020' : 'transparent', color: slots[day.id] === 'lunch' ? 'white' : '#6B7280', border: '1px solid', borderColor: slots[day.id] === 'lunch' ? '#800020' : '#e5e7eb' }}>
                          <Sun size={12} /> Lunch (12–2pm)
                        </button>
                        <button onClick={() => setSlotTime(day.id, 'dinner')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ backgroundColor: slots[day.id] === 'dinner' ? '#800020' : 'transparent', color: slots[day.id] === 'dinner' ? 'white' : '#6B7280', border: '1px solid', borderColor: slots[day.id] === 'dinner' ? '#800020' : '#e5e7eb' }}>
                          <Moon size={12} /> Dinner (5–8pm)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5 — Preferences + start date */}
          {step === 5 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Fine-Tune Your Meals</h2>
              <p className="text-sm text-gray-400 mb-8">Any dietary preferences or exclusions? (All optional)</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-10">
                {PREFERENCES.map(p => (
                  <button key={p.id} onClick={() => setPrefs(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className="flex items-center gap-3 p-4 rounded-xl text-left text-sm font-medium transition-all duration-200"
                    style={{ backgroundColor: prefs.includes(p.id) ? 'rgba(128,0,32,0.05)' : 'white', border: prefs.includes(p.id) ? '2px solid #800020' : '2px solid #e5e7eb' }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: prefs.includes(p.id) ? '#800020' : 'transparent', border: prefs.includes(p.id) ? 'none' : '2px solid #D1D5DB' }}>
                      {prefs.includes(p.id) && <Check size={12} color="white" />}
                    </div>
                    <span style={{ color: prefs.includes(p.id) ? '#800020' : '#5C4B47' }}>{p.label}</span>
                  </button>
                ))}
              </div>

              <div className="max-w-xs">
                <label className="text-sm font-semibold block mb-2" style={{ color: '#2D2422' }}>Preferred Start Date *</label>
                <p className="text-xs text-gray-400 mb-2">Subscriptions always start on a Monday.</p>
                <div className="flex gap-2 mb-3">
                  {[0, 7].map((offset, i) => {
                    const d = getNextMonday(3 + offset);
                    const label = i === 0 ? 'This Monday' : 'Next Monday';
                    return (
                      <button key={d} onClick={() => setStartDate(d)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor: startDate === d ? '#800020' : 'transparent', color: startDate === d ? 'white' : '#800020', border: '1.5px solid', borderColor: '#800020' }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" />
              </div>
            </div>
          )}

          {/* STEP 6 — Personal details + address */}
          {step === 6 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Your Details</h2>
              <p className="text-sm text-gray-400 mb-8">Where should we deliver your meals?</p>
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                {[
                  { label: 'Full Name *',       key: 'name',     type: 'text',  placeholder: 'Your full name' },
                  { label: 'Email *',            key: 'email',    type: 'email', placeholder: 'you@example.com' },
                  { label: 'Phone *',            key: 'phone',    type: 'tel',   placeholder: '+44 7xxx xxxxxx' },
                  { label: 'Address Line 1 *',   key: 'line1',    type: 'text',  placeholder: '12 Curry Lane' },
                  { label: 'Address Line 2',     key: 'line2',    type: 'text',  placeholder: 'Flat / Apartment (optional)' },
                  { label: 'City *',             key: 'city',     type: 'text',  placeholder: 'Milton Keynes' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold block mb-1" style={{ color: '#2D2422' }}>{label}</label>
                    <input type={type} placeholder={placeholder} value={customer[key]}
                      onChange={e => setCustomer(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full p-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#2D2422' }}>Postcode *</label>
                  <input type="text" placeholder="MK9 1AB" value={customer.postcode}
                    onChange={e => { setCustomer(prev => ({ ...prev, postcode: e.target.value })); setPostcodeStatus(null); }}
                    onBlur={e => checkPostcode(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: postcodeStatus?.ok === false ? '#DC2626' : postcodeStatus?.ok ? '#4A7C59' : '#e5e7eb' }} />
                  {postcodeStatus === 'checking' && <p className="text-xs mt-1 text-gray-400">Checking postcode…</p>}
                  {postcodeStatus?.ok === true  && <p className="text-xs mt-1 font-medium" style={{ color: '#4A7C59' }}>{postcodeStatus.msg}</p>}
                  {postcodeStatus?.ok === false && <p className="text-xs mt-1 font-medium text-red-600">{postcodeStatus.msg}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7 — Summary */}
          {step === 7 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Your Subscription Summary</h2>
              <p className="text-sm text-gray-400 mb-8">Review everything before confirming.</p>

              {submitStatus === 'success' ? (
                <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: 'rgba(74,124,89,0.08)', border: '2px solid rgba(74,124,89,0.2)' }}>
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#4A7C59' }}>Subscription Confirmed!</h3>
                  <p className="text-gray-500 mb-2">Your Dabba Wala starts on <strong>{fmtDate(startDate)}</strong>.</p>
                  <p className="text-sm text-gray-400 mb-8">Check your email for confirmation details.</p>
                  <Link to="/dashboard" className="inline-block px-8 py-3 text-sm font-semibold text-white rounded-sm" style={{ backgroundColor: '#800020' }}>
                    Go to My Dashboard
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-6 md:p-8 space-y-5" style={{ boxShadow: '0 4px 24px rgba(128,0,32,0.08)' }}>
                  {/* Plan */}
                  <div className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid #f0ebe6' }}>
                    <div>
                      <p className="text-xs text-gray-400">Plan</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>{planData?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: '#800020' }}>{planData?.price}</p>
                      <p className="text-xs" style={{ color: '#B8860B' }}>{planData?.perMeal}</p>
                    </div>
                  </div>

                  {/* Box */}
                  <div className="pb-4" style={{ borderBottom: '1px solid #f0ebe6' }}>
                    <p className="text-xs text-gray-400 mb-1">Box</p>
                    <div className="flex items-center gap-2">
                      {boxData && <boxData.icon size={16} style={{ color: boxData.color }} />}
                      <p className="font-bold" style={{ color: boxData?.color }}>{boxData?.name}</p>
                    </div>
                  </div>

                  {/* Delivery days */}
                  {selectedDays.length > 0 && (
                    <div className="pb-4" style={{ borderBottom: '1px solid #f0ebe6' }}>
                      <p className="text-xs text-gray-400 mb-2">Delivery Days</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDays.map(d => (
                          <span key={d.id} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
                            {slots[d.id] === 'lunch' ? <Sun size={10} /> : <Moon size={10} />}
                            {d.id.charAt(0).toUpperCase() + d.id.slice(1)} · {slots[d.id] === 'lunch' ? 'Lunch' : 'Dinner'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prefs */}
                  {prefs.length > 0 && (
                    <div className="pb-4" style={{ borderBottom: '1px solid #f0ebe6' }}>
                      <p className="text-xs text-gray-400 mb-2">Preferences</p>
                      <div className="flex flex-wrap gap-2">
                        {prefs.map(p => (
                          <span key={p} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
                            {PREFERENCES.find(x => x.id === p)?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Start date */}
                  <div className="pb-4" style={{ borderBottom: '1px solid #f0ebe6' }}>
                    <p className="text-xs text-gray-400 mb-1">Start Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} style={{ color: '#B8860B' }} />
                      <p className="text-sm font-medium">{fmtDate(startDate)}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pb-4" style={{ borderBottom: '1px solid #f0ebe6' }}>
                    <p className="text-xs text-gray-400 mb-1">Delivering To</p>
                    <p className="text-sm font-medium">{customer.line1}{customer.line2 ? `, ${customer.line2}` : ''}, {customer.city}, {customer.postcode}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                    <div>
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-3xl font-bold" style={{ color: '#800020' }}>{planData?.price}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {submitStatus === 'error' && (
                        <p className="text-sm font-medium px-4 py-2 rounded-lg" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>Something went wrong. Please try again.</p>
                      )}
                      <button
                        onClick={handleConfirm}
                        disabled={submitStatus === 'loading'}
                        className="px-8 py-3.5 text-sm font-semibold tracking-wide uppercase text-white rounded-sm transition-all duration-300 hover:shadow-lg disabled:opacity-60"
                        style={{ backgroundColor: '#800020' }}
                      >
                        {submitStatus === 'loading' ? 'Confirming…' : 'Confirm Subscription'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {submitStatus !== 'success' && (
            <div className="flex justify-between mt-10">
              {step > 1 ? (
                <button onClick={goBack} className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm border-2 transition-all"
                  style={{ borderColor: '#800020', color: '#800020' }}>
                  <ArrowLeft size={16} /> Back
                </button>
              ) : <div />}
              {step < 7 && (
                <button onClick={goNext} disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                  style={{ backgroundColor: '#800020' }}>
                  Next <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default Subscriptions;
