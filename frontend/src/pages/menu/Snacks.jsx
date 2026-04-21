import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight, Package, Truck, MessageCircle } from 'lucide-react';
import api from '../../api';
import { getCached, setCached } from '../../api/menuCache';
import useTabHistory from '../../hooks/useTabHistory';

const categories = ['All', 'Pickles', 'Podis'];

const Snacks = () => {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const selectTab = useTabHistory(activeFilter, setActiveFilter, 'All');
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

  const filtered = activeFilter === 'All'
    ? allItems
    : allItems.filter(d => d.type === activeFilter);

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
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { selectTab(cat); const anchor = document.getElementById('section-tabs-anchor'); if (anchor) { const top = anchor.getBoundingClientRect().top + window.scrollY - 106; window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); } }}
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
      </div>

      {/* Products Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} products</p>
          {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(item => (
              <Link key={item.id} to={`/item/${item.id}`} onClick={e => e.target.closest('button') && e.preventDefault()}>
                <div className="rounded-lg overflow-hidden bg-white card-hover group h-full cursor-pointer" style={{ boxShadow: '0 4px 20px rgba(128,0,32,0.06)' }} data-testid={`snack-item-${item.id}`}>
                  {item.image && (
                    <div className="relative h-40 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <span className="absolute top-3 left-3 px-2 py-1 rounded-sm text-xs font-medium text-white" style={{ backgroundColor: '#800020' }}>
                        {item.type}
                      </span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col h-[180px]">
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
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">{item.description}</p>
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
          {!loading && filtered.length === 0 && <p className="text-center text-gray-500 py-12">No products in this category yet.</p>}
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
          <Link to="/contact">
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
