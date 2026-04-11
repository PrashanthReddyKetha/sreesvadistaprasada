import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import MenuLoader from '../components/MenuLoader';
import api from '../api';

const TABS = ['All', 'Starters', 'Indo-Chinese', 'Egg Specials', 'Curries', 'Biryani'];

const fmt = (p) => `£${parseFloat(p).toFixed(2)}`;

function SpiceBar({ level }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4].map(i => (
        <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: i <= level ? '#800020' : '#e5e7eb' }} />
      ))}
    </div>
  );
}

const Svadista = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/menu?category=nonVeg&available=true')
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'All' ? items : items.filter(i => i.subcategory === activeTab);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ height: 'min(58vh, 460px)' }}>
        <img
          src="https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
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
              Sree Svadista
            </h1>
            <p className="text-lg text-red-100 leading-relaxed mb-1">Bold, rustic, village-style.</p>
            <p className="text-sm text-red-200 leading-relaxed max-w-md">
              Starters, biryanis, rich curries and egg specials. Slow-cooked with Andhra soul.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky tabs */}
      <div className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8"
        style={{ backgroundColor: '#FDF5E6', borderBottom: '1px solid rgba(128,0,32,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab ? '#800020' : 'transparent',
                color: activeTab === tab ? 'white' : '#374151',
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {!loading && <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} dishes</p>}
          {loading ? (
            <MenuLoader color="#800020" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(dish => (
                <div key={dish.id} className="rounded-xl overflow-hidden bg-white group transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: '0 4px 20px rgba(128,0,32,0.08)', border: '1px solid rgba(128,0,32,0.08)' }}>
                  <div className="relative h-44 overflow-hidden">
                    {dish.image
                      ? <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#FFF5F5' }}><Flame size={32} className="text-red-200" /></div>
                    }
                    {dish.tag && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: 'rgba(128,0,32,0.85)' }}>{dish.tag}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Link to={`/item/${dish.id}`}>
                        <h3 className="font-bold text-sm leading-snug hover:underline" style={{ color: '#800020' }}>{dish.name}</h3>
                      </Link>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: '#800020' }}>{fmt(dish.price)}</span>
                    </div>
                    {dish.spice_level > 0 && <div className="mb-2"><SpiceBar level={dish.spice_level} /></div>}
                    {dish.description && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{dish.description}</p>
                    )}
                    <button
                      onClick={() => addToCart({ id: dish.id, name: dish.name, price: dish.price, image: dish.image, category: dish.category })}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: '#800020' }}>
                      <ShoppingCart size={13} /> Add to Basket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">No items in this category yet.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Svadista;
