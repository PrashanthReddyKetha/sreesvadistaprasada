import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
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

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Header />
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
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
