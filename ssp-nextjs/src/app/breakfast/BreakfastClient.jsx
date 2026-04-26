'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { buildItemUrl } from '@/lib/itemUrl';
import { ShoppingCart, Sun, Search, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import MenuLoader from '@/components/MenuLoader';
import api from '@/api';
import { getCached, setCached } from '@/api/menuCache';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/itemUrl';

const TABS = ['Idli & Vada', 'Dosas', 'Poori & Others', 'All'];

const fmt = (p) => `£${parseFloat(p).toFixed(2)}`;

function SpiceBar({ level }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array(level).fill(0).map((_, i) => (
        <span key={i} style={{ fontSize: '12px' }}>🌶️</span>
      ))}
    </div>
  );
}

const Breakfast = ({ initialItems = [], initialTab = 'All' }) => {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');

  useEffect(() => { setActiveTab(initialTab); setSearch(''); }, [initialTab]);

  const selectTab = (tab) => {
    if (tab === 'All') router.push('/breakfast');
    else router.push(`/breakfast/${slugify(tab)}`);
  };
  const { addToCart } = useCart();

  useEffect(() => {
    const key = 'breakfast';
    const cached = getCached(key);
    if (cached) { setItems(cached); setLoading(false); }
    api.get('/menu?category=breakfast&available=true')
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
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(50vh, 420px)' }}>
        <img
          src="https://images.unsplash.com/photo-1630383249896-424e482df921?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Breakfast"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(180,101,11,0.92) 0%, rgba(146,64,14,0.8) 50%, rgba(180,101,11,0.6) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={18} className="text-yellow-300" />
              <span className="text-xs uppercase tracking-[0.25em] text-yellow-200 font-medium">Morning Specials</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Breakfast
            </h1>
            <p className="text-lg text-yellow-100 leading-relaxed mb-1">Idlis, dosas, vadas and more.</p>
            <p className="text-sm text-yellow-200 leading-relaxed max-w-md">
              Authentic South Indian tiffins made fresh every morning. Start your day the right way.
            </p>
          </div>
        </div>
      </section>

      {/* About link */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2" style={{ backgroundColor: '#FFFBEB' }}>
        <p className="text-sm" style={{ color: '#5C4B47' }}>
          <a href="/breakfast/about" className="underline underline-offset-2 hover:text-[#800020]">
            The story behind our breakfast →
          </a>
        </p>
      </div>

      {/* Anchor for tab scroll */}
      <div id="section-tabs-anchor" />
      {/* Sticky tabs */}
      <div id="section-tabs" className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8"
        style={{ backgroundColor: '#FFFBEB', borderBottom: '1px solid rgba(180,101,11,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes..."
                className="w-full pl-9 pr-8 py-2 rounded-full text-sm border outline-none transition-colors"
                style={{ borderColor: 'rgba(180,101,11,0.3)', backgroundColor: 'white', color: '#374151' }} />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => selectTab(tab)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: activeTab === tab ? '#B45309' : 'transparent',
                  color: activeTab === tab ? 'white' : '#374151',
                }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {!loading && <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} dishes</p>}
          {loading ? (
            <MenuLoader color="#B45309" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(dish => (
                <Link key={dish.id} href={buildItemUrl(dish)} onClick={e => e.target.closest('button') && e.preventDefault()}>
                  <div className="rounded-xl overflow-hidden bg-white group transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
                    style={{ boxShadow: '0 4px 20px rgba(180,101,11,0.08)', border: '1px solid rgba(180,101,11,0.1)' }}>
                    <div className="relative h-44 overflow-hidden">
                      {dish.image
                        ? <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#FFFBEB' }}><span style={{ fontSize: '32px' }}>🌶️</span></div>
                      }
                      {dish.tag && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: 'rgba(180,101,11,0.85)' }}>{dish.tag}</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col h-[200px]">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm leading-snug" style={{ color: '#92400E' }}>{dish.name}</h3>
                          {dish.spice_level > 0 && <SpiceBar level={dish.spice_level} />}
                        </div>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: '#B45309' }}>{fmt(dish.price)}</span>
                      </div>
                      {dish.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 flex-1">{dish.description}</p>
                      )}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart({ id: dish.id, name: dish.name, price: dish.price, image: dish.image, category: dish.category }); }}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: '#B45309' }}>
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

export default Breakfast;
