import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaChevronDown, FaFileAlt } from "react-icons/fa";

const menuItems = [
  { label: "Home", path: "/" },
  {label: "Admin", path: "/admin"},
  {label: "Events", path: "/events" },
  {label: "Login", path: "/login"},
  
];

const Header = () => {
  const [showHeader, setShowHeader] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
  const checkHeroVisible = () => {
    const hero = document.getElementById("hero");

    if (location.pathname !== "/") {
      setShowHeader(true);
    } else if (hero) {
      const rect = hero.getBoundingClientRect();
      setShowHeader(rect.bottom <= 50);
    }
  };

  checkHeroVisible();

  window.addEventListener("scroll", checkHeroVisible);
  return () => window.removeEventListener("scroll", checkHeroVisible);
}, [location.pathname]);

  // For mobile, toggles
  const handleDropdownToggle = (idx) => {
    setActiveDropdown(activeDropdown === idx ? null : idx);
    setActiveSubDropdown(null);
  };
  const handleSubDropdownToggle = (idx) => {
    setActiveSubDropdown(activeSubDropdown === idx ? null : idx);
  };

  return (
    <AnimatePresence>
      {showHeader && (
        <motion.header
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5 }}
          className="fixed top-6 left-[5%] -translate-x-1/2 z-50 w-[90%]
            rounded-full px-6 py-3 backdrop-blur-md bg-white/5 
            border border-white/10 text-white shadow-xl"
        >
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <img src="/images/Satchi_main_logo.png" alt="Satchi Logo" className="h-8" />

            {/* Desktop Menu */}
            <ul className="hidden lg:flex items-center gap-4 text-sm font-medium">
              {menuItems.map((item, idx) =>
                item.dropdown ? (
                  <li
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(idx)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      type="button"
                      className={`flex items-center gap-2 px-4 py-1 rounded-full transition cursor-pointer
                        ${isActiveLink(item.path) ? "bg-accent text-deepBlue font-semibold" : ""}
                        hover:bg-accent/30 hover:text-accent`}
                      onClick={() =>
                        setActiveDropdown(activeDropdown === idx ? null : idx)
                      }
                      aria-haspopup="true"
                      aria-expanded={activeDropdown === idx}
                    >
                      {item.label}
                      <FaChevronDown
                        className={`ml-1 transition ${activeDropdown === idx ? "rotate-180 text-accent" : "text-white"
                          }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeDropdown === idx && (
                        <motion.ul
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/95 p-3 rounded-xl min-w-[200px] border border-white/10 shadow-xl space-y-2 z-50"
                        >
                          {item.dropdown.map((sub, i2) =>
                            sub.subDropdown ? (
                              <div key={i2}>
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2 text-accent hover:text-white font-medium px-2 py-1 rounded transition"
                                  onClick={() => handleSubDropdownToggle(i2)}
                                  aria-haspopup="true"
                                  aria-expanded={activeSubDropdown === i2}
                                >
                                  {sub.label}
                                  <FaChevronDown
                                    className={`ml-1 transition ${activeSubDropdown === i2
                                      ? "rotate-180 text-accent"
                                      : ""
                                      }`}
                                  />
                                </button>
                                <AnimatePresence>
                                  {activeSubDropdown === i2 && (
                                    <motion.ul
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      className="pl-4 space-y-1 mt-1"
                                    >
                                      {sub.subDropdown.map((s, ssi) => (
                                        <NavLink
                                          key={ssi}
                                          to={s.path}
                                          className="block flex items-center gap-2 text-sm rounded px-2 py-1 hover:bg-accent/20 hover:text-accent transition"
                                          onClick={() => {
                                            setActiveDropdown(null);
                                            setActiveSubDropdown(null);
                                          }}
                                        >
                                          {s.icon} {s.label}
                                        </NavLink>
                                      ))}
                                    </motion.ul>
                                  )}
                                </AnimatePresence>
                              </div>
                            ) : sub.scrollTo ? (
                              <button
                                key={i2}
                                className="block px-3 py-1 rounded transition text-sm hover:bg-accent/20 hover:text-accent w-full text-left"
                                onClick={() => handleScrollNavigate(sub.scrollTo)}
                              >
                                {sub.label}
                              </button>
                            ) : (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                className={({ isActive }) =>
                                  `block px-3 py-1 rounded transition text-sm ${isActive
                                    ? "bg-accent/30 text-accent font-semibold"
                                    : "hover:bg-accent/20 hover:text-accent"
                                  }`
                                }
                                onClick={() => {
                                  setActiveDropdown(null);
                                  setActiveSubDropdown(null);
                                }}
                              >
                                {sub.label}
                              </NavLink>
                            )
                          )}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                ) : (
                  <li key={item.label}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `px-4 py-1 rounded-full transition cursor-pointer ${isActive
                          ? "bg-accent text-deepBlue font-semibold"
                          : "hover:bg-accent/30 hover:text-accent"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                )
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
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-4 w-full lg:hidden bg-black/90 backdrop-blur-md p-4 rounded-xl space-y-2 text-sm shadow-xl border border-white/10"
              >
                {menuItems.map((item, idx) =>
                  item.dropdown ? (
                    <div key={item.label}>
                      <button
                        className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-accent/30 hover:text-accent font-semibold"
                        onClick={() => handleDropdownToggle(idx)}
                        aria-haspopup="true"
                        aria-expanded={activeDropdown === idx}
                      >
                        <span>{item.label}</span>
                        <FaChevronDown
                          className={`ml-2 transition ${activeDropdown === idx ? "rotate-180 text-accent" : ""
                            }`}
                        />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === idx && (
                          <motion.ul
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="pl-4 py-1 space-y-1"
                          >
                            {item.dropdown.map((sub, i2) =>
                              sub.subDropdown ? (
                                <div key={i2}>
                                  <button
                                    className="flex items-center justify-between w-full px-2 py-1 rounded hover:bg-accent/20 text-accent font-medium"
                                    onClick={() => handleSubDropdownToggle(i2)}
                                    aria-haspopup="true"
                                    aria-expanded={activeSubDropdown === i2}
                                  >
                                    <span>{sub.label}</span>
                                    <FaChevronDown
                                      className={`ml-2 transition ${activeSubDropdown === i2
                                        ? "rotate-180 text-accent"
                                        : ""
                                        }`}
                                    />
                                  </button>
                                  <AnimatePresence>
                                    {activeSubDropdown === i2 && (
                                      <motion.ul
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="pl-4 py-1 space-y-1"
                                      >
                                        {sub.subDropdown.map((s, ssi) => (
                                          <NavLink
                                            key={ssi}
                                            to={s.path}
                                            className="block flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/20 hover:text-accent"
                                            onClick={() => {
                                              setMobileOpen(false);
                                              setActiveDropdown(null);
                                              setActiveSubDropdown(null);
                                            }}
                                          >
                                            {s.icon} {s.label}
                                          </NavLink>
                                        ))}
                                      </motion.ul>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ) : sub.scrollTo ? (
                                <button
                                  key={i2}
                                  className="block px-2 py-1 rounded hover:bg-accent/20 hover:text-accent w-full text-left"
                                  onClick={() => handleScrollNavigate(sub.scrollTo)}
                                >
                                  {sub.label}
                                </button>
                              ) : (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path}
                                  className="block px-2 py-1 rounded hover:bg-accent/20 hover:text-accent"
                                  onClick={() => {
                                    setMobileOpen(false);
                                    setActiveDropdown(null);
                                    setActiveSubDropdown(null);
                                  }}
                                >
                                  {sub.label}
                                </NavLink>
                              )
                            )}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 rounded hover:bg-accent/30 hover:text-accent font-semibold"
                    >
                      {item.label}
                    </NavLink>
                  )
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Header;
