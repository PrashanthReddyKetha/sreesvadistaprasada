import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter, ArrowRight } from 'lucide-react';
import api from '../api';

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
      {/* Newsletter */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                Stay Close to Home
              </h3>
              <p className="text-sm" style={{ color: '#A09890' }}>
                Get weekly menus, offers, and festive specials straight to your inbox.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sree Svadista Prasada
            </h3>
            <span className="text-xs tracking-[0.2em] uppercase block mb-4" style={{ color: '#F4C430' }}>
              Authentic South Indian
            </span>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#A09890' }}>
              From grandmother's kitchen to the UK — pure, divine, and truly home-style food. Now proudly serving Milton Keynes, Edinburgh & Glasgow.
            </p>
            <p className="text-sm italic" style={{ color: '#F4C430' }}>
              "Finally, I am home."
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
                    to={link.path}
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
                    to={svc.path}
                    className="transition-colors duration-200 hover:text-white"
                    style={{ color: '#A09890' }}
                  >
                    {svc.name}
                  </Link>
                </li>
              ))}
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
                  href="mailto:info@sreeswadistaprasada.com"
                  className="text-sm transition-colors duration-200 hover:text-white"
                  style={{ color: '#A09890' }}
                >
                  info@sreeswadistaprasada.com
                </a>
              </div>
            </div>

            {/* Social */}
            <div className="mt-5">
              <h5 className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: '#F4C430' }}>Follow Us</h5>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/sreesvadistaprasada/' },
                  { icon: Facebook, label: 'Facebook', href: '#' },
                  { icon: Twitter, label: 'Twitter', href: '#' },
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href !== '#' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-[#800020]"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#A09890' }}
                    aria-label={label}
                    data-testid={`footer-social-${label.toLowerCase()}`}
                  >
                    <Icon size={16} />
                  </a>
                ))}
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
            <Link to="/contact" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#A09890' }}>Contact Us</Link>
            <Link to="/faq" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#A09890' }}>FAQ</Link>
            <Link to="/privacy-policy" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#A09890' }}>Privacy Policy</Link>
            <Link to="/terms" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#A09890' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
