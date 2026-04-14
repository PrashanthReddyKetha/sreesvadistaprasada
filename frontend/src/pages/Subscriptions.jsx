import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Leaf, Flame, ChevronLeft, ChevronRight, RotateCcw, Shield, Clock, Package, Star, CreditCard, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STRIPE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

const CARD_STYLE = {
  style: {
    base: { fontSize: '14px', color: '#2D2422', fontFamily: 'inherit', '::placeholder': { color: '#9CA3AF' } },
    invalid: { color: '#DC2626' },
  },
};

/* ── brand ────────────────────────────────────────────── */
const C = {
  primary: '#800020', gold: '#F4C430', darkGold: '#B8860B',
  green: '#4A7C59', greenLight: '#E1F5EE', greenText: '#0F6E56',
  amberLight: '#FAEEDA', amberText: '#854F0B',
  cream: '#FDFBF7', surface: '#F9F6EE',
  dark: '#2D2422', muted: '#9C7B6B',
};

/* ── constants ────────────────────────────────────────── */
const STORAGE_KEY = 'ssp_dabba_v4';
const STORAGE_TTL = 7 * 24 * 60 * 60 * 1000;

const PLANS = [
  { id: 'weekly',  name: 'Weekly trial',  price: 45,  perMeal: 9,  meals: 5,  badge: 'Start here',   badgeStyle: { backgroundColor: C.greenLight, color: C.greenText } },
  { id: 'monthly', name: 'Monthly saver', price: 160, perMeal: 8,  meals: 20, badge: 'Best value',  badgeStyle: { backgroundColor: C.amberLight, color: C.amberText } },
];

const BOXES = [
  { id: 'prasada',  name: 'Prasada box',  icon: Leaf,  iconBg: C.greenLight, iconColor: C.green,   border: C.green,   desc: 'Pure vegetarian. Temple-style cooking. Made with devotion.', mostChosen: false },
  { id: 'svadista', name: 'Svadista box', icon: Flame, iconBg: '#FAECE7',   iconColor: C.primary, border: C.primary, desc: 'Non-vegetarian. Bold village flavours. Hearty and real.',    mostChosen: true  },
];

// Review counts: start small, auto-grow by a fixed amount each week from launch date
const REVIEW_COUNT_START_DATE = new Date('2026-04-14T00:00:00');
function getLiveReviewCount(base, weeklyGrowth) {
  const weeksLive = Math.max(0, Math.floor((Date.now() - REVIEW_COUNT_START_DATE) / (7 * 24 * 60 * 60 * 1000)));
  return base + weeksLive * weeklyGrowth;
}
const BOX_SOCIAL = {
  prasada:  { count: '30+', window: 'last 2 weeks', rating: 5, get reviewCount() { return getLiveReviewCount(8, 3); } },
  svadista: { count: '75+', window: 'last 3 weeks', rating: 5, get reviewCount() { return getLiveReviewCount(14, 5); } },
};

const PREFS = [
  { id: 'no-onion',    label: 'No onion / garlic' },
  { id: 'less-spice',  label: 'Less spicy' },
  { id: 'extra-spice', label: 'Extra spicy' },
  { id: 'no-egg',      label: 'No egg' },
  { id: 'jain',        label: 'Jain preference' },
  { id: 'no-mushroom', label: 'No mushroom' },
  { id: 'no-brinjal',  label: 'No brinjal' },
  { id: 'gluten-free', label: 'Gluten-free where possible' },
];

const DELIVERY_INSTRUCTIONS = [
  { id: 'call',      label: 'Call me on arrival',        sub: 'I will always be home',                  hasFields: false },
  { id: 'door',      label: 'Leave at my door',          sub: 'I accept responsibility once left',      hasFields: false },
  { id: 'neighbour', label: 'Leave with my neighbour',   sub: 'We will need their details',             hasFields: true  },
  { id: 'safeplace', label: 'Leave in my safe place',    sub: 'Tell us where',                          hasFields: true  },
];

const STEPS = [
  { num: 1, label: 'Plan' }, { num: 2, label: 'Box' },
  { num: 3, label: 'Menu' }, { num: 4, label: 'Prefs' },
  { num: 5, label: 'Details' }, { num: 6, label: 'Confirm' },
];

/* ── week config ──────────────────────────────────────── */
/**
 * Auto-rolling weeks. The "recommended start week" is the upcoming Monday,
 * unless subscriptions are closed for that week — in which case we roll forward by 1.
 *
 * Closure rule: next Monday closes at Sunday 17:00. So a visitor on:
 *   - Monday–Saturday: recommended = next Monday
 *   - Sunday before 17:00: recommended = next Monday (tomorrow)
 *   - Sunday 17:00+ OR day is Monday (already started): recommended = the Monday after
 *
 * Returns { weeks[], startIdx, closedMessage }. Caller slices based on plan.
 */
function getWeekConfig() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  const getMonday = (d) => {
    const date = new Date(d);
    const diff = date.getDay() === 0 ? 1 : 8 - date.getDay(); // days until NEXT Monday (always forward)
    date.setDate(date.getDate() + diff);
    date.setHours(12, 0, 0, 0);
    return date;
  };

  // Is the upcoming Monday closed? (Sun 17:00+ or already Monday/later in the week means the "coming" Monday is this past/today)
  // But since getMonday() always returns FUTURE Monday, closure just means: Sun after 17:00.
  const nextMondayClosed = day === 0 && hour >= 17;

  const firstMonday = getMonday(now);
  if (nextMondayClosed) firstMonday.setDate(firstMonday.getDate() + 7);

  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const m = new Date(firstMonday);
    m.setDate(m.getDate() + i * 7);
    weeks.push({
      label: i === 0 ? 'Next week' : i === 1 ? 'The week after' : `In ${i + 1} weeks`,
      monday: m,
      badge: i === 0 ? 'Recommended start' : 'Preview',
    });
  }

  return {
    weeks,
    closedMessage: nextMondayClosed
      ? "Subscriptions for next week have closed — our team is already prepping those meals. Your recommended start week is the one after."
      : null,
  };
}

function isoDate(d) {
  // Use local date parts — toISOString() is UTC and shifts the date back in BST/UTC+ timezones
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtShort(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtFull(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function weekRange(monday) {
  const fri = new Date(monday); fri.setDate(fri.getDate() + 4);
  return `${fmtShort(isoDate(monday))} – ${fmtShort(isoDate(fri))}`;
}

function daysFromNow(iso) {
  const diff = new Date(iso + 'T12:00:00') - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const WEEKDAY_FULL   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/* Day food images (South Indian) */
const DAY_FOOD_IMGS = [
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=240&q=75',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=240&q=75',
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=240&q=75',
  'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=240&q=75',
  'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=240&q=75',
];

/* Social proof */
const BOX_REVIEWS = {
  prasada: [
    { name: 'Ananya M.', text: 'The flavours took me right back to my grandmother\'s kitchen in Chennai.' },
    { name: 'Priya K.', text: 'Every day feels like a home-cooked meal — incredibly fresh and wholesome.' },
    { name: 'Kavitha R.', text: 'Ordered for one week and renewed for a month. Cannot imagine weekdays without it.' },
    { name: 'Sunita P.', text: 'Pure vegetarian done perfectly. The rasam on Wednesdays is divine.' },
    { name: 'Deepa S.', text: 'As a busy mum, this has been a lifesaver. My kids love every single meal.' },
    { name: 'Meera J.', text: 'Temple-style cooking that somehow manages to feel personal every time.' },
    { name: 'Lakshmi V.', text: 'The freshness is unreal for a delivery service. Like a freshly cooked meal.' },
    { name: 'Radha N.', text: 'Light enough for everyday eating but full of the right flavours and warmth.' },
    { name: 'Usha B.', text: 'I requested no garlic and they honoured it every single day without fail.' },
    { name: 'Geetha T.', text: 'I have tried other meal plans but nothing comes close to this quality.' },
    { name: 'Padma C.', text: 'The rice is always perfectly cooked — never mushy, never undercooked.' },
    { name: 'Vasantha L.', text: 'A genuine taste of South India. I look forward to every lunch delivery.' },
    { name: 'Nirmala A.', text: 'Wonderful value for the quality. You can tell every dish is made with care.' },
    { name: 'Hema D.', text: 'My colleagues at work are jealous every time I open my dabba.' },
    { name: 'Santha W.', text: 'Consistent, fresh and absolutely delicious every single day of the week.' },
  ],
  svadista: [
    { name: 'Ravi K.', text: 'The chicken curry on Tuesdays alone is worth the subscription. Brilliant.' },
    { name: 'Suresh M.', text: 'Bold, spicy and exactly how my mum used to cook back in Andhra.' },
    { name: 'Ajay P.', text: 'First week I thought it was good. Second week I thought it was exceptional.' },
    { name: 'Kiran T.', text: 'The gravy-to-rice ratio is perfect. I have never been disappointed once.' },
    { name: 'Vijay N.', text: 'Requested extra spice and they absolutely delivered — proper village-style heat.' },
    { name: 'Arun S.', text: 'I live alone and this has completely changed my work-week lunches.' },
    { name: 'Mahesh B.', text: 'The mutton on Fridays is slow-cooked to perfection. Just incredible.' },
    { name: 'Sanjay R.', text: 'Authentic South Indian non-veg cooking is rare to find. This is the real deal.' },
    { name: 'Rohit G.', text: 'Hearty, full-flavoured meals that actually keep me going through the afternoon.' },
    { name: 'Pavan C.', text: 'Three months in and I still get excited when my dabba arrives each day.' },
    { name: 'Dinesh V.', text: 'The consistency is the best part — every meal is as good as the last.' },
    { name: 'Naresh L.', text: 'My friends now order here based on my recommendation. Worth every penny.' },
    { name: 'Prasad A.', text: 'Reminds me of eating at the local dhabas back home in Hyderabad.' },
    { name: 'Kishore J.', text: 'The packaging keeps it perfectly warm even an hour after delivery.' },
    { name: 'Venkat W.', text: 'Switched from another meal service after the first trial. No looking back.' },
  ],
};

/* ── localStorage ─────────────────────────────────────── */
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Date.now() - p.savedAt > STORAGE_TTL) { localStorage.removeItem(STORAGE_KEY); return null; }
    return p;
  } catch { return null; }
}
function saveProg(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch {}
}
function clearProg() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }

/* ── small shared UI ──────────────────────────────────── */
const InfoBox = ({ bg, border, color, children }) => (
  <div className="rounded-lg px-4 py-3 text-sm leading-relaxed" style={{ backgroundColor: bg, border: `0.5px solid ${border}`, color, fontSize: 13, lineHeight: 1.6 }}>
    {children}
  </div>
);

function ReviewCarousel({ boxId }) {
  const reviews = BOX_REVIEWS[boxId] || BOX_REVIEWS.prasada;
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % reviews.length), 3800);
    return () => clearInterval(t);
  }, [reviews.length]);
  const r = reviews[idx];
  return (
    <div className="rounded-xl px-4 py-3 text-left transition-all" style={{ backgroundColor: 'rgba(128,0,32,0.04)', border: '0.5px solid rgba(128,0,32,0.1)', minHeight: 62 }}>
      <p className="text-xs leading-relaxed mb-1" style={{ color: C.dark }}>"{r.text}"</p>
      <p className="text-[10px] font-semibold" style={{ color: C.muted }}>— {r.name}</p>
    </div>
  );
}

function StarRating({ count, reviewCount }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#F4C430" stroke="none" />)}
      </div>
      <span className="text-[11px] font-semibold" style={{ color: C.darkGold }}>{reviewCount.toLocaleString()} ratings</span>
    </div>
  );
}

function SocialProofBlock({ boxId }) {
  const s = BOX_SOCIAL[boxId];
  if (!s) return null;
  return (
    <div className="mt-4 rounded-xl p-4 space-y-2.5" style={{ backgroundColor: C.surface, border: '0.5px solid rgba(128,0,32,0.08)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold" style={{ color: C.muted }}>
          <span className="text-sm font-bold" style={{ color: C.primary }}>{s.count}</span> subscribed in the {s.window}
        </p>
        <StarRating count={s.rating} reviewCount={s.reviewCount} />
      </div>
      <ReviewCarousel boxId={boxId} />
    </div>
  );
}

const StepIndicator = ({ step }) => (
  <div className="py-5 px-4 md:px-8" style={{ backgroundColor: C.surface, borderBottom: `0.5px solid rgba(128,0,32,0.1)` }}>
    <div className="max-w-2xl mx-auto flex items-center justify-between">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{ backgroundColor: step > s.num ? C.green : step === s.num ? C.primary : '#e5e7eb', color: step >= s.num ? 'white' : '#9CA3AF' }}>
              {step > s.num ? <Check size={13} /> : s.num}
            </div>
            <span className="text-[10px] font-medium hidden sm:block" style={{ color: step >= s.num ? C.dark : '#9CA3AF' }}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className="flex-1 h-px mx-1" style={{ backgroundColor: step > s.num ? C.green : '#e5e7eb' }} />}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const NavButtons = ({ step, onBack, onNext, nextDisabled, nextLabel }) => (
  <div className="flex justify-between mt-10 pt-6" style={{ borderTop: `0.5px solid rgba(128,0,32,0.1)` }}>
    {step > 1
      ? <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm border-2 transition-all"
          style={{ borderColor: C.primary, color: C.primary }}><ArrowLeft size={15} /> Back</button>
      : <div />}
    <button onClick={onNext} disabled={nextDisabled}
      className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: C.primary }}>
      {nextLabel || 'Next'} <ArrowRight size={15} />
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════ */
const SubscriptionsInner = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, setAuthOpen } = useAuth();
  // useMemo prevents getWeekConfig() from returning a new object reference every render,
  // which would break useCallback(fetchMenu) and cause an infinite fetch loop.
  const weekCfg = useMemo(() => getWeekConfig(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // wizard state
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('weekly');
  const [selectedBox, setSelectedBox] = useState(null);
  const [menuTab, setMenuTab] = useState(0);
  const [monthlyPage, setMonthlyPage] = useState(0); // carousel offset for monthly plan (shows 2 weeks at a time)
  const [menuData, setMenuData] = useState({});
  const [menuLoading, setMenuLoading] = useState({});
  const [menuError, setMenuError] = useState({});
  const [selectedStartWeek, setSelectedStartWeek] = useState(null);
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [customRequest, setCustomRequest] = useState('');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', line1: '', line2: '', city: '', postcode: '' });
  const [deliveryInstruction, setDeliveryInstruction] = useState(null);
  const [neighbourName, setNeighbourName] = useState('');
  const [neighbourDoor, setNeighbourDoor] = useState('');
  const [safePlaceDesc, setSafePlaceDesc] = useState('');
  const [postcodeStatus, setPostcodeStatus] = useState(null); // null | 'checking' | {ok, city, msg}
  const [isGuest, setIsGuest] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedProgress, setSavedProgress] = useState(null);
  const [pageState, setPageState] = useState('loading'); // loading | wizard | active | lapsed
  const [activeSub, setActiveSub] = useState(null);
  const [lapsedSub, setLapsedSub] = useState(null);
  const postcodeTimer = useRef(null);
  const wizardTopRef  = useRef(null);

  /* scroll to wizard top on every step change */
  useEffect(() => {
    if (pageState !== 'wizard') return;
    const el = wizardTopRef.current;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }, [step, pageState]);

  /* detect user state on mount */
  useEffect(() => {
    const prog = loadSaved();
    if (prog) setSavedProgress(prog);

    if (!user) { setPageState('wizard'); return; }

    setCustomer(prev => ({ ...prev, name: user.name || '', email: user.email || '', phone: user.phone || '' }));

    api.get('/subscriptions').then(res => {
      const subs = res.data;
      const today = new Date().toISOString().split('T')[0];
      const active = subs.find(s => s.status === 'active' && (!s.end_date || s.end_date >= today));
      const lapsed = subs.find(s => s.status === 'expired' || s.status === 'cancelled');
      if (active) { setActiveSub(active); setPageState('active'); }
      else if (lapsed) { setLapsedSub(lapsed); setPageState('lapsed'); }
      else setPageState('wizard');
    }).catch(() => setPageState('wizard'));
  }, [user]);

  /* save progress */
  useEffect(() => {
    if (pageState !== 'wizard' || step <= 1) return;
    saveProg({ step, selectedPlan, selectedBox, selectedPrefs, customRequest, selectedStartWeek });
  }, [step, selectedPlan, selectedBox, selectedPrefs, customRequest, selectedStartWeek, pageState]);

  /* Number of weeks shown in preview depends on plan */
  const previewCount = selectedPlan === 'monthly' ? 4 : 2;

  /* set start week when tab changes in step 3 */
  useEffect(() => {
    const w = weekCfg.weeks[menuTab];
    if (w) setSelectedStartWeek(isoDate(w.monday));
  }, [menuTab, weekCfg.weeks]); // eslint-disable-line react-hooks/exhaustive-deps

  /* fetch menu for a tab — with auto-retry for Render cold start */
  const fetchMenu = useCallback(async (tabIdx, attempt = 1) => {
    if (!selectedBox) return;
    const w = weekCfg.weeks[tabIdx];
    if (!w) return;
    const week = isoDate(w.monday);
    setMenuLoading(prev => ({ ...prev, [tabIdx]: true }));
    setMenuError(prev => ({ ...prev, [tabIdx]: null }));
    try {
      const res = await api.get(`/menu/weekly-preview?week=${week}&box_type=${selectedBox}`);
      setMenuData(prev => ({ ...prev, [tabIdx]: res.data }));
    } catch {
      if (attempt < 3) {
        setMenuError(prev => ({ ...prev, [tabIdx]: 'waking' }));
        setTimeout(() => fetchMenu(tabIdx, attempt + 1), 6000);
      } else {
        setMenuError(prev => ({ ...prev, [tabIdx]: 'Could not load the menu. Please try again.' }));
      }
    } finally {
      setMenuLoading(prev => ({ ...prev, [tabIdx]: false }));
    }
  }, [selectedBox, weekCfg]);

  useEffect(() => {
    if (step === 3 && selectedBox) {
      for (let i = 0; i < previewCount; i++) fetchMenu(i);
    }
  }, [step, selectedBox, previewCount, fetchMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  /* postcode validation */
  const checkPostcode = useCallback(async (pc) => {
    if (!pc || pc.trim().length < 3) { setPostcodeStatus(null); return; }
    setPostcodeStatus('checking');
    try {
      const res = await api.post('/delivery/check', { postcode: pc.trim().toUpperCase() });
      const ok = res.data.service_type === 'full';
      const nextMon = isoDate(weekCfg.weeks[0].monday);
      setPostcodeStatus({
        ok,
        city: res.data.city,
        msg: ok
          ? `Postcode verified — we deliver to ${res.data.city}. Your meals will be on their way from ${fmtShort(nextMon)}.`
          : 'We do not currently deliver to this postcode. We serve Milton Keynes, Edinburgh, and Glasgow.',
      });
    } catch { setPostcodeStatus({ ok: false, msg: 'Could not verify postcode.' }); }
  }, [weekCfg]);

  const handlePostcodeChange = (val) => {
    // Only allow alphanumeric characters and spaces
    const sanitized = val.replace(/[^a-zA-Z0-9\s]/g, '');
    setCustomer(prev => ({ ...prev, postcode: sanitized }));
    setPostcodeStatus(null);
    clearTimeout(postcodeTimer.current);
    postcodeTimer.current = setTimeout(() => checkPostcode(sanitized), 600);
  };

  /* proceed validation */
  const canProceed = () => {
    if (step === 1) return !!selectedPlan;
    if (step === 2) return !!selectedBox;
    if (step === 3) return !!selectedStartWeek;
    if (step === 4) return true;
    if (step === 5) {
      const baseFields = customer.name && customer.email && customer.phone && customer.line1 && customer.city && customer.postcode && postcodeStatus?.ok && !!deliveryInstruction;
      if (!baseFields) return false;
      if (deliveryInstruction === 'neighbour') return !!(neighbourName && neighbourDoor);
      if (deliveryInstruction === 'safeplace') return !!safePlaceDesc;
      return true;
    }
    if (step === 6) return termsChecked;
    return true;
  };

  const goBackRef = useRef(null);
  const goBack = () => {
    // If guest chose "Continue as guest" and hits Back, show the 3-option screen again
    if (step === 5 && isGuest) { setIsGuest(false); return; }
    if (step > 1) setStep(s => s - 1);
  };
  goBackRef.current = goBack;
  const goNext = () => { if (canProceed() && step < 6) setStep(s => s + 1); };

  // Intercept browser back button — stay in wizard instead of navigating away
  useEffect(() => {
    if (pageState !== 'wizard' || submitStatus === 'success') return;
    window.history.pushState(null, '', window.location.href);
    const handler = () => {
      window.history.pushState(null, '', window.location.href);
      if (goBackRef.current) goBackRef.current();
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [step, isGuest, pageState, submitStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  /* submit */
  const handleConfirm = async () => {
    if (!stripe || !elements) { setErrorMessage('Payment not ready. Please wait a moment.'); setSubmitStatus('error'); return; }
    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) { setErrorMessage('Please enter your card details.'); setSubmitStatus('error'); return; }
    setSubmitStatus('loading');
    setErrorMessage('');
    try {
      const planPrice = planData?.price || 45;
      // 1. Create payment intent
      const intentRes = await api.post('/payments/create-intent', { amount: planPrice });
      const { client_secret, payment_intent_id } = intentRes.data;
      // 2. Confirm card payment with individual elements
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: cardNumberElement, billing_details: { name: customer.name, email: customer.email, address: { postal_code: customer.postcode } } },
      });
      if (stripeError) { setSubmitStatus('error'); setErrorMessage(stripeError.message || 'Payment failed. Please try again.'); return; }
      if (paymentIntent.status !== 'succeeded') { setSubmitStatus('error'); setErrorMessage('Payment was not completed. Please try again.'); return; }
      // 3. Create subscription
      await api.post('/subscriptions', {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        plan: selectedPlan,
        box_type: selectedBox,
        preferences: selectedPrefs,
        custom_request: customRequest || undefined,
        start_date: selectedStartWeek,
        delivery_address: { line1: customer.line1, line2: customer.line2 || undefined, city: customer.city, postcode: customer.postcode },
        delivery_instruction: deliveryInstruction,
        neighbour_name: deliveryInstruction === 'neighbour' ? neighbourName : undefined,
        neighbour_door: deliveryInstruction === 'neighbour' ? neighbourDoor : undefined,
        safe_place_description: deliveryInstruction === 'safeplace' ? safePlaceDesc : undefined,
        is_guest: isGuest || !user,
        user_id: user?.id || undefined,
        payment_intent_id,
      });
      clearProg();
      localStorage.setItem('ssp_subscription_success', 'true');
      setSubmitStatus('success');
    } catch (e) {
      setSubmitStatus('error');
      setErrorMessage(e.response?.data?.detail || 'Something went wrong. Please try again.');
    }
  };

  const planData = PLANS.find(p => p.id === selectedPlan);
  const boxData  = BOXES.find(b => b.id === selectedBox);
  const activeTabCfg = weekCfg.weeks[menuTab];
  const currentMenuData = menuData[menuTab];

  /* load success state from localStorage on mount */
  useEffect(() => {
    const savedSuccess = localStorage.getItem('ssp_subscription_success');
    if (savedSuccess) {
      setSubmitStatus('success');
      localStorage.removeItem('ssp_subscription_success');
    }
  }, []);

  /* ── loading ── */
  if (pageState === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: C.primary, borderTopColor: 'transparent' }} />
    </div>
  );

  /* ── active subscriber ── */
  if (pageState === 'active' && activeSub) return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" />
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-5">🎉</div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>You're part of the Dabba Wala family</h1>
        <p className="text-sm mb-8" style={{ color: C.muted }}>Your subscription is active and meals are on their way.</p>
        <div className="rounded-2xl p-6 mb-6 text-left" style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #5C0015 100%)` }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(244,196,48,0.8)' }}>Active</p>
          <p className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
            {activeSub.plan?.charAt(0).toUpperCase() + activeSub.plan?.slice(1)} Plan — {activeSub.box_type} Box
          </p>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>Delivering to {activeSub.delivery_address?.city}</p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/dashboard" className="px-5 py-2.5 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>Manage subscription</Link>
            <button onClick={() => { setActiveSub(null); setPageState('wizard'); }} className="px-5 py-2.5 rounded text-sm font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
              Add a second subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── lapsed subscriber ── */
  if (pageState === 'lapsed' && lapsedSub) return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" />
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-5">🍛</div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>Welcome back! We've missed cooking for you</h1>
        <p className="text-sm mb-8" style={{ color: C.muted }}>
          You were on the <strong>{lapsedSub.plan}</strong> — {lapsedSub.box_type} box, delivering to {lapsedSub.delivery_address?.city}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => {
            setSelectedPlan(lapsedSub.plan || 'weekly');
            setSelectedBox(lapsedSub.box_type || null);
            setSelectedPrefs(lapsedSub.preferences || []);
            const addr = lapsedSub.delivery_address || {};
            setCustomer(prev => ({ ...prev, line1: addr.line1 || '', line2: addr.line2 || '', city: addr.city || '', postcode: addr.postcode || '' }));
            setPageState('wizard'); setStep(4);
          }} className="px-8 py-3.5 text-sm font-semibold text-white rounded-sm" style={{ backgroundColor: C.primary }}>
            Re-subscribe with same preferences
          </button>
          <button onClick={() => setPageState('wizard')} className="px-8 py-3.5 text-sm font-semibold rounded-sm border-2" style={{ borderColor: C.primary, color: C.primary }}>
            Start fresh
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════ */
  /* ── SUCCESS SCREEN ─────────────────────────────────── */
  if (submitStatus === 'success') {
    const startMonday = selectedStartWeek;
    const days = daysFromNow(startMonday);
    const sunBefore = new Date(startMonday + 'T12:00:00');
    sunBefore.setDate(sunBefore.getDate() - 1);
    const meals = planData?.id === 'weekly' ? 5 : 20;
    const currentMenu = menuData[menuTab];
    const menuDays = currentMenu ? Object.entries(currentMenu.days || {}).slice(0, 5) : [];

    return (
      <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
        <div className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" />
        <div className="max-w-2xl mx-auto px-4 py-14">
          {/* Green tick */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: C.greenLight }}>
              <Check size={36} style={{ color: C.green }} strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>Welcome to the family!</h1>
            <p className="text-base leading-relaxed" style={{ color: '#5C4B47' }}>
              Your Dabba Wala starts <strong>{fmtFull(startMonday)}</strong>. Freshly cooked meals are being planned for you right now.
              Check your email for your full meal calendar and delivery details.
            </p>
          </div>

          {/* Milestone card */}
          <div className="rounded-xl p-5 mb-5" style={{ backgroundColor: C.amberLight, border: `0.5px solid ${C.darkGold}` }}>
            <p className="font-bold text-base mb-1.5" style={{ color: C.amberText }}>Your first meal is {days} day{days !== 1 ? 's' : ''} away</p>
            <p className="text-sm leading-relaxed" style={{ color: C.amberText }}>
              Our kitchen starts preparing your ingredients on {sunBefore.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}. By {fmtFull(startMonday)}, your {boxData?.name} will be made fresh and on its way to you by noon.
            </p>
          </div>

          {/* Meal preview */}
          {menuDays.length > 0 && (
            <div className="rounded-xl p-5 mb-5" style={{ backgroundColor: C.surface, border: `0.5px solid rgba(128,0,32,0.1)` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.darkGold }}>Your start week meals</p>
              <div className="space-y-2">
                {menuDays.map(([date, day]) => (
                  <div key={date} className="flex items-start gap-3 text-sm">
                    <span className="font-semibold w-10 shrink-0" style={{ color: C.muted }}>
                      {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}
                    </span>
                    {day.is_placeholder || !day.items?.length
                      ? <span className="italic" style={{ color: C.muted }}>Menu is on the way 🍱</span>
                      : <span style={{ color: C.dark }}>{day.items.map(it => typeof it === 'string' ? it : it.name).join(' · ')}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warm message */}
          <p className="text-sm leading-relaxed text-center mb-8" style={{ color: C.muted }}>
            Thank you for trusting us with your weekday meals. We cook every box as if it were going to our own family. We will not let you down. 🙏
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard" className="px-8 py-3.5 text-sm font-semibold text-white rounded-sm text-center" style={{ backgroundColor: C.primary }}>
              Go to my dashboard
            </Link>
            <Link to="/" className="px-8 py-3.5 text-sm font-semibold rounded-sm border-2 text-center" style={{ borderColor: C.primary, color: C.primary }}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ══ WIZARD ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ height: 'min(42vh, 340px)' }}>
        <img src="https://images.unsplash.com/photo-1657205937707-940bf77b2602?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Dabba Wala" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, rgba(128,0,32,0.92) 0%, rgba(128,0,32,0.7) 50%, rgba(128,0,32,0.5) 100%)` }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-end md:items-center pb-8 md:pb-0" style={{ paddingTop: 'calc(32px + 68px)' }}>
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#F4C430' }}>The Dabba Wala Service</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Your Daily Dose of Home</h1>
            <p className="text-sm text-gray-200">Fresh South Indian meals delivered Mon–Fri. No cooking required.</p>
          </div>
        </div>
      </section>

      {/* Resume banner */}
      {savedProgress && pageState === 'wizard' && step === 1 && (
        <div className="px-4 md:px-8 py-3" style={{ backgroundColor: C.amberLight, borderBottom: `0.5px solid ${C.darkGold}` }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm font-medium" style={{ color: C.amberText }}>
              <RotateCcw size={13} className="inline mr-1.5" />
              You left off at Step {savedProgress.step}. Continue where you left off?
            </p>
            <div className="flex gap-2">
              <button onClick={() => {
                setSelectedPlan(savedProgress.selectedPlan || 'weekly');
                setSelectedBox(savedProgress.selectedBox || null);
                setSelectedPrefs(savedProgress.selectedPrefs || []);
                setCustomRequest(savedProgress.customRequest || '');
                {
                  const recommended = isoDate(weekCfg.weeks[0].monday);
                  const saved = savedProgress.selectedStartWeek;
                  // Drop saved start week if it's earlier than the current recommended Monday
                  // (e.g. user resumed a session from a previous week).
                  const valid = saved && saved >= recommended && weekCfg.weeks.some(w => isoDate(w.monday) === saved);
                  setSelectedStartWeek(valid ? saved : recommended);
                  if (!valid) setMenuTab(0);
                }
                setStep(savedProgress.step || 1);
                setSavedProgress(null);
              }} className="px-4 py-1.5 text-xs font-semibold text-white rounded" style={{ backgroundColor: C.primary }}>Continue</button>
              <button onClick={() => { clearProg(); setSavedProgress(null); }} className="px-4 py-1.5 text-xs rounded border" style={{ color: C.muted, borderColor: 'rgba(128,0,32,0.2)' }}>Start fresh</button>
            </div>
          </div>
        </div>
      )}

      <div ref={wizardTopRef} />
      <StepIndicator step={step} />

      <section className="py-10 md:py-14 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">

          {/* ── STEP 1 — PLAN ──────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>Choose your plan</h2>
              <p className="text-sm mb-6" style={{ color: C.muted }}>Home-cooked South Indian meals, freshly made every morning, delivered to your door.</p>

              {/* Encouraging message */}
              {(!user || !lapsedSub) && (
                <InfoBox bg={C.amberLight} border={C.darkGold} color={C.amberText}>
                  New here? Most of our monthly subscribers started with a Weekly Trial first. Five meals, one week — the best way to experience the food before committing to more.
                </InfoBox>
              )}
              {user && lapsedSub && (
                <InfoBox bg={C.amberLight} border={C.darkGold} color={C.amberText}>
                  Welcome back. Ready for another week of home cooking? 🙏
                </InfoBox>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                    className="relative p-5 rounded-xl text-left transition-all duration-200"
                    style={{ backgroundColor: 'white', border: selectedPlan === plan.id ? `2px solid ${C.primary}` : '0.5px solid #e0d9d0', boxShadow: selectedPlan === plan.id ? `0 4px 20px rgba(128,0,32,0.1)` : '0 2px 6px rgba(0,0,0,0.04)' }}>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-3" style={plan.badgeStyle}>{plan.badge}</span>
                    <p className="font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.primary }}>{plan.name}</p>
                    <p className="mb-1" style={{ fontSize: 24, fontWeight: 500, color: C.primary }}>£{plan.price}</p>
                    <p className="text-sm" style={{ color: C.muted }}>{plan.meals} meals · Mon–Fri · Serves 1</p>
                    <p className="text-xs" style={{ color: C.muted }}>£{plan.perMeal} per meal · Lunch delivery 12–2pm</p>
                    {selectedPlan === plan.id && <div className="absolute top-4 right-4"><Check size={16} style={{ color: C.primary }} /></div>}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <InfoBox bg={C.surface} border="#e0d9d0" color={C.muted}>
                  No hidden charges, no auto-renewal — you are always in control.
                </InfoBox>
              </div>

              {/* Social proof strip — steps 1–3 */}
              <SocialProofBlock boxId="svadista" />
              <NavButtons step={step} onBack={goBack} onNext={goNext} nextDisabled={!canProceed()} />
            </div>
          )}

          {/* ── STEP 2 — BOX ──────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>Choose your box</h2>
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <p className="text-sm" style={{ color: C.muted }}>Two boxes. Each one has its own personality — find yours.</p>
                <div className="flex items-center gap-3 ml-auto shrink-0">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: C.amberLight, color: C.amberText }}>🕛 Lunch only · 12–2pm</span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: C.surface, color: C.muted, border: '0.5px solid #e0d9d0' }}>👤 Serves 1</span>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {BOXES.map(box => {
                  const BoxIcon = box.icon;
                  const social = BOX_SOCIAL[box.id];
                  const isSelected = selectedBox === box.id;
                  return (
                    <div key={box.id} className="rounded-xl overflow-hidden" style={{ border: isSelected ? `2px solid ${box.border}` : '0.5px solid #e0d9d0', boxShadow: isSelected ? `0 4px 20px ${box.border}18` : '0 2px 6px rgba(0,0,0,0.04)' }}>
                      <button onClick={() => setSelectedBox(box.id)}
                        className="relative w-full flex items-center gap-4 p-5 text-left transition-all duration-200"
                        style={{ backgroundColor: 'white' }}>
                        {box.mostChosen && (
                          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: C.primary }}>Most chosen</span>
                        )}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: box.iconBg }}>
                          <BoxIcon size={18} style={{ color: box.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold mb-0.5" style={{ fontSize: 15, color: C.dark }}>{box.name}</p>
                          <p className="text-sm" style={{ color: C.muted }}>{box.desc}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <StarRating count={social.rating} reviewCount={social.reviewCount} />
                            <span className="text-[10px]" style={{ color: C.muted }}>
                              <span className="font-bold" style={{ color: C.primary }}>{social.count}</span> subscribed in the {social.window}
                            </span>
                          </div>
                        </div>
                        {isSelected && <div className="ml-2 shrink-0"><Check size={16} style={{ color: box.border }} /></div>}
                      </button>
                      {/* Review teaser */}
                      <div className="px-5 pb-4" style={{ backgroundColor: 'white', borderTop: '0.5px solid rgba(128,0,32,0.06)' }}>
                        <ReviewCarousel boxId={box.id} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5">
                <InfoBox bg={C.greenLight} border={C.green} color={C.greenText}>
                  Whichever box you choose, you will see the exact menu for each day before you pay — no surprises.
                </InfoBox>
              </div>

              <NavButtons step={step} onBack={goBack} onNext={goNext} nextDisabled={!canProceed()} />
            </div>
          )}

          {/* ── STEP 3 — MENU PREVIEW ─────────────────────── */}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>What's coming your way</h2>

              {/* Closed message */}
              {weekCfg.closedMessage && (
                <div className="mb-4">
                  <InfoBox bg="#FFF8E1" border="#F4C430" color="#854F0B">{weekCfg.closedMessage}</InfoBox>
                </div>
              )}

              {/* Week tabs */}
              {previewCount === 2 ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[0, 1].map(idx => {
                    const tc = weekCfg.weeks[idx];
                    const isActive = menuTab === idx;
                    return (
                      <button key={idx} onClick={() => setMenuTab(idx)}
                        className="p-4 rounded-xl text-left transition-all"
                        style={{ border: isActive ? `2px solid ${C.primary}` : '0.5px solid #e0d9d0', backgroundColor: 'white' }}>
                        <p className="font-semibold text-sm" style={{ color: isActive ? C.primary : C.dark }}>{tc.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.muted }}>{weekRange(tc.monday)}</p>
                        {tc.badge && <p className="text-[10px] mt-1 font-semibold" style={{ color: C.amberText }}>{tc.badge}</p>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setMonthlyPage(p => Math.max(0, p - 1))}
                      disabled={monthlyPage === 0}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
                      style={{ border: '0.5px solid #e0d9d0', backgroundColor: 'white' }}
                      aria-label="Previous weeks"
                    >
                      <ArrowLeft size={14} style={{ color: C.primary }} />
                    </button>
                    <div
                      className="flex-1 overflow-x-auto snap-x snap-mandatory scroll-smooth grid grid-flow-col gap-3"
                      style={{ gridAutoColumns: 'calc(50% - 6px)', scrollbarWidth: 'none' }}
                      ref={el => {
                        if (el) {
                          const target = monthlyPage * (el.clientWidth / 2 + 6) * 2;
                          if (Math.abs(el.scrollLeft - target) > 4) el.scrollTo({ left: target, behavior: 'smooth' });
                        }
                      }}
                    >
                      {weekCfg.weeks.map((tc, idx) => {
                        const isActive = menuTab === idx;
                        return (
                          <button key={idx} onClick={() => setMenuTab(idx)}
                            className="p-4 rounded-xl text-left transition-all snap-start"
                            style={{ border: isActive ? `2px solid ${C.primary}` : '0.5px solid #e0d9d0', backgroundColor: 'white' }}>
                            <p className="font-semibold text-sm" style={{ color: isActive ? C.primary : C.dark }}>Week {idx + 1}</p>
                            <p className="text-xs mt-0.5" style={{ color: C.muted }}>{weekRange(tc.monday)}</p>
                            {idx === 0 && <p className="text-[10px] mt-1 font-semibold" style={{ color: C.amberText }}>Starts here</p>}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setMonthlyPage(p => Math.min(1, p + 1))}
                      disabled={monthlyPage >= 1}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
                      style={{ border: '0.5px solid #e0d9d0', backgroundColor: 'white' }}
                      aria-label="Next weeks"
                    >
                      <ArrowRight size={14} style={{ color: C.primary }} />
                    </button>
                  </div>
                  <p className="text-[11px] text-center" style={{ color: C.muted }}>Swipe or tap arrows to view all 4 weeks</p>
                </div>
              )}

              {/* Day rows — vertical */}
              {menuLoading[menuTab] ? (
                <div className="space-y-3">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="rounded-xl animate-pulse flex gap-3 p-3" style={{ backgroundColor: '#e5e7eb', height: 72 }} />
                  ))}
                </div>
              ) : menuError[menuTab] === 'waking' ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: C.primary, borderTopColor: 'transparent' }} />
                  <p className="text-sm" style={{ color: C.muted }}>Waking up our kitchen server… this takes about 30 seconds on the first visit.</p>
                </div>
              ) : menuError[menuTab] ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600 mb-3">{menuError[menuTab]}</p>
                  <button onClick={() => fetchMenu(menuTab)} className="text-xs font-semibold px-4 py-2 rounded" style={{ backgroundColor: C.primary, color: 'white' }}>Retry</button>
                </div>
              ) : currentMenuData ? (() => {
                // Calculate total savings across days with menu data
                const daysWithMenu = Object.values(currentMenuData.days || {}).filter(d => !d.is_placeholder && d.items?.length);
                const totalRetail = daysWithMenu.reduce((sum, d) =>
                  sum + (d.items || []).reduce((s, it) => s + (typeof it === 'object' && it.price ? it.price : 0), 0), 0);
                const perMealPlan = planData?.perMeal || 0;
                const mealsWithPrices = daysWithMenu.filter(d => (d.items||[]).some(it => typeof it === 'object' && it.price));
                const avgRetailPerMeal = mealsWithPrices.length ? totalRetail / mealsWithPrices.length : 0;
                const weekSaving = mealsWithPrices.length ? (avgRetailPerMeal - perMealPlan) * mealsWithPrices.length : 0;
                const showSavings = weekSaving > 1;

                return (
                  <div className="space-y-3">
                    {Object.entries(currentMenuData.days || {}).map(([date, day], idx) => {
                      const isPast = new Date(date + 'T23:59:59') < new Date();
                      const items = day.items || [];
                      const allPlaceholder = day.is_placeholder || items.length === 0;
                      const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                      const dayRetail = items.reduce((s, it) => s + (typeof it === 'object' && it.price ? it.price : 0), 0);
                      const daySaving = dayRetail > 0 ? dayRetail - perMealPlan : 0;

                      return (
                        <div key={date} className="rounded-2xl overflow-hidden"
                          style={{ backgroundColor: 'white', border: '0.5px solid #e0d9d0', opacity: isPast ? 0.5 : 1 }}>

                          {/* Day header */}
                          <div className="flex items-center justify-between px-4 py-2.5"
                            style={{ backgroundColor: C.surface, borderBottom: '0.5px solid #f0ebe6' }}>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold" style={{ color: C.primary }}>{WEEKDAY_FULL[idx]}</p>
                              <p className="text-xs" style={{ color: C.muted }}>{dateLabel}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!allPlaceholder && !isPast && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.surface, color: C.muted, border: '0.5px solid #e0d9d0' }}>👤 Serves 1</span>
                              )}
                              {daySaving > 1 && !allPlaceholder && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                                  Save £{daySaving.toFixed(0)} today
                                </span>
                              )}
                              {isPast && <span className="text-[10px]" style={{ color: C.muted }}>Passed</span>}
                            </div>
                          </div>

                          {/* Dish cards */}
                          {allPlaceholder ? (
                            <div className="px-4 py-5 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                                style={{ backgroundColor: C.surface }}>🍱</div>
                              <p className="text-sm italic" style={{ color: C.muted }}>Menu is on the way — check back soon</p>
                            </div>
                          ) : (
                            <div className="flex items-start px-4 py-3 overflow-x-auto gap-0" style={{ scrollbarWidth: 'none' }}>
                              {items.map((item, i) => {
                                const name = typeof item === 'string' ? item : item.name;
                                const img  = typeof item === 'object' ? item.image : null;
                                return (
                                  <React.Fragment key={i}>
                                    {i > 0 && (
                                      <div className="flex items-center self-stretch px-1 shrink-0"
                                        style={{ color: '#d1c4b8', fontSize: 16, paddingTop: 28 }}>+</div>
                                    )}
                                    <div className="flex flex-col items-center shrink-0" style={{ width: 76 }}>
                                      <div className="overflow-hidden mb-1.5"
                                        style={{ width: 68, height: 68, borderRadius: 10, border: '1px solid #e0d9d0', flexShrink: 0 }}>
                                        {img ? (
                                          <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy"
                                            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                        ) : null}
                                        <div className="w-full h-full items-center justify-center text-xl"
                                          style={{ display: img ? 'none' : 'flex', backgroundColor: C.surface }}>🍛</div>
                                      </div>
                                      <p className="text-center leading-tight"
                                        style={{ fontSize: 10, color: C.dark, width: 68, wordBreak: 'break-word' }}>
                                        {name}
                                      </p>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Weekly savings summary */}
                    {showSavings && (
                      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                        style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <span style={{ fontSize: 15 }}>💰</span>
                        <div>
                          <span className="text-xs font-bold" style={{ color: '#166534' }}>
                            You save ~£{(avgRetailPerMeal - perMealPlan).toFixed(0)} per meal
                          </span>
                          <span className="text-xs" style={{ color: '#166534' }}> · </span>
                          <span className="text-xs font-bold" style={{ color: '#166534' }}>
                            ~£{weekSaving.toFixed(0)} this week
                          </span>
                          <span className="text-[10px] ml-1" style={{ color: '#4ADE80' }}>
                            vs ordering these dishes individually
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })() : null}

              {/* "Menu keeps changing" note — after the days, not at top */}
              <div className="mt-5">
                <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: C.amberLight, border: `0.5px solid ${C.darkGold}` }}>
                  <RotateCcw size={14} style={{ color: C.amberText, flexShrink: 0 }} />
                  <p className="text-xs font-semibold" style={{ color: C.amberText }}>Our menu keeps changing every week — there's always something new to look forward to.</p>
                </div>
              </div>

              {currentMenuData?.dietary_notes && (
                <div className="mt-3">
                  <InfoBox bg={C.surface} border="#e0d9d0" color={C.muted}>
                    🌿 Kitchen note: {currentMenuData.dietary_notes}
                  </InfoBox>
                </div>
              )}

              <NavButtons step={step} onBack={goBack} onNext={goNext} nextDisabled={!canProceed()} />
            </div>
          )}

          {/* ── STEP 4 — PREFERENCES ──────────────────────── */}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>Any dietary preferences?</h2>
              <p className="text-sm mb-5" style={{ color: C.muted }}>Optional — but we want every meal to feel right for you.</p>

              <InfoBox bg={C.amberLight} border={C.darkGold} color={C.amberText}>
                Whatever you select here, our kitchen honours it for every single meal of your subscription. You never need to remind us.
              </InfoBox>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {PREFS.map(p => {
                  const sel = selectedPrefs.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => setSelectedPrefs(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                      className="flex items-center gap-3 p-3.5 rounded-xl text-left text-sm font-medium transition-all"
                      style={{ backgroundColor: sel ? '#fff8f8' : 'white', border: sel ? `2px solid ${C.primary}` : '0.5px solid #e0d9d0', color: sel ? C.primary : C.dark }}>
                      <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: sel ? C.primary : 'transparent', border: sel ? 'none' : '1.5px solid #d1d5db' }}>
                        {sel && <Check size={10} color="white" />}
                      </div>
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <label className="text-sm font-semibold block mb-1" style={{ color: C.dark }}>Have something specific not listed?</label>
                <textarea
                  value={customRequest} onChange={e => setCustomRequest(e.target.value)}
                  placeholder="Tell us anything else — we will do our very best."
                  rows={3} style={{ resize: 'none' }}
                  className="w-full p-3 rounded-xl border text-sm focus:outline-none focus:border-[#800020] transition-colors"
                  style={{ border: '0.5px solid #e0d9d0', resize: 'none', fontSize: 13 }}
                />
                <p className="text-[11px] mt-1" style={{ color: C.muted }}>This is a request, not a guarantee. Our kitchen will confirm if it can be accommodated.</p>
              </div>

              <NavButtons step={step} onBack={goBack} onNext={goNext} nextDisabled={false} nextLabel="Next" />
            </div>
          )}

          {/* ── STEP 5 — DETAILS ──────────────────────────── */}
          {step === 5 && (
            <div>
              <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: C.primary }}>Where shall we deliver?</h2>
              <p className="text-sm mb-6" style={{ color: C.muted }}>Almost there — just your details and we are ready to start cooking.</p>

              {/* SCENARIO A — Logged in */}
              {user && !isGuest && (
                <div>
                  <InfoBox bg={C.greenLight} border={C.green} color={C.greenText}>
                    We have your details from your account. Just confirm your delivery address below.
                  </InfoBox>
                  <div className="mt-4 flex items-center gap-2 mb-4">
                    <p className="text-sm" style={{ color: C.dark }}>Delivering to: <strong>{user.name}</strong> · {user.email}</p>
                    <button onClick={() => { /* logout handled by auth */ }} className="text-xs ml-2 underline" style={{ color: C.muted }}>Not you? Sign out</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { label: 'Address Line 1 *', key: 'line1', placeholder: '12 Curry Lane' },
                      { label: 'Address Line 2',   key: 'line2', placeholder: 'Flat / Apartment (optional)' },
                      { label: 'City *',            key: 'city',  placeholder: 'Milton Keynes' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs font-semibold block mb-1" style={{ color: C.dark }}>{label}</label>
                        <input type="text" placeholder={placeholder} value={customer[key]}
                          onChange={e => setCustomer(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full p-3 rounded-xl text-sm focus:outline-none transition-colors"
                          style={{ border: '0.5px solid #e0d9d0' }} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: C.dark }}>Postcode *</label>
                      <input type="text" placeholder="MK9 1AB" value={customer.postcode}
                        onChange={e => handlePostcodeChange(e.target.value)}
                        className="w-full p-3 rounded-xl text-sm focus:outline-none transition-colors"
                        style={{ border: `0.5px solid ${postcodeStatus?.ok === false ? '#DC2626' : postcodeStatus?.ok ? C.green : '#e0d9d0'}` }} />
                    </div>
                  </div>
                  {/* Postcode feedback */}
                  {postcodeStatus === 'checking' && <p className="text-xs mt-1" style={{ color: C.muted }}>Checking postcode…</p>}
                  {postcodeStatus?.ok === true  && <p className="text-xs mt-1 font-medium" style={{ color: C.green }}>{postcodeStatus.msg}</p>}
                  {postcodeStatus?.ok === false && <p className="text-xs mt-1 font-medium text-red-600">{postcodeStatus.msg}</p>}
                </div>
              )}

              {/* SCENARIO B — Not logged in, show account prompt */}
              {!user && !isGuest && (
                <div className="flex flex-col gap-4">
                  {[
                    { title: 'Sign in to your account', desc: 'Your name, email, and saved address will be filled in automatically.', btnLabel: 'Sign in', action: () => setAuthOpen(true) },
                    { title: 'Create an account',       desc: 'Takes 30 seconds. Your order history and preferences are saved for next time.', btnLabel: 'Create account', action: () => setAuthOpen(true) },
                    { title: 'Continue as guest',       desc: 'No account needed. We will create one for you after your subscription is confirmed.', btnLabel: 'Continue as guest', action: () => setIsGuest(true) },
                  ].map(opt => (
                    <div key={opt.title} className="flex items-center justify-between gap-4 p-5 rounded-xl" style={{ backgroundColor: 'white', border: '0.5px solid #e0d9d0' }}>
                      <div>
                        <p className="font-semibold text-sm mb-0.5" style={{ color: C.dark }}>{opt.title}</p>
                        <p className="text-xs" style={{ color: C.muted }}>{opt.desc}</p>
                      </div>
                      <button onClick={opt.action} className="shrink-0 px-4 py-2 text-xs font-semibold text-white rounded-lg" style={{ backgroundColor: C.primary }}>{opt.btnLabel}</button>
                    </div>
                  ))}
                </div>
              )}

              {/* SCENARIO C — Guest full form */}
              {(isGuest || !user) && isGuest && (
                <div className="mt-4">
                  <InfoBox bg={C.amberLight} border={C.darkGold} color={C.amberText}>
                    We will create an account for you using this email. You will receive a link to set your password after your subscription is confirmed.
                  </InfoBox>
                  <div className="grid md:grid-cols-2 gap-4 mt-5">
                    {[
                      { label: 'Full name *',        key: 'name',    type: 'text',  placeholder: 'Your full name' },
                      { label: 'Email address *',    key: 'email',   type: 'email', placeholder: 'you@example.com' },
                      { label: 'Phone number *',     key: 'phone',   type: 'tel',   placeholder: '+44 7xxx xxxxxx' },
                      { label: 'Address Line 1 *',   key: 'line1',   type: 'text',  placeholder: '12 Curry Lane' },
                      { label: 'Address Line 2',     key: 'line2',   type: 'text',  placeholder: 'Flat / Apartment (optional)' },
                      { label: 'City *',             key: 'city',    type: 'text',  placeholder: 'Milton Keynes' },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs font-semibold block mb-1" style={{ color: C.dark }}>{label}</label>
                        <input type={type} placeholder={placeholder} value={customer[key]}
                          onChange={e => setCustomer(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full p-3 rounded-xl text-sm focus:outline-none transition-colors"
                          style={{ border: '0.5px solid #e0d9d0' }} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: C.dark }}>Postcode *</label>
                      <input type="text" placeholder="MK9 1AB" value={customer.postcode}
                        onChange={e => handlePostcodeChange(e.target.value)}
                        className="w-full p-3 rounded-xl text-sm focus:outline-none transition-colors"
                        style={{ border: `0.5px solid ${postcodeStatus?.ok === false ? '#DC2626' : postcodeStatus?.ok ? C.green : '#e0d9d0'}` }} />
                      {postcodeStatus === 'checking' && <p className="text-xs mt-1" style={{ color: C.muted }}>Checking postcode…</p>}
                      {postcodeStatus?.ok === true  && <p className="text-xs mt-1 font-medium" style={{ color: C.green }}>{postcodeStatus.msg}</p>}
                      {postcodeStatus?.ok === false && <p className="text-xs mt-1 font-medium text-red-600">{postcodeStatus.msg}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery instruction — shown after postcode verified */}
              {postcodeStatus?.ok && (
                <div className="mt-8">
                  <p className="text-sm font-semibold mb-3" style={{ color: C.dark }}>If you are not home when we arrive</p>
                  <div className="flex flex-col gap-2">
                    {DELIVERY_INSTRUCTIONS.map(di => (
                      <div key={di.id}>
                        <button onClick={() => setDeliveryInstruction(di.id)}
                          className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                          style={{ backgroundColor: 'white', border: deliveryInstruction === di.id ? `2px solid ${C.primary}` : '0.5px solid #e0d9d0' }}>
                          <div className="w-4 h-4 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: deliveryInstruction === di.id ? C.primary : 'transparent', border: deliveryInstruction === di.id ? 'none' : `1.5px solid #d1d5db` }}>
                            {deliveryInstruction === di.id && <Check size={10} color="white" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: C.dark }}>{di.label}</p>
                            <p className="text-xs" style={{ color: C.muted }}>{di.sub}</p>
                          </div>
                        </button>
                        {deliveryInstruction === di.id && di.hasFields && (
                          <div className="ml-7 mt-2 flex flex-col gap-2">
                            {di.id === 'neighbour' && (
                              <>
                                <input type="text" placeholder="Neighbour name" value={neighbourName} onChange={e => setNeighbourName(e.target.value)}
                                  className="p-3 rounded-xl text-sm" style={{ border: '0.5px solid #e0d9d0' }} />
                                <input type="text" placeholder="Neighbour door / flat number" value={neighbourDoor} onChange={e => setNeighbourDoor(e.target.value)}
                                  className="p-3 rounded-xl text-sm" style={{ border: '0.5px solid #e0d9d0' }} />
                              </>
                            )}
                            {di.id === 'safeplace' && (
                              <textarea rows={2} placeholder="e.g. inside the porch, behind the plant pot at the back gate" value={safePlaceDesc} onChange={e => setSafePlaceDesc(e.target.value)}
                                className="p-3 rounded-xl text-sm" style={{ border: '0.5px solid #e0d9d0', resize: 'none' }} />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Food safety note */}
              <div className="mt-6">
                <InfoBox bg={C.surface} border="#e0d9d0" color={C.muted}>
                  Our meals are best enjoyed fresh. Please refrigerate within two hours if you are not eating immediately — they stay delicious until the evening.
                </InfoBox>
              </div>

              <NavButtons step={step} onBack={goBack} onNext={goNext} nextDisabled={!canProceed()} />
            </div>
          )}

          {/* ── STEP 6 — CONFIRM ──────────────────────────── */}
          {step === 6 && (() => {
            const BoxIcon = boxData?.id === 'prasada' ? Leaf : Flame;
            const boxColor = boxData?.id === 'prasada' ? C.green : C.primary;
            const boxBg = boxData?.id === 'prasada' ? C.greenLight : '#FAECE7';
            const friDate = (() => { const d = new Date(selectedStartWeek + 'T12:00:00'); d.setDate(d.getDate() + 4); return isoDate(d); })();
            const days = currentMenuData ? Object.entries(currentMenuData.days || {}) : [];
            return (
              <div>
                {/* ── Hero banner ── */}
                <div className="rounded-2xl overflow-hidden mb-6" style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #3D0010 100%)` }}>
                  <div className="px-6 py-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: boxBg, color: boxColor }}>
                          <BoxIcon size={10} className="inline mr-1" />{boxData?.name}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}>{planData?.name}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Your Daily Dose of Home</h2>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {planData?.meals} meals · Mon {fmtShort(selectedStartWeek)} – Fri {fmtShort(friDate)} · Lunch delivery 12–2pm
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-3xl font-bold text-white">£{planData?.price}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>£{planData?.perMeal}/meal</p>
                    </div>
                  </div>
                </div>

                {/* ── Weekly menu cards ── */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.darkGold }}>
                    {planData?.id === 'monthly' ? 'Your first week of meals' : 'Your meals this week'}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {WEEKDAY_LABELS.map((day, idx) => {
                      const [date, dayData] = days[idx] || [null, null];
                      const meals = dayData && !dayData.is_placeholder && dayData.items?.length
                        ? dayData.items.map(it => typeof it === 'string' ? it : it.name)
                        : null;
                      const dateLabel = date ? new Date(date + 'T12:00:00').getDate() : '';
                      return (
                        <div key={day} className="rounded-xl overflow-hidden flex flex-col" style={{ border: `1px solid ${meals ? 'rgba(128,0,32,0.12)' : '#eee'}`, backgroundColor: meals ? 'white' : C.surface }}>
                          {/* Day header */}
                          <div className="py-2 text-center" style={{ backgroundColor: meals ? C.primary : '#e0d9d0' }}>
                            <p className="text-[10px] font-bold tracking-widest" style={{ color: meals ? 'rgba(255,255,255,0.8)' : C.muted }}>{day}</p>
                            {dateLabel && <p className="text-sm font-bold" style={{ color: meals ? 'white' : C.muted }}>{dateLabel}</p>}
                          </div>
                          {/* Meal list */}
                          <div className="p-2 flex-1 flex flex-col justify-center min-h-[80px]">
                            {meals ? meals.map((m, i) => (
                              <p key={i} className="text-[11px] leading-snug mb-1 last:mb-0" style={{ color: C.dark }}>{m}</p>
                            )) : (
                              <p className="text-[10px] text-center" style={{ color: C.muted }}>Menu soon 🍱</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {planData?.id === 'monthly' && (
                    <p className="text-xs mt-2" style={{ color: C.muted }}>Weeks 2–4 menus revealed every Friday by email.</p>
                  )}
                </div>

                {/* ── Main checkout grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                  {/* LEFT: delivery + terms */}
                  <div className="lg:col-span-3 space-y-4">

                    {/* Delivery summary */}
                    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(128,0,32,0.1)' }}>
                      <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: '#f0ebe6', backgroundColor: C.surface }}>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.primary }}>Delivery details</span>
                      </div>
                      {[
                        { label: 'Name', value: customer.name },
                        { label: 'Delivering to', value: `${customer.line1}${customer.line2 ? ', ' + customer.line2 : ''}, ${customer.city} ${customer.postcode}` },
                        { label: 'If not home', value: DELIVERY_INSTRUCTIONS.find(d => d.id === deliveryInstruction)?.label || '—' },
                        { label: 'Preferences', value: selectedPrefs.length ? selectedPrefs.join(', ') : 'Standard (no modifications)' },
                        ...(customRequest ? [{ label: 'Special request', value: customRequest }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between px-5 py-3" style={{ borderBottom: '0.5px solid #f0ebe6' }}>
                          <p className="text-xs font-semibold w-28 shrink-0" style={{ color: C.muted }}>{label}</p>
                          <p className="text-sm text-right" style={{ color: C.dark }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Terms */}
                    <div className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: '1px solid rgba(128,0,32,0.1)' }}>
                      <p className="text-xs leading-relaxed mb-3" style={{ color: C.dark, lineHeight: 1.8 }}>
                        This subscription is paid in full today. You have <strong>48 hours</strong> from the moment you subscribe to cancel for a full refund — as long as your first meal has not entered preparation. After that, all sales are final.
                      </p>
                      <Link to="/terms" className="text-xs font-semibold" style={{ color: C.primary }}>View full terms →</Link>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={termsChecked} onChange={e => setTermsChecked(e.target.checked)} className="mt-0.5 accent-[#800020]" />
                      <span className="text-sm" style={{ color: C.dark }}>I have read and understood the subscription terms.</span>
                    </label>
                  </div>

                  {/* RIGHT: price + card + pay */}
                  <div className="lg:col-span-2">
                    <div className="lg:sticky lg:top-6 space-y-3">

                      {/* Price breakdown */}
                      <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(128,0,32,0.1)' }}>
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                          <span>{planData?.meals} meals × £{planData?.perMeal}</span>
                          <span style={{ color: C.dark }}>£{planData?.price}.00</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mb-3">
                          <span>Delivery (Mon–Fri)</span>
                          <span style={{ color: C.green }} className="font-semibold">Free</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between items-center" style={{ borderColor: '#f0ebe6' }}>
                          <span className="font-bold text-base" style={{ color: C.dark }}>Total today</span>
                          <span className="text-2xl font-bold" style={{ color: C.primary }}>£{planData?.price}.00</span>
                        </div>
                      </div>

                      {/* Card input */}
                      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: '1px solid rgba(128,0,32,0.1)' }}>
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} style={{ color: C.primary }} />
                          <span className="font-bold text-sm" style={{ color: C.primary }}>Payment</span>
                          <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400"><Lock size={10} /> Secured by Stripe</span>
                        </div>
                        <div className="space-y-2">
                          {/* Card number - full width */}
                          <div className="p-3 rounded-xl border-2" style={{ borderColor: 'rgba(128,0,32,0.2)', backgroundColor: C.cream }}>
                            <CardNumberElement options={CARD_STYLE} placeholder="Card number" />
                          </div>
                          {/* Expiry + CVC row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 rounded-xl border-2" style={{ borderColor: 'rgba(128,0,32,0.2)', backgroundColor: C.cream }}>
                              <CardExpiryElement options={CARD_STYLE} placeholder="MM / YY" />
                            </div>
                            <div className="p-3 rounded-xl border-2" style={{ borderColor: 'rgba(128,0,32,0.2)', backgroundColor: C.cream }}>
                              <CardCvcElement options={CARD_STYLE} placeholder="CVC" />
                            </div>
                          </div>
                          {/* Postcode - full width */}
                          <div className="p-3 rounded-xl border-2" style={{ borderColor: 'rgba(128,0,32,0.2)', backgroundColor: C.cream }}>
                            <input
                              type="text"
                              value={customer.postcode}
                              onChange={e => setCustomer(prev => ({ ...prev, postcode: e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase() }))}
                              placeholder="Postcode"
                              className="w-full text-sm focus:outline-none bg-transparent"
                              style={{ color: '#2D2422' }}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400">Card details encrypted — never stored on our servers.</p>
                      </div>

                      {/* Pay button */}
                      <button onClick={handleConfirm} disabled={!termsChecked || submitStatus === 'loading'}
                        className="w-full py-4 text-sm font-bold text-white rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-xl"
                        style={{ background: `linear-gradient(135deg, ${C.primary}, #5C0018)` }}>
                        {submitStatus === 'loading'
                          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
                          : <>Pay £{planData?.price}.00 — {planData?.name}</>
                        }
                      </button>

                      <div className="flex items-center justify-center gap-4">
                        {[['🔒', 'Secure'], ['🍛', 'Fresh daily'], ['📦', 'Free delivery']].map(([icon, label]) => (
                          <div key={label} className="flex items-center gap-1">
                            <span className="text-sm">{icon}</span>
                            <span className="text-[11px] text-gray-400">{label}</span>
                          </div>
                        ))}
                      </div>

                      {submitStatus === 'error' && (
                        <p className="text-sm font-medium p-3 rounded-xl text-center" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>{errorMessage || 'Something went wrong. Please try again.'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <NavButtons step={step} onBack={goBack} onNext={() => {}} nextDisabled={true} nextLabel="" />
                </div>
              </div>
            );
          })()}

        </div>
      </section>
    </div>
  );
};

const Subscriptions = () => (
  <Elements stripe={stripePromise}>
    <SubscriptionsInner />
  </Elements>
);

export default Subscriptions;
