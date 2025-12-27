import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };

    if (location.pathname === "/") {
      handleScroll();
      window.addEventListener("scroll", handleScroll);

      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setHasScrolled(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const adminRoles = [
    "SUPERADMIN", "Super Admin", "EVENTADMIN", "Event Admin", "SUBEVENTADMIN", "Sub Event Admin", "EVENTMANAGER", "Event Manager", 
    "SUBEVENTMANAGER", "Sub Event Manager", "SUBSUBEVENTMANAGER", "Sub Sub Event Manager", "COORDINATOR", "Coordinator"
  ];

  const isAdmin = user && adminRoles.includes(user.role);

  const menuItems = [
    { label: "Home", path: "/" },
    { label: "Events", path: "/events" },
    ...(isAdmin ? [
      { label: "Admin", path: "/admin" },
      { label: "Evaluation", path: "/evaluate" },
      { label: "Legacy", path: "/legacy" },
    ] : []),
    ...(isAuthenticated
      ? [{ label: "Profile", path: "/profile" }]
      : [{ label: "Login", path: "/login" }]),
  ];

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

  const isTopState = !hasScrolled && location.pathname === "/";

  const headerContainerClasses = isTopState
    ? 'bg-transparent border-none shadow-none'
    : 'backdrop-blur-lg bg-white/80 border border-gray-200/90 shadow-md';

  const navLinkClasses = ({ isActive }) => {
    const baseClasses = "px-4 py-2 rounded-lg transition-colors duration-300";
    if (isActive) {
      return `${baseClasses} bg-[#ff6a3c] text-white shadow-sm`;
    }
    return `${baseClasses} text-gray-600 hover:bg-orange-100/70`;
  };

  const logoutButtonClasses = "px-4 py-2 rounded-lg transition-colors duration-300 hover:bg-red-100/70 text-gray-600 hover:text-red-500";
    
  return (
    <motion.header
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 font-body"
    >
      <div
        className={`w-[95%] max-w-7xl mx-auto mt-4 rounded-2xl px-6 py-3 transition-all duration-300 flex items-center justify-between ${headerContainerClasses}`}
      >
        <a href="/">
          <img 
            src="/images/gyan_main_logo.png" 
            alt="Satchi Logo" 
            className="h-8" 
          />
        </a>
        
        <ul className="hidden lg:flex items-center gap-2 text-sm font-semibold">
          {menuItems.map((item) => (
            <li key={item.label}>
              <NavLink to={item.path} className={navLinkClasses}>
                {item.label}
              </NavLink>
            </li>
          ))}
          {isAuthenticated && (
            <li>
              <button
                onClick={handleLogout}
                className={logoutButtonClasses}
              >
                Logout
              </button>
            </li>
          )}
        </ul>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-gray-600"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

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
  );
};

export default Header;