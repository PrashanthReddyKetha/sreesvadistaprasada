import React, { useEffect, Suspense } from "react";
import api from "./api";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import WhatsAppButton from "./components/layout/WhatsAppButton";
import CartToast from "./components/CartToast";
import CartDrawer from "./components/CartDrawer";
import AuthModal from "./components/AuthModal";
const Home = React.lazy(() => import('./pages/Home'));
const OurStory = React.lazy(() => import('./pages/OurStory'));
const Svadista = React.lazy(() => import('./pages/menu/Svadista'));
const Prasada = React.lazy(() => import('./pages/menu/Prasada'));
const Menu = React.lazy(() => import('./pages/menu/Menu'));
const Subscriptions = React.lazy(() => import('./pages/Subscriptions'));
const Catering = React.lazy(() => import('./pages/Catering'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Breakfast = React.lazy(() => import('./pages/menu/Breakfast'));
const Snacks = React.lazy(() => import('./pages/menu/Snacks'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Gallery = React.lazy(() => import('./pages/Gallery'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ItemDetail = React.lazy(() => import('./pages/ItemDetail'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const StreetFood = React.lazy(() => import('./pages/menu/StreetFood'));
const RagiSpecials = React.lazy(() => import('./pages/menu/RagiSpecials'));
const Drinks = React.lazy(() => import('./pages/menu/Drinks'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndServices = React.lazy(() => import('./pages/TermsAndServices'));
const Edinburgh = React.lazy(() => import('./pages/Edinburgh'));
const Glasgow = React.lazy(() => import('./pages/Glasgow'));

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "placeholder";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

const MENU_PATHS = ['/svadista', '/prasada', '/menu', '/breakfast', '/street-food', '/ragi-specials', '/drinks'];

function TakeawayNudge() {
  const { pathname } = useLocation();
  const { cartCount, setCartOpen } = useCart();
  if (!MENU_PATHS.includes(pathname) || cartCount === 0) return null;
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 shadow-2xl"
      style={{ backgroundColor: '#F4C430', borderTop: '2px solid rgba(184,134,11,0.4)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-tight" style={{ color: '#800020' }}>
          🛵 Collect &amp; save 10% on your order
        </p>
        <p className="text-[11px] leading-tight" style={{ color: '#92400E' }}>
          Choose collection at checkout
        </p>
      </div>
      <button
        onClick={() => setCartOpen(true)}
        className="ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
        style={{ backgroundColor: '#800020', color: '#F4C430' }}
      >
        View Cart →
      </button>
    </div>
  );
}

// Warmup ping — fires silently on app load so the Render backend
// starts waking up before the user clicks anything.
function BackendWarmup() {
  useEffect(() => {
    api.get('/health').catch(() => {});
  }, []);
  return null;
}

function App() {
  return (
    <HelmetProvider>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AuthProvider>
    <CartProvider>
      <div className="App">
        <BrowserRouter>
          <BackendWarmup />
          <ScrollToTop />
          <Header />
          <CartDrawer />
          <AuthModal />
          <TakeawayNudge />
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF7' }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(128,0,32,0.2)', borderTopColor: '#800020' }} />
                <p className="text-sm font-medium" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>Loading…</p>
              </div>
            </div>
          }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/story" element={<OurStory />} />
            <Route path="/svadista" element={<Svadista />} />
            <Route path="/prasada" element={<Prasada />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/breakfast" element={<Breakfast />} />
            <Route path="/snacks" element={<Snacks />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/catering" element={<Catering />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/item/:itemId" element={<ItemDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/street-food" element={<StreetFood />} />
            <Route path="/ragi-specials" element={<RagiSpecials />} />
            <Route path="/drinks" element={<Drinks />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndServices />} />
            <Route path="/edinburgh" element={<Edinburgh />} />
            <Route path="/glasgow" element={<Glasgow />} />
          </Routes>
          </Suspense>
          <Footer />
          <WhatsAppButton />
          <CartToast />
        </BrowserRouter>
      </div>
    </CartProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
    </HelmetProvider>
  );
}

export default App;
