import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Registration from "./Pages/Registration";
import Signup from "./Pages/Signup";
import Events from "./Pages/Events";
import Admin from "./Pages/Admin";
import ProfilePage from "./Pages/Profile";

const App = () => {
  return (
    <div className="min-h-screen bg-black text-white font-body">
      <Router>
        <Header />
        <main className="max-w-[100%] mx-auto pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="events" element={<Events />} />
            <Route path="admin" element={<Admin />} />
            <Route path="login" element={<Login />} />

            {/* --- UPDATED ROUTES --- */}
            {/* Route for generic registration */}
            <Route path="register" element={<Registration />} />
            {/* Route for registration to a specific event */}
            <Route path="register/:eventId" element={<Registration />} />

            <Route path="signup" element={<Signup />} />
            <Route path="profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
