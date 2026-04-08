import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, ChevronDown } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { name: 'Home', path: '/' },
    {
      name: 'Menus',
      dropdown: [
        { name: 'Prasada (Pure Veg)', path: '/prasada' },
        { name: 'Svadista (Non-Veg)', path: '/svadista' },
        { name: 'Breakfast', path: '/breakfast' },
        { name: 'Full Menu', path: '/menu' },
      ]
    },
    { name: 'Snacks & Pickles', path: '/snacks' },
    { name: 'Dabba Wala', path: '/subscriptions' },
    { name: 'Our Story', path: '/story' },
    { name: 'Catering', path: '/catering' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      {/* Notification Bar */}
      <div
        data-testid="notification-bar"
        className="fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium tracking-wide overflow-hidden"
        style={{ backgroundColor: '#800020', color: '#FDFBF7' }}
      >
        <span>Swagatam! Now serving authentic hot meals in Milton Keynes, Edinburgh & Glasgow | Free Delivery over £30</span>
      </div>

      {/* Header */}
      <header
        data-testid="main-header"
        className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'shadow-lg backdrop-blur-xl'
            : ''
        }`}
        style={{
          top: '36px',
          backgroundColor: isScrolled ? 'rgba(253, 251, 247, 0.95)' : '#FDFBF7',
          borderBottom: '1px solid rgba(244, 196, 48, 0.2)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
              <div className="flex flex-col">
                <h1
                  className="text-xl md:text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
                >
                  Sree Svadista Prasada
                </h1>
                <span className="text-xs tracking-[0.2em] uppercase" style={{ color: '#B8860B' }}>
                  Authentic South Indian
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" ref={dropdownRef} data-testid="desktop-nav">
              {navItems.map((item) => (
                item.dropdown ? (
                  <div
                    key={item.name}
                    className="relative dropdown-trigger"
                    onMouseEnter={() => setOpenDropdown(item.name)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200"
                      style={{ color: openDropdown === item.name ? '#800020' : '#5C4B47' }}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {item.name}
                      <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                    <div
                      className={`absolute top-full left-0 mt-1 w-56 rounded-lg shadow-xl border py-2 transition-all duration-200 ${
                        openDropdown === item.name ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                      }`}
                      style={{
                        backgroundColor: '#FDFBF7',
                        borderColor: 'rgba(244, 196, 48, 0.3)'
                      }}
                    >
                      {item.dropdown.map((sub) => (
                        <Link
                          key={sub.path + sub.name}
                          to={sub.path}
                          className="block px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-[#800020]/5"
                          style={{ color: isActive(sub.path) ? '#800020' : '#5C4B47' }}
                          data-testid={`nav-dropdown-${sub.name.toLowerCase().replace(/[\s()]/g, '-')}`}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200"
                    style={{
                      color: isActive(item.path) ? '#800020' : '#5C4B47',
                      backgroundColor: isActive(item.path) ? 'rgba(128, 0, 32, 0.05)' : 'transparent'
                    }}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {item.name}
                  </Link>
                )
              ))}

              {/* Cart & Account */}
              <div className="flex items-center gap-2 ml-3 pl-3 border-l" style={{ borderColor: 'rgba(244, 196, 48, 0.3)' }}>
                <button
                  className="relative p-2 rounded-full transition-colors duration-200 hover:bg-[#800020]/5"
                  data-testid="cart-button"
                  style={{ color: '#800020' }}
                >
                  <ShoppingCart size={20} />
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: '#F4C430' }}
                  >
                    0
                  </span>
                </button>
                <button
                  className="p-2 rounded-full transition-colors duration-200 hover:bg-[#800020]/5"
                  data-testid="account-button"
                  style={{ color: '#800020' }}
                >
                  <User size={20} />
                </button>
              </div>
            </nav>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                className="relative p-2 rounded-full"
                data-testid="mobile-cart-button"
                style={{ color: '#800020' }}
              >
                <ShoppingCart size={20} />
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: '#F4C430' }}
                >
                  0
                </span>
              </button>
              <button
                className="p-2 rounded-md"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                data-testid="mobile-menu-toggle"
                style={{ color: '#800020' }}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav
              className="lg:hidden pb-6 border-t animate-fade-in"
              style={{ borderColor: 'rgba(244, 196, 48, 0.2)' }}
              data-testid="mobile-nav"
            >
              {navItems.map((item) => (
                item.dropdown ? (
                  <div key={item.name}>
                    <button
                      className="flex items-center justify-between w-full py-3 text-sm font-medium"
                      style={{ color: '#5C4B47' }}
                      onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                    >
                      {item.name}
                      <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === item.name && (
                      <div className="pl-4 pb-2 space-y-1">
                        {item.dropdown.map((sub) => (
                          <Link
                            key={sub.path + sub.name}
                            to={sub.path}
                            className="block py-2 text-sm"
                            style={{ color: '#800020' }}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block py-3 text-sm font-medium"
                    style={{ color: isActive(item.path) ? '#800020' : '#5C4B47' }}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              <button
                className="w-full mt-3 py-3 text-sm font-medium rounded-md"
                style={{ color: '#800020', border: '1px solid rgba(128,0,32,0.2)' }}
                data-testid="mobile-account-button"
              >
                <User size={16} className="inline mr-2" />
                My Account
              </button>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
