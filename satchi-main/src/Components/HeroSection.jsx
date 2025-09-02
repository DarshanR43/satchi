import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const HeroSection = () => {
  const { isAuthenticated } = useAuth(); // Get the authentication status
  // const isAuthenticated = false; // Placeholder for demonstration

  return (
    <section 
      id="hero" 
      className="relative min-h-screen w-full flex items-center justify-center text-gray-800 overflow-hidden font-body"
    >
      {/* Abstract Gradient Background */}
      <div className="absolute inset-0 bg-amber-50 z-0"></div>
      <div 
            className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0"
            style={{
            maskImage: 'radial-gradient(ellipse at center, transparent 20%, black)'
            }}
      ></div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold mb-6 text-transparent bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.25))]"
        >
          Welcome to SATCHI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-4 text-gray-700 font-medium text-base sm:text-lg leading-relaxed tracking-wide max-w-2xl mx-auto [text-shadow:1px_1px_3px_rgba(255,255,255,0.5)]"
        >
          Join us at the ultimate tech fair! Register now to explore groundbreaking innovations, connect with industry leaders, and secure your spot at this unmissable event.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-10 flex justify-center gap-6 flex-wrap"
        >
          <motion.div
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(255, 106, 60, 0.4)" }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href="/events"
              className="px-8 py-3 rounded-lg text-sm sm:text-base font-semibold tracking-wide 
              bg-[#ff6a3c] text-white
              transition duration-300 cursor-pointer shadow-lg shadow-orange-500/30"
            >
              Explore Events
            </a>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAuthenticated ? (
              <a
                href="/profile"
                className="px-8 py-3 rounded-lg text-sm sm:text-base font-semibold tracking-wide 
                bg-transparent border border-[#df9400] text-[#df9400]
                hover:bg-[#df9400] hover:text-white transition duration-300"
              >
                View Profile
              </a>
            ) : (
              <a
                href="/login"
                className="px-8 py-3 rounded-lg text-sm sm:text-base font-semibold tracking-wide 
                bg-transparent border border-[#df9400] text-[#df9400]
                hover:bg-[#df9400] hover:text-white transition duration-300"
              >
                Login / Register
              </a>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

