import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const AboutUsSection = () => {

  return (
    <section
      id="about"
      className="relative max-w-[100%] mx-auto py-24 px-6 text-white overflow-hidden bg-black"
    >
      {/* Overlay Content */}
      <div className="relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-heading font-bold mb-10 bg-gradient-to-r from-accent via-vibrant to-accent bg-clip-text text-transparent animate-gradient-x drop-shadow-[0_0_12px_rgba(0,209,255,0.5)] text-center"
        >
          About Us
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="sm:text-lg leading-relaxed text-textLight p-6 max-w-[80%] text-center mx-auto"
        >
          The Anokha Tech Fair is a vibrant and highly anticipated exhibition held as a core part of Anokha, the annual national-level technical festival of Amrita Vishwa Vidyapeetham, Coimbatore campus. Designed to be a melting pot of innovation, creativity, and technological prowess, the Tech Fair provides an unparalleled platform for students to showcase their groundbreaking projects, research, and technical solutions.
          <br /><br />
         The Anokha Tech Fair embodies Amrita Vishwa Vidyapeetham's commitment to nurturing problem-solving skills, promoting hands-on learning, and inspiring the next generation of engineers, scientists, and technologists to "Dare to be Different." It's more than just an exhibition; it's a celebration of technical ingenuity and a glimpse into the future of technology as envisioned by bright young minds.
         </motion.p>
      </div>
    </section>
  );
};

export default AboutUsSection;
