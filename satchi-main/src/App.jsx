import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Registration from "./Pages/Registration";
import About from "./Components/AboutUsSection"
import Events from "./Pages/Events";

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
        <main className="max-w-[100%] mx-auto pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="events" element = {<Events/>} />
            <Route path="about" element = {<About/>} />
            <Route path="login" element = {<Login/>} />
            <Route path="register" element = {<Registration/>} />

          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
