import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
    "SUPERADMIN", "Super Admin", "EVENTADMIN", "Event Admin", "SUBEVENTADMIN", "Sub Event Admin", "EVENTMANAGER", "Event Manager", 
    "SUBEVENTMANAGER", "Sub Event Manager", "SUBSUBEVENTMANAGER", "Sub Sub Event Manager", "COORDINATOR", "Coordinator"
  ];

  // 3. Check if the current user's role is in the admin list
  const isAdmin = user && adminRoles.includes(user.role);

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Events", path: "/events" },
    { label: "Evaluate", path: "/evaluate" },
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

  // SVG Icons to avoid external dependencies
  const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  );

  const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <AnimatePresence>
      {showHeader && (
        <motion.header
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-50 font-body"
        >
          <div
            className="w-[95%] max-w-7xl mx-auto mt-4 rounded-2xl px-6 py-3 
                       backdrop-blur-lg bg-white/80 border border-gray-200/90
                       text-gray-800 shadow-md flex items-center justify-between"
          >
            <a href="/">
              <img src="/images/Satchi_main_logo.png" alt="Satchi Logo" className="h-8" />
            </a>
            
            {/* Desktop Menu */}
            <ul className="hidden lg:flex items-center gap-2 text-sm font-semibold">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg transition-colors duration-300 ${
                        isActive
                          ? "bg-[#ff6a3c] text-white shadow-sm"
                          : "hover:bg-orange-100/70 text-gray-600"
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
                    className="px-4 py-2 rounded-lg transition-colors duration-300 hover:bg-red-100/70 text-gray-600 hover:text-red-500"
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-gray-600"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

          {/* Mobile Dropdown */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="w-[95%] max-w-7xl mx-auto mt-2 lg:hidden bg-white/95 backdrop-blur-lg p-4 rounded-xl space-y-2 text-sm shadow-lg border border-gray-200/90"
              >
                {menuItems.map((item) => (
                   <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 rounded-lg hover:bg-orange-100/70 font-semibold text-gray-600"
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
                    className="block w-full text-left px-4 py-2 rounded-lg hover:bg-red-100/70 font-semibold text-red-500"
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

