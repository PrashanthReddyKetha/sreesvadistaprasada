import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Flame, Search, X, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import MenuLoader from '../../components/MenuLoader';
import api from '../../api';
import { getCached, setCached } from '../../api/menuCache';
import useTabHistory from '../../hooks/useTabHistory';

const TABS = ['Starters', 'Indo - Chinese', 'Egg Specials', 'Curries', 'Biriyani', 'Rice Bowls', 'All'];

const SECTION_MESSAGES = {
  'Starters':      { icon: '🔥', text: 'The first bite that sets the whole story — charred edges, whole spices, nothing held back.' },
  'Indo - Chinese':{ icon: '🥢', text: 'The streets of Hyderabad meet the wok — fiery, tangy, and dangerously addictive.' },
  'Egg Specials':  { icon: '🥚', text: 'Eggs done the Andhra way — rich, deep-spiced, and always worth the extra roti.' },
  'Curries':       { icon: '🍲', text: 'Slow-simmered in handmade masalas. The kind of gravy that demands a second helping of rice.' },
  'Biriyani':      { icon: '🌾', text: 'Country chicken, aged basmati, village spice — sealed slow. Worth every minute of the wait.' },
  'Rice Bowls':    { icon: '🍱', text: 'A full South Indian plate in one — rice, gravy, rasam, papad. Exactly as it should be.' },
};

const fmt = (p) => `£${parseFloat(p).toFixed(2)}`;

function SpiceBar({ level }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array(level).fill(0).map((_, i) => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
      ))}
    </div>
  );
}

const Svadista = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Starters');
  const [search, setSearch] = useState('');
  const selectTab = useTabHistory(activeTab, setActiveTab, 'Starters');
  const { addToCart } = useCart();

  useEffect(() => {
    const key = 'nonVeg';
    const cached = getCached(key);
    if (cached) { setItems(cached); setLoading(false); }
    api.get('/menu?category=nonVeg&available=true')
      .then(r => { setItems(r.data); setCached(key, r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byTab = activeTab === 'All'
    ? [...items].sort((a, b) => a.name.localeCompare(b.name))
    : [...items].filter(i => i.subcategory === activeTab).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = search.trim()
    ? byTab.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
    : byTab;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Helmet>
        <title>Non-Veg South Indian Menu | Sree Svadista | Milton Keynes</title>
        <meta name="description" content="Order authentic non-veg South Indian food in Milton Keynes. Slow-cooked mutton curries, village-style chicken, and bold Andhra recipes." />
        <link rel="canonical" href="https://sreesvadistaprasada.vercel.app/svadista" />
        <meta property="og:title" content="Non-Veg South Indian Menu | Sree Svadista | Milton Keynes" />
        <meta property="og:description" content="Order authentic non-veg South Indian food in Milton Keynes. Slow-cooked mutton curries, village-style chicken, and bold Andhra recipes." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sreesvadistaprasada.vercel.app/svadista" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" />
        <meta property="og:site_name" content="Sree Svadista Prasada" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Non-Veg South Indian Menu | Sree Svadista | Milton Keynes" />
        <meta name="twitter:description" content="Order authentic non-veg South Indian food in Milton Keynes. Slow-cooked mutton curries, village-style chicken, and bold Andhra recipes." />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" />
      </Helmet>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ height: 'min(58vh, 460px)' }}>
        <img
          src="https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=1280"
          alt="Sree Svadista"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.92) 0%, rgba(92,0,24,0.8) 50%, rgba(128,0,32,0.6) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-end md:items-center pb-8 md:pb-0"
          style={{ paddingTop: 'calc(32px + 68px)' }}>
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={18} className="text-red-300" />
              <span className="text-xs uppercase tracking-[0.25em] text-red-200 font-medium">Non-Vegetarian</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Authentic Non-Veg South Indian &amp; Andhra Food in Milton Keynes
            </h1>
            <p className="text-lg text-red-100 leading-relaxed mb-1">Bold. Rustic. Uncompromising.</p>
            <p className="text-sm text-red-200 leading-relaxed max-w-md">
              Starters, biryanis, rich curries and egg specials. Slow-cooked with Andhra soul.
            </p>
          </div>
        </div>
      </section>

      {/* Anchor for tab scroll */}
      <div id="section-tabs-anchor" />
      {/* Sticky tabs */}
      <div id="section-tabs" className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8"
        style={{ backgroundColor: '#FDF5E6', borderBottom: '1px solid rgba(128,0,32,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => { selectTab(tab); setSearch(''); const anchor = document.getElementById('section-tabs-anchor'); if (anchor) { const top = anchor.getBoundingClientRect().top + window.scrollY - 106; window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); } }}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: activeTab === tab ? '#800020' : 'transparent',
                  color: activeTab === tab ? 'white' : '#374151',
                }}>
                {tab}
              </button>
            ))}
          </div>
          <div className="relative flex-shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-7 pr-7 py-1.5 rounded-full text-xs border outline-none focus:ring-2 w-32 md:w-44"
              style={{ borderColor: 'rgba(128,0,32,0.3)', backgroundColor: 'white', color: '#374151' }} />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={11} /></button>}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {!loading && <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} dishes</p>}
          {!loading && SECTION_MESSAGES[activeTab] && !search && (
            <div className="mb-8 -mt-2 text-center">
              <div className="inline-flex items-center gap-3 max-w-full">
                <div className="w-8 sm:w-16 h-px flex-shrink-0" style={{ background: 'linear-gradient(to right, transparent, #800020)' }} />
                <p className="text-sm italic" style={{ color: '#800020', fontFamily: "'Playfair Display', serif", letterSpacing: '0.01em', lineHeight: '1.6' }}>
                  {SECTION_MESSAGES[activeTab].icon}&ensp;{SECTION_MESSAGES[activeTab].text}
                </p>
                <div className="w-8 sm:w-16 h-px flex-shrink-0" style={{ background: 'linear-gradient(to left, transparent, #800020)' }} />
              </div>
            </div>
          )}
          {loading ? (
            <MenuLoader color="#800020" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(dish => (
                <Link key={dish.id} to={`/item/${dish.id}`} onClick={e => e.target.closest('button') && e.preventDefault()}>
                  <div className="rounded-xl overflow-hidden bg-white group transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
                    style={{ boxShadow: '0 4px 20px rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.08)' }}>
                    <div className="relative h-44 overflow-hidden">
                      {dish.image
                        ? <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#FFF5F5' }}><span style={{ fontSize: '32px' }}>🌶️</span></div>
                      }
                      {dish.tag && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: 'rgba(128,0,32,0.85)' }}>{dish.tag}</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col h-[200px]">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm leading-snug" style={{ color: '#800020' }}>{dish.name}</h3>
                          {dish.spice_level > 0 && <SpiceBar level={dish.spice_level} />}
                        </div>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: '#800020' }}>{fmt(dish.price)}</span>
                      </div>
                      {dish.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2 flex-1">{dish.description}</p>
                      )}
                      {dish.avg_rating > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={11} className="fill-[#F4C430] text-[#F4C430]" />
                          <span className="text-xs font-semibold" style={{ color: '#2D2422' }}>{dish.avg_rating.toFixed(1)}</span>
                          {dish.review_count > 0 && <span className="text-[10px] text-gray-400">({dish.review_count})</span>}
                        </div>
                      )}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart({ id: dish.id, name: dish.name, price: dish.price, image: dish.image, category: dish.category }); }}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: '#800020' }}>
                        <ShoppingCart size={13} /> Add to Basket
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">{search ? `No results for "${search}"` : 'No items in this category yet.'}</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Svadista;
