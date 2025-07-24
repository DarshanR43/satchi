import React from "react";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedinIn, FaInstagram, FaArrowUp } from "react-icons/fa";
import { animateScroll as scroll } from "react-scroll";

const Footer = () => {
  return (
    <footer className="relative w-full bg-white/5 backdrop-blur-xl border-t border-white/15 text-white rounded-t-3xl shadow-[0_0_40px_rgba(0,209,255,0.08)]">
      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-sm">
        {/* Address */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-accent">Amrita Vishwa Vidyapeetham</h4>
          <p className="text-textLight leading-relaxed">
            Amrita Nagar, Ettimadai, <br />
            Coimbatore, Tamil Nadu - 641112
          </p>
          {/* <p className="mt-4">
            <span className="text-accent">Phone:</span> +91-8807042760 <br />
            <span className="text-accent">Email:</span> contact@acceleron.space
          </p> */}
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-accent">Quick Links</h4>
          <ul className="space-y-2 text-textLight">
            <li><a href="#hero" className="hover:text-accent">Home</a></li>
            <li><a href="#about" className="hover:text-accent">Rules</a></li>
            {/* <li><a href="#services" className="hover:text-accent">Services</a></li> */}
            <li><a href="#contact" className="hover:text-accent">Register</a></li>
          </ul>
        </div>

        {/* Services */}
          {/* <div>
            <h4 className="text-lg font-semibold mb-4 text-accent">Services</h4>
            <ul className="space-y-2 text-textLight">
              <li>
                <Link to="/one-month-internship" className="hover:text-accent">1 Month Internships</Link>
              </li>
              <li>
                <Link to="/three-six-months-internship" className="hover:text-accent">3-6 Month Internships</Link>
              </li>
              <li>
                <Link to="/research" className="hover:text-accent">Research</Link>
              </li>
              <li>
                <Link to="/publications" className="hover:text-accent">Publications</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent">Consulting</Link>
              </li>
            </ul>
          </div> */}

        {/* <div>
          <h4 className="text-lg font-semibold mb-4 text-accent">Subscribe</h4>
          <p className="text-textLight mb-3">Join our newsletter for space updates.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Your email"
              className="px-4 py-2 bg-black/30 border border-white/10 rounded-md text-sm text-white focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-deepBlue rounded-md font-semibold hover:shadow-[0_0_12px_#00D1FF]"
            >
              Subscribe
            </button>
          </form>
        </div> */}
      </div>

      {/* Scroll To Top */}
      <button
        onClick={() => scroll.scrollToTop({ duration: 600, smooth: true })}
        className="absolute bottom-5 right-5 p-3 rounded-full bg-accent text-deepBlue shadow hover:shadow-[0_0_20px_#FF805A] transition"
        aria-label="Scroll to top"
      >
        <FaArrowUp />
      </button>

      <div className="w-full flex flex-col items-center justify-center px-6 pb-8">
        <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-full px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white transition hover:shadow-[0_0_16px_rgba(0,209,255,0.15)]">
          <span className="font-medium text-center whitespace-nowrap">
            Made by <span className="text-accent">Darshan, Shantharam</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
