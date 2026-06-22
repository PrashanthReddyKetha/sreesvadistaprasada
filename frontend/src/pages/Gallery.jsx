import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { galleryImages as galleryFallback } from '../data/mockData';
import api from '../api';

const categories = ['All', 'Kitchen', 'Svadista', 'Prasada', 'Breakfast', 'Snacks'];

const Gallery = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [galleryImages, setGalleryImages] = useState(galleryFallback);

  useEffect(() => {
    api.get('/content/gallery')
      .then(res => { if (res.data?.length) setGalleryImages(res.data); })
      .catch(() => { /* keep fallback */ });
  }, []);

  const filtered = activeFilter === 'All'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeFilter);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <Helmet>
        <title>Food Gallery | Sree Svadista Prasada — Authentic South Indian Milton Keynes</title>
        <meta name="description" content="Browse our gallery of authentic South Indian dishes, kitchen moments and food photography from Sree Svadista Prasada, Milton Keynes." />
        <link rel="canonical" href="https://sreesvadistaprasada.com/gallery" />
        <meta property="og:title" content="Food Gallery | Sree Svadista Prasada — Authentic South Indian Milton Keynes" />
        <meta property="og:description" content="Browse our gallery of authentic South Indian dishes, kitchen moments and food photography from Sree Svadista Prasada, Milton Keynes." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sreesvadistaprasada.com/gallery" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" />
        <meta property="og:site_name" content="Sree Svadista Prasada" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Food Gallery | Sree Svadista Prasada — Authentic South Indian Milton Keynes" />
        <meta name="twitter:description" content="Browse our gallery of authentic South Indian dishes, kitchen moments and food photography from Sree Svadista Prasada, Milton Keynes." />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80" />
      </Helmet>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(35vh, 280px)' }}>
        <div className="absolute inset-0" style={{ backgroundColor: '#800020' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: '#F4C430' }} />
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              The Kitchens. The Food. The Love.
            </h1>
            <p className="text-base text-gray-200 leading-relaxed">Every photo is from our kitchen. Shot on real days, real meals. This is exactly what arrives at your door.</p>
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
              onClick={() => { setActiveFilter(cat); const anchor = document.getElementById('section-tabs-anchor'); if (anchor) { const top = anchor.getBoundingClientRect().top + window.scrollY - 106; window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); } }}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === cat ? 'text-white' : 'text-gray-600 hover:bg-[#800020]/10'
              }`}
              style={activeFilter === cat ? { backgroundColor: '#800020' } : {}}
              data-testid={`gallery-filter-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Image Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setLightboxIdx(idx)}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                data-testid={`gallery-image-${img.id}`}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIdx(null)}
          data-testid="gallery-lightbox"
        >
          <button
            className="absolute top-4 right-4 text-white text-xl font-light w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            onClick={() => setLightboxIdx(null)}
            data-testid="lightbox-close"
          >&times;</button>
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl hover:bg-white/10 transition-colors"
            >‹</button>
          )}
          {lightboxIdx < filtered.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl hover:bg-white/10 transition-colors"
            >›</button>
          )}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIdx + 1} / {filtered.length}
          </div>
          <img
            src={filtered[lightboxIdx]?.src}
            alt={filtered[lightboxIdx]?.alt}
            className="max-w-full max-h-[80vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium text-center">
            {filtered[lightboxIdx]?.alt}
          </p>
        </div>
      )}
    </div>
  );
};

export default Gallery;
