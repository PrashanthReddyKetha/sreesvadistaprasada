'use client';
import React, { useState } from 'react';
import { Users, Briefcase, Heart, Calendar, ArrowRight, Phone, Star, Sparkles } from 'lucide-react';
import api from '@/api';

const Catering = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', eventType: '', eventDate: '', guests: '', foodType: '', message: ''
  });
  const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/enquiries/catering', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        event_type: formData.eventType,
        event_date: formData.eventDate,
        guest_count: parseInt(formData.guests, 10),
        food_preference: formData.foodType,
        additional_details: formData.message,
      });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', eventType: '', eventDate: '', guests: '', foodType: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(50vh, 420px)' }}>
        <img
          src="https://images.unsplash.com/photo-1652250406978-622a4d19e7e3?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Catering Services"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(128,0,32,0.92) 0%, rgba(128,0,32,0.7) 50%, rgba(128,0,32,0.5) 100%)' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: '#F4C430' }} />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Catering & Events
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed" data-testid="catering-hero-subtitle">
              Poojas, Weddings, Corporate Events & More. Authentic South Indian food for your special occasions.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>What we offer</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Our Catering Services
            </h2>
            <div className="section-divider mt-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Functions & Events */}
            <div className="rounded-lg p-8 bg-white card-hover" style={{ boxShadow: '0 4px 20px rgba(128,0,32,0.06)' }} data-testid="catering-functions">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                <Heart size={24} style={{ color: '#800020' }} />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Functions & Events
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Perfect for all your special occasions:</p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-4">
                {['Temple Poojas & Religious Ceremonies', 'Weddings & Receptions', 'Housewarming (Griha Pravesh)', 'Birthday Parties & Anniversaries', 'Vratam & Satyanarayan Puja', 'Thread Ceremony (Upanayanam)'].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Star size={12} style={{ color: '#F4C430' }} /> {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 leading-relaxed">Available in Milton Keynes, Edinburgh & Glasgow. Both pure veg and mixed menus.</p>
            </div>

            {/* Corporate Dabba */}
            <div className="rounded-lg p-8 bg-white card-hover" style={{ boxShadow: '0 4px 20px rgba(128,0,32,0.06)' }} data-testid="catering-corporate">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                <Briefcase size={24} style={{ color: '#800020' }} />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Corporate Dabba Wala
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">Daily tiffin service for offices and professionals:</p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-4">
                {['Fixed Corporate Packages (Weekly/Monthly)', 'Monday to Friday Lunch Delivery', 'Bulk Orders for Office Teams', 'On-Time Delivery to Office Premises', 'Healthy, Homely, Consistent Quality', 'Flexible Menu Options'].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Star size={12} style={{ color: '#F4C430' }} /> {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 leading-relaxed">Keep your team energized with nutritious, home-style meals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>The difference</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Why Choose Our Catering?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: 'Any Size Event', desc: 'From 10 to 500+ guests' },
              { icon: Sparkles, title: 'Pure Prasada', desc: 'Temple-style purity for sacred events' },
              { icon: Calendar, title: 'Flexible Menus', desc: 'Customized to your preferences' },
              { icon: Briefcase, title: 'Professional', desc: 'Experienced team, timely delivery' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                  <Icon size={26} style={{ color: '#800020' }} />
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: '#800020' }}>{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>Get started</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Request a Quote
            </h2>
            <p className="text-sm text-gray-500 mt-2">Fill out the form and we'll respond within 24 hours.</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 md:p-10 space-y-5" style={{ boxShadow: '0 4px 24px rgba(128,0,32,0.08)' }} data-testid="catering-form">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Your Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" data-testid="catering-name" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" data-testid="catering-email" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Phone *</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" data-testid="catering-phone" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Event Type *</label>
                <select required value={formData.eventType} onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors bg-white" data-testid="catering-event-type">
                  <option value="">Select event type</option>
                  <option value="pooja">Temple Pooja / Religious Ceremony</option>
                  <option value="wedding">Wedding / Reception</option>
                  <option value="housewarming">Housewarming</option>
                  <option value="birthday">Birthday / Anniversary</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Event Date *</label>
                <input type="date" required value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" data-testid="catering-date" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Guests *</label>
                <input type="number" required placeholder="e.g. 50" value={formData.guests} onChange={(e) => setFormData({...formData, guests: e.target.value})}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" data-testid="catering-guests" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Food Preference *</label>
                <select required value={formData.foodType} onChange={(e) => setFormData({...formData, foodType: e.target.value})}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors bg-white" data-testid="catering-food-type">
                  <option value="">Select</option>
                  <option value="pure-veg">Pure Veg (Prasada)</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="mixed">Mixed (Veg & Non-Veg)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Additional Details</label>
              <textarea rows={4} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Menu preferences, dietary requirements..."
                className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors resize-none" data-testid="catering-message" />
            </div>
            {status === 'success' && (
              <div className="p-4 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F0FFF4', color: '#4A7C59' }}>
                Thank you! We'll contact you within 24 hours.
              </div>
            )}
            {status === 'error' && (
              <div className="p-4 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                Something went wrong. Please try again.
              </div>
            )}
            <button type="submit" disabled={status === 'loading'} className="w-full py-3.5 text-sm font-semibold tracking-wide uppercase text-white rounded-sm transition-all duration-300 hover:shadow-lg disabled:opacity-60" style={{ backgroundColor: '#800020' }} data-testid="catering-submit-btn">
              {status === 'loading' ? 'Submitting...' : 'Submit Enquiry'}
            </button>
          </form>
        </div>
      </section>

      {/* Call CTA */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#800020' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Phone size={32} className="mx-auto mb-4" style={{ color: '#F4C430' }} />
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Need Immediate Assistance?
          </h2>
          <p className="text-gray-300 mb-6">Call us directly to discuss your catering needs.</p>
          <a href="tel:+447307119962">
            <button className="px-8 py-3.5 text-sm font-semibold tracking-wide uppercase rounded-sm transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#F4C430', color: '#2D2422' }} data-testid="catering-call-btn">
              Call +44 73 0711 9962
            </button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Catering;
