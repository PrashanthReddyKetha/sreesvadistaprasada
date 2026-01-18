import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Our Story', path: '/story' },
    { name: 'Svadista', path: '/svadista' },
    { name: 'Prasada', path: '/prasada' },
    { name: 'Menu', path: '/menu' },
    { name: 'Subscriptions', path: '/subscriptions' },
    { name: 'Catering', path: '/catering' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#800020' }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl lg:text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sree Svadista Prasada
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-white border-b-2 border-white pb-1'
                    : 'text-gray-200 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Button
              className="bg-white text-gray-900 hover:bg-gray-100 transition-all duration-200 font-semibold"
              onClick={() => alert('Order functionality will be available soon!')}
            >
              Order Now
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-gray-400">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-3 text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-white font-semibold'
                    : 'text-gray-200 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Button
              className="w-full mt-4 bg-white text-gray-900 hover:bg-gray-100"
              onClick={() => {
                setIsMenuOpen(false);
                alert('Order functionality will be available soon!');
              }}
            >
              Order Now
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;