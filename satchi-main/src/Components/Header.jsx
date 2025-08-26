import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const [showHeader, setShowHeader] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // 1. Get the full user object from the context
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // 2. Define which roles are considered "admin" roles
  const adminRoles = [
    "Super Admin", "Event Admin", "Sub Event Admin", 
    "Event Manager", "Sub Event Manager", "Sub Sub Event Manager"
  ];

  // 3. Check if the current user's role is in the admin list
  const isAdmin = user && adminRoles.includes(user.role);

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Events", path: "/events" },
    // 4. Conditionally add the Admin link based on the isAdmin check
    ...(isAdmin ? [{ label: "Admin", path: "/admin" }] : []),
    ...(isAuthenticated
      ? [{ label: "Profile", path: "/profile" }]
      : [{ label: "Login", path: "/login" }]),
  ];

  useEffect(() => {
    const checkHeroVisible = () => {
      const hero = document.getElementById("hero");
      if (location.pathname !== "/") {
        setShowHeader(true);
      } else if (hero) {
        const rect = hero.getBoundingClientRect();
        setShowHeader(rect.bottom <= 50);
      } else {
        setShowHeader(true);
      }
    };

    checkHeroVisible();
    window.addEventListener("scroll", checkHeroVisible);
    return () => window.removeEventListener("scroll", checkHeroVisible);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {showHeader && (
        <motion.header
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div
            className="w-[90%] max-w-7xl mx-auto mt-6 rounded-full px-6 py-3 
                       backdrop-blur-md bg-white/5 border border-white/10 
                       text-white shadow-xl flex items-center justify-between"
          >
            <a href="/">
              <img src="/images/Satchi_main_logo.png" alt="Satchi Logo" className="h-8" />
            </a>
            
            {/* Desktop Menu */}
            <ul className="hidden lg:flex items-center gap-4 text-sm font-medium">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `px-4 py-1 rounded-full transition cursor-pointer ${
                        isActive
                          ? "bg-accent text-deepBlue font-semibold"
                          : "hover:bg-accent/30 hover:text-accent"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
              {isAuthenticated && (
                <li>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-1 rounded-full transition cursor-pointer hover:bg-red-500/30 hover:text-red-400"
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-xl"
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Mobile Dropdown */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-[90%] max-w-7xl mx-auto mt-2 lg:hidden bg-black/90 backdrop-blur-md p-4 rounded-xl space-y-2 text-sm shadow-xl border border-white/10"
              >
                {menuItems.map((item) => (
                   <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 rounded hover:bg-accent/30 hover:text-accent font-semibold"
                    >
                      {item.label}
                    </NavLink>
                ))}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 rounded hover:bg-red-500/30 hover:text-red-400 font-semibold"
                  >
                    Logout
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Header;
