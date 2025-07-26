import React, { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";


const bgImages = [
  "bg1.png",
  "bg2.png",
];

const HeroSection = () => {
  const selectedImage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * bgImages.length);
    return `/images/wallpaper/${bgImages[randomIndex]}`;
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex items-center justify-center text-white overflow-hidden bg-deepBlue font-body"
    >
      {/* Background Planet Image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${selectedImage})` }}
      />

      {/* Dim Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/60 to-black/90 z-20" />

      {/* Main Content */}
      <div className="relative z-30 text-center px-6 max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold mb-8 
          text-transparent bg-gradient-to-r from-[#FFAB00] via-[#FF805A] to-[#FFAB00] 
          bg-[length:300%] bg-clip-text animate-gradient-x drop-shadow-[#FFAB00]"
        >
          Welcome to SATCHI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-4 text-textLight text-base sm:text-lg leading-relaxed tracking-wide"
        >
          Join us at the ultimate tech fair! Register now to explore groundbreaking innovations, connect with industry leaders, and secure your spot at this unmissable event.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-10 flex justify-center gap-6 flex-wrap"
        >

          <NavLink
            to="/events"
            className="px-7 py-3 rounded-full text-sm sm:text-base font-semibold tracking-wide 
    backdrop-blur-xl bg-white/10 border border-white/20 text-white 
    hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_10px_#FF805A]
    transition duration-300 cursor-pointer"
          >
            Events
          </NavLink>


          <NavLink
            to="/login"
            className="px-7 py-3 rounded-full text-sm sm:text-base font-semibold tracking-wide 
              text-accent border border-accent bg-white/5 backdrop-blur-lg 
              hover:bg-accent hover:text-deepBlue hover:scale-105 
              hover:shadow-[0_0_20px_#FF805A] transition duration-300"
          >
            Login
          </NavLink>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
