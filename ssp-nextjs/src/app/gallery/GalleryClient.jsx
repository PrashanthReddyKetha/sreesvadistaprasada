'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useKitchen } from '@/context/KitchenContext';

// Where to go from the photos (owner, 10 Nov 2026)
const PLACES = [
  { name: 'Breakfast', href: '/breakfast', line: 'Idli, dosa, vada, poori — mornings done right' },
  { name: 'Prasada', href: '/prasada', line: 'Pure veg, cooked with devotion' },
  { name: 'Svadista', href: '/svadista', line: 'Biryanis, curries and Andhra heat' },
  { name: 'Dabba Wala', href: '/subscriptions', line: 'A hot lunch, Monday to Friday, at home or at work' },
];

/**
 * Gallery = every LIVE menu item's photo, passed in from the server page —
 * nothing curated, nothing stock, nothing hidden. Each photo links through
 * to its dish page from the lightbox.
 */
const Gallery = ({ dishImages = [] }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const kitchen = useKitchen();
  const dabbaSoon = kitchen.loaded && !kitchen.dabbaOpen;

  const allImages = dishImages;

  // A fresh random order for every visitor and every reload. The page is built once and
  // shared, so the shuffle happens in the browser; until it has, the grid shows empty
  // tiles, so nobody sees the photos jump from one order to another.
  const [shuffled, setShuffled] = useState(null);
  useEffect(() => {
    const pool = [...dishImages];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setShuffled(pool);
  }, [dishImages]);

  // Filters follow whatever categories actually have photos
  const categories = useMemo(() => {
    const present = [...new Set(allImages.map(i => i.category))];
    const order = ['Svadista', 'Prasada', 'Breakfast', 'Street Food', 'Ragi Specials', 'Drinks', "Lucky's Pantry"];
    return ['All', ...order.filter(c => present.includes(c)), ...present.filter(c => !order.includes(c))];
  }, [allImages]);

  const ordered = shuffled || [];
  const filtered = activeFilter === 'All'
    ? ordered
    : ordered.filter(img => img.category === activeFilter);

  const current = lightboxIdx !== null ? filtered[lightboxIdx] : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] pb-6 relative overflow-hidden" style={{ minHeight: 'min(35vh, 280px)' }}>
        <div className="absolute inset-0" style={{ backgroundColor: '#800020' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: '#F4C430' }} />
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Gallery
            </h1>
            <p className="text-base text-gray-200 leading-relaxed">
              South Indian food photos from our Milton Keynes kitchen — every dish on the menu, {allImages.length} photos and counting.
            </p>
            <nav aria-label="Back to the menu" className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm" data-testid="gallery-back-links">
              {PLACES.map(pl => (
                <Link key={pl.href} href={pl.href} className="font-semibold underline underline-offset-4 decoration-1 hover:decoration-2" style={{ color: '#F4C430' }}>
                  {pl.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Anchor for tab scroll */}
      <div id="section-tabs-anchor" />
      {/* Filter */}
      <div id="section-tabs" className="sticky top-[calc(32px+4rem)] md:top-[calc(32px+5rem)] z-30 py-3 px-4 md:px-8" style={{ backgroundColor: '#FDFBF7', borderBottom: '1px solid rgba(128,0,32,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} data-testid="gallery-filters">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveFilter(cat); setLightboxIdx(null); const anchor = document.getElementById('section-tabs-anchor'); if (anchor) { const top = anchor.getBoundingClientRect().top + window.scrollY - 106; window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); } }}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === cat ? 'text-white' : 'text-gray-600 hover:bg-[#800020]/10'
              }`}
              style={activeFilter === cat ? { backgroundColor: '#800020' } : {}}
              data-testid={`gallery-filter-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Image Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" data-testid="gallery-grid">
            {shuffled === null && Array.from({ length: 8 }).map((_, i) => (
              <div key={`placeholder-${i}`} className="aspect-square rounded-lg" style={{ backgroundColor: '#F3EDE2' }} aria-hidden="true" />
            ))}
            {filtered.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setLightboxIdx(idx)}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                data-testid={`gallery-image-${img.id}`}
              >
                <Image fill loading="lazy" src={img.src} alt={img.alt} className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                  <p className="text-white text-xs font-medium p-3 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {img.alt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Where next */}
      <section className="pb-16 px-4 md:px-8" data-testid="gallery-where-next">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Hungry yet?
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: '#5C4B47' }}>Every photo here comes from one of these — pick where to start.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PLACES.map(pl => (
              <Link key={pl.href} href={pl.href} className="group rounded-xl bg-white px-4 py-4 transition-shadow hover:shadow-md"
                style={{ border: '1px solid rgba(128,0,32,0.12)' }}>
                <span className="flex items-center gap-2 text-base font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                  {pl.name}
                  {pl.href === '/subscriptions' && dabbaSoon && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(244,196,48,0.25)', color: '#8B6914', fontFamily: 'inherit' }}>Soon</span>
                  )}
                </span>
                <span className="block text-xs mt-1" style={{ color: '#5C4B47' }}>{pl.line}</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold mt-2" style={{ color: '#8B6914' }}>
                  {pl.href === '/subscriptions' && dabbaSoon ? 'Be the first to know' : 'Take a look'}
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIdx(null)}
          data-testid="gallery-lightbox"
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl font-light w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            onClick={() => setLightboxIdx(null)}
            data-testid="lightbox-close"
          >
            &times;
          </button>
          <img loading="lazy" decoding="async"
            src={current.src}
            alt={current.alt}
            className="max-w-full max-h-[78vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-white text-sm font-medium">{current.alt}</p>
            {current.href && (
              <Link href={current.href}
                className="inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                View this dish →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
