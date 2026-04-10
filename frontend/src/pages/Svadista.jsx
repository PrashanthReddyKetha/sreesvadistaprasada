import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShoppingCart, Star, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api';

const subcategories = ['All', 'Starters', 'Curries', 'Biriyanis'];

const Svadista = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/menu?category=nonVeg')
      .then(res => setItems(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeFilter === 'All'
    ? items
    : items.filter(d => d.subcategory === activeFilter);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(50vh, 420px)' }}>
        <img
          src="https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Sree Svadista"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(139,58,58,0.92) 0%, rgba(112,66,20,0.8) 50%, rgba(139,58,58,0.6) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={18} className="text-red-300" />
              <span className="text-xs uppercase tracking-[0.25em] text-red-200 font-medium">Non-Vegetarian</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sree Svadista
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed mb-1">Bold, rustic, village-style.</p>
            <p className="text-sm text-gray-300 leading-relaxed max-w-md">
              For those who grew up on Sunday chicken curry and festival mutton biriyani. Authentic village recipes, slow-cooked to perfection.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky Filter */}
      <div className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8" style={{ backgroundColor: '#FDF5E6', borderBottom: '1px solid rgba(139,58,58,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} data-testid="svadista-filters">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {subcategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === cat ? 'text-white' : 'text-gray-600 hover:bg-[#8B3A3A]/10'
              }`}
              style={activeFilter === cat ? { backgroundColor: '#8B3A3A' } : {}}
              data-testid={`filter-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} dishes</p>
          {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(dish => (
              <div key={dish.id} className="rounded-lg overflow-hidden bg-white card-hover group" style={{ boxShadow: '0 4px 20px rgba(139,58,58,0.06)' }} data-testid={`svadista-dish-${dish.id}`}>
                <div className="relative h-48 overflow-hidden">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-sm border-2 border-red-500 flex items-center justify-center bg-white/90">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-sm text-xs font-medium text-white" style={{ backgroundColor: '#8B3A3A' }}>
                    {dish.subcategory}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {Array(5).fill(0).map((_, i) => (
                        <Flame key={i} size={12} className={i < dish.spice_level ? 'text-red-500 fill-red-500' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {dish.spice_level <= 1 ? 'Mild' : dish.spice_level <= 2 ? 'Medium' : dish.spice_level <= 3 ? 'Spicy' : 'Very Spicy'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>{dish.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{dish.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold" style={{ color: '#8B3A3A' }}>£{dish.price.toFixed(2)}</span>
                    <button onClick={() => addToCart({ ...dish, price: `£${dish.price.toFixed(2)}` })} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-sm transition-all duration-200 hover:shadow-md" style={{ backgroundColor: '#8B3A3A' }} data-testid={`svadista-add-${dish.id}`}>
                      <ShoppingCart size={13} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
          {!loading && filtered.length === 0 && <p className="text-center text-gray-500 py-12">No dishes found in this category.</p>}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#8B3A3A' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Craving Bold Flavors?
          </h2>
          <p className="text-gray-200 mb-8 leading-relaxed">Subscribe to the Svadista Dabba for daily non-veg homely meals.</p>
          <Link to="/subscriptions">
            <button className="px-8 py-3.5 text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#F4C430', color: '#2D2422' }} data-testid="svadista-subscribe-cta">
              Start Your Subscription <ArrowRight size={16} className="inline ml-2" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Svadista;
