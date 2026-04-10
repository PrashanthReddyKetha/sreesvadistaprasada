import React, { useState, useEffect } from 'react';
import { ShoppingCart, Droplets } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api';

const fmt = (p) => `£${parseFloat(p).toFixed(2)}`;

const Drinks = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/menu?category=drinks&available=true')
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
              Drinks
            </h1>
            <p className="text-lg text-purple-100 leading-relaxed mb-1">Fresh juices, lassis & more.</p>
            <p className="text-sm text-purple-200 leading-relaxed max-w-md">
              Cool down with freshly pressed juices, creamy lassis and our signature masala buttermilk.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {!loading && <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{items.length} drinks</p>}
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading…</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(drink => (
                <div key={drink.id} className="rounded-xl overflow-hidden bg-white group transition-all duration-300 hover:-translate-y-1"
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
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-sm leading-snug" style={{ color: '#6B21A8' }}>{drink.name}</h3>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: '#7E22CE' }}>{fmt(drink.price)}</span>
                    </div>
                    {drink.description && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{drink.description}</p>
                    )}
                    <button
                      onClick={() => addToCart({ id: drink.id, name: drink.name, price: drink.price, image: drink.image, category: drink.category })}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: '#7E22CE' }}>
                      <ShoppingCart size={13} /> Add to Basket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Drinks;
