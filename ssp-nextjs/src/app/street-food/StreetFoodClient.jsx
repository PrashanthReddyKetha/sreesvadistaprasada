'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { buildItemUrl } from '@/lib/itemUrl';
import { ShoppingBag, ShoppingCart, Search, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import MenuLoader from '@/components/MenuLoader';
import api from '@/api';

const fmt = (p) => `£${parseFloat(p).toFixed(2)}`;

const StreetFood = ({ initialItems = [] }) => {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [search, setSearch] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/menu?category=streetFood&available=true')
      .then(r => { setItems(r.data); })
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
          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Street Food"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(30,58,138,0.92) 0%, rgba(29,78,216,0.8) 50%, rgba(30,58,138,0.6) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag size={18} className="text-blue-300" />
              <span className="text-xs uppercase tracking-[0.25em] text-blue-200 font-medium">Fast Food</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Evening Delights
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed mb-1">Quick bites, snacks and evening treats.</p>
            <p className="text-sm text-blue-200 leading-relaxed max-w-md">
              Light snacks, crispy starters and quick bites — the perfect evening indulgence.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky search bar */}
      <div className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8"
        style={{ backgroundColor: '#EFF6FF', borderBottom: '1px solid rgba(30,58,138,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="max-w-7xl mx-auto flex justify-end">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes…"
              className="pl-7 pr-7 py-1.5 rounded-full text-xs border outline-none focus:ring-2 w-48 md:w-64"
              style={{ borderColor: 'rgba(30,58,138,0.3)', backgroundColor: 'white', color: '#374151' }} />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={11} /></button>}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {!loading && <p className="text-sm mb-8" style={{ color: '#5C4B47' }}>{filtered.length} items</p>}
          {loading ? (
            <MenuLoader color="#1D4ED8" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(dish => (
                <Link key={dish.id} href={buildItemUrl(dish)} onClick={e => e.target.closest('button') && e.preventDefault()}>
                  <div className="rounded-xl overflow-hidden bg-white group transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
                    style={{ boxShadow: '0 4px 20px rgba(30,58,138,0.08)', border: '1px solid rgba(30,58,138,0.08)' }}>
                    <div className="relative h-44 overflow-hidden">
                      {dish.image
                        ? <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center bg-blue-50"><ShoppingBag size={32} className="text-blue-200" /></div>
                      }
                      {dish.is_veg && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: 'rgba(22,101,52,0.85)' }}>Veg</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col h-[200px]">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-sm leading-snug" style={{ color: '#1E3A8A' }}>{dish.name}</h3>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: '#1D4ED8' }}>{fmt(dish.price)}</span>
                      </div>
                      {dish.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 flex-1">{dish.description}</p>
                      )}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart({ id: dish.id, name: dish.name, price: dish.price, image: dish.image, category: dish.category }); }}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: '#1D4ED8' }}>
                        <ShoppingCart size={13} /> Add to Basket
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">{search ? `No results for "${search}"` : 'No items yet.'}</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StreetFood;
