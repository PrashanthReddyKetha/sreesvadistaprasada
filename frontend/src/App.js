import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story" element={<div className="pt-32 px-4 text-center"><h1 className="text-4xl font-bold">Our Story - Coming Soon</h1></div>} />
          <Route path="/svadista" element={<div className="pt-32 px-4 text-center"><h1 className="text-4xl font-bold">Svadista - Coming Soon</h1></div>} />
          <Route path="/prasada" element={<div className="pt-32 px-4 text-center"><h1 className="text-4xl font-bold">Prasada - Coming Soon</h1></div>} />
          <Route path="/menu" element={<div className="pt-32 px-4 text-center"><h1 className="text-4xl font-bold">Menu - Coming Soon</h1></div>} />
          <Route path="/subscriptions" element={<div className="pt-32 px-4 text-center"><h1 className="text-4xl font-bold">Subscriptions - Coming Soon</h1></div>} />
          <Route path="/catering" element={<div className="pt-32 px-4 text-center"><h1 className="text-4xl font-bold">Catering - Coming Soon</h1></div>} />
          <Route path="/contact" element={<div className="pt-32 px-4 text-center"><h1 className="text-4xl font-bold">Contact - Coming Soon</h1></div>} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
