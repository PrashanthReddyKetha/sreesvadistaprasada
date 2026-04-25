'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Instagram, ArrowRight } from 'lucide-react';
import api from '@/api';

const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post('/enquiries/newsletter', { email });
    } catch { /* already subscribed or error — still show success */ }
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer style={{ backgroundColor: '#2D2422', color: '#FDFBF7' }}>
      {/* Help line */}
      <div style={{ backgroundColor: '#25D366' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <WhatsAppIcon size={14} />
          <p className="text-xs md:text-sm text-white">
            Questions about orders, subscriptions, payments, or anything on the site?
          </p>
          <a
            href="https://wa.me/447307119962?text=Hi,%20I%20have%20a%20question."
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs md:text-sm font-bold text-white underline"
          >
            Message us on WhatsApp — we'll reply right away.
          </a>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                A letter from the kitchen
              </h3>
              <p className="text-sm" style={{ color: '#A09890' }}>
                This week's menu, festival specials, and what's simmering on the stove — once a week, never noise.
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full md:w-auto" data-testid="newsletter-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-sm text-sm text-gray-800 focus:outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                required
                data-testid="newsletter-email"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-sm text-sm font-semibold transition-all duration-200 hover:shadow-md whitespace-nowrap"
                style={{ backgroundColor: '#F4C430', color: '#2D2422' }}
                data-testid="newsletter-submit"
              >
                {subscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sree Svadista Prasada
            </h3>
            <span className="text-xs italic block mb-4" style={{ fontFamily: "'Playfair Display', serif", color: '#F4C430' }}>
              Taste for your heart · memories on a plate
            </span>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#A09890' }}>
              Grandmother's recipes, slow tadkas, and the patient kind of love that fills a house with aroma. Cooked in Milton Keynes. Carried to Edinburgh &amp; Glasgow. Sent across the UK in small, careful jars.
            </p>
            <p className="text-sm italic" style={{ color: '#F4C430' }}>
              "Cooked with care. Served with love."
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { name: 'Our Story', path: '/story' },
                { name: 'Full Menu', path: '/menu' },
                { name: 'Prasada (Pure Veg)', path: '/prasada' },
                { name: 'Svadista (Non-Veg)', path: '/svadista' },
                { name: 'Subscriptions', path: '/subscriptions' },
                { name: 'Gallery', path: '/gallery' },
                { name: 'FAQ', path: '/faq' },
              ].map((link) => (
                <li key={link.path + link.name}>
                  <Link
                    href={link.path}
                    className="text-sm transition-colors duration-200 hover:text-white"
                    style={{ color: '#A09890' }}
                    data-testid={`footer-link-${link.name.toLowerCase().replace(/[\s()]/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-base font-semibold mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { name: 'Daily Meal Subscriptions', path: '/subscriptions' },
                { name: 'Weekly & Monthly Plans', path: '/subscriptions' },
                { name: 'Corporate Catering', path: '/catering' },
                { name: 'Temple Prasada Catering', path: '/catering' },
                { name: 'Hot, Sweet & Pickles', path: '/snacks' },
                { name: 'Event Catering', path: '/catering' },
              ].map((svc) => (
                <li key={svc.name}>
                  <Link
                    href={svc.path}
                    className="transition-colors duration-200 hover:text-white"
                    style={{ color: '#A09890' }}
                  >
                    {svc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Areas */}
          <div>
            <h4 className="text-base font-semibold mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Delivery Areas
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { name: 'Milton Keynes', path: '/milton-keynes' },
                { name: 'Edinburgh', path: '/edinburgh' },
                { name: 'Glasgow', path: '/glasgow' },
              ].map((city) => (
                <li key={city.path}>
                  <Link
                    href={city.path}
                    className="transition-colors duration-200 hover:text-white"
                    style={{ color: '#A09890' }}
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <p className="text-xs" style={{ color: '#A09890' }}>
                  Snacks & pickles ship UK-wide
                </p>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base font-semibold mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Get in Touch
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 flex-shrink-0" style={{ color: '#F4C430' }} />
                <p className="text-sm" style={{ color: '#A09890' }}>
                  <strong className="text-white">Milton Keynes</strong> (Main), Edinburgh & Glasgow
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="flex-shrink-0" style={{ color: '#F4C430' }} />
                <a
                  href="tel:+447307119962"
                  className="text-sm transition-colors duration-200 hover:text-white md:pointer-events-none md:cursor-default"
                  style={{ color: '#A09890' }}
                >
                  +44 73 0711 9962
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="flex-shrink-0" style={{ color: '#F4C430' }} />
                <a
                  href="mailto:info@sreesvadistaprasada.com"
                  className="text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: '#A09890' }}
                >
                  info@sreesvadistaprasada.com
                </a>
              </div>
            </div>

            {/* Social */}
            <div className="mt-5">
              <h5 className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#F4C430' }}>Follow Us</h5>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/sreesvadistaprasada/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-[#800020]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#A09890' }}
                  aria-label="Instagram"
                  data-testid="footer-social-instagram"
                >
                  <Instagram size={16} />
                </a>
                <a
                  href="https://wa.me/447307119962"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-[#25D366]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#A09890' }}
                  aria-label="WhatsApp"
                  data-testid="footer-social-whatsapp"
                >
                  <WhatsAppIcon size={16} />
                </a>
                <a
                  href="mailto:info@sreesvadistaprasada.com"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-[#EA4335]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#A09890' }}
                  aria-label="Email us"
                  data-testid="footer-social-email"
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: '#A09890' }}>
            &copy; 2026 Sree Svadista Prasada. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/contact" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#A09890' }}>Contact Us</Link>
            <Link href="/faq" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#A09890' }}>FAQ</Link>
            <Link href="/privacy-policy" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#A09890' }}>Privacy Policy</Link>
            <Link href="/terms" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#A09890' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
