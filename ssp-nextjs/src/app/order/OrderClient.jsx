'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  const {
    cartItems, cartCount, cartTotal, addToCart, updateQuantity,
    deliveryType, setDeliveryType, pickupSlot, setPickupSlot,
  } = useCart();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('breakfast');
  const sectionRefs = useRef({});

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
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const q = search.trim().toLowerCase();
  const bySection = SECTIONS.map(sec => ({
    ...sec,
    items: dishes.filter(d =>
      d.category === sec.id &&
      isOrderable(d.category) &&
      (!q || d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q))
    ),
  })).filter(sec => sec.items.length > 0);

  const handleAdd = (d) => addToCart({ id: d.id, name: d.name, price: d.price, image: d.image, category: d.category });

  return (
    <div className="min-h-screen pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" style={{ backgroundColor: C.ivory }}>
      {/* ── Sticky order controls ── */}
      <div className="sticky z-30 top-[calc(32px+4rem)] md:top-[calc(32px+5rem)]"
        style={{ backgroundColor: C.ivory, borderBottom: `1px solid ${C.line}` }}>
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-2">
          {/* Collection / Delivery toggle */}
          <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: '#F3EDE2' }}>
            {[['takeaway', 'Collection'], ['delivery', 'Delivery']].map(([val, label]) => (
              <button key={val} onClick={() => setDeliveryType(val)}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors"
                style={{
                  backgroundColor: deliveryType === val ? C.burgundy : 'transparent',
                  color: deliveryType === val ? '#fff' : C.muted,
                }}>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3">
            {deliveryType === 'takeaway' ? (
              <SlotPicker pickupSlot={pickupSlot} setPickupSlot={setPickupSlot} />
            ) : (
              <p className="text-xs py-1" style={{ color: C.muted }}>
                Delivering across MK1–MK19 · fee and timing confirmed at checkout with your postcode.
              </p>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto mt-3 pb-1" style={{ scrollbarWidth: 'none' }}>
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

      {/* ── Search ── */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 rounded-full px-4 py-2.5"
          style={{ backgroundColor: '#fff', border: `1.5px solid ${C.line}` }}>
          <Search size={16} style={{ color: C.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: C.ink }} />
        </div>
      </div>

      {/* ── Menu list ── */}
      <div className="max-w-3xl mx-auto px-4 pb-40">
        {loading && <p className="py-10 text-center text-sm" style={{ color: C.muted }}>Loading menu…</p>}
        {!loading && bySection.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: C.muted }}>No dishes match your search.</p>
        )}
        {bySection.map(sec => (
          <section key={sec.id} ref={el => { sectionRefs.current[sec.id] = el; }}
            style={{ scrollMarginTop: 'calc(32px + 4rem + 180px)' }}>
            <h2 className="pt-6 pb-1 text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: C.burgundy }}>
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
                  <div className="flex-1 min-w-0">
                    <Link href={buildItemUrl(d)} className="flex items-center gap-1.5 font-bold text-sm" style={{ color: C.ink }}>
                      <VegDot isVeg={d.is_veg} />
                      <span className="truncate">{d.name}</span>
                      {d.spice_level > 1 && <Flame size={11} style={{ color: C.nonveg }} className="shrink-0" />}
                    </Link>
                    <p className="text-[11px] truncate" style={{ color: C.muted }}>{d.description}</p>
                    <p className="text-[13px] font-black mt-0.5" style={{ color: C.ink }}>£{Number(d.price).toFixed(2)}</p>
                  </div>
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
