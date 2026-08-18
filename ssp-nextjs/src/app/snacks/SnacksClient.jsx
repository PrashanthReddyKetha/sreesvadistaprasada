'use client';
import React from 'react';
import { Clock, MessageCircle, Bell, Package, Sparkles } from 'lucide-react';
import { useNotifyMe } from '@/context/NotifyMeContext';
import { WA_BULK } from '@/config/softLaunch';

const HIGHLIGHTS = [
  { icon: '🌶️', title: 'Real Andhra Recipes', text: 'Handmade Gongura, Avakaya, Nalla Karam & more — no shortcuts, no preservatives.' },
  { icon: '📦', title: 'Now In Your City', text: 'No need to have jars carried over from home anymore — made fresh here and delivered to your door.' },
  { icon: '🎁', title: 'Perfect For Gifting & Bulk', text: 'Stocking up for a festival, event or gift box? Bulk orders are handled directly on WhatsApp.' },
];

const Snacks = () => {
  const { openNotifyMe } = useNotifyMe();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(58vh, 500px)' }}>
        <img
          src="https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Traditional handmade Andhra pickles and podis"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(45,36,34,0.94) 0%, rgba(45,36,34,0.78) 50%, rgba(45,36,34,0.45) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(244,196,48,0.15)', border: '1px solid rgba(244,196,48,0.4)' }}>
              <Clock size={14} className="text-yellow-300" />
              <span className="text-xs uppercase tracking-[0.2em] text-yellow-200 font-semibold">Coming Soon · Pre-Orders Opening Soon</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Hot, Sweet &amp; Pickles
            </h1>
            <p className="text-lg text-gray-100 leading-relaxed mb-2">Real taste, like never before.</p>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mb-7">
              No more asking someone to carry jars over from your home country — handmade Andhra pickles, fiery podis and traditional sweets are now coming to your city, made fresh, the way your grandmother made them.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => openNotifyMe('Hot, Sweet & Pickles', 'snacks')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                <Bell size={16} /> Notify Me When It Launches
              </button>
              <a href={WA_BULK} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#25D366' }}>
                <MessageCircle size={16} /> Bulk Orders on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing / value section */}
      <section className="py-16 md:py-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.25em] mb-3 flex items-center justify-center gap-2" style={{ color: '#8B6914' }}>
            <Sparkles size={14} /> Worth the wait
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            The Taste You&rsquo;ve Been Missing — Finally Here
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10 text-base">
            You don&rsquo;t have to order from your home country anymore. Every jar of pickle, every pinch of podi and every bite of sweet is made small-batch, with no preservatives and no shortcuts. We&rsquo;re perfecting the recipes and packaging before launch, so the first jar you open tastes exactly like home — now available right here in your city.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {HIGHLIGHTS.map(f => (
              <div key={f.title} className="rounded-2xl p-6" style={{ backgroundColor: '#F9F6EE', border: '1px solid rgba(128,0,32,0.08)' }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-sm mb-2" style={{ color: '#800020' }}>{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-left" style={{ backgroundColor: '#FEF3C7', border: '1px solid rgba(180,101,11,0.2)' }}>
            <div className="flex items-start gap-3">
              <Package size={22} className="flex-shrink-0 mt-0.5" style={{ color: '#92400E' }} />
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: '#92400E' }}>Planning a bulk order for an event, temple function or gift boxes?</p>
                <p className="text-xs text-gray-600">Bulk requests are handled directly on WhatsApp — message us and we&rsquo;ll sort it out.</p>
              </div>
            </div>
            <a href={WA_BULK} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs text-white whitespace-nowrap transition-all hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}>
              <MessageCircle size={14} /> Message Us on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Snacks;
