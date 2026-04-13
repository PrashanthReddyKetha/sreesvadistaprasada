import React, { useEffect } from "react";
import api from "./api";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import CartToast from "./components/CartToast";
import CartDrawer from "./components/CartDrawer";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import OurStory from "./pages/OurStory";
import Svadista from "./pages/Svadista";
import Prasada from "./pages/Prasada";
import Menu from "./pages/Menu";
import Subscriptions from "./pages/Subscriptions";
import Catering from "./pages/Catering";
import Contact from "./pages/Contact";
import Breakfast from "./pages/Breakfast";
import Snacks from "./pages/Snacks";
import FAQ from "./pages/FAQ";
import Gallery from "./pages/Gallery";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import ItemDetail from "./pages/ItemDetail";
import Checkout from "./pages/Checkout";
import StreetFood from "./pages/StreetFood";
import Drinks from "./pages/Drinks";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndServices from "./pages/TermsAndServices";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "placeholder";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname]);
  return null;
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
            <Route path="/drinks" element={<Drinks />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndServices />} />
          </Routes>
          <Footer />
          <WhatsAppButton />
          <CartToast />
        </BrowserRouter>
      </div>
    </CartProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
