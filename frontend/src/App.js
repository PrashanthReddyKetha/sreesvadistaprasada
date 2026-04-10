import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <AuthProvider>
    <CartProvider>
      <div className="App">
        <BrowserRouter>
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Footer />
          <WhatsAppButton />
          <CartToast />
        </BrowserRouter>
      </div>
    </CartProvider>
    </AuthProvider>
  );
}

export default App;
