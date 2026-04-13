import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Instagram, ArrowRight } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Contact = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/enquiries/contact', { ...formData, user_id: user?.id || null });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ height: 'min(40vh, 320px)' }}>
        <div className="absolute inset-0" style={{ backgroundColor: '#800020' }} />
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: '#F4C430' }} />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Get in Touch
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed" data-testid="contact-hero-subtitle">
              Questions, feedback, or just want to say hello? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-10 md:gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>Our details</p>
              <h2 className="text-3xl font-bold tracking-tight mb-8" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Contact Information
              </h2>

              <div className="space-y-6">
                {/* Locations */}
                <div className="flex items-start gap-4 p-5 rounded-lg bg-white" style={{ boxShadow: '0 2px 12px rgba(128,0,32,0.06)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                    <MapPin size={18} style={{ color: '#800020' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2" style={{ color: '#800020' }}>Our Locations</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <strong style={{ color: '#800020' }}>Milton Keynes</strong> (Main Kitchen)<br />
                      Central Milton Keynes, MK9<br /><br />
                      Edinburgh, EH1<br />
                      Glasgow, G1
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-lg bg-white" style={{ boxShadow: '0 2px 12px rgba(128,0,32,0.06)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                    <Phone size={18} style={{ color: '#800020' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2" style={{ color: '#800020' }}>Call Us</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Orders: <a href="tel:+447307119962" className="hover:underline" style={{ color: '#800020' }}>+44 73 0711 9962</a><br />
                      Catering: <a href="tel:+447307119962" className="hover:underline" style={{ color: '#800020' }}>+44 73 0711 9962</a><br />
                      WhatsApp: <a href="https://wa.me/447307119962" className="hover:underline" style={{ color: '#800020' }}>+44 73 0711 9962</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-lg bg-white" style={{ boxShadow: '0 2px 12px rgba(128,0,32,0.06)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                    <Mail size={18} style={{ color: '#800020' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2" style={{ color: '#800020' }}>Email Us</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      General: <a href="mailto:hello@sreesvadista.co.uk" className="hover:underline" style={{ color: '#800020' }}>hello@sreesvadista.co.uk</a><br />
                      Catering: <a href="mailto:catering@sreesvadista.co.uk" className="hover:underline" style={{ color: '#800020' }}>catering@sreesvadista.co.uk</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-lg bg-white" style={{ boxShadow: '0 2px 12px rgba(128,0,32,0.06)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(128,0,32,0.08)' }}>
                    <Clock size={18} style={{ color: '#800020' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2" style={{ color: '#800020' }}>Hours</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Mon – Fri: 11am – 10pm<br />
                      Sat – Sun: 10am – 11pm<br />
                      <span className="text-xs italic" style={{ color: '#B8860B' }}>Delivery available during all hours</span>
                    </p>
                  </div>
                </div>

                {/* Social */}
                <div className="pt-2">
                  <h4 className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#B8860B' }}>Follow Us</h4>
                  <div className="flex gap-3">
                    {[
                      { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/sreesvadistaprasada/' },
                    ].map(({ icon: Icon, label, href }) => (
                      <a key={label} href={href} target={href !== '#' ? '_blank' : undefined} rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-[#800020] hover:text-white" style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }} aria-label={label} data-testid={`contact-social-${label.toLowerCase()}`}>
                        <Icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <p className="text-sm uppercase tracking-[0.25em] mb-3" style={{ color: '#B8860B' }}>Send us a message</p>
              <h2 className="text-3xl font-bold tracking-tight mb-8" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                We'd Love to Hear From You
              </h2>

              <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 md:p-8 space-y-5" style={{ boxShadow: '0 4px 24px rgba(128,0,32,0.08)' }} data-testid="contact-form">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Your Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full name"
                      className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" data-testid="contact-name" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Email *</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="you@example.com"
                      className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" data-testid="contact-email" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Phone</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+44 xxx xxxx xxxx"
                      className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors" data-testid="contact-phone" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Subject</label>
                    <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors bg-white" data-testid="contact-subject">
                      <option value="">Select a topic</option>
                      <option value="order">Order Enquiry</option>
                      <option value="subscription">Subscription Question</option>
                      <option value="catering">Catering Request</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1.5" style={{ color: '#2D2422' }}>Your Message *</label>
                  <textarea required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="How can we help you?"
                    className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#800020] transition-colors resize-none" data-testid="contact-message" />
                </div>
                {status === 'success' && (
                  <div className="p-4 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F0FFF4', color: '#4A7C59' }}>
                    Thank you! We'll get back to you soon.
                  </div>
                )}
                {status === 'error' && (
                  <div className="p-4 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>
                    Something went wrong. Please try again.
                  </div>
                )}
                <button type="submit" disabled={status === 'loading'} className="w-full py-3.5 text-sm font-semibold tracking-wide uppercase text-white rounded-sm transition-all duration-300 hover:shadow-lg disabled:opacity-60" style={{ backgroundColor: '#800020' }} data-testid="contact-submit-btn">
                  {status === 'loading' ? 'Sending...' : <><span>Send Message</span> <ArrowRight size={16} className="inline ml-2" /></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
