import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import MenuLoader from '../../components/MenuLoader';
import api from '../../api';

const fmt = (p) => `£${parseFloat(p).toFixed(2)}`;

const RagiSpecials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/menu?category=ragiSpecials&available=true')
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(50vh, 420px)' }}>
        <img
          src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Ragi Specials"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(92,36,6,0.92) 0%, rgba(120,53,15,0.8) 50%, rgba(92,36,6,0.6) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <Leaf size={18} className="text-amber-300" />
              <span className="text-xs uppercase tracking-[0.25em] text-amber-200 font-medium">Traditional & Nutritious</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ragi Specials
            </h1>
            <p className="text-lg text-amber-100 leading-relaxed mb-1">Ancient grain. Timeless nourishment.</p>
            <p className="text-sm text-amber-200 leading-relaxed max-w-md">
              Pearl millet the way it was always meant to be — Ragi Sangati, malts and buttermilk rooted in Telugu tradition.
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {!loading && <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{items.length} items</p>}
          {loading ? (
            <MenuLoader color="#92400E" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...items].sort((a, b) => a.name.localeCompare(b.name)).map(dish => (
                <Link key={dish.id} to={`/item/${dish.id}`} onClick={e => e.target.closest('button') && e.preventDefault()}>
                  <div className="rounded-xl overflow-hidden bg-white group transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
                    style={{ boxShadow: '0 4px 20px rgba(92,36,6,0.08)', border: '1px solid rgba(92,36,6,0.08)' }}>
                    <div className="relative h-44 overflow-hidden">
                      {dish.image
                        ? <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center bg-amber-50"><Leaf size={32} className="text-amber-200" /></div>
                      }
                      {dish.is_veg && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: 'rgba(22,101,52,0.85)' }}>Veg</span>
                      )}
                      {dish.tag && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: 'rgba(92,36,6,0.85)' }}>{dish.tag}</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col h-[200px]">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-sm leading-snug" style={{ color: '#5C2406' }}>{dish.name}</h3>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: '#92400E' }}>{fmt(dish.price)}</span>
                      </div>
                      {dish.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 flex-1">{dish.description}</p>
                      )}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart({ id: dish.id, name: dish.name, price: dish.price, image: dish.image, category: dish.category }); }}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: '#92400E' }}>
                        <ShoppingCart size={13} /> Add to Basket
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RagiSpecials;
