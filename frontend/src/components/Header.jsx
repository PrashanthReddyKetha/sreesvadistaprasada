import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LogoMark from './LogoMark';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount, setCartOpen } = useCart();
  const { user, logout, setAuthOpen } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
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
        { name: 'Street Food', path: '/street-food' },
        { name: 'Drinks', path: '/drinks' },
        { name: 'Full Menu', path: '/menu' },
      ]
    },
    { name: 'Hot, Sweet & Pickles', path: '/snacks' },
    { name: 'Dabba Wala', path: '/subscriptions' },
    { name: 'Our Story', path: '/story' },
    { name: 'Catering', path: '/catering' },
    {
      name: 'More',
      dropdown: [
        { name: 'Gallery', path: '/gallery' },
        { name: 'FAQ', path: '/faq' },
        { name: 'Contact', path: '/contact' },
      ]
    },
  ];

  return (
    <>
      {/* Notification Bar */}
      <div
        data-testid="notification-bar"
        className="fixed top-0 left-0 right-0 z-50 h-8 flex items-center justify-center px-4 text-center text-xs sm:text-sm font-medium tracking-wide overflow-hidden"
        style={{ backgroundColor: '#800020', color: '#FDFBF7' }}
      >
        <span className="hidden sm:inline">Swagatam! Now serving authentic hot meals in Milton Keynes, Edinburgh &amp; Glasgow &nbsp;|&nbsp; Take away available &nbsp;|&nbsp; Free Delivery over £30</span>
        <span className="sm:hidden whitespace-nowrap">Take away available &nbsp;|&nbsp; Free Delivery £30+</span>
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
          top: '32px',
          backgroundColor: isScrolled ? 'rgba(253, 251, 247, 0.95)' : '#FDFBF7',
          borderBottom: '1px solid rgba(244, 196, 48, 0.2)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-[68px] md:h-20">
            {/* Logo */}
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} className="flex items-center gap-2 group" data-testid="logo-link">
              <LogoMark size={73} className="w-14 h-14 md:w-[73px] md:h-[73px] object-contain flex-shrink-0" />
              <div className="flex flex-col">
                <h1
                  className="text-lg md:text-2xl font-bold tracking-tight leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
                >
                  Sree Svadista Prasada
                </h1>
                <span className="hidden md:block text-xs tracking-[0.2em] uppercase" style={{ color: '#B8860B' }}>
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
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: '#F4C430' }}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
                {user ? (
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' ? (
                      <Link to="/admin" className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#800020]/10" style={{ color: '#800020', border: '1px solid rgba(128,0,32,0.3)' }}>
                        Admin Panel
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold hidden xl:block max-w-[100px] truncate" style={{ color: '#800020' }}>{user.name}</span>
                    )}
                    <Link to="/dashboard" className="p-2 rounded-full transition-colors duration-200 hover:bg-[#800020]/5" style={{ color: '#800020' }} data-testid="dashboard-button" title="My Account">
                      <User size={20} />
                    </Link>
                  </div>
                ) : (
                  <button onClick={() => setAuthOpen(true)} className="p-2 rounded-full transition-colors duration-200 hover:bg-[#800020]/5" data-testid="account-button" style={{ color: '#800020' }} title="Sign in">
                    <User size={20} />
                  </button>
                )}
              </div>
            </nav>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                className="relative p-2 rounded-full"
                data-testid="mobile-cart-button"
                style={{ color: '#800020' }}
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: '#F4C430' }}
                  >
                    {cartCount}
                  </span>
                )}
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

          {/* Mobile Navigation — flat list, no dropdowns */}
          {isMenuOpen && (
            <nav
              className="lg:hidden pb-6 border-t"
              style={{ borderColor: 'rgba(244, 196, 48, 0.2)' }}
              data-testid="mobile-nav"
            >
              <Link to="/" className="block py-3 text-sm font-medium border-b" style={{ color: isActive('/') ? '#800020' : '#5C4B47', borderColor: 'rgba(244,196,48,0.1)' }}>Home</Link>

              <p className="pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B8860B' }}>Menus</p>
              <Link to="/prasada"    className="block py-2.5 text-sm font-medium" style={{ color: isActive('/prasada')    ? '#800020' : '#5C4B47' }}>Prasada (Pure Veg)</Link>
              <Link to="/svadista"   className="block py-2.5 text-sm font-medium" style={{ color: isActive('/svadista')   ? '#800020' : '#5C4B47' }}>Svadista (Non-Veg)</Link>
              <Link to="/breakfast"  className="block py-2.5 text-sm font-medium" style={{ color: isActive('/breakfast')  ? '#800020' : '#5C4B47' }}>Breakfast</Link>
              <Link to="/street-food" className="block py-2.5 text-sm font-medium" style={{ color: isActive('/street-food') ? '#800020' : '#5C4B47' }}>Street Food</Link>
              <Link to="/drinks"     className="block py-2.5 text-sm font-medium" style={{ color: isActive('/drinks')     ? '#800020' : '#5C4B47' }}>Drinks</Link>
              <Link to="/menu"       className="block py-2.5 text-sm font-medium border-b pb-4" style={{ color: isActive('/menu') ? '#800020' : '#5C4B47', borderColor: 'rgba(244,196,48,0.1)' }}>Full Menu</Link>

              <Link to="/snacks"        className="block py-3 text-sm font-medium border-b" style={{ color: isActive('/snacks')        ? '#800020' : '#5C4B47', borderColor: 'rgba(244,196,48,0.1)' }}>Hot, Sweet &amp; Pickles</Link>
              <Link to="/subscriptions" className="block py-3 text-sm font-medium border-b" style={{ color: isActive('/subscriptions') ? '#800020' : '#5C4B47', borderColor: 'rgba(244,196,48,0.1)' }}>Dabba Wala</Link>
              <Link to="/story"         className="block py-3 text-sm font-medium border-b" style={{ color: isActive('/story')         ? '#800020' : '#5C4B47', borderColor: 'rgba(244,196,48,0.1)' }}>Our Story</Link>
              <Link to="/catering"      className="block py-3 text-sm font-medium border-b" style={{ color: isActive('/catering')      ? '#800020' : '#5C4B47', borderColor: 'rgba(244,196,48,0.1)' }}>Catering</Link>

              <p className="pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B8860B' }}>More</p>
              <Link to="/gallery" className="block py-2.5 text-sm font-medium" style={{ color: isActive('/gallery') ? '#800020' : '#5C4B47' }}>Gallery</Link>
              <Link to="/faq"     className="block py-2.5 text-sm font-medium" style={{ color: isActive('/faq')     ? '#800020' : '#5C4B47' }}>FAQ</Link>
              <Link to="/contact" className="block py-2.5 text-sm font-medium border-b pb-4" style={{ color: isActive('/contact') ? '#800020' : '#5C4B47', borderColor: 'rgba(244,196,48,0.1)' }}>Contact</Link>

              {user ? (
                <div className="mt-3 flex items-center justify-between px-3 py-3 rounded-md" style={{ border: '1px solid rgba(128,0,32,0.2)' }}>
                  <Link to="/dashboard" className="text-sm font-medium" style={{ color: '#800020' }}><User size={14} className="inline mr-1" />{user.name}</Link>
                  <button onClick={logout} className="text-xs font-semibold" style={{ color: '#800020' }}>Sign Out</button>
                </div>
              ) : (
                <button onClick={() => { setIsMenuOpen(false); setAuthOpen(true); }}
                  className="w-full mt-3 py-3 text-sm font-medium rounded-md"
                  style={{ color: '#800020', border: '1px solid rgba(128,0,32,0.2)' }}
                  data-testid="mobile-account-button">
                  <User size={16} className="inline mr-2" />
                  Sign In / Register
                </button>
              )}
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
