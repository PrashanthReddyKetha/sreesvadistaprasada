'use client';
import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { faqData } from '@/data/mockData';

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaq = searchQuery.trim()
    ? faqData.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) || item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.items.length > 0)
    : faqData;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(35vh, 280px)' }}>
        <div className="absolute inset-0" style={{ backgroundColor: '#800020' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: '#F4C430' }} />
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Frequently Asked Questions
            </h1>
            <p className="text-base text-gray-200 leading-relaxed">Everything you need to know about ordering, subscriptions, and more.</p>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="py-6 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE', borderBottom: '1px solid rgba(128,0,32,0.1)' }}>
        <div className="max-w-3xl mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a question..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors"
            data-testid="faq-search"
          />
        </div>
      </div>

      {/* FAQ Content */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          {filteredFaq.length === 0 && (
            <p className="text-center text-gray-500 py-8">No questions match your search. Try different keywords.</p>
          )}
          {filteredFaq.map((cat, catIdx) => (
            <div key={cat.category} className="mb-10" data-testid={`faq-category-${catIdx}`}>
              <h2 className="text-xl font-bold mb-4 pb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020', borderBottom: '2px solid rgba(244,196,48,0.3)' }}>
                {cat.category}
              </h2>
              <div className="space-y-2">
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = openItems[key];
                  return (
                    <div key={itemIdx} className="rounded-lg bg-white overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <button
                        onClick={() => toggleItem(catIdx, itemIdx)}
                        className="w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors duration-200 hover:bg-gray-50"
                        data-testid={`faq-q-${catIdx}-${itemIdx}`}
                      >
                        <span className="text-sm font-semibold pr-4" style={{ color: '#2D2422' }}>{item.q}</span>
                        <ChevronDown
                          size={18}
                          className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                          style={{ color: '#800020' }}
                        />
                      </button>
                      <div
                        className="px-4 md:px-5 pb-4 md:pb-5"
                        style={{ display: isOpen ? 'block' : 'none' }}
                      >
                        <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions CTA */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Still Have Questions?
          </h2>
          <p className="text-sm text-gray-600 mb-6">We're always happy to help. Reach out to us anytime.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="https://wa.me/447307119962" target="_blank" rel="noopener noreferrer">
              <button className="px-6 py-3 text-sm font-semibold text-white rounded-sm transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#25D366' }} data-testid="faq-whatsapp-btn">
                WhatsApp Us
              </button>
            </a>
            <a href="tel:+447307119962">
              <button className="btn-outlined" data-testid="faq-call-btn">
                Call Us
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
