import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Droplets, Search, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import MenuLoader from '../../components/MenuLoader';
import api from '../../api';

const fmt = (p) => `£${parseFloat(p).toFixed(2)}`;

const Drinks = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/menu?category=drinks&available=true')
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? [...items].sort((a, b) => a.name.localeCompare(b.name)).filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
    : [...items].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(50vh, 420px)' }}>
        <img
          src="https://images.unsplash.com/photo-1553909489-cd47e0907980?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Drinks"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(126,34,206,0.92) 0%, rgba(109,40,217,0.8) 50%, rgba(126,34,206,0.6) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={18} className="text-purple-300" />
              <span className="text-xs uppercase tracking-[0.25em] text-purple-200 font-medium">Refreshments</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Juices & Soft Drinks
            </h1>
            <p className="text-lg text-purple-100 leading-relaxed mb-1">Fresh juices, lassis & refreshing beverages.</p>
            <p className="text-sm text-purple-200 leading-relaxed max-w-md">
              Cool down with freshly pressed juices, creamy lassis, soft drinks and our signature masala buttermilk.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky search bar */}
      <div className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8"
        style={{ backgroundColor: '#FAF5FF', borderBottom: '1px solid rgba(126,34,206,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="max-w-7xl mx-auto flex justify-end">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drinks…"
              className="pl-7 pr-7 py-1.5 rounded-full text-xs border outline-none focus:ring-2 w-48 md:w-64"
              style={{ borderColor: 'rgba(126,34,206,0.3)', backgroundColor: 'white', color: '#374151' }} />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={11} /></button>}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {!loading && <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} beverages</p>}
          {loading ? (
            <MenuLoader color="#7E22CE" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(drink => (
                <Link key={drink.id} to={`/item/${drink.id}`} onClick={e => e.target.closest('button') && e.preventDefault()}>
                  <div className="rounded-xl overflow-hidden bg-white group transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
                    style={{ boxShadow: '0 4px 20px rgba(126,34,206,0.08)', border: '1px solid rgba(126,34,206,0.08)' }}>
                    <div className="relative h-44 overflow-hidden">
                      {drink.image
                        ? <img src={drink.image} alt={drink.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center bg-purple-50"><Droplets size={32} className="text-purple-200" /></div>
                      }
                      {drink.featured && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: 'rgba(126,34,206,0.85)' }}>{drink.tag || 'Popular'}</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col h-[200px]">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-sm leading-snug" style={{ color: '#6B21A8' }}>{drink.name}</h3>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: '#7E22CE' }}>{fmt(drink.price)}</span>
                      </div>
                      {drink.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 flex-1">{drink.description}</p>
                      )}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart({ id: drink.id, name: drink.name, price: drink.price, image: drink.image, category: drink.category }); }}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: '#7E22CE' }}>
                        <ShoppingCart size={13} /> Add to Basket
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">{search ? `No results for "${search}"` : 'No beverages yet.'}</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Drinks;
