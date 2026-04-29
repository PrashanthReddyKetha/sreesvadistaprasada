'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { buildItemUrl } from '@/lib/itemUrl';
import { Flame, ArrowRight, Package, Truck, MessageCircle, Search, X } from 'lucide-react';
import api from '@/api';
import { getCached, setCached } from '@/api/menuCache';

const categories = ['Pickles', 'Podis', 'All'];

const Snacks = ({ initialItems = [], initialTab = 'All' }) => {
  const SK = 'ssp_snacks_tab';
  const [allItems, setAllItems] = useState(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [activeFilter, setActiveFilter] = useState(() => {
    if (typeof window === 'undefined') return initialTab;
    return sessionStorage.getItem(SK) || initialTab;
  });
  const [search, setSearch] = useState('');
  const tabMounted = useRef(false);

  useEffect(() => {
    const isBack = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
    if (!isBack) window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const selectTab = (filter) => { setActiveFilter(filter); sessionStorage.setItem(SK, filter); };

  useEffect(() => {
    if (!tabMounted.current) { tabMounted.current = true; return; }
    const anchor = document.getElementById('section-tabs-anchor');
    if (!anchor) return;
    const headerH = document.querySelector('header')?.offsetHeight ?? 96;
    const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: anchorTop - headerH, behavior: 'smooth' });
  }, [activeFilter]);
  useEffect(() => {
    const key = 'snacks';
    const cached = getCached(key);
    if (cached) { setAllItems(cached); setLoading(false); }
    Promise.all([
      api.get('/menu?category=pickles&available=true'),
      api.get('/menu?category=podis&available=true'),
    ]).then(([pickles, podis]) => {
      const data = [
        ...pickles.data.map(i => ({ ...i, type: 'Pickles' })),
        ...podis.data.map(i => ({ ...i, type: 'Podis' })),
      ];
      setAllItems(data);
      setCached(key, data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const byFilter = activeFilter === 'All'
    ? allItems
    : allItems.filter(d => d.type === activeFilter);

  const filtered = search.trim()
    ? byFilter.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
    : byFilter;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(50vh, 420px)' }}>
        <img
          src="https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Traditional pickles and snacks"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(45,36,34,0.9) 0%, rgba(45,36,34,0.7) 50%, rgba(45,36,34,0.4) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <Package size={18} className="text-yellow-300" />
              <span className="text-xs uppercase tracking-[0.25em] text-yellow-200 font-medium">Ships UK-Wide</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Snacks, Pickles & Podis
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed mb-1">Sending a piece of home across the UK.</p>
            <p className="text-sm text-gray-300 leading-relaxed max-w-md">
              Grandmother's recipes, packed with love. From tangy Gongura to fiery Avakaya — jars of joy delivered to your doorstep anywhere in the UK.
            </p>
          </div>
        </div>
      </section>

      {/* UK-Wide Delivery Banner */}
      <div className="py-3 px-4 md:px-8 text-center" style={{ backgroundColor: '#4A7C59', color: 'white' }}>
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <Truck size={16} />
          <span>Free UK-wide delivery on orders over £25 | Now serving Milton Keynes, Edinburgh & Glasgow</span>
        </div>
      </div>

      {/* Anchor for tab scroll */}
      <div id="section-tabs-anchor" />
      {/* Sticky Filter */}
      <div id="section-tabs" className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8" style={{ backgroundColor: '#FDFBF7', borderBottom: '1px solid rgba(128,0,32,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} data-testid="snacks-filters">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => selectTab(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeFilter === cat ? 'text-white' : 'text-gray-600 hover:bg-[#800020]/10'
                }`}
                style={activeFilter === cat ? { backgroundColor: '#800020' } : {}}
                data-testid={`snacks-filter-${cat.toLowerCase()}`}
              >
                {cat}
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

      {/* Products Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} products</p>
          {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(item => (
              <Link key={item.id} href={buildItemUrl(item)} onClick={e => e.target.closest('button') && e.preventDefault()}>
                <div className="rounded-lg overflow-hidden bg-white card-hover group h-full cursor-pointer" style={{ boxShadow: '0 4px 20px rgba(128,0,32,0.06)' }} data-testid={`snack-item-${item.id}`}>
                  {item.image && (
                    <div className="relative h-40 overflow-hidden">
                      <img key={item.image} src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <span className="absolute top-3 left-3 px-2 py-1 rounded-sm text-xs font-medium text-white" style={{ backgroundColor: '#800020' }}>
                        {item.type}
                      </span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col h-[200px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="text-base font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>{item.name}</h3>
                      {item.spice_level > 0 && (
                        <div className="flex gap-0.5 shrink-0">
                          {Array(item.spice_level).fill(0).map((_, i) => (
                            <Flame key={i} size={11} className="text-red-500 fill-red-500" />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold" style={{ color: '#800020' }}>£{item.price.toFixed(2)}</span>
                      <a href={`https://wa.me/447307119962?text=${encodeURIComponent(`Hi, I'd like to order ${item.name} (£${item.price.toFixed(2)}).`)}`} target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(e.currentTarget.href, '_blank'); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-sm transition-all duration-200 hover:shadow-md" style={{ backgroundColor: '#25D366' }} data-testid={`snack-wa-${item.id}`}>
                        <MessageCircle size={12} /> Order on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )}
          {!loading && filtered.length === 0 && <p className="text-center text-gray-500 py-12">{search ? `No results for "${search}"` : 'No products in this category yet.'}</p>}
        </div>
      </section>

      {/* Gifting Section */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.25em] mb-2" style={{ color: '#B8860B' }}>Perfect for gifting</p>
          <h2 className="text-3xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Send a Piece of Home
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
            Know someone who misses the taste of home? Send them a curated box of authentic pickles, podis, and sweets. We pack with care and deliver across the UK.
          </p>
          <Link href="/contact">
            <button className="btn-outlined" data-testid="gifting-enquiry-btn">
              Enquire About Gift Boxes <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Snacks;
