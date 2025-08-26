import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  FaGlobe,
  FaBookOpen,
  FaUserAstronaut,
  FaRocket,
} from "react-icons/fa";

const statsData = [
  { icon: <FaGlobe />, label: "Participants", value: 235, suffix: "+" },
  { icon: <FaBookOpen />, label: "Teams", value: 135, suffix: "+" },
  { icon: <FaUserAstronaut />, label: "Projects Submitted", value: 154, suffix: "+" },
  { icon: <FaRocket />, label: "Events", value: 129, suffix: "+" },
];

// Count-up hook with optional trigger
const useCountUp = (endValue, shouldAnimate, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;

    let current = 0;
    const stepTime = Math.max(Math.floor(duration / endValue), 30);

    const increment = () => {
      current += 1;
      setCount(current);
      if (current < endValue) {
        setTimeout(increment, stepTime);
      }
    };

    increment();
  }, [shouldAnimate, endValue]);

  return count;
};

const StatsBanner = () => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random(),
      flicker: Math.random() * 0.03 + 0.01,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        star.opacity += star.flicker;
        if (star.opacity >= 1 || star.opacity <= 0) {
          star.flicker = -star.flicker;
        }
        ctx.beginPath();
        ctx.globalAlpha = star.opacity;
        ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#00D1FF";
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random(),
        flicker: Math.random() * 0.03 + 0.01,
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section className="relative max-w-[100%] mx-auto py-20 px-6 bg-black text-white overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 opacity-20 pointer-events-none"
      />

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 text-white text-center max-w-[80%] mx-auto">
        {statsData.map((stat, index) => {
          const ref = useRef();
          const isInView = useInView(ref, { once: true, margin: "-100px" });
          const count = useCountUp(stat.value, isInView);

          return (
            <motion.div
              key={index}
              ref={ref}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-md p-6 rounded-2xl shadow-[0_0_30px_rgba(0,209,255,0.1)] hover:scale-[1.03] transition duration-300"
            >
              <div className="text-3xl text-accent mb-4">{stat.icon}</div>
              <h3 className="text-4xl font-heading font-bold text-transparent bg-gradient-to-r from-[#FF805A] via-[#FFAB00] to-[#FF805A] bg-[length:200%] bg-clip-text animate-gradient-x drop-shadow-[0_0_12px_rgba(0,200,255,0.5)]">
                {count.toLocaleString()}
                {stat.suffix}
              </h3>
              <p className="text-textLight text-sm mt-2 tracking-wide font-body">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default StatsBanner;
