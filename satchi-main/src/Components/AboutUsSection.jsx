import React from "react";
import { motion } from "framer-motion";
import { Users, Zap, Lightbulb } from 'lucide-react';

const useAnimatedCounter = (target, duration = 2) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = parseInt(target);
    if (start === end) return;

    const totalSteps = duration * 60;
    const increment = Math.max(1, Math.floor(end / totalSteps));
    const incrementTime = (duration * 1000) / (end / increment);


    let timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(String(end));
        clearInterval(timer);
      } else {
        setCount(String(start));
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};


const StatCard = ({ icon, value, label, duration }) => {
    const animatedValue = useAnimatedCounter(value, duration);
    return (
        <motion.div 
            className="flex flex-col items-center text-center p-6 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-[#fef5e4ff] to-white opacity-75 backdrop-blur-sm rounded-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
        >
            {icon}
            <p className="text-4xl font-bold text-gray-900 mt-4">{animatedValue}+</p>
            <p className="text-sm text-gray-500 mt-2">{label}</p>
        </motion.div>
    );
};


const AboutUsSection = () => {
  return (
    <section id="about" className="relative w-full mx-auto py-24 px-6 text-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-white z-0"></div>
        <div 
            className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0"
            style={{
            maskImage: 'radial-gradient(ellipse at center, transparent 20%, black)'
            }}
        ></div>

        <div className="relative z-10 max-w-7xl mx-auto">
             <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl font-heading font-bold mb-16 text-center"
            >
                <span className="bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent">
                    About Anokha TechFest
                </span>
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                     initial={{ opacity: 0, x: -30 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.8, delay: 0.2 }}
                     viewport={{ once: true }}
                >
                    <div className="bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-[#fef5e4ff] rounded-2xl p-8 backdrop-blur-lg">
                        <p className="text-lg leading-relaxed text-gray-600">
                            The Anokha Tech Fair is a vibrant and highly anticipated exhibition, a core part of Anokha, the national-level technical festival of Amrita Vishwa Vidyapeetham, Coimbatore. It's a melting pot of innovation, creativity, and technological prowess.
                        </p>
                        <br />
                        <p className="text-lg leading-relaxed text-gray-600">
                           Embodying our commitment to hands-on learning, we inspire the next generation to "Dare to be Different." Anokha is more than an exhibition; it's a celebration of technical ingenuity and a glimpse into the future, envisioned by the brightest young minds.
                        </p>
                         {/* <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(255, 106, 60, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-8 px-8 py-3 bg-[#ff6a3c] text-white font-semibold rounded-lg shadow-lg shadow-orange-500/30 transition-all duration-300"
                        >
                            Discover More
                        </motion.button> */}
                    </div>
                </motion.div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <StatCard icon={<Zap size={36} className="text-[#df9400]"/>} value="150" label="Projects Showcased" duration="2" />
                   <StatCard icon={<Users size={36} className="text-[#df9400]"/>} value="20000" label="Footfall" duration="3" />
                   <StatCard icon={<Lightbulb size={36} className="text-[#df9400]"/>} value="100" label="Innovative Ideas" duration="2.5" />
                   <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#df9400]"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>} value="50" label="Colleges Participating" duration="2" />
                </div>
            </div>
        </div>
    </section>
  );
};

export default AboutUsSection;

