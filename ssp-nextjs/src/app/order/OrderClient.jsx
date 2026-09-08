'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flame, ShoppingBag, ChevronRight, Search } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { isOrderable } from '@/config/softLaunch';
import { buildItemUrl } from '@/lib/itemUrl';
import api from '@/api';
import { getCached, setCached } from '@/api/menuCache';
import SlotPicker from '@/components/SlotPicker';

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
};

function VegDot({ isVeg }) {
  const col = isVeg ? C.veg : C.nonveg;
  return (
    <span className="inline-flex items-center justify-center shrink-0"
      style={{ width: 12, height: 12, border: `1.5px solid ${col}`, borderRadius: 2 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: col }} />
    </span>
  );
}

function Stepper({ qty, onChange }) {
  return (
    <div className="flex items-center rounded-full shrink-0" style={{ backgroundColor: C.burgundy, color: '#fff' }}>
      <button aria-label="Decrease quantity" onClick={() => onChange(qty - 1)}
        className="w-8 h-9 font-black text-base">−</button>
      <span className="min-w-[16px] text-center text-sm font-black tabular-nums">{qty}</span>
      <button aria-label="Increase quantity" onClick={() => onChange(qty + 1)}
        className="w-8 h-9 font-black text-base">+</button>
    </div>
  );
}

export default function OrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    cartItems, cartCount, cartTotal, addToCart, updateQuantity,
    deliveryType, setDeliveryType, pickupSlot, setPickupSlot,
  } = useCart();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // While searching, collapse the sticky controls so results stay visible above the keyboard.
  // Expands back on Cancel, on blur with no text, or on any scroll once the keyboard is closed.
  const [searchMode, setSearchMode] = useState(false);
  const searchInputRef = useRef(null);
  const [sheetItem, setSheetItem] = useState(null); // dish shown in the bottom sheet
  const [activeSection, setActiveSection] = useState('breakfast');
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

  // Deep link: /order?cat=veg jumps straight to that category once the menu loads
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || loading || !dishes.length) return;
    const cat = searchParams?.get('cat');
    if (cat && SECTIONS.some(s => s.id === cat)) {
      deepLinked.current = true;
      setTimeout(() => scrollTo(cat), 250);
    }
  }, [loading, dishes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock page scroll while the item sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetItem ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetItem]);

  // Entering search mode (or typing) parks the collapsed bar under the header
  // AFTER the layout shrinks, so results start right below it
  useEffect(() => {
    if (!searchMode) return;
    // Delay past the browser's own "scroll focused input into view" adjustment,
    // which would otherwise override this
    const t = setTimeout(() => {
      // Anchor on the static hero — a stuck position:sticky element reports a
      // scroll-dependent offsetTop, which is useless here
      const hero = heroRef.current;
      if (!hero) return;
      const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
      const top = heroBottom - (window.innerWidth >= 768 ? 112 : 96);
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    }, 150);
    return () => clearTimeout(t);
  }, [searchMode, search]);

  // Scroll-spy — highlight the category currently at the top of the viewport
  useEffect(() => {
    const onScroll = () => {
      // Keyboard closed + user scrolling → bring the full controls back
      if (searchMode && document.activeElement !== searchInputRef.current) {
        setSearchMode(false);
      }
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

  useEffect(() => {
    const cached = getCached('all');
    if (cached) { setDishes(cached); setLoading(false); }
    api.get('/menu?available=true')
      .then(res => { setDishes(res.data); setCached('all', res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const qtyOf = useCallback(
    (id) => cartItems.find(i => i.id === id)?.quantity || 0,
    [cartItems]
  );

  const scrollTo = (id) => {
    setActiveSection(id);
    spyPaused.current = Date.now() + 900; // don't let the spy fight the smooth scroll
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - stickyH - 110;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const q = search.trim().toLowerCase();
  const bySection = SECTIONS.map(sec => ({
    ...sec,
    items: dishes
      .filter(d =>
        d.category === sec.id &&
        isOrderable(d.category) &&
        (!q || d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q))
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(sec => sec.items.length > 0);

  const handleAdd = (d) => addToCart({ id: d.id, name: d.name, price: d.price, image: d.image, category: d.category });

  return (
    <div className="min-h-screen pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" style={{ backgroundColor: C.ivory }}>
      {/* ── Hero banner ── */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ height: 170 }}>
        <img
          src="https://images.unsplash.com/photo-1742281258189-3b933879867a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"
          alt="Fresh Andhra food"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.94) 0%, rgba(128,0,32,0.75) 55%, rgba(128,0,32,0.45) 100%)' }} />
        <div className="relative h-full max-w-3xl mx-auto px-4 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Order Now
          </h1>
          <p className="text-sm mt-1 max-w-md" style={{ color: '#F4E9D0' }}>
            Fresh Andhra food, cooked to order — collect in ~40 minutes and save 10%, or get it delivered across Milton Keynes.
          </p>
        </div>
      </section>

      {/* ── Sticky order controls ── */}
      <div ref={stickyRef} className="sticky z-30 top-[calc(32px+4rem)] md:top-[calc(32px+5rem)]"
        style={{ backgroundColor: C.ivory, borderBottom: `1px solid ${C.line}`, boxShadow: '0 4px 12px rgba(45,36,34,0.06)' }}>
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-3">
          {/* Collection / Delivery toggle */}
          <div className={searchMode ? 'hidden' : 'flex rounded-xl p-1 gap-1'} style={{ backgroundColor: '#F3EDE2' }}>
            {[['takeaway', '🛵 Collection · save 10%'], ['delivery', '🚚 Delivery']].map(([val, label]) => (
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

          <div className={searchMode ? 'hidden' : 'mt-3'}>
            {deliveryType === 'takeaway' ? (
              <>
                <SlotPicker pickupSlot={pickupSlot} setPickupSlot={setPickupSlot} />
                <p className="text-[11px] mt-1.5" style={{ color: C.veg }}>
                  🎉 10% off every collection order — no delivery fee. Collect from our Greenleys kitchen, MK12 6LF.
                </p>
              </>
            ) : (
              <p className="text-xs py-1" style={{ color: C.muted }}>
                🚚 Delivering across MK1–MK19 · fee &amp; free-delivery threshold confirmed at checkout with your postcode. Minimum order £15.
              </p>
            )}
          </div>

          {/* Search — stays fixed with the categories */}
          <div className={`flex items-center gap-2 ${searchMode ? '' : 'mt-3'}`}>
            <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: '#fff', border: `1.5px solid ${searchMode ? C.saffron : C.line}` }}>
              <Search size={15} style={{ color: C.muted }} />
              <input ref={searchInputRef} value={search} onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchMode(true)}
                onBlur={() => { if (!search.trim()) setSearchMode(false); }}
                placeholder="Search dishes…"
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

          {/* Category chips */}
          <div className={searchMode ? 'hidden' : 'flex gap-2 overflow-x-auto mt-3 pb-1'} style={{ scrollbarWidth: 'none' }}>
            {SECTIONS.map(sec => (
              <button key={sec.id} onClick={() => scrollTo(sec.id)}
                className="flex-none text-xs font-bold px-3.5 py-1.5 rounded-full"
                style={{
                  border: `1px solid ${activeSection === sec.id ? C.burgundy : 'transparent'}`,
                  backgroundColor: activeSection === sec.id ? '#F8EEE9' : 'transparent',
                  color: activeSection === sec.id ? C.burgundy : C.muted,
                }}>
                {sec.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Menu list ── */}
      <div className="max-w-3xl mx-auto px-4 pb-40">
        {loading && <p className="py-10 text-center text-sm" style={{ color: C.muted }}>Loading menu…</p>}
        {!loading && bySection.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: C.muted }}>No dishes match your search.</p>
        )}
        {bySection.map(sec => (
          <section key={sec.id} ref={el => { sectionRefs.current[sec.id] = el; }}>
            <h2 className="pt-8 pb-2 text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: C.burgundy }}>
              {sec.name}
            </h2>
            {sec.items.map(d => {
              const qty = qtyOf(d.id);
              return (
                <div key={d.id} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                  {d.image ? (
                    <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 56, height: 56 }}>
                      <Image src={d.image} alt={d.name} fill sizes="56px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="shrink-0 rounded-xl flex items-center justify-center font-bold text-white"
                      style={{ width: 56, height: 56, backgroundColor: d.is_veg ? C.veg : C.nonveg, fontFamily: "'Playfair Display', serif" }}>
                      {d.name.slice(0, 1)}
                    </div>
                  )}
                  <button onClick={() => setSheetItem(d)} className="flex-1 min-w-0 text-left">
                    <span className="flex items-center gap-1.5 font-bold text-sm" style={{ color: C.ink }}>
                      <VegDot isVeg={d.is_veg} />
                      <span className="truncate">{d.name}</span>
                      {d.spice_level > 1 && <Flame size={11} style={{ color: C.nonveg }} className="shrink-0" />}
                    </span>
                    <span className="block text-[11px] truncate" style={{ color: C.muted }}>{d.description}</span>
                    <span className="block text-[13px] font-black mt-0.5" style={{ color: C.ink }}>£{Number(d.price).toFixed(2)}</span>
                  </button>
                  {qty > 0 ? (
                    <Stepper qty={qty} onChange={(n) => updateQuantity(d.id, n)} />
                  ) : (
                    <button onClick={() => handleAdd(d)}
                      className="shrink-0 rounded-full px-4 py-2 text-xs font-black tracking-wide"
                      style={{ backgroundColor: C.saffron, color: C.ink, boxShadow: '0 1px 3px rgba(45,36,34,0.18)' }}>
                      + ADD
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>

      {/* ── Item detail bottom sheet — instant, keeps your place in the list ── */}
      {sheetItem && (() => {
        const d = sheetItem;
        const qty = qtyOf(d.id);
        return (
          <>
            <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setSheetItem(null)} />
            <div className="fixed bottom-0 left-0 right-0 z-[70] animate-slide-up rounded-t-3xl overflow-hidden"
              style={{ backgroundColor: C.ivory, boxShadow: '0 -10px 40px rgba(45,36,34,0.35)', maxHeight: '85vh' }}>
              <div className="overflow-y-auto" style={{ maxHeight: '85vh' }}>
                {d.image && (
                  <div className="relative w-full" style={{ height: 190 }}>
                    <Image src={d.image} alt={d.name} fill sizes="100vw" className="object-cover" />
                  </div>
                )}
                <button onClick={() => setSheetItem(null)} aria-label="Close"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: 'rgba(253,251,247,0.95)', color: C.burgundy }}>
                  ✕
                </button>
                <div className="p-5 max-w-3xl mx-auto">
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
                          style={{ backgroundColor: '#FBF3DC', color: C.gold, border: '1px solid #EBD9A8' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-5">
                    {qty > 0 ? (
                      <>
                        <Stepper qty={qty} onChange={(n) => updateQuantity(d.id, n)} />
                        <button onClick={() => setSheetItem(null)}
                          className="flex-1 py-3.5 rounded-xl text-sm font-black text-white"
                          style={{ backgroundColor: C.burgundy }}>
                          Done — {qty} in basket
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleAdd(d)}
                        className="flex-1 py-3.5 rounded-xl text-sm font-black"
                        style={{ backgroundColor: C.saffron, color: C.ink }}>
                        Add to basket — £{Number(d.price).toFixed(2)}
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

      {/* ── Sticky cart bar ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 animate-slide-up">
          <button onClick={() => router.push('/checkout')}
            className="w-full max-w-3xl mx-auto flex items-center gap-3 rounded-2xl px-5 py-4 text-white"
            style={{ backgroundColor: C.burgundy, boxShadow: '0 -6px 24px rgba(92,0,23,0.35)' }}>
            <ShoppingBag size={18} />
            <span className="text-sm font-black">
              {cartCount} item{cartCount > 1 ? 's' : ''} · £{cartTotal.toFixed(2)}
            </span>
            {deliveryType === 'takeaway' && (
              <span className="text-[11px] font-bold" style={{ color: C.saffron }}>
                {pickupSlot ? `Collect ${pickupSlot.label}` : 'Collect ASAP'}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 text-sm font-black">
              Go to Checkout <ChevronRight size={16} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
