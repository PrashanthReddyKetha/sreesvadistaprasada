import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api';

const subcategories = ['All', 'Rice', 'Prasadam Specials', 'Curries'];

const Prasada = () => {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([
      api.get('/menu?category=prasada&available=true'),
      api.get('/menu?category=veg&available=true'),
    ]).then(([prasada, veg]) => {
      setAllItems([...prasada.data, ...veg.data]);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeFilter === 'All'
    ? allItems
    : allItems.filter(d => d.subcategory === activeFilter);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(50vh, 420px)' }}>
        <img
          src="https://images.unsplash.com/photo-1742281257687-092746ad6021?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Sree Prasada"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(74,124,89,0.92) 0%, rgba(227,168,87,0.7) 50%, rgba(74,124,89,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <Leaf size={18} className="text-green-300" />
              <span className="text-xs uppercase tracking-[0.25em] text-green-200 font-medium">Pure Vegetarian</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sree Prasada
            </h1>
            <p className="text-lg text-gray-100 leading-relaxed mb-1">Divine, sattvic, temple-style.</p>
            <p className="text-sm text-gray-200 leading-relaxed max-w-md">
              100% pure vegetarian. Separate kitchen, separate utensils, complete devotion. Perfect for poojas, vratam days, and those seeking sattvic food.
            </p>
          </div>
        </div>
      </section>

      {/* Purity Promise Banner */}
      <div className="py-4 px-4 md:px-8 text-center" style={{ backgroundColor: '#F9F6EE', borderBottom: '1px solid rgba(74,124,89,0.15)' }}>
        <div className="flex items-center justify-center gap-6 flex-wrap text-sm" style={{ color: '#4A7C59' }}>
          {['Separate Kitchen', 'Different Utensils', 'Pure Oils', 'Temple-Style Purity'].map(p => (
            <span key={p} className="flex items-center gap-1.5 font-medium">
              <Sparkles size={14} /> {p}
            </span>
          ))}
        </div>
      </div>

      {/* Sticky Filter */}
      <div className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE', borderBottom: '1px solid rgba(74,124,89,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} data-testid="prasada-filters">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {subcategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === cat ? 'text-white' : 'text-gray-600 hover:bg-[#4A7C59]/10'
              }`}
              style={activeFilter === cat ? { backgroundColor: '#4A7C59' } : {}}
              data-testid={`prasada-filter-${cat.toLowerCase().replace(/\s/g, '-')}`}
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
              <div key={dish.id} className="rounded-lg overflow-hidden bg-white card-hover group" style={{ boxShadow: '0 4px 20px rgba(74,124,89,0.06)' }} data-testid={`prasada-dish-${dish.id}`}>
                <div className="relative h-48 overflow-hidden">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-sm border-2 border-green-500 flex items-center justify-center bg-white/90">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-sm text-xs font-medium text-white" style={{ backgroundColor: '#4A7C59' }}>
                    {dish.subcategory}
                  </span>
                </div>
                <div className="p-5">
                  {dish.spice_level === 0 ? (
                    <span className="text-xs font-medium mb-2 inline-block" style={{ color: '#4A7C59' }}>Mild & Pure</span>
                  ) : (
                    <div className="flex items-center gap-1 mb-2">
                      {Array(dish.spice_level).fill(0).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4A7C59' }} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{dish.spice_level <= 1 ? 'Mild' : 'Medium'}</span>
                    </div>
                  )}
                  <Link to={`/item/${dish.id}`} className="hover:underline">
                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>{dish.name}</h3>
                  </Link>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{dish.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold" style={{ color: '#4A7C59' }}>£{dish.price.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <Link to={`/item/${dish.id}`} className="text-xs font-semibold px-3 py-1.5 rounded-sm" style={{ color:'#4A7C59', border:'1px solid #4A7C59' }}>Details</Link>
                      <button onClick={() => addToCart({ ...dish, price: `£${dish.price.toFixed(2)}` })} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-sm transition-all duration-200 hover:shadow-md" style={{ backgroundColor: '#4A7C59' }} data-testid={`prasada-add-${dish.id}`}>
                        <ShoppingCart size={13} /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
          {!loading && filtered.length === 0 && <p className="text-center text-gray-500 py-12">No dishes found in this category.</p>}
        </div>
      </section>

      {/* Sacred Occasions */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles size={36} className="mx-auto mb-4" style={{ color: '#E3A857' }} />
          <h2 className="text-3xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Ideal for Sacred Occasions
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Our prasada menu is perfect for poojas, vratam days, temple offerings, housewarming ceremonies, and any occasion where you need food prepared with complete purity and devotion.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#4A7C59' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Experience Pure, Divine Food
          </h2>
          <p className="text-gray-200 mb-8 leading-relaxed">Subscribe to the Prasada Dabba for daily pure-veg homely meals.</p>
          <Link to="/subscriptions">
            <button className="px-8 py-3.5 text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#F4C430', color: '#2D2422' }} data-testid="prasada-subscribe-cta">
              Start Your Subscription <ArrowRight size={16} className="inline ml-2" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Prasada;
