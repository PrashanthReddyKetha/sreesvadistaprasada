import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShoppingCart, ArrowRight, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import MenuLoader from '../../components/MenuLoader';
import api from '../../api';
import { getCached, setCached } from '../../api/menuCache';

const categories = [
  { id: 'all', name: 'All Dishes' },
  { id: 'nonVeg', name: 'Non-Veg' },
  { id: 'veg', name: 'Vegetarian' },
  { id: 'prasada', name: 'Prasada' },
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'streetFood', name: 'Street Food' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'naivedyam', name: '🪔 Naivedyam' },
  { id: 'pickles', name: 'Pickles' },
  { id: 'podis', name: 'Podis' },
];

const Menu = () => {
  const [allDishes, setAllDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const key = 'all';
    const cached = getCached(key);
    if (cached) { setAllDishes(cached); setLoading(false); }
    api.get('/menu?available=true')
      .then(res => { setAllDishes(res.data); setCached(key, res.data); })
      .catch(err => console.error('Failed to load menu:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = allDishes
    .filter(dish => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'naivedyam') return dish.category === 'veg' && dish.subcategory === 'Rice Specials';
      return dish.category === activeCategory;
    })
    .filter(dish =>
      !searchQuery.trim() ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(45vh, 360px)' }}>
        <img
          src="https://images.unsplash.com/photo-1742281258189-3b933879867a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Our Full Menu"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.92) 0%, rgba(128,0,32,0.7) 50%, rgba(128,0,32,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Full Menu
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed max-w-md">
              Explore everything — from bold Svadista curries to divine Prasada offerings, breakfast tiffins to grandmother's pickles.
            </p>
          </div>
        </div>
      </section>

      {/* Anchor for tab scroll */}
      <div id="section-tabs-anchor" />
      {/* Sticky Filter + Search */}
      <div id="section-tabs" className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8" style={{ backgroundColor: '#FDFBF7', borderBottom: '1px solid rgba(128,0,32,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} data-testid="menu-filters">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors"
                data-testid="menu-search"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); const anchor = document.getElementById('section-tabs-anchor'); if (anchor) { const top = anchor.getBoundingClientRect().top + window.scrollY - 106; window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); } }}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.id ? 'text-white' : 'text-gray-600 hover:bg-[#800020]/10'
              }`}
              style={activeCategory === cat.id ? { backgroundColor: '#800020' } : {}}
              data-testid={`menu-filter-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm" style={{ color: '#5C4B47' }}>{filtered.length} items</p>
            <div className="flex gap-4">
              <Link to="/svadista" className="text-xs font-semibold transition-colors duration-200 hover:underline" style={{ color: '#8B3A3A' }}>Svadista Menu</Link>
              <Link to="/prasada" className="text-xs font-semibold transition-colors duration-200 hover:underline" style={{ color: '#4A7C59' }}>Prasada Menu</Link>
              <Link to="/breakfast" className="text-xs font-semibold transition-colors duration-200 hover:underline" style={{ color: '#B8860B' }}>Breakfast</Link>
            </div>
          </div>

          {loading ? (
            <MenuLoader color="#800020" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((dish) => (
                <Link key={dish.id} to={`/item/${dish.id}`} onClick={e => e.target.closest('button') && e.preventDefault()} data-testid={`menu-dish-${dish.id}`}>
                  <div className="rounded-lg overflow-hidden bg-white card-hover group h-full cursor-pointer" style={{ boxShadow: '0 4px 20px rgba(128,0,32,0.06)' }}>
                    {dish.image && (
                      <div className="relative h-40 overflow-hidden">
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white/90"
                          style={{ borderColor: dish.is_veg ? '#22c55e' : '#ef4444' }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dish.is_veg ? '#22c55e' : '#ef4444' }} />
                        </div>
                      </div>
                    )}
                    <div className="p-4 flex flex-col h-[180px]">
                      {dish.spice_level > 0 && (
                        <div className="flex gap-0.5 mb-1.5">
                          {Array(dish.spice_level).fill(0).map((_, i) => (
                            <Flame key={i} size={10} className="text-red-500 fill-red-500" />
                          ))}
                        </div>
                      )}
                      <h3 className="text-sm font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>{dish.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-2 flex-1">{dish.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold" style={{ color: '#800020' }}>£{dish.price.toFixed(2)}</span>
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart({ ...dish, price: `£${dish.price.toFixed(2)}` }); }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-sm" style={{ backgroundColor: '#800020' }} data-testid={`menu-add-${dish.id}`}>
                          <ShoppingCart size={11} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && <p className="text-center text-gray-500 py-12">No items found.</p>}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#800020' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Want This Daily?
          </h2>
          <p className="text-gray-200 mb-8 leading-relaxed">Subscribe to the Dabba Wala service for wholesome meals delivered to your door.</p>
          <Link to="/subscriptions">
            <button className="px-8 py-3.5 text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#F4C430', color: '#2D2422' }} data-testid="menu-subscribe-cta">
              Start Your Subscription <ArrowRight size={16} className="inline ml-2" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Menu;
