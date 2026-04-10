import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Sun } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api';

const subcategories = ['All', 'Tiffins', 'Snacks'];

const Breakfast = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/menu?category=breakfast&available=true')
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
          src="https://images.unsplash.com/photo-1736239093746-153503352f8d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="South Indian Breakfast"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(184,134,11,0.9) 0%, rgba(244,196,48,0.7) 50%, rgba(184,134,11,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={18} className="text-yellow-200" />
              <span className="text-xs uppercase tracking-[0.25em] text-yellow-100 font-medium">Nostalgic Mornings</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Breakfast
            </h1>
            <p className="text-lg text-white/90 leading-relaxed mb-1">Early morning freshness, soft golden light.</p>
            <p className="text-sm text-white/75 leading-relaxed max-w-md">
              Nostalgic village mornings brought to life. Steam rising from idlis, crispy dosas on banana leaf, and the perfect cup of filter coffee.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky Filter */}
      <div className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8" style={{ backgroundColor: '#FDF5E6', borderBottom: '1px solid rgba(184,134,11,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} data-testid="breakfast-filters">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {subcategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === cat ? 'text-white' : 'text-gray-600 hover:bg-[#B8860B]/10'
              }`}
              style={activeFilter === cat ? { backgroundColor: '#B8860B' } : {}}
              data-testid={`breakfast-filter-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} items</p>
          {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(dish => (
              <div key={dish.id} className="rounded-lg overflow-hidden bg-white card-hover group" style={{ boxShadow: '0 4px 20px rgba(184,134,11,0.06)' }} data-testid={`breakfast-dish-${dish.id}`}>
                <div className="relative h-48 overflow-hidden">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-sm border-2 border-green-500 flex items-center justify-center bg-white/90">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-sm text-xs font-medium text-white" style={{ backgroundColor: '#B8860B' }}>
                    {dish.subcategory}
                  </span>
                </div>
                <div className="p-5">
                  <Link to={`/item/${dish.id}`} className="hover:underline">
                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>{dish.name}</h3>
                  </Link>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{dish.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold" style={{ color: '#B8860B' }}>£{dish.price.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <Link to={`/item/${dish.id}`} className="text-xs font-semibold px-3 py-1.5 rounded-sm" style={{ color:'#B8860B', border:'1px solid #B8860B' }}>Details</Link>
                      <button onClick={() => addToCart({ ...dish, price: `£${dish.price.toFixed(2)}` })} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-sm transition-all duration-200 hover:shadow-md" style={{ backgroundColor: '#B8860B' }} data-testid={`breakfast-add-${dish.id}`}>
                        <ShoppingCart size={13} /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Accompaniments note */}
      <section className="py-12 px-4 md:px-8" style={{ backgroundColor: '#FDF5E6' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Every Tiffin Comes With
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {['Sambar', 'Coconut Chutney', 'Tomato Chutney', 'Podi with Ghee'].map(item => (
              <span key={item} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(184,134,11,0.1)', color: '#B8860B' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#800020' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Start Your Morning Right
          </h2>
          <p className="text-gray-200 mb-8 leading-relaxed">Add breakfast to your Dabba Wala subscription.</p>
          <Link to="/subscriptions">
            <button className="px-8 py-3.5 text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#F4C430', color: '#2D2422' }} data-testid="breakfast-subscribe-cta">
              Subscribe Now <ArrowRight size={16} className="inline ml-2" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Breakfast;
