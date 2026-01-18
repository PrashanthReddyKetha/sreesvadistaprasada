import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="pt-16 pb-8" style={{ backgroundColor: '#800020', color: 'white' }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* About Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sree Svadista Prasada
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed mb-4">
              Traditional South Indian homely food in the UK. From grandmother's kitchen to your plate – pure, divine, and truly home-style.
            </p>
            <p className="text-sm text-gray-300 italic">
              Food prepared with devotion, just like at home.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/story" className="text-gray-200 hover:text-white text-sm transition-colors duration-200">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-200 hover:text-white text-sm transition-colors duration-200">
                  Full Menu
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="text-gray-200 hover:text-white text-sm transition-colors duration-200">
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link to="/catering" className="text-gray-200 hover:text-white text-sm transition-colors duration-200">
                  Catering Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-200 hover:text-white text-sm transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Our Services</h4>
            <ul className="space-y-2 text-sm text-gray-200">
              <li>Dine-in Restaurant</li>
              <li>Weekly Meal Subscriptions</li>
              <li>Monthly Meal Plans</li>
              <li>Catering for Functions</li>
              <li>Corporate Dabba Wala</li>
              <li>Temple Prasada Catering</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-200">
                  123 High Street, London, UK
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="flex-shrink-0" />
                <p className="text-sm text-gray-200">+44 20 1234 5678</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="flex-shrink-0" />
                <p className="text-sm text-gray-200">info@sreesvadista.co.uk</p>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <h5 className="text-sm font-semibold mb-3">Follow Us</h5>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-200 hover:text-white transition-colors duration-200">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-gray-200 hover:text-white transition-colors duration-200">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-gray-200 hover:text-white transition-colors duration-200">
                  <Twitter size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-400 pt-8 text-center">
          <p className="text-sm text-gray-300">
            © 2025 Sree Svadista Prasada. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;