'use client';
import { byMenuOrder } from '@/lib/menuOrder';
import { useState, useEffect, useRef, useCallback, useMemo, memo, startTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useDialog from '@/lib/useDialog';
import { Flame, Search, Sun, Moon, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { isOrderable } from '@/config/softLaunch';
import { useKitchen } from '@/context/KitchenContext';
import { buildItemUrl } from '@/lib/itemUrl';
import api from '@/api';
import { getCached, setCached } from '@/api/menuCache';
import SlotPicker from '@/components/SlotPicker';
import IntroPricesBanner from '@/components/IntroPricesBanner';
import RestockBell from '@/components/RestockBell';
import PushOptIn from '@/components/PushOptIn';
import { soldOutLabel, orderableTomorrow } from '@/lib/soldOut';
import { inOffer, offerFor } from '@/lib/offer';
import { trackViewItem } from '@/lib/analytics';
import { recordSearch } from '@/lib/track';

/** The Order Now page with two days to order for (owner, 25 Nov 2026): Today's Menu (cooking now, ready in about
    30 minutes) and Pre-order (the dishes that are not cooking today, collected tomorrow). A dish is on one list
    or the other, never both. Saffron is today, burgundy is tomorrow, gold is a special or an offer. A dish that
    has sold out today can still be had tomorrow instead of becoming a dead end.
    Each basket line carries its day (CartContext `preorder`); the server has the last word (orders.py line_day). */

const SECTIONS = [
  { id: 'breakfast',    name: 'Breakfast' },
  { id: 'nonVeg',       name: 'Non-Veg' },
  { id: 'veg',          name: 'Vegetarian' },
  { id: 'streetFood',   name: 'Street Food' },
  { id: 'ragiSpecials', name: 'Ragi Specials' },
  { id: 'drinks',       name: 'Drinks' },
];

const C = {
  burgundy: '#800020', ivory: '#FDFBF7', saffron: '#F4C430', gold: '#B8860B',
  ink: '#2D2422', muted: '#5C4B47', line: '#E8DFCE', veg: '#4A7C59', nonveg: '#8B3A3A',
  tint: '#F3EDE2', wash: '#F8EEE9', offer: '#FBF3DC', offerLine: '#EBD9A8',
};

// The colour of the day a dish is being ordered for
const TONE = {
  today:    { backgroundColor: C.saffron,  color: C.ink },
  tomorrow: { backgroundColor: C.burgundy, color: '#fff' },
};
const DAYS = [
  { id: 'today',    Icon: Sun,  title: "Today's Menu", short: 'Today',    sub: 'Ready in about 30 min' },
  { id: 'tomorrow', Icon: Moon, title: 'Pre-order',    short: 'Tomorrow', sub: 'Collect tomorrow' },
];
const SOLD = { filter: 'grayscale(1)', opacity: 0.55 };
const MINIMUM_ORDER = 15;

function VegDot({ isVeg }) {
  const col = isVeg ? C.veg : C.nonveg;
  return (
    <span className="inline-flex items-center justify-center shrink-0"
      style={{ width: 12, height: 12, border: `1.5px solid ${col}`, borderRadius: 2 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: col }} />
    </span>
  );
}

function Stepper({ qty, when, onChange }) {
  return (
    <div className="flex items-center rounded-full shrink-0" style={TONE[when]}>
      <button aria-label="Decrease quantity" onClick={() => onChange(qty - 1)} data-repeat-ok
        className="w-8 h-9 font-black text-base">−</button>
      <span className="min-w-[16px] text-center text-sm font-black tabular-nums">{qty}</span>
      <button aria-label="Increase quantity" onClick={() => onChange(qty + 1)} data-repeat-ok
        className="w-8 h-9 font-black text-base">+</button>
    </div>
  );
}

/** The one switch the page turns on. Shrinks to a single line once the list is being browsed. */
function DaySwitch({ tab, onChange, compact }) {
  return (
    <div role="tablist" aria-label="When to collect" className="grid grid-cols-2 gap-1 rounded-2xl p-1" style={{ backgroundColor: C.tint }}>
      {DAYS.map(({ id, Icon, title, sub }) => {
        const on = tab === id;
        return (
          <button key={id} role="tab" aria-selected={on} onClick={() => onChange(id)} data-testid={`day-${id}`}
            className={`flex items-center gap-2.5 rounded-xl px-3 text-left transition-colors ${compact ? 'py-2' : 'py-2.5'}`}
            style={on ? TONE[id] : { color: C.muted }}>
            <Icon size={compact ? 16 : 20} className="shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-black leading-tight">{title}</span>
              {!compact && <span className="block text-[11px] leading-tight opacity-80">{sub}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Add for the day shown; a dish that has sold out today is offered for tomorrow in outline. */
function AddButton({ when, soldToday, onClick }) {
  return (
    <button onClick={onClick}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black tracking-wide"
      style={soldToday
        ? { border: `1.5px solid ${C.burgundy}`, color: C.burgundy }
        : { ...TONE[when], boxShadow: '0 1px 3px rgba(45,36,34,0.18)' }}>
      {soldToday ? <><Moon size={12} /> Tomorrow</> : when === 'today' ? '+ ADD' : 'Pre-order'}
    </button>
  );
}

/** One dish. `when` is the day it would be ordered for ('today' | 'tomorrow'), or null when it cannot be ordered
    (then the bell). `sold`: it has sold out today, shown greyed. `offer`: the offer's words, on a dish that is in it. */
const DishRow = memo(function DishRow({ d, when, sold, offer, qty, onAdd, onOpen, onQty }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
      {d.image ? (
        <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 56, height: 56, ...(sold ? SOLD : null) }}>
          <Image src={d.image} alt={d.name} fill sizes="56px" className="object-cover" />
        </div>
      ) : (
        <div className="shrink-0 rounded-xl flex items-center justify-center font-bold text-white"
          style={{ width: 56, height: 56, backgroundColor: d.is_veg ? C.veg : C.nonveg, fontFamily: "'Playfair Display', serif", ...(sold ? SOLD : null) }}>
          {d.name.slice(0, 1)}
        </div>
      )}
      <button onClick={() => onOpen(d)} className="flex-1 min-w-0 text-left">
        <span className="flex items-center gap-1.5 font-bold text-sm" style={{ color: C.ink }}>
          <VegDot isVeg={d.is_veg} />
          <span className="truncate">{d.name}</span>
          {d.spice_level > 1 && <Flame size={11} style={{ color: C.nonveg }} className="shrink-0" />}
        </span>
        <span className="block text-[11px] truncate" style={{ color: C.muted }}>{d.description}</span>
        <span className="block text-[13px] font-black mt-0.5" style={{ color: C.ink }}>
          £{Number(d.price).toFixed(2)}
          {sold && when && <span className="text-[11px] font-bold" style={{ color: C.nonveg }}> · {soldOutLabel(d)}</span>}
          {offer && (
            <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-black align-middle" style={{ backgroundColor: C.offer, color: C.gold, border: `1px solid ${C.offerLine}` }}>
              {offer}
            </span>
          )}
        </span>
      </button>
      {qty > 0 && when ? (
        <Stepper qty={qty} when={when} onChange={(n) => onQty(d.id, n)} />
      ) : !when ? (
        <RestockBell item={d} compact />
      ) : (
        <AddButton when={when} soldToday={sold} onClick={() => onAdd(d, when)} />
      )}
    </div>
  );
});

/** A special in the photo strip at the top of Today's Menu. It is also listed under its own section below. */
const SpecialCard = memo(function SpecialCard({ d, qty, onAdd, onOpen, onQty }) {
  const out = d.sold_out_today;
  return (
    <div className="flex-none w-[158px]" data-testid="special-card">
      <button onClick={() => onOpen(d)} className="block w-full text-left">
        <span className="relative block rounded-2xl overflow-hidden" style={{ aspectRatio: '4 / 3', backgroundColor: d.is_veg ? C.veg : C.nonveg }}>
          {d.image && <Image src={d.image} alt={d.name} fill sizes="158px" className="object-cover" style={out ? SOLD : undefined} />}
          <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
            style={out ? { backgroundColor: C.ink, color: C.ivory } : { backgroundColor: C.gold, color: '#fff' }}>
            {out ? 'Sold out' : 'Special'}
          </span>
        </span>
        {/* Two lines kept for every name, so prices and buttons line up along the strip */}
        <span className="flex items-start gap-1.5 mt-2 text-sm font-bold leading-tight min-h-[35px]" style={{ color: C.ink }}>
          <span className="mt-0.5"><VegDot isVeg={d.is_veg} /></span><span className="line-clamp-2">{d.name}</span>
        </span>
      </button>
      <div className="flex items-center justify-between gap-2 mt-1.5" style={{ minHeight: 36 }}>
        <span className="text-[13px] font-black" style={{ color: C.ink }}>£{Number(d.price).toFixed(2)}</span>
        {out ? <RestockBell item={d} compact />
          : qty > 0 ? <Stepper qty={qty} when="today" onChange={(n) => onQty(d.id, n)} />
          : <AddButton when="today" onClick={() => onAdd(d, 'today')} />}
      </div>
    </div>
  );
});

// Rows drawn straight away; the rest follow in a low-priority render so the
// first screens respond to taps while the long list fills in below
const INITIAL_ROWS = 24;

// Today's Menu is every dish that is not pre-order only and not "coming soon"
const onToday = (d) => !d.preorder_only && !d.coming_soon;
// "Coming soon" dishes cannot be ordered yet, so they get one group of their own below every dish that can
const LISTED = [...SECTIONS, { id: 'comingSoon', name: 'Coming soon' }];
const inSection = (d, sec) => (sec.id === 'comingSoon' ? !!d.coming_soon : d.category === sec.id && !d.coming_soon);

export default function OrderClient({ initialItems = [], initialSpecialIds = [] }) {
  const router = useRouter();
  // NOTE: deliberately NOT useSearchParams() — it opts this whole component out
  // of prerendering, shipping an empty shell instead of the baked menu list.
  // The ?cat=, ?tab= and ?offer= deep links are read from window.location on mount instead.
  const {
    cartItems, cartCount, cartTotal, addToCart, updateQuantity,
    deliveryType, setDeliveryType, pickupSlot, setPickupSlot, preorderSlot, setPreorderSlot,
  } = useCart();
  const { deliveryEnabled, open: kitchenOpen, minimumOrderEnabled, offer: kitchenOffer } = useKitchen();
  // The biryani multi-buy, only while the server says it is running
  const offer = kitchenOffer?.live ? kitchenOffer : null;
  const belowMinimum = minimumOrderEnabled && cartTotal < MINIMUM_ORDER;   // the admin can pause the £15 minimum
  const [dishes, setDishes] = useState(initialItems);
  const [specialIds, setSpecialIds] = useState(initialSpecialIds);
  const [loading, setLoading] = useState(initialItems.length === 0);
  // Which day is being ordered for. `picked` stops the page moving someone who has already chosen.
  const [tab, setTab] = useState('today');
  const picked = useRef(false);
  const [tomorrowLabel, setTomorrowLabel] = useState('');   // set after mount: the baked page may be a day old
  useEffect(() => {
    setTomorrowLabel(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'short' })
      .format(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  }, []);
  const [search, setSearch] = useState('');
  // While searching, collapse the sticky controls so results stay visible above the keyboard.
  // Expands back on Cancel, on blur with no text, or on any scroll once the keyboard is closed.
  const [searchMode, setSearchMode] = useState(false);
  const searchInputRef = useRef(null);
  const [sheetItem, setSheetItem] = useState(null); // dish shown in the bottom sheet
  // Once the list is being browsed, the toggle + slot picker collapse to a slim
  // summary row so more dishes fit on screen; tapping it scrolls back up to expand
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [navigating, setNavigating] = useState(false); // instant feedback on Go to Checkout
  // Pure-veg filter (is_veg flag — eggs count as non-veg), remembered for the session
  const [vegOnly, setVegOnlyRaw] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem('ssp_veg_only') === '1') setVegOnlyRaw(true); } catch {}
  }, []);
  const setVegOnly = (v) => {
    setVegOnlyRaw(v);
    try { sessionStorage.setItem('ssp_veg_only', v ? '1' : '0'); } catch {}
  };

  // The offer chip: show only the dishes the offer covers. It means nothing while the offer is not running.
  const [offerOnly, setOfferOnly] = useState(false);
  const offerView = offerOnly && !!offer;

  // Warm up the (heavy, Stripe-laden) checkout route as soon as a cart exists
  useEffect(() => {
    if (cartCount > 0) router.prefetch('/checkout');
  }, [cartCount, router]);

  // Coming back from checkout must not leave the bar stuck on "Opening…"
  useEffect(() => {
    const reset = () => setNavigating(false);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  const [activeSection, setActiveSection] = useState('breakfast');
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { startTransition(() => setShowAll(true)); }, []);
  const sectionRefs = useRef({});
  const stickyRef = useRef(null);
  const heroRef = useRef(null);
  const [stickyH, setStickyH] = useState(300);
  const spyPaused = useRef(0);

  // Measure the sticky block so section jumps and scroll-spy line up exactly
  useEffect(() => {
    const measure = () => stickyRef.current && setStickyH(stickyRef.current.offsetHeight);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });

  // Where the page sits when the sticky block has just reached the header. Anchored on the static hero —
  // a stuck position:sticky element reports a scroll-dependent offsetTop, which is useless here.
  const listTop = () => {
    const hero = heroRef.current;
    if (!hero) return 0;
    return Math.max(0, hero.getBoundingClientRect().bottom + window.scrollY - (window.innerWidth >= 768 ? 112 : 96));
  };
  const toListTop = () => {
    const top = listTop();
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'instant' });
  };

  const changeTab = (next) => {
    picked.current = true;
    setTab(next);
    setOfferOnly(false);     // a day's own list, not the offer's
    toListTop();             // deep in one day's list: start the other day's list from its top
  };

  const showOffer = useCallback((on) => {
    setOfferOnly(on);
    toListTop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The offer line in the bar at the top of every page opens the offer here without leaving the page
  useEffect(() => {
    const open = () => showOffer(true);
    window.addEventListener('ssp:show-offer', open);
    return () => window.removeEventListener('ssp:show-offer', open);
  }, [showOffer]);

  // Deep links: /order?tab=preorder opens on Pre-order; ?offer=1 shows the offer's dishes;
  // ?cat=veg jumps to that category once the menu loads
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || loading || !dishes.length) return;
    deepLinked.current = true;
    let params = null;
    try { params = new URLSearchParams(window.location.search); } catch { return; }
    if (params.get('tab') === 'preorder') { picked.current = true; setTab('tomorrow'); }
    if (params.get('offer')) setOfferOnly(true);
    const cat = params.get('cat');
    if (cat && SECTIONS.some(s => s.id === cat)) setTimeout(() => scrollTo(cat), 250);
  }, [loading, dishes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock page scroll while the item sheet is open; opening the sheet is looking at the dish
  useEffect(() => {
    document.body.style.overflow = sheetItem ? 'hidden' : '';
    if (sheetItem) trackViewItem(sheetItem);
    return () => { document.body.style.overflow = ''; };
  }, [sheetItem]);

  // Entering search mode (or typing) parks the collapsed bar under the header
  // AFTER the layout shrinks, so results start right below it
  useEffect(() => {
    if (!searchMode) return;
    // Delay past the browser's own "scroll focused input into view" adjustment,
    // which would otherwise override this
    const t = setTimeout(() => window.scrollTo({ top: listTop(), behavior: 'instant' }), 150);
    return () => clearTimeout(t);
  }, [searchMode, search]);

  // Scroll-spy — highlight the category currently at the top of the viewport
  useEffect(() => {
    const onScroll = () => {
      // Keyboard closed + user scrolling → bring the full controls back
      if (searchMode && document.activeElement !== searchInputRef.current) {
        setSearchMode(false);
      }
      const heroBottom = heroRef.current
        ? heroRef.current.getBoundingClientRect().bottom + window.scrollY
        : 200;
      // Hysteresis: collapse past the hero, but only expand again near the top —
      // symmetric thresholds oscillate because collapsing changes the layout height
      setControlsCollapsed(prev => prev
        ? window.scrollY > Math.max(heroBottom - 160, 40)
        : window.scrollY > heroBottom + 60);
      if (Date.now() < spyPaused.current) return;
      const probe = stickyH + 140; // px below the top of the viewport
      let current = null;
      for (const [id, el] of Object.entries(sectionRefs.current)) {
        if (el && el.getBoundingClientRect().top <= probe) current = id;
      }
      if (current) setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [stickyH, searchMode]);

  // The kitchen's server sleeps when quiet and takes up to a minute to wake: say so, and tell a failure apart from an
  // empty search (audit A-0003, UX-002)
  const [slowLoad, setSlowLoad] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const closeSheet = useCallback(() => setSheetItem(null), []);
  const sheetRef = useDialog(!!sheetItem, closeSheet);   // focus, Escape and Tab behave like a real dialog (A-0003, A11Y-001)
  useEffect(() => {
    const cached = getCached('all');
    if (cached) { setDishes(cached); setLoading(false); }
    setLoadFailed(false);
    const slow = setTimeout(() => setSlowLoad(true), 4000);
    api.get('/menu?available=true')
      .then(res => { startTransition(() => setDishes(res.data)); setCached('all', res.data); })
      .catch(() => { if (!getCached('all')) setLoadFailed(true); })
      .finally(() => { clearTimeout(slow); setSlowLoad(false); setLoading(false); });
    // Today's specials are the dishes picked in Admin › Daily Specials
    api.get('/daily-specials')
      .then(res => setSpecialIds((res.data || []).map(s => s.menu_item_id).filter(Boolean)))
      .catch(() => {});
    return () => clearTimeout(slow);
  }, [loadAttempt]);

  const scrollTo = (id) => {
    setActiveSection(id);
    spyPaused.current = Date.now() + 900; // don't let the spy fight the smooth scroll
    // Tapped a category before the full list has been drawn: draw it now, then jump
    if (!sectionRefs.current[id]) {
      setShowAll(true);
      setTimeout(() => { if (sectionRefs.current[id]) scrollTo(id); }, 80);
      return;
    }
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - stickyH - 110;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const q = search.trim().toLowerCase();
  const specialSet = useMemo(() => new Set(specialIds), [specialIds]);
  const { specials, menu } = useMemo(() => {
    const orderable = dishes.filter(d => isOrderable(d.category));
    return {
      // The strip shows the specials cooking today; sold-out ones go to its end. Each is also in its own section below.
      specials: orderable.filter(d => specialSet.has(d.id) && onToday(d))
        .sort((a, b) => (!!a.sold_out_today - !!b.sold_out_today) || (specialIds.indexOf(a.id) - specialIds.indexOf(b.id))),
      menu: orderable,
    };
  }, [dishes, specialIds, specialSet]);

  // A dish that has sold out today can be had tomorrow instead — but not a special, which is for today only
  const canTomorrow = useCallback((d) => orderableTomorrow(d) && !specialSet.has(d.id), [specialSet]);
  // The day a dish can be added for right now, or null when it cannot be ordered (then it gets the bell)
  const buyDay = useCallback((d) => {
    if (d.coming_soon) return null;
    if (d.preorder_only) return d.sold_out_today ? null : 'tomorrow';
    if (!d.sold_out_today) return 'today';
    return canTomorrow(d) ? 'tomorrow' : null;
  }, [canTomorrow]);
  // Pre-order lists what cannot be had today: pre-order dishes, today's sold-out ones, and "coming soon" (bell only)
  const onPreorder = useCallback((d) => !onToday(d) || canTomorrow(d), [canTomorrow]);

  // The basket, by dish: each line knows the day it is for
  const lines = useMemo(() => new Map(cartItems.map(i => [i.id, i])), [cartItems]);

  const matches = useCallback(
    (d) => (!vegOnly || d.is_veg) && (!offerView || inOffer(d))
      && (!q || d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)),
    [vegOnly, offerView, q]);
  // The offer view shows every dish in the offer whichever day it is for: today's with Add, the rest with Pre-order.
  // A dish already in the basket for tomorrow stays on Pre-order even once it is back on today's menu.
  const inTab = useCallback(
    (d) => offerView || (tab === 'tomorrow' ? onPreorder(d) || !!lines.get(d.id)?.preorder : onToday(d)),
    [tab, offerView, onPreorder, lines]);

  const shownSpecials = useMemo(() => (tab === 'today' && !offerView ? specials.filter(matches) : []), [tab, offerView, specials, matches]);
  const allSections = useMemo(() => LISTED.map(sec => ({
    ...sec,
    items: menu.filter(d => inSection(d, sec) && inTab(d) && matches(d))
      .sort((a, b) => (offerView ? (buyDay(a) !== 'today') - (buyDay(b) !== 'today') : 0) || byMenuOrder(a, b)),   // offer view: today's first
  })).filter(sec => sec.items.length > 0), [menu, inTab, matches, offerView, buyDay]);
  // Until the full list has been drawn, show the first rows only (a search or
  // a filter always shows every match)
  const bySection = useMemo(() => {
    if (showAll || q || vegOnly || offerView) return allSections;
    let budget = INITIAL_ROWS;
    return allSections.map(sec => {
      const items = sec.items.slice(0, Math.max(0, budget));
      budget -= items.length;
      return { ...sec, items };
    }).filter(sec => sec.items.length > 0);
  }, [allSections, showAll, q, vegOnly, offerView]);

  // Chips only for sections that still have dishes on this day under the filters
  const visibleSections = LISTED.filter(sec =>
    menu.some(d => inSection(d, sec) && inTab(d) && (!vegOnly || d.is_veg) && (!offerView || inOffer(d))));
  // What the same search or filter would find on Pre-order, for when today has nothing to show
  const preorderMatches = useMemo(() => menu.filter(d => onPreorder(d) && !d.coming_soon && matches(d)).length, [menu, matches, onPreorder]);
  const hasOffer = !!offer && menu.some(inOffer);
  const nothingShown = !loading && !loadFailed && bySection.length === 0 && shownSpecials.length === 0;

  // A different day has different sections: point the chips at its first one
  useEffect(() => {
    if (allSections[0]) setActiveSection(allSections[0].id);
  }, [tab, offerView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nothing cooking today at all: open on Pre-order rather than on a page of sold-out dishes
  useEffect(() => {
    if (loading || picked.current || !dishes.length) return;
    if (!menu.some(d => buyDay(d) === 'today')) setTab('tomorrow');
  }, [loading, dishes.length, menu, buyDay]);

  const dayOf = (d) => {
    const line = lines.get(d.id);
    return line ? (line.preorder ? 'tomorrow' : 'today') : buyDay(d);
  };
  const handleAdd = useCallback((d, when) => {
    if (when === 'tomorrow' && deliveryType !== 'takeaway') setDeliveryType('takeaway');   // a pre-order is collected
    addToCart({ id: d.id, name: d.name, price: d.price, image: d.image, category: d.category, subcategory: d.subcategory, preorder: when === 'tomorrow' });
  }, [addToCart, deliveryType, setDeliveryType]);

  const counts = { today: 0, tomorrow: 0 };
  for (const i of cartItems) counts[i.preorder ? 'tomorrow' : 'today'] += i.quantity;
  // What the offer does for this basket (the server prices it at checkout; this is the same sum, shown early)
  const deal = useMemo(() => {
    const byId = new Map(dishes.map(d => [d.id, d]));
    return offerFor(cartItems.map(i => ({ ...i, subcategory: i.subcategory ?? byId.get(i.id)?.subcategory })), offer);
  }, [cartItems, dishes, offer]);

  // Pre-order is collection only; today follows the Collection / Delivery choice
  const collecting = tab === 'tomorrow' || deliveryType === 'takeaway';
  const slotSummary = tab === 'today'
    ? (pickupSlot ? pickupSlot.label : 'ASAP')
    : (preorderSlot ? `Tomorrow ${preorderSlot.label}` : 'Tomorrow');
  const blocked = !kitchenOpen || belowMinimum;

  return (
    <div className="min-h-screen pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" style={{ backgroundColor: C.ivory }}>
      {/* ── Hero banner ── */}
      {/* Slim on phones so the first dishes are on screen without scrolling */}
      <section ref={heroRef} className="relative overflow-hidden h-[64px] md:h-[170px]">
        <Image fill priority sizes="100vw" src="https://images.unsplash.com/photo-1742281258189-3b933879867a?crop=entropy&cs=srgb&fm=jpg&auto=format&q=60&w=1600" alt="Fresh Andhra food" className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.94) 0%, rgba(128,0,32,0.75) 55%, rgba(128,0,32,0.45) 100%)' }} />
        <div className="relative h-full max-w-3xl mx-auto px-4 flex flex-col justify-center">
          <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Order Now
          </h1>
          <p className="hidden md:block text-sm mt-1 max-w-md" style={{ color: '#F4E9D0' }}>
            Today&apos;s menu is cooked fresh when you order and ready in about 30 minutes. Everything else, pre-order and collect tomorrow.
          </p>
        </div>
      </section>

      {/* Push opt-in — only renders inside the installed app */}
      <div className="max-w-3xl mx-auto px-4 pt-3">
        <PushOptIn />
      </div>

      {/* ── Sticky order controls ── */}
      <div ref={stickyRef} className="sticky z-30 top-[calc(32px+4rem)] md:top-[calc(32px+5rem)]"
        style={{ backgroundColor: C.ivory, borderBottom: `1px solid ${C.line}`, boxShadow: '0 4px 12px rgba(45,36,34,0.06)' }}>
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-3">
          <DaySwitch tab={tab} onChange={changeTab} compact={searchMode || controlsCollapsed} />

          {/* Collection / Delivery toggle — today only, and only while the admin has delivery switched on.
              With delivery off the page says nothing about delivery at all (owner, 25 Nov 2026). */}
          {tab === 'today' && deliveryEnabled && (
            <div className={searchMode || controlsCollapsed ? 'hidden' : 'mt-3'}>
              <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: C.tint }}>
                {[['delivery', '🚚 Delivery'], ['takeaway', '🛵 Collection · save 10%']].map(([val, label]) => (
                  <button key={val} onClick={() => setDeliveryType(val)}
                    className="flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-colors"
                    style={{
                      backgroundColor: deliveryType === val ? C.burgundy : 'transparent',
                      color: deliveryType === val ? '#fff' : C.muted,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* One collection time at a time: the day being looked at, once it has a dish in the basket.
              Checkout shows both when the basket is collected twice. */}
          {collecting && counts[tab] > 0 && (
            <div className={searchMode || controlsCollapsed ? 'hidden' : 'mt-3'} data-testid={`slot-${tab}`}>
              {tab === 'today'
                ? <SlotPicker key="today" pickupSlot={pickupSlot} setPickupSlot={setPickupSlot} />
                : <SlotPicker key="tomorrow" pickupSlot={preorderSlot} setPickupSlot={setPreorderSlot} requireTomorrow
                    title={tomorrowLabel ? `Collect ${tomorrowLabel}` : 'Collect tomorrow'} note="" />}
            </div>
          )}

          {/* Mode info line — stays pinned with the search bar even when the
              toggle and slot picker collapse away */}
          {!searchMode && (
            collecting ? (
              <p className="text-[11px] mt-1.5" style={{ color: C.veg }}>
                🎉 10% off every collection order{deliveryEnabled ? ' — no delivery fee' : ''}. Collect from our Greenleys kitchen, MK12.
                {controlsCollapsed && counts[tab] > 0 && (
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="ml-1.5 font-black underline" style={{ color: C.burgundy }}>
                    {slotSummary} ▴
                  </button>
                )}
              </p>
            ) : (
              <p className="text-xs mt-1.5" style={{ color: C.muted }}>
                🚚 Delivering across MK1–MK19 · fee &amp; free-delivery threshold confirmed at checkout with your postcode. Minimum order £15.
              </p>
            )
          )}

          {/* Search — stays fixed with the categories */}
          <div className={`flex items-center gap-2 ${searchMode ? 'mt-2' : 'mt-3'}`}>
            <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: '#fff', border: `1.5px solid ${searchMode ? C.saffron : C.line}` }}>
              <Search size={15} style={{ color: C.muted }} />
              <input ref={searchInputRef} value={search} data-testid="order-search" onChange={e => { setSearch(e.target.value); recordSearch(e.target.value); }}
                onFocus={() => setSearchMode(true)}
                onBlur={() => { if (!search.trim()) setSearchMode(false); }}
                placeholder={offerView ? 'Search the offer…' : tab === 'today' ? "Search today's menu…" : 'Search dishes to pre-order…'}
                className="flex-1 bg-transparent outline-none text-sm" style={{ color: C.ink }} />
            </div>
            {searchMode && (
              <button
                onMouseDown={e => e.preventDefault() /* keep focus handling clean */}
                onClick={() => { setSearch(''); setSearchMode(false); searchInputRef.current?.blur?.(); }}
                className="flex-none text-sm font-bold px-2 py-2"
                style={{ color: C.burgundy }}>
                Cancel
              </button>
            )}
          </div>

          {/* Category chips. The top padding is room for the "Offers" label that sits on the offer chip's edge. */}
          <div className={searchMode ? 'hidden' : `flex gap-2 overflow-x-auto pb-1 ${hasOffer ? 'mt-1 pt-2' : 'mt-3'}`} style={{ scrollbarWidth: 'none' }}>
            {hasOffer && (
              <button onClick={() => showOffer(!offerView)} aria-pressed={offerView} data-testid="offer-chip"
                className="relative flex-none text-xs font-black px-3.5 py-1.5 rounded-full"
                style={{
                  border: `1.5px solid ${C.gold}`,
                  backgroundColor: offerView ? C.gold : C.offer,
                  color: offerView ? '#fff' : C.ink,
                }}>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[9px] font-black uppercase tracking-widest leading-[13px]"
                  style={{ backgroundColor: C.burgundy, color: '#fff' }}>
                  Offers
                </span>
                {offer.label}
              </button>
            )}
            <button onClick={() => setVegOnly(!vegOnly)}
              aria-pressed={vegOnly}
              className="flex-none flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full"
              style={{
                border: `1.5px solid ${C.veg}`,
                backgroundColor: vegOnly ? C.veg : 'transparent',
                color: vegOnly ? '#fff' : C.veg,
              }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: vegOnly ? '#fff' : C.veg }} />
              Veg only
            </button>
            {visibleSections.map(sec => (
              <button key={sec.id} onClick={() => scrollTo(sec.id)}
                className="flex-none text-xs font-bold px-3.5 py-1.5 rounded-full"
                style={{
                  border: `1px solid ${activeSection === sec.id ? C.burgundy : 'transparent'}`,
                  backgroundColor: activeSection === sec.id ? C.wash : 'transparent',
                  color: activeSection === sec.id ? C.burgundy : C.muted,
                }}>
                {sec.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Menu list ── */}
      {/* overflow-anchor off: the sticky block above changes height when it
          collapses, and browser scroll anchoring would fight it (flicker) */}
      <div className="max-w-3xl mx-auto px-4 pb-40" style={{ overflowAnchor: 'none' }} role="tabpanel" data-testid={`list-${offerView ? 'offer' : tab}`}>
        {loading && (
          <div className="py-10 text-center text-sm" style={{ color: C.muted }} role="status" aria-live="polite">
            <p>Loading menu…</p>
            {slowLoad && <p className="mt-2 text-xs">Our kitchen&apos;s server is waking up — this can take up to a minute the first time. Thanks for waiting.</p>}
          </div>
        )}
        {!loading && loadFailed && dishes.length === 0 && (
          <div className="py-10 text-center text-sm" style={{ color: C.muted }} role="alert">
            <p className="font-semibold" style={{ color: C.burgundy }}>We couldn&apos;t load the menu.</p>
            <p className="mt-1">Please try again in a moment, or message us on WhatsApp and we&apos;ll take your order by hand.</p>
            <div className="mt-4 flex gap-3 justify-center">
              <button onClick={() => { setLoading(true); setLoadAttempt(a => a + 1); }} className="px-4 py-2 text-xs font-semibold text-white rounded-sm" style={{ backgroundColor: C.burgundy }}>Try again</button>
              <a href="https://wa.me/447307119962" className="px-4 py-2 text-xs font-semibold rounded-sm border" style={{ borderColor: C.burgundy, color: C.burgundy }}>WhatsApp us</a>
            </div>
          </div>
        )}
        {nothingShown && dishes.length > 0 && (
          tab === 'today' && !offerView && preorderMatches > 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: C.muted }} data-testid="today-empty">
              <p>{q || vegOnly ? "Not on today's menu." : 'Nothing is cooking right now.'}</p>
              <button onClick={() => changeTab('tomorrow')}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black" style={TONE.tomorrow}>
                <Moon size={14} /> Pre-order for tomorrow · {preorderMatches} dish{preorderMatches > 1 ? 'es' : ''}
              </button>
            </div>
          ) : (
            <p className="py-10 text-center text-sm" style={{ color: C.muted }}>No dishes match your search.</p>
          )
        )}

        {/* The offer, said once above its dishes */}
        {offerView && !nothingShown && !loading && (
          <p className="mt-4 rounded-xl px-3 py-2.5 text-[13px] font-bold" style={{ backgroundColor: C.offer, color: C.ink, border: `1px solid ${C.offerLine}` }} data-testid="offer-note">
            Any two of these biryanis for £{offer.price.toFixed(2)}. Mix them as you like.
          </p>
        )}

        {/* Pre-order: the day it is collected, said once — here until a dish is added, then by the time picker above */}
        {tab === 'tomorrow' && !offerView && !nothingShown && !loading && counts.tomorrow === 0 && (
          <p className="flex items-center gap-2 mt-4 rounded-xl px-3 py-2.5 text-[13px] font-bold" style={{ backgroundColor: C.wash, color: C.burgundy }}>
            <Moon size={15} className="shrink-0" />
            <span>Collect tomorrow{tomorrowLabel ? `, ${tomorrowLabel}` : ''}, at a time you choose.</span>
          </p>
        )}

        {/* Today's Specials — photos first, above the everyday dishes */}
        {shownSpecials.length > 0 && (
          <section data-testid="specials">
            <h2 className="pt-6 pb-3 text-lg font-semibold flex items-baseline gap-2" style={{ fontFamily: "'Playfair Display', serif", color: C.burgundy }}>
              Today&apos;s Specials
              <span className="font-sans text-[10px] font-black uppercase tracking-widest" style={{ color: C.gold }}>Limited</span>
            </h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
              {shownSpecials.map(d => (
                <SpecialCard key={d.id} d={d} qty={lines.get(d.id)?.quantity || 0} onAdd={handleAdd} onOpen={setSheetItem} onQty={updateQuantity} />
              ))}
            </div>
          </section>
        )}

        {bySection.map((sec, si) => (
          <section key={sec.id} ref={el => { sectionRefs.current[sec.id] = el; }}>
            <h2 className="pt-8 pb-2 text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: C.burgundy }}>
              {sec.name}
            </h2>
            {sec.items.map(d => (
              // On a today list a sold-out dish is greyed, and offered for tomorrow where it can be
              <DishRow key={d.id} d={d} when={dayOf(d)} sold={onToday(d) && !!d.sold_out_today && (offerView || tab === 'today')}
                offer={offer && inOffer(d) ? offer.label : null} qty={lines.get(d.id)?.quantity || 0}
                onAdd={handleAdd} onOpen={setSheetItem} onQty={updateQuantity} />
            ))}
            {/* Introductory pricing note — after the first section, so dishes come first */}
            {si === 0 && !q && !offerView && <div className="pt-5"><IntroPricesBanner compact /></div>}
          </section>
        ))}
      </div>

      {/* ── Item detail bottom sheet — instant, keeps your place in the list ── */}
      {sheetItem && (() => {
        const d = dishes.find(x => x.id === sheetItem.id) || sheetItem;   // the dish as the menu has it now
        const when = dayOf(d);
        const qty = lines.get(d.id)?.quantity || 0;
        const soldToday = onToday(d) && !!d.sold_out_today;
        return (
          <>
            <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setSheetItem(null)} />
            <div ref={sheetRef} role="dialog" aria-modal="true" aria-label={d.name}
              className="fixed bottom-0 left-0 right-0 z-[70] animate-slide-up rounded-t-3xl overflow-hidden
                md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:rounded-3xl md:w-[880px] md:max-w-[92vw] md:flex md:animate-none"
              style={{ backgroundColor: C.ivory, boxShadow: '0 -10px 40px rgba(45,36,34,0.35)', maxHeight: '85vh' }}>
              {/* Desktop: tall image panel on the left so photos aren't cropped to a strip */}
              {d.image && (
                <div className="hidden md:block relative md:w-[45%] md:self-stretch" style={{ minHeight: 460 }}>
                  <Image src={d.image} alt={d.name} fill sizes="400px" className="object-cover" />
                </div>
              )}
              <div className="overflow-y-auto md:flex-1" style={{ maxHeight: '85vh' }}>
                {d.image && (
                  <div className="relative w-full md:hidden" style={{ height: 190 }}>
                    <Image src={d.image} alt={d.name} fill sizes="100vw" className="object-cover" />
                  </div>
                )}
                <button onClick={() => setSheetItem(null)} aria-label="Close"
                  className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: 'rgba(253,251,247,0.95)', color: C.burgundy }}>
                  ✕
                </button>
                <div className="p-5 md:p-7 md:pr-14 max-w-3xl mx-auto">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: C.burgundy }}>
                      <VegDot isVeg={d.is_veg} /> {d.name}
                      {d.spice_level > 1 && <Flame size={14} style={{ color: C.nonveg }} />}
                    </h3>
                    <span className="text-lg font-black shrink-0" style={{ color: C.burgundy }}>£{Number(d.price).toFixed(2)}</span>
                  </div>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: C.muted }}>{d.description}</p>
                  {(d.allergens || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {d.allergens.map(a => (
                        <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: C.offer, color: C.gold, border: `1px solid ${C.offerLine}` }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  {offer && inOffer(d) && (
                    <p className="text-[11px] font-black mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: C.offer, color: C.ink, border: `1px solid ${C.offerLine}` }}>
                      {offer.label} — any two biryanis, mixed as you like.
                    </p>
                  )}
                  {when === 'tomorrow' && (
                    <p className="flex items-center gap-2 text-[11px] font-bold mt-3 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: 'rgba(128,0,32,0.06)', color: C.burgundy }}>
                      <Moon size={13} className="shrink-0" />
                      <span>{soldToday ? `${soldOutLabel(d)}. ` : ''}Pre-order now, collect tomorrow at a time you choose.</span>
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-5">
                    {qty > 0 && when ? (
                      <>
                        <Stepper qty={qty} when={when} onChange={(n) => updateQuantity(d.id, n)} />
                        <button onClick={() => setSheetItem(null)}
                          className="flex-1 py-3.5 rounded-xl text-sm font-black text-white"
                          style={{ backgroundColor: C.ink }}>
                          Done — {qty} {when === 'tomorrow' ? 'for tomorrow' : 'in basket'}
                        </button>
                      </>
                    ) : !when ? (
                      <div className="flex-1 text-center py-2"><RestockBell item={d} /></div>
                    ) : (
                      <button onClick={() => handleAdd(d, when)}
                        className="flex-1 py-3.5 rounded-xl text-sm font-black" style={TONE[when]}>
                        {when === 'tomorrow' ? 'Pre-order for tomorrow — ' : 'Add to basket — '}£{Number(d.price).toFixed(2)}
                      </button>
                    )}
                  </div>
                  <Link href={buildItemUrl(d)} className="block text-center text-xs font-semibold mt-4 underline" style={{ color: C.muted }}>
                    View full details, reviews &amp; FAQs
                  </Link>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Sticky basket bar: one chip per day (tap to see that day), then checkout ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 animate-slide-up">
          <div className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden" data-testid="basket-bar"
            style={{ backgroundColor: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 -6px 24px rgba(45,36,34,0.22)' }}>
            {/* The offer: what it has saved, or how close the basket is to it (tap to see its dishes) */}
            {offer && deal.short > 0 ? (
              <button onClick={() => { if (!offerView) showOffer(true); }} data-testid="offer-nudge"
                className="block w-full px-3 py-1.5 text-[11px] font-black text-center" style={{ backgroundColor: C.offer, color: C.ink }}>
                Add {deal.short} more biryani{deal.short > 1 ? 's' : ''} · {offer.label}
              </button>
            ) : offer && deal.saving > 0 && (
              <p className="px-3 py-1.5 text-[11px] font-black text-center" style={{ backgroundColor: C.offer, color: C.ink }} data-testid="offer-applied">
                {offer.label} applied · you save £{deal.saving.toFixed(2)}
              </p>
            )}
            <div className="flex items-center gap-2 p-2">
              {DAYS.filter(({ id }) => counts[id] > 0).map(({ id, Icon, short }) => (
                <button key={id} onClick={() => changeTab(id)} aria-label={`${short}: ${counts[id]} in basket`} data-testid={`bar-${id}`}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black whitespace-nowrap" style={TONE[id]}>
                  <Icon size={13} />
                  {/* both days in the basket: phones keep the icon and the count */}
                  <span className={counts.today > 0 && counts.tomorrow > 0 ? 'hidden sm:inline' : ''}>{short} ·</span>
                  {counts[id]}
                </button>
              ))}
              <button
                onClick={() => { if (blocked) return; setNavigating(true); router.push('/checkout'); }}
                disabled={navigating} aria-disabled={blocked} data-testid="go-checkout"
                className="ml-auto flex items-center gap-2 rounded-xl pl-4 pr-3 py-2 text-white text-left active:scale-[0.985] transition-transform"
                style={{ backgroundColor: blocked ? C.muted : navigating ? '#5C0017' : C.burgundy }}>
                <span className="leading-tight">
                  <span className="block text-[13px] font-black whitespace-nowrap">
                    {navigating ? 'Opening checkout…' : !kitchenOpen ? 'Kitchen closed' : belowMinimum ? `Add £${(MINIMUM_ORDER - cartTotal).toFixed(2)} more` : 'Go to Checkout'}
                  </span>
                  <span className="block text-[11px] font-bold tabular-nums whitespace-nowrap" style={{ color: C.saffron }}>
                    {cartCount} item{cartCount > 1 ? 's' : ''} · £{(cartTotal - deal.saving).toFixed(2)}{!kitchenOpen ? '' : belowMinimum ? ' · £15 minimum' : ''}
                  </span>
                </span>
                {navigating
                  ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  : !blocked && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
