import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { scroller } from "react-scroll";

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import Home from "./Pages/Home";

const ScrollToSection = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      setTimeout(() => {
        scroller.scrollTo(location.state.scrollTo, {
          smooth: true,
          duration: 500,
          offset: -80,
        });
      }, 100);
    }
  }, [location]);

  return null;
};



const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); 
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999] text-[#FFAB00]">
        <div className="typewriter mt-3 text-[#FFAB00]">Awakening...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-body">
      <Router>
        <Header />
        <ScrollToSection />
        <main className="max-w-[100%] mx-auto pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
