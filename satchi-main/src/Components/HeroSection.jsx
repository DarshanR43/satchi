import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const HeroSection = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section
      id="hero"
      className="relative items-center justify-center min-h-screen w-full flex bg-white overflow-hidden px-8"
    >
      {/* Blurred Gradient Background Blob */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-[600px] h-[600px] bg-gradient-to-r from-[#df9400] via-[#ff6a3c] to-pink-500 rounded-full blur-[140px]" />
      </motion.div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl sm:text-4xl md:text-7xl font-bold mb-8 text-transparent bg-gradient-to-r from-[#df9400] to-[#ff6a3c] bg-clip-text"
        >
          Welcome to GYAN
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-4 text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
        >
          Join us at the ultimate tech fair! Register now to explore groundbreaking innovations, connect with industry leaders, and secure your spot at this unmissable event.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-12 flex justify-center items-center gap-6 flex-wrap"
        >
          <motion.a
              href="/events"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-full text-base font-semibold 
              bg-gray-900 text-white
              transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
            >
              Explore Events
            </motion.a>
          
            {isAuthenticated ? (
              <motion.a
                href="/profile"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full text-base font-semibold 
                bg-transparent border border-gray-300 text-gray-700
                hover:bg-gray-200 hover:border-gray-400 transition duration-300"
              >
                View Profile
              </motion.a>
            ) : (
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full text-base font-semibold 
                bg-transparent border border-gray-300 text-gray-700
                hover:bg-gray-100 hover:border-gray-400 transition duration-300"
              >
                Login / Register
              </motion.a>
            )}
        </motion.div>
      </div>

      {/* Huge Background Text */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10rem] font-bold text-gray-200 select-none"
      >
        GYAN
      </motion.h1>
    </section>
  );
};

export default HeroSection;
